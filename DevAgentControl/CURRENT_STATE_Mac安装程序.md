# CURRENT_STATE_Mac安装程序（工作卡）

> 建立于 2026-10-12。承接 `CURRENT_STATE_JDK升级选型.md`（该卡**已暂停**：跨平台打包链已打通，剩下"用户准备 2.02.88 WAR → 放进 payload → 跑 `build_release.py`"，见该卡）。

## 需求

用户 2026-10-12：Windows 侧已有"安装程序 + MxsDoc 控制台"一整套，要**做一个 Mac 版的等价物**。原话要点：

- Windows 的**安装程序打包代码**能把 `docsys` 和 **MxsDoc 控制台程序**打成安装程序（**`docsys` 放在控制台程序里面**）；
- 控制台程序能**控制 docsys 启停**、**监控启动状态**；启动完成后台可点 **"打开系统"** 按钮进浏览器访问 MxsDoc；
- 目标：**Mac 做一个类似的** —— "帮我调研一下需要怎么实现"。

## 必读上下文

### A. Windows 侧现有实现（**独立 git 仓库**）

`D:\Dev\mxsdoc-console`：**C++ / MSVC 解决方案**（220 `.h` / 80 `.cpp` / 10 `.vcxproj` / 55 `.dll`），顶层含 `.git`、`BuildProject\MxsDoc_Console.sln`、`3rd-Party\jsoncpp-1.9.5`。

**顶层结构侦察（2026-10-12，仅目录层，未读代码）**：

