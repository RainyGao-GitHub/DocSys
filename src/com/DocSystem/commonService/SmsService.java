/**  
 * @Title: SmsService.java
 * @Package com.DocSystem.commonService
 * @Description: 发送短信服务（已降级为兼容适配层，真实发送见 commonService.sms.SmsSender）
 * @author Rainy
 * @date 2017年8月29日
 */
package com.DocSystem.commonService;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.DocSystem.commonService.sms.SmsSendResult;
import com.DocSystem.commonService.sms.SmsSender;

import util.ReturnAjax;

/**
 * ClassName: SmsService 
 * @Description: 短信发送入口（**已降级为兼容适配层**，真实发送见 com.DocSystem.commonService.sms.SmsSender）
 *
 * <p>【改造说明】本类原先直接调 JavaSmsApi 发云片 v1 短信，是唯一的发送实现；
 * 现在发送能力已集中到 SmsSender（多运营商 + 配置入库 + 脱敏日志），
 * 本类只保留**旧 8 参签名**并转发过去，供历史调用方继续使用
 * （例：SalesBase.sendNotifySMS() 自带模板的订单通知）。
 *
 * <p>行为差异（均为有意修正）：
 * <ul>
 *   <li>接入地址/密钥不再由调用方传入 —— 统一从 system_setting 表取
 *       （故 smsServer/smsApikey 两入参已废弃，仅保留签名）；</li>
 *   <li>模板变量值改为**单次 URL 编码**（旧实现只对 code 编码，content/type 不编码，
 *       变量值含 & 会直接把参数串截断）；</li>
 *   <li>去掉 System.out.println(rtJson)（会打印完整响应体，方案文档 P6）。</li>
 * </ul>
 *
 * @author zhanjp
 * @date 2016年5月31日
 */
@RequestMapping("SMS")
@Controller
public class SmsService {

	@Autowired
	private SmsSender smsSender;

	/**
	 * 发送短信（**已废弃**）。
	 *
	 * @param phone     手机号
	 * @param smsServer 已废弃（接入地址改由 system_setting 表提供，仅保留签名）
	 * @param smsApikey 已废弃（同上）
	 * @param smsTplid  模板 ID（仍生效：历史调用方自带模板）
	 * @param code      模板变量 code
	 * @param type      模板变量 type
	 * @param content   模板变量 content
	 * @deprecated 新代码请直接注入 {@link SmsSender} 并按场景发送
	 */
	@ResponseBody
	@RequestMapping("/sendSms")
	@Deprecated
	public boolean sendSms(ReturnAjax rt, String phone, 
			String smsServer, String smsApikey, String smsTplid, 
			String code, String type, String content)
	{
		LinkedHashMap<String, String> vars = new LinkedHashMap<String, String>();
		putIfNotEmpty(vars, "code", code);
		putIfNotEmpty(vars, "type", type);
		putIfNotEmpty(vars, "content", content);

		SmsSendResult result = smsSender.sendWithTemplate(smsTplid, phone, vars);
		if (result.isSuccess()) {
			return true;
		}

		// 对外文案保持不变：失败原因已由 SmsSender 脱敏记入 docsys.log，
		// 管理员可在「系统设置 → 短信服务 → 发送测试短信」看到运营商原文
		rt.setError("发送短信失败！");
		return false;
	}

	private static void putIfNotEmpty(Map<String, String> vars, String name, String value) {
		if (value != null && !value.isEmpty()) {
			vars.put(name, value);
		}
	}
}
