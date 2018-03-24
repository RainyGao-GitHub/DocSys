package com.DocSystem.dao;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.DocAuth;

public interface DocAuthMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(DocAuth record);

    int insertSelective(DocAuth record);

    DocAuth selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(DocAuth record);

    int updateByPrimaryKey(DocAuth record);

    DocAuth selectSelective(DocAuth docAuth);

	DocAuth getDocAuth(DocAuth docAuth);

	int deleteSelective(DocAuth docAuth);

	List<DocAuth> getDocAuthForUser(DocAuth docAuth);
	List<DocAuth> getDocAuthForGroup(DocAuth docAuth);
	List<DocAuth> getDocAuthForAnyUser(DocAuth docAuth);
	
	//这个接口是故意这么实现的 
	List<DocAuth> getAllDocAuthList(HashMap<String, Object> params);
}