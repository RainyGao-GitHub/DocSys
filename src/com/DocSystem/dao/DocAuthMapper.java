package com.DocSystem.dao;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.ReposAuth;

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

	List<DocAuth> getUserDocAuthList(HashMap<String, Object> params);
}