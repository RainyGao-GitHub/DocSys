# CURRENT_STATE_新建文件目录树不显示（工作卡）

建立于 2026-10-23。**状态：修复已实施并通过 E2E 回归（7 项全过），改动未提交，等用户验收/确认提交。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 当前进展 / 下一步 / 生效约束。

## 任务（用户原报告，2026-10-23）

**新建文件或目录成功时，有时候不会出现在目录树里。** 用户判断"应该是 project 页面的前端代码逻辑有点问题"，要求先分析根因。

- 复现环境：dev Tomcat 8100，仓库页 project.html。
- 关键词：**"有时候"** —— 已证实为竞态（时序窗口）+ 一个无时序要求的丢弃分支，非功能缺失。

## ★ 根因（已实证，2026-10-23）

**一句话**：新建成功回调执行时，若目标父目录的**首次展开异步请求（getSubDocList.do）尚在途**，新节点在前端被跳过/丢弃；而在途请求的后台查询发生在新建落库**之前**，响应不含新节点；响应落地后 `zAsync=true`，之后折叠/展开不再发请求 → **新节点在树上永久丢失，直到刷新页面**（后端数据一直完好）。

丢弃分支共三个（前两个有竞态，第三个无时序要求）：

- **变体 A（竞态）**：在途时 `parentNode.open == false`（zTree 在响应落地后才置 open）→
  `addTreeNode()` 原 project.js:2831 **提前 return**。console 特征：`parentNode is null or not exists`。
- **变体 B（竞态，双击展开开关触发）**：在途期间再次点展开 → `open=true` 但 children 空 → `addTreeNode` 通过 open 检查
  （日志 `parentNode is open`）→ `treeObj.addNodes()` → zTree 公开 `addNodes` 发现 `canAsync==true` 转走 `asyncNode`，
  而 `asyncNode` 见 `isAjaxing==true` **直接 return false 且不执行 addCallback**（jquery.ztree.core.js:990-991 + 1714-1715）
  → 节点被**静默丢弃**。
- **P0（无时序要求，展开过又折叠的目录必现）**：父目录已加载（`zAsync=true`）但当前折叠 → 原代码同样 `open==false` 提前 return；
  而折叠→再展开**不会重新拉取**（zAsync=true 短路）→ 新节点不显示直到 F5。（实施时发现的第三分支，回归已覆盖。）

**为什么"有时候"**：变体 A/B 需要新建回调落在展开请求在途窗口内（大目录/服务器忙/远程存储时窗口可达秒级）；P0 则是
"目录展开过又折叠后在里面新建"即必现。

关键代码事实（勿重复查证）：
- zTree `addNodesData` 是 **concat 追加**（:383-407），异步响应不会冲掉已添加的子节点——原"整批替换"假设不成立。
- 首次展开期间 `open` 保持 false（`switchNode` :1629 只发 asyncNode，open 在响应处理的 expandCollapseParentNode 才置 true）。
- 从未加载的目录节点 `zAsync === false`（_initNode :306），异步加载成功后置 true（:1048）。
- 后端 `getSubDocList.do` 每次实时 `dir.listFiles()`（ReposController:2293 → BaseController:891），无缓存 ⇒ 后端读不到的假设排除。

## 修复（2026-10-23 已实施，用户裁定采用"挂起-补加"方案，否决 reAsyncChildNodes refresh——同步风险大）

改动仅 `WebRoot/web/project.js`（前端单文件）：

1. **新增挂起队列 + flush 函数**（addTreeNode 前）：
   `var pendingAddTreeNodes = [];` + `flushPendingAddTreeNodes(treeNode)`——遍历队列，把 `node.pid == treeNode.id`
   的项取出并重调 `addTreeNode()`。
2. **`addTreeNode()` 父节点分支改造**（原"null 或 open==false 就 return"拆为三分支）：
   - 父节点不在树中 → 保持 return（其上层展开后，父节点首次展开会拉到新节点）；
   - **`parentNode.isAjaxing == true`（在途）→ 挂入 pendingAddTreeNodes 后 return**（同时绕开变体 A 的提前 return 与变体 B 的 zTree 内部丢弃）；
   - 父节点从未加载（`zAsync != true` 且无 children）→ 保持 return（首次展开时从后台拉取，必含新节点）；
   - 其余（根节点 / 已加载父目录，**无论展开还是折叠**）→ 直接到本地 addNodes（查重命中则跳过并打日志）
     ——顺带修复 P0：折叠已加载目录中新建不再丢失，且 addNodes 会让该目录自动展开显示新文件（zTree 内置行为）。
3. **`zTreeOnAsyncSuccess` 挂钩**：异步加载完成后调 `flushPendingAddTreeNodes(treeNode)` 补加。

