# Agent「AI接入设置」改造方案（大模型列表化）

> 状态：**已于 2026-10-03 实施完成并通过 E2E 验证**（用户已裁定 5 条 + 2 轮 UI 微调；实施结果见文末「实施记录」）
> 目标页面：智能体设置 → AI接入设置（`tmpl/systemLlm{,_en}.html`）
> 工作卡：`DevAgentControl/CURRENT_STATE_AI接入设置.md`

## 1. 问题

当前 `AI接入设置` 只有一个输入框，值是一整条字符串：

```
https://api.deepseek.com; apikey=sk-xxx; name=deepseek-v4-flash; modelName=deepseek-v4-flash || https://api.deepseek.com; apikey=sk-xxx; name=deepseek-v4-pro; modelName=deepseek-v4-pro
```

规则：`||` 分隔多个模型；每段里**第一个分号前的片段是接口地址**，其余是 `k=v`（`name` / `modelName` / `apikey`，其它 kv 进 `settings`）。
对管理员要求过高：多一个空格、少一个分号、顺序错一位都会静默失效（或只影响第 1 个模型），且没有"测试单个模型"的能力。

## 2. 现状取证（代码位置）

| 环节 | 位置 | 说明 |
| --- | --- | --- |
| 配置 key | `docSys.ini/docSysConfig.properties` 的 `llmConfig` | 运行期**只读 ini**（`BaseFunction.java:2497 initLLMConfig()` → `ReadProperties.getValue(docSysIniPath + "docSysConfig.properties", "llmConfig")`） |
| 解析 | `LLMUtil.java:18 getSystemLLMConfig(String)` | `split("\\|\\|")` → 每段 `parseLLMConfig()`：`configs[0].trim()` = url，其余 `k=v` 经 `LDAPUtil.getLDAPSettings()` |
| 内存对象 | `BaseFunction.systemLLMConfig`（`SystemLLMConfig`） | `{enabled, List<LLMConfig{name, modelName, url, apikey, settings(JSONObject)}>}`；`applySystemLLMConfig()` 恒置 `enabled=true` |
| 后台读写 | `ManageController.setSystemInfo()`：`:1890` 写文件、`:1973` `applySystemLLMConfig()` 立即生效 | 写文件前会先把 **classes 副本覆盖 ini**（`:1787`），写完再同步回去；企业版以外会记"专业版/个人版不支持AI接入"告警 |
| 后台展示 | `ManageController.java:1436 getSystemInfo()` → `config.put("llmConfig", getLLMConfig())`，`getLLMConfig()`（`BaseFunction.java:5581`）读的是 **classes 副本** | 与运行期读的 ini 不是同一份（既有"双源"现象） |
| 模型列表给前端 | `ReposController.java:94 getAiModelList.do` | 返回 `name` 数组（Agent 页面模型下拉） |
| 聊天选模型 | `ReposController.AIChat.do` | 请求带 `LLMIndex` / `LLMName` |
| Agent 侧列表 | `AgentController.java:819 GET /agent/models/list` | 系统模型 `selector=sys:<index>` + 用户自定义模型 `selector=user:<id>`，`defaultSelector=sys:0` |
| Agent 主对话默认模型 | `LlmConfigSyncService.doSyncConfig()` | **只取 `systemLLMConfig.llmConfigList.get(0)`** ⇒ "列表第 1 条 = 默认模型"是既有语义 |
| 单/多模型测试 | `ManageController.java:2259 llmTest.do` | 入参就是那条字符串 → 可传"只含 1 个模型"的串做单模型测试（**零后端改动即可复用**） |
| Agent 侧已有的"友好表单" | `AgentController.java:863/887/909` `/agent/models/custom`（POST/POST/DELETE）+ `UserCustomLlmModel` | 表 `user_custom_llm_models(name/model_name/endpoint/api_key/settings)`；校验：名称/标识/地址非空；**但这是"每个用户自己的模型"，不是系统级** |

### 2.1 用户提示的"agent 相关参数存哪里"——查实结果

**`agent_config` 表（`scope` + `key` → `value`），服务类 `AgentConfigService`（`getGlobal/setGlobal/list`）。**

已存在的 key（都在 agent 设置体系里）：

