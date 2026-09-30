package com.DocSystem.service.mail;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.Log;
import com.DocSystem.commonService.mail.MailAliyunConfig;
import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailEncryption;
import com.DocSystem.commonService.mail.MailHttpConfig;
import com.DocSystem.commonService.mail.MailOptions;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSmtpConfig;
import com.DocSystem.commonService.mail.MailTencentConfig;
import com.DocSystem.service.SystemSettingService;
import com.alibaba.fastjson.JSON;
import util.ReadProperties;

/**
 * 邮件配置存储/装配层 —— 配置以 {@code system_setting} 表为**唯一权威源**
 * （与短信的 {@code SmsConfigStore} 同一套路，见方案文档 D2/D3）。
 *
 * <p>取值链：
 * <pre>
 *   system_setting 表（mail.*）
 *     → 表内还没有任何 mail.* 行时：用 docSysConfig.properties 旧值（in-memory 兜底）
 *       → 最后：全空配置（enabled=true、provider 为空 → 发送时明确报「未配置」）
 * </pre>
 *
 * <p>首次启用时的种子迁移在 {@link #ensureSeeded()}：仅在表内没有 mail.* 行时执行一次，
 * 由 {@code docSysInit()} 成功路径的建表钩子调用（幂等、失败不影响启动）。
 *
 * <p>❗与短信的一处**有意的差异**：旧值读取以**运行期真正生效的那份** properties 为准
 * （{@code EmailService} 读的是 classpath 下的 {@code WEB-INF/classes/docSysConfig.properties}），
 * 因此这里 classpath 优先、{@code docSys.ini} 其次（短信那边是 ini 优先）。
 * 保证「迁移进表的值」= 「改造前实际在用的值」。
 */
@Component
public class MailConfigStore {

	// ================= 配置表 key（点分命名空间） =================

	public static final String KEY_ENABLED = "mail.enabled";
	public static final String KEY_PROVIDER = "mail.provider";
	public static final String KEY_FROM = "mail.from";
	public static final String KEY_FROM_NAME = "mail.fromName";
	public static final String KEY_SMTP = "mail.smtp";
	public static final String KEY_OPTIONS = "mail.options";

	/** 阿里云邮件推送（一段 JSON） */
	public static final String KEY_ALIYUN = "mail.aliyun";

	/** 腾讯云 SES（一段 JSON） */
	public static final String KEY_TENCENT = "mail.tencent";

	/** 自定义 HTTP 网关（一段 JSON） */
	public static final String KEY_HTTP = "mail.http";

	/** 全部邮件配置 key（保存时逐个写；读取时逐个取） */
	public static final String[] ALL_KEYS = {
			KEY_ENABLED, KEY_PROVIDER, KEY_FROM, KEY_FROM_NAME, KEY_SMTP, KEY_ALIYUN, KEY_TENCENT, KEY_HTTP,
			KEY_OPTIONS
	};

	/** 判定「表中是否已有邮件配置」的前缀 */
	public static final String KEY_PREFIX = "mail.";

	// ================= 存量 properties（种子来源） =================

	private static final String CONFIG_FILE = "docSysConfig.properties";

	public static final String LEGACY_KEY_HOST = "mail.smtp.host";
	public static final String LEGACY_KEY_PORT = "mail.smtp.port";
	public static final String LEGACY_KEY_FROM_USER = "fromuser";
	public static final String LEGACY_KEY_FROM_PWD = "frompwd";
	public static final String LEGACY_KEY_STARTTLS = "mail.smtp.starttls.enable";
	public static final String LEGACY_KEY_AUTH = "mail.smtp.auth";
	public static final String LEGACY_KEY_MESSAGE_TYPE = "messagetype";

