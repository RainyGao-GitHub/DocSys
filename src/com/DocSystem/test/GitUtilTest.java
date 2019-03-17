package com.DocSystem.test;

import com.DocSystem.entity.Repos;

import util.GitUtil.GITUtil;

class GitUtilTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");        
        
        //Create Test
        Repos repos = new Repos();
        repos.setId(123);
        repos.setVerCtrl(2);
        repos.setIsRemote(0);
        repos.setLocalSvnPath("C:/LocalGitTest");
        GITUtil gitUtil = new GITUtil();
        gitUtil.Init(repos, true, "");
        gitUtil.CreateRepos();
        
        //Commit Test
        String parentPath = "testDir/";
        String entryName = "test.txt";
        gitUtil.Commit(parentPath, entryName);
        
        gitUtil.getHistoryLogs(parentPath+entryName,0,-1,100);

        //Clone Test
        repos.setId(456);
        repos.setVerCtrl(2);
        repos.setIsRemote(1);
        repos.setLocalSvnPath("C:/LocalGitTest");
        repos.setSvnPath("https://gitee.com/RainyGao/CodeJam");
        repos.setSvnUser("652055239@qq.com");
        repos.setSvnPwd("Rain121900");
        GITUtil gitUtil1 = new GITUtil();
        gitUtil1.Init(repos, true, "");
        gitUtil1.CloneRepos();
    }  
}  