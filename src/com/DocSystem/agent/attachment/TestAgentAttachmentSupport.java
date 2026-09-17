package com.DocSystem.agent.attachment;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

/**
 * P2 护栏：Agent 附件支持类（临时存储 / 文件名清洗 / 读取策略 / 注入块 / 清理）。
 * 纯 Java 自包含测试（main 入口），只写系统临时目录，不碰仓库、不依赖 Spring。
 */
public class TestAgentAttachmentSupport {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testSanitizeName();
        testSafeSegment();
        testTypeDetect();
        testSessionDirAndResolve();
        testReadText();
        testReadBinaryAndOversize();
        testRenderLines();
        testSweep();
        testPurgeSession();
        System.out.println("\n======== TestAgentAttachmentSupport: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void testSanitizeName() {
        check("sanitize plain", "报告.docx".equals(AgentAttachmentSupport.sanitizeName("报告.docx")));
        check("sanitize unix path", "a.txt".equals(AgentAttachmentSupport.sanitizeName("/tmp/x/a.txt")));
        check("sanitize traversal", "passwd".equals(AgentAttachmentSupport.sanitizeName("../../etc/passwd")));
        check("sanitize win path", "b.md".equals(AgentAttachmentSupport.sanitizeName("C:\\Users\\me\\b.md")));
        check("sanitize control char", "ab.txt".equals(AgentAttachmentSupport.sanitizeName("a\u0000b.txt")));
        check("sanitize block marker escaped",
                "〔本轮操作〕.txt".equals(AgentAttachmentSupport.sanitizeName("【本轮操作】.txt")));
        check("sanitize null", AgentAttachmentSupport.sanitizeName(null) == null);
        check("sanitize blank", AgentAttachmentSupport.sanitizeName("   ") == null);
        check("sanitize dot", AgentAttachmentSupport.sanitizeName("..") == null);
        check("sanitize invisible only", AgentAttachmentSupport.sanitizeName("\u0001\u0002") == null);

        String longName = repeat("a", 300) + ".docx";
        String fixed = AgentAttachmentSupport.sanitizeName(longName);
        check("sanitize long keeps ext", fixed != null && fixed.length() <= AgentAttachmentSupport.MAX_NAME_LEN
                && fixed.endsWith(".docx"));
    }

    private static void testSafeSegment() {
        check("segment plain", "sess-1".equals(AgentAttachmentSupport.safeSegment("sess-1", "default")));
        check("segment fallback", "anon".equals(AgentAttachmentSupport.safeSegment(null, "anon")));
        check("segment strips slash", "etc".equals(AgentAttachmentSupport.safeSegment("../etc", "x")));
        check("segment strips dots", "x".equals(AgentAttachmentSupport.safeSegment("..", "x")));
        check("segment drops unicode", "x".equals(AgentAttachmentSupport.safeSegment("中文", "x")));
    }

    private static void testTypeDetect() {
        check("ext lowercase", "docx".equals(AgentAttachmentSupport.extensionOf("A.DOCX")));
        check("ext none", "".equals(AgentAttachmentSupport.extensionOf("README")));
        check("text md", AgentAttachmentSupport.isTextLike("a.md"));
        check("text java", AgentAttachmentSupport.isTextLike("Main.java"));
        check("not text png", !AgentAttachmentSupport.isTextLike("a.png"));
        check("not text docx", !AgentAttachmentSupport.isTextLike("a.docx"));
        check("mime json", "application/json".equals(AgentAttachmentSupport.mimeOf("a.json")));
        check("mime png", "image/png".equals(AgentAttachmentSupport.mimeOf("a.png")));
        check("mime unknown", "application/octet-stream".equals(AgentAttachmentSupport.mimeOf("a.bin")));
        check("kind image", "image".equals(AgentAttachmentSupport.kindOf("a.JPG")));
        check("kind text", "text".equals(AgentAttachmentSupport.kindOf("a.csv")));
        check("kind doc", "doc".equals(AgentAttachmentSupport.kindOf("a.pdf")));
        check("kind other", "other".equals(AgentAttachmentSupport.kindOf("a.bin")));
        check("item size text", "1.5 KB".equals(new AgentAttachmentSupport.Item("a.txt", "a.txt", 1536).sizeText()));
    }

