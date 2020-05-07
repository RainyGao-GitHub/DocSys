package com.DocSystem.dao;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;

public interface UserMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(User record);

    int insertSelective(User record);

    User selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(User record);

    int updateByPrimaryKeyWithBLOBs(User record);

    int updateByPrimaryKey(User record);

    List<User> selectSelective(User user);

	List<User> queryUserExt(User user);	//根据用户名和密码查询用户列表

	List<User> selectAll();
	
	Integer getCountWithParam(HashMap<String, String> param);
	List<User> queryUserWithParam(HashMap<String, String> param);
}