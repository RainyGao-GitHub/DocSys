# Office 字体库预生成方案（安装后立即可用）

> 建立于 2026-11-04。**状态：D1–D8 已裁定并实施完成（2026-11-04）；待随下次发布实跑 GenOfficeFonts.bat 全量预生成（~600 字体、约 30-60 分钟）。**
> 裁定结果：D1 解压后/混淆前 ✓；D2 过滤 .fon/.dat ✓；D3 use-system=false（并按 D7 要求加了管理后台 UI）✓；D4 接受体积、单份优化放二期 ✓；D5 仅内网分发，风险可接受 ✓；D6 缩略图预生成 ✓；D7 配置键 `OfficeUseSystemFonts` + 后台 UI ✓；D8 Fonts.zip 固定当前这份（2026-11-02，562 文件）✓。
> 需求（用户原话要点）：实现"安装后立即可用"——字体库在**软件发布阶段**通过脚本主动预生成，`font_selection.bin` / `bin/AllFonts.js` 里写**相对路径**；生成前把 `C:\docsysRel\Fonts.zip`（Windows 全部字体）拷进 core-fonts，让预生成字体库覆盖 ~99% 场景，基本消灭目标机重生成字体库的需求。
> 前序方案：[Office字体库自动生成方案.md](Office字体库自动生成方案.md)（2026-10-10 已实施：前端触发的自动检测 + 后台生成，本文不改其机制，只是让它在预生成包上天然休眠）。

---

## 1. 调研结论（全部来自当前源码与实测，附证据）

### 1.1 相对路径：**消费端已天然支持，运行时零改动**

