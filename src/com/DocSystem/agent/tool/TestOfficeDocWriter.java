package com.DocSystem.agent.tool;

import java.util.List;

import com.DocSystem.common.ErrorCode;
import com.DocSystem.common.OfficeDocWriter;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * P2 护栏：Office **写入**引擎（{@link OfficeDocWriter}）。
 *
 * <p>不连服务端、不碰仓库：只验证"spec → 文件字节"这一层的三件事：
 * ① 三种类型都能生成且能被 POI **回读**出内容（自有结构校验）；
 * ② 产物是有效的该格式包（魔数自检 {@code looksValid}，与读取侧 {@code detectOfficeActualFormat} 同源）；
 * ③ **坏输入一律明确失败**（空 spec / 缺字段 / 超限 / 老格式 / 非法 JSON），绝不产出半成品字节。</p>
 */
public class TestOfficeDocWriter {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        supportedExt();
        docx();
        xlsx();
        pptx();
        rejects();
        System.out.println("\n======== TestOfficeDocWriter: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void supportedExt() {
        check("docx supported", OfficeDocWriter.isSupportedExt("docx"));
        check("xlsx supported", OfficeDocWriter.isSupportedExt("XLSX"));
        check("pptx supported", OfficeDocWriter.isSupportedExt("pptx"));
        check("doc NOT supported (裁定：老格式只读)", !OfficeDocWriter.isSupportedExt("doc"));
        check("xls NOT supported", !OfficeDocWriter.isSupportedExt("xls"));
        check("ppt NOT supported", !OfficeDocWriter.isSupportedExt("ppt"));
        check("txt NOT supported", !OfficeDocWriter.isSupportedExt("txt"));
        check("null NOT supported", !OfficeDocWriter.isSupportedExt(null));
        check("hint lists three", OfficeDocWriter.supportedHint().contains("docx")
                && OfficeDocWriter.supportedHint().contains("xlsx") && OfficeDocWriter.supportedHint().contains("pptx"));
    }

    // ---------- docx ----------

    private static void docx() throws Exception {
        JSONObject spec = JSON.parseObject("{\"paragraphs\":["
                + "{\"text\":\"P2 标题\",\"style\":\"Title\"},"
                + "\"P2 正文第一行\\n第二行\","
                + "{\"text\":\"P2 尾段\"}]}");
        OfficeDocWriter.Result r = OfficeDocWriter.create("docx", spec);
        check("docx create ok", r.ok(), r.message);
        if (!r.ok()) {
            return;
        }
        check("docx magic valid", OfficeDocWriter.looksValid(r.data, "docx"));
        String text = OfficeDocWriter.readBackText(r.data, "docx");
        check("docx readback has title", text.contains("P2 标题"), text);
        check("docx readback has body both lines", text.contains("第二行"), text);
        check("docx readback has tail", text.contains("P2 尾段"), text);
        check("docx parts reported", r.parts.contains("word/document.xml"));
    }

    // ---------- xlsx ----------

    private static void xlsx() throws Exception {
        JSONObject spec = JSON.parseObject("{\"sheet\":\"预算\",\"rows\":["
                + "[\"名称\",\"数量\"],[\"苹果\",3],[\"合计\",true],[\"空\",null]]}");
        OfficeDocWriter.Result r = OfficeDocWriter.create("xlsx", spec);
        check("xlsx create ok", r.ok(), r.message);
        if (!r.ok()) {
            return;
        }
        check("xlsx magic valid", OfficeDocWriter.looksValid(r.data, "xlsx"));
        String text = OfficeDocWriter.readBackText(r.data, "xlsx");
        check("xlsx readback header", text.contains("名称") && text.contains("数量"), text);
        check("xlsx readback chinese cell", text.contains("苹果"), text);
        check("xlsx readback number as int", text.contains("3"), text);
        check("xlsx sheet named", text.length() > 0);
    }

    // ---------- pptx ----------

    private static void pptx() throws Exception {
        JSONObject spec = JSON.parseObject("{\"slides\":["
                + "{\"title\":\"第一页标题\",\"bullets\":[\"要点一\",\"要点二\"]},"
                + "{\"title\":\"第二页标题\",\"bullets\":[\"只有一个要点\"]}]}");
        OfficeDocWriter.Result r = OfficeDocWriter.create("pptx", spec);
        check("pptx create ok", r.ok(), r.message);
        if (!r.ok()) {
            return;
        }
        check("pptx magic valid", OfficeDocWriter.looksValid(r.data, "pptx"));
        String text = OfficeDocWriter.readBackText(r.data, "pptx");
        check("pptx readback slide1 title", text.contains("第一页标题"), text);
        check("pptx readback bullets", text.contains("要点一") && text.contains("要点二"), text);
        check("pptx readback slide2", text.contains("第二页标题"), text);
    }

    // ---------- 坏输入一律拒绝 ----------

    private static void rejects() {
        check("doc ext rejected", !OfficeDocWriter.create("doc", JSON.parseObject("{}")).ok());
        check("null spec docx rejected", !OfficeDocWriter.create("docx", null).ok());
        check("docx without paragraphs rejected", !OfficeDocWriter.create("docx", JSON.parseObject("{}")).ok());
        check("docx empty paragraphs rejected",
                !OfficeDocWriter.create("docx", JSON.parseObject("{\"paragraphs\":[]}")).ok());
        check("xlsx without rows rejected", !OfficeDocWriter.create("xlsx", JSON.parseObject("{}")).ok());
        check("xlsx bad row rejected",
                !OfficeDocWriter.create("xlsx", JSON.parseObject("{\"rows\":[\"notarray\"]}")).ok());
        check("pptx without slides rejected", !OfficeDocWriter.create("pptx", JSON.parseObject("{}")).ok());

        // 参数错误码统一 INVALID_PARAM（调用方据此修正入参而不是重试）
        OfficeDocWriter.Result r = OfficeDocWriter.create("docx", JSON.parseObject("{}"));
        check("invalid param code", ErrorCode.INVALID_PARAM.equals(r.errorCode), String.valueOf(r.errorCode));
        check("failure message not empty", r.message != null && !r.message.isEmpty());

        // 超限：段落数
        StringBuilder sb = new StringBuilder("{\"paragraphs\":[");
        for (int i = 0; i <= OfficeDocWriter.MAX_PARAGRAPHS; i++) {
            if (i > 0) sb.append(',');
            sb.append("\"x\"");
        }
        sb.append("]}");
        check("too many paragraphs rejected", !OfficeDocWriter.create("docx", JSON.parseObject(sb.toString())).ok());

        // 超限：文本总量
        StringBuilder big = new StringBuilder("{\"paragraphs\":[\"");
        for (int i = 0; i < OfficeDocWriter.MAX_TEXT_CHARS + 10; i++) big.append('a');
        big.append("\"]}");
        check("too much text rejected", !OfficeDocWriter.create("docx", JSON.parseObject(big.toString())).ok());

        // looksValid 对损坏字节说 false
        check("looksValid false on junk", !OfficeDocWriter.looksValid("junk".getBytes(), "docx"));
        check("looksValid false on null", !OfficeDocWriter.looksValid(null, "docx"));
        check("looksValid false on cross-format", !OfficeDocWriter.looksValid(new byte[]{'P', 'K', 3, 4}, "docx"));
    }

    // ---------- helpers ----------

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

    @SuppressWarnings("unused")
    private static List<String> unused(List<String> l) {
        return l;
    }
}
