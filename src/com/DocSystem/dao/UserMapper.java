package com.DocSystem.dao;

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

	List<User> queryUserByTelOrEmail(User user);

	List<User> selectAll();
	
	//For Repos Auth Manage
	List<ReposAuth> getReposAllUsers(Integer reposId);

	List<ReposAuth> getReposAuthList(ReposAuth reposAuth);	

	List<DocAuth> getDocAuthList(DocAuth docAuth);
}