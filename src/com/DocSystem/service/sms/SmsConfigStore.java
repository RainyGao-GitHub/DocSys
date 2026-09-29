package com.DocSystem.service.sms;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.Log;
import com.DocSystem.commonService.sms.SmsAliyunConfig;
import com.DocSystem.commonService.sms.SmsConfig;
import com.DocSystem.commonService.sms.SmsCustomConfig;
import com.DocSystem.commonService.sms.SmsOptions;
import com.DocSystem.commonService.sms.SmsProviderType;
import com.DocSystem.commonService.sms.SmsScene;
import com.DocSystem.commonService.sms.SmsTemplateConfig;
import com.DocSystem.commonService.sms.SmsTencentConfig;
import com.DocSystem.commonService.sms.SmsYunpianConfig;
import com.DocSystem.service.SystemSettingService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.TypeReference;
import util.ReadProperties;

/**
 * 短信配置存储/装配层 —— 配置以 {@code system_setting} 表为**唯一权威源**。
 *
 * <p>取值链（方案文档 §4.1）：
 * <pre>
 *   system_setting 表（sms.*）
 *     → 表内还没有任何 sms.* 行时：用 docSysConfig.properties 旧值（in-memory 兜底）
 *       → 最后：硬编码兜底（决策 7，仅用于表与 properties 都没有该值时）
 * </pre>
 *
 * <p>首次启用时的种子迁移在 {@link #ensureSeeded()}：仅在表内没有 sms.* 行时执行一次，
 * 由 {@code docSysInit()} 成功路径的建表钩子调用（幂等、失败不影响启动）。
 *
 * <p>类放在 {@code com.DocSystem.service} 的子包下：该包由 root 容器扫描
 * （spring-mybatis.xml），因此 {@code docSysInit} 钩子可通过 ContextLoader 取到本 bean
 * （与 {@code SystemSettingInitializer} / {@code AgentInitService} 同一套路）。
 */
@Component
public class SmsConfigStore {

	// ================= 配置表 key（点分命名空间） =================

	public static final String KEY_ENABLED = "sms.enabled";
	public static final String KEY_PROVIDER = "sms.provider";
	public static final String KEY_SIGN_NAME = "sms.signName";
	public static final String KEY_SCENES = "sms.scenes";
	public static final String KEY_YUNPIAN = "sms.yunpian";
	public static final String KEY_ALIYUN = "sms.aliyun";
	public static final String KEY_TENCENT = "sms.tencent";
	public static final String KEY_CUSTOM = "sms.custom";
	public static final String KEY_OPTIONS = "sms.options";

	/** 全部短信配置 key（保存时逐个写；读取时逐个取） */
	public static final String[] ALL_KEYS = {
			KEY_ENABLED, KEY_PROVIDER, KEY_SIGN_NAME, KEY_SCENES,
			KEY_YUNPIAN, KEY_ALIYUN, KEY_TENCENT, KEY_CUSTOM, KEY_OPTIONS
	};

	/** 判定「表中是否已有短信配置」的前缀 */
	public static final String KEY_PREFIX = "sms.";

	// ================= 存量 properties（种子来源） =================

	private static final String CONFIG_FILE = "docSysConfig.properties";

	public static final String LEGACY_KEY_SERVER = "smsServer";
	public static final String LEGACY_KEY_APIKEY = "smsApikey";
	public static final String LEGACY_KEY_TPLID = "smsTplid";

	// ================= 硬编码兜底（决策 7：保留） =================

	/**
	 * 兜底 apikey：仅当「表内没有该字段」且「老 properties 也没有」时使用。
	 * 注意：这是历史遗留的开发账号密钥，保留只为不破坏存量部署；
	 * 后台短信页会显著提示「未配置」，运维应尽快在页面上配置真实账号。
	 */
	public static final String FALLBACK_APIKEY = "f9201038fe97fb0e52d82fec677314e7";

	/** 兜底接入地址（云片 v2 指定模板单发） */
	public static final String FALLBACK_ENDPOINT = "https://sms.yunpian.com/v2/sms/tpl_single_send.json";

