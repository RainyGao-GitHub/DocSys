package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 发信结果（统一形态，供应商差异被收敛到 providerCode / providerMsg），
 * 与短信的 {@code SmsSendResult} 同一套路。
 *
 * <p>用途：管理后台「发送测试邮件」回显 + 调用方只取 {@code isSuccess()}。
 */
public class MailSendResult {

	private boolean success;

	/** 供应商 code（本期只有 smtp） */
	private String provider;

	/**
	 * 供应商返回的状态码/分类：
	 * SMTP 失败时取 {@code SMTPAddressFailedException.getReturnCode()}（如 550），
	 * 成功时为 "OK"，异常分类（如 AuthenticationFailedException）为异常类名。
	 */
	private String providerCode;

	/** 供应商返回的描述信息（失败原因通常在这里） */
	private String providerMsg;

	/** 原始返回内容（SMTP 的服务器应答摘要 / 异常堆栈摘要；供后台展示，不写日志） */
	private String raw;

	private long elapsedMs;

	private String error;

	public static MailSendResult success(String provider, String providerCode, String providerMsg, String raw) {
		MailSendResult result = new MailSendResult();
		result.success = true;
		result.provider = provider;
		result.providerCode = providerCode;
		result.providerMsg = providerMsg;
		result.raw = raw;
		return result;
	}

	public static MailSendResult failure(String provider, String error) {
		MailSendResult result = new MailSendResult();
		result.success = false;
		result.provider = provider;
		result.error = error;
		return result;
	}

	public static MailSendResult failure(String provider, String providerCode, String providerMsg, String raw) {
		MailSendResult result = new MailSendResult();
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

	/**
	 * 人可读的失败原因（派生，不参与 JSON）。
	 *
	 * <p>与短信的 {@code SmsSendResult#getFailureReason()} 有一处**有意差异**：只要拿到了
	 * 返回码就把它拼在最前面。原因：SMTP 在收件人被拒时给的是
	 * {@code SendFailedException("Invalid Addresses")}，返回码（550）藏在异常链里，
	 * 若像短信那样「有 providerMsg 就不再显示返回码」，管理页试发会看到一句
	 * "Invalid Addresses" 而完全不知道到底是被拒（550）还是别的错 —— 那正是 M2 修掉的坑，
	 * 不能在显示层再丢一次（E2E 断言：原因里必须同时有 550 与被拒地址）。
	 */
	@JSONField(serialize = false, deserialize = false)
	public String getFailureReason() {
		if (success) {
			return null;
		}
		if (error != null && !error.isEmpty()) {
			return error;
		}

		boolean hasCode = providerCode != null && !providerCode.isEmpty();
		boolean hasMsg = providerMsg != null && !providerMsg.isEmpty();
		if (hasCode && hasMsg) {
			return "返回码 " + providerCode + "：" + providerMsg;
		}
		if (hasMsg) {
			return providerMsg;
		}
		if (hasCode) {
			return "返回码 " + providerCode;
		}
		return "发送失败";
	}
}
