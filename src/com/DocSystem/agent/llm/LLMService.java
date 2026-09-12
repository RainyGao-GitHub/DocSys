package com.DocSystem.agent.llm;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.agent.tool.ToolCall;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.ProxySelector;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * LLM Service - integrates with Ollama for natural language responses
 */
@Service
public class LLMService {

    private static final Logger log = LoggerFactory.getLogger(LLMService.class);

    private static final MediaType JSON_MEDIA = MediaType.parse("application/json; charset=utf-8");

    @Value("${llm.endpoint:http://localhost:11434}")
    private String endpoint;

    @Value("${llm.model:llama3}")
    private String defaultModel;

    @Value("${llm.temperature:0.7}")
    private double temperature;

    @Value("${llm.max-tokens:2048}")
    private int maxTokens;

    @Value("${llm.connect-timeout:30}")
    private int connectTimeout;

    @Value("${llm.chat-timeout:60}")
    private int chatTimeout;

    @Value("${llm.embedding-timeout:10}")
    private int embeddingTimeout;

    @Value("${llm.api-key:}")
    private String apiKey;

    private OkHttpClient httpClient;

    /** Whether endpoint uses OpenAI-compatible format (vs Ollama native) */
    private boolean openAiCompatible = false;
    private final Map<String, List<Map<String, String>>> conversationHistory = new ConcurrentHashMap<>();

    @Value("${llm.backup.endpoint:}")
    private String backupEndpoint;

    @Value("${llm.backup.model:}")
    private String backupModel;

    private boolean hasBackup = false;

    @Autowired(required = false)
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @PostConstruct
    public void init() {
        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(connectTimeout, TimeUnit.SECONDS)
                .readTimeout(chatTimeout, TimeUnit.SECONDS)
                .writeTimeout(chatTimeout, TimeUnit.SECONDS);

        // Try to use system proxy on Windows for external APIs (bigmodel.cn)
        try {
            ProxySelector defaultSelector = ProxySelector.getDefault();
            if (defaultSelector != null) {
                builder.proxySelector(defaultSelector);
                List<java.net.Proxy> proxies = defaultSelector.select(URI.create(endpoint));
                log.info("Proxy for {}: {}", endpoint, proxies);
            }
        } catch (Exception e) {
            log.warn("Could not set system proxy: {}", e.getMessage());
        }
        this.httpClient = builder.build();

        // Detect format: Ollama uses /api/chat with native format; OpenAI-compatible uses /v4/chat/completions
        this.openAiCompatible = endpoint != null && (
            endpoint.contains("openai.com") ||
            endpoint.contains("bigmodel.cn") ||
            endpoint.contains("deepseek.com") ||
            endpoint.contains("/v1/") ||
            endpoint.contains("/v4/"));
        this.hasBackup = backupEndpoint != null && !backupEndpoint.isEmpty();
        if (this.hasBackup) {
            log.info("LLM backup configured: endpoint={}, model={}", backupEndpoint,
                    backupModel.isEmpty() ? defaultModel : backupModel);
        }
        log.info("LLMService initialized: endpoint={}, model={}, connectTimeout={}s, chatTimeout={}s, openAiCompatible={}",
                endpoint, defaultModel, connectTimeout, chatTimeout, openAiCompatible);
    }