	/** 需要读取的全部存量 key（顺序仅影响日志可读性） */
	public static final String[] LEGACY_KEYS = {
			LEGACY_KEY_HOST, LEGACY_KEY_PORT, LEGACY_KEY_FROM_USER, LEGACY_KEY_FROM_PWD,
			LEGACY_KEY_STARTTLS, LEGACY_KEY_AUTH, LEGACY_KEY_MESSAGE_TYPE
	};

	/**
	 * 迁移时端口缺省值（方案文档 D8）：老配置没有 {@code mail.smtp.port}，
	 * **不猜 465/587**，保持老行为填 25；页面会用提醒引导管理员改成 465/587。
	 */
	public static final int LEGACY_DEFAULT_PORT = 25;

	private static final String SEED_REMARK_PREFIX = "首次启用时由 " + CONFIG_FILE + " 迁移 @ ";

	/** 轻量邮箱格式校验（只挡明显的笔误，不做 RFC 校验） */
	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

	@Autowired
	private SystemSettingService systemSettingService;

	// ===================== 纯函数（无 IO，便于测试） =====================

	/**
	 * 把存量 properties 的邮件 key 投影成 {@code mail.*} 行（首次种子迁移的内容）。
	 *
	 * <p>规则（方案文档 §4）：
	 * <ul>
	 *   <li>{@code mail.smtp.host} / {@code fromuser} / {@code frompwd} 全空 → 返回空 Map（不写任何行）；</li>
	 *   <li>供应商固定 {@code smtp}（存量只有 SMTP 一种形态）；</li>
	 *   <li>{@code fromuser} → 同时作为 SMTP 登录账号与发件人（老代码就是这样发的）；</li>
	 *   <li>端口缺失 → {@link #LEGACY_DEFAULT_PORT}；</li>
	 *   <li>{@code mail.smtp.starttls.enable=true} → {@code starttls}，否则 {@code none}；</li>
	 *   <li>{@code messagetype}（如 {@code text/html;charset=gb2312}）→ 归一到 {@code ;charset=UTF-8}（D4）；</li>
	 *   <li>发件人显示名不迁移（老配置没有这个概念）。</li>
	 * </ul>
	 *
	 * @return key → value（有序：enabled/provider/from/smtp/options）
	 */
	public static Map<String, String> buildSeedEntries(Map<String, String> legacyProps) {
		Map<String, String> entries = new LinkedHashMap<String, String>();
		if (legacyProps == null || legacyProps.isEmpty()) {
			return entries;
		}

		String host = trimToNull(legacyProps.get(LEGACY_KEY_HOST));
		String fromUser = trimToNull(legacyProps.get(LEGACY_KEY_FROM_USER));
		String fromPwd = trimToNull(legacyProps.get(LEGACY_KEY_FROM_PWD));

		if (host == null && fromUser == null && fromPwd == null) {
			// 三个关键项都空 = 从未配置过邮件 → 保持「从未配置」，一行都不写
			return entries;
		}

		entries.put(KEY_ENABLED, "true");
		entries.put(KEY_PROVIDER, MailProviderType.SMTP.getCode());
		if (fromUser != null) {
			entries.put(KEY_FROM, fromUser);
		}

		MailSmtpConfig smtp = new MailSmtpConfig();
		smtp.setHost(nullToEmpty(host));
		smtp.setPort(parsePort(legacyProps.get(LEGACY_KEY_PORT)));
		smtp.setEncryption(parseBoolean(legacyProps.get(LEGACY_KEY_STARTTLS))
				? MailEncryption.STARTTLS.getCode() : MailEncryption.NONE.getCode());
		smtp.setAccount(nullToEmpty(fromUser));
		smtp.setPassword(nullToEmpty(fromPwd));
		// auth 缺省 true（老配置没写时 JavaMail 的默认行为也是「有认证器就认证」）
		smtp.setAuth(!legacyProps.containsKey(LEGACY_KEY_AUTH) || parseBoolean(legacyProps.get(LEGACY_KEY_AUTH)));
		smtp.setSslTrust(false);
		entries.put(KEY_SMTP, JSON.toJSONString(smtp));

		MailOptions options = new MailOptions();
		options.setContentType(normalizeContentType(legacyProps.get(LEGACY_KEY_MESSAGE_TYPE)));
		entries.put(KEY_OPTIONS, JSON.toJSONString(options));

		return entries;
	}

