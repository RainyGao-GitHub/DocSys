package com.DocSystem.agent.tool;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 护栏：list_repos / get_repos 的紧凑渲染与分页（R1-5）。
 *
 * <p>背景：原先 list_repos 把 /Repos/getReposList.do 的原始 JSON 交给 fmt()，而该接口每项有 26 个字段
 * （localSvnPath/svnPwd/svnPwd1/remoteStorage/lockBy/lockTime/…），单条约 450 字符 —— 17 个仓库即 7.7KB，
 * 被 fmt() 截到 4000 字符后正好断在第 9 个仓库中间（2026-09-19 日志
 * {@code [ToolUseLoop][PARSE] ... 在第 9 个后被截断}）。除"拿不全"外，原文还含 svnPwd/svnPwd1 明文密码。
 *
 * <p>本测试钉住：渲染紧凑可分页、永不出现半截 JSON、给出总数/区间/翻页提示，且<b>绝不带出敏感字段</b>。
 */
public class TestListReposFormat {

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

    /** 按真实响应的字段集造一条仓库（含 svnPwd 等敏感项，渲染必须忽略它们） */
    private static Map<String, Object> repos(long id, String name, int type, Integer verCtrl, String localPath,
                                            String info) {
        Map<String, Object> r = new HashMap<String, Object>();
        r.put("id", id);
        r.put("name", name);
        r.put("type", type);
        r.put("verCtrl", verCtrl);
        r.put("realDocPath", localPath);
        r.put("info", info);
        r.put("owner", "Admin");
        // ↓ 敏感/噪声字段：不该出现在工具输出里
        r.put("svnPwd", "SECRET_SVN_PWD");
        r.put("svnPwd1", "SECRET_SVN_PWD1");
        r.put("svnUser", "svnuser");
        r.put("localSvnPath", "C:/DocSysReposes/ver/");
        r.put("svnPath", "https://svn.example.com/repo");
        r.put("remoteStorage", "{\"SRC\":\"minio\"}");
        r.put("lockBy", "Admin");
        r.put("lockTime", 1789833890025L);
        r.put("state", 0);
        r.put("isBussiness", false);
        r.put("isRemote", 0);
        r.put("isRemote1", 0);
        r.put("verCtrl1", 0);
        r.put("svnUser1", "svnuser1");
        r.put("svnPath1", "https://svn1.example.com/repo");
        r.put("localSvnPath1", "C:/DocSysReposes/ver1/");
        r.put("path", "C:/DocSysReposes/5/");
        r.put("createTime", 1765093419157L);
        return r;
    }

