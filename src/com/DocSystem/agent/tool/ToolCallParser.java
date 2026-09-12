package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 工具调用解析器 —— 解析 LLM 输出中的 {@code <tool_call>...</tool_call>} 块。
 *
 * <p>格式约定（与 ToolPromptBuilder 渲染的提示词一致）：</p>
 * <pre>
 * &lt;tool_call&gt;{"name":"list_repos","arguments":{}}&lt;/tool_call&gt;
 * </pre>
 *
 * <p>容错策略：</p>
 * <ul>
 *   <li>LLM 输出多个 tool_call（多工具并行）→ 返回全部（按出现顺序）。</li>
 *   <li>JSON 解析失败 → 返回 null，由上层把原文回灌给 LLM 提示重试。</li>
 *   <li>缺失 name → 返回 null（视为无效调用，回灌重试）。</li>
 * </ul>
 *
 * <p>对应开发计划 T1.5。</p>
 */
public class ToolCallParser {

    private static final Logger log = LoggerFactory.getLogger(ToolCallParser.class);

    /**
     * 匹配 tool_call 块（非贪婪，支持跨行）。
     * 兼容两种形态：
     *  1) 单数：&lt;tool_call&gt;{"name":"...","arguments":{}}&lt;/tool_call&gt;
     *  2) 复数包装（Anthropic 风格）：&lt;tool_calls&gt;\n{"name":"..."}\n&lt;/tool_calls&gt;
     */
    private static final Pattern TOOL_CALL_PATTERN =
            Pattern.compile("<(tool_call|tool_calls)>(.*?)</(tool_call|tool_calls)>", Pattern.DOTALL);

    /** T9.1：模型漂移格式 <functions><invoke name="x"><parameter name="k">v</parameter></invoke></functions>
     *  兼容变体：<functions calls>（模型把 "function calls" 写成带空格标签）、<function_calls>、<calls>（T9.3） */
    private static final Pattern FUNCTIONS_PATTERN =
            Pattern.compile("<\\s*(functions\\b[^>]*|function_calls\\b[^>]*|calls\\b[^>]*)>(.*?)</\\s*(functions|function_calls|calls)>", Pattern.DOTALL);

    /** <invoke> 元素（含 name 属性）；容忍标签内空格（< invoke name=...>） */
    private static final Pattern INVOKE_PATTERN =
            Pattern.compile("<\\s*invoke\\s+name=[\"']([^\"']+)[\"'][^>]*>([\\s\\S]*?)</\\s*invoke>", Pattern.DOTALL);

    /**
     * T9.3：部分 LLM 网关会把输出中的 {@code <} 与 {@code </} 转义为 {@code <｜DSML｜} 与 {@code </｜DSML｜}
     * （全角竖线包裹，实测形如 {@code <｜DSML｜ calls>}、{@code </｜DSML｜ invoke>}），
     * 导致工具调用标记无法识别。解析前先归一化：
     * <ol>
     *   <li>{@code </｜DSML｜} → {@code </}，{@code <｜DSML｜} → {@code <}</li>
     *   <li>折叠紧跟 {@code <}/{@code </} 之后的空白（{@code < invoke} → {@code <invoke}）</li>
     * </ol>
     * 仅用于匹配，不影响返回给用户的原文。
     */
    public static String normalizeEscapedMarkup(String output) {
        if (output == null || output.isEmpty()) {
            return output;
        }
        String s = output;
        if (s.contains("｜DSML｜")) {
            s = s.replace("</｜DSML｜", "</").replace("<｜DSML｜", "<");
        }
        return s.replaceAll("<\\s+", "<").replaceAll("</\\s+", "</");
    }

