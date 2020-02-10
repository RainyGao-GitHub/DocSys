package com.DocSystem.service.impl;  
  
import java.util.HashMap;
import java.util.List;  
  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.stereotype.Service;  

import com.DocSystem.service.ReposService;

import com.DocSystem.entity.Repos;
import com.DocSystem.dao.ReposMapper;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.dao.ReposAuthMapper;
import com.DocSystem.entity.Doc;
import com.DocSystem.dao.DocMapper;
import com.DocSystem.dao.DocShareMapper;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.dao.DocAuthMapper;
import com.DocSystem.dao.DocLockMapper;
import com.DocSystem.entity.User;
import com.DocSystem.dao.UserMapper;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.dao.UserGroupMapper;

//ReposService is for all operations of Repository
@Service  
public class ReposServiceImpl implements ReposService {  
    @Autowired
    private ReposMapper reposDao;
    @Autowired
    private DocMapper docDao;  
    @Autowired
    private DocLockMapper docLockDao;  
    @Autowired
    private DocAuthMapper docAuthDao;  
    @Autowired
    private ReposAuthMapper reposAuthDao;  
    @Autowired
    private UserMapper userDao;  
    @Autowired
    private UserGroupMapper userGroupDao;  
    @Autowired
    private DocShareMapper docShareDao;  
    
    //add a Repos
    public int addRepos(Repos repos) {  
        return reposDao.add(repos);
    }
    
    //delete a Repos
    public int deleteRepos(Integer id) {  
        return reposDao.deleteByPrimaryKey(id);  
    }
    
    //Get the all ReposList
    public List<Repos> getAllReposList() {  
        List<Repos> list = reposDao.selectAll();  
        return list;
    }
    
    //Get the ReposList by Repos Info
    public List<Repos> getReposList(Repos repos) {  
        List<Repos> list = reposDao.selectSelective(repos);  
        return list;
    }
    
    
    //Get the authed ReposList
    public List<Repos> getAuthedReposList(Integer UserId) {  
        List<Repos> list = reposDao.selectAuthedReposList(UserId);  
        return list;
    }
    
    //Get Repos
	public Repos getRepos(Integer id) {
		return reposDao.selectByPrimaryKey(id);
	}
        
    //update Repos
    public int updateRepos(Repos repos) {  
        return reposDao.updateByPrimaryKeySelective(repos);  
    }
    
    //add a Document
    public int addDoc(Doc doc)
    {
    	return docDao.insertSelective(doc);
    }
    
    //get a Document
    public Doc getDoc(Integer id)
    {
    	return docDao.selectByPrimaryKey(id);
    }
    
    //update a Document
    public int updateDoc(Doc doc)
    {
    	return docDao.updateByPrimaryKeySelective(doc);
    }

    public int updateDocByPrimaryKey(Doc doc)
    {
    	return docDao.updateByPrimaryKey(doc);
    }

    //delete a Document
    public int deleteDoc(Integer id)
    {
    	return docDao.deleteByPrimaryKey(id);
    }
    
	public int deleteDoc(Doc doc) {
		return docDao.deleteSelective(doc);	
	}
    
    //Get the docList by doc
    public List<Doc> getDocList(Doc doc) {  
        List<Doc> list = docDao.selectSelective(doc);  
        return list;
    }
    
	//Doc List 查询
	public List<Doc> queryDocList(HashMap<String, Object> params)
	{
		return docDao.queryDocList(params);
	}    
    
	public int addDocLock(DocLock docLock) {
    	return docLockDao.insertSelective(docLock);
    }

	public int deleteDocLock(DocLock docLock) {
    	return docLockDao.deleteByPrimaryKey(docLock.getId());
	}
	
	public int updateDocLock(DocLock docLock) {
    	return docLockDao.updateByPrimaryKeySelective(docLock);
	}
	
    //Get the docLockList by doc
    public List<DocLock> getDocLockList(DocLock docLock) {  
        List<DocLock> list = docLockDao.selectSelective(docLock);  
        return list;
    }

	public int addReposAuth(ReposAuth reposAuth) {
		return reposAuthDao.insertSelective(reposAuth);
	}
	
    //get ReposAuth
    public ReposAuth getReposAuth(ReposAuth reposAuth)
    {
    	return reposAuthDao.getReposAuth(reposAuth);
    }
    
