# CURRENT_STATE：MHT 格式打开与 Word 本地打开不一致（视觉布局差异 + 表格边框丢失）

> 2026-11-12 用户建卡。由「Office 文件无法打开」任务衍生（该文件已能打开，剩余问题超出"无法打开"范畴）。
> **状态：未开工**（仅完成建卡前的结构对比，见 §三）。

## 一、任务定义

MxsDoc 打开 MHT 假扩展名文件后，与 Word 本地直接打开的**视觉效果不一致**：
1. 内容布局有出入
2. **"丢失"了一个真正的表格**（视觉上不再是表格）

**对比输入文件（正式库物理路径，只读）**：
- 原文件（MHT 假 .doc）：`C:/DocSysReposes/1/data/rdata/Word文件MHT格式打开的格式和本地打开不同/2020年度企业基础信息表.doc`（3900B）
- **正确参照**（用户用 Word 另存的 docx，在 MxsDoc 上显示正确）：`C:/DocSysReposes/1/data/rdata/Word文件MHT格式打开的格式和本地打开不同/word.docx`（14322B）

注意：该文件已从 `Word文件无法打开/` 目录移到上述新目录；旧目录下已无此文件。

## 二、背景（必读，避免重复排查）

1. **前三轮修复已完成**（详见 `DevAgentControl/OFFICE文件排查方法与经验总结.md` §一 最后两行）：
   - 打不开：`OfficeBase.detectActualFormat` 加 MHT 分支 + `COfficeFileFormatChecker.isMultiPartsHtmlFormatFile` 大小写不敏感化
   - MIME 头入正文：`CHtmlFile2_Private.mhtXhtml` 大小写坑（误走 htmlXhtml 兜底）→ 1 行修复
   - 表格窄竖条：`CHtmlFile2_Private` tblW 分支对绝对宽度硬编码 pct → 改写 dxa（当前 ×10）
   - 以上已验证：E2E-PASS、MIME 残留=false、回归 verify_doc_pipeline -Fast 全绿；用户实测确认 MIME 问题已解决
2. **当前链路**：`detectActualFormat → "mht"(71/8193) → CHtmlFile2.OpenMht → mhtXhtml → HtmlToXhtml.mhtToXhtml（jsoup 自研，boundary/part/base64/QP 完整）→ CHtmlFile2_Private.write() 产中间 docx → docx→bin`
3. **三层大小写坑教训**：同一根因曾埋在检测器/detectActualFormat/mhtXhtml 三层——本卡涉及的 HTML 属性处理（border/width 等）注意类似"从未走通"的盲区
4. **诊断工具（test 仓库，输出在 `test/tmp/Diag2020MhtDoc/`）**：
   - `DiagMhtE2E <输入> doc <outDir>`：复刻服务端打开链（检测→convert→bin），内置 MIME 残留/正文断言
   - `DiagTiming <bin> <outDir> notemp <fontDir> 8193 65`：bin→docx（产物名 Editor.bin 实为 docx）
   - 最近产物：`e2e3/`（MHT 链最新 bin）+ `e2e3/docx/`（其 docx 反转）

## 三、根因确认（2026-11-12 开工，DiagBorderStyle 实测 + 产物复核，取代建卡前候选）

实测修正建卡结论：**缺 tblW 的是表 2（border="1" 那张），不是表 3**；表 1/3 均有 tblW=6600。

