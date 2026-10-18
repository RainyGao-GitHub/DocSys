# Mac 控制台最小可用版（路线 C）实施方案

> 建立于 2026-10-15。**用户已裁定走路线 C**（最小可用版）。
> 背景与依据：[`Mac安装程序调研.md`](./Mac安装程序调研.md)（§2 代码测绘、§9.2 路线对比、§10 macOS 侧全部结论）；
> 运行时与打包：[`跨平台运行时打包方案.md`](./跨平台运行时打包方案.md)（§13.9 运行时、§13.14 运行时布局）。
> 工作卡：[`CURRENT_STATE_Mac安装程序.md`](../DevAgentControl/CURRENT_STATE_Mac安装程序.md)。

## 1. 目标 / 非目标

**本轮要做（最小可用）**：

1. 一个能在 **macOS 12+**（Intel 与 Apple Silicon 都行）运行的**菜单栏 + 主窗口**小应用（`.app`）。
2. 能力：**启动 / 停止 / 重启 docsys**、**显示状态**、**一键"打开系统"**、**打开日志目录**、**设置端口**、**开机自启动**。
3. 与 `docsys`（来自 `build_release.py` 的 `docsys-mac-*.tar.gz`）一起放进 `.dmg`，**拖拽即用**。
4. 一页安装说明（调研文档 §10.2 定稿）。

**本轮明确不做**：

| 不做 | 原因 |
|---|---|
| 自绘无边框标题栏 | C 路线就是用系统原生窗口换取"最快跑起来" |
| 安装器 UI（`MxsdocSetup` 那套 2838 行） | mac 的"安装"= 拖进 `/Applications`；端口等配置由应用首次运行引导 |
| 升级流程 | 需求文档本身把它列为**延后**（§2.6） |
| MySQL 管理 | mac 包**不含 MySQL**（`build_release.py` 全平台排除）；用户可自行下载放入（脚本保留） |
| 签名 / 公证 | D1 裁定：先做未签名版 |
| `SMAppService` | 未签名不可用（调研文档 §10.1 ⑤） |

## 2. 技术选型

**Swift + AppKit**（局部可用 SwiftUI），**自建 `build.sh`（`swiftc` + 手工组装 `.app`）**，不引入 Xcode 工程文件。

理由：

- mac 原生体验最好，且**零第三方依赖**（不需要 Qt / Node / Python 运行时）。
- 可产出 **universal 二进制**（`-arch x86_64 -arch arm64`）⇒ 控制台本身**一个包通吃两种 Mac**
  （JRE 仍按架构分，但那是 `build_release.py` 的事）。
- 不需要在 Mac 上装 Qt —— 这正是选 C 而不是 A 的目的（避免 Qt 5.12 不支持 arm64、Qt 授权、构建系统迁移三重成本）。
- 不选 Electron / Tauri：体积与工具链成本远超"一个托盘程序"所需。

**前提**：Mac 上需要有 **Xcode Command Line Tools**（提供 `swiftc`）。见 §8 D7。

## 3. 产物与目录布局

```
MxsDoc 控制台.app/
  Contents/
    Info.plist              # bundle id 见 §8 D8
    MacOS/MxsConsole        # universal 二进制（GUI + CLI 双形态，见 §4）
    Resources/AppIcon.icns
```

`.dmg` 内容（`docsys` 与 `.app` **并列**）：

```
MxsDoc 控制台.app
docsys/                     # 解压自 docsys-mac-<版本>.tar.gz
安装说明.txt
```

⚠️ **`docsys` 不能放进 `.app` 内**：`.app` 签名后不可写（TN2206），而 docsys 要写 SQLite 库 / 日志 / `work`。

**运行期可写位置**（对齐调研文档 §7）：

| 数据 | 位置 |
|---|---|
| 控制台自己的配置、PID 文件 | `~/Library/Application Support/<bundle-id>/` |
| 控制台日志 | `~/Library/Logs/<bundle-id>/console.log` |
| docsys 的 `CATALINA_BASE`（conf 覆写、work、temp）与 `DocSystem.db` | `~/Library/Application Support/<bundle-id>/docsys/` |
| Tomcat 日志 | 上述目录下 `logs/`（或 `~/Library/Logs/<bundle-id>/`） |

`CATALINA_HOME` 指向**只读**的内置 docsys 里的 Tomcat；`CATALINA_BASE` 指向可写目录。

## 4. CLI 双形态（**关键设计，让远程协作可行**）

同一个二进制：

