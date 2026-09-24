# Agent 工具与技能规模化（何时会爆、业界怎么做、我们改什么）方案与调研记录

建立于 2026-09-24。**状态：仅调研 + 方案，未实施任何代码改动。**
**一句话**：当前实现对"工具/技能数量"没有任何规模机制（只做了角色过滤），
能力一多就会在「原生 tools 数组无上限」「文本通道 6000 字符静默截断」「技能清单 1500 字符且截断不确定」三处静默退化。
本文给出核实过的业界机制（Anthropic Tool Search / Skills 渐进披露）与分阶段改造方案，供后续择期实施。

---

## 0. 结论摘要

| # | 结论 | 依据 |
|---|---|---|
| 1 | 现状**只有角色过滤**（`adminOnly` / `isWrite` 两个 bit），没有按需加载 | `ToolRegistry.listForUser(isAdmin, readOnly)`（`ToolRegistry.java:104/114`）是全仓唯一过滤器 |
| 2 | 原生通道**无任何上限**，且 `tools` 数组**每轮重建** | `ToolUseLoop.java:234` `ToolSchemaBuilder.build(registry.listForUser(isAdmin))`；该调用在每轮 lambda 内 |
| 3 | 文本通道 6000 字符上限后**列出名字但丢描述与参数** | `ToolPromptBuilder.java:22 / 65-70` |
| 4 | 技能清单 1500 字符硬截断，且**丢谁不确定**（数据源无序） | `DocSysToolFactory.java:1428-1449` + `EnhancedSkillManager.java:207`（`ConcurrentHashMap.values()`） |
| 5 | 业界对应机制 = **Tool Search / `defer_loading`**（工具）+ **三层渐进披露**（技能）；阈值：schema 约 **10K token** 以上才划算，扁平方案实际撑到**几十个工具** | 见 §1（Anthropic 官方仓库取证） |
| 6 | 最该先做的是**技能清单检索化 + 截断确定性**：技能是纯数据、`run_skill` schema 天生支持无限技能、改动最小，且当前截断不确定是真缺陷 | §4 P1 |

---

## 1. 业界核实（2025-11 / 2026 现行机制）

> **取证方式说明**：`https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool` 与
> `.../agent-skills/overview` 在本机网络区域被 302 到 `app-unavailable-in-region`，**官方文档抓不到**。
> 故改为从 Anthropic 官方 GitHub 组织取证（`anthropics/skills`、`anthropics/anthropic-sdk-python`、
> `anthropics/claude-cookbooks`、`anthropics/claude-code`），均为 Anthropic 自己维护的一手材料（含 SDK 类型注释原文）。
> 需要页级文档时需换网络环境复核。

### 1.1 工具侧：Tool Search + `defer_loading`

**机制**（`anthropics/skills` → `skills/claude-api/SKILL.md`「Server Tools (Quick Reference)」表）：

| 工具 | type | name | 关键用法 | 结果块 |
|---|---|---|---|---|
| Tool search (regex) | `tool_search_tool_regex_20251119` | `tool_search_tool_regex` | **把其它工具标 `defer_loading: true`** | `tool_search_tool_result` |
| Tool search (BM25) | `tool_search_tool_bm25_20251119` | `tool_search_tool_bm25` | 同上 | `tool_search_tool_result` |

**`defer_loading` 语义**（SDK 类型注释原文，`anthropics/anthropic-sdk-python` → `src/anthropic/types/tool_param.py`）：

> `defer_loading: bool` — "If true, tool will not be included in initial system prompt.
> Only loaded when returned via `tool_reference` from tool search."

**三条硬约束/事实**（这几条直接决定我们的实现形态）：

1. ⚠️⚠️ **不能全 defer**：`skills/claude-api/SKILL.md` §Common Pitfalls 原文 —
   "Tool search: never defer everything. The search tool itself must not have `defer_loading: true`,
   and at least one tool in `tools` must be non-deferred, or the API returns 400
   `All tools have defer_loading set`."
   → 独立佐证：`anthropics/claude-code` → `feed.xml` 更新日志有一条修的就是这个
   （"resumed `claude -p` sessions whose tools all come from MCP servers failing with
   `At least one tool must have defer_loading=false`"）。
   ⇒ **必须有"常驻核心集"**。
