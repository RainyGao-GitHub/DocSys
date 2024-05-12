package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import com.DocSystem.common.ActionContext;
import com.DocSystem.common.Base64Util;
import com.DocSystem.common.CovertVideoUtil;
import com.DocSystem.common.EVENT;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.FolderUploadAction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.IPUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.Path;
import com.DocSystem.common.VersionIgnoreConfig;
import com.DocSystem.common.constants;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.DownloadPrepareTask;
import com.DocSystem.common.entity.LargeFileScanTask;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.entity.UserPreferServer;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.websocket.entity.DocPullContext;
import com.DocSystem.websocket.entity.DocSearchContext;
import com.alibaba.fastjson.JSONObject;
import util.ReturnAjax;
import util.FileUtil.CompressPic;

/*
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
	public void addDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** addDoc [" + path + name + "] ****************");
		Log.info("addDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content+ " shareId:" + shareId  + " taskId:" + taskId);
		Log.debug("addDoc default charset:" + Charset.defaultCharset());
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "新增 [" + path + name + "]";
		}
		saveDocToRepos(
				"addDoc", "addDoc", "新增", taskId,
				repos, path, name, 0L, type, null,
				null,
				null,
				null,
				null, null, null, null, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
		
		if(content != null && content.isEmpty() == false)
		{
			String reposPath = Path.getReposPath(repos);
			String localRootPath = Path.getReposRealPath(repos);
			String localVRootPath = Path.getReposVirtualPath(repos);
			Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, type, true, localRootPath, localVRootPath, 0L, "");
			doc.setContent(content);
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			boolean ret = updateVirualDocContent(repos, doc, commitMsg, reposAccess.getAccessUser().getName(), reposAccess.getAccessUser(), rt, actionList);
			if(ret)
			{
				addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "添加备注", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));			
				deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}
			else
			{
				addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "添加备注", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));						
			}
		}
	}

	@RequestMapping("/addDocRS.do")  //文件名、文件类型、所在仓库、父节点
	public void addDocRS(
			String taskId,
			Integer reposId, String remoteDirectory, String path, String name,  Integer type,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush	
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** addDocRS [" + path + name + "] ****************");
		Log.info("addDocRS reposId:" + reposId + " remoteDirectory:[" + remoteDirectory + "] path:[" + path + "] name:" + name  + " type:" + type + " content:" + " authCode:" + authCode + " taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		//add Doc on Server Directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);

				docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed: remoteDirectory is null", rt);
				return;				
			}
			
			User accessUser = superAdminAccessCheck(authCode, null, session, rt);
			if(accessUser == null) 
			{
				writeJson(rt, response);			
				return;
			}
			
			saveDocToDisk(
					"addDocRS", "addDocRS", "新增", taskId,
					remoteDirectory, path, name, 0L, type, null,
					null,
					null,
					null,
					null, null, null, null, null,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
					accessUser,
					rt,
					response, request, session);		
			return;
		}
		
		ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Add Doc On Repos
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			writeJson(rt, response);
			docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "新增 [" + path + name + "]";
		}
		saveDocToRepos(
				"addDocRS", "addDocRS", "新增", taskId,
				repos, path, name, 0L, type, null,
				null,
				null,
				null,
				null, null, null, null, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);		
	}

	/****************   delete a Document ******************/
	@RequestMapping("/deleteDoc.do")
	public void deleteDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush	
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** deleteDoc [" + path + name + "] ****************");
		Log.info("deleteDoc reposId:" + reposId 
				+ " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type
				+ " shareId:" + shareId  + " taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		deleteDocFromRepos(
				"deleteDoc", "deleteDoc", "删除", taskId,
				repos, path, name, null, type, null,
				null,
				null,
				null, null, null, null, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
	}

	@RequestMapping("/deleteDocRS.do")
	public void deleteDocRS(
			String taskId,
			Integer reposId, String remoteDirectory, String path, String name, Integer type,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush	
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** deleteDocRS [" + path + name + "] ****************");
		Log.info("deleteDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory 
				+ " path:" + path + " name:" + name + " authCode:" + authCode  + " taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		if(checkAuthCode(authCode, null, rt) == null)
		{
			//docSysErrorLog("无效授权码或授权码已过期！", rt);
			writeJson(rt, response);			
			return;
		}
		
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		
		//delete file from server directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysDebugLog("deleteDocRS remoteDirectory is null", rt);
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));
				return;				
			}
			
			deleteDocFromDisk(
					"deleteDocRS", "deleteDocRS", "删除", taskId,
					remoteDirectory, path, name, null, type, null,
					null,
					null,
					null, null, null, null, null,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
					reposAccess,
					rt,
					response, request, session);
			return;			
		}
		
		//delete file from repos
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
		
		deleteDocFromRepos(
				"deleteDocRS", "deleteDocRS", "删除", taskId,
				repos, path, name, null, type, null,
				null,
				null,
				null, null, null, null, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
	}

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String dstName, 
			String commitMsg, 
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** renameDoc [" + path + name + "] ****************");
		Log.info("renameDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type +  " dstName:" + dstName+ " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		if(name == null || "".equals(name))
		{
			docSysErrorLog("文件名不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			docSysErrorLog("目标文件名不能为空！", rt);
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
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc parentDoc = buildBasicDoc(reposId, pid, null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名", taskId, "失败", repos, null, null, buildSystemLogDetailContent(rt));			
			return;
		}
	
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名", taskId, "失败", repos, null, null, buildSystemLogDetailContent(rt));			
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "重命名 [" + path + name + "] 为 [" + path + dstName + "]";
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, null, type, true, localRootPath, localVRootPath, null, null);
		if(checkUserAccessPwd(repos, srcDoc, session, rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名", taskId, "失败", repos, srcDoc, null, buildSystemLogDetailContent(rt));			
			return;
		}
		
		Doc dstDoc = buildBasicDoc(reposId, null, pid, reposPath, path, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);

			writeJson(rt, response);
			
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名", taskId, "失败", repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		//Build ActionContext
		ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名", taskId, repos, srcDoc, dstDoc, null);
		context.info = "重命名 [" + srcDoc.getPath() + srcDoc.getName() + "] 为 [" + dstDoc.getPath() + dstDoc.getName() + "]";
		context.commitMsg = commitMsg == null? context.info : commitMsg;
		context.commitUser = reposAccess.getAccessUser().getName();
		
		int ret = renameDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context, reposAccess.getAccessUser(), "失败",  buildSystemLogDetailContent(rt));						
			break;
		case 1:
			//Update related DocShare
			updateRelatedDocShare(repos, srcDoc, dstDoc, rt);
			addSystemLog(context, reposAccess.getAccessUser(), "成功",  buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			//Update related DocShare
			updateRelatedDocShare(repos, srcDoc, dstDoc, rt);
			break;
		}	
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(
			String taskId,
			Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type, 
			String commitMsg, 
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** moveDoc [" + srcPath + srcName + "]  [" + dstPath + dstName + "] ****************");
		Log.info("moveDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);

		if(srcPath == null)
		{
			srcPath = "";
		}
		if(dstPath == null)
		{
			dstPath = "";
		}
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, srcPath, srcName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc srcParentDoc = buildBasicDoc(reposId, srcPid, null, reposPath, srcPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), srcParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动", taskId, "失败", repos, null, null, buildSystemLogDetailContent(rt));	
			return;
		}

		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动", taskId, "失败", repos, null, null, buildSystemLogDetailContent(rt));	
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "移动 " + srcPath + srcName + " 至 " + dstPath + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, reposPath, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		if(checkUserAccessPwd(repos, srcDoc, session, rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动", taskId, "失败", repos, srcDoc, null, buildSystemLogDetailContent(rt));	

			return;
		}
		
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动", taskId, "失败", repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));	

			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
				
		//Build ActionContext
		ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动", taskId, repos, srcDoc, dstDoc, null);
		context.info = "移动 [" + srcDoc.getPath() + srcDoc.getName() + "] 到 [" + dstDoc.getPath() + dstDoc.getName() + "]";
		context.commitMsg = commitMsg == null? context.info : commitMsg;
		context.commitUser = reposAccess.getAccessUser().getName();
		
		int ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context, reposAccess.getAccessUser(), "失败",  buildSystemLogDetailContent(rt));						
			break;
		case 1:
			//Update related DocShare
			updateRelatedDocShare(repos, srcDoc, dstDoc, rt);
			addSystemLog(context, reposAccess.getAccessUser(), "成功",  buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			//Update related DocShare
			updateRelatedDocShare(repos, srcDoc, dstDoc, rt);
			break;
		}
	}

	private void updateRelatedDocShare(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) {
		
		DocShare qDocShare = new DocShare();
		qDocShare.setPath(srcDoc.getPath());
		qDocShare.setName(srcDoc.getName());
		qDocShare.setDocId(srcDoc.getDocId());
		qDocShare.setVid(repos.getId());
		
		List<DocShare> list = reposService.getDocShareList(qDocShare);
		if(list != null && list.size() > 0)
		{
			for(int i=0; i< list.size(); i++)
			{
				DocShare docShare = list.get(i);
				docShare.setPath(dstDoc.getPath());
				docShare.setName(dstDoc.getName());
				docShare.setDocId(dstDoc.getDocId());				
				
				Log.debug("updateRelatedDocShare() update DocShare [" + docShare.getId() + "] [" + qDocShare.getPath() + qDocShare.getName() + "] [" + docShare.getPath() + docShare.getName() + "]");
					
				if(reposService.updateDocShare(docShare) == 0)
				{
					docSysDebugLog("updateRelatedDocShare() update DocShare Failed [" + docShare.getId() + "] [" + qDocShare.getPath() + qDocShare.getName() + "] [" + docShare.getPath() + docShare.getName() + "]", rt);
				}
			}
		}
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(
			String taskId,
			Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** copyDoc [" + srcPath + srcName + "]  [" + dstPath + dstName + "] ****************");
		Log.info("copyDoc reposId:" + reposId 
				+ " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type 
				+ " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId  + " taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		Log.debug("copyDoc check reposAccess");
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, srcPath, srcName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Log.debug("copyDoc getReposEx");
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "复制 [" + srcPath + srcName + "] 到 [" + dstPath + dstName + "]";
		}
		
		String commitUser = reposAccess.getAccessUser().getName();
				
		//检查用户是否有目标目录权限新增
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, reposPath, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);

		//Build ActionContext
		ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制", taskId, repos, srcDoc, dstDoc, null);
		context.info = "复制 [" + srcDoc.getPath() + srcDoc.getName() + "] 到 [" + dstDoc.getPath() + dstDoc.getName() + "]";
		context.commitMsg = commitMsg == null? context.info : commitMsg;
		context.commitUser = reposAccess.getAccessUser().getName();
		
		Log.debug("copyDoc checkUserAddRight");
		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			copyAfterHandler(0, srcDoc, dstDoc, reposAccess, context, rt);
			return;
		}
		
		Doc tmpDoc = docSysGetDoc(repos, srcDoc, false);
		if(tmpDoc == null || tmpDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);	
			copyAfterHandler(0, srcDoc, dstDoc, reposAccess, context, rt);
			return;
		}		
		srcDoc = tmpDoc;
		
		if(checkUserAccessPwd(repos, srcDoc, session, rt) == false)
		{
			writeJson(rt, response);
			copyAfterHandler(0, srcDoc, dstDoc, reposAccess, context, rt);
			return;
		}
		
		//Build ActionContext
		int ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		copyAfterHandler(ret, srcDoc, dstDoc, reposAccess, context, rt);
	}
	
	/****************   copy/move/rename a Document ******************/
	@RequestMapping("/copyDocRS.do")
	public void copyDocRS(
			String taskId,
			Integer reposId, String remoteDirectory, String srcPath, String srcName, String dstPath, String dstName, Integer isMove,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** copyDocRS [" + srcPath + srcName + "]  [" + dstPath + dstName + "] ****************");
		Log.info("copyDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory 
				+ " srcPath:" + srcPath + " srcName:" + srcName + " srcPath:" + dstPath + " dstName:" + dstName + " isMove:" + isMove 
				+ " authCode:" + authCode  + " taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		if(checkAuthCode(authCode, null, rt) == null)
		{
			//rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		boolean move = false;
		if(isMove != null && isMove == 1)
		{
			move = true;
		}			

		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		//move file
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysDebugLog("copyDocRS remoteDirectory is null", rt);
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));
				return;				
			}
			
			if(move)
			{
				if(FileUtil.moveFileOrDir(remoteDirectory + srcPath, srcName, remoteDirectory + dstPath, dstName, false) == false)
				{
					docSysDebugLog("copyDocRS() move " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "失败！", rt);
					rt.setError("移动失败");
					writeJson(rt, response);			
					addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));
					return;
				}				
			}
			else
			{
				if(FileUtil.copyFileOrDir(remoteDirectory + srcPath + srcName, remoteDirectory + dstPath + dstName, false) == false)
				{
					docSysDebugLog("copyDocRS() copy " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "失败！", rt);
					rt.setError("复制失败");
					writeJson(rt, response);			
					addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));
					return;
				}
			}
			
			writeJson(rt, response);
			
			docSysDebugLog("copyDocRS() copy " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "成功！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制", taskId, "成功", null, null, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;

		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			if(move)
			{
				commitMsg = "移动 [" + srcPath + srcName + "] 到 [" + dstPath + dstName + "]";				
			}
			else
			{
				commitMsg = "复制 [" + srcPath + srcName + "] 到 [" + dstPath + dstName + "]";
			}
		}
		String commitUser = reposAccess.getAccessUser().getName();
		
		//检查用户是否有目标目录权限新增
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc srcDoc = buildBasicDoc(reposId, null, null, reposPath, srcPath, srcName, null, null, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, null, reposPath, dstPath, dstName, null, null, true, localRootPath, localVRootPath, null, null);
		
		//Build ActionContext
		ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制", taskId, repos, srcDoc, dstDoc, null);		
		if(move)
		{
			context.eventName = "移动";	
			context.info = "移动 [" + srcDoc.getPath() + srcDoc.getName() + "] 到 [" + dstDoc.getPath() + dstDoc.getName() + "]";
		}
		else
		{
			context.info = "复制 [" + srcDoc.getPath() + srcDoc.getName() + "] 到 [" + dstDoc.getPath() + dstDoc.getName() + "]";
		}
		context.commitMsg = commitMsg == null? context.info : commitMsg;
		context.commitUser = reposAccess.getAccessUser().getName();
		
		Doc dstParentDoc = buildBasicDoc(reposId, null, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			
			copyAfterHandler(0, srcDoc, dstDoc, reposAccess, context, rt);	
			return;
		}
		
		Doc tmpDoc = docSysGetDoc(repos, srcDoc, false);
		if(tmpDoc == null || tmpDoc.getType() == null ||tmpDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);
			
			copyAfterHandler(0, srcDoc, dstDoc, reposAccess, context, rt);			
			return;
		}
		srcDoc = tmpDoc;

		
		int ret = 0;
		if(move)
		{
			
			ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);			
		}
		else
		{
			ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		}
		
		writeJson(rt, response);
		
		copyAfterHandler(ret, srcDoc, dstDoc, reposAccess, context, rt);
	}

	/****************   refresh a Document ******************/
	@RequestMapping("/refreshDoc.do")
	public void refreshDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg, Integer force,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** refreshDoc [" + path + name + "] ****************");
		Log.info("refreshDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " force:" + force+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			docSysDebugLog("refreshDoc() [" + path + name + "] reposCheck Failed", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", taskId, "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);

		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "同步 [" + doc.getPath() + doc.getName() + "]";
		}
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		if(checkDocLocked(doc, DocLock.LOCK_TYPE_FORCE, reposAccess.getAccessUser(), false))
		{
			writeJson(rt, response);

			docSysDebugLog("refreshDoc() [" + doc.getPath() + doc.getName() + "] was force locked", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}

		//doc was not force locked
		if(force != null && force == 1)
		{
			addDocToSyncUpList(actionList, repos, doc, Action.SYNC_ALL_FORCE, reposAccess.getAccessUser(), commitMsg, true);
		}
		else
		{
			addDocToSyncUpList(actionList, repos, doc, Action.SYNC_ALL, reposAccess.getAccessUser(), commitMsg, true);
		}

		writeJson(rt, response);

		docSysDebugLog("refreshDoc() [" + doc.getPath() + doc.getName() + "]", rt);

		String requestIP = getRequestIpAddress(request);

		new Thread(new Runnable() {
			public void run() {
				Log.debug("refreshDoc() executeUniqueCommonActionList in new thread");
				executeUniqueCommonActionList(actionList, rt);
				addSystemLog(requestIP, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));
			}
		}).start();
	}
	
	
	/****************   Feeback  ******************/
	@RequestMapping("/feeback.do")
	public void feeback(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** feeback [" + path + name + "] ****************");
		Log.info("feeback reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content);
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
		docSysErrorLog("请在码云上提交意见与建议：<br>https://gitee.com/RainyGao/DocSys/issues", rt);
		writeJson(rt, response);	
		return;
		
		/*
		if(name == null)
		{
			docSysErrorLog("意见不能为空！", rt);
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
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
	
	/****************   execute a Document ******************/
	@RequestMapping("/executeDoc.do")
	public void executeDoc(Integer reposId, String path, String name,
			String cmdLine,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** executeDoc [" + path + name + "] ****************");
		Log.info("executeDoc reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
	public void checkDocInfo(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size,String checkSum, 
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload
			Integer shareId,
			String authCode,
			Integer usage,	//UpgradeDocSystem, InstallOffice
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** checkDocInfo [" + path + name + "] ****************");
		Log.info("checkDocInfo  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum+ " shareId:" + shareId
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount + " usage:" + usage);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());

		if(usage != null)
		{
			User accessUser = superAdminAccessCheck(authCode, null, session, rt);
			if(accessUser == null)		
			{
				writeJson(rt, response);			
				return;
			}
			
			String localDiskPath = getLocalRootPathForUsage(usage);
			if(localDiskPath == null || localDiskPath.isEmpty())
			{
				docSysErrorLog("非法文件上传", rt);
				writeJson(rt, response);			
				return;			
			}
			
			//Fake Doc
			Doc doc = buildBasicDoc(null, null, null, null, path, name, null, type, true, localDiskPath, null, size, checkSum);
			Doc fsDoc = fsGetDoc(null, doc);
			if(fsDoc.getType() == 0)
			{
				//File not exist
				writeJson(rt, response);
				return;	
			}
			
			if(fsDoc.getSize() == size)
			{
				rt.setMsgData("1");
				rt.setData(fsDoc);
				docSysDebugLog("checkDocInfo() " + name + " 已存在，且checkSum相同！", rt);
				writeJson(rt, response);
				return;
			}
			
			rt.setMsgData("0");
			rt.setData(fsDoc);
			docSysDebugLog("checkDocInfo() " + name + " 已存在", rt);
			writeJson(rt, response);
			return;
		}
		
		//Upload to Repos
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposInfo(reposId, reposAccess.getDocShare());
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//Get FolderUploadAction
		FolderUploadAction folderUploadAction = null;
		if(isFSM(repos) && isFolderUploadAction(dirPath, batchStartTime))
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, "checkDocInfo", "checkDocInfo", "目录上传", taskId, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("checkDocInfo() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			if(folderUploadAction.totalCount < totalCount)
			{
				folderUploadAction.totalCount = totalCount;
			}
		}
		
		//Build Doc
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);
		//Build ActionContext
		ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "checkDocInfo", "checkDocInfo", "文件上传", taskId, repos, doc, null, folderUploadAction);
		context.info = "上传文件 [" + doc.getPath() + doc.getName() + "]";
		context.commitMsg = commitMsg == null? context.info : commitMsg;
		context.commitUser = reposAccess.getAccessUser().getName();

		//检查登录用户的权限
		Doc parentDoc = buildBasicDoc(reposId, pid, null, reposPath, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		DocAuth UserDocAuth = getUserDocAuth(repos, reposAccess.getAccessUser().getId(), parentDoc);
		if(UserDocAuth == null)
		{
			docSysErrorLog("您无权在该目录上传文件!", rt);
			writeJson(rt, response);

			//treat as upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;
		}
		
		if(isUploadSizeExceeded(size, UserDocAuth.getUploadSize()))
		{
			docSysDebugLog("checkDocInfo() size:" + size + " UserDocAuth max uploadSize:" + UserDocAuth.getUploadSize(), rt);
			
			String maxUploadSize = getMaxUploadSize(UserDocAuth.getUploadSize());
			docSysErrorLog("上传文件大小超限[" + maxUploadSize + "]，请联系管理员", rt);
			
			writeJson(rt, response);

			//treat as upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;
		}		
		
		//是否可以秒传检查(文件是否已存在且校验码一致或者文件不存在但系统中存在相同校验码的文件)
		Doc fsDoc = fsGetDoc(repos, doc);
		if(fsDoc != null && fsDoc.getType() != 0)
		{
			if(fsDoc.getType() == 2)
			{
				docSysErrorLog(name + "是已存在目录！", rt);

				docSysDebugLog("checkDocInfo() 上传失败: [" + doc.getPath() + doc.getName() + "] 是目录", rt);
				writeJson(rt, response);
				
				//treat as upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			Doc dbDoc = dbGetDoc(repos, doc, true);
			if(isUploadCanSkip(repos, doc, fsDoc, dbDoc))
			{	
				rt.setData(fsDoc);
				rt.setMsgData("1");

				docSysDebugLog("checkDocInfo() " + name + " 已存在，且checkSum相同！", rt);
				
				writeJson(rt, response);

				//treat as upload success
				uploadAfterHandler(1, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			else
			{
				rt.setData(fsDoc);
				rt.setMsgData("0");
				docSysDebugLog("checkDocInfo() " + name + " 已存在", rt);
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
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		
		int ret = copySameDocForUpload(repos, sameDoc, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		if(ret == 0)
		{
			rt.setStatus("ok");
			rt.setMsgData("3");
			docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied failed！", rt);
			writeJson(rt, response);
			return;
		}
		
		rt.setData(fsDoc);
		rt.setMsgData("1");
		docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied ok！", rt);
		writeJson(rt, response);
				
		uploadAfterHandler(ret, doc, name, null, null, null, reposAccess, context, rt);
	}

	private Repos getReposInfo(Integer reposId, DocShare docShare) {
		if(docShare == null || docShare.getType() == null || docShare.getType() == 0)
		{
			return getReposEx(reposId);
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
	public void checkChunkUploaded(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Long chunkSize,String chunkHash, Integer combineDisabled,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd, //for folder upload
			Integer shareId,
			String authCode,
			Integer usage,	//UpgradeDocSystem, InstallOffice
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.infoHead("************** checkChunkUploaded [" + path + name + "] ****************");
		Log.info("checkChunkUploaded  taskId:" + taskId + " reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash
				+ " shareId:" + shareId + " authCode:" + authCode
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount + " isEnd:" + isEnd
				+ " usage:" + usage);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		if("".equals(checkSum))
		{
			//CheckSum is empty, mean no need to check
			rt.setMsgData("0");	//标记为chunk not exist or not matched
			writeJson(rt, response);
			return;
		}
		
		if(usage != null)
		{
			User accessUser = superAdminAccessCheck(authCode, null, session, rt);
			if(accessUser == null)		
			{
				writeJson(rt, response);			
				return;
			}
			
			String localDiskPath = getLocalRootPathForUsage(usage);
			if(localDiskPath == null || localDiskPath.isEmpty())
			{
				docSysErrorLog("非法文件上传", rt);
				writeJson(rt, response);			
				return;			
			}
			
			String usageName = getUsageName(usage);
			
			//判断tmp目录下是否有分片文件，并且checkSum和size是否相同 
			String fileChunkName = name + "_" + chunkIndex;
			String chunkFilePath = localDiskPath + fileChunkName;
			if(false == isChunkMatched(chunkFilePath,chunkHash))
			{
				rt.setMsgData("0");
				docSysDebugLog("chunk: " + fileChunkName +" 不存在，或checkSum不同！", rt);
				writeJson(rt, response);
				return;
			}
			
			rt.setMsgData("1");
			docSysDebugLog("chunk: " + fileChunkName +" 已存在，且checkSum相同！", rt);			
			Log.debug("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			
			saveDocToDisk(
					"checkChunkUploaded", "checkChunkUploaded", usageName, taskId,
					localDiskPath, path, name,  size, type, checkSum,
					null,
					null,
					null,
					chunkIndex, chunkNum, chunkSize, chunkHash, combineDisabled,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd, //for folder upload			
					accessUser,
					rt,	//UpgradeDocSystem, InstallOffice
					response, request, session);
			return;
		}

		ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
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
			docSysDebugLog("chunk: " + fileChunkName +" 不存在，或checkSum不同！", rt);
			writeJson(rt, response);
			return;
		}
		
		rt.setMsgData("1");
		docSysDebugLog("chunk: " + fileChunkName +" 已存在，且checkSum相同！", rt);			
		Log.debug("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传文件 [" + path + name + "]";
		}
		saveDocToRepos(
				"checkChunkUploaded", "checkChunkUploaded", "文件上传", taskId,
				repos, path, name, size, type, checkSum,
				null,
				null,
				null,
				chunkIndex, chunkNum, chunkSize, chunkHash, combineDisabled,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);		
	}

	//combine chunks
	//注意：chunkIndex不能小于chunkNum，否则deleteChunks逻辑会有问题
	@RequestMapping("/combineChunks.do")
	public void combineChunks(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Long chunkSize,String chunkHash,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd, //for folder upload
			Integer shareId,
			Integer usage,	//UpgradeDocSystem, InstallOffice
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.infoHead("************** combineChunks [" + path + name + "] ****************");
		Log.info("combineChunks  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);
			
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		if(usage != null)
		{
			User accessUser = superAdminAccessCheck(null, null, session, rt);
			if(accessUser == null)		
			{
				writeJson(rt, response);			
				return;
			}
			
			String localDiskPath = getLocalRootPathForUsage(usage);
			if(localDiskPath == null || localDiskPath.isEmpty())
			{
				docSysErrorLog("非法文件上传", rt);
				writeJson(rt, response);			
				return;			
			}
			
			String usageName = getUsageName(usage);	
			saveDocToDisk(
					"combineChunks", "combineChunks", usageName, taskId,
					localDiskPath, path, name,  size, type, checkSum,
					null,
					null,
					null,
					chunkIndex, chunkNum, chunkSize, chunkHash, null,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd, //for folder upload			
					accessUser,
					rt,	//UpgradeDocSystem, InstallOffice
					response, request, session);
			return;
		}

		ReposAccess reposAccess = checkAndGetAccessInfoEx(null, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}

		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传文件 [" + path + name + "]";
		}
		saveDocToRepos(
				"combineChunks", "combineChunks", "文件上传", taskId,
				repos, path, name, size, type, checkSum,
				null,
				null,
				null,
				chunkIndex, chunkNum, chunkSize, chunkHash, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
	}

	@RequestMapping("/getMaxThreadCount.do")
	public void getMaxThreadCount(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getMaxThreadCount.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		Integer maxThreadCount = 1;
		
		Log.info("getMaxThreadCount() DB_TYPE:" + DB_TYPE);
		if(false == DB_TYPE.equals("sqlite"))
		{
			maxThreadCount = getMaxThreadCount();
			Log.debug("getMaxThreadCount() maxThreadCount in config:" + maxThreadCount);
		}
		Log.info("getMaxThreadCount() maxThreadCount:" + maxThreadCount);		
		
		rt.setData(maxThreadCount);
		writeJson(rt, response);
	}
	
	/****************   Upload a Document ******************/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			MultipartFile uploadFile,
			String fileLink,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Long chunkSize, String chunkHash, Integer combineDisabled,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush	
			Integer shareId,
			String authCode,
			Integer usage,	//UpgradeDocSystem, InstallOffice
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** uploadDoc [" + path + name + "] ****************");
		Log.info("uploadDoc  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash + " combineDisabled:" + combineDisabled
							+ " shareId:" + shareId + " commitMsg:" + commitMsg
							+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount + " taskId:" + taskId);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());

		//文件类型未指定当文件处理
		if(type == null)
		{
			type = 1;
		}
		
		if(usage != null)
		{
			User accessUser = superAdminAccessCheck(null, null, session, rt);
			if(accessUser == null)		
			{
				writeJson(rt, response);			
				return;
			}
			
			String localDiskPath = getLocalRootPathForUsage(usage);
			if(localDiskPath == null || localDiskPath.isEmpty())
			{
				docSysErrorLog("非法文件上传", rt);
				writeJson(rt, response);			
				return;			
			}
			
			String usageName = getUsageName(usage);
			
			saveDocToDisk(
					"uploadDoc", "uploadDoc", usageName, taskId,
					localDiskPath, path, name,  size, type, checkSum,
					uploadFile,
					fileLink,
					null,
					chunkIndex, chunkNum, chunkSize, chunkHash, combineDisabled,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd, //for folder upload			
					accessUser,
					rt,	//UpgradeDocSystem, InstallOffice
					response, request, session);
			return;
		}
		
		ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传文件 [" + path + name + "]";
		}
		saveDocToRepos(
				"uploadDoc", "uploadDoc", "文件上传", taskId,
				repos, path, name, size, type, checkSum,
				uploadFile,
				fileLink,
				null,
				chunkIndex, chunkNum, chunkSize, chunkHash, combineDisabled,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
		return;
	}

	@RequestMapping("/uploadDocRS.do")
	public void uploadDocRS(
			String taskId,	//用户自定义的taskId，将会被存入系统日志的queryId字段，以便用户可以随时查询该任务的信息
			Integer reposId, String remoteDirectory, String path, String name, Long size, Integer type, String checkSum,
			MultipartFile uploadFile,
			String fileLink,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Long chunkSize, String chunkHash, Integer combineDisabled,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, Integer isEnd,  //Parameters for FolderUpload or FolderPush	
			Integer shareId,
			String authCode,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** uploadDocRS [" + path + name + "] ****************");
		Log.info("uploadDocRS  reposId:" + reposId + " remoteDirectory:" + remoteDirectory + " path:" + path + " name:" + name  + " size:" + size + " type:" + type + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " authCode:" + authCode + " commitMsg:" + commitMsg
							+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount  + " taskId:" + taskId);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());

		if(type == null)
		{
			type = 1;
		}
		
		//upload to server directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径不能为空！", rt);
				writeJson(rt, response);			
				return;				
			}
			
			User accessUser = superAdminAccessCheck(authCode, null, session, rt);
			if(accessUser == null) 
			{
				writeJson(rt, response);			
				return;
			}
			
			saveDocToDisk(
					"uploadDocRS", "uploadDocRS", "文件上传", taskId,
					remoteDirectory, path, name, size, type, checkSum,
					uploadFile,
					fileLink,
					null,
					chunkIndex, chunkNum, chunkSize, chunkHash, combineDisabled,
					commitMsg,
					dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
					accessUser,
					rt,
					response, request, session);
			return;			
		}
		
		ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
						
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
				
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传文件 [" + path + name + "]";
		}
		saveDocToRepos(
				"uploadDocRS", "uploadDocRS", "文件上传", taskId,
				repos, path, name, size, type, checkSum,
				uploadFile,
				fileLink,
				null,
				chunkIndex, chunkNum, chunkSize, chunkHash, null,
				commitMsg,
				dirPath, batchStartTime, totalCount, isEnd,  //Parameters for FolderUpload or FolderPush	
				reposAccess,
				rt,
				response, request, session);
		return;
	}

	/****************   pushDocRS a Document ******************/
	@RequestMapping("/pushDocRS.do")
	public void pushDocRS(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name, //待推送的文件或目录信息
			Integer targetReposId, String targetPath, //目标目录信息
			Integer recurciveEn, //null/0: false, 1: true
			Integer forceEn, //null/0: false, 1: true
			Integer shareId, String authCode, //
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** pushDocRS ****************");
		Log.info("pushDocRS  reposId:" + reposId + " path:" + path + " name:" + name 
				+ " targetReposId:" + targetReposId 
				+ " targetPath:" + targetPath
				+ " recurciveEn:" + recurciveEn + " forceEn:" + forceEn 
				+ " taskId:" + taskId);

		channel.pushDocRS
		(
				taskId,
				reposId, docId, pid, path, name, //待推送的文件或目录信息
				targetReposId, targetPath, //目标目录信息
				recurciveEn, //null/0: false, 1: true
				forceEn, //null/0: false, 1: true
				shareId, authCode, //
				response, request, session);
	}
	
	/****************   Upload a Picture for Markdown ******************/
	@RequestMapping("/uploadMarkdownPic.do")
	public void uploadMarkdownPic(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String imgName,
			@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, 
			HttpServletRequest request,HttpServletResponse response,HttpSession session) throws Exception
	{
		Log.infoHead("************** uploadMarkdownPic [" + path + name + "] ****************");
		Log.info("uploadMarkdownPic reposId:" + reposId + " docId:" + docId + " path:" + path + " name:" + name + " imgName:" + imgName);
		
		JSONObject res = new JSONObject();

		Repos repos = getReposEx(reposId);
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
		
		addSystemLog(request, null, "uploadMarkdownPic", "uploadMarkdownPic", "上传备注图片", taskId, "成功", repos, curDoc, null, "");			
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			String content, Integer docType,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** updateDocContent [" + path + name + "] ****************");
		Log.info("updateDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);
		//Log.debug("updateDocContent content:[" + content + "]");
		//Log.debug("content size: " + content.length());
			
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);		
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + path + name + " 不存在！", rt);
			writeJson(rt, response);			
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));			
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
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));			
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
				docSysErrorLog(name + " 不是文本文件，禁止修改！", rt);
				writeJson(rt, response);
				
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));			
				return;
			}
			
			if(commitMsg == null || commitMsg.isEmpty())
			{
				commitMsg = "修改 [" + path + name + "]";
			}
			ret = updateRealDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList, request, "updateDocContent", "updateDocContent", "修改文件", taskId);
			
			writeJson(rt, response);
	
			if(ret)
			{				
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));			
				deleteTmpRealDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}
			else
			{
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));			
			}
			return;
		}
		
		//修改备注
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "更新 " + path + name + " 备注";
		}
		ret = updateVirualDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		writeJson(rt, response);

		if(ret)
		{
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改备注", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));			
			deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
			executeCommonActionList(actionList, rt);
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改备注", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));						
		}
	}
	
	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** tmpSaveDocContent [" + path + name + "] ****************");
		Log.info("tmpSaveDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId + " docType:" + docType);
		//Log.debug("tmpSaveVirtualDocContent content:[" + content + "]");
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		if(docType == null)
		{
			docSysErrorLog("docType is null", rt);
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
				docSysErrorLog("tmpSaveRealDocContent Error!", rt);
				docSysDebugLog("tmpSaveDocContent() tmpSaveRealDocContent [" + doc.getPath() + doc.getName() + "]", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "tmpSaveDocContent", "tmpSaveDocContent", "文件修改临时保存", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));						
			}			
		}
		else
		{
			if(saveTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				docSysErrorLog("tmpSaveVirtualDocContent Error!", rt);
				docSysDebugLog("tmpSaveDocContent() tmpSaveVirtualDocContent [" + doc.getPath() + doc.getName() + "]", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "tmpSaveDocContent", "tmpSaveDocContent", "备注修改临时保存", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));						
			}
		}
		writeJson(rt, response);
	}
	
	/**************** downloadDocPrepare ******************/
	@RequestMapping("/downloadDocPrepare.do")
	public void downloadDocPrepare(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			Integer downloadType,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** downloadDocPrepare [" + path + name + "] ****************");
		Log.info("downloadDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " downloadType:" + downloadType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
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
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
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
		
		//下载准备中...
		Integer downloadPrepareStatus = (Integer) rt.getMsgData();
		if(downloadPrepareStatus != null && downloadPrepareStatus == 5)
		{
			new Thread(new Runnable() {
				DownloadPrepareTask task = (DownloadPrepareTask)rt.getData();
				String requestIP = getRequestIpAddress(request);
				public void run() {
					Log.debug("downloadDocPrepare() executeDownloadPrepareTask in new thread");
					executeDownloadPrepareTask(task, requestIP);
				}
			}).start();
			return;
		}
		
		//下载的是文件或者需要在downloadDoc阶段下载的目录
		if(rt.getStatus().equals("ok"))
		{
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
	}

	public void downloadDocPrepare_FSM(Repos repos, Doc doc, ReposAccess reposAccess,  boolean remoteStorageEn, ReturnAjax rt)
	{	
		if(isFSM(repos) == false)
		{
			//文件服务器前置仓库不允许远程存储
			remoteStorageEn = false;
			//从文件服务器拉取文件（对于前置仓库，拉取时会删除远程不存在的文件）
			channel.remoteServerCheckOut(repos, doc, null, null, null, null, constants.PullType.pullRemoteChangedWithoutLocalCheckForce, null);
		}

		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			Log.debug("downloadDocPrepare_FSM() locaDoc " +doc.getPath() + doc.getName() + " 获取异常");
			docSysErrorLog("本地文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
			return;
		}
		
		//本地文件不存在
		if(localEntry.getType() == 0)
		{
			Log.debug("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");			
			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
			return;		
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
				docSysDebugLog("本地文件: 非原始路径下载", rt);
				return;
			}
			
			Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 1);
			rt.setData(downloadDoc);
			rt.setMsgData(0);	//下载完成后不能删除下载的文件
			docSysDebugLog("本地文件: 原始路径下载", rt);
			return;
		}
		
		if(localEntry.getType() == 2)
		{	
			if(FileUtil.isEmptyDir(doc.getLocalRootPath() + doc.getPath() + doc.getName(), true))
			{
				Log.debug("downloadDocPrepare_FSM() Doc [" +doc.getPath() + doc.getName() + "] 是空目录");
				docSysErrorLog("空目录无法下载！", rt);
				return;
			}
			//创建目录压缩任务
			String compressTargetPath = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
			String compressTargetName = targetName + ".zip";
			if(targetName.isEmpty())
			{
				compressTargetName = repos.getName() + ".zip";
			}
			DownloadPrepareTask downloadPrepareTask = createDownloadPrepareTask(
					repos,
					doc,
					reposAccess,
					null,
					null,
					false,
					compressTargetPath,
					compressTargetName,
					1, //download repos's folder
					rt);
			
			if(downloadPrepareTask != null)
			{
				rt.setData(downloadPrepareTask);
				rt.setMsgData(5);	//目录压缩中...
			}
			return;
		}
		
		docSysErrorLog("本地未知文件类型:" + localEntry.getType(), rt);
		return;		
	}
	
	private DownloadPrepareTask createDownloadPrepareTask(Repos repos, Doc doc, ReposAccess reposAccess,
			String inputPath, String inputName, boolean deleteInput,
			String targetPath, String targetName, 
			Integer type,
			ReturnAjax rt) 
	{
		long curTime = new Date().getTime();
        Log.info("createDownloadPrepareTask() curTime:" + curTime);
        
		String taskId = reposAccess.getAccessUserId() + "-" + repos.getId() + "-" + doc.getDocId() + "-" + curTime;
		if(downloadPrepareTaskHashMap.get(taskId) != null)
		{
			Log.info("createDownloadPrepareTask() 压缩任务 " + taskId + "已存在");
			rt.setError("目录压缩任务 " + taskId + " 已存在");
			return null;
		}
		
		DownloadPrepareTask task =	new DownloadPrepareTask();
		task.id = taskId;
		task.type = type;
		
		task.createTime = curTime;
				
		task.repos = repos;
		task.doc = doc;
		task.reposAccess = reposAccess;
		
		//压缩指定目录
		task.inputPath = inputPath;
		task.inputName = inputName;
		task.deleteInput = deleteInput;
		
		//压缩文件
		task.targetPath = targetPath + taskId + "/";
		task.targetName = targetName;
		
		task.status = 1; //压缩中..
		
		task.info = "目录压缩中...";
		downloadPrepareTaskHashMap.put(taskId, task);
		
		return task;
	}
	
	//TODO: 这个函数使用需要小心，searchIndex更新有性能问题
	protected boolean remoteStorageCheckOut(Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, int pullType, ReturnAjax rt)
	{
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null)
		{
			docSysErrorLog("远程存储未设置！", rt);
			docSysDebugLog("remoteStorageCheckOut() remote is null", rt);
			return false;
		}
		
		if(channel == null)
		{
			docSysErrorLog("开源版不支持远程存储！", rt);			
			docSysDebugLog("remoteStorageCheckOut() businessChannel is null, 开源版不支持远程存储", rt);
			return false;
		}
		
		boolean ret = false;
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "remoteStorageCheckOut() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 2*60*60*1000, accessUser, rt, true,lockInfo, EVENT.remoteStorageCheckOut);	//lock 2 Hours 2*60*60*1000
		
		if(docLock == null)
		{
			docSysDebugLog("remoteStorageCheckOut() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);
			return false;
		}
		
		channel.remoteStoragePull(remote, repos, doc, accessUser, commitId, recurcive, pullType, rt);
		DocPullContext pullResult = (DocPullContext) rt.getDataEx();
	    if(pullResult != null && pullResult.successCount > 0)
	    {
	    	ret = true;
	    	
			String localChangesRootPath = Path.getReposTmpPath(repos) + "reposSyncupScanResult/remoteStoragePull-localChanges-" + new Date().getTime() + "/";
			String commitUser = accessUser.getName();
			String commitMsg = "远程存储自动拉取 ";
			if(convertRevertedDocListToLocalChanges(pullResult.successDocList, localChangesRootPath))
			{
				String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, localChangesRootPath, 2, null, null);
				if(revision != null)
				{
					verReposPullPush(repos, true, rt);
				}
				FileUtil.delDir(localChangesRootPath);
			}
			
			for(int i=0; i < pullResult.successDocList.size(); i++)
			{
				Doc tmpDoc = pullResult.successDocList.get(i);
				deleteAllIndexForDoc(repos, tmpDoc);
				buildIndexForDoc(repos, tmpDoc, null, null, rt, 0); //update doc searchIndex, do not update its subDocs
			}
	    }	

		unlockDoc(doc, lockType,  accessUser);
		
		return ret;		
	}
	
	private Doc getDownloadDocInfoForOffice(Repos repos, Doc doc) {
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
				docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
		}
		else
		{
			File localEntry = new File(vDoc.getLocalRootPath() + vDoc.getPath() + vDoc.getName());
			if(false == localEntry.exists())
			{
				docSysErrorLog("文件 " + doc.getName() + " 没有备注！", rt);
				return;
			}
		}
		
		String targetPath = Path.getReposTmpPathForDownload(repos,accessUser);
		//doCompressDir and save the zip File under userTmpDir
		if(doCompressDir(vDoc.getLocalRootPath() + vDoc.getPath(), vDoc.getName(), targetPath, targetName, rt) == false)
		{
			docSysErrorLog("压缩本地目录失败！", rt);
			return;
		}
		
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), targetPath, targetName, 0);
		rt.setData(downloadDoc);
		rt.setMsgData(1);	//下载完成后删除已下载的文件
		docSysDebugLog("远程目录: 已压缩并存储在用户临时目录", rt);
		return;		
	}
	
	/**************** queryDownloadPrepareTask ******************/
	@RequestMapping("/queryDownloadPrepareTask.do")
	public void queryDownloadPrepareTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryDownloadPrepareTask.do ****************");
		Log.info("queryDownloadPrepareTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		DownloadPrepareTask task = getDownloadPrepareTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("压缩任务 " + taskId + " 不存在");
			writeJson(rt, response);			
			return;
		}

		switch(task.status)
		{
		case 0:
		case 1:
			//下载压缩未结束
			rt.setData(task); //任务Id

			//更新task的targetSize
			File compressFile = new File(task.targetPath, task.targetName);
			if(compressFile.exists())
			{
				task.targetSize = compressFile.length();
			}
			
			rt.setMsgData(5);
			break;
		case 2:
			Doc doc = task.doc;
			Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), task.targetPath, task.targetName, 0);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载后（删除目标文件）
			
			//删除下载压缩任务
			downloadPrepareTaskHashMap.remove(task.id);
			//用户必须在20小时内完成下载
			addDelayTaskForCompressFileDelete(task.targetPath, task.targetName, 72000L); //20小时后删除压缩文件
			break;
		case 3:	
			//下载压缩失败
			rt.setError(task.info);
			break;
		default:	//未知压缩状态
			rt.setError("未知目录压缩状态");
			break;
		}

		writeJson(rt, response);			
	}
	
	private DownloadPrepareTask getDownloadPrepareTaskById(String taskId) {
		return downloadPrepareTaskHashMap.get(taskId);
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
		Log.infoHead("************** downloadDoc.do ****************");
		Log.info("downloadDoc  reposPath:" + reposPath + " targetPath:" + targetPath + " targetName:" + targetName+ " shareId:" + shareId + " authCode:" + authCode + "reposPath:" + reposPath + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);
				//return;	
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);
		
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
		Log.infoHead("************** downloadDocEx.do ****************");
		Log.info("downloadDocEx  reposPath:" + reposPath + " targetPath:" + targetPath + " targetName:" + targetName+ " shareId:" + shareId + " authCode:" + authCode + "reposPath:" + reposPath + " encryptEn:" + encryptEn);
		
		ReturnAjax rt = new ReturnAjax();
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadDocEx targetPath:" + targetPath + " targetName:" + targetName);
		
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
	
	//视频文件获取接口: 可以通过convertType指定转换类型或者直接读取
	@RequestMapping(value="/downloadVideo/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}/{convertType}", method=RequestMethod.GET)
	public void downloadVideo(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			 @PathVariable("convertType") Integer convertType,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadVideo ****************");
		Log.info("downloadVideo reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn 
				+ " convertType:" + convertType + " disposition:" + disposition);
		
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
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadImg targetPath:" + targetPath + " targetName:" + targetName);		
		
		Repos repos = null;
		if(vid != null)
		{
			repos = getReposEx(vid);
		}
		
		//获取目标图片文件的信息
		Doc targetDoc = getVideoDocInfoWithConvertType(repos, path, name, convertType);		
		if(targetDoc != null)
		{
			sendFileToWebPage(targetDoc.getLocalRootPath(), targetDoc.getName(), rt,response, request, disposition);
			return;
		}
		
		//use legacy solution
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, disposition);			
		}
		else
		{
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, disposition);						
		}
	}
	
	private Doc getVideoDocInfoWithConvertType(Repos repos, String path, String name, Integer convertType) 
	{
		if(repos == null || convertType == null || path == null || name == null)
		{
			return null;
		}
		
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			//加密的仓库不支持视频转换方式
			return null;
		}
		
		try {	
			path = new String(path.getBytes("ISO8859-1"),"UTF-8");	
			path = Base64Util.base64Decode(path);
			if(path == null)
			{
				return null;
			}

			name = new String(name.getBytes("ISO8859-1"),"UTF-8");
			name = Base64Util.base64Decode(name);
			if(name == null)
			{
				return null;
			}
			
			String imgPreviewPath = Path.getReposTmpPathForVideoPreview(repos, path, name);
			String localRootPath = Path.getReposRealPath(repos);
			
			return generateVideoWithConvertType(localRootPath + path, name, imgPreviewPath, convertType);			
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			return null;
		}
	}

	private Doc generateVideoWithConvertType(String localFilePath, String name, String imgPreviewPath, Integer convertType) 
	{
		Doc targetDoc = new Doc();
		targetDoc.setLocalRootPath(imgPreviewPath);
		targetDoc.setName(convertType + "_" + name);
		if(FileUtil.isFileExist(imgPreviewPath + convertType + "_" + name) == true)
		{
			return targetDoc;
		}
		
		switch(convertType)
		{
		case 1:	//Convert to mp4
			String fileSuffix = FileUtil.getFileSuffix(name);
			if(fileSuffix == null || fileSuffix.isEmpty())
			{
				return null;
			}
			if(fileSuffix.equals("mp4") || fileSuffix.equals("mov"))
			{
				FileUtil.copyFile(localFilePath + name, imgPreviewPath + convertType + "_" + name, false);
			}
			else
			{
				if(CovertVideoUtil.convertVideoToMp4(localFilePath + name, imgPreviewPath + convertType + "_" + name) == false)
				{
					return null;
				}			
			}
			break;
		default:
			return null;
		}
		
		if(FileUtil.isFileExist(imgPreviewPath + convertType + "_" + name) == true)
		{
			return targetDoc;
		}
		
		return null;
	}
	//图片文件获取接口: 可以通过resolutionLevel指定分辨率等级
	@RequestMapping(value="/downloadImg/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}/{resolutionLevel}", method=RequestMethod.GET)
	public void downloadImg(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			 @PathVariable("resolutionLevel") Integer resolutionLevel,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadImg ****************");
		Log.info("downloadImg reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn + " disposition:" + disposition);
		
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
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadImg targetPath:" + targetPath + " targetName:" + targetName);		
		
		Repos repos = null;
		if(vid != null)
		{
			repos = getReposEx(vid);
		}
		
		//获取目标图片文件的信息
		Doc targetDoc = getImageDocInfoWithResolutionLevel(repos, path, name, resolutionLevel);		
		if(targetDoc != null)
		{
			sendFileToWebPage(targetDoc.getLocalRootPath(), targetDoc.getName(), rt,response, request, disposition);
			return;
		}
		
		//use legacy solution
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, disposition);			
		}
		else
		{
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, disposition);						
		}
	}

	private Doc getImageDocInfoWithResolutionLevel(Repos repos, String path, String name, Integer resolutionLevel) {
		if(repos == null || resolutionLevel == null || path == null || name == null)
		{
			return null;
		}
		
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			//加密的仓库不支持缩略图方式
			return null;
		}
		
		try {	
			path = new String(path.getBytes("ISO8859-1"),"UTF-8");	
			path = Base64Util.base64Decode(path);
			if(path == null)
			{
				return null;
			}

			name = new String(name.getBytes("ISO8859-1"),"UTF-8");
			name = Base64Util.base64Decode(name);
			if(name == null)
			{
				return null;
			}
			
			String imgPreviewPath = Path.getReposTmpPathForImagePreview(repos, path, name);
			String localRootPath = Path.getReposRealPath(repos);
			
			return generateImageWithResolutionLevel(localRootPath + path, name, imgPreviewPath, resolutionLevel);			
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			return null;
		}	
	}

	private Doc generateImageWithResolutionLevel(String localFilePath, String name, String imgPreviewPath, Integer resolutionLevel) {
		Doc targetDoc = new Doc();
		targetDoc.setLocalRootPath(imgPreviewPath);
		targetDoc.setName(resolutionLevel + "_" + name);
		if(FileUtil.isFileExist(imgPreviewPath + resolutionLevel + "_" + name) == true)
		{
			return targetDoc;
		}
		
		//图片压缩
		CompressPic cp = new CompressPic();
		cp.setInputDir(localFilePath);
		cp.setOutputDir(imgPreviewPath);
		cp.setInputFileName(name);
		cp.setOutputFileName(resolutionLevel + "_" + name);
		switch(resolutionLevel)
		{
		case 1:
			cp.setOutputHeight(300);
			cp.setOutputWidth(300);
			break;
		case 2:
			cp.setOutputHeight(600);
			cp.setOutputWidth(600);
			break;
		case 3:
			cp.setOutputHeight(900);
			cp.setOutputWidth(900);
			break;
		}
		
		String result = cp.compressPic();
		if(result == null || result.equals("ok") == false)
		{
			return null;
		}
		
		return targetDoc;
	}

	@RequestMapping(value="/downloadDoc/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}", method=RequestMethod.GET)
	public void downloadDoc(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadDoc ****************");
		Log.info("downloadDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn + " disposition:" + disposition);
		
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
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, disposition);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, disposition);						
		}
		
		Doc doc = new Doc();
		doc.setPath(targetPath);
		doc.setName(targetName);
		//addSystemLog(request, reposAccess.getAccessUser(), "downloadDoc", "downloadDoc", "下载文件", "成功",  null, doc, null, "");	
	}
	
	@RequestMapping(value="/downloadDoc/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}/{fileName}", method=RequestMethod.GET)
	public void downloadDoc(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn, @PathVariable("fileName") String fileName,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadDoc ****************");
		Log.info("downloadDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn + " disposition:" + disposition);
		
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
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, disposition);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, disposition);						
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
		Log.infoHead("************** downloadDocEx ****************");
		Log.info("downloadDocEx reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn);
		
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
			if(checkAuthCode(authCode, null, rt) == null)
			{
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		Log.info("downloadDocEx targetPath:" + targetPath + " targetName:" + targetName);		
		if(encryptEn == null || encryptEn == 0 || vid == null)
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, disposition);			
		}
		else
		{
			Repos repos = getReposEx(vid);
			sendTargetToWebPageEx(repos, targetPath, targetName, rt, response, request, null, disposition);						
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
		Log.infoHead("************** doGetTmpFile ****************");
		Log.info("doGetTmpFile  reposId:" + reposId + " path:" + path + " fileName:" + fileName+ " shareId:" + shareId);

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
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
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
			errorLog(e);
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
		
		Log.infoHead("************** getZipDocContent [" + path + name + "] ****************");
		Log.info("getZipDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);

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
		if(!reposCheck(repos, rt, response))
		{
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
		
		if(FileUtil.isFileExist(tmpDoc.getLocalRootPath() + tmpDoc.getPath() + tmpDoc.getName()) == false)
		{
			status="notExists";
			content = "[" + path + name + "] 解压失败";
			writeText(status+content, response);	
			return;
		}
		
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
	public void getDocContent(
			Integer reposId, String path, String name, 
			Integer docType, //1: RealDoc 2: VirtualDoc	
			String commitId,
			Integer needDeletedEntry,	//0:不获取被删除文件的内容  1:获取被删除文件的内容
			Integer historyType,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session)
	{

		Log.infoHead("************** getDocContent [" + path + name + "] ************");
		Log.info("getDocContent reposId:" + reposId + " path:" + path + " name:" + name + " docType:" + docType 
				+ " shareId:" + shareId 
				+ " commitId:" + commitId  + " needDeletedEntry:" + needDeletedEntry + " historyType:" + historyType);

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
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(docType != null && docType == 2)
		{
			if(commitId == null)
			{
				getVirtualDocContent(
						repos, 
						path, name, 
						commitId,
						shareId,
						rt,
						request, response, session);
				return;
			}
			
			getVirtualDocHistoryContent(
					repos, 
					path, name, 
					commitId,
					shareId,
					rt,
					request, response, session);
			return;			
		}
		
		if(commitId == null)
		{
			getRealDocContent(
					repos, 
					path, name, 
					commitId,
					shareId,
					rt,
					request, response, session);
			return;
		}
		
		if(historyType == null)
		{
			historyType = HistoryType_RealDoc;
		}
		getRealDocHistoryContent(
				repos, 
				path, name, 
				commitId,
				needDeletedEntry,
				shareId,
				rt,
				request, response, session, historyType);
	}

	private void getRealDocContent(
			Repos repos, 
			String path, String name, 
			String commitId,
			Integer shareId,
			ReturnAjax rt,
			HttpServletRequest request,HttpServletResponse response,HttpSession session) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		path = doc.getPath();
		name = doc.getName();
		
		String status = "ok";
		String content = "";
		Doc tmpDoc = doc;
		if(isFSM(repos) == false)
		{
			channel.remoteServerCheckOut(repos, doc, null, null, null, commitId, constants.PullType.pullRemoteChangedOrLocalChanged_SkipDelete, null);
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
		
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);
	}

	private void getRealDocHistoryContent(
			Repos repos, 
			String path, String name, 
			String commitId,
			Integer needDeletedEntry,
			Integer shareId,
			ReturnAjax rt,
			HttpServletRequest request,HttpServletResponse response,HttpSession session, int historyType) 
	{
		Log.info("getRealDocHistoryContent reposId:" + repos.getId() + " path:" + path + " name:" + name 
				+ " shareId:" + shareId 
				+ " commitId:" + commitId  + " needDeletedEntry:" + needDeletedEntry + " historyType:" + historyType);
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		path = doc.getPath();
		name = doc.getName();
		
		String status = "ok";
		String content = "";
		Doc tmpDoc = doc;
		
		Doc remoteDoc = null;
		if(isFSM(repos))
		{
			remoteDoc = verReposGetDocEx(repos, doc, commitId, historyType);
		}
		else
		{
			remoteDoc = remoteServerGetDoc(repos, doc, commitId);
		}
				
		if(remoteDoc == null)
		{
			docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(remoteDoc.getType() != null && remoteDoc.getType() == 2)
		{
			docSysErrorLog(name + " 是目录！", rt);
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
				verReposCheckOutEx(repos, doc, tempLocalRootPath, null, null, commitId, null, needDeletedEntry, true, historyType);
			}
			else
			{
				channel.remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);
			}
		}
		tmpDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);					
			
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
		
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);
	}

	private void getVirtualDocHistoryContent(
			Repos repos, 
			String path, String name, 
			String commitId, 
			Integer shareId,
			ReturnAjax rt, 
			HttpServletRequest request, HttpServletResponse response, HttpSession session) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		path = doc.getPath();
		name = doc.getName();
		
		String status = "ok";
		String content = "";
		doc.setIsRealDoc(false);
		
		String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, false);
		File dir = new File(tempLocalRootPath + path);
		if(dir.exists() == false)
		{
			dir.mkdirs();
			verReposCheckOutLegacy(repos, true, doc, tempLocalRootPath + path, name, commitId, true, null, HistoryType_VirtualDoc);
		}

		Doc tmpDoc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, 1, true, tempLocalRootPath, localVRootPath, null, null);
		content = readRealDocContent(repos, tmpDoc);
		
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);
		
	}
	
	private void getVirtualDocContent(
			Repos repos, 
			String path, String name, 
			String commitId, 
			Integer shareId,
			ReturnAjax rt, 
			HttpServletRequest request, HttpServletResponse response, HttpSession session) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		path = doc.getPath();
		name = doc.getName();
		
		String status = "ok";
		String content = "";
		doc.setIsRealDoc(false);
		content = readVirtualDocContent(repos, doc);
				
		if(content == null)
		{
			content = "";
		}
		
		writeText(status+content, response);
		
	}

	/****************   get Tmp Saved Document Content ******************/
	@RequestMapping("/getTmpSavedDocContent.do")
	public void getTmpSavedDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){
		Log.infoHead("*************** getTmpSavedDocContent [" + path + name + "] ********************");
		Log.info("getTmpSavedDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);

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
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		Log.infoHead("*************** deleteTmpSavedDocContent [" + path + name + "] ********************");
		Log.info("deleteTmpSavedDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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

	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("*************** getDoc [" + path + name + "] ********************");
		Log.info("getDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
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
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
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
			docSysErrorLog("文件 " + path+name + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		doc.setType(dbDoc.getType());
		doc.setSize(dbDoc.getSize());
		doc.setCreateTime(dbDoc.getCreateTime());
		doc.setLatestEditTime(dbDoc.getLatestEditTime());
			
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
		Log.infoHead("*************** getDocRS [" + path + name + "] ********************");
		Log.info("getDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name);

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
			Doc doc = buildBasicDoc(null, null, null, "", path, name, null, 2, true, remoteDirectory, null, 0L, null);
			Doc localDoc = fsGetDoc(vRepos, doc);
			rt.setData(localDoc);
			writeJson(rt, response);			
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		//检查用户是否有文件读取权限
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		if(checkUseAccessRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			Log.debug("getDocRS() you have no access right on doc:" + doc.getDocId());
			writeJson(rt, response);	
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Doc tmpDoc = docSysGetDoc(repos, doc, false);
		if(tmpDoc == null || tmpDoc.getType() == null || tmpDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		rt.setData(tmpDoc);
		writeJson(rt, response);
	}
	
	@RequestMapping("/downloadDocRS.do")
	public void downloadDocRS(Integer reposId, String remoteDirectory, String path, String name,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)	throws Exception
	{
		Log.infoHead("*************** downloadDocRS [" + path + name + "] ********************");
		Log.info("downloadDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null, rt) == null)
		{
			//docSysErrorLog("无效授权码或授权码已过期！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(path == null || name == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		path = new String(path.getBytes("ISO8859-1"),"UTF-8");	
		path = Base64Util.base64Decode(path);
		if(path == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
	
		name = new String(name.getBytes("ISO8859-1"),"UTF-8");	
		name = Base64Util.base64Decode(name);
		if(name == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		//Get SubDocList From Server Dir
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径不能为空！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());		
			}
			remoteDirectory = new String(remoteDirectory.getBytes("ISO8859-1"),"UTF-8");	
			remoteDirectory = Base64Util.base64Decode(remoteDirectory);
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径解码失败！", rt);
				//writeJson(rt, response);			
				//return;
				throw new Exception(rt.getMsgInfo());
			}
			sendTargetToWebPage(remoteDirectory + path, name, remoteDirectory + path, rt, response, request,false, null);
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限下载文件
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		if(checkUserDownloadRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		downloadDocPrepare_FSM(repos, doc, reposAccess, false, rt);
		
		//目录下载准备中...
		Integer downloadPrepareStatus = (Integer) rt.getMsgData();
		if(downloadPrepareStatus != null && downloadPrepareStatus == 5)
		{
			DownloadPrepareTask task = (DownloadPrepareTask)rt.getData();
			String requestIP = getRequestIpAddress(request);
			executeDownloadPrepareTask(task, requestIP);
			switch(task.status)
			{
			case 2:
				Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), task.targetPath, task.targetName, 0);
				rt.setData(downloadDoc);
				rt.setMsgData(1);	//下载后（删除目标文件）
				//删除下载压缩任务
				downloadPrepareTaskHashMap.remove(task.id);
				//用户必须在20小时内完成下载
				addDelayTaskForCompressFileDelete(task.targetPath, task.targetName, 72000L); //20小时后删除压缩文件
				break;
			default:
				//删除下载压缩任务
				downloadPrepareTaskHashMap.remove(task.id);
				rt.setError("目录压缩失败(ErrorCode:" + task.status + ")");
				break;
			}
		}
			
		//rt里保存了下载文件的信息
		String status = rt.getStatus();
		if(status.equals("ok") == false)
		{
			Log.debug("downloadDocRS downloadDocPrepare failed:" + rt.getMsgInfo());
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		//注意downloadDoc中的targetPath和targetName都是Base64加密的，所以必须先解密（下面的流程与downloadDoc相同）
		Doc downloadDoc = (Doc) rt.getData();
		String targetPath = downloadDoc.targetPath;
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		String targetName = downloadDoc.targetName;	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
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
		Log.info("*************** getZipDocFileLink [" + path + name + "] ********************");		
		Log.info("getZipDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
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
		
		String authCode = addDocDownloadAuthCode(reposAccess, null);
		
		//TODO: 如果是视频文件，用于preview的情况下，需要进行转码，因此fileLink可能不是指向原始文件的，前端需要告知视频转换类型
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
	public void getDocFileLink(Integer reposId, String path, String name, 
			String commitId, Integer needDeletedEntry, Integer historyType,
			Integer shareId,
			String urlStyle,
			Integer forPreview,
			Integer videoConvertType,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("*************** getDocFileLink [" + path + name + "] ********************");		
		Log.info("getDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId + " forPreview:" + forPreview);

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
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		//如果是用于预览目的则不需要进行下载权限检查
		if(forPreview == null)
		{
			forPreview = 0;
		}
		if(forPreview != 1)
		{
			//检查用户是否有权限下载文件
			if(checkUserDownloadRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		doc.setShareId(shareId);
		path = doc.getPath();
		name = doc.getName();
		
		if(historyType == null)
		{
			historyType = HistoryType_RealDoc;
		}
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//前置类型仓库，需要先将文件CheckOut出来
			if(isFSM(repos) == false)
			{
				channel.remoteServerCheckOut(repos, doc, null, null, null, null, constants.PullType.pullRemoteChangedOrLocalChanged_SkipDelete, null);
			}
			
			Doc localDoc = fsGetDoc(repos, tmpDoc);
			if(localDoc.getType() != 1)
			{
				docSysErrorLog("不是文件", rt);
				writeJson(rt, response);			
				return;
			}
		}
		else
		{
			Doc remoteDoc = null;
			if(isFSM(repos))
			{
				remoteDoc = verReposGetDocEx(repos, doc, commitId, historyType);
			}
			else
			{
				remoteDoc = remoteServerGetDoc(repos, doc, commitId);					
			}
			
			if(remoteDoc == null)
			{
				docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
				writeJson(rt, response);			
				return;
			}
			
			if(remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				docSysErrorLog(name + " 是目录！", rt);
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
					verReposCheckOutEx(repos, doc, tempLocalRootPath, null, null, commitId, null, needDeletedEntry, true, historyType);
				}
				else
				{
					channel.remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);
				}
			}
			
			tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);	
			tmpDoc.setShareId(shareId);
		}
		
		String authCode = addDocDownloadAuthCode(reposAccess, null);

		//TODO: 如果是视频文件，用于preview的情况下，需要进行转码，因此fileLink可能不是指向原始文件的，前端需要告知视频转换类型，否则默认就是mp4
		if(forPreview == 1)
		{
			if(videoConvertType != null && videoConvertType == 1)
			{
				tmpDoc = convertVideoToMP4(repos, tmpDoc);
			}
		}
		
		String fileLink = buildDownloadDocLink(tmpDoc, authCode, urlStyle, 1, rt);
		if(fileLink == null)
		{
			Log.debug("getDocFileLink() buildDocFileLink failed");
			rt.setError("Failed to buildDocFileLink");
			writeJson(rt, response);
			return;
		}
		
		rt.setData(fileLink);
		writeJson(rt, response);
	}
	
	private Doc convertVideoToMP4(Repos repos, Doc doc) 
	{
		//TODO: 视频预览文件统一放到指定路径下
		String imgPreviewPath = Path.getReposTmpPathForVideoPreview(repos, doc.getPath(), doc.getName());
		Doc newDoc = generateVideoWithConvertType(doc.getLocalRootPath() + doc.getPath(), doc.getName(), imgPreviewPath, 1);
		if(newDoc == null)
		{
			return doc;
		}
		
		doc.setLocalRootPath(newDoc.getLocalRootPath());
		doc.setPath("");
		doc.setName(newDoc.getName());
		return doc;
	}

	@RequestMapping("/getDocFileLinkRS.do")
	public void getDocFileLink(Integer reposId, String path, String name, 
			String commitId, Integer needDeletedEntry, Integer historyType,
			Integer shareId,
			String authCode,
			String urlStyle,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("*************** getDocFileLinkRS [" + path + name + "] ********************");		
		Log.info("getDocFileLinkRS reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId);

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
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		//检查用户是否有文件读取权限
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		if(checkUseAccessRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			Log.debug("getDocRS() you have no access right on doc:" + doc.getDocId());
			writeJson(rt, response);	
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//前置类型仓库，需要先将文件CheckOut出来
			if(isFSM(repos) == false)
			{
				channel.remoteServerCheckOut(repos, doc, null, null, null, null, constants.PullType.pullRemoteChangedOrLocalChanged_SkipDelete, null);
			}
			
			Doc localDoc = fsGetDoc(repos, tmpDoc);
			if(localDoc.getType() != 1)
			{
				docSysErrorLog("不是文件", rt);
				writeJson(rt, response);			
				return;
			}
		}
		else
		{
			Doc remoteDoc = null;
			if(isFSM(repos))
			{
				remoteDoc = verReposGetDocEx(repos, doc, commitId, HistoryType_RealDoc);
			}
			else
			{
				remoteDoc = remoteServerGetDoc(repos, doc, commitId);					
			}
			
			if(remoteDoc == null)
			{
				docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
				writeJson(rt, response);			
				return;
			}
			
			if(remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				docSysErrorLog(name + " 是目录！", rt);
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
					verReposCheckOutEx(repos, doc, tempLocalRootPath, null, null, commitId, null, needDeletedEntry, true, historyType);
				}
				else
				{
					channel.remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);
				}
			}
			
			tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);	
			tmpDoc.setShareId(shareId);
		}
		
		String downloadAuthCode = addDocDownloadAuthCode(reposAccess, null);
		String fileLink = buildDownloadDocLink(tmpDoc, downloadAuthCode, urlStyle, 1, rt);
		if(fileLink == null)
		{
			Log.debug("getDocFileLinkRS() buildDocFileLink failed");
			rt.setError("Failed to buildDocFileLink");
			writeJson(rt, response);
			return;
		}
		
		rt.setData(fileLink);
		writeJson(rt, response);
	}

	/****************   lock a Doc ******************/
	@RequestMapping("/lockDoc.do")  //lock Doc主要用于用户锁定doc
	public void lockDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, Integer docType,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** lockDoc [" + path + name + "] ****************");
		Log.info("lockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null, rt) == null)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				writeJson(rt, response);		
				return;
			}
			reposAccess = getAuthCode(authCode).getReposAccess();
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
//			docSysErrorLog("docId is null", rt);
//			writeJson(rt, response);			
//			return;
//		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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

		boolean subDocCheckFlag = false;
		int lockDuration = 5*60*1000;	//用户只可以锁定10分钟，如果需要延长时间，则需要在10分钟内重新续签
		if(lockType == DocLock.LOCK_TYPE_FORCE)	//If want to force lock, must check all subDocs not locked
		{
			subDocCheckFlag = true;
		}
		
		DocLock docLock = null;
		//String lockInfo = "lockDoc() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		String lockInfo = "编辑 [" + doc.getPath() + doc.getName() + "]";
		docLock = lockDoc(doc, lockType, lockDuration, reposAccess.getAccessUser(), rt, subDocCheckFlag, lockInfo, EVENT.lockDoc);
		
		if(docLock == null)
		{
			docSysDebugLog("lockDoc() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);			
			writeJson(rt, response);
			
			addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "锁定文件",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		Log.debug("lockDoc : " + doc.getName() + " success");
		rt.setData(doc);
		writeJson(rt, response);	
		
		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "锁定文件",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
	}
	
	/****************   SyncLock.unlock a Doc ******************/
	@RequestMapping("/unlockDoc.do")  //SyncLock.unlock Doc主要用于用户解锁doc
	public void unlockDoc(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, Integer docType,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** unlockDoc [" + path + name + "] ****************");
		Log.info("unlockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null, rt) == null)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				writeJson(rt, response);		
				return;
			}
			reposAccess = getAuthCode(authCode).getReposAccess();
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
//			docSysErrorLog("SyncLock.unlockDoc docId is null", rt);
//			writeJson(rt, response);			
//			return;
//		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		//正常情况下unlockDoc是不需要上锁的，因为都是已经取到锁的情况下解锁，所以肯定不会冲突，但这里比较特殊是尝试直接解锁
		String lockInfo = "unlockDoc() syncLock";
		String lockName = "syncLock";
		Boolean isForceUnlockAllow = false;
		synchronized(syncLock)
		{
    		redisSyncLockEx(lockName, lockInfo);
    		
    		isForceUnlockAllow = isForceUnlockAllow(doc, lockType, reposAccess.getAccessUser());
			if(isForceUnlockAllow)
			{				
				//强行解锁是直接删除锁
				deleteDocLock(doc);
				Log.debug("unlockDoc() superAdmin force unlock " + doc.getName() + " success");
			}
			else
			{
				//解锁不需要检查子目录的锁定，因为不会影响子目录
				if(checkDocLocked(doc, lockType, reposAccess.getAccessUser(), false, rt))
				{
					redisSyncUnlockEx(lockName, lockInfo, syncLock);
					writeJson(rt, response);
					return;
				}
				
				unlockDoc(doc, lockType, reposAccess.getAccessUser());
				Log.debug("unlockDoc() unlock " + doc.getName() + " success");
			}	
			
			redisSyncUnlockEx(lockName, lockInfo, syncLock);
		}
		
		rt.setData(doc);
		writeJson(rt, response);	

		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "解锁文件",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
	}
	
	private boolean isForceUnlockAllow(Doc doc, Integer lockType, User accessUser) {
		
		if(accessUser.getType() == null || accessUser.getType() < 2)	//超级管理员才可以强行解锁
		{
			Log.debug("isForceUnlockAllow() " + accessUser.getName() + " is not superAdmin");
			return false;
		}
		
		DocLock docLock = getDocLock(doc);
		if(docLock == null)
		{
			return true;
		}
		
		//必须ForceLock和NormalLock同时满足条件才可以强制解锁
		//check forceLock createTime
		long curTime = new Date().getTime();
		Long forceLockCreateTime = docLock.createTime[DocLock.LOCK_TYPE_FORCE];
		if(forceLockCreateTime != null)
		{
			//5分钟内不允许强行解锁
			if((curTime - forceLockCreateTime) < 5*60*1000)
			{
				Log.debug("isForceUnlockAllow() file was force locked, lock time less than 5 minutes:" + (curTime - forceLockCreateTime));
				return false;
			}
		}
		
		//check NormalLock
		if(lockType != DocLock.LOCK_TYPE_FORCE)
		{
			Long createTime = docLock.createTime[lockType];
			if(createTime != null)
			{
				//5分钟内不允许强行解锁
				if((curTime - createTime) < 5*60*1000)
				{
					Log.debug("isForceUnlockAllow() file was locked, lock time less than 5 minutes:" + (curTime - createTime));
					return false;
				}
			}
		}
		
		return true;
	}

	/****************   get Document History (logList) ******************/
	@RequestMapping("/getDocHistory.do")
	public void getDocHistory(
			Integer reposId, 
			Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer historyType,
			Integer maxLogNum,
			String commitId,	//获取该commitId更早的历史
			Integer shareId,
			String authCode,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getDocHistory [" + path + name + "] ****************");
		Log.info("getDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null, rt) == null)
			{
				Log.debug("getDocHistory checkAuthCode Failed");
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				writeJson(rt, response);		
				return;
			}
			reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else		
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		}	
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(historyType == null)
		{
			historyType = HistoryType_RealDoc;
		}
		
		if(historyType == HistoryType_VirtualDoc)
		{
			getVirtualDocHistory(
					repos, 
					docId, pid, path, name, level, type, 
					maxLogNum,
					commitId,
					shareId, 
					rt, 
					session, request, response);
			return;
		}
		
		switch(historyType)
		{
		case HistoryType_RecycleBin:
			if(channel.isAllowedAction("recycleBin", rt) == false)	//检查回收站功能
			{
				writeJson(rt, response);
				return;
			}	
			break;
		}
		
		getRealDocHistory(
				repos, 
				docId, pid, path, name, level, type, 
				maxLogNum,
				commitId,
				shareId, 
				rt, 
				session, request, response, historyType);
		
	}

	private void getRealDocHistory(
			Repos repos, 
			Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer maxLogNum,
			String commitId,	//获取该commitId更早的历史
			Integer shareId,
			ReturnAjax rt,
			HttpSession session, HttpServletRequest request,HttpServletResponse response, int historyType)
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc inputDoc = doc;	
		int num = 100;
		if(maxLogNum != null)
		{
			num = maxLogNum;
		}
		
		List<LogEntry> logList = null;
		if(commitId == null || commitId.isEmpty())
		{
			commitId = null;
		}
		
		if(isFSM(repos))
		{
			logList = getCommitHistoryEx(repos, inputDoc, num, commitId, historyType);
		}
		else
		{
			logList = channel.remoteServerGetHistory(repos, inputDoc, num, commitId);
		}
		
		rt.setData(logList);
		writeJson(rt, response);
	}
	
	private void getVirtualDocHistory(
			Repos repos, 
			Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer maxLogNum,
			String commitId,	//获取该commitId更早的历史
			Integer shareId,
			ReturnAjax rt,
			HttpSession session, HttpServletRequest request,HttpServletResponse response) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc inputDoc = buildVDoc(doc);
		
		int num = 100;
		if(maxLogNum != null)
		{
			num = maxLogNum;
		}
		
		List<LogEntry> logList = null;
		if(commitId == null || commitId.isEmpty())
		{
			commitId = null;
		}
		
		logList = verReposGetHistoryLegacy(repos, false, inputDoc, num, commitId);
		
		rt.setData(logList);
		writeJson(rt, response);
	}

	/****************   get Document History Detail ******************/
	@RequestMapping("/getHistoryDetail.do")
	public void getHistoryDetail(
			Integer reposId, 
			Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			Integer shareId,
			String authCode,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getHistoryDetail [" + path + name + "] ****************");
		Log.info("getHistoryDetail reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null, rt) == null)
			{
				Log.debug("getHistoryDetail checkAuthCode Failed");
				//docSysErrorLog("无效授权码或授权码已过期！", rt);
				writeJson(rt, response);		
				return;
			}
			reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else		
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		}
		
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(historyType == null)
		{
			historyType = HistoryType_RealDoc;
		}
		if(historyType == HistoryType_VirtualDoc)
		{
			getVirtualDocHistoryDetail(
					repos, 
					docId, pid, path, name, level, type, 
					commitId,
					shareId, 
					rt, 
					session, request, response);
			return;	
		}
		
		if(commitId == null || commitId.isEmpty())
		{
			commitId = verReposGetLatestReposCommitIdEx(repos, historyType);
			if(commitId == null)
			{
				docSysErrorLog("该仓库暂无历史数据", rt);
				return;
			}
		}
		
		getRealDocHistoryDetail(
				repos, 
				docId, pid, path, name, level, type, 
				commitId,
				shareId, 
				rt, 
				session, request, response, historyType);
	}

	private void getRealDocHistoryDetail(
			Repos repos, 
			Long docId, Long pid, String path, String name, Integer level, Integer type, 
			String commitId, 
			Integer shareId, 
			ReturnAjax rt, 
			HttpSession session, HttpServletRequest request, HttpServletResponse response,
			int histortyType) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		List<ChangedItem> changedItemList = null;
		if(isFSM(repos))
		{
			changedItemList = verReposGetHistoryDetailEx(repos, doc, commitId, histortyType);				
		}
		else
		{
			changedItemList = channel.remoteServerGetHistoryDetail(repos, doc, commitId);
		}
		
		if(changedItemList == null)
		{
			Log.debug("getHistoryDetail 该版本没有文件改动");
		}
		rt.setData(changedItemList);
		
		writeJson(rt, response);
		
	}

	private void getVirtualDocHistoryDetail(
			Repos repos, 
			Long docId, Long pid, String path, String name, Integer level, Integer type, 
			String commitId, 
			Integer shareId, 
			ReturnAjax rt, 
			HttpSession session, HttpServletRequest request, HttpServletResponse response) 
	{
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		Doc inputDoc = buildVDoc(doc);
		
		List<ChangedItem> changedItemList = verReposGetHistoryDetailLegacy(repos, false, inputDoc, commitId, HistoryType_VirtualDoc);
		
		if(changedItemList == null)
		{
			Log.debug("getHistoryDetail 该版本没有文件改动");
		}
		rt.setData(changedItemList);
		
		writeJson(rt, response);
	}

	/**************** download History Doc  *****************/
	@RequestMapping("/downloadHistoryDocPrepare.do")
	public void downloadHistoryDocPrepare(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId, 
			String entryPath,
			Integer downloadAll,
			Integer needDeletedEntry,	//0: 不下载被删除的文件  1: 需要下载被删除的文件
			Integer historyType, 
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadHistoryDocPrepare [" + path + name + "] ****************");
		Log.info("downloadHistoryDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId: " + commitId + " entryPath:" + entryPath+ " shareId:" + shareId + " downloadAll:" + downloadAll + " needDeletedEntry:" + needDeletedEntry);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//get reposInfo to 
		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		String targetName =  commitId + "_" + name;
		List <Doc> successDocList = null;
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		
		//Real Doc history download
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
			
			Log.printObject("downloadHistoryDocPrepare() doc:",doc);

			if(doc.getName().isEmpty())
			{
				targetName =  commitId + "_" + repos.getName();	
			}
			else
			{
				targetName = commitId + "_" + doc.getName();							
			}
			
			//创建下载准备任务
			Integer prepareTaskType = 2; //download verRepos's folder or file
			if(isFSM(repos) == false)
			{
				prepareTaskType = 3; //download remoteServer's folder or file
				//successDocList = remoteServerCheckOut(repos, doc, userTmpDir, userTmpDir, targetName, commitId, true, true, downloadList);					
			}
			else
			{
				prepareTaskType = 2; //download verRepos's folder or file
				//successDocList = verReposCheckOut(repos, false, doc, userTmpDir, targetName, commitId, true, true, downloadList) ;
			}
			
			String compressTargetPath = userTmpDir;
			String compressTargetName = targetName + ".zip";
			if(targetName.isEmpty())
			{
				compressTargetName = repos.getName() + ".zip";
			}
			DownloadPrepareTask downloadPrepareTask = createDownloadPrepareTask(
					repos,
					doc,
					reposAccess,
					null,
					null,
					false,
					compressTargetPath,
					compressTargetName,
					prepareTaskType, 
					rt);
			
			if(downloadPrepareTask == null)
			{
				//下载准备任务创建失败
				Log.info("downloadHistoryDocPrepare() 下载准备任务创建失败");
				writeJson(rt, response);	
				return;
			}
				
			//通知前端下载准备中...
			downloadPrepareTask.downloadAll = downloadAll;
			downloadPrepareTask.needDeletedEntry = needDeletedEntry;
			downloadPrepareTask.commitId = commitId;
			downloadPrepareTask.historyType = historyType;
			rt.setData(downloadPrepareTask);
			rt.setMsgData(5);
			writeJson(rt, response);
				
			//执行下载准备任务...
			new Thread(new Runnable() {
				DownloadPrepareTask task = (DownloadPrepareTask)rt.getData();
				String requestIP = getRequestIpAddress(request);
				public void run() {
						Log.debug("downloadDocPrepare() executeDownloadPrepareTask in new thread");
						executeDownloadPrepareTask(task, requestIP);
					}
				}).start();
			return;
		}
		
		
		//Virtual History Doc download
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
			targetName =  commitId + "_" + repos.getName() + "_备注";					
		}
		else
		{
			targetName = commitId + "_" + vDoc.getName();
		}
			
		HashMap<String, String> downloadList = null;
		if(downloadAll == null || downloadAll == 0)
		{
			downloadList  = new HashMap<String,String>();
		}
		getEntryListForCheckOutLegacy(repos, false, vDoc, commitId, downloadList, null, HistoryType_VirtualDoc);
		if(downloadList != null && downloadList.size() == 0)
		{
			docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 未改动",rt);
			writeJson(rt, response);	
			return;
		}
			
		successDocList = verReposCheckOutLegacy(repos, false, vDoc, userTmpDir, targetName, commitId, true, downloadList, HistoryType_VirtualDoc);
		if(successDocList == null)
		{
			docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 不存在",rt);
			docSysDebugLog("verReposCheckOut Failed path:" + vDoc.getPath() + " name:" + vDoc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
			writeJson(rt, response);	
			return;
		}
		
		Log.printObject("downloadHistoryDocPrepare checkOut successDocList:", successDocList);
		Log.debug("downloadHistoryDocPrepare targetPath:" + userTmpDir + " targetName:" + targetName);
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), userTmpDir, targetName, isRealDoc?1:0);	
		rt.setData(downloadDoc);
		rt.setMsgData(1);
		writeJson(rt, response);	
		
		addSystemLog(request, reposAccess.getAccessUser(), "downloadHistoryDocPrepare", "downloadHistoryDocPrepare", "下载历史文件",  taskId, "成功", repos, doc, null, "历史版本:" + commitId);	
	}
	
	/****************   revert Document History ******************/	
	@RequestMapping("/revertDocHistory.do")
	public void revertDocHistory(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			String entryPath,
			Integer downloadAll,
			Integer needDeletedEntry,
			String commitMsg,
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** revertDocHistory [" + path + name + "] ****************");
		Log.info("revertDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath+ " shareId:" + shareId + " downloadAll:" + downloadAll +  " needDeletedEntry:" + needDeletedEntry);

		//如果entryPath非空则表示实际要还原的entry要以entryPath为准 
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(reposId == null)
		{
			docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		
		if(downloadAll == null)
		{
			downloadAll = 0;
		}
		
		if(needDeletedEntry == null)
		{
			needDeletedEntry = 1;
		}
		
		if(historyType == null)
		{
			historyType = HistoryType_RealDoc;
		}
		
		if(historyType == HistoryType_VirtualDoc)
		{
			revertVirtualDocHistory(
					taskId, 
					repos, 
					docId, pid, path, name, level, type, 
					commitId, 
					entryPath, 
					downloadAll,
					needDeletedEntry,
					commitMsg, 
					reposAccess, 
					rt, 
					session, request, response);
			return;
		}
		
		switch(historyType)
		{
		case HistoryType_LocalBackup:
		case HistoryType_RemoteBackup:
			if(channel.isAllowedAction("recoverBackup", rt) == false)	//备份恢复功能检查
			{
				writeJson(rt, response);
				return;
			}	
			break;
		case HistoryType_RecycleBin:
			if(channel.isAllowedAction("recycleBin", rt) == false)	//检查回收站功能
			{
				writeJson(rt, response);
				return;
			}
			break;
		}
		
		revertRealDocHistory(
				taskId, 
				repos, 
				docId, pid, path, name, level, type, 
				commitId, 
				entryPath, 
				downloadAll,
				needDeletedEntry,
				commitMsg, 
				reposAccess, 
				rt, 
				session, request, response,
				historyType);
	}

	/****************   set  Doc RemoteStorage Ignore ******************/
	@RequestMapping("/setRemoteStorageIgnore.do")
	public void setRemoteStorageIgnore(
			String taskId,
			Integer reposId, String path, String name,
			Integer ignore,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setRemoteStorageIgnore [" + path + name + "] ****************");
		Log.info("setRemoteStorageIgnore reposId:" + reposId + " path:" + path + " name:" + name  + " ignore:" + ignore);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		if(repos.remoteStorageConfig == null)
		{
			rt.setError("该仓库未设置远程存储，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		
		//设置文件密码
		if(setRemoteStorageIgnore(repos, doc, ignore) == false)
		{
			rt.setError("远程存储忽略设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteStorageIgnore", "setRemoteStorageIgnore", "远程存储忽略设置",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteStorageIgnore", "setRemoteStorageIgnore", "远程存储忽略设置",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		writeJson(rt, response);
	}
	
	private boolean setRemoteStorageIgnore(Repos repos, Doc doc, Integer ignore) {
		String reposRemoteStorageConfigPath = Path.getReposRemoteStorageConfigPath(repos);
		String ignoreFilePath = reposRemoteStorageConfigPath + doc.getPath() + doc.getName();
		String ignoreFileName = ".ignore";
		if(ignore != null && ignore == 1)
		{
			//将ignore路径加入到repos的ignore HashMap中			
			if(FileUtil.createFile(ignoreFilePath, ignoreFileName) == true)
			{
				if(repos.remoteStorageConfig.ignoreHashMap == null)
				{
					repos.remoteStorageConfig.ignoreHashMap = new ConcurrentHashMap<String, Integer>(); 
				}
				repos.remoteStorageConfig.ignoreHashMap.put("/" + doc.getPath() + doc.getName(), 1);
				setReposRemoteStorageConfig(repos, repos.remoteStorageConfig);
				return true;
			}
			return false;
		}
		
		//将ignore从repos的ignore HashMap中删除
		if(FileUtil.delFile(ignoreFilePath +  "/" + ignoreFileName) == true)
		{
			if(repos.remoteStorageConfig.ignoreHashMap != null)
			{
				repos.remoteStorageConfig.ignoreHashMap.remove("/" + doc.getPath() + doc.getName());
				setReposRemoteStorageConfig(repos, repos.remoteStorageConfig);
			}
			return true;			
		}
		return false;
	}
	
	@RequestMapping("/getRemoteStorageIgnore.do")
	public void getRemoteStorageIgnore(
			Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("************** getRemoteStorageIgnore [" + path + name + "] ****************");
		Log.info("getRemoteStorageIgnore reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(repos.remoteStorageConfig == null)
		{
			rt.setError("该仓库未设置远程存储，请联系管理员!");			
			writeJson(rt, response);
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		rt.setData(getRemoteStorageIgnore(repos, doc));			
		writeJson(rt, response);
	}
	
	private Integer getRemoteStorageIgnore(Repos repos, Doc doc) {
		if(repos.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			return 1;
		}
		return 0;
	}
	
	@RequestMapping("/getRemoteStorageIgnoreList.do")
	public void getRemoteStorageIgnoreList(Integer reposId, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getRemoteStorageIgnoreList ****************");
		Log.info("getRemoteStorageIgnoreList reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(repos.remoteStorageConfig == null)
		{
			rt.setError("该仓库未设置远程存储，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		String configPath = Path.getReposRemoteStorageConfigPath(repos);
		List<Doc> ignoreList = getRemoteStorageIgnoreList(repos, doc, configPath, null);
		
		rt.setData(ignoreList);			
		writeJson(rt, response);
	}

	private List<Doc> getRemoteStorageIgnoreList(Repos repos, Doc doc, String configPath, List<Doc> ignoreList) {
		Log.info("*getRemoteStorageIgnoreList() reposId:" + repos.getId() + " [" + doc.getPath() + doc.getName() + "]");
		if(ignoreList == null)
		{
			ignoreList = new ArrayList<Doc>();
		}
		
		if(repos.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			ignoreList.add(doc);
		}
		
		String ignoreConfigEntryPath = configPath + doc.getPath() + doc.getName();
		File dir = new File(ignoreConfigEntryPath);
    	if(false == dir.exists())
    	{
    		Log.debug("getRemoteStorageIgnoreList() " +  ignoreConfigEntryPath + " 不存在！");
    		return ignoreList;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("getRemoteStorageIgnoreList() " + ignoreConfigEntryPath + " 不是目录！");
    		return ignoreList;
    	}

		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File subFile = localFileList[i];
    		if(subFile.isFile())
    		{
    			continue;
    		}
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc);    		
    		getRemoteStorageIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  LocalBackup Ignore ******************/
	@RequestMapping("/setLocalBackupIgnore.do")
	public void setLocalBackupIgnore(
			String taskId,
			Integer reposId, String path, String name,
			Integer ignore,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setLocalBackupIgnore [" + path + name + "] ****************");
		Log.info("setLocalBackupIgnore reposId:" + reposId + " path:" + path + " name:" + name  + " ignore:" + ignore);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		if(repos.autoBackupConfig == null || repos.autoBackupConfig.localBackupConfig == null)
		{
			rt.setError("该仓库未设置本地自动备份，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		
		if(setLocalBackupIgnore(repos, doc, ignore) == false)
		{
			rt.setError("本地自动备份忽略设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setLocalBackupIgnore", "setLocalBackupIgnore", "本地自动备份忽略设置",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setLocalBackupIgnore", "setLocalBackupIgnore", "本地自动备份忽略设置",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		writeJson(rt, response);
	}
	
	private boolean setLocalBackupIgnore(Repos repos, Doc doc, Integer ignore) {
		String configPath = Path.getReposLocalBackupConfigPath(repos);
		String ignoreFilePath = configPath + doc.getPath() + doc.getName();
		String ignoreFileName = ".ignore";
		if(ignore != null && ignore == 1)
		{
			//将ignore路径加入到repos的ignore HashMap中			
			if(FileUtil.createFile(ignoreFilePath, ignoreFileName) == true)
			{
				repos.autoBackupConfig.localBackupConfig.remoteStorageConfig.ignoreHashMap.put("/" + doc.getPath() + doc.getName(), 1);
				return true;
			}
			return false;
		}
		
		//将ignore从repos的ignore HashMap中删除
		if(FileUtil.delFile(ignoreFilePath +  "/" + ignoreFileName) == true)
		{
			repos.autoBackupConfig.localBackupConfig.remoteStorageConfig.ignoreHashMap.remove("/" + doc.getPath() + doc.getName());
			return true;			
		}
		return false;
	}
	
	@RequestMapping("/getLocalBackupIgnore.do")
	public void getLocalBackupIgnore(Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.info("************** getLocalBackupIgnore [" + path + name + "] ****************");
		Log.info("getLocalBackupIgnore reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		rt.setData(getLocalBackupIgnore(repos, doc));			
		writeJson(rt, response);
	}
	
	private Integer getLocalBackupIgnore(Repos repos, Doc doc) {
		if(repos.autoBackupConfig.localBackupConfig.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			return 1;
		}
		return 0;
	}
	
	@RequestMapping("/getLocalBackupIgnoreList.do")
	public void getLocalBackupIgnoreList(Integer reposId, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getLocalBackupIgnoreList ****************");
		Log.info("getLocalBackupIgnoreList reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		String configPath = Path.getReposLocalBackupConfigPath(repos);
		List<Doc> ignoreList = getLocalBackupIgnoreList(repos, doc, configPath, null);
		
		rt.setData(ignoreList);			
		writeJson(rt, response);
	}

	private List<Doc> getLocalBackupIgnoreList(Repos repos, Doc doc, String configPath, List<Doc> ignoreList) {
		Log.info("*getLocalBackupIgnoreList() reposId:" + repos.getId() + " [" + doc.getPath() + doc.getName() + "]");
		if(ignoreList == null)
		{
			ignoreList = new ArrayList<Doc>();
		}
		
		if(repos.autoBackupConfig.localBackupConfig.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			ignoreList.add(doc);
		}
		
		String ignoreConfigEntryPath = configPath + doc.getPath() + doc.getName();
		File dir = new File(ignoreConfigEntryPath);
    	if(false == dir.exists())
    	{
    		Log.debug("getLocalBackupIgnoreList() " +  ignoreConfigEntryPath + " 不存在！");
    		return ignoreList;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("getLocalBackupIgnoreList() " + ignoreConfigEntryPath + " 不是目录！");
    		return ignoreList;
    	}

		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File subFile = localFileList[i];
    		if(subFile.isFile())
    		{
    			continue;
    		}
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc);    		
    		getLocalBackupIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  RemoteBackup Ignore ******************/
	@RequestMapping("/setRemoteBackupIgnore.do")
	public void setRemoteBackupIgnore(
			String taskId,
			Integer reposId, String path, String name,
			Integer ignore,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setRemoteBackupIgnore [" + path + name + "] ****************");
		Log.info("setRemoteBackupIgnore reposId:" + reposId + " path:" + path + " name:" + name  + " ignore:" + ignore);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		if(repos.autoBackupConfig == null || repos.autoBackupConfig.remoteBackupConfig == null)
		{
			rt.setError("该仓库未设置远程自动备份，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		
		if(setRemoteBackupIgnore(repos, doc, ignore) == false)
		{
			rt.setError("远程自动备份忽略设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteBackupIgnore", "setRemoteBackupIgnore", "远程自动备份忽略设置",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteBackupIgnore", "setRemoteBackupIgnore", "远程自动备份忽略设置",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		writeJson(rt, response);
	}
	
	private boolean setRemoteBackupIgnore(Repos repos, Doc doc, Integer ignore) {
		String configPath = Path.getReposRemoteBackupConfigPath(repos);
		String ignoreFilePath = configPath + doc.getPath() + doc.getName();
		String ignoreFileName = ".ignore";
		if(ignore != null && ignore == 1)
		{
			//将ignore路径加入到repos的ignore HashMap中			
			if(FileUtil.createFile(ignoreFilePath, ignoreFileName) == true)
			{
				repos.autoBackupConfig.remoteBackupConfig.remoteStorageConfig.ignoreHashMap.put("/" + doc.getPath() + doc.getName(), 1);
				return true;
			}
			return false;
		}
		
		//将ignore从repos的ignore HashMap中删除
		if(FileUtil.delFile(ignoreFilePath +  "/" + ignoreFileName) == true)
		{
			repos.autoBackupConfig.remoteBackupConfig.remoteStorageConfig.ignoreHashMap.remove("/" + doc.getPath() + doc.getName());
			return true;			
		}
		return false;
	}
	
	@RequestMapping("/getRemoteBackupIgnore.do")
	public void getRemoteBackupIgnore(Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getRemoteBackupIgnore [" + path + name + "] ****************");
		Log.info("getRemoteBackupIgnore reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		rt.setData(getRemoteBackupIgnore(repos, doc));			
		writeJson(rt, response);
	}
	
	private Integer getRemoteBackupIgnore(Repos repos, Doc doc) {
		if(repos.autoBackupConfig.remoteBackupConfig.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			return 1;
		}
		return 0;
	}
	
	@RequestMapping("/getRemoteBackupIgnoreList.do")
	public void getRemoteBackupIgnoreList(Integer reposId, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getRemoteBackupIgnoreList ****************");
		Log.info("getRemoteBackupIgnoreList reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		String configPath = Path.getReposRemoteBackupConfigPath(repos);
		List<Doc> ignoreList = getRemoteBackupIgnoreList(repos, doc, configPath, null);
		
		rt.setData(ignoreList);			
		writeJson(rt, response);
	}

	private List<Doc> getRemoteBackupIgnoreList(Repos repos, Doc doc, String configPath, List<Doc> ignoreList) {
		Log.info("*getRemoteBackupIgnoreList() reposId:" + repos.getId() + " [" + doc.getPath() + doc.getName() + "]");
		if(ignoreList == null)
		{
			ignoreList = new ArrayList<Doc>();
		}
		
		if(repos.autoBackupConfig.remoteBackupConfig.remoteStorageConfig.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			ignoreList.add(doc);
		}
		
		String ignoreConfigEntryPath = configPath + doc.getPath() + doc.getName();
		File dir = new File(ignoreConfigEntryPath);
    	if(false == dir.exists())
    	{
    		Log.debug("getRemoteBackupIgnoreList() " +  ignoreConfigEntryPath + " 不存在！");
    		return ignoreList;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("getRemoteBackupIgnoreList() " + ignoreConfigEntryPath + " 不是目录！");
    		return ignoreList;
    	}

		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File subFile = localFileList[i];
    		if(subFile.isFile())
    		{
    			continue;
    		}
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc);    		
    		getRemoteBackupIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  RealDoc TextSearch Ignore ******************/
	@RequestMapping("/setTextSearchIgnore.do")
	public void setTextSearchIgnore(
			String taskId,
			Integer reposId, String path, String name,
			Integer ignore,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setTextSearchIgnore [" + path + name + "] ****************");
		Log.info("setTextSearchIgnore reposId:" + reposId + " path:" + path + " name:" + name  + " ignore:" + ignore);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		if(repos.textSearchConfig == null)
		{
			rt.setError("该仓库未开启全文搜索，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		
		if(setTextSearchIgnore(repos, doc, ignore) == false)
		{
			rt.setError("全文搜索忽略设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setTextSearchIgnore", "setTextSearchIgnore", "全文搜索忽略设置",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setTextSearchIgnore", "setTextSearchIgnore", "全文搜索忽略设置",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		writeJson(rt, response);
	}
	
	private boolean setTextSearchIgnore(Repos repos, Doc doc, Integer ignore) {
		String configPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
		String ignoreFilePath = configPath + doc.getPath() + doc.getName();
		String ignoreFileName = ".ignore";
		if(ignore != null && ignore == 1)
		{
			//将ignore路径加入到repos的ignore HashMap中			
			if(FileUtil.createFile(ignoreFilePath, ignoreFileName) == true)
			{
				repos.textSearchConfig.realDocTextSearchDisableHashMap.put("/" + doc.getPath() + doc.getName(), 1);				
				setReposTextSearchConfig(repos, repos.textSearchConfig);
				return true;
			}
			return false;
		}
		
		//将ignore从repos的ignore HashMap中删除
		if(FileUtil.delFile(ignoreFilePath +  "/" + ignoreFileName) == true)
		{
			repos.textSearchConfig.realDocTextSearchDisableHashMap.remove("/" + doc.getPath() + doc.getName());
			setReposTextSearchConfig(repos, repos.textSearchConfig);
			return true;			
		}
		return false;
	}
	
	@RequestMapping("/getTextSearchIgnore.do")
	public void getTextSearchIgnore(Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getTextSearchIgnore [" + path + name + "] ****************");
		Log.info("getTextSearchIgnore reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		rt.setData(getTextSearchIgnore(repos, doc));			
		writeJson(rt, response);
	}
	
	private Integer getTextSearchIgnore(Repos repos, Doc doc) {
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			return 1;
		}
		return 0;
	}
	
	@RequestMapping("/getTextSearchIgnoreList.do")
	public void getTextSearchIgnoreList(Integer reposId, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getTextSearchIgnoreList ****************");
		Log.info("getTextSearchIgnoreList reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		String configPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
		List<Doc> ignoreList = getTextSearchIgnoreList(repos, doc, configPath, null);
		
		rt.setData(ignoreList);			
		writeJson(rt, response);
	}

	private List<Doc> getTextSearchIgnoreList(Repos repos, Doc doc, String configPath, List<Doc> ignoreList) {
		Log.info("*getTextSearchIgnoreList() reposId:" + repos.getId() + " [" + doc.getPath() + doc.getName() + "]");
		if(ignoreList == null)
		{
			ignoreList = new ArrayList<Doc>();
		}
		
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			ignoreList.add(doc);
		}
		
		String ignoreConfigEntryPath = configPath + doc.getPath() + doc.getName();
		File dir = new File(ignoreConfigEntryPath);
    	if(false == dir.exists())
    	{
    		Log.debug("getTextSearchIgnoreList() " +  ignoreConfigEntryPath + " 不存在！");
    		return ignoreList;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("getTextSearchIgnoreList() " + ignoreConfigEntryPath + " 不是目录！");
    		return ignoreList;
    	}

		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File subFile = localFileList[i];
    		if(subFile.isFile())
    		{
    			continue;
    		}
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc);    		
    		getTextSearchIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  Doc Version Ignore ******************/
	@RequestMapping("/setVersionIgnore.do")
	public void setVersionIgnore(
			String taskId,
			Integer reposId, String path, String name,
			Integer ignore,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setVersionIgnore [" + path + name + "] ****************");
		Log.info("setVersionIgnore reposId:" + reposId + " path:" + path + " name:" + name  + " ignore:" + ignore);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
		
		//Integer verCtr = repos.getVerCtrl();
		//if(verCtr == null || verCtr == 0)
		//{
		//	rt.setError("该仓库未开启版本管理，请联系管理员!");			
		//	writeJson(rt, response);
		//	return;
		//}
		
		//设置文件密码
		if(setVersionIgnore(repos, doc, ignore) == false)
		{
			rt.setError("版本管理设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setVersionIgnore", "setVersionIgnore", "版本管理忽略设置",  taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setVersionIgnore", "setVersionIgnore", "版本管理忽略设置",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		writeJson(rt, response);
	}
	
	private boolean setVersionIgnore(Repos repos, Doc doc, Integer ignore) {
		String reposVersionIgnorePath = Path.getReposVersionIgnoreConfigPath(repos);
		String ignoreFilePath = reposVersionIgnorePath + doc.getPath() + doc.getName();
		String ignoreFileName = ".ignore";
		if(ignore != null && ignore == 1)
		{
			//将ignore路径加入到repos的ignore HashMap中			
			if(FileUtil.createFile(ignoreFilePath, ignoreFileName) == true)
			{
				if(repos.versionIgnoreConfig == null)
				{
					repos.versionIgnoreConfig = new VersionIgnoreConfig();
					repos.versionIgnoreConfig.versionIgnoreHashMap = new ConcurrentHashMap<String, Integer>(); 
				}
				repos.versionIgnoreConfig.versionIgnoreHashMap.put("/" + doc.getPath() + doc.getName(), 1);
				setReposVersionIgnoreConfig(repos, repos.versionIgnoreConfig);
				return true;
			}
			return false;
		}
		
		//将ignore从repos的ignore HashMap中删除
		if(FileUtil.delFile(ignoreFilePath +  "/" + ignoreFileName) == true)
		{
			if(repos.versionIgnoreConfig != null)
			{
				repos.versionIgnoreConfig.versionIgnoreHashMap.remove("/" + doc.getPath() + doc.getName());
				setReposVersionIgnoreConfig(repos, repos.versionIgnoreConfig);
			}
			return true;			
		}
		return false;
	}
	
	@RequestMapping("/getVersionIgnore.do")
	public void getVersionIgnore(Integer reposId, String path, String name,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getVersionIgnore [" + path + name + "] ****************");
		Log.info("getVersionIgnore reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		rt.setData(getVersionIgnore(repos, doc));			
		writeJson(rt, response);
	}
	
	private Integer getVersionIgnore(Repos repos, Doc doc) {
		if(repos.versionIgnoreConfig == null || repos.versionIgnoreConfig.versionIgnoreHashMap == null)
		{
			return 0;
		}
		if(repos.versionIgnoreConfig.versionIgnoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			return 1;
		}
		return 0;
	}
	
	@RequestMapping("/getVersionIgnoreList.do")
	public void getVersionIgnoreList(Integer reposId, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getVersionIgnoreList ****************");
		Log.info("getVersionIgnoreList reposId:" + reposId + " path:" + path + " name:" + name);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		String reposVersionIgnoreSettingPath = Path.getReposVersionIgnoreConfigPath(repos);
		List<Doc> ignoreList = getVersionIgnoreList(repos, doc, reposVersionIgnoreSettingPath, null);
		
		rt.setData(ignoreList);			
		writeJson(rt, response);
	}

	private List<Doc> getVersionIgnoreList(Repos repos, Doc doc, String reposVersionIgnoreSettingPath, List<Doc> ignoreList) {
		Log.info("*getVersionIgnoreList() reposId:" + repos.getId() + " [" + doc.getPath() + doc.getName() + "]");
		if(ignoreList == null)
		{
			ignoreList = new ArrayList<Doc>();
		}
		
		if(repos.versionIgnoreConfig == null ||repos.versionIgnoreConfig.versionIgnoreHashMap == null)
		{
			return ignoreList;
		}
		
		if(repos.versionIgnoreConfig.versionIgnoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			ignoreList.add(doc);
		}
		
		String ignoreConfigEntryPath = reposVersionIgnoreSettingPath + doc.getPath() + doc.getName();
		File dir = new File(ignoreConfigEntryPath);
    	if(false == dir.exists())
    	{
    		Log.debug("getVersionIgnoreList() " +  ignoreConfigEntryPath + " 不存在！");
    		return ignoreList;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("getVersionIgnoreList() " + ignoreConfigEntryPath + " 不是目录！");
    		return ignoreList;
    	}

		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File subFile = localFileList[i];
    		if(subFile.isFile())
    		{
    			continue;
    		}
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc);    		
    		getVersionIgnoreList(repos, subDoc, reposVersionIgnoreSettingPath, ignoreList);
    	}
    	return ignoreList;
	}

	/****************   set  Doc Access PWD ******************/
	@RequestMapping("/setDocPwd.do")
	public void setDocPwd(
			String taskId,
			Integer reposId, String path, String name,
			String pwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** setDocPwd [" + path + name + "] ****************");
		Log.info("setDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(reposCheck(repos, rt, response) == false)
		{
			return;
		}

		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

		//获取并检查用户权限（只有可编辑权限的用户才可以设置密码）
		DocAuth docAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, null);
		if(docAuth == null || docAuth.getEditEn() == null || docAuth.getEditEn() == 0)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);
			return;
		}
		
		//仓库管理员可以直接修改，非仓库管理员必须提供旧的密码
		Integer access = docAuth.getAccess();
		Integer isAdmin = docAuth.getIsAdmin();
		if(access == null || isAdmin == null || isAdmin.equals(0) || access.equals(0))
		{
			String oldPwd = getDocPwd(repos, doc);
			if(oldPwd != null && !oldPwd.isEmpty())
			{
				//Do check the sharePwd
				String docPwdInSession = (String) session.getAttribute("docPwd_" + reposId + "_" + doc.getDocId());
				if(docPwdInSession == null || docPwdInSession.isEmpty() || !docPwdInSession.equals(oldPwd))
				{
					docSysErrorLog("设置失败：请先提供旧的访问密码！", rt);
					rt.setMsgData("1"); //访问密码错误或未提供
					rt.setData(doc);
					writeJson(rt, response);
					return;
				}
			}				
			//rt.setError("您无权访问该文件，请联系管理员");
			//writeJson(rt, response);
			//return;
		}			
		
		//设置文件密码
		if(setDocPwd(repos, doc, pwd) == false)
		{
			rt.setError("您无权访问该文件，请联系管理员");			
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setDocPwd", "setDocPwd", "设置文件访问密码",  taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
		Log.infoHead("************** verifyDocPwd [" + path + name + "] ****************");
		Log.info("verifyDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		//密码验证的时候不检查是否进行了非法路径访问，因此path设置为null
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, null, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = getReposEx(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
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
	
	/****************   add a DocShare ******************/
	@RequestMapping("/getDocShareList.do")
	public void getDocShareList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getDocShareList ****************");
		
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
	
	/****************   verifyDocSharePwd ******************/
	@RequestMapping("/verifyDocSharePwd.do")
	public void verifyDocSharePwd(Integer shareId, String sharePwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** verifyDocSharePwd ****************");		
		Log.info("verifyDocSharePwd shareId:" + shareId + " sharePwd:" + sharePwd);
		
		ReturnAjax rt = new ReturnAjax();
			
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String pwd = docShare.getSharePwd();
		if(pwd != null && !pwd.isEmpty())
		{
			if(sharePwd == null || sharePwd.isEmpty() || !sharePwd.equals(pwd))
			{
				docSysErrorLog("密码错误！", rt);
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
		Log.infoHead("************** getDocShare ****************");				
		Log.info("getDocShare shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
			
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			docSysErrorLog("分享信息不存在！", rt);
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
				docSysErrorLog("分享密码错误！", rt);
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
		Log.infoHead("************** searchDoc [" + path + "] ****************");				
		Log.info("searchDoc reposId:" + reposId + " pid:" + pid + " path:" + path + " searchWord:" + searchWord + " sort:" + sort+ " shareId:" + shareId + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		
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
			Repos repos = getReposEx(reposId);
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
		
		//这里是多线程搜索接口
		DocSearchContext searchContext = new DocSearchContext();
		searchContext.pid = pid;
		searchContext.path = path;
		searchContext.searchWord = searchWord;
		searchContext.sort = sort;
		channel.searchDocAsync(reposList, searchContext);
		
		//对搜索结果进行统一排序
		List<Doc> searchResult = searchContext.result;
		Collections.sort(searchResult);
		Integer total = searchResult.size();
		rt.setData(searchResult);
		rt.setDataEx(total);
		writeJson(rt, response);
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
	
	/****************   get Zip InitMenu ******************/
	@RequestMapping("/getZipInitMenu.do")
	public void getZipInitMenu(Integer reposId, String docPath, String docName, //zip File Info
			String path, String name,	//relative path in zipFile
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getZipInitMenu ****************");				
		Log.info("getZipInitMenu reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
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
				
		List <Doc> docList = new ArrayList<Doc>();
		
		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		docList.add(rootDoc);
		
		//rootZipDoc如果不存在，需要尝试从远程先下载
		Doc localEntry = fsGetDoc(repos, rootDoc);
		if(localEntry.getType() == 0)
		{	
			if(isFSM(repos) == false)
			{
				channel.remoteServerCheckOut(repos, rootDoc, null, null, null, null, constants.PullType.pullRemoteChangedOrLocalChanged_SkipDelete, null);
			}
		}
		
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
		Log.info(" ******* getZipSubDocList [" + path + name + "] ******");
		Log.info("getZipSubDocList reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
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
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc rootDoc = buildBasicDoc(reposId, null, null, reposPath, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
		
		List <Doc> subDocList = null;
		if(FileUtil.isCompressFile(name) == false)
		{
			//目前压缩文件的目录是一次性获取的，理论上不存在需要再获取子目录的问题，所以下面这段代码暂不执行，以避免出现套娃现象
			//String relativePath = getZipRelativePath(path, rootDoc.getPath() + rootDoc.getName() + "/");
			//Log.debug("getZipSubDocList relativePath: " + relativePath);
			//subDocList = getZipSubDocList(repos, tempRootDoc, tempRootDoc.getPath(), tempRootDoc.getName(), rt);
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
	
	//系统日志精确查询
	@RequestMapping("/querySystemLog.do")
	public void querySystemLog(
			String id, 
			String event, 
			String reposName, String path, String name, 
			String userId, String userName,
			String queryId,			
			String authCode,
			Long startTime, Long endTime,
			HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("*********** querySystemLog *******************");
		Log.info("querySystemLog id: " + id + " event: " + event  
				+ " reposName:" + reposName + " path:" + path + " name:"+ name 
				+ " userId:"+ userId + " userName:"+ userName 
				+ " queryId:" + queryId);
		
		ReturnAjax rt = new ReturnAjax();
		
		User accessUser = userAccessCheck(authCode, null, session, rt);
		if(accessUser == null) 
		{
			writeJson(rt, response);
			return;
		}

		SystemLog queryLog = new SystemLog();
		queryLog.id = id;
		queryLog.event = event;
		queryLog.reposName = reposName;
		queryLog.path = path;
		queryLog.name = name;
		queryLog.queryId = queryId;
		queryLog.userId = userId;
		queryLog.userName = userName;
		
		List<SystemLog> list = channel.getSystemLogList(queryLog, startTime, endTime);
		Log.debug("getSystemLogList() total:" + list.size());
		
		rt.setData(list);
		rt.setDataEx(list.size());
        writeJson(rt, response);
	}
	
	/* 
	 *   大文件搜索启动接口
	 *   该接口将会触发大文件搜索任务，相同的目录6小时内只会启动一次
	 */
	@RequestMapping("/startLargeFileScanTask.do")
	public void startLargeFileScanTask(
			String taskId,				//taskId was used to save to systemLog
			String storageType,			//disk / repos
			Integer reposId, 			//For repos
			String localDiskPath,		//For disk
			String path,				//指定仓库或磁盘路径下的扫描文件
			String sort,				//排序方案
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** startLargeFileScanTask.do ***********************");
		Log.debug("startLargeFileScanTask() storageType: " + storageType + " reposId: " + reposId  + " localDiskPath:" + localDiskPath + " sort:"+ sort);
		
		ReturnAjax rt = new ReturnAjax();
		
		User accessUser = adminAccessCheck(authCode, "LargeFileScan", session, rt);
		if(accessUser == null) 
		{
			writeJson(rt, response);			
			return;
		}
		
		if(storageType == null || storageType.isEmpty())
		{
			Log.debug("startLargeFileScanTask() storageType is null");
			docSysErrorLog("未指定扫描类型", rt);
			writeJson(rt, response);			
			return;			
		}
		
		String sacnTaskId = "";
		switch(storageType)
		{
		case "disk":
			localDiskPath = Path.localDirPathFormat(localDiskPath, OSType);
			if(path == null)
			{
				path = "";
			}
			else
			{
				path = Path.dirPathFormat(path);
			}
			sacnTaskId = storageType + "_" + (localDiskPath + path).hashCode();
			break;
		//case "repos":
		//	path = Path.dirPathFormat(path);
		//	sacnTaskId = storageType + "_" + (reposId + path).hashCode();
		//	break;		
		default:
			Log.debug("startLargeFileScanTask() 未知扫描类型:" + storageType);
			docSysErrorLog("未知扫描类型", rt);
			writeJson(rt, response);						
			return;
		}
		
		//判断扫描任务是否已启动且有效
		LargeFileScanTask scanTask = getLargeFileScanTaskById(sacnTaskId);
		if(scanTask != null)
		{
			rt.setData(scanTask);	
			writeJson(rt, response);
			return;
		}
		
		//判断扫描结果是否已经存在且有效		
		scanTask = createLargeFileScanTask(sacnTaskId, storageType, reposId, localDiskPath, path, sort, rt);
		if(scanTask == null)
		{
			Log.info("startLargeFileScanTask() 大文件扫描任务创建失败");
			writeJson(rt, response);						
			return;
		}
				
		rt.setData(scanTask);	
		writeJson(rt, response);
		
		new Thread(new Runnable() {
			LargeFileScanTask task = (LargeFileScanTask)rt.getData();
			//String requestIP = getRequestIpAddress(request);
			public void run() {
				Log.debug("startLargeFileScanTask() execute largetFileScanForDisk in new thread");
				//Start to scan
				largetFileScanForDisk(task);
			}
		}).start();
	}
	
	private LargeFileScanTask getLargeFileScanTaskById(String taskId) {
		return largeFileScanTaskHashMap.get(taskId);
	}
	
	private LargeFileScanTask createLargeFileScanTask(String taskId, String storageType, Integer reposId, String localDiskPath, String path,
			String sort, ReturnAjax rt) 
	{
		if(largeFileScanTaskHashMap.size() > 1000)
		{
			Log.info("createLargeFileScanTask() LargeFileScanTask 总数已超限，请检查您的系统是否正常");
			rt.setError("系统大文件扫描任务过多，请检查您的系统是否正常");
			return null;
		}

		long curTime = new Date().getTime();
        Log.info("createLargeFileScanTask() curTime:" + curTime);
		cleanExpiredLargeFileScanTask(curTime);
   
		LargeFileScanTask task = largeFileScanTaskHashMap.get(taskId);
		if(task != null)
		{
			Log.info("createLargeFileScanTask() LargeFileScanTask [" + taskId + "] 已存在");
			return task;
		}
		
		//create new task
		task =	new LargeFileScanTask();
		task.id = taskId;
		task.storageType = storageType;
		task.reposId = reposId;
		task.localDiskPath = localDiskPath;
		task.path = path;
		task.createTime = curTime;				
		task.status = 0;	//初始化 		
		task.info = "";
		largeFileScanTaskHashMap.put(taskId, task);	
		return task;
	}

	private void cleanExpiredLargeFileScanTask(long curTime) {
		if(largeFileScanTaskHashMap.size() < 100)
		{
			return;
		}

		List<String> deleteList = new ArrayList<String>();
		for (Entry<String, LargeFileScanTask> entry : largeFileScanTaskHashMap.entrySet()) 
		{
			LargeFileScanTask task = entry.getValue();
			if(task.status == 0)
			{
				//未开始的任务，如果超过10分钟，删除
				if(curTime - task.createTime > 10*60*1000)
				{
					deleteList.add(entry.getKey());
				}
			}
			else
			{
				//已经开始的任务，如果超过6小时，删除
				if(curTime - task.createTime > 6*60*60*1000)
				{
					deleteList.add(entry.getKey());
				}
			}
		}
		//删除过期的任务
		for(String taskId : deleteList)
		{
			largeFileScanTaskHashMap.remove(taskId);
		}
	}
	
	public void addDelayTaskForLargeFileScanTaskDelete(String taskId, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForLargeFileScanTaskDelete() delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForLargeFileScanTaskDelete() delayTime:" + deleteDelayTime + " 秒后开始删除扫描任务！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForLargeFileScanTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** addDelayTaskForLargeFileScanTaskDelete *****");
	                        largeFileScanTaskHashMap.remove(taskId);
                        } catch(Exception e) {
	                		Log.info("******** addDelayTaskForLargeFileScanTaskDelete 扫描任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	private List<Doc> largetFileScanForDisk(LargeFileScanTask task) {				
		task.status = 0;	//扫描任务开始
		task.info = "开始扫描";
		task.count = 0;	//已扫描文件
		task.largeFileCount = 0; //大文件计数		
		
		//启动扫描任务		
		Doc doc = new Doc();	//rootDoc
		doc.setVid(-1);
		doc.setPath(task.path);
		doc.setName("");
		doc.setType(2);
		doc.setLocalRootPath(task.localDiskPath);
		doc.setSize(0L);		
		
		File dir = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
    	if(false == dir.exists())
    	{
    		Log.debug("largetFileScanForDisk() [" + doc.getPath() + doc.getName() + "] 不存在！");
    		task.status = -1;
    		task.info = "[" + doc.getPath() + doc.getName() + "] 不存在！";
    		return null;
    	}
    	
    	if(dir.isFile())
    	{
    		Log.debug("largetFileScanForDisk() [" +  doc.getPath() + doc.getName() + "] 不是目录！");
    		task.status = -1;
    		task.info = "[" + doc.getPath() + doc.getName() + "] 不是目录！";
    		return null;
    	}
		
		List<Doc> largeFileList = new ArrayList<Doc>();
		largeFileList = largetFileScanForDisk(doc, largeFileList, task);
		
		//按照文件大小进行排序
		Collections.sort(largeFileList,new Comparator<Doc>(){
			@Override
			public int compare(Doc o1, Doc o2) {
				return o2.getSize().compareTo(o1.getSize());
			}
		});
		
		task.result = largeFileList;
		task.status = 200;	//扫描结束
		return task.result;
	}
	
	List<Doc> largetFileScanForDisk(Doc doc, List<Doc> largeFileList, LargeFileScanTask task)
	{
		File dir = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
    	if(false == dir.exists())
    	{
    		//Log.debug("largetFileScanForDisk() [" + doc.getPath() + doc.getName() + "] 不存在！");
    		return largeFileList;
    	}
    	
    	if(dir.isFile())
    	{
    		//Log.debug("largetFileScanForDisk() [" +  doc.getPath() + doc.getName() + "] 不是目录！");
    		return largeFileList;
    	}
    	
    	String subDocParentPath = getSubDocParentPath(doc);
		task.currentScanFolder = doc.getLocalRootPath() + doc.getPath() + doc.getName();
    	
    	File[] localFileList = dir.listFiles();
    	if(localFileList == null)
    	{
    		//Log.debug("largetFileScanForDisk() " +  doc.getPath() + doc.getName() + " 是空目录！");
    		return largeFileList;
    	}
    		
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File file = localFileList[i];
    		task.count++;
    		
    		if(file.isDirectory())
    		{
    			Doc subFolder = new Doc();	//rootDoc
    			subFolder.setVid(doc.getVid());
    			subFolder.setPath(subDocParentPath);
    			subFolder.setName(file.getName());
    			subFolder.setType(2);
    			subFolder.setLocalRootPath(doc.getLocalRootPath());
    			largetFileScanForDisk(subFolder, largeFileList, task);
    		}
    		else
    		{
    			long size = file.length();
    			if(size >= task.sizeThreshold)
    			{
    				task.largeFileCount++;
        			Doc subDoc = new Doc();	//rootDoc
        			subDoc.setVid(doc.getVid());
        			subDoc.setPath(subDocParentPath);
        			subDoc.setName(file.getName());
        			subDoc.setType(1);
        			subDoc.setLocalRootPath(doc.getLocalRootPath());
          			subDoc.setSize(size);
            		subDoc.setLatestEditTime(file.lastModified());
            		subDoc.setCreateTime(file.lastModified());          			
            		largeFileList.add(subDoc);
    			}
    		}
    	}
    	
		return largeFileList;
	}
	
	
	/**************** queryLargeFileScanTask ******************/
	@RequestMapping("/queryLargeFileScanTask.do")
	public void queryLargeFileScanTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryLargeFileScanTask.do ****************");
		Log.info("queryLargeFileScanTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		LargeFileScanTask task = getLargeFileScanTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("queryLargeFileScanTask [" + taskId + "] 不存在");
			writeJson(rt, response);			
			return;
		}
		
		Log.debug("queryLargeFileScanTask() status:" + task.status + " info:" + task.info);
		switch(task.status)
		{
		case 200:	//成功
			//延时删除下载压缩任务
			addDelayTaskForLargeFileScanTaskDelete(task.id, 6*60*60L);	//6小时后删除
			break;
		case -1: 	//失败
			rt.setError(task.info);
			addDelayTaskForLargeFileScanTaskDelete(task.id, 60L);	//1分钟后删除			
			break;
		default:
			//任务未结束
			break;
		}

		rt.setData(task);
		writeJson(rt, response);			
	}
	
	/* 
	 *   大文件删除接口
	 */
	@RequestMapping("/deleteLargeFile.do")
	public void deleteLargeFile(
			String taskId,
			String storageType,		//disk / repos
			Integer reposId, 		//For repos
			String localDiskPath, 	//For disk
			String path,			//path For LargeFile
			String name,			//name For LargeFile
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** deleteLargeFile.do ***********************");
		Log.debug("deleteLargeFile storageType: " + storageType + " reposId: " + reposId  + " localDiskPath:" + localDiskPath + " path:" + path + " name:"+ name);
		
		ReturnAjax rt = new ReturnAjax();
		
		User accessUser = adminAccessCheck(authCode, "LargeFileScan", session, rt);
		if(accessUser == null) 
		{
			writeJson(rt, response);			
			return;
		}
		
		if(storageType == null || storageType.isEmpty())
		{
			Log.debug("deleteLargeFile() storageType is null");
			docSysErrorLog("未指定扫描类型", rt);
			writeJson(rt, response);			
			return;			
		}
		
		if(path == null)
		{
			path = "";
		}
		else
		{
			path = Path.dirPathFormat(path);
		}
		
		if(name == null || name.isEmpty())
		{
			Log.debug("deleteLargeFile() name is not specified");
			docSysErrorLog("文件名不能为空", rt);
			writeJson(rt, response);			
			return;						
		}
		
		boolean ret = false;
		switch(storageType)
		{
		case "disk":
			localDiskPath = Path.localDirPathFormat(localDiskPath, OSType);
			Log.debug("deleteLargeFile() [" + localDiskPath + path + name  + "]");
			ret = FileUtil.delFileOrDir(localDiskPath + path + name);
			break;
		//case "repos":
		//	path = Path.dirPathFormat(path);
		//	break;		
		default:
			Log.debug("deleteLargeFile() 未知扫描类型:" + storageType);
			docSysErrorLog("未知扫描类型", rt);
			writeJson(rt, response);						
			return;
		}
		
		if(ret == false)
		{
			docSysErrorLog("文件删除失败", rt);
			writeJson(rt, response);			
			return;
		}
		
		writeJson(rt, response);
	}
	
	
	/* 
	 * 获取文件列表通用接口
	 * storageType: disk:磁盘  repos:仓库 remoteServer:远程文件服务器
	 *   
	 */
	@RequestMapping("/getSubDocList.do")
	public void getSubDocList(
			String storageType, 
			String localDiskPath, 		//For disk
			Integer reposId,			//For Repos
			String serverId,			//For remoteServer
			Integer targetReposId,		//For remoteServer
			String targetDiskPath,		//For remoteServer
			String path, String name, 	//doc Info
			Integer listType,
			String sort,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSubDocList.do ***********************");
		Log.debug("getSubDocList storageType: " + storageType 
				+ " localDiskPath:" + localDiskPath 
				+ " reposId: " + reposId  
				+ " serverId:" + serverId + " targetReposId:" + targetReposId + " targetDiskPath:" + targetDiskPath
				+ " path:" + path + " name:"+ name 
				+ " listType:" + " sort:" + sort 
				+ " shareId:" + shareId + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(storageType == null)
		{	
			Log.debug("getSubDocList() storageType is null");
			rt.setError("非法存储类型！");
			writeJson(rt, response);			
			return;
		}
		
		switch(storageType)
		{
		case "disk":
			getSubDocListForDisk(localDiskPath, path, name, listType, sort, shareId, authCode, rt, session, request, response);
			return;
		case "repos":
			getSubDocListForRepos(reposId, path, name, listType, sort, shareId, authCode, rt, session, request, response); 
			return;
		case "remoteServer":
			getSubDocListForRemoteServer(serverId, targetReposId, targetDiskPath, path, name, listType, sort, shareId, authCode, rt, session, request, response);
			return;
		}
		
		Log.debug("getSubDocList() 非法存储类型:" + storageType);
		rt.setError("非法存储类型！");
		writeJson(rt, response);			
	}

	private void getSubDocListForRemoteServer(String serverId, Integer targetReposId, String targetDiskPath,
			String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//获取服务器信息
		UserPreferServer server = getUserPreferServer(serverId);
		if(server == null)
		{
			Log.debug("editUserPreferServer() 服务器[" + serverId + "] 不存在"); 
			rt.setError("服务器不存在！");
			writeJson(rt, response);	
			return;
		}
		
		server.reposId = targetReposId;
		server.remoteDirectory = targetDiskPath;
		RemoteStorageConfig remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);
		
		Doc doc = buildBasicDocBase(-1, null, null, null, path, name, null, 2, true, null, null, 0L, "");
		
		List<Doc> list = getRemoteStorageEntryList(null, doc, remoteStorageConfig, null);
		rt.setData(list);
		writeJson(rt, response);
	}

	private void getSubDocListForRepos(Integer reposId, String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
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
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc doc = buildBasicDocBase(reposId, null, null, reposPath, path, name, null, 2, true, localRootPath, localVRootPath, 0L, "");
		List<Doc> list = docSysGetDocList(repos, doc, listType);
		rt.setData(list);
		writeJson(rt, response);
	}

	private void getSubDocListForDisk(String localDiskPath, String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
		User accessUser = adminAccessCheck(authCode, "getSubDocListForDisk", session, rt);
		if(accessUser == null) 
		{
			writeJson(rt, response);			
			return;
		}
		
		localDiskPath = Path.localDirPathFormat(localDiskPath, OSType);
		Doc doc = buildBasicDocBase(-1, null, null, null, path, name, null, 2, true, localDiskPath, null, 0L, "");
		
		List<Doc> list = getLocalEntryList(doc);
		rt.setData(list);
		writeJson(rt, response);
	}
	
	/* 
	 * 获取文件列表通用接口
	 * storageType: disk:磁盘  repos:仓库 remoteServer:远程文件服务器
	 *   
	 */
	@RequestMapping("/getInitSubDocList.do")
	public void getInitSubDocList(
			String storageType, 
			String localDiskPath, 		//For disk
			Integer reposId,			//For Repos
			String serverId,			//For remoteServer
			Integer targetReposId,		//For remoteServer
			String targetDiskPath,		//For remoteServer
			String path, String name, 	//end doc Info
			Integer listType,
			String sort,
			Integer shareId,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getInitSubDocList.do ***********************");
		Log.debug("getInitSubDocList storageType: " + storageType 
				+ " localDiskPath:" + localDiskPath 
				+ " reposId: " + reposId  
				+ " serverId:" + serverId + " targetReposId:" + targetReposId + " targetDiskPath:" + targetDiskPath
				+ " path:" + path + " name:"+ name 
				+ " listType:" + " sort:" + sort 
				+ " shareId:" + shareId + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(storageType == null)
		{	
			Log.debug("getInitSubDocList() storageType is null");
			rt.setError("非法存储类型！");
			writeJson(rt, response);			
			return;
		}
		
		switch(storageType)
		{
		case "disk":
			getInitSubDocListForDisk(localDiskPath, path, name, listType, sort, shareId, authCode, rt, session, request, response);
			return;
		case "repos":
			getInitSubDocListForRepos(reposId, path, name, listType, sort, shareId, authCode, rt, session, request, response); 
			return;
		case "remoteServer":
			getInitSubDocListForRemoteServer(serverId, targetReposId, targetDiskPath, path, name, listType, sort, shareId, authCode, rt, session, request, response);
			return;
		}
		
		Log.debug("getInitSubDocList() 非法存储类型:" + storageType);
		rt.setError("非法存储类型！");
		writeJson(rt, response);			
	}
	
	private void getInitSubDocListForRemoteServer(String serverId, Integer targetReposId, String targetDiskPath,
			String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//获取服务器信息
		UserPreferServer server = getUserPreferServer(serverId);
		if(server == null)
		{
			Log.debug("getInitSubDocList() 服务器[" + serverId + "] 不存在"); 
			rt.setError("服务器不存在！");
			writeJson(rt, response);	
			return;
		}
		
		server.reposId = targetReposId;
		server.remoteDirectory = targetDiskPath;
		RemoteStorageConfig remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);		
		
		Doc rootDoc = buildBasicDocBase(-1, null, null, null, "", "", null, 2, true, null, null, 0L, "");
		Doc doc = null;
		if(path != null && name != null)
		{
			doc = buildBasicDoc(-1, null, null, null, path, name, null, null, true, null, null, null, null);
			if(doc.getDocId() == rootDoc.getDocId())
			{
				doc = null;
			}
		}
		
		Repos fakeRepos = new Repos();
		RemoteStorageSession remoteStorageSession = channel.doRemoteStorageLoginEx(fakeRepos , remoteStorageConfig);
        if(remoteStorageSession == null)
        {
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		remoteStorageSession = channel.doRemoteStorageLoginEx(fakeRepos, remoteStorageConfig);
        		if(remoteStorageSession != null)
        		{
        			break;
        		}
        	}
        }
        
    	if(remoteStorageSession == null)
    	{
			rt.setError("登录远程服务器失败");
			writeJson(rt, response);		
			return;
    	}
    	
    	List<Doc> list = getDocListFromRootToDocForRemoteServer(remoteStorageSession, remoteStorageConfig, fakeRepos, rootDoc, doc);
		    	
    	channel.doRemoteStorageLogoutEx(remoteStorageSession);
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Doc> getDocListFromRootToDocForRemoteServer(RemoteStorageSession remoteStorageSession,
			RemoteStorageConfig remoteStorageConfig, Repos fakeRepos, Doc rootDoc, Doc doc) {
    	//from rootDoc to doc
    	List<Doc> resultList = channel.getRemoteStorageEntryListEx(remoteStorageSession, remoteStorageConfig, fakeRepos, rootDoc, null);
    	if(doc == null || resultList == null || resultList.size() == 0)
    	{
    		return resultList;
    	}
    	
    	String relativePath = getRelativePath(doc, rootDoc);
		Log.debug("getDocListFromRootToDocForRemoteServer() relativePath:" + relativePath);		
		if(relativePath == null || relativePath.isEmpty())
		{
			return resultList;
		}
			
		String [] paths = relativePath.split("/");
		int deepth = paths.length;
		if(deepth < 1)
		{
			return resultList;
		}
			
		Integer reposId = fakeRepos.getId();
		Long pid = rootDoc.getDocId();
		String pPath = rootDoc.getPath() + rootDoc.getName() + "/";
		if(rootDoc.getName().isEmpty())
		{
			pPath = rootDoc.getPath();
		}
		
		int pLevel = rootDoc.getLevel();
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			Log.debug("getDocListFromRootToDocForRemoteServer() name:" + name);
			if(name.isEmpty())
			{
				continue;
			}	
				
			Doc tempDoc = buildBasicDoc(reposId, null, pid, doc.getReposPath(), pPath, name, pLevel+1, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
				
			List<Doc> subDocList = channel.getRemoteStorageEntryListEx(remoteStorageSession, remoteStorageConfig, fakeRepos, tempDoc, null);
			if(subDocList == null || subDocList.size() == 0)
			{
				Log.debug("getDocListFromRootToDocForRemoteServer() Failed to get the subDocList under doc: " + pPath+name);
				break;
			}
			resultList.addAll(subDocList);
				
			pPath = pPath + name + "/";
			pid = tempDoc.getPid();
			pLevel++;
		}
		
		return resultList;
	}

	private void getInitSubDocListForRepos(Integer reposId, String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
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
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc rootDoc = buildBasicDocBase(reposId, null, null, reposPath, "", "", null, 2, true, localRootPath, localVRootPath, 0L, "");
		Doc doc = null;
		if(path != null && name != null)
		{
			doc = buildBasicDocBase(reposId, null, null, reposPath, path, name, null, 2, true, localRootPath, localVRootPath, 0L, "");
			if(doc.getDocId() == rootDoc.getDocId())
			{
				doc = null;
			}
		}
	
		List<Doc> list = getDocListFromRootToDocForRepos(repos, rootDoc, doc, listType);
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Doc> getDocListFromRootToDocForRepos(Repos repos, Doc rootDoc, Doc doc, Integer listType) {
    	//from rootDoc to doc
    	List<Doc> resultList = docSysGetDocList(repos, rootDoc, listType);
    	if(doc == null || resultList == null || resultList.size() == 0)
    	{
    		return resultList;
    	}
    	
    	String relativePath = getRelativePath(doc, rootDoc);
		Log.debug("getDocListFromRootToDocForRepos() relativePath:" + relativePath);		
		if(relativePath == null || relativePath.isEmpty())
		{
			return resultList;
		}
			
		String [] paths = relativePath.split("/");
		int deepth = paths.length;
		if(deepth < 1)
		{
			return resultList;
		}
			
		Integer reposId = repos.getId();
		Long pid = rootDoc.getDocId();
		String pPath = rootDoc.getPath() + rootDoc.getName() + "/";
		if(rootDoc.getName().isEmpty())
		{
			pPath = rootDoc.getPath();
		}
		
		int pLevel = rootDoc.getLevel();
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			Log.debug("getDocListFromRootToDocForRepos() name:" + name);
			if(name.isEmpty())
			{
				continue;
			}	
				
			Doc tempDoc = buildBasicDoc(reposId, null, pid, doc.getReposPath(), pPath, name, pLevel+1, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
				
			List<Doc> subDocList = docSysGetDocList(repos, tempDoc, listType);
			if(subDocList == null || subDocList.size() == 0)
			{
				Log.debug("getDocListFromRootToDocForRepos() Failed to get the subDocList under doc: " + pPath+name);
				break;
			}
			resultList.addAll(subDocList);
				
			pPath = pPath + name + "/";
			pid = tempDoc.getPid();
			pLevel++;
		}
		
		return resultList;
	}

	private void getInitSubDocListForDisk(String localDiskPath, String path, String name,
			Integer listType, String sort, Integer shareId, String authCode, 
			ReturnAjax rt, HttpSession session, HttpServletRequest request,HttpServletResponse response) {
		
		User accessUser = adminAccessCheck(authCode, "getSubDocListForDisk", session, rt);
		if(accessUser == null) 
		{
			writeJson(rt, response);			
			return;
		}
		
		localDiskPath = Path.localDirPathFormat(localDiskPath, OSType);
		Doc rootDoc = buildBasicDocBase(-1, null, null, null, "", "", null, 2, true, localDiskPath, null, 0L, "");
		Doc doc = null;
		if(path != null && name != null)
		{
			doc = buildBasicDocBase(-1, null, null, null, path, name, null, 2, true, localDiskPath, null, 0L, "");
			if(doc.getDocId() == rootDoc.getDocId())
			{
				doc = null;
			}
		}
		
		List<Doc> list = getDocListFromRootToDocForDisk(rootDoc, doc);
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Doc> getDocListFromRootToDocForDisk(Doc rootDoc, Doc doc) {
    	//from rootDoc to doc
    	List<Doc> resultList = getLocalEntryList(rootDoc);
    	if(doc == null || resultList == null || resultList.size() == 0)
    	{
    		return resultList;
    	}
    	
    	String relativePath = getRelativePath(doc, rootDoc);
		Log.debug("getDocListFromRootToDocForRepos() relativePath:" + relativePath);		
		if(relativePath == null || relativePath.isEmpty())
		{
			return resultList;
		}
			
		String [] paths = relativePath.split("/");
		int deepth = paths.length;
		if(deepth < 1)
		{
			return resultList;
		}
			
		Integer reposId = rootDoc.getVid();
		Long pid = rootDoc.getDocId();
		String pPath = rootDoc.getPath() + rootDoc.getName() + "/";
		if(rootDoc.getName().isEmpty())
		{
			pPath = rootDoc.getPath();
		}
		
		int pLevel = rootDoc.getLevel();
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			Log.debug("getDocListFromRootToDocForRepos() name:" + name);
			if(name.isEmpty())
			{
				continue;
			}	
				
			Doc tempDoc = buildBasicDoc(reposId, null, pid, doc.getReposPath(), pPath, name, pLevel+1, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
				
			List<Doc> subDocList = getLocalEntryList(tempDoc);
			if(subDocList == null || subDocList.size() == 0)
			{
				Log.debug("getDocListFromRootToDocForRepos() Failed to get the subDocList under doc: " + pPath+name);
				break;
			}
			resultList.addAll(subDocList);
				
			pPath = pPath + name + "/";
			pid = tempDoc.getPid();
			pLevel++;
		}
		
		return resultList;
	}
}
	