覆盖面：`addTreeNode` 是全局唯一实现，addDoc.js（新建文件/目录/URL新建）、DocUpload.js（上传）、DocCopy/DocMove/renameConfirm
等所有调用方自动受益，无需逐一修改。

## 验证（2026-10-23，dev Tomcat 8100 真实页面，全部 PASS）

发布：`Docs\scripts\PublishDev.bat`（仅前端，无需重启）。**注意缓存**：页面引用 `project.js` 无版本参数，浏览器可能用旧缓存
（本次实测即撞上），验证前需强刷（`fetch(url,{cache:'reload'})` + 整页 reload，或 Ctrl+F5）。

回归场景（临时仓库 RaceTest2026 vid=23，测试后已删）：
1. **变体 A**（展开在途+open=false，shim 1.5s 延迟展开响应）：新建 raceFileA2.txt → console `pend the node` → 响应落地
   `flushPendingAddTreeNodes` → `add the node` → 树中出现，单实例 ✓
2. **变体 B**（在途+双击展开 open=true）：raceFileB2.txt → 同上，出现且单实例 ✓
3. **P0 折叠已加载**（无 shim，自然时序）：P1 展开→折叠→新建 raceC.txt → 直接补加，目录自动展开，单实例 ✓（旧代码此处必丢）
4. **正常路径**：父目录展开已加载 → 新建 raceD.txt 立即出现 ✓
5. **未加载父目录**：新建 P2 → 其中新建 raceE.txt → 跳过（符合设计）；展开 P2 后出现 ✓
6. **查重防重**：重复调用 addTreeNode → `already exists, skip`，单实例；flush 撞上"响应已含新节点"（raceF 手动挂起后展开）
   → 查重跳过，单实例，队列清空 ✓
7. **真实 UI**：工具栏 →+新文档→新建文件→输入 raceUI.txt→确定 → 立即出现在树根层级 ✓

最终树 DOM 含全部 10 个测试文件；截图已留档（会话 artifacts）。

附带发现（**未处理，需用户裁定是否另行立项**）：
- **后端瞬时失败**：刚创建目录后立即在其中建文件，`addDoc.do` 偶发返回 fail（重试即成功，本次 P1/seed1 两次复现）。
  与树 Bug 无关（该场景前端会弹"新建失败"），疑似后端目录落盘/同步时序问题。
- 浏览器缓存旧 project.js 会让"改了没生效"看起来像没修复——若将来给 js 加版本参数（缓存破坏）可一并考虑（参考
  `CURRENT_STATE_前端静态资源缓存.md` 挂起卡）。

## 必读上下文（续接锚点）

- `WebRoot/web/project.js:2807-2829`（pendingAddTreeNodes + flushPendingAddTreeNodes）、`2831-2913`（改造后 addTreeNode）、
  `2420-2427`（zTreeOnAsyncSuccess 挂钩）
- 调用方（自动覆盖）：`WebRoot/web/addDoc.js:115/177`、`project.js uploadSuccessCallback`、`js/DocUpload.js`、`js/DocCopy.js`、
  `js/DocMove.js`、`renameConfirm.js`
- zTree 机制：`static/zTree/js/jquery.ztree.core.js` `:829`（canAsync）、`:985-1070`（asyncNode isAjaxing）、`:1693-1720`（公开 addNodes）、
  `:383`（concat）、`:306/1048`（zAsync 置位）

## 当前进展（如实）

- ✅ 2026-10-23（会话1）：链路测绘 + 假设。
- ✅ 2026-10-23（会话2）：zTree/后端取证，E2E 复现变体 A/B，根因定案。
- ✅ 2026-10-23（会话3）：用户裁定方案（挂起-补加，否决 refresh）；实施 project.js 改动（单文件，+55/-21 行级别）；
  `node --check` 语法通过；publish 发布成功；**E2E 回归 7 场景全 PASS**；测试仓库/磁盘已清理。
- ⚠️ 未提交（等用户确认）。工作区改动：`WebRoot/web/project.js`（1 个文件）。

## 下一步

1. 用户验收（可自行在 dev 8100 任意仓库实测：折叠目录里新建、展开中快速新建等）。
2. 确认后提交（提交信息建议：`【BugFix】新建文件或目录后目录树有时不显示——异步加载在途时挂起补加`）。
3. 提交后本卡移入 `DevAgentControl/已完成/`。

## 生效约束

- **所有改动必须实测**（已做：真实页面 7 场景回归）。
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认（当前正处于此状态）。
- 编译约束本次不涉及（纯前端）。E2E 登录口径：`POST /DocSystem/User/login.do`（Admin / pwd base64）。
- dev Tomcat 8100 全程未重启（前端改动无需重启）。
