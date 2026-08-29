# DocSys 项目规则

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效约束）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：`CURRENT_STATE.md`。工作卡是**当前任务**相关信息的唯一定义处：必读上下文、参考计划与上下文、当前进展、生效约束（含是否需要先提交）。
2. **按工作卡续接**：读工作卡里列出的必读上下文与计划/上下文文档的续接锚点（不必全文重读）。
3. 以上完成后才开工。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共三条提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket`；office 相关对它 clean，根目录 `git commit` 是空操作。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`。此处只描述结构；**是否开工前先提交、提交哪些，由工作卡决定**。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。
