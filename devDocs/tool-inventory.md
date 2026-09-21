# DocSysClient API 工具清单（T1.1 交付物）

> 用途：把 `DocSysClient` 的全部 API 盘点为 LLM 可调用的候选 Tool，作为 `ToolDefinition` 的定义依据。
> 来源：`src/com/DocSystem/agent/client/DocSysClient.java`（2026-07-31 盘点，共 35 个业务 API + 8 个辅助方法）。
> 分组：读 / 写（需审计）/ 会话 / 危险（需白名单）。

---

## 1. 总览

| 分组 | 数量 | 说明 |
|------|------|------|
| 只读工具（安全，无需确认） | 17 | 列表/详情/搜索/配置/历史 查询 |
| 写工具（需审计 + 二次确认） | 14 | 增删改/移动/复制/上传/锁定/备份/分享 |
| 会话工具（特殊） | 3 | login/logout/register（Agent 复用 MxsDoc 会话，默认不暴露） |
| 危险工具（管理员白名单） | 1 | docSysInit（系统初始化，极危险） |
| 辅助方法（非工具） | 8 | getBaseUrl/copyWithSession 等（不进 ToolRegistry） |

---

## 2. 只读工具组（T3.1，17 个）

| # | Tool name | DocSysClient 方法 | HTTP 端点 | 参数 (JSON Schema) | 说明 |
|---|-----------|-------------------|-----------|---------------------|------|
| R1 | `get_login_user` | `getLoginUser()` | POST /User/getLoginUser.do | `{}` | 当前登录用户信息 |
| R2 | `list_repos` | `getReposList()` | POST /Repos/getReposList.do | `{}` | 当前用户可见仓库列表 |
| R3 | ~~`list_repos_admin`~~ | ~~`getManagerReposList()`~~ | ~~POST /Repos/getManagerReposList.do~~ | — | 已下线（工具删，R3-5 连带删方法） |
| R4 | `get_repos` | `getRepos(vid)` | POST /Repos/getRepos.do | `{"vid": "int(必填)"}` | 仓库详情 |
| R5 | `list_docs` | `getDocList(vid,pid,path)` | POST /Doc/getDocList.do | `{"vid":"int(必填)","pid":"long(可选)","path":"string(可选)"}` | 文档列表 |
| R6 | `get_doc` | `getDoc(reposId,docId,path,name)` | POST /Doc/getDoc.do | `{"vid":"int","docId":"long","path":"string(可选)","name":"string(可选)"}` | 文档内容 |
| R7 | `download_doc` | `downloadDoc(reposId,docId,path,name)` | POST /Doc/downloadDoc.do | `{"vid":"int","docId":"long","path":"string(可选)","name":"string(可选)"}` | 下载文档 |
| R8 | `get_doc_history` | `getDocHistory(reposId,docId)` | POST /Doc/getDocHistory.do | `{"vid":"int","docId":"long"}` | 版本历史 |
| R9 | `search_docs` | `searchDocs(searchWord,vid)` | POST /Doc/searchDoc.do | `{"searchWord":"string(必填)","vid":"int(可选)"}` | 全文搜索 |
| R10 | `list_ai_models` | `getAiModelList()` | POST /Repos/getAiModelList.do | `{}` | AI 模型列表 |
| R11 | `get_sys_config` | `getDocSysConfig()` | POST /Repos/getDocSysConfig.do | `{}` | 系统配置 |
| R12 | `get_system_config` | `getSystemConfig()` | POST /Manage/getDocSysConfig.do | `{}` | 系统配置（Manage） |
| R13 | `get_banner_config` | `getBannerConfig(serverIP)` | POST /Manage/getBannerConfig.do | `{"serverIP":"string(可选)"}` | Banner 配置 |
| R14 | ~~`get_email_config`~~ | ~~`getSystemEmailConfig(authCode)`~~ | ~~POST /Manage/getSystemEmailConfig.do~~ | — | 已下线（工具删，R3-5 连带删方法） |
| R15 | `get_doc_share_list` | `getDocShareList(reposId,docId,path,name)` | POST /Doc/getDocShareList.do | `{"vid":"int","docId":"long","path":"string(可选)","name":"string(可选)"}` | 文档分享列表 |
| R16 | `query_backup_status` | `queryBackupStatus(taskId)` | POST /Repos/queryReposFullBackupTask.do | `{"taskId":"string(必填)"}` | 备份任务状态 |
| R17 | `ai_chat` | `chat(message,llmName)` | POST /Repos/AIChat.do (SSE) | `{"message":"string(必填)","llmName":"string(可选)"}` | AI 对话（返回流式原文） |
| R18 | `rag_chat` | `ragChat(query,modelName,apiKey)` | POST /Query/addDocSysRagMessage.do | `{"query":"string(必填)","modelName":"string(可选)","apiKey":"string(可选)"}` | RAG 对话（带文档上下文） |