- 无参数 ⇒ 启动 GUI
- `--selftest` ⇒ 打印：macOS 版本 / 架构 / 是否 Rosetta、找到的 docsys 路径（含判据）、
  脚本存在性、运行时是否存在且位置正确、端口占用情况、PID 文件状态、`xattr -p com.apple.quarantine` 结果、最近 40 行日志
- `--start` / `--stop` / `--restart` / `--status` / `--open` / `--logs`

**为什么必须做**：我在 Windows 上**只能写代码，不能编译或运行 mac 产物** ⇒ 你在 Mac 上跑
`MxsConsole --selftest` 把输出贴回来，我就能定位问题、逐轮收敛。GUI 问题也先用 CLI 排除底层逻辑。

## 5. 核心逻辑（对 Windows 版的等价替换）

| 能力 | 现在的 Windows 实现 | mac 最小版实现 |
|---|---|---|
| 定位 docsys | 安装时写注册表 + 配置文件 | 依次尝试：`.app` **同级** `docsys/`（判据：有 `tomcat/` 与 `start.sh`）→ `/Applications/docsys` → `~/MxsDoc/docsys` → 用户手动选择（持久化到 `~/Library/Application Support/<bundle-id>/config.plist`） |
| **启动** | `CreateProcess(NULL, "…catalina.bat", …, CREATE_NEW_CONSOLE, …)` + `STARTUPINFO` 管道读输出（`ItemMxsDoc.cpp:805-830`） | `Process` 调 **`<docsys>/docsys_start.sh`**（`currentDirectoryURL` = `<docsys>`），stdout/stderr 重定向到 `console.log` ⇒ **复用仓库里那套 `.sh`，不自己拼 Tomcat 命令行** |
| **停止** | 同上（`docsys_stop.bat`）+ 杀进程 | `<docsys>/docsys_stop.sh`；失败则 `kill(pid, SIGTERM)` 回退 |
| **就绪判定** | 需求文档里"按状态文件更新"被列为**延后**；实际用 `CheckProcessExistByNameAndPath` | 轮询 **`http://127.0.0.1:<port>`**（TCP 连通即视为就绪）+ 读启动脚本产生的 PID 文件；超时可配 |
| 状态 | 进程名 + 可执行路径匹配（`ItemMxsDoc.cpp:708`） | **PID 文件** + `kill(pid, 0)`；更可靠（mac 上"按可执行路径匹配"不可行） |
| **打开系统** | `QDesktopServices::openUrl(QUrl(mxsdoc_url))`（`ItemMxsDoc.cpp:1504`） | `NSWorkspace.shared.open(URL(string: "http://127.0.0.1:<port>")!)`（**务必带 scheme**） |
| 托盘 | `QSystemTrayIcon` | `NSStatusItem`（菜单栏图标） |
| 开机自启动 | 写注册表 / 计划任务 | 写 **`~/Library/LaunchAgents/<bundle-id>.plist`**（`RunAtLoad`）；**不用** `SMAppService`（未签名不可用） |
| 端口 | 改 `tomcat/conf/server.xml`（`ItemMysql.cpp:357` 同族做法） | 同（改 `<docsys>/tomcat/conf/server.xml`，默认 8100，改动前检查占用） |
| 日志查看 | 读 `tomcat/logs/catalina.<日期>.log`（`DocSysLogReader.cpp:38-108`） | 打开 `~/Library/Logs/<bundle-id>/`；只读 docsys 的 `logs/` |
| **quarantine 自愈** | —（Windows 无此问题） | **首启检查自身所在目录树的 `com.apple.quarantine`，带则清除**（调研文档 §10.1 ④b；**待 §10.3 实测确认是否必要**，做成开关，默认开） |

**下拉菜单项**（对齐需求文档 §2.6，去掉 mac 不适用的）：关于 / 意见反馈 / 联系我们 / 设置 / 日志 / 启动 / 停止 / 退出。

## 6. 分阶段与验收标准

| 里程碑 | 内容 | 验收标准 |
|---|---|---|
| **M1 骨架 + CLI** | `--selftest/--start/--stop/--status/--open`；定位 docsys；调 `.sh`；PID 文件；日志重定向 | 你在 Mac 上跑 `--selftest` 输出正确；`--start` 后 `open http://127.0.0.1:8100` 能进系统；`--stop` 后端口释放 |
| **M2 GUI** | 菜单栏图标 + 主窗口（状态指示、启动/停止/打开系统按钮）+ 下拉菜单 | 双击 `.app` 后：能启动、状态变"运行中"、"打开系统"进浏览器、退出菜单能停服务 |
| **M3 设置** | 端口修改（含占用检测）、开机启动（LaunchAgent 增删） | 改端口后重启生效；开关机启动后 `launchctl list` 能看到 |
| **M4 打包** | `build.sh`（universal `.app`）+ 组装 `.dmg` 的脚本（可由 `build_release.py` 扩一个入口，或独立脚本） | 产出 `.dmg`，在一台干净的 Mac 上拖拽后能用（含 §10.2 的放行流程） |
| **M5 说明** | 一页安装说明定稿（≤14 / 15+ 两档） | 按说明操作能让客户自己装好 |

