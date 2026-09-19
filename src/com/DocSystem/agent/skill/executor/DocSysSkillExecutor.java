package com.DocSystem.agent.skill.executor;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.core.AgentContext;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSON;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.HashSet;

/**
 * DocSysSkillExecutor - handles all built-in DocSys skill IDs.
 *
 * <p>Migrated from SubAgent.java switch-case handlers (lines 140-258).
 * Delegates to DocSysClient for all DocSystem API calls.
 * Skill IDs mirror the switch cases in SubAgent.execute().
 *
 * <p>Ordering: {@code @Order(100)} — runs after registry (0) but before
 * external skill executors (200+).
 */
@Component
@Order(100)
public class DocSysSkillExecutor implements SkillExecutor {

    private static final Logger log = LoggerFactory.getLogger(DocSysSkillExecutor.class);

    private final DocSysClient docSysClient;
    private final String docSysBaseUrl;

    @Override
    public int getOrder() {
        return 100;
    }

    @Autowired
    public DocSysSkillExecutor(
            @Value("${docsys.url:}") String docSysUrl,
            @Value("${docsys.api-key:}") String docSysApiKey) {
        this.docSysBaseUrl = docSysUrl;
        this.docSysClient = new DocSysClient(docSysUrl);
        log.info("DocSysSkillExecutor initialized with baseUrl={}", docSysUrl);
    }

    // For testing / manual construction
    public DocSysSkillExecutor(DocSysClient docSysClient) {
        this.docSysClient = docSysClient;
        this.docSysBaseUrl = "";
    }

    /**
     * All built-in skill IDs + aliases this executor can handle.
     * Updated to match SubAgent.getCategory() aliases (lines 91-118).
     */
    private static final Set<String> BUILT_IN_SKILL_IDS = new HashSet<>(Arrays.asList(
        // Repository skills
        "create_repos", "create-repos", "add_repos",
        "delete_repos", "delete-repos",
        "update_repos",
        "backup_repos", "backup",
        "backup_status",
        // Document skills
        "add_doc", "create-doc", "add-document",
        "delete_doc", "delete-doc", "delete-document",
        "rename_doc", "rename-doc",
        "move_doc", "move-doc",
        "copy_doc", "copy-doc",
        // System skills
        "help", "help-repos", "help-docs", "help-search",
        "banner",
        "init-llm", "init-auth",
        // Web automation skills
        "playwright", "web_automation",
        "web_search", "web-search",
        "browser_use", "ai-browse",
        // Natural language skills
        "search_and_load",
        "generate_summary",
        "search_and_answer"
    ));

    @Override
    public boolean canHandle(String skillId) {
        return skillId != null && BUILT_IN_SKILL_IDS.contains(skillId);
    }

    @Override
    public SkillExecutionResult execute(String skillId, Map<String, String> params, AgentContext context) {
        try {
            log.debug("DocSysSkillExecutor handling: {} params={}", skillId, params);
            // ---------- REPOS ----------
            if ("add_repos".equals(skillId) || "create-repos".equals(skillId)) return handleAddRepos(
                params.get("name"), params.get("desc"), params.get("path"),
                params.get("type"), params.get("verCtrl"));
            if ("delete_repos".equals(skillId) || "delete-repos".equals(skillId)) return handleDeleteRepos(params.get("name"));
            if ("update_repos".equals(skillId)) return handleUpdateRepos(params);
            if ("backup_repos".equals(skillId) || "backup".equals(skillId)) return handleBackupRepos(params.get("vid"), params.get("path"));
            if ("backup_status".equals(skillId)) return handleBackupStatus(params.get("taskId"));
            // ---------- DOCS ----------
            if ("add_doc".equals(skillId) || "create-doc".equals(skillId) || "add-document".equals(skillId)) return handleAddDoc(
                params.get("vid"), params.get("pid"), params.get("path"),
                params.get("name"), params.get("type"), params.get("content"));
            if ("delete_doc".equals(skillId) || "delete-doc".equals(skillId) || "delete-document".equals(skillId)) return handleDeleteDoc(
                params.get("vid"), params.get("docId"), params.get("path"), params.get("name"));
            if ("rename_doc".equals(skillId) || "rename-doc".equals(skillId)) return handleRenameDoc(
                params.get("vid"), params.get("docId"), params.get("path"),
                params.get("name"), params.get("newName"));
            if ("move_doc".equals(skillId) || "move-doc".equals(skillId)) return handleMoveDoc(params);
            if ("copy_doc".equals(skillId) || "copy-doc".equals(skillId)) return handleCopyDoc(params);
            // ---------- CHAT ----------
            // ---------- SYSTEM ----------
            if ("help".equals(skillId)) return handleHelp();
            if ("help-repos".equals(skillId)) return handleHelpRepos();
            if ("help-docs".equals(skillId)) return handleHelpDocs();
            if ("help-search".equals(skillId)) return handleHelpSearch();
            if ("init-llm".equals(skillId)) return handleInitLlm();
            if ("init-auth".equals(skillId)) return handleInitAuth();
            if ("banner".equals(skillId)) return handleBanner(params.get("name"));
            // ---------- NATURAL LANGUAGE ----------
            if ("search_and_load".equals(skillId)) return handleSearchAndLoad(params.get("query"), params.get("loadToContext"));
            if ("generate_summary".equals(skillId)) return handleGenerateSummary(params.get("topic"), params.get("generate"));
            if ("search_and_answer".equals(skillId)) return handleSearchAndAnswer(params.get("topic"), params.get("query"));
            // ---------- WEB AUTOMATION (stubs for now) ----------
            if ("playwright".equals(skillId) || "web_automation".equals(skillId)) return handlePlaywright(params);
            if ("web_search".equals(skillId) || "web-search".equals(skillId)) return handleWebSearch(params.get("query"));
            if ("browser_use".equals(skillId) || "ai-browse".equals(skillId)) return handleBrowserUse(params.get("task"), params.get("query"));
            // ---------- FALLBACK ----------
            return SkillExecutionResult.error("Unknown skill: " + skillId);
        } catch (Exception e) {
            log.error("Error executing skill '{}'", skillId, e);
            return SkillExecutionResult.error("Skill execution failed: " + e.getMessage());
        }
    }

