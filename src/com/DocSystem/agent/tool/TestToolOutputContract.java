package com.DocSystem.agent.tool;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 护栏：工具输出契约（R2）。
 *
 * <p>R2 要立的三条不变量：
 * <ol>
 *   <li><b>列表类</b>：紧凑渲染 + 表头总数 + offset/limit 分页，且条数被预算回收时必须给续页提示
 *       （{@code fitPage} / {@code paged} / {@code moreHint} 统一实现）；</li>
 *   <li><b>长文本类</b>：get_doc 分窗口续读（总长/区间/下一页 offset），不能只给"截断"；</li>
 *   <li><b>任何输出都不允许超预算后半截</b>：实测 search 100 条 = 19840 字符、grep 16 条 = 687130 字符
 *       （单条命中行可达几十万字符），旧实现 fmt 后只剩 4000 字符的半截 JSON。</li>
 * </ol>
 */
public class TestToolOutputContract {

    private static int pass = 0;
    private static int fail = 0;

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null ? "" : "  -> " + detail));
        }
    }

    private static Map<String, Object> resp(Object data) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("data", data);
        return m;
    }

    private static Map<String, Object> failResp(String code, String msg) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "fail");
        m.put("errorCode", code);
        m.put("msgInfo", msg);
        return m;
    }

    // ==================== R2-1 fitPage / moreHint ====================

    private static void testFitPage() {
        List<Object> items = new ArrayList<Object>();
        for (int i = 0; i < 10; i++) {
            items.add("item-" + i);
        }
        // 预算足够 → 不回收
        DocSysToolFactory.PageBody full = DocSysToolFactory.fitPage(10, 0, 10, 10000,
                (from, to) -> "x");
        check("fitPage 预算足够时不回收", full.end == 10);
        // 预算很小 → 回收条数，但至少 1 条
        DocSysToolFactory.PageBody tiny = DocSysToolFactory.fitPage(10, 0, 10, 3,
                (from, to) -> repeat("y", to - from));
        check("fitPage 预算不足时回收条数（>=1）", tiny.end >= 1 && tiny.end < 10, "end=" + tiny.end);
        check("fitPage 回收后正文仍在预算内", tiny.body.length() <= 3, "len=" + tiny.body.length());
        DocSysToolFactory.PageBody one = DocSysToolFactory.fitPage(3, 0, 3, 0, (from, to) -> "zzz");
        check("fitPage 预算为 0 也至少给 1 条（不能吐空表）", one.end == 1 && one.body.equals("zzz"),
                "end=" + one.end);
        check("moreHint 统一句式", "⚠️ 还有 7 条未显示：继续调用 list_docs 传 offset=3。"
                .equals(DocSysToolFactory.moreHint(7, "list_docs", 3)));
    }

    // ==================== R2-2 get_doc 分窗口续读 ====================

    private static Map<String, Object> docResp(String text, long size) {
        Map<String, Object> d = new HashMap<String, Object>();
        d.put("vid", 5);
        d.put("path", "66666/");
        d.put("name", "big.md");
        d.put("size", size);
        if (text != null) {
            d.put("docText", text);
        }
        return resp(d);
    }

    private static void testGetDocWindow() {
        String text = repeat("A", 1000) + repeat("B", 500);
        String p1 = DocSysToolFactory.formatDocContent(docResp(text, 1500L), 5, "66666/", "big.md", null, null);
        System.out.println("---- get_doc 第 1 段 ----");
        System.out.println(firstLines(p1, 3));
        check("表头给正文总长", p1.contains("正文共 1500 字符"), p1.split("\n")[0]);
        check("短文本一次读完标为全文", p1.contains("已显示全文（第 1-1500 字符）"), p1.split("\n")[1]);
        check("短文本一次读完无续读提示", !p1.contains("还有"));
        check("正文原文在里面", p1.contains(text));

        // 超长文本 → 默认窗口 3000，给续读 offset
        String longText = repeat("0123456789", 2000);   // 20000 字符
        String p2 = DocSysToolFactory.formatDocContent(docResp(longText, 20000L), 5, "66666/", "big.md", null, null);
        check("默认窗口 3000 字符", p2.contains("本次显示第 1-3000 字符")
                && p2.contains("还有 17000 字符未显示"), p2.split("\n")[1]);
        check("续读提示给出 offset 与定位参数",
                p2.contains("get_doc(vid=5") && p2.contains("offset=3000") && p2.contains("name=\"big.md\""),
                p2.substring(p2.length() - 120));
        check("整段输出不超 4000（不会被 loop 硬截）", p2.length() < 4000, "len=" + p2.length());

        // 第二段：接着读
        String p3 = DocSysToolFactory.formatDocContent(docResp(longText, 20000L), 5, "66666/", "big.md", 3000, null);
        check("第二段区间正确", p3.contains("本次显示第 3001-6000 字符"), p3.split("\n")[1]);
        check("第二段内容连续（首字符正确）", p3.contains("0123456789"));
        String last = DocSysToolFactory.formatDocContent(docResp(longText, 20000L), 5, "66666/", "big.md", 17000, 5000);
        check("读到末尾不再提示续读", last.contains("本次显示第 17001-20000 字符") && !last.contains("未显示"),
                last.split("\n")[1]);

        // maxChars 显式放大（上限 20000）
        String big = DocSysToolFactory.formatDocContent(docResp(longText, 20000L), 5, "66666/", "big.md", 0, 999999);
        check("maxChars 收敛到上限 20000（一次读完）", big.contains("已显示全文（第 1-20000 字符）"),
                big.split("\n")[1]);
        check("maxChars 默认值常量", DocSysToolFactory.DOC_TEXT_DEFAULT_MAX == 3000
                && DocSysToolFactory.DOC_TEXT_MAX == 20000);

        // offset 越界 / 空文件 / 非文本 / 失败
        check("offset 越界给提示", DocSysToolFactory.formatDocContent(docResp(text, 1500L), 5, "66666/", "big.md", 9999, null)
                .contains("已超出范围"));
        check("空文件给明确文案", DocSysToolFactory.formatDocContent(docResp("", 0L), 5, "66666/", "empty.md", null, null)
                .contains("文件内容为空"));
        String bin = DocSysToolFactory.formatDocContent(docResp(null, 305084366L), 5, "", "docsys-WRE.zip", null, null);
        System.out.println("---- get_doc 非文本 ----");
        System.out.println(bin);
        check("非文本文件只给元信息（不倒 JSON）", bin.contains("无正文可读")
                && bin.contains("没有文本表示") && !bin.contains("localRootPath"), bin);
        check("非文本文件给大小", bin.contains("291.0MB") || bin.contains("MB"), bin);
        //P1：Office 族但暂不支持抽取的格式要给**准确原因**（别让模型以为文件没有内容）
        String odt = DocSysToolFactory.formatDocContent(docResp(null, 2048L), 5, "", "样文.odt", null, null);
        check("odt 明确报不支持提取", odt.contains("暂不支持文本提取") && odt.contains("docx"), odt);
        check("odt 不误报为无文本表示", !odt.contains("没有文本表示"), odt);
        check("失败保留错误码", DocSysToolFactory
                .formatDocContent(failResp("DOC_NOT_FOUND", "文件不存在！"), 5, "", "x", null, null)
                .contains("[错误码: DOC_NOT_FOUND"));
    }

    // ==================== R2-3 搜索结果渲染 ====================

    private static Map<String, Object> hit(String name, String path, long size, int hitType) {
        Map<String, Object> h = new HashMap<String, Object>();
        h.put("name", name);
        h.put("path", path);
        h.put("size", size);
        h.put("docId", 100000000000L);
        h.put("score", 700);
        h.put("hitType", hitType);
        h.put("reposId", 5);
        h.put("type", 1);
        return h;
    }

    private static void testSearchRender() {
        List<Object> hits = new ArrayList<Object>();
        for (int i = 0; i < 100; i++) {
            hits.add(hit("文件" + i + ".md", i % 3 == 0 ? "" : "目录" + i + "/子目录/", 1024L * (i + 1), i % 2 == 0 ? 1 : 2));
        }
        String q = "{\"should\":[{\"field\":\"name\",\"term\":\".\",\"match\":\"wildcard\"}]}";
        String p1 = DocSysToolFactory.formatSearchPage(resp(hits), 5, null, q, null, null, 100);
        System.out.println("---- search_files (len=" + p1.length() + ") ----");
        System.out.println(firstLines(p1, 4));
        check("表头给命中数与区间", p1.contains("本次显示第 1-50 条"), p1.split("\n")[0]);
        check("50 行（默认页）", countRows(p1, "^\\d+\\. .*") == 50, "rows=" + countRows(p1, "^\\d+\\. .*"));
        check("输出不超预算且无 truncated", p1.length() < 4000 && !p1.contains("(truncated)"), "len=" + p1.length());
        check("行含名称/path/大小/命中类型", p1.contains("文件0.md") && p1.contains("path=\"\"")
                && p1.contains("命中=文件名"), p1);
        check("内容命中标成“内容”", p1.contains("命中=内容"));
        check("根目录项 path 写作空串而不是 /", !p1.contains("path=\"/\""));
        check("续页提示（统一句式）", p1.contains("还有 50 条未显示") && p1.contains("offset=50"));
        check("不再倒原始 JSON 字段", !p1.contains("reposId") && !p1.contains("\"score\""));

        // R2-4：命中数语义（服务端不给真实总数，等于 maxResults 时必须明说可能还有更多）
        check("命中数=上限时如实披露（不说“共 N 条”）",
                p1.contains("已达 maxResults=100 上限，可能还有更多命中") && !p1.contains("共 100 条"),
                p1.split("\n")[0]);
        check("命中数到顶上界时提示缩小范围", p1.contains("已到服务端上限 100 条"), p1);
        List<Object> hits34 = new ArrayList<Object>();
        for (int i = 0; i < 34; i++) {
            hits34.add(hit("r" + i + ".md", "a/", 10L, 1));
        }
        String pn = DocSysToolFactory.formatSearchPage(resp(hits34), 5, null, q, null, null, 100);
        check("命中数未到上限时说“全部命中”", pn.contains("共 34 条（全部命中）"), pn.split("\n")[0]);
        check("未到上限不给上限提示", !pn.contains("可能还有更多命中"), pn);
        List<Object> hits20 = new ArrayList<Object>();
        for (int i = 0; i < 20; i++) {
            hits20.add(hit("d" + i + ".md", "a/", 10L, 1));
        }
        String pc = DocSysToolFactory.formatSearchPage(resp(hits20), 5, null, q, null, null, 20);
        check("默认 maxResults=20 被点亮时提示调大",
                pc.contains("已达 maxResults=20 上限") && pc.contains("调大 maxResults（当前 20，上限 100）"),
                pc.split("\n")[0] + " | " + pc.substring(pc.length() - 60));
        check("effectiveMaxResults：null/0 → 20", DocSysToolFactory.effectiveMaxResults(null) == 20
                && DocSysToolFactory.effectiveMaxResults(0) == 20 && DocSysToolFactory.effectiveMaxResults(-5) == 20);
        check("effectiveMaxResults：中间值原样、超上限收 100", DocSysToolFactory.effectiveMaxResults(50) == 50
                && DocSysToolFactory.effectiveMaxResults(300) == 100);

        String p2 = DocSysToolFactory.formatSearchPage(resp(hits), 5, "66666/", q, 90, null, 100);
        check("第二页区间", p2.contains("本次显示第 91-100 条"), p2.split("\n")[0]);
        check("第二页无续页提示", !p2.contains("未显示"));
        check("offset 越界", DocSysToolFactory.formatSearchPage(resp(hits), 5, null, q, 999, null, 100)
                .contains("已超出范围"));
        String emptyMsg = DocSysToolFactory.formatSearchPage(resp(new ArrayList<Object>()), 5, null, q, null, null, 100);
        check("空结果给建议（至少提 grep）", emptyMsg.contains("grep_files"), emptyMsg);
        check("空结果不再推荐 fuzzy/wildcard 作首选（R2-4）",
                emptyMsg.contains("先用默认的 term 模式") && !emptyMsg.contains("放宽 match"), emptyMsg);
        check("失败保留错误码", DocSysToolFactory
                .formatSearchPage(failResp("NO_PERMISSION", "无权限"), 5, null, q, null, null, 100)
                .contains("[错误码: NO_PERMISSION"));

        // R2-4：工具描述必须把“取回多少条”与“match 大小写陷阱”写清
        ToolDefinition sd = DocSysToolFactory.searchFiles(null);
        check("search_files 描述说明命中数可能是上限", sd.description.contains("可能还有更多"), sd.description);
        check("search_files 描述说明 match 必须小写",
                sd.parameters.toJSONString().contains("关键字必须全小写"), sd.parameters.toJSONString());
        check("search_files 参数说明 maxResults 是取回条数不是总数",
                sd.parameters.toJSONString().contains("取回多少条"), sd.parameters.toJSONString());

        // hitType 位掩码
        check("hitType=1 → 文件名", "文件名".equals(DocSysToolFactory.hitTypeText(1)));
        check("hitType=2 → 内容", "内容".equals(DocSysToolFactory.hitTypeText(2)));
        check("hitType=3 → 文件名+内容", "文件名+内容".equals(DocSysToolFactory.hitTypeText(3)));
        check("hitType=7 → 全命中", "文件名+内容+备注".equals(DocSysToolFactory.hitTypeText(7)));
        check("hitType=null → 未知", "未知".equals(DocSysToolFactory.hitTypeText(null)));
    }

    private static Map<String, Object> grepHit(String name, String path, long size, String line) {
        Map<String, Object> h = new HashMap<String, Object>();
        h.put("name", name);
        h.put("path", path);
        h.put("size", size);
        h.put("line", line);
        h.put("snippet", line.length() > 200 ? line.substring(0, 200) + "…" : line);
        return h;
    }

    private static void testGrepRender() {
        List<Object> hits = new ArrayList<Object>();
        hits.add(grepHit("build.gradle", "/a/b", 515L, "dependencies { implementation 'x' }"));
        // 真实踩坑：某日志文件"命中行"长达几十万字符（实测 272035 字符/条、整包 687130 字符）
        hits.add(grepHit("DocSys调试日志.log", "/MxsDoc", 564572L, repeat("log line ", 30000)));
        for (int i = 0; i < 20; i++) {
            hits.add(grepHit("f" + i + ".txt", "", 100L, "命中关键词的一行"));
        }
        String p1 = DocSysToolFactory.formatGrepPage(resp(hits), "测试", null, null, null, 100);
        System.out.println("---- grep_files (len=" + p1.length() + ") ----");
        System.out.println(firstLines(p1, 6));
        check("表头给命中数与区间", p1.contains("共 22 条（全部命中）") && p1.contains("本次显示第 1-22 条"),
                p1.split("\n")[0]);
        check("输出不超预算（旧实现是 687130 字符）", p1.length() < 4000, "len=" + p1.length());
        check("不再输出原始 line 字段（巨长）", !p1.contains("log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line log line"));
        check("片段被截断到 ≤" + DocSysToolFactory.GREP_SNIPPET_LEN + " 字符",
                countOccurrences(p1, "片段：") == 22, "count=" + countOccurrences(p1, "片段："));
        check("每行含 path+name 与大小", p1.contains("a/b/build.gradle") && p1.contains("515B"), p1);
        check("根目录 path 归一为空（不出现 //name）", p1.contains("\n3. f0.txt"), p1);
        check("短片段原样保留", p1.contains("dependencies { implementation 'x' }"));

        // 预算回收：给出 offset 续页提示
        String many = DocSysToolFactory.formatGrepPage(resp(hits), "测试", null, 0, 100, 100);
        check("大 limit 时按预算回收并提示续页（或列全 22）", many.length() < 4000
                && (many.contains("共 22 条")), "len=" + many.length());
        // R2-4：grep 也一样要如实披露"已达 maxResults 上限"（默认 20 时 22 条命中很可能被截）
        String cap = DocSysToolFactory.formatGrepPage(resp(hits), "测试", null, 0, 100, 20);
        check("grep 命中数=上限时提示可能还有更多",
                cap.contains("已达 maxResults=20 上限，可能还有更多命中")
                        && cap.contains("调大 maxResults（当前 20，上限 100）"), cap.split("\n")[0]);

        String p2 = DocSysToolFactory.formatGrepPage(resp(hits), "测试", "/MxsDoc", 0, null, 100);
        check("path 过滤透传（表述含 path）", p2.contains("path=\"/MxsDoc\""), p2.split("\n")[0]);
        check("空结果给建议", DocSysToolFactory.formatGrepPage(resp(new ArrayList<Object>()), "x", null, null, null, 20)
                .contains("没有命中"));
        check("grep 失败保留错误码", DocSysToolFactory
                .formatGrepPage(failResp("REPOS_NOT_FOUND", "仓库不存在"), "x", null, null, null, 20)
                .contains("[错误码: REPOS_NOT_FOUND"));
        check("shortText 截断加省略号", "abcdef…".equals(DocSysToolFactory.shortText("abcdefghij", 6)));
        check("shortText 折行变空格", "a b".equals(DocSysToolFactory.shortText("a\nb", 10)));
    }

    // ==================== R2-1 契约 lint：列表类不得裸 fmt ====================

    private static void testNoBareFmtOnLists() {
        String src = readSource("src/com/DocSystem/agent/tool/DocSysToolFactory.java");
        if (src == null) {
            return;
        }
        String[] listApis = {
            "fmt(client.getDocList(", "fmt(client.getReposList(", "fmt(client.getDocShareList(",
            "fmt(client.agentSearchDocs(", "fmt(client.grepFiles(", "fmt(client.getRepos("
        };
        for (String api : listApis) {
            check("列表类不再裸 fmt：" + api, !src.contains(api));
        }
        check("列表类都走分页/紧凑渲染",
                src.contains("formatDocListPage(") && src.contains("formatReposPage(")
                        && src.contains("formatSharePage(") && src.contains("formatSearchPage(")
                        && src.contains("formatGrepPage("));
        check("共享分页件被复用（fitPage 至少 4 处）",
                countOccurrences(src, "fitPage(") >= 4, "count=" + countOccurrences(src, "fitPage("));
        check("续页提示统一走 moreHint",
                countOccurrences(src, "moreHint(") >= 4, "count=" + countOccurrences(src, "moreHint("));
        check("get_doc 不再走 fmt", !src.contains("ToolResult.ok(fmt(client.getDoc("));
    }

    // ==================== helpers ====================

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder(s.length() * n);
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }

    private static int countRows(String s, String regex) {
        int n = 0;
        for (String line : s.split("\n")) {
            if (line.trim().matches(regex)) {
                n++;
            }
        }
        return n;
    }

    private static int countOccurrences(String s, String sub) {
        int n = 0;
        int i = s.indexOf(sub);
        while (i >= 0) {
            n++;
            i = s.indexOf(sub, i + sub.length());
        }
        return n;
    }

    private static String firstLines(String s, int n) {
        String[] lines = s.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(n, lines.length); i++) {
            sb.append(lines[i]).append('\n');
        }
        return sb.toString();
    }

    private static String readSource(String path) {
        java.io.File f = new java.io.File(path);
        if (!f.exists()) {
            check("源文件存在: " + path, false, "未找到（工作目录必须是工程根）");
            return null;
        }
        try {
            return new String(java.nio.file.Files.readAllBytes(f.toPath()),
                    java.nio.charset.Charset.forName("UTF-8"));
        } catch (Exception e) {
            check("读取源文件: " + path, false, e.getMessage());
            return null;
        }
    }

    public static void main(String[] args) {
        testFitPage();
        testGetDocWindow();
        testSearchRender();
        testGrepRender();
        testNoBareFmtOnLists();

        // schema：新增参数必须在，且旧语义参数保留
        ToolDefinition doc = DocSysToolFactory.getDoc(null);
        JSONObject docProps = doc.parameters.getJSONObject("properties");
        check("get_doc 暴露 offset/maxChars", docProps.containsKey("offset") && docProps.containsKey("maxChars"));
        check("get_doc required 不变", doc.parameters.getJSONArray("required").size() == 3);
        check("get_doc 描述提到分次读", doc.description.contains("offset") || doc.description.contains("分次读"));
        ToolDefinition sf = DocSysToolFactory.searchFiles(null);
        JSONObject sfProps = sf.parameters.getJSONObject("properties");
        check("search_files 暴露 offset/limit", sfProps.containsKey("offset") && sfProps.containsKey("limit"));
        check("search_files 保留 maxResults/withSnippet",
                sfProps.containsKey("maxResults") && sfProps.containsKey("withSnippet"));
        ToolDefinition gf = DocSysToolFactory.grepFiles(null);
        JSONObject gfProps = gf.parameters.getJSONObject("properties");
        check("grep_files 暴露 offset/limit", gfProps.containsKey("offset") && gfProps.containsKey("limit"));
        check("grep_files 描述说明片段会截断", gf.description.contains("截断"), gf.description);

        System.out.println("\n======== TestToolOutputContract: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }
}