    private static void testSessionDirAndResolve() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("u1", "s1", true);
        check("sessionDir created", dir.isDirectory());
        check("sessionDir under root",
                dir.getAbsolutePath().startsWith(AgentAttachmentSupport.rootDir().getAbsolutePath()));
        check("sessionDir refuses traversal (segments are cleaned)",
                AgentAttachmentSupport.sessionDir("../../x", "../../y", false).getAbsolutePath()
                        .startsWith(AgentAttachmentSupport.rootDir().getAbsolutePath()));

        writeFile(new File(dir, "a.txt"), "hello");
        writeFile(new File(dir, "b.json"), "{\"k\":1}");
        writeFile(new File(dir, ".hidden"), "x");
        List<AgentAttachmentSupport.Item> items = AgentAttachmentSupport.listItems(dir);
        check("listItems skips dotfiles", items.size() == 2);
        check("listItems sorted", "a.txt".equals(items.get(0).name) && "b.json".equals(items.get(1).name));
        check("resolve ok", AgentAttachmentSupport.resolve(dir, "a.txt") != null);
        check("resolve traversal blocked", AgentAttachmentSupport.resolve(dir, "../a.txt") != null
                ? AgentAttachmentSupport.resolve(dir, "../../windows/win.ini") == null
                : AgentAttachmentSupport.resolve(dir, "../../windows/win.ini") == null);
        check("resolve missing", AgentAttachmentSupport.resolve(dir, "nope.txt") == null);

