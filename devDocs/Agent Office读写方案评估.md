# Agent Office / PDF 读写方案评估

评估日期：2026-09-23　　评估人：Agent（GitHub Copilot）　　裁定人：用户

> 本文回答"Agent 支持 Office 文件读写该选哪个方案"。所有"实测"数据来自本轮在 dev 环境真机跑出的探针
> （探针源码 `%TEMP%\docsys_chk\OfficeCap*.java`，产物 `office/test/tmp/officeCapProbe/`，**未改动任何生产代码**）。

---

## 0. 结论速览

**推荐：方案 1（POI + PDFBox）做主干，方案 3（FileConverter 移植）做格式补充；不采用方案 2（x2t 子进程）。**

三条决定性事实（都已在第 3 节给出实测证据）：

1. **"写"这件事只有方案 1 能做。** x2t 和 FileConverter 都是**格式转换器**，只能把一个已有的文件从 A 格式搬到 B 格式，
   不具备"从无到有生成内容"的能力；POI 能（本轮实测：新建 docx/xlsx/pptx 全部成功并回读一致）。
   用户需求里的"写 Office 文件"，无论最终用哪种引擎产出内容，**落到磁盘时只能是 POI（或自研 OOXML 写）**。
2. **"读"的现状比预期好得多：仓库内 Office/PDF 的文本读取今天就已经在生产路径上用 POI 跑着**，
   并且 Agent 的 `get_doc` 已经能拿到分页正文（`docText` + `offset/maxChars`）。所以"Agent 不能读 Office"只在
   **附件（聊天上传）**、**ODF/RTF/WPS 等 POI 覆盖不到的格式**、**表格/结构语义**这三类场景成立（见 §1.2）。
3. **方案 2 与方案 3 的能力面几乎重合（同一份 x2t 源码），但方案 3 没有外部进程依赖**；
   而方案 2 唯一的优势（C++ 原版更稳）在方案 3 的既有测试里恰好被用作"黄金对照"，不构成引入它的理由。

补充：用户提到的"让 x2t/FileConverter 直接产出 Markdown"**目前在两者中都不存在**（7.0.1 版 x2t 无此能力，
移植代码也无 Markdown 格式常量），属于新增开发，不是选型能白捡的收益（见 §3.4）。

---

## 1. 先纠正一个前提：Agent「不能读 Office」只对一部分场景成立

### 1.1 已经能读的部分（证据）

| 链路 | 位置 | 说明 |
|---|---|---|
| 服务端文本抽取 | `BaseController.checkAndGenerateOfficeContentEx` | Office 6 格式走 `OfficeExtract`（POI 4.0.0），pdf 走 PDFBox 2.0.12 |
| 接口出口 | `DocController.getDoc.do` `docType=1/3` → `doc.setDocText(...)` | Agent 的 `DocSysClient.getDoc()` 固定传 `docType=1` |
| Agent 工具 | `DocSysToolFactory.formatDocContent` | 渲染 `docText` + 表头"正文共 N 字符" + 页脚 `offset=` 续读；描述里明写"Office 转换后的文本" |
| 缓存与失效 | `Path.getOfficeTextFileName` | 缓存文件名含 `length + lastModified` → 写入后不会读到陈旧文本 |

也就是说：**在仓库里对 doc/docx/xls/xlsx/ppt/pptx/pdf 调 `get_doc`，今天就应该能拿到文本正文**（分窗口续读）。

### 1.2 真正读不到的部分（逐条有出处）

