package com.DocSystem.agent.permission;

/**
 * 权限模式（用户 2026-09-23 定稿）。放权程度单调递增，语义互不重叠：
 *
 * <ul>
 *   <li>{@link #PLAN} 计划：写操作**一律拒绝**（不弹窗），引导模型先输出可执行计划；
 *       用户批准后切到 {@link #AUTO}（或 {@link #MANUAL}）继续执行。</li>
 *   <li>{@link #MANUAL} 手动（**新会话默认**）：每个写操作都要确认，不提供"记住授权"。</li>
 *   <li>{@link #AUTO} 自动：常规写操作不问；删除/移动/改名/权限变更（硬清单）仍问；
 *       弹窗可"记住此作用域"→ 之后同作用域内（含危险项）不再问。</li>
 *   <li>{@link #ALLOW_ALL} 全部允许：除**绝对保护**（删仓库等）外全部放行。</li>
 * </ul>
 *
 * <p>会话级存储：{@code agent_sessions.metadata.permissionMode}。新会话回落到 {@link #MANUAL}。</p>
 */
public enum PermissionMode {

    PLAN("plan", "计划", "只做调研并输出计划；写操作不执行，批准后再动手"),
    MANUAL("manual", "手动", "每个写操作都要确认"),
    AUTO("auto", "自动", "常规写操作自动通过；删除/权限变更仍需确认（可记住作用域）"),
    ALLOW_ALL("allowAll", "全部允许", "除删仓库等绝对保护外全部自动通过");

    /** 默认模式（新会话 / 配置非法时回落） */
    public static final PermissionMode DEFAULT = MANUAL;

    public final String id;
    public final String label;
    public final String description;

    PermissionMode(String id, String label, String description) {
        this.id = id;
        this.label = label;
        this.description = description;
    }

    /** id → 模式；null/未知/非法 → null（调用方自行决定回落） */
    public static PermissionMode fromId(String id) {
        if (id == null) {
            return null;
        }
        String v = id.trim();
        for (PermissionMode m : values()) {
            if (m.id.equalsIgnoreCase(v) || m.name().equalsIgnoreCase(v)) {
                return m;
            }
        }
        return null;
    }

    /** id → 模式；非法 → {@link #DEFAULT}（配置/请求参数入口统一用它，避免到处判空） */
    public static PermissionMode fromIdOrDefault(String id) {
        PermissionMode m = fromId(id);
        return m != null ? m : DEFAULT;
    }

    public static boolean isValid(String id) {
        return fromId(id) != null;
    }
}
