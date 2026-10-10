package com.DocSystem.agent.entity;

import java.time.LocalDateTime;

/**
 * Audit log entity for operation tracking.
 * UX-02: Per D-14 — only write operations are logged.
 * UX-02: Per D-15 — PII sanitized, sensitive fields hashed or redacted.
 * POJO for MyBatis mapping.
 */
public class AuditLogEntity {

    public enum OperationStatus {
        PENDING,
        APPROVED,
        REJECTED,
        COMPLETED,
        FAILED,
        /**
         * 已作废：等待确认时进程结束（重启/崩溃），**没有任何线程还在等它**。
         *
         * <p>由启动时的遗留清理写入（见 {@code AuditLogService.abandonStalePendingOnStartup}）：
         * 这些行不再是 PENDING ⇒ 不会出现在恢复弹窗里，也不会被误当成"还能批准"，
         * 从而避免"点了批准却什么都没发生"的静默失败。判定上等同**未批准**。</p>
         */
        ABANDONED
    }

    private Long id;
    private String userId;
    private String sessionId;
    private String operation;
    private String operationParams;
    private OperationStatus status = OperationStatus.PENDING;
    private String confirmToken;
    private String clientIp;
    private String traceId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String resultMessage;

    public AuditLogEntity() {}

    // Fluent setters (immutability per coding style)
    public AuditLogEntity withUserId(String v) { this.userId = v; return this; }
    public AuditLogEntity withSessionId(String v) { this.sessionId = v; return this; }
    public AuditLogEntity withOperation(String v) { this.operation = v; return this; }
    public AuditLogEntity withOperationParams(String v) { this.operationParams = v; return this; }
    public AuditLogEntity withStatus(OperationStatus v) { this.status = v; return this; }
    public AuditLogEntity withConfirmToken(String v) { this.confirmToken = v; return this; }
    public AuditLogEntity withClientIp(String v) { this.clientIp = v; return this; }
    public AuditLogEntity withTraceId(String v) { this.traceId = v; return this; }
    public AuditLogEntity withCompletedAt(LocalDateTime v) { this.completedAt = v; return this; }
    public AuditLogEntity withResultMessage(String v) { this.resultMessage = v; return this; }
    public AuditLogEntity withCreatedAt(LocalDateTime v) { this.createdAt = v; return this; }

    // Standard setters (for MyBatis mapping)
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setStatus(OperationStatus status) { this.status = status; }

    // Standard getters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public String getSessionId() { return sessionId; }
    public String getOperation() { return operation; }
    public String getOperationParams() { return operationParams; }
    public OperationStatus getStatus() { return status; }
    public String getConfirmToken() { return confirmToken; }
    public String getClientIp() { return clientIp; }
    public String getTraceId() { return traceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getResultMessage() { return resultMessage; }
}