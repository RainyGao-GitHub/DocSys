package com.DocSystem.commonService.sms;

/**
 * HTTP 层返回：状态码 + 响应体 + 耗时 / 网络错误信息。
 */
public class SmsHttpResponse {

	private int status;

	private String body = "";

	private long elapsedMs;

	/** true = 连接/读写异常（此时 status 无意义） */
	private boolean networkError;

	private String errorMessage;

	public SmsHttpResponse() {
	}

	public static SmsHttpResponse networkError(String message, long elapsedMs) {
		SmsHttpResponse response = new SmsHttpResponse();
		response.networkError = true;
		response.errorMessage = message;
		response.elapsedMs = elapsedMs;
		return response;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public long getElapsedMs() {
		return elapsedMs;
	}

	public void setElapsedMs(long elapsedMs) {
		this.elapsedMs = elapsedMs;
	}

	public boolean isNetworkError() {
		return networkError;
	}

	public void setNetworkError(boolean networkError) {
		this.networkError = networkError;
	}

	public String getErrorMessage() {
		return errorMessage;
	}

	public void setErrorMessage(String errorMessage) {
		this.errorMessage = errorMessage;
	}
}
