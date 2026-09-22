package com.DocSystem.agent.orchestrator;

import java.util.List;
import java.util.Map;

/**
 * ToolUseLoop 执行结果。
 */
public class ToolUseResult {

    /** 是否成功（成功 = LLM 给出了最终回答；失败 = 超轮数/异常） */
    public final boolean success;

    /** LLM 最终回答（成功时）或错误信息（失败时） */
    public final String message;

    /** 完整对话转录（system + user + assistant + 工具结果），供审计/调试 */
    public final List<Map<String, String>> transcript;

    /** 实际使用的轮数（LLM 调用次数） */
    public final int turns;

    /** 工具调用总次数 */
    public final int toolCalls;

    /** 是否因预算到顶而交付“阶段性回答”（此时 success=true，但任务可能未完成） */
    public final boolean truncated;

    /** 是否因超轮数被中断（仅当预算收尾也不出文字时才为 true；truncated=true 时为 false） */
    public final boolean maxTurnsExceeded;

    public ToolUseResult(boolean success, String message, List<Map<String, String>> transcript,
                         int turns, int toolCalls, boolean maxTurnsExceeded, boolean truncated) {
        this.success = success;
        this.message = message;
        this.transcript = transcript;
        this.turns = turns;
        this.toolCalls = toolCalls;
        this.maxTurnsExceeded = maxTurnsExceeded;
        this.truncated = truncated;
    }

    public static ToolUseResult success(String answer, List<Map<String, String>> transcript,
                                        int turns, int toolCalls) {
        return new ToolUseResult(true, answer, transcript, turns, toolCalls, false, false);
    }

    /**
     * 预算到顶的阶段性回答（P1）：success=true（有可交付内容）+ truncated=true。
     * 调用方应把它当正常回答返回，并告知用户“未完成、可继续”。
     */
    public static ToolUseResult partial(String answer, List<Map<String, String>> transcript,
                                        int turns, int toolCalls) {
        return new ToolUseResult(true, answer, transcript, turns, toolCalls, false, true);
    }

    public static ToolUseResult error(String message, List<Map<String, String>> transcript,
                                      int turns, int toolCalls, boolean maxTurnsExceeded) {
        return new ToolUseResult(false, message, transcript, turns, toolCalls, maxTurnsExceeded, false);
    }

    @Override
    public String toString() {
        return "ToolUseResult{success=" + success + ", truncated=" + truncated + ", turns=" + turns
                + ", toolCalls=" + toolCalls + ", message=" + (message != null && message.length() > 60
                ? message.substring(0, 60) + "..." : message) + "}";
    }
}
