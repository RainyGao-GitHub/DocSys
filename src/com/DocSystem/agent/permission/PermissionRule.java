package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * 会话内的"记住授权"规则（用户 2026-09-23 裁定：**作用域只做会话级**）。
 *
 * <p>产生方式：**自动档**的确认弹窗里用户选作用域后点"批准并记住"。
 * 生命周期：随会话（存 {@code agent_sessions.metadata.permissionRules}），会话删除即失效。</p>
 *
 * <p>作用域维度（最细优先，命中即放行——**但不豁免 {@link ToolRisk#ABSOLUTE}**）：</p>
 * <ul>
 *   <li>{@link Kind#TOOL} 该工具（如 run_skill 的某个具体技能、某类写操作）</li>
 *   <li>{@link Kind#DIR}  该目录内的**该工具**（含子目录，按仓库 vid + 规范化的目录路径前缀匹配；
 *       目录取 {@code path}/{@code srcPath}/{@code dstPath}，任一落在授权目录内即命中）</li>
 *   <li>{@link Kind#DIR_ALL} 该目录内的**所有写操作**（含子目录；**忽略工具名**——前端显式标注的宽授权）</li>
 *   <li>{@link Kind#REPO} 该仓库内的**该工具**（vid）</li>
 * </ul>
 *
 * <p>2026-10-10（用户裁定 D9）：{@code DIR}/{@code REPO} **必须同时匹配工具名**；
 * 只有 {@code DIR_ALL} 才忽略工具名（"该目录内所有写操作都不再询问"要由用户显式选择，
 * 不能因为选了个"本目录内不再询问"而被默默放大）。</p>
 */
public final class PermissionRule {

    public enum Kind {
        TOOL("tool"), DIR("dir"), DIR_ALL("dirAll"), REPO("repo");

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

    /**
     * 是否命中该次工具调用。
     *
     * <p>{@code DIR}/{@code REPO} 会**同时校验工具名**（D9）；只有 {@code DIR_ALL} 忽略工具名。
     * 工具名缺失/不匹配 → **不命中**（fail-safe：宁严不松）。</p>
     *
     * <p>"调用所在的目录"取 {@link #DIR_ARGS} 里出现的参数（移动/复制用 {@code srcPath}/{@code dstPath}，
     * 其余写工具用 {@code path}）——任一落在授权目录下（含自身、含子目录）即命中。
     * 2026-10-10 修：改之前只看 {@code path}，于是 {@code move_doc}/{@code copy_doc} 的目录授权
     * **永远不可能命中**（它们的参数是 srcPath/dstPath），"整理目录"场景的作用域授权形同虚设。</p>
     *
     * <p>⚠️ 语义是"该目录**参与**了本次调用"（源目录或目标目录命中都算），不是"必须以它为源"。
     * 弹窗里给"源目录/目标目录"两个选项只是让用户知道这个目录是**怎么**参与的；
     * 规则本身不区分源/目标（用户 2026-10-10 裁定 D9 的作用域维度只有 工具/目录/仓库 三种）。</p>
     */
    public boolean matches(String toolName, JSONObject args) {
        if (kind == Kind.TOOL) {
            return tool != null && tool.equals(toolName);
        }
        if (args == null) {
            return false;
        }
        Integer argVid = args.getInteger("vid");
        if (kind == Kind.REPO) {
            if (vid == null || !vid.equals(argVid)) {
                return false;
            }
            return toolMatches(toolName);
        }
        // DIR / DIR_ALL：同仓库 + 目标路径落在已授权目录下（含自身、含子目录）
        if (vid != null && !vid.equals(argVid)) {
            return false;
        }
        if (kind == Kind.DIR && !toolMatches(toolName)) {
            return false;
        }
        for (String argPath : callDirs(args)) {
            if (argPath.equals(path)) {
                return true;
            }
            if (!path.isEmpty() && argPath.startsWith(path + "/")) {
                return true;
            }
        }
        return false;
    }

    /** 目录类参数名（按此顺序；空串 = 仓库根目录，是合法值） */
    public static final String[] DIR_ARGS = {"path", "srcPath", "dstPath"};

    /** 取本次调用涉及的目录（**只取实际出现的参数**；都没出现 → 空列表 ⇒ 不命中，fail-safe） */
    static List<String> callDirs(JSONObject args) {
        List<String> out = new ArrayList<String>();
        for (String key : DIR_ARGS) {
            if (args.containsKey(key)) {
                out.add(normalizePath(args.getString(key)));
            }
        }
        return out;
    }

    /** DIR/REPO 规则的按工具匹配（工具名为空/不匹配 → 不命中，宁严不松） */
    private boolean toolMatches(String toolName) {
        return tool != null && !tool.isEmpty() && tool.equals(toolName);
    }

    /** 人类可读描述（前端 chip / 日志用） */
    public String describe() {
        if (kind == Kind.TOOL) {
            return "工具 " + tool;
        }
        if (kind == Kind.REPO) {
            return "仓库 vid=" + vid + " / 工具 " + tool;
        }
        String scope = (kind == Kind.DIR_ALL) ? "目录(所有写操作)" : ("目录 / 工具 " + tool);
        return scope + " vid=" + vid + "/" + (path.isEmpty() ? "(根)" : path);
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
