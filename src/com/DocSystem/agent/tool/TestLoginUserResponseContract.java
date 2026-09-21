package com.DocSystem.agent.tool;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 护栏：登录态判定的「响应归属」契约（R3-7）。
 *
 * <p>背景（R1-1 实测根因）：{@code BaseController.getLoginUser} 旧实现在部分分支里**自己**把响应写出去了
 * （{@code writeJson} + {@code return null}），于是同一个 {@code null} 返回值同时意味着「未登录」和
 * 「已经登录且响应已写」；调用方随后设的错误码/文案全部被丢弃（响应已提交），而且同一请求写了两次响应。
 *
 * <p>契约（本护栏固化）：
 * <ol>
 *   <li>{@code getLoginUser}：{@code User} = 已认证；{@code null} = 未认证/被拒（原因看 {@code rt}）；
 *       **本方法不写响应**，响应由调用方写。自动登录成功必须 {@code return loginUser}（不再 {@code return null}）。</li>
 *   <li>每个 {@code getLoginUser} 调用点必须立刻判空（{@code if(<var> == null)}），
 *       判空分支自己决定怎么回（写 JSON / SSE 发消息 / 向上抛 null 交给上层写）。</li>
 *   <li>{@code checkAndGetAccessInfo} 只设码不写响应：每个 {@code = checkAndGetAccessInfo(...)} 站点
 *       必须在紧随其后的窗口里自己 {@code writeJson}，且不得用 {@code throw} 代替响应
 *       （先例：{@code DocController.downloadDocChunked} 未登录时抛异常 → 500 错误页）。</li>
 * </ol>
 *
 * <p>护栏最怕"永远绿"，所以每个检测器都有反向自测：喂一份**故意违规**的源码必须被抓到，
 * 喂一份合规源码必须 0 违规，注释里出现关键词不得误报。
 */
public class TestLoginUserResponseContract {

    private static final String BASE_CONTROLLER_DIR = "src/com/DocSystem/controller";
    private static final String WEBSOCKET_DIR = "src/com/DocSystem/websocket";
    private static final String BASE_CONTROLLER = BASE_CONTROLLER_DIR + "/BaseController.java";
    private static final String DOC_CONTROLLER = BASE_CONTROLLER_DIR + "/DocController.java";
    private static final String USER_CONTROLLER = BASE_CONTROLLER_DIR + "/UserController.java";

    private static final String GET_LOGIN_USER_SIG =
            "public User getLoginUser(HttpSession session, HttpServletRequest request, HttpServletResponse response, ReturnAjax rt)";

    private static final String DOWNLOAD_CHUNKED_SIG = "public void downloadDocChunked(";

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
        testParsers();
        testGetLoginUserBody();
        testGetLoginUserCallSites();
        testAccessInfoCallSites();
        testDownloadDocChunked();
        testReverseSelfTests();

        System.out.println();
        System.out.println(pass + " passed, " + fail + " failed");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ==================== ① 解析器自检 ====================

    private static void testParsers() {
        String fake = "class A {\n"
                + "  void m() {\n"
                + "    String s = \"// 不是注释\";  // 真注释 writeJson(rt, response);\n"
                + "    /* 块注释 writeJson(rt, response); */\n"
                + "    int b = 1;\n"
                + "  }\n"
                + "  void n() { int c = 2; }\n"
                + "}\n";
        String stripped = stripComments(fake);
        check("解析器：行内字符串里的 // 不被当注释", stripped.contains("\"// 不是注释\""), stripped);
        check("解析器：行注释被剥掉", !stripped.contains("真注释 writeJson"), stripped);
        check("解析器：块注释被剥掉", !stripped.contains("块注释"), stripped);
        check("解析器：注释剥掉后代码仍在", stripped.contains("int b = 1;"), stripped);
        check("解析器：去注释后行数不变", sameLineCount(fake, stripped),
                "before=" + lineCount(fake) + " after=" + lineCount(stripped));

        String body = methodBody(stripped, "void m()");
        check("解析器：能取到方法体", body != null && body.startsWith("{") && body.endsWith("}"), String.valueOf(body));
        check("解析器：方法体在下个方法前收口", body != null && !body.contains("int c = 2"), String.valueOf(body));

        // 字符串里带花括号不得破坏花括号配对
        String braces = "class B {\n  void m() { String s = \"}{\"; int x = 1; }\n  void n() { }\n}\n";
        String b2 = methodBody(stripComments(braces), "void m()");
        check("解析器：字符串里的花括号不影响配对", b2 != null && !b2.contains("void n()"), String.valueOf(b2));
    }

