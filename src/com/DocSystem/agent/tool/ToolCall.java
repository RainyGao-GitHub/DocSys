package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSONObject;

/**
 * LLM 输出的工具调用解析结果。
 */
public class ToolCall {

    /**
     * 原生 tool_call 的 id（OpenAI 兼容 tool_calls[].id，回灌 role=tool 消息时需要）。
     * 文本通道解析出的调用没有 id（为 null，回灌走 [TOOL_RESULT] 标记）。
     */
    public final String id;

    /** 工具名 */
    public final String name;

    /** 参数（已解析 JSON；无参数时为空对象） */
    public final JSONObject arguments;

    /** 原始输出（LLM 那段包含 tool_call 标记的文本，用于回灌上下文） */
    public final String rawOutput;

    public ToolCall(String name, JSONObject arguments, String rawOutput) {
        this(null, name, arguments, rawOutput);
    }

    public ToolCall(String id, String name, JSONObject arguments, String rawOutput) {
        this.id = id;
        this.name = name;
        this.arguments = arguments != null ? arguments : new JSONObject();
        this.rawOutput = rawOutput;
    }

    @Override
    public String toString() {
        return "ToolCall{id=" + id + ", name=" + name + ", arguments=" + arguments + "}";
    }
}
