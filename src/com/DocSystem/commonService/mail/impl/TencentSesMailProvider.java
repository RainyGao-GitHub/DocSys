package com.DocSystem.commonService.mail.impl;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailOptions;
import com.DocSystem.commonService.mail.MailProvider;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.mail.MailTencentConfig;
import com.DocSystem.commonService.sms.SmsHttpClient;
import com.DocSystem.commonService.sms.SmsHttpResponse;
import com.DocSystem.commonService.sms.SmsRequest;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

/**
 * 腾讯云邮件推送 SES（{@code SendEmail}，Version {@code 2020-10-02}，TC3-HMAC-SHA256 签名）。
 *
 * <p>请求形状：
 * <pre>
 * POST / HTTP/1.1
 * Host: ses.tencentcloudapi.com
 * Content-Type: application/json; charset=utf-8
 * Authorization: TC3-HMAC-SHA256 Credential=...,SignedHeaders=content-type;host;x-tc-action,Signature=...
 * X-TC-Action: SendEmail / X-TC-Version: 2020-10-02 / X-TC-Region: ap-guangzhou / X-TC-Timestamp: ...
 * </pre>
 *
 * <p>**两种内容模式**（官方文档口径，不是可选装饰）：
 * <ul>
 *   <li>{@code custom}（默认）→ {@code Simple} 字段，HTML/纯文本全文随请求发送。
 *       官方把 {@code Simple} 标为「已废弃，仅部分历史上申请了特殊配置的客户需要使用」，
 *       新账号不额外申请权限会被拒（返回码 1011「无发送自定义内容权限，必须使用模板」）；</li>
 *   <li>{@code template} → {@code Template} 字段。**正文由控制台模板决定**，本地只传短变量
 *       （官方限制：值不能是 HTML 等复杂类型、整个 TemplateData ≤800 字节）。适合通知类短正文。</li>
 * </ul>
 *
 * <p>两个细节说明：
 * <ul>
 *   <li>>1 个收件人时**逐个调用**：官方注明 {@code Destination} 中的地址会全部显示在邮件内容里，
 *       群发会让收件人互相看到邮箱地址（文件分享通知尤其不该泄这个）。</li>
 *   <li>附件走 {@code Attachments}（FileName + base64 Content），官方限制所有附件总大小 ≤4MB、
 *       请求包 ≤8MB，超限这里**直接报错**而不是等接口返回难读的错误。</li>
 * </ul>
 *
 * <p>签名算法见 {@link Tc3Signer}（已用官方示例中间值 + Python 独立实现交叉核对）。
 * **不重试**（{@link SmsHttpClient#execute} 的 retry 传 0），与方案决策 D7 一致。
 */
public class TencentSesMailProvider implements MailProvider {

	public static final String ACTION = "SendEmail";

	/** 无主题时的占位（与 SmtpMailProvider 保持一致） */
	public static final String PLACEHOLDER_SUBJECT = "(无主题)";

	/** 官方限制：所有附件总大小上限 4MB */
	public static final long MAX_ATTACHMENT_BYTES = 4L * 1024 * 1024;

	@Override
	public MailProviderType getType() {
		return MailProviderType.TENCENT;
	}

	@Override
	public MailSendResult send(MailConfig config, MailMessage message) {
		String provider = getType().getCode();
		String earlyError = validate(provider, config, message);
		if (earlyError != null) {
			return MailSendResult.failure(provider, earlyError);
		}

		MailTencentConfig tencent = config.getTencent();
		List<String> recipients = recipientsOf(message);
		int timeoutMs = timeoutOf(config.getOptions());

		// 逐个收件人发送并汇总：只要有一个失败就算整次失败（返回第一个失败原因）
		MailSendResult firstFailure = null;
		MailSendResult lastSuccess = null;
		int sentCount = 0;
		for (String recipient : recipients) {
			SmsRequest request = buildRequest(config, message, recipient);
			SmsHttpResponse response = SmsHttpClient.execute(request, timeoutMs, 0);
			MailSendResult result = response.isNetworkError()
					? MailSendResult.failure(provider, "NetworkError", response.getErrorMessage(), null)
					: parseResponse(response.getStatus(), response.getBody());
			if (result.isSuccess()) {
				lastSuccess = result;
				sentCount++;
			} else if (firstFailure == null) {
				firstFailure = result;
			}
		}

		if (firstFailure != null) {
			if (sentCount > 0) {
				firstFailure.setProviderMsg(unnull(firstFailure.getProviderMsg())
						+ "（已成功 " + sentCount + "/" + recipients.size() + " 人，请注意可能重复）");
			}
			return firstFailure;
		}
		return lastSuccess;
	}

