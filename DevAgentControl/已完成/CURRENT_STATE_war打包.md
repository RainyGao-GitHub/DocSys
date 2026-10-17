# CURRENT_STATE_war打包（工作卡）

> 状态：**已产出 war 并校验通过**（2026-10-07）
> 产物：`C:\TomcatForDocSysDev\dist\DocSystem.war` —— **962.7 MB**，SHA256 `A41B1388C7AB9C5614838DEE97B3400D8FD51D1E88B3818D347B750FCF5EC5DC`

## 需求

用户：帮导出 war 包；**必须把字体库生成的文件清掉**（以前在 Eclipse 里打 war 时这些文件也被打进包了）。清理清单以 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 为准。

## 打包方法（可复用）

```powershell
$jdk='C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin'
$stage="$env:TEMP\docsys_war_stage"; $out='C:\TomcatForDocSysDev\dist'
Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stage,$out | Out-Null
robocopy D:\Dev\DocSys\WebRoot $stage /E /NFL /NDL /NJH /NJS /NP `
  /XD "D:\Dev\DocSys\WebRoot\web\static\office-editor\fonts" `
      "D:\Dev\DocSys\WebRoot\web\static\office-editor\.git" `
      "D:\Dev\DocSys\WebRoot\WEB-INF\lib\.git" `
  /XF AllFonts.js font_selection.bin fonts.log "fonts_thumbnail*" .gitignore `
      "*Probe*.class" EncNames.class "OfficeP1*.class" OfficeP2Req.class
