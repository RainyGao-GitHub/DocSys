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

- ✅ 已完成：`D:\Dev\mxsdoc-console` **顶层结构侦察**（上表）。结论：是 C++/MSVC、10 个工程、安装程序走 **SFX**。
- ⏳ **已派两路后台调研（结论未回，禁止提前下结论）**：
  1. `explore`（agent `6208c6f8`）：测绘 `mxsdoc-console`（UI 栈 / 启停与监控 / 打开系统 / SFX 机制 / Windows 硬依赖 / 可复用性 / 已有文档与脚本 / 有无 mac 痕迹）。
  2. `research`（agent `14f1f277`）：macOS 打包与签名（dmg·pkg 选择 → Gatekeeper·公证·嵌套 JRE 签名 → CPU 架构与 Rosetta → launchd 与进程管理 → 打开浏览器 → `.app` 不可写等坑）。
- ⏭ 待办：结论回来后写 `devDocs/Mac安装程序调研.md`（含方案对比 + 推荐 + 成本），再与用户逐项裁定。

## 生效约束

- `D:\Dev\mxsdoc-console` 是**独立 git 仓库**，改动要单独提交；**本轮为只读调研，不要改它的任何文件**。
- 未获用户裁定前**不动代码**（先出调研与方案）。
- 调研结论落到 `devDocs/`，并按里程碑更新本卡。

## 待用户裁定（等调研结论出来再逐条问，先记录）

1. **技术路线**：移植现有 C++ 控制台（取决于其 UI 栈是否跨平台）还是用别的技术重写（Qt / SwiftUI / Tauri / Electron / JavaFX）。
2. **Apple Developer 账号**：有没有（$99/年）—— 决定"双击即开、无安全警告"能否达成；没有就要靠右键打开 / 手动放行。
3. **目标架构**：Intel / Apple Silicon / 两者（JRE **无法 universal** ⇒ 双包或"一包双 JRE + 启动器按 `uname -m` 选"）。
4. **分发形态**：`.dmg`（拖入 Applications）vs `.pkg`（可写脚本、带卸载器，最接近 Windows SFX 的形态）。
