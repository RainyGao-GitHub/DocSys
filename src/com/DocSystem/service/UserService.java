package com.DocSystem.service;  
  
import java.util.List;

import com.DocSystem.entity.User;
  
public interface UserService {  
    public List<User> getUserListByUserInfo(User user);  
    
    public List<User> queryUserExt(User user);
}  
