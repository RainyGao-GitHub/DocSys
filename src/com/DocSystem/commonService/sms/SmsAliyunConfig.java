package com.DocSystem.commonService.sms;

/**
 * 阿里云短信配置：{@code sms.aliyun} 行（Dysmsapi SendSms，签名 V3 / ACS3-HMAC-SHA256）。
 */
public class SmsAliyunConfig {

	private String accessKeyId;
	private String accessKeySecret;

	/** 区域，默认 cn-hangzhou */
	private String regionId;

	/** 空 → 用 {@link SmsProviderType#ALIYUN} 的默认端点（dysmsapi.aliyuncs.com） */
	private String endpoint;

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
}
