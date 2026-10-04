package com.DocSystem.service.ldap;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.Log;
import com.DocSystem.common.constants;
import com.DocSystem.commonService.ldap.LdapAttributeMapping;
import com.DocSystem.commonService.ldap.LdapServerConfig;
import com.DocSystem.commonService.ldap.LdapServersConfig;
import com.DocSystem.service.SystemSettingService;
import com.alibaba.fastjson.JSON;

/**
 * 系统级 LDAP 配置存储/装配层（管理后台 → 系统管理 → LDAP设置）。
 *
 * <p><b>权威源</b>：{@code system_setting.name = 'ldap.servers'}，值为 {@link LdapServersConfig} 的 JSON
 * （与邮件/短信同一张表、同一套路；自动纳入「系统参数」页与备份/导入导出）。</p>
 *
 * <p><b>运行期镜像</b>：渲染成 DocSys 老格式配置串
 * （{@code url; name=..; loginMode=..; ...} 用 {@code || } 连接），交给
 * {@link BaseFunction#applyLdapConfigMirror(String)} 落 {@code docSys.ini} + classes 副本，
 * 并立即应用到内存 {@code BaseFunction.systemLdapConfig} —— 保存后无需重启即可生效。</p>
 *
 * <p><b>为什么渲染回老格式串</b>：登录链路（{@code BaseController.loginCheck} →
 * {@code LDAPUtil.ldapLoginCheck}）、集群一致性检查（比对 classes 副本里的 ldapConfig）、
 * 以及 {@code getSystemInfo.do} 全部依赖这条串，保持同一格式即可让上述链路<b>零改动</b>。</p>
 *
 * <p><b>语义要点</b>：</p>
 * <ul>
 * <li>只有「启用」的服务器进入运行期串；停用的仅后台可见。</li>
 * <li>串里没有域名（{@code name}）时，该服务器只能用于「不带域名登录」。</li>
 * <li>清空列表 = 渲染出空串 = 关闭 LDAP 登录（回落本地账号登录，行为与改造前一致）。</li>
 * <li>未识别的老键（{@code authMode}/{@code CaseType}/{@code testUser} 等）原样保留、原样渲染。</li>
 * </ul>
 */
@Component
public class LdapConfigStore {

	/** 表内键名（权威源） */
	public static final String KEY_LDAP_SERVERS = "ldap.servers";
	/** 键前缀（种子迁移判定用） */
	public static final String KEY_PREFIX = "ldap.";

	/** 服务器数量上限（防误操作把配置串撑爆） */
	public static final int MAX_SERVERS = 20;

	public static final String DEFAULT_SCHEME = "ldap";
	public static final String DEFAULT_PORT = "389";
	public static final String DEFAULT_SSL_PORT = "636";
	public static final String DEFAULT_FILTER = "(objectClass=*)";
	public static final String DEFAULT_LOGIN_MODE = "uid";

	/** 老格式串里的键名（必须与 {@code util.LDAPUtil} 的读取口径完全一致） */
	private static final String K_NAME = "name";
	private static final String K_AUTHENTICATION = "authentication";
	private static final String K_LOGIN_MODE = "loginMode";
	private static final String K_USER_ACCOUNT = "userAccount";
	private static final String K_USER_PASSWORD = "userPassword";
	private static final String K_FILTER = "filter";
	private static final String K_DOMAIN_CHECK = "domainCheck";
	private static final String K_NAME_ATTR = "nameAttribute";
	private static final String K_REAL_NAME_ATTR = "realNameAttribute";
	private static final String K_NICK_NAME_ATTR = "nickNameAttribute";
	private static final String K_MAIL_ATTR = "mailAttribute";
	private static final String K_DESCRIPTION_ATTR = "descriptionAttribute";
	/** 测试连接用：只注入到「测试串」里，不入库（读法同 LDAPUtil/ManageController.ldapTest.do） */
	private static final String K_TEST_USER = "testUser";
	private static final String K_TEST_USER_PASSWORD = "testUserPassword";

