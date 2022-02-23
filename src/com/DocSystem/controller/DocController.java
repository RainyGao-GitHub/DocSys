package com.DocSystem.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.compress.archivers.sevenz.SevenZArchiveEntry;
import org.apache.commons.compress.archivers.sevenz.SevenZFile;
import org.apache.commons.compress.archivers.sevenz.SevenZOutputFile;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.apache.tools.tar.TarEntry;
import org.apache.tools.tar.TarInputStream;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.tukaani.xz.XZInputStream;

import util.ReturnAjax;
import util.FileUtil.FileUtils2;
import util.LuceneUtil.LuceneUtil2;

import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.github.junrar.Archive;
import com.github.junrar.rarfile.FileHeader;
import com.jcraft.jzlib.GZIPInputStream;

import net.sf.sevenzipjbinding.IInArchive;
import net.sf.sevenzipjbinding.SevenZip;
import net.sf.sevenzipjbinding.SevenZipException;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;
import net.sf.sevenzipjbinding.simple.ISimpleInArchive;
import net.sf.sevenzipjbinding.simple.ISimpleInArchiveItem;

import com.DocSystem.common.Base64Util;
import com.DocSystem.common.DocChange;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.IPUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.OfficeExtract;
import com.DocSystem.common.Path;
import com.DocSystem.common.SyncLock;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.channels.Channel;
import com.DocSystem.common.channels.ChannelFactory;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.DocPullResult;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.controller.BaseController;
import com.DocSystem.commonService.ProxyThread;

/*
Something you need to know
1、文件节点
（1）文件节点可以是文件或目录，包括本地文件或目录、版本仓库节点、数据库记录、虚拟文件和版本仓库节点
（2）虚拟文件：虚拟文件的实体跟实文件不同，并不是一个单一的文件，而是以文件节点ID为名称的目录，里面包括content.md文件和res目录，markdown文件记录了虚文件的文字内容，res目录下存放相关的资源文件
2、文件节点底层操作接口
（1）操作类型：add、delete、update、move、rename
（2）文件节点操作必须是原子操作，实现上使用了线程锁和数据库的状态来实现，保证对本地文件、版本仓库节点和数据库操作是一个原子操作
（3）文件节点信息的更新优先次序依次为 本地文件、版本仓库文件、数据库记录
	版本仓库文件如果更新失败，则本地文件需要回退，以保证本地文件与版本仓库最新版本的文件一致
	数据库记录更新失败时，本地文件和版本仓库文件不会进行回退操作，这里面有些风险但还可以接受
（4）add、update 只影响单个节点
（5）delete、copy 会影响子节点且存在递归调用，因此使用isSubDelete和isSubCopy来区分是否是子节点操作，子节点不需要锁定
（6）move、rename 虽然会影响子节点的实体文件，但只要当前节点的信息正确了（节点名字和父节点Pid），子节点的信息就能够正确，因此子节点的信息不需要更新
3、文件节点的锁定
（1）文件节点底层操作接口需要调用LockDoc接口来锁定该文件节点，以避免该接口在操作过程中不被影响
（2）锁定状态：
		//0：未锁定
		//1：RealDoc 编辑锁定，锁过期时间2天，自己可解锁
		//2：绝对锁定，自己无法解锁，锁过期时间2天
		//3：VirtualDoc 编辑锁定，锁过期时间2天，自己可解锁
		//4：RealDoc 协同编辑锁定，锁过期时间2天，不可解锁
		//5：VirtualDoc 协同编辑锁定，锁过期时间2天，不可解锁
（3）LockDoc(docId,subDocCheckFlag)的实现
	subDocCheckFlag是true的时候表示需要检查docId节点的子目录下是否有锁定文件，由于delete\move\rename会影响subDocs,copy对subDocs有依赖，这四个接口需要将标志设置为true
4、路径定义规则
（1） 仓库路径
 reposPath: 仓库根路径，以"/"结尾
 reposRPath: 仓库实文件存储根路径,reposPath + "data/rdata/"
 reposVPath: 仓库虚文件存储根路径,reposPath + "data/vdata/"
 reposRefRPath: 仓库实文件存储根路径,reposPath + "refData/rdata/"
 reposRefVPath: 仓库虚文件存储根路径,reposPath + "refData/vdata/"
 reposUserTempPath: 仓库虚文件存储根路径,reposPath + "tmp/userId/" 
（2） 版本仓库路径：
 verReposPath: 本地版本仓库存储目录，以"/"结尾
 */
@Controller
@RequestMapping("/Doc")
public class DocController extends BaseController{
	/*******************************  Ajax Interfaces For Document Controller ************************/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** addDoc ****************");
		Log.debug("addDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content+ " shareId:" + shareId);
		Log.debug("addDoc default charset:" + Charset.defaultCharset());
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath,localVRootPath, 0L, "");
		doc.setContent(content);
				
		if(checkUserAddRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc tmpDoc = docSysGetDoc(repos, doc, false);
		if(tmpDoc != null && tmpDoc.getType() != 0)
		{
			Log.docSysErrorLog(doc.getName() + " 已存在", rt);
			rt.setMsgData(1);
			rt.setData(tmpDoc);
			writeJson(rt, response);
			return;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "新增 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, doc, null, null,null,null, commitMsg,commitUser,reposAccess.getAccessUser(),rt, actionList); 
		
		if(ret == true && isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "addDoc");
			realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "addDoc");
		}
		
		writeJson(rt, response);
		
