package com.DocSystem.agent.tool;

import com.DocSystem.agent.attachment.AgentAttachmentSupport;
import com.alibaba.fastjson.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;

/**
 * P2 护栏：attachment 工具（读取本轮用户上传的临时附件）。
 * 纯 Java 自包含测试（main 入口），只写系统临时目录，不碰仓库、不依赖 Spring。
 */
public class TestAttachmentTool {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("toolUser", "toolSession", true);
        try {
            ToolDefinition tool = DocSysToolFactory.attachment(dir);

            // 1) list：空目录
            ToolResult empty = tool.executor.execute(args("action", "list"));
            check("list empty ok", empty.success && empty.summary != null && empty.summary.contains("没有上传附件"));

            // 2) 准备两个附件
            writeFile(new File(dir, "需求.md"), "# 需求\n内容A");
            writeFile(new File(dir, "图.png"), "PNGDATA");

            ToolResult list = tool.executor.execute(args("action", "list"));
            check("list has both", list.success && list.summary.contains("需求.md") && list.summary.contains("图.png"));
            check("list hints read", list.summary.contains("attachment(action="));

            // 3) read 文本
            ToolResult readText = tool.executor.execute(args("action", "read", "name", "需求.md"));
            check("read text ok", readText.success && readText.summary.contains("内容A"));
            check("read text meta", readText.summary.contains("text/plain"));

            // 4) read 图片：只给元信息，不给内容
            ToolResult readImg = tool.executor.execute(args("action", "read", "name", "图.png"));
            check("read image meta only", readImg.success && readImg.summary.contains("image/png")
                    && !readImg.summary.contains("PNGDATA"));

            // 5) 不存在的附件 / 穿越尝试 / 非法 action
            ToolResult missing = tool.executor.execute(args("action", "read", "name", "nope.md"));
            check("read missing -> error", !missing.success);
            ToolResult traversal = tool.executor.execute(args("action", "read", "name", "../../etc/passwd"));
            check("read traversal blocked", !traversal.success);
            ToolResult badAction = tool.executor.execute(args("action", "delete"));
            check("bad action -> error", !badAction.success);

            // 6) action 缺省 = list
            ToolResult defaulted = tool.executor.execute(new JSONObject());
            check("default action = list", defaulted.success && defaulted.summary.contains("需求.md"));

            // 7) 目录为 null 时返回“无附件”而不炸
            ToolResult nullDir = DocSysToolFactory.attachment(null).executor.execute(args("action", "list"));
            check("null dir safe", nullDir.success && nullDir.summary.contains("没有上传附件"));

            // 8) 工具元信息
            check("tool name/desc", "attachment".equals(tool.name)
                    && tool.description != null && tool.description.contains("临时附件"));
            check("tool not write", !tool.isWrite);
            check("tool needs action param", tool.parameters != null
                    && tool.parameters.toJSONString().contains("\"action\""));
        } finally {
            AgentAttachmentSupport.deleteRecursively(dir);
        }

        System.out.println("\n======== TestAttachmentTool: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static JSONObject args(String... kv) {
        JSONObject o = new JSONObject();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            o.put(kv[i], kv[i + 1]);
        }
        return o;
    }

    private static void writeFile(File f, String content) throws Exception {
        Writer w = new OutputStreamWriter(new FileOutputStream(f), Charset.forName("UTF-8"));
        try {
            w.write(content);
        } finally {
            w.close();
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
}
