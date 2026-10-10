# CURRENT_STATE — 仓库「允许操作隐藏文件和系统文件」选项（工作卡）

建立于 2026-10-10。**状态：已实施 + 已验证（E2E 全通过），代码未提交；仅剩收尾（文档已补、待用户决定是否提交）。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划 / 当前进展 / 下一步 / 生效约束。

## 任务

给**仓库设置**增加「允许操作隐藏文件和系统文件」选项（默认不允许）。现状风险：仓库「文件存储位置（realDocPath）」可被设成服务器上任意目录，而仓库文件区**对隐藏/系统条目完全不过滤**，用户能直接看到并重命名/移动/复制/删除/下载它们（详见方案 §1）。

用户原话：「目前 MxsDoc 新建的仓库的时候如果用户选择了自定义的存储路径时，存在一个很大的风险，用户可以直接看到隐藏文件和系统文件和目录，甚至修改和删除它们，所以我希望仓库设置里可以有允许操作隐藏文件和系统文件的选项，你帮我设计一下实现方案，我确认后再开工」。

## 必读上下文（续接锚点）

- **方案（主文档，含现状/设计/影响面/6 项裁定/实施步骤/验收/明确不做/§10 实施记录）**：`devDocs/仓库隐藏文件与系统文件操作控制方案.md`
- 关键现状锚点（方案里都有，这里只列入口）：
  - 浏览根 = `Path.getReposRealPath(repos)`（`Path.java:512`；`realDocPath` 非空则直接用它），唯一防线 `ReposController.java:585 isPathConflict`（只防「仓库位置 vs 文件存储位置」互相包含；`:583-584` 原注释自己写着「可以查看和删除后台的所有文件」）
  - 列表过滤落点：`BaseController.java getLocalEntryList(Doc, boolean)` 重载 + `getLocalEntryListForBrowse(repos, doc)`（原 `getLocalEntryList(Doc)` 在 `:843`）
  - 全仓唯一一处既有隐藏过滤（口径参考）：`ManageController.java:1809`（`getServerDirList.do`）
  - 变更落点族：`BaseController.java` 的 `createRealDoc` / `deleteRealDoc` / `deleteRealDocEx` / `saveRealDoc` / `updateRealDoc`×2 / `moveRealDocEx` / `moveRealDoc` / `copyRealDocEx` / `copyRealDoc` / `readRealDocContent`×2(+`Ex`) / `moveRealDocToRecycleBin` / `saveDocToRepos`；`DocController.java` 的下载 / office / agent / 历史版本族
  - 存储先例（本方案照抄它）：`encryptType` —— `Repos.java:102`（public 字段）、`Path.java:813/817`（仓库目录下配置文件）、`BaseFunction.java`（读写）、`BaseController.java getReposEx`（挂到实体）、`ReposController.java`（保存）、`ReposConfig.js`（前端）
  - 前端 6 个页面：`WebRoot/web/reposBasicSetting{,_en}.html`、`WebRoot/manager/{addRepos,editRepos}{,_en}.html`；共用 JS `WebRoot/web/js/ReposConfig.js`；英文映射 `WebRoot/web/lang/en.js translateMap`
- **参数存储策略（动参数/配置前必读）**：`devDocs/参数存储策略与参数清单.md`（本轮已补登记「仓库级配置文件」这一类与该文件）
- 编译不变量：`.class` 一律带 `-d WebRoot/WEB-INF/classes`（见 `CLAUDE.md`），且命令行 `javac` **必须带 `-g`**（见下「关键教训」）；后端改动需重编译 + **重启 dev Tomcat**；前端改动需**硬刷新**

## 当前进展（如实）

