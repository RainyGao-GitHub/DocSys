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

	private String secretId = "";
	private String secretKey = "";

	/** 地域，必填（ap-guangzhou / ap-hongkong） */
	private String region = "";

	/** 发信地址 */
	private String fromEmailAddress = "";

	/** 接入地址；空 → {@link #DEFAULT_ENDPOINT} */
	private String endpoint = "";

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

	/** 生效的接入地址（空 → 默认值，同时去掉可能被粘进来的协议前缀） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveEndpoint() {
		String value = (endpoint == null) ? "" : endpoint.trim();
		if (value.isEmpty()) {
			return DEFAULT_ENDPOINT;
		}
		return value.replace("https://", "").replace("http://", "").replaceAll("/+$", "");
	}

	/** 生效的发信地址（空 → 回落到全局的 {@code mail.from}，由 Provider 决定） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveFromEmailAddress() {
		return (fromEmailAddress == null) ? "" : fromEmailAddress.trim();
	}
}
