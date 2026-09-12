package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * T3.2 护栏：写操作工具组 + 确认门。
 *
 * 覆盖：
 *  - DocSysToolFactory.createFullRegistry：写工具全部 isWrite+needsConfirm；只读工具无
 *  - 确认门：needsConfirm 工具执行前触发 gate.confirm
 *  - 拒绝：gate 返回 false → 工具不执行，返回"被用户拒绝"
 *  - 批准：gate 返回 true → 工具正常执行
 *  - NOOP 门（默认）：直接放行
 *  - 只读工具不触发确认门
 */
public class TestWriteTools {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        testWriteToolsFlags();
        testConfirmGateInvoked();
        testConfirmGateReject();
        testConfirmGateApprove();
        testNoopGatePassThrough();
        testReadToolsNoGate();
        testRagAiToolsRegistered();
        System.out.println("\n======== TestWriteTools: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }

    // ---------- 测试 ----------

    private static void testWriteToolsFlags() {
        // 构造（不执行 HTTP，仅验证定义）
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);

        String[] writeTools = {"create_repos", "delete_repos", "update_repos", "create_folder",
                "write_file", "write_note", "delete_doc", "rename_doc", "move_doc", "copy_doc",
                "lock_doc", "unlock_doc", "create_doc_share", "backup_repos"};
        for (String name : writeTools) {
            ToolDefinition def = reg.find(name);
            check("write tool registered: " + name, def != null);
            if (def != null) {
                check(name + " isWrite", def.isWrite);
                check(name + " needsConfirm", def.needsConfirm);
            }
        }
        check("full registry size=28", reg.size() == 28);
    }

    private static void testConfirmGateInvoked() {
        AtomicInteger gateCalls = new AtomicInteger();
        AtomicBoolean executed = new AtomicBoolean(false);
        ToolRegistry reg = new ToolRegistry();
        reg.register(writeTool("my_write", () -> executed.set(true)));
        reg.setConfirmGate((name, args) -> {
            gateCalls.incrementAndGet();
            return true;
        });

        ToolResult r = reg.execute("my_write", new JSONObject());
        check("gate invoked", gateCalls.get() == 1);
        check("executor ran", executed.get() && r.success);
    }

    private static void testConfirmGateReject() {
        AtomicBoolean executed = new AtomicBoolean(false);
        ToolRegistry reg = new ToolRegistry();
        reg.register(writeTool("my_write", () -> executed.set(true)));
        reg.setConfirmGate((name, args) -> false);  // 拒绝

        ToolResult r = reg.execute("my_write", new JSONObject());
        check("reject: not success", !r.success);
        check("reject: message", r.error != null && r.error.contains("拒绝"));
        check("reject: executor NOT run", !executed.get());
    }

    private static void testConfirmGateApprove() {
        AtomicBoolean executed = new AtomicBoolean(false);
        ToolRegistry reg = new ToolRegistry();
        reg.register(writeTool("my_write", () -> executed.set(true)));
        reg.setConfirmGate((name, args) -> true);  // 批准

        ToolResult r = reg.execute("my_write", new JSONObject());
        check("approve: success", r.success);
        check("approve: executor run", executed.get());
    }

    private static void testNoopGatePassThrough() {
        AtomicBoolean executed = new AtomicBoolean(false);
        ToolRegistry reg = new ToolRegistry();
        reg.register(writeTool("my_write", () -> executed.set(true)));
        // 默认 NOOP 门

        ToolResult r = reg.execute("my_write", new JSONObject());
        check("noop gate: success", r.success);
        check("noop gate: executor run", executed.get());
    }

    private static void testReadToolsNoGate() {
        AtomicInteger gateCalls = new AtomicInteger();
        ToolRegistry reg = new ToolRegistry();
        reg.register(readTool("read_only"));
        reg.setConfirmGate((name, args) -> {
            gateCalls.incrementAndGet();
            return true;
        });

        ToolResult r = reg.execute("read_only", new JSONObject());
        check("read tool: success", r.success);
        check("read tool: gate NOT invoked", gateCalls.get() == 0);
    }

    // ---------- T3.3 RAG/AI 工具 ----------

    private static void testRagAiToolsRegistered() {
        DocSysClient client = new DocSysClient("http://localhost:9999");
        ToolRegistry reg = DocSysToolFactory.createReadOnlyRegistry(client);

        ToolDefinition rag = reg.find("rag_chat");
        check("rag_chat registered", rag != null);
        if (rag != null) {
            check("rag_chat not write", !rag.isWrite && !rag.needsConfirm);
            check("rag_chat has query param", rag.parameters != null
                    && rag.parameters.getJSONObject("properties").containsKey("query"));
        }

        ToolDefinition ai = reg.find("ai_chat");
        check("ai_chat NOT registered by default (redundant w/ LLMService)", ai == null);
    }

    // ---------- 辅助 ----------

    private static ToolDefinition writeTool(String name, Runnable executor) {
        return ToolDefinition.builder(name, "write tool", args -> {
            executor.run();
            return ToolResult.ok("ok");
        }).isWrite(true).needsConfirm(true).build();
    }

    private static ToolDefinition readTool(String name) {
        return ToolDefinition.builder(name, "read tool", args -> ToolResult.ok("ok")).build();
    }
}