| 目录 | 推测职责 |
|---|---|
| `MxsdocConsole` | 控制台程序（GUI） |
| `MxsdocPack` | 打包器（`BuiltApps\MxsdocPack.exe`） |
| `MxsdocSfx` / `MxsdocSfxLib` | 自解压（`BuiltApps\MxsdocSFX.exe` + `SFXConfig.ini`）⇒ **Windows 安装程序 = SFX** |
| `MxsdocSetup` | 安装设置 |
| `MxsdocService` | 服务相关 |
| `Uninstaller` | 卸载器 |
| `MxsUtils` / `common` / `CppProperties` | 公共库（`common\Version.*`、`FilesystemTools.*`、`DumpHelper.*`） |
| `bin` | `glog.dll`、`mxsconsole.conf`、`mxsdoc.properties` |
| `Docs` | 文档（待读） |
| `BuiltApps` | `Client\`、`Runtime\`、`Setup\`、`使用手册.docx` |

其他：`00CreateCheckSum.sh`、`更新说明.txt`、`DevEnv.txt`、`BuildProject\ReadME.txt`、`9 .sh` / `14 .py` / `5 .cmake`。

⚠️ **待测绘（已派 explore 后台调研）**：UI 技术栈（Win32 / MFC / WTL / Qt / WebView2 / 自绘？）、**启停与状态监控的具体实现**、**"打开系统"怎么开浏览器**、SFX 安装机制（装到哪 / 注册表 / 快捷方式 / 卸载）、**Windows 硬依赖清单**（注册表、SCM、`%ProgramData%`、托盘、`WinVerifyTrust`…）、**可复用比例与代码量**、有无 macOS/Linux 痕迹。

### B. 本项目已有的、Mac 可直接复用的部分

- `devDocs/跨平台运行时打包方案.md` **§11 方案 B**：通用 payload（无 JRE/无 MySQL）+ 按 OS 外壳。
- **§13.11（关键）**：Mac/Linux 包的**顶层脚本来自仓库** `WebRoot\web\sales\docsysStartScripts\Linux\`（14 个 `.sh`，**与 2.02.87 发行包 14/14 逐字节一致**）：`docsys_start.sh` / `docsys_stop.sh` / `docsys_restart.sh` / `docsys_upgrade.sh` / `start.sh` / `stop.sh` / `restart.sh` / `monitor_start.sh` / `monitor_stop.sh` / `mysql_start.sh` / `mysql_stop.sh` / `tomcat_start.sh` / `tomcat_stop.sh` / `gen_fonts.sh`。
  ⇒ **Mac 控制台不必自己拼 Tomcat 的启动命令行，直接调用这套脚本即可**（且改动可追溯）。
- **§13.9 运行时**：Mac Intel = Temurin 8 x64（`jre-mac.tar.gz`）；Apple Silicon = Zulu 8 aarch64（`zulu8.96.0.205-ca-jdk8.0.504-macosx_aarch64.tar.gz`）。⇒ **两个架构的 JRE 都不是 universal**。
- **§13.13**：payload 里现有那份 `webapps\DocSystem` 实测是 **2.02.87**，别整棵拷 `docsys-Win-Release\docsys`；预检只查 `web.xml` 是否存在、**查不出版本**。
- 打包器：`build_release.py`（仓库内 `WebRoot\web\sales\docsysReleaseScripts\` + 运行副本 `C:\docsysRel\`），可产出 `docsys-mac-<ver>.tar.gz` 与 `docsys-mac-arm64-<ver>.tar.gz`。
- 📁 **Mac 控制台（路线 C）代码**：`D:\Dev\mxsdoc-console-mac`（**独立 git 仓库**，`origin` = gitee；
  最新 `fc1d136`，版本号 0.1.1）
  —— `Sources/{Core,GUI,main}.swift` + `build.sh` + `Info.plist` + `README.md`；
  **M1（核心+CLI）与 M2（菜单栏 GUI）已写码 + 真机编译通过 + `selftest` 通过；端到端启停与 GUI 待验证**。
- 📄 方案文档：`devDocs/Mac控制台最小可用版方案.md`（路线 C 的技术选型、目录布局、逐里程碑验收标准、协作方式）
- 📄 调研文档：`devDocs/Mac安装程序调研.md`（§2 代码测绘 / §3~§8 macOS 侧结论 / §9 三条路线 / §10 实测与裁定 / §10.7 office 疑点已关闭 / §10.8 实测结论）
- 🧪 实测脚本：`WebRoot\web\sales\docsysReleaseScripts\macQuarantineTest.sh`（sales 提交 `4742283`）
  —— 含 §7「脚本自身带 quarantine」用例，**待用户重跑回填**

## 当前进展

### ⏭ 下一步（立即，按优先级）

0. ✅ **已完成（2026-10-18）**：用户在 Intel Mac（macOS 12.7.4）上 `bash build.sh` **编译通过**
   （x86_64 + arm64 → `lipo` 合并 universal；M1/M2 无编译错误）。**注意：编译通过 ≠ 功能验证**。
1. ✅ **已完成（2026-10-18）**：用户跑 `./dist/mxsconsole selftest`，**主流程全部命中**
   （docsys 定位 `/Users/kakuka/MxsDoc/docsys`、三个脚本在、`Java/jre/bin/java` 存在、quarantine 无、
   pid 无、`8100` 未监听、开机启动未装、CLT 已装）。**暴露 1 个显示缺陷 + 据此补了 7 处加固，见下方
   「✅ selftest 结果与加固」小节。**
1b. **【等用户，⚠️ 必须先重新编译】** 在 Mac 上 `git pull`（代码已推送到 gitee：`fc1d136`）
   → `bash build.sh` → `./dist/mxsconsole selftest`。**自检第一行应是 `v0.1.1`**（若还是 `v0.1.0`
   说明跑的是旧 `dist/`）。对照新表格逐行确认（尤其新增的 `脚本 +x` / `server.xml` 实际端口 / `java 可运行`）。
2. **【等用户】端到端启停验证**：`start` → `status` → `open` → `stop`，并把
   `~/Library/Logs/com.mxsdoc.console/console.log` 一起回填（重点看 `start.sh` 是否真把 Tomcat 拉起来；
   失败时 `start` 现在会自动打印日志末 20 行，直接连输出一起贴即可）。
3. **【等用户】试 GUI**：`open "dist/MxsDoc 控制台.app"` —— 看菜单栏图标、状态刷新、三个按钮。
4. **【等用户】重跑实测脚本**（已修 bug + 新增 §7「脚本自身带 quarantine」用例）：
   `bash macQuarantineTest.sh ~/MxsDoc ~/MxsDoc/docsys/tomcat/Java/jre/bin/java`
5. **【待做】M3 设置**：改写 `tomcat/conf/server.xml` 的端口（`port` 目前只写控制台配置）+ 界面上的开机启动开关。
6. **【待做】M4 打包**：把 `MxsDoc 控制台.app` 与 `docsys/` 组装成 `.dmg`（或给 `build_release.py` 加一个入口）。
7. **【待做】M5**：一页安装说明定稿（草稿在调研文档 §10.2，≤14 / 15+ 两档）。
8. **【建议】在 macOS 14/15 上补跑**（Apple 15 起移除右键打开；launchd 的 quarantine 判定未文档化，
   现有结论只覆盖 macOS 12.7.4）。
9. **【待裁定，可缓】** D2 目标架构 / D3 分发形态 / D5 进程管理形态 / D6 卸载方式 —— 见文末「待用户裁定」。
10. **【独立议题，勿与本次交付捆一起】** mac 包里 office 原生件（`x2t`/`.dll`/`libs/Linux`）≈200 MB 未压缩死重，
    确认无人引用后可考虑排除（调研文档 §10.7）。

- ✅ `D:\Dev\mxsdoc-console` **顶层结构侦察**（上表）：C++/MSVC、10 个工程、安装程序走 **SFX**。
- ✅ **macOS 侧调研已完成**（后台 research agent `14f1f277`，680s；结论已落文档）：
  - **分发形态**：对标 SFX 的是 **`.pkg`（flat installer package）**，不是 `.dmg`（`.dmg` 只是容器、不安装任何东西）；可嵌套 **`.dmg`(内含 `.pkg`(内含 `.app`))** 实现"单文件双击即装"（Apple 明说可 nest）。`.zip` **不能签名** ⇒ 别用。
  - **签名/公证（最大外部依赖）**：未签名 App 自 **macOS 15 Sequoia 起"右键打开"被 Apple 移除**（Apple News `?id=saqachfa` 2024-08-06 亲验原文），用户只能走"系统设置 → 隐私与安全性 → 仍要打开" ⇒ 个人用户门槛显著。要走签名需 **$99/年 + Developer ID Application/Installer + Hardened Runtime + inside-out 逐 Mach-O 签名 + JVM entitlements（`allow-jit` 必需）+ notarytool + stapler**；**不要用 `--deep`**（macOS 13 起弃用，网上 Java 公证教程普遍带它）。
  - **架构**：JDK 厂商**都不发 universal macOS JRE**，`lipo` 对目录树无效 ⇒ 只能"两个包 / 单包双 JRE + 启动器按架构选 / 只 x64（Rosetta，macOS 27 后失效）/ 只 arm64（弃 Intel）"；**Apple Silicon 能跑 x86_64，Intel 不能跑 arm64**。本项目两个架构的 JRE **都已就位**。
  - **进程管理**：推荐 **每用户 LaunchAgent**（`KeepAlive` 崩溃自恢复 + GUI 退出后仍在 + 无需管理员），GUI 用 `launchctl bootstrap/bootout/kickstart` 或 `SMAppService.agent` 驱动；"就绪"判据用 **HTTP 轮询**（`launchctl print` 输出 Apple 明说不是 API）。
  - **文件布局**：`.app` 签名后**不可写**（TN2206）⇒ SQLite/上传/CATALINA_BASE 必须放 `~/Library/Application Support/<bundle-id>/`，由 App **首次运行时**自建（**不要**靠 pkg `postinstall` 给登录用户建 `~/Library`）。
  - **打开系统**：`open http://127.0.0.1:<port>`（务必带 scheme）；内嵌只能用 `WKWebView`（`SFSafariViewController` 在 macOS 不可用），ATS × loopback 需 belt-and-braces 且**必须实机实测**。
