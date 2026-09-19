package com.DocSystem.agent.tool;

import java.util.HashMap;
import java.util.Map;

/**
 * 护栏：文档写操作的"FORCE 锁占用自动重试"。
 *
 * <p>背景：DocSys 的文档级写操作在后台异步动作（版本库提交/推送/索引）完成前会一直持有
 * FORCE 锁，窗口实测约 0.6~1.0 秒。智能体"先建目录、再立刻移入"的整理流程必然撞上该窗口，
 * 服务端提示"用户[xxx]正在新增文件[yyy],请稍后重试!"。工具层据此提示语判定为可重试，
 * 退避重试若干次。本测试用假响应验证：命中标记才重试、真实错误不重试、耗尽次数后原样返回。
 */
public class TestLockRetry {

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

    private static Map<String, Object> resp(String status, String msgInfo, String debugLog) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("status", status);
        m.put("msgInfo", msgInfo);
        m.put("debugLog", debugLog);
        return m;
    }

    /** 造一个"锁占用"响应（与线上 buildLockFailMsg 文案一致） */
    private static Map<String, Object> lockBusy(String docName) {
        return resp("fail",
                "用户[Admin]正在新增文件[" + docName + "],请稍后重试!",
                "isDocForceLocked() [" + docName + "] 已被 [1 Admin] 强制锁定了 233 ms, lockInfo[新增 [" + docName + "]]");
    }

    public static void main(String[] args) throws Exception {
        testMarker();
        testErrorCodeFirst();
        testRetryThenSuccess();
        testRealErrorNoRetry();
        testExhaustAttempts();

        System.out.println("======== TestLockRetry: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void testMarker() {
        check("锁占用响应被识别", DocSysToolFactory.isLockBusy(lockBusy("x")));
        check("仅 debugLog 含'强制锁定'也算", DocSysToolFactory.isLockBusy(
                resp("fail", "操作失败", "已被 [1 Admin] 强制锁定了 100 ms")));
        check("ok 响应不算", DocSysToolFactory.isLockBusy(resp("ok", "", "")) == false);
        check("权限错误不算", DocSysToolFactory.isLockBusy(resp("fail", "您没有该目录的权限", "")) == false);
        check("null 不算", DocSysToolFactory.isLockBusy(null) == false);
    }

    /** R1-1：有错误码时以码为准，不再嗅探文案 */
    private static void testErrorCodeFirst() {
        // 1) 带 DOC_LOCKED 码、但文案里没有任何可嗅探字样 → 仍应识别为锁占用
        Map<String, Object> coded = resp("fail", "操作被拒", "");
        coded.put("errorCode", "DOC_LOCKED");
        check("按 errorCode=DOC_LOCKED 识别（无文案线索）", DocSysToolFactory.isLockBusy(coded));

        // 2) 带其它码、但文案含"请稍后重试" → 不得误判为锁占用（reposCheck 的"系统维护中，请稍后重试！"）
        Map<String, Object> systemBusy = resp("fail", "系统维护中，请稍后重试！", "");
        systemBusy.put("errorCode", "SYSTEM_BUSY");
        check("SYSTEM_BUSY 不误判为锁占用", DocSysToolFactory.isLockBusy(systemBusy) == false);

        Map<String, Object> noPerm = resp("fail", "您没有该目录的新增权限，请联系管理员", "");
        noPerm.put("errorCode", "NO_PERMISSION");
        check("NO_PERMISSION 不误判为锁占用", DocSysToolFactory.isLockBusy(noPerm) == false);

        // 3) SYSTEM_BUSY 不应触发重试（只调用 1 次）
        final int[] calls = new int[1];
        Map<String, Object> r = null;
        try {
            r = DocSysToolFactory.callWithLockRetry("move_doc", new DocSysToolFactory.DocSysCall() {
                public Map<String, Object> call() {
                    calls[0]++;
                    Map<String, Object> m = resp("fail", "系统维护中，请稍后重试！", "");
                    m.put("errorCode", "SYSTEM_BUSY");
                    return m;
                }
            });
        } catch (Exception e) {
            check("SYSTEM_BUSY 调用不应抛异常", false);
        }
        check("SYSTEM_BUSY 不重试（仅 1 次调用）", calls[0] == 1 && "fail".equals(r.get("status")));
    }

    /** 前两次锁占用、第三次成功 → 总共调用 3 次并返回成功 */
    private static void testRetryThenSuccess() throws Exception {
        final int[] calls = new int[1];
        Map<String, Object> r = DocSysToolFactory.callWithLockRetry("move_doc", new DocSysToolFactory.DocSysCall() {
            public Map<String, Object> call() {
                calls[0]++;
                return calls[0] < 3 ? lockBusy("doc" + calls[0]) : resp("ok", "", "");
            }
        });
        check("重试后成功（调用 3 次）", "ok".equals(r.get("status")) && calls[0] == 3);
    }

    /** 真实错误（非锁）不重试 */
    private static void testRealErrorNoRetry() throws Exception {
        final int[] calls = new int[1];
        Map<String, Object> r = DocSysToolFactory.callWithLockRetry("delete_doc", new DocSysToolFactory.DocSysCall() {
            public Map<String, Object> call() {
                calls[0]++;
                return resp("fail", "文件不存在！", "");
            }
        });
        check("真实错误只调用 1 次", calls[0] == 1 && "fail".equals(r.get("status")));
    }

    /** 持续锁占用 → 重试到上限后原样返回最后一次响应 */
    private static void testExhaustAttempts() throws Exception {
        final int[] calls = new int[1];
        Map<String, Object> r = DocSysToolFactory.callWithLockRetry("copy_doc", new DocSysToolFactory.DocSysCall() {
            public Map<String, Object> call() {
                calls[0]++;
                return lockBusy("busy");
            }
        });
        check("耗尽重试次数后返回最后响应", calls[0] == 6 && "fail".equals(r.get("status")));
        check("返回值仍是锁占用提示", String.valueOf(r.get("msgInfo")).contains("请稍后重试"));
    }
}
