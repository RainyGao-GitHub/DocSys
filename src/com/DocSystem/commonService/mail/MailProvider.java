package com.DocSystem.commonService.mail;

/**
 * 发信方式适配接口（与短信的 {@code SmsProvider} 同一套路）。
 *
 * <p>与短信的差别：短信把 HTTP 收发交给统一的 {@code SimpleHttpClient}，所以 Provider 只负责
 * 「造请求 / 判响应」两个纯函数；而 SMTP 的发信动作本身就是 JDK/JavaMail 的，因此这里直接
 * 暴露 {@link #send(MailConfig, MailMessage)}。为了让 SMTP 链路仍能**脱网验证**，
 * {@code SmtpMailProvider} 把「JavaMail 属性构造」单独暴露成静态方法（见其 javadoc），
 * 属性构造是可断言的纯函数，只有最后的 {@code Transport.send} 才需要网络。
 */
public interface MailProvider {

	MailProviderType getType();

	/** 发信；任何异常都必须被收敛成 {@link MailSendResult}（不向外抛） */
	MailSendResult send(MailConfig config, MailMessage message);
}
