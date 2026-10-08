package com.DocSystem.agent.llm;

import com.DocSystem.agent.learning.entity.UserCustomLlmModel;
import com.DocSystem.agent.learning.repository.UserCustomLlmModelRepository;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.entity.LLMConfig;
import com.DocSystem.common.entity.SystemLLMConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 用户自定义 LLM 模型服务 + 模型选择解析器。
 *
 * <p>模型来源两类：
 * <ul>
 *   <li>系统模型：DocSystem 后台配置的 {@link BaseFunction#systemLLMConfig}，所有用户可见，selector = {@code sys:<idx>} 或 {@code sys:<name>}</li>
 *   <li>用户自定义模型：本表 user_custom_llm_models，仅本人可见，selector = {@code user:<id>}</li>
 * </ul>
 */
@Service
public class UserLlmModelService {

    private static final Logger log = LoggerFactory.getLogger(UserLlmModelService.class);

    @Autowired(required = false)
    private UserCustomLlmModelRepository repository;

    // ==================== CRUD ====================

    public List<UserCustomLlmModel> listForUser(String userId) {
        if (repository == null || userId == null) return new ArrayList<>();
        List<UserCustomLlmModel> list = repository.findByUserId(userId);
        return list != null ? list : new ArrayList<>();
    }

    public UserCustomLlmModel get(Long id, String userId) {
        if (repository == null || id == null || userId == null) return null;
        return repository.findByIdAndUserId(id, userId);
    }

    public UserCustomLlmModel create(String userId, String tenantId, String name,
            String modelName, String endpoint, String apiKey, String settings) {
        if (repository == null) return null;
        UserCustomLlmModel m = new UserCustomLlmModel();
        m.setUserId(userId);
        m.setTenantId(tenantId);
        m.setName(name);
        m.setModelName(modelName);
        m.setEndpoint(endpoint);
        m.setApiKey(apiKey);
        m.setSettings(settings);
        LocalDateTime now = LocalDateTime.now();
        m.setCreatedAt(now);
        m.setUpdatedAt(now);
        repository.insert(m);
        return m;
    }

    /**
     * 更新自定义模型。apiKey 为 null/空时保留原值（前端编辑时留空 = 不改 Key）。
     * @return 更新后的实体；行不存在或不属于该用户则返回 null。
     */
    public UserCustomLlmModel update(Long id, String userId, String name,
            String modelName, String endpoint, String apiKey, String settings) {
        if (repository == null || id == null || userId == null) return null;
        UserCustomLlmModel existing = repository.findByIdAndUserId(id, userId);
        if (existing == null) return null;
        existing.setName(name);
        existing.setModelName(modelName);
        existing.setEndpoint(endpoint);
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            existing.setApiKey(apiKey);
        }
        existing.setSettings(settings);
        existing.setUpdatedAt(LocalDateTime.now());
        repository.updateByIdAndUserId(existing);
        return existing;
    }

    public boolean delete(Long id, String userId) {
        if (repository == null || id == null || userId == null) return false;
        return repository.deleteByIdAndUserId(id, userId) > 0;
    }

    // ==================== 选择解析 ====================

    /**
     * 解析前端传来的 selector 为可直接使用的 {@link ResolvedLlmConfig}。
     * <ul>
     *   <li>{@code sys:<idx>} / {@code sys:<name>} → 系统模型列表</li>
     *   <li>{@code user:<id>} → 该用户的自定义模型（取不到则回退默认）</li>
     *   <li>null/空/不可解析 → 系统 index 0（等价历史默认行为）</li>
     * </ul>
     * 无任何可用配置时返回 null（交由上层按"无可用模型"处理）。
     */
    public ResolvedLlmConfig resolve(String selector, String userId) {
        if (selector != null) {
            String s = selector.trim();
            try {
                if (s.startsWith("user:")) {
                    String idStr = s.substring("user:".length());
                    Long id = Long.parseLong(idStr);
                    UserCustomLlmModel m = get(id, userId);
                    if (m != null) {
                        return new ResolvedLlmConfig(m.getEndpoint(), m.getModelName(), m.getApiKey(), m.getName(),
                                false, ResolvedLlmConfig.parseMaxTokensFromJson(m.getSettings()));
                    }
                    log.warn("resolve: user model not found (selector={}, user={}), falling back to default", selector, userId);
                    // 落到下面的默认
                } else if (s.startsWith("sys:")) {
                    String rest = s.substring("sys:".length());
                    LLMConfig cfg = resolveSystem(rest);
                    if (cfg != null) {
                        return toResolved(cfg);
                    }
                    log.warn("resolve: system model not found (selector={}), falling back to default", selector);
                    // 落到下面的默认
                }
            } catch (Exception e) {
                log.warn("resolve failed for selector={} (falling back to default): {}", selector, e.getMessage());
            }
        }
        // 默认：系统 index 0
        return defaultSystem();
    }

    /** rest 为纯数字则按 index，否则按 name 匹配。逻辑与 ReposController.getLLMConfigByIndexOrName 一致。 */
    private LLMConfig resolveSystem(String rest) {
        SystemLLMConfig cfg = BaseFunction.systemLLMConfig;
        if (cfg == null || !cfg.enabled || cfg.llmConfigList == null || cfg.llmConfigList.isEmpty()) {
            return null;
        }
        if (rest != null && rest.matches("\\d+")) {
            int idx = Integer.parseInt(rest);
            if (idx >= 0 && idx < cfg.llmConfigList.size()) {
                return cfg.llmConfigList.get(idx);
            }
            return null;
        }
        for (LLMConfig c : cfg.llmConfigList) {
            if (c.name != null && c.name.equals(rest)) {
                return c;
            }
        }
        return null;
    }

    private ResolvedLlmConfig defaultSystem() {
        SystemLLMConfig cfg = BaseFunction.systemLLMConfig;
        if (cfg == null || !cfg.enabled || cfg.llmConfigList == null || cfg.llmConfigList.isEmpty()) {
            return null;
        }
        return toResolved(cfg.llmConfigList.get(0));
    }

    private ResolvedLlmConfig toResolved(LLMConfig c) {
        return new ResolvedLlmConfig(c.url, c.modelName, c.apikey, c.name, false,
                ResolvedLlmConfig.parseMaxTokens(c.settings));
    }
}
