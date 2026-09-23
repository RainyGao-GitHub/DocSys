package com.DocSystem.agent.tool;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 写入产物的**可点击链接**元数据（方案 B，2026-09-23 用户裁定）。
 *
 * <p><b>为什么用"标记 + 落库"而不是结构化字段</b>：工具卡片不落库（刷新/切会话后 toolCalls 被重建为空），
 * 所以链接必须随**最终回答文本**落库才能持久。项目既有做法就是"持久化文本里带机器标记，前端/服务端反解"
 * （关注对象注入块同理）。</p>
 *
 * <p><b>格式</b>（单独一行，追加在本轮回答末尾）：</p>
 * <pre>
 * [[ds-products]]{"items":[{"vid":1,"path":"","name":"a.docx","docId":123,"action":"new"}]}[[/ds-products]]
 * </pre>
 *
 * <p><b>生命周期</b>：</p>
 * <ol>
 *   <li>工具执行成功 → {@link ToolUseLoop} 按 {@link #isProductTool} 白名单登记产物（去重）；</li>
 *   <li>本轮回答产出 → {@link #appendFooter} 追加标记（无产物则原样返回）；</li>
 *   <li>该文本同时进 SSE {@code done.fullContent} 与会话历史（前端据此渲染链接，刷新后仍在）；</li>
 *   <li>回灌模型前 {@link #strip} 剥掉（模型看不到机器标记：历史回放 {@code MainAgent.loadSessionHistory}
 *       与续接上下文 {@code savePendingContinuation} 两处）。</li>
 * </ol>
 *
 * <p><b>覆盖范围</b>（用户裁定）：{@link #PRODUCT_TOOLS} 三者纳入；
 * {@code rename_doc}/{@code move_doc}/{@code copy_doc} **不纳入**（目录整理场景会刷屏）；
 * 目录类、备注类也不纳入（打开无意义/无实体文件）。</p>
 */
public class AgentProductLink {

    /** 会产生"可打开产物"的工具（白名单，用户 2026-09-23 裁定） */
    public static final String[] PRODUCT_TOOLS = {"write_office", "edit_office", "write_file"};

    /** 标记前后缀（前端 index.html 用同一对常量解析） */
    public static final String MARK_START = "[[ds-products]]";
    public static final String MARK_END = "[[/ds-products]]";

    /** 单条产物最多 20 个（一轮里写太多文件时只留前面的，避免回答尾巴过长） */
    public static final int MAX_ITEMS = 20;

    private static final Pattern MARK_RE = Pattern.compile(
            Pattern.quote(MARK_START) + "(.*?)" + Pattern.quote(MARK_END), Pattern.DOTALL);

    /** 一个写入产物（够前端"在当前页/新窗口打开"用） */
    public static class Product {
        public Integer vid;
        public String path = "";
        /** 文件名（含后缀） */
        public String name = "";
        /** 可选：docId（拿不到时前端用 path+name 也能打开） */
        public Long docId;
        /** new=新建 / modified=修改（回执文案用） */
        public String action = "new";

        /** 去重键（同一文件被改两次只留一条） */
        public String key() {
            return (vid == null ? "" : String.valueOf(vid)) + "|" + (path == null ? "" : path) + "|"
                    + (name == null ? "" : name);
        }

        public JSONObject toJson() {
            JSONObject o = new JSONObject();
            o.put("vid", vid);
            o.put("path", path == null ? "" : path);
            o.put("name", name == null ? "" : name);
            if (docId != null) {
                o.put("docId", docId);
            }
            o.put("action", action == null ? "new" : action);
            return o;
        }

        static Product fromJson(JSONObject o) {
            if (o == null) {
                return null;
            }
            String name = o.getString("name");
            if (name == null || name.trim().isEmpty()) {
                return null;
            }
            Product p = new Product();
            p.vid = o.getInteger("vid");
            p.path = o.getString("path") == null ? "" : o.getString("path");
            p.name = name.trim();
            p.docId = o.getLong("docId");
            p.action = o.getString("action");
            return p;
        }
    }

    /** 该工具是否属于"产生可打开产物"的白名单 */
    public static boolean isProductTool(String toolName) {
        if (toolName == null) {
            return false;
        }
        for (String t : PRODUCT_TOOLS) {
            if (t.equals(toolName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 工具侧构造产物（工具知道自己的 vid/path/name 与写回响应里的 docId）——
     * 作为 {@link ToolResult#data} 返回，供 {@link ToolLoop} 登记。
     */
    public static Product of(Integer vid, String path, String name, Long docId, String action) {
        if (vid == null || name == null || name.trim().isEmpty()) {
            return null;
        }
        Product p = new Product();
        p.vid = vid;
        p.path = DocSysToolFactory.normalizeDocPath(path);
        p.name = name.trim();
        p.docId = docId;
        p.action = action == null ? "new" : action;
        return p;
    }

    /** 从响应 data 里取 docId（拿不到就 null；打开文件其实只需 vid/path/name） */
    public static Long docIdOf(Object data) {
        try {
            if (data instanceof Map) {
                Object v = ((Map<?, ?>) data).get("docId");
                if (v instanceof Number) {
                    return Long.valueOf(((Number) v).longValue());
                }
            }
        } catch (Exception e) {
            // 忽略
        }
        return null;
    }

    /**
     * 从工具**参数**里取产物（vid/path/name）。取不到必要信息 → null（不登记）。
     *
     * <p>path 语义与工具层一致：所在目录的相对路径、根目录为空串（复用
     * {@link DocSysToolFactory#normalizeDocPath} 的同一归一化，避免"66666"与"66666/"两种形态）。</p>
     */
    public static Product fromArgs(String toolName, JSONObject args) {
        if (!isProductTool(toolName) || args == null) {
            return null;
        }
        String name = args.getString("name");
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        return of(args.getInteger("vid"), args.getString("path"), name, null,
                "edit_office".equals(toolName) ? "modified" : "new");
    }

    /**
     * 从一次工具执行里取产物：优先用工具放在 {@link ToolResult#data} 里的（带 docId），
     * 否则从参数重建（vid/path/name）；非白名单工具/失败/取不到 → null。
     */
    public static Product fromResult(String toolName, JSONObject args, Object resultData) {
        if (!isProductTool(toolName)) {
            return null;
        }
        if (resultData instanceof Product) {
            return (Product) resultData;
        }
        if (resultData instanceof JSONObject) {
            Product fromData = Product.fromJson((JSONObject) resultData);
            if (fromData != null) {
                return fromData;
            }
        }
        return fromArgs(toolName, args);
    }

    /** 登记（去重：同一文件多次操作只留一条，位置取首次出现，动作取最后一次） */
    public static void add(List<Product> list, Product p) {
        if (list == null || p == null) {
            return;
        }
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).key().equals(p.key())) {
                list.get(i).action = p.action;
                return;
            }
        }
        if (list.size() < MAX_ITEMS) {
            list.add(p);
        }
    }

    /** 生成标记行（json 为 null 时给空数组） */
    public static String marker(List<Product> products) {
        JSONArray arr = new JSONArray();
        if (products != null) {
            for (Product p : products) {
                if (p != null) {
                    arr.add(p.toJson());
                }
            }
        }
        JSONObject root = new JSONObject();
        root.put("items", arr);
        return MARK_START + root.toJSONString() + MARK_END;
    }

    /**
     * 把产物标记追加到回答末尾（无产物 → 原样返回，绝不产生空标记）。
     * 会先剥掉回答里可能已有的同类标记，保证幂等（重复调用不会叠加）。
     */
    public static String appendFooter(String answer, List<Product> products) {
        String text = strip(answer);
        if (products == null || products.isEmpty()) {
            return text;
        }
        return text + "\n\n" + marker(products);
    }

    /** 去掉回答里的产物标记（连同标记留下的行尾空白），其余原样；无标记时**不碰**原文（含空白） */
    public static String strip(String content) {
        if (content == null) {
            return null;
        }
        Matcher m = MARK_RE.matcher(content);
        if (!m.find()) {
            return content;
        }
        String out = m.reset().replaceAll("");
        // 标记通常独占一行且在最末尾 → 收掉它留下的空行/行尾空白
        return out.replaceAll("[ \\t\\r\\n]+$", "");
    }

    /** 解析回答里的产物（无标记/格式坏 → 空列表，绝不抛） */
    public static List<Product> parse(String content) {
        List<Product> list = new ArrayList<Product>();
        if (content == null) {
            return list;
        }
        Matcher m = MARK_RE.matcher(content);
        while (m.find()) {
            String json = m.group(1);
            if (json == null || json.trim().isEmpty()) {
                continue;
            }
            try {
                JSONObject root = JSON.parseObject(json);
                JSONArray items = root == null ? null : root.getJSONArray("items");
                if (items == null) {
                    continue;
                }
                for (int i = 0; i < items.size(); i++) {
                    Product p = Product.fromJson(items.getJSONObject(i));
                    if (p != null) {
                        add(list, p);
                    }
                }
            } catch (Exception e) {
                // 坏标记：忽略（前端同样忽略 → 至多不显示链接，不影响回答）
            }
        }
        return list;
    }

    /** 回执文案用：把产物列表压成 "a.docx、b.xlsx"（最多 3 个） */
    public static String describe(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return "";
        }
        Map<String, Product> byKey = new LinkedHashMap<String, Product>();
        for (Product p : products) {
            if (p != null) {
                byKey.put(p.key(), p);
            }
        }
        StringBuilder sb = new StringBuilder();
        int i = 0;
        for (Product p : byKey.values()) {
            if (i >= 3) {
                sb.append("…（共 ").append(byKey.size()).append(" 个）");
                break;
            }
            if (i > 0) {
                sb.append("、");
            }
            sb.append(p.name);
            i++;
        }
        return sb.toString();
    }
}
