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
- **Mac 的启停脚本已经在仓库里且可追溯**：`WebRoot\web\sales\docsysStartScripts\Linux\` 的 **14 个 `.sh`**（`docsys_start.sh` / `docsys_stop.sh` / `docsys_restart.sh` / `start.sh` / `stop.sh` / `restart.sh` / `monitor_start.sh` / `monitor_stop.sh` / `tomcat_start.sh` / `tomcat_stop.sh` / `mysql_start.sh` / `mysql_stop.sh` / `docsys_upgrade.sh` / `gen_fonts.sh`），**与 2.02.87 发行包 14/14 逐字节一致** ⇒ **Mac 控制台不必自己拼 Tomcat 启动命令行**，直接驱动这套脚本即可，与命令行口径天然一致。
- `.sh` 的可执行位**由 `build_release.py` 显式写进 tar 头**（不依赖构建机文件系统）。

**待补问题**（测绘回来后填）：安装包如何消费 `docsys-mac-*.tar.gz`？控制台是**随包分发**还是**独立分发**？签名/公证在流水线里放在哪一步（JRE 一旦被 `build_release.py` 换过就必须重签 → **签名应在打包之后**）？

---

## 10. 待用户裁定

| # | 议题 | 选项 | 影响 |
|---|---|---|---|
| D1 | **是否有 Apple Developer 账号（$99/年）** | 有 / 没有 / 以后再说 | **决定用户体验的根本**：有 ⇒ 双击即装；没有 ⇒ 用户必须"系统设置 → 隐私与安全性 → 仍要打开"（Sequoia+ 无右键打开这条路），个人用户/非技术客户门槛高 |
| D2 | **目标架构** | 双架构单包（~86 MB）/ 两个包 / 只 x64（27 后失效）/ 只 arm64（弃 Intel） | 体积、流水线数量、用户体验 |
| D3 | **分发形态** | `.dmg` 内含 `.pkg`（最像 SFX）/ 纯 `.pkg` / `.dmg` 内含 `.app`（拖拽，最省事但不"安装"） | 是否要"双击即装"、是否要装到 `/Applications` |
| D4 | **控制台技术路线** | 移植 C++（取决于 UI 栈）/ 重写（Qt / SwiftUI / Tauri / Electron / JavaFX） | 工作量最大的变量，**等 §2** |
| D5 | **进程管理形态** | LaunchAgent（崩溃自恢复、GUI 退出仍在）/ GUI 直接 spawn | 可靠性与实现量 |
| D6 | **卸载** | macOS 无官方卸载 ⇒ 是否提供卸载脚本/App（对标 Windows `Uninstaller`） | 交付完整性 |

---

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

---

## 12. 来源

- Apple 官方：[*Packaging Mac software for distribution*](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)、[*TN2206 Code Signing In Depth*](https://developer.apple.com/library/archive/technotes/tn2206/_index.html)、[*TN2083 Daemons and Agents*](https://developer.apple.com/library/archive/technotes/tn2083/_index.html)、[*Hardened Runtime*](https://developer.apple.com/documentation/security/hardened-runtime)、[*Notarizing macOS software before distribution*](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)、[*SMAppService*](https://developer.apple.com/documentation/servicemanagement/smappservice)、[*Security entitlements*](https://developer.apple.com/documentation/bundleresources/security-entitlements)、[*About the Rosetta translation environment*](https://developer.apple.com/documentation/apple-silicon/about-the-rosetta-translation-environment)、[*Building a universal macOS binary*](https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary)、[*Porting your macOS apps to Apple silicon*](https://developer.apple.com/documentation/apple-silicon/porting-your-macos-apps-to-apple-silicon)、News [`?id=saqachfa`](https://developer.apple.com/news/?id=saqachfa)、News [`?id=w5ngl9k2`](https://developer.apple.com/news/?id=w5ngl9k2)、Support [102445](https://support.apple.com/en-us/102445) / [102527](https://support.apple.com/en-us/102527) / [mh40616](https://support.apple.com/guide/mac-help/mh40616/mac)。
- man page（Apple 原文，社区镜像 [keith.github.io/xcode-man-pages](https://keith.github.io/xcode-man-pages/)）：`installer(8)`、`codesign(1)`、`pkgutil(1)`、`launchd.plist(5)`、`launchctl(1)`、`lipo(1)`、`open(1)`、`ditto(1)`。
- JDK 厂商：AdoptOpenJDK 公证指南（2020-05，**带 `--deep`，勿照抄**）、Azul *The Notoriety of Zulu on macOS*、Adoptium support issue #1181、Oracle `jpackage` man、Adoptium / Oracle / Azul 下载页（体积实测）。
- 社区（标注为经验，非官方）：`create-dmg` / `dmgbuild` / `quickpkg`；`stat -f%Su /dev/console` + `launchctl asuser`。