| # | 场景 | 根因（代码位置） | 现状 |
|---|---|---|---|
| G1 | **聊天附件**里的 Office/PDF | `AgentAttachmentSupport.readForTool`：`isTextLike()` 白名单命中失败 → 只回元信息 | 模型看不到内容 |
| G2 | **odt / ods / odp / rtf** | `FileUtil.isOffice()` 不含这些后缀 → 落进 else 分支 → `isBinaryFile()` → `content=""` | 完全读不到 |
| G3 | **wps / et / dps**（WPS 三件套） | `isOffice()` **声明**它们属于 Office，但 `OfficeExtract` 的 switch 没有对应分支 → 返回 false | **静默空结果**（最危险：模型会以为文件是空的） |
| G3b | **csv** | `isText()` 白名单里**没有** csv，而 `isOffice()` 里有 → 同样落进"Office 但无抽取分支" → 空 | `get_doc` 会对 csv 回"**非文本，无正文可读**"（结论错误，csv 就是文本）；附件侧却按文本处理（`TEXT_EXT` 含 csv）→ 两侧口径不一致 |
| G4 | xlsm / docm / dotx / dotm / xlsb 等 | 不在 `isOffice()` 白名单 | 读不到 |
| G5 | 表格 / 工作表 / 幻灯片**结构** | 只抽纯文本，无行列/分页语义 | 复杂表格语义丢失 |
| G6 | 扫描版 PDF | 无 OCR | 读不到 |

### 1.3 完全空白的部分：写

- `write_file` 工具描述明写"仅支持文本类型，Office 文件暂不支持"；
- 服务端 `agentWriteText.do` 有一道硬校验：`FileUtil.isTextFile(name) == false` → 直接报"暂不支持该文件类型"；
- 历史计划里已预留命名（`devDocs/Agent文件搜索与写入优化开发上下文.md`："避免与未来 agentWriteDocx 混淆"），即**这是一块从未开工的能力**。

---

## 2. 三方案能力矩阵

| 维度 | 方案 1：POI (+PDFBox) | 方案 2：x2t.exe 子进程 | 方案 3：FileConverter（纯 Java 移植） |
|---|---|---|---|
| 读 docx/xlsx/pptx 文本 | ✅ 生产路径已在用 | ✅（转 txt/转格式后再解析） | ⚠️ 有链但**当前坏的**（见 §3.3） |
| 读 doc/xls/ppt 文本 | ✅ HWPF/HSLF/HSSF 抽取器 | ✅ 可转成新格式 | ✅（doc→docx 实测通过） |
| 读 pdf 文本 | ✅ PDFBox | ✅ | ⚠️ PdfFile 主线仍在 bring-up |
| 读 odt/ods/odp/rtf | ❌ POI 无实现 | ✅ | ⚠️ 有 RtfFile/OdfFile 目录，未验证 |
| 读内嵌资源（图片等） | ✅ 原始字节（实测 pptx 2 张 PNG） | 只能整包落盘后再自己解 | 同左 |
| **新建** docx/xlsx/pptx | ✅ **实测通过** | ❌ 转换器定位，无"从零造"能力 | ❌ 同左 |
| **修改**已有 docx | ✅ **实测通过（保真度有限）** | ❌ | ❌ |
| 新建/写 .doc | ❌ POI 无受支持路径 | ❌ x2t 7.0 也不写 .doc | ❌ |
| 写 .xls | ⚠️ 可新建（HSSF） | ❌ | ❌ |
| 写 .ppt | ⚠️ 仅空骨架 | ❌ | ❌ |
| 产出 PDF | 仅 pdf→文本 | ✅（bin→pdf） | ✅（bin→pdf 实测 95KB） |
| 产出 Markdown | ❌ | ❌（无此格式） | ❌（无此格式） |
| 结构化访问（段落/单元格/形状） | ✅ **原生 API** | ❌ 只能整包给文件 | ⚠️ 需自己解析 OOXML/bin |
| 部署依赖 | 无（jar 已在 `WEB-INF/lib`） | **外部进程 + 20+ 平台二进制** | 无（同一份 Java 代码库） |
| 跨平台 | ✅ | 需为每平台带二进制 | ✅ |
| 单次开销 | 毫秒级 | 进程启动 + 转换（实测 0.3s~46s） | 同量级但无进程启动 |
| 演进性 | 只能停在 POI 的能力面 | 受 x2t 版本锁死（7.0.1） | **可加分支**（如 Docx2Md）——正是用户设想的落点 |

