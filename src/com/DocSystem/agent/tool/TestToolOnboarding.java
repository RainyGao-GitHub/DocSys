package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 护栏：新工具上线检查单的**机械项**（R3-6）。
 *
 * <p>把 {@code devDocs/Agent新工具上线检查单.md} 里能自动化的部分固化成一条命令：
 * <ul>
 *   <li><b>端点存在性</b>（本项是唯一此前没有护栏覆盖的空白）：`DocSysClient` 里出现的每个
 *       {@code "/Xxx/yyy.do"} 必须能在控制器里找到 —— 控制器用「类级 {@code @RequestMapping} 前缀 +
 *       方法级 mapping」拼出完整路径再比对。先例：R1-2 `create_doc_share` 指向不存在的
 *       `/Doc/createDocShare.do`，工具 100% 不可用却一直没被发现。</li>
 *   <li><b>自带反向自测</b>：喂一份假的 client 源码（含一个不存在的端点）→ 必须报缺失。
 *       护栏最怕"永远绿"，所以先证明它真能抓。</li>
 *   <li>整表 <b>schema 自洽</b>：`required ⊆ properties`、不得出现 `docId`/`pid`/`dstPid`/`reposId`。</li>
 *   <li>整表 <b>描述质量</b>：长度下限；不得教已下线用法（CLI/旧命令/占位凭据）；提到 docId 时必须是"别传"的告诫。</li>
 *   <li><b>检查单文档本身</b>存在且必需章节齐全（防"流程被架空"）。</li>
 * </ul>
 */
public class TestToolOnboarding {

    private static final String CLIENT_SRC = "src/com/DocSystem/agent/client/DocSysClient.java";
    private static final String CHECKLIST = "devDocs/Agent新工具上线检查单.md";

    /** 控制器源码根（websocket 是独立仓库，但工作树里就在这儿） */
    private static final String[] CONTROLLER_DIRS = {
            "src/com/DocSystem/controller",
            "src/com/DocSystem/websocket",
    };

    /** 明确不该再出现在描述里的"已下线用法" */
    private static final String[] BANNED_IN_DESC = {
            "delete-doc", "create-repos", "list-repos", "ai-models", "chat-with-docs",
            "admin2026", "localhost:8080", "docsys help",
    };

    private static final int MIN_DESC_LEN = 12;

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

    public static void main(String[] args) throws Exception {
        testEndpointCheckerSelfTest();
        testEndpointExistenceOnRealTree();
        testToolSchemas();
        testToolDescriptions();
        testChecklistDoc();

        System.out.println();
        System.out.println(pass + " passed, " + fail + " failed");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ==================== ① 端点存在性 ====================

    /** 从 client 源码里取出所有 `.do` 端点（跳过注释行） */
    static Set<String> clientEndpoints(String src) {
        Set<String> out = new TreeSet<String>();
        Pattern p = Pattern.compile("\"(/[A-Za-z0-9_]+/[A-Za-z0-9_]+\\.do)\"");
        for (String rawLine : src.split("\n", -1)) {
            String t = rawLine.trim();
            if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) {
                continue;
            }
            Matcher m = p.matcher(rawLine);
            while (m.find()) {
                out.add(m.group(1));
            }
        }
        return out;
    }

    /** 把一批控制器源码解析成"可路由的完整路径"集合（类级前缀 × 方法级 mapping） */
    static Set<String> controllerRoutes(Map<String, String> sources) {
        Set<String> out = new HashSet<String>();
        Pattern ann = Pattern.compile(
                "@(RequestMapping|PostMapping|GetMapping|PutMapping|DeleteMapping)\\s*\\(([^)]*)\\)",
                Pattern.DOTALL);
        Pattern lit = Pattern.compile("\"([^\"]*)\"");
        for (Map.Entry<String, String> e : sources.entrySet()) {
            String src = e.getValue();
            int classIdx = src.indexOf("\npublic class ");
            if (classIdx < 0) {
                classIdx = src.indexOf("\nclass ");
            }
            List<String> prefixes = new ArrayList<String>();
            List<String> methodPaths = new ArrayList<String>();
            Matcher m = ann.matcher(src);
            while (m.find()) {
                boolean beforeClass = classIdx < 0 || m.start() < classIdx;
                List<String> paths = new ArrayList<String>();
                Matcher lm = lit.matcher(m.group(2));
                while (lm.find()) {
                    paths.add(lm.group(1));
                }
                if (paths.isEmpty()) {
                    continue;   // 如 @RequestMapping(method = POST) 无路径
                }
                if (beforeClass) {
                    for (String p : paths) {
                        if (p.startsWith("/") || p.isEmpty()) {
                            prefixes.add(p);
                        }
                    }
                } else {
                    methodPaths.addAll(paths);
                }
            }
            if (prefixes.isEmpty()) {
                prefixes.add("");
            }
            for (String prefix : prefixes) {
                for (String mp : methodPaths) {
                    out.add(joinPath(prefix, mp));
                }
            }
        }
        return out;
    }

