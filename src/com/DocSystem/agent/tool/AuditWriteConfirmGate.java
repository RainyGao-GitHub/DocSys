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
 * 4. 批准 → 返回 true 继续执行；拒绝/超时 → 返回 false 中止
 * </pre>
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
            confirmEventSink.onConfirmRequired(toolName, confirmToken, message);
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

    private boolean waitForApproval(String confirmToken, long timeoutSeconds) {        long deadline = System.currentTimeMillis() + timeoutSeconds * 1000L;
        int pollIntervalMs = 500;
        while (System.currentTimeMillis() < deadline) {
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
                Thread.sleep(pollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        log.warn("Write operation confirmation TIMEOUT: {}", confirmToken);
        return false;
    }
}
