package com.DocSystem.agent.tool;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import com.DocSystem.common.ErrorCode;
import com.DocSystem.common.OfficeDocEditor;
import com.DocSystem.common.OfficeDocWriter;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * P2 阶段二护栏：Office **修改**引擎（{@link OfficeDocEditor}）的三层保证。
 *
 * <p>本护栏只做"能机械判定"的事，不依赖服务端：</p>
 * <ol>
 *   <li><b>白名单</b>：每格式只认自己的 op，越界 op 必拒；</li>
 *   <li><b>写前预检</b>：构造含 内容控件/域/修订/公式/批注/图表 的"毒样本"，必须逐条被拒且给出原因；
 *       同时验证"只有图片"这类<b>允许</b>的文档不被误拒；</li>
 *   <li><b>写后不变量</b>：报告的实际变化部件必须恰好在允许集内（新增/删除/改动三类分开断言），
 *       且未命中操作的文本逐条保真 —— 这条用"反向自测"证明校验器真能抓到违规（不是永远绿）。</li>
 * </ol>
 */
public class TestOfficeWriteInvariants {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        whitelist();
        docxEdit();
        xlsxEdit();
        pptxEdit();
        specErrors();
        precheckBlocks();
        precheckAllowsPlain();
        verifySelfTest();
        System.out.println("\n======== TestOfficeWriteInvariants: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- 白名单 ----------

    private static void whitelist() {
        check("docx ops", OfficeDocEditor.supportedOps("docx").length == 2);
        check("xlsx ops", OfficeDocEditor.supportedOps("xlsx").length == 2);
        check("pptx ops", OfficeDocEditor.supportedOps("pptx").length == 1);
        check("doc ops empty (old format read-only)", OfficeDocEditor.supportedOps("doc").length == 0);
        check("txt ops empty", OfficeDocEditor.supportedOps("txt").length == 0);
        check("null ops empty", OfficeDocEditor.supportedOps(null).length == 0);
        check("hint docx lists both", OfficeDocEditor.opsHint("docx").contains("replace_text")
                && OfficeDocEditor.opsHint("docx").contains("append_paragraph"), OfficeDocEditor.opsHint("docx"));
        check("allOpsHint covers 5 ops", OfficeDocEditor.allOpsHint().contains("replace_text")
                && OfficeDocEditor.allOpsHint().contains("append_paragraph")
                && OfficeDocEditor.allOpsHint().contains("set_cell_text")
                && OfficeDocEditor.allOpsHint().contains("append_table_row")
                && OfficeDocEditor.allOpsHint().contains("append_slide"), OfficeDocEditor.allOpsHint());
    }

    // ---------- docx 修改 ----------

    private static void docxEdit() throws Exception {
        byte[] base = baseDocx();

        //整段替换
        OfficeDocEditor.Result r = OfficeDocEditor.edit("docx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"text\":\"改后标题\"}]}"));
        check("docx replace_text ok", r.ok(), r.message);
        if (r.ok()) {
            List<String> ps = OfficeDocEditor.docxParagraphs(r.data);
            check("docx paragraph replaced", "改后标题".equals(ps.get(0)), String.valueOf(ps.get(0)));
            check("docx other paragraph preserved", "P2 正文".equals(ps.get(1)), String.valueOf(ps.get(1)));
            check("docx paragraph count unchanged", ps.size() == 3, String.valueOf(ps.size()));
            check("docx only target part changed",
                    eq(r.changedParts, new String[]{"word/document.xml"}), String.valueOf(r.changedParts));
            check("docx no part added", r.addedParts.isEmpty(), String.valueOf(r.addedParts));
            check("docx no part removed", r.removedParts.isEmpty(), String.valueOf(r.removedParts));
            check("docx ops echoed", r.ops.contains("replace_text(paragraph=0)"), String.valueOf(r.ops));
            check("docx textAfter reflects change", r.textAfter != null && r.textAfter.contains("改后标题"),
                    String.valueOf(r.textAfter));
        }

        //段内替换（同一 run 内）
        OfficeDocEditor.Result r2 = OfficeDocEditor.edit("docx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":1,\"find\":\"正文\",\"replace\":\"BODY\"}]}"));
        check("docx find/replace ok", r2.ok(), r2.message);
        if (r2.ok()) {
            List<String> ps = OfficeDocEditor.docxParagraphs(r2.data);
            check("docx find/replace applied", "P2 BODY".equals(ps.get(1)), String.valueOf(ps.get(1)));
            check("docx find/replace kept others", "P2 标题".equals(ps.get(0)), String.valueOf(ps.get(0)));
        }

