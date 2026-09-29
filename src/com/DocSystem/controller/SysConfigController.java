package com.DocSystem.controller;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.DocSystem.common.Log;
import com.DocSystem.entity.SystemSetting;
import com.DocSystem.entity.User;
import com.DocSystem.service.SystemSettingService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import util.ReturnAjax;

/**
 * 系统参数管理接口（表 {@code system_setting}）—— 管理后台「系统管理 → 系统参数」。
 *
 * <p>与「邮件服务 / 短信服务 / 数据库设置」等专用页是**同一份数据**：
 * 专用页是结构化视图，本页是通用键值视图。
 *
 * <p>安全约定：
 * <ul>
 *   <li>权限：{@code superAdminAccessCheck(authCode, "docSysInit")}（与短信/邮件页一致）；</li>
 *   <li>审计日志只记<b>配置名与值的长度</b>，不记值本身 —— 配置值里可能有密钥；</li>
 *   <li>长度上限与表定义对齐（name 128 / remark 1024），避免 MySQL 严格模式下写入报错。</li>
 * </ul>
 */
@Controller
@RequestMapping("/SysConfig")
public class SysConfigController extends BaseController {

	@Autowired
	private SystemSettingService systemSettingService;

	/** 与 system_setting 表定义一致 */
	private static final int MAX_NAME_LEN = 128;
	private static final int MAX_REMARK_LEN = 1024;
	private static final int MAX_VALUE_LEN = 65535;

	/** 必须为合法 JSON 对象字符串的配置名（精确匹配） */
	private static final String[] JSON_OBJECT_KEYS = {
			"sms.scenes", "sms.yunpian", "sms.aliyun", "sms.tencent", "sms.custom", "sms.options"
	};

	/** 导入单次上限（防止一次灌入过多导致请求超时） */
	private static final int MAX_IMPORT_COUNT = 500;

