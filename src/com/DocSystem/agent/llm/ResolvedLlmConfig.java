package com.DocSystem.agent.llm;

/**
 * 已解析的、请求级别的 LLM 配置 —— 不可变值对象。
 *
 * <p>用于把"用户选定的模型"从 Controller 贯穿到 {@link LLMService} 的无状态入口，
 * 全程作为方法参数/局部变量传递，绝不写入 LLMService 的共享可变字段，
 * 因此多个并发 SSE 请求各自选不同模型时互不干扰。
 */
public final class ResolvedLlmConfig {

    public final String endpoint;
    public final String model;
    public final String apiKey;
    public final boolean openAiCompatible;
    /** 显示名，仅用于日志/回显，不参与请求 */
    public final String displayName;
    /**
     * 是否支持图片输入（多模态）。
     *
     * <p>默认 false（与改造前行为一致）。接入多模态时，它是「要不要走视觉路径」的**唯一事实来源**：
     * 模型配置里声明后，注入块文案与图片传递方式都按它分支（见 `devDocs/Agent关注对象与操作设计方案.md` §14.8）。
     * 预留字段，目前尚未接线。
     */
    public final boolean supportsVision;

    /**
     * 本模型的**最大输出 token**（null = 用 {@code LLMService} 的全局默认 {@code llm.max-tokens}）。
     *
     * <p>2026-10-08 接线：来源为「AI接入设置 → 高级参数 → maxTokens」（落库
     * `agent_config.llm_models[].settings.maxTokens`）。此前**只存不用**（见
     * devDocs/参数存储策略与参数清单.md §2.2-7）——而推理模型的 reasoning 也吃这个预算，
     * 撞上限会返回 {@code finish_reason=length} + 空正文，表现为"Agent 中途停止"。</p>
     */
    public final Integer maxTokens;

    /** maxTokens 合法区间（越界视为未配置，回落全局默认） */
    public static final int MIN_MAX_TOKENS = 16;
    public static final int MAX_MAX_TOKENS = 200000;

    public ResolvedLlmConfig(String endpoint, String model, String apiKey, String displayName) {
        this(endpoint, model, apiKey, displayName, false, null);
    }

    /**
     * @param supportsVision 该模型是否支持图片输入（多模态）；不确定时传 false（宁可不送图，也不要臆造）
     */
    public ResolvedLlmConfig(String endpoint, String model, String apiKey, String displayName,
                            boolean supportsVision) {
        this(endpoint, model, apiKey, displayName, supportsVision, null);
    }

    /**
     * @param maxTokens 该模型的最大输出 token；null/越界 = 用全局默认
     */
    public ResolvedLlmConfig(String endpoint, String model, String apiKey, String displayName,
                            boolean supportsVision, Integer maxTokens) {
        this.endpoint = endpoint;
        this.model = model;
        this.apiKey = apiKey;
        this.displayName = displayName;
        this.supportsVision = supportsVision;
        this.maxTokens = maxTokens;
        this.openAiCompatible = LLMService.detectOpenAiCompatible(endpoint);
    }

    /** 复制一份并替换最大输出 token（"撞输出上限 → 升级重试一次"用，见 MainAgent） */
    public ResolvedLlmConfig withMaxTokens(int newMaxTokens) {
        return new ResolvedLlmConfig(endpoint, model, apiKey, displayName, supportsVision,
                Integer.valueOf(newMaxTokens));
    }

    /**
     * 从模型高级参数（settings）里解析 maxTokens；**非法/越界/缺失 → null**（回落全局默认，绝不抛异常）。
     *
     * <p>兼容两种写法：`maxTokens`（管理端「高级参数」表单写入的键）与 `max_tokens`（自定义 kv 手填）。</p>
     */
    public static Integer parseMaxTokens(com.alibaba.fastjson.JSONObject settings) {
        if (settings == null) {
            return null;
        }
        String raw = settings.getString("maxTokens");
        if (raw == null || raw.trim().isEmpty()) {
            raw = settings.getString("max_tokens");
        }
        return normalizeMaxTokens(raw);
    }

    /** 同 {@link #parseMaxTokens}，但入参是 settings 的 JSON 文本（用户自定义模型表存的是字符串） */
    public static Integer parseMaxTokensFromJson(String settingsJson) {
        if (settingsJson == null || settingsJson.trim().isEmpty()) {
            return null;
        }
        try {
            return parseMaxTokens(com.alibaba.fastjson.JSON.parseObject(settingsJson));
        } catch (Exception e) {
            return null;
        }
    }

    private static Integer normalizeMaxTokens(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }
        try {
            int v = Integer.parseInt(raw.trim());
            if (v < MIN_MAX_TOKENS || v > MAX_MAX_TOKENS) {
                return null;
            }
            return Integer.valueOf(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Override
    public String toString() {
        return "ResolvedLlmConfig{name=" + displayName + ", endpoint=" + endpoint
                + ", model=" + model + ", openAiCompatible=" + openAiCompatible
                + ", supportsVision=" + supportsVision
                + ", maxTokens=" + maxTokens
                + ", apiKey=" + (apiKey != null && !apiKey.isEmpty() ? "***" : "null") + "}";
    }
}
