# DocSys 项目规则

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效约束）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：`DevAgentControl/CURRENT_STATE_AI接入设置.md`（AI接入设置改为多模型列表，2026-10-03 建立，**已实施 + 已 E2E 验证，待用户确认提交**）。工作卡是**当前任务**相关信息的唯一定义处：必读上下文、参考计划与上下文、当前进展、生效约束（含是否需要先提交）。
   - 该卡为**待提交**：①「智能体设置 → AI接入设置」（`tmpl/systemLlm{,_en}.html`）由「一条 `||` 长串」改为**多模型列表 UI**（模型名称[含▲▼排序/默认徽标]、接口地址·模型标识·API Key 掩码、启用复选、测试/编辑/删除；新增/编辑用对话框 `systemLlmModelEdit{,_en}.html` + `systemLlmModelEdit.js`）；② 结构化配置存 **`agent_config(scope=global, key=llm_models)`**（与同组「提示词管理」同表），**JSON 权威 + 渲染成老格式串写 `docSys.ini`/classes 作运行期镜像**（保存即生效、启动时 `docSysInit` 用 JSON 覆盖）；首跑用现有串**自动播种**；③ 新增 `src/com/DocSystem/agent/config/AgentLlmConfigStore.java` + `BaseFunction.getLLMConfigString()/applyLLMConfigMirror()` + `GET/POST /agent/config/llm-models`、`POST /agent/config/llm-models/test`（单模型测试，密钥按 id 取已保存的）；④「默认模型 = 排到第一位」「停用不参与运行期」「高级参数（temperature/maxTokens/自定义 kv 透传进配置串）」均按裁定实现；⑤ 所有消费方（`getAiModelList.do`/`AIChat.do`/`/agent/models/list`/`LlmConfigSyncService`）仍读同一个 `BaseFunction.systemLLMConfig` → **零改动**。留意 `setSystemInfo.do` 的坑（本页已不走该接口）：**jQuery 会把 undefined 提交成空串（不是 null），空串 ≠ 「不改」** → 其他系统参数页必须按页白名单只提自己负责的字段（复用 `postSystemInfo()`）。改 `.html` 模板后务必做一次渲染/编译自检。
   - 该卡**遗留（待裁定）**：移动版导航（`#navMobile`）选中高亮；调试日志「下载」500；Agent 侧「每用户自定义模型」是否与系统级列表统一；高级参数后端 `LLMService` 尚未消费。
   - 前卡 `CURRENT_STATE_日志在线查看.md` **已收尾**（日志在线查看 + 调试日志搬移/布局/拆页/菜单优化/10 页 UI 打磨；已提交 `1ccaa57ee`、`a7012b16f`、`d01307d8c`、`b95a0a19c`、`11b1a83f9`、`f8727cd03`、`d6b7eff85`、`548b6da49`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_用户使用统计修复.md` **已收尾**（用户维度统计 + 会话推断时长 + 活动上报；已提交主仓库 `677952484`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_文件分享通知异步化.md` **已收尾**（通知邮件异步化：`addDocShare.do` 响应 6000ms→805ms、弹窗内容 6553ms→857ms；已提交 websocket 仓库 `edb88511` / 主仓库 `bcca467c4`），已移入 `DevAgentControl/已完成/`。
   - 挂起卡 `CURRENT_STATE_agent工具技能规模化.md`（同在 `DevAgentControl/`）：P0 调研+方案已完成并提交 `6fbb9e7fd`，**实施等用户裁定** → 未获裁定前不要开工改代码。
   - 前卡 `CURRENT_STATE_agent产物链接.md` **已收尾**（产物链接 + 多选 @ + 「清空」防误操作，三项均验证并已提交），保留供查询。
   - 前卡 `CURRENT_STATE_agentOffice读写选型.md` **已收尾**（P1 读 / P2 新建 / P2 修改全部完成并验证），保留供查询。
   - 更早的卡 `CURRENT_STATE_agent任务续接与轮数上限.md` **已收尾**（P4 挂起），保留供查询。
2. **按工作卡续接**：读工作卡里列出的必读上下文与计划/上下文文档的续接锚点（不必全文重读）。
3. 以上完成后才开工。

### ★ 工作卡更新时机：里程碑驱动（不是压缩驱动）

**模型侧观察不到"即将压缩"**（无上下文余量指标、无预警信号），所以「压缩前抢救一次」的约定等于永不触发。改为**里程碑驱动**：出现下列任一事件，**立即**更新当前工作卡，不攒批、不等收尾。

- 定位到根因（写清根因 + 证据位置）
- 得到验证结果（PASS/FAIL 数字、realDiff、字节差等具体值）
- 一个子项结论**成立或被推翻**（被推翻时必须删改原结论，不留过期描述）
- 用户给出裁定 / 纠正 / 确认
- 提交代码（记 commit 号与归属仓库）
- 开始新子任务或切换子项

更新落到工作卡的「当前进展」「下一步」「未提交改动」三处。这样卡永远最多落后一个里程碑——压缩何时发生、压缩是否失败、是否换新会话，都能从卡无损续接。

**如实性要求**：卡里的状态描述必须与实际完成范围一致。完成子项 1 不得写成"该缺陷已修复"；未验证的不得写"已验证"；FAIL 要写明数字和归因。宁可写"未完成/未验证"，不可夸大——下个会话会把卡当事实续接。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共三条提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket`；office 相关对它 clean，根目录 `git commit` 是空操作。
- **业务/WebSocket 层 `src/com/DocSystem/websocket`（独立仓库，`master`）**：`BussinessController.java`、`BusinessBaseController.java`、`BussinessBase.java`、`OfficeController.java` 等（**不属于**主仓库，改动要单独提交；该仓库未跟踪 `office/`）。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`。此处只描述结构；**是否开工前先提交、提交哪些，由工作卡决定**。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。

## 测试 scratch 输出目录（不变量，务必遵守）

测试运行产物（诊断输出、临时 bin/docx/xml、对比中间物）**一律写到 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`**（office/test 仓库 `.gitignore` 已忽略该目录）。**绝不写工程根 `tmp/`、`tmp_xxx/`**——这是绝大多数已跟踪测试的既定约定。

- 正式 fixture（需版本控制的测试输入）不适用本条：进 `src/com/DocSystem/websocket/office/test/测试文件/`，**不能**放任何 `tmp/`（tmp 被 gitignore，而 fixture 必须被跟踪）。
- **一旦在工程根发现 `tmp` 相关路径（`tmp/`、`tmp_*`、`tmp_test_output.txt` 等）**：立即提醒用户，并回查是哪个测试把 `OUT`/输出路径写成了工程根相对路径（应改成 `src/com/DocSystem/websocket/office/test/tmp/...`）。先例：`TestS3Diag.java:18` 曾把 `OUT="tmp/TestS3Diag/"` 吐到工程根，2026-09-09 已改回 office/test/tmp。
