package com.DocSystem.commonService.sms;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 发送结果（统一形态，运营商差异被收敛到 providerCode / providerMsg）。
 */
public class SmsSendResult {

	private boolean success;

	/** 运营商 code（yunpian / aliyun / tencent / custom） */
	private String provider;

	/** 运营商返回的原始状态码（如云片的 code、阿里云的 Code） */
	private String providerCode;

	/** 运营商返回的描述信息（失败原因通常在这里） */
	private String providerMsg;

	/** 原始响应体（供后台「发送测试短信」展示；不写日志，避免密钥/隐私外泄） */
	private String raw;

	private long elapsedMs;

	private String error;

	public static SmsSendResult success(String provider, String providerCode, String providerMsg, String raw) {
		SmsSendResult result = new SmsSendResult();
		result.success = true;
		result.provider = provider;
		result.providerCode = providerCode;
		result.providerMsg = providerMsg;
		result.raw = raw;
		return result;
	}

	public static SmsSendResult failure(String provider, String error) {
		SmsSendResult result = new SmsSendResult();
		result.success = false;
		result.provider = provider;
		result.error = error;
		return result;
	}

	public static SmsSendResult failure(String provider, String providerCode, String providerMsg, String raw) {
		SmsSendResult result = new SmsSendResult();
		result.success = false;
		result.provider = provider;
		result.providerCode = providerCode;
		result.providerMsg = providerMsg;
		result.raw = raw;
		return result;
	}

	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public String getProviderCode() {
		return providerCode;
	}

	public void setProviderCode(String providerCode) {
		this.providerCode = providerCode;
	}

	public String getProviderMsg() {
		return providerMsg;
	}

	public void setProviderMsg(String providerMsg) {
		this.providerMsg = providerMsg;
	}

	public String getRaw() {
		return raw;
	}

	public void setRaw(String raw) {
		this.raw = raw;
	}

	public long getElapsedMs() {
		return elapsedMs;
	}

	public void setElapsedMs(long elapsedMs) {
		this.elapsedMs = elapsedMs;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	/** 人可读的失败原因（派生，不参与 JSON） */
	@JSONField(serialize = false, deserialize = false)
	public String getFailureReason() {
		if (success) {
			return null;
		}
		if (error != null && !error.isEmpty()) {
			return error;
		}
		if (providerMsg != null && !providerMsg.isEmpty()) {
			return providerMsg;
		}
		if (providerCode != null && !providerCode.isEmpty()) {
			return "运营商返回码 " + providerCode;
		}
		return "发送失败";
	}
}
