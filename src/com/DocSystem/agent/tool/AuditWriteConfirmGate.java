package com.DocSystem.agent.tool;

import com.DocSystem.agent.controller.AuditLogService;
import com.DocSystem.agent.entity.AuditLogEntity;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * 基于审计日志的写操作确认门（T4.1）。
 *
 * <p>流程（对齐 AgentController.stream() 的 SSE confirm 机制）：</p>
 * <pre>
 * 1. auditLogService.createPendingEntry(...) → confirmToken（PENDING 状态 + 审计落库）
 * 2. 日志打印 confirmToken（当前无 SSE 推送，token 从审计/日志获取；SSE 推送为后续增强）
 * 3. 轮询等待用户经 POST /agent/confirm 批准（approve/reject）
 * 4. 批准 → 返回 true 继续执行；拒绝 → 返回 false 中止
 * </pre>
 *
 * <p><b>2026-10-10 用户裁定 D5/D10</b>：等待默认**无限**、到点**不做任何批准/否决**
 * （只有"无确认通道"时才退回有限等待，因为那时没有可被代决定的用户）；
 * 另有**全局挂起上限**：超限时抛 {@link ConfirmGateBusyException} 让新的写操作明确失败，
 * 既不排队也不自动放行。</p>
 */
public class AuditWriteConfirmGate implements WriteConfirmGate {

    private static final Logger log = LoggerFactory.getLogger(AuditWriteConfirmGate.class);

    private final AuditLogService auditLogService;
    private final String userId;
    private final String sessionId;
    private final String clientIp;
    private final String traceId;
    private final long timeoutSeconds;

    /** 确认事件推送器（SSE；无推送通道时为 NOOP） */
    private volatile ConfirmEventSink confirmEventSink = ConfirmEventSink.NOOP;

    /**
     * 全局同时挂起的待确认数上限（D10「A+」的上限保护）。{@code <=0} → 不限制。
     * 由 {@code MainAgent} 用配置初始化；默认 8。
     */
    private static volatile int maxPendingConfirms = 8;

    /** 当前挂起数（诊断/日志用） */
    private static final java.util.concurrent.atomic.AtomicInteger PENDING_COUNT =
            new java.util.concurrent.atomic.AtomicInteger();

    /**
     * 无确认通道（{@code NOOP}，即没有任何界面能答复）时的兜底等待秒数：
     * 此时"无限等待"没有意义（永远没人答），故退回有限等待，到点按**未批准**收场
     * ——现行行为不变，也不违反"不代用户决定"（因为没有用户可代）。
     */
    static final long NOOP_FALLBACK_TIMEOUT_SECONDS = 120;

    /** 设置全局挂起上限（{@code <=0} → 不限制） */
    public static void setMaxPendingConfirms(int max) {
        maxPendingConfirms = max;
    }

    /** 当前挂起数（护栏/诊断用） */
    public static int pendingConfirms() {
        return PENDING_COUNT.get();
    }

    /**
     * 尝试占用一个"挂起位"（供其它确认流程复用同一全局上限，如操作级确认）。
     *
     * @return true = 已占用（调用方**必须**在 finally 里 {@link #releasePendingSlot()}）
     */
    public static boolean tryAcquirePendingSlot() {
        if (maxPendingConfirms > 0 && PENDING_COUNT.get() >= maxPendingConfirms) {
            return false;
        }
        PENDING_COUNT.incrementAndGet();
        return true;
    }

    /** 释放"挂起位" */
    public static void releasePendingSlot() {
        PENDING_COUNT.decrementAndGet();
    }

    public AuditWriteConfirmGate(AuditLogService auditLogService, String userId, String sessionId,
                                 String clientIp, String traceId, long timeoutSeconds) {
        this.auditLogService = auditLogService;
        this.userId = userId;
        this.sessionId = sessionId;
        this.clientIp = clientIp;
        this.traceId = traceId;
        this.timeoutSeconds = timeoutSeconds;
    }

    /** 设置确认事件推送器（SSE 推送 confirmToken 给前端） */
    public void setConfirmEventSink(ConfirmEventSink sink) {
        this.confirmEventSink = sink != null ? sink : ConfirmEventSink.NOOP;
    }