	/** 兜底模板 ID（历史默认模板） */
	public static final String FALLBACK_TPL_ID = "1341175";

	private static final String SEED_REMARK_PREFIX = "首次启用时由 " + CONFIG_FILE + " 迁移 @ ";

	@Autowired
	private SystemSettingService systemSettingService;

	// ===================== 纯函数（无 IO，便于测试） =====================

	/**
	 * 把存量 properties 的三个 key 投影成 {@code sms.*} 行（首次种子迁移的内容）。
	 *
	 * <p>规则（方案文档 §4.2）：
	 * <ul>
	 *   <li>三个 key 全空 → 返回空 Map（保持「从未配置」，不写任何行）；</li>
	 *   <li>{@code smsServer} 空或含 {@code yunpian.com} → 云片，且 endpoint 归一到 v2；</li>
	 *   <li>其它地址 → 自定义 HTTP，旧地址落 {@code url}，apikey 落 {@code params}；</li>
	 *   <li>旧模型只有一个 tplid → 四个场景沿用同一个模板 ID。</li>
	 * </ul>
	 *
	 * @return key → value（有序：先 provider 再场景/运营商）
	 */
	public static Map<String, String> buildSeedEntries(String legacyServer, String legacyApikey, String legacyTplid) {
		Map<String, String> entries = new LinkedHashMap<String, String>();

		String server = trimToNull(legacyServer);
		String apikey = trimToNull(legacyApikey);
		String tplid = trimToNull(legacyTplid);

		if (server == null && apikey == null && tplid == null) {
			return entries;
		}

		boolean useYunpian = (server == null) || server.toLowerCase().contains("yunpian.com");
		entries.put(KEY_ENABLED, "true");
		entries.put(KEY_PROVIDER, useYunpian ? SmsProviderType.YUNPIAN.getCode() : SmsProviderType.CUSTOM.getCode());

		if (tplid != null) {
			entries.put(KEY_SCENES, JSON.toJSONString(buildScenesWithSameTemplate(tplid)));
		}

		if (useYunpian) {
			if (apikey != null) {
				SmsYunpianConfig yunpian = new SmsYunpianConfig();
				yunpian.setApikey(apikey);
				// 不继承旧 v1 地址，统一归一到 v2
				yunpian.setEndpoint(SmsProviderType.YUNPIAN.getDefaultEndpoint());
				entries.put(KEY_YUNPIAN, JSON.toJSONString(yunpian));
			}
		} else {
			SmsCustomConfig custom = new SmsCustomConfig();
			custom.setUrl(server);
			Map<String, String> paramNames = new LinkedHashMap<String, String>();
			paramNames.put("phone", "mobile");
			paramNames.put("tplId", "tpl_id");
			paramNames.put("tplVars", "tpl_value");
			custom.setParamNames(paramNames);
			if (apikey != null) {
				Map<String, String> params = new LinkedHashMap<String, String>();
				params.put("apikey", apikey);
				custom.setParams(params);
			}
			entries.put(KEY_CUSTOM, JSON.toJSONString(custom));
		}

		return entries;
	}

	/** 四个场景共用同一个模板 ID（旧模型只有一个模板） */
	public static Map<String, SmsTemplateConfig> buildScenesWithSameTemplate(String tplId) {
		Map<String, SmsTemplateConfig> scenes = new LinkedHashMap<String, SmsTemplateConfig>();
		for (SmsScene scene : SmsScene.values()) {
			SmsTemplateConfig tpl = new SmsTemplateConfig();
			tpl.setTplId(tplId);
			tpl.setVars(defaultVars());
			scenes.put(scene.getCode(), tpl);
		}
		return scenes;
	}