    /**
     * 解析 LLM 输出中的全部工具调用。
     *
     * @param output LLM 原始输出
     * @return 工具调用列表（可能为空 → 表示无工具调用，输出即最终回答）；
     *         若输出含 tool_call 标记但全部解析失败 → 返回 null（调用方应回灌重试）
     */
    public static List<ToolCall> parse(String output) {
        if (output == null || output.isEmpty()) {
            return new ArrayList<>();
        }

        // T9.3：网关转义归一化（｜DSML｜ → <），后续匹配一律用 normalized
        String normalized = normalizeEscapedMarkup(output);

        List<ToolCall> calls = new ArrayList<>();
        boolean sawMarker = false;
        boolean anyInvalid = false;

        // 格式 1：<tool_call>{"name":...}</tool_call>（含复数 <tool_calls>）
        Matcher m = TOOL_CALL_PATTERN.matcher(normalized);
        while (m.find()) {
            sawMarker = true;
            String body = m.group(2).trim();
            ToolCall call = parseOne(body, output);
            if (call == null) {
                anyInvalid = true;
            } else {
                calls.add(call);
            }
        }

        // 格式 2（T9.1）：<functions><invoke name="x">...</invoke></functions>（deepseek-v4 等模型漂移格式）
        if (!sawMarker) {
            Matcher fm = FUNCTIONS_PATTERN.matcher(normalized);
            while (fm.find()) {
                sawMarker = true;
                Matcher im = INVOKE_PATTERN.matcher(fm.group(2));
                boolean foundInvoke = false;
                while (im.find()) {
                    foundInvoke = true;
                    ToolCall call = parseAnthropicXml(im.group(0), normalized);
                    if (call == null) {
                        anyInvalid = true;
                    } else {
                        calls.add(call);
                    }
                }
                if (!foundInvoke) {
                    anyInvalid = true;
                }
            }
        }

        // T9.1 诊断（写 docsys.log，与 [ToolUseLoop][STEP] 同渠道，便于线上排障）
        if (!sawMarker) {
            if (looksLikeMalformedToolCall(normalized)) {
                com.DocSystem.common.Log.info("[ToolCallParser] 检测到工具调用标记但无法解析(畸形), 长度=" + output.length()
                        + " 首段=[" + normalized.substring(0, Math.min(200, normalized.length())) + "]");
                return null;
            }
            // 无任何工具调用标记 → 视为最终回答
            return new ArrayList<>();
        }
        if (anyInvalid && calls.isEmpty()) {
            com.DocSystem.common.Log.info("[ToolCallParser] 有标记但全部解析失败(畸形), 长度=" + output.length()
                    + " 首段=[" + normalized.substring(0, Math.min(200, normalized.length())) + "]");
            return null;
        }
        if (anyInvalid) {
            log.warn("ToolCallParser: some tool_call blocks were invalid, using {} valid calls", calls.size());
        }
        com.DocSystem.common.Log.info("[ToolCallParser] 解析到 " + calls.size() + " 个工具调用: "
                + (calls.isEmpty() ? "(无)" : calls.get(0).name));
        return calls;
    }

    /**
     * 判断输出中是否含工具调用标记（tool_call 或 functions）。
     */
    public static boolean containsToolCall(String output) {
        if (output == null) {
            return false;
        }
        String normalized = normalizeEscapedMarkup(output);
        return TOOL_CALL_PATTERN.matcher(normalized).find()
                || FUNCTIONS_PATTERN.matcher(normalized).find();
    }

    /** 输出里出现疑似工具调用标记但未解析出完整块（关闭标签写错/被截断/复数未闭合等） */
    private static boolean looksLikeMalformedToolCall(String output) {
        return output != null && (
                output.contains("<tool_call")
                || output.contains("<tool_calls")
                || output.contains("</tool_call>")
                || output.contains("</tool_calls>")
                || output.contains("<functions")
                || output.contains("<function")                || output.contains("<calls")                || output.contains("<invoke ")
                || output.contains("</invoke>"));
    }

    private static ToolCall parseOne(String body, String rawOutput) {
        // 优先 JSON 格式：<tool_call>{"name":"...","arguments":{...}}</tool_call>
        try {
            JSONObject obj = JSON.parseObject(body);
            if (obj == null) {
                return null;
            }
            String name = obj.getString("name");
            if (name == null || name.trim().isEmpty()) {
                log.warn("ToolCallParser: tool_call missing 'name': {}", body);
                return null;
            }
            Object argsObj = obj.get("arguments");
            JSONObject args;
            if (argsObj == null) {
                args = new JSONObject();
            } else if (argsObj instanceof JSONObject) {
                args = (JSONObject) argsObj;
            } else {
                // arguments 是字符串或其它 → 尝试解析为 JSON
                try {
                    args = JSON.parseObject(argsObj.toString());
                } catch (JSONException e) {
                    log.warn("ToolCallParser: arguments not a JSON object: {}", body);
                    args = new JSONObject();
                }
            }
            return new ToolCall(name.trim(), args, rawOutput);
        } catch (JSONException e) {
            // T5.3：模型偶发输出 Anthropic/Claude XML 格式 <invoke name="x"><parameter name="k">v</parameter></invoke>
            ToolCall xmlCall = parseAnthropicXml(body, rawOutput);
            if (xmlCall != null) {
                log.warn("ToolCallParser: fell back to Anthropic XML format for: {}", body);
                return xmlCall;
            }
            log.warn("ToolCallParser: invalid JSON in tool_call: {}", body);
            return null;
        }
    }

