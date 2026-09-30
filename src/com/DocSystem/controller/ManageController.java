package com.DocSystem.controller;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.PrintStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.redisson.config.SingleServerConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import util.DateFormat;
import util.LDAPUtil;
import util.LLMUtil;
import util.ReadProperties;
import util.ReturnAjax;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.ReposMember;
import com.DocSystem.entity.UserGroup;

import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.LogFileUtil;
import com.DocSystem.common.Path;
import com.DocSystem.common.constants;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.IPRuleConfig;
import com.DocSystem.common.entity.LLMAccessCheckResult;
import com.DocSystem.common.entity.LdapLoginCheckResult;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.SystemAllowedNetworkConfig;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.entity.SystemLDAPConfig;
import com.DocSystem.common.entity.SystemLLMConfig;
import com.DocSystem.common.entity.LongTermTask;
import com.DocSystem.commonService.mail.MailConfig;
import com.DocSystem.commonService.mail.MailAliyunConfig;
import com.DocSystem.commonService.mail.MailConfigForm;
import com.DocSystem.commonService.mail.MailEncryption;
import com.DocSystem.commonService.mail.MailMessage;
import com.DocSystem.commonService.mail.MailProviderType;
import com.DocSystem.commonService.mail.MailSendResult;
import com.DocSystem.commonService.mail.MailSender;
import com.DocSystem.commonService.mail.MailSmtpConfig;
import com.DocSystem.commonService.mail.MailTencentConfig;
import com.DocSystem.commonService.sms.SmsConfig;
import com.DocSystem.commonService.sms.SmsConfigForm;
import com.DocSystem.commonService.sms.SmsProviderType;
import com.DocSystem.commonService.sms.SmsScene;
import com.DocSystem.commonService.sms.SmsSendResult;
import com.DocSystem.commonService.sms.SmsSender;
import com.DocSystem.controller.BaseController;
import com.DocSystem.service.sms.SmsConfigStore;

@Controller
@RequestMapping("/Manage")
public class ManageController extends BaseController{
	@Autowired
	private UserServiceImpl userService;

	@Autowired
	private ReposServiceImpl reposService;

	/** 发送测试短信时，回显的运营商原始响应上限（避免超大响应把页面撑爆） */
	private static final int MAX_SMS_RAW_LEN = 1000;

	/** 保存短信配置时，错误提示最多列几条（其余折叠为条数） */
	private static final int MAX_SMS_ERROR_ITEMS = 3;

	/** 发送测试邮件时，回显的 SMTP 原始响应上限 */
	private static final int MAX_MAIL_RAW_LEN = 1000;

	/** 保存邮件配置时，错误提示最多列几条（其余折叠为条数） */
	private static final int MAX_MAIL_ERROR_ITEMS = 3;

	
	/********** 系统初始化 ***************/
	@RequestMapping("/docSysInit.do")
	public void docSysInit(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** docSysInit.do ***********************");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		Log.debug("docSysInit.do docSysInit() Start docSysInitState:" + docSysIniState);
		if(docSysIniState == 1)
		{
			Log.debug("docSysInit.do 用户自定义数据库配置文件与系统数据库配置文件不一致，等待重启生效！");
			rt.setData("needRestart");
			writeJson(rt, response);
			return;
		}
				
		String ret = docSysInit(true);
		switch(ret)
		{
		case "ok":
			docSysIniState = 0;
			break;
		case "needRestart":
			docSysIniState = 1;
			break;
		default:
			docSysIniState = -2;
			docSysErrorLog(ret, rt);
			break;
		}
		
		Log.debug("docSysInit.do docSysInit() End docSysInitState:" + docSysIniState);
		
		rt.setData(ret);
		writeJson(rt, response);
	}

	/********** 获取系统初始化配置 ***************/
	@RequestMapping("/getDocSysInitConfig.do")
	public void getDocSysInitConfig(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getDocSysInitConfig.do ***********************");
		ReturnAjax rt = new ReturnAjax();

		JSONObject config = new JSONObject();
		config.put("docSysInitState", getDocSysInitState());
		config.put("docSysInitAuthCode", getDocSysInitAuthCode());
		config.put("serverIP", getServerIP());

		rt.setData(config);
		writeJson(rt, response);
	}

	/********** 获取Office编辑器运行时配置 ***************/
	@RequestMapping("/getOfficeEditorConfig.do")
	public void getOfficeEditorConfig(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getOfficeEditorConfig.do ***********************");
		ReturnAjax rt = new ReturnAjax();

		String officeEditorApi = getOfficeEditor(request);
		JSONObject config = new JSONObject();
		config.put("officeEditorApi", officeEditorApi);
		config.put("officeEditorType", getOfficeEditorType());

		if(officeEditorApi == null || officeEditorApi.isEmpty())
		{
			rt.setError("Office编辑器不可用");
			rt.setData(config);
			writeJson(rt, response);
			return;
		}

		rt.setData(config);
		writeJson(rt, response);
	}
	