    private static Map<String, Object> resp(Object data) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("data", data);
        return m;
    }

    /** 17 个仓库：1~3 为 verCtrl=3、4~7 为 verCtrl=2、8~17 为 verCtrl=0（无 10 / GIT 4 / 磁盘 3，与 dev 实测分布一致） */
    private static List<Object> makeRepos(int n) {
        List<Object> list = new ArrayList<Object>();
        for (int i = 1; i <= n; i++) {
            Integer verCtrl;
            if (i <= 3) {
                verCtrl = 3;
            } else if (i <= 7) {
                verCtrl = 2;
            } else {
                verCtrl = 0;
            }
            // 前半给本地路径（模拟"我的桌面"这类），其它留空（系统默认位置）
            String localPath = i <= 8 ? ("D:/repos/" + i + "/") : "";
            // i=1 让 info 与 name 不同；其它 info == name（渲染时应省略）
            String info = i == 1 ? "这是一个用于回归验证的测试仓库" : ("仓库" + i);
            list.add(repos(i, "仓库" + i, 1, verCtrl, localPath, info));
        }
        return list;
    }

    public static void main(String[] args) {
        List<Object> all = makeRepos(17);
        Map<String, Object> full = resp(all);

        // 1) 一页列全 17 个：不再被截断
        String p1 = DocSysToolFactory.formatReposPage(full, null, null);
        System.out.println("---- list_repos (len=" + p1.length() + ") ----");
        System.out.println(p1);
        check("表头含总数", p1.contains("共 17 个"), p1.substring(0, Math.min(60, p1.length())));
        check("表头含显示区间 1-17", p1.contains("本次显示第 1-17 个"));
        check("17 个仓库全部列出（17 行）", countLines(p1) == 17, "lines=" + countLines(p1));
        check("不被截断（<4000 且无 truncated）", p1.length() < 4000 && !p1.contains("(truncated)"),
                "len=" + p1.length());
        check("每行都给出 vid", countOccurrences(p1, ". vid=") == 17, "count=" + countOccurrences(p1, ". vid="));
        check("每行都给出版本控制", countOccurrences(p1, "版本控制=") == 17,
                "count=" + countOccurrences(p1, "版本控制="));
        check("第一行含 vid=1", p1.contains("1. vid=1  「仓库1」"));
        check("类型文案=文件管理系统", p1.contains("文件管理系统"));
        check("版本控制=无 出现 10 次", countOccurrences(p1, "版本控制=无") == 10,
                "count=" + countOccurrences(p1, "版本控制=无"));
        check("版本控制=GIT 出现 4 次", countOccurrences(p1, "版本控制=GIT") == 4,
                "count=" + countOccurrences(p1, "版本控制=GIT"));
        check("版本控制=磁盘 出现 3 次", countOccurrences(p1, "版本控制=磁盘") == 3,
                "count=" + countOccurrences(p1, "版本控制=磁盘"));
        check("有本地路径时输出", p1.contains("本地路径=D:/repos/1/"));
        check("info 与 name 相同则不重复输出说明", countOccurrences(p1, "说明=") == 1,
                "count=" + countOccurrences(p1, "说明="));
        check("info 与 name 不同则输出说明", p1.contains("说明=这是一个用于回归验证的测试仓库"));
        check("页脚教 list_docs(vid=", p1.contains("list_docs(vid=<vid>)"));
        check("页脚教 get_repos(vid=", p1.contains("get_repos(vid=<vid>)"));
        check("一页列全时无翻页提示", !p1.contains("未显示"));

        // 2) 绝不带出敏感字段/原始 JSON 字段
        check("不含明文密码 svnPwd", !p1.contains("SECRET_SVN_PWD") && !p1.contains("svnPwd"));
        check("不含 svnUser/localSvnPath/svnPath", !p1.contains("svnUser") && !p1.contains("localSvnPath")
                && !p1.contains("svnPath"));
        check("不含 remoteStorage/lockBy", !p1.contains("remoteStorage") && !p1.contains("lockBy"));

        // 3) 分页
        String p2 = DocSysToolFactory.formatReposPage(full, 0, 5);
        check("limit=5 → 5 行", countLines(p2) == 5, "lines=" + countLines(p2));
        check("limit=5 → 表头区间 1-5", p2.contains("本次显示第 1-5 个"));
        check("limit=5 → 给出 offset=5 翻页提示", p2.contains("还有 12 个未显示") && p2.contains("offset=5"));
        String p3 = DocSysToolFactory.formatReposPage(full, 15, null);
        check("offset=15 → 2 行", countLines(p3) == 2, "lines=" + countLines(p3));
        String p4 = DocSysToolFactory.formatReposPage(full, 99, null);
        check("offset 越界提示范围", p4.contains("已超出范围") && p4.contains("0~16"), p4);
        String p5 = DocSysToolFactory.formatReposPage(full, 0, 9999);
        check("limit 超大收敛到上限（仍列全 17）", countLines(p5) == 17 && p5.length() < 4000);

        // 4) 空列表 / 失败
        String empty = DocSysToolFactory.formatReposPage(resp(new ArrayList<Object>()), null, null);
        check("空列表给明确文案", empty.contains("没有可见的仓库"), empty);
        Map<String, Object> failed = new HashMap<String, Object>();
        failed.put("status", "fail");
        failed.put("errorCode", "NOT_LOGIN");
        failed.put("msgInfo", "用户未登录，请先登录！");
        String f = DocSysToolFactory.formatReposPage(failed, null, null);
        check("失败保留错误码", f.contains("[错误码: NOT_LOGIN"), f);
        check("失败带处置提示", f.contains("登录已失效"));

        // 5) get_repos 单仓库紧凑渲染
        String one = DocSysToolFactory.formatOneRepos(resp(repos(1, "仓库1", 1, 2, "D:/repos/1/", "回归验证用")));
        System.out.println("---- get_repos ----");
        System.out.println(one);
        check("单仓库含 vid/名称", one.contains("仓库 vid=1") && one.contains("「仓库1」"));
        check("单仓库含类型/版本控制/本地路径", one.contains("类型：文件管理系统")
                && one.contains("版本控制：GIT") && one.contains("本地路径：D:/repos/1/"));
        check("单仓库含归属与说明", one.contains("归属：Admin") && one.contains("说明：回归验证用"));
        check("单仓库教 list_docs(vid=1)", one.contains("list_docs(vid=1)"));
        check("单仓库不含密码字段", !one.contains("SECRET_SVN_PWD") && !one.contains("svnPwd"));
        check("单仓库本地路径为空时给默认位置文案",
                DocSysToolFactory.formatOneRepos(resp(repos(2, "默认位置仓库", 1, 0, "", "x")))
                        .contains("本地路径：（系统默认位置）"));
        check("单仓库失败保留错误码",
                DocSysToolFactory.formatOneRepos(failed).contains("[错误码: NOT_LOGIN"));

        // 6) 标签映射（与 manager/addRepos.html 的选项一致）
        check("type 1 → 文件管理系统", "文件管理系统".equals(DocSysToolFactory.reposTypeLabel(1)));
        check("type 3 → SVN前置", "SVN前置".equals(DocSysToolFactory.reposTypeLabel(3)));
        check("type 4 → GIT前置", "GIT前置".equals(DocSysToolFactory.reposTypeLabel(4)));
        check("type 5 → 文件服务器前置", "文件服务器前置".equals(DocSysToolFactory.reposTypeLabel(5)));
        check("type null → 未知类型", "未知类型".equals(DocSysToolFactory.reposTypeLabel(null)));
        check("verCtrl 0 → 无", "无".equals(DocSysToolFactory.verCtrlLabel(0)));
        check("verCtrl 1 → SVN", "SVN".equals(DocSysToolFactory.verCtrlLabel(1)));
        check("verCtrl 2 → GIT", "GIT".equals(DocSysToolFactory.verCtrlLabel(2)));
        check("verCtrl 3 → 磁盘", "磁盘".equals(DocSysToolFactory.verCtrlLabel(3)));
        check("verCtrl null → 未配置", "未配置".equals(DocSysToolFactory.verCtrlLabel(null)));

        // 7) schema：offset/limit 可选（不设 required），描述里讲清分页
        ToolDefinition listDef = DocSysToolFactory.listRepos(null);
        JSONObject listParams = listDef.parameters;
        JSONObject listProps = listParams.getJSONObject("properties");
        check("list_repos 暴露 offset/limit", listProps != null && listProps.containsKey("offset")
                && listProps.containsKey("limit"));
        JSONArray listRequired = listParams.getJSONArray("required");
        check("list_repos 无必填项", listRequired == null || listRequired.isEmpty(),
                String.valueOf(listRequired));
        check("list_repos 描述提到分页", listDef.description != null && listDef.description.contains("分页"));

        ToolDefinition getDef = DocSysToolFactory.getRepos(null);
        JSONArray getRequired = getDef.parameters.getJSONArray("required");
        check("get_repos required=[vid]", getRequired != null && getRequired.size() == 1
                && getRequired.contains("vid"), String.valueOf(getRequired));

        System.out.println("\n======== TestListReposFormat: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /** 统计行数（忽略尾部空行；页脚说明行也算，故断言前先按内容判断） */
    private static int countLines(String s) {
        int n = 0;
        for (String line : s.split("\n")) {
            if (line.trim().isEmpty()) {
                continue;
            }
            // 只数条目行（"1. vid=" 形式）
            if (line.trim().matches("^\\d+\\. vid=.*")) {
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
}