- ✅ **macOS 侧调研已完成（两轮）**：
  - 第一轮（agent `14f1f277` turn 0，680s）：分发形态 / 签名公证 / 架构 / 进程管理 / 文件布局 / 打开系统 ⇒ 文档 §3~§8。
  - 第二轮（同一 agent turn 1，下钻「未签名路径」）⇒ 文档 §10.1~§10.3。**关键结论**：
    - 未签名 `.pkg` 双击**不是静默硬拒**，"仍要打开"对 pkg 有效（Apple 用词覆盖 "open **or install**"）；但 pkg 的右键放行与弹窗文案**无 Apple 出处**。
    - **拖拽 `.app` 会保留 quarantine**（"拖过去就好了"是误解）；**不要在 dmg 里直接运行**（App Translocation）。
    - **quarantine 由下载方设置、由解压工具决定是否传播**：浏览器/Finder 解压 = 全树带；**`curl`/`scp` 不打标、`tar`/`unzip` 不传播** ⇒ 这是分发格式杠杆。
    - ⚠️ **最关键**：**`launchd` 会拒绝执行带 quarantine 的程序**（`155: Refusing to execute/trust quarantined program/file`），而 quarantine 会传播到内嵌 JRE，且"点仍要打开"**不清除属性** ⇒ **「App 放行了但 Tomcat 起不来」是真实失败模式**。反过来说，**GUI 直接 `posix_spawn` 起 `java`（不经 launchd）按社区共识不受影响**（**未验证**）。
    - **`SMAppService` 未签名不可用**（`kSMErrorInvalidSignature`）⇒ 退路是 `~/Library/LaunchAgents` + `launchctl bootstrap`（**无签名前提**）。
    - **形态首选 `.dmg` 内含 `.app`（拖拽）**；`.command` 脚本**不能绕开 Gatekeeper**（鸡生蛋），且 macOS 15+ 绕过 Gatekeeper **会被记为安全事件** ⇒ 不要宣传成"正常安装方式"。
    - **未签名 + 无 Hardened Runtime ⇒ 零 entitlements**（Apple 原文亲验："allow-jit **required only when an app adopts the Hardened Runtime**"）。
    - 已产出**一页安装说明草稿**（≤14 / 15+ 两档）+ **真机实测 6 步清单**（§10.3，**未做完不要定形态**）。
