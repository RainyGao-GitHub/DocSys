package com.DocSystem.agent.client;

import com.DocSystem.agent.util.HtmlText;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;

/**
 * 护栏：非 JSON 响应（容器 HTML 错误页）翻译成可读失败 —— R3-14。
 *
 * <p><b>修的是什么（实测取证）</b>：
 * <ul>
 *   <li>旧实现只取 {@code <h1>}。真实容器 400 页的 h1 是 {@code HTTP Status 400 - }（message 为空），
 *       真正的原因在 {@code <p><b>description</b>>} 里 → 模型看到的是"状态重复一遍、原因一个字没有"；</li>
 *   <li>处置提示写死"这通常是服务端内部错误，可改用 list_repos/get_repos 确认对象是否存在" →
 *       4xx（参数/路径错）被误导成"去确认对象是否存在"；</li>
 *   <li>Tomcat 7 用 {@code RequestUtil.filter} 把异常消息转义进 h1 与 message（{@code < }→{@code &lt;} 等，
 *       已用 {@code javap} 核实），旧实现只去标签**不解码实体** → {@code &lt;}/{@code &amp;}/{@code &quot;} 进上下文。</li>
 * </ul>
 *
 * <p>修法：取 message → description → h1 正文 → 原文截断（逐级退化），统一走共用件
 * {@link HtmlText#clean(String)}（与 web_search 摘要同口径），处置提示与 errorCode 按 HTTP 状态分类。
 *
 * <p>本测试直接调 {@code DocSysClient.responseBodyString(Response)}（包内可见），用真实的 Tomcat 页面形态做输入，
 * 不需要起服务器。
 */
public class TestServerErrorSummary {

    /** 真实容器 400 页（dev 服务器 curl {@code /Doc/getDoc.do?reposId=5&docId=abc} 得来；{@code <style>} 段省略，其余逐字） */
    private static final String REAL_400 =
            "<html><head><title>Apache Tomcat/7.0.56 - Error report</title></head><body>"
            + "<h1>HTTP Status 400 - </h1><HR size=\"1\" noshade=\"noshade\">"
            + "<p><b>type</b> Status report</p>"
            + "<p><b>message</b> <u></u></p>"
            + "<p><b>description</b> <u>The request sent by the client was syntactically incorrect.</u></p>"
            + "<HR size=\"1\" noshade=\"noshade\"><h3>Apache Tomcat/7.0.56</h3></body></html>";

    /** 真实容器 404 页（curl {@code /Doc/getDocList.do?…} 得来） */
    private static final String REAL_404 =
            "<html><head><title>Apache Tomcat/7.0.56 - Error report</title></head><body>"
            + "<h1>HTTP Status 404 - </h1><HR size=\"1\" noshade=\"noshade\">"
            + "<p><b>type</b> Status report</p>"
            + "<p><b>message</b> <u></u></p>"
            + "<p><b>description</b> <u>The requested resource is not available.</u></p>"
            + "<HR size=\"1\" noshade=\"noshade\"><h3>Apache Tomcat/7.0.56</h3></body></html>";

    /** 500 时 Tomcat 放进 h1/message 的异常消息**已实体转义**（RequestUtil.filter 的行为） */
    private static final String ESCAPED_MSG =
            "java.lang.IllegalArgumentException: unexpected tag &lt;name&gt; and &amp; and &quot;q&quot;";

    /** 500 页形态（h1 与 message 里是同一段转义后的异常消息） */
    private static final String HTML_500 =
            "<html><head><title>Apache Tomcat/7.0.56 - Error report</title></head><body>"
            + "<h1>HTTP Status 500 - " + ESCAPED_MSG + "</h1><HR size=\"1\" noshade=\"noshade\">"
            + "<p><b>type</b> Exception report</p>"
            + "<p><b>message</b> <u>" + ESCAPED_MSG + "</u></p>"
            + "<p><b>description</b> <u>The server encountered an internal error that prevented it from fulfilling this request.</u></p>"
            + "<HR size=\"1\" noshade=\"noshade\"><h3>Apache Tomcat/7.0.56</h3></body></html>";

