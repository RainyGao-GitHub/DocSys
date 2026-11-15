# CURRENT_STATE_在线压缩与解压（提取 / 添加到压缩包）

> 状态：**P0+P1 开发完成、三层验证通过，待用户真机回归后归档**（2026-11-15 建立 + 同日用户裁定方案 B + 同日开工 session 完成开发）
> 需求来源：用户 2026-11-15 提出（原文见 §2），本卡为唯一工作卡
> 涉及仓库：主仓库（前后端均在此仓库，无 office/websocket 仓库改动）

## 当前进展（2026-11-15 开工 session，最终）

- **P0-后端 ✅ 完成 + 自测 33/33 PASS**（测试脚本 `logs/test_suite.py`，测试仓库=dev23"压缩解压自测仓库" verCtrl=3）：
  - 新增 `CompressExtractTask.java`（entity）；`BaseFunction` 增 `compressExtractTaskHashMap`；`BaseController` 增 ~600 行（safeExtractZipFile 安全解压 / getZipTopLevelEntryNames / 冲突预检 / executeExtractPrepareTask / executeCompressPrepareTask / importExtractedFilesToRepos / checkTargetDirAddRight 等）；`DocController` 增三接口 `/extractDocPrepare.do` `/compressDocPrepare.do` `/queryCompressExtractTask.do`；`MyInterceptor` 白名单加三接口
  - **§5.3 导入通道已落定（候选1变体）**：异步线程直调 `saveDoc_FSM(SAVE_TYPE_ChunkedFile, chunkNum=1, chunkParentPath=解压tmp目录)` 走文件复制（无 byte[] 内存压力）；批协议 = `checkAndCreateFolderUploadAction` 直调（requestIP 请求时捕获）+ 每文件 `uploadAfterHandler(…,chunkIndex=0,chunkNum=1,…)` 计数，末文件自动 `folderUploadEndHander` 一次版本提交；每文件刷新 `action.beatTime`
  - 修复两处**既有缺陷**：① `checkAndCreateFolderUploadAction` lockDoc 失败后 `docLock.createTime` NPE（BaseController ~25273，改为 else 分支）；② 新链路锁竞争：连续同目录提取时前次异步解锁未完成 → 导入函数加了 10 次×3s 重试（先 remove 失败占位 action）
  - 自测覆盖：方案B不散落/中文内容/冲突预检(子目录+散装+zip)/覆盖合并/entryList部分提取/权限拒绝/多选压缩(zip内容验证)/坏zip/非压缩文件/**Zip Slip（../evil.txt 拦截、ok.txt 正常落地）**/分享页拒绝/entryList与targetName注入拒绝
  - ⚠️ 部署注意：javac 必须带 `-g`（CLAUDE.md 纪律）；dev Tomcat（8100端口, wtpwebapps 部署目录）reloadable=true 自动热载；curl 测 multipart 中文文件名在本机会乱码（resolver 无 defaultEncoding，浏览器正常）→ 测试用 ASCII 名
- **P0-前端 ✅ 完成 + 浏览器 E2E 验证通过**（2026-11-15 同日）：
  - 新增 `WebRoot/web/js/CompressExtract.js`（共享逻辑：extractZipDoc/compressDocs API + 冲突确认 + 轻量进度弹窗 + 轮询 + openExtractDialog/openCompressDialog + 菜单入口）；新增 `extractDoc.html/_en`、`compressDoc.html/_en` 四个弹窗片段（含"..."目录选择，自带 showFileSelectorInBootstrapDialog 副本）；改 `project.js`（#tree 菜单 +4 项 cssClass=menu-extract-doc/menu-compress-doc + updateCompressExtractMenuDisplay 显隐，挂到既有右键 handler）；改 `project.html/project_en.html`（引入 js + project.js ?v=20261115）；`lang/en.js` +24 词条
  - **菜单文案裁定（实现偏差记录）**：card §3.1 的【提取到"XXXX/"】因 ContextJS 菜单为静态构建（重建需 destroy+重挂全菜单，侵入大），第一版用通用文案【提取到同名目录】/【提取到...】/【快速压缩】/【添加到压缩包...】，语义一致；动态包名列为 P2 打磨项
  - E2E 已验证（dev8100 + 浏览器）：zip右键菜单显隐（非zip隐藏提取项）/提取到同名目录（方案B+完成提示+树刷新）/冲突弹窗（替换、取消=中止）/提取到...弹窗（默认值+改名执行+落地）/多选压缩（虚拟名 data...等2个文件.zip + zip内容=data子树+readme.txt 布局正确）
