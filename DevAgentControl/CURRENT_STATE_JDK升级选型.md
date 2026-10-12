# CURRENT_STATE_JDK升级选型（工作卡）

> **状态：阶段 1 交付完成；本卡已于 2026-10-11 由用户重新启用为「当前任务」**（CLAUDE.md 的「当前任务」指针已改回本卡），
> 准备开工阶段 2。`## 下一步` 里有阶段 2 的入口清单。此前 2026-10-08 用户曾裁定"阶段 2 我准备后面再做"故暂停本卡。
>
> 阶段 1（JDK 8 + GraalVM CE 21.2 + GraalJS 替代 Nashorn）**已完成并三层验证通过**：
> 代码侧 共享 Engine / 权限收敛 / 默认翻转 graaljs；运行时侧 GraalVM CE 21.2；
> 应用侧 用户手动 4 次保存全走 GraalJS 零错误；**apply_changes 的 Java 移植路径已删除**（198 文件）；
> 测试树已收尾（24 个端到端测试改走唯一 JS 路径 + 删 107 个不可编译文件 + 术语清理 + 失败项如实标注）；
> 内存归因已完成（§6.4.14：1.5 GB 是未 GC 的 used，引擎常驻 220–260 MB）；
> **CJSContext 关闭问题已按方案 A 修复并验证**（异常路径 `try/finally` + 清 ThreadLocal，3 文件 +25/−5）。
>
> **已裁定暂不做**：C 阶段（删 nashorn 分支，8 类 ~60 处/3000+ 行，清单存档在"挂起"节）；
> nashorn/graaljs 保持**二选一互斥**（用户 2026-10-08 确认："二选一是我期望的"，不做自动降级）。
> **下一步 = 阶段 2（JDK 17 + Tomcat 9）**，稍后单独开工。
> 前置卡 `CURRENT_STATE_war打包.md` **已收尾**（导出可发布 `DocSystem.war` 并校验通过），已移入 `DevAgentControl/已完成/`。

## 已裁定（2026-10-07）

| 项 | 结论 |
|---|---|
| **D1 目标 JDK** | **JDK 17 + GraalJS 23.0.x**（用户确认） |
| **D2 运行时形态** | **形态 A：Oracle GraalVM for JDK 17（GFTC）**，接受"17 档持续引擎补丁由 GFTC 版本提供" |
| **D3 随产品分发** | **是**（替换 `tomcat\java\jre`）；义务：分发时**不得删改** Oracle GraalVM 的版权/商标声明 → 打包校验加一条 LICENSE/NOTICE 检查 |
| **D4 Tomcat 档位** | **Tomcat 9.0.x**（保持 `javax.servlet`，源码包名不动）；`10.1/11` 的 jakarta 全量迁移**另行立项** |
| **D5 spike 顺序** | **先做纯引擎 PoC（JDK 8 + GraalVM CE 21.2 跑 `sdk-all.js`），拿到兼容/性能数据再动 JDK**；PoC 结论只是预判，最终必须在 17 档重验一次（计划 §4.0）→ ✅ **已执行**（计划 §4.5） |
| **实施路径（2026-10-07 裁定）** | **两阶段**（计划 §6.4）：**阶段 1 = 引擎先行**（运行时用 **形态 C：GraalVM CE 21.2 / JDK 8**，JDK 与 Tomcat 都不动，只做 `CJSContext` 引擎工厂 + §5/§5.2 的 `ScriptObjectMirror` 改写 + golden 验证 → 出口即**可退役 JMergeEngine**）；**阶段 2 = 基础设施迁移**（换形态 A：Oracle GraalVM for JDK 17 + Tomcat 9.0.x + §6.2 整张清单）。**最终目标档位 D1（JDK 17）不变，变的只是到达顺序。** |
| **删除 Java 移植路径（2026-10-07 裁定）** | 用户"不再需要 apply_changes 的 Java 路径"→ 按既有方案 `docs/apply_changes移除Java路径修改方案.md` 执行；**并明确"先只删生产代码、测试那 132 个引用先不动，用户自己看过再决定"** |

## 下一步

**★ 版本计划（用户 2026-10-11）**：当前产品 = **8.7**；待发布 = **2.02.88**（改动多，含"**JRE 改用 GraalVM**"）。**阶段 2（JDK 17 + Tomcat 9）推迟到 2.02.89**。
因此 **2.02.88 的首要任务 = 跨平台打包**（在各目标 OS 上落实 GraalVM java8 运行时的可得性），且**本版允许放弃对部分平台的支持**。
关键事实（2026-10-11 核实）：GraalVM CE **java8** 只有 **Linux x64 + Windows x64**（21.2.0 起）；**macOS 只有 Intel x64**（止于 **21.0.0.2**，且比已复验的 21.2.0 旧）；**Linux/macOS aarch64（含 Apple Silicon、麒麟 ARM）从来没有** java8 版；**鸿蒙无 JVM**。
**平台裁定（2026-10-11）**：2.02.88 发 **Windows x64 / Linux x64 / 麒麟 x64 / Mac Intel / Mac Apple Silicon / 麒麟·Linux ARM64**（**鸿蒙**不支持，无 JVM）。
运行时 = **Win / Linux x64 / 麒麟 x64 用 GraalVM CE 21.2.0**；**Mac（Intel→Temurin 8 x64；Apple Silicon→Zulu 8 aarch64）与 麒麟·Linux ARM64（Temurin 8 aarch64）用 stock JDK8 + 随包 21.2.0 GraalJS jar** ⇒ **全平台统一 GraalJS 21.2.0**（JS 行为一致；差异只剩 JVM 性能，stock 上 ~3.2 s vs GraalVM ~1.3 s）。
原因：GraalVM java8 无 Mac/ARM 的 21.2.0 版，而 **21.0.0.2 的 GraalJS 21.0.0 在 xlsx 上与 21.2.0 行为不一致**（本机实测 cell 内容不同=5）→ 为保证跨平台一致，改用 stock JDK8 + 同一份 21.2.0 jar。
⚠️ **ARM/Mac 原生库审计（2026-10-11 完成）**：`lwjgl/freetype` 有 arm64/macos-arm64 ✅（**核心 Office 编辑/转换可用**）；`opencv/tesseract/leptonica/openblas` **代码零引用（未使用）** → 无影响；受影响的仅两个非核心功能 —— **"压缩包内查看"（`sevenzipjbinding` 无 arm64 → Apple Silicon / Linux ARM64 不可用；Mac Intel ✅）** 与 **"视频预览转码"（`ffmpeg` 无 macos → Mac 不可用，优雅降级）**。详见 `devDocs/跨平台运行时打包方案.md` §5-3。
复验数据与方案：`devDocs/跨平台运行时打包方案.md`（§8 复验结果 / §9 裁定 / §10 app 级预演）。
**app 级预演（2026-10-11）**：dev Tomcat 临时切 stock JDK8（8u162）→ 真实 UI 保存 3 文件（`.docx` ✅ / `.pptx` ✅ / `.xlsx` ❌=既有 AutoFilter `Qf` 缺陷），引擎=graaljs → **stock JDK8 配方应用级可行**；预演后已把 dev 运行时切回 GraalVM 21.2.0。

**★ 安装包结构裁定（用户 2026-10-11）：方案 B「通用 payload + 按 OS 外壳」** —— 起因：用户咨询"是否值得把 MySQL 从 `docs` 里拿掉以简化跨平台打包"。
- **现状实测**：`docs` 共 **1280 MB** = `tomcat` 1064 MB（含 `java/jre` 472 MB）+ **`mysql` 216 MB（17%）** + 顶层脚本；顶层 11 个脚本**全是 `.bat` + `sleep.vbs`（无 `.sh`）**；**两个原生件 `{JRE × MySQL}`** 才是"必须按 OS 分别打包"的根因，其余 ~600 MB payload 全平台通用。
- **关键事实**：**出厂默认库就是 SQLite**（`src/jdbc.properties` = `db.type=sqlite` / `jdbc:sqlite:${catalina.home}/DocSystem.db`）；**MySQL 不参与默认启动路径**（`start.bat` 只起 monitor+docsys，`mysql_start.bat` 才启 `mysqld`）；切库是纯配置（`docsys_start.bat` 用 `docSys.ini\jdbc.properties` 覆盖 classes 那份）；**driver 是纯 Java 且已随 WAR**（`mysql-connector-java-8.0.15.jar` 2.04 MB / `sqlite-jdbc-3.41.2.2.jar` 12.26 MB）→ **数据库选择与打包无关**，这正是用户"后续要支持其他数据库"的落点（加库 = 多一个 jar + 一个 `db.type` 值，不必重打包）。
- **裁定**：`docs` = **平台无关 payload（无 JRE、无 MySQL）** + **按 OS 外壳（JRE + 平台脚本）**；**默认 SQLite 开箱即用**；**MySQL 降为可选下载件**。⇒ 维护面从 `{JRE × MySQL}` 降为 `{JRE}`。**注意语义：交付仍是每平台一个包，简化的是"准备过程"。**
- **由此新增待办（方案 B 的必要组成，属仓库外 installer 脚本范畴）**：B-1 补 Linux/Mac 顶层 `.sh` 脚本；B-2 Linux/Mac 包改 `.tar.gz`（zip 丢可执行位/CRLF）；B-3 MySQL 可选件按 OS 单独打（symlink 可用解引用参数，但 `mysqld` 二进制本就按 OS 不同）；B-4 确认出货默认 `jdbc.properties`=SQLite 及 MySQL 启用 UX；B-5 `docsys_stop.bat` 按 `*\tomcat\java\jre\bin\java.exe` 杀进程，换 JRE 目录后需同步（`.sh` 版同理）。
- 详见 `devDocs/跨平台运行时打包方案.md` **§11**。

