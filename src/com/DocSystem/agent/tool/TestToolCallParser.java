package com.DocSystem.agent.tool;

import java.util.List;

/**
 * T1.6 护栏：ToolCallParser。
 * 纯 Java 自包含测试（main 入口），无 Spring 依赖。
 *
 * 覆盖：
 *  - 正确 tool_call 解析（name + arguments）
 *  - 多 tool_call（多工具并行）
 *  - 无 tool_call → 空列表（视为最终回答）
 *  - 畸形 JSON → 全无效 → null（回灌重试）
 *  - 缺失 name → 无效
 *  - arguments 缺失/字符串形式
 *  - containsToolCall 判断
 */
public class TestToolCallParser {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testValidSingle();
        testValidMultiple();
        testNoToolCall();
        testMalformedJson();
        testMissingName();
        testMissingArguments();
        testArgumentsAsString();
        testContainsToolCall();
        testAnthropicXmlFormat();
        testAnthropicXmlWithParametersJson();
        testAnthropicXmlInvalid();
        testMalformedClosingTag();
        testPluralToolCalls();
        testMixedSingularPlural();
        testPluralMalformed();
        testFunctionsXmlFormat();
        testFunctionsXmlArgumentsJson();
        testFunctionsXmlMultipleInvokes();
        testFunctionsXmlMalformed();
        testFunctionsXmlPartial();
        testFunctionsWithSpaceTag();
        testFunctionCallsUnderscoreTag();
        testDsmlEscapedMarkup();
        System.out.println("\n======== TestToolCallParser: " + pass + " passed, " + fail + " failed ========");
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

    private static void testValidSingle() {
        String out = "我来查一下仓库\n<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("valid single: 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("valid single: name=list_repos", "list_repos".equals(calls.get(0).name));
            check("valid single: arguments empty obj", calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
        }
    }

