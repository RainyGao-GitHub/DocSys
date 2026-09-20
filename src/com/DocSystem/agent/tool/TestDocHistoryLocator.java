package com.DocSystem.agent.tool;

import com.DocSystem.common.Path;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 护栏：文档定位方式（R1-4 / R1-6「path/name 优先」试点 = get_doc_history）。
 *
 * <p><b>为什么钉这个</b>：docId 是 {@code Path.buildDocIdByName(level, path+name)} 算出来的派生 hash，
 * 不是主键 —— DB 的 doc 表不保证有记录，Lucene 索引也不全，所以"由 docId 反查 path/name"经常只能
 * 穷举文件系统兜底；而且 docId 随移动/重命名失效。更危险的是**只传 docId 时服务端会把 path/name 当空**
 * → {@code doc.getDocId() == 0} → 静默走"仓库根目录的历史"分支（返回错误结果且不报错）。
 *
 * <p>因此工具层统一改成 path/name 定位（docId 由服务端从 path/name 派生）。本测试钉住三件事：
 * <ol>
 *   <li>path 归一化规则（前导 / 去掉、尾 / 补齐、根目录 = 空串）；</li>
 *   <li>level = path 中 {@code /} 的个数（level 传错 → docId 算错 → 静默定位到别的对象）；</li>
 *   <li>{@code get_doc_history} 的 schema 必填 path+name、**不再暴露 docId**；</li>
 *   <li>用线上真实 docId 指纹证明"path+name+level 能算回同一个 docId"（即 path/name 是完整定位信息）。</li>
 * </ol>
 */
public class TestDocHistoryLocator {