**★ Windows 侧跨平台打包可行性（2026-10-11，实测，方案文档 §12）** —— 用户实际需求：**不想再登 Linux 打包**，希望 Windows 上脚本化生成各平台包。
- **结论：可行，且可完全脚本化。** 三个"Linux 专属"阻塞点全部实测有解。
- **根因坐实**（现有包实测）：`docsys-linux-2.02.87.tar.gz` 有 **10 个符号链接**，其中 **8 个是 `mysql/lib/*.so`** → 正是"MySQL link 文件在 Windows 解压不正常"的来源；`docsys-mac` 包 **0 符号链接、0 MySQL**（Mac 已是方案 B 形态）；包内 `.sh` 一律 `-rwxr-xr-x`。
- **① 可执行位**：Git for Windows 规则 = **文件以 `#!` 开头即 755**（实测 `a.sh`→755 / `b.sh`(无 shebang)→644 / `c.txt`→755）；**Git 自带 GNU tar 1.35 如实写入 `-rwxr-xr-x`**，本仓库 14 个 `.sh` **全有 shebang** → 直接可用。⚠️ **Windows 内置 `tar.exe`（bsdtar 3.8.8）与 7-Zip 19.00 不可用**（只写 Windows 属性，bsdtar 给出 `-rw-rw-rw-` 且无 `--mode`）。
- **② 符号链接**：**不解压**即可 —— **Python `tarfile` 逐 member 转写实测完全保真**（`jdk-8u461-linux-aarch64.tar.gz`：入 `1 dir/365 files/2 symlinks` → 出同；mode `755/444/777` 与 linkname 全对，**不落盘**）。WSL 也可（本机 Ubuntu 2：GNU tar 1.35 + Python 3.12.3），但 ⚠️ **`/mnt/d`(DrvFs) 上 `chmod` 不落盘**（Windows 属性仍只有 `Archive`）→ WSL 路线须先拷进 ext4。
- **③ CRLF**：无问题（`core.autocrlf=false`、无 `.gitattributes`，14 个 `.sh` 实测 CRLF=0）。
- **推荐**：Python 单文件打包器（payload 逐 member 强制 mode + JRE 归档逐 member 加前缀移植）→ 纯 Windows、无 WSL/无管理员权限依赖；与方案 B 互补（去掉 MySQL 后 payload **符号链接归零**，唯一携带者是 JRE 且从不落盘）。自检：`tar -tzvf` 断言 `.sh` 为 `-rwxr-xr-x`。
- 事实补充：`docsysStartScripts` 属**主仓库的 submodule**（`WebRoot/web/sales`，gitdir 指向 `.git/modules/WebRoot/web/sales`）；该 submodule 当前有**未提交改动**（`M docsysStartScripts/Windows/*.bat` ×3 + 未跟踪 `docsys_start_hidden.bat`）——用户的 B-1 成果，注意别丢。~~`C:\docsysRel` 下的发布脚本全是 0 字节空占位~~ —— **2026-10-12 更正：该说法有误**，那个"0"是显示时按 MB 四舍五入的假象；实测 `buildDocSystem.bat`(4226 B)/`EncodeDocSystem.bat`(964 B) 等均为真文件且与仓库 HEAD 同源 ⇒ **它们是实际运行位置的副本，仓库改了脚本必须同步复制到 `C:\docsysRel\`**。

**★ Windows 侧打包器已实现并实测通过（2026-10-11，方案文档 §13）** —— 用户裁定「要，写 Python 单文件打包器，放仓库外 `C:\docsysRel\`」。
- **产物**：`C:\docsysRel\build_release.py`（仅标准库）→ 输出 `C:\docsysRel\dist\docsys-<platform>-<version>.tar.gz|zip`。（⚠️ **路径已于 2026-10-12 变更**：默认输出目录改为 `C:\docsysRel\ForReleaseBuild\dist`，旧 `C:\docsysRel\dist` 已整体删除，见本节末「产物目录归一」。）命令：`--list` / `--only X` / `--check-only` / `--compare <参考包>`。平台表已内置 6 个（linux / kirin-x64 / kirin-aarch64 / mac / mac-arm64 / win）。
- **实现要点**：每个成员**显式写 mode**（目录 755 / `*.sh` 755 / 其余 644）；运行时归档**绝不解压**、用 `tarfile` 逐 member 转写（mode/符号链接/硬链接保真）并**补齐祖先目录**；非 Windows 包剔除 `tomcat/Java` 与 **Windows 版 mysql**、丢弃顶层 `.bat/.vbs`、`tomcat/{work,temp,logs}`+`logs`+`tmp` **保留目录但丢内容**。
- **实测**：`docsys-mac` 1008.0 MB / 41 s、`docsys-kirin` 1004.7 MB / 41 s，**自检均 PASS**；**kirin 2 个符号链接原样保留**（`Java/jre/jre/lib/aarch64/server/libjsig.so -> ../libjsig.so`、`man/ja -> ja_JP.UTF-8`，路径与参考包一致）。
- **与现有 Linux 构建包逐条比对**：mac 29488 vs 29484、麒麟 29370 vs 29366，均 **+25 / −21**，且**每一条都已归因**：+25 = 2 个 Tomcat 自带文档 + **18 个 office 编辑器 2.02.88 新增的 Windows 孪生文件** + 2 张图片与 1 个俄文示例（**正确 UTF-8 名**，参考包是乱码版）；−21 = 14 个 `tomcat/work/**`（JSP 缓存）+ 4 个 `tomcat/temp` 残留（**有意清理**）+ 3 个乱码名。
- **重要结论 1（office 混装包 · 已更正）**：payload 的 office-editor **同时含 ELF 与 PE**（`FileConverter/bin/{docbuilder,x2t}`、`tools/{allfontsgen,allthemesgen}` = ELF；`bin/*.dll`、`docbuilder.exe`、`x2t.exe`、`tools/*.exe` = PE；另有常驻 PE `converter.exe` 78MB / `docservice.exe` 82MB / `metrics.exe` 31MB）。**初稿"版本差异、不裁决"的结论已推翻**：既有 mac/麒麟 包所缺文件与 `docsysReleaseScripts/Linux/PrepareLinuxPackage.sh` 的删除清单**一一对应** → **就是平台裁剪**（当时"参考包也带 3 个 PE"只说明裁剪不彻底，不能推出不裁）。
  - 现成清单（**两平台对称**）：`Linux/PrepareLinuxPackage.sh` 删 `bin/documentserver-generate-allfonts.bat`、`server/tools/*.exe`、`server/FileConverter/bin/*.dll`、`bin/*.exe`、`bin/HtmlFileInternal/*.dll` = **20 文件 / 87.7 MB**；`Windows/PrepareWinPackage.bat` 删 `libs/`、`.gitignore`、`README{,.en}.md`、`bin/documentserver-generate-allfonts.sh`、`FileConverter/bin/{x2t,docbuilder}`、`HtmlFileInternal/{HtmlFileInternal,libcef.so,libEGL.so,libGLESv2.so,libwidevinecdmadapter.so}`、`tools/{allfontsgen,allthemesgen}` = **8 文件 / 125.4 MB**。
  - ⚠️ **与用户 2026-10-11 口径冲突**："以后不对不同平台做裁剪"与现状矛盾，代价：**不裁则 Windows 包多带 125.4 MB Linux 原生件，Linux/Mac 包多带 87.7 MB Windows 原生件**。当前打包器按用户口径**不裁**（裁剪机制已移除）→ **与现有 Linux 产出不等价**，待裁定。
  - 另注：`docsysReleaseScripts/buildDocSystem.bat` 内还有一段**被注释掉**的更激进清单（当前禁用），它在共享 payload 上执行、与平台差异无关。
- **重要结论 2（字体库）**：payload 内**没有**字体库生成物（`sdkjs/common/AllFonts.js`、`server/FileConverter/bin/{AllFonts.js,font_selection.bin,fonts.log}`、`fonts/` 全不存在）⇒ **`CleanOfficeFonts.bat` 的排除要求在 payload 里已满足**。
- **重要发现 3（乱码）**：既有 Linux/mac 包中 3 个非 ASCII 文件名是**乱码**（CP437 字符实为 GBK 字节）；而仓库 / dev 部署树 / payload / `git ls-files` **四处都是正确 UTF-8**（`AI智能体.png`、`AI接入.jpeg`、`Изменение настроек таблиц по умолчанию.docx`）⇒ **他们现有 Linux 打包链路会破坏所有非 ASCII 文件名**，Windows 侧打包反而修好了；`AI智能体.png` 是 UI 引用图片，在 Linux/mac 上可能 404 —— 建议核实。
- **仍待补**：GraalVM CE 21.2.0 **Linux x64** tar.gz（`docsys-linux`/`kirin-x64` 需要）、Zulu 8 **macosx_aarch64**（`mac-arm64` 需要）、GraalVM **Windows** zip（`docsys-win` 有 optional 兜底）；**待裁定**：是否裁掉非 Windows 包里的 PE（≈190 MB+）；**需确认**：payload（`C:\docsysRel\docsys-Win-Release\docsys`）的应用部分是否就是 2.02.88 的部署结果。

**★ 实机冒烟包已产出（2026-10-12，方案文档 §14）** —— 经用户 2026-10-11 裁定「先按现状（不裁）打好包让我实机冒烟，之后再回头调」，10-11 夜间执行被用户中断，10-12 续做完成。
- **三个产物全部 PASS**：`docsys-mac-2.02.88.tar.gz` 29500 条目 / **1008.0 MB**；`docsys-kirin-2.02.88.tar.gz` 29382 / **1004.7 MB**（**2 个符号链接保真**）；`docsys-win-2.02.88.zip` 29498 / **1076.8 MB**。
- **Windows 包结构等价验证**：vs 现有 `docsys-win-2.02.87.zip`（29617 条目）**仅新包有 6 / 仅参考包有 144**；144 全是 `tomcat/logs/catalina.*.log`（旧运行日志，按"运行期产物不入包"有意清掉）；+6 = 新的 3 个启动脚本（`ConvertTo{Community,Personal}.bat`、`docsys_start_hidden.bat`）+ 名字正确的 2 张图片与 1 个俄文文档。
- ⚠️ **Windows 运行时不是 GraalVM（必须处理）**：payload 与 `docsys-WRE` 的 `tomcat/Java/jre` 实测**都是 Oracle JRE `1.8.0_162`**（240 文件 / 189.3 MB，`SOURCE` 含 `nashorn`、无 `graal-js`）；目标运行时 GraalVM CE 21.2.0 java8（`1.8.0_302`，含 `graal-js`/`truffle`/`jvmci` + `languages/`，359 文件 / 472.3 MB）**目前只在 dev 目录** `C:\TomcatForDocSysDev\docsys\tomcat\java\jre`。⇒ 把 `graalvm-ce-java8-windows-amd64-21.2.0.zip` 放进 `C:\docsysRel\jre\` 后重跑 `--only docsys-win` 即得正确包（脚本自动取归档内 `jre/` + 补 `release`）。
- **乱码根因已定位**：`Linux/PrepareLinuxPackage.sh` 里的 `unzip DocSystem.war` 在非 UTF-8 locale 下会把中文/俄文文件名转码坏（典型 `unzip` 编码问题）→ 修法 `unzip -O UTF-8` / `LANG=…UTF-8` / `jar xf`；**Windows 侧打包不经过这一步，天然正确**。
- **修掉一个真 bug**：`docsys-win` 分支 `KeyError('label')`（第 660 行应为 `platform["label"]`，只在"可选运行时缺失"这条分支触发，故 mac/kirin 从未暴露）；两份脚本已同步。
- **教训**：构建被打断会留下**截断归档**（本次 kirin 残留 769.2 MB / 11818 条目 / `tar` 退出码 1，正常应为 1004.7 MB / 29382 条目）→ 校验用 `tar -tzf | wc -l` 或 `--check-only`。
- 交付说明：打包器主用 `C:\docsysRel\build_release.py`，副本 `WebRoot/web/sales/docsysReleaseScripts/build_release.py`（sales submodule，**未提交**，连同用户自己的 3 个 `.bat` 改动一起留给用户）。

**★ 发布流程规范化（2026-10-12，方案文档 §15）** —— 用户设计了发布流程（① 编译带版本名 WAR ② 解压 `DocSystem/` ③ `EncodeDocSystem.bat` → `buildDocSystem.bat` ④ 压缩 zip 归档到版本目录 ⑤ 骨架+`DocSystem/` 放进 `docsys` 跑 `build_release.py` ⑥ 校验产物），要我评审可行性并定「打包用的 `docsys/` 放哪」。
- **评审结论：可行** ✅。骨架实测 = `C:\docsysRel\docsys-WRE\docsys`（**648 文件 / 415.2 MB**，`tomcat\webapps` **为空**、`tomcat\Java\jre`(Oracle 162) 与 `mysql\`(Windows 版) 都在、顶层 6 个社区版 `.bat`）→「骨架 + 放入 `DocSystem/`」成立。
- **目录裁定（推荐并已落地）**：单建 **`C:\docsysRel\ForReleaseBuild\`**，内含 `docsys\`(payload) + `jre\`(各平台运行时) + `dist\`(产物)。理由：① `docsysRel\` 里混着 `mxsdoc`/`docsys-WDK`/`proguard6.2.2`/`DocSystem-*.war`，发布源树放这里**易被误操作污染**；② 自包含、可整目录删掉重建；③ 打包器已把 `docsys` 加入索引跳过名单（否则每次为找运行时归档都要遍历 payload 的数万文件）。**已创建三目录并把骨架复制进 `ForReleaseBuild\docsys`**（648 文件 / 415.2 MB，9 秒）。
- **打包器 5 处调整**：① 默认路径改 `ForReleaseBuild\{docsys,jre,dist}`（旧 JRE 搜索路径保留，历史归档仍可被找到）；② **顶层启动脚本一律以 `docsysStartScripts\<平台>` 为准**——payload 顶层脚本不再入包（骨架的社区版 `restart.bat`/`startWithLog.bat` 不会混进商业版包），其它顶层非脚本文件会**告警列出**；③ **Windows 运行时改必填**（不再静默沿用 Oracle 162）；④ **payload 预检** `tomcat\webapps\DocSystem\WEB-INF\web.xml`（防漏做步骤 2~5），`--list` 显示就绪状态；⑤ 索引跳过 `docsys`/`mxsdoc`。
- **验证**：新代码 + 旧 staging 作 payload 重打 mac = **29500 条目 / 1008.0 MB / PASS，与旧产物完全一致（无回归）**；默认 payload（未放 DocSystem）打包被预检拦截（退出码 2）；`--only docsys-win` 因缺 GraalVM zip 被必填拦截（退出码 3，打印文件名+URL+sha256）。两份脚本哈希一致。
- **发现**：注意事项 #2 提到的 **`buildMxsDocJar.bat` 在 `C:\docsysRel` 与仓库里都搜不到** → 该补救步骤目前**无法执行**；建议在 `buildDocSystem.bat` 的 `move` 之前补 `if not exist "%CURRENT_DIR%\mxsdoc\com\DocSystem" mkdir "%CURRENT_DIR%\mxsdoc\com\DocSystem"`，即可彻底免除"必须保留 `mxsdoc`"约束。`mxsdoc\` 现有 13160 文件（含 `com\DocSystem\websocket`），且位于 `docsys\` **之外** ✅。
- **待确认**：步骤 4 的 `DocSystem.zip` 是**根级散文件**还是含 `DocSystem\` 目录（影响客户解压落点）。
- **退役旧目录的前置条件**：先把 `docsys-Linux-Release\{mac-JDK8\jre-mac.tar.gz, 麒麟aarch64-JDK8\jdk-8u461-linux-aarch64.tar.gz}` 搬进 `ForReleaseBuild\jre\`，再删旧目录（打包器当前仍在旧路径找到它们）。
- **`mxsdoc` 约束已解除（2026-10-12，用户裁定"解掉"）**：① `buildDocSystem.bat` 在 `move` 前加一行 `if not exist "%CURRENT_DIR%\mxsdoc\com\DocSystem" mkdir "%CURRENT_DIR%\mxsdoc\com\DocSystem"` ⇒ **不再需要保留 `mxsdoc`**；② **新增** `docsysReleaseScripts/buildMxsDocJar.bat`（独立补救：mkdir 守卫 + 搬运 + 打 `mxsdoc.jar` + 装进 `WEB-INF\lib`，并**兼容"classes 已在 mxsdoc、只差打 jar"的中间态**；用与 `buildDocSystem.bat` 相同的 `docsys-WDK\...\jdk\bin\jar.exe`，已确认存在）。
- **A/B 沙箱验证**（`mxsdoc` **故意不存在**，仿真 `DocSystem\{classes,classes-encoded,lib}` + `docsys-WDK` junction）：**A = 仓库 HEAD 原脚本 ❌**（`"...\websocket" still exist, mxsdoc.jar build Failed!`，`lib\mxsdoc.jar` 未生成 → 复现了用户担心的失败）；**B = 打补丁脚本 ✅**；**C = 独立补救脚本 ✅**（产物为真 zip，含 `META-INF/MANIFEST.MF` + `com/`）。两份脚本已同步到**实际运行位置** `C:\docsysRel\`（与仓库副本 SHA256 一致；已全目录搜索确认无其它副本）；沙箱已清理（junction 用 `rd` 只删链接，`docsys-WDK` 完好）。行尾统一为仓库约定 **CRLF / 无 BOM / 纯 ASCII**。
- ⚠️ **更正**：文档里"`C:\docsysRel` 下发布脚本全是 0 字节空占位"的旧说法**已推翻**（那是按 MB 四舍五入的显示假象）；实测 `buildDocSystem.bat` 4226 B、`EncodeDocSystem.bat` 964 B，且与仓库 HEAD **同源** ⇒ **它们是实际运行位置的副本，仓库改了脚本必须同步复制到 `C:\docsysRel\`**。
- **sales submodule 待提交清单（留给用户）**：`M docsysReleaseScripts/buildDocSystem.bat`（我的 mkdir 补丁）、`?? docsysReleaseScripts/buildMxsDocJar.bat`（新增）、`?? docsysReleaseScripts/build_release.py`（打包器副本）、`M docsysStartScripts/Windows/{docsys_restart,docsys_start,docsys_stop}.bat`（用户自己的）、`?? docsysStartScripts/Windows/docsys_start_hidden.bat`（用户自己的）。

**★ 运行时归档已全部就位 + `--list` 崩溃修复（2026-10-12，方案文档 §13.8 / §13.9）** —— 用户表示同意"把两份现有归档搬进 `ForReleaseBuild\jre\`、下载缺的三份、再跑 `--list` 确认"这个收尾计划，已执行完。
- **6 平台运行时 100% 就绪**（`--list` 六个平台全 `✓`）。`ForReleaseBuild\jre\` 现有 5 份归档：`graalvm-ce-java8-linux-amd64-21.2.0.tar.gz`（298,577,044 B）、`graalvm-ce-java8-windows-amd64-21.2.0.zip`（250,229,469 B）、`zulu8.96.0.205-ca-jdk8.0.504-macosx_aarch64.tar.gz`（103,714,410 B）、`jre-mac.tar.gz`（108,236,681 B）、`jdk-8u461-linux-aarch64.tar.gz`（75,457,440 B）。
- **三份缺失件已下载并校验**：GraalVM linux / win 两份 sha256 **与 §3 记录的官方值完全一致**；Zulu mac aarch64 的 sha256 与 **Azul 官方 metadata API 的 `sha256_hash`**（`58bb3c08…c3bb21b`）一致（其 CDN 不提供 `.sha256`）。⚠️ 取 Zulu 时**别用** metadata 返回列表里的 `-ca-fx-jdk8…` 变体（含 JavaFX），要 `-ca-jdk8…`。
- **归档内平台指纹（实测，读 `release` 文件）**：linux `1.8.0_302 / Linux / amd64 / GRAALVM_VERSION=21.2.0`、win `1.8.0_302 / Windows / amd64 / 21.2.0`、zulu `IMPLEMENTOR=Azul Systems, Inc. / Zulu8.96.0.205-CA-macos-aarch64 / 1.8.0_504 / aarch64`、jre-mac `IMPLEMENTOR=Eclipse Adoptium / 1.8.0_492 / Darwin / x86_64`（**正是裁定的 Temurin 8 x64** ✅）、jdk-8u461 `1.8.0_461 / Linux / aarch64`。
- **符号链接安全性扫描（本次新做的检查，防客户机断链）**：GraalVM linux 40 个链接 / jdk-8u461 2 个 / 其余 0 个；**"只取 `jre/` 子树"后越界链接数 = 0** ✅（GraalVM 那 4 个 `NOT-IN-jre` 都在顶层 `bin/`，本就不复制；`jre/bin/{js,lli,polyglot}` 的链接目标全部落在 `jre/` 内）。另实测确认 **GraalVM 归档 `jre/` 下没有 `release`，只有顶层 `<top>/release`**，与打包器 `also=["release"]`（从归档**根级**补文件）的语义吻合 ✅。
- **打包器缺陷 3（已修）**：`--list` 在中文 Windows 控制台（`chcp 936`）**必崩** —— `UnicodeEncodeError: 'gbk' codec can't encode character '\u2717'`（脚本用 `✓/✗/⚠️/▶` 作状态标记，这些码位不在 cp936 内），而且**恰好在"payload 未就绪"这条必经路径上复发**。修法：`log()` 出口加 `_safe_text()` —— 能整体编码就**原样返回**（Linux/UTF-8 行为不变），编不出才**逐字符**降级（`✓→OK`、`✗→!!`、`⚠→!`、`▶→>`、`U+FE0F→""`）；**刻意不用 `sys.stdout.reconfigure(encoding="utf-8")`**（那会让中文 Windows 下的中文输出全变乱码）。验证：GBK 控制台退出码 **0**；UTF-8 控制台 `✓/✗` 原样显示且路径正确；全脚本只有 `log()` 一处 `print`（无绕过）。两份脚本同步后 SHA256 `0bdc71babd5e1928141f1433ddaafbaa8ce30852808944f466246d95dee33227e`（历史：`5ef50199…` → 修 §13.10 三缺陷后 `352185db…` → 精简搜索列表后本次值）。
- **现在的唯一缺口**：payload 缺 `tomcat\webapps\DocSystem`（`--list` 显示 payload `✗ 缺 webapps/DocSystem`）⇒ 按 §15.2 步骤 1~5 放入即可开打。**`docsys-Linux-Release` 现在可以随时退役**（两份归档已搬走，删掉不影响打包）。
- **仍未裁定**：① ~~是否恢复"按平台裁剪"~~ → **已裁定「不裁」**（用户 2026-10-12 口径"以后不对不同平台做裁剪"；代价 Windows +125.4 MB、Linux/Mac +87.7 MB，见方案文档 §13.4）；② 步骤 4 的 `DocSystem.zip` 是根级散文件还是含 `DocSystem\` 目录；③ 放入 payload 的 `DocSystem` 是否确实是 2.02.88 的部署结果。

**★ 首次用真实 GraalVM 归档端到端验证 —— 又修掉 3 个真缺陷（2026-10-12，方案文档 §13.10）** —— 做法：注入最小桩 payload（只有 `webapps\DocSystem\WEB-INF\web.xml` + 1 文件 + 顶层 `start.bat`），跑 `--only docsys-linux --only docsys-win`，验证完**产物与桩目录全部删除**（已确认 `ForReleaseBuild` 下只剩 `docsys/ jre/ dist/`）。
- **为什么必须做**：这两条路径**此前从未真正执行过**（Windows 一直是"缺 GraalVM → optional 兜底用 payload 自带 Oracle JRE"，linux 的 GraalVM 归档刚拿到）→ **一跑就崩**。
- **缺陷 4（新）· Windows zip 路径直接崩**：`AttributeError: 'ZipInfo' object has no attribute 'isdir'` —— `ZipWriter.add_member()` 照抄了 `TarWriter` 的 TarInfo 接口（`isdir()/mode/mtime/issym()`），ZipInfo 没有（时间在 `date_time`、类型 `is_dir()`、权限在 `external_attr` 高 16 位）。修：改用 zipfile API + 权限回退 `dest_mode()`。**修复前该批次以退出码 5 中止，linux 产物连自检都没跑到。**
- **缺陷 5（新）· `also=["release"]` 静默失效**：补文件时拿成员**全名** `graalvm-ce-java8-21.2.0/release` 与 `"release"` 比，永不相等 ⇒ `Java/jre/release` **从未被补进包**（不报错）。修：按**剥层后**的 rel 名匹配（顺带允许 `also` 多个名字，原先首个匹配就 `break`）。
- **缺陷 6（新）· 重复条目**：① 打包器自己重复写祖先目录（`docsys/`、`docsys/tomcat/`）；② **源归档自带重复**（GraalVM 21.2.0 的 `jre/lib/graalvm/launcher-common.jar` 在 tar 里出现 2 次，1062 成员/1061 唯一，内容一致）。zip 规范对重名不友好（`zipfile` UserWarning）。修：两个 writer 统一按 dest「先到先得」去重。
- **修复后两项自检全 PASS**：linux 577 条目 / 577 唯一 / 36 符号链接/**悬空 0** / 202.6 MB；win 440 条目 / 157.6 MB（运行时 355 文件）。`jre/release` 都在：`1.8.0_302 / GRAALVM_VERSION=21.2.0`（linux `OS_NAME=Linux`、win `OS_NAME=Windows`）。
- **顺带确认**：根级 JDK `src.zip` 确实被丢弃 ✅；`jre/lib/**/*.src.zip`（GraalVM 各组件源码包，合计 9.5 MB）**保留**（属发行版内容）—— 我先前一次检查用 `endswith("src.zip")` 误报成"没丢"，已澄清。
- **搜索列表精简 + 目录清理（2026-10-12）**：用户确认可删 `C:\docsysRel\jre` —— 实测**完全空**（0 条目）→ **已删除**；打包器 `JRE_SEARCH_DIRS` 同步精简为 `[ForReleaseBuild\jre, C:\docsysRel]`（移除该已删目录 + 3 个已搬空的 `docsys-Linux-Release\{,mac-JDK8,麒麟aarch64-JDK8}`）。不存在的目录本来就会被安全跳过（`except OSError: return`），故**行为不变**——精简后**回归重打 linux + win 双双 PASS、退出码 0**（576/439 条目，符号链接 36/悬空 0）。顺手删掉 `C:\docsysRel\__pycache__`（上次会话把打包器当模块 import 留下的 `build_release.cpython-314.pyc`）。⇒ **`docsys-Linux-Release` 整棵目录现在都可以退役**（两个子目录已空）。
- **产物目录归一（2026-10-12，用户裁定"直接删掉、不留档"）**：`C:\docsysRel\dist`（旧默认输出目录；3 个包 = 修复前打包器 + 旧 payload，其中 win 包运行时还是 Oracle JRE）**已整体删除**，释放 **3,089.5 MB**。⇒ **产物只落在 `ForReleaseBuild\dist`**。⚠️ 该目录里现存的 `docsys-mac-2.02.88.tar.gz`（10-12 11:45，§15.3 的"无回归"验证产物）**同样是修复前产物**，等用户发话再删。方案文档 §13.1/§14 已同步（§14 改为"产物已删除、仅留档"）。
- **两点影响（下个会话必读）**：① **§14 那三份产物是修复前的打包器打的** —— mac/kirin 功能不受影响（`take=None`+`also=[]`，只是可能带重复条目），**`docsys-win` 必须重打**（现在 GraalVM Windows zip 已就位）；② **去重会改变条目数** ⇒ §13.3/§14 的"与参考包逐条一致"口径**不再逐条成立**（`--compare` 的少量 −N 是被去重的重复成员，不是丢文件），**以后以"自检 PASS + 关键路径断言"为准**。

**✅ 已完成（2026-10-07，用户裁定"删除"）：删除 107 个不可编译测试文件**

用户裁定：**删除**已删实现的内部单测 + 5 个不可救文件。按可复现口径执行：
删掉 office/test 下**所有 import 了已删 jmerge 子包**（`word`/`slide`/`cell`/`common`/`JMergeEngine`/`JMergeResult`）
的测试文件 → **共 107 个**，`git rm` 后剩余测试文件 **82 个**（原 189）。清单内已逐一确认包含那 5 个不可救的
（`TestJMergeJavaGolden2` / `TestJSlideIdResolver` / `TestJSlideIdResolverNewFixture` / `TestMultiSlideEngineE2E` /
`TestSlideGetFileDataOracle`）。**⚠️ 数量更正：是 107，不是我先前估的 101+5=106**（差 1）——
以后一律以"是否 import 已删子包"这个可复现口径为准，不用估算。

**提交**：office/test `dc0ed30`（107 文件删除 / −25866 行）；office `5b8c093c`（文档）；主仓库本条。

**验证**：剩余 **82 个测试文件一起整批编译**（测试 bin 目录排在 `WEB-INF\classes` 之前）→
**只剩 1 个错误，且是既有无关问题**：`DiagAdd.java:30` 的 `Pattern.compile("\"(\d+);([A-Za-z0-9+/=]+)\"")`
是**非法转义符**（Java 字符串字面量里 `\d` 不合法），不 import jmerge、与本轮删除无关 → **按"不修无关既有问题"原则未动**。

**`jmerge/bin` 保持不删**：删除后仍有 **15 个留下的测试**在用（`TestBinEnvelope`/`TestBinMemoryWriter`/`TestBinStreamReader`/
`TestJBinCommonWriter`/`TestIdSequenceOracle`/`TestIdSequenceOracle2`/`TestIdSequenceOracleW1`/`TestSlideIdSequenceOracle`/
`TestSlideIdSequenceOracleComplex`/`TestSlideRPrDecodeDiag`/`TestSlideRPrFlagDiag`/`TestT703XlsxGaps`/`TestW1ChangeOwners`/
`DiagW24Sections`/`DiagAFMeta`）→ 仍是"测试专用工具"，按用户原定条件（"如果没有用才删"）**不该删**。

**✅ 已完成第一步：24 个端到端测试改造为"唯一 JS 引擎路径"（2026-10-07）**

用户裁定：**测试代码保留**（用于与 x2t 输出对比），其中一部分改走 `FileConverter.convert`。实际做法 =
删掉 `JMergeEngine.setEnabled/markEditorCovered/clearCoveredEditors` 与相关 import（转换本来就已走
`FileConverter.convert`，被删的只是"强制 Java 路径"的开关）；**24 个文件全部编译通过**（stock javac 8u162）。

实测（GraalVM CE 21.2 运行时，缺省 graaljs；结果取自 stdout 汇总行）：

| 测试 | 结果 |
|---|---|
| W1 / W2 / W2_4 / 3（word golden） | ✅ 通过（W1/W2_4 打印 `[INFO] 包结构差异`，非断言项） |
| TestJSlideMergeGolden | ✅ 通过（zip 对比为信息性 `same=45 realDiff=12`） |
| TestComplexFixtureMergeGolden / TestTableImageFixtureMerge / TestSlideNashornBaseline / TestW1IdTrace | ✅ 通过 |
| **TestJsPathEngineCompare**（三端门） | ✅ `RESULT: OK mode=graaljs` |
| **TestJMergeJavaGolden**（word） | ❌ `realDiff=1`：`word/document.xml` 差 5 字节，**唯一差异 = `w:orient`**（JS 路径写 `portrait`，golden 写 `landscape`） |
| **TestJSlideMergeGoldenNew** | ❌ `通过=12 失败=3`（S-1/S-2/S-3 各 `realDiff=12`） |
| **TestT8XlsyMergeGolden**（cell） | ❌ 2 项：`[AfColor]` Tier1 schema 新错 + AutoFilter 定义与 golden 不一致 |
| **TestAutoFilterSmoke** | ❌ `convert ret=-2147216554`：`ReferenceError: "$" is not defined`（`CDoctRenderer_Private.ExecuteScript:564`，2 行脚本） |
| TestS3Diag | ⚠️ 无任何输出，**未定性** |

**已查清的两处**：
- **`w:orient` 差异（已完全解释，非引擎问题）**：同一 fixture 用 **stock JDK8 分别跑 nashorn / graaljs，产物完全一致**
  （都 `portrait`，都同一处失败）→ **不是引擎差异**。原始文档写 `orient="landscape"` 但 `w:h=16838 > w:w=11906`
  （实际是纵向），JS 路径按真实版面**规范化**为 `portrait`；`TestJMergeJavaGolden_W2_4` 里真正的横向节
  （`w=23811 > h=16838`）JS 路径输出 `orient=landscape` **正确**。→ 差异源于"golden 保留了自相矛盾的属性"，
  以前靠强制 Java 路径才字节一致。
- **`$ is not defined` 不是字体目录问题**：`TestAutoFilterSmoke`/`DiagAFMeta` 原先把 `gProcessPath` 指向
  **不存在的** `test/fonts/`（全仓库仅这 2 个文件这么写），已改为产品 bin 目录，**但报错不变** → 与字体目录无关，
  仍是未解项（疑似 sdkjs 的 AutoFilter 代码引用了浏览器端全局，**待查**）。

**⚠️ 未做**：`TestS3Diag` 为何无输出；上述 4 个失败项的定性；105 处 "Nashorn/Java 路径" 历史注释未清理（只清了代码引用）；
本项目**未提交**。

**`$ is not defined` 已定性（含一次自我更正）**：根因是**两个叠加的测试环境缺陷**，**不是产品缺陷**：
1. `TestAutoFilterSmoke` / `DiagAFMeta` 把 `gProcessPath`/`m_sFontDir` 指向**不存在的** `test/fonts/`
   （全仓库仅这 2 个文件），导致 `CFileBinary OpenFile() file does not exist: .../test/fonts/DoctRenderer.config`
   → **一个脚本都没加载**，`strScript` 只剩 `CDoctrenderer` 对 spreadsheet 无条件追加的那 11 字节
   `\n$.ready();`（`CDoctrenderer.java` 里 `if (m_strEditorType.equals("spreadsheet")) strScript += "\n$.ready();";`）
   → `ReferenceError: "$" is not defined`。已改为产品 bin 目录。
2. ⚠️ **classpath 遮蔽（重要教训）**：`WebRoot/WEB-INF/classes/.../office/test/` 下有 **237 个陈旧测试类**
   （IDE auto-build 写的），而我跑测试时把 `WEB-INF\classes` 排在测试 bin 目录**之前** → **跑的是旧类**，
   导致我第一次"改了字体目录仍然报 `$`"的结论**是错的**、以及第一次"三端/对比结果"里凡涉及这 2 个测试的
   结论都不可信。**正确顺序：测试 bin 目录必须在 `WEB-INF\classes` 之前。**
   重新用正确顺序验证：`m_sFontDir` 已是产品目录、`DoctRenderer.config` 不再缺失、`Doctrenderer.Init` 正常完成
   → **`$ is not defined` 消失**。用临时 dump 钩子（`-Ddocsys.script.dump`，已还原）实测确认了那条 11 字节脚本。

**更正后 AutoFilter 的真实现象**：`TestAutoFilterSmoke` 仍 `convert ret=-2147216554`，但错误已变为
**`TypeError: null has no such function "Qf"`（index=-1）**——与文档 §6.4.8 记录的 `null has no such function "lF"`
**同一族**（cell sdk 应用变更时炸）。即：**JS 路径在这类 AutoFilter 变更上会失败**，而 `TestT8XlsyMergeGolden`
的 `[AfColor]` 两项失败指向同一方向。⚠️ **尚未做决定性的产品级验证**：在 app UI 里真实改一次 AutoFilter 再保存，
看是否同样失败（这才能区分"fixture 是用别的 sdkjs 版本录的"还是"产品真有问题"）。

**已排除**：不是引擎差异（同 fixture 用 nashorn/graaljs 产物一致）；不是脚本缓存污染（office-editor 下无近期改动）；
不是字体目录（修正后错误变更为 TypeError）。`TestJSlideMergeGoldenNew`（`通过=12 失败=3`）与
`TestJMergeJavaGolden`（`通过=5 失败=1`，`w:orient`）**用正确 classpath 重跑结果不变** → 不是遮蔽假象，结论仍成立。

**🔴 重大发现：AutoFilter 变更在真实产品里保存失败（产品级复现，2026-10-07 18:22）**

按用户给的步骤做端到端复现：浏览器打开 mxsdoc → 用 `showOffice(gDocInfo,'openInArtDialog')` 打开真实编辑器
（也确认新窗口入口是 `/DocSystem/web/office.html?<buildRequestParamStrForDoc 的结果>`）→ 在 sdkjs 里调
`asc_addAutoFilter()`（`asc_isDocumentModified()` 返回 **true**）→ **关闭编辑器窗口** → 约 2 分钟后服务端触发保存。
`docsys.log` 原文（关键行）：

```
OFFICE: saveBinToOfficeFile() dockey:377630261 targetPath:.../377630261/output/ targetName:output.xlsx
【apply_changes】JS 引擎路径 eType:1 引擎:graaljs        ← 命中的正是被改造的那条路径
LOGGER_SPEED_LAP() compile/run/open ...
TypeError: null has no such function "Qf"
  at JSValueAccess.callMember(JSValueAccess.java:239)
  at CJSObject.call_func(CJSObject.java:139 / :115)
  at CDoctRenderer_Private.ExecuteScript(CDoctRenderer_Private.java:935)
  at CDoctrenderer.Execute(CDoctrenderer.java:957)
  at NExtractToolsStatic.apply_changes(NExtractToolsStatic.java:946)
