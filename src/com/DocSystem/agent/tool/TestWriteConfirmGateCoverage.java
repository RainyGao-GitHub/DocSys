package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * R3-2 批 2 护栏：**"声明了 needsConfirm 的写工具必须真的弹确认"**。
 *
 * <p>由来（2026-09-20 页面 E2E 抓到的安全缺陷）：一句"新建文件 + 读回 + 写备注 + 删除"
 * 全程**只弹了 1 次确认框**（只有 delete_doc）。根因不在工具定义，而在确认门：
 * <pre>
 * AuditWriteConfirmGate.confirm() → createPendingEntry() → isWriteOperation(名字)
 *   isWriteOperation 是早期用 **skill 名字子串** 拼的启发式：
 *   contains("delete"/"add_"/"create_"/"upload"/"backup"/"restore"/"wipe"/"rename"/"move_"/"copy_")
 *   → write_file / write_note / update_repos / run_skill 一个都不命中
 *   → createPendingEntry 返回 null → 门内 `return true`（静默放行！）
 * </pre>
 * 即：工具声明了 needsConfirm，但用户既看不到确认框，也没有审计记录。
 *
 * <p>本护栏两条锁：
 * <ol>
 *   <li><b>数据驱动</b>：注册表里**每个** needsConfirm=true 的工具名，
 *       `AuditLogService.isWriteOperation(name)` 必须为 true（防白名单与工具集脱节）；</li>
 *   <li><b>结构锁</b>：确认门必须用 force 入口（`..., true)`），且**不得**在拿不到 token 时 `return true`。</li>
 * </ol>
 */
public class TestWriteConfirmGateCoverage {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testWhitelistCoversAllWriteTools();
        testGateStructure();
        System.out.println("\n======== TestWriteConfirmGateCoverage: " + pass + " passed, " + fail
                + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
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

    /** ① 审计白名单必须覆盖全部 needsConfirm 工具（isWriteOperation 是纯名字函数，可离线跑） */
    private static void testWhitelistCoversAllWriteTools() throws Exception {
        com.DocSystem.agent.controller.AuditLogService audit;
        try {
            audit = new com.DocSystem.agent.controller.AuditLogService();
        } catch (Throwable t) {
            check("能离线构造 AuditLogService（lint 前置）", false, String.valueOf(t));
            return;
        }
        DocSysClient client = new DocSysClient("http://127.0.0.1:1/DocSystem");
        ToolRegistry reg = DocSysToolFactory.createFullRegistry(client);
        reg.register(DocSysToolFactory.runSkillTool(null, null));

        List<String> missing = new ArrayList<String>();
        int writeTools = 0;
        for (ToolDefinition d : reg.list()) {
            if (!d.needsConfirm) {
                continue;
            }
            writeTools++;
            if (!audit.isWriteOperation(d.name)) {
                missing.add(d.name);
            }
        }
        check("注册表里有写工具（数量 " + writeTools + "）", writeTools >= 10, "count=" + writeTools);
        check("每个 needsConfirm 工具都被 isWriteOperation 收录（曾经漏了 write_file/write_note 等）",
                missing.isEmpty(), "未被收录=" + missing);

        // 反向确认启发式确实会漏（回归价值：这四条正是原缺口）
        check("write_file 现在被收录（原来 false → 不弹确认）", audit.isWriteOperation("write_file"));
        check("write_note 现在被收录", audit.isWriteOperation("write_note"));
        check("update_repos 现在被收录", audit.isWriteOperation("update_repos"));
        check("run_skill 现在被收录", audit.isWriteOperation("run_skill"));
        check("只读工具不被误判为写操作",
                !audit.isWriteOperation("list_docs") && !audit.isWriteOperation("get_doc")
                        && !audit.isWriteOperation("search_files") && !audit.isWriteOperation("list_repos"));
    }

    /** ② 结构锁：确认门不得按名字猜、拿不到 token 不得放行 */
    private static void testGateStructure() {
        String gate = readSource("src/com/DocSystem/agent/tool/AuditWriteConfirmGate.java");
        String audit = readSource("src/com/DocSystem/agent/controller/AuditLogService.java");
        if (gate == null || audit == null) {
            check("能读到确认门与审计服务源码（lint 前置）", false);
            return;
        }
        check("确认门用 force 入口创建审计（..., true)", gate.contains("clientIp, traceId, true)"), gate);
        check("确认门不再把“不在白名单”当成放行（无 `非写操作` 注释分支）",
                !gate.contains("非写操作（isWriteOperation 未收录）→ 不拦截"), gate);
        check("拿不到 token 时拒绝执行（fail-closed）",
                gate.contains("refusing to execute") && gate.contains("return false;"), gate);
        check("确认门不再直接引用 isWriteOperation", !gate.contains("isWriteOperation"), gate);
        check("审计服务保留 force 重载", audit.contains("boolean force"), audit);
        check("审计服务无 force 时仍走名字判断（兼容旧调用方）",
                audit.contains("if (!force && !isWriteOperation(operation))"), audit);
    }

    private static String readSource(String relative) {
        File f = new File(relative);
        if (!f.exists()) {
            f = new File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (Exception e) {
            return null;
        }
        return sb.toString();
    }
}
