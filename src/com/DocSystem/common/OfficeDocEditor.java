package com.DocSystem.common;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

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
 * Office **修改已有文件**引擎（P2 阶段二，方案 1：POI）。
 *
 * <p><b>设计口径</b>（用户 2026-09-23 裁定，详见 {@code devDocs/Agent Office读写方案评估.md} §7）——
 * "简单修改" = 只改文字节点，三层保证：</p>
 * <ol>
 *   <li><b>接口面只能表达白名单操作</b>：{@link #supportedOps}，定位用序号/坐标，
 *       模型在参数层面就<b>没法表达</b>"删图表"这类动作；</li>
 *   <li><b>写前预检</b>（{@link #precheck}）：命中图表 / OLE / 内容控件 / 域 / 修订 / 公式 / 批注 → 直接拒绝并说明；</li>
 *   <li><b>写后部件级不变量校验</b>（{@link #verify}）：只有目标部件允许变化（+ 少量可解释的联动部件），
 *       其余部件<b>字节级不变</b>、部件不丢、结构构件计数不变 —— 任一条不过就<b>放弃写入</b>。</li>
 * </ol>
 *
 * <p>与 {@link OfficeDocWriter}（新建）的关系：新建无"保真"问题（无原件可比），本类才有不变量约束。
 * 两者共用"产出字节自检"口径（{@link OfficeDocWriter#looksValid} / {@link OfficeDocWriter#readBackText}）。</p>
 *
 * <p>spec 结构：{@code {"ops":[{...},{...}]}}，ops 按顺序执行、只允许白名单动作：</p>
 * <pre>
 * docx: {"op":"replace_text","paragraph":0,"text":"新标题"}            // 整段替换（保留首个 run 的格式）
 *       {"op":"replace_text","paragraph":2,"find":"旧","replace":"新"}  // 段内替换（全段必须恰好命中 1 次，且不跨 run）
 *       {"op":"append_paragraph","text":"新增段","style":"Title"}       // 追加到正文末尾
 * xlsx: {"op":"set_cell_text","sheet":0,"row":1,"col":1,"value":"新值"}
 *       {"op":"append_table_row","sheet":0,"values":["合计",100]}
 * pptx: {"op":"append_slide","title":"新页","bullets":["要点1","要点2"]}
 * </pre>
 */
public class OfficeDocEditor {

    /** 一次编辑最多多少个操作 */
    public static final int MAX_OPS = 200;
    /** 文本类改动上限（单次操作的新文本长度） */
    public static final int MAX_OP_TEXT_CHARS = 20000;

    /** 各格式的白名单操作 */
    public static final String[] DOCX_OPS = {"replace_text", "append_paragraph"};
    public static final String[] XLSX_OPS = {"set_cell_text", "append_table_row"};
    public static final String[] PPTX_OPS = {"append_slide"};

    /**
     * 允许随目标部件一起变化的"联动部件"（相对 zip 内的部件名，不带前导斜杠）。
     * 这些部件的存在有确定原因，且在 {@link #verify} 里另有计数约束兜底。
     */
    private static final String[] TOLERATED_CHANGED = {
            "docProps/app.xml", "docProps/core.xml",   // POI 保存时可能刷新的元数据
            "xl/sharedStrings.xml",                    // xlsx 字符串走共享串表
            "[Content_Types].xml",                     // 新增部件时必须登记
            "ppt/presentation.xml",                    // pptx 新增页 → 页序表
            "ppt/_rels/presentation.xml.rels"          // pptx 新增页 → 关系
    };
    /** 允许新增的部件（只有 pptx 追加幻灯片会新增部件；xlsx 可能首次出现共享串表） */
    private static final String[] TOLERATED_ADDED = {
            "xl/sharedStrings.xml",
            "ppt/slides/slide[0-9]+\\.xml",
            "ppt/slides/_rels/slide[0-9]+\\.xml\\.rels",
            "ppt/notesSlides/notesSlide[0-9]+\\.xml",
            "ppt/notesSlides/_rels/notesSlide[0-9]+\\.xml\\.rels"
    };

    /**
     * 本次编辑"碰过哪些位置"——用于第 3 层校验里的<b>文本保真比对</b>：
     * 没被操作命中的段落/单元格/幻灯片，文本必须与改前一致（§7 的"抽样比对"做到全量）。
     */
    public static class Touch {
        public List<Integer> replacedParagraphs = new ArrayList<Integer>();
        public int appendedParagraphs = 0;
        public java.util.Set<String> setCells = new java.util.HashSet<String>();
        public java.util.Set<String> appendedRowKeys = new java.util.HashSet<String>();  // 本次追加出来的行，键 "sheet!row"
        public int appendedSlides = 0;
    }

    /** 编辑结果：data 非空即成功 */
    public static class Result {
        public byte[] data;
        public String errorCode;
        public String message;
        /** 执行的操作摘要（回执给模型/用户） */
        public List<String> ops = new ArrayList<String>();
        /** 实际发生变化的部件（写后校验产出） */
        public List<String> changedParts = new ArrayList<String>();
        public List<String> addedParts = new ArrayList<String>();
        public List<String> removedParts = new ArrayList<String>();
        /** 字节变了但**结构骨架与文本完全一致**的部件（目前只会出现在 pptx：POI 保存时会重写既有幻灯片） */
        public List<String> structureOnlyParts = new ArrayList<String>();
        /** 写后 POI 回读文本（截断，供回执与护栏核对） */
        public String textAfter;

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

    /** 该格式支持的操作（空数组 = 不支持修改） */
    public static String[] supportedOps(String ext) {
        if (ext == null) {
            return new String[0];
        }
        if ("docx".equalsIgnoreCase(ext)) {
            return DOCX_OPS;
        }
        if ("xlsx".equalsIgnoreCase(ext)) {
            return XLSX_OPS;
        }
        if ("pptx".equalsIgnoreCase(ext)) {
            return PPTX_OPS;
        }
        return new String[0];
    }

    /** 该格式的白名单操作清单文案（错误信息/工具描述共用） */
    public static String opsHint(String ext) {
        String[] ops = supportedOps(ext);
        if (ops.length == 0) {
            return "该格式不支持修改（当前支持修改：docx replace_text/append_paragraph、"
                    + "xlsx set_cell_text/append_table_row、pptx append_slide）";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ops.length; i++) {
            if (i > 0) {
                sb.append("/");
            }
            sb.append(ops[i]);
        }
        return sb.toString();
    }

    /** 全格式操作总览（工具描述用） */
    public static String allOpsHint() {
        return "docx: replace_text/append_paragraph；xlsx: set_cell_text/append_table_row；pptx: append_slide";
    }

    /**
     * 修改一个已有 Office 文件。
     *
     * @param ext 后缀（docx/xlsx/pptx）
     * @param src 原文件字节
     * @param spec {@code {"ops":[...]}}
     * @return 成功时 {@link Result#data} 为改后字节；失败时 data 为 null（**调用方不得落盘**）
     */
    public static Result edit(String ext, byte[] src, JSONObject spec) {
        if (!OfficeDocWriter.isSupportedExt(ext)) {
            return Result.fail(ErrorCode.INVALID_PARAM,
                    "不支持的修改格式：" + ext + "（当前支持 " + OfficeDocWriter.supportedHint() + "）");
        }
        if (src == null || src.length == 0) {
            return Result.fail(ErrorCode.INVALID_PARAM, "原文件内容为空，无法修改");
        }
        if (!OfficeDocWriter.looksValid(src, ext)) {
            return Result.fail(ErrorCode.INVALID_PARAM,
                    "原文件不是有效的 " + ext + " 包（可能是加密文档或后缀与实际格式不符）");
        }
        JSONArray ops = (spec == null) ? null : spec.getJSONArray("ops");
        if (ops == null || ops.isEmpty()) {
            return Result.fail(ErrorCode.INVALID_PARAM, "缺少 ops（操作数组，非空）");
        }
        if (ops.size() > MAX_OPS) {
            return Result.fail(ErrorCode.INVALID_PARAM, "操作数超过上限 " + MAX_OPS);
        }

        String e = ext.toLowerCase();
        try {
            //第 2 层：写前预检（命中不支持构件 → 直接拒绝，不做任何尝试）
            Result blocked = precheck(src, e);
            if (blocked != null) {
                return blocked;
            }

            List<String> targets = new ArrayList<String>();
            Touch touch = new Touch();
            Result out;
            if ("docx".equals(e)) {
                out = editDocx(src, ops, targets, touch);
            } else if ("xlsx".equals(e)) {
                out = editXlsx(src, ops, targets, touch);
            } else {
                out = editPptx(src, ops, targets, touch);
            }
            if (!out.ok()) {
                return out;
            }
            if (out.data.length > OfficeDocWriter.MAX_BYTES) {
                return Result.fail(ErrorCode.INVALID_PARAM,
                        "改后体积超过上限 " + (OfficeDocWriter.MAX_BYTES / 1024 / 1024) + "MB");
            }

            //第 3 层：写后不变量校验（不过 → 放弃写入）
            List<String> problems = new ArrayList<String>();
            verify(src, out.data, targets, e, out, problems);
            verifyTextPreserved(src, out.data, e, touch, problems);
            if (!problems.isEmpty()) {
                Log.info("OfficeDocEditor 放弃写入（不变量校验未通过）: " + problems);
                return Result.fail(ErrorCode.INTERNAL,
                        "改后校验未通过，已放弃写入（原文件未改）：" + joinLimit(problems, 3));
            }
            if (!OfficeDocWriter.looksValid(out.data, e)) {
                return Result.fail(ErrorCode.INTERNAL, "改后不是有效的 " + e + " 包，已放弃写入");
            }
            out.ops = describeOps(ops);
            out.textAfter = truncate(safeReadBack(out.data, e), 2000);
            return out;
        } catch (IllegalArgumentException ex) {
            //参数类问题（缺字段/类型不对）统一回 INVALID_PARAM，让模型能自己改
            return Result.fail(ErrorCode.INVALID_PARAM, ex.getMessage());
        } catch (Exception ex) {
            Log.info(ex);
            return Result.fail(ErrorCode.INTERNAL, "修改 " + e + " 失败：" + ex);
        }
    }

    // ==================== 第 2 层：写前预检 ====================

    /**
     * 写前预检：命中"当前不支持的构件"就拒绝（返回失败结果），通过返回 null。
     * 依据 §7 的黑名单：图表 / OLE / 内容控件(SDT) / 域 / 修订 / 公式 / 批注。
     */
    public static Result precheck(byte[] src, String ext) throws Exception {
        Map<String, byte[]> parts = readParts(src);
        List<String> hits = new ArrayList<String>();

        for (String name : parts.keySet()) {
            if (name.startsWith("word/charts/") || name.startsWith("word/embeddings/")
                    || name.startsWith("word/diagrams/")) {
                hits.add("图表/OLE 部件 " + name);
            } else if (name.startsWith("xl/charts/") || name.startsWith("xl/drawings/")
                    || name.startsWith("xl/embeddings/") || name.startsWith("xl/pivotTables/")
                    || name.equals("xl/calcChain.xml")) {
                hits.add("图表/绘图/公式链部件 " + name);
            } else if (name.startsWith("ppt/charts/") || name.startsWith("ppt/embeddings/")
                    || name.startsWith("ppt/diagrams/")) {
                hits.add("图表/OLE/图示 部件 " + name);
            } else if (name.equals("word/comments.xml")) {
                hits.add("批注部件 " + name);
            }
        }

        if ("docx".equals(ext)) {
            String body = text(parts.get("word/document.xml"));
            if (body != null) {
                checkPattern(hits, body, "<w:sdt[ />]", "内容控件(SDT)");
                checkPattern(hits, body, "<w:fldSimple[ />]", "域");
                checkPattern(hits, body, "<w:instrText[ />]", "域");
                checkPattern(hits, body, "<w:fldChar[ />]", "域");
                checkPattern(hits, body, "<w:ins[ />]", "修订");
                checkPattern(hits, body, "<w:del[ />]", "修订");
                checkPattern(hits, body, "<w:moveFrom[ />]", "修订");
                checkPattern(hits, body, "<w:moveTo[ />]", "修订");
                checkPattern(hits, body, "<m:oMath[ />]", "数学公式");
                checkPattern(hits, body, "<w:object[ />]", "OLE 对象");
                checkPattern(hits, body, "<w:pict[ />]", "VML 图形");
                checkPattern(hits, body, "<w:altChunk[ />]", "外部内容(altChunk)");
                //页眉页脚里含域/图表同样拒绝（虽然我们不改它们，但"简单修改"口径是整包可解释）
                for (String name : parts.keySet()) {
                    if (name.startsWith("word/header") || name.startsWith("word/footer")) {
                        String hf = text(parts.get(name));
                        checkPattern(hits, hf, "<w:sdt[ />]", "页眉页脚含内容控件(SDT)");
                        checkPattern(hits, hf, "<w:instrText[ />]", "页眉页脚含域");
                        checkPattern(hits, hf, "<w:drawing[ />]", "页眉页脚含图片");
                        checkPattern(hits, hf, "<w:pict[ />]", "页眉页脚含 VML 图形");
                    }
                }
            } else {
                hits.add("缺少 word/document.xml");
            }
        } else if ("xlsx".equals(ext)) {
            for (String name : parts.keySet()) {
                if (name.startsWith("xl/worksheets/") && name.endsWith(".xml")) {
                    String xml = text(parts.get(name));
                    checkPattern(hits, xml, "<f[ />]", "公式（" + name + "）");
                }
            }
        }
        //pptx：追加页不影响既有构件；图表/OLE/图示已在上面的部件扫描里拒绝

        if (hits.isEmpty()) {
            return null;
        }
        return Result.fail(ErrorCode.INVALID_PARAM,
                "该文档含当前不支持修改的构件，已拒绝（未做任何改动）：" + joinLimit(hits, 3)
                        + "。请改用新建文档，或人工处理后再试。");
    }

    // ==================== 第 3 层：写后不变量校验 ====================

    /**
     * 部件级不变量校验：只有目标部件（+ 少量可解释的联动部件）允许变化，其余部件<b>字节级不变</b>；
     * 部件不丢；结构构件（表格/图片/合并单元格等）计数不变。所有问题累积进 {@code problems}。
     */
    public static void verify(byte[] before, byte[] after, List<String> targets, String ext, Result r,
                       List<String> problems) throws Exception {
        Map<String, String> b = partHashes(before);
        Map<String, String> a = partHashes(after);
        Map<String, byte[]> bp = readParts(before);
        Map<String, byte[]> ap = readParts(after);

        for (Map.Entry<String, String> en : b.entrySet()) {
            String name = en.getKey();
            if (!a.containsKey(name)) {
                r.removedParts.add(name);
                problems.add("部件被删除：" + name);
            } else if (!en.getValue().equals(a.get(name))) {
                r.changedParts.add(name);
                if (!isTarget(name, targets) && !matchesAny(name, TOLERATED_CHANGED)) {
                    //pptx 例外：POI 保存时会重写既有幻灯片部件（字节不同），此时退到**结构骨架 + 文本**级别的等价校验
                    if ("pptx".equals(ext) && skeletonEqual(bp.get(name), ap.get(name))) {
                        r.structureOnlyParts.add(name);
                    } else {
                        problems.add("非目标部件被改动：" + name);
                    }
                }
            }
        }
        for (String name : a.keySet()) {
            if (!b.containsKey(name)) {
                r.addedParts.add(name);
                if (!matchesAny(name, TOLERATED_ADDED)) {
                    problems.add("新增了未授权部件：" + name);
                }
            }
        }

        //结构构件计数：我们的白名单操作不产生/不删除这些构件，计数必须一致
        if ("docx".equals(ext)) {
            String body = "word/document.xml";
            for (String tag : new String[]{"<w:drawing[ />]", "<w:pict[ />]", "<w:object[ />]", "<w:sdt[ />]",
                    "<w:tbl[ />]", "<w:hyperlink[ />]", "<w:bookmarkStart[ />]", "<w:commentReference[ />]"}) {
                countEqual(problems, tag, tag, text(bp.get(body)), text(ap.get(body)));
            }
        } else if ("xlsx".equals(ext)) {
            for (String name : bp.keySet()) {
                if (name.startsWith("xl/worksheets/") && ap.containsKey(name)) {
                    for (String tag : new String[]{"<f[ />]", "<mergeCell[ />]", "<drawing[ />]",
                            "<hyperlink[ />]", "<dataValidation[ />]", "<conditionalFormatting[ />]"}) {
                        countEqual(problems, tag, tag + "@" + name, text(bp.get(name)), text(ap.get(name)));
                    }
                }
            }
        } else {
            //pptx：既有幻灯片部件必须字节级不变（上面的 changed 判定已保证，这里再显式断言幻灯片数 +1）
            int beforeSlides = countSlides(bp);
            int afterSlides = countSlides(ap);
            if (afterSlides != beforeSlides + 1) {
                problems.add("幻灯片数量异常：改前 " + beforeSlides + " → 改后 " + afterSlides);
            }
        }
    }

    /**
     * 文本保真比对：未命中操作的段落/单元格/幻灯片，文本必须逐条与改前一致。
     * 这是 §7 第 3 条里的"未命中操作的原文片段仍可检索到"的全量版（抽样 → 全量）。
     */
    public static void verifyTextPreserved(byte[] before, byte[] after, String ext, Touch touch,
                                    List<String> problems) throws Exception {
        if ("docx".equals(ext)) {
            List<String> b = docxParagraphs(before);
            List<String> a = docxParagraphs(after);
            if (a.size() != b.size() + touch.appendedParagraphs) {
                problems.add("段落数异常：改前 " + b.size() + " → 改后 " + a.size()
                        + "（本次追加 " + touch.appendedParagraphs + "）");
            }
            for (int i = 0; i < b.size() && i < a.size(); i++) {
                if (touch.replacedParagraphs.contains(i)) {
                    continue;
                }
                if (!eq(b.get(i), a.get(i))) {
                    problems.add("未命中操作的段落被改动（第 " + i + " 段）：「" + truncate(b.get(i), 20)
                            + "」→「" + truncate(a.get(i), 20) + "」");
                }
            }
        } else if ("xlsx".equals(ext)) {
            List<List<List<String>>> b = xlsxCells(before);
            List<List<List<String>>> a = xlsxCells(after);
            for (int s = 0; s < b.size(); s++) {
                List<List<String>> beforeSheet = b.get(s);
                List<List<String>> afterSheet = (s < a.size()) ? a.get(s) : new ArrayList<List<String>>();
                int appendedRows = 0;
                for (String key : touch.appendedRowKeys) {
                    if (key.startsWith(s + "!")) {
                        appendedRows++;
                    }
                }
                //set_cell_text 落在已有末行之后时会“拉长”工作表（中间是空行），这是合法扩张，但必须能解释
                int maxTouchedRow = -1;
                String prefix = s + "!";
                for (String key : touch.setCells) {
                    if (key.startsWith(prefix)) {
                        int row = Integer.parseInt(key.substring(prefix.length(), key.indexOf(':')));
                        if (row > maxTouchedRow) {
                            maxTouchedRow = row;
                        }
                    }
                }
                int expectRows = Math.max(beforeSheet.size(), maxTouchedRow + 1) + appendedRows;
                if (afterSheet.size() > expectRows) {
                    problems.add("工作表 " + s + " 行数异常：改前 " + beforeSheet.size() + " → 改后 "
                            + afterSheet.size() + "（本次追加行 " + appendedRows + "，触及最大行 "
                            + maxTouchedRow + "）");
                }
                //逐格比对：未命中操作的单元格必须一致；新增行里除命中格外都应为空
                for (int r = 0; r < afterSheet.size(); r++) {
                    List<String> br = (r < beforeSheet.size()) ? beforeSheet.get(r) : new ArrayList<String>();
                    List<String> ar = afterSheet.get(r);
                    int cols = Math.max(br.size(), ar.size());
                    for (int c = 0; c < cols; c++) {
                        if (touch.setCells.contains(s + "!" + r + ":" + c)) {
                            continue;
                        }
                        if (touch.appendedRowKeys.contains(s + "!" + r)) {
                            continue;   //本行是本次追加的，内容由 op 负责
                        }
                        String bv = (c < br.size()) ? br.get(c) : "";
                        String av = (c < ar.size()) ? ar.get(c) : "";
                        if (!eq(bv, av)) {
                            problems.add("未命中操作的单元格被改动（sheet " + s + " 行 " + r + " 列 " + c
                                    + "）：「" + truncate(bv, 20) + "」→「" + truncate(av, 20) + "」");
                        }
                    }
                }
            }
        } else {
            List<String> b = pptxSlideTexts(before);
            List<String> a = pptxSlideTexts(after);
            if (a.size() != b.size() + touch.appendedSlides) {
                problems.add("幻灯片数异常：改前 " + b.size() + " → 改后 " + a.size()
                        + "（本次追加 " + touch.appendedSlides + "）");
            }
            for (int i = 0; i < b.size() && i < a.size(); i++) {
                if (!eq(b.get(i), a.get(i))) {
                    problems.add("未命中操作的幻灯片被改动（第 " + (i + 1) + " 页）");
                }
            }
        }
    }

    private static boolean eq(String a, String b) {
        return (a == null) ? (b == null) : a.equals(b);
    }

    public static List<String> docxParagraphs(byte[] data) throws Exception {
        XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(data));
        try {
            List<String> list = new ArrayList<String>();
            for (XWPFParagraph p : doc.getParagraphs()) {
                list.add(p.getText() == null ? "" : p.getText());
            }
            return list;
        } finally {
            doc.close();
        }
    }

    public static List<List<List<String>>> xlsxCells(byte[] data) throws Exception {
        XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(data));
        try {
            List<List<List<String>>> sheets = new ArrayList<List<List<String>>>();
            for (int s = 0; s < wb.getNumberOfSheets(); s++) {
                XSSFSheet sheet = wb.getSheetAt(s);
                List<List<String>> rows = new ArrayList<List<String>>();
                for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                    XSSFRow row = sheet.getRow(r);
                    List<String> cells = new ArrayList<String>();
                    if (row != null) {
                        for (int c = 0; c < row.getLastCellNum(); c++) {
                            cells.add(cellValueText(row.getCell(c)));
                        }
                    }
                    rows.add(cells);
                }
                sheets.add(rows);
            }
            return sheets;
        } finally {
            wb.close();
        }
    }

    public static List<String> pptxSlideTexts(byte[] data) throws Exception {
        XMLSlideShow ppt = new XMLSlideShow(new ByteArrayInputStream(data));
        try {
            List<String> list = new ArrayList<String>();
            for (int i = 0; i < ppt.getSlides().size(); i++) {
                StringBuilder sb = new StringBuilder();
                for (org.apache.poi.xslf.usermodel.XSLFShape sh : ppt.getSlides().get(i).getShapes()) {
                    if (sh instanceof org.apache.poi.xslf.usermodel.XSLFTextShape) {
                        String t = ((org.apache.poi.xslf.usermodel.XSLFTextShape) sh).getText();
                        if (t != null) {
                            sb.append(t.replace('\n', ' ')).append('|');
                        }
                    }
                }
                list.add(sb.toString());
            }
            return list;
        } finally {
            ppt.close();
        }
    }

    static String cellValueText(XSSFCell c) {
        if (c == null) {
            return "";
        }
        switch (c.getCellType()) {
            case NUMERIC:
                double v = c.getNumericCellValue();
                return (v == Math.floor(v) && !Double.isInfinite(v))
                        ? String.valueOf((long) v) : String.valueOf(v);
            case BOOLEAN:
                return String.valueOf(c.getBooleanCellValue());
            case FORMULA:
                return c.getCellFormula();
            case BLANK:
                return "";
            default:
                return c.getStringCellValue();
        }
    }

    // ==================== docx ====================

    private static Result editDocx(byte[] src, JSONArray ops, List<String> targets, Touch touch) throws Exception {
        XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(src));
        try {
            targets.add(normalizePart(doc.getPackagePart().getPartName().getName()));
            List<XWPFParagraph> paras = doc.getParagraphs();
            for (int i = 0; i < ops.size(); i++) {
                JSONObject op = asObject(ops.get(i), i);
                String name = requireOp(op, i, "docx");
                if ("replace_text".equals(name)) {
                    int idx = requireInt(op, "paragraph", i);
                    if (idx < 0 || idx >= paras.size()) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：paragraph=" + idx + " 超出范围（本文档正文段落数 "
                                        + paras.size() + "，可用 0.." + (paras.size() - 1) + "）");
                    }
                    XWPFParagraph p = paras.get(idx);
                    String text = op.getString("text");
                    String find = op.getString("find");
                    if (text != null) {
                        if (text.length() > MAX_OP_TEXT_CHARS) {
                            return tooLong(i);
                        }
                        replaceParagraphText(p, text);
                        touch.replacedParagraphs.add(Integer.valueOf(idx));
                    } else if (find != null) {
                        String repl = op.getString("replace");
                        if (repl == null) {
                            repl = "";
                        }
                        if (repl.length() > MAX_OP_TEXT_CHARS) {
                            return tooLong(i);
                        }
                        Result err = replaceInParagraph(p, idx, find, repl, i);
                        if (err != null) {
                            return err;
                        }
                        touch.replacedParagraphs.add(Integer.valueOf(idx));
                    } else {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：replace_text 需要 text（整段替换）或 find+replace（段内替换）");
                    }
                } else if ("append_paragraph".equals(name)) {
                    String text = op.getString("text");
                    if (text == null) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：append_paragraph 需要 text");
                    }
                    if (text.length() > MAX_OP_TEXT_CHARS) {
                        return tooLong(i);
                    }
                    XWPFParagraph p = doc.createParagraph();
                    String style = op.getString("style");
                    if (style != null && !style.trim().isEmpty()) {
                        p.setStyle(style.trim());
                    }
                    XWPFRun run = p.createRun();
                    String[] lines = text.split("\n", -1);
                    for (int li = 0; li < lines.length; li++) {
                        if (li > 0) {
                            run.addBreak();
                        }
                        run.setText(lines[li]);
                    }
                    touch.appendedParagraphs++;
                } else {
                    return badOp(i, name, "docx");
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return Result.success(out.toByteArray());
        } finally {
            doc.close();
        }
    }

    /** 整段替换：保留首个 run（连同其格式），其余删除 */
    private static void replaceParagraphText(XWPFParagraph p, String text) {
        List<XWPFRun> runs = p.getRuns();
        if (runs == null || runs.isEmpty()) {
            XWPFRun run = p.createRun();
            setRunText(run, text);
            return;
        }
        XWPFRun first = runs.get(0);
        for (int i = runs.size() - 1; i >= 1; i--) {
            p.removeRun(i);
        }
        setRunText(first, text);
    }

    private static void setRunText(XWPFRun run, String text) {
        String[] lines = text.split("\n", -1);
        run.setText(lines[0], 0);
        for (int li = 1; li < lines.length; li++) {
            run.addBreak();
            run.setText(lines[li]);
        }
    }

    /** 段内替换：全段必须恰好命中 1 次，且命中片段必须落在同一个 run 内（跨 run 无法精确定位 → 拒绝） */
    private static Result replaceInParagraph(XWPFParagraph p, int idx, String find, String repl, int opIndex) {
        if (find.isEmpty()) {
            return Result.fail(ErrorCode.INVALID_PARAM, "第 " + (opIndex + 1) + " 个操作：find 不能为空");
        }
        String all = p.getText();
        if (all == null) {
            all = "";
        }
        int hit = countAll(all, find);
        if (hit == 0) {
            return Result.fail(ErrorCode.INVALID_PARAM,
                    "第 " + (opIndex + 1) + " 个操作：段落 " + idx + " 中没有找到「" + truncate(find, 30) + "」");
        }
        if (hit > 1) {
            return Result.fail(ErrorCode.INVALID_PARAM,
                    "第 " + (opIndex + 1) + " 个操作：段落 " + idx + " 中「" + truncate(find, 30)
                            + "」出现 " + hit + " 次，无法确定改哪一个（请改用 text 整段替换）");
        }
        List<XWPFRun> runs = p.getRuns();
        if (runs != null) {
            for (XWPFRun run : runs) {
                String rt = run.text();
                if (rt != null && rt.contains(find)) {
                    run.setText(rt.replace(find, repl), 0);
                    return null;
                }
            }
        }
        return Result.fail(ErrorCode.INVALID_PARAM,
                "第 " + (opIndex + 1) + " 个操作：段落 " + idx + " 的「" + truncate(find, 30)
                        + "」跨多个格式片段，无法精确定位（请改用 text 整段替换）");
    }

    // ==================== xlsx ====================

    private static Result editXlsx(byte[] src, JSONArray ops, List<String> targets, Touch touch) throws Exception {
        XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(src));
        try {
            for (int i = 0; i < ops.size(); i++) {
                JSONObject op = asObject(ops.get(i), i);
                String name = requireOp(op, i, "xlsx");
                int sheetIdx = op.containsKey("sheet") ? requireInt(op, "sheet", i) : 0;
                if (sheetIdx < 0 || sheetIdx >= wb.getNumberOfSheets()) {
                    return Result.fail(ErrorCode.INVALID_PARAM,
                            "第 " + (i + 1) + " 个操作：sheet=" + sheetIdx + " 超出范围（共 "
                                    + wb.getNumberOfSheets() + " 个工作表）");
                }
                XSSFSheet sheet = wb.getSheetAt(sheetIdx);
                if ("set_cell_text".equals(name)) {
                    int rowIdx = requireInt(op, "row", i);
                    int colIdx = requireInt(op, "col", i);
                    if (rowIdx < 0 || rowIdx >= OfficeDocWriter.MAX_ROWS || colIdx < 0
                            || colIdx >= OfficeDocWriter.MAX_COLS) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：row/col 超出范围（row 0.."
                                        + (OfficeDocWriter.MAX_ROWS - 1) + "，col 0.."
                                        + (OfficeDocWriter.MAX_COLS - 1) + "）");
                    }
                    if (!op.containsKey("value")) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：set_cell_text 需要 value");
                    }
                    XSSFRow row = sheet.getRow(rowIdx);
                    if (row == null) {
                        row = sheet.createRow(rowIdx);
                    }
                    XSSFCell cell = row.getCell(colIdx);
                    if (cell == null) {
                        cell = row.createCell(colIdx);
                    }
                    setCellValue(cell, op.get("value"));
                    touch.setCells.add(sheetIdx + "!" + rowIdx + ":" + colIdx);
                } else if ("append_table_row".equals(name)) {
                    JSONArray values = op.getJSONArray("values");
                    if (values == null || values.isEmpty()) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：append_table_row 需要 values（数组，非空）");
                    }
                    if (values.size() > OfficeDocWriter.MAX_COLS) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：列数超过上限 " + OfficeDocWriter.MAX_COLS);
                    }
                    int rowIdx = sheet.getLastRowNum() + 1;
                    if (rowIdx >= OfficeDocWriter.MAX_ROWS) {
                        return Result.fail(ErrorCode.INVALID_PARAM,
                                "第 " + (i + 1) + " 个操作：行数超过上限 " + OfficeDocWriter.MAX_ROWS);
                    }
                    XSSFRow row = sheet.createRow(rowIdx);
                    for (int ci = 0; ci < values.size(); ci++) {
                        setCellValue(row.createCell(ci), values.get(ci));
                    }
                    touch.appendedRowKeys.add(sheetIdx + "!" + rowIdx);
                } else {
                    return badOp(i, name, "xlsx");
                }
                String part = normalizePart(sheet.getPackagePart().getPartName().getName());
                if (!targets.contains(part)) {
                    targets.add(part);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return Result.success(out.toByteArray());
        } finally {
            wb.close();
        }
    }

    private static void setCellValue(XSSFCell cell, Object v) {
        if (v == null) {
            cell.setCellValue("");
        } else if (v instanceof Number) {
            cell.setCellValue(((Number) v).doubleValue());
        } else if (v instanceof Boolean) {
            cell.setCellValue(((Boolean) v).booleanValue());
        } else {
            cell.setCellValue(String.valueOf(v));
        }
    }

    // ==================== pptx ====================

    private static Result editPptx(byte[] src, JSONArray ops, List<String> targets, Touch touch) throws Exception {
        XMLSlideShow ppt = new XMLSlideShow(new ByteArrayInputStream(src));
        try {
            for (int i = 0; i < ops.size(); i++) {
                JSONObject op = asObject(ops.get(i), i);
                String name = requireOp(op, i, "pptx");
                if (!"append_slide".equals(name)) {
                    return badOp(i, name, "pptx");
                }
                if (ppt.getSlides().size() >= OfficeDocWriter.MAX_SLIDES) {
                    return Result.fail(ErrorCode.INVALID_PARAM,
                            "幻灯片数已达上限 " + OfficeDocWriter.MAX_SLIDES);
                }
                String title = op.getString("title");
                JSONArray bullets = op.getJSONArray("bullets");
                if ((title == null || title.trim().isEmpty()) && (bullets == null || bullets.isEmpty())) {
                    return Result.fail(ErrorCode.INVALID_PARAM,
                            "第 " + (i + 1) + " 个操作：append_slide 需要 title 或 bullets（至少一个）");
                }
                if (title != null && title.length() > MAX_OP_TEXT_CHARS) {
                    return tooLong(i);
                }
                XSLFSlide slide = ppt.createSlide();
                int y = 40;
                if (title != null && !title.trim().isEmpty()) {
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
                        String t = (b == null) ? "" : String.valueOf(b);
                        if (t.length() > MAX_OP_TEXT_CHARS) {
                            return tooLong(i);
                        }
                        XSLFTextParagraph p = body.addNewTextParagraph();
                        p.setBullet(true);
                        p.addNewTextRun().setText(t);
                    }
                }
                String part = normalizePart(slide.getPackagePart().getPartName().getName());
                if (!targets.contains(part)) {
                    targets.add(part);
                }
                touch.appendedSlides++;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ppt.write(out);
            return Result.success(out.toByteArray());
        } finally {
            ppt.close();
        }
    }

    // ==================== 参数校验与工具 ====================

    private static JSONObject asObject(Object item, int i) {
        return (item instanceof JSONObject) ? (JSONObject) item : new JSONObject();
    }

    private static String requireOp(JSONObject op, int i, String ext) throws Exception {
        String name = op.getString("op");
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("第 " + (i + 1) + " 个操作缺少 op 字段（"
                    + opsHint(ext) + "）");
        }
        return name.trim();
    }

    private static int requireInt(JSONObject op, String key, int i) throws Exception {
        Integer v = op.getInteger(key);
        if (v == null) {
            throw new IllegalArgumentException("第 " + (i + 1) + " 个操作缺少 " + key + "（整数）");
        }
        return v.intValue();
    }

    private static Result badOp(int i, String name, String ext) {
        return Result.fail(ErrorCode.INVALID_PARAM,
                "第 " + (i + 1) + " 个操作：" + ext + " 不支持 op=「" + name + "」，只支持 " + opsHint(ext));
    }

    private static Result tooLong(int i) {
        return Result.fail(ErrorCode.INVALID_PARAM,
                "第 " + (i + 1) + " 个操作：文本超过单次上限 " + MAX_OP_TEXT_CHARS + " 字");
    }

    private static String safeReadBack(byte[] data, String ext) {
        try {
            return OfficeDocWriter.readBackText(data, ext);
        } catch (Exception e) {
            Log.info(e);
            return null;
        }
    }

    public static Map<String, byte[]> readParts(byte[] zipBytes) throws Exception {
        Map<String, byte[]> map = new LinkedHashMap<String, byte[]>();
        ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(zipBytes));
        try {
            ZipEntry entry;
            byte[] buf = new byte[8192];
            while ((entry = zin.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                int n;
                while ((n = zin.read(buf)) > 0) {
                    bos.write(buf, 0, n);
                }
                map.put(normalizePart(entry.getName()), bos.toByteArray());
            }
        } finally {
            zin.close();
        }
        return map;
    }

    public static Map<String, String> partHashes(byte[] zipBytes) throws Exception {
        Map<String, String> map = new HashMap<String, String>();
        for (Map.Entry<String, byte[]> en : readParts(zipBytes).entrySet()) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(en.getValue());
            StringBuilder sb = new StringBuilder();
            for (byte x : h) {
                sb.append(String.format("%02x", x));
            }
            map.put(en.getKey(), sb.toString());
        }
        return map;
    }

    static String normalizePart(String name) {
        if (name == null) {
            return "";
        }
        return name.startsWith("/") ? name.substring(1) : name;
    }

    static boolean isTarget(String name, List<String> targets) {
        for (String t : targets) {
            if (t.equals(name)) {
                return true;
            }
        }
        return false;
    }

    public static boolean matchesAny(String name, String[] patterns) {
        for (String p : patterns) {
            if (p.equals(name) || Pattern.matches(p, name)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 结构骨架等价：元素名序列（含每元素属性名，忽略取值）+ 全部文本节点。
     * 用来在"字节不可比"时（POI 重写 pptx 部件）证明**结构没变、文字没变**。
     */    
    static boolean skeletonEqual(byte[] before, byte[] after) {
        String b = skeleton(text(before));
        String a = skeleton(text(after));
        return b != null && b.equals(a);
    }

    public static String skeleton(String xml) {
        if (xml == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        Matcher m = Pattern.compile("<\\s*/?\\s*([A-Za-z_][\\w:.-]*)((?:\\s+[A-Za-z_][\\w:.-]*\\s*=\\s*\"[^\"]*\")*)\\s*/?>").matcher(xml);
        while (m.find()) {
            sb.append(m.group(1));
            String attrs = m.group(2);
            if (attrs != null && !attrs.isEmpty()) {
                List<String> names = new ArrayList<String>();
                Matcher am = Pattern.compile("([A-Za-z_][\\w:.-]*)\\s*=").matcher(attrs);
                while (am.find()) {
                    names.add(am.group(1));
                }
                //XML 属性无顺序语义（POI/XMLBeans 重写时命名空间属性的先后会变）→ 排序后比
                java.util.Collections.sort(names);
                for (String n : names) {
                    sb.append('@').append(n);
                }
            }
            sb.append(';');
        }
        Matcher tm = Pattern.compile(">([^<]+)<").matcher(xml);
        while (tm.find()) {
            String t = tm.group(1).trim();
            if (!t.isEmpty()) {
                sb.append('#').append(t).append(';');
            }
        }
        return sb.toString();
    }

    public static String text(byte[] bytes) {
        if (bytes == null) {
            return null;
        }
        try {
            return new String(bytes, "UTF-8");
        } catch (Exception e) {
            return null;
        }
    }

    static void checkPattern(List<String> hits, String xml, String regex, String label) {
        if (xml != null && Pattern.compile(regex).matcher(xml).find()) {
            hits.add(label);
        }
    }

    static void countEqual(List<String> problems, String regex, String label, String before, String after) {
        if (before == null || after == null) {
            return;
        }
        int b = countTag(before, regex);
        int a = countTag(after, regex);
        if (b != a) {
            problems.add("结构构件数量变化 " + label + "：" + b + " → " + a);
        }
    }

    private static int countTag(String xml, String regex) {
        if (regex == null || xml == null) {
            return -1;
        }
        Matcher m = Pattern.compile(regex).matcher(xml);
        int c = 0;
        while (m.find()) {
            c++;
        }
        return c;
    }

    static int countAll(String hay, String needle) {
        if (hay == null || needle == null || needle.isEmpty()) {
            return 0;
        }
        int c = 0;
        int idx = hay.indexOf(needle);
        while (idx >= 0) {
            c++;
            idx = hay.indexOf(needle, idx + needle.length());
        }
        return c;
    }

    private static int countSlides(Map<String, byte[]> parts) {
        int c = 0;
        for (String name : parts.keySet()) {
            if (name.startsWith("ppt/slides/slide") && name.endsWith(".xml")) {
                c++;
            }
        }
        return c;
    }

    /** 操作摘要（回执给模型/用户，形如 {@code replace_text(paragraph=0)}） */
    static List<String> describeOps(JSONArray ops) {
        List<String> list = new ArrayList<String>();
        for (int i = 0; i < ops.size(); i++) {
            JSONObject op = asObject(ops.get(i), i);
            String name = op.getString("op");
            StringBuilder sb = new StringBuilder(name == null ? "?" : name);
            if (op.containsKey("paragraph")) {
                sb.append("(paragraph=").append(op.get("paragraph")).append(")");
            } else if (op.containsKey("sheet")) {
                sb.append("(sheet=").append(op.get("sheet")).append(")");
            }
            list.add(sb.toString());
        }
        return list;
    }

    static String joinLimit(List<String> list, int max) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < list.size() && i < max; i++) {
            if (i > 0) {
                sb.append("；");
            }
            sb.append(list.get(i));
        }
        if (list.size() > max) {
            sb.append("（共 ").append(list.size()).append(" 项）");
        }
        return sb.toString();
    }

    static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
