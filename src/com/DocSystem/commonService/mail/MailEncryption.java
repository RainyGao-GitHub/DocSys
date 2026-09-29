package com.DocSystem.commonService.mail;

/**
 * SMTP 加密方式。
 *
 * <p>这三种形态覆盖了绝大多数邮箱服务商：
 * <ul>
 *   <li>{@link #NONE}：明文，默认 25 端口；**云主机通常封禁出站 25 端口**，只适合内网邮件服务器</li>
 *   <li>{@link #STARTTLS}：先明文握手再升级加密，默认 587（部分服务商 25 也支持）</li>
 *   <li>{@link #SSL}：全程加密（隐式 SSL），默认 465（个别服务商 994）</li>
 * </ul>
 *
 * <p>对应 JavaMail 属性：{@code mail.smtp.starttls.enable} 与 {@code mail.smtp.ssl.enable}
 * （本项目自带 JavaMail 1.4.4，两者均已核实支持，见方案文档 §1.3）。
 */
public enum MailEncryption {

	NONE("none", "不加密（明文）"),
	STARTTLS("starttls", "STARTTLS"),
	SSL("ssl", "SSL/TLS（隐式 SSL）");

	private final String code;
	private final String displayName;

	MailEncryption(String code, String displayName) {
		this.code = code;
		this.displayName = displayName;
	}

	public String getCode() {
		return code;
	}

	public String getDisplayName() {
		return displayName;
	}

	/** 解析配置值；无法识别（含 null/空）→ {@link #NONE} */
	public static MailEncryption fromCode(String code) {
		if (code == null) {
			return NONE;
		}
		String value = code.trim();
		for (MailEncryption encryption : values()) {
			if (encryption.code.equalsIgnoreCase(value)) {
				return encryption;
			}
		}
		return NONE;
	}

	/**
	 * 该加密方式的常用端口：SSL→465、STARTTLS→587、NONE→25。
	 * 仅用于「配置里没写端口」时给一个合理默认与页面提示，不覆盖用户填写的端口。
	 */
	public int getSuggestedPort() {
		if (this == SSL) {
			return 465;
		}
		if (this == STARTTLS) {
			return 587;
		}
		return 25;
	}
}
