package com.DocSystem.test;

import java.io.File;

import com.DocSystem.controller.ReposController;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

import util.ReturnAjax;
import util.GitUtil.GITUtil;

class JGitTest extends ReposController{  
	
    public static void main(String[] args) throws Exception {
		ReturnAjax rt = new ReturnAjax();
		boolean isRealDoc = true;

		System.out.println("*********** JGIT Test ****************");
		System.out.println("*********** U:/是从Linux系统影射过来的目录，可以使用git命令行进行结果确认 ****************");

		System.out.println("*********** 删除测试GIT仓库 ****************");
		//delFileOrDir("U:/JGitTestDir/OriginGitRepos/123456_GIT_RRepos");
		delFileOrDir("U:/JGitTestDir/LocalGitRepos/234567_GIT_RRepos_Remote");
		
    	//Origin Repos
    	Repos repos = new Repos();
    	repos.setRealDocPath("U:/JGitTestDir/OriginDir/");
    	repos.setVerCtrl(2);
    	repos.setIsRemote(0);
		repos.setLocalSvnPath("U:/JGitTestDir/OriginGitRepos/");
    	repos.setId(123456);

    	//Local Repos
    	Repos localRepos = new Repos();
    	localRepos.setRealDocPath("U:/JGitTestDir/LocalDir/");
    	localRepos.setVerCtrl(2);
    	localRepos.setIsRemote(1);
    	localRepos.setLocalSvnPath("U:/JGitTestDir/LocalGitRepos/");
    	localRepos.setSvnPath("U:/JGitTestDir/OriginGitRepos/123456_GIT_RRepos");
    	localRepos.setId(234567);
    	localRepos.setSvnUser(null);
    	
    	System.out.println("*********** 创建仓库目录 ****************");
		//Create realDocPath
    	File originDocRootDir = new File(repos.getRealDocPath());
    	if(!originDocRootDir.exists())
    	{
    		originDocRootDir.mkdirs();
    	}
    	File localDocRootDir = new File(localRepos.getRealDocPath());
    	if(!localDocRootDir.exists())
    	{
    		localDocRootDir.mkdirs();
    	}

    	System.out.println("*********** 创建GIT仓库 ****************");
    	//Create Git Repos
    	GITUtil originGitUtil = new GITUtil();
    	originGitUtil.Init(repos, isRealDoc, "");
    	String originGitPath = originGitUtil.CreateRepos();
    	System.out.println("originGitPath:" + originGitPath);
    	if(originGitPath == null)
    	{
    		System.out.println("createGitLocalRepos Failed!");
    		return;
    	}
    	
    	System.out.println("*********** 克隆GIT仓库 ****************");
    	//Clone
		GITUtil localGitUtil = new GITUtil();
		localGitUtil.deleteClonedRepos(localRepos, isRealDoc);
		localGitUtil.Init(localRepos, isRealDoc, "");
		localGitUtil.CloneRepos();
        
    	System.out.println("*********** 自动提交至远程GIT仓库 ****************");
    	//Auto Commit to Origin Git Repos at root dir
    	Doc doc = new Doc();
    	doc.setDocId(0L);
    	doc.setLevel(0);
    	doc.setPath("");
    	doc.setName("");
    	doc.setLocalRootPath(repos.getRealDocPath());
		if(null == originGitUtil.doAutoCommit(doc, "远程仓库的修改3333333333333333", "OriginRainyGao",true,null,2, null))
		{
    		System.out.println("gitAutoCommit Failed!");
    		return;
		}
		originGitUtil.getHistoryLogs("", null, null, 100);
		

    	System.out.println("*********** 自动提交至本地GIT仓库 ****************");
    	//Auto Commit to Local Git Repos at root dir
    	doc.setLocalRootPath(localRepos.getRealDocPath());
		if(null == localGitUtil.doAutoCommit(doc, "本地仓库的修改33333333333333", "LocalRainyGao",true,null,2, null))
		{
    		System.out.println("gitAutoCommit Failed!");
    		return;
		}
		localGitUtil.getHistoryLogs("", null, null, 100);

    	System.out.println("*********** 本地GIT仓库Rebase到远程GIT仓库 ****************");
		//Do rebase 
		if(localGitUtil.doPullEx() == false)
		{
    		System.out.println("gitAutoCommit doPullEx Failed!");
    		return;			
		}
		originGitUtil.getHistoryLogs("", null, null, 100);
		localGitUtil.getHistoryLogs("", null, null, 100);

		
		System.out.println("*********** 本地GIT仓库Push到远程GIT仓库 ****************");
		//Do push
		if(localGitUtil.doPushEx() == false)
		{
    		System.out.println("gitAutoCommit doPush Failed!");
    		return;		
		}
		originGitUtil.getHistoryLogs("", null, null, 100);		
		localGitUtil.getHistoryLogs("", null, null, 100);

    }
} 