package com.DocSystem.agent.nlu;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.agent.llm.LLMService;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * LLM-powered Intent Parser.
 *
 * Uses the Ollama LLM (via LLMService or direct HTTP) to perform
 * zero-shot intent classification and entity extraction on natural-language
 * user queries.  Falls back to an empty result when the LLM is unavailable
 * or the confidence is too low, allowing the caller to fall back to
 * regex-based parsing.
 *
 * <b>Skill-first routing:</b> External skills are dynamically injected into
 * the prompt via SkillIntentRegistry, so the LLM can route to them directly.
 * A trigger-based fallback in MainAgent catches high-confidence skill matches
 * that the LLM may have missed.
 *
 * <b>No session history pollution:</b> requests are sent as single-shot
 * HTTP calls directly to the Ollama endpoint without touching the
 * LLMService conversation history.
 *
 * <p><b>LEGACY-FALLBACK（R3-4 裁定，2026-09-21）</b>：本类只被旧编排使用
 * （{@code MainAgent} 的 {@code decomposeTask} 段），主路径 {@code ToolUseLoop} 不依赖它。
 * 处置 = **冻结**：只修 bug，禁止新增能力（新能力做成工具）。
 *
 * @deprecated R3-4（2026-09-21）：旧编排兜底组件，随旧编排冻结。
 */
@Deprecated
public class LLMIntentParser {

    private static final Logger log = LoggerFactory.getLogger(LLMIntentParser.class);

    /** Default Ollama endpoint used when no LLMService is injected. */
    private static final String DEFAULT_ENDPOINT = "http://localhost:11434";

    /** Default model name. */
    private static final String DEFAULT_MODEL = "gemma4:e2b";

    /** Timeout for a single LLM call in milliseconds (configurable via -Dllm.intent-timeout=N). */
    private static final int LLM_TIMEOUT_MS = Integer.getInteger("llm.intent-timeout", 300000);

    /** Confidence threshold below which the caller should fall back to regex. */
    private static final float CONFIDENCE_THRESHOLD = 0.6f;

    /** Skill registry for dynamic external skill injection */
    private static final SkillIntentRegistry SKILL_REGISTRY = SkillIntentRegistry.getInstance();

    /** Shared HTTP client for single-shot LLM calls. */
    private static final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(LLM_TIMEOUT_MS, TimeUnit.MILLISECONDS)
            .readTimeout(LLM_TIMEOUT_MS, TimeUnit.MILLISECONDS)
            .writeTimeout(LLM_TIMEOUT_MS, TimeUnit.MILLISECONDS)
            .build();

    /** Shared executor for async HTTP calls with timeouts. */
    private static final ExecutorService HTTP_EXECUTOR = Executors.newCachedThreadPool();

    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    /**
     * Base prompt for zero-shot intent classification.
     * Structured as a system instruction + few-shot examples so the model
     * always returns a valid JSON object.
     */
    private static final String INTENT_PROMPT_BASE =
            "你是一个意图识别专家。用户输入一个查询，你需要：\n" +
            "1. 识别用户意图（intent）：list_repos | list_docs | create_repos | delete_repos | " +
            "delete_docs | search | upload | download | chat | help | whoami | unknown\n" +
            "2. 识别子任务类型（subTaskType），用于路由到 decomposeTask：\n" +
            "   list_repos | list_docs | add_repos | delete_repos | delete_docs | " +
            "   search_and_load | upload_doc | download_doc | whoami | chat | " +
            "   help | web_search\n" +
            "3. 提取关键实体（entities），如 vid、docId、query、name、topic（只包含有值的）\n" +
            "4. 给出置信度（confidence）：0.0-1.0（越高越确定）\n" +
            "5. 给出简要推理（reasoning）：一句话说明判断理由\n\n" +
            "意图判断规则：\n" +
            "- \"列出/查看/有哪些仓库\" -> intent=list_repos, subTaskType=list_repos\n" +
            "- \"列出/查看文档\" -> intent=list_docs, subTaskType=list_docs\n" +
            "- \"创建仓库/新建仓库\" -> intent=create_repos, subTaskType=add_repos\n" +
            "- \"搜索/查询/查找xxx\" -> intent=search, subTaskType=search_and_load\n" +
            "- \"上传/添加文档\" -> intent=upload, subTaskType=upload_doc\n" +
            "- \"下载文档\" -> intent=download, subTaskType=download_doc\n" +
            "- \"删除仓库\" -> intent=delete_repos, subTaskType=delete_repos\n" +
            "- \"删除文档\" -> intent=delete_docs, subTaskType=delete_docs\n" +
            "- \"关于/介绍/是什么/了解一下\" -> intent=chat, subTaskType=search_and_answer\n" +
            "- \"whoami/我是谁\" -> intent=whoami, subTaskType=whoami\n" +
            "- \"help/帮助/怎么用\" -> intent=help, subTaskType=help\n" +
            "- \"搜索网页/网上搜索\" -> intent=web_search, subTaskType=web_search\n\n" +
            "返回JSON格式（不要包含任何其他文字）：\n" +
            "{\"intent\":\"...\",\"subTaskType\":\"...\",\"confidence\":0.95," +
            "\"entities\":{\"vid\":\"...\",\"query\":\"...\",\"name\":\"...\",\"topic\":\"...\"}," +
            "\"reasoning\":\"...\"}\n\n" +
            "示例：\n" +
            "输入：\"列出我的仓库\" -> {\"intent\":\"list_repos\",\"subTaskType\":\"list_repos\",\"confidence\":0.98,\"entities\":{},\"reasoning\":\"用户要求列出仓库\"}\n" +
            "输入：\"帮我搜索合同相关文档\" -> {\"intent\":\"search\",\"subTaskType\":\"search_and_load\",\"confidence\":0.95,\"entities\":{\"query\":\"合同\"},\"reasoning\":\"用户要求搜索文档\"}\n" +
            "输入：\"hello\" -> {\"intent\":\"chat\",\"subTaskType\":\"chat\",\"confidence\":0.9,\"entities\":{},\"reasoning\":\"简单的打招呼\"}\n" +
            "输入：\"我是谁\" -> {\"intent\":\"whoami\",\"subTaskType\":\"whoami\",\"confidence\":0.98,\"entities\":{},\"reasoning\":\"用户询问身份\"}\n\n" +
            "现在请分析以下输入：\n";

