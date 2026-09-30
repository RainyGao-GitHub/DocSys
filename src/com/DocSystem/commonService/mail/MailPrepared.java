package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 「已就绪、可发送」的发信上下文（{@code MailSender.prepare()} 的产物）。
 *
 * <p>与短信的 {@code SmsPrepared} 同义：把「配置/收件人是否合格」与真正的网络发送分开，
 * 便于管理后台「发送测试邮件」在发之前就给出明确错误。
 */
public class MailPrepared {

	private boolean ready;

	/** 未就绪原因（ready=true 时为空） */
	private String error;

	private MailProviderType provider;

	private MailConfig config;

	private MailMessage message;

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

	public MailProviderType getProvider() {
		return provider;
	}

	public void setProvider(MailProviderType provider) {
		this.provider = provider;
	}

	@JSONField(serialize = false, deserialize = false)
	public MailConfig getConfig() {
		return config;
	}

	public void setConfig(MailConfig config) {
		this.config = config;
	}

	@JSONField(serialize = false, deserialize = false)
	public MailMessage getMessage() {
		return message;
	}

	public void setMessage(MailMessage message) {
		this.message = message;
	}
}
