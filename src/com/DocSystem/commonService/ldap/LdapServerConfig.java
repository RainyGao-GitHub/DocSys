package com.DocSystem.commonService.ldap;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 一台 LDAP 服务器的结构化配置（管理后台「LDAP设置」页的编辑单元）。
 *
 * <p>字段与老格式配置串一一对应：</p>
 * <pre>
 *   ldap://host:port/baseDn; name=..; authentication=..; loginMode=..; userAccount=..;
 *   userPassword=..; filter=..; domainCheck=1; nameAttribute=..; realNameAttribute=..;
 *   nickNameAttribute=..; mailAttribute=..; descriptionAttribute=..
 * </pre>
 *
 * <p>未识别的键（历史遗留的 {@code authMode}/{@code CaseType}、测试账号 {@code testUser} 等）
 * 原样保存在 {@link #extraSettings}，保存时原样渲染回去，避免「保存即丢数据」。</p>
 */
public class LdapServerConfig {

	/** 稳定 id（编辑/删除/排序用） */
	private String id;
	/** = name：域名（多域登录时用「域名/账号」区分） */
	private String name;
	/** 协议：ldap / ldaps（默认 ldap） */
	private String scheme = "ldap";
	/** 主机（不含协议与端口） */
	private String host;
	/** 端口（留空 = 用服务器默认端口：389 / ldaps 636） */
	private String port;
	/** = basedn：基础DN（查询起点） */
	private String baseDn;
	/** 停用后不进入运行期配置串（后台仍保留配置） */
	private boolean enabled = true;
	/** = authentication：鉴权方式（留空 = simple） */
	private String authentication;
	/** = domainCheck=1：必须带域名登录 */
	private boolean domainCheck;
	/** = loginMode：登录用户属性（留空 = uid） */
	private String loginMode;
	/** = userAccount：绑定查询用的账号（留空 = 用登录用户自身绑定校验） */
	private String bindAccount;
	/** = userPassword：绑定账号的密码 */
	private String bindPassword;
	/** = filter：过滤条件（留空 = (objectClass=*)） */
	private String filter;
	/** 用户属性映射（5 项，留空项走运行期默认值） */
	private LdapAttributeMapping attributes = new LdapAttributeMapping();
	/** 未识别的原始键值（原样保留） */
	private Map<String, String> extraSettings = new LinkedHashMap<String, String>();

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getScheme() {
		return scheme;
	}

	public void setScheme(String scheme) {
		this.scheme = scheme;
	}

	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
	}

	public String getPort() {
		return port;
	}

	public void setPort(String port) {
		this.port = port;
	}

	public String getBaseDn() {
		return baseDn;
	}

	public void setBaseDn(String baseDn) {
		this.baseDn = baseDn;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getAuthentication() {
		return authentication;
	}

	public void setAuthentication(String authentication) {
		this.authentication = authentication;
	}

	public boolean isDomainCheck() {
		return domainCheck;
	}

	public void setDomainCheck(boolean domainCheck) {
		this.domainCheck = domainCheck;
	}

	public String getLoginMode() {
		return loginMode;
	}

	public void setLoginMode(String loginMode) {
		this.loginMode = loginMode;
	}

	public String getBindAccount() {
		return bindAccount;
	}

	public void setBindAccount(String bindAccount) {
		this.bindAccount = bindAccount;
	}

	public String getBindPassword() {
		return bindPassword;
	}

	public void setBindPassword(String bindPassword) {
		this.bindPassword = bindPassword;
	}

	public String getFilter() {
		return filter;
	}

	public void setFilter(String filter) {
		this.filter = filter;
	}

	public LdapAttributeMapping getAttributes() {
		return attributes;
	}

	public void setAttributes(LdapAttributeMapping attributes) {
		this.attributes = attributes;
	}

	public Map<String, String> getExtraSettings() {
		return extraSettings;
	}

	public void setExtraSettings(Map<String, String> extraSettings) {
		this.extraSettings = extraSettings;
	}
}
