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

**裁定与进展（2026-09-23）**：用户已采纳本推荐（§5），并同意先做 P1。**P1 当日完成并验证**：附件/仓库内的
`wps·et·dps`/csv 读取已打通，odt·rtf 改为明确报"暂不支持"；改动与实测数据见 **§7（"简单修改"定义）** 与 **§8（P1 实施记录）**。

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
| **P1（读打通，小）** ✅ **已完成（2026-09-23，见 §8）** | 把"已经能读"的读全、把静默失败变成显式错误 | ① 附件链路：Office/pdf 附件走同一抽取路径（服务端 `OfficeExtract` 或本地 POI）② `wps/et/dps` 不再静默空（按**魔数**归一化，实测已通）③ `odt/ods/odp/rtf` 明确报"暂不支持"④ **csv 归到文本读取** | 对 §1.2 的 G1~G4 每一条给出"能读"或"有明确错误码"的实测结论 → ✅ 已给出（§8.2） |
| **P2（写打通，中）** | 新增 `write_office` 工具 + `agentWriteDocx.do` | 服务端复用 `agentWriteText.do` 的既有链路（`addDoc` + 锁 + 版本提交 + 系统日志），把内容换成 base64→`byte[]`→`FileUtil.saveDataToFile`；工具层限 `docx/xlsx/pptx`；写入后 POI 回读自检并回执 size | 新建 + 简单修改各一例，产物通过 POI 回读与 x2t 校验 |
| **P3（结构化读，中）** | `get_doc` 之外补"表格/工作表/幻灯片"视图 | 基于 POI 原生 API（不新增引擎） | 一份含表格 docx、一份 xlsx、一份 pptx 的可读输出 |
| **P4（可选）** | 方案 3 接入 + txt/Markdown 链修复 | 修 `Docx2Txt`（现为空输出）、`txt2docx` 入口 NPE、`xlsx2csv` NPE；新加 Docx→Markdown 分支 | 老格式转换 3 例 + txt/MD 各 1 例 |

**写能力的边界必须写进工具描述**（避免模型承诺做不到的事）：
- 支持：新建 `docx/xlsx/pptx`；简单修改现有 `docx/xlsx/pptx`（替换文本、追加段落/行/页）。
- 不支持：**生成 `.doc/.ppt`**（POI 与 x2t 都不支持）；`.xls` 仅能新建不宜改；
  复杂文档（图表/SmartArt/OLE/复杂样式）修改保真度不可承诺；
  加密（`MSCRYPT`）文档需先解密。

---

## 5. 需你裁定的事项（✅ 2026-09-23 已全部裁定）

1. **是否采用「方案 1 主干 + 方案 3 补充、不用 x2t 子进程」** → ✅ **采用**。
2. **写入类型范围** → ✅ **只 `docx/xlsx/pptx`**。用户原话要点：旧版 Office 格式各厂家普遍只负责读取，
   需要写入时一律用新版格式（性能更好、架构更简单）。
3. **是否允许改已有文件** → ✅ 同意「**新建 + 简单修改**」，并追问「简单修改是什么意思？如何保证？」→ 定义与保证方式见 §7。
4. **ODF/RTF/WPS** → ODF/RTF **本期不做**（FileConverter 尚未移植完，不做非常规格式）；
   **WPS（.wps/.et/.dps）纳入**——用户指出「WPS 文件其实就是 Office 格式只是后缀不一样」，
   这与代码事实一致：`FileUtil.convertWpsSuffixToOfficeSuffix` 已有 wps→doc/et→xls/dps→ppt 映射，
   但 `OfficeExtract` 没有对应分支 → 之前是**静默空结果**。P1 已用**魔数优先**修掉（见 §8）。
5. **P1 是否先做** → ✅ **同意先做**，已完成（见 §8）。

---

## 6. 未验证 / 风险

1. **Word 本机无法验证**：本机 Word COM 调用会静默挂起（既有教训），所以"POI 写出的文件 Word 打开是否提示修复"
   只能用代理校验（POI 回读 + C++ x2t 通过）。**因此 P2 验收标准写成"三方交叉校验通过"**，不承诺"Word 无提示"。
