package com.DocSystem.agent.permission;

/**
 * 工具风险类别（显式声明在 {@code ToolDefinition} 上，不靠名字猜）。
 *
 * <ul>
 *   <li>{@link #NORMAL} 常规写：自动/全部允许档直接放行</li>
 *   <li>{@link #DESTRUCTIVE} 破坏性（删除/移动/改名）：自动档仍确认；全部允许档放行；规则可豁免</li>
 *   <li>{@link #PERMISSION} 权限/共享变更：同 DESTRUCTIVE</li>
 *   <li>{@link #ABSOLUTE} **绝对保护**：任何档位（含全部允许）都要确认，**会话规则也不能豁免**
 *       —— 目前只有删仓库（{@code delete_repos}）；另：{@code run_skill} 当被调技能未声明 risk 时按此类处理</li>
 * </ul>
 *
 * <p>⚠️ 风险类别只决定"是否需要人批准"，不改变工具本身行为；未声明 risk 的技能按 {@link #ABSOLUTE}
 * 处理（fail-safe，宁可多问一次）。</p>
 */
public enum ToolRisk {

    NORMAL("normal"),
    DESTRUCTIVE("destructive"),
    PERMISSION("permission"),
    ABSOLUTE("absolute");

    public final String id;

    ToolRisk(String id) {
        this.id = id;
    }

    /** 硬清单判定（自动档仍确认的类别） */
    public boolean isHardList() {
        return this == DESTRUCTIVE || this == PERMISSION;
    }

    /** 技能 risk 声明解析；null/未知 → null（调用方按 fail-safe 处理） */
    public static ToolRisk fromId(String id) {
        if (id == null) {
            return null;
        }
        String v = id.trim();
        for (ToolRisk r : values()) {
            if (r.id.equalsIgnoreCase(v) || r.name().equalsIgnoreCase(v)) {
                return r;
            }
        }
        return null;
    }
}