    /**
     * Check if primary LLM circuit breaker is open (per D-07).
     */
    private boolean isPrimaryCircuitOpen() {
        if (circuitBreakerRegistry == null) return false;
        try {
            CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("llm");
            return cb.getState() == CircuitBreaker.State.OPEN;
        } catch (Exception e) {
            log.debug("Could not check circuit breaker state: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 判断 endpoint 是否为 OpenAI 兼容格式（vs Ollama 原生 /api/chat）。
     * 抽为 static 供 {@link ResolvedLlmConfig} 与请求级路径复用，与 init() 内的探测规则保持一致。
     */
    public static boolean detectOpenAiCompatible(String ep) {
        return ep != null && (
            ep.contains("openai.com") ||
            ep.contains("bigmodel.cn") ||
            ep.contains("deepseek.com") ||
            ep.contains("/v1/") ||
            ep.contains("/v4/"));
    }

    /**
     * Execute LLM chat with a specific endpoint and model.
     * Extracted from chat() to support primary/backup switching.
     */
    private String doChat(String targetEndpoint, String targetModel,
                          String targetApiKey, List<Map<String, String>> messages) throws IOException {
        boolean targetOpenAi = detectOpenAiCompatible(targetEndpoint);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", targetModel);
        requestBody.put("messages", messages);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("stream", false);

        String json = JSON.toJSONString(requestBody);
        // Zhipu BigModel uses /v4; OpenAI, DeepSeek and most compatible APIs use /v1.
        String chatCompletionsPath = (targetEndpoint != null && targetEndpoint.contains("bigmodel.cn"))
                ? "/v4/chat/completions" : "/v1/chat/completions";
        String url = targetOpenAi ? targetEndpoint + chatCompletionsPath : targetEndpoint + "/api/chat";

        Request.Builder reqBuilder = new Request.Builder()
                .url(url)
                .header("Content-Type", "application/json")
                .post(RequestBody.create(JSON_MEDIA, json));
        if (targetApiKey != null && !targetApiKey.isEmpty()) {
            reqBuilder.header("Authorization", "Bearer " + targetApiKey);
        }
        Request request = reqBuilder.build();

        log.debug("LLM doChat: url={}, model={}, hasApiKey={}", url, targetModel, targetApiKey != null && !targetApiKey.isEmpty());
        Response response = httpClient.newCall(request).execute();
        String body = null;
        try {
            int code = response.code();
            ResponseBody respBody = response.body();
            body = respBody != null ? respBody.string() : "";
            log.info("LLM doChat response: status={}, bodyLen={}", code, body.length());

            if (code == 200) {
                JSONObject result = JSON.parseObject(body);
                String assistantMessage;

                if (targetOpenAi) {
                    JSONArray choices = result.getJSONArray("choices");
                    if (choices != null && !choices.isEmpty()) {
                        JSONObject msg = choices.getJSONObject(0).getJSONObject("message");
                        assistantMessage = msg != null ? msg.getString("content") : "";
                    } else {
                        assistantMessage = "";
                    }
                } else {
                    JSONObject messageResult = result.getJSONObject("message");
                    assistantMessage = messageResult != null ? messageResult.getString("content") : "";
                }
                return assistantMessage;
            }

            log.warn("LLM doChat returned status {}: {}", code, body);
            throw new LlmHttpException(code, "LLM returned HTTP " + code + ": " + body);
        } finally {
            response.close();
        }
    }

    /**
     * Chat with LLM
     */
    public String chat(String message, String sessionId) throws IOException {
        // 每次对话前从 DocSystem 现取当前模型（默认第一个），再用刷新后的 defaultModel
        refreshFromSystemConfig(null);
        return chat(message, sessionId, defaultModel);
    }

    /**
     * Chat with specific model
     */
    // Note: @CircuitBreaker and @Retry annotations removed for Spring 4 compatibility
    // Circuit breaker functionality available via isPrimaryCircuitOpen() check
    public String chat(String message, String sessionId, String model) throws IOException {
        // Get or create conversation history
        List<Map<String, String>> messages = conversationHistory.computeIfAbsent(
            sessionId, k -> new ArrayList<>()
        );

        // Add system prompt
        if (messages.isEmpty()) {
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            sysMsg.put("content", "DocSys document management context: help users with documents, " +
                       "repositories, and related tasks. Be concise and helpful. " +
                       "You do not know what model or architecture you run on — " +
                       "if asked, say you are an assistant in DocSys and focus on the user's needs.");
            messages.add(sysMsg);
        }

        // Add user message
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", message);
        messages.add(userMsg);

        // Per D-06, D-07: Check circuit breaker state for primary/backup switching
        if (hasBackup && isPrimaryCircuitOpen()) {
            log.info("Primary LLM circuit breaker OPEN — switching to backup endpoint");
            String backupM = backupModel.isEmpty() ? defaultModel : backupModel;
            try {
                String response = doChat(backupEndpoint, backupM, apiKey, messages);
                // Per D-08: Add to conversation history (preserved for next call)
                Map<String, String> asstMsg = new HashMap<>();
                asstMsg.put("role", "assistant");
                asstMsg.put("content", response);
                messages.add(asstMsg);
                while (messages.size() > 20) messages.remove(1);
                return response;
            } catch (Exception e) {
                log.error("Backup LLM also failed: {}", e.getMessage());
                throw e;  // Propagate to circuit breaker / fallback
            }
        }

        // Primary LLM call
        String response = doChat(endpoint, model, apiKey, messages);
        // Add to conversation history
        Map<String, String> asstMsg2 = new HashMap<>();
        asstMsg2.put("role", "assistant");
        asstMsg2.put("content", response);
        messages.add(asstMsg2);
        while (messages.size() > 20) messages.remove(1);
        return response;
    }

    /**
     * 无状态非流式对话入口：目标 endpoint/model/apiKey 全部来自 {@link ResolvedLlmConfig} 参数，
     * 作为局部变量传递，绝不写入共享字段 —— 因此并发请求各选各的模型互不干扰。
     *
     * <p>与 {@link #chat(String, String)} 的区别：本重载不调用 refreshFromSystemConfig / applyConfig，
     * 全程使用 resolved 中的配置，线程安全。
     */
    public String chat(String message, String sessionId, ResolvedLlmConfig resolved) throws IOException {
        List<Map<String, String>> messages = conversationHistory.computeIfAbsent(
            sessionId, k -> new ArrayList<>()
        );

        // Add system prompt (same softened prompt as streamChat)
        if (messages.isEmpty()) {
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            sysMsg.put("content", "DocSys document management context: help users with documents, " +
                       "repositories, and related tasks. Be concise and helpful. " +
                       "You do not know what model or architecture you run on — " +
                       "if asked, say you are an assistant in DocSys and focus on the user's needs.");
            messages.add(sysMsg);
        }

        // Add user message
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", message);
        messages.add(userMsg);

        // 目标配置全部来自 resolved（请求级局部变量），不写共享字段
        String chatEndpoint = resolved.endpoint;
        String chatModel = resolved.model;
        String chatApiKey = resolved.apiKey;
        boolean chatOpenAi = resolved.openAiCompatible;

        // Circuit breaker: primary/backup switching
        if (hasBackup && isPrimaryCircuitOpen()) {
            log.info("Primary LLM circuit breaker OPEN — switching to backup endpoint");
            chatEndpoint = backupEndpoint;
            chatModel = backupModel.isEmpty() ? defaultModel : backupModel;
            chatApiKey = apiKey;
            chatOpenAi = detectOpenAiCompatible(chatEndpoint);
        }

        String response = doChat(chatEndpoint, chatModel, chatApiKey, messages);

        // Add to conversation history
        Map<String, String> asstMsg = new HashMap<>();
        asstMsg.put("role", "assistant");
        asstMsg.put("content", response);
        messages.add(asstMsg);
        while (messages.size() > 20) messages.remove(1);
        return response;
    }

    /**
     * 无状态对话重载：直接传入完整消息列表（含自定义 system prompt / tool 结果），
     * 不管理 conversationHistory，不写共享字段。
     *
     * <p>供 ToolUseLoop（工具推理循环）使用——它需要自行控制 system 提示词
     * 与工具执行结果回灌，无法复用按 sessionId 管理的对话历史。</p>
     *
     * @param messages 完整消息列表（role ∈ system/user/assistant）
     * @param resolved 请求级模型配置；null 时回退系统默认（只读解析，不写共享字段）
     * @return LLM 原始输出
     */
    public String chat(List<Map<String, String>> messages, ResolvedLlmConfig resolved) throws IOException {
        if (resolved == null) {
            resolved = resolveDefaultConfig();
        }
        // 目标配置全部来自 resolved（请求级局部变量），不写共享字段
        String chatEndpoint = resolved.endpoint;
        String chatModel = resolved.model;
        String chatApiKey = resolved.apiKey;

        // Circuit breaker: primary/backup switching
        if (hasBackup && isPrimaryCircuitOpen()) {
            log.info("Primary LLM circuit breaker OPEN — switching to backup endpoint");
            chatEndpoint = backupEndpoint;
            chatModel = backupModel.isEmpty() ? defaultModel : backupModel;
            chatApiKey = apiKey;
        }

        return doChat(chatEndpoint, chatModel, chatApiKey, messages);
    }

    /**
     * T10：非流式原生工具调用通道 —— 请求携带 tools + tool_choice，返回结构化 tool_calls。
     *
     * <p>双通道语义：{@link LlmTurnResult#nativeToolCalls} 非空 → 调用方直接执行；
     * 端点 400 拒绝 tools（thinking 类模型）→ 去 tools 重试一次，返回 {@code toolsRejected=true}
     * 的纯文本结果，由调用方切换文本通道。</p>
     *
     * @param messages   完整消息列表（role ∈ system/user/assistant/tool；tool 消息含 tool_call_id）
     * @param resolved   请求级模型配置
     * @param tools      OpenAI 格式工具数组（null/空 → 不带 tools）
     * @param toolChoice "auto"/null → auto；其它值原样下发
     */
    public LlmTurnResult chatNative(List<Map<String, Object>> messages, ResolvedLlmConfig resolved,
                                    JSONArray tools, String toolChoice) throws IOException {
        if (resolved == null) {
            resolved = resolveDefaultConfig();
        }
        String chatEndpoint = resolved.endpoint;
        String chatModel = resolved.model;
        String chatApiKey = resolved.apiKey;

        // Circuit breaker: primary/backup switching
        if (hasBackup && isPrimaryCircuitOpen()) {
            log.info("Primary LLM circuit breaker OPEN — switching to backup endpoint");
            chatEndpoint = backupEndpoint;
            chatModel = backupModel.isEmpty() ? defaultModel : backupModel;
            chatApiKey = apiKey;
        }

        boolean toolsRequested = tools != null && !tools.isEmpty();
        LlmTurnResult result = doChatNative(chatEndpoint, chatModel, chatApiKey, messages, tools, toolChoice);
        if (result.toolsRejected && toolsRequested) {
            log.warn("LLM native tools rejected (HTTP 400) — retrying once without tools");
            LlmTurnResult retried = doChatNative(chatEndpoint, chatModel, chatApiKey, messages, null, null);
            // 保留 rejected 标记（调用方据此在后续轮次关闭原生通道），文本取重试结果
            return retried.hasNativeCalls() ? retried : LlmTurnResult.rejected(retried.text);
        }
        return result;
    }

    /** 单次原生请求：带 tools 时 400 → 返回 rejected 结果（不抛异常，交由上层去 tools 重试） */
    private LlmTurnResult doChatNative(String targetEndpoint, String targetModel, String targetApiKey,
            List<Map<String, Object>> messages, JSONArray tools, String toolChoice) throws IOException {
        boolean targetOpenAi = detectOpenAiCompatible(targetEndpoint);
        boolean toolsRequested = tools != null && !tools.isEmpty();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", targetModel);
        requestBody.put("messages", messages);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("stream", false);
        if (toolsRequested) {
            requestBody.put("tools", tools);
            requestBody.put("tool_choice",
                    toolChoice != null && !toolChoice.trim().isEmpty() ? toolChoice.trim() : "auto");
        }

        String json = JSON.toJSONString(requestBody);
        String chatCompletionsPath = (targetEndpoint != null && targetEndpoint.contains("bigmodel.cn"))
                ? "/v4/chat/completions" : "/v1/chat/completions";
        String url = targetOpenAi ? targetEndpoint + chatCompletionsPath : targetEndpoint + "/api/chat";

        Request.Builder reqBuilder = new Request.Builder()
                .url(url)
                .header("Content-Type", "application/json")
                .post(RequestBody.create(JSON_MEDIA, json));
        if (targetApiKey != null && !targetApiKey.isEmpty()) {
            reqBuilder.header("Authorization", "Bearer " + targetApiKey);
        }
        Request request = reqBuilder.build();

        Response response = httpClient.newCall(request).execute();
        String body = null;
        try {
            int code = response.code();
            ResponseBody respBody = response.body();
            body = respBody != null ? respBody.string() : "";
            log.info("LLM chatNative response: status={}, bodyLen={}, toolsSent={}", code, body.length(), toolsRequested);

            if (code == 200) {
                JSONObject result = JSON.parseObject(body);
                if (targetOpenAi) {
                    JSONArray choices = result.getJSONArray("choices");
                    if (choices != null && !choices.isEmpty()) {
                        JSONObject msg = choices.getJSONObject(0).getJSONObject("message");
                        String text = msg != null && msg.getString("content") != null
                                ? msg.getString("content") : "";
                        List<ToolCall> calls = parseNativeToolCalls(msg);
                        return calls.isEmpty() ? LlmTurnResult.text(text)
                                : LlmTurnResult.toolCalls(text, calls);
                    }
                    return LlmTurnResult.text("");
                }
                JSONObject messageResult = result.getJSONObject("message");
                String assistantMessage = messageResult != null && messageResult.getString("content") != null
                        ? messageResult.getString("content") : "";
                return LlmTurnResult.text(assistantMessage);
            }
            if (code == 400 && toolsRequested) {
                log.warn("LLM chatNative tools rejected: status=400 body={}",
                        body != null && body.length() > 300 ? body.substring(0, 300) : body);
                return LlmTurnResult.rejected("");
            }
            log.warn("LLM chatNative returned status {}: {}", code, body);
            throw new LlmHttpException(code, "LLM returned HTTP " + code + ": " + body);
        } finally {
            response.close();
        }
    }

    /**
     * T10：解析 OpenAI 兼容 message.tool_calls[] → ToolCall 列表。
     * 单项形如 {id, type:"function", function:{name, arguments(JSON字符串)}}；arguments 非法 → 空对象。
     */
    public static List<ToolCall> parseNativeToolCalls(JSONObject message) {
        List<ToolCall> calls = new ArrayList<>();
        if (message == null) {
            return calls;
        }
        JSONArray tcs = message.getJSONArray("tool_calls");
        if (tcs == null) {
            return calls;
        }
        for (int i = 0; i < tcs.size(); i++) {
            JSONObject tc = tcs.getJSONObject(i);
            if (tc == null) {
                continue;
            }
            String id = tc.getString("id");
            JSONObject fn = tc.getJSONObject("function");
            if (fn == null) {
                continue;
            }
            String name = fn.getString("name");
            if (name == null || name.isEmpty()) {
                continue;
            }
            String argsStr = fn.getString("arguments");
            JSONObject args = new JSONObject();
            if (argsStr != null && !argsStr.trim().isEmpty()) {
                try {
                    JSONObject parsed = JSON.parseObject(argsStr);
                    if (parsed != null) {
                        args = parsed;
                    }
                } catch (Exception e) {
                    log.warn("LLM native tool_call arguments not JSON: {}", argsStr);
                }
            }
            calls.add(new ToolCall(id, name, args, argsStr));
        }
        return calls;
    }

    /**
     * Clear conversation history
     */
    public void clearHistory(String sessionId) {
        conversationHistory.remove(sessionId);
    }

    /**
     * Get available models
     */
    public List<String> getAvailableModels() {
        try {
            String modelsPath = openAiCompatible ? "/v1/models" : "/api/tags";
            Request.Builder reqBuilder = new Request.Builder()
                    .url(endpoint + modelsPath)
                    .get();
            if (apiKey != null && !apiKey.isEmpty()) {
                reqBuilder.header("Authorization", "Bearer " + apiKey);
            }
            Request request = reqBuilder.build();

            Response response = httpClient.newCall(request).execute();
            try {
                if (response.code() == 200) {
                    ResponseBody respBody = response.body();
                    String bodyStr = respBody != null ? respBody.string() : "";
                    if (openAiCompatible) {
                        // OpenAI/bigmodel format: {"data":[{"id":"model-name","object":"model"}]}
                        JSONObject result = JSON.parseObject(bodyStr);
                        JSONArray modelsArray = result.getJSONArray("data");
                        if (modelsArray != null) {
                            List<String> modelNames = new ArrayList<>();
                            for (int i = 0; i < modelsArray.size(); i++) {
                                JSONObject model = modelsArray.getJSONObject(i);
                                if (model != null) {
                                    modelNames.add(model.getString("id"));
                                }
                            }
                            return modelNames;
                        }
                    } else {
                        // Ollama format: {"models":[{"name":"..."}]}
                        JSONObject result = JSON.parseObject(bodyStr);
                        JSONArray modelsArray = result.getJSONArray("models");
                        if (modelsArray != null) {
                            List<String> modelNames = new ArrayList<>();
                            for (int i = 0; i < modelsArray.size(); i++) {
                                JSONObject model = modelsArray.getJSONObject(i);
                                if (model != null) {
                                    modelNames.add(model.getString("name"));
                                }
                            }
                            return modelNames;
                        }
                    }
                }
            } finally {
                response.close();
            }
        } catch (Exception e) {
            log.error("Failed to get models", e);
        }

        return Arrays.asList(defaultModel);
    }

    /**
     * Check if LLM service is available
     */
    public boolean isAvailable() {
        try {
            // 现取当前模型配置，确保可用性检查针对的是 DocSystem 实际配置的模型
            refreshFromSystemConfig(null);
            // Probe the actual chat endpoint with a minimal request — this works for both
            // OpenAI-compatible (bigmodel.cn, deepseek, etc.) and Ollama.
            String chatPath = openAiCompatible
                    ? ((endpoint != null && endpoint.contains("bigmodel.cn")) ? "/v4/chat/completions" : "/v1/chat/completions")
                    : "/api/chat";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", defaultModel);
            Map<String, String> pingMsg = new HashMap<>();
            pingMsg.put("role", "user");
            pingMsg.put("content", "ping");
            requestBody.put("messages", Arrays.asList(pingMsg));
            requestBody.put("max_tokens", 1);
            requestBody.put("stream", false);
            String json = JSON.toJSONString(requestBody);

            Request.Builder reqBuilder = new Request.Builder()
                    .url(endpoint + chatPath)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(JSON_MEDIA, json));
            if (apiKey != null && !apiKey.isEmpty()) {
                reqBuilder.header("Authorization", "Bearer " + apiKey);
            }
            Request request = reqBuilder.build();

            log.debug("LLM availability check: url={}", endpoint + chatPath);
            Response response = httpClient.newCall(request).execute();
            try {
                int code = response.code();
                log.info("LLM availability: status={}", code);
                // Accept any non-5xx status as "available" (4xx = auth/model issue, not connectivity)
                return code >= 200 && code < 500;
            } finally {
                response.close();
            }
        } catch (Exception e) {
            log.warn("LLM availability check failed: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    /**
     * Apply LLM configuration (called from SubAgent).
     */
    public void applyConfig(String url, String model, String apiKey) {
        if (url != null && !url.trim().isEmpty()) {
            this.endpoint = url;
        }
        if (model != null && !model.trim().isEmpty()) {
            this.defaultModel = model;
        }
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            this.apiKey = apiKey;
        }
        // 重新检测 endpoint 格式（OpenAI 兼容 vs Ollama），否则切换 endpoint 后路径判断仍用旧值
        this.openAiCompatible = endpoint != null && (
            endpoint.contains("openai.com") ||
            endpoint.contains("bigmodel.cn") ||
            endpoint.contains("deepseek.com") ||
            endpoint.contains("/v1/") ||
            endpoint.contains("/v4/") ||
            endpoint.endsWith("/v1") ||
            endpoint.endsWith("/v4"));
    }

    /**
     * 每次对话/可用性检查前，从 DocSystem 的内存配置 {@code BaseFunction.systemLLMConfig}
     * 现取当前模型（默认第一个），覆盖本 Service 的 endpoint/model/apiKey。
     *
     * <p>这与 DocSystem AIChat 的理念一致：模型在“使用时”确定，支持多模型；DocSystem 未配置
     * 或配置不可用时不做兜底（不再 fallback 到 Ollama 默认 localhost:11434），保持原字段值，
     * 让后续真实请求自然报错，由上层正确显示——配置错误/模型不可用是正常情况，报错即可。
     *
     * @param llmIndex 用户选择的模型序号（null 表示默认第一个）
     */
    private void refreshFromSystemConfig(Integer llmIndex) {
        try {
            com.DocSystem.common.entity.SystemLLMConfig cfg =
                com.DocSystem.common.BaseFunction.systemLLMConfig;
            if (cfg == null || !cfg.enabled
                    || cfg.llmConfigList == null || cfg.llmConfigList.isEmpty()) {
                return; // DocSystem 未配置可用 LLM：不覆盖，交由真实请求报错
            }
            int idx = (llmIndex != null && llmIndex >= 0 && llmIndex < cfg.llmConfigList.size())
                ? llmIndex : 0;
            com.DocSystem.common.entity.LLMConfig m = cfg.llmConfigList.get(idx);
            applyConfig(m.url, m.modelName, m.apikey);
        } catch (Exception e) {
            log.warn("refreshFromSystemConfig failed (ignored, will use existing config): {}", e.getMessage());
        }
    }

    /**
     * 只读解析系统默认 LLM 配置（不写共享字段，无并发竞态）。
     *
     * <p>供无状态入口（{@link #chat(List, ResolvedLlmConfig)}）在 resolved=null 时回退使用：
     * 优先从 DocSystem 内存配置 {@code systemLLMConfig} 取第一个模型；
     * 未配置时回退当前共享字段（只读）。</p>
     */
    private ResolvedLlmConfig resolveDefaultConfig() {
        try {
            com.DocSystem.common.entity.SystemLLMConfig cfg =
                com.DocSystem.common.BaseFunction.systemLLMConfig;
            if (cfg != null && cfg.enabled
                    && cfg.llmConfigList != null && !cfg.llmConfigList.isEmpty()) {
                com.DocSystem.common.entity.LLMConfig m = cfg.llmConfigList.get(0);
                if (m != null && m.url != null && !m.url.isEmpty()) {
                    String modelName = m.modelName != null ? m.modelName : defaultModel;
                    return new ResolvedLlmConfig(m.url, modelName, m.apikey, modelName);
                }
            }
        } catch (Exception e) {
            log.warn("resolveDefaultConfig failed (using shared fields): {}", e.getMessage());
        }
        return new ResolvedLlmConfig(endpoint, defaultModel, apiKey, defaultModel);
    }

    /**
     * Get configuration summary (called from SubAgent).
     */
    public String getConfigSummary() {
        return "endpoint=" + endpoint + ", model=" + defaultModel + ", apiKey=" + (apiKey != null ? "***" : "null");
    }

    /**
     * Error handler for LLM failures.
     * Returns a user-friendly message instead of a raw exception.
     */
    private String handleLLMError(String message, String sessionId, String model, Exception e) {
        log.error("LLM call failed: {}", e.getMessage());
        return "抱歉，AI 服务暂时不可用（" + e.getClass().getSimpleName() + "），请稍后重试。";
    }

    /**
     * Error handler for streaming chat failures.
     * Returns an iterator with a single error marker so the SSE handler emits a proper error.
     */
    private Iterator<String> handleStreamError(String message, String sessionId, String model, Exception e) {
        log.error("LLM streaming failed: {}", e.getMessage());
        return Arrays.asList("[ERROR] 抱歉，AI 服务暂时不可用（" + e.getClass().getSimpleName() + "），请稍后重试。").iterator();
    }

    /**
     * Error handler for streaming chat (3-param overload).
     */
    private Iterator<String> handleStreamError(String message, String sessionId, Exception e) {
        log.error("LLM streaming failed: {}", e.getMessage());
        return Arrays.asList("[ERROR] 抱歉，AI 服务暂时不可用（" + e.getClass().getSimpleName() + "），请稍后重试。").iterator();
    }

    /**
     * Streaming chat - returns lines for SSE
     * Each line is a JSON object with "content" field for partial responses
     * or "done" for completion
     */
    // Note: @CircuitBreaker and @Retry annotations removed for Spring 4 compatibility
    public Iterator<String> streamChat(String message, String sessionId) throws IOException {
        // 每次流式对话前从 DocSystem 现取当前模型
        refreshFromSystemConfig(null);
        return streamChat(message, sessionId, defaultModel);
    }

    // Note: @CircuitBreaker and @Retry annotations removed for Spring 4 compatibility
    public Iterator<String> streamChat(String message, String sessionId, String model) throws IOException {
        // 向后兼容：用当前共享字段包装成 ResolvedLlmConfig
        return streamChat(message, sessionId,
                new ResolvedLlmConfig(endpoint, model, apiKey, defaultModel));
    }

    /**
     * 无状态流式对话入口：目标 endpoint/model/apiKey 全部来自 {@link ResolvedLlmConfig} 参数，
     * 作为局部变量传递，绝不写入共享字段 —— 因此并发请求各选各的模型互不干扰。
     */
    public Iterator<String> streamChat(String message, String sessionId, ResolvedLlmConfig resolved) throws IOException {
        List<String> chunks = new java.util.concurrent.CopyOnWriteArrayList<>();

        try {
            List<Map<String, String>> messages = conversationHistory.computeIfAbsent(
                sessionId, k -> new ArrayList<>()
            );

            if (messages.isEmpty()) {
                Map<String, String> sysMsg = new HashMap<>();
                sysMsg.put("role", "system");
                sysMsg.put("content", "DocSys document management context: help users with documents, " +
                               "repositories, and related tasks. Be concise and helpful. " +
                               "You do not know what model or architecture you run on — " +
                               "if asked, say you are an assistant in DocSys and focus on the user's needs.");
                messages.add(sysMsg);
            }
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", message);
            messages.add(userMsg);

            // 目标配置来自 resolved（请求级），全程局部变量，不写共享字段
            String streamEndpoint = resolved.endpoint;
            String streamModel = resolved.model;
            String streamApiKey = resolved.apiKey;
            boolean streamOpenAi = resolved.openAiCompatible;
            // Per D-07: Check circuit breaker state for primary/backup switching
            if (hasBackup && isPrimaryCircuitOpen()) {
                log.info("Primary LLM circuit breaker OPEN for streaming — switching to backup");
                streamEndpoint = backupEndpoint;
                streamModel = backupModel.isEmpty() ? defaultModel : backupModel;
                streamApiKey = apiKey;
                streamOpenAi = detectOpenAiCompatible(streamEndpoint);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", streamModel);
            requestBody.put("messages", messages);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("stream", true);

            String json = JSON.toJSONString(requestBody);
            // Zhipu BigModel 用 /v4，OpenAI/DeepSeek 等兼容 API 用 /v1
            String streamPath = (streamEndpoint != null && streamEndpoint.contains("bigmodel.cn"))
                    ? "/v4/chat/completions" : "/v1/chat/completions";
            String url = streamOpenAi ? streamEndpoint + streamPath : streamEndpoint + "/api/chat";

            Request.Builder reqBuilder = new Request.Builder()
                    .url(url)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(JSON_MEDIA, json));
            if (streamApiKey != null && !streamApiKey.isEmpty()) {
                reqBuilder.header("Authorization", "Bearer " + streamApiKey);
            }
            Request request = reqBuilder.build();

            Response response = httpClient.newCall(request).execute();
            try {
                if (response.code() == 200) {
                    ResponseBody respBody = response.body();
                    if (respBody != null) {
                        InputStream in = respBody.byteStream();
                        try (BufferedReader reader = new BufferedReader(
                                new InputStreamReader(in, StandardCharsets.UTF_8))) {
                            StringBuilder fullResponse = new StringBuilder();
                            String line;
                            while ((line = reader.readLine()) != null) {
                                if (line.startsWith("data: ")) {
                                    line = line.substring(6);
                                }
                                if (line.isEmpty() || line.equals("[DONE]")) continue;

                                try {
                                    JSONObject obj = JSON.parseObject(line);
                                    String content = null;
                                    boolean done = false;

                                    if (streamOpenAi) {
                                        // OpenAI SSE format: {"choices":[{"delta":{"content":"..."}}]}
                                        JSONArray choices = obj.getJSONArray("choices");
                                        if (choices != null && !choices.isEmpty()) {
                                            JSONObject delta = choices.getJSONObject(0).getJSONObject("delta");
                                            if (delta != null) content = delta.getString("content");
                                            // OpenAI uses choices[0].finish_reason != null to signal done
                                            String finishReason = choices.getJSONObject(0).getString("finish_reason");
                                            done = finishReason != null && !finishReason.isEmpty() && !"length".equals(finishReason);
                                        }
                                    } else {
                                        // Ollama SSE format: {"message":{"content":"..."},"done":true}
                                        JSONObject msg = obj.getJSONObject("message");
                                        if (msg != null) content = msg.getString("content");
                                        Boolean d = obj.getBoolean("done");
                                        done = d != null && d;
                                    }

                                    if (content != null && !content.isEmpty()) {
                                        fullResponse.append(content);
                                        chunks.add(content);
                                    }
                                    if (done) {
                                        chunks.add("[DONE]");
                                        // Add to history
                                        Map<String, String> asstMsg = new HashMap<>();
                                        asstMsg.put("role", "assistant");
                                        asstMsg.put("content", fullResponse.toString());
                                        messages.add(asstMsg);
                                        while (messages.size() > 20) messages.remove(1);
                                    }
                                } catch (Exception e) {
                                    // Skip malformed JSON
                                }
                            }
                        }
                    }
                } else {
                    // Non-200 response: throw so outer catch can rethrow to Resilience4j
                    throw new LlmHttpException(response.code(),
                        "LLM streaming returned HTTP " + response.code());
                }
            } finally {
                response.close();
            }
        } catch (Exception e) {
            log.error("LLM streaming failed, propagating to circuit breaker", e);
            throw new RuntimeException("LLM streaming failed: " + e.getMessage(), e);
        }

        // Ensure [DONE] is always present
        if (!chunks.isEmpty() && !"[DONE]".equals(chunks.get(chunks.size() - 1))) {
            chunks.add("[DONE]");
        }
        return chunks.iterator();
    }

    /**
     * 无状态多消息流式对话（T7.1.1/T7.1.2）：对偶 {@link #chat(List, ResolvedLlmConfig)} 的流式版本。
     *
     * <p>与现有 {@link #streamChat(String, String, ResolvedLlmConfig)} 的区别：</p>
     * <ul>
     *   <li>直接接收完整消息列表（自定义 system prompt / 工具结果回灌），不管理 conversationHistory；</li>
     *   <li>返回 {@link StreamChunk} 迭代器——text 与 reasoning 分片分离
     *       （OpenAI 兼容流 delta 的 {@code reasoning_content}/{@code reasoning} 字段）；</li>
     *   <li>全程请求级局部变量，不写共享字段（线程安全）。</li>
     * </ul>
     *
     * @param messages 完整消息列表（role ∈ system/user/assistant）
     * @param resolved 请求级模型配置；null 时回退系统默认（只读解析，不写共享字段）
     * @return StreamChunk 迭代器（末尾必有 done 标记）
     */
    public Iterator<StreamChunk> streamChatChunks(List<Map<String, String>> messages,
                                                  ResolvedLlmConfig resolved) throws IOException {
        try {
            if (resolved == null) {
                resolved = resolveDefaultConfig();
            }
            String streamEndpoint = resolved.endpoint;
            String streamModel = resolved.model;
            String streamApiKey = resolved.apiKey;
            boolean streamOpenAi = resolved.openAiCompatible;

            // Circuit breaker: primary/backup switching
            if (hasBackup && isPrimaryCircuitOpen()) {
                log.info("Primary LLM circuit breaker OPEN for streaming — switching to backup endpoint");
                streamEndpoint = backupEndpoint;
                streamModel = backupModel.isEmpty() ? defaultModel : backupModel;
                streamApiKey = apiKey;
                streamOpenAi = detectOpenAiCompatible(streamEndpoint);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", streamModel);
            requestBody.put("messages", messages);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("stream", true);

            String json = JSON.toJSONString(requestBody);
            // Zhipu BigModel 用 /v4，OpenAI/DeepSeek 等兼容 API 用 /v1
            String streamPath = (streamEndpoint != null && streamEndpoint.contains("bigmodel.cn"))
                    ? "/v4/chat/completions" : "/v1/chat/completions";
            String url = streamOpenAi ? streamEndpoint + streamPath : streamEndpoint + "/api/chat";

            Request.Builder reqBuilder = new Request.Builder()
                    .url(url)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(JSON_MEDIA, json));
            if (streamApiKey != null && !streamApiKey.isEmpty()) {
                reqBuilder.header("Authorization", "Bearer " + streamApiKey);
            }
            Request request = reqBuilder.build();

            Response response = httpClient.newCall(request).execute();
            if (response.code() != 200) {
                String errBody = "";
                try {
                    ResponseBody rb = response.body();
                    errBody = rb != null ? rb.string() : "";
                } catch (Exception ignored) {}
                response.close();
                log.warn("LLM streaming returned status {}: {}", response.code(), errBody);
                throw new LlmHttpException(response.code(),
                        "LLM streaming returned HTTP " + response.code() + ": " + errBody);
            }
            ResponseBody respBody = response.body();
            if (respBody == null) {
                response.close();
                List<StreamChunk> onlyDone = new ArrayList<>();
                onlyDone.add(StreamChunk.done());
                return onlyDone.iterator();
            }
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(respBody.byteStream(), StandardCharsets.UTF_8));
            // ★ 真流式：返回惰性迭代器，逐行读取 SSE 响应，分片到达即返回（绝不先缓冲全部）
            return new StreamChunkIterator(reader, response, streamOpenAi);
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            log.error("LLM streaming (chunks) failed: {}", e.getMessage());
            throw new RuntimeException("LLM streaming failed: " + e.getMessage(), e);
        }
    }

    /**
     * T10：流式原生工具调用通道 —— 请求携带 tools + tool_choice，
     * 逐 token 返回 text/reasoning 分片；流结束后、done 之前逐个返回 {@link StreamChunk#toolCall} 完成块。
     *
     * <p>端点 400 拒绝 tools（thinking 类模型）→ 自动去 tools 重试一次，并在分片最前返回
     * {@link StreamChunk#toolsRejected()} 标记块（调用方据此在后续轮次关闭 tools）。</p>
     *
     * @param messages   完整消息列表（role ∈ system/user/assistant/tool）
     * @param resolved   请求级模型配置
     * @param tools      OpenAI 格式工具数组（null/空 → 不带 tools，等价旧 streamChatChunks）
     * @param toolChoice "auto"/null → auto；其它值原样下发
     */
    public Iterator<StreamChunk> streamChatChunksNative(List<Map<String, Object>> messages,
                                                        ResolvedLlmConfig resolved,
                                                        JSONArray tools, String toolChoice) throws IOException {
        try {
            if (resolved == null) {
                resolved = resolveDefaultConfig();
            }
            String streamEndpoint = resolved.endpoint;
            String streamModel = resolved.model;
            String streamApiKey = resolved.apiKey;
            boolean streamOpenAi = resolved.openAiCompatible;

            // Circuit breaker: primary/backup switching
            if (hasBackup && isPrimaryCircuitOpen()) {
                log.info("Primary LLM circuit breaker OPEN for streaming — switching to backup endpoint");
                streamEndpoint = backupEndpoint;
                streamModel = backupModel.isEmpty() ? defaultModel : backupModel;
                streamApiKey = apiKey;
                streamOpenAi = detectOpenAiCompatible(streamEndpoint);
            }

            boolean toolsRequested = tools != null && !tools.isEmpty();
            String effectiveToolChoice = toolsRequested
                    ? (toolChoice != null && !toolChoice.trim().isEmpty() ? toolChoice.trim() : "auto")
                    : null;
            StreamOpenResult open = openStreamResponse(streamEndpoint, streamModel, streamApiKey,
                    streamOpenAi, messages, toolsRequested ? tools : null, effectiveToolChoice);

            ResponseBody respBody = open.response.body();
            if (respBody == null) {
                open.response.close();
                List<StreamChunk> onlyDone = new ArrayList<>();
                onlyDone.add(StreamChunk.done());
                return onlyDone.iterator();
            }
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(respBody.byteStream(), StandardCharsets.UTF_8));
            // ★ 真流式：返回惰性迭代器，逐行读取 SSE；text/reasoning 即时返回，tool_calls 流末聚合，done 收尾
            return new StreamChunkIterator(reader, open.response, streamOpenAi,
                    toolsRequested, open.toolsRejected);
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            log.error("LLM native streaming failed: {}", e.getMessage());
            throw new RuntimeException("LLM native streaming failed: " + e.getMessage(), e);
        }
    }

    /** 打开流式响应；带 tools 时 400 → 去 tools 重试一次并置 toolsRejected */
    private static class StreamOpenResult {
        final Response response;
        final boolean toolsRejected;
        StreamOpenResult(Response response, boolean toolsRejected) {
            this.response = response;
            this.toolsRejected = toolsRejected;
        }
    }

    private StreamOpenResult openStreamResponse(String endpoint, String model, String apiKey,
            boolean openAi, List<Map<String, Object>> messages, JSONArray tools, String toolChoice)
            throws IOException {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("stream", true);
        if (tools != null && !tools.isEmpty()) {
            requestBody.put("tools", tools);
            requestBody.put("tool_choice", toolChoice != null ? toolChoice : "auto");
        }

        String json = JSON.toJSONString(requestBody);
        String streamPath = (endpoint != null && endpoint.contains("bigmodel.cn"))
                ? "/v4/chat/completions" : "/v1/chat/completions";
        String url = openAi ? endpoint + streamPath : endpoint + "/api/chat";

        Request.Builder reqBuilder = new Request.Builder()
                .url(url)
                .header("Content-Type", "application/json")
                .post(RequestBody.create(JSON_MEDIA, json));
        if (apiKey != null && !apiKey.isEmpty()) {
            reqBuilder.header("Authorization", "Bearer " + apiKey);
        }
        Request request = reqBuilder.build();

        Response response = httpClient.newCall(request).execute();
        if (response.code() == 400 && tools != null && !tools.isEmpty()) {
            String errBody = "";
            try {
                ResponseBody rb = response.body();
                errBody = rb != null ? rb.string() : "";
            } catch (Exception ignored) {}
            response.close();
            log.warn("LLM native streaming tools rejected (HTTP 400) — retrying once without tools: {}",
                    errBody != null && errBody.length() > 300 ? errBody.substring(0, 300) : errBody);
            // 去 tools 重试（toolChoice 一并去掉）
            Map<String, Object> retryBody = new HashMap<>();
            retryBody.put("model", model);
            retryBody.put("messages", messages);
            retryBody.put("temperature", temperature);
            retryBody.put("max_tokens", maxTokens);
            retryBody.put("stream", true);
            Request.Builder retryBuilder = new Request.Builder()
                    .url(url)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(JSON_MEDIA, JSON.toJSONString(retryBody)));
            if (apiKey != null && !apiKey.isEmpty()) {
                retryBuilder.header("Authorization", "Bearer " + apiKey);
            }
            Response retryResponse = httpClient.newCall(retryBuilder.build()).execute();
            if (retryResponse.code() != 200) {
                String err2 = "";
                try {
                    ResponseBody rb2 = retryResponse.body();
                    err2 = rb2 != null ? rb2.string() : "";
                } catch (Exception ignored) {}
                retryResponse.close();
                throw new LlmHttpException(retryResponse.code(),
                        "LLM streaming returned HTTP " + retryResponse.code() + ": " + err2);
            }
            return new StreamOpenResult(retryResponse, true);
        }
        if (response.code() != 200) {
            String errBody = "";
            try {
                ResponseBody rb = response.body();
                errBody = rb != null ? rb.string() : "";
            } catch (Exception ignored) {}
            response.close();
            log.warn("LLM native streaming returned status {}: {}", response.code(), errBody);
            throw new LlmHttpException(response.code(),
                    "LLM streaming returned HTTP " + response.code() + ": " + errBody);
        }
        return new StreamOpenResult(response, false);
    }

    /**
     * 惰性流式迭代器（T7.1.1 真流式核心；T10 扩展工具收集）：
     * 持有 OkHttp Response + BufferedReader，每次 hasNext/next 才读下一行 SSE；
     * reasoning/text 分片到达即返回；流结束（[DONE]/finish_reason/EOF）前，
     * 若收集到原生 tool_calls（collectToolCalls）则先逐个返回 tool_call 完成块，
     * 最后返回 done 并关闭响应。toolsRejected 时首个分片为 tools_rejected 标记块。
     *
     * <p>不缓冲全部文本分片 → 调用方（ToolUseLoop/AgentController）逐分片回调，
     * 前端才能逐 token 实时渲染。流式异常/自然结束一律兜底 done（不抛给调用方）。</p>
     */
    private static class StreamChunkIterator implements Iterator<StreamChunk> {

        /** 工具调用累积桶（key = delta.tool_calls[].index） */
        private static final class ToolCallAcc {
            String id;
            String name;
            final StringBuilder args = new StringBuilder();
        }

        private final BufferedReader reader;
        private final Response response;
        private final boolean openAi;
        private final boolean collectToolCalls;
        private final boolean toolsRejected;
        private final Map<Integer, ToolCallAcc> toolCallAccs = new LinkedHashMap<>();
        private final Deque<StreamChunk> pending = new ArrayDeque<>();
        private StreamChunk next;
        private boolean finished = false;
        private boolean toolCallsFlushed = false;
        private boolean closed = false;

        StreamChunkIterator(BufferedReader reader, Response response, boolean openAi) {
            this(reader, response, openAi, false, false);
        }

        StreamChunkIterator(BufferedReader reader, Response response, boolean openAi,
                            boolean collectToolCalls, boolean toolsRejected) {
            this.reader = reader;
            this.response = response;
            this.openAi = openAi;
            this.collectToolCalls = collectToolCalls;
            this.toolsRejected = toolsRejected;
        }

        @Override
        public boolean hasNext() {
            if (next != null) return true;
            if (!pending.isEmpty()) {
                next = pending.poll();
                return true;
            }
            if (finished) return false;
            next = readNext();
            return next != null;
        }

        @Override
        public StreamChunk next() {
            if (!hasNext()) {
                throw new NoSuchElementException("stream already finished");
            }
            StreamChunk c = next;
            next = null;
            return c;
        }

        /** 读下一行 SSE 并解析为分片；返回 null 表示流已结束（done 已发出） */
        private StreamChunk readNext() {
            if (!pending.isEmpty()) {
                return pending.poll();
            }
            try {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("data: ")) {
                        line = line.substring(6);
                    }
                    if (line.isEmpty() || line.equals("[DONE]")) continue;

                    try {
                        JSONObject obj = JSON.parseObject(line);
                        String text = null;
                        String reasoning = null;
                        boolean done = false;

                        if (openAi) {
                            // OpenAI SSE format: {"choices":[{"delta":{"content":"...","reasoning_content":"..."}}]}
                            JSONArray choices = obj.getJSONArray("choices");
                            if (choices != null && !choices.isEmpty()) {
                                JSONObject delta = choices.getJSONObject(0).getJSONObject("delta");
                                if (delta != null) {
                                    text = delta.getString("content");
                                    // reasoning 字段：DeepSeek/Qwen/GLM 等用 reasoning_content，部分模型用 reasoning
                                    reasoning = delta.getString("reasoning_content");
                                    if (reasoning == null) {
                                        reasoning = delta.getString("reasoning");
                                    }
                                    // T10：原生工具调用 delta（按 index 聚合 id/name/arguments 分片）
                                    if (collectToolCalls) {
                                        accumulateToolCallDelta(delta);
                                    }
                                }
                                String finishReason = choices.getJSONObject(0).getString("finish_reason");
                                done = finishReason != null && !finishReason.isEmpty() && !"length".equals(finishReason);
                            }
                        } else {
                            // Ollama SSE format: {"message":{"content":"..."},"done":true}
                            JSONObject msg = obj.getJSONObject("message");
                            if (msg != null) {
                                text = msg.getString("content");
                                reasoning = msg.getString("reasoning_content");
                                if (reasoning == null) {
                                    reasoning = msg.getString("reasoning");
                                }
                            }
                            Boolean d = obj.getBoolean("done");
                            done = d != null && d;
                        }

                        if (reasoning != null && !reasoning.isEmpty()) {
                            return StreamChunk.reasoning(reasoning);
                        }
                        if (text != null && !text.isEmpty()) {
                            return StreamChunk.text(text);
                        }
                        if (done) {
                            finish();
                            return nextFromPendingOrDone();
                        }
                    } catch (Exception e) {
                        // Skip malformed JSON line
                    }
                }
                // 流自然结束（EOF）
                finish();
                return nextFromPendingOrDone();
            } catch (Exception e) {
                log.warn("LLM SSE stream read error (falling back to done): {}", e.getMessage());
                finish();
                return nextFromPendingOrDone();
            }
        }

