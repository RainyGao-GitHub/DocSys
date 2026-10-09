# CURRENT_STATE — 系统设置-存储位置：目录树选择（工作卡）

建立于 2026-10-09。**状态：P1 已实施 + 真实浏览器 E2E 验收通过；改动未提交（等用户确认）；P2/P3 未开始。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划 / 当前进展 / 下一步 / 生效约束。

## 任务

给管理后台「系统设置」页里的 5 个存储位置字段增加**从目录树选择**的功能（手动输入麻烦）：

| 字段(id) | 页面显示名 | ini 键名（⚠️不一致） |
|---|---|---|
| `defaultReposStorePath` | 仓库默认存储位置 | `defaultReposStorePath` |
| `indexDBStorePath` | 系统数据存储位置 | **`DBStorePath`** |
| `agentSkillStorePath` | Agent技能存储位置 | **`AgentSkillStorePath`** |
| `salesDataStorePath` | 销售数据存储位置（仅销售服务器） | **`SalesDataStorePath`** |
| `systemLogStorePath` | 系统日志存储位置 | **`SystemLogStorePath`** |

## 必读上下文（续接锚点）

- 方案（主文档，含现状/设计/接口/验收/待裁定 7 项）：`devDocs/系统设置存储位置目录选择方案.md`
- **参数存储策略（动参数/配置前必读）**：`devDocs/参数存储策略与参数清单.md` —— 5 个键都在 `docSysConfig.properties`（classes=系统默认、ini=用户修改），**下次请求生效**；硬性约束：不要直接改 classes、复杂结构别塞 properties、同类参数同一种处理方式
- 页面：`WebRoot/manager/tmpl/systemUpgrade.html`(+`_en.html`)；逻辑 `WebRoot/manager/main.js`：`SYSTEM_INFO_FIELDS`(:1908) / `setSystemPageEditMode`(:1941) / `postSystemInfo`(:1955) / `enableSystemInfoSet`(:1988) / `cancelSystemInfoSet`(:1994) / `saveSystemInfoSet`(:2008)
- 取数：`BaseController.getSystemInfo()`(:23291) —— 返回的是**生效值**（`Path.getXxx(OSType)` 会套默认值）
- 存盘：`ManageController.setSystemInfo()`(:~1720) —— 键名映射 + `Path.localDirPathFormat()`、写 ini + 回拷 classes
- 对话框套路（照抄 LDAP 那个）：`main.js:2686 showSystemLdapServerEditPanel` + `WebRoot/manager/systemLdapServerEdit.html/_en.html/js`
- 后端鉴权套路：`superAdminAccessCheck(authCode, "docSysInit", session, rt)`（`ManageController:134` 等）
- 仓库记忆：`/memories/repo/manager-admin-ui.md`（管理后台 UI 约定与坑：`$Func.render` 模板缓存、未登录 302/404 与 `X-Requested-With` 白名单口径）

## 当前进展（如实）

