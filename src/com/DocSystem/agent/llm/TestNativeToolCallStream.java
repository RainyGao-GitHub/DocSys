package com.DocSystem.agent.llm;

import com.DocSystem.agent.tool.ToolCall;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import okhttp3.OkHttpClient;

/**
 * T10 护栏：LLMService 原生工具调用通道。
 *
 * <p>本地 HttpServer 模拟 OpenAI 兼容端点：
 * <ul>
 *   <li>流式 delta.tool_calls 分片聚合（跨分片 arguments 拼接、双工具交错）</li>
 *   <li>带 tools 请求 400 → 去 tools 重试 + tools_rejected 标记块</li>
 *   <li>非流式 message.tool_calls 解析 + 400 重试</li>
 * </ul>
 */
public class TestNativeToolCallStream {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        testStreamToolCallAssembly();
        testStreamToolsRejectedRetry();
        testChatNativeToolCalls();
        testChatNative400RetryWithoutTools();
        System.out.println("\n======== TestNativeToolCallStream: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
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

    private static ResolvedLlmConfig resolvedFor(int port) {
        return new ResolvedLlmConfig("http://127.0.0.1:" + port + "/v1/proxy", "test-model", null, "test");
    }

    private static JSONArray tools() {
        JSONObject fn = new JSONObject();
        fn.put("name", "list_repos");
        fn.put("description", "列出仓库");
        fn.put("parameters", new JSONObject());
        JSONObject item = new JSONObject();
        item.put("type", "function");
        item.put("function", fn);
        JSONArray arr = new JSONArray();
        arr.add(item);
        return arr;
    }

    /** 读请求体字符串（用于断言 tools 是否随请求下发） */
    private static String readBody(HttpExchange exchange) throws java.io.IOException {
        InputStream in = exchange.getRequestBody();
        byte[] buf = new byte[8192];
        StringBuilder sb = new StringBuilder();
        int n;
        while ((n = in.read(buf)) > 0) {
            sb.append(new String(buf, 0, n, StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    // ---------- 1. 流式 delta.tool_calls 聚合 ----------

    private static void testStreamToolCallAssembly() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
            exchange.getResponseHeaders().set("Transfer-Encoding", "chunked");
            exchange.sendResponseHeaders(200, 0);
            OutputStream out = exchange.getResponseBody();
            try {
                sendLine(out, sseDelta("好", null));
                sendLine(out, sseDelta("", tcFrag(0, "call_a", "list_repos", "")));
                sendLine(out, sseDelta("", tcFrag(0, null, null, "{\"vid\":")));
                sendLine(out, sseDelta("", tcFrag(0, null, null, "1}")));
                sendLine(out, sseDelta("。", null));
                sendLine(out, sseDone());
                out.flush();
            } finally {
                out.close();
            }
        });
        server.start();
        try {
            LLMService svc = newLlmService();
            Iterator<StreamChunk> it = svc.streamChatChunksNative(msgList(), resolvedFor(server.getAddress().getPort()),
                    tools(), "auto");

            List<String> texts = new ArrayList<>();
            List<ToolCall> calls = new ArrayList<>();
            boolean doneSeen = false;
            while (it.hasNext()) {
                StreamChunk c = it.next();
                if (c.isDone()) { doneSeen = true; break; }
                if (c.isText()) texts.add(c.content);
                if (c.isToolCall()) calls.add(c.toolCall);
            }
            check("stream: text assembled", texts.toString().equals("[好, 。]"));
            check("stream: 1 tool_call chunk", calls.size() == 1);
            check("stream: tool_call id", calls.size() == 1 && "call_a".equals(calls.get(0).id));
            check("stream: tool_call name", calls.size() == 1 && "list_repos".equals(calls.get(0).name));
            check("stream: args split-across-chunks joined",
                    calls.size() == 1 && calls.get(0).arguments != null
                            && calls.get(0).arguments.getIntValue("vid") == 1);
            check("stream: tool_call before done", doneSeen && calls.size() == 1);
        } finally {
            server.stop(0);
        }
    }

    private static JSONObject tcFrag(Integer index, String id, String name, String args) {
        JSONObject fn = new JSONObject();
        if (name != null) fn.put("name", name);
        if (args != null) fn.put("arguments", args);
        JSONObject tc = new JSONObject();
        if (index != null) tc.put("index", index);
        if (id != null) tc.put("id", id);
        tc.put("type", "function");
        tc.put("function", fn);
        return tc;
    }

    private static String sseDelta(String content, JSONObject toolCall) {
        JSONObject delta = new JSONObject();
        if (content != null) delta.put("content", content);
        if (toolCall != null) delta.put("tool_calls", new Object[]{toolCall});
        JSONObject choice = new JSONObject();
        choice.put("delta", delta);
        choice.put("finish_reason", null);
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    private static String sseDone() {
        JSONObject choice = new JSONObject();
        choice.put("delta", new JSONObject());
        choice.put("finish_reason", "stop");
        JSONObject obj = new JSONObject();
        obj.put("choices", new Object[]{choice});
        return obj.toJSONString();
    }

    private static void sendLine(OutputStream out, String data) throws java.io.IOException {
        out.write(("data: " + data + "\n\n").getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    private static List<Map<String, Object>> msgList() {
        List<Map<String, Object>> msgs = new ArrayList<>();
        java.util.Map<String, Object> sys = new java.util.HashMap<>();
        sys.put("role", "system");
        sys.put("content", "test");
        msgs.add(sys);
        java.util.Map<String, Object> user = new java.util.HashMap<>();
        user.put("role", "user");
        user.put("content", "hi");
        msgs.add(user);
        return msgs;
    }

    // ---------- 2. 流式 400 拒绝 → 去 tools 重试 + 标记块 ----------

    private static void testStreamToolsRejectedRetry() throws Exception {
        final AtomicInteger requests = new AtomicInteger();
        final List<String> bodies = new ArrayList<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            int n = requests.incrementAndGet();
            bodies.add(readBody(exchange));
            if (n == 1) {
                byte[] err = "{\"error\":\"Thinking mode does not support tool_choice\"}".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(400, err.length);
                OutputStream out = exchange.getResponseBody();
                out.write(err);
                out.close();
            } else {
                exchange.getResponseHeaders().set("Content-Type", "text/event-stream");
                exchange.getResponseHeaders().set("Transfer-Encoding", "chunked");
                exchange.sendResponseHeaders(200, 0);
                OutputStream out = exchange.getResponseBody();
                try {
                    sendLine(out, sseDelta("纯文本回答", null));
                    sendLine(out, sseDone());
                } finally {
                    out.close();
                }
            }
        });
        server.start();
        try {
            LLMService svc = newLlmService();
            Iterator<StreamChunk> it = svc.streamChatChunksNative(msgList(), resolvedFor(server.getAddress().getPort()),
                    tools(), "auto");
            boolean rejectedSeen = false;
            StringBuilder text = new StringBuilder();
            boolean doneSeen = false;
            while (it.hasNext()) {
                StreamChunk c = it.next();
                if (c.isDone()) { doneSeen = true; break; }
                if (c.isToolsRejected()) rejectedSeen = true;
                if (c.isText()) text.append(c.content);
            }
            check("reject-retry: 2 requests (400 → retry)", requests.get() == 2);
            check("reject-retry: first request had tools", bodies.get(0).contains("\"tools\""));
            check("reject-retry: second request had NO tools", !bodies.get(1).contains("\"tools\""));
            check("reject-retry: tools_rejected marker first", rejectedSeen);
            check("reject-retry: text from retried stream", text.toString().equals("纯文本回答"));
            check("reject-retry: done seen", doneSeen);
        } finally {
            server.stop(0);
        }
    }

    // ---------- 3. 非流式 message.tool_calls 解析 ----------

    private static void testChatNativeToolCalls() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            JSONObject fn = new JSONObject();
            fn.put("name", "list_repos");
            fn.put("arguments", "{}");
            JSONObject tc = new JSONObject();
            tc.put("id", "call_9");
            tc.put("type", "function");
            tc.put("function", fn);
            JSONObject msg = new JSONObject();
            msg.put("role", "assistant");
            msg.put("content", "调用工具");
            msg.put("tool_calls", new Object[]{tc});
            JSONObject choice = new JSONObject();
            choice.put("message", msg);
            JSONObject obj = new JSONObject();
            obj.put("choices", new Object[]{choice});
            byte[] body = obj.toJSONString().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            OutputStream out = exchange.getResponseBody();
            out.write(body);
            out.close();
        });
        server.start();
        try {
            LLMService svc = newLlmService();
            LlmTurnResult r = svc.chatNative(msgList(), resolvedFor(server.getAddress().getPort()), tools(), "auto");
            check("chatNative: text present", "调用工具".equals(r.text));
            check("chatNative: 1 native call", r.hasNativeCalls() && r.nativeToolCalls.size() == 1);
            check("chatNative: call id", r.nativeToolCalls.get(0).id.equals("call_9"));
            check("chatNative: call name", r.nativeToolCalls.get(0).name.equals("list_repos"));
            check("chatNative: toolsRejected=false", !r.toolsRejected);
        } finally {
            server.stop(0);
        }
    }

