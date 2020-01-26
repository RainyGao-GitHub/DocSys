package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocShare;

public interface DocShareMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(DocShare record);

    int insertSelective(DocShare record);

    DocShare selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(DocShare record);

    int updateByPrimaryKey(DocShare record);
    
    //get DocShareList
    List<DocShare> selectSelective(DocShare record);
    
    //delete selctive
	int deleteSelective(DocShare record);
}