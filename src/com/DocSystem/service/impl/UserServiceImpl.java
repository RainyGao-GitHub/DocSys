package com.DocSystem.service.impl;  
  
import java.util.List;  
  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.stereotype.Service;  
  
import com.DocSystem.dao.UserMapper;
import com.DocSystem.entity.User;
import com.DocSystem.service.UserService;

@Service  
public class UserServiceImpl implements UserService {  
    @Autowired
    private UserMapper userDao;  
    
    public  int addUser(User user) {
    	return userDao.insertSelective(user);
    }
    
    public  int updateUserInfo(User user) {
    	return userDao.updateByPrimaryKeySelective(user);
    }
    
    public List<User> getUserListByUserInfo(User user) {
    	return userDao.selectSelective(user);
    } 
    
    public List<User> queryUserByTelOrEmail(User user)
    {
    	return userDao.queryUserByTelOrEmail(user);
    }

	public List<User> geAllUsers() {
		// TODO Auto-generated method stub
		return userDao.selectAll();
	}

}  
