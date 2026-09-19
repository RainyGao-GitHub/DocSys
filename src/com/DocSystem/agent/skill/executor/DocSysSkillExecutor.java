package com.DocSystem.agent.skill.executor;

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

    @Override
    public int getOrder() {
        return 100;
    }

    /**
     * 已不再持有 DocSysClient：本执行器现在只处理非 DocSys 技能（help / banner / web 自动化）。
     * 原先的共享单例 client 无用户身份（详见 devDocs/Agent技能与工具清理计划.md §2.5），已移除。
     */
    @Autowired
    public DocSysSkillExecutor() {
        log.info("DocSysSkillExecutor initialized (non-DocSys skills only: help/banner/web)");
    }

    /**
     * All built-in skill IDs + aliases this executor can handle.
     * Updated to match SubAgent.getCategory() aliases (lines 91-118).
     */
    private static final Set<String> BUILT_IN_SKILL_IDS = new HashSet<>(Arrays.asList(
        // System skills（DocSys 自有能力已全部下线，改由工具承担；此处只保留非 DocSys 技能）
        "help", "help-repos", "help-docs", "help-search",
        "banner",
        // Web automation skills
        "playwright", "web_automation",
        "web_search", "web-search",
        "browser_use", "ai-browse"
    ));

    @Override
    public boolean canHandle(String skillId) {
        return skillId != null && BUILT_IN_SKILL_IDS.contains(skillId);
    }

    @Override
    public SkillExecutionResult execute(String skillId, Map<String, String> params, AgentContext context) {
        try {
            log.debug("DocSysSkillExecutor handling: {} params={}", skillId, params);
            // ---------- SYSTEM ----------
            if ("help".equals(skillId)) return handleHelp();
            if ("help-repos".equals(skillId)) return handleHelpRepos();
            if ("help-docs".equals(skillId)) return handleHelpDocs();
            if ("help-search".equals(skillId)) return handleHelpSearch();
            if ("banner".equals(skillId)) return handleBanner(params.get("name"));
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

    // ==================== SYSTEM HANDLERS ====================

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