& "$jdk\jar" cf "$out\DocSystem.war" -C $stage .
```

要点：
- **必须先 robocopy 到暂存目录**再 `jar`——`jar` 没有排除参数；**开发目录 `WebRoot` 全程不动**（打包后 `git status` 为空 ✅）
- robocopy 退出码 **0~7 都算成功**（1 = 有文件被复制 ✅）
- `jar cf war -C <stage> .` 生成的条目**不带 `./` 前缀**（`META-INF/`、`WEB-INF/web.xml` …）✅ war 结构正确
- 打完删暂存：`Remove-Item` 可能因长路径失败 → 用 `robocopy <空目录> $stage /MIR` 再删 ✅（本次成功，释放 1545.6 MB）

## 排除清单（本次实际执行）

**① 按 `CleanOfficeFonts.bat`（字体库生成物，相对 `web/static/office-editor/`）**

| 排除 | 大小 |
| --- | --- |
| `fonts/`（生成的 web 字体，552 文件） | **773.5 MB** |
| `sdkjs/common/AllFonts.js` + `server/FileConverter/bin/AllFonts.js` | 0.35 MB |
| `server/FileConverter/bin/font_selection.bin`、`fonts.log` | 0.16 MB |
| `sdkjs/common/Images/fonts_thumbnail*`（20 个文件：png + .bin） | 小 |

**② 额外剔除（不在脚本里，但不该进 war）**

- `WebRoot\WEB-INF\lib\.git`、`WebRoot\web\static\office-editor\.git`（独立 git 仓库）
- 所有 `.gitignore`（共 8 个）
- `WEB-INF\classes` 根目录的开发期探针/测试 class：`DocTableProbe2`、`EncNames`、`LoginSqlProbe`、`OfficeCap*Probe`（8 个）、`OfficeP1*`（6 个）、`OfficeP2Req`、`ReposPathProbe`、`UserProbe`

**③ 保留**：`core-fonts/`（156.5 MB，**输入**字体，首次启动靠它重建字体库）、office-editor 编辑器本体（`server/` 335.9 MB、`web-apps/` 300 MB、`sdkjs/` 60.3 MB 等）

## 校验结果（`jar tf` 逆向检查，2026-10-07）

- 条目数 **44320**；头部条目 `META-INF/`、`WEB-INF/…`（无 `./` 前缀）✅
- **不该有的内容：全部为空** ✅（`office-editor/fonts/`、`AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`、`/\.git/`、`.gitignore`、探针 class）
- 关键项存在 ✅：`WEB-INF/web.xml`、`WEB-INF/classes/com/DocSystem/**`（含 `mapping/UserMapper.xml`）、`WEB-INF/lib/*.jar`（**248 个**，与 dev 环境一致）、`manager/tmpl/promptConfig.html`、`web/static/office-editor/core-fonts/`、`server/FileConverter/bin/doctrenderer.dll`

## 2026-10-13 复核：bat war 与官方发布 war 的差异（起因：用户用 10-07 的 war 在 Linux 升级后无法启动）

**参照物（本机就有，比 Eclipse 导出更权威）**：`C:\docsysRel\2.02.87\DocSystem.war`（943 MB，官方发布用、已清字体库）、`C:\docsysRel\DocSystem-2.02.87.war`（1.72 GB）与 `DocSystem-2.02.88.war`（1.72 GB，2026-10-07 12:40，均含字体库）；Linux 包 `C:\docsysRel\docsys-Linux-Release\docsys-linux-2.02.87.tar.gz`（由 `PrepareLinuxPackage.sh` 生成：**解压 war → 删 Windows 专用 dll/exe/bat → tar**）。

**已实测的差异（我的 war vs 官方 2.02.87）**：

| 差异 | 官方 | 我的包 | 判断 |
| --- | --- | --- | --- |
| 业务/websocket 层 | `WEB-INF/lib/mxsdoc.jar`（23,974,598 B，13,783 条目，混淆过），`WEB-INF/classes/com/DocSystem/websocket/**` **0 个** | 无 mxsdoc.jar；松散 `websocket/**` class **11,797 个** | ⚠️ **结构级差异**。dev 实例本身就是松散 class 跑（无 mxsdoc.jar）⇒ 功能上应等价；但**若 Linux 目标按发布包形态运行（含授权/混淆件），换松散 class 是否可行未验证** |
| `WEB-INF/classes/docSysConfig.properties` | 也含开发机风味键（`javaHome`/`tomcatPath` 指向 `D:/EclipseProject/...`、apikey） | 同（另含 `ldapConfig=ldap://10.0.0.5:389/...`、`isOnlyOfficeUsed=0`） | ⚠️ 两者都与 `src/docSysConfig.properties`（模板 1224 B）**不一致**；Eclipse 的部署装配是 `/src → /WEB-INF/classes` ⇒ **Eclipse 导出很可能打 src 版**，这是"两种打包方式产物不同"的关键待验证点。另：这份文件含**真实 DeepSeek apikey**，不该进任何对外发布的 war |
| 字体库产物 | Linux 包内 `office-editor/fonts` 条目 **0** | 也 0（有意排除） | ✅ 与官方一致 |
| `.gitignore`(8)、`.git`(3)、classes 根部探针 class | **在包里** | 已排除 | ✅ 无害（官方也带；体积可忽略） |
| 官方包里的过期 class（`SmsConfig`/`MyEmail`/`util/EmailUtil`/`com/DocSystem/test/a..u` 等 31 个） | 有 | 无（源码已删） | ✅ 无害 |
| 中文文件名 | **乱码**（`jar tvf` 读官方 war 抛 `java.util.zip.ZipCoder MALFORMED`） | 可正常列出 | ✅ 与启动无关，但说明发布管线改名编码有问题 |
| jar 集合 | 249 个 | 252 个（多 4 个 Graal 21.2.0 + `.git`） | 待判（Graal 是 office doctrenderer 所需） |

**已排除的怀疑**：① `WEB-INF/classes` 无过期 class（12,502 个 class 全部比对应 `.java` 新，0 处 stale）；② 73 个"有源码无 class"的都在 office 子模块 `DjVuFile/MsBinaryFile`（属 `.classpath` 明确排除范围）；③ 关键项（`web.xml`、`classes`、`mapping/UserMapper.xml`、`core-fonts/`、`doctrenderer.dll`）齐全。

**下一步（等用户）**：① 用户在 Eclipse 导出参照 war（建议落 `C:\TomcatForDocSysDev\dist\DocSystem-eclipse.war`，勿覆盖 `DocSystem.war`）→ 做条目集合 + 逐条 CRC/大小 + `classes`/`lib` 三张差异清单；② 要 Linux 启动失败日志（`catalina.out`/`docsys.log` 启动段异常栈，最快定位）；③ 问清升级方式（解压覆盖 `webapps/DocSystem` vs 直接把 war 丢进 `webapps`——后者若已有同名目录，Tomcat 会用旧目录并只打 warning）。

**2026-10-13 实测对比完成**（用户现场用 Eclipse 导出参照包 `C:\docsysRel\DocSystem-2.02.88.war`，1,861,095,217 B，23:01 导出；工具 `C:\TomcatForDocSysDev\CompareWar.py`，默认忽略字体库产物、按 raw 条目名比较以适配不同编码）：

| 类别 | 数量 | 内容 |
| --- | --- | --- |
| 共有条目 | **41,962** | **CRC 全等、0 处内容不同**（含 `WEB-INF/classes/docSysConfig.properties`、全部 `WEB-INF/lib/*.jar`、全部 `.class`） |
| 仅 A（我的包） | 860 | 全是 `.java`，位于 `web/sales/docsysReleaseScripts/docsysEncoder/proguard6.2.2/**`（webapp 里带的 proguard 源码）——**WTP 会丢掉 web 内容中的 `.java`** |
| 仅 B（Eclipse 包） | 7,565 | 7,560 个是 `src/com/DocSystem/websocket/**` 的**非 Java 资源被 WTP 原样拷进 `WEB-INF/classes`**：`office/test/tmp/**`(6,014，含 scratch bin/zip)、`office/test/测试文件/**`(1,342)、`office/test/参照物/**`(142)、`office/test/tools/**`(26)、`office/docs/**`(~30 个 md/docx)；另 8 个 `.gitignore` |
| 大小不同 | 1 | 仅 `META-INF/MANIFEST.MF`（我：`Created-By: 1.8.0_162`；Eclipse：多一行空的 `Class-Path:`） |
| 字体库 | 仅 B 多 577 | 正是我有意排除的那批（`fonts/` 552 + `AllFonts.js` 2 + `fonts_thumbnail*` 20 + `font_selection.bin` 1 + `fonts.log` 1 + 目录项） |

**结论**：① **没有"运行必需文件被漏掉"的证据**——所有共有条目逐字节一致，两边独有条目全部可解释（有意排除 / dev 噪音）；② 先前怀疑的 `docSysConfig.properties`（`src` 模板 1,224 B vs `classes` 运行版 1,310 B）**经实测两边一致（都是 classes 版）**，该怀疑作废——但该文件含真实 DeepSeek apikey 与开发机路径（`javaHome`/`tomcatPath` 指向 `D:/EclipseProject/...`），发布前宜处理；③ 两边非 ASCII 条目名均带 UTF-8 标志（`0x800`）且一致；④ **故 Linux 起不来的原因不在 war 内容差异**，须靠启动日志或本地复现定位。
**顺带发现（待裁定）**：Eclipse 导出的包会额外带上 7,560 个 dev 文档/测试 fixture（含 `office/docs/*.docx`、`office/test/测试文件` 全套用例、`office/test/tmp` scratch），发布包不该带（体积 + 信息外泄）⇒ 建议在 `CleanOfficeFonts.bat` 里一并清；另我的包里多出的 860 个 `web/sales/.../proguard6.2.2/**/*.java` 是否也排除以对齐 WTP 口径。

**2026-10-13 两件对齐已实施并验证**（用户裁定「先排除 proguard 源码 + 清 dev 文档/测试 fixture」）：

1. `BuildWar.bat`：`/XF` 增 `*.java`（对齐 WTP——WTP 从 web 内容导出时会丢掉 `.java`）。重打包结果：**41,963 条目 / 1,014,080,835 B（967.0 MB）/ SHA256 `E12832D121769262C13A50DC67EB04397CADE09716D9B35D9918DD925861F7C7`**；包内 `.java` 0 条、`office-editor/fonts` 0 条、`AllFonts.js` 0 条。与 `DocSystem-2.02.88.war` 复比：**only-in-A 归零**，共有 41,962 条目 CRC 全等，only-in-B 仍 7,565（dev 文档/测试，改由发布清理脚本负责），不同大小 1（`META-INF/MANIFEST.MF` 文案）。
2. `CleanOfficeFonts.bat`（`C:\TomcatForDocSysDev\`，已备份 `CleanOfficeFonts.bat.bak-20261013`）：新增删除 `WEB-INF\classes\com\DocSystem\websocket\office\{docs,devDocs,test}`、`*.java`、`.git`/`.gitignore`（新增 `APP` 变量 = `docsys\tomcat\webapps\DocSystem`——这几项在 webapp 根，不在 office-editor 内）；**新增 junction/符号链接守卫**（`fsutil reparsepoint query` + 父目录 `dir /a:l` 双重检测）。⚠️ 该守卫是**必需的安全项**：dev 安装的 `webapps\DocSystem` 正是指向工作区的 junction，旧脚本在 dev 目录一跑就会删掉工作区真源码（`src/.../office/docs`、`office/test` 是**已跟踪**文件，删了不可恢复）。
   验证：① 假发布树功能测试——14 项应删全部删除、5 项应留（`doctrenderer.dll`/`core-fonts`/`web.xml`/`Keep.class`/`readme.txt`）全部保留；② 在 `C:\TomcatForDocSysDev\`（junction）实测**守卫拒绝运行**（exit 1），随后复查工作区 fonts 552 / docs 32 / test 5,722 文件完好。
3. 新增工具 `C:\TomcatForDocSysDev\CompareWar.py`（对比两个 war：默认忽略字体库产物、按 raw 条目名比较以适配 GBK/UTF-8 命名、输出 onlyA/onlyB/大小不同/内容 CRC 不同/目录↔文件错位五类，`--csv` 出全量清单；自测：自比 42,823 条目 0 差异 0.7 s，比官方混淆版 1.3 s）。

## 2026-10-14 三件套移入仓库 `Docs/scripts/`

用户裁定：放 **`Docs`**（不是 `devDocs`——devDocs 是 MxsDoc 功能开发文档），并在其下建 `scripts` 目录。注意 `Docs` 是 **git 子模块**（`DocSys-Docs`，`https://gitee.com/RainyGao/DocSys-Docs.git`），主仓库 `.gitignore` 的 `/Docs` 只是避免重复跟踪，文件本身**有版本控制**。

