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
       	int ret = 0;
    	try {
    	   	ret = reposDao.add(repos);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //delete a Repos
    public int deleteRepos(Integer id) {  
       	int ret = 0;
    	try {
    	   	ret = reposDao.deleteByPrimaryKey(id); 
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //Get the all ReposList
    public List<Repos> getAllReposList() {  
    	List<Repos>  ret = null;
    	try {
    	   	ret =  reposDao.selectAll();
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //Get the ReposList by Repos Info
    public List<Repos> getReposList(Repos repos) {  
    	List<Repos>  ret = null;
    	try {
    	   	ret =  reposDao.selectSelective(repos);  
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    
    //Get the authed ReposList
    public List<Repos> getAuthedReposList(Integer UserId) {  
    	List<Repos>  ret = null;
    	try {
    	   	ret =  reposDao.selectAuthedReposList(UserId);   
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //Get Repos
	public Repos getRepos(Integer id) {
    	Repos  ret = null;
    	try {
    	   	ret =  reposDao.selectByPrimaryKey(id);  
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
	}
        
    //update Repos
    public int updateRepos(Repos repos) {  
    	int  ret = 0;
    	try {
    	   	ret =  reposDao.updateByPrimaryKeySelective(repos);  
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //add a Document
    public int addDoc(Doc doc)
    {
    	int ret = 0;
    	try {
    		ret = docDao.insertSelective(doc);
    	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //get a Document
    public Doc getDoc(Integer id)
    {
    	Doc ret = null;
    	try {
    		ret = docDao.selectByPrimaryKey(id);
    	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
    //update a Document
    public int updateDoc(Doc doc)
    {
       	int ret = 0;
    	try {
    	   	ret = docDao.updateByPrimaryKeySelective(doc);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }

    public int updateDocByPrimaryKey(Doc doc)
    {
       	int ret = 0;
    	try {
    	   	ret = docDao.updateByPrimaryKey(doc);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }

    //delete a Document
    public int deleteDoc(Integer id)
    {
       	int ret = 0;
    	try {
    	   	ret = docDao.deleteByPrimaryKey(id);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }
    
	public int deleteDoc(Doc doc) {
       	int ret = 0;
    	try {
    	   	ret = docDao.deleteSelective(doc);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;		
	}
    
    //Get the docList by doc
    public List<Doc> getDocList(Doc doc) {  
    	List<Doc> ret = null;
    	try {
    		ret = docDao.selectSelective(doc);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;		
    }
    
	//Doc List 查询
	public List<Doc> queryDocList(HashMap<String, Object> params)
	{
    	List<Doc> ret = null;
    	try {
    		ret = 	docDao.queryDocList(params);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}    
    
	public int addDocLock(DocLock docLock) {
    	int ret = 0;
    	try {
    		ret = docLockDao.insertSelective(docLock);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
    }

	public int deleteDocLock(DocLock docLock) {
    	int ret = 0;
    	try {
    		ret = docLockDao.deleteByPrimaryKey(docLock.getId());
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;
 	}
	
	public int updateDocLock(DocLock docLock) {
    	int ret = 0;
    	try {
    		ret = docLockDao.updateByPrimaryKeySelective(docLock);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;		
	}
	
    //Get the docLockList by doc
    public List<DocLock> getDocLockList(DocLock docLock) { 
    	List<DocLock> ret = null;
    	try {
    		ret = docLockDao.selectSelective(docLock); 
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
    }

	public int addReposAuth(ReposAuth reposAuth) {
    	int ret = 0;
    	try {
    		ret = reposAuthDao.insertSelective(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
    //get ReposAuth
    public ReposAuth getReposAuth(ReposAuth reposAuth)
    {
    	ReposAuth ret = null;
    	try {
    		ret =  reposAuthDao.getReposAuth(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
    }
    
    //get DocAuth
    public DocAuth getDocAuth(DocAuth docAuth)
    {
    	DocAuth ret = null;
    	try {
    		ret =  docAuthDao.selectSelective(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
    }

	public List<ReposAuth> getReposAuthList(Integer reposId) {
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setReposId(reposId);
		List<ReposAuth> ret = null;
    	try {
    		ret =  reposAuthDao.selectSelective(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;			
	}
	
	//取出任意用户和用户所在组以及用户的权限
	public List<DocAuth> getDocAuthForUser(DocAuth docAuth) {
		List<DocAuth> ret = null;
    	try {
    		ret = docAuthDao.getDocAuthForUser(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
	//取出任意用户和用户组的权限
	public List<DocAuth> getDocAuthForGroup(DocAuth docAuth) {
		List<DocAuth> ret = null;
    	try {
    		ret = docAuthDao.getDocAuthForGroup(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;			
	}
	
	//取出任意用户的权限
	public List<DocAuth> getDocAuthForAnyUser(DocAuth docAuth) {
		List<DocAuth> ret = null;
    	try {
    		ret = docAuthDao.getDocAuthForAnyUser(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
	public int setReposAuth(ReposAuth reposAuth) {
		int ret = 0;
    	try {
    		ret = reposAuthDao.updateByPrimaryKeySelective(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;		
	}

	public int addDocAuth(DocAuth docAuth) {
		int ret = 0;
    	try {
    		ret = docAuthDao.insertSelective(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public int updateDocAuth(DocAuth docAuth) {
		int ret = 0;
    	try {
    		ret = docAuthDao.updateByPrimaryKeySelective(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	//仓库的所有用户（包括有授权和没授权的）
	public List<ReposAuth> getReposAllUsers(Integer reposId) {
		List<ReposAuth> ret = null;
    	try {
    		ret = reposAuthDao.getReposAllUsers(reposId);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
	public List<ReposAuth> queryReposMemberWithParamLike(HashMap<String, String> param) {
		List<ReposAuth> ret = null;
    	try {
    		ret = reposAuthDao.queryReposMemberWithParamLike(param);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}	
	
	//仓库的所有用户组（包括有授权和没授权的）
	public List<ReposAuth> getReposAllGroups(Integer reposId) {
		List<ReposAuth> ret = null;
    	try {
    		ret = reposAuthDao.getReposAllGroups(reposId);		
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public int deleteReposAuth(Integer id) {
		int ret = 0;
    	try {
    		ret = reposAuthDao.deleteByPrimaryKey(id);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public int updateReposAuth(ReposAuth qReposAuth) {
		int ret = 0;
    	try {
    		ret = reposAuthDao.updateByPrimaryKeySelective(qReposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public int deleteDocAuth(Integer id) {
		int ret = 0;
    	try {
    		ret = docAuthDao.deleteByPrimaryKey(id);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}


	public int deleteReposAuthSelective(ReposAuth reposAuth) {
		int ret = 0;
    	try {
    		ret = reposAuthDao.deleteSelective(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
	public int deleteDocAuthSelective(DocAuth docAuth) {
		int ret = 0;
    	try {
    		ret = docAuthDao.deleteSelective(docAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
		
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
        List<DocAuth> ret = null;
    	try {
    		ret = docAuthDao.getAllDocAuthList(params);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public List<ReposAuth> getReposAuthListForUser(ReposAuth reposAuth) {
		//To get the reposAuth with userId=userId and groupId in (groups) and userId=0
        List<ReposAuth> ret = null;
    	try {
    		ret = reposAuthDao.getReposAuthForUser(reposAuth);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;			
	}

	public User getUserInfo(Integer userId) {
		User ret = null;
    	try {
    		ret = userDao.selectByPrimaryKey(userId);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}

	public UserGroup getGroupInfo(Integer groupId) {
		UserGroup ret = null;
    	try {
    		ret = userGroupDao.selectByPrimaryKey(groupId);	
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
	}
	
    public int addDocShare(DocShare docShare)
    {
		int ret = 0;
    	try {
    		ret = docShareDao.insertSelective(docShare);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
    }
    
    public DocShare getDocShare(Integer id)
    {
    	DocShare ret = null;
    	try {
    		ret = docShareDao.selectByPrimaryKey(id);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	
    }
    
    public int updateDocShare(DocShare docShare)
    {
    	int ret = 0;
    	try {
    		ret = docShareDao.updateByPrimaryKeySelective(docShare);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	    	
    }

    public int updateDocShareByPrimaryKey(DocShare docShare)
    {
    	int ret = 0;
    	try {
    		ret = docShareDao.updateByPrimaryKey(docShare);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	    
    }
    
    public int deleteDocShare(Integer id)
    {
    	int ret = 0;
    	try {
    		ret = docShareDao.deleteByPrimaryKey(id);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	   
    }
    
    public int deleteDocShare(DocShare docShare)
    {
    	int ret = 0;
    	try {
    		ret = docShareDao.deleteSelective(docShare);
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	   
    }
    
    public List<DocShare> getDocShareList(DocShare docShare) {  
    	List<DocShare> ret = null;
    	try {
    		ret = docShareDao.selectSelective(docShare);  
      	} catch(Exception e){
    		e.printStackTrace();
    	}
    	return ret;	  
    }
}  