	private static final String CONFIG_FILE = "docSysConfig.properties";
	private static final String SEED_REMARK_PREFIX = "首次启用时由 " + CONFIG_FILE + " 迁移 @ ";
	private static final String DEFAULT_REMARK = "由管理后台LDAP设置页维护";

	@Autowired
	private SystemSettingService systemSettingService;

	// ===================== 读 =====================

	/**
	 * 读服务器列表（含停用项）。表内无该键时用运行期配置串播种（并尝试落盘）。
	 *
	 * @return 永不为 null（未配置 → 空列表）
	 */
	public LdapServersConfig load() {
		LdapServersConfig stored = readFromStore();
		if (stored != null) {
			return normalizeConfig(stored);
		}

		//首次使用：把当前生效的老格式串播种成结构化配置（管理员零操作迁移）
		List<LdapServerConfig> seeded = fromLegacyString(BaseFunction.getLdapConfigString());
		if (!seeded.isEmpty()) {
			if (writeToStore(seeded, SEED_REMARK_PREFIX + nowString())) {
				Log.info("LdapConfigStore 已从运行期配置串播种 " + seeded.size() + " 台LDAP服务器到 " + KEY_LDAP_SERVERS);
			} else {
				Log.info("LdapConfigStore 播种失败（本次仍返回解析结果，下次打开会重试）");
			}
		} else {
			Log.info("LdapConfigStore 首次加载：运行期未配置任何LDAP服务器");
		}
		return wrap(seeded);
	}

	/** 读表（原始值）。未配置 → null；已配置（含空列表）→ 对应结构 */
	private LdapServersConfig readFromStore() {
		if (systemSettingService == null) {
			Log.info("LdapConfigStore: SystemSettingService 未注入，按未配置处理");
			return null;
		}
		try {
			String json = systemSettingService.getValue(KEY_LDAP_SERVERS);
			if (json == null || json.trim().isEmpty()) {
				return null;
			}
			LdapServersConfig config = JSON.parseObject(json, LdapServersConfig.class);
			return config;
		} catch (Exception e) {
			Log.info("LdapConfigStore 解析 " + KEY_LDAP_SERVERS + " 失败（按未配置处理）: " + e.getMessage());
			return null;
		}
	}

	// ===================== 写 =====================

	/**
	 * 保存：写 JSON（权威源）→ 渲染镜像串 → 落盘 + 立即生效。
	 *
	 * @return false = JSON 写入失败（调用方应报错，不要提示成功）
	 */
	public boolean save(LdapServersConfig config) {
		List<LdapServerConfig> servers = normalize(config == null ? null : config.getServers());
		if (!writeToStore(servers, null)) {
			return false;
		}
		BaseFunction.applyLdapConfigMirror(toLegacyString(servers));
		Log.info("LdapConfigStore 已保存 " + servers.size() + " 台LDAP服务器（启用 " + countEnabled(servers) + " 台）");
		return true;
	}

	/** 写 JSON 到 system_setting（失败只记日志并返回 false，绝不上抛） */
	private boolean writeToStore(List<LdapServerConfig> servers, String remark) {
		if (systemSettingService == null) {
			Log.info("LdapConfigStore: SystemSettingService 未注入，无法写入");
			return false;
		}
		try {
			String json = JSON.toJSONString(wrap(servers));
			if (remark == null) {
				remark = systemSettingService.getRemark(KEY_LDAP_SERVERS);
			}
			if (remark == null) {
				remark = DEFAULT_REMARK;
			}
			boolean ok = systemSettingService.set(KEY_LDAP_SERVERS, json, remark);
			if (!ok) {
				Log.info("LdapConfigStore 写 " + KEY_LDAP_SERVERS + " 返回失败");
			}
			return ok;
		} catch (Exception e) {
			Log.info("LdapConfigStore 写 " + KEY_LDAP_SERVERS + " 异常: " + e.getMessage());
			return false;
		}
	}