	/**
	 * 正文类型归一：只保留 {@code type/subtype}，编码统一 UTF-8（方案文档 D4）。
	 *
	 * <pre>
	 *   text/html;charset=gb2312  → text/html;charset=UTF-8
	 *   text/plain                → text/plain;charset=UTF-8
	 *   null / 空                 → text/html;charset=UTF-8（默认值）
	 * </pre>
	 */
	public static String normalizeContentType(String raw) {
		String value = trimToNull(raw);
		if (value == null) {
			return MailOptions.DEFAULT_CONTENT_TYPE;
		}
		int semicolon = value.indexOf(';');
		String base = (semicolon >= 0 ? value.substring(0, semicolon) : value).trim();
		if (base.isEmpty()) {
			return MailOptions.DEFAULT_CONTENT_TYPE;
		}
		return base + ";charset=UTF-8";
	}

	/** 端口解析：非数字/越界一律回落 {@link #LEGACY_DEFAULT_PORT}（不猜测） */
	public static int parsePort(String value) {
		String trimmed = trimToNull(value);
		if (trimmed == null) {
			return LEGACY_DEFAULT_PORT;
		}
		try {
			int port = Integer.parseInt(trimmed);
			return (port >= 1 && port <= 65535) ? port : LEGACY_DEFAULT_PORT;
		} catch (NumberFormatException e) {
			return LEGACY_DEFAULT_PORT;
		}
	}

	/**
	 * 由 {@code mail.*} 行装配配置对象。
	 * 解析失败只记日志并跳过该项 —— 读配置绝不能让发送链路炸掉。
	 */
	public MailConfig assemble(Map<String, String> rows) {
		MailConfig config = new MailConfig();
		if (rows == null || rows.isEmpty()) {
			return config;
		}

		// enabled 缺省 true：老系统没有开关，读不到就当作启用（避免升级后邮件静默失效）
		if (rows.containsKey(KEY_ENABLED)) {
			config.setEnabled(parseBoolean(rows.get(KEY_ENABLED)));
		}

		config.setProvider(trimToNull(rows.get(KEY_PROVIDER)));
		config.setFrom(trimToNull(rows.get(KEY_FROM)));
		config.setFromName(trimToNull(rows.get(KEY_FROM_NAME)));

		config.setSmtp(parseJson(rows.get(KEY_SMTP), MailSmtpConfig.class, config.getSmtp()));
		config.setAliyun(parseJson(rows.get(KEY_ALIYUN), MailAliyunConfig.class, config.getAliyun()));
		config.setTencent(parseJson(rows.get(KEY_TENCENT), MailTencentConfig.class, config.getTencent()));
		config.setHttp(parseJson(rows.get(KEY_HTTP), MailHttpConfig.class, config.getHttp()));
		config.setOptions(parseJson(rows.get(KEY_OPTIONS), MailOptions.class, config.getOptions()));

		return config;
	}