2. **发现即追加，不是替换**：`skills/claude-api/shared/tool-use-concepts.md` §Server-Side Tools: Tool Search —
   "Discovered tool schemas are **appended** to the request, not swapped in — this preserves the prompt cache"。
   ⇒ 一旦某工具被发现，**后续轮次必须继续下发**，否则历史里的 `tool_use` 会引用一个本轮不存在的工具。
3. **成本阈值**：`skills/claude-api/shared/cost-optimization.md` §2.2 原文 —
   "Many or heavy tool schemas → tool search with `defer_loading` on rarely-used tools…
   **Pays once schemas run past roughly 10K tokens** (MCP servers reach that fast);
   **below that the search step is overhead**."
   另一处口径（`shared/prompt-audit.md`）：
   "full catalogs of **30+ always-loaded tools** … past **a few dozen** tools use tool search / deferred loading
   instead of always-loading every schema."
   ⇒ **几十个工具以内，扁平下发是对的**；我们的问题是"没有越过阈值后的出路"，不是"现在就该改"。

**MCP 侧的分组控制**（`anthropic-sdk-python` → `src/anthropic/types/beta/beta_mcp_toolset.py` /
`beta_mcp_tool_config.py`）：`BetaMCPToolset` 可按 **server 粒度**统一设 `enabled` / `defer_loading`，
再用 `BetaMCPToolConfig{defer_loading, enabled}` 做**逐工具覆盖**；
`mcp_toolset` 的 `default_config` 可设 `{"enabled": false}` 变成 allowlist 模式。
⇒ "整组默认关、白名单开"是一等公民，不是 hack。

**运行期还可以改工具集**（beta `mid-conversation-tool-changes-2026-07-01`）：
块类型 `tool_addition` / `tool_removal` / `tool_reference`。
官方给的分工口径很值得抄（`shared/tool-use-concepts.md`）：

> "**Tool search is for *discovery*** — Claude finds what it needs from a large library on its own.
> **Mid-conversation tool changes are for *control*** — your application decides the tool set has changed
> (a mode switch, a resource that became available, a capability you want to revoke) and says so explicitly."

**不依赖服务端能力的 DIY 变体**（`anthropics/claude-cookbooks` → `tool_use/tool_search_alternate_approaches.ipynb`）：
只挂一个 `describe_tool`；模型调它时，**返回 `tool_reference` 并把该工具加进 `active_tools` 且带 `defer_loading=True`**。
Notebook 原注："`defer_loading=True` is critical — it keeps the tool definition out of the cached prompt prefix,
avoiding cache invalidation when tools are discovered."
⇒ **这就是我们 P3 的自建版蓝本**（DocSys 的 LLM 端点未必支持 `defer_loading` 协议，但"元工具 + 已激活集合"的逻辑可自建）。

**可用性**（`shared/platform-availability.md`）：Tool search 在 Anthropic API / Bedrock（**仅 InvokeModel，非 Converse**）/ Vertex 可用（表中标 beta）。

### 1.2 技能侧：三层渐进披露

出处：`anthropics/skills` → `skills/skill-creator/SKILL.md`；
`anthropics/claude-cookbooks` → `skills/notebooks/01_skills_introduction.ipynb`；
`anthropics/claude-code` → `plugins/plugin-dev/skills/skill-development/`。

三层加载模型（这是技能能无限扩张的根本原因）：

| 层 | 内容 | 何时进上下文 | 体量口径（官方给的数字） |
|---|---|---|---|
| ① Metadata | `name` + `description` | **常驻** | name ≤ **64 字符**、description ≤ **1024 字符**、约 **100 words** |
| ② SKILL.md 正文 | 操作指令 | **技能命中时** | < **5k words** / < 5k tokens |
| ③ 链接文件 | `references/`（文档）、`scripts/`（可执行）、`assets/`（产物素材） | 只在需要时读 | 大文件（>10k words）要求在 SKILL.md 里给 **grep 搜索模式** |

