package com.DocSystem.common;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextBox;
import org.apache.poi.xslf.usermodel.XSLFTextParagraph;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * Office **写入**引擎（P2，方案 1：POI）。
 *
 * <p><b>职责边界</b>（用户 2026-09-23 裁定）：只做 `docx/xlsx/pptx`；老格式（.doc/.ppt）不写
 * ——各厂家写入一律用新格式，性能更好、架构更简单。本类只负责"把 spec 变成文件字节"，
 * 落盘 / 锁 / 版本提交 / 权限由服务端既有写链路负责（{@code DocController.agentWriteOffice.do}）。</p>
 *
 * <p><b>为什么放在 common</b>：与 {@link OfficeExtract}（读）对称，便于被服务端与护栏共用；
 * 不依赖 Spring。</p>
 *
 * <p>spec 结构（三种类型）：</p>
 * <pre>
 * docx: {"paragraphs":[{"text":"标题","style":"Title"},{"text":"正文"}, "纯字符串也行"]}
 * xlsx: {"sheet":"Sheet1","rows":[["名称","数量"],["苹果",3]]}
 * pptx: {"slides":[{"title":"标题","bullets":["要点1","要点2"]}]}
 * </pre>
 */
public class OfficeDocWriter {

    /** 支持写入的后缀（与裁定一致：只新格式） */
    public static final String[] SUPPORTED_EXT = {"docx", "xlsx", "pptx"};

    /** 规模上限（防止一次写入不可控的大文件） */
    public static final int MAX_PARAGRAPHS = 2000;
    public static final int MAX_ROWS = 5000;
    public static final int MAX_COLS = 100;
    public static final int MAX_SHEETS = 20;
    public static final int MAX_SLIDES = 200;
    public static final int MAX_TEXT_CHARS = 200000;
    /** 产出字节上限（10MB） */
    public static final int MAX_BYTES = 10 * 1024 * 1024;

    /** 写入结果：data 非空即成功 */
    public static class Result {
        public byte[] data;
        public String errorCode;
        public String message;
        public List<String> parts = new ArrayList<String>();

        public boolean ok() {
            return data != null;
        }

        static Result fail(String errorCode, String message) {
            Result r = new Result();
            r.errorCode = errorCode;
            r.message = message;
            return r;
        }

        static Result success(byte[] data) {
            Result r = new Result();
            r.data = data;
            return r;
        }
    }

    /** 后缀是否支持写入 */
    public static boolean isSupportedExt(String ext) {
        if (ext == null) {
            return false;
        }
        String e = ext.toLowerCase();
        for (String s : SUPPORTED_EXT) {
            if (s.equals(e)) {
                return true;
            }
        }
        return false;
    }

    /** 支持清单文案（工具描述与错误信息共用） */
    public static String supportedHint() {
        return "docx/xlsx/pptx";
    }

    /**
     * 按 spec 生成一个新的 Office 文件。
     *
     * @param ext  后缀（docx/xlsx/pptx，大小写不敏感）
     * @param spec 内容描述（见类注释）
     * @return 成功时 {@link Result#data} 为完整文件字节
     */
    public static Result create(String ext, JSONObject spec) {
        if (!isSupportedExt(ext)) {
            return Result.fail(ErrorCode.INVALID_PARAM,
                    "不支持的写入格式：" + ext + "（当前支持 " + supportedHint() + "）");
        }
        if (spec == null) {
            spec = new JSONObject();
        }
        String e = ext.toLowerCase();
        try {
            if ("docx".equals(e)) {
                return createDocx(spec);
            }
            if ("xlsx".equals(e)) {
                return createXlsx(spec);
            }
            return createPptx(spec);
        } catch (Exception ex) {
            Log.info(ex);
            return Result.fail(ErrorCode.INTERNAL, "生成 " + e + " 失败：" + ex);
        }
    }

    // ==================== docx ====================

