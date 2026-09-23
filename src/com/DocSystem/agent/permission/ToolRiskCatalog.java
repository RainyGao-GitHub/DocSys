package com.DocSystem.agent.permission;

import com.DocSystem.agent.tool.ToolDefinition;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * 工具风险**显式登记表**（单一事实来源，P1）。
 *
 * <p>为什么集中在一张表：12 个写工具的 {@code isWrite(true).needsConfirm(true)} 声明完全一样，
 * 逐个改容易漏；集中登记 + 护栏强制"**每个 needsConfirm 工具都必须有登记项**"更安全
 * （新增写工具忘了登记 → 护栏直接红，而不是静默按 NORMAL 放行）。</p>
 *
 * <p>优先级：{@link ToolDefinition#riskClass}（工具自己显式声明）> 本表登记 > **fail-safe
 * {@link ToolRisk#ABSOLUTE}**（两边都没有 = 未知写工具，一律要求确认）。</p>
 *
 * <p>用户 2026-09-23 定稿的归类见计划 §3.2；{@code delete_repos} 为硬编码绝对保护（不可移除）。</p>
 */
public final class ToolRiskCatalog {

    /** 用户明确要求"永远例外"的工具（硬编码，不随配置移除） */
    public static final Set<String> ABSOLUTE_GUARDED = Collections.singleton("delete_repos");

    private static final Map<String, ToolRisk> TABLE = new HashMap<>();

    static {
        // 绝对保护：删仓库（风险过大，任何档位/规则都不能豁免）
        TABLE.put("delete_repos", ToolRisk.ABSOLUTE);

        // 破坏性：删除 / 移动 / 改名 / 仓库更新
        TABLE.put("delete_doc", ToolRisk.DESTRUCTIVE);
        TABLE.put("move_doc", ToolRisk.DESTRUCTIVE);
        TABLE.put("rename_doc", ToolRisk.DESTRUCTIVE);
        TABLE.put("update_repos", ToolRisk.DESTRUCTIVE);

        // 权限/共享变更
        TABLE.put("create_doc_share", ToolRisk.PERMISSION);

        // 常规写
        TABLE.put("create_repos", ToolRisk.NORMAL);
        TABLE.put("create_folder", ToolRisk.NORMAL);
        TABLE.put("write_file", ToolRisk.NORMAL);
        TABLE.put("write_note", ToolRisk.NORMAL);
        TABLE.put("copy_doc", ToolRisk.NORMAL);
        TABLE.put("backup_repos", ToolRisk.NORMAL);

        // 技能调用：按被调技能的声明判定（见 SkillRiskRegistry）→ 这里给保守默认
        TABLE.put("run_skill", ToolRisk.ABSOLUTE);
    }

    private ToolRiskCatalog() {
    }

    /** 表里登记的风险类别；未登记 → null */
    public static ToolRisk registered(String toolName) {
        return toolName == null ? null : TABLE.get(toolName);
    }

    /** 登记的工具名集合（护栏用） */
    public static Set<String> registeredNames() {
        return Collections.unmodifiableSet(TABLE.keySet());
    }

    /**
     * 解析某工具的风险类别：工具显式声明 > 登记表 > **fail-safe ABSOLUTE**。
     *
     * <p>注意：{@code run_skill} 的真实风险由 {@link SkillRiskRegistry} 按 skillId 再细化，
     * 调用方（ToolRegistry）对 {@code run_skill} 走技能解析分支。</p>
     */
    public static ToolRisk resolve(ToolDefinition def) {
        if (def == null) {
            return ToolRisk.ABSOLUTE;
        }
        if (def.riskClass != null) {
            return def.riskClass;
        }
        ToolRisk r = registered(def.name);
        return r != null ? r : ToolRisk.ABSOLUTE;
    }

    /** 是否已登记（护栏：needsConfirm 工具必须已登记） */
    public static boolean isRegistered(String toolName) {
        return registered(toolName) != null;
    }
}