> 注：R17/R18 走 DocSys 后端 LLM（非 LLMService 直连），作为工具时需谨慎暴露（可能冲突）。

---

## 3. 写操作工具组（T3.2，14 个 — 全部 `isWrite=true` + `needsConfirm=true`）

| # | Tool name | DocSysClient 方法 | HTTP 端点 | 参数 (JSON Schema) | 说明 |
|---|-----------|-------------------|-----------|---------------------|------|
| W1 | `create_repos` | `addRepos(name,info,type,path,...)` | POST /Repos/addRepos.do | `{"name":"string(必填)","info":"string(可选)","type":"int(默认0)","path":"string(必填)","verCtrl":"int(可选 0无/1SVN/2GIT)","textSearch":"string(可选)","recycleBin":"string(可选)"}` | 创建仓库 |
| W2 | `delete_repos` | `deleteRepos(vid)` | POST /Repos/deleteRepos.do | `{"vid":"int(必填)"}` | 删除仓库 |
| W3 | `update_repos` | `updateReposInfo(reposId,name,...)` | POST /Repos/updateReposInfo.do | `{"reposId":"int(必填)","name":"string(可选)","info":"string(可选)","path":"string(可选)","verCtrl":"int(可选)"}` | 更新仓库信息 |
| W4 | `create_doc` | `addDoc(reposId,pid,path,name,type,level,content,commitMsg)` | POST /Doc/addDoc.do | `{"vid":"int(必填)","pid":"long(可选)","path":"string(可选)","name":"string(必填)","type":"int(默认0文件/1文件夹)","content":"string(可选)","commitMsg":"string(可选)"}` | 新建文档/文件夹 |
| W5 | `delete_doc` | `deleteDoc(reposId,docId,pid,path,name,type,commitMsg)` | POST /Doc/deleteDoc.do | `{"vid":"int(必填)","docId":"long","pid":"long(可选)","path":"string(可选)","name":"string","commitMsg":"string(可选)"}` | 删除文档 |
| W6 | `rename_doc` | `renameDoc(reposId,docId,pid,path,name,type,dstName,commitMsg)` | POST /Doc/renameDoc.do | `{"vid":"int(必填)","docId":"long","dstName":"string(必填)","pid":"long(可选)","path":"string(可选)","name":"string","commitMsg":"string(可选)"}` | 重命名 |
| W7 | `move_doc` | `moveDoc(reposId,docId,srcPid,srcPath,srcName,srcLevel,dstPid,dstPath,dstName,dstLevel,type,commitMsg)` | POST /Doc/moveDoc.do | `{"vid":"int(必填)","docId":"long","dstPid":"long(必填)","dstPath":"string(可选)","srcPid":"long(可选)","srcPath":"string(可选)","srcName":"string(可选)","commitMsg":"string(可选)"}` | 移动文档 |
| W8 | `copy_doc` | `copyDoc(reposId,docId,srcPid,srcPath,srcName,srcLevel,dstPid,dstPath,dstName,dstLevel,type,commitMsg)` | POST /Doc/copyDoc.do | `{"vid":"int(必填)","docId":"long","dstPid":"long(必填)","dstPath":"string(可选)","dstName":"string(可选)","commitMsg":"string(可选)"}` | 复制文档 |
| W9 | `upload_doc` | `uploadDoc(reposId,pid,path,name,type,size,checkSum,fileData,fileName,...)` | POST /Doc/uploadDoc.do | `{"vid":"int(必填)","pid":"long(可选)","path":"string(可选)","name":"string(必填)","type":"int(默认1)","content":"string(文件内容Base64或文本)","commitMsg":"string(可选)"}` | 上传文件（工具层建议只暴露文本/小文件） |
| W10 | `lock_doc` | `lockDoc(reposId,docId,path,name,lockType)` | POST /Doc/lockDoc.do | `{"vid":"int(必填)","docId":"long(必填)","path":"string(可选)","name":"string(可选)","lockType":"int(默认1)"}` | 锁定文档 |
| W11 | `unlock_doc` | `unlockDoc(reposId,docId,path,name)` | POST /Doc/unlockDoc.do | `{"vid":"int(必填)","docId":"long(必填)","path":"string(可选)","name":"string(可选)"}` | 解锁文档 |
| W12 | `create_doc_share` | `createDocShare(reposId,docId,path,name,shareType,sharePwd,expireTime)` | POST /Doc/createDocShare.do | `{"vid":"int(必填)","docId":"long(必填)","shareType":"int(可选)","sharePwd":"string(可选)","expireTime":"long(可选)"}` | 创建分享 |
| W13 | `backup_repos` | `backupRepos(reposId,backupStorePath)` | POST /Repos/backupRepos.do | `{"vid":"int(必填)","backupStorePath":"string(可选)"}` | 触发仓库备份 |
| W14 | `update_doc_content` | （组合：getDoc + addDoc content） | — | `{"vid":"int","docId":"long","content":"string(必填)","commitMsg":"string(可选)"}` | 更新文档内容（封装虚拟文档更新） |

