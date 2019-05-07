package com.DocSystem.dao;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.Doc;

public interface DocMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(Doc record);

    int insertSelective(Doc record);

    Doc selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(Doc record);

    int updateByPrimaryKeyWithBLOBs(Doc record);

    int updateByPrimaryKey(Doc record);

   	int add(Doc doc);
   	
    //get DocList
    List<Doc> selectSelective(Doc record);

	Doc getDocInfo(Integer reposId, Long docId);
	
	//For Doc Search
	List<Doc> queryDocList(HashMap<String, Object> params);
}