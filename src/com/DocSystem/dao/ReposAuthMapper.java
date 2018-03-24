package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.ReposAuth;

public interface ReposAuthMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(ReposAuth record);

    int insertSelective(ReposAuth record);

    ReposAuth selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(ReposAuth record);

    int updateByPrimaryKey(ReposAuth record);
    
    ReposAuth selectSelective(ReposAuth reposAuth);

	ReposAuth getReposAuth(ReposAuth reposAuth);

	//获取所有用户的reposAuth
	List<ReposAuth> getReposAuthForAllUsers(Integer reposId);

	List<ReposAuth> getReposAuthList(ReposAuth reposAuth);	
	
	List<ReposAuth> getReposAuthForUser(ReposAuth reposAuth);
}