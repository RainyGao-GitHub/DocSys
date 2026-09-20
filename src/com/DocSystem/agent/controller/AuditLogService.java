package com.DocSystem.agent.controller;

import com.DocSystem.agent.entity.AuditLogEntity;
import com.DocSystem.agent.entity.AuditLogEntity.OperationStatus;
import com.DocSystem.agent.repository.AuditLogRepository;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
public class AuditLogService {

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
        "update_repos", "delete_doc_share", "run_skill"
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
        log.info("Audit log created: operation={}, userId={}, confirmToken={}", operation, userId, confirmToken);
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
