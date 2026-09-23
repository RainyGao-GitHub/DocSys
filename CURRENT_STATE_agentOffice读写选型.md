# CURRENT_STATE — Agent Office/PDF 读写方案选型（工作卡）

建立于 2026-09-23。**当前任务：Office 读写方案选型——评估已完成，等用户裁定（尚未开工写代码）。**

- 本次触发用户原话："现在Agent能力上有些缺陷不能读写Office文件和pdf文件……请根据我提供的信息并结合代码，帮我评估一下我们应该用哪个方案来让Agent支持Office文件的读写"
- 唯一口径来源：`devDocs/Agent Office读写方案评估.md`（§0 结论 / §1 现状 / §2 能力矩阵 / §3 实测数据 / §4 推荐与分期 / §5 待裁定 / §6 风险）
- **本卡状态：评估交付完毕，未改任何生产代码**（本轮只跑探针 + 落一份评估文档）

## 待用户裁定（裁定前不要开工编码）

1. 是否采用「方案 1（POI+PDFBox）主干 + 方案 3（FileConverter 移植）补充、不用 x2t 子进程」
2. 写入类型范围：只 `docx/xlsx/pptx`（推荐）还是要求 `.doc/.xls/.ppt`（技术不可行，只能转存新格式）
3. 是否允许"改已有文件"（我建议 P2 先只做"新建 + 简单修改"）
4. ODF/RTF/WPS 是否在本期范围（当前完全没有；需先修方案 3 的转换链）
5. P1（读打通：附件 + `wps/et/dps` 静默空 + odt/rtf 明确报错）是否先做

## 本轮实测结论摘要（细节与出处见评估文档 §3）

- **读的现状比预期好**：仓库内 Office/PDF 文本读取今天就是 POI/PDFBox 在生产路径上跑，
  Agent 的 `get_doc` 已能拿分页正文（`docText` + `offset/maxChars`）。
  实测抽取量：docx 154 / doc 1733 / pptx·ppt 1938 / xls 529 / pdf 2164·11867 字符，全部 ret=true。
- **真正的读缺口**：① 聊天附件里的 Office/pdf 只回元信息（`AgentAttachmentSupport.readForTool`）；
  ② `odt/ods/odp/rtf` 不在 `isOffice()` → 空；③ **`wps/et/dps` 被 `isOffice()` 认作 Office 但 `OfficeExtract` 无分支 → 静默空**（最危险）；
  ③b `csv` 也在 `isOffice()` 而无抽取分支（`isText()` 又不含 csv）→ `get_doc` 回"非文本"（错误结论），附件侧却按文本处理 → 两侧口径不一致；
  ④ 无表格/工作表/幻灯片结构；⑤ 扫描件 PDF 无 OCR。
- **写是全新空白**：`write_file` 明写"Office 暂不支持"，`agentWriteText.do` 有 `isTextFile` 硬校验。历史计划已预留 `agentWriteDocx` 命名。
- **方案 1 实测**：POI 4.0.0 新建 docx/xlsx（含公式）/pptx 全通过；**改已有 docx 保留原包 21 个部件**且回读一致；
  POI 产物被 C++ x2t（exit=0）与 Java FileConverter（ret=0）双双接受 → 交叉校验可用；
  `.xls` 可新建、`.ppt` 只空骨架、**`.doc` 无法从零创建**；POI 能读内嵌图片原始字节（pptx 2 张 PNG 魔数正确）。
- **方案 3 实测**：doc→docx / xls→xlsx / ppt→pptx / docx·doc→doct_bin / docx→bin→pdf(95 KB) 全通；
  **但"产文本"方向是坏的**：docx→txt NPE（`TxtFile/Docx2Txt/Converter_Impl.java:292` `Lists==null`），
  反射补 Vector 后 convert 成功却**只输出 3 字节 BOM（空正文）**；xlsx→csv NPE（`fromXlstBin:6118`）；
  txt→docx 入口 NPE（`COfficeFileFormatChecker.isOfficeFile:1299` 把 .txt 当 XML 解析）。
- **方案 4（x2t.exe）实测**：部署版 7.0.1.37 在 `…/static/office-editor/server/FileConverter/bin/x2t.exe`；
  docx→docx 313 ms、**docx→txt 772 B（带表格分隔线的结构化文本）**、doc→docx 15179 B 均可；
  **无 Markdown 能力**（二进制无 `markdown` 字样，移植代码也无该格式常量）；"目录输出"三种写法均未成功（但不需要：docx 即 zip）。

## 必读上下文（续接锚点）

