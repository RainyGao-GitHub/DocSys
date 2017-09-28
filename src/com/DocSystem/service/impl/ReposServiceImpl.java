package com.DocSystem.service.impl;  
  
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
		// TODO Auto-generated method stub
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

	public List<UserDocAuth> getDocAuthedUserList(Integer docId, Integer vid) {
		// TODO Auto-generated method stub
		if(docId == 0)
		{
			return userDao.getReposAuthedUsers(vid);
		}
		else
		{
			return userDao.getDocAuthedUsers(docId);
		}
		
	}

	public int setReposAuth(ReposAuth reposAuth) {
		// TODO Auto-generated method stub
		return reposAuthDao.updateByPrimaryKeySelective(reposAuth);
	}

	public int addDocAuth(DocAuth docAuth) {
		// TODO Auto-generated method stub
		return docAuthDao.insertSelective(docAuth);
	}

	public int updateDocAuth(DocAuth docAuth) {
		// TODO Auto-generated method stub
		return docAuthDao.updateByPrimaryKeySelective(docAuth);
	}

	public List<UserDocAuth> getReposAuthedUserList(Integer reposId) {
		// TODO Auto-generated method stub
		return userDao.getReposAuthedUsers(reposId);
	}

	//仓库的所有用户（包括有授权和没授权的）
	public List<UserDocAuth> getReposAllUsers(Integer reposId) {
		// TODO Auto-generated method stub
		return userDao.getReposAllUsers(reposId);		
	}

	public int deleteReposAuth(Integer id) {
		// TODO Auto-generated method stub
		return reposAuthDao.deleteByPrimaryKey(id);
	}

	public int updateReposAuth(ReposAuth qReposAuth) {
		// TODO Auto-generated method stub
		return reposAuthDao.updateByPrimaryKeySelective(qReposAuth);
	}

	public int deleteDocAuth(Integer id) {
		// TODO Auto-generated method stub
		return docAuthDao.deleteByPrimaryKey(id);
	}

	public Doc getDocInfo(Integer docId) {
		// TODO Auto-generated method stub
		return docDao.getDocInfo(docId);	//只获取文件的信息但不包括内容
	}

	public void deleteDocAuthSelective(DocAuth docAuth) {
		// TODO Auto-generated method stub
		docAuthDao.deleteSelective(docAuth);
	}

	public List<Doc> getAuthedSubDocList(UserDocAuth userDocAuth) {
		// TODO Auto-generated method stub
		return docDao.getAuthedSubDocList(userDocAuth);
	}

	public List<DocAuth> getDocAuthListForUser(Integer userId, Integer pDocId,
			Integer reposId) {
		// TODO Auto-generated method stub
		return docAuthDao.getDocAuthListForUser(userId,pDocId,reposId);
	}
}  
