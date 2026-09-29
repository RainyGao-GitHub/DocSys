package com.DocSystem.commonService.sms;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.Log;
import com.DocSystem.commonService.sms.impl.AliyunSmsProvider;
import com.DocSystem.commonService.sms.impl.GenericHttpSmsProvider;
import com.DocSystem.commonService.sms.impl.YunpianSmsProvider;
import com.DocSystem.service.sms.SmsConfigStore;
import util.RegularUtil;

/**
 * 短信发送统一入口。
 *
 * <p>流程：取配置（{@link SmsConfigStore}）→ 校验开关/运营商/模板/变量（{@link #prepare}）
 * → 交给对应 {@link SmsProvider} 造请求 → {@link SmsHttpClient} 发送 → 解析结果。
 *
 * <p>日志一律**脱敏**：只记场景、手机号掩码、运营商、返回码与耗时；
 * 不记 apikey/secret，也不整段打印响应体（响应体经 {@link SmsSendResult#getRaw()} 返回给
 * 后台「发送测试短信」展示，不入日志）。
 *
 * <p>本类放在 mvc 容器扫描的包（com.DocSystem.commonService）—— 只有控制器/服务在用它；
 * 而配置存储 {@link SmsConfigStore} 在 root 容器（com.DocSystem.service），两边都能看到。
 */
@Component
public class SmsSender {

	@Autowired
	private SmsConfigStore configStore;

	/** 已接入的运营商实现 */
	private final Map<SmsProviderType, SmsProvider> providers = new LinkedHashMap<SmsProviderType, SmsProvider>();

	public SmsSender() {
		register(new YunpianSmsProvider());
		register(new AliyunSmsProvider());
		register(new GenericHttpSmsProvider());
	}

	/**
	 * 校验配置与参数并构造请求（**不打网络**）。
	 * 供发送前诊断、后台「发送测试短信」预检、以及单元验证使用。
	 */
	public SmsPrepared prepare(SmsScene scene, String phone, Map<String, String> vars) {
		return prepare(null, scene, phone, vars);
	}

	/**
	 * 用**给定配置**校验并构造请求（**不打网络**）。
	 *
	 * <p>供后台「发送测试短信」在**保存前**用页面上的未保存值试发；{@code config} 为 null
	 * 时仍从 {@link SmsConfigStore} 取（与 {@link #prepare(SmsScene, String, Map)} 等价）。
	 */
	public SmsPrepared prepare(SmsConfig config, SmsScene scene, String phone, Map<String, String> vars) {
		SmsPrepared prepared = new SmsPrepared();
		config = resolveConfig(config);
		prepared.setConfig(config);

		if (scene == null) {
			prepared.setError("未指定短信场景");
			return prepared;
		}
		if (checkCommon(prepared, config, phone) == false) {
			return prepared;
		}

		SmsTemplateConfig template = config.getScene(scene);
		if (template == null || isBlank(template.getTplId())) {
			prepared.setError("未配置「" + scene.getDisplayName() + "」场景的模板 ID");
			return prepared;
		}

		return buildRequest(prepared, config, template, template.getEffectiveVars(), phone, vars);
	}

	/**
	 * 用**指定模板 ID** 构造请求（不走场景映射，**不打网络**）。
	 *
	 * <p>存在意义：历史调用方自带模板（如销售订单通知模板 1495318），它既不在四个已登记场景里，
	 * 也不该被硬塞进某个场景的模板配置；但发送本身必须走同一条链路（同一套编码口径/重试策略/脱敏日志）。
	 *
	 * <p>变量名即 {@code vars} 的键（**不套用场景默认变量名**）—— 调用方给什么就发什么。
	 */
	public SmsPrepared prepareWithTemplate(String tplId, String phone, Map<String, String> vars) {
		return prepareWithTemplate(null, tplId, phone, vars);
	}

	/** 用**给定配置** + 指定模板 ID 构造请求（见 {@link #prepareWithTemplate(String, String, Map)}） */
	public SmsPrepared prepareWithTemplate(SmsConfig config, String tplId, String phone, Map<String, String> vars) {
		SmsPrepared prepared = new SmsPrepared();
		config = resolveConfig(config);
		prepared.setConfig(config);

		if (checkCommon(prepared, config, phone) == false) {
			return prepared;
		}
		if (isBlank(tplId)) {
			prepared.setError("未指定模板 ID");
			return prepared;
		}

		SmsTemplateConfig template = new SmsTemplateConfig();
		template.setTplId(tplId.trim());
		List<String> names = varNamesOf(vars);
		template.setVars(names);
		return buildRequest(prepared, config, template, names, phone, vars);
	}

	/** 配置为 null → 取当前生效配置（表 → properties → 硬编码兜底） */
	private SmsConfig resolveConfig(SmsConfig config) {
		return (config == null) ? configStore.load() : config;
	}

	/** 发送前的公共校验：手机号 → 开关 → 运营商已接入（错误文案与顺序保持既有约定） */
	private boolean checkCommon(SmsPrepared prepared, SmsConfig config, String phone) {
		if (isBlank(phone)) {
			prepared.setError("手机号不能为空");
			return false;
		}
		if (!RegularUtil.IsMobliePhone(phone)) {
			prepared.setError("手机号格式不正确");
			return false;
		}
		if (!config.isEnabled()) {
			prepared.setError("短信服务未启用（" + SmsConfigStore.KEY_ENABLED + "=false）");
			return false;
		}

		SmsProviderType type = config.getProviderType();
		if (type == null) {
			prepared.setError("未配置短信运营商（" + SmsConfigStore.KEY_PROVIDER + "）");
			return false;
		}
		if (providers.get(type) == null) {
			prepared.setError("该运营商暂未接入：" + type.getDisplayName());
			return false;
		}
		return true;
	}

