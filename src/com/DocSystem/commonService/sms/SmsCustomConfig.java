package com.DocSystem.commonService.sms;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 自定义 HTTP 运营商配置：{@code sms.custom} 行。
 *
 * <p>用于兼容存量 {@code smsServer} 配置，以及接入未内置的运营商网关。
 * 默认参数名与云片同形（{@code mobile} / {@code tpl_id} / {@code tpl_value}）。
 */
public class SmsCustomConfig {

	/** 短信网关地址 */
	private String url;

	/** POST / GET */
	private String method = "POST";

	/** 参数名映射：phone / tplId / tplVars（缺省与云片同形） */
	private Map<String, String> paramNames = new LinkedHashMap<String, String>();

	/**
	 * 额外固定参数（随每次请求一并发送），如 {@code {"apikey":"xxx"}}。
	 * 存量 smsServer + smsApikey 迁移到自定义 HTTP 时，apikey 就落在这里。
	 */
	private Map<String, String> params = new LinkedHashMap<String, String>();

	/** 成功判定：响应里取哪个字段 */
	private String successField = "code";

	/** 成功判定：该字段等于什么值算成功 */
	private String successValue = "0";

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

	/** 取参数名（未配置 → 云片同形的默认值） */
	public String getParamName(String key) {
		String value = (paramNames == null) ? null : paramNames.get(key);
		if (value != null && !value.trim().isEmpty()) {
			return value.trim();
		}
		if ("phone".equals(key)) {
			return "mobile";
		}
		if ("tplId".equals(key)) {
			return "tpl_id";
		}
		if ("tplVars".equals(key)) {
			return "tpl_value";
		}
		return key;
	}
}
