package com.DocSystem.common;

import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户名单批量导入：文件解析（CSV/XLS/XLSX/WPS ET）+ 列名别名映射 + 值规范化。
 *
 * <p>本类只做「文件 → 结构化行」的转换，<b>不含任何业务校验</b>（账号重复、越权、证书用户数上限、
 * 手机/邮箱唯一性等一律复用 {@code ManageController.addUser} 的既有逻辑），因此可以脱离 Spring
 * 容器（脱库）直接用命令行探针验证解析结果。</p>
 *
 * <p>设计要点见 {@code devDocs/用户批量导入方案.md}：
 * 列名兼容靠「归一化 + 别名表 + 忽略未知列」；解析要能兼容旧「导出用户」文件
 * （字符串值尾随 \t、含 serialVersionUID 等未知列、行尾多一个空列）。</p>
 */
public class UserListImporter {

	/********************** 上限与长度常量 **********************/

	/** 上传文件大小上限（5MB，D7） */
	public static final long MAX_FILE_SIZE = 5 * 1024 * 1024L;
	/** 数据行数上限（不表头，D7） */
	public static final int MAX_ROWS = 5000;
	/** 结果明细（失败/跳过）单类最多回传的条数，超出只报总数 */
	public static final int MAX_DETAIL_ROWS = 500;

	// 与 user 表 DDL 一致（BaseController 建表语句），导入前必须校验，否则严格模式报错/非严格模式静默截断
	public static final int MAX_LEN_NAME = 40;
	public static final int MAX_LEN_PWD = 40;
	public static final int MAX_LEN_REAL_NAME = 50;
	public static final int MAX_LEN_NICK_NAME = 50;
	public static final int MAX_LEN_EMAIL = 50;
	public static final int MAX_LEN_TEL = 20;

	/** 导入模板列头（中文为权威定义，模板下载与别名表共用，避免两处漂移，D8） */
	public static final String[] TEMPLATE_HEADERS = { "用户名", "密码", "名字", "昵称", "手机", "邮箱", "角色" };
	/** 模板示例行（前端提示用户「请替换或删除示例行」） */
	public static final String[] TEMPLATE_EXAMPLE = { "zhangsan", "", "张三", "小张", "13800000000", "zhangsan@example.com", "普通用户" };

	/** 普通用户 / 管理员 / 超级管理员（与 User.type 一致） */
	public static final Integer USER_TYPE_NORMAL = Integer.valueOf(0);
	public static final Integer USER_TYPE_ADMIN = Integer.valueOf(1);
	public static final Integer USER_TYPE_SUPER_ADMIN = Integer.valueOf(2);

	/********************** 解析结果模型 **********************/

	/** 原始表格（表头 + 数据行，值已 trim） */
	public static class Table {
		public List<String> headers = new ArrayList<String>();
		public List<List<String>> rows = new ArrayList<List<String>>();
		public String charsetName = "";
		public String formatName = "";
	}

	/** 规范化后的一行用户数据（业务校验在 Controller 里做） */
	public static class RowUser {
		public int rowNumber;			// 文件里的行号（含表头行，从 1 开始，便于用户定位）
		public String name = "";
		public String pwd = "";
		public String realName = "";
		public String nickName = "";
		public String tel = "";
		public String email = "";
		public Integer type;			// null = 未提供（按普通用户）；-1 = 无法识别（该行报错）
		public String roleRaw = "";		// 角色列的原始文本（报错提示用）

		public boolean roleInvalid() {
			return type != null && type.intValue() < 0;
		}
	}

	/** 解析结果 */
	public static class Result {
		public boolean ok = false;
		public String error = null;					// 文件级错误（格式/编码/表头/超限）
		public Table table = null;
		public List<RowUser> users = new ArrayList<RowUser>();
		public String mappedColumns = "";			// 已识别的列（日志/提示用）
		public List<String> warnings = new ArrayList<String>();
	}

	/** 文件级解析异常（消息直接面向用户） */
	private static class ParseException extends Exception {
		private static final long serialVersionUID = 1L;
		ParseException(String msg) { super(msg); }
	}

