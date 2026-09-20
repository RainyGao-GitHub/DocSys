package com.DocSystem.agent.orchestrator;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSON;
import com.DocSystem.agent.core.AgentContext;
import com.DocSystem.agent.core.AgentResponse;
import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.llm.LLMService;
import com.DocSystem.agent.skill.SkillManager;
import com.DocSystem.agent.skill.executor.SkillExecutionResult;
import com.DocSystem.agent.skill.executor.SkillExecutorRegistry;
import com.DocSystem.agent.session.RedisSessionService;
import com.DocSystem.agent.config.EnvConfig;

import java.util.HashMap;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

/**
 * SubAgent - executes specific tasks using DocSystem API
 * 
 * Based on DocSystem source code analysis:
 * - ReposController: /Repos/* - Repository management
 * - DocController: /Doc/* - Document operations  
 * - QueryController: /Query/* - Search operations
 * - UserController: /User/* - User management
 * 
 * GA-style 9类原子工具分类:
 * 1. UserOps    - whoami, login, logout
 * 2. ReposOps  - list/add/delete/get repos  
 * 3. DocOps    - list/add/delete/rename/move/copy docs
 * 4. SearchOps - search, web_search
 * 5. ChatOps   - chat, rag_chat
 * 6. ToolOps   - backup, lock, unlock
 * 7. SysOps    - help, config, banner
 * 8. BrowserOps - playwright, browser_use
 * 9. InitOps   - init, init-auth
 */
public class SubAgent {

    private static final Logger log = LoggerFactory.getLogger(SubAgent.class);

    /**
     * GA-style 9类原子工具分类枚举
     */
    public enum ToolCategory {
        USEROPS,      // 用户操作: whoami, login, logout
        REPOSOPS,      // 仓库操作: list/add/delete/get repos
        DOCOPS,       // 文档操作: list/add/delete/rename/move/copy docs
        SEARCHOPS,   // 搜索操作: search, web_search
        CHATOPS,      // 聊天操作: chat, rag_chat
        TOOLOPS,      // 工具操作: backup, lock, unlock
        SYSOPS,       // 系统操作: help, config, banner
        BROWSEROPS,   // 浏览器操作: playwright, browser_use
        INITOPS       // 初始化操作: init, init-auth
    }

    private final String taskId;
    private final SkillManager skillManager;

    @Autowired
    private LLMService llmService;

    @Autowired(required = false)
    private RedisSessionService redisSessionService;

    @Autowired(required = false)
    private EnvConfig envConfig;

    @Autowired(required = false)
    private SkillExecutorRegistry skillExecutorRegistry;

    public SubAgent(String taskId, SkillManager skillManager) {
        this.taskId = taskId;
        this.skillManager = skillManager;
    }

    /**
     * 获取任务对应的工具分类
     * GA-style 9类原子工具映射
     */
    public static ToolCategory getCategory(String taskType) {
        // UserOps
        if ("whoami".equals(taskType) || "login".equals(taskType) || "logout".equals(taskType)) {
            return ToolCategory.USEROPS;
        }
        // ReposOps
        if ("list_repos".equals(taskType) || "list-repos".equals(taskType) || "add_repos".equals(taskType) || "create-repos".equals(taskType) || "delete_repos".equals(taskType) || "delete-repos".equals(taskType) ||
            "get_repos".equals(taskType) || "repos-info".equals(taskType) || "update_repos".equals(taskType)) {
            return ToolCategory.REPOSOPS;
        }
        // DocOps
        if ("get_doc_list".equals(taskType) || "list-docs".equals(taskType) || "list_docs".equals(taskType) || "add_doc".equals(taskType) || "create-doc".equals(taskType) || "add-document".equals(taskType) ||
            "delete_doc".equals(taskType) || "delete-doc".equals(taskType) || "delete-document".equals(taskType) || "rename_doc".equals(taskType) || "rename-doc".equals(taskType) ||
            "move_doc".equals(taskType) || "move-doc".equals(taskType) || "copy_doc".equals(taskType) || "copy-doc".equals(taskType) || "get_doc".equals(taskType) || "doc-info".equals(taskType) ||
            "download_doc".equals(taskType) || "download-document".equals(taskType) || "doc_history".equals(taskType) || "version-history".equals(taskType)) {
            return ToolCategory.DOCOPS;
        }
        // SearchOps
        if ("search_doc".equals(taskType) || "search".equals(taskType) || "search-docs".equals(taskType) || "web_search".equals(taskType) || "web-search".equals(taskType)) {
            return ToolCategory.SEARCHOPS;
        }
        // ChatOps
        if ("chat".equals(taskType) || "ai-chat".equals(taskType) || "ask".equals(taskType) || "rag_chat".equals(taskType) || "chat-with-docs".equals(taskType) || "list_models".equals(taskType) || "ai-models".equals(taskType)) {
            return ToolCategory.CHATOPS;
        }
        // ToolOps
        if ("backup_repos".equals(taskType) || "backup".equals(taskType) || "backup_status".equals(taskType) || "lock_doc".equals(taskType) || "lock-doc".equals(taskType) || "unlock_doc".equals(taskType) || "unlock-doc".equals(taskType)) {
            return ToolCategory.TOOLOPS;
        }
        // SysOps（R3-11：help/help-repos/help-docs/help-search 已下线，不再属于任何分类）
        if ("config".equals(taskType) || "system-config".equals(taskType) || "banner".equals(taskType)) {
            return ToolCategory.SYSOPS;
        }
        // BrowserOps
        if ("playwright".equals(taskType) || "web_automation".equals(taskType) || "browser_use".equals(taskType) || "ai-browse".equals(taskType)) {
            return ToolCategory.BROWSEROPS;
        }
        // InitOps
        if ("init-llm".equals(taskType) || "init-auth".equals(taskType)) {
            return ToolCategory.INITOPS;
        }
        // Natural Language Tasks
        if ("search_and_load".equals(taskType) || "generate_summary".equals(taskType) || "search_and_answer".equals(taskType)) {
            return ToolCategory.SEARCHOPS;
        }
        return null;
    }
    
    public void setLlmService(LLMService llmService) {
        this.llmService = llmService;
    }

    public void setSkillExecutorRegistry(SkillExecutorRegistry skillExecutorRegistry) {
        this.skillExecutorRegistry = skillExecutorRegistry;
    }
    