- **P1 ✅ 完成 + 浏览器逐变体验证通过**（2026-11-15 同日）：
  - `CompressExtract.js` 增 `getZipEntryPath`（node.path 剥离 rootPath+rootName 前缀得 zip 内相对路径）/`extractZipEntry(node,"here"|"dialog")`/`refreshHostPage`（本页→parent→opener 三层刷新兜底）
  - `zipViewerForBootstrap.html`（#zipTreeContextMenu +2 项 + ZipViewer 模块开放 extractDocHere/extractDocTo）；`zipViewer.html`/`zipViewerForArt.html`（ContextJS 菜单 +2 项 + zipExtractDocHere/To 函数 + 引入 js/CompressExtract.js；zipViewer 系无英文页，菜单与既有项一致硬编码中文）
  - 三变体实测：**ForArt**（iframe）菜单/冲突/替换/parent.refreshDoc 父页整页刷新（iframe 消失确认）✅；**ForBootstrap**（同页弹窗）菜单/冲突/替换/同页刷新（evaluate 因页面导航被打断即证明 reload）✅；**新窗口**菜单/冲突/替换提取 ✅（IAB 环境 window.opener 为空→刷新安全跳过，真实浏览器 opener 可用）
- **补充验证（§8 清单可自动化部分）**：加密仓库（上传密文→提取→产物自动加密存储）✅；一次版本提交（getDocHistory：每次解压恰 1 条 commit"解压 [x.zip] 到 [/]"，批次协议生效）✅；空 zip 报错 ✅；嵌套 zip 落地为普通文件 ✅；深层目录 ✅；中文文件名/内容全链路 ✅
- 后端自测合计 **38 项全 PASS**（自测脚本归档为 `devDocs/在线压缩与解压自测脚本.py`；测试用临时仓库已删）
- 后端接口协议（前端对接用）：
  - `extractDocPrepare.do`：入参 reposId/path/name(压缩文件)+targetPath(空或/为根)+targetName(空=散落)+entryList(JSON数组,空=全部)+overwriteFlag(0=冲突返回询问)+shareId；返回 msgData=5+data=task.id 轮询 | msgData="conflict"+data={count,names[]} | fail
  - `compressDocPrepare.do`：入参 reposId+docList(JSON [{path,name,type}])+targetPath+targetName(后端兜底补.zip)+overwriteFlag+shareId；返回同上
  - `queryCompressExtractTask.do`：taskId；返回 msgData=5+data=task{info,totalCount,processedCount} | ok+data={targetPath,targetName}（完成，任务即删）| fail(msgInfo=失败原因)
  - 任务 info 文案直接展示（"文件解压中.../导入文件中... 已处理 x/N/等待目标目录解锁..."）

## 下一步（用户参与）

**§8 真机回归剩余用户项**（自动化已覆盖部分见上方）：
- [ ] 只读用户（有下载无上传权限）浏览器实测提取/压缩被拒
- [ ] 分享页（shareId）不出现提取/压缩菜单（后端已拒+前端菜单已按 gShareId 隐藏，未浏览器实测）
- [ ] GBK 编码 zip（Windows 压缩工具打包）解压中文正常
- [ ] 大量文件（>1000）性能体感
- [ ] systemCompressEncoding=GBK 配置下压缩产物在 Windows 解压工具打开正常
- 通过后：本卡移入 `DevAgentControl/已完成/`（P2 增强项——zipViewer 多选批量提取/进度条细化/docList 移动端入口/GBK zip 解压/菜单动态包名——如需另开卡）

