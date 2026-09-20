package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.search.WebSearchResult;
import com.DocSystem.agent.search.WebSearchService;
import com.alibaba.fastjson.JSONObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * T8.4 护栏：网络搜索工具（web_search）+ WebSearchService。
 * 纯 Java 自包含测试（main 入口），本地 HTTP 服务器模拟搜索端点，无 Spring/外网依赖。
 *
 * 覆盖：
 *  - DuckDuckGo HTML 格式解析（标题/链接/摘要 + uddg 重定向解码）
 *  - JSON 端点格式解析（title/url/snippet 及包装 data[]）
 *  - 失败安全回退（端点 500 / 连接拒绝 / 超时 → 清晰错误，不抛异常）
 *  - 空结果 → 提示未找到
 *  - 工具集成（web_search 工具 + registry 注册 + maxResults 上限）
 */
public class TestWebSearchTool {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testHtmlParse();
        testBingHtmlParse();
        testHtmlEntityCleaning();
        testJsonParse();
        testJsonWrappedParse();
        testHttp500Fallback();
        testConnectionRefusedFallback();
        testEmptyResults();
        testToolIntegration();
        testMaxResultsLimit();
        System.out.println("\n======== TestWebSearchTool: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }

    /** 带诊断信息的断言（失败时把实际文本打出来，便于定位清洗规则的边界） */
    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : "  -> " + detail));
        }
    }

    /** 启动一个返回固定 body 的本地 HTTP 服务器 */
    private static HttpServer startServer(int statusCode, String body) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/search", exchange -> {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return server;
    }

    private static String endpointOf(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort() + "/search?q=";
    }

    private static final String DUMMY_HTML =
            "<html><body>"
            + "<a rel=\"nofollow\" class=\"result__a\" href=\"//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage1&amp;rut=abc\">"
            + "Java 8 流式处理 <b>示例</b></a>"
            + "<a class=\"result__snippet\" href=\"//duckduckgo.com/l/?uddg=...\">这是摘要一 &amp; 更多</a>"
            + "<a rel=\"nofollow\" class=\"result__a\" href=\"https://example.org/page2\">第二个结果</a>"
            + "<a class=\"result__snippet\" href=\"#\">摘要二</a>"
            + "</body></html>";

    private static void testHtmlParse() throws Exception {
        HttpServer server = startServer(200, DUMMY_HTML);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("java", 5);
            check("html: success", out.isSuccess());
            check("html: 2 results", out.results != null && out.results.size() == 2);
            if (out.results.size() >= 1) {
                WebSearchResult r0 = out.results.get(0);
                check("html: title stripped", r0.title.contains("流式处理") && !r0.title.contains("<b>"));
                check("html: uddg decoded url", "https://example.com/page1".equals(r0.url));
                check("html: snippet stripped", r0.snippet.contains("这是摘要一") && r0.snippet.contains("&"));
            }
            if (out.results.size() >= 2) {
                check("html: plain url kept", "https://example.org/page2".equals(out.results.get(1).url));
            }
        } finally {
            server.stop(0);
        }
    }

    /** T8.4.2 修复：默认端点改 Bing —— 验证 Bing b_algo 解析 + u= Base64URL 解码 */
    private static final String BING_HTML =
            "<html><body>"
            + "<li class=\"b_algo\"><h2><a href=\"https://www.bing.com/ck/a?!&amp;&amp;p=x&amp;u=aHR0cHM6Ly9leGFtcGxlLmNvbS9wYWdlMQ&amp;ntb=1\">"
            + "Apache <strong>Kafka</strong> 介绍</a></h2>"
            + "<p><span class=\"news_dt\">2023年</span> 这是一个摘要 &amp; 内容</p></li>"
            + "<li class=\"b_algo\"><h2><a href=\"https://example.org/page2\">第二个结果</a></h2>"
            + "<p>摘要二</p></li>"
            + "</body></html>";

    private static void testBingHtmlParse() throws Exception {
        HttpServer server = startServer(200, BING_HTML);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("kafka", 5);
            check("bing: success", out.isSuccess());
            check("bing: 2 results", out.results != null && out.results.size() == 2);
            if (out.results.size() >= 1) {
                WebSearchResult r0 = out.results.get(0);
                check("bing: title stripped", r0.title.contains("Kafka") && !r0.title.contains("<strong>"));
                check("bing: u= base64url decoded", "https://example.com/page1".equals(r0.url));
                check("bing: snippet stripped", r0.snippet.contains("这是一个摘要") && r0.snippet.contains("&"));
            }
            if (out.results.size() >= 2) {
                check("bing: plain url kept", "https://example.org/page2".equals(out.results.get(1).url));
            }
            // 默认端点应已改为 Bing
            check("default endpoint is Bing", WebSearchService.DEFAULT_ENDPOINT.contains("bing.com"));
        } finally {
            server.stop(0);
        }
    }

    /**
     * 【R3-12】摘要里的 HTML 实体必须解码干净（Bing 实测带 {@code &ensp;} / {@code &#0183;}，进上下文是噪声）。
     *
     * <p>旧实现只硬编码 6 个实体，这两类原样漏进模型上下文。本用例用真实形态的 Bing 片段做回归。</p>
     */
    private static final String ENTITY_HTML =
            "<html><body>"
            + "<li class=\"b_algo\"><h2><a href=\"https://example.com/e1\">实体标题 &mdash; 测试</a></h2>"
            + "<p>前段&ensp;中段&#0183;后段 &#183; 分隔 &hellip; 结尾&nbsp;&nbsp;多空格"
            + " <b>加粗</b> &amp; 符号 &#x25CF; 圆点 &unknownent; 未知实体 &#xZZ; 坏数字</p></li>"
            + "</body></html>";

    private static void testHtmlEntityCleaning() throws Exception {
        HttpServer server = startServer(200, ENTITY_HTML);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("entity", 5);
            check("entity: success", out.isSuccess());
            check("entity: 1 result", out.results != null && out.results.size() == 1);
            if (out.results == null || out.results.isEmpty()) {
                return;
            }
            String snippet = out.results.get(0).snippet;
            String title = out.results.get(0).title;
            System.out.println("   [R3-12] 清洗后的摘要: " + snippet);
            check("entity: &ensp; 已被处理（不残留实体）", !snippet.contains("&ensp;"), snippet);
            check("entity: &#0183; 解码为 ·（十进制数字实体）", snippet.contains("中段\u00B7后段"), snippet);
            check("entity: &#183; 解码为 ·", snippet.contains("\u00B7 分隔"), snippet);
            check("entity: &hellip; 解码为 …", snippet.contains("\u2026"), snippet);
            check("entity: &#x25CF; 解码为 ●（十六进制数字实体）", snippet.contains("\u25CF"), snippet);
            check("entity: &nbsp; 折叠为单个空格（不残留 U+00A0）", !snippet.contains("\u00A0"), snippet);
            check("entity: 多余的 ensp/nbsp 不产生连续空格", !snippet.contains("  "), snippet);
            check("entity: 标签仍被去掉", !snippet.contains("<b>") && snippet.contains("加粗"), snippet);
            check("entity: &amp; 仍是字面 &", snippet.contains("& 符号"), snippet);
            check("entity: 未知具名实体原样保留（不瞎猜、不丢信息）", snippet.contains("&unknownent;"), snippet);
            check("entity: 坏数字实体原样保留", snippet.contains("&#xZZ;"), snippet);
            check("entity: 标题里的 &mdash; 也解码", title.contains("\u2014"), title);
            check("entity: 输出里不该再有可识别的数字实体", !snippet.matches("(?s).*&#\\d+;.*"), snippet);
        } finally {
            server.stop(0);
        }
        testEntitySourceLint();
    }

    /** 源码 lint：钉死"通用解码"，防止退回硬编码 6 实体的老实现 */
    private static void testEntitySourceLint() {
        java.io.File f = new java.io.File("src/com/DocSystem/agent/search/WebSearchService.java");
        if (!f.exists()) {
            f = new java.io.File("D:/Dev/DocSys/src/com/DocSystem/agent/search/WebSearchService.java");
        }
        String src = null;
        try (java.io.BufferedReader r = new java.io.BufferedReader(
                new java.io.InputStreamReader(new java.io.FileInputStream(f), "UTF-8"))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
            src = sb.toString();
        } catch (Exception e) {
            check("能读到 WebSearchService 源码（lint 前置）", false);
            return;
        }
        check("stripHtml 走通用实体解码", src.contains("unescapeHtmlEntities("));
        check("stripHtml 处理 Unicode 空白（nbsp/ensp 等）", src.contains("normalizeUnicodeSpaces("));
        check("支持十进制数字实体", src.contains("body.charAt(0) == '#'"));
        check("支持十六进制数字实体", src.contains("parseInt(body.substring(2), 16)"));
        check("不再退回硬编码 6 实体的老写法", !src.contains("replaceAll(\"&nbsp;\", \" \")"), "");
    }

    private static void testJsonParse() throws Exception {
        String body = "[{\"title\":\"T1\",\"url\":\"http://a.com\",\"snippet\":\"S1\"},"
                + "{\"title\":\"T2\",\"link\":\"http://b.com\",\"description\":\"S2\"}]";
        HttpServer server = startServer(200, body);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("json", 5);
            check("json: success", out.isSuccess());
            check("json: 2 results", out.results != null && out.results.size() == 2);
            if (out.results.size() >= 2) {
                check("json: url field", "http://a.com".equals(out.results.get(0).url));
                check("json: link field fallback", "http://b.com".equals(out.results.get(1).url));
            }
        } finally {
            server.stop(0);
        }
    }

    private static void testJsonWrappedParse() throws Exception {
        String body = "{\"data\":[{\"title\":\"W1\",\"url\":\"http://w.com\",\"snippet\":\"WS\"}]}";
        HttpServer server = startServer(200, body);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("wrapped", 5);
            check("json wrapped: 1 result", out.isSuccess() && out.results != null && out.results.size() == 1
                    && "W1".equals(out.results.get(0).title));
        } finally {
            server.stop(0);
        }
    }

    private static void testHttp500Fallback() throws Exception {
        HttpServer server = startServer(500, "oops");
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("err", 5);
            check("http 500 -> error (not exception)", !out.isSuccess() && out.error != null
                    && out.error.contains("500"));
        } finally {
            server.stop(0);
        }
    }

    private static void testConnectionRefusedFallback() throws Exception {
        // 找一个必然关闭的端口（先起一个再停掉）
        HttpServer tmp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        int port = tmp.getAddress().getPort();
        tmp.stop(0);
        WebSearchService svc = new WebSearchService("http://127.0.0.1:" + port + "/search?q=", 1500);
        WebSearchService.SearchOutcome out = svc.search("refused", 5);
        check("connection refused -> error (not exception)", !out.isSuccess() && out.error != null);
    }

    private static void testEmptyResults() throws Exception {
        HttpServer server = startServer(200, "<html><body>无结果</body></html>");
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("empty", 5);
            check("empty html -> success with 0 results", out.isSuccess() && out.results.isEmpty());
        } finally {
            server.stop(0);
        }
    }

    private static void testToolIntegration() throws Exception {
        HttpServer server = startServer(200, DUMMY_HTML);
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            ToolDefinition tool = DocSysToolFactory.webSearch(svc);
            check("web_search registered type", tool != null && "web_search".equals(tool.name));
            check("web_search is read-only", !tool.isWrite && !tool.needsConfirm);

            JSONObject args = new JSONObject();
            args.put("query", "java");
            ToolResult r = tool.executor.execute(args);
            check("tool execute success", r.success);
            check("tool result contains title", r.summary.contains("流式处理"));
            check("tool result contains decoded url", r.summary.contains("https://example.com/page1"));

            // 空 query → 错误
            JSONObject bad = new JSONObject();
            bad.put("query", "  ");
            check("tool empty query -> error", !tool.executor.execute(bad).success);

            // registry 集成：createFullRegistry(..., webSearch) 注册
            DocSysClient client = new DocSysClient("http://localhost:9999/");
            ToolRegistry reg = DocSysToolFactory.createFullRegistry(client, null, null, svc);
            check("registry has web_search", reg.find("web_search") != null);
            ToolRegistry regNoWeb = DocSysToolFactory.createFullRegistry(client, null, null, null);
            check("web_search absent when svc null", regNoWeb.find("web_search") == null);
        } finally {
            server.stop(0);
        }
    }

    private static void testMaxResultsLimit() throws Exception {
        StringBuilder sb = new StringBuilder("<html>");
        for (int i = 1; i <= 12; i++) {
            sb.append("<a class=\"result__a\" href=\"http://e.com/" + i + "\">标题" + i + "</a>");
        }
        sb.append("</html>");
        HttpServer server = startServer(200, sb.toString());
        try {
            WebSearchService svc = new WebSearchService(endpointOf(server), 3000);
            WebSearchService.SearchOutcome out = svc.search("many", 20); // 请求 20，上限 10
            check("maxResults capped at 10", out.isSuccess() && out.results.size() == 10);
        } finally {
            server.stop(0);
        }
    }
}
