package com.DocSystem.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import util.ReturnAjax;
import util.LuceneUtil.LuceneUtil2;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.Path;
import com.DocSystem.common.SyncLock;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.entity.BackupTask;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.controller.BaseController;

/*
Something you need to know
1、目录结构前台展示
（1）docSys的前台目录结构是根据docId和pid进行前台展示的
（2）后台返回的docList中的doc能找到对应的pid的parentDoc，则会加载到对应的parentDoc上，找不到则挂在rootDoc下（因此那些拥有非法pid的doc会出现在根目录下面）
（3）因此后台需要正确维护docId和pid之间的关系，否则将会出现混乱
 */

@Controller
@RequestMapping("/Repos")
public class ReposController extends BaseController{
	
	/****------ Ajax Interfaces For Repository Controller ------------------***/ 
	/****************** get DocSysConfig **************/
	@RequestMapping("/getDocSysConfig.do")
	public void getDocSysConfig(HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.info("\n****************** getDocSysConfig.do ***********************");
		ReturnAjax rt = new ReturnAjax();		
		
		JSONObject config = new JSONObject();
		config.put("defaultReposStorePath", Path.getDefaultReposRootPath(OSType));
		rt.setData(config);
		writeJson(rt, response);
	}

	/****************** get Repository List **************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.info("\n****************** getReposList.do ***********************");
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(systemLicenseInfoCheck(rt) == false)
		{
			writeJson(rt, response);			
		}
		
		Integer UserId = login_user.getId();
		Log.debug("UserId:" + UserId);
		List <Repos> accessableReposList = getAccessableReposList(UserId);
		//Log.printObject("getReposList() accessableReposList",accessableReposList);		
		rt.setData(accessableReposList);
		writeJson(rt, response);
	}

	@RequestMapping("/getManagerReposList.do")
	public void getManagerReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.info("\n****************** getManagerReposList.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() == 2)	//超级管理员
		{
			List<Repos> reposList = reposService.getAllReposList();
			rt.setData(reposList);
		}
		else
		{
			Integer UserId = login_user.getId();
			Log.debug("UserId:" + UserId);
			List <Repos> accessableReposList = getAccessableReposList(UserId);
			rt.setData(accessableReposList);
		}
		writeJson(rt, response);
	}

	/****************** get Repository **************/
	@RequestMapping("/getRepos.do")
	public void getRepos(Integer vid,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response){

		Log.info("\n****************** getRepos.do ***********************");
		Log.debug("getRepos vid: " + vid + " shareId:" + shareId);
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, vid, null, null, false,rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(vid);
				
		//获取磁盘空间
		String localRootPath = Path.getReposRealPath(repos);
		File file = new File(localRootPath);
		repos.totalSize = file.getTotalSpace();
		repos.freeSize = file.getFreeSpace();
		
		rt.setData(repos);
		writeJson(rt, response);
	}

