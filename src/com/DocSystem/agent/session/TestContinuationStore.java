package com.DocSystem.agent.session;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * P3 护栏：ContinuationStore + SessionService 的 metadata 自定义键。
 *
 * <p>用内存假 SessionRepository（无 Spring / 无 DB）验证：</p>
 * <ul>
 *   <li>续接短语识别：只认整条即是"继续/接着做/go on"的消息，正常请求不误判</li>
 *   <li>到顶记标记 → 下一条"继续"能拿到「上一段结论 + 工具进展摘要」；取用即清</li>
 *   <li>非续接请求不消费标记（标记仍在，之后说"继续"仍可续）</li>
 *   <li>写标记/清除标记**不影响 title**（metadata JSON 合并不覆盖既有键）</li>
 *   <li>无会话 / 未装配 SessionService → 全部退化为"无标记"（行为同改造前）</li>
 *   <li>超长结论/进展按上限截断（防把上下文撑爆）</li>
 * </ul>
 */
public class TestContinuationStore {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testContinuationQueryDetection();
        testSaveAndTake();
        testTakeClearsMarker();
        testNonContinuationDoesNotConsume();
        testMetadataMergeKeepsTitle();
        testNoSessionDegradation();
        testTruncation();
        System.out.println("\n======== TestContinuationStore: " + pass + " passed, " + fail + " failed ========");
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

    // ---------- 内存假仓储 ----------

    private static class FakeRepo implements SessionRepository {
        final Map<String, SessionEntity> store = new HashMap<>();

        FakeRepo put(String sessionId, String title) {
            SessionEntity e = new SessionEntity(sessionId, "Admin", "js1");
            if (title != null) {
                e.setMetadata("{\"title\":\"" + title + "\"}");
            }
            store.put(sessionId, e);
            return this;
        }

        String meta(String sessionId) {
            SessionEntity e = store.get(sessionId);
            return e == null ? null : e.getMetadata();
        }

        @Override public SessionEntity selectBySessionId(String sessionId) { return store.get(sessionId); }

        @Override public List<SessionEntity> selectByUsername(String username) {
            return new ArrayList<>(store.values());
        }

        @Override public int insert(SessionEntity session) {
            store.put(session.getSessionId(), session);
            return 1;
        }

        @Override public int updateLastActive(String sessionId, LocalDateTime now) {
            return store.containsKey(sessionId) ? 1 : 0;
        }

        @Override public int updateMetadata(String sessionId, String metadata) {
            SessionEntity e = store.get(sessionId);
            if (e == null) {
                return 0;
            }
            e.setMetadata(metadata);
            return 1;
        }

        @Override public int deleteBySessionId(String sessionId) {
            return store.remove(sessionId) != null ? 1 : 0;
        }

        @Override public int deleteInactiveBefore(LocalDateTime cutoff) { return 0; }

        @Override public long count() { return store.size(); }
    }

    /** 组装：SessionService(注入假仓储) + ContinuationStore */
    private static Object[] build(String sessionId, String title) {
        FakeRepo repo = new FakeRepo().put(sessionId, title);
        SessionService svc = new SessionService();
        svc.setRepository(repo);
        ContinuationStore store = new ContinuationStore();
        store.setSessionService(svc);
        return new Object[]{repo, svc, store};
    }

    // ---------- 用例 ----------

    private static void testContinuationQueryDetection() {
        check("query: 继续", ContinuationStore.isContinuationQuery("继续"));
        check("query: 继续（带句号）", ContinuationStore.isContinuationQuery("继续。"));
        check("query: 接着做", ContinuationStore.isContinuationQuery("接着做"));
        check("query: 继续吧 / go on / continue",
                ContinuationStore.isContinuationQuery("继续吧")
                        && ContinuationStore.isContinuationQuery("go on")
                        && ContinuationStore.isContinuationQuery("Continue"));
        check("query: 正常请求不误判（继续优化首页）",
                !ContinuationStore.isContinuationQuery("继续优化首页"));
        check("query: 空/null 不误判",
                !ContinuationStore.isContinuationQuery("") && !ContinuationStore.isContinuationQuery(null));
    }

