package util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;
import java.util.Date;
import java.util.Properties;

import javax.mail.Authenticator;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.Message.RecipientType;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import com.DocSystem.entity.MyEmail;

/** 
 * @ClassName: EmailUtil 
 * @Description: 发送Email的公共类
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-7-3 下午2:21:50 
 * @version V1.0   
 */
public class EmailUtil {
	
	
	
	@SuppressWarnings("static-access")
	public boolean sendEmail(MyEmail e) throws Exception{
		Properties props = new Properties();
		try {
			String basePath = this.getClass().getClassLoader().getResource("/").getPath();
			File config = new File(basePath+"emailConfig.properties");
			InputStream in = new FileInputStream(config);
			props.load(in);
			System.out.println("自定义的props:" + props);
			if(e.getFromEmail()==null){
				e.setFromEmail(props.getProperty("fromuser"));
			}
			if(e.getFromPwd()==null){
				e.setFromPwd(props.getProperty("frompwd"));
			}
			
			e.setMessageType(props.getProperty("messagetype"));
			
			Session mailSession = Session.getInstance(props,new MyAuthenticator(e.getFromEmail(),e.getFromPwd()));
			
			InternetAddress fromAddress = new InternetAddress(e.getFromEmail());
			InternetAddress toAddress = new InternetAddress(e.getToEmail());

			MimeMessage message = new MimeMessage(mailSession);

			message.setFrom(fromAddress);
			message.addRecipient(RecipientType.TO, toAddress);

			message.setSentDate(Calendar.getInstance().getTime());
			message.setSubject(e.geteTitle());
			message.setContent(getEmailHtml(e.geteBody()), e.getMessageType());
			Transport transport = mailSession.getTransport("smtp");
			transport.send(message, message.getRecipients(RecipientType.TO));
		} catch (IOException e1) {
			e1.printStackTrace();
		}
		System.out.println("props:"+props.toString());
		return true;
	}
	
	public String getEmailHtml(String url){
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
				+"				color:red;"
				+"			}"
				+"			a:hover{"
				+"				color:deepskyblue;"
				+"			}"
				+"		</style>"
				+"		<div class='email-content'>"
				+"			<p class='firstline'>"
				+"				您于"+DateFormat.dateTimeFormat(new Date())+"注册了自由团队，下面是注册账号激活链接，请点击确认该链接。		"
				+"			</p>"
				+"			<p>"
				+"				<a href='http://www.gofreeteam.com/activeEmail.do?email="+url+"'>点击我激活邮箱，48小时内激活有效</a>"
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





