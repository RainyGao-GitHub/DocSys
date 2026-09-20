package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * T1.6 护栏：ToolDefinition + ToolRegistry。
 * 纯 Java 自包含测试（main 入口），无 Spring 依赖。
 *
 * 覆盖：
 *  - ToolDefinition.Builder 构建 + 校验（空 name / null executor / needsConfirm 需 isWrite）
 *  - ToolRegistry register/find/list/names
 *  - execute 成功 / 未知工具 / 参数缺失 / executor 异常
 *  - adminOnly 可见性过滤
 */
public class TestToolRegistry {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testBuilderValidation();
        testRegisterAndFind();
        testExecuteSuccess();
        testExecuteUnknownTool();
        testExecuteMissingParam();
        testExecuteException();
        testAdminVisibility();
        testWriteFlag();
        testReadOnlyRoleFiltering();
        testExecutionListener();
        testFactorySchemaRequiredIsValidatable();
        System.out.println("\n======== TestToolRegistry: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- helpers ----------

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

    private static ToolDefinition buildListRepos() {
        JSONObject schema = new JSONObject();
        schema.put("type", "object");
        schema.put("properties", new JSONObject());
        return ToolDefinition.builder("list_repos", "列出当前用户可见的仓库", args -> ToolResult.ok("[仓库1, 仓库2]"))
                .parameters(schema)
                .build();
    }

    private static ToolDefinition buildGetDoc() {
        JSONObject props = new JSONObject();
        JSONObject vid = new JSONObject();
        vid.put("type", "integer");
        vid.put("description", "仓库ID");
        props.put("vid", vid);
        JSONObject schema = new JSONObject();
        schema.put("type", "object");
        schema.put("properties", props);
        schema.put("required", JSON.parseArray("[\"vid\"]"));
        return ToolDefinition.builder("get_doc", "获取文档内容",
                        args -> ToolResult.ok("文档内容: " + args.getString("vid")))
                .parameters(schema)
                .build();
    }

    private static ToolDefinition buildDeleteDoc() {
        return ToolDefinition.builder("delete_doc", "删除文档",
                        args -> ToolResult.ok("deleted"))
                .isWrite(true)
                .needsConfirm(true)
                .build();
    }

    private static ToolDefinition buildAdminOnly() {
        return ToolDefinition.builder("doc_sys_init", "系统初始化", args -> ToolResult.ok("init"))
                .adminOnly(true)
                .build();
    }

    // ---------- tests ----------

    private static void testBuilderValidation() {
        // 空 name
        try {
            ToolDefinition.builder("", "desc", args -> ToolResult.ok("x")).build();
            check("builder rejects empty name", false);
        } catch (IllegalArgumentException e) {
            check("builder rejects empty name", true);
        }
        // null executor
        try {
            ToolDefinition.builder("x", "desc", null).build();
            check("builder rejects null executor", false);
        } catch (IllegalArgumentException e) {
            check("builder rejects null executor", true);
        }
        // needsConfirm without isWrite
        try {
            ToolDefinition.builder("x", "desc", args -> ToolResult.ok("x"))
                    .needsConfirm(true).build();
            check("builder rejects needsConfirm without isWrite", false);
        } catch (IllegalArgumentException e) {
            check("builder rejects needsConfirm without isWrite", true);
        }
    }

    private static void testRegisterAndFind() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());
        reg.register(buildGetDoc());
        reg.register(buildDeleteDoc());
        reg.register(buildAdminOnly());
        check("register+size=4", reg.size() == 4);
        check("find list_repos", reg.find("list_repos") != null);
        check("find unknown = null", reg.find("nope") == null);
        check("names contains delete_doc", reg.names().contains("delete_doc"));
        check("list order stable", reg.list().get(0).name.equals("list_repos"));
        // 覆盖同名
        reg.register(buildListRepos());
        check("register override keeps size", reg.size() == 4);
    }

    private static void testExecuteSuccess() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());
        ToolResult r = reg.execute("list_repos", new JSONObject());
        check("execute success", r.success);
        check("execute summary", r.summary != null && r.summary.contains("仓库1"));
    }

    private static void testExecuteUnknownTool() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());
        ToolResult r = reg.execute("no_such_tool", new JSONObject());
        check("unknown tool -> error", !r.success && r.error.contains("Unknown tool"));
    }

    private static void testExecuteMissingParam() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildGetDoc());
        ToolResult r = reg.execute("get_doc", new JSONObject());
        check("missing required param -> error", !r.success && r.error.contains("vid"));
        ToolResult ok = reg.execute("get_doc", args("{\"vid\":5}"));
        check("with param -> success", ok.success);
    }

    /**
     * R3-2 体检回归锁（2026-09-20）：上面那个测试很早就绿，**但它是手搓 JSONArray**（`JSON.parseArray`），
     * 而工厂用 `objSchema(props, String[])` 把 `String[]` 直接塞进 schema → `validateParams` 里
     * `instanceof List` 不成立 → **全部真实工具的必填校验都被静默跳过**。
     * 实测症状：`create_repos{}` 不报缺必填，而抛
     * “Parameter specified as non-null is null: method okhttp3.FormBody$Builder.add”。
     * 这里改为**直接检查工厂产出**（不看手搓桩），并验证缺参数不会走到 executor。
     */
    private static void testFactorySchemaRequiredIsValidatable() {
        // 用假地址的 client：只查 schema / 走校验分支，不会发网络请求
        com.DocSystem.agent.client.DocSysClient client =
                new com.DocSystem.agent.client.DocSysClient("http://127.0.0.1:1/DocSystem");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);

        int withRequired = 0;
        boolean allIterable = true;
        for (ToolDefinition d : reg.list()) {
            Object req = d.parameters == null ? null : d.parameters.get("required");
            if (req == null) {
                continue;
            }
            withRequired++;
            if (!(req instanceof Iterable) && !(req instanceof Object[])) {
                allIterable = false;
                System.out.println("      required 非忭代类型: " + d.name + " -> " + req.getClass().getName());
            }
        }
        check("工厂产出的 required 都是可校验类型（Iterable）：共 " + withRequired + " 个工具带必填",
                allIterable && withRequired >= 15);

        // 缺必填必须在 executor 之前就被拦下（不能抛 NPE / 不能真发请求）
        for (String tool : new String[]{"create_repos", "delete_repos", "update_repos", "get_doc"}) {
            ToolResult r = reg.execute(tool, new JSONObject());
            check("工厂工具缺必填被拦下：" + tool,
                    !r.success && r.error != null && r.error.contains("missing required parameter"),
                    r.error);
        }
        // 空串必须视为“显式传值”，否则模型没法表达“根目录”
        ToolDefinition rootDoc = DocSysToolFactory.getDoc(client);
        ToolResult emptyPath = validateOnly(rootDoc, args("{\"vid\":5,\"path\":\"\",\"name\":\"a.txt\"}"));
        check("path 传空串不算缺参（根目录场景）", emptyPath.success, emptyPath.error);
        ToolResult missingName = validateOnly(rootDoc, args("{\"vid\":5,\"path\":\"\"}"));
        check("path 给了但 name 缺失仍被拦下", !missingName.success
                && missingName.error.contains("name"), missingName.error);
    }

    /** 只走 ToolRegistry 的校验分支（不真执行 executor）：用一个“必填已齐”的参数跑一个小注册表。 */
    private static ToolResult validateOnly(ToolDefinition def, JSONObject args) {
        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder(def.name, def.description, a -> ToolResult.ok("executed"))
                .parameters(def.parameters).build());
        return reg.execute(def.name, args);
    }

    private static void testExecuteException() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder("boom", "抛异常", args -> {
            throw new RuntimeException("kaboom");
        }).build());
        ToolResult r = reg.execute("boom", new JSONObject());
        check("executor exception -> error with message", !r.success && r.error.contains("kaboom"));
    }

    private static void testAdminVisibility() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());
        reg.register(buildAdminOnly());
        check("admin sees all", reg.listForUser(true).size() == 2);
        check("non-admin hides adminOnly", reg.listForUser(false).size() == 1);
        // 非管理员执行 adminOnly 工具被拒
        ToolResult r = reg.execute("doc_sys_init", new JSONObject(), false);
        check("non-admin execute adminOnly denied", !r.success && r.error.contains("admin"));
        // 管理员可执行
        ToolResult r2 = reg.execute("doc_sys_init", new JSONObject(), true);
        check("admin execute adminOnly ok", r2.success);
    }

    private static void testWriteFlag() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildDeleteDoc());
        ToolDefinition def = reg.find("delete_doc");
        check("write tool flagged", def.isWrite && def.needsConfirm);
    }

    private static void testReadOnlyRoleFiltering() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());       // 只读
        reg.register(buildDeleteDoc());       // 写
        reg.register(buildAdminOnly());       // adminOnly 只读
        // 只读用户（非管理员 + readOnly）：只看得到 list_repos
        java.util.List<ToolDefinition> ro = reg.listForUser(false, true);
        check("readOnly role: only read tools", ro.size() == 1 && "list_repos".equals(ro.get(0).name));
        // 普通用户（非只读）：看得见 list_repos + delete_doc，但看不见 adminOnly
        java.util.List<ToolDefinition> normal = reg.listForUser(false, false);
        check("normal user: read + write, no admin", normal.size() == 2);
        // 管理员（非只读）：全看见
        java.util.List<ToolDefinition> admin = reg.listForUser(true, false);
        check("admin: all tools", admin.size() == 3);
        // 管理员（只读）：只读工具含 adminOnly
        java.util.List<ToolDefinition> adminRo = reg.listForUser(true, true);
        check("admin readOnly: no write tools", adminRo.size() == 2);
    }

    private static void testExecutionListener() {
        ToolRegistry reg = new ToolRegistry();
        reg.register(buildListRepos());
        final int[] calls = {0};
        final String[] seenName = {null};
        final boolean[] seenWrite = {false};
        final boolean[] seenSuccess = {false};
        reg.setExecutionListener((tool, args, result, durationMs) -> {
            calls[0]++;
            seenName[0] = tool.name;
            seenWrite[0] = tool.isWrite;
            seenSuccess[0] = result.success;
        });

        reg.execute("list_repos", new JSONObject());
        check("listener invoked", calls[0] == 1);
        check("listener tool name", "list_repos".equals(seenName[0]));
        check("listener write flag", !seenWrite[0]);
        check("listener success", seenSuccess[0]);

        // 异常工具也应触发监听器
        ToolRegistry reg2 = new ToolRegistry();
        reg2.register(ToolDefinition.builder("boom", "抛异常", args -> {
            throw new RuntimeException("kaboom");
        }).build());
        final int[] calls2 = {0};
        reg2.setExecutionListener((tool, args, result, durationMs) -> calls2[0]++);
        reg2.execute("boom", new JSONObject());
        check("listener invoked on exception", calls2[0] == 1);
    }

    private static JSONObject args(String json) {
        return JSON.parseObject(json);
    }
}
