package com.DocSystem.agent.tool;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 护栏：分享工具（R1-2 create_doc_share / R1-3 get_doc_share_list）。
 *
 * <p>两个真问题（都已实测）：
 * <ul>
 *   <li><b>R1-2</b>：create_doc_share 原来调 {@code /Doc/createDocShare.do} —— 服务端<b>没有这个映射</b>
 *       （DocController 只有 getDocShareList/getDocShare/verifyDocSharePwd），工具 100% 404。
 *       真实创建分享在 {@code BussinessController:/addDocShare.do}，参数是 {@code reposId/path/name + 权限/过期}。</li>
 *   <li><b>R1-3</b>：get_doc_share_list 把 {@code vid}/{@code docId} 标成必填、描述"文档的分享列表"，
 *       而 {@code /Doc/getDocShareList.do} <b>不接受任何参数</b>，返回的是"当前用户的全部分享"
 *       —— 参数纯属误导。另：32 条分享的原始 JSON 实测 <b>11414 字符</b>，裸倒会被截到 4000。</li>
 * </ul>
 */
public class TestDocShareFormat {

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

    /** 按真实响应字段集造一条分享（shareAuth 是 JSON 字符串，含 9 个字段） */
    private static Map<String, Object> share(int shareId, int vid, String reposName, String path, String name,
                                            Long expireTime, String shareAuth) {
        Map<String, Object> s = new HashMap<String, Object>();
        s.put("id", shareId);
        s.put("shareId", shareId);
        s.put("vid", vid);
        s.put("reposName", reposName);
        s.put("docId", 0);
        s.put("path", path);
        s.put("name", name);
        s.put("sharedBy", 1);
        s.put("serverIp", "192.168.56.1");
        s.put("validHours", 0);
        s.put("expireTime", expireTime);
        s.put("shareAuth", shareAuth);
        return s;
    }

    private static final String READONLY_AUTH =
            "{\"access\":1,\"addEn\":0,\"deleteEn\":0,\"downloadEn\":1,\"editEn\":0,\"groupName\":\"\","
            + "\"heritable\":1,\"isAdmin\":0,\"realName\":\"\",\"userName\":\"\"}";