1. ✅ **现状已摸清（源码定位，非推测）**：浏览根解析链路、列表无过滤、变更落点族、`encryptType` 同类先例、DB 升降级机制、本地 dev 库 `WebRoot/version`=2.02.88（与 `ini/version` 相同 ⇒ 不走升级，加列需手工 `ALTER TABLE`）。
2. ✅ **方案已成文**：`devDocs/仓库隐藏文件与系统文件操作控制方案.md`（§1 现状/§2 判定口径/§3 选项语义/§4 实现设计/§5 影响面/§6 六项待裁定/§7 步骤/§8 验收/§9 明确不做）。
3. ✅ **用户 2026-10-10 裁定：D1~D6 全部按推荐值执行**——D1 仓库目录下配置文件；D2 默认不允许 + **所有仓库**统一生效（不限自定义路径的仓库）；D3 仅超管可改；D4 不显示 + 拦写 + **拦读**；D5 可见父目录的整目录操作照常执行（不跳过隐藏子项）；D6 \*nix 系统目录黑名单本轮不做。
4. ✅ **P1（主仓库）已实施**：
   - `FileUtil.java`：`isHiddenOrSystemFile(File, Integer OSType)` + `containsHiddenOrSystemEntry(localRootPath, path, name, OSType)`（判定口径下沉到 `FileUtil`，**不是**原方案的 `BaseFunction`——`BaseFunction` 静态初始化依赖 Web 容器，无法脱离容器做单元验证）。
   - `Path.java`：`getReposHiddenFileConfigPath()` / `getReposHiddenFileConfigFileName()`（`hiddenFileConfig.txt`，内容 `{"allow":1}`）。
   - `Repos.java`：`public Integer allowHiddenFile;`。
   - `BaseFunction.java`：`isAllowHiddenFileOp()` / `checkHiddenFileAccess(repos, doc, rt)` + 重载 `(repos, localRootPath, path, name, rt)` / `getReposHiddenFileConfig()` / `setReposHiddenFileConfig()` / `removeReposHiddenFileConfig()`。
   - `BaseController.java`：`getReposEx` 读入；浏览列表过滤；12 个 `*RealDoc*`（含 `moveRealDocToRecycleBin`、`saveDocToRepos`）守卫。
   - `DocController.java`：下载（`downloadDocPrepare.do` 含打包列表逐项、`_FSM`、VDoc）、`executeDoc.do`、`getDocFileLink.do`、`getDocHistory.do`、`downloadHistoryDocPrepare.do`、agent 写入/编辑 3 个端点守卫。
   - `ReposController.java`：`addRepos.do` / `updateReposInfo.do` 接收并落盘（**仅 `login_user.getType()==2`**；修改时「值变了才写」）。
   - 前端 6 页复选框 + `ReposConfig.js` 回填/保存/新建/变更检测 + 超管授权态（`showAllowHiddenFileAuth()`，页面无登录用户变量时回查 `/User/getLoginUser.do`）+ 勾选确认框 + `lang/en.js` 2 条映射。
5. ✅ **P2（websocket 独立仓库）已实施**：`BussinessController.java` 的 `addDocShare.do` / `getDocOfficeLink.do` / `getDocCadLink.do` 加守卫。
6. ✅ **验证全通过**：单元探针 14/14；接口 E2E 40/40（含「未开启时操作被拒 **且文件系统无变化**」「开启后可操作」「再次关闭后恢复拦截」「普通条目功能回归」四组）；真实浏览器 E2E 中/英文各一次（仓库 2 = 桌面：38 条 → 勾选保存 → 39 条含 `desktop.ini` → 取消保存 → 38 条且配置文件被删）。详见方案 §10.3。
7. ✅ **实施时对方案的三处修正已记录**（方案 §10.2）：判定工具下沉 `FileUtil`；「搜索索引」无需额外改动（`buildIndexForDoc` 已走 `docSysGetDocList`，方案点名的 `:4478` 实为 `addVerReposDBEntry` 版本仓库索引，故意不改）；回收站分支需单独加守卫（`deleteDoc_FSM` 走 `moveRealDocToRecycleBin` 不经过 `deleteRealDocEx`），且确认**不存在「回收站还原」端点**。
8. ✅ **测试现场已清理**：临时仓库/夹具目录（`C:\DocSysHiddenTest`、临时仓库 id 22/23）/临时脚本/探针/日志已删；仓库 2 已还原为未允许；语言 cookie 已清除；20 个原有仓库不变；源码树无 `.class`、工程根无 `tmp*`。

## 关键教训（已写进 `CLAUDE.md` 编译输出目录一节的 `-g` 要求）

