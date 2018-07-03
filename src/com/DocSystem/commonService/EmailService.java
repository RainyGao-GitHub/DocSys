/**  
 * @Title: EmailService.java
 * @Package com.DocSystem.commonService
 * @Description: TODO
 * @author Rainy
 * @date 2017年8月29日
 */
package com.DocSystem.commonService;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.Calendar;
import java.util.Properties;

import javax.mail.Authenticator;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.Message.RecipientType;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import util.ReadProperties;
import util.ReturnAjax;
/**
 * ClassName: EmailService 
 * @Description: 邮件类
 * @author Rainy
 * @date 2017年8月29日
 */
@Controller
@RequestMapping("email")
public class EmailService {

	public static String fromUser = ReadProperties.read("docSysConfig.properties", "fromuser");
	private static String fromPwd = ReadProperties.read("docSysConfig.properties", "frompwd");
	private static String messagetype = ReadProperties.read("docSysConfig.properties", "messagetype");
	
	
	/**
	 * 发送验证码邮件
	 * @param session
	 * @param content
	 * @param toEmail
	 * @return
	 */
	@SuppressWarnings("static-access")
	@ResponseBody
	@RequestMapping("/sendEmail")
	public boolean sendEmail(ReturnAjax rt, String toEmail,String content){
		try {
			Properties props = new Properties();
			String basePath = new EmailService().getClass().getClassLoader().getResource("/").getPath();
			File config = new File(basePath+"docSysConfig.properties");
			InputStream in = new FileInputStream(config);
			props.load(in);
			
			Session mailSession = Session.getInstance(props,new MyAuthenticator(fromUser,fromPwd));
			
			InternetAddress fromAddress = new InternetAddress(fromUser);
			InternetAddress toAddress = new InternetAddress(toEmail);

			MimeMessage message = new MimeMessage(mailSession);

			message.setFrom(fromAddress);
			message.addRecipient(RecipientType.TO, toAddress);

			message.setSentDate(Calendar.getInstance().getTime());
			message.setSubject("来自DocSys的邮件");
			if(content!=null&&!"".equals(content)){
				content = URLDecoder.decode(content, "UTF-8");
				message.setContent(EmailService.getEmailHtmlByCode(content), messagetype);
			}
			else
			{
				rt.setError("danger#发送系统邮件失败！");
				return false;
			}	
			
			Transport transport = mailSession.getTransport("smtp");
			transport.send(message, message.getRecipients(RecipientType.TO));
			rt.setMsgInfo("success#发送系统邮件成功！");
		} catch (Exception e) {
			e.printStackTrace();
			rt.setError("danger#发送系统邮件失败！");
		}
		return false;		
	}
	
	
	public static String getEmailHtmlByCode(String content){
		String emailContent = "<style type='text/css'>"
				+"			body{"
				+"				font-family: '宋体';"
				+"			}"
				+"			.email-content{"
				+"				padding:50px;"
				+"				width: 80%;"
				+"			}"
				+"			p{"
				+"				color:cornflowerblue;"
				+"			}"
				+"			p.firstline{"
				+"				padding-left: 24px;"
				+"			}"
				+"			a{"
				+"				color:#A3A3A3;"
				+"			}"
				+"			a:hover{"
				+"				color:deepskyblue;"
				+"			}"
				+"		</style>"
				+"		<div class='email-content'>"
				+"			<p>您好，亲爱的DocSys用户：</p>"
				+"			<p class='firstline'>"
				+	content 
				//+ "<a href='http://www.gofreeteam.com'>点击进入:DocSys首页</a>"
				+"			</p>"
				+"		</div>";
		
		return emailContent;
	}
	
	class MyAuthenticator extends Authenticator{
		String userName="";
		String password="";
		public MyAuthenticator(){
			
		}
		public MyAuthenticator(String userName,String password){
			this.userName=userName;
			this.password=password;
		}
		 protected PasswordAuthentication getPasswordAuthentication(){   
			return new PasswordAuthentication(userName, password);   
		 } 
	}
}