		if(ret == false)
		{
			Log.debug("add() add Doc Failed");
			addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "新增文件", "失败", repos, doc, null, "");
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "新增文件", "成功",  repos, doc, null, "");
		executeCommonActionList(actionList, rt);
	}
	
	private void realTimeRemoteStoragePush(Repos repos, Doc doc, Doc dstDoc, ReposAccess reposAccess, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("\n********* realTimeRemoteStoragPush() ***********");
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null || remote.autoPush == null || remote.autoPush != 1)
		{
			Log.debug("realTimeRemoteStoragPush() remoteStorageConfig autoPush not configured");			
			return;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeRemoteStoragPush 非商业版本不支持远程存储");
			return;
	    }
		
		//push Options
		boolean recurcive = true;
		boolean force = remote.autoPushForce == 1;
		boolean isAutoPush = false;
		boolean pushLocalChangeOnly = false;
		
		switch(action)
		{
		case "copyDoc":
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		case "moveDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		case "renameDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		default:
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		}			
	}

	private void realTimeBackup(Repos repos, Doc doc, Doc dstDoc, ReposAccess reposAccess, String commitMsg, ReturnAjax rt, String action) 
	{
		Log.debug("\n************ realTimeBackup() **************");
		ReposBackupConfig backupConfig = repos.backupConfig;
		if(backupConfig == null)
		{
			Log.debug("realTimeBackup() backupConfig not configured");			
			return;
		}
				
		realTimeLocalBackup(repos, doc, dstDoc, reposAccess, commitMsg, rt, action);
		realTimeRemoteBackup(repos, doc, dstDoc, reposAccess, commitMsg, rt, action);
	}

	private void realTimeRemoteBackup(Repos repos, Doc doc, Doc dstDoc, ReposAccess reposAccess, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("\n************* realTimeRemoteBackup() ***************");

		BackupConfig remoteBackupConfig = repos.backupConfig.remoteBackupConfig;
		if(remoteBackupConfig == null || remoteBackupConfig.realTimeBackup == null || remoteBackupConfig.realTimeBackup == 0)
		{
			Log.debug("realTimeRemoteBackup() remoteBackupConfig realTimeBackup not configured");			
			return;
		}
		
		RemoteStorageConfig remote = remoteBackupConfig.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("realTimeRemoteBackup() remoteStorageConfig not configured");			
			return;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeRemoteBackup 非商业版本不支持远程备份");
			return;
	    }
		
		//实时备份是不备份备注文件的
		remote.remoteStorageIndexLib = getRealTimeBackupIndexLibForRealDoc(remoteBackupConfig, remote);		
		String offsetPath = getRealTimeBackupOffsetPathForRealDoc(repos, remote, new Date());
		doc.offsetPath = offsetPath;
		if(dstDoc != null)
		{
			dstDoc.offsetPath = offsetPath;
		}
		Log.debug("realTimeRemoteBackup() offsetPath [" + offsetPath + "]");			
		
		//push Options
		boolean recurcive = true;
		boolean force = true;
		boolean isAutoPush = false;
		boolean pushLocalChangeOnly = true;
		if(remote.isVerRepos)
		{
			pushLocalChangeOnly = false;
		}

		
		switch(action)
		{
		case "copyDoc":
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		case "moveDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly,  rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly,  rt);
			break;
		case "renameDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly,  rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly,  rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		//	channel.remoteStoragePush(repos, doc, reposAccess.getAccessUser(), commitMsg, true, true, true, rt);
		//	break;
		default:
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		}		
	}

	private void realTimeLocalBackup(Repos repos, Doc doc, Doc dstDoc, ReposAccess reposAccess, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("\n********** realTimeLocalBackup() ****************");

		BackupConfig localBackupConfig = repos.backupConfig.localBackupConfig;
		if(localBackupConfig == null || localBackupConfig.realTimeBackup == null || localBackupConfig.realTimeBackup == 0)
		{
			Log.debug("realTimeLocalBackup() localBackupConfig realTimeBackup not configured");			
			return;
		}
		
		RemoteStorageConfig remote = localBackupConfig.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("realTimeLocalBackup() remoteStorageConfig not configured");			
			return;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeLocalBackup 非商业版本不支持本地备份");
			return;
	    }
		
		remote.remoteStorageIndexLib = getRealTimeBackupIndexLibForRealDoc(localBackupConfig, remote);		
		//set offsetPath 
		String offsetPath = getRealTimeBackupOffsetPathForRealDoc(repos, remote, new Date());		
		doc.offsetPath = offsetPath;		
		if(dstDoc != null)
		{
			dstDoc.offsetPath = offsetPath;
		}
		Log.debug("realTimeLocalBackup() offsetPath [" + offsetPath + "]");			
			
		//push options
		boolean recurcive = true;
		boolean force = true;
		boolean isAutoPush = false;
		boolean pushLocalChangeOnly = true;
		if(remote.isVerRepos)
		{
			pushLocalChangeOnly = false;
		}
		
		switch(action)
		{
		case "copyDoc":
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		case "moveDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		case "renameDoc":
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			channel.remoteStoragePush(remote, repos, dstDoc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		default:
			channel.remoteStoragePush(remote, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, force, isAutoPush, pushLocalChangeOnly, rt);
			break;
		}			
	}

	@RequestMapping("/addDocRS.do")  //文件名、文件类型、所在仓库、父节点
	public void addDocRS(Integer reposId, String remoteDirectory, String path, String name,  Integer type,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** addDocRS ****************");
		Log.debug("addDocRS reposId:" + reposId + " remoteDirectory:[" + remoteDirectory + "] path:[" + path + "] name:" + name  + " type:" + type + " content:" + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null) == false)
		{
			Log.debug("addDocRS checkAuthCode return false");
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//add Doc on Server Directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				Log.debug("addDocRS remoteDirectory is null");
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				return;				
			}
			
			if(type == null)
			{
				Log.debug("addDocRS type is null");
				rt.setError("文件类型不能为空！");
				writeJson(rt, response);			
				return;			
			}
			
			if(type == 2) //目录
			{
				if(false == FileUtil.createDir(remoteDirectory + path + name))
				{
					Log.debug("addDocRS() 目录 " +remoteDirectory + path + name + " 创建失败！");
					rt.setError("新增目录失败");
				}				
			}
			else
			{
				if(false == FileUtil.createFile(remoteDirectory + path, name))
				{
					Log.debug("addDocRS() 文件 " + remoteDirectory + path + name + "创建失败！");
					rt.setError("新建文件失败");
				}
			}
			writeJson(rt, response);	
			return;			
		}
		
		//Add Doc On Repos
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.debug("addDocRS 仓库 " + reposId + " 不存在！");
			rt.setError("仓库不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, type, true,localRootPath,localVRootPath, 0L, "");

		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		if(checkUserAddRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc tmpDoc = docSysGetDoc(repos, doc, false);
		if(tmpDoc != null && tmpDoc.getType() != 0)
		{
			Log.debug("addDocRS 文件:" + doc.getPath() + doc.getName() + " 已存在");
			rt.setError("文件已存在");
			rt.setMsgData(1);
			rt.setData(tmpDoc);
			writeJson(rt, response);
			return;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "新增 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, doc, null, null, null, null, commitMsg, commitUser, reposAccess.getAccessUser(),rt, actionList); 
				
		writeJson(rt, response);
		
		if(ret == false)
		{
			Log.debug("addDocRS addDoc Failed");
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", repos, doc, null, "");
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "成功",  repos, doc, null, "");
		executeCommonActionList(actionList, rt);
	}

	/****************   Feeback  ******************/
	@RequestMapping("/feeback.do")
	public void feeback(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** feeback ****************");
		Log.debug("feeback reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content);
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
		Log.docSysErrorLog("请在码云上提交意见与建议：<br>https://gitee.com/RainyGao/DocSys/issues", rt);
		writeJson(rt, response);	
		return;
		
		/*
		if(name == null)
		{
			Log.docSysErrorLog("意见不能为空！", rt);
			writeJson(rt, response);	
			return;
		}
		
		if(reposId == null)
		{
			reposId = getReposIdForFeeback();		
		}
		if(path == null)
		{
			path = "";
		}
		if(type == null)
		{
			type = 1;
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);		
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, level, type, true, localRootPath, localVRootPath, 0L, "");
		doc.setContent(content);
		
		String commitMsg = "用户反馈 " + path + name;
		String commitUser = "游客";
		User login_user = (User) session.getAttribute("login_user");
		if(login_user != null)
		{
			commitUser = login_user.getName();
		}
		else
		{
			login_user = new User();
			login_user.setId(0);
		}
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, doc, null, null,null,null,commitMsg,commitUser,login_user,rt, actionList);
		writeJson(rt, response);
		
		if(ret == false)
		{
			Log.debug("feeback() addDoc failed");
			return;
		}
		
		executeCommonActionList(actionList, rt);
		*/
	}

	/****************   refresh a Document ******************/
	@RequestMapping("/refreshDoc.do")
	public void refreshDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg, Integer force,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** refreshDoc ****************");
		Log.debug("refreshDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " force:" + force+ " shareId:" + shareId);
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);

		if(commitMsg == null)
		{
			commitMsg = "同步 " + doc.getPath() + doc.getName();
		}
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		if(false == checkDocLocked(doc, DocLock.LOCK_TYPE_FORCE, reposAccess.getAccessUser(), false))
		{
			if(force != null && force == 1)
			{
				addDocToSyncUpList(actionList, repos, doc, Action.FORCESYNC, reposAccess.getAccessUser(), commitMsg, true);
			}
			else
			{
				addDocToSyncUpList(actionList, repos, doc, Action.SYNC, reposAccess.getAccessUser(), commitMsg, true);
			}
		}
		
		writeJson(rt, response);
		
		new Thread(new Runnable() {
			public void run() {
				Log.debug("refreshDoc() executeUniqueCommonActionList in new thread");
				executeUniqueCommonActionList(actionList, rt);
			}
		}).start();
	}
	
	/****************   delete a Document ******************/
	@RequestMapping("/deleteDoc.do")
	public void deleteDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** deleteDoc ****************");
		Log.debug("deleteDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		if(commitMsg == null)
		{
			commitMsg = "删除 " + doc.getPath() + doc.getName();
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		String ret = deleteDoc(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		
		if(ret != null && isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "deleteDoc");
			realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "deleteDoc");
		}
		
		writeJson(rt, response);
		
		if(ret != null)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDoc", "deleteDoc", "删除文件", "成功",  repos, doc, null, "");
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "deleteDoc", "deleteDoc", "删除文件","失败", repos, doc, null, "");
	}
	
	
	@RequestMapping("/deleteDocRS.do")
	public void deleteDocRS(Integer reposId, String remoteDirectory, String path, String name,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** deleteDocRS ****************");
		Log.debug("deleteDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		
		if(checkAuthCode(authCode, null) == false)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//delete file from server directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				Log.debug("deleteDocRS remoteDirectory is null");
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				return;				
			}
			
			if(FileUtil.delFileOrDir(remoteDirectory + path + name) == false)
			{
				Log.debug("deleteDocRS() " + remoteDirectory + path + name + "删除失败！");
				rt.setError("删除失败");
			}
			writeJson(rt, response);			
			return;			
		}
		
		//delete file from repos
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		if(commitMsg == null)
		{
			commitMsg = "删除 " + doc.getPath() + doc.getName();
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		String ret = deleteDoc(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		
		writeJson(rt, response);
		
		if(ret != null)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件", "成功",  repos, doc, null, "");
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件","失败", repos, doc, null, "");
	}

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String dstName, 
							String commitMsg, 
							Integer shareId,
							HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** renameDoc ****************");
		Log.debug("renameDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type +  " dstName:" + dstName+ " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		if(name == null || "".equals(name))
		{
			Log.docSysErrorLog("文件名不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			Log.docSysErrorLog("目标文件名不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
	
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc parentDoc = buildBasicDoc(reposId, pid, null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "重命名 " + path + name + " 为 " + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		Doc srcDoc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, pid, reposPath, path, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		boolean ret = renameDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		if(ret == true && isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "renameDoc");
			realTimeBackup(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "renameDoc");
		}
		
		writeJson(rt, response);
		
		if(ret)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件", "成功", repos, srcDoc, dstDoc, "");		
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件","失败",  repos, srcDoc, dstDoc, "");			
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type, 
			String commitMsg, 
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** moveDoc ****************");
		Log.debug("moveDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);

		if(srcPath == null)
		{
			srcPath = "";
		}
		if(dstPath == null)
		{
			dstPath = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, srcPath, srcName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc srcParentDoc = buildBasicDoc(reposId, srcPid, null, reposPath, srcPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), srcParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "移动 " + srcPath + srcName + " 至 " + dstPath + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, reposPath, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		
		boolean ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);

		if(ret == true && isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "moveDoc");
			realTimeBackup(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "moveDoc");
		}
		
		writeJson(rt, response);
		
		if(ret)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "成功", repos, srcDoc, dstDoc, "");	
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "失败", repos, srcDoc, dstDoc, "");	
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** copyDoc ****************");
		Log.debug("copyDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		Log.debug("copyDoc check reposAccess");
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, srcPath, srcName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Log.debug("copyDoc getReposEx");
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
				
		//检查用户是否有目标目录权限新增文件
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Log.debug("copyDoc checkUserAddRight");
		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "复制 " + srcPath + srcName + " 到 " + dstPath + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDocTmp = buildBasicDoc(reposId, docId, srcPid, reposPath, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDoc = docSysGetDoc(repos, srcDocTmp, false);
		if(srcDoc == null || srcDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		Log.debug("copyDoc do copyDoc");
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		if(ret == true || isFSM(repos))
		{
			Log.debug("copyDoc realTimeRemoteStoragePush");			
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "copyDoc");
			Log.debug("copyDoc realTimeBackup");			
			realTimeBackup(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "copyDoc");
		}
		
		writeJson(rt, response);
		
		if(ret)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制文件", "成功",  repos, srcDoc, dstDoc, "");
			Log.debug("copyDoc executeCommonActionList");			
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制文件","失败",  repos, srcDoc, dstDoc, "");
	}
	
	/****************   copy/move/rename a Document ******************/
	@RequestMapping("/copyDocRS.do")
	public void copyDocRS(Integer reposId, String remoteDirectory, String srcPath, String srcName, String dstPath, String dstName, Integer isMove,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** copyDocRS ****************");
		Log.debug("copyDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " srcPath:" + srcPath + " srcName:" + srcName + " srcPath:" + dstPath + " srcName:" + dstName + " isMove:" + isMove + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		if(checkAuthCode(authCode, null) == false)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		boolean move = false;
		if(isMove != null && isMove == 1)
		{
			move = true;
		}			
	
		//move file
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				Log.debug("copyDocRS remoteDirectory is null");
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				return;				
			}
			
			if(move)
			{
				if(FileUtil.moveFileOrDir(remoteDirectory + srcPath, srcName, remoteDirectory + dstPath, dstName, false) == false)
				{
					Log.debug("copyDocRS() move " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "失败！");
					rt.setError("移动失败");
				}				
			}
			else
			{
				if(FileUtil.copyFileOrDir(remoteDirectory + srcPath + srcName, remoteDirectory + dstPath + dstName, false) == false)
				{
					Log.debug("copyDocRS() copy " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "失败！");
					rt.setError("复制失败");
				}
			}
			writeJson(rt, response);			
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有目标目录权限新增文件
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc dstParentDoc = buildBasicDoc(reposId, null, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null)
		{
			if(move)
			{
				commitMsg = "移动 " + srcPath + srcName + " 到 " + dstPath + dstName;				
			}
			else
			{
				commitMsg = "复制 " + srcPath + srcName + " 到 " + dstPath + dstName;
			}
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDocTmp = buildBasicDoc(reposId, null, null, reposPath, srcPath, srcName, null, null, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, null, reposPath, dstPath, dstName, null, null, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDoc = docSysGetDoc(repos, srcDocTmp, false);
		if(srcDoc == null || srcDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		if(ret == true || isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "copyDoc");
			realTimeBackup(repos, srcDoc, dstDoc, reposAccess, commitMsg, rt, "copyDoc");
		}
		
		writeJson(rt, response);
		
		if(ret)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件", "成功",  repos, srcDoc, dstDoc, "");
			executeCommonActionList(actionList, rt);
			return;
		}
		addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  repos, srcDoc, dstDoc, "");
	}
	
	/****************   execute a Document ******************/
	@RequestMapping("/executeDoc.do")
	public void executeDoc(Integer reposId, String path, String name,
			String cmdLine,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** executeDoc ****************");
		Log.debug("executeDoc reposId:" + reposId + " path:" + path + " name:" + name);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		//repos是本地服务器的目录（远程的暂不支持）
		String ret = localExecuteDoc(repos, doc, cmdLine, reposAccess.getAccessUser());
		
		rt.setData(ret);
		writeJson(rt, response);
	}
	
	private String localExecuteDoc(Repos repos, Doc doc, String cmdLine, User user) {
		
		//命令在userTmp目录下运行
		String runPath = Path.getReposTmpPathForUser(repos, user);
		File dir = new File(runPath);
		
		String cmd = buildDocExecuteCmd(repos, doc, cmdLine);
		Log.debug("executeDoc cmd:" + cmd);
		if(cmd != null)
		{
			return run(cmd, null, dir);
		}
		return null;
	}

	private String buildDocExecuteCmd(Repos repos, Doc doc, String cmdLine) {
		String filePath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		File file = new File(filePath);
		if(!file.exists() || !file.isFile())
		{
			return null;
		}
	
		String cmd = null;
		String os = System.getProperty("os.name");
		if (os.startsWith("Windows")) {
			cmd = "cmd /c " + filePath;
		}
		else
		{
			cmd = "sh " + filePath;
		}
		return cmd;
	}

	/****************   Check a Document ******************/
	@RequestMapping("/checkDocInfo.do")
	public void checkDocInfo(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size,String checkSum, 
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** checkDocInfo ****************");
		Log.debug("checkDocInfo  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposInfo(reposId, reposAccess.getDocShare());
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
				
		//检查登录用户的权限
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc parentDoc = buildBasicDoc(reposId, pid, null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		DocAuth UserDocAuth = getUserDocAuth(repos, reposAccess.getAccessUser().getId(), parentDoc);
		if(UserDocAuth == null)
		{
			Log.docSysErrorLog("您无权在该目录上传文件!", rt);
			writeJson(rt, response);
			return;
		}
		
		if(UserDocAuth.getUploadSize() != null && UserDocAuth.getUploadSize() < size)
		{
			Log.info("checkDocInfo size:" + size + " UserDocAuth max uploadSize:" + UserDocAuth.getUploadSize());
			String maxUploadSize = getMaxUploadSize(UserDocAuth.getUploadSize());
			rt.setError("上传文件大小超限[" + maxUploadSize + "]，请联系管理员");
			writeJson(rt, response);
			return;
		}		
		
		//是否可以秒传检查(文件是否已存在且校验码一致或者文件不存在但系统中存在相同校验码的文件)
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);

		Doc fsDoc = fsGetDoc(repos, doc);
		if(fsDoc != null && fsDoc.getType() != 0)
		{	
			Doc dbDoc = dbGetDoc(repos, doc, true);
			if(isUploadCanSkip(repos, doc, fsDoc, dbDoc))
			{	
				rt.setData(fsDoc);
				rt.setMsgData("1");
				Log.docSysDebugLog("checkDocInfo() " + name + " 已存在，且checkSum相同！", rt);
				writeJson(rt, response);
				return;
			}
			else
			{
				rt.setData(fsDoc);
				rt.setMsgData("0");
				Log.docSysDebugLog("checkDocInfo() " + name + " 已存在", rt);
				writeJson(rt, response);
				return;
			}
		}
				
		//对于大于50M的文件尝试寻找checkSum相同的文件进行复制来避免上传
		if(size < 50*1024*1024)	//Only For 50M File to balance the Upload and SameDocSearch 
		{
			writeJson(rt, response);
			return;
		}
		
		if(checkSum == null || checkSum.isEmpty())
		{
			writeJson(rt, response);
			return;
		}
			
		//Try to find the same Doc in the repos
		Doc sameDoc = getSameDoc(size,checkSum,reposId);
		if(null == sameDoc)
		{
			writeJson(rt, response);
			return;				
		}
			
		Log.debug("checkDocInfo() " + sameDoc.getName() + " has same checkSum " + checkSum + " try to copy from it");
		if(commitMsg == null)
		{
			commitMsg = "上传 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, sameDoc, doc, commitMsg, commitUser, reposAccess.getAccessUser(),rt,actionList);
		if(ret == true)
		{
			rt.setData(fsDoc);
			rt.setMsgData("1");
			Log.docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied ok！", rt);
			writeJson(rt, response);
					
			executeCommonActionList(actionList, rt);
			return;
		}
		else
		{
			rt.setStatus("ok");
			rt.setMsgData("3");
			Log.docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied failed！", rt);
			writeJson(rt, response);
			return;
		}
	}
	
	private Repos getReposInfo(Integer reposId, DocShare docShare) {
		if(docShare == null || docShare.getType() == null || docShare.getType() == 0)
		{
			return getRepos(reposId);
		}
		
		return getRemoteReposInfo(reposId,docShare);
	}

	private Repos getRemoteReposInfo(Integer reposId, DocShare docShare) {
		//根据docShare总保存的信息，从远程来获取仓库信息
		//根据docShareId从远程连接池中取出socket
		//在该socket上发送getRepos请求
		//接受来自
		return null;
	}

	private boolean isUploadCanSkip(Repos repos, Doc doc, Doc fsDoc, Doc dbDoc) {
		//检查checkSum是否相同
		if(doc.getType() != 1)
		{
			return false;
		}
		
		//文件校验码为空表示不需要进行秒传
		if(doc.getCheckSum() == null || doc.getCheckSum().isEmpty())
		{
			//CheckSum is empty, mean no need to check any more 
			return false;
		}
			
		if(dbDoc == null)
		{
			return false;				
		}
			
		//数据库记录与本地文件已经不一致无法检查文件是否相同
		//local file size changed
		if(!dbDoc.getSize().equals(fsDoc.getSize()))
		{
			Log.debug("isUploadCanSkip() local changed: dbDoc.size:" + dbDoc.getSize() + " localEntry.size:" + fsDoc.getSize()); 
			return false;			
		}
						
		//local file timestamp changed
		if(!dbDoc.getLatestEditTime().equals(fsDoc.getLatestEditTime()))
		{
			Log.debug("isUploadCanSkip() local changed: dbDoc.lastEditTime:" + dbDoc.getLatestEditTime() + " localEntry.lastEditTime:" + fsDoc.getLatestEditTime()); 
			return false;
		}
		
		//checksum check
		if(isDocCheckSumMatched(dbDoc,doc.getSize(), doc.getCheckSum()))
		{
			return true;
		}
		
		return false;
	}

	private Doc getSameDoc(Long size, String checkSum, Integer reposId) 
	{
		Doc qdoc = new Doc();
		qdoc.setSize(size);
		qdoc.setCheckSum(checkSum);
		qdoc.setVid(reposId);
		List <Doc> docList = reposService.getDocList(qdoc);
		if(docList != null && docList.size() > 0)
		{
			return docList.get(0);
		}
		return null;
	}

	private boolean isDocCheckSumMatched(Doc doc,Long size, String checkSum) {
		Log.debug("isDocCheckSumMatched() size:" + size + " checkSum:" + checkSum + " docSize:" + doc.getSize() + " docCheckSum:"+doc.getCheckSum());

		if(size == 0L)	//对于size==0的情况只要比较原来的doc.getSize() == 0
		{
			return size.equals(doc.getSize()); 
		}
		
		if(size.equals(doc.getSize()) && !"".equals(checkSum) && checkSum.equals(doc.getCheckSum()))
		{
			return true;
		}
		return false;
	}
	
	//check if chunk uploaded 
	@RequestMapping("/checkChunkUploaded.do")
	public void checkChunkUploaded(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Long chunkSize,String chunkHash, 
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.info("\n************** checkChunkUploaded ****************");
		Log.debug("checkChunkUploaded  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId);
			
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if("".equals(checkSum))
		{
			//CheckSum is empty, mean no need 
			writeJson(rt, response);
			return;
		}

		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		
		//判断tmp目录下是否有分片文件，并且checkSum和size是否相同 
		String fileChunkName = name + "_" + chunkIndex;
		String userTmpDir = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
		String chunkParentPath = userTmpDir;
		String chunkFilePath = chunkParentPath + fileChunkName;
		if(false == isChunkMatched(chunkFilePath,chunkHash))
		{
			rt.setMsgData("0");
			Log.docSysDebugLog("chunk: " + fileChunkName +" 不存在，或checkSum不同！", rt);
		}
		else
		{
			rt.setMsgData("1");
			Log.docSysDebugLog("chunk: " + fileChunkName +" 已存在，且checkSum相同！", rt);
			
			Log.debug("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				if(commitMsg == null)
				{
					commitMsg = "上传 " + path + name;
				}
				String commitUser = reposAccess.getAccessUser().getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				
				//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
				String reposPath = Path.getReposPath(repos);
				String localRootPath = Path.getReposRealPath(repos);
				String localVRootPath = Path.getReposVirtualPath(repos);

				String localParentPath = localRootPath + path;
				File localParentDir = new File(localParentPath);
				if(false == localParentDir.exists())
				{
					localParentDir.mkdirs();
				}
				
				Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);
				
				Doc dbDoc = docSysGetDoc(repos, doc, false);
				if(dbDoc == null || dbDoc.getType() == 0)
				{
					boolean ret = addDoc(repos, doc,
								null,
								chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
					writeJson(rt, response);
					if(ret == true)
					{
						executeCommonActionList(actionList, rt);
						deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
					}					
				}
				else
				{
					boolean ret = updateDoc(repos, doc, 
							null,   
							chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);				
				
					writeJson(rt, response);	
					if(ret == true)
					{
						executeCommonActionList(actionList, rt);
						deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
						deletePreviewFile(doc);
					}
				}
				return;
			}
		}
		writeJson(rt, response);
	}

	/****************   Upload a Document ******************/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			MultipartFile uploadFile,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Long chunkSize, String chunkHash,
			String commitMsg,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** uploadDoc ****************");
		Log.debug("uploadDoc  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId + " commitMsg:" + commitMsg);
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		String localParentPath = localRootPath + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
		}
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, 1, true, localRootPath, localVRootPath, size, checkSum);
		
		//Check Edit Right
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		if(docUserAuth.getAccess() == 0)
		{
			rt.setError("您无权访问该目录，请联系管理员");
			writeJson(rt, response);
			return;
		}
		
		if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
		{
			rt.setError("您没有该文件的编辑权限，请联系管理员");
			writeJson(rt, response);
			return;				
		}
		
		if(docUserAuth.getUploadSize() != null && docUserAuth.getUploadSize() < size)
		{
			Log.info("uploadDoc size:" + size + " docUserAuth max uploadSize:" + docUserAuth.getUploadSize());
			String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
			rt.setError("上传文件大小超限[" + maxUploadSize + "]，请联系管理员");
			writeJson(rt, response);
			return;							
		}

		//Check Add Right
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == 0)	//0: add  1: update
		{
			Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
			DocAuth parentDocUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask());
			if(parentDocUserAuth == null)
			{
				rt.setError("您无此操作权限，请联系管理员");
				writeJson(rt, response);
				return;
			}
			if(parentDocUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				writeJson(rt, response);
				return;
			}
			
			if(parentDocUserAuth.getAddEn() == null || parentDocUserAuth.getAddEn() != 1)
			{
				rt.setError("您没有该目录的新增权限，请联系管理员");
				writeJson(rt, response);
				return;
			}
			
			if(parentDocUserAuth.getUploadSize() != null && parentDocUserAuth.getUploadSize() < size)
			{
				Log.info("uploadDoc size:" + size + " parentDocUserAuth max uploadSize:" + docUserAuth.getUploadSize());
				String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
				rt.setError("上传文件大小超限[" + maxUploadSize + "]，请联系管理员");
				writeJson(rt, response);
				return;							
			}
		}
		
		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = name + "_" + chunkIndex;
			String userTmpDir = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			if(FileUtil.saveFile(uploadFile,userTmpDir,fileChunkName) == null)
			{
				Log.docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
				writeJson(rt, response);
				return;
			}
			
			if(chunkIndex < (chunkNum-1))
			{
				rt.setData(chunkIndex);	//Return the sunccess upload chunkIndex
				writeJson(rt, response);
				return;
				
			}
		}
		
		//非分片上传或LastChunk Received
		if(uploadFile != null) 
		{
			if(commitMsg == null)
			{
				commitMsg = "上传 " + path + name;
			}
			String commitUser = reposAccess.getAccessUser().getName();
			String chunkParentPath = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			boolean ret = false;
			if(dbDoc == null || dbDoc.getType() == 0)
			{
				ret = addDoc(repos, doc, 
						uploadFile,
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
				writeJson(rt, response);

				if(ret == true)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
				}					
			}
			else
			{
				ret = updateDoc(repos, doc, 
						uploadFile,  
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);					
			
				writeJson(rt, response);	
				if(ret == true)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
					deletePreviewFile(doc);
				}
			}
			addSystemLog(request, reposAccess.getAccessUser(), "uploadDoc", "uploadDoc", "上传文件", "成功",  repos, doc, null, "");	

			if(ret == true)
			{
				realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "uploadDoc");
				realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "uploadDoc");
			}
			return;
		}
		else
		{
			Log.docSysErrorLog("文件上传失败！", rt);
		}
		writeJson(rt, response);
		addSystemLog(request, reposAccess.getAccessUser(), "uploadDoc", "uploadDoc", "上传文件", "失败",  repos, doc, null, "");	
	}
	
	private String getMaxUploadSize(Long uploadSize) {
		//字节
		if(uploadSize < 1024)
		{
			return uploadSize + "";
		}
		
		//KB
		uploadSize = uploadSize/1024;
		if(uploadSize < 1024)
		{
			return uploadSize + "K"; 
		}
		
		//MB
		uploadSize = uploadSize/1024;
		if(uploadSize < 1024)
		{
			return uploadSize + "M";
		}
		
		//GB
		uploadSize = uploadSize/1024;
		if(uploadSize < 1024)
		{
			return uploadSize + "G";
		}
		
		//TB
		uploadSize = uploadSize/1024;
		return uploadSize + "T";
	}

	@RequestMapping("/uploadDocRS.do")
	public void uploadDocRS(Integer reposId, String remoteDirectory, String path, String name, Long size, String checkSum,
			MultipartFile uploadFile,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Long chunkSize, String chunkHash,
			String commitMsg,
			String authCode,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** uploadDocRS ****************");
		Log.debug("uploadDocRS  reposId:" + reposId + " remoteDirectory:" + remoteDirectory + " path:" + path + " name:" + name  + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " authCode:" + authCode + " commitMsg:" + commitMsg);
		ReturnAjax rt = new ReturnAjax();

		if(checkAuthCode(authCode, null) == false)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//upload to server directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				Log.docSysErrorLog("服务器路径不能为空！", rt);
				writeJson(rt, response);			
				return;				
			}
			
			//如果是分片文件，则保存分片文件
			String localParentPath = remoteDirectory + path;
			String chunkTmpPath = localParentPath;
			if(null != chunkIndex)
			{
				String fileChunkName = name + "_" + chunkIndex;
				if(FileUtil.saveFile(uploadFile, chunkTmpPath, fileChunkName) == null)
				{
					Log.debug("uploadDocRS 分片文件 " + fileChunkName +  " 暂存失败!");
					rt.setError("分片文件 " + fileChunkName +  " 暂存失败!");
					writeJson(rt, response);
					return;
				}
				
				if(chunkIndex < (chunkNum-1))
				{
					rt.setData(chunkIndex);	//Return the sunccess upload chunkIndex
					writeJson(rt, response);
					return;					
				}
			}
			
			//非分片或者是已经收到最后一个分片文件
			if(null == chunkNum)	//非分片上传
			{
				if(FileUtil.saveFile(uploadFile, remoteDirectory + path, name) == null)
				{
					Log.debug("uploadDocRS 文件 " + name +  " 保存失败!");
					rt.setError("文件 " + name +  " 保存失败!");
				}
				writeJson(rt, response);
				return;
			}
			
			if(chunkNum == 1)	//单个分片文件直接复制
			{
				String chunk0Path = chunkTmpPath + name + "_0";
				if(new File(chunk0Path).exists() == false)
				{
					chunk0Path =  chunkTmpPath + name;
				}
				if(FileUtil.moveFileOrDir(chunkTmpPath, name + "_0", localParentPath, name, true) == false)
				{
					Log.debug("uploadDocRS 文件 " + name +  " 保存失败!");
					rt.setError("文件 " + name +  " 保存失败!");
				}
				writeJson(rt, response);
				return;
			}
			
			//多个则需要进行合并
			combineChunks(localParentPath,name,chunkNum,chunkSize,chunkTmpPath);
			deleteChunks(name,chunkIndex, chunkNum,chunkTmpPath);
			//Verify the size and FileCheckSum
			if(false == checkFileSizeAndCheckSum(localParentPath,name, size, checkSum))
			{
				Log.debug("uploadDocRS 文件校验失败");
				rt.setError("文件校验失败");
			}
			writeJson(rt, response);
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		String localParentPath = localRootPath + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
		}
		
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, localRootPath, localVRootPath, size, checkSum);
		
		//Check Edit Right
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		if(docUserAuth.getAccess() == 0)
		{
			rt.setError("您无权访问该目录，请联系管理员");
			writeJson(rt, response);
			return;
		}
		
		if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
		{
			rt.setError("您没有该文件的编辑权限，请联系管理员");
			writeJson(rt, response);
			return;				
		}
		
		if(docUserAuth.getUploadSize() != null && docUserAuth.getUploadSize() < size)
		{
			Log.info("uploadDocRS size:" + size + " docUserAuth max uploadSize:" + docUserAuth.getUploadSize());
			String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
			rt.setError("上传文件大小超限[" + maxUploadSize + "]，请联系管理员");
			writeJson(rt, response);
			return;							
		}

		//Check Add Right
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == 0)	//0: add  1: update
		{
			Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
			DocAuth parentDocUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask());
			if(parentDocUserAuth == null)
			{
				rt.setError("您无此操作权限，请联系管理员");
				writeJson(rt, response);
				return;
			}
			if(parentDocUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				writeJson(rt, response);
				return;
			}
			
			if(parentDocUserAuth.getAddEn() == null || parentDocUserAuth.getAddEn() != 1)
			{
				rt.setError("您没有该目录的新增权限，请联系管理员");
				writeJson(rt, response);
				return;
			}
			
			if(parentDocUserAuth.getUploadSize() != null && parentDocUserAuth.getUploadSize() < size)
			{
				Log.info("uploadDocRS size:" + size + " parentDocUserAuth max uploadSize:" + docUserAuth.getUploadSize());
				String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
				rt.setError("上传文件大小超限[" + maxUploadSize + "]，请联系管理员");
				writeJson(rt, response);
				return;							
			}
		}
		
		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = name + "_" + chunkIndex;
			String userTmpDir = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			if(FileUtil.saveFile(uploadFile,userTmpDir,fileChunkName) == null)
			{
				Log.docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
				writeJson(rt, response);
				return;
			}
			
			if(chunkIndex < (chunkNum-1))
			{
				rt.setData(chunkIndex);	//Return the sunccess upload chunkIndex
				writeJson(rt, response);
				return;
				
			}
		}
		
		//非分片上传或LastChunk Received
		if(uploadFile != null) 
		{
			if(commitMsg == null)
			{
				commitMsg = "上传 " + path + name;
			}
			String commitUser = reposAccess.getAccessUser().getName();
			String chunkParentPath = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			boolean ret = false;
			if(dbDoc == null || dbDoc.getType() == 0)
			{
				ret = addDoc(repos, doc, 
						uploadFile,
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
				writeJson(rt, response);

				if(ret == true)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
				}					
			}
			else
			{
				ret = updateDoc(repos, doc, 
						uploadFile,  
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);					
			
				writeJson(rt, response);	
				if(ret == true)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
					deletePreviewFile(doc);
				}
			}
			addSystemLog(request, reposAccess.getAccessUser(), "uploadDoc", "uploadDoc", "上传文件", "成功",  repos, doc, null, "");	

			if(ret == true)
			{
				realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "uploadDocRS");
				realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "uploadDocRS");
			}
			return;
		}
		else
		{
			Log.docSysErrorLog("文件上传失败！", rt);
		}
		writeJson(rt, response);
		addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  repos, doc, null, "");	
	}
	
	
	/****************   Upload a Picture for Markdown ******************/
	@RequestMapping("/uploadMarkdownPic.do")
	public void uploadMarkdownPic(
			Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String imgName,
			@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, 
			HttpServletRequest request,HttpServletResponse response,HttpSession session) throws Exception
	{
		Log.info("\n************** uploadMarkdownPic ****************");
		Log.debug("uploadMarkdownPic reposId:" + reposId + " docId:" + docId + " path:" + path + " name:" + name + " imgName:" + imgName);
		
		JSONObject res = new JSONObject();

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			res.put("success", 0);
			res.put("message", "仓库 " + reposId + " 不存在！");
			writeJson(res,response);
			return;		
		}
		
		if(path == null || name == null)
		{
			res.put("success", 0);
			res.put("message", "目标路径不能为空！");
			writeJson(res,response);
			return;		
		}
		
		path = Base64Util.base64Decode(path);
		if(path == null)
		{
			res.put("success", 0);
			res.put("message", "目标路径解码失败！");
			writeJson(res,response);		
			return;
		}
	
		name = Base64Util.base64Decode(name);
		if(name == null)
		{
			res.put("success", 0);
			res.put("message", "目标文件名解码失败！");
			writeJson(res,response);			
			return;
		}
		Log.debug("uploadMarkdownPic path:" + path +" name:"+ name);

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc curDoc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);

		if(file == null) 
		{
			res.put("success", 0);
			res.put("message", "upload failed: file is null!");
			writeJson(res,response);
			return;
		}
		
		//Save the file
		String fileName = imgName;
		if(fileName == null)
		{
			fileName = file.getOriginalFilename();
		}
		String docVName = Path.getVDocName(curDoc);
		String localVDocPath = localVRootPath + docVName;
		String localParentPath = localVDocPath + "/res/";
		
		//Check and create localParentPath
		File dir = new File(localParentPath);
		if(!dir.exists())	
		{
			dir.mkdirs();
		}
		
		String retName = FileUtil.saveFile(file, localParentPath,fileName);
		if(retName == null)
		{
			res.put("success", 0);
			res.put("message", "upload failed: FileUtil.saveFile error!");
			writeJson(res,response);
			return;
		}
		
		String encPath = Base64Util.base64EncodeURLSafe(path);
		String encName = Base64Util.base64EncodeURLSafe(name);
		String encTargetName = Base64Util.base64EncodeURLSafe(fileName);
		String encTargetPath = Base64Util.base64EncodeURLSafe(localParentPath);
		res.put("url", "/DocSystem/Doc/downloadDocEx.do?vid=" + reposId + "&path=" + encPath + "&name=" + encName + "&targetPath="+encTargetPath+"&targetName="+encTargetName);
		res.put("success", 1);
		res.put("message", "upload success!");
		writeJson(res,response);
		
		addSystemLog(request, null, "uploadMarkdownPic", "uploadMarkdownPic", "上传备注图片", "成功",  repos, curDoc, null, "");			
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			String content, Integer docType,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** updateDocContent ****************");
		Log.debug("updateDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);
		//Log.debug("updateDocContent content:[" + content + "]");
		//Log.debug("content size: " + content.length());
			
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);		
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + path + name + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//updateVDocIndex need these fields
		doc.setType(dbDoc.getType());
		doc.setSize(dbDoc.getSize());
		doc.setLatestEditTime(dbDoc.getLatestEditTime());
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		doc.setContent(content);
		
		String commitUser = reposAccess.getAccessUser().getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = false;
		if(docType == 1)
		{
			if(FileUtil.isTextFile(name) == false)
			{
				Log.docSysErrorLog(name + " 不是文本文件，禁止修改！", rt);
				writeJson(rt, response);
				return;
			}
			
			if(commitMsg == null)
			{
				commitMsg = "更新 " + path + name;
			}
			ret = updateRealDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
			if(ret == true)
			{
				realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "updateDocContent");
				realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "updateDocContent");
			}
			
			writeJson(rt, response);
	
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "成功",  repos, doc, null, "");			

			if(ret)
			{
				deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}			
		}
		else
		{
			if(commitMsg == null)
			{
				commitMsg = "更新 " + path + name + " 备注";
			}
			ret = updateVirualDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
			writeJson(rt, response);

			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改备注", "成功",  repos, doc, null, "");			

			if(ret)
			{
				deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}
		}
	}
	
	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** tmpSaveDocContent ****************");
		Log.debug("tmpSaveVirtualDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		//Log.debug("tmpSaveVirtualDocContent content:[" + content + "]");
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		doc.setContent(content);
		
		if(docType == 1)
		{
			if(saveTmpRealDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				Log.docSysErrorLog("saveVirtualDocContent Error!", rt);
			}			
		}
		else
		{
			if(saveTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				Log.docSysErrorLog("saveVirtualDocContent Error!", rt);
			}
		}
		writeJson(rt, response);
	}
	
	/**************** downloadDocPrepare ******************/
	@RequestMapping("/downloadDocPrepare.do")
	public void downloadDocPrepare(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			Integer downloadType,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.info("\n************** downloadDocPrepare ****************");
		Log.debug("downloadDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " downloadType:" + downloadType + " shareId:" + shareId);
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限下载文件
		if(checkUserDownloadRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(downloadType != null && downloadType == 2)
		{
			downloadVDocPrepare_FSM(repos, doc, reposAccess.getAccessUser(), rt);
		}
		else
		{
			downloadDocPrepare_FSM(repos, doc, reposAccess, true, rt);				
		}
		
		writeJson(rt, response);
		
		if(rt.getStatus().equals("ok"))
		{
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  repos, doc, null, "");	
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  repos, doc, null, "");				
		}
	}
	
	public void downloadDocPrepare_FSM(Repos repos, Doc doc, ReposAccess reposAccess,  boolean remoteStorageEn, ReturnAjax rt)
	{	
		if(isFSM(repos) == false)
		{
			//文件服务器前置仓库不允许远程存储
			remoteStorageEn = false;
			//从文件服务器拉取文件
			remoteServerCheckOut(repos, doc, null, null, null, null, true, true, null);
		}

		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			Log.debug("downloadDocPrepare_FSM() locaDoc " +doc.getPath() + doc.getName() + " 获取异常");
			Log.docSysErrorLog("本地文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
			return;
		}
		
		//本地文件不存在
		if(localEntry.getType() == 0)
		{
			Log.debug("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
			if(remoteStorageEn)
			{
			    if(remoteStorageCheckOut(repos, doc, reposAccess.getAccessUser(), null, true, true, false, rt) == true)
				{
					localEntry = fsGetDoc(repos, doc); 	//重新读取本地文件信息
				}
			}
			
			//注意：这里不再次检查localEntry是否存在，是因为后面还可能需要从版本仓库中下载文件
		}
		
		//原始路径下载，禁止删除原始文件
		String targetName = doc.getName();
		String targetPath = doc.getLocalRootPath() + doc.getPath();
		if(localEntry.getType() == 1)
		{
			//If it is office file, need try to get the latest save office file
			Doc downloadDocForOffice = getDownloadDocInfoForOffice(repos, localEntry);
			if(downloadDocForOffice != null)
			{
				rt.setData(downloadDocForOffice);
				rt.setMsgData(1);	//下载完成后删除已下载的文件
				Log.docSysDebugLog("本地文件: 非原始路径下载", rt);
				return;
			}
			
			Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 1);
			rt.setData(downloadDoc);
			rt.setMsgData(0);	//下载完成后不能删除下载的文件
			Log.docSysDebugLog("本地文件: 原始路径下载", rt);
			return;
		}
		
		if(localEntry.getType() == 2)
		{	
			if(FileUtil.isEmptyDir(doc.getLocalRootPath() + doc.getPath() + doc.getName(), true))
			{
				Log.docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
			
			Doc downloadDoc = null;
			if(repos.encryptType != null && repos.encryptType != 0)
			{
				//对于加密的仓库，使用直接下载目录的方式
				downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 1);
				rt.setData(downloadDoc);
				rt.setMsgData(0);	//下载完成后不删除已下载的文件
				Log.docSysDebugLog("本地目录: 原始路径下载", rt);
				return;						
			}
			
			//提前压缩有权限的文件(因为这里涉及加密仓库的文件解密问题，对于加密的仓库每次下载都需要先解密再加密，会增加大量的硬盘使用空间)
			targetPath = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
			targetName = targetName + ".zip";
			compressAuthedFiles(targetPath, targetName, repos, doc, reposAccess);
			downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 0);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			Log.docSysDebugLog("本地目录: 非原始路径下载", rt);
			return;
		}
		
		if(localEntry.getType() == 0)
		{
			//文件服务器前置仓库不支持版本仓库
			if(isFSM(repos) == false)
			{
				Log.debug("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
				Log.docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
				return;					
			}
			
			//本地文件不存在（尝试从版本仓库中下载）
			targetPath = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
			Doc remoteEntry = verReposGetDoc(repos, doc, null);
			if(remoteEntry == null)
			{
				Log.docSysDebugLog("downloadDocPrepare_FSM() remoteDoc " +doc.getPath() + doc.getName() + " 获取异常", rt);
				Log.docSysErrorLog("远程文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
				return;
			}
				
			if(remoteEntry.getType() == null || remoteEntry.getType() == 0)
			{
				Log.debug("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
				Log.docSysErrorLog("远程文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
				return;	
			}
				
			//Do checkout to local
			if(verReposCheckOut(repos, false, doc, targetPath, doc.getName(), null, true, true, null) == null)
			{
				Log.docSysErrorLog("远程下载失败", rt);
				Log.docSysDebugLog("downloadDocPrepare_FSM() verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " targetPath:" + targetPath + " targetName:" + doc.getName(), rt);
				return;
			}
				
			if(remoteEntry.getType() == 1)
			{
				Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 1);
				rt.setData(downloadDoc);
				rt.setMsgData(1);	//下载完成后删除已下载的文件
				Log.docSysDebugLog("远程文件: 已下载并存储在用户临时目录", rt);
				return;
			}

			if(FileUtil.isEmptyDir(targetPath + doc.getName(), true))
			{
				Log.docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
				
			//TODO: 从历史版本里取出来的文件放到了临时目录里，目前没有进行权限控制
			Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 1);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			Log.docSysDebugLog("远程目录: 已下载并存储在用户临时目录", rt);
			return;
		}
		
		Log.docSysErrorLog("本地未知文件类型:" + localEntry.getType(), rt);
		return;		
	}
	
    //递归压缩
    public boolean compressAuthedFiles(String targetPath, String targetName, Repos repos, Doc doc, ReposAccess reposAccess) 
    {
    	DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());
		
    	boolean ret = false;
    	SevenZOutputFile out = null;
    	try {
	    	File input = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
	        if (!input.exists()) 
	        {
	        	Log.debug(doc.getLocalRootPath() + doc.getPath() + doc.getName() + " 不存在");
	        	return false;
	        }
	        
	        out = new SevenZOutputFile(new File(targetPath, targetName));
	        compressAuthedFiles(out, input, repos, doc, curDocAuth, docAuthHashMap);
	        ret = true;
    	} catch(Exception e) {
    		Log.error(e);
    	} finally {
    		if(out != null)
    		{
    			try {
					out.close();
				} catch (IOException e) {
					Log.error(e);
				}
    		}
    	}
    	return ret;
    }
	public void compressAuthedFiles(SevenZOutputFile out, File input, Repos repos, Doc doc, DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap) throws Exception 
    {		
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("compressAuthedFiles() have no right to download for [" + doc.getPath() + doc.getName() + "]");
			return;
		}

	    SevenZArchiveEntry entry = null;
        //如果路径为目录（文件夹）
        if (input.isDirectory()) {
        	//取出文件夹中的文件（或子文件夹）
            File[] flist = input.listFiles();

            if (flist.length == 0)//如果文件夹为空，则只需在目的地.7z文件中写入一个目录进入
            {
    			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is empty folder");
            	entry = out.createArchiveEntry(input, doc.getPath() + doc.getName() + "/");
                out.putArchiveEntry(entry);
            } 
            else//如果文件夹不为空，则递归调用compress，文件夹中的每一个文件（或文件夹）进行压缩
            {
    			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is folder");
            	String subDocParentPath = doc.getPath() + doc.getName() + "/";
            	String localRootPath = doc.getLocalRootPath();
            	String localVRootPath = doc.getLocalVRootPath();
            	
            	for (int i = 0; i < flist.length; i++) {    
            		File subFile = flist[i];
            		String subDocName = subFile.getName();
            		Integer subDocLevel = getSubDocLevel(doc);
    	    		int type = 1;
    	    		if(subFile.isDirectory())
    	    		{
    	    			type = 2;
    	    		}
    	    		long size = subFile.length();
            		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subDocName, subDocLevel, type, true,localRootPath, localVRootPath, size, "", doc.offsetPath);
            		DocAuth subDocAuth = getDocAuthFromHashMap(subDoc.getDocId(), curDocAuth, docAuthHashMap);
            		compressAuthedFiles(out, flist[i], repos, subDoc, subDocAuth, docAuthHashMap);
                }
            }
        } 
        else//如果不是目录（文件夹），即为文件，则先写入目录进入点，之后将文件写入7z文件中
        {
			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is file");
        	FileInputStream fos = new FileInputStream(input);
            BufferedInputStream bis = new BufferedInputStream(fos);
            entry = out.createArchiveEntry(input, doc.getPath() + doc.getName());
            out.putArchiveEntry(entry);
            int len = -1;
            //将源文件写入到7z文件中
            byte[] buf = new byte[1024];
            while ((len = bis.read(buf)) != -1) {
            	out.write(buf, 0, len);
            }
            bis.close();
            fos.close();
            out.closeArchiveEntry();
       }
    }
	
	private boolean remoteStorageCheckOut(Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, boolean force, boolean isAutoPull, ReturnAjax rt)
	{
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("remoteStorageCheckOut() remote is null");
			Log.docSysErrorLog("远程存储未设置！", rt);
			return false;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
		{
			Log.debug("remoteStorageCheckOut() channel is null");
			Log.docSysErrorLog("开源版不支持远程存储！", rt);			
			return false;
		}
		
		channel.remoteStoragePull(remote, repos, doc, accessUser, commitId, recurcive, force, isAutoPull, rt);
		DocPullResult pullResult = (DocPullResult) rt.getDataEx();
		if(pullResult == null)
		{
			Log.debug("remoteStorageCheckOut() 远程拉取失败");
			Log.docSysErrorLog("文件远程下载失败！", rt);			
			return false;			
		}	
		
		return true;
		
	}
	
	private Doc getDownloadDocInfoForOffice(Repos repos, Doc doc) {
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("getDownloadDocInfoForOffice 非商业版本不支持远程存储");
			return null;
	    }
		
		return channel.getDownloadDocInfoForOffice(repos, doc);
	}

	public void downloadVDocPrepare_FSM(Repos repos, Doc doc, User accessUser, ReturnAjax rt)
	{	
		Doc vDoc = buildVDoc(doc);

		Log.printObject("downloadVDocPrepare_FSM vDoc:",vDoc);
		String targetName = vDoc.getName() +".zip";
		if(vDoc.getName().isEmpty())
		{
			targetName = repos.getName() + "_备注_.zip";	
			
			if(FileUtil.isEmptyDir(vDoc.getLocalRootPath(), true))
			{
				Log.docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
		}
		else
		{
			File localEntry = new File(vDoc.getLocalRootPath() + vDoc.getPath() + vDoc.getName());
			if(false == localEntry.exists())
			{
				Log.docSysErrorLog("文件 " + doc.getName() + " 没有备注！", rt);
				return;
			}
		}
		
		String targetPath = Path.getReposTmpPathForDownload(repos,accessUser);
		//doCompressDir and save the zip File under userTmpDir
		if(doCompressDir(vDoc.getLocalRootPath() + vDoc.getPath(), vDoc.getName(), targetPath, targetName, rt) == false)
		{
			Log.docSysErrorLog("压缩本地目录失败！", rt);
			return;
		}
		
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 0);
		rt.setData(downloadDoc);
		rt.setMsgData(1);	//下载完成后删除已下载的文件
		Log.docSysDebugLog("远程目录: 已压缩并存储在用户临时目录", rt);
		return;		
	}
	
	/**************** download Doc ******************/
	@RequestMapping("/downloadDoc.do")
	public void downloadDoc(Integer vid, String reposPath, String targetPath, String targetName, 
			Integer deleteFlag, //是否删除已下载文件  0:不删除 1:删除
			Integer shareId,
			String authCode,
			Integer encryptEn,	//是否检查文件被加密
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** downloadDoc.do ****************");
		Log.debug("downloadDoc  reposPath:" + reposPath + " targetPath:" + targetPath + " targetName:" + targetName+ " shareId:" + shareId + " authCode:" + authCode + "reposPath:" + reposPath + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == false)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				Log.docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			Log.docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		Log.debug("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);
		
		if(encryptEn == null || encryptEn == 0 || vid == null)	//此时表明，targetPath肯定是临时目录
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, deleteFlag, null);						
		}
		Doc doc = new Doc();
		doc.setPath(targetPath);
		doc.setName(targetName);
		//addSystemLog(request, reposAccess.getAccessUser(), "downloadDoc", "downloadDoc", "下载文件", "成功",  null, doc, null, "");			
	}
	
	/**************** download Doc Without LoginCheck ******************/
	@RequestMapping("/downloadDocEx.do")
	public void downloadDocEx(Integer vid, String reposPath, String targetPath, String targetName, 
			Integer deleteFlag, //是否删除已下载文件  0:不删除 1:删除
			Integer shareId,
			String authCode,
			Integer encryptEn,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** downloadDocEx ****************");
		Log.debug("downloadDocEx  reposPath:" + reposPath + " targetPath:" + targetPath + " targetName:" + targetName+ " shareId:" + shareId + " authCode:" + authCode + "reposPath:" + reposPath + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		if(targetPath == null || targetName == null)
		{
			Log.docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		Log.debug("downloadDocEx targetPath:" + targetPath + " targetName:" + targetName);
		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, deleteFlag, null);						
		}
	}
	
	@RequestMapping(value="/downloadDoc/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}", method=RequestMethod.GET)
	public void downloadDoc(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** downloadDoc ****************");
		Log.debug("downloadDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = null;
		//Convert authCode and shareId same with Non Rest Style request
		if(authCode.equals("0"))
		{
			authCode = null;
		}
		if(shareId == 0)
		{
			shareId = null;
		}
	
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == false)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				Log.docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			Log.docSysErrorLog("目标路径不能为空！", rt);
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			return;
		}
	
		Log.debug("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, null);						
		}
		
		Doc doc = new Doc();
		doc.setPath(targetPath);
		doc.setName(targetName);
		//addSystemLog(request, reposAccess.getAccessUser(), "downloadDoc", "downloadDoc", "下载文件", "成功",  null, doc, null, "");	
	}
	
	//downloadDocEx is for office-editor
	@RequestMapping(value="/downloadDocEx/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}", method=RequestMethod.GET)
	public void downloadDocEx(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** downloadDoc ****************");
		Log.debug("downloadDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = null;
		//Convert authCode and shareId same with Non Rest Style request
		if(authCode.equals("0"))
		{
			authCode = null;
		}
		if(shareId == 0)
		{
			shareId = null;
		}
	
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == false)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				Log.docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			Log.docSysErrorLog("目标路径不能为空！", rt);
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			return;
		}
	
		Log.debug("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, null);						
		}
		
		Doc doc = new Doc();
		doc.setPath(targetPath);
		doc.setName(targetName);
		//addSystemLog(request, reposAccess.getAccessUser(), "downloadDoc", "downloadDoc", "下载文件", "成功",  null, doc, null, "");	
	}

	/**************** get Tmp File ******************/
	@RequestMapping("/doGetTmpFile.do")
	public void doGetTmp(Integer reposId,String path, String fileName,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** doGetTmpFile ****************");
		Log.debug("doGetTmpFile  reposId:" + reposId + " path:" + path + " fileName:" + fileName+ " shareId:" + shareId);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, fileName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//虚拟文件下载
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//get userTmpDir
		String userTmpDir = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		
		String localParentPath = userTmpDir;
		if(path != null)
		{
			localParentPath = userTmpDir + path;
		}
		
		sendFileToWebPage(localParentPath,fileName,rt, response, request, null); 
	}

	public String getCheckSum(File localEntry, Long chunkSize) 
	{
		String hash = null;
		try {
			
			FileInputStream fis = new FileInputStream(localEntry);
			hash=DigestUtils.md5Hex(fis);
			fis.close();
		} 
		catch (Exception e) 
		{
			Log.debug("getCheckSum() Exception"); 
			Log.error(e);
			return null;
		}
		return hash;
	}
	
	/****************   get Zip Document Content ******************/
	@RequestMapping("/getZipDocContent.do")
	public void getZipDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String rootPath,
			String rootName,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){
		
		Log.info("\n************** getZipDocContent ****************");
		Log.debug("getZipDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);

		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, rootPath, rootName, null, 1, true, localRootPath, localVRootPath, null, null);
		Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
		
		String tmpLocalRootPath = Path.getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
		Doc tmpDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, tmpLocalRootPath, null, null, null);
		
		checkAndExtractEntryFromCompressDoc(repos, tempRootDoc, tmpDoc);
		
		//根据文件类型获取文件内容或者文件链接			
		String status = "ok";
		String content = "";
		String fileSuffix = FileUtil.getFileSuffix(name);
		if(FileUtil.isText(fileSuffix))
		{
			content = readRealDocContent(repos, tmpDoc);
		}
		else if(FileUtil.isOffice(fileSuffix) || FileUtil.isPdf(fileSuffix))
		{
			if(checkAndGenerateOfficeContent(repos, tmpDoc, fileSuffix))
			{
				content = readOfficeContent(repos, tmpDoc);
			}
		}
		else
		{
			if(isBinaryFile(repos, tmpDoc))
			{
				status="isBinary";
			}
			else
			{
				content = readRealDocContent(repos, tmpDoc);
			}
		}
		
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);			
	}

	/****************   get Document Content ******************/
	@RequestMapping("/getDocContent.do")
	public void getDocContent(Integer reposId, String path, String name, Integer docType, String commitId,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){

		Log.info("\n************** getDocContent ************");
		Log.debug("getDocContent reposId:" + reposId + " path:" + path + " name:" + name + " docType:" + docType+ " shareId:" + shareId + " commitId:" + commitId);

		//注意该接口支持name是空的的情况
		if(path == null)
		{
			path = "";
		}
		if(name == null)
		{
			name = "";
		}
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		path = doc.getPath();
		name = doc.getName();
		
		String status = "ok";
		String content = "";
		boolean isRealDoc = true;
		if(docType == null) //docType表示是否为实体文件
		{
			docType = 1;
		}
		if(docType == 1)
		{
			doc.setIsRealDoc(isRealDoc);

			Doc tmpDoc = doc;
			if(commitId == null)
			{
				if(isFSM(repos))
				{
					Doc localEntry = fsGetDoc(repos, doc);
					//只在文件不存在时才从远程存储下载
					if(localEntry.getType() == 0)
					{
						Log.debug("getDocContent() Doc " +doc.getPath() + doc.getName() + " 不存在，从远程存储拉取");
						RemoteStorageConfig remote = repos.remoteStorageConfig;
						if(remoteStorageCheckOut(repos, doc, reposAccess.getAccessUser(), null, true, remote.autoPullForce == 1, false, rt) == true)
						{
							localEntry = fsGetDoc(repos, doc); //重新读取文件信息
						}
					}		
				}
				else
				{
					remoteServerCheckOut(repos, doc, null, null, null, commitId, true, true, null);
				}
			}
			else	//获取历史版本文件
			{
				Doc remoteDoc = null;
				if(isFSM(repos))
				{
					remoteDoc = verReposGetDoc(repos, doc, commitId);
				}
				else
				{
					remoteDoc = remoteServerGetDoc(repos, doc, commitId);
				}
				
				if(remoteDoc == null)
				{
					Log.docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
					writeJson(rt, response);			
					return;
				}
				if(remoteDoc.getType() == 0)
				{
					Log.docSysErrorLog(name + " 不存在！", rt);
					writeJson(rt, response);			
					return;				
				}
				else if(remoteDoc.getType() == 2)
				{
					Log.docSysErrorLog(name + " 是目录！", rt);
					writeJson(rt, response);			
					return;				
				}
				
				//checkOut历史版本文件
				String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, isRealDoc);
				File dir = new File(tempLocalRootPath + path);
				if(dir.exists() == false)
				{
					dir.mkdirs();
				}
				File file = new File(tempLocalRootPath + path + name);
				if(file.exists() == false)
				{
					if(isFSM(repos))
					{
						verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
					}
					else
					{
						remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, true, true, null);
					}
				}
				tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);					
			}
			
			String fileSuffix = FileUtil.getFileSuffix(name);
			if(FileUtil.isText(fileSuffix))
			{
				//content = readRealDocContent(repos, tmpDoc);
				content = readRealDocContentEx(repos, tmpDoc);				
			}
			else if(FileUtil.isOffice(fileSuffix) || FileUtil.isPdf(fileSuffix))
			{
				if(checkAndGenerateOfficeContentEx(repos, tmpDoc, fileSuffix))
				{
					content = readOfficeContent(repos, tmpDoc);
				}
			}
			else
			{
				if(isBinaryFile(repos, tmpDoc))
				{
					status="isBinary";
				}
				else
				{
					content = readRealDocContentEx(repos, tmpDoc);
				}
			}
		}
		else if(docType == 2)
		{
			isRealDoc = false;
			doc.setIsRealDoc(isRealDoc);

			if(commitId == null)
			{
				content = readVirtualDocContent(repos, doc);
			}
			else
			{
				String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, isRealDoc);
				File dir = new File(tempLocalRootPath + path);
				if(dir.exists() == false)
				{
					dir.mkdirs();
					verReposCheckOut(repos, true, doc, tempLocalRootPath + path, name, commitId, true, true, null);
				}

				Doc tmpDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, tempLocalRootPath, localVRootPath, null, null);
				content = readRealDocContent(repos, tmpDoc);
			}
		}
		
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);
	}
	
	
	private boolean isBinaryFile(Repos repos, Doc doc) {
		String filePath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		String code = FileUtils2.getFileEncode(filePath);
		return FileUtils2.isBinaryFile(code);
	}
	
	public String getDocContent(Repos repos, Doc doc, int offset, int size, User accessUser)
	{
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		boolean isRealDoc = true;
		doc.setIsRealDoc(isRealDoc);
		doc.setLocalRootPath(localRootPath);
		doc.setLocalVRootPath(localVRootPath);
		
		Doc tmpDoc = doc;
		//置类型仓库需要先将文件下载到本地
		if(isFSM(repos) == false)
		{
			remoteServerCheckOut(repos, doc, null, null, null, null, true, true, null);
		}		
	
		String content = "";
		String fileSuffix = FileUtil.getFileSuffix(doc.getName());
		if(FileUtil.isText(fileSuffix))
		{
			content = readRealDocContent(repos, tmpDoc, offset, size);
		}
		else if(FileUtil.isOffice(fileSuffix) || FileUtil.isPdf(fileSuffix))
		{
			if(checkAndGenerateOfficeContent(repos, tmpDoc, fileSuffix))
			{
				content = readOfficeContent(repos, tmpDoc, offset, size);
			}
		}
		else
		{
			if(isBinaryFile(repos, tmpDoc))
			{
				content = "";
			}
			else
			{
				content = readRealDocContent(repos, tmpDoc, offset, size);
			}
		}
		return content;
	}

	/****************   get Tmp Saved Document Content ******************/
	@RequestMapping("/getTmpSavedDocContent.do")
	public void getTmpSavedDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){
		Log.info("\n*************** getTmpSavedDocContent ********************");
		Log.debug("getTmpSavedDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);

		if(path == null)
		{
			path = "";
		}
		
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
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		String content = "";
		if(docType == null)
		{
			docType = 1;
		}
		if(docType == 1)
		{
			String fileSuffix = FileUtil.getFileSuffix(name);
			if(FileUtil.isText(fileSuffix))
			{
				content = readTmpRealDocContent(repos, doc, reposAccess.getAccessUser());
			}
		}
		else if(docType == 2)
		{
			content = readTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());		
		}
		
		if(content == null)
		{
			content = "";
		}
		writeText(content, response);
	}
	
	@RequestMapping("/deleteTmpSavedDocContent.do")
	public void deleteTmpSavedDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n*************** deleteTmpSavedDocContent ********************");
		Log.debug("deleteTmpSavedDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
				
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
		if(docType == 1)
		{
			deleteTmpRealDocContent(repos, doc, reposAccess.getAccessUser());			
		}
		else
		{
			deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
		}
		writeJson(rt, response);
	}
	
	private boolean checkAndGenerateOfficeContent(Repos repos, Doc doc, String fileSuffix) 
	{
		
		String userTmpDir = Path.getReposTmpPathForOfficeText(repos, doc);
		String officeTextFileName = Path.getOfficeTextFileName(doc);
		File file = new File(userTmpDir, officeTextFileName);
		if(file.exists() == true)
		{
			return true;
		}
		
		String filePath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		
		//文件需要转换
		FileUtil.clearDir(userTmpDir);
		switch(fileSuffix)
		{
		case "doc":
			return OfficeExtract.extractToFileForWord(filePath, userTmpDir, officeTextFileName);
		case "docx":
			return OfficeExtract.extractToFileForWord2007(filePath, userTmpDir, officeTextFileName);
		case "ppt":
			return OfficeExtract.extractToFileForPPT(filePath, userTmpDir, officeTextFileName);
		case "pptx":
			return OfficeExtract.extractToFileForPPT2007(filePath, userTmpDir, officeTextFileName);
		case "xls":
			return OfficeExtract.extractToFileForExcel(filePath, userTmpDir, officeTextFileName);
		case "xlsx":
			return OfficeExtract.extractToFileForExcel2007(filePath, userTmpDir, officeTextFileName);
		case "pdf":
			return OfficeExtract.extractToFileForPdf(filePath, userTmpDir, officeTextFileName);
		}
		return false;
	}
	
	private boolean checkAndGenerateOfficeContentEx(Repos repos, Doc doc, String fileSuffix) 
	{
		
		String userTmpDir = Path.getReposTmpPathForOfficeText(repos, doc);
		String officeTextFileName = Path.getOfficeTextFileName(doc);
		File file = new File(userTmpDir, officeTextFileName);
		if(file.exists() == true)
		{
			return true;
		}
		
		//文件需要转换
		FileUtil.clearDir(userTmpDir);
		
		//进行提取文件内容前先进行解密
		String filePath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			String tmpFilePath = userTmpDir + doc.getName();
			if(FileUtil.copyFile(filePath, tmpFilePath, true) == false)
			{
				return false;
			}
			decryptFile(repos, userTmpDir, doc.getName());
			filePath = tmpFilePath;
		}
		
		switch(fileSuffix)
		{
		case "doc":
			return OfficeExtract.extractToFileForWord(filePath, userTmpDir, officeTextFileName);
		case "docx":
			return OfficeExtract.extractToFileForWord2007(filePath, userTmpDir, officeTextFileName);
		case "ppt":
			return OfficeExtract.extractToFileForPPT(filePath, userTmpDir, officeTextFileName);
		case "pptx":
			return OfficeExtract.extractToFileForPPT2007(filePath, userTmpDir, officeTextFileName);
		case "xls":
			return OfficeExtract.extractToFileForExcel(filePath, userTmpDir, officeTextFileName);
		case "xlsx":
			return OfficeExtract.extractToFileForExcel2007(filePath, userTmpDir, officeTextFileName);
		case "pdf":
			return OfficeExtract.extractToFileForPdf(filePath, userTmpDir, officeTextFileName);
		}
		return false;
	}

	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n*************** getDoc ********************");
		Log.debug("getDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			Log.debug("getDoc() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}
		
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
		
		Doc dbDoc = fsGetDoc(repos, doc);
		if(dbDoc == null || dbDoc.getType() == null || dbDoc.getType() == 0)
		{
			if(isFSM(repos))
			{
				RemoteStorageConfig remote = repos.remoteStorageConfig;
				if(remote != null)
				{
					dbDoc = getRemoteStorageEntry(repos, doc, remote);
				}
			}
			else
			{	
				dbDoc = remoteServerGetDoc(repos, doc, null);
			}			
		}
		
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + path+name + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		doc.setType(dbDoc.getType());
			
		//图片、视频、音频文件需要返回文件的访问信息，如果是文本文件或Office文件需要根据前端需求返回docText
		if(doc.getType() == 1)
		{
			String fileSuffix = FileUtil.getFileSuffix(name);
			Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), 1);
			rt.setDataEx(downloadDoc);
			
			if(docType == 1 || docType == 3)	//docType { 1: get docText only, 2: get content only 3: get docText and content } 
			{
				String docText = null;
				String tmpDocText = null;
				if(FileUtil.isText(fileSuffix))
				{
					docText = readRealDocContentEx(repos, doc);
					tmpDocText= readTmpRealDocContent(repos, doc, reposAccess.getAccessUser());
				}
				else if(FileUtil.isOffice(fileSuffix) || FileUtil.isPdf(fileSuffix))
				{
					if(checkAndGenerateOfficeContentEx(repos, doc, fileSuffix))
					{
						docText = readOfficeContent(repos, doc);
					}
				}
				doc.setDocText(docText);
				doc.setTmpDocText(tmpDocText);
			}
		}
		
		//获取文件备注信息
		if(docType == 2 || docType == 3)
		{
			String content = readVirtualDocContent(repos, doc);
			if( null !=content){
	        	content = content.replaceAll("\t","");
	        }
	 		//doc.setContent(JSONObject.toJSONString(content));
			doc.setContent(content);
			
			String tmpContent = readTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
		    if( null !=tmpContent){
		    	tmpContent = tmpContent.replaceAll("\t","");
	        }
			//rt.setTmpContent(JSONObject.toJSONString(tmpSavedContent));		
			doc.setTmpContent(tmpContent);
		}
		
		rt.setData(doc);

		writeJson(rt, response);
	}	

	//get DocInfo for remoteStorage
	@RequestMapping("/getDocRS.do")
	public void getDocRS(Integer reposId, String remoteDirectory, String path, String name,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)	{
		Log.info("\n*************** getDocRS ********************");
		Log.debug("getDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name);

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
			Doc doc = buildBasicDoc(null, null, null, "", path, name, null, 2, true, remoteDirectory, null, 0L, null);
			Doc localDoc = fsGetDoc(vRepos, doc);
			rt.setData(localDoc);
			writeJson(rt, response);			
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		//检查用户是否有文件读取权限
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		if(checkUseAccessRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			Log.debug("getDocRS() you have no access right on doc:" + doc.getDocId());
			writeJson(rt, response);	
			return;
		}
		
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
		
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == null || dbDoc.getType() == 0)
		{
			Log.docSysErrorLog("文件 " + doc.getPath() + doc.getName() + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		rt.setData(dbDoc);
		writeJson(rt, response);
	}
	
	@RequestMapping("/downloadDocRS.do")
	public void downloadDocRS(Integer reposId, String remoteDirectory, String path, String name,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)	throws Exception
	{
		Log.info("\n*************** downloadDocRS ********************");
		Log.debug("downloadDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null) == false)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		if(path == null || name == null)
		{
			Log.docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		path = new String(path.getBytes("ISO8859-1"),"UTF-8");	
		path = Base64Util.base64Decode(path);
		if(path == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		name = new String(name.getBytes("ISO8859-1"),"UTF-8");	
		name = Base64Util.base64Decode(name);
		if(name == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//Get SubDocList From Server Dir
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				Log.docSysErrorLog("服务器路径不能为空！", rt);
				writeJson(rt, response);			
				return;				
			}
			remoteDirectory = new String(remoteDirectory.getBytes("ISO8859-1"),"UTF-8");	
			remoteDirectory = Base64Util.base64Decode(remoteDirectory);
			if(remoteDirectory == null)
			{
				Log.docSysErrorLog("服务器路径解码失败！", rt);
				writeJson(rt, response);			
				return;
			}
			sendTargetToWebPage(remoteDirectory + path, name, remoteDirectory + path, rt, response, request,false, null);
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限下载文件
		ReposAccess reposAccess = authCodeMap.get(authCode).getReposAccess();
		if(checkUserDownloadRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
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
		
		downloadDocPrepare_FSM(repos, doc, reposAccess, false, rt);							
		
		//rt里保存了下载文件的信息
		String status = rt.getStatus();
		if(status.equals("ok") == false)
		{
			Log.debug("downloadDocRS downloadDocPrepare failed:" + rt.getMsgInfo());
			writeJson(rt, response);
			return;
		}
		
		//注意downloadDoc中的targetPath和targetName都是Base64加密的，所以必须先解密（下面的流程与downloadDoc相同）
		Doc downloadDoc = (Doc) rt.getData();
		String targetPath = downloadDoc.targetPath;
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			Log.docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String targetName = downloadDoc.targetName;	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			Log.docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		Log.debug("downloadDocRS targetPath:" + targetPath + " targetName:" + targetName);
		Integer deleteFlag = (Integer) rt.getMsgData();
		sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, deleteFlag, null);		
	}
	
	@RequestMapping("/getZipDocFileLink.do")
	public void getZipDocFileLink(Integer reposId, String path, String name,
			String rootPath, String rootName,
			Integer shareId,
			String urlStyle,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n*************** getZipDocFileLink ********************");		
		Log.debug("getZipDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, rootPath, rootName, null, null, true, localRootPath, localVRootPath, null, null);
		Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
		
		//build tmpDoc
		String tmpLocalRootPath = Path.getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
		File dir = new File(tmpLocalRootPath + path);
		if(dir.exists() == false)
		{
			dir.mkdirs();
		}
		Doc tmpDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, tmpLocalRootPath, null, null, null);
		
		checkAndExtractEntryFromCompressDoc(repos, tempRootDoc, tmpDoc);
		
		String authCode = addDocDownloadAuthCode();
		String fileLink = buildDownloadDocLink(tmpDoc, authCode, urlStyle, 0, rt);
		if(fileLink == null)
		{
			Log.debug("getZipDocFileLink() buildDocFileLink failed");
			return;
		}
			
		rt.setData(fileLink);
		writeJson(rt, response);
	}

	@RequestMapping("/getDocFileLink.do")
	public void getDocFileLink(Integer reposId, String path, String name, String commitId,
			Integer shareId,
			String urlStyle,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n*************** getDocFileLink ********************");		
		Log.debug("getDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId);

		//注意该接口支持name是空的的情况
		if(path == null)
		{
			path = "";
		}
		if(name == null)
		{
			name = "";
		}

		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		doc.setShareId(shareId);
		path = doc.getPath();
		name = doc.getName();
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//前置类型仓库，需要先将文件CheckOut出来
			if(isFSM(repos) == false)
			{
				remoteServerCheckOut(repos, doc, null, null, null, null, true, true, null);
			}
			
			Doc localDoc = fsGetDoc(repos, tmpDoc);
			if(localDoc.getType() != 1)
			{
				Log.docSysErrorLog("不是文件", rt);
				writeJson(rt, response);			
				return;
			}
		}
		else
		{
			Doc remoteDoc = null;
			if(isFSM(repos))
			{
				remoteDoc = verReposGetDoc(repos, doc, commitId);
			}
			else
			{
				remoteDoc = remoteServerGetDoc(repos, doc, commitId);					
			}
			
			if(remoteDoc == null)
			{
				Log.docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
				writeJson(rt, response);			
				return;
			}
			if(remoteDoc.getType() == 0)
			{
				Log.docSysErrorLog(name + " 不存在！", rt);
				writeJson(rt, response);			
				return;				
			}
			else if(remoteDoc.getType() == 2)
			{
				Log.docSysErrorLog(name + " 是目录！", rt);
				writeJson(rt, response);			
				return;				
			}
			
			//checkOut历史版本文件
			String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, true);
			File dir = new File(tempLocalRootPath + path);
			if(dir.exists() == false)
			{
				dir.mkdirs();
			}
			File file = new File(tempLocalRootPath + path + name);
			if(file.exists() == false)
			{
				if(isFSM(repos))
				{
					verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
				}
				else
				{
					remoteServerCheckOut(repos, doc, null, null, null, commitId, true, true, null);
				}
			}
			
			tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);	
			tmpDoc.setShareId(shareId);
		}
		
		String authCode = addDocDownloadAuthCode();
		String fileLink = buildDownloadDocLink(tmpDoc, authCode, urlStyle, 1, rt);
		if(fileLink == null)
		{
			Log.debug("getDocFileLink() buildDocFileLink failed");
			return;
		}
		
		rt.setData(fileLink);
		writeJson(rt, response);
	}

	/****************   lock a Doc ******************/
	@RequestMapping("/lockDoc.do")  //lock Doc主要用于用户锁定doc
	public void lockDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, Integer docType,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** lockDoc ****************");
		Log.debug("lockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == false)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				rt.setError("无效授权码");
				writeJson(rt, response);		
				return;
			}
			reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		}
		if(reposAccess == null)
		{
			Log.debug("lockDoc reposAccess is null");
			rt.setError("非法访问");
			writeJson(rt, response);		
			return;
		}
		
//		if(docId == null)
//		{
//			Log.docSysErrorLog("docId is null", rt);
//			writeJson(rt, response);			
//			return;
//		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
	
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		synchronized(syncLock)
		{
			boolean subDocCheckFlag = false;
			int lockDuration = 2*60*60*1000;	//文件编辑可以锁定两个小时
			if(lockType == DocLock.LOCK_TYPE_FORCE)	//If want to force lock, must check all subDocs not locked
			{
				subDocCheckFlag = true;
				lockDuration  =  60*60*1000; //强制锁定无法解锁，因此只能锁定一个小时
			}
				
			//Try to lock the Doc
			DocLock docLock = lockDoc(doc,lockType,lockDuration,reposAccess.getAccessUser(),rt,subDocCheckFlag); //24 Hours 24*60*60*1000 = 86400,000
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); //线程锁
				Log.debug("lockDoc() Failed to lock Doc: " + doc.getName());
				writeJson(rt, response);
				return;			
			}
			SyncLock.unlock(syncLock); //线程锁
		}
		
		Log.debug("lockDoc : " + doc.getName() + " success");
		rt.setData(doc);
		writeJson(rt, response);	
		
		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "锁定文件", "成功", repos, doc, null, "");	
	}
	
	/****************   SyncLock.unlock a Doc ******************/
	@RequestMapping("/unlockDoc.do")  //SyncLock.unlock Doc主要用于用户解锁doc
	public void unlockDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, Integer docType,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** unlockDoc ****************");
		Log.debug("unlockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == false)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				rt.setError("无效授权码");
				writeJson(rt, response);		
				return;
			}
			reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		}
		if(reposAccess == null)
		{
			Log.debug("lockDoc reposAccess is null");
			rt.setError("非法访问");
			writeJson(rt, response);		
			return;
		}
		
