package com.DocSystem.service.impl;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.DocSystem.common.Log;
import com.DocSystem.dao.SystemSettingMapper;
import com.DocSystem.entity.SystemSetting;
import com.DocSystem.service.SystemSettingService;
import com.alibaba.fastjson.JSON;

/**
 * {@link SystemSettingService} 实现。
 *
 * <p>缓存策略：{@code name → value} 的单条短 TTL 缓存（默认 60s），
 * 目的只是避免发送短信这类高频路径每次都打库；任何写操作立即整体失效。
 * 「不存在」也会被缓存（发送路径会连续查多个 key，缺项占多数），
 * 但读表异常<b>不写缓存</b>，以便数据库恢复后立刻生效。
 */
@Service
public class SystemSettingServiceImpl implements SystemSettingService {

	/** 缓存有效期（毫秒） */
	private static final long CACHE_TTL_MS = 60 * 1000L;

	/** 模糊匹配关键字前后的通配符 */
	private static final String LIKE_WILDCARD = "%";

	@Autowired
	private SystemSettingMapper systemSettingMapper;

	private final Map<String, CachedValue> valueCache = new ConcurrentHashMap<String, CachedValue>();

	private static class CachedValue {
		private final String value;
		private final long expireAt;

		CachedValue(String value, long expireAt) {
			this.value = value;
			this.expireAt = expireAt;
		}
	}

	@Override
	public String getValue(String name) {
		if (name == null || name.isEmpty()) {
			return null;
		}

		long now = System.currentTimeMillis();
		CachedValue cached = valueCache.get(name);
		if (cached != null && cached.expireAt > now) {
			return cached.value;
		}

		String value;
		try {
			SystemSetting setting = systemSettingMapper.selectByName(name);
			value = (setting == null) ? null : setting.getValue();
		} catch (Exception e) {
			// 表不存在 / 数据库不可用 / SQL 报错：按「未配置」处理（调用方走兜底链）
			Log.info("SystemSettingService.getValue() 读取配置失败 name:" + name);
			Log.info(e);
			return null;
		}

		if (value != null && value.isEmpty()) {
			value = null;
		}
		valueCache.put(name, new CachedValue(value, now + CACHE_TTL_MS));
		return value;
	}

	@Override
	public <T> T getJson(String name, Class<T> clazz) {
		String value = getValue(name);
		if (value == null || clazz == null) {
			return null;
		}
		try {
			return JSON.parseObject(value, clazz);
		} catch (Exception e) {
			Log.info("SystemSettingService.getJson() 解析 JSON 失败 name:" + name);
			Log.info(e);
			return null;
		}
	}

	@Override
	public int countByPrefix(String prefix) {
		if (prefix == null || prefix.isEmpty()) {
			return 0;
		}
		try {
			return systemSettingMapper.countByPrefix(prefix);
		} catch (Exception e) {
			Log.info("SystemSettingService.countByPrefix() 统计失败 prefix:" + prefix);
			Log.info(e);
			return 0;
		}
	}

	@Override
	public boolean exists(String name) {
		if (name == null || name.trim().isEmpty()) {
			return false;
		}
		try {
			return systemSettingMapper.selectByName(name.trim()) != null;
		} catch (Exception e) {
			Log.info("SystemSettingService.exists() 查询失败 name:" + name);
			Log.info(e);
			// 查询异常时保守返回 true，避免把已有配置误当成新建而覆盖
			return true;
		}
	}

	@Override
	public List<SystemSetting> getAll(String search, int page, int limit) {
		int safeLimit = normalizeLimit(limit);
		int safeOffset = (normalizePage(page) - 1) * safeLimit;
		try {
			return systemSettingMapper.selectList(buildLike(search), safeOffset, safeLimit);
		} catch (Exception e) {
			Log.info("SystemSettingService.getAll() 查询失败");
			Log.info(e);
			return new ArrayList<SystemSetting>();
		}
	}

