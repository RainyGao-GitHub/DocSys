# CURRENT_STATE — Agent 文件搜索与写入优化（工作卡）

> 本文件是会话恢复协议第 1 步（见 `CLAUDE.md`）。本卡是「Agent 搜索/写入优化」任务的唯一定义处。
> 方案全文：`devDocs/Agent文件搜索与写入优化开发上下文.md`（定稿，用户已确认）。

## 当前任务
优化 DocSys Agent 的文件搜索与文件写入两条能力：
1. **搜索**：新增 Agent 专用 Lucene 索引搜索端点 + 磁盘 grep 兜底；下线旧 `search_docs` 工具（走人类接口 `/Doc/searchDoc.do`，含路径猜解/base64/线程池等冗余）。
2. **写入**：区分实体文件与虚拟文件（备注）；`write_file` 只写文本（走新端点 `agentWriteText.do`，不用 uploadDoc）；Office 写入暂缓。

## 定稿决策（2026-09-12 用户确认）
- 端点命名：搜索 `/Doc/agentSearchDoc.do`；文本写入 `/Doc/agentWriteText.do`（避免与未来 agentWriteDocx 混淆）。
- 工具集（写侧）：`create_folder` / `write_file`（文本 upsert）/ `write_note`（备注）；**无 create_file**；`create_doc` 下线。
- 工具集（搜索）：`search_files`（索引，DSL 与或非）+ `grep_files`（磁盘兜底）；`search_docs` 工具下线（工厂方法删除）；⚠️ `DocSysClient.searchDocs` **保留**（旧路径 SubAgent/DocSysSkillExecutor/CLI 仍在用，旧路径既往决策保留不动，仅工具层不注册）。
- 新工具参数沿用 `vid`（LLM 习惯一致）；`write_file` 内容上限 1MB（可配）。
- 单仓库化：`agentSearchDoc.do` 的 `reposId` **必填**；多仓库 = LLM 多次工具调用。注意：ToolUseLoop 对同一轮多个 tool_call 是顺序执行，非真并行（行为正确、可接受）。
- grep 兜底 = Java 逐文件扫描（等价 grep 语义，跳过 textSearchIgnore 项、仅文本文件；不用系统 grep 二进制，规避 Windows findstr 编码/行长坑；如需可换进程实现）。
- `write_file` 新建文本文件：先建条目（addDoc 流程）再写内容（updateRealDocContent，UTF-8）；FSM 仓库会产生 create+modify 两条历史，已知可接受。

