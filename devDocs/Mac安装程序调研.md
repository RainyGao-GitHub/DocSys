# Mac 安装程序调研（MxsDoc 控制台 + 安装器）

> 建立于 2026-10-12。**目标**：为 Windows 侧已存在的「**安装程序 + MxsDoc 控制台**」做一套 **macOS 等价物**。
> 相关：工作卡 [`CURRENT_STATE_Mac安装程序.md`](../DevAgentControl/CURRENT_STATE_Mac安装程序.md)；[`跨平台运行时打包方案.md`](./跨平台运行时打包方案.md)（Mac 包产物与运行时来源）。
> **本文件的结论分两部分**：① macOS 侧（分发形态/签名/架构/进程管理/文件布局）——**已调研完毕，见 §3~§8**；② 代码侧「Windows 控制台有多少可复用」——**测绘中，见 §2 与 §9**。

---

## 1. Windows 侧现状（对标物）

`D:\Dev\mxsdoc-console`（**独立 git 仓库**）是 **C++ / MSVC 解决方案**，10 个工程：

| 工程 | 作用 |
|---|---|
| `MxsdocConsole` | **控制台程序**（GUI）：控制 docsys 启停、监控启动状态、启动完成后提供「打开系统」 |
| `MxsdocPack` | 打包器（把 `docsys` + 控制台打成安装程序） |
| `MxsdocSfx` / `MxsdocSfxLib` | **自解压（SFX）**，`SFXConfig.ini` 驱动 ⇒ **Windows 安装程序 = SFX** |
| `MxsdocSetup` | 安装设置 |
| `MxsdocService` | 服务相关 |
| `Uninstaller` | 卸载器 |
| `MxsUtils` / `common` / `CppProperties` | 公共库（`Version`、`FilesystemTools`、`DumpHelper`…） |

**Windows 形态一句话**：*单个 `.exe` 双击 → SFX 自解压到目标目录（含 `docsys` 整棵）→ 控制台 GUI 负责启停/监控/开浏览器 → 卸载器负责删除*。

**macOS 的等价物不是「另一个 SFX」** —— 见 §3。

---

## 2. 代码侧可复用性（⏳ 测绘中）

> 由后台 explore 测绘，结论回来后填本节与 §9。当前已知的**唯一确定事实**：技术栈是 **C++ / MSVC**，因此直接拿到 macOS 上编译**不可能**（`.sln`/`.vcxproj`、MSVC 运行时、Win32 API）。
> 是否「**可移植**」取决于 `MxsdocConsole` 的 UI 层用的是 **MFC / WTL / Win32 自绘**（= 必须重写 UI）还是 **Qt / 自绘 + 跨平台抽象层**（= 有可复用空间）。测绘项另含：启停与状态监控的实现、SFX 的落地机制、Windows 硬依赖清单（注册表 / SCM / 托盘 / 快捷方式 / `%ProgramData%`）。

---

## 3. 分发形态：`.pkg`，不是 `.dmg`

**依据**：[*Packaging Mac software for distribution*](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)（Apple 官方）**[A]**

| 形态 | Apple 判据原话 | 需管理员 | 能否「单文件双击即装」（对标 SFX） |
|---|---|---|---|
| **`.dmg` 内含 `.app`** | "This experience is easiest if your product is a single file or bundle" | 不需要 | ❌ **`dmg` 不安装任何东西**：原话 "opens it in Finder to access its contents, and they may choose to run your app from the disk image **or move it to their preferred location**" |
| **`.pkg`（flat installer package）** | "the best choice if your product contains **multiple components**, **must be copied to specific locations**, or if you need to **run custom code during installation**" | 需要（`installer(8)`："requires root privileges"） | ✅ **最接近 SFX**：单个 flat 文件、双击 → Installer 自动执行；`installer -pkg X.pkg -target /` 可全自动 |
| `.app + .zip` | 最简单；但 Apple 劝退安全性 | 不需要 | ❌ 用户自行解压再移动 |

**关键事实**：

- **`.dmg` 只是容器**，挂载后可「直接运行」或「拖到某处」，**没有安装步骤**。
- **`.zip` 不能签名**（Apple 原话："You can't sign a zip archive, so any files or folders you include that aren't covered by your code signature may be tampered with"）**[A]** ⇒ **不要用 zip 发 Mac 包**。
- **容器可以嵌套**（Apple 原话）："You can nest these containers. For example, you might want to ship an app inside an installer package on a disk image." ⇒ **`.dmg`(内含 `.pkg`(内含 `.app`))** 是「单文件双击 → 自动安装」的最贴近形态 **[A]**。
- **`.pkg` 的固有短板**：macOS **没有官方卸载机制**。`pkgutil --forget` 原话是 "Discard all receipt data about package-id, **but do not touch the [installed files]**" **[A]** ⇒ **卸载必须自己提供**（自带卸载脚本/App，或 `pkgutil --files` + 删除）。Windows 侧已有 `Uninstaller`，Mac 侧需要对应物。
- **`.pkg` 装到哪**：payload 在 system domain 以 **root** 安装（`pkgbuild --ownership` → `root:wheel`）。惯例：**只读部分（App / JRE / Tomcat）→ `/Applications`；用户数据 → 首次运行时由 App 自己建 `~/Library/Application Support/<bundle-id>/`**（见 §7）。**不要**依赖 `postinstall` 给登录用户建 `~/Library`（§8.4）。

**候选单文件命名**（供后续定夺）：`MxsDoc-<ver>.dmg`（内含 `.pkg`）/ 纯 `MxsDoc-<ver>.pkg`。

---

## 4. 签名与公证（本方案最大的外部依赖）

### 4.1 不签名会怎样（用户体验直接劣化）

