package com.DocSystem.commonService.mail;

/**
 * 邮件发信方式（供应商）。
 *
 * <p>与短信的 {@code SmsProviderType} 同一套路：枚举即「下拉选项 + 必填字段」的元数据来源，
 * 页面不需要硬编码供应商列表。
 *
 * <p>{@link #isImplemented()} 为 false 时**不进管理页下拉**（避免管理员选了用不了）；
 * 四家在 M5 已全部落地。
 */
public enum MailProviderType {

	/** SMTP 邮件服务器（明文 / STARTTLS / SSL 三态） */
	SMTP("smtp", "SMTP 邮件服务器", true,
			new String[] { "host", "port", "encryption", "account", "password" }),

	/** 阿里云邮件推送 DirectMail（HTTP API + V3 签名） */
	ALIYUN("aliyun", "阿里云邮件推送", true,
			new String[] { "accessKeyId", "accessKeySecret", "accountName" }),

	/** 腾讯云邮件推送 SES（HTTP API + TC3 签名） */
	TENCENT("tencent", "腾讯云 SES", true,
			new String[] { "secretId", "secretKey", "region", "fromEmailAddress" }),

	/** 自定义 HTTP 邮件网关 */
	HTTP("http", "自定义 HTTP", true,
			new String[] { "url" });

	private final String code;
	private final String displayName;
	private final boolean implemented;
	private final String[] requiredFields;

	MailProviderType(String code, String displayName, boolean implemented, String[] requiredFields) {
		this.code = code;
		this.displayName = displayName;
		this.implemented = implemented;
		this.requiredFields = requiredFields;
	}

	public String getCode() {
		return code;
	}

	public String getDisplayName() {
		return displayName;
	}

	/** 是否已实现（未实现的不进管理页下拉，发送时也直接报「暂未接入」） */
	public boolean isImplemented() {
		return implemented;
	}

	/** 该供应商需要用户填写的字段（页面用于标注必填、服务端用于校验） */
	public String[] getRequiredFields() {
		return requiredFields;
	}

	/** 解析配置值；无法识别 → null（调用方按「未配置供应商」处理） */
	public static MailProviderType fromCode(String code) {
		if (code == null) {
			return null;
		}
		String value = code.trim();
		for (MailProviderType type : values()) {
			if (type.code.equalsIgnoreCase(value)) {
				return type;
			}
		}
		return null;
	}
}
