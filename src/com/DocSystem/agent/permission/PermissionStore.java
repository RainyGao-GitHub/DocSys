package com.DocSystem.agent.permission;

import com.DocSystem.agent.session.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 会话级权限存储（P1）：模式 + 已授权规则。
 *
 * <p>**不新增表**：复用 {@code agent_sessions.metadata}（P3 已加的通用键读写）——
 * {@code permissionMode} 与 {@code permissionRules} 两个键，与 {@code title} 同级。
 * 会话删除即失效；**新会话默认 {@link PermissionMode#DEFAULT}（手动）**。</p>
 *
 * <p>{@code sessionService} 未装配 / sessionId 为空 → 全部退化为"无模式无规则"
 * （模式回落后行为同改造前：每次都问）。</p>
 */
@Service
public class PermissionStore {

    private static final Logger log = LoggerFactory.getLogger(PermissionStore.class);

    /** metadata 键：当前模式 */
    static final String META_MODE = "permissionMode";

    /** metadata 键：会话内规则（JSON 数组） */
    static final String META_RULES = "permissionRules";

    /** 规则条数上限（防会话 metadata 膨胀；超出丢弃最旧的） */
    static final int MAX_RULES = 50;

    @Autowired(required = false)
    private SessionService sessionService;

    /** 供测试注入 */
    public void setSessionService(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /** 读会话模式（无会话/未设置/非法 → {@link PermissionMode#DEFAULT}） */
    public PermissionMode getMode(String sessionId) {
        if (sessionService == null || sessionId == null) {
            return PermissionMode.DEFAULT;
        }
        try {
            return PermissionMode.fromIdOrDefault(sessionService.getMetaValue(sessionId, META_MODE));
        } catch (Exception e) {
            log.warn("读会话权限模式失败（回落手动）: {}", e.getMessage());
            return PermissionMode.DEFAULT;
        }
    }

    /** 写会话模式（会话不存在 → 静默忽略；值非法 → 存默认值） */
    public boolean setMode(String sessionId, PermissionMode mode) {
        if (sessionService == null || sessionId == null) {
            return false;
        }
        PermissionMode m = mode != null ? mode : PermissionMode.DEFAULT;
        try {
            boolean ok = sessionService.putMetaJson(sessionId, META_MODE, m.id);
            com.DocSystem.common.Log.info("[Permission][MODE] sessionId=" + sessionId
                    + " mode=" + m.id + " saved=" + (ok ? "ok" : "rows=0(参考值)"));
            return true;
        } catch (Exception e) {
            log.warn("写会话权限模式失败: {}", e.getMessage());
            return false;
        }
    }

    /** 读会话规则（无 → 空列表） */
    public List<PermissionRule> getRules(String sessionId) {
        if (sessionService == null || sessionId == null) {
            return Collections.emptyList();
        }
        try {
            return PermissionRule.parseList(sessionService.getMetaValue(sessionId, META_RULES));
        } catch (Exception e) {
            log.warn("读会话权限规则失败（按无规则处理）: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 追加一条规则（同类同作用域去重；超出 {@link #MAX_RULES} 丢弃最旧的）。
     *
     * @return 追加后的规则列表（未装配存储时返回原列表）
     */
    public List<PermissionRule> addRule(String sessionId, PermissionRule rule) {
        List<PermissionRule> rules = new ArrayList<>(getRules(sessionId));
        if (rule == null) {
            return rules;
        }
        // 去重（同 kind + tool + vid + path）
        for (PermissionRule r : rules) {
            if (r.kind == rule.kind
                    && java.util.Objects.equals(r.tool, rule.tool)
                    && java.util.Objects.equals(r.vid, rule.vid)
                    && java.util.Objects.equals(r.path, rule.path)) {
                return rules;
            }
        }
        rules.add(rule);
        while (rules.size() > MAX_RULES) {
            rules.remove(0);
        }
        saveRules(sessionId, rules);
        return rules;
    }

    /** 清空会话规则（模式 chip 里"清空授权"用） */
    public void clearRules(String sessionId) {
        if (sessionService == null || sessionId == null) {
            return;
        }
        try {
            sessionService.removeMeta(sessionId, META_RULES);
            com.DocSystem.common.Log.info("[Permission][RULES] sessionId=" + sessionId + " cleared");
        } catch (Exception e) {
            log.warn("清空会话权限规则失败: {}", e.getMessage());
        }
    }

    private void saveRules(String sessionId, List<PermissionRule> rules) {
        if (sessionService == null || sessionId == null) {
            return;
        }
        try {
            sessionService.putMetaJson(sessionId, META_RULES, PermissionRule.toJsonString(rules));
            com.DocSystem.common.Log.info("[Permission][RULES] sessionId=" + sessionId
                    + " count=" + rules.size() + " last=" + rules.get(rules.size() - 1).describe());
        } catch (Exception e) {
            log.warn("写会话权限规则失败: {}", e.getMessage());
        }
    }
}