落地内容：
- `Docs/scripts/BuildWar.bat` —— 已改**位置自推导**（`%~dp0..\..\WebRoot`，`/s:<dir>` 可覆盖）+ **`jar.exe` 自动查找**（`%JAVA_HOME%` → `PATH` → 已知 dev JDK 路径：`C:\docsysRel\docsys-WDK\...\jdk`、`C:\TomcatForDocSysDev\docsys\tomcat\java\jdk`、`C:\Program Files\Java\jdk1.8.0_162`）；输出默认仍 `C:\TomcatForDocSysDev\dist`；头部注释内嵌 Eclipse External Tool 配置（Arguments 改指仓库路径）。
- `Docs/scripts/CleanOfficeFonts.bat` —— 含上一轮的 dev 资料清理（`WEB-INF\classes\...\office\{docs,devDocs,test}`、`*.java`、`.git*`）与 **junction/符号链接守卫**。
- `Docs/scripts/CompareWar.py` —— war 对比工具。
- `Docs/scripts/README.md` —— 发布链路 A（命令行）/ B（Eclipse）、用法与注意事项。
- 仓库外 `C:\TomcatForDocSysDev\BuildWar.bat`、`CleanOfficeFonts.bat` 改为**转发/指路桩**（旧路径与既有 Eclipse External Tool 仍可用）；`CompareWar.py`、`CleanOfficeFonts.bat.bak-20261013` 已删除。

