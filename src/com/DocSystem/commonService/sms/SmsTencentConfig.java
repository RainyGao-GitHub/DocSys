package com.DocSystem.commonService.sms;

/**
 * 腾讯云短信配置：{@code sms.tencent} 行（SendSms 2021-01-11，TC3-HMAC-SHA256 签名）。
 */
public class SmsTencentConfig {

	private String secretId;
	private String secretKey;

	/** 短信应用 SdkAppId，形如 1400006666 */
	private String sdkAppId;

	/** 地域，默认 ap-guangzhou（对应请求头 X-TC-Region） */
	private String region;

	/** 空 → 用 {@link SmsProviderType#TENCENT} 的默认端点（sms.tencentcloudapi.com） */
	private String endpoint;

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

	public String getSdkAppId() {
		return sdkAppId;
	}

	public void setSdkAppId(String sdkAppId) {
		this.sdkAppId = sdkAppId;
	}

	public String getRegion() {
		return region;
	}

	public void setRegion(String region) {
		this.region = region;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
	}
}
