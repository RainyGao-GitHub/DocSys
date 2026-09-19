package com.DocSystem.agent.tool;

import com.DocSystem.common.Path;

/**
 * 护栏：docId 编码与反解的不变量。
 *
 * <p>背景：realDoc 的 docId 不是数据库主键，而是 {@code Path.getDocId(level, parentPath+name)}
 * 算出的派生值：{@code docId = level*100000000000L + docPath.hashCode() + 102147483647L}。
 * {@code BaseController.resolveRealDocByDocId()} 依赖"由 docId 反推 level"来限定文件系统枚挙层级，
 * 这里用纯计算把该不变量钉住，避免将来 {@code Path.getDocId} 改动后反解静默失效。
 *
 * <p>注意：本类只用 {@code Path}（纯函数，裸 JVM 安全）；不碰 BaseController/BaseFunction/Lucene——
 * 它们在无容器环境下会 StackOverflow/NPE（已知环境限制）。
 */
public class TestDocIdResolve {

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

    /** 与 BaseController.deriveDocLevelFromDocId 等价（此处独立实现以便在裸 JVM 中断言） */
    private static int deriveLevel(long docId) {
        if (docId <= 0) {
            return -1;
        }
        return (int) Math.floorDiv(docId - 99999999999L, 100000000000L);
    }

    public static void main(String[] args) {
        testKnownValues();
        testLevelDerivationRoundTrip();
        testBoundaryHashCodes();
        testRootDocId();

        System.out.println("======== TestDocIdResolve: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /** 线上真实 docId（2026-09-19 从 /Repos/getSubDocList.do 与 DB 取到，作为公式指纹） */
    private static void testKnownValues() {
        check("docId(MoveDstX @root level0)", equals(Path.buildDocIdByName(0, "", "MoveDstX"), 102107242179L));
        check("docId(MoveSrcX @root level0)", equals(Path.buildDocIdByName(0, "", "MoveSrcX"), 102107687556L));
        check("docId(MoveSrcX @MoveDstX/ level1)", equals(Path.buildDocIdByName(1, "MoveDstX/", "MoveSrcX"), 202410056047L));
        check("docId(66666 @root level0)", equals(Path.buildDocIdByName(0, "", "66666"), 102199016117L));
        check("docId(6666622222 @root level0)", equals(Path.buildDocIdByName(0, "", "6666622222"), 103204121275L));
        check("docId(PRFix @root level0)", equals(Path.buildDocIdByName(0, "", "PRFix"), 102223878834L));
    }

    /** 反解不变量：level = floorDiv(docId - 99999999999, 1e11) 对任意 level/path/name 都成立 */
    private static void testLevelDerivationRoundTrip() {
        String[] names = {"a.txt", "MxsDoc产品介绍.md", "PPT文件打不开", "x", "very-long-name-with-.ext"};
        String[] paths = {"", "/", "A/", "/A/", "A/B/", "/A/B/C/", "中文目录/子目录/"};
        boolean allOk = true;
        int cases = 0;
        for (int level = 0; level <= 40; level++) {
            for (String path : paths) {
                for (String name : names) {
                    Long id = Path.buildDocIdByName(level, path, name);
                    cases++;
                    if (id == null || deriveLevel(id) != level) {
                        allOk = false;
                        System.out.println("       反解失败 level=" + level + " path=[" + path + "] name=" + name + " docId=" + id);
                    }
                }
            }
        }
        check("level 反解往返 " + cases + " 组全通过", allOk);
    }

    /** 边界：hashCode 取 Integer.MIN/MAX 时，公式仍必须可反解（常数项落在 11 位区间内） */
    private static void testBoundaryHashCodes() {
        long constMin = 102147483647L + Integer.MIN_VALUE;   // 99999999999
        long constMax = 102147483647L + Integer.MAX_VALUE;   // 104294967294
        boolean ok = true;
        for (int level = 0; level <= 20; level++) {
            long idMin = level * 100000000000L + constMin;
            long idMax = level * 100000000000L + constMax;
            if (deriveLevel(idMin) != level || deriveLevel(idMax) != level) {
                ok = false;
                System.out.println("       边界失败 level=" + level + " idMin=" + idMin + " idMax=" + idMax);
            }
        }
        check("边界 hashCode 可反解", ok);
    }

    /** 根目录：docId=0（且反解为 -1），这正是 resolver 必须特判的原因 */
    private static void testRootDocId() {
        check("root docId=0", equals(Path.buildDocIdByName(0, "", ""), 0L));
        check("root 反解为 -1", deriveLevel(0L) == -1);
        check("负数/0 不产生合法 level", deriveLevel(-1L) == -1);
    }

    private static boolean equals(Long actual, long expect) {
        return actual != null && actual.longValue() == expect;
    }
}
