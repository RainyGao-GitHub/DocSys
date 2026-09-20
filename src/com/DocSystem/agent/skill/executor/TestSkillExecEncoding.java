package com.DocSystem.agent.skill.executor;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;

/**
 * R3-2 批 2b 护栏：技能执行层的两个真机缺陷修复。
 *
 * <ol>
 *   <li><b>子进程输出乱码</b>：`cmd.exe` 输出是系统码页（中文 Windows = GBK/CP936），
 *       固定按 UTF-8 解码 → `'docsys' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���…`，
 *       模型拿到后无法诊断（不知道是"命令不存在"还是"脚本报错"）。</li>
 *   <li><b>`system_help` 是死技能</b>：既不在任何内置白名单，又被外部 CLI 执行器当成
 *       `docsys help` 去跑（dev 无 docsys 可执行文件）→ 必然失败；
 *       而且内置 `help` 的正文还是 docId 时代的过期 CLI 说明（`delete-doc <vid> <docId>`、
 *       `download-doc`、`ai-models` 等已下线命令）→ 会把模型带偏。</li>
 * </ol>
 */
public class TestSkillExecEncoding {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testDetectCharset();
        testReadProcessOutput();
        testHelpFamilyRemoved();
        testStaleArtifactsGone();
        System.out.println("\n======== TestSkillExecEncoding: " + pass + " passed, " + fail + " failed ========");
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

    /** ① 编码识别：UTF-8 严格可解就用 UTF-8，否则回退系统码页 */
    private static void testDetectCharset() throws Exception {
        String gbkMsg = "cmd.exe : 'docsys' 不是内部或外部命令，也不是可运行的程序或批处理文件。";
        byte[] gbkBytes = gbkMsg.getBytes("GBK");
        Charset gbkDetected = ExternalSkillExecutor.detectCharset(gbkBytes);

        // 前提：本机默认码页不是 UTF-8（中文 Windows=GBK）时才有回退意义；两种情况都要给出可读结果
        String decoded = new String(gbkBytes, gbkDetected);
        check("GBK 字节被回退到系统码页（=" + gbkDetected + "）",
                !StandardCharsets.UTF_8.equals(gbkDetected), "detected=" + gbkDetected);
        check("GBK 字节回退后中文可读（不再乱码）", decoded.contains("不是内部或外部命令"), decoded);
        check("GBK 字节若强行按 UTF-8 解会乱码（回归证明）",
                new String(gbkBytes, StandardCharsets.UTF_8).contains("�"), "");

        byte[] utf8Bytes = "第一行：UTF-8 中文内容\n".getBytes(StandardCharsets.UTF_8);
        check("合法 UTF-8 仍判为 UTF-8",
                StandardCharsets.UTF_8.equals(ExternalSkillExecutor.detectCharset(utf8Bytes)));

        byte[] ascii = "hello world\n".getBytes(StandardCharsets.US_ASCII);
        check("纯 ASCII 判为 UTF-8（两者等价）",
                StandardCharsets.UTF_8.equals(ExternalSkillExecutor.detectCharset(ascii)));

        check("空字节数组不炸", ExternalSkillExecutor.detectCharset(new byte[0]) != null);
    }

    /** ② readProcessOutput 走同一套判断 */
    private static void testReadProcessOutput() throws Exception {
        byte[] gbkBytes = "系统找不到指定的路径。".getBytes("GBK");
        String out = ExternalSkillExecutor.readProcessOutput(new java.io.ByteArrayInputStream(gbkBytes));
        check("readProcessOutput 对 GBK 输出给出可读文本", out.contains("系统找不到指定的路径"), out);

        byte[] utf8 = "Python 脚本输出 ✓".getBytes(StandardCharsets.UTF_8);
        check("readProcessOutput 对 UTF-8 输出原样保留", "Python 脚本输出 ✓".equals(
                ExternalSkillExecutor.readProcessOutput(new java.io.ByteArrayInputStream(utf8))));

        check("readProcessOutput 处理空流",
                "".equals(ExternalSkillExecutor.readProcessOutput(new java.io.ByteArrayInputStream(new byte[0]))));
    }

    /**
     * ③ R3-11（2026-09-20 用户裁定 A+C）：整族 help 技能已删除 —— help、system_help、
     * help-repos、help-docs、help-search 都不再由任何执行器接管，调用它们必须得到明确的“未知技能”。
     *
     * <p><b>为什么删</b>：system_help 返回的“工具速查 + 5 条约定”与工具 schema 重复（实测用途不大）；
     * 另三个 sibling 压根没注册（模型看不见，但猜 id 就能命中），内容还是 docId 时代的 CLI
     * （`create-repos`、`delete-doc <vid> <docId>`、`search <query> [vid]`）——
     * 工具名不存在、docId 定位已在 R1-6 下线。给过期内容比报“未知技能”危险得多。</p>
     */
    private static void testHelpFamilyRemoved() {
        DocSysSkillExecutor builtin;
        ExternalSkillExecutor external;
        try {
            builtin = new DocSysSkillExecutor();
            external = new ExternalSkillExecutor("WebRoot/WEB-INF/skills", 60, null, null, null);
        } catch (Throwable t) {
            check("能离线构造两个技能执行器（lint 前置）", false, String.valueOf(t));
            return;
        }
        String[] removed = {"help", "system_help", "help-repos", "help-docs", "help-search"};
        for (String id : removed) {
            check("内置执行器不再接管： " + id, !builtin.canHandle(id));
            SkillExecutionResult gone = builtin.execute(id, new HashMap<String, String>(), null);
            check("调用已删除的帮助技能 → 明确报未知技能（不是过期命令表）： " + id,
                    !gone.success() && String.valueOf(gone.error()).contains("Unknown skill"),
                    String.valueOf(gone.error()));
        }
        // 仍然保留的技能不受影响（banner / web 自动化）
        check("banner 仍由内置执行器接管", builtin.canHandle("banner"));
        check("web_search 仍由内置执行器接管", builtin.canHandle("web_search"));
        check("playwright 仍由内置执行器接管", builtin.canHandle("playwright"));
        // 保留项仍能正常执行（不做 HTTP，只看返回形状）
        SkillExecutionResult banner = builtin.execute("banner", new HashMap<String, String>(), null);
        check("banner 执行成功", banner.success(), banner.success() ? "" : String.valueOf(banner.error()));
        check("外部执行器仍在（组件没被误删）", external != null);
        // ⚠️ 不要在这里调 external.canHandle("help")：这些 id 已不在排除集里 → 会走到外部技能目录查找
        // → 触碰 BaseFunction.<clinit> → 裸 JVM 里 Log 写文件失败递归 StackOverflow（已踩）。
        // “外部执行器也不再接管它们”改用源码 lint 断言（见 testStaleArtifactsGone）。
    }

