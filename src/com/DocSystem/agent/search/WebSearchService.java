package com.DocSystem.agent.search;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 网络搜索服务（T8.4）。
 *
 * <p>对可配置的搜索端点发起 HTTP 请求并解析结果：
 * <ul>
 *   <li>默认端点：Bing（无需 API key，实测国内可达）——解析 {@code li.b_algo} 中的
 *       {@code h2 a}（标题/链接）与 {@code p}（摘要），并还原其 {@code //bing.com/ck/a?u=}
 *       Base64URL 重定向链接为真实 URL。</li>
 *   <li>若端点返回 DuckDuckGo HTML（含 {@code result__a}）→ 解析 DuckDuckGo 格式
 *       （含 {@code //duckduckgo.com/l/?uddg=} 重定向解码）。</li>
 *   <li>若端点返回 JSON（以 {@code [} 或 {@code \{} 开头）：尝试通用字段
 *       （title / url|link / snippet|description|content），兼容常见搜索 API 返回。</li>
 * </ul>
 * 失败安全：网络错误/超时/解析失败一律不抛异常，返回空列表 + 错误信息，由上层转成清晰错误结果。</p>
 */
public class WebSearchService {

    private static final Logger log = LoggerFactory.getLogger(WebSearchService.class);

    /** 默认搜索端点（Bing，无需 API key，国内可达） */
    public static final String DEFAULT_ENDPOINT = "https://www.bing.com/search?q=";

    /** 默认超时（毫秒） */
    public static final long DEFAULT_TIMEOUT_MS = 8000;

    private final String endpoint;
    private final long timeoutMs;
    private final OkHttpClient httpClient;

    private static final Pattern DDG_TITLE_PATTERN =
            Pattern.compile("<a[^>]*class=\"[^\"]*result__a[^\"]*\"[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>",
                    Pattern.DOTALL);
    private static final Pattern DDG_SNIPPET_PATTERN =
            Pattern.compile("<a[^>]*class=\"[^\"]*result__snippet[^\"]*\"[^>]*>(.*?)</a>",
                    Pattern.DOTALL);
    /** Bing 结果块：li.b_algo → h2 a（href+标题） + p（摘要） */
    private static final Pattern BING_RESULT_PATTERN =
            Pattern.compile("<li[^>]*class=\"[^\"]*b_algo[^\"]*\"[^>]*>(.*?)</li>",
                    Pattern.DOTALL);
    private static final Pattern BING_TITLE_PATTERN =
            Pattern.compile("<h2[^>]*>\\s*<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>",
                    Pattern.DOTALL);
    private static final Pattern BING_SNIPPET_PATTERN =
            Pattern.compile("<p[^>]*>(.*?)</p>",
                    Pattern.DOTALL);

    public WebSearchService() {
        this(DEFAULT_ENDPOINT, DEFAULT_TIMEOUT_MS);
    }

    public WebSearchService(String endpoint, long timeoutMs) {
        this.endpoint = (endpoint == null || endpoint.isEmpty()) ? DEFAULT_ENDPOINT : endpoint;
        this.timeoutMs = timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(this.timeoutMs, TimeUnit.MILLISECONDS)
                .readTimeout(this.timeoutMs, TimeUnit.MILLISECONDS)
                .followRedirects(true)
                .build();
    }

    /** 搜索结果：results 为解析出的条目；error 为失败原因（成功时 null） */
    public static class SearchOutcome {
        public final List<WebSearchResult> results;
        public final String error;
        public SearchOutcome(List<WebSearchResult> results, String error) {
            this.results = results;
            this.error = error;
        }
        public boolean isSuccess() { return error == null; }
    }

    /**
     * 执行搜索。
     *
     * @return 成功 → results 非空或空（无结果）；失败 → error 非空（失败安全，不抛异常）
     */
    public SearchOutcome search(String query, int maxResults) {
        if (query == null || query.trim().isEmpty()) {
            return new SearchOutcome(new ArrayList<WebSearchResult>(), "搜索关键词不能为空");
        }
        int limit = Math.max(1, Math.min(maxResults <= 0 ? 5 : maxResults, 10));

        String url;
        try {
            String encoded = java.net.URLEncoder.encode(query.trim(), "UTF-8");
            url = endpoint + encoded;
        } catch (Exception e) {
            return new SearchOutcome(new ArrayList<WebSearchResult>(), "编码搜索词失败: " + e.getMessage());
        }

        Request request = new Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DocSysAgent/1.0")
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                return new SearchOutcome(new ArrayList<WebSearchResult>(),
                        "搜索端点返回 HTTP " + response.code());
            }
            // 显式按 UTF-8 解码（不依赖响应 Content-Type charset——无 charset 时 OkHttp 默认
            // ISO-8859-1，中文会变乱码，导致摘要/标题解析错误）
            String body = response.body() != null
                    ? new String(response.body().bytes(), "UTF-8") : "";
            if (body == null || body.isEmpty()) {
                return new SearchOutcome(new ArrayList<WebSearchResult>(), "搜索端点返回空内容");
            }
            List<WebSearchResult> results = parse(body, limit);
            return new SearchOutcome(results, null);
        } catch (java.net.SocketTimeoutException e) {
            return new SearchOutcome(new ArrayList<WebSearchResult>(), "搜索超时（" + timeoutMs + "ms）");
        } catch (Exception e) {
            log.warn("WebSearchService.search failed: query={}, err={}", query, e.getMessage());
            return new SearchOutcome(new ArrayList<WebSearchResult>(), "搜索失败: " + e.getMessage());
        }
    }

    /** 解析端点响应（HTML 或 JSON） */
    private List<WebSearchResult> parse(String body, int limit) {
        String trimmed = body.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
            return parseJson(trimmed, limit);
        }
        // HTML：按内容嗅探格式（Bing 优先，DuckDuckGo 兜底）
        if (trimmed.contains("b_algo")) {
            return parseBingHtml(body, limit);
        }
        return parseDdgHtml(body, limit);
    }

    /** 解析 Bing 搜索结果页（li.b_algo → h2 a + p） */
    private List<WebSearchResult> parseBingHtml(String html, int limit) {
        List<WebSearchResult> results = new ArrayList<>();
        try {
            Matcher block = BING_RESULT_PATTERN.matcher(html);
            while (block.find() && results.size() < limit) {
                String li = block.group(1);
                Matcher title = BING_TITLE_PATTERN.matcher(li);
                if (!title.find()) {
                    continue;
                }
                String href = title.group(1);
                String t = stripHtml(title.group(2)).trim();
                if (t.isEmpty()) {
                    continue;
                }
                String url = normalizeUrl(href);
                String snippet = "";
                Matcher sn = BING_SNIPPET_PATTERN.matcher(li);
                if (sn.find()) {
                    snippet = stripHtml(sn.group(1)).trim();
                }
                results.add(new WebSearchResult(t, url, snippet));
            }
        } catch (Exception e) {
            log.warn("WebSearchService.parseBingHtml failed: {}", e.getMessage());
        }
        return results;
    }

    /** 解析 DuckDuckGo HTML 结果页 */
    private List<WebSearchResult> parseDdgHtml(String html, int limit) {
        List<WebSearchResult> results = new ArrayList<>();
        try {
            Matcher titleMatcher = DDG_TITLE_PATTERN.matcher(html);
            Matcher snippetMatcher = DDG_SNIPPET_PATTERN.matcher(html);
            while (titleMatcher.find() && results.size() < limit) {
                String href = titleMatcher.group(1).trim();
                String title = stripHtml(titleMatcher.group(2)).trim();
                if (title.isEmpty()) {
                    continue;
                }
                String url = normalizeUrl(href);
                // 取对应的摘要（尽力对齐：后续 snippetMatcher.find()）
                String snippet = "";
                if (snippetMatcher.find()) {
                    snippet = stripHtml(snippetMatcher.group(1)).trim();
                }
                results.add(new WebSearchResult(title, url, snippet));
            }
        } catch (Exception e) {
            log.warn("WebSearchService.parseDdgHtml failed: {}", e.getMessage());
        }
        return results;
    }

    /** 解析 JSON 端点响应（兼容 title/url|link/snippet|description|content 字段） */
    private List<WebSearchResult> parseJson(String json, int limit) {
        List<WebSearchResult> results = new ArrayList<>();
        try {
            JSONArray items = null;
            try {
                items = JSON.parseArray(json);
            } catch (Exception ignored) {
                JSONObject obj = JSON.parseObject(json);
                if (obj != null) {
                    // 常见包装：data / results / items / organic
                    for (String key : new String[]{"data", "results", "items", "organic", "hits"}) {
                        Object v = obj.get(key);
                        if (v instanceof JSONArray) { items = (JSONArray) v; break; }
                    }
                    if (items == null) { items = new JSONArray(); }
                }
            }
            if (items == null) { return results; }
            for (int i = 0; i < items.size() && results.size() < limit; i++) {
                JSONObject it = items.getJSONObject(i);
                if (it == null) { continue; }
                String title = firstString(it, "title", "name");
                String url = firstString(it, "url", "link", "href");
                String snippet = firstString(it, "snippet", "description", "content", "abstract");
                if (title == null && url == null) { continue; }
                results.add(new WebSearchResult(
                        title != null ? title : "",
                        url != null ? url : "",
                        snippet != null ? snippet : ""));
            }
        } catch (Exception e) {
            log.warn("WebSearchService.parseJson failed: {}", e.getMessage());
        }
        return results;
    }

    private static String firstString(JSONObject obj, String... keys) {
        for (String k : keys) {
            Object v = obj.get(k);
            if (v != null && !v.toString().isEmpty()) {
                return v.toString();
            }
        }
        return null;
    }

    /** 还原搜索端点的重定向链接为真实 URL（DuckDuckGo uddg= / Bing u=） */
    private static String normalizeUrl(String href) {
        if (href == null || href.isEmpty()) {
            return "";
        }
        try {
            // DuckDuckGo: //duckduckgo.com/l/?uddg=<url-encoded>
            int idx = href.indexOf("uddg=");
            if (idx >= 0) {
                String encoded = href.substring(idx + 5);
                int amp = encoded.indexOf('&');
                if (amp >= 0) { encoded = encoded.substring(0, amp); }
                return URLDecoder.decode(encoded, "UTF-8");
            }
            // Bing: //www.bing.com/ck/a?...&u=<base64url-encoded>&ntb=1
            idx = href.indexOf("u=");
            if (idx >= 0) {
                String encoded = href.substring(idx + 2);
                int amp = encoded.indexOf('&');
                if (amp >= 0) { encoded = encoded.substring(0, amp); }
                String decoded = decodeBase64Url(encoded);
                if (decoded != null && decoded.startsWith("http")) {
                    return decoded;
                }
            }
            // 协议相对链接补全
            if (href.startsWith("//")) {
                return "https:" + href;
            }
        } catch (Exception ignored) {}
        return href;
    }

    /** 解码 Bing 的 URL-safe Base64（- _ 映射为 + /，补齐 padding） */
    private static String decodeBase64Url(String s) {
        if (s == null || s.isEmpty()) {
            return null;
        }
        try {
            String b64 = s.replace('-', '+').replace('_', '/');
            int pad = b64.length() % 4;
            if (pad > 0) {
                StringBuilder sb = new StringBuilder(b64);
                for (int i = 0; i < 4 - pad; i++) { sb.append('='); }
                b64 = sb.toString();
            }
            byte[] decoded = java.util.Base64.getDecoder().decode(b64);
            return new String(decoded, "UTF-8");
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 去除 HTML 标签、**解码 HTML 实体**、折叠空白 —— 摘要要直接进模型上下文，必须干净。
     *
     * <p>【R3-12】原实现只硬编码了 6 个实体（{@code &nbsp; &amp; &lt; &gt; &quot; &#39;}），
     * 实测 Bing 摘要里的 {@code &ensp;}（U+2002）、{@code &#0183;}（·）等都原样漏进上下文变成噪声。
     * 现在：数字实体（十进制/十六进制）与常见具名实体通用解码，未收录的具名实体**原样保留**（不丢信息），
     * 随后把 nbsp/ensp/emsp/thinsp/全角空格等 Unicode 空白统一成普通空格再折叠。</p>
     *
     * <p>【R3-14】实现已抽到 {@link com.DocSystem.agent.util.HtmlText#clean(String)}（与
     * {@code DocSysClient} 解容器 HTML 错误页共用同一套解码口径），这里只做转发。</p>
     */
    static String stripHtml(String s) {
        return com.DocSystem.agent.util.HtmlText.clean(s);
    }
}