## 7. 协作方式（**重要**）

- 我在 Windows 上**只能写代码与文档，不能编译/运行任何 mac 产物** ⇒ 每轮由你在 Mac 上 `bash build.sh`，
  把输出（或截图）贴回来。因此 **M1 先做 CLI**：把底层逻辑做成可在终端验证的形态，GUI 再接上。
- 所有诊断信息集中写 `~/Library/Logs/<bundle-id>/`，便于你一次性打包贴回。
- 代码放哪：建议在 `D:\Dev\mxsdoc-console` 之外**新建一个独立仓库/目录**（例如 `D:\Dev\mxsdoc-console-mac`），
  避免把 Swift 代码混进那个 Windows C++ 仓库；等你定（见 §8 D8）。

## 8. 前提与待确认

| # | 议题 | 状态 |
|---|---|---|
| **D7** | Mac 上有没有 **Xcode Command Line Tools**（`swiftc`） | ✅ **已确认有**（`xcode-select -p` 有输出） |
| **D8** | app 名称与 bundle id；代码放哪 | ✅ 已定：`MxsDoc 控制台.app` + `com.mxsdoc.console`；代码落在**新目录 `D:\Dev\mxsdoc-console-mac`**（独立 git 仓库，首提交 `77c240d`）——与 Windows 侧 C++ 仓库 `mxsdoc-console` 并列。若你希望放进别的仓库，改起来是纯搬文件 |
| D9 | 本轮是否纳入 MySQL 管理 | **暂不纳入**（mac 包不含 MySQL；用户可自行放入，脚本保留） |
| D10 | quarantine 自愈是否默认开启 | ✅ **默认开启**（低成本防御；实测已证明 launchd 拉 java 不受影响，但脚本路径的门控仍未测完） |

## 9. 实现状态（2026-10-15）

| 里程碑 | 状态 | 说明 |
|---|---|---|
| **M1 骨架 + CLI** | ✅ 已写码 + **编译通过** + **`selftest` 真机通过** | `Sources/Core.swift` + `Sources/main.swift`：定位 docsys、`start`/`stop`/`restart`/`status`/`open`/`logs`/`port`/`autostart`/`selftest`、清 quarantine、LaunchAgent；**端到端启停仍待验证** |
| **M2 GUI** | ✅ 已写码 + **编译通过** | `Sources/GUI.swift`：菜单栏图标 + 主窗口 + 菜单 + 退出三选一（停止并退出 / 仅退出 / 取消） |
| M3 设置 | ❌ 未做 | `port` 目前只写控制台配置，**尚未改写 `tomcat/conf/server.xml`**；开机启动的界面开关也还没做 |
| M4 打包（`.dmg`） | ❌ 未做 | 需把 `MxsDoc 控制台.app` 与 `docsys/` 组装成 `.dmg`（或扩 `build_release.py` 一个入口） |
| M5 安装说明定稿 | 草稿 | 见调研文档 §10.2（≤14 / 15+ 两档） |

### ✅ 真机编译结果（2026-10-18，Intel Mac / macOS 12.7.4）

用户执行 `bash build.sh` **成功**：

```
▶ 编译 x86_64（Intel）…
<unknown>:0: remark: did not find a prebuilt standard library for target
'x86_64-apple-macos' compatible with this Swift compiler; building it may take
a few minutes, but it should only happen once for this combination of compiler and target
▶ 编译 arm64（Apple Silicon）…
已合并为 universal 二进制
✓ 完成
    GUI ：dist/MxsDoc 控制台.app
    CLI ：dist/mxsconsole
```

