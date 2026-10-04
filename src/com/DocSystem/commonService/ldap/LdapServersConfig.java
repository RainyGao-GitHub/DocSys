package com.DocSystem.commonService.ldap;

import java.util.ArrayList;
import java.util.List;

/**
 * 系统级 LDAP 配置（{@code system_setting.name = 'ldap.servers'} 的 JSON 值）。
 *
 * <p>结构版本用于后续演进；服务器顺序即运行期配置串里的顺序（多台时按域名匹配，顺序影响「不带域名登录」的尝试次序）。</p>
 */
public class LdapServersConfig {

	/** 结构版本 */
	private int version = 1;
	/** 服务器列表（含停用项） */
	private List<LdapServerConfig> servers = new ArrayList<LdapServerConfig>();

	public int getVersion() {
		return version;
	}

	public void setVersion(int version) {
		this.version = version;
	}

	public List<LdapServerConfig> getServers() {
		return servers;
	}

	public void setServers(List<LdapServerConfig> servers) {
		this.servers = servers;
	}
}
