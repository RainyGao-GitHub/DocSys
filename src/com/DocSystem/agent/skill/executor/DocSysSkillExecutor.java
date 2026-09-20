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
        // System skills：R3-11（2026-09-20 用户裁定）已全部下线 —— help/system_help/help-repos/help-docs/help-search
        // 都不再被任何执行器接管。理由：
        //   ① system_help 返回的“工具速查 + 约定”与工具 schema 重复（模型手上已经有了，实测用途不大）；
        //   ② 三个 sibling 压根没注册（模型看不见），内容还是 docId 时代的 CLI（`create-repos`、
        //      `delete-doc <vid> <docId>`、`search <query> [vid]`）—— 工具名不存在、docId 定位已在 R1-6 下线；
        //   ③ 磁盘演示件是编造的（教你去跑不存在的 CLI / 不存在的 HTTP 端点 / 占位凭据）。
        // 现在调用它们会得到明确的“未知技能”（P3b 口径），比给过期内容安全。
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
            // ---------- SYSTEM（R3-11：help/system_help 已删除，此处不再有 SYSTEM 分支）----------
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

    // R3-11（2026-09-20 用户裁定）：整族 help 技能已删除 —— handleHelp / handleHelpRepos / handleHelpDocs /
    // handleHelpSearch 全部移除，id（help、system_help、help-repos、help-docs、help-search）也不再被任何执行器接管。
    //   · handleHelp 返回的“工具速查 + 5 条约定”与工具 schema 重复（模型手上已有），实测用途不大；
    //     那 5 条约定逐条都在工具描述里有对应表述（path/name 定位、get_doc 续读、search→grep、写操作确认、
    //     docId 已从参数面移除），所以删除不丢信息；
    //   · 另三个返回的是 docId 时代的 CLI 命令表（create-repos / delete-doc <vid> <docId> / search <query> [vid]），
    //     工具名不存在、docId 定位已在 R1-6 下线 —— 留着只会把模型引回废弃用法。
    // 现在调用它们会得到明确的“未知技能”（P3b 验收口径），比给过期内容安全。

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
