package com.DocSystem.commonService.sms.impl;

import java.util.Map;

import com.DocSystem.commonService.sms.SmsConfig;
import com.DocSystem.commonService.sms.SmsCustomConfig;
import com.DocSystem.commonService.sms.SmsProvider;
import com.DocSystem.commonService.sms.SmsProviderType;
import com.DocSystem.commonService.sms.SmsRequest;
import com.DocSystem.commonService.sms.SmsSendResult;
import com.DocSystem.commonService.sms.SmsTemplateConfig;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 自定义 HTTP 适配：用于接入未内置的短信网关，以及**兼容存量的 smsServer 配置**。
 *
 * <p>请求：由 {@code sms.custom} 决定 url / method / 参数名映射 / 额外固定参数；
 * 模板变量沿用云片同形的 {@code #name#=value}（与存量实现一致，可通过参数名映射改字段名）。
 *
 * <p>成功判定：
 * <ul>
 *   <li>配置了 {@code successField} → 解析响应 JSON，该字段值等于 {@code successValue} 才算成功；</li>
 *   <li>没配 {@code successField} → HTTP 2xx 即成功。</li>
 * </ul>
 */
public class GenericHttpSmsProvider implements SmsProvider {

	@Override
	public SmsProviderType getType() {
		return SmsProviderType.CUSTOM;
	}

	@Override
	public SmsRequest buildRequest(SmsConfig config, SmsTemplateConfig template, String phone,
			Map<String, String> vars) {
		SmsCustomConfig custom = config.getCustom();
		String method = (custom == null || isBlank(custom.getMethod())) ? "POST" : custom.getMethod().trim();

		SmsRequest request = new SmsRequest(config.getEffectiveEndpoint(), method.toUpperCase());
		if (custom != null) {
			request.addFormParam(custom.getParamName("phone"), phone);
			request.addFormParam(custom.getParamName("tplId"), template.getTplId());
			request.addFormParam(custom.getParamName("tplVars"), YunpianSmsProvider.buildTplValue(vars));
			if (custom.getParams() != null) {
				for (Map.Entry<String, String> param : custom.getParams().entrySet()) {
					request.addFormParam(param.getKey(), param.getValue());
				}
			}
		}
		return request;
	}

	@Override
	public SmsSendResult parseResponse(SmsConfig config, int httpStatus, String body) {
		String provider = getType().getCode();
		SmsCustomConfig custom = (config == null) ? null : config.getCustom();
		String successField = (custom == null) ? null : custom.getSuccessField();

		if (isBlank(successField)) {
			// 未配置成功判定字段 → 以 HTTP 状态码为准
			boolean ok = httpStatus >= 200 && httpStatus < 300;
			String msg = "HTTP " + httpStatus;
			return ok ? SmsSendResult.success(provider, String.valueOf(httpStatus), msg, body)
					: SmsSendResult.failure(provider, String.valueOf(httpStatus), msg, body);
		}

		if (body == null || body.trim().isEmpty()) {
			return SmsSendResult.failure(provider, null, "响应为空（HTTP " + httpStatus + "）", body);
		}

		JSONObject json;
		try {
			json = JSON.parseObject(body);
		} catch (Exception e) {
			return SmsSendResult.failure(provider, null, "响应不是 JSON（HTTP " + httpStatus + "）", body);
		}

		Object value = (json == null) ? null : json.get(successField);
		String actual = (value == null) ? null : String.valueOf(value);
		String expected = custom.getSuccessValue();
		if (isBlank(expected)) {
			expected = "0";
		}

		if (expected.equals(actual)) {
			return SmsSendResult.success(provider, actual, extractMessage(json), body);
		}

		String reason = "成功判定字段 " + successField + " = " + actual + "，期望 " + expected;
		String gatewayMsg = extractMessage(json);
		if (!isBlank(gatewayMsg)) {
			reason = reason + "；网关返回：" + gatewayMsg;
		}
		return SmsSendResult.failure(provider, actual, reason, body);
	}

	/**
	 * 尽力从响应里取出网关自己的描述信息（失败原因透传，便于后台自助排查）。
	 * 不同网关字段名不一，按常见命名依次尝试。
	 */
	private static String extractMessage(JSONObject json) {
		if (json == null) {
			return null;
		}
		String[] candidates = { "msg", "message", "Message", "errmsg", "errMsg", "error", "info" };
		for (String key : candidates) {
			Object value = json.get(key);
			if (value != null) {
				String text = String.valueOf(value);
				if (!text.trim().isEmpty()) {
					return text;
				}
			}
		}
		return null;
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