| # | 根因（已实测确认） | 证据 |
|---|---|---|
| 1a | `CBorder.SetSides/SetWidth/SetStyle/SetColor` 四边方法为**短路 OR**：left 边解析成功则 top/right/bottom 不设置 → `border="1"` 只设了 left.width=1（"1" 裸数字过 CDigit 正则），四边 style 全空 | DiagBorderStyle：CBorder.Empty()=false、EqualSides()=false、bottom 全空；连 `border="1px solid"` 合法简写也只设 left。**官方溯源**：移植源代（core 2023-06）确为短路 `\|\|`（移植忠实）；**官方 2024-05-23 提交 4ca9a946 已改为四边全设**——本轮修法与官方一致 |
| 1b | readTable 不 EqualSides 分支把 GetId() 裸插进 tblW 属性区：**已对照官方 core 仓库移植源代（2023-06 `HtmlFile2/htmlfile2.cpp`）修正定性——原版是 `wsTable.insert(35, oStyle.GetId())`，同样无任何 XML 包装，原版即坏**（非"移植丢前缀"）；产生非法 XML → bin 链丢弃 tblW（=表 2 缺 tblW 的直接原因）；sBorders 四边空 val/color/sz → bin 链规整为 none sz=0（=边框视觉丢失）。官方后来（2024-05 起）干脆重写了整块 table 处理（TTableStyles/CalculateBorderStyle，老 readTable 丢弃） | 原版原文 `wsTable.insert(35, oStyle.GetId())`；产物表 2 tblPr 干净无 tblW、tc 边框 none sz=0（区别于表1/3 的 sz=4） |
| 2 | HTML 属性无单位值（width="660"）→ CDigit `unit=None` → `ToInt(Point,·)` 原样返回 660 → readTable/readTr `×10`=6600。正确语义：无单位=px → 660px=495pt → ×20 dxa=**9900**（word.docx 实测 9900 ✓）；tcW 同 ×10 同错 | DiagBorderStyle：660 无单位 ToInt(Point)=660、660px=495；ConvertPx(v,Point,96)=0.75v |
| 3 | readTr/readTable 的 `styleUsesPercentWidth(m_wsStyle)` 只查 style 串 → **属性式 `width="50%"` 恒走 dxa 分支**，且 pct 值写的是 `ToInt(Point,deviceW)`（deviceW×0.5=2470 点数）而非 OOXML pct 单位（50%应写 2500=50×50） | 产物表 2 两个 tcW=24700 dxa（溢出页面）；word.docx 同位置=2500 pct |
| 4 | EqualSides 分支 sSz=`GetWidth().ToWString()` 输出 "1.0"（Double.toString，非整数，OOXML sz 须整数=1/8pt）；sColor/sStyle 空时写空串 | CDigit.ToWString 源码；word.docx 参照：表2 tblBorders outset sz=6 color="auto" |

边框参照全貌（word.docx 表 2）：tblW=9900 dxa + tblBorders 四边 outset sz=6 color=auto（无 insideH/V，靠单元格继承）；cellpadding="0" → tblCellMar left/right=0。我们方案：修好值后由 tcBorders 逐格表达（single/outset sz=6），视觉等效。

## 三b、修复方案（6 处精准小改，office 仓库）

**官方原版溯源（2026-11-12 用户 review 后查证，来源 ONLYOFFICE/core GitHub）**：移植版对应原版 = `HtmlFile2/htmlfile2.cpp` 内嵌类 CHtmlFile2_Private 的 2023-06 形态（commit 96662a23，readTable 小写签名与移植注释逐字对应）。查证结论：
- **normalizeHtmlAttrValue 是全新补齐，不是移植遗漏**：原版 GetSubClass（2023-06 与现行 master 皆然）属性一律原样入 m_mAttributes，从未有"无单位→px / border→width+style"转换；官方后来也没修，而是重写了整块 table 处理
- **CBorder 短路：移植忠实，但官方 2024-05-23（4ca9a946 "Fix bugs in html"）已修复为四边全设**——移植源早于该修复 11 个月，带着官方已修掉的 bug；本轮修法与官方殊途同归
- **原版自身即有的其他缺陷**（移植忠实照搬）：insert(35) 裸插 id（见 1b）；EqualSides else 分支 sStyle 四边全取 LeftSide（原版复制粘贴错，比移植版的 GetColor 笔误更夸张）；tblW 硬编码 pct；tcW ×10
- **移植版略过的一个原版过滤**：CheckArgumentMath（border 属性仅对 table 元素生效，非 table 的 border 不入样式）——影响 benign（img border="0" 规范化为 "0px" → Empty → 无效果），暂不补


1. `NSCSS/NSProperties/CBorder.java`：4 个四边方法去短路（全部执行、聚合返回值）
2. `NSCSS/NSProperties/CBorderSide.java`：SetStyle 映射 `outset`→`outset` 直通（原 thickThinMediumGap；OOXML val=outset 与 CSS outset 视觉对应更准，匹配 word.docx 参照）
3. `HtmlFile2/CHtmlFile2_Private.java` GetSubClass（1073 行）+ readStyle2（1003 行）两处属性规范化：width/height 纯数字补 "px"；border 纯数字 N → "Npx outset"（HTML border 属性语义=px 宽实框；border="0"→width 0→Empty()→走全 none 分支自然正确）
4. readTable：tblW dxa ×10→×20；pct 分支值改 ToDouble()×50（原始百分比）；percentWidth 判断扩展到 width 属性；EqualSides/不 EqualSides 分支 sSz 整数化（pt×8 四舍五入，空→"4"）+ sColor 空→"auto" + sStyle 空→"none"；删 substring hack
5. readTr tcW：同 4 的系数/pct/判断三改