    // ==================== ② getLoginUser 契约 ====================

    private static void testGetLoginUserBody() throws Exception {
        String src = readSource(BASE_CONTROLLER);
        check("能读到 BaseController 源码", src != null, BASE_CONTROLLER);
        if (src == null) {
            return;
        }
        String clean = stripComments(src);
        String body = methodBody(clean, GET_LOGIN_USER_SIG);
        check("能定位 getLoginUser 方法体", body != null, GET_LOGIN_USER_SIG);
        if (body == null) {
            return;
        }

        List<String> v = getLoginUserViolations(src);
        check("getLoginUser 契约全部满足（0 违规）", v.isEmpty(), String.valueOf(v));
        check("getLoginUser 方法体内不写响应（无 writeJson）", !body.contains("writeJson("),
                "writeJson 出现 " + countOf(body, "writeJson(") + " 次");
        check("getLoginUser 未登录分支保留 setError(用户未登录, NOT_LOGIN) + 直接 return null",
                Pattern.compile("setError\\(\"用户未登录\",\\s*ErrorCode\\.NOT_LOGIN\\);\\s*return null;",
                        Pattern.DOTALL).matcher(body).find(), body);
        check("getLoginUser 自动登录成功返回该用户（return loginUser）", body.contains("return loginUser;"), body);
        check("getLoginUser 自动登录成功保留 rt.setData(loginUser)（/User/getLoginUser.do 依赖）",
                body.contains("rt.setData(loginUser)"), body);
        check("getLoginUser 契约写进了方法注释（本方法不写响应）",
                javadocBefore(src, GET_LOGIN_USER_SIG).contains("本方法不写响应"),
                javadocBefore(src, GET_LOGIN_USER_SIG));

        // /User/getLoginUser.do 的两条出口都必须自己写响应（它依赖 rt 里已有的信息）
        String uSrc = readSource(USER_CONTROLLER);
        check("能读到 UserController 源码", uSrc != null, USER_CONTROLLER);
        if (uSrc == null) {
            return;
        }
        String uBody = methodBody(stripComments(uSrc), "public void getLoginUser(HttpServletRequest request");
        check("能定位 /User/getLoginUser.do 方法体", uBody != null);
        if (uBody != null) {
            check("/User/getLoginUser.do 未登录出口自己写响应（不依赖 getLoginUser 写）",
                    uBody.contains("if(user == null)") && uBody.contains("writeJson(rt, response);"), uBody);
        }
    }

    /** getLoginUser 方法体的契约违规列表（纯函数，便于反向自测） */
    static List<String> getLoginUserViolations(String src) {
        List<String> out = new ArrayList<String>();
        if (src == null) {
            out.add("源码为空");
            return out;
        }
        String clean = stripComments(src);
        String body = methodBody(clean, GET_LOGIN_USER_SIG);
        if (body == null) {
            out.add("无法定位 getLoginUser 方法体");
            return out;
        }
        if (body.contains("writeJson(")) {
            out.add("方法体内写了响应（writeJson）→ 调用方设的码/文案会被丢弃，且同一请求写两次响应");
        }
        if (!Pattern.compile("setError\\(\"用户未登录\",\\s*ErrorCode\\.NOT_LOGIN\\);\\s*return null;",
                Pattern.DOTALL).matcher(body).find()) {
            out.add("缺少 setError(\"用户未登录\", ErrorCode.NOT_LOGIN) 紧接 return null 的未登录出口");
        }
        if (!body.contains("return loginUser;")) {
            out.add("自动登录成功分支没有 return loginUser（null 的含义不唯一）");
        }
        if (!body.contains("rt.setData(loginUser)")) {
            out.add("自动登录成功分支丢了 rt.setData(loginUser)");
        }
        return out;
    }

    // ==================== ③ 调用点必须判空 ====================