    @Override
    public boolean confirm(String toolName, JSONObject args) throws Exception {
        if (auditLogService == null) {
            log.warn("AuditLogService unavailable — auto-approving write tool '{}'", toolName);
            return true;
        }

        // D10「上限保护」：挂起数已达上限 → **拒绝开始新的等待**（不排队、不自动放行）
        if (!tryAcquirePendingSlot()) {
            log.error("Too many pending write confirmations ({}/{}) — refusing to wait for '{}'",
                    PENDING_COUNT.get(), maxPendingConfirms, toolName);
            throw new ConfirmGateBusyException(
                    "当前已有 " + PENDING_COUNT.get() + " 个写操作在等待你的确认（上限 "
                    + maxPendingConfirms + " 个）。请先在会话里批准或拒绝这些待确认操作，"
                    + "再继续执行新的写操作。");
        }
        try {
            return waitForUserDecision(toolName, args);
        } finally {
            releasePendingSlot();
        }
    }

    private boolean waitForUserDecision(String toolName, JSONObject args) throws Exception {
        // 1. 创建 PENDING 审计 + confirmToken
        Map<String, String> params = new HashMap<>();
        if (args != null) {
            for (Map.Entry<String, Object> e : args.entrySet()) {
                params.put(e.getKey(), String.valueOf(e.getValue()));
            }
        }
        String confirmToken = auditLogService.createPendingEntry(
                userId != null ? userId : "anonymous", sessionId, toolName, params, clientIp, traceId, true);
        if (confirmToken == null) {
            // 只有审计存储不可用才会走到这里。此时**绝不能静默放行写操作**（R3-2：原实现把
            // “名字不在写操作名单里”也当成这条分支 → write_file/write_note 等不弹确认框就直接执行）。
            // 宁可不执行，也不静默改数据。
            log.error("Cannot obtain confirm token for write tool '{}' — refusing to execute", toolName);
            return false;
        }

        // 2. 推送确认事件到前端（SSE）；无通道时记录日志
        //    R3-9：原来只给“[工具名]，是否继续？”——用户看不到到底要动哪个对象（删哪个文件/分享哪个文件），
        //    只能盲批。这里把参数整理成一句人话摘要附在文案里（弹窗的 .confirm-msg 是 pre-wrap，能显示换行）。
        String summary = summarizeArgs(args);
        String message = "此操作将执行写操作 [" + toolName + "]，是否继续？";
        if (!summary.isEmpty()) {
            message = message + "\n参数：" + summary;
        }
        try {
            confirmEventSink.onConfirmRequired(toolName, confirmToken, message, args);
        } catch (Exception e) {
            log.warn("Confirm event push failed for '{}' (token still in log): {}", toolName, e.getMessage());
        }
        log.warn("Write operation '{}' requires confirmation. params=[{}] confirmToken={} — approve via POST /agent/confirm "
                + "{\"confirmToken\":\"...\",\"action\":\"approve\"} within {}s",
                toolName, summary, confirmToken, timeoutSeconds);

        // 3. 轮询等待批准
        return waitForApproval(confirmToken, timeoutSeconds);
    }

    /** 确认文案里单个参数值最多展示的字符数（超过则只给长度） */
    static final int ARG_VALUE_MAX = 60;

    /** 确认文案里参数摘要的总预算 */
    static final int ARG_SUMMARY_MAX = 400;

    /** 需要脱敏的参数键（只显示 ***） */
    private static final java.util.Set<String> SECRET_KEYS = new java.util.HashSet<>(java.util.Arrays.asList(
            "pwd", "password", "passwd", "sharepwd", "token", "apikey", "api_key", "secret",
            "authorization", "cookie", "jsessionid"));