	/** 校验模板变量并交给对应 Provider 造请求 */
	private SmsPrepared buildRequest(SmsPrepared prepared, SmsConfig config, SmsTemplateConfig template,
			List<String> varNames, String phone, Map<String, String> vars) {
		Map<String, String> effectiveVars = new LinkedHashMap<String, String>();
		if (varNames != null) {
			for (String name : varNames) {
				String value = (vars == null) ? null : vars.get(name);
				if (isBlank(value)) {
					prepared.setError("缺少模板变量：" + name);
					return prepared;
				}
				effectiveVars.put(name, value);
			}
		}

		SmsProviderType type = config.getProviderType();
		SmsRequest request = providers.get(type).buildRequest(config, template, phone, effectiveVars);
		if (request == null || isBlank(request.getUrl())) {
			prepared.setError("接入地址为空（" + type.getDisplayName() + "）");
			return prepared;
		}

		prepared.setReady(true);
		prepared.setProvider(type);
		prepared.setRequest(request);
		return prepared;
	}

	/** 变量名列表（保持调用方给的顺序；null → 空列表） */
	private static List<String> varNamesOf(Map<String, String> vars) {
		List<String> names = new ArrayList<String>();
		if (vars != null) {
			names.addAll(vars.keySet());
		}
		return names;
	}

	/**
	 * 发送短信。
	 *
	 * @param scene 场景（决定用哪个模板）
	 * @param phone 手机号
	 * @param vars  模板变量（如 {"code":"123456"}）
	 */
	public SmsSendResult send(SmsScene scene, String phone, Map<String, String> vars) {
		return execute(scene == null ? null : scene.getCode(), phone, prepare((SmsConfig) null, scene, phone, vars));
	}

	/**
	 * 用**给定配置**发送（见 {@link #prepare(SmsConfig, SmsScene, String, Map)}）。
	 * 后台「发送测试短信」用页面未保存值走这条。
	 */
	public SmsSendResult send(SmsConfig config, SmsScene scene, String phone, Map<String, String> vars) {
		return execute(scene == null ? null : scene.getCode(), phone, prepare(config, scene, phone, vars));
	}

	/**
	 * 用**指定模板 ID** 发送（历史调用方兼容路径，见 {@link #prepareWithTemplate}）。
	 *
	 * <p>与 {@link #send} 只差模板来源：这里由调用方给模板 ID 与变量名，适合「自带模板」的老链路。
	 */
	public SmsSendResult sendWithTemplate(String tplId, String phone, Map<String, String> vars) {
		return execute("tpl:" + tplId, phone, prepareWithTemplate((SmsConfig) null, tplId, phone, vars));
	}

	private SmsSendResult execute(String sceneCode, String phone, SmsPrepared prepared) {
		if (!prepared.isReady()) {
			Log.info("SmsSender.send() 场景:" + sceneCode
					+ " 手机:" + maskPhone(phone) + " 未就绪: " + prepared.getError());
			return SmsSendResult.failure(null, prepared.getError());
		}

		SmsProviderType type = prepared.getProvider();
		SmsProvider provider = providers.get(type);
		SmsOptions options = prepared.getConfig().getOptions();

		long start = System.currentTimeMillis();
		SmsHttpResponse response = SmsHttpClient.execute(prepared.getRequest(),
				(options == null) ? 10000 : options.getTimeoutMs(),
				(options == null) ? 0 : options.getRetry());
		long elapsed = System.currentTimeMillis() - start;

		SmsSendResult result;
		if (response.isNetworkError()) {
			result = SmsSendResult.failure(type.getCode(), "网络异常：" + response.getErrorMessage());
		} else {
			result = provider.parseResponse(prepared.getConfig(), response.getStatus(), response.getBody());
			result.setProvider(type.getCode());
		}
		result.setElapsedMs(elapsed);

		logResult(sceneCode, phone, result);
		return result;
	}

	/** 取某运营商的实现（未接入 → null） */
	public SmsProvider getProvider(SmsProviderType type) {
		return providers.get(type);
	}

	private void register(SmsProvider provider) {
		providers.put(provider.getType(), provider);
	}

	private void logResult(String sceneCode, String phone, SmsSendResult result) {
		StringBuilder sb = new StringBuilder();
		sb.append("SmsSender.send() 场景:").append(sceneCode);
		sb.append(" 手机:").append(maskPhone(phone));
		sb.append(" 运营商:").append(result.getProvider());
		sb.append(" 结果:").append(result.isSuccess() ? "成功" : "失败");
		if (result.getProviderCode() != null) {
			sb.append(" 返回码:").append(result.getProviderCode());
		}
		sb.append(" 耗时:").append(result.getElapsedMs()).append("ms");
		if (!result.isSuccess()) {
			sb.append(" 原因:").append(result.getFailureReason());
		}
		Log.info(sb.toString());
	}

	/** 手机号脱敏（保留前 3 后 4，中间打码） */
	public static String maskPhone(String phone) {
		if (phone == null || phone.length() < 7) {
			return "***";
		}
		return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
	}

	private static boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