    // ---------- 4. 非流式 400 → 去 tools 重试 ----------

    private static void testChatNative400RetryWithoutTools() throws Exception {
        final AtomicInteger requests = new AtomicInteger();
        final List<String> bodies = new ArrayList<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/proxy/v1/chat/completions", exchange -> {
            int n = requests.incrementAndGet();
            bodies.add(readBody(exchange));
            if (n == 1) {
                byte[] err = "{\"error\":\"bad tools\"}".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(400, err.length);
                OutputStream out = exchange.getResponseBody();
                out.write(err);
                out.close();
            } else {
                JSONObject msg = new JSONObject();
                msg.put("role", "assistant");
                msg.put("content", "好的，直接回答");
                JSONObject choice = new JSONObject();
                choice.put("message", msg);
                JSONObject obj = new JSONObject();
                obj.put("choices", new Object[]{choice});
                byte[] body = obj.toJSONString().getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, body.length);
                OutputStream out = exchange.getResponseBody();
                out.write(body);
                out.close();
            }
        });
        server.start();
        try {
            LLMService svc = newLlmService();
            LlmTurnResult r = svc.chatNative(msgList(), resolvedFor(server.getAddress().getPort()), tools(), "auto");
            check("chatNative400: 2 requests", requests.get() == 2);
            check("chatNative400: first had tools", bodies.get(0).contains("\"tools\""));
            check("chatNative400: second had NO tools", !bodies.get(1).contains("\"tools\""));
            check("chatNative400: toolsRejected=true", r.toolsRejected);
            check("chatNative400: text from retry", "好的，直接回答".equals(r.text));
            check("chatNative400: no native calls", !r.hasNativeCalls());
        } finally {
            server.stop(0);
        }
    }
}
