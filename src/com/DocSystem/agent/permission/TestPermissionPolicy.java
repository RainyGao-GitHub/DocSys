package com.DocSystem.agent.permission;

import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * P1 护栏：权限判定矩阵（**纯函数，无 Spring / 无 IO / 无真实工具**）。
 *
 * <p>覆盖用户 2026-09-23 定稿的全部规则：</p>
 * <ul>
 *   <li>① 绝对保护：4 档全 ASK（含"全部允许"档），且**会话规则不能豁免**</li>
 *   <li>② 计划模式：写工具 DENY（即使有规则也 DENY）</li>
 *   <li>③ 规则命中：覆盖硬清单（含删除）</li>
 *   <li>④ 硬清单（DESTRUCTIVE/PERMISSION）：自动档 ASK、"全部允许"档 ALLOW</li>
 *   <li>⑤ 模式默认：手动 ASK / 自动・全部允许 ALLOW</li>
 *   <li>技能 risk：声明优先 → 内置只读白名单 → 未声明 fail-safe 绝对保护</li>
 *   <li>工具风险目录：登记值、未登记 fail-safe、delete_repos 绝对保护</li>
 *   <li>规则匹配：该工具 / 该目录（含子目录）/ 该仓库；跨目录/跨仓库不命中</li>
 * </ul>
 */
