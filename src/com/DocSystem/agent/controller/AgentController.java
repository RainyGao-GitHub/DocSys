package com.DocSystem.agent.controller;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.config.EnvConfig;
import com.DocSystem.agent.controller.AuditLogService;
import com.DocSystem.agent.entity.AuditLogEntity;
import com.DocSystem.agent.core.AgentContext;
import com.DocSystem.agent.core.AgentResponse;
import com.DocSystem.agent.focus.AgentFocusSupport;
import com.DocSystem.agent.learning.service.CollaborativeFilteringService;
import com.DocSystem.agent.learning.service.BehaviorTrackingService;
import com.DocSystem.agent.learning.service.SkillMetadataService;
import com.DocSystem.agent.learning.entity.SkillMetadata;
import com.DocSystem.agent.llm.LLMService;
import com.DocSystem.agent.monitoring.AgentMetrics;
import com.DocSystem.agent.monitoring.RateLimitService;
import com.DocSystem.agent.orchestrator.MainAgent;
import com.DocSystem.agent.session.SessionService;
import com.DocSystem.agent.skill.Skill;
import com.DocSystem.agent.skill.SkillManager;
import com.DocSystem.agent.skill.EnhancedSkillManager;
import com.DocSystem.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Agent REST API - provides CLI-like interface over HTTP
 */
@RestController
@RequestMapping("/agent")
public class AgentController {
    
    private static final Logger log = LoggerFactory.getLogger(AgentController.class);
    
    @Autowired
    private MainAgent mainAgent;

    @Autowired
    private DocSysClient docSysClient;
    
    // Learning services
    @Autowired
    private CollaborativeFilteringService learningService;

    @Autowired
    private BehaviorTrackingService behaviorTrackingService;

    @Autowired(required = false)
    private LLMService llmService;

    @Autowired(required = false)
    private com.DocSystem.agent.llm.UserLlmModelService userLlmModelService;

    @Autowired
    private AgentMetrics agentMetrics;

    @Autowired(required = false)
    private RateLimitService rateLimitService;

    @Autowired
    private SessionService sessionService;

    @Autowired(required = false)
    private com.DocSystem.agent.session.ConversationHistoryService conversationHistoryService;

    @Autowired(required = false)
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SkillMetadataService skillMetadataService;

    /** T8.6 管理员提示词配置服务 */
    @Autowired(required = false)
    private com.DocSystem.agent.config.AgentConfigService agentConfigService;

    // Streaming executor — exposed to DocSysAgentApplication for graceful shutdown
    private final ExecutorService streamingExecutor = Executors.newCachedThreadPool();

    @Autowired
    private com.DocSystem.agent.DocSysAgentApplication docSysAgentApplication;

    @javax.annotation.PostConstruct
    public void registerExecutorForShutdown() {
        if (docSysAgentApplication != null) {
            docSysAgentApplication.setStreamingExecutor(streamingExecutor);
        }
    }

    // Per-jsessionid DocSysClient 池 - 避免单例 cookie 覆盖问题。
    // 认证已由共享 HttpSession 负责，这里仅按 JSESSIONID 缓存用于 HTTP 直通的 DocSysClient。
    private final ConcurrentHashMap<String, DocSysClient> sessionClients = new ConcurrentHashMap<>();

    @Value("${agent.sse-timeout:300}")
    private long sseTimeoutSeconds;

    @Value("${docsys.api-key:}")
    private String appApiKey;

    @Value("${agent.widget-url:}")
    private String agentWidgetUrl;

    @Value("${agent.widget-key:}")
    private String agentWidgetKey;

    /** ToolUseLoop 灰度开关（与 MainAgent 一致；SSE 路径据此决定是否走工具推理 + 确认推送） */
    @Value("${agent.tool-loop.enabled:true}")
    private boolean toolLoopEnabled;

    @Autowired
    private EnvConfig envConfig;

    /**
     * 获取或创建 per-jsessionid DocSysClient。
     * 每个 JSESSIONID 有独立的 DocSysClient 实例（携带 Cookie: JSESSIONID=xxx），
     * 用于 DocSystem `.do` 业务接口的 HTTP 直通，避免单例 cookie 覆盖。
     */
    private DocSysClient getSessionClient(String jsessionid) {
        String raw = stripJsessionidPrefix(jsessionid);
        if (raw == null || raw.isEmpty()) {
            // 没有 JSESSIONID —— 返回一个无 cookie 的一次性 client
            return docSysClient.copy();
        }
        return sessionClients.compute(raw, (key, existing) -> {
            if (existing != null) {
                existing.setSessionCookie("JSESSIONID=" + key);
                return existing;
            }
            DocSysClient client = docSysClient.copy();
            client.setSessionCookie("JSESSIONID=" + key);
            return client;
        });
    }

    /**
     * 移除前缀 "JSESSIONID=" 避免重复
     */
    private String stripJsessionidPrefix(String jsessionid) {
        if (jsessionid != null && jsessionid.startsWith("JSESSIONID=")) {
            return jsessionid.substring("JSESSIONID=".length());
        }
        return jsessionid;
    }

    /**
     * 清理 per-jsessionid DocSysClient 缓存
     */
    public void removeSession(String jsessionid) {
        sessionClients.remove(stripJsessionidPrefix(jsessionid));
        agentMetrics.sessionClosed();
    }

    /**
     * Current DocSystem-logged-in user from the shared HttpSession, or null.
     * 认证由 DocSystem 负责：agent 与 DocSystem 同源同上下文，浏览器自动带上同一个
     * JSESSIONID，因此 request.getSession() 就是 DocSystem 的会话。
     */
    private User currentUser(HttpServletRequest request) {
        if (request == null) return null;
        javax.servlet.http.HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object u = session.getAttribute("login_user");
        return (u instanceof User) ? (User) u : null;
    }
    /**
     * Execute request DTO - 使用 JSON body 传递参数
     *
     * 优势:
     * - 无 URL 长度限制（支持长命令）
     * - 完美处理中文、特殊字符
     * - 可传递结构化参数
     * - 符合 REST 最佳实践
     */
    public static class ExecuteRequest {
        private String command;
        private String sessionId;
        private String jsessionid;
        private String cookie;  // Cookie header 也可通过 body 传递
        private String modelId;  // 用户选择的模型 selector（sys:idx 或 user:id），null=默认
        /** P1：「/」本轮操作 id（白名单见 AgentFocusSupport.operationIds()，可含 skill:<id>），null=未选 */
        private String operation;
        /** P1：「@」本轮关注对象（仓库/目录/文件），结构见 AgentFocusSupport.FocusItem */
        private List<AgentFocusSupport.FocusItem> focus;
        /** P2：本轮附件（上传的临时文件；只传 id/name，服务端按会话目录校验存在性） */
        private List<AttachmentRef> attachments;

        public ExecuteRequest() {}

        public String getCommand() { return command; }
        public void setCommand(String command) { this.command = command; }

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }

        public String getJsessionid() { return jsessionid; }
        public void setJsessionid(String jsessionid) { this.jsessionid = jsessionid; }

        public String getCookie() { return cookie; }
        public void setCookie(String cookie) { this.cookie = cookie; }

        public String getModelId() { return modelId; }
        public void setModelId(String modelId) { this.modelId = modelId; }

        public String getOperation() { return operation; }
        public void setOperation(String operation) { this.operation = operation; }

        public List<AgentFocusSupport.FocusItem> getFocus() { return focus; }
        public void setFocus(List<AgentFocusSupport.FocusItem> focus) { this.focus = focus; }

