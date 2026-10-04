package com.DocSystem.commonService.ldap;

/**
 * LDAP 用户属性 → DocSys 用户字段的映射（对应老格式配置串里的 {@code xxxAttribute} 键）。
 *
 * <p>留空 = 用运行期默认值（见 {@code util.LDAPUtil.getAttributeName()}）：
 * name→loginMode、realName→cn、nickName→displayName、mail→mail、description→description。</p>
 */
public class LdapAttributeMapping {

	/** nameAttribute：登录名属性（默认取 loginMode） */
	private String name;
	/** realNameAttribute：姓名（默认 cn） */
	private String realName;
	/** nickNameAttribute：昵称（默认 displayName） */
	private String nickName;
	/** mailAttribute：邮箱（默认 mail） */
	private String mail;
	/** descriptionAttribute：描述（默认 description） */
	private String description;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRealName() {
		return realName;
	}

	public void setRealName(String realName) {
		this.realName = realName;
	}

	public String getNickName() {
		return nickName;
	}

	public void setNickName(String nickName) {
		this.nickName = nickName;
	}

	public String getMail() {
		return mail;
	}

	public void setMail(String mail) {
		this.mail = mail;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}
}
