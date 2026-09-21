package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.client.DocSysClient;

import java.io.File;
import java.lang.reflect.Field;
import java.nio.charset.Charset;
import java.nio.file.Files;

/**
 * 护栏：旧编排「冻结 + 兜底可观测」（R3-4 / R3-5，2026-09-21 用户裁定方案 1）。
 *
 * <p><b>裁定内容（方案 1 = 保守封口）</b>：
 * <ul>
 *   <li>R3-5：删掉 {@code DocSysClient} 里三个**零调用者**方法
 *       （{@code getManagerReposList} / {@code getSystemEmailConfig} / {@code getSessionCookie}）；
 *       仅 CLI 用的方法**保留**（{@code DocSysCLI} 本轮不动）；</li>
 *   <li>R3-4：旧编排（{@code MainAgent.process} → {@code decomposeTask} → {@code SubAgent} +
 *       {@code LLMIntentParser}）**不删**，但**冻结**：打 {@code @Deprecated} + 封口注释，
 *       只修 bug，禁止新增能力 / 新增 taskType 分支；</li>
 *   <li>兜底可观测：进入旧编排时统一打 {@code [LEGACY-FALLBACK]} 标记日志，
 *       便于一次 grep 统计兜底真实触发率（攒够数据再决定删除还是保留）。</li>
 * </ul>
 *
 * <p><b>为什么用「源码 lint + 反射」而不是跑真实兜底</b>：触发旧编排需要 ToolUseLoop 失败
 * （LLM 网关异常 / 轮次耗尽）或关掉灰度开关，属不可控注入；而这里真正会退化的地方是
 * "后来者又往旧编排里加能力"或"把零调用方法顺手加回来"。因此护栏钉住三类事实：
 * ① 已删方法确实不在（反射）；② 封口标记与注解确实在（lint）；③ 冻结基线数量不涨（tripwire）。
 *
 * <p>运行工作目录 = 工程根（与其它 agent 护栏一致）。本类不 new 任何 Spring Bean，
 * 反射只做「类是否声明了该方法」，不触发 {@code BaseFunction} 初始化（裸 JVM 下
 * {@code Log} 写文件会递归 StackOverflow，见 TestSkillExecEncoding 的说明）。
 */
public class TestLegacyFallbackGuard {

    private static final String MA = "src/com/DocSystem/agent/orchestrator/MainAgent.java";
    private static final String SA = "src/com/DocSystem/agent/orchestrator/SubAgent.java";
    private static final String LIP = "src/com/DocSystem/agent/nlu/LLMIntentParser.java";
    private static final String AC = "src/com/DocSystem/agent/controller/AgentController.java";
    private static final String CLIENT = "src/com/DocSystem/agent/client/DocSysClient.java";
    private static final String CLI = "src/com/DocSystem/agent/cli/DocSysCLI.java";

    /** 与 {@code MainAgent.LEGACY_FALLBACK_TAG} 必须一致 */
    private static final String TAG = "[LEGACY-FALLBACK]";

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

    private static String read(String path) {
        try {
            File f = new File(path);
            if (!f.exists()) {
                return null;
            }
            return new String(Files.readAllBytes(f.toPath()), Charset.forName("UTF-8"));
        } catch (Exception e) {
            return null;
        }
    }

    private static int count(String text, String needle) {
        if (text == null || needle == null || needle.isEmpty()) {
            return -1;
        }
        int n = 0;
        int i = 0;
        while ((i = text.indexOf(needle, i)) >= 0) {
            n++;
            i += needle.length();
        }
        return n;
    }

    private static boolean isCommentOrBlank(String t) {
        return t.isEmpty() || t.startsWith("*") || t.startsWith("/*") || t.startsWith("//");
    }

    /** 声明所在行 idx 之前最近的"有效行"是否恰为该注解 */
    private static boolean annotatedAt(String[] lines, int idx, String annotation) {
        for (int j = idx - 1; j >= 0 && j >= idx - 12; j--) {
            String t = lines[j].trim();
            if (isCommentOrBlank(t)) {
                continue;
            }
            return t.equals(annotation);
        }
        return false;
    }

