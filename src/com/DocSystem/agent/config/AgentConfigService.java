package com.DocSystem.agent.config;

import com.DocSystem.agent.repository.AgentConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent 配置服务（T8.6）—— agent_config 表的读写。
 *
 * <p>当前用于 system prompt 的 override/suffix 配置（作用域 global，预留按仓库扩展）。</p>
 */
@Service
public class AgentConfigService {

    private static final Logger log = LoggerFactory.getLogger(AgentConfigService.class);

    /** 作用域：全局（当前）；将来按仓库配置时可传仓库 ID */
    public static final String SCOPE_GLOBAL = "global";

    /** system prompt 整体覆盖（高级） */
    public static final String KEY_SYSTEM_PROMPT_OVERRIDE = "system_prompt_override";
    /** system prompt 附加段落（推荐） */
    public static final String KEY_SYSTEM_PROMPT_SUFFIX = "system_prompt_suffix";
    /**
     * T10：Agent 原生工具调用开关。值："auto"（默认，请求带 tools + tool_choice:auto）；
     * "none"（不带 tools，纯文本通道，适配 thinking 模型/省 token）。
     */
    public static final String KEY_AGENT_TOOL_CHOICE = "agent_tool_choice";

    @Autowired
    private AgentConfigRepository repository;

    /** 供测试注入 mock repository */
    public void setRepository(AgentConfigRepository repository) {
        this.repository = repository;
    }

    /**
     * 读取一条配置。
     *
     * @return 配置值；不存在或失败 → null
     */
    public String get(String scope, String key) {
        if (scope == null || key == null || key.isEmpty()) {
            return null;
        }
        try {
            AgentConfigEntity entity = repository.selectByKey(scope, key);
            return entity == null ? null : entity.getConfigValue();
        } catch (Exception e) {
            log.warn("AgentConfigService.get failed: scope={}, key={}, err={}", scope, key, e.getMessage());
            return null;
        }
    }

    /**
     * 写入一条配置（同 scope+key 覆盖）。
     * 事务内 select→insert/update 同一连接（SQLite + c3p0 单写者，避免跨连接锁）。
     */
    @Transactional
    public boolean set(String scope, String key, String value) {
        if (scope == null || key == null || key.isEmpty()) {
            return false;
        }
        try {
            AgentConfigEntity existing = repository.selectByKey(scope, key);
            if (existing != null) {
                repository.update(scope, key, value);
            } else {
                repository.insert(new AgentConfigEntity(scope, key, value));
            }
            return true;
        } catch (Exception e) {
            log.warn("AgentConfigService.set failed: scope={}, key={}, err={}", scope, key, e.getMessage());
            return false;
        }
    }

    /** 某作用域全部配置（key → value） */
    public Map<String, String> list(String scope) {
        Map<String, String> result = new LinkedHashMap<>();
        if (scope == null) {
            return result;
        }
        try {
            List<AgentConfigEntity> list = repository.selectByScope(scope);
            if (list != null) {
                for (AgentConfigEntity e : list) {
                    result.put(e.getConfigKey(), e.getConfigValue());
                }
            }
        } catch (Exception ex) {
            log.warn("AgentConfigService.list failed: scope={}, err={}", scope, ex.getMessage());
        }
        return result;
    }

    /** 便捷：读全局配置 */
    public String getGlobal(String key) {
        return get(SCOPE_GLOBAL, key);
    }

    /** 便捷：写全局配置 */
    public boolean setGlobal(String key, String value) {
        return set(SCOPE_GLOBAL, key, value);
    }
}
