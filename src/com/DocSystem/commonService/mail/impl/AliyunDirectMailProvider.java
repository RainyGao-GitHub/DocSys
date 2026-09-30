package com.DocSystem.commonService.mail.impl;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.TimeZone;

import com.DocSystem.commonService.mail.MailAliyunConfig;
import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailOptions;
import com.DocSystem.commonService.mail.MailProvider;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.sms.SmsHttpClient;
import com.DocSystem.commonService.sms.SmsHttpResponse;
import com.DocSystem.commonService.sms.SmsRequest;
import com.DocSystem.commonService.sms.impl.Acs3Signer;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 阿里云邮件推送 DirectMail（{@code SingleSendMail}，Version {@code 2015-11-23}）。
 *
 * <p>请求形状与短信的 {@code SendSms} 同源（阿里云 RPC 风格 + V3 签名）：
 * <pre>
 * POST /?AccountName=...&amp;AddressType=1&amp;ReplyToAddress=false&amp;Subject=...&amp;ToAddress=...&amp;HtmlBody=... HTTP/1.1
 * Host: dm.aliyuncs.com
 * Authorization: ACS3-HMAC-SHA256 Credential=&lt;AK&gt;,SignedHeaders=...,Signature=...
 * x-acs-action: SingleSendMail
 * x-acs-version: 2015-11-23
 * x-acs-signature-nonce: ...
 * x-acs-date: &lt;UTC ISO8601&gt;
 * x-acs-content-sha256: &lt;空 Body 的 SHA256&gt;
 * </pre>
 *
 * <p>要点（都来自官方接口文档）：
 * <ul>
 *   <li>参数在 **query** 里、Body 为空 —— 走 {@code SmsRequest.setQueryInUrl(true)}，
 *       且**不能**带未参与签名的 Content-Type（否则网关算出的签名对不上）；</li>
 *   <li>{@code AddressType=1} 表示用控制台里创建并验证过的发信地址（{@code AccountName}）；</li>
 *   <li>{@code ReplyToAddress} 是字符串 {@code "true"}/{@code "false"}，不是布尔；</li>
 *   <li>{@code HtmlBody} 与 {@code TextBody} **至少给一个**，本实现按 {@code mail.options.contentType}
 *       二选一（与 SMTP 链路的正文类型口径一致）；</li>
 *   <li>{@code FromAlias} 官方限制 ≤15 字符，超长这里**截断**（显示名是装饰性的，
 *       为了它让整封信发不出去不值得）；</li>
 *   <li>⚠️ 官方明确 {@code SingleSendMail} **不支持附件** —— 带附件直接报错让管理员换发信方式，
 *       不静默丢附件。</li>
 * </ul>
 *
 * <p>签名算法与短信侧共用 {@link Acs3Signer}（同一套 ACS3-HMAC-SHA256）。
 *
 * <p>**不重试**：{@link SmsHttpClient#execute} 的 retry 传 0，与方案决策 D7（邮件不自动重试，
 * 避免重复打扰收件人）一致。
 */
public class AliyunDirectMailProvider implements MailProvider {

	public static final String ACTION = "SingleSendMail";
	public static final String VERSION = "2015-11-23";

	/** 无主题时的占位（与 SmtpMailProvider 保持一致） */
	public static final String PLACEHOLDER_SUBJECT = "(无主题)";

	private static final int NONCE_BYTES = 16;
	private static final int MAX_FROM_ALIAS_LEN = 15;

	private static final Random RANDOM = new Random();

	@Override
	public MailProviderType getType() {
		return MailProviderType.ALIYUN;
	}

	@Override
	public MailSendResult send(MailConfig config, MailMessage message) {
		String provider = getType().getCode();
		String earlyError = validate(provider, config, message);
		if (earlyError != null) {
			return MailSendResult.failure(provider, earlyError);
		}

		MailAliyunConfig aliyun = config.getAliyun();
		SmsRequest request = buildRequest(config, message);

		int timeoutMs = timeoutOf(config.getOptions());
		SmsHttpResponse response = SmsHttpClient.execute(request, timeoutMs, 0);
		if (response.isNetworkError()) {
			return MailSendResult.failure(provider, "NetworkError", response.getErrorMessage(), null);
		}
		return parseResponse(response.getStatus(), response.getBody());
	}

	// ===================== 请求构造（纯函数，可脱网断言） =====================

	/**
	 * 构造请求（**不打网络**）。测试探针直接断言这里产出的 URL / 参数 / 头，
	 * 因此逻辑与真实发送完全同源。
	 */
	public static SmsRequest buildRequest(MailConfig config, MailMessage message) {
		MailAliyunConfig aliyun = config.getAliyun();
		String host = aliyun.getEffectiveHost();
		String url = aliyun.getEffectiveScheme() + "://" + host + "/";

		Map<String, String> query = new LinkedHashMap<String, String>();
		query.put("AccountName", unnull(aliyun.getAccountName()));
		query.put("AddressType", "1");
		query.put("ReplyToAddress", "false");
		query.put("Subject", subjectOf(message));
		query.put("ToAddress", joinTo(message.getTo()));
		if (isPlainText(config.getOptions())) {
			query.put("TextBody", unnull(message.getContent()));
		} else {
			query.put("HtmlBody", unnull(message.getContent()));
		}
		String fromName = config.getEffectiveFromName();
		if (fromName != null && !fromName.isEmpty()) {
			query.put("FromAlias", truncate(fromName, MAX_FROM_ALIAS_LEN));
		}

		String body = "";
		Map<String, String> acsHeaders = new LinkedHashMap<String, String>();
		acsHeaders.put("x-acs-action", ACTION);
		acsHeaders.put("x-acs-version", VERSION);
		acsHeaders.put("x-acs-signature-nonce", randomHex(NONCE_BYTES));
		acsHeaders.put("x-acs-date", utcNow());
		acsHeaders.put("x-acs-content-sha256", Acs3Signer.EMPTY_CONTENT_SHA256);

		Acs3Signer.Signed signed = Acs3Signer.sign("POST", host, "/", query, acsHeaders,
				unnull(aliyun.getAccessKeyId()), unnull(aliyun.getAccessKeySecret()), body);

		SmsRequest request = new SmsRequest(url, "POST");
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

	/**
	 * 解析响应（纯函数）。
	 *
	 * <p>成功响应形如 {@code {"EnvId":"...","RequestId":"..."}}（**没有** Code 字段）；
	 * 失败时返回 4xx 且带 {@code Code}/{@code Message}。阿里云 V3 网关的错误体字段大小写
	 * 两种都可能出现，所以两种都试 —— 否则失败原因会变成空白，后台没法自助排查。
	 */
	public static MailSendResult parseResponse(int httpStatus, String body) {
		String provider = MailProviderType.ALIYUN.getCode();
		if (body == null || body.trim().isEmpty()) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus),
					"响应为空（HTTP " + httpStatus + "）", body);
		}

		JSONObject json = null;
		try {
			json = JSON.parseObject(body);
		} catch (Exception e) {
			// 不是 JSON：按 HTTP 状态码给结论，原文透传
			boolean ok = httpStatus >= 200 && httpStatus < 300;
			return ok ? MailSendResult.success(provider, "OK", "HTTP " + httpStatus, body)
					: MailSendResult.failure(provider, String.valueOf(httpStatus), "响应不是 JSON", body);
		}

		String code = firstNonBlank(json.getString("Code"), json.getString("code"));
		String message = firstNonBlank(json.getString("Message"), json.getString("message"));

		if (code != null && !"OK".equals(code)) {
			return MailSendResult.failure(provider, code, message, body);
		}
		if (httpStatus < 200 || httpStatus >= 300) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus), message, body);
		}

		String envId = json.getString("EnvId");
		String requestId = json.getString("RequestId");
		StringBuilder msg = new StringBuilder();
		if (envId != null && !envId.isEmpty()) {
			msg.append("EnvId=").append(envId);
		}
		if (requestId != null && !requestId.isEmpty()) {
			if (msg.length() > 0) {
				msg.append(" ");
			}
			msg.append("RequestId=").append(requestId);
		}
		return MailSendResult.success(provider, "OK", msg.length() == 0 ? "HTTP " + httpStatus : msg.toString(), body);
	}

	// ===================== 内部工具 =====================

	/** 发送前的兜底校验（把「配置缺项」和「附件不支持」挡在打网络之前） */
	private static String validate(String provider, MailConfig config, MailMessage message) {
		if (config == null || config.getAliyun() == null) {
			return "阿里云邮件推送配置为空";
		}
		if (message == null) {
			return "邮件内容为空";
		}
		if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
			return "阿里云邮件推送（" + ACTION + "）不支持附件，请改用 SMTP 或腾讯云 SES";
		}
		return null;
	}

	private static boolean isPlainText(MailOptions options) {
		String contentType = (options == null) ? MailOptions.DEFAULT_CONTENT_TYPE : options.getContentType();
		return contentType != null && contentType.toLowerCase().contains("text/plain");
	}

	private static int timeoutOf(MailOptions options) {
		if (options == null) {
			return 10000;
		}
		return (options.getReadTimeoutMs() > 0) ? options.getReadTimeoutMs() : options.getConnectTimeoutMs();
	}

	private static String subjectOf(MailMessage message) {
		String subject = (message == null) ? null : message.getSubject();
		return (subject == null || subject.trim().isEmpty()) ? PLACEHOLDER_SUBJECT : subject.trim();
	}

	/** 收件人拼成 {@code ToAddress}（官方允许多个地址用英文逗号分隔） */
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

	private static String truncate(String value, int maxLength) {
		return (value.length() <= maxLength) ? value : value.substring(0, maxLength);
	}

	private static String randomHex(int byteCount) {
		byte[] bytes = new byte[byteCount];
		RANDOM.nextBytes(bytes);
		StringBuilder sb = new StringBuilder(byteCount * 2);
		for (byte b : bytes) {
			sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
		}
		return sb.toString();
	}

	/** UTC ISO8601（{@code yyyy-MM-dd'T'HH:mm:ss'Z'}）；阿里云要求 UTC，不能用本地时区 */
	public static String utcNow() {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
		format.setTimeZone(TimeZone.getTimeZone("UTC"));
		return format.format(new Date());
	}

	private static String firstNonBlank(String first, String second) {
		if (first != null && !first.trim().isEmpty()) {
			return first;
		}
		return (second != null && !second.trim().isEmpty()) ? second : null;
	}

	private static String unnull(String value) {
		return (value == null) ? "" : value;
	}
}
