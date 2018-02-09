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
import com.DocSystem.entity.DocAuth;
import com.DocSystem.dao.DocAuthMapper;
import com.DocSystem.entity.User;
import com.DocSystem.dao.UserMapper;
import com.DocSystem.entity.UserDocAuth;


//ReposService is for all operations of Repository
@Service  
public class ReposServiceImpl implements ReposService {  
    @Autowired
    private ReposMapper reposDao;
    @Autowired
    private DocMapper docDao;  
    @Autowired
    private DocAuthMapper docAuthDao;  
    @Autowired
    private ReposAuthMapper reposAuthDao;  
    @Autowired
    private UserMapper userDao;  
    
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
    
    //get Repos Menu
    public String getReposMenu(Integer id) {  
        return reposDao.getReposMenu(id);  
    }
    
    //add a Document
    public int addDoc(Doc doc)
    {
    	//return docDao.insertSelective(doc);
    	return docDao.add(doc);
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
    
    //delete a Document
    public int deleteDoc(Integer id)
    {
    	return docDao.deleteByPrimaryKey(id);
    }
    
    //Get the ReposVersionList
    public List<Doc> getDocList(Doc doc) {  
        List<Doc> list = docDao.selectSelective(doc);  
        return list;
    }

	public int addReposAuth(ReposAuth reposAuth) {
		return reposAuthDao.insertSelective(reposAuth);
	}
	
    //get ReposAuth
    public ReposAuth getReposAuth(ReposAuth reposAuth)
    {
    	return reposAuthDao.selectSelective(reposAuth);
    }
    
    //get DocAuth
    public DocAuth getDocAuth(DocAuth docAuth)
    {
    	return docAuthDao.selectSelective(docAuth);
    }

	public List<UserDocAuth> getReposAuthList(Integer reposId) {
		return userDao.getReposAuthList(reposId);
	}
	
	public List<UserDocAuth> getDocAuthList(Integer docId, Integer reposId) {
		if(docId == 0)
		{
			return userDao.getReposDocAuthList(reposId);	//获取仓库所有的DocAuthList
		}
		else
		{
			return userDao.getDocAuthList(docId);	//获取Doc所有的DocAuthList
		}
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
	public List<UserDocAuth> getReposAllUsers(Integer reposId) {
		return userDao.getReposAllUsers(reposId);		
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

	public Doc getDocInfo(Integer docId) {
		return docDao.getDocInfo(docId);	//只获取文件的信息但不包括内容
	}

	public void deleteDocAuthSelective(DocAuth docAuth) {
		docAuthDao.deleteSelective(docAuth);
	}

	public List<DocAuth> getUserDocAuthList(Integer userId, Integer docId,Integer pDocId,
			Integer reposId) {
		HashMap<String,Object> params = new HashMap<String,Object>();
        params.put("docId", docId);
        params.put("pDocId", pDocId);
        params.put("reposId", reposId);
        params.put("userId", userId);
		return docAuthDao.getUserDocAuthList(params);
	}

	public List<Doc> getAuthedDocList(Integer docId, Integer pDocId, Integer reposId,Integer userId) {
		HashMap<String,Object> params = new HashMap<String,Object>();
        params.put("docId", docId);
        params.put("pDocId", pDocId);
        params.put("reposId", reposId);
        params.put("userId", userId);
		return docDao.getAuthedDocList(params);
	}

	public List<Doc> getAuthedDocListHeritable(Integer docId, Integer pDocId,
			Integer reposId, Integer userId) {
		HashMap<String,Object> params = new HashMap<String,Object>();
        params.put("docId", docId);
        params.put("pDocId", pDocId);
        params.put("reposId", reposId);
        params.put("userId", userId);
        return docDao.getAuthedDocListHeritable(params);
	}
}  
