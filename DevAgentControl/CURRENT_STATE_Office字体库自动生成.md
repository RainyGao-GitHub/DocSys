# CURRENT_STATE — Office 字体库自动检测与生成（工作卡）

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。**状态：方案已裁定（2026-10-10 用户裁定「D1–D9 按推荐项全部采纳，开工」），实施基本完成，正在做验收实测（V2 生成中 / V4 待复验）。**
> 方案文档：`devDocs/Office字体库自动生成方案.md`（唯一口径来源；§3 裁定项 / §4 开工清单 / §5 验收项 / **§8 实施记录与证据**）。

## 当前任务

Office 字体库（office-editor 的 AllFonts 字体库）在新安装 / 在线升级后必须由管理员手动执行「管理后台 → 系统管理 → Office 编辑器 → **重置字体库**」；管理员忘了，用户就会在 Office 编辑时撞上"字体库不存在"再回头找管理员。目标：改成**自动检测 + 自动生成**。

**两条硬约束（用户明确）**：
1. **不能放回系统启动初始化路径** —— 历史上曾挂在 `docSysInit` 里，失败时甚至导致整个初始化无法完成，影响面更大；
2. 参照「**首次安装创建超级管理员**」那种**由前端发起**、失败也不影响系统本身的模式。

用户 2026-10-10 要求：**先调研 + 出方案，确认后再开工**。

## References

- `devDocs/Office字体库自动生成方案.md` —— 本任务方案（现状事实 §1 / 设计 §2 / 裁定项 §3 / 开工清单 §4 / 验收项 §5）
- `Docs/scripts/CleanOfficeFonts.bat` —— 字体库产物清单的**权威说明**（发布包会删这些：两个 `AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts/`、`fonts_thumbnail*`；**不删**输入 `core-fonts/`）。2026-10-14 起权威副本在**仓库内** `Docs/scripts/`（`Docs` 子模块）；打包脚本同目录 `Docs/scripts/BuildWar.bat`；仓库外 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 已改为指路桩。
- **websocket 仓库**：`BussinessController.java`（`generateOfficeFonts.do:5760`、`onlineInstallOffice.do:5689`、`installOffice.do:6000`）、`OfficeBase.java`（`initOfficeEditorFonts:142`、`isAllFontsReady:257`、`deleteAllFontsFiles:290`、`checkAndGenerateFonts:303`）、`BussinessBase.java:66`（`channel = ChannelFactory.getByChannelName("businessChannel")`）
- **office 仓库**：`office/fontengine/CApplicationFontsWorker.java:284,339`（生成/跳过判定）、`office/FontGenerator/FontGenerator.java:15`、`office/docs/CppToJava常见问题与解决方案.md:639-662`（字体库排查经验）
- **主仓库**：`WebRoot/web/js/OfficeEditorLoader.js:61-96`（Web 端编辑器唯一咽喉 → `POST /Manage/getOfficeEditorConfig.do`）、`WebRoot/manager/main.js:5695-5815`（重置字体库前端流程）、`WebRoot/manager/tmpl/systemOfficeEditor.html:38`、`src/com/DocSystem/controller/ManageController.java:189,1430`、`src/com/DocSystem/controller/BaseController.java:26363`（`createLongTermTask`）、`src/com/DocSystem/common/entity/LongTermTask.java`
- 前序相关（**挂起卡，未获裁定不动**）：`DevAgentControl/CURRENT_STATE_freetype移植.md`、`DevAgentControl/CURRENT_STATE_前端静态资源缓存.md`（浏览器缓存旧 `AllFonts.js` 的坑）、`CURRENT_STATE_JDK升级选型.md`
- 参照范式：`ManageController.addFirstAdminUser`（:3003）+ `isFirstAdminUserExists()`（`BaseController:3201`）+ `WebRoot/web/js/logon.js:25`
- 参数约定：`devDocs/参数存储策略与参数清单.md`（新键要登记；per-node 参数不得入库）

## 已确认的现状事实（带证据，详见方案 §1）

