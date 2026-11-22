# CURRENT_STATE_系统在线升级（dev 联调完成，待用户验收）

> 状态：**T1-T5 实施完成 + dev 联调完成（2026-11-22 单 session：开工→实现→联调→提交）**。剩余：release 包 monitor 阶段全流程（T6 后半，需用户环境）；可选：dev 网络好时补一次完整 1.4GB 下载（见下）
> 设计文档：`devDocs/系统在线升级方案.md`（头部已标实施纠偏：tag 带 V 前缀、war 实际 1.4GB）

## 实施内容（commit 见下方）

- **T1**：`executeWarUpgrade(String warName, LongTermTask task)` 抽取自 upgradeSystem.do 执行段（逐行一致，仅日志前缀换名）；**upgradeSystem.do 也加了防重入门禁**（方案 4.3 只写 onlineUpgrade 侧，#8 要双向互斥）。
- **T2**：`checkSystemUpgrade.do`（超管）：GitHub Releases API（per_page=5、Accept vnd.github+json、UA 必带）→ 非 draft + 含 DocSystem.war 资产（回退 DocSystem-C.war）+ tag 剥 `DocSys_`/`V` 后可解析 → 与本地 version 按 getVersionFromFile 同款编码比较；静态缓存成功/none 10 分钟、失败 2 分钟；403/429 单独提示"GitHub API 限流（匿名 60 次/小时）"。
- **T3**：`onlineUpgrade.do`（超管）：门禁 + 版本判定 + 创建任务整体 `synchronized(upgradeGateLock)`（与 upload 入口互斥，防并发双开）→ LongTermTask(type=onlineUpgrade) 立即回 taskId → 后台线程 `downloadAndExecuteUpgrade`：流式下载 `DocSystem.war.downloading`（64KB 缓冲、每秒 task.info、循环查 stopFlag、connect 30s/read 60s）→ `checkFileSizeAndCheckSum`（资产 size）→ 改名 → `executeWarUpgrade`；外层 try/catch 兜底 -1。
- **T4**：`getUpgradeTask.do`（超管）：`findRunningUpgradeTask()`（event ∈ {upgradeSystem, onlineUpgrade} 且 **status != -1**，200 也算升级中——防 trigger 被 monitor 消费但未重启窗口放行二次升级）→ phase=prepare（带 taskId/status/info）；否则 trigger 存在 → phase=monitor；否则 false。
- **T5**：`WebRoot/web/onlineUpgrade.js` + `OnlineUpgradeLang` 双语言内联对象（ch/en）；index/index_en navbar（enterSystemLink 与 languageDiv 间）+ mobile 下拉各一 li；index.js pageInit 一行 `OnlineUpgradeEntry(user)`。三态/确认框（`<br>`+加粗重启提示）/pollTask(3s→10s)→200 转 pollState(10s)；接口失败按升级中保持；js 带 `?v=`。

## dev 验证结果（8100，全部真实浏览器/文件系统核对）

| 项 | 结果 |
|---|---|
| 编译 | javac（-encoding UTF-8 -parameters -g -implicit:none）退出码 0 ×3 |
| #1 未登录门禁 | 三接口 `NOT_LOGIN`（curl 需带 `X-Requested-With` 过 MyInterceptor）✅ |
| #2 已是最新版 | GitHub 最新带 war release = V2.02.91 == 本地 → hasNewVersion:false、按键不显示 ✅（终态复验过：version 恢复后按键消失）|
| #3 有新版 | 部署树 version 临时降 2.02.90 → 按键"升级(2.02.91)"（1334MB）+ 确认框（版本/1.30GB/自动重启加粗）✅ |
| #4 三路判定+跨刷新 | prepare（带 taskId/status/info）/ monitor（仅 trigger）/ false 三态全过；**下载中刷新页面恢复"系统升级中..."且 title 实时显示"正在下载升级包 8.0MB/1333.6MB"**；结束后 10s 内按键消失 ✅ |
| #7 下载中取消 | stopLongTermTask → 任务 -1（连接阶段不查 flag，连接建立后首个读循环即终止）→ `.downloading` 清理、无 trigger、按键恢复"升级(2.02.91)" ✅（失败清理路径同段代码）|
| #8 双向防重入 | 任务 200 在内存期间：onlineUpgrade 与 upgradeSystem 均"系统升级中，请勿重复发起" ✅ |
| #9 上传升级回归（T1 重构后） | upgradeSystem.do(合成 war) → status=200"准备工作已完成"；trigger 创建 + DocSystem/ 规整 + war 删除 + tmp 清理 全核对 ✅ |
| 限流路径 | 403 → "GitHub API 限流（匿名 60 次/小时），请稍后再试"；前端静默隐藏 ✅ |
| 英文页 | index_en 4 标记齐全 + onlineUpgrade.js 200 ✅ |
| **#10 在线路径到 200** | **未在 dev 走完**：war 1.4GB，本机直连 GitHub 0.17~0.24MB/s、走本机 Clash 代理反而 0.06MB/s（5h+），会话内不可能完成。已验证：下载启动/流式/进度/取消清理/门禁/跨刷新全链；未验证段仅"下载完成→大小校验→改名→executeWarUpgrade 交接"（≈10 行，其中 checkFileSizeAndCheckSum 与 executeWarUpgrade 均已被 #9 上传路径实测）|
| #5/#6 | #6 失败清理已被 #7 同段覆盖；#5（monitor 重启后版本更新）属 release 包流程，留待用户 |

## 环境已还原

- 部署树 version 已恢复 2.02.91（备份文件已删）；无 trigger/无 DocSystem 目录/无 .downloading 残留；Tomcat 已无代理参数重启；/tmp/start_with_proxy.bat 已删。
- upgrade/ 里 Nov21 遗留的 201 个 war_N 分片（403MB，上次上传中断产物，非本次产生）保留未动。

## 网络/代理速记（下次 dev 测在线升级用）

- dev 直连 GitHub：API 可达（60 次/h/IP，本机高频超限），下载 ~0.2MB/s；本机 Clash(127.0.0.1:7897)：**对 api.github.com 规则直连（与直连共享配额）**，下载经隧道实测反而 0.06MB/s——1.4GB war 在本机两种方式都是小时级。
- JVM 临时代理：`JAVA_OPTS=-Dhttp(s).proxyHost=127.0.0.1 -Dhttp(s).proxyPort=7897`（临时 bat 包 docsys_restart.bat；**nonProxyHosts 含 `|` 会破坏 catalina.bat，不可用**）。
- dev 首管 Admin/Admin；部署树 classes/web 与源码树两份拷贝，改完必须 cp + 重启。

## 剩余事项

1. **release 包全流程（T6 后半，用户环境）**：monitor 消费 trigger → 替换 webapps → 重启 → 按键消失 + 版本更新（#5）。
2. 可选：网络好时（或用真 release 环境）补一次在线路径完整下载到 200 的实测。
3. 用户裁定项：upgradeSystem.do 新增的 4 行防重入门禁是否保留（#8 双向互斥需要，默认保留）。
4. 可选后续（本期不做，方案 4.5）：升级源/镜像可配置（GitHub 国内可达性）、Gitee 检测备用源、断点续传。

## 实施口径速记

- javac：`"C:/Program Files/Java/jdk1.8.0_162/bin/javac" -encoding UTF-8 -parameters -g -implicit:none -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes <改动文件>`
- 前端 js 引用带 `?v=`（index.js→20261122、onlineUpgrade.js→202611221）