	/**
	 * 由 {@code sms.*} 行装配配置对象。
	 * 解析失败只记日志并跳过该项 —— 读配置绝不能让发送链路炸掉。
	 */
	public SmsConfig assemble(Map<String, String> rows) {
		SmsConfig config = new SmsConfig();
		if (rows == null || rows.isEmpty()) {
			return config;
		}

		config.setEnabled(parseBoolean(rows.get(KEY_ENABLED)));
		config.setProvider(trimToNull(rows.get(KEY_PROVIDER)));
		config.setSignName(trimToNull(rows.get(KEY_SIGN_NAME)));

		Map<String, SmsTemplateConfig> scenes = parseScenes(rows.get(KEY_SCENES));
		if (!scenes.isEmpty()) {
			config.setScenes(scenes);
		}

		config.setYunpian(parseJson(rows.get(KEY_YUNPIAN), SmsYunpianConfig.class, config.getYunpian()));
		config.setAliyun(parseJson(rows.get(KEY_ALIYUN), SmsAliyunConfig.class, config.getAliyun()));
		config.setTencent(parseJson(rows.get(KEY_TENCENT), SmsTencentConfig.class, config.getTencent()));
		config.setCustom(parseJson(rows.get(KEY_CUSTOM), SmsCustomConfig.class, config.getCustom()));
		config.setOptions(parseJson(rows.get(KEY_OPTIONS), SmsOptions.class, config.getOptions()));

		return config;
	}

	/** 阻断性校验错误（空 = 通过） */
	public List<String> validate(SmsConfig config) {
		List<String> errors = new ArrayList<String>();
		if (config == null) {
			errors.add("配置为空");
			return errors;
		}

		SmsProviderType type = config.getProviderType();
		if (type == null) {
			errors.add("未选择短信运营商（" + KEY_PROVIDER + "）");
		} else {
			for (String field : type.getRequiredFields()) {
				if (isBlank(config.getProviderField(field))) {
					errors.add("缺少必填项：" + type.getDisplayName() + " 的 " + field);
				}
			}
			if (type.isSignNameRequired() && isBlank(config.getSignName())) {
				errors.add("缺少必填项：短信签名（" + KEY_SIGN_NAME + "）");
			}
			if (type == SmsProviderType.CUSTOM) {
				SmsCustomConfig custom = config.getCustom();
				String method = (custom == null) ? null : custom.getMethod();
				if (method != null && !"POST".equalsIgnoreCase(method) && !"GET".equalsIgnoreCase(method)) {
					errors.add("自定义 HTTP 的请求方式只能是 POST 或 GET");
				}
				if (custom == null || isBlank(custom.getSuccessField())) {
					errors.add("自定义 HTTP 缺少成功判定字段（successField）");
				}
			}
		}

		if (config.getScenes() != null) {
			for (Map.Entry<String, SmsTemplateConfig> entry : config.getScenes().entrySet()) {
				SmsTemplateConfig tpl = entry.getValue();
				if (tpl == null || isBlank(tpl.getTplId())) {
					errors.add("场景 " + entry.getKey() + " 的模板 ID 不能为空");
				}
			}
		}

		SmsOptions options = config.getOptions();
		if (options != null) {
			if (options.getTimeoutMs() < 1000 || options.getTimeoutMs() > 60000) {
				errors.add("超时时间需在 1000~60000 毫秒之间");
			}
			if (options.getRetry() < 0 || options.getRetry() > 3) {
				errors.add("重试次数需在 0~3 之间");
			}
			if (options.getCodeLength() < 4 || options.getCodeLength() > 8) {
				errors.add("验证码位数需在 4~8 之间");
			}
			if (options.getCodeTtlMinutes() < 1 || options.getCodeTtlMinutes() > 60) {
				errors.add("验证码有效期需在 1~60 分钟之间");
			}
		}

		if (config.isEnabled() && !config.isProviderConfigured() && type != null) {
			errors.add("已启用短信服务，但当前运营商（" + type.getDisplayName() + "）的必填项未填完整");
		}

		return errors;
	}