        /** T10：聚合一条 delta.tool_calls（index 分桶；id/name 覆盖；arguments 拼接） */
        private void accumulateToolCallDelta(JSONObject delta) {
            JSONArray tcs = delta.getJSONArray("tool_calls");
            if (tcs == null) {
                return;
            }
            for (int i = 0; i < tcs.size(); i++) {
                JSONObject tc = tcs.getJSONObject(i);
                if (tc == null) {
                    continue;
                }
                Integer index = tc.getInteger("index");
                if (index == null) {
                    index = toolCallAccs.size();
                }
                ToolCallAcc acc = toolCallAccs.get(index);
                if (acc == null) {
                    acc = new ToolCallAcc();
                    toolCallAccs.put(index, acc);
                }
                String id = tc.getString("id");
                if (id != null) {
                    acc.id = id;
                }
                JSONObject fn = tc.getJSONObject("function");
                if (fn != null) {
                    String name = fn.getString("name");
                    if (name != null) {
                        acc.name = name;
                    }
                    String argsFrag = fn.getString("arguments");
                    if (argsFrag != null) {
                        acc.args.append(argsFrag);
                    }
                }
            }
        }

        private StreamChunk nextFromPendingOrDone() {
            return pending.isEmpty() ? StreamChunk.done() : pending.poll();
        }

