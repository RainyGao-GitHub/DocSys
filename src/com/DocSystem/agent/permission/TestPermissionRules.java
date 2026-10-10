package com.DocSystem.agent.permission;

import com.DocSystem.agent.session.SessionEntity;
import com.DocSystem.agent.session.SessionRepository;
import com.DocSystem.agent.session.SessionService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * P2 护栏：会话内授权规则（"批准并记住"）的存取与语义。
 *
 * <p>用内存假仓储（无 Spring / 无 DB）验证：</p>
 * <ul>
 *   <li>追加/去重/读回（同 kind+tool+vid+path 不重复）</li>
 *   <li>规则条数上限（默认 50，超出丢最旧的）</li>
 *   <li>清空规则</li>
 *   <li>规则落库不破坏 metadata 里其它键（title）</li>
 *   <li>命中效果：自动档放行；**手动档不适用**；**绝对保护不可豁免**（策略层）</li>
 *   <li>目录授权的目录来源：`path` / `srcPath` / `dstPath`（移动/复制必须能被目录规则命中）</li>
 * </ul>
 */
public class TestPermissionRules {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testAddReadDedupe();
        testCapAndClear();
        testMetadataMerge();
        testRuleEffectOnPolicy();
        System.out.println("\n======== TestPermissionRules: " + pass + " passed, " + fail + " failed ========");
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

    private static class FakeRepo implements SessionRepository {
        final Map<String, SessionEntity> store = new HashMap<>();

        FakeRepo() {
            SessionEntity e = new SessionEntity("s1", "Admin", "js1");
            e.setMetadata("{\"title\":\"整理目录\"}");
            store.put("s1", e);
        }

        String meta(String sid) {
            SessionEntity e = store.get(sid);
            return e == null ? null : e.getMetadata();
        }

        @Override public SessionEntity selectBySessionId(String sid) { return store.get(sid); }
        @Override public List<SessionEntity> selectByUsername(String u) { return new ArrayList<>(store.values()); }
        @Override public int insert(SessionEntity s) { store.put(s.getSessionId(), s); return 1; }
        @Override public int updateLastActive(String sid, LocalDateTime now) { return 1; }
        @Override public int updateMetadata(String sid, String metadata) {
            SessionEntity e = store.get(sid);
            if (e == null) { return 0; }
            e.setMetadata(metadata);
            return 1;
        }
        @Override public int deleteBySessionId(String sid) { return store.remove(sid) != null ? 1 : 0; }
        @Override public int deleteInactiveBefore(LocalDateTime cutoff) { return 0; }
        @Override public long count() { return store.size(); }
    }

    private static Object[] build() {
        FakeRepo repo = new FakeRepo();
        SessionService svc = new SessionService();
        svc.setRepository(repo);
        PermissionStore store = new PermissionStore();
        store.setSessionService(svc);
        return new Object[]{repo, svc, store};
    }

    private static void testAddReadDedupe() {
        Object[] b = build();
        PermissionStore store = (PermissionStore) b[2];

        store.addRule("s1", new PermissionRule(PermissionRule.Kind.DIR, null, 5, "a/b"));
        store.addRule("s1", new PermissionRule(PermissionRule.Kind.TOOL, "delete_doc", null, null));
        store.addRule("s1", new PermissionRule(PermissionRule.Kind.DIR, null, 5, "a/b"));   // 重复

        List<PermissionRule> rules = store.getRules("s1");
        check("追加两条 + 重复一条 → 实际 2 条", rules.size() == 2, "size=" + rules.size());
        check("含目录规则", rules.get(0).kind == PermissionRule.Kind.DIR && "a/b".equals(rules.get(0).path));
        check("含工具规则", rules.get(1).kind == PermissionRule.Kind.TOOL && "delete_doc".equals(rules.get(1).tool));
        check("无会话/未装配 → 空规则（不抛异常）",
                store.getRules("nope").isEmpty() && store.getRules(null).isEmpty());
    }

    private static void testCapAndClear() {
        Object[] b = build();
        PermissionStore store = (PermissionStore) b[2];

        for (int i = 0; i < PermissionStore.MAX_RULES + 5; i++) {
            store.addRule("s1", new PermissionRule(PermissionRule.Kind.REPO, null, i + 1, null));
        }
        List<PermissionRule> rules = store.getRules("s1");
        check("条数上限 = " + PermissionStore.MAX_RULES, rules.size() == PermissionStore.MAX_RULES,
                "size=" + rules.size());
        check("超出后丢最旧的（保留最新 vid）",
                rules.get(rules.size() - 1).vid == PermissionStore.MAX_RULES + 5);

        store.clearRules("s1");
        check("清空后无规则", store.getRules("s1").isEmpty());
    }

    private static void testMetadataMerge() {
        Object[] b = build();
        FakeRepo repo = (FakeRepo) b[0];
        PermissionStore store = (PermissionStore) b[2];

        store.addRule("s1", new PermissionRule(PermissionRule.Kind.REPO, null, 9, null));
        check("写规则不破坏 title", "整理目录".equals(SessionService.titleFromMetadata(repo.meta("s1"))));
        store.clearRules("s1");
        check("清空规则不破坏 title", "整理目录".equals(SessionService.titleFromMetadata(repo.meta("s1"))));
        check("规则键可解析", SessionService.metaValueOf(repo.meta("s1"), "permissionRules") != null
                || store.getRules("s1").isEmpty());
    }

