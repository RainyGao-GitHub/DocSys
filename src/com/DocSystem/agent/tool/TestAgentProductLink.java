package com.DocSystem.agent.tool;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * P3 护栏：本轮写入产物的**可点击链接**（方案 B，{@link AgentProductLink}）。
 *
 * <p>覆盖四件事：</p>
 * <ol>
 *   <li><b>覆盖范围锁定</b>（用户裁定）：只有 write_office / edit_office / write_file 登记产物；
 *       rename/move/copy（目录整理场景会刷屏）、create_folder（目录打开无意义）、write_note（虚拟内容）一律不登记；</li>
 *   <li>产物提取：参数里取 vid/path/name，path 与工具层同一归一化（"66666" → "66666/"）、根目录空串；
 *       缺 vid/缺 name → 不登记（宁缺勿滥）；</li>
 *   <li>标记编解码：附加/解析/剥离三件套（含中文名、含引号名、坏 JSON、幂等）；</li>
 *   <li><b>源码 lint</b>：循环侧必须登记 + 两个文本出口都带 footer；历史回放与续接上下文必须剥离；
 *       工具侧只有 3 处带上产物；前端必须按"同仓库 + project 页 → 当前页 openDoc，否则新窗口"路由。</li>
 * </ol>
 */
public class TestAgentProductLink {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        whitelist();
        fromArgs();
        dedupeAndCap();
        markerRoundTrip();
        stripBehavior();
        describe();
        serverSourceLint();
        frontendLint();
        System.out.println("\n======== TestAgentProductLink: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- 1. 覆盖范围 ----------

    private static void whitelist() {
        check("write_office is product tool", AgentProductLink.isProductTool("write_office"));
        check("edit_office is product tool", AgentProductLink.isProductTool("edit_office"));
        check("write_file is product tool", AgentProductLink.isProductTool("write_file"));
        check("rename_doc NOT product tool (user ruling)",
                !AgentProductLink.isProductTool("rename_doc"));
        check("move_doc NOT product tool", !AgentProductLink.isProductTool("move_doc"));
        check("copy_doc NOT product tool", !AgentProductLink.isProductTool("copy_doc"));
        check("create_folder NOT product tool", !AgentProductLink.isProductTool("create_folder"));
        check("write_note NOT product tool (virtual content)",
                !AgentProductLink.isProductTool("write_note"));
        check("delete_doc NOT product tool", !AgentProductLink.isProductTool("delete_doc"));
        check("get_doc NOT product tool", !AgentProductLink.isProductTool("get_doc"));
        check("null NOT product tool", !AgentProductLink.isProductTool(null));
        check("product tools exactly 3", AgentProductLink.PRODUCT_TOOLS.length == 3,
                String.valueOf(AgentProductLink.PRODUCT_TOOLS.length));
    }

    // ---------- 2. 从参数提取 ----------

    private static void fromArgs() {
        JSONObject a = JSON.parseObject("{\"vid\":1,\"path\":\"66666\",\"name\":\"a.txt\"}");
        AgentProductLink.Product p = AgentProductLink.fromArgs("write_file", a);
        check("write_file product extracted", p != null && p.vid == 1 && "a.txt".equals(p.name));
        check("path normalized with trailing slash", p != null && "66666/".equals(p.path),
                p == null ? "null" : p.path);
        check("write_file action=new", p != null && "new".equals(p.action));

        JSONObject rootPath = JSON.parseObject("{\"vid\":2,\"path\":\"\",\"name\":\"b.md\"}");
        AgentProductLink.Product p2 = AgentProductLink.fromArgs("write_file", rootPath);
        check("root path stays empty", p2 != null && "".equals(p2.path));

        JSONObject noPath = JSON.parseObject("{\"vid\":2,\"name\":\"c.md\"}");
        AgentProductLink.Product p3 = AgentProductLink.fromArgs("write_file", noPath);
        check("missing path → empty path", p3 != null && "".equals(p3.path));

        JSONObject nulPath = JSON.parseObject("{\"vid\":2,\"path\":null,\"name\":\"c.md\"}");
        AgentProductLink.Product p4 = AgentProductLink.fromArgs("write_file", nulPath);
        check("null path → empty path", p4 != null && "".equals(p4.path));

        AgentProductLink.Product p5 = AgentProductLink.fromArgs("edit_office",
                JSON.parseObject("{\"vid\":3,\"path\":\"x/\",\"name\":\"d.docx\"}"));
        check("edit_office action=modified", p5 != null && "modified".equals(p5.action));

        check("missing vid → null", AgentProductLink.fromArgs("write_file",
                JSON.parseObject("{\"path\":\"\",\"name\":\"e.txt\"}")) == null);
        check("missing name → null", AgentProductLink.fromArgs("write_file",
                JSON.parseObject("{\"vid\":1,\"path\":\"\"}")) == null);
        check("blank name → null", AgentProductLink.fromArgs("write_file",
                JSON.parseObject("{\"vid\":1,\"path\":\"\",\"name\":\"   \"}")) == null);
        check("non-product tool → null", AgentProductLink.fromArgs("rename_doc",
                JSON.parseObject("{\"vid\":1,\"path\":\"\",\"name\":\"f.txt\"}")) == null);
        check("null args → null", AgentProductLink.fromArgs("write_file", null) == null);

        // fromResult：工具自带 data（带 docId）优先；否则回退参数
        JSONObject toolProduct = AgentProductLink.of(9, "p/", "g.docx", Long.valueOf(123456L), "modified").toJson();
        AgentProductLink.Product p6 = AgentProductLink.fromResult("edit_office",
                JSON.parseObject("{\"vid\":1,\"path\":\"\",\"name\":\"h.docx\"}"), toolProduct);
        check("fromResult prefers tool-provided data", p6 != null && p6.vid == 9 && p6.docId != null
                && p6.docId.longValue() == 123456L, p6 == null ? "null" : String.valueOf(p6.vid));
        check("fromResult registers non-number docId as null", AgentProductLink.fromResult("write_file",
                JSON.parseObject("{\"vid\":5,\"path\":\"\",\"name\":\"i.txt\"}"), null) != null);
        AgentProductLink.Product typed = AgentProductLink.of(7, "", "z.txt", null, "new");
        check("fromResult accepts Product payload directly",
                AgentProductLink.fromResult("write_file", null, typed) == typed);
        AgentProductLink.Product p7 = AgentProductLink.fromResult("write_file",
                JSON.parseObject("{\"vid\":5,\"path\":\"\",\"name\":\"i.txt\"}"), null);
        check("fromResult falls back to args", p7 != null && p7.vid == 5);
        check("fromResult ignores non-product tool", AgentProductLink.fromResult("move_doc",
                JSON.parseObject("{\"vid\":5,\"path\":\"\",\"name\":\"j.txt\"}"), null) == null);

        check("of() rejects null vid", AgentProductLink.of(null, "", "k.txt", null, "new") == null);
        check("of() rejects blank name", AgentProductLink.of(1, "", "  ", null, "new") == null);
        check("docIdOf reads number", AgentProductLink.docIdOf(
                JSON.parseObject("{\"docId\":77}")) == 77L);
        check("docIdOf null-safe", AgentProductLink.docIdOf(null) == null);
    }

    // ---------- 3. 去重与上限 ----------

    private static void dedupeAndCap() {
        List<AgentProductLink.Product> list = new ArrayList<AgentProductLink.Product>();
        AgentProductLink.add(list, AgentProductLink.of(1, "", "a.txt", null, "new"));
        AgentProductLink.add(list, AgentProductLink.of(1, "", "a.txt", null, "modified"));
        check("same file deduped", list.size() == 1, String.valueOf(list.size()));
        check("dedupe keeps last action", "modified".equals(list.get(0).action), list.get(0).action);
        AgentProductLink.add(list, AgentProductLink.of(1, "sub/", "a.txt", null, "new"));
        check("different path is a different product", list.size() == 2, String.valueOf(list.size()));
        AgentProductLink.add(list, null);
        check("null product ignored", list.size() == 2);

        List<AgentProductLink.Product> many = new ArrayList<AgentProductLink.Product>();
        for (int i = 0; i < AgentProductLink.MAX_ITEMS + 5; i++) {
            AgentProductLink.add(many, AgentProductLink.of(1, "", "f" + i + ".txt", null, "new"));
        }
        check("capped at MAX_ITEMS", many.size() == AgentProductLink.MAX_ITEMS,
                String.valueOf(many.size()));
    }

    // ---------- 4. 标记编解码 ----------

    private static void markerRoundTrip() throws Exception {
        List<AgentProductLink.Product> list = new ArrayList<AgentProductLink.Product>();
        AgentProductLink.add(list, AgentProductLink.of(1, "", "报表 v2.docx", Long.valueOf(5L), "new"));
        AgentProductLink.add(list, AgentProductLink.of(2, "子目录/", "带\"引号\".txt", null, "modified"));

        String answer = "已按你的要求生成：" + AgentProductLink.describe(list) + "。";
        String withFooter = AgentProductLink.appendFooter(answer, list);
        check("footer appended after answer", withFooter.startsWith(answer), withFooter);
        check("footer carries marker", withFooter.contains(AgentProductLink.MARK_START)
                && withFooter.contains(AgentProductLink.MARK_END));

        List<AgentProductLink.Product> parsed = AgentProductLink.parse(withFooter);
        check("parse round-trip count", parsed.size() == 2, String.valueOf(parsed.size()));
        check("parse keeps Chinese name", "报表 v2.docx".equals(parsed.get(0).name), parsed.get(0).name);
        check("parse keeps docId", parsed.get(0).docId != null && parsed.get(0).docId.longValue() == 5L);
        check("parse keeps quoted name", "带\"引号\".txt".equals(parsed.get(1).name), parsed.get(1).name);
        check("parse keeps action", "modified".equals(parsed.get(1).action), parsed.get(1).action);
        check("parse keeps path", "子目录/".equals(parsed.get(1).path), parsed.get(1).path);

        check("no products → answer unchanged",
                answer.equals(AgentProductLink.appendFooter(answer, new ArrayList<AgentProductLink.Product>())));
        check("answer unchanged with null list also strips",
                !AgentProductLink.appendFooter(answer, null).contains(AgentProductLink.MARK_START));
        // 幂等：重复 append 不叠加
        String twice = AgentProductLink.appendFooter(withFooter, list);
        check("append is idempotent (no double marker)",
                count(twice, AgentProductLink.MARK_START) == 1, String.valueOf(count(twice, AgentProductLink.MARK_START)));

        check("parse on plain text → empty", AgentProductLink.parse("普通回答，没有标记").isEmpty());
        check("parse on null → empty", AgentProductLink.parse(null).isEmpty());
        check("parse on broken json → empty",
                AgentProductLink.parse(AgentProductLink.MARK_START + "{not json}" + AgentProductLink.MARK_END).isEmpty());
        check("parse on empty items → empty",
                AgentProductLink.parse(AgentProductLink.MARK_START + "{\"items\":[]}" + AgentProductLink.MARK_END).isEmpty());
        check("parse skips nameless item",
                AgentProductLink.parse(AgentProductLink.MARK_START + "{\"items\":[{\"vid\":1}]}"
                        + AgentProductLink.MARK_END).isEmpty());
    }

    // ---------- 5. 剥离（展示文本 / 回灌模型） ----------

    private static void stripBehavior() {
        String answer = "第一行\n第二行";
        String withFooter = AgentProductLink.appendFooter(answer,
                list(AgentProductLink.of(1, "", "x.docx", null, "new")));
        check("strip removes marker", !AgentProductLink.strip(withFooter).contains("ds-products"),
                AgentProductLink.strip(withFooter));
        check("strip keeps the answer text", AgentProductLink.strip(withFooter).startsWith("第一行"));
        check("strip keeps second line", AgentProductLink.strip(withFooter).contains("第二行"));
        check("strip is idempotent",
                AgentProductLink.strip(AgentProductLink.strip(withFooter)).equals(AgentProductLink.strip(withFooter)));
        check("strip on null → null", AgentProductLink.strip(null) == null);
        check("strip on plain text unchanged", "无标记".equals(AgentProductLink.strip("无标记")));
        check("strip handles marker mid-text",
                "前后都有".equals(AgentProductLink.strip("前" + AgentProductLink.marker(
                        list(AgentProductLink.of(1, "", "y.txt", null, "new"))) + "后").trim())
                        || AgentProductLink.strip("前" + AgentProductLink.marker(
                                list(AgentProductLink.of(1, "", "y.txt", null, "new"))) + "后").contains("前后"));
        check("strip tolerates half marker",
                AgentProductLink.MARK_START.concat("{\"items\":[]}").equals(
                        AgentProductLink.strip(AgentProductLink.MARK_START + "{\"items\":[]}")));
    }

    // ---------- 6. 回执文案 ----------

    private static void describe() {
        check("describe empty", "".equals(AgentProductLink.describe(new ArrayList<AgentProductLink.Product>())));
        check("describe one", "a.txt".equals(AgentProductLink.describe(
                list(AgentProductLink.of(1, "", "a.txt", null, "new")))));
        check("describe two joined", "a.txt、b.txt".equals(AgentProductLink.describe(
                list(AgentProductLink.of(1, "", "a.txt", null, "new"),
                        AgentProductLink.of(1, "", "b.txt", null, "new")))));
        String four = AgentProductLink.describe(list(
                AgentProductLink.of(1, "", "a.txt", null, "new"),
                AgentProductLink.of(1, "", "b.txt", null, "new"),
                AgentProductLink.of(1, "", "c.txt", null, "new"),
                AgentProductLink.of(1, "", "d.txt", null, "new")));
        check("describe caps at 3 with count", four.contains("a.txt") && four.contains("c.txt")
                && !four.contains("d.txt") && four.contains("共 4 个"), four);
    }

    // ---------- 7. 服务端源码 lint（策略锁） ----------

    private static void serverSourceLint() throws Exception {
        String loop = read("src/com/DocSystem/agent/orchestrator/ToolUseLoop.java");
        check("loop registers products via fromResult", loop.contains("AgentProductLink.fromResult("));
        check("loop adds to products list", loop.contains("AgentProductLink.add(products"));
        check("loop resets products per run", loop.contains("products.clear()"));
        check("loop appends footer on final answer", loop.contains("withProductFooter(responseText)"));
        check("loop appends footer on budget wrap-up", loop.contains("withProductFooter(wrapText)"));

        String main = read("src/com/DocSystem/agent/orchestrator/MainAgent.java");
        check("history replay strips product marker",
                main.contains("AgentProductLink.strip(") && main.contains("loadSessionHistory"));
        check("continuation context strips marker",
                main.replace(" ", "").contains("AgentProductLink.strip(tr.message)"));

        String factory = read("src/com/DocSystem/agent/tool/DocSysToolFactory.java");
        // 只有 3 处工具带上产物（覆盖范围锁：多一处就说明有别的工具被放进了链接）
        int ofCount = count(factory, "AgentProductLink.of(");
        // 定义处 1 次（of 方法本身在别的文件）+ 3 个工具调用点
        check("exactly 3 tools attach a product", ofCount == 3, String.valueOf(ofCount));
        check("rename_doc does not attach product",
                !factory.contains("rename_doc\")") || !substringBetween(factory, "public static ToolDefinition renameDoc",
                        "public static ToolDefinition").contains("AgentProductLink"));
        check("move_doc does not attach product",
                !substringBetween(factory, "public static ToolDefinition moveDoc",
                        "public static ToolDefinition").contains("AgentProductLink"));
        check("copy_doc does not attach product",
                !substringBetween(factory, "public static ToolDefinition copyDoc",
                        "public static ToolDefinition").contains("AgentProductLink"));
    }

    // ---------- 8. 前端 lint（路由规则） ----------

    private static void frontendLint() throws Exception {
        String html = read("WebRoot/web/agent/index.html");
        check("frontend parses the marker",
                html.contains("ds-products") && html.contains("function extractProducts"));
        check("frontend renders product links", html.contains("function renderProductLinks"));
        check("frontend renders links for assistant messages",
                html.contains("renderProductLinks(extracted.items)"));
        check("frontend strips marker from body",
                html.contains("extractProducts(bodyText)"));
        check("frontend routes to parent openDoc", html.contains("p.openDoc(")
                && html.contains("typeof p.openDoc !== 'function'"));
        check("frontend requires same repo for in-page open",
                html.contains("String(item.vid) !== parentVid"));
        check("frontend falls back to new window", html.contains("window.open(href)"));
        check("frontend clicks are delegated (survives re-render)",
                html.contains("t.closest('.ds-product')"));
        check("frontend loads base64 helper for the new-window URL",
                html.contains("/DocSystem/web/js/base64.js"));
        check("frontend does NOT use javascript: href with code",
                !html.contains("href=\"javascript:openProduct"));
    }

    // ---------- helpers ----------

    private static List<AgentProductLink.Product> list(AgentProductLink.Product... items) {
        List<AgentProductLink.Product> l = new ArrayList<AgentProductLink.Product>();
        for (AgentProductLink.Product p : items) {
            l.add(p);
        }
        return l;
    }

    private static String read(String path) throws Exception {
        File f = new File(path);
        if (!f.isFile()) {
            throw new IllegalStateException("file not found (run from repo root): " + path);
        }
        return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
    }

    private static int count(String hay, String needle) {
        int c = 0;
        int i = (hay == null) ? -1 : hay.indexOf(needle);
        while (i >= 0) {
            c++;
            i = hay.indexOf(needle, i + needle.length());
        }
        return c;
    }

    /** 取 from 之后到 next 之前（不含）的片段；找不到 next 时取到末尾 */
    private static String substringBetween(String hay, String from, String next) {
        int i = hay.indexOf(from);
        if (i < 0) {
            return "";
        }
        int j = hay.indexOf(next, i + from.length());
        return j < 0 ? hay.substring(i) : hay.substring(i, j);
    }

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : "  -> " + detail));
        }
    }
}