配套的两条工程纪律（`skill-development/SKILL.md`）：
- **不要重复**："信息要么在 SKILL.md 要么在 references，不要两处都有……把详细参考材料、schema、示例移到 references"。
- **保持 SKILL.md 精简**，把细节沉到 references —— "keeps SKILL.md lean while making information discoverable
  without hogging the context window"。

另：技能 frontmatter 支持 `allowed-tools`（限定该技能可用工具，见 `claude-plugins-official` →
`plugins/plugin-dev/commands/create-plugin.md`），且技能可以**按 plugin 打包分发**
（`anthropics/claude-plugins-official`、`anthropics/financial-services` 等均以 plugin 为分发单位）。

托管形态的官方一句话表述（`claude-cookbooks` → `managed_agents/sre_incident_responder.ipynb`）：
> "the agent sees a **one-line description** up front and reads the body only when it's relevant."

### 1.3 Claude Code 与 Copilot/VS Code 的实际做法（对照）

**Claude Code**（一手来源：`anthropics/claude-code` 仓库的 changelog 与 plugin-dev 文档）
- 核心内置工具保持"少而通用"（Read/Write/Edit/Bash/Grep/Glob/Task/WebFetch/WebSearch/TodoWrite 量级），
  **规模压力主要来自 MCP**，因此把 `defer_loading` 用在 MCP 工具上（changelog 的
  "At least one tool must have defer_loading=false" 报错即源自"整个会话的工具全来自 MCP"）。
- MCP 工具列表是**动态**的（server 可发 `list_changed`；changelog 另有一条修的是
  "repeated tool-list requests when an MCP server sends list_changed notifications in a tight loop"）。
- 技能与插件共用同一套 SKILL.md 三层模型；子代理各有自己的工具子集与上下文。

**Copilot / VS Code**（本机一手观察，非文档；此段如实标注为观察）
- 本会话工具面 **74 个**：浏览器/终端/Notebook 21、核心编辑搜索 26、Java 调试 8、Pylance(MCP) 19。
  即**"大工具面"是常态**，靠外围机制收敛：
  - **分组按需激活**：Java 调试只有 `activate_java_debugging_control_tools` /
    `activate_java_debug_session_management_tools` 两个入口，**先激活才出现真正的断点/变量工具**（最接近 defer 的自建形态）。
  - **MCP 前缀命名空间 + 整 server 装卸**：`mcp_pylance_mcp_s_*`；
  - **工作区/语言作用域**：Pylance 那 19 个只在 Python 工作区出现；
  - **用户侧收窄**：chat 里可 `#` 点名工具、可取消工具参与；
  - **子代理上下文隔离**：`runSubagent` 把大范围探索挪出主上下文（规模的本质是上下文，不只是工具表）。
- 技能 **19 个**，**只注入 `name + description + 文件路径` 各一行**，正文按需 `read_file`（与 §1.2 同构）。
  来源三处：`~/.claude/skills` 6 个（**与 Claude Code 共用同一份文件**）、Copilot 内置 4 个、Pylance 扩展 9 个。

---

## 2. DocSys 现状体检（已读代码，逐行点算）