---

## 4. 会话工具组（T3.4，3 个 — 默认不注册）

| # | Tool name | DocSysClient 方法 | 说明 | 处置 |
|---|-----------|-------------------|------|------|
| S1 | `login` | `login(username,password)` | 登录（密码 Base64） | **默认不注册**（Agent 复用 MxsDoc 会话） |
| S2 | `logout` | `logout()` | 登出 | **默认不注册**（会让 LLM 自主登出当前用户） |
| S3 | `register` | `register(userName,pwd,pwd2,verifyCode)` | 注册 | **默认不注册**（需验证码） |

---

## 5. 危险工具组（1 个 — 管理员白名单）

| # | Tool name | DocSysClient 方法 | 说明 | 处置 |
|---|-----------|-------------------|------|------|
| D1 | `doc_sys_init` | `docSysInit(authCode)` | 系统初始化/重置数据库 | **默认不注册**；仅管理员且显式授权后注册 |

---

## 6. 辅助方法（非工具，不进 ToolRegistry）

`getBaseUrl()` / `isLoggedIn()` / `getCurrentUsername()` / `setSessionCookie()` / `copy()` / `copyWithSession()` —— 内部基础设施，不暴露给 LLM。

> R3-5（2026-09-21）：`getSessionCookie()` / `getManagerReposList()` / `getSystemEmailConfig()` 为**零调用者**，已从 `DocSysClient` 删除；仅被 `DocSysCLI`/旧编排使用的方法保留（R3-4 方案 1 = CLI 不动）。

---

## 7. Tool 注册决策（T3.x 依据）

| 阶段 | 注册范围 | 说明 |
|------|----------|------|
| **T3.1 只读**（先做） | R1-R16（16 个） | 全部注册；R17/R18（ai_chat/rag_chat）视情况——与 LLMService 直连能力重叠，建议 R9 search_docs 已覆盖搜索场景，先不注册 |
| **T3.2 写** | W1-W14 | 全部注册但 `needsConfirm=true`；先接 SSE confirm 再放开 |
| **T3.4 会话** | 无 | 默认不注册（Agent 已共享会话，LLM 无需登录/登出） |
| **D1** | 无 | 仅管理员授权场景 |

> 决策理由：Agent 复用 MxsDoc 共享会话（`copyWithSession`），LLM 不应具备登录/登出/注册能力——会话一致性由系统保证，交给 LLM 是安全漏洞。

---

## 8. 下一步（T1.2）

基于本清单开始实现 `ToolDefinition` 模型：
- 每个工具一个 `ToolDefinition`（name/description/parameters JSON Schema/executor 闭包/isWrite/needsConfirm）。
- 优先实现 R2 `list_repos` + R9 `search_docs` 两个工具作为 T2.1 端到端验证用。