	/********** 获取系统参数列表 ***************/
	@RequestMapping("/getAll.do")
	public void getAll(String searchWord, Integer pageIndex, Integer pageSize, String authCode,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** SysConfig getAll.do ***********************");
		Log.debug("SysConfig getAll() searchWord:" + searchWord + " pageIndex:" + pageIndex + " pageSize:" + pageSize);

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);
			return;
		}

		int page = (pageIndex == null || pageIndex < 0) ? 0 : pageIndex;
		int size = (pageSize == null || pageSize < 1) ? 20 : pageSize;

		int total = systemSettingService.getTotal(searchWord);
		List<SystemSetting> list = systemSettingService.getAll(searchWord, page + 1, size);
		for(int i = 0; i < list.size(); i++)
		{
			list.get(i).setIndex(page * size + i + 1);
		}

		rt.setData(list);
		rt.setDataEx(total);
		writeJson(rt, response);
	}

	/********** 新增 / 修改系统参数 ***************/
	@RequestMapping("/set.do")
	public void set(String name, String value, String remark, String authCode,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** SysConfig set.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);
			return;
		}

		String err = validateSetting(name, value, remark);
		if(err != null)
		{
			rt.setError(err);
			addSystemLog(request, accessUser, "setSystemSetting", "setSystemSetting", "修改系统参数", null,
					"失败", null, null, null, "name:" + name);
			writeJson(rt, response);
			return;
		}

		String trimmedName = name.trim();
		boolean exists = systemSettingService.exists(trimmedName);
		boolean success = systemSettingService.set(trimmedName, value, remark);

		if(success)
		{
			Log.info("SysConfig set.do " + (exists ? "update" : "insert") + " name:" + trimmedName);
			addSystemLog(request, accessUser, "setSystemSetting", "setSystemSetting", "修改系统参数", null,
					"成功", null, null, null, "name:" + trimmedName + " valueLen:" + value.length());
		}
		else
		{
			rt.setError("保存失败，请检查系统日志");
			addSystemLog(request, accessUser, "setSystemSetting", "setSystemSetting", "修改系统参数", null,
					"失败", null, null, null, "name:" + trimmedName);
		}

		writeJson(rt, response);
	}

	/********** 删除系统参数 ***************/
	@RequestMapping("/delete.do")
	public void delete(String name, String authCode,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** SysConfig delete.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);
			return;
		}

		if(name == null || name.trim().isEmpty())
		{
			rt.setError("配置名称不能为空");
			writeJson(rt, response);
			return;
		}

		String trimmedName = name.trim();
		if(systemSettingService.delete(trimmedName))
		{
			Log.info("SysConfig delete.do name:" + trimmedName);
			addSystemLog(request, accessUser, "deleteSystemSetting", "deleteSystemSetting", "删除系统参数", null,
					"成功", null, null, null, "name:" + trimmedName);
		}
		else
		{
			rt.setError("删除失败，请检查系统日志");
		}

		writeJson(rt, response);
	}

	/********** 导入系统参数（JSON 数组） ***************/
	@RequestMapping("/import.do")
	public void importSettings(String settings, String authCode,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** SysConfig import.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);
			return;
		}

		if(settings == null || settings.trim().isEmpty())
		{
			rt.setError("导入内容为空");
			writeJson(rt, response);
			return;
		}

		JSONArray array = null;
		try
		{
			array = JSON.parseArray(settings);
		}
		catch(Exception e)
		{
			Log.info("SysConfig import.do 解析 JSON 失败");
			Log.info(e);
			rt.setError("导入内容不是合法的 JSON 数组");
			writeJson(rt, response);
			return;
		}

		if(array == null || array.size() == 0)
		{
			rt.setError("导入内容为空数组");
			writeJson(rt, response);
			return;
		}

		if(array.size() > MAX_IMPORT_COUNT)
		{
			rt.setError("单次最多导入 " + MAX_IMPORT_COUNT + " 条");
			writeJson(rt, response);
			return;
		}

		int success = 0;
		List<String> errors = new ArrayList<String>();
		for(int i = 0; i < array.size(); i++)
		{
			JSONObject item = null;
			try
			{
				item = array.getJSONObject(i);
			}
			catch(Exception e)
			{
				errors.add("第 " + (i + 1) + " 条不是对象");
				continue;
			}

			if(item == null)
			{
				errors.add("第 " + (i + 1) + " 条不是对象");
				continue;
			}

			String name = item.getString("name");
			String value = item.getString("value");
			String remark = item.getString("remark");

			String err = validateSetting(name, value, remark);
			if(err != null)
			{
				errors.add("第 " + (i + 1) + " 条: " + err);
				continue;
			}

			if(systemSettingService.set(name.trim(), value, remark))
			{
				success++;
			}
			else
			{
				errors.add("第 " + (i + 1) + " 条: 写入失败");
			}
		}

		JSONObject data = new JSONObject();
		data.put("total", array.size());
		data.put("success", success);
		data.put("failed", array.size() - success);
		if(errors.size() > 10)
		{
			data.put("errors", errors.subList(0, 10));
		}
		else
		{
			data.put("errors", errors);
		}
		rt.setData(data);

		Log.info("SysConfig import.do total:" + array.size() + " success:" + success);
		addSystemLog(request, accessUser, "importSystemSetting", "importSystemSetting", "导入系统参数", null,
				success > 0 ? "成功" : "失败", null, null, null,
				"total:" + array.size() + " success:" + success);

		writeJson(rt, response);
	}

	/**
	 * 参数校验（新增/修改/导入共用）。
	 * @return null 表示通过，否则返回错误信息
	 */
	private String validateSetting(String name, String value, String remark)
	{
		if(name == null || name.trim().isEmpty())
		{
			return "配置名称不能为空";
		}

		String trimmedName = name.trim();
		if(trimmedName.length() > MAX_NAME_LEN)
		{
			return "配置名称不能超过 " + MAX_NAME_LEN + " 个字符";
		}

		if(!trimmedName.matches("[A-Za-z0-9._-]+"))
		{
			return "配置名称只能包含字母、数字、点(.)、下划线(_)、中划线(-)";
		}

		if(value == null || value.isEmpty())
		{
			return "配置值不能为空";
		}

		if(value.length() > MAX_VALUE_LEN)
		{
			return "配置值不能超过 " + MAX_VALUE_LEN + " 个字符";
		}

		if(remark != null && remark.length() > MAX_REMARK_LEN)
		{
			return "备注不能超过 " + MAX_REMARK_LEN + " 个字符";
		}

		return validateJsonValue(trimmedName, value);
	}

	/** 对已登记为 JSON 的配置项做结构校验（避免把非法 JSON 存进库，运行期解析失败） */
	private String validateJsonValue(String name, String value)
	{
		boolean needJsonObject = false;
		for(String key : JSON_OBJECT_KEYS)
		{
			if(key.equals(name))
			{
				needJsonObject = true;
				break;
			}
		}

		if(!needJsonObject && name.endsWith(".json"))
		{
			needJsonObject = true;
		}

		if(!needJsonObject)
		{
			return null;
		}

		try
		{
			Object obj = JSON.parse(value);
			if(obj instanceof JSONObject)
			{
				return null;
			}
			return "配置 " + name + " 需要是 JSON 对象字符串";
		}
		catch(Exception e)
		{
			return "配置 " + name + " 不是合法的 JSON";
		}
	}
}