	/********************** 字段与列名别名 **********************/

	public static final String FIELD_NAME = "name";
	public static final String FIELD_PWD = "pwd";
	public static final String FIELD_REAL_NAME = "realName";
	public static final String FIELD_NICK_NAME = "nickName";
	public static final String FIELD_TEL = "tel";
	public static final String FIELD_EMAIL = "email";
	public static final String FIELD_TYPE = "type";

	/** 主别名：归一化后的列名 → 字段 */
	private static final Map<String, String> ALIAS_PRIMARY = new HashMap<String, String>();
	/** 次级别名：只有当该字段没有任何主别名命中时才使用（避免「工号」抢占「用户名」） */
	private static final Map<String, String> ALIAS_SECONDARY = new HashMap<String, String>();
	/** 字段的展示名（报错提示用） */
	private static final Map<String, String> FIELD_LABELS = new LinkedHashMap<String, String>();

	static {
		FIELD_LABELS.put(FIELD_NAME, "用户名（账号）");
		FIELD_LABELS.put(FIELD_PWD, "密码");
		FIELD_LABELS.put(FIELD_REAL_NAME, "名字");
		FIELD_LABELS.put(FIELD_NICK_NAME, "昵称");
		FIELD_LABELS.put(FIELD_TEL, "手机");
		FIELD_LABELS.put(FIELD_EMAIL, "邮箱");
		FIELD_LABELS.put(FIELD_TYPE, "角色");

		// 账号（必填）
		addAlias(ALIAS_PRIMARY, FIELD_NAME, "用户名", "帐号", "账号", "用户", "登录名", "登录账号", "登录帐号", "登录用户",
				"name", "username", "user", "loginname", "login", "loginid", "account", "useraccount", "userid", "usercode", "code");
		// 密码（可选）
		addAlias(ALIAS_PRIMARY, FIELD_PWD, "密码", "登录密码", "初始密码", "用户密码", "passwd", "password", "pwd", "pass");
		// 名字
		addAlias(ALIAS_PRIMARY, FIELD_REAL_NAME, "名字", "姓名", "真实姓名", "真实名", "员工姓名", "人员姓名",
				"realname", "truename", "displayname", "fullname");
		// 昵称
		addAlias(ALIAS_PRIMARY, FIELD_NICK_NAME, "昵称", "显示名", "显示名称", "nickname", "nick");
		// 手机
		addAlias(ALIAS_PRIMARY, FIELD_TEL, "手机", "手机号", "手机号码", "电话", "联系电话", "手机电话",
				"tel", "telephone", "mobile", "mobilephone", "mobileno", "phone", "phonenumber", "cellphone", "cell");
		// 邮箱
		addAlias(ALIAS_PRIMARY, FIELD_EMAIL, "邮箱", "电子邮箱", "邮件", "电子邮件", "邮件地址", "邮箱地址",
				"email", "mail", "mailbox", "emailaddress", "mailaddress");
		// 角色
		addAlias(ALIAS_PRIMARY, FIELD_TYPE, "角色", "用户类型", "用户角色", "权限", "用户级别", "级别", "身份",
				"type", "role", "usertype", "userrole", "userlevel", "level", "privilege", "authority");

		// 次级别名：仅在没有主别名命中时启用
		addAlias(ALIAS_SECONDARY, FIELD_NAME, "工号", "员工号", "员工编号", "编号", "人员编号", "employeeid", "employeeno", "staffid", "staffno", "jobnumber");
		addAlias(ALIAS_SECONDARY, FIELD_REAL_NAME, "人员名称", "员工名称");
		addAlias(ALIAS_SECONDARY, FIELD_TEL, "联系方式", "手机1", "mobile1");
	}

	private static void addAlias(Map<String, String> map, String field, String... aliases) {
		for (int i = 0; i < aliases.length; i++) {
			map.put(normalizeHeader(aliases[i]), field);
		}
	}

	/********************** 对外入口 **********************/

