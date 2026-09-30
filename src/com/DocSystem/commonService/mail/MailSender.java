package com.DocSystem.commonService.mail;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.Log;
import com.DocSystem.commonService.mail.impl.AliyunDirectMailProvider;
import com.DocSystem.commonService.mail.impl.HttpApiMailProvider;
import com.DocSystem.commonService.mail.impl.SmtpMailProvider;
import com.DocSystem.commonService.mail.impl.TencentSesMailProvider;
import com.DocSystem.service.mail.MailConfigStore;

/**
 * 发信统一入口（镜像短信的 {@code SmsSender}）。
 *
 * <p>流程：取配置（{@link MailConfigStore}）→ 校验开关/发信方式/收件人（{@link #prepare}）
 * → 交给对应 {@link MailProvider} 发送 → 统一封装 {@link MailSendResult}。
 *
 * <p>日志一律**脱敏**：只记收件人掩码、发信方式、返回码与耗时；不记密码，也不整段打印响应
 * （响应经 {@link MailSendResult#getRaw()} 返回给后台「发送测试邮件」展示，不入日志）。
 *
 * <p>**不自动重试**（方案决策 D7）：邮件多为配置/权限问题，试探性重发只会打扰收件人。
 *
 * <p>本类放在 mvc 容器扫描的包（com.DocSystem.commonService）—— 只有控制器/服务在用它；
 * 配置存储 {@link MailConfigStore} 在 root 容器（com.DocSystem.service），两边都能看到。
 */
@Component
public class MailSender {

	/** 轻量邮箱格式校验（只挡明显笔误，与 MailConfigStore 的校验口径一致） */
	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

	@Autowired
	private MailConfigStore configStore;

	/** 已接入的发信方式实现 */
	private final Map<MailProviderType, MailProvider> providers = new LinkedHashMap<MailProviderType, MailProvider>();

	public MailSender() {
		register(new SmtpMailProvider());
		register(new AliyunDirectMailProvider());
		register(new TencentSesMailProvider());
		register(new HttpApiMailProvider());
	}

	/** 用当前生效配置构造发送上下文（**不打网络**） */
	public MailPrepared prepare(MailMessage message) {
		return prepare(null, message);
	}

	/**
	 * 用**给定配置**构造发送上下文（**不打网络**）。
	 *
	 * <p>供后台「发送测试邮件」在**保存前**用页面上的未保存值试发；{@code config} 为 null 时从
	 * {@link MailConfigStore} 取（表 → properties → 空配置兜底）。
	 */
	public MailPrepared prepare(MailConfig config, MailMessage message) {
		MailPrepared prepared = new MailPrepared();
		config = resolveConfig(config);
		prepared.setConfig(config);
		prepared.setMessage(message);

		if (message == null) {
			prepared.setError("邮件内容为空");
			return prepared;
		}

		List<String> toList = message.getTo();
		if (toList == null || toList.isEmpty()) {
			prepared.setError("收件人不能为空");
			return prepared;
		}
		for (String to : toList) {
			if (isBlank(to) || !EMAIL_PATTERN.matcher(to).matches()) {
				prepared.setError("收件人邮箱格式不正确：" + to);
				return prepared;
			}
		}

		if (!config.isEnabled()) {
			prepared.setError("邮件服务未启用（" + MailConfigStore.KEY_ENABLED + "=false）");
			return prepared;
		}

		MailProviderType type = config.getProviderType();
		if (type == null) {
			prepared.setError("未配置邮件发信方式（" + MailConfigStore.KEY_PROVIDER + "）");
			return prepared;
		}
		if (providers.get(type) == null) {
			prepared.setError("该发信方式暂未接入：" + type.getDisplayName());
			return prepared;
		}
		if (checkProviderConfigured(prepared, config, type) == false) {
			return prepared;
		}

		prepared.setReady(true);
		prepared.setProvider(type);
		return prepared;
	}

	/** 发信（用当前生效配置） */
	public MailSendResult send(MailMessage message) {
		return execute(prepare((MailConfig) null, message));
	}

	/** 发信（用**给定配置**，见 {@link #prepare(MailConfig, MailMessage)}） */
	public MailSendResult send(MailConfig config, MailMessage message) {
		return execute(prepare(config, message));
	}

	/** 取某发信方式的实现（未接入 → null） */
	public MailProvider getProvider(MailProviderType type) {
		return providers.get(type);
	}

	// ===================== 内部实现 =====================

	private void register(MailProvider provider) {
		providers.put(provider.getType(), provider);
	}

	private MailConfig resolveConfig(MailConfig config) {
		return (config == null) ? configStore.load() : config;
	}

