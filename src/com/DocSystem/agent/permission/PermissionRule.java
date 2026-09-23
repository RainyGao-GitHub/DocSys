package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 会话内的"记住授权"规则（用户 2026-09-23 裁定：**作用域只做会话级**）。
 *
 * <p>产生方式：**自动档**的确认弹窗里用户选作用域后点"批准并记住"。
 * 生命周期：随会话（存 {@code agent_sessions.metadata.permissionRules}），会话删除即失效。</p>
 *
 * <p>作用域维度（最细优先，命中即放行——**但不豁免 {@link ToolRisk#ABSOLUTE}**）：</p>
 * <ul>
 *   <li>{@link Kind#TOOL} 该工具（如 run_skill 的某个具体技能、某类写操作）</li>
 *   <li>{@link Kind#DIR}  该目录（**含子目录**，按仓库 vid + 规范化的目录路径前缀匹配）</li>
 *   <li>{@link Kind#REPO} 该仓库（vid）</li>
 * </ul>
 */
public final class PermissionRule {

    public enum Kind {
        TOOL("tool"), DIR("dir"), REPO("repo");

        public final String id;

        Kind(String id) {
            this.id = id;
        }

        public static Kind fromId(String id) {
            if (id == null) {
                return null;
            }
            for (Kind k : values()) {
                if (k.id.equalsIgnoreCase(id.trim())) {
                    return k;
                }
            }
            return null;
        }
    }

    public final Kind kind;

    /** 工具名（写工具名；{@code run_skill} 时为 {@code run_skill} 本身，技能级细分留待 P2 增强） */
    public final String tool;

    /** 仓库 id（DIR/REPO 规则用；null = 不限仓库） */
    public final Integer vid;

    /** 目录路径（DIR 规则用；**已规范化**，如 {@code a/b}，空串代表仓库根） */
    public final String path;

    public PermissionRule(Kind kind, String tool, Integer vid, String path) {
        this.kind = kind;
        this.tool = tool;
        this.vid = vid;
        this.path = normalizePath(path);
    }

    /** 路径规范化：反斜杠→斜杠、去掉首尾斜杠、去重复斜杠；null/空 → "" */
    public static String normalizePath(String raw) {
        if (raw == null) {
            return "";
        }
        String p = raw.trim().replace('\\', '/');
        while (p.startsWith("/")) {
            p = p.substring(1);
        }
        while (p.endsWith("/")) {
            p = p.substring(0, p.length() - 1);
        }
        return p.replaceAll("/{2,}", "/");
    }

    /** 是否命中该次工具调用 */
    public boolean matches(String toolName, JSONObject args) {
        if (kind == Kind.TOOL) {
            return tool != null && tool.equals(toolName);
        }
        if (args == null) {
            return false;
        }
        Integer argVid = args.getInteger("vid");
        if (kind == Kind.REPO) {
            return vid != null && vid.equals(argVid);
        }
        // DIR：同仓库 + 目标路径落在已授权目录下（含自身、含子目录）
        if (vid != null && !vid.equals(argVid)) {
            return false;
        }
        String argPath = normalizePath(args.getString("path"));
        if (argPath.equals(path)) {
            return true;
        }
        return !path.isEmpty() && argPath.startsWith(path + "/");
    }

    /** 人类可读描述（前端 chip / 日志用） */
    public String describe() {
        if (kind == Kind.TOOL) {
            return "工具 " + tool;
        }
        if (kind == Kind.REPO) {
            return "仓库 vid=" + vid;
        }
        return "目录 vid=" + vid + "/" + (path.isEmpty() ? "(根)" : path);
    }

    public JSONObject toJson() {
        JSONObject o = new JSONObject();
        o.put("kind", kind.id);
        o.put("tool", tool);
        o.put("vid", vid);
        o.put("path", path);
        return o;
    }

    public static PermissionRule fromJson(JSONObject o) {
        if (o == null) {
            return null;
        }
        Kind k = Kind.fromId(o.getString("kind"));
        if (k == null) {
            return null;
        }
        return new PermissionRule(k, o.getString("tool"), o.getInteger("vid"), o.getString("path"));
    }

    /** 规则列表 → JSON 文本（写会话 metadata 用） */
    public static String toJsonString(java.util.List<PermissionRule> rules) {
        JSONArray arr = new JSONArray();
        if (rules != null) {
            for (PermissionRule r : rules) {
                if (r != null) {
                    arr.add(r.toJson());
                }
            }
        }
        return arr.toJSONString();
    }

    /** JSON 文本 → 规则列表（非法/空 → 空列表，不抛异常） */
    public static java.util.List<PermissionRule> parseList(String json) {
        java.util.List<PermissionRule> out = new java.util.ArrayList<>();
        if (json == null || json.isEmpty()) {
            return out;
        }
        try {
            JSONArray arr = JSON.parseArray(json);
            if (arr == null) {
                return out;
            }
            for (int i = 0; i < arr.size(); i++) {
                PermissionRule r = fromJson(arr.getJSONObject(i));
                if (r != null) {
                    out.add(r);
                }
            }
        } catch (Exception e) {
            // 旧数据/脏数据 → 当作无规则（fail-safe 方向：无规则 = 该问还问）
        }
        return out;
    }

    @Override
    public String toString() {
        return kind.id + ":" + describe();
    }
}