	/**
	 * 启动钩子（docSysInit 成功后调用）：表内没有任何 {@code ldap.*} 行时，
	 * 把当前 {@code docSysConfig.properties} 里的老格式串<b>一次性</b>播种进表。
	 *
	 * @return true 表示本次真的写入了配置行
	 */
	public boolean ensureSeeded() {
		if (systemSettingService == null) {
			Log.info("LdapConfigStore.ensureSeeded() SystemSettingService 未注入，跳过");
			return false;
		}
		if (systemSettingService.countByPrefix(KEY_PREFIX + "%") > 0) {
			Log.info("LdapConfigStore.ensureSeeded() 表内已有 " + KEY_PREFIX + "* 配置，跳过种子迁移");
			return false;
		}
		List<LdapServerConfig> servers = fromLegacyString(BaseFunction.getLdapConfigString());
		if (servers.isEmpty()) {
			Log.info("LdapConfigStore.ensureSeeded() " + CONFIG_FILE + " 无 ldapConfig，不写入任何 " + KEY_PREFIX + "* 行");
			return false;
		}
		if (!writeToStore(servers, SEED_REMARK_PREFIX + nowString())) {
			return false;
		}
		Log.info("LdapConfigStore.ensureSeeded() 已从 " + CONFIG_FILE + " 迁移 " + servers.size() + " 台LDAP服务器");
		return true;
	}

	/**
	 * 启动钩子：用表里的结构化配置覆盖运行期（未配置 → 不动，保持 ini 的引导值，与改造前行为一致）。
	 *
	 * @return true = 已用表数据覆盖运行期
	 */
	public boolean applyToRuntime() {
		LdapServersConfig stored = readFromStore();
		if (stored == null) {
			Log.info("LdapConfigStore: 未配置 " + KEY_LDAP_SERVERS + "，保持 " + CONFIG_FILE + " 的引导值");
			return false;
		}
		List<LdapServerConfig> servers = normalize(stored.getServers());
		BaseFunction.applyLdapConfigMirror(toLegacyString(servers));
		Log.info("LdapConfigStore 已用 " + KEY_LDAP_SERVERS + " 覆盖运行期配置（" + servers.size()
				+ " 台，启用 " + countEnabled(servers) + " 台）");
		return true;
	}

	// ===================== 老格式串互转（纯函数） =====================

	/**
	 * 从老格式串解析（播种用）。
	 *
	 * <p>串格式：{@code url; k=v; k=v || url2; ...}，其中 url = {@code scheme://host[:port][/basedn]}。
	 * 未识别的键原样进 {@code extraSettings}。</p>
	 */
	public static List<LdapServerConfig> fromLegacyString(String legacy) {
		List<LdapServerConfig> list = new ArrayList<LdapServerConfig>();
		if (legacy == null || legacy.trim().isEmpty()) {
			return list;
		}

		String[] segments = legacy.split("\\|\\|");
		int index = 0;
		for (int i = 0; i < segments.length; i++) {
			if (segments[i] == null || segments[i].trim().isEmpty()) {
				continue;
			}
			LdapServerConfig server = parseServerSegment(segments[i]);
			if (server == null) {
				continue;
			}
			server.setId("seed" + (++index));
			list.add(server);
		}
		return list;
	}