    // ==================== USER HANDLERS ====================

    private SkillExecutionResult handleWhoami() {
        try {
            Map<String, Object> response = docSysClient.getLoginUser();
            if ("ok".equals(response.get("status"))) {
                String info = formatUserInfo(response.get("data"));
                return SkillExecutionResult.ok(info);
            } else {
                return SkillExecutionResult.error("Not logged in. Use 'login <user> <pwd>' first.");
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get user info: " + e.getMessage());
        }
    }

    private String formatUserInfo(Object userObj) {
        if (userObj == null) return "No user data";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) userObj;
            return String.format(
                "User Info:\n  ID: %s\n  Name: %s\n  Nickname: %s\n  Type: %s (0=user, 1=admin, 2=superadmin)\n  Email: %s\n  Role: %s",
                user.get("id"), user.get("name"), user.get("nickName"),
                user.get("type"), user.get("email"), user.get("role"));
        } catch (Exception e) {
            return userObj.toString();
        }
    }

    // ==================== REPOSITORY HANDLERS ====================

    private SkillExecutionResult handleListRepos() {
        try {
            Map<String, Object> response = docSysClient.getReposList();
            String output = formatReposList(response);
            return SkillExecutionResult.ok(output);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to list repositories: " + e.getMessage());
        }
    }

    private String formatReposList(Map<String, Object> response) {
        StringBuilder sb = new StringBuilder("Repositories:\n");
        if ("ok".equals(response.get("status"))) {
            Object data = response.get("data");
            if (data instanceof List) {
                List<?> repos = (List<?>) data;
                if (repos.isEmpty()) {
                    sb.append("  (No repositories found)\n");
                } else {
                    for (Object repo : repos) {
                        sb.append("  ").append(formatReposInfo(repo)).append("\n");
                    }
                }
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
            return String.format("[%d] %s - %s (type:%s, path:%s)",
                r.get("id"), r.get("name"), r.get("info"), r.get("type"), r.get("path"));
        } catch (Exception e) {
            return repo.toString();
        }
    }

    private SkillExecutionResult handleAddRepos(String name, String desc, String path, String type, String verCtrl) {
        if (name == null || name.isEmpty()) {
            return SkillExecutionResult.error(
                "Usage: create-repos <name> [desc] [path] [type] [verCtrl]\n" +
                "  name: Repository name (required)\n" +
                "  desc: Description (optional)\n" +
                "  path: Storage path (required, e.g., F:/data/myrepo)\n" +
                "  type: Type 0=local (default: 0)\n" +
                "  verCtrl: Version control 0=none 1=SVN 2=GIT (default: 0)\n\n" +
                "Example: create-repos MyProject \"My project files\" F:/data/myrepo 0 1");
        }
        if (path == null || path.isEmpty()) {
            return SkillExecutionResult.error("Storage path is required. Usage: create-repos <name> <desc> <path>");
        }
        try {
            Integer typeInt = type != null ? Integer.parseInt(type) : 0;
            Integer verCtrlInt = verCtrl != null ? Integer.parseInt(verCtrl) : 0;
            Map<String, Object> response = docSysClient.addRepos(
                name, desc, typeInt, path, null, verCtrlInt,
                Integer.valueOf(0), null, null, null, null, null, null, null, null, null, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Repository '" + name + "' created successfully at " + path);
            } else {
                return SkillExecutionResult.error("Failed to create repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to create repository: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleDeleteRepos(String nameOrVid) {
        if (nameOrVid == null || nameOrVid.isEmpty()) {
            return SkillExecutionResult.error("Usage: delete-repos <name_or_id>");
        }
        try {
            Integer vid;
            try {
                vid = Integer.parseInt(nameOrVid);
            } catch (NumberFormatException e) {
                return SkillExecutionResult.error(
                    "Please use repository ID to delete. Use 'list-repos' to find the ID.");
            }
            Map<String, Object> response = docSysClient.deleteRepos(vid);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Repository deleted successfully.");
            } else {
                return SkillExecutionResult.error("Failed to delete repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to delete repository: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleGetRepos(String vidStr) {
        if (vidStr == null || vidStr.isEmpty()) {
            return SkillExecutionResult.error("Usage: repos-info <vid>");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Map<String, Object> response = docSysClient.getRepos(vid);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok(formatReposInfo(response.get("data")));
            } else {
                return SkillExecutionResult.error("Failed to get repository: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get repository: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleUpdateRepos(Map<String, String> params) {
        String vidStr = params.get("vid");
        if (vidStr == null || vidStr.isEmpty()) {
            return SkillExecutionResult.error(
                "Usage: update-repos <vid> [name=<name>] [info=<desc>] [path=<path>]\n" +
                "  vid: Repository ID (required)\n" +
                "  name: New repository name (optional)\n" +
                "  info: New description (optional)\n" +
                "  path: New storage path (optional)\n\n" +
                "Example: update-repos 1 name=MyProject info=\"Updated description\"");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Map<String, Object> response = docSysClient.updateReposInfo(
                vid,
                params.get("name"),
                params.get("info"),
                params.get("type") != null ? Integer.parseInt(params.get("type")) : null,
                params.get("path"),
                null, null, null, null, null, null, null, null, null, null, null, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Repository updated successfully.");
            } else {
                return SkillExecutionResult.error("Failed to update repository: " + response.get("msgInfo"));
            }
        } catch (NumberFormatException e) {
            return SkillExecutionResult.error("Invalid repository ID: " + vidStr);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to update repository: " + e.getMessage());
        }
    }

    // ==================== DOCUMENT HANDLERS ====================

    private SkillExecutionResult handleGetDocList(String vidStr, String pidStr, String path) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;

            if (vid == null) {
                try {
                    Map<String, Object> reposResult = docSysClient.getReposList();
                    if ("ok".equals(reposResult.get("status"))) {
                        Object reposData = reposResult.get("data");
                        if (reposData instanceof List && !((List<?>) reposData).isEmpty()) {
                            Object firstRepo = ((List<?>) reposData).get(0);
                            if (firstRepo instanceof Map) {
                                Object repoId = ((Map<?, ?>) firstRepo).get("id");
                                vid = repoId != null ? Integer.parseInt(repoId.toString()) : null;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("handleGetDocList: failed to auto-discover repos", e);
                }
            }

            Map<String, Object> response = docSysClient.agentListAllDocs(vid);
            if (!"ok".equals(response.get("status"))) {
                return SkillExecutionResult.error("Failed to list documents: " + response.get("msgInfo"));
            }

            Object data = response.get("data");
            if (data instanceof List) {
                List<?> docs = (List<?>) data;
                List<Object> filteredDocs = new ArrayList<>();
                for (Object item : docs) {
                    if (item instanceof Map) {
                        String name = ((Map<?, ?>) item).get("name") != null
                            ? ((Map<?, ?>) item).get("name").toString() : "";
                        if (!".".equals(name)) {
                            filteredDocs.add(item);
                        }
                    }
                }
                if (filteredDocs.isEmpty()) {
                    return SkillExecutionResult.ok("仓库中暂无文档。请尝试上传文档或使用 search 命令搜索。");
                }
                StringBuilder sb = new StringBuilder();
                sb.append("找到 ").append(filteredDocs.size()).append(" 个文档:\n\n");
                for (Object item : filteredDocs) {
                    if (item instanceof Map) {
                        Map<?, ?> doc = (Map<?, ?>) item;
                        String name = doc.get("name") != null ? doc.get("name").toString() : "(unnamed)";
                        String docPath = doc.get("path") != null ? doc.get("path").toString() : "";
                        sb.append("D ").append(name);
                        if (!docPath.isEmpty()) {
                            sb.append(" [").append(docPath).append("]");
                        }
                        sb.append("\n");
                    }
                }
                return SkillExecutionResult.ok(sb.toString());
            }
            return SkillExecutionResult.ok("Documents:\n" + response);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to list documents: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleAddDoc(String vidStr, String pidStr, String path, String name, String typeStr, String content) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long pid = pidStr != null ? Long.parseLong(pidStr) : 0L;
            Integer type = typeStr != null ? Integer.parseInt(typeStr) : 0;
            Map<String, Object> response = docSysClient.addDoc(vid, pid, path, name, type, 1, content, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Document '" + name + "' added successfully.");
            } else {
                return SkillExecutionResult.error("Failed to add document: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to add document: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleDeleteDoc(String vidStr, String docIdStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.deleteDoc(vid, docId, null, path, name, 0, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Document deleted successfully.");
            } else {
                return SkillExecutionResult.error("Failed to delete document: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to delete document: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleRenameDoc(String vidStr, String docIdStr, String path, String name, String newName) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.renameDoc(vid, docId, null, path, name, 0, newName, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Document renamed to '" + newName + "'.");
            } else {
                return SkillExecutionResult.error("Failed to rename: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to rename: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleMoveDoc(Map<String, String> params) {
        String vidStr = params.get("vid");
        String docIdStr = params.get("docId");
        String srcName = params.get("srcName");
        String dstName = params.get("dstName");
        String srcPath = params.get("srcPath");
        String dstPath = params.get("dstPath");
        if (vidStr == null || vidStr.isEmpty() || (srcName == null && docIdStr == null)) {
            return SkillExecutionResult.error(
                "Usage: move-doc <vid> [srcName=<src>] [dstName=<dst>] [srcPath=<path>] [dstPath=<path>]\n" +
                "  vid: Repository ID (required)\n" +
                "  srcName: Source document name (required)\n" +
                "  dstName: Destination name (required)\n" +
                "  srcPath: Source path in repository (optional)\n" +
                "  dstPath: Destination path in repository (optional)\n\n" +
                "Example: move-doc 1 srcName=file.txt dstName=renamed.txt srcPath=/docs/ dstPath=/archive/");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.moveDoc(
                vid, docId, 0L, srcPath, srcName, 0,
                0L, dstPath, dstName, 0, 0, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Document moved to '" + dstName + "' successfully.");
            } else {
                return SkillExecutionResult.error("Failed to move document: " + response.get("msgInfo"));
            }
        } catch (NumberFormatException e) {
            return SkillExecutionResult.error("Invalid parameter: " + e.getMessage());
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to move document: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleCopyDoc(Map<String, String> params) {
        String vidStr = params.get("vid");
        String docIdStr = params.get("docId");
        String srcName = params.get("srcName");
        String dstName = params.get("dstName");
        String srcPath = params.get("srcPath");
        String dstPath = params.get("dstPath");
        if (vidStr == null || vidStr.isEmpty() || (srcName == null && docIdStr == null)) {
            return SkillExecutionResult.error(
                "Usage: copy-doc <vid> [srcName=<src>] [dstName=<dst>] [srcPath=<path>] [dstPath=<path>]\n" +
                "  vid: Repository ID (required)\n" +
                "  srcName: Source document name (required)\n" +
                "  dstName: Destination name (required)\n" +
                "  srcPath: Source path in repository (optional)\n" +
                "  dstPath: Destination path in repository (optional)\n\n" +
                "Example: copy-doc 1 srcName=file.txt dstName=file_copy.txt srcPath=/docs/ dstPath=/docs/");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.copyDoc(
                vid, docId, 0L, srcPath, srcName, 0,
                0L, dstPath, dstName, 0, 0, null);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Document copied to '" + dstName + "' successfully.");
            } else {
                return SkillExecutionResult.error("Failed to copy document: " + response.get("msgInfo"));
            }
        } catch (NumberFormatException e) {
            return SkillExecutionResult.error("Invalid parameter: " + e.getMessage());
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to copy document: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleGetDoc(String vidStr, String docIdStr, String path, String name) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.getDoc(vid, docId, path, name);
            return SkillExecutionResult.ok("Document:\n" + response);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get document: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleDocHistory(String vidStr, String docIdStr) {
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Long docId = docIdStr != null ? Long.parseLong(docIdStr) : null;
            Map<String, Object> response = docSysClient.getDocHistory(vid, docId);
            return SkillExecutionResult.ok("Version History:\n" + response);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get history: " + e.getMessage());
        }
    }

    // ==================== SEARCH HANDLERS ====================

    private SkillExecutionResult handleSearchDoc(String query, String vidStr) {
        if (query == null || query.isEmpty()) {
            return SkillExecutionResult.error("Usage: search <query> [vid]");
        }
        try {
            Integer vid = vidStr != null ? Integer.parseInt(vidStr) : null;
            Map<String, Object> response = docSysClient.agentSearchDocsByKeyword(query, vid);
            String formatted = formatSearchResults(response, query);
            return SkillExecutionResult.ok(formatted);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to search: " + e.getMessage());
        }
    }

    private String formatSearchResults(Map<String, Object> response, String query) {
        StringBuilder sb = new StringBuilder();
        try {
            Object status = response.get("status");
            if (status != null && !"ok".equals(status.toString())) {
                return "搜索失败: " + response.get("msgInfo") + "\n";
            }
            Object data = response.get("data");
            if (data == null) {
                return "未找到与【" + query + "】相关的文档\n";
            }
            if (data instanceof List) {
                List<?> list = (List<?>) data;
                if (list.isEmpty()) {
                    return "未找到与【" + query + "】相关的文档\n";
                }
                sb.append("找到 ").append(list.size()).append(" 个相关文档，显示前 5 个：\n\n");
                int count = 0;
                for (Object item : list) {
                    if (count >= 5) break;
                    if (item instanceof Map) {
                        Map<?, ?> doc = (Map<?, ?>) item;
                        sb.append("【").append(doc.get("name")).append("】(").append(doc.get("path")).append(")\n");
                        count++;
                    }
                }
                if (list.size() > 5) {
                    sb.append("\n... 还有 ").append(list.size() - 5).append(" 个文档");
                }
                sb.append("\n\n提示：使用以下命令获取详细内容：");
                sb.append("\n   - 查看文档: get-doc <vid> <docId>");
                sb.append("\n   - 在AI中分析: chat-with-docs <query> [model]");
            } else {
                sb.append("搜索完成\n");
            }
        } catch (Exception e) {
            sb.append("搜索结果解析异常: ").append(e.getMessage());
        }
        return sb.toString();
    }

    private SkillExecutionResult handleRagChat(String query, String model, String apiKey) {
        if (query == null || query.isEmpty()) {
            return SkillExecutionResult.error("Usage: chat-with-docs <query> [model] [apiKey]");
        }
        try {
            String response = docSysClient.ragChat(query, model, apiKey);
            return SkillExecutionResult.ok(response);
        } catch (Exception e) {
            return SkillExecutionResult.error("RAG chat failed: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleListAiModels() {
        try {
            Map<String, Object> response = docSysClient.getAiModelList();
            return SkillExecutionResult.ok("Available AI Models:\n" + response.get("data"));
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get AI models: " + e.getMessage());
        }
    }

    // ==================== BACKUP HANDLERS ====================

    private SkillExecutionResult handleBackupRepos(String vidStr, String path) {
        if (vidStr == null || vidStr.isEmpty()) {
            return SkillExecutionResult.error("Usage: backup <vid> [path]");
        }
        try {
            Integer vid = Integer.parseInt(vidStr);
            Map<String, Object> response = docSysClient.backupRepos(vid, path);
            if ("ok".equals(response.get("status"))) {
                return SkillExecutionResult.ok("Backup started. Task ID: " + response.get("data"));
            } else {
                return SkillExecutionResult.error("Failed to start backup: " + response.get("msgInfo"));
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("Backup failed: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleBackupStatus(String taskId) {
        if (taskId == null || taskId.isEmpty()) {
            return SkillExecutionResult.error("Usage: backup-status <taskId>");
        }
        try {
            Map<String, Object> response = docSysClient.queryBackupStatus(taskId);
            return SkillExecutionResult.ok("Backup Status:\n" + response);
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get backup status: " + e.getMessage());
        }
    }

    // ==================== SYSTEM HANDLERS ====================

    private SkillExecutionResult handleGetConfig() {
        try {
            Map<String, Object> response = docSysClient.getDocSysConfig();
            return SkillExecutionResult.ok("System Config:\n" + response.get("data"));
        } catch (Exception e) {
            return SkillExecutionResult.error("Failed to get config: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("DocSys Agent CLI Commands:\n\n");
        sb.append("User Management:\n");
        sb.append("  login <user> <pwd>              - Login to DocSystem\n");
        sb.append("  logout                          - Logout\n");
        sb.append("  whoami                          - Show current user info\n\n");
        sb.append("Repository Management:\n");
        sb.append("  list-repos                      - List all repositories\n");
        sb.append("  create-repos <name> [desc] [path] [type] [verCtrl]  - Create new repository\n");
        sb.append("  delete-repos <vid>              - Delete repository by ID\n");
        sb.append("  repos-info <vid>                - Get repository details\n");
        sb.append("  backup <vid> [path]             - Backup repository\n\n");
        sb.append("Document Operations:\n");
        sb.append("  list-docs <vid> [pid] [path]   - List documents in repository\n");
        sb.append("  add-doc <vid> <name> [pid]     - Add document to repository\n");
        sb.append("  delete-doc <vid> <docId>       - Delete document\n");
        sb.append("  rename-doc <vid> <docId> <newName> - Rename document\n");
        sb.append("  get-doc <vid> <docId>           - Get document details\n");
        sb.append("  download-doc <vid> <docId>     - Download document\n");
        sb.append("  doc-history <vid> <docId>      - Get version history\n\n");
        sb.append("Search:\n");
        sb.append("  search <query> [vid]           - Search documents\n\n");
        sb.append("AI/Chat:\n");
        sb.append("  chat <message> [model]        - Chat with AI\n");
        sb.append("  chat-with-docs <query> [model] - Chat with document context\n");
        sb.append("  ai-models                       - List available AI models\n\n");
        sb.append("Help:\n");
        sb.append("  help-repos                     - Repository commands help\n");
        sb.append("  help-docs                      - Document commands help\n");
        sb.append("  help-search                    - Search commands help\n\n");
        sb.append("Examples:\n");
        sb.append("  login admin admin2026\n");
        sb.append("  list-repos\n");
        sb.append("  create-repos MyProject \"My project\" F:/data/myrepo 0 0\n");
        sb.append("  list-docs 1\n");
        sb.append("  search \"important\"\n");
        sb.append("  chat \"list my documents\"\n");
        return SkillExecutionResult.ok(sb.toString());
    }

    private SkillExecutionResult handleHelpRepos() {
        StringBuilder sb = new StringBuilder();
        sb.append("Repository Commands:\n\n");
        sb.append("  list-repos                          - List accessible repositories\n");
        sb.append("  create-repos <name> <desc> <path> [type] [verCtrl]\n");
        sb.append("                                          - Create new repository\n");
        sb.append("    name: Repository name (required)\n");
        sb.append("    desc: Description (optional)\n");
        sb.append("    path: Storage path (required, e.g., F:/data/myrepo)\n");
        sb.append("    type: 0=local (default), 1=remote storage\n");
        sb.append("    verCtrl: 0=none, 1=SVN, 2=GIT (default: 0)\n\n");
        sb.append("  delete-repos <vid>                  - Delete repository (by ID)\n");
        sb.append("  repos-info <vid>                    - Get repository details\n");
        sb.append("  backup <vid> [path]                 - Trigger full backup\n");
        sb.append("  backup-status <taskId>              - Check backup status\n\n");
        sb.append("Example:\n");
        sb.append("  create-repos MyProject \"Project files\" F:/data/myrepo 0 1\n");
        return SkillExecutionResult.ok(sb.toString());
    }

    private SkillExecutionResult handleHelpDocs() {
        StringBuilder sb = new StringBuilder();
        sb.append("Document Commands:\n\n");
        sb.append("  list-docs <vid> [pid] [path]      - List documents in folder\n");
        sb.append("    vid: Repository ID (required)\n");
        sb.append("    pid: Parent folder ID (optional, default: 0 = root)\n");
        sb.append("    path: Path in repository (optional)\n\n");
        sb.append("  add-doc <vid> <name> [pid] [type] - Add new document\n");
        sb.append("    vid: Repository ID (required)\n");
        sb.append("    name: Document name (required)\n");
        sb.append("    pid: Parent folder ID (optional)\n");
        sb.append("    type: 0=file, 1=folder (default: 0)\n\n");
        sb.append("  delete-doc <vid> <docId>          - Delete document\n");
        sb.append("  rename-doc <vid> <docId> <newName> - Rename document\n");
        sb.append("  get-doc <vid> <docId>             - Get document details\n");
        sb.append("  download-doc <vid> <docId>         - Download document\n");
        sb.append("  doc-history <vid> <docId>          - Get version history\n");
        return SkillExecutionResult.ok(sb.toString());
    }

    private SkillExecutionResult handleHelpSearch() {
        StringBuilder sb = new StringBuilder();
        sb.append("Search Commands:\n\n");
        sb.append("  search <query> [vid]              - Full-text search\n");
        sb.append("    query: Search keyword (required)\n");
        sb.append("    vid: Repository ID to search (optional, searches all if omitted)\n\n");
        sb.append("  Note: Requires textSearch enabled on repository\n\n");
        sb.append("Example:\n");
        sb.append("  search \"meeting notes\"\n");
        sb.append("  search \"report\" 1\n");
        return SkillExecutionResult.ok(sb.toString());
    }

    private SkillExecutionResult handleInitLlm() {
        // Delegate to SubAgent's init-llm when LLMService/EnvConfig are needed
        // This executor handles DocSys API calls; LLM init is a SubAgent concern
        return SkillExecutionResult.ok(
            "init-llm is handled by SubAgent. Please use the /init command via SubAgent flow.");
    }

    private SkillExecutionResult handleInitAuth() {
        return SkillExecutionResult.ok(
            "init-auth is handled by SubAgent. Please use the /init-auth command via SubAgent flow.");
    }

    private SkillExecutionResult handleBanner(String name) {
        if (name == null || name.isEmpty()) {
            return SkillExecutionResult.ok(
                "\n" +
                "╔══════════════════════════════════════════════════════════════╗\n" +
                "║           欢迎使用 DocSys 文档管理系统                       ║\n" +
                "╠══════════════════════════════════════════════════════════════╣\n" +
                "║  版本: 2.02.80 | 状态: 运行中                               ║\n" +
                "║  功能: 文档管理 | 仓库管理 | AI 助手 | 全文搜索             ║\n" +
                "║                                                              ║\n" +
                "║  快速开始:                                                   ║\n" +
                "║    login <user> <pwd>        - 登录系统                      ║\n" +
                "║    list-repos                - 查看仓库                     ║\n" +
                "║    search <关键词>            - 搜索文档                     ║\n" +
                "║    help                       - 查看所有命令                  ║\n" +
                "╚══════════════════════════════════════════════════════════════╝\n"
            );
        } else {
            return SkillExecutionResult.ok("Banner '" + name + "' not found. Available banners: welcome (default).");
        }
    }

    // ==================== NATURAL LANGUAGE HANDLERS ====================

    private SkillExecutionResult handleSearchAndLoad(String query, String loadToContext) {
        if (query == null || query.isEmpty()) {
            return SkillExecutionResult.error("请提供要查询的内容，例如: 查询项目的资料");
        }
        try {
            Map<String, Object> response = docSysClient.agentSearchDocsByKeyword(query, null);
            String status = (String) response.get("status");
            if ("ok".equals(status)) {
                Object data = response.get("data");
                boolean hasResults = data instanceof List && !((List<?>) data).isEmpty();
                if (hasResults) {
                    String resultSummary = formatSearchResults(response, query);
                    String message = "已搜索到以下与【" + query + "】相关的文档：\n\n"
                        + resultSummary + "\n\n已将相关文档内容加载到AI上下文中，您可以继续询问详细内容。";
                    return SkillExecutionResult.ok(message, toMap(response));
                } else {
                    return SkillExecutionResult.ok(
                        "在本地文档库中没有找到与【" + query + "】相关的内容。\n\n" +
                        "建议您尝试：\n" +
                        "   1. 使用【列出仓库】查看当前有哪些仓库\n" +
                        "   2. 尝试其他关键词搜索\n" +
                        "   3. 上传相关文档到系统中\n");
                }
            } else {
                String errorMsg = (String) response.get("msgInfo");
                if (errorMsg != null && errorMsg.contains("未登录")) {
                    return SkillExecutionResult.error("需要先登录才能搜索文档。请先使用 login 命令登录。");
                }
                return SkillExecutionResult.error("搜索失败: " + errorMsg);
            }
        } catch (Exception e) {
            return SkillExecutionResult.error("搜索失败: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleGenerateSummary(String topic, String generate) {
        if (topic == null || topic.isEmpty()) {
            return SkillExecutionResult.error("请提供要撰写的主题，例如: 撰写项目综述");
        }
        try {
            Map<String, Object> searchResult = docSysClient.agentSearchDocsByKeyword(topic, null);
            String resultSummary = formatSearchResults(searchResult, topic);
            return SkillExecutionResult.ok(
                "已找到以下与【" + topic + "】相关的文档：\n\n" + resultSummary +
                "\n\n(需要配置LLM才能自动生成综述)");
        } catch (Exception e) {
            return SkillExecutionResult.error("生成综述失败: " + e.getMessage());
        }
    }

    private SkillExecutionResult handleSearchAndAnswer(String topic, String query) {
        if (topic == null || topic.isEmpty()) {
            return SkillExecutionResult.error("请提供想了解的内容，例如: 关于项目情况");
        }
        try {
            Map<String, Object> searchResult = docSysClient.agentSearchDocsByKeyword(topic, null);
            String resultSummary = formatSearchResults(searchResult, topic);
            return SkillExecutionResult.ok(
                "根据搜索结果，关于【" + topic + "】的相关文档如下：\n\n" + resultSummary);
        } catch (Exception e) {
            return SkillExecutionResult.error("查询失败: " + e.getMessage());
        }
    }

    // ==================== WEB AUTOMATION HANDLERS ====================

    private SkillExecutionResult handlePlaywright(Map<String, String> params) {
        String url = params.get("url");
        String query = params.get("query");
        if ((url == null || url.isEmpty()) && query != null) {
            return handleWebSearch(query);
        }
        if (url == null || url.isEmpty()) {
            return SkillExecutionResult.error("请提供要打开的网址，例如: playwright open https://www.baidu.com");
        }
        // Note: Full Playwright integration requires WebAutomationSkill from SubAgent
        // This is a stub that returns a guidance message
        return SkillExecutionResult.ok(
            "Playwright 浏览器自动化: 请在 SubAgent 中使用完整 Playwright 支持\n" +
            "URL: " + url + "\n" +
            "如需截图/交互，请通过 SubAgent.execute() 调用完整实现。");
    }

    private SkillExecutionResult handleWebSearch(String query) {
        if (query == null || query.isEmpty()) {
            return SkillExecutionResult.error("请提供要搜索的内容，例如: web-search ChatGPT 最新消息");
        }
        String encodedQuery = URLEncoder.encode(query);
        String searchUrl = "https://www.baidu.com/s?wd=" + encodedQuery;
        String markdown = generateWebSearchMarkdown(query, searchUrl);
        String message = "正在为您搜索网络：【" + query + "】\n\n" +
            "搜索结果已整理成 Markdown 文档：\n\n" + markdown + "\n\n" +
            "操作建议：\n" +
            "   - 【上传到仓库】- 将此内容保存为文档\n" +
            "   - 【继续提问】- 基于搜索结果进行问答\n" +
            "   - 【查看原文】- 点击上方链接访问原始网页";
        return SkillExecutionResult.ok(message, new HashMap<String, Object>(){{
            put("searchUrl", searchUrl);
            put("query", query);
            put("markdown", markdown);
            put("type", "web_search_result");
        }});
    }

    private String generateWebSearchMarkdown(String query, String searchUrl) {
        StringBuilder md = new StringBuilder();
        md.append("## Network Search Results: ").append(query).append("\n\n");
        md.append("> *Content organized by AI from web search results*\n\n");
        md.append("### Search Info\n\n");
        md.append("- **Keyword**: ").append(query).append("\n");
        md.append("- **Time**: ").append(LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("\n");
        md.append("- **Source**: Baidu Search\n\n");
        md.append("---\n\n");
        md.append("### Results Summary\n\n");
        md.append("Please check web search results for **").append(query).append("**.\n\n");
        md.append("---\n\n");
        md.append("### Quick Links\n\n");
        md.append("| # | Source | Action |\n");
        md.append("|---|--------|--------|\n");
        md.append("| 1 | Baidu Search | [View](").append(searchUrl).append(") |\n\n");
        md.append("---\n\n");
        md.append("### Next Steps\n\n");
        md.append("1. **Save to Repo** - Say 'upload this content' or 'save as document'\n");
        md.append("2. **Continue Q&A** - Ask questions based on search results\n");
        md.append("3. **View Original** - Click the link above\n");
        return md.toString();
    }

    private SkillExecutionResult handleBrowserUse(String task, String query) {
        String intent = task != null ? task : query;
        if (intent == null || intent.isEmpty()) {
            return SkillExecutionResult.error("请告诉我您想做什么，例如: browse 查找 ChatGPT 最新资讯");
        }
        log.info("handleBrowserUse: task={}", intent);
        String encodedQuery = URLEncoder.encode(intent);
        String searchUrl = "https://www.baidu.com/s?wd=" + encodedQuery;
        return SkillExecutionResult.ok(
            "浏览器自动化任务: " + intent + "\n\n" +
            "搜索结果: " + searchUrl + "\n\n" +
            "注: 完整浏览器自动化需要 SubAgent 中的 WebAutomationSkill 支持。",
            new HashMap<String, Object>(){{
                put("task", intent);
                put("searchUrl", searchUrl);
            }});
    }

    // ==================== UTILITIES ====================

    private Map<String, Object> toMap(Map<String, Object> src) {
        return src != null ? new HashMap<>(src) : Collections.emptyMap();
    }
}
