package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.llm.StreamChunk;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/**
 * 护栏：「输出被截断」的**跨文件契约**（2026-10-08，DB 取证见
 * DevAgentControl/CURRENT_STATE_agent任务中途停止.md）。
 *
 * <p>背景：推理模型的 reasoning 会计入 `max_tokens`。思考一长就把预算吃光 →
 * `finish_reason=length` + 正文（content）为空 → 改造前 `ToolUseLoop` 把"空正文 + 无工具调用"
 * 当**成功的最终回答**（`success("")`），用户看到 Agent 无声停在半路，且不报错、不重试、无「继续」入口。</p>
 *
 * <p>本护栏钉住修复后的三处口径（任何一处被改回去，用户又会看到"无声停下"）：</p>
 * <ol>
 *   <li><b>编排层</b>：空正文不返回 success；重试一次后交付 partial（{@code REASON_OUTPUT_TRUNCATED}）；</li>
 *   <li><b>响应层</b>：`loopResponse` 按原因给不同文案 + 把 {@code truncatedReason} 放进 meta；</li>
 *   <li><b>前端</b>：读 {@code meta.truncatedReason}，「输出被截断」与「预算到顶」徽标分开，且仍有「继续」。</li>
 * </ol>
 *
 * <p>为什么部分是源码 lint：前端那段是纯 JS（project 页/agent 页），裸 JVM 跑不了；
 * lint 至少能把"常量名/文案/meta 键被改回"这类回归钉住（同 {@code TestFocusContextFrontendLint} 口径）。</p>
 */
public class TestTruncationContract {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        String mainAgent = read("src/com/DocSystem/agent/orchestrator/MainAgent.java");
        String toolUseLoop = read("src/com/DocSystem/agent/orchestrator/ToolUseLoop.java");
        String indexHtml = read("WebRoot/web/agent/index.html");

        runtimeConstants();
        loopSide(toolUseLoop);
        responseSide(mainAgent);
        frontendSide(indexHtml);
        perModelMaxTokensWiring();
        escalationAndMetrics(mainAgent);

