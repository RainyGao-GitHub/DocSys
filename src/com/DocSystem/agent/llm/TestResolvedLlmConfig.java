package com.DocSystem.agent.llm;

/**
 * 多模态预备护栏：{@link ResolvedLlmConfig} 的视觉能力字段。
 *
 * <p>纯 Java 自包含测试（main 入口），不发网络请求、不依赖 Spring。
 * 关注两点：① 旧四参构造的默认值必须保持「无视觉」（不能悄悄改变既有行为）；
 * ② 五参构造能携带能力标记，且 toString 打印它（排障时要能一眼看出本轮走没走视觉路径）。
 */
public class TestResolvedLlmConfig {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) {
        ResolvedLlmConfig legacy = new ResolvedLlmConfig(
                "http://127.0.0.1:9/v1", "deepseek-v4-flash", "sk-test", "flash");
        check("legacy ctor defaults to no-vision", !legacy.supportsVision);
        check("legacy ctor keeps fields", "deepseek-v4-flash".equals(legacy.model)
                && "flash".equals(legacy.displayName));

        ResolvedLlmConfig vision = new ResolvedLlmConfig(
                "http://127.0.0.1:9/v1", "gpt-4o", "sk-test", "4o", true);
        check("vision ctor keeps flag", vision.supportsVision);
        check("vision ctor keeps fields", "gpt-4o".equals(vision.model));

        check("toString shows capability", vision.toString().contains("supportsVision=true"));
        check("toString hides apiKey", vision.toString().contains("***")
                && !vision.toString().contains("sk-test"));

        // openAiCompatible 仍由 endpoint 推导（与本次改动无关的行为，防回归）
        check("openai-compatible still detected",
                new ResolvedLlmConfig("https://api.openai.com/v1", "x", null, "x").openAiCompatible);

        maxTokensField();
        maxTokensParsing();

        System.out.println("\n======== TestResolvedLlmConfig: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    /** 按模型 maxTokens（2026-10-08 接线）：默认 null、可携带、withMaxTokens 复制不共享 */
    private static void maxTokensField() {
        ResolvedLlmConfig none = new ResolvedLlmConfig("http://127.0.0.1:9/v1", "m", "k", "n");
        check("maxTokens defaults to null (→ 全局默认)", none.maxTokens == null);

        ResolvedLlmConfig six = new ResolvedLlmConfig("http://127.0.0.1:9/v1", "m", "k", "n", false,
                Integer.valueOf(4096));
        check("6-arg ctor carries maxTokens",
                six.maxTokens != null && six.maxTokens.intValue() == 4096);
        check("toString shows maxTokens", six.toString().contains("maxTokens=4096"));

        ResolvedLlmConfig esc = six.withMaxTokens(32768);
        check("withMaxTokens: new value", esc.maxTokens.intValue() == 32768);
        check("withMaxTokens: keeps other fields",
                "m".equals(esc.model) && "k".equals(esc.apiKey) && "n".equals(esc.displayName));
        check("withMaxTokens: original untouched", six.maxTokens.intValue() == 4096);
    }

    /** settings → maxTokens 的解析口径：兼容两种键名、越界/非法一律回落 null（绝不抛） */
    private static void maxTokensParsing() {
        check("parse: null settings → null", ResolvedLlmConfig.parseMaxTokens(null) == null);

        com.alibaba.fastjson.JSONObject camel = new com.alibaba.fastjson.JSONObject();
        camel.put("maxTokens", "4096");
        check("parse: maxTokens key", intValue(ResolvedLlmConfig.parseMaxTokens(camel)) == 4096);

        com.alibaba.fastjson.JSONObject snake = new com.alibaba.fastjson.JSONObject();
        snake.put("max_tokens", "8192");
        check("parse: max_tokens alias", intValue(ResolvedLlmConfig.parseMaxTokens(snake)) == 8192);

        com.alibaba.fastjson.JSONObject blank = new com.alibaba.fastjson.JSONObject();
        blank.put("maxTokens", "   ");
        check("parse: blank → null", ResolvedLlmConfig.parseMaxTokens(blank) == null);

        com.alibaba.fastjson.JSONObject bad = new com.alibaba.fastjson.JSONObject();
        bad.put("maxTokens", "abc");
        check("parse: non-numeric → null (不抛)", ResolvedLlmConfig.parseMaxTokens(bad) == null);

        com.alibaba.fastjson.JSONObject tiny = new com.alibaba.fastjson.JSONObject();
        tiny.put("maxTokens", "1");
        check("parse: below MIN → null", ResolvedLlmConfig.parseMaxTokens(tiny) == null);

        com.alibaba.fastjson.JSONObject huge = new com.alibaba.fastjson.JSONObject();
        huge.put("maxTokens", "99999999");
        check("parse: above MAX → null", ResolvedLlmConfig.parseMaxTokens(huge) == null);

        check("parse: JSON text (用户自定义模型表存的字符串)",
                intValue(ResolvedLlmConfig.parseMaxTokensFromJson("{\"maxTokens\":\"2048\"}")) == 2048);
        check("parse: broken JSON text → null",
                ResolvedLlmConfig.parseMaxTokensFromJson("{oops") == null);
        check("parse: empty JSON text → null", ResolvedLlmConfig.parseMaxTokensFromJson("") == null);
    }

    private static int intValue(Integer v) {
        return v == null ? -1 : v.intValue();
    }

    private static void check(String name, boolean ok) {
        if (ok) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }
}
