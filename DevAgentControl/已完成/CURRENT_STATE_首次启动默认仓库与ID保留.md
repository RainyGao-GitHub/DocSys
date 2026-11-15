# CURRENT_STATE_首次启动默认仓库与ID保留（我的桌面/我的下载 + 仓库ID 1-100 系统保留区）

> 状态：**✅ 已收尾归档（2026-11-15）——后端实施 + P0 自测全过 + 用户浏览器实测行为正常（同日）**
> 需求来源：用户 2026-11-15 提出（原文见 §2）；同日二次确认（仓库1=第三方在线编辑）；§5 裁定已于开工时由用户落定（见 §5 裁定结果）
> 涉及仓库：主仓库（无 office/websocket 改动；商业版 DocSysBussinessModules 未改动）
> 实施与收尾：2026-11-15 单日完成（功能提交 `43f55a1f9` + 本卡归档提交）；dev 环境已恢复原状（DB MD5 与备份一致）

## 一句话

Windows/Mac 系统首次启动（创建第一个超级管理员）时自动创建三个系统仓库——**ID1 协同编辑服务仓库**（第三方在线编辑 fileLink 拉取落点，对应 `reposIdForRemoteDocumentEdit=1` 默认值）、**ID2 我的桌面**、**ID3 我的下载**（REAL_DOC_PATH 指向用户桌面/下载目录），为个人版"首启即用"铺路；同时把**仓库 ID 1-100 设为系统保留区**，新装库用户自建仓库从 101 起。

## 2. 需求原文整理

- 系统第一次启动 = 需要创建第一个超级管理员的时候（addFirstAdminUser 流程）。
- 对 Windows 和 Mac：默认创建两个仓库「我的桌面」「我的下载」，指向当前用户的桌面和下载目录。
- 目的：个人版铺垫——个人用户第一次启动后即可直接工作。
- 仓库 ID：仓库 1 留给第三方在线编辑（RemoteDocumentEdit 默认仓库），100 及以内系统保留，用户自建从 101 开始。

## 5. 裁定结果（2026-11-15 开工时用户落定）

1. **ID 分配**：创建 ID1 协同编辑服务仓库 + ID2 我的桌面 + ID3 我的下载；**不加 deleteRepos 删除守卫**（用户明确选择：三仓库都建，但 deleteRepos 不做任何特殊拦截——ID1 误删导致第三方编辑失效的风险用户自担）。
2. **桌面/下载仓库**：开回收站、关全文索引。
3. **目录探测**：**只考虑 Windows 和 Mac**；桌面/下载目录获取方法**参考 addFirstAdminUser 流程中数据存储根目录的获取方法**（即 user.home 拼接 + 规范化 + 校验，不读注册表）。
4. **保留区上限**：100。
5. Linux：不创建桌面/下载（getUserStandardDir 对非 Win/Mac 返回 null → 跳过+日志；ID1 服务仓库仍创建）。

## 9. 实施记录（2026-11-15）

### 改动清单
| 文件 | 改动 |
|---|---|
| common/DataRootService.java | 新增 `getUserStandardDir(dirName, osType)`：仅 Win/Mac，user.home + "/" + dirName → normalizeRoot → 存在+可写校验（复用 testWritable），失败返回 null；与 getDefaultRoots 同风格 |
| controller/ManageController.java | ① addFirstAdminUser：addUser 成功后**补查新用户 ID**（insertSelective 无 useGeneratedKeys 不回填，不补查则 OWNER/授权 USER_ID 落 NULL——自测第一轮抓到的真 bug）→ 调 `createDefaultReposForFirstUser(user, request)`；② 新增 createDefaultReposForFirstUser：repos 表非空即整体跳过（幂等防御）+ 逐仓库 addDefaultSystemRepos / logDefaultReposSkip；③ addDefaultSystemRepos：显式固定 ID（Mapper 支持指定 ID 插入）、TYPE=1 FSM、verCtrl/verCtrl1=0、复用 checkReposInfoForAdd 冲突校验、initReposData/createReposLocalDir/setReposHistoryFormat/initVerRepos×2（失败 deleteRepos 回滚）、**显式写 textSearch.conf={"enable":0}**（缺失时系统重启按 enable:1 兜底开启，必须显式关闭）、桌面/下载写 recycleBin.conf={"enable":1}、initReposVersionIgnoreConfig、备份/同步任务 HashMap、InitReposAuthInfo 授权首个超管；结果写 Log.info + addSystemLog（成功/跳过均记） |
| controller/BaseController.java | ① initDBTable case "repos" SQLite DDL 改 `integer primary key autoincrement`（序列只增不回退）；② initDBTables（**仅全新建库路径**，升级重建走 resetDBTable 不经过此处）建表后推进序列：SQLite `DELETE+INSERT INTO sqlite_sequence(name,seq) VALUES('repos',100)`；MySQL `ALTER TABLE repos AUTO_INCREMENT=101` |