| # | 事实 | 位置 | 后果 |
|---|---|---|---|
| 1 | ✅ 工具数（按代码点算，dev 全条件满足）：只读 **10** + 写 **14** + `memory_*` **3** + `web_search` **1** = **28**（`createFullRegistry`）；`buildToolLoop` 再补 `run_skill` + `attachment` → **30** | `DocSysToolFactory.createFullRegistry`；`MainAgent.java:714` | 尚在"几十个工具"的舒适区，**现在不必改**，但要预留出路 |
| 2 | ⚠️ **原生通道无上限**：全量工具随每次请求下发 | `ToolUseLoop.java:234` | 工具数 × 轮数(≤26) × 请求数 线性放大，**无缓存** |
| 3 | ⚠️ **每轮重建** tools 数组（在 `turnRunner` 的 lambda 内调用 `effectiveTools`） | `ToolUseLoop.effectiveTools()` | 同一请求内重复构造，纯浪费 |
| 4 | ⚠️⚠️ **文本通道 6000 字符预算**，超预算写 `- <name>: (truncated — parameters omitted)` 且**用 `continue` 而非 `break`** | `ToolPromptBuilder.java:22, 65-70` | 模型看到工具名却不知描述/参数 → **会瞎试**，比"看不见"更糟 |
| 5 | ⚠️ **文本通道是真实可达路径**（不是死代码）：端点拒 tools（HTTP 400）→ 去 tools 重试一次 → `toolsRejected` → 本轮后续轮次关原生通道 | `LLMService.java:379-405`、`ToolUseLoop.runInternal` | thinking 类模型 / 不支持 tools 的网关下，第 4 条的退化会真的发生 |
| 6 | ⚠️ **未知工具错误回全表**：`"Unknown tool: X (available: " + names() + ")"` | `ToolRegistry.execute` | 模型一次笔误 → 整张工具表被灌回上下文一遍 |
| 7 | ⚠️⚠️ **技能清单 1500 字符硬截断**，超了 `append("...")` + `break` | `DocSysToolFactory.java:1428-1449`（预算在 1436，截断在 1443） | 后面的技能**静默消失**，模型无法知道"还有更多" |
| 8 | ⚠️⚠️ **截断丢谁不确定**：`getAllSkills()` 返回 `ConcurrentHashMap.values()`，**无序** | `EnhancedSkillManager.java:207` | 同一技能可能重启后从模型视野消失；**这是真缺陷，不是性能问题** |
| 9 | 技能清单**只**出现在 `run_skill` 的 description 里（不在 system prompt 的工具列表段） | `DocSysToolFactory.java:1387` | 形态其实是对的，缺的只是"检索" |
| 10 | ✅ `run_skill` 的 schema 只有 `{skillId(必填), params}` | `DocSysToolFactory.runSkillTool` | **结构上天生支持无限技能**，扩容成本主要在清单而非调用面 |
| 11 | ✅ 技能执行不依赖清单：`SkillExecutorRegistry` 按 `@Order` 取第一个 `canHandle` | `SkillExecutorRegistry.findExecutor` | 检索化改造**不会碰执行链** |
| 12 | ⚠️ 工具的 `description` 大量**交叉点名**其它工具（"拿到 vid 后用它调用 `list_docs` / `search_files` / `get_repos`"） | `DocSysToolFactory` 各工具 | 双刃：这是当前路由准确率的主要来源；但名称漂移会失效（官方口径是"system prompt 不该点名工具"）。**本次不动**，仅登记 |
| 13 | 注册表是**每请求新建** | `MainAgent.buildToolLoop` | ⇒ "按场景裁剪"**不需要新机制**，只改那一次装配即可 |
| 14 | ⚠️ **技能查找文件名大小写不一致**：`EnhancedSkillManager.java:126` 找 `SKILL.md`（大写，**Anthropic 标准**），而 `SkillManager.java:203` 与 `ExternalSkillExecutor.java:158` 找 `skill.md`（小写） | 三个文件三处 | Windows 文件系统大小写不敏感 → dev **看不出来**；⚠️ **Linux 包（DocSys 有 Linux 发行包）上**，一个按标准只放 `SKILL.md` 的外部技能会：**在模型清单里出现**（`EnhancedSkillManager` 读得到）却 **`canHandle=false` → 执行报 `No executor found for skill: X`**。⚠️ **未在 Linux 实测**（本次只在 Windows 下核对代码），列为待验证项 |