    /**
     * 把工具参数整理成“给人看”的摘要（R3-9）。
     *
     * <p>规则：
     * <ul>
     *   <li>敏感键（pwd/sharePwd/token/apiKey…）→ 只显示 <code>***</code>；</li>
     *   <li>空值跳过；长值（> {@link #ARG_VALUE_MAX}）**只给长度** <code>&lt;1234 字符&gt;</code>——
     *       写文件/写备注的正文、run_skill 的 params 都不应该堵满弹窗；</li>
     *   <li>整体不超过 {@link #ARG_SUMMARY_MAX}（超了加省略号）。</li>
     * </ul>
     * 例：`vid=5；path=66666/；name=a.txt；content=<15 字符>`
     */
    static String summarizeArgs(JSONObject args) {
        if (args == null || args.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> e : args.entrySet()) {
            String key = e.getKey();
            Object raw = e.getValue();
            if (raw == null || String.valueOf(raw).isEmpty()) {
                continue;
            }
            String value;
            if (SECRET_KEYS.contains(key.toLowerCase())) {
                value = "***";
            } else {
                String s = String.valueOf(raw).replace("\n", " ").replace("\r", " ").trim();
                value = s.length() > ARG_VALUE_MAX ? "<" + s.length() + " 字符>" : s;
            }
            if (sb.length() > 0) {
                sb.append("；");
            }
            sb.append(key).append('=').append(value);
            if (sb.length() > ARG_SUMMARY_MAX) {
                return sb.substring(0, ARG_SUMMARY_MAX) + "…";
            }
        }
        return sb.toString();
    }

    /**
     * 轮询等待用户答复（2026-10-10 裁定 D5/D10 后重写）。
     *
     * <p>核心变化：**到点不做任何批准、也不做任何否决**。
     * <ul>
     *   <li><b>有确认通道</b>（SSE，即有界面能答复）且 {@code timeoutSeconds <= 0}（默认）→ **无限等待**；
     *       若配置了正数，到点只 WARN 一次并**继续等待**（用户可能很久才回答，甚至故意不答）。</li>
     *   <li><b>无确认通道</b>（{@code NOOP}，没人能答复）→ 退回
     *       {@link #NOOP_FALLBACK_TIMEOUT_SECONDS} 有限等待，到点按**未批准**收场（与改造前一致，
     *       且此时不存在"被代决定"的用户）。</li>
     * </ul>
     * 其它收场口：用户点「拒绝」（`POST /agent/confirm`）、审计条目被清理（视为拒绝）。</p>
     */
    private boolean waitForApproval(String confirmToken, long timeoutSeconds) {
        boolean hasChannel = confirmEventSink != null && confirmEventSink != ConfirmEventSink.NOOP;
        long effectiveTimeout = timeoutSeconds;
        if (!hasChannel && effectiveTimeout <= 0) {
            effectiveTimeout = NOOP_FALLBACK_TIMEOUT_SECONDS;
            log.warn("No confirm channel for {} — using {}s fallback wait instead of unlimited",
                    confirmToken, effectiveTimeout);
        }
        boolean unlimited = effectiveTimeout <= 0;
        long deadline = unlimited ? Long.MAX_VALUE : System.currentTimeMillis() + effectiveTimeout * 1000L;
        boolean deadlineWarned = false;
        int pollIntervalMs = 500;
        while (true) {
            try {
                String status = auditLogService.getStatusByConfirmToken(confirmToken);
                if (status == null) {
                    // 条目不存在（已清理/过期）→ 视为拒绝
                    return false;
                }
                if (!"PENDING".equals(status)) {
                    // 已离开 PENDING → 由终态决定：APPROVED=true，其余(REJECTED/TIMEOUT)=false
                    boolean approved = "APPROVED".equals(status);
                    log.info("Write operation {} (status={}): {}", approved ? "approved" : "rejected",
                            status, confirmToken);
                    return approved;
                }
                if (!unlimited && System.currentTimeMillis() >= deadline) {
                    if (!hasChannel) {
                        log.warn("Write operation confirmation TIMEOUT (no confirm channel): {}", confirmToken);
                        return false;
                    }
                    if (!deadlineWarned) {
                        log.warn("Write operation confirmation still PENDING after {}s ({}); keep waiting — "
                                + "never auto approve/reject (D5)", effectiveTimeout, confirmToken);
                        deadlineWarned = true;
                    }
                    unlimited = true;   // 有界面：到点后不再设限，继续等用户答复
                }
                Thread.sleep(pollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
    }
}
