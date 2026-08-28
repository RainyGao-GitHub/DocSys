# DocSys 项目规则

## 必读上下文

执行任何与 MxsOffice / Office 编辑 / Office 转换相关的任务前，**必须先完整阅读**以下文件：

- [`src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`](src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md)

该文件包含 JDK 路径、编译命令、类路径、运行时目录等关键前提，未读直接操作会导致编译错误或路径错误。

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效原则）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：`src/com/DocSystem/websocket/office/devDocs/CURRENT_STATE.md`（小而新鲜，<40 行，含当前任务 / 参考计划与上下文路径 / 当前进展 / 生效原则）。
2. **按工作卡里的 references 再读** `devDocs/apply_changes-JS移植Java开发计划.md` 与 `docs/apply_changes-JS移植Java开发上下文.md` 的续接锚点（不必全文重读）。
3. **确认仓库状态**：DocSys 是**多 git 仓库**——主仓库 `D:/Dev/DocSys`（分支 `devInt`）`.gitignore` 排除整棵 `src/com/DocSystem/websocket`；office 核心代码是嵌套子仓库 `src/com/DocSystem/websocket/office`（分支 `dev/office`）；其 `test/` 又是**另一个独立 git 仓库** `src/com/DocSystem/websocket/office/test`（分支 `master`，含测试类与 fixture）。提交归属：office 核心代码/`docs`/`devDocs` 用 `git -C src/com/DocSystem/websocket/office ...`；测试类用 `git -C src/com/DocSystem/websocket/office/test ...`；在父仓库根目录 `git commit` 是空操作。先分别 `git -C .../office status` 与 `git -C .../office/test status` 确认 dirty，有则先提交再开工。
4. 以上完成后才开工。
