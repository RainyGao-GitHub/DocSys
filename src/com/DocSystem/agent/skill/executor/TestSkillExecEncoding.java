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
        testSystemHelpWiring();
        testHelpContentFreshness();
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

    /** ③ system_help 必须由内置执行器接管，且不能再落到外部 CLI 执行器 */
    private static void testSystemHelpWiring() {
        DocSysSkillExecutor builtin;
        ExternalSkillExecutor external;
        try {
            builtin = new DocSysSkillExecutor();
            // 外部执行器有 5 参构造（skillsDirPath, timeout, llmService, parser, metadataService）；
            // 这里只验证 canHandle 的排除集，不跑 CLI，故依赖传 null/默认值即可。
            external = new ExternalSkillExecutor("WebRoot/WEB-INF/skills", 60, null, null, null);
        } catch (Throwable t) {
            check("能离线构造两个技能执行器（lint 前置）", false, String.valueOf(t));
            return;
        }
        check("内置执行器接管 system_help", builtin.canHandle("system_help"));
        check("外部 CLI 执行器不再接管 system_help（否则会去跑 docsys 命令）",
                !external.canHandle("system_help"));
        check("内置执行器仍接管 help（别名不丢）", builtin.canHandle("help"));

        SkillExecutionResult r = builtin.execute("system_help", new HashMap<String, String>(), null);
        check("system_help 执行成功（不再报 docsys 不是命令）", r.success(),
                r.success() ? "" : String.valueOf(r.error()));
        check("system_help 输出非空", r.success() && r.output() != null && r.output().length() > 200,
                r.success() ? String.valueOf(r.output().length()) : "-");
    }

    /** ④ help 正文必须与当前实现一致（不能是 docId 时代的过期 CLI 说明） */
    private static void testHelpContentFreshness() throws Exception {
        DocSysSkillExecutor builtin = new DocSysSkillExecutor();
        String out = builtin.execute("system_help", new HashMap<String, String>(), null).output();
        if (out == null) {
            check("help 输出可读", false);
            return;
        }
        String[] stale = {"CLI Commands", "delete-doc <vid> <docId>", "rename-doc <vid> <docId>",
                "get-doc <vid> <docId>", "download-doc", "ai-models", "chat-with-docs", "repos-info <vid>"};
        for (String s : stale) {
            check("help 不再出现过期 CLI 条目： " + s, !out.contains(s), out.substring(0, Math.min(200, out.length())));
        }
        String[] must = {"list_repos", "get_doc", "search_files", "grep_files", "write_file", "move_doc",
                "backup_repos", "path+name", "move_doc"};
        for (String s : must) {
            check("help 提到当前工具/约定： " + s, out.contains(s));
        }
        check("help 明确 docId 不要用于定位", out.contains("docId") && out.contains("不要用它定位"), out);
        check("help 说明写操作需要确认", out.contains("需要用户确认"), out);
        check("help 输出 < 4000 字符（进上下文不超预算）", out.length() < 4000, "len=" + out.length());
    }
}