	/** 阻断性校验错误（空 = 通过） */
	public List<String> validate(MailConfig config) {
		List<String> errors = new ArrayList<String>();
		if (config == null) {
			errors.add("配置为空");
			return errors;
		}

		MailProviderType type = config.getProviderType();
		if (type == null) {
			errors.add("未选择邮件发信方式（" + KEY_PROVIDER + "）");
		} else if (!type.isImplemented()) {
			errors.add(type.getDisplayName() + " 暂未接入，请改选其它发信方式");
		} else if (type == MailProviderType.SMTP) {
			MailSmtpConfig smtp = (config.getSmtp() == null) ? new MailSmtpConfig() : config.getSmtp();
			if (isBlank(smtp.getHost())) {
				errors.add("缺少必填项：SMTP 服务器地址（" + KEY_SMTP + ".host）");
			}
			if (smtp.getPort() < 1 || smtp.getPort() > 65535) {
				errors.add("SMTP 端口需在 1~65535 之间");
			}
			if (isBlank(smtp.getAccount())) {
				errors.add("缺少必填项：SMTP 登录账号");
			}
			if (smtp.isAuth() && isBlank(smtp.getPassword())) {
				errors.add("缺少必填项：SMTP 登录密码/授权码（163、QQ 等必须填授权码，不是登录密码）");
			}
			// 465 是隐式 SSL 端口，配成 STARTTLS 必然握手失败 —— 直接挡住，省得用户反复试
			if (smtp.getEncryptionType() == MailEncryption.STARTTLS && smtp.getPort() == 465) {
				errors.add("465 端口是隐式 SSL，加密方式请选「SSL/TLS」（STARTTLS 通常用 587）");
			}
		} else if (type == MailProviderType.ALIYUN) {
			MailAliyunConfig aliyun = (config.getAliyun() == null) ? new MailAliyunConfig() : config.getAliyun();
			if (isBlank(aliyun.getAccessKeyId())) {
				errors.add("缺少必填项：阿里云 AccessKeyId（" + KEY_ALIYUN + ".accessKeyId）");
			}
			if (isBlank(aliyun.getAccessKeySecret())) {
				errors.add("缺少必填项：阿里云 AccessKeySecret");
			}
			if (isBlank(aliyun.getAccountName())) {
				errors.add("缺少必填项：阿里云发信地址（" + KEY_ALIYUN + ".accountName，需先在控制台创建并验证）");
			}
		} else if (type == MailProviderType.TENCENT) {
			MailTencentConfig tencent = (config.getTencent() == null) ? new MailTencentConfig() : config.getTencent();
			if (isBlank(tencent.getSecretId())) {
				errors.add("缺少必填项：腾讯云 SecretId（" + KEY_TENCENT + ".secretId）");
			}
			if (isBlank(tencent.getSecretKey())) {
				errors.add("缺少必填项：腾讯云 SecretKey");
			}
			if (isBlank(tencent.getRegion())) {
				errors.add("缺少必填项：腾讯云地域 Region（该接口只支持 ap-guangzhou / ap-hongkong）");
			}
			if (isBlank(config.getEffectiveFrom())) {
				errors.add("缺少必填项：腾讯云发信地址（" + KEY_TENCENT + ".fromEmailAddress 或 " + KEY_FROM + "）");
			}
			if (tencent.isTemplateMode() && tencent.getEffectiveTemplateId() <= 0) {
				errors.add("腾讯云选择了模板模式，但模板 ID 未配置或不是数字：" + tencent.getTemplateId());
			}
		} else if (type == MailProviderType.HTTP) {
			MailHttpConfig http = (config.getHttp() == null) ? new MailHttpConfig() : config.getHttp();
			String url = trimToNull(http.getUrl());
			if (url == null) {
				errors.add("缺少必填项：自定义网关地址（" + KEY_HTTP + ".url）");
			} else if (!url.startsWith("http://") && !url.startsWith("https://")) {
				errors.add("自定义网关地址需以 http:// 或 https:// 开头：" + url);
			}
		}

		String from = trimToNull(config.getFrom());
		if (from != null && !EMAIL_PATTERN.matcher(from).matches()) {
			errors.add("发件人邮箱格式不正确：" + from);
		}

		MailOptions options = config.getOptions();
		if (options != null) {
			if (options.getConnectTimeoutMs() < 1000 || options.getConnectTimeoutMs() > 60000) {
				errors.add("连接超时需在 1000~60000 毫秒之间");
			}
			if (options.getReadTimeoutMs() < 1000 || options.getReadTimeoutMs() > 300000) {
				errors.add("读写超时需在 1000~300000 毫秒之间");
			}
		}

		if (config.isEnabled() && type != null && type.isImplemented() && !config.isProviderConfigured()) {
			errors.add("已启用邮件服务，但当前发信方式（" + type.getDisplayName() + "）的必填项未填完整");
		}

		return errors;
	}

