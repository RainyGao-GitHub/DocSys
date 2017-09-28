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

	List<UserDocAuth> getReposAuthedUsers(Integer vid);

	List<UserDocAuth> getDocAuthedUsers(Integer docId);

	List<UserDocAuth> getReposAllUsers(Integer reposId);

	List<User> selectAll();	
}