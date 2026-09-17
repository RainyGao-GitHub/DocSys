package com.DocSystem.agent.session;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 会话历史持久化服务（T5.2a）。
 *
 * <p>把对话消息持久化到 agent_session_messages 表，用户关闭页面后可经会话列表
 * 找回历史会话并续接（后端续接 = 拉取历史消息作为 LLM 上下文）。</p>
 */
@Service
public class ConversationHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ConversationHistoryService.class);

    @Autowired
    private SessionMessageRepository messageRepository;

    @Autowired
    private SessionService sessionService;

    /** 追加一条消息（自动分配 seq） */
    @Transactional
    public void appendMessage(String sessionId, String role, String content) {
        if (sessionId == null || sessionId.isEmpty()) {
            return;
        }
        Integer maxSeq = messageRepository.maxSeq(sessionId);
        SessionMessageEntity msg = new SessionMessageEntity(sessionId, role, content,
                maxSeq != null ? maxSeq + 1 : 1);
        messageRepository.insert(msg);
    }

    /** 保存一轮问答（user + assistant），并更新会话标题/活跃时间。
     *  内部兜底：历史保存失败只记日志，绝不向上抛（避免打断主响应流程）。 */
    public void saveExchange(String sessionId, String userMessage, String assistantMessage) {
        saveExchange(sessionId, userMessage, assistantMessage, null);
    }

    /**
     * 保存一轮问答（user + reasoning[可选] + assistant），并更新会话标题/活跃时间。
     *
     * <p>T7.3 reasoning 持久化：reasoning 以 role="reasoning" 消息落库（灰色小字回看展示）；
     * 续接会话加载历史时 loadSessionHistory 只取 user/assistant，reasoning 自动剥离不回灌模型。</p>
     *
     * @param reasoning 思考过程文本（可为 null/空 → 不落库）
     */
    public void saveExchange(String sessionId, String userMessage, String assistantMessage,
                             String reasoning) {
        if (sessionId == null || sessionId.isEmpty() || userMessage == null) {
            return;
        }
        try {
            appendMessage(sessionId, "user", userMessage);
            if (reasoning != null && !reasoning.isEmpty()) {
                appendMessage(sessionId, "reasoning", reasoning);
            }
            if (assistantMessage != null && !assistantMessage.isEmpty()) {
                appendMessage(sessionId, "assistant", assistantMessage);
            }
            // 会话标题：取第一条用户消息（截断）。注意：必须剔除关注对象注入块（否则标题会变成块首行）
            sessionService.updateTitleIfEmpty(sessionId,
                    com.DocSystem.agent.focus.AgentFocusSupport.stripInjectedBlock(userMessage));
            sessionService.touch(sessionId);
        } catch (Exception e) {
            log.warn("saveExchange failed (ignored, does not affect response): sessionId={}, err={}",
                    sessionId, e.getMessage());
        }
    }

    /** 取会话历史（seq 升序） */
    public List<SessionMessageEntity> getHistory(String sessionId) {
        if (sessionId == null) {
            return java.util.Collections.emptyList();
        }
        return messageRepository.selectBySessionIdOrderBySeq(sessionId);
    }

    /** 会话消息条数 */
    public int countBySessionId(String sessionId) {
        return messageRepository.countBySessionId(sessionId);
    }

    /** 清空会话消息（保留会话本身） */
    @Transactional
    public void clear(String sessionId) {
        messageRepository.deleteBySessionId(sessionId);
    }

    /** 删除会话及其全部消息 */
    @Transactional
    public void deleteSession(String sessionId) {
        messageRepository.deleteBySessionId(sessionId);
        sessionService.delete(sessionId);
    }
}