	/** 非阻断性提醒（空 = 无） */
	public List<String> getWarnings(SmsConfig config) {
		List<String> warnings = new ArrayList<String>();
		if (config == null) {
			return warnings;
		}

		if (!config.isEnabled()) {
			warnings.add("短信服务当前未启用（" + KEY_ENABLED + "=false）");
		}
		if (isBlank(config.getTemplateId(SmsScene.REGISTER))) {
			warnings.add("未配置「注册」场景的模板");
		}
		if (isBlank(config.getTemplateId(SmsScene.RESET_PWD))) {
			warnings.add("未配置「找回密码」场景的模板");
		}

		String endpoint = config.getEffectiveEndpoint();
		if (endpoint != null && endpoint.toLowerCase().startsWith("http://")) {
			warnings.add("接入地址使用 http，建议改用 https 以免密钥/验证码被窃听");
		}
		if (config.getProviderType() == SmsProviderType.YUNPIAN && endpoint != null && endpoint.contains("/v1/")) {
			warnings.add("云片仍在使用 v1 接口，建议切换到 v2（tpl_single_send）");
		}
		if (config.getProviderType() == SmsProviderType.YUNPIAN && !config.isEnabled()) {
			warnings.add("云片签名写在模板内容里，请确认模板已带【签名】");
		}

		return warnings;
	}

	// ===================== 需要数据库 =====================

	/** 表内是否已有任一 {@code sms.*} 配置（即已完成首次种子迁移或用户已保存过） */
	public boolean hasSmsConfig() {
		return systemSettingService.countByPrefix(KEY_PREFIX + "%") > 0;
	}

	/**
	 * 装配当前生效配置：表优先；表内没有 sms.* 行时用老 properties 兜底；
	 * 都没有时用硬编码兜底（保证升级/未配置场景下短信链路不炸）。
	 */
	public SmsConfig load() {
		Map<String, String> rows = new LinkedHashMap<String, String>();
		for (String key : ALL_KEYS) {
			String value = systemSettingService.getValue(key);
			if (value != null) {
				rows.put(key, value);
			}
		}
		if (!rows.isEmpty()) {
			return assemble(rows);
		}

		Map<String, String> legacy = buildSeedEntries(readLegacyValue(LEGACY_KEY_SERVER),
				readLegacyValue(LEGACY_KEY_APIKEY), readLegacyValue(LEGACY_KEY_TPLID));
		if (!legacy.isEmpty()) {
			Log.info("SmsConfigStore.load() 表内无 " + KEY_PREFIX + "* 配置，暂用 " + CONFIG_FILE + " 旧值");
			return assemble(legacy);
		}

		return assemble(buildFallbackEntries());
	}

	/**
	 * 首次启用时的种子迁移：**仅在表内没有任何 sms.* 行时**执行一次。
	 * 老配置为空则不写任何行（保持「从未配置」，发送走硬编码兜底）。
	 *
	 * @return true 表示本次真的写入了配置行
	 */
	public boolean ensureSeeded() {
		if (hasSmsConfig()) {
			// 用 info 而非 debug：每次启动一条，便于确认种子迁移只做一次（幂等）
			Log.info("SmsConfigStore.ensureSeeded() 表内已有 " + KEY_PREFIX + "* 配置，跳过种子迁移");
			return false;
		}

		Map<String, String> entries = buildSeedEntries(readLegacyValue(LEGACY_KEY_SERVER),
				readLegacyValue(LEGACY_KEY_APIKEY), readLegacyValue(LEGACY_KEY_TPLID));
		if (entries.isEmpty()) {
			Log.info("SmsConfigStore.ensureSeeded() " + CONFIG_FILE + " 无短信配置，不写入任何 " + KEY_PREFIX + "* 行");
			return false;
		}

		String remark = SEED_REMARK_PREFIX + nowString();
		int written = 0;
		for (Map.Entry<String, String> entry : entries.entrySet()) {
			if (systemSettingService.seedIfAbsent(entry.getKey(), entry.getValue(), remark)) {
				written++;
			}
		}
		Log.info("SmsConfigStore.ensureSeeded() 已从 " + CONFIG_FILE + " 迁移 " + written + " 条短信配置");
		return written > 0;
	}

