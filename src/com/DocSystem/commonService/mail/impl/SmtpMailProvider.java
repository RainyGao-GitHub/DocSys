package com.DocSystem.commonService.mail.impl;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Date;
import java.util.List;
import java.util.Properties;

import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.mail.AuthenticationFailedException;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.SendFailedException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.Address;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.internet.MimeUtility;
import javax.mail.Authenticator;

import com.DocSystem.common.Log;
import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailEncryption;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailOptions;
import com.DocSystem.commonService.mail.MailProvider;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.mail.MailSmtpConfig;
import com.sun.mail.smtp.SMTPAddressFailedException;
import com.sun.mail.smtp.SMTPSendFailedException;
import com.sun.mail.smtp.SMTPTransport;

/**
 * SMTP 发信实现（本项目自带 JavaMail 1.4.4：{@code mailapi.jar} + {@code smtp.jar}）。
 *
 * <p>三种加密形态（见 {@link MailEncryption}），按加密方式选择 JavaMail 的传输协议：
 * <ul>
 *   <li>{@code NONE} → 协议 {@code smtp}，端口默认 25（云主机多封禁出站 25）</li>
 *   <li>{@code STARTTLS} → 协议 {@code smtp} + {@code mail.smtp.starttls.enable/required=true}，端口默认 587</li>
 *   <li>{@code SSL} → 协议 {@code smtps}（{@code SMTPSSLTransport}，已核实存在于 smtp.jar），端口默认 465</li>
 * </ul>
 *
 * <p>❗与老实现的关键差别（修 P1/P2/P4/P7）：
 * <ol>
 *   <li>**不再把整份 docSysConfig.properties 丢给 {@code Session.getInstance}**，
 *       而是显式构造属性（否则 properties 里任何键都会成为 JavaMail 属性，行为不可控）；</li>
 *   <li>不再用 static 字段缓存账号密码 → 改配置即时生效；</li>
 *   <li>显式设置 {@code connectiontimeout} / {@code timeout}（老实现无超时，SMTP 不可达会一直阻塞在请求线程里）；</li>
 *   <li>失败原因结构化返回（认证失败 / 收件人被拒 / 连接超时 分开归类），不再只给一句「发送系统邮件失败」。</li>
 * </ol>
 *
 * <p>可脱网验证：{@link #buildProperties(MailConfig)} / {@link #buildSession(MailConfig)} 是纯函数，
 * 不需要网络也不需要邮件服务器；只有最后的 {@code transport.sendMessage} 才需要网络。
 */
public class SmtpMailProvider implements MailProvider {

	/** 原始信息截断长度（方案 §2.6：回显给后台但截断，避免日志/界面被堆栈刷屏） */
	private static final int RAW_LIMIT = 1000;

	@Override
	public MailProviderType getType() {
		return MailProviderType.SMTP;
	}

	/**
	 * 构造 JavaMail 属性（**纯函数，可脱网断言**）。
	 *
	 * <p>属性前缀跟随所选协议（{@code mail.smtp.*} 或 {@code mail.smtps.*}）——
	 * JavaMail 是按协议名取属性的，写错前缀会出现「配了 465/STARTTLS 却不生效」。
	 */
	public static Properties buildProperties(MailConfig config) {
		Properties props = new Properties();
		MailSmtpConfig smtp = smtpOf(config);
		MailEncryption encryption = config.getEffectiveEncryption();

		String protocol = (encryption == MailEncryption.SSL) ? "smtps" : "smtp";
		String prefix = "mail." + protocol + ".";

		props.put("mail.transport.protocol", protocol);
		props.put(prefix + "host", nullToEmpty(smtp.getHost()));
		props.put(prefix + "port", String.valueOf(config.getEffectivePort()));
		props.put(prefix + "auth", smtp.isAuth() ? "true" : "false");

		if (encryption == MailEncryption.STARTTLS) {
			props.put(prefix + "starttls.enable", "true");
			//required=true：服务器不支持 STARTTLS 时直接失败，而不是"悄悄降级成明文发送"
			props.put(prefix + "starttls.required", "true");
		}
		if (encryption == MailEncryption.SSL) {
			props.put(prefix + "ssl.enable", "true");
		}

		if (smtp.isSslTrust()) {
			//自签证书的内网服务器：信任任意证书（smtp / smtps 两个前缀都设，避免协议前缀差异）
			props.put("mail.smtp.ssl.trust", "*");
			props.put("mail.smtps.ssl.trust", "*");
			props.put(prefix + "ssl.checkserveridentity", "false");
		}

		props.put(prefix + "connectiontimeout", String.valueOf(optionsOf(config).getConnectTimeoutMs()));
		props.put(prefix + "timeout", String.valueOf(optionsOf(config).getReadTimeoutMs()));
		return props;
	}

