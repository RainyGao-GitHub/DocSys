# CURRENT_STATE — Agent Office/PDF 读写（工作卡）

建立于 2026-09-23。**当前任务：Agent Office 读写能力建设——方案已裁定，P1（读打通）✅、P2 阶段一（新建）✅、P2 阶段二（修改）✅；可开始 P3/P4。**

- 唯一口径来源：`devDocs/Agent Office读写方案评估.md`（§0 结论 / §1 现状 / §2 能力矩阵 / §3 实测 / §4 分期 / §5 裁定 / §6 风险 / **§7「简单修改」定义** / **§8 P1** / **§9 P2 阶段一** / **§10 P2 阶段二**）
- 裁定（2026-09-23，用户全部采纳）：方案 1（POI+PDFBox）主干 + 方案 3（FileConverter 移植）补充，不用 x2t 子进程；
  写入只 `docx/xlsx/pptx`；允许"新建 + 简单修改"；ODF/RTF 本期不做、**WPS 纳入**；**P1 先做**

## 当前进展

1. ✅ 评估交付（方案对比 + 8 个探针实测），用户裁定通过 → commit `0ceb3745f`（docs）
2. ✅ **P1 实施完成**（详见评估文档 §8）：
   - `FileUtil`：`isText` 加 `csv`；新增 `detectOfficeActualFormat`（**魔数优先**：zip 看 `word/`·`xl/`·`ppt/`，OLE 看 `WordDocument`·`Workbook`·`PowerPoint Document`；后缀兜底并做 wps→doc/et→xls/dps→ppt 映射）
   - `OfficeExtract`：新增 `extractText(filePath, fileName, tmpDir)`（按魔数选 7 种抽取器、返回文本、读完删中间物）
   - `BaseController`：`checkAndGenerateOfficeContent` / `...Ex` / `addIndexForRDoc` 三处入口先归一化格式
   - `AgentAttachmentSupport`：Office/PDF 附件改为抽取文本返回（>20MB 不抽）；odt/rtf 等给明确"暂不支持"原因；
     文本附件字符集**先 UTF-8、解出替换字符才探测**（GBK 不再乱码）；注入块文案随能力更新
   - `DocSysToolFactory`：`get_doc`/`attachment` 描述与 `formatDocContent` 的"不支持"文案
   - 守约：`TestAgentAttachmentSupport`(+26)、新增 `TestOfficeTextExtract`(31)、`TestToolOutputContract` 文案断言更新
     → **全量 40 套 / 1575 断言 / 0 失败**（改造前 1381）
3. ✅ **P1 验证（真 HTTP + 真 LLM，dev Tomcat 8100）**：
   - 仓库内 `getDocContent.do`：docx / **wps(装docx)** / xls / **et(装xls)** / csv(GBK) / 中文名 docx 全部返回正文（含表格文本、无乱码）；odt → `isBinary`
   - 抽取缓存落地：`OfficeText/<hash>_<name>/officeText_<len>_<mtime>.txt`
   - **Agent 链路** `getDoc.do docType=1`（= `checkAndGenerateOfficeContentEx`）：已登记文档返回 `docText` **4554 字符**
   - **附件链路（真 LLM）**：上传 `budget2026.docx` → 模型自调 `attachment(action=read)` → 工具回"已抽取为纯文本…"+正文 → 最终答案 `12345`（该数字只存在于 docx 内）；`turns=2, toolCalls=1`
   - 测试痕迹已清理（仓库 rdata 目录、OfficeText 缓存目录、附件会话、临时 extract 残留；DB 无残留）
4. ✅ **P2 阶段一实施完成（新建 docx/xlsx/pptx）**，详见评估文档 §9：
   - 新增 `common/OfficeDocWriter.java`（POI 直接生成 + `looksValid` + `readBackText`；上限：段落2000/行5000/列100/表20/幻灯200/文本20万/成品10MB）
   - 新增端点 `POST /Doc/agentWriteOffice.do`（`DocController`）；`BaseController` 抽出 `updateRealDocData(repos,doc,byte[],…)` + `saveRealDocDataEx`，**文本写入链路行为不变**
   - 新工具 `write_office`（`isWrite(true).needsConfirm(true)`）+ `DocSysClient.writeOfficeDoc` + `ToolRiskCatalog`/`AuditLogService` 登记
   - 守约：新增 `TestOfficeDocWriter`(40)；`TestWriteTools`/`TestAgentSearchWriteTools` 清单同步 → **全量 41 套 / 1621 断言 / 0 失败**