	/**
	 * 保存配置（逐 key 写入；保留每行原有备注，没有则给一句来源说明）。
	 *
	 * @return true 表示全部写入成功
	 */
	public boolean save(SmsConfig config) {
		if (config == null) {
			return false;
		}

		Map<String, String> values = new LinkedHashMap<String, String>();
		values.put(KEY_ENABLED, config.isEnabled() ? "true" : "false");
		values.put(KEY_PROVIDER, nullToEmpty(config.getProvider()));
		values.put(KEY_SIGN_NAME, nullToEmpty(config.getSignName()));
		values.put(KEY_SCENES, JSON.toJSONString(config.getScenes() == null ? new LinkedHashMap<String, SmsTemplateConfig>() : config.getScenes()));
		values.put(KEY_YUNPIAN, JSON.toJSONString(config.getYunpian() == null ? new SmsYunpianConfig() : config.getYunpian()));
		values.put(KEY_ALIYUN, JSON.toJSONString(config.getAliyun() == null ? new SmsAliyunConfig() : config.getAliyun()));
		values.put(KEY_TENCENT, JSON.toJSONString(config.getTencent() == null ? new SmsTencentConfig() : config.getTencent()));
		values.put(KEY_CUSTOM, JSON.toJSONString(config.getCustom() == null ? new SmsCustomConfig() : config.getCustom()));
		values.put(KEY_OPTIONS, JSON.toJSONString(config.getOptions() == null ? new SmsOptions() : config.getOptions()));

		boolean allOk = true;
		for (Map.Entry<String, String> entry : values.entrySet()) {
			String remark = systemSettingService.getRemark(entry.getKey());
			if (remark == null) {
				remark = "由管理后台短信服务页维护";
			}
			if (!systemSettingService.set(entry.getKey(), entry.getValue(), remark)) {
				allOk = false;
				Log.info("SmsConfigStore.save() 写入失败 key:" + entry.getKey());
			}
		}
		return allOk;
	}

	// ===================== 生效值（含逐字段兜底） =====================

	/** 场景模板 ID（表/老配置都没有 → 硬编码兜底） */
	public String getEffectiveTemplateId(SmsScene scene) {
		String value = load().getTemplateId(scene);
		return isBlank(value) ? FALLBACK_TPL_ID : value.trim();
	}

	/** 云片 apikey（表/老配置都没有 → 硬编码兜底） */
	public String getEffectiveYunpianApikey() {
		SmsYunpianConfig yunpian = load().getYunpian();
		String value = (yunpian == null) ? null : yunpian.getApikey();
		return isBlank(value) ? FALLBACK_APIKEY : value.trim();
	}

	/** 云片接入地址（空 → v2 默认端点） */
	public String getEffectiveYunpianEndpoint() {
		SmsYunpianConfig yunpian = load().getYunpian();
		String value = (yunpian == null) ? null : yunpian.getEndpoint();
		return isBlank(value) ? FALLBACK_ENDPOINT : value.trim();
	}

	/**
	 * 当前运营商的**生效接入地址**（自定义 HTTP 取 {@code url}，其余取配置端点，空则回落默认端点）。
	 *
	 * <p>仅供旧调用方读取（{@code BaseController.getSmsSendUri()}）—— 发送链路用不到：
	 * {@code SmsSender} 自己会从本 Store 取配置。
	 */
	public String getEffectiveSendUri() {
		String value = load().getEffectiveEndpoint();
		return isBlank(value) ? FALLBACK_ENDPOINT : value.trim();
	}

