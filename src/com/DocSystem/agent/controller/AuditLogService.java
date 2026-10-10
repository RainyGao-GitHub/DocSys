package com.DocSystem.agent.controller;

import com.DocSystem.agent.entity.AuditLogEntity;
import com.DocSystem.agent.entity.AuditLogEntity.OperationStatus;
import com.DocSystem.agent.repository.AuditLogRepository;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Audit log service for operation tracking.
 * UX-02: Per D-14 — only write operations are audited (read operations excluded).
 * UX-02: Per D-15 — PII fully sanitized: userId/operation type retained,
 *     sensitive fields (passwords, tokens, file contents) are hashed or replaced with [REDACTED].
 *
 * Write operation skill IDs (per D-12):
 *   delete_repos, delete_doc, backup_repos, add_repos, create_repos,
 *   upload_doc, rename_doc, move_doc, copy_doc, restore_repos, wipe_repos
 *
 * Sensitive field names to redact (per D-15):
 *   password, token, apiKey, secret, authorization, cookie, jsessionid,
 *   content, fileContent, fileData, body, credential
 */
@Service
public class AuditLogService
        implements org.springframework.context.ApplicationListener<org.springframework.context.event.ContextRefreshedEvent> {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    /** Write operation skill IDs that require auditing (per D-12, D-14) */
    private static final Set<String> WRITE_OPERATIONS = new HashSet<>(Arrays.asList(
        "delete_repos", "delete_doc", "backup_repos", "add_repos", "create_repos",
        "upload_doc", "rename_doc", "move_doc", "copy_doc",
        "restore_repos", "wipe_repos", "add_doc", "upload_file",
        // R3-2 体检补全（2026-09-20）：原先只列了早期 skill 时代的名字，
        // write_file/write_note/create_folder/create_doc_share/update_repos/run_skill 都不在名单里，
        // 而下边的子串启发式也盖不住它们 → 这些工具在页面上不弹确认框、也不写审计
        // （实测：一句“新建文件+写备注”全程没有任何确认弹窗）。
        "write_file", "write_note", "create_folder", "create_doc_share",
        "update_repos", "delete_doc_share", "run_skill",
        // P2（2026-09-23）：write_office 不在下面的 create_/add_ 子串启发式里（"write_"前缀不匹配）
        // → 不显式登记就会“不弹确认、不写审计”
        "write_office",
        // P2 阶段二（2026-09-23）：改已有 Office 文件，同样必须显式登记
        "edit_office"
    ));

    /** Field names that contain sensitive data — redact these (per D-15) */
    private static final Set<String> SENSITIVE_FIELDS = new HashSet<>(Arrays.asList(
        "password", "token", "apiKey", "api_key", "secret", "authorization",
        "cookie", "jsessionid", "sessionCookie", "content", "fileContent",
        "fileData", "file_data", "body", "credential", "privateKey",
        "accessToken", "refreshToken"
    ));

    @Autowired
    private AuditLogRepository auditLogRepository;

    /** 启动清理的宽限期（秒）：只作废早于「启动时间 − 该值」的行，避免误伤刚创建的行 */
    private static final long ABANDON_GRACE_SECONDS = 60;

    /** 同一 JVM 只扫一次（root 与 mvc 两个上下文都会发 ContextRefreshedEvent） */
    private static final java.util.concurrent.atomic.AtomicBoolean STALE_SWEPT =
            new java.util.concurrent.atomic.AtomicBoolean(false);

    /** 启动时是否作废"重启前遗留的待确认"（集群环境下可关掉，见 mapper 注释） */
    @Value("${agent.tool-loop.sweep-stale-confirms-on-start:true}")
    private boolean sweepStaleConfirmsOnStart = true;

    /**
     * 启动清理入口：**根上下文 refresh 完成之后**才跑（不用 `@PostConstruct`——那时上下文还在
     * 装配、启动早期的日志也不可靠）。{@link #STALE_SWEPT} 保证整个 JVM 只跑一次。
     */
    @Override
    public void onApplicationEvent(org.springframework.context.event.ContextRefreshedEvent event) {
        abandonStalePendingOnStartup();
    }

    /**
     * 把重启前遗留的 {@code PENDING} 置为 {@code ABANDONED}。
     *
     * <p>为什么必须有：等待确认的状态活在**进程内存线程**里，重启后线程没了，但审计行还是
     * `PENDING` ⇒ D11 的恢复弹窗会把它重新弹出来、用户点"批准"只改了数据库，**操作却不会执行**
     * （静默失败）。作废后它不再是待确认：UI 不展示，批准也只得到"已失效"的明确提示。</p>
     *
     * <p>集群注意：审计表共享，节点重启会作废其他节点尚未答复的待确认（那些等待会按"未批准"
     * 收场、不执行，用户重做即可）；如不希望这样，把参数置 false。</p>
     */
    public void abandonStalePendingOnStartup() {
        if (!sweepStaleConfirmsOnStart) {
            log.info("Skip abandoning stale PENDING confirmations "
                    + "(agent.tool-loop.sweep-stale-confirms-on-start=false)");
            return;
        }
        if (!STALE_SWEPT.compareAndSet(false, true) || auditLogRepository == null) {
            return;
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            int n = auditLogRepository.markPendingAbandonedBefore(
                    now.minusSeconds(ABANDON_GRACE_SECONDS), now,
                    "服务重启导致本次确认失效（操作未执行）；请重新发起该操作");
            if (n > 0) {
                // 同时走 SLF4J（DocSys 日志文件/控制台）与项目日志（系统日志），便于运维排查
                log.info("Abandoned {} stale PENDING confirmation(s) on startup "
                        + "(PENDING->ABANDONED, none executed)", n);
                com.DocSystem.common.Log.info("[Permission][PENDING] 启动清理：作废 " + n
                        + " 条重启前遗留的待确认（PENDING→ABANDONED，操作未执行）");
            }
        } catch (Exception e) {
            log.warn("abandonStalePendingOnStartup failed: {}", e.getMessage());
        }
    }

    /**
     * Determine if a skill ID is a write operation that requires auditing.
     */
    public boolean isWriteOperation(String skillId) {
        if (skillId == null) return false;
        String lower = skillId.toLowerCase();
        return WRITE_OPERATIONS.contains(skillId) ||
               WRITE_OPERATIONS.contains(lower) ||
               skillId.contains("delete") ||
               skillId.contains("add_") ||
               skillId.contains("create_") ||
               skillId.contains("upload") ||
               skillId.contains("backup") ||
               skillId.contains("restore") ||
               skillId.contains("wipe") ||
               skillId.contains("rename") ||
               skillId.contains("move_") ||
               skillId.contains("copy_");
    }

    /**
     * Sanitize a parameters map for audit logging.
     * Per D-15: Sensitive fields are redacted or hashed.
     * Non-sensitive fields are preserved.
     */
    public String sanitizeParams(Map<String, String> params) {
        if (params == null || params.isEmpty()) return null;
        try {
            Map<String, Object> sanitized = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();

                if (isSensitiveField(key)) {
                    // Hash the value (preserves uniqueness for investigation without exposing data)
                    sanitized.put(key, hashValue(value));
                } else {
                    sanitized.put(key, value);
                }
            }
            return JSON.toJSONString(sanitized);
        } catch (Exception e) {
            log.warn("Failed to sanitize params: {}", e.getMessage());
            return "[UNPARSEABLE_PARAMS]";
        }
    }

    /**
     * Sanitize a JSON string for audit logging.
     */
    public String sanitizeJson(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            JSONObject obj = JSON.parseObject(json);
            return sanitizeJsonObject(obj).toJSONString();
        } catch (Exception e) {
            log.warn("Failed to sanitize JSON: {}", e.getMessage());
            return "[UNPARSEABLE_JSON]";
        }
    }

    private JSONObject sanitizeJsonObject(JSONObject obj) {
        JSONObject sanitized = new JSONObject();
        for (String key : obj.keySet()) {
            Object value = obj.get(key);
            if (isSensitiveField(key)) {
                if (value instanceof String) {
                    sanitized.put(key, hashValue((String) value));
                } else {
                    sanitized.put(key, "[REDACTED]");
                }
            } else if (value instanceof JSONObject) {
                sanitized.put(key, sanitizeJsonObject((JSONObject) value));
            } else if (value instanceof String) {
                String strVal = (String) value;
                if (strVal.length() > 200 || containsSensitivePattern(strVal)) {
                    sanitized.put(key, "[SENSITIVE_CONTENT]");
                } else {
                    sanitized.put(key, value);
                }
            } else {
                sanitized.put(key, value);
            }
        }
        return sanitized;
    }

    private boolean containsSensitivePattern(String value) {
        if (value == null) return false;
        String lower = value.toLowerCase();
        return lower.contains("password") ||
               lower.contains("token=") ||
               lower.contains("bearer ") ||
               lower.contains("base64");
    }

    /**
     * Hash a value using SHA-256.
     * Per D-15: Preserves uniqueness for investigation while hiding actual data.
     */
    private String hashValue(String value) {
        if (value == null) return "[NULL]";
        if (value.length() <= 8) return "[SHORT_VALUE_HASH:" + sha256(value) + "]";
        if (value.length() > 20) {
            return "[HASH:" + sha256(value) + "]";
        }
        return "[REDACTED]";
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            return "HASH_ERROR";
        }
    }

    private boolean isSensitiveField(String key) {
        if (key == null) return false;
        return SENSITIVE_FIELDS.contains(key.toLowerCase());
    }

    /**
     * Create a pending audit log entry for a write operation.
     * Returns the confirm token for the SSE confirm flow.
     */
    @Transactional
    public String createPendingEntry(String userId, String sessionId, String operation,
                                     Map<String, String> params, String clientIp, String traceId) {
        return createPendingEntry(userId, sessionId, operation, params, clientIp, traceId, false);
    }

    /**
     * 同上，但可选“由调用方声明这确实是写操作”（跳过名字启发式）。
     *
     * <p>R3-2：`ToolRegistry` 只会对 `needsConfirm=true` 的工具调确认门，
     * 所以门内再拿名字子串猜一次“是不是写操作”是多余且危险的：猜错就静默改数据。
     * 用 `force=true` 保证“只要工具声明了 needsConfirm，就一定弹确认 + 写审计”。
     */
    @Transactional
    public String createPendingEntry(String userId, String sessionId, String operation,
                                     Map<String, String> params, String clientIp, String traceId,
                                     boolean force) {
        if (!force && !isWriteOperation(operation)) {
            return null;  // Not a write operation, no audit needed (per D-14)
        }

        String confirmToken = UUID.randomUUID().toString();
        String sanitizedParams = sanitizeParams(params);

        AuditLogEntity entry = new AuditLogEntity()
                .withUserId(userId != null ? userId : "anonymous")
                .withSessionId(sessionId)
                .withOperation(operation)
                .withOperationParams(sanitizedParams)
                .withStatus(OperationStatus.PENDING)
                .withConfirmToken(confirmToken)
                .withClientIp(clientIp)
                .withTraceId(traceId);

        entry.setCreatedAt(LocalDateTime.now());
        auditLogRepository.insert(entry);
        // token 等于"一次批准权"→ 日志只留前 8 位（原来把完整 token 明文打进日志）
        log.info("Audit log created: operation={}, userId={}, confirmToken={}", operation, userId,
                com.DocSystem.agent.tool.AuditWriteConfirmGate.maskToken(confirmToken));
        return confirmToken;
    }

    /**
     * Approve a pending operation (user confirmed in frontend).
     */
    @Transactional
    public boolean approve(String confirmToken, String resultMessage) {
        AuditLogEntity entry = auditLogRepository.findByConfirmToken(confirmToken);
        if (entry == null || !"PENDING".equals(entry.getStatus().name())) {
            return false;
        }
        auditLogRepository.updateStatusByConfirmToken(
                confirmToken, "APPROVED",
                LocalDateTime.now(), resultMessage);
        return true;
    }

    /**
     * Reject a pending operation (user cancelled in frontend).
     */
    @Transactional
    public boolean reject(String confirmToken) {
        AuditLogEntity entry = auditLogRepository.findByConfirmToken(confirmToken);
        if (entry == null || !"PENDING".equals(entry.getStatus().name())) {
            return false;
        }
        auditLogRepository.updateStatusByConfirmToken(
                confirmToken, "REJECTED",
                LocalDateTime.now(), "User cancelled the operation");
        return true;
    }

    /**
     * Mark operation as completed.
     */
    @Transactional
    public void markCompleted(String confirmToken, String resultMessage) {
        auditLogRepository.updateStatusByConfirmToken(
                confirmToken, "COMPLETED",
                LocalDateTime.now(), resultMessage);
    }

    /**
     * Mark operation as failed.
     */
    @Transactional
    public void markFailed(String confirmToken, String errorMessage) {
        auditLogRepository.updateStatusByConfirmToken(
                confirmToken, "FAILED",
                LocalDateTime.now(), errorMessage);
    }

    /**
     * 直接记录一条终端审计（COMPLETED/FAILED，无 PENDING 确认流程）。
     * 供 ToolUseLoop 工具执行审计使用（T4.2）：写操作工具执行后立即落审计。
     *
     * @param success true=COMPLETED / false=FAILED
     */
    @Transactional
    public void record(String userId, String sessionId, String operation,
                       Map<String, String> params, String clientIp, String traceId,
                       boolean success, String resultMessage) {
        AuditLogEntity entry = new AuditLogEntity()
                .withUserId(userId != null ? userId : "anonymous")
                .withSessionId(sessionId)
                .withOperation(operation)
                .withOperationParams(sanitizeParams(params))
                .withStatus(success ? OperationStatus.COMPLETED : OperationStatus.FAILED)
                .withClientIp(clientIp)
                .withTraceId(traceId);
        entry.setCreatedAt(LocalDateTime.now());
        auditLogRepository.insert(entry);
        log.info("Audit recorded: operation={}, userId={}, success={}", operation, userId, success);
    }

    /**
     * Get pending audit log entry by confirm token.
     * Only returns entries that are still PENDING.
     */
    /**
     * D11：查询某会话下**仍在等待用户答复**（PENDING）的写操作，按创建时间升序。
     *
     * <p>用途：页面重载、断网重连后，前端用它把"还没答复的确认"重新弹出来
     * （否则用户回来时页面上什么都没有、Agent 却一直等着）。</p>
     *
     * @param limit 上限（{@code <=0} → 50）；查询异常一律返回空列表（不抛给调用方）
     */
    public List<AuditLogEntity> findPendingBySessionId(String sessionId, int limit) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        try {
            return auditLogRepository.findPendingBySessionId(sessionId.trim(), limit > 0 ? limit : 50);
        } catch (Exception e) {
            log.warn("findPendingBySessionId failed for session={}: {}", sessionId, e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    public AuditLogEntity getPendingEntry(String confirmToken) {
        AuditLogEntity entry = auditLogRepository.findByConfirmToken(confirmToken);
        if (entry != null && "PENDING".equals(entry.getStatus().name())) {
            return entry;
        }
        return null;
    }

    /**
     * 查询确认条目当前状态（供写操作确认门区分 approve/reject）。
     *
     * @return "PENDING"/"APPROVED"/"REJECTED"/"COMPLETED"/"FAILED"；条目不存在 → null
     */
    public String getStatusByConfirmToken(String confirmToken) {
        AuditLogEntity entry = auditLogRepository.findByConfirmToken(confirmToken);
        return entry != null && entry.getStatus() != null ? entry.getStatus().name() : null;
    }

    /**
     * Get audit logs for a user (for admin/audit UI).
     */
    public List<AuditLogEntity> getLogsByUser(String userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get audit logs for a session.
     */
    public List<AuditLogEntity> getLogsBySession(String sessionId) {
        return auditLogRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
    }
}