- `system_prompt_override` / `system_prompt_suffix` —— **提示词管理**（与 AI接入设置同一菜单组，接口 `GET/POST /DocSystem/agent/config/system-prompt`，要求 `isSystemAdmin`）
- `agent_tool_choice`、`agent_max_turns`、`permission.*`（权限模式改造）

⇒ 大模型列表**天然属于这一层**：同组页面（提示词管理）已经用 `agent_config`。

另一可选位置：`system_setting`（主系统参数键值表，`SystemSettingService`：`getValue/getJson/set/setMany/seedIfAbsent/countByPrefix`，带 TTL 缓存 + 写后失效 + 容错不抛）。mail/sms 已迁到此处（`mail.*` / `sms.*` JSON 行，`MailConfigStore`/`SmsConfigStore` 即"store + 首启种子"范式），后台「系统管理 → 系统参数」页可见。

## 3. 方案对比

| | A：只改前端 | **B：`agent_config`（推荐）** | C：`system_setting` |
| --- | --- | --- | --- |
| 存储 | 不变（还是 ini 长串） | `agent_config.llm_models`（JSON）+ ini 镜像 | `system_setting.agent.llm.models`（JSON）+ ini 镜像 |
| 前端 | 列表 UI ↔ 长串互转 | 列表 UI ↔ 后端 JSON | 同 B |
| 后端 | 0 | 新增 store + 2 接口 + 小桥接 | 同 B，但落在主系统表 |
| 迁移 | 无 | 首次打开自动播种（解析现有长串） | 同 B |
| 扩展性 | 差（只能塞 `settings`） | 好（结构化字段、将来可按 scope 分仓库） | 好 |
| 一致性风险 | 无 | 中（JSON 权威 + ini 镜像，需要写清口径） | 中 |
| 与同组页面一致性 | — | **高（提示词管理同表）** | 低（同组两个页面两套存储） |
| 是否需要编译+重启 | 否 | 是（一次） | 是 |

**推荐 B**：① 用户提示的"agent 参数存储位置"就落在 `agent_config`，且同菜单组的提示词管理已在用；② 接口/鉴权/返回体风格现成（照抄 `system-prompt` 两个方法）；③ `scope` 预留了将来"按仓库/租户配模型"；④ 旧长串仍作为运行期镜像保留，非 agent 部署与回退场景不退化。

## 4. 方案 B 详细设计

### 4.1 存储结构

`agent_config(scope='global', key='llm_models')`：

```json
[
  { "id": "m1", "name": "deepseek-v4-flash", "modelName": "deepseek-v4-flash",
    "endpoint": "https://api.deepseek.com", "apiKey": "sk-xxx",
    "enabled": true, "settings": {} }
]
```

- **数组顺序 = 优先级，第 1 条即默认模型**（沿用 `LlmConfigSyncService` 取 `get(0)` 的既有语义 ⇒ 后端逻辑零改动）
- `apiKey` 明文落库（与现状、与 `user_custom_llm_models` 的注释口径一致）；**接口回传时掩码**（`sk-***abc`），前端留空 = 不修改
- `settings` 预留给高级参数（temperature / maxTokens / 自定义 kv），一期可不填

### 4.2 运行时桥接（关键，决定"不重启即生效"）

- `AgentLlmConfigStore`（新类，agent 侧）：
  - `load()`：读 `agent_config.llm_models`；**为空时**用传入的 ini 长串解析播种（老数据零操作迁移）
  - `toLegacyString(list)`：渲染成 `url; name=..; modelName=..; apikey=..` 用 ` || ` 连接 —— **必须是 `LLMUtil.parseLLMConfig()` 能解析的格式**（url 在第一段）
  - `save(list)`：写 `agent_config` → 渲染镜像串 → 交 DocSys 侧落盘 + `applySystemLLMConfig()`（内存立即生效）
