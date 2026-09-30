package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 阿里云邮件推送（DirectMail）配置（{@code mail.aliyun} 一段 JSON 的载体）。
 *
 * <p>对应 {@code SingleSendMail} 接口（{@code dm.aliyuncs.com} / 版本 {@code 2015-11-23}）：
 * <ul>
 *   <li>{@link #accountName} → {@code AccountName}（控制台里配置并验证过的**发信地址**）</li>
 *   <li>{@link #accessKeyId}/{@link #accessKeySecret} → 签名（复用短信侧的 {@code Acs3Signer}，同为 ACS3 V3 签名）</li>
 *   <li>{@link #regionId} → 仅作记录（SingleSendMail 不需要 Region 参数）</li>
 *   <li>{@link #endpoint} → 接入地址，留空用 {@link #DEFAULT_ENDPOINT}</li>
 * </ul>
 *
 * <p>⚠️ 官方明确：**{@code SingleSendMail} 不支持附件**。带附件时应当报错让管理员改用别的发信方式，
 * 而不是静默丢掉附件（见 Provider 的实现）。
 */
public class MailAliyunConfig {

	/** 默认接入地址（国内） */
	public static final String DEFAULT_ENDPOINT = "dm.aliyuncs.com";

	private String accessKeyId = "";
	private String accessKeySecret = "";

	/** 发信地址（控制台里创建并验证过的地址，如 noreply@mail.your-domain.com） */
	private String accountName = "";

	/** 地域（仅作记录；SingleSendMail 不带该参数） */
	private String regionId = "";

	/** 接入地址；空 → {@link #DEFAULT_ENDPOINT} */
	private String endpoint = "";

	public String getAccessKeyId() {
		return accessKeyId;
	}

	public void setAccessKeyId(String accessKeyId) {
		this.accessKeyId = accessKeyId;
	}

	public String getAccessKeySecret() {
		return accessKeySecret;
	}

	public void setAccessKeySecret(String accessKeySecret) {
		this.accessKeySecret = accessKeySecret;
	}

	public String getAccountName() {
		return accountName;
	}

	public void setAccountName(String accountName) {
		this.accountName = accountName;
	}

	public String getRegionId() {
		return regionId;
	}

	public void setRegionId(String regionId) {
		this.regionId = regionId;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
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

	/** 生效的签名 host（去掉协议前缀与路径，保留端口） */
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
}