    private static Result createDocx(JSONObject spec) throws Exception {
        JSONArray paragraphs = spec.getJSONArray("paragraphs");
        if (paragraphs == null || paragraphs.isEmpty()) {
            return Result.fail(ErrorCode.INVALID_PARAM, "docx 需要 paragraphs（段落数组，非空）");
        }
        if (paragraphs.size() > MAX_PARAGRAPHS) {
            return Result.fail(ErrorCode.INVALID_PARAM, "段落数超过上限 " + MAX_PARAGRAPHS);
        }

        int totalChars = 0;
        XWPFDocument doc = new XWPFDocument();
        try {
            for (int i = 0; i < paragraphs.size(); i++) {
                Object item = paragraphs.get(i);
                String text;
                String style = null;
                if (item instanceof JSONObject) {
                    JSONObject o = (JSONObject) item;
                    text = o.getString("text");
                    style = o.getString("style");
                } else {
                    text = (item == null) ? null : String.valueOf(item);
                }
                if (text == null) {
                    text = "";
                }
                totalChars += text.length();
                if (totalChars > MAX_TEXT_CHARS) {
                    return Result.fail(ErrorCode.INVALID_PARAM, "文本总量超过上限 " + MAX_TEXT_CHARS + " 字");
                }
                XWPFParagraph p = doc.createParagraph();
                if (style != null && !style.trim().isEmpty()) {
                    p.setStyle(style.trim());
                }
                XWPFRun run = p.createRun();
                //按行拆 run，保留换行（POI 不会自动换行）
                String[] lines = text.split("\n", -1);
                for (int li = 0; li < lines.length; li++) {
                    if (li > 0) {
                        run.addBreak();
                    }
                    run.setText(lines[li]);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            Result r = Result.success(out.toByteArray());
            r.parts.add("word/document.xml");
            return r;
        } finally {
            doc.close();
        }
    }

    // ==================== xlsx ====================

    private static Result createXlsx(JSONObject spec) throws Exception {
        JSONArray rows = spec.getJSONArray("rows");
        if (rows == null || rows.isEmpty()) {
            return Result.fail(ErrorCode.INVALID_PARAM, "xlsx 需要 rows（二维数组，非空）");
        }
        String sheetName = spec.getString("sheet");
        if (sheetName == null || sheetName.trim().isEmpty()) {
            sheetName = "Sheet1";
        }
        if (rows.size() > MAX_ROWS) {
            return Result.fail(ErrorCode.INVALID_PARAM, "行数超过上限 " + MAX_ROWS);
        }

        XSSFWorkbook wb = new XSSFWorkbook();
        try {
            XSSFSheet sheet = wb.createSheet(sheetName.trim());
            int totalChars = 0;
            for (int ri = 0; ri < rows.size(); ri++) {
                Object rowObj = rows.get(ri);
                if (!(rowObj instanceof JSONArray)) {
                    return Result.fail(ErrorCode.INVALID_PARAM, "第 " + (ri + 1) + " 行不是数组");
                }
                JSONArray cells = (JSONArray) rowObj;
                if (cells.size() > MAX_COLS) {
                    return Result.fail(ErrorCode.INVALID_PARAM, "第 " + (ri + 1) + " 行列数超过上限 " + MAX_COLS);
                }
                XSSFRow row = sheet.createRow(ri);
                for (int ci = 0; ci < cells.size(); ci++) {
                    Object v = cells.get(ci);
                    XSSFCell cell = row.createCell(ci);
                    if (v == null) {
                        continue;
                    }
                    if (v instanceof Number) {
                        cell.setCellValue(((Number) v).doubleValue());
                    } else if (v instanceof Boolean) {
                        cell.setCellValue(((Boolean) v).booleanValue());
                    } else {
                        String s = String.valueOf(v);
                        totalChars += s.length();
                        if (totalChars > MAX_TEXT_CHARS) {
                            return Result.fail(ErrorCode.INVALID_PARAM,
                                    "文本总量超过上限 " + MAX_TEXT_CHARS + " 字");
                        }
                        cell.setCellValue(s);
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            Result r = Result.success(out.toByteArray());
            r.parts.add("xl/worksheets/sheet1.xml");
            return r;
        } finally {
            wb.close();
        }
    }

    // ==================== pptx ====================

    private static Result createPptx(JSONObject spec) throws Exception {
        JSONArray slides = spec.getJSONArray("slides");
        if (slides == null || slides.isEmpty()) {
            return Result.fail(ErrorCode.INVALID_PARAM, "pptx 需要 slides（幻灯片数组，非空）");
        }
        if (slides.size() > MAX_SLIDES) {
            return Result.fail(ErrorCode.INVALID_PARAM, "幻灯片数超过上限 " + MAX_SLIDES);
        }

        XMLSlideShow ppt = new XMLSlideShow();
        try {
            int totalChars = 0;
            for (int i = 0; i < slides.size(); i++) {
                Object item = slides.get(i);
                JSONObject o = (item instanceof JSONObject) ? (JSONObject) item : new JSONObject();
                String title = o.getString("title");
                JSONArray bullets = o.getJSONArray("bullets");

                XSLFSlide slide = ppt.createSlide();
                int y = 40;
                if (title != null && !title.trim().isEmpty()) {
                    totalChars += title.length();
                    XSLFTextBox tb = slide.createTextBox();
                    tb.setAnchor(new java.awt.Rectangle(40, y, 640, 60));
                    XSLFTextParagraph p = tb.addNewTextParagraph();
                    p.addNewTextRun().setText(title.trim());
                    y += 70;
                }
                if (bullets != null && !bullets.isEmpty()) {
                    XSLFTextBox body = slide.createTextBox();
                    body.setAnchor(new java.awt.Rectangle(40, y, 640, 400));
                    for (int bi = 0; bi < bullets.size(); bi++) {
                        Object b = bullets.get(bi);
                        String text = (b == null) ? "" : String.valueOf(b);
                        totalChars += text.length();
                        XSLFTextParagraph p = body.addNewTextParagraph();
                        p.setBullet(true);
                        p.addNewTextRun().setText(text);
                    }
                }
                if (totalChars > MAX_TEXT_CHARS) {
                    return Result.fail(ErrorCode.INVALID_PARAM, "文本总量超过上限 " + MAX_TEXT_CHARS + " 字");
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ppt.write(out);
            Result r = Result.success(out.toByteArray());
            r.parts.add("ppt/slides/*");
            return r;
        } finally {
            ppt.close();
        }
    }

    /**
     * 产出字节是否是该格式的**有效 OOXML 包**：文件头必须是 zip，且包内顶层目录能认出类型
     * （{@link FileUtil#detectOoxmlFormat}，**不做后缀兜底**）。供服务端落盘前自检——
     * “文件头是 PK”不等于“是个合法 docx”。
     */
    public static boolean looksValid(byte[] data, String ext) {
        if (data == null || data.length < 4) {
            return false;
        }
        //先看文件头，避免为垃圾字节白落一次临时文件
        if (!((data[0] & 0xFF) == 0x50 && (data[1] & 0xFF) == 0x4B
                && (data[2] & 0xFF) == 0x03 && (data[3] & 0xFF) == 0x04)) {
            return false;
        }
        java.io.File tmp = null;
        try {
            tmp = java.io.File.createTempFile("officedocwrite", "." + ext);
            FileUtil.saveDataToFile(data, tmp.getAbsolutePath());
            return ext != null && ext.equalsIgnoreCase(FileUtil.detectOoxmlFormat(tmp.getAbsolutePath()));
        } catch (Exception e) {
            Log.info(e);
            return false;
        } finally {
            if (tmp != null) {
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
            }
        }
    }

    /** 供探针/护栏用：把 POI 生成的字节放回 POI 读一遍（结构自检） */
    public static String readBackText(byte[] data, String ext) throws Exception {
        ByteArrayInputStream in = new ByteArrayInputStream(data);
        try {
            if ("docx".equalsIgnoreCase(ext)) {
                XWPFDocument d = new XWPFDocument(in);
                try {
                    StringBuilder sb = new StringBuilder();
                    for (XWPFParagraph p : d.getParagraphs()) {
                        sb.append(p.getText()).append('\n');
                    }
                    return sb.toString();
                } finally {
                    d.close();
                }
            }
            if ("xlsx".equalsIgnoreCase(ext)) {
                XSSFWorkbook wb = new XSSFWorkbook(in);
                try {
                    StringBuilder sb = new StringBuilder();
                    XSSFSheet sh = wb.getSheetAt(0);
                    for (int ri = 0; ri <= sh.getLastRowNum(); ri++) {
                        XSSFRow row = sh.getRow(ri);
                        if (row == null) {
                            continue;
                        }
                        for (int ci = 0; ci < row.getLastCellNum(); ci++) {
                            XSSFCell c = row.getCell(ci);
                            sb.append(c == null ? "" : cellText(c)).append(ci + 1 == row.getLastCellNum() ? '\n' : '\t');
                        }
                    }
                    return sb.toString();
                } finally {
                    wb.close();
                }
            }
            XMLSlideShow ppt = new XMLSlideShow(in);
            try {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < ppt.getSlides().size(); i++) {
                    for (org.apache.poi.xslf.usermodel.XSLFShape sh : ppt.getSlides().get(i).getShapes()) {
                        if (sh instanceof org.apache.poi.xslf.usermodel.XSLFTextShape) {
                            String t = ((org.apache.poi.xslf.usermodel.XSLFTextShape) sh).getText();
                            if (t != null && !t.trim().isEmpty()) {
                                sb.append(t.replace('\n', ' ')).append('\n');
                            }
                        }
                    }
                }
                return sb.toString();
            } finally {
                ppt.close();
            }
        } finally {
            in.close();
        }
    }

    private static String cellText(XSSFCell c) {
        switch (c.getCellType()) {
            case NUMERIC:
                double v = c.getNumericCellValue();
                return (v == Math.floor(v) && !Double.isInfinite(v)) ? String.valueOf((long) v) : String.valueOf(v);
            case BOOLEAN:
                return String.valueOf(c.getBooleanCellValue());
            case FORMULA:
                return c.getCellFormula();
            default:
                return c.getStringCellValue();
        }
    }
}
