package com.DocSystem.agent.llm;

import com.alibaba.fastjson.JSONObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import okhttp3.OkHttpClient;

/**
 * T7.1.1 真流式时序护栏：用本地 HTTP 服务器模拟 OpenAI SSE 流（每分片延迟 250ms），
 * 验证 {@link LLMService#streamChatChunks} 返回的迭代器是【渐进到达】而非【一次性缓冲后爆发】。
 *
 * <p>通过反射注入 LLMService 私有字段（endpoint/model/apiKey/httpClient），无 Spring 依赖。</p>
 */
public class TestStreamChatChunks {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testProgressiveStreaming();
        testReasoningSeparationInStream();
        testErrorStatusThrows();
        testOutputTruncatedFlagFromSse();
        testPerModelMaxTokensInRequestBody();
        System.out.println("\n======== TestStreamChatChunks: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    /** 带 detail 的断言（失败时打印实际请求体里的 max_tokens，便于定位） */
    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null ? "" : "  -> " + detail));
        }
    }

    /** 构造一个可用的 LLMService（反射注入私有字段） */
    private static LLMService newLlmService() throws Exception {
        LLMService svc = new LLMService();
        setField(svc, "endpoint", "http://127.0.0.1:1");
        setField(svc, "defaultModel", "test-model");
        setField(svc, "apiKey", "");
        setField(svc, "temperature", 0.7);
        setField(svc, "maxTokens", 2048);
        setField(svc, "connectTimeout", 30);
        setField(svc, "chatTimeout", 60);
        setField(svc, "embeddingTimeout", 10);
        setField(svc, "backupEndpoint", "");
        setField(svc, "backupModel", "");
        setField(svc, "hasBackup", false);
        setField(svc, "httpClient", new OkHttpClient());
        return svc;
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }

    private static List<Map<String, String>> messages(String content) {
        List<Map<String, String>> msgs = new ArrayList<>();
        Map<String, String> sys = new HashMap<>();
        sys.put("role", "system");
        sys.put("content", "test system");
        msgs.add(sys);
        Map<String, String> user = new HashMap<>();
        user.put("role", "user");
        user.put("content", content);
        msgs.add(user);
        return msgs;
    }

    /** 模拟 OpenAI SSE 服务器：每分片间隔 delayMs，先 reasoning 后 text，最后 [DONE] */
    private static HttpServer startSseServer(int delayMs, boolean includeReasoning) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
            exchange.getResponseHeaders().set("Transfer-Encoding", "chunked");
            exchange.sendResponseHeaders(200, 0);
            OutputStream out = exchange.getResponseBody();
            try {
                if (includeReasoning) {
                    sendSseLine(out, reasoningChunk("思考"));
                    Thread.sleep(delayMs);
                    sendSseLine(out, reasoningChunk("中"));
                    Thread.sleep(delayMs);
                }
                sendSseLine(out, textChunk("你"));
                Thread.sleep(delayMs);
                sendSseLine(out, textChunk("好"));
                Thread.sleep(delayMs);
                sendSseLine(out, textChunk("！"));
                Thread.sleep(delayMs);
                sendSseLine(out, doneChunk());
                out.flush();
            } catch (Exception e) {
                // ignore
            } finally {
                try { out.close(); } catch (Exception ignored) {}
            }
        });
        server.start();
        return server;
    }

    private static void sendSseLine(OutputStream out, String data) throws Exception {
        out.write(("data: " + data + "\n\n").getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    private static String textChunk(String content) {
        JSONObject delta = new JSONObject();
        delta.put("content", content);
        JSONObject choice = new JSONObject();
        choice.put("delta", delta);
        choice.put("finish_reason", null);
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    private static String reasoningChunk(String content) {
        JSONObject delta = new JSONObject();
        delta.put("reasoning_content", content);
        JSONObject choice = new JSONObject();
        choice.put("delta", delta);
        choice.put("finish_reason", null);
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    private static String doneChunk() {
        JSONObject delta = new JSONObject();
        JSONObject choice = new JSONObject();
        choice.put("delta", delta);
        choice.put("finish_reason", "stop");
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    private static void testProgressiveStreaming() throws Exception {
        int delayMs = 250;
        HttpServer server = startSseServer(delayMs, false);
        try {
            int port = server.getAddress().getPort();
            LLMService svc = newLlmService();
            ResolvedLlmConfig resolved = new ResolvedLlmConfig(
                    "http://127.0.0.1:" + port + "/v1/proxy", "test-model", null, "test");

            long t0 = System.currentTimeMillis();
            Iterator<StreamChunk> it = svc.streamChatChunks(messages("hi"), resolved);

            List<Long> arrivalMs = new ArrayList<>();
            List<String> texts = new ArrayList<>();
            while (it.hasNext()) {
                StreamChunk c = it.next();
                if (c.isDone()) break;
                arrivalMs.add(System.currentTimeMillis() - t0);
                if (c.isText()) texts.add(c.content);
            }
            long total = System.currentTimeMillis() - t0;

            // 3 个 text 分片，每个间隔 250ms
            check("progressive: 3 text chunks received", texts.size() == 3);
            check("progressive: content correct", texts.toString().equals("[你, 好, ！]"));
            // 关键：分片是渐进到达的（第 3 片到达时间应 ≥ 2*delayMs，且第 1 片远早于总耗时）
            check("progressive: first chunk arrived early (t1 < 400ms)", arrivalMs.get(0) < 400);
            check("progressive: last chunk arrived late (t3 >= 500ms)", arrivalMs.get(2) >= 2L * delayMs);
            check("progressive: total elapsed >= 700ms (not burst)", total >= 3L * delayMs - 100);
            System.out.println("  [timing] arrivals(ms)=" + arrivalMs + " total=" + total + "ms");
        } finally {
            server.stop(0);
        }
    }

    private static void testReasoningSeparationInStream() throws Exception {
        int delayMs = 200;
        HttpServer server = startSseServer(delayMs, true);
        try {
            int port = server.getAddress().getPort();
            LLMService svc = newLlmService();
            ResolvedLlmConfig resolved = new ResolvedLlmConfig(
                    "http://127.0.0.1:" + port + "/v1/proxy", "test-model", null, "test");

            Iterator<StreamChunk> it = svc.streamChatChunks(messages("hi"), resolved);
            List<String> reasoning = new ArrayList<>();
            List<String> texts = new ArrayList<>();
            while (it.hasNext()) {
                StreamChunk c = it.next();
                if (c.isDone()) break;
                if (c.isReasoning()) reasoning.add(c.content);
                if (c.isText()) texts.add(c.content);
            }
            check("reasoning: 2 reasoning chunks", reasoning.size() == 2);
            check("reasoning: content correct", reasoning.toString().equals("[思考, 中]"));
            check("reasoning: separated from text", texts.toString().equals("[你, 好, ！]"));
        } finally {
            server.stop(0);
        }
    }

    private static void testErrorStatusThrows() throws Exception {
        // 非 200 → 抛异常（调用方回退非流式）
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            byte[] body = "{\"error\":\"bad\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(500, body.length);
            OutputStream out = exchange.getResponseBody();
            out.write(body);
            out.close();
        });
        server.start();
        try {
            int port = server.getAddress().getPort();
            LLMService svc = newLlmService();
            ResolvedLlmConfig resolved = new ResolvedLlmConfig(
                    "http://127.0.0.1:" + port + "/v1/proxy", "test-model", null, "test");
            boolean threw = false;
            try {
                svc.streamChatChunks(messages("hi"), resolved);
            } catch (Exception e) {
                threw = true;
            }
            check("error-status: throws (caller can fallback)", threw);
        } finally {
            server.stop(0);
        }
    }

    /** finish_reason=length（撞上 max_tokens 上限）：正文为空 —— "无声停下"的最常见形态 */
    private static String lengthChunk() {
        JSONObject delta = new JSONObject();
        JSONObject choice = new JSONObject();
        choice.put("delta", delta);
        choice.put("finish_reason", "length");
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    /**
     * 2026-10-08：`finish_reason=length` 必须产出 {@link StreamChunk#TYPE_OUTPUT_TRUNCATED} 标记块 ——
     * 推理模型思考吃光 max_tokens 时正文为空，上层只有拿到这个标记才不会把"空正文"当最终回答
     * （先例：桌面整理任务无声停下 5 次，见 DevAgentControl/CURRENT_STATE_agent任务中途停止.md）。
     */
    private static void testOutputTruncatedFlagFromSse() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
            exchange.sendResponseHeaders(200, 0);
            OutputStream out = exchange.getResponseBody();
            try {
                sendSseLine(out, reasoningChunk("思考很长很长的"));
                sendSseLine(out, reasoningChunk("还没写完就撞上限了"));
                sendSseLine(out, lengthChunk());
                sendSseLine(out, "[DONE]");
                out.flush();
            } catch (Exception ignored) {
            } finally {
                try { out.close(); } catch (Exception ignored) {}
            }
        });
        server.start();
        try {
            int port = server.getAddress().getPort();
            LLMService svc = newLlmService();
            ResolvedLlmConfig resolved = new ResolvedLlmConfig(
                    "http://127.0.0.1:" + port + "/v1/proxy", "test-model", null, "test");

            Iterator<StreamChunk> it = svc.streamChatChunks(messages("hi"), resolved);
            int markers = 0;
            int textChunks = 0;
            int reasoningChunks = 0;
            boolean doneSeen = false;
            while (it.hasNext()) {
                StreamChunk c = it.next();
                if (c.isOutputTruncated()) markers++;
                if (c.isText()) textChunks++;
                if (c.isReasoning()) reasoningChunks++;
                if (c.isDone()) { doneSeen = true; break; }
            }
            check("truncated-flag: marker emitted once", markers == 1);
            check("truncated-flag: no text chunk (blank content)", textChunks == 0);
            check("truncated-flag: reasoning still streamed", reasoningChunks == 2);
            check("truncated-flag: done still emitted", doneSeen);
        } finally {
            server.stop(0);
        }
    }

    /**
     * D1（2026-10-08）：按模型配置的 maxTokens 必须**真的出现在请求体里**。
     * 此前它只存在库里/配置串里，请求体永远发全局默认值 —— 这就是"高级参数存了也没用"。
     * 这里用本地假服务端**抓住真实请求体**断言（生产走的是 streamChatChunksNative）。
     */
    private static void testPerModelMaxTokensInRequestBody() throws Exception {
        final StringBuilder captured = new StringBuilder();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            try {
                byte[] buf = new byte[8192];
                java.io.InputStream in = exchange.getRequestBody();
                int n;
                while ((n = in.read(buf)) > 0) {
                    captured.append(new String(buf, 0, n, StandardCharsets.UTF_8));
                }
            } catch (Exception ignored) {
            }
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
            exchange.sendResponseHeaders(200, 0);
            OutputStream out = exchange.getResponseBody();
            try {
                sendSseLine(out, textChunk("ok"));
                sendSseLine(out, doneChunk());
                out.flush();
            } catch (Exception ignored) {
            } finally {
                try { out.close(); } catch (Exception ignored) {}
            }
        });
        server.start();
        try {
            int port = server.getAddress().getPort();
            LLMService svc = newLlmService();     // 全局默认 maxTokens = 2048
            String base = "http://127.0.0.1:" + port + "/v1/proxy";

            // ① 模型配了 maxTokens → 请求体用它（不是全局默认）
            drain(svc.streamChatChunksNative(nativeMessages("hi"),
                    new ResolvedLlmConfig(base, "test-model", null, "test", false, Integer.valueOf(4096)),
                    null, null));
            check("per-model maxTokens wins in request body",
                    hasMaxTokens(captured.toString(), 4096), maxTokensOf(captured.toString()));

            // ② 模型没配 → 回落全局默认
            captured.setLength(0);
            drain(svc.streamChatChunksNative(nativeMessages("hi"),
                    new ResolvedLlmConfig(base, "test-model", null, "test"), null, null));
            check("falls back to global default when model has none",
                    hasMaxTokens(captured.toString(), 2048), maxTokensOf(captured.toString()));
        } finally {
            server.stop(0);
        }
    }

    private static List<Map<String, Object>> nativeMessages(String content) {
        List<Map<String, Object>> msgs = new ArrayList<>();
        Map<String, Object> user = new HashMap<>();
        user.put("role", "user");
        user.put("content", content);
        msgs.add(user);
        return msgs;
    }

    /** 把流读干净（不关心内容），确保请求真的发出去了 */
    private static void drain(Iterator<StreamChunk> it) {
        while (it.hasNext()) {
            if (it.next().isDone()) {
                break;
            }
        }
    }

    private static String maxTokensOf(String body) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\"max_tokens\"\\s*:\\s*(\\d+)").matcher(body);
        return m.find() ? m.group(1) : "<absent>";
    }

    private static boolean hasMaxTokens(String body, int expected) {
        return String.valueOf(expected).equals(maxTokensOf(body));
    }
}