验证：① `Docs\scripts\BuildWar.bat /verify` → 会打包 40,041 个文件、禁用项 0、保留 `web\static\fonts`(6) 与 `core-fonts`(215)；② 完整构建 41,963 条目 / 1,014,080,835 B（967.0 MB）；③ 与用户 Eclipse 导出的 `DocSystem-2.02.88.war` 复比 **only-in-A 0 / 内容不同 0**（证明搬家与重打包未改变内容）；④ 转发桩实测可用；⑤ `CompareWar.py` 自比 42,823→现 41,963 条目 0 差异。

⚠️ **确定性结论（新事实）**：war **逐字节不可复现** —— `jar` 用**构建时刻**填写 `META-INF/` 与 `META-INF/MANIFEST.MF` 的时间戳（最小样例实测：两次构建的条目数、各条目大小、总字节数完全相同，SHA256 不同；`jar tvf` 差异仅这两项的时间戳）。⇒ 校验发布包内容一律用 `CompareWar.py`（按条目 CRC 比较），**不要比 SHA256**。

⚠️ 遗留（待用户点头）：`CLAUDE.md` 里「清理清单以 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 为准」已过期，应改成 `Docs/scripts/CleanOfficeFonts.bat`。提交需两段：先在 `Docs/` 里 commit+push，再在主仓库提交子模块指针（当前 `Docs` 子模块状态：`?? scripts/`）。

## 2026-10-14 "Eclipse 会不会重复编译"的研究结论（用户裁定：不做任何配置改动）

**起因**：用户发现"由 CLI 编译过的源文件，在 Eclipse 里 Refresh 后仍会被再次编译"。研究后**用户最终裁定：不必为避免重复编译做任何配置 —— 保留 Eclipse 的 Build Automatically 即可**。理由：ECJ（compliance 1.8）与 CLI 的 `javac` 1.8 产出的类语义等价，重编一次无副作用；且 **Eclipse 的增量构建会顺带重编依赖方**，正好补上 CLI 单文件编译的短板 ⇒ 两条编译链互为交叉验证，比"只留一条"更稳。

**机制（本机 Eclipse 4.7.2 实测）**：

