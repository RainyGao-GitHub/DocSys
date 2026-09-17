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

        System.out.println("\n======== TestResolvedLlmConfig: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
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