    /** System-level instruction prepended before the user query. */
    private static final String SYSTEM_INSTRUCTION =
            "You are an intent recognition expert for a document management system assistant. " +
            "Always respond with valid JSON only, no additional text. " +
            "The JSON must contain exactly these fields: intent, subTaskType, confidence, entities, reasoning.";

    /**
     * Build the full intent prompt with dynamic external skill injection.
     * External skills from SkillIntentRegistry are injected so the LLM knows
     * about them and can route to them directly via subTaskType = skillId.
     */
    private static String getIntentPrompt() {
        return INTENT_PROMPT_BASE + SKILL_REGISTRY.buildSkillPromptSection();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Parse a user query using the provided LLMService.
     *
     * <p>This overload is useful when the application already has an
     * LLMService bean (e.g. via dependency injection).  It respects the
     * service's configured endpoint and model.</p>
     *
     * @param userQuery  the raw user query (Chinese or English)
     * @param llmService the injected LLMService bean
     * @return an IntentResult; callers should check {@link IntentResult#isFromLLM()}
     *         and {@link IntentResult#getConfidence()} to decide on fallback
     */
    public static IntentResult parse(String userQuery, LLMService llmService) {
        if (userQuery == null || userQuery.trim().isEmpty()) {
            return IntentResult.unknown(null);
        }

        if (llmService == null || !llmService.isAvailable()) {
            log.debug("LLM unavailable, returning empty IntentResult for fallback");
            return IntentResult.empty();
        }

        IntentResult result = callLLMWithPrompt(userQuery, llmService);

        if (!result.isFromLLM() || result.getConfidence() < CONFIDENCE_THRESHOLD) {
            log.debug("LLM returned low confidence ({}) or parse failed, fallback will be used",
                    result.getConfidence());
            // Still return the result so caller can inspect it
        }

        return result;
    }

    /**
     * Parse a user query using default Ollama endpoint and model directly.
     *
     * <p>This overload bypasses LLMService entirely and sends a single-shot
     * HTTP request, so it never pollutes conversation history and adds no
     * Spring dependencies.</p>
     *
     * @param userQuery the raw user query
     * @return an IntentResult
     */
    public static IntentResult parse(String userQuery) {
        return parse(userQuery, DEFAULT_ENDPOINT, DEFAULT_MODEL);
    }

    /**
     * Parse a user query using an explicit endpoint and model.
     *
     * @param userQuery the raw user query
     * @param endpoint  Ollama base URL, e.g. "http://localhost:11434"
     * @param model     model name, e.g. "qwen2.5:7b"
     * @return an IntentResult
     */
    public static IntentResult parse(String userQuery, String endpoint, String model) {
        if (userQuery == null || userQuery.trim().isEmpty()) {
            return IntentResult.unknown(null);
        }

        IntentResult result = callDirect(endpoint, model, userQuery);

        if (!result.isFromLLM() || result.getConfidence() < CONFIDENCE_THRESHOLD) {
            log.debug("LLM returned low confidence ({}) or parse failed, fallback will be used",
                    result.getConfidence());
        }

        return result;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Use LLMService.chat() but without polluting conversation history.
     *
     * <p>Instead of going through the session-history mechanism we build a
     * single-shot request body and call the Ollama /api/chat endpoint
     * directly so that each parse() call is independent.</p>
     */
    private static IntentResult callLLMWithPrompt(String userQuery, LLMService llmService) {
        String fullPrompt = getIntentPrompt() + userQuery;

        try {
            String response = llmService.chat(fullPrompt, "nlu-parse-" + System.currentTimeMillis());
            return parseLLMResponse(response, userQuery);
        } catch (Exception e) {
            log.warn("LLM chat failed during intent parsing: {}", e.getMessage());
            return IntentResult.empty();
        }
    }

    /**
     * Direct HTTP call to Ollama /api/chat, bypassing LLMService.
     * Uses its own OkHttpClient with a configurable timeout.
     */
    private static IntentResult callDirect(String endpoint, String model, String userQuery) {
        String fullPrompt = getIntentPrompt() + userQuery;

        // Build messages array: system + user
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_INSTRUCTION);
        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", fullPrompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", new Object[] { systemMsg, userMsg });
        requestBody.put("temperature", 0.1);  // Low temperature for deterministic output
        requestBody.put("max_tokens", 512);
        requestBody.put("stream", false);

        String jsonBody = JSON.toJSONString(requestBody);

        final Request request = new Request.Builder()
                .url(endpoint + "/api/chat")
                .post(RequestBody.create(JSON_MEDIA_TYPE, jsonBody))
                .build();

        Future<Response> future = HTTP_EXECUTOR.submit(new Callable<Response>() {
            @Override
            public Response call() throws Exception {
                return httpClient.newCall(request).execute();
            }
        });

        Response response = null;
        try {
            response = future.get(LLM_TIMEOUT_MS, TimeUnit.MILLISECONDS);

            if (response.isSuccessful()) {
                String body = response.body() != null ? response.body().string() : "";
                return parseLLMResponse(body, userQuery);
            } else {
                String errBody = response.body() != null ? response.body().string() : "";
                log.warn("Ollama returned HTTP {}: {}", response.code(), errBody);
                return IntentResult.empty();
            }

        } catch (TimeoutException e) {
            log.warn("LLM intent parsing timed out after {} ms", LLM_TIMEOUT_MS);
            return IntentResult.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("LLM intent parsing was interrupted");
            return IntentResult.empty();
        } catch (Exception e) {
            log.warn("LLM intent parsing failed: {}", e.getMessage());
            return IntentResult.empty();
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }

    /**
     * Parse the raw JSON string returned by the LLM into an IntentResult.
     *
     * <p>If parsing fails for any reason (malformed JSON, missing fields,
     * empty content) an empty result is returned so the caller falls back
     * to regex.</p>
     */
    @SuppressWarnings("unchecked")
    private static IntentResult parseLLMResponse(String rawResponse, String userQuery) {
        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            log.debug("Empty LLM response");
            return IntentResult.empty();
        }

        try {
            // The LLM may wrap the JSON in markdown fences
            String trimmed = rawResponse.trim();
            if (trimmed.startsWith("```")) {
                int firstBrace = trimmed.indexOf('{');
                int lastBrace  = trimmed.lastIndexOf('}');
                if (firstBrace >= 0 && lastBrace > firstBrace) {
                    trimmed = trimmed.substring(firstBrace, lastBrace + 1);
                }
            }

            JSONObject json = JSON.parseObject(trimmed);

            IntentResult result = new IntentResult();
            result.setRawQuery(userQuery);
            result.setFromLLM(true);

            result.setIntent(json.getString("intent") != null
                    ? json.getString("intent")
                    : "unknown");

            result.setSubTaskType(json.getString("subTaskType") != null
                    ? json.getString("subTaskType")
                    : result.getIntent());

            float conf;
            if (json.containsKey("confidence")) {
                conf = json.getFloatValue("confidence");
                // Clamp to valid range; treat 0.0 as a missing value (LLM failed to provide it)
                if (conf <= 0.0f || conf > 1.0f) {
                    conf = 0.5f;
                }
            } else {
                conf = 0.5f;
            }
            result.setConfidence(conf);

            JSONObject entitiesObj = json.getJSONObject("entities");
            if (entitiesObj != null) {
                Map<String, String> entities = new HashMap<>();
                entitiesObj.forEach((k, v) -> {
                    if (v != null) {
                        entities.put(k, v.toString());
                    }
                });
                result.setEntities(entities);
            }

            result.setReasoning(json.getString("reasoning"));

            log.debug("Parsed IntentResult: {}", result);
            return result;

        } catch (Exception e) {
            log.warn("Failed to parse LLM response as JSON: {}. Response was: {}",
                    e.getMessage(), rawResponse);
            return IntentResult.empty();
        }
    }
}
