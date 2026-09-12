package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.llm.LlmTurnResult;
import com.DocSystem.agent.llm.StreamChunk;
import com.DocSystem.agent.tool.ToolCall;
import com.DocSystem.agent.tool.ToolDefinition;
import com.DocSystem.agent.tool.ToolRegistry;
import com.DocSystem.agent.tool.ToolResult;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * T10 护栏：ToolUseLoop 双通道执行。
 *
 * 覆盖：
 *  - 原生 tool_calls 执行 + role=tool 回灌（tool_call_id 一一对应）
 *  - tools 被拒（toolsRejected）→ 后续轮文本通道兜底执行
 *  - 流式 tool_call 分片块 → 执行 + SSE 事件
 *  - 原生通道 + 文本通道混用（同一次 run）
 */
public class TestToolUseLoopNative {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testNativeCallsExecuteAndRefeed();
        testToolsRejectedThenTextFallback();
        testStreamingNativeToolCallChunks();
        testMixedNativeAndTextChannels();
        System.out.println("\n======== TestToolUseLoopNative: " + pass + " passed, " + fail + " failed ========");
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

    private static ToolRegistry buildRegistry() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder("list_repos", "列出仓库", args -> ToolResult.ok("[仓库1, 仓库2]")).build());
        reg.register(ToolDefinition.builder("get_repos", "获取仓库", args -> ToolResult.ok("仓库详情")).build());
        return reg;
    }

    /** 1. 原生 tool_calls 执行 + role=tool 回灌 */
    private static void testNativeCallsExecuteAndRefeed() {
        final AtomicInteger executed = new AtomicInteger();
        final List<List<Map<String, Object>>> seen = new ArrayList<>();
        ToolRegistry reg = buildRegistry();
        ToolUseLoop loop = new ToolUseLoop(null, null,
                new ToolUseLoop.LlmTurnCaller() {
                    @Override
                    public LlmTurnResult chat(List<Map<String, Object>> messages) throws Exception {
                        seen.add(messages);
                        if (seen.size() == 1) {
                            List<ToolCall> calls = new ArrayList<>();
                            calls.add(new ToolCall("call_abc", "list_repos", new com.alibaba.fastjson.JSONObject(), null));
                            return LlmTurnResult.toolCalls("正在列出仓库", calls);
                        }
                        return LlmTurnResult.text("最终回答：两个仓库");
                    }
                },
                null, reg, false, null);

        ToolUseResult result = loop.run("列出仓库");

        check("native: success", result.success);
        check("native: final answer", "最终回答：两个仓库".equals(result.message));
        check("native: toolCalls=1", result.toolCalls == 1);
        check("native: 2 turns", result.turns == 2);

        // 第二轮消息应含 role=tool 回灌 + assistant 带 tool_calls
        List<Map<String, Object>> turn2 = seen.get(1);
        boolean assistantWithToolCalls = false;
        boolean toolMsgWithId = false;
        for (Map<String, Object> m : turn2) {
            if ("assistant".equals(m.get("role")) && m.get("tool_calls") != null) {
                assistantWithToolCalls = true;
            }
            if ("tool".equals(m.get("role"))
                    && "call_abc".equals(m.get("tool_call_id"))
                    && m.get("content") != null) {
                toolMsgWithId = true;
            }
        }
        check("native: assistant msg carries tool_calls", assistantWithToolCalls);
        check("native: tool result refeed with tool_call_id", toolMsgWithId);
    }

    /** 2. tools 被拒 → 文本通道兜底 */
    private static void testToolsRejectedThenTextFallback() {
        final boolean[] enabled = {true};
        final AtomicInteger turn = new AtomicInteger();
        ToolRegistry reg = buildRegistry();
        ToolUseLoop loop = new ToolUseLoop(null, null,
                new ToolUseLoop.LlmTurnCaller() {
                    @Override
                    public LlmTurnResult chat(List<Map<String, Object>> messages) throws Exception {
                        int t = turn.incrementAndGet();
                        if (t == 1) {
                            // 真实语义：400 被拒 → 服务内去 tools 重试 → 重试响应文本带工具标记
                            return LlmTurnResult.rejected(
                                    "<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
                        }
                        return LlmTurnResult.text("文本通道最终回答");
                    }
                },
                null, reg, false, enabled);

        ToolUseResult result = loop.run("列出仓库");
        check("reject: success", result.success);
        check("reject: tool executed via text channel", result.toolCalls == 1);
        check("reject: tools flag flipped", !enabled[0]);
        check("reject: final answer", "文本通道最终回答".equals(result.message));
    }

    /** 3. 流式 tool_call 分片块 → 执行 + SSE 事件 */
    private static void testStreamingNativeToolCallChunks() {
        final AtomicInteger turn = new AtomicInteger();
        final List<String> events = new ArrayList<>();
        ToolRegistry reg = buildRegistry();
        ToolUseLoop loop = new ToolUseLoop(null, null, null,
                new ToolUseLoop.StreamingTurnCaller() {
                    @Override
                    public Iterator<StreamChunk> chat(List<Map<String, Object>> messages) throws Exception {
                        int t = turn.incrementAndGet();
                        List<StreamChunk> chunks = new ArrayList<>();
                        if (t == 1) {
                            chunks.add(StreamChunk.text("先看一下"));
                            chunks.add(StreamChunk.toolCall(new ToolCall("call_x", "list_repos", new com.alibaba.fastjson.JSONObject(), null)));
                            chunks.add(StreamChunk.text("调用完成"));
                        } else {
                            chunks.add(StreamChunk.text("流式最终回答"));
                        }
                        chunks.add(StreamChunk.done());
                        return chunks.iterator();
                    }
                },
                reg, false, null);

        ToolUseResult result = loop.runStreaming("列出仓库", null, new ToolUseLoop.StreamSink() {
            @Override
            public void onToolCall(ToolCall call) {
                events.add("tool_call:" + call.name);
            }
            @Override
            public void onToolResult(ToolCall call, ToolResult r) {
                events.add("tool_result:" + call.name + ":" + r.success);
            }
        });
        check("streamNative: success", result.success);
        check("streamNative: toolCalls=1", result.toolCalls == 1);
        check("streamNative: events", events.toString().equals("[tool_call:list_repos, tool_result:list_repos:true]"));
        check("streamNative: final answer", "流式最终回答".equals(result.message));
    }

    /** 4. 原生 + 文本通道混用（同一 run 内切换） */
    private static void testMixedNativeAndTextChannels() {
        final AtomicInteger turn = new AtomicInteger();
        ToolRegistry reg = buildRegistry();
        ToolUseLoop loop = new ToolUseLoop(null, null,
                new ToolUseLoop.LlmTurnCaller() {
                    @Override
                    public LlmTurnResult chat(List<Map<String, Object>> messages) throws Exception {
                        int t = turn.incrementAndGet();
                        if (t == 1) {
                            List<ToolCall> calls = new ArrayList<>();
                            calls.add(new ToolCall("call_1", "get_repos", new com.alibaba.fastjson.JSONObject(), null));
                            return LlmTurnResult.toolCalls("", calls);
                        }
                        if (t == 2) {
                            return LlmTurnResult.text("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
                        }
                        return LlmTurnResult.text("混合通道完成");
                    }
                },
                null, reg, false, null);

        ToolUseResult result = loop.run("混合");
        check("mixed: success", result.success);
        check("mixed: 2 tool calls total", result.toolCalls == 2);
        check("mixed: 3 turns", result.turns == 3);
    }
}