    /**
     * T5.3 容错：解析 Anthropic/Claude 风格工具调用。
     * <pre>
     * &lt;invoke name="list_docs"&gt;
     *   &lt;parameter name="vid"&gt;8&lt;/parameter&gt;
     * &lt;/invoke&gt;
     * </pre>
     * 或 &lt;parameters&gt;{"vid":8}&lt;/parameters&gt; 形式。
     */
    private static ToolCall parseAnthropicXml(String body, String rawOutput) {
        try {
            Matcher invoke = Pattern.compile("<\\s*invoke\\s+name=[\"']([^\"']+)[\"'][^>]*>", Pattern.DOTALL).matcher(body);
            if (!invoke.find()) {
                return null;
            }
            String name = invoke.group(1).trim();
            if (name.isEmpty()) {
                return null;
            }
            JSONObject args = new JSONObject();
            // 形式 1：<parameter name="k">v</parameter>
            Matcher pm = Pattern.compile(
                    "<\\s*parameter\\s+name=[\"']([^\"']+)[\"'][^>]*>([\\s\\S]*?)</\\s*parameter>", Pattern.DOTALL)
                    .matcher(body);
            while (pm.find()) {
                String key = pm.group(1).trim();
                String val = pm.group(2).trim();
                if (key.isEmpty()) continue;
                putXmlParam(args, key, val);
            }
            // T9.1：单参数 arguments=<JSON> 时解包为参数对象（write_file 等工具按此传参）
            if (args.size() == 1 && args.containsKey("arguments")) {
                Object raw = args.get("arguments");
                if (raw instanceof String) {
                    try {
                        JSONObject parsedArgs = JSON.parseObject((String) raw);
                        if (parsedArgs != null) {
                            args = parsedArgs;
                        }
                    } catch (JSONException ignored) {
                        // 非 JSON，保持 arguments=字符串
                    }
                }
            }
            // 形式 2：<parameters>{...}</parameters>
            if (args.isEmpty()) {
                Matcher pj = Pattern.compile("<\\s*parameters>([\\s\\S]*?)</\\s*parameters>", Pattern.DOTALL).matcher(body);
                if (pj.find()) {
                    try {
                        JSONObject parsed = JSON.parseObject(pj.group(1).trim());
                        if (parsed != null) {
                            args.putAll(parsed);
                        }
                    } catch (JSONException ignored) {}
                }
            }
            return new ToolCall(name, args, rawOutput);
        } catch (Exception e) {
            log.warn("ToolCallParser: failed to parse Anthropic XML tool_call: {}", body);
            return null;
        }
    }

    /** 把 XML 参数值按语义放入 JSON（数字/布尔自动转换，其余为字符串） */
    private static void putXmlParam(JSONObject args, String key, String val) {
        if ("null".equals(val)) {
            return;
        }
        // 数字
        try {
            if (val.matches("-?\\d+")) {
                args.put(key, Long.parseLong(val));
                return;
            }
            if (val.matches("-?\\d+\\.\\d+")) {
                args.put(key, Double.parseDouble(val));
                return;
            }
        } catch (NumberFormatException ignored) {}
        // 布尔
        if ("true".equals(val) || "false".equals(val)) {
            args.put(key, Boolean.parseBoolean(val));
            return;
        }
        args.put(key, val);
    }

    /**
     * 便捷：解析单个 tool_call 并取第一个（用于单工具场景）。
     *
     * @return 第一个有效调用；无调用或全无效 → null
     */
    public static ToolCall parseFirst(String output) {
        List<ToolCall> calls = parse(output);
        if (calls == null || calls.isEmpty()) {
            return null;
        }
        return calls.get(0);
    }
}
