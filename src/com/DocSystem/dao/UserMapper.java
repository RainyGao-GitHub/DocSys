package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.User;
import com.DocSystem.entity.UserDocAuth;

public interface UserMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(User record);

    int insertSelective(User record);

    User selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(User record);

    int updateByPrimaryKeyWithBLOBs(User record);

    int updateByPrimaryKey(User record);

    List<User> selectSelective(User user);

	List<User> queryUserByTelOrEmail(User user);

	List<User> selectAll();
	
	//For Repos Auth Manage
	List<UserDocAuth> getReposAllUsers(Integer reposId);

	List<UserDocAuth> getReposAuthList(Integer reposId);	

	List<UserDocAuth> getReposDocAuthList(Integer reposId);

	List<UserDocAuth> getDocAuthList(Integer docId);

}