	/** 构造 JavaMail 会话（需要认证时挂 Authenticator；**纯函数**） */
	public static Session buildSession(MailConfig config) {
		Properties props = buildProperties(config);
		final MailSmtpConfig smtp = smtpOf(config);
		if (smtp.isAuth()) {
			return Session.getInstance(props, new Authenticator() {
				@Override
				protected PasswordAuthentication getPasswordAuthentication() {
					return new PasswordAuthentication(nullToEmpty(smtp.getAccount()), nullToEmpty(smtp.getPassword()));
				}
			});
		}
		return Session.getInstance(props);
	}

	@Override
	public MailSendResult send(MailConfig config, MailMessage message) {
		String provider = getType().getCode();
		if (config == null || message == null) {
			return MailSendResult.failure(provider, "配置或邮件内容为空");
		}

		String serverResponse = null;
		try {
			Session session = buildSession(config);
			MimeMessage mimeMessage = buildMimeMessage(session, config, message);

			Transport transport = session.getTransport();
			try {
				//无参 connect()：用会话属性里的 host/port 与 Authenticator
				transport.connect();
				transport.sendMessage(mimeMessage, mimeMessage.getAllRecipients());
				if (transport instanceof SMTPTransport) {
					serverResponse = ((SMTPTransport) transport).getLastServerResponse();
				}
			} finally {
				closeQuietly(transport);
			}
			return MailSendResult.success(provider, "OK", serverResponse, serverResponse);
		} catch (AuthenticationFailedException e) {
			//最常见的"配了不通"：用登录密码而不是授权码（163 / QQ / 企业邮箱强制授权码）
			return MailSendResult.failure(provider, "AuthenticationFailedException",
					"认证失败：请检查账号与密码/授权码（163、QQ 等必须使用授权码，不是登录密码）",
					describe(e));
		} catch (MessagingException e) {
			//收件人被拒时把「哪个地址被拒」一并说清楚（老实现只给一句「发送系统邮件失败」）
			String invalid = invalidAddressesOf(e);
			String detail = nullToEmpty(e.getMessage());
			if (invalid != null) {
				detail = detail + "（被拒收件人：" + invalid + "）";
			}
			return MailSendResult.failure(provider, returnCodeOf(e), detail, describe(e));
		} catch (Exception e) {
			return MailSendResult.failure(provider, e.getClass().getSimpleName(), e.getMessage(), describe(e));
		}
	}

	/** 组装 MimeMessage（主题/发件人显示名一律 UTF-8；有附件时用 mixed 多部分） */
	private MimeMessage buildMimeMessage(Session session, MailConfig config, MailMessage message) throws Exception {
		MimeMessage mimeMessage = new MimeMessage(session);

		String from = config.getEffectiveFrom();
		String fromName = config.getEffectiveFromName();
		if (fromName == null) {
			mimeMessage.setFrom(new InternetAddress(from));
		} else {
			mimeMessage.setFrom(new InternetAddress(from, fromName, "UTF-8"));
		}

		List<String> toList = message.getTo();
		if (toList != null) {
			for (String to : toList) {
				mimeMessage.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
			}
		}

		String subject = (message.getSubject() == null || message.getSubject().trim().isEmpty())
				? "(无主题)" : message.getSubject();
		mimeMessage.setSubject(subject, "UTF-8");

		String contentType = config.getEffectiveContentType();
		String content = nullToEmpty(message.getContent());
		List<String> attachments = message.getAttachments();
		if (attachments == null || attachments.isEmpty()) {
			mimeMessage.setContent(content, contentType);
		} else {
			MimeMultipart multipart = new MimeMultipart("mixed");
			MimeBodyPart bodyPart = new MimeBodyPart();
			bodyPart.setContent(content, contentType);
			multipart.addBodyPart(bodyPart);
			for (String path : attachments) {
				File file = new File(path);
				if (!file.exists()) {
					throw new FileNotFoundException("附件不存在：" + path);
				}
				multipart.addBodyPart(buildAttachmentPart(file));
			}
			mimeMessage.setContent(multipart);
		}

		mimeMessage.setSentDate(new Date());
		return mimeMessage;
	}