- 落盘沿用 `setSystemInfo()` 的既有写法（`ManageController.java:1785-1890`：ini ↔ classes 同步 + `ReadProperties.setValue(..., "llmConfig", str)`）
- 需要一处**很小的可见性调整**：`BaseFunction.applySystemLLMConfig()` 现在是 `protected static`（`BaseFunction.java:2652`）→ 放成 `public`（或经 `ManageController` 加一个内部方法转发），供 agent 侧调用。**不新增解析逻辑、不改 `LLMUtil` / `SystemLLMConfig` / `LlmConfigSyncService`** ⇒ 只换"谁产出那个串"
- 启动顺序：`BaseFunction` 静态块仍先读 ini（镜像作为引导值，保证"AI 图标显示"等既有行为）→ `docSysInit()` 成功路径里 agent 初始化钩子（`AgentInitService`）追加一次"若 `agent_config.llm_models` 存在 → 渲染 + apply"（覆盖 ini，确立 JSON 权威）。agent 不可用/表不存在 → 保持现状（用 ini），不报错、不阻塞启动

### 4.3 后端接口（骨架照抄 `system-prompt` 的两个方法）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/agent/config/llm-models` | 管理员；返回 `{models:[{id,name,modelName,endpoint,apiKeyMasked,hasApiKey,enabled}], legacy:"…"}` |
| POST | `/agent/config/llm-models` | 管理员；body `{models:[…]}`；校验：`name`/`modelName`/`endpoint` 非空、`endpoint` 以 `http://`/`https://` 开头、`apiKey` 留空=沿用原值、名称不重复；保存 JSON + 渲染镜像 + 应用 |
| 测试连接 | **复用现有** `Manage/llmTest.do` | 前端把"当前表单/该行"渲染成单条长串传过去即可，**后端 0 改动** |

企业版限制：`setSystemInfo` 里对非企业版有"专业版/个人版不支持AI接入"的告警（`:1879-1888`）→ 新端点需复制同一判断（或干脆走"新端点存 JSON + 前端再调一次 `setSystemInfo.do` 落镜像串"的写法，把校验/落盘/apply 全部复用既有路径 —— 实施时二选一，倾向后者少写代码，但要处理"两次请求半失败"的提示）。

### 4.4 前端（`tmpl/systemLlm{,_en}.html` + `main.js`）

- 列表表格（沿用本后台 `widget` + 两列表格风格）：

  | 模型名称 | 接口地址 | 模型标识 | API Key | 状态 | 操作 |
  | --- | --- | --- | --- | --- | --- |
  | deepseek-v4-flash（默认） | https://api.deepseek.com | deepseek-v4-flash | sk-***abc | 启用 | 测试 / 编辑 / 上移 / 下移 / 删除 |

- 表头右上：`新增模型`；下方或表头：`保存` / `取消` —— **默认置灰，仅在有改动时启用**（与「调试日志」页刚统一的门控口径一致）
- 编辑用弹窗（复用本后台弹窗风格，如"发送测试邮件"面板）：`模型名称` / `接口地址` / `模型标识(modelName)` / `API Key`（掩码 + 显示切换）+ `测试连接`（用当前表单值试发）
- 「设为默认」= 把该行排到第一位（后端零改动）；行内标「默认」徽标
- 底部：只读的"原始配置串"预览 + 复制（排查用，**不做第二编辑入口**）
- 中/英两套模板同步改；改完做 `template.compile` 自检（既有约定）

### 4.5 兼容性与回归面

| 消费方 | 影响 |
| --- | --- |
| `getAiModelList.do`（Agent 模型下拉） | 只读内存对象，行为不变 |
| `AIChat.do`（`LLMIndex`/`LLMName`） | 序号 = 列表顺序，行为不变 |
| `/agent/models/list`（`sys:<index>` + `defaultSelector=sys:0`） | 行为不变 |
| `LlmConfigSyncService`（Agent 主对话默认模型） | 仍取第 1 条 ⇒ "默认"由顺序表达 |
| `getLLMConfig()`（后台展示 / `clusterLLMConfig`） | 读 classes 副本，仍由既有 checksum 同步机制更新 |
| 「系统管理 → 系统参数」页的 `llmConfig` 行 | 变成**镜像**：以 AI接入设置页为准，手工改这里会在下次保存后被覆盖（需在页面备注/文档写明） |
| 非 agent 部署（无 `agent_config` 表） | 回落 ini，不退化 |

## 5. 验证方案（实施后）

