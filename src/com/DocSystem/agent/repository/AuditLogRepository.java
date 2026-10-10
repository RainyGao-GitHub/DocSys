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

    /**
     * 把**启动前遗留**的 PENDING 行批量置为作废（{@code ABANDONED}）。
     *
     * <p>为什么需要：等待确认的状态在**进程内存线程**里，重启后线程消失但审计行仍是 PENDING
     * ⇒ 恢复弹窗会把它重新弹出来，用户点"批准"只改数据库、操作不会执行（静默失败）。
     * 启动时作废它们，让 UI 不再展示"其实没人等"的确认。</p>
     *
     * @param cutoff      只作废此时间之前创建的行（宽限期，避免误伤重启瞬间刚创建的行）
     * @param completedAt 终态时间
     * @param result      终态说明（写进 result_message）
     * @return 受影响行数
     */
    int markPendingAbandonedBefore(@Param("cutoff") LocalDateTime cutoff,
                                   @Param("completedAt") LocalDateTime completedAt,
                                   @Param("result") String result);

    int deleteOldLogs(@Param("cutoff") LocalDateTime cutoff);

    int insert(AuditLogEntity log);

    int deleteById(@Param("id") Long id);

    long count();
}