# CURRENT_STATE — Agent Office/PDF 读写（工作卡）

建立于 2026-09-23。**当前任务：Agent Office 读写能力建设——方案已裁定，P1（读打通）✅、P2 阶段一（新建 docx/xlsx/pptx）✅；下一步 P2 阶段二（改已有文件）。**

- 唯一口径来源：`devDocs/Agent Office读写方案评估.md`（§0 结论 / §1 现状 / §2 能力矩阵 / §3 实测 / §4 分期 / §5 裁定 / §6 风险 / **§7「简单修改」定义** / **§8 P1 实施记录** / **§9 P2 阶段一实施记录**）
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

## 下一步

- **P2 阶段二（修改已有 Office 文件）** —— 待用户确认后开工；设计口径已在评估文档 §7 定稿、§9.4 给了衔接方案：
  1. 在 `agentWriteOffice.do` 旁增 `agentEditOffice.do`；写字节链路**直接复用** `updateRealDocData`（锁/版本/远程推送/备份/索引都已打通）
  2. 工具层只暴露**白名单操作**（replace_text / append_paragraph / append_table_row / set_cell_text / append_slide），定位用 path+name+段落序号/单元格坐标/幻灯片序号
  3. **写前预检**：命中图表/OLE/SDT/域/修订/公式 → 拒绝并说明
  4. **写后不变量校验**（P2 核心护栏 `TestOfficeWriteInvariants`）：只有目标部件变化、其余部件字节不变；部件集合与 rels 不减；抽样原文可检索 —— 任一条不过就**放弃写入**
  5. 验收口径：**部件级不变量 + POI 回读 + 包结构独立校验**（本机 Word COM 会挂起；x2t 独立命令行不可用，见 §9.3）
- 之后：P3（结构化读：表格/工作表/幻灯片）、P4（方案 3 接入 + txt/Markdown 链修复，评估文档 §3.3 已记录 3 个坏点）

## 必读上下文（续接锚点）

1. 评估文档：`devDocs/Agent Office读写方案评估.md`（**§7 = "简单修改"的定义与三层保证机制**、§8 = P1 实施记录、**§9 = P2 阶段一实施记录**）
2. 本轮改动的代码锚点：
   - `src/com/DocSystem/common/FileUtil.java`：`isText`（含 csv）/ `detectOfficeActualFormat` / **`detectOoxmlFormat`（public，无后缀兜底，供 `looksValid` 用）**
   - `src/com/DocSystem/common/OfficeExtract.java`：`extractText`（**注意 tmpDir 必须补尾分隔符**——`FileUtil.saveDataToFile` 是 `path+name` 直接拼接）
   - `src/com/DocSystem/common/OfficeDocWriter.java`（新）：`create` / `looksValid` / `readBackText`（P2 阶段二在此加 `edit(...)`）
   - `src/com/DocSystem/controller/DocController.java`：`agentWriteOffice.do`（存在性判定 = **有内容才拒绝、size==0 走补写**）
   - `src/com/DocSystem/controller/BaseController.java`：`updateRealDocData`（新）/ `saveRealDocDataEx`（新）/ `updateRealDocContent` / `updateRealDocContent_FSM`；另 P1 的 `checkAndGenerateOfficeContent`(~L11549) / `...Ex`(~L11584) / `addIndexForRDoc`(~L14299)
   - `src/com/DocSystem/agent/attachment/AgentAttachmentSupport.java`：`EXTRACTABLE_EXT`/`KNOWN_UNSUPPORTED_EXT`/`readForTool`/`extractOfficeText`/`charsetFor`/`renderLines`
   - `src/com/DocSystem/agent/tool/DocSysToolFactory.java`：`write_office`(~L773)、`get_doc`(~L218) / `attachment`(~L1010) / `formatDocContent`(~L1929)
   - `src/com/DocSystem/agent/client/DocSysClient.java`：`writeOfficeDoc`
   - 守约：`agent/tool/TestOfficeDocWriter.java`（新）、`agent/tool/TestOfficeTextExtract.java`、`agent/tool/TestWriteTools.java`、`agent/attachment/TestAgentAttachmentSupport.java`、`agent/tool/TestToolOutputContract.java`
3. 既有约定/记忆：`/memories/repo/dev-tomcat.md`（**重启**：`docsys_restart.bat`；手动编译 Spring 控制器必须 `-parameters -g`）、`/memories/repo/agent-tools.md`
4. 探针/E2E 脚本：`%TEMP%\docsys_chk\OfficeCap*.java`（能力实测）、`OfficeP*.java`（造请求）、`office_p1_e2e*.ps1`、`office_p2_e2e*.ps1`

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

## 未提交改动

- P2 阶段一：`OfficeDocWriter.java`(新) / `DocController.java` / `BaseController.java` / `DocSysClient.java` / `DocSysToolFactory.java` / `ToolRiskCatalog.java` / `AuditLogService.java` / `TestOfficeDocWriter.java`(新) / `TestWriteTools.java` / `TestAgentSearchWriteTools.java` / `devDocs/…评估.md`(§9) / 本工作卡
  （均在主仓库；office 与 office/test 两仓库本轮未动）
