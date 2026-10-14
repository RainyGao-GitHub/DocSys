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

## 待定 / 未做
- **未做真实部署验证**：没把 war 丢进一个干净 Tomcat 跑起来（dev 用的是 junction 部署，不是 war）。
- **已固化成脚本（2026-10-13）**：`C:\TomcatForDocSysDev\BuildWar.bat`（工作区外，不入版本控制）。等价于上面的「暂存 + jar」命令，但带**双重自检**（暂存目录与 war 各查一遍禁用项）与暂存自动清理；`/verify` 只列出「会打包 / 会排除」的内容而不产出 war，`/o:<dir>` 换输出目录，`/k` 保留暂存目录，`/p` 双击运行时暂停。脚本头部写有 **Eclipse 一键调用**配置（Run → External Tools → Program，`cmd.exe /c C:\TomcatForDocSysDev\BuildWar.bat`）——**起因**：Eclipse 自带的 WAR 导出**无法排除文件**（已在本机安装 `C:\安装程序\eclipse-jee-oxygen-2-win32-x86_64`（4.7.2）上验证：WTP 部署装配模型 `org.eclipse.wst.common.modulecore` 的 `wb-resource` 只有 `source-path`/`deploy-path` 两个属性，整插件无任何 exclude 相关代码，导出向导亦无此选项）。**已完整跑通**（2026-10-13）：42,823 条目 / 1,015,746,379 B（968.7 MB）/ SHA256 `A3A1CD2D2602F2E58C9D3B607C7C1A48DF3C5619139536102858B71B77E7DC13`，**覆盖**了上面 10-07 那份（旧档 962.7 MB / `A41B1388…` 已不存在）。排除集逐项核对（robocopy `/L` 清单与全量文件做差集）= 552 `fonts/` + 20 `fonts_thumbnail*` + 3 `.git` + 8 `.gitignore` + 2 `AllFonts.js` + 1 `font_selection.bin` + 1 `fonts.log` = **587 个文件，无多无少**；`web\static\fonts`（其他组件的字体目录，6 文件）与 `office-editor\core-fonts`（215 文件，输入字体）**保留**（`/XD` 必须用绝对路径，否则 `fonts` 会误伤）。
- **还能再小**：`core-fonts` 156.5 MB 也可排除（代价：首次启动无法重建字体库，需另行把输入字体放到服务器）——需用户裁定。
- war 里含 `WEB-INF/classes`（Eclipse 输出目录，含 `jdbc.properties`/`docSysConfig.properties` 等默认配置），与用户以往 Eclipse 打包方式一致。
