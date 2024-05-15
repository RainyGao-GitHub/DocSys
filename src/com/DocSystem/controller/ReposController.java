package com.DocSystem.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.redisson.api.RBucket;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import util.DateFormat;
import util.ReturnAjax;
import util.LuceneUtil.LuceneUtil2;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.Path;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.BackupTask;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.entity.ReposSyncupConfig;
import com.DocSystem.common.entity.GenericTask;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
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
		Log.infoHead("****************** getDocSysConfig.do ***********************");
		ReturnAjax rt = new ReturnAjax();		
		
		JSONObject config = new JSONObject();
		config.put("defaultReposStorePath", Path.getDefaultReposRootPath(OSType));
		rt.setData(config);
		writeJson(rt, response);
	}

	/****************** get Repository List **************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("****************** getReposList.do ***********************");
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
		Log.infoHead("****************** getManagerReposList.do ***********************");
		
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

		Log.infoHead("****************** getRepos.do ***********************");
		Log.debug("getRepos vid: " + vid + " shareId:" + shareId);
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, vid, null, null, false,rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(vid);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		//Log.printObject("repos:", repos);
		
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
			String textSearch,
			String recycleBin,
			Integer encryptType,
			String autoSyncup,
			String autoBackup,
			String lang,
			HttpSession session,HttpServletRequest request,HttpServletResponse response){
		
		Log.infoHead("****************** addRepos.do ***********************");
		Log.debug("addRepos name: " + name + " info: " + info + " type: " + type + " path: " + path  
				+ " realDocPath: " + realDocPath 
				+ " remoteServer: " + remoteServer 
				+ " remoteStorage: " + remoteStorage 
				+ " verCtrl: " + verCtrl  + " isRemote:" +isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd 
				+ " verCtrl1: " + verCtrl1  + " isRemote1:" +isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1
				+ "textSearch:" + textSearch + " recycleBin:" + recycleBin + " autoSyncup:" + autoSyncup + " autoBackup:" + autoBackup);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
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
			docSysErrorLog("仓库存储路径不能为空！", rt);
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
		repos.setAutoSyncup(autoSyncup);
		repos.setAutoBackup(autoBackup);
		repos.setTextSearch(textSearch);
		repos.setRecycleBin(recycleBin);
		
		//以下这段代码是为了避免有用户同时发起addRepos(前端快速点击添加操作也会引起该行为)，导致两个仓库的文件存储路径信息相同
		String lockInfo = "addRepos() syncLockForRepos [" + repos.getName() + "]";
		String lockName = "syncLockForRepos";
		if(false == lockSyncSource("ReposAdd", lockName, lockInfo, 2*60*1000, syncLockForSystemLog, 3*1000, 3, systemUser))
		{
			Log.debug("addRepos() 获取线程锁失败");
			String ErrMsg = "获取线程锁失败";
			rt.setError(ErrMsg);
			writeJson(rt, response);
			return;
		}
			
		//由于仓库还未创建，因此无法确定仓库路径是否存在冲突
		if(checkReposInfoForAdd(repos, rt) == false)
		{
			redisSyncUnlockEx(lockName, lockInfo, syncLockForRepos);
			docSysDebugLog("addRepos() checkReposInfoForAdd [" + repos.getName() + "] Failed", rt);
			writeJson(rt, response);
			
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		if(reposService.addRepos(repos) == 0)
		{
			redisSyncUnlockEx(lockName, lockInfo, syncLockForRepos);
			rt.setError("新增仓库记录失败");
			writeJson(rt, response);		

			docSysDebugLog("addRepos() reposService.addRepos [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		Integer reposId = repos.getId();
		Log.debug("new ReposId" + reposId);

		unlockSyncSource(lockName, systemUser);
		
		//Lock the repos
		DocLock reposLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
    	long lockTime = nowTimeStamp + 4*60*60*1000;
		reposLock = lockRepos(repos, lockType, lockTime, login_user, rt, false, lockInfo); 
		
		if(reposLock == null)
		{
			rt.setError("锁定仓库失败！");
			writeJson(rt, response);	
			
			docSysDebugLog("addRepos() lockRepos [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;				
		}
		
		//初始化仓库数据
		initReposData(repos);
		setReposIsBusy(repos.getId(), true);
		
		if(createReposLocalDir(repos,rt) == false)
		{
			deleteRepos(repos);			
			writeJson(rt, response);
			setReposIsBusy(repos.getId(), false);
			
			docSysDebugLog("addRepos() createReposLocalDir [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		//Init verRepos for RealDoc
		setReposHistoryFormat(repos, false);	//设置历史版本使用新格式（MxsDoc自定义格式）
		if(initVerRepos(repos,true,rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			setReposIsBusy(repos.getId(), false);

			docSysDebugLog("addRepos() initVerRepos for real doc [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;			
		}

		//Init verRepos for VirtualDoc
		if(initVerRepos(repos, false, rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			setReposIsBusy(repos.getId(), false);
	
			docSysDebugLog("addRepos() initVerRepos for virtual doc [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
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
		reposLocalBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());
		reposRemoteBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());		
		if(autoBackup != null)
		{
			setReposAutoBackup(repos, autoBackup);
			initReposAutoBackupConfig(repos, autoBackup);
			if(repos.autoBackupConfig != null)
			{
				addDelayTaskForLocalBackup(repos, repos.autoBackupConfig.localBackupConfig, 10, null, true); //3600L); //1小时后开始备份
				addDelayTaskForRemoteBackup(repos, repos.autoBackupConfig.remoteBackupConfig, 10, null, true); //7200L); //2小时后开始备份
			}
		}
		
		//初始化倉庫的全文搜索
		if(textSearch != null)
		{
			setReposTextSearch(repos, textSearch);			
			initReposTextSearchConfig(repos, textSearch);
		}
		
		if(recycleBin != null)
		{
			setReposRecycleBin(repos, recycleBin);			
			initReposRecycleBinConfig(repos, recycleBin);
		}

		//初始化仓库的版本管理忽略配置
		initReposVersionIgnoreConfig(repos);
		
		setReposEncrypt(repos, encryptType);
		
		InitReposAuthInfo(repos,login_user,rt);		

		reposSyncupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<Long, GenericTask>());
		if(autoSyncup != null)
		{
			setReposAutoSyncup(repos, autoSyncup);
			initReposAutoSyncupConfig(repos, autoSyncup);
			if(repos.autoSyncupConfig != null)
			{
				addDelayTaskForReposSyncUp(repos, 10, 600L); //10分钟后自动同步
			}
		}
		
		unlockRepos(repos, lockType, login_user); 
		
		writeJson(rt, response);	

		setReposIsBusy(repos.getId(), false);

		addSystemLog(request, login_user, "addRepos", "addRepos", "新建仓库", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));

		//发送邮件备份密钥
		if(encryptType != null && encryptType != 0)
		{
			String encrptConfigPath = Path.getReposEncryptConfigPath(repos);
			String encrptConfigName = Path.getReposEncryptConfigFileName();
			sendEncrptFileWithEmail(rt, login_user.getEmail(), repos, encrptConfigPath + encrptConfigName, lang);
		}
	}

	protected boolean setReposRemoteServer(Repos repos, String remoteServer) {
		String reposRemoteServerConfigPath = Path.getReposRemoteServerConfigPath(repos);
		
		if(remoteServer == null || remoteServer.isEmpty())
		{
			return FileUtil.delFile(reposRemoteServerConfigPath + "remoteServer.conf");
		}
		
		return FileUtil.saveDocContentToFile(remoteServer, reposRemoteServerConfigPath, "remoteServer.conf", "UTF-8");
	}
	
	private boolean setReposTextSearch(Repos repos, String config) {
		String configPath = Path.getReposTextSearchConfigPath(repos);
		
		if(config == null || config.isEmpty())
		{
			return FileUtil.delFile(configPath + "textSearch.conf");
		}
		
		return FileUtil.saveDocContentToFile(config, configPath, "textSearch.conf", "UTF-8");
	}
	
	private boolean setReposRecycleBin(Repos repos, String config) {
		String configPath = Path.getReposRecycleBinConfigPath(repos);
		
		if(config == null || config.isEmpty())
		{
			return FileUtil.delFile(configPath + "recycleBin.conf");
		}
		
		return FileUtil.saveDocContentToFile(config, configPath, "recycleBin.conf", "UTF-8");
	}

	private void setReposEncrypt(Repos repos, Integer encryptType) {
		EncryptConfig config = null;
		if(encryptType != null && encryptType != 0)
		{
			config = parseReposEncryptConfig(repos);
			if(config == null)
			{
				config = generateReposEncryptConfig(repos, encryptType);
			}
			
			if(config != null)
			{
				setReposEncryptConfig(repos, config);
			}
		}
		else
		{
			if(removeReposEncryptConfig(repos) == true)
			{
				deleteReposEncryptConfig(repos);
			}
		}		
	}

	/****************   delete a Repository ******************/
	@RequestMapping("/deleteRepos.do")
	public void deleteRepos(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("****************** deleteRepos.do ***********************");
		Log.debug("deleteRepos vid: " + vid);
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
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
		
		Repos repos = getReposEx(vid);
		setReposIsBusy(repos.getId(), true);
		
		if(reposService.deleteRepos(vid) == 0)
		{
			rt.setError("仓库删除失败！");
			writeJson(rt, response);
			setReposIsBusy(repos.getId(), false);			

			docSysDebugLog("deleteRepos() reposService.deleteRepos [" + repos.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "deleteRepos", "deleteRepos", "删除仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		
		//DB delete success
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
		
		deleteReposRemoteStorageConfig(repos);

		deleteReposRemoteServerConfig(repos);
		
		if(redisEn)
		{
			//delete reposClusterCheckSum
			RBucket<Object> bucket = redisClient.getBucket("clusterDeployCheckSum" + repos.getId());
			bucket.delete();
		}

		writeJson(rt, response);	
		setReposIsBusy(repos.getId(), false);			

		addSystemLog(request, login_user, "deleteRepos", "deleteRepos", "删除仓库", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
	}
	
	/****************   delete a Repository ******************/
	@RequestMapping("/convertReposHistory.do")
	public void convertReposHistory(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("****************** convertReposHistory.do ***********************");
		Log.debug("convertReposHistory vid: " + vid);
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以转换仓库历史格式
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(vid);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权进行该操作!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		Repos repos = getReposEx(vid);
		if(repos.getVerCtrl() == null || repos.getVerCtrl() == 0)
		{
			rt.setError("该仓库未设置版本管理!");				
			writeJson(rt, response);	
			return;			
		}
		
		if(isLegacyReposHistory(repos, HistoryType_RealDoc) == false)
		{
			rt.setError("该仓库历史已是最新格式!");				
			writeJson(rt, response);	
			return;						
		}
		
		setReposIsBusy(repos.getId(), true);
		
		channel.convertReposHistory(repos, null, rt, HistoryType_RealDoc);
		
		writeJson(rt, response);	
		setReposIsBusy(repos.getId(), false);			

		addSystemLog(request, login_user, "convertReposHistory", "convertReposHistory", "转换仓库历史格式", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
	}
	
	@RequestMapping("/backupReposEncryptConfig.do")
	public void backupReposEncryptConfig(
			Integer reposId, 
			String lang,
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception 
	{
		Log.infoHead("****************** backupReposEncryptConfig.do ***********************");
		Log.debug("backupReposEncryptConfig reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "backupReposEncryptConfig", "backupReposEncryptConfig", "备份仓库密钥", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		Repos repos = getReposEx(reposId);		
		String path = Path.getReposEncryptConfigPath(repos);
		String name = Path.getReposEncryptConfigFileName();
		File file = new File(path, name);
		if(file.exists() == false)
		{
			docSysErrorLog("仓库密钥不存在！", rt);		
			writeJson(rt, response);			
			addSystemLog(request, login_user, "backupReposEncryptConfig", "backupReposEncryptConfig", "备份仓库密钥", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//备份仓库密钥文件
		String backupFileName = DateFormat.dateTimeFormat2(new Date()) + "_" + name;
		if(FileUtil.copyFile(path + name, path + backupFileName, false) == false)
		{
			docSysErrorLog("密钥文件备份失败！", rt);		
			writeJson(rt, response);		
			addSystemLog(request, login_user, "backupReposEncryptConfig", "backupReposEncryptConfig", "备份仓库密钥", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
				
		Log.debug("backupReposEncryptConfig() path:" + path + " backupFileName:" + backupFileName);		
		Doc downloadDoc = buildDownloadDocInfo(0, "","", path, backupFileName, 0);
		downloadDoc.encryptEn = 0;
		
		String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;
		rt.setData(downloadLink);
		writeJson(rt, response);			
		addSystemLog(request, login_user, "backupReposEncryptConfig", "backupReposEncryptConfig", "备份仓库密钥", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							

		//Send EncryptConfigFile to user with email
		sendEncrptFileWithEmail(rt, login_user.getEmail(), repos, path + backupFileName, lang);
		return;
	}
	

	private void sendEncrptFileWithEmail(ReturnAjax rt, String userMail, Repos repos, String encrypConfigFilePath, String lang) {
		Log.debug("sendEncrptFileWithEmail() userMail:" + userMail);
		if(userMail != null && userMail.isEmpty() == false)
		{
			String content = "";
			String emailTitle = "";
			
			if(lang == null)
			{
				lang = "ch"; //中文
			}
			switch(lang)
			{
			case "en":
				content = 
				"<br>"
				+ "Attachment is the key file for repository:" +repos.getId() + " [" + repos.getName()+ "]."
				+ "<br>It was used to encrypt and decrypt the files in this repository."
				+ "<br>Please store it in safe place!"
				+ "<br>"
				+ "<br>";
				emailTitle = "来自MxsDoc的邮件";
				break;
			default:
				content = 
					"<br>"
					+ "附件是" +repos.getId() + "号仓库[" + repos.getName()+ "]的密钥文件，用于仓库文件的加解密，请妥善保存。"
					+ "<br>"
					+ "<br>";
				emailTitle = "From MxsDoc";
				break;
			}
			String mailContent =  channel.buildMailContent(content, lang);
			if(mailContent == null)
			{
				mailContent = content;
			}
			
			File file = new File(encrypConfigFilePath);
			if(file.exists() == false)
			{
				Log.debug("sendEncrptFileWithEmail() " + encrypConfigFilePath + " 不存在");
				return;
			}
			
			Log.debug("sendEncrptFileWithEmail() send encrptConfigFile to " + userMail);
			emailService.sendEmailEx(rt, userMail, mailContent, emailTitle, encrypConfigFilePath);
		}
	}

	/****************   user triggered Repository Auto Backup ******************/
	@RequestMapping("/reposAutoBackup.do")
	public void reposAutoBackup(Integer reposId, Integer type, Integer fullBackup, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("****************** reposAutoBackup.do ***********************");
		Log.debug("reposAutoBackup() reposId: " + reposId + " type:" + type);
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		if(reposId == null || type == null)
		{
			rt.setError("参数错误, reposId:" + reposId + " type:" + type);			
			writeJson(rt, response);				
			return;				
		}
		
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, "", "", true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
				
		User login_user = reposAccess.getAccessUser();
		if(login_user.getType() != 2)	//超级管理员
		{
			rt.setError("您无权进行此操作，请联系系统管理员!");				
			writeJson(rt, response);	
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			writeJson(rt, response);
			return;
		}
		
		if(repos.autoBackupConfig == null)
		{
			rt.setError("该仓库未配置自动备份，请联系系统管理员!");				
			writeJson(rt, response);
			return;
		}
		
		BackupTask reposAutoBackupTask = null;
		switch(type)
		{
		case 1:	//本地备份
			if(repos.autoBackupConfig.localBackupConfig == null)
			{
				rt.setError("该仓库未配置本地自动备份，请联系系统管理员!");				
				writeJson(rt, response);
				return;
			}
			reposAutoBackupTask = addDelayTaskForLocalBackup(repos, repos.autoBackupConfig.localBackupConfig, 10, 120L, false); //2分钟后开始备份
			break;
		case 2: //异地备份
			if(repos.autoBackupConfig.remoteBackupConfig == null)
			{
				rt.setError("该仓库未配置异地自动备份，请联系系统管理员!");				
				writeJson(rt, response);
				return;
			}
			reposAutoBackupTask = addDelayTaskForRemoteBackup(repos, repos.autoBackupConfig.remoteBackupConfig, 10, 120L, false); //2分钟后开始备份
			break;
		default:
			rt.setError("仓库备份类型错误[" +type+ "]，请联系系统管理员!");				
			writeJson(rt, response);
			return;			
		}

		if(reposAutoBackupTask == null)
		{
			Log.info("reposAutoBackup() 仓库自动备份任务创建失败");
			rt.setError("仓库自动备份任务创建失败");				
			writeJson(rt, response);	
			
			addSystemLog(request, login_user, "reposAutoBackup", "reposAutoBackup", "创建仓库自动备份任务",  null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}	

		rt.setData(reposAutoBackupTask);
		rt.setMsgData(5);	//备份中...
		writeJson(rt, response);	
		addSystemLog(request, login_user, "reposAutoBackup", "reposAutoBackup", "创建仓库自动备份任务",  null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
	}
	
	/**************** queryReposAutoBackupTask ******************/
	@RequestMapping("/queryReposAutoBackupTask.do")
	public void queryReposAutoBackupTask(String taskId, Integer reposId, Integer type, Integer fullBackup, HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryReposAutoBackupTask.do ****************");
		Log.info("queryReposAutoBackupTask taskId:" + taskId + " reposId:" + reposId + " type:" + type + " fullBackup:" + fullBackup);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(reposId == null || type == null)
		{
			rt.setError("参数错误, reposId:" + reposId + " type:" + type);			
			writeJson(rt, response);			
			return;				
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			writeJson(rt, response);
			return;
		}
		
		ConcurrentHashMap<String, BackupTask> backUpTaskHashMap = null;
		BackupTask task = null;

		switch(type)
		{
		case 1:
			backUpTaskHashMap = reposLocalBackupTaskHashMap.get(repos.getId());
			if(backUpTaskHashMap == null)
			{
				Log.info("queryReposAutoBackupTask backUpTaskHashMap 未初始化");
				rt.setError("backUpTaskHashMap 未初始化");
				writeJson(rt, response);
				return;
			}
			
			task = backUpTaskHashMap.get(taskId);
			break;
		case 2:
			backUpTaskHashMap = reposRemoteBackupTaskHashMap.get(repos.getId());
			if(backUpTaskHashMap == null)
			{
				Log.info("queryReposAutoBackupTask backUpTaskHashMap 未初始化");
				rt.setError("backUpTaskHashMap 未初始化");
				writeJson(rt, response);
				return;
			}
			
			task = backUpTaskHashMap.get(taskId);
			break;
		default:
			rt.setError("仓库备份类型错误[" +type+ "]，请联系系统管理员!");				
			writeJson(rt, response);
			return;			
		}
				
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("仓库自动备份任务 " + taskId + " 不存在");
			writeJson(rt, response);			
			return;
		}

		switch(task.status)
		{
		case 0:
		case 1:
			//任务未结束
			rt.setData(task); //任务			
			rt.setMsgData(5);
			break;
		case 2:
			rt.setMsgData(0); //备份成功
			break;
		case 3:	
			//备份失败
			rt.setError(task.info);
			break;
		default:	//未知备份状态
			rt.setError("未知备份状态");
			break;
		}
		writeJson(rt, response);			
	}

	/****************   backup a Repository ******************/
	@RequestMapping("/backupRepos.do")
	public void backupRepos(Integer reposId, String backupStorePath, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("****************** backupRepos.do ***********************");
		Log.debug("backupRepos() reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, "", "", true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		User login_user = reposAccess.getAccessUser();
		if(login_user.getType() != 2)	//超级管理员
		{
			rt.setError("您无权进行此操作，请联系系统管理员!");				
			writeJson(rt, response);	
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		ReposFullBackupTask reposFullBackupTask = createReposFullBackupTask(
				repos,
				reposAccess,
				backupStorePath,
				getRequestIpAddress(request),
				rt);

		if(reposFullBackupTask == null)
		{
			Log.info("backupRepos() 仓库全量备份任务创建失败");
			writeJson(rt, response);	
			
			addSystemLog(request, login_user, "backupRepos", "backupRepos", "创建仓库全量备份任务",  null, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}	

		setReposIsBusy(repos.getId(), true);
		rt.setData(reposFullBackupTask);
		rt.setMsgData(5);	//备份中...
		writeJson(rt, response);	

		addSystemLog(request, login_user, "backupRepos", "backupRepos", "创建仓库全量备份任务",  null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
		
		//启动备份线程
		new Thread(new Runnable() {
			ReposFullBackupTask task = reposFullBackupTask;
			Integer reposId = repos.getId();
			public void run() {
				Log.debug("backupRepos() executeReposFullBackupTask in new thread");
				//executeReposFullBackupTask会负责写系统日志
				executeReposFullBackupTask(task);
				setReposIsBusy(reposId, false);
			}
		}).start();
	}
	
	private boolean executeReposFullBackupTask(ReposFullBackupTask task) {
		if(channel == null)
	    {
			Log.info("backupRepos 非商业版本不支持仓库全量备份");
			return false;
	    }
		boolean ret = channel.reposFullBackUp(task);
		return ret;
	}
	
	private ReposFullBackupTask createReposFullBackupTask(Repos repos,
			ReposAccess reposAccess, String backupStorePath,
			String requestIP, ReturnAjax rt) 
	{
		if(channel == null)
	    {
			Log.info("backupRepos 非商业版本不支持仓库全量备份");
			rt.setError("非商业版本不支持仓库全量备份");
			return null;
	    }

        Date curDate = new Date();
		long curTime = curDate.getTime();
		String backupTime = DateFormat.dateTimeFormat2(curDate);
        Log.info("createReposFullBackupTask() backupTime:" + backupTime);
        		
		String taskId = repos.getId() + "-" + backupTime;
		if(reposFullBackupTaskHashMap.get(taskId) != null)
		{
			Log.info("createReposFullBackupTask() 仓库全量备份任务 " + taskId + " 已存在");
			rt.setError("仓库全量备份任务 " + taskId + " 已存在");
			return null;
		}
		
		ReposFullBackupTask task =	new ReposFullBackupTask();
		task.id = taskId;
		task.createTime = curTime;				
		task.backupTime = backupTime;
		task.repos = repos;
		task.reposAccess = reposAccess;
		task.requestIP = requestIP;

		//压缩backupStorePath
		if(backupStorePath == null || backupStorePath.isEmpty())
		{
			task.backupStorePath = Path.getDefaultReposRootPath(OSType) + "ReposFullBackup/";
		}
		else
		{
			task.backupStorePath = backupStorePath;
		}

		task.targetPath = task.backupStorePath;
		task.targetName = repos.getId() + "-" + repos.getName() + "-" + backupTime + ".zip";
		
		task.status = 1; //备份中..
		
		task.info = "备份中...";
		reposFullBackupTaskHashMap.put(taskId, task);
		return task;
	}
	
	/**************** queryReposFullBackupTask ******************/
	@RequestMapping("/queryReposFullBackupTask.do")
	public void queryReposFullBackupTask(String taskId, HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryReposFullBackupTask.do ****************");
		Log.info("queryReposFullBackupTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposFullBackupTask task = reposFullBackupTaskHashMap.get(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("仓库全量备份任务 " + taskId + " 不存在");
			writeJson(rt, response);			
			return;
		}

		switch(task.status)
		{
		case 0:
		case 1:
			//任务未结束
			rt.setData(task); //任务

			//更新task的targetSize
			File compressFile = new File(task.targetPath, task.targetName);
			if(compressFile.exists())
			{
				task.targetSize = compressFile.length();
			}
			
			rt.setMsgData(5);
			break;
		case 2:
			Repos repos = task.repos;
			Doc downloadDoc = buildDownloadDocInfo(repos.getId(), "", "", task.targetPath, task.targetName, 0);
			rt.setData(downloadDoc);
			rt.setMsgData(0);	//下载后不删除目标文件
			
			//删除下载压缩任务
			reposFullBackupTaskHashMap.remove(task.id);
			break;
		case 3:	
			//备份失败
			rt.setError(task.info);
			break;
		default:	//未知压缩状态
			rt.setError("未知备份状态");
			break;
		}

		writeJson(rt, response);			
	}
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path, 
			String realDocPath,
			String remoteServer,
			String remoteStorage,
			Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd,
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1,
			String textSearch,
			String recycleBin,
			Integer encryptType,
			String autoSyncup,
			String autoBackup,
			String lang,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** updateReposInfo.do ***********************");
		Log.debug("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path 
				+ " realDocPath:" + realDocPath 
				+ " remoteServer:" + remoteServer 
				+ " remoteStorage:" + remoteStorage 
				+" verCtrl: " + verCtrl + " isRemote:" + isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd 
				+ " verCtrl1: " + verCtrl1 + " isRemote1:"+ isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1
				+ " textSearch:" + textSearch + " recycleBin:" + recycleBin + " encryptType:" + encryptType + " autoSyncup:" + autoSyncup+ " autoBackup:" + autoBackup);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
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
		newReposInfo.setAutoSyncup(autoSyncup);
		newReposInfo.setAutoBackup(autoBackup);
		newReposInfo.setTextSearch(textSearch);
		newReposInfo.setRecycleBin(recycleBin);

		formatReposInfo(newReposInfo);
		
		//Get reposInfo (It will be used to revert the reposInfo)
		Repos reposInfo = getReposEx(reposId);
		if(!reposCheck(reposInfo, rt, response))
		{
			return;
		}
		
		setReposIsBusy(reposId, true);
		
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
			writeJson(rt, response);	
			setReposIsBusy(reposId, false);
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
		
		//设置全文搜索
		if(textSearch != null)
		{
			setReposTextSearch(reposInfo, textSearch);
			initReposTextSearchConfig(reposInfo, textSearch);
		}
		
		if(recycleBin != null)
		{
			setReposRecycleBin(reposInfo, recycleBin);			
			initReposRecycleBinConfig(reposInfo, recycleBin);
		}
			
		boolean encryptTypeChanged = false;
		if(encryptType != null)
		{			
			if(reposInfo.encryptType == null || encryptType != reposInfo.encryptType)
			{
				setReposEncrypt(reposInfo, encryptType);
				encryptTypeChanged = true;
			}			
		}
		
		if(autoSyncup != null)
		{
			//Save Old autoBackupConfig
			ReposSyncupConfig oldAutoSyncupConfig = reposInfo.autoSyncupConfig;
			
			setReposAutoSyncup(reposInfo, autoSyncup);
			initReposAutoSyncupConfig(reposInfo, autoSyncup);
			if(reposInfo.autoSyncupConfig != null && oldAutoSyncupConfig == null)
			{
				addDelayTaskForReposSyncUp(reposInfo, 10, 600L); //10分钟后自动同步
			}
		}
		
		if(autoBackup != null)
		{
			//Save Old autoBackupConfig
			ReposBackupConfig oldAutoBackupConfig = reposInfo.autoBackupConfig;
			
			setReposAutoBackup(reposInfo, autoBackup);
			initReposAutoBackupConfig(reposInfo, autoBackup);
			if(reposInfo.autoBackupConfig != null)
			{
				addDelayTaskForLocalBackup(reposInfo, reposInfo.autoBackupConfig.localBackupConfig, 10, null, true); //3600L); //1小时后开始自动备份
				addDelayTaskForRemoteBackup(reposInfo, reposInfo.autoBackupConfig.remoteBackupConfig, 10, null, true); //7200L); //2小时后开始自动备份
			}
			
			//Check and clear old backup indexLib
			checkAndClearOldBackupIndexLib(reposInfo, oldAutoBackupConfig, reposInfo.autoBackupConfig);
		}
		
		//Update ReposInfo
		if(reposService.updateRepos(newReposInfo) == 0)
		{
			docSysDebugLog("updateReposInfo() reposService.updateRepos [" + reposInfo.getName() + "] Failed", rt);	//这个其实还不是特别严重，只要重新设置一次即可

			rt.setError("仓库信息更新失败！");
			writeJson(rt, response);
			setReposIsBusy(reposId, false);
			
			addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", reposInfo, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(ChangeReposPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			Log.debug("仓库目录修改失败");
			writeJson(rt, response);	
			setReposIsBusy(reposId, false);
			
			docSysDebugLog("updateReposInfo() ChangeReposPath [" + reposInfo.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", reposInfo, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(ChangeReposRealDocPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			Log.debug("仓库RealDoc目录修改失败");
			writeJson(rt, response);	
			setReposIsBusy(reposId, false);
			
			docSysDebugLog("updateReposInfo() ChangeReposRealDocPath [" + reposInfo.getName() + "] Failed", rt);
			addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", reposInfo, null, null, buildSystemLogDetailContent(rt));			
			return;
		}
		
		//To get updated reposInfo
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);	
			setReposIsBusy(reposId, false);
			
			docSysDebugLog("updateReposInfo() getReposEx [" + reposId + "] Failed", rt);
			addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", reposInfo, null, null, buildSystemLogDetailContent(rt));						
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
				setReposIsBusy(reposId, false);

				docSysDebugLog("updateReposInfo() initVerRepos for real doc [" + repos.getName() + "] Failed", rt);
				addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));						
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
				setReposIsBusy(reposId, false);
				
				docSysDebugLog("updateReposInfo() initVerRepos for virtual doc [" + repos.getName() + "] Failed", rt);
				addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "失败", repos, null, null, buildSystemLogDetailContent(rt));						
				return;
			}
		}
		
		writeJson(rt, response);
		
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
				addDocToSyncUpList(actionList, repos, rootDoc, Action.SYNC_AUTO, login_user, "自动同步：版本仓库类型变更 " + reposInfo.getVerCtrl() + ":" + newReposInfo.getVerCtrl(), true);
				executeUniqueCommonActionList(actionList, rt);
			}
			else
			{
				Log.debug("updateReposInfo() dbDeleteAllDocs failed");
			}

			//启动仓库的定时同步任务
			addDelayTaskForReposSyncUp(repos, 10, 600L); //10分钟后自动同步
		}
		setReposIsBusy(reposId, false);
		
		addSystemLog(request, login_user, "updateReposInfo", "updateReposInfo", "修改仓库", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));		
		
		//发送邮件备份密钥
		if(encryptTypeChanged)
		{
			String encrptConfigPath = Path.getReposEncryptConfigPath(repos);
			String encrptConfigName = Path.getReposEncryptConfigFileName();
			sendEncrptFileWithEmail(rt, login_user.getEmail(), repos, encrptConfigPath + encrptConfigName, lang);
		}
	}

	private void checkAndClearOldBackupIndexLib(Repos reposInfo, ReposBackupConfig oldAutoBackupConfig,
			ReposBackupConfig newAutoBackupConfig) {
		boolean clearLocalBackupIndexLib = false;
		boolean clearRemoteBackupIndexLib = false;
		if(oldAutoBackupConfig == null && newAutoBackupConfig == null)
		{
			clearLocalBackupIndexLib = true;
			clearRemoteBackupIndexLib = true;
		}
		else
		{
			if(isBackupConfigChanged(oldAutoBackupConfig.localBackupConfig, newAutoBackupConfig.localBackupConfig))
			{
				clearLocalBackupIndexLib = true;
				Log.debug("checkAndClearOldBackupIndexLib() localBackupConfig changed:");
				Log.printObject("checkAndClearOldBackupIndexLib() oldLocalBackupConfig:", oldAutoBackupConfig.localBackupConfig);				
				Log.printObject("checkAndClearOldBackupIndexLib() newLocalBackupConfig:", newAutoBackupConfig.localBackupConfig);				
			}
			
			if(isBackupConfigChanged(oldAutoBackupConfig.remoteBackupConfig, newAutoBackupConfig.remoteBackupConfig))
			{
				clearRemoteBackupIndexLib = true;
				Log.debug("checkAndClearOldBackupIndexLib() remoteBackupConfig changed:");
				Log.printObject("checkAndClearOldBackupIndexLib() oldRemoteBackupConfig:", oldAutoBackupConfig.remoteBackupConfig);				
				Log.printObject("checkAndClearOldBackupIndexLib() newRemoteBackupConfig:", newAutoBackupConfig.remoteBackupConfig);				
			}
		}
		
		if(clearLocalBackupIndexLib)
		{
			if(oldAutoBackupConfig != null && oldAutoBackupConfig.localBackupConfig != null && oldAutoBackupConfig.localBackupConfig.indexLibBase != null && oldAutoBackupConfig.localBackupConfig.indexLibBase.isEmpty() == false)
			{
				FileUtil.delFileOrDir(oldAutoBackupConfig.localBackupConfig.indexLibBase);
			}
		}
		
		if(clearRemoteBackupIndexLib)
		{
			if(oldAutoBackupConfig != null && oldAutoBackupConfig.remoteBackupConfig != null && oldAutoBackupConfig.remoteBackupConfig.indexLibBase != null && oldAutoBackupConfig.remoteBackupConfig.indexLibBase.isEmpty() == false)
			{
				FileUtil.delFileOrDir(oldAutoBackupConfig.remoteBackupConfig.indexLibBase);
			}
		}
	}

	private boolean isBackupConfigChanged(BackupConfig oldBackupConfig, BackupConfig newBackupConfig) {
		//TODO: 这个Null判断的逻辑不够严谨，所以只是用于进行是否清空indexLib
		if(oldBackupConfig == null || newBackupConfig == null)
		{
			return true;
		}
		
		if(oldBackupConfig.remoteStorageConfig == null || newBackupConfig.remoteStorageConfig == null)
		{
			return true;
		}
		
		if(oldBackupConfig.remoteStorageConfig.protocol.equals(newBackupConfig.remoteStorageConfig.protocol) == false)
		{
			Log.debug("isBackupConfigChanged() protocol changed: [" + oldBackupConfig.remoteStorageConfig.protocol + "] [" + newBackupConfig.remoteStorageConfig.protocol + "]");
			return true;
		}
		
		if(oldBackupConfig.remoteStorageConfig.rootPath.equals(newBackupConfig.remoteStorageConfig.rootPath) == false)
		{
			Log.debug("isBackupConfigChanged() rootPath changed: [" + oldBackupConfig.remoteStorageConfig.rootPath + "] [" + newBackupConfig.remoteStorageConfig.rootPath + "]");
			return true;
		}
		
		switch(oldBackupConfig.remoteStorageConfig.protocol)
		{
		case "file":
			return !oldBackupConfig.remoteStorageConfig.FILE.localRootPath.equals(newBackupConfig.remoteStorageConfig.FILE.localRootPath);
		case "sftp":
			return (!oldBackupConfig.remoteStorageConfig.SFTP.host.equals(newBackupConfig.remoteStorageConfig.SFTP.host) ||
					!oldBackupConfig.remoteStorageConfig.SFTP.port.equals(newBackupConfig.remoteStorageConfig.SFTP.port));
		case "ftp":
			return (!oldBackupConfig.remoteStorageConfig.FTP.host.equals(newBackupConfig.remoteStorageConfig.FTP.host) ||
					!oldBackupConfig.remoteStorageConfig.FTP.port.equals(newBackupConfig.remoteStorageConfig.FTP.port));
		case "smb":
			return (!oldBackupConfig.remoteStorageConfig.SMB.host.equals(newBackupConfig.remoteStorageConfig.SMB.host) ||
					!oldBackupConfig.remoteStorageConfig.SMB.port.equals(newBackupConfig.remoteStorageConfig.SMB.port));
		case "mxsdoc":
			return !oldBackupConfig.remoteStorageConfig.MXSDOC.url.equals(newBackupConfig.remoteStorageConfig.MXSDOC.url);
		case "svn":
			return !oldBackupConfig.remoteStorageConfig.SVN.url.equals(newBackupConfig.remoteStorageConfig.SVN.url);
		case "git":
			return (!oldBackupConfig.remoteStorageConfig.GIT.url.equals(newBackupConfig.remoteStorageConfig.GIT.url) || 
					!oldBackupConfig.remoteStorageConfig.GIT.localVerReposPath.equals(newBackupConfig.remoteStorageConfig.GIT.localVerReposPath));
		default:
			Log.debug("isBackupConfigChanged() unknown remoteStorage protocol:" + oldBackupConfig.remoteStorageConfig.protocol);
			break;
		}
		
		return false;
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
	
	
	/****************   remoteStorageTest ******************/
	@RequestMapping("/remoteStorageTest.do")
	public void remoteStorageTest(String config, String type, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** remoteStorageTest.do ***********************");
		Log.debug("remoteStorageTest config:" + config + " type:" + type);

		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是系统管理员
		if(login_user.getType() != 2)	//超级管理员
		{
			rt.setError("您无权进行该操作!");				
			writeJson(rt, response);	
			return;
		}
		
		String testResult = "1. 配置解析<br/>";
		RemoteStorageConfig remote = null;
		if(config == null || config.isEmpty())
		{
			testResult += "配置内容为空<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		
		Long curTime = new Date().getTime();
		String localTestPath = Path.getDefaultReposRootPath(OSType) + "tmp/RemoteStorageTest-" + curTime + "/" + type + "/";
		String localVerReposPathForGit = localTestPath + "LocalGitRepos/";
		if(isJsonFormat(config))
		{
			remote = parseRemoteStorageConfigJson(config, localVerReposPathForGit);			
		}
		else
		{
			remote = parseRemoteStorageConfig(config, localVerReposPathForGit);
		}
		
		if(remote == null)
		{
			testResult += "解析失败:<br/>";
			testResult += config + "<br/>";
			
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}
		testResult += "解析成功:<br/>" ;
		testResult += JSON.toJSONString(remote).replace(",", "<br/>") + "<br/><br/>";
				
		//fake repos
		Repos fakeRepos = new Repos();
		fakeRepos.setId(1000000);
		String localRootPath = localTestPath + "Repos/rdata"; 
		String localVRootPath = localTestPath + "Repos/vdata";
		Doc rootDoc = buildRootDoc(fakeRepos, localRootPath, localVRootPath);
		
		testResult += "2. 登录远程服务器<br/>";
		RemoteStorageSession remoteStorageSession = channel.doRemoteStorageLoginEx(fakeRepos, remote);
        if(remoteStorageSession == null)
        {
			testResult += "第 1 次登录失败<br/>";
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		remoteStorageSession = channel.doRemoteStorageLoginEx(fakeRepos, remote);
        		if(remoteStorageSession != null)
        		{
        			break;
        		}
        		testResult += "第 " + (i+2) + " 次登录失败<br/>";       	
        	}
        }
        
    	if(remoteStorageSession == null)
    	{
    		testResult += "登录远程服务器失败<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
    	}
		testResult += "登录远程服务器成功<br/><br/>";
    	
		testResult += "3. 获取远程服务器文件列表<br/>";
		List<Doc> list = channel.getRemoteStorageEntryListEx(remoteStorageSession, remote, fakeRepos, rootDoc, null);
		channel.doRemoteStorageLogoutEx(remoteStorageSession);

		if(list == null)
		{
			testResult += "文件列表获取失败<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;	    	
		}
    	
		testResult += "文件列表获取成功<br/>";
		for(int i=0; i<list.size(); i++)
		{
			Doc entry = list.get(i);
			testResult += "[" + entry.getPath() + entry.getName() + "]<br/>";
			if(i > 6)
			{
				testResult += "...<br/>"; 
				break;
			}
		}
				
		//清除测试目录
		FileUtil.delFileOrDir(localTestPath);
		
		rt.setData(list);
		rt.setMsgInfo(testResult);
		writeJson(rt, response);		
	}
	
	/****************   clear Repository File Cache ******************/
	@RequestMapping("/clearReposCache.do")
	public void clearReposCache(Integer reposId, String path,String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clearReposCache.do ***********************");
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
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(clearReposFileCache(repos, rt) == false)
		{
			docSysErrorLog("仓库 [" + repos.getName() +"] 缓存清除失败！", rt);
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
		Log.infoHead("****************** clearAllReposCache.do ***********************");

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

	private boolean clearReposFileCache(Repos repos, ReturnAjax rt) {
		String reposTmpPath = Path.getReposTmpPath(repos);
		return FileUtil.clearDir(reposTmpPath);
	}

	/****************   get Repository Menu so that we can touch the docId******************/
	@RequestMapping("/getReposInitMenu.do")
	public void getReposInitMenu(Integer reposId,Long docId, Long pid, String path, String name, Integer level, Integer type,
			Integer listType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getReposInitMenu.do ***********************");
		Log.debug("getReposInitMenu reposId: " + reposId + " docId: " + docId  + " pid:" + pid + " path:" + path + " name:"+ name + " level:" + level + " type:" + type 
				+ " listType:" + listType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
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
			if(checkUserAccessPwd(repos, rootDoc, session, rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		
		//getReposInitMenu是获取仓库或分享根目录下的文件列表（分享的不是仓库的根目录，那么总是返回分享的文件或目录）
		List <Doc> docList = new ArrayList<Doc>();
		if(rootDoc.getDocId() != 0) //不是仓库根目录
		{
			Doc tmpDoc = docSysGetDoc(repos, rootDoc, false);
			if(tmpDoc == null || tmpDoc.getType() == null || tmpDoc.getType() == 0)
			{
				docSysErrorLog("[" + rootDoc.getPath() + rootDoc.getName() + "] 不存在！",rt);
				writeJson(rt, response);			
				return;
			}
			
			rootDoc = tmpDoc;
			docList.add(rootDoc);
			
			//如果rootDoc是文件则不需要获取子目录文件
			if(rootDoc.getType() == 1)
			{
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
				if(checkUserAccessPwd(repos, doc, session, rt) == false)
				{
					writeJson(rt, response);	
					return;
				}
			}
		}
		
		List <Doc> subDocList = null;
		if(doc == null)
		{
			subDocList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, listType, rt);
		}
		else
		{
			//获取用户可访问文件列表(From Root to Doc)
			subDocList = getDocListFromRootToDoc(repos, doc, rootDocAuth, rootDoc, docAuthHashMap, listType, rt);
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
			Integer listType,
			String sort,
			Integer needLockState,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSubDocList.do ***********************");
		Log.debug("getSubDocList reposId: " + vid + " docId: " + docId  + " pid:" + pid + " path:" + path + " name:"+ name + " level:" + level + " type:" + type 
				+ " shareId:" + shareId + " listType:" + listType + " sort:" + sort + " needLockState:" +  needLockState);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, vid, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = getReposEx(vid);
		if(!reposCheck(repos, rt, response))
		{
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
					docSysErrorLog("[" + rootDoc.getPath() + rootDoc.getName() + "] 不存在！",rt);
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
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
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
		
		docList = getAccessableSubDocList(repos, doc, docAuth, docAuthHashMap, listType, rt);

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
		
		//Add doc for AutoSync: 目前已经有自动同步和手动刷新机制，不再需要每次访问时进行同步
		//addDocForAutoSync(repos, doc, rt);
	}
	
	void addDocForAutoSync(Repos repos, Doc doc, ReturnAjax rt)
	{
		List<CommonAction> actionList = new ArrayList<CommonAction>();	//For AsyncActions
		addDocToSyncUpList(actionList, repos, doc, Action.UNDEFINED, null, null, true);
		if(insertActionListToUniqueActionList(actionList, rt) == true)
		{
			ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);		
			executor.schedule(
	        		new Runnable() {
	        			int reposId = repos.getId();
	                    @Override
	                    public void run() {
	                        try {
		                        Log.debug("getSubDocList() syncupDelayTask for repos:" + reposId);
		                        executeUniqueActionList(reposId, rt);                        	
	                        	Log.debug("getSubDocList() syncupDelayTask for repos:" + reposId + " 执行结束\n");		                        
	                        } catch(Exception e) {
	                        	Log.info("getSubDocList() syncupDelayTask for repos:" + reposId + " 执行异常\n");
	                        	Log.info(e);
	                        }                        
	                    }
	                },
	                120,	//2分钟后执行
	                TimeUnit.SECONDS);
		}
	}
	
	/* 
	 * 
	 该接口用于远程存储
	 *   
	 */
	@RequestMapping("/getSubDocListRS.do")
	public void getSubDocListEx(Integer reposId, String remoteDirectory, String path,
			Integer listType,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSubDocListRS.do ***********************");
		Log.debug("getSubDocListRS reposId: " + reposId + " remoteDirectory:" + remoteDirectory + " path:" + path + " listType:" + listType + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null, rt) == null)
		{
			//docSysErrorLog("无效授权码或授权码已过期！", rt);
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
		if(!reposCheck(repos, rt, response))
		{
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
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
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
		
		docList = getAuthedSubDocList(repos, doc, docAuth, docAuthHashMap, listType, rt);
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
			Integer listType,
			HttpSession session,HttpServletRequest request,HttpServletResponse response){		
		Log.infoHead("****************** getReposManagerMenu.do ***********************");
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
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
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
			docList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, listType, rt);
		}
		else
		{
			Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
			
			//获取用户可访问文件列表(From Root to Doc)
			docList = getDocListFromRootToDoc(repos, doc, rootDocAuth, null, docAuthHashMap, listType, rt);
		}
		
		//清除errorStaus, 管理后台这里不要让前台报错, 避免因为无法获取远程的列表导致无法进行仓库配置修改
		rt.setStatus("ok");
		
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
		Log.infoHead("****************** getReposAllUsers.do ***********************");
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
		Log.infoHead("****************** getReposAllGroups.do ***********************");
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
		Log.infoHead("****************** getDocAuthList.do ***********************");
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
		Log.infoHead("****************** configReposAuth.do ***********************");
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

		Repos repos = getReposEx(reposId);
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
		
		addSystemLog(request, login_user, "configReposAuth", "configReposAuth", "设置仓库权限", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
	}
	
	/****************   delete User or Group or anyUser ReposAuth ******************/
	@RequestMapping("/deleteReposAuth.do")
	public void deleteUserReposAuth(Integer reposAuthId,Integer userId, Integer groupId, Integer reposId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** deleteReposAuth.do ***********************");
		Log.debug("deleteUserReposAuth reposAuthId:"  + reposAuthId + " userId: " + userId  + " groupId: " + groupId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = getReposEx(reposId);
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
		
		addSystemLog(request, login_user, "deleteReposAuth", "deleteReposAuth", "删除仓库权限", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
	}		
	
	/****************  Config User or Group or anyUser DocAuth ******************/
	@RequestMapping("/configDocAuth.do")
	public void configUserAuth( Integer reposId, Integer userId, Integer groupId, Long docId, Long pid, String path, String name, Integer level, Integer type,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,Integer downloadEn, Long uploadSize, Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** configDocAuth.do ***********************");
		Log.debug("configDocAuth reposId:" + reposId + " userId: " + userId +" groupId: " + groupId+ " docId:" + docId + " path:" + path + " name:" + name + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:" + downloadEn + " uploadSize:" + uploadSize + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

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
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查当前用户的权限
		if(isAdminOfDoc(repos, login_user, doc) == false)
		{
			Log.debug("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//login_user不得设置超过自己的权限：超过了则无效
		if(uploadSize == null)
		{
			uploadSize = Long.MAX_VALUE;
		}
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
		
		//如果不是根目录，则需要先检查是否拥有上一级目录的访问权限
		if(name != null && name.isEmpty() == false)
		{
			Doc parentDoc = buildBasicDoc(reposId, null, null, reposPath, path, "", null, type, true,localRootPath,localVRootPath, 0L, "");
			DocAuth parentDocAuth = getRealDocAuth(repos, userId, groupId, parentDoc);
			if(parentDocAuth == null || parentDocAuth.getAccess() == null || parentDocAuth.getAccess() == 0)
			{
				Log.debug("configDocAuth check parent docauth failed, parentDoc path:" + path);
				rt.setError("未设置上级目录的访问权限");
				writeJson(rt, response);
				return;
			}
		}
		
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
		
		addSystemLog(request, login_user, "configDocAuth", "configDocAuth", "设置文件权限", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));

	}

	/****************   delete User or Group or anyUser  DocAuth ******************/
	@RequestMapping("/deleteDocAuth.do")
	public void deleteUserDocAuth(Integer reposId, Integer docAuthId,Integer userId, Integer groupId, Long docId, Long pid, String path, String name, Integer level, Integer type,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** deleteDocAuth.do ***********************");		
		Log.debug("deleteUserReposAuth docAuthId:"  + docAuthId + " userId: " + userId  + " groupId: " + groupId  + " docId: " + docId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = getLoginUser(session, request, response, rt);
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
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
		
		addSystemLog(request, login_user, "deleteDocAuth", "deleteDocAuth", "删除文件权限", null, "成功", repos, null, null, buildSystemLogDetailContent(rt));
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
		if(isUploadSizeExceeded(uploadSize, docAuth.getUploadSize()))
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
		Log.info("****************** getUserDocAuth.do ***********************");		
		Log.debug("getUserDocAuth "  + " docId: " + docId  + " reposId:" + reposId + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
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
