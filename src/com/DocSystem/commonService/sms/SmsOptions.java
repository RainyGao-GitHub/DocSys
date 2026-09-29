package com.DocSystem.commonService.sms;

/**
 * 发送相关选项：{@code sms.options} 行。
 */
public class SmsOptions {

	/** 单次请求超时（毫秒） */
	private int timeoutMs = 10000;

	/** 网络异常/5xx 时的重试次数（业务失败不重试） */
	private int retry = 0;

	/** 验证码位数 */
	private int codeLength = 6;

	/** 验证码有效期（分钟） */
	private int codeTtlMinutes = 15;

	public int getTimeoutMs() {
		return timeoutMs;
	}

	public void setTimeoutMs(int timeoutMs) {
		this.timeoutMs = timeoutMs;
	}

	public int getRetry() {
		return retry;
	}

	public void setRetry(int retry) {
		this.retry = retry;
	}

	public int getCodeLength() {
		return codeLength;
	}

	public void setCodeLength(int codeLength) {
		this.codeLength = codeLength;
	}

	public int getCodeTtlMinutes() {
		return codeTtlMinutes;
	}

	public void setCodeTtlMinutes(int codeTtlMinutes) {
		this.codeTtlMinutes = codeTtlMinutes;
	}
}
