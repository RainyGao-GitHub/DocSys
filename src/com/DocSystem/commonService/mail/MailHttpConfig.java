package com.DocSystem.commonService.mail;

import java.util.LinkedHashMap;
import java.util.Map;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 自定义 HTTP 邮件网关配置（{@code mail.http} 一段 JSON 的载体）。
 *
 * <p>用于"内网自建网关 / 其他未内置的服务商"：由管理员给出一个 HTTP 端点、把邮件字段映射成
 * 该网关认识的参数名、并用"响应里某个字段等于某个值"判定成功。与短信的
 * {@code SmsCustomConfig} 同一套路（那套已经在短信侧验证过）。
 */
public class MailHttpConfig {

	private String url = "";

	/** 请求方法（POST / GET），默认 POST */
	private String method = "POST";

	/** 业务字段 → 网关参数名（to / subject / content / from）；留空用内置默认名 */
	private Map<String, String> paramNames = new LinkedHashMap<String, String>();

	/** 每次请求都带的固定参数（如 apikey=xxx） */
	private Map<String, String> params = new LinkedHashMap<String, String>();

	/** 成功判定：响应 JSON 里该字段… */
	private String successField = "";

	/** …等于该值即视为成功（如 code=0 / success=true） */
	private String successValue = "";

	/** 请求体格式：json（默认，整体 POST 一个 JSON）或 form（application/x-www-form-urlencoded） */
	private String contentType = "json";

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

	public Map<String, String> getParamNames() {
		return paramNames;
	}

	public void setParamNames(Map<String, String> paramNames) {
		this.paramNames = paramNames;
	}

	public Map<String, String> getParams() {
		return params;
	}

	public void setParams(Map<String, String> params) {
		this.params = params;
	}

	public String getSuccessField() {
		return successField;
	}

	public void setSuccessField(String successField) {
		this.successField = successField;
	}

	public String getSuccessValue() {
		return successValue;
	}

	public void setSuccessValue(String successValue) {
		this.successValue = successValue;
	}

	public String getContentType() {
		return contentType;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}

	/** 内置默认参数名（与短信自定义网关的约定保持一致） */
	@JSONField(serialize = false, deserialize = false)
	public String getParamName(String field) {
		String configured = (paramNames == null) ? null : paramNames.get(field);
		if (configured != null && !configured.trim().isEmpty()) {
			return configured.trim();
		}
		if ("to".equals(field)) {
			return "to";
		}
		if ("subject".equals(field)) {
			return "subject";
		}
		if ("content".equals(field)) {
			return "content";
		}
		if ("from".equals(field)) {
			return "from";
		}
		return field;
	}

	/** 是否为 form 提交（否则按 JSON 发） */
	@JSONField(serialize = false, deserialize = false)
	public boolean isFormPost() {
		return "form".equalsIgnoreCase((contentType == null) ? "" : contentType.trim());
	}

	/** 生效的请求方法（大写；非法值 → POST） */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveMethod() {
		String value = (method == null) ? "" : method.trim().toUpperCase();
		return "GET".equals(value) ? "GET" : "POST";
	}
}