5. ✅ **P2 阶段一验证（真 HTTP + 真 LLM）**：
   - 端点 E2E：新建 docx/xlsx/pptx → ok（2391 / 3391 / 25323 B）；同名已有内容、`.doc` 老格式、空 `paragraphs` → 三类 `INVALID_PARAM` 且报错文案准确；`getDoc.do` 读回正文（含 98765 数字、表名、幻灯片要点）
   - **Agent 全链路**：真 LLM → `list_repos`（反问仓库）→ 用户给 `vid=1` → 模型调 `write_office` → **确认弹窗批准** → 回执「已创建完成 ✅ 会议纪要.docx（2.3KB）内容读回核对无误」
   - 产物独立校验：`C:\DocSysReposes\1\data\rdata\会议纪要.docx` 2372 B / 7 个部件 / **所有 XML 部件可被独立解析器解析（0 坏）**
   - E2E 痕迹已清理（含前几轮探针建的 `probe1.docx`/`probe_ctrl.txt`/`p2write.docx`）
6. ✅ **P2 阶段二实施完成（修改已有 docx/xlsx/pptx）**，详见评估文档 §10：
   - 新增 `common/OfficeDocEditor.java`：三层保证引擎（白名单操作 + 写前预检 + 写后部件不变量/文本保真），
     `precheck`/`verify`/`verifyTextPreserved` 均 public（供护栏反向自测）
   - 新增端点 `POST /Doc/agentEditOffice.do`（`DocController`）；`BaseController.readRealDocData`（字节读取，加密仓库先解密到临时目录）
   - 新工具 `edit_office`（`isWrite/needsConfirm`，`ops` 为 JSON 数组字符串）+ `DocSysClient.editOfficeDoc` + `ToolRiskCatalog`/`AuditLogService` 登记
   - 守约：新增 `TestOfficeWriteInvariants`（**111 断言**，含 12 项毒样本预检与 5 类反向自测）→ **全量 42 套 / 1738 断言 / 0 失败**
7. ✅ **P2 阶段二验证（真 HTTP + 浏览器真 LLM）**：
   - 端点 E2E：docx 整段替换/段内 find-replace/追加段、xlsx 改单元格/追加行、pptx 追加页全部 ok；
     未知 op / 越界序号 / 老格式 / 不存在文件 → 均带正确错误码；含 域/内容控件/修订/公式/图表 的毒样本全部被预检拒绝且文件字节未变
   - **浏览器 E2E（真 LLM 一轮会话）**：get_doc 给出 0 起段号 → edit_office 两次（整段替换+追加、find/replace）→ 每次读回复核；
     xlsx 建+改（set_cell_text/append_table_row）；pptx 建+追加页；含域文件被拒后模型自读取证；
     要求“加粗/改字号/插图”时模型**未调工具**并说明能力边界；最后 delete_doc 四个测试文件 + list_docs 复核
   - 痕迹已清理（仓库 1 根目录恢复原状，并清掉阶段一遗留的 p2write.*）

## 下一步

- **P2 已完成**（新建 + 修改）。后续可选：
  1. **P3（结构化读）**：表格/工作表/幻灯片的结构化返回（当前抽取是扁平文本），让模型能稳定拿到“第几行第几列/第几页第几行”
  2. **P4（方案 3 接入）**：FileConverter 格式覆盖补充 + 修它已坏的 txt/csv 链（评估文档 §3.3 记了 3 个坏点）
  3. **可选增强**：`replace_text` 支持跨 run 定位（当前跨 run 直接拒绝并提示改用整段替换）、xlsx 多工作表定位、pptx 改已有页文字
- 开工前先问用户优先级；不要自行扩范围。

## 必读上下文（续接锚点）

1. 评估文档：`devDocs/Agent Office读写方案评估.md`（**§7 = "简单修改"的定义与三层保证机制**、§8 = P1 实施记录、**§9 = P2 阶段一实施记录**）
2. 本轮改动的代码锚点：
   - `src/com/DocSystem/common/FileUtil.java`：`isText`（含 csv）/ `detectOfficeActualFormat` / **`detectOoxmlFormat`（public，无后缀兜底，供 `looksValid` 用）**
   - `src/com/DocSystem/common/OfficeExtract.java`：`extractText`（**注意 tmpDir 必须补尾分隔符**——`FileUtil.saveDataToFile` 是 `path+name` 直接拼接）
   - `src/com/DocSystem/common/OfficeDocWriter.java`（新）：`create` / `looksValid` / `readBackText`（P2 阶段二在此加 `edit(...)`）
   - `src/com/DocSystem/common/OfficeDocEditor.java`（新）：三层保证引擎（`edit`/`precheck`/`verify`/`verifyTextPreserved`；白名单/联动部件/新增部件三个常量表）
   - `src/com/DocSystem/controller/DocController.java`：`agentWriteOffice.do`（存在性判定 = **有内容才拒绝、size==0 走补写**）、`agentEditOffice.do`（必须已存在）
   - `src/com/DocSystem/controller/BaseController.java`：`updateRealDocData`（新）/ `saveRealDocDataEx`（新）/ `readRealDocData`（新，字节读+解密）/ `updateRealDocContent` / `updateRealDocContent_FSM`；另 P1 的 `checkAndGenerateOfficeContent`(~L11549) / `...Ex`(~L11584) / `addIndexForRDoc`(~L14299)
   - `src/com/DocSystem/agent/attachment/AgentAttachmentSupport.java`：`EXTRACTABLE_EXT`/`KNOWN_UNSUPPORTED_EXT`/`readForTool`/`extractOfficeText`/`charsetFor`/`renderLines`
   - `src/com/DocSystem/agent/tool/DocSysToolFactory.java`：`write_office`(~L773)、`edit_office`(~L820)、`get_doc`(~L218) / `attachment`(~L1010) / `formatDocContent`(~L1929)
   - `src/com/DocSystem/agent/client/DocSysClient.java`：`writeOfficeDoc` / `editOfficeDoc`
   - 守约：`agent/tool/TestOfficeDocWriter.java`、**`agent/tool/TestOfficeWriteInvariants.java`（P2b 核心）**、`agent/tool/TestOfficeTextExtract.java`、`agent/tool/TestWriteTools.java`、`agent/attachment/TestAgentAttachmentSupport.java`、`agent/tool/TestToolOutputContract.java`
