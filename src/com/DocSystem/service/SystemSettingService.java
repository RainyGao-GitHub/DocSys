package com.DocSystem.service;

import java.util.List;

import com.DocSystem.entity.SystemSetting;

/**
 * 通用系统参数读写服务（表 {@code system_setting}）。
 *
 * <p>定位：系统级配置的<b>唯一权威源</b>。老 properties 只在「首次启用」时作一次性种子数据
 * （见 {@link #seedIfAbsent}），之后不再参与运行期决策。
 *
 * <p>容错约定：所有读方法<b>绝不抛异常</b> —— 表不存在 / 数据库不可用 / SQL 报错时
 * 记日志并返回 null（0 / 空列表），由调用方按自己的兜底链处理，
 * 保证建表失败或降级场景下系统仍能启动与运行。
 */
public interface SystemSettingService {

	/**
	 * 取配置值（不存在 / 读表异常 / 空串 → null）。
	 * 带短 TTL 内存缓存；写操作会立即失效缓存。
	 */
	String getValue(String name);

	/**
	 * 取配置值并按 JSON 反序列化为对象（值为空 / 解析失败 → null）。
	 *
	 * @param clazz 目标类型（可用 fastjson 支持的任意类型，如 Map.class）
	 */
	<T> T getJson(String name, Class<T> clazz);

	/** 以配置名前缀统计条数（prefix 需自带通配符，如 "sms.%"）；异常 → 0 */
	int countByPrefix(String prefix);

	/** 分页查询（search 为关键字纯文本，方法内部拼通配符；page 从 1 开始） */
	List<SystemSetting> getAll(String search, int page, int limit);

	/** 命中总数（search 规则同上） */
	int getTotal(String search);

	/**
	 * 写入配置（不存在则插入，存在则更新 value/remark）。
	 * 不用 upsert —— MariaDB 与 SQLite 语法不兼容，统一走 select→insert/update 两步法。
	 */
	boolean set(String name, String value, String remark);

	/** 批量写入，返回成功条数 */
	int setMany(List<SystemSetting> settings);

	/**
	 * 首次种子写入：仅当该配置名<b>在表中不存在</b>且 value 非空时插入。
	 * 用于「首次启用某功能时，把老 properties 的值搬进表」，幂等可重复调用。
	 *
	 * @return true 表示本次真的插入了
	 */
	boolean seedIfAbsent(String name, String value, String remark);

	boolean delete(String name);

	void invalidateCache();
}
