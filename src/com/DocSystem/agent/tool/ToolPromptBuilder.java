package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import java.util.List;

/**
 * 工具使用提示词构建器 —— 把 ToolRegistry 里的工具描述渲染成 system prompt。
 *
 * <p>提示词结构：</p>
 * <pre>
 * [系统上下文：DocSys 文档管理系统]
 * [可用工具列表：name + description + parameters JSON Schema]
 * [工作方式：可连续调用工具；用 &lt;tool_call&gt; 标记；最终回答直接输出]
 * </pre>
 *
 * <p>对应开发计划 T1.4。</p>
 */
public class ToolPromptBuilder {

    /** 每个工具的 token 预算估算（description + schema 约 150-300 token/个），
     *  超出时按出现顺序截断（保留 description 精简版）。 */
    private static final int MAX_TOOL_CHARS = 6000;

    private ToolPromptBuilder() {
    }

    /**
     * 渲染完整 system prompt。
     *
     * @param tools 对当前用户可见的工具列表（已按角色过滤）
     */
    public static String buildSystemPrompt(List<ToolDefinition> tools) {
        StringBuilder sb = new StringBuilder();
        sb.append("DocSys document management context: help users with documents, repositories, ")
          .append("and related tasks. You are an autonomous assistant that can call tools to gather ")
          .append("information or perform actions on behalf of the user.\n\n");

        sb.append("You do not know what model or architecture you run on — if asked, say you are ")
          .append("an assistant in DocSys and focus on the user's needs.\n\n");

        sb.append("## Available Tools\n");
        if (tools == null || tools.isEmpty()) {
            sb.append("(none)\n\n");
        } else {
            appendTools(sb, tools);
        }

        sb.append("## How to use tools\n")
          .append("1. If the user's request needs information or actions, call the appropriate tool.\n")
          .append("2. You may call multiple tools sequentially — each result is fed back to you.\n")
          .append("3. To call a tool, output exactly one block in ONE of the following two forms:\n")
          .append("   Form A (JSON): <tool_call>{\"name\":\"tool_name\",\"arguments\":{\"param\":\"value\"}}</tool_call>\n")
          .append("   Form B (XML, also accepted): <functions><invoke name=\"tool_name\"><parameter name=\"param\">value</parameter></invoke></functions>\n")
          .append("   The content must contain the tool name and all required arguments.\n")
          .append("4. After the tool result comes back, continue reasoning. Call more tools if needed.\n")
          .append("5. When you have enough information (or no tool is needed), reply to the user directly ")
          .append("with the final answer. Never invent data — use tool results.\n")
          .append("6. If a tool returns an error, try to recover (fix parameters, pick another tool) or ")
          .append("tell the user clearly.\n");

        return sb.toString();
    }

    private static void appendTools(StringBuilder sb, List<ToolDefinition> tools) {
        int budget = MAX_TOOL_CHARS;
        for (ToolDefinition t : tools) {
            String block = renderTool(t);
            if (budget - block.length() < 0) {
                sb.append("- ").append(t.name).append(": (truncated — parameters omitted)\n");
                continue;
            }
            sb.append(block);
            budget -= block.length();
        }
    }

    private static String renderTool(ToolDefinition t) {
        StringBuilder sb = new StringBuilder();
        sb.append("- **").append(t.name).append("**");
        if (t.isWrite) {
            sb.append(" [write]");
        }
        if (t.adminOnly) {
            sb.append(" [admin]");
        }
        sb.append(": ").append(t.description).append("\n");
        if (t.parameters != null && !t.parameters.isEmpty()) {
            sb.append("  Parameters (JSON): ").append(JSON.toJSONString(t.parameters)).append("\n");
        }
        return sb.toString();
    }
}
