package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * T10 护栏：ToolSchemaBuilder（工具定义 → OpenAI tools 参数）。
 */
public class TestToolSchemaBuilder {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testBuild();
        testEmpty();
        testNull();
        System.out.println("\n======== TestToolSchemaBuilder: " + pass + " passed, " + fail + " failed ========");
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

    private static void testBuild() {
        JSONObject params = new JSONObject();
        params.put("type", "object");
        JSONObject props = new JSONObject();
        JSONObject vid = new JSONObject();
        vid.put("type", "integer");
        vid.put("description", "仓库ID");
        props.put("vid", vid);
        params.put("properties", props);
        params.put("required", new com.alibaba.fastjson.JSONArray());
        params.getJSONArray("required").add("vid");

        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder("list_repos", "列出仓库", args -> ToolResult.ok("[]"))
                .parameters(params).build());

        List<ToolDefinition> list = reg.listForUser(true);
        JSONArray arr = ToolSchemaBuilder.build(list);
        check("build: 1 item", arr.size() == 1);
        JSONObject item = arr.getJSONObject(0);
        check("build: type=function", item != null && "function".equals(item.getString("type")));
        JSONObject fn = item == null ? null : item.getJSONObject("function");
        check("build: function.name", fn != null && "list_repos".equals(fn.getString("name")));
        check("build: function.description", fn != null && "列出仓库".equals(fn.getString("description")));
        JSONObject p = fn == null ? null : fn.getJSONObject("parameters");
        check("build: parameters preserved",
                p != null && "object".equals(p.getString("type"))
                        && p.getJSONObject("properties") != null
                        && p.getJSONObject("properties").getJSONObject("vid") != null);
    }

    private static void testEmpty() {
        JSONArray arr = ToolSchemaBuilder.build(new ArrayList<ToolDefinition>());
        check("empty: 0 items", arr.size() == 0);
    }

    private static void testNull() {
        JSONArray arr = ToolSchemaBuilder.build(null);
        check("null: 0 items", arr.size() == 0);
    }
}
