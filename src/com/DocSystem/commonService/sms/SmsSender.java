package com.DocSystem.commonService.sms;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.Log;
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
		register(new GenericHttpSmsProvider());
	}

	/**
	 * 校验配置与参数并构造请求（**不打网络**）。
	 * 供发送前诊断、后台「发送测试短信」预检、以及单元验证使用。
	 */
	public SmsPrepared prepare(SmsScene scene, String phone, Map<String, String> vars) {
		SmsPrepared prepared = new SmsPrepared();
		SmsConfig config = configStore.load();
		prepared.setConfig(config);

		if (scene == null) {
			prepared.setError("未指定短信场景");
			return prepared;
		}
		if (isBlank(phone)) {
			prepared.setError("手机号不能为空");
			return prepared;
		}
		if (!RegularUtil.IsMobliePhone(phone)) {
			prepared.setError("手机号格式不正确");
			return prepared;
		}
		if (!config.isEnabled()) {
			prepared.setError("短信服务未启用（" + SmsConfigStore.KEY_ENABLED + "=false）");
			return prepared;
		}

		SmsProviderType type = config.getProviderType();
		if (type == null) {
			prepared.setError("未配置短信运营商（" + SmsConfigStore.KEY_PROVIDER + "）");
			return prepared;
		}
		SmsProvider provider = providers.get(type);
		if (provider == null) {
			prepared.setError("该运营商暂未接入：" + type.getDisplayName());
			return prepared;
		}

		SmsTemplateConfig template = config.getScene(scene);
		if (template == null || isBlank(template.getTplId())) {
			prepared.setError("未配置「" + scene.getDisplayName() + "」场景的模板 ID");
			return prepared;
		}

		Map<String, String> effectiveVars = new LinkedHashMap<String, String>();
		List<String> names = template.getEffectiveVars();
		for (String name : names) {
			String value = (vars == null) ? null : vars.get(name);
			if (isBlank(value)) {
				prepared.setError("缺少模板变量：" + name);
				return prepared;
			}
			effectiveVars.put(name, value);
		}

		SmsRequest request = provider.buildRequest(config, template, phone, effectiveVars);
		if (request == null || isBlank(request.getUrl())) {
			prepared.setError("接入地址为空（" + type.getDisplayName() + "）");
			return prepared;
		}

		prepared.setReady(true);
		prepared.setProvider(type);
		prepared.setRequest(request);
		return prepared;
	}

	/**
	 * 发送短信。
	 *
	 * @param scene 场景（决定用哪个模板）
	 * @param phone 手机号
	 * @param vars  模板变量（如 {"code":"123456"}）
	 */
	public SmsSendResult send(SmsScene scene, String phone, Map<String, String> vars) {
		SmsPrepared prepared = prepare(scene, phone, vars);
		if (!prepared.isReady()) {
			Log.info("SmsSender.send() 场景:" + (scene == null ? "null" : scene.getCode())
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

		logResult(scene, phone, result);
		return result;
	}

	/** 取某运营商的实现（未接入 → null） */
	public SmsProvider getProvider(SmsProviderType type) {
		return providers.get(type);
	}

	private void register(SmsProvider provider) {
		providers.put(provider.getType(), provider);
	}

	private void logResult(SmsScene scene, String phone, SmsSendResult result) {
		StringBuilder sb = new StringBuilder();
		sb.append("SmsSender.send() 场景:").append(scene == null ? "null" : scene.getCode());
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
