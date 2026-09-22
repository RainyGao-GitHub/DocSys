package com.DocSystem.agent.session;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Session persistence service backed by MySQL.
 * Replaces in-memory ConcurrentHashMap in AgentController.
 */
@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    @Autowired
    private SessionRepository sessionRepository;

    /** 供测试注入 mock repository */
    public void setRepository(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Create or update a session.
     */
    @Transactional
    public void save(SessionEntity session) {
        SessionEntity existing = sessionRepository.selectBySessionId(session.getSessionId());
        if (existing != null) {
            existing.setUsername(session.getUsername());
            existing.setJsessionid(session.getJsessionid());
            existing.setTenantId(session.getTenantId());
            existing.setLastActive(LocalDateTime.now());
            sessionRepository.updateLastActive(session.getSessionId(), LocalDateTime.now());
        } else {
            session.setCreatedAt(LocalDateTime.now());
            session.setLastActive(LocalDateTime.now());
            sessionRepository.insert(session);
        }
    }

    /**
     * Find a session by sessionId.
     */
    public SessionEntity findBySessionId(String sessionId) {
        return sessionRepository.selectBySessionId(sessionId);
    }

    /**
     * 列出某用户全部会话（按最近活跃倒序）。
     */
    public List<SessionEntity> listByUsername(String username) {
        return sessionRepository.selectByUsername(username);
    }

    /**
     * 创建会话（带标题）。
     */
    @Transactional
    public SessionEntity createSession(String sessionId, String username, String title) {
        SessionEntity session = new SessionEntity(sessionId, username, null);
        if (title != null && !title.isEmpty()) {
            session.setMetadata(toMetadataJson(title));
        }
        sessionRepository.insert(session);
        return session;
    }

    /**
     * 会话标题为空时用第一条用户消息补（只补一次）。
     */
    @Transactional
    public void updateTitleIfEmpty(String sessionId, String firstMessage) {
        SessionEntity existing = sessionRepository.selectBySessionId(sessionId);
        if (existing == null) {
            // 会话不存在：用消息的 sessionId 兜底建一条（可能来自前端直接传 sessionId）
            createSession(sessionId, firstMessage != null ? null : "unknown", truncateTitle(firstMessage));
            return;
        }
        String title = titleFromMetadata(existing.getMetadata());
        if (title == null || title.isEmpty()) {
            // 已存在会话 → 用 UPDATE 更新 metadata（⚠️ 不可 insert，会违反 session_id 唯一约束）
            String newTitle = truncateTitle(firstMessage);
            sessionRepository.updateMetadata(sessionId, toMetadataJson(newTitle));
        }
    }

    /** 从 metadata JSON 取标题 */
    public static String titleFromMetadata(String metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSON.parseObject(metadata);
            return obj != null ? obj.getString("title") : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String toMetadataJson(String title) {
        com.alibaba.fastjson.JSONObject obj = new com.alibaba.fastjson.JSONObject();
        obj.put("title", title);
        return obj.toJSONString();
    }

    // ==================== P3：metadata 自定义键（续接标记等，不新增表） ====================

    /**
     * 读 metadata JSON 里的一个键（会话不存在/键不存在/解析失败 → null）。
     */
    public String getMetaValue(String sessionId, String key) {
        if (sessionId == null || key == null) {
            return null;
        }
        SessionEntity s = sessionRepository.selectBySessionId(sessionId);
        return metaValueOf(s == null ? null : s.getMetadata(), key);
    }

    /** 从 metadata JSON 字符串取一个键（静态版，便于测试/纯函数复用） */
    public static String metaValueOf(String metadata, String key) {
        if (metadata == null || metadata.isEmpty() || key == null) {
            return null;
        }
        try {
            com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSON.parseObject(metadata);
            if (obj == null) {
                return null;
            }
            Object v = obj.get(key);
            return v == null ? null : String.valueOf(v);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 写入/覆盖 metadata 里的一个键（**保留 title 等既有键**）。
     *
     * @return 受影响行数 > 0。⚠️ 本工程 SQLite + c3p0 + MyBatis 下 update 可能返回 0
     *         但数据实际已写入（见 memory: agent-tool-loop.md T8.3.1 修复4），
     *         调用方请以"不抛异常即成功"为准，勿据返回值判定失败
     */
    @Transactional
    public boolean putMetaJson(String sessionId, String key, Object value) {
        if (sessionId == null || key == null) {
            return false;
        }
        SessionEntity s = sessionRepository.selectBySessionId(sessionId);
        if (s == null) {
            return false;
        }
        com.alibaba.fastjson.JSONObject obj = parseMetadataOrEmpty(s.getMetadata());
        obj.put(key, value);
        return sessionRepository.updateMetadata(sessionId, obj.toJSONString()) > 0;
    }

    /** 删除 metadata 里的一个键（不存在则无操作） */
    @Transactional
    public void removeMeta(String sessionId, String key) {
        if (sessionId == null || key == null) {
            return;
        }
        SessionEntity s = sessionRepository.selectBySessionId(sessionId);
        if (s == null) {
            return;
        }
        com.alibaba.fastjson.JSONObject obj = parseMetadataOrEmpty(s.getMetadata());
        if (!obj.containsKey(key)) {
            return;
        }
        obj.remove(key);
        sessionRepository.updateMetadata(sessionId, obj.toJSONString());
    }

    private static com.alibaba.fastjson.JSONObject parseMetadataOrEmpty(String metadata) {
        if (metadata != null && !metadata.isEmpty()) {
            try {
                com.alibaba.fastjson.JSONObject obj = com.alibaba.fastjson.JSON.parseObject(metadata);
                if (obj != null) {
                    return obj;
                }
            } catch (Exception e) {
                // 旧数据非法 JSON → 丢弃重建（不阻断主流程）
                log.warn("session metadata 不是合法 JSON，已重置: {}", metadata);
            }
        }
        return new com.alibaba.fastjson.JSONObject();
    }

    /** 首条消息截断为会话标题（≤30 字符，换行折叠） */
    public static String truncateTitle(String message) {
        if (message == null) {
            return "新会话";
        }
        String flat = message.replaceAll("\\s+", " ");
        if (flat.length() > 30) {
            return flat.substring(0, 30) + "…";
        }
        return flat.isEmpty() ? "新会话" : flat;
    }

    /**
     * Touch last_active timestamp (called on each request to keep session alive).
     */
    @Transactional
    public void touch(String sessionId) {
        sessionRepository.updateLastActive(sessionId, LocalDateTime.now());
    }

    /**
     * Delete a session.
     */
    @Transactional
    public void delete(String sessionId) {
        sessionRepository.deleteBySessionId(sessionId);
    }

    /**
     * Get total active session count.
     */
    public long countActiveSessions() {
        return sessionRepository.count();
    }

    /**
     * Periodic cleanup of inactive sessions (older than 7 days).
     * Runs every 6 hours.
     */
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000)
    @Transactional
    public void cleanupInactiveSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        int deleted = sessionRepository.deleteInactiveBefore(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} inactive sessions older than {}", deleted, cutoff);
        }
    }
}