## 提交记录（主仓库 devInt）

- `【优化】在线压缩与解压菜单交互`（2026-11-15，用户实测反馈后第二轮）：
  - 菜单改名：提取到同名目录→**解压缩**、快速压缩→**压缩**（en.js 同步：Decompress/Compress）
  - 菜单重排：**打包下载、解压缩、提取到...、压缩、添加到压缩包...** 五项从"下载"后移到**"回收站"前**，组前后加分割线（高频区只留 下载/打印/分享/全选/复制/剪切/粘贴/删除/重命名/远程存储/文件服务器/查看历史/对比）
  - project.js ?v=20261115a；浏览器已验证：非 zip 右键隐藏解压缩/提取到...、zip 项存在、分组位置与分割线正确
- `【新特性】在线压缩与解压`（2026-11-15，开工 session）：
  - 新增 `src/com/DocSystem/common/entity/CompressExtractTask.java`、`WebRoot/web/js/CompressExtract.js`、`WebRoot/web/extractDoc.html/_en`、`WebRoot/web/compressDoc.html/_en`
  - 改 `src/com/DocSystem/common/BaseFunction.java`（+compressExtractTaskHashMap）、`src/com/DocSystem/controller/BaseController.java`（压缩解压执行块 + **既有缺陷修复：checkAndCreateFolderUploadAction lockDoc 失败 NPE**）、`src/com/DocSystem/controller/DocController.java`（三接口）、`src/com/DocSystem/controller/MyInterceptor.java`（白名单+3）
  - 改 `WebRoot/web/project.js`（#tree 菜单+4 与显隐）、`project.html/_en`（引入 js + ?v=20261115）、`lang/en.js`（+24 词条）、`zipViewer.html`、`zipViewerForArt.html`、`zipViewerForBootstrap.html`（右键提取菜单）
  - 配套：`devDocs/在线压缩与解压自测脚本.py`

## 一句话

为 DocSys 增加两个功能：**① 压缩文件提取（解压）**——文件树 zip 右键 + 在线压缩包预览页右键，支持提取到指定位置/当前位置；**② 在线压缩**——选中文件/目录（多个）右键"添加到压缩包"，生成 zip 存入仓库。后端压缩/解压的原语（FileUtil.compressWithZip / extractZipFile 家族）已全部存在，本功能主要是**编排**：权限 → 冲突预检 → 异步任务（仿 DownloadPrepareTask 模式）→ 导入仓库（复用 saveDocToRepos + FolderUploadAction 批次）。

## 2. 需求原文整理

### 2.1 文件解压缩
- **（1）压缩文件右键菜单**增加：【提取到...】【提取到"XXXX"】，原设想还有【提取到当前位置】——两个实现方案的取舍已评估（见 §3 裁定）。
  - 【提取到...】：弹窗指定存储位置，默认 zip 所在目录，可用 "..." 按钮选位置（fileSelector）。
  - 【提取到"XXXX"】：直接解压，目标 = zip 所在目录 / 压缩包名（去扩展名）/。
- **（2）在线压缩包预览页**（zipViewer）里选中文件/目录，右键【提取到...】【提取到当前位置】（位置 = zip 所在目录）。
- **冲突**：解压目标位置存在同名条目 → 弹窗让用户选择是否替换已存在的文件。
- 注：现已支持在线打开压缩文件（zipViewer）并下载其中的文件/目录，本需求是"提取（解压）到仓库目录"。

### 2.2 在线压缩
- 选中文件/目录（支持多个），右键增加【添加到压缩包】【添加到"XXXX.zip"】。
  - 【添加到压缩包】：弹窗，可指定存储位置 + 压缩包名（压缩类型只支持 zip）；默认位置 = 选中节点所在目录；默认包名 = 与多文件打包下载相同的虚拟名规则（用户可改）。
  - 【添加到"XXXX.zip"】：直接压缩，位置 = 选中节点所在目录，包名 = 虚拟名规则。