---

## 3. 实测数据（2026-09-23，dev 环境）

环境：JDK 8（`C:\docsysRel\docsys-WDK\...\jdk`）、classpath `WebRoot/WEB-INF/classes + WEB-INF/lib/*`；
POI 4.0.0 + poi-scratchpad + poi-ooxml；PDFBox 2.0.12；x2t 部署于
`…/web/static/office-editor/server/FileConverter/bin/x2t.exe`（7.0.1.37，41 MB）。
测试语料：`office/test/测试文件/` 下真实业务文件（合同/通知单/商业计划书/对账单）。

### 3.1 POI 读（就是生产路径 `OfficeExtract`，非另写代码）

| 格式 | 文件 | 大小 | 抽取结果 | 耗时 |
|---|---|---|---|---|
| docx | F-DC-QP-014-01-04 不合格品通知单1.22.docx | 30 KB | ✅ 154 字符 | 654 ms |
| doc | 文档管理系统企业版授权证书采购合同.doc | 59 KB | ✅ 1733 字符 | 120 ms |
| pptx | MxsDoc商业计划书-2025-12-10.pptx | 66 KB | ✅ 1938 字符 | 284 ms |
| ppt | MxsDoc商业计划书-2025-12-10.ppt | 116 KB | ✅ 1938 字符 | 94 ms |
| xls | 圆图202506对账.xls | 26 KB | ✅ 529 字符 | 168 ms |
| pdf | MxsDoc用户操作手册.pdf | 717 KB | ✅ 2164 字符 | 1361 ms |
| pdf | JGit Authentication Explained.pdf | 1.1 MB | ✅ 11867 字符 | 423 ms |

- docx 结构化读：`paragraphs=2 / tables=1（9 行）/ headers=3 / footers=3`，且**抽取器已包含表格文本**
  （`extractor chars=157` vs 纯段落 13 字符）→ 正文在表格里的表单类文档不会丢内容。
- pptx 结构化读：`slides=10`，第 1 页 `shapes=5`；xls：`sheets=1`，`lastRowNum=14`。
- 内嵌资源：pptx `pictures=2`，导出的 PNG 魔数 `89 50 4E 47 0D 0A 1A 0A` 正确 → **POI 能读资源文件（原始字节）**，
  只是 `OfficeExtract` 目前只抽文本、不导出图片。

### 3.2 POI 写（本轮实测）

| 用例 | 结果 |
|---|---|
| 新建 docx（标题 + 正文 + 2×3 表格） | ✅ 2491 B / 7 部件（含 `[Content_Types].xml`），回读 `tables=1`、含标题 |
| 新建 xlsx（文本 + 数字 + 公式 `SUM`） | ✅ 3385 B / 9 部件，公式求值 `3.0` |
| 新建 pptx（文本框） | ✅ 25185 B / 37 部件 |
| **修改已有 docx**（改首个 run 文本 + 追加单元格文本） | ✅ 27014 B，**原包 21 个部件全保留**（页眉/页脚/图片）；回读含修改 |
| **交叉校验**：POI 产物喂给 C++ x2t 7.0.1.37 | ✅ `exit=0`，再产出 28608 B docx → 说明 POI 写出的包**结构合法**，不是"只有 POI 自己能读" |
| **交叉校验**：POI 产物喂给 Java FileConverter | ✅ `docx→doct_bin` 1210 B、`xlsx→bin` 1520 B、`pptx→bin` 52804 B，ret=0 |
| 新建 .xls | ✅ HSSF 可新建并写出、回读正常 |
| 新建 .ppt | ⚠️ `HSLFSlideShow` 只能产空演示骨架（10240 B） |
| 新建 .doc | ❌ HWPF 无"从零创建"的受支持路径（POI 官方能力边界） |
| ODF / RTF | ❌ POI 无实现 |

