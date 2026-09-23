package com.DocSystem.agent.permission;

/**
 * P2：本次工具调用的权限判定痕迹（线程内传递，供 SSE 的 tool_result 事件标注"批准来源"）。
 *
 * <p>为什么用 ThreadLocal：判定发生在 {@code ToolRegistry.execute()}（工具执行前），
 * 而向前端标注意图的时机在工具执行后的 {@code StreamSink.onToolResult}——两者在同一请求线程、
 * 一次工具调用一前一后，无需改动 {@code ToolResult} 结构即可把"
 * 手动 / 规则(该目录) / 自动档 / 全部允许"传给前端。</p>
 *
 * <p>格式：{@code <VERDICT>:<reason>}，例如 {@code ALLOW:rule(dir)}、{@code ASK:hardlist(destructive)}、
 * {@code ALLOW:mode(auto)}、{@code DENY:plan}。</p>
 */
public final class PermissionTrace {

    private static final ThreadLocal<String> LAST = new ThreadLocal<>();

    private PermissionTrace() {
    }

    public static void set(String trace) {
        LAST.set(trace);
    }

    /** 最后一次判定痕迹（无 → null） */
    public static String last() {
        return LAST.get();
    }

    public static void clear() {
        LAST.remove();
    }

    /**
     * 把痕迹转成前端可读的"批准方式"（供工具卡片显示）。
     *
     * @param trace {@code <VERDICT>:<reason>}
     */
    public static String approvalLabel(String trace) {
        if (trace == null || trace.isEmpty()) {
            return null;
        }
        int idx = trace.indexOf(':');
        String verdict = idx >= 0 ? trace.substring(0, idx) : trace;
        String reason = idx >= 0 ? trace.substring(idx + 1) : "";
        if ("ASK".equals(verdict)) {
            return "手动确认";
        }
        if ("DENY".equals(verdict)) {
            return "被拒绝";
        }
        if (reason.startsWith("rule(")) {
            return "已授权规则（" + reason.substring(5).replace(")", "") + "）";
        }
        if ("mode(auto)".equals(reason)) {
            return "自动档放行";
        }
        if ("mode(allowAll)".equals(reason)) {
            return "全部允许";
        }
        if ("plan".equals(reason)) {
            return "计划模式拒绝";
        }
        return reason.isEmpty() ? verdict : reason;
    }
}