## 三c、建卡前结构对比结论（2026-11-12，部分被三修正）

对比 `e2e3/docx/Editor.bin`（我们的产物）vs `word.docx`（正确参照）的 document.xml：

| 项 | 我们 | Word 参照 | 判定 |
|---|---|---|---|
| 表数量/行数/格数/文本 | 3 表（24/3/1 行），文本一致 | 同左 | **数据层无丢失**，问题在属性/渲染层 |
| 表 2（签章表，源 `border="1"`）边框 | 无 tblBorders，24 个 tc 边框全 `none` | `tblBorders outset sz=6` 齐全 | **❌ 根因候选#1：border 属性完全没参与边框计算 → "表格视觉丢失"直接原因** |
| tblW 数值 | 6600 dxa（×10） | **9900 dxa**（660px × 15 twips/px） | ❌ 根因候选#2：px→dxa 系数错（宽度偏窄 2/3；注意 tcW 的 ×10 是 C++ 沿用，px 语义下同样存疑） |
| 表 3（监制行）tblW | **缺失**（全文仅 2 个 tblW 元素） | 9900 dxa | ❌ 根因候选#3：第三张表为何没走 tblW 写出分支（待查 writeTable 路径/样式计算） |
| 表 1/表 3 单元格边框 | 全 none（源 border="0"，合理） | 无边框定义 | ✓ 合理 |

对比脚本要点（可复跑）：python zipfile + regex 提取 `<w:tbl>`/`<w:tblW>`/`<w:tblBorders>`/tc 边框计数。

## 四、建议排查计划（开工时按此展开）

1. **边框链**：源 HTML `border="1"` 属性 → CHtmlFile2 的样式计算（GetCompiledStyle/m_oStylesCalculator）→ tblBorders/tcBorders 写出（`CHtmlFile2_Private` 搜 `border`/`tblBorders`/`tcBorders`）。确认属性式 border 是否根本没进 CSSStyle。
2. **宽度系数**：GetWidth().ToInt(UnitMeasure.Point,…) 对 px 的返回值语义；dxa 正确换算（px×15）。tcW 的 ×10 一并复核（注意回归覆盖 doc 链不受影响——tcW×10 是既有行为，改动需谨慎+有本样本验证）。
3. **表 3 缺 tblW**：为何 oStyle 宽度=0 且 else-if 分支也没写（查 m_ushWidth 与该表样式来源）。
4. 修复原则：CLAUDE.md「测试覆盖决定修改方式」——每处修复用本文件样本验证 + word.docx 对比断言（建议把对比断言固化成 Diag 类或 verify 脚本步骤）；改 CHtmlFile2_Private 后跑 verify_doc_pipeline -Fast（它不覆盖 HtmlFile2，仅防连带）。
5. 验证收尾：E2E + bin→docx 与 word.docx 结构对比 + 用户浏览器实测（视觉最终标准）。

## 五、生效约束

- CLAUDE.md 通用纪律全部适用（编译 `-g -encoding UTF-8 -d WebRoot/WEB-INF/classes`；Eclipse touch 后才生效；测试 scratch 进 `office/test/tmp/`；精准修复禁批量替换）。
- 代码归属：HtmlFile2 改动 → office 仓库；若触上层 → websocket 仓库；诊断类 → test 仓库。
- ⚠️ dev 实例 = `C:\TomcatForDocSysDev`；`C:\MxsDoc` 正式实例不碰（对比文件只是读取其磁盘路径，属只读分析，已获用户认可的使用方式）。
- 视觉最终标准以用户浏览器实测为准（Word 本地打开效果为参照基准）。

## 六、当前进展