- ⚠️ **代码测绘第一路失败**（`explore` agent `6208c6f8`，跑了 4093s、0 产出 —— 模型传输错误 `unexpected EOF during handshake`，非任务失败）⇒ **已重新派第二路**（`explore` agent `0fc3d235`，范围收窄为 8 个具体问题 + 要求 600 行内精简报告）。
- ⏳ **第二路测绘结论未回** —— 决定 §2「C++ 控制台可复用性」与 D4「技术路线」。**未回前不要动 `mxsdoc-console` 任何文件。**
- ❗**尚缺的关键前提**：**没有 Mac 真机 ⇒ §10.3 的实测无法进行**，而未签名方案的形态（是否必须带 `xattr` 排障步骤、要不要用 LaunchAgent）**取决于该实测**。
- ✅ **用户 2026-10-12 告知：Intel Mac 与 Apple Silicon Mac 都有，可以测** ⇒ 实测可做。
- ✅ **真机实测第一轮（Intel Mac / macOS 12.7.4）已完成，结果见文档 §10.4**：
  - 运行时是 **Eclipse Foundation Developer ID 正规签名 + Hardened Runtime**（`spctl`: "the code is valid but does not seem to be an app"）—— 对"未签名交付"是**有利**信息（内部是已签名代码）。
  - 手工打 quarantine：可写文件（含 `bin/java`）**能打上**；12 个只读文件（444）打不上。
  - **Terminal 直接 exec 带 quarantine 的 java 正常**（用户此时见到"是否允许运行 Java"弹窗，**出现在哪一步待确认**）。
  - **`launchd` 那条关键路径未跑成** —— 脚本 `set -u` 崩溃（已修）。
