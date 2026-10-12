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

## 当前进展（2026-10-12）

- ✅ `D:\Dev\mxsdoc-console` **顶层结构侦察**（上表）：C++/MSVC、10 个工程、安装程序走 **SFX**。
- ✅ **macOS 侧调研已完成**（后台 research agent `14f1f277`，680s；结论已落文档）：
  - **分发形态**：对标 SFX 的是 **`.pkg`（flat installer package）**，不是 `.dmg`（`.dmg` 只是容器、不安装任何东西）；可嵌套 **`.dmg`(内含 `.pkg`(内含 `.app`))** 实现"单文件双击即装"（Apple 明说可 nest）。`.zip` **不能签名** ⇒ 别用。
  - **签名/公证（最大外部依赖）**：未签名 App 自 **macOS 15 Sequoia 起"右键打开"被 Apple 移除**（Apple News `?id=saqachfa` 2024-08-06 亲验原文），用户只能走"系统设置 → 隐私与安全性 → 仍要打开" ⇒ 个人用户门槛显著。要走签名需 **$99/年 + Developer ID Application/Installer + Hardened Runtime + inside-out 逐 Mach-O 签名 + JVM entitlements（`allow-jit` 必需）+ notarytool + stapler**；**不要用 `--deep`**（macOS 13 起弃用，网上 Java 公证教程普遍带它）。
  - **架构**：JDK 厂商**都不发 universal macOS JRE**，`lipo` 对目录树无效 ⇒ 只能"两个包 / 单包双 JRE + 启动器按架构选 / 只 x64（Rosetta，macOS 27 后失效）/ 只 arm64（弃 Intel）"；**Apple Silicon 能跑 x86_64，Intel 不能跑 arm64**。本项目两个架构的 JRE **都已就位**。
  - **进程管理**：推荐 **每用户 LaunchAgent**（`KeepAlive` 崩溃自恢复 + GUI 退出后仍在 + 无需管理员），GUI 用 `launchctl bootstrap/bootout/kickstart` 或 `SMAppService.agent` 驱动；"就绪"判据用 **HTTP 轮询**（`launchctl print` 输出 Apple 明说不是 API）。
  - **文件布局**：`.app` 签名后**不可写**（TN2206）⇒ SQLite/上传/CATALINA_BASE 必须放 `~/Library/Application Support/<bundle-id>/`，由 App **首次运行时**自建（**不要**靠 pkg `postinstall` 给登录用户建 `~/Library`）。
  - **打开系统**：`open http://127.0.0.1:<port>`（务必带 scheme）；内嵌只能用 `WKWebView`（`SFSafariViewController` 在 macOS 不可用），ATS × loopback 需 belt-and-braces 且**必须实机实测**。
- ✅ 已产出 [`devDocs/Mac安装程序调研.md`](../devDocs/Mac安装程序调研.md)（§1 Windows 现状 / §2+§9 代码侧 **待补** / §3~§8 macOS 侧完整 / §10 待裁定 D1~D6 / §11 不确定项 / §12 来源）。
- ⏳ **代码测绘那路（`explore` agent `6208c6f8`）结论未回** —— 决定 §2「C++ 控制台可复用性」与 D4「技术路线」。**未回前不要下结论、不要动 `mxsdoc-console` 任何文件。**
- ⏭ 待办：explore 回来后补文档 §2/§9 → 用 `ask_user` 逐条确认 D1~D6（尤其 **D1 是否有 Apple 开发者账号** 与 **D4 技术路线**）→ 出实施方案。

## 生效约束

- `D:\Dev\mxsdoc-console` 是**独立 git 仓库**，改动要单独提交；**本轮为只读调研，不要改它的任何文件**。
- 未获用户裁定前**不动代码**（先出调研与方案）。
- 调研结论落到 `devDocs/`，并按里程碑更新本卡。

## 待用户裁定（等调研结论出来再逐条问，先记录）

1. **技术路线**：移植现有 C++ 控制台（取决于其 UI 栈是否跨平台）还是用别的技术重写（Qt / SwiftUI / Tauri / Electron / JavaFX）。
2. **Apple Developer 账号**：有没有（$99/年）—— 决定"双击即开、无安全警告"能否达成；没有就要靠右键打开 / 手动放行。
3. **目标架构**：Intel / Apple Silicon / 两者（JRE **无法 universal** ⇒ 双包或"一包双 JRE + 启动器按 `uname -m` 选"）。
4. **分发形态**：`.dmg`（拖入 Applications）vs `.pkg`（可写脚本、带卸载器，最接近 Windows SFX 的形态）。