	/** 非阻断性提醒（空 = 无） */
	public List<String> getWarnings(MailConfig config) {
		List<String> warnings = new ArrayList<String>();
		if (config == null) {
			return warnings;
		}

		if (!config.isEnabled()) {
			warnings.add("邮件服务当前未启用（" + KEY_ENABLED + "=false）");
		}

		MailProviderType type = config.getProviderType();
		if (type == null) {
			warnings.add("尚未配置邮件发信方式（" + KEY_PROVIDER + "）");
		} else if (type == MailProviderType.SMTP) {
			MailSmtpConfig smtp = (config.getSmtp() == null) ? new MailSmtpConfig() : config.getSmtp();
			int port = config.getEffectivePort();
			if (port == 25) {
				// 用户反馈「这样配置不行」的根因：云主机普遍封禁出站 25 端口
				warnings.add("25 端口在云主机上通常被封禁，建议改用 587（STARTTLS）或 465（SSL/TLS）");
			}
			if (smtp.getEncryptionType() == MailEncryption.NONE) {
				warnings.add("当前为明文发送（不加密），账号密码与邮件内容可被窃听，建议启用 STARTTLS 或 SSL/TLS");
			}
			if (smtp.getEncryptionType() == MailEncryption.SSL && (port == 25 || port == 587)) {
				warnings.add("SSL/TLS 通常使用 465 端口，当前端口为 " + port + "，请与服务商文档核对");
			}
			if (smtp.isSslTrust()) {
				warnings.add("已开启「信任任意服务器证书」，存在中间人风险，仅建议自签名证书的内网服务器使用");
			}
			if (isBlank(config.getFrom())) {
				warnings.add("未填写发件人邮箱（" + KEY_FROM + "），将使用 SMTP 登录账号作为发件人");
			}
		} else if (type == MailProviderType.ALIYUN) {
			MailAliyunConfig aliyun = (config.getAliyun() == null) ? new MailAliyunConfig() : config.getAliyun();
			warnings.add("阿里云邮件推送（SingleSendMail）不支持附件；带附件的邮件会被直接报错，请改用 SMTP 或腾讯云 SES");
			if (isBlank(aliyun.getEndpoint())) {
				warnings.add("阿里云接入地址未填，将使用默认 " + MailAliyunConfig.DEFAULT_ENDPOINT);
			}
		} else if (type == MailProviderType.TENCENT) {
			MailTencentConfig tencent = (config.getTencent() == null) ? new MailTencentConfig() : config.getTencent();
			if (tencent.isTemplateMode()) {
				warnings.add("腾讯云当前为模板模式：邮件正文由控制台模板决定，本地只传短变量（官方限制 ≤800 字节且不能是 HTML）");
			} else {
				warnings.add("腾讯云当前为自定义内容模式（Simple）：该字段官方已标为废弃，新账号需先开通「自定义内容」权限，否则会被拒（返回码 1011）");
			}
			if (isBlank(tencent.getEndpoint())) {
				warnings.add("腾讯云接入地址未填，将使用默认 " + MailTencentConfig.DEFAULT_ENDPOINT);
			}
		} else if (type == MailProviderType.HTTP) {
			MailHttpConfig http = (config.getHttp() == null) ? new MailHttpConfig() : config.getHttp();
			if (isBlank(http.getSuccessField())) {
				warnings.add("自定义网关未配置成功判定字段，将以 HTTP 2xx 作为发送成功（部分网关 200 也可能表示业务失败）");
			}
			warnings.add("自定义 HTTP 网关不支持附件；带附件的邮件会被直接报错");
		}

		String contentType = config.getEffectiveContentType();
		if (contentType != null && !contentType.toLowerCase().contains("utf-8")) {
			warnings.add("正文编码不是 UTF-8（当前 " + contentType + "），中文可能显示异常");
		}

		return warnings;
	}

