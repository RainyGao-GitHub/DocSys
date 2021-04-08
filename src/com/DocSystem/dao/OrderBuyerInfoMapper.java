package com.DocSystem.dao;

import com.DocSystem.entity.OrderBuyerInfo;

public interface OrderBuyerInfoMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(OrderBuyerInfo record);

    int insertSelective(OrderBuyerInfo record);

    OrderBuyerInfo selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(OrderBuyerInfo record);

    int updateByPrimaryKey(OrderBuyerInfo record);

    int add(OrderBuyerInfo buyerInfo);
}