package com.DocSystem.agent.tool;

/**
 * 确认事件推送器 —— 写操作需要用户确认时，把 confirmToken 推送给前端（SSE）。
 *
 * <p>实现方通常持有 SseEmitter，推送 {@code {"type":"confirm",...}} 事件；
 * 无推送通道（如 /execute 非 SSE 路径）时传 no-op，token 仅日志/审计可见。</p>
 */
@FunctionalInterface
public interface ConfirmEventSink {

    /**
     * 写操作需要确认时调用。
     *
     * @param toolName      工具名
     * @param confirmToken  确认令牌（前端经 POST /agent/confirm 提交）
     * @param message       面向用户的确认提示
     */
    void onConfirmRequired(String toolName, String confirmToken, String message);

    /**
     * P2：带参数的确认推送（供前端给出"作用域授权"选项）。
     *
     * <p>默认实现退化为 3 参版本——旧实现（含测试/非交互路径）无需改动即保持原行为。</p>
     *
     * @param args 工具参数（弹窗据此提供"该目录/该仓库"作用域）
     */
    default void onConfirmRequired(String toolName, String confirmToken, String message,
                                   com.alibaba.fastjson.JSONObject args) {
        onConfirmRequired(toolName, confirmToken, message);
    }

    /** 无推送通道（no-op） */
    ConfirmEventSink NOOP = (toolName, confirmToken, message) -> {};
}