    /**
     * ⑤ R3-11 回归锁（源码 lint）：整族 help 技能实现与磁盘演示件都不得复活。
     *
     * <p>2026-09-20 实测的编造内容：`SKILL.md` 教模型跑 `docsys help`（dev 无此可执行文件）、
     * `scripts/run.bat` 指向 `http://localhost:8080/api/help` + 占位凭据、
     * `references/api.md` 写了不存在的 `GET /System/help.do`、`references/related-skills.md`
     * 指向并不存在的兄弟技能目录；`SubAgent` 里那份最陈旧（命令表 + 硬编码 login 示例 + docId 定位）。</p>
     */
    private static void testStaleArtifactsGone() throws Exception {
        String src = readSource("src/com/DocSystem/agent/skill/executor/DocSysSkillExecutor.java");
        if (src == null) {
            check("能读到 DocSysSkillExecutor 源码（lint 前置）", false);
            return;
        }
        // 断言用「方法定义形式」而不是裸名字：源码里的注释为记录历史会提到这些方法名，
        // 裸字符串会把注释也算命中（护栏自己踩过）。
        for (String gone : new String[]{"private SkillExecutionResult handleHelp", "handleHelpRepos",
                "handleHelpDocs", "handleHelpSearch"}) {
            check("DocSysSkillExecutor 不再包含帮助实现： " + gone,
                    !src.contains("private SkillExecutionResult " + gone));
        }
        for (String gone : new String[]{"\"help\"", "\"system_help\"", "\"help-repos\"", "\"help-docs\"", "\"help-search\""}) {
            check("DocSysSkillExecutor 白名单不再含： " + gone, !src.contains(gone));
        }

        String extSrc = readSource("src/com/DocSystem/agent/skill/executor/ExternalSkillExecutor.java");
        if (extSrc == null) {
            check("能读到 ExternalSkillExecutor 源码（lint 前置）", false);
        } else {
            for (String gone : new String[]{"\"help\"", "\"system_help\"", "\"help-repos\"", "\"help-docs\"", "\"help-search\""}) {
                check("ExternalSkillExecutor 排除集不再含： " + gone, !extSrc.contains(gone));
            }
        }

        String subSrc = readSource("src/com/DocSystem/agent/orchestrator/SubAgent.java");
        if (subSrc == null) {
            check("能读到 SubAgent 源码（lint 前置）", false);
        } else {
            for (String gone : new String[]{"private AgentResponse handleHelp", "private AgentResponse handleHelpRepos",
                    "private AgentResponse handleHelpDocs", "private AgentResponse handleHelpSearch"}) {
                check("SubAgent 不再包含帮助实现： " + gone, !subSrc.contains(gone));
            }
            check("SubAgent 命令表不再列 help-repos/help-docs/help-search",
                    !subSrc.contains("\"  help-repos") && !subSrc.contains("\"  help-docs")
                            && !subSrc.contains("\"  help-search"));
            check("SubAgent 的 help 示例（含占位凭据）已随命令表删除", !subSrc.contains("login admin admin2026"));
        }

        String smSrc = readSource("src/com/DocSystem/agent/skill/SkillManager.java");
        if (smSrc == null) {
            check("能读到 SkillManager 源码（lint 前置）", false);
        } else {
            check("SkillManager 不再注册 system_help（人类帮助列表不再有这条）",
                    !smSrc.contains("new Skill(\"system_help\""));
        }

        // 磁盘技能目录应已整体删除（源码树里）
        java.io.File dir = new java.io.File("WebRoot/WEB-INF/skills/system_help");
        if (!dir.exists()) {
            dir = new java.io.File("D:/Dev/DocSys/WebRoot/WEB-INF/skills/system_help");
        }
        check("技能目录 WebRoot/WEB-INF/skills/system_help 已删除", !dir.exists(), dir.getAbsolutePath());
    }

    private static String readSource(String relative) {
        java.io.File f = new java.io.File(relative);
        if (!f.exists()) {
            f = new java.io.File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        try (java.io.BufferedReader r = new java.io.BufferedReader(
                new java.io.InputStreamReader(new java.io.FileInputStream(f), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (Exception e) {
            return null;
        }
        return sb.toString();
    }
}