    private static String joinPath(String prefix, String path) {
        String p = path == null ? "" : path.trim();
        if (prefix == null || prefix.isEmpty()) {
            return normalize(p);
        }
        if (!p.startsWith("/")) {
            p = "/" + p;
        }
        String base = prefix.endsWith("/") ? prefix.substring(0, prefix.length() - 1) : prefix;
        return normalize(base + p);
    }

    private static String normalize(String p) {
        if (p.isEmpty()) {
            return "/";
        }
        if (!p.startsWith("/")) {
            p = "/" + p;
        }
        while (p.contains("//")) {
            p = p.replace("//", "/");
        }
        return p;
    }

    /** 返回 client 里没有被任何控制器映射覆盖的端点 */
    static List<String> missingEndpoints(String clientSrc, Map<String, String> sources) {
        Set<String> routes = controllerRoutes(sources);
        List<String> missing = new ArrayList<String>();
        for (String ep : clientEndpoints(clientSrc)) {
            if (!routeCovers(routes, ep)) {
                missing.add(ep);
            }
        }
        return missing;
    }

    /**
     * 端点是否被路由覆盖。
     *
     * <p>⚠️ 必须容忍**后缀差异**：Spring MVC 的 suffix pattern matching 会把 `.do` 剥掉再匹配，
     * 所以 `UserController` 写的 `@RequestMapping(value="getLoginUser")` 能应答 `/User/getLoginUser.do`
     * （实测登录/whoami 一直可用）。不容忍这一层就会把这三个正常端点误报为缺失。
     * 容忍后仍能抓到真正的缺失（例：`/Manage/getDocSysConfig.do` → 去后缀 `/Manage/getDocSysConfig` 也不存在）。
     */
    static boolean routeCovers(Set<String> routes, String endpoint) {
        if (routes.contains(endpoint)) {
            return true;
        }
        return routes.contains(endpoint.replaceAll("\\.[A-Za-z0-9]+$", ""));
    }

    /** 反向自测：伪造一个不存在的端点，检查器必须抓到；同时不得误报真实存在的 */
    private static void testEndpointCheckerSelfTest() {
        String fakeClient = "String url = baseUrl + \"/Bogus/nope.do\";\n"
                + "String ok = baseUrl + \"/Real/yes.do\";\n"
                + "// 注释里的 /NotAn/endpoint.do 不算\n";
        Map<String, String> fakeControllers = new HashMap<String, String>();
        fakeControllers.put("FakeController.java",
                "@Controller\n@RequestMapping(\"/Real\")\npublic class FakeController {\n"
                + "  @RequestMapping(\"/yes.do\")\n  public void yes() {}\n}\n");
        List<String> missing = missingEndpoints(fakeClient, fakeControllers);
        check("自测：注释行里的端点不被采集", !clientEndpoints(fakeClient).contains("/NotAn/endpoint.do"),
                String.valueOf(clientEndpoints(fakeClient)));
        check("自测：伪造的不存在端点被抓到", missing.contains("/Bogus/nope.do"), String.valueOf(missing));
        check("自测：真实存在的端点不误报", !missing.contains("/Real/yes.do"), String.valueOf(missing));
        check("自测：抓到的缺失端点恰好 1 个", missing.size() == 1, String.valueOf(missing));

        // 后缀容忍（Spring 会剥掉 .do 再匹配）：控制器写 /Real2/plain（无 .do），client 调 /Real2/plain.do
        Map<String, String> suffixControllers = new HashMap<String, String>();
        suffixControllers.put("SuffixController.java",
                "@Controller\n@RequestMapping(\"/Real2\")\npublic class SuffixController {\n"
                + "  @RequestMapping(value=\"plain\")\n  public void plain() {}\n}\n");
        List<String> m2 = missingEndpoints("String u = baseUrl + \"/Real2/plain.do\";\n", suffixControllers);
        check("自测：容忍 .do 后缀差异（Spring suffix matching）", m2.isEmpty(), String.valueOf(m2));
        List<String> m3 = missingEndpoints("String u = baseUrl + \"/Real2/other.do\";\n", suffixControllers);
        check("自测：后缀容忍不得放过真正的缺失", m3.contains("/Real2/other.do"), String.valueOf(m3));
    }