- Eclipse 的 Java 构建**不比较输出目录 `.class` 的时间戳**；按「资源增量（刷新时磁盘属性 vs 内存快照）+ JDT 自身构建状态」判断，故外部改动（CLI javac / 外部编辑器 / git）的 `.java` 在刷新后必然被判为 changed 而重编译。**没有"采纳外部编译结果"的开关** —— 这是设计行为，不是判定错误。
- 易误解的开关：`org.eclipse.jdt.core.builder.recreateModifiedClassFileInOutputFolder`（界面标签 **"Rebuild class files modified by others"**，`Java > Compiler > Building`）—— 只覆盖"输出目录里的 class 被外部改/删、而源码未变"的情形，**对上述场景无效**；另有 `org.eclipse.jdt.core.builder.cleanOutputFolder`（"Scrub output folders when cleaning projects"）控制 `Project > Clean` 是否清空输出目录（清空 ⇒ 全量重编译）。
- 构建状态：`D:\EclipseProject\EclipseWorkspaceForDocSys\.metadata\.plugins\org.eclipse.core.resources\.projects\DocSystem\org.eclipse.jdt.core\`（该工程另有 `.markers` 71 MB、`.indexes`）；项目与工作区 JDT 均 `compliance/source/target=1.8`。

**实践注意（现状，不改配置）**：

- 我（agent）仍按项目不变量用 CLI `javac -d WebRoot/WEB-INF/classes` 编译改动；Eclipse 开着自动构建时会把这些改动再编一遍 —— 正常且无害。
- 因 Eclipse 会重编，`WebRoot/WEB-INF/classes` 会是"ECJ 产物为主、夹带 javac 单文件产物"的混合；**发布打包前建议先让 Eclipse 编完（Refresh / `Ctrl+B`）再跑 `Docs\scripts\BuildWar.bat`**，使包内 class 出自同一编译器。
- 改**签名/接口**时 CLI 不重编依赖方：Eclipse 自动构建会在下次刷新时补上；若急着用 CLI 验证，需连依赖一起编。

## 2026-10-14 用户实测通过（Linux）✅

- **用户报：Linux 系统下测试 OK，本次 `BuildWar.bat` 产物"没有任何问题"**（2026-10-14 11:33）。被测包 = `C:\TomcatForDocSysDev\dist\DocSystem.war`，**41,963 条目 / 1,014,080,835 B（967.0 MB）/ SHA256 `917ACF21D1A5E6D6179E00BB0B0E4536862D80318EB3E45DF10CC148547830F9`**（2026-10-14 08:42 构建）⇒ **命令行打包路线（`Docs/scripts/BuildWar.bat`）可正式作为发布输入**，后续按既定步骤（清理 → 混淆 → 打包/`PrepareLinuxPackage.sh`）走。
- **仍未定位**：10-07 那份 war 在 Linux 升级后"无法启动"的原因（用户未提供启动日志）。**war 内容差异这条线已排除** —— 10-13 实测与用户 Eclipse 导出包**共有 41,962 条目 CRC 全等、only-in-A 0**。若日后复现，优先取 `catalina.out` / `docsys.log` 启动段。

## 2026-10-14 2.02.88 发布包：6 平台构建 + 独立复核 ✅

- **用户跑通 6 平台发布包**：`cd C:\docsysRel` → `python build_release.py`，**6 个平台全 `=> PASS`**（自检项：Java 启动器 / `webapps/DocSystem/WEB-INF/web.xml` / 顶层启动脚本 / `.sh` 可执行位 / 符号链接逐条转写）。产物落 `C:\docsysRel\ForReleaseBuild\dist`：`docsys-linux` 1160.6 MB、`docsys-kirin-x64` 1160.6 MB（与 linux 同包同运行时）、`docsys-kirin`(ARM64) 1011.4 MB、`docsys-mac` 1014.7 MB、`docsys-mac-arm64` 1009.1 MB、`docsys-win` 1130.0 MB（zip）；耗时 49~315 s/平台。payload 1161 目录 / 27888 文件。
- **内容独立复核（本次会话，用脚本直接扫归档而非看构建日志）**：linux tar 与 win zip **字体库生成物 0 命中**（`office-editor/fonts/`、`AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`）；`webapps/DocSystem` 文件数 **27,836，与磁盘 payload 逐一对齐**（转写保真）；`core-fonts` 215 文件 ✓（编辑器运行时必需，与字体库生成物是两回事）；`mxsdoc.jar`(21.0 MB) + `web.xml` ✓；**松散 websocket class 0**（混淆这步到位）。
- **payload 骨架形态核对**：`docsys/tomcat/webapps` 下**只有 `DocSystem`**（无 ROOT/docs/examples 残留）；`tomcat/{work,temp,logs}`、`logs/`、`tmp/` 目录保留但内容清空（`PRUNE_CONTENT_DIRS`）；`mysql/` 与 `tomcat/Java/` 按裁定不入包。
- **与官方 2.02.87 Linux 包结构比对**（`--compare`，为避免覆盖 dist 产物另建到临时目录后已删）：2.02.88 **29,619 项** vs 2.02.87 **30,197 项**，共同 29,037；only-in-A **583**、only-in-B **1,161** —— **全部可归因，无意外缺失**：
  - only-in-B 1,161 = `docsys/mysql/**` **867**（按 2026-10-12 裁定剔除 MySQL）+ **294「Oracle JDK 运行时专属件」**（`jre/lib/deploy*`、`javaws.jar`、`plugin.jar`、`libavplugin-*.so`、JavaFX 等）→ 2.02.88 换 GraalVM/Temurin/Zulu 免装运行时；其中还含 `tomcat/work/Catalina/localhost/_/**` 残留 —— 新流程已剔除，**属改进**。
  - only-in-A 583 = **420 运行时 `Java/jre`**（GraalVM 自带 `languages/js`、`languages/llvm`）+ **163 业务新增**：`manager/{exportUser,importUser,logViewer,systemLdapServerEdit,systemLlmModelEdit,systemMailTestSend,systemSmsTestSend,systemSettingEdit,systemStorePathPicker}.{html,js}` 与 `commonService/{mail,sms,ldap,http}`、`common/UserListImporter`、`agent/*` 等新 class（即 10-06~10-14 这批功能）+ `tomcat/{RELEASE-NOTES,RUNNING.txt}`（骨架自带文档）。
- **两处「要不要处理」的发现**（均已定位，非阻塞，记在下方「待定 / 未做」）：非 Windows 包内的 Windows 专用二进制；随包发出的 `Test*.class`。

## 2026-10-14 去掉 Linux/mac 启动期字体库生成（用户裁定）✅

- **裁定**：Linux 启动脚本以后不再执行字体库生成（MxsDoc 已能由应用侧代码生成）。改动全部落在 **`WebRoot/web/sales` 这第 4 个独立 git 仓库**（主仓库 `.gitignore:7` 忽略 `/WebRoot/web/sales`；该目录**同时供 mac 与 kirin 包** —— `build_release.py` 里 5 个平台都取 `scripts="Linux"`）：
  - `docsysStartScripts/Linux/docsys_start.sh`：删掉 `if [ -d ${FONTS_DIR} ] … do generate fonts` 条件生成块（−7 行）。
  - `docsysStartScripts/Linux/tomcat_start.sh`：删掉无条件生成调用（−1 行）。
  - `docsysStartScripts/Linux/gen_fonts.sh`：**整文件删除**（与 Windows 侧早先 `3d0fdba 【优化】删除gen_fonts.bat` 一致；应用侧已有自动生成 + 管理后台「重置字体库」）。
  - 两处各加 3 行英文注释说明**为什么 `chmod 777` 不能删**。实测包里 `x2t` / `allfontsgen` / `allthemesgen` 权限是 **644**（`build_release.py` 只把 `.sh` 写成 755，其余一律 644），而应用侧生成（`OfficeBase.generateFontsOnlyOffice:332` → `documentserver-generate-allfonts.sh` → `allfontsgen`）与运行期文档转换都要执行它们。
  - 改完复核：CR=0 / 非 ASCII=0（纯 ASCII + LF）、6 个脚本 `sh -n` 全 exit 0、`git diff` 仅上述三处。
- **WSL2 端到端验证（用新脚本，2026-10-14 16:4x）**：把新脚本灌进 WSL 里已解包的副本 → `./start.sh` → **`Server startup in 11,764 ms`、`GET /DocSystem/` = 200**（不再有字体库生成的几分钟阻塞）；启动后 `allfontsgen`/`x2t` 已被脚本改成 **777** ✓；`start.out` 里无任何生成动作；Tomcat 自动把 `docSys.ini` 当 webapp 部署（应用自建）✓。测完已 `stop`；WSL 里保留解包目录 `~/docsys-wsl-test`（2.1 GB）备后续测试。
- ⚠️ **已产出的 6 个 2.02.88 包里的脚本仍是旧的**：脚本是**构建期**从 `WebRoot/web/sales/docsysStartScripts/Linux` 取源（不在 payload 里）⇒ **要重新跑 `build_release.py`**，否则客户拿到的包还会在首启生成字体库。
- **顺带发现（既有问题，WSL 实测）**：`./stop.sh` **没能停掉 Tomcat** —— `docsys_stop.sh` / `docsys_upgrade.sh` 里 `JAVA_HOME="$CATALINA_HOME/Java/jdk"` 指向**不存在**的目录（2.02.87 时代也如此，包里只有 `Java/jre`）⇒ `catalina.sh stop` 失败、随后 `ps -ef|grep` 取到的 pid 为空、`kill` 报 Usage；本次是靠 WSL 测试脚本的兜底 `kill -9` 才停掉。**待确认**：真机（`ps` 可用）时那条兜底是否有效 —— WSL 极简环境可能缺 `ps`/`procps`。
- **同日追加（用户裁定）：主题生成（`allthemesgen`）也去掉** —— 理由：主题生成目前多数情况本就失败，且不影响 Office 使用。改动落在 **`WebRoot/web/static/office-editor`（第 5 个独立 git 仓库）**：`bin/documentserver-generate-allfonts.sh`（−22 行）与 `.bat`（−20 行）删掉 3 段 `allthemesgen` 调用 + 提示 + 收尾 `echo Done`；两个 Linux 启动脚本里 `allthemesgen` 的 `chmod` 行删除（`allthemesgen` 二进制本身未删）。该仓库是 `onlineInstallOffice.do` 的拉取源 ⇒ **推送后新装/重装 Office 也不再跑主题生成**。
  - **实证（WSL2）**：带 `LD_LIBRARY_PATH=$OE/libs/Linux` 直接跑改后的脚本 —— **1 s 完成、只调 `allfontsgen`**，产出 `sdkjs/common/AllFonts.js`(90 KB) + `server/FileConverter/bin/AllFonts.js`(99 KB) + `font_selection.bin`(30 KB) ✓，无 `allthemesgen`。顺带证实：不设 `LD_LIBRARY_PATH` 时 `allfontsgen` 会 `libgraphics.so: cannot open shared object file` 失败 ⇒ 启动脚本那行 `export LD_LIBRARY_PATH` 也是**载荷必需**；`chown -R ds:ds` 在无 `ds` 用户时报 `invalid user`，无害（上游残留，脚本无 `set -e`）。
  - ⚠️ **提交注意**：该仓库存在 **27 项既有未提交改动**，全是运行期生成的字体产物（`sdkjs/common/AllFonts.js`、`Images/fonts_thumbnail*.png`、`server/FileConverter/bin/{AllFonts.js,font_selection.bin,fonts.log}`，以及未跟踪的 `fonts/`、`*.png.bin`、`sdkjs/cell/sdk-all.cache`）⇒ **不要 `git add -A`**，只提交 `bin/documentserver-generate-allfonts.{sh,bat}`。

## 2026-10-16 Eclipse 路线补齐：新增 `CleanWar.bat`（war 就地清理）+ 两条路线排除集对齐 ✅

**起因**：用户仍常改完代码直接在 Eclipse 里「Export > WAR file」出包（Eclipse 导出无法排除文件），问「能否有个脚本把 war 里不需要的内容去掉、或 `CleanOfficeFonts.bat` 是否已经能干这事」。**结论：`CleanOfficeFonts.bat` 不能** —— 它只认已解包的发布包目录（`<脚本目录>\docsys\tomcat\webapps\DocSystem`），无法作用在 `.war` 文件上。故新增 `Docs/scripts/CleanWar.bat` + `CleanWar.ps1`。

**新增 `CleanWar.bat`（+ `CleanWar.ps1`，war 就地清理）**
- 用法 `CleanWar.bat <warFile> [/o:<outWar>] [/b] [/n] [/y] [/p]`：默认就地清理；`/o:` 另存（输入包不动）；`/b` 保留清理前副本为 `<目标>.dirty`；`/n` 干跑；`/y` 免确认。
- 做法：war 即 zip，用 `System.IO.Compression` 在 zip 层级删条目 —— **不解包、不重压缩**，保留条目逐字节原样；实测 1.86 GB / 50,105 条目删 8,322 条约 **9 秒**。
- 删除清单与 `BuildWar.bat` 同一套（字体库产物 + office 开发资料 + `tmp\` + `*.java` + `.git`/`.gitignore` + `WEB-INF\classes` 根部探针 class）。
- 安全：删除在目标旁的临时副本上做；**四重自检全过才替换原包** —— ① 副本无禁用项 ② 条目数 = 原数 − 删除数 ③ 每个保留条目 名字+大小+CRC 与清理前逐一相等 ④ `jar tf` 可读（找不到 jar.exe 则警告跳过）。任一步不过 → 原包不动、临时副本删除、退出码 1。

**排除集对齐（本轮两个新增项）**
1. `BuildWar.bat` `/XD` 增加 `...\websocket\office\{docs,devDocs,test}`（10-13 已裁定"发布包不该带"的开发资料；Eclipse 的 WTP 导出会从 src 拖进来，JDT 也会把 devDocs/test 拷进输出目录）；
2. **`tmp\`**（`WebRoot\tmp\0\docsys.lic` = dev 实例运行期写的 license 缓存，主仓库 `.gitignore:11` 忽略 `/WebRoot/tmp`）：本轮量对时发现 **10-16 的新构建带上了它**，而 10-13 Eclipse 包与 10-14 受测包里都没有 ⇒ 属运行期产物、不该发布；`BuildWar.bat` `/XD` + `CleanWar.ps1` + `CleanOfficeFonts.bat` 三处同步排除/清理。
verify / stage / war 三段自检模式串同步加 `websocket\office\{docs,devDocs,test}` 与 `docsys.lic`。

**验证（真实产物，2026-10-16）**
- 输入用户 10-13 导出的完整 Eclipse 包 `C:\docsysRel\DocSystem-2.02.88.war`（1.86 GB / 50,105 条目）→ 删 **8,322 条**（字体库 577 + office 开发资料 7,738 + `.gitignore` 7），产出 **965.7 MB / 41,783 条目**：
  - 与原始包 CompareWar：only-in-B = 8,322（恰为删除集），41,783 个保留条目 **CRC 全等**；`--hash` 逐字节复核 **0 差异**；非 ASCII 名 UTF-8 标志保持；`jar tf` 正常。
- 两路线收敛（对齐后**全新构建**，输出到临时目录、未动 `C:\TomcatForDocSysDev\dist` 的受测产物）：新 CLI 包（清掉 tmp 后 41,782 条目）vs 清理后的 Eclipse 包（41,783）：**41,772 条完全一致、我方独有 0**；剩余差异全部可归因于 **10-13 之后的源码改动** —— `gen_fonts.sh`（10-14 已删）仅 Eclipse 包有、8 个文件大小不同（SalesBase/SalesController class、build_release.py、macQuarantineTest.sh、docsys_start.sh、tomcat_start.sh、documentserver-generate-allfonts.{bat,sh}）、`docSysConfig.properties` 内容不同、`META-INF/MANIFEST.MF` 文案不同。
- `BuildWar.bat /verify`：会打包 **39,862** 文件（较 10-14 的 40,041 少 179 = devDocs 58 + test 120 + `tmp\0\docsys.lic` 1）、禁用项 0、`web\static\fonts`(6) 与 `core-fonts`(215) 保留。
- 边界用例：已干净的包 → "Nothing to clean"（rc 0）；文件不存在 / 非 DocSystem zip → 拒绝（rc 1）；`/o:` 时输入包字节数不变；同一输入两次清理**输出逐字节一致**（清理可复现；"war 逐字节不可复现"那条限制只针对 `jar` 重新构建）；`CleanOfficeFonts.bat` 假发布树功能测试 14 删 / 7 保全对（含新 `tmp\` 计数行）。

**踩坑记录（都写进脚本注释了）**
- **cmd 的 `shift` 会连 `%0` 一起移动** ⇒ 参数解析循环里 `shift` 之后 `%~dp0` / `%~nx0` 都不再指向脚本自身（本次实测拼出 `-File "D:\CleanWar.ps1"` 报"不存在"、用法提示打印成 `Usage: y ...`）。修法：开头先 `set "SCRIPT_DIR=%~dp0"` + `set "SCRIPT_NAME=%~nx0"`（`BuildWar.bat`/`CleanOfficeFonts.bat` 原来只存了 `SCRIPT_DIR`，`%~nx0` 没存，用法提示一直是错的，本次一并修）。
- **带空格的引号参数会拆掉解析循环**：`/o:"C:\out dir\x.war"` 这种参数，`%~1` 只剥掉包住整个参数的引号，内层引号会留下 ⇒ `if "%~1"==""`（循环守卫）与 `"!A!"=="!A2!"` 这类比较在空格处被 cmd 拆开报"此时不应有 …"。修法：进解析前先做**去引号副本**（`set A=%~1` + `set A=!A:"=!`）再做所有比较；`BuildWar.bat` 的 `/s:`、`/o:` 同步加固（现在都接受带空格的引号路径）。
- **未定义变量不展开替换形式**：`set A=` 会把 A unset，而 cmd 对**未定义**变量不展开 `!A:"=!`（原样保留）⇒ 空参数被当作非空、越过循环守卫走到 badopt。修法：判空改用 `if not defined A goto argsdone`。
- **别在 Git Bash 里直接跑 `BuildWar.bat`**：bat 里多处 `find /c /v ""` 会解析到 MSYS 的 `find.exe`，它把 `/c` 当 C 盘开始递归全盘扫描（表现为"卡住不动"）。Eclipse / cmd / 资源管理器跑正常；Git Bash 里跑需先给干净 PATH（本次测试用 wrapper cmd 解决）。

**留给用户**
- 未动 `C:\TomcatForDocSysDev\dist\DocSystem.war`（10-14 已测的发布输入）：下次正式出包重跑 `BuildWar.bat` 即带新排除集；Eclipse 出的包改用 `CleanWar.bat` 正名。
- `Docs/scripts/README.md` 已同步（文件表新增 CleanWar 行、路线 B 改为 CleanWar、"排除清单三份副本要同步"注意事项）。
- 未提交：`Docs/scripts/{BuildWar.bat,CleanOfficeFonts.bat,README.md}` 改动 + 新增 `{CleanWar.bat,CleanWar.ps1}`（`Docs` 是子模块，提交两段走）。
- 验证产物在 `C:\docsysRel\_warcheck\`：`test-full.war`（清理后的 Eclipse 包）、`dist\DocSystem.war`（对齐后的命令行构建，已清 tmp）——可自行 CompareWar 复核，不需要可直接删。

## 待定 / 未做
- **未做真实部署验证**：没把 war 丢进一个干净 Tomcat 跑起来（dev 用的是 junction 部署，不是 war）。
- **已固化成脚本（2026-10-13）**：`C:\TomcatForDocSysDev\BuildWar.bat`（工作区外，不入版本控制）。等价于上面的「暂存 + jar」命令，但带**双重自检**（暂存目录与 war 各查一遍禁用项）与暂存自动清理；`/verify` 只列出「会打包 / 会排除」的内容而不产出 war，`/o:<dir>` 换输出目录，`/k` 保留暂存目录，`/p` 双击运行时暂停。脚本头部写有 **Eclipse 一键调用**配置（Run → External Tools → Program，`cmd.exe /c C:\TomcatForDocSysDev\BuildWar.bat`）——**起因**：Eclipse 自带的 WAR 导出**无法排除文件**（已在本机安装 `C:\安装程序\eclipse-jee-oxygen-2-win32-x86_64`（4.7.2）上验证：WTP 部署装配模型 `org.eclipse.wst.common.modulecore` 的 `wb-resource` 只有 `source-path`/`deploy-path` 两个属性，整插件无任何 exclude 相关代码，导出向导亦无此选项）。**已完整跑通**（2026-10-13）：42,823 条目 / 1,015,746,379 B（968.7 MB）/ SHA256 `A3A1CD2D2602F2E58C9D3B607C7C1A48DF3C5619139536102858B71B77E7DC13`，**覆盖**了上面 10-07 那份（旧档 962.7 MB / `A41B1388…` 已不存在）。排除集逐项核对（robocopy `/L` 清单与全量文件做差集）= 552 `fonts/` + 20 `fonts_thumbnail*` + 3 `.git` + 8 `.gitignore` + 2 `AllFonts.js` + 1 `font_selection.bin` + 1 `fonts.log` = **587 个文件，无多无少**；`web\static\fonts`（其他组件的字体目录，6 文件）与 `office-editor\core-fonts`（215 文件，输入字体）**保留**（`/XD` 必须用绝对路径，否则 `fonts` 会误伤）。
- **还能再小**：`core-fonts` 156.5 MB 也可排除（代价：首次启动无法重建字体库，需另行把输入字体放到服务器）——需用户裁定。
- war 里含 `WEB-INF/classes`（Eclipse 输出目录，含 `jdbc.properties`/`docSysConfig.properties` 等默认配置），与用户以往 Eclipse 打包方式一致。
- **非 Windows 包里含 Windows 专用二进制 22 个 / 270.4 MB**（payload 内实测：`office-editor/server/FileConverter/bin/*.dll` 87.7 MB、`DocService`(exe) 78 MB、`FileConverter`(exe) 74.6 MB、`Metrics`(exe) 30.1 MB、`server/tools` 2 文件 0.1 MB）—— **起因是 2026-10-11 裁定「不对不同平台做任何裁剪，payload 全平台共用」**；而 2.02.87 时代 `PrepareLinuxPackage.sh` 会删掉 `.dll/.exe/.bat`，所以官方参考包里没有它们。安全前提已核实：`FileConverter/bin` 同时含 Linux 的 `x2t`(54.85 MB) 与 Windows 的 `x2t.exe`(39.36 MB)，只删 `.dll/.exe` 不影响 Linux 运行。**2026-10-14 用户裁定：保持现状** —— 继续「全平台共用同一份 payload、不做任何裁剪」（随后 `build_release.py` 的 `NON_WINDOWS_EXCLUDES` 未改）。若日后要改成裁剪，只动该常量即可。
- **`Test*.class` 71 个（0.6 MB）随发布包发出**（`com/DocSystem/agent/**/TestXxx.class`）—— 但**官方 2.02.87 包里同样有 66 个**，是**历史遗留**：`src/com/DocSystem/agent/**` 下 46 个 `Test*.java` 是**主仓库已跟踪源码**，与生产代码同目录、编译进同一份 `WebRoot/WEB-INF/classes`（且**不属** office/test 仓库）⇒ 要清得从源码目录划分或打包剔除两头处理。体量可忽略（0.6 MB），**2026-10-14 与上一条同批裁定为保持现状、本次不处理**（要清属另一件事：源码目录划分 + `build_release.py`/`BuildWar.bat` 剔除规则）。