    private static int pass = 0;
    private static int fail = 0;

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null ? "" : "  -> " + detail));
        }
    }

    public static void main(String[] args) {
        testNormalizePath();
        testLevelOfPath();
        testChildDocPath();
        testPathNameIsCompleteLocator();
        testGetDocHistorySchema();
        testMoveCopySchema();
        testListDocsFooterTeachesPath();

        System.out.println("======== TestDocHistoryLocator: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void testChildDocPath() {
        check("根目录下钻 66666 -> 66666/", "66666/".equals(DocSysToolFactory.childDocPath("", "66666")));
        check("66666/ 下钻 sub -> 66666/sub/", "66666/sub/".equals(DocSysToolFactory.childDocPath("66666/", "sub")));
        check("null 父目录 -> a/", "a/".equals(DocSysToolFactory.childDocPath(null, "a")));
        check("子目录名带斜杠也能收敛 -> a/b/", "a/b/".equals(DocSysToolFactory.childDocPath("a/", "/b/")));
    }

    /**
     * move_doc / copy_doc（R1-6 主战场）：必须用 srcPath+srcName 定位源、dstPath 指定目标目录，
     * 不能再要求 docId/dstPid（旧口径下 src 侧参数在 client 调用里被写死 null，源只能靠 docId 定位）。
     */
    private static void testMoveCopySchema() {
        ToolDefinition mv = DocSysToolFactory.moveDoc(null);
        ToolDefinition cp = DocSysToolFactory.copyDoc(null);

        for (ToolDefinition def : new ToolDefinition[]{mv, cp}) {
            JSONObject props = def.parameters.getJSONObject("properties");
            JSONArray required = def.parameters.getJSONArray("required");
            check(def.name + " 暴露 srcPath/srcName/dstPath",
                    props.containsKey("srcPath") && props.containsKey("srcName") && props.containsKey("dstPath"));
            check(def.name + " 不再暴露 docId/dstPid/srcPid",
                    !props.containsKey("docId") && !props.containsKey("dstPid") && !props.containsKey("srcPid"),
                    props.keySet().toString());
            check(def.name + " required = [vid, srcPath, srcName, dstPath]",
                    required != null && required.size() == 4 && required.contains("vid")
                            && required.contains("srcPath") && required.contains("srcName")
                            && required.contains("dstPath"), String.valueOf(required));
            check(def.name + " 描述里提醒不要用 docId/dstPid",
                    def.description != null && def.description.contains("不要用 docId"));
            check(def.name + " 仍是写操作且需确认", def.isWrite && def.needsConfirm);
        }

        check("move_doc 的 dstName 语义是“新名”（与 rename_doc 一致）",
                mv.parameters.getJSONObject("properties").getJSONObject("dstName")
                        .getString("description").contains("新名"));
    }

    /**
     * list_docs 的页脚是模型学"作业流程"的地方：不能再教它用 docId 下钻子目录
     * （否则模型先拿 docId、再用 docId 定位，又回到易失效的路径上）。
     */
    private static void testListDocsFooterTeachesPath() {
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<String, Object>();
        resp.put("status", "ok");
        java.util.List<Object> data = new java.util.ArrayList<Object>();
        java.util.Map<String, Object> dir = new java.util.LinkedHashMap<String, Object>();
        dir.put("name", "66666");
        dir.put("type", 2);
        dir.put("path", "");
        dir.put("docId", 102199016117L);
        data.add(dir);
        resp.put("data", data);

        String out = DocSysToolFactory.formatDocListPage(resp, 5, "", null, null, null);
        int tail = Math.max(0, out.length() - 120);
        check("页脚教 path 下钻（根目录 -> path=\"<子目录名>/\")",
                out.contains("list_docs(vid=5, path=\"<子目录名>/\")"), out.substring(tail));
        check("页脚不再出现 docId 下钻写法", !out.contains("docId=<该子目录 docId>"), out.substring(tail));

        String sub = DocSysToolFactory.formatDocListPage(resp, 5, "66666/", null, null, null);
        int tail2 = Math.max(0, sub.length() - 120);
        check("子目录内页脚给出完整子路径（66666/<子目录名>/）",
                sub.contains("list_docs(vid=5, path=\"66666/<子目录名>/\")"), sub.substring(tail2));
    }

    private static void testNormalizePath() {
        check("null -> 根目录空串", "".equals(DocSysToolFactory.normalizeDocPath(null)));
        check("空串 -> 空串", "".equals(DocSysToolFactory.normalizeDocPath("")));
        check("/ -> 空串（根目录）", "".equals(DocSysToolFactory.normalizeDocPath("/")));
        check("./ -> 空串（根目录）", "".equals(DocSysToolFactory.normalizeDocPath("./")));
        check("66666 -> 66666/（补尾斜杠）", "66666/".equals(DocSysToolFactory.normalizeDocPath("66666")));
        check("66666/ 保持不变", "66666/".equals(DocSysToolFactory.normalizeDocPath("66666/")));
        check("/66666 -> 66666/（去前导斜杠）", "66666/".equals(DocSysToolFactory.normalizeDocPath("/66666")));
        check("a/b -> a/b/", "a/b/".equals(DocSysToolFactory.normalizeDocPath("a/b")));
        check("  /a/b  -> a/b/（去空白）", "a/b/".equals(DocSysToolFactory.normalizeDocPath("  /a/b  ")));
        check("不产生双斜杠", "a/b/".equals(DocSysToolFactory.normalizeDocPath("a/b/")));
        check("折叠重复斜杠", "a/b/".equals(DocSysToolFactory.normalizeDocPath("a//b")));
        check("丢弃 . 段", "a/b/".equals(DocSysToolFactory.normalizeDocPath("a/./b/")));
        check("混合写法收敛", "a/b/".equals(DocSysToolFactory.normalizeDocPath("/a//./b/")));
    }

    private static void testLevelOfPath() {
        check("根目录 level=0", DocSysToolFactory.levelOfDocPath("") == 0);
        check("null 视作根目录 level=0", DocSysToolFactory.levelOfDocPath(null) == 0);
        check("/ 视作根目录 level=0", DocSysToolFactory.levelOfDocPath("/") == 0);
        check("66666/ level=1", DocSysToolFactory.levelOfDocPath("66666/") == 1);
        check("66666（未带斜杠）level=1", DocSysToolFactory.levelOfDocPath("66666") == 1);
        check("a/b/ level=2", DocSysToolFactory.levelOfDocPath("a/b/") == 2);
        check("a/b/c/ level=3", DocSysToolFactory.levelOfDocPath("a/b/c/") == 3);
    }

    /**
     * 线上真实 docId 指纹（2026-09-19/20 从 getSubDocList 实测取到）：
     * 只要 (level, path, name) 算回的 docId 与线上一致，就证明"path/name 是完整定位信息"、
     * 服务端不需要调用方传 docId。
     */
    private static void testPathNameIsCompleteLocator() {
        check("test111.txt@root: path+name+level -> 线上 docId 102077805632",
                Long.valueOf(102077805632L).equals(Path.buildDocIdByName(0, "", "test111.txt")));
        check("1111.txt@66666/: -> 线上 docId 202495761146",
                Long.valueOf(202495761146L).equals(Path.buildDocIdByName(1, "66666/", "1111.txt")));
        check("66666@root: -> 线上 docId 102199016117",
                Long.valueOf(102199016117L).equals(Path.buildDocIdByName(0, "", "66666")));
    }

    private static void testGetDocHistorySchema() {
        ToolDefinition def = DocSysToolFactory.getDocHistory(null);
        JSONObject params = def.parameters;
        JSONObject props = params.getJSONObject("properties");
        JSONArray required = params.getJSONArray("required");

        check("工具名是 get_doc_history", "get_doc_history".equals(def.name));
        check("暴露 path 参数", props != null && props.containsKey("path"));
        check("暴露 name 参数", props != null && props.containsKey("name"));
        check("不再暴露 docId 参数", props != null && !props.containsKey("docId"),
                props == null ? "properties 为空" : props.keySet().toString());
        check("required = [vid, path, name]", required != null && required.size() == 3
                && required.contains("vid") && required.contains("path") && required.contains("name"),
                String.valueOf(required));
        check("描述里提醒不要用 docId", def.description != null && def.description.contains("不要传 docId"));
        check("描述里说明只传 docId 会静默返回仓库根历史",
                def.description != null && def.description.contains("仓库根"));
    }
}
