package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * R3-2 工具体检（批 1）护栏：仓库管理 + 备份 + 当前用户 6 个工具的“输出契约 + 描述质量 + 参数命名”。
 *
 * <p>由来（2026-09-20 真机体检发现）：
 * <ul>
 *   <li>`get_login_user` 原样倒 JSON（含 tel/email 等个人信息，231 字符）；</li>
 *   <li>`create_repos` 描述只有 5 个字、`backup_repos`/`query_backup_status` 各 8 个字 → 模型无从下手；</li>
 *   <li>`update_repos` 用孤例参数名 `reposId`（其余工具都是 `vid`）；</li>
 *   <li>`backup_repos` 原样倒 JSON：1047 字符，内含 `reposAccess.accessUser.pwd`（密码哈希）、
 *       邮箱、手机号、requestIP —— 既占上下文又泄露敏感信息；</li>
 *   <li>`delete_repos` 描述写“不可恢复”，而实测**磁盘文件不会被删**（描述与事实不符）；</li>
 *   <li>`delete_repos{vid:不存在}` 让服务端 NPE → HTTP 500 + Tomcat HTML 错误页（4136 字符），
 *       工具把 fastjson 语法错报给模型；已修（服务端带 REPOS_NOT_FOUND + 客户端非 JSON 兜底）。</li>
 * </ul>
 */
