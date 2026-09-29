package com.DocSystem.commonService.sms;

import java.util.LinkedHashMap;
import java.util.Map;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 短信配置（由 {@code system_setting} 表里的若干 {@code sms.*} 行装配而成）。
 *
 * <p>表结构 / key 约定见方案文档 §2.1.2：
 * {@code sms.enabled} / {@code sms.provider} / {@code sms.signName} / {@code sms.scenes} /
 * {@code sms.yunpian} / {@code sms.aliyun} / {@code sms.tencent} / {@code sms.custom} / {@code sms.options}。
 *
 * <p>装配与校验逻辑在 {@code com.DocSystem.service.sms.SmsConfigStore}。
 */
public class SmsConfig {

	/** 短信服务总开关 */
	private boolean enabled;

	/** 当前运营商 code（{@link SmsProviderType#getCode()}） */
	private String provider;

	/** 短信签名（阿里云/腾讯云必填；云片写在模板内容里） */
	private String signName;

	/** 场景 → 模板配置（key 为 {@link SmsScene#getCode()}） */
	private Map<String, SmsTemplateConfig> scenes = new LinkedHashMap<String, SmsTemplateConfig>();

	private SmsYunpianConfig yunpian = new SmsYunpianConfig();
	private SmsAliyunConfig aliyun = new SmsAliyunConfig();
	private SmsTencentConfig tencent = new SmsTencentConfig();
	private SmsCustomConfig custom = new SmsCustomConfig();
	private SmsOptions options = new SmsOptions();

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public String getSignName() {
		return signName;
	}

	public void setSignName(String signName) {
		this.signName = signName;
	}

	public Map<String, SmsTemplateConfig> getScenes() {
		return scenes;
	}

	public void setScenes(Map<String, SmsTemplateConfig> scenes) {
		this.scenes = scenes;
	}

	public SmsYunpianConfig getYunpian() {
		return yunpian;
	}

	public void setYunpian(SmsYunpianConfig yunpian) {
		this.yunpian = yunpian;
	}

	public SmsAliyunConfig getAliyun() {
		return aliyun;
	}

	public void setAliyun(SmsAliyunConfig aliyun) {
		this.aliyun = aliyun;
	}

	public SmsTencentConfig getTencent() {
		return tencent;
	}

	public void setTencent(SmsTencentConfig tencent) {
		this.tencent = tencent;
	}

	public SmsCustomConfig getCustom() {
		return custom;
	}

	public void setCustom(SmsCustomConfig custom) {
		this.custom = custom;
	}

	public SmsOptions getOptions() {
		return options;
	}

	public void setOptions(SmsOptions options) {
		this.options = options;
	}

	/** 当前运营商（未配置 / 未知 → null）；派生属性，不参与 JSON */
	@JSONField(serialize = false, deserialize = false)
	public SmsProviderType getProviderType() {
		return SmsProviderType.fromCode(provider);
	}

	/** 取场景模板（未配置 → null） */
	public SmsTemplateConfig getScene(SmsScene scene) {
		if (scene == null || scenes == null) {
			return null;
		}
		return scenes.get(scene.getCode());
	}

	/** 取场景模板 ID（未配置 → null） */
	public String getTemplateId(SmsScene scene) {
		SmsTemplateConfig tpl = getScene(scene);
		return (tpl == null) ? null : tpl.getTplId();
	}

	/**
	 * 取当前运营商的配置字段值（UI 渲染与校验共用，字段名见 {@link SmsProviderType#getRequiredFields()}）。
	 */
	public String getProviderField(String field) {
		SmsProviderType type = getProviderType();
		if (type == null || field == null) {
			return null;
		}
		switch (type) {
		case YUNPIAN:
			if ("apikey".equals(field)) {
				return yunpian == null ? null : yunpian.getApikey();
			}
			if ("endpoint".equals(field)) {
				return yunpian == null ? null : yunpian.getEndpoint();
			}
			break;
		case ALIYUN:
			if ("accessKeyId".equals(field)) {
				return aliyun == null ? null : aliyun.getAccessKeyId();
			}
			if ("accessKeySecret".equals(field)) {
				return aliyun == null ? null : aliyun.getAccessKeySecret();
			}
			if ("regionId".equals(field)) {
				return aliyun == null ? null : aliyun.getRegionId();
			}
			if ("endpoint".equals(field)) {
				return aliyun == null ? null : aliyun.getEndpoint();
			}
			break;
		case TENCENT:
			if ("secretId".equals(field)) {
				return tencent == null ? null : tencent.getSecretId();
			}
			if ("secretKey".equals(field)) {
				return tencent == null ? null : tencent.getSecretKey();
			}
			if ("sdkAppId".equals(field)) {
				return tencent == null ? null : tencent.getSdkAppId();
			}
			if ("region".equals(field)) {
				return tencent == null ? null : tencent.getRegion();
			}
			if ("endpoint".equals(field)) {
				return tencent == null ? null : tencent.getEndpoint();
			}
			break;
		case CUSTOM:
			if ("url".equals(field)) {
				return custom == null ? null : custom.getUrl();
			}
			if ("method".equals(field)) {
				return custom == null ? null : custom.getMethod();
			}
			if ("successField".equals(field)) {
				return custom == null ? null : custom.getSuccessField();
			}
			if ("successValue".equals(field)) {
				return custom == null ? null : custom.getSuccessValue();
			}
			break;
		}
		return null;
	}

	/** 当前运营商的必填项是否齐全（不含 enabled 判断）；派生属性，不参与 JSON */
	@JSONField(serialize = false, deserialize = false)
	public boolean isProviderConfigured() {
		SmsProviderType type = getProviderType();
		if (type == null) {
			return false;
		}
		for (String field : type.getRequiredFields()) {
			String value = getProviderField(field);
			if (value == null || value.trim().isEmpty()) {
				return false;
			}
		}
		if (type.isSignNameRequired() && (signName == null || signName.trim().isEmpty())) {
			return false;
		}
		return true;
	}

	/**
	 * 生效的接入地址：自定义 HTTP 取 {@code url}，其余取配置值，空则回落到运营商默认端点。
	 * 派生属性，不参与 JSON。
	 */
	@JSONField(serialize = false, deserialize = false)
	public String getEffectiveEndpoint() {
		SmsProviderType type = getProviderType();
		if (type == SmsProviderType.CUSTOM) {
			return (custom == null) ? null : trimToNull(custom.getUrl());
		}
		String configured = getProviderField("endpoint");
		if (configured != null && !configured.trim().isEmpty()) {
			return configured.trim();
		}
		return (type == null) ? null : type.getDefaultEndpoint();
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