1. 评估文档：`devDocs/Agent Office读写方案评估.md`（唯一口径来源）
2. 代码锚点（评估依据）：
   - 服务端抽取：`src/com/DocSystem/controller/BaseController.java` `getDocContent`(L11501) / `checkAndGenerateOfficeContent`(L11549) /
     `checkAndGenerateOfficeContentEx`(L11584) / `readOfficeContent`(L12310)
   - `src/com/DocSystem/common/OfficeExtract.java`（POI 4.0.0 抽取，7 个入口）
   - `src/com/DocSystem/controller/DocController.java` `getDoc.do` docType=1→`docText`(L4393-4410)；`agentWriteText.do`(L7785)
   - Agent 侧：`agent/tool/DocSysToolFactory.java` `get_doc`(L218)/`formatDocContent`(L1929)/`write_file`(L729)；
     `agent/attachment/AgentAttachmentSupport.java` `TEXT_EXT`(L54)/`readForTool`(L328)；
     `agent/client/DocSysClient.java` `getDoc`(docType=1, L553)
   - `src/com/DocSystem/common/FileUtil.java` `isOffice`(L1276)/`isText`(L1177)/`isPdf`(L1160)
   - `src/com/DocSystem/common/Path.java` `getReposTmpPathForOfficeText`(L575)/`getOfficeTextFileName`(L636，key=size+mtime)/`getIsOnlyOfficeUsed`(L594)
   - 移植引擎：`src/com/DocSystem/websocket/office/FileConverter/FileConverter.java`、
     `NExtractTools/NExtractToolsStatic.java`（`docx2txt` L4169 / `xlsx2csv` L2755）、
     `TxtFile/Docx2Txt/Converter_Impl.java`(L252 `Lists=(null)`、L292 崩点)、`src/com/DocSystem/websocket/OfficeBase.java`(L6378 起，x2t/FileConverter 双分支)
3. 记忆：`/memories/repo/freetype-port.md`、`/memories/repo/dev-tomcat.md`（编译/重启口径）

## 生效约束（本任务）

- **开工前先提交**：本卡与评估文档属主仓库工作区文档，若要开始编码，先把文档提交（避免与代码改动混在一起）。
- 编译输出目录 / 测试 scratch 目录两条不变量照 `CLAUDE.md` 执行（`.class` → `WebRoot/WEB-INF/classes`；
  测试产物 → `office/test/tmp/<名>/`）。本轮探针产物已在 `office/test/tmp/officeCapProbe/`。
- 探针类文件：本轮为省事把 `OfficeCap*.class` 编到了 `WebRoot/WEB-INF/classes`（默认包，随探针口径），
  源码在 `%TEMP%\docsys_chk\`（不入版本控制）。**若觉得 class 有碍，可随手删。**

## 当前进展

1. ✅ 按会话恢复协议确认前一张卡（任务续接与轮数上限）已收尾 → 本卡为新建
2. ✅ 读通生产读取链路：`getDocContent`/`getDoc.do` docType=1 → `checkAndGenerateOfficeContentEx` → POI/PDFBox；确认 `get_doc` 已能返回分页正文
3. ✅ 盘点读缺口（附件 / odt·rtf / wps·et·dps / xlsm 等 / 结构 / OCR）与写缺口（`agentWriteText.do` 硬校验）
4. ✅ 8 个探针实测三方案（POI 4.0.0 / x2t.exe 7.0.1.37 / FileConverter 移植），结论与数字全部进评估文档 §3
5. ✅ 交付评估文档 `devDocs/Agent Office读写方案评估.md`（含推荐：方案 1 主干 + 方案 3 补充，否决 x2t 子进程）
6. ✅ 新建本工作卡并改 `CLAUDE.md` 会话恢复指针
7. ⬜ **等用户裁定 §5 的 5 项** → 裁定后才排实施计划（不预先开工）

## 未提交改动（截至本卡更新）

- 新增 `devDocs/Agent Office读写方案评估.md`（主仓库，未提交）
- 新增 `CURRENT_STATE_agentOffice读写选型.md`（本卡，主仓库，未提交）
- 修改 `CLAUDE.md`（会话恢复指针改指本卡，主仓库，未提交）
- 探针/产物：`%TEMP%\docsys_chk\OfficeCap*.java`、`x2t_*.xml`（临时）；`office/test/tmp/officeCapProbe/`（gitignore）
- **生产代码零改动**（`git status` 已核对：主仓库改的只有上述文档；office 仓库 clean；test 仓库仅一处既有 fixture 改动，非本轮产生）