	/****************   add a Repository ******************/
	@RequestMapping("/addRepos.do")
	public void addRepos(String name,String info, Integer type, String path, 
			String realDocPath, 
			String remoteServer,
			String remoteStorage,
			Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd, 
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1, 
			Long createTime,
			Integer isTextSearchEnabled,
			Integer encryptType,
			String autoBackup,
			HttpSession session,HttpServletRequest request,HttpServletResponse response){
		
		Log.info("\n****************** addRepos.do ***********************");
		Log.debug("addRepos name: " + name + " info: " + info + " type: " + type + " path: " + path  
				+ " realDocPath: " + realDocPath 
				+ " remoteServer: " + remoteServer 
				+ " remoteStorage: " + remoteStorage 
				+ " verCtrl: " + verCtrl  + " isRemote:" +isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd 
				+ " verCtrl1: " + verCtrl1  + " isRemote1:" +isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1
				+ "isTextSearchEnabled:" + isTextSearchEnabled + " autoBackup:" + autoBackup);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		if(login_user.getType() == 0)
		{
			rt.setError("普通用户不支持新建仓库！");
			writeJson(rt, response);			
			return;
		}
		
		//格式化参数
		if((path == null) || path.equals(""))
		{
			Log.docSysErrorLog("仓库存储路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		path = Path.localDirPathFormat(path, OSType);
		
		if(realDocPath != null && !realDocPath.isEmpty())
		{
			realDocPath = Path.localDirPathFormat(realDocPath, OSType);
		}
		if(localSvnPath != null && !localSvnPath.isEmpty())
		{
			localSvnPath = Path.localDirPathFormat(localSvnPath, OSType);
		}
		if(localSvnPath1 != null && !localSvnPath1.isEmpty())
		{
			localSvnPath1 = Path.localDirPathFormat(localSvnPath1, OSType);
		}
		
		//如果去除realDocPath的限制，文件系统前置将具备非常大的灵活性和破坏性（可以查看和删除后台的所有文件）
		//仓库位置与RealDoc存储位置不能重复
		if(isPathConflict(path,realDocPath))
		{
			Log.debug("addRepos() 仓库存储路径与文件存储路径冲突");
			String ErrMsg = "仓库存储路径:" + path + " 与文件存储路径:" + realDocPath + " 冲突";
			rt.setError(ErrMsg);
			writeJson(rt, response);		
			return;	
		}
		
		//Set reposInfo
		Repos repos = new Repos();
		repos.setName(name);
		repos.setInfo(info);
		repos.setType(type);
		repos.setPath(path);
		repos.setRealDocPath(realDocPath);
		repos.setRemoteStorage(remoteStorage);
		repos.setOwner(login_user.getId());
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		repos.setCreateTime(nowTimeStamp);
		//RealDoc VerCtrlInfo
		repos.setVerCtrl(verCtrl);
		repos.setIsRemote(isRemote);
		repos.setLocalSvnPath(localSvnPath);
		repos.setSvnPath(svnPath);
		repos.setSvnUser(svnUser);
		repos.setSvnPwd(svnPwd);
		//VirtualDoc VerCtrlInfo		
		repos.setVerCtrl1(verCtrl1);
		repos.setIsRemote1(isRemote1);
		repos.setLocalSvnPath1(localSvnPath1);
		repos.setSvnPath1(svnPath1);
		repos.setSvnUser1(svnUser1);
		repos.setSvnPwd1(svnPwd1);
		repos.setAutoBackup(autoBackup);
		
		//以下这段代码是为了避免有用户同时发起addRepos(前端快速点击添加操作也会引起该行为)，导致两个仓库的文件存储路径信息相同
		synchronized(syncLockForRepos)
		{
			//由于仓库还未创建，因此无法确定仓库路径是否存在冲突
			if(checkReposInfoForAdd(repos, rt) == false)
			{
				Log.debug("checkReposInfoForAdd() failed");
				writeJson(rt, response);		
				return;			
			}
			
			if(reposService.addRepos(repos) == 0)
			{
				rt.setError("新增仓库记录失败");
				writeJson(rt, response);		
				return;
			}
			Integer reposId = repos.getId();
			Log.debug("new ReposId" + reposId);
			SyncLock.unlock(syncLockForRepos);			
		}
		
		//Lock the repos
		DocLock reposLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{	
			long lockTime = nowTimeStamp + 4*60*60*1000;
			reposLock = lockRepos(repos, lockType, lockTime, login_user, rt, false); 
			SyncLock.unlock(syncLock);
		}	
		
		if(reposLock == null)
		{
			rt.setError("锁定仓库失败！");
			writeJson(rt, response);		
			return;				
		}
		
		if(createReposLocalDir(repos,rt) == false)
		{
			deleteRepos(repos);			
			writeJson(rt, response);	
			return;
		}
		
		//Init verRepos for RealDoc
		if(initVerRepos(repos,true,rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			return;			
		}

		//Init verRepos for VirtualDoc
		if(initVerRepos(repos, false, rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			return;			
		}

		if(remoteStorage != null)
		{
			initReposRemoteStorageConfig(repos, remoteStorage);
		}
		
		if(remoteServer != null)
		{
			setReposRemoteServer(repos, remoteServer);
			initReposRemoteServerConfig(repos, remoteServer);		
		}
		
		//自动备份初始化
		//每个仓库都必须有备份任务状态HashMap（无论是否有自动备份任务，避免仓库修改时修改了HashMap导致旧的Task无法关闭，再addRepos和系统初始化时创建）
		reposLocalBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<Long, BackupTask>());
		reposRemoteBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<Long, BackupTask>());		
		if(autoBackup != null)
		{
			setReposAutoBackup(repos, autoBackup);
			initReposAutoBackupConfig(repos, autoBackup);
			if(repos.backupConfig != null)
			{
				addDelayTaskForLocalBackup(repos, repos.backupConfig.localBackupConfig, 0, 60L);
				addDelayTaskForRemoteBackup(repos, repos.backupConfig.remoteBackupConfig, 0, 60L);
			}
		}
		
		
		//初始化倉庫的全文搜索
		initReposTextSearchConfig(repos);
		setReposTextSearch(repos, isTextSearchEnabled);			
		
		setReposEncrypt(repos, encryptType);			

		InitReposAuthInfo(repos,login_user,rt);		
		unlockRepos(repos, lockType, login_user); 
		
		writeJson(rt, response);	
		addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库","成功", repos, null, null, "");
	}

	private boolean setReposTextSearch(Repos repos, Integer isReposTextSearchEnabled) {
		String reposTextSearchConfigPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
		
		String disableRealDocTextSearchFileName = "0";
		if(isReposTextSearchEnabled != null && isReposTextSearchEnabled == 1)
		{
			repos.textSearchConfig.realDocTextSearchDisableHashMap.remove("0");
			return FileUtil.delFile(reposTextSearchConfigPath + disableRealDocTextSearchFileName);
		}
		
		repos.textSearchConfig.realDocTextSearchDisableHashMap.put("0", "disabled");		
		return FileUtil.saveDocContentToFile("disabled", reposTextSearchConfigPath, disableRealDocTextSearchFileName, "UTF-8");
	}

	private void setReposEncrypt(Repos repos, Integer encryptType) {
		EncryptConfig config = null;
		if(encryptType != null && encryptType != 0)
		{
			config = getReposEncryptConfig(repos);
			if(config == null)
			{
				config = generateReposEncryptConfig(repos, encryptType);
			}
			
			if(config != null)
			{
				reposEncryptHashMap.put(repos.getId(), config);
			}
		}
		else
		{
			if(removeReposEncryptConfig(repos) == true)
			{
				reposEncryptHashMap.remove(repos.getId());				
			}
		}		
	}

	/****************   delete a Repository ******************/
	@RequestMapping("/deleteRepos.do")
	public void deleteRepos(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.info("\n****************** deleteRepos.do ***********************");
		Log.debug("deleteRepos vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以删除仓库
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(vid);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权删除该仓库!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		Repos repos = getRepos(vid);
		
		if(reposService.deleteRepos(vid) == 0)
		{
			rt.setError("仓库删除失败！");
			writeJson(rt, response);	
			return;
		}
		else
		{
			//Delete related doc auth Setting
			DocAuth docAuth = new DocAuth();
			docAuth.setReposId(vid);			
			reposService.deleteDocAuthSelective(docAuth);

			//Delete related repos auth Setting
			ReposAuth reposAuth = new ReposAuth();
			reposAuth.setReposId(vid);			
			reposService.deleteReposAuthSelective(reposAuth);

			//Delete Repos LocalDir
			deleteReposLocalDir(repos);
			
			//Delete Repos LocalVerRepos
			deleteLocalVerRepos(repos, true);
			deleteLocalVerRepos(repos, false);
			
			//Delete IndexLib
	    	LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,0));
			LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,1));
	    	LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,2));
		}
		
		deleteRemoteStorageConfig(repos);

		writeJson(rt, response);	
		
		addSystemLog(request, login_user, "deleteRepos", "deleteRepos", "删除仓库","成功", repos, null, null, "");
	}
	
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path, 
			String realDocPath,
			String remoteServer,
			String remoteStorage,
			Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd,
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1,
			Integer isTextSearchEnabled,
			Integer encryptType,
			String autoBackup,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** updateReposInfo.do ***********************");
		Log.debug("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path 
				+ " realDocPath:" + realDocPath 
				+ " remoteServer:" + remoteServer 
				+ " remoteStorage:" + remoteStorage 
				+" verCtrl: " + verCtrl + " isRemote:" + isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd 
				+ " verCtrl1: " + verCtrl1 + " isRemote1:"+ isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1
				+ " isTextSearchEnabled:" + isTextSearchEnabled);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以修改仓库
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(reposId);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权修改该仓库!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		//Set new ReposInfo
		Repos newReposInfo = new Repos();
		newReposInfo.setId(reposId);
		newReposInfo.setName(name);
		newReposInfo.setType(type);
		newReposInfo.setInfo(info);
		newReposInfo.setPath(path);
		newReposInfo.setRealDocPath(realDocPath);
		newReposInfo.setRemoteStorage(remoteStorage);
		newReposInfo.setVerCtrl(verCtrl);
		newReposInfo.setIsRemote(isRemote);
		newReposInfo.setLocalSvnPath(localSvnPath);
		newReposInfo.setSvnPath(svnPath);
		newReposInfo.setSvnUser(svnUser);
		newReposInfo.setSvnPwd(svnPwd);
		newReposInfo.setVerCtrl1(verCtrl1);
		newReposInfo.setIsRemote1(isRemote1);
		newReposInfo.setLocalSvnPath1(localSvnPath1);
		newReposInfo.setSvnPath1(svnPath1);
		newReposInfo.setSvnUser1(svnUser1);
		newReposInfo.setSvnPwd1(svnPwd1);
		newReposInfo.setAutoBackup(autoBackup);
		formatReposInfo(newReposInfo);
		
		//Get reposInfo (It will be used to revert the reposInfo)
		Repos reposInfo = getReposEx(reposId);
		formatReposInfo(reposInfo);

		if(type != null && type != reposInfo.getType())
		{
			Log.debug("Warning: 正在修改文件系统类型");		
		}
		else
		{
			newReposInfo.setType(reposInfo.getType());
		}
		
		if(checkReposInfoForUpdate(newReposInfo, reposInfo, rt) == false)
		{	
			if(isTextSearchEnabled != null)
			{
				if(isTextSearchEnabled != reposInfo.isTextSearchEnabled)
				{
					if(setReposTextSearch(reposInfo, isTextSearchEnabled) == false)
					{
						rt.setError("设置全文搜索失败");
						writeJson(rt, response);
						return;
					}
				}
			}
			
			writeJson(rt, response);	
			return;
		}
		
		if(remoteStorage != null)
		{
			initReposRemoteStorageConfig(reposInfo, remoteStorage);
		}
		
		if(remoteServer != null)
		{
			setReposRemoteServer(reposInfo, remoteServer);
			initReposRemoteServerConfig(reposInfo, remoteServer);
		}		
		
		if(autoBackup != null)
		{
			setReposAutoBackup(reposInfo, autoBackup);
			initReposAutoBackupConfig(reposInfo, autoBackup);
			if(reposInfo.backupConfig != null)
			{
				addDelayTaskForLocalBackup(reposInfo, reposInfo.backupConfig.localBackupConfig, 0, 60L);
				addDelayTaskForRemoteBackup(reposInfo, reposInfo.backupConfig.remoteBackupConfig, 0, 60L);
			}
		}
		
		//设置全文搜索
		if(isTextSearchEnabled != null)
		{
			if(isTextSearchEnabled != reposInfo.isTextSearchEnabled)
			{
				setReposTextSearch(reposInfo, isTextSearchEnabled);				
			}
		}
		
		if(encryptType != null)
		{			
			if(reposInfo.encryptType == null || encryptType != reposInfo.encryptType)
			{
				setReposEncrypt(reposInfo, encryptType);				
			}			
		}
		
		//Update ReposInfo
		if(reposService.updateRepos(newReposInfo) == 0)
		{
			Log.debug("仓库信息更新失败");	//这个其实还不是特别严重，只要重新设置一次即可
			rt.setError("仓库信息更新失败！");
			writeJson(rt, response);	
			return;
		}
		
		if(ChangeReposPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			Log.debug("仓库目录修改失败");
			writeJson(rt, response);	
			return;
		}
		
		if(ChangeReposRealDocPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			Log.debug("仓库RealDoc目录修改失败");
			writeJson(rt, response);	
			return;
		}
		
		//To get updated reposInfo
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		if(isVerReposInfoChanged(newReposInfo, reposInfo, true))
		{
			if(initVerRepos(repos, true, rt) == false)
			{
				reposService.updateRepos(reposInfo);	//Revert reposInfo
				Log.debug("版本仓库初始化失败");	//这个其实还不是特别严重，只要重新设置一次即可
				rt.setError("版本仓库初始化失败！");
				writeJson(rt, response);	
				return;
			}
		}
		
		if(isVerReposInfoChanged(newReposInfo, reposInfo, false))
		{
			if(initVerRepos(repos, false, rt) == false)
			{
				reposService.updateRepos(reposInfo);	//Revert reposInfo
				Log.debug("版本仓库初始化失败");	//这个其实还不是特别严重，只要重新设置一次即可
				rt.setError("版本仓库初始化失败！");
				writeJson(rt, response);	
				return;
			}
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库","成功", repos, null, null, "");
		
		//如果RealDoc版本仓库的类型变化，那么必须删除所有的doc记录并重新同步
		if(isReposVerCtrlChanged(newReposInfo, reposInfo))
		{
			Log.debug("updateReposInfo() 版本仓库类型变更 from " + reposInfo.getVerCtrl() + " to " + newReposInfo.getVerCtrl());
			if(dbDeleteAllDocs(repos) == true)
			{
				//Add doc for AutoSync
				List<CommonAction> actionList = new ArrayList<CommonAction>();	//For AsyncActions
				String reposPath = Path.getReposPath(repos);
				String localRootPath = Path.getReposRealPath(repos);
				String localVRootPath = Path.getReposVirtualPath(repos);			
				Doc rootDoc = buildBasicDoc(reposId, 0L, -1L, reposPath, "", "", 0, 2, true, localRootPath, localVRootPath, null, null);
				addDocToSyncUpList(actionList, repos, rootDoc, Action.SYNC, login_user, "自动同步：版本仓库类型变更 " + reposInfo.getVerCtrl() + ":" + newReposInfo.getVerCtrl(), true);
				executeUniqueCommonActionList(actionList, rt);
			}
			else
			{
				Log.debug("updateReposInfo() dbDeleteAllDocs failed");
			}
		}
	}

	private boolean isReposVerCtrlChanged(Repos newReposInfo, Repos reposInfo) {
		Integer newVerCtrl = newReposInfo.getVerCtrl();
		Integer verCtrl = reposInfo.getVerCtrl();
		if(newVerCtrl == null)
		{
			return false;
		}
		
		if(verCtrl == null)
		{
			return true;
		}	
			
		if(!verCtrl.equals(newVerCtrl))
		{
			return true;
		}
		
		return false;
	}

	private boolean dbDeleteAllDocs(Repos repos) {
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		if(reposService.deleteDoc(qDoc) == 0)
		{
			return false;
		}
		return true;
	}

	private void formatReposInfo(Repos repos) {
		String path = repos.getPath();
		String realDocPath = repos.getRealDocPath();
		String localSvnPath = repos.getLocalSvnPath();
		String localSvnPath1 = repos.getLocalSvnPath1();

		//参数格式化
		if(path != null && !path.isEmpty())
		{
			path = Path.localDirPathFormat(path, OSType);
		}
		if(realDocPath != null && !realDocPath.isEmpty())
		{
			realDocPath = Path.localDirPathFormat(realDocPath, OSType);
		}
		if(localSvnPath != null && !localSvnPath.isEmpty())
		{
			localSvnPath = Path.localDirPathFormat(localSvnPath, OSType);
		}
		if(localSvnPath1 != null && !localSvnPath1.isEmpty())
		{
			localSvnPath1 = Path.localDirPathFormat(localSvnPath1, OSType);
		}
		
		repos.setPath(path);
		repos.setRealDocPath(realDocPath);
		repos.setLocalSvnPath(localSvnPath);
		repos.setLocalSvnPath1(localSvnPath1);
	}
	
	/****************   clear Repository File Cache ******************/
	@RequestMapping("/clearReposCache.do")
	public void clearReposCache(Integer reposId, String path,String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** clearReposCache.do ***********************");
		Log.debug("clearReposCache reposId:" + reposId + " path: " + path + " name: " + name);

		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以清除仓库缓存
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(reposId);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权进行该操作!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		if(clearReposFileCache(repos, rt) == false)
		{
			Log.docSysErrorLog("仓库 [" + repos.getName() +"] 缓存清除失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//刷新操作可以完成重建索引，因此不需要在这里处理
//		new Thread(new Runnable() {
//			public void run() {
//				Log.debug("clearReposCache() rebuildReposAllDocIndex() in new Thread");
//				//重建仓库的所有文件索引
//				rebuildReposAllDocIndex(repos);
//			}
//		}).start();
		
		writeJson(rt, response);		
	}
	
	/****************   clear Repository File Cache ******************/
	@RequestMapping("/clearAllReposCache.do")
	public void clearAllReposCache(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** clearAllReposCache.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以清除仓库缓存
		{
			rt.setError("您无权进行该操作!");				
			writeJson(rt, response);	
			return;
		}
		
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0;i<reposList.size();i++)
		{
			Repos repos = reposList.get(i);
			if(clearReposFileCache(repos, rt) == false)
			{
				Log.info("仓库 [" + repos.getName() + "] 缓存清除失败！");
			}
			else
			{
				Log.info("仓库 [" + repos.getName() + "] 缓存清除成功！");				
			}
		}
		
		writeJson(rt, response);		
	}

	private void rebuildReposAllDocIndex(Repos repos) {
		//Delete All Index Lib
		deleteDocNameIndexLib(repos);
		deleteRDocIndexLib(repos);
		deleteVDocIndexLib(repos);
		
		//Build All Index For RootDoc
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildRootDoc(repos, localRootPath, localVRootPath);
		ReturnAjax rt = new ReturnAjax();
		buildIndexForDoc(repos, doc, null, null, rt, 2, true);		
	}

	private boolean clearReposFileCache(Repos repos, ReturnAjax rt) {
		String reposTmpPath = Path.getReposTmpPath(repos);
		return FileUtil.clearDir(reposTmpPath);
	}

	/****************   get Repository Menu so that we can touch the docId******************/
	@RequestMapping("/getReposInitMenu.do")
	public void getReposInitMenu(Integer reposId,Long docId, Long pid, String path, String name, Integer level, Integer type,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getReposInitMenu.do ***********************");
		Log.debug("getReposInitMenu reposId: " + reposId + " docId: " + docId  + " pid:" + pid + " path:" + path + " name:"+ name + " level:" + level + " type:" + type + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		//Log.printObject("getReposInitMenu() repos:", repos);
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, reposAccess.getRootDocPath(), reposAccess.getRootDocName(), null, 2, true, localRootPath, localVRootPath, null, null);
		//Log.printObject("getReposInitMenu() rootDoc:", rootDoc);
		
		//get the rootDocAuth
		DocAuth rootDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), rootDoc, reposAccess.getAuthMask());
		if(rootDocAuth == null || rootDocAuth.getAccess() == null || rootDocAuth.getAccess() == 0)
		{
			Log.debug("getReposInitMenu() 您没有该仓库的访问权限，请联系管理员！");
			rt.setError("您没有该仓库的访问权限，请联系管理员！");
			writeJson(rt, response);			
			return;
		}
		
		//Log.printObject("getReposInitMenu() rootDocAuth:", rootDocAuth);
		
		//不对文件分享的根目录进行密码检查(用户只有在输入了密码后才能分享根目录)
		if(shareId == null)
		{
			String pwd = getDocPwd(repos, rootDoc);
			if(pwd != null && !pwd.isEmpty())
			{
				//Do check the sharePwd
				String docPwd = (String) session.getAttribute("docPwd_" + reposId + "_" + rootDoc.getDocId());
				if(docPwd == null || docPwd.isEmpty() || !docPwd.equals(pwd))
				{
					Log.docSysErrorLog("访问密码错误！", rt);
					rt.setMsgData("1"); //访问密码错误或未提供
					rt.setData(rootDoc);
					writeJson(rt, response);
					return;
				}
			}
		}
		
		//getReposInitMenu是获取仓库或分享根目录下的文件列表（分享的不是仓库的根目录，那么总是返回分享的文件或目录）
		List <Doc> docList = new ArrayList<Doc>();
		if(rootDoc.getDocId() != 0) //不是仓库根目录
		{
			File rootFile = new File(localRootPath + reposAccess.getRootDocPath(), reposAccess.getRootDocName());
			if(rootFile.exists() == false)
			{
				Log.docSysErrorLog("根目录不存在！",rt);
				writeJson(rt, response);			
				return;
			}
			
			rootDoc.setSize(rootFile.length());
			rootDoc.setCreateTime(rootFile.lastModified());
			rootDoc.setLatestEditTime(rootFile.lastModified());
			docList.add(rootDoc);
			
			//如果rootDoc是文件则不需要获取子目录文件
			if(rootFile.isFile())
			{
				rootDoc.setType(1);
				rt.setData(docList);
				writeJson(rt, response);			
				return;
			}
		}
		
		//docAuthHashMap for login_user
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUserId(), repos.getId(), reposAccess.getAuthMask());
		//Log.printObject("getReposInitMenu() docAuthHashMap:", docAuthHashMap);
		
		//getReposInitMenu如果指定了path和name表示要获取从根目录到该doc的文件列表，否则表示获取rootDoc下的子目录即可
		Doc doc = null;
		if(path != null && name != null)
		{
			doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
			if(doc.getDocId() == rootDoc.getDocId())
			{
				doc = null;
			}
			else
			{
				//Log.printObject("getReposInitMenu() doc:", doc);
				String pwd = getDocPwd(repos, doc);
				if(pwd != null && !pwd.isEmpty())
				{
					//Do check the sharePwd
					String docPwd = (String) session.getAttribute("docPwd_" + reposId + "_" + doc.getDocId());
					if(docPwd == null || docPwd.isEmpty() || !docPwd.equals(pwd))
					{
						Log.docSysErrorLog("访问密码错误！", rt);
						rt.setMsgData("1"); //访问密码错误或未提供
						rt.setData(doc);
						writeJson(rt, response);
						return;
					}
				}
			}
		}
		
		List <Doc> subDocList = null;
		if(doc == null)
		{
			subDocList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, rt);
		}
		else
		{
			//获取用户可访问文件列表(From Root to Doc)
			subDocList = getDocListFromRootToDoc(repos, doc, rootDocAuth, rootDoc, docAuthHashMap, rt);
		}
		
		if(subDocList != null)
		{
			docList.addAll(subDocList);
		}
		
		//Log.printObject("getReposInitMenu() docList:", docList);

		rt.setData(docList);	
		writeJson(rt, response);
	}

	/* 
	 * get subDocList under path
	 * 
	 * 注意：该接口的参数是前台自动填充的，因此请勿修改参数名字，否则将导致接口错误	
	 *   
	 */
	@RequestMapping("/getSubDocList.do")
	public void getSubDocList(Integer vid, Long docId, Long pid, String path, String name, Integer level, Integer type,
			Integer shareId,
			String sort,
			Integer needLockState,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getSubDocList.do ***********************");
		Log.debug("getSubDocList reposId: " + vid + " docId: " + docId  + " pid:" + pid + " path:" + path + " name:"+ name + " level:" + level + " type:" + type + " shareId:" + shareId + " sort:" + sort + " needLockState:" +  needLockState);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, vid, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = getReposEx(vid);
		if(repos == null)
		{
			rt.setError("仓库 " + vid + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		//getSubDocList如果没有指定path和name表示要获取仓库根目录或者分享根目录（分享的不是仓库根目录，那么总是返回分享的文件或目录）
		List <Doc> docList = new ArrayList<Doc>();
		Doc doc = null;
		if(path == null)
		{
			Doc rootDoc = buildBasicDoc(vid, null, null, reposPath, reposAccess.getRootDocPath(), reposAccess.getRootDocName(), null, 2, true, localRootPath, localVRootPath, null, null);
			Log.printObject("getSubDocList() rootDoc:", rootDoc);
			
			if(rootDoc.getDocId() != 0) //不是仓库根目录
			{
				File rootFile = new File(localRootPath + reposAccess.getRootDocPath(), reposAccess.getRootDocName());
				if(rootFile.exists() == false)
				{
					Log.docSysErrorLog("根目录不存在！",rt);
					writeJson(rt, response);			
					return;
				}
				
				rootDoc.setSize(rootFile.length());
				rootDoc.setCreateTime(rootFile.lastModified());
				rootDoc.setLatestEditTime(rootFile.lastModified());
				docList.add(rootDoc);
				
				if(rootFile.isFile())
				{
					rootDoc.setType(1);
				}
				
				Log.printObject("getSubDocList() docList:", docList);
				docList = updateLockStateAndsortDocList(docList, sort, needLockState);
				rt.setData(docList);
				writeJson(rt, response);			
				return;				
			}
			doc = rootDoc;
		}
		
		if(doc == null)
		{
			doc = buildBasicDoc(repos.getId(), docId, null, reposPath, path, name, null,2, true, localRootPath, localVRootPath, null, null);
		}
		
		Integer reposId = repos.getId();
		String pwd = getDocPwd(repos, doc);
		if(pwd != null && !pwd.isEmpty())
		{
			//Do check the sharePwd
			String docPwd = (String) session.getAttribute("docPwd_" + reposId + "_" + doc.getDocId());
			if(docPwd == null || docPwd.isEmpty() || !docPwd.equals(pwd))
			{
				Log.docSysErrorLog("访问密码错误！", rt);
				rt.setMsgData("1"); //访问密码错误或未提供
				writeJson(rt, response);
				return;
			}
		}
		
		Doc tmpDoc = docSysGetDoc(repos, doc, true);
		if(tmpDoc == null)
		{
			Log.debug("getSubDocList() 文件 " + doc.getPath() + doc.getName() + " 不存在！");
			rt.setData("");
			rt.setMsgInfo("文件 " + doc.getPath() + doc.getName() + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		if(tmpDoc.getType() == null || tmpDoc.getType() == 1)
		{
			Log.debug("getSubDocList() [" + doc.getPath() + doc.getName() + "] 是文件");
			docList.add(tmpDoc);
			
			docList = updateLockStateAndsortDocList(docList, sort, needLockState);
			rt.setData(docList);
			writeJson(rt, response);			
			return;			
		}
		
		//get the rootDocAuth
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
		if(docAuth == null || docAuth.getAccess() == null || docAuth.getAccess() == 0)
		{
			Log.debug("getSubDocList() 您没有该目录的访问权限，请联系管理员！");
			rt.setError("您没有该目录的访问权限，请联系管理员！");
			writeJson(rt, response);			
			return;
		}
		
		//docAuthHashMap for access_user
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUserId(), repos.getId(), reposAccess.getAuthMask());
		
		docList = getAccessableSubDocList(repos, doc, docAuth, docAuthHashMap, rt);

		if(docList == null)
		{
			rt.setData("");
		}
		else
		{
			docList = updateLockStateAndsortDocList(docList, sort, needLockState);
			rt.setData(docList);	
		}
		Log.debug("getSubDocList() docList ready");
		writeJson(rt, response);
		
		//Add doc for AutoSync
		List<CommonAction> actionList = new ArrayList<CommonAction>();	//For AsyncActions
		addDocToSyncUpList(actionList, repos, doc, Action.UNDEFINED, null, null, true);
		new Thread(new Runnable() {
				public void run() {
					Log.debug("getSubDocList() executeUniqueCommonActionList in new thread");
					executeUniqueCommonActionList(actionList, rt);
				}
			}).start();
	}
	
	/* 
	 * 
	 该接口用于远程存储
	 *   
	 */
	@RequestMapping("/getSubDocListRS.do")
	public void getSubDocListEx(Integer reposId, String remoteDirectory, String path,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getSubDocListRS.do ***********************");
		Log.debug("getSubDocListRS reposId: " + reposId + " remoteDirectory:" + remoteDirectory + " path:" + path);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null) == false)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//Get SubDocList From Server Dir
		if(reposId == null)
		{
			Repos vRepos = new Repos();			
			vRepos.setRealDocPath(remoteDirectory);
			Doc doc = buildBasicDoc(null, null, null, "", path, "", null, 2, true, remoteDirectory, null, null, null);
			List<Doc> list = getLocalEntryList(vRepos, doc);
			rt.setData(list);
			writeJson(rt, response);			
			return;			
		}
		
		//get SubDocList From Repos
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		List <Doc> docList = new ArrayList<Doc>();
		Doc doc = null;
		if(path == null)
		{
			Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, "", "", null, 2, true, localRootPath, localVRootPath, null, null);
			doc = rootDoc;
		}
			
		if(doc == null)
		{
			doc = buildBasicDoc(reposId, null, null, reposPath, path, "", null,2, true, localRootPath, localVRootPath, null, null);
		}
						
		Doc tmpDoc = docSysGetDoc(repos, doc, true);
		if(tmpDoc == null)
		{
			Log.debug("getSubDocListRS() 文件 " + doc.getPath() + doc.getName() + " 不存在！");
			rt.setMsgInfo("文件 " + doc.getPath() + doc.getName() + " 不存在！");
			writeJson(rt, response);			
			return;
		}
			
		if(tmpDoc.getType() == null || tmpDoc.getType() == 1)
		{
			Log.debug("getSubDocListRS() [" + doc.getPath() + doc.getName() + "] 是文件");
			writeJson(rt, response);			
			return;			
		}
			
		//get the rootDocAuth
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
		if(docAuth == null || docAuth.getAccess() == null || docAuth.getAccess() == 0)
		{
			Log.debug("getSubDocListRS() 您没有该目录的访问权限，请联系管理员！");
			rt.setError("您没有该目录的访问权限，请联系管理员！");
			writeJson(rt, response);			
			return;
		}
			
		//docAuthHashMap for access_user
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUserId(), repos.getId(), reposAccess.getAuthMask());
		
		docList = getAuthedSubDocList(repos, doc, docAuth, docAuthHashMap, false, rt);
		rt.setData(docList);	
		Log.debug("getSubDocListRS() docList ready");
		writeJson(rt, response);
	}
	
	List<Doc> updateLockStateAndsortDocList(List<Doc> docList, String sort, Integer needLockState) 
	{
		if(needLockState != null)
		{
			getAndSetDocLockState(docList);
		}
		
		if(sort != null && !sort.isEmpty())
		{
			docList = sortDocList(docList, sort);
		}
		return docList;
	}
	
	void getAndSetDocLockState(List<Doc> docList)
	{
		for(Doc doc: docList)
		{
			DocLock docLock = getDocLock(doc);
			if(docLock != null)
			{
				int curLockState = docLock.getState();
				doc.setState(curLockState);
				doc.locker = docLock.locker;
				doc.lockBy = docLock.lockBy;
				doc.lockTime = docLock.lockTime;	
			}
		}
	}
	
	/****************   get Repository Menu Info (Directory structure) ******************/
	@RequestMapping("/getReposManagerMenu.do")
	public void getReposManagerMenu(Integer vid,Long docId, Long pid, String path, String name, Integer level, Integer type, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response){		
		Log.info("\n****************** getReposManagerMenu.do ***********************");
		Log.debug("getReposManagerMenu vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//获取的仓库权限
		//获取整个仓库的目录结构，包括仓库本身（作为ID=0的存在）
		//获取仓库信息，并转换成rootDoc
		Repos repos = getReposEx(vid);
		
		//Build rootDoc
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc rootDoc = buildRootDoc(repos, localRootPath, localVRootPath);
		
		//获取用户可访问文件列表(From Root to docId)
		
		//get the rootDocAuth
		DocAuth rootDocAuth = null;
		rootDocAuth = getUserDispDocAuth(repos, login_user.getId(), rootDoc);
		if(rootDocAuth == null || rootDocAuth.getAccess() == null || rootDocAuth.getAccess() == 0)
		{
			if(login_user.getType() == 2)	//超级管理员可以访问所有目录
			{
				rootDocAuth = new DocAuth();
				rootDocAuth.setAccess(1);
				Log.debug("超级管理员");
			}
			else
			{
				
				Log.debug("getReposManagerMenu() 您没有该仓库的访问权限，请联系管理员！");
				rt.setError("您没有该仓库的访问权限，请联系管理员！");
				writeJson(rt, response);			
				return;
			}
		}
		
		//docAuthHashMap for login_user
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMap(login_user.getId(),repos.getId());
		
		List <Doc> docList = null;
		if(docId == null || docId == 0)
		{
			docList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, rt);
		}
		else
		{
			Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
			
			//获取用户可访问文件列表(From Root to Doc)
			docList = getDocListFromRootToDoc(repos, doc, rootDocAuth, null, docAuthHashMap, rt);
		}
		
		//合并列表
		if(docList == null)
		{
			docList = new ArrayList<Doc>();
		}
		
		docList.add(rootDoc);
		rt.setData(docList);
		writeJson(rt, response);		
	}

	/********** 获取系统所有用户和任意用户 ：前台用于给仓库添加访问用户，返回的结果实际上是reposAuth列表***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(String searchWord, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getReposAllUsers.do ***********************");
		Log.debug("getReposAllUsers searchWord:" + searchWord + " reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(searchWord != null && !searchWord.isEmpty())
		{
			user = new User();
			user.setName(searchWord);
			user.setRealName(searchWord);
			user.setNickName(searchWord);
			user.setEmail(searchWord);
			user.setTel(searchWord);
		}
		
		//获取All UserList
		List <ReposAuth> UserList = getReposAllUsers(user, reposId);
		
		rt.setData(UserList);
		writeJson(rt, response);
		
	}
	
	private List<ReposAuth> getReposAllUsers(User user, Integer reposId) {
		//获取user表（通过reposId来joint reposAuht表，以确定用户的仓库权限），结果实际是reposAuth列表
		List<ReposAuth> UserList = null;
		if(user == null)
		{
			UserList = reposService.getReposAllUsers(reposId);
		}
		else
		{
			HashMap<String, String> param = buildQueryParamForObj(user, null, null);
			param.put("reposId", reposId+"");
			UserList = reposService.queryReposMemberWithParamLike(param);				
		}
		Log.printObject("UserList:",UserList);	
				
		//获取任意用户的ReposAuth，因为任意用户是虚拟用户在数据库中不存在，因此需要单独获取
		ReposAuth anyUserReposAuth = getUserReposAuth(0,reposId); //获取任意用户的权限表
		if(anyUserReposAuth == null)	//用户未设置，则将任意用户加入到用户未授权用户列表中去
		{
			anyUserReposAuth = new ReposAuth();
			anyUserReposAuth.setUserId(0);
			anyUserReposAuth.setUserName("任意用户");
		}
		else
		{
			anyUserReposAuth.setUserName("任意用户");
		}
		UserList.add(anyUserReposAuth);	//将任意用户插入到ReposUserList			
		return UserList;
	}	
	
	/********** 获取系统所有用户组 ：前台用于给仓库添加访问用户组，返回的结果实际上是reposAuth列表***************/
	@RequestMapping("/getReposAllGroups.do")
	public void getReposAllGroups(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getReposAllGroups.do ***********************");
		Log.debug("getReposAllGroups reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All GroupList
		List <ReposAuth> List = reposService.getReposAllGroups(reposId);	
		
		rt.setData(List);
		writeJson(rt, response);
		
	}
	
	/**************** 获取 doc 所有的 用户/用户组权限  ******************/
	@RequestMapping("/getDocAuthList.do")
	public void getDocAuthList(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getDocAuthList.do ***********************");
		Log.debug("getDocAuthList reposId: " + reposId + " docId:" + docId + " path:" + path + " name:" + name);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			Log.debug("getDocAuthList() 用户未登录，请先登录！");
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查当前用户的权限
		if(isAdminOfDoc(repos, login_user, doc) == false)
		{
			Log.debug("getDocAuthList() isAdminOfDoc return false");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//获取DocAuthList
		//Step1: 获取仓库可访问用户和组列表
		List <ReposAuth> reposAuthList = getReposAuthList(reposId);
		Log.debug("getDocAuthList() reposAuthList size is "+ reposAuthList.size());
		Log.printObject("reposAuthList:", reposAuthList);
		
		//Step2: 获取可访问的用户、组的权限列表
		List <DocAuth> docAuthList = new ArrayList<DocAuth>();
		for(int i=0;i<reposAuthList.size();i++)
		{
			ReposAuth reposAuth = reposAuthList.get(i);
			Integer userId = reposAuth.getUserId();
			Integer groupId = reposAuth.getGroupId();

			Log.debug("getDocAuthList() userId:" + userId + " groupId:" + groupId);
			DocAuth docAuth = null;
			if(groupId != null && groupId != 0)
			{
				docAuth = getGroupDispDocAuth(repos, groupId, doc);
			}
			else if(userId!= null)	//It is user
			{
				docAuth = getUserDispDocAuth(repos, userId, doc);
			}
			Log.printObject("docAuth:", docAuth);
			
			if(docAuth !=null)
			{
				docAuth.setReposAuthId(reposAuth.getId());
				docAuthList.add(docAuth);
			}	
		}
		
		//如果是根目录，则要将仓库下其他的 直接设置 显示出来
//		if(docId == null || docId == 0)
//		{
//			List <DocAuth> allDocAuthList = reposService.getAllDocAuthList(reposId);
//			if(allDocAuthList != null)
//			{
//				//add the docAuth to docAuthList which docId is not 0
//				for(int i=0;i<allDocAuthList.size();i++)
//				{
//					DocAuth tmpDocAuth = allDocAuthList.get(i);
//					if(tmpDocAuth == null)
//					{
//						Log.debug("getDocAuthList() allDocAuthList[" + i+ "] is null");
//						continue;
//					}
//					
//					//非组权限的时候需要判断是否时任意用户权限
//					if(tmpDocAuth.getGroupId() == null)
//					{
//						if(tmpDocAuth.getUserId() != null && tmpDocAuth.getUserId() == 0)
//						{
//							tmpDocAuth.setUserName("任意用户");
//						}
//					}
//					
//					if(tmpDocAuth.getDocId() != null && tmpDocAuth.getDocId() != 0)	//过滤掉docId = 0的权限（已经在里面了）
//					{
//						docAuthList.add(tmpDocAuth);						
//					}
//				}
//			}
//		}
		Log.printObject("docAuthList:",docAuthList);

		rt.setData(docAuthList);
		writeJson(rt, response);
	}

	private List<ReposAuth> getReposAuthList(Integer reposId) {
		Log.debug("getReposAuthList() reposId:" + reposId);
		List <ReposAuth> ReposAuthList = reposService.getReposAuthList(reposId);	//注意已经包括了任意用户
		return ReposAuthList;
	}
	
	/****************   Config User or Group or anyUser ReposAuth ******************/
	@RequestMapping("/configReposAuth.do")
	public void configReposAuth(Integer userId,Integer groupId, Integer reposId,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn, 
			Integer downloadEn, Long uploadSize, Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** configReposAuth.do ***********************");
		Log.debug("configReposAuth userId: " + userId  + " groupId:" + groupId + " reposId:" + reposId + " isAdmin:" + isAdmin 
				+ " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn 
				+ " downloadEn:"+ downloadEn + " uploadSize:"+ uploadSize + " heritable:" + heritable);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是仓库的管理员
		if(isAdminOfRepos(login_user,reposId) == false && isAdminOfRootDoc(repos, login_user) == false)
		{
			rt.setError("您没有该仓库的管理权限，无法添加用户 ！");
			writeJson(rt, response);			
			return;
		}
		
		//Confirm the ReposAuth Type and Priority
		Integer type = getAuthType(userId,groupId);
		Integer priority = getPriorityByAuthType(type);
		
		if(uploadSize == null)
		{
			uploadSize = Long.MAX_VALUE;
		}
		
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		if(type == 2)
		{
			qReposAuth.setGroupId(groupId);		
		}
		else
		{
			qReposAuth.setUserId(userId);
		}
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			qReposAuth.setType(type);
			qReposAuth.setPriority(priority);
			qReposAuth.setIsAdmin(isAdmin);
			qReposAuth.setAccess(access);
			qReposAuth.setEditEn(editEn);
			qReposAuth.setAddEn(addEn);
			qReposAuth.setDeleteEn(deleteEn);
			qReposAuth.setDownloadEn(downloadEn);
			qReposAuth.setUploadSize(uploadSize);
			qReposAuth.setHeritable(heritable);
			if(reposService.addReposAuth(qReposAuth) == 0)
			{
				if(type == 2)
				{
					rt.setError("用户组仓库权限新增失败");
				}
				else
				{
					rt.setError("用户仓库权限新增失败");
				}
				writeJson(rt, response);			
				return;
			}	
			
		}
		else
		{
			reposAuth.setIsAdmin(isAdmin);
			reposAuth.setAccess(access);
			reposAuth.setEditEn(editEn);
			reposAuth.setAddEn(addEn);
			reposAuth.setDeleteEn(deleteEn);
			reposAuth.setDownloadEn(downloadEn);
			reposAuth.setUploadSize(uploadSize);
			reposAuth.setHeritable(heritable);
			if(reposService.updateReposAuth(reposAuth) == 0)
			{
				if(type == 2)
				{
					rt.setError("用户组仓库权限更新失败");
				}
				else
				{
					rt.setError("用户仓库权限更新失败");
				}
				writeJson(rt, response);			
				return;
			}
		}
		writeJson(rt, response);	
		
		addSystemLog(request, login_user, "configReposAuth", "configReposAuth", "设置仓库权限","成功", repos, null, null, "");
	}
	
	/****************   delete User or Group or anyUser ReposAuth ******************/
	@RequestMapping("/deleteReposAuth.do")
	public void deleteUserReposAuth(Integer reposAuthId,Integer userId, Integer groupId, Integer reposId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** deleteReposAuth.do ***********************");
		Log.debug("deleteUserReposAuth reposAuthId:"  + reposAuthId + " userId: " + userId  + " groupId: " + groupId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfRepos(login_user,reposId) == false && isAdminOfRootDoc(repos, login_user) == false)
		{
			rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		if(reposService.deleteReposAuth(reposAuthId) == 0)
		{
			rt.setError("用户仓库权限删除失败！");
			writeJson(rt, response);			
			return;
		}
		
		//删除该用户在该仓库的所有的目录权限设置
		Integer type = getAuthType(userId,groupId);
		if(type != null)
		{
			DocAuth docAuth = new DocAuth();
			if(type == 2)
			{
				docAuth.setGroupId(groupId);		
			}
			else
			{
				docAuth.setUserId(userId);
			}
			docAuth.setReposId(reposId);
			reposService.deleteDocAuthSelective(docAuth);
		}
		writeJson(rt, response);
		
		addSystemLog(request, login_user, "deleteReposAuth", "deleteReposAuth", "删除仓库权限","成功", repos, null, null, "");
	}		
	
	/****************  Config User or Group or anyUser DocAuth ******************/
	@RequestMapping("/configDocAuth.do")
	public void configUserAuth( Integer reposId, Integer userId, Integer groupId, Long docId, Long pid, String path, String name, Integer level, Integer type,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,Integer downloadEn, Long uploadSize, Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** configDocAuth.do ***********************");
		Log.debug("configDocAuth reposId:" + reposId + " userId: " + userId +" groupId: " + groupId+ " docId:" + docId + " path:" + path + " name:" + name + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:" + downloadEn + " uploadSize:" + uploadSize + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查当前用户的权限
		if(isAdminOfDoc(repos, login_user, doc) == false)
		{
			Log.debug("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		if(uploadSize == null)
		{
			uploadSize = Long.MAX_VALUE;
		}
		
		//login_user不得设置超过自己的权限：超过了则无效
		if(isUserAuthExpanded(repos, login_user, doc, isAdmin,access,editEn,addEn,deleteEn,downloadEn,uploadSize,heritable,rt) == true)
		{
			Log.debug("超过设置者的权限 ！");
			writeJson(rt, response);			
			return;			
		}
		
		
		Integer authType = getAuthType(userId,groupId);
		if(authType == null)
		{
			Log.debug("configDocAuth getAuthType failed");
			rt.setError("getAuthType Failed");
			writeJson(rt, response);			
			return;
		}
		Integer priority = getPriorityByAuthType(authType);
		
		//获取用户的权限设置，如果不存在则增加，否则修改
		DocAuth qDocAuth = new DocAuth();
		if(authType == 2)
		{
			qDocAuth.setGroupId(groupId);	
		}
		else
		{
			qDocAuth.setUserId(userId);
		}
		qDocAuth.setDocId(docId);
		qDocAuth.setReposId(reposId);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)
		{
			Log.printObject("configDocAuth qDocAuth", qDocAuth);
			qDocAuth.setType(authType);
			qDocAuth.setPriority(priority);
			qDocAuth.setIsAdmin(isAdmin);
			qDocAuth.setAccess(access);
			qDocAuth.setEditEn(editEn);
			qDocAuth.setAddEn(addEn);
			qDocAuth.setDeleteEn(deleteEn);
			qDocAuth.setDownloadEn(downloadEn);
			qDocAuth.setUploadSize(uploadSize);			
			qDocAuth.setHeritable(heritable);
			qDocAuth.setDocPath(path);
			qDocAuth.setDocName(name);
			if(reposService.addDocAuth(qDocAuth) == 0)
			{
				if(authType == 2)
				{
					rt.setError("用户组文件权限增加失败");					
				}
				else
				{
					rt.setError("用户文件权限增加失败");					
				}
				writeJson(rt, response);			
				return;
			}
		}
		else
		{
			//Log.printObject("configDocAuth docAuth", docAuth);
			docAuth.setIsAdmin(isAdmin);
			docAuth.setAccess(access);
			docAuth.setEditEn(editEn);
			docAuth.setAddEn(addEn);
			docAuth.setDeleteEn(deleteEn);
			docAuth.setDownloadEn(downloadEn);
			docAuth.setUploadSize(uploadSize);
			
			docAuth.setHeritable(heritable);
			if(reposService.updateDocAuth(docAuth) == 0)
			{
				if(authType == 2)
				{
					rt.setError("用户组文件权限更新失败");					
				}
				else
				{
					rt.setError("用户文件权限更新失败");
				}
				writeJson(rt, response);			
				return;
			}
		}
		
		writeJson(rt, response);
		
		addSystemLog(request, login_user, "configDocAuth", "configDocAuth", "设置文件权限","成功", repos, null, null, "");

	}

	/****************   delete User or Group or anyUser  DocAuth ******************/
	@RequestMapping("/deleteDocAuth.do")
	public void deleteUserDocAuth(Integer reposId, Integer docAuthId,Integer userId, Integer groupId, Long docId, Long pid, String path, String name, Integer level, Integer type,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** deleteDocAuth.do ***********************");		
		Log.debug("deleteUserReposAuth docAuthId:"  + docAuthId + " userId: " + userId  + " groupId: " + groupId  + " docId: " + docId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查当前用户的权限
		if(isAdminOfDoc(repos, login_user, doc) == false)
		{
			rt.setError("您不是该仓库/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//检查该用户是否设置了目录权限
		if(reposService.deleteDocAuth(docAuthId) == 0)
		{
			rt.setError("用户的目录权限设置删除失败！");
			writeJson(rt, response);			
			return;	
		}
		writeJson(rt, response);		
		
		addSystemLog(request, login_user, "deleteDocAuth", "deleteDocAuth", "删除文件权限","成功", repos, null, null, "");
	}

	private boolean isUserAuthExpanded(Repos repos, User login_user, Doc doc, 
			Integer isAdmin, Integer access, Integer editEn, Integer addEn, Integer deleteEn, Integer downloadEn, Long uploadSize, Integer heritable,
			ReturnAjax rt) 
	{
		
		if(login_user.getType() == 2)
		{
			Log.debug("超级管理员");
			return false;
		}
		
		DocAuth docAuth = getUserDocAuth(repos, login_user.getId(), doc); 
		if(docAuth == null)
		{
			rt.setError("您没有该目录/文件的权限");
			return true;
		}
		
		if(docAuth.getIsAdmin()==null || isAdmin > docAuth.getIsAdmin())
		{
			rt.setError("您无权设置管理员权限");
			return true;
		}
		if(docAuth.getAccess()==null || access > docAuth.getAccess())
		{
			rt.setError("您无权设置读权限");
			return true;
		}
		if(docAuth.getEditEn()==null || editEn > docAuth.getEditEn())
		{
			rt.setError("您无权设置写权限");
			return true;
		}
		if(docAuth.getAddEn()==null || addEn > docAuth.getAddEn())
		{
			rt.setError("您无权设置新增权限");
			return true;
		}
		if(docAuth.getDeleteEn()==null || deleteEn > docAuth.getDeleteEn())
		{
			rt.setError("您无权设置删除权限");
			return true;
		}
		if(docAuth.getDownloadEn()==null || downloadEn > docAuth.getDownloadEn())
		{
			rt.setError("您无权设置下载权限");
			return true;
		}
		if(docAuth.getUploadSize() != null && (uploadSize == null || uploadSize > docAuth.getUploadSize()))
		{
			rt.setError("您设置上传大小超出您的权限");
			return true;
		}
		if(docAuth.getHeritable()==null || heritable > docAuth.getHeritable())
		{
			rt.setError("您无权设置权限继承");
			return true;
		}
		
		return false;
	}
	
	/********************* get UserDocAuth ******************************/
	@RequestMapping("/getUserDocAuth.do")
	public void getUserDocAuth(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, 
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n****************** getUserDocAuth.do ***********************");		
		Log.debug("getUserDocAuth "  + " docId: " + docId  + " reposId:" + reposId + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查该用户是否设置了目录权限
		DocAuth docAuth = getUserDispDocAuth(repos, reposAccess.getAccessUser().getId(), doc); 
		if(docAuth == null)
		{
			rt.setError("您没有该目录/文件的权限");
			return;
		}
		
		rt.setData(docAuth);
		writeJson(rt, response);			
	}

}