    /** 首个含 declContains 的声明是否带该注解 */
    private static boolean annotatedBefore(String text, String declContains, String annotation) {
        if (text == null) {
            return false;
        }
        String[] lines = text.split("\n", -1);
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].contains(declContains)) {
                return annotatedAt(lines, i, annotation);
            }
        }
        return false;
    }

    /** 统计同时含 declContains 且带该注解的声明个数 */
    private static int countAnnotatedDecls(String text, String declContains, String annotation) {
        if (text == null) {
            return -1;
        }
        String[] lines = text.split("\n", -1);
        int n = 0;
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].contains(declContains) && annotatedAt(lines, i, annotation)) {
                n++;
            }
        }
        return n;
    }

    private static boolean hasDeclaredMethod(Class<?> c, String name, Class<?>... paramTypes) {
        try {
            c.getDeclaredMethod(name, paramTypes);
            return true;
        } catch (NoSuchMethodException e) {
            return false;
        }
    }

    public static void main(String[] args) throws Exception {
        testZeroCallerMethodsRemoved();
        testClientEndpointsNotReadded();
        testLegacyEntryDeprecated();
        testFreezeMarkers();
        testFallbackObservability();
        testFreezeTripwires();
        testCliKept();

        System.out.println();
        System.out.println(pass + " passed, " + fail + " failed");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /** R3-5：三个零调用者方法确实已删（反射），相邻方法未误删 */
    private static void testZeroCallerMethodsRemoved() {
        Class<?> c = DocSysClient.class;
        check("R3-5 DocSysClient.getManagerReposList() 已删除",
                !hasDeclaredMethod(c, "getManagerReposList"), "仍声明着");
        check("R3-5 DocSysClient.getSystemEmailConfig(String) 已删除",
                !hasDeclaredMethod(c, "getSystemEmailConfig", String.class), "仍声明着");
        check("R3-5 DocSysClient.getSessionCookie() 已删除",
                !hasDeclaredMethod(c, "getSessionCookie"), "仍声明着");

        check("相邻方法未被误删: getReposList()", hasDeclaredMethod(c, "getReposList"));
        check("相邻方法未被误删: getRepos(Integer)", hasDeclaredMethod(c, "getRepos", Integer.class));
        check("相邻方法未被误删: docSysInit(String)", hasDeclaredMethod(c, "docSysInit", String.class));
        check("相邻方法未被误删: setSessionCookie(String)", hasDeclaredMethod(c, "setSessionCookie", String.class));
        check("相邻方法未被误删: copy()", hasDeclaredMethod(c, "copy"));
        check("相邻方法未被误删: copyWithSession(String,String)",
                hasDeclaredMethod(c, "copyWithSession", String.class, String.class));
    }

    /** R3-5：被删方法对应的端点字符串不得再出现在 DocSysClient（防顺手加回） */
    private static void testClientEndpointsNotReadded() {
        String client = read(CLIENT);
        check("DocSysClient 源文件可读", client != null, CLIENT);
        if (client == null) {
            return;
        }
        check("DocSysClient 不再含 /Repos/getManagerReposList.do",
                count(client, "/Repos/getManagerReposList.do") == 0,
                "count=" + count(client, "/Repos/getManagerReposList.do"));
        check("DocSysClient 不再含 /Manage/getSystemEmailConfig.do",
                count(client, "/Manage/getSystemEmailConfig.do") == 0,
                "count=" + count(client, "/Manage/getSystemEmailConfig.do"));
    }

    /** R3-4：旧编排入口全部 @Deprecated */
    private static void testLegacyEntryDeprecated() {
        String ma = read(MA);
        String sa = read(SA);
        String lip = read(LIP);
        check("三个源文件可读", ma != null && sa != null && lip != null);
        if (ma == null || sa == null || lip == null) {
            return;
        }

        int annotated = countAnnotatedDecls(ma, "public AgentResponse process(String userQuery", "@Deprecated");
        check("MainAgent.process(...) 3 个重载全部 @Deprecated", annotated == 3, "annotated=" + annotated);
        check("SubAgent 类已 @Deprecated", annotatedBefore(sa, "public class SubAgent {", "@Deprecated"));
        check("LLMIntentParser 类已 @Deprecated",
                annotatedBefore(lip, "public class LLMIntentParser {", "@Deprecated"));
        check("SubAgent 旧编排内部方法仍标注 LEGACY-FALLBACK",
                count(sa, "LEGACY-FALLBACK") >= 1 && sa.contains("execute(SubTask"));
    }

    /** R3-4：封口注释（禁止新增能力）在三个文件里都在 */
    private static void testFreezeMarkers() {
        String ma = read(MA);
        String sa = read(SA);
        String lip = read(LIP);
        if (ma == null || sa == null || lip == null) {
            return;
        }
        check("MainAgent 含 LEGACY-FALLBACK 封口标记", ma.contains("LEGACY-FALLBACK"));
        check("SubAgent 含 LEGACY-FALLBACK 封口标记", sa.contains("LEGACY-FALLBACK"));
        check("LLMIntentParser 含 LEGACY-FALLBACK 封口标记", lip.contains("LEGACY-FALLBACK"));
        check("MainAgent 声明旧编排为冻结（禁止新增能力）", ma.contains("禁止在此新增能力"));
        check("SubAgent 声明禁止新增 taskType 分支", sa.contains("禁止新增 taskType 分支"));
        check("LLMIntentParser 声明禁止新增能力", lip.contains("禁止新增能力"));
        check("主路径在 MainAgent 类注释中被点明（ToolUseLoop）", ma.contains("主路径是 {@link ToolUseLoop}"));
    }

    /** R3-4：兜底触发可观测（统一标记日志） */
    private static void testFallbackObservability() throws Exception {
        Field f = MainAgent.class.getField("LEGACY_FALLBACK_TAG");
        Object v = f.get(null);
        check("MainAgent.LEGACY_FALLBACK_TAG 常量存在且值 = " + TAG, TAG.equals(v), "value=" + v);

        String ma = read(MA);
        String ac = read(AC);
        if (ma == null || ac == null) {
            check("MainAgent/AgentController 可读", false);
            return;
        }
        check("MainAgent 进入旧编排时打标记日志（legacy-orchestration-entered）",
                ma.contains("legacy-orchestration-entered"));
        check("reason 覆盖三种触发原因（失败于SSE/返回null/开关关闭）",
                ma.contains("tool-loop-failed-in-sse-path")
                        && ma.contains("tool-loop-returned-null")
                        && ma.contains("tool-loop-disabled"));
        check("标记日志走应用日志渠道 com.DocSystem.common.Log（不是 slf4j）",
                ma.contains("com.DocSystem.common.Log.warn(LEGACY_FALLBACK_TAG"));
        int acTag = count(ac, "MainAgent.logLegacyFallback(");
        check("AgentController SSE 两处回退站点统一打标记", acTag == 2, "count=" + acTag);
        check("AgentController 标记站点事件名齐全（null / 异常）",
                ac.contains("sse-tool-loop-returned-null") && ac.contains("sse-tool-loop-failed"));
        check("AgentController runCommand 标注 LEGACY-FALLBACK 入口", ac.contains("LEGACY-FALLBACK"));
        check("AgentController /agent/execute 端点仍在（旧入口未误删）",
                ac.contains("@PostMapping(\"/execute\")"));
    }

    /** R3-4：冻结基线（数量涨了 = 有人在往旧编排里加能力，需先经裁定） */
    private static void testFreezeTripwires() {
        String sa = read(SA);
        String ma = read(MA);
        if (sa == null || ma == null) {
            check("SubAgent/MainAgent 可读", false);
            return;
        }
        int handlers = count(sa, "private AgentResponse handle");
        check("冻结基线：SubAgent handle* 方法数 = 34", handlers == 34, "count=" + handlers);
        int branches = count(ma, "addSubTask(new SubTask(");
        check("冻结基线：MainAgent 旧编排分支数 = 53", branches == 53, "count=" + branches);
        check("SubAgent 分类注释不再列 help（R3-11 遗留文档修正）",
                sa.contains("7. SysOps    - config, system-config, banner")
                        && !sa.contains("7. SysOps    - help, config, banner"));
    }

    /** 方案 1 明确保留 CLI：文件与入口都在（本轮不动它），CLI 专属 client 方法随之保留 */
    private static void testCliKept() throws Exception {
        String cli = read(CLI);
        check("DocSysCLI 保留（方案 1 不动 CLI）", cli != null, CLI);
        Class<?> c = Class.forName("com.DocSystem.agent.cli.DocSysCLI");
        check("DocSysCLI 入口 main(String[]) 仍在", hasDeclaredMethod(c, "main", String[].class));
        if (cli == null) {
            return;
        }
        check("R3-5 只删零调用者：CLI 专属方法仍被 CLI 引用（getAiModelList/getDocSysConfig/lockDoc/searchDocs）",
                cli.contains("getAiModelList") && cli.contains("getDocSysConfig")
                        && cli.contains("lockDoc") && cli.contains("searchDocs"));
    }
}
