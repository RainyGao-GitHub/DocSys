package com.DocSystem.common;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * 「附加表」的备份 / 导入导出工具 —— 让**不在** {@code BaseController.DBTabNameMap} 里的表
 * （{@code system_setting}、Agent 表）也能像仓库等表一样被自动备份、导出、导入。
 *
 * <p>为什么单独一个类：
 * <ul>
 *   <li>{@code DBTabNameMap} 的下标与 {@code ObjMemberListMap} / {@code objType} 强绑定，
 *       不能往里加表 —— 所以这条链路一律**按表名 + JDBC 元数据**处理，与实体类无关；</li>
 *   <li>不依赖 BaseController 的静态环境（它需要 Web 环境才能初始化），因此可以**离线用临时库单测**。</li>
 * </ul>
 *
 * <p>约定（见 devDocs/系统参数表备份与导入导出方案.md）：
 * <ul>
 *   <li>导出 SQL：{@code insert into 表 (列…) values (…);} —— 与 objType 表导出同样的写法；</li>
 *   <li>导出 JSON：{@code "表名": [ {列:值…}, … ]} —— 与 objType 表同在 docsystem_data.json；</li>
 *   <li>导入：**逐行 INSERT**（决策 D2，与原有导入逻辑一致）；单行失败（唯一键/主键冲突）只记日志跳过，
 *       不影响其它行；灾后恢复到空库即全量导入。</li>
 * </ul>
 *
 * <p>所有异常都只记日志、返回「尽力而为」的结果，绝不抛出 —— 附加表出问题不能让整库备份失败。
 */
public class DBExtraTabBackup {

	private DBExtraTabBackup() {
	}

	// ===================== 导出：SQL =====================

	/** 生成一批表的 INSERT 语句（表不存在则跳过该表，返回空串） */
	public static String buildInsertSqlForTables(Connection conn, List<String> tabList, String encode) {
		String sqlStr = "";
		if (conn == null || tabList == null) {
			return sqlStr;
		}
		boolean mysqlDialect = !isSQLiteConnection(conn);
		for (String tabName : tabList) {
			sqlStr += buildTableInsertSql(conn, tabName, mysqlDialect, encode);
		}
		return sqlStr;
	}

	/** 生成单表的 INSERT 语句（列名/列数取自 ResultSetMetaData，值按方言转义） */
	public static String buildTableInsertSql(Connection conn, String tabName, boolean mysqlDialect, String encode) {
		String sqlStr = "";
		Statement stmt = null;
		ResultSet rs = null;
		try {
			stmt = conn.createStatement();
			rs = stmt.executeQuery("select * from " + tabName);
			ResultSetMetaData meta = rs.getMetaData();
			int colCount = meta.getColumnCount();

			String columns = "";
			for (int i = 1; i <= colCount; i++) {
				columns += (i > 1 ? "," : "") + "`" + meta.getColumnName(i) + "`";
			}

			int rowCount = 0;
			while (rs.next()) {
				String values = "";
				for (int i = 1; i <= colCount; i++) {
					Object value = rs.getObject(i);
					values += (i > 1 ? "," : "");
					if (value == null) {
						values += "NULL";
					} else {
						values += "'" + encodeString(escapeSqlValue(value.toString(), mysqlDialect), encode) + "'";
					}
				}
				sqlStr += "insert into " + tabName + " (" + columns + ") values (" + values + ");\r\n";
				rowCount++;
			}
			Log.info("DBExtraTabBackup " + tabName + " 导出 " + rowCount + " 行");
		} catch (Exception e) {
			//表不存在是正常情况（老库 / 该功能尚未建表），只记 info
			Log.info("DBExtraTabBackup 跳过表 " + tabName + ": " + e.getMessage());
		} finally {
			closeStatement(stmt, rs);
		}
		return sqlStr;
	}

	/**
	 * SQL 字符串字面量转义（**方言相关**）。
	 *
	 * <p>注意不能照搬 {@code BaseController.convertToSqlValue}：那个只做 MySQL 风格的
	 * 反斜杠转义（{@code \'}），在 SQLite 上会写进多余的反斜杠。
	 *
	 * <ul>
	 *   <li>所有方言：{@code '} → {@code ''}（标准 SQL，MySQL 也接受）</li>
	 *   <li>MySQL/MariaDB：额外 {@code \} → {@code \\}（其默认开启反斜杠转义）—— 必须先转反斜杠</li>
	 * </ul>
	 */
	public static String escapeSqlValue(String value, boolean mysqlDialect) {
		if (value == null) {
			return null;
		}
		String escaped = value;
		if (mysqlDialect) {
			escaped = escaped.replace("\\", "\\\\");
		}
		escaped = escaped.replace("'", "''");
		return escaped;
	}

	// ===================== 导出：JSON =====================

