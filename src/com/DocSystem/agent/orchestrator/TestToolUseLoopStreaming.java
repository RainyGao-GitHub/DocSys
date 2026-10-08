package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.llm.StreamChunk;
import com.DocSystem.agent.tool.ToolCall;
import com.DocSystem.agent.tool.ToolDefinition;
import com.DocSystem.agent.tool.ToolRegistry;
import com.DocSystem.agent.tool.ToolResult;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * T7.1.3 护栏：ToolUseLoop 流式运行模式（假流式 LLM 分片驱动，无 Spring/无真实 LLM）。
 *
 * 覆盖：
 *  - 流式单轮：text 分片逐片回调 sink → 最终回答
 *  - 流式 reasoning：reasoning + text 分片分离回调
 *  - 流式多轮工具链：tool_call/tool_result 事件回调 + 轮末解析 + 最终回答
 *  - 流式工具失败：tool_result success=false 回调
 *  - 流式不可用回退：sink 给了但无流式通道 → 非流式执行，结果正确
 */
public class TestToolUseLoopStreaming {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testStreamingSingleTurnText();
        testStreamingReasoningSeparation();
        testStreamingToolChain();
        testStreamingToolFailure();
        testStreamingFallbackNonStreaming();
        testStreamingRetryHint();
        testStreamingOutputTruncatedWithText();
        testStreamingBlankAnswerThenRetry();
        System.out.println("\n======== TestToolUseLoopStreaming: " + pass + " passed, " + fail + " failed ========");
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

    // ---------- 测试工具 ----------