	// ===================== 请求构造（纯函数，可脱网断言） =====================

	/**
	 * 构造请求（**不打网络**）。请求体字符串**同时**用于签名与实际发送 ——
	 * 这是 TC3 的硬要求（签名覆盖 payload 的 SHA256），两处必须逐字节一致。
	 */
	public static SmsRequest buildRequest(MailConfig config, MailMessage message) {
		return buildRequest(config, message, firstRecipient(message));
	}

	public static SmsRequest buildRequest(MailConfig config, MailMessage message, String recipient) {
		MailTencentConfig tencent = config.getTencent();
		String host = tencent.getEffectiveHost();
		String payload = buildPayload(config, message, recipient);

		long timestampSec = System.currentTimeMillis() / 1000L;
		Tc3Signer.Signed signed = Tc3Signer.sign(host, MailTencentConfig.SERVICE, ACTION,
				MailTencentConfig.API_VERSION,
				(tencent.getRegion() == null) ? "" : tencent.getRegion().trim(),
				unnull(tencent.getSecretId()), unnull(tencent.getSecretKey()),
				payload, timestampSec);

		SmsRequest request = new SmsRequest(tencent.getEffectiveScheme() + "://" + host + "/", "POST");
		request.setJsonBody(payload);
		for (Map.Entry<String, String> header : signed.getHeaders().entrySet()) {
			request.addHeader(header.getKey(), header.getValue());
		}
		return request;
	}

	/** 构造请求体 JSON（有序，便于探针断言；签名与发送共用这一份字符串） */
	public static String buildPayload(MailConfig config, MailMessage message, String recipient) {
		MailTencentConfig tencent = config.getTencent();
		JSONObject payload = new JSONObject(true);
		payload.put("FromEmailAddress", fromOf(config));
		payload.put("Subject", subjectOf(message));
		payload.put("Destination", singleList(recipient));

		if (tencent.isTemplateMode()) {
			JSONObject templateData = new JSONObject(true);
			templateData.put(tencent.getEffectiveSubjectKey(), subjectOf(message));
			templateData.put(tencent.getEffectiveContentKey(), unnull(message.getContent()));
			JSONObject template = new JSONObject(true);
			template.put("TemplateID", tencent.getEffectiveTemplateId());
			template.put("TemplateData", JSON.toJSONString(templateData));
			payload.put("Template", template);
		} else {
			String content = unnull(message.getContent());
			JSONObject simple = new JSONObject(true);
			//官方口径：Html / Text 都是 **base64 编码后**的内容
			if (isPlainText(config.getOptions())) {
				simple.put("Text", base64(content));
			} else {
				simple.put("Html", base64(content));
			}
			payload.put("Simple", simple);
		}

		List<JSONObject> attachments = buildAttachments(message.getAttachments());
		if (!attachments.isEmpty()) {
			payload.put("Attachments", attachments);
		}
		return JSON.toJSONString(payload);
	}

