package com.DocSystem.agent.orchestrator;

import com.DocSystem.agent.tool.ToolDefinition;
import com.DocSystem.agent.tool.ToolRegistry;
import com.DocSystem.agent.tool.ToolResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * T2.1 护栏：ToolUseLoop 循环逻辑（用脚本化假 LLM 驱动，无 Spring/无真实 LLM 依赖）。
 *
 * 覆盖：
 *  - 多轮：LLM 调工具 → 拿结果 → 再调 → 最终回答（turns/toolCalls 正确）
 *  - 单轮：无工具调用 → 直接最终回答
 *  - 未知工具：registry 返回 error → 回灌继续
 *  - 畸形 tool_call：回灌重试提示 → 最终成功
 *  - 连续畸形超过上限 → 终止
 *  - 超轮数预算（P1）：先跑“预算收尾轮” → 有文字则 success + truncated（交付阶段性成果）；
 *    收尾轮仍只会调工具、没文字 → error + maxTurnsExceeded
 *  - 转录超限（P2）：折叠成 [TOOL_RESULT_SUMMARY]（保留工具名/结论）而不是整条丢弃
 *  - adminOnly 工具对非管理员不可见（prompt 不含该工具）
 */
public class TestToolUseLoop {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testMultiTurnChain();
        testSingleTurnNoTool();
        testUnknownToolRecovery();
        testMalformedRetryThenSuccess();
        testTooManyMalformedAbort();
        testMaxTurnsExceeded();
        testBudgetWrapupPartial();
        testMaxTurnsConfigurable();
        testAdminFilteringInPrompt();
        testConsecutiveIdenticalToolCall();
        testTranscriptTrimming();
        testHistoryInjection();
        testProductFooter();
        System.out.println("\n======== TestToolUseLoop: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    /** 带 detail 的断言（失败时打印实际值：修断言前先看清事实，别靠猜） */
    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : "  -> " + detail));
        }
    }

    // ---------- 测试工具 ----------

    private static ToolRegistry buildRegistry(boolean includeAdmin) {
        ToolRegistry reg = new ToolRegistry();
        reg.register(ToolDefinition.builder("list_repos", "列出仓库", args -> ToolResult.ok("[仓库1, 仓库2]")).build());
        reg.register(ToolDefinition.builder("get_repos", "获取仓库", args -> ToolResult.ok("仓库" + args.getString("vid") + "详情")).build());
        reg.register(ToolDefinition.builder("boom", "抛异常工具", args -> ToolResult.error("执行失败: disk full")).build());
        // 方案 B：写入类工具（产物登记靠 workspace 参数 + ToolResult.data）
        reg.register(ToolDefinition.builder("write_file", "写文件",
                args -> ToolResult.ok("✅ 已写入文件",
                        com.DocSystem.agent.tool.AgentProductLink.of(args.getInteger("vid"),
                                args.getString("path"), args.getString("name"), Long.valueOf(999L), "new")))
                .isWrite(true).build());
        reg.register(ToolDefinition.builder("rename_doc", "重命名",
                args -> ToolResult.ok("✅ 已重命名")).isWrite(true).build());
        if (includeAdmin) {
            reg.register(ToolDefinition.builder("doc_sys_init", "系统初始化", args -> ToolResult.ok("init")).adminOnly(true).build());
        }
        return reg;
    }

    /** 脚本化假 LLM：按调用次数返回脚本中的内容 */
    private static ToolUseLoop.LlmCaller scripted(List<String> script) {
        return new ToolUseLoop.LlmCaller() {
            private int idx = 0;
            @Override
            public String chat(List<Map<String, String>> messages) {
                return script.get(Math.min(idx++, script.size() - 1));
            }
        };
    }

    /** 记录每次调用时消息列表的假 LLM（用于断言 prompt 内容） */
    private static ToolUseLoop.LlmCaller recording(List<String> script, List<List<Map<String, String>>> seen) {
        return new ToolUseLoop.LlmCaller() {
            private int idx = 0;
            @Override
            public String chat(List<Map<String, String>> messages) {
                seen.add(new ArrayList<>(messages));
                return script.get(Math.min(idx++, script.size() - 1));
            }
        };
    }

    // ---------- 测试用例 ----------

    /**
     * 方案 B（产物链接）：写入类工具成功后，最终回答末尾带产物标记；
     * 非白名单工具（rename_doc）不登记；无写入的一轮不产生空标记。
     */
    private static void testProductFooter() {
        List<String> script = new ArrayList<>();
        script.add("<tool_call>{\"name\":\"write_file\",\"arguments\":{\"vid\":1,\"path\":\"66666\",\"name\":\"a.txt\",\"content\":\"x\"}}</tool_call>");
        script.add("文件已写好。");
        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("写一个文件");
        check("product footer: success", r.success);
        check("product footer: appended", r.message != null
                && r.message.contains(com.DocSystem.agent.tool.AgentProductLink.MARK_START));
        List<com.DocSystem.agent.tool.AgentProductLink.Product> parsed =
                com.DocSystem.agent.tool.AgentProductLink.parse(r.message);
        check("product footer: one product", parsed.size() == 1, String.valueOf(parsed.size()));
        if (parsed.size() == 1) {
            check("product footer: name", "a.txt".equals(parsed.get(0).name), parsed.get(0).name);
            check("product footer: normalized path", "66666/".equals(parsed.get(0).path), parsed.get(0).path);
            check("product footer: docId from tool data", parsed.get(0).docId != null
                    && parsed.get(0).docId.longValue() == 999L);
        }
        check("product footer: answer text preserved", r.message.trim().startsWith("文件已写好。"));
        check("product footer: stripped text is model answer",
                "文件已写好。".equals(com.DocSystem.agent.tool.AgentProductLink.strip(r.message)));
        // transcript（回灌模型的消息列表）不得含产物标记
        boolean transcriptClean = true;
        for (Map<String, String> m : r.transcript) {
            if (m.get("content") != null
                    && m.get("content").contains(com.DocSystem.agent.tool.AgentProductLink.MARK_START)) {
                transcriptClean = false;
                break;
            }
        }
        check("product footer: not leaked into transcript", transcriptClean);

        // 非白名单写入工具（rename_doc）：不登记
        List<String> script2 = new ArrayList<>();
        script2.add("<tool_call>{\"name\":\"rename_doc\",\"arguments\":{\"vid\":1,\"path\":\"\",\"name\":\"a.txt\",\"dstName\":\"b.txt\"}}</tool_call>");
        script2.add("已重命名。");
        ToolUseResult r2 = new ToolUseLoop(scripted(script2), buildRegistry(false), false).run("重命名");
        check("product footer: rename_doc NOT registered", r2.message != null
                && !r2.message.contains(com.DocSystem.agent.tool.AgentProductLink.MARK_START));

        // 无写入的一轮：不产生标记
        List<String> script3 = new ArrayList<>();
        script3.add("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
        script3.add("共 2 个仓库。");
        ToolUseResult r3 = new ToolUseLoop(scripted(script3), buildRegistry(false), false).run("列仓库");
        check("product footer: no marker without writes", r3.message != null
                && !r3.message.contains(com.DocSystem.agent.tool.AgentProductLink.MARK_START));
    }
    private static void testMultiTurnChain() {
        // turn1: list_repos → turn2: get_repos → turn3: final answer
        List<String> script = new ArrayList<>();
        script.add("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
        script.add("<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":1}}</tool_call>");
        script.add("共有 2 个仓库，第一个是仓库1。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("列出仓库并查看仓库1");

        check("multi-turn: success", r.success);
        check("multi-turn: turns=3", r.turns == 3);
        check("multi-turn: toolCalls=2", r.toolCalls == 2);
        check("multi-turn: final answer", r.message != null && r.message.contains("仓库1"));
        // transcript 应包含工具结果标记
        boolean hasToolResult = false;
        for (Map<String, String> m : r.transcript) {
            if (m.get("content") != null && m.get("content").contains("[TOOL_RESULT tool=list_repos]")) {
                hasToolResult = true;
                break;
            }
        }
        check("multi-turn: tool result fed back", hasToolResult);
    }

    private static void testSingleTurnNoTool() {
        List<String> script = new ArrayList<>();
        script.add("你好，我是 DocSys 的助手。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("你好");

        check("single-turn: success", r.success);
        check("single-turn: turns=1", r.turns == 1);
        check("single-turn: toolCalls=0", r.toolCalls == 0);
        check("single-turn: answer", r.message.contains("助手"));
    }

    private static void testUnknownToolRecovery() {
        // turn1: 调不存在的工具 → registry 返回 error → turn2: 最终回答
        List<String> script = new ArrayList<>();
        script.add("<tool_call>{\"name\":\"no_such_tool\",\"arguments\":{}}</tool_call>");
        script.add("抱歉，我没有找到该功能。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("调用不存在的工具");

        check("unknown tool: success (recovered)", r.success);
        check("unknown tool: turns=2", r.turns == 2);
        check("unknown tool: toolCalls=1", r.toolCalls == 1);
        // transcript 含错误回灌
        boolean hasErr = false;
        for (Map<String, String> m : r.transcript) {
            if (m.get("content") != null && m.get("content").contains("Unknown tool")) {
                hasErr = true;
                break;
            }
        }
        check("unknown tool: error fed back", hasErr);
    }

    private static void testMalformedRetryThenSuccess() {
        // turn1: 畸形 → turn2: 正常工具调用 → turn3: 最终回答
        List<String> script = new ArrayList<>();
        script.add("<tool_call>{bad json}</tool_call>");
        script.add("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
        script.add("仓库列表如上。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("查仓库");

        check("malformed retry: success", r.success);
        check("malformed retry: turns=3", r.turns == 3);
        check("malformed retry: toolCalls=1", r.toolCalls == 1);
    }

    private static void testTooManyMalformedAbort() {
        List<String> script = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            script.add("<tool_call>{bad json}</tool_call>");
        }

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("查仓库");

        check("too many malformed: not success", !r.success);
        check("too many malformed: aborted", r.message != null && r.message.contains("格式错误"));
    }

    private static void testMaxTurnsExceeded() {
        // 一直调工具不回答 → 超轮数预算：收尾轮仍然只会调工具（剥掉标记后无文字）→ 回退为 error
        List<String> script = new ArrayList<>();
        for (int i = 0; i < ToolUseLoop.MAX_TURNS + 2; i++) {
            script.add("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
        }

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("循环调工具");

        check("max turns: not success", !r.success);
        check("max turns: flag set", r.maxTurnsExceeded);
        check("max turns: not truncated", !r.truncated);
        check("max turns: turns=" + (ToolUseLoop.MAX_TURNS + 1) + " (incl. wrap-up)",
                r.turns == ToolUseLoop.MAX_TURNS + 1);
        check("max turns: toolCalls=" + ToolUseLoop.MAX_TURNS, r.toolCalls == ToolUseLoop.MAX_TURNS);
    }

    /**
     * P1：预算到顶但收尾轮给出了阶段性文字 → success + truncated（不再无声失败）。
     */
    private static void testBudgetWrapupPartial() {
        // 前 MAX_TURNS 轮一直调工具，收尾轮给出“已完成 / 还缺 / 下一步”
        List<String> script = new ArrayList<>();
        for (int i = 0; i < ToolUseLoop.MAX_TURNS; i++) {
            script.add("<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":" + i + "}}</tool_call>");
        }
        script.add("① 已完成：查到 25 个仓库；② 还缺：仓库 26；③ 下一步：继续查 26。");

        List<List<Map<String, String>>> seen = new ArrayList<>();
        ToolUseLoop loop = new ToolUseLoop(recording(script, seen), buildRegistry(false), false);
        ToolUseResult r = loop.run("查全部仓库");

        check("wrap-up: success (partial delivered)", r.success);
        check("wrap-up: truncated flag", r.truncated);
        check("wrap-up: not maxTurnsExceeded", !r.maxTurnsExceeded);
        check("wrap-up: turns=MAX_TURNS+1", r.turns == ToolUseLoop.MAX_TURNS + 1);
        check("wrap-up: toolCalls=MAX_TURNS", r.toolCalls == ToolUseLoop.MAX_TURNS);
        check("wrap-up: answer kept", r.message != null && r.message.contains("已完成"));

        // 收尾轮必须带上“预算用尽”提示（否则模型不知道要收口）
        List<Map<String, String>> lastMessages = seen.get(seen.size() - 1);
        boolean hasHint = false;
        for (Map<String, String> m : lastMessages) {
            if (m.get("content") != null && m.get("content").contains("工具预算已用尽")) {
                hasHint = true;
                break;
            }
        }
        check("wrap-up: budget hint injected", hasHint);

        // 收尾轮不得再执行工具（转录里只有 MAX_TURNS 条工具结果）
        int resultCount = 0;
        for (Map<String, String> m : r.transcript) {
            if (m.get("content") != null && m.get("content").startsWith("[TOOL_RESULT")) {
                resultCount++;
            }
        }
        check("wrap-up: no extra tool executed", resultCount == ToolUseLoop.MAX_TURNS);
    }

    /**
     * P1：轮数预算可配（agent_max_turns 入口）且越界钳制。
     */
    private static void testMaxTurnsConfigurable() {
        // 同一个脚本（5 轮工具 + 第 6 轮文字回答）：预算 10 → 正常收尾；预算 5 → 走收尾轮但仍有阶段性成果
        List<String> script = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            script.add("<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":" + i + "}}</tool_call>");
        }
        script.add("查完了：共 5 个仓库。");

        ToolUseLoop wide = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        wide.setMaxTurns(10);
        ToolUseResult r1 = wide.run("查仓库");
        check("configurable: maxTurns kept (10)", wide.getMaxTurns() == 10);
        check("configurable: budget 10 → success & not truncated", r1.success && !r1.truncated);
        check("configurable: turns=6", r1.turns == 6);

        ToolUseLoop narrow = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        narrow.setMaxTurns(5);
        ToolUseResult r2 = narrow.run("查仓库");
        check("configurable: budget 5 → partial & truncated", r2.success && r2.truncated);
        check("configurable: turns=6 (incl. wrap-up)", r2.turns == 6);
        check("configurable: toolCalls=5", r2.toolCalls == 5);

        ToolUseLoop high = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        high.setMaxTurns(999);
        check("configurable: clamp high → MAX_TURNS_LIMIT",
                high.getMaxTurns() == ToolUseLoop.MAX_TURNS_LIMIT);
        high.setMaxTurns(1);
        check("configurable: clamp low → MIN_TURNS", high.getMaxTurns() == ToolUseLoop.MIN_TURNS);
    }

    private static void testAdminFilteringInPrompt() {
        List<List<Map<String, String>>> seen = new ArrayList<>();
        List<String> script = new ArrayList<>();
        script.add("好的");

        // 非管理员：prompt 不应含 doc_sys_init
        ToolUseLoop nonAdmin = new ToolUseLoop(recording(script, seen), buildRegistry(true), false);
        nonAdmin.run("hi");
        String nonAdminPrompt = systemContent(seen.get(0));
        check("non-admin prompt hides adminOnly", !nonAdminPrompt.contains("doc_sys_init"));
        check("non-admin prompt has read tools", nonAdminPrompt.contains("list_repos"));

        // 管理员：prompt 应含 doc_sys_init
        List<List<Map<String, String>>> seen2 = new ArrayList<>();
        ToolUseLoop admin = new ToolUseLoop(recording(script, seen2), buildRegistry(true), true);
        admin.run("hi");
        String adminPrompt = systemContent(seen2.get(0));
        check("admin prompt shows adminOnly", adminPrompt.contains("doc_sys_init"));
    }

    private static String systemContent(List<Map<String, String>> messages) {
        for (Map<String, String> m : messages) {
            if ("system".equals(m.get("role"))) {
                return m.get("content") != null ? m.get("content") : "";
            }
        }
        return "";
    }

    // ---------- T2.2/T2.3 增强测试 ----------

    private static void testConsecutiveIdenticalToolCall() {
        // 连续 3 次相同工具调用 → 注入提示 → 第4轮给最终回答
        List<String> script = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            script.add("<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>");
        }
        script.add("基于已有信息回答。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("反复查仓库");

        check("identical calls: success", r.success);
        // transcript 应包含"重复调用"提示
        boolean hasHint = false;
        for (Map<String, String> m : r.transcript) {
            if (m.get("content") != null && m.get("content").contains("连续多次调用相同工具")) {
                hasHint = true;
                break;
            }
        }
        check("identical calls: hint injected", hasHint);
    }

    private static void testHistoryInjection() {
        // 历史上下文注入：LLM 首次调用应能看到前文
        List<List<Map<String, String>>> seen = new ArrayList<>();
        List<String> script = new ArrayList<>();
        script.add("好的，我记得前面的对话了。");

        List<Map<String, String>> history = new ArrayList<>();
        Map<String, String> h1 = new java.util.HashMap<>();
        h1.put("role", "user");
        h1.put("content", "我叫小明");
        Map<String, String> h2 = new java.util.HashMap<>();
        h2.put("role", "assistant");
        h2.put("content", "你好小明");
        history.add(h1);
        history.add(h2);

        ToolUseLoop loop = new ToolUseLoop(recording(script, seen), buildRegistry(false), false);
        ToolUseResult r = loop.run("我姓什么？", history);

        check("history: success", r.success);
        // 首次调用消息列表应包含历史
        List<Map<String, String>> firstMessages = seen.get(0);
        boolean hasHistory = false;
        for (Map<String, String> m : firstMessages) {
            if ("我叫小明".equals(m.get("content")) || "你好小明".equals(m.get("content"))) {
                hasHistory = true;
                break;
            }
        }
        check("history: injected into messages", hasHistory);
        check("history: system first", "system".equals(firstMessages.get(0).get("role")));
        check("history: user query last", "user".equals(firstMessages.get(firstMessages.size() - 1).get("role"))
                && "我姓什么？".equals(firstMessages.get(firstMessages.size() - 1).get("content")));
    }

    private static void testTranscriptTrimming() {
        // 每轮 3 个不同工具调用（避开 identical 检测），8 轮后消息数 2+8*4=34 → 触发裁剪到 ≤30，
        // 第 9 轮给出最终回答（未超轮数预算）。
        List<String> script = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            String turn = "<tool_call>{\"name\":\"list_repos\",\"arguments\":{}}</tool_call>"
                    + "<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":" + (i * 2) + "}}</tool_call>"
                    + "<tool_call>{\"name\":\"get_repos\",\"arguments\":{\"vid\":" + (i * 2 + 1) + "}}</tool_call>";
            script.add(turn);
        }
        script.add("完成。");

        ToolUseLoop loop = new ToolUseLoop(scripted(script), buildRegistry(false), false);
        ToolUseResult r = loop.run("连续查询");

        check("trimming: success", r.success);
        check("trimming: turns=9", r.turns == 9);
        check("trimming: toolCalls=24", r.toolCalls == 24);
        check("trimming: not maxTurnsExceeded", !r.maxTurnsExceeded);
        // transcript 不应无限膨胀（裁剪后 ≤ 31）
        check("trimming: transcript capped", r.transcript.size() <= 31);

        // P2：超限是“折叠成摘要”而不是整条丢弃 —— 早期工具名/结论仍可见
        boolean hasSummary = false;
        boolean summaryKeepsName = false;
        for (Map<String, String> m : r.transcript) {
            String c = m.get("content");
            if (c == null || !c.startsWith("[TOOL_RESULT_SUMMARY")) {
                continue;
            }
            hasSummary = true;
            if (c.contains("tool=list_repos") || c.contains("tool=get_repos")) {
                summaryKeepsName = true;
            }
        }
        check("trimming: folded into summary (not dropped)", hasSummary);
        check("trimming: summary keeps tool name", summaryKeepsName);
        // 首条用户请求不能被裁掉
        check("trimming: first user query kept",
                "连续查询".equals(r.transcript.get(1).get("content")));
    }
}