	/** 解析单台服务器段（{@code url; k=v; ...}）；无法识别 url 时返回 null */
	public static LdapServerConfig parseServerSegment(String segment) {
		if (segment == null) {
			return null;
		}
		String[] parts = segment.trim().split(";");
		if (parts.length == 0) {
			return null;
		}
		String url = parts[0] == null ? "" : parts[0].trim();
		int schemePos = url.indexOf("://");
		if (schemePos <= 0) {
			Log.info("LdapConfigStore.parseServerSegment() 非法服务器地址（缺少 scheme://）: " + url);
			return null;
		}

		LdapServerConfig server = new LdapServerConfig();
		server.setAttributes(new LdapAttributeMapping());
		server.setScheme(url.substring(0, schemePos).trim().toLowerCase());

		String rest = url.substring(schemePos + 3);
		int slashPos = rest.indexOf('/');
		String hostPort = slashPos >= 0 ? rest.substring(0, slashPos) : rest;
		server.setBaseDn(slashPos >= 0 ? rest.substring(slashPos + 1).trim() : "");

		int colonPos = hostPort.indexOf(':');
		if (colonPos >= 0) {
			server.setHost(hostPort.substring(0, colonPos).trim());
			server.setPort(hostPort.substring(colonPos + 1).trim());
		} else {
			server.setHost(hostPort.trim());
			server.setPort("");
		}

		//其余是 k=v（用第一个 = 切分；与 util.LDAPUtil.getLDAPSettings 口径一致）
		LinkedHashMap<String, String> extra = new LinkedHashMap<String, String>();
		for (int i = 1; i < parts.length; i++) {
			String kv = parts[i];
			if (kv == null) {
				continue;
			}
			kv = kv.trim();
			if (kv.isEmpty()) {
				continue;
			}
			int sep = kv.indexOf('=');
			if (sep <= 0) {
				continue;
			}
			String key = kv.substring(0, sep).trim();
			String value = sep < (kv.length() - 1) ? kv.substring(sep + 1).trim() : "";
			applySetting(server, key, value, extra);
		}
		server.setExtraSettings(extra);
		return server;
	}

	/** 把一条 k=v 落到结构化字段；未识别的键进 extraSettings */
	private static void applySetting(LdapServerConfig server, String key, String value, Map<String, String> extra) {
		if (K_NAME.equals(key)) {
			server.setName(value);
		} else if (K_AUTHENTICATION.equals(key)) {
			server.setAuthentication(value);
		} else if (K_LOGIN_MODE.equals(key)) {
			server.setLoginMode(value);
		} else if (K_USER_ACCOUNT.equals(key)) {
			server.setBindAccount(value);
		} else if (K_USER_PASSWORD.equals(key)) {
			server.setBindPassword(value);
		} else if (K_FILTER.equals(key)) {
			server.setFilter(value);
		} else if (K_DOMAIN_CHECK.equals(key)) {
			server.setDomainCheck(isTrue(value));
		} else if (K_NAME_ATTR.equals(key)) {
			server.getAttributes().setName(value);
		} else if (K_REAL_NAME_ATTR.equals(key)) {
			server.getAttributes().setRealName(value);
		} else if (K_NICK_NAME_ATTR.equals(key)) {
			server.getAttributes().setNickName(value);
		} else if (K_MAIL_ATTR.equals(key)) {
			server.getAttributes().setMail(value);
		} else if (K_DESCRIPTION_ATTR.equals(key)) {
			server.getAttributes().setDescription(value);
		} else {
			extra.put(key, value);
		}
	}

	/** 渲染运行期配置串：只输出<b>启用</b>的服务器 */
	public static String toLegacyString(List<LdapServerConfig> servers) {
		StringBuilder all = new StringBuilder();
		if (servers == null) {
			return "";
		}
		for (LdapServerConfig server : servers) {
			if (server == null || !server.isEnabled()) {
				continue;
			}
			String segment = toServerString(server, null);
			if (segment.isEmpty()) {
				continue;
			}
			if (all.length() > 0) {
				all.append(" || ");
			}
			all.append(segment);
		}
		return all.toString();
	}

	/** 渲染运行期配置串（结构版重载） */
	public static String toLegacyString(LdapServersConfig config) {
		return toLegacyString(config == null ? null : config.getServers());
	}