	/**
	 * 解析上传的用户名单文件。
	 * 文件级错误（格式不支持/编码无法识别/表头缺账号列/超限）返回 {@code ok=false} + {@code error}。
	 */
	public static Result parse(MultipartFile file) {
		Result ret = new Result();

		if (file == null || file.isEmpty()) {
			ret.error = "请选择要导入的文件！";
			return ret;
		}
		if (file.getSize() > MAX_FILE_SIZE) {
			ret.error = "文件过大（" + formatSize(file.getSize()) + "），请控制在 5MB 以内！";
			return ret;
		}

		String fileName = (file.getOriginalFilename() == null) ? "" : file.getOriginalFilename();
		String suffix = getSuffix(fileName);

		byte[] bytes = null;
		try {
			bytes = file.getBytes();
		} catch (Exception e) {
			ret.error = "读取上传文件失败：" + e.getMessage();
			return ret;
		}

		Table table = null;
		try {
			if ("csv".equals(suffix) || "txt".equals(suffix)) {
				table = readCsv(bytes);
			} else if ("xls".equals(suffix) || "xlsx".equals(suffix) || "et".equals(suffix) || "ett".equals(suffix)) {
				table = readExcel(bytes, suffix);
			} else {
				throw new ParseException("不支持的文件格式（" + (suffix.isEmpty() ? "无扩展名" : suffix)
						+ "），请使用 CSV / XLS / XLSX / ET 文件！");
			}
		} catch (ParseException pe) {
			ret.error = pe.getMessage();
			return ret;
		} catch (Exception e) {
			//POI/IO 的原始异常信息是英文且面向开发（如 "Your InputStream was neither an OLE2 stream"）→ 只进日志，
			//给用户的是可操作的提示
			Log.info("UserListImporter.parse 解析异常: " + e.getMessage());
			ret.error = "文件解析失败，请确认文件是有效的 CSV / XLS / XLSX 文件（WPS 表格请另存为 xlsx 后重试）";
			return ret;
		}

		if (table.headers.isEmpty()) {
			ret.error = "文件内容为空，或者首行不是列名！";
			return ret;
		}
		if (table.rows.size() > MAX_ROWS) {
			ret.error = "数据行数（" + table.rows.size() + "）超过上限 " + MAX_ROWS + " 行，请拆分后分批导入！";
			return ret;
		}

		//列名映射
		Map<String, Integer> columns = mapColumns(table.headers);
		if (columns.get(FIELD_NAME) == null) {
			ret.error = "未找到「" + FIELD_LABELS.get(FIELD_NAME) + "」列，请检查首行列名。"
					+ "支持列名（示例）：" + expectedColumnHint();
			return ret;
		}

		//逐行取值 + 规范化
		for (int i = 0; i < table.rows.size(); i++) {
			List<String> row = table.rows.get(i);
			RowUser user = new RowUser();
			user.rowNumber = i + 2;			//+1 表头 +1 从 1 开始
			user.name = getCell(row, columns, FIELD_NAME);
			user.pwd = getCell(row, columns, FIELD_PWD);
			user.realName = getCell(row, columns, FIELD_REAL_NAME);
			user.nickName = getCell(row, columns, FIELD_NICK_NAME);
			user.tel = cleanTel(getCell(row, columns, FIELD_TEL));
			user.email = cleanEmail(getCell(row, columns, FIELD_EMAIL));
			user.roleRaw = getCell(row, columns, FIELD_TYPE);
			user.type = parseUserType(user.roleRaw);
			ret.users.add(user);
		}

		ret.table = table;
		ret.mappedColumns = describeMappedColumns(columns, table.headers);
		ret.ok = true;
		return ret;
	}

	/** 表头里没找到账号列时的提示：把主别名列几个常见的出来 */
	private static String expectedColumnHint() {
		return "「用户名 / 账号 / name / username / login」等（中英文均可，位置任意，多余的列会被忽略）";
	}

	/** 生成导入模板内容（CSV 文本，UTF-8 + BOM，D8） */
	public static String buildTemplateCsv() {
		StringBuffer sb = new StringBuffer();
		sb.append('\uFEFF');
		sb.append(joinCsv(TEMPLATE_HEADERS)).append("\r\n");
		sb.append(joinCsv(TEMPLATE_EXAMPLE)).append("\r\n");
		return sb.toString();
	}

