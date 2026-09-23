package com.DocSystem.agent.attachment;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
        testOfficeAndPdfExtract();
        testRenderLines();
        testSweep();
        testPurgeSession();
        testImportedFlag();
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
        //P1：WPS 三件套与 ODF/RTF 均归"文档"类（可与图片/普通二进制区分开）
        check("kind doc wps", "doc".equals(AgentAttachmentSupport.kindOf("a.wps")));
        check("kind doc et", "doc".equals(AgentAttachmentSupport.kindOf("a.et")));
        check("kind doc dps", "doc".equals(AgentAttachmentSupport.kindOf("a.dps")));
        check("kind doc odt", "doc".equals(AgentAttachmentSupport.kindOf("a.odt")));
        check("extractable docx", AgentAttachmentSupport.isExtractableForText("a.docx"));
        check("extractable pdf", AgentAttachmentSupport.isExtractableForText("a.pdf"));
        check("extractable wps", AgentAttachmentSupport.isExtractableForText("a.wps"));
        check("odt not extractable", !AgentAttachmentSupport.isExtractableForText("a.odt"));
        check("odt known unsupported", AgentAttachmentSupport.isKnownUnsupportedForText("a.odt"));
        check("rtf known unsupported", AgentAttachmentSupport.isKnownUnsupportedForText("a.rtf"));
        check("zip not known-unsupported", !AgentAttachmentSupport.isKnownUnsupportedForText("a.zip"));
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

    /**
     * P1 新增：Office/PDF 附件抽取。
     *
     * <p>用 POI/PDFBox **现场生成**样本（不依赖 office 仓库的 fixture），验证四件事：
     * ① docx/xls/pdf 能读出内容；② ".wps/.et"（内容与后缀不符）按魔数归一化后照样能读——
     * 这正是"WPS 文件其实就是 Office 格式换后缀"的证据；③ GBK 文本附件不乱码；
     * ④ odt 这种 Office 族但不支持的格式给**明确原因**（而不是笼统一句"不是纯文本"）。</p>
     */
    private static void testOfficeAndPdfExtract() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("uOffice", "sess-office", true);

        //docx
        File docx = new File(dir, "报告.docx");
        org.apache.poi.xwpf.usermodel.XWPFDocument d = new org.apache.poi.xwpf.usermodel.XWPFDocument();
        d.createParagraph().createRun().setText("附件抽取标记：中文内容ABC");
        FileOutputStream docxOut = new FileOutputStream(docx);
        d.write(docxOut);
        docxOut.close();
        d.close();
        AgentAttachmentSupport.ReadResult r = AgentAttachmentSupport.readForTool(docx, "报告.docx");
        check("docx attachment -> text", r != null && "text".equals(r.kind)
                && r.content != null && r.content.contains("附件抽取标记"));
        check("docx attachment meta says extracted", r.meta.contains("已抽取为纯文本"));

        //wps：内容其实是 docx（WPS 文件 = Office 格式换后缀）
        File wps = new File(dir, "旧文书.wps");
        copyFile(docx, wps);
        AgentAttachmentSupport.ReadResult rw = AgentAttachmentSupport.readForTool(wps, "旧文书.wps");
        check("wps(docx content) -> text by magic", rw != null && "text".equals(rw.kind)
                && rw.content != null && rw.content.contains("附件抽取标记"));

        //et：内容其实是 OLE 老 xls
        File xls = new File(dir, "台账.xls");
        org.apache.poi.hssf.usermodel.HSSFWorkbook wb = new org.apache.poi.hssf.usermodel.HSSFWorkbook();
        wb.createSheet("S").createRow(0).createCell(0).setCellValue("台账标记");
        FileOutputStream xlsOut = new FileOutputStream(xls);
        wb.write(xlsOut);
        xlsOut.close();
        wb.close();
        File et = new File(dir, "台账.et");
        copyFile(xls, et);
        AgentAttachmentSupport.ReadResult re = AgentAttachmentSupport.readForTool(et, "台账.et");
        check("et(xls content) -> text by magic", re != null && "text".equals(re.kind)
                && re.content != null && re.content.contains("台账标记"));

        //pdf
        File pdf = new File(dir, "说明.pdf");
        org.apache.pdfbox.pdmodel.PDDocument pd = new org.apache.pdfbox.pdmodel.PDDocument();
        org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
        pd.addPage(page);
        org.apache.pdfbox.pdmodel.PDPageContentStream cs =
                new org.apache.pdfbox.pdmodel.PDPageContentStream(pd, page);
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
        cs.newLineAtOffset(50, 700);
        cs.showText("PDF Extract Marker");
        cs.endText();
        cs.close();
        pd.save(pdf);
        pd.close();
        AgentAttachmentSupport.ReadResult rp = AgentAttachmentSupport.readForTool(pdf, "说明.pdf");
        check("pdf attachment -> text", rp != null && "text".equals(rp.kind)
                && rp.content != null && rp.content.contains("PDF Extract Marker"));

        //GBK 文本附件（改造前一律 UTF-8 读 → 乱码）
        File gbk = new File(dir, "gbk.csv");
        Writer gw = new OutputStreamWriter(new FileOutputStream(gbk), Charset.forName("GBK"));
        gw.write("姓名,金额\n张三,100\n");
        gw.close();
        AgentAttachmentSupport.ReadResult rg = AgentAttachmentSupport.readForTool(gbk, "gbk.csv");
        check("gbk text decoded", rg != null && "text".equals(rg.kind)
                && rg.content != null && rg.content.contains("张三"));

        //utf-8 文本附件仍按 UTF-8 读（不能被字符集探测误判为 GBK）
        File utf8 = new File(dir, "utf8.csv");
        writeFile(utf8, "名称,值\n苹果,3\n");
        AgentAttachmentSupport.ReadResult ru = AgentAttachmentSupport.readForTool(utf8, "utf8.csv");
        check("utf8 text still correct", ru != null && "text".equals(ru.kind)
                && ru.content != null && ru.content.contains("苹果"));

        //odt：Office 族但本期不支持 → 明确原因
        File odt = new File(dir, "样文.odt");
        writeFile(odt, "not really odt");
        AgentAttachmentSupport.ReadResult ro = AgentAttachmentSupport.readForTool(odt, "样文.odt");
        check("odt -> explicit unsupported reason", ro != null && "binary".equals(ro.kind)
                && ro.content == null && ro.meta.contains("暂不支持文本提取"));
        check("odt reason lists supported formats", ro.meta.contains("docx"));

        //图片仍不给内容（不臆造）
        File png = new File(dir, "p.png");
        writeFile(png, "PNGDATA");
        AgentAttachmentSupport.ReadResult ri = AgentAttachmentSupport.readForTool(png, "p.png");
        check("image still meta only", "binary".equals(ri.kind) && ri.content == null);

        AgentAttachmentSupport.deleteRecursively(dir);
    }

    private static void copyFile(File src, File dst) throws Exception {
        java.io.InputStream in = new java.io.FileInputStream(src);
        java.io.OutputStream out = new FileOutputStream(dst);
        try {
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) {
                out.write(b, 0, n);
            }
        } finally {
            in.close();
            out.close();
        }
    }

    private static void testRenderLines() {
        check("render empty", "".equals(AgentAttachmentSupport.renderLines(null)));
        check("render empty list", "".equals(AgentAttachmentSupport.renderLines(new ArrayList<AgentAttachmentSupport.Item>())));

        List<AgentAttachmentSupport.Item> items = new ArrayList<AgentAttachmentSupport.Item>();
        items.add(new AgentAttachmentSupport.Item("a.txt", "a.txt", 1024));
        items.add(new AgentAttachmentSupport.Item("p.png", "p.png", 2048));
        items.add(new AgentAttachmentSupport.Item("d.pdf", "d.pdf", 4096));
        items.add(new AgentAttachmentSupport.Item("u.odt", "u.odt", 5120));
        String lines = AgentAttachmentSupport.renderLines(items);
        check("render lines not head", !lines.contains("【本轮附件】"));
        check("render text line", lines.contains("1. 文本「a.txt」(1.0 KB, 文本，可用 attachment 工具读取内容)"));
        check("render image line", lines.contains("图片「p.png」(2.0 KB, image/png：图片，当前模型无视觉能力，不要臆造图片内容)"));
        check("render doc line says extractable", lines.contains("3. 文档「d.pdf」(4.0 KB, application/pdf：文档/PDF，可用 attachment 工具读取（返回抽取的纯文本，无版式与图片）)"));
        check("render unsupported line", lines.contains("4. 文档「u.odt」(5.0 KB, application/octet-stream：该格式暂不支持文本提取，只能看到元信息)"));
        check("render default is no-vision", lines.contains("无视觉能力"));

        // 多模态预备：图片行文案按「本轮图片是否对模型可见」分支（其余行不受影响）
        String visionLines = AgentAttachmentSupport.renderLines(items, true);
        check("render vision image line", visionLines.contains(
                "图片「p.png」(2.0 KB, image/png：图片，本轮图片内容已可查看（多模态），不要臆造未提供的信息)"));
        check("render vision drops no-vision wording", !visionLines.contains("无视觉能力"));
        check("render vision keeps text line",
                visionLines.contains("1. 文本「a.txt」(1.0 KB, 文本，可用 attachment 工具读取内容)"));
        check("render vision keeps doc line",
                visionLines.contains("3. 文档「d.pdf」(4.0 KB, application/pdf：文档/PDF，可用 attachment 工具读取（返回抽取的纯文本，无版式与图片）)"));
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

    /**
     * 已入库标记（旁车文件）：一个附件只能入库一次；标记要能被 listItems 带出，且旁车文件不能被当成附件。
     * AgentController 用它给 chip 显示「✓ 已入库」并拒绝重复入库。
     */
    private static void testImportedFlag() throws Exception {
        File dir = AgentAttachmentSupport.sessionDir("uImp", "sess-imp", true);
        writeFile(new File(dir, "a.txt"), "a");
        writeFile(new File(dir, "b.txt"), "b");

        check("not imported by default", !AgentAttachmentSupport.isImported(dir, "a.txt")
                && AgentAttachmentSupport.readImported(dir).isEmpty());
        check("mark imported", AgentAttachmentSupport.markImported(dir, "a.txt"));
        check("is imported", AgentAttachmentSupport.isImported(dir, "a.txt"));
        check("other attachment unaffected", !AgentAttachmentSupport.isImported(dir, "b.txt"));
        check("mark is idempotent", !AgentAttachmentSupport.markImported(dir, "a.txt")
                && AgentAttachmentSupport.readImported(dir).size() == 1);
        // 附件被移除时要能取消标记（否则同名文件重新上传会被误判为已入库）
        check("unmark imported", AgentAttachmentSupport.unmarkImported(dir, "a.txt")
                && !AgentAttachmentSupport.isImported(dir, "a.txt"));
        check("unmark is idempotent", !AgentAttachmentSupport.unmarkImported(dir, "a.txt"));
        check("mark again after unmark", AgentAttachmentSupport.markImported(dir, "a.txt"));

        List<AgentAttachmentSupport.Item> items = AgentAttachmentSupport.listItems(dir);
        check("listItems carries imported flag", items.size() == 2
                && items.get(0).imported && !items.get(1).imported);
        check("sidecar is not an attachment", items.size() == 2
                && !items.get(0).name.startsWith(".") && !items.get(1).name.startsWith("."));
        check("sidecar not resolvable",
                AgentAttachmentSupport.resolve(dir, AgentAttachmentSupport.IMPORTED_FILE) == null);
        check("hidden name stripped", "env".equals(AgentAttachmentSupport.sanitizeName(".env")));
        check("null id rejected", !AgentAttachmentSupport.markImported(dir, null)
                && !AgentAttachmentSupport.isImported(dir, null));

        // 空白/损坏的标记文件不应影响附件本身；重新标记要能自愈
        writeFile(new File(dir, AgentAttachmentSupport.IMPORTED_FILE), "\n\n");
        check("blank sidecar -> not imported", !AgentAttachmentSupport.isImported(dir, "a.txt"));
        check("blank sidecar -> still lists attachments", AgentAttachmentSupport.listItems(dir).size() == 2);
        check("re-mark after damage", AgentAttachmentSupport.markImported(dir, "a.txt")
                && AgentAttachmentSupport.isImported(dir, "a.txt"));

        AgentAttachmentSupport.deleteRecursively(dir);
        check("imported flag cleanup", !dir.exists());
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
