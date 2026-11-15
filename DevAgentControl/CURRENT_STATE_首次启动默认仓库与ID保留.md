# CURRENT_STATE_首次启动默认仓库与ID保留（我的桌面/我的下载 + 仓库ID 1-100 系统保留区）

> 状态：**方案设计完成，含 6 个待裁定项，用户换新 session 开工**（2026-11-15 建立；需求与裁定疑问由用户当日提出，调研结论为同日实测核对）
> 需求来源：用户 2026-11-15 提出（原文见 §2），本卡为唯一工作卡
> 涉及仓库：主仓库（无 office/websocket 改动；商业版 DocSysBussinessModules 仅调研未改动）
> ⚠️ 开工 session 第一步：先向用户确认 §5 裁定项（有推荐默认值，可快速过）

## 一句话

Windows/Mac 系统首次启动（创建第一个超级管理员）时自动创建两个默认仓库——**我的桌面**、**我的下载**，分别指向当前用户的桌面/下载目录（REAL_DOC_PATH 机制），为个人版"首启即用"铺路；同时把**仓库 ID 1-100 设为系统保留区**，用户自建仓库从 101 起。

## 2. 需求原文整理

- 系统第一次启动 = 需要创建第一个超级管理员的时候（addFirstAdminUser 流程）。
- 对 Windows 和 Mac：默认创建两个仓库「我的桌面」「我的下载」，指向当前用户的桌面和下载目录。
- 目的：个人版铺垫——个人用户第一次启动后即可直接工作。
- 用户未决问题：**仓库 ID**——印象中仓库 1 有特殊用途（协同编辑的临时存储仓库），考虑**将 100 及以内的仓库 ID 用作系统用途，后续用户创建的仓库默认从 101 开始**，是否可行？（§3.2 调研结论：可行，且比用户担心的更干净）

## 3. 调研结论（2026-11-15 核对，行号为当日 devInt 基线）

### 3.1 仓库 ID 分配机制
| 事实 | 位置 | 说明 |
|---|---|---|
| SQLite 建表 | BaseController.java:18326（createTable case "repos"） | `ID integer primary key`——**无 AUTOINCREMENT 关键字** → rowid=max(ID)+1 语义，**删除最大 ID 行后 ID 会回退复用**（推进起点必须用持久化序列或保留活行） |
| MySQL 建表 | 同上 else 分支 | `AUTO_INCREMENT`，`ALTER TABLE repos AUTO_INCREMENT=101` 一次到位 |
| 插入支持显式 ID | ReposMapper.xml:351（id="add"） | `useGeneratedKeys` + `<if test="id != null"> ID, </if>`——**指定 ID 用指定值，不指定才自增**。系统仓库固定 ID 零障碍 |
| dev 库验证 | DocSystem.db sqlite_sequence | 无 repos 记录，证实无 AUTOINCREMENT；dev 库现役 ID 已到 24（升级库不迁移，见 §4.A） |

### 3.2 低 ID 系统占用 —— **结论：无代码冲突，"仓库1特殊用途"未获代码证实**
- 主仓库 + 商业版（DocSysBussinessModules）全量 grep：**无任何 `vid==1`/`reposId==1`/`getRepos(1)` 硬编码**；无"系统仓库/默认仓库/临时仓库"代码概念。
- 协同编辑的临时文件走 docSysIniPath/系统 tmp 目录（officeEditCache 等），**不是仓库**；用户记忆中的"仓库1=协同编辑临时存储"在当前代码不存在（可能是早期产品惯例）。
- dev 库仓库 1 = 普通测试仓库，无特殊性。
- **⇒ 预留 1-100 是纯产品命名空间决策，技术上完全可行**；将来任何系统功能需要仓库时可用固定低 ID 创建。

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

### B. 默认仓库定义（系统仓库，显式固定 ID）
| 字段 | 我的桌面 | 我的下载 |
|---|---|---|
| ID | **1** | **2** |
| REAL_DOC_PATH | 探测的桌面目录 | 探测的下载目录 |
| NAME | 我的桌面 | 我的下载 |
| TYPE/VER_CTRL | 1（FSM）/ 0（无版本管理） | 同左 |
| PATH（仓库数据目录） | getDefaultReposRootPath() | 同左（数据在 `<root>/1/`、`<root>/2/`） |
| OWNER | 首个超管 | 同左 |
| 回收站/全文索引 | 待裁定 §5.2/§5.3 | 同左 |

