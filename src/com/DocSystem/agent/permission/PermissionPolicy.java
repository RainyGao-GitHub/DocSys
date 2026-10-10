package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSONObject;

import java.util.List;

/**
 * 权限判定（**纯函数，无 Spring / 无 IO**，可离线护栏）。
 *
 * <p>求值顺序（自上而下，第一条命中即生效；用户 2026-09-23 定稿，2026-10-10 裁定 D2 修订③）：</p>
 * <pre>
 * ① 绝对保护（ABSOLUTE）  → ASK   ← delete_repos 等；4 档全问，规则也不能豁免
 * ② 计划模式（PLAN）      → DENY  ← 写操作不执行（引导先出计划，批准后切档）
 * ③ 会话规则命中（自动档 **与标准档**）→ ALLOW ← 覆盖硬清单（含删除/权限变更）
 * ④ 硬清单（DESTRUCTIVE / PERMISSION） → ASK ← 自动档仍问；仅"全部允许"不问
 * ⑤ 模式默认             → MANUAL: ASK ；AUTO / ALLOW_ALL: ALLOW
 * </pre>
 *
 * <p>2026-10-10 用户裁定 D2：规则不再限定"仅自动档"——标准档也允许用户通过弹窗里的
 * "批准并记住"主动授权（仅本会话、按工具+作用域），否则"整理目录"在标准档下无路可脱身。
 * 绝对保护仍不可豁免。</p>
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

        // ③ 会话规则命中：**自动档与标准档都生效**（2026-10-10 用户裁定 D2：标准档也必须
        //    给用户一条"主动授权后不再问"的脱身路径，否则整理目录时会被逐个弹窗困住），
        //    命中可覆盖硬清单（含删除/权限变更），但不能覆盖绝对保护
        if ((m == PermissionMode.AUTO || m == PermissionMode.MANUAL) && rules != null) {
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