    private static void testGetLoginUserCallSites() throws Exception {
        Map<String, String> sources = loadControllerSources();
        check("能读到控制器源码（controller + websocket）", sources.size() > 5, "files=" + sources.size());

        List<String> sites = new ArrayList<String>();
        for (Map.Entry<String, String> e : sources.entrySet()) {
            for (String line : callSiteLines(e.getValue(), "getLoginUser(session")) {
                sites.add(e.getKey() + ":" + line);
            }
        }
        System.out.println("  ↳ getLoginUser(session,...) 调用点 " + sites.size() + " 个");
        check("getLoginUser 调用点数量合理（>=20，防正则失效）", sites.size() >= 20, String.valueOf(sites.size()));

        List<String> v = getLoginUserCallSiteViolations(sources);
        check("每个 getLoginUser 调用点都立刻判空（0 违规）", v.isEmpty(), String.valueOf(v));
    }

    /** 调用点违规（纯函数）：赋值后紧邻的非空行必须是 if(<var> == null) / if(<var> != null) */
    static List<String> getLoginUserCallSiteViolations(Map<String, String> sources) {
        List<String> out = new ArrayList<String>();
        for (Map.Entry<String, String> e : sources.entrySet()) {
            String[] lines = stripComments(e.getValue()).split("\n", -1);
            for (int i = 0; i < lines.length; i++) {
                if (lines[i].indexOf("getLoginUser(session") < 0) {
                    continue;
                }
                Matcher m = Pattern.compile("(\\w+)\\s*=\\s*getLoginUser\\(session").matcher(lines[i]);
                if (!m.find()) {
                    out.add(e.getKey() + ":" + (i + 1) + " 无法解析接收变量（" + lines[i].trim() + "）");
                    continue;
                }
                String var = m.group(1);
                String next = nextNonBlank(lines, i + 1);
                if (next == null || !Pattern.compile("if\\s*\\(\\s*" + var + "\\s*(==|!=)\\s*null").matcher(next).find()) {
                    out.add(e.getKey() + ":" + (i + 1) + " " + var + " 之后未判空（下一行：" + next + "）");
                }
            }
        }
        return out;
    }

    // ==================== ④ checkAndGetAccessInfo 站点必须自己写响应 ====================

    private static void testAccessInfoCallSites() throws Exception {
        Map<String, String> sources = loadControllerSources();
        List<String> sites = new ArrayList<String>();
        for (Map.Entry<String, String> e : sources.entrySet()) {
            for (String line : callSiteLines(e.getValue(), "= checkAndGetAccessInfo(")) {
                sites.add(e.getKey() + ":" + line);
            }
        }
        System.out.println("  ↳ = checkAndGetAccessInfo(...) 站点 " + sites.size() + " 个");
        check("checkAndGetAccessInfo 站点数量合理（>=50，防正则失效）", sites.size() >= 50, String.valueOf(sites.size()));

        List<String> v = accessInfoCallSiteViolations(sources);
        check("每个 checkAndGetAccessInfo 站点自己写响应且不靠 throw（0 违规）", v.isEmpty(), String.valueOf(v));
    }

    /** 站点违规（纯函数）：紧邻窗口内必须出现写响应调用，且不得出现 throw new */
    static List<String> accessInfoCallSiteViolations(Map<String, String> sources) {
        List<String> out = new ArrayList<String>();
        for (Map.Entry<String, String> e : sources.entrySet()) {
            String[] lines = stripComments(e.getValue()).split("\n", -1);
            for (int i = 0; i < lines.length; i++) {
                if (lines[i].indexOf("= checkAndGetAccessInfo(") < 0) {
                    continue;
                }
                StringBuilder win = new StringBuilder();
                for (int j = i; j <= Math.min(i + 9, lines.length - 1); j++) {
                    win.append(lines[j]).append('\n');
                }
                String w = win.toString();
                boolean writes = w.contains("writeJson(") || w.contains("emitter.send(") || w.contains("writer.write(");
                if (!writes) {
                    out.add(e.getKey() + ":" + (i + 1) + " null 分支没有写响应（checkAndGetAccessInfo 只设码不写）");
                }
                Matcher tm = Pattern.compile("throw new").matcher(w);
                if (tm.find()) {
                    out.add(e.getKey() + ":" + (i + 1) + " null 分支用 throw 代替响应 → 未登录会变成 500 错误页");
                }
            }
        }
        return out;
    }

    // ==================== ⑤ downloadDocChunked ====================

    private static void testDownloadDocChunked() throws Exception {
        String src = readSource(DOC_CONTROLLER);
        check("能读到 DocController 源码", src != null, DOC_CONTROLLER);
        if (src == null) {
            return;
        }
        List<String> v = downloadDocChunkedViolations(src);
        check("downloadDocChunked 非法访问分支写 JSON 后 return（0 违规）", v.isEmpty(), String.valueOf(v));
    }