- 走内部 service 直插（reposService.addRepos 设显式 ID——Mapper 已支持），**不走 addRepos HTTP 接口**（该接口拒绝普通用户且带超管权限检查，绕开以免语义混淆；复用 checkReposInfoForAdd 做路径冲突校验）。
- 探测失败（目录不存在/不可写/非 Win/Mac 平台）→ **跳过该仓库 + 系统日志记录原因**，首启不失败。

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

1. **默认仓库固定 ID=1/2？**（推荐：是——系统仓库语义、存储路径可预测、与保留区叙事一致）
2. **桌面/下载仓库默认开回收站？**（推荐：开——技术上不污染桌面（回收站在仓库数据目录），误删可恢复；注意语义=删除桌面文件会把它从真实桌面移走）
3. **默认开全文索引？**（推荐：关——桌面/下载文件多且杂，首启即建索引体感差，用户可后开）
4. **Windows OneDrive 重定向：注册表权威路径优先？**（推荐：是，reg query 失败退化 user.home）
5. **保留区上限 100 还是更大？**（用户提 100，默认遵从；改也只是一行）
6. **Linux 首启行为 = 不创建默认仓库？**（用户需求只提 Win/Mac；推荐 Linux 不创建，仅日志说明）

## 6. 实施顺序（新 session 按此开工，每完成一段更新本卡进展）

- **P0-后端**：getUserStandardDir 探测（DataRootService）→ createDefaultReposForFirstUser（挂 addFirstAdminUser，含幂等/跳过/系统日志）→ ID 序列推进（SQLite DDL 改 AUTOINCREMENT + sqlite_sequence 初始化；MySQL ALTER）。
- **P0-自测**（**绝不动 dev 现役库**）：备份 `C:/TomcatForDocSysDev/docsys/tomcat/DocSystem.db` → 清空 user/repos 相关表模拟全新首启 → 浏览器走 addFirstAdminUser 全流程 → 验证两仓库（ID/指向/权限）+ 下一自建仓库 ID=101 → 恢复备份。脚本化（备份/清空/恢复三步），防中途失败留脏库。
- **P1-真机**：Mac 环境验证（用户参与）；Windows OneDrive 重定向机器验证。
- **收尾**：回归（§7）+ 提交（commit 格式 `【新特性】首次启动默认创建我的桌面/我的下载仓库`）+ 本卡归档。

## 7. 验证清单

**新装首启（Windows，dev 实例模拟）**
- [ ] 建超管后自动出现 ID=1 我的桌面（REAL_DOC_PATH=真实桌面）、ID=2 我的下载
- [ ] 桌面/下载文件在仓库中可见、上传直接落到真实目录、下载/重命名/删除正常
- [ ] 之后用户自建仓库 ID=101（不是 3）
- [ ] 删除自建仓库 101 后再建 → 仍 ≥101（SQLite AUTOINCREMENT 不回退）
- [ ] OneDrive 重定向机器：桌面仓库指向 OneDrive\Desktop（若裁定 §5.4=注册表优先）
- [ ] 回收站（若开）：删除桌面文件 → 从桌面消失、仓库回收站可恢复

**幂等与防御**
- [ ] 已有超管再调 addFirstAdminUser → 拒绝，不触发仓库创建
- [ ] repos 表非空时（模拟异常）→ 不创建
- [ ] 同名/同 REAL_DOC_PATH 已存在 → 跳过该项
- [ ] 探测失败（目录不存在/不可写）→ 跳过+日志+首启成功
- [ ] Linux（或 OSType 强制）→ 不创建+日志

**兼容**
- [ ] 旧库升级路径：现有 dev 库恢复后 addRepos 正常（ID 继续 max+1，无迁移副作用）
- [ ] MySQL 路径（若可测）：AUTO_INCREMENT=101 生效

**Mac（用户真机）**
- [ ] ~/Desktop、~/Downloads 正确指向与基本操作

## 8. 会话交接（开工 session 必读锚点）

- 本卡 §3 调研结论行号：ReposMapper.xml:351（add 支持显式ID）、BaseController.java:18326（SQLite DDL）、ManageController.java:3058（addFirstAdminUser 挂点 3138-3146）、Path.java:531（getReposRealPath）/995（回收站位置）、DataRootService.java:572（getDefaultRoots 工具先例）、BaseFunction.java:2802（initOSType）。
- 相关既有机制：REAL_DOC_PATH 先例=dev 库 ID2「我的桌面」→ C:/Users/65205/Desktop/（长期在用）。
- 纪律：javac 带 `-g`；dev 只用 TomcatForDocSysDev（8100）；测试用"备份→清空→恢复"脚本，绝不清了不恢复。
- 相关挂起卡：`CURRENT_STATE_Mac安装程序.md`（个人版安装形态相关，未获裁定不动）。