### P0 自测结果（dev 实例 8100，备份→删库模拟全新安装→全流程→恢复，全部通过）
- [x] 全新建库：docSysInit 后 repos DDL=autoincrement、sqlite_sequence=('repos',100)
- [x] addFirstAdminUser（dataRoot=测试目录）后自动出现 ID1 协同编辑服务仓库（REAL_DOC_PATH 空）/ID2 我的桌面（→C:/Users/65205/Desktop/）/ID3 我的下载（→C:/Users/65205/Downloads/），OWNER=1、repos_auth/doc_auth 授权 USER_ID=1 全对（第一轮发现 OWNER/USER_ID 为 NULL，修复补查用户 ID 后第二轮通过）
- [x] 三仓库 textSearch.conf={"enable":0}；ID2/3 recycleBin.conf={"enable":1}；ID1 无 recycleBin.conf（默认关）
- [x] 我的桌面显示 60 项真实桌面文件；上传 firstboot_upload_test.txt 落到真实桌面（内容正确）
- [x] 删除该文件 → 从桌面消失 → 进 `DocSysReposes/2/RecycleBin/<ts>_<docId>/`（仓库数据目录回收站，不污染桌面）
- [x] 我的下载显示 21 项真实下载目录文件
- [x] 自建仓库 → ID=**101**；删除 101 再建 → ID=**102**（AUTOINCREMENT 不回退不复用）
- [x] 幂等：已有超管再调 addFirstAdminUser → "系统管理员已存在!"拒绝
- [x] 防御：清空 user 表构造"repos 非空无超管" → 新超管创建成功但**跳过仓库创建**（日志"检测到已有仓库，跳过默认仓库创建"，repos 数不变）
- [x] 恢复：DocSystem.db MD5 与备份一致、docSysConfig.properties/version 还原、测试 dataRoot 清理、dev 重启正常（repos=22、user=5、状态 ok）
- [x] createDefaultReposForFirstUser 三条成功日志齐全（协同编辑服务仓库/我的桌面/我的下载）

### 自测附带发现（重要）
1. **userService.addUser 用 insertSelective 不回填自增 ID**——addFirstAdminUser 后 user.getId()==null（已有代码的既有事实，本次以补查方式在调用侧规避，未动 mapper）。
2. **dev 部署树 webapps/DocSystem/WEB-INF/classes 是 2026-11-03 的旧拷贝**，缺在线压缩功能的 CompressExtractTask.class 等新类；本任务部署新 BaseController 时触发 NoClassDefFoundError → DispatcherServlet 初始化失败。已做**先删后拷的全量同步**（12532 个 class，以源码树 Eclipse 输出为准），dev 现为最新一致状态。教训：**给 webapps 部署树部署新 class 前先确认其与源码树 classes 的一致性，不一致时全量同步而非增量拷贝**。
3. Git Bash 下 curl 测接口：`-F "path=/"` 之类参数会被 MSYS 路径转换污染（`path=/` 变成 Git 安装路径），需 `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*"`，且此时 cookie 等本地文件参数也要用 Windows 路径。

### 遗留（不阻塞，已归档）
- [ ] Mac 真机验证（~/Desktop、~/Downloads）——待个人版 Mac 安装程序任务（挂起卡 `CURRENT_STATE_Mac安装程序.md`）推进时一并验证
- [ ] Windows OneDrive 重定向机器验证（裁定为 user.home 方案，OneDrive 机器若 user.home/Desktop 为残留目录会指向残留目录——用户已接受该取舍）
- [ ] MySQL 路径实测（ALTER TABLE AUTO_INCREMENT=101 为标准语句，无环境）
- [ ] 回收站"恢复"操作实测（文件进回收站已验证；恢复是既有功能未动）
- [ ] 第三方在线编辑回归（getDocInfoForRemoteDocumentEdit 需商业版授权环境，开源版已验仓库1存在；测试页 WebRoot/web/test.html:818）
- 用户浏览器实测（2026-11-15）：首启全流程 + 三仓库 + 桌面/下载 + 行为正常（用户原话"行为都正常"）

