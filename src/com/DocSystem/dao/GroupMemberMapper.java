package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.UserGroup;

public interface GroupMemberMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(GroupMember record);

    int insertSelective(GroupMember record);

    GroupMember selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(GroupMember record);

    int updateByPrimaryKey(GroupMember record);

    //获取所有用户列表（包含组信息，但这个函数名定义确实有点奇怪）
	List<GroupMember> getGroupAllUsers(Integer groupId);

	List<UserGroup> selectSelective(GroupMember groupMember);

	int deleteSelective(GroupMember groupMember);
}