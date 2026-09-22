package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.llm.LLMService;
import com.DocSystem.agent.llm.LlmTurnResult;
import com.DocSystem.agent.llm.ResolvedLlmConfig;
import com.DocSystem.agent.llm.StreamChunk;
import com.DocSystem.agent.tool.ToolSchemaBuilder;
import com.DocSystem.agent.tool.ToolCall;
import com.DocSystem.agent.tool.ToolCallParser;
import com.DocSystem.agent.tool.ToolPromptBuilder;
import com.DocSystem.agent.tool.ToolRegistry;
import com.DocSystem.agent.tool.ToolResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * ToolUseLoop —— 工具推理循环（REPL）：LLM 思考 → 决定调工具 → 执行 → 观察结果 → 再思考 → …直到给出最终回答。
 *
 * <p>这是把 Agent 从"意图分类器"升级为"推理引擎"的核心引擎，对应开发计划 T2.1。</p>
 *
 * <p>流程：</p>
 * <pre>
 * messages = [system(ToolPromptBuilder 渲染), user(userQuery)]
 * loop (MAX_TURNS) {
 *   response = llm.chat(messages, resolvedLlm)
 *   calls = ToolCallParser.parse(response)
 *   if (calls == null)            → 回灌"tool_call 格式错误"消息，继续（连续错误计数防死循环）
 *   if (calls.isEmpty())          → response 即最终回答，返回 success
 *   messages += assistant(response)        // LLM 的工具调用原文
 *   for each call:
 *     result = registry.execute(call)
 *     messages += toolResult(call, result) // 工具结果回灌
 * }
 * → 预算到顶：先跑一轮「预算收尾」（不下发 tools、忽略模型给出的工具调用），
 *   拿到一段阶段性结论 → success + truncated=true；收尾也没文字 → error + maxTurnsExceeded=true
 * </pre>
 *
 * <p>设计要点：</p>
 * <ul>
 *   <li>通过 {@link LlmCaller} 抽象 LLM 调用（默认包装 LLMService，测试可注入假实现，无需 Spring）。</li>
 *   <li>消息列表由本类自行管理（不用 LLMService.conversationHistory），以便自定义 system 提示词。</li>
 *   <li>工具结果以 role=user + {@code [TOOL_RESULT name=...]} 标记回灌（兼容不支持 tool role 的模型）。</li>
 *   <li>所有请求级配置为局部变量，不写共享字段（线程安全）。</li>
 *   <li><b>轮数预算</b>：默认 {@link #MAX_TURNS}，可经 {@link #setMaxTurns(int)} 覆盖（agent_config.agent_max_turns）。
 *       预算用完不再直接报错，而是多跑一轮「预算收尾」产出阶段结论（见 {@link #BUDGET_WRAPUP_HINT}）——
 *       参照 Claude Code “到顶交付 partial + 怎么继续”，避免多步任务的无声失败。</li>
 *   <li><b>上下文裁剪</b>：超限时先把手工具结果<b>折叠成一行摘要</b>（{@code [TOOL_RESULT_SUMMARY]}），
 *       而不是整条丢弃；且原生通道的折叠是“assistant(tool_calls) + 整组 tool 结果”整体替换，保持配对合法。</li>
 * </ul>
 */
public class ToolUseLoop {

    private static final Logger log = LoggerFactory.getLogger(ToolUseLoop.class);

    /** 单次请求默认最大工具轮数（LLM 调用次数预算；可经 setMaxTurns 覆盖） */
    public static final int MAX_TURNS = 25;

    /** 预算下限（setMaxTurns 钳制用） */
    public static final int MIN_TURNS = 5;

    /** 预算上限（setMaxTurns 钳制用） */
    public static final int MAX_TURNS_LIMIT = 50;

    /**
     * 预算收尾提示（P1）：最后一轮不再下发 tools，只要一段文字结论。
     * 要求模型自己说清“已完成 / 还缺什么 / 下一步”，这样到顶也是可交付的阶段性结果。
     */
    static final String BUDGET_WRAPUP_HINT =
            "[SYSTEM] 工具预算已用尽。请立即基于已有信息给出回答，**不要再调用任何工具**：\n"
          + "① 已完成什么（含关键结论/数据）；② 还缺什么（明确说出未完成的部分）；③ 建议的下一步。";

    /** 连续 tool_call 格式错误最大次数（超过则放弃，防死循环） */
    private static final int MAX_MALFORMED = 3;

    /** 连续相同工具调用最大次数（超过则注入提示，防死循环） */
    private static final int MAX_IDENTICAL_CALLS = 3;

    /** 对话转录最大消息条数（超出先折叠最早的工具结果，再删摘要，防上下文膨胀） */
    private static final int MAX_TRANSCRIPT_SIZE = 30;

    /** 对话转录总字符上限（超限同样先折叠；无完整结果可折叠则截断最长一条） */
    private static final int MAX_TRANSCRIPT_CHARS = 60000;

    /** 截断单条工具结果时的保留长度 */
    private static final int TRUNCATED_RESULT_CHARS = 400;

    /** 裁剪循环的最大步数（防任何病理情况下的死循环） */
    private static final int MAX_TRIM_STEPS = 200;

    /** 本实例的工具轮预算（默认 {@link #MAX_TURNS}，由 MainAgent 从 agent_config.agent_max_turns 覆盖） */
    private int maxTurns = MAX_TURNS;

    private final LlmCaller llmCaller;
    private final StreamingLlmCaller streamingLlmCaller;
    /** T10：原生通道调用抽象（text + 结构化 tool_calls + toolsRejected） */
    private final LlmTurnCaller llmTurnCaller;
    /** T10：流式原生通道调用抽象（分片含 tool_call/tools_rejected 块） */
    private final StreamingTurnCaller streamingTurnCaller;
    /** T10：请求级原生 tools 开关（端点拒绝后翻 false；null=无开关，纯文本通道） */
    private final boolean[] nativeToolsEnabled;
    private final ToolRegistry toolRegistry;

    /** 是否管理员（决定 adminOnly 工具可见性） */
    private final boolean isAdmin;

    /**
     * LLM 调用抽象 —— 默认包装 {@link LLMService#chat(List, ResolvedLlmConfig)}。
     */
    @FunctionalInterface
    public interface LlmCaller {
        String chat(List<Map<String, String>> messages) throws Exception;
    }

    /**
     * 流式 LLM 调用抽象（T7.1.3）—— 默认包装 {@link LLMService#streamChatChunks(List, ResolvedLlmConfig)}。
     * 返回的分片迭代器逐 token 到达（text/reasoning 分离），末尾必有 done。
     */
    @FunctionalInterface
    public interface StreamingLlmCaller {
        Iterator<StreamChunk> chat(List<Map<String, String>> messages) throws Exception;
    }

    /**
     * T10：原生通道调用抽象 —— 返回 text + 结构化 tool_calls（优先通道，无需文本解析）。
     */
    @FunctionalInterface
    public interface LlmTurnCaller {
        LlmTurnResult chat(List<Map<String, Object>> messages) throws Exception;
    }

    /**
     * T10：流式原生通道调用抽象 —— 分片含 tool_call/tools_rejected 块。
     */
    @FunctionalInterface
    public interface StreamingTurnCaller {
        Iterator<StreamChunk> chat(List<Map<String, Object>> messages) throws Exception;
    }

    /**
     * 流式事件回调（T7.1.3）—— SSE 路径把工具推理过程实时推给前端：
     * <ul>
     *   <li>{@link #onReasoning}：思考过程分片（灰色小字展示）</li>
     *   <li>{@link #onText}：正文分片（含工具调用中间文本，前端按需收进处理容器）</li>
     *   <li>{@link #onToolCall}：工具开始执行（工具卡片"调用中"）</li>
     *   <li>{@link #onToolResult}：工具执行完成（卡片结果/失败）</li>
     *   <li>{@link #onRetry}：本请求失败重试开始（前端清空当前消息已流式内容）</li>
     * </ul>
     * 全部默认空实现，非流式路径不受影响。
     */
    public interface StreamSink {
        default void onReasoning(String chunk) {}
        default void onText(String chunk) {}
        default void onToolCall(ToolCall call) {}
        default void onToolResult(ToolCall call, ToolResult result) {}
        default void onRetry() {}
    }

    /**
     * 便捷工厂：绑定 LLMService + resolved 配置。
     */
    public static ToolUseLoop forLlmService(LLMService llm, ToolRegistry registry,
                                             ResolvedLlmConfig resolved, boolean isAdmin) {
        return new ToolUseLoop(
                (LlmCaller) (messages -> llm.chat(messages, resolved)), registry, isAdmin);
    }

    /**
     * 便捷工厂（T7.1.3）：绑定 LLMService + resolved 配置，流式 + 非流式双通道。
     * 流式失败时（如 LLM 端点不支持 stream）可回退非流式通道，保证可用性。
     */
    public static ToolUseLoop forLlmServiceStreaming(LLMService llm, ToolRegistry registry,
                                                      ResolvedLlmConfig resolved, boolean isAdmin) {
        return new ToolUseLoop(
                (LlmCaller) (messages -> llm.chat(messages, resolved)),
                (StreamingLlmCaller) (messages -> llm.streamChatChunks(messages, resolved)),
                registry, isAdmin);
    }

    /**
     * T10：绑定 LLMService 原生工具通道（非流式）。
     * toolChoice=null/"auto" → 请求带 tools + tool_choice:auto；"none" → 不带 tools（纯文本通道）。
     * 端点 400 拒绝 tools 后，本次循环的后续轮次自动去 tools（text 通道继续可用）。
     */
    public static ToolUseLoop forLlmServiceNative(LLMService llm, ToolRegistry registry,
                                                   ResolvedLlmConfig resolved, boolean isAdmin,
                                                   String toolChoice) {
        final boolean[] enabled = { true };
        return new ToolUseLoop(null, null,
                (LlmTurnCaller) (messages -> llm.chatNative(messages, resolved,
                        effectiveTools(registry, isAdmin, enabled, toolChoice), toolChoice)),
                null, registry, isAdmin, enabled);
    }

    /** T10：绑定 LLMService 原生工具通道（流式，SSE 路径） */
    public static ToolUseLoop forLlmServiceStreamingNative(LLMService llm, ToolRegistry registry,
                                                            ResolvedLlmConfig resolved, boolean isAdmin,
                                                            String toolChoice) {
        final boolean[] enabled = { true };
        return new ToolUseLoop(null, null, null,
                (StreamingTurnCaller) (messages -> llm.streamChatChunksNative(messages, resolved,
                        effectiveTools(registry, isAdmin, enabled, toolChoice), toolChoice)),
                registry, isAdmin, enabled);
    }

    /** T10：上一工具调用签名（name+args，重复调用检测；每次 run 重置） */
    private String lastCallKey = null;
    /** T10：连续相同工具调用计数 */
    private int consecutiveIdentical = 0;

    /** T10：按开关与配置计算本轮 tools 参数（开关关闭或 toolChoice=none → null） */
    private static com.alibaba.fastjson.JSONArray effectiveTools(ToolRegistry registry, boolean isAdmin,
                                                                  boolean[] enabled, String toolChoice) {
        if (enabled != null && !enabled[0]) {
            return null;
        }
        if (toolChoice != null && "none".equalsIgnoreCase(toolChoice.trim())) {
            return null;
        }
        return ToolSchemaBuilder.build(registry.listForUser(isAdmin));
    }

    public ToolUseLoop(LlmCaller llmCaller, ToolRegistry toolRegistry, boolean isAdmin) {
        this(llmCaller, null, toolRegistry, isAdmin);
    }

    public ToolUseLoop(LlmCaller llmCaller, StreamingLlmCaller streamingLlmCaller,
                       ToolRegistry toolRegistry, boolean isAdmin) {
        this(llmCaller, streamingLlmCaller,
                legacyTurnCaller(llmCaller), legacyStreamingTurnCaller(streamingLlmCaller),
                toolRegistry, isAdmin, null);
    }

    /** T10 规范构造器：原生通道 + 旧式通道四选一/并存（旧式包装成 LlmTurnResult 文本结果）。包私有供同包测试注入开关 */
    ToolUseLoop(LlmCaller legacyLlmCaller, StreamingLlmCaller legacyStreamingCaller,
                LlmTurnCaller turnCaller, StreamingTurnCaller streamingTurnCaller,
                ToolRegistry toolRegistry, boolean isAdmin, boolean[] nativeToolsEnabled) {
        this.llmCaller = legacyLlmCaller;
        this.streamingLlmCaller = legacyStreamingCaller;
        this.llmTurnCaller = turnCaller;
        this.streamingTurnCaller = streamingTurnCaller;
        this.nativeToolsEnabled = nativeToolsEnabled;
        this.toolRegistry = toolRegistry;
        this.isAdmin = isAdmin;
    }

    /** 旧式非流式调用器 → 原生结果包装（text 通道） */
    private static LlmTurnCaller legacyTurnCaller(final LlmCaller legacy) {
        if (legacy == null) {
            return null;
        }
        return new LlmTurnCaller() {
            @Override
            public LlmTurnResult chat(List<Map<String, Object>> messages) throws Exception {
                return LlmTurnResult.text(legacy.chat(toStringMaps(messages)));
            }
        };
    }

    /** 旧式流式调用器 → 原生流式包装（无 tool_call/tools_rejected 块） */
    private static StreamingTurnCaller legacyStreamingTurnCaller(final StreamingLlmCaller legacy) {
        if (legacy == null) {
            return null;
        }
        return new StreamingTurnCaller() {
            @Override
            public Iterator<StreamChunk> chat(List<Map<String, Object>> messages) throws Exception {
                return legacy.chat(toStringMaps(messages));
            }
        };
    }

    /** Object 消息 → 旧式 String 消息（值 toString 拍平；复杂值不进旧通道） */
    private static List<Map<String, String>> toStringMaps(List<Map<String, Object>> messages) {
        List<Map<String, String>> out = new ArrayList<>();
        for (Map<String, Object> m : messages) {
            Map<String, String> c = new HashMap<>();
            for (Map.Entry<String, Object> e : m.entrySet()) {
                c.put(e.getKey(), e.getValue() == null ? "" : String.valueOf(e.getValue()));
            }
            out.add(c);
        }
        return out;
    }

    /** T8.5 每步工具审计回调（可为 null → 不审计） */
    private com.DocSystem.agent.audit.StepAuditSink stepAuditSink;

    /** T8.5 注入 Step 审计回调（工具链每步落库/观测） */
    public void setStepAuditSink(com.DocSystem.agent.audit.StepAuditSink sink) {
        this.stepAuditSink = sink;
    }

    /**
     * 设置本实例的工具轮预算（P1）——越界钳制到 [{@link #MIN_TURNS}, {@link #MAX_TURNS_LIMIT}]。
     * 每个请求单独构建本实例，无并发复用，故可用实例字段。
     */
    public void setMaxTurns(int turns) {
        this.maxTurns = Math.max(MIN_TURNS, Math.min(MAX_TURNS_LIMIT, turns));
        log.info("ToolUseLoop maxTurns set to {}", this.maxTurns);
    }

    /** 当前预算（护栏/日志用） */
    public int getMaxTurns() {
        return maxTurns;
    }

    /**
     * System prompt 装饰器（T8.6）—— 对默认工具链 system prompt 做后处理。
     * MainAgent 注入闭包：读取管理员配置的 override/suffix 并应用；null → 用默认。
     */
    @FunctionalInterface
    public interface SystemPromptDecorator {
        String apply(String basePrompt);
    }

    /** T8.6 管理员提示词配置装饰器（可为 null → 默认 prompt 不变） */
    private SystemPromptDecorator systemPromptDecorator;

    /** T8.6 注入提示词装饰器（管理员配置 override/suffix 生效入口） */
    public void setSystemPromptDecorator(SystemPromptDecorator decorator) {
        this.systemPromptDecorator = decorator;
    }

    /** 仅流式通道（测试/纯流式场景用），非流式通道为 null */
    public ToolUseLoop(StreamingLlmCaller streamingLlmCaller, ToolRegistry toolRegistry, boolean isAdmin) {
        this(null, streamingLlmCaller, toolRegistry, isAdmin);
    }

    /**
     * 运行工具推理循环。
     *
     * @param userQuery 用户请求
     * @return 执行结果（成功 = 最终回答；失败 = 超轮数/异常）
     */
    public ToolUseResult run(String userQuery) {
        return run(userQuery, null);
    }

    /**
     * 运行工具推理循环（带历史上下文，T5.2b 会话记忆）。
     *
     * @param userQuery      用户请求
     * @param priorHistory   历史消息（role ∈ user/assistant，按时间顺序）；null/空 = 新会话
     * @return 执行结果
     */
    public ToolUseResult run(String userQuery, List<Map<String, String>> priorHistory) {
        return runInternal(userQuery, priorHistory, null);
    }

    /**
     * 流式运行工具推理循环（T7.1.3）：与 {@link #run(String, List)} 完全同逻辑，
     * 只是每轮 LLM 输出逐分片回调 {@link StreamSink}（reasoning/text 实时推送，
     * 工具执行前后回调 tool_call/tool_result）。
     *
     * <p>若本实例没有流式通道（streamingLlmCaller == null），自动回退非流式执行
     * （过程事件仍回调：每轮完整响应解析后补发 text；工具事件照常）。</p>
     *
     * @param userQuery      用户请求
     * @param priorHistory   历史消息；null/空 = 新会话
     * @param sink           流式事件回调（可为 null → 退化为非流式行为）
     * @return 执行结果
     */
    public ToolUseResult runStreaming(String userQuery, List<Map<String, String>> priorHistory,
                                      StreamSink sink) {
        return runInternal(userQuery, priorHistory, sink);
    }

    /**
     * 单轮 LLM 输出执行器 —— 返回文本 + 原生 tool_calls（双通道数据源）。
     */
    @FunctionalInterface
    private interface TurnRunner {
        LlmTurnResult run(List<Map<String, Object>> messages) throws Exception;
    }

    private ToolUseResult runInternal(String userQuery, List<Map<String, String>> priorHistory,
                                      StreamSink sink) {
        List<Map<String, Object>> messages = new ArrayList<>();
        // T8.6：默认 system prompt 经管理员配置装饰器（override 替换 / suffix 追加）
        String systemPrompt = ToolPromptBuilder.buildSystemPrompt(toolRegistry.listForUser(isAdmin));
        if (systemPromptDecorator != null) {
            systemPrompt = systemPromptDecorator.apply(systemPrompt);
        }
        messages.add(systemMsg(systemPrompt));
        // 历史上下文注入（续接会话时 LLM 记得前文）
        if (priorHistory != null) {
            for (Map<String, String> h : priorHistory) {
                String role = h.get("role");
                String content = h.get("content");
                if (content == null || content.isEmpty()) continue;
                if ("user".equals(role) || "assistant".equals(role)) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("role", role);
                    m.put("content", content);
                    messages.add(m);
                }
            }
        }
        messages.add(userMsg(userQuery));

        int turns = 0;
        int toolCalls = 0;
        int consecutiveMalformed = 0;
        // 重复调用检测状态（每次 run 重置；本实例每请求单独构建，无并发复用）
        lastCallKey = null;
        consecutiveIdentical = 0;

        // 选择单轮执行器：有 sink 且流式通道可用 → 流式；否则非流式
        final TurnRunner turnRunner;
        if (sink != null && streamingTurnCaller != null) {
            turnRunner = msgs -> runStreamingTurn(msgs, sink);
        } else if (llmTurnCaller != null) {
            turnRunner = msgs -> llmTurnCaller.chat(msgs);
        } else if (streamingTurnCaller != null) {
            // 流式通道可用但无 sink：静默聚合（不回调事件）
            turnRunner = msgs -> runStreamingTurn(msgs, null);
            if (sink != null) {
                log.warn("ToolUseLoop: stream sink provided but non-streaming turn runner selected");
            }
        } else {
            throw new IllegalStateException("ToolUseLoop: no LLM caller configured");
        }

        try {
            while (turns < maxTurns) {
                turns++;
                LlmTurnResult turn = turnRunner.run(messages);
                log.debug("ToolUseLoop turn {}: textLen={}, nativeCalls={}, toolsRejected={}",
                        turns, turn.text.length(),
                        turn.nativeToolCalls == null ? 0 : turn.nativeToolCalls.size(),
                        turn.toolsRejected);

                // T10：端点拒绝 tools → 本次循环后续轮次关闭原生通道（文本通道继续可用）
                if (turn.toolsRejected) {
                    if (nativeToolsEnabled != null) {
                        nativeToolsEnabled[0] = false;
                    }
                    log.warn("ToolUseLoop: LLM 拒绝 tools（HTTP 400），后续轮次切换为纯文本通道");
                }

                List<ToolCall> nativeCalls = turn.hasNativeCalls() ? turn.nativeToolCalls : null;
                String responseText = turn.text;

                // ===== T10 双通道：原生 tool_calls 优先，文本通道（ToolCallParser）兜底 =====
                if (nativeCalls != null) {
                    com.DocSystem.common.Log.info("[ToolUseLoop][NATIVE] turn=" + turns
                            + " calls=" + nativeCalls.size()
                            + " first=" + (nativeCalls.isEmpty() ? "-" : nativeCalls.get(0).name));
                    // 原生通道回灌：assistant 消息带 tool_calls（id 必须与 tool 结果一一对应）
                    List<String> callIds = new ArrayList<>();
                    for (int i = 0; i < nativeCalls.size(); i++) {
                        ToolCall c = nativeCalls.get(i);
                        callIds.add(c.id != null ? c.id : "call_" + i);
                    }
                    messages.add(assistantMsgWithToolCalls(responseText, nativeCalls, callIds));
                    for (int i = 0; i < nativeCalls.size(); i++) {
                        executeCall(turns, nativeCalls.get(i), true, callIds.get(i), messages, sink);
                    }
                    toolCalls += nativeCalls.size();
                    trimTranscript(messages);
                    continue;
                }

                List<ToolCall> parsed = ToolCallParser.parse(responseText);
                // T9.1 诊断（写 docsys.log，线上排障可见）
                com.DocSystem.common.Log.info("[ToolUseLoop][PARSE] turn=" + turns + " len="
                        + (responseText != null ? responseText.length() : -1)
                        + " result=" + (parsed == null ? "NULL(畸形,将回灌重试)"
                        : (parsed.isEmpty() ? "EMPTY(视为最终回答)" : parsed.size() + "个调用"))
                        + " head=[" + truncateLog(responseText) + "]");
                if (parsed == null) {
                    // tool_call 标记存在但格式错误 → 回灌错误消息让 LLM 重试
                    consecutiveMalformed++;
                    if (consecutiveMalformed >= MAX_MALFORMED) {
                        log.warn("ToolUseLoop: too many malformed tool_call blocks, aborting");
                        return ToolUseResult.error(
                                "AI 多次输出格式错误的工具调用，已终止。请稍后重试或换个说法。",
                                toStringMaps(messages), turns, toolCalls, false);
                    }
                    messages.add(assistantMsg(responseText));
                    messages.add(userMsg(
                            "[SYSTEM] 你的工具调用格式无效。请使用以下两种格式之一（JSON 必须合法）：\n" +
                            "<tool_call>{\"name\":\"工具名\",\"arguments\":{...}}</tool_call>\n" +
                            "或 <functions><invoke name=\"工具名\"><parameter name=\"参数名\">值</parameter></invoke></functions>"));
                    continue;
                }

                if (parsed.isEmpty()) {
                    // 无工具调用 → 最终回答
                    return ToolUseResult.success(responseText, toStringMaps(messages), turns, toolCalls);
                }

                // 文本通道有工具调用 → 执行并回灌
                consecutiveMalformed = 0;
                messages.add(assistantMsg(responseText));
                for (ToolCall call : parsed) {
                    toolCalls++;
                    executeCall(turns, call, false, null, messages, sink);
                }
                // 上下文裁剪：保留 system + user 开头，超长时丢弃最早的工具结果
                trimTranscript(messages);
            }
        } catch (Exception e) {
            log.error("ToolUseLoop failed", e);
            return ToolUseResult.error("工具推理失败: " + e.getMessage(), toStringMaps(messages), turns, toolCalls, false);
        }

        // ===== P1 预算收尾：不再直接报错，先让模型用已有信息产出一段结论 =====
        log.warn("ToolUseLoop exceeded maxTurns={} (toolCalls={}), running budget wrap-up turn", maxTurns, toolCalls);
        // 原生通道：不再下发 tools（复用“端点拒绝 tools”的同一开关）；
        // 文本通道：模型仍可能吐 <tool_call>，收尾轮一律不执行（见下面的 stripToolCallMarkup）
        if (nativeToolsEnabled != null) {
            nativeToolsEnabled[0] = false;
        }
        messages.add(userMsg(BUDGET_WRAPUP_HINT));
        turns++;   // 收尾轮也是 1 次 LLM 调用，计入 turns 元数据
        try {
            LlmTurnResult wrap = turnRunner.run(messages);
            String wrapText = stripToolCallMarkup(wrap.text == null ? "" : wrap.text).trim();
            if (!wrapText.isEmpty()) {
                com.DocSystem.common.Log.info("[ToolUseLoop][WRAPUP] maxTurns=" + maxTurns
                        + " toolCalls=" + toolCalls + " answerLen=" + wrapText.length());
                return ToolUseResult.partial(wrapText, toStringMaps(messages), turns, toolCalls);
            }
            log.warn("ToolUseLoop budget wrap-up produced no text, falling back to error");
        } catch (Exception e) {
            log.warn("ToolUseLoop budget wrap-up turn failed: {}", e.getMessage());
        }

        return ToolUseResult.error(
                "处理超时：AI 连续调用工具过多仍未给出回答（已中断）。请缩小请求范围或重试。",
                toStringMaps(messages), turns, toolCalls, true);
    }

    /**
     * 去掉模型输出里的工具调用标记（收尾轮专用）：
     * 先走 {@link ToolCallParser#normalizeEscapedMarkup} 归一化转义变体，再删整块标记。
     */
    private static String stripToolCallMarkup(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        String s = ToolCallParser.normalizeEscapedMarkup(text);
        s = TOOL_CALL_BLOCK.matcher(s).replaceAll(" ");
        s = FUNCTIONS_BLOCK.matcher(s).replaceAll(" ");
        return s.trim();
    }

    private static final java.util.regex.Pattern TOOL_CALL_BLOCK =
            java.util.regex.Pattern.compile("<tool_call>.*?</tool_call>",
                    java.util.regex.Pattern.DOTALL | java.util.regex.Pattern.CASE_INSENSITIVE);

    private static final java.util.regex.Pattern FUNCTIONS_BLOCK =
            java.util.regex.Pattern.compile("<functions\\b[^>]*>.*?</functions>",
                    java.util.regex.Pattern.DOTALL | java.util.regex.Pattern.CASE_INSENSITIVE);

    /**
     * 执行单个工具调用（原生/文本通道共用）：重复调用检测、SSE 事件、step 审计、结果回灌。
     *
     * @param turns         当前轮次（审计/日志用）
     * @param call          待执行调用
     * @param nativeChannel true=原生通道（role=tool 回灌）；false=文本通道（[TOOL_RESULT] 回灌）
     * @param callId        原生调用的 id（文本通道为 null）
     */
    private void executeCall(int turns, ToolCall call,
                             boolean nativeChannel, String callId,
                             List<Map<String, Object>> messages, StreamSink sink) {
        // 连续相同工具调用检测（防死循环：LLM 反复调同一工具不换招）
        String callKey = call.name + "|" + (call.arguments != null ? call.arguments.toJSONString() : "{}");
        if (callKey.equals(lastCallKey)) {
            consecutiveIdentical++;
        } else {
            consecutiveIdentical = 1;
            lastCallKey = callKey;
        }
        if (consecutiveIdentical >= MAX_IDENTICAL_CALLS) {
            log.warn("ToolUseLoop: tool '{}' called {} times identically, injecting hint",
                    call.name, MAX_IDENTICAL_CALLS);
            ToolResult hintError = ToolResult.error(
                    "你已连续多次调用相同工具/参数且结果未改变。请换一个思路："
                    + "检查参数是否正确、改用其他工具，或直接基于已有信息回答用户。");
            messages.add(nativeChannel
                    ? toolResultMsgNative(callId, hintError)
                    : toolResultMsg(call.name, hintError));
            if (sink != null) {
                sink.onToolCall(call);
                sink.onToolResult(call, hintError);
            }
            // T8.5：被防死循环拦截的调用也计入 step 审计（success=false）
            if (stepAuditSink != null) {
                stepAuditSink.onStep(turns, call, hintError, 0L);
            }
            consecutiveIdentical = 0;
            lastCallKey = null;
            return;
        }

        log.info("ToolUseLoop executing tool '{}' args={} channel={}", call.name, call.arguments,
                nativeChannel ? "native" : "text");
        if (sink != null) {
            sink.onToolCall(call);
        }
        // T8.5：每步工具执行计时 + 审计
        long stepStart = System.currentTimeMillis();
        ToolResult result = toolRegistry.execute(call.name, call.arguments, isAdmin);
        long stepDuration = System.currentTimeMillis() - stepStart;
        if (stepAuditSink != null) {
            stepAuditSink.onStep(turns, call, result, stepDuration);
        }
        if (sink != null) {
            sink.onToolResult(call, result);
        }
        messages.add(nativeChannel
                ? toolResultMsgNative(callId, result)
                : toolResultMsg(call.name, result));
    }

    /**
     * 流式单轮执行：逐分片回调 sink（reasoning → onReasoning；text → onText），
     * 聚合完整响应文本 + 原生 tool_calls，返回双通道结果。
     */
    private LlmTurnResult runStreamingTurn(List<Map<String, Object>> messages, StreamSink sink) throws Exception {
        StringBuilder full = new StringBuilder();
        List<ToolCall> nativeCalls = new ArrayList<>();
        boolean toolsRejected = false;
        Iterator<StreamChunk> it = streamingTurnCaller.chat(messages);
        while (it.hasNext()) {
            StreamChunk chunk = it.next();
            if (chunk.isDone()) break;
            if (chunk.isToolsRejected()) {
                toolsRejected = true;
            } else if (chunk.isReasoning()) {
                if (sink != null) {
                    sink.onReasoning(chunk.content);
                }
            } else if (chunk.isToolCall()) {
                if (chunk.toolCall != null) {
                    nativeCalls.add(chunk.toolCall);
                }
            } else if (chunk.isText()) {
                full.append(chunk.content);
                if (sink != null) {
                    sink.onText(chunk.content);
                }
            }
        }
        if (toolsRejected) {
            return LlmTurnResult.rejected(full.toString());
        }
        return nativeCalls.isEmpty()
                ? LlmTurnResult.text(full.toString())
                : LlmTurnResult.toolCalls(full.toString(), nativeCalls);
    }

    // ---------- 消息构造 ----------

    private static Map<String, Object> systemMsg(String content) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "system");
        m.put("content", content);
        return m;
    }

    private static Map<String, Object> userMsg(String content) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "user");
        m.put("content", content);
        return m;
    }

    private static Map<String, Object> assistantMsg(String content) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "assistant");
        m.put("content", content);
        return m;
    }

    /** T10：原生通道 assistant 消息 —— 携带 tool_calls（id/type/function{name,arguments}），与 tool 结果一一对应 */
    private static Map<String, Object> assistantMsgWithToolCalls(String text, List<ToolCall> calls,
                                                                  List<String> callIds) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "assistant");
        m.put("content", text != null ? text : "");
        com.alibaba.fastjson.JSONArray tcs = new com.alibaba.fastjson.JSONArray();
        for (int i = 0; i < calls.size(); i++) {
            ToolCall c = calls.get(i);
            com.alibaba.fastjson.JSONObject fn = new com.alibaba.fastjson.JSONObject();
            fn.put("name", c.name);
            fn.put("arguments", c.arguments != null ? c.arguments.toJSONString() : "{}");
            com.alibaba.fastjson.JSONObject tc = new com.alibaba.fastjson.JSONObject();
            tc.put("id", callIds.get(i));
            tc.put("type", "function");
            tc.put("function", fn);
            tcs.add(tc);
        }
        m.put("tool_calls", tcs);
        return m;
    }

    /** 工具结果回灌：role=user + 结构化标记（兼容不支持 tool role 的模型） */
    private static Map<String, Object> toolResultMsg(String toolName, ToolResult r) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "user");
        m.put("content", "[TOOL_RESULT tool=" + toolName + "]\n" + r.toString() + "\n[/TOOL_RESULT]");
        return m;
    }

    /** T10：原生通道工具结果回灌：role=tool + tool_call_id（OpenAI 兼容约定） */
    private static Map<String, Object> toolResultMsgNative(String callId, ToolResult r) {
        Map<String, Object> m = new HashMap<>();
        m.put("role", "tool");
        m.put("tool_call_id", callId != null ? callId : "call_0");
        m.put("content", r.toString());
        return m;
    }

    /**
     * 上下文裁剪（P2）：超限时**先折叠、再删**——
     * <ol>
     *   <li>条数超 {@link #MAX_TRANSCRIPT_SIZE}：把最早的一整轮工具结果折叠成一条
     *       {@code [TOOL_RESULT_SUMMARY tool=xxx] <一行>}（保留“发生过什么”）；</li>
     *   <li>无可折叠轮次时，删最早的中间消息（保留 system + 首条 user）；</li>
     *   <li>总字符超 {@link #MAX_TRANSCRIPT_CHARS}：同样先折叠，最后才截断最长的一条结果。</li>
     * </ol>
     * ⚠️ 原生通道的折叠必须是 “assistant(tool_calls) + 整组 tool 结果” 整体替换成一条 user 消息，
     * 否则会留下“assistant 带 tool_calls 但缺 tool 结果”的非法转录（OpenAI 兼容端点会 400）。
     */
    private static void trimTranscript(List<Map<String, Object>> messages) {
        int folded = 0;
        int guard = 0;
        while (messages.size() > MAX_TRANSCRIPT_SIZE && guard++ < MAX_TRIM_STEPS) {
            int[] round = findOldestFoldableRound(messages);
            if (round != null) {
                foldRound(messages, round[0], round[1]);
                folded++;
                continue;
            }
            if (messages.size() <= 3) {
                break;
            }
            messages.remove(2);
        }
        guard = 0;
        while (totalChars(messages) > MAX_TRANSCRIPT_CHARS && guard++ < MAX_TRIM_STEPS) {
            int[] round = findOldestFoldableRound(messages);
            if (round != null) {
                foldRound(messages, round[0], round[1]);
                folded++;
                continue;
            }
            int longest = findLongestToolResult(messages);
            if (longest < 0) {
                break;
            }
            truncateContent(messages.get(longest), TRUNCATED_RESULT_CHARS);
        }
        if (folded > 0) {
            com.DocSystem.common.Log.info("[ToolUseLoop][TRIM] folded=" + folded
                    + " messages=" + messages.size() + " chars=" + totalChars(messages));
        }
    }

    /**
     * 找最早“可折叠的一轮”：assistant 消息 + 紧随其后的工具结果消息组。
     *
     * @return {startIndex, endIndexExclusive}；无可折叠轮次时 null
     */
    private static int[] findOldestFoldableRound(List<Map<String, Object>> messages) {
        for (int i = 2; i < messages.size() - 1; i++) {
            if (!"assistant".equals(messages.get(i).get("role"))) {
                continue;
            }
            if (!isFullToolResultMsg(messages.get(i + 1))) {
                continue;
            }
            int end = i + 1;
            while (end < messages.size() && isFullToolResultMsg(messages.get(end))) {
                end++;
            }
            return new int[]{i, end};
        }
        return null;
    }

    /** 工具结果消息：[TOOL_RESULT...]/[TOOL_RESULT_SUMMARY...] 的 user 消息，或原生 role=tool */
    private static boolean isToolResultMsg(Map<String, Object> m) {
        if (m == null) {
            return false;
        }
        if ("tool".equals(m.get("role"))) {
            return true;
        }
        Object content = m.get("content");
        return "user".equals(m.get("role")) && content != null
                && content.toString().startsWith("[TOOL_RESULT");
    }

    /** 是否“完整”（未压缩）的工具结果 —— 已是摘要的不再重复折叠 */
    private static boolean isFullToolResultMsg(Map<String, Object> m) {
        if (!isToolResultMsg(m)) {
            return false;
        }
        Object content = m.get("content");
        return content == null || !content.toString().startsWith("[TOOL_RESULT_SUMMARY");
    }

    /**
     * 把 [start, end) 的一轮折叠成一条 [TOOL_RESULT_SUMMARY] user 消息。
     * 原生通道从 assistant.tool_calls 按序取工具名（tool 消息本身不带名字）。
     */
    private static void foldRound(List<Map<String, Object>> messages, int start, int end) {
        List<String> names = extractToolCallNames(messages.get(start));
        StringBuilder sb = new StringBuilder("[TOOL_RESULT_SUMMARY] 本轮工具结果已压缩（"
                + (end - start - 1) + " 条）：\n");
        for (int i = start + 1; i < end; i++) {
            Object content = messages.get(i).get("content");
            String raw = content == null ? "" : content.toString();
            int k = i - start - 1;
            String name = k < names.size() ? names.get(k) : null;
            sb.append(TranscriptCompactor.summaryLine(name, raw)).append('\n');
            if (sb.length() > TranscriptCompactor.FOLDED_ROUND_CHARS) {
                sb.append("…（本轮更多结果已省略）\n");
                break;
            }
        }
        Map<String, Object> summary = new HashMap<>();
        summary.put("role", "user");
        summary.put("content", sb.toString().trim());
        messages.set(start, summary);
        for (int i = end - 1; i > start; i--) {
            messages.remove(i);
        }
    }

    /** 从 assistant 消息的 tool_calls 里按序取工具名（原生通道折叠用） */
    private static List<String> extractToolCallNames(Map<String, Object> assistantMsg) {
        List<String> names = new ArrayList<>();
        Object tcs = assistantMsg == null ? null : assistantMsg.get("tool_calls");
        if (tcs instanceof com.alibaba.fastjson.JSONArray) {
            com.alibaba.fastjson.JSONArray arr = (com.alibaba.fastjson.JSONArray) tcs;
            for (int i = 0; i < arr.size(); i++) {
                com.alibaba.fastjson.JSONObject tc = arr.getJSONObject(i);
                com.alibaba.fastjson.JSONObject fn = tc == null ? null : tc.getJSONObject("function");
                names.add(fn == null ? null : fn.getString("name"));
            }
        }
        return names;
    }

    /** 找完整工具结果里内容最长的那条（字符超限时截断用） */
    private static int findLongestToolResult(List<Map<String, Object>> messages) {
        int idx = -1;
        int max = -1;
        for (int i = 2; i < messages.size(); i++) {
            if (!isFullToolResultMsg(messages.get(i))) {
                continue;
            }
            Object content = messages.get(i).get("content");
            int len = content == null ? 0 : content.toString().length();
            if (len > max) {
                max = len;
                idx = i;
            }
        }
        return idx;
    }

    private static void truncateContent(Map<String, Object> m, int keep) {
        Object content = m.get("content");
        if (content == null) {
            return;
        }
        String s = content.toString();
        if (s.length() > keep) {
            m.put("content", s.substring(0, keep) + "…（已截断，需要请重新调用）");
        }
    }

    private static int totalChars(List<Map<String, Object>> messages) {
        int total = 0;
        for (Map<String, Object> m : messages) {
            Object content = m.get("content");
            if (content != null) {
                total += content.toString().length();
            }
        }
        return total;
    }

    private static String truncate(String s) {
        if (s == null) return "null";
        return s.length() > 200 ? s.substring(0, 200) + "..." : s;
    }

    /** 日志用截断（换行压平，防日志文件被长文本撑爆） */
    private static String truncateLog(String s) {
        if (s == null) {
            return "null";
        }
        String flat = s.replace('\n', ' ').replace('\r', ' ').replace('|', '/');
        return flat.length() > 150 ? flat.substring(0, 150) + "..." : flat;
    }
}
