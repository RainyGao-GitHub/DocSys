# CURRENT_STATE_AI接入设置（工作卡）

> 状态：**已实施 + 已 E2E 验证，待用户确认提交**（2026-10-03）
> 方案文档：`devDocs/Agent大模型接入设置改造方案.md`
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_日志在线查看.md`（已收尾归档；其「待用户裁定」的遗留项见本卡「遗留」）

## 任务

「智能体设置 → AI接入设置」原来的配置方式是**一条长字符串**
（`url; apikey=..; name=..; modelName=..` 用 `||` 分隔多个模型），对管理员要求过高。
改为**主流 Agent 式的多模型列表 UI**，并把结构化配置存到 agent 侧的配置表。

## 用户裁定（2026-10-03）

1. 存储选 **B：`agent_config`（`scope=global, key=llm_models`，JSON 数组）**
2. 「默认模型」用**排到第一位**表达（后端零改动，沿用 `LlmConfigSyncService` 取第 0 条的既有语义）
3. 一期**需要**高级参数（temperature / maxTokens / 自定义 kv → 存每条模型的 `settings`）
4. **接受**「JSON 权威 + ini 镜像」口径（手工改 ini 的 `llmConfig` 会在下次保存/重启时被覆盖）
5. **需要**单个模型「停用/启用」开关（停用项留在后台、不参与运行期）
6. UI 微调（第 1 轮）：① 操作按钮**之间要有间隙**；② 表格**下方的说明文字不要**
7. UI 微调（第 2 轮）：「模型名称」列**只显示名称**（不要「默认」徽标）、**不要上下移动按键** → 改用**「置顶」**调整顺序
8. UI 微调（第 3 轮）：操作区**按键不要横向摆放**（横向空间不够）→ 改为**纵向排列**
9. UI 微调（第 4 轮）：**已保存的 API Key 直接显示明文**（便于管理员核对原值；暂不考虑泄露）
10. UI 微调（第 4 轮）：去掉「清除已保存的密钥」（看不懂/不需要）—— 改为直接改输入框即可
11. UI 微调（第 4 轮）：去掉「停用后不参与运行期」提示信息（列表与对话框两处）
12. UI 微调（第 4 轮）：高级参数改为**勾选「使用高级参数」后才展示与生效**（未勾选 = 清空 settings，不再写入运行期串）
13. UI 微调（第 5 轮）：对话框里「启用」字段移到「高级参数」**之后**
14. UI 微调（第 6 轮）：对话框里「状态」标题与其它参数标题**不对齐**（根因：主题 `.control-label` 是**固定 90px + 右对齐**，长标签（48px）左端落在 132，而「状态」只有 24px 宽 → 左端被推到 **156**，看起来缩进）
    → 该对话框的标签统一左对齐（`.systemLlmModelForm .control-label{text-align:left}`，保留 15px 左内边距）

## 存储与运行期设计（关键结论）

| 角色 | 位置 | 说明 |
| --- | --- | --- |
| **权威源** | `agent_config(scope='global', key='llm_models')` | JSON 数组：`{id, name, modelName, endpoint, apiKey, enabled, settings}`；与同组「提示词管理」（`system_prompt_override/suffix`）同表同服务（`AgentConfigService`） |
| 运行期镜像 | `docSys.ini/docSysConfig.properties` + `WEB-INF/classes/docSysConfig.properties` 的 `llmConfig` | 由 JSON **渲染**出的老格式串；两边都写（避免 `getLLMConfig()` 显示滞后） |
| 运行期内存 | `BaseFunction.systemLLMConfig` | 保存后立即 `applySystemLLMConfig()` 覆盖 → **不重启即生效**；启动时 `docSysInit` 成功后由 `AgentInitService` 用 JSON 再覆盖一次 |
| 首跑迁移 | `AgentLlmConfigStore.load()` | `agent_config` 无该键 → 用当前运行期串解析后**播种**落盘（管理员零操作） |

- **渲染规则**：只输出**启用**的模型，顺序即优先级；`<endpoint>; name=..; modelName=..; apikey=..;<高级参数 kv>` 用 ` || ` 连接
  ⇒ 必须能被 `LLMUtil.parseLLMConfig()` 解析（url 在第 1 段）⇒ `getAiModelList.do` / `AIChat.do` / `/agent/models/list` / `LlmConfigSyncService` **全部零改动**。
- **空列表**：渲染出空串 → `systemLLMConfig = null` → AI 视为未配置（`getAiModelList.do` 返回「系统未设置AI模型」）。
- **apiKey**：明文入库（与改造前一致）；**接口也回明文**（用户裁定：便于核对原值，暂不考虑泄露）；已去掉掩码回传与「清除已保存的密钥」（`clearApiKey` 字段与 `fillApiKeyFromStored()` 一并弃用，对话框直接回填原值、改动即生效）

## 实施清单（已改文件）

**后端（已编译进 `WebRoot/WEB-INF/classes`）**

- 新增 `src/com/DocSystem/agent/config/AgentLlmConfigStore.java`
  `load()`（含播种）/ `save()` / `applyToRuntime()` / `toLegacyString()` / `fromLegacyString()` / `validate()` / `normalize()` / `maskApiKey()`
- 新增 `BaseFunction.getLLMConfigString()` + `BaseFunction.applyLLMConfigMirror(String)`
  （`BaseFunction.java`；镜像落盘 + 内存立即生效；空串 → `systemLLMConfig = null`）
- `AgentController`：新增 `GET/POST /agent/config/llm-models`（仅系统管理员；返回掩码 + 渲染串）、`POST /agent/config/llm-models/test`（单模型测试，apiKey 缺省按 id 取已保存的）
- `AgentInitService.initAfterDocSysReady()`：在 LLM 同步**之前**插一步 `agentLlmConfigStore.applyToRuntime()`（未配置则不动，保持 ini 引导值）

**前端（无需编译）**

- `WebRoot/manager/main.js`：整段替换旧的 `showSystemLlm/enableSystemLlmSet/cancelSystemLlmSet/saveSystemLlmSet`（`SYSTEM_LLM_FIELDS` 删除），新增
  `loadSystemLlmModels / renderSystemLlmView / isSystemLlmDirty / updateSystemLlmButtons / validateSystemLlmModel(model,selfIndex) / add|edit|delete|toggle|move SystemLlmModel / showSystemLlmModelEditPanel / applySystemLlmModelEditResult / cancelSystemLlmSet / saveSystemLlmSet / sendSystemLlmModelTest / testSystemLlmModel / testSystemLlmModelObj`；
  旧 `llmTest()`（`Manage/llmTest.do` 长串版）删除
- `WebRoot/manager/tmpl/systemLlm{,_en}.html`：列表页（4 列：模型名称[含▲▼+默认徽标] / 接口地址·模型标识·API Key / 状态[启用复选] / 操作[测试·编辑·删除]）
- 新增对话框 `WebRoot/manager/systemLlmModelEdit{,_en}.html` + `WebRoot/manager/systemLlmModelEdit.js`
  （名称/接口地址/模型标识/API Key+清除/状态/高级参数 temperature·maxTokens·自定义 kv；`测试连接` 用当前表单值试发）
- `WebRoot/manager/static/style/style.css`：表格行内按钮间距 + AI接入设置行内按钮紧凑
- `WebRoot/web/lang/en.js`：补 24 条英文词条（新增 UI 文案）

## 验证（dev 8100，admin，2026-10-03）

- **迁移**：首跑自动播种 —— 日志 `AgentLlmConfigStore 已从运行期配置串播种 2 个模型到 agent_config`；页面直接列出原有 2 个 deepseek 模型（`seed1/seed2`，掩码正确）
- **不重启即生效**：保存后 `getAiModelList.do` / `/agent/models/list`（`sys:0/sys:1`、`defaultSelector=sys:0`）随之变化；停用第 2 个模型后立刻只剩 1 个，恢复后又回到 2 个
- **JSON 权威**：先用 `Manage/setSystemInfo.do` 把 ini 的 `llmConfig` 改成 `BOGUS-MODEL`（内存/ini 都变），**重启后**运行期恢复为 2 个真实模型、ini 被重写回真实串（日志：`已用 agent_config.llm_models 覆盖运行期配置`）
- **落盘镜像**：保存后 `docSys.ini` 与 `classes` 副本同步更新（`\=`/`\:` 转义正确）；高级参数 `temperature=0.7; top_p=0.9` 正确进入运行期串，清除后也正确移除
- **测试连接**：单模型测试走 `/agent/config/llm-models/test` → deepseek 真实回包（证明「按 id 取已保存密钥」可用）；列表行「测试」同样通过
- **边界**：空列表 → `success` + `legacy=""` + `getAiModelList.do` 返回「系统未设置AI模型」；非法协议头 / 重名 / 含 `;` `|` 的配置值 → 后端均返回明确中文错误
- **UI**：中/英页面渲染正常（`AI Access` / `Name·Endpoint·Model·API Key·Status·Actions`）；行内 3 个按钮一行、间距 11px（改前会竖排）；表格下方说明文字已移除；「保存/取消」仅在有改动时启用
- **UI 终版布局**（3 轮反馈后）：4 列 = `模型名称`(150px，**纯名称**) / `接口地址·模型标识·API Key`(自适应 ~240px) / `状态`(76px，启用复选) / `操作`(76px，测试·编辑·置顶·删除**纵向排列**，间距 6px)；无横向溢出；表格下方无说明文字；「置顶」把该行移到第一位（第 1 行置灰）
- **第 4/5 轮反馈验收**：列表中间列显示 `modelName · <明文 Key>` ✅；`#systemLlmModelClearApiKey` 已不存在 ✅；状态列/对话框均无「停用后不参与运行期」提示 ✅；
  对话框字段顺序 = 模型名称 / 接口地址 / 模型标识 / API Key / **高级参数** / **状态** ✅；高级参数未勾选时块隐藏且 `collectSystemLlmModelSettings() == {}`、勾选后才能填并生效（`{"temperature":"0.5"}`）✅
