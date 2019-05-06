package com.DocSystem.dao;

import com.DocSystem.entity.DocLock;

public interface DocLockMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(DocLock record);

    int insertSelective(DocLock record);

    DocLock selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(DocLock record);

    int updateByPrimaryKey(DocLock record);
}