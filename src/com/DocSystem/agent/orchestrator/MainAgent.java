package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.controller.AgentController;
import com.DocSystem.agent.core.AgentContext;
import com.DocSystem.agent.core.AgentResponse;
import com.DocSystem.agent.entity.TaskEntity;
import com.DocSystem.agent.evolution.EvolutionTrigger;
import com.DocSystem.agent.evolution.ExperienceMemory;
import com.DocSystem.agent.evolution.SelfDiagnostics;
import com.DocSystem.agent.learning.service.CollaborativeFilteringService;
import com.DocSystem.agent.learning.service.BehaviorTrackingService;
import com.DocSystem.agent.learning.entity.Recommendation;
import com.DocSystem.agent.llm.LLMService;
import com.DocSystem.agent.skill.executor.SkillExecutorRegistry;
import com.DocSystem.agent.nlu.IntentResult;
import com.DocSystem.agent.nlu.LLMIntentParser;
import com.DocSystem.agent.nlu.SkillIntentRegistry;
import com.DocSystem.agent.orchestrator.TaskQueueService;
import com.DocSystem.agent.orchestrator.reflection.OrchestrationLoop;
import com.DocSystem.agent.orchestrator.reflection.ReflectionConfig;
import com.DocSystem.agent.orchestrator.reflection.ReflectionEngine;
import com.DocSystem.agent.orchestrator.reflection.Replanner;
import com.DocSystem.agent.orchestrator.reflection.ErrorContext;
import com.DocSystem.agent.skill.SkillManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * MainAgent - Main orchestrator for dual-layer agent architecture
 * 
 * Responsibilities:
 * 1. Task decomposition - break user requests into sub-tasks
 * 2. Sub-agent orchestration - delegate to SubAgent instances
 * 3. Result aggregation - combine results from sub-agents
 * 4. Experience extraction - learn from successful executions
 * 5. Collaborative learning - track behavior, get recommendations
 *
 * <p><b>LEGACY-FALLBACK（R3-4 裁定，2026-09-21）</b>：只有本类的旧编排
 * （{@code process()} → {@code decomposeTask} → {@code executeSubTasks} → {@link SubAgent}）
 * 属于兜底性质。**主路径是 {@link ToolUseLoop}**，由 AgentController SSE 直接驱动。
 * 旧编排只在两种情况下运行：① ToolUseLoop 返回 null / 抛异常（SSE 路径或本类内部）；
 * ② 灰度开关 {@code agent.tool-loop.enabled=false}。处置 = **冻结**：只修 bug，
 * 禁止在此新增能力、禁止新增 taskType 分支；新能力一律做成工具。
 * 每次进入旧编排都会打 {@link #LEGACY_FALLBACK_TAG} 日志，用于统计兜底真实触发率
 * （攒够数据再决定删除还是保留）。
 */
@Service
public class MainAgent {
    
    private static final Logger log = LoggerFactory.getLogger(MainAgent.class);
    private static final int MAX_PARALLEL_TASKS = 5;

    /**
     * 旧编排兜底标记（R3-4）：统一日志前缀，便于一次 grep 统计“兜底真实触发次数”。
     * dev 统计：grep -c "LEGACY-FALLBACK" C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log
     */
    public static final String LEGACY_FALLBACK_TAG = "[LEGACY-FALLBACK]";

    /**
     * 打“旧编排兜底”标记日志（R3-4）。
     *
     * <p>⚠️ **必须走 {@code com.DocSystem.common.Log}**（与 {@code [ToolUseLoop][STEP]} 同渠道
     * = 应用日志 docsys.log），不要用 slf4j 的 {@code log}：本工程 slf4j 只落 stdout
     * （log4j rootLogger=info,stdout），而排障/统计看的是 Log 写的那个文件。
     *
     * @param event  事件名（sse-tool-loop-returned-null / sse-tool-loop-failed /
     *               legacy-orchestration-entered）
     * @param detail 补充信息（可 null）
     */
    public static void logLegacyFallback(String event, String detail) {
        com.DocSystem.common.Log.warn(LEGACY_FALLBACK_TAG + " " + event
                + (detail == null || detail.isEmpty() ? "" : " (" + detail + ")"));
    }

    @Value("${agent.task-timeout:60}")
    private long taskTimeoutSeconds;

    private long taskTimeoutMs() { return taskTimeoutSeconds * 1000L; }
    
    private final DocSysClient docSysClient;
    private final SkillManager skillManager;
    private final ExecutorService executor;
    private final ConcurrentHashMap<String, SubAgent> subAgentPool;
    
    // 进化系统组件
    private final ExperienceMemory experienceMemory;
    private final SelfDiagnostics selfDiagnostics;
    private EvolutionTrigger evolutionTrigger;
    
    // 协同学习系统组件
    @Autowired
    private CollaborativeFilteringService learningService;
    
    @Autowired
    private BehaviorTrackingService behaviorTrackingService;
    
    @Autowired
    private LLMService llmService;

    @Autowired(required = false)
    private SkillExecutorRegistry skillExecutorRegistry;

    @Autowired(required = false)
    private TaskQueueService taskQueueService;

    // Reflection loop (off by default; see ReflectionConfig and plan T11)
    @Autowired(required = false)
    private ReflectionConfig reflectionConfig;

    @Autowired(required = false)
    private ReflectionEngine reflectionEngine;

    @Autowired(required = false)
    private Replanner replanner;

    @Autowired(required = false)
    private com.DocSystem.agent.controller.AuditLogService auditLogService;

    @Autowired(required = false)
    private com.DocSystem.agent.monitoring.AgentMetrics agentMetrics;

    @Autowired(required = false)
    private com.DocSystem.agent.session.ConversationHistoryService conversationHistoryService;

    /** P3：到顶后的"未完成任务"标记 + 续接上下文（未装配时无续接能力，行为同改造前） */
    @Autowired(required = false)
    private com.DocSystem.agent.session.ContinuationStore continuationStore;

    /** P1：会话级权限模式与规则（未装配时无权限模式，行为同改造前：所有写操作都问） */
    @Autowired(required = false)
    private com.DocSystem.agent.permission.PermissionStore permissionStore;

    /** T8.3 用户记忆存储（memory_set/get/list 工具）；未装配时不注册 memory 工具 */
    @Autowired(required = false)
    private com.DocSystem.agent.memory.UserMemoryService userMemoryService;

    /** T8.6 管理员提示词配置（system_prompt_override/suffix）；未装配时用默认 prompt */
    @Autowired(required = false)
    private com.DocSystem.agent.config.AgentConfigService agentConfigService;

    /** T8.4 web_search 配置：搜索端点（空 → 默认 DuckDuckGo HTML） */
    @org.springframework.beans.factory.annotation.Value("${agent.web-search.endpoint:}")
    private String webSearchEndpoint;

    /** T8.4 web_search 配置：超时（毫秒） */
    @org.springframework.beans.factory.annotation.Value("${agent.web-search.timeout-ms:8000}")
    private long webSearchTimeoutMs;

    /** ToolUseLoop 灰度开关（默认开；可配置关闭回退旧 decomposeTask） */
    @org.springframework.beans.factory.annotation.Value("${agent.tool-loop.enabled:true}")
    private boolean toolLoopEnabled;

    /**
     * SSE 路径已尝试过 ToolUseLoop 的线程标记：回退 legacy 时跳过 process() 里的 ToolUseLoop，
     * 避免 LLM 被反复调用（ThreadLocal 作用域 = 同一请求线程，try/finally 清理）。
     */
    private static final ThreadLocal<Boolean> TOOL_LOOP_ATTEMPTED = new ThreadLocal<>();

    /** SSE 路径在回退 runCommand 前调用，标记已尝试过 ToolUseLoop */
    public static void markToolLoopAttempted() {
        TOOL_LOOP_ATTEMPTED.set(Boolean.TRUE);
    }

    /** 当前线程是否已尝试过 ToolUseLoop（由 process() 读取并清除） */
    private static boolean consumeToolLoopAttempted() {
        Boolean v = TOOL_LOOP_ATTEMPTED.get();
        TOOL_LOOP_ATTEMPTED.remove();
        return v != null && v;
    }

    /** 写操作确认超时（秒） */
    @org.springframework.beans.factory.annotation.Value("${agent.tool-loop.confirm-timeout:120}")
    private long toolLoopConfirmTimeoutSeconds;
    
    public MainAgent(DocSysClient docSysClient) {
        this.docSysClient = docSysClient;
        this.skillManager = SkillManager.getInstance();
        this.executor = Executors.newFixedThreadPool(MAX_PARALLEL_TASKS);
        this.subAgentPool = new ConcurrentHashMap<>();
        
        // 初始化进化系统
        this.experienceMemory = ExperienceMemory.getInstance();
        this.selfDiagnostics = SelfDiagnostics.getInstance();
        
        log.info("MainAgent initialized with DocSysClient and Evolution System");
    }

    /**
     * 启动时任务恢复 —— 合并部署后已废弃，不再自动调用。
     *
     * 原设计用于独立部署时扫描 agent_tasks 表、把中断的 pending/running 任务
     * 重新入队重试。合并进 DocSys 后：Agent 主执行为同步（在 HTTP 请求线程内完成），
     * Tomcat 崩溃即请求中断，是否继续应由用户在对话中决定，而非后台静默重跑
     * （重跑还可能重复执行有副作用的操作）。且队列无后台消费者，重入队为空转。
     * 故移除 @PostConstruct 触发；方法保留仅为兼容潜在的手动调用。
     */
    public void resumePendingTasks() {
        if (taskQueueService == null) {
            log.debug("TaskQueueService not available, skipping startup recovery");
            return;
        }
        try {
            List<TaskEntity> staleTasks = taskQueueService.getPendingOrRunningTasksForRecovery();
            for (TaskEntity task : staleTasks) {
                taskQueueService.reEnqueue(task);
                log.info("Recovered task from startup: taskId={}, type={}, retryCount={}",
                        task.getTaskId(), task.getTaskType(), task.getRetryCount());
            }
            if (!staleTasks.isEmpty()) {
                log.info("Startup recovery: {} stale tasks re-enqueued", staleTasks.size());
            }
        } catch (Exception e) {
            log.error("Failed to resume pending tasks on startup", e);
        }
    }

    public void setLlmService(LLMService llmService) {
        this.llmService = llmService;
    }
    
    public void setLearningService(CollaborativeFilteringService learningService) {
        this.learningService = learningService;
    }
    
    public void setBehaviorTrackingService(BehaviorTrackingService behaviorTrackingService) {
        this.behaviorTrackingService = behaviorTrackingService;
    }

    public void setTaskQueueService(TaskQueueService taskQueueService) {
        this.taskQueueService = taskQueueService;
    }

    public void setEvolutionTrigger(EvolutionTrigger evolutionTrigger) {
        this.evolutionTrigger = evolutionTrigger;
    }
    
    /**
     * Process user query - 旧编排入口（LEGACY-FALLBACK，见类注释）.
     * @param sessionInfo - SessionInfo object containing authenticated session details
     *
     * Best Practice: Use request-scoped DocSysClient instance to avoid thread-safety issues
     *
     * @deprecated R3-4（2026-09-21）：旧编排已被 {@link ToolUseLoop} 取代，本入口仅作
     *     ToolUseLoop 失败时的兜底。禁止在此新增能力；新能力请做成工具。
     */
    @Deprecated
    public AgentResponse process(String userQuery, AgentContext context, Object sessionInfo) {
        // 获取 per-session DocSysClient（如果已设置）
        DocSysClient clientFromSession = null;
        if (sessionInfo instanceof AgentController.SessionInfo) {
            AgentController.SessionInfo info = (AgentController.SessionInfo) sessionInfo;
            if (info.jsessionid != null) {
                clientFromSession = docSysClient.copyWithSession(info.jsessionid, info.username);
            }
        }
        return process(userQuery, context, sessionInfo, clientFromSession);
    }

    /**
     * Process user query with explicit DocSysClient (backward-compat, no model selection).
     * @param sessionInfo - SessionInfo object containing authenticated session details
     * @param client - Per-session DocSysClient (from AgentController session pool)
     *
     * @deprecated R3-4（2026-09-21）：旧编排入口（LEGACY-FALLBACK），见类注释。
     */
    @Deprecated
    public AgentResponse process(String userQuery, AgentContext context, Object sessionInfo, DocSysClient client) {
        return process(userQuery, context, sessionInfo, client, null);
    }

    /**
     * Process user query with explicit DocSysClient + user-selected LLM model.
     * @param sessionInfo - SessionInfo object containing authenticated session details
     * @param client - Per-session DocSysClient (from AgentController session pool)
     * @param resolvedLlm - 用户选定的模型配置，null=使用系统默认
     *
     * @deprecated R3-4（2026-09-21）：旧编排主体（LEGACY-FALLBACK），见类注释。
     *     进入时会打 {@link #LEGACY_FALLBACK_TAG} 日志。
     */
    @Deprecated
    public AgentResponse process(String userQuery, AgentContext context, Object sessionInfo,
                                  DocSysClient client,
                                  com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        long startTime = System.currentTimeMillis();
        log.info("MainAgent processing query: {} with sessionInfo: {}, model: {}",
                userQuery, sessionInfo, resolvedLlm != null ? resolvedLlm.displayName : "default");

        // 使用传入的 per-session DocSysClient，或创建新的
        DocSysClient authenticatedClient = client != null ? client : this.docSysClient;

        // ===== ToolUseLoop 路径（灰度开关 或 /tool 前缀强制触发） =====
        // 安全测试机制：`/tool <查询>` 前缀强制走 ToolUseLoop，其余请求不受影响
        boolean forceToolLoop = userQuery != null && userQuery.trim().startsWith("/tool");
        String toolQuery = forceToolLoop ? userQuery.trim().substring(5).trim() : userQuery;
        boolean toolLoopAlreadyAttempted = consumeToolLoopAttempted();
        boolean toolLoopWanted = (toolLoopEnabled || forceToolLoop) && !toolLoopAlreadyAttempted;
        if (toolLoopWanted) {
            log.info("ToolUseLoop {} — routing query: {}",
                    forceToolLoop ? "(forced by /tool prefix)" : "(enabled)", toolQuery);
            AgentResponse toolResp = runToolUseLoop(toolQuery, context, authenticatedClient,
                    resolvedLlm, sessionInfo, null, null);
            if (toolResp != null) {
                return toolResp;
            }
            // ToolUseLoop 失败 → 回退旧路径（保留灰度安全网）
            log.warn("ToolUseLoop failed, falling back to legacy path");
        }

        // ===== LEGACY-FALLBACK：旧编排入口（R3-4 裁定）=====
        // 执行到这里 = 主路径（ToolUseLoop）没有给出答案。统一打标记日志（走应用日志渠道，
        // 一次 grep 即可统计兜底真实触发次数；攒数据决定删除还是保留，见类注释）。
        logLegacyFallback("legacy-orchestration-entered",
                "reason=" + (toolLoopAlreadyAttempted ? "tool-loop-failed-in-sse-path"
                        : (toolLoopWanted ? "tool-loop-returned-null" : "tool-loop-disabled")));

        // 提取用户信息用于学习系统
        String userId = extractUserId(sessionInfo);
        String tenantId = extractTenantId(sessionInfo);

        // Step 0: 尝试从协同学习系统获取推荐
        List<Recommendation> recommendations = null;
        if (userId != null && learningService != null) {
            try {
                recommendations = learningService.recommend(userId, 3);
                if (recommendations != null && !recommendations.isEmpty()) {
                    log.info("Got {} collaborative recommendations for user {}", recommendations.size(), userId);
                }
            } catch (Exception e) {
                log.warn("Failed to get recommendations: {}", e.getMessage());
            }
        }

        // Step 0.5: 从经验中识别意图
        String recognizedIntent = experienceMemory.recognizeIntent(userQuery);
        if (recognizedIntent != null) {
            log.info("Recognized intent from experience: {}", recognizedIntent);
        }

        // Step 1: Task decomposition (shared by both OFF and ON paths)
        final TaskDecomposition decomposition = decomposeTask(userQuery, context);
        log.info("Decomposed into {} sub-tasks", decomposition.getSubTasks().size());

        // 记录分解结果到经验系统
        final String intent = recognizedIntent != null ? recognizedIntent : extractIntent(userQuery);
        experienceMemory.recordDecomposition(userQuery, intent,
            decomposition.getSubTasks().stream().map(SubTask::getId).collect(java.util.stream.Collectors.toList()), true);

        // 追踪用户行为
        if (userId != null && behaviorTrackingService != null) {
            try {
                behaviorTrackingService.trackBehavior(userId, tenantId, intent, null);
            } catch (Exception e) {
                log.warn("Failed to track behavior: {}", e.getMessage());
            }
        }

        // Reflection switch: OFF (default) = byte-for-byte copy of pre-loop code,
        // keeping E2E 696 zero-regression. ON = drive OrchestrationLoop.
        final boolean reflectionOn = reflectionConfig != null
            && reflectionConfig.isEnabled()
            && reflectionEngine != null
            && replanner != null;

        if (reflectionOn) {
            // ON path
            try {
                OrchestrationLoop loop = new OrchestrationLoop(
                    reflectionConfig, reflectionEngine, replanner);
                OrchestrationLoop.Outcome outcome = loop.run(
                    userQuery, intent, decomposition,
                    plan -> {
                        try {
                            TaskExecutionResult r = executeSubTasks(plan, context, authenticatedClient, resolvedLlm);
                            boolean ok = r != null && r.getResultIds() != null
                                && r.getResultIds().size() == plan.getSubTasks().size();
                            return java.util.Optional.of(new OrchestrationLoop.StepResult(
                                ok,
                                ok ? null : new ErrorContext(
                                    "EXECUTE_FAILED", "one-or-more-subtasks-failed", null,
                                    r.getResultIds() == null ? "0" : String.valueOf(r.getResultIds().size())),
                                r));
                        } catch (Exception ex) {
                            return java.util.Optional.of(new OrchestrationLoop.StepResult(
                                false, new ErrorContext("EXCEPTION", ex.getMessage(), null, null), null));
                        }
                    });

                AgentResponse response = outcome.response();
                long duration = System.currentTimeMillis() - startTime;
                response.withProcessingTime(duration);

                experienceMemory.recordExecution(userQuery, intent, response.isSuccess(), duration,
                    response.isSuccess() ? null : response.getMessage());
                selfDiagnostics.recordExecution("task_decomposition", response.isSuccess(), duration);

                if (response.isSuccess() && evolutionTrigger != null) {
                    evolutionTrigger.onTaskSuccess(intent, userQuery, null);
                }

                if (userId != null && behaviorTrackingService != null) {
                    try {
                        behaviorTrackingService.trackTaskResult(userId, tenantId, intent,
                            response.isSuccess(), duration);
                    } catch (Exception e) {
                        log.warn("Failed to track task result: {}", e.getMessage());
                    }
                }

                if (recommendations != null && !recommendations.isEmpty() && !response.isSuccess()) {
                    response.addMetadata("recommendations", recommendations);
                }

                return response;
            } catch (Exception e) {
                log.error("Error processing query (reflection ON path)", e);
                experienceMemory.recordExecution(userQuery, "unknown", false,
                    System.currentTimeMillis() - startTime, e.getMessage());
                selfDiagnostics.recordExecution("task_decomposition", false,
                    System.currentTimeMillis() - startTime);

                if (userId != null && behaviorTrackingService != null) {
                    try {
                        behaviorTrackingService.trackTaskResult(userId, tenantId, "unknown", false,
                            System.currentTimeMillis() - startTime);
                    } catch (Exception ex) {
                        log.warn("Failed to track failure: {}", ex.getMessage());
                    }
                }
                return AgentResponse.error("Failed to process query: " + e.getMessage());
            }
        }

        // OFF path: byte-for-byte copy of pre-loop behaviour
        try {
            // Step 2: Execute sub-tasks with authenticated client + resolved LLM config
            TaskExecutionResult result = executeSubTasks(decomposition, context, authenticatedClient, resolvedLlm);

            // Step 3: Aggregate results
            AgentResponse response = aggregateResults(result);
            long duration = System.currentTimeMillis() - startTime;
            response.withProcessingTime(duration);

            // 记录执行结果到进化系统
            experienceMemory.recordExecution(userQuery, intent, response.isSuccess(), duration,
                response.isSuccess() ? null : response.getMessage());
            selfDiagnostics.recordExecution("task_decomposition", response.isSuccess(), duration);

            // 触发自我进化机制（异步，不阻塞主流程）
            if (response.isSuccess() && evolutionTrigger != null) {
                evolutionTrigger.onTaskSuccess(intent, userQuery, null);
            }

            // 记录任务结果到协同学习系统
            if (userId != null && behaviorTrackingService != null) {
                try {
                    behaviorTrackingService.trackTaskResult(userId, tenantId, intent, response.isSuccess(), duration);
                } catch (Exception e) {
                    log.warn("Failed to track task result: {}", e.getMessage());
                }
            }

            // 如果有推荐且任务失败，添加推荐信息到响应
            if (recommendations != null && !recommendations.isEmpty() && !response.isSuccess()) {
                response.addMetadata("recommendations", recommendations);
            }

            return response;

        } catch (Exception e) {
            log.error("Error processing query", e);

            // 记录失败
            experienceMemory.recordExecution(userQuery, "unknown", false,
                System.currentTimeMillis() - startTime, e.getMessage());
            selfDiagnostics.recordExecution("task_decomposition", false,
                System.currentTimeMillis() - startTime);

            // 记录失败到协同学习系统
            if (userId != null && behaviorTrackingService != null) {
                try {
                    behaviorTrackingService.trackTaskResult(userId, tenantId, "unknown", false,
                        System.currentTimeMillis() - startTime);
                } catch (Exception ex) {
                    log.warn("Failed to track failure: {}", ex.getMessage());
                }
            }

            return AgentResponse.error("Failed to process query: " + e.getMessage());
        }
    }

    /**
     * 运行 ToolUseLoop（可复用入口，供 MainAgent.process 与 AgentController SSE 路径共用）。
     *
     * @param toolQuery   查询（已剥离 /tool 前缀）
     * @param context     当前 AgentContext
     * @param client      per-request DocSysClient（会话隔离）
     * @param resolvedLlm 用户选定模型（可为 null → 系统默认）
     * @param sessionInfo 会话信息
     * @param confirmSink SSE 确认事件推送器（可为 null → confirmToken 仅日志/审计可见）
     * @return 成功 → AgentResponse；失败/异常 → null（调用方回退旧路径）
     */
    public AgentResponse runToolUseLoop(String toolQuery, AgentContext context, DocSysClient client,
                                        com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm,
                                        Object sessionInfo,
                                        com.DocSystem.agent.tool.ConfirmEventSink confirmSink) {
        return runToolUseLoop(toolQuery, context, client, resolvedLlm, sessionInfo, confirmSink, null);
    }

    /**
     * 运行 ToolUseLoop（可复用入口，供 MainAgent.process 与 AgentController SSE 路径共用）。
     *
     * @param toolQuery   查询（已剥离 /tool 前缀）
     * @param context     当前 AgentContext
     * @param client      per-request DocSysClient（会话隔离）
     * @param resolvedLlm 用户选定模型（可为 null → 系统默认）
     * @param sessionInfo 会话信息
     * @param confirmSink SSE 确认事件推送器（可为 null → confirmToken 仅日志/审计可见）
     * @param historySessionId 会话历史 ID（续接时加载历史消息作为上下文，可为 null）
     * @return 成功 → AgentResponse；失败/异常 → null（调用方回退旧路径）
     */
    public AgentResponse runToolUseLoop(String toolQuery, AgentContext context, DocSysClient client,
                                        com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm,
                                        Object sessionInfo,
                                        com.DocSystem.agent.tool.ConfirmEventSink confirmSink,
                                        String historySessionId) {
        try {
            com.DocSystem.agent.orchestrator.ToolUseLoop loop =
                    buildToolLoop(client, context, sessionInfo, confirmSink, resolvedLlm, false, historySessionId);
            // T5.2b 会话记忆：续接会话时加载历史消息作为上下文
            java.util.List<java.util.Map<String, String>> priorHistory = loadSessionHistory(historySessionId);
            long loopStart = System.currentTimeMillis();
            com.DocSystem.agent.orchestrator.ToolUseResult tr = loop.run(
                    applyContinuationContext(toolQuery, historySessionId), priorHistory);
            long duration = System.currentTimeMillis() - loopStart;
            log.info("ToolUseLoop finished: success={}, turns={}, toolCalls={}, cost={}ms",
                    tr.success, tr.turns, tr.toolCalls, duration);
            if (agentMetrics != null) {
                agentMetrics.recordExecution("tool_loop", duration, tr.success);
                agentMetrics.incrementCounter("agent.tool.loop",
                        "success", String.valueOf(tr.success),
                        "turns", String.valueOf(tr.turns));
            }
            if (tr.success) {
                savePendingContinuation(tr, historySessionId);
                return loopResponse(tr, duration, null);
            }

            // T5.1 失败重试：注入"直接回答"提示重试一次；P1 起额外携带上一段查到的进展（不重复劳动）
            log.warn("ToolUseLoop failed ({}), retrying once with direct-answer hint", tr.message);
            com.DocSystem.agent.orchestrator.ToolUseResult retry = loop.run(
                    retryQueryWithProgress(toolQuery, tr), priorHistory);
            if (retry.success) {
                log.info("ToolUseLoop retry succeeded: turns={}, toolCalls={}", retry.turns, retry.toolCalls);
                savePendingContinuation(retry, historySessionId);
                return loopResponse(retry, System.currentTimeMillis() - loopStart, "retry=true");
            }
            return null;
        } catch (Exception e) {
            log.error("ToolUseLoop exception", e);
            return null;
        }
    }

    /**
     * 流式运行 ToolUseLoop（T7.1.3/T7.1.4）：供 SSE 路径使用——推理过程（reasoning/text/tool_call/tool_result）
     * 经 streamSink 实时推给前端。其余行为（护栏/审计/确认/指标/失败重试）与非流式完全一致。
     *
     * @param streamSink 流式事件回调（reasoning/text/tool_call/tool_result/retry）；可为 null
     * @return 成功 → AgentResponse；失败/异常 → null（调用方回退旧路径）
     */
    public AgentResponse runToolUseLoopStreaming(String toolQuery, AgentContext context, DocSysClient client,
                                                 com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm,
                                                 Object sessionInfo,
                                                 com.DocSystem.agent.tool.ConfirmEventSink confirmSink,
                                                 String historySessionId,
                                                 com.DocSystem.agent.orchestrator.ToolUseLoop.StreamSink streamSink) {
        try {
            com.DocSystem.agent.orchestrator.ToolUseLoop loop =
                    buildToolLoop(client, context, sessionInfo, confirmSink, resolvedLlm, true, historySessionId);
            // T5.2b 会话记忆：续接会话时加载历史消息作为上下文
            java.util.List<java.util.Map<String, String>> priorHistory = loadSessionHistory(historySessionId);
            long loopStart = System.currentTimeMillis();
            com.DocSystem.agent.orchestrator.ToolUseResult tr = loop.runStreaming(
                    applyContinuationContext(toolQuery, historySessionId), priorHistory, streamSink);
            long duration = System.currentTimeMillis() - loopStart;
            log.info("ToolUseLoop(streaming) finished: success={}, turns={}, toolCalls={}, cost={}ms",
                    tr.success, tr.turns, tr.toolCalls, duration);
            if (agentMetrics != null) {
                agentMetrics.recordExecution("tool_loop", duration, tr.success);
                agentMetrics.incrementCounter("agent.tool.loop",
                        "success", String.valueOf(tr.success),
                        "streaming", "true",
                        "turns", String.valueOf(tr.turns));
            }
            if (tr.success) {
                savePendingContinuation(tr, historySessionId);
                return loopResponse(tr, duration, "streaming=true");
            }

            // T5.1 失败重试：注入"直接回答"提示重试一次（重试前通知前端清空已流式内容）；
            // P1 起额外携带上一段查到的进展，避免重试重头再来（转录重置 → 观察丢掉）
            log.warn("ToolUseLoop(streaming) failed ({}), retrying once with direct-answer hint", tr.message);
            if (streamSink != null) {
                streamSink.onRetry();
            }
            com.DocSystem.agent.orchestrator.ToolUseResult retry = loop.runStreaming(
                    retryQueryWithProgress(toolQuery, tr), priorHistory, streamSink);
            if (retry.success) {
                log.info("ToolUseLoop(streaming) retry succeeded: turns={}, toolCalls={}", retry.turns, retry.toolCalls);
                savePendingContinuation(retry, historySessionId);
                return loopResponse(retry, System.currentTimeMillis() - loopStart, "streaming=true, retry=true");
            }
            return null;
        } catch (Exception e) {
            log.error("ToolUseLoop(streaming) exception", e);
            return null;
        }
    }

    /**
     * P1：把工具循环结果转成响应 —— 预算到顶（truncated）时追加「可能未完成 + 怎么继续」提示，
     * 并在 meta 里标记 {@code truncated=true}（前端据此渲染「继续」入口，见计划 P3）。
     * 非 truncated 时 meta 与改造前完全一致（SSE 协议只增不改）。
     */
    private static AgentResponse loopResponse(
            com.DocSystem.agent.orchestrator.ToolUseResult tr, long durationMs, String extraMeta) {
        String answer = tr.message;
        if (tr.truncated) {
            answer = tr.message + "\n\n---\n⚠️ 本轮工具预算到顶（" + tr.turns + " 轮 / " + tr.toolCalls
                    + " 次工具调用），任务**可能未完成**。回复「继续」我会基于上面的进展接着做。";
        }
        AgentResponse resp = AgentResponse.ok(answer);
        resp.withProcessingTime(durationMs);
        String prefix = (extraMeta == null || extraMeta.isEmpty()) ? "" : extraMeta + ", ";
        resp.addMetadata("toolLoop", prefix + "turns=" + tr.turns + ", toolCalls=" + tr.toolCalls);
        if (tr.truncated) {
            resp.addMetadata("truncated", "true");
        }
        return resp;
    }

    /**
     * P1：失败重试要「带着上一段查到的东西」继续 —— 把第一段的工具结果压成进展摘要拼进提示，
     * 而不是让模型从零重来（原来只加一句"直接回答"，转录重置导致观察全丢）。
     */
    private static String retryQueryWithProgress(
            String toolQuery, com.DocSystem.agent.orchestrator.ToolUseResult failed) {
        StringBuilder sb = new StringBuilder(toolQuery);
        sb.append("\n\n[SYSTEM] 如果无法通过工具完成，请直接基于已有信息回答用户，或说明限制。");
        String carried = com.DocSystem.agent.orchestrator.TranscriptCompactor.summarize(
                failed == null ? null : failed.transcript, 2000);
        if (!carried.isEmpty()) {
            sb.append("\n[SYSTEM] 上一段已经查到的信息（不要重复调用同样的工具/参数）：\n").append(carried);
        }
        return sb.toString();
    }

    /**
     * P3：续接请求（"继续/接着做"）→ 把「上一段未完成」的结论与工具进展前置注入；
     * 非续接请求、无未完成标记、未装配 ContinuationStore 时**原样返回**（行为同改造前）。
     */
    private String applyContinuationContext(String toolQuery, String sessionId) {
        if (continuationStore == null) {
            return toolQuery;
        }
        try {
            String ctx = continuationStore.takeContinuationContext(sessionId, toolQuery);
            if (ctx == null || ctx.isEmpty()) {
                return toolQuery;
            }
            log.info("ToolUseLoop continuation context injected: sessionId={}, ctxLen={}", sessionId, ctx.length());
            return ctx + "\n\n" + toolQuery;
        } catch (Exception e) {
            log.warn("续接上下文注入失败（按普通消息处理）: {}", e.getMessage());
            return toolQuery;
        }
    }

    /**
     * P3：预算到顶交付 → 记一条"未完成任务"标记（结论 + 工具进展摘要），供下一条"继续"注入。
     * 非 truncated（正常完成）时不记，且不改任何既有存储。
     */
    private void savePendingContinuation(
            com.DocSystem.agent.orchestrator.ToolUseResult tr, String sessionId) {
        if (tr == null || !tr.truncated || continuationStore == null) {
            return;
        }
        try {
            String progress = com.DocSystem.agent.orchestrator.TranscriptCompactor.summarize(
                    tr.transcript, 1500);
            continuationStore.savePending(sessionId, tr.message, progress, tr.turns, tr.toolCalls);
        } catch (Exception e) {
            log.warn("记录未完成标记失败（不影响本轮交付）: {}", e.getMessage());
        }
    }

    /**
     * 构建配置好的 ToolUseLoop（注册表/确认门/审计监听/技能工具），流式与非流式共用。
     */
    private com.DocSystem.agent.orchestrator.ToolUseLoop buildToolLoop(
            DocSysClient client, AgentContext context, Object sessionInfo,
            com.DocSystem.agent.tool.ConfirmEventSink confirmSink,
            com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm, boolean streaming,
            String permissionSessionId) {
        com.DocSystem.agent.tool.ToolRegistry registry;
        com.DocSystem.agent.search.WebSearchService webSearch = buildWebSearchService();
        // T8.3：memory 工具的用户维度取自 sessionInfo.username（SessionInfo 上游已设置），
        // 不能用 client.getCurrentUsername()——getSessionClient 只设 cookie 不设 currentUsername。
        String memoryUsername = extractUserId(sessionInfo);
        if (userMemoryService != null) {
            // T8.3：memory 工具绑定用户记忆存储 + 当前用户名（memory_set/get/list）
            registry = com.DocSystem.agent.tool.DocSysToolFactory.createFullRegistry(
                    client, userMemoryService, memoryUsername, webSearch);
        } else {
            registry = com.DocSystem.agent.tool.DocSysToolFactory.createFullRegistry(
                    client, null, null, webSearch);
        }
        // Skill 作为工具暴露（T4.4）：有 SkillExecutorRegistry 时注册 run_skill
        if (skillExecutorRegistry != null) {
            registry.register(com.DocSystem.agent.tool.DocSysToolFactory.runSkillTool(
                    skillExecutorRegistry, context));
        }
        // P2：附件工具 —— 读取本轮用户上传的临时附件（按对话会话目录捕获；目录不存在则返回“无附件”）
        // 注意：目录必须与 /agent/attachment 上传端点一致，即用「对话会话 id」而非 jsessionid
        //（context.getSessionId() 是 jsessionid，用它会导致工具看不到刚上传的附件）
        String attachUser = extractUserId(sessionInfo);
        String attachSession = resolveAttachmentSession(sessionInfo, context);
        registry.register(com.DocSystem.agent.tool.DocSysToolFactory.attachment(
                com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                        attachUser,
                        com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionKey(attachSession),
                        false)));
        final String toolUserId = extractUserId(sessionInfo);
        final String toolSessionId = context != null ? context.getSessionId() : null;
        final String toolTraceId = org.slf4j.MDC.get("traceId");
        final String toolClientIp = org.slf4j.MDC.get("clientIp");
        // 写操作确认门（对接审计 + 轮询等待用户经 /confirm 批准 + 可选 SSE 推送）
        com.DocSystem.agent.tool.AuditWriteConfirmGate gate = new com.DocSystem.agent.tool.AuditWriteConfirmGate(
                auditLogService, toolUserId, toolSessionId, toolClientIp, toolTraceId,
                toolLoopConfirmTimeoutSeconds);
        gate.setConfirmEventSink(confirmSink);
        registry.setConfirmGate(gate);
        // P1：权限模式（会话级）→ 注入判定上下文；未装配 PermissionStore / 无会话 → ctx 保持 null（行为同改造前）
        com.DocSystem.agent.permission.PermissionMode permMode = com.DocSystem.agent.permission.PermissionMode.DEFAULT;
        if (permissionStore != null && permissionSessionId != null) {
            permMode = permissionStore.getMode(permissionSessionId);
            // P3：全局配置 —— 禁用"全部允许"档时降级为自动档；追加的绝对保护工具登记到风险目录
            boolean allowAllEnabled = true;
            if (agentConfigService != null) {
                allowAllEnabled = com.DocSystem.agent.permission.PermissionConfig.parseBoolean(
                        agentConfigService.getGlobal(com.DocSystem.agent.config.AgentConfigService
                                .KEY_AGENT_PERMISSION_ALLOW_ALL_ENABLED), true);
                com.DocSystem.agent.permission.ToolRiskCatalog.setExtraGuarded(
                        com.DocSystem.agent.permission.PermissionConfig.parseToolList(
                                agentConfigService.getGlobal(com.DocSystem.agent.config.AgentConfigService
                                        .KEY_AGENT_ABSOLUTE_GUARDED_EXTRA)));
            }
            permMode = com.DocSystem.agent.permission.PermissionConfig.applyAllowAllGate(permMode, allowAllEnabled);
            java.util.List<com.DocSystem.agent.permission.PermissionRule> permRules =
                    permissionStore.getRules(permissionSessionId);
            registry.setPermissionContext(new com.DocSystem.agent.permission.PermissionContext(
                    permMode, permRules, skillId -> resolveSkillRisk(skillId)));
            com.DocSystem.common.Log.info("[Permission] sessionId=" + permissionSessionId
                    + " mode=" + permMode.id + " rules=" + permRules.size());
        }
        final com.DocSystem.agent.permission.PermissionMode activePermMode = permMode;
        // 执行监听器：写工具落审计 + 指标打点（T4.2/T4.3）
        registry.setExecutionListener((tool, args, result, durationMs) -> {
            if (agentMetrics != null) {
                agentMetrics.incrementCounter("agent.tool.call", "tool", tool.name,
                        "write", String.valueOf(tool.isWrite),
                        "success", String.valueOf(result.success));
            }
            if (tool.isWrite && auditLogService != null) {
                java.util.Map<String, String> params = new java.util.HashMap<>();
                if (args != null) {
                    for (java.util.Map.Entry<String, Object> e : args.entrySet()) {
                        params.put(e.getKey(), String.valueOf(e.getValue()));
                    }
                }
                auditLogService.record(toolUserId, toolSessionId, tool.name, params,
                        toolClientIp, toolTraceId, result.success,
                        result.success ? "Tool executed" : result.error);
            }
        });
        boolean isAdmin = extractIsAdmin(sessionInfo);
        // T10：原生工具调用开关（agent_config；auto 默认；none 纯文本通道）
        String toolChoice = null;
        if (agentConfigService != null) {
            String tc = agentConfigService.getGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_AGENT_TOOL_CHOICE);
            if (tc != null && !tc.trim().isEmpty()) {
                toolChoice = tc.trim();
            }
        }
        com.DocSystem.agent.orchestrator.ToolUseLoop loop;
        if (streaming) {
            loop = com.DocSystem.agent.orchestrator.ToolUseLoop.forLlmServiceStreamingNative(
                    llmService, registry, resolvedLlm, isAdmin, toolChoice);
        } else {
            loop = com.DocSystem.agent.orchestrator.ToolUseLoop.forLlmServiceNative(
                    llmService, registry, resolvedLlm, isAdmin, toolChoice);
        }
        // P1：轮数预算（agent_config.agent_max_turns；未配置/非法 → ToolUseLoop 默认值，越界钳制）
        if (agentConfigService != null) {
            String maxTurnsCfg = agentConfigService.getGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_AGENT_MAX_TURNS);
            if (maxTurnsCfg != null && !maxTurnsCfg.trim().isEmpty()) {
                try {
                    loop.setMaxTurns(Integer.parseInt(maxTurnsCfg.trim()));
                } catch (NumberFormatException nfe) {
                    log.warn("agent_max_turns 配置不是整数（{}），使用默认值 {}", maxTurnsCfg, loop.getMaxTurns());
                }
            }
        }
        // T8.5：工具链每步审计（每轮/每工具：轮次/工具/参数摘要/结果摘要/耗时）→
        // 用 DocSys 自带 Log 接口打结构化日志（写 docsys.log，可下载 grep 排查）。
        // 双标记 [ToolUseLoop][STEP]；sessionId 放最前（先按会话过滤出全部 request），
        // 再按 requestId 区分同会话内的不同请求；不依赖数据库。
        {
            final String stepRequestId = org.slf4j.MDC.get("requestId") != null
                    ? org.slf4j.MDC.get("requestId") : toolTraceId;
            final String stepSessionId = toolSessionId;
            loop.setStepAuditSink((turn, call, result, durationMs) -> {
                String argsJson = call.arguments != null ? call.arguments.toJSONString() : "{}";
                String summary = result.success ? result.summary : result.error;
                if (summary != null && summary.length() > 300) {
                    summary = summary.substring(0, 300) + "...";
                }
                com.DocSystem.common.Log.info("[ToolUseLoop][STEP] sessionId=" + stepSessionId
                        + " requestId=" + stepRequestId
                        + " turn=" + turn
                        + " tool=" + call.name
                        + " args=" + argsJson
                        + " success=" + result.success
                        + " durationMs=" + durationMs
                        + " result=" + summary);
            });
        }
        // T8.6：管理员 system prompt 配置生效（override 整体替换 / suffix 附加；每次请求读取 → 实时生效）
        // P1：计划模式追加"只调研 + 输出可执行计划"段落（该档写操作会被拒绝）
        final String planPrompt = activePermMode == com.DocSystem.agent.permission.PermissionMode.PLAN
                ? PLAN_MODE_PROMPT : null;
        loop.setSystemPromptDecorator(basePrompt -> {
            String prompt = basePrompt;
            if (agentConfigService != null) {
                String override = agentConfigService.getGlobal(
                        com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_OVERRIDE);
                if (override != null && !override.trim().isEmpty()) {
                    prompt = override;
                } else {
                    String suffix = agentConfigService.getGlobal(
                            com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_SUFFIX);
                    if (suffix != null && !suffix.trim().isEmpty()) {
                        prompt = prompt + "\n\n" + suffix.trim();
                    }
                }
            }
            if (planPrompt != null) {
                prompt = prompt + "\n\n" + planPrompt;
            }
            return prompt;
        });
        return loop;
    }

    /** P1：计划模式的 system prompt 段落（写操作会被策略层拒绝，故先出计划等人批准） */
    static final String PLAN_MODE_PROMPT =
            "[计划模式] 本轮你处于计划模式：**不要执行任何写操作**（新建/写入/删除/移动/改名/分享等都会被系统拒绝）。"
          + "可以自由使用只读工具（列仓库/列目录/读文件/搜索等）调研现状，然后输出一份**可执行计划**，"
          + "计划需包含：步骤序号 + 每一步的目标对象（仓库/目录/文件）+ 具体操作（工具与关键参数）；"
          + "预估影响（会改动多少个对象、是否可逆）；最后提示用户——确认无误后点击「批准并执行」即可开始执行。";

    /**
     * P1：技能风险解析 —— 优先用技能声明的 risk（{@code SKILL.md} 的 {@code risk:}），
     * 其次内置只读白名单，都没有 → 绝对保护（fail-safe）。
     */
    private com.DocSystem.agent.permission.ToolRisk resolveSkillRisk(String skillId) {
        String declared = null;
        try {
            com.DocSystem.agent.skill.EnhancedSkill s =
                    com.DocSystem.agent.skill.EnhancedSkillManager.getInstance().getSkill(skillId);
            if (s != null) {
                declared = s.getRisk();
            }
        } catch (Exception e) {
            log.debug("resolveSkillRisk 读取技能声明失败（按未声明处理）: {}", e.getMessage());
        }
        return com.DocSystem.agent.permission.SkillRiskRegistry.resolve(skillId, declared);
    }

    /**
     * 构建 WebSearchService（T8.4）：按配置 endpoint/timeout 构造；endpoint 为空 → 默认 DuckDuckGo。
     * 构造失败 → null（不注册 web_search 工具，不影响其他工具）。
     */
    private com.DocSystem.agent.search.WebSearchService buildWebSearchService() {
        try {
            if (webSearchEndpoint != null && !webSearchEndpoint.isEmpty()) {
                return new com.DocSystem.agent.search.WebSearchService(webSearchEndpoint, webSearchTimeoutMs);
            }
            return new com.DocSystem.agent.search.WebSearchService();
        } catch (Exception e) {
            log.warn("buildWebSearchService failed, web_search tool disabled: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从sessionInfo提取用户ID
     */
    private String extractUserId(Object sessionInfo) {
        if (sessionInfo instanceof AgentController.SessionInfo) {
            return ((AgentController.SessionInfo) sessionInfo).username;
        }
        return null;
    }

    /**
     * P2：附件会话 id —— 与 /agent/attachment 上传端点同一规则（对话会话 id 优先，回退 jsessionid）。
     */
    private String resolveAttachmentSession(Object sessionInfo, AgentContext context) {
        if (sessionInfo instanceof AgentController.SessionInfo) {
            String s = ((AgentController.SessionInfo) sessionInfo).attachmentSessionKey();
            if (s != null && !s.trim().isEmpty()) {
                return s;
            }
        }
        return context != null ? context.getSessionId() : null;
    }

    /**
     * 加载会话历史（T5.2b）：取 user/assistant 消息作为 LLM 上下文（最多保留最近 20 条，防上下文膨胀）。
     */
    private java.util.List<java.util.Map<String, String>> loadSessionHistory(String historySessionId) {
        if (historySessionId == null || historySessionId.isEmpty() || conversationHistoryService == null) {
            return null;
        }
        try {
            java.util.List<com.DocSystem.agent.session.SessionMessageEntity> history =
                    conversationHistoryService.getHistory(historySessionId);
            if (history == null || history.isEmpty()) {
                return null;
            }
            java.util.List<java.util.Map<String, String>> result = new java.util.ArrayList<>();
            int start = Math.max(0, history.size() - 20); // 只取最近 20 条
            for (int i = start; i < history.size(); i++) {
                com.DocSystem.agent.session.SessionMessageEntity m = history.get(i);
                String role = m.getRole();
                if (!"user".equals(role) && !"assistant".equals(role)) {
                    continue;
                }
                java.util.Map<String, String> msg = new java.util.HashMap<>();
                msg.put("role", role);
                msg.put("content", m.getContent() != null ? m.getContent() : "");
                result.add(msg);
            }
            return result.isEmpty() ? null : result;
        } catch (Exception e) {
            log.warn("loadSessionHistory failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从sessionInfo提取租户ID
     */
    private String extractTenantId(Object sessionInfo) {
        if (sessionInfo instanceof AgentController.SessionInfo) {
            return ((AgentController.SessionInfo) sessionInfo).tenantId;
        }
        return null;
    }

    /**
     * 判断当前用户是否管理员（用于 adminOnly 工具可见性）。
     * 当前简单实现：Admin 用户名视为管理员；后续可对接角色服务精确判断。
     */
    private boolean extractIsAdmin(Object sessionInfo) {
        String username = extractUserId(sessionInfo);
        return username != null && "Admin".equalsIgnoreCase(username);
    }
    
    // ===== LEGACY-FALLBACK 旧编排（R3-4 冻结，2026-09-21）：以下 NL 解析 / 任务分解 / 子任务执行 =====
    // 仅供 ToolUseLoop 失败兜底使用（见类注释）。只修 bug，禁止新增能力、禁止新增
    // decomposition.addSubTask(...) 分支；新能力请做成工具（DocSysToolFactory）。

    /**
     * 简单提取意图（LEGACY-FALLBACK）
     */
    private String extractIntent(String query) {
        query = query.toLowerCase();
        if (query.startsWith("list") || query.contains("列出")) return "list";
        if (query.startsWith("search") || query.contains("搜索") || query.contains("找")) return "search";
        if (query.startsWith("get") || query.startsWith("获取")) return "get";
        if (query.startsWith("create") || query.startsWith("add") || query.contains("创建") || query.contains("添加")) return "create";
        if (query.startsWith("delete") || query.contains("删除")) return "delete";
        if (query.startsWith("chat") || query.contains("聊天") || query.contains("问")) return "chat";
        if (query.startsWith("help") || query.contains("帮助")) return "help";
        return "unknown";
    }
    
    /**
     * Decompose user task into smaller sub-tasks（LEGACY-FALLBACK 旧编排）
     */
    private TaskDecomposition decomposeTask(String userQuery, AgentContext context) {
        TaskDecomposition decomposition = new TaskDecomposition();

        // Keep original query for Chinese matching, normalize only for English commands
        String originalQuery = userQuery.trim();
        String query = originalQuery.toLowerCase();
        
        log.info("DecomposeTask: originalQuery={}, query={}", originalQuery, query);

        // Parse command type and arguments
        // Use max 8 parts to handle commands with many parameters (e.g., add-doc)
        String[] parts = userQuery.trim().split("\\s+", 8);
        String command = parts[0].toLowerCase();

        // Handle compound commands like "create-repos", "list-docs", "get-doc"
        // Extract base command if it contains hyphen (e.g., "create-repos" -> "create")
        String baseCommand = command.contains("-") ? command.split("-")[0] : command;

        String arg1 = parts.length > 1 ? parts[1] : "";
        String arg2 = parts.length > 2 ? parts[2] : "";
        // Additional arguments for complex commands
        String arg3 = parts.length > 3 ? parts[3] : "";
        String arg4 = parts.length > 4 ? parts[4] : "";
        String arg5 = parts.length > 5 ? parts[5] : "";
        String arg6 = parts.length > 6 ? parts[6] : "";
        String arg7 = parts.length > 7 ? parts[7] : "";

        // Use BOTH lowercase query (for English) and original query (for Chinese)
        String lowerQuery = query;
        Map<String, String> params = new HashMap<>();

        // Check if the query starts with a known English command keyword
        boolean hasEnglishCommandIntent = false;
        String[] englishCommands = {"list", "create", "add", "delete", "remove", "search", "upload", "download", "get", "set", "whoami", "help", "chat"};
        for (String cmd : englishCommands) {
            if (lowerQuery.startsWith(cmd) && (lowerQuery.length() == cmd.length() || !Character.isLetterOrDigit(lowerQuery.charAt(cmd.length())))) {
                hasEnglishCommandIntent = true;
                break;
            }
        }

        // Check if it's a compound command like "list-repos", "create-repos"
        boolean isCompoundCommand = false;
        String[] compoundCommands = {"create-repos", "add-repos", "list-repos", "list-docs", "add-doc",
            "delete-doc", "delete-repos", "get-doc", "get-repos", "rename-doc", "copy-doc", "move-doc",
            "download-doc", "search-doc", "search-in-repo", "repos-info", "doc-history", "upload-doc",
            "rename-repos", "copy-repos", "lock-doc", "unlock-doc", "backup-repos", "backup"};
        for (String cc : compoundCommands) {
            if (lowerQuery.startsWith(cc)) {
                isCompoundCommand = true;
                break;
            }
        }

        // Route: compound commands → switch (semantics are unambiguous)
        // ALL OTHER queries → LLM NLU PRIMARY (regex is ONLY auxiliary when LLM is unavailable)
        if (isCompoundCommand) {
            log.info("Detected compound command intent: query={}", lowerQuery);
            // command stays as-is, first switch handles it
        } else {
            // EVERYTHING ELSE (English, Chinese, mixed, partial) → LLM NLU is MANDATORY
            log.info("Routing to LLM NLU (mandatory): query={}", originalQuery);
            command = "nlu";
        }

        // /init-auth command — generate API key (must be before /init check)
        if (originalQuery.startsWith("/init-auth")) {
            command = "init-auth";
        }
        // /init command — sync DocSys LLM config into Agent at runtime
        else if (originalQuery.startsWith("/init")) {
            command = "init";
        }

        if ("create-repos".equals(command) || "add-repos".equals(command)) {
                log.info("Processing 'create-repos' compound command, args: name={}, rest={}", arg1, arg2);
                // create-repos <name> [path] [desc] [type] [verCtrl]
                // arg2 format: "path desc type verCtrl" (path is first token after name)
                // Parse: "RealTestRepo001 F:/TestRepo001" -> name=RealTestRepo001, path=F:/TestRepo001
                String[] extraArgs = arg2 != null ? arg2.split("\\s+") : new String[0];
                params.put("name", arg1);
                // extraArgs[0]=path, [1]=desc, [2]=type, [3]=verCtrl
                params.put("desc", extraArgs.length > 1 ? extraArgs[1] : null);
                params.put("path", extraArgs.length > 0 ? extraArgs[0] : null);
                params.put("type", extraArgs.length > 2 ? extraArgs[2] : null);
                params.put("verCtrl", extraArgs.length > 3 ? extraArgs[3] : null);
                decomposition.addSubTask(new SubTask("add_repos", "Add repository", params));
                return decomposition;
            } else if ("backup-repos".equals(command)) {
                log.info("Processing 'backup-repos' compound command with arg1={}, arg2={}", arg1, arg2);
                params.put("vid", arg1);
                params.put("path", arg2);
                decomposition.addSubTask(new SubTask("backup_repos", "Backup repository", params));
                return decomposition;
            } else if ("list-repos".equals(command)) {
                decomposition.addSubTask(new SubTask("list_repos", "List repositories"));
                return decomposition;
            } else if ("list-docs".equals(command)) {
                // list-docs <vid> [pid] [path]
                params.put("vid", arg1);
                params.put("pid", arg2);
                params.put("path", arg3);
                decomposition.addSubTask(new SubTask("get_doc_list", "List documents", params));
                return decomposition;
            } else if ("add-doc".equals(command)) {
                // add-doc <vid> <pid> <path> <name> <type> [content]
                params.put("vid", arg1);
                params.put("pid", arg2);
                params.put("path", arg3);
                params.put("name", arg4);
                params.put("type", arg5);
                params.put("content", arg6);
                decomposition.addSubTask(new SubTask("add_doc", "Add document", params));
                return decomposition;
            } else if ("delete-doc".equals(command)) {
                // delete-doc <vid> <docId> [pid] [path] [name]
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("pid", arg3);
                params.put("path", arg4);
                params.put("name", arg5);
                decomposition.addSubTask(new SubTask("delete_doc", "Delete document", params));
                return decomposition;
            } else if ("delete-repos".equals(command)) {
                // delete-repos <vid>
                params.put("name", arg1); // Uses name but expects vid
                decomposition.addSubTask(new SubTask("delete_repos", "Delete repository", params));
                return decomposition;
            } else if ("get-doc".equals(command)) {
                // get-doc <vid> <docId> [pid] [path] [name]
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("pid", arg3);
                params.put("path", arg4);
                params.put("name", arg5);
                decomposition.addSubTask(new SubTask("get_doc", "Get document info", params));
                return decomposition;
            } else if ("get-repos".equals(command) || "repos-info".equals(command)) {
                // repos-info <vid>
                params.put("vid", arg1);
                decomposition.addSubTask(new SubTask("get_repos", "Get repository info", params));
                return decomposition;
            } else if ("rename-doc".equals(command)) {
                // rename-doc <vid> <docId> [pid] [path] [name] <newName>
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("pid", arg3);
                params.put("path", arg4);
                params.put("name", arg5);
                params.put("newName", arg6);
                decomposition.addSubTask(new SubTask("rename_doc", "Rename document", params));
                return decomposition;
            } else if ("copy-doc".equals(command)) {
                // copy-doc <vid> <docId> [targetPid] [targetPath] [newName]
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("targetPid", arg3);
                params.put("targetPath", arg4);
                params.put("newName", arg5);
                decomposition.addSubTask(new SubTask("copy_doc", "Copy document", params));
                return decomposition;
            } else if ("move-doc".equals(command)) {
                // move-doc <vid> <docId> [targetPid] [targetPath]
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("targetPid", arg3);
                params.put("targetPath", arg4);
                decomposition.addSubTask(new SubTask("move_doc", "Move document", params));
                return decomposition;
            } else if ("download-doc".equals(command)) {
                // download-doc <vid> <docId> [pid] [path] [name]
                params.put("vid", arg1);
                params.put("docId", arg2);
                params.put("pid", arg3);
                params.put("path", arg4);
                params.put("name", arg5);
                decomposition.addSubTask(new SubTask("download_doc", "Download document", params));
                return decomposition;
            } else if ("search-doc".equals(command)) {
                // search-doc <query> [vid]
                params.put("query", arg1);
                params.put("vid", arg2);
                decomposition.addSubTask(new SubTask("search_doc", "Search documents", params));
                return decomposition;
            } else if ("search-in-repo".equals(command)) {
                // search-in-repo <vid> <query>
                params.put("vid", arg1);
                params.put("query", arg2);
                decomposition.addSubTask(new SubTask("search_in_repo", "Search in repository", params));
                return decomposition;
            } else if ("doc-history".equals(command)) {
                // doc-history <vid> <docId>
                params.put("vid", arg1);
                params.put("docId", arg2);
                decomposition.addSubTask(new SubTask("doc_history", "Document history", params));
                return decomposition;
            } else if ("upload-doc".equals(command)) {
                // upload-doc <vid> [pid] [path] <file>
                params.put("vid", arg1);
                params.put("pid", arg2);
                params.put("path", arg3);
                params.put("name", arg4);
                decomposition.addSubTask(new SubTask("upload_doc", "Upload document", params));
                return decomposition;
            } else if ("rename-repos".equals(command)) {
                // rename-repos <reposId> <newName>
                params.put("reposId", arg1);
                params.put("name", arg2);
                decomposition.addSubTask(new SubTask("update_repos", "Rename repository", params));
                return decomposition;
            } else if ("copy-repos".equals(command)) {
                // copy-repos <vid> <newName> [newPath]
                params.put("vid", arg1);
                params.put("name", arg2);
                params.put("path", arg3);
                decomposition.addSubTask(new SubTask("copy_repos", "Copy repository", params));
                return decomposition;
            }

        switch (command) {
            // ========== ENGLISH COMMANDS (non-compound) ==========
            case "list":
                log.info("Processing 'list' command with arg1={}, arg2={}", arg1, arg2);
                if ("repos".equals(arg1) || "repositories".equals(arg1) || arg1.isEmpty()) {
                    decomposition.addSubTask(new SubTask("list_repos", "List repositories"));
                } else if ("docs".equals(arg1) || "documents".equals(arg1)) {
                    params.put("vid", arg2.isEmpty() ? null : arg2);
                    decomposition.addSubTask(new SubTask("get_doc_list", "List documents", params));
                } else if ("models".equals(arg1) || "ai-models".equals(arg1)) {
                    decomposition.addSubTask(new SubTask("list_models", "List AI models"));
                } else {
                    // Default to list repos
                    decomposition.addSubTask(new SubTask("list_repos", "List repositories"));
                }
                break;
                
            case "create":
            case "add":
                log.info("Processing 'create/add' command with arg1={}, arg2={}", arg1, arg2);
                if ("repos".equals(arg1) || "repo".equals(arg1)) {
                    // create-repos <name> [desc] [path] [type] [verCtrl]
                    params.put("name", arg2);
                    decomposition.addSubTask(new SubTask("add_repos", "Add repository", params));
                } else if ("doc".equals(arg1) || "document".equals(arg1)) {
                    params.put("name", arg2);
                    decomposition.addSubTask(new SubTask("add_doc", "Add document", params));
                }
                break;
                
            case "delete":
            case "remove":
                log.info("Processing 'delete/remove' command with arg1={}, arg2={}", arg1, arg2);
                if ("repos".equals(arg1) || "repo".equals(arg1)) {
                    params.put("name", arg2);
                    decomposition.addSubTask(new SubTask("delete_repos", "Delete repository", params));
                } else if ("doc".equals(arg1) || "document".equals(arg1)) {
                    params.put("docId", arg2);
                    decomposition.addSubTask(new SubTask("delete_doc", "Delete document", params));
                }
                break;
                
            case "search":
                log.info("Processing 'search' command with arg1={}", arg1);
                params.put("query", arg1);
                decomposition.addSubTask(new SubTask("search_doc", "Search documents", params));
                break;
                
            case "upload":
                log.info("Processing 'upload' command");
                decomposition.addSubTask(new SubTask("upload_doc", "Upload document"));
                break;
                
            case "download":
                log.info("Processing 'download' command with arg1={}", arg1);
                params.put("docId", arg1);
                decomposition.addSubTask(new SubTask("download_doc", "Download document", params));
                break;
            
            case "get":
                log.info("Processing 'get' command with arg1={}, arg2={}", arg1, arg2);
                if ("doc".equals(arg1) && !arg2.isEmpty()) {
                    // get-doc <vid> <docId>
                    String[] ids = arg2.split("\\s+", 2);
                    params.put("vid", ids.length > 0 ? ids[0] : null);
                    params.put("docId", ids.length > 1 ? ids[1] : null);
                    decomposition.addSubTask(new SubTask("get_doc", "Get document info", params));
                } else if ("repos".equals(arg1) || "repo".equals(arg1)) {
                    params.put("vid", arg2);
                    decomposition.addSubTask(new SubTask("repos_info", "Get repository info", params));
                }
                break;
                
            case "whoami":
                log.info("Processing 'whoami' command");
                decomposition.addSubTask(new SubTask("whoami", "Show current user"));
                break;
                
            case "chat":
                log.info("Processing 'chat' command");
                params.put("message", arg1 + " " + arg2);
                decomposition.addSubTask(new SubTask("chat", "Chat with AI", params));
                break;
                
            case "help":
                log.info("Processing 'help' command");
                decomposition.addSubTask(new SubTask("help", "Show help"));
                break;

            case "init":
                log.info("Processing '/init' — syncing LLM config from DocSys");
                decomposition.addSubTask(new SubTask("init-llm", "Initialize Agent LLM from DocSys config"));
                break;

            case "init-auth":
                log.info("Processing '/init-auth' — generating API key");
                decomposition.addSubTask(new SubTask("init-auth", "Generate API key from DocSys admin session"));
                break;

            // ========== NATURAL LANGUAGE (NLU) ==========
            case "nlu": {
                log.info("In NLU case, checking patterns...");
                // ========== LLM INTENT PARSING (P0 Enhancement) ==========
                // Try LLM first for structured intent + entity extraction
                IntentResult llmResult = LLMIntentParser.parse(userQuery, llmService);
                Map<String, String> llmParams = new HashMap<>(llmResult.getEntities());
                if (llmResult.isFromLLM() && llmResult.getConfidence() >= 0.6f) {
                    log.info("LLM intent={}, subTaskType={}, confidence={}, reasoning={}",
                            llmResult.getIntent(), llmResult.getSubTaskType(),
                            llmResult.getConfidence(), llmResult.getReasoning());
                    String subTask = llmResult.getSubTaskType();
                    if (subTask != null && !subTask.isEmpty()) {
                        // chat 子任务需要 message 参数(handleChat 读 params.get("message"))；
                        // LLM 抽取的 entities 里通常没有 message，这里补上原始 query，
                        // 否则 chat 会因 message 为空而报 "Usage: chat <message>"。
                        if ("chat".equals(subTask) && !llmParams.containsKey("message")) {
                            llmParams.put("message", userQuery);
                        }
                        decomposition.addSubTask(new SubTask(subTask,
                                "LLM: " + llmResult.getIntent(), llmParams));
                    } else {
                        llmParams.put("message", userQuery);
                        decomposition.addSubTask(new SubTask("chat",
                                "Chat with AI", llmParams));
                    }
                    break; // LLM succeeded with high confidence
                }

                // ========== UNIFIED SKILL TRIGGER MATCHING (ALL SKILLS) ==========
                // Agent-skill 编排思想：统一 trigger 匹配，同时覆盖内置技能和外部技能
                // EnhancedSkillManager 包含内置技能定义，getMatchScore() 提供 trigger 打分
                // Built-in 技能走对应 handler，External 技能走 ExternalSkillExecutor
                com.DocSystem.agent.skill.EnhancedSkill allSkills = com.DocSystem.agent.skill.EnhancedSkillManager.getInstance().findBestSkill(userQuery);
                if (allSkills != null && allSkills.getMatchScore(userQuery) >= 0.6) {
                    String matchedId = allSkills.getId();
                    log.info("Unified trigger matched '{}' with score={} (LLM confidence was {})",
                            matchedId, allSkills.getMatchScore(userQuery), llmResult.getConfidence());
                    decomposition.addSubTask(new SubTask(matchedId, "Skill: " + allSkills.getName(), llmParams));
                    break;
                }

                // ========== REGEX FALLBACK NLU ==========
                // Use original query (not lowercase) for Chinese pattern matching
                String nluQuery = originalQuery.toLowerCase();
                log.info("NLU regex fallback for: {}", nluQuery);
                
                // ========== 搜索相关 ==========
                // 模式1: "查询xxx的资料" / "搜索xxx" / "找xxx相关文档" / "帮我找" / "查一下" -> 搜索
                if (nluQuery.contains("查询") || nluQuery.contains("搜索") || nluQuery.contains("找") || 
                    nluQuery.contains("查找") || nluQuery.contains("检索") ||
                    nluQuery.contains("资料") || nluQuery.contains("文档") || nluQuery.contains("文件") ||
                    nluQuery.contains("帮我找") || nluQuery.contains("查一下")) {
                    String searchQuery = extractSearchQuery(userQuery);
                    params.put("query", searchQuery);
                    params.put("loadToContext", "true");
                    decomposition.addSubTask(new SubTask("search_and_load", "Search and load documents to context", params));
                }
                
                // ========== 内容生成相关 ==========
                // 模式2: "撰写xxx综述" / "写xxx总结" / "生成xxx报告" / "帮我写" / "总结一下" -> RAG + 生成
                if (nluQuery.contains("撰写") || nluQuery.contains("写") || nluQuery.contains("生成") || 
                    nluQuery.contains("综述") || nluQuery.contains("总结") || nluQuery.contains("报告") ||
                    nluQuery.contains("分析") || nluQuery.contains("帮我写") || nluQuery.contains("总结一下")) {
                    String topic = extractTopic(userQuery);
                    params.put("topic", topic);
                    params.put("generate", "true");
                    decomposition.addSubTask(new SubTask("generate_summary", "Generate summary from documents", params));
                }
                
                // ========== 问答相关 ==========
                // 模式3: "关于xxx" / "我想了解xxx" / "是什么" / "怎么回事" / "介绍一下" -> 搜索 + 回答
                if (nluQuery.contains("关于") || nluQuery.contains("了解") || nluQuery.contains("是什么") ||
                    nluQuery.contains("怎么回事") || nluQuery.contains("介绍") || nluQuery.contains("说一下") ||
                    nluQuery.contains("解释一下")) {
                    String topic = extractTopic(userQuery);
                    params.put("topic", topic);
                    params.put("query", topic);
                    decomposition.addSubTask(new SubTask("search_and_answer", "Search and answer", params));
                }
                
                // ========== 仓库相关 (优先级高，放在聊天之前) ==========
                // 模式4: 仓库列表 - "查看仓库" / "有哪些仓库" / "仓库列表" / "列出仓库" / "我的仓库"
                // 注意：必须放在聊天模式之前，因为"列出仓库"包含"问"字，会误匹配聊天模式
                if (nluQuery.contains("仓库") || nluQuery.contains("库列表") || nluQuery.contains("有哪些") ||
                    nluQuery.contains("查看") || nluQuery.contains("列出") || nluQuery.contains("我的")) {
                    if (nluQuery.contains("仓库") || nluQuery.contains("库")) {
                        log.info("Matched list_repos pattern, query={}", nluQuery);
                        decomposition.addSubTask(new SubTask("list_repos", "List repositories"));
                        break; // 已匹配仓库相关，不再继续其他模式
                    }
                }
                
                // ========== 文档操作相关 ==========
                // 模式5: 上传/添加文档
                if (nluQuery.contains("upload") || nluQuery.contains("上传") || nluQuery.contains("添加") ||
                    nluQuery.contains("提交") || nluQuery.contains("新建") || nluQuery.contains("创建")) {
                    decomposition.addSubTask(new SubTask("upload_doc", "Upload document"));
                }
                
                // 模式6: 下载文档
                if (nluQuery.contains("download") || nluQuery.contains("下载") || nluQuery.contains("获取")) {
                    decomposition.addSubTask(new SubTask("download_doc", "Download document"));
                }
                
                // 模式7: 删除文档
                if (nluQuery.contains("删除") || nluQuery.contains("remove") || nluQuery.contains("delete")) {
                    if (nluQuery.contains("仓库")) {
                        decomposition.addSubTask(new SubTask("delete_repos", "Delete repository"));
                    } else {
                        decomposition.addSubTask(new SubTask("delete_doc", "Delete document"));
                    }
                }
                
                // ========== 用户相关 ==========
                // 模式8: 用户信息 - "我是谁" / "我的信息" / "当前用户"
                if (nluQuery.contains("whoami") || nluQuery.contains("用户") || nluQuery.contains("我是谁") ||
                    nluQuery.contains("我的信息") || nluQuery.contains("当前用户") || nluQuery.contains("账号")) {
                    decomposition.addSubTask(new SubTask("whoami", "Show current user"));
                }
                
                // ========== AI 聊天 ==========
                // 模式9: AI聊天 - "聊天" / "问答" / "对话" / "问个问题" / "ai" / "助手"
                // 注意：避免单独匹配"问"字（可能是"列出"等词的组成部分），需要更具体的上下文
                if (nluQuery.contains("chat") || nluQuery.contains("ai") ||
                    nluQuery.contains("助手") || nluQuery.contains("问答") || nluQuery.contains("对话") ||
                    nluQuery.contains("问问题") || nluQuery.contains("问一下") || nluQuery.contains("问答") ||
                    nluQuery.contains("问我") || nluQuery.contains("问你") || nluQuery.contains("答") ||
                    (nluQuery.contains("问") && nluQuery.length() < 10)) { // 短句中包含"问"才匹配
                    params.put("message", userQuery);
                }

                // ========== 网络搜索 ==========
                // 模式10: 网络搜索 - 当本地没有结果时的优雅降级
                // "搜索网页" / "网上搜索" / "百度搜索" / "网络查询" / "网上查一下"
                if (nluQuery.contains("网络搜索") || nluQuery.contains("网上搜索") ||
                    nluQuery.contains("网页搜索") || nluQuery.contains("百度") ||
                    nluQuery.contains("搜索网页") || nluQuery.contains("网上查") ||
                    nluQuery.contains("网络查询") || nluQuery.contains("web search")) {
                    String searchQuery = extractSearchQuery(userQuery);
                    params.put("query", searchQuery);
                    decomposition.addSubTask(new SubTask("web_search", "Web search fallback", params));
                }
                
                // ========== 帮助 ==========
                // 模式10: 帮助 - "帮助" / "help" / "怎么用" / "使用方法"
                if (nluQuery.contains("help") || nluQuery.contains("帮助") || nluQuery.contains("怎么用") ||
                    nluQuery.contains("使用方法") || nluQuery.contains("命令") || nluQuery.contains("?") ||
                    nluQuery.contains("？")) {
                    decomposition.addSubTask(new SubTask("help", "Show help"));
                }
                
                // Default: use LLM for natural language
                if (decomposition.getSubTasks().isEmpty()) {
                    params.put("message", userQuery);
                    decomposition.addSubTask(new SubTask("chat", "Chat with AI", params));
                }
                break;
            }
        }

        // Default fallback: unrecognized commands → chat with LLM
        if (decomposition.getSubTasks().isEmpty()) {
            log.info("No sub-tasks matched for '{}', falling back to chat", userQuery);
            params.put("message", userQuery);
            decomposition.addSubTask(new SubTask("chat", "Chat with AI", params));
        }

        return decomposition;
    }
    
    /**
     * Execute sub-tasks in parallel（LEGACY-FALLBACK 旧编排）
     * @param authenticatedClient - Request-scoped DocSysClient with session already set
     */
    private TaskExecutionResult executeSubTasks(TaskDecomposition decomposition, AgentContext context,
                                                  DocSysClient authenticatedClient,
                                                  com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        TaskExecutionResult result = new TaskExecutionResult();
        for (SubTask subTask : decomposition.getSubTasks()) {
                String taskId = null;
                if (taskQueueService != null) {
                    try {
                        String metadata = String.format(
                            "{\"traceId\":\"%s\",\"sessionId\":\"%s\",\"subTaskId\":\"%s\"}",
                            org.slf4j.MDC.get("traceId"),
                            context != null ? context.getSessionId() : "unknown",
                            subTask.getId()
                        );
                        Map<String, String> params = new HashMap<>();
                        if (subTask.getParams() != null) params.putAll(subTask.getParams());
                        params.put("taskName", subTask.getId());
                        taskId = taskQueueService.enqueue(subTask.getId(), null, params, metadata);
                        taskQueueService.markRunning(taskId);
                    } catch (Exception e) {
                        log.warn("Failed to track task in queue service: {}", e.getMessage());
                    }
                }

                try {
                    SubAgent subAgent = getOrCreateSubAgent(subTask.getId());
                    AgentResponse subResult = subAgent.execute(subTask, context, authenticatedClient, resolvedLlm);
                    result.addResult(subTask.getId(), subResult);

                    if (taskQueueService != null && taskId != null) {
                        if (subResult.isSuccess()) {
                            taskQueueService.markCompleted(taskId, subResult.getMessage());
                        } else {
                            taskQueueService.markFailed(taskId, subResult.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to execute sub-task: {}", subTask.getId(), e);
                    result.addResult(subTask.getId(), AgentResponse.error(e.getMessage()));
                    if (taskQueueService != null && taskId != null) {
                        taskQueueService.markFailed(taskId, e.getMessage());
                    }
                }
            }

        return result;
    }
    
    /**
     * Aggregate results from sub-tasks
     */
    private AgentResponse aggregateResults(TaskExecutionResult executionResult) {
        StringBuilder aggregated = new StringBuilder();
        
        for (String taskId : executionResult.getResultIds()) {
            AgentResponse subResult = executionResult.getResult(taskId);
            if (subResult.isSuccess()) {
                aggregated.append(subResult.getMessage()).append("\n");
            } else {
                aggregated.append("Error in ").append(taskId).append(": ").append(subResult.getMessage()).append("\n");
            }
        }
        
        return AgentResponse.ok(aggregated.toString());
    }
    
    /**
     * Get or create a sub-agent from pool（LEGACY-FALLBACK 旧编排）
     */
    private SubAgent getOrCreateSubAgent(String taskId) {
        return subAgentPool.computeIfAbsent(taskId,
            k -> {
                SubAgent agent = new SubAgent(taskId, skillManager);
                if (llmService != null) {
                    agent.setLlmService(llmService);
                }
                if (skillExecutorRegistry != null) {
                    agent.setSkillExecutorRegistry(skillExecutorRegistry);
                }
                return agent;
            });
    }
    
    /**
     * Shutdown agent resources
     */
    public void shutdown() {
        log.info("Shutting down MainAgent");
        executor.shutdown();
        subAgentPool.clear();
    }
    
    // ========== NATURAL LANGUAGE HELPERS ==========
    
    /**
     * 从自然语言中提取搜索关键词
     * 例如: "查询项目的资料" -> "项目"
     *      "搜索关于合同的文件" -> "合同"
     */
    private String extractSearchQuery(String userQuery) {
        // 移除常见的搜索前缀
        String query = userQuery.toLowerCase()
            .replaceAll("查询", "")
            .replaceAll("搜索", "")
            .replaceAll("找", "")
            .replaceAll("资料", "")
            .replaceAll("文档", "")
            .replaceAll("文件", "")
            .replaceAll("相关的", "")
            .replaceAll("关于", "")
            .replaceAll("\\s+", " ")
            .trim();
        
        // 如果清理后为空，返回原查询
        return query.isEmpty() ? userQuery : query;
    }
    
    /**
     * 从自然语言中提取主题/话题
     * 例如: "撰写项目综述" -> "项目"
     *      "生成合同分析报告" -> "合同分析"
     */
    private String extractTopic(String userQuery) {
        String query = userQuery.toLowerCase();
        
        // 移除生成类动词前缀
        String[] prefixes = {"撰写", "写", "生成", "制作", "创建"};
        for (String prefix : prefixes) {
            query = query.replace(prefix, "");
        }
        
        // 移除文档类型后缀
        String[] suffixes = {"综述", "总结", "报告", "分析", "文章", "文档"};
        for (String suffix : suffixes) {
            query = query.replace(suffix, "");
        }
        
        query = query.replaceAll("\\s+", " ").trim();
        
        return query.isEmpty() ? userQuery : query;
    }
    
    // Inner classes for task management
    /**
     * 任务分解结果（LEGACY-FALLBACK 旧编排）：仅 {@link SubAgent} 旧调度使用；
     * 主路径 ToolUseLoop 用工具调用循环，不经此类。
     */
    public static class TaskDecomposition {
        private final java.util.List<SubTask> subTasks = new java.util.ArrayList<>();
        
        public void addSubTask(SubTask task) {
            subTasks.add(task);
        }
        
        public java.util.List<SubTask> getSubTasks() {
            return subTasks;
        }
    }
    
    private static class TaskExecutionResult {
        private final ConcurrentHashMap<String, AgentResponse> results = new ConcurrentHashMap<>();
        
        public void addResult(String taskId, AgentResponse result) {
            results.put(taskId, result);
        }
        
        public AgentResponse getResult(String taskId) {
            return results.get(taskId);
        }
        
        public java.util.Set<String> getResultIds() {
            return results.keySet();
        }
    }
}