        //追加段落
        OfficeDocEditor.Result r3 = OfficeDocEditor.edit("docx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"新增尾段\"}]}"));
        check("docx append_paragraph ok", r3.ok(), r3.message);
        if (r3.ok()) {
            List<String> ps = OfficeDocEditor.docxParagraphs(r3.data);
            check("docx paragraph appended", ps.size() == 4 && "新增尾段".equals(ps.get(3)), String.valueOf(ps));
            check("docx append only target part changed",
                    eq(r3.changedParts, new String[]{"word/document.xml"}), String.valueOf(r3.changedParts));
        }

        //多操作一次执行
        OfficeDocEditor.Result r4 = OfficeDocEditor.edit("docx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"text\":\"T2\"},"
                        + "{\"op\":\"append_paragraph\",\"text\":\"尾2\"},"
                        + "{\"op\":\"append_paragraph\",\"text\":\"尾3\"}]}"));
        check("docx multi ops ok", r4.ok(), r4.message);
        if (r4.ok()) {
            List<String> ps = OfficeDocEditor.docxParagraphs(r4.data);
            check("docx multi ops applied", ps.size() == 5 && "T2".equals(ps.get(0)) && "尾3".equals(ps.get(4)),
                    String.valueOf(ps));
        }
    }

    // ---------- xlsx 修改 ----------

    private static void xlsxEdit() throws Exception {
        byte[] base = baseXlsx();

        OfficeDocEditor.Result r = OfficeDocEditor.edit("xlsx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"sheet\":0,\"row\":1,\"col\":1,\"value\":\"改后值\"}]}"));
        check("xlsx set_cell_text ok", r.ok(), r.message);
        if (r.ok()) {
            List<List<List<String>>> sheets = OfficeDocEditor.xlsxCells(r.data);
            check("xlsx cell replaced", "改后值".equals(sheets.get(0).get(1).get(1)),
                    String.valueOf(sheets.get(0)));
            check("xlsx other cell preserved", "名称".equals(sheets.get(0).get(0).get(0)),
                    String.valueOf(sheets.get(0)));
            check("xlsx changed parts within allow",
                    subset(r.changedParts, new String[]{"xl/worksheets/sheet1.xml", "xl/sharedStrings.xml",
                            "docProps/app.xml", "docProps/core.xml", "[Content_Types].xml"}),
                    String.valueOf(r.changedParts));
            check("xlsx added within allow", subset(r.addedParts, new String[]{"xl/sharedStrings.xml"}),
                    String.valueOf(r.addedParts));
            check("xlsx no part removed", r.removedParts.isEmpty(), String.valueOf(r.removedParts));
        }

        OfficeDocEditor.Result r2 = OfficeDocEditor.edit("xlsx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_table_row\",\"values\":[\"新增行\",99]}]}"));
        check("xlsx append_table_row ok", r2.ok(), r2.message);
        if (r2.ok()) {
            List<List<List<String>>> sheets = OfficeDocEditor.xlsxCells(r2.data);
            List<List<String>> s0 = sheets.get(0);
            check("xlsx row appended", s0.size() == 3 && "新增行".equals(s0.get(2).get(0)), String.valueOf(s0));
            check("xlsx existing rows preserved", "名称".equals(s0.get(0).get(0)) && "苹果".equals(s0.get(1).get(0)),
                    String.valueOf(s0));
            check("xlsx append only target part changed",
                    subset(r2.changedParts, new String[]{"xl/worksheets/sheet1.xml", "xl/sharedStrings.xml",
                            "docProps/app.xml", "docProps/core.xml", "[Content_Types].xml"}),
                    String.valueOf(r2.changedParts));
        }

        //新建单元格（原来不存在的坐标）
        OfficeDocEditor.Result r3 = OfficeDocEditor.edit("xlsx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"sheet\":0,\"row\":5,\"col\":3,\"value\":7}]}"));
        check("xlsx set new cell ok", r3.ok(), r3.message);
        if (r3.ok()) {
            List<List<List<String>>> sheets = OfficeDocEditor.xlsxCells(r3.data);
            check("xlsx new cell written", "7".equals(sheets.get(0).get(5).get(3)),
                    String.valueOf(sheets.get(0).get(5)));
            check("xlsx untouched rows preserved across new cell",
                    "名称".equals(sheets.get(0).get(0).get(0)), String.valueOf(sheets.get(0).get(0)));
        }
    }

    // ---------- pptx 修改 ----------

    private static void pptxEdit() throws Exception {
        byte[] base = basePptx();

        OfficeDocEditor.Result r = OfficeDocEditor.edit("pptx", base,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_slide\",\"title\":\"新增页\",\"bullets\":[\"要点A\",\"要点B\"]}]}"));
        check("pptx append_slide ok", r.ok(), r.message);
        if (r.ok()) {
            List<String> texts = OfficeDocEditor.pptxSlideTexts(r.data);
            check("pptx slide count +1", texts.size() == 3, String.valueOf(texts.size()));
            check("pptx new slide content", texts.get(2).contains("新增页") && texts.get(2).contains("要点B"),
                    texts.get(2));
            check("pptx existing slides preserved", texts.get(0).equals(OfficeDocEditor.pptxSlideTexts(base).get(0)),
                    texts.get(0));
            check("pptx added parts within allow",
                    subsetPattern(r.addedParts, new String[]{"ppt/slides/slide[0-9]+\\.xml",
                            "ppt/slides/_rels/slide[0-9]+\\.xml\\.rels"}),
                    String.valueOf(r.addedParts));
            check("pptx added exactly one slide + its rels", r.addedParts.size() == 2,
                    String.valueOf(r.addedParts));
            check("pptx no part removed", r.removedParts.isEmpty(), String.valueOf(r.removedParts));
            check("pptx changed parts within allow",
                    subset(r.changedParts, new String[]{"ppt/presentation.xml", "ppt/_rels/presentation.xml.rels",
                            "[Content_Types].xml", "docProps/app.xml", "docProps/core.xml",
                            //POI 保存 pptx 会重写既有幻灯片（字节不同、骨架与文字一致）
                            "ppt/slides/slide1.xml", "ppt/slides/slide2.xml"}),
                    String.valueOf(r.changedParts));
            List<String> unexpected = new ArrayList<String>();
            for (String p : r.changedParts) {
                if (p.startsWith("ppt/slides/") && !r.structureOnlyParts.contains(p)) {
                    unexpected.add(p);
                }
            }
            check("pptx slide byte-changes are all structure-equivalent", unexpected.isEmpty(),
                    String.valueOf(unexpected));
            check("pptx pre-existing slides only structure-changed",
                    subset(r.structureOnlyParts, new String[]{"ppt/slides/slide1.xml", "ppt/slides/slide2.xml"}),
                    String.valueOf(r.structureOnlyParts));
        }
    }

    // ---------- spec 非法输入 ----------

    private static void specErrors() throws Exception {
        byte[] docx = baseDocx();
        byte[] xlsx = baseXlsx();
        byte[] pptx = basePptx();

        check("missing ops rejected", bad(OfficeDocEditor.edit("docx", docx, JSON.parseObject("{}"))));
        check("empty ops rejected",
                bad(OfficeDocEditor.edit("docx", docx, JSON.parseObject("{\"ops\":[]}"))));
        check("ops null value rejected", bad(OfficeDocEditor.edit("docx", docx, null)));
        check("old format rejected", OfficeDocEditor.edit("doc", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"text\":\"x\"}]}"))
                .errorCode.equals(ErrorCode.INVALID_PARAM));
        check("non-ooxml bytes rejected", bad(OfficeDocEditor.edit("docx", "hello".getBytes("UTF-8"),
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"x\"}]}"))));
        check("empty source rejected", bad(OfficeDocEditor.edit("docx", new byte[0],
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"x\"}]}"))));

        //跨格式 op
        OfficeDocEditor.Result r = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"row\":0,\"col\":0,\"value\":\"x\"}]}"));
        check("xlsx op on docx rejected", bad(r) && r.message.contains("docx"), r.message);
        OfficeDocEditor.Result r2 = OfficeDocEditor.edit("xlsx", xlsx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_slide\",\"title\":\"x\"}]}"));
        check("pptx op on xlsx rejected", bad(r2) && r2.message.contains("xlsx"), r2.message);
        OfficeDocEditor.Result r3 = OfficeDocEditor.edit("pptx", pptx,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"text\":\"x\"}]}"));
        check("docx op on pptx rejected", bad(r3) && r3.message.contains("pptx"), r3.message);

        //定位/取值错误
        OfficeDocEditor.Result r4 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":99,\"text\":\"x\"}]}"));
        check("paragraph out of range rejected", bad(r4) && r4.message.contains("超出范围"), r4.message);
        OfficeDocEditor.Result r5 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"find\":\"不存在的字\",\"replace\":\"y\"}]}"));
        check("find miss rejected", bad(r5) && r5.message.contains("没有找到"), r5.message);
        byte[] dup = OfficeDocWriter.create("docx",
                JSON.parseObject("{\"paragraphs\":[\"重复词 重复词\"]}")).data;
        OfficeDocEditor.Result r6 = OfficeDocEditor.edit("docx", dup,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"find\":\"重复词\",\"replace\":\"y\"}]}"));
        check("ambiguous find rejected", bad(r6) && r6.message.contains("出现"), r6.message);
        OfficeDocEditor.Result r7 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0}]}"));
        check("replace_text without text/find rejected", bad(r7) && r7.message.contains("text"), r7.message);
        OfficeDocEditor.Result r8 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\"}]}"));
        check("append_paragraph without text rejected", bad(r8), r8.message);
        OfficeDocEditor.Result r9 = OfficeDocEditor.edit("xlsx", xlsx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_table_row\",\"values\":[]}]}"));
        check("append_table_row empty values rejected", bad(r9), r9.message);
        OfficeDocEditor.Result r10 = OfficeDocEditor.edit("xlsx", xlsx,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"row\":0,\"col\":0}]}"));
        check("set_cell_text without value rejected", bad(r10) && r10.message.contains("value"), r10.message);
        OfficeDocEditor.Result r11 = OfficeDocEditor.edit("xlsx", xlsx,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"sheet\":9,\"row\":0,\"col\":0,\"value\":\"x\"}]}"));
        check("sheet out of range rejected", bad(r11) && r11.message.contains("sheet"), r11.message);
        OfficeDocEditor.Result r12 = OfficeDocEditor.edit("pptx", pptx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_slide\"}]}"));
        check("append_slide without content rejected", bad(r12), r12.message);
        OfficeDocEditor.Result r13 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"text\":\"无 op\"}]}"));
        check("op missing rejected", bad(r13) && r13.message.contains("op"), r13.message);
        OfficeDocEditor.Result r14 = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"" + repeat("x", 20001) + "\"}]}"));
        check("too long text rejected", bad(r14) && r14.message.contains("上限"), r14.message);

        //超量 ops
        StringBuilder big = new StringBuilder("{\"ops\":[");
        for (int i = 0; i < OfficeDocEditor.MAX_OPS + 1; i++) {
            big.append(i == 0 ? "" : ",").append("{\"op\":\"append_paragraph\",\"text\":\"x\"}");
        }
        big.append("]}");
        check("too many ops rejected",
                bad(OfficeDocEditor.edit("docx", docx, JSON.parseObject(big.toString()))));
    }

    // ---------- 写前预检：毒样本必须被拒 ----------

    private static void precheckBlocks() throws Exception {
        byte[] docx = baseDocx();
        String body = "word/document.xml";

        checkPrecheck(docx, body, "<w:sdt><w:sdtPr/></w:sdt>", "docx SDT", "内容控件");
        checkPrecheck(docx, body, "<w:fldSimple w:instr=\"PAGE\"/>", "docx field", "域");
        checkPrecheck(docx, body, "<w:ins w:id=\"1\"/>", "docx revision ins", "修订");
        checkPrecheck(docx, body, "<w:del w:id=\"2\"/>", "docx revision del", "修订");
        checkPrecheck(docx, body, "<m:oMath/>", "docx math", "公式");
        checkPrecheck(docx, body, "<w:object/>", "docx ole object", "OLE");
        checkPrecheck(docx, body, "<w:altChunk/>", "docx altChunk", "altChunk");

        byte[] withComment = repack(baseDocx(), parts("word/comments.xml", "<w:comments/>"));
        OfficeDocEditor.Result rc = OfficeDocEditor.precheck(withComment, "docx");
        check("docx comments part blocked", rc != null && rc.message.contains("批注"),
                rc == null ? "not blocked" : rc.message);

        byte[] withChart = repack(baseDocx(), parts("word/charts/chart1.xml", "<c:chartSpace/>"));
        OfficeDocEditor.Result rch = OfficeDocEditor.precheck(withChart, "docx");
        check("docx chart part blocked", rch != null && rch.message.contains("图表"),
                rch == null ? "not blocked" : rch.message);

        byte[] withHeaderField = repack(baseDocx(),
                parts("word/header1.xml", "<w:hdr><w:instrText>TOC</w:instrText></w:hdr>"));
        OfficeDocEditor.Result rh = OfficeDocEditor.precheck(withHeaderField, "docx");
        check("docx header field blocked", rh != null && rh.message.contains("页眉页脚"),
                rh == null ? "not blocked" : rh.message);

        //xlsx：公式
        byte[] xlsx = baseXlsx();
        byte[] withFormula = injectIntoPart(xlsx, "xl/worksheets/sheet1.xml",
                "</sheetData>", "<row r=\"9\"><c r=\"A9\"><f>SUM(A1:A2)</f></c></row></sheetData>");
        OfficeDocEditor.Result rf = OfficeDocEditor.precheck(withFormula, "xlsx");
        check("xlsx formula blocked", rf != null && rf.message.contains("公式"),
                rf == null ? "not blocked" : rf.message);
        OfficeDocEditor.Result rf2 = OfficeDocEditor.edit("xlsx", withFormula,
                JSON.parseObject("{\"ops\":[{\"op\":\"set_cell_text\",\"row\":0,\"col\":0,\"value\":\"x\"}]}"));
        check("xlsx formula edit rejected end-to-end", bad(rf2) && rf2.message.contains("公式"), rf2.message);

        //xlsx：图表部件
        byte[] withChartPart = repack(baseXlsx(), parts("xl/charts/chart1.xml", "<c:chartSpace/>"));
        OfficeDocEditor.Result rp = OfficeDocEditor.precheck(withChartPart, "xlsx");
        check("xlsx chart part blocked", rp != null && rp.message.contains("图表"),
                rp == null ? "not blocked" : rp.message);

        //pptx：图表部件
        byte[] withPptChart = repack(basePptx(), parts("ppt/charts/chart1.xml", "<c:chartSpace/>"));
        OfficeDocEditor.Result rpc = OfficeDocEditor.precheck(withPptChart, "pptx");
        check("pptx chart part blocked", rpc != null && rpc.message.contains("图表"),
                rpc == null ? "not blocked" : rpc.message);

        //拒绝必须是"未做任何改动"
        OfficeDocEditor.Result blockedEdit = OfficeDocEditor.edit("docx", docx,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"x\"}]}"));
        check("clean docx still editable (控制组)", blockedEdit.ok(), blockedEdit.message);
    }

    private static void checkPrecheck(byte[] base, String part, String inject, String label, String expectWord)
            throws Exception {
        byte[] poisoned = injectIntoPart(base, part, "</w:p>", "</w:p>" + inject);
        OfficeDocEditor.Result r = OfficeDocEditor.precheck(poisoned, "docx");
        check(label + " blocked", r != null && r.message.contains(expectWord),
                r == null ? "not blocked" : r.message);
        OfficeDocEditor.Result re = OfficeDocEditor.edit("docx", poisoned,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"x\"}]}"));
        check(label + " edit rejected end-to-end", bad(re), re.message);
    }

    private static void precheckAllowsPlain() throws Exception {
        //纯图片（w:drawing）不在黑名单：应当允许修改，且改后图片计数不变
        byte[] withImage = injectIntoPart(baseDocx(), "word/document.xml", "</w:p>",
                "</w:p><w:p><w:r><w:drawing/></w:r></w:p>");
        OfficeDocEditor.Result pre = OfficeDocEditor.precheck(withImage, "docx");
        check("docx with image passes precheck", pre == null, pre == null ? "" : pre.message);
        OfficeDocEditor.Result r = OfficeDocEditor.edit("docx", withImage,
                JSON.parseObject("{\"ops\":[{\"op\":\"append_paragraph\",\"text\":\"图片文档也能追加\"}]}"));
        check("docx with image editable", r.ok(), r.message);
        if (r.ok()) {
            Map<String, byte[]> parts = OfficeDocEditor.readParts(r.data);
            String body = OfficeDocEditor.text(parts.get("word/document.xml"));
            check("docx image drawing count preserved", count(body, "<w:drawing") == 1, String.valueOf(count(body, "<w:drawing")));
        }
    }

    // ---------- 反向自测：证明校验器真能抓到违规 ----------

    private static void verifySelfTest() throws Exception {
        byte[] a = baseDocx();
        //改成"不可容忍"的部件（word/settings.xml）：必须报“非目标部件被改动”
        byte[] bRepack = injectIntoPart(baseDocx(), "word/settings.xml", "/>" , "/><w:zoom w:percent=\"120\"/>");
        OfficeDocEditor.Result r1 = new OfficeDocEditor.Result();
        List<String> p1 = new ArrayList<String>();
        OfficeDocEditor.verify(a, bRepack, list("word/document.xml"), "docx", r1, p1);
        check("verify catches non-target part change",
                containsSub(p1, "非目标部件被改动"), String.valueOf(p1));

        byte[] bDrop = repack(baseDocx(), parts("word/settings.xml", null));
        OfficeDocEditor.Result r2 = new OfficeDocEditor.Result();
        List<String> p2 = new ArrayList<String>();
        OfficeDocEditor.verify(a, bDrop, list("word/document.xml"), "docx", r2, p2);
        check("verify catches removed part", containsSub(p2, "部件被删除"), String.valueOf(p2));

        byte[] bAdd = repack(baseDocx(), parts("word/fake.xml", "<x/>"));
        OfficeDocEditor.Result r3 = new OfficeDocEditor.Result();
        List<String> p3 = new ArrayList<String>();
        OfficeDocEditor.verify(a, bAdd, list("word/document.xml"), "docx", r3, p3);
        check("verify catches unauthorized added part", containsSub(p3, "新增了未授权部件"), String.valueOf(p3));

        //文本保真：正文被整段改掉（不是我们的 op 干的）也必须被抓到
        OfficeDocEditor.Result rewritten = OfficeDocEditor.edit("docx", a,
                JSON.parseObject("{\"ops\":[{\"op\":\"replace_text\",\"paragraph\":0,\"text\":\"只改第0段\"}]}"));
        List<String> p4 = new ArrayList<String>();
        OfficeDocEditor.verifyTextPreserved(a, rewritten.data, "docx", new OfficeDocEditor.Touch(), p4);
        check("text-preservation catches untracked change", containsSub(p4, "未命中操作的段落被改动"),
                String.valueOf(p4));

        //控制组：正确的 Touch 必须零问题（否则护栏是"永远红"）
        List<String> p5 = new ArrayList<String>();
        OfficeDocEditor.Touch t = new OfficeDocEditor.Touch();
        t.replacedParagraphs.add(Integer.valueOf(0));
        OfficeDocEditor.verifyTextPreserved(a, rewritten.data, "docx", t, p5);
        check("text-preservation passes with correct touch", p5.isEmpty(), String.valueOf(p5));

        //段落数异常也必须抓到
        List<String> p6 = new ArrayList<String>();
        OfficeDocEditor.Touch t2 = new OfficeDocEditor.Touch();
        t2.appendedParagraphs = 3;
        OfficeDocEditor.verifyTextPreserved(a, rewritten.data, "docx", t2, p6);
        check("text-preservation catches paragraph count mismatch", containsSub(p6, "段落数异常"),
                String.valueOf(p6));

        //verify 对合法产物必须零问题（控制组）
        OfficeDocEditor.Result r4 = new OfficeDocEditor.Result();
        List<String> p7 = new ArrayList<String>();
        OfficeDocEditor.verify(a, rewritten.data, list("word/document.xml"), "docx", r4, p7);
        check("verify passes on legit output", p7.isEmpty(), String.valueOf(p7));
    }

    // ---------- fixtures ----------

    private static byte[] baseDocx() {
        return OfficeDocWriter.create("docx", JSON.parseObject(
                "{\"paragraphs\":[{\"text\":\"P2 标题\",\"style\":\"Title\"},\"P2 正文\",\"P2 尾段\"]}")).data;
    }

    private static byte[] baseXlsx() {
        return OfficeDocWriter.create("xlsx", JSON.parseObject(
                "{\"sheet\":\"预算\",\"rows\":[[\"名称\",\"数量\"],[\"苹果\",3]]}")).data;
    }

    private static byte[] basePptx() {
        return OfficeDocWriter.create("pptx", JSON.parseObject(
                "{\"slides\":[{\"title\":\"封面\",\"bullets\":[\"一\"]},{\"title\":\"第二页\",\"bullets\":[\"二\"]}]}")).data;
    }

    // ---------- zip 工具（构造毒样本 / 篡改版） ----------

    /** 把 zip 内某个部件的内容替换/替换为 null（删除）后重新打包 */
    private static byte[] repack(byte[] zip, Map<String, String> replace) throws Exception {
        Map<String, byte[]> input = new LinkedHashMap<String, byte[]>();
        ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(zip));
        ZipEntry e;
        byte[] buf = new byte[8192];
        while ((e = zin.getNextEntry()) != null) {
            if (e.isDirectory()) {
                continue;
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            int n;
            while ((n = zin.read(buf)) > 0) {
                bos.write(buf, 0, n);
            }
            input.put(e.getName(), bos.toByteArray());
        }
        zin.close();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ZipOutputStream zout = new ZipOutputStream(out);
        for (Map.Entry<String, byte[]> en : input.entrySet()) {
            String value = replace.containsKey(en.getKey()) ? replace.get(en.getKey()) : null;
            if (replace.containsKey(en.getKey()) && value == null) {
                continue;   //删除
            }
            byte[] data = replace.containsKey(en.getKey()) ? value.getBytes("UTF-8") : en.getValue();
            zout.putNextEntry(new ZipEntry(en.getKey()));
            zout.write(data);
            zout.closeEntry();
        }
        for (Map.Entry<String, String> en : replace.entrySet()) {
            if (!input.containsKey(en.getKey()) && en.getValue() != null) {
                zout.putNextEntry(new ZipEntry(en.getKey()));
                zout.write(en.getValue().getBytes("UTF-8"));
                zout.closeEntry();
            }
        }
        zout.close();
        return out.toByteArray();
    }

    private static Map<String, String> parts(String name, String content) {
        Map<String, String> m = new LinkedHashMap<String, String>();
        m.put(name, content);
        return m;
    }

    /** 在指定部件的某个锚点后注入一段 XML（锚点只替换第一处） */
    private static byte[] injectIntoPart(byte[] zip, String part, String anchor, String injected)
            throws Exception {
        Map<String, byte[]> input = OfficeDocEditor.readParts(zip);
        byte[] raw = input.get(part);
        check("fixture: part exists " + part, raw != null);
        String xml = new String(raw, "UTF-8");
        int idx = xml.indexOf(anchor);
        if (idx < 0) {
            throw new IllegalStateException("anchor not found in " + part + ": " + anchor);
        }
        String updated = xml.substring(0, idx) + injected + xml.substring(idx + anchor.length());
        return repack(zip, parts(part, updated));
    }

    /** 与 OfficeDocEditor 内部同口径的原样重打包（只替换一个部件内容） */
    // ---------- helpers ----------

    private static boolean bad(OfficeDocEditor.Result r) {
        return !r.ok() && r.message != null && !r.message.isEmpty();
    }

    private static boolean eq(List<String> actual, String[] expected) {
        if (actual == null || actual.size() != expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (!expected[i].equals(actual.get(i))) {
                return false;
            }
        }
        return true;
    }

    private static boolean subset(List<String> actual, String[] allowed) {
        if (actual == null) {
            return true;
        }
        for (String a : actual) {
            boolean hit = false;
            for (String ok : allowed) {
                if (ok.equals(a)) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                return false;
            }
        }
        return true;
    }

    private static boolean subsetPattern(List<String> actual, String[] patterns) {
        if (actual == null) {
            return true;
        }
        for (String a : actual) {
            boolean hit = false;
            for (String p : patterns) {
                if (a.matches(p)) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                return false;
            }
        }
        return true;
    }

    private static boolean containsSub(List<String> list, String sub) {
        for (String s : list) {
            if (s.contains(sub)) {
                return true;
            }
        }
        return false;
    }

    private static List<String> list(String... items) {
        List<String> l = new ArrayList<String>();
        for (String s : items) {
            l.add(s);
        }
        return l;
    }

    private static int count(String hay, String needle) {
        int c = 0;
        int i = (hay == null) ? -1 : hay.indexOf(needle);
        while (i >= 0) {
            c++;
            i = hay.indexOf(needle, i + needle.length());
        }
        return c;
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }

    @SuppressWarnings("unused")
    private static JSONArray unused(JSONArray a) {
        return a;
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
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : "  -> " + detail));
        }
    }
}