- **冲突**：目标位置已有同名 zip → 弹窗提示是否覆盖。

## 3. 关键裁定（§3.1 已由用户确认，§3.2 为实现默认值可调）

### 3.1 【提取到当前位置】方案评估 → **已裁定：方案 B（2026-11-15 用户确认，理由：避免散文件污染项目）**

| | 方案 A：真·解压到 zip 所在目录 | 方案 B：强制解压到 `zip所在目录/包名去扩展名/`（**采用**） |
|---|---|---|
| 无顶层目录的 zip（右键多文件压缩产生的 zip 极常见） | 文件散落在当前目录，与既有文件混杂，**不可逆**；版本库仓库会产生大量零散入库 | 天然有子目录容器，无散落风险 |
| 冲突面 | 与当前目录所有同名文件冲突 | 仅与同名子目录冲突（一次确认） |
| 与【提取到"XXXX"】的关系 | 三项菜单 | **两者等价，合并为一项**，菜单只剩两项，语义无重复 |
| 业界对照 | WinRAR 有此项（给高级用户） | 7-Zip 默认"提取到 *\"（同名目录）同思路 |

**结论菜单（文件树 zip 右键，两项）**：
1. 【提取到"XXXX/"】——直接执行，目标 = zip所在目录/包名去后缀/（即方案 B 的"当前位置"）。
2. 【提取到...】——弹窗（默认值同上，用户可改路径/子目录名；想要"真散落"的高级用户在这里删掉子目录名即可，不单独设菜单项）。

**zipViewer 预览页右键（两项，语义略不同）**：
1. 【提取到当前位置】——目标 = zip 所在目录，条目按 zip 内原结构落地（用户是显式选中了具体条目，散落可见可控；提取单个文件到 zip 旁边是最常见操作）。
2. 【提取到...】——弹窗，默认 = zip 所在目录。

### 3.2 其他裁定（默认值，用户可改）
- **冲突协议第一版统一为"整体一次确认"**：后端预检返回冲突条目清单（条目数 + 前 N 个名字），前端弹窗【替换/取消】；替换 = 目录合并写入、文件覆盖，取消 = 整体中止。不做逐条选择、不做"跳过"。
- **分享页（shareId）第一版不开放**提取/压缩（分享场景无写权限语义），菜单不显示。
- **提取支持的格式**：菜单显示条件与在线预览一致（`FileUtil.isCompressFile` → isZip 后缀集合：zip/war/rar/7z/tar/tgz/gz/txz/xz/bz2/tbz2），后端 `extractZipFile` 本来就全格式支持（白赚）；**验证以 zip 为主**，其他格式不承诺。
- **压缩只支持 zip**（用户已定，不做 rar/7z）。
- zipViewer 内**多选（checkbox）批量提取列为 P2 增强**，第一版只做右键单节点（含其子树）提取。
- 压缩包名虚拟名规则（与打包下载 `buildTreeNodesForCompressDownload` 一致）：多文件 = `首文件名...等N个文件` + `.zip`；单文件/目录 = `名字` + `.zip`。

## 4. 技术调研结论（现有资产地图，2026-11-15 核对）