    /** downloadDocChunked 违规（纯函数） */
    static List<String> downloadDocChunkedViolations(String src) {
        List<String> out = new ArrayList<String>();
        if (src == null) {
            out.add("源码为空");
            return out;
        }
        String clean = stripComments(src);
        String body = methodBody(clean, DOWNLOAD_CHUNKED_SIG);
        if (body == null) {
            out.add("无法定位 downloadDocChunked 方法体");
            return out;
        }
        String block = ifBlock(body, "reposAccess\\s*==\\s*null");
        if (block == null) {
            out.add("找不到 reposAccess == null 分支");
            return out;
        }
        if (!block.contains("writeJson(")) {
            out.add("reposAccess == null 分支没有 writeJson → 响应没人写");
        }
        if (!block.contains("return;")) {
            out.add("reposAccess == null 分支没有 return → 会带着 null 继续执行");
        }
        if (block.contains("throw new")) {
            out.add("reposAccess == null 分支用 throw 代替响应 → 未登录变 500 错误页");
        }
        if (!body.contains("writeJson(rt, response);")) {
            out.add("方法体内没有 writeJson(rt, response)");
        }
        return out;
    }

    // ==================== ⑥ 反向自测（护栏必须真能抓） ====================

    private static void testReverseSelfTests() {
        // A. getLoginUser 回到旧写法（自己写响应 + 自动登录成功 return null）
        String badBody = "public class BaseController {\n"
                + "\tpublic User getLoginUser(HttpSession session, HttpServletRequest request, HttpServletResponse response, ReturnAjax rt)\n"
                + "\t{\n"
                + "\t\tUser user = (User) session.getAttribute(\"login_user\");\n"
                + "\t\tif(user == null)\n"
                + "\t\t{\n"
                + "\t\t\trt.setError(\"用户未登录\", ErrorCode.NOT_LOGIN);\n"
                + "\t\t\twriteJson(rt, response);\n"
                + "\t\t\treturn null;\n"
                + "\t\t}\n"
                + "\t\treturn user;\n"
                + "\t}\n"
                + "}\n";
        List<String> v = getLoginUserViolations(badBody);
        check("反向自测：方法体内 writeJson 被抓到", containsSub(v, "writeJson"), String.valueOf(v));
        check("反向自测：自动登录分支缺 return loginUser 被抓到", containsSub(v, "return loginUser"), String.valueOf(v));
        check("反向自测：旧写法至少 2 条违规", v.size() >= 2, String.valueOf(v));

        // B. 关键词只在注释里 → 不得误报
        String commentOnly = "public class BaseController {\n"
                + "\tpublic User getLoginUser(HttpSession session, HttpServletRequest request, HttpServletResponse response, ReturnAjax rt)\n"
                + "\t{\n"
                + "\t\t//旧实现这里 writeJson(rt, response); 然后 return null;\n"
                + "\t\tUser user = (User) session.getAttribute(\"login_user\");\n"
                + "\t\tif(user == null)\n"
                + "\t\t{\n"
                + "\t\t\trt.setError(\"用户未登录\", ErrorCode.NOT_LOGIN);\n"
                + "\t\t\treturn null;\n"
                + "\t\t}\n"
                + "\t\trt.setData(loginUser);\n"
                + "\t\treturn loginUser;\n"
                + "\t}\n"
                + "}\n";
        List<String> v2 = getLoginUserViolations(commentOnly);
        check("反向自测：注释里的 writeJson 不误报", !containsSub(v2, "writeJson"), String.valueOf(v2));
        check("反向自测：合规写法 0 违规", v2.isEmpty(), String.valueOf(v2));

        // C. 调用点漏判空 → 抓到
        Map<String, String> c1 = new HashMap<String, String>();
        c1.put("FakeController.java", "class FakeController {\n"
                + "  public void m() {\n"
                + "    User login_user = getLoginUser(session, request, response, rt);\n"
                + "    rt.setData(login_user.getType());\n"
                + "    writeJson(rt, response);\n"
                + "  }\n"
                + "}\n");
        List<String> v3 = getLoginUserCallSiteViolations(c1);
        check("反向自测：调用点漏判空被抓到", v3.size() == 1, String.valueOf(v3));

        Map<String, String> c2 = new HashMap<String, String>();
        c2.put("FakeController.java", "class FakeController {\n"
                + "  public void m() {\n"
                + "    User login_user = getLoginUser(session, request, response, rt);\n"
                + "    if(login_user == null) { writeJson(rt, response); return; }\n"
                + "  }\n"
                + "}\n");
        check("反向自测：判空写法不误报", getLoginUserCallSiteViolations(c2).isEmpty(),
                String.valueOf(getLoginUserCallSiteViolations(c2)));

        // D. checkAndGetAccessInfo 站点只 throw 不写 → 抓到
        Map<String, String> a1 = new HashMap<String, String>();
        a1.put("FakeDocController.java", "class FakeDocController {\n"
                + "  public void m() {\n"
                + "    reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);\n"
                + "    if(reposAccess == null)\n"
                + "    {\n"
                + "      docSysErrorLog(\"非法仓库访问！\", rt);\n"
                + "      throw new Exception(rt.getMsgInfo());\n"
                + "    }\n"
                + "  }\n"
                + "}\n");
        List<String> v4 = accessInfoCallSiteViolations(a1);
        check("反向自测：站点只 throw 被抓到2条（无写 + throw）", v4.size() == 2, String.valueOf(v4));

        Map<String, String> a2 = new HashMap<String, String>();
        a2.put("FakeDocController.java", "class FakeDocController {\n"
                + "  public void m() {\n"
                + "    reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);\n"
                + "    if(reposAccess == null)\n"
                + "    {\n"
                + "      rt.setErrorCodeIfAbsent(ErrorCode.NO_PERMISSION);\n"
                + "      writeJson(rt, response);\n"
                + "      return;\n"
                + "    }\n"
                + "  }\n"
                + "}\n");
        check("反向自测：站点自己写响应不误报", accessInfoCallSiteViolations(a2).isEmpty(),
                String.valueOf(accessInfoCallSiteViolations(a2)));

        // E. downloadDocChunked 回到抛异常写法 → 抓到
        String badChunked = "class DocController {\n"
                + "\tpublic void downloadDocChunked(Integer vid, String reposPath, String targetPath, String targetName,\n"
                + "\t\t\tHttpSession session, HttpServletRequest request, HttpServletResponse response, ReturnAjax rt) throws Exception\n"
                + "\t{\n"
                + "\t\treposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);\n"
                + "\t\tif(reposAccess == null)\n"
                + "\t\t{\n"
                + "\t\t\tdocSysErrorLog(\"非法仓库访问！\", rt);\n"
                + "\t\t\tthrow new Exception(rt.getMsgInfo());\n"
                + "\t\t}\n"
                + "\t}\n"
                + "}\n";
        List<String> v5 = downloadDocChunkedViolations(badChunked);
        check("反向自测：downloadDocChunked 抛异常写法被抓到", v5.size() >= 3, String.valueOf(v5));
    }

