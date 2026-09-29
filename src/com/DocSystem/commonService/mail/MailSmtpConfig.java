package com.DocSystem.commonService.mail;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * SMTP 服务器配置（{@code mail.smtp} 一段 JSON 的载体）。
 *
 * <p>字段与老配置的对应关系（见方案文档 §4）：老 {@code mail.smtp.host} → {@link #host}、
 * 老 {@code mail.smtp.starttls.enable=true} → {@link #encryption}=STARTTLS、老端口缺失 → 25。
 */
public class MailSmtpConfig {

	/** SMTP 服务器地址，如 smtp.qiye.aliyun.com / smtp.163.com */
	private String host = "";

	/** 端口；缺省 25（老配置没有端口，按老行为保持 25，页面会提示改用 465/587） */
	private int port = 25;

	/** 加密方式（none / starttls / ssl） */
	private String encryption = MailEncryption.NONE.getCode();

	/** 登录账号（通常是完整邮箱地址） */
	private String account = "";

	/** 登录密码 / 服务商要求的「授权码」（163、QQ 等必须用授权码，不能用登录密码） */
	private String password = "";

	/** 是否需要认证（老配置 mail.smtp.auth）；缺省 true */
	private boolean auth = true;

	/** 是否信任任意服务器证书（自签名证书的内网服务器才需要，默认关闭） */
	private boolean sslTrust = false;

	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

	public String getEncryption() {
		return encryption;
	}

	public void setEncryption(String encryption) {
		this.encryption = encryption;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public boolean isAuth() {
		return auth;
	}

	public void setAuth(boolean auth) {
		this.auth = auth;
	}

	public boolean isSslTrust() {
		return sslTrust;
	}

	public void setSslTrust(boolean sslTrust) {
		this.sslTrust = sslTrust;
	}

	/**
	 * 解析后的加密方式（null/非法 → NONE）。
	 *
	 * <p>❗派生 getter 必须 {@code serialize=false}：否则写回 {@code system_setting} 的 JSON 里
	 * 会多出一个 {@code encryptionType} 字段，越滚越大（这是真实踩过的坑，见 MailConfigProbe 断言）。
	 */
	@JSONField(serialize = false, deserialize = false)
	public MailEncryption getEncryptionType() {
		return MailEncryption.fromCode(encryption);
	}
}
