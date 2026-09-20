package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

/**
 * R3-2 批 2 护栏：7 个写工具的**回执契约**（紧凑 + 不复述正文 + 失败带码）+ 服务端 docType 修复的回归锁。
 *
 * <p>由来（2026-09-20 真机实测，仓库 5 走完整生命周期）：
 * <pre>
 * 工具             改造前         改造后
 * create_folder    560 字符       97
 * write_file       1091 字符      75     ← 且原文把写入的正文原样回显（data.content）
 * write_note       500 NPE        51     ← 服务端 docType 拆箱，对已有文档 100% 失败
 * rename_doc       444 字符       48
 * move_doc         417 字符       46
 * copy_doc         41 字符        63
 * delete_doc       454 字符       76
 * </pre>
 * 原文里全是模型用不到的内部字段：localRootPath/reposPath/localVRootPath/remotePath/offsetPath/
 * sortIndex/autoCharsetDetect/creatorName/latestEditorName/isBussiness/officeType/checkSum/
 * dataEx.actionList（整个内部动作列表）/debugLog（含远端推送日志）。
 */
public class TestWriteReceiptFormat {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testSuccessReceipt();
        testFailureReceipt();
        testNoContentEcho();
        testRealShapeFixture();
        testSourceLint();
        testServerDocTypeLint();
        System.out.println("\n======== TestWriteReceiptFormat: " + pass + " passed, " + fail + " failed ========");
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

    // ==================== 成功回执 ====================

    private static void testSuccessReceipt() {
        Map<String, Object> ok = ok();

        String folder = DocSysToolFactory.writeReceipt(ok, "创建目录",
                DocSysToolFactory.docTargetText(5, "", "_probe/") + "/");
        check("成功回执以 ✅ 开头且是人话", folder.startsWith("✅ 已创建目录："), folder);
        check("成功回执不复述 JSON（无 { / \"status\"）", !folder.contains("{") && !folder.contains("\"status\""),
                folder);
        check("成功回执含对象", folder.contains("_probe"), folder);

        String withExtra = DocSysToolFactory.writeReceipt(ok, "创建目录", "x/", "下一步：用 list_docs 看内容。");
        check("成功回执可带一行下一步", withExtra.contains("下一步"), withExtra);

        String file = DocSysToolFactory.writeReceipt(ok, "写入文件", "仓库 5 / a.txt（20B）", "回执不包含正文；要核对内容请用 get_doc 读回。");
        check("写入回执说明不含正文", file.contains("回执不包含正文"), file);

        // 各动词措辞统一（模型只看一种句式）
        for (String[] t : new String[][]{
                {"删除", "仓库 5 / 66666/b.txt"},
                {"重命名", "a.txt → b.txt（在 66666/ 下）"},
                {"移动", "66666/a.txt → 仓库根目录"},
                {"复制", "66666/a.txt → 仓库 5 / a.txt（原文件仍在原处）"}}) {
            String s = DocSysToolFactory.writeReceipt(ok(), t[0], t[1]);
            check("统一句式：" + t[0] + " 回执为「✅ 已" + t[0] + "：…」",
                    s.startsWith("✅ 已" + t[0] + "：") && s.contains(t[1]), s);
        }

        String note = DocSysToolFactory.writeReceipt(ok(), "更新备注", "仓库 5 / a.txt（备注 6 字符）");
        check("更新备注回执", note.startsWith("✅ 已更新备注：") && note.contains("备注 6 字符"), note);
    }

    // ==================== 失败回执 ====================

    private static void testFailureReceipt() {
        Map<String, Object> locked = failResp("DOC_LOCKED", "用户[Admin]正在新增文件[x/a.txt],请稍后重试!");
        locked.put("debugLog", "isDocForceLocked() [x/a.txt] 已被 [1 Admin] 强制锁定了 234 ms, lockInfo[Agent写入]"
                + "lockDoc() Doc [x/a.txt] was locked");
        locked.put("data", new HashMap<String, Object>() {{
            put("localRootPath", "D:/test/");
            put("reposPath", "C:/DocSysReposes/5/");
        }});

        String s = DocSysToolFactory.writeReceipt(locked, "写入文件", "x/a.txt");
        System.out.println("---- 失败回执 (len=" + s.length() + ") ----");
        System.out.println(s);
        check("失败回执保留错误码", s.contains("[错误码: DOC_LOCKED]"), s);
        check("失败回执给出处置提示", s.contains("稍后重试"), s);
        check("失败回执丢掉 debugLog", !s.contains("isDocForceLocked") && !s.contains("lockDoc()"), s);
        check("失败回执丢掉 data 里的内部字段", !s.contains("localRootPath") && !s.contains("reposPath"), s);
        check("失败回执可以说清原因", s.contains("请稍后重试"), s);
        check("失败回执 < 400 字符", s.length() < 400, "len=" + s.length());

        String noMsg = DocSysToolFactory.failReceipt(failResp("INTERNAL", ""));
        check("没有 msgInfo 时给兜底文案", noMsg.contains("操作失败"), noMsg);
        check("null 响应不炸", "(empty response)".equals(DocSysToolFactory.failReceipt(null)));

        String noCode = DocSysToolFactory.failReceipt(failResp(null, "参数错了"));
        check("无错误码时只给原因", noCode.contains("参数错了") && !noCode.contains("错误码"), noCode);
    }

    // ==================== 不复述正文 ====================