## 3. 调研结论（2026-11-15 核对，行号为当日 devInt 基线）

### 3.1 仓库 ID 分配机制
| 事实 | 位置 | 说明 |
|---|---|---|
| SQLite 建表 | BaseController.java:18326（createTable case "repos"） | `ID integer primary key`——**无 AUTOINCREMENT 关键字** → rowid=max(ID)+1 语义，**删除最大 ID 行后 ID 会回退复用**（推进起点必须用持久化序列或保留活行） |
| MySQL 建表 | 同上 else 分支 | `AUTO_INCREMENT`，`ALTER TABLE repos AUTO_INCREMENT=101` 一次到位 |
| 插入支持显式 ID | ReposMapper.xml:351（id="add"） | `useGeneratedKeys` + `<if test="id != null"> ID, </if>`——**指定 ID 用指定值，不指定才自增**。系统仓库固定 ID 零障碍 |
| dev 库验证 | DocSystem.db sqlite_sequence | 无 repos 记录，证实无 AUTOINCREMENT；dev 库现役 ID 已到 24（升级库不迁移，见 §4.A） |

### 3.2 低 ID 系统占用 —— **结论（2026-11-15 二次确认后修正）：仓库 1 确有系统用途，用户的记忆正确**
- **`reposIdForRemoteDocumentEdit = 1`（BaseFunction.java:206）**：第三方在线编辑服务（RemoteDocumentEdit）的默认仓库。
  - 场景：MxsDoc 作为第三方服务时，外部系统调 `getDocInfoForRemoteDocumentEdit.do`（BussinessController.java:4609，商业版接口、需授权证书）传 `fileLink`（文件URL）+ `saveFileLink`（保存回传URL）+ `fileName` + `fileKey` → 系统把文件**从 URL 下载到仓库 1**（`getReposEx(reposIdForRemoteDocumentEdit)`，4642 行）→ 提供在线协同编辑 → 保存时 `RemoteDocumentEditSave`（BaseController.java:9285，判定条件=仓库ID==该值 且 doc.path 前缀匹配）回传到 saveFileLink。
  - **该配置当前无任何赋值/加载代码**（全仓库仅定义处一处赋值；ManageController/SysConfigController/前端设置页均无配置入口——代码注释"可以在管理后台进行配置"**实际未实现**）→ 默认值 1 是唯一生效值，**仓库 1 不存在则第三方在线编辑服务直接不可用**（reposCheck 失败）。
- 主仓库 + 商业版其余代码无其他低 ID 硬编码；协同编辑自身的临时文件（officeEditCache 等）走系统 tmp，不是仓库。
- dev 库仓库 1 = 普通测试仓库（本机未启第三方服务）。
- **⇒ 预留 1-100 可行性不变，且仓库 1 应显式保留给 RemoteDocumentEdit**：首启若让"我的桌面"占用 ID 1，第三方编辑的文件会被拉取散落到真实桌面目录（桌面仓库 REAL_DOC_PATH 指向真实桌面）——**严重冲突，原方案 §4.B 的 ID 分配必须调整**（见修正后方案）。

### 3.3 首个超管创建流程（默认仓库的挂点）
| 环节 | 位置 | 说明 |
|---|---|---|
| 后端入口 | ManageController.java:3058 `addFirstAdminUser.do` | 校验无超管→dataRoot 选择/校验/应用（applyDataRoot 写 docSysConfig.properties:3186-3198）→ addUser(type=2)（3138）→ writeJson（3146）。**默认仓库创建挂点 = addUser 成功后、writeJson 前** |
| 前端 | WebRoot/web/addFirstAdminUser.html/.js | 首启全屏流程（含数据根目录选择），成功后进入系统 |
| 幂等闸门 | isFirstAdminUserExists()（BaseController:3202） | 已有超管则整个接口拒绝——天然防重复触发 |