1. ✅ **现状已摸清**（源码定位，非推测）：页面/字段/编辑态/保存链路/取数口径；**4 个键名与字段名不一致**；`getSystemInfo()` 返回的是**生效值**（第一次保存会把默认值固化成显式配置）；`localDirPathFormat` 的归一化口径（`\`→`/`、盘符大写、尾 `/`）
2. ✅ **确认要新增能力**：全仓无「服务器目录浏览」接口/组件（管理后台也没有 zTree/easyui 树），且这 5 个是**服务器本机绝对路径** ⇒ 不能用仓库目录树，需新增 1 个只读列目录接口 + 1 个选择对话框
3. ✅ **方案已成文**：`devDocs/系统设置存储位置目录选择方案.md`（§1 现状 / §2 设计（交互·对话框·接口·前端清单·安全边界）/ §3 P1-P3 / §4 验收口径 / §5 风险 / §6 明确不做 / §7 待裁定 7 项）
4. ✅ **根节点口径已定稿（用户 2026-10-09 提出）**：**根节点随操作系统不同** —— Windows = `File.listRoots()` 的多个盘符；**Linux / macOS = 只有 `/` 一个根、没有盘符概念**。实现口径：**后端按 `OS.isWinOS(OSType)` 产出 `roots`，前端只渲染它**（不在 JS 里判断系统）；`roots` 只有一项时直接展开，省掉一层
5. ✅ **P1 已实施**（2026-10-09，用户口头「开工」）：
   - 后端：`ManageController.getServerDirList.do`（只读/超管/只列目录/不递归；根节点按 `OS.isWinOS(OSType)`：Windows 盘符、*nix 只有 `/`；空路径只返回 `roots`；`truncated` + `maxDirs=500`；`parentPath` 用 `Path.getParentPath(path,1,OSType)`，根时为 null → 置空）
   - 前端：新增 `WebRoot/manager/systemStorePathPicker.html` / `_en.html` / `.js`（懒加载目录树、自动定位当前值、刷新、双击展开/单击选中、隐藏目录开关、截断/空态/错误提示）；`tmpl/systemUpgrade.html`(+`_en`) 各行加「选择…」按钮；`main.js` 新增 `STORE_PATH_FIELDS`/`openStorePathPicker`/`applyStorePathPickResult`/`waitStorePathPickerReady`，并在 `setSystemPageEditMode` 里同步按钮启停
6. ✅ **E2E 验收通过**（真实浏览器 + 重启后的 dev Tomcat）：接口根列表 `[C:/,D:/]`；`C:/` 默认 20 / `showHidden=1` **27 个 = `dir /b /ad` 全量**；`C:\TomcatForDocSysDev`→`C:/TomcatForDocSysDev/`、`nope`→`C:/nope/`、不存在目录→空列表不 500；未登录调用 → JSON `NOT_LOGIN`（**无目录名泄漏**）/ 无 `X-Requested-With` → 302；UI：非编辑态 5 按钮 disabled、「编辑」后放开、打开即自动定位到该字段当前值、选中→确定回填、页面「取消」回到编辑前值、转到/向上/刷新/隐藏开关（22→29 节点）均正常；落盘：改 `C:/tmp/` 保存 → ini+classes 两份都写入，改回 `C:/DocSysReposes/` 保存 → 两份同步还原（键值行与顺序逐行一致）
7. ✅ **已收尾清理**：配置已还原（备份文件已删）、页面退出编辑态；`git status` 仅剩本任务改动 + 已重编译的 class（不算改动）
8. ✅ **UI 已按用户反馈改版并复测**（2026-10-09，用户 4 点反馈）：① 去掉「路径」整行（含转到/向上）；② 去掉「目录」标题、每个节点前加**目录图标**（复用仓库主页 `folder_close/open.svg`，不引入 zTree CSS）；③ 「已选」改为**纯文本**（无标签、非编辑框）；④ 确定/取消移到**右下角**（改用 `qiao.bs.dialog` 自带 `.modal-footer`；未选目录点确定会保持打开+提示）
   - ↳ 顺带修掉一个真 bug：`qiao.bs.dialog` 注入 HTML 后**同步**调 `callback()`，而注入的 `<script>` 是**异步**执行 ⇒ 原来会偶发 `initStorePathPicker undefined`（现象：对话框打开、树是空的），改为 `waitStorePathPickerReady()` 轮询等就绪
9. ✅ **改版后复测**：无路径框/无标签 ✔；22 节点各带图标且图标真实加载（`folder_open.svg` 200×200）✔；已选为 `<div>` 纯文本 `font-weight:700` ✔；`.modal-footer text-align:right`、按钮 centerX 809/864 位于右端 ✔；选中→确定→回填并关闭 ✔；未选直接确定→保持打开+提示 ✔；取消不改输入框 ✔
10. ✅ **用户已提交**：主仓库 `devInt` 提交 **`f327c8ad8`【优化】系统设置增加从目录树选择的功能**（10 个文件：`ManageController.java` + `main.js` + 两个 `tmpl/systemUpgrade*.html` + 3 个新对话框文件 + 本工作卡 + 方案文档）
11. ✅ **提交后追加一处小修（⚠️ 未提交）**：空目录不再显示「（无子目录）」提示，改为**按叶子处理**（记入 `gStorePathPickerLeafPaths`、隐藏展开箭头、不展开；**读取失败仍提示**）—— 用户 2026-10-09：「点不开自然就知道」。实测 `C:/inetpub/`：点击后箭头为空、ul 不展开、无占位；再点击仍保持；有子目录节点展开回归正常 ✔。⇒ 当前工作区仅 `WebRoot/manager/systemStorePathPicker.js` 一个改动待提交

## 下一步

1. **等用户确认后提交**（主仓库 `devInt`：Java 1 个 + 前端 4 个文件 + 本卡 + 方案文档）
2. 未做项（待用户决定）：① 新建文件夹（P2）；② P3（路径校验/冲突告警/「恢复默认」/多节点提示）；③ **`tmpl/systemUpgrade_en.html` 原本就缺 `agentSkillStorePath` 这一行**（英文页少一个字段，只加了 4 个按钮）——要不要补
3. Linux/macOS 根节点分支只有代码级保证（本机无 *nix 环境实跑），若后续有 Linux 部署需求需补一次实跑

## 经验/坑（已记入仓库记忆）

- ⚠️⚠️ **`qiao.bs.dialog({url})` 把 HTML 注入 `.modal-body` 之后会同步调 `callback()`，但注入 HTML 里的 `<script src>` 是异步执行的** ⇒ 在 callback 里直接调用该脚本的函数会偶发 `undefined`（脚本缓存命中时侥幸通过、改动文件后缓存失效就必崩）；另外它**会强制把 `big` 置 false**（要自定义宽度用 `mstyle`）
- ⚠️ 保存后 `docSysConfig.properties` 的 **md5 必变**：`setSystemInfo` 用 `Properties.store()` 重写，**文件头时间戳行**每次刷新（键值行不变）⇒ 比对要按内容，不要用 md5
- ⚠️ 改前端 JS/模板后 E2E 必须先 `Network.setCacheDisabled` + `clearBrowserCache` 再重载（实测 main.js 被缓存 → `openStorePathPicker` 不可用）；模板还有内存缓存（改模板要整页重载）
- ⚠️ 重启 dev Tomcat 后内存 session 失效 → E2E 要重新登录（`$.post('/DocSystem/User/login.do',{userName:'Admin',pwd:'QWRtaW4='})`）

## 生效约束

- **未获用户确认前不要提交**（用户长期要求：改完 → 汇报 + 验证结果 → 等确认再提交）
- 提交归属：页面/JS/新接口都在**主仓库**（`devInt`）—— `WebRoot/manager/**` + `src/com/DocSystem/controller/ManageController.java`（已按 `-encoding UTF-8 -parameters -g -nowarn -implicit:none -d WebRoot/WEB-INF/classes` 编译到 classes 并重启）
- **测试会真实写 ini + classes**：动 E2E 前先备份 `docSys.ini/docSysConfig.properties` 与 `WEB-INF/classes/docSysConfig.properties`（真实路径 `C:\TomcatForDocSysDev\docsys\tomcat\webapps\docSys.ini\`），测完还原（本次已完成）
- 不要动 `docSysConfig.properties` 的历史键名（`DBStorePath`/`SystemLogStorePath`/`AgentSkillStorePath`/`SalesDataStorePath`），避免破坏既有部署