    private static int pass = 0;
    private static int fail = 0;

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

    private static final DocSysClient CLIENT = new DocSysClient("http://localhost:8100/DocSystem");

    /** 构造一个带 HTML 响应体的容器响应（不经网络） */
    private static Response resp(int code, String body) {
        return new Response.Builder()
                .request(new Request.Builder().url("http://localhost:8100/DocSystem/x.do").build())
                .protocol(Protocol.HTTP_1_1)
                .code(code)
                .message("probe")
                .body(ResponseBody.create(MediaType.parse("text/html"), body))
                .build();
    }

    private static String translate(int code, String body) throws Exception {
        return CLIENT.responseBodyString(resp(code, body));
    }

    private static JSONObject json(int code, String body) throws Exception {
        return JSON.parseObject(translate(code, body));
    }

    public static void main(String[] args) throws Exception {
        testReal400();
        testReal404();
        testReal500Entities();
        testFallbacks();
        testPassThrough();
        testSharedUtil();
        testSourceLint();

        System.out.println();
        System.out.println(pass + " passed, " + fail + " failed");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /** 真实 400：必须给出去 description 的原因，且不再说"服务端内部错误" */
    private static void testReal400() throws Exception {
        JSONObject o = json(400, REAL_400);
        check("400 页翻译后仍是合法 JSON", o != null);
        check("400 → errorCode=INVALID_PARAM（不再一律 INTERNAL）",
                "INVALID_PARAM".equals(o.getString("errorCode")), String.valueOf(o.getString("errorCode")));
        String msg = String.valueOf(o.getString("msgInfo"));
        check("400 页带上 description 里的真实原因",
                msg.contains("The request sent by the client was syntactically incorrect."), msg);
        check("400 页不再把原因说成服务端内部错误", !msg.contains("服务端内部错误"), msg);
        check("400 页给的是参数/路径方向的提示", msg.contains("参数") && msg.contains("不要原样重试"), msg);
    }

    /** 真实 404：不能引导模型去"确认对象是否存在"（那是 docId 语义，会误导） */
    private static void testReal404() throws Exception {
        JSONObject o = json(404, REAL_404);
        check("404 → errorCode=INTERNAL（接口不存在≠对象不存在，不冒用 DOC_NOT_FOUND）",
                "INTERNAL".equals(o.getString("errorCode")), String.valueOf(o.getString("errorCode")));
        String msg = String.valueOf(o.getString("msgInfo"));
        check("404 页带上 description 原文", msg.contains("The requested resource is not available."), msg);
        check("404 提示指向接口地址不存在", msg.contains("接口地址不存在"), msg);
        check("404 页不再把原因说成服务端内部错误", !msg.contains("服务端内部错误"), msg);
    }

    /** 500：异常消息是实体形态，必须解码后进上下文，且 JSON 不能被引号破坏 */
    private static void testReal500Entities() throws Exception {
        JSONObject o = json(500, HTML_500);
        check("500 → errorCode=INTERNAL", "INTERNAL".equals(o.getString("errorCode")),
                String.valueOf(o.getString("errorCode")));
        String msg = String.valueOf(o.getString("msgInfo"));
        check("500 的异常消息被解码（<name>）", msg.contains("unexpected tag <name>"), msg);
        check("500 的异常消息被解码（& 与 \"q\"）", msg.contains(" and & and ") && msg.contains("\"q\""), msg);
        check("500 的 msgInfo 里不再有实体残留（&lt;/&amp;/&quot;）",
                !msg.contains("&lt;") && !msg.contains("&amp;") && !msg.contains("&quot;"), msg);
        check("500 提示说明是服务端内部错误", msg.contains("服务端内部错误"), msg);
        check("500 提示不要重试同一调用", msg.contains("不要重试"), msg);
    }

    /** 逐级退化：message → description → h1 正文 → 原文截断 */
    private static void testFallbacks() throws Exception {
        String h1Only = "<html><body><h1>HTTP Status 500 - boom happened</h1></body></html>";
        String msg = String.valueOf(json(500, h1Only).getString("msgInfo"));
        check("无 message/description 时取 h1 里 \" - \" 之后的正文",
                msg.contains("boom happened") && !msg.contains("HTTP Status 500 - boom"), msg);

        String emptyH1 = "<html><body><h1>HTTP Status 400 - </h1></body></html>";
        String msg2 = String.valueOf(json(400, emptyH1).getString("msgInfo"));
        check("h1 无正文时退化为原文截断（不丢成空串）",
                msg2.contains("Apache Tomcat") || msg2.contains("HTTP Status 400"), msg2);

        String text = "Internal Server Error";
        String msg3 = String.valueOf(json(503, text).getString("msgInfo"));
        check("纯文本响应也被带上（非 HTML 时不吞内容）", msg3.contains("Internal Server Error"), msg3);
        check("503 提示为服务端问题", msg3.contains("服务端内部错误"), msg3);
    }

    /** 已经是 JSON 的响应必须原样返回（这条兜底不得改动正常路径） */
    private static void testPassThrough() throws Exception {
        check("已是 JSON 对象 → 原样返回",
                "{\"status\":\"ok\"}".equals(translate(200, "{\"status\":\"ok\"}")));
        check("已是 JSON 数组 → 原样返回",
                "[1,2]".equals(translate(200, "[1,2]")));
        check("空响应体 → 返回空串（不硬造错误）", "".equals(translate(200, "")));
    }

    /** 共用清洗件 HtmlText 的基础行为（R3-12 的 web_search 与 R3-14 共用同一口径） */
    private static void testSharedUtil() {
        check("HtmlText.clean 解常见具名实体 + 数字实体",
                "a b & \u00B7 \u2026".equals(HtmlText.clean("a&nbsp;b &amp; &#183; &hellip;")),
                HtmlText.clean("a&nbsp;b &amp; &#183; &hellip;"));
        check("HtmlText.clean 解十六进制数字实体",
                "\u25CF".equals(HtmlText.clean("&#x25CF;")), HtmlText.clean("&#x25CF;"));
        check("HtmlText.clean 去标签成一行",
                "a b".equals(HtmlText.clean("<p>a</p><p>b</p>")), HtmlText.clean("<p>a</p><p>b</p>"));
        check("HtmlText.clean(null) = 空串（保持旧 stripHtml 语义）", "".equals(HtmlText.clean(null)));
        check("未收录的具名实体原样保留（不丢信息）",
                "&unknown;".equals(HtmlText.decodeEntities("&unknown;")),
                HtmlText.decodeEntities("&unknown;"));
        check("Unicode 空白归一（nbsp/ensp → 空格）",
                "a b c".equals(HtmlText.clean("a\u00A0b\u2002c")), HtmlText.clean("a\u00A0b\u2002c"));
    }

    /** 源码 lint：实体解码只有一份实现，两个消费者都走它（防漂移） */
    private static void testSourceLint() {
        String client = readSource("src/com/DocSystem/agent/client/DocSysClient.java");
        String util = readSource("src/com/DocSystem/agent/util/HtmlText.java");
        check("能读到 DocSysClient/HtmlText 源码（lint 前置）", client != null && util != null);
        if (client == null || util == null) {
            return;
        }
        check("DocSysClient 解错误页时走共用件 HtmlText.clean",
                client.contains("HtmlText.clean(") && client.contains("HtmlText.oneLine("));
        check("DocSysClient 不再自造实体解码（无第二份实现）",
                !client.contains("replaceAll(\"&nbsp;\"") && !client.contains("NAMED_ENTITIES"));
        check("R3-14 记录在案：errorCode 按状态分发", client.contains("errorCodeForHttpStatus("));
        check("处置提示按状态分类（4xx/5xx 两条路径都在）",
                client.contains("statusGuidance(") && client.contains("status >= 500"));
    }

    private static String readSource(String relative) {
        File f = new File(relative);
        if (!f.exists()) {
            f = new File("D:/Dev/DocSys/" + relative);
        }
        if (!f.exists()) {
            return null;
        }
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
