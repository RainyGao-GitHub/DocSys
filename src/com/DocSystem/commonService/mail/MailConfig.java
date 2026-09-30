package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 邮件服务配置（整份配置的内存模型）。
 *
 * <p>与短信一样，只有 {@code mail.enabled/provider/from/fromName/smtp/options} 这几个顶层键
 * 会各自落成 {@code system_setting} 表里的一行；{@code smtp}/{@code options} 是 JSON 字符串。
 *
 * <p>派生的 getter 一律 {@code @JSONField(serialize=false)} —— 它们只是读的时候算出来的，
 * 不能写回库里，否则 JSON 会越滚越大。
 */
public class MailConfig {

	/** 邮件服务开关。**缺省 true**：老系统没有这个开关（配了就发），改成关闭会让升级后邮件静默失效 */
	private boolean enabled = true;

	/** 供应商 code（smtp / aliyun / tencent / http）；null 或无法识别 = 未配置 */
	private String provider = "";

	/** 发件人邮箱（From）。留空时用 SMTP 登录账号 */
	private String from = "";

	/** 发件人显示名（可选）；空则只显示邮箱地址 */
	private String fromName = "";

	/** SMTP 服务器配置 */
	private MailSmtpConfig smtp = new MailSmtpConfig();

	/** 阿里云邮件推送配置（provider=aliyun 时生效） */
	private MailAliyunConfig aliyun = new MailAliyunConfig();

	/** 腾讯云 SES 配置（provider=tencent 时生效） */
	private MailTencentConfig tencent = new MailTencentConfig();

	/** 自定义 HTTP 网关配置（provider=http 时生效） */
	private MailHttpConfig http = new MailHttpConfig();

	/** 通用发送选项 */
	private MailOptions options = new MailOptions();

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public String getFrom() {
		return from;
	}

	public void setFrom(String from) {
		this.from = from;
	}

	public String getFromName() {
		return fromName;
	}

	public void setFromName(String fromName) {
		this.fromName = fromName;
	}

	public MailSmtpConfig getSmtp() {
		return smtp;
	}

	public void setSmtp(MailSmtpConfig smtp) {
		this.smtp = smtp;
	}

	public MailAliyunConfig getAliyun() {
		return aliyun;
	}

	public void setAliyun(MailAliyunConfig aliyun) {
		this.aliyun = aliyun;
	}

	public MailTencentConfig getTencent() {
		return tencent;
	}

	public void setTencent(MailTencentConfig tencent) {
		this.tencent = tencent;
	}

	public MailHttpConfig getHttp() {
		return http;
	}

	public void setHttp(MailHttpConfig http) {
		this.http = http;
	}

	public MailOptions getOptions() {
		return options;
	}

	public void setOptions(MailOptions options) {
		this.options = options;
	}

	// ===================== 派生值（不参与序列化） =====================

	/** 解析后的供应商类型；未配置/无法识别 → null */
	@JSONField(serialize = false, deserialize = false)
	public MailProviderType getProviderType() {
		return MailProviderType.fromCode(provider);
	}

	/**
	 * 当前供应商是否「配齐了」：
	 * <ul>
	 *   <li>SMTP：host + account + password 都不为空</li>
	 *   <li>阿里云：accessKeyId + accessKeySecret + accountName（发信地址即 AccountName）</li>
	 *   <li>腾讯云：secretId + secretKey + region + 发信地址（模板模式还要模板 ID）</li>
	 *   <li>自定义 HTTP：url</li>
	 * </ul>
	 * 这里只回答「够不够发」；具体缺哪个字段由 MailSender 给出更具体的提示。
	 */
	@JSONField(serialize = false, deserialize = false)
	public boolean isProviderConfigured() {
		MailProviderType type = getProviderType();
		if (type == null || !type.isImplemented()) {
			return false;
		}
		if (type == MailProviderType.SMTP) {
			MailSmtpConfig cfg = smtp == null ? new MailSmtpConfig() : smtp;
			return !isBlank(cfg.getHost()) && !isBlank(cfg.getAccount()) && !isBlank(cfg.getPassword());
		}
		if (type == MailProviderType.ALIYUN) {
			MailAliyunConfig cfg = (aliyun == null) ? new MailAliyunConfig() : aliyun;
			return !isBlank(cfg.getAccessKeyId()) && !isBlank(cfg.getAccessKeySecret())
					&& !isBlank(cfg.getAccountName());
		}
		if (type == MailProviderType.TENCENT) {
			MailTencentConfig cfg = (tencent == null) ? new MailTencentConfig() : tencent;
			if (isBlank(cfg.getSecretId()) || isBlank(cfg.getSecretKey()) || isBlank(cfg.getRegion())
					|| isBlank(getEffectiveFrom())) {
				return false;
			}
			return !cfg.isTemplateMode() || cfg.getEffectiveTemplateId() > 0;
		}
		if (type == MailProviderType.HTTP) {
			MailHttpConfig cfg = (http == null) ? new MailHttpConfig() : http;
			return !isBlank(cfg.getUrl());
		}
		return false;
	}

	/** 发件人地址：{@code mail.from} 为空时回落到 SMTP 登录账号（老系统就是这样发的） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveFrom() {
		if (!isBlank(from)) {
			return from.trim();
		}
		if (smtp != null && !isBlank(smtp.getAccount())) {
			return smtp.getAccount().trim();
		}
		return null;
	}

	/** 发件人显示名；空 → null（不设置 display personal） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveFromName() {
		return isBlank(fromName) ? null : fromName.trim();
	}

	/** 正文类型；空 → 默认 UTF-8（避免老代码那种 messagetype 缺失即 NPE） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveContentType() {
		if (options == null || isBlank(options.getContentType())) {
			return MailOptions.DEFAULT_CONTENT_TYPE;
		}
		return options.getContentType().trim();
	}

	/** 解析后的加密方式 */
	@JSONField(serialize = false, deserialize = false)
	public MailEncryption getEffectiveEncryption() {
		return smtp == null ? MailEncryption.NONE : smtp.getEncryptionType();
	}

	/** 端口：≤0 时按加密方式给默认端口（SSL 465 / STARTTLS 587 / NONE 25） */
	@JSONField(serialize = false, deserialize = false)
	public int getEffectivePort() {
		int port = smtp == null ? 0 : smtp.getPort();
		return port > 0 ? port : getEffectiveEncryption().getSuggestedPort();
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