	private static String joinCsv(String[] values) {
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < values.length; i++) {
			if (i > 0) {
				sb.append(',');
			}
			sb.append(csvField(values[i]));
		}
		return sb.toString();
	}

	private static String csvField(String value) {
		if (value == null) {
			return "";
		}
		if (value.indexOf(',') >= 0 || value.indexOf('"') >= 0 || value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0) {
			return "\"" + value.replace("\"", "\"\"") + "\"";
		}
		return value;
	}

	/********************** 字段内容校验（供 Controller 调用） **********************/

	/** 字段长度校验（与 user 表 DDL 一致）；返回 null 表示通过 */
	public static String checkFieldLengths(RowUser user) {
		String err = checkLength(user.name, MAX_LEN_NAME, "用户名");
		if (err != null) { return err; }
		err = checkLength(user.pwd, MAX_LEN_PWD, "密码");
		if (err != null) { return err; }
		err = checkLength(user.realName, MAX_LEN_REAL_NAME, "名字");
		if (err != null) { return err; }
		err = checkLength(user.nickName, MAX_LEN_NICK_NAME, "昵称");
		if (err != null) { return err; }
		err = checkLength(user.tel, MAX_LEN_TEL, "手机");
		if (err != null) { return err; }
		err = checkLength(user.email, MAX_LEN_EMAIL, "邮箱");
		if (err != null) { return err; }
		return null;
	}

	private static String checkLength(String value, int max, String label) {
		if (value == null || value.isEmpty()) {
			return null;
		}
		int len = value.length();
		if (len > max) {
			return label + "过长（" + len + " 字符，最多 " + max + " 字符）";
		}
		return null;
	}

	/** 角色文本 → 数字；null = 未提供（按普通用户）；-1 = 无法识别 */
	public static Integer parseUserType(String text) {
		if (text == null) {
			return null;
		}
		String v = text.trim();
		if (v.isEmpty()) {
			return null;
		}
		//去掉「用户」后缀便于匹配（如「普通用户」→「普通」）
		String key = normalizeHeader(v);

		if ("0".equals(key) || "普通".equals(key) || "普通用户".equals(key) || "一般用户".equals(key) || "member".equals(key) || "user".equals(key) || "normal".equals(key)) {
			return USER_TYPE_NORMAL;
		}
		if ("1".equals(key) || "管理员".equals(key) || "admin".equals(key) || "administrator".equals(key) || "manager".equals(key)) {
			return USER_TYPE_ADMIN;
		}
		if ("2".equals(key) || "超级管理员".equals(key) || "超管".equals(key) || "系统管理员".equals(key)
				|| "superadmin".equals(key) || "super".equals(key) || "root".equals(key)) {
			return USER_TYPE_SUPER_ADMIN;
		}
		return Integer.valueOf(-1);
	}

	/********************** 表头映射 **********************/

	/** 归一化列名：去 BOM/空白，转小写，去掉空格与常见分隔符 */
	public static String normalizeHeader(String header) {
		if (header == null) {
			return "";
		}
		String s = header.replace("\uFEFF", "").trim().toLowerCase();
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (c == ' ' || c == '\t' || c == '_' || c == '-' || c == '.' || c == '(' || c == ')' || c == '（' || c == '）'
					|| c == ':' || c == '：' || c == '*' || c == '【' || c == '】' || c == '[' || c == ']' || c == '"' || c == '\'') {
				continue;
			}
			sb.append(c);
		}
		return sb.toString();
	}

	/** 列名 → 字段下标映射（主别名优先，其次才用次级别名；未知列忽略） */
	public static Map<String, Integer> mapColumns(List<String> headers) {
		Map<String, Integer> primary = new HashMap<String, Integer>();
		Map<String, Integer> secondary = new HashMap<String, Integer>();

		for (int i = 0; i < headers.size(); i++) {
			String key = normalizeHeader(headers.get(i));
			if (key.isEmpty()) {
				continue;
			}
			String field = ALIAS_PRIMARY.get(key);
			if (field != null) {
				if (primary.get(field) == null) {
					primary.put(field, Integer.valueOf(i));
				}
				continue;
			}
			field = ALIAS_SECONDARY.get(key);
			if (field != null && secondary.get(field) == null) {
				secondary.put(field, Integer.valueOf(i));
			}
		}

		Map<String, Integer> ret = new HashMap<String, Integer>(primary);
		for (Map.Entry<String, Integer> entry : secondary.entrySet()) {
			if (ret.get(entry.getKey()) == null) {
				ret.put(entry.getKey(), entry.getValue());
			}
		}
		return ret;
	}

	private static String describeMappedColumns(Map<String, Integer> columns, List<String> headers) {
		StringBuffer sb = new StringBuffer();
		for (Map.Entry<String, String> entry : FIELD_LABELS.entrySet()) {
			Integer idx = columns.get(entry.getKey());
			if (idx == null) {
				continue;
			}
			if (sb.length() > 0) {
				sb.append(", ");
			}
			String raw = (idx.intValue() < headers.size()) ? headers.get(idx.intValue()) : "";
			sb.append(entry.getValue() + "←" + raw.trim());
		}
		return sb.toString();
	}

	private static String getCell(List<String> row, Map<String, Integer> columns, String field) {
		Integer idx = columns.get(field);
		if (idx == null || row == null) {
			return "";
		}
		int i = idx.intValue();
		if (i < 0 || i >= row.size()) {
			return "";
		}
		String v = row.get(i);
		return (v == null) ? "" : v.trim();
	}

	/********************** CSV 解析 **********************/

	private static Table readCsv(byte[] bytes) throws Exception {
		Table table = new Table();
		table.formatName = "CSV";

		DecodedText decoded = decodeText(bytes);
		table.charsetName = decoded.charsetName;

		List<List<String>> records = parseCsvRecords(decoded.text);

		//跳过表头之前的空记录
		int start = 0;
		while (start < records.size() && isBlankRecord(records.get(start))) {
			start++;
		}
		if (start >= records.size()) {
			return table;
		}
		table.headers = records.get(start);
		for (int i = start + 1; i < records.size(); i++) {
			List<String> record = records.get(i);
			if (isBlankRecord(record)) {
				continue;				//全空行：忽略（含文件末尾的换行）
			}
			table.rows.add(record);
		}
		return table;
	}

	private static boolean isBlankRecord(List<String> record) {
		for (int i = 0; i < record.size(); i++) {
			String v = record.get(i);
			if (v != null && !v.isEmpty()) {
				return false;
			}
		}
		return true;
	}

	/** 编码识别：BOM 优先 → 严格 UTF-8 试解 → 回退 GBK（Excel 另存的中文 CSV 默认是 GBK） */
	private static DecodedText decodeText(byte[] bytes) {
		DecodedText ret = new DecodedText();

		//UTF-8 BOM
		if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xEF && (bytes[1] & 0xFF) == 0xBB && (bytes[2] & 0xFF) == 0xBF) {
			ret.charsetName = "UTF-8(BOM)";
			ret.text = new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8);
			return ret;
		}
		//UTF-16 BOM
		if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xFE) {
			ret.charsetName = "UTF-16LE(BOM)";
			ret.text = new String(bytes, 2, bytes.length - 2, StandardCharsets.UTF_16LE);
			return ret;
		}
		if (bytes.length >= 2 && (bytes[0] & 0xFF) == 0xFE && (bytes[1] & 0xFF) == 0xFF) {
			ret.charsetName = "UTF-16BE(BOM)";
			ret.text = new String(bytes, 2, bytes.length - 2, StandardCharsets.UTF_16BE);
			return ret;
		}

		//严格 UTF-8（字节序列非法会抛异常 → 说明不是 UTF-8）
		try {
			CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
					.onMalformedInput(CodingErrorAction.REPORT)
					.onUnmappableCharacter(CodingErrorAction.REPORT);
			CharBufferHolder holder = new CharBufferHolder();
			ret.text = decodeStrict(decoder, bytes, holder);
			ret.charsetName = "UTF-8";
			return ret;
		} catch (CharacterCodingException e) {
			//不是 UTF-8
		}

		//回退 GBK（中文 Windows/Excel 的默认编码）
		ret.charsetName = "GBK";
		ret.text = new String(bytes, Charset.forName("GBK"));
		return ret;
	}

	private static class CharBufferHolder { }

	private static String decodeStrict(CharsetDecoder decoder, byte[] bytes, CharBufferHolder holder) throws CharacterCodingException {
		ByteBuffer in = ByteBuffer.wrap(bytes);
		return decoder.decode(in).toString();
	}

	private static class DecodedText {
		String text = "";
		String charsetName = "";
	}

	/** 分隔符启发：取首行（引号外）出现最多的那个 */
	private static char detectDelimiter(String text) {
		int lineEnd = text.length();
		boolean inQ = false;
		for (int i = 0; i < text.length(); i++) {
			char c = text.charAt(i);
			if (c == '"') {
				inQ = !inQ;
			} else if (!inQ && (c == '\r' || c == '\n')) {
				lineEnd = i;
				break;
			}
		}
		String line = text.substring(0, lineEnd);
		char[] candidates = { ',', ';', '\t' };
		char best = ',';
		int bestCount = 0;
		for (int i = 0; i < candidates.length; i++) {
			int count = 0;
			boolean q = false;
			for (int j = 0; j < line.length(); j++) {
				char c = line.charAt(j);
				if (c == '"') {
					q = !q;
				} else if (!q && c == candidates[i]) {
					count++;
				}
			}
			if (count > bestCount) {
				bestCount = count;
				best = candidates[i];
			}
		}
		return best;
	}

	/** 标准 CSV 记录切分：支持双引号包裹与 "" 转义；字段值 trim（顺带清掉旧导出文件里的尾随 \t） */
	private static List<List<String>> parseCsvRecords(String text) {
		List<List<String>> records = new ArrayList<List<String>>();
		char delimiter = detectDelimiter(text);

		List<String> record = new ArrayList<String>();
		StringBuffer field = new StringBuffer();
		boolean inQuotes = false;

		for (int i = 0; i < text.length(); i++) {
			char c = text.charAt(i);
			if (inQuotes) {
				if (c == '"') {
					if (i + 1 < text.length() && text.charAt(i + 1) == '"') {
						field.append('"');
						i++;
					} else {
						inQuotes = false;
					}
				} else {
					field.append(c);
				}
				continue;
			}

			if (c == '"') {
				inQuotes = true;
			} else if (c == delimiter) {
				record.add(cleanValue(field.toString()));
				field.setLength(0);
			} else if (c == '\r' || c == '\n') {
				if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') {
					i++;
				}
				record.add(cleanValue(field.toString()));
				field.setLength(0);
				records.add(record);
				record = new ArrayList<String>();
			} else {
				field.append(c);
			}
		}

		if (field.length() > 0 || !record.isEmpty()) {
			record.add(cleanValue(field.toString()));
			records.add(record);
		}
		return records;
	}

	/** 值清理：去 BOM/首尾空白（含 \t）/成对引号 */
	private static String cleanValue(String value) {
		if (value == null) {
			return "";
		}
		String v = value.replace("\uFEFF", "").trim();
		if (v.length() >= 2 && v.startsWith("\"") && v.endsWith("\"")) {
			v = v.substring(1, v.length() - 1).trim();
		}
		return v;
	}

	/********************** Excel 解析 **********************/

	private static Table readExcel(byte[] bytes, String suffix) throws Exception {
		Table table = new Table();
		table.formatName = ("et".equals(suffix) || "ett".equals(suffix)) ? ("WPS-ET(" + detectExcelFlavor(bytes) + ")") : suffix.toUpperCase();

		Workbook workbook = null;
		try {
			workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes));
			if (workbook.getNumberOfSheets() <= 0) {
				throw new ParseException("表格里没有工作表！");
			}
			Sheet sheet = workbook.getSheetAt(0);

			DataFormatter formatter = new DataFormatter();
			int firstRow = sheet.getFirstRowNum();
			int lastRow = sheet.getLastRowNum();

			boolean headerFound = false;
			for (int r = firstRow; r <= lastRow; r++) {
				Row row = sheet.getRow(r);
				if (row == null) {
					continue;
				}
				int lastCell = row.getLastCellNum();
				if (lastCell <= 0) {
					continue;
				}
				List<String> values = new ArrayList<String>();
				boolean allBlank = true;
				for (int c = 0; c < lastCell; c++) {
					Cell cell = row.getCell(c);
					String v = (cell == null) ? "" : cleanValue(formatter.formatCellValue(cell));
					v = normalizeNumericText(v);
					if (!v.isEmpty()) {
						allBlank = false;
					}
					values.add(v);
				}
				if (allBlank) {
					continue;						//全空行忽略
				}
				if (!headerFound) {
					table.headers = values;
					headerFound = true;
					continue;
				}
				table.rows.add(values);
			}
			table.charsetName = "Excel";
			return table;
		} finally {
			if (workbook != null) {
				try {
					workbook.close();
				} catch (Exception e) {
					//ignore
				}
			}
		}
	}

	/** 判定 .et 的真实格式（WPS 可能存成 OLE 老格式或 OOXML zip） */
	private static String detectExcelFlavor(byte[] bytes) {
		if (bytes.length >= 4 && (bytes[0] & 0xFF) == 0x50 && (bytes[1] & 0xFF) == 0x4B) {
			return "xlsx";
		}
		if (bytes.length >= 8 && (bytes[0] & 0xFF) == 0xD0 && (bytes[1] & 0xFF) == 0xCF) {
			return "xls";
		}
		return "unknown";
	}

	/**
	 * Excel 里手机号/编号常被存成数值（读出为 13800000000.0 或 1.38E10）→ 还原成整数字符串。
	 * 只处理「纯数字+.0」这种明显形态，避免误伤真正的数值字段。
	 */
	private static String normalizeNumericText(String value) {
		if (value == null || value.isEmpty()) {
			return "";
		}
		String v = value.trim();
		if (v.length() > 2 && v.endsWith(".0")) {
			String body = v.substring(0, v.length() - 2);
			if (isAllDigits(body)) {
				return body;
			}
		}
		return v;
	}

	private static boolean isAllDigits(String s) {
		if (s.isEmpty()) {
			return false;
		}
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (c < '0' || c > '9') {
				return false;
			}
		}
		return true;
	}

	/********************** 值规范化 **********************/

	/** 手机号清理：去空格/横线；把「86+11位」或「+86+11位」还原成 11 位 */
	public static String cleanTel(String tel) {
		if (tel == null) {
			return "";
		}
		String v = tel.trim();
		if (v.isEmpty()) {
			return "";
		}
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < v.length(); i++) {
			char c = v.charAt(i);
			if (c == ' ' || c == '\t' || c == '-' || c == '－' || c == '(' || c == ')' || c == '（' || c == '）') {
				continue;
			}
			sb.append(c);
		}
		String digits = sb.toString();
		if (digits.length() == 13 && digits.startsWith("86") && digits.charAt(2) == '1') {
			return digits.substring(2);
		}
		if (digits.length() == 14 && digits.startsWith("+86") && digits.charAt(3) == '1') {
			return digits.substring(3);
		}
		return digits;
	}

	private static String cleanEmail(String email) {
		if (email == null) {
			return "";
		}
		return email.trim().replace(" ", "");
	}

	/********************** 小工具 **********************/

	private static String getSuffix(String fileName) {
		if (fileName == null) {
			return "";
		}
		int idx = fileName.lastIndexOf('.');
		if (idx < 0 || idx == fileName.length() - 1) {
			return "";
		}
		return fileName.substring(idx + 1).trim().toLowerCase();
	}

	private static String formatSize(long size) {
		if (size < 1024) {
			return size + "B";
		}
		if (size < 1024 * 1024) {
			return (size / 1024) + "KB";
		}
		return String.format("%.1fMB", Double.valueOf(size / 1024.0 / 1024.0));
	}
}
