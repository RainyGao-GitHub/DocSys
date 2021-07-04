package com.DocSystem.entity;

/**
 * 支付渠道枚举
 *
 * @author zhan jp
 * @date 2021-03-21 13:24
 */
public enum BuyerTypelEnum {

    PERSON("Person", "个人"),
    COMPANY("Company", "公司");

    private String code;

    private String desc;


    BuyerTypelEnum(String code, String desc) {
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