CDoctrenderer.Execute(...) strError:<result><error index="-1" message="TypeError: null has no such function &quot;Qf&quot; ...
[error] DoctRenderer:<result><error index="-1" ...
【NExtractToolsStatic】fromInputParams() Success
OFFICE: OFFICE: saveDoc() convert bin to office failed      ← 保存转换失败
```

**证据链说明"不是 fixture 陈旧"**：这次用的是**我刚刚在浏览器里用当前 sdkjs 录的新变更**——
`.../377630261/data/changes/changes0.json` + `changes1.json`（各 180 B，18:22:09）；
失败后应用还自动留下诊断产物 `output/Failed_output.xlsx`(5068 B) 与 `ErrorChanges20261007182218/changes.zip`(508 B)。
与 `TestAutoFilterSmoke` 复现的是**同一条错误**（同一个 `Qf`），也与 §6.4.8 记录的 `lF` **同族**。

**影响判定**：**用户在产品里对 xlsx 添加/修改自动筛选后保存，转换会失败**（`saveDoc() convert bin to office failed`）。
失败时**没有覆盖仓库文件**（`rdata/JS调用测试.xlsx` 仍是 17:13:45 / 5068 B，未被本次写入）。

**⚠️ 尚未区分的关键问题**：这是**GraalJS 特有**还是**既有 JS 路径缺陷**？
- 已知：JS 路径代码本轮**一行未改**（只删了 Java 分支 + 翻默认引擎）；§6.4.8 记录的 `lF` 在 **nashorn 下同样出现**。
- 决定性实验：**用 nashorn 重跑同一条 UI 流程**。运行时可做——GraalVM CE 21.2 的 `jre/lib/ext/nashorn.jar` **存在**
  （`jre_orig_8u162` 也有），只需给 Tomcat 传 `-Ddocsys.office.jsEngine=nashorn`（`docsys_start*.bat` 无 JAVA_OPTS/setenv，
  需在启动进程内注入 `CATALINA_OPTS`）。
- 若 nashorn 同样失败 → **既有缺陷**（与本轮迁移无关，但产品已知问题）；若只有 graaljs 失败 → **迁移引入的回归**（严重）。

**🔴 结论（2026-10-07 18:28，nashorn 对照实验）：这是【既有缺陷】，不是 GraalJS 回归**

用 `CATALINA_OPTS=-Ddocsys.office.jsEngine=nashorn` 重启 dev 服务（**已在 JVM 命令行确认参数生效**），
重跑同一条 UI 流程（编辑器里加自动筛选 → 关窗 → 等后台保存）。`docsys.log` 原文：

```
【apply_changes】JS 引擎路径 eType:1 引擎:nashorn
LOGGER_SPEED_LAP() compile/run/open ...        ← run 单步 27476 ms（graaljs 时仅 120 ms）
<eval>:18937 TypeError: null has no such function "Qf"
  at jdk.nashorn.internal.runtime.ECMAErrors.typeError(ECMAErrors.java:213/185/172)   ← 栈帧证明跑的是 Nashorn
  at NExtractToolsStatic.apply_changes(NExtractToolsStatic.java:946)