- **2026-11-12 开工并完成修复与命令行 E2E 验证**（根因见 §三、方案见 §三b，全部实施）：
  - 修复落地（office 仓库 3 文件，已编译到 WebRoot/WEB-INF/classes）：`NSCSS/NSProperties/CBorder.java`（4 个四边方法去短路）、`NSCSS/NSProperties/CBorderSide.java`（outset→outset 直通映射）、`HtmlFile2/CHtmlFile2_Private.java`（normalizeHtmlAttrValue 属性规范化 + borderSz/borderWStr 兜底 + tblW/tcW 单位分派重写 + 删 substring hack + 修正 sStyleBottomSide 取 GetColor 笔误；删除上一轮的 styleUsesPercentWidth）
  - 过程中修掉一个自引入回归：border="0" 若规范化为 "0px outset" 会因 style 非空误判有边框（表 1/3 被画上 sz=4 框）；已改为 N=0 时只补 "0px"
  - **E2E 全部对齐参照**（e2e5）：三表 tblW=9900 dxa；表 2 边框中间 docx=`outset sz=6 color=auto`（与 word.docx 逐字一致）、bin→docx 后= single sz=6；表 1/3 tcBorders none sz=4（无边框，同参照）；表 2 首行 tcW=2500 pct ×2（与参照完全一致）；MIME 残留=false、正文断言保持
  - **关键佐证**：word.docx 参照自身经 docx→bin→docx（DiagTiming 65→8193→65）后 outset 也被 sdkjs 规整为 single sz=6——两条链在显示端（bin）完全等价，outset 差异只存在于下载/另存路径（我们中间 docx 保真 outset 更接近 Word）
  - 产物目录：`test/tmp/Diag2020MhtDoc/e2e5/`（bin+docx）、`wordref_bin/`（参照 bin 对照）；诊断类 `test/DiagBorderStyle.java`（样式层单点验证）
  - 回归 verify_doc_pipeline -Fast：**全绿 PASS**（2026-11-12，Step 1.6/1.7/2/3 全部 PASS，"验证通过"）
- **遗留（用户侧）**：Eclipse touch `CBorder.java` + `CBorderSide.java` + `CHtmlFile2_Private.java` → 重启 dev Tomcat → 浏览器实测（对照 Word 本地打开）；提交（office 仓库 3 文件 + test 仓库 DiagBorderStyle）。**2026-11-12 用户已提交（代码已合入）**
- 下一 session 起手：读本卡 + CLAUDE.md → 看 §七 差异定性 → 待用户裁定开工范围与行高基准。

## 七、第三轮差异定性（2026-11-12 用户实测反馈 5 条；同日用户澄清后定稿，未修）

**两条关键澄清（用户裁定）**：① word.docx 在 MxsDoc（OnlyOffice 前端渲染器）里显示正确、与 Word 打开基本一致 ⇒ **渲染器可信，一切显示差异 = 我们 bin 里的值不对**；② 修复标准 = 对齐 word.docx 经 bin 链后的值（不再以"Word 打开原 MHT"为基准）。结论：**5 条全部是我们没正确处理布局信息，无一是渲染机制差异**。

| # | 反馈 | 定性 | 缺陷点（均已实测证实） |
|---|---|---|---|
| 1 | 标题字号不一致 | 我们缺换算 | `CDocumentStyle.SetRStyle`：R_Sz 直写 `m_oFont.GetSize()` 的 **pt 值**（18.0），缺 ×2（w:sz 单位=半磅，18pt→36）；且带 ".0" 小数非法（bin 链规整成 18=9pt）。实测：中间 docx `w:sz="18.0"`，参照=36 |
| 2/3 | 两行没居中 | 我们断链 | HTML `td align="center"` → `CCompiledStyle.AddStyle` case "align" → `m_oDisplay.SetHAlign`（仅表级 tblPr jc 消费）；段落 `w:jc` 从 `m_oText.GetAlign()`（CSS text-align）取 → 恒空。td@align 与段落 jc 无桥接。实测参照 jc=center、我们全 None（含签章行 right） |
| 4 | 字体不一致 | 我们硬编码 | `CXmlElement.ConvertRStyle` R_RFonts 分支：`wsFontFamily` **硬编码 "Times New Roman"**，取到的 `oItem.getValue()`（宋体）不用——所有文本字体全变 TNR。中间 docx 即如此（非 bin 链替换） |
| 5 | 经办人行行高不一致、内容看不到 | **我们的坏值 line="0"** | 完整链条已实证：表 2 的 3 个段落样式（td-20/22/23）带 `<w:spacing w:line="0" w:lineRule="auto"/>`，来源 = `CDigit.ToDouble()` 对 Empty 返回 **0.0**（非空标记）→ `getFontLine` 的 null 检查失效 → 0×12=0；只有表 2 中招（m_oBorder 非空才走 getFontLine 分支，与用户抱怨精确到表级吻合——表 1/3 无 line=0）。**参照 word.docx 的 styles+document 完全无任何 spacing/line 设置**，显示正常 ⇒ 渲染器按 0 行高忠实渲染，源头是我们写了坏值。trHeight：参照也没有（Word 另存丢行高且用户认可其显示）⇒ **按对齐标准不补 td@height→trHeight** |