2. **POI 写复杂文档的保真度未测**：本轮只测了含表格/页眉/页脚的真实通知单，未覆盖图表、SmartArt、OLE、复杂编号。
3. **方案 3 的 ODF/RTF 完全未验证**：`RtfFile/`、`OdfFile/` 目录存在，但没有样例证据，工时不可估（本期按用户裁定不做）。
4. **POI 4.0.0 偏老（2018）**：`XWPFWordExtractor` / `XSLFPowerPointExtractor` 在 POI 5 已被移除。
   若将来升级 POI，`OfficeExtract` 必须改写为 `XWPFDocument` 遍历式抽取。选型本身不受影响，但这是升级时的一个已知工单。
5. **PDF 只测了文本型**：扫描件（图片型 PDF）无 OCR，本轮两个 PDF 都是文本型；2164 字符/717 KB 的低产率说明
   手册类 PDF 主体是截图，内容天然不可读（属预期，不是缺陷）。
6. **不推荐方案 2 不代表它没用**：现有 `isOnlyOfficeUsed` 开关继续保留给 Office 编辑器的既有链路，本文不做改动建议。

---

## 7. 「简单修改」的定义与保证方式（回答裁定事项 3）

### 7.1 定义：只动"文本节点"，不动"结构/关系/媒体"

**允许（白名单，逐条可机械校验）**

| 操作 | 说明 |
|---|---|
| `replace_text` | 替换某个段落 / 形状 / 单元格内的文本（run 级或段落级） |
| `append_paragraph` | 在指定位置后追加段落（继承相邻段落样式） |
| `append_table_row` / `set_cell_text` | 表格：追加行、改单元格文本 |
| `append_slide` | pptx：追加一页（带文字） |
| **新建** | 从零生成 `docx/xlsx/pptx`（无"保真"问题，因为无原件可比） |

**不允许（黑名单）**

- 新增/删除**结构性构件**：图表、图片、OLE、SmartArt、域、内容控件(SDT)、批注、修订、数学公式
- 改**样式表/编号定义**（`styles.xml` / `numbering.xml`）、改**页眉页脚结构**、改**关系**(`_rels`)、改**媒体**
- 移动/重排既有构件、整篇重写替换（那属于"新建"，不是"修改"）
- 任何加密文档（`MSCRYPT`）不做修改（需先解密另存）

### 7.2 如何保证（三层，缺一可）

1. **接口面只能表达白名单操作**（治本）
   工具不是"给我一段 XML/整篇内容去覆盖"，而是 `op ∈ 白名单` + **精确定位**（段落序号 / 单元格坐标 / 幻灯片序号）。
   模型在参数层面就**没法表达**"删图表"这类动作——比事后校验更可靠。
2. **写前预检（拒绝式）**
   打开目标文件扫描"不支持的构件"：命中图表/OLE/SDT/域/修订/数学公式 → **直接拒绝**并说明原因
   （例如"该文档含图表，属当前不支持范围；请改为新建文档或人工处理"）；另设段落数/体积上限。
   同时给出**将要改动的范围**（部件级）供确认弹窗展示——现确认弹窗只显示工具名、不显示参数（既有缺口）。
3. **写后不变量校验（最硬的一条）**
   重新打开输出文件，逐条断言：
   - **只有目标部件发生变化**（`word/document.xml` / `xl/worksheets/sheetN.xml` / `ppt/slides/slideN.xml` 之一），
     其余部件**字节级不变**（`docProps` 时间戳类白名单除外）
   - 部件集合不新增/不丢失；`_rels` 关系数不减少、target 不变
   - 未命中操作的原文片段仍可检索到（抽样比对）
   任一条不满足 → **放弃写入**并把原因回执给模型。**宁可不动，也不产生"半坏"的 Office 文件。**

这三条里第 3 条可以完全自动化，也是 P2 的核心护栏（新守约：`TestOfficeWriteInvariants`）；
因为本机无法用 Word 验证，P2 的验收口径就定为「部件级不变量 + POI 回读 + x2t 通过」三者均过。

---

## 8. P1 实施记录（2026-09-23 已完成并验证）

裁定「P1 先做」后当日落地。**改动全在主仓库**，office 仓库未动。

### 8.1 改了什么