`NSFontsStatic.FromBuffer`（[NSFontsStatic.java:391-404](../src/com/DocSystem/websocket/office/graphics/NSFonts/NSFontsStatic.java#L391)）从 font_selection.bin 读路径时的判定：

```java
boolean bIsRelative = false;
if (sPath.indexOf('/') < 0)            bIsRelative = true;   // 完全不含 /
else if (sPath.charAt(0) == '.')       bIsRelative = true;   // 以 . 开头（./ ../）
if (bIsRelative) sPath = strDir + "/" + sPath;               // strDir = 运行时 bin 目录
```

- 运行时 `strDir` = `m_sFontDir` = `<安装目录>/…/office-editor/server/FileConverter/bin`（绝对路径，[OfficeBase.java:6501](../src/com/DocSystem/websocket/OfficeBase.java#L6501)）。
- 因此生成时写 **`../../../core-fonts/xxx.ttf`**（从 bin 出发：`../`=FileConverter、`../../`=server、`../../../`=office-editor），运行时拼回绝对路径，**任意安装目录都成立**。Java NIO / `Files.readAllBytes` 处理含 `..` 段的路径没有问题。
- 服务端全部消费链都汇聚到这一个入口：`FileConverter.convert` → `CDocxSerializer`（[CDocxSerializer.java:413](../src/com/DocSystem/websocket/office/OOXML/BinDocxRW/CDocxSerializer.java#L413) `pFontPicker.Init(m_sFontDir)`）→ `CMetafileFontPicker.Init`（[CMetafileFontPicker.java:72](../src/com/DocSystem/websocket/office/graphics/CMetafileFontPicker.java#L72)）→ `CApplicationFonts.InitializeFromFolder` → `CFontList.CheckLoadFromFolderBin` → `FromBuffer`。
- `bin/AllFonts.js` 的 `__fonts_files` 路径数组：**Java 代码只写不读**（全仓库无解析方，仅 [CApplicationFontsWorker_private.java:1014](../src/com/DocSystem/websocket/office/fontengine/CApplicationFontsWorker_private.java#L1014) 写入）。唯一外部消费者是 `isOnlyOfficeUsed=true` 时经 params.xml 传给 C++ `x2t.exe` 的 `m_sAllFontsPath`——C++ 端 `FromBuffer` 有与 Java 移植版相同的相对路径判定，兼容。
- 浏览器端 `sdkjs/common/AllFonts.js` 用编号（"001"…）引用 `fonts/` 目录，与路径无关。

### 1.2 生成端：写路径的挂钩点集中，且已有半成品逻辑

`NSFontsStatic.ToBuffer`（[NSFontsStatic.java:587-594](../src/com/DocSystem/websocket/office/graphics/NSFonts/NSFontsStatic.java#L587)）已有"前缀剥除"逻辑（C++ 原版遗留）：

```java
String sPath = pInfo.m_wsFontPath;
if (m_strDirectory 非空 && sPath 以它开头) sPath = 剥掉前缀;      // ← 只能剥 base 目录下的
else if (m_bIsOnlynames) sPath = 只留文件名;
```

core-fonts 不在 bin 目录下，剥不到 ⇒ 需把它升级为**真正的 relativize**（产生 `../` 段）。需要相对化的写出点共 **3 处**（都在 office 仓库）：

| # | 写出点 | 位置 |
|---|---|---|
| 1 | `font_selection.bin` + AllFonts.js 内嵌 `g_fonts_selection_bin` | `CFontList.ToBuffer` → `NSFontsStatic.ToBuffer` 的 `sPath`（serializer 传 baseDir） |
| 2 | `bin/AllFonts.js` 的 `__fonts_files` | `CApplicationFontsWorker_private.write_fonts_files`（:1014） |
| 3 | `fonts.log` | `CApplicationFontsWorker.saveFontFileListToFile`（:374） |

**约束**：生成过程内部其余环节必须继续用绝对路径——`SaveWebFonts` 拷贝源文件（:186）、缩略图绘制、`buildFontsPriority` 的 `File.length()` 都读 `m_wsFontPath`。相对化必须限制在上述 3 个**序列化/写出边界**内。

### 1.3 FontGenerator 可以独立运行（脱离 Tomcat）

| 依赖 | 结论 |
|---|---|
| FreeType | 走 **LWJGL 绑定**（`lwjgl-freetype.jar`），WEB-INF/lib 自带全平台 natives（`lwjgl-freetype-natives-windows.jar` 等）→ classpath 即用，无需额外安装 |
| 日志 | `Log`（[Log.java:92](../src/com/DocSystem/common/Log.java#L92)）：`logFile` 为 null 时只打控制台，设了写文件 → 可传参控制 |
| 静态初始化 | `GValue.OSType` 静态自检操作系统、`Path.localDirPathFormat` 纯字符串处理，**无 servlet/容器依赖** |
| 入口 | `main()` 目前是硬编码测试入口（[FontGenerator.java:138](../src/com/DocSystem/websocket/office/FontGenerator/FontGenerator.java#L138)，写死桌面测试路径）⇒ 需要改成真正的 CLI（小改动） |
| 混淆 | `proguardForDocSys.conf` **已 keep** `com.DocSystem.websocket.office.FontGenerator.**` 与所有 `main` 方法；`fontengine` 包不在 keep 名单（会被改名，但内部引用一致，功能不受影响）⇒ 混淆前后都能跑 |

### 1.4 发布流程与插入点

现状（`C:\docsysRel\发布步骤.txt` + `Docs/scripts/README.md`）：

```
1. 编译 war（BuildWar.bat，排除字体库产物——core-fonts 本身进 war）
2. 解压到 C:\docsysRel\DocSystem\
3. EncodeDocSystem.bat → buildDocSystem.bat
   （ProGuard 混淆：WEB-INF\classes\com\DocSystem\websocket 移入 mxsdoc\ → mxsdoc.jar，
    原 classes 目录被删除）
4. 压缩 DocSystem.zip 放入版本目录
5. DocSystem/ 放入 docsys\tomcat\webapps\ → build_release.py 产出 6 个平台包
```

- **推荐插入点：步骤 2 之后、步骤 3 之前**（classes 还是明文，classpath = `DocSystem\WEB-INF\classes` + `DocSystem\WEB-INF\lib\*`，用发布包自己的类，保证与所发布代码同版本）。
- 脚本可做成自动探测：classes 里还有 `com/DocSystem/websocket` 就用 classes，否则回退 `lib\*`（含 mxsdoc.jar，混淆后也能跑）——两条路都通。
- BuildWar 的产物排除**不需要改**：预生成发生在解压后的 staging 上，产物随包走。

### 1.5 Fonts.zip 实测（C:\docsysRel\Fonts.zip，2026-11-02）

| 类型 | 文件数 | 未压缩大小 |
|---|---|---|
| ttf | 349 | 377.8 MB |
| ttc | 15 | 215.0 MB |
| otf | 3 | 24.5 MB |
| fon（点阵旧字体） | 192 | 4.9 MB |
| dat（非字体数据） | 1 | 19.2 MB |
| **合计** | **562** | **641.6 MB**（zip 本体 387 MB） |

- 与 dev 的 core-fonts（39 文件 / 157 MB）**文件名零重叠** ⇒ 合并干净，合并后 core-fonts ≈ **800 MB**。
- FreeType 能解析 ttc（faceIndex 链路已支持）；`.fon` 属点阵字体（FreeType 的 FNT 驱动可解析一部分，会往字体列表塞大量无意义条目）；`.dat` 非字体，生成时会被跳过但拷贝白占体积。

### 1.6 体积影响测算（需知情后裁定）

| 项 | 增量（未压缩） |
|---|---|
| core-fonts（Fonts.zip 并入） | +641 MB → ~800 MB |
| `fonts/`（浏览器用完整拷贝，仅含可解析字体） | +~620 MB |
| 字体缩略图（字体名从 ~376 → ~500+） | 14 MB → 估 ~25-40 MB |
| **单个平台包 office-editor 部分** | **+~1.4 GB 未压缩**；tar.gz/zip 压缩后单包约 +700–900 MB，**× 6 个平台包** |

二期可选的"单份字体数据"优化见 D4（font_selection.bin 直接指向 `fonts/` + 服务端读取时还原前 32 字节异或，core-fonts 不进包，体积减半，但要动运行时代码且目标机失去重生成能力）。

### 1.7 fonts.log 与"跳过重生成"的跨机一致性

`needGenerateFonts`（[CApplicationFontsWorker.java:337](../src/com/DocSystem/websocket/office/fontengine/CApplicationFontsWorker.java#L337)）拿 fonts.log 与**现场扫描的绝对路径列表**做精确比对。两个推论：

1. **Happy path 不受影响**：预生成包产物齐全 → `isAllFontsReady()=true` → 自动生成机制直接 noop，fonts.log 根本不会被比对。
2. **要防的坑**：`installOffice.do`（上传安装包重装 office-editor，[BussinessController.java:6132](../src/com/DocSystem/websocket/BussinessController.java#L6132)）安装完会调 `checkAndGenerateFonts(false,false)` —— 若 fonts.log 记录的是构建机路径/用户机扫描出本机系统字体，比对必不匹配 → 触发 20 分钟级全量重生成，正好破坏"立即可用"。
   ⇒ 两个配套改动（见 D3/D4 前提）：
   - fonts.log 在相对模式下记录 **core-fonts 相对文件名**，`isFontFileListEqualWithOld` 比对前把两侧归一化为**文件名集合**；
   - 运行时 use-system 改为 **false**（否则用户机系统字体总会进扫描列表、集合必不等，归一化也救不了）。

### 1.8 运行时 use-system 现状与影响

`OfficeBase.checkAndGenerateFonts`（[OfficeBase.java:421](../src/com/DocSystem/websocket/OfficeBase.java#L421)）硬编码 `bIsUseSystemFonts=true`。改 false 的影响：

- 字体全集 = core-fonts 内容（已并入全部 Windows 标准字体）⇒ 覆盖用户机上 99% 的字体；
- 目标机"重置字体库"的结果与预生成集一致（都是 core-fonts-only），fonts.log 跨机比对可成立；
- 代价：用户**自行安装**的非标准字体不再出现在 Office 字体列表（管理员可拷入 core-fonts 后重置，现有机制）。

---

## 2. 方案

### 2.1 一句话

**发布阶段在 staging 上把 Fonts.zip 并入 core-fonts，用发布包自己的类跑 FontGenerator CLI（相对路径模式、use-system=false、force=true、含缩略图），产物随包发布；目标机上 `isAllFontsReady()=true`，自动生成机制天然休眠，Office 安装即用。**

```
发布流水线（C:\docsysRel）
  2. 解压 war → DocSystem\
     ↓  ★新增 GenOfficeFonts.bat（插入点：解压后、Encode/混淆前）
     │   a. 校验布局（office-editor\core-fonts、可用的 classpath）
     │   b. 解压 Fonts.zip → core-fonts\（按过滤清单跳过 .fon/.dat 等）
     │   c. java -cp "classes;lib\*" …FontGenerator --officeEditor <dir> --relative --force --thumbnails
     │   d. 自检：4 项就绪产物存在 + font_selection.bin / bin AllFonts.js 抽查含 "../core-fonts"
     │      + fonts/ 文件数 + fonts.log 为相对文件名 + 耗时/体积日志
  3. EncodeDocSystem → buildDocSystem（混淆，不碰字体产物）
  4. zip → 5. build_release.py（6 平台包，产物随包走）

目标机（任意安装路径）
  首次打开 Office → getOfficeFontsStatus.do → ready=true → 直接加载编辑器（零生成）
  服务端转换：font_selection.bin 里 ../../../core-fonts/xxx.ttf → FromBuffer 拼 bin 绝对路径 → 正常加载
```

### 2.2 代码改动清单

**office 仓库**（`src/com/DocSystem/websocket/office`，独立 git）

| # | 文件 | 改动 |
|---|---|---|
| A1 | `FontGenerator/FontGenerator.java` | `main()` 改为 CLI：`--officeEditor <dir>`（推导全部子路径，也支持显式路径组）、`--use-system <bool>`、`--relative`、`--thumbnails <bool>`、`--force`、`--logFile <path>`、`--test`（保留旧测试入口）。`generate()` 加 `relativeBaseDir` 参数（默认 null=现状绝对路径，不影响现有调用方） |
| A2 | `fontengine/CApplicationFontsWorker.java` | 新增 `m_sRelativeBaseDir`；`saveFontFileListToFile` 相对模式下写 core-fonts 相对文件名；`isFontFileListEqualWithOld` 比对前两侧归一化为小写文件名集合并去重排序 |
| A3 | `graphics/NSFonts/NSFontsStatic.java` | `ToBuffer` 里 serializer 的 `m_strDirectory` 非空时，把"前缀剥除"升级为真正 relativize（产生 `../../../core-fonts/x.ttf`；与 base 无公共祖先时保持绝对路径） |
| A4 | `fontengine/CApplicationFontsWorker_private.java` | `generateFontSelectionBin` / `write_g_fonts_selection_bin` 构造 serializer 时传入 baseDir；`write_fonts_files` 对 bin 版 `__fonts_files` 应用同一 relativize |

**websocket 仓库**（`OfficeBase.java`）

| # | 改动 |
|---|---|
| B1 | `checkAndGenerateFonts` 的 use-system 实参从硬编码 `true` 改为读配置（键名见 D7，默认 false，`docSysConfig.properties` + classes 镜像 + 参数清单登记）。手动"重置字体库"走同一配置，行为一致 |

**Docs/scripts（仓库副本）+ C:\docsysRel（运行副本，双副本惯例同 build_release.py）**

| # | 改动 |
|---|---|
| C1 | 新脚本 `GenOfficeFonts.bat`（§2.1 流程；classpath 自动探测 classes→lib 回退；java 取 docsys-WDK 的 JDK；`-Xmx2g`；过滤清单默认 `.fon,.dat` 可参数化；支持 `-n` dry-run 与 `-y`） |
| C2 | `C:\docsysRel\发布步骤.txt` 插入"2.5 预生成字体库"步骤；`Docs/scripts/README.md` 流水线说明更新 |

**文档**

| # | 改动 |
|---|---|
| D0 | 本文档补实施记录；`devDocs/参数存储策略与参数清单.md` 登记新配置键 |

**明确不做**：不改 `isAllFontsReady` 判据与自动生成机制（在预生成包上它天然休眠）；不改手动"重置字体库"交互；不动 BuildWar/CleanWar/CleanOfficeFonts 的排除清单（旧"目标机重生成"模式仍可作为兜底保留）；不做 D4 单份优化（留二期）。

### 2.3 目标机各场景行为（预生成包）

| 场景 | 行为 |
|---|---|
| 首次部署/任意安装路径 | ready=true，立即可用；转换经 `../` 相对路径加载 core-fonts |
| 在线升级（war 替换，office-editor 保留） | office-editor 未动 → 产物仍在 → ready=true |
| 上传安装包重装（installOffice.do） | fonts.log 文件名比对通过 → **跳过**生成（现状会全量重生成 20 分钟，这是 D3+A2 的直接收益） |
| 产物部分损坏（自动生成自愈路径） | font_selection.bin 缺失 → 现场重生成（绝对路径，本机一致）；仅 AllFonts.js 缺失 → 既有 R1 兜底（删产物+force）接管 |
| 管理员手动"重置字体库" | 现场全量重生成（绝对路径、含本机流程），一切如旧 |
| 管理员往 core-fonts 加字体后重置 | 扫描集合变化 → 正常触发重生成（机制保留） |

---

## 3. 裁定项（待用户逐条确认；附推荐）

| # | 问题 | 选项 | 推荐 |
|---|---|---|---|
| **D1** | 预生成时机 | (a) 解压后、Encode/混淆前（classes 明文，最稳）<br>(b) 混淆后（classpath 用 lib\*+mxsdoc.jar；ProGuard 已 keep FontGenerator，理论可行但依赖 keep 规则不回退） | **(a)**，脚本同时支持 (b) 作回退 |
| **D2** | Fonts.zip 过滤清单 | (a) 跳过 `.fon`+`.dat`（点阵字体污染字体列表，省 ~24MB）<br>(b) 全部并入（与今天 use-system=true 扫 C:/Windows/Fonts 的行为一致） | **(a)** |
| **D3** | 运行时 use-system | (a) 改 false（全集=core-fonts；fonts.log 跨机成立；installOffice 不再全量重生成）<br>(b) 保持 true（happy path 也没问题，但 installOffice/自愈会 20 分钟级重生成） | **(a)**，做成配置键保留切换能力 |
| **D4** | 包体积 | (a) 接受（单包未压缩 +~1.4GB、压缩后约 +0.7–0.9GB × 6 包）<br>(b) 本期同时做"单份字体数据"（font_selection.bin 指向 fonts/ + readFontFile 还原前 32 字节异或 + core-fonts 不进包，体积减半；代价：改运行时代码 + 目标机失去原地重生成能力） | **(a)** 先落地，(b) 立项二期 |
| **D5** | Windows 字体再分发版权 | Arial/Calibri/SimSun/微软雅黑/Segoe UI 等为 Microsoft 及字库厂商授权字体，**随安装包再分发存在许可风险**（内部 Windows 环境部署风险较低；对外公开发布的安装包风险真实） | 用户确认使用范围（仅内部 / 会公开分发）；若公开，建议准备"开源字体替代集"变体发布通道 |
| **D6** | 缩略图预生成 | (a) 预生成（发布耗时 +30~60 分钟，用户体验完整）<br>(b) 跳过（发布快，字体列表预览空白直到某次重置） | **(a)** |
| **D7** | use-system 配置键名与默认值 | 建议 `OfficeUseSystemFonts`，默认 `false`，`docSysConfig.properties`（ini + classes 镜像），后台 Office 编辑器页暂不加 UI（需要再加） | 按建议 |
| **D8** | Fonts.zip 基准 | 当前这份（2026-11-02，562 文件）作为固定基准；后续是否随 Windows 版本更新、更新节奏 | 用户确认 |

---

## 4. 开工清单（待裁定后执行）

- [ ] office 仓库：A1 CLI、A2 相对 fonts.log + 归一化比对、A3 relativize、A4 serializer/`__fonts_files` 接线
- [ ] websocket 仓库：B1 use-system 配置化（`Path.java` 读键 + `OfficeBase` 实参 + 配置文件两份 + 参数清单登记）
- [ ] Docs/scripts：C1 `GenOfficeFonts.bat`（仓库副本）+ C:\docsysRel 运行副本；C2 `发布步骤.txt` / README 更新
- [ ] 验证（见 §5）
- [ ] 文档：D0 实施记录回填

编译约束沿用既有惯例：Java 改动编译输出到 `WebRoot/WEB-INF/classes`；office 仓库单独提交。

## 5. 验收项

| # | 验收项 | 判据 |
|---|---|---|
| V1 | 相对路径生成 | font_selection.bin（二进制抽查）与 bin/AllFonts.js 均为 `../../../core-fonts/…` 形式；web AllFonts.js 仍为编号；fonts.log 为相对文件名 |
| V2 | 产物完整 | 4 项就绪产物 + fonts/（≈可解析字体数）+ 缩略图生成；脚本自检通过并输出耗时/体积 |
| V3 | 模拟目标机 | staging 拷贝到**另一路径**启动 → `getOfficeFontsStatus` ready=true、无自动生成日志；打开含中文字体的 docx，转换正常且日志可见 `../core-fonts` 加载成功 |
| V4 | 路径无关性 | V3 通过后再改一次安装目录名重测，依旧正常 |
| V5 | installOffice 不重生成 | 上传安装包含预生成产物 → 日志出现 `skip generation!!` |
| V6 | 既有机制回归 | 手动"重置字体库"全流程正常（绝对路径、本机一致）；自动生成自愈路径（删 4 产物）正常 |
| V7 | 发布流程回归 | 混淆、zip、build_release.py 全流程跑通，产物随包进入 6 个平台包 |
| V8 | use-system 配置 | 默认 false 生效；置 true 时行为回到"扫描系统字体" |

## 6. 风险与备注

1. **体积**（§1.6）与**版权**（D5）是两个最大的非技术代价，需用户拍板。
2. 发布机构建耗时增加约 30–60 分钟/次（~600 字体文件，缩略图占大头）；生成内存建议 `-Xmx2g`（缩略图为整幅大图）。
3. `.fon` 若不过滤（D2b），字体列表会出现 100+ 点阵字体条目（与今天 use-system=true 的行为一致，非新问题）。
4. 目标机用户自装的非常见字体不在预生成集（1% 场景）：管理员拷入 core-fonts 后重置即可，机制已存在。
5. `office-editor`（dev 工作区内为独立 git 仓库）**不并入** Fonts.zip——合并只发生在发布 staging，dev 仓库保持 39 文件现状；dev 上要测全量字体集时手工模拟同样的合并即可。
---

## 7. 实施记录（2026-11-04）

### 7.1 与方案的一处设计细化

原方案 §2.2 说"运行时重生成保持绝对路径"。实施时改为：**OfficeBase 运行时也统一传相对路径基准（bin 目录）**。理由：V5（installOffice 上传安装不触发全量重生成）依赖 fonts.log 跨机可比，而比对两侧必须走同一套归一化规则；统一相对路径后，预生成与目标机重生成产物完全同构，一套规则贯穿。

### 7.2 落地清单

**office 仓库**（`dev/office` 分支）：

- `graphics/NSFonts/NSFontsStatic.java`：新增 `GetRelativePath(sPath, sBaseDir)`（产生 `../` 段相对路径；输入已是相对路径则原样返回；无公共根返回 null；结果不以 `.` 开头时补 `./`，保证 FromBuffer 端按相对路径处理）与 `SerializerPath()`；`GetBufferLen` 与 `ToBuffer` 两处重复的路径变换统一走 `SerializerPath`（长度计算与写入内容必须一致）。`m_strDirectory` 为空（所有既有调用）时行为与原来完全一致。
- `fontengine/CApplicationFontsWorker.java`：新增 `m_sRelativeBaseDir` + `setRelativeBaseDir()`（localDirPathFormat 格式化）；`fonts.log` 写入经 `NormalizeFontLogEntry()`（能相对化则相对路径、否则文件名）；`isFontFileListEqualWithOld()` 改为两侧归一化（小写+去重排序 TreeSet）后集合比较——预生成的相对条目与目标机扫描的绝对路径可匹配。
- `fontengine/CApplicationFontsWorker_private.java`：`generateFontSelectionBin` / `write_g_fonts_selection_bin` 的 serializer 传入 `m_sRelativeBaseDir`；`write_fonts_files`（bin AllFonts.js `__fonts_files`）优先写相对路径。`SaveWebFonts` 拷贝源、缩略图、优先级计算（File.length）仍用绝对路径，不受影响。
- `FontGenerator/FontGenerator.java`：`main()` 改为 CLI（`--officeEditor <dir>` 必填；`--use-system`（默认 false）、`--relative`（默认 true）、`--thumbnails`（默认 true）、`--force`（默认 true）、`--logFile`、`--test` 保留旧入口）；`generate()` 增加 11 参重载（末参 relativeBaseDir，原 10 参签名保留、委托空基准）。修复了 CLI 解析中"开关型参数把下一个 `--xxx` 当成值"的问题。

**主仓库**：

- `src/com/DocSystem/common/Path.java`：`getOfficeUseSystemFonts()`（键 `OfficeUseSystemFonts`，默认 false）。
- `src/com/DocSystem/websocket/OfficeBase.java`：`checkAndGenerateFonts` 的 use-system 实参改为 `Path.getOfficeUseSystemFonts()`（原硬编码 `true`），并传相对路径基准 = `server/FileConverter/bin/`。
- `src/com/DocSystem/controller/ManageController.java`：`getSystemInfo` 返回 `officeUseSystemFonts`；`setSystemInfo` 新增参数并写配置（回拷 classes 镜像）。
- `WebRoot/manager/main.js`：`SYSTEM_OFFICE_FIELDS` 增加 `officeUseSystemFonts`；显示/取消/保存三处接线。
- `WebRoot/manager/tmpl/systemOfficeEditor{,_en}.html`：新增「字体库并入系统字体」下拉行（含生效时机说明：下次生成/重置字体库时生效）。
- `src/docSysConfig.properties` + `WebRoot/WEB-INF/classes/docSysConfig.properties`：新键默认值注释。

**发布脚本**（双副本：`Docs/scripts/GenOfficeFonts.bat` + `C:\docsysRel\GenOfficeFonts.bat`）：

- 步骤：校验布局 → Fonts.zip 幂等合并进 core-fonts（PowerShell 解压，跳过 `.fon`/`.dat`、已存在跳过）→ classpath 自动探测（`WEB-INF\classes`（混淆前，推荐）→ `WEB-INF\lib\mxsdoc.jar`（混淆后回退））→ `java -Xmx2g` 调 FontGenerator CLI（`--relative --force --use-system false --thumbnails true`，日志 `GenOfficeFonts.log`）→ 自检（4 产物存在 + bin AllFonts.js 抽查 `../../../core-fonts/` + fonts 文件计数）。支持 `/pkg:`、`/fontszip:`、`/skipmerge`、`/n`、`/y`、`/p`。java 优先取 `docsys-WDK` 自带 JDK。
- `C:\docsysRel\发布步骤.txt`：插入步骤 2.5 + 注意事项；`Docs/scripts/README.md`：表格行 + 流水线图更新。
- `devDocs/参数存储策略与参数清单.md`：登记 `OfficeUseSystemFonts`。

**build_release.py 集成（2026-11-05 追加，仓库 `WebRoot/web/sales/docsysReleaseScripts/` + `C:\docsysRel\` 双副本）**：

- `--war` 一条龙流水线新增 **"1.5/5 预生成 Office 字体库"** 步骤（位于解压之后、删sales/混淆之前——即明文 classes 路径，与 D1 裁定一致）：`ensure_office_fonts()` = Fonts.zip 并入 core-fonts（`merge_fonts_zip()`，过滤 .fon/.dat、幂等）→ 产物缺失时调 FontGenerator CLI（classpath 自动探测 classes → lib/mxsdoc.jar 回退；Popen 流式回显关键行，全程日志 `war/GenOfficeFonts.log`）→ 复查 5 项产物 + web 字体计数。失败则**中止发布**（防止"以为预生成了其实没有"的包流出）。
- 幂等复用分支（war 未变化直接复用已转换 DocSystem）同样兜底：产物缺失时自动补生成。
- 新参数：`--fonts-zip <ZIP>`（默认按 `脚本目录/Fonts.zip → C:\docsysRel\Fonts.zip` 查找）、`--skip-fonts`（显式跳过，回退旧模式）、`--refonts`（产物已存在也强制重生成，配合 `--reconvert`）。
- 手工放入 payload（未走 `--war`）的流程：打包前检测到字体库产物缺失会打警告（不阻断）并指引 `--war` 流水线 / GenOfficeFonts.bat。
- 功能验证（dev 迷你包 + junction 指向真实 classes）：第 1 次"合并 1/过滤 2 → 生成 13 秒 → 就绪"；第 2 次"合并 0/已存在 1 → 产物就绪跳过"；`force=True` 重生成正常、回显收敛为阶段级行；`office_fonts_missing()` 检测 0 项。

### 7.3 验证结果（dev 机器，2026-11-04）

| # | 项 | 结果 |
|---|---|---|
| V1 | 相对路径生成 | ✅ 临时目录跑 CLI：font_selection.bin / bin AllFonts.js / fonts.log 均为 `../../../core-fonts/xxx.ttf`；web AllFonts.js 仍为编号 |
| V3/V4 | round-trip + 安装目录无关 | ✅ 写 RTTest 临时类：原位置与**拷贝到不同层级的新位置**（C:/FontGenRT2/oe-moved-deeper）加载 font_selection.bin，字体全部 `exists=true`、`GetStream` 可打开（2/2） |
| V5 | 跳过重生成 | ✅ 迁移后位置跑 `--force false`：日志 `FontFileList not changed and font_selection.bin exists, skip generation!!` |
| 脚本 | dry-run + 真实端到端 | ✅ dry-run 全流程打印正确；真实跑（合成 MiniFonts.zip + junction 指向真实 classes）：合并过滤生效（merged:1 / 过滤 .fon+.dat:2）、幂等（二次跑 already existed:1）、生成成功、自检含相对路径抽查、缩略图生成 |
| 回归 | 护栏测试 | ✅ `TestOfficeFontsAutoGenGuard` 21/21 通过（自动生成机制未被触碰） |
| 集成 | build_release.py | ✅ `ensure_office_fonts()` 迷你包功能测试：合并+生成+就绪校验、二次幂等跳过、force 重生成、缺失检测（见 §7.2 追加小节） |

### 7.4 未验证项（留待首次真实发布）

1. **全量 Fonts.zip（562 文件/~600 字体）的真实预生成**：耗时（估 30-60 分钟）、生成内存（脚本已设 `-Xmx2g`）、缩略图尺寸增长——首次发布时实跑并回填数据。
2. 混淆后路径（classpath 回退 `mxsdoc.jar`）仍未实测（推荐流程是解压后/混淆前跑，回退仅是兜底；build_release.py 的幂等复用分支补生成走的就是该回退路径）。
3. 目标机全链路（部署含预生成产物的包 → 打开含中文字体的 docx 转换正常）——发布后按 §5 V3/V4 验收。
4. 管理后台新下拉行只做了静态核对（html/js 接线与 officeAutoGenerateFonts 完全同构），未做真机浏览器验证。
---

## 8. 二期实施记录：单份字体数据（2026-11-05，D4 裁定后开工）

> 裁定：① x2t 兼容用懒生成方案；② 参数不拆分（`OfficeUseSystemFonts` 维持"是否并入系统字体"单一含义，相对路径为结构性必然）；③ 发布默认删 core-fonts、留参数可保留。
> 设计核心：**font_selection.bin / bin AllFonts.js 直接指向 fonts/ 副本**（`../../../fonts/NNN`），core-fonts 不随包发布，包内字体数据从 ~1.4GB 降到 ~620MB+缩略图（压缩后约 350-400MB/包）。

### 8.1 落地清单

**office 仓库**：

- `common/BaseDefinition/NSBaseClass.java`：`readFontFile` 按魔数识别并自动还原 Web 字体混淆（前 32 字节异或，key 提取为共享常量 `WEB_FONT_KEY`；还原后仍非法则恢复原样）；新增 `readFontFileBytes`（字节版入口，materializer 复用）、`isKnownFontMagic`（ttf/otf/ttc/mac-ttf/woff/woff2）。扫描端（CFontList）与运行时（CFontStream）都经此入口，一处修改两端受益。
- `fontengine/CApplicationFontsWorker_private.java`：`SaveWebFonts` ① 跳过"自己拷贝自己"（序号未变场景，Copy 会先截断目标）；② 异或前先查魔数——副本已是混淆态（拷贝源为 fonts/ 旧副本）时跳过，防二次混淆损坏；`SaveAllFontsJS` 在 SaveWebFonts 后把字体清单 `m_wsFontPath` 改写为 fonts/ 副本绝对路径（后续序列化相对化/优先级计算（文件大小不变）/缩略图（经 readFontFile 解混淆）自动跟上）；`write_fonts_files`（bin AllFonts.js）直接写副本序号路径。
- `fontengine/CApplicationFontsWorker.java`：新增 `m_bPointSelectionToWebFonts`（默认 true，指向 fonts/ 副本模式）；`getFontFileList` 把 fonts/ 目录并入字体源（core-fonts 不在发布包时它是重生成与扩充的基线）；扫描列表按**内容指纹（大小+MD5，流式）去重**——指纹计算前按混淆规则还原前 32 字节，保证"明文源与混淆副本"同指纹（此 bug 曾导致每轮重生成 fonts/ 翻倍）；fonts.log 改记**最终纳入字体库的文件**（副本序号路径），与目标机扫描 fonts/ 的归一化结果匹配。
- `fontengine/CX2TFontsMaterializer.java`（新增）：x2t.exe（C++ 闭源，读不了混淆文件）的明文物化——把主 selection 指向的字体解混淆拷贝到 `bin/x2tfonts/`（按大小跳过已拷贝的），重序列化 selection（列表+ranges，复用 CFontList.ToBuffer），并生成改写版 AllFonts.js（`__fonts_files` → 明文副本绝对路径、重嵌 `g_fonts_selection_bin`）。幂等（x2tfonts 的 selection 不早于主 selection 即复用），synchronized 防并发。
- `graphics/NSFonts/NSFontsStatic.java`：`GetRelativePath` 跳过连续分隔符产生的空段（NSDirectory 拼接产生的 `fonts//000` 曾导致 fonts.log 归一化比对不等、跳过生成失效）。

**websocket 仓库**：`OfficeBase.java` 三处 x2t 调用点（转bin/存回/转pdf）接入 `CX2TFontsMaterializer.ensure`——OnlyOffice 引擎模式下 m_sFontDir/m_sAllFontsPath 指向 x2tfonts/（首次调用物化，仅该模式、仅目标机磁盘多一份明文，不进包）。

**发布脚本**（双副本同步）：`GenOfficeFonts.bat` 新增 `/keepcorefonts`（默认生成成功后删 staging core-fonts）；产物抽查兼容单份（`../../../fonts/`）与旧双份（`../../../core-fonts/`）两种布局；core-fonts 缺失但产物在时自动以 fonts/ 为源（重放场景）。`build_release.py` 新增 `drop_core_fonts()`（三个成功出口统一执行）与 `--keep-core-fonts`。

### 8.2 验证结果（dev 机器，2026-11-05）

| # | 场景 | 结果 |
|---|---|---|
| V1 | 生成指向 fonts/ | ✅ font_selection.bin / bin AllFonts.js / fonts.log 全为 `../../../fonts/NNN`；fonts/ 副本全部为混淆态（魔数非法）；web AllFonts.js 仍为编号 |
| V2 | 服务端读取解混淆 | ✅ FromBuffer 加载后全部字体路径存在、GetStream 可打开；FreeType 真实解析成功（生成日志可见 `CFontFile_0_[...fonts//000]` 创建） |
| V3 | 删 core-fonts 后跳过 | ✅ `--force false` → `skip generation!!`（fonts.log 与扫描归一化匹配；期间修复了指纹未解混淆、路径空段两个导致不匹配的 bug） |
| V4 | fonts/ 单源重生成 | ✅ 序号稳定（000→000）、fonts.log 逐字节一致、fonts/ 无膨胀、无二次混淆，T2Test 17/17 再通过 |
| V5 | 双源去重 | ✅ core-fonts+fonts/ 并存 / core-fonts 只放交集字体：去重后 fonts/ 文件数正确（同字体明文与混淆副本按内容合并） |
| V6 | x2t 物化 | ✅ x2tfonts/ 产出 selection（可加载、全部字体存在可读）+ AllFonts.js（绝对路径改写+重嵌 base64）+ 明文副本（魔数全部合法）；幂等复用毫秒级 |
| V7 | 回归 | ✅ `TestOfficeFontsAutoGenGuard` 21/21；bat/py 双脚本端到端（含 core-fonts 缺失重放场景、drop 幂等）通过 |

### 8.3 首次真实发布实测（2.02.90，2026-11-05）

`python build_release.py --war C:\docsysRel\DocSystem-2.02.90.war` 一条龙全流程跑通，exit 0：

| 阶段 | 实测 |
|---|---|
| CleanWar（Eclipse 导出 war 混入 10359 条 office 开发资料 + .git + 旧 font_selection.bin，共清 442MB） | 10.7 秒，四重自检通过 |
| 解压 war（41847 条目） | 56 秒 |
| Fonts.zip 并入 core-fonts | 369 拷贝 / 193 跳过(.fon/.dat) / 0 已存在 |
| **字体库全量生成**（源 552 个字体文件：369 Windows + core-fonts 全集 183，含 ttc 多 face） | **1329 秒（22 分钟，缩略图占 19.3 分钟）**，fonts/ 552 个文件 |
| 删 core-fonts + proguard + mxsdoc.jar | 转换合计 1696 秒 |
| 6 平台包 | 全部产出 + 自检 PASS |
| 包内抽查（tar 层） | fonts/ 552、core-fonts 0 残留、font_selection.bin 581 条全部 `../../../fonts/NNN`、缩略图 20、mxsdoc.jar 1 ✓ |
| 包体积 | linux/kirin-x64 1530MB、win 1500MB、kirin 1381MB、mac 1384MB、mac-arm64 1379MB（含平台 JRE 与全量字体；单份方案生效——无 core-fonts 双份） |

### 8.4 已知边界 / 未验证项

1. **Office引擎=OnlyOffice 的真实 x2t 转换**未实测（materializer 产物已验证可加载，但未跑真实 x2t.exe 转换链路）——用户回归测试时用 OnlyOffice 引擎打开/转换一次 Word 即可覆盖。
2. 字体集变化时插入点之后的序号会移动（font_selection.bin/AllFonts.js/fonts/ 同次重写自洽；浏览器旧缓存属既有 R3 行为）。
3. 重生成后序号收缩会在 fonts/ 留下无引用的孤儿文件（无危害，未做清理）。
4. 全量 Fonts.zip（~600 字体）的真实预生成耗时/内存同 §7.4-1，首次发布实跑后回填。