	/********** 获取轮播图配置 ***************/
	@RequestMapping("/getBannerConfig.do")
	public void getBannerConfig(String serverIP, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getBannerConfig.do ***********************");

		Log.debug("getBannerConfig() serverIP:" + serverIP);
		collectDocSysInstallationInfo(serverIP, request);
		
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
		String BannerConfigPath = docSysIniPath;
		if(FileUtil.isFileExist(BannerConfigPath + "bannerConfig.json") == false)
		{
			BannerConfigPath = docSysWebPath + "WEB-INF/classes/";
			if(FileUtil.isFileExist(BannerConfigPath + "bannerConfig.json") == false)
			{
				docSysErrorLog("bannerConfig.json文件不存在",rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		String s = FileUtil.readDocContentFromFile(BannerConfigPath, "bannerConfig.json");
		JSONObject jobj = JSON.parseObject(s);
		if(jobj == null)
		{
			docSysErrorLog("解析bannerConfig.json文件失败",rt);
			writeJson(rt, response);
			return;	
		}
		
		JSONArray list = jobj.getJSONArray("BannerConfigList");
		rt.setData(list);
		writeJson(rt, response);
	}

	/**
	 * 获取系统邮件配置（**旧接口，保留形状**）。
	 *
	 * <p>【M3 改造】数据来源由 {@code docSysConfig.properties} 改为 {@code system_setting} 表，
	 * 但响应仍是老页面认识的三字段 {@code host/email/pwd}，所以改造期间老页面照用不误。
	 * 新页面请用 {@link #getSystemMailConfig(String, HttpSession, HttpServletRequest, HttpServletResponse)}
	 * （返回结构化配置 + 供应商元数据 + 提醒项）。
	 */
	@RequestMapping("/getSystemEmailConfig.do")
	public void getSystemEmailConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemEmailConfig.do ***********************");

		Log.debug("getSystemEmailConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		MailConfig config = mailConfigStore.load();
		MailSmtpConfig smtp = (config.getSmtp() == null) ? new MailSmtpConfig() : config.getSmtp();
		
		JSONObject data = new JSONObject();
		data.put("host", nullToEmpty(smtp.getHost()));
		data.put("email", nullToEmpty(config.getEffectiveFrom()));
		data.put("pwd", nullToEmpty(smtp.getPassword()));
		rt.setData(data);
		writeJson(rt, response);
	}
	
	/**
	 * 设置系统邮件配置（**旧接口，保留参数**）。
	 *
	 * <p>【M3 改造】只写 {@code system_setting} 表（不再回写 properties，方案决策 10）；
	 * 老页面只提交 {@code host/email/pwd}，按「**只改用户真的改了的字段**」合并到已保存配置，
	 * 其余（端口/加密方式/发件人显示名/超时…）保持不变。
	 */
	@RequestMapping("/setSystemEmailConfig.do")
	public void setSystemEmailConfig(String authCode,String host, String email, String pwd, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemEmailConfig.do ***********************");
		
		Log.debug("setSystemEmailConfig() host:" + host + " email:" + email + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(host == null && email == null && pwd == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		MailConfig config = mailConfigStore.load();
		if(host != null)
		{
			config.getSmtp().setHost(host.trim());
		}
		if(email != null)
		{
			config.getSmtp().setAccount(email.trim());
			config.setFrom(email.trim());
		}
		if(pwd != null)
		{
			config.getSmtp().setPassword(pwd);
		}
		
		if(mailConfigStore.save(config))
		{
			Log.info("setSystemEmailConfig() 保存成功 host:" + config.getSmtp().getHost());
			addSystemLog(request, accessUser, "setSystemEmailConfig", "setSystemEmailConfig", "修改系统邮件配置", null,
					"成功", null, null, null, "host:" + config.getSmtp().getHost() + " account:" + MailSender.maskEmail(config.getSmtp().getAccount()));
		}
		else
		{
			rt.setError("保存失败，请检查系统日志");
			addSystemLog(request, accessUser, "setSystemEmailConfig", "setSystemEmailConfig", "修改系统邮件配置", null,
					"失败", null, null, null, "host:" + config.getSmtp().getHost());
		}
		
		writeJson(rt, response);
	}

	/**
	 * 获取邮件服务配置（**新接口**，与短信 {@code getSystemSmsConfig.do} 同形状）。
	 *
	 * <p>返回 {@code {config, providerTypes, encryptionTypes, warnings, errors}}：
	 * 表格页面直接渲染，供应商下拉与必填标记都来自枚举元数据（加新供应商无需改页面）。
	 */
	@RequestMapping("/getSystemMailConfig.do")
	public void getSystemMailConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemMailConfig.do ***********************");

		Log.debug("getSystemMailConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		MailConfig config = mailConfigStore.load();

		JSONObject data = new JSONObject();
		data.put("config", config);
		data.put("providerTypes", buildMailProviderTypes());
		data.put("providerDefaults", buildMailProviderDefaults());
		data.put("encryptionTypes", buildMailEncryptionTypes());
		data.put("httpParamsText", MailConfigForm.formatParamPairs(
				config.getHttp() == null ? null : config.getHttp().getParams()));
		data.put("warnings", mailConfigStore.getWarnings(config));
		data.put("errors", mailConfigStore.validate(config));
		rt.setData(data);
		writeJson(rt, response);
	}

	/**
	 * 保存邮件服务配置（**新接口**）。
	 *
	 * <p>结构化表单字段优先；只带旧三参数时按「首次迁移同款规则」解析（方案 §2.4）。
	 * 校验不过直接返回错误（保持编辑态），不写库。
	 */
	@RequestMapping("/setSystemMailConfig.do")
	public void setSystemMailConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemMailConfig.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		MailConfig config = buildMailConfigFromRequest(request);
		if(config == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}

		String error = validateMailConfig(config);
		if(error != null)
		{
			rt.setError(error);
			addSystemLog(request, accessUser, "setSystemMailConfig", "setSystemMailConfig", "修改邮件服务配置", null,
					"失败", null, null, null, "provider:" + config.getProvider() + " reason:" + error);
			writeJson(rt, response);
			return;
		}

		if(mailConfigStore.save(config))
		{
			Log.info("setSystemMailConfig() 保存成功 provider:" + config.getProvider() + " enabled:" + config.isEnabled());
			addSystemLog(request, accessUser, "setSystemMailConfig", "setSystemMailConfig", "修改邮件服务配置", null,
					"成功", null, null, null, "provider:" + config.getProvider() + " enabled:" + config.isEnabled()
					+ " host:" + config.getSmtp().getHost() + " encryption:" + config.getSmtp().getEncryption());
		}
		else
		{
			rt.setError("保存失败，请检查系统日志");
			addSystemLog(request, accessUser, "setSystemMailConfig", "setSystemMailConfig", "修改邮件服务配置", null,
					"失败", null, null, null, "provider:" + config.getProvider());
		}

		writeJson(rt, response);
	}

	/**
	 * 发送测试邮件（方案 §2.4 的试发弹窗后端）。
	 *
	 * <p>请求里带了邮件表单字段时，用**页面上的未保存值**发送（可先试后存）；
	 * 一个字段都没带时用已保存的配置。失败原因（含 SMTP 返回码/被拒地址）原样回传，
	 * 便于管理员自助定位 —— 这正是老实现最缺的一环（原来只有一句「发送系统邮件失败！」）。
	 */
	@RequestMapping("/testSystemMailConfig.do")
	public void testSystemMailConfig(String toEmail, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testSystemMailConfig.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(toEmail == null || toEmail.trim().isEmpty())
		{
			rt.setError("请填写接收测试邮件的邮箱地址");
			writeJson(rt, response);
			return;
		}

		MailConfig config = buildMailConfigFromRequest(request);
		if(config == null)
		{
			config = mailConfigStore.load();	// 未带表单字段 → 用已保存配置
		}

		String error = validateMailConfig(config);
		if(error != null)
		{
			rt.setError(error);
			writeJson(rt, response);
			return;
		}

		String subject = "MxsDoc 邮件服务测试";
		String content = "如果您收到了这封邮件，说明邮件服务配置可用。"
				+ "（发送时间：" + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()) + "）";
		MailMessage message = new MailMessage();
		message.addTo(toEmail.trim());
		message.setSubject(subject);
		message.setContent(content);

		MailSendResult result = mailSender.send(config, message);
		if(result.isSuccess())
		{
			JSONObject data = new JSONObject();
			data.put("provider", result.getProvider());
			data.put("providerCode", result.getProviderCode());
			data.put("providerMsg", result.getProviderMsg());
			data.put("elapsedMs", result.getElapsedMs());
			data.put("raw", truncate(result.getRaw(), MAX_MAIL_RAW_LEN));
			rt.setData(data);

			addSystemLog(request, accessUser, "testSystemMailConfig", "testSystemMailConfig", "发送测试邮件", null,
					"成功", null, null, null, "provider:" + result.getProvider()
					+ " to:" + MailSender.maskEmail(toEmail.trim()) + " elapsedMs:" + result.getElapsedMs());
		}
		else
		{
			// 失败时也把返回码与**完整异常链**一起回传：
			// 否则只有一句 “Could not convert socket to TLS”，而真正原因（如 SSLException: Received fatal alert: internal_error）
			// 被 JavaMail 包在异常链里，管理员无从下手。
			JSONObject data = new JSONObject();
			data.put("provider", result.getProvider());
			data.put("providerCode", result.getProviderCode());
			data.put("providerMsg", result.getProviderMsg());
			data.put("elapsedMs", result.getElapsedMs());
			data.put("raw", truncate(result.getRaw(), MAX_MAIL_RAW_LEN));
			rt.setData(data);

			// SMTP 原文透传给管理员，便于自助排查（同短信策略）
			rt.setError(result.getFailureReason());
			addSystemLog(request, accessUser, "testSystemMailConfig", "testSystemMailConfig", "发送测试邮件", null,
					"失败", null, null, null, "to:" + MailSender.maskEmail(toEmail.trim())
					+ " reason:" + result.getFailureReason());
		}

		writeJson(rt, response);
	}

	/** 供应商元数据（页面用其渲染下拉与必填标记；**只列已实现**的，避免管理员选了用不了） */
	private JSONArray buildMailProviderTypes()
	{
		JSONArray types = new JSONArray();
		for(MailProviderType type : MailProviderType.values())
		{
			if(type.isImplemented() == false)
			{
				continue;
			}
			JSONObject item = new JSONObject();
			item.put("code", type.getCode());
			item.put("displayName", type.getDisplayName());
			JSONArray fields = new JSONArray();
			for(String field : type.getRequiredFields())
			{
				fields.add(field);
			}
			item.put("requiredFields", fields);
			types.add(item);
		}
		return types;
	}

	/** 各供应商的默认接入地址（页面 placeholder；不写值也能用） */
	private JSONObject buildMailProviderDefaults()
	{
		JSONObject defaults = new JSONObject();
		defaults.put(MailProviderType.ALIYUN.getCode(), MailAliyunConfig.DEFAULT_ENDPOINT);
		defaults.put(MailProviderType.TENCENT.getCode(), MailTencentConfig.DEFAULT_ENDPOINT);
		return defaults;
	}

	/** 加密方式元数据（页面下拉 + 「建议端口」提示） */
	private JSONArray buildMailEncryptionTypes()
	{
		JSONArray types = new JSONArray();
		for(MailEncryption encryption : MailEncryption.values())
		{
			JSONObject item = new JSONObject();
			item.put("code", encryption.getCode());
			item.put("displayName", encryption.getDisplayName());
			item.put("suggestedPort", encryption.getSuggestedPort());
			types.add(item);
		}
		return types;
	}

	/**
	 * 请求参数 → {@link MailConfig}：结构化表单字段优先；只带旧三参数时按「只改改了的字段」合并；
	 * 两者都没有（即请求里根本没有邮件参数）→ 返回 null 由调用方决定。
	 */
	private MailConfig buildMailConfigFromRequest(HttpServletRequest request)
	{
		Map<String, String> params = new HashMap<String, String>();
		Enumeration<?> names = request.getParameterNames();
		while(names.hasMoreElements())
		{
			String name = String.valueOf(names.nextElement());
			params.put(name, request.getParameter(name));
		}

		if(MailConfigForm.hasFormFields(params))
		{
			return MailConfigForm.bind(params);
		}

		String host = params.get("host");
		String email = params.get("email");
		String pwd = params.get("pwd");
		if(host != null || email != null || pwd != null)
		{
			Log.info("buildMailConfigFromRequest() 使用旧参数（host/email/pwd）兼容解析");
			MailConfig config = mailConfigStore.load();
			if(host != null)
			{
				config.getSmtp().setHost(host.trim());
			}
			if(email != null)
			{
				config.getSmtp().setAccount(email.trim());
				config.setFrom(email.trim());
			}
			if(pwd != null)
			{
				config.getSmtp().setPassword(pwd);
			}
			return config;
		}

		return null;
	}

	/** 校验：阻断性错误拼接成一句（最多 3 条，其余用省略号） */
	private String validateMailConfig(MailConfig config)
	{
		List<String> errors = mailConfigStore.validate(config);
		if(errors == null || errors.isEmpty())
		{
			return null;
		}

		StringBuilder sb = new StringBuilder();
		int index = 0;
		for(String error : errors)
		{
			if(index >= MAX_MAIL_ERROR_ITEMS)
			{
				sb.append("…共 ").append(errors.size()).append(" 项");
				break;
			}
			if(sb.length() > 0)
			{
				sb.append("；");
			}
			sb.append(error);
			index++;
		}
		return sb.toString();
	}

	private String nullToEmpty(String value)
	{
		return (value == null) ? "" : value;
	}

	
	private boolean checkAndAddDocSysIniDir() {
		File docSysIniDir = new File(docSysIniPath);
		if(docSysIniDir.exists() == true)
		{
			return false;
		}
		
		return docSysIniDir.mkdirs();
	}
	
	/**
	 * 获取短信服务配置。
	 *
	 * <p>【M6 改造】不再读 {@code docSysConfig.properties}（它现在只是「首次启用时的默认数据」），
	 * 而是返回 {@code system_setting} 表装配出的结构化配置 + 运营商元数据 + 提醒项，
	 * 供后台页面直接渲染（运营商下拉与必填标记都从元数据来，加新运营商无需改页面）。
	 */
	@RequestMapping("/getSystemSmsConfig.do")
	public void getSystemSmsConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemSmsConfig.do ***********************");

		Log.debug("getSystemSmsConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		SmsConfig config = smsConfigStore.load();

		JSONObject data = new JSONObject();
		data.put("config", config);
		data.put("providerTypes", buildSmsProviderTypes());
		data.put("warnings", smsConfigStore.getWarnings(config));
		data.put("errors", smsConfigStore.validate(config));
		// 固定参数在页面上是「k=v 多行文本」，这里给一份服务端格式化结果，避免前后端两套格式化逻辑
		data.put("customParamsText",
				SmsConfigForm.formatParamPairs((config.getCustom() == null) ? null : config.getCustom().getParams()));

		rt.setData(data);
		writeJson(rt, response);
	}

	/**
	 * 保存短信服务配置。
	 *
	 * <p>【M6 改造】只写 {@code system_setting} 表（**不再回写 properties**，方案决策 9）；
	 * 仍兼容旧前端的 {@code server/apikey/tplid} 三参数（按首次迁移同款规则解析，方案 §4.2 #7）。
	 */
	@RequestMapping("/setSystemSmsConfig.do")
	public void setSystemSmsConfig(String authCode,String server, String apikey, String tplid, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemSmsConfig.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		SmsConfig config = buildSmsConfigFromRequest(request);
		if(config == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}

		String error = validateSmsConfig(config);
		if(error != null)
		{
			rt.setError(error);
			addSystemLog(request, accessUser, "setSystemSmsConfig", "setSystemSmsConfig", "修改短信服务配置", null,
					"失败", null, null, null, "provider:" + config.getProvider() + " reason:" + error);
			writeJson(rt, response);
			return;
		}

		if(smsConfigStore.save(config))
		{
			Log.info("setSystemSmsConfig() 保存成功 provider:" + config.getProvider() + " enabled:" + config.isEnabled());
			addSystemLog(request, accessUser, "setSystemSmsConfig", "setSystemSmsConfig", "修改短信服务配置", null,
					"成功", null, null, null, "provider:" + config.getProvider() + " enabled:" + config.isEnabled());
		}
		else
		{
			rt.setError("保存失败，请检查系统日志");
			addSystemLog(request, accessUser, "setSystemSmsConfig", "setSystemSmsConfig", "修改短信服务配置", null,
					"失败", null, null, null, "provider:" + config.getProvider());
		}

		writeJson(rt, response);
	}

	/**
	 * 发送测试短信（方案 §2.5）。
	 *
	 * <p>请求里带了短信表单字段时，用**页面上的未保存值**发送（可先试后存）；一个字段都没带
	 * 时用已保存的配置。测试使用 {@code test} 场景的模板，模板变量 {@code code} 为随机验证码，
	 * 并随响应返回，方便与收到的短信核对。
	 */
	@RequestMapping("/testSystemSmsConfig.do")
	public void testSystemSmsConfig(String phone, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testSystemSmsConfig.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(phone == null || phone.trim().isEmpty())
		{
			rt.setError("请填写接收测试短信的手机号");
			writeJson(rt, response);
			return;
		}

		SmsConfig config = buildSmsConfigFromRequest(request);
		if(config == null)
		{
			config = smsConfigStore.load();	// 未带表单字段 → 用已保存配置
		}

		String error = validateSmsConfig(config);
		if(error != null)
		{
			rt.setError(error);
			writeJson(rt, response);
			return;
		}

		String code = generateSmsTestCode();
		Map<String, String> vars = new HashMap<String, String>();
		vars.put("code", code);

		SmsSendResult result = smsSender.send(config, SmsScene.TEST, phone.trim(), vars);
		if(result.isSuccess())
		{
			JSONObject data = new JSONObject();
			data.put("provider", result.getProvider());
			data.put("providerCode", result.getProviderCode());
			data.put("providerMsg", result.getProviderMsg());
			data.put("elapsedMs", result.getElapsedMs());
			data.put("code", code);
			data.put("raw", truncate(result.getRaw(), MAX_SMS_RAW_LEN));
			rt.setData(data);

			addSystemLog(request, accessUser, "testSystemSmsConfig", "testSystemSmsConfig", "发送测试短信", null,
					"成功", null, null, null, "provider:" + result.getProvider()
					+ " phone:" + SmsSender.maskPhone(phone.trim()) + " elapsedMs:" + result.getElapsedMs());
		}
		else
		{
			// 失败时也把返回码与**运营商原始响应**一起回传：
			// 否则只剩一句 “响应不是 JSON（HTTP 400）”，而云片真正的错误（如 code 7 模板不可用）在原始响应里。
			JSONObject data = new JSONObject();
			data.put("provider", result.getProvider());
			data.put("providerCode", result.getProviderCode());
			data.put("providerMsg", result.getProviderMsg());
			data.put("elapsedMs", result.getElapsedMs());
			data.put("raw", truncate(result.getRaw(), MAX_SMS_RAW_LEN));
			rt.setData(data);

			// 运营商原文透传给管理员，便于自助排查（方案 P5）
			rt.setError(result.getFailureReason());
			addSystemLog(request, accessUser, "testSystemSmsConfig", "testSystemSmsConfig", "发送测试短信", null,
					"失败", null, null, null, "phone:" + SmsSender.maskPhone(phone.trim())
					+ " reason:" + result.getFailureReason());
		}

		writeJson(rt, response);
	}

	/** 运营商元数据（页面用其渲染下拉与必填标记；新增运营商只需加枚举项） */
	private JSONArray buildSmsProviderTypes()
	{
		JSONArray types = new JSONArray();
		for(SmsProviderType type : SmsProviderType.values())
		{
			JSONObject item = new JSONObject();
			item.put("code", type.getCode());
			item.put("displayName", type.getDisplayName());
			item.put("defaultEndpoint", type.getDefaultEndpoint());
			item.put("signNameRequired", type.isSignNameRequired());
			JSONArray fields = new JSONArray();
			for(String field : type.getRequiredFields())
			{
				fields.add(field);
			}
			item.put("requiredFields", fields);
			types.add(item);
		}
		return types;
	}

	/**
	 * 请求参数 → {@link SmsConfig}：结构化表单字段优先；只带旧三参数时按首次迁移同款规则解析；
	 * 两者都没有（即请求里根本没有短信参数）→ 返回 null 由调用方决定。
	 */
	private SmsConfig buildSmsConfigFromRequest(HttpServletRequest request)
	{
		Map<String, String> params = new HashMap<String, String>();
		Enumeration<?> names = request.getParameterNames();
		while(names.hasMoreElements())
		{
			String name = String.valueOf(names.nextElement());
			params.put(name, request.getParameter(name));
		}

		if(SmsConfigForm.hasFormFields(params))
		{
			return SmsConfigForm.bind(params);
		}

		String server = params.get("server");
		String apikey = params.get("apikey");
		String tplid = params.get("tplid");
		if(server != null || apikey != null || tplid != null)
		{
			Log.info("buildSmsConfigFromRequest() 使用旧参数（server/apikey/tplid）兼容解析");
			return smsConfigStore.assemble(SmsConfigStore.buildSeedEntries(server, apikey, tplid));
		}

		return null;
	}

	/** 校验：阻断性错误拼接成一句（最多 3 条，其余用省略号） */
	private String validateSmsConfig(SmsConfig config)
	{
		List<String> errors = smsConfigStore.validate(config);
		if(errors == null || errors.isEmpty())
		{
			return null;
		}

		StringBuilder sb = new StringBuilder();
		int index = 0;
		for(String error : errors)
		{
			if(index >= MAX_SMS_ERROR_ITEMS)
			{
				sb.append("…共 ").append(errors.size()).append(" 项");
				break;
			}
			if(sb.length() > 0)
			{
				sb.append("；");
			}
			sb.append(error);
			index++;
		}
		return sb.toString();
	}

	/** 测试短信的验证码（6 位数字，随响应返回便于核对） */
	private String generateSmsTestCode()
	{
		int code = (int)(Math.random() * 1000000);
		String text = String.valueOf(code);
		while(text.length() < 6)
		{
			text = "0" + text;
		}
		return text;
	}

	private String truncate(String value, int maxLen)
	{
		if(value == null || value.length() <= maxLen)
		{
			return value;
		}
		return value.substring(0, maxLen) + "...(" + value.length() + ")";
	}
	
	@RequestMapping("/getSystemDbConfig.do")
	public void getSystemDbConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemDbConfig.do ***********************");

		Log.debug("getSystemDbConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			rt.setData("invalidAuthCode");
			writeJson(rt, response);			
			return;
		}
		
		String type = ReadProperties.read("jdbc.properties", "db.type");
		if(type == null)
		{
			type = "";
		}
		String url = ReadProperties.read("jdbc.properties", "db.url");
		if(url == null)
		{
			url = "";
		}
		String user = ReadProperties.read("jdbc.properties", "db.username");
		if(user == null)
		{
			user = "";
		}
		
		String pwd = ReadProperties.read("jdbc.properties", "db.password");
		if(pwd == null)
		{
			pwd = "";
		}
		
		JSONObject config = new JSONObject();
		config.put("type", type);
		config.put("url", url);
		config.put("user", user);
		config.put("pwd", pwd);

		rt.setData(config);
		writeJson(rt, response);
	}
	
	/********** 设置系统数据库配置 ***************/
	@RequestMapping("/setSystemDBConfig.do")
	public void setSystemDBConfig(String authCode, String type, String url, String user, String pwd, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemDBConfig.do ***********************");

		Log.debug("setSystemDBConfig() type:"  + type + " url:" + url + " user:" + user  + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(url == null && user == null && pwd == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "jdbc.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		//注意：数据库和其他配置文件不一样，为了避免setValue导致转义字符的影响，所以每次都是读取后重新写入
		boolean configChanged = false;		
		if(type != null)
		{
			configChanged = true;	
		}			
		if(url != null)
		{
			configChanged = true;	
		}
		if(user != null)
		{
			configChanged = true;
		}
		if(pwd != null)
		{
			configChanged = true;
		}
		if(configChanged == false)
		{
			Log.debug("setSystemDBConfig() 数据库配置未改动");
			docSysErrorLog("配置未改动！", rt);
			writeJson(rt, response);
			return;
		}
		
		//set Values to configFile
		if(type == null)
		{
			type = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.type");
		}
		String jdbcDriver = getJdbcDriverName(type);		
		if(url == null)
		{			
			url = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.url");
		}
		if(user == null)
		{
			user = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.username");			
		}
		if(pwd == null)
		{
			pwd = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.password");
		}
		String jdbcConfig = "";
		jdbcConfig += "db.type=" + type + "\n";
		jdbcConfig += "db.url=" + url + "\n";
		jdbcConfig += "db.username=" + user + "\n";
		jdbcConfig += "db.password=" + pwd + "\n";
		jdbcConfig += "db.driver=" + jdbcDriver;
		if(FileUtil.saveDocContentToFile(jdbcConfig, tmpDocSystemConfigPath, configFileName, "UTF-8") == false)
		{
			Log.debug("setSystemDBConfig() Failed to modify " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("配置文件修改失败！", rt);
			writeJson(rt, response);
			return;			
		}
		
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			Log.debug("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("配置文件拷贝失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		docSysIniState = 1; //needRestart
		addDocSysInitAuthCode(systemUser);
				
		writeJson(rt, response);
		
		//创建系统重启任务
		createMonitorTrigger("restart");
	}
	
	@RequestMapping("/clusterServerLoopbackTest.do")
	public void clusterServerLoopbackTest(String authCode, String msg, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerLoopbackTest.do ***********************");

		Log.debug("clusterServerLoopbackTest() msg:[" + msg + "] authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		AuthCode auth = checkAuthCode(authCode, "clusterServerLoopbackTest", rt);
		if(auth == null)
		{
			Log.debug("clusterServerLoopbackTest checkAuthCode return false");
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		clusterServerLoopbackMsg = msg;
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/clusterServerJoinApply.do")
	public void clusterServerJoinApply(String authCode, String serverUrl, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerJoinApply.do ***********************");

		Log.debug("clusterServerJoinApply() serverUrl:[" + serverUrl + "] gived authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		
		//TODO: send msg to serverUrl with gived authCode
		String msg = "clusterServerTest-" + new Date().getTime() + " from [" + clusterServerUrl + "]";
		if(clusterServerReachTest(serverUrl, authCode, msg) == false)
		{
			docSysErrorLog("clusterServerReachTest Failed", rt);
		}
		
		writeJson(rt, response);
	}
	
	protected boolean clusterServerReachTest(String serverUrl, String authCode, String msg) {
		Log.info("clusterServerReachTest() msg [" + msg + "] authCode:[" + authCode + "]");
		
		boolean result = false;
        try {
    		String requestUrl = serverUrl + "/DocSystem/Manage/clusterServerTest.do";
    		Log.debug("clusterServerLoopbackTest() requestUrl:" + requestUrl);
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		reqParams.put("msg", msg);
    		reqParams.put("authCode", authCode);
    		JSONObject ret = postFileStreamAndJsonObj(requestUrl, null, null, reqParams, true);
    		if(ret != null)
    		{
    			String status = ret.getString("status");
        		if(status != null && status.equals("ok"))
        		{
        			result = true;
        		}
    		}
        } catch (Exception e) {
            errorLog(e);
        }        
        return result;		
	}

	@RequestMapping("/clusterServerTest.do")
	public void clusterServerTest(String authCode, String msg, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerTest.do ***********************");

		Log.debug("clusterServerTest() msg:[" + msg + "] authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		AuthCode auth = checkAuthCode(authCode, "clusterServerTest", rt);
		if(auth == null)
		{
			Log.debug("clusterServerTest checkAuthCode return false");
			//rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//send msg back
		rt.setData(msg);
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/testDatabase.do")
	public void testDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testDatabase.do ***********************");

		Log.debug("testDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("testDatabase() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
		}
		writeJson(rt, response);
	}
	
	//强制复位数据库
	@RequestMapping("/deleteDatabase.do")
	public void deleteDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** deleteDatabase.do ***********************");

		Log.debug("deleteDatabase()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("deleteDatabase() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("deleteDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}		
		
		String dbName = getDBNameFromUrl(type, url);
		String tmpDbName = dbName.toLowerCase();
		Log.debug("deleteDatabase() dbName:" + dbName + " tmpDbName:" + tmpDbName);
		if(!tmpDbName.contains("docsystem")) //只能删除docsystem相关的数据库
		{
			Log.debug("deleteDatabase() 非法删除操作");
			docSysErrorLog("非法删除操作：" + dbName, rt);
			writeJson(rt, response);			
			return;			
		}
		
		if(deleteDB(type, dbName, url, user, pwd) == false)
		{
			Log.debug("deleteDatabase() 删除数据库失败");
			docSysErrorLog("数据库初始化失败", rt);
			writeJson(rt, response);			
			return;
		}
		writeJson(rt, response);
	}
	
	//强制复位数据库
	@RequestMapping("/resetDatabase.do")
	public void resetDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** resetDatabase.do ***********************");

		Log.debug("resetDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);		
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("resetDatabase() 连接数据库:" + url + " 失败");
			String dbName = getDBNameFromUrl(type, url);

			deleteDB(type, dbName, url, user, pwd);
			createDB(type, dbName, url, user, pwd);
			if(initDB(type, url, user, pwd) == false)
			{
				Log.debug("resetDatabase() 新建数据库失败");
				docSysErrorLog("新建数据库失败", rt);
				writeJson(rt, response);
				return;
			}
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("resetDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//重置数据库表不删除数据库（因为删除了需要重新创建数据库，需要利用其他数据库，避免不必要的麻烦）
		//String dbName = getDBNameFromUrl(type, url);
		//deleteDB(type, dbName, url, user, pwd);
		//createDB(type, dbName, url, user, pwd);
		deleteDBTabsEx(type, url, user, pwd);
		if(initDB(type, url, user, pwd) == false)
		{
			Log.debug("resetDatabase() reset database failed: initDB error");
			docSysErrorLog("数据库初始化失败", rt);
			writeJson(rt, response);
			return;
		}
		//DocSysAgent: deleteDBTabsEx 也删除了 Agent 表，initDB 只重建 DocSystem 表，
		//这里按当前 schema 重建 Agent 表，使重置后无需重启即可继续使用 Agent。
		triggerAgentTableRebuild();
		writeJson(rt, response);
	}
	
	@RequestMapping("/exportDBData.do")
	public void exportDBData(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** exportDBData.do ***********************");

		Log.debug("exportDBData()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("exportDBData() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("exportDBData() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		String targetPath = docSysIniPath + "backup/";
		String targetName = "docsystem_"+backUpTime+".zip";
		if(doCompressDir(docSysIniPath + "backup/", backUpTime, docSysIniPath + "backup/", targetName, rt) == false)
		{
			docSysErrorLog("压缩本地目录失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		Doc downloadDoc = buildDownloadDocInfo(0, "","", targetPath, targetName, 0);
		String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;	
		rt.setData(downloadLink);
		writeJson(rt, response);
	}
	
	@RequestMapping("/importDBData.do")
	public void importDBData(MultipartFile uploadFile, String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** importDBData.do ***********************");

		Log.debug("importDBData()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		//FileUtil.saveFile to tmpPath
		if(uploadFile == null)
		{
			Log.debug("importDBData() uploadFile is null");
			docSysErrorLog("上传文件为空", rt);
			writeJson(rt, response);
			return;
		}
		String fileName = uploadFile.getOriginalFilename();
		String suffix = FileUtil.getFileSuffix(fileName);
		String webTmpPathForImportDBData = getWebTmpPath() + "importDBData/";
		FileUtil.saveFile(uploadFile, webTmpPathForImportDBData, fileName);
		
		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("importDBData() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}

		if(importDatabase(null, suffix, webTmpPathForImportDBData, fileName, type, url, user, pwd) == false)
		{
			Log.debug("importDBData() 数据库导入失败");
			docSysErrorLog("数据库导入失败", rt);
			writeJson(rt, response);
			return;			
		}
		writeJson(rt, response);
		
		//重新初始化仓库扩展配置（此时可能引入新的仓库）
		systemDisabled = 1;
		initReposExtentionConfigEx();
		systemDisabled = 0;
	}

	@RequestMapping("/getSystemInfo.do")
	public void getSystemInfo(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemInfo.do ***********************");

		Log.debug("getSystemInfo()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		String version = FileUtil.readDocContentFromFile(docSysWebPath, "version");
		if(version == null)
		{
			version = "";
		}
		
		String tomcatPath = getTomcatPath();
		String javaHome = getJavaHome();
		String officeEditorApi = Path.getOfficeEditorApi();
		String ldapConfig = getLdapConfig();
		String allowedNetworkConfig = getAllowedNetworkConfig();
		String llmConfig = getLLMConfig();		
		Integer maxThreadCount = getMaxThreadCount();
		Integer redisEn = getRedisEn();
		String redisUrl = getRedisUrl();
		String clusterServerUrl = getClusterServerUrl();
		String clusterInfo = getClusterInfo();

		JSONObject config = getSystemInfo();
		config.put("docSysType", docSysType);
		config.put("isSalesServer", isSalesServer);
		
		config.put("version", version);
		config.put("tomcatPath", tomcatPath);
		config.put("javaHome", javaHome);
		config.put("ldapConfig", ldapConfig);
		config.put("allowedNetworkConfig", allowedNetworkConfig);
		config.put("llmConfig", llmConfig);
		config.put("logLevel", Log.logLevel);
		config.put("logFile", Log.logFileConfig);
		config.put("maxThreadCount", maxThreadCount);	
		config.put("systemDisabled", systemDisabled);
		config.put("officeDisabled", officeDisabled);
		config.put("isOnlyOfficeUsed", isOnlyOfficeUsed ? 1 : 0);
		config.put("redisEn", redisEn);
		config.put("redisUrl", redisUrl);
		config.put("clusterServerUrl", clusterServerUrl);
		config.put("clusterInfo", clusterInfo);
		
		if(docSysType < 1)
		{
			String openOfficePath = getOpenOfficePath();
			config.put("openOfficePath", openOfficePath);
		}
		config.put("officeEditorApi", officeEditorApi);
		rt.setData(config);
		writeJson(rt, response);
	}

	@RequestMapping("/getSystemLicenses.do")
	public void getSystemLicenses(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemLicenses.do ***********************");
		
		Log.debug("getSystemLicenses()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		JSONObject systemLicense = new JSONObject();
		systemLicense.put("type", systemLicenseInfo.type);
		systemLicense.put("usersCount", systemLicenseInfo.usersCount);
		systemLicense.put("expireTime", systemLicenseInfo.expireTime);
		systemLicense.put("hasLicense", systemLicenseInfo.hasLicense);
		systemLicense.put("customer", systemLicenseInfo.customer);
		systemLicense.put("createTime", systemLicenseInfo.createTime);
		systemLicense.put("allowedAction", systemLicenseInfo.allowedAction);
		if(systemLicenseInfo.serverSN != null)
		{
			systemLicense.put("serverSN", systemLicenseInfo.serverSN);
		}
		
		JSONObject officeLicense = new JSONObject();
		officeLicense.put("mode", officeLicenseInfo.mode);
		officeLicense.put("usersCount", officeLicenseInfo.usersCount);
		officeLicense.put("connections", officeLicenseInfo.connections);
		officeLicense.put("hasLicense", officeLicenseInfo.hasLicense);
		
		
		JSONObject licenses = new JSONObject();
		licenses.put("docSysType", docSysType);
		licenses.put("systemLicense", systemLicense);
		licenses.put("officeLicense", officeLicense);
		rt.setData(licenses);
		writeJson(rt, response);
	}
	
	/********** 清除系统所有锁定 ***************/
	@RequestMapping("/cleanSystemLocks.do")
	public void cleanSystemLocks(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** cleanSystemLocks.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		//clean all RemoteStorageLocks
		Log.info("cleanSystemLocks() cleanAllRemoteStorageLocks Start");
		cleanAllRemoteStorageLocks();
		Log.info("cleanSystemLocks() cleanAllRemoteStorageLocks End");
		
		
		//clean all reposLocks
		Log.info("cleanSystemLocks() cleanAllReposLocks Start");
		cleanAllReposLocks();
		Log.info("cleanSystemLocks() cleanAllReposLocks End");

		//TODO: docLock logic is too complicated, so need superadmin to unlock it on repos page		
					
		writeJson(rt, response);
	}
	
	private void cleanAllRemoteStorageLocks() {
		if(redisEn)
		{
			RMap<Object, Object>  redisRemoteStorageLocksMap = redisClient.getMap("remoteStorageLocksMap");
			redisRemoteStorageLocksMap.clear();
		}
		else
		{
			remoteStorageLocksMap.clear();
		}
	}
	
	private void cleanAllReposLocks() {
		if(redisEn)
		{
			RMap<Object, Object>  redisReposLocksMap = redisClient.getMap("reposLocksMap");
			redisReposLocksMap.clear();
		}
		else
		{
			reposLocksMap.clear();
			
			//TODO: 遍历docLocksMap的lockMap，并清空
			Iterator<Entry<Integer, ConcurrentHashMap<String, DocLock>>> iterator = docLocksMap.entrySet().iterator();
	        while (iterator.hasNext()) 
	        {
	        	Entry<Integer, ConcurrentHashMap<String, DocLock>> entry = iterator.next();
	            if(entry != null)
	        	{
	            	ConcurrentHashMap<String, DocLock> lockMap = entry.getValue();
	            	lockMap.clear();
	        	}
	        }
		}
	}

	/********** 禁用系统 ***************/
	@RequestMapping("/disableSystem.do")
	public void disableSystem(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableSystem.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		systemDisabled = 1;
					
		writeJson(rt, response);
	}
	
	/********** 启用系统 ***************/
	@RequestMapping("/enableSystem.do")
	public void enableSystem(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableSystem.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		systemDisabled = 0;
					
		writeJson(rt, response);
	}
	
	/********** 禁用Office ***************/
	@RequestMapping("/disableOffice.do")
	public void disableOffice(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableOffice.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		officeDisabled = 1;
					
		writeJson(rt, response);
	}
	
	/********** 启用Office ***************/
	@RequestMapping("/enableOffice.do")
	public void enableOffice(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableOffice.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		officeDisabled = 0;
					
		writeJson(rt, response);
	}
	
	/********** 禁用仓库 ***************/
	@RequestMapping("/disableRepos.do")
	public void disableSystem(Integer reposId, String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableRepos.do reposId:" + reposId +  " ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		setReposIsBusy(reposId, true);
					
		writeJson(rt, response);
	}
	
	/********** 启用系统 ***************/
	@RequestMapping("/enableRepos.do")
	public void enableRepos(Integer reposId, String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableRepos.do reposId:" + reposId +" ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		setReposIsBusy(reposId, false);
					
		writeJson(rt, response);
	}
	
	/********** 设置系统数据库配置 ***************/
	@RequestMapping("/setSystemInfo.do")
	public void setSystemInfo(String authCode, 
			String tomcatPath, 
			String javaHome,
			String openOfficePath, 
			String officeEditorApi,
			String defaultReposStorePath,
			String systemLogStorePath,
			String indexDBStorePath,
			String agentSkillStorePath,
			String salesDataStorePath,
			String ldapConfig,
			String allowedNetworkConfig,
			String llmConfig,
			Integer logLevel,
			String logFile,
			Integer maxThreadCount,
			Integer redisEn,
			String redisUrl,
			String clusterServerUrl,
			Integer isOnlyOfficeUsed,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemInfo.do ***********************");

		Log.debug("setSystemInfo() tomcatPath:" + tomcatPath + " javaHome:" + javaHome 
				+ " openOfficePath:" + openOfficePath + " officeEditorApi:" + officeEditorApi 
				+ " defaultReposStorePath:" + defaultReposStorePath 
				+ " systemLogStorePath:" + systemLogStorePath 
				+ " indexDBStorePath:" + indexDBStorePath 
				+ " salesDataStorePath:" + salesDataStorePath 
				+ " maxThreadCount:" + maxThreadCount 
				+ " ldapConfig:" + ldapConfig
				+ " allowedNetworkConfig:" + allowedNetworkConfig
				+ " llmConfig:" + llmConfig
				+ " logLevel:" + logLevel + " logFile:" + logFile
				+ " redisEn:" + redisEn + " redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl
				+ " isOnlyOfficeUsed:" + isOnlyOfficeUsed);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(tomcatPath == null && 
			javaHome == null &&
			openOfficePath == null &&
			officeEditorApi == null &&
			defaultReposStorePath == null &&
			systemLogStorePath == null &&
			indexDBStorePath == null &&
			salesDataStorePath == null &&
			ldapConfig == null &&
			allowedNetworkConfig == null &&
			llmConfig == null &&
			logLevel == null &&
			logFile == null &&
			maxThreadCount == null &&
			redisEn == null &&
			redisUrl == null &&
			clusterServerUrl == null &&
			isOnlyOfficeUsed == null)	
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "docSysConfig.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(tomcatPath != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "tomcatPath", tomcatPath);
		}
		if(javaHome != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "javaHome", javaHome);
		}
		if(openOfficePath != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "openOfficePath", openOfficePath);
		}
		
		if(officeEditorApi != null)
		{
			officeEditorApi.replace("\\", "/");
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "officeEditorApi", officeEditorApi);
			setOfficeEditor(officeEditorApi);
			if(officeEditorApi.isEmpty())
			{	
				officeType = 0;
			}
			else
			{
				officeType = 1;				
			}
		}
		
		if(defaultReposStorePath != null)
		{
			defaultReposStorePath = Path.localDirPathFormat(defaultReposStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "defaultReposStorePath", defaultReposStorePath);
		}
		
		if(systemLogStorePath != null)
		{
			systemLogStorePath = Path.localDirPathFormat(systemLogStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "SystemLogStorePath", systemLogStorePath);
		}
		
		if(indexDBStorePath != null)
		{
			indexDBStorePath = Path.localDirPathFormat(indexDBStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "DBStorePath", indexDBStorePath);
		}

		if(agentSkillStorePath != null)
		{
			//留空表示清除配置，回退默认(仓库默认存储位置/skills/)；非空则规范化后写入
			if(!agentSkillStorePath.isEmpty())
			{
				agentSkillStorePath = Path.localDirPathFormat(agentSkillStorePath, OSType);
			}
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "AgentSkillStorePath", agentSkillStorePath);
		}

		if(salesDataStorePath != null)
		{
			salesDataStorePath = Path.localDirPathFormat(salesDataStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "SalesDataStorePath", salesDataStorePath);
		}
		
		if(ldapConfig != null)
		{
			if(!ldapConfig.isEmpty())
			{
				if(docSysType == constants.DocSys_Professional_Edition)
				{
					docSysErrorLog("专业版不支持LDAP登录认证，请购买企业版！", rt);
				}
				else if(docSysType == constants.DocSys_Personal_Edition)
				{
					docSysErrorLog("个人版不支持LDAP登录认证，请购买企业版！", rt);
				}
			}
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "ldapConfig", ldapConfig);
		}
		if(allowedNetworkConfig != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "allowedNetworkConfig", allowedNetworkConfig);
		}
		if(llmConfig != null)
		{
			if(!llmConfig.isEmpty())
			{
				if(docSysType == constants.DocSys_Professional_Edition)
				{
					docSysErrorLog("专业版不支持AI接入，请购买企业版！", rt);
				}
				else if(docSysType == constants.DocSys_Personal_Edition)
				{
					docSysErrorLog("个人版不支持AI接入，请购买企业版！", rt);
				}
			}
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "llmConfig", llmConfig);
		}
		
		if(maxThreadCount != null)
		{			
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "maxThreadCount", maxThreadCount+"");
		}
		
		if(logLevel != null)
		{
			Log.logLevel = logLevel;
			setLogLevelToFile(logLevel);
		}
		
		if(logFile == null)
		{
			Log.logFileConfig = null;
			setLogFileToFile(null);
		}
		else
		{
			logFile = logFile.trim();
			if(logFile.isEmpty())
			{
				logFile = null;
			}
			Log.logFileConfig = logFile;
			setLogFileToFile(logFile);
			initLogFile(logFile);
		}
		
		if(redisEn != null)
		{
			if(redisEn != 0 && channel.isAllowedAction("clusterDeploy", rt) == false)
			{
				Log.info("当前授权证书不支持集群部署，请购买相应的授权证书!");
			}
			else
			{
				ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "redisEn", redisEn+"");
			}
		}
		
		if(redisUrl != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "redisUrl", redisUrl);
		}
		
		if(clusterServerUrl != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "serverUrl", clusterServerUrl);
		}
		
		if(isOnlyOfficeUsed != null)
		{
			BaseFunction.isOnlyOfficeUsed = (isOnlyOfficeUsed == 1);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "isOnlyOfficeUsed", isOnlyOfficeUsed+"");
		}
				
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			docSysDebugLog("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName, rt);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			addSystemLog(request, accessUser, "setSystemInfo", "setSystemInfo", "系统设置", null, "失败",  null, null, null, buildSystemLogDetailContent(rt));
			return;
		}
				
		writeJson(rt, response);
		addSystemLog(request, accessUser, "setSystemInfo", "setSystemInfo", "系统设置", null, "成功",  null, null, null, buildSystemLogDetailContent(rt));
		
		if(ldapConfig != null)
		{
			applySystemLdapConfig(ldapConfig);			
		}
		
		if(allowedNetworkConfig != null)
		{
			applySystemAllowedNetworkConfig(allowedNetworkConfig);						
		}
		
		if(llmConfig != null)
		{
			applySystemLLMConfig(llmConfig);			
		}
		
		if(indexDBStorePath != null)
		{
			initDocSysDataPath();
		}
		
		//initRedis() 返回true表示集群相关的参数有改动，则调用restartClusterServer
		if(initRedis())
		{
			restartClusterServer();
		}
		
	}
	
	@RequestMapping("/resetCluster.do")
	public void resetCluster(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** resetCluster.do ***********************");

		Log.debug("resetCluster() redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
		ReturnAjax rt = new ReturnAjax();

		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(clusterServerUrl == null || clusterServerUrl.isEmpty())
		{
			docSysErrorLog("集群服务器地址未设置", rt);
			writeJson(rt, response);
			return;	
		}
		
		if(redisEn == false)
		{
			docSysErrorLog("集群未开启,请检查集群参数", rt);
			writeJson(rt, response);
			return;			
		}
		
		//ClusterServer自检(确认clusterServerUrl就是当前服务器)
		if(clusterServerLoopbackTest(clusterServerUrl) == false)
		{
			docSysErrorLog("集群服务器自检失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//强制将自己设置为过期状态，触发重新加入集群
		RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
		clusterServersMap.put(clusterServerUrl, 0L);
		//TODO: restart接口可能触发两个集群心跳线程，如何保证其唯一性
		restartClusterServer();
				
		writeJson(rt, response);
	}

	@RequestMapping("/testCluster.do")
	public void testCluster(String redisUrl, String clusterServerUrl, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testCluster.do ***********************");

		Log.debug("testCluster() redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		String testResult = "1. 配置检查<br/>";
		boolean testSuccess = true;
		if(redisUrl == null || redisUrl.isEmpty())
		{
			testResult += "Redis服务器地址为空<br/>";
			testSuccess = false;
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}
		if(clusterServerUrl == null || clusterServerUrl.isEmpty())
		{
			testResult += "集群服务器地址为空<br/>";
			testSuccess = false;
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		testResult += "配置正常<br/><br/>";
		
		testResult += "2. Redis服务器测试<br/>";
		testResult += "2.1 连接服务器测试<br/>";

		//注册RedissonClient对象
		//TODO: redisUrl里可以支持传递高级参数(例如密码)，因此需要先解析再连接
		JSONObject redisConfig = parseRedisConfig(redisUrl);
		Config config = new Config();
		//config.useSingleServer().setAddress(redisUrl);
		SingleServerConfig singleServerConfig = config.useSingleServer();
		singleServerConfig.setAddress(redisConfig.getString("url"));
		String password = redisConfig.getString("password");
		if(password != null && password.isEmpty() == false)
		{
			singleServerConfig.setPassword(redisConfig.getString("password"));		
		}
		
		RedissonClient redissonClient = Redisson.create(config);
        testResult += "连接成功<br/><br/>";
		
        testResult += "2.2 Lock测试<br/>";
		//Get Lock
		Log.debug("testCluster() " + Thread.currentThread().getId() + " getLock(my-lock)");
		RLock lock = redissonClient.getLock("my-lock");
		Log.debug("testCluster() " + Thread.currentThread().getId() + " try to lock(my-lock)");
        lock.lock();
        testResult += "加锁成功<br/><br/>";
        
		testResult += "2.3 Map测试<br/>";
		boolean isSuccess = true;
        try {
            Log.debug("testCluster() " + Thread.currentThread().getId() + " 执行业务.... ");
            RMap<Object, Object> map = redissonClient.getMap("myFirstMap");
            JSONObject inputData = new JSONObject();
            inputData.put("key1", "Hello! I am " + Thread.currentThread().getId() + "");
            inputData.put("key2", "Hello! I am " + Thread.currentThread().getId() + "");
            map.put("product", inputData);
            
            JSONObject var = (JSONObject) map.get("product");
            Log.debug("testCluster() " + Thread.currentThread().getId() + " key1.value=" + var.getString("key1") + " key2.value=" + var.getString("key2"));            
        } catch (Exception e) {
        	isSuccess = false;
        	Log.info(e);
        } finally {
            //手动解锁
            Log.debug("testCluster() " + Thread.currentThread().getId() + " 解锁...");
            lock.unlock();
        }
        if(isSuccess)
        {
        	testResult += "Map测试成功<br/><br/>";
        }
        else
        {
        	testResult += "Map测试失败<br/><br/>";
			testSuccess = false;
        }
        
        testResult += "3. 集群服务器测试<br/>";
        if(clusterServerLoopbackTest(clusterServerUrl) == false)
        {
        	testResult += "3.1 回环测试失败<br/><br/>";
			testSuccess = false;
        }
        else
        {
        	testResult += "3.1 回环测试成功<br/><br/>";        	        	
        }
        
		//保证服务器之间能够互相访问，向已集群的服务器发送joinApply
		if(clusterServerCrossCheck(clusterServerUrl) == false)
        {
        	testResult += "3.2 互检测试失败<br/><br/>";        	
			testSuccess = false;
        }
        else
        {
        	testResult += "3.2 互检测试成功<br/><br/>";        	        	
        }
        
		if(testSuccess)
		{
			rt.setMsgInfo(testResult);			
		}
		else
		{
			rt.setError(testResult);
		}
		writeJson(rt, response);
	}
	
	@RequestMapping("/ldapTest.do")
	public void testLDAP(String ldapConfig, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** ldapTest.do ***********************");

		Log.debug("ldapTest() ldapConfig:" + ldapConfig);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}
		
		String testResult = "1. 配置解析<br/>";
		if(ldapConfig == null || ldapConfig.isEmpty())
		{
			testResult += "配置内容为空<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		
		SystemLDAPConfig systemLdapConfig = LDAPUtil.getSystemLdapConfig(ldapConfig);
		if(systemLdapConfig == null)
		{
			testResult += "解析失败:<br/>";
			testResult += ldapConfig + "<br/>";
			
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		systemLdapConfig.enabled = true;
		
		testResult += "解析成功:<br/>" ;
		testResult += JSON.toJSONString(systemLdapConfig) + "<br/><br/>";
		
		if(systemLdapConfig.ldapConfigList.isEmpty())
		{
			testResult += "配置错误<br/>";
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		
		testResult += "2. 登录测试<br/>";
		try 
		{
			String testUser = systemLdapConfig.ldapConfigList.get(0).settings.getString("testUser");
			String testUserPassword = systemLdapConfig.ldapConfigList.get(0).settings.getString("testUserPassword");
			Log.debug("ldapTest() testUser:" + testUser + " testUserPassword:" + testUserPassword);
			if(testUser == null || testUser.isEmpty())
			{
				testUser = "test";
			}
			testResult += "登录账号: " + testUser + "<br/>";
			testResult += "登录密码: " + testUserPassword + "<br/>";
				
			LdapLoginCheckResult checkResult = new LdapLoginCheckResult();
			User ldapLoginUser = LDAPUtil.ldapLoginCheck(testUser, testUserPassword, systemLdapConfig, checkResult);
			if(ldapLoginUser != null)
			{
				testResult += "登录测试成功<br/>";
			}
			else
			{
				switch(checkResult.status)
				{
				case LdapLoginCheckResult.PasswordError:
					testResult += "密码错误<br/>";
					break;
				case LdapLoginCheckResult.UserNotExist:
					testResult += "用户不存在<br/>";
					break;
				case LdapLoginCheckResult.DuplicatedUser:
					testResult += "系统存在重名用户<br/>";
					break;
				case LdapLoginCheckResult.DomainNotExist:
					testResult += "域名不存在<br/>";
					break;					
				default:
					testResult += "未知错误<br/>";
					break;
				}
			}
		}
		catch(Exception e)
		{
			Log.debug(e);
			testResult += "登录测试失败<br/>";
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			e.printStackTrace(new PrintStream(baos));			
			testResult += baos.toString();
		}

		rt.setMsgInfo(testResult);				
		writeJson(rt, response);
	}
	
	@RequestMapping("/llmTest.do")
	public void llmTest(String llmConfig, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** llmTest.do ***********************");
		
		Log.debug("llmTest() llmConfig:" + llmConfig);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}
		
		String testResult = "1. 配置解析<br/>";
		if(llmConfig == null || llmConfig.isEmpty())
		{
			testResult += "配置内容为空<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		
		SystemLLMConfig systemllmConfig = LLMUtil.getSystemLLMConfig(llmConfig);
		if(systemllmConfig == null)
		{
			testResult += "解析失败:<br/>";
			testResult += llmConfig + "<br/>";
			
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		systemllmConfig.enabled = true;
		
		testResult += "解析成功:<br/>" ;
		testResult += JSON.toJSONString(systemllmConfig) + "<br/><br/>";
		
		if(systemllmConfig.llmConfigList.isEmpty())
		{
			testResult += "配置错误<br/>";
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		
		testResult += "2. 访问测试<br/>";
		try 
		{			
			LLMAccessCheckResult checkResult = new LLMAccessCheckResult();
			boolean ret = LLMUtil.llmAccessCheck(systemllmConfig, checkResult);
			if(ret == true)
			{
				testResult += "AI大模型访问测试成功<br/>";
				testResult += checkResult.info;
			}
			else
			{
				testResult += "AI大模型访问测试失败:<br/>";
				testResult += checkResult.info + "<br/>";
			}
		}
		catch(Exception e)
		{
			Log.debug(e);
			testResult += "AI大模型访问测试失败<br/>";
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			e.printStackTrace(new PrintStream(baos));			
			testResult += baos.toString();
		}
		
		rt.setMsgInfo(testResult);				
		writeJson(rt, response);
	}

	@RequestMapping("/upgradeSystem.do")
	public void upgradeSystem(String name, Long size, String authCode, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** upgradeSystem.do ***********************");
		Log.debug("upgradeSystem() name:" + name + " size:" + size);
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}
		
		if(name == null || !name.startsWith("DocSystem"))
		{
			docSysErrorLog("非法文件名 " + name, rt);			
			writeJson(rt, response);			
			return;	
		}
		
		String upgradePath = docSysIniPath + "upgrade/";
		if(false == checkFileSizeAndCheckSum(upgradePath, name, size, null))
		{
			docSysErrorLog("文件校验失败", rt);
			writeJson(rt, response);
			return;
		}

		LongTermTask queryTask = createLongTermTask("upgradeSystem", "系统升级", rt);
		if(queryTask == null)
		{
			writeJson(rt, response);
			return;
		}

		queryTask.status = 0;  
		queryTask.info = "开始升级准备工作";
		Log.debug("upgradeSystem() " + queryTask.info);
		rt.setData(queryTask);
		writeJson(rt, response);

		//开始解压
		queryTask.status = 1;	//升级解压中
		queryTask.info = "安装包解压";
		Log.debug("upgradeSystem() " + queryTask.info);
		if(extractZipFile(upgradePath, name, upgradePath + "DocSystem-tmp/") == false)
		{
			Log.debug("upgradeSystem() 安装包解压失败");
			//docSysErrorLog("安装包解压失败", rt);
			queryTask.status = -1;
			queryTask.info = "安装包解压失败";	
			return;
		}
		queryTask.info = "安装包解压成功";	
		Log.debug("upgradeSystem() " + queryTask.info);
		
		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}

		//检查并处理解压后的升级包
		queryTask.status = 2;
		queryTask.info = "安装包检查";
		Log.debug("upgradeSystem() " + queryTask.info);
		File tmpDocSystem = new File(upgradePath + "DocSystem-tmp/");
		File[] subEntrys = tmpDocSystem.listFiles();
		if(subEntrys.length == 1)
		{
			Log.debug("upgradeSystem() subEntryName:" + subEntrys[0].getName());
			FileUtil.moveFileOrDir(upgradePath + "DocSystem-tmp/", subEntrys[0].getName(), upgradePath, "DocSystem", false);
		}
		else
		{
			FileUtil.moveFileOrDir(upgradePath, "DocSystem-tmp", upgradePath, "DocSystem", false);			
		}
		queryTask.info = "安装包检查完成";	
		Log.debug("upgradeSystem() " + queryTask.info);

		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}
		
		//解压成功，删除升级包
		FileUtil.delFile(upgradePath + name);	//删除压缩包
		
		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}
		
		//开始升级
		queryTask.status = 3;
		queryTask.info = "创建升级任务";
		Log.debug("upgradeSystem() " + queryTask.info);
		if(createMonitorTrigger("upgrade") == false)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务创建失败";	
			Log.debug("upgradeSystem() " + queryTask.info);
			return;
		}
		queryTask.info = "升级任务创建完成";
		Log.debug("upgradeSystem() " + queryTask.info);
				
		//monitor.sh会负责后续的升级工作
		queryTask.status = 200;	//这里用比较大的数字，是为了以后可能中间需要增加状态，参照网络的成功状态值
		queryTask.info = "准备工作已完成，等待升级";
		Log.debug("upgradeSystem() " + queryTask.info);
	}
	
	/**************** getSystemVersion ******************/
	@RequestMapping("/getSystemVersion.do")
	public void getSystemVersion(HttpServletResponse response)
	{
		ReturnAjax rt = new ReturnAjax();
		String version = FileUtil.readDocContentFromFile(docSysWebPath, "version");
		if(version == null)
		{
			version = "";
		}
		rt.setData(version);
		writeJson(rt, response);
	}

	/**************** queryLongTermTask ******************/
	@RequestMapping("/queryLongTermTask.do")
	public void queryLongTermTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryLongTermTask.do ****************");
		Log.info("queryLongTermTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		LongTermTask task = getLongTermTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("LongTermTask [" + taskId + "] 不存在");
			writeJson(rt, response);			
			return;
		}
		
		Log.debug("queryLongTermTask() status:" + task.status + " info:" + task.info);
		switch(task.status)
		{
		case 200:	//成功
			//延时删除下载压缩任务
			rt.setMsgInfo(task.info);
			addDelayTaskForLongTermTaskDelete(task.id, 120L);	//2分钟后删除
			break;
		case -1: 	//失败
			rt.setError(task.info);
			addDelayTaskForLongTermTaskDelete(task.id, 120L);	//2分钟后删除
			break;
		default:
			//任务未结束
			break;
		}

		rt.setData(task);
		writeJson(rt, response);			
	}
	
	/**************** stopLongTermTask ******************/
	@RequestMapping("/stopLongTermTask.do")
	public void stopLongTermTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** stopLongTermTask.do ****************");
		Log.info("stopLongTermTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		LongTermTask task = getLongTermTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("LongTermTask [" + taskId + "] 不存在");
			writeJson(rt, response);			
			return;
		}
		
		//Stop longTerm Task
		
		task.stopFlag = true;
		rt.setData(task);
		writeJson(rt, response);			
	}
	
	public void addDelayTaskForLongTermTaskDelete(String taskId, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForLongTermTaskDelete() delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForLongTermTaskDelete() delayTime:" + deleteDelayTime + " 秒后开始删除查询任务！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForLongTermTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** LongTermTaskDeleteDelayTask *****");
	                        longTermTaskHashMap.remove(taskId);
                        } catch(Exception e) {
	                		Log.info("******** LongTermTaskDeleteDelayTask 查询任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	private LongTermTask getLongTermTaskById(String taskId) {
		return longTermTaskHashMap.get(taskId);
	}
	
	@RequestMapping("/restartServer.do")
	public void restartServer(String authCode, String tomcatPath, String javaHome,
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** restartServer.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}		
		
		if(createMonitorTrigger("restart") == false)
		{
			Log.debug("restartServer() 创建重启任务失败");
			docSysErrorLog("重启任务创建失败!", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	/********** 获取用户列表 ***************/
	@RequestMapping("/getUserList.do")
	public void getUserList(String userName, Integer pageIndex, Integer pageSize, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getUserList.do ***********************");

		Log.debug("getUserList() searchWord:" + userName + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = adminAccessCheck(null, null, session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(userName != null && !userName.isEmpty())
		{
			user = new User();
			user.setName(userName);
			user.setRealName(userName);
			user.setNickName(userName);
			user.setEmail(userName);
			user.setTel(userName);
		}
		
		//List <User> UserList = userService.geAllUsers();
		QueryResult queryResult = new QueryResult();
		List <User> UserList = getUserListOnPage(user, pageIndex, pageSize, queryResult);
		
		//TODO: 获取用户可访问网络配置
		for(User tempUser : UserList)
		{
			tempUser.networkSettings = getUserNetworkSettings(tempUser.getId());
		}
		
		rt.setData(UserList);
		rt.setDataEx(queryResult.total);
		writeJson(rt, response);
	}
	

	@RequestMapping(value="addFirstAdminUser")
	public void addFirstAdminUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addFirstAdminUser.do ***********************");

		Log.debug("addFirstAdminUser");
		ReturnAjax rt = new ReturnAjax();
		
		//查询系统中是否存在超级管理员
		if(isFirstAdminUserExists() == true)
		{
			docSysErrorLog("系统管理员已存在!", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String name = user.getName();
		if(name == null || "".equals(name))
		{
			docSysErrorLog("用户名不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String pwd = user.getPwd();
		if(pwd == null || "".equals(pwd))
		{
			docSysErrorLog("密码不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(userCheck(user, true, true, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;			
		}
		
		user.setCreateType(UserCreateType_FirstUser);	//用户为首次添加
		user.setType(2); //系统管理员
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置创建时间

		if(userService.addUser(user) == 0)
		{
			docSysErrorLog("Failed to add new User in DB", rt);
			writeJson(rt, response);
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}

	@RequestMapping(value="addUser")
	public void addUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addUser.do ***********************");

		Log.debug("addUser");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}

		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String userName = user.getName();
		String pwd = user.getPwd();
		Integer type = user.getType();
		String tel = user.getTel();
		String email = user.getEmail();

		Log.debug("userName:"+userName + " pwd:"+pwd + " tel:" + tel + " email:" + email + "type:" + type);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			docSysErrorLog("danger#越权操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			docSysErrorLog("danger#账号不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(pwd == null || "".equals(pwd))
		{
			docSysErrorLog("密码不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(checkSystemUsersCount(rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		if(userCheck(user, true, true, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
				
		user.setCreateType(UserCreateType_ByAdmin);	//用户为管理员添加
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置川剧时间

		if(userService.addUser(user) == 0)
		{
			docSysErrorLog("Failed to add new User in DB", rt);
			writeJson(rt, response);

			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}

		addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		writeJson(rt, response);
		return;
	}

	@RequestMapping(value="editUser")
	public void editUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** editUser.do ***********************");

		Log.printObject("editUser inputUser:", user);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		Log.printObject("editUser login_user:", login_user);
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		Integer userId = user.getId();
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String userName = user.getName();
		Integer type = user.getType();
		String pwd = user.getPwd();
		
		Log.debug("userId:" + userId + " userName:"+userName + "type:" + type  + " pwd:" + pwd);
		
		//检查是否越权设置
		if(login_user.getType() < type)
		{
			docSysErrorLog("越权操作：您无权设置该用户等级！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//get userInfo
		User tempUser  = userService.getUser(userId);
		if(tempUser == null)
		{
			docSysErrorLog("用户不存在！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;	
		}
		
		//注意：两个Integer类型==是地址比较
		//但Integer把-128到127（可调）的整数都提前实例化了， 所以你不管创建多少个这个范围内的Integer都是同一个对象。
		//所以在数字大于127时用==会出现逻辑错误问题
		if(userId.equals(login_user.getId()) == false)
		{
			//不得修改同级别或高级别用户的信息
			if(login_user.getType() < tempUser.getType())
			{
				docSysErrorLog("越权操作：您无权修改高级别用户的设置！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
				return;			
			}

			if(login_user.getType().equals(tempUser.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以修改其他超级管理员信息
				{
					docSysErrorLog("越权操作：您无权修改同级别用户的设置！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
					return;
				}
			}
		}
		
		//检查用户名是否有改动
		if(user.getName() != null)
		{
			if(tempUser.getName() != null && user.getName().equals(tempUser.getName()))
			{
				user.setName(null);
			}
		}
			
		//检查Tel是否改动
		if(user.getTel() != null)
		{
			if(tempUser.getTel() != null && user.getTel().equals(tempUser.getTel()))
			{
				user.setTel(null);
			}
		}

		//检查Email是否改动
		if(user.getEmail() != null)
		{
			if(tempUser.getEmail() != null && user.getEmail().equals(tempUser.getEmail()))
			{
				user.setEmail(null);
			}
		}
		
		if(userEditCheck(user, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}
	
	@RequestMapping(value="resetPwd")
	public void resetPwd(User user, HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** resetPwd.do ***********************");

		Log.debug("resetPwd");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 2)
		{
			docSysErrorLog("您无权进行此操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		Integer userId = user.getId();
		String pwd = user.getPwd();
		
		Log.debug("userId:" +userId + " pwd:" + pwd);
	
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//不得修改同级别或高级别用户的密码
		if(!userId.equals(login_user.getId()))
		{
			User tempUser  = userService.getUser(userId);
			if(tempUser.getType() > login_user.getType())
			{
				docSysErrorLog("越权操作：您无权修改高级别用户的密码！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
				return;			
			}
			
			if(tempUser.getType().equals(login_user.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以重置其他超级管理员密码
				{
					docSysErrorLog("越权操作：您无权修改同级别用户的密码！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
					return;			
				}
			}
		}	
				
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}
	
	@RequestMapping(value="editUserNetworkSettings")
	public void editUserNetworkSettings(Integer userId, String userName, String networkSettings, HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** editUserNetworkSettings.do ***********************");
		
		Log.debug("editUserNetworkSettings");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 2)
		{
			docSysErrorLog("您无权进行此操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUserNetworkSettings", "editUserNetworkSettings", "修改用户网络设置", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		Log.debug("userId:" + userId + " userName:"+userName + " networkSettings:" + networkSettings);
		
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUserNetworkSettings", "editUserNetworkSettings", "修改用户网络设置", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}		
		
		if(updateUserNetworkSettings(userId, networkSettings) == false)
		{
			docSysErrorLog("更新配置失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUserNetworkSettings", "editUserNetworkSettings", "修改用户网络设置", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "editUserNetworkSettings", "editUserNetworkSettings", "修改用户网络设置", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}

	@RequestMapping(value="delUser")
	public void delUser(Integer userId, HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** delUser.do ***********************");

		Log.debug("delUser " + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(login_user.getType() < 2)
		{
			docSysErrorLog("您无权进行此操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;			
		}
		
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(!userId.equals(login_user.getId()))
		{
			//不得删除同级别或高级别用户
			User tempUser  = userService.getUser(userId);
			if(tempUser == null)
			{
				docSysErrorLog("用户不存在！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
				return;	
			}

			if(tempUser.getType() > login_user.getType())
			{
				docSysErrorLog("越权操作：您无权删除高级别用户！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
				return;			
			}
	
			if(tempUser.getType().equals(login_user.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以删除其他超级管理员
				{
					docSysErrorLog("越权操作：您无权删除同级别用户！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
					return;			
				}
			}		
		}
		
		if(userService.delUser(userId) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;		
		}
		
		//Delete all related ReposAuth \ DocAuth \GroupMember Infos
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(userId);
		reposService.deleteDocAuthSelective(docAuth);
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setUserId(userId);
		reposService.deleteReposAuthSelective(reposAuth);
		GroupMember groupMember = new GroupMember();
		groupMember.setUserId(userId);
		userService.deleteGroupMemberSelective(groupMember);
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	/********** 获取仓库列表 ***************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getReposList.do ***********************");

		Log.debug("getReposList()");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		List <Repos> list = getAllReposes();
		
		//Set isTextSearchEnabled and remoteStorageConfig which will be used for editRepos
		if(list != null)
		{
			for(int i=0; i<list.size(); i++)
			{
				Repos repos = list.get(i);
				repos = getReposEx(repos);
			}
		}
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Repos> getAllReposes() {
		List <Repos> list = userService.geAllReposes();
		return list;
	}
	
	/********** 获取系统所有用户 ：前台用于给repos添加访问用户，返回的结果实际上是reposMember列表***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(String searchWord, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getReposAllUsers.do ***********************");
		
		Log.debug("getReposAllUsers reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		
		User user = null;
		if(searchWord != null && !searchWord.isEmpty())
		{
			user = new User();
			user.setName(searchWord);
			user.setRealName(searchWord);
			user.setNickName(searchWord);
			user.setEmail(searchWord);
			user.setTel(searchWord);
		}
		
		List<ReposMember> UserList = null;
		if(user == null)
		{
			UserList = userService.getReposAllUsers(reposId);
		}
		else
		{
			HashMap<String, String> param = buildQueryParamForObj(user, null, null);
			param.put("reposId", reposId+"");
			UserList = userService.queryReposMemberWithParamLike(param);				
		}
		Log.printObject("UserList:",UserList);
				
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	/********** 获取用户组列表 ***************/
	@RequestMapping("/getGroupList.do")
	public void getGroupList(String userName, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getGroupList.do ***********************");
		
		Log.debug("getGroupList() userName:" + userName);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//获取All Groups		
		List <UserGroup> GroupList = null;
		if(userName == null || userName.isEmpty())
		{
			GroupList = getAllGroups();
		}
		else
		{
			//由于groupMember里的用户名可以是空的，所以要用userId来查询
			User qUser = new User();
			qUser.setName(userName);
			List <User> UserList = userService.getUserListByUserInfo(qUser);
			if(UserList != null && UserList.size() > 0)
			{
				//根据UserId获取所有goupMember, 根据groupId来确定所在的组Ids
				HashMap<Integer, Integer> userGroups = new HashMap<Integer, Integer>();
				GroupMember groupMember = new GroupMember();
				groupMember.setUserId(UserList.get(0).getId());
				List<GroupMember> list = userService.getGroupMemberListByGroupMemberInfo(groupMember);
				if(list != null && list.size() > 0)
				{
					//构建用户所在的所有组Map
					for(GroupMember Member: list)
					{
						userGroups.put(Member.getGroupId(), Member.getGroupId());
						Log.debug("user:" + userName + " was in group:" +  Member.getGroupId());
					}
				
					//遍历allGroups，如果group在userGroups中，加入列表
					GroupList = new ArrayList<UserGroup>();
					List <UserGroup> allGroups = getAllGroups();
					for(UserGroup group : allGroups)
					{
						if(userGroups.get(group.getId()) != null)
						{
							Log.debug("add groupId:" + group.getId() + " groupName:" + group.getName() + " to list");						
							GroupList.add(group);
						}
					}
				}
			}
		}		
		rt.setData(GroupList);
		writeJson(rt, response);
	}

	private List<UserGroup> getAllGroups() {
		List <UserGroup> GroupList = userService.geAllGroups();
		return GroupList;
	}
	
	@RequestMapping(value="addGroup")
	public void addGroup(UserGroup group, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addGroup.do ***********************");

		Log.debug("addGroup");
		String name = group.getName();
		String info = group.getInfo();
		
		Log.debug("name:"+name + " info:"+info);
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查用户名是否为空
		if(name ==null||"".equals(name))
		{
			docSysErrorLog("组名不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(isGroupExist(name) == true)
		{
			docSysErrorLog("用户组 " + name + " 已存在！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
	
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		group.setCreateTime(createTime);	//设置川剧时间

		if(userService.addGroup(group) == 0)
		{
			docSysErrorLog("Failed to add new Group in DB", rt);
			writeJson(rt, response);

			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}

		addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		writeJson(rt, response);
		return;
	}

	private boolean isGroupExist(String name) {
		UserGroup qGroup = new UserGroup();
		//检查用户名是否为空
		if(name==null||"".equals(name))
		{
			return true;
		}
			
		qGroup.setName(name);
		List<UserGroup> list = userService.getGroupListByGroupInfo(qGroup);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroup")
	public void delGroup(Integer id, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** delGroup.do ***********************");

		Log.debug("delGroup " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.delGroup(id) == 0)
		{
			docSysErrorLog("Failed to delete Group from DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;		
		}
		
		//Delete all related ReposAuth \ DocAuth \GroupMember Infos
		DocAuth docAuth = new DocAuth();
		docAuth.setGroupId(id);
		reposService.deleteDocAuthSelective(docAuth);
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setGroupId(id);
		reposService.deleteReposAuthSelective(reposAuth);
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(id);
		userService.deleteGroupMemberSelective(groupMember);
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	@RequestMapping(value="editGroup")
	public void editGroup(UserGroup group, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** editGroup.do ***********************");

		Log.debug("editGroup");

		Integer groupId = group.getId();
		String name = group.getName();
		String info = group.getInfo();

		Log.debug("name:"+name + " info:"+info);
	
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(groupId == null)
		{
			docSysErrorLog("用户组ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.editGroup(group) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;
	}
	
	/********** 获取系统所有用户 ：前台用于给group添加访问用户，返回的结果实际上是groupMember列表***************/
	@RequestMapping("/getGroupAllUsers.do")
	public void getGroupAllUsers(String searchWord, Integer groupId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getGroupAllUsers.do ***********************");

		Log.debug("getGroupAllUsers searchWord:" + searchWord + " groupId: " + groupId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(searchWord != null && !searchWord.isEmpty())
		{
			user = new User();
			user.setName(searchWord);
			user.setRealName(searchWord);
			user.setNickName(searchWord);
			user.setEmail(searchWord);
			user.setTel(searchWord);
		}
		
		List <GroupMember> UserList = null;
		if(user == null)
		{
			UserList = userService.getGroupAllUsers(groupId);	
		}
		else
		{
			HashMap<String, String> param = buildQueryParamForObj(user, null, null);
			param.put("groupId",groupId+"");
			UserList = userService.queryGroupMemberWithParamLike(param);				
		}
		Log.printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	@RequestMapping(value="addGroupMember")
	public void addGroupMember(Integer groupId,Integer userId, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addGroupMember.do ***********************");

		Log.debug("addGroupMember groupId:" + groupId + " userId:" + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查GroupId是否为空
		if(groupId == null)
		{
			docSysErrorLog("组ID不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查用户ID是否为空
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(groupId);
		groupMember.setUserId(userId);
		
		if(isGroupMemberExist(groupMember) == true)
		{
			Log.debug("addGroupMember() 用户 " + userId + " 已是该组成员！");
			docSysErrorLog("用户 " + userId + " 已是该组成员！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
	
		if(userService.addGroupMember(groupMember) == 0)
		{
			Log.debug("addGroupMember() Failed to add groupMember");
			docSysErrorLog("Failed to add new GroupMember in DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;
	}

	private boolean isGroupMemberExist(GroupMember groupMember) {
		List<GroupMember> list = userService.getGroupMemberListByGroupMemberInfo(groupMember);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroupMember")
	public void delGroupMember(Integer id, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("delGroupMember " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.delGroupMember(id) == 0)
		{
			docSysErrorLog("Failed to delete GroupMember from DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	@RequestMapping(value="getSystemLog")
	public void getSystemLog(String fileName,HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{

		Log.infoHead("****************** getSystemLog.do ***********************");

		Log.debug("getSystemLog: " + fileName);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		String localParentPath = Path.getSystemLogParentPath(docSysWebPath);
		if(localParentPath == null)
		{
			docSysErrorLog("获取日志路径失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(fileName == null || "".equals(fileName))
		{
			fileName = Path.getSystemLogFileName();
		}
		
		sendTargetToWebPage(localParentPath,fileName, localParentPath, rt, response, request, false, null);
		return;		
	}
	
	@RequestMapping(value="downloadLogFile")
	public void downloadLogFile(String key, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{

		Log.infoHead("****************** downloadLogFile.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//key 为空 = 原来的「调试日志」；其它取值只能命中白名单，不接受任意路径
		File file = resolveLogFile(key);
		if(file == null || file.exists() == false)
		{
			docSysErrorLog("日志文件不存在！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
		String[] temp = new String[2]; 
		if(Path.seperatePathAndName(file.getAbsolutePath(), temp) < 0)
		{
			docSysErrorLog("日志文件路径错误:" + file.getAbsolutePath(), rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;										
		}
		String path = Path.localDirPathFormat(temp[0], OSType);
		String name = temp[1];	
		
		Log.debug("downloadLogFile() path:" + path + " name:" + name);		
		Doc downloadDoc = buildDownloadDocInfo(0, "","", path, name, 0);
		downloadDoc.encryptEn = 0;
		
		String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;
		rt.setData(downloadLink);
		writeJson(rt, response);			
		addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	//cleanLogFile
	@RequestMapping("/cleanLogFile.do")
	public void cleanLogFile(String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response){
		Log.infoHead("*********** cleanLogFile *******************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		String logFilePath = Log.logFile;
		if(logFilePath == null || logFilePath.isEmpty())
		{
			logFilePath = defaultLogFilePath;
		}
		
		File file = new File(logFilePath);
		if(file.exists() == false)
		{
			docSysErrorLog("日志文件 "  + logFilePath + " 不存在！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
		if(FileUtil.delFile(logFilePath) == false)
		{
			docSysErrorLog("日志清除失败，请稍候重试！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
        writeJson(rt, response);		
		addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
	}

	/****************  调试日志在线查看  ******************/
	private static final String LOG_KEY_DEBUG = "debug";
	private static final String LOG_KEY_CONSOLE = "console";
	private static final String LOG_KEY_CATALINA_PREFIX = "catalina:";
	private static final String CATALINA_LOG_NAME_PREFIX = "catalina.";
	private static final String CATALINA_LOG_NAME_SUFFIX = ".log";
	private static final int CATALINA_LOG_LIST_MAX = 10;

	/** 日志源条目（白名单）：前端只能按 key 取，不能传路径 */
	private static class LogSource {
		public String key;
		public String label;
		public File file;
	}

	/** Tomcat 日志目录：<catalina.base|home>/logs */
	private static File getTomcatLogDir() {
		String base = System.getProperty("catalina.base");
		if(base == null || base.isEmpty()) {
			base = System.getProperty("catalina.home");
		}
		if(base == null || base.isEmpty()) {
			return null;
		}
		File dir = new File(base, "logs");
		return dir.isDirectory() ? dir : null;
	}

	/**
	 * 允许在线查看的日志源白名单：
	 * <ul>
	 *   <li>{@code debug} —— 调试日志，路径口径与「下载」完全一致（{@code Log.logFile} 回落 {@code defaultLogFilePath}）；</li>
	 *   <li>{@code console} —— {@code <catalina.home>/logs/docsys_console.log}（启动脚本的控制台重定向）；</li>
	 *   <li>{@code catalina:yyyy-MM-dd} —— {@code <catalina.home>/logs/catalina.<日期>.log}（只列文件名严格匹配的，最多 {@value #CATALINA_LOG_LIST_MAX} 个）。</li>
	 * </ul>
	 * 因为解析只走这张表，所以不存在"前端传路径读取任意文件"的风险。
	 */
	protected List<LogSource> getLogSourceList() {
		List<LogSource> list = new ArrayList<LogSource>();

		String debugLogPath = Log.logFile;
		if(debugLogPath == null || debugLogPath.isEmpty()) {
			debugLogPath = defaultLogFilePath;
		}
		if(debugLogPath != null && !debugLogPath.isEmpty()) {
			LogSource s = new LogSource();
			s.key = LOG_KEY_DEBUG;
			s.file = new File(debugLogPath);
			s.label = s.file.getName();
			list.add(s);
		}

		File logDir = getTomcatLogDir();
		if(logDir != null) {
			LogSource console = new LogSource();
			console.key = LOG_KEY_CONSOLE;
			console.file = new File(logDir, "docsys_console.log");
			console.label = console.file.getName();
			list.add(console);

			File[] files = logDir.listFiles();
			if(files != null) {
				List<String> catalinaNames = new ArrayList<String>();
				for(File f : files) {
					String name = f.getName();
					if(name.startsWith(CATALINA_LOG_NAME_PREFIX) && name.endsWith(CATALINA_LOG_NAME_SUFFIX) && f.length() > 0) {
						catalinaNames.add(name);
					}
				}
				Collections.sort(catalinaNames);		//文件名带日期，字典序即时间序
				Collections.reverse(catalinaNames);		//最新的在前
				for(int i = 0; i < catalinaNames.size() && i < CATALINA_LOG_LIST_MAX; i++) {
					String name = catalinaNames.get(i);
					LogSource s = new LogSource();
					s.key = LOG_KEY_CATALINA_PREFIX
							+ name.substring(CATALINA_LOG_NAME_PREFIX.length(), name.length() - CATALINA_LOG_NAME_SUFFIX.length());
					s.file = new File(logDir, name);
					s.label = name;
					list.add(s);
				}
			}
		}
		return list;
	}

	/** 按 key 在白名单里找日志源；key 为空视作「调试日志」 */
	private LogSource findLogSource(String key) {
		if(key == null || key.isEmpty()) {
			key = LOG_KEY_DEBUG;
		}
		for(LogSource s : getLogSourceList()) {
			if(s.key.equals(key)) {
				return s;
			}
		}
		return null;
	}

	/** 解析日志文件：key 命中白名单用白名单文件；找不到返回 null */
	private File resolveLogFile(String key) {
		LogSource s = findLogSource(key);
		return (s == null) ? null : s.file;
	}

	//日志源列表（在线查看页面左上角下拉）
	@RequestMapping("/getLogSources.do")
	public void getLogSources(HttpSession session, HttpServletRequest request, HttpServletResponse response) {
		Log.infoHead("*********** getLogSources *******************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null) {
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);
			return;
		}
		if(login_user.getType() < 1) {
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);
			return;
		}

		List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();
		for(LogSource s : getLogSourceList()) {
			boolean exists = (s.file != null && s.file.isFile());
			Map<String, Object> item = new HashMap<String, Object>();
			item.put("key", s.key);
			item.put("label", s.label);
			item.put("exists", Boolean.valueOf(exists));
			item.put("size", Long.valueOf(exists ? s.file.length() : 0));
			item.put("lastModified", Long.valueOf(exists ? s.file.lastModified() : 0));
			data.add(item);
		}
		rt.setData(data);
		writeJson(rt, response);
	}

	//日志内容（按字节窗口读取，窗口两端对齐到整行；key 必须命中白名单）
	//注意：该接口会被页面「自动刷新」每几秒调一次，因此**不写系统日志、不写调试日志**，否则会自我污染正在查看的日志
	@RequestMapping("/getLogContent.do")
	public void getLogContent(String key, Long offset, Long endOffset, Integer maxBytes, String encoding,
			HttpSession session, HttpServletRequest request, HttpServletResponse response) {
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null) {
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);
			return;
		}
		if(login_user.getType() < 1) {
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);
			return;
		}

		LogSource source = findLogSource(key);
		if(source == null || source.file == null || source.file.isFile() == false) {
			docSysErrorLog("日志文件不存在或不允许查看！", rt);
			writeJson(rt, response);
			return;
		}

		try {
			long off = (offset == null) ? -1L : offset.longValue();
			LogFileUtil.LogWindow win = LogFileUtil.read(source.file, off, endOffset,
					maxBytes, LogFileUtil.charsetOf(encoding));

			Map<String, Object> data = new HashMap<String, Object>();
			data.put("key", source.key);
			data.put("filePath", source.file.getAbsolutePath());
			data.put("fileSize", Long.valueOf(source.file.length()));
			data.put("lastModified", Long.valueOf(source.file.lastModified()));
			data.put("startOffset", Long.valueOf(win.startOffset));
			data.put("endOffset", Long.valueOf(win.endOffset));
			data.put("hasMoreBefore", Boolean.valueOf(win.hasMoreBefore));
			data.put("longLine", Boolean.valueOf(win.longLine));
			data.put("content", win.content);
			rt.setData(data);
		} catch (Exception e) {
			docSysErrorLog("读取日志失败！", rt);
			errorLog("getLogContent() 异常");
			errorLog(e);
		}
		writeJson(rt, response);
	}

	//系统日志列表查询（支持时间范围、搜索、分页）
	@RequestMapping("/getSystemLogList.do")
	public void getSystemLogList(
			Long startTime, Long endTime,
			String searchWord,
			Integer pageIndex, Integer pageSize,
			String authCode,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("*********** getSystemLogList *******************");
		Log.info("getSystemLogList startTime:" + startTime + " endTime:" + endTime
				+ " searchWord:" + searchWord + " pageIndex:" + pageIndex + " pageSize:" + pageSize);

		ReturnAjax rt = new ReturnAjax();

		User accessUser = userAccessCheck(authCode, null, session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);
			return;
		}

		if(startTime == null || endTime == null)
		{
			docSysErrorLog("startTime and endTime must not be null", rt);
			writeJson(rt, response);
			return;
		}

		List<SystemLog> allLogs = querySystemLogsByTimeRange(startTime, endTime);
		Log.info("getSystemLogList total logs fetched: " + (allLogs != null ? allLogs.size() : 0));

		//搜索过滤
		List<SystemLog> filteredList = new ArrayList<SystemLog>();
		if(allLogs != null)
		{
			for(SystemLog log : allLogs)
			{
				if(searchWord != null && !searchWord.isEmpty())
				{
					boolean matched = false;
					if(log.userName != null && log.userName.contains(searchWord)) matched = true;
					else if(log.action != null && log.action.contains(searchWord)) matched = true;
					else if(log.content != null && log.content.contains(searchWord)) matched = true;
					else if(log.event != null && log.event.contains(searchWord)) matched = true;
					if(!matched) continue;
				}
				filteredList.add(log);
			}
		}

		//分页
		int total = filteredList.size();
		int pIndex = (pageIndex != null) ? pageIndex : 0;
		int pSize = (pageSize != null && pageSize > 0) ? pageSize : 20;
		int fromIndex = pIndex * pSize;
		int toIndex = Math.min(fromIndex + pSize, total);

		List<SystemLog> pageList = new ArrayList<SystemLog>();
		if(fromIndex < total)
		{
			pageList = new ArrayList<SystemLog>(filteredList.subList(fromIndex, toIndex));
		}

		rt.setData(pageList);
		rt.setDataEx(total);
		writeJson(rt, response);
	}


}
