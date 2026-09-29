package com.DocSystem.commonService.sms;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 「已就绪、可发送」的请求上下文（{@code SmsSender.prepare()} 的产物）。
 *
 * <p>存在的意义：把「配置是否就绪 / 模板与变量是否齐全」的判定与真正的网络发送分开，
 * 既能给后台的「发送测试短信」在发之前给出明确错误，也让**不打网络**的请求构造校验成为可能。
 */
public class SmsPrepared {

	private boolean ready;

	/** 未就绪原因（ready=true 时为空） */
	private String error;

	private SmsProviderType provider;

	private SmsConfig config;

	private SmsRequest request;

	public boolean isReady() {
		return ready;
	}

	public void setReady(boolean ready) {
		this.ready = ready;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public SmsProviderType getProvider() {
		return provider;
	}

	public void setProvider(SmsProviderType provider) {
		this.provider = provider;
	}

	@JSONField(serialize = false, deserialize = false)
	public SmsConfig getConfig() {
		return config;
	}

	public void setConfig(SmsConfig config) {
		this.config = config;
	}

	public SmsRequest getRequest() {
		return request;
	}

	public void setRequest(SmsRequest request) {
		this.request = request;
	}
}
