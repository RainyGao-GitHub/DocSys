package com.DocSystem.commonService.sms;

/**
 * 云片配置：{@code sms.yunpian} 行。
 * 签名写在模板内容里，故无独立签名字段。
 */
public class SmsYunpianConfig {

	private String apikey;

	/** 空 → 用 {@link SmsProviderType#YUNPIAN} 的默认端点（v2 tpl_single_send） */
	private String endpoint;

	public String getApikey() {
		return apikey;
	}

	public void setApikey(String apikey) {
		this.apikey = apikey;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
	}
}