    private static void testEndpointExistenceOnRealTree() throws Exception {
        String clientSrc = readSource(CLIENT_SRC);
        check("能读到 DocSysClient 源码", clientSrc != null, CLIENT_SRC);
        if (clientSrc == null) {
            return;
        }
        Map<String, String> sources = new HashMap<String, String>();
        for (String dir : CONTROLLER_DIRS) {
            collectJavaSources(new File(dir), sources);
        }
        check("能读到控制器源码（controller + websocket）", sources.size() > 5, "files=" + sources.size());

        Set<String> eps = clientEndpoints(clientSrc);
        Set<String> routes = controllerRoutes(sources);
        List<String> missing = missingEndpoints(clientSrc, sources);
        System.out.println("  ↳ client 端点 " + eps.size() + " 个 / 控制器可路由路径 " + routes.size()
                + " 个 / 控制器文件 " + sources.size() + " 个");
        check("DocSysClient 端点全部能在控制器里找到映射（0 缺失）", missing.isEmpty(), String.valueOf(missing));
    }

    private static void collectJavaSources(File dir, Map<String, String> out) throws Exception {
        if (!dir.exists()) {
            return;
        }
        File[] files = dir.listFiles();
        if (files == null) {
            return;
        }
        for (File f : files) {
            if (f.isDirectory()) {
                if ("office".equals(f.getName())) {
                    continue;   // office 是另一层独立仓库，Agent 不依赖它
                }
                collectJavaSources(f, out);
            } else if (f.getName().endsWith(".java") && !f.getName().startsWith("Test")) {
                String s = readSource(f.getPath().replace('\\', '/'));
                if (s != null) {
                    out.put(f.getName(), s);
                }
            }
        }
    }

    // ==================== ② schema 自洽 ====================