    //get DocAuth
    public DocAuth getDocAuth(DocAuth docAuth)
    {
    	return docAuthDao.selectSelective(docAuth);
    }

	public List<ReposAuth> getReposAuthList(Integer reposId) {
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setReposId(reposId);
		return reposAuthDao.selectSelective(reposAuth);
	}
	
	public List<DocAuth> getDocAuthForUser(DocAuth docAuth) {
		return docAuthDao.getDocAuthForUser(docAuth);
	}
	public List<DocAuth> getDocAuthForGroup(DocAuth docAuth) {
		return docAuthDao.getDocAuthForGroup(docAuth);
	}
	public List<DocAuth> getDocAuthForAnyUser(DocAuth docAuth) {
		return docAuthDao.getDocAuthForAnyUser(docAuth);
	}
	
	public int setReposAuth(ReposAuth reposAuth) {
		return reposAuthDao.updateByPrimaryKeySelective(reposAuth);
	}

	public int addDocAuth(DocAuth docAuth) {
		return docAuthDao.insertSelective(docAuth);
	}

	public int updateDocAuth(DocAuth docAuth) {
		return docAuthDao.updateByPrimaryKeySelective(docAuth);
	}

	//仓库的所有用户（包括有授权和没授权的）
	public List<ReposAuth> getReposAllUsers(Integer reposId) {
		return reposAuthDao.getReposAllUsers(reposId);		
	}
	
	//仓库的所有用户组（包括有授权和没授权的）
	public List<ReposAuth> getReposAllGroups(Integer reposId) {
		return reposAuthDao.getReposAllGroups(reposId);	
	}

	public int deleteReposAuth(Integer id) {
		return reposAuthDao.deleteByPrimaryKey(id);
	}

	public int updateReposAuth(ReposAuth qReposAuth) {
		return reposAuthDao.updateByPrimaryKeySelective(qReposAuth);
	}

	public int deleteDocAuth(Integer id) {
		return docAuthDao.deleteByPrimaryKey(id);
	}


	public void deleteReposAuthSelective(ReposAuth reposAuth) {
		reposAuthDao.deleteSelective(reposAuth);
	}
	
	public void deleteDocAuthSelective(DocAuth docAuth) {
		docAuthDao.deleteSelective(docAuth);
	}

	//Please use the getDocAuthList, This Interface can not be used again
	//I keep leave it here, because it is good example to show how to take parameters to mybatis
	public List<DocAuth> getAllDocAuthList(Integer reposId) 
	{
		HashMap<String,Object> params = new HashMap<String,Object>();
        //params.put("docId", docId);
        //params.put("pDocId", pDocId);
        params.put("reposId", reposId);
        //params.put("userId", userId);
		return docAuthDao.getAllDocAuthList(params);
	}

	public List<ReposAuth> getReposAuthListForUser(ReposAuth reposAuth) {
		//To get the reposAuth with userId=userId and groupId in (groups) and userId=0
		return reposAuthDao.getReposAuthForUser(reposAuth);
	}

	public User getUserInfo(Integer userId) {
		return userDao.selectByPrimaryKey(userId);	
	}

	public UserGroup getGroupInfo(Integer groupId) {
		return userGroupDao.selectByPrimaryKey(groupId);
	}
	
    public int addDocShare(DocShare docShare)
    {
    	return docShareDao.insertSelective(docShare);
    }
    
    public DocShare getDocShare(Integer id)
    {
    	return docShareDao.selectByPrimaryKey(id);
    }
    
    public int updateDocShare(DocShare docShare)
    {
    	return docShareDao.updateByPrimaryKeySelective(docShare);
    }

    public int updateDocShareByPrimaryKey(DocShare docShare)
    {
    	return docShareDao.updateByPrimaryKey(docShare);
    }
    
    public int deleteDocShare(Integer id)
    {
    	return docShareDao.deleteByPrimaryKey(id);
    }
    
    public int deleteDocShare(DocShare docShare)
    {
    	return docShareDao.deleteSelective(docShare);
    }
    
    public List<DocShare> getDocShareList(DocShare docShare) {  
        List<DocShare> list = docShareDao.selectSelective(docShare);  
        return list;
    }	
}  