**依据**：[*Safely open apps on your Mac*](https://support.apple.com/en-us/102445)、[*Open a Mac app from an unknown developer*](https://support.apple.com/guide/mac-help/mh40616/mac)（含按版本 URL）**[A]**

| 放行方式 | 状态 |
|---|---|
| 右键(Control-click) → 打开 | **≤ macOS 14 Sonoma 有效**；**macOS 15 Sequoia 起被 Apple 移除** |
| 系统设置 → 隐私与安全性 → **仍要打开**（约 1 小时内有效） | 有效（Catalina 至今） |
| `xattr -d com.apple.quarantine <path>` | 可清属性，但**不是 Apple 支持的渠道**（社区做法） |
| 「允许来自：任何来源」 | **GUI 已无此项**（macOS 15+），需 `spctl --global-disable` |

**改动引入点（已亲验原文）**：*Updates to runtime protection in macOS Sequoia*，Apple Developer News **2024-08-06** — <https://developer.apple.com/news/?id=saqachfa> **[A]**
> "In macOS Sequoia, **users will no longer be able to Control-click to override Gatekeeper** when opening software that isn't signed correctly or notarized. They'll need to visit System Settings > Privacy & Security to review security information for software before allowing it to run."

⇒ **未签名的 Mac 安装包，用户必须走「系统设置 → 隐私与安全性 → 仍要打开」**，这对个人用户/非技术客户是明显的门槛（且 Sequoia 起连"右键打开"这条老经验都失效了，客服成本高）。

### 4.2 加入 Developer Program（$99/年）后的完整流程

1. **证书**（[*Developer ID*](https://developer.apple.com/developer-id/)）**[A]**：**Developer ID Application**（签 App / 二进制 / `.dmg`）+ **Developer ID Installer**（签 flat `.pkg`）。**必须由团队 Account Holder 生成。**
2. **Hardened Runtime 必须开**：原文 "**To upload a macOS app to be notarized, you must enable the Hardened Runtime capability.**"（[*Hardened Runtime*](https://developer.apple.com/documentation/security/hardened-runtime)、[*Configuring the hardened runtime*](https://developer.apple.com/documentation/xcode/configuring-the-hardened-runtime)）**[A]**
3. **签名命令**（`codesign(1)` 原文）**[A]**：
   `codesign --force --options runtime --timestamp --entitlements ent.plist -s "<Developer ID Application: …>" <path>`
   - `--options runtime` = hardened runtime；`--timestamp` 需联网（只能用 Apple 的时间戳服务）。
4. **必须 inside-out 逐层签**（[*TN2206 Code Signing In Depth*](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)）**[A]**：
   > "**all nested code must already be signed correctly or the signing attempt will fail** … sign targets **inside out** … **signing the outermost bundle last**."
   且 `Contents/{MacOS,Frameworks,PlugIns,XPCServices,Helpers,Library/…}` **只允许放代码**（"Putting arbitrary data files there will cause them to be rejected"）。
5. **不要用 `--deep`**：`codesign` man 原文 "**--deep (DEPRECATED for signing as of macOS 13.0)** … **This is almost never what you want.**"；TN2206："**this is not recommended** … Signing with `--deep` is for **emergency repairs and temporary adjustments only**" **[A]**。
   ⚠️ 注意：网上流传的 Java 公证教程（含 **AdoptOpenJDK 2020-05 的 "A Simple Guide to Notarizing Your Java Application"**）**普遍带 `--deep`，早于 macOS 13 弃用，切勿照抄**。另：**TN3126 是 "Inside Code Signing: Hashes"，与 `--deep` 无关**。
6. **公证**（[*Notarizing macOS software before distribution*](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)）**[A]**：要求全部可执行体已签名 + Developer ID 证书 + Hardened Runtime + 安全时间戳 + **不得带 `com.apple.security.get-task-allow`** + entitlements 为 ASCII XML。工具链：`altool` **已于 2023-11-01 停止接受上传**（Apple News 2023-05-26）→ 用 `xcrun notarytool submit <file> --wait` → `xcrun stapler staple <file>`。
   - ⚠️ **顺序不能反**：`stapler` man 原文 "**Code-signing a supported file format invalidates any stapled tickets**" ⇒ **先签名、后 staple**。
7. **只公证最外层容器**（Apple 原话）："sign the app, sign the installer package, and sign the disk image, but **only notarize the disk image**" **[A]**。
8. **校验命令**（Apple 自己给的）**[A]**：`spctl -vvv --assess --type exec <App>`、`spctl -vvv --assess --type install <pkg>`、`codesign -dv --verbose=4`、`codesign -d --entitlements :-`、`pkgutil --check-signature <pkg>`。

### 4.3 内嵌 JRE 的签名（**最易踩的坑**）

**JVM 需要的 entitlements**（[*Security entitlements*](https://developer.apple.com/documentation/bundleresources/security-entitlements)）**[A]**：

| Entitlement | 用途 | 对 JVM |
|---|---|---|
| `com.apple.security.cs.allow-jit` | 允许 `MAP_JIT` 建可写+可执行内存 | **必需**（否则 HotSpot JIT 可能退化） |
| `com.apple.security.cs.allow-unsigned-executable-memory` | 不受 `MAP_JIT` 限制的可执行内存；Apple 明说 "exposes your app to common vulnerabilities" | 老 JDK 可能需要；**JDK 17+ 通常只要 `allow-jit`**；能不加就不加 |
| `com.apple.security.cs.disable-library-validation` | 允许加载未签名/异签名的 dylib | 加载未签名 native lib / JNI / agent 时必需；**会削弱保护** |
| `com.apple.security.cs.allow-dyld-environment-variables` | 允许 `DYLD_*` 生效 | 仅当启动器依赖 `DYLD_*` |
| `com.apple.security.cs.debugger` | 允许调试器 attach | **发布时不要加** |

**厂商侧要点**：

- **[V] Azul** *The Notoriety of Zulu on macOS* 的关键区分：厂商**只签 JDK 里各个 Mach-O**（`java`/`javac`…），**`/Library/Java/JavaVirtualMachines/*.jdk` 目录本身不一定是已公证 bundle** ⇒ **你把 JDK 塞进 App 后，仍必须自己对这些嵌套 Mach-O 签名**。
- **[V] Adoptium(Temurin)**：**无**「内嵌 Temurin 如何签名/公证」的官方文档；其 support 仓库记录了真实公证失败（如 `libjli.dylib` 报 "**The signature of the binary is invalid.**"）。⇒ 不能指望"厂商签过就没问题"。
- **[V] Oracle `jpackage`**：有 `--mac-sign` / `--mac-entitlements` 等签名选项，**但不含公证流程**。

⚠️ **实务含义**：任何对 JRE 内容的修改（增删文件、`build_release.py` 替换 JRE、改 `conf`）都会**破坏签名链** ⇒ 必须**重签 → 重新公证 → 重新 staple**。这条决定了发布流水线的形态（§9）。

---

## 5. CPU 架构：JRE **无法 universal**

**关键事实（[V] JDK 厂商）**：Temurin / Oracle / Azul **都不发布 universal 的 macOS JDK/JRE**，一律 x64 与 aarch64 分开。

**为什么 `lipo` 不可行**：`lipo(1)` 原话 "create or operate on **universal files**"、"reads a **single input file**"、`-hideARM64` 要求 "**Mach-O filetype MH_EXECUTE**"；Apple 的 universal binary 文档示范的也是**合并单个可执行文件** **[A]**。而 JRE 是**目录树**且大量内容**不是 Mach-O**（jar / jmod / `lib/modules` / 文本 `conf`），**无法在目录树级别合并**。

**跨架构的硬约束**：Apple 原话 "The system prevents you from **mixing arm64 code and x86_64 code in the same process**"（[*About the Rosetta translation environment*](https://developer.apple.com/documentation/apple-silicon/about-the-rosetta-translation-environment)）**[A]** ⇒ **启动器与 JVM 必须同架构**（不能 arm64 启动器 + x64 JVM 同进程）。

**Rosetta 2 现状（已亲验原文）**：*Upcoming changes to Rosetta support for Intel-based macOS apps*（Apple Developer News **2026-09-01**）— <https://developer.apple.com/news/?id=w5ngl9k2> **[A]**
> - "**macOS 26.4 or later**: Users may receive a system notification when launching apps that rely on Rosetta…"
> - "**macOS 27: Final release to support Rosetta** — Intel-only apps will no longer run on Mac computers with Apple silicon after this update."

⇒ **只发 x64 是短期桥接，不是长期策略**。另外 Rosetta 首次使用**需用户装**（弹窗 + 联网 + 管理员密码）。

**体积实测（Adoptium API，2026-10-12）** **[V]**：JRE 21 macOS 压缩包 **x64 = 40.2 MB**、**aarch64 = 45.9 MB**（合计 ~86 MB）。

| 方案 | 体积 | 复杂度 | 用户体验 |
|---|---|---|---|
| ① 两个包（x64 / arm64 各一） | 每用户 ~40-46 MB | 中：两条签名/公证流水线 | 最省流量，但**选错就崩/被转译**，错误率最高 |
| ② **单包双 JRE + 启动器按架构选** | **~86 MB** | **高**：启动器要选对 JRE、两套 JRE 都要逐个签名、**不能同进程混架构** | **最佳**：一次下载、两边原生（Apple 对插件明确背书过"两个非 universal 组件按上下文选一"） |
| ③a 只发 x64（AS 走 Rosetta） | ~40 MB | 低 | AS 转译 + 26.4 起弹通知；**27 后失效** |
| ③b 只发 arm64 | ~46 MB | 低 | **完全不支持 Intel**（Intel 无法跑 arm64，**无反向 Rosetta**） |

⚠️ **澄清一个常见误解**：Apple Silicon 能跑 x86_64（Rosetta），**Intel 不能跑 arm64** ⇒ 「只发 arm64 + 让 x64 走 Rosetta」**不成立**；单架构省事的路只有 **x64-only**。

**检测手段** **[A]**：`sysctlbyname("sysctl.proc_translated")` → 0=原生 / 1=转译；shell 用 `sysctl -n sysctl.proc_translated` 或 `uname -m`。

> **本项目现状可衔接**：Mac 两个架构的 JRE **都已就位**（Intel = Temurin 8 x64；Apple Silicon = Zulu 8 aarch64），见 [`跨平台运行时打包方案.md`](./跨平台运行时打包方案.md) §13.9。

---

## 6. 进程管理：LaunchAgent 才是 macOS 的「服务管理器」

**依据**：[*Process*](https://developer.apple.com/documentation/foundation/process)、[*TN2083: Daemons and Agents*](https://developer.apple.com/library/archive/technotes/tn2083/_index.html)、`launchd.plist(5)` / `launchctl(1)` **[A]**

### 6.1 「GUI 直接起进程」的固有短板

- 停止：`Process.terminate()` → **SIGTERM**；`interrupt()` → **SIGINT**；**没有 `destroy()`**（那是 .NET）。
- **GUI 退出后子进程成孤儿**：不被监督，被 launchd 收养（PID 1）继续跑 ⇒ **没有崩溃自动重启**，也没有统一的「谁在管我」。
- `Process` 的其他坑（Apple 原话）：沙盒 App 的子进程**继承父沙盒**（要 helper 应写成 XPC Service）；"You can only run the subprocess once per instance"；`terminationHandler` "isn't guaranteed to be fully executed prior to `waitUntilExit()`"。
- TN2083 给出的 remedy 优先级（原文）：① **"run the 'child' via launchd"**（最好）② `setsid` 开新会话 ③ plist 加 `AbandonProcessGroup`。

### 6.2 推荐：每用户 LaunchAgent

- **LaunchAgent（用户域）vs LaunchDaemon（root，登录前）**。路径（`launchctl(1)` FILES 原文）：`~/Library/LaunchAgents`、`/Library/LaunchAgents`、`/Library/LaunchDaemons`。
- **关键键** **[A]**：`Label`、`ProgramArguments`/`BundleProgram`、`RunAtLoad`、`KeepAlive`（"The use of this key implicitly implies `RunAtLoad`"）、`StandardOutPath`/`StandardErrorPath`、`WorkingDirectory`、`EnvironmentVariables`、`ThrottleInterval`（默认**最快 10 秒一次**）、`ProcessType`、`AbandonProcessGroup`。
  停止语义："sends **SIGTERM first, and then SIGKILL after a reasonable timeout**"。
- **launchctl 现代子命令**（`load`/`unload`/`list` 已归入 "LEGACY SUBCOMMANDS"）**[A]**：
  ```
  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/<label>.plist
  launchctl kickstart -kp gui/$(id -u)/<label>
  launchctl print  gui/$(id -u)/<label>
  launchctl bootout gui/$(id -u)/<label>
  ```
- **监控「启动完成」**：`launchctl print` 输出 Apple 明确警告 "NOT API… Do NOT rely on the structure" ⇒ **「Tomcat 就绪」应在应用层判：轮询 HTTP 端口**（+ 读 `StandardOutPath` 日志做诊断）。
- **`SMAppService`（macOS 13+）**（[*SMAppService*](https://developer.apple.com/documentation/servicemanagement/smappservice)）**[A]**：`register()`/`unregister()` 是"**replacement for installing property lists in `~/Library/LaunchAgents` or `/Library/LaunchAgents`**"；`agent(plistName:)` 指向 **`Contents/Library/LaunchAgents`**；LaunchAgent `register()` 后 "is immediately bootstrapped and may begin running"；`status` ∈ `notRegistered`/`enabled`/`requiresApproval`/`notFound`。**优点**：plist 放在**完全签名的 app bundle 内**，系统/第三方不能悄悄改。
  - **权限**：LaunchAgent = **无需 admin**；LaunchDaemon = **需管理员批准**。
  - ⚠️ 「SMAppService 必须把 App 放 `/Applications`」**未证实**（Apple 官方示例装到 `/Library/Application Support/<Developer>/` 也能 register）**[TZ]**。

**结论**：**用每用户 LaunchAgent 当 Tomcat 的监督者**（`RunAtLoad` + `KeepAlive` + `StandardOutPath`），GUI 用 `register/bootstrap/kickstart/bootout` 驱动 ⇒ **崩溃自动重启 + GUI 退出后 Tomcat 仍在 + 无需管理员**，这是最贴近 Windows SCM 的形态。
**最小退路**：GUI 里用 `Process` 直接起 Java，退出时 `terminate()`（SIGTERM）——没有崩溃重启、子进程成孤儿。

---

## 7. 文件布局：「App 包内不可写」是硬约束

**依据**：[*TN2206*](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)、*File System Programming Guide* / *macOS Library Directory Details*（Documentation Archive）**[A]**

- TN2206 原文："**Bundles should be treated as read-only once they have been signed.**"；安装后往 bundle 里写回执/许可/标记文件 ⇒ "Write data into files **outside the bundle**"，否则会被 Gatekeeper 拒。
- **放置建议**：

| 数据 | 位置 |
|---|---|
| SQLite DB（`DocSystem.db`）、上传、`CATALINA_BASE`/conf 覆写 | `~/Library/Application Support/<bundle-id>/…`（**应以 bundle id 建子目录**；默认纳入备份） |
| Tomcat `logs/` | `~/Library/Logs/<bundle-id>/` 或上述目录下 `logs/` |
| Tomcat `work/` `temp/`、可重建缓存 | `~/Library/Caches/<bundle-id>/…`（**系统可能随时清理**） |
| 偏好 | 只用 `NSUserDefaults`（"You should never create files in this directory yourself"） |

- **首启自建目录**：由 App 首次运行用 `FileManager.url(for:in:appropriateFor:create:)`（**`create:` = 自建**）建立。`NSSearchPathForDirectoriesInDomains` 是 **legacy** 且返回目录**可能不存在**。
- **Tomcat 的映射**（社区实践，Tomcat 文档非 Apple）
  ：`CATALINA_HOME` → **只读**的内置 Tomcat；`CATALINA_BASE` → **可写**的 `~/Library/Application Support/<bundle-id>/tomcat`；`-Dcatalina.base="…"` 作为**单个带引号参数**传。
- **路径空格 / 非 ASCII**：Apple 的 *Shell Scripting Primer* 明确要求引号；APFS 文件名按 **Unicode 9.0 归一化不敏感** ⇒ **启动器里路径要统一 NFC 再比较/哈希，不要按字节比较**。
- **可执行位 / shebang**：Apple 的 zip 配方是 `ditto -c -k --sequesterRsrc --keepParent`；TN2206 说明 "code signing uses **extended attributes** to store signatures in non-Mach-O executables such as script files … **Many file transfer techniques do not preserve extended attributes**" ⇒ **启动器不要用裸 shebang 脚本，用 `Contents/MacOS` 下的 Mach-O 可执行**，让权限与签名无歧义。

### 7.1 `.pkg` `postinstall` 的坑

- `pkgbuild --scripts` 的 `preinstall`/`postinstall` **以 root 运行**，运行在**最小、无 GUI 会话**环境，`$HOME=/var/root`、`~` 展开为 root 家目录，`open`/LaunchServices **没有会话** ⇒ **不能**用常规手段给登录用户建 `~/Library/...`。
- Apple **唯一直接记录**的例外是 Distribution XML 的 `enable_currentUserHome`："A home directory installation is done as the **current user (not as root)**, and it **cannot write outside of the home directory**" **[A]**。
- 「`stat -f%Su /dev/console` 找 console user + `launchctl asuser`/`sudo -u`」属**社区实践（非 Apple 文档）** **[C]**。
- ⇒ **推荐**：**把"建用户目录"放在 App 首次启动时**，别放 postinstall。

---

## 8. 「打开系统」按钮与内嵌浏览

- **交给系统浏览器**：`open http://127.0.0.1:<port>`（`open(1)` 原文 "If the file is in the form of a URL, the file will be opened as a URL"，走 LaunchServices 默认浏览器；`-a`/`-b` 指定 App，`-g` 不抢焦点）**[A]**。
  ⚠️ **务必带 `http://`** —— 裸 `127.0.0.1:8080` 可能被当路径。原生等价：`NSWorkspace.open(_:)`。
- **内嵌 `WKWebView`**：可用（macOS 10.10+），官方明说可 "load content from a web server using a URLRequest" ⇒ `load(URLRequest(url: http://127.0.0.1:<port>))` 属受支持用法。**走 `http://127.0.0.1` 比 `file://` 省事**（避开 `loadFileURL(_:allowingReadAccessTo:)` 的读取范围/来源限制）。
- **ATS 与 localhost — 文档自相矛盾**（`NSAllowsLocalNetworking` 页同页既说"macOS 14 起不再默认允许 IP 地址"，又说"默认不阻止本地加载"）**[A/TZ]** ⇒ **建议配置成 belt-and-braces**：`NSAllowsLocalNetworking=YES` + `NSExceptionDomains` 加 `127.0.0.1`（`NSExceptionAllowsInsecureHTTPLoads=YES`）+（内嵌时）`NSAllowsArbitraryLoadsInWebContent=YES`；沙盒化还需 `com.apple.security.network.client`。**macOS 13/14/15 都需实测**。
  ⚠️ `NSExceptionDomains` **不能带端口**（"Use example.com, not example.com:443"），IP 例外与 DNS 名例外**互不匹配**。
- **`SFSafariViewController` 在 macOS 不可用**（仅 iOS/iPad/Catalyst/visionOS）⇒ macOS 要内嵌只能用 `WKWebView`，否则交系统浏览器。

---

## 9. 与现有发布链的衔接（⏳ 待补，取决于 §2 测绘）

**已经确定可复用的部分**（来自 [`跨平台运行时打包方案.md`](./跨平台运行时打包方案.md)）：

- `build_release.py` 可产出 `docsys-mac-<ver>.tar.gz`（Intel）与 `docsys-mac-arm64-<ver>.tar.gz`（Apple Silicon），内容 = 骨架 payload + `webapps/DocSystem` + 对应 JRE（落到 `tomcat/Java/jre/`）+ 脚本覆盖层。
- **Mac 的启停脚本已经在仓库里且可追溯**：`WebRoot\web\sales\docsysStartScripts\Linux\` 的 **13 个 `.sh`**（`docsys_start.sh` / `docsys_stop.sh` / `docsys_restart.sh` / `start.sh` / `stop.sh` / `restart.sh` / `monitor_start.sh` / `monitor_stop.sh` / `tomcat_start.sh` / `tomcat_stop.sh` / `mysql_start.sh` / `mysql_stop.sh` / `docsys_upgrade.sh`；`gen_fonts.sh` **已于 2026-10-14 删除**）⇒ **Mac 控制台不必自己拼 Tomcat 启动命令行**，直接驱动这套脚本即可，与命令行口径天然一致。**注意**：2026-10-13 之前该目录与 2.02.87 发行包 **14/14 逐字节一致**；现在 `docsys_start.sh` / `tomcat_start.sh` **已去掉启动期字体库生成**（用户 2026-10-14 裁定，见 [`Office字体库自动生成方案.md`](./Office字体库自动生成方案.md) §1.4），而 mac 包与 Linux 包**共用这一个目录**（`build_release.py` 里 5 个平台都取 `scripts="Linux"`）⇒ **不要再用"与旧包逐字节一致"作为前提**。
- `.sh` 的可执行位**由 `build_release.py` 显式写进 tar 头**（不依赖构建机文件系统）。

**待补问题**（测绘回来后填）：安装包如何消费 `docsys-mac-*.tar.gz`？控制台是**随包分发**还是**独立分发**？签名/公证在流水线里放在哪一步（JRE 一旦被 `build_release.py` 换过就必须重签 → **签名应在打包之后**）？

---

## 10. 待用户裁定

| # | 议题 | 选项 | 影响 |
|---|---|---|---|
| D1 | **是否有 Apple Developer 账号（$99/年）** | ✅ **已裁定（2026-10-12）：暂无账号，先做「不签名」版本，由用户手动放行** | 流水线大幅简化（无证书 / 无 entitlements / 换 JRE 不用重签），但**用户体验与客服成本成为主要风险** ⇒ 需查实「未签名时用户确切看到什么」并准备一页安装说明（见 §10.1） |
| D2 | **目标架构** | 双架构单包（~86 MB）/ 两个包 / 只 x64（27 后失效）/ 只 arm64（弃 Intel） | 体积、流水线数量、用户体验 |
| D3 | **分发形态** | `.dmg` 内含 `.pkg`（最像 SFX）/ 纯 `.pkg` / `.dmg` 内含 `.app`（拖拽，最省事但不"安装"） | 是否要"双击即装"、是否要装到 `/Applications` |
| D4 | **控制台技术路线** | 移植 C++（取决于 UI 栈）/ 重写（Qt / SwiftUI / Tauri / Electron / JavaFX） | 工作量最大的变量，**等 §2** |
| D5 | **进程管理形态** | LaunchAgent（崩溃自恢复、GUI 退出仍在）/ GUI 直接 spawn | 可靠性与实现量 |
| D6 | **卸载** | macOS 无官方卸载 ⇒ 是否提供卸载脚本/App（对标 Windows `Uninstaller`） | 交付完整性 |

### 10.1 未签名路径：查实结论（2026-10-12，第二轮下钻调研）

**① 未签名 `.pkg` 双击不是"静默硬拒"，而且用户的放行手段对 pkg 同样有效**

- `.pkg` 受 Gatekeeper 管辖（*Apple Platform Security* "Gatekeeper and runtime protection in macOS" 原文把 "an app, a plug-in, or **an installer package**" 一并列入检查范围）**[A]**。
- 但覆盖手段覆盖**安装**：*Safely open apps on your Mac*（support 102445）的 "Open Anyway" 流程原话是 "confirm your intent to **open or install** the app"（"install" 是 Apple 用词），且 Apple 的 pkg 安装帮助页把包警告**直接导向**该文 **[A]**。
  ⇒ **`系统设置 → 隐私与安全性 → 仍要打开` 对 `.pkg` 有效**（按钮约 1 小时内有效）。
- ⚠️ **未签名 pkg 的确切弹窗文案、"右键 pkg → 打开"是否有效**：**Apple 无任何出处**（无截图、无表述）**[TZ]** ⇒ 不要把这些写成"Apple 官方说法"，且客户更容易困惑。

**② 未签名 `.app`：拖拽**保留** quarantine —— 「拖过去就好了」是误解**

- 放行路径：**≤ macOS 14** 右键 → 打开 可用（会被记为例外）；**macOS 15+** 只剩「系统设置 → 仍要打开」。
- **不要在 `.dmg` 里直接双击运行**：可能触发 **App Translocation**（路径随机化到只读位置）；TN2206 原话 "**Don't launch your app from inside the .dmg.** Drag the app to /Applications and launch it from there." **[A]** ⇒ 会破坏 Tomcat/JRE 的绝对路径假设。
- **quarantine 随拖拽保留**（TN2206 间接证据 + Apple 论坛用户 `xattr -l` 实测显示 `/Applications` 里的 app 仍带 `com.apple.quarantine: 0183;…;Safari;…`）**[A-间接]/[C]**。

**③ quarantine 由"下载方 App"设置，且**解压工具**决定是否传播（⇒ 这是分发格式的杠杆）**

| 方式 | 是否带 quarantine | 来源 |
|---|---|---|
| 浏览器下载、Mail / Messages、AirDrop | **会** | TN2206、Platform Security **[A]** |
| **`curl` / `scp`** | **不会**（Apple DTS 原话："Unix-y networking tools, like `curl` and `scp`, don't quarantine the files they download."） | **[A-forum]** |
| **`tar` / `unzip` 解压** | **不把 quarantine 传播到解出的文件** | 同上 **[A-forum]** |
| **Finder「归档实用工具」双击解压** | **会传播** | 同上 **[A-forum]** |
| `ditto` | 默认 `--qtn`（**保留** quarantine） | **[A-mirror]** |

⇒ **客户"浏览器下载 + Finder 双击解压"= 全树带 quarantine**；`tar` 解压则不带。这条直接决定了 §10.2 的兜底步骤。

**④【最关键】未签名时 Gatekeeper 会不会拦 `launchd` 拉起的 `java`？→ 会（中高置信）**

- Gatekeeper 的触发条件 = **带 quarantine** + **首次被打开**（TN2206 已亲验原文："Gatekeeper only checks quarantined files the first time they're opened."）**[A]**。
- **但 `launchd` 另有自己的判定**：`launchd` 用 `posix_spawn`（**不经 LaunchServices**），却会向系统策略 oracle 查询 —— `syspolicyd(8)` 原话 "serves as a **general oracle** that other system components may use to determine the system policy's verdict" **[A-mirror]**。实测错误（macOS 13 登录项案例）：
  `155: Refusing to execute/trust quarantined program/file`；同案例里 `launchctl bootstrap` 一个**带 quarantine 的 plist** 也失败 **[C]**。
- **quarantine 会传播到内嵌的嵌套程序**：Apple DTS（Quinn）实测 app 与其 `Contents/MacOS/<exe>` **都**带 quarantine，并称 "That's normal, at least on modern systems." **[A-forum]** ⇒ 我们内嵌的 `.../jre/bin/java`、`lib/libjli.dylib` **很可能各自都带**。
- **用户点了「仍要打开」≠ 清除了属性**：同一实测显示属性**仍在**，只是 flag 位变化（`0183;…` → `01c3;…`）**[A-forum]**。
- ⇒ **「App 成功放行了，但 Tomcat 起不来」是真实且很可能发生的失败模式**。两条应对：
  - **(a) 兜底清属性**：`xattr -dr com.apple.quarantine "<安装目录>"`（`xattr(1)`：`-d` 删除、`-r` 递归）**[A-mirror]** —— 但它**不是 Apple 支持的分发/用户途径**（Apple DTS 只作为调试建议），需写进安装说明的排障段。
  - **(b) 让 App 首启自愈**：App 被用户批准后以普通进程调 `removexattr` 清理**自身**嵌套文件 —— **这是我方建议，未实测**。前提是 App 经**拖拽**装到**用户可写**的 `/Applications`（属主是用户）；若经 `.pkg` 以 `root:wheel` 安装则不可写。
- ⚠️ 反向的社区共识（**未在 14/15 验证**）：**GUI 用 `NSTask`/`posix_spawn` 直接起 `java`（不经 launchd）不应触发 LaunchServices 层的 Gatekeeper 检查** ⇒ 若成立，未签名版**可以完全不需要客户跑任何命令**（把 LaunchAgent 从最小版里拿掉）。**这条必须实测（见 §10.3）。**

**⑤ `SMAppService` 在未签名下不可用；退路可用且无签名前提**

- `SMAppService.register()` **要求有效签名**：错误常量 `kSMErrorInvalidSignature` —— "The app's code signature doesn't meet the requirements to perform the operation."；未签名实测报 `-67054 = errSecCSUnsigned` **[A]+[C]** ⇒ **未签名版必须放弃 SMAppService 路线**。
- 退路 **`~/Library/LaunchAgents` + `launchctl bootstrap gui/$UID`**：`launchctl(1)`（镜像）**只要求属主与权限**（在 `$HOME/Library/LaunchAgents` 时属主须为**加载它的用户**、且**禁组与其他用户可写**），**全文不提签名/公证/quarantine 前提**；`launchd.plist(5)` 的 `Program` 也只需绝对路径 **[A-mirror]**。Apple 文档还明确承认"可执行文件未签名"的 legacy helper 情形 **[A]**。
  ⇒ **未签名、非沙盒 App 可以自己写 plist 到 `~/Library/LaunchAgents` 并 `launchctl bootstrap`**。
- **两个前提**：① plist 自身不能带 quarantine（运行时写的自然满足）；② `Program`（未签名 `java`）不能带 quarantine —— 否则回到 ④ 的 155 错误 **[C]**。
- 顺带澄清：**「SMAppService 必须把 App 放 `/Applications`」是误解** —— Apple 官方样例装到 `/Library/Application Support/<Developer>/` 也能 register **[A]**。

**⑥ 形态排序（未签名场景，客户为个人用户 / 非技术 / 无 IT / 无法远程协助）**

1. **`.dmg` 内含 `.app`（拖拽安装）—— 首选**。理由：Apple 官方文档覆盖最完整（mh40616 **逐版本**给出放行步骤，用户"照做即可"）；用户只需"拖 → 双击 → 去系统设置点一下"；安装本身**不需要管理员密码**。
2. **未签名 `.pkg`（装到 `/Applications`）—— 次选**。优点：双击即装、定位精确、"仍要打开"对 pkg 有效。缺点：pkg 的**右键放行与弹窗文案 Apple 均无出处**，15+ 下用户更易困惑；且以 `root:wheel` 安装 ⇒ **App 无法自愈清 quarantine**（见 ④b）。
3. **`.dmg` + `.command` 安装脚本 —— 不能自动绕开 Gatekeeper**：被 quarantine 的 `.command` 首次双击**同样被门控**（社区实测 `bad-path: /bin/bash: bad interpreter: Operation not permitted`）—— 要跑脚本得先放行脚本（鸡生蛋）。Apple **没有**把它定义为"规避 Gatekeeper"（App Review Guidelines 全文无 Gatekeeper / quarantine / `xattr` 字样 **[A]**），但立场**负面**：macOS 15+ 绕过 Gatekeeper **会被记为安全事件**并推送给第三方安全产品（Platform Security "Protecting against malware"）**[A]**，官方也明说 "**You should not override security settings**" **[A]** ⇒ **不要把它宣传成"正常安装方式"**。

**⑦ 一页安装说明草稿**：见 §10.2。

**⑧ 未签名 + 无 Hardened Runtime ⇒ 不需要任何 entitlements（我们的理解成立，且有 Apple 原文）**

- **已亲验原文**（*Porting just-in-time compilers to Apple silicon*）：
  > "The `com.apple.security.cs.allow-jit` entitlement is **required only when an app adopts the Hardened Runtime capability**. If you don't adopt this capability, **you don't need the entitlement to use the `MAP_JIT` flag**."
- **更彻底**：**未签名二进制根本带不了 entitlements**（entitlements 存在**代码签名**里）⇒ 未签名版不存在 entitlement 配置环节。
- **Apple Silicon 补充**（已亲验原文）："**Apple silicon enables memory protection for all apps, regardless of whether they adopt the Hardened Runtime.**" ⇒ AS 上即使未硬化/未签名，W^X 也强制生效 ⇒ JVM 必须走 `MAP_JIT`（但**无需 entitlement**）；Intel 未硬化时 W^X 不强制。
- **Rosetta**："Rosetta can translate most Intel-based apps, **including apps that contain just-in-time (JIT) compilers**." ⇒ x64 JRE 在 AS 上经 Rosetta 也能 JIT。

### 10.2 一页安装说明（草稿，给客户）

> 三件事：**① 先把 App 拖到「应用程序」；② 首次打开被系统拦，去「系统设置」放行；③ 若服务起不来，跑一条命令清标记。**

**🅰 macOS 13 Ventura / 14 Sonoma 及更早**

1. 双击下载的 `.dmg`。
2. 把 App 图标**拖到「应用程序」** —— **不要**在 dmg 窗口里直接双击运行。
3. 「访达 → 应用程序」里**首次**双击 App → 出现"无法验证开发者/无法打开"。
4. **右键（或 Control+点击）图标 → 打开 → 再点「打开」**（系统会记为例外，之后可正常双击）；备选：**系统设置 → 隐私与安全性 → 仍要打开**（点击后约 1 小时内有效）。

**🅱 macOS 15 Sequoia / 26 Tahoe / 27（右键路径已失效）**

1. 双击 `.dmg`。
2. 把 App **拖到「应用程序」** —— **不要**在 dmg 里运行。
3. 双击 App → 出现"Apple 无法验证此 App" → 点**完成/好**（**没有**"打开"按钮）。
4. **系统设置 → 隐私与安全性** → 滚到**安全性** → 点**「仍要打开」** → 输入登录密码 → 点**打开**。
   ⚠️ 该按钮**只在刚尝试打开后约 1 小时内出现**；没看到就**再双击一次 App** 回来。
5. 再次双击 App → 这次出现带「**打开**」的确认框 → 点**打开**。

**排障（两档通用）— 若 Tomcat / 服务起不来**

打开「终端」，粘贴（路径换成实际安装位置）：
```
xattr -dr com.apple.quarantine /Applications/<YourApp>.app
```
再重开 App。（原因：内嵌 JRE/Tomcat 的二进制若带 `com.apple.quarantine`，`launchd` 会以 `155: Refusing to execute/trust quarantined program/file` 拒绝启动 —— 见 §10.1 ④。）

**写说明时要避免**：不要让客户关 Gatekeeper / 跑 `spctl --global-disable`（Apple 官方立场是"不应覆盖安全设置"）；**不要承诺"拖过去就好了"**（quarantine 会保留）。

### 10.3 定稿前必须真机实测（**未做完不要定形态**）

> **已提供实测脚本**：[`WebRoot/web/sales/docsysReleaseScripts/macQuarantineTest.sh`](../WebRoot/web/sales/docsysReleaseScripts/macQuarantineTest.sh)
> 用法（macOS 14 / macOS 15 各跑一次，Intel 与 Apple Silicon 都建议跑）：
> ```
> bash macQuarantineTest.sh /路径/到/解压后的/docsys
> ```
> 脚本会打印环境、**JRE 自身的签名/公证状态**、基线执行、**手工打 quarantine**、Terminal 直exec、**LaunchAgent（launchd）执行**、**清属性后重试**，并自动清理临时 agent。核心要看的是第 5/6 节（是否出现 `155: Refusing to execute/trust quarantined program/file`）。

在 **macOS 14 与 macOS 15 各一台**上跑：

1. 把含「未签名 `.app` + 内嵌 JRE」的包装成 zip / dmg，用**浏览器**下载后 `xattr -p com.apple.quarantine` 检查 `Contents/.../jre/bin/java`、`lib/libjli.dylib` **是否各自带 quarantine**。
2. 用户按要求放行后，**复查 xattr 与 flag 位**是否变化（预期仍在）。
3. 注册 LaunchAgent 指向该 `java`，`launchctl bootstrap`，用 `log stream --predicate 'process == "launchd"'` 看**是否报 155**。
4. `xattr -dr com.apple.quarantine` 后重试，确认能起来。
5. **另测**：GUI 用 `posix_spawn` / `NSTask` 直接起该 `java`（**不经 launchd**）**是否被拦** —— 若不被拦，未签名版可取消 LaunchAgent、客户零命令。
6. 附带确认：**`.dmg` 内的 `.pkg` 是自带 quarantine 还是仅 `.dmg` 带**（未验证，直接影响要不要走 pkg 路线）。

---

### 10.4 真机实测记录

**2026-10-12 · Intel Mac · macOS 12.7.4（`arch=x86_64`，无 `proc_translated` 这个 sysctl）**，
用的是 `docsys-mac-2.02.88.tar.gz` 自带的运行时（路径 `…/tomcat/Java/jre/jre/bin/java`，
原因见 §10.5 —— **不是缺陷**）。

| 步骤 | 结果 |
|---|---|
| 0 环境 | macOS 12.7.4 ✅（注意：不是 13/14/15，结论不能直接外推） |
| 1 签名状态 | **这份运行时是 Eclipse Foundation 用 Developer ID 正规签名的**：`bin/java`、`lib/server/libjvm.dylib` 均为 `Authority=Developer ID Application: Eclipse Foundation, Inc. (JCDTMS22B4)`，带 `flags=0x10000(runtime)`（Hardened Runtime）与 `Timestamp`。`spctl -a -t exec -vv` 输出 `rejected (the code is valid but does not seem to be an app)` —— **"the code is valid"**，即签名有效，只是它不是 app bundle |
| 2 基线（无 quarantine） | `java -version` → `1.8.0_492` Temurin ✅ |
| 3 手工打 quarantine | **部分成功**：`bin/java` 等**可写文件被打上**（`0181;6A000000;Safari;…`）；**12 个只读文件（444）写不进去**（`LICENSE`/`ASSEMBLY_EXCEPTION`/`lib/cmm/*.pf`/`currency.data` 等）。⇒ 真实"下载+Finder 解压"时同理，**关键是"会被 exec 的可执行体"会带上属性** |
| 4 Terminal 直接 exec（带 quarantine） | `java -version` **正常输出** ⇒ Terminal 这条路径没被拦（此处用户看到一个"是否允许运行 Java"的弹窗，**出现在哪一步待确认**，见下） |
| 5 **LaunchAgent（launchd）拉起** | ❌ **没跑成**：脚本在 `set -u` 下 `local tag=… logd=…` 崩溃（`tag: unbound variable`，已修，见 §10.6） |
| 6 清属性后重试 | ❌ 同上未跑到 |

⚠️ **§5 才是关键问题**（launchd 会不会报 `155: Refusing to execute/trust quarantined program/file`）——
**目前仍无答案**，需要修好后重跑。

**待确认**：用户提到"有弹窗提示我是否允许运行 Java"。需要知道它出现在**哪一步**：
- 若在**第 1/2 步** ⇒ 那是 Gatekeeper 对"已签名但**未公证**"的 Mach-O 的首次执行检查；
- 若在**第 4 步**（打完 quarantine 之后）⇒ 说明 quarantine 确实门控执行、且**用户可以手动放行**（这本身很有价值）。

**一条对"未签名交付"有利的连带事实**：我们内嵌的运行时是**厂商用 Developer ID 正规签名 + Hardened Runtime** 的
（Temurin/Adoptium；Azul 同源）。也就是说我们的 `.app` 虽然"未签名"，内部却含**已签名**的嵌套代码 ⇒
Gatekeeper 对**嵌套二进制**的判定可能与"对未签名 app"不同，这会影响到 §10.1 ④ 的强度，**待 §5 实测**。
（是否**已公证**（notarized）目前无法从这些输出判定 —— `spctl` 对非 app 的二进制只回 "does not seem to be an app"。）

### 10.5 为什么路径是 `…/Java/jre/jre/bin/java`（不是缺陷）

见 [`跨平台运行时打包方案.md`](./跨平台运行时打包方案.md) **§13.14** 的完整查证。一句话：
**mac 平台有意发 JDK 归档**（`image_type=jdk`），`Java/jre/` 里装的是 **JDK 的 Home**，
所以 `bin/java` 与我们看到的那层嵌套 `jre/` **都在**，`JAVA_HOME` 能解析，包能起来。
2.02.87 的"真 JRE"形态是旧打包流程的产物，不是标准。

### 10.6 实测脚本已修（2026-10-12）

`macQuarantineTest.sh` 在 macOS 12.7.4 上于第 5 节崩溃（`set -u` + `local a=… b=$a` 同行展开），
导致最关键的第 5/6 节根本没执行。已修（拆成两行），并顺带：
样例路径 `lib/libjli.dylib` 在 JDK8 里实际位于 `lib/jli/`（改用 `find` 动态定位）；
打印"运行时形态（JDK Home/JRE）""是否存在嵌套 `jre/`"并在 JDK Home 时提示
"Tomcat 实际用的是顶层 `bin/java`、建议把第 2 个参数指向它"；macOS < 13 时提示本机结论不代表 14/15。
**提交**：sales `c8ef45c`。

## 11. 不确定 / 待实测项

1. **[TZ] Rosetta 时间线两条 Apple 新闻冲突**：`?id=w5ngl9k2`(2026-09-01) 说"支持到 macOS 27"；`?id=k1mtkt1k`(2026-09-09) 说 "macOS 26 is the final release supporting Intel Mac **and Rosetta**"。**以专门文章为准**，冲突未消解。
2. **[TZ] ATS × loopback 在 macOS 14+ 官方文档自相矛盾** ⇒ **必须 13/14/15 实测**。
3. **[TZ/C] `.DS_Store`/`__pycache__`/硬链接导致公证拒绝**：Apple 官方页未列，属 notary 日志经验。
4. **[TZ/C] 「zip 丢可执行位」**：Apple 只有 TN2206 关于 xattr 的一般性说明，无逐字明文。
5. **[TZ] 「SMAppService 必须 App 在 `/Applications`」**：未证实。
6. **[TZ] `postinstall` 以 root 运行**：由 `installer(8)` + Distribution XML `auth` + `pkgbuild --ownership` 间接推导。
7. **[TZ] `hw.optional.arm64`**：Apple 只文档化了 `hw.optional.<feature>` 机制（示例是 `avx512f`），`arm64` 这个 key 属社区惯例。
8. **[TZ] Time Machine 是否覆盖 `~/Library/Application Support`**：无 macOS 专页明文。
9. **调研环境限制**：`developer.apple.com` 在本机 `web_fetch` 被 DNS 拦（改用 `curl` 抓 Apple 的 `…page.md`/`…json` 端点取原文）；搜索引擎返回验证码、`github-mcp` 传输错误 ⇒ **社区侧（Stack Overflow / Apple 论坛）的一手交叉验证受限**。
10. **`--deep` 的 Apple 论坛帖（thread 129980）** 正文被反爬挡住，仅确认标题/URL（但 man page 与 TN2206 已足够定论）。
11. **`launchd` 的 quarantine 判定 Apple 从未文档化**（§10.1 ④ 的结论基于 `syspolicyd` 的 "general oracle" 表述 **[A]** + 真实 `155` 错误 **[C]**）⇒ **这是整个未签名方案能否落地的关键，必须真机实测（§10.3）**。
12. **未签名 `.pkg`** 的确切弹窗文案、"右键 pkg → 打开"是否有效、`spctl --assess --type install` 的拒绝串 —— **均无 Apple 出处**。
13. **Apple 无逐应用的 quarantine 清单**（Dropbox / OneDrive / 网盘客户端等未知）；quarantine 属性的 **flag 位语义是私有头文件**（`quarantine.h`），无公开规范。
14. 「**拖拽保留 quarantine**」与「未签名 App `register()` 的报错串」的直接证据主要来自 **Apple 论坛用户贴**（非 Apple 官方文档）。
15. 「**App 首启自清 quarantine**」（§10.1 ④b）是**我方建议，未实测**。
16. **`.dmg` 内的 `.pkg` 是自带 quarantine 还是仅 `.dmg` 带** —— 未验证，**直接影响要不要走 pkg 路线**。

---

## 12. 来源

- Apple 官方：[*Packaging Mac software for distribution*](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)、[*TN2206 Code Signing In Depth*](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)、[*TN2083 Daemons and Agents*](https://developer.apple.com/library/archive/technotes/tn2083/_index.html)、[*Hardened Runtime*](https://developer.apple.com/documentation/security/hardened-runtime)、[*Notarizing macOS software before distribution*](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)、[*SMAppService*](https://developer.apple.com/documentation/servicemanagement/smappservice)、[*Security entitlements*](https://developer.apple.com/documentation/bundleresources/security-entitlements)、[*About the Rosetta translation environment*](https://developer.apple.com/documentation/apple-silicon/about-the-rosetta-translation-environment)、[*Building a universal macOS binary*](https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary)、[*Porting your macOS apps to Apple silicon*](https://developer.apple.com/documentation/apple-silicon/porting-your-macos-apps-to-apple-silicon)、News [`?id=saqachfa`](https://developer.apple.com/news/?id=saqachfa)、News [`?id=w5ngl9k2`](https://developer.apple.com/news/?id=w5ngl9k2)、Support [102445](https://support.apple.com/en-us/102445) / [102527](https://support.apple.com/en-us/102527) / [mh40616](https://support.apple.com/guide/mac-help/mh40616/mac)。
- man page（Apple 原文，社区镜像 [keith.github.io/xcode-man-pages](https://keith.github.io/xcode-man-pages/)）：`installer(8)`、`codesign(1)`、`pkgutil(1)`、`launchd.plist(5)`、`launchctl(1)`、`lipo(1)`、`open(1)`、`ditto(1)`。
- JDK 厂商：AdoptOpenJDK 公证指南（2020-05，**带 `--deep`，勿照抄**）、Azul *The Notoriety of Zulu on macOS*、Adoptium support issue #1181、Oracle `jpackage` man、Adoptium / Oracle / Azul 下载页（体积实测）。
- 社区（标注为经验，非官方）：`create-dmg` / `dmgbuild` / `quickpkg`；`stat -f%Su /dev/console` + `launchctl asuser`。
