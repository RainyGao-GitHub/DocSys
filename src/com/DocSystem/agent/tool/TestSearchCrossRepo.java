package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.agent.search.AgentSearchQuery;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * R3-10 护栏：跨仓库搜索（search_files 省略 vid）+ 不依赖索引的精确直查。
 *
 * <p>锁定三件事：</p>
 * <ol>
 *   <li><b>参数契约</b>：只有**搜索**可以省略 vid（search_files 的 required 只有 query）；
 *       文件读写/改名/删除等操作工具的 vid 必须**保持必填**（用户裁定：没有 vid 的文件访问会操作到错误对象）。</li>
 *   <li><b>描述如实</b>：search_files 说明可跨仓；grep_files 必须写明"只匹配文件内容、不返回目录"——
 *       2026-09-20 实测：模型按旧描述从 search_files 退到 grep_files 去找目录，得到 20 条无关的内容命中。</li>
 *   <li><b>渲染如实</b>：跨仓结果每行带 vid/仓库名、目录标 [目录]、直查命中标 "命中=直查"、
 *       未扫完与失败的仓库必须披露（"没有命中"≠"没扫到"）。</li>
 * </ol>
 *
 * <p>外加一条**服务端源码 lint**：直查必须走 {@code docSysGetDoc}（它按 isFSM 分派本机 stat / 前置远程确认），
 * 绝不能直接用 {@code fsGetDoc}（只覆盖 type&lt;3 的本机仓库，对前置仓库 = 100% 假阴性）。
 * dev 环境 17 个仓库全是 type=1，前置分支无法 E2E，只能用 lint 锁住这段调用。</p>
 */
public class TestSearchCrossRepo {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        testSchemaContract();
        testDescriptions();
        testCrossReposRender();
        testSingleReposRenderUnchanged();
        testDirectHitRender();
        testIncompleteScanDisclosure();
        testExactNameCandidate();
        testServerLint();

