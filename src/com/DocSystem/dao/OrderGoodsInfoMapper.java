package com.DocSystem.dao;

import com.DocSystem.entity.OrderGoodsInfo;

public interface OrderGoodsInfoMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(OrderGoodsInfo record);

    int insertSelective(OrderGoodsInfo record);

    OrderGoodsInfo selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(OrderGoodsInfo record);

    int updateByPrimaryKey(OrderGoodsInfo record);
}