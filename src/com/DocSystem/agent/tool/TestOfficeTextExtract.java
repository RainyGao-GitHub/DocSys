package com.DocSystem.agent.tool;

import java.io.File;
import java.io.FileOutputStream;

import com.DocSystem.common.FileUtil;
import com.DocSystem.common.OfficeExtract;

/**
 * P1 护栏：Office/PDF 的「真实格式判定」与「文本抽取」。
 *
 * <p>被测对象：{@link FileUtil#detectOfficeActualFormat(String, String)}（魔数优先，后缀兜底）与
 * {@link OfficeExtract#extractText(String, String, String)}（生产同款 POI/PDFBox 抽取，直接返回文本）。</p>
 *
 * <p>样本**现场生成**（POI/PDFBox 都在 WEB-INF/lib 里）：不依赖 office 仓库的 fixture，也不碰仓库目录，
 * 只在系统临时目录下活动。核心要证明的两件事：</p>
 * <ul>
 *   <li>WPS 三件套 / 改后缀文件的真实格式按**内容**判定（.wps 里装 docx 会当 docx 读，装 OLE doc 会当 doc 读）；
 *       只按后缀会落进抽取 switch 的空档 → 静默读到空内容（改造前的毛病）。</li>
 *   <li>不支持的格式（odt/rtf 等）明确返回 null，让上层回"暂不支持"而不是假装文件是空的。</li>
 * </ul>
 */
public class TestOfficeTextExtract {

    private static int pass = 0;
    private static int fail = 0;

    private static final File TMP = new File(System.getProperty("java.io.tmpdir"), "docsys_office_text_guard");

    public static void main(String[] args) throws Exception {
        deleteRecursively(TMP);
        if (!TMP.isDirectory() && !TMP.mkdirs()) {
            System.out.println("[FAIL] cannot create tmp dir " + TMP);
            System.exit(1);
        }

        suffixRules();
        magicDetect();
        extractText();
        noLitter();

        System.out.println("\n======== TestOfficeTextExtract: " + pass + " passed, " + fail + " failed ========");
        deleteRecursively(TMP);
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- 1) 后缀规则（csv 归文本；wps/et/dps 仅作后缀映射） ----------

    private static void suffixRules() {
        check("csv is text", FileUtil.isText("csv"));
        check("csv still office-flagged (不可回退)", FileUtil.isOffice("csv"));
        check("isTextFile(csv) true", FileUtil.isTextFile("a.csv"));
        check("wps is not text", !FileUtil.isText("wps"));
        check("wps maps to doc", "doc".equals(FileUtil.convertWpsSuffixToOfficeSuffix("wps")));
        check("et maps to xls", "xls".equals(FileUtil.convertWpsSuffixToOfficeSuffix("et")));
        check("dps maps to ppt", "ppt".equals(FileUtil.convertWpsSuffixToOfficeSuffix("dps")));
        check("unknown suffix untouched", "zip".equals(FileUtil.convertWpsSuffixToOfficeSuffix("zip")));
    }

    // ---------- 2) 魔数判定优先于后缀 ----------

    private static void magicDetect() throws Exception {
        File docx = makeDocx(new File(TMP, "src.docx"), "魔数标记");
        File xlsx = makeXlsx(new File(TMP, "src.xlsx"), "魔数标记");
        File pptx = makePptx(new File(TMP, "src.pptx"), "魔数标记");
        File xls = makeXls(new File(TMP, "src.xls"), "魔数标记");

        check("docx detected", "docx".equals(FileUtil.detectOfficeActualFormat(docx.getPath(), "docx")));
        check("xlsx detected", "xlsx".equals(FileUtil.detectOfficeActualFormat(xlsx.getPath(), "xlsx")));
        check("pptx detected", "pptx".equals(FileUtil.detectOfficeActualFormat(pptx.getPath(), "pptx")));
        check("xls detected", "xls".equals(FileUtil.detectOfficeActualFormat(xls.getPath(), "xls")));

        //WPS 场景：后缀是 wps/et/dps，内容是真 Office
        check("wps holding docx -> docx", "docx".equals(FileUtil.detectOfficeActualFormat(docx.getPath(), "wps")));
        check("et holding xlsx -> xlsx", "xlsx".equals(FileUtil.detectOfficeActualFormat(xlsx.getPath(), "et")));
        check("et holding xls -> xls", "xls".equals(FileUtil.detectOfficeActualFormat(xls.getPath(), "et")));
        check("dps holding pptx -> pptx", "pptx".equals(FileUtil.detectOfficeActualFormat(pptx.getPath(), "dps")));
        check("dps holding pptx (suffix ppt) -> pptx",
                "pptx".equals(FileUtil.detectOfficeActualFormat(pptx.getPath(), "ppt")));

        //后缀兜底：内容判不出来（纯文本/不存在）时按后缀映射
        File txt = new File(TMP, "plain.doc");
        writeFile(txt, "just text, not an OLE/zip package");
        check("unrecognized content -> suffix fallback",
                "doc".equals(FileUtil.detectOfficeActualFormat(txt.getPath(), "wps")));
        check("missing file -> suffix fallback",
                "doc".equals(FileUtil.detectOfficeActualFormat(new File(TMP, "nope.wps").getPath(), "wps")));
        check("null path -> suffix fallback",
                "xls".equals(FileUtil.detectOfficeActualFormat(null, "et")));
    }

    // ---------- 3) 抽取文本（含"不支持"返回 null） ----------