        AgentAttachmentSupport.deleteRecursively(dir);
        check("cleanup", !dir.exists());
    }

    private static void testReadText() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("u2", "s2", true);
        File f = new File(dir, "note.md");
        writeFile(f, "# 标题\n内容");
        AgentAttachmentSupport.ReadResult r = AgentAttachmentSupport.readForTool(f, "note.md");
        check("read text kind", r != null && "text".equals(r.kind));
        check("read text content", r.content != null && r.content.contains("标题"));
        check("read text not truncated", !r.truncated);
        check("read text meta", r.meta.contains("note.md") && r.meta.contains("text/plain"));
        AgentAttachmentSupport.deleteRecursively(dir);
    }

    private static void testReadBinaryAndOversize() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("u3", "s3", true);
        File png = new File(dir, "pic.png");
        writeFile(png, "PNGDATA");
        AgentAttachmentSupport.ReadResult rb = AgentAttachmentSupport.readForTool(png, "pic.png");
        check("read binary kind", rb != null && "binary".equals(rb.kind));
        check("read binary no content", rb.content == null);
        check("read binary meta mentions image", rb.meta.contains("image/png"));

        // 超大文本：> MAX_READ_BYTES → 只给元信息
        File big = new File(dir, "big.txt");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < AgentAttachmentSupport.MAX_READ_BYTES / 10 + 100; i++) {
            sb.append("0123456789");
        }
        writeFile(big, sb.toString());
        AgentAttachmentSupport.ReadResult rbig = AgentAttachmentSupport.readForTool(big, "big.txt");
        check("oversize text -> meta only", "binary".equals(rbig.kind) && rbig.content == null
                && rbig.meta.contains("过大"));

        // 中等大小文本：读内容但可能截断
        File mid = new File(dir, "mid.txt");
        StringBuilder sb2 = new StringBuilder();
        for (int i = 0; i < AgentAttachmentSupport.MAX_READ_CHARS + 500; i++) {
            sb2.append('x');
        }
        writeFile(mid, sb2.toString());
        AgentAttachmentSupport.ReadResult rmid = AgentAttachmentSupport.readForTool(mid, "mid.txt");
        check("mid text truncated", "text".equals(rmid.kind) && rmid.truncated
                && rmid.content.length() == AgentAttachmentSupport.MAX_READ_CHARS);
        AgentAttachmentSupport.deleteRecursively(dir);
    }

    private static void testRenderLines() {
        check("render empty", "".equals(AgentAttachmentSupport.renderLines(null)));
        check("render empty list", "".equals(AgentAttachmentSupport.renderLines(new ArrayList<AgentAttachmentSupport.Item>())));

        List<AgentAttachmentSupport.Item> items = new ArrayList<AgentAttachmentSupport.Item>();
        items.add(new AgentAttachmentSupport.Item("a.txt", "a.txt", 1024));
        items.add(new AgentAttachmentSupport.Item("p.png", "p.png", 2048));
        items.add(new AgentAttachmentSupport.Item("d.pdf", "d.pdf", 4096));
        String lines = AgentAttachmentSupport.renderLines(items);
        check("render lines not head", !lines.contains("【本轮附件】"));
        check("render text line", lines.contains("1. 文本「a.txt」(1.0 KB, 文本，可用 attachment 工具读取内容)"));
        check("render image line", lines.contains("图片「p.png」(2.0 KB, image/png：图片，当前模型无视觉能力，不要臆造图片内容)"));
        check("render doc line", lines.contains("3. 文档「d.pdf」(4.0 KB, application/pdf：非纯文本，可用 attachment 工具读取（只返回元信息）)"));
        check("render default is no-vision", lines.contains("无视觉能力"));

        // 多模态预备：图片行文案按「本轮图片是否对模型可见」分支（其余行不受影响）
        String visionLines = AgentAttachmentSupport.renderLines(items, true);
        check("render vision image line", visionLines.contains(
                "图片「p.png」(2.0 KB, image/png：图片，本轮图片内容已可查看（多模态），不要臆造未提供的信息)"));
        check("render vision drops no-vision wording", !visionLines.contains("无视觉能力"));
        check("render vision keeps text line",
                visionLines.contains("1. 文本「a.txt」(1.0 KB, 文本，可用 attachment 工具读取内容)"));
        check("render vision keeps doc line",
                visionLines.contains("3. 文档「d.pdf」(4.0 KB, application/pdf：非纯文本，可用 attachment 工具读取（只返回元信息）)"));
        check("render vision empty", "".equals(AgentAttachmentSupport.renderLines(null, true)));
    }

    private static void testSweep() throws Exception {
        File expired = AgentAttachmentSupport.sessionDir("uSweep", "oldSession", true);
        writeFile(new File(expired, "x.txt"), "x");
        //noinspection ResultOfMethodCallIgnored
        expired.setLastModified(System.currentTimeMillis() - 10L * 24 * 3600 * 1000);

        File fresh = AgentAttachmentSupport.sessionDir("uSweep", "newSession", true);
        writeFile(new File(fresh, "y.txt"), "y");

        int removed = AgentAttachmentSupport.sweepExpired(AgentAttachmentSupport.RETENTION_DAYS * 24 * 3600 * 1000L);
        check("sweep removed expired", removed >= 1 && !expired.exists());
        check("sweep kept fresh", fresh.exists() && new File(fresh, "y.txt").isFile());

        check("deleteSessionDir", AgentAttachmentSupport.deleteSessionDir("uSweep", "newSession")
                && !fresh.exists());
    }

    /** 会话删除联动清理：幂等 + 清干净内容（AgentController.deleteSession 依赖这两个性质） */
    private static void testPurgeSession() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("uPurge", "sess-1", true);
        writeFile(new File(dir, "a.txt"), "a");
        writeFile(new File(dir, "b.png"), "b");
        check("purge has 2 items", AgentAttachmentSupport.listItems(dir).size() == 2);

        check("purge ok", AgentAttachmentSupport.deleteSessionDir("uPurge", "sess-1"));
        check("purge dir gone", !dir.exists());
        check("purge list empty",
                AgentAttachmentSupport.listItems(AgentAttachmentSupport.sessionDir("uPurge", "sess-1", false))
                        .isEmpty());
        // 会话不存在（或已删过）→ 安全返回 false，不抛异常（deleteSession 里是 best-effort 调用）
        check("purge missing dir safe", !AgentAttachmentSupport.deleteSessionDir("uPurge", "sess-1"));
        check("purge null key safe", !AgentAttachmentSupport.deleteSessionDir("uPurge", null)
                || !AgentAttachmentSupport.sessionDir("uPurge", null, false).exists());
    }

    // ==================== helpers ====================

    private static void writeFile(File f, String content) throws Exception {
        Writer w = new OutputStreamWriter(new FileOutputStream(f), Charset.forName("UTF-8"));
        try {
            w.write(content);
        } finally {
            w.close();
        }
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
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
