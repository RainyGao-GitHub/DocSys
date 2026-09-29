package com.DocSystem.entity;

/**
 * 系统参数（键值对）实体。
 *
 * <p>对应表 {@code system_setting}（见 {@link com.DocSystem.service.SystemSettingInitializer}）：
 * {@code name} 唯一，{@code value} 为字符串（可存 JSON、逗号分隔串等任意格式），
 * 参考 ScholarOS 的 {@code SystemSetting} 模型。
 *
 * <p>该表<b>不并入</b> BaseController.DBTabNameMap（后者与 ObjMemberListMap/objType 索引强绑定），
 * 走独立 Mapper 手写 SQL。
 */
public class SystemSetting {

	private Long id;

	/** 配置名（点分命名空间，如 sms.provider） */
	private String name;

	/** 配置值（字符串；JSON 需自行解析） */
	private String value;

	/** 备注（用途 / 来源 / 示例） */
	private String remark;

	/** 创建时间（yyyy-MM-dd HH:mm:ss） */
	private String createTime;

	/** 更新时间 */
	private String updateTime;

	/** 列表展示序号（非数据库字段，仅用于管理页分页编号） */
	private Integer index;

	public Integer getIndex() {
		return index;
	}

	public void setIndex(Integer index) {
		this.index = index;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public String getRemark() {
		return remark;
	}

	public void setRemark(String remark) {
		this.remark = remark;
	}

	public String getCreateTime() {
		return createTime;
	}

	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}

	public String getUpdateTime() {
		return updateTime;
	}

	public void setUpdateTime(String updateTime) {
		this.updateTime = updateTime;
	}
}
