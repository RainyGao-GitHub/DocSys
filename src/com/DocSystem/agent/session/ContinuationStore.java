package com.DocSystem.agent.session;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * P3：轮数预算到顶后的「未完成任务」标记 + 续接上下文。
 *
 * <p>解决的问题：P1 到顶时已能交付阶段性结论，但用户回一句"继续"后，服务端只是把它
 * 当**普通新消息**——上一段"已经查过什么"只存在于那一轮的转录里（未持久化），模型只能
 * 从头再来，于是重复劳动、甚至再次到顶。</p>
 *
 * <p>做法（**不新增表**，复用既有会话存储）：</p>
 * <ol>
 *   <li>到顶交付时把「本轮结论 + 工具进展摘要（{@code TranscriptCompactor} 压缩）」写进
 *       会话 metadata 的 {@code pendingContinuation} 键（{@link SessionService#putMetaJson}）；</li>
 *   <li>下一条消息若是明确的续接短语（"继续 / 接着做 / go on"…），取出该键并**前置注入**
 *       一段 {@code [SYSTEM]} 上下文，让模型从断点接着做；</li>
 *   <li>取用即清（{@link #takeContinuationContext}）：第二次"继续"没有断点可续 →
 *       按普通消息处理（避免把旧上下文反复注入）。</li>
 * </ol>
 *
 * <p>与旧编排/SSE 的关系：纯增量，不改任何既有事件；{@code sessionService} 未装配或
 * sessionId 为空时全部退化为"无标记"，行为与改造前一致。</p>
 */
@Service
public class ContinuationStore {

    private static final Logger log = LoggerFactory.getLogger(ContinuationStore.class);

    /** 会话 metadata 里的键名（与 title 同级，互不影响） */
    static final String META_KEY = "pendingContinuation";

    /** 注入的上一段结论上限（字符） */
    private static final int ANSWER_CHARS = 1200;

    /** 注入的工具进展摘要上限（字符） */
    private static final int PROGRESS_CHARS = 1500;

    /**
     * 续接短语（**整条消息**匹配，避免"继续优化首页"这类正常请求被误判）。
     * 只认明确表达"接着刚才那条做"的说法。
     */
    private static final Pattern CONTINUATION_QUERY = Pattern.compile(
            "^\\s*(继续|接着(做|干|来|弄|写|读|查|说)?|继续做|继续吧|往下(做|来|干)?|"
          + "接着上面的(做|来)?|保持继续|go\\s+on|continue)\\s*[。．.,，!！?？~～\\s]*$",
            Pattern.CASE_INSENSITIVE);

    @Autowired(required = false)
    private SessionService sessionService;

    /** 供测试注入 */
    public void setSessionService(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /** 是否是"续接"请求（纯函数，便于护栏与日志判定） */
    public static boolean isContinuationQuery(String query) {
        return query != null && CONTINUATION_QUERY.matcher(query).matches();
    }

    /**
     * 记录"任务未完成"标记（到顶交付时调用）。
     *
     * @param sessionId 会话 ID（null → 不记，退化为无续接能力）
     * @param answer    本轮阶段性结论
     * @param progress  工具进展摘要（{@code TranscriptCompactor.summarize} 产物）
     * @param turns     本轮用了多少轮
     * @param toolCalls 本轮调了多少次工具
     */
    public void savePending(String sessionId, String answer, String progress, int turns, int toolCalls) {
        if (sessionService == null || sessionId == null) {
            return;
        }
        JSONObject obj = new JSONObject();
        obj.put("answer", clip(answer, ANSWER_CHARS));
        obj.put("progress", clip(progress, PROGRESS_CHARS));
        obj.put("turns", turns);
        obj.put("toolCalls", toolCalls);
        obj.put("ts", System.currentTimeMillis());
        try {
            // ⚠️ 返回值只作参考：本工程 SQLite + c3p0 + MyBatis 下 update 可能返回 0 但数据已写入
            // （历史踩坑见 memory: agent-tool-loop.md T8.3.1 修复4），故"写不抛异常"即视为成功。
            boolean rows = sessionService.putMetaJson(sessionId, META_KEY, obj);
            com.DocSystem.common.Log.info("[Continuation][SAVE] sessionId=" + sessionId
                    + " saved=ok updateRows=" + (rows ? 1 : 0) + " turns=" + turns + " toolCalls=" + toolCalls
                    + " answerLen=" + len(answer) + " progressLen=" + len(progress));
        } catch (Exception e) {
            com.DocSystem.common.Log.warn("[Continuation][SAVE-FAIL] sessionId=" + sessionId
                    + " " + e.getMessage());
        }
    }

    /**
     * 取续接上下文（取用即清）。
     *
     * @return 要前置注入的系统段落；非续接请求 / 无未完成标记 / 未装配 → null
     */
    public String takeContinuationContext(String sessionId, String query) {
        if (sessionService == null || sessionId == null || !isContinuationQuery(query)) {
            return null;
        }
        String raw = sessionService.getMetaValue(sessionId, META_KEY);
        if (raw == null || raw.isEmpty()) {
            com.DocSystem.common.Log.info("[Continuation][TAKE] sessionId=" + sessionId + " pending=none");
            return null;
        }
        String text;
        try {
            JSONObject obj = JSON.parseObject(raw);
            if (obj == null) {
                return null;
            }
            String answer = obj.getString("answer");
            String progress = obj.getString("progress");
            StringBuilder sb = new StringBuilder();
            sb.append("[SYSTEM] 这是上一段任务的**续接**：上一段因工具预算用尽而中断，")
              .append("请从这里接着做，**不要重复已经完成的部分**，也不要重新调用已经成功过的同参数工具。");
            if (answer != null && !answer.isEmpty()) {
                sb.append("\n--- 上一段给出的结论 ---\n").append(answer);
            }
            if (progress != null && !progress.isEmpty()) {
                sb.append("\n--- 上一段已完成的工具进展（已压缩为摘要）---\n").append(progress);
            }
            sb.append("\n--- 续接要求 ---\n")
              .append("先看上面进展里还缺什么，只补做缺失的部分；全部完成后给出**完整**的最终结果。");
            text = sb.toString();
            sessionService.removeMeta(sessionId, META_KEY);
            com.DocSystem.common.Log.info("[Continuation][TAKE] sessionId=" + sessionId
                    + " pending=used answerLen=" + len(answer) + " progressLen=" + len(progress));
        } catch (Exception e) {
            log.warn("解析 pendingContinuation 失败（忽略，按普通消息处理）: {}", e.getMessage());
            return null;
        }
        return text;
    }

    private static String clip(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() > max ? s.substring(0, max) + "\n…（已截断）" : s;
    }

    private static int len(String s) {
        return s == null ? 0 : s.length();
    }
}
