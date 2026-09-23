package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSONObject;

import java.util.List;

/**
 * 权限判定（**纯函数，无 Spring / 无 IO**，可离线护栏）。
 *
 * <p>求值顺序（自上而下，第一条命中即生效；用户 2026-09-23 定稿）：</p>
 * <pre>
 * ① 绝对保护（ABSOLUTE）  → ASK   ← delete_repos 等；4 档全问，规则也不能豁免
 * ② 计划模式（PLAN）      → DENY  ← 写操作不执行（引导先出计划，批准后切档）
 * ③ 会话规则命中（*仅自动档*）→ ALLOW ← 覆盖硬清单（含删除/权限变更）
 * ④ 硬清单（DESTRUCTIVE / PERMISSION） → ASK ← 自动档仍问；仅"全部允许"不问
 * ⑤ 模式默认             → MANUAL: ASK ；AUTO / ALLOW_ALL: ALLOW
 * </pre>
 *
 * <p>调用约定：只对 {@code needsConfirm=true} 的写工具调用（只读工具不参与判定）。
 * 未注入策略时调用方保持改造前行为（每次都问）。</p>
 */
public final class PermissionPolicy {

    private PermissionPolicy() {
    }

    /**
     * 判定一次写工具调用。
     *
     * @param mode     会话当前模式（null → 手动）
     * @param risk     该工具的风险类别（null → {@link ToolRisk#NORMAL}）
     * @param rules    会话内已授权规则（null/空 = 无）
     * @param toolName 工具名
     * @param args     工具参数（规则匹配用）
     */
    public static PermissionDecision decide(PermissionMode mode, ToolRisk risk,
                                            List<PermissionRule> rules,
                                            String toolName, JSONObject args) {
        PermissionMode m = mode != null ? mode : PermissionMode.DEFAULT;
        ToolRisk r = risk != null ? risk : ToolRisk.NORMAL;

        // ① 绝对保护：任何档位都要确认，规则不可豁免
        if (r == ToolRisk.ABSOLUTE) {
            return PermissionDecision.ask("absolute");
        }

        // ② 计划模式：写操作一律拒绝（不弹窗）
        if (m == PermissionMode.PLAN) {
            return PermissionDecision.deny("plan");
        }

        // ③ 会话规则命中：**仅自动档生效**（用户裁定：手动档保持“每次都要确认”的纯粹语义），
        //    命中可覆盖硬清单（含删除/权限变更），但不能覆盖绝对保护
        if (m == PermissionMode.AUTO && rules != null) {
            for (PermissionRule rule : rules) {
                if (rule != null && rule.matches(toolName, args)) {
                    return PermissionDecision.allow("rule(" + rule.kind.id + ")");
                }
            }
        }

        // ④ 硬清单：自动档仍确认（"全部允许"档不问）
        if (r.isHardList() && m != PermissionMode.ALLOW_ALL) {
            return PermissionDecision.ask("hardlist(" + r.id + ")");
        }

        // ⑤ 模式默认
        if (m == PermissionMode.MANUAL) {
            return PermissionDecision.ask("mode(manual)");
        }
        return PermissionDecision.allow("mode(" + m.id + ")");
    }

    /** 是否属于"永远要确认"的绝对保护（供日志/护栏断言用） */
    public static boolean isAbsolute(ToolRisk risk) {
        return risk == ToolRisk.ABSOLUTE;
    }
}