### 4.1 后端已有原语（都在本仓库，无需新造）
| 能力 | 位置 | 说明 |
|---|---|---|
| zip 压缩（目录→zip） | `FileUtil.compressWithZip(srcPath, zipFile, encoding)`（FileUtil.java:1397）；`doCompressDir`（BaseController.java:2847） | 编码用 `systemCompressEncoding`（BaseFunction.java:329，docSysConfig.properties 可配 GBK/UTF-8） |
| **全格式解压** | `extractZipFile(path, name, targetPath)`（BaseController.java:20671） | zip/war/7z/rar/tar/tgz/txz/tbz2/gz/xz/bz2，多级降级（zip→7z→SevenZip） |
| entry 级解压 | `extractEntryFromZipFile/7zFile/CompressFile...`（BaseController.java:20745 起，`extractEntryFromCompressFile` 20721） | 预览页单条目提取可直接用；已有递归父级解压 `checkAndExtractEntryFromCompressDoc`（22579） |
| zip 条目列表 | `getZipSubDocList`（BaseController.java:20782）→ `/getZipSubDocList.do`（DocController.java:8459） | 预览页已在用 |
| 加密仓库的 zip | `decryptRootZipDoc`（BaseController.java:11888） | 预览链先落地明文 tmp 副本，提取链同样要先走它 |
| **异步任务先例** | `DownloadPrepareTask` + `createDownloadPrepareTask`（DocController.java:2695）+ `executeDownloadPrepareTask`（BaseController.java:23329）+ `/queryDownloadPrepareTask.do`（DocController.java:2865） | 打包下载（`download_with_docList`）= 收集 docList→tmp→压缩→轮询，**压缩功能的同构样板**；含 addDelayTaskForDownloadPrepareTaskDelete 清理 |
| docList 收集 | `executeDownloadPrepareTaskForReposDocList`（BaseController.java:23346 case 4）、`getDocListFromDownloadList`（DocController.java:2528） | 压缩功能复用：把选中 docList 收集到 tmp 目录再打包 |
| **入库通道** | `saveDocToRepos`（BaseController.java:25146） | 单文件写入（MultipartFile/fileLink/docData），带权限、verRepos channel 提交、系统日志；**目录上传批次协议**（dirPath/batchStartTime/totalCount/isEnd + FolderUploadAction，25161-25193）已解决"一批文件一次版本提交" |
| 权限检查 | `checkUserDownloadRight`（打包下载在用，DocController.java:2455）；Add 权限见 saveDocToRepos 内 `getUserDocAuthWithMask`（25216） | |
| 隐藏文件检查 | `checkHiddenFileAccess`（DocController.java:2433 在用） | |

### 4.2 前端已有组件
| 组件 | 位置 | 用途 |
|---|---|---|
| 打包下载右键菜单项（新加的） | project.js `#tree` 菜单 ~5462（下载/打包下载） | 菜单插入位置参照；docList JSON 构造参照 `buildDownloadListForCompressDownload`（DocDownload.js:289） |
| **目录选择弹窗** | `fileSelector.html` + `showFileSelectorInBootstrapDialog(config)`（pullDoc.js:704，config: storageType/reposId/doc/onSelect） | "..." 按钮的现成实现，三个使用方（pullDoc/remoteStoragePull/largeFileManager） |
| 表单弹窗样板 | `pullDoc.html`（路径输入 + "..." 按钮 + 确定/取消） | 提取/压缩两个新对话框直接仿这个结构 |
| zip 预览页 ×3 变体 | `zipViewerForBootstrap.html`（bootstrapQ 弹窗，DocSys.js:2704）、`zipViewerForArt.html`（artDialog iframe，DocSys.js:2720）、`zipViewer.html`（新窗口，DocSys.js:2478） | 三个变体右键菜单都要加（contextMenuInit 在各自页面内）；ForArt/新窗口是 iframe，但都引了 bootstrapQ/qiao 且 same-origin，可弹对话框 |
| 冲突弹窗 | `qiao.bs.confirm`（项目通用确认框）；参考 `copyConflictConfirm.html`（重命名式，本功能不用） | 统一用 qiao.bs.confirm【替换/取消】 |
| 任务轮询样板 | DocDownload.js `startDownloadPrepareQueryTask/doQueryDownloadPrepareTask`（578-704） | 提取/压缩任务的进度轮询仿此（2s 起步 +5s 递增，上限 60s） |
| 词条 | lang/ch.js（中文直出）、lang/en.js（字典） | 新词条见 §7 |

## 5. 总体方案

### 5.1 后端新接口（DocController，均走异步任务模式）