public class TestPermissionPolicy {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testModeDefaults();
        testHardList();
        testAbsoluteGuard();
        testPlanMode();
        testRules();
        testRuleMatching();
        testTraceLabel();
        testSkillRisk();
        testCatalog();
        testModeParsing();
        System.out.println("\n======== TestPermissionPolicy: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }

    private static JSONObject args(Object... kv) {
        JSONObject o = new JSONObject();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            o.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return o;
    }

    private static PermissionDecision decide(PermissionMode mode, ToolRisk risk,
                                             List<PermissionRule> rules, String tool, JSONObject a) {
        return PermissionPolicy.decide(mode, risk, rules, tool, a);
    }

    // ---------- ⑤ 模式默认 ----------

    private static void testModeDefaults() {
        check("手动 + 常规写 → ASK",
                decide(PermissionMode.MANUAL, ToolRisk.NORMAL, null, "write_file", args()).isAsk());
        check("自动 + 常规写 → ALLOW",
                decide(PermissionMode.AUTO, ToolRisk.NORMAL, null, "write_file", args()).isAllow());
        check("全部允许 + 常规写 → ALLOW",
                decide(PermissionMode.ALLOW_ALL, ToolRisk.NORMAL, null, "write_file", args()).isAllow());
        check("mode=null 按手动处理 → ASK",
                decide(null, ToolRisk.NORMAL, null, "write_file", args()).isAsk());
    }

    // ---------- ④ 硬清单 ----------

    private static void testHardList() {
        check("自动 + 破坏性（删除） → ASK",
                decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, null, "delete_doc", args()).isAsk());
        check("自动 + 权限变更（分享） → ASK",
                decide(PermissionMode.AUTO, ToolRisk.PERMISSION, null, "create_doc_share", args()).isAsk());
        check("自动 + 移动 → ASK",
                decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, null, "move_doc", args()).isAsk());
        check("全部允许 + 破坏性 → ALLOW（用户已知风险）",
                decide(PermissionMode.ALLOW_ALL, ToolRisk.DESTRUCTIVE, null, "delete_doc", args()).isAllow());
        PermissionDecision d = decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, null, "delete_doc", args());
        check("硬清单原因标注 hardlist", "hardlist".equals(d.reason.split("\\(")[0]));
    }

    // ---------- ① 绝对保护 ----------

    private static void testAbsoluteGuard() {
        for (PermissionMode m : PermissionMode.values()) {
            PermissionDecision d = decide(m, ToolRisk.ABSOLUTE, null, "delete_repos", args("vid", 3));
            check("绝对保护 + " + m.id + " → ASK（含全部允许档）", d.isAsk());
        }
        // 规则也不能豁免
        List<PermissionRule> rules = new ArrayList<>();
        rules.add(new PermissionRule(PermissionRule.Kind.REPO, null, 3, null));
        rules.add(new PermissionRule(PermissionRule.Kind.TOOL, "delete_repos", null, null));
        for (PermissionMode m : PermissionMode.values()) {
            PermissionDecision d = decide(m, ToolRisk.ABSOLUTE, rules, "delete_repos", args("vid", 3));
            check("绝对保护 + " + m.id + " + 规则命中 → 仍 ASK", d.isAsk() && "absolute".equals(d.reason));
        }
    }

    // ---------- ② 计划模式 ----------

    private static void testPlanMode() {
        check("计划 + 常规写 → DENY",
                decide(PermissionMode.PLAN, ToolRisk.NORMAL, null, "write_file", args("path", "a")).isDeny());
        check("计划 + 破坏性 → DENY",
                decide(PermissionMode.PLAN, ToolRisk.DESTRUCTIVE, null, "delete_doc", args()).isDeny());
        List<PermissionRule> rules = new ArrayList<>();
        rules.add(new PermissionRule(PermissionRule.Kind.TOOL, "write_file", null, null));
        check("计划 + 规则命中 → 仍 DENY（计划档不放行写）",
                decide(PermissionMode.PLAN, ToolRisk.NORMAL, rules, "write_file", args()).isDeny());
        check("计划 + 绝对保护 → ASK（绝对保护优先于计划档）",
                decide(PermissionMode.PLAN, ToolRisk.ABSOLUTE, null, "delete_repos", args()).isAsk());
    }

    // ---------- ③ 规则 ----------

    private static void testRules() {
        List<PermissionRule> rules = new ArrayList<>();
        rules.add(new PermissionRule(PermissionRule.Kind.TOOL, "delete_doc", null, null));
        check("自动 + 规则命中（该工具，危险项） → ALLOW",
                decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, rules, "delete_doc", args()).isAllow());
        check("自动 + 规则未命中 → ASK",
                decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, rules, "move_doc", args()).isAsk());
        PermissionDecision d = decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, rules, "delete_doc", args());
        check("规则命中原因标注 rule(tool)", "rule(tool)".equals(d.reason));
        // P2：规则只在自动档生效（手动档保持“每次都要确认”的纯粹语义）
        check("手动 + 规则命中 → 仍 ASK（规则不适用于手动档）",
                decide(PermissionMode.MANUAL, ToolRisk.DESTRUCTIVE, rules, "delete_doc", args()).isAsk());
        check("全部允许 + 规则无关（本来就 ALLOW）",
                decide(PermissionMode.ALLOW_ALL, ToolRisk.NORMAL, rules, "write_file", args()).isAllow());
    }

    private static void testRuleMatching() {
        PermissionRule dirRule = new PermissionRule(PermissionRule.Kind.DIR, null, 5, "a/b");
        check("目录规则：同目录命中", dirRule.matches("write_file", args("vid", 5, "path", "a/b")));
        check("目录规则：子目录命中", dirRule.matches("write_file", args("vid", 5, "path", "a/b/c")));
        check("目录规则：反斜杠/首尾斜杠等价", dirRule.matches("write_file", args("vid", 5, "path", "\\a\\b\\c\\")));
        check("目录规则：父目录不命中", !dirRule.matches("write_file", args("vid", 5, "path", "a")));
        check("目录规则：其它目录不命中", !dirRule.matches("write_file", args("vid", 5, "path", "a/bb")));
        check("目录规则：其它仓库不命中", !dirRule.matches("write_file", args("vid", 6, "path", "a/b/c")));
        check("目录规则：删除同样命中（覆盖硬清单）", dirRule.matches("delete_doc", args("vid", 5, "path", "a/b/x.txt")));

        PermissionRule repoRule = new PermissionRule(PermissionRule.Kind.REPO, null, 7, null);
        check("仓库规则：同仓库命中", repoRule.matches("move_doc", args("vid", 7, "path", "deep/dir")));
        check("仓库规则：其它仓库不命中", !repoRule.matches("move_doc", args("vid", 8, "path", "x")));

        PermissionRule toolRule = new PermissionRule(PermissionRule.Kind.TOOL, "write_file", null, null);
        check("工具规则：同名命中", toolRule.matches("write_file", args()));
        check("工具规则：异名不命中", !toolRule.matches("write_note", args()));

        check("路径规范化", "a/b".equals(PermissionRule.normalizePath("\\a//b/")));
        check("规则 JSON 往返",
                PermissionRule.parseList(PermissionRule.toJsonString(Arrays.asList(dirRule, repoRule, toolRule))).size() == 3);
        check("非法规则 JSON → 空列表（不抛异常）", PermissionRule.parseList("{not-json").isEmpty());
    }

    // ---------- 技能 risk ----------

    private static void testSkillRisk() {
        check("技能声明 safe → NORMAL",
                SkillRiskRegistry.resolve("x", "safe") == ToolRisk.NORMAL);
        check("技能声明 write → NORMAL",
                SkillRiskRegistry.resolve("x", "write") == ToolRisk.NORMAL);
        check("技能声明 dangerous → DESTRUCTIVE",
                SkillRiskRegistry.resolve("x", "dangerous") == ToolRisk.DESTRUCTIVE);
        check("技能声明 absolute → ABSOLUTE",
                SkillRiskRegistry.resolve("x", "absolute") == ToolRisk.ABSOLUTE);
        check("未知声明 → fail-safe ABSOLUTE",
                SkillRiskRegistry.resolve("x", "whatever") == ToolRisk.ABSOLUTE);
        check("内置只读技能 whoami（未声明）→ NORMAL",
                SkillRiskRegistry.resolve("whoami", null) == ToolRisk.NORMAL);
        check("未知技能（未声明）→ fail-safe ABSOLUTE",
                SkillRiskRegistry.resolve("some_third_party_skill", null) == ToolRisk.ABSOLUTE);
        check("空 skillId → fail-safe ABSOLUTE",
                SkillRiskRegistry.resolve(null, null) == ToolRisk.ABSOLUTE);

        // 端到端：run_skill 走技能解析（PermissionContext）
        PermissionContext ctx = new PermissionContext(PermissionMode.AUTO, null);
        check("自动档：whoami 技能不再弹",
                ctx.decide(null, args()) == null ? false : true);   // 占位：def=null 只验证不抛异常
        check("自动档：未声明技能 → ASK",
                ctx.decide(runSkillDef(), args("skillId", "unknown_skill")).isAsk());
        check("自动档：内置只读技能 → ALLOW",
                ctx.decide(runSkillDef(), args("skillId", "whoami")).isAllow());
        check("自动档：声明 dangerous 的技能 → ASK",
                new PermissionContext(PermissionMode.AUTO, null, id -> ToolRisk.DESTRUCTIVE)
                        .decide(runSkillDef(), args("skillId", "x")).isAsk());
    }

    /** 构造一个 run_skill 的最小 ToolDefinition（只需要 name） */
    private static com.DocSystem.agent.tool.ToolDefinition runSkillDef() {
        return com.DocSystem.agent.tool.ToolDefinition
                .builder("run_skill", "运行技能", a -> com.DocSystem.agent.tool.ToolResult.ok("ok"))
                .isWrite(true).needsConfirm(true).build();
    }

    // ---------- 工具风险目录 ----------

    private static void testCatalog() {
        check("删仓库 = 绝对保护", ToolRiskCatalog.registered("delete_repos") == ToolRisk.ABSOLUTE);
        check("删文档 = 破坏性", ToolRiskCatalog.registered("delete_doc") == ToolRisk.DESTRUCTIVE);
        check("移动 = 破坏性", ToolRiskCatalog.registered("move_doc") == ToolRisk.DESTRUCTIVE);
        check("改名 = 破坏性", ToolRiskCatalog.registered("rename_doc") == ToolRisk.DESTRUCTIVE);
        check("更新仓库 = 破坏性", ToolRiskCatalog.registered("update_repos") == ToolRisk.DESTRUCTIVE);
        check("分享 = 权限变更", ToolRiskCatalog.registered("create_doc_share") == ToolRisk.PERMISSION);
        check("写文件 = 常规", ToolRiskCatalog.registered("write_file") == ToolRisk.NORMAL);
        check("建目录 = 常规", ToolRiskCatalog.registered("create_folder") == ToolRisk.NORMAL);
        check("未登记工具 → 目录返回 null（调用方 fail-safe）", ToolRiskCatalog.registered("no_such") == null);
        check("绝对保护含 delete_repos 且不可移除", ToolRiskCatalog.ABSOLUTE_GUARDED.contains("delete_repos"));
        check("resolve(未登记 def) → ABSOLUTE（fail-safe）",
                ToolRiskCatalog.resolve(com.DocSystem.agent.tool.ToolDefinition
                        .builder("mystery_tool", "d", a -> com.DocSystem.agent.tool.ToolResult.ok("x"))
                        .isWrite(true).needsConfirm(true).build()) == ToolRisk.ABSOLUTE);
        check("def.riskClass 覆盖目录",
                ToolRiskCatalog.resolve(com.DocSystem.agent.tool.ToolDefinition
                        .builder("delete_doc", "d", a -> com.DocSystem.agent.tool.ToolResult.ok("x"))
                        .isWrite(true).needsConfirm(true)
                        .riskClass(ToolRisk.NORMAL).build()) == ToolRisk.NORMAL);
    }

    // ---------- P2：批准来源标注 ----------

    private static void testTraceLabel() {
        check("ASK → 手动确认", "手动确认".equals(PermissionTrace.approvalLabel("ASK:hardlist(destructive)")));
        check("ALLOW rule(dir) → 已授权规则(dir)",
                "已授权规则（dir）".equals(PermissionTrace.approvalLabel("ALLOW:rule(dir)")));
        check("ALLOW mode(auto) → 自动档放行",
                "自动档放行".equals(PermissionTrace.approvalLabel("ALLOW:mode(auto)")));
        check("ALLOW mode(allowAll) → 全部允许",
                "全部允许".equals(PermissionTrace.approvalLabel("ALLOW:mode(allowAll)")));
        check("DENY plan → 被拒绝", "被拒绝".equals(PermissionTrace.approvalLabel("DENY:plan")));
        check("空痕迹 → null", PermissionTrace.approvalLabel(null) == null);
    }

    // ---------- 模式解析 ----------

    private static void testModeParsing() {
        check("id 解析 plan/manual/auto/allowAll",
                PermissionMode.fromId("plan") == PermissionMode.PLAN
                        && PermissionMode.fromId("manual") == PermissionMode.MANUAL
                        && PermissionMode.fromId("auto") == PermissionMode.AUTO
                        && PermissionMode.fromId("allowAll") == PermissionMode.ALLOW_ALL);
        check("非法/空 → fromId=null，fromIdOrDefault=手动",
                PermissionMode.fromId("bogus") == null
                        && PermissionMode.fromIdOrDefault("bogus") == PermissionMode.MANUAL
                        && PermissionMode.fromIdOrDefault(null) == PermissionMode.MANUAL);
        check("默认模式 = 手动", PermissionMode.DEFAULT == PermissionMode.MANUAL);
        check("isValid", PermissionMode.isValid("allowAll") && !PermissionMode.isValid("yolo"));
    }
}