CDoctrenderer.Execute ... strError:<error index="-1" message="TypeError: null has no such function "Qf" [stack: jdk.nashorn.internal.runtime...
OFFICE: saveDoc() convert bin to office failed
```

→ **同一条 `Qf` 错误、同样保存失败**，只是引擎不同。因此：
1. **AutoFilter 变更保存失败是 JS 路径的既有缺陷**（与本轮 GraalJS 迁移无关；JS 路径代码本轮一行未改）。
   修它要动 `sdkjs`（前端代码）或找出该变更为何让 `null` 调 `Qf`，**属独立立项**。
2. **佐证迁移收益**：同一操作 nashorn `run` 单步 **27476 ms**，graaljs **120 ms**（差 200+ 倍）。
3. **迁移结论不受影响**：GraalJS 没有引入这个缺陷。

**环境已恢复**：实验后已用 `docsys_start_hidden.bat` 重新以**缺省（graaljs）**启动，
并在 JVM 命令行确认**不含** `docsys.office.jsEngine` 参数（PID 27096、HTTP 200）；临时包装脚本与 mark 文件已删。

**✅ 已完成：测试收尾（术语清理 + 失败项如实标注，2026-10-07）**

用户裁定做"105 处历史注释 + 4 个失败项断言对齐"。实际执行：

1. **术语清理**（19 个文件，commit `bf47cb7`）：`Nashorn 路径` / `Java 路径` / `JMergeEngine` 等已过期说法
   统一改为 **`JS 引擎路径`**（现在只有一条路径且默认 graaljs）；并删掉 **12 行"开关已删除、内容已是假话"的日志**
   （如 `Log.debug("【TestJMergeJavaGolden】Java 路径已启用 …")`）。
   **类名/文件名里的 Nashorn 保持不变**（`TestSlideNashornBaseline`/`TestT8NashornTrace`）——改名会牵动
   tmp 输出目录与文档引用；`js.nashorn-compat` 这类真实 API 选项名也不动。
2. **`DiagAdd.java:30`** 修掉非法转义符（Java 字符串里 `"\d"` 不合法）→ 改用字符类 `[0-9]`。
   它是"整批编译"此前唯一的不通过项（既有问题，与本轮删除无关）。→ **82 个测试文件整批编译 exit 0**。
3. **4 个失败项（不掩盖真实信号）**：
   - `TestJMergeJavaGolden` → **转绿**：`word/document.xml` 唯一差异是 `w:orient`（JS 引擎 portrait / golden
     landscape，差 5 字节），已实测排除引擎因素（同 fixture 用 stock JDK8 跑 nashorn 与 graaljs 产物**完全一致**），
     成因是原文 `orient="landscape"` 与其 `w:h>w:w` 纵向版面自相矛盾、JS 引擎按真实版面规范化 →
     **带完整理由**加入 `KNOWN_BENIGN_DIFF`，现 `[PASS] 6 项通过`。
   - `TestAutoFilterSmoke` / `TestT8XlsyMergeGolden([AfColor])` → **故意保持失败**，加注释指向缺陷卡
     （AutoFilter 既有缺陷）。**不加白名单掩盖**。
   - `TestJSlideMergeGoldenNew` → **已定位到具体差异点并单独立卡**（见下方挂起清单），测试保持失败、不加白名单。

**⚠️ 教训（已踩两次，务必记住）**：用 `@'...'@ | python -` 这种**管道传脚本**时，PowerShell 会破坏
**非 ASCII 字符**（我的替换文本 `JS 引擎路径` 变成了 `JS ????`，一版注释被写坏后已回滚）。
**必须把脚本写成 UTF-8 文件再 `python <file>`**；另外批量文本替换**绝不能碰标识符/类名**
（第一次过宽的替换把 `TestSlideNashornBaseline` 改成含空格的非法标识符，已回滚重做）。

**fixture 说明（用户 2026-10-07 澄清）**：那个"被覆盖的 fixture"是**用户自己回退的**，内容已确认与 HEAD 一致，
应是某次不小心重新生成导致；**没有问题**。后续如需重新生成参照文件，可以用 **x2t** 重录。

**② ✅ 已完成：重启 dev 服务让新类生效（2026-10-07 17:30）**

`docsys_restart.bat`（后台隐藏窗口）；旧 PID 39460 退出 → 新 PID **16916**（17:30:23 启动，运行时仍是 GraalVM CE 21.2 / 1.8.0_302）。
启动证据：`Server startup in 40377 ms`（在历史区间 28.6–259 s 内）、`/DocSystem/` **HTTP 200**、`docsys.log` 尾部 `docSysInit() End docSysInitState:0`。
部署核对：`WebRoot/WEB-INF/classes/.../NExtractToolsStatic.class` 含新日志串、**不含 `JMergeEngine`**；
`classes/.../doctrenderer/jmerge/` 下只剩 `bin` 的 8 个 class；
**扫过 `WEB-INF/lib` 全部 jar，无任何 jar 含 `NExtractToolsStatic` 或 `jmerge/{word,slide,cell,common}/`**（确认不会遮蔽）；
`mxsdoc.jar` 已不存在（符合"开发期删 jar 用源码"的约定）。
→ 无需 UI 触发即可确认：日志标签会在下次 apply_changes 时以新文案出现。

**③ C 阶段（删 nashorn 分支）**：**用户 2026-10-07 裁定暂不做**（调研已完成、清单在"挂起"节；改动量 8 类 ~60 处、
3000+ 行，收益不足）→ **保留现状**：默认 graaljs ＋ `docsys.office.jsEngine=nashorn` 作显式回退。

**④ 阶段 2**：Oracle GraalVM for JDK 17 + Tomcat 9.0.x + 计划 §6.2 整张清单。

**✅ 已完成：删除 apply_changes 的 Java 移植路径（计划 §6.4.12，2026-10-07）—— 用户要求"降低系统复杂度"**

用户裁定：① 改掉会误导的日志标签；② **删除 apply_changes 的 Java 路径代码**。按既有方案
`docs/apply_changes移除Java路径修改方案.md` 执行。

| 项 | 结果 |
|---|---|
| `doctrenderer/jmerge/**` | **删 198 文件 / 2.43 MB**（word 114 + slide 62 + cell 18 + common 2 + `JMergeEngine`/`JMergeResult`） |
| `jmerge/bin/` 5 文件 | **保留**（纯流工具、生产不用、oracle/trace 族测试依赖） |
| `NExtractToolsStatic.apply_changes()` | 删 Java 调度块（原 934–960）；JS 路径"拷图片 + 打包 changes.zip"仍在（现 979–990），**未丢功能** |
| 误导标签 | `【JMergeEngine】Nashorn 路径` 随类消失；**同位置补准确的** `【apply_changes】JS 引擎路径 eType:<n> 引擎:<mode>` |
| 旧 `.class` | 清理 1394 个残留 class，保留 `bin` 的 8 个 |
| 保留的 `jmerge.*` 字符串 | `CDoctRenderer_Private` 的 `jmerge.oracle{,2,3}` 钩子、`NExtractToolsStatic` 的 `jmerge.getFileDataDump`（纯 system property 名、不引用 Java 类）→ 名字过时但不改（改名会连带改测试，而测试本轮不动） |

**验证（两道门全绿）**：13 项冒烟 **nashorn 13/13 + graaljs 13/13**；
三端真实转换 **word/slide/cell 全部 IDENTICAL-MODULO-TIMESTAMPS**（内容不同 0）
→ 证明"删掉那个 flag-off 恒 no-op 的分支"对 JS 路径**行为零影响**。

⚠️ **副作用（用户已知情）**：**office/test 132 个文件编译不过**。本轮回归用其**临时副本**跑的
（`test/tmp/JsPathEngineCompare/patched/`，只摘掉 `import` 与 `setEnabled(false)` 两处），
**仓库内测试文件一个未改**；`git status` 里 test 仓库的改动只有那个**既有的、被覆盖过的 fixture**。

**✅ 已完成：真实转换三端验证（内容一致）**（计划 §6.4.6）

首次真实执行 `open → applyChanges → getFileData → x2t`（`JMergeEngine.setEnabled(false)` 强制走 JS 路径，
唯一变量 = `-Ddocsys.office.jsEngine`）：

| 端 | nashorn | graaljs | 倍率 | ZIP 条目 | 内容一致 / 仅时间戳 / 内容不同 |
|---|---|---|---|---|---|
| word（W1段落属性全家桶） | 35.6 s | **12.8 s** | 2.8× | 14 | 13 / 1 / **0** |
| slide（商业计划书） | 33.8 s | **14.9 s** | 2.3× | 59 | 58 / 1 / **0** |
| cell（复杂修改测试） | 97.9 s | **19.6 s** | **5.0×** | 13 | 12 / 1 / **0** |

六次运行全部 OK、无异常；"仅时间戳不同"的条目三端都是同一个 `docProps/core.xml`。
→ 判定 **IDENTICAL-MODULO-TIMESTAMPS**。

- 复现：`test/tools/run_js_path_engine_compare.ps1`（`TestJsPathEngineCompare.java`，三端参数化）。
- **方法学更正**：§4.2 的"逐字节一致"**不可达**（OOXML 天然带保存时刻，同引擎跑两次也不同），
  判据已改为 **"时间戳归一化后逐字节一致"**，且比较必须落到 **ZIP 条目级**
  （只看整文件哈希/大小会误判：大小会因时间戳内容的 deflate 长度漂移 ±2 字节）。
- 顺带修掉真实缺陷：`CJSObject.getNative()` 需 `JSValueAccess.unwrapHost()`
  （GraalJS 把宿主对象包成 `Value` 返回，`instanceof CJSEmbedObject` 不成立 → NPE）。

**阶段 B 触发条件盘点**：

| 条件 | 状态 |
|---|---|
| 三端内容一致（时间戳归一化） | ✅ 已满足 |
| **运行时切到 GraalVM（形态 C）** | ✅ **已做（2026-10-07）**——开发服务器 `tomcat\java\jre` 已换成 GraalVM CE 21.2，旧 JRE 备份为 `jre_orig_8u162`，脚本一行未改 |
| 权限收敛（风险 11） | ✅ **已做**（`EXPLICIT` + 2 个 `@Export`；删掉 classLookup/IO） |
| 共享 `Engine` | ✅ **已做**（`JSEngineFactory` 静态共享 Engine） |
| 共享 `Source` / 缓存 | 不需要（实测共享 Engine 即够，`CDoctRenderer_Private` 未动） |
| **默认引擎翻转为 graaljs** | ✅ **已做（2026-10-07）**——`DEFAULT_MODE = graaljs`，nashorn 退居显式开关 |
| **应用侧端到端（真实 UI 保存）** | ✅ **已做（2026-10-07）**——用户手动 4 次保存，全部走 GraalJS、`strError` 全空（§6.4.11） |

→ **阶段 B 全部完成（代码 / 运行时 / 应用三层）**。**C 阶段已裁定暂不做**，后续只剩阶段 2（JDK 17 + Tomcat 9）。

**✅ 已完成：app 内端到端验证（2026-10-07，用户手动 4 次保存）—— 计划 §6.4.11**

三条取证把"app 里到底跑了哪个引擎"钉死了：

1. `docsys.log` 里 `【JMergeEngine】Nashorn 路径 (enabled=false covered=true eType=…)` **4 次** → Java 移植路径不接管，回退 JS 引擎；
2. `CDoctrenderer.Execute(String strXml, …)` 全日志 **4 次**（每次保存一次），`strError` **非空 0 次**；
3. `jcmd GC.class_histogram`：**大量 `com.oracle.truffle.js.*`**（`JSReadCurrentFrameSlotNodeGen` **288 万实例/115 MB** 等），**`jdk.nashorn.*` 一个都没有** → **确认跑的是 GraalJS**。

| # | 时间 | 文档 | eType | run | save 总计 |
|---|---|---|---|---|---|
| 1 | 17:10:44 | MxsDoc产品介绍.docx | 0 DOCT | 781 | 3008 |
| 2 | 17:12:11 | MxsDoc产品介绍.pptx | 2 PPTT | 174 | 1177 |
| 3 | 17:12:47 | JS调用测试.xlsx（第 1 次） | 1 XLST | **906** | **2063** |
| 4 | 17:13:40 | JS调用测试.xlsx（第 2 次） | 1 XLST | **200** | **1178** |

- **共享 Engine 的生产实证**：#3 vs #4 同文档同类型 → `run` **906→200 ms（4.5×）**、合计 **2063→1178 ms（省 885 ms / 43%）**，
  与 §6.4.8 探针预测吻合。
- **内存实测（风险 20）**：`jcmd GC.heap_info` → ParOldGen **1537 MB / 2713 MB（55%）**、Metaspace 117 MB。
  Truffle AST 常驻堆规模很大；当前 dev 无 `-Xmx`（上限约 4.8 GB）尚有余量，
  ⚠️ **交付前必须核对 `-Xmx`**，设小值会成为瓶颈。
- **未解释的一处**（已如实标注、未下结论）：第 2 次 slide 包 `run` 仅 174 ms，远快于探针冷载约 3.8 s，而全日志只有这 4 次 Execute。
- **两处顺带发现**：① `JMergeEngine.java:127` 日志标签仍是 `【JMergeEngine】Nashorn 路径`，
  但这条分支现在跑 GraalJS，**排查时会误导**，建议改文案；② 每次保存都伴随
  `executeCommonActionList() failed actions:1`（紧跟 `TextSearch was Disabled`），看着与保存无关，**未定性**。

**✅ 已完成：默认引擎翻转为 graaljs（计划 §6.4.10，2026-10-07）**

- `JSEngineFactory.DEFAULT_MODE = graaljs`；未设置 → graaljs；`nashorn` → 回退路径；
  **拼错/无法识别 → 回落 DEFAULT 并打一次性告警**（不静默）。
- **连带修掉三个"翻转默认值会静默引入"的陷阱**：
  1. 两个 runner 的"nashorn 腿"原本靠**不传属性**取 nashorn，翻转后会静默跑成 graaljs、基线失去意义
     → 两条 runner 的 nashorn 腿都改为**显式** `-Ddocsys.office.jsEngine=nashorn`。
  2. `JSEngineFactory.create()` 在新缺省下是错误 API（返回 JSR-223 包装引擎，数组/Uint8Array 取不到）
     → 加一次性告警并保留返回值（保住 `TestJsValueProbe` 的两引擎对照能力）。
  3. `createGraalContext()` 失败由每次打印改为 `warnOnce`，文案明确"office 转换的 JS 路径将不可用"。
- **不做"失败自动退回 nashorn"**：那会把"运行时/classpath 配错"变成静默的性能回退（18–20 s/篇）；
  本任务已吃过两次静默失败的亏（未导出字段静默 `undefined`、运行时 jar 静默遮蔽 `WEB-INF/lib`），故选择**显式失败 + 告警**。
- **新增部署约束**：缺省 graaljs ⇒ 运行时必须是 GraalVM（或 classpath 上有 GraalJS）；
  换回 stock JDK 8 时 GraalJS 只能解释执行，须显式 `-Ddocsys.office.jsEngine=nashorn`。已写进类注释。
- **验证**：显式 nashorn 13/13、显式 graaljs 13/13、**不带属性（新缺省）** `mode resolved: graaljs`
  且 13/13；缺省路径真实转换与 nashorn 基线 **IDENTICAL-MODULO-TIMESTAMPS**；
  完整双引擎三端回归 word 32.5→13.2 s、slide 34.0→14.9 s、cell 70.8→18.5 s，三端全一致；
  dev 服务在 graaljs 缺省下重启成功（`Server startup in 31557 ms`、`/DocSystem/` 200）。

**✅ 已完成：运行时切换到 GraalVM CE 21.2（计划 §6.4.9，2026-10-07）**

⚠️ **先纠正一个事实**：开发环境有**两棵**安装树，此前描述说错了角色——
`C:\TomcatForDocSysDev\docsys`（**正在跑的开发服务器**，`webapps\DocSystem` 是指向 `D:\Dev\DocSys\WebRoot` 的 junction，
脚本是 `docsys_*.bat`）与 `C:\docsysRel\docsys-WDK\docsys`（**构建/发布工具树**，测试脚本的 nashorn 基线靠它的 `jdk`）。
我最初检查的是后者，而真正在跑的是前者。

- **做法**：`docsys_stop.bat /q` 停机 → `tomcat\java\jre` 改名 `jre_orig_8u162` 备份 →
  复制 GraalVM `jre\*`（354 文件 / 471.9 MB）→ 补 `release` 与许可声明。**脚本一行未改，编译 JDK 未动。**
- ⚠️ **为什么原地替换是唯一安全选项**：`docsys_stop.bat`／`docsys_restart.bat` 靠
  `ExecutablePath -like '*\tomcat\java\jre\bin\java.exe'` **匹配路径**杀进程——原地替换路径不变所以照常工作；
  当初的"并排放 `graalvm-jre`"方案会让这两个脚本**匹配不到进程**。
- **Graal JIT 无需额外参数**：实测 `EnableJVMCI`／`UseJVMCICompiler` **默认都是 `true`**（stock 8u162 连这两个 flag 都没有）
  → **不加 `JAVA_OPTS`**。
- **回滚**：删掉新 `jre`，把 `jre_orig_8u162` 改回 `jre`（脚本无需回改）。
- **验证**：13 项冒烟 nashorn 13/13 + graaljs 13/13（用已安装运行时）；三端真实转换
  word 32.1→13.0 s、slide 32.4→14.4 s、cell 68.8→18.7 s，全部 IDENTICAL-MODULO-TIMESTAMPS；
  开发服务 `Server startup in 28878 ms`，`/DocSystem/` **HTTP 200**，office-editor `native.js` 200 / 9829 字节（与切换前一致）。
- **顺带发现（既有噪声，非本次引入）**：Tomcat 7 启动期大量
  `ClassFormatException: Invalid byte tag in constant pool: 19`（Java 9+ 的 `CONSTANT_Module`）。
  实测**自 2026-09-30 就存在**，涉及约 **90 个 jar**；我们的 4 个 GraalJS jar 只贡献 6 行；
  Tomcat 跳过这些条目的注解扫描后继续，不影响运行，阶段 2 换 Tomcat 9 后消失。

**✅ 已完成：阶段 B 代码侧两项改动（计划 §6.4.8，2026-10-07）**

1. **共享 `Engine`**：`JSEngineFactory` 新增静态共享 Engine（懒建、进程级单例、永不 close），
   `createGraalContext()` 改用 `.engine(sharedGraalEngine())`。
   实测（**每场景独立 JVM**，注意第一次同 JVM 连跑被 JIT 预热污染）：
   稳态载入 slide **1215→251 ms**、word **1386→223 ms**、cell **1486→334 ms**（每篇省约 1 s）；
   4 线程 × 4 次并发 16 次转换墙钟 **14808→7051 ms（2.1×）**，**零异常**；
   内存无实质差异（214–240 vs 217–244 MB）；**冷启动不受益**（两边都约 4 s）。
   否掉了"复用 Context"方案（稳态 232 ms 相当，但会串上一篇文档的 JS 全局状态）。
2. **权限收敛**：删掉 `allowHostClassLookup`/`allowIO`；`HostAccess.ALL` → **`EXPLICIT`**，
   只给 `CJavaEmbedBinder.create/invoke` 加 `@HostAccess.Export`。
   **为什么只需 2 个注解**：JS 拿到的是我们建的 JS wrapper，其成员是 JS 闭包（闭包再调 `JavaCreateEmbed.invoke`）；
   embed 实例（`__nativeEmbed`）只被 Java 侧 `CJSObject.getNative()` 读，sdkjs 里 `__nativeEmbed` **0 处**
   → JS 能触达的宿主对象**只有 `JavaCreateEmbed` 一个**。

**门禁**：13 项冒烟 **nashorn 13/13 + graaljs 13/13**；三端真实转换 word/slide/cell 全部
**IDENTICAL-MODULO-TIMESTAMPS**（内容不同 0）。耗时 word 12.78 s、slide 14.56 s、cell 18.76 s。

⚠️ **一处需要澄清的"假警报"**：cell 端日志有 `TypeError: null has no such function "lF"` ＋
`AVS_FILEUTILS_ERROR_CONVERT_CORRUPTED`。与 **nashorn 基线日志逐字比对**后确认**此前就存在**
（同样的 `index="35"`），是 xlsx fixture 里两端都拒绝的变更项，与本次改动无关，且**两端产物仍一致**。

**顺带关闭/新增的结论**：

- **编译期 JDK 不用换**（用户提问）：① 实测 stock javac **8u162** 能编译阶段 1 全部 8 个类、产物 major=52；
  ② GraalJS 的 jar 主体都是 Java 8（`module-info`/`META-INF/versions/*` 在 8 下不参与解析）；
  ③ 编译 JDK(8u162) ≤ 运行 JDK(8u302) 是**安全方向**，且默认 nashorn 回退路径要求用旧 javac。
  GraalVM 的 `jre/` 里**没有 `javac.exe`**，4 个启动脚本统一指向 `%CATALINA_HOME%\java\jre`
  → **换运行时不用改脚本、也碰不到编译 JDK**。
  ⚠️ 唯一未验：Eclipse/JDT（ECJ）编译（手边无 ecj；风险低）。
- **`js.nashorn-compat` 的真正价值**：实测开 compat 后全局对象面与真 Nashorn 8u162 **16 项全一致**
  （连 `Map`/`Set`/`Symbol`/`Proxy`/`Promise`/`Object.assign`/`Array.from` 都同为 undefined）；
  **不开则 sdkjs 会突然看见一批 Nashorn 下不存在的 ES6 全局** → 它不是"顺手加的开关"。
- **icu4j/Intl 风险关闭**：`Intl` 在 GraalJS（compat 与默认）与 Nashorn 下**都不存在**，我们从不依赖 ICU 路径。
- **新风险 19**：切运行时后 GraalVM 的 `jre/languages/js/graaljs.jar` 与 `WEB-INF/lib/js-21.2.0.jar` 并存，
  **boot classpath 优先** → 将来换 GraalVM 版本而忘了同步 `WEB-INF/lib` 时实际生效的是运行时那份，易误判。
- **新风险 20**：共享 Engine 是官方"实验特性"，且引擎级代码缓存随脚本集增长；需补测三端同时使用的内存曲线。

**第 1 步（引擎获取收敛 + 冒烟）已完成**（计划 §6.4.1）：

- 新增 `doctrenderer/NSJSBase/JSEngineFactory.java`（开关 `-Ddocsys.office.jsEngine=nashorn|graaljs`，缺省 nashorn 且逻辑与改造前逐句等价）；
  `CJSContext` 构造器改为 `JSEngineFactory.create()`。
- 冒烟（真实生产类）：**nashorn 缺省模式 PASS=10/FAIL=0（行为不变 ✅）**；**graaljs 模式 PASS=7/FAIL=3**。
- 复现：`test/tools/run_cjscontext_engine_mode.ps1`（`TestCJSContextEngineMode.java`）。

**第 2 步（适配层）：已完成基础部分，双模式全绿**（计划 §6.4.3）

- 新增 `NSJSBase/JSValueAccess.java`（引擎无关的值访问层，20 个静态方法，按
  `ScriptObjectMirror` → `Value` → `Map/List` 三级分派）。
- 改造 `JSEngineFactory`（新增 `createGraalContext()`）、`CJSContext`（新增 `graalContext` 后端 +
  `convertGraalValue()` + 六处按后端分支）、`CJSObject`（6 处 cast）、`CJSArray`（6 处 cast）、
  `CJSValue`（5 个转换/判定方法加 `Value` 分支）。
- **回归门已绿**：`tools/run_cjscontext_engine_mode.ps1` → **nashorn PASS=10/FAIL=0（行为不变）**、
  **graaljs PASS=10/FAIL=0**（原 7/8/9 三个失败点全部消灭）。

**第 3 步（定长数组 + embed 桥）：已完成，双模式 13/13**（计划 §6.4.4）

- 改造 `CJSTypedArray`（新增 Value 构造器；`byte[]` 构造与 `getCount`/`getData` 走适配层）、
  `CJavaEmbedBinder`（wrapper 由 `CJSContext.createObject()` 建；`createMethodWrapper` 用 `evalRaw`；
  `extractArgs`/`convertArg` 引擎无关化）；`CJSContext` 新增 `evalRaw`/`createUint8ArrayRaw`，
  `convertGraalValue` 现在把 Uint8Array 还原成 `CJSTypedArray`。
- **回归门**：`run_cjscontext_engine_mode.ps1` → **nashorn 13/13（行为不变）**、**graaljs 13/13**
  （新增 3 项：Uint8Array 往返、eval 出的 Uint8Array 识别与取字节、embed 桥调用宿主方法）。
- **风险 18（新发现）**：Truffle 把 JS 真数组作为宿主 `Object` 形参传入时给的是 `PolyglotMap`，
  且该视图对真数组**没有索引**（`isList()==false`、`keySet()` 空）→ 宿主侧参数永远取不到
  （表现为 `NoSuchMethodException: m(1)`）。对策：JS 侧改传"数组样式对象"`{length:n,0:…}`
  （普通对象在 Truffle 下是可枚举 `Map`），两引擎共用同一套 JS。已修并验证。
- 核实：`JSUint8Array` **零引用 = 死代码**，不碰 `CJSContext.engine` → 不构成 NPE 风险，本次未动。

**nashorn 的定位（2026-10-07 裁定，详见计划 §6.4.5）**：**不是产品路径**（实测载入 18.1–20.6 s/篇，性能不可交付），
只作①**过渡期"行为不变"对照物**（唯一能二分"是 GraalJS 的问题还是重构的问题"的手段，且本次重构同时改到了 nashorn 侧）
②**回退路径**。**现在不删**——保留成本仅 **11 处分支，全在 `CJSContext`**。

退役按 **A/B/C 三阶段**：
- **A（现在）**：保留 + 定性（本次已落地）。
- **B**：触发条件 = **三端 golden 在 graaljs 下逐字节一致** **且** **运行时已切到 GraalVM** → 默认切 graaljs，nashorn 退居显式开关 `-Ddocsys.office.jsEngine=nashorn`，保留一个发布周期。
- **C**：上线稳定后删除 nashorn 分支（`CJSContext` 11 处 + `JSEngineFactory.createNashorn()` + `engine`/`globals` 字段）→ 单引擎。

⚠️ **约束**：默认切 graaljs **必须与"运行时切 GraalVM"绑定**——在 stock JDK 8 上 GraalJS 只能解释执行
（实测打印 `does not support runtime compilation … interpreted mode only`），那时**可能比 nashorn 还慢**。
另：nashorn 退场**不等于没有 JS 引擎兜底**（长期兜底曾是 `JMergeEngine` 纯 Java 移植）—— 但该兜底
**2026-10-07 已按用户裁定删除**（"降低系统复杂度"，§6.4.12），所以现在**唯一的回退就是 `docsys.office.jsEngine=nashorn` 开关**，
这也是本轮 C 阶段裁定"暂不做"的一个理由：保住这条路。

**仍未做（阶段 B 已完成，剩下的是后续项）**：

1. ~~**C 阶段（删 nashorn 分支）**~~ → **用户 2026-10-07 裁定暂不做**（调研已完成、清单在"挂起"节）。
2. ⚠️ **交付前核对 `-Xmx`**（新出现，来自 §6.4.11 内存实测）：4 次保存后 ParOldGen 已用 1537 MB / 2713 MB（55%），
   而当前 dev 没设 `-Xmx`（默认上限约 4.8 GB）。生产若给较小堆会成瓶颈。
3. ~~（小）`JMergeEngine.java:127` 的日志标签已过时~~ → **已随 JMergeEngine 一并删除**；`apply_changes` 的日志标签
   已改为 `【apply_changes】JS 引擎路径 eType:<n> 引擎:<mode>`（§6.4.12）。
4. （小）定性每次保存都出现的 `executeCommonActionList() failed actions:1`（疑与 `TextSearch was Disabled` 相关）。
5. （未解释）slide 包首次 Execute 的 `run` 仅 174 ms，远快于探针冷载约 3.8 s——需时可查。
6. （可选）受控 A/B 测 GraalVM 对**启动耗时**的影响——当前数据不足以判断
   （切换后两次启动 166592 ms / 31557 ms，而旧 JRE 历史区间本身就是 28.6–259 s，
   故我先前"启动 28878 ms"的说法是**误读日志**，已在计划 §6.4.9 更正）。
7. 阶段 2（未开始）：Oracle GraalVM for JDK 17 + Tomcat 9.0.x + §6.2 整张清单。

**第 2 步的调研（已完成，结论并入计划 §6.4.2）**：

- 新增两个探针（office/test）：`TestJsValueProbe.java`（两引擎对比"JS 值 → Java 类型"）、
  `TestGraalJsApiProbe.java`（Polyglot `Context`/`Value` 的 API 映射逐项实测）。
- **更正**：第 1 步里"可保留 `javax.script` 抽象只适配值类型"的判断 **实测不成立**——
  JSR-223 下 GraalJS 把**数组**还原成 `PolyglotMap`（非 `List`、无索引视图），
  **数组元素与 `Uint8Array` 元素取不到**，且拿不到 `Value`
  → **graaljs 模式必须自带 `org.graalvm.polyglot.Context`**（回到 §3/§5 原设想）。
- 两个新陷阱（计划风险 16/17）：`Value.asInt()` 对非整数**直接抛**（`1.5` 抛），
  故 `toInt()/toInt32()` 必须"`fitsInInt()` 优先，否则 `(int) asDouble()`"；
  `null` 与 `undefined` 在 `Value` 上都是 `isNull()==true`，**无法区分**。

**依赖方案（已实施，2026-10-07）**：

- **方案 A**：`WEB-INF/lib` 新增 4 个 GraalJS jar（`js-21.2.0` / `truffle-api-21.2.0` /
  `graal-sdk-21.2.0` / `regex-21.2.0`，合计 **29.7 MB**），提交在 **`WEB-INF/lib` 独立仓库** `25d6f2c`。
  已验证：现有构建链（JDK 1.8.0_162 javac + `WebRoot/WEB-INF/classes` + `WebRoot/WEB-INF/lib/*`）
  可正常编译 `import org.graalvm.polyglot.Context/Value` 的代码（exit 0）。
- **另更正一处**：上一轮记的"Maven 组装路线在 JDK 8 上不可用"**不成立**——用**含全工程 jar 的
  生产 classpath** 重跑，**stock JDK 8u162 上 GraalJS 能跑**（`hasMembers=true arrSize=3 elem1=2`），
  只是**纯解释模式、没有 Graal JIT**（当时缺的是工程里已有的 `icu4j` 等依赖）。
  故"必须用 GraalVM 运行时"的理由是**要拿 JIT / 可比性能**，不是"跑不起来"。
- 待核对：js 21.2 的 pom 声明 `com.ibm.icu:icu4j:69.1`，工程内是 `icu4j-72.1.jar` → graaljs 模式实跑时验 Intl 路径。
- `WEB-INF/lib` 是第 5 个独立 git 仓库（已记入 `CLAUDE.md`）；其中的 `D mxsdoc.jar` 与实际代码同源
  （该部分不开源，开发环境有源码故必须删除），**属预期状态，不要恢复也不要提交**；
  test 仓库那个被覆盖的 fixture 同理，**均未动**。

## 需求

用户（2026-10-07）：Office 文件转换（`apply_changes`、转 PDF）涉及**调用 JS 代码**，好外是前后端结果一致；JDK 8 的 Nashorn 有性能问题，两个方案里已决定走**升级 JDK + GraalJS**。之前的评估方案 [GraalJS替代Nashorn评估计划.md](../src/com/DocSystem/websocket/office/docs/GraalJS替代Nashorn评估计划.md) 有两点没考虑周全，要求补齐：

1. **JDK 版本的选择** —— 目标是"执行 JS 代码"，所以**不是越新越好**：若 JS 执行引擎相同，理论上**离 JDK 8 越近的版本越安全**；并且要考虑新 JDK 有没有**对应的免费版本**（JDK 8 有明确的免费版本）。
2. **确定 JDK 版本后，列出所有受影响内容**（jar 包、源代码、甚至 Tomcat 版本），并**确定对应的迁移方案**。

## 必读上下文

- 参考计划（本次已修订）：`src/com/DocSystem/websocket/office/docs/GraalJS替代Nashorn评估计划.md` —— §6.1 选型 / §6.2 全量影响清单 / §6.3 迁移方案。
- `devDocs/参数存储策略与参数清单.md`（本次未触及参数功能）
- 待收尾前卡的残留项（见下"挂起"）。

## 参考计划与上下文（本次结论的判据来源）

- 计划原文 §6 曾写「JDK 21（GraalVM Community）」→ **本次修订改为 JDK 17 + GraalJS 23.0.x**，理由见计划 §6.1.4。

## 当前进展（2026-10-07）

### 进行中 / 已完成：步 1 纯引擎 PoC（JDK 8 + GraalVM CE 21.2）—— ✅ **已完成（2026-10-07）**

**结论：三端全部 PASS；载入整包脚本 GraalJS ≈ 13× 于 Nashorn。**

| 端 | 脚本量 | 冷 | **热中位** |
|---|---|---|---|
| word / document | 7,690 K chars | 3,507 ms | **1,281 ms** |
| slide / presentation | 7,808 K chars | 3,161 ms | **1,312 ms** |
| cell / spreadsheet | 8,936 K chars | 3,052 ms | **1,449 ms** |
| **Nashorn 对照**（同机同脚本，JDK 1.8.0_162） | 7,690 K chars | — | **17,236 ms** |

- Context 创建：冷 ~280 ms、**热 1–2 ms**（默认共享 `Engine`）→ 生命周期 B 的成本几乎为零。
- 与生产的差别：Java embed 对象用 JS 桩替代（全脚本集只用到 `NativeEngine.ConsoleLog / GetDevicePixelRatio / GetEditorType` 三个方法）；**未跑** open→applyChanges→getFileData，**未比 golden**（那是步 2）。
- 运行时：GraalVM CE 21.2.0 (java8)，SHA256 `3366c51e…1206bb4` 与官方一致，自带 OpenJDK 1.8.0_302。
- **副产发现**：`sdk-all-min.js` 里的 `/[,\s-+/^&%<=>]/` 是 ES5 非法正则，原始文件 Nashorn 解析不了；生产靠 `CDoctRenderer_Private.java:1179` 的**硬编码字符串替换**救回；**GraalJS 不需要该补丁** → 迁移可删掉这个版本耦合点（计划 §4.5、风险 13）。
- harness 已入库 **office/test 仓库**（`TestGraalJsBundleEval.java` / `TestNashornBundleEval.java` / `ScriptBundle.java` + `tools/run_graaljs_poc.ps1`，脚本清单从 `DoctRenderer.config` 读取）；台面产物落 `test/tmp/GraalJsPoc/`。GraalVM CE 21.2 运行时在仓库外 `D:\Dev\GraalVM-PoC\`。

### 已完成：调研（有实测证据，全部写进计划 §6.1、§6.2、§6.3、§9.1）

- **新增（计划 §4.1 修订 + §5.2）**：harness 的正解是**复用生产类、只换 `CJSContext` 的引擎**（`CDoctRenderer_Private.ExecuteScript()` 的前置注入全是生产类做的），**不是**另写 native 桥；但前提是**先改掉 `ScriptObjectMirror`**（GraalJS **不提供** `ScriptObjectMirror`，官方 `NashornMigrationGuide` 明写）→ 因此建议 **Phase 1 与 spike 合并做**。
- **新增（计划 §5.2，10 条官方约束）**：`js.nashorn-compat` 需 `allowExperimentalOptions`；开 compat 后默认 ES5；**不提供 `ScriptObjectMirror`**（改 `Map`/`Value`）；compat 专属能力清单（`Java.isScriptObject`、`new Interface(fn)`、`JavaImporter`、`JSAdapter`、`load("nashorn:...")`、`exit/quit`）；Nashorn 语法扩展默认开；~~`Java.type`/`Packages` 等默认可用于是 sdk-all.js 不用改~~ **❌ 该判断已被实测推翻（2026-10-07，计划 §6.4.7）：整个 office-editor 静态树 + office 源码 + test 的 `Java.type` 全 0 处，脚本里也没有 JS 层 `load(` → 这些能力我们一处都没用**；**secure by default** 要显式放开 `allowHostAccess`/`allowHostClassLookup`/`allowIO`（实测**只有 `allowHostAccess` 必需**，另两个是凭猜想加的、可去掉）；**不允许有损转换**（数值不匹配抛 `TypeError`）；ScriptEngine 名是 `graal.js` 不是 `nashorn`（**必须钉死构建，防止运行时加载到真 Nashorn**）；compat 自动开选项**只对 legacy ScriptEngine、对 `Context` 不会**。
- **新增风险 11/12**：安全面扩大（与现网 Nashorn 行为不同，要逐条对比，优先 `HostAccess.EXPLICIT`+白名单）；有损转换（桥里 `int/long/byte` 互操作点要逐个核对 + `targetTypeMapping`）。
- **风险 11 已实测摸清（2026-10-07，计划 §6.4.7）**：① 默认即 `HostAccess.EXPLICIT`（`ALL` 是我们主动开的口子）；② **闸门是 `HostAccess` 而非类查找**——不开类查找、只留 `ALL` 时 JS 仍能经 `h.getClass().getClassLoader()`/`getMethods()` 反射出去，故"关掉 classLookup 就安全"的想法不成立；③ `EXPLICIT` 的失败方式隐蔽（读未导出字段**静默返回 `undefined`**，不报错）；④ 收敛触及面有界（全局仅 `CJavaEmbedBinder` + `Embed(...)` 注册的 8 个类），但**按裁定留到阶段 B**。
- **新增事实**：sdk-all.js **不是一份而是三份**（`sdkjs\word` 5.79MB / `slide` 5.97MB / `cell` 7.02MB，选择逻辑在 `CDoctRendererConfig`）；`sdkjs\*\sdk-all.cache` 是**浏览器 V8 代码缓存**（前端产物），不是 Java 侧缓存。

**A. JDK 版本选型（回答用户第 1 点）**

- **关键事实**：GraalJS 引擎版本与 JDK 档位**成对绑定**，且 **JDK 17 与 JDK 21 是两个不同的引擎版本**（23.0.x / 23.1.x）→ 用户"同引擎取最近 JDK"的判据**不能**用于在 17 与 21 之间排序，只能排除 ≥22 的非 LTS 档位。
- **Maven Central 实测（2026-10-07 本机 Invoke-WebRequest）**：`org.graalvm.js:js` 覆盖 19.0.0→25.4.4.1.1；`22.3.x` 止于 **22.3.5**（**JDK 11 档的引擎线已停更**）、`23.0.x` 到 **23.0.13.1.1**、`23.1.x` 到 **23.1.12.1.1**，`lastUpdated=20260922`。→ 17 档与 21 档的引擎**都还在打补丁**。
- **许可实测**：GraalVM CE = GPLv2+CE 但**只跟最新 JDK**（JDK 17 的 CE 冻结在 23.0.2）；**Oracle GraalVM = GFTC，免费含生产且允许原样再分发**，17/21/25 三条 LTS 线都在同步打 CPU；Liberica NIK 开源存在（GitHub Releases 实测，JDK 配对 UNVERIFIED）；Mandrel **不含 GraalJS**（排除）。JDK 本体：Temurin/Corretto/Zulu/Liberica/MS Build 全免费；Oracle JDK 8u202 及更早=BCL 免费（**现用 8u162 属此区间**），8u211+/17=OTN 商用需订阅，21/25=NFTC 免费。
- **结论**：**目标 = JDK 17 + GraalJS 23.0.x**。排除 JDK 11（引擎线死，等于交付不再打补丁的 JS 引擎）、排除 21/25（迁移面更大且是另一个引擎版本，无本任务收益；且 JDK 23 弃用 `sun.misc.Unsafe` 内存访问、24 起要开关，而我们实测有 **10 个 jar** 明确引用 `sun.misc.Unsafe`）。JDK 8 + GraalVM CE 21.2/21.3 仅作 **PoC 过渡**（能零 JDK 迁移，但 JDK 与引擎双双 EOL）。
- 运行时两种交付形态已列出（A：Oracle GraalVM/NIK 发行版；B：Temurin 17 + GraalJS artifacts + JVMCI），待裁定。

**B. 全量影响清单（回答用户第 2 点，全部本仓库实测）**

- **本机现状**：`tomcat\java\jre` = **JRE 1.8.0_162**（`docsys_start.bat` 把 JAVA_HOME/JRE_HOME 指向它）、编译 JDK = **1.8.0_162**、Tomcat **7.0.56**（Servlet 3.0、`tomcat7-websocket.jar`）、`bin\catalina.bat` **没有任何 JAVA_OPTS/-Xmx**、**无 setenv.bat**、`.settings` 的 compliance/source/target = **1.8**。
- **Tomcat 7.0.56 → 9.0.x**（仍 `javax.servlet`，源码不改包名；**不要**跳 10/11 那要 jakarta 全量改）：⚠️ `conf\server.xml` 的 **`JasperListener` 在 Tomcat 8 已删除 → Tomcat 9 启动即 ClassNotFoundException，必须删**；`server.loader` 已移除；`bin\`/`conf\*` 整体替换；`-Djava.endorsed.dirs` 由 Tomcat 9 脚本自然去掉；WebSocket 1.0→1.1 + `textBufferSize=5242800` 语义变化需复测；5 个 JSP 需复测；Tomcat 9.0.x **EOS 2027-03-31** → 后续 9.1.x（至 2030-12-31）。
- **Jar（248 个，实测扫描 82 个含敏感引用）**：**必删** `servlet-api-3.0-alpha-1.jar`；**必加** `javax.annotation-api-1.3.2.jar`（源码 **8 处** `javax.annotation.PostConstruct/PreDestroy`）；**已就位** jaxb-api/core/impl + activation（dom4j/jgit/poi/spring 都引用 `javax/xml/bind`）；**10 个 jar 用 `sun.misc.Unsafe`**；`jdk/nashorn` 在 jar 中 0 处；Lucene 4.6 的 MMap unmap 需重点冒烟；`jna` 4.1.0 与 5.6.0、`slf4j-api` 1.7.5 与 1.7.32 **双份**。
- **源码**：Nashorn 面 = `NSJSBase` **8 个类** + `CV8RealTimeWorker`（与计划 §5 一致），`CJSContext` 被 24 个文件引用；`org.omg.`/`sun.reflect.`/`com.sun.image.codec` **0 处**；`com.sun.jndi.ldap`（LDAPUtil）与 `com.sun.net.httpserver`（agent 测试）**不用改**；⚠️ 实测 **32 处 `@Transactional`** → Spring 4.3.8 的 CGLIB 走 `ClassLoader.defineClass` 反射 → **必须 `--add-opens java.base/java.lang=ALL-UNNAMED`**。
- **降风险项**：原生 `x2t.exe` 走 `ProcessBuilder`（与 JVM 版本无关，源码对 `doctrenderer.dll` **0 引用**）；数据源是 c3p0 直连（**不是** Tomcat DBCP/JNDI → 避开 dbcp→dbcps2 包名坑）；`spring-instrument-tomcat` 的 `TomcatInstrumentableClassLoader` 未在任何配置启用。
- **构建**：字节码 target **保持 1.8**（Spring 4.3.8 内嵌 CGLIB/ASM 5 **读不懂 class file 61+**，提上去会让所有 CGLIB 代理炸）；`-d WebRoot\WEB-INF\classes` 不变量不变；war 打包流程不变但要重跑内容校验。

### 已完成：宿主权限面实测 + 推翻两条错误判断（2026-10-07）—— 计划 §6.4.7

- **起因**：核对 `createGraalContext()` 开的 `allowHostClassLookup` / `allowIO` 依据时，发现它们是**凭"nashorn-compat 提供 `Java.type`"的印象加的，从未验证**。
- **实测（探针 `test/tmp/HostAccessProbe/`，用 PoC 运行时）**：
  1. **`Java.type`/`Packages`/`importClass` 全项目 0 处**（整个 `WebRoot/web/static/office-editor` 递归 + office 源码 + test），脚本里也没有 JS 层 `load(` → 那两个开关**多余，可直接去掉**。
  2. **默认即 `HostAccess.EXPLICIT`**（`ALL` 是主动开的口子）；`EXPLICIT` 读未导出字段**静默返回 `undefined`**（不报错，隐蔽）。
  3. ❌ **"关掉类查找就能消掉风险 11"不成立**：不开类查找、只留 `ALL` 时 JS 仍可经 `h.getClass().getClassLoader()`/`getMethods()` 反射出去 → **真正的闸门是 `HostAccess`**。
- **已改**：计划 §5.2 约束 6/7、§6.4.7（新增小节）、风险 11、§9.1 证据；`JSEngineFactory` 注释；本卡。
- **裁定（用户 2026-10-07）**：本轮**只修正文档/注释里的错误结论**，**权限收敛留到阶段 B** 与"切运行时"一起做。

### 已完成：内存归因（2026-10-07）——计划 §6.4.14（含一条结论更正）

用户问"内存占用过多是不是共享 `Engine` 引起的"（源于 §6.4.11 记的 ParOldGen 1537/2713 MB）。新增探针
`office/test/tmp/MemoryAttribution/MemoryProbe.java`（`tmp/` 已 gitignore，可复跑；参数：`-Dmode=shared|private|nashorn`、
`-DnoClose`、`-DshallowGc`、`-Ds1Perms`、`-DnamedSource`、`-DpauseBeforeCloseMs`）。与老探针
`SharedEngineProbe`（只量耗时）的区别是**同时打三口径**：`noGC` / `shallowGC`（`System.gc()`×2 立刻读 = 老口径）/
`gc`（`System.gc()`×3 + 等 200 ms 让宿主清理线程跑完 = 存活集）。

**结论 1：不是共享 Engine 引起的。** 同口径同负载、各自独立 JVM、`-Xmx1g`，充分 GC 后的**常驻存活集**：
共享 Engine 一端 **220 MB** / 三端全载 **260 MB**（**4 轮恒定、不随文档数增长**；`engine.close()` 后掉到 23 MB）；
不共享 **20 MB**；**nashorn 237–601 MB 且 `-Xmx1g` 下直接 OOM** → 内存问题不是迁移引入的。

**结论 2：1537 MB 是"未 GC 的 used"，不是存活集。** 同一 JVM、同一配置三口径同时读 =
`noGC 424 / shallowGC 217 / gc 21 MB`；堆放到 4g：`noGC 752`、`committed 1.6 GB`、`gc` 仍 260 MB。
dev JVM 实测堆上限 **8,459,911,168 B ≈ 7.88 GiB**（计划原写"约 4.8 GB"是过期数字）。
→ 定 `-Xmx` 要按**存活集**估（基线 ~100 MB + 引擎 ≤260 MB + Lucene/文档工作集）。

**❗更正计划 §6.4.8 的"内存无实质差异（214–240 vs 217–244 MB）"**：那两个数字量的是**未回收垃圾**
（shallowGC 口径），两边被同一批 ~200 MB 垃圾抬到同一量级；真实差异 **20 vs 220 MB**。已逐变量排除
其他解释（`allowHostClassLookup`+`allowIO`、命名 `Source` 的四个组合实测均 20 MB）。同步更正
风险 4（"GraalVM 比 nashorn 更吃内存" → 实测相反）与风险 20。

**提交**：office `6af6dc40`（计划 §6.4.8 / §6.4.11 / 风险 4 / 风险 20 + 新增 §6.4.14）；主仓库本条。

### 未做 / 待裁定

- **首轮调研曾"未执行任何代码改动"（纯文档）**；此后阶段 1 已落地代码改动（见上）。
- **未实测**：没有真正在 JDK 17 上跑过；GraalJS 在 17 档的实际性能/兼容性仍是**承诺**而非事实（阶段 1 用的是 JDK 8 档运行时）。
- **待用户裁定（阻塞测试树）**：office/test **132 个文件** import 已删的 jmerge 类 → 编译不过；
  (a) 全删 126 / (b) 删 121 保留 `jmerge/bin` 12 个纯流测试 / (c) 暂不动。用户已说"我自己看过再决定"。
- **未做**：~~新 `NExtractToolsStatic.class` 尚未在 dev 服务生效（需重启）~~ → ✅ **已于 2026-10-07 17:30 重启生效**（新 PID 16916、`Server startup in 40377 ms`、HTTP 200、classes 内已无 `JMergeEngine`）。
- **未定性**：① slide 包首次 `Execute` 的 `run` 仅 174 ms（远快于探针冷载 3.8 s）；② 每次保存伴随
  `executeCommonActionList() failed actions:1`（紧跟 `TextSearch was Disabled`）。
- **交付前必做**：核对 `-Xmx`。~~实测 ParOldGen 1537 MB / 2713 MB，当前 dev 无 `-Xmx`~~
  → ✅ **已于 2026-10-07 归因（§6.4.14）**：1537 MB 是**未 GC 的 used**；真实常驻存活集是
  **一端 220 MB / 三端全载 260 MB**（不随文档数增长），dev 实测堆上限 **7.88 GiB**。
  定值方法：按**存活集**（基线 ~100 MB + 引擎 ≤260 MB + Lucene/文档工作集）估，**不要按 1.5 GB**。
- **新发现・已更正 + 已修复并验证（方案 A）**：`CJSContext` 关闭问题。
  ❗**更正我先前的错误判断**：我第一版写"`CJSContext.close()` 生产里从未被调用（7 个创建点、0 个关闭点）"——
  **是错的**，我只检索了 `close()`/`Close()`，**漏掉 C++ 风格别名 `Dispose()`**（`CJSContext.java:269` 的
  `Dispose()` → `close()`）。按注释边界逐个核对后的真实情况：**4 个活创建点全部有配对的 `Dispose()`**
  （`CDoctrenderer:1082→1109`、`CDoctRenderer_Private:523→1129`、`CV8RealTimeWorker:233→290`、`:780→795`）；
  另 3 个创建点（`CDoctRenderer_Private:1618`、`CDoctrenderer:1372`、`CV8RealTimeWorker:881`）
  **在 C++ 镜像注释块内、不参与编译**。
  **真实缺口两个**：① `Dispose()` **不在 `finally`**（`CDoctRenderer_Private.ExecuteScript` 与
  `CDoctrenderer.CreateCache` 均为"创建 → `if (true) {…}` → `Dispose()`"，体内无提前 `return` →
  唯一漏关路径是异常）；② 这两处的 **`CJSContextScope.close()` 从未调用** → ThreadLocal `CURRENT` 残留
  （对比 `CV8RealTimeWorker` 有 5 处 `finally { scope.close(); }`，写法正确）。
  实测当前**不构成泄漏**（GC 能回收不可达 Context），故不是内存问题的原因；但两点仍值得修（确定性释放 / API 契约 /
  避免"已关闭 context 经 ThreadLocal 被取到"）。
  **调研与修改方案**：`office/docs/CJSContext资源关闭调研与修改方案.md`（逐点核对表、改动形状、验证方案、风险）。
  **✅ 用户 2026-10-07 裁定方案 A，已实施并验证**：两处 `try/finally`（`scope` 声明提到 try 外，
  `finally { scope.close(); context.Dispose(); }`）＋ `CJSContext.close()` 末尾清 ThreadLocal 的防御，
  共 **+25/−5、3 个文件**；未动 `CV8RealTimeWorker`（生命周期不同、本来就是对的）。
  验证：javac **exit 0**；13 项冒烟 **nashorn 13/13 + graaljs 13/13**；三端门 **全部
  `IDENTICAL-MODULO-TIMESTAMPS`**；真实 UI 保存复现**同一条既有缺陷** `Qf`、**无任何新症状**
  （窗口内仅 2 条 error 且都是该已知错误）；dev 已重启生效（PID 40024、HTTP 200）。
  **并且这次 UI 回归直接坐实了 G1**：`Qf` 异常的栈帧显示它是从
  `CDoctRenderer_Private.ExecuteScript:930` **作为 Java 异常抛出并逃出方法**的 →
  **修复前 AutoFilter 每失败一次就漏关一个 JS 上下文**，修复后由 `finally` 兜住。
- **新发现·未定性②**：**共享 Engine 的性能收益在更严格方法下未复现**。老探针 S1 vs S3 =
  `1620 vs 340 ms`（2 轮、轮间不插 GC、**命名** `Source`）；新探针（4 轮、轮间 Full GC）≈ `1.3 s vs 0.8 s` 无差异。
  且生产是**逐文件** `graalContext.eval("js", 字符串)`（匿名 literal），与老探针的命名 `Source` 形态不同。
  → "花 220 MB 常驻换每篇省 1 s"是否在生产 eval 形态下成立，**需要一次方法学对齐的测量**（未做）。
- **新发现·未定性②**：**共享 Engine 的性能收益在更严格方法下未复现**。老探针 S1 vs S3 =
  `1620 vs 340 ms`（2 轮、轮间不插 GC、**命名** `Source`）；新探针（4 轮、轮间 Full GC）≈ `1.3 s vs 0.8 s` 无差异。
  且生产是**逐文件** `graalContext.eval("js", 字符串)`（匿名 literal），与老探针的命名 `Source` 形态不同。
  → "花 220 MB 常驻换每篇省 1 s"是否在生产 eval 形态下成立，**需要一次方法学对齐的测量**（未做）。
- 计划 §6.1.6 的裁定项：**D1/D2/D3 已裁定（2026-10-07）= 锁定 JDK 17 + GraalJS 23.0.x；运行时采用形态 A（Oracle GraalVM for JDK 17，GFTC），随产品分发并保留其 LICENSE/NOTICE**；**D4/D5 待裁定**（D4 Tomcat 9.0.x 还是 10.1；D5 是否先做 JDK8+GraalVM CE 21.2 的纯引擎 PoC）。

## 生效约束

- **提交记录**（本卡相关，按时间）：
  - office `dev/office`：`d8e86829`（计划补选型+影响清单）→ `1c6cd941`（步 1 PoC 结果）→ `5feb46c8`（三端 Nashorn 对照）→ `1dd452d9`（形态 C + 两阶段）→ **`c10d614e`（阶段 1 第一步：`JSEngineFactory` + `CJSContext` + 计划 §6.4.1）**
  - office/test `master`：`c708b57`（纯引擎 harness + 一键脚本）→ **`c95d3ca`（`TestCJSContextEngineMode` + 引擎模式运行脚本）**
  - 主仓库 `devInt`：`970aca4a5`、`01bf4d489`、`e0d596b28`、`385dfef57`、`6fef895d4` → **`a2329c04f`（本卡）**
- **最新提交**（2026-10-07）：
  - **删除 apply_changes Java 移植路径**：office `dev/office` **`1ec922e5`**（201 文件：3 改 + 198 删；计划 §6.4.12 + 方案文档执行记录 + `NExtractToolsStatic` 日志修正）；主仓库 `devInt` **`81b39d2a6`**（本卡）。**office/test 无改动**（回归用的补丁副本在 `test/tmp/`，已 gitignore；test 工作区只剩那个既有的被覆盖 fixture）。
  - 三端真实转换：office `dev/office` **`f47f86be`**（计划 §6.4.6 三端结果）；office/test `master` **`43f4859`**（测试与脚本三端参数化）；主仓库 `devInt` **`a4097f941`**（本卡）。
  - 宿主权限面修正：office `dev/office` **`d8026227`**（计划 §6.4.7 + §5.2/风险 11 + `JSEngineFactory` 注释）；主仓库 `devInt` **`9bf578fe3`**（本卡）。
  - 阶段 1 第 2 步（更早）：office `dev/office` `45ba91be`→`217d107a`→`ff8ad1bc`→`b968d8bd`→`99560b9e`→`dc5c334b`；office/test `master` `3933e1a`→`fe859ef`→`9e40617`→`bcde713`；**`WebRoot/WEB-INF/lib`（独立仓库）`25d6f2c`**（4 个 GraalJS jar）；主仓库 `devInt` `cb07c73ce`（CLAUDE.md 补第 5 个仓库）等。
- **不要**在未获裁定前动阶段 2 的内容（§6.2 的 Tomcat/jar/JDK 改造项）。
- 阶段 1 期间**默认必须仍是 Nashorn**（`docsys.office.jsEngine` 不设即 nashorn）；任何提交都不得改变默认路径行为。→ ⚠️ **本条已于 2026-10-07 作废**：用户裁定把默认翻转为 **`graaljs`**（`nashorn` 退居显式开关，见 `JSEngineFactory.DEFAULT_MODE`）。新的等效约束是：**缺省即 graaljs ⇒ 运行时必须是 GraalVM（或 classpath 上有 GraalJS）**；换回 stock JDK 8 时 GraalJS 只能解释执行，须显式 `-Ddocsys.office.jsEngine=nashorn`。
- 计划 §6.1 的选型结论**尚未经 spike 验证**，引用时不要当作已验证事实。

## 挂起（未获新裁定前不要开工）

- **`CURRENT_STATE_JSlideMergeGoldenNew字节差异.md`**（本目录，2026-10-07 建立）：**JS 引擎路径序列化幻灯片版式/母版
  里的 `<a:fld type="datetimeFigureOut">` 时会丢掉字段缓存文本**（`<a:t>30.10.2013</a:t>` → `<a:t></a:t>`）
  并多写一个空 `<a:rPr></a:rPr>`，每文件恒定 +13 字节（S-3 的 12 个 part 同一个根因）。已定位到确切差异点、
  影响未评估（**重点待查：是否会让服务端转 PDF 时该日期占位符变空**）→ **不属于本任务待办，未获裁定前不要开工**。
- **C 阶段（删 nashorn 分支）—— 用户 2026-10-07 裁定【暂不做】**：调研已完成（清单见下，留作将来参考），
  但改动量为 **8 个类 / 约 60 处 / 涉及 3000+ 行**（`CJSContext` 单独 40 处），属"逐个分支的语义收敛"、
  不是删几行，收益不足 → **用户决定不删，保持现状**。
  现状 = **默认 graaljs ＋ 保留 `-Ddocsys.office.jsEngine=nashorn` 作为显式回退** —— 即保留了
  "真出问题能退回（慢约 200 倍但能跑）"的能力，这本身有价值。**未获新裁定前不要开工。**
  （此前用户曾选过"方案 A：彻底删开关、显式传 nashorn 只告警后走 graaljs、双引擎 runner/测试改单引擎"；
  若将来恢复本项，先与用户确认是否仍按 A。）

  **改动清单（已逐一定位，可直接照做）**：
  | 文件 | 改什么 |
  |---|---|
  | `NSJSBase/JSEngineFactory.java`（193 行） | 删 `MODE_NASHORN`/`DEFAULT_MODE`/`getMode()`/`isGraalJs()`/`create()`/`createNashorn()`/`createGraalJs()`/`describe(ScriptEngine)` 与 `javax.script.*`+`Iterator`+`Arrays` import；**保留** `MODE_PROP`（只用于检测遗留开关并告警）、`warnOnce`、`sharedGraalEngine()`（**含 nashorn-compat**）、`createGraalContext()`（去掉 `isGraalJs()` 守卫）；新增静态块：属性存在且 != graaljs 时 `warnOnce` 提示"该开关已废弃、Nashorn 分支已删除、请从启动脚本移除" |
  | `NSJSBase/CJSContext.java`（1249 行） | **40 处**：行 `24,36,37,39,46,47,58,61,77,78,95,96,97,98,101,104,107,118,120,130,225,349,353,381,384,458,460,464,479,480,485,492,493,509,521,539,541,619,621,632` —— 删 `engine`/`globals` 字段与 nashorn 构造器分支、`getEngine()` getter、两处 `eval("({})")`/`eval("[]")` 的 JSR-223 版本、`instanceof ScriptObjectMirror` 分支、`ScriptObjectMirror` import |
  | `CJSArray`(1) `CJSObject`(2) `CJSTypedArray`(4) `JSUint8Array`(2) `CJSValue`(2) `JSValueAccess`(8) `CJavaEmbedBinder`(3) | 删 `import jdk.nashorn.api.scripting.ScriptObjectMirror;` 与对应分支；`CJSValue` 的类型嗅探 `cn.contains("jdk.nashorn")` 一并去掉 |
  | `NExtractToolsStatic.java:937` | 去掉 `引擎:<getMode()>` 日志 |
  | runner：`run_cjscontext_engine_mode.ps1`(12 处) / `run_js_path_engine_compare.ps1`(20 处) / `run_graaljs_poc.ps1`(13 处) | 去掉 nashorn 腿与 `-Ddocsys.office.jsEngine=...` |
  | 测试：`TestCJSContextEngineMode`(28/31/32/35) / `TestJsPathEngineCompare`(43) / `TestJsValueProbe`(24/26/27) | 改单引擎；`TestJsValueProbe`（两引擎对照探针）与 `TestNashornBundleEval` 删除 |
  | 文档 | 计划 §6.4.5 的 A/B/C 退役计划补状态；两个类的注释改为"唯一引擎 GraalJS" |

  ⚠️ **前提（最容易踩的坑）**：`sharedGraalEngine()` 里的 `.option("js.nashorn-compat","true")` **必须保留** ——
  它名字带 nashorn，但不是"nashorn 引擎依赖"，而是**保住 ES5 全局对象面的关键**（§6.4.8 实测：开 compat 后与真
  Nashorn 8u162 的全局对象面 16 项全一致）。做本项是"删 nashorn 引擎路径"，不是"删所有 nashorn 字样"。
  ⚠️ **顺序必须保证每步可编译**：① 先改 `CJSContext` + 7 个 NSJSBase 类（此时 `isGraalJs()`/`create()` 还在，
  仍可编译）→ ② 再删 `JSEngineFactory` API 并同步改 `NExtractToolsStatic` 与 3 个测试 → ③ 最后 runner 与文档。
  **验证**：javac 全量 → 13 项冒烟（单引擎）→ 三端转换门（与 nashorn 基线比对，应仍 IDENTICAL-MODULO-TIMESTAMPS）。

- **`CURRENT_STATE_AutoFilter保存失败.md`**（本目录，2026-10-07 建立）：**xlsx 添加/修改自动筛选后保存失败**——
  已定性为 **JS 路径既有缺陷**（graaljs 与 nashorn 报同一条 `TypeError: null has no such function "Qf"`，
  `saveDoc() convert bin to office failed`），与本轮迁移无关，**修它要动 sdkjs，属独立立项**。
  完整证据（最小复现步骤 / 双引擎日志 / 失败产物路径 / 待查方向）都在该卡里 → **未获裁定前不要开工**。

- 前卡 `CURRENT_STATE_war打包.md` 已收尾，其残留项（如有需要）：
  - war 未做**真实部署验证**（dev 是 junction 部署，不是 war）；
  - 打包流程**未固化成脚本**（现是一次性命令）；
  - `core-fonts`（156.5 MB）是否排除**待裁定**。
- 其余挂起卡（系统日志显示用户名 / agent 工具技能规模化 / 前端静态资源缓存 / 短信验证码收不到 / 测试邮件发送失败 / freetype 移植）均**已裁定暂不处理**，见 `会话恢复协议.md` 或各自的卡。
