# Agent 文件搜索与写入优化 — 开发上下文（定稿）

> 状态：方案已获用户确认（2026-09-12）。工作卡：`CURRENT_STATE_agent搜索写入优化.md`。
> 实施顺序 T1-T5；每完成一项更新工作卡。

---

## 1. 背景与问题

**搜索**：Agent 现有 `search_docs` 工具 → `DocSysClient.searchDocs` → HTTP `/Doc/searchDoc.do`。该接口为人类设计：
- 人类路径猜解（直接路径命中 + hitDocSmartSearch 截 1/2/3 级目录）；
- 每仓库一个线程 + wait/notify 编排；
- 整串关键词 IK 切词 SHOULD 查询，无与/或/非语义；
- 前 10 条抽取命中上下文并 `convertToBase64=true` → 返回 JSON 巨大且大量 base64，对 LLM 全是浪费。

**写入**：Agent 现有 `create_doc` → `/Doc/addDoc.do`，服务器行为 = 建 DB 条目 + `content` 非空时 `updateVirualDocContent`（写备注/虚拟内容）。LLM 带 content 创建文件时**永远写进虚拟文件**，实体文件从不落盘。且 `DocSysClient.addDoc` 注释 type 语义错误（"0=file,1=folder"），进一步误导 LLM。真实语义：`Doc.type` 0=不存在 1=文件 2=目录。

## 2. 目标

1. 搜索：Agent 专用端点，直接消费 Lucene 索引，支持 LLM 自定的关键词 + 与/或/非 + 仓库/目录限定；磁盘 grep 兜底覆盖未建索引文件；两个技能（索引优先）。
2. 写入：实体文件（文本）与虚拟文件（备注）显式分离；文本文件用专用写入端点（不走 uploadDoc）；Office 写入暂缓（后续 agentWriteDocx/Xlsx/Pptx，markdown→OOXML）。

## 3. 定稿决策

| 项 | 决策 |
|---|---|
| 搜索端点 | `POST /Doc/agentSearchDoc.do`（DocController，主仓库） |
| 文本写入端点 | `POST /Doc/agentWriteText.do`（用户命名，避免与未来 agentWriteDocx 混淆） |
| 搜索工具 | `search_files`（索引）+ `grep_files`（磁盘兜底），描述互指，LLM 决策 |
| 写入工具 | `write_file`（文本 upsert）/ `write_note`（备注）/ `create_folder`（目录）；无 `create_file`；`create_doc` 下线 |
| 旧工具 | `search_docs` 工具下线（工厂方法删除）；⚠️ `DocSysClient.searchDocs` **保留**——旧路径 SubAgent/DocSysSkillExecutor/DocSysCLI 仍调用（旧路径既往决策保留不动），仅工具层不注册 |
| 工具参数风格 | 沿用 `vid`（=reposId，保持 LLM 习惯） |
| 多仓库 | 端点单仓库（reposId 必填）；多仓库=多次调用。ToolUseLoop 对同轮多 tool_call 顺序执行（行为正确） |
| grep 兜底实现 | Java 逐文件扫描（等价 grep；跳过 textSearchIgnore；仅文本文件）。不依赖系统 grep 二进制（Windows findstr 编码/行长坑）；必要时可换进程实现 |
| 内容上限 | write_file 内容 ≤ 1MB（可配） |
| 写入实现 | 复用 `updateRealDocContent`（锁/commit/FSM 历史/推送备份）；新建=先建条目再写内容（FSM 产生 create+modify 两条历史，已知可接受）；显式 UTF-8 |

## 4. 搜索接口设计

### 4.1 请求（form 参数，POST）

| 参数 | 必填 | 说明 |
|---|---|---|
| reposId | ✅ | 仓库 ID（单仓库化） |
| mode | | `index`（默认）/ `grep` |
| query | index 必填 | 查询 DSL JSON 字符串 |
| pattern | grep 必填 | 原始关键词（含空格/正则按 contains 处理） |
| path | | 目录限定（仓库内路径前缀） |
| maxResults | | 默认 20，上限 100 |
| withSnippet | | 默认 true；命中内容/备注时返回 ±50 字符纯文本片段 |

**查询 DSL（mode=index）：**
```json
{
  "must":    [{"field":"name",    "term":"周报",  "match":"fuzzy"}],
  "should":  [{"field":"content", "term":"预算"}],
  "mustNot": [{"field":"comment", "term":"保密"}]
}
```
- `field`：`name`→`_DocName` 库 / `content`→`_RDoc` 库 / `comment`→`_VDoc` 库
- `match`：`term`（默认，IK 切词）/ `wildcard` / `prefix` / `fuzzy`。**wildcard/prefix/fuzzy 仅 name 字段**（作用于 `nameForSearch`）；content/comment 仅 term
- 语义映射：must→Occur.MUST（该 term 的每个 IK 词都 MUST）；should→Occur.SHOULD；mustNot→Occur.MUST_NOT（任一 IK 词命中即排除）
- path → 附加 `field="path"` + Wildcard_Prefix 的 MUST 条件

### 4.2 响应（紧凑、无 base64）

```json
{ "status":"ok", "total":37, "results":[
  {"reposId":8,"docId":1203,"path":"/docs/2026","name":"项目周报.docx","type":1,"size":20480,
   "hitType":3,"score":96,"snippet":"…本周预算执行情况…"}
]}
```
hitType 位：1 文件名 / 2 内容 / 4 备注。mode=grep 时 `source:"grep"` + line 号。

### 4.3 grep 分支（mode=grep）