- ✅ **脚本已修**（sales `c8ef45c`）：崩溃点拆行；补运行时形态/嵌套 `jre` 判读与 macOS 版本提示。**待用户重跑取第 5/6 节结果。**
- ✅ **顺带查实一件"疑似缺陷"但结论是"不是缺陷"**：mac 包运行时位于 `Java/jre/jre/bin/java` 是**有意为的 JDK 归档**（`image_type=jdk`）造成，`Java/jre/bin/java` 存在、包能起来；与 2.02.87 的"真 JRE"形态只是历史差异（详见打包文档 §13.14）。**我一度误判为回归，已在文档中更正。**
- ✅ **真缺陷（已修）**：打包器自检的"Java 启动器"只查"任意 `*/java`"，运行时而错位也能 PASS ⇒ 已加固为必须存在 `docsys/tomcat/Java/jre/bin/java[.exe]`（sales `29a2fd8`，含负例/正例/历史包三重验证）。
- ⏭ 待办：**代码侧测绘已改为「我直接查阅源码」并完成（2026-10-15，见下方小节）** ——

## 代码侧测绘结论（2026-10-15，已落文档 §2 + §9）

⚠️ **两路后台测绘代理都因模型传输错误（`unexpected EOF during handshake`）零产出失败**（`6208c6f8`、`0fc3d235`）⇒ **改为我直接查阅源码**得出，证据为 `文件:行号`，已写入 `devDocs/Mac安装程序调研.md` §2。

| 工程 | 规模 | UI 栈（`.vcxproj` 证据） | mac 上 |
|---|---|---|---|
| `MxsdocConsole`（控制台） | 46 文件 / **4653 行** | **Qt 5.12.2**（`QtModules=core;xml;gui;widgets;concurrent`） | **要移植** |
| `MxsdocSetup`（安装器 UI） | 20 / 2838 | **Qt 5.12.2** | **大概率整块不用做**（mac 安装 = 拖进 `/Applications`） |
| `MxsdocPack` / `MxsdocSfx` / `MxsdocSfxLib` / `Uninstaller` | ≈5.7k 行 | **MFC** | **不需要**（Windows 概念） |
| `MxsUtils`（注册表/服务/进程/端口/路径） | 19 / 1443 | 无 UI，多为 Win32 | 逻辑可参考、实现要换 |
| `MxsDocService` / `common` / `CppProperties` | ≈2.2k | 无 UI | 参考 |