### 3.3 FileConverter（纯 Java 移植）13 项

**已通（8 项）**

| 用例 | 结果 |
|---|---|
| doc → docx | ✅ ret=0，15475 B / 13 部件 |
| xls → xlsx | ✅ ret=0，9236 B / 11 部件 |
| ppt → pptx | ✅ ret=0，35155 B / 38 部件 |
| docx → doct_bin | ✅ ret=0，26836 B |
| doc → doct_bin | ✅ ret=0，45129 B |
| POI-docx → doct_bin | ✅ ret=0 |
| POI-xlsx → xlst_bin / POI-pptx → pptt_bin | ✅ ret=0 |
| docx → doct_bin → pdf | ✅ ret=0，95118 B（链式 46 s，其中渲染 362 ms / 保存 519 ms，其余为字体加载） |

**未通（3 项，都是"产出文本"方向）**

| 用例 | 结果与根因 |
|---|---|
| docx → txt | ❌ `AVS_FILEUTILS_ERROR_CONVERT (0x80041350)`；根因 NPE 于 `TxtFile/Docx2Txt/Converter_Impl.java:292`（`Lists.add(-1)` 而 `Lists==null`：生成式构造函数在 `Converter_Impl_init()` 之后又执行 `Lists = (null)`）。**用反射补上 Vector 后**，`convert()+writeUtf8()` 返回 true，但**输出只有 3 字节（BOM，正文为空）** → 这条链不是"差一行"，是**尚未真正实现**。影响面：`docx2txt`、`doct_bin2txt` 等所有"转 txt"分支 |
| xlsx → csv | ❌ NPE 于 `NExtractToolsStatic.fromXlstBin:6118`（同一份 xlsx 走 `→bin` 是通过的，说明是 csv 专有分支的问题） |
| txt → docx | ❌ 入口阶段 NPE 于 `COfficeFileFormatChecker.isOfficeFile:1299`：把 `.txt` 当 XML 解析，异常未捕获（**"文本→Office"这条最有价值的写法在移植里也是坏的**） |

### 3.4 x2t.exe（部署版 7.0.1.37）

| 用例 | 结果 |
|---|---|
| docx → docx | ✅ exit=0，313 ms，28807 B |
| **docx → txt** | ✅ exit=0，772 B（UTF-8 BOM），内容是**带表格分隔线的结构化纯文本**（`-----` 分隔 + 单元格文本）——比 POI 的 154 字符更"有结构" |
| doc → docx | ✅ exit=0，15179 B（与移植版 15475 B 相近但不逐字节相同） |
| **Markdown 输出** | ❌ `x2t.exe` 二进制里搜不到 `markdown` 字样；移植代码也无 Markdown 格式常量 → 7.0.1 **没有** Markdown 能力 |
| "解压成目录"输出 | ❌ 我试了 3 种写法（`formatTo=docx`、`DOCX_PACKAGE=84`、目标路径带尾斜杠）分别得到"单个文件"、exit=88、`Couldn't create temp folder`。**但这不是阻塞**：docx/xlsx/pptx 本身就是 zip，"解压"用 `java.util.zip` 即可，生产代码也是这么做的（`COfficeUtils.ExtractToDirectory`） |

---

## 4. 推荐路径与理由

### 4.1 为什么否决方案 2（x2t 子进程）

1. **不解决"写"**：转换器不能凭空生成内容，而"写 Office"是本需求里最难、也是唯一完全空白的一块。
2. **部署耦合**：Agent 要依赖一个 41 MB 外部可执行物 + 20 多个平台二进制；dev 里有（随 office-editor 部署），
   但生产是否带、Linux 版是否可用都需另行确认；而 Office 编辑器本身已经是可选组件（`officeDisabled`）。