//		if(docId == null)
//		{
//			Log.docSysErrorLog("SyncLock.unlockDoc docId is null", rt);
//			writeJson(rt, response);			
//			return;
//		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
	
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		synchronized(syncLock)
		{
			//解锁不需要检查子目录的锁定，因为不会影响子目录
			if(checkDocLocked(doc, lockType, reposAccess.getAccessUser(), false, rt))
			{
				SyncLock.unlock(syncLock); //线程锁
				writeJson(rt, response);
				return;
			}				
			unlockDoc(doc, lockType, reposAccess.getAccessUser());
			SyncLock.unlock(syncLock); //线程锁
		}
		
		Log.debug("SyncLock.unlockDoc : " + doc.getName() + " success");
		rt.setData(doc);
		writeJson(rt, response);	

		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "解锁文件", "成功", repos, doc, null, "");	
	}
	
	/****************   get Document History (logList) ******************/
	@RequestMapping("/getDocHistory.do")
	public void getDocHistory(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer historyType,Integer maxLogNum, 
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getDocHistory ****************");
		Log.debug("getDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			Log.docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc inputDoc = doc;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			inputDoc = buildVDoc(doc);
		}		
		
		int num = 100;
		if(maxLogNum != null)
		{
			num = maxLogNum;
		}
		
		List<LogEntry> logList = null;
		if(isFSM(repos) || inputDoc.getIsRealDoc() == false)
		{
			logList = verReposGetHistory(repos, false, inputDoc, num);
		}
		else
		{
			logList = remoteServerGetHistory(repos, inputDoc, num);
		}
		
		rt.setData(logList);
		writeJson(rt, response);
	}

	/****************   get Document History Detail ******************/
	@RequestMapping("/getHistoryDetail.do")
	public void getHistoryDetail(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getHistoryDetail ****************");
		Log.debug("getHistoryDetail reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			Log.docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc inputDoc = doc;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			inputDoc = buildVDoc(doc);
		}

		List<ChangedItem> changedItemList = null;
		if(isFSM(repos) || historyType == 1)
		{
			changedItemList = verReposGetHistoryDetail(repos, false, inputDoc, commitId);
		}
		else
		{
			changedItemList = remoteServerGetHistoryDetail(repos, inputDoc, commitId);
		}
		
		if(changedItemList == null)
		{
			Log.debug("getHistoryDetail 该版本没有文件改动");
		}
		rt.setData(changedItemList);
		
		writeJson(rt, response);
	}

	/**************** download History Doc  *****************/
	@RequestMapping("/downloadHistoryDocPrepare.do")
	public void downloadHistoryDocPrepare(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			String entryPath,
			Integer downloadAll,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.info("\n************** downloadHistoryDocPrepare ****************");
		Log.debug("downloadHistoryDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId: " + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//get reposInfo to 
		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(path == null)
		{
			path = "";
		}
		
		if(name == null)
		{
			name = "";
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;
		}
		
		Doc doc = null;
		Doc vDoc = null;
		String targetName = name + "_" + commitId;
		HashMap<String, String> downloadList = null;
		List <Doc> successDocList = null;
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		
		if(isRealDoc)
		{
			if(entryPath == null)
			{
				doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			}
			else
			{
				doc = buildBasicDoc(reposId, null, null, reposPath, entryPath, "", null, null, isRealDoc, localRootPath, localVRootPath, null, null);
			}

			if(doc.getName().isEmpty())
			{
				targetName = repos.getName() + "_" + commitId;	
			}
			else
			{
				targetName = doc.getName() + "_" + commitId;							
			}
			
			if(downloadAll == null || downloadAll == 0)
			{
				downloadList = new HashMap<String,String>();
				buildDownloadList(repos, true, doc, commitId, downloadList);
				if(downloadList != null && downloadList.size() == 0)
				{
					Log.docSysErrorLog("当前版本文件 " + doc.getPath() + doc.getName() + " 未改动",rt);
					writeJson(rt, response);	
					return;
				}
			}
			
			if(isRealDoc)
			{
				if(isFSM(repos))
				{
					successDocList = verReposCheckOut(repos, false, doc, userTmpDir, targetName, commitId, true, true, downloadList) ;
				}
				else
				{
					successDocList = remoteServerCheckOut(repos, doc, userTmpDir, userTmpDir, targetName, commitId, true, true, downloadList) ;					
				}
				if(successDocList == null)
				{
					Log.docSysErrorLog("当前版本文件 " + doc.getPath() + doc.getName() + " 不存在",rt);
					Log.docSysDebugLog("verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
					writeJson(rt, response);	
					return;
				}
			}
		}
		else
		{
			doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localVRootPath, localVRootPath, null, null);
			
			if(entryPath == null)
			{
				vDoc = docConvert(doc, true);
			}
			else
			{
				vDoc = buildBasicDoc(reposId, docId, pid, reposPath, entryPath, "", null, null, isRealDoc, localVRootPath, localVRootPath, null, null);
			}
			
			if(vDoc.getName().isEmpty())
			{
				targetName = repos.getName() + "_备注_" + commitId;					
			}
			else
			{
				targetName = vDoc.getName() + "_" + commitId;
			}
			
			if(downloadAll == null || downloadAll == 0)
			{
				downloadList = new HashMap<String,String>();
				buildDownloadList(repos, false, vDoc, commitId, downloadList);
				if(downloadList != null && downloadList.size() == 0)
				{
					Log.docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 未改动",rt);
					writeJson(rt, response);	
					return;
				}
			}
			
			successDocList = verReposCheckOut(repos, false, vDoc, userTmpDir, targetName, commitId, true, true, downloadList);
			if(successDocList == null)
			{
				Log.docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 不存在",rt);
				Log.docSysDebugLog("verReposCheckOut Failed path:" + vDoc.getPath() + " name:" + vDoc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
				writeJson(rt, response);	
				return;
			}
		}
		
		Log.printObject("downloadHistoryDocPrepare checkOut successDocList:", successDocList);
				
		Log.debug("downloadHistoryDocPrepare targetPath:" + userTmpDir + " targetName:" + targetName);
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), userTmpDir, targetName, isRealDoc?1:0);	
		rt.setData(downloadDoc);
		rt.setMsgData(1);
		writeJson(rt, response);	
		
		addSystemLog(request, reposAccess.getAccessUser(), "downloadHistoryDocPrepare", "downloadHistoryDocPrepare", "下载历史文件", "成功", repos, doc, null, "历史版本:" + commitId);	
	}

	private void buildDownloadList(Repos repos, boolean isRealDoc, Doc doc, String commitId, HashMap<String, String> downloadList) 
	{
		//根据commitId获取ChangeItemsList
		List<ChangedItem> changedItemList = verReposGetHistoryDetail(repos, isRealDoc, doc, commitId);
		
		if(changedItemList == null)
		{
			Log.debug("buildDownloadList verReposGetHistoryDetail Failed");
			return;
		}
		
		String docEntryPath = doc.getPath() + doc.getName();
		//过滤掉不在doc目录下的ChangeItems
		for(int i=0; i< changedItemList.size(); i++)
		{
			ChangedItem changeItem = changedItemList.get(i);
			String changeItemEntryPath = changeItem.getEntryPath();
			if(changeItemEntryPath.contains(docEntryPath))
			{
				downloadList.put(changeItemEntryPath, changeItemEntryPath);
				Log.debug("buildDownloadList Add [" +changeItemEntryPath + "]");
			}
		}		
	}
	
	/****************   revert Document History ******************/	
	@RequestMapping("/revertDocHistory.do")
	public void revertDocHistory(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			String entryPath,
			Integer downloadAll,
			String commitMsg,
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** revertDocHistory ****************");
		Log.debug("revertDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);

		//如果entryPath非空则表示实际要还原的entry要以entryPath为准 
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			Log.docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		String commitUser = reposAccess.getAccessUser().getName();
		
		boolean isRealDoc = true;
		Doc doc = null;
		Doc vDoc = null;
		
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;			
		}
		
		if(isRealDoc)
		{
			if(entryPath == null)
			{
				doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			}
			else
			{
				//Remove the /
				char startChar = entryPath.charAt(0);
				if(startChar == '/')
				{
					entryPath = entryPath.substring(1);
				}
				doc = buildBasicDoc(reposId, null, null, reposPath, entryPath, "", null, null, isRealDoc, localRootPath, localVRootPath, null, null);
			}
		}
		else
		{
			//For vDoc the doc is for lock and SyncLock.unlock
			doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			if(entryPath == null)
			{
				vDoc = docConvert(doc, true);
			}
			else
			{
				vDoc = buildBasicDoc(reposId, docId, pid, reposPath, entryPath, "", null, null, isRealDoc, localVRootPath, localVRootPath, null, null);
			}
		}
		
		//Check Edit Right
		if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		//Check Add Right
		Doc curDoc = docSysGetDoc(repos, doc, false);
		if(curDoc == null || curDoc.getType() == 0)
		{
			Log.debug("revertDocHistory " + curDoc.getPath() + curDoc.getName() + " 不存在！");
			Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
			if(checkUserAddRight(repos,reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
						
		//lockDoc
		DocLock docLock = null;
		
		int lockType = isRealDoc? DocLock.LOCK_TYPE_FORCE : DocLock.LOCK_TYPE_VFORCE;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, lockType,  2*60*60*1000, reposAccess.getAccessUser(), rt, false);
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); //线程锁
				Log.docSysDebugLog("revertDocHistory() lockDoc " + doc.getName() + " Failed!", rt);
				writeJson(rt, response);
				return;
			}
			SyncLock.unlock(syncLock);
		}

		if(isRealDoc)
		{
			if(isFSM(repos) == false)
			{
				//前置类型仓库不需要判断本地是否有改动
				Log.debug("revertDocHistory reposId:" + reposId + " 前置仓库不需要检查本地是否有改动");
			}
			else
			{
				Doc localEntry = fsGetDoc(repos, doc);
				if(localEntry == null)
				{
					Log.docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取本地文件信息失败!",rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					return;				
				}
	
				Doc remoteEntry = verReposGetDoc(repos, doc, null);
				if(remoteEntry == null)
				{
					Log.docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取远程文件信息失败!",rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					return;				
				}
				
				Doc dbDoc = dbGetDoc(repos, doc, false);
				
				HashMap<Long, DocChange> localChanges = new HashMap<Long, DocChange>();
				HashMap<Long, DocChange> remoteChanges = new HashMap<Long, DocChange>();
				if(syncupScanForDoc_FSM(repos, doc, dbDoc, localEntry,remoteEntry, reposAccess.getAccessUser(), rt, remoteChanges, localChanges, 2, false) == false)
				{
					Log.docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 同步状态获取失败!",rt);
					Log.debug("revertDocHistory() syncupScanForDoc_FSM!");	
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					return;
				}
				
				if(localChanges.size() > 0)
				{
					//Log.docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 本地有改动!" + "</br></br>"+ localChangeInfo,rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());

					Log.debug("revertDocHistory() 本地有改动！");
					String localChangeInfo = buildChangeReminderInfo(localChanges);
					Log.docSysErrorLog(localChangeInfo, rt);
					writeJson(rt, response);
					return;
				}
				
				if(remoteChanges.size() > 0)
				{
					Log.debug("revertDocHistory() 远程有改动！");
					String remoteChangeInfo = buildChangeReminderInfo(remoteChanges);				
					Log.docSysErrorLog(remoteChangeInfo,rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					return;
				}
				
				if(localEntry.getType() != 0)
				{
					if(commitId.equals(remoteEntry.getRevision()))
					{
						Log.debug("revertDocHistory() commitId:" + commitId + " latestCommitId:" + remoteEntry.getRevision());
						Log.docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 已是最新版本!",rt);					
						unlockDoc(doc, lockType, reposAccess.getAccessUser());
						writeJson(rt, response);
						return;
					}
				}
			}	
			revertDocHistory(repos, doc, commitId, commitMsg, commitUser, reposAccess.getAccessUser(), rt, null);
		}	
		else
		{
			File localVDoc = new File(doc.getLocalVRootPath() + vDoc.getPath() + vDoc.getName());
			if(!vDoc.getName().isEmpty() && localVDoc.exists())
			{
				String latestCommitId = verReposGetLatestRevision(repos, false, vDoc);
				if(latestCommitId != null && latestCommitId.equals(commitId))
				{
					Log.debug("revertDocHistory() commitId:" + commitId + " latestCommitId:" + latestCommitId);
					Log.docSysErrorLog("恢复失败:" + vDoc.getPath() + vDoc.getName() + " 已是最新版本!",rt);					
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					return;				
				}
			}
			revertDocHistory(repos, vDoc, commitId, commitMsg, commitUser, reposAccess.getAccessUser(), rt, null);
		}
		
		unlockDoc(doc, lockType, reposAccess.getAccessUser());
		if(isRealDoc == true && isFSM(repos))
		{
			realTimeRemoteStoragePush(repos, doc, null, reposAccess, commitMsg, rt, "revertDocHistory");
			realTimeBackup(repos, doc, null, reposAccess, commitMsg, rt, "revertDocHistory");
		}
		
		writeJson(rt, response);
		
		addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "成功", repos, doc, null, "历史版本:" + commitId);	
	}
	
	/****************   updateReposTextSearchSetting ******************/
	@RequestMapping("/getReposTextSearchSetting.do")
	public void getReposTextSearchSetting(Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getReposTextSearchSetting ****************");
		Log.debug("getReposTextSearchSetting reposId:" + reposId + " path:" + path + " name:" + name);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

		//获取并检查用户权限
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, null);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		else
		{
			Integer access = docAuth.getAccess();
			Integer isAdmin = docAuth.getIsAdmin();
			if(access == null || isAdmin == null || isAdmin.equals(0) || access.equals(0))
			{
				rt.setError("您无权访问该文件，请联系管理员");
				writeJson(rt, response);
				return;
			}			
		}
		
		JSONObject textSearchSetting = getDocTextSearch(repos, doc);
		if(textSearchSetting == null)
		{
			rt.setError("获取全文搜索设置失败");			
		}
		else
		{
			rt.setData(textSearchSetting);
		}
		
		writeJson(rt, response);
	}

	/****************   updateReposTextSearchSetting ******************/
	@RequestMapping("/updateReposTextSearchSetting.do")
	public void updateReposTextSearchSetting(Integer reposId, String path, String name,
			Integer disableRealDocTextSearch, Integer disableVirtualDocTextSearch,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** updateReposTextSearchSetting ****************");
		Log.debug("updateReposTextSearchSetting reposId:" + reposId + " path:" + path + " name:" + name  + " disableRealDocTextSearch:" + disableRealDocTextSearch + " disableVirtualDocTextSearch:" + disableVirtualDocTextSearch);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

		//获取并检查用户权限
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, null);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		else
		{
			Integer access = docAuth.getAccess();
			Integer isAdmin = docAuth.getIsAdmin();
			if(access == null || isAdmin == null || isAdmin.equals(0) || access.equals(0))
			{
				rt.setError("您无权访问该文件，请联系管理员");
				writeJson(rt, response);
				return;
			}			
		}
		
		if(setDocTextSearch(repos, doc, disableRealDocTextSearch, disableVirtualDocTextSearch) == false)
		{
			rt.setError("设置全文搜索失败");			
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "updateReposTextSearchSetting", "updateReposTextSearchSetting", "设置全文搜索", "成功", repos, doc, null, "");	
		}
		writeJson(rt, response);
	}
	
	/****************   set  Doc Access PWD ******************/
	@RequestMapping("/setDocPwd.do")
	public void setDocPwd(Integer reposId, String path, String name,
			String pwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** setDocPwd ****************");
		Log.debug("setDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

		//获取并检查用户权限
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, null);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		else
		{
			Integer access = docAuth.getAccess();
			Integer isAdmin = docAuth.getIsAdmin();
			if(access == null || isAdmin == null || isAdmin.equals(0) || access.equals(0))
			{
				rt.setError("您无权访问该文件，请联系管理员");
				writeJson(rt, response);
				return;
			}			
		}
		
		//设置文件密码
		if(setDocPwd(repos, doc, pwd) == false)
		{
			rt.setError("您无权访问该文件，请联系管理员");			
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setDocPwd", "setDocPwd", "设置文件访问密码", "成功", repos, doc, null, "");	
		}
		writeJson(rt, response);
	}
	
	private boolean setDocPwd(Repos repos, Doc doc, String pwd) {
		
		String reposPwdPath = Path.getReposPwdPath(repos);
		String pwdFileName = doc.getDocId() + ".pwd";
		if(pwd == null || pwd.isEmpty())
		{
			return FileUtil.delFile(reposPwdPath + pwdFileName);
		}
		return FileUtil.saveDocContentToFile(pwd, reposPwdPath, pwdFileName, "UTF-8");
	}
	
	/****************   verify  Doc Access PWD ******************/
	@RequestMapping("/verifyDocPwd.do")
	public void verifyDocPwd(Integer reposId, String path, String name,
			String pwd,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** verifyDocPwd ****************");
		Log.debug("verifyDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		//密码验证的时候不检查是否进行了非法路径访问，因此path设置为null
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, null, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

		//设置文件密码
		if(verifyDocPwd(repos, doc, pwd) == false)
		{
			rt.setError("密码错误!");			
		}
		else
		{
			session.setAttribute("docPwd_"+reposId + "_" + doc.getDocId(), pwd);
		}
		writeJson(rt, response);
	}
	
	private boolean verifyDocPwd(Repos repos, Doc doc, String pwd) 
	{
		if(pwd == null)
		{
			return false;
		}
		
		String reposPwdPath = Path.getReposPwdPath(repos);
		String pwdFileName = doc.getDocId() + ".pwd";
		if(FileUtil.isFileExist(reposPwdPath + pwdFileName) == false)
		{
			return true;
		}
		
		String docPwd = FileUtil.readDocContentFromFile(reposPwdPath, pwdFileName, "UTF-8");
		
		if(docPwd == null || docPwd.isEmpty())
		{
			return true;
		}
		
		return pwd.equals(docPwd);
	}
	
	/*
	 * ***************   add a RemoteDocShare ****************
	 * 添加远程分享
	 * 根据请求的IP地址、userId, reposId、path、name、timestamp来创建一个唯一的分享ID，分享类型为远程
	 * 也许需要将RemoteDocShare和普通DocShare进行合并，增加授权码来进行控制
	*/
	@RequestMapping("/addRemoteDocShare.do")
	public void addRemoteDocShare(Integer reposId, String path, String name, Integer userId,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn, Integer downloadEn, Integer heritable,
			String sharePwd,
			Long shareHours,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** addRemoteDocShare ****************");
		Log.debug("addRemoteDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		
		//生成分享信息
		DocShare docShare = new DocShare();
		docShare.setVid(reposId);
		docShare.setPath(path);
		docShare.setName(name);
		docShare.setSharedBy(userId);
		docShare.setSharePwd(sharePwd);

		DocAuth docAuth = new DocAuth();
		docAuth.setIsAdmin(isAdmin);
		docAuth.setAccess(access);
		docAuth.setDownloadEn(downloadEn);
		docAuth.setAddEn(addEn);
		docAuth.setDeleteEn(deleteEn);
		docAuth.setEditEn(editEn);
		docAuth.setHeritable(heritable);
		String shareAuth = JSON.toJSONString(docAuth);
		docShare.setShareAuth(shareAuth);
		if(shareHours == null)
		{
			shareHours = (long) 24; // one Day
		}	
		docShare.setValidHours(shareHours);
		long curTime = new Date().getTime();
		long expireTime = curTime + shareHours * 60 * 60 * 1000;
		docShare.setExpireTime(expireTime);	

		String requestIP = getRequestIpAddress(request);
		docShare.setRequestIP(requestIP);

		String proxyIP = IPUtil.getIpAddress();
		docShare.setProxyIP(proxyIP);		
		
		Integer shareId = buildShareId(docShare);
		docShare.setShareId(shareId);
		
		if(reposService.addDocShare(docShare) == 0)
		{
			Log.docSysErrorLog("创建文件分享失败！", rt);
		}
		else
		{
			rt.setData(docShare);
		}
		writeJson(rt, response);
		
		//检查远程分享监听线程是否存在？如果不存在则启动远程分享监听进程，等待分享服务器的连接请求
		if(isProxyThreadRuning(proxyThread) == false)
		{
			proxyThread = new ProxyThread();
		}
	}
	
	private boolean isProxyThreadRuning(ProxyThread proxyThread) {
		//远程分享代理默认并不打开
		//在收到第一个远程代理请求或者在启动时发现系统中存在有效的远程代理请求时，启动监听线程来等待分享服务器的连接
		if(proxyThread == null)
		{
			return false;
		}
		return true;
	}
	
	/****************   add a DocShare ******************/
	@RequestMapping("/getDocShareList.do")
	public void getDocShareList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getDocShareList ****************");
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		DocShare qDocShare = new DocShare();
		qDocShare.setSharedBy(reposAccess.getAccessUserId());
		List<DocShare> list = reposService.getDocShareList(qDocShare);
		if(list != null && list.size() > 0)
		{
			String IpAddress = IPUtil.getIpAddress();
			HashMap<Integer, Repos> ReposInfoHashMap = getReposInfoHashMap();
			for(int i=0; i< list.size(); i++)
			{
				DocShare docShare = list.get(i);
				docShare.setServerIp(IpAddress);
				Long validHours = getValidHours(docShare.getExpireTime());
				docShare.setValidHours(validHours);
				
				Repos repos = ReposInfoHashMap.get(docShare.getVid());
				//Log.printObject("repos",repos);
				if(repos != null)
				{
					docShare.setReposName(repos.getName());
				}
				else
				{
					docShare.setReposName("未知仓库");					
				}
			}
		}
		rt.setData(list);
		writeJson(rt, response);
	}

	private HashMap<Integer, Repos> getReposInfoHashMap() {
		//convert to HashMap
		HashMap<Integer, Repos> hashMap = new HashMap<Integer, Repos>();

		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0; i< reposList.size(); i++)
		{
			Repos repos = reposList.get(i);
			//Log.printObject("repos",repos);
			hashMap.put(repos.getId(), repos);
		}
		return hashMap;
	}

	/****************   add a DocShare ******************/
	@RequestMapping("/addDocShare.do")
	public void addDocShare(Integer reposId, String path, String name,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn, Integer downloadEn, Integer heritable,
			String sharePwd,
			Long shareHours,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** addDocShare ****************");		
		Log.debug("addDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getRepos(reposId);
		if(repos == null)
		{
			Log.docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		DocShare docShare = new DocShare();
		docShare.setVid(doc.getVid());
		docShare.setReposName(repos.getName());
		docShare.setDocId(doc.getDocId());
		docShare.setPath(doc.getPath());
		docShare.setName(doc.getName());
		docShare.setSharedBy(reposAccess.getAccessUser().getId());
		docShare.setSharePwd(sharePwd);

		DocAuth docAuth = new DocAuth();
		docAuth.setIsAdmin(isAdmin);
		docAuth.setAccess(access);
		docAuth.setAddEn(addEn);
		docAuth.setDeleteEn(deleteEn);
		docAuth.setEditEn(editEn);
		docAuth.setDownloadEn(downloadEn);
		docAuth.setHeritable(heritable);
		String shareAuth = JSON.toJSONString(docAuth);
		docShare.setShareAuth(shareAuth);
		if(shareHours == null)
		{
			shareHours = (long) 24; // one Day
		}	
		docShare.setValidHours(shareHours);
		long curTime = new Date().getTime();
		long expireTime = curTime + shareHours * 60 * 60 * 1000;
		docShare.setExpireTime(expireTime);	
		
		Integer shareId = buildShareId(docShare);
		docShare.setShareId(shareId);
		
		String IpAddress = IPUtil.getIpAddress();

		String shareLink = null;
		if(reposService.addDocShare(docShare) == 0)
		{
			Log.docSysErrorLog("创建文件分享失败！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", "失败", repos, doc, null, "");	
		}
		else
		{
			shareLink = buildShareLink(request, IpAddress, reposId, shareId);
			docShare.shareLink = shareLink;
			rt.setData(docShare);
			rt.setDataEx(IpAddress);
			
			addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", "成功", repos, doc, null, "");	
		}
		writeJson(rt, response);
		
		if(shareLink != null)
		{
			sendDocShareNotify(docShare, reposAccess.getAccessUser());
		}
	}

	private void sendDocShareNotify(DocShare docShare, User createUser) {
		
		User qUser = new User();
		qUser.setName(createUser.getName());
		qUser.setId(createUser.getId());
		List<User> uList = userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			Log.info("sendDocShareNotify()", "用户" + createUser.getName() + " 不存在");
			return;
		}

		User emailToUser = uList.get(0);
		String email = emailToUser.getEmail();
		if(email == null || email.isEmpty())
		{
			Log.info("sendDocShareNotify()", "用户邮箱未设置");
			return;
		}		
		
		String content = 
				"尊敬的MxsDoc用户："
				+ "<br>"
				+ "<br>"
				+ "[" + createUser.getName() + "]创建了文件分享！"
				+ "<br>"
				+ "<br>"
				+ "<a href='" + docShare.shareLink + "' "
				+ "style='width:50px; background: #0287c9; border: 10px solid #0287c9; border-left-width:36px; border-right-width:36px; padding: 0 10px; color:#ffffff!important; font-family: Verdana; font-size: 12px; text-align: center; text-decoration: none!important; text-decoration:none; text-transform:uppercase; display: block; font-weight: bold;' class='prods-left-in-cart-button-a' rel='noopener' target='_blank'>"
				+ "<font color=\"#FFFFFF\">点击链接访问</font></a>"
				+ "<br>"
				+ "<br>"
				+ "如有任何问题，请联系 "
				+ "<a href='mailto:helper@gofreeteam.com' style='text-decoration: none!important; text-decoration:none; color: #0064c8;' rel='noopener' target='_blank'>helper@gofreeteam.com</a>"
				+ "<br>"
				+ "<br>"
				+ "谢谢,"
				+ "<br>"
				+ "<strong>MxsDoc团队</strong>"
				+ "<br>"
				+ "<a href='dw.gofreeteam.com' style='text-decoration: none!important; text-decoration:none; color: #0064c8;'>dw.gofreeteam.com</a>";

		ReturnAjax rt = new ReturnAjax();
		emailService.sendEmail(rt, email, content);
	}
	
	private String buildShareLink(HttpServletRequest request, String ipAddress, Integer reposId, Integer shareId) {
		URLInfo urlInfo = getUrlInfoFromRequest(request);
		String host = urlInfo.host;
	 	if(host.equals("localhost") && ipAddress != null && !ipAddress.isEmpty())
	 	{
	 		host = 	ipAddress;
	 	}
	 	
	 	String link = null;
	 	if(urlInfo.port == null || urlInfo.port.isEmpty())
	 	{
	 		link = urlInfo.prefix + host + "/DocSystem/web/project.html?vid="+ reposId + "&shareId=" + shareId;        			
	 	}
	 	else
	 	{
	 		link = urlInfo.prefix + host + ":" + urlInfo.port + "/DocSystem/web/project.html?vid="+ reposId + "&shareId=" + shareId;        			
	 	}
	 	return link;
	}
	
	private URLInfo getUrlInfoFromRequest(HttpServletRequest request) {
		String url = getUrlFromRequest(request);
		Log.info("getUrlInfoFromRequest()", "url:" + url);		
		URLInfo urlInfo =getUrlInfoFromUrl(url);
		return urlInfo;
	}

	private String getUrlFromRequest(HttpServletRequest request) {
        String url = request.getRequestURL().toString();
        return url;
	}

	private Integer buildShareId(DocShare docShare) {
		return docShare.hashCode();
	}
	
	/****************   update a DocShare ******************/
	@RequestMapping("/updateDocShare.do")
	public void updateDocShare(Integer shareId,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn, Integer downloadEn, Integer heritable,
			String sharePwd,
			Long shareHours,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** updateDocShare ****************");		
		Log.debug("updateDocShare() shareId:" + shareId + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			Log.docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}

		DocAuth docAuth = new DocAuth();
		docAuth.setIsAdmin(isAdmin);
		docAuth.setAccess(access);
		docAuth.setAddEn(addEn);
		docAuth.setDeleteEn(deleteEn);
		docAuth.setEditEn(editEn);
		docAuth.setDownloadEn(downloadEn);
		docAuth.setHeritable(heritable);
		String shareAuth = JSON.toJSONString(docAuth);
				
		docShare.setShareId(shareId);
		docShare.setShareAuth(shareAuth);
		if(shareHours == null)
		{
			shareHours = (long) 24;	//默认分享时间为一天
		}
		docShare.setValidHours(shareHours);
		long curTime = new Date().getTime();
		long expireTime = curTime + shareHours * 60 * 60 * 1000;
		docShare.setExpireTime(expireTime);	
		docShare.setSharePwd(sharePwd);
				
		if(reposService.updateDocShare(docShare) == 0)
		{
			Log.docSysErrorLog("更新文件分享失败！", rt);
		}
		else
		{
			rt.setData(docShare);
		}
		writeJson(rt, response);
		
		addSystemLog(request, reposAccess.getAccessUser(), "updateDocShare", "updateDocShare", "修改文件分享", "成功", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());	
	}
	
	/****************   delete a DocShare ******************/
	@RequestMapping("/deleteDocShare.do")
	public void deleteDocShare(Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** deleteDocShare ****************");		
		Log.debug("deleteDocShare() shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(shareId == null)
		{
			Log.docSysErrorLog("文件分享信息不能为空！", rt);
			writeJson(rt, response);			
			return;				
		}
		
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			Log.docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		DocShare qDocShare = new DocShare();
		qDocShare.setShareId(shareId);				
		if(reposService.deleteDocShare(qDocShare) == 0)
		{
			Log.docSysErrorLog("删除文件分享失败！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDocShare", "deleteDocShare", "删除文件分享", "失败", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());	
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDocShare", "deleteDocShare", "删除文件分享", "成功", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());	
		}
		writeJson(rt, response);
	}
	
	/****************   verifyDocSharePwd ******************/
	@RequestMapping("/verifyDocSharePwd.do")
	public void verifyDocSharePwd(Integer shareId, String sharePwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** verifyDocSharePwd ****************");		
		Log.debug("getDocShare shareId:" + shareId + " sharePwd:" + sharePwd);
		
		ReturnAjax rt = new ReturnAjax();
			
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			Log.docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String pwd = docShare.getSharePwd();
		if(pwd != null && !pwd.isEmpty())
		{
			if(sharePwd == null || sharePwd.isEmpty() || !sharePwd.equals(pwd))
			{
				Log.docSysErrorLog("密码错误！", rt);
				writeJson(rt, response);
				return;
			}
			else
			{
				//save sharePwd into session
				session.setAttribute("sharePwd_"+shareId, sharePwd);
			}
		}
		
		Long validHours = getValidHours(docShare.getExpireTime());
		docShare.setValidHours(validHours);
		rt.setData(docShare);
		writeJson(rt, response);
	}
	
	/****************   get DocShare ******************/
	@RequestMapping("/getDocShare.do")
	public void getDocShare(Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getDocShare ****************");				
		Log.debug("getDocShare shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
			
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			Log.docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String pwd = docShare.getSharePwd();
		if(pwd != null && !pwd.isEmpty())
		{
			//Do check the sharePwd
			String sharePwd = (String) session.getAttribute("sharePwd_" + shareId);
			if(sharePwd == null || sharePwd.isEmpty() || !sharePwd.equals(pwd))
			{
				Log.docSysErrorLog("分享密码错误！", rt);
				rt.setMsgData("1"); //分享密码错误或未提供
				writeJson(rt, response);
				return;
			}
		}
		
		Long validHours = getValidHours(docShare.getExpireTime());
		docShare.setValidHours(validHours);
		rt.setData(docShare);
		writeJson(rt, response);
	}

	private Long getValidHours(Long expireTime) {
		if(expireTime == null)
		{
			return null;
		}
		
		long curTime = new Date().getTime();
		if(expireTime < curTime)
		{
			return 0L;
		}
		
		long validHours = (expireTime - curTime)/3600000; 
		return validHours;
	}

	/* 文件搜索与排序 
	 * reposId: 在指定的仓库下搜索，如果为空表示搜索所有可见仓库下的文件
	 * pDocId: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对默认类型仓库有效）
	 * path: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对文件类型仓库有效）
	 * searchWord: 支持文件名、文件内容和备注搜索，关键字可以支持空格分开 
	*/
	@RequestMapping("/searchDoc.do")
	public void searchDoc(Integer reposId,Integer pid, String path, 
			String searchWord,String sort,
			Integer pageIndex, Integer pageSize,
			Integer shareId,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.info("\n************** searchDoc ****************");				
		Log.debug("searchDoc reposId:" + reposId + " pid:" + pid + " path:" + path + " searchWord:" + searchWord + " sort:" + sort+ " shareId:" + shareId + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, null, null, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(path == null)
		{
			path = reposAccess.getRootDocPath() + reposAccess.getRootDocName();
		}

		List<Repos> reposList = new ArrayList<Repos>();
		if(reposId == null || reposId == -1)
		{
			//Do search all AccessableRepos
			reposList = getAccessableReposList(reposAccess.getAccessUser().getId());
			pid = 0;
			path = "";
		}
		else
		{
			Repos repos = getRepos(reposId);
			if(repos != null)
			{
				reposList.add(repos);
			}
		}
		
		if(reposList == null)
		{
			Log.debug("searchDoc reposList is null");
			writeJson(rt, response);			
			return;	
		}
		
		List<Doc> searchResult = new ArrayList<Doc>();
		for(int i=0; i< reposList.size(); i++)
		{
			Repos queryRepos = reposList.get(i);
			List<Doc> result =  searchInRepos(queryRepos, pid, path, searchWord, sort);
			if(result != null && result.size() > 0)
			{
				Log.debug("searchDoc() 共 ["+ result.size() +"]结果 hits with " + searchWord + " in reposId:" + queryRepos.getId() + " reposName:" + queryRepos.getName());
				searchResult.addAll(result);
			}
		}
		//对搜索结果进行统一排序
		Collections.sort(searchResult);
		
		Integer total = searchResult.size();
		rt.setData(searchResult);
		rt.setDataEx(total);
		writeJson(rt, response);
	}
	
	private List<Doc> searchInRepos(Repos repos, Integer pDocId, String path, String searchWord, String sort) 
	{	
		if(searchWord == null || searchWord.isEmpty())
		{
			return null;
		}

		List<QueryCondition> preConditions = new ArrayList<QueryCondition>();
		HashMap<String, HitDoc> searchResult = new HashMap<String, HitDoc>();
		List<Doc> result = null;
		
		//搜索字符预处理
		searchWord = searchWord.replace('\\','/');
		
		//文件直接直接命中
		Doc hitDoc = getHitDoc(repos, path, searchWord);		
		
		//拆分字符串中的路径
		String[] temp = new String[2]; 
		Path.seperatePathAndName(searchWord, temp);
		String pathSuffix = temp[0];
		searchWord = temp[1];	
		
		Log.debug("searchInRepos() reposId:" + repos.getId() + " reposName:" + repos.getName() + " pathSuffix:" + pathSuffix + " searchWord:" + searchWord);
		
		if(pathSuffix != null && !pathSuffix.isEmpty())
		{
			QueryCondition pathSuffixCondition = new QueryCondition();
			pathSuffixCondition.setField("path");
			pathSuffixCondition.setValue(pathSuffix);
			pathSuffixCondition.setQueryType(QueryCondition.SEARCH_TYPE_Wildcard);
			preConditions.add(pathSuffixCondition);			
		}
		
		luceneSearch(repos, preConditions, searchWord, path, searchResult , 7);	//Search RDocName RDoc and VDoc
		result = convertSearchResultToDocList(repos, searchResult);	
		if(hitDoc == null || hitDoc.getType() == null || hitDoc.getType() == 0)
		{
			return result;
		}
		
		if(result != null)
		{
			result.add(0,hitDoc);
			return result;
		}
		
		//hitDoc存在、搜索结果为空
		result = new ArrayList<Doc>();
		result.add(hitDoc);
		return result;
	}

	//通过路径搜索的话，只查找本地的目录，避免远程仓库链接不上或者时间太长
	private Doc getHitDoc(Repos repos, String path, String searchWord) {
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		String docPath = searchWord + "";
		
		int firstSeperator = docPath.indexOf('/');
		if(firstSeperator > 0)	//相对路径查找
		{
			if(path != null)
			{
				docPath = path + "/" + docPath;
			}
			docPath = docPath.replace('\\','/');
		}
		Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, docPath, "", null, null, true,localRootPath,localVRootPath, 0L, "");
		Doc hitDoc = fsGetDoc(repos, doc);
		return hitDoc;
	}

	private List<Doc> convertSearchResultToDocList(Repos repos, HashMap<String, HitDoc> searchResult) 
	{
		List<Doc> docList = new ArrayList<Doc>();
		for(HitDoc hitDoc: searchResult.values())
        {
      	    Doc doc = hitDoc.getDoc();
      	    doc.setReposName(repos.getName());
      	    doc.setHitType(hitDoc.getHitType());      	    
      	    docList.add(doc);
		}
		
		//读取排序前十文件的内容
		int numOfContentShow = 10;
		int size = docList.size() > numOfContentShow? numOfContentShow : docList.size();
		for(int i=0; i <size; i++)
		{
			Doc doc = docList.get(i);
			
      	    //根据hitType决定是否要取出文件内容或文件备注
      	    int hitType = doc.getHitType();
    		Log.debug("convertSearchResultToDocList() " + doc.getName() + " hitType:" + doc.getHitType());	

      	    String hitText = "";
      	    if((hitType & SEARCH_MASK[1]) > 0) //hit on 文件内容
      	    {
      	    	hitText = getDocContent(repos, doc, 0, 120, null);
      	    	hitText = Base64Util.base64Encode(hitText);
      	    	Log.debug("convertSearchResultToDocList() " + doc.getName() + " hitText:" + hitText);	
      	    }
      	    else if((hitType & SEARCH_MASK[2]) > 0) //hit on 文件备注
      	    {
      	    	hitText = readVirtualDocContent(repos, doc, 0, 120);
      	    	hitText = Base64Util.base64Encode(hitText);
     	    	//hitText = removeSpecialJsonChars(hitText);
      	    	Log.debug("convertSearchResultToDocList() " + doc.getName() + " hitText:" + hitText);	
      	    }
  	    	doc.setContent(hitText);
		}
		
		return docList;
	}
	
	/**
     * 去除字符串中所包含的空格（包括:空格(全角，半角)、制表符、换页符等）
     * @param s
     * @return
     */
    public static String removeAllBlank(String s){
        String result = "";
        if(null!=s && !"".equals(s)){
            result = s.replaceAll("[　*| *| *|//s*]*", "");
        }
        return result;
    }

    /**
     * 去除字符串中头部和尾部所包含的空格（包括:空格(全角，半角)、制表符、换页符等）
     * @param s
     * @return
     */
    public static String trim(String s){
        String result = "";
        if(null!=s && !"".equals(s)){
            result = s.replaceAll("^[　*| *| *|//s*]*", "").replaceAll("[　*| *| *|//s*]*$", "");
        }
        return result;
    }

	@SuppressWarnings("unused")
	private void databaseSearch(Repos repos, Integer pDocId, String searchWord, String path, HashMap<String, HitDoc> searchResult) 
	{
		String [] keyWords = searchWord.split(" ");
		
		boolean enablePathFilter = true;
        if(path == null || path.isEmpty())
        {
        	enablePathFilter = false;
        }

		for(int i=0; i< keyWords.length; i++)
		{
			String searchStr = keyWords[i];
			Log.debug("databaseSearch() searchStr:" + searchStr);
			
			if(!searchStr.isEmpty())
			{
				HashMap<String, Object> params = new HashMap<String, Object>();
				params.put("reposId", repos.getId());
				params.put("pDocId", pDocId);
				params.put("name", keyWords[0]);
				List<Doc> list = reposService.queryDocList(params);
		        for (int j = 0; j < list.size(); j++) 
		        {
		            Doc doc = list.get(j);
		            if(enablePathFilter)
		            {
		            	String docParentPath = doc.getPath();
		            	if(docParentPath == null || docParentPath.isEmpty())
		            	{
		            		continue;
		            	}
		            	else if(!docParentPath.contains(path))
		            	{
		            		continue;
		            	}
		            }
		            HitDoc hitDoc = BuildHitDocFromDoc(doc); 
		            HitDoc.AddHitDocToSearchResult(searchResult, hitDoc, searchStr, 3, SEARCH_MASK[0]); //文件名
		        	Log.printObject("databaseSearch() hitDoc:", hitDoc);
		        }
			}	
		}
	}

	private HitDoc BuildHitDocFromDoc(Doc doc) {
    	//Set Doc Path
    	String docPath = doc.getPath() + doc.getName();
    			
    	//Set HitDoc
    	HitDoc hitDoc = new HitDoc();
    	hitDoc.setDoc(doc);
    	hitDoc.setDocPath(docPath);
    	
    	return hitDoc;
	}

	private static final int[] SEARCH_MASK = { 0x00000001, 0x00000002, 0x00000004};	//DocName RDOC VDOC
	private boolean luceneSearch(Repos repos, List<QueryCondition> preConditions, String searchWord, String path, HashMap<String, HitDoc> searchResult, int searchMask) 
	{
		//文件名通配符搜索（带空格）
		if((searchMask & SEARCH_MASK[0]) > 0)
		{
			Log.debug("luceneSearch() 文件名通配符搜索（带空格）:" + searchWord);
			LuceneUtil2.search(repos, preConditions, "nameForSearch", searchWord.toLowerCase(), path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Wildcard, 100, SEARCH_MASK[0]); 	//Search By DocName
			Log.debug("luceneSearch() 文件名通配符搜索（带空格）:" + searchWord + " count:" + searchResult.size());
		}
		
		//空格是或条件
		String [] keyWords = searchWord.split(" ");		
		for(int i=0; i< keyWords.length; i++)
		{
			String searchStr = keyWords[i];
			if(!searchStr.isEmpty())
			{
				if((searchMask & SEARCH_MASK[0]) > 0)
				{
					//0x00000001; //文件内容
					//文件名通配符搜索（不切词搜索）
					Log.debug("luceneSearch() 文件名通配符搜索（不带空格）:" + searchStr);
					LuceneUtil2.search(repos, preConditions, "nameForSearch", searchStr.toLowerCase(), path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Wildcard, 1, SEARCH_MASK[0]);	//Search By FileName
					Log.debug("luceneSearch() 文件名通配符搜索（不带空格）:" + searchStr + " count:" + searchResult.size());

					//文件名智能搜索（切词搜索）
					Log.debug("luceneSearch() 文件名智能搜索:" + searchStr);
					LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Term, 1, SEARCH_MASK[0]);	//Search By FileName
					Log.debug("luceneSearch() 文件名智能搜索:" + searchStr + " count:" + searchResult.size());
				}
				if((searchMask & SEARCH_MASK[1]) > 0)
				{
					//0x00000002; //文件内容搜索
					Log.debug("luceneSearch() 文件内容智能搜索:" + searchStr);
					//Search By FileContent
					boolean ret = LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_R_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[1]);
					if(ret == false  ||  searchResult.size() == 0)
					{
						LuceneUtil2.smartSearchEx(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_R_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[1]);
					}
					
					Log.debug("luceneSearch() 文件内容智能搜索:" + searchStr + " count:" + searchResult.size());
				}
				if((searchMask & SEARCH_MASK[2]) > 0)
				{	
					//0x00000004; //文件备注搜索
					Log.debug("luceneSearch() 文件备注智能搜索:" + searchStr);
					boolean ret = LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_V_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[2]);
					if(ret == false ||  searchResult.size() == 0)
					{
						LuceneUtil2.smartSearchEx(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_V_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[2]);						
					}
					Log.debug("luceneSearch() 文件备注智能搜索:" + searchStr + " count:" + searchResult.size());
				}
			}
		}
		
		return true;
	}
	
	/****************   get Zip InitMenu ******************/
	@RequestMapping("/getZipInitMenu.do")
	public void getZipInitMenu(Integer reposId, String docPath, String docName, //zip File Info
			String path, String name,	//relative path in zipFile
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("\n************** getZipInitMenu ****************");				
		Log.debug("getZipInitMenu reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
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
				
		List <Doc> docList = new ArrayList<Doc>();
		
		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		docList.add(rootDoc);
		
		//decrypt rootZipDoc
		Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
		
		List <Doc> subDocList = null;
		subDocList = getZipSubDocList(repos, tempRootDoc, tempRootDoc.getPath(), tempRootDoc.getName(), rt);
		if(subDocList != null)
		{
			docList.addAll(subDocList);
		}	
		rt.setData(docList);	
		writeJson(rt, response);
	}

	/****************   get Zip SubDocList ******************/
	@RequestMapping("/getZipSubDocList.do")
	public void getZipSubDocList(Integer reposId, String docPath, String docName, //zip File Info
			String path, String name,	//relative path in zipFile
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.debug("\n ******* getZipSubDocList ******");
		Log.debug("getZipSubDocList reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
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
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
		
		List <Doc> subDocList = null;
		if(FileUtil.isCompressFile(name) == false)
		{
			String relativePath = getZipRelativePath(path, rootDoc.getPath() + rootDoc.getName() + "/");
			Log.debug("getZipSubDocList relativePath: " + relativePath);
			subDocList = getZipSubDocList(repos, tempRootDoc, tempRootDoc.getPath(), tempRootDoc.getName(), rt);
		}
		else
		{
			//Build ZipDoc Info
			Doc zipDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, null, null, null, null);
			if(zipDoc.getDocId().equals(rootDoc.getDocId()))
			{
				zipDoc = tempRootDoc;
			}
			else
			{
				//检查zipDoc是否已存在并解压（如果是rootDoc不需要解压，否则需要解压）
				String tmpLocalRootPath = Path.getReposTmpPathForDoc(repos, zipDoc);	
				zipDoc.setLocalRootPath(tmpLocalRootPath);
				checkAndExtractEntryFromCompressDoc(repos, tempRootDoc, zipDoc);
			}	
			subDocList = getZipSubDocList(repos, zipDoc, path, name, rt);
		}	
		
		if(subDocList == null)
		{
			rt.setData("");
		}
		else
		{
			rt.setData(subDocList);	
		}
		writeJson(rt, response);
	}

	private List<Doc> getZipSubDocList(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) 
	{
		if(name != null && !name.equals(rootDoc.getName()))
		{
			Log.debug("getZipSubDocList() 目前不支持对压缩文件的子目录的文件列表");
			return null;
		}
		
		String compressFileType = FileUtil.getCompressFileType(rootDoc.getName());
		if(compressFileType == null)
		{
			Log.debug("getZipSubDocList() " + rootDoc.getName() + " 不是压缩文件！");
			return null;
		}
		
		switch(compressFileType)
		{
		case "zip":
		case "war":
			//return getSubDocListForZip(repos, rootDoc, path, name, rt);
		case "7z":
			//return getSubDocListFor7z(repos, rootDoc, path, name, rt);			
		case "rar":
			return getSubDocListForCompressFile(repos, rootDoc, path, name, rt);			
		case "tar":
			return getSubDocListForTar(repos, rootDoc, path, name, rt);	
		case "tgz":
		case "tar.gz":
			return getSubDocListForTgz(repos, rootDoc, path, name, rt);			
		case "txz":
		case "tar.xz":
			return getSubDocListForTxz(repos, rootDoc, path, name, rt);			
		case "tbz2":
		case "tar.bz2":
			return getSubDocListForTarBz2(repos, rootDoc, path, name, rt);						
		case "gz":
			return getSubDocListForGz(repos, rootDoc, path, name, rt);						
		case "xz":
			return getSubDocListForXz(repos, rootDoc, path, name, rt);	
		case "bz2":
			return getSubDocListForBz2(repos, rootDoc, path, name, rt);	
		}
		return null;
	}
	
	//使用SevenZip方式（支持多种格式）
	private List<Doc> getSubDocListForCompressFile(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() zipFilePath:" + zipFilePath);
		
        String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";

        List <Doc> subDocList = new ArrayList<Doc>();
        RandomAccessFile randomAccessFile = null;
        IInArchive inArchive = null;
        try {
            randomAccessFile = new RandomAccessFile(zipFilePath, "r");
            inArchive = SevenZip.openInArchive(null, // autodetect archive type
                    new RandomAccessFileInStream(randomAccessFile));

            // Getting simple interface of the archive inArchive
            ISimpleInArchive simpleInArchive = inArchive.getSimpleInterface();
            
            for (ISimpleInArchiveItem entry : simpleInArchive.getArchiveItems()) {
               //Log.debug(String.format("%9s | %9s | %s", // 
               //         entry.getSize(), 
               //         entry.getPackedSize(), 
               //         entry.getPath()));
               String subDocPath = rootPath + entry.getPath().replace("\\", "/");
               Doc subDoc = buildBasicDocFromCompressEntry(rootDoc, subDocPath, entry);
               subDocList.add(subDoc);
            }
        } catch (Exception e) {
            Log.error("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error occurs");
            Log.error(e);
        } finally {
            if (inArchive != null) {
                try {
                    inArchive.close();
                } catch (SevenZipException e) {
                    Log.error("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error closing archive");
                    Log.error(e);
                }
            }
            if (randomAccessFile != null) {
                try {
                    randomAccessFile.close();
                } catch (IOException e) {
                    Log.error("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error closing file");
                    Log.error(e);
                }
            }
        }
		return subDocList;
	}

	private Doc buildBasicDocFromCompressEntry(Doc rootDoc, String docPath, ISimpleInArchiveItem entry) throws SevenZipException {
		Doc subDoc = null;
		if (entry.isFolder()) 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
		} 
		else 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			if(FileUtil.isCompressFile(subDoc.getName()))
			{
				subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
			}
		}
		return subDoc;
	}

	//Unrar解压Rar5存在缺陷
	@SuppressWarnings({ "unused", "deprecation" })
	private List<Doc> getSubDocListForRar(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForRar() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForRar() zipFilePath:" + zipFilePath);
		
        String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        
        Archive archive = null;
        OutputStream outputStream = null;
        List <Doc> subDocList = new ArrayList<Doc>();
        try {
            archive = new Archive(new FileInputStream(file));
            FileHeader entry;
            while( (entry = archive.nextFileHeader()) != null){
            	String subDocPath = rootPath + entry.getFileNameW().replace("\\", "/");
            	Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocList.add(subDoc);
            }
        } catch (Exception e) {
            Log.error(e);
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForBz2(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForBz2() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForBz2() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(FileUtil.isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForXz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForXz() path:" + path + " name:" + name);
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForXz() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(FileUtil.isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForGz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForGz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForGz() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(FileUtil.isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForTarBz2(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForTarBz2() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForTarBz2() zipFilePath:" + zipFilePath);
		
		String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        List <Doc> subDocList = new ArrayList<Doc>();
		HashMap<Long, Doc> subDocHashMap = new HashMap<Long, Doc>();
		
		FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;
        TarInputStream tis = null;
        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);
            tis = new TarInputStream(bis, 1024 * 2);

            TarEntry entry;
            while((entry = tis.getNextEntry()) != null){
				String subDocPath = rootPath + entry.getName();
				Log.debug("subDoc: " + subDocPath);
            	Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				subDocList.add(subDoc);
            }
            
            //注意由于entryList只包含文件，因此直接生成docList会导致父节点丢失，造成前端目录树混乱，因此需要检查并添加父节点
            List<Doc> parentDocListForAdd = checkAndGetParentDocListForAdd(subDocList, rootDoc, subDocHashMap);
            if(parentDocListForAdd.size() > 0)
            {
            	subDocList.addAll(parentDocListForAdd);
            }
        } catch (IOException e) {
            Log.error(e);
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(bis != null){
                    bis.close();
                }
                if(tis != null){
                    tis.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForTxz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForTxz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForTxz() zipFilePath:" + zipFilePath);
		
		String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        List <Doc> subDocList = new ArrayList<Doc>();
		HashMap<Long, Doc> subDocHashMap = new HashMap<Long, Doc>();
		
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        XZInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new XZInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);

            TarEntry entry = null;
            while((entry = tarIn.getNextEntry()) != null){
				String subDocPath = rootPath + entry.getName();
				Log.debug("subDoc: " + subDocPath);
            	Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				subDocList.add(subDoc);
            }
            
            //注意由于entryList只包含文件，因此直接生成docList会导致父节点丢失，造成前端目录树混乱，因此需要检查并添加父节点
            List<Doc> parentDocListForAdd = checkAndGetParentDocListForAdd(subDocList, rootDoc, subDocHashMap);
            if(parentDocListForAdd.size() > 0)
            {
            	subDocList.addAll(parentDocListForAdd);
            }
        } catch (IOException e) {
            Log.error(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForTgz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForTgz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForTgz() zipFilePath:" + zipFilePath);
		
		String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        List <Doc> subDocList = new ArrayList<Doc>();
		HashMap<Long, Doc> subDocHashMap = new HashMap<Long, Doc>();
		
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        GZIPInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new GZIPInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);
            
            TarEntry entry = null;
            while(true)
            {
                entry = tarIn.getNextEntry();
                if( entry == null){
                    break;
                }
                //tgz文件中的name可能带./需要预处理
                String entryPath = entry.getName();
                Log.debug("subEntry:" + entryPath);
                
                if(entryPath.indexOf("./") == 0)
                {
                	if(entryPath.length() == 2)
                	{
                		continue;
                	}
                	entryPath = entryPath.substring(2);
                }
				String subDocPath = rootPath + entryPath;
				Log.debug("subDoc: " + subDocPath);
				
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				
				Log.printObject("subDoc:", subDoc);
				subDocList.add(subDoc);
            }
        } catch (IOException e) {
            Log.error(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListFor7z(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListFor7z() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListFor7z() zipFilePath:" + zipFilePath);
		
		String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        List <Doc> subDocList = new ArrayList<Doc>();
		HashMap<Long, Doc> subDocHashMap = new HashMap<Long, Doc>();
		
		SevenZFile sevenZFile = null;
        OutputStream outputStream = null;
        try {
            sevenZFile = new SevenZFile(file);

            SevenZArchiveEntry entry;
            while((entry = sevenZFile.getNextEntry()) != null){
				String subDocPath = rootPath + entry.getName();
				Log.debug("subDoc: " + subDocPath);
            	Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				subDocList.add(subDoc);
            }
            
            //注意由于entryList只包含文件，因此直接生成docList会导致父节点丢失，造成前端目录树混乱，因此需要检查并添加父节点
            List<Doc> parentDocListForAdd = checkAndGetParentDocListForAdd(subDocList, rootDoc, subDocHashMap);
            if(parentDocListForAdd.size() > 0)
            {
            	subDocList.addAll(parentDocListForAdd);
            }
        } catch (IOException e) {
            Log.error(e);
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
        return subDocList;
	}
	
	
	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, ZipEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
		}
		else 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			if(FileUtil.isCompressFile(subDoc.getName()))
			{
				subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
			}
		}
		return subDoc;
	}
	

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, FileHeader entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getFullUnpackSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getFullUnpackSize(), null);
				if(FileUtil.isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}
	

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, TarEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
				if(FileUtil.isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, SevenZArchiveEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
				if(FileUtil.isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}

	private List<Doc> getSubDocListForTar(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForTar() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForRar() zipFilePath:" + zipFilePath);
		
		String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        File file = new File(zipFilePath);
        List <Doc> subDocList = new ArrayList<Doc>();
		HashMap<Long, Doc> subDocHashMap = new HashMap<Long, Doc>();
        
        FileInputStream fis = null;
        OutputStream fos = null;
        TarInputStream tarInputStream = null;
        try {
            fis = new FileInputStream(file);
            tarInputStream = new TarInputStream(fis, 1024 * 2);

            TarEntry entry = null;
            while(true)
            {
                entry = tarInputStream.getNextEntry();
                if( entry == null){
                    break;
                }
				String subDocPath = rootPath + entry.getName();
				Log.debug("subDoc: " + subDocPath);
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				
				//Log.printObject("subDoc:", subDoc);
				subDocList.add(subDoc);
            }
            
            //注意由于entryList只包含文件，因此直接生成docList会导致父节点丢失，造成前端目录树混乱，因此需要检查并添加父节点
            List<Doc> parentDocListForAdd = checkAndGetParentDocListForAdd(subDocList, rootDoc, subDocHashMap);
            if(parentDocListForAdd.size() > 0)
            {
            	subDocList.addAll(parentDocListForAdd);
            }
        } catch (IOException e) {
           Log.error(e);
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(tarInputStream != null){
                    tarInputStream.close();
                }
            } catch (IOException e) {
                Log.error(e);
            }
        }
		return subDocList;
	}

	@SuppressWarnings("unused")
	private void sortDocListWithDocId(List<Doc> subDocList) {
		Collections.sort(subDocList,
			new Comparator<Doc>() {
				public int compare(Doc u1, Doc u2) {
					long diff = u1.getDocId() - u2.getDocId();
					if (diff > 0) 
					{
						return 1;
					}
					else if (diff < 0) 
					{
						return -1;
					}
					return 0;
				}
			}
		);
		
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc doc =  subDocList.get(i);
			Log.debug("sortDocListWithDocId docId:" + doc.getDocId() + " pid:" + doc.getPid() + " " + doc.getPath() + doc.getName());
		}
	}

	private List<Doc> checkAndGetParentDocListForAdd(List<Doc> subDocList, Doc rootDoc, HashMap<Long, Doc> subDocHashMap) 
	{
		
		List<Doc> addedParentDocList = new ArrayList<Doc>();
		for(int i=0; i<subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			if(!subDoc.getPid().equals(rootDoc.getDocId())) //rootDoc不需要添加，因此不检查
			{
				Doc parentDoc = subDocHashMap.get(subDoc.getPid());
				if(parentDoc == null)
				{
					addParentDocs(subDoc, rootDoc, subDocHashMap, addedParentDocList);					
				}
			}
		}
		return addedParentDocList;
	}

	private void addParentDocs(Doc subDoc, Doc rootDoc, HashMap<Long, Doc> subDocHashMap, List<Doc> addedParentDocList) 
	{
		Doc parentDoc = buildBasicDoc(rootDoc.getVid(), null, null, rootDoc.getReposPath(), subDoc.getPath(),"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		addedParentDocList.add(parentDoc);
		subDocHashMap.put(parentDoc.getDocId(), parentDoc);
		if(!parentDoc.getPid().equals(rootDoc.getDocId())) //rootDoc不需要添加，因此不检查
		{
			Doc parentParentDoc = subDocHashMap.get(parentDoc.getPid());
			if(parentParentDoc == null)
			{
				addParentDocs(parentDoc, rootDoc, subDocHashMap, addedParentDocList);					
			}
		}
	}

	private List<Doc> getSubDocListForZip(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		Log.debug("getSubDocListForZip() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		List <Doc> subDocList = getSubDocListForZip(repos, rootDoc, path, name, "gbk", true, rt);
        if(subDocList == null)
        {
        	Log.debug("getSubDocListForZip() restart with UTF-8");
    		subDocList = getSubDocListForZip(repos, rootDoc, path, name, "UTF-8", false, rt);
        }
		return subDocList;
	}
	
	@SuppressWarnings("unchecked")
	private List<Doc> getSubDocListForZip(Repos repos, Doc rootDoc, String path, String name, String charSet, Boolean messCheck, ReturnAjax rt) {
		Log.debug("getSubDocListForZip() path:" + rootDoc.getPath() + " name:" + rootDoc.getName() + " charSet:" + charSet);
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForZip() zipFilePath:" + zipFilePath);

        String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        
        ZipFile zipFile = null;
        List <Doc> subDocList = new ArrayList<Doc>();

        Boolean chineseIsOk = false;
        try {
			zipFile = new ZipFile(new File(zipFilePath), charSet);
			for (Enumeration<ZipEntry> entries = zipFile.getEntries(); entries.hasMoreElements();) {
				ZipEntry entry = entries.nextElement();
				Log.debug("getSubDocListForZip() entry: " + entry.getName());
				if(messCheck)
				{
					if(chineseIsOk == false) 
					{
						//我们只保证一种编码格式，只要有其中一个带中文的不乱码，就不再检测中文乱码
						int ret = isMessyCode(entry.getName());
						if(ret == 1)
						{
							Log.debug("getSubDocListForZip() chinese is in mess");
							return null;
						}
						else if(ret == 0)
						{
							chineseIsOk = true;
						}
					}
				}
				String subDocPath = rootPath + entry.getName();
				Log.debug("getSubDocListForZip() subDoc: " + subDocPath);
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocList.add(subDoc);
			}
		} catch (IOException e) {
			Log.error(e);
			subDocList = null;
		} finally {
			if(zipFile != null)
			{
				try {
					zipFile.close();
				} catch (IOException e) {
					Log.error(e);
				}
			}
		}
		
		return subDocList;
	}

    private static boolean isChinese(char c) {
        Log.debug("isChinese() c:" + c);
    	Character.UnicodeBlock ub = Character.UnicodeBlock.of(c);
        if (ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                || ub == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS
                || ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                || ub == Character.UnicodeBlock.GENERAL_PUNCTUATION
                || ub == Character.UnicodeBlock.CJK_SYMBOLS_AND_PUNCTUATION
                || ub == Character.UnicodeBlock.HALFWIDTH_AND_FULLWIDTH_FORMS) {
            return true;
        }
        return false;
    }
    
    public static int isMessyCode(String strName) {
    	Boolean hasChinese = false;
    	
        Pattern p = Pattern.compile("\\s*|\t*|\r*|\n*");
        Matcher m = p.matcher(strName);
        String after = m.replaceAll("");
        String temp = after.replaceAll("\\p{P}", "");
        char[] ch = temp.trim().toCharArray();
        float chLength = 0 ;
        float count = 0;
        for (int i = 0; i < ch.length; i++) {
            char c = ch[i];
            if (!Character.isLetterOrDigit(c)) {
                if (!isChinese(c)) {
                    count = count + 1;
                }
                else
                {
                	hasChinese = true;
                }
                chLength++; 
            }
        }
        float result = count / chLength ;
       	Log.debug("isMessyCode() count:" + count + " chLength:" + chLength + " hasChinese:" + hasChinese);
        
        if (result > 0.4) {
           	Log.debug("isMessyCode() is mess");
        	return 1;
        }
        
        if(hasChinese)
        {
        	Log.debug("isMessyCode() hasChinese and not mess");
            return 0;
        }
        return -1;
    }
}
	