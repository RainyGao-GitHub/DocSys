package com.DocSystem.service.impl;  
  
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;  
  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.stereotype.Service;  
  
import com.DocSystem.dao.GroupMemberMapper;
import com.DocSystem.dao.ReposAuthMapper;
import com.DocSystem.dao.ReposMapper;
import com.DocSystem.dao.UserGroupMapper;
import com.DocSystem.dao.UserMapper;
import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.ReposMember;
import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.service.UserService;

@Service  
public class UserServiceImpl implements UserService {  
    @Autowired
    private UserMapper userDao;  
    @Autowired
    private UserGroupMapper groupDao;  
    @Autowired
    private GroupMemberMapper groupMemberDao;  
    @Autowired
    private ReposMapper reposDao;  
    @Autowired
    private ReposAuthMapper reposAuthDao;  

    public  int addUser(User user) {
    	return userDao.insertSelective(user);
    }
    
    public  int updateUserInfo(User user) {
    	return userDao.updateByPrimaryKeySelective(user);
    }
    
    public List<User> getUserListByUserInfo(User user) {
    	return userDao.selectSelective(user);
    } 
    
    public List<User> queryUserExt(User user)
    {
    	return userDao.queryUserExt(user);
    }

	public List<User> geAllUsers() {
		return userDao.selectAll();
	}

	public Integer getCountWithParam(HashMap<String, String> param) {
		return userDao.getCountWithParam(param);
	}
		
	public List<User> getUserListWithParam(HashMap<String, String> param) {
		return userDao.queryUserWithParam(param);
	}

	public User getUser(Integer userID) {
		return userDao.selectByPrimaryKey(userID);
	}
	
	public int delUser(Integer userId) {
		return userDao.deleteByPrimaryKey(userId);
	}
	
	public int editUser(User user) {
		return userDao.updateByPrimaryKeySelective(user);

	}

	/*The following interface is for repos*/
	public List<Repos> geAllReposes() {
		return reposDao.selectAll();
	}
	
	/*The following interface is for group*/
	public List<UserGroup> geAllGroups() {
		return groupDao.selectAll();
	}

	public List<UserGroup> getGroupListByGroupInfo(UserGroup qGroup) {
		return groupDao.selectSelective(qGroup);
	}
	
	public int addGroup(UserGroup group) {
		return groupDao.insertSelective(group);
	}

	public int delGroup(Integer id) {
		return groupDao.deleteByPrimaryKey(id);
	}

	public int editGroup(UserGroup group) {
		return groupDao.updateByPrimaryKeySelective(group);
	}
	
	public List<GroupMember> getGroupAllUsers(Integer groupId) {
		return groupMemberDao.getGroupAllUsers(groupId);
	}

	public List<UserGroup> getGroupMemberListByGroupMemberInfo(GroupMember groupMember) {
		return groupMemberDao.selectSelective(groupMember);
	}

	public int addGroupMember(GroupMember groupMember) {
		return groupMemberDao.insertSelective(groupMember);
	}

	public int delGroupMember(Integer id) {
		return groupMemberDao.deleteByPrimaryKey(id);
	}

	public int deleteGroupMemberSelective(GroupMember groupMember) {
		return groupMemberDao.deleteSelective(groupMember);	
	}

	public List<ReposMember> getReposAllUsers(Integer reposId) {
		List<ReposAuth> reposAuthList = reposAuthDao.getReposAllUsers(reposId);
		if(reposAuthList == null)
		{
			return null;
		}
		
		List<ReposMember> list = new ArrayList<ReposMember>();
		for(int i=0; i< reposAuthList.size(); i++)
		{
			ReposAuth reposAuth = reposAuthList.get(i);
			ReposMember reposMember = new ReposMember();
			reposMember.setId(reposAuth.getId());
			reposMember.setUserId(reposAuth.getUserId());
			reposMember.setUserName(reposAuth.getUserName());
			reposMember.setRealName(reposAuth.getRealName());
			reposMember.setReposId(reposAuth.getReposId());
			list.add(reposMember);
		}
		return list;
	}
}  
