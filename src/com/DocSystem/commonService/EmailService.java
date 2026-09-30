/**
 * @Title: EmailService.java
 * @Package com.DocSystem.commonService
 * @Description: 邮件发送入口（调用方唯一门面）
 * @author Rainy
 * @date 2017年8月29日
 */
package com.DocSystem.commonService;

import java.io.File;
import java.net.URLDecoder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.DocSystem.common.Log;
import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.mail.MailSender;
import com.DocSystem.service.mail.MailConfigStore;

import util.ReturnAjax;

/**
 * ClassName: EmailService
 * @Description: 邮件类
 * @author Rainy
 * @date 2017年8月29日
 *
 * <p>【M3 改造】两个方法**签名保持不变**（6 个调用方零改动：
 * {@code UserController:508}、{@code BaseController:3498}、{@code BussinessController:328/558}、
 * {@code ReposController:1106}、{@code SalesBase:2071/2139/2172}），内部改为委托
 * {@link MailSender} + {@link MailConfigStore}：
 * <ul>
 *   <li>配置来自 {@code system_setting} 表（每次发信现取 → **改完即时生效**，不再需要重启）；</li>
 *   <li>不再把整份 {@code docSysConfig.properties} 丢给 {@code Session}（老做法里
 *       {@code messagetype} 缺键会 NPE 的问题一并消失）；</li>
 *   <li>失败原因结构化回传（端口被封 / 授权码错 / 收件人被拒 都能看出来了）。</li>
 * </ul>
 */
@Controller
@RequestMapping("email")
public class EmailService {

	/** 老代码在 subject 为空时用的默认主题，保持原样 */
	private static final String DEFAULT_SUBJECT = "来自MxsDoc的邮件";

	@Autowired
	private MailConfigStore mailConfigStore;

	@Autowired
	private MailSender mailSender;

	/**
	 * 发送验证码邮件
	 * @param session
	 * @param content
	 * @param toEmail
	 * @return
	 */
	@ResponseBody
	@RequestMapping("/sendEmail")
	public boolean sendEmail(ReturnAjax rt, String toEmail,String content, String subject){	
		return send(rt, toEmail, content, subject, null);
	}
	
	@ResponseBody
	@RequestMapping("/sendEmailEx")
	public boolean sendEmailEx(ReturnAjax rt, String toEmail,String content, String subject, String attchment){
		return send(rt, toEmail, content, subject, attchment);
	}

	/**
	 * 实际发送（两个入口共用）。
	 *
	 * <p>兼容点（与改造前逐条对齐，避免调用方感知到差异）：
	 * <ul>
	 *   <li>{@code content} 为空：失败 + 明确原因；正文进来时先
	 *       {@code URLDecoder.decode(content,"UTF-8")}（调用方传的是 URL 编码串）；</li>
	 *   <li>正文外面套 {@link #getEmailHtmlByCode(String)} 的 HTML 模板；</li>
	 *   <li>附件路径不存在：**不阻断发信**（老行为），但记日志便于排查。</li>
	 * </ul>
	 */
	private boolean send(ReturnAjax rt, String toEmail, String content, String subject, String attchment){
		if(content == null || content.isEmpty())
		{
			rt.setError("发送系统邮件失败:邮件内容不能为空！");
			return false;
		}

		try {
			MailConfig config = mailConfigStore.load();

			MailMessage message = new MailMessage();
			message.addTo(toEmail);
			message.setSubject((subject == null || subject.isEmpty()) ? DEFAULT_SUBJECT : subject);
			message.setContent(getEmailHtmlByCode(URLDecoder.decode(content, "UTF-8")));

			//添加附件（sendEmailEx 语义）
			if(attchment != null && !attchment.isEmpty())
			{
				File file = new File(attchment);
				if(file.exists())
				{
					message.addAttachment(attchment);
				}
				else
				{
					//保持老行为：附件不在也把正文发出去，但要留下线索
					Log.debug("EmailService.send() 附件不存在，已忽略附件：" + attchment);
				}
			}

			MailSendResult result = mailSender.send(config, message);
			if(result.isSuccess())
			{
				rt.setMsgInfo("发送系统邮件成功！");
				return true;
			}

			rt.setError("发送系统邮件失败：" + result.getFailureReason());
		} catch (Exception e) {
			Log.debug(e);
			rt.setError("发送系统邮件失败！");
		}
		return false;		
	}

	public static String getEmailHtmlByCode(String content){
		String emailContent = "<style type='text/css'>"
				+"			body{"
				+"				font-family: 'arial'; font-size:12px;"
				+"			}"
				+"			.email-content{"
				+"				padding:50px;"
				+"				width: 80%;"
				+"			}"
				//+"			p{"
				//+"				color:cornflowerblue;"
				//+"			}"
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
//				+"			<p>尊敬的MxsDoc用户：</p>"
				+"			<p class='firstline'>"
				+				content 
				+"			</p>"
				+"		</div>";
		
		return emailContent;
	}
}
