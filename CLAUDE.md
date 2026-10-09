# DocSys 项目规则

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效约束）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：当前任务 = **用户在本会话明确指定的那张** `DevAgentControl/CURRENT_STATE_*.md`（未指定时：先列出 `DevAgentControl/` 下**未归档**的卡问用户做哪张，**不要自己挑一张开工**）。工作卡是**当前任务**相关信息的唯一定义处：必读上下文、参考计划与上下文、当前进展、生效约束（含是否需要先提交）。
   - **本文件只写「当前任务」与通用规则**：已收尾卡（已移入 `DevAgentControl/已完成/`）、暂停卡、挂起卡**一律不在本文件描述** —— 进展/裁定留在卡自己里；要续做时**由用户手动改本文件或明确通知**。
   - 除用户本次指定的那张外，`DevAgentControl/` 里其余未归档卡 = **挂起 / 暂停**，**未获用户明确裁定前不要动代码**。
   - 卡的生命周期：**收尾即归档**（任务结束 → 移入 `已完成/` 并提交），因此本文件不随任务收尾而增删。
2. **按工作卡续接**：读工作卡里列出的必读上下文与计划/上下文文档的续接锚点（不必全文重读）。
3. 以上完成后才开工。
4. **参数存储策略与参数清单（动任何「参数/配置」相关功能前必读）**：`devDocs/参数存储策略与参数清单.md` —— ① 存储策略：三个存储位置（`jdbc.properties` 框架层、须重启；`docSysConfig.properties` 业务参数、可立即生效；数据库 `system_setting` / `agent_config` 存复杂结构）**为什么这么设计** + 5 条硬性约束（per-node 参数不得入库、不得直接改 classes、复杂结构别塞 properties、启动期静态读取的键不得宣称保存即生效、同类参数用同一种处理方式）；② 参数清单 + **同类参数处理方式不一致的 6 处**（`ldapConfig`/`llmConfig` 双轨、`mail.*`/`sms.*` 旧键仅首跑播种、三种生效时机并存、日志配置在 ini 目录独立文件、键名别名/大小写、checksum 自动同步只覆盖两个文件）。2026-10-06 建立（起因：改 LDAP 配置时差点忘了存储与工作机制）。

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

## 当前任务

- **仓库列表页（projects）搜索优化**：工作卡 `DevAgentControl/CURRENT_STATE_projects搜索优化.md`，方案 `devDocs/仓库列表搜索优化方案.md`。
  状态：调研 + 方案已完成，已裁定 3 项（默认搜全仓 / 不跳过仓库 / 不排除源码目录），**仍待裁定 2 项**（P2-3 是否流式、热循环日志选项）→ **未获裁定前不得开工改代码**。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共**五条**提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket` **和 `WebRoot/WEB-INF/lib`**；office 相关对它 clean，根目录 `git commit` 是空操作。
- **销售模块 `src/com/DocSystem/sales/`（独立仓库，`master`）**：`SalesBase.java`/`SalesController.java`/`PayController.java` 等（**不属于**主仓库——`git ls-files` 对该路径报 `did not match any file(s)`，改动要单独提交）。
- **业务/WebSocket 层 `src/com/DocSystem/websocket`（独立仓库，`master`）**：`BussinessController.java`、`BusinessBaseController.java`、`BussinessBase.java`、`OfficeController.java` 等（**不属于**主仓库，改动要单独提交；该仓库未跟踪 `office/`）。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。
- **`WebRoot/WEB-INF/lib`（独立仓库，`master`）**：第三方 jar 存放处（约 250 个）。**主仓库 `.gitignore` 已忽略整个目录**，所以在这里增删 jar 必须 `git -C WebRoot/WEB-INF/lib` 单独提交。该仓库**没有 `.gitignore`**。
  - ⚠️ **`mxsdoc.jar` 在本仓库里是"待删除"状态**：它的真实代码是 `src/com/DocSystem/websocket` 下的源码（该部分**不开源**，对外以 jar 形式提供）。**开发环境下有源码，所以必须删掉这个 jar**，否则运行期两个来源冲突会出错。**因此 `git status` 看到 `D mxsdoc.jar` 是正常的，不要去"恢复"它，也不要提交它**（等打包/发布流程处理）。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`；jar → `git -C WebRoot/WEB-INF/lib`。此处只描述结构；**是否开工前先提交、提交哪些，由工作卡决定**。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。

## 测试 scratch 输出目录（不变量，务必遵守）

测试运行产物（诊断输出、临时 bin/docx/xml、对比中间物）**一律写到 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`**（office/test 仓库 `.gitignore` 已忽略该目录）。**绝不写工程根 `tmp/`、`tmp_xxx/`**——这是绝大多数已跟踪测试的既定约定。

- 正式 fixture（需版本控制的测试输入）不适用本条：进 `src/com/DocSystem/websocket/office/test/测试文件/`，**不能**放任何 `tmp/`（tmp 被 gitignore，而 fixture 必须被跟踪）。
- **一旦在工程根发现 `tmp` 相关路径（`tmp/`、`tmp_*`、`tmp_test_output.txt` 等）**：立即提醒用户，并回查是哪个测试把 `OUT`/输出路径写成了工程根相对路径（应改成 `src/com/DocSystem/websocket/office/test/tmp/...`）。先例：`TestS3Diag.java:18` 曾把 `OUT="tmp/TestS3Diag/"` 吐到工程根，2026-09-09 已改回 office/test/tmp。