- **控制台已有可复用的跨平台部件**：`QSystemTrayIcon`（托盘）、`QDesktopServices::openUrl`（"打开系统"，`ItemMxsDoc.cpp:1504`）、`QSettings`(INI)、**`QFileSystemWatcher`（监视状态文件，`ItemMxsDoc.cpp:156-158`）**、`QThread`。
- **必须替换的 9 类 Win32 依赖**：`CreateProcess`+`CREATE_NEW_CONSOLE`+管道读日志（`ItemMxsDoc.cpp:805-830`、`ItemMysql.cpp:145`）、`GetTcpTable/GetUdpTable`（`NetPortHelper.cpp` 全文）、`CheckProcessExistByNameAndPath`（`ItemMxsDoc.cpp:708`）、注册表（`RegistryHelper.cpp`）、`FramelessDialog/Widget`+`TitleBar`、`CMonitorChildProc`、`\` 路径与 `catalina.bat`（`ItemMxsDoc.cpp:777`）、`Resource.rc`、SCM（`ServiceHelper.cpp`）。
- **风险**：**Qt 5.12.2 已 EOL 且不支持 Apple Silicon 原生**（arm64 支持需 5.15.2 / 6.2+）；Qt 授权形态需你们确认；升 Qt 会牵连 Windows 侧最低系统版本（现为 `WindowsTargetPlatformVersion 7.0/8.1`）。⇒ 好消息：**Qt 前端与 Tomcat/JRE 是两个进程，架构不必一致**。
- **建议路线**：先做 **C 最小可用版**（原生窗口 + 托盘 + 直接调 `docsysStartScripts\Linux\*.sh` + PID 文件判状态 + `open http://127.0.0.1:<port>`），再往 A（移植 Qt）/ B（原生重写）收敛。
- **硬约束**：`docsys` **不能放进 `.app`**（签名后不可写）⇒ `.app` 与 `docsys/` 并列进 `.dmg`；`build_release.py` 目前**不含控制台**，若要"一键出安装包"需再加组装 `.dmg` 的一步。
- ✅ **只读约束已遵守**：`mxsdoc-console` 仓库未留任何新增/修改文件（中途误把需求文档提取产物写进过 `Docs\`，已移出到 `%TEMP%`）。

## ✅ 实测结果（2026-10-15 第二轮，Intel Mac / macOS 12.7.4）

**关键问题有答案了：`launchd` 拉起了带 quarantine 的 `java` —— 正常执行。**

| 检查项 | 结果 |
|---|---|
| `launchctl bootstrap` | 退出码 **0** |
| `launchctl print` | `last exit code = 0`；`state = not running`（正常，因为程序跑完就退了） |
| agent 的 stderr | 完整 `openjdk version "1.8.0_492"` / Temurin / 64-Bit Server VM |
| launchd 日志里 `quarantine` / `155` | **无任何线索** |
| 清属性后的对照组（§6） | 同样 `bootstrap = 0`、`last exit code = 0`、stderr 有版本输出 |
| §3 打标 | **可执行体都带上了**（`java`、`jre/lib/jli/libjli.dylib`、`jre/lib/server/libjvm.dylib`、`jre/Contents/MacOS/libjli.dylib`）；12 个只读文件（444）写不进去 |
| §1 签名 | Eclipse Foundation Developer ID + `flags=0x10000(runtime)`（Hardened Runtime）+ 时间戳；`spctl` = "the code is valid but does not seem to be an app" |

⇒ **§10.1 ④ 设想的最坏情形（"App 放行了但 Tomcat 起不来"）在 macOS 12.7.4 上不成立。**

**但仍有 2 处未被覆盖**：① **脚本自身**带 quarantine（用户实际摩擦是"需要在终端里允许 start 脚本"）——
实测脚本已新增 **§7** 用例（临时脚本 `qprobe.sh` 打标 → 普通进程 / launchd 分别拉起），**待跑**；
② **macOS 14/15**（Apple 15 起移除右键打开、launchd 判定未文档化）——**需在 Apple Silicon 那台补跑**。

**已按路线 C 开始实现（M1+M2 均已写码）**：见 [`devDocs/Mac控制台最小可用版方案.md`](../devDocs/Mac控制台最小可用版方案.md) §9；
源码在**新目录 `D:\Dev\mxsdoc-console-mac`**（独立 git 仓库，首提交 `77c240d`）。⚠️ **尚未在真机编译验证**。

## ✅ Mac 版产品级排查：office 原生件问题已关闭（2026-10-15）

**曾怀疑是产品级缺口**：payload（与 2.02.87 mac 包一致）里 `office-editor/libs/` **只有 `Linux/`**、
`server/FileConverter/bin/` 是 **`x2t`(ELF) + `x2t.exe` 并存**、`server/tools/` 是 `allfontsgen`(ELF)+`.exe`；
实测 2.02.87 mac 包里 `x2t`/`allfontsgen`/`docbuilder` 的 magic **都是 `\x7fELF`（Linux 可执行）**；`libs` 只有 `Linux`。

**✅ 用户 2026-10-15 澄清 ⇒ 不是缺口**：MxsDoc 的 Office 编辑是 **Java 实现**的，mac 下**不使用** OnlyOffice 的 `x2t`；
**只要 JRE 正常就能工作**，且 **office 在线编辑用户已实测验证过**。⇒ 那些 ELF/`.so`/`.dll` 是上游残留，不影响 Mac 版。
（启动脚本里的 `LD_LIBRARY_PATH=…/libs/Linux` 与 `chmod 777 …/x2t` 在 mac 上**无效但无害**。）

**顺带得到两条可行动结论**：
1. **体积优化机会（待裁定，勿与本次交付捆一起）**：既然 mac 不用这些原生件，则 `x2t` 54.85 MB + `x2t.exe` 39.36 MB +
   `libs/Linux` ≈74 MB + Windows `.dll`s ≈44 MB ≈ **单平台 200 MB 未压缩死重**；是否在非 Windows 包排除需先确认没有 Java 路径会碰它们。
2. **用户当前在 mac 上的实际用法**："**需要在终端里允许 start 脚本来启动 MxsDoc**" ⇒ 这正是 §10.1 ④ 的 Gatekeeper 门控；
   **控制台要消除的就是这个摩擦**，而"脚本带 quarantine 时能否被拉起、需要什么放行动作"正是 §10.3 要实测的。
   详见 [`devDocs/Mac安装程序调研.md`](../devDocs/Mac安装程序调研.md) §10.7。 → 用 `ask_user` 逐条确认 D2~D6 → 出实施方案。

## ✅ 真机编译结果（2026-10-18）

用户在 **Intel Mac / macOS 12.7.4** 上 `bash build.sh` **编译通过**：
x86_64 与 arm64 都编过，`lipo` 合并 universal 成功，产出 `dist/MxsDoc 控制台.app` 与 `dist/mxsconsole`。
（那条 `remark: did not find a prebuilt standard library …` 是本机 CLT 现编一次标准库的**正常提示，不是错误**。）

⚠️ **编译通过 ≠ 功能验证**：**尚未跑 `selftest`、尚未实际启停 docsys**。待验证项：
docsys 定位是否命中、`start.sh` 是否被正确拉起（工作目录 / `nohup` 重定向）、
`pgrep -f <docsys>/tomcat` 与 `nc -z` 判断是否准确、清 quarantine 是否生效、
`open http://127.0.0.1:<port>` 是否正常、GUI 菜单栏与按钮行为。
详见 [`devDocs/Mac控制台最小可用版方案.md`](../devDocs/Mac控制台最小可用版方案.md) §9。

