# Agent 技能免输入发送（总结/对比/整理 + 已@对象 → 可直接发送）

状态：**2026-10-30 用户验收通过并提交，任务收尾归档**｜改动仅前端 `WebRoot/web/agent/index.html`

## 需求（用户 2026-10-30）

现在不管选什么技能都要求输入消息才能发送；但**总结/对比/整理**这类技能，用户已经 @ 了具体对象时，
操作本身已完整表达意图——应允许**不输入消息直接发送**开始执行。用户判断只需前端改动。

## 调研结论

- 发送门槛在 `sendMessage()`：`content = messageSlotText().trim()` 为空 → return（无操作时静默、
  说明态时提示"请先写正文"）。发送按钮本身无 disabled 逻辑，Enter 与点击都走 sendMessage。
- "技能" = `state.operation`（/ 菜单选，OPERATION_CATALOG 六项：ask/summarize/generate_doc/
  organize/find/compare）；@ 对象 = `state.focus`；附件 = `state.attachments`。
- 请求体已带 `operation`/`focus`/`attachments`，但 **command 为空后端直接 400** → 前端必须补默认指令。

## 实施（6 处补丁，全部 agent/index.html）

1. `OPERATION_CATALOG`：summarize/organize/compare 加 `emptyPrompt`（'请总结这些资料'/
   '请整理归档这些对象'/'请对比这些对象'）；ask/generate_doc/find 不加（仍需用户输入）。
2. 新增辅助：`operationEmptyPrompt(id)`、`hasRoundMaterials()`（focus+attachments>0）、
   `autoPromptIfReady()`（操作+emptyPrompt+有资料 → 返回默认指令）、`messagePlaceholderText()`、
   `refreshMessagePlaceholder()`。
3. `sendMessage()` 空消息分支：先试 `autoPromptIfReady()`——命中则 content=默认指令继续发送；
   否则保持原行为（提示/静默 return）。⚠️ 补丁初版 `content=autoPrompt` 后仍会走到外层 return，
   已修正为 else 包裹（return 只在未命中路径）。
4. `applyFocusSlot()` 消息槽占位改用 `messagePlaceholderText()`。
5. `setOperation/clearOperation` 尾部 + `renderAttachBar()` 头部调 `refreshMessagePlaceholder()`
   （附件增删/上传/恢复唯一收口；说明态不动）——占位文案「XX」已就绪：直接点发送执行，或输入补充要求。
6. 版本链：agent/index.html 直开无引用方，部署后需刷新 agent 页。

## 实测（2026-10-30，dev，真实 UI 全流程）

- 总结资料 + @test.md + **输入框完全为空**点发送 → 气泡自动补「请总结这些资料」并开始执行（立即停止）✓
- 对比 + @测试仓库2（整库）+ 空输入 → 「请对比这些对象」直发 ✓；占位提示随条件出现/消失 ✓
- 无操作 + 空输入 → 仍无动作 ✓；问答 + 有对象 + 空输入 → 仍拦截 ✓（ask 无 emptyPrompt）
- 回归：正常输入发送链路未动；测试产生的几轮对话已立即 stop（会留在 dev agent 会话历史里）

## 遗留/说明

- organize（整理归档）机制与上两个同源（catalog 同一字段），未单独实测，留用户验收覆盖。
- 用户验收点：@ 对象 → / 选 总结资料/对比/整理 → 不输入直接点发送（或 Enter）。
