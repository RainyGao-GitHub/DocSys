package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSONObject;
import com.DocSystem.agent.tool.ToolDefinition;

import java.util.Collections;
import java.util.List;

/**
 * 单次请求的权限上下文（P1）：会话模式 + 会话规则 + 技能风险解析方式。
 *
 * <p>由 {@code MainAgent} 按请求构建（模式/规则来自会话 metadata，见 {@link PermissionStore}），
 * 注入到该请求专属的 {@code ToolRegistry} 上；**不可变对象**，工厂使用不必加锁。</p>
 *
 * <p>{@code run_skill} 的风险**不能靠解析参数内容**（外部技能 = 任意 Python/shell），
 * 而是按 skillId 查技能声明（{@link SkillRiskResolver}；未声明 → fail-safe 绝对保护）。</p>
 */
public final class PermissionContext {

    /** 技能 id → 风险（默认实现：内置白名单 + 未声明 fail-safe；MainAgent 可注入读 SKILL.md 声明的实现） */
    @FunctionalInterface
    public interface SkillRiskResolver {
        ToolRisk resolve(String skillId);
    }

    /** {@code run_skill} 里技能 id 的参数名（与 DocSysToolFactory 的 schema 一致） */
    public static final String ARG_SKILL_ID = "skillId";

    /** 技能调用工具名 */
    public static final String TOOL_RUN_SKILL = "run_skill";

    public final PermissionMode mode;
    public final List<PermissionRule> rules;
    public final SkillRiskResolver skillRiskResolver;

    public PermissionContext(PermissionMode mode, List<PermissionRule> rules) {
        this(mode, rules, skillId -> SkillRiskRegistry.resolve(skillId, null));
    }

    public PermissionContext(PermissionMode mode, List<PermissionRule> rules,
                             SkillRiskResolver skillRiskResolver) {
        this.mode = mode != null ? mode : PermissionMode.DEFAULT;
        this.rules = rules != null ? rules : Collections.<PermissionRule>emptyList();
        this.skillRiskResolver = skillRiskResolver != null
                ? skillRiskResolver : skillId -> SkillRiskRegistry.resolve(skillId, null);
    }

    /**
     * 解析某工具本次调用的风险类别。
     *
     * <p>{@code run_skill} → 按 skillId 的技能声明；其余 → 工具声明 / 风险目录 / fail-safe。</p>
     */
    public ToolRisk riskOf(ToolDefinition def, JSONObject args) {
        if (def != null && TOOL_RUN_SKILL.equals(def.name)) {
            String skillId = args == null ? null : args.getString(ARG_SKILL_ID);
            try {
                ToolRisk r = skillRiskResolver.resolve(skillId);
                return r != null ? r : ToolRisk.ABSOLUTE;
            } catch (Exception e) {
                return ToolRisk.ABSOLUTE;   // 解析失败也按最保守处理
            }
        }
        return ToolRiskCatalog.resolve(def);
    }

    /** 判定一次写工具调用（纯函数委托给 {@link PermissionPolicy}） */
    public PermissionDecision decide(ToolDefinition def, JSONObject args) {
        String toolName = def != null ? def.name : null;
        return PermissionPolicy.decide(mode, riskOf(def, args), rules, toolName, args);
    }
}
