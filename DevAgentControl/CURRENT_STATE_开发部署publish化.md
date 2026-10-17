# CURRENT_STATE_开发部署publish化（工作卡）

> 状态：**脚本已交付并测试通过（已简化为唯一方案、init 不带运行期产物）；本机迁移未执行**（等停服窗口，见「下一步」）
> 关联：`DevAgentControl/已完成/CURRENT_STATE_war打包.md`（war 排除清单）、`devDocs/本地开发Tomcat部署与启动指南.md`（第 2 节）

## 2026-10-17 第三轮：init 不带运行期产物 + 删变更记录（用户裁定）

1. **`/init` 与 publish 用同一套排除清单**（原先 init 会带上工作区里现存的字体库/tmp/缓存）。用户理由：以后运行产物不会再进代码空间，工作区本就不该有它们，**全新的部署副本才是正确行为**。实测体量：1,543 MB / 39,860 文件（约 2-3 分钟）；字体库在目标机首次用 Office 编辑器时自动重建（10-30 分钟，或管理后台"重置字体库"）。实现：`XF_INIT` 删除、`XD/XF` 在参数解析后统一定义（两种模式共用），仅剩差异是 `/E`（init 增量补齐、不删除）vs `/MIR`（publish 镜像）。
   - ⚠️ 过程中抓到一个自伤 bug：把 `set XD=...` 从 robocopy 分支挪走后忘了在公共位置定义 → `/XD !XD!` 展开为空、**目录排除全部失效**（迷你测试抓到：fonts/tmp/devmat 被拷入）。已修（`XD=%XD_DEV% %XD_RUNTIME%` 在 argsdone 统一定义）并回归通过。
2. **指南删除「7. 变更记录」整节**（用户裁定：不需要记录在文档里）。文档现在到第 6 节结束。

## 2026-10-17 第二轮：简化为唯一方案（用户裁定）

用户裁定**不再考虑 junction 直接映射**，只保留复制部署 + 增量 Publish：
- `PublishDev.bat` 移除 `/replace-junction` 与整个联接移除子系统（解析 dir 输出/校验指向/rmdir），只保留 4 行拒绝守卫：目标是联接 → 报错「stop Tomcat, rmdir the link, run /init」。脚本从 338 行减到 296 行。
- 指南删除方式 A/B，第 2 节重写为「2.1 初始化 + 2.2 日常发布」；旧联接一次性移除 = 手工 `rmdir`（2.1 有一行说明）；第 1/3/4/5/6 节的「方式 A/B/C」引用全部清理；变更记录注明旧迁移命令（`/init /replace-junction`）已失效。
- 迷你 webapp 回归：init / publish（XO 保护 + MIR 删除）/ audit / 联接拒绝 全过。
- **迁移命令相应更新**（见「下一步」）：停服 → 手工 rmdir 联接 → `/init`。

## 需求（2026-10-17，用户提出）

用户意识到无法避免用 Eclipse 开发+导出 war，而 Eclipse 的部署模型是 **publish**（运行的是副本、改动拷进运行空间），不像我们 dev Tomcat 用 junction 直连代码目录 —— 导致运行期生成物全部污染代码空间（字体库 773 MB、`tmp\0\docsys.lic`、`sdk-all.cache`×3、被应用改写的 `docSysConfig.properties`，office-editor 子模块 git status 27 项脏）。要求参考 Eclipse：`webapps\DocSystem` 改为拷贝的真实目录 + 类 publish 的增量同步。

## 交付物（2026-10-17）

