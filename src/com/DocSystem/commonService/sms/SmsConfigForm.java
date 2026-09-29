package com.DocSystem.commonService.sms;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理后台「短信服务」表单 ⇄ {@link SmsConfig} 的绑定。
 *
 * <p>刻意做成**纯函数**（只吃 {@code Map<String,String>}，不碰 Spring / Servlet）：把
 * 「页面字段名 ↔ 配置模型」的映射集中在一处，既能脱网验证，也免得控制器里散落一堆
 * {@code request.getParameter}。
 *
 * <p>约定：
 * <ul>
 *   <li><b>布尔项</b>（{@code enabled}）：{@code true/on/1/yes} 为真，其余（含字段缺省）为假
 *       —— HTML 未勾选的 checkbox 不会提交字段，所以「缺省 = 关闭」正是想要的语义；</li>
 *   <li><b>场景模板</b>：{@code tplIdXxx} 与 {@code varsXxx} **任一非空**才写入该场景
 *       （整行留空 = 该场景不配置）；填了就必须填模板 ID，由
 *       {@link com.DocSystem.service.sms.SmsConfigStore#validate} 拦截；</li>
 *   <li><b>固定参数</b> {@code customParams}：{@code k=v} 文本，按行或 {@code &} 分隔
 *       （空值/空行忽略）；</li>
 *   <li>未填写的字段统一归一为**空串**（与方案 §2.1「未填写的运营商字段存空串」一致）；</li>
 *   <li>旧字段 {@code server/apikey/tplid} **不在这里处理** —— 由控制器按「首次迁移同款规则」
 *       解析（见 {@code SmsConfigStore.buildSeedEntries}），保证老前端仍可用。</li>
 * </ul>
 */
public final class SmsConfigForm {

	// ===================== 表单字段名 =====================

	public static final String P_ENABLED = "enabled";
	public static final String P_PROVIDER = "provider";
	public static final String P_SIGN_NAME = "signName";

	public static final String P_YUNPIAN_APIKEY = "yunpianApikey";
	public static final String P_YUNPIAN_ENDPOINT = "yunpianEndpoint";

	public static final String P_ALIYUN_ACCESS_KEY_ID = "aliyunAccessKeyId";
	public static final String P_ALIYUN_ACCESS_KEY_SECRET = "aliyunAccessKeySecret";
	public static final String P_ALIYUN_REGION_ID = "aliyunRegionId";
	public static final String P_ALIYUN_ENDPOINT = "aliyunEndpoint";

	public static final String P_TENCENT_SECRET_ID = "tencentSecretId";
	public static final String P_TENCENT_SECRET_KEY = "tencentSecretKey";
	public static final String P_TENCENT_SDK_APP_ID = "tencentSdkAppId";
	public static final String P_TENCENT_REGION = "tencentRegion";
	public static final String P_TENCENT_ENDPOINT = "tencentEndpoint";

	public static final String P_CUSTOM_URL = "customUrl";
	public static final String P_CUSTOM_METHOD = "customMethod";
	public static final String P_CUSTOM_PARAM_PHONE = "customParamPhone";
	public static final String P_CUSTOM_PARAM_TPL_ID = "customParamTplId";
	public static final String P_CUSTOM_PARAM_TPL_VARS = "customParamTplVars";
	public static final String P_CUSTOM_SUCCESS_FIELD = "customSuccessField";
	public static final String P_CUSTOM_SUCCESS_VALUE = "customSuccessValue";
	public static final String P_CUSTOM_PARAMS = "customParams";

	public static final String P_TPL_ID_REGISTER = "tplIdRegister";
	public static final String P_VARS_REGISTER = "varsRegister";
	public static final String P_TPL_ID_RESET_PWD = "tplIdResetPwd";
	public static final String P_VARS_RESET_PWD = "varsResetPwd";
	public static final String P_TPL_ID_PHONE_VERIFY = "tplIdPhoneVerify";
	public static final String P_VARS_PHONE_VERIFY = "varsPhoneVerify";
	public static final String P_TPL_ID_TEST = "tplIdTest";
	public static final String P_VARS_TEST = "varsTest";

	public static final String P_TIMEOUT_MS = "timeoutMs";
	public static final String P_RETRY = "retry";
	public static final String P_CODE_LENGTH = "codeLength";
	public static final String P_CODE_TTL_MINUTES = "codeTtlMinutes";

	/** 本表单认识的全部字段（用于判断「请求里到底有没有带短信表单」） */
	private static final String[] FORM_FIELDS = {
			P_ENABLED, P_PROVIDER, P_SIGN_NAME,
			P_YUNPIAN_APIKEY, P_YUNPIAN_ENDPOINT,
			P_ALIYUN_ACCESS_KEY_ID, P_ALIYUN_ACCESS_KEY_SECRET, P_ALIYUN_REGION_ID, P_ALIYUN_ENDPOINT,
			P_TENCENT_SECRET_ID, P_TENCENT_SECRET_KEY, P_TENCENT_SDK_APP_ID, P_TENCENT_REGION, P_TENCENT_ENDPOINT,
			P_CUSTOM_URL, P_CUSTOM_METHOD, P_CUSTOM_PARAM_PHONE, P_CUSTOM_PARAM_TPL_ID, P_CUSTOM_PARAM_TPL_VARS,
			P_CUSTOM_SUCCESS_FIELD, P_CUSTOM_SUCCESS_VALUE, P_CUSTOM_PARAMS,
			P_TPL_ID_REGISTER, P_VARS_REGISTER, P_TPL_ID_RESET_PWD, P_VARS_RESET_PWD,
			P_TPL_ID_PHONE_VERIFY, P_VARS_PHONE_VERIFY, P_TPL_ID_TEST, P_VARS_TEST,
			P_TIMEOUT_MS, P_RETRY, P_CODE_LENGTH, P_CODE_TTL_MINUTES
	};

	/** 请求里是否带了本表单的字段（一个都没有 → 调用方应改用已保存配置或走旧参数兼容） */
	public static boolean hasFormFields(Map<String, String> params) {
		if (params == null) {
			return false;
		}
		for (String field : FORM_FIELDS) {
			if (params.get(field) != null) {
				return true;
			}
		}
		return false;
	}

	/** 表单参数 → 配置对象（缺项留空，不继承任何旧值） */
	public static SmsConfig bind(Map<String, String> params) {
		Map<String, String> form = (params == null) ? new LinkedHashMap<String, String>() : params;

		SmsConfig config = new SmsConfig();
		config.setEnabled(parseBoolean(form.get(P_ENABLED)));
		config.setProvider(nullToEmpty(form.get(P_PROVIDER)));
		config.setSignName(nullToEmpty(form.get(P_SIGN_NAME)));

		SmsYunpianConfig yunpian = new SmsYunpianConfig();
		yunpian.setApikey(nullToEmpty(form.get(P_YUNPIAN_APIKEY)));
		yunpian.setEndpoint(nullToEmpty(form.get(P_YUNPIAN_ENDPOINT)));
		config.setYunpian(yunpian);

		SmsAliyunConfig aliyun = new SmsAliyunConfig();
		aliyun.setAccessKeyId(nullToEmpty(form.get(P_ALIYUN_ACCESS_KEY_ID)));
		aliyun.setAccessKeySecret(nullToEmpty(form.get(P_ALIYUN_ACCESS_KEY_SECRET)));
		aliyun.setRegionId(nullToEmpty(form.get(P_ALIYUN_REGION_ID)));
		aliyun.setEndpoint(nullToEmpty(form.get(P_ALIYUN_ENDPOINT)));
		config.setAliyun(aliyun);

		SmsTencentConfig tencent = new SmsTencentConfig();
		tencent.setSecretId(nullToEmpty(form.get(P_TENCENT_SECRET_ID)));
		tencent.setSecretKey(nullToEmpty(form.get(P_TENCENT_SECRET_KEY)));
		tencent.setSdkAppId(nullToEmpty(form.get(P_TENCENT_SDK_APP_ID)));
		tencent.setRegion(nullToEmpty(form.get(P_TENCENT_REGION)));
		tencent.setEndpoint(nullToEmpty(form.get(P_TENCENT_ENDPOINT)));
		config.setTencent(tencent);

		SmsCustomConfig custom = new SmsCustomConfig();
		custom.setUrl(nullToEmpty(form.get(P_CUSTOM_URL)));
		custom.setMethod(nullToEmpty(form.get(P_CUSTOM_METHOD)));
		custom.setSuccessField(nullToEmpty(form.get(P_CUSTOM_SUCCESS_FIELD)));
		custom.setSuccessValue(nullToEmpty(form.get(P_CUSTOM_SUCCESS_VALUE)));
		Map<String, String> paramNames = new LinkedHashMap<String, String>();
		putIfNotEmpty(paramNames, "phone", form.get(P_CUSTOM_PARAM_PHONE));
		putIfNotEmpty(paramNames, "tplId", form.get(P_CUSTOM_PARAM_TPL_ID));
		putIfNotEmpty(paramNames, "tplVars", form.get(P_CUSTOM_PARAM_TPL_VARS));
		custom.setParamNames(paramNames);
		custom.setParams(parseParamPairs(form.get(P_CUSTOM_PARAMS)));
		config.setCustom(custom);

		Map<String, SmsTemplateConfig> scenes = new LinkedHashMap<String, SmsTemplateConfig>();
		putScene(scenes, SmsScene.REGISTER, form.get(P_TPL_ID_REGISTER), form.get(P_VARS_REGISTER));
		putScene(scenes, SmsScene.RESET_PWD, form.get(P_TPL_ID_RESET_PWD), form.get(P_VARS_RESET_PWD));
		putScene(scenes, SmsScene.PHONE_VERIFY, form.get(P_TPL_ID_PHONE_VERIFY), form.get(P_VARS_PHONE_VERIFY));
		putScene(scenes, SmsScene.TEST, form.get(P_TPL_ID_TEST), form.get(P_VARS_TEST));
		config.setScenes(scenes);

		SmsOptions options = new SmsOptions();
		options.setTimeoutMs(parseInt(form.get(P_TIMEOUT_MS), options.getTimeoutMs()));
		options.setRetry(parseInt(form.get(P_RETRY), options.getRetry()));
		options.setCodeLength(parseInt(form.get(P_CODE_LENGTH), options.getCodeLength()));
		options.setCodeTtlMinutes(parseInt(form.get(P_CODE_TTL_MINUTES), options.getCodeTtlMinutes()));
		config.setOptions(options);

		return config;
	}

	/**
	 * 固定参数表 → {@code "k=v"} 文本（换行分隔），供页面回显。
	 * 与 {@link #parseParamPairs(String)} 互为逆运算。
	 */
	public static String formatParamPairs(Map<String, String> params) {
		if (params == null || params.isEmpty()) {
			return "";
		}
		StringBuilder sb = new StringBuilder();
		for (Map.Entry<String, String> param : params.entrySet()) {
			if (sb.length() > 0) {
				sb.append("\n");
			}
			sb.append(param.getKey()).append("=").append(param.getValue() == null ? "" : param.getValue());
		}
		return sb.toString();
	}

	/** 变量名文本（逗号 / 分号 / 空白分隔）→ 有序列表（空 → 空表） */
	public static List<String> parseVars(String text) {
		List<String> vars = new java.util.ArrayList<String>();
		if (text == null) {
			return vars;
		}
		for (String part : text.split("[,;\\s]+")) {
			String value = part.trim();
			if (!value.isEmpty() && !vars.contains(value)) {
				vars.add(value);
			}
		}
		return vars;
	}

	/** 固定参数文本（换行或 {@code &} 分隔的 {@code k=v}）→ 有序 Map（忽略空行与无 {@code =} 的行） */
	public static Map<String, String> parseParamPairs(String text) {
		Map<String, String> params = new LinkedHashMap<String, String>();
		if (text == null) {
			return params;
		}
		for (String line : text.split("[\\r\\n&]+")) {
			String pair = line.trim();
			if (pair.isEmpty()) {
				continue;
			}
			int index = pair.indexOf('=');
			if (index <= 0) {
				// 没写 "=" 的行按「参数名 + 空值」看待，比静默丢弃更容易被发现
				params.put(pair, "");
				continue;
			}
			params.put(pair.substring(0, index).trim(), pair.substring(index + 1).trim());
		}
		return params;
	}

	// ===================== 内部工具 =====================

	private static void putScene(Map<String, SmsTemplateConfig> scenes, SmsScene scene, String tplId, String varsText) {
		boolean hasTplId = !isBlank(tplId);
		boolean hasVars = !isBlank(varsText);
		if (hasTplId == false && hasVars == false) {
			return;	// 整行留空 → 该场景不配置
		}
		SmsTemplateConfig template = new SmsTemplateConfig();
		template.setTplId(nullToEmpty(tplId));
		template.setVars(parseVars(varsText));
		scenes.put(scene.getCode(), template);
	}

	private static void putIfNotEmpty(Map<String, String> map, String key, String value) {
		if (!isBlank(value)) {
			map.put(key, value.trim());
		}
	}

	private static boolean parseBoolean(String value) {
		if (value == null) {
			return false;
		}
		String trimmed = value.trim().toLowerCase();
		return "true".equals(trimmed) || "on".equals(trimmed) || "1".equals(trimmed) || "yes".equals(trimmed);
	}

	private static int parseInt(String value, int defaultValue) {
		if (isBlank(value)) {
			return defaultValue;
		}
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return defaultValue;
		}
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value.trim();
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private SmsConfigForm() {
	}
}
