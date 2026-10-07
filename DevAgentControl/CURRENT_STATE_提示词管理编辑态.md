# CURRENT_STATE_提示词管理编辑态（工作卡）

> 状态：**已实施并验证（E2E 全通过），等用户确认提交**（2026-10-07）
> 建立：2026-10-07

## 需求（用户原话）

> 智能体设置 里 提示词管理 只有 保存按键，需要使用和 系统管理-系统设置 页面 的方式，用户需要先点 编辑 才能开始修改

## 现状（改动前）

- 路由：侧栏 `data-eb-params="prompt"` → `main.js` 的 `showAgentPage("prompt")` → `showPromptConfig()`
- 页面：`WebRoot/manager/tmpl/promptConfig{,_en}.html`，只有一个「保存」按钮；两个 textarea（`#promptSuffix` 附加提示词、`#promptOverride` 覆盖提示词）**默认就是可编辑**，另有只读的「默认提示词预览」
- 接口：GET/POST `/DocSystem/agent/config/system-prompt`（GET 返回 `data.suffix/override/defaultPrompt`）；POST 是 **JSON body**（`{override, suffix}`）
- 对照页「系统管理 → 系统设置」= `systemUpgrade.html`：表头三按钮 **编辑 / 保存 / 取消**，输入框默认 `disabled="disabled"`，由 main.js 的**通用助手** `setSystemPageEditMode(prefix, fieldIds, editing)` 统一切换（约定按钮 id：`btnEnable<prefix>Set` / `btnSave<prefix>Set` / `btnCancel<prefix>Set`）

## 实现（复用既有助手，不新增机制）

| 文件 | 改动 |
| --- | --- |
| `tmpl/promptConfig.html` / `promptConfig_en.html` | 表头改为三按钮：`btnEnablePromptConfigSet`（编辑/Edit）、`btnSavePromptConfigSet`（保存/Save，默认 `display:none`）、`btnCancelPromptConfigSet`（取消/Cancel，默认 `display:none`）；`#promptSuffix`、`#promptOverride` 加 `disabled="disabled"`（默认只读）；「默认提示词预览」保持 `readonly` 不动 |
| `main.js`（提示词管理段） | 新增 `PROMPT_CONFIG_FIELDS = ["promptSuffix","promptOverride"]`、`promptConfigData`（缓存已保存值，供取消还原）；`showPromptConfig()` 渲染前缓存 `ret.data`；新增 `enablePromptConfigSet()`（→ `setSystemPageEditMode("PromptConfig", …​, true)`）与 `cancelPromptConfigSet()`（还原值 + 退出编辑态）；`savePromptConfig()` 改为：先退出编辑态 → POST → 成功则 toast **并 `showPromptConfig()` 重新拉取渲染**（回到只读、显示已保存值）；**失败则留在编辑态**（不重渲染，避免丢掉已输入内容） |

设计取舍：与「系统设置」页唯一不同处是**保存失败时保留编辑态**（系统设置页是失败也重渲染）——避免用户输入丢失；如需完全一致可去掉那两行 `setSystemPageEditMode(..., true)`。

**无需编译/重启**（纯前端），改完硬刷新即可。

## 验证状态（2026-10-07 已完成）

- ✅ `node --check WebRoot/manager/main.js` → exit=0（首次提交时有个笔误 `showPromptConfig():` 已由该检查发现并修正）
- ✅ **页面 E2E 全通过**（dev 8100，重启后确认服务端已在提供新版模板）：

| 用例 | 结果 |
| --- | --- |
| 进入页面（默认） | `#promptSuffix`/`#promptOverride` `disabled=true`、只有「编辑」可见、「保存/取消」隐藏 ✅ |
| 点「编辑」 | 两个 textarea 可编辑 ✅、「编辑」隐藏、「保存/取消」出现 ✅ |
| 改动后「取消」 | 值**还原**为已保存值 + 回到只读态 ✅ |
| 改动后「保存」 | toast「提示词配置已保存，将于后续请求生效」✅ + 页面重渲染为只读态；`GET /agent/config/system-prompt` 返回 `[E2E mark] suffix`（**已落库**）✅ |
| 用原值再存一次 | 服务端回到原值（测试数据已还原）✅ |
| 从侧栏重新进入 | 仍为只读态 ✅ |
| 「默认提示词预览」 | 编辑态下仍保持 `readonly`（未受影响）✅ |
| 英文页 | `Edit` / `Save` / `Cancel` 文案正确，默认只读、点 Edit 后可编辑 ✅ |

- ⚠️ 排查中的坑：服务停着时浏览器仍会显示**缓存页面**，`page.evaluate` 交互会"看似成功但无效"（元素不存在 → jQuery 空集合 click 静默）⇒ **做 E2E 前先确认 8100 在监听**；强刷新用 `?t=<时间戳>` 带参数导航可确保拿到新页面。

## 旧待验证清单（已完成）

1. 进入「智能体设置 → 提示词管理」：`#promptSuffix`/`#promptOverride` 为 `disabled`，只有「编辑」可见
2. 点「编辑」→ 两个 textarea 可编辑、「保存」「取消」出现、「编辑」隐藏
3. 改动后点「取消」→ 值**还原**为已保存值 + 回到只读态
4. 改动后点「保存」→ toast「提示词配置已保存…」+ 页面重新渲染为只读态；`GET /agent/config/system-prompt` 返回新值（落库）
5. 保存后用**原始值再存一次**还原测试数据
6. 从侧栏重新进入该页 → 仍为只读态
7. 英文页：`Edit` / `Save` / `Cancel` 文案与只读态正确

## 未提交改动

`WebRoot/manager/main.js`、`WebRoot/manager/tmpl/promptConfig.html`、`WebRoot/manager/tmpl/promptConfig_en.html`、本卡、（若更新）`CLAUDE.md`