1. **迁移**：先备份 `docSys.ini/docSysConfig.properties`；首次打开页面应自动列出**现有 2 个 deepseek 模型**（无需管理员操作）
2. **不重启即生效**：保存后 `getAiModelList.do` 返回新列表；`/agent/models/list` 的 `sys:*` 序号随之变化；Agent 页面模型下拉同步
3. **重启后仍生效**：重启 Tomcat 后 `BaseFunction.systemLLMConfig` 与页面一致（验证 JSON 权威）
4. **回落**：手工删掉 `agent_config.llm_models` 行 → 重启后回落到 ini 镜像（不空、不报错）
5. **边界**：非法地址（无协议头）、重名、`apiKey` 留空不改、空列表（= 关闭 AI，回到"系统未设置AI模型"）、单条模型测试失败提示
6. **前端**：中/英页面渲染；增删改查/排序/默认；保存-取消门控；`template.compile` 自检
7. **回归**：Agent 弹层模型下拉、SSE 聊天选模型、AI 图标显示

## 6. 工作量与实施顺序（预估）

1. `AgentLlmConfigStore` + 播种/渲染/应用（后端核心，~200 行）
2. `AgentController` 2 个接口 + `BaseFunction` 可见性调整（~120 行）
3. `main.js` + 中/英模板（列表 + 弹窗 + 测试 + 门控，~400 行）
4. 编译 + 重启 + E2E + 迁移验证 + 文档 + 工作卡

## 7. 待用户裁定

1. 存储选 **B（`agent_config`，推荐）** / C（`system_setting`）/ A（只改前端、存储不动）
2. 「默认模型」按"排到第一位"实现（后端零改动，推荐），还是加显式 `default` 标记（要动 `LlmConfigSyncService` 等）？
3. 一期是否要"高级参数"（temperature / maxTokens / 自定义 kv → 存 `settings`）？
4. `agent_config` 权威 + ini 镜像的口径是否接受（即：**手工改 ini 的 `llmConfig` 会在下次保存时被覆盖**）？若不接受，就退回方案 A。
5. 是否需要单模型"停用/启用"开关（不删除、暂时不参与列表）？

---

## 8. 实施记录（2026-10-03）

### 8.1 用户裁定（全部按 B 方案 + 一期含高级参数）

| # | 裁定 | 落地情况 |
| --- | --- | --- |
| 1 | 存储选 **B：`agent_config`** | ✅ `agent_config(global, llm_models)` JSON 数组 |
| 2 | 「默认模型」= **排到第一位** | ✅ 列表顺序即优先级；**第 1 个「启用」的**模型打「默认」徽标，后端零改动 |
| 3 | 一期**包含**高级参数 | ✅ 每条模型 `settings`（temperature / maxTokens / 自定义 kv），以 `键=值` 追加进运行期串 |
| 4 | 接受 **JSON 权威 + ini 镜像** | ✅ 保存双写 + 启动 `docSysInit` 用 JSON 覆盖（重启验证通过） |
| 5 | **需要**单模型停用/启用 | ✅ 行内复选；停用项不进入运行期列表（保存后立即生效） |
| 6 | 追加 UI 微调（第 1 轮） | ✅ 操作按钮之间加 8px 间隙；表格下方说明文字删除 |
| 7 | 追加 UI 微调（第 2 轮） | ✅ 名称列只显示名称（去「默认」徽标、去▲▼）→ 改为「置顶」按钮调顺序 |
| 8 | 追加 UI 微调（第 3 轮） | ✅ 操作区按键不横向摆放 → 纵向排列（列宽收窄到 76px，空间让给信息列） |
| 9-12 | 追加 UI 微调（第 4 轮） | ✅ API Key 回明文（便于核对）；去掉「清除已保存的密钥」；去掉「停用后不参与运行期」提示；高级参数改为勾选后才展示/生效 |
| 13 | 追加 UI 微调（第 5 轮） | ✅ 对话框「启用」移到「高级参数」之后 |
| 14 | 追加 UI 微调（第 6 轮） | ✅ 对话框标签统一左对齐（主题 `.control-label` 固定宽度+右对齐，短标签会被推到右侧） |

### 8.2 实施与方案的两处偏差（均为实施期优化）

1. **单模型测试不再复用 `Manage/llmTest.do`，改为新增 `POST /agent/config/llm-models/test`。**
   原因：前端只拿得到**掩码** key，「不动密钥直接测」在旧接口下会必然失败；新接口按 `id` 取已保存的明文 key（`llmTest.do` 保留不动，供其他用途）。
