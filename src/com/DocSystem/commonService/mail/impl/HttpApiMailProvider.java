package com.DocSystem.commonService.mail.impl;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailHttpConfig;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailOptions;
import com.DocSystem.commonService.mail.MailProvider;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.http.HttpRequest;
import com.DocSystem.commonService.http.HttpResponse;
import com.DocSystem.commonService.http.SimpleHttpClient;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 自定义 HTTP 邮件网关适配（内网自建网关 / 未内置的服务商）。
 *
 * <p>与短信侧 {@code GenericHttpSmsProvider} 同一套路：由 {@code mail.http} 决定
 * url / method / 参数名映射 / 额外固定参数 / 成功判定字段。
 *
 * <p>请求：
 * <ul>
 *   <li>{@code contentType=json}（默认）→ 整体 POST 一个 JSON 对象；</li>
 *   <li>{@code contentType=form} → {@code application/x-www-form-urlencoded}。</li>
 * </ul>
 *
 * <p>成功判定：
 * <ul>
 *   <li>配了 {@code successField} → 解析响应 JSON，该字段值等于 {@code successValue}（默认 {@code 0}）
 *       才算成功；</li>
 *   <li>没配 {@code successField} → HTTP 2xx 即成功。</li>
 * </ul>
 *
 * <p>⚠️ **不支持附件**：自定义网关的附件参数形状无法猜（Base64 字段名？多部分？URL？），
 * 与其瞎猜一个网关不认识的字段，不如明确报错让管理员改用 SMTP / 腾讯云 SES。
 */
public class HttpApiMailProvider implements MailProvider {

	@Override
	public MailProviderType getType() {
		return MailProviderType.HTTP;
	}

	@Override
	public MailSendResult send(MailConfig config, MailMessage message) {
		String provider = getType().getCode();
		String earlyError = validate(provider, config, message);
		if (earlyError != null) {
			return MailSendResult.failure(provider, earlyError);
		}

		HttpRequest request = buildRequest(config, message);
		HttpResponse response = SimpleHttpClient.execute(request, timeoutOf(config.getOptions()), 0);
		if (response.isNetworkError()) {
			return MailSendResult.failure(provider, "NetworkError", response.getErrorMessage(), null);
		}
		return parseResponse(config, response.getStatus(), response.getBody());
	}

	// ===================== 请求构造（纯函数，可脱网断言） =====================

	/** 构造请求（**不打网络**） */
	public static HttpRequest buildRequest(MailConfig config, MailMessage message) {
		MailHttpConfig http = config.getHttp();
		Map<String, String> params = buildParams(config, message);

		boolean form = http.isFormPost();
		HttpRequest request = new HttpRequest(http.getUrl(), http.getEffectiveMethod());
		if (form) {
			for (Map.Entry<String, String> param : params.entrySet()) {
				request.addFormParam(param.getKey(), param.getValue());
			}
		} else {
			request.setJsonBody(JSON.toJSONString(params));
		}
		return request;
	}

	/** 逻辑参数（字段名按 {@code paramNames} 映射，再加上固定参数） */
	public static Map<String, String> buildParams(MailConfig config, MailMessage message) {
		MailHttpConfig http = config.getHttp();
		Map<String, String> params = new LinkedHashMap<String, String>();
		params.put(http.getParamName("to"), joinTo(message.getTo()));
		params.put(http.getParamName("subject"), subjectOf(message));
		params.put(http.getParamName("content"), unnull(message.getContent()));
		String from = config.getEffectiveFrom();
		if (from != null && !from.trim().isEmpty()) {
			params.put(http.getParamName("from"), from.trim());
		}
		if (http.getParams() != null) {
			for (Map.Entry<String, String> param : http.getParams().entrySet()) {
				if (param.getKey() != null && !param.getKey().trim().isEmpty()) {
					params.put(param.getKey().trim(), unnull(param.getValue()));
				}
			}
		}
		return params;
	}

	/**
	 * 解析响应（纯函数）。
	 *
	 * <p>未配 {@code successField} 时以 HTTP 状态码为准；配了就只认字段值 —— 因为不少网关
	 * 「HTTP 200 但 body 里是业务失败」。
	 */
	public static MailSendResult parseResponse(MailConfig config, int httpStatus, String body) {
		String provider = MailProviderType.HTTP.getCode();
		MailHttpConfig http = (config == null) ? null : config.getHttp();
		String successField = (http == null) ? null : http.getSuccessField();

		if (successField == null || successField.trim().isEmpty()) {
			boolean ok = httpStatus >= 200 && httpStatus < 300;
			String msg = "HTTP " + httpStatus;
			return ok ? MailSendResult.success(provider, String.valueOf(httpStatus), msg, body)
					: MailSendResult.failure(provider, String.valueOf(httpStatus), msg, body);
		}

		if (body == null || body.trim().isEmpty()) {
			return MailSendResult.failure(provider, null, "响应为空（HTTP " + httpStatus + "）", body);
		}

		JSONObject json;
		try {
			json = JSON.parseObject(body);
		} catch (Exception e) {
			return MailSendResult.failure(provider, null, "响应不是 JSON（HTTP " + httpStatus + "）", body);
		}

		Object value = (json == null) ? null : json.get(successField.trim());
		String actual = (value == null) ? null : String.valueOf(value);
		String expected = http.getSuccessValue();
		if (expected == null || expected.trim().isEmpty()) {
			expected = "0";
		}

		if (expected.equals(actual)) {
			return MailSendResult.success(provider, actual, extractMessage(json), body);
		}

		String reason = "成功判定字段 " + successField + " = " + actual + "，期望 " + expected;
		String gatewayMsg = extractMessage(json);
		if (gatewayMsg != null && !gatewayMsg.isEmpty()) {
			reason = reason + "；网关返回：" + gatewayMsg;
		}
		return MailSendResult.failure(provider, actual, reason, body);
	}

	/** 尽力取出网关自己的描述信息（失败原因透传，便于后台自助排查） */
	private static String extractMessage(JSONObject json) {
		if (json == null) {
			return "";
		}
		String[] candidates = { "message", "msg", "Message", "error", "errmsg", "description" };
		for (String name : candidates) {
			String value = json.getString(name);
			if (value != null && !value.trim().isEmpty()) {
				return value;
			}
		}
		return "";
	}

	// ===================== 内部工具 =====================

	private static String validate(String provider, MailConfig config, MailMessage message) {
		if (config == null || config.getHttp() == null) {
			return "自定义 HTTP 配置为空";
		}
		if (message == null) {
			return "邮件内容为空";
		}
		if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
			return "自定义 HTTP 网关不支持附件（附件参数形状无法通用），请改用 SMTP 或腾讯云 SES";
		}
		return null;
	}

	private static String subjectOf(MailMessage message) {
		String subject = (message == null) ? null : message.getSubject();
		return (subject == null || subject.trim().isEmpty()) ? "(无主题)" : subject.trim();
	}

	private static String joinTo(List<String> toList) {
		StringBuilder sb = new StringBuilder();
		if (toList != null) {
			for (String to : toList) {
				if (to == null || to.trim().isEmpty()) {
					continue;
				}
				if (sb.length() > 0) {
					sb.append(",");
				}
				sb.append(to.trim());
			}
		}
		return sb.toString();
	}

	private static int timeoutOf(MailOptions options) {
		if (options == null) {
			return 10000;
		}
		return (options.getReadTimeoutMs() > 0) ? options.getReadTimeoutMs() : options.getConnectTimeoutMs();
	}

	private static String unnull(String value) {
		return (value == null) ? "" : value;
	}
}