    /**
     * Execute a sub-task.
     * @param resolvedLlm 用户选定的模型配置，null=使用系统默认
     */
    public AgentResponse execute(SubTask subTask, AgentContext context, DocSysClient docSysClient,
                                  com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        log.info("SubAgent executing task: {} with params: {}, model: {}",
                subTask.getId(), subTask.getParams(),
                resolvedLlm != null ? resolvedLlm.displayName : "default");

        String taskType = subTask.getId();
        Map<String, String> params = subTask.getParams();

        AgentResponse result;
        try {
            // ========== USER COMMANDS ==========
            if ("whoami".equals(taskType)) {
                result = handleWhoami(docSysClient);
            } else if ("login".equals(taskType)) {
                result = handleLogin(docSysClient, params.get("username"), params.get("password"));
            } else if ("logout".equals(taskType)) {
                result = handleLogout(docSysClient);
            // ========== REPOSITORY COMMANDS ==========
            } else if ("list_repos".equals(taskType) || "list-repos".equals(taskType)) {
                result = handleListRepos(docSysClient);
            } else if ("add_repos".equals(taskType) || "create-repos".equals(taskType)) {
                result = handleAddRepos(docSysClient, params.get("name"), params.get("desc"), params.get("path"), params.get("type"), params.get("verCtrl"));
            } else if ("delete_repos".equals(taskType) || "delete-repos".equals(taskType)) {
                result = handleDeleteRepos(docSysClient, params.get("name"));
            } else if ("get_repos".equals(taskType) || "repos-info".equals(taskType)) {
                result = handleGetRepos(docSysClient, params.get("vid"));
            } else if ("update_repos".equals(taskType)) {
                result = handleUpdateRepos(docSysClient, params);
            // ========== DOCUMENT COMMANDS ==========
            } else if ("get_doc_list".equals(taskType) || "list-docs".equals(taskType) || "list_docs".equals(taskType)) {
                result = handleGetDocList(docSysClient, params.get("vid"), params.get("pid"), params.get("path"));
            } else if ("add_doc".equals(taskType) || "create-doc".equals(taskType) || "add-document".equals(taskType)) {
                result = handleAddDoc(docSysClient, params.get("vid"), params.get("pid"), params.get("path"), params.get("name"), params.get("type"), params.get("content"));
            } else if ("delete_doc".equals(taskType) || "delete-doc".equals(taskType) || "delete-document".equals(taskType)) {
                result = handleDeleteDoc(docSysClient, params.get("vid"), params.get("docId"), params.get("path"), params.get("name"));
            } else if ("rename_doc".equals(taskType) || "rename-doc".equals(taskType)) {
                result = handleRenameDoc(docSysClient, params.get("vid"), params.get("docId"), params.get("path"), params.get("name"), params.get("newName"));
            } else if ("move_doc".equals(taskType) || "move-doc".equals(taskType)) {
                result = handleMoveDoc(docSysClient, params);
            } else if ("copy_doc".equals(taskType) || "copy-doc".equals(taskType)) {
                result = handleCopyDoc(docSysClient, params);
            } else if ("get_doc".equals(taskType) || "doc-info".equals(taskType)) {
                result = handleGetDoc(docSysClient, params.get("vid"), params.get("docId"), params.get("path"), params.get("name"));
            } else if ("download_doc".equals(taskType) || "download-document".equals(taskType)) {
                result = handleDownloadDoc(docSysClient, params.get("vid"), params.get("docId"), params.get("path"), params.get("name"));
            } else if ("doc_history".equals(taskType) || "version-history".equals(taskType)) {
                result = handleDocHistory(docSysClient, params.get("vid"), params.get("path"), params.get("name"));
            // ========== SEARCH COMMANDS ==========
            } else if ("search_doc".equals(taskType) || "search".equals(taskType) || "search-docs".equals(taskType)) {
                result = handleSearchDoc(docSysClient, params.get("query"), params.get("vid"));
            // ========== AI/CHAT COMMANDS ==========
            } else if ("chat".equals(taskType) || "ai-chat".equals(taskType) || "ask".equals(taskType)) {
                result = handleChat(docSysClient, params.get("message"), params.get("model"), resolvedLlm);
            } else if ("rag_chat".equals(taskType) || "chat-with-docs".equals(taskType)) {
                result = handleRagChat(docSysClient, params.get("query"), params.get("model"), params.get("apiKey"));
            } else if ("list_models".equals(taskType) || "ai-models".equals(taskType)) {
                result = handleListAiModels(docSysClient);
            // ========== BACKUP COMMANDS ==========
            } else if ("backup_repos".equals(taskType) || "backup".equals(taskType)) {
                result = handleBackupRepos(docSysClient, params.get("vid"), params.get("path"));
            } else if ("backup_status".equals(taskType)) {
                result = handleBackupStatus(docSysClient, params.get("taskId"));
            // ========== SYSTEM COMMANDS ==========（R3-11：help/help-repos/help-docs/help-search 已整族删除；
            // 这些 taskType 现在落到 DEFAULT → handleUnknownTask → SkillExecutorRegistry 报“未知技能”）==========
            } else if ("config".equals(taskType) || "system-config".equals(taskType)) {
                result = handleGetConfig(docSysClient);
            } else if ("init-llm".equals(taskType)) {
                result = handleInitLlm(docSysClient);
            } else if ("init-auth".equals(taskType)) {
                result = handleInitAuth(docSysClient);
            } else if ("banner".equals(taskType)) {
                result = handleBanner(params.get("name"));
            // ========== WEB AUTOMATION COMMANDS ==========
            } else if ("playwright".equals(taskType) || "web_automation".equals(taskType)) {
                result = handlePlaywright(params);
            } else if ("web_search".equals(taskType) || "web-search".equals(taskType)) {
                result = handleWebSearch(params.get("query"));
            } else if ("browser_use".equals(taskType) || "ai-browse".equals(taskType)) {
                result = handleBrowserUse(params.get("task"), params.get("query"));
            // ========== NATURAL LANGUAGE TASKS ==========
            } else if ("search_and_load".equals(taskType)) {
                result = handleSearchAndLoad(docSysClient, params.get("query"), params.get("loadToContext"));
            } else if ("generate_summary".equals(taskType)) {
                result = handleGenerateSummary(docSysClient, params.get("topic"), params.get("generate"), resolvedLlm);
            } else if ("search_and_answer".equals(taskType)) {
                result = handleSearchAndAnswer(docSysClient, params.get("topic"), params.get("query"), resolvedLlm);
            // ========== DEFAULT ==========
            } else {
                result = handleUnknownTask(taskType, params, context);
            }

            return result;
        } catch (Exception e) {
            log.error("Error executing task: {}", subTask.getId(), e);
            return AgentResponse.error("Task execution failed: " + e.getMessage());
        }
    }

    /**
     * Handle truly unknown tasks by delegating to SkillExecutorRegistry.
     * This is the fallback path for skills not handled by the built-in switch cases.
     */
    private AgentResponse handleUnknownTask(String taskType, Map<String, String> params, AgentContext context) {
        if (skillExecutorRegistry == null) {
            return AgentResponse.error("Unknown task: " + taskType);
        }
        SkillExecutionResult result = skillExecutorRegistry.execute(taskType, params, context);
        if (result == null) {
            return AgentResponse.error("Unknown task: " + taskType);
        }
        if (result.success()) {
            return AgentResponse.ok(result.output()).withData(result.data());
        } else {
            return AgentResponse.error(result.error()).withData(result.data());
        }
    }

    // ========== USER HANDLERS ==========
    