	// ===================== 需要数据库 =====================

	/** 表内是否已有任一 {@code mail.*} 配置（即已完成首次种子迁移或用户已保存过） */
	public boolean hasMailConfig() {
		return systemSettingService.countByPrefix(KEY_PREFIX + "%") > 0;
	}

	/**
	 * 装配当前生效配置：表优先；表内没有 mail.* 行时用老 properties 兜底；
	 * 都没有时返回全空配置（provider 为空 → 发送时报「未配置」，而不是含混的连接失败）。
	 */
	public MailConfig load() {
		Map<String, String> rows = new LinkedHashMap<String, String>();
		for (String key : ALL_KEYS) {
			String value = systemSettingService.getValue(key);
			if (value != null) {
				rows.put(key, value);
			}
		}
		if (!rows.isEmpty()) {
			return assemble(rows);
		}

		Map<String, String> legacy = readLegacyEntries();
		if (!legacy.isEmpty()) {
			Log.info("MailConfigStore.load() 表内无 " + KEY_PREFIX + "* 配置，暂用 " + CONFIG_FILE + " 旧值");
			return assemble(legacy);
		}

		return new MailConfig();
	}

	/**
	 * 首次启用时的种子迁移：**仅在表内没有任何 mail.* 行时**执行一次。
	 * 老配置为空则不写任何行（保持「从未配置」）。
	 *
	 * @return true 表示本次真的写入了配置行
	 */
	public boolean ensureSeeded() {
		if (hasMailConfig()) {
			// 用 info 而非 debug：每次启动一条，便于确认种子迁移只做一次（幂等）
			Log.info("MailConfigStore.ensureSeeded() 表内已有 " + KEY_PREFIX + "* 配置，跳过种子迁移");
			return false;
		}

		Map<String, String> entries = buildSeedEntries(readLegacyEntries());
		if (entries.isEmpty()) {
			Log.info("MailConfigStore.ensureSeeded() " + CONFIG_FILE + " 无邮件配置，不写入任何 " + KEY_PREFIX + "* 行");
			return false;
		}

		String remark = SEED_REMARK_PREFIX + nowString();
		int written = 0;
		for (Map.Entry<String, String> entry : entries.entrySet()) {
			if (systemSettingService.seedIfAbsent(entry.getKey(), entry.getValue(), remark)) {
				written++;
			}
		}
		Log.info("MailConfigStore.ensureSeeded() 已从 " + CONFIG_FILE + " 迁移 " + written + " 条邮件配置");
		return written > 0;
	}

	/**
	 * 保存配置（逐 key 写入；保留每行原有备注，没有则给一句来源说明）。
	 *
	 * @return true 表示全部写入成功
	 */
	public boolean save(MailConfig config) {
		if (config == null) {
			return false;
		}

		Map<String, String> values = new LinkedHashMap<String, String>();
		values.put(KEY_ENABLED, config.isEnabled() ? "true" : "false");
		values.put(KEY_PROVIDER, nullToEmpty(config.getProvider()));
		values.put(KEY_FROM, nullToEmpty(config.getFrom()));
		values.put(KEY_FROM_NAME, nullToEmpty(config.getFromName()));
		values.put(KEY_SMTP, JSON.toJSONString(config.getSmtp() == null ? new MailSmtpConfig() : config.getSmtp()));
		values.put(KEY_ALIYUN,
				JSON.toJSONString(config.getAliyun() == null ? new MailAliyunConfig() : config.getAliyun()));
		values.put(KEY_TENCENT,
				JSON.toJSONString(config.getTencent() == null ? new MailTencentConfig() : config.getTencent()));
		values.put(KEY_HTTP, JSON.toJSONString(config.getHttp() == null ? new MailHttpConfig() : config.getHttp()));
		values.put(KEY_OPTIONS, JSON.toJSONString(config.getOptions() == null ? new MailOptions() : config.getOptions()));

		boolean allOk = true;
		for (Map.Entry<String, String> entry : values.entrySet()) {
			String remark = systemSettingService.getRemark(entry.getKey());
			if (remark == null) {
				remark = "由管理后台邮件服务页维护";
			}
			if (!systemSettingService.set(entry.getKey(), entry.getValue(), remark)) {
				allOk = false;
				Log.info("MailConfigStore.save() 写入失败 key:" + entry.getKey());
			}
		}
		return allOk;
	}

