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
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.compress.archivers.sevenz.SevenZArchiveEntry;
import org.apache.commons.compress.archivers.sevenz.SevenZFile;
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

import com.DocSystem.common.ActionContext;
import com.DocSystem.common.Base64Util;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.FolderUploadAction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.IPUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.OfficeExtract;
import com.DocSystem.common.Path;
import com.DocSystem.common.ScanOption;
import com.DocSystem.common.SyncLock;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.VersionIgnoreConfig;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.channels.Channel;
import com.DocSystem.common.channels.ChannelFactory;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.DocPullResult;
import com.DocSystem.common.entity.DownloadPrepareTask;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.websocket.DocData;
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
import util.ReturnAjax;
import util.FileUtil.FileUtils2;
import util.LuceneUtil.LuceneUtil2;

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
		Log.infoHead("************** addDoc [" + path + name + "] ****************");
		Log.info("addDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content+ " shareId:" + shareId);
		Log.debug("addDoc default charset:" + Charset.defaultCharset());
		
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
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath,localVRootPath, 0L, "");
		doc.setContent(content);
				
		if(checkUserAddRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "新增文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));			
			return;
		}

		Doc tmpDoc = docSysGetDoc(repos, doc, false);
		if(tmpDoc != null && tmpDoc.getType() != 0)
		{
			docSysErrorLog(doc.getName() + " 已存在", rt);

			rt.setMsgData(1);
			rt.setData(tmpDoc);
			
			writeJson(rt, response);
			
			docSysDebugLog("addDoc() add doc [" + doc.getPath() + doc.getName() + "] Failed", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDoc", "addDoc", "新增文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "新增 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();

		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "addDoc";
		context.subEvent = "addDoc";
		context.eventName = "新增文件";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		
		int ret = addDoc(repos, doc, null, null,null,null, commitMsg,commitUser,reposAccess.getAccessUser(),rt, context); 
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
	}

	@RequestMapping("/addDocRS.do")  //文件名、文件类型、所在仓库、父节点
	public void addDocRS(Integer reposId, String remoteDirectory, String path, String name,  Integer type,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** addDocRS [" + path + name + "] ****************");
		Log.info("addDocRS reposId:" + reposId + " remoteDirectory:[" + remoteDirectory + "] path:[" + path + "] name:" + name  + " type:" + type + " content:" + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		AuthCode auth = checkAuthCode(authCode, null);
		if(auth == null)
		{
			Log.debug("addDocRS checkAuthCode return false");
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);
			docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed", rt);
			addSystemLog(request, null, "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		ReposAccess reposAccess = auth.getReposAccess();
		
		//add Doc on Server Directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);

				docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed: remoteDirectory is null", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
				return;				
			}
			
			if(type == null)
			{
				rt.setError("文件类型不能为空！");
				writeJson(rt, response);	
				
				docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed: type is null", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
				return;			
			}
			
			if(type == 2) //目录
			{
				if(false == FileUtil.createDir(remoteDirectory + path + name))
				{
					docSysDebugLog("addDocRS() 目录 " +remoteDirectory + path + name + " 创建失败！", rt);
					rt.setError("新增目录失败");
					writeJson(rt, response);
					addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
					return;
				}				
			}
			else
			{
				if(false == FileUtil.createFile(remoteDirectory + path, name))
				{
					docSysDebugLog("addDocRS() 文件 " + remoteDirectory + path + name + "创建失败！", rt);
					rt.setError("新建文件失败");
					writeJson(rt, response);
					addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
					return;
				}
			}
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "成功", null, null, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		//Add Doc On Repos
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			writeJson(rt, response);
			docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", null, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, type, true,localRootPath,localVRootPath, 0L, "");

		if(checkUserAddRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}

		Doc tmpDoc = docSysGetDoc(repos, doc, false);
		if(tmpDoc != null && tmpDoc.getType() != 0)
		{
			rt.setError("文件已存在");
			rt.setMsgData(1);
			rt.setData(tmpDoc);
			writeJson(rt, response);

			docSysDebugLog("addDocRS() add doc [" + path + name + "] Failed: 文件已存在", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocRS", "addDocRS", "新增文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "新增 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "addDocRS";
		context.subEvent = "addDocRS";
		context.eventName = "新增文件";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		
		int ret = addDoc(repos, doc, null, null, null, null, commitMsg, commitUser, reposAccess.getAccessUser(),rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
		
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

	/****************   refresh a Document ******************/
	@RequestMapping("/refreshDoc.do")
	public void refreshDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
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
			addSystemLog(request, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", "失败", repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true, localRootPath, localVRootPath, null, null);

		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "同步 " + doc.getPath() + doc.getName();
		}
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		if(checkDocLocked(doc, DocLock.LOCK_TYPE_FORCE, reposAccess.getAccessUser(), false))
		{
			writeJson(rt, response);

			docSysDebugLog("refreshDoc() [" + doc.getPath() + doc.getName() + "] was force locked", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", "失败", repos, doc, null, buildSystemLogDetailContent(rt));
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
		addSystemLog(request, reposAccess.getAccessUser(), "refreshDoc", "refreshDoc", "刷新", "成功", repos, doc, null, buildSystemLogDetailContent(rt));

		
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
		Log.infoHead("************** deleteDoc [" + path + name + "] ****************");
		Log.info("deleteDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
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
		
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDoc", "deleteDoc", "删除文件","失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDoc", "deleteDoc", "删除文件","失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}

		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "删除 " + doc.getPath() + doc.getName();
		}
		String commitUser = reposAccess.getAccessUser().getName();
		
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "deleteDoc";
		context.subEvent = "deleteDoc";
		context.eventName = "删除文件";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		
		int ret = deleteDoc(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
	}
	
	
	@RequestMapping("/deleteDocRS.do")
	public void deleteDocRS(Integer reposId, String remoteDirectory, String path, String name,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** deleteDocRS [" + path + name + "] ****************");
		Log.info("deleteDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		
		if(checkAuthCode(authCode, null) == null)
		{
			rt.setError("无效授权码或授权码已过期！");
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
				addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件","失败", null, null, null, buildSystemLogDetailContent(rt));
				return;				
			}
			
			if(FileUtil.delFileOrDir(remoteDirectory + path + name) == false)
			{
				docSysDebugLog("deleteDocRS() " + remoteDirectory + path + name + "删除失败！", rt);
				rt.setError("删除失败");				
				writeJson(rt, response);
				addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件","失败", null, null, null, buildSystemLogDetailContent(rt));
				return;
			}
			
			writeJson(rt, response);	
			
			docSysDebugLog("deleteDocRS() " + remoteDirectory + path + name + "删除成功！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件","成功", null, null, null, buildSystemLogDetailContent(rt));
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
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "deleteDocRS", "deleteDocRS", "删除文件","失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;
		}

		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "删除 " + doc.getPath() + doc.getName();
		}
		String commitUser = reposAccess.getAccessUser().getName();
		
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "deleteDocRS";
		context.subEvent = "deleteDocRS";
		context.eventName = "删除文件";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		
		int ret = deleteDoc(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
	}

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String dstName, 
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
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件","失败",  repos, null, null, buildSystemLogDetailContent(rt));			
			return;
		}
	
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件","失败",  repos, null, null, buildSystemLogDetailContent(rt));			
			return;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "重命名 " + path + name + " 为 " + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, null, type, true, localRootPath, localVRootPath, null, null);
		if(checkUserAccessPwd(repos, srcDoc, session, rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件","失败",  repos, srcDoc, null, buildSystemLogDetailContent(rt));			
			return;
		}
		
		Doc dstDoc = buildBasicDoc(reposId, null, pid, reposPath, path, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);

			writeJson(rt, response);
			
			addSystemLog(request, reposAccess.getAccessUser(), "renameDoc", "renameDoc", "重命名文件","失败",  repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "renameDoc";
		context.subEvent = "renameDoc";
		context.eventName = "重命名文件";	
		context.repos = repos;
		context.doc = srcDoc;
		context.newDoc = dstDoc;
		int ret = renameDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}	
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type, 
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
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "失败", repos, null, null, buildSystemLogDetailContent(rt));	
			return;
		}

		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "失败", repos, null, null, buildSystemLogDetailContent(rt));	
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
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "失败", repos, srcDoc, null, buildSystemLogDetailContent(rt));	

			return;
		}
		
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc, false);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "moveDoc", "moveDoc", "移动文件", "失败", repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));	

			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
				
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "moveDoc";
		context.subEvent = "moveDoc";
		context.eventName = "移动文件";	
		context.repos = repos;
		context.doc = srcDoc;
		context.newDoc = dstDoc;
		
		int ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** copyDoc [" + srcPath + srcName + "]  [" + dstPath + dstName + "] ****************");
		Log.info("copyDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);
		
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
				
		//检查用户是否有目标目录权限新增文件
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);

		Log.debug("copyDoc checkUserAddRight");
		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制文件","失败",  repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "复制 " + srcPath + srcName + " 到 " + dstPath + dstName;
		}
		String commitUser = reposAccess.getAccessUser().getName();
		Doc srcDocTmp = buildBasicDoc(reposId, docId, srcPid, reposPath, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, reposPath, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDoc = docSysGetDoc(repos, srcDocTmp, false);
		if(srcDoc == null || srcDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);	
			addSystemLog(request, reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制文件","失败",  repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(checkUserAccessPwd(repos, srcDoc, session, rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "copyDoc", "copyDoc", "复制文件","失败",  repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));
			return;
		}
		
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "copyDoc";
		context.subEvent = "copyDoc";
		context.eventName = "复制文件";	
		context.repos = repos;
		context.doc = srcDoc;
		context.newDoc = dstDoc;
		
		int ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
	}
	
	/****************   copy/move/rename a Document ******************/
	@RequestMapping("/copyDocRS.do")
	public void copyDocRS(Integer reposId, String remoteDirectory, String srcPath, String srcName, String dstPath, String dstName, Integer isMove,
			String commitMsg,
			String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** copyDocRS [" + srcPath + srcName + "]  [" + dstPath + dstName + "] ****************");
		Log.info("copyDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " srcPath:" + srcPath + " srcName:" + srcName + " srcPath:" + dstPath + " srcName:" + dstName + " isMove:" + isMove + " authCode:" + authCode);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		if(checkAuthCode(authCode, null) == null)
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

		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		//move file
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysDebugLog("copyDocRS remoteDirectory is null", rt);
				rt.setError("服务器路径不能为空！");
				writeJson(rt, response);			
				addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  null, null, null, buildSystemLogDetailContent(rt));
				return;				
			}
			
			if(move)
			{
				if(FileUtil.moveFileOrDir(remoteDirectory + srcPath, srcName, remoteDirectory + dstPath, dstName, false) == false)
				{
					docSysDebugLog("copyDocRS() move " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "失败！", rt);
					rt.setError("移动失败");
					writeJson(rt, response);			
					addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  null, null, null, buildSystemLogDetailContent(rt));
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
					addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  null, null, null, buildSystemLogDetailContent(rt));
					return;
				}
			}
			
			writeJson(rt, response);
			
			docSysDebugLog("copyDocRS() copy " + remoteDirectory + srcPath + srcName + " to " + remoteDirectory + dstPath + dstName + "成功！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","成功",  null, null, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
		
		//检查用户是否有目标目录权限新增文件
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		
		Doc dstParentDoc = buildBasicDoc(reposId, null, null, reposPath, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, reposAccess.getAccessUser().getId(), dstParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  repos, null, null, buildSystemLogDetailContent(rt));
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		if(commitMsg == null || commitMsg.isEmpty())
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
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);
			
			if(move)
			{
				addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "移动文件","失败",  repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));				
			}
			else
			{
				addSystemLog(request, reposAccess.getAccessUser(), "copyDocRS", "copyDocRS", "复制文件","失败",  repos, srcDoc, dstDoc, buildSystemLogDetailContent(rt));
			}
			return;
		}
				
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "copyDocRS";
		context.subEvent = "copyDocRS";
		context.repos = repos;
		context.doc = srcDoc;
		context.newDoc = dstDoc;
		
		int ret = 0;
		if(move)
		{
			context.eventName = "移动文件";	
			ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);			
		}
		else
		{
			context.eventName = "复制文件";				
			ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
		}
		writeJson(rt, response);
		
		switch(ret)
		{
		case 0:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		case 1:
			addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			break;
		default:	//异步执行中（异步线程负责日志写入）
			break;
		}
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
	public void checkDocInfo(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size,String checkSum, 
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** checkDocInfo [" + path + name + "] ****************");
		Log.info("checkDocInfo  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum+ " shareId:" + shareId
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);
		
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
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//Get FolderUploadAction
		FolderUploadAction folderUploadAction = null;
		if(dirPath != null && !dirPath.isEmpty())
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("checkDocInfo() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			folderUploadAction.totalCount = totalCount;
		}
		
		//Build Doc
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);

		//Build ActionContext
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "checkDocInfo";
		context.subEvent = "checkDocInfo";
		context.eventName = "上传文件";	
		context.repos = repos;
		context.doc = doc;
		context.newDoc = null;
		context.folderUploadAction = folderUploadAction;

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

	private FolderUploadAction getFolderUploadAction(HttpServletRequest request, 
			User accessUser, 
			Repos repos, 
			String dirPath, Long batchStartTime, 
			String commitMsg, ReturnAjax rt) 
	{
		String actionId = dirPath + batchStartTime;
		FolderUploadAction action = gFolderUploadActionHashMap.get(dirPath + batchStartTime);
		if(action == null)
		{
			String reposPath = Path.getReposPath(repos);
			String localRootPath = Path.getReposRealPath(repos);
			String localVRootPath = Path.getReposVirtualPath(repos);
			Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, dirPath, "", null, 2, true, localRootPath, localVRootPath, 0L, "");

			
			String requestIP = getRequestIpAddress(request);
				
			//create FolderUploadAction
			action = checkAndCreateFolderUploadAction(actionId, requestIP, accessUser, repos, doc, commitMsg, rt);
		}
		
		if(action.isCriticalError)
		{
			docSysErrorLog("上传失败:" + action.errorInfo, rt);
			return null;
		}
		return action;
	}
	
	private FolderUploadAction checkAndCreateFolderUploadAction(String actionId, String requestIP, User accessUser, Repos repos, Doc doc, String commitMsg, ReturnAjax rt) {
		FolderUploadAction action = null;
		synchronized(gFolderUploadActionSyncLock)
		{
    		String lockInfo = "checkAndCreateFolderUploadAction() gFolderUploadActionSyncLock";
    		SyncLock.lock(lockInfo);
			
    		action = gFolderUploadActionHashMap.get(actionId);
    		if(action == null)
    		{
				action = new FolderUploadAction();
				action.actionId = actionId;
				action.requestIP = requestIP;
				action.user = accessUser;
				action.repos = repos;
				action.doc = doc;
				action.docLockType = DocLock.LOCK_TYPE_FORCE;

				action.event = "uploadDoc";
				action.subEvent = "uploadDoc";
				action.eventName = "目录上传";
				
				action.isCriticalError = false;
				action.errorInfo = null;

				action.startTime = new Date().getTime();
				action.beatTime = action.startTime;
				
				action.uploadLogPath = Path.getRepsFolderUploadLogPath(repos, action.startTime);
				action.localChangesRootPath = Path.getRepsFolderUploadLocalChangesRootPath(repos, action.startTime);
				
				action.commitMsg = commitMsg == null? "上传目录 [" + doc.getPath() + doc.getName() + "]" : commitMsg;
				action.commitUser = accessUser.getName(); 
				
				gFolderUploadActionHashMap.put(actionId, action);		
				
				String lockInfo2 = "checkAndCreateFolderUploadAction() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
				DocLock docLock = lockDoc(doc, action.docLockType,  2*60*60*1000, accessUser, rt, false, lockInfo2);
				if(docLock == null)
				{
					action.isCriticalError = true;
					action.errorInfo = rt.getMsgInfo();
				}
    		}
		}	
		return action;
	}
	
	protected void removeFolderUploadAction(String actionId) {
		synchronized(gFolderUploadActionSyncLock)
		{
    		String lockInfo = "removeDocData() gFolderUploadActionSyncLock";
    		SyncLock.lock(lockInfo);
    		
    		gFolderUploadActionHashMap.remove(actionId);
			SyncLock.unlock(gFolderUploadActionSyncLock, lockInfo);
		}
	}
	
	private void folderUploadActionBeat(String actionId) {
		FolderUploadAction action = gFolderUploadActionHashMap.get(actionId);
		folderUploadActionBeat(action);
	}
	
	private void folderUploadActionBeat(FolderUploadAction action) {
		if(action != null)
    	{
    		action.beatTime = new Date().getTime();
    	}
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
	public void checkChunkUploaded(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Long chunkSize,String chunkHash, Integer combineDisabled,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.infoHead("************** checkChunkUploaded [" + path + name + "] ****************");
		Log.info("checkChunkUploaded  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId 
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);
			
		ReturnAjax rt = new ReturnAjax(new Date().getTime());

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
		if(!reposCheck(repos, rt, response))
		{
			return;
		}

		//Get FolderUploadAction
		FolderUploadAction folderUploadAction = null;
		if(dirPath != null && !dirPath.isEmpty())
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("checkChunkUploaded() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			folderUploadAction.totalCount = totalCount;
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
		}
		else
		{
			rt.setMsgData("1");
			docSysDebugLog("chunk: " + fileChunkName +" 已存在，且checkSum相同！", rt);			
			Log.debug("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(combineDisabled != null)
			{
				Log.debug("checkChunkUploaded() combineDisabled!");
				writeJson(rt, response);			
				return;
			}
			
			//如果是最后一个分片则开始文件合并处理
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				if(commitMsg == null || commitMsg.isEmpty())
				{
					commitMsg = "上传 " + path + name;
				}
				String commitUser = reposAccess.getAccessUser().getName();
				
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
				ActionContext context = new ActionContext();
				context.requestIP = getRequestIpAddress(request);
				context.user = reposAccess.getAccessUser();
				context.event = "checkChunkUploaded";
				context.subEvent = "checkChunkUploaded";
				context.eventName = "文件上传";	
				context.repos = repos;
				context.doc = doc;
				context.newDoc = null;
				context.folderUploadAction = folderUploadAction;
				
				int ret = 0;
				Doc dbDoc = docSysGetDoc(repos, doc, false);
				if(dbDoc == null || dbDoc.getType() == 0)
				{
					ret = addDoc(repos, doc,
								null,
								chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
					writeJson(rt, response);

					uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);			
				}
				else
				{
					ret = updateDoc(repos, doc, 
							null,   
							chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);				
				
					writeJson(rt, response);	

					uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);			
				}
				
				return;
			}
		}
		writeJson(rt, response);
	}
	
	//combine chunks
	//注意：chunkIndex不能小于chunkNum，否则deleteChunks逻辑会有问题
	@RequestMapping("/combineChunks.do")
	public void combineChunks(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Long chunkSize,String chunkHash,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		Log.infoHead("************** combineChunks [" + path + name + "] ****************");
		Log.info("combineChunks  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId
				+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);
			
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
		
		FolderUploadAction folderUploadAction = null;
		if(dirPath != null && !dirPath.isEmpty())
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("combineChunks() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			folderUploadAction.totalCount = totalCount;
		}
		
		String chunkParentPath = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());			
		if(commitMsg == null || commitMsg.isEmpty())
		{
			commitMsg = "上传 " + path + name;
		}
		String commitUser = reposAccess.getAccessUser().getName();
			
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
			
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, 1, true,localRootPath, localVRootPath, size, checkSum);
			
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "combineChunks";
		context.subEvent = "combineChunks";
		context.eventName = "文件上传";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		context.folderUploadAction = folderUploadAction;
		
		int ret = 0;
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == 0) //新增文件
		{
			ret = addDoc(repos, doc,
							null,
							chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);

			writeJson(rt, response);
			
			uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);
			return;
		}

		//更新文件
		ret = updateDoc(repos, doc, 
						null,   
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);					

		writeJson(rt, response);	
		
		uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);
	}
	
	private void uploadAfterHandler(int uploadResult, Doc doc, String name, Integer chunkIndex, Integer chunkNum, String chunkParentPath, ReposAccess reposAccess, ActionContext context, ReturnAjax rt) {
		switch(uploadResult)
		{
		case 0:
			if(context.folderUploadAction != null)
			{
				folderSubEntryUploadErrorHandler(context.folderUploadAction);
			}
			else
			{
				addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "失败",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			}
			break;
		case 1:
			if(context.folderUploadAction != null)
			{
				folderSubEntryUploadSuccessHandler(context.folderUploadAction);
				deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
				deletePreviewFile(doc);
			}
			else
			{
				deleteChunks(name, chunkIndex, chunkNum,chunkParentPath);
				deletePreviewFile(doc);
				addSystemLog(context.requestIP, reposAccess.getAccessUser(), context.event, context.subEvent, context.eventName, "成功",  context.repos, context.doc, context.newDoc, buildSystemLogDetailContent(rt));						
			}
			break;
		default:	//异步执行中（异步线程负责日志写入）
			deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
			deletePreviewFile(doc);
			break;
		}				
	}

	private void folderSubEntryUploadSuccessHandler(FolderUploadAction action) {
		action.successCount++;
		if(isLastSubEntryForFolderUpload(action))
		{
			folderUploadEndHander(action);
		}
	}
	
	private void folderSubEntryUploadErrorHandler(FolderUploadAction action) {
		action.failCount++;
		if(isLastSubEntryForFolderUpload(action))
		{
			folderUploadEndHander(action);
		}
	}

	private void folderUploadEndHander(FolderUploadAction action) {
		//判断是否有改动
		Repos repos = action.repos;
		Doc doc = action.doc;	//目录
		int lockType = action.docLockType;
		User user = action.user;
		String commitMsg = action.commitMsg;
		String commitUser = action.commitUser;
		String localChangesRootPath =  action.localChangesRootPath;

		if(isLocalChanged(action.localChangesRootPath) == false)
		{
			//解锁目录
			unlockDoc(doc, lockType, user);
			//写入日志
			addSystemLog(action.requestIP, user, action.event, action.subEvent, action.eventName, "成功", action.repos, action.doc, null, buildSystemLogDetailContentForFolderUpload(action, null));						
			FileUtil.delDir(action.uploadLogPath);
			return;
		}
		
		//异步执行
		new Thread(new Runnable() {
			public void run() {
				Log.debug("folderUploadEndHander() execute in new thread");
				
				//提交版本
				ReturnAjax rt = new ReturnAjax();
				String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt , localChangesRootPath, 2, null, null);
				if(revision != null)
				{
					verReposPullPush(repos, true, rt);
				}
				
				
				//远程自动推送
				realTimeRemoteStoragePush(repos, doc, null, user, commitMsg, rt, action.event);
				//仓库自动备份
				realTimeBackup(repos, doc, null, user, commitMsg, rt, action.event);
						
				//解锁目录
				unlockDoc(doc, lockType, user);
				
				//update searchIndex
				rebuildIndexForDocEx(repos, doc, localChangesRootPath, rt);
				FileUtil.delDir(localChangesRootPath);
				
				//写入日志
				addSystemLog(action.requestIP, user, action.event, action.subEvent, action.eventName, "成功", action.repos, action.doc, null, buildSystemLogDetailContentForFolderUpload(action, rt));						
				FileUtil.delDir(action.uploadLogPath);		
			}
		}).start();
	}

	private boolean isLastSubEntryForFolderUpload(FolderUploadAction folderUploadAction) {
		if(folderUploadAction.totalCount <= (folderUploadAction.successCount + folderUploadAction.failCount))
		{
			return true;
		}
		return false;
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
	public void uploadDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size, String checkSum,
			MultipartFile uploadFile,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Long chunkSize, String chunkHash, Integer combineDisabled,
			String commitMsg,
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload			
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** uploadDoc [" + path + name + "] ****************");
		Log.info("uploadDoc  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash + " combineDisabled:" + combineDisabled
							+ " shareId:" + shareId + " commitMsg:" + commitMsg
							+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);
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
		
		//Get FolderUploadAction
		FolderUploadAction folderUploadAction = null;		
		if(dirPath != null && !dirPath.isEmpty())
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("uploadDoc() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			folderUploadAction.totalCount = totalCount;
		}
		
		//Build Doc
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);		
		Doc doc = buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, 1, true, localRootPath, localVRootPath, size, checkSum);
		//Build ActionContext
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "uploadDoc";
		context.subEvent = "uploadDoc";
		context.eventName = "文件上传";	
		context.repos = repos;
		context.doc = doc;
		//context.newDoc = dstDoc;
		context.folderUploadAction = folderUploadAction;
		
		//Check Edit Right
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
		if(docUserAuth == null)
		{
			docSysErrorLog("您无此操作权限，请联系管理员", rt);
			writeJson(rt, response);
			
			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;
		}

		if(docUserAuth.getAccess() == 0)
		{
			docSysErrorLog("您无权访问该目录，请联系管理员", rt);
			writeJson(rt, response);
			
			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
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
				docSysErrorLog("您无此操作权限，请联系管理员", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(parentDocUserAuth.getAccess() == 0)
			{
				docSysErrorLog("您无权访问该目录，请联系管理员", rt);
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(parentDocUserAuth.getAddEn() == null || parentDocUserAuth.getAddEn() != 1)
			{
				docSysErrorLog("您没有该目录的新增权限，请联系管理员", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(isUploadSizeExceeded(size, parentDocUserAuth.getUploadSize()))
			{
				docSysDebugLog("uploadDoc size:" + size + " parentDocUserAuth max uploadSize:" + docUserAuth.getUploadSize(), rt);

				String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
				docSysErrorLog("上传文件大小超限[" + maxUploadSize + "]，请联系管理员", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;							
			}
		}
		else
		{
			if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
			{
				docSysErrorLog("您没有该文件的编辑权限，请联系管理员", rt);
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;				
			}
		}
		
		if(isUploadSizeExceeded(size, docUserAuth.getUploadSize()))
		{
			docSysDebugLog("uploadDoc size:" + size + " docUserAuth max uploadSize:" + docUserAuth.getUploadSize(), rt);
			
			String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
			docSysErrorLog("上传文件大小超限[" + maxUploadSize + "]，请联系管理员", rt);
			
			writeJson(rt, response);

			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;							
		}

		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String localParentPath = localRootPath + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
		}

		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = name + "_" + chunkIndex;
			String userTmpDir = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			if(FileUtil.saveFile(uploadFile,userTmpDir,fileChunkName) == null)
			{
				docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(combineDisabled != null)
			{
				Log.debug("uploadDoc combineDisabled!");
				rt.setData(chunkIndex);	//Return the sunccess upload chunkIndex
				writeJson(rt, response);
				return;				
			}
			
			//如果是最后一个分片则开始文件合并处理
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
			if(commitMsg == null || commitMsg.isEmpty())
			{
				commitMsg = "上传 " + path + name;
			}
			String commitUser = reposAccess.getAccessUser().getName();
			String chunkParentPath = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			int ret = 0;
			if(dbDoc == null || dbDoc.getType() == 0)
			{
				ret = addDoc(repos, doc, 
						uploadFile,
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);

				writeJson(rt, response);
				
				uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);
				return;				
			}
			
			//updateDoc
			ret = updateDoc(repos, doc, 
					uploadFile,  
					chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);					
		
			writeJson(rt, response);

			uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);			
			return;
		}
		
		docSysErrorLog("文件上传失败！", rt);
		writeJson(rt, response);
		addSystemLog(request, reposAccess.getAccessUser(), "uploadDoc", "uploadDoc", "上传文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));	
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
			String dirPath,	Long batchStartTime, Integer totalCount, //for folder upload			
			String authCode,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** uploadDocRS [" + path + name + "] ****************");
		Log.info("uploadDocRS  reposId:" + reposId + " remoteDirectory:" + remoteDirectory + " path:" + path + " name:" + name  + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " authCode:" + authCode + " commitMsg:" + commitMsg
							+ " dirPath:" + dirPath + " batchStartTime:" + batchStartTime + " totalCount:" + totalCount);

		ReturnAjax rt = new ReturnAjax(new Date().getTime());

		if(checkAuthCode(authCode, null) == null)
		{
			docSysErrorLog("无效授权码或授权码已过期！", rt);
			writeJson(rt, response);			
			return;
		}

		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();

		//upload to server directory
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径不能为空！", rt);
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
					docSysDebugLog("uploadDocRS 分片文件 " + fileChunkName +  " 暂存失败!", rt);
					docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
					writeJson(rt, response);
					
					addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  null, null, null, buildSystemLogDetailContent(rt));	
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
					docSysDebugLog("uploadDocRS 文件 [" + path + name +  "] 保存失败!", rt);
					docSysErrorLog("文件 " + name +  " 保存失败!", rt);
				
					writeJson(rt, response);
					
					addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  null, null, null, buildSystemLogDetailContent(rt));	
					return;
				}

				docSysDebugLog("uploadDocRS 文件 [" + path + name +  "] 保存成功!", rt);

				writeJson(rt, response);
				
				addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "成功",  null, null, null, buildSystemLogDetailContent(rt));	
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
					docSysDebugLog("uploadDocRS 文件 [" + path + name +  "] 保存失败!", rt);
					docSysErrorLog("文件 " + name +  " 保存失败!", rt);

					writeJson(rt, response);

					addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  null, null, null, buildSystemLogDetailContent(rt));	
					return;
				}

				writeJson(rt, response);
				docSysDebugLog("uploadDocRS 文件 [" + path + name +  "] 保存成功!", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "成功",  null, null, null, buildSystemLogDetailContent(rt));	
				return;
			}
			
			//多个则需要进行合并
			combineChunks(localParentPath,name,chunkNum,chunkSize,chunkTmpPath);
			deleteChunks(name,chunkIndex, chunkNum,chunkTmpPath);
			//Verify the size and FileCheckSum
			if(false == checkFileSizeAndCheckSum(localParentPath,name, size, checkSum))
			{
				docSysDebugLog("uploadDocRS [" + path + name + "] 文件校验失败", rt);
				docSysErrorLog("文件校验失败", rt);
				
				writeJson(rt, response);

				addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  null, null, null, buildSystemLogDetailContent(rt));	
				return;
			}
			
			writeJson(rt, response);
			docSysDebugLog("uploadDocRS [" + path + name + "] 文件校验成功", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "成功",  null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		Repos repos = getReposEx(reposId);
		if(!reposCheck(repos, rt, response))
		{
			return;
		}
						
		//禁用远程操作，否则会存在远程推送的回环（造成死循环）
		repos.disableRemoteAction = true;
				
		//Get FolderUploadAction
		FolderUploadAction folderUploadAction = null;
		if(dirPath != null && !dirPath.isEmpty())
		{
			folderUploadAction = getFolderUploadAction(request, reposAccess.getAccessUser(), repos, dirPath, batchStartTime, commitMsg, rt);
			if(folderUploadAction == null)
			{
				docSysDebugLog("uploadDocRS() folderUploadAction is null", rt);
				writeJson(rt, response);
				return;
			}
			folderUploadAction.beatTime = new Date().getTime();
			folderUploadAction.totalCount = totalCount;
		}

		//Build Doc
		String reposPath = Path.getReposPath(repos);
		String localRootPath = Path.getReposRealPath(repos);
		String localVRootPath = Path.getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, 1, true, localRootPath, localVRootPath, size, checkSum);
		//Build ActionContext
		ActionContext context = new ActionContext();
		context.requestIP = getRequestIpAddress(request);
		context.user = reposAccess.getAccessUser();
		context.event = "uploadDocRS";
		context.subEvent = "uploadDocRS";
		context.eventName = "文件上传";	
		context.repos = repos;
		context.doc = doc;
		context.newDoc = null;
		context.folderUploadAction = folderUploadAction;
		
		//Check Edit Right
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
		if(docUserAuth == null)
		{
			docSysErrorLog("您无此操作权限，请联系管理员", rt);
			writeJson(rt, response);

			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;
		}
		
		if(docUserAuth.getAccess() == 0)
		{
			docSysErrorLog("您无权访问该文件，请联系管理员", rt);
			writeJson(rt, response);

			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
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
				docSysErrorLog("您无此操作权限，请联系管理员", rt);
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(parentDocUserAuth.getAccess() == 0)
			{
				docSysErrorLog("您无权访问该目录，请联系管理员", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(parentDocUserAuth.getAddEn() == null || parentDocUserAuth.getAddEn() != 1)
			{
				docSysErrorLog("您没有该目录的新增权限，请联系管理员", rt);
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;
			}
			
			if(isUploadSizeExceeded(size, parentDocUserAuth.getUploadSize()))
			{
				docSysDebugLog("uploadDocRS size:" + size + " parentDocUserAuth max uploadSize:" + docUserAuth.getUploadSize(), rt);
				
				String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
				docSysErrorLog("上传文件大小超限[" + maxUploadSize + "]，请联系管理员", rt);
				
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;							
			}
		}
		else
		{
			if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
			{
				docSysErrorLog("您没有该文件的编辑权限，请联系管理员", rt);
				writeJson(rt, response);

				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
				return;				
			}
		}
		
		if(isUploadSizeExceeded(size, docUserAuth.getUploadSize()))
		{
			docSysDebugLog("uploadDocRS size:" + size + " docUserAuth max uploadSize:" + docUserAuth.getUploadSize(), rt);
			
			String maxUploadSize = getMaxUploadSize(docUserAuth.getUploadSize());
			docSysErrorLog("上传文件大小超限[" + maxUploadSize + "]，请联系管理员", rt);
			writeJson(rt, response);
			
			//upload failed
			uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
			return;							
		}

		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String localParentPath = localRootPath + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
		}

		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = name + "_" + chunkIndex;
			String userTmpDir = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			if(FileUtil.saveFile(uploadFile,userTmpDir,fileChunkName) == null)
			{
				docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
				writeJson(rt, response);
				
				//upload failed
				uploadAfterHandler(0, doc, name, null, null, null, reposAccess, context, rt);
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
			if(commitMsg == null || commitMsg.isEmpty())
			{
				commitMsg = "上传 " + path + name;
			}
			String commitUser = reposAccess.getAccessUser().getName();
			String chunkParentPath = Path.getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			
			int ret = 0;
			if(dbDoc == null || dbDoc.getType() == 0)
			{
				ret = addDoc(repos, doc, 
						uploadFile,
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
				
				writeJson(rt, response);

				uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);			
				return;
			}

			//updateDoc
			ret = updateDoc(repos, doc, 
					uploadFile,  
					chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);					
		
			writeJson(rt, response);	

			uploadAfterHandler(ret, doc, name, chunkIndex, chunkNum, chunkParentPath, reposAccess, context, rt);			
			return;
		}
		
		
		docSysErrorLog("文件上传失败！", rt);
		writeJson(rt, response);
		addSystemLog(request, reposAccess.getAccessUser(), "uploadDocRS", "uploadDocRS", "上传文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));	
	}
	
	
	/****************   Upload a Picture for Markdown ******************/
	@RequestMapping("/uploadMarkdownPic.do")
	public void uploadMarkdownPic(
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
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));			
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
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));			
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
				
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));			
				return;
			}
			
			if(commitMsg == null || commitMsg.isEmpty())
			{
				commitMsg = "更新 " + path + name;
			}
			ret = updateRealDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
			
			writeJson(rt, response);
	
			if(ret)
			{
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "成功",  repos, doc, null, buildSystemLogDetailContent(rt));			
				deleteTmpRealDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}
			else
			{
				addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));			
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
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改备注", "成功",  repos, doc, null, buildSystemLogDetailContent(rt));			
			deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
			executeCommonActionList(actionList, rt);
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "updateDocContent", "updateDocContent", "修改备注", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));						
		}
	}
	
	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** tmpSaveDocContent [" + path + name + "] ****************");
		Log.info("tmpSaveVirtualDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		//Log.debug("tmpSaveVirtualDocContent content:[" + content + "]");
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
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
				docSysErrorLog("saveRealDocContent Error!", rt);
				docSysDebugLog("tmpSaveVirtualDocContent() saveTmpRealDocContent [" + doc.getPath() + doc.getName() + "]", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "tmpSaveDocContent", "tmpSaveDocContent", "文件修改临时保存", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));						
			}			
		}
		else
		{
			if(saveTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				docSysErrorLog("saveVirtualDocContent Error!", rt);
				docSysDebugLog("tmpSaveVirtualDocContent() saveTmpRealDocContent [" + doc.getPath() + doc.getName() + "]", rt);
				addSystemLog(request, reposAccess.getAccessUser(), "tmpSaveDocContent", "tmpSaveDocContent", "备注修改临时保存", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));						
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
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
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
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
		}
	}

	public void downloadDocPrepare_FSM(Repos repos, Doc doc, ReposAccess reposAccess,  boolean remoteStorageEn, ReturnAjax rt)
	{	
		if(isFSM(repos) == false)
		{
			//文件服务器前置仓库不允许远程存储
			remoteStorageEn = false;
			//从文件服务器拉取文件
			remoteServerCheckOut(repos, doc, null, null, null, null, 3, null);
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
	private boolean remoteStorageCheckOut(Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, int pullType, ReturnAjax rt)
	{
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null)
		{
			docSysErrorLog("远程存储未设置！", rt);
			docSysDebugLog("remoteStorageCheckOut() remote is null", rt);
			return false;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
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
		docLock = lockDoc(doc, lockType, 2*60*60*1000, accessUser, rt, true,lockInfo);	//lock 2 Hours 2*60*60*1000
		
		if(docLock == null)
		{
			docSysDebugLog("remoteStorageCheckOut() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);
			return false;
		}
		
		channel.remoteStoragePull(remote, repos, doc, accessUser, commitId, recurcive, pullType, rt);
		DocPullResult pullResult = (DocPullResult) rt.getDataEx();
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
	public void queryDownloadPrepareTask(String taskId, HttpServletResponse response,HttpServletRequest request,HttpSession session)
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
			if(checkAuthCode(authCode, null) == null)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
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
			writeJson(rt, response);			
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
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
	
	@RequestMapping(value="/downloadDoc/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}/{encryptEn}", method=RequestMethod.GET)
	public void downloadDoc(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, @PathVariable("encryptEn") Integer encryptEn,
			String disposition,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Log.infoHead("************** downloadDoc ****************");
		Log.info("downloadDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId + " encryptEn:" + encryptEn);
		
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
			if(checkAuthCode(authCode, null) == null)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			return;
		}
	
		Log.info("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
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
			if(checkAuthCode(authCode, null) == null)
			{
				rt.setError("无效授权码或授权码已过期！");
				writeJson(rt, response);			
				return;
			}
			//reposAccess = getAuthCode(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			if(reposAccess == null)
			{
				docSysErrorLog("非法仓库访问！", rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = Base64Util.base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			return;
		}
	
		Log.info("downloadDocEx targetPath:" + targetPath + " targetName:" + targetName);		
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

		Log.infoHead("************** getDocContent [" + path + name + "] ************");
		Log.info("getDocContent reposId:" + reposId + " path:" + path + " name:" + name + " docType:" + docType+ " shareId:" + shareId + " commitId:" + commitId);

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
				if(isFSM(repos) == false)
				{
					remoteServerCheckOut(repos, doc, null, null, null, commitId, 3, null);
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
					docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
					writeJson(rt, response);			
					return;
				}
				if(remoteDoc.getType() == 0)
				{
					docSysErrorLog(name + " 不存在！", rt);
					writeJson(rt, response);			
					return;				
				}
				else if(remoteDoc.getType() == 2)
				{
					docSysErrorLog(name + " 是目录！", rt);
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
						remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);
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
			remoteServerCheckOut(repos, doc, null, null, null, null, 3, null);
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
		
		if(checkAuthCode(authCode, null) == null)
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
		
		Doc dbDoc = docSysGetDoc(repos, doc, false);
		if(dbDoc == null || dbDoc.getType() == null || dbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + " 不存在！", rt);
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
		Log.infoHead("*************** downloadDocRS [" + path + name + "] ********************");
		Log.info("downloadDocRS reposId:" + reposId + " remoteDirectory: " + remoteDirectory + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		
		if(checkAuthCode(authCode, null) == null)
		{
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		if(path == null || name == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		path = new String(path.getBytes("ISO8859-1"),"UTF-8");	
		path = Base64Util.base64Decode(path);
		if(path == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		name = new String(name.getBytes("ISO8859-1"),"UTF-8");	
		name = Base64Util.base64Decode(name);
		if(name == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//Get SubDocList From Server Dir
		if(reposId == null)
		{
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径不能为空！", rt);
				writeJson(rt, response);			
				return;				
			}
			remoteDirectory = new String(remoteDirectory.getBytes("ISO8859-1"),"UTF-8");	
			remoteDirectory = Base64Util.base64Decode(remoteDirectory);
			if(remoteDirectory == null)
			{
				docSysErrorLog("服务器路径解码失败！", rt);
				writeJson(rt, response);			
				return;
			}
			sendTargetToWebPage(remoteDirectory + path, name, remoteDirectory + path, rt, response, request,false, null);
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
		
		Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限下载文件
		ReposAccess reposAccess = getAuthCode(authCode).getReposAccess();
		if(checkUserDownloadRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
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
			docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String targetName = downloadDoc.targetName;	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = Base64Util.base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
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
		Log.infoHead("*************** getDocFileLink [" + path + name + "] ********************");		
		Log.info("getDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId);

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
		doc.setShareId(shareId);
		path = doc.getPath();
		name = doc.getName();
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//前置类型仓库，需要先将文件CheckOut出来
			if(isFSM(repos) == false)
			{
				remoteServerCheckOut(repos, doc, null, null, null, null, 3, null);
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
				remoteDoc = verReposGetDoc(repos, doc, commitId);
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
			if(remoteDoc.getType() == 0)
			{
				docSysErrorLog(name + " 不存在！", rt);
				writeJson(rt, response);			
				return;				
			}
			else if(remoteDoc.getType() == 2)
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
					verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
				}
				else
				{
					remoteServerCheckOut(repos, doc, null, null, null, commitId, 3, null);
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
		Log.infoHead("************** lockDoc [" + path + name + "] ****************");
		Log.info("lockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = null;
		if(authCode != null)
		{
			if(checkAuthCode(authCode, null) == null)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				rt.setError("无效授权码");
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
		int lockDuration = 2*60*60*1000;	//文件编辑可以锁定两个小时
		if(lockType == DocLock.LOCK_TYPE_FORCE)	//If want to force lock, must check all subDocs not locked
		{
			subDocCheckFlag = true;
			lockDuration  =  60*60*1000; //强制锁定无法解锁，因此只能锁定一个小时
		}
		
		DocLock docLock = null;
		String lockInfo = "lockDoc() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
    	docLock = lockDoc(doc, lockType, lockDuration, reposAccess.getAccessUser(), rt, subDocCheckFlag, lockInfo); //24 Hours 24*60*60*1000 = 86400,000
		
		if(docLock == null)
		{
			docSysDebugLog("lockDoc() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);			
			writeJson(rt, response);
			
			addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "锁定文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));
			return;			
		}
		
		Log.debug("lockDoc : " + doc.getName() + " success");
		rt.setData(doc);
		writeJson(rt, response);	
		
		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "锁定文件", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
	}
	
	/****************   SyncLock.unlock a Doc ******************/
	@RequestMapping("/unlockDoc.do")  //SyncLock.unlock Doc主要用于用户解锁doc
	public void unlockDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
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
			if(checkAuthCode(authCode, null) == null)
			{
				Log.debug("lockDoc checkAuthCode Failed");
				rt.setError("无效授权码");
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

		addSystemLog(request, reposAccess.getAccessUser(), "lockDoc", "lockDoc", "解锁文件", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
	}
	
	private boolean isForceUnlockAllow(Doc doc, Integer lockType, User accessUser) {
		
		if(accessUser.getType() < 2)	//超级管理员才可以强行解锁
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
	public void getDocHistory(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer historyType,Integer maxLogNum, 
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** getDocHistory [" + path + name + "] ****************");
		Log.info("getDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
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
		Log.infoHead("************** getHistoryDetail [" + path + name + "] ****************");
		Log.info("getHistoryDetail reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
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
		Log.infoHead("************** downloadHistoryDocPrepare [" + path + name + "] ****************");
		Log.info("downloadHistoryDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId: " + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);
		
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
			downloadPrepareTask.commitId = commitId;
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
			buildDownloadList(repos, false, vDoc, commitId, downloadList);
			if(downloadList != null && downloadList.size() == 0)
			{
				docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 未改动",rt);
				writeJson(rt, response);	
				return;
			}
		}
			
		successDocList = verReposCheckOut(repos, false, vDoc, userTmpDir, targetName, commitId, true, true, downloadList);
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
		
		addSystemLog(request, reposAccess.getAccessUser(), "downloadHistoryDocPrepare", "downloadHistoryDocPrepare", "下载历史文件", "成功", repos, doc, null, "历史版本:" + commitId);	
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
		Log.infoHead("************** revertDocHistory [" + path + name + "] ****************");
		Log.info("revertDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);

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
		
		//User Right Check
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			writeJson(rt, response);	
			return;
		}
		
		if(docUserAuth.getAccess() == null || docUserAuth.getAccess() != 1)
		{
			rt.setError("您无权访问该文件，请联系管理员");
			writeJson(rt, response);	
			return;
		}
		
		if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
		{
			rt.setError("您没有该文件的编辑权限，请联系管理员");
			writeJson(rt, response);	
			return;
		}
		
		//Check repos revert Right
		if(doc.getDocId() == 0)
		{
			if(docUserAuth.getIsAdmin() == null || docUserAuth.getIsAdmin() != 1)
			{
				rt.setError("非仓库管理员，禁止对整个仓库执行恢复操作");
				writeJson(rt, response);	
				return;
			}
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
		
		
		if(curDoc.getIsRealDoc() == true && curDoc.getType() == 2)
		{
			if(docUserAuth.getIsAdmin() == null || docUserAuth.getIsAdmin() != 1)
			{
				rt.setError("非仓库管理员，禁止对整个目录执行恢复操作");
				writeJson(rt, response);	
				return;
			}
		}
						
		//lockDoc
		DocLock docLock = null;
		
		int lockType = isRealDoc? DocLock.LOCK_TYPE_FORCE : DocLock.LOCK_TYPE_VFORCE;
		String lockInfo = "revertDocHistory() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
    	docLock = lockDoc(doc, lockType,  2*60*60*1000, reposAccess.getAccessUser(), rt, false, lockInfo);
		
		if(docLock == null)
		{
			writeJson(rt, response);
			
			docSysDebugLog("revertDocHistory() lockDoc [" + doc.getPath() + doc.getName() + "] Failed!", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
			return;
		}

		boolean revertResult = false;
		List<CommonAction> asyncActionList = new ArrayList<CommonAction>();
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
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取本地文件信息失败!",rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);

					docSysDebugLog("revertDocHistory() fsGetDoc [" + doc.getPath() + doc.getName() + "] Failed", rt);					
					addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
					return;				
				}
	
				Doc remoteEntry = verReposGetDoc(repos, doc, null);
				if(remoteEntry == null)
				{
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取远程文件信息失败!",rt);
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);
					
					docSysDebugLog("revertDocHistory() verReposGetDoc [" + doc.getPath() + doc.getName() + "] Failed", rt);					
					addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
					return;				
				}
				
				Doc dbDoc = dbGetDoc(repos, doc, false);
				
				ScanOption scanOption = new ScanOption();
				scanOption.scanType = 2; //localChanged or dbDocRevisionIsNullAsLocalChange, remoteNotChecked
				scanOption.scanTime = new Date().getTime();
				scanOption.localChangesRootPath = Path.getReposTmpPath(repos) + "reposSyncupScanResult/revertDocHistory-localChanges-" + scanOption.scanTime + "/";
				scanOption.remoteChangesRootPath = Path.getReposTmpPath(repos) + "reposSyncupScanResult/revertDocHistory-remoteChanges-" + scanOption.scanTime + "/";
				
				if(syncupScanForDoc_FSM(repos, doc, dbDoc, localEntry,remoteEntry, reposAccess.getAccessUser(), rt, 2, scanOption) == false)
				{
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 同步状态获取失败!",rt);
					Log.debug("revertDocHistory() syncupScanForDoc_FSM!");	
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);

					docSysDebugLog("revertDocHistory() syncupScanForDoc_FSM [" + doc.getPath() + doc.getName() + "] Failed", rt);
					addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
					return;
				}
				
				if(isLocalChanged(scanOption))
				{
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					Log.info("revertDocHistory() 本地有改动！");
					
					docSysDebugLog("revertDocHistory() [" + doc.getPath() + doc.getName() + "] local changed", rt);					
					String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, scanOption.localChangesRootPath, 2, null, null);
					if(revision == null)
					{
						unlockDoc(doc, lockType, reposAccess.getAccessUser());
						docSysErrorLog("本地文件有改动", rt);
						writeJson(rt, response);						
		
						docSysDebugLog("revertDocHistory() verReposDocCommit [" + doc.getPath() + doc.getName() + "] Failed", rt);
						addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
						return;
					}
					else
					{
						//如果版本仓库是远程仓库，则推送到远程仓库
						verReposPullPush(repos, true, rt);
					}
				}
				
				cleanSyncUpTmpFiles(scanOption);
				
				//判断是否为最新版本
				if(localEntry.getType() != 0)
				{
					if(commitId.equals(remoteEntry.getRevision()))
					{
						docSysDebugLog("revertDocHistory() commitId:" + commitId + " latestCommitId:" + remoteEntry.getRevision(), rt);
						docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 已是最新版本!",rt);					
						unlockDoc(doc, lockType, reposAccess.getAccessUser());
						writeJson(rt, response);
							
						addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
						return;
					}
				}	
			}
			
			revertResult  = revertDocHistory(repos, doc, commitId, commitMsg, commitUser, reposAccess.getAccessUser(), rt, null, asyncActionList);
		}	
		else
		{
			File localVDoc = new File(doc.getLocalVRootPath() + vDoc.getPath() + vDoc.getName());
			if(!vDoc.getName().isEmpty() && localVDoc.exists())
			{
				String latestCommitId = verReposGetLatestRevision(repos, false, vDoc);
				if(latestCommitId != null && latestCommitId.equals(commitId))
				{
					docSysDebugLog("revertDocHistory() commitId:" + commitId + " latestCommitId:" + latestCommitId, rt);
					docSysErrorLog("恢复失败:" + vDoc.getPath() + vDoc.getName() + " 已是最新版本!",rt);					
					unlockDoc(doc, lockType, reposAccess.getAccessUser());
					writeJson(rt, response);

					addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败",  repos, doc, null, buildSystemLogDetailContent(rt));				
					return;				
				}
			}
			revertResult = revertDocHistory(repos, vDoc, commitId, commitMsg, commitUser, reposAccess.getAccessUser(), rt, null, null);
		}
		
		unlockDoc(doc, lockType, reposAccess.getAccessUser());
		
		writeJson(rt, response);
		
		if(revertResult)
		{
			executeCommonActionListAsync(asyncActionList, rt);
			addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "成功", repos, doc, null, buildSystemLogDetailContent(rt));
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "revertDocHistory", "revertDocHistory", "恢复文件历史版本", "失败", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
	}

	/****************   set  LocalBackup Ignore ******************/
	@RequestMapping("/setLocalBackupIgnore.do")
	public void setLocalBackupIgnore(Integer reposId, String path, String name,
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
			addSystemLog(request, reposAccess.getAccessUser(), "setLocalBackupIgnore", "setLocalBackupIgnore", "本地自动备份忽略设置", "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setLocalBackupIgnore", "setLocalBackupIgnore", "本地自动备份忽略设置", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc.offsetPath);    		
    		getLocalBackupIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  RemoteBackup Ignore ******************/
	@RequestMapping("/setRemoteBackupIgnore.do")
	public void setRemoteBackupIgnore(Integer reposId, String path, String name,
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
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteBackupIgnore", "setRemoteBackupIgnore", "远程自动备份忽略设置", "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setRemoteBackupIgnore", "setRemoteBackupIgnore", "远程自动备份忽略设置", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc.offsetPath);    		
    		getRemoteBackupIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  RealDoc TextSearch Ignore ******************/
	@RequestMapping("/setTextSearchIgnore.do")
	public void setTextSearchIgnore(Integer reposId, String path, String name,
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
			addSystemLog(request, reposAccess.getAccessUser(), "setTextSearchIgnore", "setTextSearchIgnore", "全文搜索忽略设置", "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setTextSearchIgnore", "setTextSearchIgnore", "全文搜索忽略设置", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc.offsetPath);    		
    		getTextSearchIgnoreList(repos, subDoc, configPath, ignoreList);
    	}
    	return ignoreList;
	}
	
	/****************   set  Doc Version Ignore ******************/
	@RequestMapping("/setVersionIgnore.do")
	public void setVersionIgnore(Integer reposId, String path, String name,
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
		
		Integer verCtr = repos.getVerCtrl();
		if(verCtr == null || verCtr == 0)
		{
			rt.setError("该仓库未开启版本管理，请联系管理员!");			
			writeJson(rt, response);
			return;
		}
		
		//设置文件密码
		if(setVersionIgnore(repos, doc, ignore) == false)
		{
			rt.setError("版本管理设置失败");			
			addSystemLog(request, reposAccess.getAccessUser(), "setVersionIgnore", "setVersionIgnore", "版本管理忽略设置", "失败", repos, doc, null, buildSystemLogDetailContent(rt));				
		}
		else
		{
			addSystemLog(request, reposAccess.getAccessUser(), "setVersionIgnore", "setVersionIgnore", "版本管理忽略设置", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
    		Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subFile.getName(), subDocLevel, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), subFile.length(), "", doc.offsetPath);    		
    		getVersionIgnoreList(repos, subDoc, reposVersionIgnoreSettingPath, ignoreList);
    	}
    	return ignoreList;
	}

	/****************   set  Doc Access PWD ******************/
	@RequestMapping("/setDocPwd.do")
	public void setDocPwd(Integer reposId, String path, String name,
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
			addSystemLog(request, reposAccess.getAccessUser(), "setDocPwd", "setDocPwd", "设置文件访问密码", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
		Log.infoHead("************** addRemoteDocShare [" + path + name + "] ****************");
		Log.info("addRemoteDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
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
			docSysErrorLog("创建文件分享失败！", rt);
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

	/****************   add a DocShare ******************/
	@RequestMapping("/addDocShare.do")
	public void addDocShare(Integer reposId, String path, String name,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn, Integer downloadEn, Integer heritable,
			String sharePwd,
			Long shareHours,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("************** addDocShare [" + path + name + "] ****************");		
		Log.info("addDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
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
		
		//检查用户是否有权限分享文件
		if(checkUserShareRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(checkUserAccessPwd(repos, doc, session, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
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
			docSysErrorLog("创建文件分享失败！", rt);
			addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", "失败", repos, doc, null, buildSystemLogDetailContent(rt));	
		}
		else
		{
			shareLink = buildShareLink(request, IpAddress, reposId, shareId);
			docShare.shareLink = shareLink;
			rt.setData(docShare);
			rt.setDataEx(IpAddress);
			
			addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", "成功", repos, doc, null, buildSystemLogDetailContent(rt));	
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
		Log.infoHead("************** updateDocShare ****************");		
		Log.info("updateDocShare() shareId:" + shareId + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
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
			docSysErrorLog("分享信息不存在！", rt);
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
			docSysErrorLog("更新文件分享失败！", rt);
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
		Log.infoHead("************** deleteDocShare ****************");		
		Log.info("deleteDocShare() shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(shareId == null)
		{
			docSysErrorLog("文件分享信息不能为空！", rt);
			writeJson(rt, response);			
			return;				
		}
		
		DocShare docShare = getDocShare(shareId);
		if(docShare == null)
		{
			docSysErrorLog("分享信息不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		DocShare qDocShare = new DocShare();
		qDocShare.setShareId(shareId);				
		if(reposService.deleteDocShare(qDocShare) == 0)
		{
			docSysErrorLog("删除文件分享失败！", rt);
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
				remoteServerCheckOut(repos, rootDoc, null, null, null, null, 3, null);
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
		Log.debug("getSubDocListForCompressFile path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		Log.debug("getSubDocListForCompressFile zipFilePath:" + zipFilePath);
		
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
               Log.debug("getSubDocListForCompressFile path:" + entry.getPath() + " size:" + entry.getSize() + " packedSize:" + entry.getPackedSize()); 
               String subDocPath = rootPath + entry.getPath().replace("\\", "/");
               Doc subDoc = buildBasicDocFromCompressEntry(rootDoc, subDocPath, entry);
               subDocList.add(subDoc);
            }
        } catch (Exception e) {
            errorLog("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error occurs");
            errorLog(e);
        } finally {
            if (inArchive != null) {
                try {
                    inArchive.close();
                } catch (SevenZipException e) {
                    errorLog("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error closing archive");
                    errorLog(e);
                }
            }
            if (randomAccessFile != null) {
                try {
                    randomAccessFile.close();
                } catch (IOException e) {
                    errorLog("getSubDocListForCompressFile(Repos, Doc, String, String, ReturnAjax)() Error closing file");
                    errorLog(e);
                }
            }
        }
		return subDocList;
	}

	private Doc buildBasicDocFromCompressEntry(Doc rootDoc, String docPath, ISimpleInArchiveItem entry) throws SevenZipException {
		Doc subDoc = null;
		Log.debug("buildBasicDocFromCompressEntry docPath:" + docPath + " entryPath:" + entry.getPath());
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
            errorLog(e);
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                errorLog(e);
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
            errorLog(e);
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
                errorLog(e);
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
            errorLog(e);
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
                errorLog(e);
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
            errorLog(e);
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
                errorLog(e);
            }
        }
		return subDocList;
	}

	protected List<Doc> getSubDocListFor7z(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
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
            errorLog(e);
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                errorLog(e);
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
           errorLog(e);
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
                errorLog(e);
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

	protected List<Doc> getSubDocListForZip(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
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
			errorLog(e);
			subDocList = null;
		} finally {
			if(zipFile != null)
			{
				try {
					zipFile.close();
				} catch (IOException e) {
					errorLog(e);
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
	