    private static ToolRegistry buildRegistry() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder("list_repos", "列出仓库",
                args -> ToolResult.ok("[仓库1, 仓库2]")).build());
        reg.register(ToolDefinition.builder("boom", "抛异常工具",
                args -> ToolResult.error("执行失败: disk full")).build());
        return reg;
    }

    /** 脚本化流式假 LLM：按调用次数返回分片脚本（每轮一个分片列表） */
    private static ToolUseLoop.StreamingLlmCaller scriptedStreaming(List<List<StreamChunk>> script) {
        return new ToolUseLoop.StreamingLlmCaller() {
            private int idx = 0;
            @Override
            public Iterator<StreamChunk> chat(List<Map<String, String>> messages) {
                List<StreamChunk> turn = script.get(Math.min(idx++, script.size() - 1));
                return turn.iterator();
            }
        };
    }

    /** 记录流式事件 sink */
    private static class RecordingSink implements ToolUseLoop.StreamSink {
        final StringBuilder reasoning = new StringBuilder();
        final StringBuilder text = new StringBuilder();
        final List<String> toolCalls = new ArrayList<>();
        final List<String> toolResults = new ArrayList<>();
        boolean retry = false;

        @Override
        public void onReasoning(String chunk) { reasoning.append(chunk); }
        @Override
        public void onText(String chunk) { text.append(chunk); }
        @Override
        public void onToolCall(ToolCall call) { toolCalls.add(call.name); }
        @Override
        public void onToolResult(ToolCall call, ToolResult result) {
            toolResults.add(call.name + ":" + result.success);
        }
        @Override
        public void onRetry() { retry = true; }
    }

    // ---------- 测试用例 ----------

    private static void testStreamingSingleTurnText() {
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.text("你好，"));
        turn1.add(StreamChunk.text("我是 DocSys 助手。"));
        turn1.add(StreamChunk.done());
        script.add(turn1);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("你好", null, sink);

        check("stream single: success", r.success);
        check("stream single: turns=1", r.turns == 1);
        check("stream single: final answer", r.message != null && r.message.contains("DocSys 助手"));
        check("stream single: sink text concatenated",
                sink.text.toString().equals("你好，我是 DocSys 助手。"));
        check("stream single: no tool events", sink.toolCalls.isEmpty() && sink.toolResults.isEmpty());
    }

    private static void testStreamingReasoningSeparation() {
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.reasoning("用户问仓库，"));
        turn1.add(StreamChunk.reasoning("需要查询数据库。"));
        turn1.add(StreamChunk.text("共有 2 个仓库。"));
        turn1.add(StreamChunk.done());
        script.add(turn1);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("有多少仓库", null, sink);

        check("stream reasoning: success", r.success);
        check("stream reasoning: reasoning sink",
                sink.reasoning.toString().equals("用户问仓库，需要查询数据库。"));
        check("stream reasoning: text sink", sink.text.toString().equals("共有 2 个仓库。"));
        check("stream reasoning: final answer clean", r.message.equals("共有 2 个仓库。"));
        // reasoning 不应混入正文
        check("stream reasoning: no reasoning in answer", !r.message.contains("查询数据库"));
    }

    private static void testStreamingToolChain() {
        // turn1: 调 list_repos（分片含 tool_call 标记）→ turn2: 最终回答
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.text("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>"));
        turn1.add(StreamChunk.done());
        script.add(turn1);
        List<StreamChunk> turn2 = new ArrayList<>();
        turn2.add(StreamChunk.reasoning("基于工具结果组织回答。"));
        turn2.add(StreamChunk.text("仓库列表："));
        turn2.add(StreamChunk.text("[仓库1, 仓库2]"));
        turn2.add(StreamChunk.done());
        script.add(turn2);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("列出仓库", null, sink);

        check("stream chain: success", r.success);
        check("stream chain: turns=2", r.turns == 2);
        check("stream chain: toolCalls=1", r.toolCalls == 1);
        check("stream chain: tool_call event", sink.toolCalls.size() == 1
                && sink.toolCalls.get(0).equals("list_repos"));
        check("stream chain: tool_result event", sink.toolResults.size() == 1
                && sink.toolResults.get(0).equals("list_repos:true"));
        check("stream chain: reasoning in turn2", sink.reasoning.toString().contains("工具结果"));
        check("stream chain: final answer", r.message.contains("仓库1"));
    }

    /** 2026-10-08：有正文但被输出上限截断（finish_reason=length）→ 交付 + 标记"可能未完成" */
    private static void testStreamingOutputTruncatedWithText() {
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.reasoning("想了很久…"));
        turn1.add(StreamChunk.text("我先给你半截结论："));
        turn1.add(StreamChunk.outputTruncated());
        turn1.add(StreamChunk.done());
        script.add(turn1);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("整理桌面", null, sink);

        check("stream truncated: success", r.success);
        check("stream truncated: truncated flag", r.truncated);
        check("stream truncated: reason=outputTruncated",
                ToolUseResult.REASON_OUTPUT_TRUNCATED.equals(r.truncatedReason));
        check("stream truncated: partial answer kept",
                r.message != null && r.message.contains("半截结论"));
        check("stream truncated: marker not treated as text",
                sink.text.toString().equals("我先给你半截结论："));
    }

    /**
     * 2026-10-08（生产故障复现形态）：推理模型思考吃光 max_tokens → 正文为空 + 截断标记。
     * 第 1 轮空正文 → 注入提示重试；第 2 轮拿到正文 → 正常交付（不再无声停下）。
     */
    private static void testStreamingBlankAnswerThenRetry() {
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.reasoning("（思考被截断，正文一个字都没出）"));
        turn1.add(StreamChunk.outputTruncated());
        turn1.add(StreamChunk.done());
        script.add(turn1);
        List<StreamChunk> turn2 = new ArrayList<>();
        turn2.add(StreamChunk.text("结论：桌面共 83 项，建议分 10 类。"));
        turn2.add(StreamChunk.done());
        script.add(turn2);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("整理桌面", null, sink);

        check("stream blank: success", r.success);
        check("stream blank: not truncated (retry recovered)", !r.truncated);
        check("stream blank: turns=2", r.turns == 2);
        check("stream blank: answer delivered",
                r.message != null && r.message.contains("结论：桌面共 83 项"));
        check("stream blank: reasoning reached sink",
                sink.reasoning.toString().contains("正文一个字都没出"));
    }

    private static void testStreamingToolFailure() {
        List<List<StreamChunk>> script = new ArrayList<>();
        List<StreamChunk> turn1 = new ArrayList<>();
        turn1.add(StreamChunk.text("<tool_call>{\"name\":\"boom\",\"arguments\":{}}</tool_call>"));
        turn1.add(StreamChunk.done());
        script.add(turn1);
        List<StreamChunk> turn2 = new ArrayList<>();
        turn2.add(StreamChunk.text("工具执行失败了。"));
        turn2.add(StreamChunk.done());
        script.add(turn2);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("测试失败工具", null, sink);

        check("stream fail: success", r.success);
        check("stream fail: tool_result success=false", sink.toolResults.size() == 1
                && sink.toolResults.get(0).equals("boom:false"));
        check("stream fail: result fed back", r.transcript.stream()
                .anyMatch(m -> m.get("content") != null && m.get("content").contains("ERROR: 执行失败: disk full")));
    }

    private static void testStreamingFallbackNonStreaming() {
        // 只给非流式通道 + sink → 自动回退非流式执行（结果正确，sink 无逐分片 text）
        List<String> script = new ArrayList<>();
        script.add("直接回答（非流式）。");

        ToolUseLoop.LlmCaller nonStreaming = new ToolUseLoop.LlmCaller() {
            private int idx = 0;
            @Override
            public String chat(List<Map<String, String>> messages) {
                return script.get(Math.min(idx++, script.size() - 1));
            }
        };
        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(nonStreaming, buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("你好", null, sink);

        check("fallback: success", r.success);
        check("fallback: final answer", r.message.contains("直接回答"));
        check("fallback: no streamed text to sink", sink.text.length() == 0);
    }

    private static void testStreamingRetryHint() {
        // 验证连续相同工具调用会回调 onToolCall + onToolResult（防死循环提示）
        List<List<StreamChunk>> script = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            List<StreamChunk> turn = new ArrayList<>();
            turn.add(StreamChunk.text("<tool_call>{\"name\":\"list_repos\",\"arguments\":{\"vid\":1}}</tool_call>"));
            turn.add(StreamChunk.done());
            script.add(turn);
        }
        List<StreamChunk> finalTurn = new ArrayList<>();
        finalTurn.add(StreamChunk.text("最终回答。"));
        finalTurn.add(StreamChunk.done());
        script.add(finalTurn);

        RecordingSink sink = new RecordingSink();
        ToolUseLoop loop = new ToolUseLoop(scriptedStreaming(script), buildRegistry(), false);
        ToolUseResult r = loop.runStreaming("重复调用测试", null, sink);

        check("retry-hint: success", r.success);
        // 第 3 次相同调用起注入提示（回调 tool_call + 失败 tool_result）
        check("retry-hint: tool_result has failure hint", sink.toolResults.stream()
                .anyMatch(s -> s.contains(":false")));
        check("retry-hint: eventually answered", r.message.contains("最终回答"));
    }
}