	@Override
	public int getTotal(String search) {
		try {
			return systemSettingMapper.selectCount(buildLike(search));
		} catch (Exception e) {
			Log.info("SystemSettingService.getTotal() 统计失败");
			Log.info(e);
			return 0;
		}
	}

	@Override
	public boolean set(String name, String value, String remark) {
		if (name == null || name.trim().isEmpty()) {
			return false;
		}

		String trimmedName = name.trim();
		try {
			SystemSetting existing = systemSettingMapper.selectByName(trimmedName);
			SystemSetting setting = new SystemSetting();
			setting.setName(trimmedName);
			setting.setValue(value);
			setting.setRemark(remark);
			setting.setUpdateTime(nowString());
			if (existing == null) {
				setting.setCreateTime(setting.getUpdateTime());
				systemSettingMapper.insert(setting);
			} else {
				systemSettingMapper.updateByName(setting);
			}
			invalidateCache();
			return true;
		} catch (Exception e) {
			Log.info("SystemSettingService.set() 写入失败 name:" + trimmedName);
			Log.info(e);
			return false;
		}
	}

	@Override
	public int setMany(List<SystemSetting> settings) {
		if (settings == null || settings.isEmpty()) {
			return 0;
		}
		int success = 0;
		for (SystemSetting setting : settings) {
			if (setting == null) {
				continue;
			}
			if (set(setting.getName(), setting.getValue(), setting.getRemark())) {
				success++;
			}
		}
		return success;
	}

	@Override
	public boolean seedIfAbsent(String name, String value, String remark) {
		if (name == null || name.trim().isEmpty()) {
			return false;
		}
		if (value == null || value.isEmpty()) {
			// 空值不种：保持「从未配置」语义，运行期继续走硬编码兜底
			return false;
		}

		String trimmedName = name.trim();
		try {
			// 种子判定必须直查数据库（绕开缓存），避免缓存影响「是否已迁移」的判断
			if (systemSettingMapper.selectByName(trimmedName) != null) {
				return false;
			}
			SystemSetting setting = new SystemSetting();
			setting.setName(trimmedName);
			setting.setValue(value);
			setting.setRemark(remark);
			setting.setCreateTime(nowString());
			setting.setUpdateTime(setting.getCreateTime());
			systemSettingMapper.insert(setting);
			invalidateCache();
			return true;
		} catch (Exception e) {
			Log.info("SystemSettingService.seedIfAbsent() 写入失败 name:" + trimmedName);
			Log.info(e);
			return false;
		}
	}

	@Override
	public boolean delete(String name) {
		if (name == null || name.trim().isEmpty()) {
			return false;
		}
		try {
			systemSettingMapper.deleteByName(name.trim());
			invalidateCache();
			return true;
		} catch (Exception e) {
			Log.info("SystemSettingService.delete() 删除失败 name:" + name);
			Log.info(e);
			return false;
		}
	}

	@Override
	public void invalidateCache() {
		valueCache.clear();
	}

	/** 关键字 → LIKE 串（null / 空白 表示不过滤） */
	private String buildLike(String search) {
		if (search == null || search.trim().isEmpty()) {
			return null;
		}
		return LIKE_WILDCARD + search.trim() + LIKE_WILDCARD;
	}

	private int normalizePage(int page) {
		return (page < 1) ? 1 : page;
	}

	private int normalizeLimit(int limit) {
		if (limit < 1) {
			return 20;
		}
		return (limit > 200) ? 200 : limit;
	}

	/**
	 * 当前本地时间串（yyyy-MM-dd HH:mm:ss）。
	 * 时间一律由应用层写入：SQLite 的 CURRENT_TIMESTAMP 是 UTC，直接用会让
	 * 管理页显示的时间比本地时间少 8 小时（已由 JDBC 探针实测确认）。
	 */
	private String nowString() {
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
	}
}