**技能盘面（源码树 `WebRoot/WEB-INF/skills/`）**：6 个 —— `ant-expert`、`web_search`、`playwright`、
`java-expert`、`browser_use`、`banner`。运行期 store 另在 `C:\DocSysReposes\skills`
（`Path.getAgentSkillStorePath()`，由 `ExternalSkillExecutor.skillsDir()` 解析）。
⇒ 1500 字符上限目前**没触顶**，但一旦装到几十个技能就会静默丢。

---

## 3. 差距对照

| 维度 | 业界 | DocSys 现状 | 差距 |
|---|---|---|---|
| 工具清单下发 | 常驻核心集 + 其余 `defer_loading`，模型按需 `tool_reference` 取回 | 全量、每轮、无上限 | **缺"按需"** |
| 工具分组 | MCP toolset：整组默认关 + 逐工具覆盖；场景激活 | 只有 `adminOnly` / `isWrite` 两位 | 缺"组"的概念（但注册表每请求新建，落点已具备） |
| 技能清单 | 三层渐进披露；大文件给 grep 模式让模型自己去取 | 一行式清单（对）+ 1500 硬截断（错）+ 无序（更错） | 缺"检索"与"确定性" |
| 技能正文 | 命中时才读 | ✅ 已经是（`run_skill` → 执行器读 `skill.md`） | 无 |
| 子代理隔离 | 独立上下文 + 自己的工具子集 | 有 `SubAgent`（旧编排，**已封口冻结**） | 形态存在但未按新架构启用 |
| 安全边界 | 与工具总数解耦（`allowed-tools` / 权限表） | ✅ 已解耦（`ToolRiskCatalog` + `PermissionContext` + 确认门） | 无 |
| 规模失效模式 | 显式（400 / 明确提示） | **静默**（6000 / 1500 截断、丢谁不确定） | 最该优先消除 |

---

## 4. 改造方案（分阶段，建议按 P1 → P2 → P3 顺序，P4 存疑）

### P1 · 技能清单检索化 + 截断确定性（建议先做，收益/改动比最高）

**为什么先做**：技能是**纯数据**；`run_skill` schema 天生支持无限技能（事实 10）；执行链不依赖清单（事实 11）；
而"截断不确定"（事实 8）是**真缺陷**。

**改动清单**（预估 2 文件 + 1 新工具 + 1 护栏）：

| 文件 | 改动 |
|---|---|
| `EnhancedSkillManager` | `getAllSkills()` 返回**确定性顺序**（按 id 字典序；或按 `category` + id 二级排序）。⚠️ 先确认无调用方依赖现有顺序 |
| `DocSysToolFactory.runSkillTool` / `buildSkillListForPrompt` | ① 清单按 **category 分组**渲染（`category: id(name); id2(name);`）；② 超预算时**按分组整组保留**并显式写"还有 N 个技能未列出：用 `list_skills` 查"；③ 预算沿用 1500 或提到 ~2000（需实测） |
| `DocSysToolFactory`（新） | 新增只读工具 `list_skills(query?/category?)`：返回 id + name + description（分页 + 字符预算，复用现有 `paged`/`moreHint` 渲染件） |
| `SkillManager.java:203` / `ExternalSkillExecutor.java:158`（**附带修**，见事实 14） | 技能入口文件查找改成**大小写容忍**（先 `SKILL.md` 再 `skill.md`），与 `EnhancedSkillManager.java:126` 统一。技能越多、越可能装到按标准命名（`SKILL.md`）的外部技能，这条越容易咬人 |
| `TestSkillCatalogScale`（新护栏） | 见下 |

**验收（必须造规模，不能只用现有 6 个技能）**：
1. 造 **60 个**假技能目录（`tmp/` 下生成 `SKILL.md`，不入版本控制）→ 断言 `run_skill` description 长度 ≤ 预算；
2. **确定性**：同一输入连续渲染两次**逐字节相同**（这条直接锁住事实 8 的缺陷）；
3. **可发现**：清单里未列出的技能，能通过 `list_skills` 查到（断言 id 全覆盖：`清单 ∪ 分页结果 == 全量`）；
4. 现有 6 个技能的行为不变（`run_skill(system_help)` 之类的既有护栏不回归）。
5. 大小写兼容（事实 14）：只放 `SKILL.md` 的目录也能被外部执行器接管。
   ⚠️⚠️ **不要护栏里直接调 `ExternalSkillExecutor.canHandle(id)`**：对不在排除集的 id 它会继续走外部技能目录查找 →
   触碰 `BaseFunction.<clinit>` → 裸 JVM 里 `Log` 写文件失败会**递归 StackOverflow**（R3-11 已踩）。
   该点用**源码 lint** 或把"查找文件名"抽成可单测的静态辅助方法来验。