    private static void testValidMultiple() {
        String out = "<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>"
                + "\n<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":1}}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("valid multiple: 2 calls", calls != null && calls.size() == 2);
        if (calls != null && calls.size() == 2) {
            check("multiple: first name", "list_repos".equals(calls.get(0).name));
            check("multiple: second name", "get_repos".equals(calls.get(1).name));
            check("multiple: second vid=1", calls.get(1).arguments.getInteger("vid") == 1);
        }
    }

    private static void testNoToolCall() {
        String out = "直接回答用户的问题，不需要工具。";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("no tool_call -> empty list (final answer)", calls != null && calls.isEmpty());
        check("null/empty -> empty list", ToolCallParser.parse(null).isEmpty());
        check("blank -> empty list", ToolCallParser.parse("   ").isEmpty());
    }

    private static void testMalformedJson() {
        String out = "<tool_call>{broken json}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("malformed json -> null (retry)", calls == null);
    }

    private static void testMissingName() {
        String out = "<tool_call>{\"arguments\":{}}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("missing name -> null (retry)", calls == null);
    }

    private static void testMissingArguments() {
        String out = "<tool_call>{\"name\":\"list_repos\"}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("missing arguments -> ok, empty args", calls != null && calls.size() == 1
                && calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
    }

    private static void testArgumentsAsString() {
        String out = "<tool_call>{\"name\":\"get_repos\",\"arguments\":\"{\\\"vid\\\":3}\"}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("arguments as string -> parsed", calls != null && calls.size() == 1
                && calls.get(0).arguments.getInteger("vid") == 3);
    }

    private static void testContainsToolCall() {
        check("containsToolCall true", ToolCallParser.containsToolCall("<tool_call>{}</tool_call>"));
        check("containsToolCall false", !ToolCallParser.containsToolCall("no marker here"));
    }

    /** T5.3 容错：模型偶发输出 Anthropic/Claude XML 格式 */
    private static void testAnthropicXmlFormat() {
        String out = "<tool_call>\n<invoke name=\"list_docs\">\n<parameter name=\"vid\">8</parameter>\n</invoke>\n</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("anthropic xml: parsed", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("anthropic xml: name=list_docs", "list_docs".equals(calls.get(0).name));
            check("anthropic xml: vid=8 (number)", calls.get(0).arguments.getInteger("vid") == 8);
        }
    }

    private static void testAnthropicXmlWithParametersJson() {
        String out = "<tool_call><invoke name=\"get_repos\"><parameters>{\"vid\":3}</parameters></invoke></tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("anthropic xml+parameters json: parsed", calls != null && calls.size() == 1
                && calls.get(0).arguments.getInteger("vid") == 3);
    }

    private static void testAnthropicXmlInvalid() {
        String out = "<tool_call><invoke name=\"\"></invoke></tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("anthropic xml empty name -> null", calls == null);
    }

    /** 关闭标签写错（如 </ce_tool_call>）→ 按畸形处理（null 重试），而非当最终回答 */
    private static void testMalformedClosingTag() {
        String out = "先查看一下。<tool_call>{\"name\":\"list_docs\",\"arguments\":{\"vid\":8}}</ce_tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("malformed closing tag -> null (retry)", calls == null);
        // 输出含 <tool_call 标记但无法解析 → 按畸形处理（重试），避免把残缺调用当最终回答
        check("stray <tool_call marker -> null (retry)",
                ToolCallParser.parse("请使用 <tool_call 格式调用工具") == null);
    }

    /** T8.1 容错：模型漂移输出复数包装 <tool_calls>...</tool_calls>（Anthropic 风格） */
    private static void testPluralToolCalls() {
        String out = "<tool_calls>\n{\"name\":\"list_repos\",\"arguments\":{}}\n</tool_calls>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("plural <tool_calls>: parsed 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("plural: name=list_repos", "list_repos".equals(calls.get(0).name));
            check("plural: args empty", calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
        }
        check("containsToolCall(plural) true", ToolCallParser.containsToolCall(out));
        // 复数带参
        String out2 = "<tool_calls>\n{\"name\":\"get_doc\",\"arguments\":{\"vid\":8,\"docId\":123}}\n</tool_calls>";
        List<ToolCall> calls2 = ToolCallParser.parse(out2);
        check("plural with args: parsed", calls2 != null && calls2.size() == 1
                && calls2.get(0).arguments.getInteger("vid") == 8
                && calls2.get(0).arguments.getLong("docId") == 123L);
    }

    /** 混合：复数包装 + 单数并列 */
    private static void testMixedSingularPlural() {
        String out = "<tool_calls>{\"name\":\"list_repos\",\"arguments\":{}}</tool_calls>"
                + "\n<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":1}}</tool_call>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("mixed singular+plural: 2 calls", calls != null && calls.size() == 2);
        if (calls != null && calls.size() == 2) {
            check("mixed: first list_repos", "list_repos".equals(calls.get(0).name));
            check("mixed: second get_repos", "get_repos".equals(calls.get(1).name));
        }
    }

    /** 复数未闭合 → 畸形（null 重试），而非当最终回答 */
    private static void testPluralMalformed() {
        String out = "<tool_calls>\n{\"name\":\"list_repos\",\"arguments\":{}}";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("plural unclosed -> null (retry)", calls == null);
    }

    /** T9.1：<functions><invoke>...</invoke></functions> 格式（deepseek-v4 漂移格式） */
    private static void testFunctionsXmlFormat() {
        String out = "<functions>\n<invoke name=\"list_repos\">\n<parameter name=\"arguments\">{}</parameter>\n</invoke>\n</functions>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions: 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("functions: name=list_repos", "list_repos".equals(calls.get(0).name));
            check("functions: empty args", calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
        }
        check("functions: containsToolCall", ToolCallParser.containsToolCall(out));
    }

    /** T9.1：单参数 arguments=<JSON> 解包为参数对象 */
    private static void testFunctionsXmlArgumentsJson() {
        String out = "<functions><invoke name=\"write_file\"><parameter name=\"arguments\">"
                + "{\"vid\": 1, \"name\": \"a.md\", \"content\": \"# hi\"}"
                + "</parameter></invoke></functions>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions: args json 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("functions: vid=1", calls.get(0).arguments.getInteger("vid") == 1);
            check("functions: name=a.md", "a.md".equals(calls.get(0).arguments.getString("name")));
            check("functions: content=# hi", "# hi".equals(calls.get(0).arguments.getString("content")));
        }
    }

    /** T9.1：一个 functions 块内多个 invoke */
    private static void testFunctionsXmlMultipleInvokes() {
        String out = "我先查一下。\n<functions>"
                + "<invoke name=\"list_repos\"><parameter name=\"arguments\">{}</parameter></invoke>"
                + "\n<invoke name=\"get_login_user\"><parameter name=\"arguments\">{}</parameter></invoke>"
                + "</functions>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions: 2 invokes", calls != null && calls.size() == 2);
        if (calls != null && calls.size() == 2) {
            check("functions: invoke names",
                    "list_repos".equals(calls.get(0).name) && "get_login_user".equals(calls.get(1).name));
        }
    }

    /** T9.1：functions 块内 invoke 无 name → 全无效 → null */
    private static void testFunctionsXmlMalformed() {
        String out = "<functions><invoke></invoke></functions>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions: malformed -> null", calls == null);
    }

    /** T9.1：functions 未闭合 → 视为畸形重试而非最终回答 */
    private static void testFunctionsXmlPartial() {
        String out = "我来调用 <functions><invoke name=\"list_repos\"";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions: partial -> null", calls == null);
    }

    /** T9.1：模型把 "function calls" 写成带空格标签 <functions calls> → 仍能解析 */
    private static void testFunctionsWithSpaceTag() {
        String out = "<functions calls>\n<invoke name=\"list_repos\">\n"
                + "<parameter name=\"arguments\" string=\"false\">{}</parameter>\n"
                + "</invoke>\n</functions>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("functions(空格标签): 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("functions(空格标签): name=list_repos", "list_repos".equals(calls.get(0).name));
            check("functions(空格标签): args 解包", calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
        }
    }

    /** T9.1：下划线变体 <function_calls> 也能解析 */
    private static void testFunctionCallsUnderscoreTag() {
        String out = "<function_calls>\n<invoke name=\"get_login_user\">\n"
                + "<parameter name=\"arguments\">{}</parameter>\n"
                + "</invoke>\n</function_calls>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("function_calls(下划线): 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("function_calls: name=get_login_user", "get_login_user".equals(calls.get(0).name));
        }
    }

    /**
     * T9.3：LLM 网关转义格式回归（2026-09-13 线上实测原文）：
     * 网关把 `<` 转义成 `<｜DSML｜`、`</` 转义成 `</｜DSML｜`，且标签内有空格。
     * 线上证据：<｜DSML｜ calls> <｜DSML｜ invoke name="list_repos"> ...
     */
    private static void testDsmlEscapedMarkup() {
        String out = "<｜DSML｜ calls> <｜DSML｜ invoke name=\"list_repos\"> "
                + "<｜DSML｜ parameter name=\"arguments\" string=\"false\">{}</｜DSML｜ parameter> "
                + "</｜DSML｜ invoke> </｜DSML｜ calls>";
        List<ToolCall> calls = ToolCallParser.parse(out);
        check("DSML转义: 1 call", calls != null && calls.size() == 1);
        if (calls != null && !calls.isEmpty()) {
            check("DSML转义: name=list_repos", "list_repos".equals(calls.get(0).name));
            check("DSML转义: args 解包为空", calls.get(0).arguments != null && calls.get(0).arguments.isEmpty());
        }
        check("DSML转义: containsToolCall=true", ToolCallParser.containsToolCall(out));

        // 半角部分转义（只有开标签被转义）也应可解析
        String partial = "<｜DSML｜ tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</｜DSML｜tool_call>";
        List<ToolCall> calls2 = ToolCallParser.parse(partial);
        check("DSML转义(tool_call变体): 1 call", calls2 != null && calls2.size() == 1);
        if (calls2 != null && !calls2.isEmpty()) {
            check("DSML转义(tool_call变体): name=list_repos", "list_repos".equals(calls2.get(0).name));
        }
    }
}
