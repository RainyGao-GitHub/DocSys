package com.DocSystem.commonService.sms.impl;

import java.util.List;
import java.util.Map;

import com.DocSystem.commonService.sms.SmsConfig;
import com.DocSystem.commonService.sms.SmsProvider;
import com.DocSystem.commonService.sms.SmsProviderType;
import com.DocSystem.commonService.sms.SmsRequest;
import com.DocSystem.commonService.sms.SmsSendResult;
import com.DocSystem.commonService.sms.SmsTemplateConfig;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 云片（Yunpian）适配：v2 指定模板单发。
 *
 * <p>请求：POST 表单，字段 {@code apikey / mobile / tpl_id / tpl_value}；
 * {@code tpl_value} 形如 {@code #code#=123456}（多个变量用 {@code &} 连接）。
 *
 * <p>关于编码：云片文档的 Java 示例把变量名与变量值都先 {@code URLEncoder} 再交给表单层，
 * 结果是双重编码；本实现与其不同 —— {@link #buildTplValue} 只产出**逻辑值**，
 * URL 编码交给 {@link com.DocSystem.commonService.sms.SmsHttpClient} 统一做一次，
 * 与服务端期望的 {@code #code#=123456} 一致（也与本项目原有实现的行为一致）。
 *
 * <p>成功判定：响应 JSON 的 {@code code} 为 0。
 */
public class YunpianSmsProvider implements SmsProvider {

	@Override
	public SmsProviderType getType() {
		return SmsProviderType.YUNPIAN;
	}

	@Override
	public SmsRequest buildRequest(SmsConfig config, SmsTemplateConfig template, String phone,
			Map<String, String> vars) {
		SmsRequest request = new SmsRequest(config.getEffectiveEndpoint(), "POST");
		request.addFormParam("apikey", config.getProviderField("apikey"));
		request.addFormParam("mobile", phone);
		request.addFormParam("tpl_id", template.getTplId());
		request.addFormParam("tpl_value", buildTplValue(template.getEffectiveVars(), vars));
		return request;
	}

	@Override
	public SmsSendResult parseResponse(SmsConfig config, int httpStatus, String body) {
		String provider = getType().getCode();
		if (body == null || body.trim().isEmpty()) {
			return SmsSendResult.failure(provider, null, "响应为空（HTTP " + httpStatus + "）", body);
		}

		JSONObject json;
		try {
			json = JSON.parseObject(body);
		} catch (Exception e) {
			return SmsSendResult.failure(provider, null, "响应不是 JSON（HTTP " + httpStatus + "）", body);
		}

		Object code = (json == null) ? null : json.get("code");
		String codeText = (code == null) ? null : String.valueOf(code);
		String msg = (json == null) ? null : json.getString("msg");

		if ("0".equals(codeText)) {
			return SmsSendResult.success(provider, codeText, msg, body);
		}
		return SmsSendResult.failure(provider, codeText, msg, body);
	}

	/**
	 * 模板变量串：{@code #name#=value} 用 {@code &} 连接（值由 HTTP 层统一编码一次）。
	 */
	public static String buildTplValue(List<String> names, Map<String, String> vars) {
		StringBuilder sb = new StringBuilder();
		if (names == null) {
			return "";
		}
		for (String name : names) {
			if (sb.length() > 0) {
				sb.append("&");
			}
			sb.append("#").append(name).append("#=").append(vars == null ? "" : vars.get(name));
		}
		return sb.toString();
	}
}