	/**
	 * 组装附件段。
	 *
	 * <p>❗不能用 {@link MimeBodyPart#attachFile(java.io.File)}：JavaMail 1.4.4 会拿
	 * **平台默认编码**（本工程 Tomcat 是 GBK）去拼 {@code name=} / {@code filename=}，
	 * 非 ASCII 文件名每个汉字只剩低字节（{@code 附件_测试.txt} → {@code D?_K?.txt}），
	 * 同时把附件正文的 charset 声明成 GBK。所以这里显式写头：
	 * <ul>
	 *   <li>文件名：RFC2047 编码字（UTF-8 + Base64），Outlook / Foxmail / Thunderbird 都能还原</li>
	 *   <li>正文：charset=UTF-8 + base64 传输编码（不依赖 JVM 默认编码）</li>
	 * </ul>
	 */
	private static MimeBodyPart buildAttachmentPart(File file) throws Exception {
		FileDataSource dataSource = new FileDataSource(file);
		MimeBodyPart part = new MimeBodyPart();
		part.setDataHandler(new DataHandler(dataSource));

		String fileName = file.getName();
		String encodedName = encodeFileName(fileName);
		String contentType = dataSource.getContentType();
		int semicolon = contentType.indexOf(';');
		String mimeType = (semicolon > 0) ? contentType.substring(0, semicolon).trim() : contentType.trim();

		part.setHeader("Content-Type", mimeType + "; charset=UTF-8; name=\"" + encodedName + "\"");
		part.setHeader("Content-Transfer-Encoding", "base64");
		part.setHeader("Content-Disposition", "attachment; filename=\"" + encodedName + "\"");
		return part;
	}

	/** 非 ASCII 文件名按 RFC2047 编码（ASCII 名保持原样，避免多余编码） */
	private static String encodeFileName(String fileName) throws Exception {
		if (isAscii(fileName)) {
			return fileName;
		}
		return MimeUtility.encodeText(fileName, "UTF-8", "B");
	}

	private static boolean isAscii(String text) {
		for (int i = 0; i < text.length(); i++) {
			if (text.charAt(i) > 127) {
				return false;
			}
		}
		return true;
	}

	// ===================== 内部工具 =====================

	private static MailSmtpConfig smtpOf(MailConfig config) {
		return (config.getSmtp() == null) ? new MailSmtpConfig() : config.getSmtp();
	}

	private static MailOptions optionsOf(MailConfig config) {
		if (config.getOptions() != null) {
			return config.getOptions();
		}
		return new MailOptions();
	}

	/**
	 * SMTP 返回码（收件人被拒 / 发信被拒时最有价值）。
	 *
	 * <p>❗不能只看异常自身类型：JavaMail 在**收件人被拒**时抛的是 {@link javax.mail.SendFailedException}
	 * （"Invalid Addresses"），真正的 550 藏在它的 {@code getNextException()} 链里。
	 * 所以这里沿异常链一路找 {@link SMTPAddressFailedException} / {@link SMTPSendFailedException}。
	 */
	private static String returnCodeOf(MessagingException e) {
		MessagingException current = e;
		int guard = 0;
		while (current != null && guard++ < 10) {
			if (current instanceof SMTPAddressFailedException) {
				return String.valueOf(((SMTPAddressFailedException) current).getReturnCode());
			}
			if (current instanceof SMTPSendFailedException) {
				return String.valueOf(((SMTPSendFailedException) current).getReturnCode());
			}
			current = nextMessagingException(current);
		}
		return e.getClass().getSimpleName();
	}

	/** 被拒收件人列表（SendFailedException 才有；沿异常链找第一个；用于把"哪个收件人被拒"说清楚） */
	private static String invalidAddressesOf(MessagingException e) {
		MessagingException current = e;
		int guard = 0;
		while (current != null && guard++ < 10) {
			if (current instanceof SendFailedException) {
				Address[] invalid = ((SendFailedException) current).getInvalidAddresses();
				if (invalid != null && invalid.length > 0) {
					StringBuilder sb = new StringBuilder();
					for (Address address : invalid) {
						if (sb.length() > 0) {
							sb.append(",");
						}
						sb.append(address);
					}
					return sb.toString();
				}
			}
			current = nextMessagingException(current);
		}
		return null;
	}

	/** 下一层嵌套异常（JavaMail 1.4.4 的 getNextException() 返回 Exception，需自己判定类型） */
	private static MessagingException nextMessagingException(MessagingException e) {
		Exception next = e.getNextException();
		return (next instanceof MessagingException) ? (MessagingException) next : null;
	}

	/** 异常摘要（截断，供后台展示；不写日志） */
	private static String describe(Exception e) {
		StringBuilder sb = new StringBuilder();
		sb.append(e.getClass().getName()).append(": ").append(nullToEmpty(e.getMessage()));
		Throwable cause = e.getCause();
		if (cause != null) {
			sb.append(" | cause: ").append(cause.getClass().getName()).append(": ").append(nullToEmpty(cause.getMessage()));
		}
		if (sb.length() > RAW_LIMIT) {
			return sb.substring(0, RAW_LIMIT) + "...(截断)";
		}
		return sb.toString();
	}

	private static void closeQuietly(Transport transport) {
		if (transport == null) {
			return;
		}
		try {
			if (transport.isConnected()) {
				transport.close();
			}
		} catch (Exception e) {
			Log.debug("SmtpMailProvider 关闭连接失败：" + e.getMessage());
		}
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value;
	}
}