	// ===================== 生效值（含逐字段兜底） =====================

	/** 发件人地址（{@code mail.from} 空 → SMTP 登录账号） */
	public String getEffectiveFrom() {
		return load().getEffectiveFrom();
	}

	/** 发件人显示名（空 → null） */
	public String getEffectiveFromName() {
		return load().getEffectiveFromName();
	}

	/** 正文类型（缺失 → {@code text/html;charset=UTF-8}） */
	public String getEffectiveContentType() {
		return load().getEffectiveContentType();
	}

	/** 连接超时（越界/缺失 → 10000ms） */
	public int getEffectiveConnectTimeoutMs() {
		MailOptions options = load().getOptions();
		int value = (options == null) ? 0 : options.getConnectTimeoutMs();
		return (value >= 1000 && value <= 60000) ? value : 10000;
	}

	/** 读写超时（越界/缺失 → 30000ms） */
	public int getEffectiveReadTimeoutMs() {
		MailOptions options = load().getOptions();
		int value = (options == null) ? 0 : options.getReadTimeoutMs();
		return (value >= 1000 && value <= 300000) ? value : 30000;
	}

	// ===================== 存量 properties 读取 =====================

	/**
	 * 读取一份存量邮件配置（只为种子迁移与表空兜底）。
	 *
	 * <p>读取顺序与 {@code EmailService} 保持一致：classpath（{@code WEB-INF/classes}）优先，
	 * {@code docSys.ini} 仅在 classpath 缺失该项时兜底。
	 *
	 * @return 非空项组成的 Map（全空 → 空 Map）
	 */
	public Map<String, String> readLegacyEntries() {
		Map<String, String> props = new LinkedHashMap<String, String>();
		for (String key : LEGACY_KEYS) {
			String value = readLegacyValue(key);
			if (value != null) {
				props.put(key, value);
			}
		}
		return props;
	}

	/** 读取单个存量 key（classpath 优先，其次 ini 镜像） */
	public String readLegacyValue(String key) {
		String value = ReadProperties.read(CONFIG_FILE, key);
		if (isBlank(value)) {
			String iniPath = BaseFunction.getDocSysIniPath();
			if (iniPath != null && !iniPath.isEmpty()) {
				value = ReadProperties.getValue(iniPath + CONFIG_FILE, key);
			}
		}
		return isBlank(value) ? null : value.trim();
	}

	// ===================== 内部工具 =====================

	private <T> T parseJson(String json, Class<T> clazz, T defaultValue) {
		if (isBlank(json)) {
			return defaultValue;
		}
		try {
			T parsed = JSON.parseObject(json, clazz);
			return (parsed == null) ? defaultValue : parsed;
		} catch (Exception e) {
			Log.info("MailConfigStore 解析 " + clazz.getSimpleName() + " 失败: " + e.getMessage());
			return defaultValue;
		}
	}

	private static boolean parseBoolean(String value) {
		if (value == null) {
			return false;
		}
		String trimmed = value.trim();
		return "true".equalsIgnoreCase(trimmed) || "1".equals(trimmed) || "yes".equalsIgnoreCase(trimmed);
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value;
	}

	private static String nowString() {
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
	}
}