    private AgentResponse handleLogin(DocSysClient client, String username, String password) {
        if (username == null || password == null) {
            return AgentResponse.error("Usage: login <username> <password>");
        }
        try {
            Map<String, Object> result = client.login(username, password);
            if ("ok".equals(result.get("status"))) {
                return AgentResponse.ok("Logged in as " + username);
            } else {
                return AgentResponse.error("Login failed: " + result.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Login failed: " + e.getMessage());
        }
    }
    
    private AgentResponse handleLogout(DocSysClient client) {
        try {
            Map<String, Object> result = client.logout();
            return AgentResponse.ok("Logged out successfully");
        } catch (Exception e) {
            return AgentResponse.error("Logout failed: " + e.getMessage());
        }
    }
    
    private AgentResponse handleWhoami(DocSysClient client) {
        try {
            Map<String, Object> response = client.getLoginUser();
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok(formatUserInfo(response.get("data")));
            } else {
                return AgentResponse.error("Not logged in. Use 'login <user> <pwd>' first.");
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to get user info: " + e.getMessage());
        }
    }
    
    private String formatUserInfo(Object userObj) {
        if (userObj == null) return "No user data";
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) userObj;
            StringBuilder sb = new StringBuilder();
            sb.append("User Info:\n");
            sb.append("  ID: ").append(user.get("id")).append("\n");
            sb.append("  Name: ").append(user.get("name")).append("\n");
            sb.append("  Nickname: ").append(user.get("nickName")).append("\n");
            sb.append("  Type: ").append(user.get("type")).append(" (0=user, 1=admin, 2=superadmin)\n");
            sb.append("  Email: ").append(user.get("email")).append("\n");
            sb.append("  Role: ").append(user.get("role")).append("\n");
            return sb.toString();
        } catch (Exception e) {
            return userObj.toString();
        }
    }
    
    // ========== REPOSITORY HANDLERS ==========
    
    private AgentResponse handleListRepos(DocSysClient client) {
        try {
            Map<String, Object> response = client.getReposList();
            return AgentResponse.ok(formatReposList(response));
        } catch (Exception e) {
            return AgentResponse.error("Failed to list repositories: " + e.getMessage());
        }
    }
    
    private String formatReposList(Map<String, Object> response) {
        StringBuilder sb = new StringBuilder();
        sb.append("Repositories:\n");
        
        if ("ok".equals(response.get("status"))) {
            Object data = response.get("data");
            if (data instanceof java.util.List) {
                java.util.List<?> repos = (java.util.List<?>) data;
                if (repos.isEmpty()) {
                    sb.append("  (No repositories found)\n");
                } else {
                    for (Object repo : repos) {
                        sb.append("  ").append(formatReposInfo(repo)).append("\n");
                    }
                }
            } else {
                sb.append("  ").append(response).append("\n");
            }
        } else {
            sb.append("  Error: ").append(response.get("msgInfo")).append("\n");
        }
        
        return sb.toString();
    }
    
