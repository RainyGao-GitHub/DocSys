package com.DocSystem.entity;

/**
 * 支付状态枚举
 *
 * @author zhan jp
 * @date 2021-03-21 13:24
 */
public enum OrderStatusEnum {

    PROCESSING("Processing", "处理中"),
    PAID("Paid", "已支付"),
    SUCCESS("Success", "订单完成"),
	REFUNDED("Refunded", "已退款"),
    FAILED("Failed", "支付失败");
	

    private String code;

    private String desc;


    OrderStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public String getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }
}
