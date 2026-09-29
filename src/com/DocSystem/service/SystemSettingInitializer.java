package com.DocSystem.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.Log;

/**
 * {@code system_setting}（系统参数键值表）建表器。
 *
 * <p>做法与时机完全对齐 DocSysAgent 的 {@code com.DocSystem.agent.config.DatabaseInitializer}：
 * <ul>
 *   <li><b>幂等</b>：{@code CREATE TABLE IF NOT EXISTS}，可重复执行；</li>
 *   <li><b>双方言</b>：按 JDBC 元数据判定 SQLite / MariaDB，各用一套 DDL
 *       （SQLite 不支持 {@code COMMENT}、{@code ON UPDATE CURRENT_TIMESTAMP}）；</li>
 *   <li><b>缺表检测</b>：SQLite 查 {@code sqlite_master}，MariaDB 查 {@code information_schema}；</li>
 *   <li><b>时机</b>：由 {@code docSysInit()} 成功路径经 BaseController 的
 *       {@code triggerSystemSettingInit()} 触发 —— DocSys 采用延迟初始化，数据库可能
 *       在容器启动时尚未创建，因此不能在 {@code @PostConstruct} / 静态块里抢跑。</li>
 * </ul>
 *
 * <p>失败一律只记日志、不外抛：建表失败不得影响 DocSys 启动，配置读取会自动走兜底。
 *
 * <p>该表<b>不并入</b> BaseController.DBTabNameMap（后者与 ObjMemberListMap / objType 索引
 * 强绑定，新增表会破坏既有映射），而是走独立 Mapper 手写 SQL。
 *
 * <p>本类放在 {@code com.DocSystem.service} 包内，是因为该包由 root 容器扫描
 * （spring-mybatis.xml），便于 {@code ContextLoader.getCurrentWebApplicationContext().getBean(...)}
 * 取得 bean（与 AgentInitService 同一套路）。
 */
@Component
public class SystemSettingInitializer {

	private static final String TABLE_NAME = "system_setting";

	/** MariaDB / MySQL 方言 DDL（时间列由应用层写入，故无 ON UPDATE CURRENT_TIMESTAMP） */
	private static final String DDL_MARIADB =
			"CREATE TABLE IF NOT EXISTS system_setting ("
			+ "id BIGINT PRIMARY KEY AUTO_INCREMENT,"
			+ "`name` VARCHAR(128) NOT NULL COMMENT '配置名(点分命名空间,如 sms.provider)',"
			+ "`value` LONGTEXT COMMENT '配置值(字符串,可存 JSON 等任意格式)',"
			+ "remark VARCHAR(1024) COMMENT '备注',"
			+ "create_time VARCHAR(32) COMMENT '创建时间(yyyy-MM-dd HH:mm:ss)',"
			+ "update_time VARCHAR(32) COMMENT '更新时间',"
			+ "UNIQUE KEY uk_system_setting_name (`name`)"
			+ ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统参数(键值对)'";

	/** SQLite 方言 DDL */
	private static final String DDL_SQLITE =
			"CREATE TABLE IF NOT EXISTS system_setting ("
			+ "id INTEGER PRIMARY KEY AUTOINCREMENT,"
			+ "`name` VARCHAR(128) NOT NULL,"
			+ "`value` TEXT,"
			+ "remark VARCHAR(1024),"
			+ "create_time VARCHAR(32),"
			+ "update_time VARCHAR(32),"
			+ "UNIQUE (`name`)"
			+ ")";

	@Autowired
	private DataSource dataSource;

	/**
	 * 确保 {@code system_setting} 表存在（幂等）。
	 * 任何异常只记日志，绝不外抛 —— 不能影响 DocSys 启动。
	 */
	public void init() {
		Connection conn = null;
		try {
			conn = dataSource.getConnection();
			boolean sqlite = isSQLite(conn);

			if (tableExists(conn, sqlite)) {
				// 用 info 而非 debug：每次启动一条，便于运维确认建表器与幂等性
				Log.info("system_setting 表已存在，无需建表");
				return;
			}

			createTable(conn, sqlite);
			Log.info("system_setting 表创建成功（方言：" + (sqlite ? "sqlite" : "mariadb/mysql") + "）");
		} catch (Exception e) {
			Log.error("system_setting 建表失败（不影响 DocSys 启动，配置读取会自动兜底）: " + e.getMessage(), e);
		} finally {
			closeQuietly(conn);
		}
	}

	/**
	 * 按连接元数据判定 SQLite。
	 *
	 * <p>不依赖 BaseController.DB_TYPE：它是包级字段且可能尚未就绪，
	 * 而连接元数据任何时候都是准确的。
	 */
	private boolean isSQLite(Connection conn) {
		try {
			String product = conn.getMetaData().getDatabaseProductName();
			if (product != null && product.toLowerCase().contains("sqlite")) {
				return true;
			}
		} catch (SQLException e) {
			Log.warn("无法读取数据库产品名，按 MariaDB/MySQL 处理: " + e.getMessage());
		}
		return false;
	}

	private boolean tableExists(Connection conn, boolean sqlite) throws SQLException {
		if (sqlite) {
			String sql = "SELECT `name` FROM sqlite_master WHERE type='table' AND `name` = ?";
			PreparedStatement ps = null;
			ResultSet rs = null;
			try {
				ps = conn.prepareStatement(sql);
				ps.setString(1, TABLE_NAME);
				rs = ps.executeQuery();
				return rs.next();
			} finally {
				closeQuietly(rs);
				closeQuietly(ps);
			}
		}

		String databaseName = getDatabaseName(conn);
		String sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
		PreparedStatement ps = null;
		ResultSet rs = null;
		try {
			ps = conn.prepareStatement(sql);
			ps.setString(1, databaseName);
			ps.setString(2, TABLE_NAME);
			rs = ps.executeQuery();
			return rs.next();
		} finally {
			closeQuietly(rs);
			closeQuietly(ps);
		}
	}

	/** 当前数据库名（仅 MariaDB/MySQL 有意义） */
	private String getDatabaseName(Connection conn) {
		PreparedStatement ps = null;
		ResultSet rs = null;
		try {
			ps = conn.prepareStatement("SELECT DATABASE()");
			rs = ps.executeQuery();
			if (rs.next()) {
				return rs.getString(1);
			}
		} catch (SQLException e) {
			Log.warn("无法读取当前数据库名: " + e.getMessage());
		} finally {
			closeQuietly(rs);
			closeQuietly(ps);
		}
		return null;
	}

	private void createTable(Connection conn, boolean sqlite) throws SQLException {
		String ddl = sqlite ? DDL_SQLITE : DDL_MARIADB;
		PreparedStatement ps = null;
		try {
			ps = conn.prepareStatement(ddl);
			ps.executeUpdate();
			Log.debug("已执行 CREATE TABLE: " + TABLE_NAME);
		} finally {
			closeQuietly(ps);
		}
	}

	private void closeQuietly(AutoCloseable closeable) {
		if (closeable == null) {
			return;
		}
		try {
			closeable.close();
		} catch (Exception e) {
			Log.debug("关闭资源失败: " + e.getMessage());
		}
	}
}
