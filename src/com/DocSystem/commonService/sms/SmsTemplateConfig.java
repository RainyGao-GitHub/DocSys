package com.DocSystem.commonService.sms;

import java.util.ArrayList;
import java.util.List;

import com.alibaba.fastjson.annotation.JSONField;

/**
 * 单个场景的模板配置：{@code {"tplId":"1341175","vars":["code"]}}。
 */
public class SmsTemplateConfig {

	/** 运营商侧的模板 ID / CODE */
	private String tplId;

	/** 模板变量名（有序：腾讯云 TemplateParamSet 按此顺序填充） */
	private List<String> vars = new ArrayList<String>();

	public String getTplId() {
		return tplId;
	}

	public void setTplId(String tplId) {
		this.tplId = tplId;
	}

	public List<String> getVars() {
		return vars;
	}

	public void setVars(List<String> vars) {
		this.vars = vars;
	}

	/**
	 * 变量名列表（空 → 用默认的 code）。
	 * 注：派生 getter，必须排除出 JSON —— 否则序列化时会多写一个 effectiveVars 字段进库。
	 */
	@JSONField(serialize = false, deserialize = false)
	public List<String> getEffectiveVars() {
		if (vars == null || vars.isEmpty()) {
			List<String> defaults = new ArrayList<String>();
			for (String var : SmsScene.DEFAULT_VARS) {
				defaults.add(var);
			}
			return defaults;
		}
		return vars;
	}
}
