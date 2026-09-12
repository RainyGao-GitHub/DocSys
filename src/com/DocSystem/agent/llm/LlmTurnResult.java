package com.DocSystem.agent.llm;

import com.DocSystem.agent.tool.ToolCall;

import java.util.ArrayList;
import java.util.List;

/**
 * T10：单轮 LLM 调用的结果 —— 文本 + 原生 tool_calls + 工具拒绝标记。
 *
 * <p>双通道依据：
 * <ul>
 *   <li>{@link #nativeToolCalls} 非空 → 直接执行（原生 function-calling 通道，无文本解析）；</li>
 *   <li>为空但 {@link #text} 疑似工具标记 → 由 ToolCallParser 文本通道解析；</li>
 *   <li>{@link #toolsRejected} = true → 请求带了 tools 但被端点 400 拒绝（已去 tools 重试成功），
 *       调用方应在本轮循环的后续回合不再携带 tools（thinking 类模型不支持工具）。</li>
 * </ul>
 */
public final class LlmTurnResult {

    /** 累积的正文文本（可能为空） */
    public final String text;

    /** 原生 tool_calls（可能为空列表；null 表示不适用） */
    public final List<ToolCall> nativeToolCalls;

    /** 端点拒绝了 tools 参数（本轮已无 tools 重试成功） */
    public final boolean toolsRejected;

    private LlmTurnResult(String text, List<ToolCall> nativeToolCalls, boolean toolsRejected) {
        this.text = text != null ? text : "";
        this.nativeToolCalls = nativeToolCalls != null ? nativeToolCalls : new ArrayList<ToolCall>();
        this.toolsRejected = toolsRejected;
    }

    public static LlmTurnResult text(String text) {
        return new LlmTurnResult(text, null, false);
    }

    public static LlmTurnResult toolCalls(String text, List<ToolCall> calls) {
        return new LlmTurnResult(text, calls, false);
    }

    public static LlmTurnResult rejected(String text) {
        return new LlmTurnResult(text, null, true);
    }

    public boolean hasNativeCalls() {
        return nativeToolCalls != null && !nativeToolCalls.isEmpty();
    }

    @Override
    public String toString() {
        return "LlmTurnResult{textLen=" + text.length()
                + ", nativeToolCalls=" + (nativeToolCalls == null ? "null" : nativeToolCalls.size())
                + ", toolsRejected=" + toolsRejected + "}";
    }
}