    // ==================== 工具方法 ====================

    /** 去掉 // 与 block 注释；保留字符串字面量内容（供消息匹配），行结构不变 */
    static String stripComments(String src) {
        StringBuilder sb = new StringBuilder(src.length());
        boolean inLine = false;
        boolean inBlock = false;
        boolean inStr = false;
        boolean inChr = false;
        for (int i = 0; i < src.length(); i++) {
            char c = src.charAt(i);
            char n = i + 1 < src.length() ? src.charAt(i + 1) : '\0';
            if (inLine) {
                if (c == '\n') {
                    inLine = false;
                    sb.append(c);
                } else {
                    sb.append(' ');
                }
                continue;
            }
            if (inBlock) {
                if (c == '*' && n == '/') {
                    inBlock = false;
                    sb.append("  ");
                    i++;
                } else {
                    sb.append(c == '\n' ? '\n' : ' ');
                }
                continue;
            }
            if (inStr || inChr) {
                if (c == '\\' && n != '\0') {
                    sb.append(c).append(n);
                    i++;
                    continue;
                }
                if (inStr && c == '"') {
                    inStr = false;
                } else if (inChr && c == '\'') {
                    inChr = false;
                }
                sb.append(c);
                continue;
            }
            if (c == '/' && n == '/') {
                inLine = true;
                i++;
                sb.append("  ");
                continue;
            }
            if (c == '/' && n == '*') {
                inBlock = true;
                i++;
                sb.append("  ");
                continue;
            }
            if (c == '"') {
                inStr = true;
            } else if (c == '\'') {
                inChr = true;
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /** 把字符串/字符字面量的内容替换为空格（长度不变）——只用于花括号配对 */
    private static String maskLiterals(String s) {
        StringBuilder sb = new StringBuilder(s);
        boolean inStr = false;
        boolean inChr = false;
        for (int i = 0; i < sb.length(); i++) {
            char c = sb.charAt(i);
            if (!inStr && !inChr) {
                if (c == '"') {
                    inStr = true;
                } else if (c == '\'') {
                    inChr = true;
                }
                continue;
            }
            if (c == '\\') {
                if (i + 1 < sb.length()) {
                    sb.setCharAt(i + 1, ' ');
                }
                continue;
            }
            if (inStr && c == '"') {
                inStr = false;
                continue;
            }
            if (inChr && c == '\'') {
                inChr = false;
                continue;
            }
            if (c != '\n') {
                sb.setCharAt(i, ' ');
            }
        }
        return sb.toString();
    }

    /** 取方法体（含花括号）；signature 需能唯一定位方法定义。src 需已去注释 */
    static String methodBody(String src, String signature) {
        if (src == null || signature == null) {
            return null;
        }
        int idx = src.indexOf(signature);
        if (idx < 0) {
            return null;
        }
        return bracedRegion(src, src.indexOf('{', idx + signature.length()));
    }

    /** 取 if(条件) 之后的花括号块；cond 为正则（条件体） */
    static String ifBlock(String src, String condRegex) {
        Pattern p = Pattern.compile("if\\s*\\(\\s*" + condRegex + "\\s*\\)");
        Matcher m = p.matcher(src);
        while (m.find()) {
            int open = src.indexOf('{', m.end());
            if (open < 0) {
                continue;
            }
            String r = bracedRegion(src, open);
            if (r != null) {
                return r;
            }
        }
        return null;
    }

    private static String bracedRegion(String src, int open) {
        if (open < 0) {
            return null;
        }
        String masked = maskLiterals(src);
        int depth = 0;
        for (int i = open; i < masked.length(); i++) {
            char c = masked.charAt(i);
            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return src.substring(open, i + 1);
                }
            }
        }
        return null;
    }

    /** 签名之前的 javadoc/注释块（去注释后为空，故在原文上取） */
    private static String javadocBefore(String src, String signature) {
        int idx = src.indexOf(signature);
        if (idx < 0) {
            return "";
        }
        int start = src.lastIndexOf("*/", idx);
        int st = src.lastIndexOf("/*", idx);
        if (st < 0 || st > idx) {
            return "";
        }
        return src.substring(st, Math.min(src.length(), idx));
    }

    private static boolean sameLineCount(String a, String b) {
        return lineCount(a) == lineCount(b);
    }

    private static int lineCount(String s) {
        int n = 1;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '\n') {
                n++;
            }
        }
        return n;
    }

    private static int countOf(String s, String needle) {
        int n = 0;
        int i = s.indexOf(needle);
        while (i >= 0) {
            n++;
            i = s.indexOf(needle, i + needle.length());
        }
        return n;
    }

    private static boolean containsSub(List<String> list, String needle) {
        for (String s : list) {
            if (s.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static String nextNonBlank(String[] lines, int from) {
        for (int i = from; i < lines.length; i++) {
            if (!lines[i].trim().isEmpty()) {
                return lines[i].trim();
            }
        }
        return null;
    }

    private static List<String> callSiteLines(String src, String needle) {
        List<String> out = new ArrayList<String>();
        String[] lines = stripComments(src).split("\n", -1);
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].contains(needle)) {
                out.add(String.valueOf(i + 1));
            }
        }
        return out;
    }

    private static Map<String, String> loadControllerSources() throws Exception {
        Map<String, String> sources = new HashMap<String, String>();
        collectJavaSources(new File(BASE_CONTROLLER_DIR), sources);
        collectJavaSources(new File(WEBSOCKET_DIR), sources);
        return sources;
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
                    continue;   // office 是另一层独立仓库
                }
                collectJavaSources(f, out);
            } else if (f.getName().endsWith(".java") && !f.getName().startsWith("Test")) {
                String s = readSource(f.getPath().replace('\\', '/'));
                if (s != null) {
                    out.put(f.getPath().replace('\\', '/'), s);
                }
            }
        }
    }

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
}
