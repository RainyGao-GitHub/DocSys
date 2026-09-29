package com.DocSystem.commonService.sms;

/**
 * 短信场景 —— 与 {@code sms.scenes} 里的 key 一一对应。
 *
 * <p>每个场景可配独立模板 ID 与有序列变量名（{@code vars}），
 * 以同时满足三家运营商的变量表达方式：
 * <ul>
 *   <li>云片：{@code #code#=1234}（按变量名）</li>
 *   <li>阿里云：{@code TemplateParam} = {@code {"code":"1234"}}（按变量名）</li>
 *   <li>腾讯云：{@code TemplateParamSet} = {@code ["1234"]}（按 vars 顺序）</li>
 * </ul>
 */
public enum SmsScene {

	REGISTER("register", "注册"),
	RESET_PWD("resetPwd", "找回密码"),
	PHONE_VERIFY("phoneVerify", "手机验证"),
	TEST("test", "测试");

	/** 默认变量名（所有场景的验证码都用 code） */
	public static final String[] DEFAULT_VARS = { "code" };

	private final String code;
	private final String displayName;

	SmsScene(String code, String displayName) {
		this.code = code;
		this.displayName = displayName;
	}

	public String getCode() {
		return code;
	}

	public String getDisplayName() {
		return displayName;
	}

	/** code → 枚举（未知 / 空 → null） */
	public static SmsScene fromCode(String code) {
		if (code == null || code.trim().isEmpty()) {
			return null;
		}
		String trimmed = code.trim();
		for (SmsScene scene : values()) {
			if (scene.code.equals(trimmed)) {
				return scene;
			}
		}
		return null;
	}
}
