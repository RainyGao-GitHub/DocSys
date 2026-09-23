package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.search.AgentSearchExecutor;
import com.DocSystem.agent.search.AgentSearchQuery;
import com.DocSystem.common.entity.QueryCondition;
import com.alibaba.fastjson.JSONObject;
import org.apache.lucene.search.BooleanClause.Occur;

import java.util.ArrayList;
import java.util.List;

/**
 * T1-T4 护栏：Agent 文件搜索与写入工具组 + 搜索 DSL。
 *
 * 覆盖：
 *  - createFullRegistry：search_files/grep_files 为只读；create_folder/write_file/write_note 为写+确认
 *  - search_files 缺 query / grep_files 缺 pattern / write_file 缺 content → 明确报错（不触发 HTTP）
 *  - AgentSearchQuery.parse：合法 DSL、非法 field/match、content 上 wildcard 拒绝、mustNot 单独使用拒绝
 *  - AgentSearchExecutor.buildConditions：must→MUST、should→SHOULD、mustNot→MUST_NOT、term IK 分词、name 库字段映射
 *  - AgentSearchExecutor.normalizePathFilter / snippet
 */
public class TestAgentSearchWriteTools {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testRegistryFlags();
        testSearchToolValidation();
        testWriteToolValidation();
        testQueryParse();
        testBuildConditions();
        testPathFilterAndSnippet();
        System.out.println("\n======== TestAgentSearchWriteTools: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
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
            System.out.println("[FAIL] " + name + (detail == null ? "" : "  -> " + detail));
        }
    }

    // ---------- 工具注册与标记 ----------

    private static void testRegistryFlags() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);

        // 搜索工具：只读、无需确认
        String[] readTools = {"search_files", "grep_files"};
        for (String name : readTools) {
            ToolDefinition def = reg.find(name);
            check("read tool registered: " + name, def != null);
            if (def != null) {
                check(name + " not isWrite", !def.isWrite);
                check(name + " not needsConfirm", !def.needsConfirm);
                check(name + " not adminOnly", !def.adminOnly);
            }
        }

        // 旧工具必须下线
        check("search_docs removed", reg.find("search_docs") == null);
        check("create_doc removed", reg.find("create_doc") == null);

        // 写工具：isWrite + needsConfirm
        String[] writeTools = {"create_folder", "write_file", "write_office", "write_note"};
        for (String name : writeTools) {
            ToolDefinition def = reg.find(name);
            check("write tool registered: " + name, def != null);
            if (def != null) {
                check(name + " isWrite", def.isWrite);
                check(name + " needsConfirm", def.needsConfirm);
            }
        }
    }

    // ---------- 工具参数校验（不触发 HTTP） ----------

    private static void testSearchToolValidation() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createReadOnlyRegistry(client);

        ToolResult r1 = reg.execute("search_files", new JSONObject());
        // R3-10（2026-09-20）：vid 改为**可选**（省略 = 跨全部可访问仓库搜索），所以这里不再报 vid，
        // 而是报下一个必填项 query。vid 必填与否的完整断言见 TestSearchCrossRepo。
        check("search_files 省略 vid 后报 query 缺失（vid 已可选）",
                !r1.success && r1.error.contains("query") && !r1.error.contains("vid 必填"), r1.error);

        JSONObject hasVid = new JSONObject();
        hasVid.put("vid", 1);
        ToolResult r1b = reg.execute("search_files", hasVid);
        check("search_files missing query -> error", !r1b.success && r1b.error.contains("query"));

        ToolResult r3 = reg.execute("grep_files", hasVid);
        check("grep_files missing pattern -> error", !r3.success && r3.error.contains("pattern"));
    }

    private static void testWriteToolValidation() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);

        ToolResult r1 = reg.execute("write_file", new JSONObject());
        check("write_file missing vid -> error", !r1.success && r1.error.contains("vid"));

        JSONObject hasVid = new JSONObject();
        hasVid.put("vid", 1);
        // R3-2 体检：给全 path/name，只缺 content —— 这样断言的才是"缺 content"本身。
        // （旧写法只传 vid，实际是 path 先缺；必填校验修好之前会误绿）
        JSONObject noContent = new JSONObject();
        noContent.put("vid", 1);
        noContent.put("path", "66666/");
        noContent.put("name", "a.txt");
        ToolResult r1b = reg.execute("write_file", noContent);
        check("write_file missing content -> error", !r1b.success && r1b.error.contains("content"), r1b.error);

        ToolResult r2 = reg.execute("write_note", noContent);
        check("write_note missing content -> error", !r2.success && r2.error.contains("content"), r2.error);

        ToolResult r3 = reg.execute("write_file", new JSONObject());
        check("write_file 完全空参报第一个缺的必填字段", !r3.success
                && r3.error.contains("missing required parameter"), r3.error);
    }

    // ---------- 查询 DSL 解析 ----------

    private static void testQueryParse() {
        // 合法完整 DSL
        String json = "{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}],"
                + "\"should\":[{\"field\":\"name\",\"term\":\"周报\",\"match\":\"fuzzy\"}],"
                + "\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}";
        AgentSearchQuery q = AgentSearchQuery.parse(json);
        check("parse valid DSL", q != null);
        check("parse: must=1", q.must.size() == 1);
        check("parse: should=1", q.should.size() == 1);
        check("parse: mustNot=1", q.mustNot.size() == 1);
        check("parse: match normalized", "fuzzy".equals(q.should.get(0).matchOrDefault()));
        check("parse: collectTerms=2", q.collectTerms().size() == 2);

        // 非法 field
        expectParseFail("invalid field", "{\"must\":[{\"field\":\"size\",\"term\":\"x\"}]}");
        // 非法 match
        expectParseFail("invalid match", "{\"must\":[{\"field\":\"name\",\"term\":\"x\",\"match\":\"regex\"}]}");
        // content 上 wildcard 拒绝
        expectParseFail("wildcard on content rejected", "{\"must\":[{\"field\":\"content\",\"term\":\"x\",\"match\":\"wildcard\"}]}");
        // mustNot 单独使用拒绝
        expectParseFail("mustNot only rejected", "{\"mustNot\":[{\"field\":\"content\",\"term\":\"x\"}]}");
        // 空查询拒绝
        expectParseFail("empty query rejected", "{\"must\":[],\"should\":[],\"mustNot\":[]}");
        // 非 JSON
        expectParseFail("non-json rejected", "hello world");

        // 旧路径迁移用：关键词 → 三字段 should DSL（含特殊字符安全）
        String kwJson = DocSysClient.buildKeywordQueryJson("预算\"测试\\转义");
        AgentSearchQuery kw = AgentSearchQuery.parse(kwJson);
        check("keyword query: 3 shoulds", kw != null && kw.should.size() == 3
                && kw.must.isEmpty() && kw.mustNot.isEmpty());
        check("keyword query: fields",
                kw != null && "name".equals(kw.should.get(0).field)
                        && "content".equals(kw.should.get(1).field)
                        && "comment".equals(kw.should.get(2).field));
    }

    private static void expectParseFail(String name, String json) {
        boolean failed = false;
        try {
            AgentSearchQuery.parse(json);
        } catch (IllegalArgumentException e) {
            failed = true;
        }
        check("parse fail: " + name, failed);
    }

    // ---------- 条件构建（DSL → QueryCondition） ----------

    private static void testBuildConditions() {
        String json = "{\"must\":[{\"field\":\"name\",\"term\":\"周报\",\"match\":\"prefix\"}],"
                + "\"should\":[{\"field\":\"content\",\"term\":\"预算\"}],"
                + "\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}";
        AgentSearchQuery q = AgentSearchQuery.parse(json);

        List<List<QueryCondition>> perLib = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            perLib.add(new ArrayList<QueryCondition>());
        }
        AgentSearchExecutor.buildConditions(q, perLib);

        // must: name+prefix → 名字库(nameForSearch) + MUST + Wildcard_Prefix
        List<QueryCondition> nameLib = perLib.get(AgentSearchExecutor.IDX_NAME);
        check("name lib conditions=1", nameLib.size() == 1);
        QueryCondition c0 = nameLib.get(0);
        check("name field=nameForSearch", "nameForSearch".equals(c0.getField()));
        check("name occur=MUST", c0.getOccurType() == Occur.MUST);
        check("name queryType=Wildcard_Prefix", c0.getQueryType() == QueryCondition.SEARCH_TYPE_Wildcard_Prefix);

        // should: content term → 内容库 + SHOULD（IK 分词后至少一个词）
        List<QueryCondition> contentLib = perLib.get(AgentSearchExecutor.IDX_CONTENT);
        check("content lib non-empty", !contentLib.isEmpty());
        for (QueryCondition c : contentLib) {
            check("content field=content", "content".equals(c.getField()));
            check("content occur=SHOULD", c.getOccurType() == Occur.SHOULD);
            check("content queryType=Term", c.getQueryType() == QueryCondition.SEARCH_TYPE_Term);
        }

        // mustNot: comment term → 备注库 + MUST_NOT
        List<QueryCondition> commentLib = perLib.get(AgentSearchExecutor.IDX_COMMENT);
        check("comment lib non-empty", !commentLib.isEmpty());
        for (QueryCondition c : commentLib) {
            check("comment occur=MUST_NOT", c.getOccurType() == Occur.MUST_NOT);
        }

        // IK 分词可用性
        List<String> tokens = AgentSearchExecutor.tokenize("项目预算报告");
        check("IK tokenize non-empty", !tokens.isEmpty());
    }

    // ---------- 路径归一化与片段 ----------

    private static void testPathFilterAndSnippet() {
        check("normalize /docs/2026 -> docs/2026/",
                "docs/2026/".equals(AgentSearchExecutor.normalizePathFilter("/docs/2026")));
        check("normalize docs/2026/ -> docs/2026/",
                "docs/2026/".equals(AgentSearchExecutor.normalizePathFilter("docs/2026/")));
        check("normalize null -> empty",
                "".equals(AgentSearchExecutor.normalizePathFilter(null)));
        check("normalize \\ style",
                "a/b/".equals(AgentSearchExecutor.normalizePathFilter("\\a\\b")));

        String longText = repeat("x", 300);
        String s = AgentSearchExecutor.snippet(longText, 50);
        check("snippet truncated", s != null && s.length() == 51 && s.endsWith("…"));
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }
}