	/** 生成一批表的 JSON 片段（{@code "表名":[…],} 形式，可直接拼进 docsystem_data.json） */
	public static String buildJsonFragmentForTables(Connection conn, List<String> tabList) {
		String jsonStr = "";
		if (conn == null || tabList == null) {
			return jsonStr;
		}
		for (String tabName : tabList) {
			List<JSONObject> rows = queryTableAsJsonObjectList(conn, tabName);
			if (rows == null) {
				continue;
			}
			jsonStr += tabName + ":" + JSON.toJSONString(rows) + ",\r\n";
			Log.info("DBExtraTabBackup " + tabName + " 导出 " + rows.size() + " 行");
		}
		return jsonStr;
	}

	/** 按表名把整表读成 JSONObject 列表（表不存在 / 读取失败 → null） */
	public static List<JSONObject> queryTableAsJsonObjectList(Connection conn, String tabName) {
		Statement stmt = null;
		ResultSet rs = null;
		List<JSONObject> rows = new ArrayList<JSONObject>();
		try {
			stmt = conn.createStatement();
			rs = stmt.executeQuery("select * from " + tabName);
			ResultSetMetaData meta = rs.getMetaData();
			int colCount = meta.getColumnCount();
			while (rs.next()) {
				JSONObject row = new JSONObject();
				for (int i = 1; i <= colCount; i++) {
					row.put(meta.getColumnName(i), rs.getObject(i));
				}
				rows.add(row);
			}
			return rows;
		} catch (Exception e) {
			Log.info("DBExtraTabBackup 跳过表 " + tabName + ": " + e.getMessage());
			return null;
		} finally {
			closeStatement(stmt, rs);
		}
	}

	// ===================== 导入 =====================

	/**
	 * 从 docsystem_data.json 解析出的对象里导入附加表。
	 *
	 * @return 成功导入的行数（各表合计）
	 */
	public static int importFromJson(Connection conn, List<String> tabList, JSONObject jobj) {
		int totalImported = 0;
		if (conn == null || tabList == null || jobj == null) {
			return totalImported;
		}
		for (String tabName : tabList) {
			JSONArray list = jobj.getJSONArray(tabName);
			if (list == null || list.size() == 0) {
				continue;
			}
			int okCount = 0;
			int skipCount = 0;
			for (int i = 0; i < list.size(); i++) {
				JSONObject row = list.getJSONObject(i);
				if (row == null || row.isEmpty()) {
					continue;
				}
				if (insertRow(conn, tabName, row)) {
					okCount++;
				} else {
					skipCount++;
				}
			}
			totalImported += okCount;
			Log.info("DBExtraTabBackup " + tabName + " 导入 " + okCount + " 行，跳过 " + skipCount + " 行");
		}
		return totalImported;
	}

	/** 用 PreparedStatement 插入一行（列名来自 JSON key；避免手拼字面量的转义问题） */
	public static boolean insertRow(Connection conn, String tabName, JSONObject row) {
		PreparedStatement ps = null;
		try {
			String columns = "";
			String placeholders = "";
			for (String column : row.keySet()) {
				columns += (columns.isEmpty() ? "" : ",") + "`" + column + "`";
				placeholders += (placeholders.isEmpty() ? "" : ",") + "?";
			}
			if (columns.isEmpty()) {
				return false;
			}
			ps = conn.prepareStatement("insert into " + tabName + " (" + columns + ") values (" + placeholders + ")");
			int index = 1;
			for (String column : row.keySet()) {
				ps.setObject(index++, row.get(column));
			}
			ps.executeUpdate();
			return true;
		} catch (Exception e) {
			//目标库已有同名行（唯一键/主键冲突）等：跳过该行，继续后面的行
			Log.info("DBExtraTabBackup 跳过 " + tabName + " 的一行: " + e.getMessage());
			return false;
		} finally {
			try {
				if (ps != null) {
					ps.close();
				}
			} catch (Exception e) {
				Log.info(e);
			}
		}
	}

	// ===================== 内部工具 =====================

	/** 连接是否为 SQLite（按元数据判断，不依赖 DB_TYPE 是否已就绪） */
	public static boolean isSQLiteConnection(Connection conn) {
		try {
			String product = conn.getMetaData().getDatabaseProductName();
			return (product != null && product.toLowerCase().contains("sqlite"));
		} catch (Exception e) {
			Log.info(e);
		}
		return false;
	}

	/** 与 BaseController.enocdeString 同语义：按目标编码重写字符串（encode 为 null 时原样返回） */
	private static String encodeString(String str, String encode) {
		if (encode != null) {
			try {
				return new String(str.getBytes(), encode);
			} catch (Exception e) {
				Log.info(e);
			}
		}
		return str;
	}

	private static void closeStatement(Statement stmt, ResultSet rs) {
		try {
			if (rs != null) {
				rs.close();
			}
		} catch (Exception e) {
			Log.info(e);
		}
		try {
			if (stmt != null) {
				stmt.close();
			}
		} catch (Exception e) {
			Log.info(e);
		}
	}
}