### 3.4 仓库指向外部目录机制（"我的桌面"的实现基础）
- **REAL_DOC_PATH 字段**：`getReposRealPath`（Path.java:531）——realDocPath 非空则实文件直接存该目录，为空才用 `path+ID/data/rdata/`。
- **现成先例**：dev 库 ID=2「我的桌面」REAL_DOC_PATH=`C:/Users/65205/Desktop/`，长期在用；**非空目录允许**（桌面必然非空）。
- 仓库自身数据（索引/版本历史/回收站/隐藏文件配置等）都在 `path+ID/` 下（getReposPath，Path.java）——**不污染桌面目录本身**。
- addRepos（ReposController:521）已支持 realDocPath/recycleBin 参数；checkReposInfoForAdd 会校验 realDocPath 不得与其他仓库重复。
- 回收站目录 = `getReposPath()+RecycleBin/`（Path.java:995）——**在仓库数据目录，不在桌面内**，桌面仓库开回收站不污染桌面。

### 3.5 用户目录探测
- OSType 判定已有：initOSType（BaseFunction.java:2802），OS.Windows/OS.MacOS/Linux。
- user.home 使用先例：DataRootService.getDefaultRoots（DataRootService.java:572），内含 normalizeRoot/addRoot 可复用工具。
- **平台事实**：Windows/Mac 的 Desktop/Downloads **文件系统目录名固定英文**（中文系统的"桌面/下载"只是显示名），`user.home + "/Desktop"` 基本正确；**唯一坑 = Windows OneDrive 重定向**（真实桌面在 `%OneDrive%\Desktop`，权威路径在注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders`，REG_EXPAND_SZ 需展开环境变量）。
- **服务器场景防御**：Tomcat 以 Windows 服务运行时 user.home 可能是 systemprofile 目录——探测后必须做存在+可写校验，失败跳过该仓库（不阻塞首启）。

## 4. 方案设计（按裁定项 §5 落定后实施）

### A. ID 保留区 1-100（采纳用户提议）
- **新装系统一次性推进序列到 101**：
  - MySQL：建库初始化后执行 `ALTER TABLE repos AUTO_INCREMENT = 101`。
  - SQLite：① 建表 DDL 改为 `integer primary key autoincrement`（BaseController createTable case "repos"，仅影响新装库）；② 初始化后 `INSERT OR REPLACE INTO sqlite_sequence(name, seq) VALUES('repos', 100)`（AUTOINCREMENT 建表即生成 sqlite_sequence；下一条插入 ID=101，无脏占位行）。
- **旧库升级：零迁移**（现役系统 ID 已在用，重排是灾难；保留区只对全新安装生效，升级系统 addRepos 行为完全不变）。
- 不采用的备选：addRepos 显式算 ID 并 floor 到 101——每次插入查 max 有并发竞态（syncLockForRepos 按 name 锁不覆盖），改动面大收益小。

### B. 默认仓库定义（系统仓库，显式固定 ID；**2026-11-15 修正 ID 分配：ID1 留给协同编辑服务**）
| 字段 | 协同编辑服务仓库 | 我的桌面 | 我的下载 |
|---|---|---|---|
| ID | **1**（对应 reposIdForRemoteDocumentEdit 默认值） | **2** | **3** |
| NAME | 协同编辑服务仓库（名字待裁定 §5.1b） | 我的桌面 | 我的下载 |
| REAL_DOC_PATH | **空**（用仓库数据目录，绝不指向用户目录） | 探测的桌面目录 | 探测的下载目录 |
| TYPE/VER_CTRL | 1（FSM）/ 0 | 同左 | 同左 |
| PATH（仓库数据目录） | getDefaultReposRootPath()（`<root>/1/`） | 同左（`<root>/2/`） | 同左（`<root>/3/`） |
| OWNER | 首个超管 | 同左 | 同左 |
| 回收站/全文索引 | 不开/不开 | 待裁定 §5.2/§5.3 | 同左 |

- **ID1 专用仓库的意义**：`reposIdForRemoteDocumentEdit` 默认值 1 保持不动（改默认值会引入兼容风险且该配置无后台入口），首启显式创建 ID=1 仓库即让第三方在线编辑服务开箱即用（文件按 fileKey/fileName 组织在该仓库内，RemoteDocumentEditSave 的回传判定自然成立）；开源版无该授权也无副作用（就是普通仓库）。**不创建它的话**（若裁定 §5.1a 选否），ID 1 也必须空置，且"我的桌面/下载"仍从 ID 2 起。
- **命名裁定（2026-11-15 用户）**：叫「协同编辑服务仓库」，不叫"临时仓库"——防误导用户删除。配套防误删守卫见 §5.1d（deleteRepos 拒绝删 ID==1）。
- 走内部 service 直插（reposService.addRepos 设显式 ID——Mapper 已支持），**不走 addRepos HTTP 接口**（该接口拒绝普通用户且带超管权限检查，绕开以免语义混淆；复用 checkReposInfoForAdd 做路径冲突校验）。
- 探测失败（目录不存在/不可写/非 Win/Mac 平台）→ **跳过该仓库 + 系统日志记录原因**，首启不失败（协同编辑服务仓库无目录探测依赖，Win/Mac/Linux 均创建）。

### C. 创建时机与幂等
- 挂点：addFirstAdminUser 的 addUser 成功后调用 `createDefaultReposForFirstUser(user)`。
- 前置条件：`repos 表为空`（防升级/异常场景误触发）；已有同名或同 REAL_DOC_PATH 仓库则跳过该项。
- 每个仓库的创建结果（成功/跳过+原因）写系统日志。

### D. 用户目录探测工具（建议放 DataRootService，已有同类工具）
```
getUserStandardDir(dirType /*Desktop|Downloads*/, osType):
  Windows: reg query "HKCU\...\User Shell Folders" /v {Desktop|Downloads}
           → REG_EXPAND_SZ 展开（%USERPROFILE%/%OneDrive%）→ 存在性校验
           失败/异常 → 退化 user.home/{Desktop|Downloads}
  MacOS:   user.home/{Desktop|Downloads}
  其他:    返回 null（不创建）
  统一: normalizeRoot 规范分隔符 + 存在&可写校验
