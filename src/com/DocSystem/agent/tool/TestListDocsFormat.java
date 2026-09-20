package com.DocSystem.agent.tool;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 护栏：list_docs 的紧凑渲染与分页。
 *
 * <p>背景：原先 list_docs 直接把 /Repos/getSubDocList.do 的原始 JSON 交给 fmt()，
 * 而 fmt() 会截到 4000 字符 —— 仓库根目录 90+ 项时 JSON 只剩半截，模型既解析不了也拿不到后面的条目。
 * 本测试确保：输出紧凑可分页、永不出现半截 JSON、并给出总数/区间/翻页提示。
 */
public class TestListDocsFormat {

    private static int pass = 0;
    private static int fail = 0;

    private static void check(String name, boolean cond) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }

    private static Map<String, Object> entry(String name, int type, long size, long editTime, long docId) {
        Map<String, Object> d = new HashMap<String, Object>();
        d.put("name", name);
        d.put("type", type);
        d.put("size", size);
        d.put("latestEditTime", editTime);
        d.put("docId", docId);
        // 干扰字段（真实响应里有 20+ 个，渲染应忽略它们）
        d.put("localRootPath", "D:/test/");
        d.put("reposPath", "C:/DocSysReposes/5/");
        d.put("localVRootPath", "C:/DocSysReposes/5/data/vdata/");
        d.put("isRealDoc", true);
        d.put("creatorName", "Admin");
        return d;
    }

    private static Map<String, Object> resp(Object data) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("data", data);
        return m;
    }

    /** 造 n 项（隔一个目录），名字带中文，模拟真实仓库根目录 */
    private static List<Object> makeEntries(int n) {
        List<Object> list = new ArrayList<Object>();
        for (int i = 0; i < n; i++) {
            boolean dir = i % 2 == 0;
            String name = dir ? ("目录_" + i + "_测试") : ("文件" + i + "_产品介绍.md");
            list.add(entry(name, dir ? 2 : 1, dir ? 0 : (i + 1) * 2048L, 1789833890025L + i * 1000L,
                    100000000000L + i));
        }
        return list;
    }

    public static void main(String[] args) {
        int total = 93;
        Map<String, Object> full = resp(makeEntries(total));

        // 1) 默认页
        String p1 = DocSysToolFactory.formatDocListPage(full, 5, "", null, null, null);
        System.out.println("---- page1 (len=" + p1.length() + ") ----");
        System.out.println(firstLines(p1, 6));
        check("表头含总数", p1.contains("共 93 项"));
        check("表头含显示区间 1-50", p1.contains("本次显示第 1-50 项"));
        check("默认页 50 行", countLines(p1) == 50);
        check("含翻页提示 offset=50", p1.contains("offset=50"));
        check("不会被截断", p1.length() <= 4000 && !p1.contains("(truncated)"));
        check("目录行带 [目录] 与前缀", p1.contains("[目录] 目录_0_测试/"));
        check("文件行带 [文件] 与大小", p1.contains("[文件] 文件1_产品介绍.md") && p1.contains("2.0KB"));
        check("不再输出 docId 列（R1-6：行首以 path+name 定位）", !p1.contains("docId="));
        check("含日期", p1.contains("2026-"));
        check("中文名保留", p1.contains("产品介绍"));
        check("不再输出原始 JSON 字段", !p1.contains("localRootPath") && !p1.contains("reposPath"));
        check("给出 get_doc 用法提示", p1.contains("get_doc(vid=5"));

        // 2) 第二页
        String p2 = DocSysToolFactory.formatDocListPage(full, 5, "", null, 50, null);
        check("第二页区间 51-93", p2.contains("本次显示第 51-93 项"));
        check("第二页 43 行", countLines(p2) == 43);
        check("第二页无翻页提示", !p2.contains("还有") || !p2.contains("未显示"));

        // 3) offset 越界
        String p3 = DocSysToolFactory.formatDocListPage(full, 5, "", null, 999, null);
        check("offset 越界给明确提示", p3.contains("已超出范围") && p3.contains("0~92"));

        // 4) limit 传超大值：收敛到上限，且仍受字符预算约束（条数会按预算回收但不超过总数）
        String p4 = DocSysToolFactory.formatDocListPage(full, 5, "", null, 0, 9999);
        int shown4 = countLines(p4);
        check("limit 超大值被约束（0 < 显示条数 <= 总数，且比默认页多）",
                shown4 > 50 && shown4 <= total && p4.length() <= 4000);
        check("limit 超大值也给出剩余提示", p4.contains("未显示") && p4.contains("offset=" + shown4));

        // 5) 空目录 / 非法 data / 失败状态
        check("空列表", DocSysToolFactory.formatDocListPage(resp(new ArrayList<Object>()), 5, "", null, null, null)
                .contains("目录为空"));
        check("data 非列表", DocSysToolFactory.formatDocListPage(resp(""), 5, "A/", null, null, null)
                .contains("目录为空或不存在"));
        Map<String, Object> err = new HashMap<String, Object>();
        err.put("status", "fail");
        err.put("msgInfo", "您没有该目录的访问权限");
        check("失败状态透出原因", DocSysToolFactory.formatDocListPage(err, 5, "", null, null, null)
                .contains("您没有该目录的访问权限"));

        // 6) 超长名字 + 大 limit：字符预算回收后仍不超 4000，且区间自洽
        List<Object> longNames = new ArrayList<Object>();
        for (int i = 0; i < 200; i++) {
            longNames.add(entry("这是一个非常长的文件名用来撑爆字符预算_" + i + "_产品介绍文档.md", 1,
                    123456789L, 1789833890025L, 100000000000L + i));
        }
        String p6 = DocSysToolFactory.formatDocListPage(resp(longNames), 5, "很长的路径/子目录/", 12345L, 0, 200);
        System.out.println("---- page6 (len=" + p6.length() + ") ----");
        System.out.println(firstLines(p6, 3));
        check("超长场景不超字符预算", p6.length() <= 4000 && !p6.contains("(truncated)"));
        check("超长场景区间自洽（显示 1-N）", p6.matches("(?s).*本次显示第 1-\\d+ 项.*"));
        check("超长场景给出剩余提示", p6.contains("未显示") && p6.contains("offset="));
        check("超长场景表头含路径", p6.contains("很长的路径/子目录/"));

        System.out.println("======== TestListDocsFormat: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static int countLines(String s) {
        int n = 0;
        for (String line : s.split("\n")) {
            if (line.matches("^\\d+\\.\\s.*")) {
                n++;
            }
        }
        return n;
    }

    private static String firstLines(String s, int n) {
        String[] lines = s.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(n, lines.length); i++) {
            sb.append("   | ").append(lines[i]).append("\n");
        }
        return sb.toString();
    }
}