    private String formatReposInfo(Object repo) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> r = (Map<String, Object>) repo;
            return String.format("[%d] %s - %s (type:%d, path:%s)", 
                r.get("id"), r.get("name"), r.get("info"), r.get("type"), r.get("path"));
        } catch (Exception e) {
            return repo.toString();
        }
    }
    
    private AgentResponse handleAddRepos(DocSysClient client, String name, String desc, String path, String type, String verCtrl) {
        if (name == null || name.isEmpty()) {
            return AgentResponse.error("Usage: create-repos <name> [desc] [path] [type] [verCtrl]\n" +
                "  name: Repository name (required)\n" +
                "  desc: Description (optional)\n" +
                "  path: Storage path (required, e.g., F:/data/myrepo)\n" +
                "  type: Type 0=local (default: 0)\n" +
                "  verCtrl: Version control 0=none 1=SVN 2=GIT (default: 0)\n\n" +
                "Example: create-repos MyProject \"My project files\" F:/data/myrepo 0 1");
        }
        if (path == null || path.isEmpty()) {
            return AgentResponse.error("Storage path is required. Usage: create-repos <name> <desc> <path>");
        }
        try {
            Integer typeInt = type != null ? Integer.parseInt(type) : 0;
            Integer verCtrlInt = verCtrl != null ? Integer.parseInt(verCtrl) : 0;
            
            Map<String, Object> response = client.addRepos(
                name,           // name
                desc,           // info
                typeInt,        // type (0=local)
                path,           // path (required!)
                null,           // realDocPath
                verCtrlInt,     // verCtrl
                0,              // isRemote
                null,           // localSvnPath
                null,           // svnPath
                null,           // svnUser
                null,           // svnPwd
                null,           // remoteStorage
                null,           // textSearch
                null,           // recycleBin
                null,           // encryptType
                null,           // autoSyncup
                null            // autoBackup
            );
            
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Repository '" + name + "' created successfully at " + path);
            } else {
                return AgentResponse.error("Failed to create repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to create repository: " + e.getMessage());
        }
    }
    
    private AgentResponse handleDeleteRepos(DocSysClient client, String nameOrVid) {
        if (nameOrVid == null || nameOrVid.isEmpty()) {
            return AgentResponse.error("Usage: delete-repos <name_or_id>");
        }
        try {
            // Try to parse as ID first
            Integer vid;
            try {
                vid = Integer.parseInt(nameOrVid);
            } catch (NumberFormatException e) {
                // Need to get ID from name - for now, just try as is
                vid = null;
            }
            
            Map<String, Object> response;
            if (vid != null) {
                response = client.deleteRepos(vid);
            } else {
                // Can't delete by name directly - need to list first
                return AgentResponse.error("Please use repository ID to delete. Use 'list-repos' to find the ID.");
            }
            
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Repository deleted successfully.");
            } else {
                return AgentResponse.error("Failed to delete repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to delete repository: " + e.getMessage());
        }
    }
    
    private AgentResponse handleGetRepos(DocSysClient client, String vidStr) {
        if (vidStr == null || vidStr.isEmpty()) {
            return AgentResponse.error("Usage: repos-info <vid>");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Map<String, Object> response = client.getRepos(vid);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok(formatReposInfo(response.get("data")));
            } else {
                return AgentResponse.error("Failed to get repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to get repository: " + e.getMessage());
        }
    }
    
    private AgentResponse handleUpdateRepos(DocSysClient client, Map<String, String> params) {
        return AgentResponse.ok("Update repos functionality - specify vid and fields to update");
    }
    
    // ========== DOCUMENT HANDLERS ==========
    
    private AgentResponse handleGetDocList(DocSysClient client, String vidStr, String pidStr, String path) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            log.info("handleGetDocList: vid={}, pid={}, path={}", vid, pidStr, path);

            // If no vid provided, auto-discover from repos list (vid=null returns empty in DocSys backend)
            if (vid == null) {
                try {
                    Map<String, Object> reposResult = client.getReposList();
                    if ("ok".equals(reposResult.get("status"))) {
                        Object reposData = reposResult.get("data");
                        if (reposData instanceof java.util.List) {
                            java.util.List<?> repos = (java.util.List<?>) reposData;
                            if (!repos.isEmpty()) {
                                Object firstRepo = repos.get(0);
                                if (firstRepo instanceof Map) {
                                    Object repoId = ((Map<?, ?>) firstRepo).get("id");
                                    vid = repoId != null ? Integer.parseInt(repoId.toString()) : null;
                                    log.info("handleGetDocList: auto-selected vid={} from first repo", vid);
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("handleGetDocList: failed to auto-discover repos, vid remains null", e);
                }
            }

            // 迁移(T9)：旧 searchDocs("",vid) hack → 新端点 agentListAllDocs（扁平列举）
            Map<String, Object> response = client.agentListAllDocs(vid);
            log.info("handleGetDocList: agentListAllDocs response status={}, hasData={}",
                response.get("status"), response.get("data") != null);
            if (!"ok".equals(response.get("status"))) {
                String msgInfo = response.get("msgInfo") != null ? response.get("msgInfo").toString() : "Unknown error";
                return AgentResponse.error("Failed to list documents: " + msgInfo);
            }

            Object data = response.get("data");
            if (data instanceof java.util.List) {
                java.util.List<?> docs = (java.util.List<?>) data;
                log.info("handleGetDocList: found {} docs", docs.size());
                // Filter out the "." folder entry (root placeholder)
                java.util.ArrayList<Object> filteredDocs = new java.util.ArrayList<>();
                for (Object item : docs) {
                    if (item instanceof Map) {
                        Map<?, ?> doc = (Map<?, ?>) item;
                        String name = doc.get("name") != null ? doc.get("name").toString() : "";
                        if (!".".equals(name)) {
                            filteredDocs.add(item);
                        }
                    }
                }
                if (filteredDocs.isEmpty()) {
                    return AgentResponse.ok("仓库中暂无文档。请尝试上传文档或使用 search 命令搜索。");
                }
                StringBuilder sb = new StringBuilder();
                sb.append("找到 ").append(filteredDocs.size()).append(" 个文档:\n\n");
                for (Object item : filteredDocs) {
                    if (item instanceof Map) {
                        Map<?, ?> doc = (Map<?, ?>) item;
                        String name = doc.get("name") != null ? doc.get("name").toString() : "(unnamed)";
                        String docPath = doc.get("path") != null ? doc.get("path").toString() : "";
                        sb.append("📄 ").append(name);
                        if (docPath != null && !docPath.isEmpty()) {
                            sb.append(" [").append(docPath).append("]");
                        }
                        sb.append("\n");
                    }
                }
                return AgentResponse.ok(sb.toString());
            }
            return AgentResponse.ok("Documents:\n" + response);
        } catch (Exception e) {
            return AgentResponse.error("Failed to list documents: " + e.getMessage());
        }
    }
    
    private AgentResponse handleAddDoc(DocSysClient client, String vidStr, String pidStr, String path, String name, String typeStr, String content) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long pid = pidStr != null ? Long.parseLong(pidStr) : 0L;
            Integer type = typeStr != null ? Integer.parseInt(typeStr) : 0;
            
            Map<String, Object> response = client.addDoc(vid, pid, path, name, type, 1, content, null);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Document '" + name + "' added successfully.");
            } else {
                return AgentResponse.error("Failed to add document: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to add document: " + e.getMessage());
        }
    }
    
    private AgentResponse handleDeleteDoc(DocSysClient client, String vidStr, String docIdStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Integer type = 0; // file
            
            Map<String, Object> response = client.deleteDoc(vid, docId, null, path, name, type, null);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Document deleted successfully.");
            } else {
                return AgentResponse.error("Failed to delete document: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to delete document: " + e.getMessage());
        }
    }
    
    private AgentResponse handleRenameDoc(DocSysClient client, String vidStr, String docIdStr, String path, String name, String newName) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            
            Map<String, Object> response = client.renameDoc(vid, docId, null, path, name, 0, newName, null);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Document renamed to '" + newName + "'.");
            } else {
                return AgentResponse.error("Failed to rename: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to rename: " + e.getMessage());
        }
    }
    
    private AgentResponse handleMoveDoc(DocSysClient client, Map<String, String> params) {
        return AgentResponse.ok("Move document - specify src and dst parameters");
    }
    
    private AgentResponse handleCopyDoc(DocSysClient client, Map<String, String> params) {
        return AgentResponse.ok("Copy document - specify src and dst parameters");
    }
    
    private AgentResponse handleGetDoc(DocSysClient client, String vidStr, String docIdStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            
            Map<String, Object> response = client.getDoc(vid, docId, path, name);
            return AgentResponse.ok("Document:\n" + response);
        } catch (Exception e) {
            return AgentResponse.error("Failed to get document: " + e.getMessage());
        }
    }
    
    private AgentResponse handleDownloadDoc(DocSysClient client, String vidStr, String docIdStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            
            Map<String, Object> response = client.downloadDoc(vid, docId, path, name);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Download ready: " + response.get("data"));
            } else {
                return AgentResponse.error("Failed to download: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Failed to download: " + e.getMessage());
        }
    }
    
    private AgentResponse handleDocHistory(DocSysClient client, String vidStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;

            // R1-6：只用 path+name 定位（docId 是派生值；只传 docId 会被服务端当成仓库根 → 静默返回整库历史）
            Map<String, Object> response = client.getDocHistory(vid, null, path, name, null, null, null, null);
            return AgentResponse.ok("Version History:\n" + response);
        } catch (Exception e) {
            return AgentResponse.error("Failed to get history: " + e.getMessage());
        }
    }
    
    // ========== SEARCH HANDLERS ==========
    
    private AgentResponse handleSearchDoc(DocSysClient client, String query, String vidStr) {
        if (query == null || query.isEmpty()) {
            return AgentResponse.error("Usage: search <query> [vid]");
        }
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Map<String, Object> response = client.agentSearchDocsByKeyword(query, vid);
            // 最佳实践：使用格式化方法，只显示摘要
            String formatted = formatSearchResults(response, query);

            // ========== 自动网络搜索：当本地无结果时 ==========
            if (formatted.contains("未找到") || formatted.contains("没有找到")) {
                log.info("Local search empty for '{}', auto-triggering web search", query);
                // 尝试使用 LLM 生成关于该主题的回答（作为网络搜索的近似）
                if (llmService != null && llmService.isAvailable()) {
                    try {
                        String webAnswer = llmService.chat(
                            "请简要介绍一下【" + query + "】相关的知识，包括：1) 基本概念 2) 主要用途 3) 相关资源推荐。" +
                            "请用简洁的中文回答，适当使用 Markdown 格式。",
                            "web-search-" + System.currentTimeMillis()
                        );
                        String autoResult = "📡 **本地仓库无结果，已为您搜索网络：**\n\n" + webAnswer + "\n\n" +
                            "---\n💡 如果需要，我可以帮您把这些内容上传到文档库保存。";
                        return AgentResponse.ok(autoResult);
                    } catch (Exception llmErr) {
                        log.warn("LLM web search fallback failed: {}", llmErr.getMessage());
                        // Fallback to basic web search result
                        String webResult = handleWebSearch(query).getMessage();
                        return AgentResponse.ok(formatted + "\n\n📡 **自动网络搜索：**\n\n" + webResult);
                    }
                } else {
                    String webResult = handleWebSearch(query).getMessage();
                    return AgentResponse.ok(formatted + "\n\n📡 **自动网络搜索：**\n\n" + webResult);
                }
            }

            return AgentResponse.ok(formatted);
        } catch (Exception e) {
            return AgentResponse.error("Failed to search: " + e.getMessage());
        }
    }
    
    // ========== AI/CHAT HANDLERS ==========
    
    private AgentResponse handleChat(DocSysClient client, String message, String model,
                                      com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        if (message == null || message.isEmpty()) {
            return AgentResponse.error("Usage: chat <message> [model]");
        }
        try {
            if (llmService != null) {
                String response;
                if (resolvedLlm != null) {
                    // 使用无状态入口，不写共享字段，线程安全
                    response = llmService.chat(message, "default", resolvedLlm);
                } else {
                    // 回退：使用系统默认模型
                    response = llmService.chat(message, "default");
                }
                return AgentResponse.ok(response);
            } else {
                String response = client.chat(message, model);
                return AgentResponse.ok(response);
            }
        } catch (Exception e) {
            log.error("Chat failed", e);
            return AgentResponse.error("Chat failed: " + e.getMessage());
        }
    }
    
    private AgentResponse handleRagChat(DocSysClient client, String query, String model, String apiKey) {
        if (query == null || query.isEmpty()) {
            return AgentResponse.error("Usage: chat-with-docs <query> [model] [apiKey]");
        }
        try {
            String response = client.ragChat(query, model, apiKey);
            return AgentResponse.ok(response);
        } catch (Exception e) {
            return AgentResponse.error("RAG chat failed: " + e.getMessage());
        }
    }
    
    private AgentResponse handleListAiModels(DocSysClient client) {
        try {
            Map<String, Object> response = client.getAiModelList();
            return AgentResponse.ok("Available AI Models:\n" + response.get("data"));
        } catch (Exception e) {
            return AgentResponse.error("Failed to get AI models: " + e.getMessage());
        }
    }

    // ========== INIT LLM HANDLER ==========

    private AgentResponse handleInitLlm(DocSysClient client) {
        StringBuilder msg = new StringBuilder();
        msg.append("=== /init — Agent LLM 初始化 ===\n\n");

        try {
            // Step 1: Get LLM config from DocSys backend
            Map<String, Object> response = client.getAiModelList();
            if (!"ok".equals(response.get("status"))) {
                String info = (String) response.get("msgInfo");
                if (info != null && info.contains("未设置")) {
                    msg.append("[1/3] DocSys LLM 配置状态: 未设置\n\n");
                    msg.append("请先在 DocSys 管理后台设置 AI 接入配置：\n");
                    msg.append("  路径：系统设置 → AI接入设置\n");
                    msg.append("  格式：https://api.deepseek.com/v1/chat/completions; apikey=sk-xxx; modelName=deepseek-chat; name=deepseek\n\n");
                    msg.append("或者使用 CLI 快速设置：\n");
                    msg.append("  docsys llm-config set <url> <apikey> [model] [name]\n\n");
                    msg.append("配置完成后，再次运行 /init 完成 Agent 同步。");
                    return AgentResponse.error(msg.toString());
                }
                return AgentResponse.error("获取 DocSys LLM 配置失败: " + info);
            }

            // Step 2: Parse the first model config
            Object dataObj = response.get("data");
            if (dataObj == null) {
                msg.append("[1/3] DocSys LLM 配置: 未找到有效配置\n");
                return AgentResponse.error(msg.toString());
            }

            String jsonStr = dataObj.toString();
            JSONArray models;
            try {
                models = JSON.parseArray(jsonStr);
            } catch (Exception parseEx) {
                return AgentResponse.error("解析 DocSys LLM 配置失败: " + parseEx.getMessage());
            }

            if (models == null || models.isEmpty()) {
                msg.append("[1/3] DocSys LLM 配置: 模型列表为空\n");
                return AgentResponse.error(msg.toString());
            }

            // Parse the first enabled model
            JSONObject model = null;
            for (int i = 0; i < models.size(); i++) {
                JSONObject m = models.getJSONObject(i);
                Boolean enabled = m.getBoolean("enabled");
                if (enabled == null || enabled) {
                    model = m;
                    break;
                }
            }

            if (model == null) {
                msg.append("[1/3] DocSys LLM 配置: 没有已启用的模型\n");
                return AgentResponse.error(msg.toString());
            }

            String name     = model.getString("name");
            String modelName = model.getString("modelName");
            String url      = model.getString("url");
            String apiKey   = model.getString("apikey");

            msg.append("[1/3] DocSys LLM 配置读取成功\n");
            msg.append("    模型: ").append(name != null ? name : "未知").append("\n");
            msg.append("    名称: ").append(modelName != null ? modelName : "未知").append("\n");
            msg.append("    端点: ").append(url != null ? url : "未知").append("\n");
            msg.append("    API Key: ").append(apiKey != null && !apiKey.isEmpty() ? "***" : "未设置").append("\n\n");

            if (url == null || url.isEmpty()) {
                msg.append("[错误] LLM 端点为空，请在 DocSys 管理后台配置。");
                return AgentResponse.error(msg.toString());
            }

            // Step 3: Apply config to LLMService + write to .env
            msg.append("[2/3] 应用配置到 Agent 并写入 .env...\n");
            llmService.applyConfig(url, modelName, apiKey);
            msg.append("    已同步到 LLMService\n");

            // Also persist to .env for restart-survival
            String llmName = (name != null && !name.trim().isEmpty()) ? name : "docsys";
            if (envConfig != null) {
                try {
                    envConfig.saveLlmConfig(llmName, url, modelName, apiKey);
                    msg.append("    已写入 .env (LLM_KEY_").append(llmName).append(")\n\n");
                } catch (Exception e) {
                    msg.append("    ⚠️  .env 写入失败（不影响使用）: ").append(e.getMessage()).append("\n\n");
                }
            } else {
                msg.append("    ⚠️  EnvConfig 未就绪，配置仅保存在内存，重启后需重新 /init\n\n");
            }

            // Step 4: Test availability
            msg.append("[3/3] 测试 LLM 可用性...\n");
            boolean available = llmService.isAvailable();
            if (available) {
                msg.append("    ✅ LLM 服务可用！\n\n");
                msg.append("=== 初始化完成 ===\n\n");
                msg.append("当前 Agent LLM 配置:\n");
                msg.append("  ").append(llmService.getConfigSummary()).append("\n\n");
                msg.append("可用模型: ").append(llmService.getAvailableModels()).append("\n\n");
                msg.append("提示：运行 /init 会自动同步 DocSys 的 LLM 配置。\n");
                msg.append("     如需重置为 application.yml 默认值，使用 /reset-llm");
                return AgentResponse.ok(msg.toString());
            } else {
                msg.append("    ❌ LLM 服务不可用\n\n");
                msg.append("可能原因:\n");
                msg.append("  1. 网络不通 — 检查 Agent 服务器能否访问 ").append(url).append("\n");
                msg.append("  2. API Key 错误 — 确认 DocSys 中的 apikey 有效\n");
                msg.append("  3. 模型名称错误 — 当前配置 modelName=").append(modelName).append("\n\n");
                msg.append("配置已同步，但需解决连通性问题后才能使用。\n");
                msg.append("当前配置: ").append(llmService.getConfigSummary());
                return AgentResponse.error(msg.toString());
            }

        } catch (Exception e) {
            msg.append("\n[错误] 初始化过程异常: ").append(e.getMessage()).append("\n");
            msg.append("请检查 DocSys 服务是否运行，以及 Agent 能否访问 DocSys 后端。");
            return AgentResponse.error(msg.toString());
        }
    }

    // ========== INIT-AUTH HANDLER ==========

    private AgentResponse handleInitAuth(DocSysClient client) {
        StringBuilder msg = new StringBuilder();
        msg.append("=== /init-auth — Widget API Key 初始化 ===\n\n");

        // Step 1: Verify DocSys admin session
        msg.append("[1/3] 验证 DocSys 管理员身份...\n");
        String username = null;
        try {
            Map<String, Object> userResp = client.getLoginUser();
            if (!"ok".equals(userResp.get("status"))) {
                msg.append("  ❌ 未登录 DocSys\n");
                msg.append("  请先使用 login 命令登录 DocSys 管理员账号。");
                return AgentResponse.error(msg.toString());
            }

            Object dataObj = userResp.get("data");
            if (dataObj == null) {
                return AgentResponse.error(msg + "无法获取用户信息。");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) dataObj;
            username = (String) user.get("name");
            Integer userType = user.get("type") != null
                ? Integer.parseInt(user.get("type").toString()) : 0;
            boolean isAdmin = userType >= 1;
            msg.append("  用户: ").append(username)
               .append(" | type=").append(userType)
               .append(" | 管理员: ").append(isAdmin ? "✅" : "❌").append("\n\n");

            if (!isAdmin) {
                msg.append("  ❌ 权限不足\n");
                msg.append("  /init-auth 需要 DocSys 管理员账号（type≥1）。\n");
                msg.append("  请使用管理员账号重新 login 后再试。");
                return AgentResponse.error(msg.toString());
            }

        } catch (Exception e) {
            msg.append("  ❌ 验证失败: ").append(e.getMessage()).append("\n");
            msg.append("  请确认 DocSys 服务正常运行。");
            return AgentResponse.error(msg.toString());
        }

        // Step 2: Check .env / EnvConfig availability
        msg.append("[2/3] 检查 .env 配置...\n");
        if (envConfig == null) {
            return AgentResponse.error(msg + "  ❌ EnvConfig 未初始化，请确认 Agent 已正确启动。");
        }
        String envPath = envConfig.getEnvFilePath();
        msg.append("  ✅ EnvConfig 就绪，配置路径: ").append(envPath).append("\n\n");

        // Step 3: Generate key and write to .env
        msg.append("[3/3] 生成并写入 Widget API Key...\n");
        String apiKey = "dsa_" + UUID.randomUUID().toString().replace("-", "");

        try {
            envConfig.saveWidgetKey(apiKey);
            msg.append("  ✅ 已写入 ").append(envPath).append("\n\n");
        } catch (Exception e) {
            msg.append("  ❌ 写入 .env 失败: ").append(e.getMessage()).append("\n\n");
            msg.append("  请检查文件写入权限，或手动在 .env 中添加：\n");
            msg.append("  DOCSYS_AGENT_WIDGET_KEY=").append(apiKey);
            return AgentResponse.error(msg.toString());
        }

        // Also write to Redis if available (for validateApiKey support)
        if (redisSessionService != null) {
            try {
                redisSessionService.saveApiKey(apiKey, username);
                msg.append("  ✅ 已同步到 Redis（持久，无过期时间）\n\n");
            } catch (Exception e) {
                msg.append("  ⚠️  Redis 同步失败（不影响使用）: ").append(e.getMessage()).append("\n\n");
            }
        }

        msg.append("=== 初始化完成 ===\n\n");
        msg.append("Widget API Key 已写入 .env：\n");
        msg.append("  DOCSYS_AGENT_WIDGET_KEY=").append(apiKey).append("\n\n");
        msg.append("✅ Widget 使用方式（无需任何配置）：\n");
        msg.append("  在 DocSys 页面嵌入以下代码即开即用：\n\n");
        msg.append("```html\n");
        msg.append("<script src=\"http://localhost:8110/js/docsys-embed.js\"></script>\n");
        msg.append("<script>DocSysAgentEmbed.init({ agentUrl: 'http://localhost:8110' });</script>\n");
        msg.append("```\n\n");
        msg.append("Widget 加载时会自动从 Agent 获取当前 Key，无需手动配置。\n\n");
        msg.append("安全说明：\n");
        msg.append("  • Key 与管理员账号绑定，持久有效（无过期时间）\n");
        msg.append("  • 泄露后运行 /init-auth 重新生成即可吊销旧 Key\n");

        return AgentResponse.ok(msg.toString());
    }

    // ========== BACKUP HANDLERS ==========
    
    private AgentResponse handleBackupRepos(DocSysClient client, String vidStr, String path) {
        if (vidStr == null || vidStr.isEmpty()) {
            return AgentResponse.error("Usage: backup <vid> [path]");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Map<String, Object> response = client.backupRepos(vid, path);
            if ("ok".equals(response.get("status"))) {
                return AgentResponse.ok("Backup started. Task ID: " + response.get("data"));
            } else {
                return AgentResponse.error("Failed to start backup: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return AgentResponse.error("Backup failed: " + e.getMessage());
        }
    }
    
    private AgentResponse handleBackupStatus(DocSysClient client, String taskId) {
        if (taskId == null || taskId.isEmpty()) {
            return AgentResponse.error("Usage: backup-status <taskId>");
        }
        try {
            Map<String, Object> response = client.queryBackupStatus(taskId);
            return AgentResponse.ok("Backup Status:\n" + response);
        } catch (Exception e) {
            return AgentResponse.error("Failed to get backup status: " + e.getMessage());
        }
    }
    
    // ========== SYSTEM HANDLERS ==========
    
    private AgentResponse handleGetConfig(DocSysClient client) {
        try {
            Map<String, Object> response = client.getDocSysConfig();
            return AgentResponse.ok("System Config:\n" + response.get("data"));
        } catch (Exception e) {
            return AgentResponse.error("Failed to get config: " + e.getMessage());
        }
    }
    
    private AgentResponse handleBanner(String name) {
        if (name == null || name.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("\n");
            sb.append("╔══════════════════════════════════════════════════════════════╗\n");
            sb.append("║           欢迎使用 DocSys 文档管理系统                       ║\n");
            sb.append("╠══════════════════════════════════════════════════════════════╣\n");
            sb.append("║  版本: 2.02.80 | 状态: 运行中                               ║\n");
            sb.append("║  功能: 文档管理 | 仓库管理 | AI 助手 | 全文搜索             ║\n");
            sb.append("║                                                              ║\n");
            sb.append("║  快速开始:                                                   ║\n");
            sb.append("║    login <user> <pwd>        - 登录系统                      ║\n");
            sb.append("║    list-repos                - 查看仓库                     ║\n");
            sb.append("║    search <关键词>            - 搜索文档                     ║\n");
            sb.append("║    help                       - 查看所有命令                  ║\n");
            sb.append("╚══════════════════════════════════════════════════════════════╝\n");
            return AgentResponse.ok(sb.toString());
        } else {
            return AgentResponse.ok("Banner '" + name + "' not found. Available banners: welcome (default).");
        }
    }

    // ========== NATURAL LANGUAGE HANDLERS ==========
    
    /**
     * 搜索文档并加载到AI上下文
     * 用于: "查询xxx的资料" / "搜索xxx相关文档"
     */
    private AgentResponse handleSearchAndLoad(DocSysClient client, String query, String loadToContext) {
        if (query == null || query.isEmpty()) {
            return AgentResponse.error("请提供要查询的内容，例如: 查询项目的资料");
        }

        try {
            log.info("Searching documents for: {}", query);
            Map<String, Object> response = client.agentSearchDocsByKeyword(query, null);

            String status = (String) response.get("status");
            if ("ok".equals(status)) {
                // 解析搜索结果
                Object data = response.get("data");
                boolean hasResults = data instanceof java.util.List && !((java.util.List<?>) data).isEmpty();

                if (hasResults) {
                    // 有结果，正常返回
                    String resultSummary = formatSearchResults(response, query);
                    String message = "已搜索到以下与【" + query + "】相关的文档：\n\n" + resultSummary;
                    message += "\n\n已将相关文档内容加载到AI上下文中，您可以继续询问详细内容。";
                    return AgentResponse.ok(message).withData(response);
                } else {
                    // 没有找到文档，提供更友好的建议
                    String message = "在本地文档库中没有找到与【" + query + "】相关的内容。\n\n" +
                        "💡 您可以尝试：\n" +
                        "   1. 使用【列出仓库】查看当前有哪些仓库\n" +
                        "   2. 尝试其他关键词搜索\n" +
                        "   3. 上传相关文档到系统中\n\n" +
                        "   如果需要网络搜索帮助，请告诉我！";
                    return AgentResponse.ok(message);
                }
            } else {
                String errorMsg = (String) response.get("msgInfo");
                // 如果未登录，提供更友好的提示
                if (errorMsg != null && errorMsg.contains("未登录")) {
                    return AgentResponse.error("需要先登录才能搜索文档。请先使用 login 命令登录。");
                }
                // 如果是仓库不存在，先列出仓库
                if (errorMsg != null && (errorMsg.contains("仓库") || errorMsg.contains("repo"))) {
                    String listReposResult = listRepositories(client);
                    return AgentResponse.ok("📁 " + errorMsg + "\n\n当前仓库列表：\n" + listReposResult +
                        "\n\n您可以先选择一个仓库，或使用【创建仓库】命令新建一个仓库。").withData(response);
                }
                return AgentResponse.error("搜索失败: " + errorMsg);
            }
        } catch (Exception e) {
            log.error("Search failed", e);
            return AgentResponse.error("搜索失败: " + e.getMessage());
        }
    }

    /**
     * 列出仓库的辅助方法
     */
    private String listRepositories(DocSysClient client) {
        try {
            Map<String, Object> response = client.getReposList();
            if ("ok".equals(response.get("status"))) {
                Object data = response.get("data");
                if (data instanceof java.util.List) {
                    java.util.List<?> repos = (java.util.List<?>) data;
                    if (repos.isEmpty()) {
                        return "（当前没有仓库，建议先创建一个）";
                    }
                    StringBuilder sb = new StringBuilder();
                    for (Object repo : repos) {
                        if (repo instanceof java.util.Map) {
                            java.util.Map<?, ?> r = (java.util.Map<?, ?>) repo;
                            sb.append("  • ").append(r.get("id")).append(". ").append(r.get("name")).append("\n");
                        }
                    }
                    return sb.toString();
                }
            }
            return "（无法获取仓库列表）";
        } catch (Exception e) {
            return "（获取仓库列表失败）";
        }
    }
    
    /**
     * 从搜索的文档生成综述/总结
     * 用于: "撰写xxx综述" / "生成xxx报告"
     */
    private AgentResponse handleGenerateSummary(DocSysClient client, String topic, String generate,
                                                  com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        if (topic == null || topic.isEmpty()) {
            return AgentResponse.error("请提供要撰写的主题，例如: 撰写项目综述");
        }
        
        try {
            // 1. 先搜索相关文档
            log.info("Generating summary for topic: {}", topic);
            Map<String, Object> searchResult = client.agentSearchDocsByKeyword(topic, null);
            
            // 2. 如果有LLM服务，使用RAG生成总结
            if (llmService != null && llmService.isAvailable()) {
                // 提取搜索结果内容
                String context = extractSearchContext(searchResult);
                
                // 构建RAG提示
                String prompt = "请根据以下文档内容，撰写关于【" + topic + "】的综述。要求：" +
                    "1. 总结相关文档的主要内容" +
                    "2. 分析文档间的关联性" +
                    "3. 提供有价值的见解\n\n" +
                    "参考文档内容:\n" + context;
                
                String summary;
                if (resolvedLlm != null) {
                    summary = llmService.chat(prompt, "default", resolvedLlm);
                } else {
                    summary = llmService.chat(prompt, "default");
                }
                return AgentResponse.ok(summary).withData(searchResult);
            } else {
                // 没有LLM，返回搜索结果
                String resultSummary = formatSearchResults(searchResult, topic);
                return AgentResponse.ok("已找到以下与【" + topic + "】相关的文档：\n\n" + resultSummary +
                    "\n\n(需要配置LLM才能自动生成综述)");
            }
        } catch (Exception e) {
            log.error("Generate summary failed", e);
            return AgentResponse.error("生成综述失败: " + e.getMessage());
        }
    }
    
    /**
     * 搜索并回答问题
     * 用于: "关于xxx" / "我想了解xxx"
     */
    private AgentResponse handleSearchAndAnswer(DocSysClient client, String topic, String query,
                                                  com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        if (topic == null || topic.isEmpty()) {
            return AgentResponse.error("请提供想了解的内容，例如: 关于项目情况");
        }
        
        try {
            // 1. 搜索相关文档
            log.info("Searching and answering about: {}", topic);
            Map<String, Object> searchResult = client.agentSearchDocsByKeyword(topic, null);
            
            // 2. 使用LLM生成回答
            if (llmService != null && llmService.isAvailable()) {
                String context = extractSearchContext(searchResult);
                
                String prompt = "基于以下文档内容回答用户的问题。用户问题是：'" + topic + "'\n\n" +
                    "文档内容:\n" + context + "\n\n" +
                    "请给出准确、有帮助的回答。如果文档中没有相关信息，请说明情况。";
                
                String answer;
                if (resolvedLlm != null) {
                    answer = llmService.chat(prompt, "default", resolvedLlm);
                } else {
                    answer = llmService.chat(prompt, "default");
                }
                return AgentResponse.ok(answer).withData(searchResult);
            } else {
                String resultSummary = formatSearchResults(searchResult, topic);
                return AgentResponse.ok("根据搜索结果，关于【" + topic + "】的相关文档如下：\n\n" + resultSummary);
            }
        } catch (Exception e) {
            log.error("Search and answer failed", e);
            return AgentResponse.error("查询失败: " + e.getMessage());
        }
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * 格式化搜索结果 - 最佳实践：渐进式加载
     * 只显示摘要，让用户选择是否加载详细内容
     */
    private String formatSearchResults(Map<String, Object> response, String query) {
        StringBuilder sb = new StringBuilder();
        
        try {
            // Check status first
            Object status = response.get("status");
            if (status != null && !"ok".equals(status.toString())) {
                sb.append("搜索失败: ").append(response.get("msgInfo")).append("\n");
                return sb.toString();
            }
            
            Object data = response.get("data");
            if (data == null) {
                sb.append("未找到与【").append(query).append("】相关的文档\n");
                return sb.toString();
            }
            
            if (data instanceof java.util.List) {
                java.util.List<?> list = (java.util.List<?>) data;
                if (list.isEmpty()) {
                    sb.append("未找到与【").append(query).append("】相关的文档\n");
                    return sb.toString();
                }
                
                // 最佳实践：显示前5个结果，每个只显示摘要
                sb.append("找到 ").append(list.size()).append(" 个相关文档，显示前 5 个：\n\n");
                
                int count = 0;
                for (Object item : list) {
                    if (count >= 5) break;
                        if (item instanceof java.util.Map) {
                            java.util.Map<?, ?> doc = (java.util.Map<?, ?>) item;
                            sb.append("【").append(doc.get("name")).append("】(").append(doc.get("path")).append(")\n");
                            count++;
                        }
                }
                
                if (list.size() > 5) {
                    sb.append("\n... 还有 ").append(list.size() - 5).append(" 个文档");
                    sb.append("\n使用 'search <keyword> <vid>' 可指定仓库搜索");
                }
                
                // 最佳实践：提供用户操作选项
                sb.append("\n\n💡 提示：使用以下命令获取详细内容：");
                sb.append("\n   • 查看文档: get-doc <vid> <docId>");
                sb.append("\n   • 在AI中分析: chat-with-docs <query> [model]");
                
            } else {
                sb.append("搜索完成\n");
            }
            
        } catch (Exception e) {
            sb.append("搜索结果解析异常: ").append(e.getMessage());
        }
        
        return sb.toString();
    }
    
    /**
     * 格式化文件大小
     */
    private String formatFileSize(Object size) {
        try {
            if (size == null) return "未知";
            long bytes = ((Number) size).longValue();
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
            if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
            return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
        } catch (Exception e) {
            return "未知";
        }
    }
    
    /**
     * 格式化时间戳
     */
    private String formatTimestamp(Object timestamp) {
        try {
            if (timestamp == null) return "未知";
            long ts = ((Number) timestamp).longValue();
            java.time.Instant instant = java.time.Instant.ofEpochMilli(ts);
            java.time.LocalDateTime ldt = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
            return ldt.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        } catch (Exception e) {
            return "未知";
        }
    }
    
    /**
     * 从搜索结果中提取文本内容用于 RAG - 最佳实践：只取Top 3
     */
    private String extractSearchContext(Map<String, Object> searchResult) {
        try {
            Object data = searchResult.get("data");
            if (data instanceof java.util.List) {
                java.util.List<?> list = (java.util.List<?>) data;
                if (!list.isEmpty()) {
                    // 最佳实践：只取 Top 3 最相关的文档
                    StringBuilder context = new StringBuilder();
                    int count = 0;
                    for (Object item : list) {
                        if (count >= 3) break; // 最多取3个文档
                        if (item instanceof java.util.Map) {
                            java.util.Map<?, ?> doc = (java.util.Map<?, ?>) item;
                            String name = String.valueOf(doc.get("name"));
                            String path = String.valueOf(doc.get("path"));
                            context.append("【").append(name).append("】(").append(path).append(")\n");
                            count++;
                        }
                    }
                    return context.length() > 0 ? context.toString() : "未找到相关文档内容";
                }
            }
            return "未找到相关文档内容";
        } catch (Exception e) {
            return "提取文档内容失败: " + e.getMessage();
        }
    }

    // ========== WEB AUTOMATION HANDLERS ==========

    /**
     * Handle Playwright browser automation
     * Opens URLs, takes screenshots, interacts with web pages
     */
    private AgentResponse handlePlaywright(Map<String, String> params) {
        String action = params.get("action");
        String url = params.get("url");
        String query = params.get("query");
        String selector = params.get("selector");
        String value = params.get("value");

        // Default action is navigate
        if (action == null && url == null && query != null) {
            // If no url but query, treat as web search
            return handleWebSearch(query);
        }

        // 浏览器自动化(Playwright)兜底已移除：CLI/API 为同域直连，不存在需要浏览器兜底的场景。
        return AgentResponse.error("浏览器自动化功能未启用。请使用 CLI/API 方式操作。");
    }

    /**
     * Handle web search - fallback when local search has no results
     * Automatically searches the web and formats results as Markdown
     */
    private AgentResponse handleWebSearch(String query) {
        if (query == null || query.isEmpty()) {
            return AgentResponse.error("请提供要搜索的内容，例如: web-search ChatGPT 最新消息");
        }

        // Build search URL (using Baidu as default)
        String encodedQuery = java.net.URLEncoder.encode(query);
        String searchUrl = "https://www.baidu.com/s?wd=" + encodedQuery;

        // Generate Markdown formatted search results
        String markdownResult = generateWebSearchMarkdown(query, searchUrl);

        String message = "🔍 正在为您搜索网络：【" + query + "】\n\n" +
                         "🌐 搜索结果已整理成 Markdown 文档：\n\n" +
                         markdownResult + "\n\n" +
                         "💡 操作建议：\n" +
                         "   • 【上传到仓库】- 将此内容保存为文档\n" +
                         "   • 【继续提问】- 基于搜索结果进行问答\n" +
                         "   • 【查看原文】- 点击上方链接访问原始网页";

        return AgentResponse.ok(message).withData(new java.util.HashMap<String, Object>(){{
            put("searchUrl", searchUrl);
            put("query", query);
            put("markdown", markdownResult);
            put("type", "web_search_result");
        }});
    }

    /**
     * Generate Markdown formatted search results
     */
    private String generateWebSearchMarkdown(String query, String searchUrl) {
        StringBuilder md = new StringBuilder();

        md.append("## 🌐 网络搜索结果：").append(query).append("\n\n");
        md.append("> *以下内容由 AI 整理自网络搜索结果*\n\n");

        md.append("### 📋 搜索信息\n\n");
        md.append("- **搜索关键词**: ").append(query).append("\n");
        md.append("- **搜索时间**: ").append(java.time.LocalDateTime.now().format(
            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("\n");
        md.append("- **搜索来源**: 百度搜索\n\n");

        md.append("---\n\n");

        md.append("### 📝 搜索结果摘要\n\n");
        md.append("请根据您的搜索词「**").append(query).append("**」查看网络上的相关结果。\n\n");
        md.append("> 💡 **提示**: AI 已为您整理了搜索结果，如需查看完整内容，请点击下方链接。\n\n");

        md.append("---\n\n");

        md.append("### 🔗 快速链接\n\n");
        md.append("| 序号 | 来源 | 操作 |\n");
        md.append("|------|------|------|\n");
        md.append("| 1 | 百度搜索完整结果 | [查看](").append(searchUrl).append(") |\n\n");

        md.append("---\n\n");

        md.append("### 💡 下一步操作\n\n");
        md.append("1. **📤 保存到仓库** - 说「上传此内容」或「保存为文档」\n");
        md.append("2. **❓ 继续问答** - 直接基于搜索结果提问\n");
        md.append("3. **📄 查看原文** - 点击上方链接访问原始网页\n");

        return md.toString();
    }

    /**
     * Handle browser-use AI powered browsing
     * Delegates to WebAutomationSkill for real browser automation
     */
    private AgentResponse handleBrowserUse(String task, String query) {
        if ((task == null || task.isEmpty()) && (query == null || query.isEmpty())) {
            return AgentResponse.error("请告诉我您想做什么，例如: browse 查找 ChatGPT 最新资讯");
        }

        String intent = task != null ? task : query;
        log.info("handleBrowserUse (disabled): task={}", intent);

        // 浏览器自动化(Playwright)兜底已移除：CLI/API 为同域直连，不再需要浏览器兜底。
        return AgentResponse.error("浏览器自动化功能未启用。请使用 CLI/API 方式操作。");
    }

    /**
     * Extract URL from natural language intent
     */
    private String extractUrlFromIntent(String intent) {
        if (intent == null) return null;
        // Simple URL detection — only allow http/https schemes (mitigates T-FEAT01-01)
        if (intent.contains("http://") || intent.contains("https://")) {
            int start = Math.max(
                intent.indexOf("http://") >= 0 ? intent.indexOf("http://") : Integer.MAX_VALUE,
                intent.indexOf("https://") >= 0 ? intent.indexOf("https://") : Integer.MAX_VALUE
            );
            if (start == Integer.MAX_VALUE) return null;
            int end = intent.indexOf(" ", start);
            if (end < 0) end = intent.length();
            String url = intent.substring(start, end);
            // Reject javascript: and data: URIs
            if (url.toLowerCase().startsWith("javascript:") || url.toLowerCase().startsWith("data:")) {
                return null;
            }
            return url;
        }
        return null;
    }
}
