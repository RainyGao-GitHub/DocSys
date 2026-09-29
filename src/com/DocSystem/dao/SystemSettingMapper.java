package com.DocSystem.dao;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.DocSystem.entity.SystemSetting;

/**
 * system_setting（系统参数键值表）Mapper。
 *
 * <p>包位于 {@code com.DocSystem.dao} —— 已被 MapperScannerConfigurer 扫描
 * （spring-mybatis.xml 的 {@code basePackage} 列表）。
 *
 * <p><b>写入一律用「select → insert/update 两步法</b>」，不用 upsert：
 * MariaDB 的 {@code ON DUPLICATE KEY} 与 SQLite 的 {@code ON CONFLICT} 语法不兼容。
 *
 * <p>分页/LIKE 的模糊匹配串由调用方拼好（{@code %keyword%}、{@code sms.%}）再传入，
 * 避免 CONCAT()（SQLite 无此函数）。
 */
public interface SystemSettingMapper {

	/** 按配置名取单条（不存在 → null） */
	SystemSetting selectByName(@Param("name") String name);

	/** 分页查询；search 需为已拼好通配符的 LIKE 串（可为 null） */
	List<SystemSetting> selectList(@Param("search") String search,
			@Param("offset") int offset,
			@Param("limit") int limit);

	/** 命中总数；search 规则同上 */
	int selectCount(@Param("search") String search);

	/** 以配置名前缀统计（如 "sms.%"），用于「是否已完成首次种子迁移」的判据 */
	int countByPrefix(@Param("prefix") String prefix);

	int insert(SystemSetting setting);

	/**
	 * 按 name 更新 value / remark / update_time。
	 * 时间由应用层写入（不用 CURRENT_TIMESTAMP：SQLite 下它是 UTC，会与本地时间差 8 小时）。
	 */
	int updateByName(SystemSetting setting);

	int deleteByName(@Param("name") String name);
}
