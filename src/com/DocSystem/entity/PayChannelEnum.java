package com.DocSystem.entity;

/**
 * 支付渠道枚举
 *
 * @author zhan jp
 * @date 2021-03-21 13:24
 */
public enum PayChannelEnum {

    ALIPAY("Alipay", "支付宝"),
    WEIXIN_PAY("WeixinPay", "微信支付"),
    BANK_CARD_PAY("BankCardPay", "银行卡支付");

    private String code;

    private String desc;


    PayChannelEnum(String code, String desc) {
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
