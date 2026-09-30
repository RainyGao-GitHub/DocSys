package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 腾讯云邮件推送（SES）配置（{@code mail.tencent} 一段 JSON 的载体）。
 *
 * <p>对应 {@code SendEmail} 接口（{@code ses.tencentcloudapi.com} / 版本 {@code 2020-10-02} / 签名 TC3-HMAC-SHA256）：
 * <ul>
 *   <li>{@link #secretId}/{@link #secretKey} → 云 API 密钥（TM 控制台 → 访问管理 → API 密钥）</li>
 *   <li>{@link #region} → **必填**（该接口只支持 {@code ap-guangzhou}、{@code ap-hongkong}）</li>
 *   <li>{@link #fromEmailAddress} → 发信地址（控制台"发信地址"里创建，如 {@code noreply@mail.your-domain.com}）</li>
 *   <li>{@link #endpoint} → 接入地址，留空用 {@link #DEFAULT_ENDPOINT}（就近地域接入）</li>
 * </ul>
 *
 * <p>发信域名需要先在控制台完成验证（SPF/DKIM），否则接口会返回域名未验证的错误。
 */
public class MailTencentConfig {

	/** 默认接入地址（就近地域接入，推荐） */
	public static final String DEFAULT_ENDPOINT = "ses.tencentcloudapi.com";

	/** 接口版本，腾讯云 SES 目前只有这一个 */
	public static final String API_VERSION = "2020-10-02";

	/** 产品名（参与签名的 CredentialScope，必须与域名一致） */
	public static final String SERVICE = "ses";

	/** 自定义内容模式：走 {@code Simple}，HTML/纯文本全文随请求发送（需账号已开通「自定义内容」权限） */
	public static final String MODE_CUSTOM = "custom";

	/**
	 * 模板模式：走 {@code Template}，**正文由控制台模板决定**，本地只传短变量。
	 *
	 * <p>注意模板变量的官方限制：值不能是 HTML 等复杂类型，整个 {@code TemplateData} JSON
	 * 不超过 800 字节。所以模板模式适合「通知类」短正文，不能承载 DocSys 的整页 HTML。
	 */
	public static final String MODE_TEMPLATE = "template";

	private String secretId = "";
	private String secretKey = "";

	/** 地域，必填（ap-guangzhou / ap-hongkong） */
	private String region = "";

	/** 发信地址 */
	private String fromEmailAddress = "";

	/** 接入地址；空 → {@link #DEFAULT_ENDPOINT} */
	private String endpoint = "";

	/**
	 * 内容模式（{@link #MODE_CUSTOM} / {@link #MODE_TEMPLATE}）。
	 *
	 * <p>为什么要有这个开关：腾讯云 SES 的 {@code Simple}（自定义内容）字段官方已标为**废弃**，
	 * 「如您未申请过特殊配置，则不存在该字段」；新账号不额外申请权限直接用 {@code Simple} 会被
	 * 拒（返回码 1011「无发送自定义内容权限，必须使用模板」）。所以两种模式都得留。
	 */
	private String contentMode = MODE_CUSTOM;

	/** 模板 ID（{@code contentMode=template} 时必填；先在控制台建模板并通过审核） */
	private String templateId = "";

	/** 模板模式下的变量名：邮件主题（默认 {@code subject}） */
	private String templateSubjectKey = "subject";

	/** 模板模式下的变量名：邮件正文（默认 {@code content}） */
	private String templateContentKey = "content";

	public String getSecretId() {
		return secretId;
	}

	public void setSecretId(String secretId) {
		this.secretId = secretId;
	}

	public String getSecretKey() {
		return secretKey;
	}

	public void setSecretKey(String secretKey) {
		this.secretKey = secretKey;
	}

	public String getRegion() {
		return region;
	}

	public void setRegion(String region) {
		this.region = region;
	}

	public String getFromEmailAddress() {
		return fromEmailAddress;
	}

	public void setFromEmailAddress(String fromEmailAddress) {
		this.fromEmailAddress = fromEmailAddress;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
	}

	public String getContentMode() {
		return contentMode;
	}

	public void setContentMode(String contentMode) {
		this.contentMode = contentMode;
	}

	public String getTemplateId() {
		return templateId;
	}

	public void setTemplateId(String templateId) {
		this.templateId = templateId;
	}

	public String getTemplateSubjectKey() {
		return templateSubjectKey;
	}

	public void setTemplateSubjectKey(String templateSubjectKey) {
		this.templateSubjectKey = templateSubjectKey;
	}

	public String getTemplateContentKey() {
		return templateContentKey;
	}

	public void setTemplateContentKey(String templateContentKey) {
		this.templateContentKey = templateContentKey;
	}

	/**
	 * 生效的接入地址：空 → {@link #DEFAULT_ENDPOINT}；去掉末尾斜杠与路径。
	 *
	 * <p>保留调用方写的 {@code http://} 前缀：生产一律 https，但本机联调与自建接入需要 http。
	 */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveEndpoint() {
		String value = (endpoint == null) ? "" : endpoint.trim();
		if (value.isEmpty()) {
			return DEFAULT_ENDPOINT;
		}
		return value.replaceAll("/+$", "");
	}

	/** 生效的协议：显式写 {@code http://} 时用 http，其余一律 https */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveScheme() {
		return getEffectiveEndpoint().toLowerCase().startsWith("http://") ? "http" : "https";
	}

	/** 生效的签名 host（去掉协议前缀与路径，保留端口；签名 host 必须与实际发出的 Host 头一致） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveHost() {
		String value = getEffectiveEndpoint();
		int scheme = value.indexOf("://");
		if (scheme >= 0) {
			value = value.substring(scheme + 3);
		}
		int slash = value.indexOf('/');
		if (slash >= 0) {
			value = value.substring(0, slash);
		}
		return value;
	}

	/** 生效的发信地址（空 → 回落到全局的 {@code mail.from}，由 Provider 决定） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveFromEmailAddress() {
		return (fromEmailAddress == null) ? "" : fromEmailAddress.trim();
	}

	/** 是否模板模式（无法识别的内容模式一律按自定义内容处理，避免把配置笔误变成静默不发） */
	@JSONField(serialize = false, deserialize = false)
	public boolean isTemplateMode() {
		return MODE_TEMPLATE.equalsIgnoreCase((contentMode == null) ? "" : contentMode.trim());
	}

	/** 模板 ID 的数字形式；空或非数字 → 0（调用方按「未配置」处理） */
	@JSONField(serialize = false, deserialize = false)
	public long getEffectiveTemplateId() {
		String value = (templateId == null) ? "" : templateId.trim();
		if (value.isEmpty()) {
			return 0L;
		}
		try {
			return Long.parseLong(value);
		} catch (NumberFormatException e) {
			return 0L;
		}
	}

	/** 生效的模板变量名：主题（空 → subject） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveSubjectKey() {
		String value = (templateSubjectKey == null) ? "" : templateSubjectKey.trim();
		return value.isEmpty() ? "subject" : value;
	}

	/** 生效的模板变量名：正文（空 → content） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveContentKey() {
		String value = (templateContentKey == null) ? "" : templateContentKey.trim();
		return value.isEmpty() ? "content" : value;
	}
}
