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

    public ResolvedLlmConfig(String endpoint, String model, String apiKey, String displayName) {
        this(endpoint, model, apiKey, displayName, false);
    }

    /**
     * @param supportsVision 该模型是否支持图片输入（多模态）；不确定时传 false（宁可不送图，也不要臆造）
     */
    public ResolvedLlmConfig(String endpoint, String model, String apiKey, String displayName,
                            boolean supportsVision) {
        this.endpoint = endpoint;
        this.model = model;
        this.apiKey = apiKey;
        this.displayName = displayName;
        this.supportsVision = supportsVision;
        this.openAiCompatible = LLMService.detectOpenAiCompatible(endpoint);
    }

    @Override
    public String toString() {
        return "ResolvedLlmConfig{name=" + displayName + ", endpoint=" + endpoint
                + ", model=" + model + ", openAiCompatible=" + openAiCompatible
                + ", supportsVision=" + supportsVision
                + ", apiKey=" + (apiKey != null && !apiKey.isEmpty() ? "***" : "null") + "}";
    }
}