        System.out.println();
        System.out.println("======== TestSearchCrossRepo: " + passed + " passed, " + failed + " failed ========");
        if (failed > 0) {
            System.exit(1);
        }
    }

    // ---------- 1. 参数契约：搜索可省略 vid，操作必须 vid ----------

    private static void testSchemaContract() {
        ToolDefinition search = DocSysToolFactory.searchFiles(null);
        JSONArray required = search.parameters.getJSONArray("required");
        check("search_files required 只有 query（vid 可省略）",
                required != null && required.size() == 1 && "query".equals(required.getString(0)),
                String.valueOf(required));
        check("search_files 仍声明 vid 参数（可选）", search.parameters.getJSONObject("properties").containsKey("vid"));

        ToolDefinition grep = DocSysToolFactory.grepFiles(null);
        JSONArray grepRequired = grep.parameters.getJSONArray("required");
        check("grep_files vid 仍必填（跨仓 grep = 逐仓全盘扫描，不放开）",
                grepRequired != null && contains(grepRequired, "vid") && contains(grepRequired, "pattern"),
                String.valueOf(grepRequired));

        // 用户裁定：增删改查读文件必须明确 vid —— 这些工具的 required 必须仍含 vid
        // 注意用 createFullRegistry：写工具不在只读注册表里（readOnly 会漏掉 write_file/create_folder 等）
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(null);
        String[] mustHaveVid = {"list_docs", "get_doc", "get_doc_history", "write_file", "write_note",
                "create_folder", "rename_doc", "move_doc", "copy_doc", "delete_doc"};
        List<String> missing = new ArrayList<String>();
        for (String name : mustHaveVid) {
            ToolDefinition def = reg.find(name);
            JSONArray req = def == null ? null : def.parameters.getJSONArray("required");
            if (def == null || req == null || !contains(req, "vid")) {
                missing.add(name);
            }
        }
        check("文件操作类工具的 vid 仍然全部必填（10 个）", missing.isEmpty(), "缺失: " + missing);
    }

    // ---------- 2. 描述：跨仓能力 + grep 的能力边界 ----------

    private static void testDescriptions() {
        ToolDefinition search = DocSysToolFactory.searchFiles(null);
        check("search_files 描述说明可不传 vid 跨仓",
                search.description.contains("不传 vid") && search.description.contains("跨全部可访问仓库"),
                search.description);
        check("search_files 描述提醒拿到 vid 后要显式传给后续工具",
                search.description.contains("显式"), search.description);
        check("search_files 描述说明会做磁盘精确直查（含目录/未建索引项）",
                search.description.contains("直查") && search.description.contains("未建索引"), search.description);
        check("search_files 描述不把 grep_files 说成万能的兜底",
                !search.description.contains("改用 grep_files"), search.description);

        ToolDefinition grep = DocSysToolFactory.grepFiles(null);
        check("grep_files 描述如实说明只匹配文件内容",
                grep.description.contains("只匹配文件内容"), grep.description);
        check("grep_files 描述如实说明从不返回目录",
                grep.description.contains("从不返回目录"), grep.description);
        check("grep_files 描述指向 search_files / list_docs",
                grep.description.contains("search_files") && grep.description.contains("list_docs"), grep.description);
        check("grep_files vid 参数说明写明单仓库限制",
                grep.parameters.getJSONObject("properties").getJSONObject("vid")
                        .getString("description").contains("单仓库"),
                grep.parameters.getJSONObject("properties").getJSONObject("vid").getString("description"));
    }

    // ---------- 3. 跨仓渲染 ----------

    private static void testCrossReposRender() {
        List<Object> hits = new ArrayList<Object>();
        hits.add(hit(5, "test", "", "66666", 2, 0L, "direct", null));
        hits.add(hit(11, "搜索测试仓库", "doc/", "报告.md", 1, 2048L, "index", 1));

        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("status", "ok");
        resp.put("data", hits);
        resp.put("dataEx", hits.size());
        resp.put("msgData", meta(17, 17, 0, null));

        String out = DocSysToolFactory.formatSearchPage(resp, null, null, "{\"must\":[{\"field\":\"name\",\"term\":\"66666\"}]}",
                null, null, 100);
        System.out.println("---- search_files 跨仓 (len=" + out.length() + ") ----");
        System.out.println(firstLines(out, 4));
        check("表头写明跨全部可访问仓库与扫描进度",
                out.contains("跨全部可访问仓库（共 17 个，本次已扫 17 个）"), out.split("\n")[0]);
        check("每行带 vid 与仓库名", out.contains("vid=5(test)") && out.contains("vid=11(搜索测试仓库)"), out);
        check("目录行标 [目录] 且带尾斜杠", out.contains("[目录] 66666/"), out);
        check("文件行标 [文件]", out.contains("[文件] 报告.md"), out);
        check("不倒原始 JSON 字段名", !out.contains("reposId") && !out.contains("\"score\""), out);
        check("跨仓也逐行给 path", out.contains("path=\"\"") && out.contains("path=\"doc/\""), out);
        check("跨仓命中后给出“把 vid 显式传给后续工具”的下一步",
                out.contains("命中行里的 vid 就是") && out.contains("list_docs(vid=5"), out);

        // 跨仓 0 命中：必须明确是"全部仓库都没命中"而不是含糊的"没有命中"
        Map<String, Object> empty = new HashMap<String, Object>();
        empty.put("status", "ok");
        empty.put("data", new ArrayList<Object>());
        empty.put("msgData", meta(17, 17, 0, null));
        String emptyOut = DocSysToolFactory.formatSearchPage(empty, null, null, "q", null, null, 100);
        check("跨仓空结果明说“全部仓库都没有命中”", emptyOut.startsWith("全部仓库都没有命中："), emptyOut);
        check("跨仓空结果给出 list_docs / grep_files 建议",
                emptyOut.contains("list_docs") && emptyOut.contains("grep_files"), emptyOut);
    }

    // ---------- 4. 单仓渲染不回归 ----------

    private static void testSingleReposRenderUnchanged() {
        List<Object> hits = new ArrayList<Object>();
        hits.add(hit(5, "test", "a/", "x.md", 1, 10L, "index", 1));
        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("status", "ok");
        resp.put("data", hits);
        String out = DocSysToolFactory.formatSearchPage(resp, 5, "66666/", "q", null, null, 100);
        check("单仓表头仍是“仓库 5”", out.contains("仓库 5 / path=\"66666/\"") && !out.contains("跨全部"), out.split("\n")[0]);
        check("单仓行不带 vid= 前缀", !out.contains("vid="), out);
        check("单仓[文件]行仍给大小", out.contains("[文件] x.md") && out.contains("10B"), out);
        check("命中来源仍渲染（索引）", out.contains("命中=文件名"), out);
    }

    // ---------- 5. 直查命中标注 ----------

    private static void testDirectHitRender() {
        List<Object> hits = new ArrayList<Object>();
        hits.add(hit(5, "test", "", "66666", 2, 0L, "direct", null));
        hits.add(hit(5, "test", "", "66666.png", 1, 512L, "index", 2));
        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("status", "ok");
        resp.put("data", hits);
        String out = DocSysToolFactory.formatSearchPage(resp, 5, null, "q", null, null, 100);
        check("直查命中标 命中=直查（说明索引里可能没有它）", out.contains("命中=直查"), out);
        check("索引命中仍按 hitType 渲染", out.contains("命中=内容"), out);
        check("直查的目录行不给大小（目录 size 无意义）", !out.contains("[目录] 66666/  0B"), out);
    }

    // ---------- 6. 未扫完 / 失败仓库如实披露 ----------

    private static void testIncompleteScanDisclosure() {
        List<String> failed = new ArrayList<String>();
        failed.add("11(搜索测试仓库): connect timeout");

        Map<String, Object> resp = new HashMap<String, Object>();
        resp.put("status", "ok");
        resp.put("data", new ArrayList<Object>());
        resp.put("msgData", meta(17, 14, 3, failed));
        String out = DocSysToolFactory.formatSearchPage(resp, null, null, "q", null, null, 100);
        check("未扫完的仓库数必须披露", out.contains("3 个未扫描") && out.contains("只扫了 14 个"), out);
        check("失败仓库必须披露（不能把“没扫到”写成“没有命中”）", out.contains("1 个仓库搜索失败"), out);
    }

    // ---------- 7. 精确直查候选名的提取规则 ----------

    private static void testExactNameCandidate() {
        check("must 单个 name 条件 → 用作直查候选",
                "66666".equals(candidate("{\"must\":[{\"field\":\"name\",\"term\":\"66666\"}]}")));
        check("should 单个 name 条件也可用作候选",
                "报告".equals(candidate("{\"should\":[{\"field\":\"name\",\"term\":\"报告\"}]}")));
        check("值可含相对路径（交给 buildBasicDoc 拆分）",
                "66666/中文.txt".equals(candidate("{\"must\":[{\"field\":\"name\",\"term\":\"66666/中文.txt\"}]}")));
        check("wildcard 含通配符 → 不做直查",
                candidate("{\"must\":[{\"field\":\"name\",\"term\":\"*报告*\",\"match\":\"wildcard\"}]}") == null);
        check("两个 name 条件 → 不做直查",
                candidate("{\"must\":[{\"field\":\"name\",\"term\":\"a\"},{\"field\":\"name\",\"term\":\"b\"}]}") == null);
        check("带 mustNot → 不做直查",
                candidate("{\"must\":[{\"field\":\"name\",\"term\":\"a\"}],\"mustNot\":[{\"field\":\"comment\",\"term\":\"b\"}]}") == null);
        check("只有 content 条件 → 不做直查",
                candidate("{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}]}") == null);
        check("name+content 双条件 → 仍取那一个 name（直查是增量，不会误报）",
                "周报".equals(candidate("{\"must\":[{\"field\":\"name\",\"term\":\"周报\"},{\"field\":\"content\",\"term\":\"预算\"}]}")));
    }

    // ---------- 8. 服务端源码 lint ----------

    private static void testServerLint() {
        String src = readSource("src/com/DocSystem/controller/DocController.java");
        if (src == null) {
            check("能读到 DocController 源码（lint 前置）", false, "文件不存在？");
            return;
        }
        int start = src.indexOf("private Doc agentFindDocDirect");
        int end = src.indexOf("private static final int AGENT_SEARCH_MAX_ENTRY_PATH_LEN");
        check("找得到 agentFindDocDirect 方法", start > 0 && end > start, "start=" + start + " end=" + end);
        if (start > 0 && end > start) {
            String body = src.substring(start, end);
            check("直查经 docSysGetDoc（按 isFSM 分派本机/前置）", body.contains("docSysGetDoc("), body);
            check("直查不得直接调 fsGetDoc（对前置仓库 100% 假阴性）", !body.contains("fsGetDoc("), body);
        }

        int cs = src.indexOf("boolean crossRepos =");
        check("跨仓入口用 getAccessableReposList（与 searchDoc.do 同权限口径）",
                cs > 0 && src.substring(cs, cs + 4000).contains("getAccessableReposList("));
        int loop = src.indexOf("int scannedRepos = 0;");
        check("跨仓逐仓 try/catch 失败隔离", loop > 0 && src.substring(loop, loop + 2500).contains("failedRepos.add("));
        check("跨仓有总耗时上限（前置仓库连不上不能拖垮调用）",
                src.contains("AGENT_SEARCH_TOTAL_TIMEOUT_MS") && src.contains("reposSkipped"));
        check("grep 模式明确拒绝跨仓库（不偷偷全盘扫描）",
                src.contains("grep 模式需要指定 reposId"), "");
    }

    // ---------- helpers ----------

    private static String candidate(String queryJson) {
        return AgentSearchQuery.parse(queryJson).exactNameCandidate();
    }

    private static boolean contains(JSONArray arr, String v) {
        for (int i = 0; i < arr.size(); i++) {
            if (v.equals(arr.getString(i))) {
                return true;
            }
        }
        return false;
    }

    private static Map<String, Object> meta(int total, int scanned, int skipped, List<String> failed) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("crossRepos", Boolean.TRUE);
        m.put("reposTotal", total);
        m.put("reposScanned", scanned);
        m.put("reposSkipped", skipped);
        if (failed != null) {
            m.put("reposFailed", failed);
        }
        return m;
    }

    private static Map<String, Object> hit(int vid, String reposName, String path, String name, int type,
                                           long size, String via, Integer hitType) {
        Map<String, Object> h = new HashMap<String, Object>();
        h.put("reposId", vid);
        h.put("reposName", reposName);
        h.put("path", path);
        h.put("name", name);
        h.put("type", type);
        h.put("size", size);
        h.put("via", via);
        if (hitType != null) {
            h.put("hitType", hitType);
        }
        return h;
    }

    private static String firstLines(String s, int n) {
        String[] lines = s.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(n, lines.length); i++) {
            sb.append("   ").append(lines[i]).append("\n");
        }
        return sb.toString();
    }

    private static String readSource(String relative) {
        File f = new File(relative);
        if (!f.exists()) {
            f = new File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (Exception e) {
            return null;
        }
        return sb.toString();
    }

    private static void check(String name, boolean ok) {
        check(name, ok, "");
    }

    private static void check(String name, boolean ok, String detail) {
        if (ok) {
            passed++;
            System.out.println("[PASS] " + name);
        } else {
            failed++;
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : " | " + detail));
        }
    }
}