        private void finish() {
            if (finished) return;
            finished = true;
            flushToolCalls();
            close();
        }

        /** 流末聚合输出：tools_rejected 标记 → 各 tool_call 完成块 → done（保持顺序） */
        private void flushToolCalls() {
            if (toolCallsFlushed) return;
            toolCallsFlushed = true;
            if (toolsRejected) {
                pending.add(StreamChunk.toolsRejected());
            }
            if (collectToolCalls) {
                for (ToolCallAcc acc : toolCallAccs.values()) {
                    JSONObject args = new JSONObject();
                    String argsStr = acc.args.toString();
                    if (!argsStr.trim().isEmpty()) {
                        try {
                            JSONObject parsed = JSON.parseObject(argsStr);
                            if (parsed != null) {
                                args = parsed;
                            }
                        } catch (Exception e) {
                            log.warn("LLM native stream tool_call arguments not JSON: {}", argsStr);
                        }
                    }
                    String name = acc.name != null ? acc.name : "";
                    pending.add(StreamChunk.toolCall(new ToolCall(acc.id, name, args, argsStr)));
                }
            }
            pending.add(StreamChunk.done());
        }

        private void close() {
            if (closed) return;
            closed = true;
            try {
                response.close();
            } catch (Exception ignored) {}
        }
    }
}