	/** 当前发信方式的必填项是否配齐（错误文案尽量指向具体缺哪个字段） */
	private boolean checkProviderConfigured(MailPrepared prepared, MailConfig config, MailProviderType type) {
		if (type == MailProviderType.SMTP) {
			MailSmtpConfig smtp = (config.getSmtp() == null) ? new MailSmtpConfig() : config.getSmtp();
			if (isBlank(smtp.getHost())) {
				prepared.setError("SMTP 服务器地址未配置（" + MailConfigStore.KEY_SMTP + ".host）");
				return false;
			}
			if (smtp.getPort() < 1 || smtp.getPort() > 65535) {
				prepared.setError("SMTP 端口不合法：" + smtp.getPort());
				return false;
			}
			if (isBlank(smtp.getAccount())) {
				prepared.setError("SMTP 登录账号未配置");
				return false;
			}
			if (smtp.isAuth() && isBlank(smtp.getPassword())) {
				prepared.setError("SMTP 登录密码/授权码未配置");
				return false;
			}
			if (isBlank(config.getEffectiveFrom())) {
				prepared.setError("发件人地址未配置（" + MailConfigStore.KEY_FROM + " 或 SMTP 登录账号）");
				return false;
			}
			return true;
		}

		if (type == MailProviderType.ALIYUN) {
			MailAliyunConfig aliyun = (config.getAliyun() == null) ? new MailAliyunConfig() : config.getAliyun();
			if (isBlank(aliyun.getAccessKeyId())) {
				prepared.setError("阿里云 AccessKeyId 未配置（" + MailConfigStore.KEY_ALIYUN + ".accessKeyId）");
				return false;
			}
			if (isBlank(aliyun.getAccessKeySecret())) {
				prepared.setError("阿里云 AccessKeySecret 未配置");
				return false;
			}
			if (isBlank(aliyun.getAccountName())) {
				prepared.setError("阿里云发信地址未配置（" + MailConfigStore.KEY_ALIYUN + ".accountName）");
				return false;
			}
			return true;
		}

		if (type == MailProviderType.TENCENT) {
			MailTencentConfig tencent = (config.getTencent() == null) ? new MailTencentConfig() : config.getTencent();
			if (isBlank(tencent.getSecretId())) {
				prepared.setError("腾讯云 SecretId 未配置（" + MailConfigStore.KEY_TENCENT + ".secretId）");
				return false;
			}
			if (isBlank(tencent.getSecretKey())) {
				prepared.setError("腾讯云 SecretKey 未配置");
				return false;
			}
			if (isBlank(tencent.getRegion())) {
				prepared.setError("腾讯云地域 Region 未配置（只支持 ap-guangzhou / ap-hongkong）");
				return false;
			}
			if (isBlank(config.getEffectiveFrom())) {
				prepared.setError("腾讯云发信地址未配置（" + MailConfigStore.KEY_TENCENT + ".fromEmailAddress 或 "
						+ MailConfigStore.KEY_FROM + "）");
				return false;
			}
			if (tencent.isTemplateMode() && tencent.getEffectiveTemplateId() <= 0) {
				prepared.setError("腾讯云选择了模板模式，但模板 ID 未配置或不是数字：" + tencent.getTemplateId());
				return false;
			}
			return true;
		}

		if (type == MailProviderType.HTTP) {
			MailHttpConfig http = (config.getHttp() == null) ? new MailHttpConfig() : config.getHttp();
			if (isBlank(http.getUrl())) {
				prepared.setError("自定义网关地址未配置（" + MailConfigStore.KEY_HTTP + ".url）");
				return false;
			}
			if (!http.getUrl().trim().startsWith("http://") && !http.getUrl().trim().startsWith("https://")) {
				prepared.setError("自定义网关地址需以 http:// 或 https:// 开头：" + http.getUrl().trim());
				return false;
			}
			return true;
		}

		prepared.setError("该发信方式暂未接入：" + type.getDisplayName());
		return false;
	}

	private MailSendResult execute(MailPrepared prepared) {
		String toSummary = (prepared.getMessage() == null) ? "-" : maskEmails(prepared.getMessage().getTo());
		if (!prepared.isReady()) {
			Log.info("MailSender.send() 收件人:" + toSummary + " 未就绪: " + prepared.getError());
			return MailSendResult.failure(null, prepared.getError());
		}

		MailProviderType type = prepared.getProvider();
		MailProvider provider = providers.get(type);

		long start = System.currentTimeMillis();
		MailSendResult result = provider.send(prepared.getConfig(), prepared.getMessage());
		result.setElapsedMs(System.currentTimeMillis() - start);
		if (result.getProvider() == null) {
			result.setProvider(type.getCode());
		}

		logResult(toSummary, result);
		return result;
	}

	private void logResult(String toSummary, MailSendResult result) {
		StringBuilder sb = new StringBuilder();
		sb.append("MailSender.send() 收件人:").append(toSummary);
		sb.append(" 发信方式:").append(result.getProvider());
		sb.append(" 结果:").append(result.isSuccess() ? "成功" : "失败");
		if (result.getProviderCode() != null && !"OK".equals(result.getProviderCode())) {
			sb.append(" 返回码:").append(result.getProviderCode());
		}
		sb.append(" 耗时:").append(result.getElapsedMs()).append("ms");
		if (!result.isSuccess()) {
			sb.append(" 原因:").append(result.getFailureReason());
		} else if (result.getProviderMsg() != null && !result.getProviderMsg().isEmpty()) {
			sb.append(" 服务器应答:").append(result.getProviderMsg());
		}
		Log.info(sb.toString());
	}

	/** 收件人列表脱敏（每项保留首字符与域名前缀，如 {@code a***@example.com}） */
	public static String maskEmails(List<String> addresses) {
		if (addresses == null || addresses.isEmpty()) {
			return "-";
		}
		StringBuilder sb = new StringBuilder();
		for (String address : addresses) {
			if (sb.length() > 0) {
				sb.append(",");
			}
			sb.append(maskEmail(address));
		}
		return sb.toString();
	}

	/** 单个邮箱脱敏（用于日志；异常数据原样降级为 ***） */
	public static String maskEmail(String address) {
		if (address == null || address.trim().isEmpty()) {
			return "***";
		}
		String value = address.trim();
		int at = value.indexOf('@');
		if (at <= 0) {
			return "***";
		}
		String name = value.substring(0, at);
		String domain = value.substring(at);
		if (name.length() <= 1) {
			return "*" + domain;
		}
		return name.charAt(0) + "***" + domain;
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