    private static Map<String, Object> resp(Object data) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("data", data);
        return m;
    }

    /** 32 条分享：14 条带 path/name（含 66666/ 下 3 条），其余是"整库分享"（path/name 皆空） */
    private static List<Object> makeShares(long now) {
        List<Object> list = new ArrayList<Object>();
        for (int i = 1; i <= 32; i++) {
            String path = "";
            String name = "";
            if (i <= 3) {
                path = "66666/";
                name = "文件" + i + ".txt";
            } else if (i <= 14) {
                path = "资料/子目录/";
                name = "报告" + i + ".md";
            }
            // 前 5 条已过期，其余有效
            Long expire = i <= 5 ? Long.valueOf(now - 3600000L) : Long.valueOf(now + 7L * 24 * 3600 * 1000);
            list.add(share(1000000 + i, i % 2 == 0 ? 1 : 2, "测试仓库" + (i % 3), path, name, expire, READONLY_AUTH));
        }
        return list;
    }

    public static void main(String[] args) {
        long now = System.currentTimeMillis();
        Map<String, Object> full = resp(makeShares(now));

        // 1) 列表渲染：一页列全 32 条、不截断、不带 shareAuth 原文
        String p1 = DocSysToolFactory.formatSharePage(full, null, null, null, null);
        System.out.println("---- get_doc_share_list (len=" + p1.length() + ") ----");
        System.out.println(firstLines(p1, 6));
        check("表头含总数", p1.contains("共 32 条"), firstLine(p1));
        check("32 条全部列出", countRows(p1) == 32, "rows=" + countRows(p1));
        check("不被截断（<4000 且无 truncated）", p1.length() < 4000 && !p1.contains("(truncated)"),
                "len=" + p1.length());
        check("每行给 shareId", countOccurrences(p1, ". shareId=") == 32,
                "count=" + countOccurrences(p1, ". shareId="));
        check("每行给权限摘要", countOccurrences(p1, "权限=") == 32, "count=" + countOccurrences(p1, "权限="));
        check("不把 shareAuth 原文倒出来", !p1.contains("\"access\":1") && !p1.contains("groupName"));
        check("整库分享写清“整库”", p1.contains("整库"));
        check("带 path/name 的直接显示路径", p1.contains("66666/文件1.txt"));
        check("过期条目标已过期", p1.contains("已过期"));
        check("有效条目给剩余小时", p1.contains("有效至") && p1.contains("剩 167h"));
        check("说明里教 shareLink 拼接", p1.contains("project.html?vid=") && p1.contains("shareId="));

        // 2) 权限摘要：只读+可下载（短写法）；其它位也能正确拼；预算回收用长写法时验证到
        check("只读权限摘要", "只读+可下载".equals(
                DocSysToolFactory.shareAuthSummary(READONLY_AUTH)));
        check("可编辑权限摘要", "可访问+可下载+可编辑".equals(DocSysToolFactory.shareAuthSummary(
                "{\"access\":1,\"downloadEn\":1,\"editEn\":1}")));
        check("可新增/可删除/管理位", "可访问+可新增+可删除+管理".equals(DocSysToolFactory.shareAuthSummary(
                "{\"access\":1,\"addEn\":1,\"deleteEn\":1,\"isAdmin\":1}")));
        check("无访问权摘要", "无访问权".equals(DocSysToolFactory.shareAuthSummary("{\"access\":0}")));
        check("shareAuth 空 → 未设置", "未设置".equals(DocSysToolFactory.shareAuthSummary(null)));
        check("shareAuth 非法 JSON 原样返回", "not-json".equals(DocSysToolFactory.shareAuthSummary("not-json")));

        // 3) 过滤（服务端不接受参数，只能在结果上过滤）
        String filtered = DocSysToolFactory.formatSharePage(full, "66666/", null, null, null);
        check("path 过滤后只剩 3 条", countRows(filtered) == 3, "rows=" + countRows(filtered));
        check("过滤时表头写明条件", filtered.contains("过滤条件") && filtered.contains("path=\"66666/\""));
        check("过滤时提示总数", filtered.contains("当前用户共有 32 条分享"));
        String byName = DocSysToolFactory.formatSharePage(full, "66666/", "文件2.txt", null, null);
        check("path+name 过滤只剩 1 条", countRows(byName) == 1, "rows=" + countRows(byName));
        String noMatch = DocSysToolFactory.formatSharePage(full, "不存在/", null, null, null);
        check("无匹配给明确文案", noMatch.contains("没有匹配"), noMatch);
        check("空列表给明确文案", DocSysToolFactory.formatSharePage(resp(new ArrayList<Object>()), null, null, null, null)
                .contains("还没有创建过任何分享"));

        // 4) 分页
        String p2 = DocSysToolFactory.formatSharePage(full, null, null, 0, 5);
        check("limit=5 → 5 条", countRows(p2) == 5, "rows=" + countRows(p2));
        check("limit=5 → 翻页提示 offset=5", p2.contains("还有 27 条未显示") && p2.contains("offset=5"), firstLine(p2));
        String p3 = DocSysToolFactory.formatSharePage(full, null, null, 30, null);
        check("offset=30 → 2 条", countRows(p3) == 2, "rows=" + countRows(p3));
        check("offset 越界提示", DocSysToolFactory.formatSharePage(full, null, null, 99, null)
                .contains("已超出范围"));

        // 5) 失败保留错误码
        Map<String, Object> failed = new HashMap<String, Object>();
        failed.put("status", "fail");
        failed.put("errorCode", "NOT_LOGIN");
        failed.put("msgInfo", "用户未登录，请先登录！");
        check("列表失败保留错误码", DocSysToolFactory.formatSharePage(failed, null, null, null, null)
                .contains("[错误码: NOT_LOGIN"));

        // 6) 创建结果渲染
        Map<String, Object> created = share(1952292941, 5, "test", "66666/", "README.md",
                now + 7L * 24 * 3600 * 1000, READONLY_AUTH);
        ((Map<String, Object>) created).put("shareLink",
                "http://192.168.56.1:8100/DocSystem/web/project.html?vid=5&shareId=1952292941");
        String c = DocSysToolFactory.formatShareCreated(resp(created));
        System.out.println("---- create_doc_share ----");
        System.out.println(c);
        check("创建结果含 shareId", c.contains("shareId：1952292941"), c);
        check("创建结果含链接", c.contains("project.html?vid=5&shareId=1952292941"));
        check("创建结果含有效期", c.contains("有效期至："));
        check("创建结果写明无密码", c.contains("密码：无"));
        check("创建结果写明权限", c.contains("只读 + 可下载"));
        check("创建结果证明凭据不泄露给模型以外的人", !c.contains("SECRET"));
        check("创建失败保留错误码", DocSysToolFactory.formatShareCreated(failed).contains("[错误码: NOT_LOGIN"));
        check("创建无 data 时给提示", DocSysToolFactory.formatShareCreated(resp(null))
                .contains("未返回分享详情"));

        // 7) schema：与真实端点一致
        ToolDefinition createDef = DocSysToolFactory.createDocShare(null);
        JSONObject createParams = createDef.parameters;
        JSONObject createProps = createParams.getJSONObject("properties");
        JSONArray createRequired = createParams.getJSONArray("required");
        check("create_doc_share required = [vid, path, name]",
                createRequired != null && createRequired.size() == 3 && createRequired.contains("vid")
                        && createRequired.contains("path") && createRequired.contains("name"),
                String.valueOf(createRequired));
        check("create_doc_share 不再暴露 docId", createProps != null && !createProps.containsKey("docId"),
                createProps == null ? "null" : createProps.keySet().toString());
        check("create_doc_share 不再暴露 shareType/expireTime",
                createProps != null && !createProps.containsKey("shareType")
                        && !createProps.containsKey("expireTime"));
        check("create_doc_share 暴露 sharePwd/shareHours",
                createProps != null && createProps.containsKey("sharePwd")
                        && createProps.containsKey("shareHours"));
        check("create_doc_share 描述提醒不要传 docId",
                createDef.description != null && createDef.description.contains("不要传 docId"));
        check("create_doc_share 描述说明默认有效期 7 天",
                createDef.description != null && createDef.description.contains("7 天后过期"));
        check("create_doc_share 描述说明只读+可下载",
                createDef.description != null && createDef.description.contains("只读"));
        check("create_doc_share 仍是需确认的写工具", createDef.isWrite && createDef.needsConfirm);
        check("分享默认 7 天（168 小时）", DocSysToolFactory.SHARE_DEFAULT_HOURS == 168,
                String.valueOf(DocSysToolFactory.SHARE_DEFAULT_HOURS));

        ToolDefinition listDef = DocSysToolFactory.getDocShareList(null);
        JSONObject listParams = listDef.parameters;
        JSONObject listProps = listParams.getJSONObject("properties");
        JSONArray listRequired = listParams.getJSONArray("required");
        check("get_doc_share_list 无必填项（服务端本就不接受参数）",
                listRequired == null || listRequired.isEmpty(), String.valueOf(listRequired));
        check("get_doc_share_list 不再有 vid/docId 参数",
                listProps != null && !listProps.containsKey("vid") && !listProps.containsKey("docId"),
                listProps == null ? "null" : listProps.keySet().toString());
        check("get_doc_share_list 暴露 path/name 作为过滤条件",
                listProps != null && listProps.containsKey("path") && listProps.containsKey("name"));
        check("get_doc_share_list 暴露 offset/limit", listProps != null && listProps.containsKey("offset")
                && listProps.containsKey("limit"));
        check("get_doc_share_list 描述如实说明语义（当前用户的全部分享 + 不接受参数）",
                listDef.description != null && listDef.description.contains("当前用户创建的全部分享")
                        && listDef.description.contains("不接受任何参数"));
        check("get_doc_share_list 描述说明 path/name 是过滤",
                listDef.description != null && listDef.description.contains("过滤"));

        testShareEndpointsRetired();

        System.out.println("\n======== TestDocShareFormat: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /**
     * 源码 lint：分享相关端点/签名必须与真实服务端一致（R1-2/R1-3）。
     *
     * <p>钉住的都是"改完还会悄悄退回去"的点：旧端点 {@code /Doc/createDocShare.do} 在服务端根本不存在，
     * 一旦有人把它写回来，工具就又是 100% 404；老签名 {@code getDocShareList(vid, docId, …)} 则是误导
     * （服务端不读参数）。
     */
    private static void testShareEndpointsRetired() {
        String client = readSource("src/com/DocSystem/agent/client/DocSysClient.java");
        String factory = readSource("src/com/DocSystem/agent/tool/DocSysToolFactory.java");
        String cli = readSource("src/com/DocSystem/agent/cli/DocSysCLI.java");
        if (client == null || factory == null || cli == null) {
            return;
        }
        check("DocSysClient 不再调不存在的 /Doc/createDocShare.do",
                !client.contains("baseUrl + \"/Doc/createDocShare.do\""));
        check("DocSysClient 改调真实端点 /Bussiness/addDocShare.do",
                client.contains("/Bussiness/addDocShare.do"));
        check("DocSysClient 有撤销分享端点 /Bussiness/deleteDocShare.do",
                client.contains("/Bussiness/deleteDocShare.do"));
        check("DocSysClient 已删旧的 createDocShare 方法", !client.contains("public Map<String, Object> createDocShare("));
        check("DocSysClient getDocShareList 不再收参数（服务端不读）",
                !client.contains("getDocShareList(Integer reposId"));
        check("工具层不再调 client.createDocShare", !factory.contains("client.createDocShare("));
        check("工具层不再暴露 shareType/expireTime 参数",
                !factory.contains("strProp(\"shareType\"") && !factory.contains("longProp(\"expireTime\""));
        check("CLI 不再调 createDocShare", !cli.contains("client.createDocShare("));
        check("CLI 有 share delete（能撤销）", cli.contains("cmdShareDelete"));
    }

    private static String readSource(String path) {
        java.io.File f = new java.io.File(path);
        if (!f.exists()) {
            check("源文件存在: " + path, false, "未找到（工作目录必须是工程根）");
            return null;
        }
        try {
            return new String(java.nio.file.Files.readAllBytes(f.toPath()),
                    java.nio.charset.Charset.forName("UTF-8"));
        } catch (Exception e) {
            check("读取源文件: " + path, false, e.getMessage());
            return null;
        }
    }

    private static int countRows(String s) {
        int n = 0;
        for (String line : s.split("\n")) {
            if (line.trim().matches("^\\d+\\. shareId=.*")) {
                n++;
            }
        }
        return n;
    }

    private static int countOccurrences(String s, String sub) {
        int n = 0;
        int i = s.indexOf(sub);
        while (i >= 0) {
            n++;
            i = s.indexOf(sub, i + sub.length());
        }
        return n;
    }

    private static String firstLine(String s) {
        return s == null ? "null" : s.split("\n")[0];
    }

    private static String firstLines(String s, int n) {
        String[] lines = s.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(n, lines.length); i++) {
            sb.append(lines[i]).append('\n');
        }
        return sb.toString();
    }
}
