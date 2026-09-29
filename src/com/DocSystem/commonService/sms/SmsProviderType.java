package com.DocSystem.commonService.sms;

/**
 * 短信运营商类型。
 *
 * <p>新增一个运营商 = 加一个枚举项 + 一个 Provider 实现（见 M4 的 {@code SmsProvider}）。
 * 配置存在 {@code system_setting} 表里：每个运营商一个 JSON 行（如 {@code sms.aliyun}）。
 */
public enum SmsProviderType {

	/** 云片：签名写在模板内容里，无独立签名字段 */
	YUNPIAN("yunpian", "云片", "https://sms.yunpian.com/v2/sms/tpl_single_send.json", false,
			new String[] { "apikey" }),

	/** 阿里云短信：RPC 接口，签名必填 */
	ALIYUN("aliyun", "阿里云短信", "dysmsapi.aliyuncs.com", true,
			new String[] { "accessKeyId", "accessKeySecret" }),

	/** 腾讯云短信：POST JSON，签名必填 */
	TENCENT("tencent", "腾讯云短信", "sms.tencentcloudapi.com", true,
			new String[] { "secretId", "secretKey", "sdkAppId" }),

	/** 自定义 HTTP：兼容存量 smsServer 配置，参数名与成功判定由用户配置 */
	CUSTOM("custom", "自定义 HTTP", "", false,
			new String[] { "url" });

	private final String code;
	private final String displayName;
	private final String defaultEndpoint;
	private final boolean signNameRequired;
	private final String[] requiredFields;

	SmsProviderType(String code, String displayName, String defaultEndpoint, boolean signNameRequired,
			String[] requiredFields) {
		this.code = code;
		this.displayName = displayName;
		this.defaultEndpoint = defaultEndpoint;
		this.signNameRequired = signNameRequired;
		this.requiredFields = requiredFields;
	}

	public String getCode() {
		return code;
	}

	public String getDisplayName() {
		return displayName;
	}

	public String getDefaultEndpoint() {
		return defaultEndpoint;
	}

	/** 签名（SignName）是否为必填项 */
	public boolean isSignNameRequired() {
		return signNameRequired;
	}

	/** 该运营商必填的配置字段名（用于校验与 UI 必填标记） */
	public String[] getRequiredFields() {
		return requiredFields;
	}

	/** code → 枚举（未知 / 空 → null，调用方需自行处理） */
	public static SmsProviderType fromCode(String code) {
		if (code == null || code.trim().isEmpty()) {
			return null;
		}
		String trimmed = code.trim();
		for (SmsProviderType type : values()) {
			if (type.code.equals(trimmed)) {
				return type;
			}
		}
		return null;
	}
}