**（1）`/extractDocPrepare.do` —— 解压准备**
```
入参：taskId, reposId, docId, pid, path, name        //zip 文件（同 downloadDocPrepare）
     targetPath                                       //仓库内目标目录（相对路径，空=仓库根）
     targetName                                       //目标子目录名（空=不建子目录=直接散到 targetPath）
     entryList                                        //可选，JSON 数组（zip 内相对路径），空=全部解压
     overwriteFlag                                    //0=有冲突先返回询问（默认）1=直接覆盖
     shareId
逻辑：
  a. 权限：zip 文件 checkUserDownloadRight + 目标目录 Add 权限
  b. 冲突预检：解压结果顶层条目名 vs targetPath/targetName 下现有条目
     → 有冲突且 overwriteFlag==0：返回 status=ok, msgData=conflict, data=冲突清单（名字列表+总数）
  c. 创建异步任务（新增 ExtractPrepareTask，或给 DownloadPrepareTask 加 type——推荐新建独立类，字段少）：
     decryptRootZipDoc（加密仓库）→ extractZipFile/extractEntryFromZipFile 解压到用户 tmp
     → Zip Slip 校验（见 §6）→ 逐条目导入仓库（见 §5.3 导入通道）
  d. 返回 msgData=5 + task（前端轮询）
```
**（2）`/queryExtractTask.do`** —— 轮询（完全仿 queryDownloadPrepareTask.do：status/info/进度；完成时返回 ok，data 带目标目录信息供前端刷新）。也可做成通用 `/queryPrepareTask.do` 按 type 分派——实现时选简单的。

**（3）`/compressDocPrepare.do` —— 压缩准备**
```
入参：taskId, reposId
     docList        //JSON：[{path,name,type}]，与打包下载 downloadList 同构同校验
     targetPath     //仓库内目标目录
     targetName     //zip 名（前端已按虚拟名规则给默认值）
     overwriteFlag  //0=询问 1=覆盖
     shareId
逻辑：
  a. 权限：docList 逐个 checkUserDownloadRight（照抄打包下载 DocController.java:2440-2470）+ 目标目录 Add 权限
  b. 冲突预检：targetPath/targetName 已存在且 overwriteFlag==0 → 返回 conflict
  c. 异步任务：收集 docList 到 tmp（复用 executeDownloadPrepareTaskForReposDocList 的收集段）
     → FileUtil.compressWithZip → zip 入库 targetPath（单文件走 saveDocToRepos，commitMsg="压缩 N 个文件"）
  d. 返回 msgData=5 + task
```
**（4）压缩轮询**：复用（2）同一接口。

**错误处理统一**：权限不足 / zip 损坏 / 磁盘满 → 任务 status=3 + info，前端轮询到失败态弹错。

### 5.2 前端改动点

**（A）project.js 右键菜单（`#tree`，contextMenuInit）**
1. 当 `curRightClickedTreeNode`（或选中集）是压缩文件（前端判定 = getFileSuffix ∈ zip 集合，与后端 isZip 对齐；封装 `isCompressDoc(node)` 放 common 处）且非分享页时，菜单加：
   - `{text:'提取到"' + 包名去后缀 + '/"'}` → `extractDoc(node, {targetPath: node所在目录, targetName: 包名去后缀})`
   - `{text:'提取到...'}` → 打开提取对话框（extractDoc.html）
2. 任意选中（单/多，与"打包下载"同一位置）加：
   - `{text:'添加到"' + 虚拟名 + '.zip"'}` → `compressDocs(nodes, {targetPath: 所在目录, targetName: 虚拟名.zip})`（内部仍走冲突预检）
   - `{text:'添加到压缩包'}` → 打开压缩对话框（compressDoc.html）