- **第 6 轮（标签对齐）实测**：修复前 6 个标签 box 均 (left=105,w=90,右对齐)，文字左端 = 模型名称/接口地址/模型标识/高级参数 132、API Key 134、**状态 156**（差 24px）；
  修复后 6 个标签 `textAlign=left`、文字左端与输入框左边缘均 = **120**（完全对齐）✅
- **恢复原状**：验证结束后已把配置写回原来的 2 个模型（同名同序同 key），当前运行期 = 原状态

## 踩坑记录

- **自测抓到真 bug**：`saveSystemLlmSet` 逐行调用校验时用了「跳过正在编辑行」的旧逻辑 → 每行与**自己**比名字 → 全量保存被误判「模型名称已存在」。
  已改为 `validateSystemLlmModel(model, selfIndex)`（弹窗路径默认取 `gEditingSystemLlmIndex`，保存路径传行号）。
- **Tomcat 重启后 session 失效**：重启后继续用旧页面做 E2E → 接口返回 `NOT_LOGGED_IN`，前端弹的是**上一个**未关闭的提示弹窗 → 一度误判「空列表保存无效」。以后重启后必须先重新登录（或直接看接口原始响应）。
- **窄窗口布局（3 轮调整）**：6 列 + 6 个行内按钮在 ~540px 内容区会竖排/换行 → 最终定为 **4 列 + 操作按钮纵向排列**（`#systemLlmTable td .btn{display:block}` + `.btn + .btn{margin-top:6px}`）；中间列用 `word-break:break-all` 让列宽声明真正生效；`.btn + .btn` 全局统一补 8px 间隙
- slf4j 日志（本模块用的）**只进控制台** → detached 启动时看 `tomcat\logs\docsys_console.log`；`com.DocSystem.common.Log` 才写 `tomcat\logs\docsys.log`。