	/**
	 * 渲染单台服务器段（{@code extraKv} 非空时追加为额外 kv，用于注入测试账号）。
	 * 空 host 返回空串。
	 */
	public static String toServerString(LdapServerConfig server, Map<String, String> extraKv) {
		if (server == null) {
			return "";
		}
		String host = trim(server.getHost());
		if (host.isEmpty()) {
			return "";
		}
		String scheme = trim(server.getScheme());
		if (scheme.isEmpty()) {
			scheme = DEFAULT_SCHEME;
		}

		StringBuilder sb = new StringBuilder();
		sb.append(sanitize(scheme)).append("://").append(sanitize(host));
		String port = trim(server.getPort());
		if (!port.isEmpty()) {
			sb.append(":").append(sanitize(port));
		}
		sb.append("/").append(sanitize(server.getBaseDn()));

		appendKv(sb, K_NAME, server.getName());
		String authentication = trim(server.getAuthentication());
		if (!authentication.isEmpty() && !"simple".equalsIgnoreCase(authentication)) {
			appendKv(sb, K_AUTHENTICATION, authentication);
		}
		appendKv(sb, K_LOGIN_MODE, server.getLoginMode());
		appendKv(sb, K_USER_ACCOUNT, server.getBindAccount());
		appendKv(sb, K_USER_PASSWORD, server.getBindPassword());
		appendKv(sb, K_FILTER, server.getFilter());
		if (server.isDomainCheck()) {
			appendKv(sb, K_DOMAIN_CHECK, "1");
		}
		LdapAttributeMapping attr = server.getAttributes();
		if (attr != null) {
			appendKv(sb, K_NAME_ATTR, attr.getName());
			appendKv(sb, K_REAL_NAME_ATTR, attr.getRealName());
			appendKv(sb, K_NICK_NAME_ATTR, attr.getNickName());
			appendKv(sb, K_MAIL_ATTR, attr.getMail());
			appendKv(sb, K_DESCRIPTION_ATTR, attr.getDescription());
		}
		appendExtra(sb, server.getExtraSettings());
		appendExtra(sb, extraKv);
		return sb.toString();
	}

	/** 渲染「单台服务器 + 测试账号」的配置串（供 ldapTest.do 复用，不落盘） */
	public static String buildTestConfigString(LdapServerConfig server, String testUser, String testPassword) {
		LinkedHashMap<String, String> extra = new LinkedHashMap<String, String>();
		String user = trim(testUser);
		String password = trim(testPassword);
		if (!user.isEmpty()) {
			extra.put(K_TEST_USER, user);
		}
		if (!password.isEmpty()) {
			extra.put(K_TEST_USER_PASSWORD, password);
		}
		return toServerString(server, extra);
	}

	// ===================== 校验 / 整理 =====================

