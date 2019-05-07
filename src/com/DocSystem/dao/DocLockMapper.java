package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocLock;

public interface DocLockMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(DocLock record);

    int insertSelective(DocLock record);

    DocLock selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(DocLock record);

    int updateByPrimaryKey(DocLock record);
    
    //get DocLockList
    List<DocLock> selectSelective(DocLock record);
}