	/**
	 * 解析响应（纯函数）。
	 *
	 * <p>成功：{@code {"Response":{"MessageId":"...","RequestId":"..."}}}；
	 * 失败：{@code {"Response":{"Error":{"Code":"...","Message":"..."},"RequestId":"..."}}}。
	 */
	public static MailSendResult parseResponse(int httpStatus, String body) {
		String provider = MailProviderType.TENCENT.getCode();
		if (body == null || body.trim().isEmpty()) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus),
					"响应为空（HTTP " + httpStatus + "）", body);
		}

		JSONObject root;
		try {
			root = JSON.parseObject(body);
		} catch (Exception e) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus), "响应不是 JSON", body);
		}

		JSONObject response = (root == null) ? null : root.getJSONObject("Response");
		if (response == null) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus), "响应缺少 Response 节点", body);
		}

		JSONObject error = response.getJSONObject("Error");
		if (error != null) {
			return MailSendResult.failure(provider, error.getString("Code"), error.getString("Message"), body);
		}

		String messageId = response.getString("MessageId");
		if (messageId == null || messageId.trim().isEmpty()) {
			return MailSendResult.failure(provider, String.valueOf(httpStatus),
					"响应没有 MessageId（无法确认是否已受理）", body);
		}
		String requestId = response.getString("RequestId");
		String msg = "MessageId=" + messageId;
		if (requestId != null && !requestId.isEmpty()) {
			msg = msg + " RequestId=" + requestId;
		}
		return MailSendResult.success(provider, "OK", msg, body);
	}

	// ===================== 内部工具 =====================

	private static String validate(String provider, MailConfig config, MailMessage message) {
		if (config == null || config.getTencent() == null) {
			return "腾讯云 SES 配置为空";
		}
		if (message == null) {
			return "邮件内容为空";
		}

		MailTencentConfig tencent = config.getTencent();
		if (tencent.isTemplateMode()) {
			if (tencent.getEffectiveTemplateId() <= 0) {
				return "腾讯云 SES 选择了模板模式，但模板 ID 未配置或不是数字：" + tencent.getTemplateId();
			}
		}

		long total = 0;
		List<String> attachments = message.getAttachments();
		if (attachments != null) {
			for (String path : attachments) {
				File file = new File(unnull(path));
				if (!file.isFile()) {
					return "附件不存在：" + path;
				}
				total += file.length();
			}
		}
		if (total > MAX_ATTACHMENT_BYTES) {
			return "附件总大小 " + (total / 1024 / 1024) + "MB 超过腾讯云 4MB 限制，请改用 SMTP";
		}
		return null;
	}

	/** 附件结构（官方：FileName ≤255 字符 + base64 后的 Content） */
	private static List<JSONObject> buildAttachments(List<String> paths) {
		List<JSONObject> result = new ArrayList<JSONObject>();
		if (paths == null) {
			return result;
		}
		for (String path : paths) {
			File file = new File(unnull(path));
			JSONObject attachment = new JSONObject(true);
			attachment.put("FileName", file.getName());
			attachment.put("Content", base64(readFile(file)));
			result.add(attachment);
		}
		return result;
	}

	private static byte[] readFile(File file) {
		try {
			return Files.readAllBytes(file.toPath());
		} catch (Exception e) {
			throw new IllegalStateException("读取附件失败：" + file.getAbsolutePath() + "：" + e.getMessage(), e);
		}
	}

	/** 发件人：有显示名时按官方要求的 {@code 别名 <邮箱地址>} 写法（别名不能带冒号） */
	private static String fromOf(MailConfig config) {
		String from = unnull(config.getEffectiveFrom());
		String fromName = unnull(config.getEffectiveFromName());
		if (fromName.isEmpty()) {
			return from;
		}
		return fromName + " <" + from + ">";
	}

	private static List<String> recipientsOf(MailMessage message) {
		List<String> result = new ArrayList<String>();
		if (message != null && message.getTo() != null) {
			for (String to : message.getTo()) {
				if (to != null && !to.trim().isEmpty()) {
					result.add(to.trim());
				}
			}
		}
		return result;
	}

	private static String firstRecipient(MailMessage message) {
		List<String> recipients = recipientsOf(message);
		return recipients.isEmpty() ? "" : recipients.get(0);
	}

	private static List<String> singleList(String value) {
		List<String> list = new ArrayList<String>();
		list.add(unnull(value));
		return list;
	}

	private static String subjectOf(MailMessage message) {
		String subject = (message == null) ? null : message.getSubject();
		return (subject == null || subject.trim().isEmpty()) ? PLACEHOLDER_SUBJECT : subject.trim();
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

	private static String base64(String text) {
		return Base64.getEncoder().encodeToString(unnull(text).getBytes(java.nio.charset.Charset.forName("UTF-8")));
	}

	private static String base64(byte[] bytes) {
		return Base64.getEncoder().encodeToString(bytes);
	}

	private static String unnull(String value) {
		return (value == null) ? "" : value;
	}
}
