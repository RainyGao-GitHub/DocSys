package com.DocSystem.dao;

import java.util.List;

import com.DocSystem.entity.Repos;

public interface ReposMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(Repos record);

    int insertSelective(Repos record);

    Repos selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(Repos record);

    int updateByPrimaryKey(Repos record);
    
    //get all ReposList
    List<Repos> selectAll();

    //get ReposList by repos Info
    List<Repos> selectSelective(Repos repos);

    //get add ReposList
    List<Repos> selectAuthedReposList(Integer UserId);
	
    //add repos and will set the id to repos
	int add(Repos repos);
}