3. **拿不到结构**：它只吐文件，Agent 要的"表格是几行几列/哪些单元格是空的"还得再解析一层，等于绕路。
4. **能力可被方案 3 覆盖**：同一份 x2t 源码的 Java 移植已经在同一代码库里跑通老格式转换与 PDF 产出，
   而 x2t 唯一的相对优势（C++ 更稳）在既有测试中恰好是被当成"黄金对照"用的，不需要在运行时引入它。

### 4.2 为什么方案 1 必须是主干

- **读**：它已经是生产路径（`getDocContent.do` / `getDoc.do` / 全文索引都靠它），换引擎等于把已经工作的东西拆掉重做；
  Agent 侧 `get_doc` 的分页契约也已围绕它设计好。
- **写**：只有它能"造内容"（实测 docx/xlsx/pptx 新建 + docx 修改，且产物过 C++ x2t 校验）。
- **结构化**：段落/表格/工作表/形状/内嵌图片都是原生 API，正好补 G5。

### 4.3 为什么方案 3 仍要留在路线图里

- 它是**唯一能补 G2/G3/G4** 的现成资产：把 odt/rtf/wps/et/dps 先转成 docx/xlsx/pptx，再交给 POI 读——
  这样"格式覆盖面"的增长不需要新写解析器。本轮已实测它能把老格式转新格式（`doc→docx` / `xls→xlsx` / `ppt→pptx` 全通）。
- 它是**纯 Java、无进程、可加分支**的：用户设想的"直接产 Markdown"应该加在这里（`TxtFile` 族新分支），
  而不是加在 POI（做不到）或 x2t（二进制改不了）。
- 它已经在同一仓库里维护（`devDocs/MxsOffice开发总计划.md` 显示 Word/Excel/PPT 三条回环主线已"收束"），
  纳入 Agent 不需要新起一套工具链。

### 4.4 分期建议

| 期 | 目标 | 关键工作 | 验收 |
|---|---|---|---|
| **P1（读打通，小）** | 把"已经能读"的读全、把静默失败变成显式错误 | ① 附件链路：Office/pdf 附件走同一抽取路径（服务端 `OfficeExtract` 或本地 POI）② `wps/et/dps` 不再静默空（要么接方案 3 转换，要么明确报"暂不支持该格式"）③ `odt/ods/odp/rtf` 明确报错或接方案 3 ④ **csv 归到文本读取**（一行改动即可，却影响日常） | 对 §1.2 的 G1~G4 每一条给出"能读"或"有明确错误码"的实测结论 |
| **P2（写打通，中）** | 新增 `write_office` 工具 + `agentWriteDocx.do` | 服务端复用 `agentWriteText.do` 的既有链路（`addDoc` + 锁 + 版本提交 + 系统日志），把内容换成 base64→`byte[]`→`FileUtil.saveDataToFile`；工具层限 `docx/xlsx/pptx`；写入后 POI 回读自检并回执 size | 新建 + 简单修改各一例，产物通过 POI 回读与 x2t 校验 |
| **P3（结构化读，中）** | `get_doc` 之外补"表格/工作表/幻灯片"视图 | 基于 POI 原生 API（不新增引擎） | 一份含表格 docx、一份 xlsx、一份 pptx 的可读输出 |
| **P4（可选）** | 方案 3 接入 + txt/Markdown 链修复 | 修 `Docx2Txt`（现为空输出）、`txt2docx` 入口 NPE、`xlsx2csv` NPE；新加 Docx→Markdown 分支 | 老格式转换 3 例 + txt/MD 各 1 例 |

**写能力的边界必须写进工具描述**（避免模型承诺做不到的事）：
- 支持：新建 `docx/xlsx/pptx`；简单修改现有 `docx/xlsx/pptx`（替换文本、追加段落/行/页）。
- 不支持：**生成 `.doc/.ppt`**（POI 与 x2t 都不支持）；`.xls` 仅能新建不宜改；
  复杂文档（图表/SmartArt/OLE/复杂样式）修改保真度不可承诺；
  加密（`MSCRYPT`）文档需先解密。