    private static void extractText() throws Exception {
        File docx = makeDocx(new File(TMP, "t.docx"), "文档标记TXT");
        File xlsx = makeXlsx(new File(TMP, "t.xlsx"), "表格标记TXT");
        File pptx = makePptx(new File(TMP, "t.pptx"), "幻灯标记TXT");
        File xls = makeXls(new File(TMP, "t.xls"), "老表标记TXT");
        File pdf = makePdf(new File(TMP, "t.pdf"), "PDF Marker");

        String outDir = new File(TMP, "out").getAbsolutePath();
        new File(outDir).mkdirs();

        checkText("docx extract", docx, "t.docx", outDir, "文档标记TXT");
        checkText("xlsx extract", xlsx, "t.xlsx", outDir, "表格标记TXT");
        checkText("pptx extract", pptx, "t.pptx", outDir, "幻灯标记TXT");
        checkText("xls extract", xls, "t.xls", outDir, "老表标记TXT");
        checkText("pdf extract", pdf, "t.pdf", outDir, "PDF Marker");
        //WPS 后缀 + 真 docx 内容 → 抽取链全程可用
        checkText("wps suffix extract", docx, "报表.wps", outDir, "文档标记TXT");

        //不支持的格式：返回 null（上层据此回"暂不支持"，而不是空内容）
        File odt = new File(TMP, "u.odt");
        writeFile(odt, "not really odt");
        check("odt extract -> null", OfficeExtract.extractText(odt.getPath(), "u.odt", outDir) == null);
        File rtf = new File(TMP, "u.rtf");
        writeFile(rtf, "{\\rtf1 not supported}");
        check("rtf extract -> null", OfficeExtract.extractText(rtf.getPath(), "u.rtf", outDir) == null);
        File broken = new File(TMP, "broken.docx");
        writeFile(broken, "PK but truncated");
        check("broken docx -> null", OfficeExtract.extractText(broken.getPath(), "broken.docx", outDir) == null);
        check("null tmpdir -> null", OfficeExtract.extractText(docx.getPath(), "t.docx", null) == null);
    }

    private static void checkText(String label, File src, String name, String outDir, String marker) {
        String text = OfficeExtract.extractText(src.getPath(), name, outDir);
        check(label, text != null && text.contains(marker));
    }

    // ---------- 4) 抽取不留中间物 ----------

    private static void noLitter() throws Exception {
        File docx = makeDocx(new File(TMP, "litter.docx"), "残留标记");
        String outDir = new File(TMP, "litter").getAbsolutePath();
        new File(outDir).mkdirs();
        OfficeExtract.extractText(docx.getPath(), "litter.docx", outDir);
        String[] left = new File(outDir).list();
        check("no leftover extract file", left == null || left.length == 0);
    }

    // ---------- 样本生成 ----------

    private static File makeDocx(File f, String text) throws Exception {
        org.apache.poi.xwpf.usermodel.XWPFDocument d = new org.apache.poi.xwpf.usermodel.XWPFDocument();
        d.createParagraph().createRun().setText(text);
        FileOutputStream out = new FileOutputStream(f);
        d.write(out);
        out.close();
        d.close();
        return f;
    }

    private static File makeXlsx(File f, String text) throws Exception {
        org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
        wb.createSheet("S").createRow(0).createCell(0).setCellValue(text);
        FileOutputStream out = new FileOutputStream(f);
        wb.write(out);
        out.close();
        wb.close();
        return f;
    }

    private static File makePptx(File f, String text) throws Exception {
        org.apache.poi.xslf.usermodel.XMLSlideShow ppt = new org.apache.poi.xslf.usermodel.XMLSlideShow();
        org.apache.poi.xslf.usermodel.XSLFTextBox tb = ppt.createSlide().createTextBox();
        tb.setAnchor(new java.awt.Rectangle(20, 20, 300, 60));
        tb.setText(text);
        FileOutputStream out = new FileOutputStream(f);
        ppt.write(out);
        out.close();
        ppt.close();
        return f;
    }

    private static File makeXls(File f, String text) throws Exception {
        org.apache.poi.hssf.usermodel.HSSFWorkbook wb = new org.apache.poi.hssf.usermodel.HSSFWorkbook();
        wb.createSheet("S").createRow(0).createCell(0).setCellValue(text);
        FileOutputStream out = new FileOutputStream(f);
        wb.write(out);
        out.close();
        wb.close();
        return f;
    }

    private static File makePdf(File f, String text) throws Exception {
        org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument();
        org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
        doc.addPage(page);
        org.apache.pdfbox.pdmodel.PDPageContentStream cs =
                new org.apache.pdfbox.pdmodel.PDPageContentStream(doc, page);
        cs.beginText();
        cs.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
        cs.newLineAtOffset(50, 700);
        cs.showText(text);
        cs.endText();
        cs.close();
        doc.save(f);
        doc.close();
        return f;
    }

    // ---------- helpers ----------

    private static void writeFile(File f, String content) throws Exception {
        java.io.Writer w = new java.io.OutputStreamWriter(new FileOutputStream(f),
                java.nio.charset.Charset.forName("UTF-8"));
        try {
            w.write(content);
        } finally {
            w.close();
        }
    }

    private static void deleteRecursively(File f) {
        if (f == null || !f.exists()) {
            return;
        }
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) {
                for (File k : kids) {
                    deleteRecursively(k);
                }
            }
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
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