**（B）新对话框 ×2（bootstrapQ.dialog，仿 pullDoc.html 结构）**
- `extractDoc.html` + `extractDoc.js`：目标位置输入框（默认 zip 所在目录[/包名去后缀]）+ "..."（showFileSelectorInBootstrapDialog）+ 确定/取消 → extractDocPrepare.do + 轮询 + 完成 `bootstrapQ.msg` + `refreshDoc` 刷新目标目录。
- `compressDoc.html` + `compressDoc.js`：目标位置输入框（默认选中节点所在目录）+ "..." + 压缩包名输入框（默认虚拟名）+ 确定/取消 → compressDocPrepare.do + 轮询 + 刷新。
- 冲突弹窗：qiao.bs.confirm（`已存在同名条目 N 个（xxx、yyy...），是否替换？`【替换】【取消】）→ 确认后带 overwriteFlag=1 重发。
- 任务进行中提示：仿 DocDownload 进度条列表太重，第一版用简单遮罩/文案（"解压中... / 压缩中(已收集 x 个文件)..."），完成提示。

**（C）zipViewer ×3 右键菜单**
- 各自 contextMenuInit 增加【提取到当前位置】【提取到...】，作用于 `curRightClickedTreeNode`：
  - entryList = 该节点在 zip 内的相对路径（节点上有 rootPath/path/name 可算，zipViewer.html 里 jsonObj.rootPath/rootName 已存）；
  - 目录条目 = 提取整个子树（entry 传目录路径，后端按前缀过滤）；文件条目 = 单文件；
  - 对话框复用（B）的 extractDoc.html；完成后尝试通知父页刷新（ForBootstrap 同页 DOM 直接刷；ForArt/新窗口 iframe same-origin 可 `parent.refreshDoc(...)` 或 postMessage——实现时验证）。

**（D）词条**：en.js 增补（提取/提取到当前位置/提取到.../添加到压缩包/添加到"...zip"/替换/解压中/压缩中/已存在同名文件是否替换 等）。

### 5.3 导入通道（实现时第一个要落定的点，两个候选）

| | 候选 1（推荐）：tmp 解压后逐条目走 `saveDocToRepos`（带 FolderUploadAction 批次参数） | 候选 2：直接写 rdata 目录 + 手动触发 channel/事件 |
|---|---|---|
| 权限/版本/日志/隐藏文件检查 | 全部现成（目录上传已解决一批多文件单次 verRepos 提交） | 全要自己做，易绕过版本库 |
| 性能 | 逐文件走链路，大包（几千文件）慢；docData 是 byte[]，大文件有内存压力——**可能需要给 saveDocToRepos 加 File/流式入口** | 快 |
| 风险 | 低 | 高（漏事件/漏提交会造成 rdata 与 verRepos 不一致） |

**推荐候选 1**；若性能不可接受再评估候选 2。开工时先读 saveDocToRepos 全文 + FolderUploadAction 生命周期（folderUploadEndHander）确认批次协议怎么复用（taskId/dirPath/batchStartTime 谁生成）。

## 6. 安全与边界（实现检查项）

1. **Zip Slip**：解压每个 entry 前校验落地路径不逃逸目标目录（`../`、绝对路径、盘符）。检查现有 extractAllForZipFile（BaseController.java:22937）是否已防护，无则补（防护加在新链路上即可，不动旧调用方语义）。
2. **entryList 参数校验**：预览页传入的 zip 内相对路径必须做同样的逃逸校验，且必须真实存在于 zip 条目表（用 getZipSubDocList 的同一数据源）。
3. **隐藏/系统文件**：解压入库走 saveDocToRepos 时 `checkHiddenFileAccess` 自动生效；tmp 中间产物不管。
4. **加密仓库**：提取前 `decryptRootZipDoc` 落地明文副本；压缩产物入库不受影响（saveDocToRepos 处理加密存储）。
5. **中文文件名**：压缩统一 `systemCompressEncoding`；解压 UTF-8 为主。**已知遗留（不在本卡解决）**：SevenZip 库对 GBK 编码 zip 条目有乱码 bug（getSubDocListForCompressFile 20851 有 TODO 注释）。
6. **大小/数量上限**：异步任务防呆——entry 数 > 10000 或解压预估 > 1GB 时任务直接报"压缩包过大"？或仅提示。第一版不做硬限制，只保证失败可回收（tmp 延时删除，仿 addDelayTaskForDownloadPrepareTaskDelete）。
7. **并发**：同一用户对同一 zip 重复发起 → taskId 去重（createDownloadPrepareTask 2705 已有先例，照抄）。

