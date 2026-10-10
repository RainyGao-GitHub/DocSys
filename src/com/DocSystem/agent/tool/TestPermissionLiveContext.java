package com.DocSystem.agent.tool;

import com.DocSystem.agent.permission.PermissionContext;
import com.DocSystem.agent.permission.PermissionMode;
import com.DocSystem.agent.permission.PermissionRule;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * P1（2026-10-10 裁定 **D1**）护栏：权限上下文**在同一请求内实时生效**。
 *
 * <p>背景：原实现把模式/规则做成"**每请求快照**"（`MainAgent` 构造一次
 * `PermissionContext` 注入 `ToolRegistry`，字段 `final`），于是"整理目录"这种
 * **一次请求内几十次写操作**的场景里，用户点了"记住授权/切到自动档"**当场无效**，
 * 只有下一次请求才生效 —— 这正是用户反馈的"没有机会去进行模式切换"的最深层原因。</p>
 *
 * <p>本护栏断言：装了"上下文供应器"后**每次工具调用都重新取**，
 * 而**没装供应器时行为与改造前完全一致**（快照），读取失败时**回落到更严**的保守上下文。</p>
 */
public class TestPermissionLiveContext {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testSupplierLiveSwitch();
        testSupplierLiveRuleAdded();
        testSnapshotWhenNoSupplier();
        testSupplierNullAndExceptionFailSafe();
        testBusyCapAndRegistryMapping();
        System.out.println("\n======== TestPermissionLiveContext: " + pass + " passed, " + fail + " failed ========");
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
            System.out.println("[FAIL] " + name + (detail != null ? ("  ← " + detail) : ""));
        }
    }

    /** 可变holder：模拟"运行中用户在弹窗里改了档/加了规则" */
    private static final class Holder {
        volatile PermissionContext ctx;
        Holder(PermissionContext c) { this.ctx = c; }
    }

    private static ToolRegistry newRegistry(List<String> gateCalls) {
        ToolRegistry reg = new ToolRegistry();
        reg.register(fakeWrite("write_file"));
        reg.register(fakeWrite("delete_doc"));
        reg.setConfirmGate((name, a) -> {
            gateCalls.add(name);
            return true;
        });
        return reg;
    }

    private static ToolDefinition fakeWrite(String name) {
        return ToolDefinition.builder(name, "fake " + name, a -> ToolResult.ok("ok"))
                .isWrite(true).needsConfirm(true).build();
    }

    private static JSONObject args() {
        return new JSONObject();
    }

    // ---------- ① 同一 registry 内切档：下一次调用立即生效 ----------

    private static void testSupplierLiveSwitch() {
        List<String> gateCalls = new ArrayList<String>();
        ToolRegistry reg = newRegistry(gateCalls);
        final Holder h = new Holder(new PermissionContext(PermissionMode.MANUAL, null));
        reg.setPermissionContextSupplier(() -> h.ctx);

        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("D1：标准档 + 供应器 → 仍弹确认", gateCalls.size() == 1, String.valueOf(gateCalls));

        // 用户点「切到自动模式并继续」→ 供应器下次读到 AUTO
        h.ctx = new PermissionContext(PermissionMode.AUTO, null);
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("D1：同一 registry 内切到自动档 → **下一次调用立即不弹**（无需新请求）",
                gateCalls.isEmpty(), String.valueOf(gateCalls));

        // 再切回标准档：同样立即生效
        h.ctx = new PermissionContext(PermissionMode.MANUAL, null);
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("D1：再切回标准档 → 下一次调用立即又弹", gateCalls.size() == 1, String.valueOf(gateCalls));
    }

    // ---------- ② 同一 registry 内"记住授权"立即生效（D2 标准档也生效） ----------

    private static void testSupplierLiveRuleAdded() {
        List<String> gateCalls = new ArrayList<String>();
        ToolRegistry reg = newRegistry(gateCalls);
        final Holder h = new Holder(new PermissionContext(PermissionMode.MANUAL, null));
        reg.setPermissionContextSupplier(() -> h.ctx);

        gateCalls.clear();
        reg.execute("delete_doc", args(), false);
        check("D2/D1：标准档 + 无规则 → delete_doc 弹", gateCalls.size() == 1, String.valueOf(gateCalls));

        // 用户在弹窗里点「批准并记住（该工具）」→ 规则写进会话，供应器下次读到
        List<PermissionRule> rules = new ArrayList<PermissionRule>();
        rules.add(new PermissionRule(PermissionRule.Kind.TOOL, "delete_doc", null, null));
        h.ctx = new PermissionContext(PermissionMode.MANUAL, rules);
        gateCalls.clear();
        reg.execute("delete_doc", args(), false);
        check("D2/D1：标准档 + 规则命中 → **下一次调用立即不弹**（当场脱身）",
                gateCalls.isEmpty(), String.valueOf(gateCalls));
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("D2/D1：规则只覆盖被授权的工具（write_file 仍弹）",
                gateCalls.size() == 1, String.valueOf(gateCalls));
    }

    // ---------- ③ 没装供应器 → 与改造前一致（快照） ----------

    private static void testSnapshotWhenNoSupplier() {
        List<String> gateCalls = new ArrayList<String>();
        ToolRegistry reg = newRegistry(gateCalls);

        reg.setPermissionContext(new PermissionContext(PermissionMode.AUTO, null));
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        reg.execute("delete_doc", args(), false);
        check("无供应器：走快照（自动档 → 常规不弹、硬清单弹）",
                gateCalls.size() == 1 && "delete_doc".equals(gateCalls.get(0)), String.valueOf(gateCalls));

        // 快照不变 ⇒ 即使"外部"改了东西也不影响（旧行为）
        gateCalls.clear();
        reg.execute("delete_doc", args(), false);
        check("无供应器：快照始终保持（旧行为不变）", gateCalls.size() == 1, String.valueOf(gateCalls));

        reg.setPermissionContext(null);
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("无策略（ctx=null）：行为同改造前，每次都弹",
                gateCalls.size() == 1, String.valueOf(gateCalls));
    }

    // ---------- ④ 供应器返回 null / 抛异常 → 保守回落（更严，不放行） ----------

    private static void testSupplierNullAndExceptionFailSafe() {
        List<String> gateCalls = new ArrayList<String>();
        ToolRegistry reg = newRegistry(gateCalls);
        reg.setPermissionContext(new PermissionContext(PermissionMode.ALLOW_ALL, null));   // 快照是"全部允许"

        // 供应器返回 null → 不得沿用"全部允许"快照，必须回落保守（标准档 + 无规则）
        reg.setPermissionContextSupplier(() -> null);
        gateCalls.clear();
        reg.execute("write_file", args(), false);
        check("供应器返回 null → 保守回落：仍弹（不沿用宽松快照）",
                gateCalls.size() == 1, String.valueOf(gateCalls));

        // 供应器抛异常 → 同上，且工具仍能执行（不因读策略失败而崩）
        reg.setPermissionContextSupplier(() -> {
            throw new IllegalStateException("db down");
        });
        gateCalls.clear();
        ToolResult r = reg.execute("write_file", args(), false);
        check("供应器抛异常 → 保守回落：仍弹 + 工具照常执行",
                gateCalls.size() == 1 && r.success, String.valueOf(gateCalls) + " success=" + r.success);
    }

    // ---------- ⑤ 全局挂起上限（D10）+ 注册表对"忙"的映射 ----------

    private static void testBusyCapAndRegistryMapping() {
        // 上限 API
        AuditWriteConfirmGate.setMaxPendingConfirms(1);
        boolean first = AuditWriteConfirmGate.tryAcquirePendingSlot();
        boolean second = AuditWriteConfirmGate.tryAcquirePendingSlot();
        check("D10：挂起上限生效（占 1 后不再放行）", first && !second);
        AuditWriteConfirmGate.releasePendingSlot();
        boolean third = AuditWriteConfirmGate.tryAcquirePendingSlot();
        check("D10：释放后可再占用", third);
        AuditWriteConfirmGate.releasePendingSlot();

        AuditWriteConfirmGate.setMaxPendingConfirms(0);
        boolean unlimitedOk = true;
        for (int i = 0; i < 20; i++) {
            unlimitedOk = unlimitedOk && AuditWriteConfirmGate.tryAcquirePendingSlot();
        }
        for (int i = 0; i < 20; i++) {
            AuditWriteConfirmGate.releasePendingSlot();
        }
        check("D10：上限 <=0 → 不限制", unlimitedOk);
        AuditWriteConfirmGate.setMaxPendingConfirms(8);

        // 注册表把"忙"原样回给调用方（提示先处理待确认，而不是静默失败/自动放行）
        List<String> gateCalls = new ArrayList<String>();
        ToolRegistry reg = newRegistry(gateCalls);
        reg.setPermissionContext(new PermissionContext(PermissionMode.MANUAL, null));
        reg.setConfirmGate((name, a) -> {
            throw new ConfirmGateBusyException("当前已有 8 个写操作在等待你的确认（上限 8 个）。");
        });
        ToolResult busy = reg.execute("write_file", args(), false);
        check("D10：确认门“忙” → 工具不执行并回传明确提示",
                !busy.success && busy.error != null && busy.error.contains("等待你的确认"),
                String.valueOf(busy.error));
    }
}