public class TestReposToolsFormat {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testSchemas();
        testDescriptions();
        testLoginUserRender();
        testBackupRender();
        testCreateRender();
        testUpdateRender();
        testDeleteRender();
        System.out.println("\n======== TestReposToolsFormat: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

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

    // ==================== schema ====================

    private static void testSchemas() {
        // 用假地址 client：只建 schema，不发请求
        com.DocSystem.agent.client.DocSysClient c =
                new com.DocSystem.agent.client.DocSysClient("http://127.0.0.1:1/DocSystem");

        check("update_repos 必填是 vid（不再是孤例 reposId）",
                required(DocSysToolFactory.updateRepos(c)).equals("[\"vid\"]"),
                required(DocSysToolFactory.updateRepos(c)));
        check("update_repos 不再暴露 reposId 属性",
                !propsOf(DocSysToolFactory.updateRepos(c)).contains("\"reposId\""),
                propsOf(DocSysToolFactory.updateRepos(c)));
        check("create_repos 必填 name+path", required(DocSysToolFactory.createRepos(c)).equals("[\"name\",\"path\"]"),
                required(DocSysToolFactory.createRepos(c)));
        check("delete_repos 必填 vid", required(DocSysToolFactory.deleteRepos(c)).equals("[\"vid\"]"),
                required(DocSysToolFactory.deleteRepos(c)));
        check("backup_repos 必填 vid", required(DocSysToolFactory.backupRepos(c)).equals("[\"vid\"]"),
                required(DocSysToolFactory.backupRepos(c)));
        check("query_backup_status 必填 taskId",
                required(DocSysToolFactory.queryBackupStatus(c)).equals("[\"taskId\"]"),
                required(DocSysToolFactory.queryBackupStatus(c)));
        check("get_login_user 无必填",
                required(DocSysToolFactory.getLoginUser(c)).equals("[]"),
                required(DocSysToolFactory.getLoginUser(c)));
    }

    private static String required(ToolDefinition d) {
        JSONArray arr = d.parameters == null ? null : d.parameters.getJSONArray("required");
        return arr == null ? "[]" : arr.toJSONString();
    }

    private static String propsOf(ToolDefinition d) {
        JSONObject props = d.parameters == null ? null : d.parameters.getJSONObject("properties");
        return props == null ? "" : props.toJSONString();
    }

    // ==================== 描述质量 ====================

    private static void testDescriptions() {
        com.DocSystem.agent.client.DocSysClient c =
                new com.DocSystem.agent.client.DocSysClient("http://127.0.0.1:1/DocSystem");
        // “描述只有几个字”就是这个批次的元凶：模型看不出行为/副作用/失败方式
        checkMinDesc("create_repos", DocSysToolFactory.createRepos(c), 100);
        checkMinDesc("delete_repos", DocSysToolFactory.deleteRepos(c), 80);
        checkMinDesc("update_repos", DocSysToolFactory.updateRepos(c), 60);
        checkMinDesc("backup_repos", DocSysToolFactory.backupRepos(c), 80);
        checkMinDesc("query_backup_status", DocSysToolFactory.queryBackupStatus(c), 80);
        checkMinDesc("get_login_user", DocSysToolFactory.getLoginUser(c), 40);

        check("create_repos 描述说明同名会被拒（REPOS_EXISTS）",
                DocSysToolFactory.createRepos(c).description.contains("REPOS_EXISTS"),
                DocSysToolFactory.createRepos(c).description);
        check("delete_repos 描述如实说明磁盘文件不删",
                DocSysToolFactory.deleteRepos(c).description.contains("磁盘上的文件目录不会被删除"),
                DocSysToolFactory.deleteRepos(c).description);
        check("delete_repos 描述不再写“不可恢复”",
                !DocSysToolFactory.deleteRepos(c).description.contains("不可恢复"),
                DocSysToolFactory.deleteRepos(c).description);
        check("backup_repos 描述说明 taskId 来源",
                DocSysToolFactory.backupRepos(c).description.contains("query_backup_status"),
                DocSysToolFactory.backupRepos(c).description);
        check("query_backup_status 描述说明 taskId 只能来自 backup_repos 回执",
                DocSysToolFactory.queryBackupStatus(c).description.contains("backup_repos")
                        && DocSysToolFactory.queryBackupStatus(c).description.contains("TASK_NOT_FOUND"),
                DocSysToolFactory.queryBackupStatus(c).description);
        check("update_repos 描述说明旧名已废弃",
                DocSysToolFactory.updateRepos(c).description.contains("reposId"),
                DocSysToolFactory.updateRepos(c).description);
    }

    private static void checkMinDesc(String tool, ToolDefinition d, int min) {
        check(tool + " 描述足够具体（≥" + min + " 字符）", d.description.length() >= min,
                "descLen=" + d.description.length() + " desc=" + d.description);
    }

    // ==================== 渲染 ====================

    private static void testLoginUserRender() {
        Map<String, Object> resp = ok();
        Map<String, Object> user = new HashMap<String, Object>();
        user.put("name", "Admin");
        user.put("id", 1);
        user.put("type", 2);
        user.put("tel", "13777479349");
        user.put("email", "652055239@qq.com");
        user.put("pwd", "e3afed0047b08059d0fada10f400c1e5");
        resp.put("data", user);

        String s = DocSysToolFactory.formatLoginUser(resp);
        check("get_login_user 给出用户名与 userId", s.contains("Admin") && s.contains("userId=1"), s);
        check("get_login_user 角色文案", s.contains("超级管理员"), s);
        check("get_login_user 不含手机号/邮箱/密码字段", !s.contains("13777479349")
                && !s.contains("652055239@qq.com") && !s.contains("pwd") && !s.contains("e3afed0047b08059"), s);
        check("get_login_user 失败保留错误码",
                DocSysToolFactory.formatLoginUser(failResp("NOT_LOGIN", "未登录")).contains("[错误码: NOT_LOGIN"));
        check("userTypeLabel 0/1/2", "普通用户".equals(DocSysToolFactory.userTypeLabel(0))
                && "管理员".equals(DocSysToolFactory.userTypeLabel(1))
                && "超级管理员".equals(DocSysToolFactory.userTypeLabel(2)));
    }

    /** 真实 backup_repos 响应的最小复刻：嵌 repos + reposAccess.accessUser（含 pwd/email/tel） */
    private static void testBackupRender() {
        Map<String, Object> resp = ok();
        Map<String, Object> task = new HashMap<String, Object>();
        task.put("id", "19-20260920201904");
        task.put("backupStorePath", "C:/DocSysReposes/_probeBackup");
        task.put("targetName", "19-test-20260920201904.zip");
        task.put("targetPath", "C:/DocSysReposes/_probeBackup");
        task.put("targetSize", 0);
        task.put("backupTime", "20260920201904");
        task.put("info", "备份中...");
        task.put("status", 1);
        task.put("requestIP", "127.0.0.1");
        Map<String, Object> repos = new HashMap<String, Object>();
        repos.put("name", "test");
        repos.put("id", 5);
        repos.put("path", "C:/DocSysReposes/");
        Map<String, Object> accessUser = new HashMap<String, Object>();
        accessUser.put("name", "Admin");
        accessUser.put("pwd", "e3afed0047b08059d0fada10f400c1e5");
        accessUser.put("email", "652055239@qq.com");
        accessUser.put("tel", "13777479349");
        Map<String, Object> access = new HashMap<String, Object>();
        access.put("accessUser", accessUser);
        task.put("repos", repos);
        task.put("reposAccess", access);
        resp.put("data", task);

        String s = DocSysToolFactory.formatBackupTask(resp, null);
        System.out.println("---- backup_repos 回执 (len=" + s.length() + ") ----");
        System.out.println(s);
        check("备份回执给任务 ID", s.contains("19-20260920201904"), s);
        check("备份回执给状态", s.contains("进行中"), s);
        check("备份回执给目标文件", s.contains("19-test-20260920201904.zip"), s);
        check("备份回执给存储目录", s.contains("C:/DocSysReposes/_probeBackup"), s);
        check("备份回执 < 4000 字符（实测原始 1047）", s.length() < 4000, "len=" + s.length());
        check("备份回执不泄露密码哈希/邮箱/手机号/IP",
                !s.contains("e3afed0047b08059d0fada10f400c1e5") && !s.contains("652055239@qq.com")
                        && !s.contains("13777479349") && !s.contains("127.0.0.1"), s);
        check("备份回执不含 accessUser/repos 原始字段",
                !s.contains("accessUser") && !s.contains("\"repos\""), s);
        check("备份回执失败保留错误码",
                DocSysToolFactory.formatBackupTask(failResp("TASK_NOT_FOUND", "任务不存在"), "x")
                        .contains("[错误码: TASK_NOT_FOUND"));
        check("备份状态映射 0/1/2 + 中止",
                "已完成".equals(DocSysToolFactory.backupStateText(0, false))
                        && "进行中".equals(DocSysToolFactory.backupStateText(1, false))
                        && "失败".equals(DocSysToolFactory.backupStateText(2, false))
                        && "已中止".equals(DocSysToolFactory.backupStateText(1, true)));
        check("备份回执在 data 非对象时给可读文案",
                DocSysToolFactory.formatBackupTask(ok(), "9-20260101000000").contains("9-20260101000000"));
    }

    private static void testCreateRender() {
        String s = DocSysToolFactory.formatReposCreated(ok(), "我的仓库", "C:/DocSysReposes/20/", 20);
        check("create_repos 回执给名称/路径/vid",
                s.contains("我的仓库") && s.contains("C:/DocSysReposes/20/") && s.contains("20"), s);
        check("create_repos 回执给下一步",
                s.contains("list_docs"), s);
        check("create_repos 回执在查不到 vid 时提示用 list_repos",
                DocSysToolFactory.formatReposCreated(ok(), "x", "y", null).contains("list_repos"));
        check("create_repos 失败保留错误码",
                DocSysToolFactory.formatReposCreated(failResp("INVALID_PARAM", "路径已被使用"), "x", "y", null)
                        .contains("[错误码: INVALID_PARAM"));
    }

    private static void testUpdateRender() {
        String s = DocSysToolFactory.formatReposUpdated(ok(), 5, "新名", null, null, null);
        check("update_repos 回执只列改了什么", s.contains("新名") && !s.contains("描述 →"), s);
        String moved = DocSysToolFactory.formatReposUpdated(ok(), 5, null, null, "D:/new/", "D:/old/");
        check("update_repos 改路径时提醒旧目录没搬", moved.contains("没有搬"), moved);
        check("update_repos 失败保留错误码",
                DocSysToolFactory.formatReposUpdated(failResp("REPOS_NOT_FOUND", "仓库不存在"), 5, "a", null, null, null)
                        .contains("[错误码: REPOS_NOT_FOUND"));
    }

    private static void testDeleteRender() {
        String s = DocSysToolFactory.formatReposDeleted(ok(), 19, "test", "C:/DocSysReposes/19/");
        check("delete_repos 回执带仓库名与 vid", s.contains("test") && s.contains("19"), s);
        check("delete_repos 回执告知磁盘未删并给目录", s.contains("磁盘文件未删除") && s.contains("C:/DocSysReposes/19/"), s);
        check("delete_repos 回执给出彻底清理办法", s.contains("管理后台"), s);
        check("delete_repos 回执在无目录时仍可读",
                DocSysToolFactory.formatReposDeleted(ok(), 19, "", "").contains("目录位置未知"));
        check("delete_repos 失败保留错误码（REPOS_NOT_FOUND）",
                DocSysToolFactory.formatReposDeleted(failResp("REPOS_NOT_FOUND", "仓库不存在！"), 999999, "", "")
                        .contains("[错误码: REPOS_NOT_FOUND"));
    }

    // ==================== fixtures ====================

    private static Map<String, Object> ok() {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("startTime", 1789906702659L);
        return m;
    }

    private static Map<String, Object> failResp(String code, String msg) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "fail");
        m.put("errorCode", code);
        m.put("msgInfo", msg);
        return m;
    }

    /** 保留：确认测试类本身未意外依赖集合顺序 */
    private static List<?> unused() {
        return JSON.parseArray("[]");
    }
}
