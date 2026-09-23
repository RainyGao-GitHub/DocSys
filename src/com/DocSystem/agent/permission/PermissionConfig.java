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
 *   <li>{@code agent_absolute_guarded_extra}：**追加**的绝对保护工具名（逗号分隔）。
 *       {@code delete_repos} 是内置硬编码项，**不可移除**。</li>
 * </ul>
 *
 * <p>注：曾有过 {@code agent_permission_allow_all_enabled}（全局禁用"全部允许"档），
 * 2026-09-23 按用户裁定**移除**——该档本身已带"除绝对保护外全部放行 + 二次确认"，
 * 再叠一层管理员开关用途不大。</p>
 */
public final class PermissionConfig {

    /** 全局配置键：追加的绝对保护工具（逗号分隔） */
    public static final String KEY_ABSOLUTE_GUARDED_EXTRA = "agent_absolute_guarded_extra";

    private PermissionConfig() {
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