## 生效约束

- **编译口径**：`javac -encoding UTF-8 -parameters -g -implicit:none -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes <改动文件>`；`.class` 只进 `WebRoot/WEB-INF/classes`，源码树不得出现 `.class`
- **改 Java 后必须「先编译、再重启」**（`C:\TomcatForDocSysDev\docsys\docsys_restart.bat`，隐藏窗口启动，启动 2~10 分钟）；重启后 session 失效需重新登录
- **改模板必须做渲染自检**（本页为 artTemplate 列表渲染 + JS 动态填充）
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认
- `setSystemInfo.do` 的坑仍然有效：**新增/修改系统参数页必须按页白名单提交**（本页已不再走该接口，改为 `/agent/config/llm-models`）

## 未提交改动（基线 `1ccaa57ee` 之后）

- ` M src/com/DocSystem/common/BaseFunction.java`、` M src/com/DocSystem/agent/controller/AgentController.java`、` M src/com/DocSystem/agent/config/AgentInitService.java`
- `?? src/com/DocSystem/agent/config/AgentLlmConfigStore.java`
- ` M WebRoot/manager/main.js`、` M WebRoot/manager/static/style/style.css`、` M WebRoot/manager/tmpl/systemLlm{,_en}.html`、` M WebRoot/web/lang/en.js`
- `?? WebRoot/manager/systemLlmModelEdit{,_en}.html`、`?? WebRoot/manager/systemLlmModelEdit.js`
- `?? devDocs/Agent大模型接入设置改造方案.md`、`?? DevAgentControl/CURRENT_STATE_AI接入设置.md`（本卡）
- 另：`WebRoot/WEB-INF/classes/**` 被 gitignore，镜像写入不会污染工作区

## 遗留（待用户裁定，非本卡范围）

- 移动版导航（`#navMobile`）选中项无高亮 + 子项与顶级项同色，是否统一
- 「调试日志」页「下载」按钮 500 是否处理；`updateSystemInfo()` 死代码是否删
- Agent 侧「每用户自定义模型」（`user_custom_llm_models` + `/agent/models/custom`）与新的系统级模型列表是否要做成同一套 UI/口径
- 高级参数目前只是「原样透传进运行期配置串」，后端 `LLMService` 尚未消费 `temperature/maxTokens`（要生效需另行改造）

## 下一步

1. 等用户确认后提交本批（**不自动 commit**）
2. 如有 UI 反馈，继续按反馈微调（本页已按用户两轮反馈调整过布局）