	/**
	 * 当前运营商的**主密钥**（兼容旧调用方读取，见 {@link #getEffectiveSendUri()}）。
	 * 云片 = apikey、阿里云 = accessKeyId、腾讯云 = secretId、自定义 = {@code params.apikey}。
	 *
	 * <p>只有云片保留硬编码兜底 —— 与改造前 {@code getSmsApikey()} 的行为一致（决策 7）。
	 */
	public String getEffectivePrimaryCredential() {
		SmsConfig config = load();
		SmsProviderType type = config.getProviderType();
		if (type == null) {
			return FALLBACK_APIKEY;
		}

		String value = null;
		switch (type) {
		case YUNPIAN:
			value = config.getProviderField("apikey");
			break;
		case ALIYUN:
			value = config.getProviderField("accessKeyId");
			break;
		case TENCENT:
			value = config.getProviderField("secretId");
			break;
		case CUSTOM:
			SmsCustomConfig custom = config.getCustom();
			value = (custom == null || custom.getParams() == null) ? null : custom.getParams().get("apikey");
			break;
		}

		if (isBlank(value)) {
			return (type == SmsProviderType.YUNPIAN) ? FALLBACK_APIKEY : null;
		}
		return value.trim();
	}

	/** 读取存量 properties（ini 优先，其次 classpath 镜像） */
	public String readLegacyValue(String key) {
		String value = null;
		String iniPath = BaseFunction.getDocSysIniPath();
		if (iniPath != null && !iniPath.isEmpty()) {
			value = ReadProperties.getValue(iniPath + CONFIG_FILE, key);
		}
		if (isBlank(value)) {
			value = ReadProperties.read(CONFIG_FILE, key);
		}
		return isBlank(value) ? null : value.trim();
	}

	/** 硬编码兜底配置（表与 properties 都没有时使用，决策 7） */
	public static Map<String, String> buildFallbackEntries() {
		Map<String, String> entries = new LinkedHashMap<String, String>();
		SmsYunpianConfig yunpian = new SmsYunpianConfig();
		yunpian.setApikey(FALLBACK_APIKEY);
		yunpian.setEndpoint(FALLBACK_ENDPOINT);
		entries.put(KEY_ENABLED, "true");
		entries.put(KEY_PROVIDER, SmsProviderType.YUNPIAN.getCode());
		entries.put(KEY_YUNPIAN, JSON.toJSONString(yunpian));
		entries.put(KEY_SCENES, JSON.toJSONString(buildScenesWithSameTemplate(FALLBACK_TPL_ID)));
		return entries;
	}

	// ===================== 内部工具 =====================

	private Map<String, SmsTemplateConfig> parseScenes(String json) {
		Map<String, SmsTemplateConfig> result = new LinkedHashMap<String, SmsTemplateConfig>();
		if (isBlank(json)) {
			return result;
		}
		try {
			Map<String, SmsTemplateConfig> parsed = JSON.parseObject(json,
					new TypeReference<Map<String, SmsTemplateConfig>>() {});
			if (parsed == null) {
				return result;
			}
			for (Map.Entry<String, SmsTemplateConfig> entry : parsed.entrySet()) {
				SmsScene scene = SmsScene.fromCode(entry.getKey());
				if (scene == null) {
					Log.info("SmsConfigStore 忽略未知场景: " + entry.getKey());
					continue;
				}
				result.put(scene.getCode(), entry.getValue());
			}
		} catch (Exception e) {
			Log.info("SmsConfigStore 解析 " + KEY_SCENES + " 失败: " + e.getMessage());
		}
		return result;
	}

	private <T> T parseJson(String json, Class<T> clazz, T defaultValue) {
		if (isBlank(json)) {
			return defaultValue;
		}
		try {
			T parsed = JSON.parseObject(json, clazz);
			return (parsed == null) ? defaultValue : parsed;
		} catch (Exception e) {
			Log.info("SmsConfigStore 解析 " + clazz.getSimpleName() + " 失败: " + e.getMessage());
			return defaultValue;
		}
	}

	private static boolean parseBoolean(String value) {
		if (value == null) {
			return false;
		}
		String trimmed = value.trim();
		return "true".equalsIgnoreCase(trimmed) || "1".equals(trimmed) || "yes".equalsIgnoreCase(trimmed);
	}

	private static List<String> defaultVars() {
		List<String> vars = new ArrayList<String>();
		for (String var : SmsScene.DEFAULT_VARS) {
			vars.add(var);
		}
		return vars;
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value;
	}

	private static String nowString() {
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
	}
}
