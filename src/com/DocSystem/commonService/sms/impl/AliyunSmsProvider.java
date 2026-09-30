package com.DocSystem.commonService.sms.impl;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;
import java.util.TimeZone;

import com.DocSystem.commonService.sms.SmsAliyunConfig;
import com.DocSystem.commonService.sms.SmsConfig;
import com.DocSystem.commonService.sms.SmsProvider;
import com.DocSystem.commonService.sms.SmsProviderType;
import com.DocSystem.commonService.http.HttpRequest;
import com.DocSystem.commonService.sms.SmsSendResult;
import com.DocSystem.commonService.sms.SmsTemplateConfig;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 阿里云短信（Dysmsapi {@code SendSms}，Version {@code 2017-05-25}）。
 *
 * <p>请求形状（RPC 风格 + V3 签名）：
 * <pre>
 * POST /?PhoneNumbers=...&amp;SignName=...&amp;TemplateCode=...&amp;TemplateParam={...} HTTP/1.1
 * Host: dysmsapi.aliyuncs.com
 * Authorization: ACS3-HMAC-SHA256 Credential=&lt;AK&gt;,SignedHeaders=...,Signature=...
 * x-acs-action: SendSms
 * x-acs-version: 2017-05-25
 * x-acs-signature-nonce: ...
 * x-acs-date: &lt;UTC ISO8601&gt;
 * x-acs-content-sha256: &lt;空 Body 的 SHA256&gt;
 * </pre>
 *
 * <p>要点：
 * <ul>
 *   <li>参数在 **query** 里、Body 为空 —— 所以走 {@link HttpRequest#setQueryInUrl(boolean)}，
 *       且不能带未参与签名的 Content-Type；</li>
 *   <li>模板变量用 {@code TemplateParam} 传 **JSON 字符串**（按变量名，顺序无关）；</li>
 *   <li>**不发送 {@code RegionId}**：SendSms 未定义该参数，官方自签名请求示例也没有它；</li>
 *   <li>成功判定：响应 JSON 的 {@code Code} 为 {@code OK}。</li>
 * </ul>
 *
 * <p>签名算法见 {@link Acs3Signer}（用官方示例向量验证）。
 */
public class AliyunSmsProvider implements SmsProvider {

	public static final String ACTION = "SendSms";
	public static final String VERSION = "2017-05-25";

	private static final int NONCE_BYTES = 16;
	private static final Random RANDOM = new Random();

	@Override
	public SmsProviderType getType() {
		return SmsProviderType.ALIYUN;
	}

	@Override
	public HttpRequest buildRequest(SmsConfig config, SmsTemplateConfig template, String phone,
			Map<String, String> vars) {
		SmsAliyunConfig aliyun = (config == null) ? null : config.getAliyun();
		String accessKeyId = (aliyun == null) ? null : aliyun.getAccessKeyId();
		String accessKeySecret = (aliyun == null) ? null : aliyun.getAccessKeySecret();

		String host = hostOf(config.getEffectiveEndpoint());
		String url = schemeOf(config.getEffectiveEndpoint()) + "://" + host + "/";

		Map<String, String> query = new LinkedHashMap<String, String>();
		query.put("PhoneNumbers", phone);
		query.put("SignName", unnull(config.getSignName()));
		query.put("TemplateCode", unnull(template.getTplId()));
		if (vars != null && !vars.isEmpty()) {
			query.put("TemplateParam", JSON.toJSONString(vars));
		}

		String body = "";
		Map<String, String> acsHeaders = new LinkedHashMap<String, String>();
		acsHeaders.put("x-acs-action", ACTION);
		acsHeaders.put("x-acs-version", VERSION);
		acsHeaders.put("x-acs-signature-nonce", randomHex(NONCE_BYTES));
		acsHeaders.put("x-acs-date", utcNow());
		acsHeaders.put("x-acs-content-sha256", Acs3Signer.EMPTY_CONTENT_SHA256);

		Acs3Signer.Signed signed = Acs3Signer.sign("POST", host, "/", query, acsHeaders,
				unnull(accessKeyId), unnull(accessKeySecret), body);

		HttpRequest request = new HttpRequest(url, "POST");
		request.setQueryInUrl(true);
		for (Map.Entry<String, String> param : query.entrySet()) {
			request.addFormParam(param.getKey(), param.getValue());
		}
		for (Map.Entry<String, String> header : acsHeaders.entrySet()) {
			request.addHeader(header.getKey(), header.getValue());
		}
		request.addHeader("Authorization", signed.getAuthorization());
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

		String code = (json == null) ? null : json.getString("Code");
		String message = (json == null) ? null : json.getString("Message");
		String bizId = (json == null) ? null : json.getString("BizId");

		if ("OK".equals(code)) {
			String msg = unnull(message);
			if (bizId != null && !bizId.isEmpty()) {
				msg = msg + " BizId=" + bizId;
			}
			return SmsSendResult.success(provider, code, msg, body);
		}
		return SmsSendResult.failure(provider, code, message, body);
	}

	/** 端点 → host（去掉协议、末尾斜杠与路径） */
	public static String hostOf(String endpoint) {
		String value = unnull(endpoint).trim();
		if (value.isEmpty()) {
			return SmsProviderType.ALIYUN.getDefaultEndpoint();
		}
		int scheme = value.indexOf("://");
		if (scheme >= 0) {
			value = value.substring(scheme + 3);
		}
		int slash = value.indexOf('/');
		if (slash >= 0) {
			value = value.substring(0, slash);
		}
		return (value.isEmpty()) ? SmsProviderType.ALIYUN.getDefaultEndpoint() : value;
	}

	/** 端点中的协议；不写就是 https（生产地址） */
	public static String schemeOf(String endpoint) {
		return unnull(endpoint).trim().toLowerCase().startsWith("http://") ? "http" : "https";
	}

	/** UTC ISO8601（{@code yyyy-MM-dd'T'HH:mm:ss'Z'}） */
	public static String utcNow() {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
		format.setTimeZone(TimeZone.getTimeZone("UTC"));
		return format.format(new Date());
	}

	/** 小写十六进制随机串（签名 nonce，每次请求都必须不同） */
	public static String randomHex(int byteCount) {
		byte[] bytes = new byte[byteCount];
		RANDOM.nextBytes(bytes);
		StringBuilder sb = new StringBuilder(bytes.length * 2);
		for (byte b : bytes) {
			sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
		}
		return sb.toString();
	}

	private static String unnull(String value) {
		return (value == null) ? "" : value;
	}
}
