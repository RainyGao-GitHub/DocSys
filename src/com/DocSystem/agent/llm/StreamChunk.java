package com.DocSystem.agent.llm;

/**
 * 流式响应分片 —— 携带类型（text / reasoning / done）与内容。
 *
 * <p>T7 流式体验升级：LLM 流式输出逐 token 到达时，reasoning（思考过程）与
 * content（正文）必须分离，前端才能把 reasoning 以灰色小字展示、正文实时追加。</p>
 *
 * <p>类型说明：</p>
 * <ul>
 *   <li>{@link #TYPE_TEXT}：正文分片（最终回答 / 工具调用中间文本）</li>
 *   <li>{@link #TYPE_REASONING}：思考过程分片（OpenAI 兼容流 reasoning_content/reasoning）</li>
 *   <li>{@link #TYPE_DONE}：流结束标记（保证迭代器末尾必有）</li>
 * </ul>
 */
public final class StreamChunk {

    public static final String TYPE_TEXT = "text";
    public static final String TYPE_REASONING = "reasoning";
    public static final String TYPE_DONE = "done";
    /** T10：原生 tool_call 完成块（流结束后、done 前逐个到达） */
    public static final String TYPE_TOOL_CALL = "tool_call";
    /** T10：端点拒绝 tools（已去 tools 重试；本轮后续分片来自无 tools 请求） */
    public static final String TYPE_TOOLS_REJECTED = "tools_rejected";

    /** 分片类型（text/reasoning/tool_call/done） */
    public final String type;

    /** 分片内容（done 时为 ""） */
    public final String content;

    /** tool_call 分片携带的完整调用（其余类型为 null） */
    public final com.DocSystem.agent.tool.ToolCall toolCall;

    private StreamChunk(String type, String content) {
        this.type = type;
        this.content = content != null ? content : "";
        this.toolCall = null;
    }

    private StreamChunk(com.DocSystem.agent.tool.ToolCall toolCall) {
        this.type = TYPE_TOOL_CALL;
        this.content = "";
        this.toolCall = toolCall;
    }

    public static StreamChunk text(String content) {
        return new StreamChunk(TYPE_TEXT, content);
    }

    public static StreamChunk reasoning(String content) {
        return new StreamChunk(TYPE_REASONING, content);
    }

    public static StreamChunk done() {
        return new StreamChunk(TYPE_DONE, "");
    }

    /** T10：原生 tool_call 完成块（name/arguments 已完整） */
    public static StreamChunk toolCall(com.DocSystem.agent.tool.ToolCall call) {
        return new StreamChunk(call);
    }

    /** T10：端点拒绝 tools 标记块（先于 text/tool_call/done 到达） */
    public static StreamChunk toolsRejected() {
        return new StreamChunk(TYPE_TOOLS_REJECTED, "");
    }

    public boolean isText() { return TYPE_TEXT.equals(type); }
    public boolean isReasoning() { return TYPE_REASONING.equals(type); }
    public boolean isDone() { return TYPE_DONE.equals(type); }
    public boolean isToolCall() { return TYPE_TOOL_CALL.equals(type); }
    public boolean isToolsRejected() { return TYPE_TOOLS_REJECTED.equals(type); }

    @Override
    public String toString() {
        return "StreamChunk{" + type + ":" + (content != null && content.length() > 40
                ? content.substring(0, 40) + "..." : content) + "}";
    }
}
