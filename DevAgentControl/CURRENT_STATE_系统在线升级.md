# CURRENT_STATE_系统在线升级（dev 联调完成，待用户验收）

> 状态：**T1-T5 实施完成 + dev 联调完成 + 检测源 Gitee 优先改造完成（2026-11-22）**。剩余：release 包 monitor 阶段全流程（T6 后半，需用户环境）；可选：dev 网络好时补一次完整 1.4GB 下载
> 设计文档：`devDocs/系统在线升级方案.md`（含 §2.3 检测源裁定：Gitee 优先 + GitHub 兜底，下载固定 GitHub）

## 增量改造 5：门禁简化为仅 deployType 标记（2026-11-22 晚，用户二次裁定；**未提交，待用户确认**）

用户裁定：只依赖 `docSys.ini/deployType=setup` 标记即可。**已删除** pid 存活检测（isMonitorProcessAlive/isPidProcessAlive/tasklist/kill -0）、30 秒缓存、`upgradeAllowNoMonitor` 逃生门（dev 的配置行也已删——无标记天然可用）；`getUpgradeUnsupportedReason()` 只剩读 deployType 文件一条路。三层门禁结构不变（首页隐藏/后台禁用+原因/接口硬拒）。

放弃 pid 检测的理由（已写入方案文档 §4.5）：**包脚本/monitor 不随 war 升级更新**（docsys_upgrade 只替换 webapps），存量升级后跑老包 monitor（是否写 pid 不可考，`WebRoot/web/sales` 被 gitignore 仓库外维护），pid 误判会把主流网页升级路径永久锁死；标记零误伤。

- dev 实测：① 无标记无配置 → 按键恢复、检测正常（不再需要逃生门）② 写 deployType=setup → 三接口拒绝（安装包文案）+ 首页隐藏 + 管理后台按钮灰红字 ③ 删标记 → 恢复。测试标记已清理。
- ⚠️ `842d148ef`（混合方案）已提交；本次简化在工作区未提交，用户确认后自行提交（2026-11-22 用户指示：不要代为 commit）。
- 安装器侧要求（实现标记写入时注意）：只有确认无 monitor 的安装器变体才写 setup——**Mac 控制台设计带 monitor 看门狗，Mac 安装器不应写**；Windows 安装器应写。

## 增量改造 4：升级能力判定 monitor 门禁（2026-11-22 晚，用户裁定；**已被改造 5 简化取代**）

背景：安装器部署无 monitor 看门狗，upgrade.trigger 无人消费会把系统卡死在"系统升级中"并锁死后续升级。用户裁定方案 = **"B 的体验 + A 的时机"合体**（入口禁用 + 请求时检测非启动打标），**不考虑老版本兼容**（存量用户手动升级为主）。

- **判定顺序**（30s 缓存，`getUpgradeUnsupportedReason()`）：① `docSysConfig.properties` 的 `upgradeAllowNoMonitor=true` 强制放行（dev 逃生门，优先级最高）→ ② `docSys.ini/deployType=setup`（新安装器写入）→ 禁用"安装包部署…" → ③ `<包根>/tmp/monitor.pid` 存在且进程存活 → 放行 → ④ 其余 → 禁用"未检测到monitor进程…"。包根 = webappsPath 上两级；进程存活：Win tasklist /FI（找不到输出 INFO 且退出码 0，按输出判）/ Unix kill -0，3s 超时。
- **三层门禁**：checkSystemUpgrade 早退返回 `upgradeSupported:false + upgradeDisabledReason`（不烧 Gitee/GitHub 配额）→ 首页按键隐藏（onlineUpgrade.js checkVersion 前置分支）；管理后台 systemUpgrade 页渲染后回调 `bindSystemUpgradeSupportCheck` 禁用"系统升级"按钮 + 红字原因（防 1.4GB 上传完才被拒）；onlineUpgrade/upgradeSystem 认证后第一步硬拒（upgradeSystem 的 monitor 门禁在文件名校验**之前**——部署级拒绝先于请求级校验）。
- **dev 实测六场景全过**：① 无配置无 pid → 三接口拒绝+按键隐藏+管理后台按钮灰+红字原因（截图核对）② monitor.pid 写活 pid → 按键恢复 ③ 死 pid → 禁用（缓存过期后刷新页面隐藏）④ deployType=setup → 安装包专属文案 ⑤ 配置逃生门 → 强制放行（优先级高于 deployType）⑥ 撤/恢复配置 → 管理后台按钮随 30s 缓存联动。
- **dev 常态**：`docSys.ini/docSysConfig.properties` 已留 `upgradeAllowNoMonitor=true`（注释标明生产不要配）；version 仍 2.02.90（用户测试用）。⚠️ 若管理后台"保存系统设置"会重写该 properties 文件，此 key 可能丢失，丢了重新加即可。
- **遗留**：安装器构建工程需在安装时写 `deployType=setup`（否则走通用提示，功能等价）；manager"重启服务"（restart.trigger 同依赖 monitor）未纳入本期，可同机制扩展；onlineUpgrade.js bump v=202611225；manager main.js/main.html 无 ?v= 机制（部署后需硬刷新，历史已知）。