    private static void testToolSchemas() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);
        List<ToolDefinition> tools = reg.list();
        check("工具表非空（自检前置）", tools != null && tools.size() >= 20, "size=" + (tools == null ? 0 : tools.size()));

        List<String> badRequired = new ArrayList<String>();
        List<String> badKeys = new ArrayList<String>();
        for (ToolDefinition def : tools) {
            JSONObject props = def.parameters == null ? null : def.parameters.getJSONObject("properties");
            Object req = def.parameters == null ? null : def.parameters.get("required");
            if (props == null) {
                continue;
            }
            for (String bad : new String[]{"docId", "pid", "dstPid", "reposId"}) {
                if (props.containsKey(bad)) {
                    badKeys.add(def.name + "." + bad);
                }
            }
            List<String> names = new ArrayList<String>();
            if (req instanceof JSONArray) {
                for (Object o : (JSONArray) req) {
                    names.add(String.valueOf(o));
                }
            } else if (req instanceof Iterable) {
                for (Object o : (Iterable<?>) req) {
                    names.add(String.valueOf(o));
                }
            } else if (req != null) {
                badRequired.add(def.name + " required 类型异常: " + req.getClass().getSimpleName());
            }
            for (String n : names) {
                if (!props.containsKey(n)) {
                    badRequired.add(def.name + "." + n);
                }
            }
        }
        check("所有工具 required ⊆ properties（schema 自洽）", badRequired.isEmpty(), String.valueOf(badRequired));
        check("工具参数不得出现 docId/pid/dstPid/reposId（R1-6/R3-1 口径）", badKeys.isEmpty(), String.valueOf(badKeys));
    }

    // ==================== ③ 描述质量 ====================

    private static void testToolDescriptions() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);
        List<String> tooShort = new ArrayList<String>();
        List<String> banned = new ArrayList<String>();
        List<String> rawDocId = new ArrayList<String>();
        for (ToolDefinition def : reg.list()) {
            String d = def.description == null ? "" : def.description;
            if (d.trim().length() < MIN_DESC_LEN) {
                tooShort.add(def.name + "(" + d.trim().length() + ")");
            }
            String low = d.toLowerCase();
            for (String b : BANNED_IN_DESC) {
                if (low.contains(b.toLowerCase())) {
                    banned.add(def.name + " → " + b);
                }
            }
            // 提到 docId 时必须同时说明它“不可用”（别传/已下线/失效…），否则就是在教模型用 docId 定位
            String bad = docIdMentionWithoutWarning(d);
            if (bad != null) {
                rawDocId.add(def.name + " → " + bad);
            }
        }
        check("所有工具描述长度 ≥ " + MIN_DESC_LEN, tooShort.isEmpty(), String.valueOf(tooShort));
        check("工具描述不含已下线用法/占位凭据", banned.isEmpty(), String.valueOf(banned));
        check("描述里提到 docId 时必须说明已失效/别传", rawDocId.isEmpty(), String.valueOf(rawDocId));
        testDocIdRuleSelfTest();
    }

    /** 描述里“docId 不可用”的上下文词（出现在同一句里就算合格） */
    private static final String[] DOCID_OK_CONTEXT = {
            "不要", "不得", "不许", "禁止", "已下线", "失效", "不含", "不再", "退出", "无效", "别再",
    };

    /** 返回“提到了 docId 但没说它不可用”的那句话；没有则返回 null */
    static String docIdMentionWithoutWarning(String desc) {
        if (desc == null) {
            return null;
        }
        for (String sentence : desc.split("[。！？\\n；;]")) {
            if (sentence.toLowerCase().indexOf("docid") < 0) {
                continue;
            }
            boolean ok = false;
            for (String w : DOCID_OK_CONTEXT) {
                if (sentence.contains(w)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                return sentence.trim();
            }
        }
        return null;
    }

    /** 反向自测：这条规则既要能抓“教模型传 docId”，也不能误伤“docId 已失效”的说明 */
    private static void testDocIdRuleSelfTest() {
        check("自测：教模型传 docId 的描述被判定不合规",
                docIdMentionWithoutWarning("定位文件时请传 docId 即可找到目标。") != null);
        check("自测：docId 必填的描述被判定不合规",
                docIdMentionWithoutWarning("参数：docId 必填。") != null);
        check("自测：docId 已失效的说明不被误伤",
                docIdMentionWithoutWarning("删除后原有的 docId/path 全部失效。") == null);
        check("自测：“不要传 docId”的告诫不被误伤",
                docIdMentionWithoutWarning("不要传 docId（只传 docId 会静默返回仓库根历史）。") == null);
    }

    // ==================== ④ 检查单文档 ====================

    private static void testChecklistDoc() throws Exception {
        String doc = readSource(CHECKLIST);
        check("检查单文档存在", doc != null, CHECKLIST);
        if (doc == null) {
            return;
        }
        String[] sections = {
                "## 0. 设计期", "## 1. 实现期自检", "## 2. 三件套验收", "## 3. 提交与上线",
                "## 4. 验收记录模板", "## 5. 常见坑索引",
        };
        for (String s : sections) {
            check("检查单含章节: " + s, doc.contains(s));
        }
        check("检查单写明定位口径（path/name，不含 docId 参数）",
                doc.contains("path/name") && doc.contains("不得出现 `docId`"));
        check("检查单写明端点存在性由 TestToolOnboarding 自动查", doc.contains("TestToolOnboarding"));
        check("检查单写明日志渠道必须走 com.DocSystem.common.Log",
                doc.contains("com.DocSystem.common.Log"));
    }

    // ==================== 工具方法 ====================

    private static String readSource(String relative) {
        File f = new File(relative);
        if (!f.exists()) {
            f = new File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /** 供调试用：打印解析出的路由（不在断言里用） */
    static Set<String> debugRoutes(Map<String, String> sources) {
        return new LinkedHashSet<String>(controllerRoutes(sources));
    }
}