**风险**：低。执行链、权限、确认门均不涉及。

### P2 · 工具按场景/域子集化（"控制"侧的等价物）

对应官方口径里的 **control**（应用明确知道该给什么工具），不需要模型自己检索。

| 文件 | 改动 |
|---|---|
| `DocSysToolFactory` | 引入 `ToolProfile`（如 `all` / `docs` / `reposAdmin` / `readonly` / `skillOnly`），每个 profile 声明**工具名集合**；`createFullRegistry(client, …, profile)` 按 profile 注册 |
| `ToolRegistry` | `listForUser(isAdmin, readOnly)` → 增加 profile 维度（保留旧签名以防回归） |
| `MainAgent.buildToolLoop` | 按请求上下文选 profile（入口来源 `ctxVid` / 用户角色 / 会话模式） |

**原则（照抄官方教训）**：**永远保留一个"常驻核心集"**，任何 profile 都不得为空
（官方 400 `All tools have defer_loading set` 的同构风险）。
**验收**：① 每个 profile 非空（断言）；② `readonly` profile 不含任何 `isWrite` 工具；③ 13 个写工具的 `required` 必含 `vid`
（既有 `TestSearchCrossRepo` 的锁不得回退）；④ 默认（不传 profile）行为与改造前**逐字节一致**。
**风险**：中（会改变模型可见工具面 → 需要页面 E2E 复测命中率）。

### P3 · 元工具（自建 `defer_loading`：`search_tools`）

**蓝本**：§1.1 的 cookbook DIY 变体（`describe_tool` → 回 `tool_reference` + 加入 `active_tools`）。

**形态**：
1. `ToolUseLoop` 维护**本请求的"已激活工具集合"**（`Set<String>`，每次 `run` 重置）；
2. `effectiveTools()` 只下发 **常驻核心集 ∪ 已激活集合**；
3. 新增只读工具 `search_tools(query)`：返回候选项的 `name + description + parameters`，并写入"已激活集合"；
4. ⚠️⚠️ **已激活集合只增不减**，且**一旦激活，后续所有轮次都要继续下发** —— 否则历史消息里的
   `tool_use`/工具结果会引用一个本轮 `tools` 里不存在的工具（这正是官方"append 而非 swap"要解决的问题）。

**待核前置**（实现前必须先查清，否则可能白做）：
- `LLMService` 当前**是否使用 prompt cache** / 有无 `cache_control` 字段。若无，则"发现即追加"的缓存收益不存在，
  只保留**一致性**这条硬理由即可（一致性理由本身已经足够）；
- 端点是否原样透传未知字段（否则不能顺带下发 `defer_loading`，只能纯自建）。

**验收**：① 未调用 `search_tools` 时，下发的 tools 数组 == 常驻集（逐元素断言）；
② 调用后该工具出现在**此后每一轮**的 tools 里；③ 模型能完成一个"必须靠 `search_tools` 才能拿到工具"的任务（页面 E2E）；
④ 单轮 tools 数组字符数显著下降（给数字）。

**风险**：中高（改的是循环主路径）。**建议在 P2 之后、且 P1/P2 的规模指纹就位后再评估是否真需要**。

### P4 · 子代理上下文隔离（存疑，暂不建议）

DocSys 有 `SubAgent`，但属"旧编排"且已按 R3-4 用户裁定**封口冻结**（`TestLegacyFallbackGuard` 用 tripwire 锁住）。
把它改造成"独立上下文 + 工具子集"的现代形态是**另一个量级**的工程，且与"工具表规模"不是同一个问题。
⇒ **本次只登记，不做**。

