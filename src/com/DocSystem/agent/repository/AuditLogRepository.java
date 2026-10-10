package com.DocSystem.agent.repository;

import com.DocSystem.agent.entity.AuditLogEntity;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Audit log repository for operation tracking.
 * UX-02: Per D-14 — only write operations are audited.
 * MyBatis mapper interface.
 */
public interface AuditLogRepository {

    AuditLogEntity findByConfirmToken(@Param("confirmToken") String confirmToken);

    List<AuditLogEntity> findByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);

    List<AuditLogEntity> findBySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);

    /**
     * D11：某会话下**仍在等待用户答复**（status=PENDING）的写操作，按创建时间**升序**
     * （先问的先答），供前端在页面重载/断网重连后恢复确认弹窗。
     */
    List<AuditLogEntity> findPendingBySessionId(@Param("sessionId") String sessionId, @Param("limit") int limit);

    List<AuditLogEntity> findByUserId(@Param("userId") String userId, @Param("offset") int offset, @Param("limit") int limit);

    List<AuditLogEntity> findByOperation(@Param("operation") String operation, @Param("offset") int offset, @Param("limit") int limit);

    List<AuditLogEntity> findByStatus(@Param("status") String status);

    List<AuditLogEntity> findAll(@Param("offset") int offset, @Param("limit") int limit);

    int updateStatusByConfirmToken(
            @Param("confirmToken") String confirmToken,
            @Param("status") String status,
            @Param("completedAt") LocalDateTime completedAt,
            @Param("result") String result);

    int deleteOldLogs(@Param("cutoff") LocalDateTime cutoff);

    int insert(AuditLogEntity log);

    int deleteById(@Param("id") Long id);

    long count();
}