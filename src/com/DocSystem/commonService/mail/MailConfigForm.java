package com.DocSystem.commonService.mail;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 管理后台「邮件服务」表单 ⇄ {@link MailConfig} 的绑定（与短信的
 * {@code SmsConfigForm} 同套路）。
 *
 * <p>刻意做成**纯函数**（只吃 {@code Map<String,String>}，不碰 Spring / Servlet）：
 * 「页面字段名 ↔ 配置模型」的映射集中一处，既能脱网验证，也免得控制器里散落一堆
 * {@code request.getParameter}。
 *
 * <p>约定：
 * <ul>
 *   <li><b>布尔项</b>（{@code enabled} / {@code smtpAuth} / {@code smtpSslTrust}）：
 *       {@code true/on/1/yes} 为真，其余（含字段缺省）为假 —— HTML 未勾选的 checkbox
 *       不会提交字段，所以「缺省 = 关闭」正是想要的语义；</li>
 *   <li>未填写的字段统一归一为**空串**（不是 null），与方案 §2.1「未填按未填处理」一致；</li>
 *   <li>数值项（端口 / 超时）非法或缺省时**回落到默认值**（端口 0 = 「按加密方式给默认端口」，
 *       由 {@link MailConfig#getEffectivePort()} 兜底；超时用 {@link MailOptions} 的默认值）；</li>
 *   <li>旧字段 {@code host/email/pwd} **不在这里处理** —— 由控制器按「只改用户真的改了的字段」
 *       合并到已保存配置（老前端仍可用，见方案 §2.4）。</li>
 * </ul>
 */
public final class MailConfigForm {

	// ===================== 表单字段名 =====================

	public static final String P_ENABLED = "enabled";
	public static final String P_PROVIDER = "provider";
	public static final String P_FROM = "from";
	public static final String P_FROM_NAME = "fromName";

	public static final String P_SMTP_HOST = "smtpHost";
	public static final String P_SMTP_PORT = "smtpPort";
	public static final String P_SMTP_ENCRYPTION = "smtpEncryption";
	public static final String P_SMTP_ACCOUNT = "smtpAccount";
	public static final String P_SMTP_PASSWORD = "smtpPassword";
	public static final String P_SMTP_AUTH = "smtpAuth";
	public static final String P_SMTP_SSL_TRUST = "smtpSslTrust";

	public static final String P_CONTENT_TYPE = "contentType";
	public static final String P_CONNECT_TIMEOUT_MS = "connectTimeoutMs";
	public static final String P_READ_TIMEOUT_MS = "readTimeoutMs";

	/** 本表单认识的全部字段（用于判断「请求里到底有没有带邮件表单」） */
	private static final String[] FORM_FIELDS = {
			P_ENABLED, P_PROVIDER, P_FROM, P_FROM_NAME,
			P_SMTP_HOST, P_SMTP_PORT, P_SMTP_ENCRYPTION, P_SMTP_ACCOUNT, P_SMTP_PASSWORD,
			P_SMTP_AUTH, P_SMTP_SSL_TRUST,
			P_CONTENT_TYPE, P_CONNECT_TIMEOUT_MS, P_READ_TIMEOUT_MS
	};

	/** 请求里是否带了本表单的字段（一个都没有 → 调用方应改用已保存配置或走旧参数兼容） */
	public static boolean hasFormFields(Map<String, String> params) {
		if (params == null) {
			return false;
		}
		for (String field : FORM_FIELDS) {
			if (params.get(field) != null) {
				return true;
			}
		}
		return false;
	}

	/** 表单参数 → 配置对象（缺项留空/回落默认值，不继承任何旧值） */
	public static MailConfig bind(Map<String, String> params) {
		Map<String, String> form = (params == null) ? new LinkedHashMap<String, String>() : params;

		MailConfig config = new MailConfig();
		config.setEnabled(parseBoolean(form.get(P_ENABLED)));
		config.setProvider(nullToEmpty(form.get(P_PROVIDER)));
		config.setFrom(nullToEmpty(form.get(P_FROM)));
		config.setFromName(nullToEmpty(form.get(P_FROM_NAME)));

		MailOptions options = new MailOptions();
		options.setContentType(nullToEmpty(form.get(P_CONTENT_TYPE)));
		if (isBlank(options.getContentType())) {
			options.setContentType(MailOptions.DEFAULT_CONTENT_TYPE);
		}
		options.setConnectTimeoutMs(parseInt(form.get(P_CONNECT_TIMEOUT_MS), options.getConnectTimeoutMs()));
		options.setReadTimeoutMs(parseInt(form.get(P_READ_TIMEOUT_MS), options.getReadTimeoutMs()));
		config.setOptions(options);

		MailSmtpConfig smtp = new MailSmtpConfig();
		smtp.setHost(nullToEmpty(form.get(P_SMTP_HOST)));
		smtp.setPort(parseInt(form.get(P_SMTP_PORT), 0));
		smtp.setEncryption(normalizeEncryption(form.get(P_SMTP_ENCRYPTION)));
		smtp.setAccount(nullToEmpty(form.get(P_SMTP_ACCOUNT)));
		smtp.setPassword(form.get(P_SMTP_PASSWORD) == null ? "" : form.get(P_SMTP_PASSWORD).trim());
		smtp.setAuth(parseBoolean(form.get(P_SMTP_AUTH)));
		smtp.setSslTrust(parseBoolean(form.get(P_SMTP_SSL_TRUST)));
		config.setSmtp(smtp);

		return config;
	}

	// ===================== 内部工具 =====================

	private static String normalizeEncryption(String value) {
		return MailEncryption.fromCode(value).getCode();
	}

	private static boolean parseBoolean(String value) {
		if (value == null) {
			return false;
		}
		String trimmed = value.trim().toLowerCase();
		return "true".equals(trimmed) || "on".equals(trimmed) || "1".equals(trimmed) || "yes".equals(trimmed);
	}

	private static int parseInt(String value, int defaultValue) {
		if (isBlank(value)) {
			return defaultValue;
		}
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return defaultValue;
		}
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value.trim();
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private MailConfigForm() {
	}
}