    private static void testSaveAndTake() {
        Object[] b = build("s1", "测试会话");
        ContinuationStore store = (ContinuationStore) b[2];

        store.savePending("s1", "已完成 9/17 个仓库，还缺 8 个。", "get_repos(vid=1) → 测试仓库2\nlist_docs(vid=1) → 12 项", 6, 31);
        String ctx = store.takeContinuationContext("s1", "继续");

        check("save/take: ctx 非空", ctx != null && !ctx.isEmpty());
        check("save/take: 说明这是续接", ctx != null && ctx.contains("续接"));
        check("save/take: 带上一段结论", ctx != null && ctx.contains("还缺 8 个"));
        check("save/take: 带工具进展", ctx != null && ctx.contains("get_repos(vid=1)"));
        check("save/take: 要求补缺失部分", ctx != null && ctx.contains("只补做缺失的部分"));
    }

    private static void testTakeClearsMarker() {
        Object[] b = build("s2", null);
        FakeRepo repo = (FakeRepo) b[0];
        ContinuationStore store = (ContinuationStore) b[2];

        store.savePending("s2", "做了 A", "进展 A", 5, 5);
        check("clear: 标记已写入", SessionService.metaValueOf(repo.meta("s2"), "pendingContinuation") != null);

        String first = store.takeContinuationContext("s2", "继续");
        check("clear: 第一次能取到", first != null);
        check("clear: 取后标记已清除", SessionService.metaValueOf(repo.meta("s2"), "pendingContinuation") == null);
        check("clear: 第二次取不到（按普通消息处理）", store.takeContinuationContext("s2", "继续") == null);
    }

    private static void testNonContinuationDoesNotConsume() {
        Object[] b = build("s3", null);
        FakeRepo repo = (FakeRepo) b[0];
        ContinuationStore store = (ContinuationStore) b[2];

        store.savePending("s3", "结论", "进展", 5, 5);
        String ctx = store.takeContinuationContext("s3", "帮我列出所有仓库");
        check("非续接请求：不注入", ctx == null);
        check("非续接请求：标记保留",
                SessionService.metaValueOf(repo.meta("s3"), "pendingContinuation") != null);
        check("非续接请求之后仍可续", store.takeContinuationContext("s3", "继续") != null);
    }

    private static void testMetadataMergeKeepsTitle() {
        Object[] b = build("s4", "我的标题");
        FakeRepo repo = (FakeRepo) b[0];
        ContinuationStore store = (ContinuationStore) b[2];

        store.savePending("s4", "结论", "进展", 6, 9);
        check("merge: 写标记不影响 title",
                "我的标题".equals(SessionService.titleFromMetadata(repo.meta("s4"))));
        store.takeContinuationContext("s4", "继续");
        check("merge: 清标记不影响 title",
                "我的标题".equals(SessionService.titleFromMetadata(repo.meta("s4"))));
        check("merge: 键为合法 JSON（可再解析）",
                SessionService.metaValueOf(repo.meta("s4"), "title") != null);
    }

    private static void testNoSessionDegradation() {
        Object[] b = build("s5", null);
        ContinuationStore store = (ContinuationStore) b[2];

        // sessionId 为空 / 会话不存在 → 不抛异常、返回 null
        store.savePending(null, "结论", "进展", 6, 9);
        check("降级: sessionId=null 不抛异常", true);
        check("降级: 无标记 → take 返回 null",
                store.takeContinuationContext("s5", "继续") == null);
        check("降级: 不存在的会话 → take 返回 null",
                store.takeContinuationContext("not-exist", "继续") == null);

        ContinuationStore bare = new ContinuationStore();   // 未装配 SessionService
        bare.savePending("s5", "结论", "进展", 6, 9);
        check("降级: 未装配 SessionService 不抛异常且无续接",
                bare.takeContinuationContext("s5", "继续") == null);
    }

    private static void testTruncation() {
        Object[] b = build("s6", null);
        ContinuationStore store = (ContinuationStore) b[2];

        StringBuilder longText = new StringBuilder();
        for (int i = 0; i < 400; i++) {
            longText.append("行").append(i).append(" ");
        }
        store.savePending("s6", longText.toString(), longText.toString(), 5, 5);
        String ctx = store.takeContinuationContext("s6", "继续");

        check("截断: ctx 存在", ctx != null);
        check("截断: 结论按上限截断", ctx != null && ctx.contains("…（已截断）"));
        check("截断: ctx 总长受限（< 4000）", ctx != null && ctx.length() < 4000);
    }
}
