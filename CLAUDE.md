# DocSys 项目规则

## 工作卡模式（默认关闭 · 条件触发）

**默认：不启用。** 常规任务（问答、读代码、单点小改动、跑一次测试、写一份文档）直接开工，**不读卡、不建卡、不额外维护进度**；本文件不对这类任务提任何恢复或更新要求。

**启用条件**（同时满足才启用；任一不满足 → 不启用）：

- 预计跨多轮 / 跨会话，上下文压缩后仍需无损续接
- 有多个子项，且每项都要独立验证（编译 / 测试 / realDiff / 字节差等具体值）
- 存在方案取舍或用户裁定点，结论需长期沉淀
- 期间会有多次提交，commit 需与任务绑定

**唯一开关 = 工程根目录是否存在 `CURRENT_STATE_*.md`**。根目录没有卡 = 模式关闭：`DevAgentControl/` 下的卡与 `已完成/` 全是档案，**不构成本会话任务，不要读、不要续接**。

**启用 / 停止**：

- 启用：把 `DevAgentControl/CURRENT_STATE_xxx.md` 移到工程根目录，或直接在根目录新建（模板见协议文档）。
- 启用后**立即**读 `DevAgentControl/会话恢复协议.md`（会话恢复步骤、里程碑驱动的更新时机、如实性要求、卡片模板都在那里），并按卡内容续接；当前任务信息（必读上下文、参考计划与上下文、当前进展、生效约束、是否先提交）**一律以根目录那张卡为准**。
- 停止：收尾后把卡移入 `DevAgentControl/已完成/`，根目录清空 → 模式自动关闭。

**没有根目录工作卡时，不执行协议中的任何步骤；也不要因为本文件提到「工作卡」就主动建卡。**

目录分工：`DevAgentControl/*.md` = 常驻档案卡；`DevAgentControl/已完成/` = 已收尾卡；`DevAgentControl/会话恢复协议.md` = 仅模式开启时才读的完整协议。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共三条提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket`；office 相关对它 clean，根目录 `git commit` 是空操作。
- **业务/WebSocket 层 `src/com/DocSystem/websocket`（独立仓库，`master`）**：`BussinessController.java`、`BusinessBaseController.java`、`BussinessBase.java`、`OfficeController.java` 等（**不属于**主仓库，改动要单独提交；该仓库未跟踪 `office/`）。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`。此处只描述结构；**是否开工前先提交、提交哪些，仅在「工作卡模式」启用时由根目录工作卡决定**，否则按常规判断。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。

## 测试 scratch 输出目录（不变量，务必遵守）

测试运行产物（诊断输出、临时 bin/docx/xml、对比中间物）**一律写到 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`**（office/test 仓库 `.gitignore` 已忽略该目录）。**绝不写工程根 `tmp/`、`tmp_xxx/`**——这是绝大多数已跟踪测试的既定约定。

- 正式 fixture（需版本控制的测试输入）不适用本条：进 `src/com/DocSystem/websocket/office/test/测试文件/`，**不能**放任何 `tmp/`（tmp 被 gitignore，而 fixture 必须被跟踪）。
- **一旦在工程根发现 `tmp` 相关路径（`tmp/`、`tmp_*`、`tmp_test_output.txt` 等）**：立即提醒用户，并回查是哪个测试把 `OUT`/输出路径写成了工程根相对路径（应改成 `src/com/DocSystem/websocket/office/test/tmp/...`）。先例：`TestS3Diag.java:18` 曾把 `OUT="tmp/TestS3Diag/"` 吐到工程根，2026-09-09 已改回 office/test/tmp。
