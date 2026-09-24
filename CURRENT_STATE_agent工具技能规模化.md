# CURRENT_STATE — Agent 工具与技能规模化（工作卡）

建立于 2026-09-24。**状态：进行中（P0 调研+方案已完成并提交 `6fbb9e7fd`，实施未开工，等用户裁定）。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划与上下文 / 当前进展 / 生效约束（含是否先提交）。
> **交付物是文档，不是代码** —— 下一会话若看到本卡，**不要自行开工改代码**，先问用户是否实施。

## 任务

Agent 工具与技能「规模过大」时的处理机制：现状会怎么爆、业界（Anthropic Tool Search / Skills 渐进披露）怎么做、
DocSys 该改什么。用户要求：**先调研 + 出方案成文，实现择期**。

## 必读上下文（续接锚点，不必全文重读）

- **`devDocs/Agent工具与技能规模化方案.md`**（本次交付物，实施前必读；含业界取证、现状体检、P1~P4 方案、验收标准、来源表）
  - 实施 P1 的代码锚点：`src/com/DocSystem/agent/skill/EnhancedSkillManager.java:207`（`getAllSkills()` 返回无序）、
    `src/com/DocSystem/agent/tool/DocSysToolFactory.java:1428`（`buildSkillListForPrompt()` 1500 字符硬截断）
  - 实施 P2/P3 的锚点：`MainAgent.java:714 buildToolLoop`（注册表每请求新建）、`ToolUseLoop.java:234 effectiveTools()`（原生 tools 无上限）、
    `ToolPromptBuilder.java:22/65-70`（文本通道 6000 字符截断）
- 既有相关护栏（改动时不得回归）：`TestToolOnboarding`、`TestToolRegistry`、`TestToolOutputContract`、
  `TestSearchCrossRepo`（含"13 个写工具 required 必含 vid"的锁）、`TestSkillExecEncoding`

## 当前进展（如实）

1. ✅ **业界核实完成**（本人执行）：`platform.claude.com` 官方文档页在本机网络区域被 302 到
   `app-unavailable-in-region`，**抓不到页级文档**；改从 Anthropic 官方 GitHub 组织取证
   （`anthropics/skills`、`anthropics/anthropic-sdk-python`、`anthropics/claude-cookbooks`、`anthropics/claude-code`），
   已拿到：tool search 两种变体与 `defer_loading` 语义原文、"不能全 defer（否则 400）"、**~10K token 阈值**、
   MCP `toolset` 分组开关、技能三层渐进披露（64/1024 字符、100 words、5k words 口径）。来源表见方案 §7。
2. ✅ **现状体检完成**（读代码，非推测）：事实见方案 §2（工具数按代码点算 **28 + run_skill + attachment = 30**；
   文本通道 6000 字符 `continue` 截断（`ToolPromptBuilder.java:65-70`）；技能 1500 字符 `break` 截断（`DocSysToolFactory.java:1436/1443`）
   + 数据源 `ConcurrentHashMap` 无序（`EnhancedSkillManager.java:207`））。
3. ✅ **自查时另抓到一条真问题（事实 14，本次新发现）**：技能入口文件查找名**大小写不一致** ——
   `EnhancedSkillManager.java:126` 找 `SKILL.md`，而 `SkillManager.java:203` / `ExternalSkillExecutor.java:158` 找 `skill.md`。
   Windows 下看不出来；**Linux 上**按 Anthropic 标准只放 `SKILL.md` 的外部技能会"清单里可见、执行报 No executor"。
   ⚠️ **未在 Linux 实测**（本次只核对代码），已列为方案 P1 的附带修 + 待验证项。
4. ⚠️ **未改任何代码**（本次为纯只读调研）。
5. ⚠️ **未跑测试**（无代码改动，故**无护栏数字**；不要引用旧基线当作本次证据）。
6. ✅ **已提交（2026-09-24，用户确认后提交）**：主仓库 `D:\Dev\DocSys`（`devInt`）commit **`6fbb9e7fd`**
   —— 3 文件 / +360 / -2（方案文档 + 本卡 + `CLAUDE.md` 指针）。

## 下一步

1. **等用户裁定**是否实施 P1（技能清单检索化 + 截断确定性）。**未获裁定前不得开工。**
2. 获裁定后，实施第一步是**先测三个基线**（方案 §6）：`buildSystemPrompt` 全量字符数、
   原生通道每轮 tools 数组长度、`buildSkillListForPrompt()` 当前长度。
   ⚠️ 未经实测不得声称"6000 预算已触顶"（方案 §2 事实 4 只写了机制，未实测）。
3. P1 的验收要求见方案 §4 P1（需**造 60 个假技能目录**做规模验收）。
   ⚠️ **未决问题**：假技能目录落点 —— 不可污染 `WebRoot/WEB-INF/skills/`（正式技能），
   运行期 store 是 `C:\DocSysReposes\skills`（`Path.getAgentSkillStorePath()`）；实施时先定落点。
4. P2/P3（工具场景子集化 / 元工具 `search_tools`）**建议在 P1 之后**，P4（子代理）**存疑不做**。

## 生效约束

- **开工前是否需要先提交**：不需要（本次只新增文档，未改代码）。
- 若实施：遵守 `CLAUDE.md` 两条不变量 —— 编译输出必须 `-d WebRoot/WEB-INF/classes`；
  测试 scratch 一律写 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`（**绝不写工程根 `tmp/`**）。
- 提交归属：`devDocs/` 与工作卡 → 主仓库 `D:\Dev\DocSys`（`devInt`）；
  若将来新增护栏测试类 → test 仓库 `src/com/DocSystem/websocket/office/test`。
- ⚠️ 文档类改动一律用编辑器工具，**不要用 PowerShell 读改写 md**（CRLF↔LF 会导致整文件 diff）。
- ⚠️ **本终端中文路径参数传不进 git**（2026-09-24 实测：`git add --dry-run "<中文路径>"` 无输出＝未匹配）
  → 提交一律用 **`git add -A`**（不带路径参数）；提交信息用 `[IO.File]::WriteAllText($p, $m, New-Object System.Text.UTF8Encoding($false))`
  写无 BOM 文件再 `git commit -F`（PS 5.1 的 `Out-File -Encoding UTF8` 会加 BOM）。
  提交后可用 `ReadAllText(p,[Text.Encoding]::UTF8)` 打印 `bytes/chars/first3/hasXXX` 这类数值布尔自查。

## 提交记录

- **`6fbb9e7fd`**（2026-09-24，主仓库 `D:\Dev\DocSys` / `devInt`）：方案文档 + 本卡 + `CLAUDE.md` 指针，3 文件 / +360 / -2。
  ⚠️ **未改任何代码**（纯调研）→ 未编译、未跑护栏，**无护栏数字**。
- 后续若继续提交本卡，延续既有做法：工作卡更新单独一个 `docs(card):` 提交并记下真实 hash。