1. **产物清单 6 类**（`CleanOfficeFonts.bat`）：`sdkjs/common/AllFonts.js`（Web 字体库，~172KB）、`server/FileConverter/bin/AllFonts.js`、`server/FileConverter/bin/font_selection.bin`、`server/FileConverter/bin/fonts.log`、`fonts/`（dev 552 文件）、`sdkjs/common/Images/fonts_thumbnail*`（dev 20 文件）。**输入 `core-fonts/`（215 文件）不被清理** ⇒ 目标机器可原地重新生成。
2. **就绪判据已存在**：`OfficeBase.isAllFontsReady()`（:257，4 项：`fonts/`、两个 `AllFonts.js`、`font_selection.bin`）——但它是 `private`，且**只被已经死掉的 OnlyOffice 分支调用** ⇒ 生产路径上没人用它。
3. **廉价跳过**：`CApplicationFontsWorker.needGenerateFonts(force=false)`（:339）在 `font_selection.bin` 存在且 `fonts.log` 未变时**跳过生成** ⇒ 就绪时重复调用几乎零成本。**但 `OfficeBase.checkAndGenerateFonts()` 只要不抛异常就返回 true（即使内部跳过）** ⇒ 成功判据必须是"生成后复查 `isAllFontsReady()`"。⚠️ 若只有 `sdkjs/common/AllFonts.js` 缺失，worker 会跳过 ⇒ 必须做兜底（方案 D9）。
4. **自动生成只存在于"安装 Office"两条路径**：`onlineInstallOffice.do`（目录已存在则**拒绝**）与 `installOffice.do`（**备份后重装**）各调 `checkAndGenerateFonts(false,false)`。⇒ **war 替换 / 在线升级 / 发布包已带 office-editor 的首次部署**都没有任何环节生成字体库 ⇒ 这才是问题成因。
5. **人工入口只有一处**：`generateOfficeFonts.do`（超管，`createLongTermTask("generateOfficeFonts",…)`，**在请求线程里同步**跑 `checkAndGenerateFonts(true,true)` 约 10 分钟，期间 `officeDisabled=1`），前端 `main.js` 轮询 `queryLongTermTask.do`（长任务机制可复用：status 0/200/-1、重复 id 拒绝、过期清理）。
6. **被移除的启动期机制**（主仓库提交 `4ea4beaf2`，2026-06-21「Office编辑字体库初始化改为手动触发」）：删掉 `docSysInit()` 里两处 `initOfficeEditorFonts()` 调用、`BaseController.initOfficeEditorFonts()` 私有方法、`Channel.generateFont(...)` 声明。⇒ 现状 `Channel.initOfficeEditorFonts`/`BusinessChannel.initOfficeEditorFonts`/`OfficeBase.initOfficeEditorFonts` 三处**全是死代码（全仓无调用者）**，可复用为自动生成的执行入口（D8）。
7. **Web 端编辑器唯一咽喉**：`WebRoot/web/js/OfficeEditorLoader.js:loadRuntimeConfig()` → `POST /Manage/getOfficeEditorConfig.do`；弹窗（`DocSys.js:3026`）、新建页、ArtDialog 三条入口全走它，失败走 `fail()`（占位区 + alert）⇒ 检测/等待的天然落点。
8. **鉴权注意**：`MyInterceptor` 对任何带 `X-Requested-With: XMLHttpRequest` 的请求直接放行 ⇒ 新接口必须**自校验**登录（不能依赖拦截器）。
9. **集群为 per-node**：字体库产物与 `officeDisabled`（`BaseFunction:197`）都在本机/本 JVM；检测与生成只对处理该请求的节点有效（与现状「重置字体库」一致）。
10. **未确认**：用户看到的"字体库不存在"精确文案来源未定位（应在 office-editor 前端压缩产物/404 之后），本方案不依赖它。
11. **dev 环境拓扑与字体库位置（2026-10-13 确认，仅记录事实，不引起改动）**：dev Tomcat（`C:\TomcatForDocSysDev\docsys\tomcat`，8100，自带 JRE）的 webapp `/DocSystem` 是 **Junction → `D:\Dev\DocSys\WebRoot`**（指南方式 A）⇒ **工作区的 `web/static/office-editor` 就是运行环境的 office-editor 目录本身**，字体库产物必然落在工作区，不存在"另一份运行环境副本"；独立发布实例（`C:\docsysRel\docsys-Win-Release\docsys-win-2.02.87\...\webapps\DocSystem\web\static\office-editor`）各自另有一份。消费方：**浏览器端** 7 个 `web-apps/apps/*/embed/index.html` 与 `api/documents/cache-scripts.html` 以 `<script src=".../sdkjs/common/AllFonts.js">` 加载字体目录（`sdkjs/*/sdk-all.js` 读 `__fonts_infos`/`__fonts_files`，`fonts/` 由 `AscCommon.QJ.dOg("fonts/", …)` 按相对路径取）、`Images/fonts_thumbnail*` 供字体选择器预览；**服务端** `OfficeBase.getOfficeEditorPath():6848`（= `docSysWebPath + "web/static/office-editor/"`）、`FileConverter.java:51`（读 `bin/AllFonts.js`）、`CDocBuilder_Private.java:198`（读 `font_selection.bin`）、`fonts.log`（变更检测凭据）；`MyInterceptor.java:76` 把该目录列入静态白名单。**用户 2026-10-13 裁定：不删除现有字体库产物**（想避免"生成物落在工作区"只能改 dev 为方式 B 复制部署，代价是改动需重新同步）。同日晚追加：**Eclipse 自带的 WAR 导出无法排除文件**（本机 Eclipse 4.7.2 验证：`org.eclipse.wst.common.modulecore` 的 `wb-resource` 只有 `source-path`/`deploy-path`，无 exclude 机制）⇒ 已固化 `C:\TomcatForDocSysDev\BuildWar.bat`（robocopy 暂存排除 + jar，双重自检；Eclipse 里配 External Tool 一键打包），细节与实测数据见 `已完成/CURRENT_STATE_war打包.md`。