附带发现（本轮不修，记录在案）：
- `getLineHeight` 的换算系数可疑：None→×24、Percent→×0.24（lineRule=auto 时 w:line 单位=1/240 行，无单位 line-height:1.4 应≈336 而非 34）——本样本无 line-height 未触发，遇到再修
- docDefaults=Arial 22 是老版 C++ 原版固有（对照 2023 原版 htmlfile2.cpp 299 行原文），参照 word.docx=Times New Roman（Word 另存结果）——是否对齐 docDefaults 属产品决策（参照 docDefaults=rFonts TNR+eastAsiaTheme，无 sz）
- **修复方向（定稿，待用户指示开工）**：① R_Sz 写 `(int)(pt*2+0.5)`；② td/th 的 align 属性桥接到 text-align（或 wrP 取 jc 时 fallback HAlign）；③ R_RFonts 用实际字体名（写入 w:ascii/hAnsi/cs/eastAsia 四槽或至少 eastAsia）；④ getFontLine 对 Empty/≤0 的 font-size 返回空串（不写 w:line）；⑤ 不补 trHeight（对齐参照）

## 八、第四轮修复实施（2026-11-12 用户指示开工，同日完成命令行验证）

按 §七 清单全部落地（office 仓库 3 文件，已编译到 WebRoot/WEB-INF/classes）：
1. `NSCSS/CDocumentStyle.java`：新增 `getFontSz`（CDigit Empty/≤0 不写；Pixel→pt×0.75、Percent→默认12pt 折算；`(int)(pt*2+0.5)` 输出半磅整数），`SetRStyle` 的 R_Sz 改用之；**删除 `getFontLine` 及 spacing 拼接里两个 m_oBorder 分支**（其一不可达死代码）——无显式 line-height 一律不写 w:line；顺带删除失去唯一调用方的 `fieldGetterToDouble`
2. `common/html/CXmlElement.java`：`ConvertRStyle` R_RFonts 分支改用 `oItem.getValue()` 实际字体名写四槽（原硬编码 Times New Roman、取值不用）
3. `HtmlFile2/CHtmlFile2_Private.java`：`GetSubClass` 属性收集后新增块级 align→`text-align:` 桥接（td/th/p/div/h1-h6；table/tr/tbody 不桥接——表位置语义/行级继承无样本），helper `isBlockAlignTag`

**E2E 断言（e2e6，vs 参照 word.docx 逐项）**：标题 jc=center+sz=36+eastAsia=宋体 ✓；A类行/税款行 jc=center ✓；签章行/年月日行/监制行 jc=right ✓；谨声明 sz=26 ✓；`w:line="0"` 出现 0 次 ✓（表 2 内容恢复可见）；前轮成果保持：tblW=9900×3、tcW=2500 pct×2、tcBorders none sz4×33 + single sz6×6 ✓。E2E-PASS（MIME 残留=false、正文断言保持）。
已知可接受偏差：监制行参照无 sz（Word 另存丢了 12pt 字号）而我们有 sz=24——按源样式写出是对的，差异属参照失真。
- 回归 verify_doc_pipeline -Fast：**全绿 PASS**（2026-11-12，Step 1.6/1.7/2/3 全部 PASS，"验证通过"）
- 遗留（用户侧）：Eclipse touch `CDocumentStyle.java` + `CXmlElement.java` + `CHtmlFile2_Private.java` → 重启 dev Tomcat → 浏览器实测；提交（office 仓库 3 文件）
