package com.DocSystem.commonService.sms;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 一次短信发送的 HTTP 请求描述（与具体运营商无关）。
 *
 * <p>由 {@link SmsProvider#buildRequest} 构造，交给 {@link SmsHttpClient} 执行。
 * 这里存的是**逻辑参数值**（如 tpl_value = {@code #code#=123456}），
 * URL 编码统一在 HTTP 层做一次 —— 便于单测直接断言请求内容，也避免双重编码。
 */
public class SmsRequest {

	private String url;

	/** POST / GET */
	private String method = "POST";

	/** 表单参数（application/x-www-form-urlencoded） */
	private Map<String, String> formParams = new LinkedHashMap<String, String>();

	/** JSON 请求体（与 formParams 互斥；阿里云/腾讯云用） */
	private String jsonBody;

	private Map<String, String> headers = new LinkedHashMap<String, String>();

	public SmsRequest() {
	}

	public SmsRequest(String url, String method) {
		this.url = url;
		this.method = method;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public Map<String, String> getFormParams() {
		return formParams;
	}

	public void setFormParams(Map<String, String> formParams) {
		this.formParams = formParams;
	}

	public void addFormParam(String name, String value) {
		if (name != null && !name.trim().isEmpty()) {
			formParams.put(name.trim(), (value == null) ? "" : value);
		}
	}

	public String getJsonBody() {
		return jsonBody;
	}

	public void setJsonBody(String jsonBody) {
		this.jsonBody = jsonBody;
	}

	public Map<String, String> getHeaders() {
		return headers;
	}

	public void setHeaders(Map<String, String> headers) {
		this.headers = headers;
	}

	public void addHeader(String name, String value) {
		if (name != null && !name.trim().isEmpty()) {
			headers.put(name.trim(), (value == null) ? "" : value);
		}
	}

	/** 是否为「表单 POST」 */
	public boolean isFormPost() {
		return "POST".equalsIgnoreCase(method) && (jsonBody == null || jsonBody.isEmpty());
	}
}
