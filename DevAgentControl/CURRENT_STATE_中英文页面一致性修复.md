# CURRENT_STATE — 中英文页面一致性修复（工作卡）

建立于 2026-10-09。**状态：全部目标已完成 —— 全量比对跑完，10 处不一致已修复并 E2E 验证（5 处页面缺失/错接 + 2 处缺失弹窗文件 + 3 处英文缺失弹窗 + 1 处文案语义，其中 `group_en` 兼有功能与文案两项）；用户裁定 OfficeLicense 残留代码删除放到本次提交之后单独做。未提交。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划 / 当前进展 / 下一步 / 生效约束。

## 任务

1. **必修**：`WebRoot/manager/tmpl/systemUpgrade_en.html` 缺 `agentSkillStorePath`（Agent技能存储位置）行 ⇒ 英文用户无法配置该项（功能缺失）。
2. **普查**：把所有「中文页 / `_en` 英文页」成对的文件做一次结构与功能比对，找出所有缺失/不一致项并修复。**判定口径：同一页面的中英版只能文案不同，功能必须一致**（字段/按钮/表单项 id、事件处理器、引用的脚本、控件数量）。

## 范围

- 管理后台：`WebRoot/manager/*.html` 与 `WebRoot/manager/tmpl/*.html`（各自的 `_en` 版）
- 前台 web：`WebRoot/web/*.html`（各自的 `_en` 版）
- **不含** `WebRoot/web/static/**`（第三方库自带语言文件，不属于本项目页面）

## 必读上下文（续接锚点）

- 前序任务（已归档）：`DevAgentControl/已完成/CURRENT_STATE_系统设置存储路径选择.md` —— `systemUpgrade.html` 的字段/保存链路（`SYSTEM_INFO_FIELDS`、`setSystemPageEditMode`、`postSystemInfo`、`ManageController.setSystemInfo` 的 4 处键名映射）
- 参数存储策略：`devDocs/参数存储策略与参数清单.md`（5 个存储位置的 ini 键名与生效时机）
- 仓库记忆：`/memories/repo/manager-admin-ui.md`（后台 UI 约定与坑）

## 比对方法（本次建立，可复用）

