package com.DocSystem.commonService.mail;

import java.util.ArrayList;
import java.util.List;

/**
 * 待发送的邮件（与供应商无关的中间形态）。
 *
 * <p>对应老接口 {@code EmailService.sendEmail(rt, toEmail, content, subject)} /
 * {@code sendEmailEx(..., attchment)}；收件人目前只支持单地址列表，
 * 抄送/密送等将来需要再加（YAGNI）。
 */
public class MailMessage {

	/** 收件人（至少一个；格式在 MailSender.prepare() 里校验） */
	private List<String> to = new ArrayList<String>();

	/** 主题（UTF-8；为空时由发送层兜底成占位主题） */
	private String subject = "";

	/** 正文（HTML 片段，由调用方自行包装；发送层只负责按 contentType 投递） */
	private String content = "";

	/** 附件（本地文件绝对路径；JavaMail 的 attachFile 语义） */
	private List<String> attachments = new ArrayList<String>();

	public static MailMessage of(String to, String subject, String content) {
		MailMessage message = new MailMessage();
		message.addTo(to);
		message.setSubject(subject);
		message.setContent(content);
		return message;
	}

	public MailMessage addTo(String address) {
		if (address != null && !address.trim().isEmpty()) {
			to.add(address.trim());
		}
		return this;
	}

	public MailMessage addAttachment(String filePath) {
		if (filePath != null && !filePath.trim().isEmpty()) {
			attachments.add(filePath.trim());
		}
		return this;
	}

	public List<String> getTo() {
		return to;
	}

	public void setTo(List<String> to) {
		this.to = to;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public List<String> getAttachments() {
		return attachments;
	}

	public void setAttachments(List<String> attachments) {
		this.attachments = attachments;
	}
}