## 实施顺序（T1-T5）—— 全部完成（2026-09-12，代码完成待部署）
- [x] T1 `DocController.agentSearchDoc.do`（index 分支：DSL→QueryCondition→LuceneUtil2.multiSearch；DSL 解析器 `agent/search/AgentSearchQuery` 可单测）
- [x] T2 同端点 grep 分支（Java File 递归扫描 + 跳过忽略项；`isRealDocTextSearchIgnored` private→protected）
- [x] T3 `DocSysClient.agentSearchDocs/grepFiles/postFormAndParse` + 工具 `search_files`/`grep_files` 注册；`search_docs` 工具删除（⚠️ `DocSysClient.searchDocs` 保留为 legacy 包装：SubAgent/DocSysSkillExecutor/CLI 旧路径仍用）
- [x] T4 `DocController.agentWriteText.do`（UTF-8、1MB 上限、isTextFile 白名单、addDoc 建条目 + updateRealDocContent 写内容）+ 工具 `write_file`/`write_note`/`create_folder`；`create_doc` 工具删除；`addDoc` 注释修正
- [x] T5 测试 + 编译：护栏全景 **287** 全绿 = TestToolCallParser 44(原32,+12 functions) + TestToolUseLoop 36 + TestToolRegistry 29 + TestAgentSearchWriteTools 55 + TestAgentSearchIndex 9 + TestWriteTools 58 + TestUserMemoryTools 26 + TestWebSearchTool 30
- [x] **T6 旧路径迁移**（2026-09-13，用户确认分层方案）：SubAgent 5 处 + DocSysSkillExecutor 5 处 `searchDocs` → 新端点；`DocSysClient` 新增 `agentSearchDocsByKeyword`/`agentListAllDocs`/`agentSearchDocsByQuery`/`buildKeywordQueryJson`。**CLI 保留旧 searchDocs**，全代码库仅剩 CLI 一个调用点。
- [x] **T9.1 解析器多格式适配**（2026-09-13，端到端实测发现）：部署后 deepseek-v4-flash 输出 `<functions><invoke><parameter>` 格式，旧解析器不认→工具不执行、原始 XML 展示、回退旧路径。修复：ToolCallParser 新增 FUNCTIONS_PATTERN/INVOKE_PATTERN + parse() 二级回退 + `arguments` 单参数 JSON 解包 + looksLikeMalformed/containsToolCall 含 functions 标记；ToolPromptBuilder 提示词改为双格式任选（去除"禁止 invoke"负面约束）；ToolUseLoop 回灌提示同步双格式。**根因属旧版既有盲区**（页面历史 09-12 21:04 已复现），非本次改造引入。原生 tool-calling API 记入待办（后续 LLMService 升级，本次不做）。
- [x] **T9.2 空格标签变体 + 运行时诊断**（2026-09-13 实测发现模型输出 `<functions calls>`——把"function calls"写成带空格标签，任何正则不匹配且运行时行为与本地探针矛盾）：① FUNCTIONS_PATTERN 兼容 `<functions calls>`/`<function_calls>` 变体；② ToolCallParser.parse 与 ToolUseLoop 每轮用 `com.DocSystem.common.Log` 打 `[ToolCallParser]`/`[ToolUseLoop][PARSE]` 诊断进 docsys.log（线上可直接看解析实况）。护栏 292 全绿（TestToolCallParser 44→49）。**待部署验证**：ToolCallParser.class + ToolUseLoop.class。
- [x] **T9.3 DSML 转义格式适配（"旧解析器悖论"已破案）**（2026-09-13，字节级取证 + SSE 实捕获）：① **根因**：LLM 网关把输出中的 `<` 转义成 `<｜DSML｜`（全角竖线 U+FF5C 包裹，如 `<｜DSML｜ calls>`、`</｜DSML｜ invoke>`），且标签内带空格——不是类加载器旧类问题（javap 证明部署类=T9.2；SSE 实捕获证明同一次部署下 `<tool_call>` 格式可正常执行工具并返回真实仓库数据）。② 修复：`normalizeEscapedMarkup`（`</｜DSML｜`→`</`、`<｜DSML｜`→`<`，再折叠 `< `→`<`），FUNCTIONS_PATTERN 增加 `calls` 别名，全部标签正则容忍空格（invoke/parameter/parameters）。③ 回归：TestToolCallParser 新增 DSML 转义用例（复刻线上 15:47:42 原文 165 字符），**55 全绿**。
- [x] **T10 原生 tool-calling 通道（借鉴 ScholarOS 双通道方案 C，2026-09-13 用户确认后实施）**：DeepSeek 响应格式漂移的根本解法——请求携带 OpenAI 兼容 `tools` + `tool_choice`，结构化 `tool_calls` 直接执行，文本解析降级为兜底。① `ToolSchemaBuilder`：ToolDefinition → `[{type:function,function:{name,description,parameters}}]`；② `LlmTurnResult`（text+nativeToolCalls+toolsRejected）+ `ToolCall.id` + `StreamChunk` 新增 tool_call/tools_rejected 块；③ `LLMService.chatNative/streamChatChunksNative`（流式 delta.tool_calls 按 index 聚合分片、流末先发 tool_call 块再 done；带 tools 时 400 → 自动去 tools 重试一次并标记 rejected）；④ `ToolUseLoop` 双通道：原生 calls 优先（assistant 带 tool_calls + role=tool 回灌 tool_call_id）；无原生 calls → T9.3 文本通道兜底；tools 被拒 → 本轮循环后续轮次关 tools（文本通道继续可用）；⑤ `tool_choice` 管理员可配（agent_config `agent_tool_choice`，auto/none，none=纯文本通道适配 thinking 模型/省 token）；⑥ 护栏新增 47 项（TestNativeToolCallStream 23 + TestToolUseLoopNative 17 + TestToolSchemaBuilder 7），**全量 409 全绿**。参考：ScholarOS `agentFactory.ts`（AI SDK v7 ToolLoopAgent）+ 注释中 thinking 模型 tool_choice 400 的坑。

## ⚠️ 实现中的坑（勿重复排查）
- **docsys JDK rt.jar 缺 `java.nio.file.BasicFileAttributes`**（裁剪版 JDK，`Files/Path/Paths` 有、`attribute` 包无）→ grep 扫描用纯 `File` 递归 + `FileInputStream/InputStreamReader(UTF-8)`，不要用 Files.walkFileTree。
- **`ToolRegistry.validateParams` 不识别 `String[]` required**（`objSchema` 存的是 String[]，validateParams 只查 List）→ 所有工具的 required 校验从未生效。新工具在 executor lambda 里显式校验 vid/query/pattern/content。旧工具行为不变，未动 validateParams。
- 工具 executor 校验顺序：先 vid 后其他（测试已按此断言）。
- **⚠️⚠️ `com.DocSystem.common.Log` 无限递归**：appendContentToFile 写失败时 catch 里调 Log.info(e)→toFile→再失败→无限递归 StackOverflow。裸 java 测试环境日志文件不可写即触发。**任何调用 HitDoc.setHitScore/getHitScore/getTotalHitScore 的代码都会触发**（它们内部调 Log.debug）→ AgentSearchExecutor/DocController 均改为直接用 HitDoc 公有字段。
- **⚠️⚠️ `LuceneUtil2 extends BaseFunction`**，其 `<clinit>` 在裸 java 测试环境调 `Path.getWebPath` 抛 NPE（只有 Tomcat 内可用）→ AgentSearchExecutor **不得依赖 LuceneUtil2**（否则单测必崩）。已本地实现 buildQuery/buildHitDocFromIndex（含注释说明）。
- **should 语义修复（T1.1）**：LuceneUtil2.multiSearch 硬编码 hitRateLevel=8 → 对 SHOULD 条件强制 minShouldMatch=80%，LLM 的 should(或)会被扭曲成"必须命中大多数"。AgentSearchExecutor 改为本地构建 BooleanQuery（Lucene 默认语义：SHOULD 至少命中一条）。TestAgentSearchIndex 9/9 用真实临时索引回归验证。