- **x86_64 与 arm64 都编译通过**，`lipo` 合并 universal 成功 ⇒ M1/M2 的 Swift 代码**无编译错误**。
- 那条 `remark: did not find a prebuilt standard library … building it may take a few minutes` 是**正常提示**（本机 CLT 的 Swift 版本对该 target 需现编一次标准库），**不是错误**。
- ⚠️ **编译通过 ≠ 功能验证**：**尚未跑 `selftest`，尚未实际启停 docsys**。以下仍未验证：
  定位 docsys 是否命中；`start.sh` 是否被正确拉起（工作目录 / `nohup` 重定向）；
  `pgrep -f <docsys>/tomcat` 与 `nc -z` 判状态是否准确；清 quarantine 是否生效；
  `open http://127.0.0.1:<port>` 是否正常；GUI 的菜单栏图标与按钮是否按预期工作。

### ✅ 真机 selftest 结果与据此做的加固（2026-10-18）

用户在同一台 **Intel Mac / macOS 12.7.4** 上跑 `./dist/mxsconsole selftest`，**主流程全部命中**：

| 检查项 | 实测输出 | 判读 |
|---|---|---|
| macOS | `Version 12.7.4 (Build 21H1123)` | 符合预期 |
| 架构 | `x86_64` | Intel Mac（`proc_translated` 在这一代本就无此 oid） |
| 容器目录 | `…/dist`（CLI 直接跑） | 符合预期 |
| docsys 定位 | `/Users/kakuka/MxsDoc/docsys` | ✅ 命中（候选表第 6 项 `~/MxsDoc/docsys`） |
| 启动脚本 | `start.sh=true docsys_start.sh=true stop.sh=true` | ✅ 三个都在 |
| java 启动器 | 存在 `…/tomcat/Java/jre/bin/java` | ✅ 与 §13.14「JDK 归档形态」一致 |
| quarantine | `(无)` | ✅ |
| 运行中 pid / 端口 | `(无)` / `8100 LISTEN=false 可连接=false` | ✅ 未运行状态判读正确 |
| 开机启动 | 未安装 | ✅ |
| Xcode CLT | `/Library/Developer/CommandLineTools` | ✅ |

**发现 1 个显示缺陷（已修）**：`proc_translated=sysctl: unknown oid 'sysctl.proc_translated'` ——
`shell()` 把 stderr 一起收进 stdout，而代码只判断"字符串是否为空"，于是把 sysctl 的**报错文本**当成了取值。
⇒ 改为**看退出码**：非 0 显示 `不适用`（Intel Mac 上该 oid 本来就不存在）。

**同时补了几处"下一次启停就会踩到"的真实缺口**（`D:\Dev\mxsdoc-console-mac`，`Sources/Core.swift`）：

| 加固 | 为什么 |
|---|---|
| `start` 改用 `nohup /bin/sh ./start.sh`（不再依赖脚本自身 `+x`） | 从 dmg 之外途径搬动文件会丢权限，`./start.sh` 直接 `permission denied` |
| 启动前 `ensureScriptsExecutable`：把 `<docsys>/*.sh` 缺的 `+x` 补齐并记日志 | 脚本链内部是 `$CURRENT_DIR/xxx.sh` 互相调用，缺一个就在半路静默失败 |
| 启动前 `ensureTmpDir`：缺 `tmp/` 就建 | `monitor_start.sh` 要写 `tmp/monitor.pid`，写不进去 ⇒ `stop.sh` 杀不掉看门狗，它会一直每 120 秒轮询 trigger 文件 |
| `stop` 额外按 `tmp/monitor.pid` 兜底停看门狗（并校验 pid 的 cmdline 含 `monitor_start.sh`，防 pid 复用） | `pgrep -f <docsys>/tomcat` 抓不到看门狗（它的命令行不含 `tomcat`） |
| 探测端口改为**以 `tomcat/conf/server.xml` 的 `<Connector port>` 为准**，配置 `PORT=` 只作兜底 | 配置写 8100、实际监听别的端口时，状态会永远显示"已停止"、`start` 会白等 180 秒 |
| `start` 时端口已被监听 ⇒ 视为已在运行并跳过 | 避免起第二个 Tomcat 撞端口 |
| `start` 超时后**自动打印 `console.log` 末 20 行** | 一次贴回即可定位，不必再让用户去翻文件 |
| `selftest` 新增：脚本 `+x` 状态、`catalina.sh`、`tmp/`、`server.xml` 实际端口、**直接跑一次内嵌 `java -version`** | 后者能一次性证明"JRE 架构对 + 没被 Gatekeeper 拦"，是"App 放行了但 Tomcat 起不来"的最快判据 |

> 这些改动**尚未在 Mac 上重新编译**（我在 Windows 上无法编译）。下一步：`bash build.sh` → `selftest`（对照上表）→ `start` / `status` / `open` / `stop`。
