package com.DocSystem.entity;

import java.util.Date;

/**
 * 订单商品信息
 *
 * @author zhan jp
 * @date 2021-03-21 22:39
 */
public class OrderGoodsInfo {

    /**
     * 订单商品表id
     */
    private Integer id;

    /**
     * 订单号
     */
    private String orderNo;

    /**
     * 商品id
     */
    private Integer goodsId;

    /**
     * 商品名称
     */
    private String goodsName;

    /**
     * skuId
     */
    private String skuCode;

    /**
     * sku信息
     */
    private String sku;

    /**
     * 商品数量
     */
    private Integer num;

    /**
     * 创建时间
     */
    private Long createTime;

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

    public Integer getGoodsId() {
        return goodsId;
    }

    public void setGoodsId(Integer goodsId) {
        this.goodsId = goodsId;
    }

    public String getGoodsName() {
        return goodsName;
    }

    public void setGoodsName(String goodsName) {
        this.goodsName = goodsName;
    }

    public String getskuCode() {
        return skuCode;
    }

    public void setskuCode(String skuCode) {
        this.skuCode = skuCode;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Integer getNum() {
        return num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public Long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }
}