```

### E. 前端
- 无必须改动（首启流程不变，进系统即见两仓库）。
- 可选 P2：首启成功提示"已为你创建我的桌面/我的下载"。

## 5. 待用户裁定（新 session 开工前确认，均有推荐默认值）

1. **ID 分配**（2026-11-15 修正后）：
   - 1a. **首启显式创建 ID=1「协同编辑服务仓库」**（REAL_DOC_PATH 空、指向仓库数据目录，第三方在线编辑开箱即用）？（推荐：**是**）
   - 1b. ~~若创建，仓库名叫什么？~~ **✅ 已裁定（2026-11-15 用户）：「协同编辑服务仓库」**——不用"临时"字样，避免用户误以为可随意删除/清理。
   - 1c. 我的桌面=ID 2、我的下载=ID 3（推荐）；或其他分配？
   - 1d.（新增，承接命名裁定）**系统仓库防误删**：deleteRepos 对 ID==1 是否直接拒绝（提示"系统服务仓库，不可删除"）？对 ID 2/3（我的桌面/下载）是否二次强确认？（推荐：ID1 拒绝删除；ID2/3 允许删但确认文案提示默认仓库；实现仅后端 deleteRepos 一处守卫 + 前端文案）
2. **桌面/下载仓库默认开回收站？**（推荐：开——技术上不污染桌面（回收站在仓库数据目录），误删可恢复；注意语义=删除桌面文件会把它从真实桌面移走）
3. **默认开全文索引？**（推荐：关——桌面/下载文件多且杂，首启即建索引体感差，用户可后开）
4. **Windows OneDrive 重定向：注册表权威路径优先？**（推荐：是，reg query 失败退化 user.home）
5. **保留区上限 100 还是更大？**（用户提 100，默认遵从；改也只是一行）
6. **Linux 首启行为 = 只创建 ID1 协同编辑仓库、不创建桌面/下载？**（用户需求只提 Win/Mac；推荐 Linux 仅建 ID1，桌面/下载跳过+日志）

## 6. 实施顺序（新 session 按此开工，每完成一段更新本卡进展）

- **P0-后端**：getUserStandardDir 探测（DataRootService）→ createDefaultReposForFirstUser（挂 addFirstAdminUser，含幂等/跳过/系统日志）→ ID 序列推进（SQLite DDL 改 AUTOINCREMENT + sqlite_sequence 初始化；MySQL ALTER）→ deleteRepos 系统仓库守卫（§5.1d，若采纳）。
- **P0-自测**（**绝不动 dev 现役库**）：备份 `C:/TomcatForDocSysDev/docsys/tomcat/DocSystem.db` → 清空 user/repos 相关表模拟全新首启 → 浏览器走 addFirstAdminUser 全流程 → 验证三仓库（ID/指向/权限）+ 下一自建仓库 ID=101 + deleteRepos(ID1) 被拒 → 恢复备份。脚本化（备份/清空/恢复三步），防中途失败留脏库。
- **P1-真机**：Mac 环境验证（用户参与）；Windows OneDrive 重定向机器验证。
- **收尾**：回归（§7）+ 提交（commit 格式 `【新特性】首次启动默认创建我的桌面/我的下载仓库`）+ 本卡归档。

## 7. 验证清单

**新装首启（Windows，dev 实例模拟）**
- [ ] 建超管后自动出现 ID=1 协同编辑服务仓库（REAL_DOC_PATH 空）、ID=2 我的桌面（REAL_DOC_PATH=真实桌面）、ID=3 我的下载
- [ ] **第三方编辑回归**：调 `getDocInfoForRemoteDocumentEdit.do`（test.html:818 有现成测试页）→ 文件落在 ID=1 仓库内、不落桌面；保存回传判定成立（需商业版授权环境，开源版至少验证 getReposEx(1) 仓库存在）
- [ ] 桌面/下载文件在仓库中可见、上传直接落到真实目录、下载/重命名/删除正常
- [ ] 之后用户自建仓库 ID=101（不是 4）
- [ ] 删除自建仓库 101 后再建 → 仍 ≥101（SQLite AUTOINCREMENT 不回退）
- [ ] OneDrive 重定向机器：桌面仓库指向 OneDrive\Desktop（若裁定 §5.4=注册表优先）
- [ ] 回收站（若开）：删除桌面文件 → 从桌面消失、仓库回收站可恢复

**幂等与防御**
- [ ] 已有超管再调 addFirstAdminUser → 拒绝，不触发仓库创建
- [ ] repos 表非空时（模拟异常）→ 不创建
- [ ] 同名/同 REAL_DOC_PATH 已存在 → 跳过该项
- [ ] 探测失败（目录不存在/不可写）→ 跳过+日志+首启成功
- [ ] Linux（或 OSType 强制）→ 桌面/下载不创建+日志（ID1 服务仓库仍创建，若 §5.6 裁定如此）
- [ ] **deleteRepos(ID=1) → 拒绝**（"系统服务仓库，不可删除"）；ID2/3 删除确认文案提示（若 §5.1d 采纳）

**兼容**
- [ ] 旧库升级路径：现有 dev 库恢复后 addRepos 正常（ID 继续 max+1，无迁移副作用）
- [ ] MySQL 路径（若可测）：AUTO_INCREMENT=101 生效

**Mac（用户真机）**
- [ ] ~/Desktop、~/Downloads 正确指向与基本操作

## 8. 会话交接（开工 session 必读锚点）

- 本卡 §3 调研结论行号：ReposMapper.xml:351（add 支持显式ID）、BaseController.java:18326（SQLite DDL）、ManageController.java:3058（addFirstAdminUser 挂点 3138-3146）、Path.java:531（getReposRealPath）/995（回收站位置）、DataRootService.java:572（getDefaultRoots 工具先例）、BaseFunction.java:2802（initOSType）。
- **仓库1系统占用（二次确认结论）**：`reposIdForRemoteDocumentEdit=1`（BaseFunction.java:206，第三方在线编辑 RemoteDocumentEdit 默认仓库；入口 BussinessController.java:4609 `getDocInfoForRemoteDocumentEdit.do` 从 fileLink 拉文件到该仓库；保存回传判定 BaseController.java:9285）。该配置**无后台配置入口（未实现）**，默认值 1 唯一生效 → 仓库 1 必须存在第三方编辑才可用。现成第三方编辑测试页：WebRoot/web/test.html:818。
- 相关既有机制：REAL_DOC_PATH 先例=dev 库 ID2「我的桌面」→ C:/Users/65205/Desktop/（长期在用）。
- 纪律：javac 带 `-g`；dev 只用 TomcatForDocSysDev（8100）；测试用"备份→清空→恢复"脚本，绝不清了不恢复。
- 相关挂起卡：`CURRENT_STATE_Mac安装程序.md`（个人版安装形态相关，未获裁定不动）。
