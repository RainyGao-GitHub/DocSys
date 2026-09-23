package com.DocSystem.agent.permission;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * 技能调用的风险解析（P1，用户 2026-09-23 四次裁定）。
 *
 * <p>**不解析调用内容**（外部技能 = 任意 Python/shell，静态分析不可靠且可绕过），
 * 而是按技能**声明的** risk 分级；判定的是"调哪个技能"，不是"参数里写了什么"。</p>
 *
 * <p>解析顺序：</p>
 * <ol>
 *   <li>技能自身声明（{@code SKILL.md} frontmatter 的 {@code risk:}）→ 用它；</li>
 *   <li>否则查内置只读白名单（{@link #BUILTIN_DEFAULT}）：只读/自我操作类技能 → {@link ToolRisk#NORMAL}
 *       （跟随模式，自动档不再弹）；</li>
 *   <li>都没有 → **{@link ToolRisk#ABSOLUTE}（fail-safe）**：未声明的技能在任何档位都要确认。</li>
 * </ol>
 */
public final class SkillRiskRegistry {

    /**
     * 内置技能默认风险（**含只读/自我操作类**，无需在 SKILL.md 里声明即可跟随模式）。
     *
     * <p>⚠️ 这些 id 与技能清单（{@code /agent/skills}）对应；新增内置技能时同步登记，
     * 未登记的技能一律按 ABSOLUTE 处理（宁可多问一次）。</p>
     */
    private static final Map<String, ToolRisk> BUILTIN_DEFAULT = new HashMap<>();

    static {
        // 只读查询类
        BUILTIN_DEFAULT.put("status", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("whoami", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("help", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("banner", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("web", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("system_help", ToolRisk.NORMAL);
        // 自我会话操作（不改文档/仓库数据）
        BUILTIN_DEFAULT.put("user_login", ToolRisk.NORMAL);
        BUILTIN_DEFAULT.put("user_logout", ToolRisk.NORMAL);
    }

    private SkillRiskRegistry() {
    }

    /**
     * 解析技能风险。
     *
     * @param skillId      被调技能 id（来自 {@code run_skill} 参数）
     * @param declaredRisk 技能声明的 risk 文本（{@code SKILL.md} frontmatter；null/空 = 未声明）
     */
    public static ToolRisk resolve(String skillId, String declaredRisk) {
        ToolRisk declared = parseDeclared(declaredRisk);
        if (declared != null) {
            return declared;
        }
        if (skillId != null) {
            ToolRisk builtin = BUILTIN_DEFAULT.get(skillId.trim());
            if (builtin != null) {
                return builtin;
            }
        }
        return ToolRisk.ABSOLUTE;   // 未声明 → fail-safe
    }

    /**
     * 技能声明词汇 → 风险类别。
     *
     * <p>对外词汇（写 SKILL.md 的人用）：{@code safe} 只读 / {@code write} 常规写 /
     * {@code dangerous} 危险（自动档仍确认）/ {@code absolute} 绝对保护；
     * 同时兼容内部词汇 {@code normal/destructive/permission/absolute}。</p>
     */
    static ToolRisk parseDeclared(String declaredRisk) {
        if (declaredRisk == null || declaredRisk.trim().isEmpty()) {
            return null;
        }
        String v = declaredRisk.trim();
        ToolRisk internal = ToolRisk.fromId(v);
        if (internal != null) {
            return internal;
        }
        if ("safe".equalsIgnoreCase(v) || "write".equalsIgnoreCase(v)) {
            return ToolRisk.NORMAL;
        }
        if ("dangerous".equalsIgnoreCase(v) || "destructive".equalsIgnoreCase(v)) {
            return ToolRisk.DESTRUCTIVE;
        }
        return null;   // 未知声明 → 当作未声明（fail-safe 绝对保护）
    }

    /** 只读白名单（护栏/文档用） */
    public static Map<String, ToolRisk> builtinDefaults() {
        return Collections.unmodifiableMap(BUILTIN_DEFAULT);
    }
}