---

## 5. 明确不做

- ❌ 不引入用户级"工具白名单"UI：现有 `adminOnly` / `readOnly` 两档够用（官方 `allowed-tools` 是给技能用的，我们已有权限面）。
- ❌ 不删减现有工具：端点存在性由 `TestToolOnboarding` 管；"少而通用"不是当前瓶颈。
- ❌ 不改工具 `description` 里的交叉点名（事实 12）：那是当前路由准确率的主要来源，**动它是另一个课题**（需先有命中率基线）。
- ❌ 不做"每工具一个 HTTP 端点"之类的结构改造。

---

## 6. 实现第一步：先测三个基线（没有数字不要动手）

| 基线 | 怎么测 | 用来判断 |
|---|---|---|
| `ToolPromptBuilder.buildSystemPrompt(createFullRegistry(client) 全量)` 的**字符数** | 加一句日志 / 护栏内直接调用打印 | 是否已接近/超过 6000（**当前只是怀疑，未实测**） |
| 原生通道每轮 `tools` 数组的 **JSON 长度** | 在 `effectiveTools` 出口打日志 | 越过 ~10K token 阈值前不必做 P3 |
| `buildSkillListForPrompt()` 的**当前长度** | 同上 | 1500 预算还剩多少余量 |

> ⚠️ 口径：官方阈值是**约 10K token**（不是字符）。中文场景下 1 token ≈ 1~1.5 汉字，
> 但工具 schema 是英文/JSON 为主，粗估 **1 token ≈ 3~4 字符**。**必须实测，不要拿估算当结论。**

---

## 7. 参考来源（可复现）

| 结论 | 来源 |
|---|---|
| 两个 tool search 变体 / `defer_loading` 用法 / "不能全 defer" | `anthropics/skills` → `skills/claude-api/SKILL.md`「Server Tools (Quick Reference)」+「Common Pitfalls」 |
| "发现即追加，保 prompt cache" / "tool search = discovery，mid-conversation changes = control" / `tool_addition`/`tool_removal`/`tool_reference` | `anthropics/skills` → `skills/claude-api/shared/tool-use-concepts.md` |
| **10K token 阈值**、"几十个工具以上改用 tool search" | `anthropics/skills` → `skills/claude-api/shared/cost-optimization.md` §2.2、`shared/prompt-audit.md` |
| `defer_loading` 字段原文语义 | `anthropics/anthropic-sdk-python` → `src/anthropic/types/tool_param.py`（及 `beta/beta_mcp_toolset.py`、`beta/beta_mcp_tool_config.py`） |
| DIY 元工具变体（`describe_tool` + `active_tools`） | `anthropics/claude-cookbooks` → `tool_use/tool_search_alternate_approaches.ipynb` |
| Claude Code 也在用 defer（"全 MCP 工具"会话曾 400）；MCP `list_changed` 的规模问题 | `anthropics/claude-code` → `feed.xml`（changelog） |
| 技能三层渐进披露 + 64/1024 字符 / 100 words / 5k words 口径 | `anthropics/claude-cookbooks` → `skills/notebooks/01_skills_introduction.ipynb`；`anthropics/claude-code` → `plugins/plugin-dev/skills/skill-development/` |
| 技能 `allowed-tools` 与 plugin 分发 | `anthropics/claude-plugins-official` → `plugins/plugin-dev/…` |
| Tool search 可用性（Bedrock 仅 InvokeModel） | `anthropics/skills` → `skills/claude-api/shared/platform-availability.md` |

> ⚠️ 官方页级文档（`platform.claude.com/docs/…/tool-search-tool`、`…/agent-skills/overview`）**本次未能抓取**
> （区域限制）。若实施前需要页级细节（beta header 精确取值、`tool_search_tool_result` 的字段形状），
> 需换网络环境复核，**不要依赖本文的转述**。
