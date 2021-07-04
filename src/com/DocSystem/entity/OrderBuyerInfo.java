package com.DocSystem.entity;

import java.util.Date;

/**
 * 支付买家信息
 *
 * @author zhan jp
 * @date 2021-03-21 22:41
 */
public class OrderBuyerInfo {

    private Integer id;

    /**
     * 用户id
     */
    private Integer userId;

    /**
     * 用户类型:Person/Company
     * @see BuyerTypelEnum#getCode()
     */
    private String type;

    /**
     * 买家邮箱
     */
    private String email;

    /**
     * 买家名字
     */
    private String firstName;

    /**
     * 买家姓
     */
    private String lastName;

    /**
     * 公司
     */
    private String companyName;

    /**
     * 电话
     */
    private String phone;

    /**
     * 创建时间
     */
    private Long createTime;

	public String orderNo;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }
}