3. 既有约定/记忆：`/memories/repo/dev-tomcat.md`（**重启**：`docsys_restart.bat`；手动编译 Spring 控制器必须 `-parameters -g`；**启动可能 150s+，静态页 200 ≠ Spring 就绪，探 `.do` 要认 302**）、`/memories/repo/office-read-write.md`、`/memories/repo/agent-tools.md`
4. 探针/E2E 脚本：`%TEMP%\docsys_chk\`（`OfficeCap*.java` 能力实测、`OfficeP2bReq.java` 生成 UTF-8 spec、`OfficeP2bPoison.java` 造毒样本、`office_p1_e2e*.ps1`/`office_p2_e2e*.ps1`/`office_p2b_e2e.ps1`）

## 生效约束

- **开工前先提交**：本轮代码 + 文档随本里程碑提交；下个里程碑（P2）开工前先确认工作区干净。
- 编译输出目录 / 测试 scratch 目录两条不变量照 `CLAUDE.md`：`.class` → `WebRoot/WEB-INF/classes`；测试产物 → `office/test/tmp/<名>/`。
  （本轮探针产物在 `office/test/tmp/officeCapProbe/`；探针源码在 `%TEMP%\docsys_chk\`，不入版本控制。）
- Java 改动后必须**重编译 + 重启 dev Tomcat** 才生效（本轮踩过：先重启后编译 → 旧类仍在跑，E2E 假失败）。
- HTTP 直连口径：`POST /User/login.do` 的 **pwd 必须是 base64(明文)**（服务端先 base64 解码再比 md5）；dev 重启后浏览器 session 失效。
- 写 Java HTTP 客户端时**不要手设 Content-Length**（与 JDK chunked 打架 → 服务端读到的 pwd 变垃圾，表现为"用户名或密码错误"）。
- **新建文件后立刻写内容会 `DOC_LOCKED`**（`addDoc_FSM` 成功路径保留 FORCE 锁）——既有 `agentWriteText.do` 同样如此；处理：工具层 `callWithLockRetry` 重试 + 端点把"已存在"判定放宽为**有内容才拒绝**。
- **curl 传中文 JSON 参数**：PowerShell 会剥引号 → 用 `curl --data-urlencode "spec@<file>"`（JSON 落文件），不要拼在命令行上。
- **x2t.exe 独立命令行不可用**（报 "Couldn't automatically recognize conversion direction from extensions"，ASCII 路径也一样）；包结构校验改用 zip 部件 + XML 独立解析。
- **写 PowerShell E2E 脚本必须 ASCII-only**：PS 5.1 读 UTF-8(无 BOM) 的 .ps1 按 ANSI 解 → 脚本里的中文 JSON 会变乱码；
  中文请求体交给 Java 生成器写 UTF-8 无 BOM 文件，再 `curl --data-urlencode "spec@file"`。`Set-Content -Encoding UTF8` 会加 BOM，同样解析失败。
- **.NET 的 `ZipFile.CreateFromDirectory` 会写出反斜杠条目名**（不是合法 OOXML）→ 造毒样本要用 Java 重打包。
- **改了 main 类必须重编译进 `WebRoot/WEB-INF/classes`**，否则 `run_guards.ps1` 跑旧类（手跑绿、脚本红）。
- **pttx 既有幻灯片会被 POI 重写**（仅命名空间属性顺序，无语义）→ pptx 的既有部件走「结构骨架（属性名排序）+ 文本」等价校验，docx/xlsx 仍是字节级。

## 未提交改动

- 无。P2 阶段一已提交：**`fdd0fa59b`**（主仓库 13 文件，+1002/-23；含 §9 文档与本工作卡）
  ⚠️ `office/test` 仓库有一处**与本任务无关**的既存脏文件（`测试文件/EditorBinWithChanges_…_table.docx/…/output/output.docx`，
  mtime 2026-09-20，非本轮产生）——未动、未提交。
