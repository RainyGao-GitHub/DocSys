/**  
 * @Title: SmsService.java
 * @Package com.DocSystem.commonService
 * @Description: TODO 发送短信服务
 * @author Rainy
 * @date 2017年8月29日
 */
package com.DocSystem.commonService;

import java.io.IOException;




import java.net.URLEncoder;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import util.GsonUtils;
import util.RegularUtil;
import util.ReturnAjax;

/**
 * ClassName: SmsService 
 * @Description: TODO
 * @author zhanjp
 * @date 2016年5月31日
 */
@RequestMapping("SMS")
@Controller
public class SmsService {
	/**
	 * 测试可用，上面那个不能用 2016-7-29 00:05:16
	 * @param phone
	 * @param tplId
	 * @param session
	 * @param msg
	 * @return
	 */
	@SuppressWarnings("unchecked")
	@ResponseBody
	@RequestMapping("/sendSms")
	public boolean sendSms(ReturnAjax rt,String phone,long tplId,String code,String type,String content)
	{
		if(phone!=null&&!"".equals(phone)){
			if(!RegularUtil.IsMobliePhone(phone)){
				rt.setError("danger#您的手机号格式不对,请重新检查。");
				return false;
			}
		}else{
			rt.setError("danger#手机号不能为空，请重新检查。");
			return false;
		}
		
		String rtJson;
		try {
			String tpl_value = "";
			if(code!=null&&!"".equals(code))
			{	
				tpl_value = "#code#=" + URLEncoder.encode(code,JavaSmsApi.ENCODING);
			}
			
			if(type!=null&&!"".equals(type)){
				tpl_value += (tpl_value.length()>0?"&":"") + "#type#=" + type;
			}
			
			if(content!=null&&!"".equals(content)){
				tpl_value += (tpl_value.length()>0?"&":"") + "#content#=" + content;
			}
			rtJson = JavaSmsApi.tplSendSms(JavaSmsApi.apikey, tplId, tpl_value, phone);
			System.out.println(rtJson);
			Map<String, Object> rtObj = GsonUtils.getObject(rtJson, Map.class);
			double rtCode = (Double) rtObj.get("code");
			if(rtCode<0){
				rt.setError("danger#发送短信失败！");
			}else{
				return true;
			}
		} catch (IOException e) {
			e.printStackTrace();
			rt.setError("danger#发送短信失败！");
		}
		return false;		
	}
}
