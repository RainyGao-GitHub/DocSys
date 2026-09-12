package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.List;

/**
 * T10：把工具注册表定义转换为 OpenAI 兼容的 tools 请求参数。
 *
 * <pre>
 * [{"type":"function","function":{"name":"list_repos","description":"...","parameters":{...}}}]
 * </pre>
 *
 * <p>参数 schema 直接复用 {@link ToolDefinition#parameters}（本就以 JSON Schema 形状定义）。</p>
 */
public class ToolSchemaBuilder {

    private ToolSchemaBuilder() {}

    /** 工具定义 → OpenAI tools 数组（空列表 → 空数组） */
    public static JSONArray build(List<ToolDefinition> tools) {
        JSONArray arr = new JSONArray();
        if (tools == null) {
            return arr;
        }
        for (ToolDefinition t : tools) {
            if (t == null || t.name == null || t.name.isEmpty()) {
                continue;
            }
            JSONObject fn = new JSONObject();
            fn.put("name", t.name);
            fn.put("description", t.description != null ? t.description : "");
            fn.put("parameters", t.parameters != null ? t.parameters : new JSONObject());

            JSONObject item = new JSONObject();
            item.put("type", "function");
            item.put("function", fn);
            arr.add(item);
        }
        return arr;
    }
}
