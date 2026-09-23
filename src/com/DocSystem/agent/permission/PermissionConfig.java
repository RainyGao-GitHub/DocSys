package com.DocSystem.agent.permission;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * P3：权限相关的**全局配置**解析（纯函数，便于离线护栏）。
 *
 * <p>配置键（存 {@code agent_config}）：</p>
 * <ul>
 *   <li>{@code agent_permission_allow_all_enabled}：是否允许"全部允许"档（默认 true）。
 *       关闭时服务端把 {@code allowAll} **降级为 {@code auto}**，并拒绝通过接口切到该档。</li>
 *   <li>{@code agent_absolute_guarded_extra}：**追加**的绝对保护工具名（逗号分隔）。
 *       {@code delete_repos} 是内置硬编码项，**不可移除**。</li>
 * </ul>
 */
public final class PermissionConfig {

    /** 全局配置键：允许"全部允许"档 */
    public static final String KEY_ALLOW_ALL_ENABLED = "agent_permission_allow_all_enabled";

    /** 全局配置键：追加的绝对保护工具（逗号分隔） */
    public static final String KEY_ABSOLUTE_GUARDED_EXTRA = "agent_absolute_guarded_extra";

    private PermissionConfig() {
    }

    /**
     * 全局开关 → 模式：禁用"全部允许"档时把该档**降级为自动档**
     * （不报错、不降到手动——降级的目的是"仍然能用但不全放"）。
     */
    public static PermissionMode applyAllowAllGate(PermissionMode mode, boolean allowAllEnabled) {
        if (mode == PermissionMode.ALLOW_ALL && !allowAllEnabled) {
            return PermissionMode.AUTO;
        }
        return mode;
    }

    /** 配置值 → 布尔（null/空 → {@code defaultValue}；true/1/on/yes 视为真） */
    public static boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        String v = value.trim();
        if ("1".equals(v) || "true".equalsIgnoreCase(v) || "on".equalsIgnoreCase(v) || "yes".equalsIgnoreCase(v)) {
            return true;
        }
        if ("0".equals(v) || "false".equalsIgnoreCase(v) || "off".equalsIgnoreCase(v) || "no".equalsIgnoreCase(v)) {
            return false;
        }
        return defaultValue;
    }

    /** 逗号/换行/空格分隔的工具名 → 去重列表（忽略空项） */
    public static List<String> parseToolList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> out = new LinkedHashSet<>();
        for (String part : value.split("[,\\s]+")) {
            String p = part.trim();
            if (!p.isEmpty()) {
                out.add(p);
            }
        }
        return new ArrayList<>(out);
    }

    /** 列表中挑出"不像工具名"的项（前端/接口校验用：只允许字母数字下划线） */
    public static List<String> invalidToolNames(List<String> names) {
        List<String> bad = new ArrayList<>();
        if (names == null) {
            return bad;
        }
        for (String n : names) {
            if (n == null || !n.matches("[A-Za-z0-9_]+")) {
                bad.add(n);
            }
        }
        return bad;
    }
}