## 增量改造 3：悬停面板可细读可跳转（2026-11-22 傍晚，用户裁定）

- 原生 title 换成**自定义悬停面板**：悬停"升级"按键弹出（右对齐按键下方、420px 卡片、站点风格）；**鼠标移入面板不收起**（250ms 延时收起 + 移入取消，可细读长说明，内容超 60vh 内部滚动）；离开按键与面板都收起；**点击面板打开对应 release 页面**（新窗口）。
- release 页面地址由后端返回 `releasePage`：Gitee 源 = `gitee.com/RainyGao/DocSys/releases/tag/<tag>`，GitHub 兜底源 = github 对应 tag 页（tag 原文带 V，URLEncoder 编码）。
- 面板结构与样式由 onlineUpgrade.js 注入（不改宿主 HTML）；桌面按键不再挂原生 title（避免双提示），mobile 链接保留 title；面板正文用 .text() 填充防注入；页脚"点击查看完整发布信息"。
- 实测：悬停显示/移入保持/移出 250ms 收起全过；右对齐精确（面板右缘=按键右缘）；点击实际打开 `gitee.com/RainyGao/DocSys/releases/tag/DocSys_V2.02.91` ✓；内容超高滚动 ✓。bump v=202611224。

## 增量改造 2：按键 UI（2026-11-22 傍晚，用户裁定）

- 按键移到**导航栏最右侧（语言切换右侧）**（ch/en 两页；mobile 下拉保持原位）；文字只显示"升级"（不带版本号）；样式改为**带外框胶囊按钮**（站点绿 #2ABB9B 外框、hover 填充白字；升级中态琥珀色边框禁点）；CSS 内联在两 html（.online-upgrade-btn）。
- **悬停 title 显示新版本 release 信息**：`版本（发布于 日期）\n\n更新说明`——后端 checkSystemUpgrade 两路拉取均带出 release 正文与 created_at（缓存 10 分钟一并缓存），`stripReleaseNotes` 清洗（截掉"软件下载"节、markdown 链接只留文字、限长 600）；取不到说明时只显示版本号。
- 实测（Gitee 源）：title = "2.02.91（发布于 2026-11-18）\n\n一、新增功能…"（微云/GitHub 下载链接已剥离）✅；截图确认按键位置/外框/对齐 ✅；en 页结构核对 ✅。onlineUpgrade.js bump v=202611223。
- 设计文档 §5 已同步。

## 增量改造（2026-11-22 下午，用户裁定"版本信息先查Gitee再查Github"）

背景：用户发布流程为 Gitee 先行、war 稍后传 GitHub；GitHub 国内经常整体不通，检测依赖 GitHub 会导致"发了新版用户看不到按键"。

- **checkSystemUpgrade.do**：先 Gitee（`gitee.com/api/v5/repos/RainyGao/DocSys/releases`，非 prerelease、tag 剥前缀取版本号；Gitee **无 draft 字段**、无 war 资产）→ 成功即用且**完全不碰 GitHub API**（省匿名配额）；Gitee 不可用再 GitHub 兜底（含 war 资产信息）。返回新增 `source`；`downloadSize` 仅 GitHub 源有。两路独立静态缓存（10min 成功/2min 失败）。都挂时报"无法访问Gitee/GitHub"（限流单独文案）。
- **onlineUpgrade.do**：下载源固定 GitHub（war 只在 GitHub）。GitHub war 版本 <= 本地时细分：Gitee 目标 > 本地 → "新版本 x.y.z 的安装包尚未同步到GitHub，请稍后再试"（Gitee 先行/1.4GB 上传中的窗口）；否则"当前已是最新版本"。task 初始 info 带实际下载版本号。
- **前端**：确认框大小片段条件显示（Gitee 源无 size 不显示"（大小 ）"空壳），lang 新增 sizePart；onlineUpgrade.js bump v=202611222。
- **实测（恰逢 GitHub 全断 + Gitee 通的真实场景）**：检测走 Gitee → 按键显示"升级(2.02.91)"（source=gitee、无 size）✅；确认框无空大小片段 ✅；点击升级 → "无法访问GitHub（检查网络或代理）" + 按键保持可重试 ✅。未真机覆盖分支：Gitee 断/GitHub 通兜底（代码与改造前 GitHub 路径相同，昨日已验）、"尚未同步到GitHub"提示（逻辑简单，待真实发版窗口或下次联调补测）。
- 网络：Gitee API 本机直连可用；GitHub 当日整体不通（Clash fake-ip 劫持 DNS，节点到 GitHub 挂）。

## 实施内容（首轮，commit 3e3517852）

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