- 扫描 `Path.getReposRealPath(repos)` 实体目录树（**不含虚拟目录**：虚拟内容只能经 DocSys 写入，VDoc 索引必然最新，无需磁盘兜底）；
- 仅 `FileUtil.isTextFile(name)` 的文件；跳过 `DocSysLucene`/`DocSysVerReposes` 目录与 `isRealDocTextSearchIgnored` 命中的路径；
- 逐行 UTF-8 contains 匹配（大小写不敏感），取首个命中行 ±200 字符为 snippet；
- 上限：单文件 ≤5MB、扫描文件数 ≤5000、结果数 `maxResults`（1-100）；
- 纯 `File` 递归实现（docsys 裁剪版 JDK 的 rt.jar 缺 `java.nio.file.BasicFileAttributes`，禁用 Files.walkFileTree）；
- `isRealDocTextSearchIgnored` 从 private static 改 protected（无行为变化）。

## 5. 文本写入接口设计

`POST /Doc/agentWriteText.do`：参数 `reposId, path, name, content, commitMsg`。

服务端流程：
1. `checkAndGetAccessInfo`（会话 + 真实权限）；
2. `FileUtil.isTextFile(name)` 白名单校验，非文本 → 错误「暂不支持该文件类型（仅支持文本文件）」；
3. content 长度 > 1MB → 错误；
4. `docSysGetDoc`：不存在/type=0 → 先按 `saveDocToRepos`（addDoc 流程，type=1）建条目；
5. `doc.setCharset("UTF-8")`、`doc.autoCharsetDetect=false` → `updateRealDocContent`（含锁、commit、FSM 历史、远程推送/本地备份动作）；
6. 返回 `{status, docId, path, name}`。

**Office 写入暂缓**：agentWriteDocx.do（markdown→OOXML docx）等后续设计，接口需声明传入文本格式（如 markdown）。

## 6. Agent 侧工具设计

### 6.1 搜索工具（只读，无需确认）

| 工具 | 参数 | 说明 |
|---|---|---|
| `search_files` | vid(必), query(必,DSL JSON), path?, maxResults?, withSnippet? | 描述含 DSL 示例与字段/match 取值；注明"刚放入磁盘未建索引的文件可能搜不到，用 grep_files" |
| `grep_files` | vid(必), pattern(必), path?, maxResults? | 描述注明"不依赖索引的磁盘扫描，较慢；search_files 未命中时使用" |

### 6.2 写入工具（isWrite + needsConfirm）

| 工具 | 参数 | 行为 |
|---|---|---|
| `write_file` | vid, path, name, content, commitMsg? | 创建/覆盖**文本**文件（txt/md/代码/json/xml/sql/脚本等）；非文本类型服务端报错 |
| `write_note` | vid, path, name, content, docId?, commitMsg? | 备注（虚拟内容）：先 `updateDocContent.do`（备注分支）；报"文件不存在"则回退 `addDoc.do`+content 建条目写备注 |
| `create_folder` | vid, pid, path, name, commitMsg? | 仅建目录（type=2） |

下线：`create_doc`、`search_docs`（注册与工厂方法均删除）。

| `src/com/DocSystem/agent/tool/ToolCallParser.java` | T9.1：支持 `<functions>/<invoke>/<parameter>` 格式（deepseek-v4 漂移）+ arguments JSON 解包 | 主仓库 |
| `src/com/DocSystem/agent/tool/ToolPromptBuilder.java` | T9.1：工具调用格式改为双格式任选（JSON/XML），移除禁止 invoke 的负面约束 | 主仓库 |
| `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java` | T9.1：畸形回灌提示同步双格式 | 主仓库 |

## 7. 文件改动清单
| 文件 | 改动 | 仓库 |
|---|---|---|
| `src/com/DocSystem/controller/DocController.java` | +`agentSearchDoc.do`（index+grep）、+`agentWriteText.do` | 主仓库 |
| `src/com/DocSystem/controller/BaseController.java` | `isRealDocTextSearchIgnored` private→protected | 主仓库 |
| `src/com/DocSystem/agent/search/AgentSearchQueryParser.java`（新） | DSL 解析/校验 → 条件列表（可单测） | 主仓库 |
| `src/com/DocSystem/agent/search/AgentSearchExecutor.java`（新） | 条件→QueryCondition（IK 切词/occur 映射）+ 调用 LuceneUtil2 + grep 扫描 + 结果 DTO（可单测） | 主仓库 |
| `src/com/DocSystem/agent/client/DocSysClient.java` | +`agentSearchDocs`、+`grepFiles`、+`writeTextDoc`、+`updateDocContent`、+`postFormAndParse`、+`agentSearchDocsByKeyword`/`agentListAllDocs`/`agentSearchDocsByQuery`/`buildKeywordQueryJson`（T6）；`searchDocs` 保留为 legacy 包装（**仅 CLI 使用**）；修 addDoc 注释 | 主仓库 |
| `src/com/DocSystem/agent/orchestrator/SubAgent.java` | T6：5 处 searchDocs → agentListAllDocs/agentSearchDocsByKeyword | 主仓库 |
| `src/com/DocSystem/agent/skill/executor/DocSysSkillExecutor.java` | T6：5 处 searchDocs → agentListAllDocs/agentSearchDocsByKeyword | 主仓库 |
| `src/com/DocSystem/agent/tool/DocSysToolFactory.java` | +`searchFiles`、+`grepFiles`、+`writeFile`、+`writeNote`、+`createFolder`；删 `searchDocs`、`createDoc`；registry 装配更新 | 主仓库 |
| 测试 | `tool/TestAgentSearchWriteTools.java` 等（沿用现有护栏风格） | 主仓库 |

编译：JDK8 `javac -encoding UTF-8 -parameters -g -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`。
部署：不自动部署；编译通过后通知用户手动操作（既有约定）。