---

## 5. 需要你裁定的事项

1. **是否采用"方案 1 主干 + 方案 3 补充、不用 x2t 子进程"**？若你认为"生产环境已经有 office-editor 和 x2t"（部署不是问题），
   也可以把 x2t 放进 P4 作为"疑难格式兜底"，但我不建议让它进主干。
2. **写入的文件类型范围**：只 `docx/xlsx/pptx`（推荐），还是必须支持 `.doc/.xls/.ppt`（技术上做不到，只能转存新格式）？
3. **是否允许"改已有文件"**？我建议 P2 先只做"新建 + 简单修改"，否则保真度风险会变成用户可见的"文件被改坏"。
4. **ODF/RTF/WPS 是否在本期范围**（现在完全没有；接方案 3 需要先做 P4 的转换链修复）。
5. **P1 是否可以先做**？它最小、且能把当前"静默空结果"（G3 `wps/et/dps`）变成明确错误——这是我认为最值得先修的一条。

---

## 6. 未验证 / 风险

1. **Word 本机无法验证**：本机 Word COM 调用会静默挂起（既有教训），所以"POI 写出的文件 Word 打开是否提示修复"
   只能用代理校验（POI 回读 + C++ x2t 通过）。**建议 P2 验收标准写成"三方交叉校验通过"**，不承诺"Word 无提示"。
2. **POI 写复杂文档的保真度未测**：本轮只测了含表格/页眉/页脚的真实通知单，未覆盖图表、SmartArt、OLE、复杂编号。
3. **方案 3 的 ODF/RTF 完全未验证**：`RtfFile/`、`OdfFile/` 目录存在，但没有样例证据，工时不可估。
4. **POI 4.0.0 偏老（2018）**：`XWPFWordExtractor` / `XSLFPowerPointExtractor` 在 POI 5 已被移除。
   若将来升级 POI，`OfficeExtract` 必须改写为 `XWPFDocument` 遍历式抽取。选型本身不受影响，但这是升级时的一个已知工单。
5. **PDF 只测了文本型**：扫描件（图片型 PDF）无 OCR，本轮两个 PDF 都是文本型；2164 字符/717 KB 的低产率说明
   手册类 PDF 主体是截图，内容天然不可读（属预期，不是缺陷）。
6. **不推荐方案 2 不代表它没用**：现有 `isOnlyOfficeUsed` 开关继续保留给 Office 编辑器的既有链路，本文不做改动建议。

---

## 附录：本轮探针与产物

| 探针（`%TEMP%\docsys_chk\`） | 作用 |
|---|---|
| `OfficeCapPoiProbe.java` | POI 读（生产 `OfficeExtract`）+ 结构化读 + 新建三格式 + 改 docx + 老格式写 + 不支持格式 |
| `OfficeCapFcProbe.java` | FileConverter 13 项转换（老→新、→bin、→txt/csv、交叉校验、链式 pdf） |
| `OfficeCapTxtProbe.java` | 定位 docx2txt / xlsx2csv 失败根因（含异常栈） |
| `OfficeCapTxt2Probe.java` | 反射实验：证明 docx2txt 不是"差一行"而是空输出 |
| `OfficeCapTxt3Probe.java` | txt2docx 入口崩溃定位 |
| `OfficeCapXlsxProbe.java` | POI 产物 vs 转换器自产物的互换性（3 通过） |
| `OfficeCapPdfProbe.java` | PDF 文本抽取（PDFBox） |
| `OfficeCapImgProbe.java` | 内嵌图片（资源文件）原始字节读取 |
| `x2t_*.xml` + `x2t.exe` | docx→docx / docx→txt / doc→docx / 校验 POI 产物 / 试目录输出 |

产物目录：`src/com/DocSystem/websocket/office/test/tmp/officeCapProbe/`（gitignore 覆盖，不入版本控制）。