## ✅ selftest 结果与据此做的加固（2026-10-18）

用户 `./dist/mxsconsole selftest` 输出（Intel Mac / macOS 12.7.4）：**主流程全部命中** ——
macOS `12.7.4 (21H1123)`、`x86_64`、容器目录 `…/dist`、
docsys `=/Users/kakuka/MxsDoc/docsys`（候选表第 6 项 `~/MxsDoc/docsys` 命中）、
`start.sh/docsys_start.sh/stop.sh=true`、`java 启动器 存在 …/tomcat/Java/jre/bin/java`、
`quarantine (无)`、`运行中 pid (无)`、`8100 LISTEN=false 可连接=false`、`开机启动 未安装`、CLT 已装。

**1 个显示缺陷（已修）**：`proc_translated=sysctl: unknown oid 'sysctl.proc_translated'`
—— `shell()` 把 stderr 并进了 stdout，代码只判"非空"，于是把报错文本当成了取值。
⇒ 改为看**退出码**，非 0 显示 `不适用`（Intel Mac 本就没有该 oid）。

**本轮加固（`D:\Dev\mxsdoc-console-mac`，`Sources/Core.swift`，均已改码、未编译）**：

| 加固 | 触发的真实故障 |
|---|---|
| `start` 用 `nohup /bin/sh ./start.sh` 执行 | 脚本丢 `+x` 时 `./start.sh` 直接 permission denied |
| `ensureScriptsExecutable`：缺则 `chmod a+x` `<docsys>/*.sh` | 脚本链内部 `$CURRENT_DIR/xxx.sh` 互调，缺一个半路静默失败 |
| `ensureTmpDir`：缺 `tmp/` 自动建 | 看门狗写不了 `tmp/monitor.pid` ⇒ `stop.sh` 杀不掉它（每 120s 轮询 trigger） |
| `stop` 按 `tmp/monitor.pid` 兜底（校验 cmdline 含 `monitor_start.sh` 防 pid 复用） | `pgrep -f <docsys>/tomcat` 抓不到看门狗 |
| 探测端口**以 `tomcat/conf/server.xml` 的 `<Connector port>` 为准**，`PORT=` 仅兜底 | 配置与实际端口不一致 ⇒ 状态永远"已停止"、`start` 白等 180s |
| `start` 时端口已监听 ⇒ 视为已在运行并跳过 | 避免起第二个 Tomcat 撞端口 |
| `start` 超时自动打印 `console.log` 末 20 行 | 一次贴回即可定位 |
| `selftest` 新增：脚本 `+x`、`catalina.sh`、`tmp/`、`server.xml` 实际端口、**跑一次内嵌 `java -version`** | 后者一次证明"JRE 架构对 + 没被 Gatekeeper 拦"，是"App 放行了但 Tomcat 起不来"的最快判据 |

