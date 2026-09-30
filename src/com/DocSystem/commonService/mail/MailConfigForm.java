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

	// 阿里云邮件推送（字段名与短信页的 aliuyun* 同名风格保持一致）
	public static final String P_ALIYUN_ACCESS_KEY_ID = "aliyunAccessKeyId";
	public static final String P_ALIYUN_ACCESS_KEY_SECRET = "aliyunAccessKeySecret";
	public static final String P_ALIYUN_ACCOUNT_NAME = "aliyunAccountName";
	public static final String P_ALIYUN_REGION_ID = "aliyunRegionId";
	public static final String P_ALIYUN_ENDPOINT = "aliyunEndpoint";

	// 腾讯云 SES
	public static final String P_TENCENT_SECRET_ID = "tencentSecretId";
	public static final String P_TENCENT_SECRET_KEY = "tencentSecretKey";
	public static final String P_TENCENT_REGION = "tencentRegion";
	public static final String P_TENCENT_FROM_EMAIL_ADDRESS = "tencentFromEmailAddress";
	public static final String P_TENCENT_ENDPOINT = "tencentEndpoint";
	public static final String P_TENCENT_CONTENT_MODE = "tencentContentMode";
	public static final String P_TENCENT_TEMPLATE_ID = "tencentTemplateId";
	public static final String P_TENCENT_TEMPLATE_SUBJECT_KEY = "tencentTemplateSubjectKey";
	public static final String P_TENCENT_TEMPLATE_CONTENT_KEY = "tencentTemplateContentKey";

	// 自定义 HTTP 网关
	public static final String P_HTTP_URL = "httpUrl";
	public static final String P_HTTP_METHOD = "httpMethod";
	public static final String P_HTTP_CONTENT_TYPE = "httpContentType";
	public static final String P_HTTP_PARAM_TO = "httpParamTo";
	public static final String P_HTTP_PARAM_SUBJECT = "httpParamSubject";
	public static final String P_HTTP_PARAM_CONTENT = "httpParamContent";
	public static final String P_HTTP_PARAM_FROM = "httpParamFrom";
	public static final String P_HTTP_PARAMS = "httpParams";
	public static final String P_HTTP_SUCCESS_FIELD = "httpSuccessField";
	public static final String P_HTTP_SUCCESS_VALUE = "httpSuccessValue";

	/** 本表单认识的全部字段（用于判断「请求里到底有没有带邮件表单」） */
	private static final String[] FORM_FIELDS = {
			P_ENABLED, P_PROVIDER, P_FROM, P_FROM_NAME,
			P_SMTP_HOST, P_SMTP_PORT, P_SMTP_ENCRYPTION, P_SMTP_ACCOUNT, P_SMTP_PASSWORD,
			P_SMTP_AUTH, P_SMTP_SSL_TRUST,
			P_CONTENT_TYPE, P_CONNECT_TIMEOUT_MS, P_READ_TIMEOUT_MS,
			P_ALIYUN_ACCESS_KEY_ID, P_ALIYUN_ACCESS_KEY_SECRET, P_ALIYUN_ACCOUNT_NAME,
			P_ALIYUN_REGION_ID, P_ALIYUN_ENDPOINT,
			P_TENCENT_SECRET_ID, P_TENCENT_SECRET_KEY, P_TENCENT_REGION, P_TENCENT_FROM_EMAIL_ADDRESS,
			P_TENCENT_ENDPOINT, P_TENCENT_CONTENT_MODE, P_TENCENT_TEMPLATE_ID,
			P_TENCENT_TEMPLATE_SUBJECT_KEY, P_TENCENT_TEMPLATE_CONTENT_KEY,
			P_HTTP_URL, P_HTTP_METHOD, P_HTTP_CONTENT_TYPE, P_HTTP_PARAM_TO, P_HTTP_PARAM_SUBJECT,
			P_HTTP_PARAM_CONTENT, P_HTTP_PARAM_FROM, P_HTTP_PARAMS, P_HTTP_SUCCESS_FIELD,
			P_HTTP_SUCCESS_VALUE
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

		MailAliyunConfig aliyun = new MailAliyunConfig();
		aliyun.setAccessKeyId(nullToEmpty(form.get(P_ALIYUN_ACCESS_KEY_ID)));
		aliyun.setAccessKeySecret(form.get(P_ALIYUN_ACCESS_KEY_SECRET) == null ? "" : form.get(P_ALIYUN_ACCESS_KEY_SECRET).trim());
		aliyun.setAccountName(nullToEmpty(form.get(P_ALIYUN_ACCOUNT_NAME)));
		aliyun.setRegionId(nullToEmpty(form.get(P_ALIYUN_REGION_ID)));
		aliyun.setEndpoint(nullToEmpty(form.get(P_ALIYUN_ENDPOINT)));
		config.setAliyun(aliyun);

		MailTencentConfig tencent = new MailTencentConfig();
		tencent.setSecretId(nullToEmpty(form.get(P_TENCENT_SECRET_ID)));
		tencent.setSecretKey(form.get(P_TENCENT_SECRET_KEY) == null ? "" : form.get(P_TENCENT_SECRET_KEY).trim());
		tencent.setRegion(nullToEmpty(form.get(P_TENCENT_REGION)));
		tencent.setFromEmailAddress(nullToEmpty(form.get(P_TENCENT_FROM_EMAIL_ADDRESS)));
		tencent.setEndpoint(nullToEmpty(form.get(P_TENCENT_ENDPOINT)));
		tencent.setContentMode(normalizeTencentContentMode(form.get(P_TENCENT_CONTENT_MODE)));
		tencent.setTemplateId(nullToEmpty(form.get(P_TENCENT_TEMPLATE_ID)));
		tencent.setTemplateSubjectKey(nullToEmpty(form.get(P_TENCENT_TEMPLATE_SUBJECT_KEY)));
		tencent.setTemplateContentKey(nullToEmpty(form.get(P_TENCENT_TEMPLATE_CONTENT_KEY)));
		config.setTencent(tencent);

		MailHttpConfig http = new MailHttpConfig();
		http.setUrl(nullToEmpty(form.get(P_HTTP_URL)));
		http.setMethod(nullToEmpty(form.get(P_HTTP_METHOD)));
		http.setContentType(normalizeHttpContentType(form.get(P_HTTP_CONTENT_TYPE)));
		putIfNotEmpty(http.getParamNames(), "to", form.get(P_HTTP_PARAM_TO));
		putIfNotEmpty(http.getParamNames(), "subject", form.get(P_HTTP_PARAM_SUBJECT));
		putIfNotEmpty(http.getParamNames(), "content", form.get(P_HTTP_PARAM_CONTENT));
		putIfNotEmpty(http.getParamNames(), "from", form.get(P_HTTP_PARAM_FROM));
		http.setParams(parseParamPairs(form.get(P_HTTP_PARAMS)));
		http.setSuccessField(nullToEmpty(form.get(P_HTTP_SUCCESS_FIELD)));
		http.setSuccessValue(nullToEmpty(form.get(P_HTTP_SUCCESS_VALUE)));
		config.setHttp(http);

		return config;
	}

	/** 固定参数文本（换行或 {@code &} 分隔的 {@code k=v}）→ 有序 Map（忽略空行） */
	public static Map<String, String> parseParamPairs(String text) {
		Map<String, String> params = new LinkedHashMap<String, String>();
		if (text == null) {
			return params;
		}
		for (String line : text.split("[\\r\\n&]+")) {
			String pair = line.trim();
			if (pair.isEmpty()) {
				continue;
			}
			int index = pair.indexOf('=');
			if (index <= 0) {
				// 没写 "=" 的行按「参数名 + 空值」看待，比静默丢弃更容易被发现
				params.put(pair, "");
				continue;
			}
			params.put(pair.substring(0, index).trim(), pair.substring(index + 1).trim());
		}
		return params;
	}

	/** 有序 Map → 固定参数文本（每行 {@code k=v}），用于回显到页面 textarea */
	public static String formatParamPairs(Map<String, String> params) {
		if (params == null || params.isEmpty()) {
			return "";
		}
		StringBuilder sb = new StringBuilder();
		for (Map.Entry<String, String> param : params.entrySet()) {
			if (sb.length() > 0) {
				sb.append("\n");
			}
			sb.append(param.getKey()).append("=").append(param.getValue());
		}
		return sb.toString();
	}

	// ===================== 内部工具 =====================

	private static String normalizeEncryption(String value) {
		return MailEncryption.fromCode(value).getCode();
	}

	/** 内容模式：只认 custom / template，其余一律 custom（避免配置笔误变成静默不发） */
	private static String normalizeTencentContentMode(String value) {
		String mode = (value == null) ? "" : value.trim().toLowerCase();
		return MailTencentConfig.MODE_TEMPLATE.equals(mode)
				? MailTencentConfig.MODE_TEMPLATE : MailTencentConfig.MODE_CUSTOM;
	}

	/** 请求体格式：只认 json / form，其余一律 json */
	private static String normalizeHttpContentType(String value) {
		return "form".equalsIgnoreCase((value == null) ? "" : value.trim()) ? "form" : "json";
	}

	private static void putIfNotEmpty(Map<String, String> map, String key, String value) {
		if (!isBlank(value)) {
			map.put(key, value.trim());
		}
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