| 文件 | 改动 |
|---|---|
| `src/com/DocSystem/common/FileUtil.java` | ① `isText` 新增 `csv`（此前 csv 被 `isOffice` 认领却无抽取分支 → 误报"非文本"）② 新增 `detectOfficeActualFormat(filePath, suffix)`：**魔数优先、后缀兜底**（zip 包看 `word/`·`xl/`·`ppt/` 目录；OLE 看 `WordDocument`·`Workbook/Book`·`PowerPoint Document` 流），并新增两个私有探测助手 |
| `src/com/DocSystem/common/OfficeExtract.java` | 新增 `extractText(filePath, fileName, tmpDir)`：按魔数选抽取器（7 种）、直接返回文本、读完删中间物。⚠️ 内部必须把 tmpDir 补尾分隔符——`FileUtil.saveDataToFile/readDocContentFromFile` 是 `path+name` **直接拼接**（不带尾斜杠会写到错误文件名上，且 `saveDataToFile` 仍返回 true） |
| `src/com/DocSystem/controller/BaseController.java` | `checkAndGenerateOfficeContent` / `...Ex`（含解密后路径） / `addIndexForRDoc`（Lucene 索引）三处入口都先做 `detectOfficeActualFormat` 归一化 |
| `src/com/DocSystem/agent/attachment/AgentAttachmentSupport.java` | ① Office/PDF 附件改为**抽取文本返回**（复用生产链路 `OfficeExtract.extractText`），>20MB 不抽；② `wps/et/dps/odt/ods/odp/rtf` 归"文档"类；③ `odt` 等不支持格式给**明确原因**而非"不是纯文本"；④ 文本附件**字符集先试 UTF-8**，解出替换字符才用 `FileUtil.getCharset` 复读（GBK 附件不再乱码）；⑤ 注入块文案随能力更新 |
| `src/com/DocSystem/agent/tool/DocSysToolFactory.java` | `get_doc` / `attachment` 工具描述改为"支持哪些抽取格式"；`formatDocContent` 对 odt 等回"暂不支持文本提取（当前支持 …）"而非"没有文本表示" |

**守约**：`TestAgentAttachmentSupport`（+26）与新增 `agent/tool/TestOfficeTextExtract`（31）；
`TestToolOutputContract` 的旧文案断言改为新语义（并新增 odt 明确报错两条）。
全量守约：**40 套 / 1575 断言 / 0 失败**（改造前 1381）。

### 8.2 实测证据（dev Tomcat 8100，真 HTTP + 真 LLM）

| 验证面 | 结果 |
|---|---|
| 仓库内读取（`getDocContent.do`，非 Ex 链路） | docx / **wps(装docx)** / xls / **et(装xls)** / csv(GBK) / 中文名 docx 均返回正文（含表格文本、中文不乱码）；odt → `isBinary` |
| 抽取缓存落地 | `OfficeText/<hash>_<name>/officeText_<len>_<mtime>.txt` 生成（docx 45B / xls 18B） |
| **Agent 链路**（`getDoc.do docType=1` → `checkAndGenerateOfficeContentEx`） | 对已登记文档返回 `docText` **4554 字符** |
| **附件链路**（真 LLM 一轮） | 上传 `budget2026.docx` → 模型自主调 `attachment(action=read)` → 工具回**"已抽取为纯文本（只有文字：无版式排版、无表格结构、无图片）"**+正文 → 最终答案 `12345`（该数字**只存在于 docx 里**，用户消息未出现）；`turns=2, toolCalls=1` |

### 8.3 已知限制 / 后续项

- **Ex 链路的 wps/et/dps**：本只能用"已登记的 docx"证明 Ex 链路通（4554 字符），
  wps/et/dps 的 E2E 走的是非 Ex 链路；两条链路的格式归一化是**同一段代码**（差异只在解密分支），但严格说 Ex 下的 wps 尚无端到端实例。
- **附件抽取目前只有一次读取**：表格变成"空格拼接的纯文本"，无行列语义（P3 可用 POI 结构化 API 补）。
- 历史遗留（本轮顺手发现，未处理）：`OfficeExtract` 的 `保存文档内容` 走 `saveDocContentToFile(..., encode=null)` →
  中间文本文件用**平台默认字符集**写（中文 Windows 上是 GBK），读回靠 `FileUtil.getCharset` 自动探测。本轮未改动该链路。
- `xlsx→bin` 等转换器侧的 txt/csv 链仍坏（见 §3.3），属 P4。

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