        public List<AttachmentRef> getAttachments() { return attachments; }
        public void setAttachments(List<AttachmentRef> attachments) { this.attachments = attachments; }
    }

    /**
     * Process agent command.
     *
     * 认证：直接读取共享 HttpSession 中 DocSystem 写入的 login_user。
     * 不再由 agent 自己管理登录/会话。
     */
    @PostMapping("/execute")
    public AgentResponse execute(
            @RequestBody ExecuteRequest request,
            HttpServletRequest servletRequest) {

        String command = request.getCommand();

        log.info("Execute called - command length: {}", command != null ? command.length() : 0);

        String requestId = java.util.UUID.randomUUID().toString();
        MDC.put("requestId", requestId);

        try {
            // ===== 认证：来自共享 HttpSession 的当前用户 =====
            User user = currentUser(servletRequest);
            if (user == null) {
                return AgentResponse.error("NOT_LOGGED_IN");
            }
            String username = user.getName();
            // 供 DocSysClient HTTP 直通使用的 JSESSIONID（即 DocSystem 会话 id）
            String jsessionid = servletRequest.getSession().getId();
            // 解析用户选定的模型（在请求线程内解析）；null=使用系统默认
            com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm =
                    (userLlmModelService != null) ? userLlmModelService.resolve(request.getModelId(), username) : null;
            AgentResponse resp = runCommand(command, username, jsessionid, resolvedLlm);
            // T5.2a 会话历史持久化（/execute 路径）
            if (conversationHistoryService != null) {
                conversationHistoryService.saveExchange(
                        request.getSessionId() != null ? request.getSessionId() : jsessionid,
                        command, resp.getMessage());
            }
            return resp;
        } finally {
            MDC.remove("requestId");
            MDC.remove("sessionId");
            MDC.remove("userId");
        }
    }

    /**
     * 执行核心逻辑（认证之后）。username/jsessionid 必须在请求线程内解析好，
     * 以便 SSE 等后台线程也能安全调用（不依赖已回收的 request）。
     */
    private AgentResponse runCommand(String command, String username, String jsessionid) {
        return runCommand(command, username, jsessionid, null);
    }

    /**
     * 执行核心逻辑（带模型选择）。
     * @param resolvedLlm 用户选定的模型配置，null=使用系统默认
     */
    private AgentResponse runCommand(String command, String username, String jsessionid,
                                      com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm) {
        try {
            log.info("Authenticated as: {}", username);

            // Set MDC context for structured logging
            MDC.put("sessionId", jsessionid);
            MDC.put("userId", username);

            // Build session info for MainAgent (jsessionid 作为有效 sessionId)
            SessionInfo info = new SessionInfo(username, jsessionid, jsessionid);

            // Get context
            AgentContext context = getContext(username, jsessionid);

            // Execute via MainAgent (传入 per-jsessionid client + resolvedLlm)
            log.info("Calling mainAgent.process...");
            DocSysClient execClient = getSessionClient(jsessionid);
            long execStart = System.currentTimeMillis();
            AgentResponse response = mainAgent.process(command, context, info, execClient, resolvedLlm);
            long duration = System.currentTimeMillis() - execStart;
            // Extract intent from command for metrics
            String intent = extractIntent(command);
            agentMetrics.recordExecution(intent, duration, response.isSuccess());
            sessionService.touch(jsessionid);
            log.info("MainAgent response: success={}, message={}", response.isSuccess(), response.getMessage());
            return response;

        } catch (Exception e) {
            log.error("Execution failed", e);
            return AgentResponse.error("Execution failed: " + e.getMessage());
        }
    }

    /**
     * 在 SSE 路径运行 ToolUseLoop（写操作确认事件经 emitter 推送前端）。
     *
     * @return 成功 → AgentResponse；失败/异常 → null（调用方回退旧路径）
     */
    private AgentResponse runToolLoopWithSse(String command, String username, String jsessionid,
                                              String sessionId,
                                              com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm,
                                              SseEmitter emitter) {
        try {
            AgentContext context = getContext(username, jsessionid);
            DocSysClient execClient = getSessionClient(jsessionid);
            SessionInfo info = new SessionInfo(username, jsessionid, jsessionid);
            // P2：附件工具按「对话会话 id」找临时附件（与 /agent/attachment 上传路径一致）
            info.agentSessionId = sessionId;

            // SSE 确认推送器：写工具需要确认时推 confirm 事件给前端
            com.DocSystem.agent.tool.ConfirmEventSink sink = (toolName, token, msg) -> {
                try {
                    emitter.send(SseEmitter.event()
                        .data("{\"type\":\"confirm\",\"confirmToken\":\"" + token +
                              "\",\"operation\":\"" + toolName +
                              "\",\"message\":" + escapeJson(msg) + "}", MediaType.TEXT_PLAIN));
                    log.info("SSE confirm pushed: tool={}, confirmToken={}", toolName, token);
                } catch (Exception e) {
                    log.warn("SSE confirm push failed for tool '{}': {}", toolName, e.getMessage());
                }
            };

            return mainAgent.runToolUseLoop(command, context, execClient, resolvedLlm, info, sink, sessionId);
        } catch (Exception e) {
            log.error("runToolLoopWithSse failed", e);
            return null;
        }
    }

    /** 流式工具推理的产物：响应 + 全程累积的 reasoning（T7.3 持久化用） */
    private static class StreamingLoopOutcome {
        final AgentResponse response;
        final String reasoning;
        StreamingLoopOutcome(AgentResponse response, String reasoning) {
            this.response = response;
            this.reasoning = reasoning != null ? reasoning : "";
        }
    }

    /** SSE 安全推送（吞异常，避免流中断） */
    private void sendSse(SseEmitter emitter, String json) {
        try {
            emitter.send(SseEmitter.event().data(json, MediaType.TEXT_PLAIN));
        } catch (Exception e) {
            log.warn("SSE send failed: {}", e.getMessage());
        }
    }

    /** 截断工具卡片展示文本（结果摘要过长时） */
    private String truncateForCard(String s, int maxLen) {
        if (s == null) return "";
        if (s.length() <= maxLen) return s;
        return s.substring(0, maxLen) + "…";
    }

    /**
     * 在 SSE 路径流式运行 ToolUseLoop（T7.1.3/T7.1.4）：
     * 推理过程实时推送（reasoning/text/tool_call/tool_result/retry），
     * 写操作确认事件（{@code type=confirm}）保持；全程累积 reasoning 供持久化。
     *
     * @return 产物（response + reasoning）；失败/异常 → null（调用方回退旧路径）
     */
    private StreamingLoopOutcome runToolLoopStreamingWithSse(String command, String username, String jsessionid,
                                                             String sessionId,
                                                             com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm,
                                                             SseEmitter emitter) {
        try {
            AgentContext context = getContext(username, jsessionid);
            DocSysClient execClient = getSessionClient(jsessionid);
            SessionInfo info = new SessionInfo(username, jsessionid, jsessionid);
            // P2：附件工具按「对话会话 id」找临时附件（context.getSessionId() 是 jsessionid，会看不到刚上传的附件）
            info.agentSessionId = sessionId;

            final StringBuilder reasoningAccum = new StringBuilder();

            // SSE 确认推送器：写工具需要确认时推 confirm 事件给前端
            com.DocSystem.agent.tool.ConfirmEventSink sink = (toolName, token, msg) -> {
                sendSse(emitter, "{\"type\":\"confirm\",\"confirmToken\":\"" + token +
                        "\",\"operation\":\"" + toolName +
                        "\",\"message\":" + escapeJson(msg) + "}");
                log.info("SSE confirm pushed: tool={}, confirmToken={}", toolName, token);
            };

            // 流式事件推送器：reasoning/text/tool_call/tool_result/retry
            com.DocSystem.agent.orchestrator.ToolUseLoop.StreamSink streamSink =
                    new com.DocSystem.agent.orchestrator.ToolUseLoop.StreamSink() {
                        @Override
                        public void onReasoning(String chunk) {
                            reasoningAccum.append(chunk);
                            sendSse(emitter, "{\"type\":\"reasoning\",\"content\":" + escapeJson(chunk) + "}");
                        }
                        @Override
                        public void onText(String chunk) {
                            sendSse(emitter, "{\"type\":\"text\",\"content\":" + escapeJson(chunk) + "}");
                        }
                        @Override
                        public void onToolCall(com.DocSystem.agent.tool.ToolCall call) {
                            String args = call.arguments != null ? call.arguments.toJSONString() : "{}";
                            sendSse(emitter, "{\"type\":\"tool_call\",\"name\":" + escapeJson(call.name) +
                                    ",\"arguments\":" + args + "}");
                        }
                        @Override
                        public void onToolResult(com.DocSystem.agent.tool.ToolCall call,
                                                 com.DocSystem.agent.tool.ToolResult result) {
                            String summary = truncateForCard(
                                    result.success
                                            ? (result.summary != null ? result.summary : "")
                                            : (result.error != null ? result.error : "执行失败"),
                                    300);
                            String err = result.success ? null
                                    : (result.error != null ? truncateForCard(result.error, 200) : "执行失败");
                            sendSse(emitter, "{\"type\":\"tool_result\",\"name\":" + escapeJson(call.name) +
                                    ",\"success\":" + result.success +
                                    ",\"summary\":" + escapeJson(summary) +
                                    ",\"error\":" + (err != null ? escapeJson(err) : "null") + "}");
                        }
                        @Override
                        public void onRetry() {
                            sendSse(emitter, "{\"type\":\"retry\"}");
                        }
                    };

            AgentResponse resp = mainAgent.runToolUseLoopStreaming(
                    command, context, execClient, resolvedLlm, info, sink, sessionId, streamSink);
            return new StreamingLoopOutcome(resp, reasoningAccum.toString());
        } catch (Exception e) {
            log.error("runToolLoopStreamingWithSse failed", e);
            return null;
        }
    }

    /**
     * Smart execute request DTO - 支持 CLI 优先 + 可视化备选
     */
    public static class ExecuteSmartRequest {
        private String command;
        private String mode = "auto";  // cli/visual/auto
        private String sessionId;
        private boolean visualFallback = false;
        private String jsessionid;
        private String cookie;

        public ExecuteSmartRequest() {}

        public String getCommand() { return command; }
        public void setCommand(String command) { this.command = command; }

        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }

        public boolean isVisualFallback() { return visualFallback; }
        public void setVisualFallback(boolean visualFallback) { this.visualFallback = visualFallback; }

        public String getJsessionid() { return jsessionid; }
        public void setJsessionid(String jsessionid) { this.jsessionid = jsessionid; }

        public String getCookie() { return cookie; }
        public void setCookie(String cookie) { this.cookie = cookie; }
    }

    /**
     * Get current logged-in user info from the shared DocSystem session.
     */
    @GetMapping("/session")
    public AgentResponse getSession(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getName());
        data.put("realName", user.getRealName());
        data.put("sessionId", request.getSession().getId());
        return AgentResponse.ok(data);
    }

    // ==================== 会话历史持久化（T5.2a：续接入口） ====================

    /**
     * 列出当前用户的会话（按最近活跃倒序，含标题/消息数）。
     * GET /agent/sessions
     */
    @GetMapping("/sessions")
    public AgentResponse listSessions(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String username = user.getName();
        List<Map<String, Object>> result = new ArrayList<>();
        java.util.List<com.DocSystem.agent.session.SessionEntity> sessions =
                sessionService.listByUsername(username);
        if (sessions != null) {
            for (com.DocSystem.agent.session.SessionEntity s : sessions) {
                Map<String, Object> item = new HashMap<>();
                item.put("sessionId", s.getSessionId());
                String title = com.DocSystem.agent.session.SessionService.titleFromMetadata(s.getMetadata());
                item.put("title", title != null ? title : "新会话");
                item.put("lastActive", s.getLastActive() != null ? s.getLastActive().toString() : null);
                item.put("messageCount", conversationHistoryService != null
                        ? conversationHistoryService.countBySessionId(s.getSessionId()) : 0);
                result.add(item);
            }
        }
        // 按 lastActive 倒序
        result.sort((a, b) -> {
            String ta = (String) a.get("lastActive");
            String tb = (String) b.get("lastActive");
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });
        return AgentResponse.ok(result);
    }

    /**
     * 创建新会话。
     * POST /agent/sessions   body: { "title": "..." }
     * @return { "sessionId": "..." }
     */
    @PostMapping("/sessions")
    public AgentResponse createSession(@RequestBody(required = false) Map<String, String> body,
                                        HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String sessionId = java.util.UUID.randomUUID().toString();
        String title = body != null ? body.get("title") : null;
        com.DocSystem.agent.session.SessionEntity session =
                sessionService.createSession(sessionId, user.getName(), title);
        Map<String, Object> data = new HashMap<>();
        data.put("sessionId", session.getSessionId());
        data.put("title", title != null ? title : "新会话");
        return AgentResponse.ok(data);
    }

    /**
     * 取会话历史消息（seq 升序）。
     * GET /agent/sessions/{sessionId}/messages
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public AgentResponse getSessionMessages(@PathVariable("sessionId") String sessionId,
                                             HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (conversationHistoryService == null) {
            return AgentResponse.error("ConversationHistoryService not available");
        }
        List<Map<String, Object>> messages = new ArrayList<>();
        for (com.DocSystem.agent.session.SessionMessageEntity m :
                conversationHistoryService.getHistory(sessionId)) {
            Map<String, Object> item = new HashMap<>();
            item.put("role", m.getRole());
            String content = m.getContent();
            // P1：关注对象/操作以注入块形式存在用户消息里，读取时反解回结构化字段 + 剥离原文，
            // 这样刷新/换设备后历史仍是「用户原文 + 对象 chips」，且不新增表字段。
            if ("user".equals(m.getRole())
                    && com.DocSystem.agent.focus.AgentFocusSupport.hasInjectedBlock(content)) {
                List<com.DocSystem.agent.focus.AgentFocusSupport.FocusItem> focus =
                        com.DocSystem.agent.focus.AgentFocusSupport.parseInjectedBlock(content);
                if (!focus.isEmpty()) {
                    item.put("focus", focus);
                }
                String op = com.DocSystem.agent.focus.AgentFocusSupport.parseInjectedOperation(content);
                if (op != null) {
                    Map<String, Object> opInfo = new HashMap<String, Object>();
                    opInfo.put("id", op);
                    opInfo.put("label", AgentFocusSupport.operationShortLabel(op));
                    item.put("operation", opInfo);
                }
                content = com.DocSystem.agent.focus.AgentFocusSupport.stripInjectedBlock(content);
            }
            item.put("content", content);
            item.put("seq", m.getSeq());
            item.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
            messages.add(item);
        }
        return AgentResponse.ok(messages);
    }

    /**
     * 删除会话及其消息。
     * DELETE /agent/sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    public AgentResponse deleteSession(@PathVariable("sessionId") String sessionId,
                                        HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (conversationHistoryService == null) {
            return AgentResponse.error("ConversationHistoryService not available");
        }
        conversationHistoryService.deleteSession(sessionId);
        // P2：会话删除时同步清空该会话的附件临时目录（临时文件不该残留到 7 天 sweep；删失败不影响会话删除结果）
        purgeSessionAttachments(user.getName(), sessionId);
        return AgentResponse.ok("会话已删除");
    }

    /**
     * P2：清空某用户某会话的附件临时目录（best-effort）。
     * 注意：只删当前用户自己的目录（会话 id 虽然是 UUID，但不以“能删他人文件”为前提）。
     */
    private void purgeSessionAttachments(String userId, String sessionId) {
        try {
            java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                    userId, attachSessionKey(sessionId), false);
            if (!dir.isDirectory()) {
                return;
            }
            int files = com.DocSystem.agent.attachment.AgentAttachmentSupport.listItems(dir).size();
            boolean ok = com.DocSystem.agent.attachment.AgentAttachmentSupport.deleteRecursively(dir);
            log.info("session deleted: attachments purged, user={}, session={}, files={}, ok={}",
                    userId, sessionId, files, ok);
        } catch (Exception e) {
            log.warn("purge session attachments failed: user={}, session={}, err={}",
                    userId, sessionId, e.getMessage());
        }
    }

    // ==================== LLM 模型列表 / 用户自定义模型 CRUD ====================

    // ==================== T8.6 管理员提示词配置 ====================

    /** 提示词配置请求体（override/suffix 均可空 → 清空对应项） */
    public static class SystemPromptConfigRequest {
        private String override;
        private String suffix;
        public String getOverride() { return override; }
        public void setOverride(String override) { this.override = override; }
        public String getSuffix() { return suffix; }
        public void setSuffix(String suffix) { this.suffix = suffix; }
    }

    /** 当前登录用户是否系统管理员（DocSystem 惯例：type >= 1 为管理员） */
    private boolean isSystemAdmin(User user) {
        return user != null && user.getType() != null && user.getType() >= 1;
    }

    /**
     * 读取提示词配置（管理员）：override（整体覆盖）+ suffix（附加）+ 默认 prompt 预览。
     */
    @GetMapping("/config/system-prompt")
    public AgentResponse getSystemPromptConfig(HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (!isSystemAdmin(user)) {
            return AgentResponse.error("仅管理员可查看提示词配置");
        }
        if (agentConfigService == null) {
            return AgentResponse.error("提示词配置服务不可用");
        }
        try {
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            String override = agentConfigService.getGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_OVERRIDE);
            String suffix = agentConfigService.getGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_SUFFIX);
            data.put("override", override != null ? override : "");
            data.put("suffix", suffix != null ? suffix : "");
            // 默认 prompt 预览（当前管理员可见工具）
            try {
                DocSysClient client = getSessionClient(servletRequest.getSession().getId());
                com.DocSystem.agent.tool.ToolRegistry reg =
                        com.DocSystem.agent.tool.DocSysToolFactory.createFullRegistry(client);
                data.put("defaultPrompt", com.DocSystem.agent.tool.ToolPromptBuilder
                        .buildSystemPrompt(reg.listForUser(true)));
            } catch (Exception e) {
                data.put("defaultPrompt", "（预览生成失败: " + e.getMessage() + "）");
            }
            return AgentResponse.ok("Success").withData(data);
        } catch (Exception e) {
            log.error("getSystemPromptConfig failed", e);
            return AgentResponse.error("读取提示词配置失败: " + e.getMessage());
        }
    }

    /**
     * 保存提示词配置（管理员）：override（整体覆盖）+ suffix（附加）。
     * 二者均可空字符串 → 清空对应项（恢复默认 prompt）。
     */
    @PostMapping("/config/system-prompt")
    public AgentResponse saveSystemPromptConfig(@RequestBody(required = false) SystemPromptConfigRequest req,
                                                HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (!isSystemAdmin(user)) {
            return AgentResponse.error("仅管理员可配置提示词");
        }
        if (agentConfigService == null) {
            return AgentResponse.error("提示词配置服务不可用");
        }
        try {
            String override = (req != null && req.getOverride() != null) ? req.getOverride() : "";
            String suffix = (req != null && req.getSuffix() != null) ? req.getSuffix() : "";
            agentConfigService.setGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_OVERRIDE, override);
            agentConfigService.setGlobal(
                    com.DocSystem.agent.config.AgentConfigService.KEY_SYSTEM_PROMPT_SUFFIX, suffix);
            return AgentResponse.ok("提示词配置已保存");
        } catch (Exception e) {
            log.error("saveSystemPromptConfig failed", e);
            return AgentResponse.error("保存提示词配置失败: " + e.getMessage());
        }
    }

    // ==================== LLM 模型列表 / 用户自定义模型 CRUD ====================

    /**
     * 列出当前用户可用的模型：系统模型（所有人可见，selector=sys:idx）+ 该用户自定义模型（selector=user:id）。
     * 不回传任何 apiKey。
     */
    @GetMapping("/models/list")
    public AgentResponse listModels(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String userId = user.getName() != null ? user.getName() : "anonymous";

        List<Map<String, Object>> systemModels = new ArrayList<>();
        com.DocSystem.common.entity.SystemLLMConfig sysCfg = com.DocSystem.common.BaseFunction.systemLLMConfig;
        if (sysCfg != null && sysCfg.enabled && sysCfg.llmConfigList != null) {
            for (int i = 0; i < sysCfg.llmConfigList.size(); i++) {
                com.DocSystem.common.entity.LLMConfig c = sysCfg.llmConfigList.get(i);
                Map<String, Object> m = new HashMap<>();
                m.put("selector", "sys:" + i);
                m.put("name", c.name != null && !c.name.isEmpty() ? c.name : c.modelName);
                m.put("modelName", c.modelName);
                m.put("system", true);
                systemModels.add(m);
            }
        }

        List<Map<String, Object>> userModels = new ArrayList<>();
        if (userLlmModelService != null) {
            for (com.DocSystem.agent.learning.entity.UserCustomLlmModel m : userLlmModelService.listForUser(userId)) {
                Map<String, Object> mm = new HashMap<>();
                mm.put("selector", "user:" + m.getId());
                mm.put("id", m.getId());
                mm.put("name", m.getName());
                mm.put("modelName", m.getModelName());
                mm.put("endpoint", m.getEndpoint());
                mm.put("system", false);
                userModels.add(mm);
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("systemModels", systemModels);
        data.put("userModels", userModels);
        data.put("defaultSelector", systemModels.isEmpty() ? null : "sys:0");
        return AgentResponse.ok(data);
    }

    /** 新增用户自定义模型。Body: {name, modelName, endpoint, apiKey, settings?} */
    @PostMapping("/models/custom")
    public AgentResponse createCustomModel(@RequestBody Map<String, String> body, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) return AgentResponse.error("NOT_LOGGED_IN");
        if (userLlmModelService == null) return AgentResponse.error("UserLlmModelService not available");
        String userId = user.getName() != null ? user.getName() : "anonymous";
        String name = body.get("name");
        String modelName = body.get("modelName");
        String endpoint = body.get("endpoint");
        if (name == null || name.trim().isEmpty()) return AgentResponse.error("模型名称不能为空");
        if (modelName == null || modelName.trim().isEmpty()) return AgentResponse.error("模型标识(modelName)不能为空");
        if (endpoint == null || endpoint.trim().isEmpty()) return AgentResponse.error("接口地址(endpoint)不能为空");
        String tenantId = null;
        com.DocSystem.agent.learning.entity.UserCustomLlmModel m = userLlmModelService.create(
                userId, tenantId, name.trim(), modelName.trim(), endpoint.trim(),
                body.get("apiKey"), body.get("settings"));
        if (m == null) return AgentResponse.error("创建失败");
        Map<String, Object> data = new HashMap<>();
        data.put("id", m.getId());
        data.put("selector", "user:" + m.getId());
        return AgentResponse.ok("模型已添加").withData(data);
    }

    /** 更新用户自定义模型。Body: {name, modelName, endpoint, apiKey?, settings?}；apiKey 留空则保留原值。 */
    @PostMapping("/models/custom/{id}")
    public AgentResponse updateCustomModel(@PathVariable("id") Long id,
            @RequestBody Map<String, String> body, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) return AgentResponse.error("NOT_LOGGED_IN");
        if (userLlmModelService == null) return AgentResponse.error("UserLlmModelService not available");
        String userId = user.getName() != null ? user.getName() : "anonymous";
        com.DocSystem.agent.learning.entity.UserCustomLlmModel m = userLlmModelService.update(
                id, userId, body.get("name"), body.get("modelName"), body.get("endpoint"),
                body.get("apiKey"), body.get("settings"));
        if (m == null) return AgentResponse.error("模型不存在或无权限");
        return AgentResponse.ok("模型已更新");
    }

    /** 删除用户自定义模型。 */
    @DeleteMapping("/models/custom/{id}")
    public AgentResponse deleteCustomModel(@PathVariable("id") Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) return AgentResponse.error("NOT_LOGGED_IN");
        if (userLlmModelService == null) return AgentResponse.error("UserLlmModelService not available");
        String userId = user.getName() != null ? user.getName() : "anonymous";
        boolean ok = userLlmModelService.delete(id, userId);
        return ok ? AgentResponse.ok("模型已删除") : AgentResponse.error("模型不存在或无权限");
    }

    /**
     * Confirm or reject a pending operation.
     * POST /api/agent/confirm
     *
     * Per D-13: SSE confirmation flow — frontend sends approval/rejection here.
     *
     * Body: { "confirmToken": "xxx", "action": "approve|reject" }
     */
    @PostMapping("/confirm")
    public AgentResponse confirmOperation(@RequestBody Map<String, String> body) {
        String confirmToken = body.get("confirmToken");
        String action = body.get("action");  // "approve" or "reject"

        if (confirmToken == null || confirmToken.isEmpty()) {
            return AgentResponse.error("confirmToken is required");
        }
        if (action == null || action.isEmpty()) {
            return AgentResponse.error("action is required (approve or reject)");
        }

        // Verify the confirmToken exists and is pending
        if (auditLogService == null) {
            return AgentResponse.error("AuditLogService not available");
        }
        AuditLogEntity entry = auditLogService.getPendingEntry(confirmToken);
        if (entry == null) {
            return AgentResponse.error("Invalid or expired confirmToken");
        }

        // Store the result for SSE to pick up
        if ("reject".equalsIgnoreCase(action) || "cancel".equalsIgnoreCase(action)) {
            auditLogService.reject(confirmToken);
            Map<String, Object> rejectData = new HashMap<>();
            rejectData.put("confirmToken", confirmToken);
            rejectData.put("action", "rejected");
            return AgentResponse.ok("Operation cancelled").withData(rejectData);
        } else if ("approve".equalsIgnoreCase(action)) {
            auditLogService.approve(confirmToken, "Approved by user");
            Map<String, Object> approveData = new HashMap<>();
            approveData.put("confirmToken", confirmToken);
            approveData.put("action", "approved");
            return AgentResponse.ok("Operation approved").withData(approveData);
        } else {
            return AgentResponse.error("Invalid action. Use 'approve' or 'reject'");
        }
    }

    /**
     * Debug endpoint to check DocSysClient state.
     * Requires X-API-Key header matching DOCSYS_API_KEY.
     * Never exposes session cookie in response.
     */
    @GetMapping("/debug/client")
    public AgentResponse debugClient(
            @RequestHeader(value = "X-API-Key", required = false) String apiKeyHeader,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate API key
        if (!validateApiKeyHeader(apiKeyHeader, authHeader)) {
            return AgentResponse.error("Unauthorized: invalid or missing X-API-Key");
        }

        Map<String, Object> debug = new HashMap<>();
        debug.put("isLoggedIn", docSysClient.isLoggedIn());
        debug.put("currentUsername", docSysClient.getCurrentUsername());
        debug.put("baseUrl", docSysClient.getBaseUrl());
        // SECURITY: Never expose sessionCookie to API clients
        return AgentResponse.ok(debug);
    }

    /**
     * Validate API key from X-API-Key header or Authorization: Bearer header.
     * Returns true if valid, false otherwise.
     */
    private boolean validateApiKeyHeader(String apiKeyHeader, String authHeader) {
        String expected = appApiKey;
        // Fall back to .env widget key if application.yml key is not set
        if ((expected == null || expected.trim().isEmpty())) {
            expected = envConfig.loadWidgetKey().orElse(null);
        }
        if (expected == null || expected.trim().isEmpty()) {
            return false;
        }
        String provided = apiKeyHeader;
        if (provided == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            provided = authHeader.substring("Bearer ".length());
        }
        return expected.equals(provided);
    }

    /**
     * SSE Streaming endpoint for real-time AI responses
     * GET  /api/agent/stream?command=xxx&amp;sessionId=xxx&amp;modelId=xxx   （旧入口，兼容 ui.html / chat-widget.js）
     * POST /api/agent/stream  body: {"command":"...","sessionId":"...","modelId":"..."}（推荐入口，index.html 使用）
     *
     * Returns SSE stream:
     * - data: {"type":"start"}
     * - data: {"type":"chunk","content":"你"}
     * ...
     * - data: {"type":"done","fullContent":"..."}
     * - data: {"type":"error","message":"..."}
     *
     * ⚠️ GET 入口把整条命令放进 URL query，受 Tomcat 请求行上限约束（maxHttpHeaderSize 默认 8192 字节，
     * 本工程 Connector 未调整）：ASCII 约 7800 字、中文（encodeURIComponent 后 ×9）约 870 字即被 Tomcat 直接
     * 拒绝为 HTTP 400（实测：1000 汉字=9000 编码字符 → 400）。新前端一律用 POST 入口，无长度限制。
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestParam(name = "command") String commandRaw,
            @RequestParam(name = "sessionId", required = false) String sessionId,
            @RequestParam(name = "modelId", required = false) String modelId,
            HttpServletRequest request,
            HttpServletResponse response) {
        return streamInternal(decodeQueryParam(commandRaw), sessionId, modelId, request, response, null, null, null);
    }

    /**
     * SSE 流式端点（POST + JSON body）—— 前端推荐入口。
     * body 复用 ExecuteRequest：command / sessionId / modelId；UTF-8 由 Jackson 解码，
     * 因此不需要 GET 入口那段 ISO-8859-1 → UTF-8 修复。
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPost(
            @RequestBody ExecuteRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (body == null || body.getCommand() == null || body.getCommand().trim().isEmpty()) {
            return immediateSseError("EMPTY_COMMAND");
        }
        // P1：「/」操作白名单校验（非法 → 400，避免前端伪造指令语义）
        String operation = null;
        if (body.getOperation() != null && !body.getOperation().trim().isEmpty()) {
            operation = AgentFocusSupport.normalizeOperation(body.getOperation());
            if (operation == null) {
                log.warn("invalid operation from client: '{}'", body.getOperation());
                try {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"type\":\"error\",\"message\":"
                            + escapeJson("非法的操作: " + body.getOperation()) + "}");
                } catch (Exception ignored) {}
                return null;
            }
        }
        // P1：「@」关注对象形状校验 / 去重（D8）/ 上限（D6）
        // 可见性校验放在后台线程做，避免阻塞 SSE 首个字节
        AgentFocusSupport.SanitizeResult sanitized = AgentFocusSupport.sanitize(body.getFocus());
        if (sanitized.droppedTotal() > 0) {
            log.info("focus sanitize: kept={}, droppedInvalid={}, droppedOverflow={}",
                    sanitized.items.size(), sanitized.droppedInvalid, sanitized.droppedOverflow);
        }
        return streamInternal(body.getCommand(), body.getSessionId(), body.getModelId(),
                request, response, operation, sanitized.items, body.getAttachments());
    }

    /**
     * GET query 参数的中文修复：Tomcat 默认按 ISO-8859-1 解码 URL query（未配 URIEncoding=UTF-8），
     * 与 DocSystem 一致地重解码为 UTF-8（见 BaseFunction/DocController 的同类处理）。
     */ 
    private String decodeQueryParam(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return new String(raw.getBytes("ISO8859-1"), "UTF-8");
        } catch (java.io.UnsupportedEncodingException e) {
            return raw; // 保底：编码不支持时用原值
        }
    }

    /** P2：附件引用（前端只传 id/name；size/mime 由服务端从临时文件读） */
    public static class AttachmentRef {
        private String id;
        private String name;
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    /**
     * 参数校验失败时快速返回一个只发 error 事件并立即结束的 SSE
     */    private SseEmitter immediateSseError(String message) {
        SseEmitter emitter = new SseEmitter(5000L);
        try {
            emitter.send(SseEmitter.event()
                .data("{\"type\":\"error\",\"message\":" + escapeJson(message) + "}", MediaType.TEXT_PLAIN));
            emitter.complete();
        } catch (Exception ignored) {}
        return emitter;
    }

    /**
     * P1：校验「@」关注对象的可见性 —— 剔除当前用户不可见的仓库；
     * fail-open：校验过程出错时保留原对象（避免因瞬时故障丢失用户上下文）。
     * dir/file 的路径存在性由工具层兜底（不额外发请求，控制延迟）。
     */
    private List<AgentFocusSupport.FocusItem> verifyFocusItems(
            List<AgentFocusSupport.FocusItem> items, String jsessionid) {
        if (items == null || items.isEmpty()) {
            return items;
        }
        try {
            DocSysClient client = getSessionClient(jsessionid);
            Map<String, Object> resp = client.getReposList();
            if (resp == null) {
                return items;
            }
            Object data = resp.get("data");
            if (!(data instanceof List)) {
                return items;
            }
            Set<Integer> visible = new java.util.HashSet<Integer>();
            for (Object one : (List<?>) data) {
                if (!(one instanceof Map)) {
                    continue;
                }
                Object id = ((Map<?, ?>) one).get("id");
                if (id instanceof Number) {
                    visible.add(((Number) id).intValue());
                } else if (id != null) {
                    try {
                        visible.add(Integer.valueOf(String.valueOf(id)));
                    } catch (NumberFormatException ignored) {}
                }
            }
            if (visible.isEmpty()) {
                return items;   // 拿不到可见仓库列表 → fail-open
            }
            List<AgentFocusSupport.FocusItem> kept = new ArrayList<AgentFocusSupport.FocusItem>();
            for (AgentFocusSupport.FocusItem it : items) {
                if (it.getVid() != null && visible.contains(it.getVid())) {
                    kept.add(it);
                }
            }
            return kept;
        } catch (Exception e) {
            log.warn("verifyFocusItems failed, keep all focus items: {}", e.getMessage());
            return items;
        }
    }

    /**
     * P2：校验本轮附件 —— 只认<b>该会话临时目录里真实存在</b>的文件（前端传的 id/name 均会安全化）。
     * 不存在的条目直接丢弃（调用方据此发 notice），不报错；数量上限 {@code MAX_ATTACHMENTS}。
     */
    private List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> verifyAttachments(
            List<AttachmentRef> refs, String userId, String sessionId) {
        List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> out =
                new ArrayList<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item>();
        if (refs == null || refs.isEmpty()) {
            return out;
        }
        java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                userId, attachSessionKey(sessionId), false);
        Set<String> seen = new java.util.HashSet<String>();
        for (AttachmentRef ref : refs) {
            if (out.size() >= com.DocSystem.agent.attachment.AgentAttachmentSupport.MAX_ATTACHMENTS) {
                break;
            }
            if (ref == null) {
                continue;
            }
            String rawId = ref.getId() != null ? ref.getId() : ref.getName();
            java.io.File f = com.DocSystem.agent.attachment.AgentAttachmentSupport.resolve(dir, rawId);
            if (f == null) {
                continue;
            }
            String safe = com.DocSystem.agent.attachment.AgentAttachmentSupport.sanitizeName(f.getName());
            if (safe == null || !seen.add(safe)) {
                continue;
            }
            out.add(new com.DocSystem.agent.attachment.AgentAttachmentSupport.Item(safe, safe, f.length()));
        }
        return out;
    }

    /** 附件会话目录键：sessionId 为空时用 default（与工具层/附件包同一规则） */
    private static String attachSessionKey(String sessionId) {
        return com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionKey(sessionId);
    }

    /** 渲染附件行（注入块用；无附件时返回空列表） */
    private List<String> renderAttachmentLines(
            List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> items) {
        List<String> lines = new ArrayList<String>();
        if (items == null || items.isEmpty()) {
            return lines;
        }
        // 多模态未接线（设计方案 §14.8）：本轮图片对模型不可见 → 走「无视觉能力」文案。
        // 接线后改为传 `resolvedLlm != null && resolvedLlm.supportsVision`（必须先真的把图片送达模型）。
        String rendered = com.DocSystem.agent.attachment.AgentAttachmentSupport.renderLines(items, false);
        if (rendered.isEmpty()) {
            return lines;
        }
        String[] parts = rendered.split("\n");
        for (String p : parts) {
            if (!p.isEmpty()) {
                lines.add(p + "\n");
            }
        }
        return lines;
    }

    /** SSE 流式的公共实现（GET / POST 共用）；command 已按各自编码方式正确解码，供后续 lambda 引用 */
    private SseEmitter streamInternal(
            final String command,
            final String sessionId,
            final String modelId,
            HttpServletRequest request,
            HttpServletResponse response,
            final String operation,
            final List<AgentFocusSupport.FocusItem> focusItems,
            final List<AttachmentRef> attachmentRefs) {

        // Prevent browser buffering for real-time streaming
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

        // SSE concurrent connection limit per IP
        String clientIp = resolveClientIp(request);
        if (rateLimitService != null && !rateLimitService.tryAcquireSseSlot(clientIp)) {
            log.warn("SSE concurrent limit exceeded for IP={}, max={}", clientIp, rateLimitService.getSseMaxConcurrentPerIp());
            try {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"type\":\"error\",\"message\":\"Too many concurrent SSE connections. Maximum " +
                    rateLimitService.getSseMaxConcurrentPerIp() + " per IP.\"}");
            } catch (Exception ignored) {}
            return null;
        }

        final String capturedClientIp = clientIp;

        // ===== 认证：在请求线程内解析当前用户（后台线程不能再访问 request）=====
        User user = currentUser(request);
        if (user == null) {
            SseEmitter authEmitter = new SseEmitter(5000L);
            try {
                authEmitter.send(SseEmitter.event()
                    .data("{\"type\":\"error\",\"message\":\"NOT_LOGGED_IN\"}", MediaType.TEXT_PLAIN));
                authEmitter.complete();
            } catch (Exception ignored) {}
            if (rateLimitService != null) rateLimitService.releaseSseSlot(capturedClientIp);
            return authEmitter;
        }
        final String capturedUsername = user.getName();
        final String capturedJsessionid = request.getSession().getId();
        // 解析用户选定的模型（在请求线程内解析，后台线程仅用值）；解析器不访问 request
        final String capturedUserId = user.getName() != null ? user.getName() : "anonymous";
        final com.DocSystem.agent.llm.ResolvedLlmConfig resolvedLlm =
                (userLlmModelService != null) ? userLlmModelService.resolve(modelId, capturedUserId) : null;

        log.info("SSE stream: command='{}', user={}, ip={}", command, capturedUsername, clientIp);

        SseEmitter emitter = new SseEmitter(sseTimeoutSeconds * 1000L); // configurable timeout

        // T8.5.2：流式请求 requestId（供 step 审计/日志串联；后台线程是独立线程，MDC 不继承，
        // 故在后台线程内 put/remove，让 [ToolUseLoop][STEP] 日志带 requestId 关联一次请求）
        final String streamRequestId = java.util.UUID.randomUUID().toString();

        streamingExecutor.execute(() -> {
            MDC.put("requestId", streamRequestId);
            log.info("SSE stream started for command: {}", command);
            try {
                emitter.send(SseEmitter.event()
                    .data("{\"type\":\"start\"}", MediaType.TEXT_PLAIN));

                // ===== P1：「@」关注对象 + 「/」操作 =====
                // 1) 可见性校验（剔除无权限/已不存在的仓库）
                // 2) 渲染「本轮关注对象/操作/约束」并注入用户消息（仅本轮有效；同时随会话历史落库，续接可用）
                String focusNotice = null;
                List<AgentFocusSupport.FocusItem> verifiedFocus = focusItems;
                if (focusItems != null && !focusItems.isEmpty()) {
                    verifiedFocus = verifyFocusItems(focusItems, capturedJsessionid);
                    int dropped = focusItems.size() - verifiedFocus.size();
                    if (dropped > 0) {
                        focusNotice = "已忽略 " + dropped + " 个无权限或已不存在的关注对象";
                    }
                }
                String userText = command;
                if (command != null && command.toLowerCase().trim().startsWith("chat ")) {
                    userText = command.substring(5).trim();
                }
                // ===== P2：本轮附件（临时文件，非仓库；只认会话目录里真实存在的）=====
                List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> attachmentItems =
                        verifyAttachments(attachmentRefs, capturedUserId, sessionId);
                String attachNotice = null;
                if (attachmentRefs != null && attachmentRefs.size() > attachmentItems.size()) {
                    attachNotice = "已忽略 " + (attachmentRefs.size() - attachmentItems.size())
                            + " 个不存在或已过期的附件";
                }
                String notice = focusNotice;
                if (attachNotice != null) {
                    notice = (notice == null ? "" : notice + "；") + attachNotice;
                }
                List<String> attachLines = renderAttachmentLines(attachmentItems);
                final String focusCommand = AgentFocusSupport.buildUserMessage(userText, verifiedFocus,
                        operation, notice, attachLines);
                if (focusNotice != null) {
                    sendSse(emitter, "{\"type\":\"notice\",\"message\":" + escapeJson(focusNotice) + "}");
                }
                if (attachNotice != null) {
                    sendSse(emitter, "{\"type\":\"notice\",\"message\":" + escapeJson(attachNotice) + "}");
                }
                if (operation != null || (verifiedFocus != null && !verifiedFocus.isEmpty())) {
                    log.info("focus: operation={}, items={}, kept={}", operation,
                            focusItems != null ? focusItems.size() : 0,
                            verifiedFocus != null ? verifiedFocus.size() : 0);
                }
                if (!attachmentItems.isEmpty()) {
                    log.info("attachments: requested={}, kept={}",
                            attachmentRefs != null ? attachmentRefs.size() : 0, attachmentItems.size());
                }

                String lowerCmd = command.toLowerCase().trim();
                boolean isAiChat = lowerCmd.startsWith("chat ") ||
                                   lowerCmd.startsWith("问") ||
                                   lowerCmd.startsWith("关于") ||
                                   lowerCmd.equals("chat");
                // These commands are NOT AI chat — route to SubAgent CLI handlers instead
                boolean isCliCommand = lowerCmd.equals("banner") || lowerCmd.equals("status") ||
                                       lowerCmd.equals("help") || lowerCmd.equals("config") ||
                                       lowerCmd.startsWith("help-") || lowerCmd.startsWith("list-") ||
                                       lowerCmd.startsWith("search ") || lowerCmd.startsWith("create-") ||
                                       lowerCmd.startsWith("delete-") || lowerCmd.startsWith("get-") ||
                                       lowerCmd.startsWith("download-") || lowerCmd.startsWith("upload-") ||
                                       lowerCmd.startsWith("move-") || lowerCmd.startsWith("copy-") ||
                                       lowerCmd.startsWith("rename-") || lowerCmd.startsWith("lock-") ||
                                       lowerCmd.startsWith("unlock-") || lowerCmd.startsWith("repos-") ||
                                       lowerCmd.equals("login") || lowerCmd.equals("logout") ||
                                       lowerCmd.equals("whoami") || lowerCmd.equals("models") ||
                                       lowerCmd.startsWith("chat-with-docs") || lowerCmd.equals("ai-models");

                if (isAiChat && !isCliCommand && llmService != null) {
                    String message = focusCommand;

                    String effectiveSession = sessionId != null ? sessionId : "stream-" + System.currentTimeMillis();
                    StringBuilder fullContent = new StringBuilder();
                    StringBuilder reasoningAccum = new StringBuilder();

                    try {
                        // 构建消息列表（T7.1.1）：软化 system + DB 历史（最近 20 条 user/assistant）+ 当前消息
                        List<Map<String, String>> chatMessages = new ArrayList<>();
                        Map<String, String> sysMsg = new HashMap<>();
                        sysMsg.put("role", "system");
                        sysMsg.put("content", "DocSys document management context: help users with documents, " +
                                "repositories, and related tasks. Be concise and helpful. " +
                                "You do not know what model or architecture you run on — " +
                                "if asked, say you are an assistant in DocSys and focus on the user's needs.");
                        chatMessages.add(sysMsg);
                        if (conversationHistoryService != null) {
                            List<com.DocSystem.agent.session.SessionMessageEntity> history =
                                    conversationHistoryService.getHistory(effectiveSession);
                            if (history != null && !history.isEmpty()) {
                                int start = Math.max(0, history.size() - 20);
                                for (int i = start; i < history.size(); i++) {
                                    com.DocSystem.agent.session.SessionMessageEntity m = history.get(i);
                                    String role = m.getRole();
                                    if (!"user".equals(role) && !"assistant".equals(role)) continue;
                                    Map<String, String> histMsg = new HashMap<>();
                                    histMsg.put("role", role);
                                    histMsg.put("content", m.getContent() != null ? m.getContent() : "");
                                    chatMessages.add(histMsg);
                                }
                            }
                        }
                        Map<String, String> chatUserMsg = new HashMap<>();
                        chatUserMsg.put("role", "user");
                        chatUserMsg.put("content", message);
                        chatMessages.add(chatUserMsg);

                        // 真流式 + reasoning 分离（T7.1.2）
                        Iterator<com.DocSystem.agent.llm.StreamChunk> chunks =
                                llmService.streamChatChunks(chatMessages, resolvedLlm);
                        while (chunks.hasNext()) {
                            com.DocSystem.agent.llm.StreamChunk chunk = chunks.next();
                            if (chunk.isDone()) break;
                            if (chunk.isReasoning()) {
                                reasoningAccum.append(chunk.content);
                                emitter.send(SseEmitter.event()
                                    .data("{\"type\":\"reasoning\",\"content\":" + escapeJson(chunk.content) + "}", MediaType.TEXT_PLAIN));
                            } else if (chunk.isText()) {
                                fullContent.append(chunk.content);
                                emitter.send(SseEmitter.event()
                                    .data("{\"type\":\"text\",\"content\":" + escapeJson(chunk.content) + "}", MediaType.TEXT_PLAIN));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("isAiChat streaming failed: {}", e.getMessage());
                        emitter.send(SseEmitter.event()
                            .data("{\"type\":\"error\",\"message\":" + escapeJson("AI 流式响应失败: " + e.getMessage()) + "}", MediaType.TEXT_PLAIN));
                        emitter.complete();
                        return;
                    }

                    emitter.send(SseEmitter.event()
                        .data("{\"type\":\"done\",\"fullContent\":" + escapeJson(fullContent.toString()) + "}", MediaType.TEXT_PLAIN));

                    // T5.2a 会话历史持久化（关页面后可续接；T7.3 含 reasoning）
                    if (conversationHistoryService != null) {
                        conversationHistoryService.saveExchange(effectiveSession, message,
                                fullContent.toString(), reasoningAccum.toString());
                    }

                } else {
                    // Non-AI command: execute and stream result
                    // ===== ToolUseLoop：全局开启时走工具推理（SSE 真流式 + 确认推送） =====
                    if (toolLoopEnabled && llmService != null) {
                        try {
                            StreamingLoopOutcome outcome = runToolLoopStreamingWithSse(
                                    focusCommand, capturedUsername, capturedJsessionid, sessionId, resolvedLlm, emitter);
                            if (outcome != null && outcome.response != null) {
                                AgentResponse toolResp = outcome.response;
                                String responseText = toolResp.isSuccess()
                                        ? toolResp.getMessage() : "错误: " + toolResp.getMessage();
                                // 最终回答已逐分片按 {type:text} 推送；done 事件携带完整内容 + 元数据收尾
                                String meta = toolResp.getMetadata() != null
                                        ? JSON.toJSONString(toolResp.getMetadata()) : "{}";
                                sendSse(emitter, "{\"type\":\"done\",\"fullContent\":" + escapeJson(responseText) +
                                        ",\"meta\":" + meta + "}");
                                // T5.2a 会话历史持久化（T7.3 含 reasoning）
                                if (conversationHistoryService != null) {
                                    conversationHistoryService.saveExchange(
                                            sessionId != null ? sessionId : capturedJsessionid,
                                            focusCommand, responseText, outcome.reasoning);
                                }
                                emitter.complete();
                                return;
                            }
                            // null → 回退旧路径
                            log.warn("ToolUseLoop SSE path returned null, falling back to legacy");
                            com.DocSystem.agent.orchestrator.MainAgent.markToolLoopAttempted();
                        } catch (Exception ex) {
                            log.warn("ToolUseLoop SSE path failed, falling back to legacy: {}", ex.getMessage());
                            com.DocSystem.agent.orchestrator.MainAgent.markToolLoopAttempted();
                        }
                    }

                    // Per D-12, D-13: Write operations require SSE confirmation
                    lowerCmd = command.toLowerCase().trim();
                    String operationType = extractOperationType(lowerCmd);
                    boolean isWriteOp = auditLogService != null && auditLogService.isWriteOperation(operationType);

                    if (isWriteOp) {
                        // Per D-13: Emit SSE confirm event and wait for user approval
                        String confirmToken = UUID.randomUUID().toString();
                        String userId = capturedUsername;
                        String effectiveSession = capturedJsessionid;
                        String traceId = MDC.get("traceId");

                        // Build params for audit log
                        Map<String, String> params = new HashMap<>();
                        params.put("command", command);
                        params.put("operation", operationType);

                        auditLogService.createPendingEntry(userId, effectiveSession, operationType,
                                params, capturedClientIp, traceId);

                        // Emit SSE confirm event (per D-13: SSE pause + frontend confirm dialog)
                        String confirmMessage = buildConfirmMessage(operationType, command);
                        emitter.send(SseEmitter.event()
                            .data("{\"type\":\"confirm\",\"confirmToken\":\"" + confirmToken +
                                  "\",\"operation\":\"" + operationType +
                                  "\",\"message\":" + escapeJson(confirmMessage) + "}", MediaType.TEXT_PLAIN));

                        // Wait for confirmation (poll with timeout)
                        boolean approved = waitForConfirmation(confirmToken, 120, TimeUnit.SECONDS);
                        if (!approved) {
                            emitter.send(SseEmitter.event()
                                .data("{\"type\":\"error\",\"message\":\"Confirmation timeout or rejected\"}", MediaType.TEXT_PLAIN));
                            emitter.complete();
                            return;
                        }
                        log.info("User confirmed write operation: confirmToken={}, operation={}",
                                confirmToken, operationType);
                    }

                    AgentResponse result;
                    try {
                        result = runCommand(command, capturedUsername, capturedJsessionid);
                    } catch (Exception ex) {
                        log.error("executeInternal failed", ex);
                        emitter.send(SseEmitter.event()
                            .data("{\"type\":\"error\",\"message\":" + escapeJson("执行失败: " + ex.getMessage()) + "}", MediaType.TEXT_PLAIN));
                        emitter.complete();
                        return;
                    }

                    // Mark operation completed in audit log
                    if (isWriteOp) {
                        String resultMessage = result.isSuccess() ? "Completed successfully" : result.getMessage();
                        if (result.isSuccess()) {
                            auditLogService.markCompleted(operationType, resultMessage);
                        } else {
                            auditLogService.markFailed(operationType, resultMessage);
                        }
                    }

                    String responseText = result.isSuccess() ? result.getMessage() : "错误: " + result.getMessage();

                    // Stream in small chunks
                    int chunkSize = 5;
                    for (int i = 0; i < responseText.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, responseText.length());
                        String part = responseText.substring(i, end);
                        emitter.send(SseEmitter.event()
                            .data("{\"type\":\"chunk\",\"content\":" + escapeJson(part) + "}", MediaType.TEXT_PLAIN));
                        if (i + chunkSize < responseText.length()) {
                            Thread.sleep(15); // typing effect delay
                        }
                    }

                    emitter.send(SseEmitter.event()
                        .data("{\"type\":\"done\",\"fullContent\":" + escapeJson(responseText) + "}", MediaType.TEXT_PLAIN));

                    // T5.2a 会话历史持久化（legacy 路径）
                    if (conversationHistoryService != null) {
                        conversationHistoryService.saveExchange(
                                sessionId != null ? sessionId : capturedJsessionid,
                                command, responseText);
                    }
                }

                emitter.complete();

            } catch (Exception e) {
                log.error("SSE stream error", e);
                try {
                    emitter.send(SseEmitter.event()
                        .data("{\"type\":\"error\",\"message\":" + escapeJson(e.getMessage()) + "}", MediaType.TEXT_PLAIN));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            } finally {
                MDC.remove("requestId");
            }
        });

        emitter.onCompletion(() -> {
            log.debug("SSE stream completed");
            if (rateLimitService != null) rateLimitService.releaseSseSlot(capturedClientIp);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE stream timeout");
            if (rateLimitService != null) rateLimitService.releaseSseSlot(capturedClientIp);
        });

        // Note: SseEmitter.onError() not available in Spring 4.x

        return emitter;
    }

    private String escapeJson(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t") + "\"";
    }

    /**
     * List available commands/skills
     * Returns all registered skills, filtered by visibility for authenticated users.
     * Normal users only see their own skills (PRIVATE with creator match).
     * Admin users see all skills.
     */
    @GetMapping("/skills")
    public AgentResponse listSkills(HttpServletRequest request) {
        Collection<Skill> skillsCollection = SkillManager.getInstance().getAllSkills();
        List<Skill> skills = new java.util.ArrayList<>(skillsCollection);
        List<Map<String, Object>> result = new java.util.ArrayList<Map<String, Object>>();

        // Get visible skill IDs for this user
        java.util.Set<String> visibleSkillIds = new java.util.HashSet<>();
        String currentUserId = "anonymous";
        String currentTenantId = null;

        User user = currentUser(request);
        if (user != null) {
            currentUserId = user.getName() != null ? user.getName() : "anonymous";

            // Admin can see all skills
            boolean isAdmin = skillMetadataService != null && skillMetadataService.isAdmin(currentUserId, currentTenantId);
            if (isAdmin) {
                // Admin sees all skills, no filtering needed
                visibleSkillIds = null; // null means no filter
            } else if (skillMetadataService != null) {
                // Normal user: get visible skills from metadata
                try {
                    List<SkillMetadata> visibleMetadata = skillMetadataService.getVisibleSkills(currentUserId, currentTenantId);
                    for (SkillMetadata meta : visibleMetadata) {
                        visibleSkillIds.add(meta.getSkillId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to get visible skills, defaulting to empty", e);
                }
            }
        }

        // Build result with visibility filtering
        for (Skill skill : skills) {
            // Skip skills not visible to current user (except for admins)
            if (visibleSkillIds != null && !visibleSkillIds.isEmpty() && !visibleSkillIds.contains(skill.getId())) {
                continue;
            }

            Map<String, Object> skillMap = new java.util.HashMap<String, Object>();
            skillMap.put("id", skill.getId());
            skillMap.put("name", skill.getName());
            skillMap.put("description", skill.getDescription());
            skillMap.put("category", skill.getCategory());
            skillMap.put("permission", skill.getPermission());
            result.add(skillMap);
        }

        // 按类别分组
        Map<String, Object> grouped = new java.util.HashMap<String, Object>();
        Map<String, List<Map<String, Object>>> categories = new java.util.HashMap<String, List<Map<String, Object>>>();

        for (Map<String, Object> skill : result) {
            String cat = (String) skill.get("category");
            categories.computeIfAbsent(cat, k -> new java.util.ArrayList<Map<String, Object>>()).add(skill);
        }
        grouped.put("skills", result);
        grouped.put("grouped", categories);
        grouped.put("total", result.size());
        grouped.put("userId", currentUserId);

        return AgentResponse.ok(grouped);
    }

    /**
     * 上传并安装技能包（支持 zip 或文件夹）
     * agentskills.io 规范要求：
     * - skill.md (必需): 技能定义，含 YAML frontmatter
     * - agent.md (可选): Agent 行为定义
     * - .permissions (可选): 权限要求
     */
    @PostMapping("/skills/upload")
    public AgentResponse uploadSkill(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "skillId", required = false) String providedSkillId,
            @RequestParam(value = "visibility", required = false, defaultValue = "PRIVATE") String visibility,
            HttpServletRequest request) {
        try {
            User currentUser = currentUser(request);
            if (currentUser == null) {
                return AgentResponse.error("NOT_LOGGED_IN");
            }
            if (file.isEmpty()) {
                return AgentResponse.error("文件不能为空");
            }

            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                fileName = "upload_" + System.currentTimeMillis();
            }

            // SECURITY: Validate provided skillId against path traversal
            String skillId = providedSkillId;
            if (skillId != null) {
                skillId = skillId.trim();
                if (skillId.contains("..") || skillId.contains("/") || skillId.contains("\\")
                        || skillId.matches(".*\\p{javaWhitespace}.*") || skillId.isEmpty()) {
                    return AgentResponse.error("Invalid skillId: path traversal or whitespace not allowed");
                }
                // Additional normalization check
                if (java.nio.file.Paths.get("/tmp", skillId).normalize().startsWith("/tmp/..")) {
                    return AgentResponse.error("Invalid skillId: path traversal detected");
                }
            }

            // 确定技能安装目录
            String userDir = System.getProperty("user.dir");
            Path skillsInstallDir = Paths.get(userDir, "skills");
            Files.createDirectories(skillsInstallDir);

            // 解压或直接读取
            Path skillPath;

            if (fileName.toLowerCase().endsWith(".zip")) {
                // SECURITY: Enforce max ZIP size (50MB)
                final long MAX_ZIP_SIZE = 50 * 1024 * 1024;
                if (file.getSize() > MAX_ZIP_SIZE) {
                    return AgentResponse.error("ZIP file too large. Maximum size is 50MB.");
                }

                // SECURITY: Allowed file extensions in ZIP (whitelist)
                Set<String> ALLOWED_EXTENSIONS = new java.util.HashSet<>(java.util.Arrays.asList(".md", ".permissions"));
                // Additionally allow files without extension (like "Makefile", "README")
                Set<String> ALLOWED_BASENAMES = new java.util.HashSet<>(java.util.Arrays.asList("skill", "agent", "README", "LICENSE", "Makefile"));

                Path zipPath = skillsInstallDir.resolve("temp_" + System.currentTimeMillis() + ".zip");
                Files.write(zipPath, file.getBytes());

                Path extractDir = skillsInstallDir.resolve("temp_extract_" + System.currentTimeMillis());
                Files.createDirectories(extractDir);

                long totalExtractedSize = 0;
                try (java.util.zip.ZipInputStream zis =
                        new java.util.zip.ZipInputStream(Files.newInputStream(zipPath))) {
                    java.util.zip.ZipEntry entry;
                    while ((entry = zis.getNextEntry()) != null) {
                        String entryName = entry.getName();

                        // SECURITY: Block path traversal in entry names
                        if (entryName.contains("..") || entryName.startsWith("/") || entryName.contains("\\")) {
                            Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                                try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                            });
                            Files.deleteIfExists(zipPath);
                            return AgentResponse.error("ZIP contains invalid path: " + entryName);
                        }

                        // SECURITY: Enforce per-entry size limits and total size
                        totalExtractedSize += entry.getCompressedSize();
                        if (totalExtractedSize > MAX_ZIP_SIZE) {
                            Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                                try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                            });
                            Files.deleteIfExists(zipPath);
                            return AgentResponse.error("ZIP contents exceed maximum size limit.");
                        }

                        // SECURITY: Whitelist file types — block executables and dangerous extensions
                        String lowerName = entryName.toLowerCase();
                        if (!entry.isDirectory()) {
                            boolean allowed = false;
                            if (lowerName.endsWith(".md") || lowerName.endsWith(".permissions")) {
                                allowed = true;
                            } else {
                                // Allow files without extension that are in the allowed basenames set
                                String basename = entryName.contains("/")
                                    ? entryName.substring(entryName.lastIndexOf('/') + 1)
                                    : entryName;
                                if (basename.equals(basename.toLowerCase()) &&
                                    (ALLOWED_BASENAMES.contains(basename) || !basename.contains("."))) {
                                    allowed = true;
                                }
                            }
                            if (!allowed) {
                                Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                                    try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                                });
                                Files.deleteIfExists(zipPath);
                                return AgentResponse.error("ZIP contains disallowed file type: " + entryName);
                            }
                        }

                        Path outPath = extractDir.resolve(entryName);
                        // SECURITY: Ensure resolved path is under extractDir (no traversal)
                        if (!outPath.normalize().startsWith(extractDir.normalize())) {
                            Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                                try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                            });
                            Files.deleteIfExists(zipPath);
                            return AgentResponse.error("ZIP contains path traversal entry: " + entryName);
                        }

                        if (entry.isDirectory()) {
                            Files.createDirectories(outPath);
                        } else {
                            Files.createDirectories(outPath.getParent());
                            Files.copy(zis, outPath);
                        }
                        zis.closeEntry();
                    }
                }
                Files.deleteIfExists(zipPath);

                // 查找 skill.md
                skillPath = findSkillMd(extractDir);
                if (skillPath == null) {
                    Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                    });
                    return AgentResponse.error("ZIP 中未找到 skill.md，不符合 agentskills.io 规范");
                }

                // Derive skillId from directory name if not provided
                if (skillId == null) {
                    skillId = skillPath.getParent().getFileName().toString();
                    // SECURITY: Validate derived skillId too
                    if (skillId.contains("..") || skillId.contains("/") || skillId.contains("\\")) {
                        Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                        });
                        return AgentResponse.error("Invalid skillId derived from ZIP contents");
                    }
                }

                // 移动到正式目录
                Path targetDir = skillsInstallDir.resolve(skillId);
                if (Files.exists(targetDir)) {
                    Files.walk(targetDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                    });
                }
                Files.move(skillPath.getParent(), targetDir);
                // Clean up extractDir contents that were NOT moved to targetDir.
                // Note: extractDir itself may no longer be accessible after the move
                // if it was the immediate parent of skillPath, so skip if not present.
                if (Files.exists(extractDir)) {
                    Files.walk(extractDir).sorted(java.util.Comparator.reverseOrder()).forEach(p -> {
                        if (!p.equals(targetDir)) {
                            try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                        }
                    });
                    Files.deleteIfExists(extractDir);
                }

            } else if (fileName.toLowerCase().endsWith(".md") || fileName.contains("skill")) {
                // 直接上传 skill.md - 从内容中提取 skill name/id
                if (skillId == null) {
                    String content = new String(file.getBytes());
                    skillId = extractSkillIdFromContent(content, fileName);
                }
                Path targetDir = skillsInstallDir.resolve(skillId);
                Files.createDirectories(targetDir);
                Path targetMd = targetDir.resolve("skill.md");
                Files.write(targetMd, file.getBytes());
            } else {
                return AgentResponse.error("仅支持 .zip 技能包或 .md 技能定义文件");
            }

            // 重新加载技能
            SkillManager.getInstance().reloadSkills();
            EnhancedSkillManager.getInstance().reloadSkills();

            Skill skill = SkillManager.getInstance().getSkill(skillId);
            if (skill == null) {
                return AgentResponse.error("技能安装失败，无法加载: " + skillId);
            }

            // Save skill metadata for user-level isolation
            String creatorId = "anonymous";
            String creatorName = "Anonymous";
            boolean isAdminSkill = false;

            {
                creatorId = currentUser.getName() != null ? currentUser.getName() : "anonymous";
                creatorName = currentUser.getName() != null ? currentUser.getName() : "Anonymous";
                isAdminSkill = skillMetadataService != null && skillMetadataService.isAdmin(creatorId, null);

                // Validate visibility - normal users can only use PRIVATE
                if (!isAdminSkill && !"PRIVATE".equals(visibility)) {
                    visibility = "PRIVATE"; // Force to PRIVATE for non-admin users
                }
            }

            // Save metadata to database
            if (skillMetadataService != null) {
                try {
                    SkillMetadata metadata = SkillMetadata.builder()
                        .skillId(skillId)
                        .creatorId(creatorId)
                        .creatorName(creatorName)
                        .visibility(visibility)
                        .isAdminSkill(isAdminSkill)
                        .name(skill.getName())
                        .category(skill.getCategory())
                        .version("1.0.0")
                        .filePath(skillsInstallDir.resolve(skillId).toString())
                        .build();
                    skillMetadataService.saveMetadata(metadata);
                    log.info("Saved skill metadata: {} (visibility={}, creator={})", skillId, visibility, creatorId);
                } catch (Exception e) {
                    log.error("Failed to save skill metadata, continuing anyway", e);
                    // Don't fail the upload if metadata save fails
                }
            }

            log.info("Skill installed: {} from file: {}", skillId, fileName);
            Map<String, Object> skillInfo = new HashMap<>();
            skillInfo.put("id", skill.getId());
            skillInfo.put("name", skill.getName());
            skillInfo.put("category", skill.getCategory());
            skillInfo.put("description", skill.getDescription());
            Map<String, Object> installData = new HashMap<>();
            installData.put("skillId", skillId);
            installData.put("skill", skillInfo);
            installData.put("visibility", visibility);
            return AgentResponse.ok("技能 '" + skill.getName() + "' 安装成功").withData(installData);

        } catch (Exception e) {
            log.error("Skill upload failed", e);
            return AgentResponse.error("安装失败: " + e.getMessage());
        }
    }

    /**
     * 验证技能包是否符合 agentskills.io 规范（不解压，仅检查）
     */
    @PostMapping("/skills/validate")
    public AgentResponse validateSkill(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return AgentResponse.error("文件不能为空");
            }

            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            List<String> errors = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            Map<String, Object> info = new HashMap<>();

            info.put("fileName", fileName);
            info.put("fileSize", file.getSize());

            if (fileName.toLowerCase().endsWith(".zip")) {
                // 检查 zip 内容
                byte[] bytes = file.getBytes();
                Path tempZip = Files.createTempFile("skill_validate_", ".zip");
                Files.write(tempZip, bytes);

                try (java.util.zip.ZipInputStream zis =
                        new java.util.zip.ZipInputStream(Files.newInputStream(tempZip))) {
                    java.util.zip.ZipEntry entry;
                    boolean hasSkillMd = false;
                    boolean hasAgentMd = false;
                    boolean hasPermissions = false;

                    while ((entry = zis.getNextEntry()) != null) {
                        String name = entry.getName().toLowerCase();
                        if (name.endsWith("skill.md")) hasSkillMd = true;
                        if (name.endsWith("agent.md")) hasAgentMd = true;
                        if (name.endsWith(".permissions")) hasPermissions = true;
                        zis.closeEntry();
                    }

                    if (!hasSkillMd) {
                        errors.add("缺少必需文件: skill.md (agentskills.io 规范要求)");
                    }
                    if (!hasAgentMd) {
                        warnings.add("缺少可选文件: agent.md (建议包含 Agent 行为定义)");
                    }
                    if (!hasPermissions) {
                        warnings.add("缺少可选文件: .permissions (建议包含权限要求)");
                    }

                    info.put("hasSkillMd", hasSkillMd);
                    info.put("hasAgentMd", hasAgentMd);
                    info.put("hasPermissions", hasPermissions);
                } finally {
                    Files.deleteIfExists(tempZip);
                }
            } else if (fileName.toLowerCase().endsWith(".md")) {
                // 检查 skill.md 内容
                String content = new String(file.getBytes());
                if (!content.contains("---")) {
                    errors.add("skill.md 缺少 YAML frontmatter (--- 分隔符)");
                }
                if (!content.contains("name:")) {
                    errors.add("skill.md 缺少 name 字段");
                }
                if (!content.contains("description:")) {
                    warnings.add("skill.md 缺少 description 字段");
                }
            } else {
                errors.add("仅支持 .zip 技能包或 .md 技能定义文件");
            }

            boolean valid = errors.isEmpty();
            info.put("valid", valid);
            info.put("errors", errors);
            info.put("warnings", warnings);

            if (valid && !warnings.isEmpty()) {
                Map<String, Object> warnData = new HashMap<>();
                warnData.put("valid", true);
                warnData.put("info", info);
                warnData.put("warnings", warnings);
                return AgentResponse.ok("验证通过（有建议）").withData(warnData);
            } else if (valid) {
                Map<String, Object> validData = new HashMap<>();
                validData.put("valid", true);
                validData.put("info", info);
                return AgentResponse.ok("验证通过，符合 agentskills.io 规范").withData(validData);
            } else {
                Map<String, Object> errData = new HashMap<>();
                errData.put("valid", false);
                errData.put("info", info);
                errData.put("errors", errors);
                return AgentResponse.error("验证失败").withData(errData);
            }

        } catch (Exception e) {
            log.error("Skill validation failed", e);
            return AgentResponse.error("验证失败: " + e.getMessage());
        }
    }

    /**
     * 启用/禁用技能
     */
    @PostMapping("/skills/toggle")
    public AgentResponse toggleSkill(@RequestBody Map<String, Object> body) {
        String skillId = (String) body.get("skillId");
        Boolean enabled = (Boolean) body.get("enabled");

        if (skillId == null || skillId.isEmpty()) {
            return AgentResponse.error("skillId 不能为空");
        }

        // 持久化到 skills-enabled.json
        try {
            String userDir = System.getProperty("user.dir");
            Path enabledFile = Paths.get(userDir, "skills-enabled.json");
            Map<String, Boolean> enabledSkills = new HashMap<>();

            if (Files.exists(enabledFile)) {
                String json = new String(Files.readAllBytes(enabledFile));
                JSONObject jsonObj = JSON.parseObject(json);
                if (jsonObj != null) {
                    for (String key : jsonObj.keySet()) {
                        enabledSkills.put(key, jsonObj.getBooleanValue(key));
                    }
                }
            }

            enabledSkills.put(skillId, enabled != null ? enabled : true);
            Files.write(enabledFile, JSON.toJSONString(enabledSkills).getBytes(java.nio.charset.StandardCharsets.UTF_8));

            log.info("Skill {} toggled to {}", skillId, enabled);
            Map<String, Object> toggleData = new HashMap<>();
            toggleData.put("skillId", skillId);
            toggleData.put("enabled", enabled);
            return AgentResponse.ok("技能 '" + skillId + "' 已" + (Boolean.TRUE.equals(enabled) ? "启用" : "禁用"))
                .withData(toggleData);

        } catch (Exception e) {
            log.error("Toggle skill failed", e);
            return AgentResponse.error("操作失败: " + e.getMessage());
        }
    }

    /**
     * 获取已启用的技能列表
     */
    @GetMapping("/skills/enabled")
    public AgentResponse getEnabledSkills() {
        try {
            String userDir = System.getProperty("user.dir");
            Path enabledFile = Paths.get(userDir, "skills-enabled.json");
            Map<String, Boolean> enabledSkills = new HashMap<>();

            if (Files.exists(enabledFile)) {
                String json = new String(Files.readAllBytes(enabledFile));
                JSONObject jsonObj = JSON.parseObject(json);
                if (jsonObj != null) {
                    for (String key : jsonObj.keySet()) {
                        enabledSkills.put(key, jsonObj.getBooleanValue(key));
                    }
                }
            }
            return AgentResponse.ok(enabledSkills);
        } catch (Exception e) {
            return AgentResponse.ok(new HashMap<>());
        }
    }

    /**
     * 更新技能可见范围（仅管理员可用）
     */
    @PostMapping("/skills/visibility")
    public AgentResponse updateSkillVisibility(
            @RequestParam("skillId") String skillId,
            @RequestParam("visibility") String visibility,
            @RequestParam(value = "allowedUserIds", required = false) String allowedUserIds,
            HttpServletRequest request) {
        try {
            // Check if user is admin
            User user = currentUser(request);
            if (user == null) {
                return AgentResponse.error("NOT_LOGGED_IN");
            }
            String userId = user.getName() != null ? user.getName() : "anonymous";
            String tenantId = null;

            boolean isAdmin = skillMetadataService != null && skillMetadataService.isAdmin(userId, tenantId);
            if (!isAdmin) {
                return AgentResponse.error("权限不足：仅管理员可修改技能可见范围");
            }

            // Validate visibility value
            if (!"PRIVATE".equals(visibility) && !"TENANT".equals(visibility) && !"PUBLIC".equals(visibility)) {
                return AgentResponse.error("无效的可见范围，仅支持 PRIVATE/TENANT/PUBLIC");
            }

            // Update visibility
            skillMetadataService.updateVisibility(skillId, visibility, allowedUserIds, tenantId);

            log.info("Skill {} visibility updated to {} by admin {}", skillId, visibility, userId);
            Map<String, Object> visData = new HashMap<>();
            visData.put("skillId", skillId);
            visData.put("visibility", visibility);
            visData.put("allowedUserIds", allowedUserIds != null ? allowedUserIds : "");
            return AgentResponse.ok("技能可见范围已更新").withData(visData);
        } catch (Exception e) {
            log.error("Update skill visibility failed", e);
            return AgentResponse.error("更新失败: " + e.getMessage());
        }
    }

    /**
     * 获取技能元数据（可见范围、上传者等）
     */
    @GetMapping("/skills/metadata")
    public AgentResponse getSkillMetadata(@RequestParam("skillId") String skillId) {
        try {
            if (skillMetadataService == null) {
                return AgentResponse.error("技能元数据服务不可用");
            }
            SkillMetadata metadata = skillMetadataService.getMetadata(skillId);
            if (metadata == null) {
                return AgentResponse.error("技能不存在: " + skillId);
            }
            Map<String, Object> metaData = new HashMap<>();
            metaData.put("skillId", metadata.getSkillId());
            metaData.put("creatorId", metadata.getCreatorId() != null ? metadata.getCreatorId() : "");
            metaData.put("creatorName", metadata.getCreatorName() != null ? metadata.getCreatorName() : "");
            metaData.put("visibility", metadata.getVisibility() != null ? metadata.getVisibility() : "PRIVATE");
            metaData.put("allowedUserIds", metadata.getAllowedUserIds() != null ? metadata.getAllowedUserIds() : "");
            metaData.put("isAdminSkill", metadata.getIsAdminSkill() != null ? metadata.getIsAdminSkill() : false);
            metaData.put("name", metadata.getName() != null ? metadata.getName() : "");
            metaData.put("category", metadata.getCategory() != null ? metadata.getCategory() : "");
            return AgentResponse.ok(metaData);
        } catch (Exception e) {
            log.error("Get skill metadata failed", e);
            return AgentResponse.error("获取失败: " + e.getMessage());
        }
    }

    // ===== helpers =====
    private Path findSkillMd(Path dir) {
        try {
            return Files.walk(dir)
                .filter(p -> p.getFileName().toString().equalsIgnoreCase("skill.md"))
                .findFirst()
                .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractSkillIdFromContent(String content, String fileName) {
        // Try to extract name from YAML frontmatter first
        String[] lines = content.split("\n");
        boolean inFrontmatter = false;
        for (String line : lines) {
            if (line.trim().equals("---")) {
                if (!inFrontmatter) inFrontmatter = true;
                else break;
                continue;
            }
            if (inFrontmatter && line.trim().startsWith("name:")) {
                String name = line.substring(line.indexOf(':') + 1).trim();
                return name.toLowerCase().replaceAll("[^a-z0-9_-]", "_");
            }
        }
        // Fallback to filename-based
        return fileName.replaceAll("\\.(md|yaml|json)$", "").replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    /**
     * Simple intent extraction from command for metrics labeling.
     */
    private String extractIntent(String command) {
        if (command == null) return "unknown";
        String lower = command.toLowerCase().trim();
        if (lower.startsWith("list") || lower.contains("列出")) return "list";
        if (lower.startsWith("create") || lower.contains("创建")) return "create";
        if (lower.startsWith("delete") || lower.contains("删除")) return "delete";
        if (lower.startsWith("search") || lower.contains("搜索")) return "search";
        if (lower.startsWith("upload") || lower.contains("上传")) return "upload";
        if (lower.startsWith("chat") || lower.contains("聊天") || lower.contains("问")) return "chat";
        if (lower.startsWith("get") || lower.contains("获取")) return "get";
        return "other";
    }

    /**
     * Resolve client IP address, honoring X-Forwarded-For and X-Real-IP headers.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.trim().isEmpty()) {
            return xff.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.trim().isEmpty()) {
            return xri.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * 智能执行接口 - 支持 CLI 优先 + 可视化备选
     *
     * 参数:
     * - command: 执行命令
     * - mode: 执行模式 (cli/visual/auto)
     *   - cli: 仅 CLI
     *   - visual: 仅可视化
     *   - auto: 自动 (CLI 优先，失败则可视化)
     * - sessionId: 会话 ID
     *
     * 智能冗余策略:
     * 1. 默认使用 auto 模式
     * 2. 先尝试 CLI API (5秒超时)
     * 3. 如果 CLI 失败，自动切换到 Web 自动化
     * 4. 返回结果包含执行方式信息
     */
    @PostMapping("/executeSmart")
    public AgentResponse executeSmart(
            @RequestBody ExecuteSmartRequest request,
            HttpServletRequest servletRequest) {

        String command = request.getCommand();
        String mode = request.getMode();
        boolean visualFallback = request.isVisualFallback();

        log.info("executeSmart: command length={}, mode='{}', visualFallback={}",
            command != null ? command.length() : 0, mode, visualFallback);

        // 处理空命令
        if (command == null || command.isEmpty()) {
            return AgentResponse.error("Command is required");
        }

        // 认证：来自共享 HttpSession 的当前用户
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String username = user.getName();
        String jsessionid = servletRequest.getSession().getId();

        // 根据模式执行
        if ("visual".equals(mode)) {
            // 仅可视化模式
            return executeVisual(command, username, jsessionid);
        } else if ("cli".equals(mode)) {
            // 仅 CLI 模式
            return runCommand(command, username, jsessionid);
        } else {
            // 自动模式: CLI 优先 + 可视化备选
            return executeWithFallback(command, username, jsessionid);
        }
    }

    /**
     * CLI 优先 + 可视化备选执行
     */
    private AgentResponse executeWithFallback(String command, String username, String jsessionid) {
        long startTime = System.currentTimeMillis();

        // Step 1: 尝试 CLI (5秒超时)
        try {
            AgentResponse cliResponse = runCommand(command, username, jsessionid);
            long cliTime = System.currentTimeMillis() - startTime;

            if (cliResponse.isSuccess()) {
                log.info("CLI succeeded in {}ms", cliTime);
                // 添加执行方式标记
                cliResponse.setMessage(cliResponse.getMessage() + "\n[执行方式: CLI, 耗时: " + cliTime + "ms]");
                return cliResponse;
            }

            log.warn("CLI failed: {}. Trying visual...", cliResponse.getMessage());
        } catch (Exception e) {
            log.warn("CLI exception: {}. Trying visual...", e.getMessage());
        }

        // Step 2: CLI 失败，尝试可视化
        long visualStartTime = System.currentTimeMillis();
        try {
            AgentResponse visualResponse = executeVisual(command, username, jsessionid);
            long visualTime = System.currentTimeMillis() - visualStartTime;

            log.info("Visual succeeded in {}ms", visualTime);
            visualResponse.setMessage(visualResponse.getMessage() + "\n[执行方式: Visual Automation, 耗时: " + visualTime + "ms]");
            return visualResponse;
        } catch (Exception e) {
            log.error("Visual also failed", e);
            return AgentResponse.error("Both CLI and visual failed. Last error: " + e.getMessage());
        }
    }
    
    /**
     * 执行可视化操作
     */
    private AgentResponse executeVisual(String command, String sessionId, String jsessionid) {
        log.info("Executing visual (disabled): {}", command);

        // 浏览器自动化(Playwright)兜底已移除：CLI/API 为同域直连，不存在需要浏览器兜底的场景。
        // executeWithFallback 仍会先走 CLI；CLI 成功即返回，失败则回落到此处的明确错误。
        return AgentResponse.error("浏览器自动化功能未启用。请使用 CLI/API 方式操作。");
    }

    /**
     * List available repositories for the current session.
     * Returns repos as JSON array for frontend auto-discovery.
     * GET /api/agent/repos?sessionId=xxx
     */
    @GetMapping("/repos")
    public AgentResponse listRepos(HttpServletRequest request) {

        User user = currentUser(request);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String jsessionid = request.getSession().getId();

        DocSysClient client = getSessionClient(jsessionid);

        try {
            Map<String, Object> raw = client.getReposList();
            List<Map<String, Object>> repos = new java.util.ArrayList<>();

            if (raw != null) {
                // DocSystem returns: { "data": [...], "status": "ok" } or { "list": [...] }
                Object data = raw.get("data");
                if (data instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> list = (List<Map<String, Object>>) data;
                    for (Map<String, Object> item : list) {
                        Map<String, Object> repoItem = new HashMap<>();
                        repoItem.put("vid", item.get("vid") != null ? item.get("vid") : item.get("id") != null ? item.get("id") : 0);
                        repoItem.put("name", item.get("name") != null ? item.get("name") : "unknown");
                        repoItem.put("path", item.get("path") != null ? item.get("path") : "");
                        repos.add(repoItem);
                    }
                } else if (data instanceof java.util.Map) {
                    // Single repos object
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) data;
                    Map<String, Object> repoItem2 = new HashMap<>();
                    repoItem2.put("vid", m.get("vid") != null ? m.get("vid") : m.get("id") != null ? m.get("id") : 0);
                    repoItem2.put("name", m.get("name") != null ? m.get("name") : "unknown");
                    repoItem2.put("path", m.get("path") != null ? m.get("path") : "");
                    repos.add(repoItem2);
                }
            }

            Integer firstVid = repos.isEmpty() ? null : (Integer) repos.get(0).get("vid");
            Map<String, Object> reposData = new HashMap<>();
            reposData.put("repos", repos);
            reposData.put("firstVid", firstVid != null ? firstVid : 0);
            reposData.put("total", repos.size());
            return AgentResponse.ok(reposData);
        } catch (Exception e) {
            log.warn("Failed to list repos: {}", e.getMessage());
            Map<String, Object> errData = new HashMap<>();
            errData.put("repos", java.util.Collections.emptyList());
            errData.put("firstVid", 0);
            errData.put("total", 0);
            errData.put("error", e.getMessage());
            return AgentResponse.ok(errData);
        }
    }

    @GetMapping("/health")
    public AgentResponse health() {
        Map<String, Object> details = new HashMap<>();
        details.put("docsysUrl", docSysClient.getBaseUrl());
        details.put("activeSessions", sessionClients.size());

        String dbStatus;
        long persistedSessions = 0;
        try {
            persistedSessions = sessionService.countActiveSessions();
            dbStatus = "UP";
        } catch (Exception e) {
            dbStatus = "DOWN (" + e.getClass().getSimpleName() + ": " + e.getMessage() + ")";
        }
        details.put("dbStatus", dbStatus);
        details.put("persistedSessions", persistedSessions);

        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("components", details);
        return AgentResponse.ok(healthData);
    }

    /**
     * GET /api/agent/current-key
     * Returns the widget API key from .env for same-origin widget auto-discovery.
     * Response: { "key": "dsa_xxxxx" } or { "key": null } if not configured.
     */
    @GetMapping("/current-key")
    public AgentResponse getCurrentKey() {
        String key = envConfig.loadWidgetKey().orElse(null);
        Map<String, Object> keyData = new HashMap<>();
        keyData.put("key", key != null ? key : "");
        return AgentResponse.ok(keyData);
    }

    /**
     * GET /api/agent/widget-config
     * Returns adaptive widget configuration for embed-injector.js.
     * Resolution priority: .env DOCSYS_AGENT_URL > agent.widget-url config > auto-discovery
     *
     * Response:
     *   {
     *     "agentUrl": "/api/agent" | "http://localhost:8110" | "",
     *     "apiKey": "dsa_xxxxx",
     *     "version": "1.0.0",
     *     "docsysUrl": "http://localhost:8100/DocSystem"
     *   }
     *
     * Widget auto-discovery logic (embed-injector.js):
     *   1. If DOCSYS_AGENT_URL is set → use it
     *   2. Else auto-discover from own script src (extracts host:port)
     *   3. Else fall back to /api/agent (Apache proxy convention)
     */
    @GetMapping("/widget-config")
    public AgentResponse getWidgetConfig(HttpServletRequest request) {
        // Priority: env DOCSYS_AGENT_URL > agent.widget-url config > empty (auto-discovery)
        String configuredUrl = envConfig.loadAgentUrl().orElse(null);
        if (configuredUrl == null || configuredUrl.trim().isEmpty()) {
            configuredUrl = agentWidgetUrl;
        }

        // Fallback: derive from request if not configured (for direct-mode debugging)
        String resolvedUrl;
        if (configuredUrl == null || configuredUrl.trim().isEmpty()) {
            String scheme = request.getScheme();
            int serverPort = request.getServerPort();
            String serverName = request.getServerName();
            // Detect if running behind reverse proxy (has X-Forwarded-* headers)
            String forwardedScheme = request.getHeader("X-Forwarded-Proto");
            String forwardedHost = request.getHeader("X-Forwarded-Host");
            String forwardedPrefix = request.getHeader("X-Forwarded-Prefix");
            if (forwardedHost != null && !forwardedHost.trim().isEmpty()) {
                scheme = forwardedScheme != null ? forwardedScheme : scheme;
                resolvedUrl = scheme + "://" + forwardedHost + (forwardedPrefix != null ? forwardedPrefix : "");
            } else {
                // Direct mode: use scheme://host:port (no context-path if behind Apache)
                String contextPath = request.getContextPath();
                resolvedUrl = scheme + "://" + serverName
                    + (serverPort == 80 || serverPort == 443 ? "" : ":" + serverPort)
                    + (contextPath != null && !contextPath.isEmpty() ? contextPath : "");
            }
        } else {
            resolvedUrl = configuredUrl;
        }

        // Strip trailing slash for consistency
        resolvedUrl = resolvedUrl.replaceAll("/+$", "");

        // Widget key: env DOCSYS_AGENT_WIDGET_KEY > agent.widget-key config
        String widgetKey = envConfig.loadWidgetKey().orElse(null);
        if (widgetKey == null || widgetKey.trim().isEmpty()) {
            widgetKey = agentWidgetKey;
        }
        if (widgetKey == null || widgetKey.trim().isEmpty()) {
            widgetKey = "";
        }

        Map<String, Object> config = new java.util.LinkedHashMap<>();
        config.put("agentUrl", resolvedUrl);
        config.put("apiKey", widgetKey);
        config.put("version", "1.0.0");
        config.put("docsysUrl", envConfig.loadDocSysUrl());
        return AgentResponse.ok(config);
    }

    /**
     * GET /api/agent/docsys-user
     * Called by embed-injector.js to relay DocSystem session info to Agent backend.
     * This is a no-auth proxy — actual auth is validated by DocSystem cookie sent with the request.
     * Response: { data: { userId, userName, userEmail } } or empty if not logged in.
     */
    @GetMapping("/docsys-user")
    public AgentResponse getDocSysUserInfo(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userEmail) {
        if (userId == null || userId.isEmpty()) {
            return AgentResponse.ok(Collections.emptyMap());
        }
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", userId);
        userData.put("userName", userName != null ? userName : "");
        userData.put("userEmail", userEmail != null ? userEmail : "");
        return AgentResponse.ok(userData);
    }

    // ==================== SSE Confirm Helpers (UX-01, D-12, D-13) ====================

    /**
     * Extract operation type from command string.
     * Maps command patterns to skill IDs for audit logging.
     */
    private String extractOperationType(String command) {
        if (command == null) return "unknown";
        String lower = command.toLowerCase().trim();
        if (lower.startsWith("delete") || lower.contains("删除")) return "delete_doc";
        if (lower.startsWith("create") || lower.startsWith("add") || lower.contains("创建") || lower.contains("添加")) return "add_repos";
        if (lower.startsWith("upload") || lower.contains("上传")) return "upload_doc";
        if (lower.contains("backup") || lower.contains("备份")) return "backup_repos";
        if (lower.contains("restore")) return "restore_repos";
        if (lower.contains("wipe")) return "wipe_repos";
        if (lower.contains("rename")) return "rename_doc";
        if (lower.contains("move")) return "move_doc";
        if (lower.contains("copy")) return "copy_doc";
        return "unknown";
    }

    /**
     * Build user-friendly confirmation message from operation type.
     * Per D-13: Frontend displays this in the confirm dialog.
     */
    private String buildConfirmMessage(String operation, String command) {
        if ("delete_doc".equals(operation) || "delete_repos".equals(operation)) {
            return "此操作将永久删除数据，是否继续？";
        } else if ("backup_repos".equals(operation)) {
            return "此操作将创建仓库备份，是否继续？";
        } else if ("restore_repos".equals(operation)) {
            return "此操作将恢复仓库数据，是否继续？";
        } else if ("wipe_repos".equals(operation)) {
            return "此操作将清空仓库所有数据，是否继续？";
        } else if ("upload_doc".equals(operation)) {
            return "此操作将上传文件到仓库，是否继续？";
        } else if ("add_repos".equals(operation) || "create_repos".equals(operation)) {
            return "此操作将创建新仓库，是否继续？";
        } else {
            return "此操作将执行以下命令：\n" + command + "\n\n是否继续？";
        }
    }

    /**
     * Wait for user confirmation via POST /api/agent/confirm.
     * Uses polling with a timeout to avoid blocking indefinitely.
     */
    private boolean waitForConfirmation(String confirmToken, long timeout, TimeUnit unit) {
        if (auditLogService == null) return true;  // Graceful degradation
        long deadline = System.currentTimeMillis() + unit.toMillis(timeout);
        int pollIntervalMs = 500;

        while (System.currentTimeMillis() < deadline) {
            try {
                AuditLogEntity entry = auditLogService.getPendingEntry(confirmToken);
                if (entry == null) {
                    // Entry was processed — check its final status
                    // Note: getPendingEntry returns null if not PENDING, meaning it was approved/rejected
                    return false;  // Rejected or expired
                }
                Thread.sleep(pollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;  // Timeout
    }

    // ==================== FILE UPLOAD ENDPOINTS ====================

    /**
     * Upload request DTO
     */
    public static class UploadRequest {
        private Integer reposId;
        private Long pid;
        private String path;
        private String name;
        private String dirPath;
        private Long batchStartTime;
        private Integer totalCount;
        private Integer isEnd;
        private String commitMsg;
        private String checkSum;

        public Integer getReposId() { return reposId; }
        public void setReposId(Integer reposId) { this.reposId = reposId; }

        public Long getPid() { return pid; }
        public void setPid(Long pid) { this.pid = pid; }

        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDirPath() { return dirPath; }
        public void setDirPath(String dirPath) { this.dirPath = dirPath; }

        public Long getBatchStartTime() { return batchStartTime; }
        public void setBatchStartTime(Long batchStartTime) { this.batchStartTime = batchStartTime; }

        public Integer getTotalCount() { return totalCount; }
        public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }

        public Integer getIsEnd() { return isEnd; }
        public void setIsEnd(Integer isEnd) { this.isEnd = isEnd; }

        public String getCommitMsg() { return commitMsg; }
        public void setCommitMsg(String commitMsg) { this.commitMsg = commitMsg; }

        public String getCheckSum() { return checkSum; }
        public void setCheckSum(String checkSum) { this.checkSum = checkSum; }
    }

    // ==================== P2：附件（临时文件，不属于仓库） ====================

    /** 清理超期附件目录：每 JVM 只做一次（懒执行，不依赖启动钩子） */
    private static final java.util.concurrent.atomic.AtomicBoolean ATTACH_SWEEP_DONE =
            new java.util.concurrent.atomic.AtomicBoolean(false);

    private void sweepAttachmentsOnce() {
        if (!ATTACH_SWEEP_DONE.compareAndSet(false, true)) {
            return;
        }
        try {
            int removed = com.DocSystem.agent.attachment.AgentAttachmentSupport.sweepExpired(
                    com.DocSystem.agent.attachment.AgentAttachmentSupport.RETENTION_DAYS * 24L * 3600L * 1000L);
            if (removed > 0) {
                log.info("attachments: swept {} expired session dirs", removed);
            }
        } catch (Exception e) {
            log.warn("attachments sweep failed: {}", e.getMessage());
        }
    }

    /**
     * 上传附件（临时）——为<b>本轮对话</b>提供输入，不写仓库。
     * POST /agent/attachment（multipart: file + sessionId）
     *
     * @return data: {id, name, size, mime, kind}
     */
    @PostMapping("/attachment")
    public AgentResponse uploadAttachment(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (file == null || file.isEmpty()) {
            return AgentResponse.error("未选择文件");
        }
        if (file.getSize() > com.DocSystem.agent.attachment.AgentAttachmentSupport.MAX_FILE_BYTES) {
            return AgentResponse.error("文件过大（上限 "
                    + (com.DocSystem.agent.attachment.AgentAttachmentSupport.MAX_FILE_BYTES / 1024 / 1024) + "MB）");
        }
        String name = com.DocSystem.agent.attachment.AgentAttachmentSupport.sanitizeName(file.getOriginalFilename());
        if (name == null) {
            return AgentResponse.error("文件名非法");
        }
        sweepAttachmentsOnce();
        String userId = user.getName() != null ? user.getName() : "anonymous";
        java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                userId, attachSessionKey(sessionId), true);
        try {
            List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> existing =
                    com.DocSystem.agent.attachment.AgentAttachmentSupport.listItems(dir);
            if (existing.size() >= com.DocSystem.agent.attachment.AgentAttachmentSupport.MAX_ATTACHMENTS) {
                return AgentResponse.error("附件数量已达上限（"
                        + com.DocSystem.agent.attachment.AgentAttachmentSupport.MAX_ATTACHMENTS + " 个）");
            }
            java.io.File target = new java.io.File(dir, name);
            if (target.exists()) {   // 同名：加序号后缀，避免覆盖已上传内容
                String ext = com.DocSystem.agent.attachment.AgentAttachmentSupport.extensionOf(name);
                String base = ext.isEmpty() ? name : name.substring(0, name.length() - ext.length() - 1);
                for (int i = 2; i < 100 && target.exists(); i++) {
                    String cand = base + "-" + i + (ext.isEmpty() ? "" : "." + ext);
                    name = com.DocSystem.agent.attachment.AgentAttachmentSupport.sanitizeName(cand);
                    if (name == null) {
                        return AgentResponse.error("文件名非法");
                    }
                    target = new java.io.File(dir, name);
                }
            }
            file.transferTo(target);
            com.DocSystem.agent.attachment.AgentAttachmentSupport.Item item =
                    new com.DocSystem.agent.attachment.AgentAttachmentSupport.Item(name, name, target.length());
            Map<String, Object> data = new HashMap<String, Object>();
            data.put("id", item.id);
            data.put("name", item.name);
            data.put("size", item.size);
            data.put("mime", item.mime);
            data.put("kind", item.kind);
            data.put("imported", false);   // 刚上传，尚未入库
            log.info("attachment uploaded: user={}, session={}, name={}, size={}",
                    userId, attachSessionKey(sessionId), name, item.size);
            return AgentResponse.ok("附件已上传（临时）").withData(data);
        } catch (Exception e) {
            log.warn("attachment upload failed: {}", e.getMessage());
            return AgentResponse.error("附件上传失败: " + e.getMessage());
        }
    }

    /** 列出当前会话的附件（页面刷新/切会话后恢复 chips）GET /agent/attachments?sessionId= */
    @GetMapping("/attachments")
    public AgentResponse listAttachments(@RequestParam(value = "sessionId", required = false) String sessionId,
                                         HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String userId = user.getName() != null ? user.getName() : "anonymous";
        java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                userId, attachSessionKey(sessionId), false);
        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        for (com.DocSystem.agent.attachment.AgentAttachmentSupport.Item it :
                com.DocSystem.agent.attachment.AgentAttachmentSupport.listItems(dir)) {
            Map<String, Object> one = new HashMap<String, Object>();
            one.put("id", it.id);
            one.put("name", it.name);
            one.put("size", it.size);
            one.put("mime", it.mime);
            one.put("kind", it.kind);
            // 已入库（每附件一次）→ 前端 chip 显示「✓ 已入库」且不再提供入库按钮
            one.put("imported", it.imported);
            out.add(one);
        }
        return AgentResponse.ok(out);
    }

    /**
     * 删除会话中的一个临时附件。
     *
     * <p>POST /agent/attachment/delete，body: {@code {sessionId, id}} —— **中文文件名不能走 query**：
     * Tomcat 7 默认 {@code URIEncoding=ISO-8859-1}，会把 URL 里的 UTF-8 百分号编码解成乱码，
     * 结果 resolve 不到文件（返回“附件不存在”）而前端看起来像“删了但刷新又回来”。
     */
    @PostMapping("/attachment/delete")
    public AgentResponse deleteAttachment(@RequestBody AttachmentDeleteRequest body,
                                          HttpServletRequest servletRequest) {
        if (body == null) {
            return AgentResponse.error("参数错误");
        }
        return deleteAttachmentInternal(body.getSessionId(), body.getId(), servletRequest);
    }

    /** 兼容旧调用：DELETE /agent/attachment?sessionId=&id=（query 传中文时按 Tomcat 默认编码补正） */
    @DeleteMapping("/attachment")
    public AgentResponse deleteAttachmentByQuery(
            @RequestParam("id") String id,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            HttpServletRequest servletRequest) {
        return deleteAttachmentInternal(sessionId, fixQueryEncoding(id), servletRequest);
    }

    /** query 参数编码补正（与项目其他 DocSys 端点同一做法：ISO-8859-1 字串还原为 UTF-8） */
    private static String fixQueryEncoding(String raw) {
        if (raw == null || raw.isEmpty()) {
            return raw;
        }
        try {
            return new String(raw.getBytes("ISO8859-1"), "UTF-8");
        } catch (Exception e) {
            return raw;
        }
    }

    private AgentResponse deleteAttachmentInternal(String sessionId, String id,
                                                   HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        String userId = user.getName() != null ? user.getName() : "anonymous";
        java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                userId, attachSessionKey(sessionId), false);
        java.io.File f = com.DocSystem.agent.attachment.AgentAttachmentSupport.resolve(dir, id);
        if (f == null) {
            log.warn("attachment delete: not found, user={}, session={}, id={}", userId, sessionId, id);
            return AgentResponse.error("附件不存在");
        }
        boolean ok = f.delete();
        if (ok) {
            // 附件被移除 → 其「已入库」标记也清掉；否则用户重新上传同名文件时会被误判为“已入库”
            com.DocSystem.agent.attachment.AgentAttachmentSupport.unmarkImported(dir, id);
        }
        return ok ? AgentResponse.ok("附件已删除") : AgentResponse.error("附件删除失败");
    }

    /** 删除附件请求体（中文文件名必须走 body，见 deleteAttachment 注释） */
    public static class AttachmentDeleteRequest {
        private String sessionId;
        private String id;
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
    }

    /** 附件入库请求体（用户显式选目标仓库与目录） */
    public static class AttachmentImportRequest {
        private String sessionId;
        private String id;
        private Integer reposId;
        private Long pid;
        private String path;
        private String name;
        /** 是否强制替换目标目录里的同名文件（默认 false：有同名文件则回 DOC_EXISTS，由前端弹窗询问） */
        private boolean force;
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public Integer getReposId() { return reposId; }
        public void setReposId(Integer reposId) { this.reposId = reposId; }
        public Long getPid() { return pid; }
        public void setPid(Long pid) { this.pid = pid; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public boolean isForce() { return force; }
        public void setForce(boolean force) { this.force = force; }
    }

    /**
     * 目标目录里是否已有同名条目。
     *
     * <p>DocSys 的上传遇到同名文件是“直接覆盖 + 生成新版本”，会改掉已有内容 —— 默认必须先问用户，
     * 而上传后再判别已经太晚（内容已被改）。所以入库前先用子目录列表探测一次。
     *
     * @return "file"（同名文件）/ "dir"（同名目录）/ null（无冲突或列表拿不到，按无冲突处理）
     */
    private String findNameConflict(DocSysClient client, Integer reposId, Long folderDocId, String fileName) {
        try {
            // 目标目录用它的 docId 定位；根目录（docId 为 null/0）不传 → 服务端返回仓库根目录
            Long docId = (folderDocId != null && folderDocId > 0) ? folderDocId : null;
            Map<String, Object> list = client.getDocList(reposId, docId, null, null);
            Object data = list != null ? list.get("data") : null;
            if (!(data instanceof List)) {
                return null;
            }
            for (Object o : (List<?>) data) {
                if (!(o instanceof Map)) {
                    continue;
                }
                Map<?, ?> d = (Map<?, ?>) o;
                if (!fileName.equals(String.valueOf(d.get("name")))) {
                    continue;
                }
                Object t = d.get("type");
                return (t instanceof Number && ((Number) t).intValue() == 2) ? "dir" : "file";
            }
            return null;
        } catch (Exception e) {
            log.warn("conflict check failed (treated as no conflict): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 把临时附件导入仓库（显式动作）POST /agent/attachment/import
     * 目标仓库/目录由用户在选择器里指定；服务端直接把临时文件内容写入仓库。
     */
    @PostMapping("/attachment/import")
    public AgentResponse importAttachment(@RequestBody AttachmentImportRequest body,
                                          HttpServletRequest servletRequest) {
        User user = currentUser(servletRequest);
        if (user == null) {
            return AgentResponse.error("NOT_LOGGED_IN");
        }
        if (body == null || body.getReposId() == null || body.getReposId() <= 0) {
            return AgentResponse.error("请选择目标仓库");
        }
        String userId = user.getName() != null ? user.getName() : "anonymous";
        java.io.File dir = com.DocSystem.agent.attachment.AgentAttachmentSupport.sessionDir(
                userId, attachSessionKey(body.getSessionId()), false);
        java.io.File src = com.DocSystem.agent.attachment.AgentAttachmentSupport.resolve(dir, body.getId());
        if (src == null) {
            return AgentResponse.error("附件不存在或已过期，请重新上传");
        }
        // 一个附件只允许入库一次：已标记过直接拒绝（前端也会把入库按钮换成「已入库」，这里只是兜底）
        if (com.DocSystem.agent.attachment.AgentAttachmentSupport.isImported(dir, body.getId())) {
            return AgentResponse.error("该附件已入库，不能重复入库（如需重新入库，请先移除附件再重新上传）");
        }
        try {
            String name = com.DocSystem.agent.attachment.AgentAttachmentSupport.sanitizeName(
                    body.getName() != null ? body.getName() : src.getName());
            if (name == null) {
                return AgentResponse.error("文件名非法");
            }
            byte[] data = Files.readAllBytes(src.toPath());
            DocSysClient client = getSessionClient(servletRequest.getSession().getId());
            // 同名冲突：默认不覆盖，交给用户确认（前端拿 DOC_EXISTS 弹“是否替换”，确认后带 force 重发）
            if (!body.isForce()) {
                String conflict = findNameConflict(client, body.getReposId(), body.getPid(), name);
                if ("dir".equals(conflict)) {
                    return AgentResponse.error("目标目录已存在同名文件夹，无法入库：" + name, "DOC_EXISTS");
                }
                if ("file".equals(conflict)) {
                    return AgentResponse.error("目标目录已存在同名文件，请确认是否替换：" + name, "DOC_EXISTS");
                }
            }
            Map<String, Object> result = client.uploadFile(body.getReposId(),
                    body.getPid() != null ? body.getPid() : 0L,
                    body.getPath() != null ? body.getPath() : "/",
                    name, data, name);
            boolean ok = result != null && ("ok".equals(result.get("status"))
                    || Boolean.TRUE.equals(result.get("success")));
            if (!ok) {
                String msg = result != null && result.get("msgInfo") != null
                        ? String.valueOf(result.get("msgInfo")) : "导入失败";
                return AgentResponse.error(msg);
            }
            // DocSys 对同名文件的写入走 UPDATE：返回 status=ok 但 data 里没有 docId（不设 data）；
            // 新增文件才带 docId。入库文案据此如实说明是“新增”还是“替换了同名文件”。
            Object inner = result.get("data");
            boolean added = inner instanceof Map && ((Map<?, ?>) inner).get("docId") != null;
            // 入库成功 → 打上「已入库」标记，chip 从此只显示状态、不再提供入库
            com.DocSystem.agent.attachment.AgentAttachmentSupport.markImported(dir, body.getId());
            log.info("attachment imported: user={}, name={}, repo={}, path={}, added={}, force={}",
                    userId, name, body.getReposId(), body.getPath(), added, body.isForce());
            if (!added && body.isForce()) {
                return AgentResponse.ok("已替换入库：" + name + "（原同名文件已生成新版本）");
            }
            return AgentResponse.ok("已入库：" + name);
        } catch (Exception e) {
            log.warn("attachment import failed: {}", e.getMessage());
            return AgentResponse.error("导入失败: " + e.getMessage());
        }
    }

    /**
     * 文件上传端点
     *
     * 支持:
     * - 单文件上传 (multipart/form-data)
     * - 多文件上传 (多次调用或 files 参数)
     * - 文件夹上传 (通过 dirPath, batchStartTime, totalCount, isEnd 参数)
     *
     * 参数:
     * - file: 上传的文件 (MultipartFile)
     * - reposId: 仓库 ID (必填)
     * - pid: 父目录 ID (默认 0)
     * - path: 目标路径
     * - name: 文件名 (可选，默认使用原始文件名)
     * - dirPath: 目录路径 (文件夹上传时使用)
     * - batchStartTime: 批次开始时间 (文件夹上传时使用)
     * - totalCount: 文件总数 (文件夹上传时使用)
     * - isEnd: 是否结束 (文件夹上传时使用)
     * - commitMsg: 提交信息
     * - sessionId: 会话 ID
     */
    @PostMapping("/upload")
    public AgentResponse upload(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "metadata", required = false) String metadataJson,
            @RequestParam(value = "reposId", required = false) Integer reposIdParam,
            HttpServletRequest servletRequest) {
        log.info("Upload endpoint hit - content-type received");

        // 解析 metadata JSON
        UploadRequest request;
        try {
            request = metadataJson != null
                ? com.alibaba.fastjson.JSON.parseObject(metadataJson, UploadRequest.class)
                : new UploadRequest();
        } catch (Exception e) {
            log.warn("Failed to parse metadata JSON, using defaults: {}", e.getMessage());
            request = new UploadRequest();
        }

        // Fallback: reposId from direct form field (if not in metadata JSON)
        if (request.getReposId() == null && reposIdParam != null) {
            request.setReposId(reposIdParam);
        }

        log.info("Upload called - reposId: {}, file: {}, files count: {}",
            request.getReposId(), file != null ? file.getOriginalFilename() : "null",
            files != null ? files.length : 0);

        try {
            // 认证：来自共享 HttpSession 的当前用户
            User user = currentUser(servletRequest);
            if (user == null) {
                return AgentResponse.error("NOT_LOGGED_IN");
            }
            String jsessionid = servletRequest.getSession().getId();

            DocSysClient uploadClient = getSessionClient(jsessionid);

            // 处理多文件上传
            if (files != null && files.length > 0) {
                return uploadMultipleFiles(uploadClient, files, request);
            }

            // 处理单文件上传
            if (file != null && !file.isEmpty()) {
                return uploadSingleFile(uploadClient, file, request);
            }

            return AgentResponse.error("No file provided for upload.");

        } catch (Exception e) {
            log.error("Upload failed", e);
            return AgentResponse.error("Upload failed: " + e.getMessage());
        }
    }

    /**
     * 上传单个文件
     *
     * 优先使用简单上传路径（不传 batch 参数），避免 DocSystem 后端的
     * checkAndCreateFolderUploadAction NPE bug（docLock 为 null 时仍访问 createTime）。
     * 仅在明确指定 batch 参数时才走批量上传路径。
     */
    private AgentResponse uploadSingleFile(DocSysClient client, MultipartFile file, UploadRequest request) throws Exception {
        String fileName = request.getName() != null ? request.getName() : file.getOriginalFilename();
        byte[] fileData = file.getBytes();

        log.info("Uploading single file: {}, size: {} bytes, batchStartTime: {}",
            fileName, fileData.length, request.getBatchStartTime());

        // 计算 MD5
        String checkSum = request.getCheckSum();
        if (checkSum == null) {
            checkSum = DocSysClient.calculateMD5(fileData);
        }

        Map<String, Object> result;
        boolean isBatchUpload = request.getBatchStartTime() != null && request.getDirPath() != null && !"/".equals(request.getDirPath());

        if (isBatchUpload) {
            // 批量上传：确保父目录存在（解决后端 lockDoc null NPE）
            AgentResponse dirResult = ensureParentDirExists(client, request);
            if (!dirResult.isSuccess()) {
                return dirResult;
            }
            result = client.uploadDoc(
                request.getReposId(),
                request.getPid() != null ? request.getPid() : 0L,
                request.getPath(),
                fileName,
                1,  // type = file
                (long) fileData.length,
                checkSum,
                fileData,
                fileName,
                request.getDirPath(),
                request.getBatchStartTime(),
                request.getTotalCount(),
                request.getIsEnd(),
                request.getCommitMsg() != null ? request.getCommitMsg() : "上传文件 [" + fileName + "]"
            );
        } else {
            // 简单上传：不传 batch 参数，走 DocSystem 普通文件上传路径
            result = client.uploadFile(
                request.getReposId(),
                request.getPid() != null ? request.getPid() : 0L,
                request.getPath(),
                fileName,
                fileData,
                fileName
            );
        }

        if ("ok".equals(result.get("status")) || Boolean.TRUE.equals(result.get("success"))) {
            log.info("Upload successful: {}", fileName);
            return AgentResponse.ok("File uploaded successfully: " + fileName).withData(result);
        } else {
            // Support multiple DocSystem response formats: msgInfo, message, or generic
            String msg = result.get("msgInfo") != null ? result.get("msgInfo").toString()
                    : result.get("message") != null ? result.get("message").toString()
                    : "Upload failed";
            log.warn("Upload failed: {}", msg);
            return AgentResponse.error(msg);
        }
    }

    /**
     * 确保父目录存在，通过逐级创建（type=1 文件夹）来避免后端 lockDoc null NPE。
     * DocSystem 的 checkAndCreateFolderUploadAction 在目录不存在时 lockDoc 返回 null，
     * 导致访问 docLock.createTime 时 NPE。此方法在批量上传前先创建目录来规避该 bug。
     */
    private AgentResponse ensureParentDirExists(DocSysClient client, UploadRequest request) {
        String dirPath = request.getDirPath();
        if (dirPath == null || dirPath.isEmpty() || "/".equals(dirPath)) {
            return AgentResponse.ok("Root directory, no need to create");
        }

        Integer reposId = request.getReposId();
        if (reposId == null) reposId = 1;

        // 逐级创建目录（/a/b/c -> 先创建 /a，再 /a/b，再 /a/b/c）
        String[] parts = dirPath.split("/");
        StringBuilder currentPath = new StringBuilder();

        for (int i = 1; i < parts.length; i++) {
            String part = parts[i];
            if (part.isEmpty()) continue;
            currentPath.append("/").append(part);

            try {
                Map<String, Object> r = client.addDoc(reposId, 0L, currentPath.toString(), part, 1, 0, null,
                    "创建目录 [" + currentPath + "]");
                log.info("ensureParentDir: {} -> status={}", currentPath, r.get("status"));
            } catch (Exception e) {
                log.warn("ensureParentDir {} failed (may already exist): {}", currentPath, e.getMessage());
                // 忽略错误（目录可能已存在），继续尝试下一级
            }
        }
        return AgentResponse.ok("Parent directories ensured");
    }

    /**
     * 上传多个文件
     */
    private AgentResponse uploadMultipleFiles(DocSysClient client, MultipartFile[] files, UploadRequest request) {
        log.info("Uploading {} files", files.length);

        int successCount = 0;
        int failCount = 0;
        Map<String, Object> failedFiles = new HashMap<>();

        // 如果是批量上传（指定了 batchStartTime），确保父目录存在
        if (request.getBatchStartTime() != null && request.getDirPath() != null) {
            AgentResponse dirResult = ensureParentDirExists(client, request);
            log.info("ensureParentDir result: {}", dirResult.getMessage());
        }

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            try {
                // 为每个文件设置批次信息
                request.setTotalCount(files.length);
                request.setIsEnd(i == files.length - 1 ? 1 : 0);  // 最后一个文件标记为结束

                AgentResponse result = uploadSingleFile(client, file, request);
                if (result.isSuccess()) {
                    successCount++;
                } else {
                    failCount++;
                    failedFiles.put(file.getOriginalFilename(), result.getMessage());
                }
            } catch (Exception e) {
                failCount++;
                failedFiles.put(file.getOriginalFilename(), e.getMessage());
                log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("total", files.length);
        response.put("success", successCount);
        response.put("failed", failCount);
        response.put("failedFiles", failedFiles);

        if (failCount == 0) {
            return AgentResponse.ok("All files uploaded successfully").withData(response);
        } else if (successCount > 0) {
            return AgentResponse.ok("Partial upload: " + successCount + " success, " + failCount + " failed").withData(response);
        } else {
            return AgentResponse.error("All uploads failed").withData(response);
        }
    }

    /**
     * 获取文件夹内文件列表（用于文件夹上传预处理）
     */
    @PostMapping("/upload/folder/prepare")
    public AgentResponse prepareFolderUpload(
            @RequestBody UploadRequest request,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestHeader(value = "Cookie", required = false) String cookie) {

        log.info("Prepare folder upload - reposId: {}, dirPath: {}", request.getReposId(), request.getDirPath());

        Map<String, Object> response = new HashMap<>();
        response.put("batchStartTime", System.currentTimeMillis());
        response.put("ready", true);

        return AgentResponse.ok("Folder upload prepared").withData(response);
    }
    
    private AgentContext getContext(String username, String sessionId) {
        if (sessionId == null) {
            return AgentContext.builder().withSessionId("anonymous").build();
        }
        AgentContext.Builder builder = AgentContext.builder().withSessionId(sessionId);
        if (username != null) {
            builder.withUsername(username);
        }
        return builder.build();
    }
    
    public static class SessionInfo {
        public String username;
        public String sessionId;
        public String jsessionid;
        public String tenantId;
        /**
         * P2：对话会话 id（＝前端 payload.sessionId）。附件临时目录按它隔离，
         * 必须与 /agent/attachment（上传/列表/删除/入库）使用同一个 id；为空时回退 jsessionid。
         */
        public String agentSessionId;

        /** 附件会话目录键所用的 id（与上传端点一致） */
        public String attachmentSessionKey() {
            return (agentSessionId != null && !agentSessionId.trim().isEmpty()) ? agentSessionId : sessionId;
        }
        
        public SessionInfo(String username, String sessionId) {
            this.username = username;
            this.sessionId = sessionId;
        }
        
        public SessionInfo(String username, String sessionId, String jsessionid) {
            this.username = username;
            this.sessionId = sessionId;
            this.jsessionid = jsessionid;
        }
        
        public SessionInfo(String username, String sessionId, String jsessionid, String tenantId) {
            this.username = username;
            this.sessionId = sessionId;
            this.jsessionid = jsessionid;
            this.tenantId = tenantId;
        }
    }
}
