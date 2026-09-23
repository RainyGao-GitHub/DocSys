# CURRENT_STATE — Agent Office/PDF 读写（工作卡）

建立于 2026-09-23。**当前任务：Agent Office 读写能力建设——方案已裁定，P1（读打通）已完成并验证；下一步 P2（写）。**

- 唯一口径来源：`devDocs/Agent Office读写方案评估.md`（§0 结论 / §1 现状 / §2 能力矩阵 / §3 实测 / §4 分期 / §5 裁定 / §6 风险 / **§7「简单修改」定义** / **§8 P1 实施记录**）
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

## 下一步

- **P2（写打通）** —— 待用户确认后开工；设计口径已在评估文档 §7 定稿：
  1. 服务端新端点（建议 `agentWriteOffice.do`）：base64 → `byte[]` → 复用 `agentWriteText.do` 的 `addDoc` + 锁 + 版本提交 + 系统日志链路
  2. 工具层只暴露**白名单操作**（replace_text / append_paragraph / append_table_row / set_cell_text / append_slide / 新建），定位用 path+name+段落序号/单元格坐标/幻灯片序号
  3. **写前预检**：命中图表/OLE/SDT/域/修订/公式 → 拒绝并说明
  4. **写后不变量校验**（P2 核心护栏 `TestOfficeWriteInvariants`）：只有目标部件变化、其余部件字节不变；部件集合与 rels 不减；抽样原文可检索 —— 任一条不过就**放弃写入**
  5. 验收口径：**部件级不变量 + POI 回读 + x2t 通过**（本机 Word COM 会挂起，不能作为验收手段）
- 之后：P3（结构化读：表格/工作表/幻灯片）、P4（方案 3 接入 + txt/Markdown 链修复，评估文档 §3.3 已记录 3 个坏点）

## 必读上下文（续接锚点）

1. 评估文档：`devDocs/Agent Office读写方案评估.md`（**§7 = "简单修改"的定义与三层保证机制**、§8 = P1 实施记录）
2. 本轮改动的代码锚点：
   - `src/com/DocSystem/common/FileUtil.java`：`isText`（含 csv）/ `detectOfficeActualFormat` / `detectOoxmlByPackage` / `detectOleByStreams`
   - `src/com/DocSystem/common/OfficeExtract.java`：`extractText`（**注意 tmpDir 必须补尾分隔符**——`FileUtil.saveDataToFile` 是 `path+name` 直接拼接）
   - `src/com/DocSystem/controller/BaseController.java`：`checkAndGenerateOfficeContent`(~L11549) / `checkAndGenerateOfficeContentEx`(~L11584) / `addIndexForRDoc`(~L14299)
   - `src/com/DocSystem/agent/attachment/AgentAttachmentSupport.java`：`EXTRACTABLE_EXT`/`KNOWN_UNSUPPORTED_EXT`/`readForTool`/`extractOfficeText`/`charsetFor`/`renderLines`
   - `src/com/DocSystem/agent/tool/DocSysToolFactory.java`：`get_doc`(~L218) / `attachment`(~L1010) / `formatDocContent`(~L1929)
   - 守约：`agent/attachment/TestAgentAttachmentSupport.java`、`agent/tool/TestOfficeTextExtract.java`、`agent/tool/TestToolOutputContract.java`
3. 既有约定/记忆：`/memories/repo/dev-tomcat.md`（**重启**：`docsys_restart.bat`；手动编译 Spring 控制器必须 `-parameters -g`）、`/memories/repo/agent-tools.md`
4. 探针：`%TEMP%\docsys_chk\OfficeCap*.java`（能力实测）、`office_p1_e2e4.ps1`（仓库内读取）、`office_p1_e2e6.ps1` + `OfficeP1Req.java`（附件链路）

## 生效约束

- **开工前先提交**：本轮代码 + 文档随本里程碑提交；下个里程碑（P2）开工前先确认工作区干净。
- 编译输出目录 / 测试 scratch 目录两条不变量照 `CLAUDE.md`：`.class` → `WebRoot/WEB-INF/classes`；测试产物 → `office/test/tmp/<名>/`。
  （本轮探针产物在 `office/test/tmp/officeCapProbe/`；探针源码在 `%TEMP%\docsys_chk\`，不入版本控制。）
- Java 改动后必须**重编译 + 重启 dev Tomcat** 才生效（本轮踩过：先重启后编译 → 旧类仍在跑，E2E 假失败）。
- HTTP 直连口径：`POST /User/login.do` 的 **pwd 必须是 base64(明文)**（服务端先 base64 解码再比 md5）；dev 重启后浏览器 session 失效。
- 写 Java HTTP 客户端时**不要手设 Content-Length**（与 JDK chunked 打架 → 服务端读到的 pwd 变垃圾，表现为"用户名或密码错误"）。

## 未提交改动

- 无（P1 代码 + 守约 + 文档随本里程碑一并提交）
