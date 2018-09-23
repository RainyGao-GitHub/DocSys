package com.DocSystem.entity;

/** 
 * @ClassName: MyEmail 
 * @Description: TODO(这里用一句话描述这个类的作用) 
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-7-3 下午2:24:09 
 * @version V1.0   
 */
public class MyEmail {

	private String fromEmail;
	
	private String fromPwd;
	
	private String toEmail;
	
	private String eTitle;
	
	private String eBody;
	
	private String messageType;

	public String getFromEmail() {
		return fromEmail;
	}

	public void setFromEmail(String fromEmail) {
		this.fromEmail = fromEmail;
	}

	public String getFromPwd() {
		return fromPwd;
	}

	public void setFromPwd(String fromPwd) {
		this.fromPwd = fromPwd;
	}

	public String getToEmail() {
		return toEmail;
	}

	public void setToEmail(String toEmail) {
		this.toEmail = toEmail;
	}

	public String geteTitle() {
		return eTitle;
	}

	public void seteTitle(String eTitle) {
		this.eTitle = eTitle;
	}

	public String geteBody() {
		return eBody;
	}

	public void seteBody(String eBody) {
		this.eBody = eBody;
	}

	public String getMessageType() {
		return messageType;
	}

	public void setMessageType(String messageType) {
		this.messageType = messageType;
	}
}
