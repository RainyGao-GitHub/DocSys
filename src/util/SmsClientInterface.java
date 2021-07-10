package util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;

/**
 * <p>
 * <date>2012-03-01</date><br/>
 * <span>软维提供的JAVA接口信息（短信，彩信）调用API</span>
 * </p>
 * 
 * @author LIP
 * @version 1.0.1
 */
public class SmsClientInterface {

	/**
	 * <p>
	 * <date>2012-03-01</date><br/>
	 * <span>发送信息方法1--必须传入必填内容</span><br/>
	 * <p>
	 * 其一：发送方式，默认为POST<br/>
	 * 其二：发送内容编码方式，默认为UTF-8
	 * </p>
	 * <br/>
	 * <span>发送信息最终的组合形如：http://www.qf106.com/sms.aspx?action=send</span> </p>
	 * 
	 * @param url
	 *            ：必填--发送连接地址URL--比如>http://www.qf106.com/sms.aspx
	 * @param userid
	 *            ：必填--用户ID，一般为数字
	 * @param account
	 *            ：必填--用户帐号
	 * @param password
	 *            ：必填--用户密码
	 * @param mobile
	 *            ：必填--发送的手机号码，多个可以用逗号隔比如>>130xxxxxxxx,131xxxxxxxx
	 * @param content
	 *            ：必填--实际发送内容，
	 * @return 返回发送之后收到的信息
	 */
	public static String sendSms(String url, String userid, String account,
			String password, String mobile, String content) {

		return sendSms(url, userid, account, password, mobile, content, null,
				null, null, null, null, null, null, "POST", "UTF-8");
	}

	/**
	 * <p>
	 * <date>2012-03-01</date><br/>
	 * <span>发送信息方法</span><br/>
	 * <span>发送信息最终的组合形如：http://www.qf106.com/sms.aspx?action=send</span>
	 * </p>
	 * 
	 * @param url
	 *            ：必填--发送连接地址URL--比如>http://www.qf106.com/sms.aspx
	 * 
	 * @param userid
	 *            ：必填--用户ID，一般为数字
	 * @param account
	 *            ：必填--用户帐号
	 * @param password
	 *            ：必填--用户密码
	 * @param mobile
	 *            ：必填--发送的手机号码，多个可以用逗号隔比如>>130xxxxxxxx,131xxxxxxxx
	 * @param content
	 *            ：必填--实际发送内容，
	 * @param action
	 *            ：选填--访问的事件，默认为send
	 * @param sendTime
	 *            ：选填--定时发送时间，不填则为立即发送，时间格式如>2011-11-11 11:11:11
	 * @param checkContent
	 *            ：选填--检查是否包含非法关键字，1--表示需要检查，0--表示不检查
	 * @param taskName
	 *            ：选填--任务名称，本次任务描述，100字内
	 * @param countNumber
	 *            ：选填--提交号码总数
	 * @param mobileNumber
	 *            ：选填--手机号码总数
	 * @param telephoneNumber
	 *            ：选填--小灵通（和）或座机总数
	 * @param sendType
	 *            ：选填--发送方式，默认为POST
	 * @param codingType
	 *            ：选填--发送内容编码方式，默认为UTF-8
	 * @return 返回发送之后收到的信息
	 */
	public static String sendSms(String url, String userid, String account,
			String password, String mobile, String content, String action,
			String sendTime, String checkContent, String taskName,
			String countNumber, String mobileNumber, String telephoneNumber,
			String sendType, String codingType) {

		return "";
	}
	
	

	public static String sendGet() {

		return "";
	}

	public static String sendPost(String sendUrl, String outEncoding) {

		String retMsg = "";
		BufferedReader reader = null;
		try {

			URL url = new URL(sendUrl);
			URLConnection connection = url.openConnection();
			connection.setDoOutput(true);
			// 发送域信息
			OutputStreamWriter out = new OutputStreamWriter(connection
					.getOutputStream(), outEncoding);
			out.flush();
			out.close();
			// 获取返回数据
			InputStream in = connection.getInputStream();
			reader = new BufferedReader(new InputStreamReader(in));
			StringBuffer buffer = new StringBuffer();
			String line = "";
			while ((line = reader.readLine()) != null) {
				buffer.append(line);
			}

			retMsg = buffer.toString();
		} catch (Exception e) {

			e.printStackTrace();
			retMsg = "reuid_error";
		} finally {
			try {
				if (reader != null) {
					reader.close();
				}
			} catch (IOException e) {

				e.printStackTrace();
			}
		}
		return retMsg.trim();
	}
}
