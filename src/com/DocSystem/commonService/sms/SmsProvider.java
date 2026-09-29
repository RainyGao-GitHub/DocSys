package com.DocSystem.commonService.sms;

/**
 * 短信运营商适配接口。
 *
 * <p>两个方法都是**可以脱离网络单独验证**的：
 * {@link #buildRequest} 产出请求描述，{@link #parseResponse} 判定响应是否成功；
 * 真正的 HTTP 收发由 {@link SmsHttpClient} 统一负责（超时、重试、编码）。
 */
public interface SmsProvider {

	SmsProviderType getType();

	/**
	 * 构造发送请求。
	 *
	 * @param config   当前生效配置（取 apikey / endpoint / 签名等）
	 * @param template 场景模板（tplId + 有序变量名）
	 * @param phone    手机号
	 * @param vars     变量名 → 值（已按 template 的 vars 校验齐全）
	 */
	SmsRequest buildRequest(SmsConfig config, SmsTemplateConfig template, String phone,
			java.util.Map<String, String> vars);

	/**
	 * 判定响应是否成功。
	 *
	 * @param config     当前生效配置（自定义 HTTP 的成功判定字段在这里）
	 * @param httpStatus HTTP 状态码
	 * @param body       响应体（可能为空）
	 */
	SmsSendResult parseResponse(SmsConfig config, int httpStatus, String body);
}