## 当前进展 / 下一步 / 未提交改动
- 进展：T1-T6、T9.1-T9.3、**T10 原生 tool-calling 双通道**全部完成；护栏全量 **409 全绿**（含新增 47 项）。已提交 a343c97c2（T1-T6+T9.x）；**T10 代码已写未提交**（工作区 6 改 + 5 新增文件，见 git status）。
- 下一步（待用户）：
  1. 用户部署 T10 类到 tmp0（清单见下）并重启 Tomcat。
  2. E2E 验证：浏览器多次发"列出所有仓库"，docsys.log 应出现 `[ToolUseLoop][NATIVE] turn=1 calls=N`（原生通道生效）；如端点拒绝 tools，应出现 `LLM 拒绝 tools（HTTP 400），后续轮次切换为纯文本通道` 且工具仍经文本通道执行。
  3. 验证 search_files/grep_files/write_file/write_note/create_folder 的端到端行为（此前仅 write_file/list_docs/list_repos 验证过）。
  4. 验证通过后提交主仓库（devInt）。
- T10 部署清单（新类必须全部进入运行目录，缺任一会 NoClassDefFoundError）：`agent/llm/LlmTurnResult.class`（新）、`agent/llm/LLMService.class`、`agent/llm/StreamChunk.class`、`agent/tool/ToolCall.class`、`agent/tool/ToolSchemaBuilder.class`（新）、`agent/orchestrator/ToolUseLoop.class`、`agent/orchestrator/MainAgent.class`、`agent/config/AgentConfigService.class`（测试类可不部署）。
- 未提交改动（主仓库 devInt）：
  - M `DocSysClient.java`、`DocSysToolFactory.java`、`TestWriteTools.java`、`BaseController.java`、`DocController.java`
  - A `agent/search/AgentSearchQuery.java`、`agent/search/AgentSearchExecutor.java`、`tool/TestAgentSearchWriteTools.java`、本卡、`devDocs/Agent文件搜索与写入优化开发上下文.md`
  - 注意：`CURRENT_STATE_id分配.md` 也是 M（本会话之前已存在，非本次改动）

## 关键事实（调研结论，勿重复排查）
- 索引库：`repos_<id>_DocName`（文件名：`nameForSearch`+`content`(IK)）、`_RDoc`（实体内容 `content`）、`_VDoc`（备注 `content`）；路径 `repos.getPath()+"DocSysLucene/"`，`BaseController.getIndexLibPath`。
- `QueryCondition`：field/value/queryType(Term=1/Wildcard=2/Wildcard_Prefix=3/Fuzzy=5/IKAnalyzer=6/Prefix=7)/occurType(MUST/SHOULD/MUST_NOT)。
- `Doc.type`：0=不存在 1=文件 2=目录。`FileUtil.isTextFile` 白名单：txt/md/cpp/h/c/hpp/java/py/go/js/css/html/jsp/php/json/xml/sql/properties/conf/cnf/asn/sh/bash/bat/yaml/yml/cmake/log/out。
- 文本写入端点既有基建：`updateDocContent.do`（docType=1 写实体、否则写备注，要求文件已存在）；`addDoc.do`（content→备注）；`uploadDoc.do`（multipart，本次不用）。
- `saveRealDocContentEx` → `FileUtil.saveDataToFile` 自动 mkdir+建文件，新建场景安全。
- 搜索忽略机制：`isRealDocTextSearchIgnored(repos, doc, parentCheck)`（BaseController 14352 行，现 private static，T2 改 protected）。
- 提交归属：DocController/BaseController/agent 全部 → 主仓库 D:/Dev/DocSys（devInt）。.class → WebRoot/WEB-INF/classes。Spring Controller 编译需 `-parameters -g`。

## 当前进展 / 下一步 / 未提交改动
- 进展：方案已定稿；工作卡+上下文文档已建。
- 下一步：T1 端点。
- 未提交改动：（暂无代码改动）
