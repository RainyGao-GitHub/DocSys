package com.DocSystem.dao;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.Doc;

public interface DocMapper {
    int deleteByPrimaryKey(Long docId);

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

	//获取给用户直接授权的文件列表
	List<Doc> getAuthedDocList(HashMap<String, Object> params);
	
	//获取给用户直接授权和继承的文件列表
	List<Doc> getAuthedDocListHeritable(HashMap<String, Object> params);
	
	//For Doc Search
	List<Doc> queryDocList(HashMap<String, Object> params);
}