        System.out.println("\n======== TestTruncationContract: " + pass + " passed, " + fail
                + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- 常量与工厂（运行时） ----------

    private static void runtimeConstants() {
        check("reason constant value is stable (frontend compares this literal)",
                ToolUseResult.REASON_OUTPUT_TRUNCATED.equals("outputTruncated"),
                ToolUseResult.REASON_OUTPUT_TRUNCATED);
        check("reason constant for maxTurns is stable",
                ToolUseResult.REASON_MAX_TURNS.equals("maxTurns"),
                ToolUseResult.REASON_MAX_TURNS);

        ToolUseResult partial = ToolUseResult.partialOutputTruncated("半截结论", null, 2, 1);
        check("partialOutputTruncated: success (可交付) + truncated", partial.success && partial.truncated);
        check("partialOutputTruncated: reason=outputTruncated",
                ToolUseResult.REASON_OUTPUT_TRUNCATED.equals(partial.truncatedReason));
        check("partialOutputTruncated: not maxTurnsExceeded", !partial.maxTurnsExceeded);

        ToolUseResult budget = ToolUseResult.partial("阶段结论", null, 25, 30);
        check("partial (轮数预算) keeps reason=maxTurns",
                ToolUseResult.REASON_MAX_TURNS.equals(budget.truncatedReason));

        ToolUseResult ok = ToolUseResult.success("正常回答", null, 1, 0);
        check("success: no truncatedReason", ok.truncatedReason == null && !ok.truncated);

        check("StreamChunk.outputTruncated() is recognizable",
                StreamChunk.outputTruncated().isOutputTruncated());
    }

    // ---------- 编排层：空正文不再当成功回答 ----------

    private static void loopSide(String src) {
        check("loop captures truncation marker from stream",
                src.contains("chunk.isOutputTruncated()"));
        check("empty-answer retry is bounded (MAX_EMPTY_ANSWER_RETRIES)",
                src.contains("MAX_EMPTY_ANSWER_RETRIES = 1")
                        && src.contains("emptyAnswerRetries < MAX_EMPTY_ANSWER_RETRIES"));
        check("blank answer is not returned as success",
                src.contains("if (answer.trim().isEmpty())"),
                "空正文必须先走重试/partial，不能直接 success");
        check("blank retry injects the direct-answer hint",
                src.contains("EMPTY_ANSWER_HINT"));
        check("blank answer eventually delivered as partial (not silently dropped)",
                src.contains("ToolUseResult.partialOutputTruncated("));
        check("truncated-but-non-empty answer marked truncated",
                src.contains("com.DocSystem.common.Log.warn(\"[ToolUseLoop][TRUNCATED]"));
    }

    // ---------- 响应层：文案 + meta ----------

    private static void responseSide(String src) {
        check("loopResponse routes notice by reason",
                src.contains("truncationNotice(tr)"));
        check("output-truncation wording is distinct",
                src.contains("REASON_OUTPUT_TRUNCATED.equals(tr.truncatedReason)")
                        && src.contains("模型本轮输出被截断"));
        check("max-turns wording kept (regression)",
                src.contains("本轮工具预算到顶"));
        check("meta carries truncatedReason",
                src.contains("resp.addMetadata(\"truncatedReason\""));
        check("meta falls back to maxTurns when reason missing",
                src.contains("REASON_MAX_TURNS);"));
    }

    // ---------- 前端：徽标 + 继续入口 ----------

    private static void frontendSide(String html) {
        check("frontend reads meta.truncatedReason",
                html.contains("meta.truncatedReason"));
        check("frontend badge literal matches the Java constant",
                html.contains("'" + ToolUseResult.REASON_OUTPUT_TRUNCATED + "'"));
        check("frontend has distinct badge text for truncation",
                html.contains("输出被截断") && html.contains("预算到顶"));
        check("frontend keeps the continue entry for both reasons",
                html.contains("class=\"continue-btn\"") && html.contains("function continueFromTruncated("));
    }

    // ---------- D1：按模型 maxTokens 的真正接线（2026-10-08） ----------

    /**
     * D1：以前「高级参数 → maxTokens」只存不发。这里钉住"请求体的输出上限必须走
     * {@code effectiveMaxTokens(按模型值)}"，任何一处退回写死全局默认都会被这条拦下。
     */
    private static void perModelMaxTokensWiring() throws Exception {
        String llm = read("src/com/DocSystem/agent/llm/LLMService.java");
        String resolved = read("src/com/DocSystem/agent/llm/ResolvedLlmConfig.java");
        String userLlm = read("src/com/DocSystem/agent/llm/UserLlmModelService.java");

        check("LLMService resolves per-request budget", llm.contains("private int effectiveMaxTokens(Integer"));
        check("LLMService exposes global default for escalation", llm.contains("public int getDefaultMaxTokens()"));
        check("no request body hardcodes the global default any more",
                !llm.contains("requestBody.put(\"max_tokens\", maxTokens)"),
                "所有 max_tokens 请求体都必须走 effectiveMaxTokens(...)");
        check("streaming bodies use the per-request budget",
                countOccurrences(llm, "requestBody.put(\"max_tokens\", effectiveMaxTokens(") >= 3);
        check("non-streaming bodies use it too",
                countOccurrences(llm, "retryBody.put(\"max_tokens\", effectiveMaxTokens(") >= 1);
        check("default-config resolution carries the model's maxTokens",
                llm.contains("ResolvedLlmConfig.parseMaxTokens(m.settings)"));
        check("system/user model resolution carries it",
                userLlm.contains("ResolvedLlmConfig.parseMaxTokens(c.settings)")
                        && userLlm.contains("ResolvedLlmConfig.parseMaxTokensFromJson(m.getSettings())"));

        check("ResolvedLlmConfig parses maxTokens (both key spellings)",
                resolved.contains("parseMaxTokens") && resolved.contains("\"max_tokens\""));
        check("ResolvedLlmConfig clamps/bounds the value",
                resolved.contains("MIN_MAX_TOKENS") && resolved.contains("MAX_MAX_TOKENS"));
        check("ResolvedLlmConfig can copy with a new budget (escalation)",
                resolved.contains("public ResolvedLlmConfig withMaxTokens(int"));
    }

    // ---------- D2/D3：撞顶升级重试 + 截断计数 ----------

    private static void escalationAndMetrics(String mainAgent) {
        check("escalation hook exists in both run paths",
                countOccurrences(mainAgent, "escalateAndRerun(toolQuery, tr,") == 2);
        check("escalation only fires for output truncation",
                mainAgent.contains("isOutputTruncated(tr)")
                        && mainAgent.contains("REASON_OUTPUT_TRUNCATED"));
        check("escalation tells the frontend to clear the half-streamed text",
                mainAgent.contains("streamSink.onRetry()"));
        check("escalation keeps the first partial on failure",
                mainAgent.contains("keeping the partial answer"));
        check("escalation is bounded by a ceiling constant",
                mainAgent.contains("ESCALATED_MAX_TOKENS = 32768"));
        check("truncation is counted (observability)",
                mainAgent.contains("agentMetrics.incrementCounter(\"agent.tool.truncated\"")
                        && mainAgent.contains("countTruncation(tr, \"streaming\")")
                        && mainAgent.contains("countTruncation(tr, \"sync\")"));

        // 升级公式（纯函数）：×4 与 +4096 取大者，再夹到上限；≤ 当前值表示"无法升级"
        check("escalation formula: 2048 → 8192", MainAgent.escalatedMaxTokensFor(2048) == 8192);
        check("escalation formula: 8192 → 32768 (capped)",
                MainAgent.escalatedMaxTokensFor(8192) == 32768);
        check("escalation formula: tiny budget still gets +4096 floor",
                MainAgent.escalatedMaxTokensFor(16) == 4112);
        check("escalation formula: at ceiling → no escalation",
                MainAgent.escalatedMaxTokensFor(32768) == 32768);
        check("escalation formula: above ceiling → no escalation",
                MainAgent.escalatedMaxTokensFor(200000) == 32768);
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = haystack.indexOf(needle);
        while (idx >= 0) {
            count++;
            idx = haystack.indexOf(needle, idx + needle.length());
        }
        return count;
    }

    // ---------- helpers ----------

    private static String read(String path) throws Exception {
        File f = new File(path);
        if (!f.isFile()) {
            throw new IllegalStateException("file not found (run from repo root): " + path);
        }
        return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
    }

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null ? "" : "  -> " + detail));
        }
    }
}
