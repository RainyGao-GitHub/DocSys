package com.DocSystem.agent.tool;

import com.DocSystem.common.ErrorCode;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import util.ReturnAjax;

/**
 * 护栏：错误码（R1-1）。
 *
 * <p>目标：失败原因可以用机器可判定的 {@code errorCode} 表达，而不是靠嗅探文案。
 * 本测试钉住：①{@code ReturnAjax} 能携带并序列化 errorCode；②成功响应不带码；
 * ③工具层的 {@code errorCodeOf}/{@code guidanceFor} 对已知码给得出处置提示。
 */
public class TestReturnAjaxErrorCode {

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

    public static void main(String[] args) {
        testPlainErrorKeepsCodeNull();
        testCodedErrorSerializes();
        testCodeNotOverwrittenByIfAbsent();
        testSuccessHasNoCode();
        testGuidance();
        testHintSurvivesTruncation();

        System.out.println("======== TestReturnAjaxErrorCode: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void testPlainErrorKeepsCodeNull() {
        ReturnAjax rt = new ReturnAjax();
        rt.setError("文件不存在！");
        check("fail 状态", "fail".equals(rt.getStatus()));
        check("文案保留", "文件不存在！".equals(rt.getMsgInfo()));
        check("未打码时 errorCode 为 null（保持既有行为）", rt.getErrorCode() == null);
    }

    private static void testCodedErrorSerializes() {
        ReturnAjax rt = new ReturnAjax();
        rt.setError("用户[Admin]正在移动文件[x],请稍后重试!", ErrorCode.DOC_LOCKED);
        check("错误码已设置", ErrorCode.DOC_LOCKED.equals(rt.getErrorCode()));

        // 序列化后字段名必须是 errorCode（工具层按此 key 读取）
        JSONObject json = JSON.parseObject(JSON.toJSONString(rt));
        check("JSON 含 errorCode 字段且值正确",
                ErrorCode.DOC_LOCKED.equals(json.getString("errorCode")));
        check("JSON 仍含原有 status/msgInfo",
                "fail".equals(json.getString("status")) && json.getString("msgInfo") != null);

        // 多次 setError 时，最后一次带码的生效
        rt.setError("补充信息");
        check("追加错误信息不改动错误码", ErrorCode.DOC_LOCKED.equals(rt.getErrorCode()));
    }

    private static void testCodeNotOverwrittenByIfAbsent() {
        ReturnAjax rt = new ReturnAjax();
        rt.setError("锁", ErrorCode.DOC_LOCKED);
        rt.setErrorCodeIfAbsent(ErrorCode.INTERNAL);
        check("setErrorCodeIfAbsent 不覆盖已设码", ErrorCode.DOC_LOCKED.equals(rt.getErrorCode()));

        ReturnAjax rt2 = new ReturnAjax();
        rt2.setErrorCodeIfAbsent(ErrorCode.NO_PERMISSION);
        check("setErrorCodeIfAbsent 在无码时生效", ErrorCode.NO_PERMISSION.equals(rt2.getErrorCode()));
    }

    private static void testSuccessHasNoCode() {
        ReturnAjax rt = new ReturnAjax();
        JSONObject json = JSON.parseObject(JSON.toJSONString(rt));
        check("成功响应不带 errorCode（工具层据此走正常路径）",
                DocSysToolFactory.errorCodeOf(json) == null);
    }

    private static void testGuidance() {
        for (String code : new String[]{ErrorCode.DOC_LOCKED, ErrorCode.NO_PERMISSION,
                ErrorCode.DOC_NOT_FOUND, ErrorCode.REPOS_NOT_FOUND, ErrorCode.INVALID_PARAM,
                ErrorCode.NOT_LOGIN, ErrorCode.SYSTEM_BUSY, ErrorCode.TASK_NOT_FOUND}) {
            check("已知码有处置提示: " + code,
                    DocSysToolFactory.guidanceFor(code) != null
                            && DocSysToolFactory.guidanceFor(code).length() > 0);
        }
        check("未知码无提示文案", DocSysToolFactory.guidanceFor("SOMETHING_ELSE").isEmpty());
    }

    /**
     * 错误码提示必须留在输出尾部——超长响应被截断时不能把提示一起截掉，
     * 否则模型只看到半截 JSON，又退化成"猜失败原因"。
     */
    private static void testHintSurvivesTruncation() {
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<String, Object>();
        resp.put("status", "fail");
        resp.put("msgInfo", "用户[Admin]正在移动文件[x],请稍后重试!");
        resp.put("errorCode", ErrorCode.DOC_LOCKED);
        StringBuilder big = new StringBuilder();
        for (int i = 0; i < 900; i++) { // 900*7=6300 字符，足以触发 4000 上限
            big.append("padding");
        }
        resp.put("data", big.toString()); // 故意把响应撑到远超 4000 字符

        String out = DocSysToolFactory.fmt(resp);
        check("超长响应仍带错误码提示", out.contains("[错误码: " + ErrorCode.DOC_LOCKED + "]"));
        check("超长响应仍带处置提示",
                out.contains(DocSysToolFactory.guidanceFor(ErrorCode.DOC_LOCKED)));
        check("超长响应仍被截断（防上下文膨胀）", out.contains("...(truncated)"));

        java.util.Map<String, Object> ok = new java.util.LinkedHashMap<String, Object>();
        ok.put("status", "ok");
        check("成功响应不追加提示", !DocSysToolFactory.fmt(ok).contains("[错误码:"));
    }
}