	/**
	 * 保存前校验（纯函数，便于离线验证）。
	 *
	 * @param docSysType 当前版本（{@code constants.DocSys_Enterprise_Edition} 等）：非企业版不允许启用 LDAP
	 * @return null = 通过；否则为可直接展示给管理员的错误文案
	 */
	public static String validate(LdapServersConfig config, int docSysType) {
		List<LdapServerConfig> servers = config == null ? null : config.getServers();
		if (servers == null || servers.isEmpty()) {
			return null;	//允许清空（= 关闭LDAP登录）
		}
		if (servers.size() > MAX_SERVERS) {
			return "最多支持 " + MAX_SERVERS + " 台LDAP服务器";
		}

		int enabledCount = countEnabled(servers);
		if (enabledCount > 0 && docSysType != constants.DocSys_Enterprise_Edition) {
			String edition = (docSysType == constants.DocSys_Professional_Edition) ? "专业版" : "个人版";
			return edition + "不支持LDAP登录认证，请购买企业版！";
		}

		Set<String> names = new LinkedHashSet<String>();
		for (int i = 0; i < servers.size(); i++) {
			LdapServerConfig server = servers.get(i);
			String no = "第 " + (i + 1) + " 台服务器";
			if (server == null) {
				return no + "为空";
			}

			String name = trim(server.getName());
			String scheme = trim(server.getScheme());
			String host = trim(server.getHost());
			String port = trim(server.getPort());
			String baseDn = trim(server.getBaseDn());

			if (host.isEmpty()) {
				return no + "：服务器地址不能为空";
			}
			if (!scheme.isEmpty() && !DEFAULT_SCHEME.equalsIgnoreCase(scheme) && !"ldaps".equalsIgnoreCase(scheme)) {
				return no + "：协议只支持 ldap 或 ldaps";
			}
			if (!port.isEmpty()) {
				int portNum = parsePort(port);
				if (portNum <= 0 || portNum > 65535) {
					return no + "：端口必须是 1~65535 的数字";
				}
			}
			if (baseDn.isEmpty()) {
				return no + "：基础DN不能为空（如 ou=users,dc=example,dc=com）";
			}
			if (hasSeparator(host) || hasSeparator(port) || hasSeparator(name) || hasSeparator(baseDn)
					|| hasSeparator(server.getLoginMode()) || hasSeparator(server.getBindAccount())
					|| hasSeparator(server.getBindPassword()) || hasSeparator(server.getFilter())) {
				return no + "：不能包含 ; 或 |（运行期配置串的分隔符）";
			}

			LdapAttributeMapping attr = server.getAttributes();
			if (attr != null) {
				String[] attrValues = { attr.getName(), attr.getRealName(), attr.getNickName(), attr.getMail(),
						attr.getDescription() };
				for (int j = 0; j < attrValues.length; j++) {
					if (hasSeparator(attrValues[j])) {
						return no + "：属性映射不能包含 ; 或 |";
					}
				}
			}

			Map<String, String> extra = server.getExtraSettings();
			if (extra != null) {
				for (Map.Entry<String, String> entry : extra.entrySet()) {
					String key = trim(entry.getKey());
					String value = trim(entry.getValue());
					if (key.isEmpty() && value.isEmpty()) {
						continue;
					}
					if (key.isEmpty()) {
						return no + "：其他设置的键不能为空";
					}
					if (hasSeparator(key) || hasSeparator(value) || key.indexOf('=') >= 0) {
						return no + "：其他设置 [" + key + "] 不能包含 ; | 或 =";
					}
					if (isCoreKey(key)) {
						return no + "：其他设置 [" + key + "] 与内置字段重名，请用上方对应字段填写";
					}
				}
			}

			if (!server.isEnabled()) {
				continue;	//停用的不参与运行期，域名唯一性只约束启用项
			}
			//域名可以不填（单域/主备多台且不带域名登录是合法场景）；
			//但多台启用时「同名域名」会让「域名/账号」登录产生歧义，必须拦住。
			if (!name.isEmpty() && !names.add(name.toLowerCase())) {
				return no + "：域名 [" + name + "] 与前面已启用的服务器重复";
			}
		}
		return null;
	}

	/** 规范化：补 id、去首尾空格、协议小写、归类 extraSettings；永不为 null */
	public static List<LdapServerConfig> normalize(List<LdapServerConfig> servers) {
		List<LdapServerConfig> list = new ArrayList<LdapServerConfig>();
		if (servers == null) {
			return list;
		}
		int index = 0;
		for (LdapServerConfig server : servers) {
			if (server == null) {
				continue;
			}
			LdapServerConfig one = new LdapServerConfig();

			String id = trim(server.getId());
			one.setId(id.isEmpty() ? ("ldap" + System.currentTimeMillis() + "_" + (++index)) : id);
			one.setName(trim(server.getName()));
			String scheme = trim(server.getScheme()).toLowerCase();
			one.setScheme(scheme.isEmpty() ? DEFAULT_SCHEME : scheme);
			one.setHost(trim(server.getHost()));
			one.setPort(trim(server.getPort()));
			one.setBaseDn(trim(server.getBaseDn()));
			one.setEnabled(server.isEnabled());
			one.setAuthentication(trim(server.getAuthentication()));
			one.setDomainCheck(server.isDomainCheck());
			one.setLoginMode(trim(server.getLoginMode()));
			one.setBindAccount(trim(server.getBindAccount()));
			one.setBindPassword(trim(server.getBindPassword()));
			one.setFilter(trim(server.getFilter()));

			LdapAttributeMapping attr = server.getAttributes() == null ? new LdapAttributeMapping() : server.getAttributes();
			LdapAttributeMapping newAttr = new LdapAttributeMapping();
			newAttr.setName(trim(attr.getName()));
			newAttr.setRealName(trim(attr.getRealName()));
			newAttr.setNickName(trim(attr.getNickName()));
			newAttr.setMail(trim(attr.getMail()));
			newAttr.setDescription(trim(attr.getDescription()));
			one.setAttributes(newAttr);

			LinkedHashMap<String, String> extra = new LinkedHashMap<String, String>();
			if (server.getExtraSettings() != null) {
				for (Map.Entry<String, String> entry : server.getExtraSettings().entrySet()) {
					String key = trim(entry.getKey());
					String value = trim(entry.getValue());
					if (key.isEmpty() || value.isEmpty() || isCoreKey(key)) {
						continue;
					}
					extra.put(key, value);
				}
			}
			one.setExtraSettings(extra);

			list.add(one);
		}
		return list;
	}