2. **apiKey 增加「清除已保存的密钥」选项**：`clearApiKey=true` 时后端跳过按 id 回填 ⇒ 本地 Ollama 这类"从有 key 改成无 key"的场景可表达。

### 8.3 最终结构（与方案 §4 的差异）

- 列表页改为 **4 列**：`模型名称`（150px，**纯名称**）/ `接口地址 / 模型标识 / API Key`（自适应）/ `状态`（76px，启用复选）/ `操作`（76px，测试·编辑·置顶·删除**纵向排列**）
  —— 窄窗口（~540px 内容区）下 6 列 + 6 按钮会竖排/换行；最终按用户反馈定为「名称列只放名称 + 用置顶调顺序 + 操作按钮纵向排列」，列宽收窄后把空间让给信息列。
- 行内按钮紧凑化：`#systemLlmTable td .btn{padding:2px 8px;font-size:11px;display:block}` + `.btn + .btn{margin-top:6px}`（纵向间距）；全局表格行内相邻按钮补 `margin-left:8px`（其他页面不受影响，仅本表纵向）。
- 中间列 `word-break:break-all`：让 `th` 上声明的列宽真正生效（否则长 URL 的 min-content 会挤掉操作列）。
- **apiKey 回归明文**（用户裁定，与 §4.1 原设计的「掩码回传」相反）：接口直接回 `apiKey` 明文，列表与对话框均显示原值；
  因此删除了 `clearApiKey` 字段、`fillApiKeyFromStored()` 回填逻辑与「清除已保存的密钥」选项（直接改输入框即可）。
  以后若要恢复掩码，只需改 `AgentController.buildSystemLlmData()` 一处（`AgentLlmConfigStore.maskApiKey()` 已保留）。
- **高级参数改为「勾选后展示与生效」**：对话框新增 `#systemLlmModelUseAdvanced`，未勾选时隐藏参数块并让 `collectSystemLlmModelSettings()` 返回 `{}`
  （= 已保存的高级参数会被清掉、不再进入运行期串）；打开对话框时若该模型已有 settings 则自动勾选。
- **对话框标签对齐（第 6 轮）**：主题的 `.control-label` 是固定宽度 + 右对齐，短标签（如「状态」）文字会被推到右侧、看起来缩进；
  故给对话框加 `systemLlmModelForm` 类并覆盖 `.control-label{text-align:left}`（保留 15px 左内边距 → 与输入框左边缘齐）。实测 6 个标签文字左端与输入框左边缘均为 120px。
- 表格下方两行说明文字（顺序说明 + 运行期串预览）按用户要求**移除**。

### 8.4 验证证据（dev 8100）

- 迁移：`AgentLlmConfigStore 已从运行期配置串播种 2 个模型到 agent_config`（控制台日志）
- 不重启生效：停用/启用第 2 个模型 → `getAiModelList.do` 立即在 `["deepseek-v4-flash"]` 与 2 个模型之间切换；`/agent/models/list` 的 `sys:*` 同步
- JSON 权威：把 ini 的 `llmConfig` 改成 `BOGUS-MODEL` 后重启 → 运行期恢复为 2 个真实模型、ini 被重写回真实串
- 镜像落盘：`docSys.ini` 与 `WEB-INF/classes` 副本同步（`\=`/`\:` 转义正确）
- 测试连接：`/agent/config/llm-models/test` 拿到 deepseek 真实回包
- 边界：空列表 → `getAiModelList.do` 返回「系统未设置AI模型」；非法协议头 / 重名 / 含 `;` `|` → 后端返回明确错误
- UI：中/英页面渲染正常；行内 3 按钮一行、间距 11px
- 验证结束后已把配置**还原**为原来的 2 个模型（同名、同序、同 key）

### 8.5 踩坑（详见工作卡）

- 全量保存时的**自比较**误判重名（`validateSystemLlmModel(model, selfIndex)` 修复）
- Tomcat 重启后 session 失效 → 接口 `NOT_LOGGED_IN`，但前端弹的是**上一个未关闭**的弹窗 → 曾误判「空列表保存无效」
- slf4j 只进控制台（`docsys_console.log`），`com.DocSystem.common.Log` 才进 `docsys.log`
