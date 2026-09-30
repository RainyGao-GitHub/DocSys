package com.DocSystem.commonService.http;

/**
 * HTTP 层返回：状态码 + 响应体 + 耗时 / 网络错误信息。
 *
 * <p>历史：本类原先叫 {@code sms/SmsHttpResponse}，随 HTTP 层上提到中立包。
 */
public class HttpResponse {

	private int status;

	private String body = "";

	private long elapsedMs;

	/** true = 连接/读写异常（此时 status 无意义） */
	private boolean networkError;

	private String errorMessage;

	public HttpResponse() {
	}

	public static HttpResponse networkError(String message, long elapsedMs) {
		HttpResponse response = new HttpResponse();
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
