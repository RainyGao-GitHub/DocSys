package com.DocSystem.agent.tool;

import com.DocSystem.common.ErrorCode;

import java.io.File;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

/**
 * 护栏：权限/登录类失败必须带错误码（R1-1 / R1-1b）。
 *
 * <p><b>为什么用"源码 lint"而不是逐个接口打请求</b>：这些点是纯机械的失败出口，
 * 逐个接口构造"无权限"场景成本极高（要有非管理员账号、要造仓库/文档权限），
 * 而真正会退化的地方是"新写代码时又只写文案"。所以这里直接在源码上钉住规则：
 * <ul>
 *   <li>{@code rt.setError("您…")} → 必须走 {@code setPermissionError(rt, "您…")}（= NO_PERMISSION）；</li>
 *   <li>{@code rt.setError("用户未登录…")} → 必须带 {@code ErrorCode.NOT_LOGIN}；</li>
 *   <li>{@code rt.setError("仓库 … 不存在！")} → 必须带 {@code ErrorCode.REPOS_NOT_FOUND}；</li>
 *   <li>{@code rt.setError("非法访问")} → 前一行必须是 {@code setErrorCodeIfAbsent(ErrorCode.NO_PERMISSION)}。</li>
 * </ul>
 *
 * <p>读的是仓库里的源文件（测试的工作目录 = 工程根），所以它是"防退化"的静态检查，
 * 与 {@link TestReturnAjaxErrorCode}（运行时序列化）互补。
 */
public class TestPermissionErrorCoding {

    private static final String[] SOURCES = {
            "src/com/DocSystem/controller/ReposController.java",
            "src/com/DocSystem/controller/DocController.java",
            "src/com/DocSystem/controller/BaseController.java",
            "src/com/DocSystem/websocket/BussinessController.java",
    };

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

    public static void main(String[] args) throws Exception {
        for (String src : SOURCES) {
            File f = new File(src);
            if (!f.exists()) {
                check("源文件存在: " + src, false, "未找到（工作目录必须是工程根）");
                continue;
            }
            List<String> lines = Files.readAllLines(f.toPath(), Charset.forName("UTF-8"));

            List<String> noPerm = new ArrayList<String>();
            List<String> notLogin = new ArrayList<String>();
            List<String> reposNotFound = new ArrayList<String>();
            List<String> bareIllegal = new ArrayList<String>();
            List<String> notFoundLog = new ArrayList<String>();

            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                String t = line.trim();
                if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) {
                    continue; // 注释里的示例代码不算
                }
                // R1-1c：“对象不存在”类出口（docSysErrorLog）必须带码
                if (t.contains("docSysErrorLog(") && t.contains("不存在") && !t.contains("ErrorCode.")) {
                    notFoundLog.add((i + 1) + ": " + t);
                }
                boolean isSetError = t.contains("rt.setError(");
                if (!isSetError) {
                    continue;
                }
                if (t.contains(", ErrorCode.") || t.contains("setPermissionError")) {
                    continue; // 已打码
                }

                if (t.matches(".*rt\\.setError\\(\"您.*")) {
                    noPerm.add((i + 1) + ": " + t);
                } else if (t.contains("rt.setError(\"用户未登录")) {
                    notLogin.add((i + 1) + ": " + t);
                } else if (t.contains("rt.setError(\"仓库 \" + reposId")) {
                    reposNotFound.add((i + 1) + ": " + t);
                } else if (t.matches(".*rt\\.setError\\(\"非法访问\"\\);.*")) {
                    String prev = i > 0 ? lines.get(i - 1).trim() : "";
                    if (!prev.contains("setErrorCodeIfAbsent(ErrorCode.NO_PERMISSION)")) {
                        bareIllegal.add((i + 1) + ": " + t);
                    }
                }
            }

            check(src + " 权限点全部走 setPermissionError", noPerm.isEmpty(), String.join(" | ", noPerm));
            check(src + " 未登录点全部带 NOT_LOGIN", notLogin.isEmpty(), String.join(" | ", notLogin));
            check(src + " 仓库不存在点全部带 REPOS_NOT_FOUND", reposNotFound.isEmpty(),
                    String.join(" | ", reposNotFound));
            check(src + " 非法访问点均先置 NO_PERMISSION", bareIllegal.isEmpty(),
                    String.join(" | ", bareIllegal));
            check(src + " 不存在类出口（docSysErrorLog）全部带码", notFoundLog.isEmpty(),
                    String.join(" | ", notFoundLog));
        }

        testSetPermissionErrorHelperIsCoded();
        testTaskNotFoundGuidance();

        System.out.println("======== TestPermissionErrorCoding: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /**
     * {@code BaseFunction.setPermissionError} 必须是「文案保留 + 置 NO_PERMISSION」。
     *
     * <p>不在这里 new 出 BaseFunction 子类做运行时断言：裸 JVM 下
     * {@code com.DocSystem.common.Log} 写日志文件会失败并在 catch 里递归（StackOverflow），
     * 这是本仓已记录的坑；运行时断言由 {@link TestReturnAjaxErrorCode} 负责。
     */
    private static void testSetPermissionErrorHelperIsCoded() throws Exception {
        File f = new File("src/com/DocSystem/common/BaseFunction.java");
        if (!f.exists()) {
            check("BaseFunction 源文件存在", false, "未找到");
            return;
        }
        List<String> lines = Files.readAllLines(f.toPath(), Charset.forName("UTF-8"));
        int start = -1;
        for (int i = 0; i < lines.size(); i++) {
            if (lines.get(i).contains("setPermissionError(ReturnAjax rt, String msg)")) {
                start = i;
                break;
            }
        }
        check("BaseFunction 有 setPermissionError helper", start >= 0, null);
        if (start < 0) {
            return;
        }
        boolean coded = false;
        for (int i = start; i < Math.min(lines.size(), start + 8); i++) {
            if (lines.get(i).contains("rt.setError(msg, ErrorCode.NO_PERMISSION)")) {
                coded = true;
                break;
            }
        }
        check("setPermissionError 内部置 NO_PERMISSION", coded,
                lines.subList(start, Math.min(lines.size(), start + 8)).toString());
    }

    private static void testTaskNotFoundGuidance() {
        check("TASK_NOT_FOUND 有处置提示",
                DocSysToolFactory.guidanceFor(ErrorCode.TASK_NOT_FOUND).length() > 0);
        check("TASK_NOT_FOUND 提示不要沿用旧 taskId",
                DocSysToolFactory.guidanceFor(ErrorCode.TASK_NOT_FOUND).contains("taskId"));
    }
}
