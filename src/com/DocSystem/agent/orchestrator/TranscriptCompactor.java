package com.DocSystem.agent.orchestrator;

import java.util.List;
import java.util.Map;

/**
 * 转录压缩器（P1/P2 共用）——把"工具推理过程"压成可读的进展摘要。
 *
 * <p>用途：</p>
 * <ul>
 *   <li>P1：{@code MainAgent} 的失败重试要**带着上一轮查到的东西**继续，而不是从头再来；</li>
 *   <li>P2：{@code ToolUseLoop.trimTranscript} 把过时的一轮工具结果折叠成一行摘要（不整条丢弃）；</li>
 *   <li>P3（待做）：用户点「继续」时把进展作为上下文注入。</li>
 * </ul>
 *
 * <p>设计约定：只输出**工具名 + 结果首行/前 N 字**，不臆造结论；总量有硬上限，避免摘要本身撑爆上下文。</p>
 */
public final class TranscriptCompactor {

    /** 单条工具结果在摘要里保留的最大字符数 */
    static final int PER_ENTRY_CHARS = 160;

    /** 折叠一轮时，一条摘要消息里最多容纳的字符数 */
    static final int FOLDED_ROUND_CHARS = 600;

    private TranscriptCompactor() {
    }

    /**
     * 把整个转录里的工具结果压成"进展摘要"（按出现顺序，每条一行）。
     *
     * @param transcript 转录（元素为 role/content 映射；内容形如 {@code [TOOL_RESULT tool=xxx] ...} 或原生 role=tool）
     * @param maxChars   摘要总长上限（≤0 表示不限，但仍受单条上限约束）
     * @return 摘要文本；没有任何工具结果时返回空串（调用方自行决定是否使用）
     */
    public static String summarize(List<Map<String, String>> transcript, int maxChars) {
        if (transcript == null || transcript.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Map<String, String> m : transcript) {
            String content = m == null ? null : m.get("content");
            if (content == null || content.isEmpty()) {
                continue;
            }
            String role = m.get("role");
            boolean isToolResult = "tool".equals(role) || content.startsWith("[TOOL_RESULT");
            if (!isToolResult) {
                continue;
            }
            if (content.startsWith("[TOOL_RESULT_SUMMARY")) {
                // 已是摘要：原样保留（本身就很短）
                appendLine(sb, content);
                continue;
            }
            String name = extractToolName(content);
            String body = stripMarker(content);
            appendLine(sb, "- " + name + ": " + oneLine(body));
            if (maxChars > 0 && sb.length() >= maxChars) {
                break;
            }
        }
        String out = sb.toString().trim();
        if (maxChars > 0 && out.length() > maxChars) {
            out = out.substring(0, maxChars) + "…（更早的进展已省略）";
        }
        return out;
    }

    /** 单条工具结果 → 一行摘要（含工具名）；用于 P2 折叠 */
    static String summaryLine(String content) {
        return summaryLine(null, content);
    }

    /**
     * 单条工具结果 → 一行摘要，工具名可由调用方显式给出（原生通道另拿不到名字时从 assistant.tool_calls 取）。
     *
     * @param toolName    显式工具名；null/空则从内容里的 {@code tool=} 标记推断
     * @param content     工具结果原文
     */
    static String summaryLine(String toolName, String content) {
        String name = (toolName == null || toolName.isEmpty()) ? extractToolName(content) : toolName;
        return "[TOOL_RESULT_SUMMARY tool=" + name + "] " + oneLine(stripMarker(content));
    }

    /** 推断工具名：优先 {@code [TOOL_RESULT tool=xxx]} 标记，其次 null → "unknown" */
    private static String extractToolName(String content) {
        int i = content.indexOf("tool=");
        if (i < 0) {
            return "unknown";
        }
        int start = i + "tool=".length();
        int end = start;
        while (end < content.length()) {
            char c = content.charAt(end);
            if (c == ']' || c == ' ' || c == '\n' || c == '\r') {
                break;
            }
            end++;
        }
        String name = content.substring(start, Math.min(end, content.length())).trim();
        return name.isEmpty() ? "unknown" : name;
    }

    /** 去掉 {@code [TOOL_RESULT ...]} / {@code [/TOOL_RESULT]} / {@code [TOOL_RESULT_SUMMARY ...]} 标记后取正文 */
    private static String stripMarker(String content) {
        String s = content;
        int close = s.indexOf(']');
        if (close >= 0 && s.startsWith("[TOOL_RESULT")) {
            s = s.substring(close + 1);
        }
        s = s.replace("[/TOOL_RESULT]", " ");
        return s.trim();
    }

    /** 压平换行 + 截断到单条上限 */
    static String oneLine(String s) {
        if (s == null) {
            return "";
        }
        String flat = s.replace('\r', ' ').replace('\n', ' ').trim();
        while (flat.contains("  ")) {
            flat = flat.replace("  ", " ");
        }
        if (flat.length() > PER_ENTRY_CHARS) {
            return flat.substring(0, PER_ENTRY_CHARS) + "…";
        }
        return flat;
    }

    private static void appendLine(StringBuilder sb, String line) {
        if (line == null || line.isEmpty()) {
            return;
        }
        String flat = line.replace('\r', ' ').replace('\n', ' ').trim();
        if (flat.isEmpty()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append('\n');
        }
        sb.append(flat);
    }
}