    private static void testRuleEffectOnPolicy() {
        // 2026-10-10 裁定 D9：DIR/REPO 规则**同时限定工具**；宽授权要用 DIR_ALL
        List<PermissionRule> rules = new ArrayList<>();
        rules.add(new PermissionRule(PermissionRule.Kind.DIR, "write_file", 5, "a/b"));

        check("自动档 + 目录规则（同工具） → 写入放行",
                PermissionPolicy.decide(PermissionMode.AUTO, ToolRisk.NORMAL, rules, "write_file",
                        args(5, "a/b/c")).isAllow());
        check("D9：自动档 + 目录规则 → **异工具（删除）仍问**（授权不再被默默放大）",
                PermissionPolicy.decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, rules, "delete_doc",
                        args(5, "a/b/x.txt")).isAsk());
        check("自动档 + 目录规则 → 跨目录仍问（用硬清单工具验证，否则自动档本就放行常规写）",
                PermissionPolicy.decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, rules, "delete_doc",
                        args(5, "other/x")).isAsk());
        // 2026-10-10 裁定 D2：规则在标准档也生效
        check("标准档 + 规则命中 → 放行（D2）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, rules, "write_file",
                        args(5, "a/b/c")).isAllow());

        // DIR_ALL：显式宽授权 —— 该目录内所有写操作（含删除）
        List<PermissionRule> wideRules = new ArrayList<>();
        wideRules.add(new PermissionRule(PermissionRule.Kind.DIR_ALL, "write_file", 5, "a/b"));
        check("自动档 + 目录(所有写操作)规则 → 删除也放行（覆盖硬清单）",
                PermissionPolicy.decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, wideRules, "delete_doc",
                        args(5, "a/b/x.txt")).isAllow());
        check("目录(所有写操作)规则 → 跨目录仍问",
                PermissionPolicy.decide(PermissionMode.AUTO, ToolRisk.DESTRUCTIVE, wideRules, "delete_doc",
                        args(5, "other/x")).isAsk());

        check("绝对保护不可被规则豁免（全部允许档也要问）",
                PermissionPolicy.decide(PermissionMode.ALLOW_ALL, ToolRisk.ABSOLUTE,
                        wideRules, "delete_repos", args(5, "a/b")).isAsk());

        // 2026-10-10 修：目录授权必须对**移动/复制**也有意义——它们的目录参数是 srcPath/dstPath
        // （改之前只认 path ⇒ move_doc 的目录规则永远不可能命中，"整理目录"授权形同虚设）
        List<PermissionRule> mvRules = new ArrayList<>();
        mvRules.add(new PermissionRule(PermissionRule.Kind.DIR, "move_doc", 5, "散落"));
        check("移动：源目录命中 → 放行（srcPath 在授权目录内）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, mvRules, "move_doc",
                        moveArgs(5, "散落/a", "归档/")).isAllow());
        check("移动：源目录的子目录命中 → 放行",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, mvRules, "move_doc",
                        moveArgs(5, "散落/sub/a", "归档/")).isAllow());
        check("移动：异工具仍问（目录规则仍限定工具）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.DESTRUCTIVE, mvRules, "delete_doc",
                        args(5, "散落/a")).isAsk());
        check("移动：**目标目录**在授权目录内也算命中（目录「参与」本次调用即可，不区分源/目标）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, mvRules, "move_doc",
                        moveArgs(5, "别的/a", "散落/")).isAllow());
        check("移动：源与目标都不在授权目录内 → 仍问",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, mvRules, "move_doc",
                        moveArgs(5, "别的/a", "又一个/")).isAsk());

        List<PermissionRule> dstRules = new ArrayList<>();
        dstRules.add(new PermissionRule(PermissionRule.Kind.DIR, "move_doc", 5, "归档"));
        check("移动：目标目录命中 → 放行（dstPath 在授权目录内）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, dstRules, "move_doc",
                        moveArgs(5, "散落/a", "归档/2026/")).isAllow());

        List<PermissionRule> rootRule = new ArrayList<>();
        rootRule.add(new PermissionRule(PermissionRule.Kind.DIR, "move_doc", 5, ""));
        check("移动：根目录规则（srcPath=\"\"）命中 → 放行",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, rootRule, "move_doc",
                        moveArgs(5, "", "归档/")).isAllow());
        check("目录规则在工具**没带任何目录参数**时不命中（fail-safe）",
                PermissionPolicy.decide(PermissionMode.MANUAL, ToolRisk.NORMAL, mvRules, "move_doc",
                        new com.alibaba.fastjson.JSONObject()).isAsk());
    }

    private static com.alibaba.fastjson.JSONObject moveArgs(int vid, String srcPath, String dstPath) {
        com.alibaba.fastjson.JSONObject o = new com.alibaba.fastjson.JSONObject();
        o.put("vid", vid);
        o.put("srcPath", srcPath);
        o.put("dstPath", dstPath);
        o.put("srcName", "a.txt");
        return o;
    }

    private static com.alibaba.fastjson.JSONObject args(int vid, String path) {
        com.alibaba.fastjson.JSONObject o = new com.alibaba.fastjson.JSONObject();
        o.put("vid", vid);
        o.put("path", path);
        return o;
    }
}
