package com.DocSystem.commonService.http;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 一次 HTTP 请求的描述（与具体运营商/邮件服务商无关）。
 *
 * <p>由各 Provider 的 {@code buildRequest} 构造，交给 {@link SimpleHttpClient} 执行。
 * 这里存的是**逻辑参数值**（如 tpl_value = {@code #code#=123456}），
 * URL 编码统一在 HTTP 层做一次 —— 便于单测直接断言请求内容，也避免双重编码。
 *
 * <p>历史：本类原先叫 {@code sms/SmsRequest}（短信侧先用）；邮件侧接入阿里云/腾讯云后
 * 把它上提到 {@code commonService.http}，因为两边发 HTTP 的形状完全一致。
 */
public class HttpRequest {

	private String url;

	/** POST / GET */
	private String method = "POST";

	/** 表单参数（application/x-www-form-urlencoded） */
	private Map<String, String> formParams = new LinkedHashMap<String, String>();

	/**
	 * true = 表单参数拼到 URL 查询串、请求体为空（POST /?k=v）。
	 *
	 * <p>阿里云 RPC 风格就需要这种形状，而且**不能**随手加 Content-Type：
	 * 阿里云 V3 签名要求「凡发出的 host / content-type / x-acs-* 头都必须参与签名」，
	 * 多一个未签名的 Content-Type 会让网关算出的签名对不上。
	 */
	private boolean queryInUrl;

	/** JSON 请求体（与 formParams 互斥；腾讯云用） */
	private String jsonBody;

	private Map<String, String> headers = new LinkedHashMap<String, String>();

	public HttpRequest() {
	}

	public HttpRequest(String url, String method) {
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

	/** 参数是否拼进 URL 查询串（true 时请求体为空） */
	public boolean isQueryInUrl() {
		return queryInUrl;
	}

	public void setQueryInUrl(boolean queryInUrl) {
		this.queryInUrl = queryInUrl;
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

	/** 是否为「表单 POST」（请求体为表单编码；参数进 URL 或无 Body 时不是） */
	public boolean isFormPost() {
		return "POST".equalsIgnoreCase(method) && !queryInUrl && (jsonBody == null || jsonBody.isEmpty());
	}
}