## 7. 实施顺序（新 session 按此开工，每完成一段更新本卡进展）

- **P0-后端**：ExtractPrepareTask 任务类 + extractDocPrepare/queryExtractTask + compressDocPrepare（含权限、冲突预检、Zip Slip、tmp 清理）。自测：curl 直接调接口在测试仓库完成 提取/压缩/冲突/权限拒绝/加密仓库 各一遍。
- **P0-前端**：project.js 菜单 + extractDoc/compressDoc 对话框 + 冲突弹窗 + 完成刷新。手工验证文件树侧全流程。
- **P1-前端**：zipViewer ×3 右键提取 + 父页刷新通路。
- **P2-增强（可另开卡）**：zipViewer 多选 checkbox 批量提取；进度条细化；docList（移动端）入口；GBK zip 解压。
- **收尾**：真机回归（§8 全清单）+ 提交（commit 格式 `【新特性】在线压缩与解压`）+ 本卡移入 `DevAgentControl/已完成/`。

## 8. 验证清单（真机）

**提取（文件树入口）**
- [ ] 有顶层目录的 zip → 提取到"XXXX/" 得到 `目录/包名/顶层目录/...`
- [ ] 无顶层目录的 zip（多文件压缩产物）→ 同上不散落（方案 B 生效）
- [ ] 【提取到...】改路径/改子目录名/选仓库根；"..." 弹窗选择
- [ ] 同名目录已存在 → 冲突弹窗（替换=合并、取消=不动）；同名文件已存在 → 替换
- [ ] 中文文件名 zip；空 zip（报错提示）；zip 内嵌 zip（落地为普通文件）；深层目录
- [ ] 加密仓库的 zip；开启版本库的仓库 → 提取产生**一次**版本提交（批次协议生效）
- [ ] 只读用户（有下载无上传）→ 提取被拒（提示无权限）；隐藏文件未开启的仓库
- [ ] 分享页不出现提取菜单

**提取（预览页入口）**
- [ ] zipViewer（弹窗/ArtDialog/新窗口三变体）右键文件/目录条目 → 提取到当前位置/指定位置
- [ ] 提取后父页面目录刷新可见

**压缩**
- [ ] 多选（文件+目录混合）→ 添加到"XXXX.zip"：包名规则正确、内容完整、可再在线打开
- [ ] 【添加到压缩包】改位置/改名；同名 zip 已存在 → 覆盖确认
- [ ] 中文文件名（systemCompressEncoding=GBK/UTF-8 各验一次）
- [ ] 单文件/单目录/大量文件（>1000）；版本库仓库 → 一次提交
- [ ] 只读用户 → 压缩被拒

## 9. 开放问题（开工时落定，不需要用户全部参与）

1. §5.3 导入通道选型（推荐候选 1；需确认 saveDocToRepos 是否要加 File 入口避免大文件 byte[] 内存压力）。
2. 轮询接口形态：独立 queryExtractTask vs 通用 queryPrepareTask（选实现简单的）。
3. zipViewer ForArt/新窗口 iframe → 父页刷新的具体通路（same-origin 直调 vs postMessage）。
4. 非 zip 格式（rar/7z/tar）提取是否随 P0 一起验（后端白拿，但验证工作量在 zip 之外——建议 P0 只验 zip，其他格式随缘）。

## 10. 会话交接

- 开工 session 第一步：读本卡 + §4 资产地图逐个确认行号仍有效（本卡建立于 devInt 分支 d919a40bd 之后、打包下载修复已完成的基线）。
- 相关近期改动（同一批人做的，避免冲突）：`DocDownload.js`（打包下载 compressFlag + urlsafe base64 解码）、project.js `downloadDoc`（compressFlag 参数）、#tree 菜单已含【下载】【打包下载】两项——压缩菜单插在它们附近。
