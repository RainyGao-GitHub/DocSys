package com.DocSystem.entity;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单信息
 *
 * @author zhan jp
 * @date 2021-03-21 21:46
 */
public class OrderInfo {

    private Integer id;

    /**
     * 订单号
     */
    private String orderNo;

    /**
     * 原订单号
     */
    private String orgOrderNo;

    /**
     * 用户id
     */
    private Integer userId;

    /**
     * 买家信息id
     */
    private Integer orderBuyerId;
    

    /**
     * 币种 rmb
     */
    private String currency;

    /**
     * 总金额
     */
    private BigDecimal amount;

    /**
     * 支付渠道
     * @see PayChannelEnum#getCode()
     */
    private String payChannel;

    /**
     * 订单状态
     * @see OrderStatusEnum#getCode()
     */
    private String orderStatus;


    /**
     * 支付渠道单号
     */
    private String channelOrderNo;

    /**
     * 支付类型
     * @see PayTypeEnum#getCode()
     */
    private String payType;

    /**
     * 备注
     */
    private String remark;

    /**
     * 支付时间
     */
    private Long createTime;

    /**
     * 完成时间
     */
    private Long completeTime;

    /**
     * 渠道返回码
     */
    private String code;

    /**
     * 渠道返回原因
     */
    private String msg;

    /**
     * 渠道返回源数据
     */
    private String data;

	public String subject;

	public String goodsInfo;

	public String buyerEmail;

	public String buyerName;

	public String licenseId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getOrgOrderNo() {
        return orgOrderNo;
    }

    public void setOrgOrderNo(String orgOrderNo) {
        this.orgOrderNo = orgOrderNo;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getOrderBuyerId() {
        return orderBuyerId;
    }

    public void setOrderBuyerId(Integer orderBuyerId) {
        this.orderBuyerId = orderBuyerId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPayChannel() {
        return payChannel;
    }

    public void setPayChannel(String payChannel) {
        this.payChannel = payChannel;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getChannelOrderNo() {
        return channelOrderNo;
    }

    public void setChannelOrderNo(String channelOrderNo) {
        this.channelOrderNo = channelOrderNo;
    }

    public String getPayType() {
        return payType;
    }

    public void setPayType(String payType) {
        this.payType = payType;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }

    public Long getCompleteTime() {
        return completeTime;
    }

    public void setCompleteTime(Long completeTime) {
        this.completeTime = completeTime;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