	// ===================== 内部工具 =====================

	private static LdapServersConfig normalizeConfig(LdapServersConfig config) {
		return wrap(normalize(config == null ? null : config.getServers()));
	}

	private static LdapServersConfig wrap(List<LdapServerConfig> servers) {
		LdapServersConfig config = new LdapServersConfig();
		config.setVersion(1);
		config.setServers(servers == null ? new ArrayList<LdapServerConfig>() : servers);
		return config;
	}

	private static void appendExtra(StringBuilder sb, Map<String, String> extra) {
		if (extra == null) {
			return;
		}
		for (Map.Entry<String, String> entry : extra.entrySet()) {
			String key = trim(entry.getKey());
			String value = trim(entry.getValue());
			if (key.isEmpty() || value.isEmpty() || isCoreKey(key)) {
				continue;
			}
			appendKv(sb, key, value);
		}
	}

	private static void appendKv(StringBuilder sb, String key, String value) {
		String k = trim(key);
		String v = trim(value);
		if (k.isEmpty() || v.isEmpty()) {
			return;
		}
		sb.append("; ").append(sanitize(k)).append("=").append(sanitize(v));
	}

	private static boolean isCoreKey(String key) {
		return K_NAME.equals(key) || K_AUTHENTICATION.equals(key) || K_LOGIN_MODE.equals(key)
				|| K_USER_ACCOUNT.equals(key) || K_USER_PASSWORD.equals(key) || K_FILTER.equals(key)
				|| K_DOMAIN_CHECK.equals(key) || K_NAME_ATTR.equals(key) || K_REAL_NAME_ATTR.equals(key)
				|| K_NICK_NAME_ATTR.equals(key) || K_MAIL_ATTR.equals(key) || K_DESCRIPTION_ATTR.equals(key);
	}

	public static int countEnabled(List<LdapServerConfig> servers) {
		int count = 0;
		if (servers != null) {
			for (LdapServerConfig server : servers) {
				if (server != null && server.isEnabled()) {
					count++;
				}
			}
		}
		return count;
	}

	/** 端口解析（非法 → -1） */
	public static int parsePort(String value) {
		String port = trim(value);
		if (port.isEmpty()) {
			return -1;
		}
		try {
			return Integer.parseInt(port);
		} catch (Exception e) {
			return -1;
		}
	}

	/** 布尔口径：1/true/yes/on（大小写无关） */
	private static boolean isTrue(String value) {
		String v = trim(value).toLowerCase();
		return "1".equals(v) || "true".equals(v) || "yes".equals(v) || "on".equals(v);
	}

	private static boolean hasSeparator(String value) {
		return value != null && (value.indexOf(';') >= 0 || value.indexOf('|') >= 0);
	}

	/** 运行期串是「;」与「||」分隔的，落盘前把分隔符去掉（正常输入已被 validate 拦下） */
	private static String sanitize(String value) {
		if (value == null) {
			return "";
		}
		return value.replace(";", "").replace("|", "").trim();
	}

	private static String trim(String value) {
		return value == null ? "" : value.trim();
	}

	private static String nowString() {
		return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
	}
}