    private static void testNoContentEcho() {
        // 真实响应把写入内容放在 data.content（实测 write_file 会回显全文）
        StringBuilder big = new StringBuilder();
        for (int i = 0; i < 2000; i++) {
            big.append("这是被写入的正文第").append(i).append("行\n");
        }
        Map<String, Object> resp = ok();
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("content", big.toString());
        data.put("name", "big.txt");
        data.put("path", "66666/");
        data.put("size", big.length());
        resp.put("data", data);

        String s = DocSysToolFactory.writeReceipt(resp, "写入文件",
                "仓库 5 / 66666/big.txt（" + big.length() + " 字节）", "回执不包含正文；要核对内容请用 get_doc 读回。");
        System.out.println("---- 大文件写入回执 (len=" + s.length() + ") ----");
        System.out.println(s);
        check("大文件写入回执不含正文", !s.contains("这是被写入的正文"), "len=" + s.length());
        check("大文件写入回执 < 200 字符", s.length() < 200, "len=" + s.length());
        check("sizeOfData 能取到 size", big.length() == Integer.parseInt(
                String.valueOf(DocSysToolFactory.sizeOfData(resp, "size"))));
        check("sizeOfData 对缺失字段返回 null", DocSysToolFactory.sizeOfData(resp, "nope") == null);
    }

    // ==================== 真实形状 fixture ====================

    private static void testRealShapeFixture() {
        // 复刻实测 create_folder 响应（560 字符）：回执必须把这些内部字段全部丢掉
        Map<String, Object> resp = ok();
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("creator", 1);
        data.put("remotePath", "");
        data.put("level", 0);
        data.put("localRootPath", "D:/test/");
        data.put("autoCharsetDetect", true);
        data.put("docId", 104129650456L);
        data.put("creatorName", "Admin");
        data.put("reposPath", "C:/DocSysReposes/5/");
        data.put("latestEditorName", "Admin");
        data.put("localVRootPath", "C:/DocSysReposes/5/data/vdata/");
        data.put("isRealDoc", true);
        data.put("pid", 0);
        data.put("type", 2);
        data.put("vid", 5);
        data.put("path", "");
        data.put("size", 0);
        data.put("name", "_probeW_501402");
        data.put("officeType", 0);
        resp.put("data", data);
        resp.put("debugLog", "新增成功");
        resp.put("msgData", "isNewNode");

        String s = DocSysToolFactory.writeReceipt(resp, "创建目录", "仓库 5 / _probeW_501402/");
        String[] leaked = {"localRootPath", "reposPath", "localVRootPath", "creatorName", "latestEditorName",
                "remotePath", "autoCharsetDetect", "officeType", "debugLog", "msgData", "isRealDoc"};
        for (String key : leaked) {
            check("真实响应字段不外泄：" + key, !s.contains(key), s);
        }
        check("真实形状回执 < 150 字符", s.length() < 150, "len=" + s.length());

        // 不暴露 docId：R1-6 起模型不该用 docId 定位
        check("回执不输出 docId", !s.contains("104129650456") && !s.contains("docId"), s);
    }

    // ==================== 源码 lint ====================

    private static void testSourceLint() {
        String src = readSource("src/com/DocSystem/agent/tool/DocSysToolFactory.java");
        if (src == null) {
            check("能读到 DocSysToolFactory 源码（lint 前置）", false, "文件不存在？");
            return;
        }
        // 7 个写工具不得再对写响应裸 fmt
        String[] lints = {
            "fmt(callWithLockRetry(\"create_folder\"", "fmt(callWithLockRetry(\"write_file\"",
            "fmt(callWithLockRetry(\"write_note\"", "fmt(callWithLockRetry(\"delete_doc\"",
            "fmt(callWithLockRetry(\"rename_doc\"", "fmt(callWithLockRetry(\"move_doc\"",
            "fmt(callWithLockRetry(\"copy_doc\""
        };
        for (String lint : lints) {
            check("写工具不再裸 fmt： " + lint, !src.contains(lint));
        }
        check("写回执走统一入口 writeReceipt", src.contains("writeReceipt(resp,") && src.contains("writeReceipt(createdNote,"));
        check("失败回执走统一入口 failReceipt", src.contains("return ToolResult.ok(failReceipt(res))"));
    }

    /** 服务端 docType 拆箱修复的源码 lint（护栏跑在裸 JVM，不能真调 HTTP，只能扫源码） */
    private static void testServerDocTypeLint() {
        String src = readSource("src/com/DocSystem/controller/DocController.java");
        if (src == null) {
            check("能读到 DocController 源码（lint 前置）", false, "文件不存在？");
            return;
        }
        int i = src.indexOf("/updateDocContent.do");
        check("找得到 updateDocContent 方法", i > 0);
        if (i <= 0) {
            return;
        }
        String body = src.substring(i, Math.min(src.length(), i + 4000));
        check("updateDocContent 对 docType 做了 null 判断（否则备注路径 500 NPE）",
                body.contains("docType != null && docType == 1"), "未找到 null 判断");
    }

    private static String readSource(String relative) {
        File f = new File(relative);
        if (!f.exists()) {
            f = new File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (Exception e) {
            return null;
        }
        return sb.toString();
    }

    // ==================== fixtures ====================

    private static Map<String, Object> ok() {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "ok");
        m.put("startTime", 1789909447908L);
        return m;
    }

    private static Map<String, Object> failResp(String code, String msg) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", "fail");
        if (code != null) {
            m.put("errorCode", code);
        }
        m.put("msgInfo", msg);
        return m;
    }
}