⚠️ **未编译验证**（我在 Windows 上编不了 Swift）⇒ 用户需先 `git pull` + `bash build.sh` 再跑 `selftest`/`start`。
📦 **提交**：`D:\Dev\mxsdoc-console-mac` `fc1d136`（已推送到 gitee `origin/master`，版本号 0.1.1）。

## 生效约束

- `D:\Dev\mxsdoc-console` 是**独立 git 仓库**，改动要单独提交；**本轮为只读调研，不要改它的任何文件**。
- 未获用户裁定前**不动代码**（先出调研与方案）。
- 调研结论落到 `devDocs/`，并按里程碑更新本卡。

## 已裁定

- ✅ **D4（2026-10-15，用户裁定）**：Mac 控制台走 **路线 C「最小可用版」** —— 原生窗口 + 托盘；启动直接调
  `docsysStartScripts\Linux\*.sh`；状态用 PID 文件（+ `QFileSystemWatcher` 的 mac 等价物）；
  「打开系统」用 `open http://127.0.0.1:<port>`；**不做**自绘无边框 UI、**不做**安装器 UI、**不做**升级、**不做** MySQL。
  ⇒ 实施方案已建：[`devDocs/Mac控制台最小可用版方案.md`](../devDocs/Mac控制台最小可用版方案.md)
  （技术选型 Swift+AppKit / 自建 `build.sh` / **universal 二进制**；**CLI 双形态** `--selftest/--start/--stop/…`
  以便我无法在 Windows 编译时靠你回填输出来收敛；M1~M5 里程碑与验收标准；待确认 D7~D10）。
- ✅ **D1（2026-10-12，用户裁定）**：**暂无 Apple Developer 账号 ⇒ 先做「不签名」版本**，用户手动放行。⇒ 流水线不含证书 / entitlements / 公证 / staple；**换 JRE 不必重签**；**零 entitlements 也是正确做法**（Apple 原文：`allow-jit` 仅在采用 Hardened Runtime 时才需要；未签名二进制根本带不了 entitlements）。
- ⚠️ **D1 的代价已查实（文档 §10.1）**：最大风险不是"用户要点几下放行"，而是 **quarantine 传播到内嵌 JRE 后被 `launchd` 拒绝执行（`155`）** ⇒ 出现"App 装好了但 Tomcat 起不来"的失败模式。因 Apple 未文档化该判定，**必须真机实测（§10.3）后才能定形态**。

## 待用户裁定（等调研结论出来再逐条问，先记录）

1. **技术路线**：移植现有 C++ 控制台（取决于其 UI 栈是否跨平台）还是用别的技术重写（Qt / SwiftUI / Tauri / Electron / JavaFX）。
2. **Apple Developer 账号**：有没有（$99/年）—— 决定"双击即开、无安全警告"能否达成；没有就要靠右键打开 / 手动放行。
3. **目标架构**：Intel / Apple Silicon / 两者（JRE **无法 universal** ⇒ 双包或"一包双 JRE + 启动器按 `uname -m` 选"）。
4. **分发形态**：`.dmg`（拖入 Applications）vs `.pkg`（可写脚本、带卸载器，最接近 Windows SFX 的形态）。