命令行 `javac` **必须带 `-g -encoding UTF-8`**：Eclipse 默认生成 `LocalVariableTable`（`.settings/org.eclipse.jdt.core.prefs` 的 `debug.localVariable=generate`），而 `javac` 不带 `-g` 时**不生成局部变量表** ⇒ Spring MVC 无法解析控制器参数名 ⇒ 凡带 `String/Integer/Long` 形参的端点直接 **500**（`java.lang.IllegalArgumentException: Name for argument type [java.lang.String] not available...`，证据 `C:\TomcatForDocSysDev\docsys\tomcat\logs\localhost.2026-10-10.log`）。本次首次漏 `-g` 导致 `addRepos.do` 500，加 `-g` 重编译并重启后恢复。

## 下一步

1. **待用户决定是否提交**（用户原话只说「开工」，未说提交）。需提交两处：
   - 主仓库 `D:/Dev/DocSys`：`FileUtil.java`、`Path.java`、`Repos.java`、`BaseFunction.java`、`BaseController.java`、`ReposController.java`、`DocController.java`、6 个 HTML、`ReposConfig.js`、`lang/en.js`、`devDocs/仓库隐藏文件与系统文件操作控制方案.md`、`devDocs/参数存储策略与参数清单.md`、`DevAgentControl/CURRENT_STATE_仓库隐藏文件操作控制.md`、`CLAUDE.md`。
   - websocket 独立仓库 `src/com/DocSystem/websocket`：`BussinessController.java`。
2. 可选/待用户裁定（本轮均未做）：① `getReposList.do` 是否也回传 `allowHiddenFile`（当前只有 `getRepos.do`/`getReposEx` 有）；② D6 的 \*nix 系统目录（`/proc`、`/sys`、`/dev`…）黑名单是否补做；③ 是否把「仓库文件存储位置」本身的可选目录收窄（`isPathConflict` 之外的限制）。
3. 如需改动，务必带 `-g` 重编译 + 重启 dev Tomcat；前端改完硬刷新。

## 生效约束

- 本任务**已获用户裁定并实施完毕**；本卡转为「收尾/待提交」状态，**未获新裁定前不要再改代码**。
- D1 选了配置文件方案 ⇒ **零数据库改动**（不加列、不动 mapper / `docsystem_REPOS.json` / `getDBTabListForUpgarde`）。
- 选项**无缓存**：读写都走文件，保存后下一个请求即生效，集群一致。
- 权限：**仅超管（`User.type == 2`）**能改；非超管即使直接 POST 也会被忽略（不报错、不落盘）。前端复选框 HTML 里默认 `disabled`（fail-closed），拿到超管身份才解锁。
- 只拦**隐藏/系统**条目：普通条目行为必须与改动前完全一致（E2E 已回归）。默认关闭 ⇒ **存量仓库行为不变**（若某仓库的存储位置下有隐藏文件，默认从「可见可操作」变成「不可见不可操作」，这是功能本意）。
- 改动落在两个 git 仓库（主仓库 + `src/com/DocSystem/websocket`），**必须分别提交**。

## 未提交改动

- 新增：`devDocs/仓库隐藏文件与系统文件操作控制方案.md`
- 新增：`DevAgentControl/CURRENT_STATE_仓库隐藏文件操作控制.md`（本卡）
- 修改：`CLAUDE.md`（「当前任务」指向本卡 + 编译输出目录一节的 `-g` 要求）
- 修改：`devDocs/参数存储策略与参数清单.md`（登记仓库级配置文件这一类与本文件）
- 修改（主仓库代码）：`src/com/DocSystem/common/FileUtil.java`、`src/com/DocSystem/common/Path.java`、`src/com/DocSystem/entity/Repos.java`、`src/com/DocSystem/common/BaseFunction.java`、`src/com/DocSystem/controller/BaseController.java`、`src/com/DocSystem/controller/ReposController.java`、`src/com/DocSystem/controller/DocController.java`
- 修改（前端）：`WebRoot/web/reposBasicSetting.html`、`WebRoot/web/reposBasicSetting_en.html`、`WebRoot/manager/addRepos.html`、`WebRoot/manager/addRepos_en.html`、`WebRoot/manager/editRepos.html`、`WebRoot/manager/editRepos_en.html`、`WebRoot/web/js/ReposConfig.js`、`WebRoot/web/lang/en.js`
- 修改（**websocket 独立仓库**）：`src/com/DocSystem/websocket/BussinessController.java`
