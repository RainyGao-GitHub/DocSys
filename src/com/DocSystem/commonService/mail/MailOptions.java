package com.DocSystem.commonService.mail;

/**
 * 邮件发送选项（{@code mail.options} 一段 JSON 的载体）——与具体供应商无关。
 *
 * <p>超时是这次改造的重点之一：老实现完全没有超时设置，SMTP 服务器不可达时会一直阻塞
 * （调用方还在 HTTP 请求线程里）→ 显式给 {@code connectiontimeout}/{@code timeout}。
 */
public class MailOptions {

	/** 正文类型；老实现用 {@code messagetype=text/html;charset=gb2312}，本轮统一 UTF-8 */
	public static final String DEFAULT_CONTENT_TYPE = "text/html;charset=UTF-8";

	/** 正文类型（JavaMail 的 {@code mail.smtp.contentType} 语义，随 Message 设置） */
	private String contentType = DEFAULT_CONTENT_TYPE;

	/** 建立连接超时（毫秒） */
	private int connectTimeoutMs = 10000;

	/** 读写超时（毫秒） */
	private int readTimeoutMs = 30000;

	public String getContentType() {
		return contentType;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}

	public int getConnectTimeoutMs() {
		return connectTimeoutMs;
	}

	public void setConnectTimeoutMs(int connectTimeoutMs) {
		this.connectTimeoutMs = connectTimeoutMs;
	}

	public int getReadTimeoutMs() {
		return readTimeoutMs;
	}

	public void setReadTimeoutMs(int readTimeoutMs) {
		this.readTimeoutMs = readTimeoutMs;
	}
}