1. **`Docs/scripts/PublishDev.bat`**（本轮新增，已测）：
   - `/init` 全量初始化：目标须为「不存在/空目录/已有 webapp」；`/replace-junction` 可先移除旧联接（**校验联接指向 = WebRoot 才删**，`rmdir` 只删联接本身）；**带上现有字体库**（首启无需 10-30 分钟重建）；写 `DEPLOYED-BY-PUBLISH.txt` 标记。
   - 无参 = 增量 publish：`robocopy /MIR /XO`——拷有变化的文件、删工作区已删的文件（防旧 class 残留）、**运行期产物永不触碰**（`/XD`：`office-editor\fonts`、`tmp`、`uploads`；`/XF`：两个 `AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`、`sdk-all.cache`、marker）、**运行空间较新的文件不被覆盖**（`/XO` 保护被应用改写的 `WEB-INF\classes\docSysConfig.properties`）。
   - `/r` 发布后调 `docsys_restart.bat`；`/dry` 只列；`/audit` 列运行空间里"清单外"未知文件（匹配 robocopy `*多余文件`/*EXTRA 行——注意 `/NC` 会把标签一起去掉、行首有缩进不能 `/B`，两坑都已处理）；`/force` 去掉 `/XO`；`/p` 暂停。
   - 守卫：目标是联接/符号链接（`fsutil reparsepoint query` rc=0 判定，已验证 junction=0/普通目录=1/不存在=1）→ publish 与不带 flag 的 /init 都拒绝；缺 marker → publish 拒绝；源无 `WEB-INF\web.xml` → 拒绝。
   - 复用 war 脚本一族的 cmd 加固模式：`SCRIPT_DIR/SCRIPT_NAME` 先存（shift 会移动 %0）、参数去引号副本（带空格路径）、`if not defined A` 判空。纯 ASCII、CRLF。
2. **`Docs/scripts/README.md`**：文件表加 PublishDev 行 + 用法段；「排除清单三份副本」注意事项改为「war 三份 + PublishDev 运行期清单语义相反别混」。
3. **`devDocs/本地开发Tomcat部署与启动指南.md`**：方式 C（推荐，含迁移/清理/日常/回滚），方式 A 降为回滚路径，5.1/5.2 日常流程改 publish 制，变更记录 2026-10-17。
4. **`sdk-all.cache` 加入 war 排除清单**（BuildWar `/XF`+3 处自检、CleanWar.ps1 新 category「editor cache」、CleanOfficeFonts 计数+删除）：`BuildWar /verify` 回归通过——39,859 文件（恰好多排 3 个 cache）、禁用 0；CleanOfficeFonts 假发布树回归通过。

## 测试（迷你 webapp，全部通过）

init 语义（运行期产物带入、`office\{docs,devDocs,test}`/`*.java`/`.git` 不带、marker 写入）；publish 语义（改动拷入、工作区已删文件被删、`/XO` 保住运行期较新的 docSysConfig、排除项全保留、marker 保留）；`/audit` 能列出未知 dst 文件；`/force` 覆盖较新；联接三连（publish 拒绝 / init 无 flag 拒绝 / `/init /replace-junction` 正确移除并初始化、源无损）；无 marker 拒绝；对真实 dev 联接 `/dry` 也拒绝。性能：全量扫描 5.4 s / 空转 0.7 s。

## 踩坑

- robocopy `/NC`（no class）会把「新文件/*多余文件」标签一并去掉 → `/audit` 匹配不到；去掉 `/NC`。
- 多余文件行**行首有缩进**，`findstr /B "*"` 匹配不上，去掉 `/B`（文件名不可能含 `*`，安全）。
- bat if 块内的 `echo ... (additive copy...)` 未转义括号 → 「此时不应有 .」解析错误（整块 parse 时爆），块内 echo 一律不用裸括号。

## 2026-10-17 第六轮：Office 三类文件编辑器实测 ✅（用户要求浏览器回归测试）

前一轮 Office 编辑器是禁用态，本轮在管理后台「Office编辑器 → 启用」打开后回仓库实测：

| 文件 | 结果 |
| --- | --- |
| `MxsDoc产品介绍.docx`（Word） | ✓ 弹出式编辑器完整渲染：菜单（文件/主页/插入/布局/引用/协作）、正文两页、状态栏（第1页共2页/100%） |
| `JS调用测试.xlsx`（Excel） | ✓ 表格编辑器：功能区（主页/公式/数据/数据透视表…）、名称框 D13、Sheet1、单元格内容、右侧格式面板 |
| `MxsDoc产品介绍.pptx`（Slide） | ✓ 演示编辑器：菜单（主页/过渡/动画/幻灯片放映…）、左侧幻灯片缩略图、母版文本 |

每类都截图留证（视觉模型复核过工具栏与内容）。**启用状态没写任何配置文件**（三份 `docSysConfig.properties` 的 `isOnlyOfficeUsed` 都还是 0 ⇒ 存在 DB/系统状态里），工作区自然零改动；工作区终检 fonts/tmp 无、office-editor 与主仓库 git 干净（除工作卡自身）。

**本轮操作备注**：① 管理后台启用 Office 是**保留状态**（要关：后台同一按钮已变「禁用」）。② 该后台页 locator 点击全部超时（无遮挡层、无 JS 弹窗、force 无效），用 `evaluate` 程序化 `element.click()` 一路通畅——IAB 的 actionability 判定问题，非页面故障。③ 仓库页双击文件用 evaluate 派发 `dblclick` 事件。

## 2026-10-17 第五轮：浏览器端到端测试 ✅

用 ZCode 内置浏览器实测（In-app Browser）：

1. `/DocSystem/` →「系统初始化中」→ 自动跳 `web/index.html`（首页-MxsDoc，V2.02.88）✓
2. Admin/Admin 登录成功 ✓。
3. `projects.html`：22 个仓库全部显示，**AI 图标显示正常**（docSys.ini llmConfig 生效）✓。
4. `project.html?vid=1`：文件列表完整（docx/pptx/xlsx/md）✓。
5. 双击 docx → 提示「**Office在线编辑功能已禁用**」——本机既有配置 `isOnlyOfficeUsed=0`（与迁移无关；管理后台 Office 编辑器页有「启用」按钮，要不要开由用户定）。
6. 管理后台 `main.html`：用户列表、系统设置（版本/存储路径）全部正确 ✓。
7. **字体库重建实测（本轮核心验证）**：Office 编辑器设置页「字体库缺失时自动生成=开启」，打开页面即自动触发生成（再点「重置字体库」提示"已有任务正在进行"）；**约 3 分钟完成**（13:45-13:48，远快于 10-30 分钟估计——core-fonts 215 个输入字体 + 本机快）。状态行变「已就绪」，已截图留证。
8. **磁盘核验——新部署模型的核心断言成立**：全部产物落在**部署副本**（`webapps\DocSystem\...\fonts\` 552 文件、两个 `AllFonts.js`、`font_selection.bin`）；**工作区零污染**（无 fonts/tmp，office-editor git status 干净，工作区的 `AllFonts.js` 仍是 12:40 回退时的跟踪版本、未被生成过程触碰）。

## 2026-10-17 第四轮：实际演练完成 ✅（迁移已执行，新部署模型上线）

用户已自行回退 office-editor 生成物（git status 干净，只剩空 fonts 壳 + 漏删的 slide cache + WebRoot/tmp 由本次演练顺手清掉）。演练全程：

1. **停服**：`docsys_stop.bat /q` → 8100 释放、无 java 进程。
2. **摘联接**：确认 `<JUNCTION> DocSystem [D:\Dev\DocSys\WebRoot]` 后 `cmd /c rmdir`（绝不用 rm/rd /s）；前后 WebRoot 均 40,923 文件（后因清理残留 -1），工作区无损。
3. **`/init`**：**49 秒**完成（远快于预估），产出 **39,859 文件 / 1.6 GB**；web.xml+marker ✓、core-fonts 215 ✓（两侧一致；顶层 39 个条目是目录）、fonts/tmp/uploads/AllFonts/sdk-all.cache 0 条 ✓、office{docs,devDocs,test}/.java/.git 0 条 ✓、docSys.ini 原样（llmConfig 在）✓。
   - 清理插曲：`slide/sdk-all.cache` 是 office-editor 仓库**已跟踪**文件（cell/word 是未跟踪的），误删出 `D` 状态 → 已 `git checkout` 恢复保持仓库干净；要不要 `git rm` 由用户日后裁定（publish/war 都按名排除，留着无害）。
4. **启动**：`docsys_restart.bat` → `Server startup in 39287 ms`；`/DocSystem/`、`index.html`、core-fonts、sdkjs 静态资源全 200；`AllFonts.js` 404 = 干净部署的预期（待首用重建）；docSysInit/DB 备份任务正常跑。
5. **运行期写入实证**：启动后应用在部署副本写的唯一持久文件 = `WEB-INF\classes\docSysConfig.properties`（12:54 被改写，diff 仅首行时间戳注释）→ **`/XO` 保护生效**（publish 未覆盖）；工作区全程零污染（fonts/tmp 未复现、office-editor status 干净）。
6. **publish 演练**：1.8 秒；偶发 rc=2 = 删掉一个**146 字秒的瞬时临时文件**（事件驱动、低频，3 分钟密集监视未复现；robocopy 汇总表「其他=1/146字节」证实存在过；服务全程健康、部署文件数稳定 39,859）——判定良性，publish 顺手清理即可；若日后查明具体文件且需保留，加进 `XF_RUNTIME`。
7. **脚本加固**（演练中暴露）：bat 里两处 `find /c /v ""` 在 Git Bash 起的 cmd 里会被 MSYS find 劫持（全盘扫描挂死）→ 改为显式 `"%SystemRoot%\system32\find.exe"`，Git Bash 下 audit 复测通过。

**⚠️ 顺带发现（用户回退的副作用，待裁定）**：office-editor 的 HEAD 停在 2026-06-30（`b673b53c`），10-14 那次「`documentserver-generate-allfonts.{bat,sh}` 去掉 allthemesgen 主题生成」的**有意改动从未提交、这次被连同生成物一起回退掉了**（bat 里 3 处 allthemesgen 调用又回来了）。若仍要该优化需重做；注意该仓库同时是 `onlineInstallOffice.do` 的拉取源。另外 `sdkjs/slide/sdk-all.cache` 被跟踪一事见第 3 条插曲。

## 下一步（等用户选定停服窗口，dev Tomcat 当前 8100 运行中）——已全部执行完毕，留档备查

1. 停服：`cmd /c "C:\TomcatForDocSysDev\docsys\docsys_stop.bat" /q`
2. 手工移除旧联接（只删联接、不动工作区）：`cmd /c rmdir "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem"`
3. `cmd /c "D:\Dev\DocSys\Docs\scripts\PublishDev.bat /init"`（约 2-3 分钟，1.5 GB / 3.99 万文件；**不带字体库**——首次用 Office 编辑器时自动重建 10-30 分钟，或管理后台"System - Reset Font Library"手动触发）
4. 清理工作区生成物（**不要 `git add -A`**，保留 `bin/documentserver-generate-allfonts.{bat,sh}` 有意改动）：
   ```
   cd WebRoot/web/static/office-editor
   git checkout -- sdkjs/common/AllFonts.js "sdkjs/common/Images/fonts_thumbnail*.png" \
     server/FileConverter/bin/AllFonts.js server/FileConverter/bin/font_selection.bin server/FileConverter/bin/fonts.log
   git clean -f fonts sdkjs/cell/sdk-all.cache sdkjs/slide/sdk-all.cache sdkjs/word/sdk-all.cache "sdkjs/common/Images/fonts_thumbnail*.png.bin"
   cd ../..
   rm -rf WebRoot/tmp WebRoot/uploads
   ```
5. 启动 + 验证：`Server startup`、`127.0.0.1:8100/DocSystem/` 200、AI 图标正常（docSys.ini 未动）、Office 编辑器可用（字体库已带）、日志仍在 `tomcat\logs`
6. 用一次 Office 编辑 + 保存一次 AI 设置 → 确认 `WebRoot` 不再出现 `fonts\`/`tmp\`、office-editor 子模块 git status 干净（除两个有意改动）
7. 回滚预案（若 /init 出问题）：停服 → 删部署目录 → 重建联接 `mklink /J ... WebRoot`（旧方式，仅应急）

## 待定 / 未做

- 未做真实 2.35 GB `/init` 演练（用迷你 webapp 全语义测试代替；迁移时如遇问题按回滚预案回方式 A）。
- `/watch` 自动发布（保存即 publish，防抖）列为可选二阶段，先跑顺手动模式。
- Eclipse 侧未配置 External Tools 一键 publish（PublishDev.bat 头部注释未含 Eclipse 配置段；如需要可仿 BuildWar.bat 头部加）。
- `web/sales/.git` 也在 PublishDev 的 `/XD` 里；若 sales 仓库将来有需随包发布的启动脚本改动，publish 会带上（源目录在 webapp 里，正常拷贝），仅 `.git` 元数据不带——无需处理，记录备查。