## 生效约束

- **未获用户对 D1–D9 的裁定前不要开工改代码**（用户明确要求"确认后再开工"）。
- 提交归属：后端改动 → websocket 仓库（`git -C src/com/DocSystem/websocket`）；前端/配置/文档 → 主仓库；`office/docs` → office 仓库（`git -C src/com/DocSystem/websocket/office`）。
- 编译输出：`-d WebRoot/WEB-INF/classes`（不变量）；源码树禁 `.class`；**Java 改动需重编译 + 重启 dev Tomcat**，前端改动硬刷新即可。
- **不要用 PowerShell 读写含中文的源文件**（会乱码），只用 edit/view。
- 测试 scratch 输出：`src/com/DocSystem/websocket/office/test/tmp/<测试名>/`。

## 当前进展

- ✅ 调研完成（2026-10-10）：问题成因、就绪判据、生成链路、被移除的启动期机制、可复用机制、6 类风险点（R1–R6）全部取证到位（见方案 §1，含 `文件:行号`）。
- ✅ 方案成文：`devDocs/Office字体库自动生成方案.md`。
- ✅ 用户裁定（2026-10-10）：**D1–D9 按推荐项全部采纳，开工**。
- ✅ 实施完成（见方案 §8.1 清单）：
  - websocket 仓库：`OfficeBase.java`（`initOfficeEditorFonts(needThumbnails[,force])` + `generateFontsWithVerify()` 复查/兜底 + `getOfficeFontsMissingItems()`；`isAllFontsReady`/`getOfficeEditorPath` 放宽为 `protected`）、`BussinessController.java`（`getOfficeFontsStatus.do`、`autoGenerateOfficeFonts.do`、状态文件 `officeFontsAutoGen.json`、后台线程 `officeFontsAutoGen`；手动 `generateOfficeFonts.do` 改为按复查结果上报）
  - 主仓库：`src/com/DocSystem/common/Path.java`、`ManageController.java`（getSystemInfo/setSystemInfo）、`WebRoot/web/js/common.js`（静默预检）、`WebRoot/web/js/OfficeEditorLoader.js`（就绪等待）、`WebRoot/manager/main.js` + `tmpl/systemOfficeEditor{,_en}.html`（状态行 + 开关）、`WebRoot/web/lang/en.js`、`src/docSysConfig.properties`
  - office 仓库：`docs/CppToJava常见问题与解决方案.md` §9.4
  - 工作区外：`C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 注释（D7）
- 🔄 验收实测（dev Tomcat 8100，2026-10-10 22:5x–23:5x；两轮真机生成）：
  - ✅ V1 检测准确｜✅ V3 幂等（`noopReason:fontsReady`）｜✅ V8 鉴权（未登录被拒）｜✅ V7 不触碰启动路径（静态清单）
  - ✅ V9 未安装 Office（临时移走 `office-editor` 目录实测：`installed:false` + 明确报错，未启动任务）
  - ✅ V6 失败/中断上限（预置 `attempts=1/fail` 与 `attempts=1/running` 均被挡为 `attemptsExceeded`；清空状态文件后可再自动生成）
  - ✅ V2 自动生成闭环（两轮）：触发响应 92–704 ms；**全量生成实测约 26 分钟**（文件部分约 3 分钟，缩略图档位占大头）；结束 `ready:true / generating:false / officeDisabled:0 / lastResult:success / attempts:0`；产物与清理前**字节级一致**（两个 AllFonts.js、font_selection.bin 的 MD5 相同，fonts/=552、fonts_thumbnail*=20、Images=27）
  - ✅ V4 并发（**首轮暴露缺陷已修并复验**：并发 4 次全部复用同一 taskId、`status:ok`）
  - ✅ V10（前端契约回归 + 新增并发保护实测：生成中再点手动重置被挡"已有字体库生成任务正在进行"）；手动路径成功判定改为按 `isAllFontsReady()` 复查
  - ✅ 真实浏览器 E2E（Playwright）：编辑器入口显示"字体库正在生成中（首次可能需要 10-30 分钟）…"并轮询等待；管理后台「Office编辑器」页渲染出 `字体库状态 / 字体库缺失时自动生成` 两行，状态显示"生成中（首次约 10-30 分钟）…"
  - ⚠️ V5（"生成后仍未就绪 → 删产物 + force 重建"兜底分支）仍未实测触发：两轮清理都含 `font_selection.bin`，首次生成即真实执行；要测需构造"只缺某个 AllFonts.js、`font_selection.bin`+`fonts.log` 完好"的场景
  - ✅ V10 手动「重置字体库」真机全流程（force=true）：页面弹"字体库重置成功"、`gStatus` 5→0、状态行回到"已就绪"、状态文件被清零
  - ✅ 新增源码级护栏测试 `com.DocSystem.test.TestOfficeFontsAutoGenGuard`：**21 项全过**；并做了负向验证（注入禁忌符号 → FAIL + exit 1；还原 → exit 0）
  - 🔧 验证期间发现并修掉的自身缺陷 6 项（见方案 §8.6）：判定顺序 / 手动与自动并发跑 native 生成 / `generating` 未覆盖手动重置 / 等待上限与文案 / **后台页状态行取 DOM 早于模板渲染**（`showSystemInfoPage` 增加 `afterRender` 参数）/ 手动重置无条件报成功
- ✅ 验收完成（V1–V4、V6–V10 全过；V5 兜底分支未触发，已如实记录）
- ⬜ 待提交（见下）

## 下一步

1. 等 V2 生成结束 → 记录 `state=success/attempts=0`、`officeDisabled=0`、`task.status=200`；清理 `.bak` 备份。
2. 重启 dev Tomcat 加载 V4 修复 → 第二轮实测复验并发复用 + 补测 V6/V9/V10。
3. 更新方案 §8.3/§8.4 的实测结论（含耗时分解：文件≈3 分钟、缩略图≈10 分钟）。
4. 回归确认后按仓库归属提交（主仓库 / websocket 仓库 / office 仓库），并收尾归档。

## 未提交改动

- `devDocs/Office字体库自动生成方案.md`（新建 + §8 实施记录）
- `DevAgentControl/CURRENT_STATE_Office字体库自动生成.md`（本卡）
- `devDocs/参数存储策略与参数清单.md`（新增 2 个键 + 状态文件登记）
- `src/docSysConfig.properties`（默认值注释）
- `src/com/DocSystem/common/Path.java`、`src/com/DocSystem/controller/ManageController.java`
- `WebRoot/web/js/common.js`、`WebRoot/web/js/OfficeEditorLoader.js`、`WebRoot/web/lang/en.js`
- `WebRoot/manager/main.js`、`WebRoot/manager/tmpl/systemOfficeEditor.html`、`systemOfficeEditor_en.html`
- **websocket 仓库**：`src/com/DocSystem/websocket/OfficeBase.java`、`BussinessController.java`
- **office 仓库**：`docs/CppToJava常见问题与解决方案.md`
- 发布脚本（2026-10-14 起在**仓库内** `Docs` 子模块）：`Docs/scripts/CleanOfficeFonts.bat`（清理清单权威）、`Docs/scripts/BuildWar.bat`（打包）、`Docs/scripts/CompareWar.py`（包内容对比）、`Docs/scripts/README.md`（发布链路）；仓库外 `C:\TomcatForDocSysDev\{CleanOfficeFonts,BuildWar}.bat` 已改为指路/转发桩
- 已编译的 class 已写入 `WebRoot/WEB-INF/classes`（该目录被 gitignore，不入库）