脚本都在 `%TEMP%\docsys_chk\`（不进仓库）：

| 脚本 | 作用 | 结果 |
| --- | --- | --- |
| `pairs_audit2.py` | 92 对中英页指纹比对：`id` / `name` / `on*` / `<script src>` / `<link href>` / 内联 `<script>` 里的函数名 / `data-*` / 控件计数（`input/select/button/tr/td`…） | **PAIRS=92 WITH_DIFF=13**，剩下的 13 对**全部**是 `lang/ch.js` ↔ `lang/en.js`（正常语言文件差异）+ `getPassword.html`（中文页不用 `_Lang`，英文页用 `_Lang` 包服务端消息，无功能差异） |
| `pairs_audit3.py` | 同 92 对的后端接口比对：`/DocSystem/**.do`、`url:"..."`、`<form action>` | **WITH_DIFF=1**，唯一命中 `register.html` 的 `pageTo.do` 是 **HTML 注释里的**「注册条款」链接 ⇒ 无害 |
| `lang_ext_refs.py` | 扫所有 `BASE + langExt + '.html'/.js'` 拼接点，检查 `BASE.html` 与 `BASE_en.html` 是否都存在 | 59 个拼接点，命中 10 个（去伪后见下） |
| `find_missing_pages.py` | 对可疑 base 名全树定位真实文件 + 打印调用点原文 | 消除 js 里 URL 相对基准目录的歧义 |

判定注意：`qiao.bs.dialog` 的 `url` 是**相对页面所在目录**解析，`.js` 文件里的拼接点要用「引用它的页面」目录去判断（如 `web/js/logon.js` 里 `'login'+langExt` 实指 `web/login.html`）⇒ `login`/`register`/`addFirstAdminUser`/`copyConflictConfirm`/`docDetail` 均有对应文件，**伪命中**。

## 当前进展（如实）

### 已修复并 E2E 验证（7 个文件）

| # | 文件 | 问题 | 证据/验证 |
| --- | --- | --- | --- |
| 1 | `manager/tmpl/systemUpgrade_en.html` | 缺 **Agent Skill Storage Path** 行（用户报告） | 英文后台该页现渲染 5 行存储路径 + 5 个 `Choose...`（默认 disabled，与中文页一致），`agentSkillStorePath` = `C:/DocSysReposes/skills/` |
| 2 | `manager/main_en.html` | 缺隐藏 `<input id="addOfficeFonts">` ⇒ 英文「Install Fonts...」按钮点了没反应（`main.js` 走 `$("#addOfficeFonts").click()`） | `$('#addOfficeFonts').length === 1` |
| 3 | `manager/tmpl/group_en.html` | 缺用户组**搜索框+搜索按钮** | 存在，placeholder `Enter user name`，`button[onclick="searchGroup()"]` 存在且 `searchGroup` 为函数 |
| 4 | `web/projects_en.html` | 缺**整个 AI 聊天入口**（图标 + `#ai-chat-icon` CSS + 3 个 artDialog 脚本 + `artDialog.css` + `openAiChat()`） | 图标在；点击后生成 `iframe[name=ArtDialogAiChat]` → `/DocSystem/web/agent/index.html` 且图标隐藏；`artDialog.list['ArtDialogAiChat'].close()` 后图标恢复 ✔ |
| 5 | `web/reposBasicSetting_en.html` | `onchange` 写错函数名大小写（`doSelectremoteServerProtocol`），真实函数是 `ReposConfig.doSelectRemoteServerProtocol` | 现 `onchange` 指向真实函数，拼错名不存在（`typoFnExists=false`） |
| 6 | `manager/systemMigrateConfirm_en.html` | **文件完全缺失**，但 `main.js:1429` 用 `'systemMigrateConfirm' + langExt + '.html'` ⇒ 英文后台「Migrate」确认弹窗 **404**、弹窗初始化抛错 | 建前 404 → 建后 200；英文后台点 Migrate 弹出弹窗，6 个标签 + 3 个下拉项 + 按钮全英文，「Migration Info」自动带出所选仓库 `[1] 测试仓库2;` |
| 7 | `manager/tmpl/group_en.html`（文案） | 我最初把搜索框 placeholder 写成 `Enter group name`，但 `searchGroup()` 实际把关键字当 **`userName`** 传给 `getGroupList.do`（中文页写「请输入用户名」是对的）⇒ 已改回 `Enter user name` | 读 `main.js:8026-8035` 确认语义 |

> 说明：#6 是我在「检查其他缺失项」时发现的同类真缺失（英文整块功能不可用），按同一判定口径直接补上并验证；如不认可可回退该文件。

### 按「方案 A」已修复并验证的 3 处英文缺失弹窗（用户 2026-10-10 裁定：先用 A，以后再统一改）

| 页面 | 做法 | 验证 |
| --- | --- | --- |
| `web/reposAdvancedSetting_en.html`（新） | 字节级复制中文页，只替换可见文案/中文注释 | 200；英文仓库页真实打开弹窗：11 个标签全英文（`Set As Public`/`Repository / Directory`/`Default Access Permission`/`Operation`/`Public`/`Repository Name`/`Read`/`Write`/`Add`/`Delete`/`Save`）、`#gPublic/#gAccess/#gEditEn/#gAddEn/#gDeleteEn` 齐全、零中文 |
| `web/reposTextSearchSetting_en.html`（新） | 同上 | 200；弹窗两个标签 `Disable full-text search for files` / `Disable full-text search for notes`（备注→Note 沿用 `lang/en.js` 既有译法）+ `Save`；零中文；且日志里出现英文报错 `Failed to get full-text search settings: server error`，说明错误分支也是英文 |
| `web/fileSelector_en.html`（新） | 同上（可见中文仅「确定/取消」+ 2 条错误提示 + 注释） | 200；走 `bootstrapQ.dialog` 真实机制打开：按钮 `Ok`/`Cancel`（确定→Ok 沿用 `lang/en.js`）、零中文、zTree 根节点正常；点 Cancel 能关闭 |

生成方式（可复用脚本 `%TEMP%\docsys_chk\gen_en_pages.py`）：**读中文页原始 bytes → 精确 UTF-8 子串替换 → 断言每个替换串命中数 ≥1、替换后全文件无 CJK 残留 → 才写出 `_en` 文件**；再用 `diff_en_pages.py` 核对中英差异**只**是预期文案/注释行（行数一致）⇒ 逻辑零改动、无手抄风险。

**另发现（中英都坏）**：`manager/main.js:7166 / 7358` 请求的 `addOfficeLicense.html` / `officeLicenseInfo.html` **全树不存在**（中英都 404）⇒ Office 授权残留功能，**用户已裁定可删代码，但排到本次提交之后单独做**。

### 未做

- ❌ 未提交任何代码（等用户确认）
- ⏳ OfficeLicense 残留代码清理（用户已裁定要做，但排在本任务提交之后单独做）

## 下一步

1. 汇报 + 等用户提交
2. 本次提交后：单独做 OfficeLicense 残留清理（`manager/main.js:7166 / 7358` 的调用及相关入口），不得与本次改动混在一起提交
3. 视情况：把「中英页功能必须一致」与本比对脚本套路固化进 `CLAUDE.md`（用户未裁定，勿擅自改）

## 生效约束

- **未获用户确认前不要提交**（用户长期要求：改完 → 汇报 + 验证结果 → 等确认再提交）
- 修英文页只**补功能**、不改动既有英文文案措辞（除非明显错误）；英文术语优先沿用 `lang/en.js` 既有译法
- **英文页文案语义要与实际代码一致**：如 group 搜索框 placeholder（元素名是“组搜索”，实际查的是 `userName`）——以代码语义为准，不要照字面直译
- 英文弹窗一律用**方案 A（建 `_en` 副本）**；用户说要「以后再统一改」时再改语言中立方案
- **不得顺手改中文页**（本任务全程未改中文页）
- OfficeLicense 残留代码清理**单独做**，不得与本次改动混在一起提交
- 若 E2E 触发保存：先备份 `docSys.ini/docSysConfig.properties`（真实路径 `C:\TomcatForDocSysDev\docsys\tomcat\webapps\docSys.ini\`）与 `WebRoot/WEB-INF/classes/docSysConfig.properties`，测完还原（比对内容，**不要用 md5**——`Properties.store()` 会刷新文件头时间戳）
- 本次改动**全是静态页面文件**（`WebRoot/**`，经 junction 生效）⇒ 无需编译、无需重启 Tomcat；但前端 E2E 必须走 CDP `Network.setCacheDisabled` + `clearBrowserCache`，模板改动需整页刷新（模板有内存缓存）
