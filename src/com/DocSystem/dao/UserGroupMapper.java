package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;

public interface UserGroupMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(UserGroup record);

    int insertSelective(UserGroup record);

    UserGroup selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(UserGroup record);

    int updateByPrimaryKey(UserGroup record);
    
	List<UserGroup> selectAll();

	List<UserGroup> selectSelective(UserGroup qGroup);
}