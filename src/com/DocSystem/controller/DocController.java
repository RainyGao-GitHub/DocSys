package com.DocSystem.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Scanner;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.binary.Base64;
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

import util.ReadProperties;
import util.ReturnAjax;
import util.DocConvertUtil.Office2PDF;
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
import com.alibaba.druid.support.json.JSONParser;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.github.junrar.Archive;
import com.github.junrar.rarfile.FileHeader;
import com.jcraft.jzlib.GZIPInputStream;
import com.DocSystem.common.AuthCode;
import com.DocSystem.common.CommonAction;
import com.DocSystem.common.DocChange;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.QueryCondition;
import com.DocSystem.common.ReposAccess;
import com.DocSystem.common.CommonAction.Action;
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
	0：未锁定
	2：绝对锁定，自己无法解锁，锁过期时间2天
	1：RealDoc CheckOut，对自己无效，锁过期时间2天
	3：VirtualDoc Online Edit，对自己无效，锁过期时间2天
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
		System.out.println("addDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content+ " shareId:" + shareId);
		//System.out.println(Charset.defaultCharset());
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath,localVRootPath, 0L, "");
		doc.setContent(content);
				
		if(checkUserAddRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc tmpDoc = docSysGetDoc(repos, doc);
		if(tmpDoc != null && tmpDoc.getType() != 0)
		{
			docSysErrorLog(doc.getName() + " 已存在", rt);
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
		writeJson(rt, response);
		
		if(ret == false)
		{
			System.out.println("add() add Doc Failed");
			return;
		}

		executeCommonActionList(actionList, rt);
	}

	/****************   Feeback  ******************/
	@RequestMapping("/feeback.do")
	public void feeback(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("feeback reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content);
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);		
		Doc doc = buildBasicDoc(reposId, null, null, path, name, level, type, true, localRootPath, localVRootPath, 0L, "");
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
			System.out.println("feeback() addDoc failed");
			return;
		}
		
		executeCommonActionList(actionList, rt);
	}
	
	private Integer getReposIdForFeeback() {
		String tempStr = null;
		tempStr = ReadProperties.read("docSysConfig.properties", "feebackReposId");
	    if(tempStr == null || "".equals(tempStr))
	    {
	    	return 5;
	    }
	    
	    return(Integer.parseInt(tempStr));
	}

	/****************   refresh a Document ******************/
	@RequestMapping("/refreshDoc.do")
	public void refreshDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg, Integer force,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("refreshDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " force:" + force+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);

		if(commitMsg == null)
		{
			commitMsg = "同步 " + doc.getPath() + doc.getName();
		}
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		if(false == checkDocLocked(repos.getId(), doc, reposAccess.getAccessUser(), false))
		{
			if(force != null && force == 1)
			{
				addDocToSyncUpList(actionList, repos, doc, Action.FORCESYNC, reposAccess.getAccessUser(), commitMsg);
			}
			else
			{
				addDocToSyncUpList(actionList, repos, doc, Action.SYNC, reposAccess.getAccessUser(), commitMsg);
			}
		}
		
		writeJson(rt, response);
		
		new Thread(new Runnable() {
			public void run() {
				System.out.println("refreshDoc() executeUniqueCommonActionList in new thread");
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
		System.out.println("deleteDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
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
			executeCommonActionList(actionList, rt);
		}
	}
	

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String dstName, 
							String commitMsg, 
							Integer shareId,
							HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("renameDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type +  " dstName:" + dstName+ " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
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
	
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc parentDoc = buildBasicDoc(reposId, pid, null, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		
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
		Doc srcDoc = buildBasicDoc(reposId, docId, pid, path, name, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, pid, path, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		boolean ret = renameDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type, 
			String commitMsg, 
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("moveDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);

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

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc srcParentDoc = buildBasicDoc(reposId, srcPid, null, srcPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserDeleteRight(repos, reposAccess.getAccessUser().getId(), srcParentDoc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
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
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer reposId, Long docId, Long srcPid, String srcPath, String srcName, Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel, Integer type,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("copyDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, srcPath, srcName, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
	
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
				
		//检查用户是否有目标目录权限新增文件
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		
		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
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
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, srcPath, srcName, null, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, dstPath, dstName, null, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = docSysGetDoc(repos, srcDoc);
		if(srcDbDoc == null || srcDbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	
	/****************   execute a Document ******************/
	@RequestMapping("/executeDoc.do")
	public void executeDoc(Integer reposId, String path, String name,
			String cmdLine,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("executeDoc reposId:" + reposId + " path:" + path + " name:" + name);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		
		//repos是本地服务器的目录（远程的暂不支持）
		String ret = localExecuteDoc(repos, doc, cmdLine, reposAccess.getAccessUser());
		
		rt.setData(ret);
		writeJson(rt, response);
	}
	
	private String localExecuteDoc(Repos repos, Doc doc, String cmdLine, User user) {
		
		//命令在userTmp目录下运行
		String runPath = getReposTmpPathForUser(repos, user);
		File dir = new File(runPath);
		
		String cmd = buildDocExecuteCmd(repos, doc, cmdLine);
		System.out.println("executeDoc cmd:" + cmd);
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
		System.out.println("checkDocInfo  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum+ " shareId:" + shareId);
		
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
				
		//检查登录用户的权限
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc parentDoc = buildBasicDoc(reposId, pid, null, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		DocAuth UserDocAuth = getUserDocAuth(repos, reposAccess.getAccessUser().getId(), parentDoc);
		if(UserDocAuth == null)
		{
			docSysErrorLog("您无权在该目录上传文件!", rt);
			writeJson(rt, response);
			return;
		}
		
		//最大上传文件大小限制检查 
		Integer MaxFileSize = getMaxFileSize();	//获取系统最大文件限制
		if(MaxFileSize != null)
		{
			if(size > MaxFileSize.longValue()*1024*1024)
			{
				docSysErrorLog("上传文件超过 "+ MaxFileSize + "M", rt);
				writeJson(rt, response);
				return;
			}
		}
			
		//任意用户上传文件大小限制检查（30M）
		if((UserDocAuth.getGroupId() == null) && ((UserDocAuth.getUserId() == null) || (UserDocAuth.getUserId() == 0)))
		{
			if(size > 30*1024*1024)
			{
				docSysErrorLog("非仓库授权用户最大上传文件不超过30M!", rt);
				writeJson(rt, response);
				return;
			}
		}
		
		//是否可以秒传检查(文件是否已存在且校验码一致或者文件不存在但系统中存在相同校验码的文件)
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);

		Doc fsDoc = fsGetDoc(repos, doc);
		if(fsDoc != null && fsDoc.getType() != 0)
		{	
			if(isUploadCanSkip(repos, doc, fsDoc))
			{
				rt.setData(fsDoc);
				rt.setMsgData("1");
				docSysDebugLog("checkDocInfo() " + name + " 已存在，且checkSum相同！", rt);
				writeJson(rt, response);
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
			
		System.out.println("checkDocInfo() " + sameDoc.getName() + " has same checkSum " + checkSum + " try to copy from it");
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
			docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied ok！", rt);
			writeJson(rt, response);
					
			executeCommonActionList(actionList, rt);
			return;
		}
		else
		{
			rt.setStatus("ok");
			rt.setMsgData("3");
			docSysDebugLog("checkDocInfo() " + sameDoc.getName() + " was copied failed！", rt);
			writeJson(rt, response);
			return;
		}
	}
	
	private Repos getReposInfo(Integer reposId, DocShare docShare) {
		if(docShare == null || docShare.getType() == null || docShare.getType() == 0)
		{
			return reposService.getRepos(reposId);
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

	private boolean isUploadCanSkip(Repos repos, Doc doc, Doc fsDoc) {
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
			
		//非文件管理系统类型仓库不支持秒传
		if(repos.getType() != 1)
		{
			return false;
		}
			
		//数据库记录不存在无法检查文件是否相同
		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc == null)
		{
			return false;				
		}
			
		//数据库记录与本地文件已经不一致无法检查文件是否相同
		if(isDocLocalChanged(repos, dbDoc, fsDoc))
		{
			return false;					
		}
			
		if(isDocCheckSumMatched(dbDoc,doc.getSize(), doc.getCheckSum()))
		{
			return true;
		}
		
		return false;
	}

	private Doc getSameDoc(Long size, String checkSum, Integer reposId) {

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
		System.out.println("isDocCheckSumMatched() size:" + size + " checkSum:" + checkSum + " docSize:" + doc.getSize() + " docCheckSum:"+doc.getCheckSum());

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
		System.out.println("checkChunkUploaded  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
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

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		
		//判断tmp目录下是否有分片文件，并且checkSum和size是否相同 
		String fileChunkName = name + "_" + chunkIndex;
		String userTmpDir = getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
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
			
			System.out.println("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				if(commitMsg == null)
				{
					commitMsg = "上传 " + path + name;
				}
				String commitUser = reposAccess.getAccessUser().getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				
				//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
				String localRootPath = getReposRealPath(repos);
				String localVRootPath = getReposVirtualPath(repos);

				String localParentPath = localRootPath + path;
				File localParentDir = new File(localParentPath);
				if(false == localParentDir.exists())
				{
					localParentDir.mkdirs();
				}
				
				Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);
				
				Doc dbDoc = docSysGetDoc(repos, doc);
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
		System.out.println("uploadDoc  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash+ " shareId:" + shareId);
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		String localParentPath = localRootPath + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
		}
		
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, 1, true, localRootPath, localVRootPath, size, checkSum);
		
		Doc dbDoc = docSysGetDoc(repos, doc);
		if(dbDoc == null || dbDoc.getType() == 0)	//0: add  1: update
		{
			Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
			if(checkUserAddRight(repos,reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		
		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = name + "_" + chunkIndex;
			String userTmpDir = getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			if(saveFile(uploadFile,userTmpDir,fileChunkName) == null)
			{
				docSysErrorLog("分片文件 " + fileChunkName +  " 暂存失败!", rt);
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
			String chunkParentPath = getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			if(dbDoc == null || dbDoc.getType() == 0)
			{
				boolean ret = addDoc(repos, doc, 
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
				boolean ret = updateDoc(repos, doc, 
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
			return;
		}
		else
		{
			docSysErrorLog("文件上传失败！", rt);
		}
		writeJson(rt, response);
	}
	
	/****************   Upload a Picture for Markdown ******************/
	@RequestMapping("/uploadMarkdownPic.do")
	public void uploadMarkdownPic(
			Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String imgName,
			@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, 
			HttpServletRequest request,HttpServletResponse response,HttpSession session) throws Exception
	{
		System.out.println("uploadMarkdownPic reposId:" + reposId + " docId:" + docId + " path:" + path + " name:" + name + " imgName:" + imgName);
		
		JSONObject res = new JSONObject();

		Repos repos = reposService.getRepos(reposId);
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
		
		path = base64Decode(path);
		if(path == null)
		{
			res.put("success", 0);
			res.put("message", "目标路径解码失败！");
			writeJson(res,response);		
			return;
		}
	
		name = base64Decode(name);
		if(name == null)
		{
			res.put("success", 0);
			res.put("message", "目标文件名解码失败！");
			writeJson(res,response);			
			return;
		}
		System.out.println("uploadMarkdownPic path:" + path +" name:"+ name);

		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc curDoc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);

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
		String docVName = getVDocName(curDoc);
		String localVDocPath = localVRootPath + docVName;
		String localParentPath = localVDocPath + "/res/";
		
		//Check and create localParentPath
		File dir = new File(localParentPath);
		if(!dir.exists())	
		{
			dir.mkdirs();
		}
		
		String retName = saveFile(file, localParentPath,fileName);
		if(retName == null)
		{
			res.put("success", 0);
			res.put("message", "upload failed: saveFile error!");
			writeJson(res,response);
			return;
		}
		
		String encTargetName = base64EncodeURLSafe(fileName);
		String encTargetPath = base64EncodeURLSafe(localParentPath);
		res.put("url", "/DocSystem/Doc/downloadDoc.do?targetPath="+encTargetPath+"&targetName="+encTargetName);
		res.put("success", 1);
		res.put("message", "upload success!");
		writeJson(res,response);
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			String content, Integer docType,
			String commitMsg,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);
		//System.out.println("updateDocContent content:[" + content + "]");
		//System.out.println("content size: " + content.length());
			
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);		
		String localVRootPath = getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		Doc dbDoc = docSysGetDoc(repos, doc);
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + path + name + " 不存在！", rt);
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
			if(isTextFile(name) == false)
			{
				docSysErrorLog(name + " 不是文本文件，禁止修改！", rt);
				writeJson(rt, response);
				return;
			}
			
			if(commitMsg == null)
			{
				commitMsg = "更新 " + path + name;
			}
			ret = updateRealDocContent(repos, doc, commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
			writeJson(rt, response);
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
			
			if(ret)
			{
				deleteTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser());
				executeCommonActionList(actionList, rt);
			}
		}
	}

	private void deleteTmpVirtualDocContent(Repos repos, Doc doc, User accessUser) {
		
		String docVName = getVDocName(doc);
		
		String userTmpDir = getReposTmpPathForTextEdit(repos, accessUser, false);
		
		String vDocPath = userTmpDir + docVName + "/";
		
		delFileOrDir(vDocPath);
	}
	
	private void deleteTmpRealDocContent(Repos repos, Doc doc, User accessUser) 
	{
		String userTmpDir = getReposTmpPathForTextEdit(repos, accessUser, true);
		String mdFilePath = userTmpDir + doc.getDocId() + "_" + doc.getName();
		delFileOrDir(mdFilePath);
	}
	
	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("tmpSaveVirtualDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		//System.out.println("tmpSaveVirtualDocContent content:[" + content + "]");
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
				
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		doc.setContent(content);
		
		if(docType == 1)
		{
			if(saveTmpRealDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				docSysErrorLog("saveVirtualDocContent Error!", rt);
			}			
		}
		else
		{
			if(saveTmpVirtualDocContent(repos, doc, reposAccess.getAccessUser(), rt) == false)
			{
				docSysErrorLog("saveVirtualDocContent Error!", rt);
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
		System.out.println("downloadDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " downloadType:" + downloadType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
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
			switch(repos.getType())
			{
			case 1:
			case 2:
				downloadDocPrepare_FSM(repos, doc, reposAccess.getAccessUser(), rt);				
				break;
			case 3:
			case 4:
				downloadDocPrepare_VRP(repos, doc, reposAccess.getAccessUser(), rt);				
				break;
			}
		}
		writeJson(rt, response);
	}

	public void downloadDocPrepare_VRP(Repos repos, Doc doc, User accessUser, ReturnAjax rt)
	{	
		Doc dbDoc = docSysGetDoc(repos, doc);
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			System.out.println("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
			return;
		}
				
		String targetName = doc.getName();
		String targetPath = getReposTmpPathForDownload(repos,accessUser);
				
		//Do checkout to local
		if(verReposCheckOut(repos, false, doc, targetPath, doc.getName(), null, true, true, null) == null)
		{
			docSysErrorLog("远程下载失败", rt);
			docSysDebugLog("downloadDocPrepare_FSM() verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " targetPath:" + targetPath + " targetName:" + doc.getName(), rt);
			return;
		}
				
		if(dbDoc.getType() == 1)
		{
			Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			docSysDebugLog("远程文件: 已下载并存储在用户临时目录", rt);
			return;
		}
		else if(dbDoc.getType() == 2)
		{
			if(isEmptyDir(targetPath + doc.getName(), true))
			{
				docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
				
			//doCompressDir and save the zip File under userTmpDir
			targetName = doc.getName() + ".zip";
			if(doc.getDocId() == 0)
			{
				targetName = repos.getName() + ".zip";
			}
			
			if(doCompressDir(targetPath, doc.getName(), targetPath, targetName, rt) == false)
			{
				rt.setError("压缩远程目录失败！");
				return;
			}
					
			Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			docSysDebugLog("远程目录: 已压缩并存储在用户临时目录", rt);
			return;
		}
	
		docSysErrorLog("本地未知文件类型:" + dbDoc.getType(), rt);
		return;		
	}
	
	public void downloadDocPrepare_FSM(Repos repos, Doc doc, User accessUser, ReturnAjax rt)
	{	
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			System.out.println("downloadDocPrepare_FSM() locaDoc " +doc.getPath() + doc.getName() + " 获取异常");
			docSysErrorLog("本地文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
			return;
		}
		
//		if(localEntry.getType() == 0)
//		{
//			System.out.println("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
//			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
//			return;
//		}
		
		String targetName = doc.getName();
		String targetPath = doc.getLocalRootPath() + doc.getPath();
		if(localEntry.getType() == 1)
		{
			Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
			rt.setData(downloadDoc);
			rt.setMsgData(0);	//下载完成后不能删除下载的文件
			docSysDebugLog("本地文件: 原始路径下载", rt);
			return;
		}

		targetPath = getReposTmpPathForDownload(repos,accessUser);
		if(localEntry.getType() == 2)
		{	
			if(isEmptyDir(doc.getLocalRootPath() + doc.getPath() + doc.getName(), true))
			{
				docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
			
			//doCompressDir and save the zip File under userTmpDir
			targetName = doc.getName() + ".zip";	
			if(doc.getDocId() == 0)
			{
				targetName = repos.getName() + ".zip";
			}

			if(doCompressDir(doc.getLocalRootPath() + doc.getPath(), doc.getName(), targetPath, targetName, rt) == false)
			{
				docSysErrorLog("压缩本地目录失败！", rt);
				return;
			}
			
			Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			docSysDebugLog("本地目录: 已压缩并存储在用户临时目录", rt);
			return;						
		}

		if(localEntry.getType() == 0)
		{
			Doc remoteEntry = verReposGetDoc(repos, doc, null);
			if(remoteEntry == null)
			{
				docSysDebugLog("downloadDocPrepare_FSM() remoteDoc " +doc.getPath() + doc.getName() + " 获取异常", rt);
				docSysErrorLog("远程文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
				return;
			}
				
			if(remoteEntry.getType() == 0)
			{
				System.out.println("downloadDocPrepare_FSM() Doc " +doc.getPath() + doc.getName() + " 不存在");
				docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
				return;	
			}
				
			//Do checkout to local
			if(verReposCheckOut(repos, false, doc, targetPath, doc.getName(), null, true, true, null) == null)
			{
				docSysErrorLog("远程下载失败", rt);
				docSysDebugLog("downloadDocPrepare_FSM() verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " targetPath:" + targetPath + " targetName:" + doc.getName(), rt);
				return;
			}
				
			if(remoteEntry.getType() == 1)
			{
				Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
				rt.setData(downloadDoc);
				rt.setMsgData(1);	//下载完成后删除已下载的文件
				docSysDebugLog("远程文件: 已下载并存储在用户临时目录", rt);
				return;
			}

			if(isEmptyDir(targetPath + doc.getName(), true))
			{
				docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
			
			//doCompressDir and save the zip File under userTmpDir
			targetName = doc.getName() + ".zip";		
			if(doCompressDir(targetPath, doc.getName(), targetPath, targetName, rt) == false)
			{
				rt.setError("压缩远程目录失败！");
				return;
			}
				
			Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
			rt.setData(downloadDoc);
			rt.setMsgData(1);	//下载完成后删除已下载的文件
			docSysDebugLog("远程目录: 已压缩并存储在用户临时目录", rt);
			return;
		}
		
		docSysErrorLog("本地未知文件类型:" + localEntry.getType(), rt);
		return;		
	}
	
	public void downloadVDocPrepare_FSM(Repos repos, Doc doc, User accessUser, ReturnAjax rt)
	{	
		Doc vDoc = buildVDoc(doc);

		printObject("downloadVDocPrepare_FSM vDoc:",vDoc);
		String targetName = vDoc.getName() +".zip";
		if(vDoc.getName().isEmpty())
		{
			targetName = repos.getName() + "_备注_.zip";	
			
			if(isEmptyDir(vDoc.getLocalRootPath(), true))
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
		
		String targetPath = getReposTmpPathForDownload(repos,accessUser);
		//doCompressDir and save the zip File under userTmpDir
		if(doCompressDir(vDoc.getLocalRootPath() + vDoc.getPath(), vDoc.getName(), targetPath, targetName, rt) == false)
		{
			docSysErrorLog("压缩本地目录失败！", rt);
			return;
		}
		
		Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
		rt.setData(downloadDoc);
		rt.setMsgData(1);	//下载完成后删除已下载的文件
		docSysDebugLog("远程目录: 已压缩并存储在用户临时目录", rt);
		return;		
	}
	
	/**************** download Doc ******************/
	@RequestMapping("/downloadDoc.do")
	public void downloadDoc(String targetPath, String targetName, 
			Integer deleteFlag, //是否删除已下载文件  0:不删除 1:删除
			Integer shareId,
			String authCode, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDoc  targetPath:" + targetPath + " targetName:" + targetName+ " shareId:" + shareId + " authCode:" + authCode);
		
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
			reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
		}
		if(reposAccess == null)
		{
			docSysErrorLog("非法仓库访问！", rt);
			writeJson(rt, response);
			return;	
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			writeJson(rt, response);			
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			writeJson(rt, response);			
			return;
		}
	
		System.out.println("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);
		
		sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false);
		
		if(deleteFlag != null && deleteFlag == 1)
		{
			delFileOrDir(targetPath+targetName);
		}
	}
	
	@RequestMapping(value="/downloadDoc/{targetPath}/{targetName}/{authCode}/{shareId}", method=RequestMethod.GET)
	public void downloadDoc(@PathVariable("targetPath") String targetPath,@PathVariable("targetName") String targetName,
			@PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDoc targetPath:" + targetPath + " targetName:" + targetName + " authCode:" + authCode + " shareId:" + shareId);
		
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
			reposAccess = authCodeMap.get(authCode).getReposAccess();
		}
		else
		{
			reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
		}
		
		if(reposAccess == null)
		{
			docSysErrorLog("非法仓库访问！", rt);
			writeJson(rt, response);
			return;	
		}
		
		if(targetPath == null || targetName == null)
		{
			docSysErrorLog("目标路径不能为空！", rt);
			return;
		}
		
		targetPath = new String(targetPath.getBytes("ISO8859-1"),"UTF-8");	
		targetPath = base64Decode(targetPath);
		if(targetPath == null)
		{
			docSysErrorLog("目标路径解码失败！", rt);
			return;
		}
	
		targetName = new String(targetName.getBytes("ISO8859-1"),"UTF-8");	
		targetName = base64Decode(targetName);
		if(targetName == null)
		{
			docSysErrorLog("目标文件名解码失败！", rt);
			return;
		}
	
		System.out.println("downloadDoc targetPath:" + targetPath + " targetName:" + targetName);		
		sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false);
	}
	
	/****************   this interface is for onlyoffice edit callback ******************/
	@RequestMapping("/saveDoc.do")
	protected void saveDoc(Integer reposId, String filePath, 
			Integer shareId,
			String authCode,		
			HttpServletRequest request, HttpServletResponse response,HttpSession session) {

		System.out.println("saveDoc reposId:" + reposId + " filePath:" + filePath + " shareId:" + shareId +" authCode:" + authCode);

		PrintWriter writer = null;
		try {
			writer = response.getWriter();
			ReturnAjax rt = new ReturnAjax();
			
			//Decode Path and Name
			if(filePath == null)
			{
				docSysErrorLog("文件路径未设置！", rt);
				writer.write("文件路径未设置");
				return;
			}
			
			filePath = new String(filePath.getBytes("ISO8859-1"),"UTF-8");	
			filePath = base64Decode(filePath);
			if(filePath == null)
			{
				docSysErrorLog("文件路径解码失败！", rt);
				writer.write("文件路径解码失败");			
				return;
			}			
		
			//Check authCode or reposAccess
			ReposAccess reposAccess = null;
			if(authCode != null)
			{
				if(checkAuthCode(authCode, null) == false)
				{
					System.out.println("saveDoc checkAuthCode Failed");
					writer.write("授权码校验失败");
					return;
				}
				reposAccess = authCodeMap.get(authCode).getReposAccess();
			}
			else
			{
				reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);
			}
			if(reposAccess == null)
			{
				System.out.println("saveDoc reposAccess is null");
				writer.write("reposAccess is null");			
				return;
			}
		
			
			Repos repos = reposService.getRepos(reposId);
			if(repos == null)
			{
				docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
				writer.write("仓库 " + reposId + " 不存在！");				
				return;
			}
			
			String localRootPath = getReposRealPath(repos);
			String localVRootPath = getReposVirtualPath(repos);
			Doc doc = buildBasicDoc(reposId, null, null, filePath, "", null, 1, true, localRootPath, localVRootPath, null, null);

			//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
			String localParentPath = localRootPath + doc.getPath();
			File localParentDir = new File(localParentPath);
			if(false == localParentDir.exists())
			{
				localParentDir.mkdirs();
			}
			
			//Check user permission
			Doc localDoc = docSysGetDoc(repos, doc);
			if(localDoc == null || localDoc.getType() == 0)	//0: add  1: update
			{
				Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, doc.getPath(), "", null, 2, true, localRootPath, localVRootPath, null, null);
				if(checkUserAddRight(repos,reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
				{
					docSysErrorLog("用户没有新增权限", rt);
					writer.write("用户没有新增权限");	
					return;
				}
			}
			else
			{
				if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
				{
					docSysErrorLog("用户没有修改权限", rt);
					writer.write("用户没有修改权限");		
					return;
				}
			}
			
			//Check and getDownloadDoc
            String body = "";
            try
            {
                Scanner scanner = new Scanner(request.getInputStream());
                scanner.useDelimiter("\\A");
                body = scanner.hasNext() ? scanner.next() : "";
                scanner.close();
            }
            catch (Exception ex)
            {
                writer.write("get request.getInputStream error:" + ex.getMessage());
                return;
            }
            
            if (body.isEmpty())
            {
                writer.write("empty request.getInputStream");
                return;
            }
	        
	        System.out.println("saveDoc body:" + body);
	        
	        JSONObject jsonObj = JSON.parseObject(body);
	        
            int status = (Integer) jsonObj.get("status");
	        if(status == 2 || status == 3)
	        {
	            String downloadUri = (String) jsonObj.get("url");
	            
	            String chunkParentPath = getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
	            String chunkName = doc.getName() + "_0";
	            if(downloadFileFromUrl(downloadUri, chunkParentPath, chunkName) == null)
	            {
					docSysErrorLog("下载文件失败 downloadUri="+downloadUri, rt);
					//writer.write("下载文件失败 downloadUri="+downloadUri);	
					writer.write("{\"error\":1}");
					return;
	            }
	            
	            Long chunkSize = new File(chunkParentPath + chunkName).length();
	            System.out.println("saveDoc() chunkSize:" + chunkSize);
	            doc.setSize(chunkSize); //设置docSize避免addDoc和updateDoc的检查报错

				String commitMsg = "保存 " + filePath;
				String commitUser = reposAccess.getAccessUser().getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				if(localDoc == null || localDoc.getType() == 0)
				{
					boolean ret = addDoc(repos, doc, 
							null,
							1, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
					
					if(ret == true)
					{
						writer.write("{\"error\":0}");
						executeCommonActionList(actionList, rt);
						deleteChunks(doc.getName(),1, 1,chunkParentPath);
					}					
				}
				else
				{
					boolean ret = updateDoc(repos, doc, 
							null,  
							1, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);					
				
					if(ret == true)
					{
						writer.write("{\"error\":0}");
						executeCommonActionList(actionList, rt);
						deleteChunks(doc.getName(),1, 1,chunkParentPath);
						deletePreviewFile(doc);
					}
				}
				return;
	           
	        }
	        
	        System.out.println("这是打开文件的调用，返回error:0表示可以编辑");
	        writer.write("{\"error\":0}");
	        
		} catch (Exception e) {
			System.out.println("saveDoc saveFile Failed");
			writer.write("{\"error\":-1}");
			e.printStackTrace();		
		}
    }
	
	/****************   this interface is for onlyoffice edit callback ******************/
	@RequestMapping("/saveDoc/{reposId}/{filePath}/{authCode}")
	protected void saveDoc(@PathVariable("reposId") Integer reposId, @PathVariable("filePath") String filePath,
			@PathVariable("authCode") String authCode,
			HttpServletRequest request, HttpServletResponse response,HttpSession session) {

		System.out.println("saveDoc reposId:" + reposId + " path:" + filePath +" authCode:" + authCode);

		PrintWriter writer = null;
		try {
			writer = response.getWriter();
			ReturnAjax rt = new ReturnAjax();
			
			//Decode Path and Name
			if(filePath == null)
			{
				docSysErrorLog("文件路径未设置！", rt);
				writer.write("文件路径未设置");
				return;
			}
			
			filePath = new String(filePath.getBytes("ISO8859-1"),"UTF-8");	
			filePath = base64Decode(filePath);
			if(filePath == null)
			{
				docSysErrorLog("文件路径解码失败！", rt);
				writer.write("文件路径解码失败");			
				return;
			}	
		

			//Check authCode or reposAccess
			ReposAccess reposAccess = null;
			if(authCode != null && !authCode.equals("0"))
			{
				if(checkAuthCode(authCode, null) == false)
				{
					System.out.println("saveDoc checkAuthCode Failed");
					writer.write("授权码校验失败");
					return;
				}
				reposAccess = authCodeMap.get(authCode).getReposAccess();
			}
			else
			{
				reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
			}
			if(reposAccess == null)
			{
				System.out.println("saveDoc reposAccess is null");
				writer.write("reposAccess is null");			
				return;
			}
		
			
			Repos repos = reposService.getRepos(reposId);
			if(repos == null)
			{
				docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
				writer.write("仓库 " + reposId + " 不存在！");				
				return;
			}
			
			String localRootPath = getReposRealPath(repos);
			String localVRootPath = getReposVirtualPath(repos);
			Doc doc = buildBasicDoc(reposId, null, null, filePath, "", null, 1, true, localRootPath, localVRootPath, null, null);

			//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
			String localParentPath = localRootPath + doc.getPath();
			File localParentDir = new File(localParentPath);
			if(false == localParentDir.exists())
			{
				localParentDir.mkdirs();
			}
			
			
			//Check user permission
			Doc localDoc = docSysGetDoc(repos, doc);
			if(localDoc == null || localDoc.getType() == 0)	//0: add  1: update
			{
				Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, doc.getPath(), "", null, 2, true, localRootPath, localVRootPath, null, null);
				if(checkUserAddRight(repos,reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt) == false)
				{
					docSysErrorLog("用户没有新增权限", rt);
					writer.write("用户没有新增权限");	
					return;
				}
			}
			else
			{
				if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
				{
					docSysErrorLog("用户没有修改权限", rt);
					writer.write("用户没有修改权限");		
					return;
				}
			}
			
			//Check and getDownloadDoc

            String body = "";
            try
            {
                Scanner scanner = new Scanner(request.getInputStream());
                scanner.useDelimiter("\\A");
                body = scanner.hasNext() ? scanner.next() : "";
                scanner.close();
            }
            catch (Exception ex)
            {
                writer.write("get request.getInputStream error:" + ex.getMessage());
                return;
            }
            
            if (body.isEmpty())
            {
                writer.write("empty request.getInputStream");
                return;
            }
	        
	        System.out.println("saveDoc body:" + body);
	        
	        JSONObject jsonObj = JSON.parseObject(body);
	        
            int status = (Integer) jsonObj.get("status");
	        if(status == 2 || status == 3)
	        {
	            String downloadUri = (String) jsonObj.get("url");
	            
	            String chunkParentPath = getReposTmpPathForUpload(repos,reposAccess.getAccessUser());
	            String chunkName = doc.getName() + "_0";
	            if(downloadFileFromUrl(downloadUri, chunkParentPath, chunkName) == null)
	            {
					docSysErrorLog("下载文件失败 downloadUri="+downloadUri, rt);
					//writer.write("下载文件失败 downloadUri="+downloadUri);	
					writer.write("{\"error\":1}");
					return;
	            }
	            
	            Long chunkSize = new File(chunkParentPath + chunkName).length();
	            System.out.println("saveDoc() chunkSize:" + chunkSize);
	            doc.setSize(chunkSize); //设置docSize避免addDoc和updateDoc的检查报错
	            
				String commitMsg = "保存 " + filePath;
				String commitUser = reposAccess.getAccessUser().getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				if(localDoc == null || localDoc.getType() == 0)
				{
					boolean ret = addDoc(repos, doc, 
							null,
							1, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);
					
					if(ret == true)
					{
						writer.write("{\"error\":0}");
						executeCommonActionList(actionList, rt);
						deleteChunks(doc.getName(),1, 1,chunkParentPath);
					}					
				}
				else
				{
					boolean ret = updateDoc(repos, doc, 
							null,  
							1, chunkSize, chunkParentPath,commitMsg, commitUser, reposAccess.getAccessUser(), rt, actionList);					
				
					if(ret == true)
					{
						writer.write("{\"error\":0}");
						executeCommonActionList(actionList, rt);
						deleteChunks(doc.getName(),1, 1,chunkParentPath);
						deletePreviewFile(doc);
					}
				}
				return;
	           
	        }
	        
	        System.out.println("这是打开文件的调用，返回error:0表示可以编辑");
	        writer.write("{\"error\":0}");
	        
		} catch (Exception e) {
			System.out.println("saveDoc saveFile Failed");
			writer.write("{\"error\":-1}");
			e.printStackTrace();		
		}
    }
	
	private String downloadFileFromUrl(String downloadUri, String localFilePath, String fileName) {
		URL url;
		try {
			url = new URL(downloadUri);
			
	        java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
	        InputStream stream = connection.getInputStream();
	
	        File savedFile = new File(localFilePath + fileName);
	        try (FileOutputStream out = new FileOutputStream(savedFile)) {
	            int read;
	            final byte[] bytes = new byte[1024];
	            while ((read = stream.read(bytes)) != -1) {
	                out.write(bytes, 0, read);
	            }
	
	            out.flush();
	        }
	        connection.disconnect();
	        return fileName;
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	/**************** get Tmp File ******************/
	@RequestMapping("/doGetTmpFile.do")
	public void doGetTmp(Integer reposId,String path, String fileName,
			Integer shareId,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("doGetTmpFile  reposId:" + reposId + " path:" + path + " fileName:" + fileName+ " shareId:" + shareId);

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
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//get userTmpDir
		String userTmpDir = getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		
		String localParentPath = userTmpDir;
		if(path != null)
		{
			localParentPath = userTmpDir + path;
		}
		
		sendFileToWebPage(localParentPath,fileName,rt, response, request); 
	}

	@RequestMapping("/getZipDocOfficeLink.do")
	public void getZipDocOfficeLink(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String rootPath, String rootName,
			String preview,
			Integer shareId,
			String urlStyle,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{	
		System.out.println("getZipDocOfficeLink reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);

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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc rootDoc = buildBasicDoc(reposId, docId, pid, rootPath, rootName, level, type, true, localRootPath, localVRootPath, null, null);

		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), rootDoc, null, rt) == false)
		{
			System.out.println("getZipDocOfficeLink() you have no access right on doc:" + rootDoc.getName());
			writeJson(rt, response);	
			return;
		}

		String tmpLocalRootPath = getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
		Doc tmpDoc = buildBasicDoc(reposId, null, null, path, name, null, 1, true, tmpLocalRootPath, null, null, null);
		
		checkAndExtractEntryFromCompressDoc(repos, rootDoc, tmpDoc);
		
		if((preview == null && isOfficeEditorApiConfiged(request)) || (preview != null && preview.equals("office")))
		{	
			JSONObject jobj = new JSONObject();
			String authCode = getAuthCodeForOfficeEditor(tmpDoc, reposAccess);
			String fileLink = buildDocFileLink(tmpDoc, authCode, urlStyle, rt);
			String saveFileLink = buildSaveDocLink(tmpDoc, authCode, urlStyle, rt);
			jobj.put("fileLink", fileLink);
			jobj.put("saveFileLink", saveFileLink);
			jobj.put("userId", reposAccess.getAccessUser().getId());
			jobj.put("userName", reposAccess.getAccessUser().getName());

			Doc localDoc = docSysGetDoc(repos, tmpDoc);
			tmpDoc.setSize(localDoc.getSize());
			tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
			
			jobj.put("key", buildOfficeEditorKey(tmpDoc));
			jobj.put("editEn", 0);
			jobj.put("downloadEn", 0);
			
			rt.setData(jobj);
			rt.setDataEx("office");
			writeJson(rt, response);
			return;
		}
		
		//转换成pdf进行预览
		String pdfLink = convertOfficeToPdf(repos, tmpDoc, rt);
		if(pdfLink == null)
		{
			System.out.println("getZipDocOfficeLink() convertOfficeToPdf failed");
			writeJson(rt, response);	
			return;
		}
		rt.setData(pdfLink);
		rt.setDataEx("pdf");
		writeJson(rt, response);
	}
	
	/**************** getDocOfficeLink ******************/
	@RequestMapping("/getDocOfficeLink.do")
	public void getDocOfficeLink(Integer reposId, String path, String name, String commitId,
			String preview,
			Integer shareId,
			String urlStyle,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{	
		System.out.println("getDocOfficeLink reposId:" + reposId + " path:" + path + " name:" + name  + " shareId:" + shareId + " commitId:" + commitId);


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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		doc.setShareId(shareId);
		
		path = doc.getPath();
		name = doc.getName();
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), doc,  reposAccess.getAuthMask(), rt) == false)
		{
			System.out.println("getDocOfficeLink() you have no access right on doc:" + doc.getName());
			writeJson(rt, response);	
			return;
		}
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//SVN和GIT前置类型仓库，需要先将文件CheckOut出来
			if(repos.getType() == 3 || repos.getType() == 4)
			{
				verReposCheckOut(repos, false, doc, doc.getLocalRootPath() + doc.getPath(), doc.getName(), null, true, true, null);		
			}
		}
		else
		{
			Doc remoteDoc = verReposGetDoc(repos, doc, commitId);
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
			String tempLocalRootPath = getReposTmpPathForHistory(repos, commitId, true);
			File dir = new File(tempLocalRootPath + path);
			if(dir.exists() == false)
			{
				dir.mkdirs();
			}
			File file = new File(tempLocalRootPath + path + name);
			if(file.exists() == false)
			{
				verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
			}
			
			tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);
			tmpDoc.setShareId(shareId);
		}
		
		if((preview == null && isOfficeEditorApiConfiged(request)) || (preview != null && preview.equals("office")))
		{	
			JSONObject jobj = new JSONObject();
			String authCode = getAuthCodeForOfficeEditor(tmpDoc, reposAccess);
			String fileLink = buildDocFileLink(tmpDoc, authCode, urlStyle, rt);
			String saveFileLink = buildSaveDocLink(tmpDoc, authCode, urlStyle, rt);
			jobj.put("fileLink", fileLink);
			jobj.put("saveFileLink", saveFileLink);
			jobj.put("userId", reposAccess.getAccessUser().getId());
			jobj.put("userName", reposAccess.getAccessUser().getName());

			if(commitId == null)
			{
				Doc localDoc = docSysGetDoc(repos, doc);
				tmpDoc.setSize(localDoc.getSize());
				tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
				
				//检查用户是否有文件编辑权限
				DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc,  reposAccess.getAuthMask());
				if(docUserAuth.getDownloadEn() != null || docUserAuth.getDownloadEn() == 1)
				{
					jobj.put("downloadEn", 1);
				}
				else
				{
					jobj.put("downloadEn", 0);				
				}
				
				if(docUserAuth.getEditEn() != null && docUserAuth.getEditEn() == 1)
				{
					jobj.put("key", buildOfficeEditorKey(tmpDoc));			
					jobj.put("editEn", 1);
				}
				else
				{
					jobj.put("key", buildOfficeEditorKey(tmpDoc) + "_" + reposAccess.getAccessUser().getId());
					jobj.put("editEn", 0);
				}
			}
			else
			{
				Doc localDoc = fsGetDoc(repos, tmpDoc);
				tmpDoc.setSize(localDoc.getSize());
				tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
				
				jobj.put("key", buildOfficeEditorKey(tmpDoc));
				jobj.put("editEn", 0);
				jobj.put("downloadEn", 0);
			}
			
			rt.setData(jobj);
			rt.setDataEx("office");
			writeJson(rt, response);
			return;
		}
		
		//转换成pdf进行预览
		String pdfLink = convertOfficeToPdf(repos, tmpDoc, rt);
		if(pdfLink == null)
		{
			System.out.println("getDocOfficeLink() convertOfficeToPdf failed");
			writeJson(rt, response);	
			return;
		}
		rt.setData(pdfLink);
		rt.setDataEx("pdf");
		writeJson(rt, response);
		return;	
	}

	private Object buildOfficeEditorKey(Doc doc) {
		return (doc.getLocalRootPath() + doc.getDocId() + "_" + doc.getSize() + "_" + doc.getLatestEditTime()).hashCode();
	}

	private String getAuthCodeForOfficeEditor(Doc doc, ReposAccess reposAccess) {
		//add authCode to authCodeMap
		AuthCode authCode = new AuthCode();
		String usage = "officeEditor";
		Long curTime = new Date().getTime();
		Long expTime = curTime + 1*24*60*60*1000;
		String officeEditAuthCode = usage.hashCode() + "" + doc.getDocId();	//用docId和usage作为authCode
		authCode.setUsage(usage);
		authCode.setCode(officeEditAuthCode);
		authCode.setExpTime(expTime);
		authCode.setRemainCount(1000);
		authCode.setReposAccess(reposAccess);
		authCodeMap.put(officeEditAuthCode, authCode);
		return officeEditAuthCode;
	}

	private boolean isOfficeEditorApiConfiged(HttpServletRequest request) {
		System.out.println("isOfficeEditorApiConfiged() officeEditorApi:" + officeEditorApi);
		String officeEditor = getOfficeEditor(request);
		if(officeEditor == null)
		{
			return false;
		}
		if(officeEditor.isEmpty())
		{
			return false;
		}
		return true;
	}

	private String convertOfficeToPdf(Repos repos, Doc doc, ReturnAjax rt) {
		return DocToPDF_FSM(repos, doc, rt);
	}

	private boolean convertToPdf(String localEntryPath, String dstPath, ReturnAjax rt) {
		String officeHome = getOpenOfficePath();
		if(officeHome == null)
		{
			docSysErrorLog("获取OpenOffice安装路径失败!", rt);
			return false;				
		}
		
		File officeDir = new File(officeHome);
		if(!officeDir.exists())
		{
			docSysErrorLog("未找到OpenOffice软件:" + officeHome + " 不存在！", rt);
			return false;								
		}
			
		if(Office2PDF.openOfficeToPDF(localEntryPath,dstPath,officeHome, rt) == false)
		{
			docSysErrorLog("文件转换失败: " + localEntryPath + " to " + dstPath, rt);
			return false;
		}

		return true;
	}

	public String DocToPDF_FSM(Repos repos, Doc doc, ReturnAjax rt)
	{
		String fileSuffix = getFileSuffix(doc.getName());
		if(fileSuffix == null)
		{
			docSysErrorLog("未知文件类型", rt);
			return null;
		}
			
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			docSysErrorLog("文件不存在！", rt);
			return null;
		}
		
		if(localEntry.getType() == 2)
		{
			docSysErrorLog("目录无法预览", rt);
			return null;
		}		

		if(isPdf(fileSuffix))
		{
			//直接返回预览地址
			String fileLink = buildDocFileLink(doc, null, "REST", rt);
			if(fileLink == null)
			{
				docSysErrorLog("buildDocFileLink failed", rt);
				return null;
			}
			return fileLink;
		}
		
		
		String preivewTmpPath = getReposTmpPathForPreview(repos, doc);
		String previewFileName = getPreviewFileName(doc);
		String dstPath = preivewTmpPath + previewFileName;
		System.out.println("DocToPDF_FSM() dstPath:" + dstPath);		
		File file = new File(dstPath);
		if(file.exists() == false)
		{
			clearDir(preivewTmpPath);
			//Do convert
			String localEntryPath = getReposRealPath(repos) + doc.getPath() + doc.getName();
			if(isOffice(fileSuffix) || isText(fileSuffix) || isPicture(fileSuffix))
			{
				if(convertToPdf(localEntryPath,dstPath,rt) == false)
				{
					docSysErrorLog("预览文件生成失败", rt);
					return null;
				}
			}
			else
			{
				docSysErrorLog("该文件类型不支持预览", rt);
				docSysDebugLog("srcPath:"+localEntryPath, rt);
				return null;
			}
		}
		
		Doc previewDoc = buildBasicDoc(repos.getId(), null, null, "", previewFileName, null, 1, true, preivewTmpPath, null, null, null);
		previewDoc.setShareId(doc.getShareId());
		String fileLink = buildDocFileLink(previewDoc, null, "REST", rt);
		if(fileLink == null)
		{
			docSysErrorLog("buildDocFileLink failed", rt);
			return null;
		}
		return fileLink;
	}

	private boolean isUpdateNeeded(Repos repos, Doc doc) {
		Doc localEntry = null;
		Doc indexDoc = null;
		switch(repos.getType())
		{
		case 1: //FSM
			localEntry = fsGetDoc(repos, doc);
			Doc dbDoc = dbGetDoc(repos, doc, false);
			if(false == isDocLocalChanged(repos, dbDoc,localEntry))	//本地未变化，则直接返回链接
			{
				return false;
			}
			return true;
		case 2:
			localEntry = fsGetDoc(repos, doc);
			indexDoc = indexGetDoc(repos, doc, INDEX_DOC_NAME, false);
			if(false == isDocLocalChanged(repos, indexDoc,localEntry))	//本地未变化，则直接返回链接
			{
				return false;
			}
			return true;
		case 3:
		case 4:
			Doc remoteEntry = verReposGetDoc(repos, doc, null);
			indexDoc = indexGetDoc(repos, doc, INDEX_DOC_NAME, false);
			if(false == isDocRemoteChanged(repos, indexDoc,remoteEntry))	//本地未变化，则直接返回链接
			{
				return false;
			}
			return true;
		}
		return false;
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
			System.out.println("getCheckSum() Exception"); 
			e.printStackTrace();
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
		System.out.println("getZipDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " shareId:" + shareId);

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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc rootDoc = buildBasicDoc(reposId, null, null, rootPath, rootName, null, 1, true, localRootPath, localVRootPath, null, null);
		
		String tmpLocalRootPath = getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
		Doc tmpDoc = buildBasicDoc(reposId, null, null, path, name, null, 1, true, tmpLocalRootPath, null, null, null);
		
		checkAndExtractEntryFromCompressDoc(repos, rootDoc, tmpDoc);
		
		//根据文件类型获取文件内容或者文件链接			
		String status = "ok";
		String content = "";
		String fileSuffix = getFileSuffix(name);
		if(isText(fileSuffix))
		{
			content = readRealDocContent(repos, tmpDoc);
		}
		else if(isOffice(fileSuffix) || isPdf(fileSuffix))
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
	
	private boolean dumpZipEntryToFile(ZipFile zipFile, ZipEntry entry, String filePath) {
		boolean ret = false;
		int bufSize = 4096;
		byte[] buf = new byte[bufSize];
		int readedBytes;
		
		File file = new File(filePath);
		
		FileOutputStream fileOutputStream = null;
		InputStream inputStream = null;
		try {
			fileOutputStream = new FileOutputStream(file);
			inputStream = zipFile.getInputStream(entry);
			
			while ((readedBytes = inputStream.read(buf)) > 0) {
				fileOutputStream.write(buf, 0, readedBytes);
			}
			ret = true;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if(fileOutputStream != null)
			{
				try {
					fileOutputStream.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
			if(inputStream != null)
			{
				try {
					inputStream.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		return ret;
	}

	/****************   get Document Content ******************/
	@RequestMapping("/getDocContent.do")
	public void getDocContent(Integer reposId, String path, String name, Integer docType, String commitId,
			Integer shareId,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){
		System.out.println("getDocContent reposId:" + reposId + " path:" + path + " name:" + name + " docType:" + docType+ " shareId:" + shareId + " commitId:" + commitId);

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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true, localRootPath, localVRootPath, null, null);
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
				//SVN/GIT前置类型仓库需要先将文件下载到本地
				if(repos.getType() == 3 || repos.getType() == 4)
				{
					verReposCheckOut(repos, false, doc, doc.getLocalRootPath() + doc.getPath(), doc.getName(), null, true, true, null);
				}
			}
			else	//获取历史版本文件
			{
				Doc remoteDoc = verReposGetDoc(repos, doc, commitId);
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
				String tempLocalRootPath = getReposTmpPathForHistory(repos, commitId, isRealDoc);
				File dir = new File(tempLocalRootPath + path);
				if(dir.exists() == false)
				{
					dir.mkdirs();
				}
				File file = new File(tempLocalRootPath + path + name);
				if(file.exists() == false)
				{
					verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
				}
				tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);					
			}
			
			String fileSuffix = getFileSuffix(name);
			if(isText(fileSuffix))
			{
				content = readRealDocContent(repos, tmpDoc);
			}
			else if(isOffice(fileSuffix) || isPdf(fileSuffix))
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
				String tempLocalRootPath = getReposTmpPathForHistory(repos, commitId, isRealDoc);
				File dir = new File(tempLocalRootPath + path);
				if(dir.exists() == false)
				{
					dir.mkdirs();
					verReposCheckOut(repos, true, doc, tempLocalRootPath + path, name, commitId, true, true, null);
				}

				Doc tmpDoc = buildBasicDoc(reposId, null, null, path, name, null, 1, true, tempLocalRootPath, localVRootPath, null, null);
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
	
	public String getDocContent(Repos repos, Doc doc, int offset, int size)
	{
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		boolean isRealDoc = true;
		doc.setIsRealDoc(isRealDoc);
		doc.setLocalRootPath(localRootPath);
		doc.setLocalVRootPath(localVRootPath);
		
		Doc tmpDoc = doc;
		//SVN/GIT前置类型仓库需要先将文件下载到本地
		if(repos.getType() == 3 || repos.getType() == 4)
		{
			verReposCheckOut(repos, false, doc, doc.getLocalRootPath() + doc.getPath(), doc.getName(), null, true, true, null);
		}		
	
		String content = "";
		String fileSuffix = getFileSuffix(doc.getName());
		if(isText(fileSuffix))
		{
			content = readRealDocContent(repos, tmpDoc, offset, size);
		}
		else if(isOffice(fileSuffix) || isPdf(fileSuffix))
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
		System.out.println("getDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType+ " shareId:" + shareId);

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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		String content = "";
		if(docType == null)
		{
			docType = 1;
		}
		if(docType == 1)
		{
			String fileSuffix = getFileSuffix(name);
			if(isText(fileSuffix))
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
		System.out.println("deleteTmpSavedDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type+ " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
				
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
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
		
		String userTmpDir = getReposTmpPathForOfficeText(repos, doc);
		String officeTextFileName = getOfficeTextFileName(doc);
		File file = new File(userTmpDir, officeTextFileName);
		if(file.exists() == true)
		{
			return true;
		}
		
		//文件需要转换
		clearDir(userTmpDir);
		switch(fileSuffix)
		{
		case "doc":
			return extractToFileForWord(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "docx":
			return extractToFileForWord2007(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "ppt":
			return extractToFileForPPT(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "pptx":
			return extractToFileForPPT2007(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "xls":
			return extractToFileForExcel(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "xlsx":
			return extractToFileForExcel2007(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		case "pdf":
			return extractToFileForPdf(doc.getLocalRootPath() + doc.getPath() + doc.getName(), userTmpDir, officeTextFileName);
		}
		return false;
	}

	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " docType:" + docType + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			System.out.println("getDoc() you have no access right on doc:" + docId);
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
				docSysErrorLog("访问密码错误！", rt);
				rt.setMsgData("1"); //访问密码错误或未提供
				rt.setData(doc);
				writeJson(rt, response);
				return;
			}
		}
		
		Doc dbDoc = docSysGetDoc(repos, doc);
		if(dbDoc == null || dbDoc.getType() == 0)
		{
			docSysErrorLog("文件 " + path+name + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		doc.setType(dbDoc.getType());
			
		//图片、视频、音频文件需要返回文件的访问信息，如果是文本文件或Office文件需要根据前端需求返回docText
		if(doc.getType() == 1)
		{
			String fileSuffix = getFileSuffix(name);
			//if(isPicture(fileSuffix) || isVideo(fileSuffix))
			//{
			Doc downloadDoc = buildDownloadDocInfo(doc.getLocalRootPath() + doc.getPath(), doc.getName());
			rt.setDataEx(downloadDoc);
			//}
			
			if(docType == 1 || docType == 3)	//docType { 1: get docText only, 2: get content only 3: get docText and content } 
			{
				String docText = null;
				String tmpDocText = null;
				if(isText(fileSuffix))
				{
					docText = readRealDocContent(repos, doc);
					tmpDocText= readTmpRealDocContent(repos, doc, reposAccess.getAccessUser());
				}
				else if(isOffice(fileSuffix) || isPdf(fileSuffix))
				{
					if(checkAndGenerateOfficeContent(repos, doc, fileSuffix))
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
	
	@RequestMapping("/getZipDocFileLink.do")
	public void getZipDocFileLink(Integer reposId, String path, String name,
			String rootPath, String rootName,
			Integer shareId,
			String urlStyle,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getZipDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc rootDoc = buildBasicDoc(reposId, null, null, rootPath, rootName, null, null, true, localRootPath, localVRootPath, null, null);
		
		//build tmpDoc
		String tmpLocalRootPath = getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
		File dir = new File(tmpLocalRootPath + path);
		if(dir.exists() == false)
		{
			dir.mkdirs();
		}
		Doc tmpDoc = buildBasicDoc(reposId, null, null, path, name, null, 1, true, tmpLocalRootPath, null, null, null);
		
		checkAndExtractEntryFromCompressDoc(repos, rootDoc, tmpDoc);
		
		String fileLink = buildDocFileLink(tmpDoc, null, urlStyle, rt);
		if(fileLink == null)
		{
			System.out.println("getZipDocFileLink() buildDocFileLink failed");
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
		System.out.println("getDocFileLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId);

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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true, localRootPath, localVRootPath, null, null);
		doc.setShareId(shareId);
		path = doc.getPath();
		name = doc.getName();
		
		Doc tmpDoc = doc;
		if(commitId == null)
		{
			//SVN和GIT前置类型仓库，需要先将文件CheckOut出来
			if(repos.getType() == 3 || repos.getType() == 4)
			{
				verReposCheckOut(repos, false, doc, doc.getLocalRootPath() + doc.getPath(), doc.getName(), null, true, true, null);
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
			Doc remoteDoc = verReposGetDoc(repos, doc, commitId);
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
			String tempLocalRootPath = getReposTmpPathForHistory(repos, commitId, true);
			File dir = new File(tempLocalRootPath + path);
			if(dir.exists() == false)
			{
				dir.mkdirs();
			}
			File file = new File(tempLocalRootPath + path + name);
			if(file.exists() == false)
			{
				verReposCheckOut(repos, false, doc, tempLocalRootPath + doc.getPath(), doc.getName(), commitId, true, true, null);
			}
			
			tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), path, name, doc.getLevel(), 1, true, tempLocalRootPath, localVRootPath, null, null);	
		}
		
		String fileLink = buildDocFileLink(tmpDoc, null, urlStyle, rt);
		if(fileLink == null)
		{
			System.out.println("getDocFileLink() buildDocFileLink failed");
			return;
		}
		
		rt.setData(fileLink);
		writeJson(rt, response);
	}
	
	private String buildDocFileLink(Doc doc, String authCode, String urlStyle, ReturnAjax rt) {
		String encTargetName = base64EncodeURLSafe(doc.getName());
		if(encTargetName == null)
		{
			docSysErrorLog("buildDocFileLink() get encTargetName Failed", rt);
			return null;
		}	
		String encTargetPath = base64EncodeURLSafe(doc.getLocalRootPath() + doc.getPath());
		if(encTargetPath == null)
		{
			docSysErrorLog("buildDocFileLink() get encTargetPath Failed", rt);
			return null;
		}	
		
		String fileLink = null;
		if(urlStyle != null && urlStyle.equals("REST"))
		{
			if(authCode == null)
			{
				authCode = "0";
			}
			Integer shareId = doc.getShareId();
			if(shareId == null)
			{
				shareId = 0;
			}
			fileLink = "/DocSystem/Doc/downloadDoc/" + encTargetPath +  "/" + encTargetName +"/" + authCode + "/" + shareId;
		}
		else
		{
			fileLink = "/DocSystem/Doc/downloadDoc.do?targetPath=" + encTargetPath + "&targetName="+encTargetName;	
			if(authCode != null)
			{
				fileLink += "&authCode=" + authCode;
			}
			if(doc.getShareId() != null)
			{
				fileLink += "&shareId=" + doc.getShareId();				
			}
		}
		return fileLink;
	}
	
	private String buildSaveDocLink(Doc doc, String authCode, String urlStyle, ReturnAjax rt) {
		String encFilePath = base64EncodeURLSafe(doc.getPath() + doc.getName());
		if(encFilePath == null)
		{
			docSysErrorLog("buildSaveDocLink() get encFilePath Failed", rt);
			return null;
		}	
		
		String fileLink = null;
		if(urlStyle != null && urlStyle.equals("REST"))
		{
			if(authCode == null)
			{
				authCode = "0";
			}
			fileLink = "/DocSystem/Doc/saveDoc/"+ doc.getVid() + "/" + encFilePath + "/" + authCode;;
		}
		else
		{
			fileLink = "/DocSystem/Doc/saveDoc.do?reposId=" + doc.getVid() + "&filePath=" + encFilePath;		
			if(authCode != null)
			{
				fileLink += "&authCode=" + authCode;
			}
		}
		return fileLink;
	}

	/****************   lock a Doc ******************/
	@RequestMapping("/lockDoc.do")  //lock Doc主要用于用户锁定doc
	public void lockDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, Integer docType,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("lockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType + " docType:" + docType + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		if(docId == null)
		{
			docSysErrorLog("docId is null", rt);
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
	
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, null, null);
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		synchronized(syncLock)
		{
			boolean subDocCheckFlag = false;
			if(lockType == 2)	//If want to force lock, must check all subDocs not locked
			{
				subDocCheckFlag = true;
			}
				
			//Try to lock the Doc
			DocLock docLock = lockDoc(doc,lockType,86400000,reposAccess.getAccessUser(),rt,subDocCheckFlag); //24 Hours 24*60*60*1000 = 86400,000
			if(docLock == null)
			{
				unlock(); //线程锁
				System.out.println("lockDoc() Failed to lock Doc: " + doc.getName());
				writeJson(rt, response);
				return;			
			}
			unlock(); //线程锁
		}
		
		System.out.println("lockDoc : " + doc.getName() + " success");
		rt.setData(doc);
		writeJson(rt, response);	
	}
	
	/****************   get Document History (logList) ******************/
	@RequestMapping("/getDocHistory.do")
	public void getDocHistory(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer historyType,Integer maxLogNum, 
			Integer shareId,
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType+ " shareId:" + shareId);
		
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
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
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
		
		
		List<LogEntry> logList = verReposGetHistory(repos, false, inputDoc, num);
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
		System.out.println("getHistoryDetail reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId+ " shareId:" + shareId);
		
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
		
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc inputDoc = doc;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			inputDoc = buildVDoc(doc);
		}

		List<ChangedItem> changedItemList = verReposGetHistoryDetail(repos, false, inputDoc, commitId);
		
		if(changedItemList == null)
		{
			System.out.println("getHistoryDetail 该版本没有文件改动");
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
		System.out.println("downloadHistoryDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId: " + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);

		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//get reposInfo to 
		Repos repos = reposService.getRepos(reposId);
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
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

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
		String userTmpDir = getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		
		if(isRealDoc)
		{
			if(entryPath == null)
			{
				doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			}
			else
			{
				doc = buildBasicDoc(reposId, null, null, entryPath, "", null, null, isRealDoc, localRootPath, localVRootPath, null, null);
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
					docSysErrorLog("当前版本文件 " + doc.getPath() + doc.getName() + " 未改动",rt);
					writeJson(rt, response);	
					return;
				}
			}
			
			if(isRealDoc)
			{
				successDocList = verReposCheckOut(repos, false, doc, userTmpDir, targetName, commitId, true, true, downloadList) ;
				if(successDocList == null)
				{
					docSysErrorLog("当前版本文件 " + doc.getPath() + doc.getName() + " 不存在",rt);
					docSysDebugLog("verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
					writeJson(rt, response);	
					return;
				}
			}
		}
		else
		{
			doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localVRootPath, localVRootPath, null, null);
			
			if(entryPath == null)
			{
				vDoc = docConvert(doc, true);
			}
			else
			{
				vDoc = buildBasicDoc(reposId, docId, pid, entryPath, "", null, null, isRealDoc, localVRootPath, localVRootPath, null, null);
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
		}
		
		printObject("downloadHistoryDocPrepare checkOut successDocList:", successDocList);
		
		File localEntry = new File(userTmpDir,targetName);
		if(false == localEntry.exists())
		{
			docSysErrorLog("文件 " + userTmpDir + targetName + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}

		//For dir 
		if(localEntry.isDirectory()) //目录
		{
			//doCompressDir and save the zip File under userTmpDir
			String zipFileName = targetName + ".zip";
			if(doCompressDir(userTmpDir, targetName, userTmpDir, zipFileName, rt) == false)
			{
				docSysErrorLog("压缩目录 " + userTmpDir + targetName + " 失败！", rt);
				writeJson(rt, response);
				return;
			}			
			
			//删除CheckOut出来的目录
			delFileOrDir(userTmpDir+targetName);
			
			targetName = zipFileName;
		}
		
		System.out.println("downloadHistoryDocPrepare targetPath:" + userTmpDir + " targetName:" + targetName);
		
		Doc downloadDoc = buildDownloadDocInfo(userTmpDir, targetName);		
		rt.setData(downloadDoc);
		rt.setMsgData(1);
		writeJson(rt, response);			
	}

	private void buildDownloadList(Repos repos, boolean isRealDoc, Doc doc, String commitId, HashMap<String, String> downloadList) 
	{
		//根据commitId获取ChangeItemsList
		List<ChangedItem> changedItemList = verReposGetHistoryDetail(repos, isRealDoc, doc, commitId);
		
		if(changedItemList == null)
		{
			System.out.println("buildDownloadList verReposGetHistoryDetail Failed");
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
				System.out.println("buildDownloadList Add [" +changeItemEntryPath + "]");
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
		System.out.println("revertDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath+ " shareId:" + shareId);

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
			docSysErrorLog("reposId is null", rt);
			writeJson(rt, response);
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		
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
				doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			}
			else
			{
				//Remove the /
				char startChar = entryPath.charAt(0);
				if(startChar == '/')
				{
					entryPath = entryPath.substring(1);
				}
				doc = buildBasicDoc(reposId, null, null, entryPath, "", null, null, isRealDoc, localRootPath, localVRootPath, null, null);
			}
		}
		else
		{
			//For vDoc the doc is for lock and unlock
			doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			if(entryPath == null)
			{
				vDoc = docConvert(doc, true);
			}
			else
			{
				vDoc = buildBasicDoc(reposId, docId, pid, entryPath, "", null, null, isRealDoc, localVRootPath, localVRootPath, null, null);
			}
		}
						
		//lockDoc
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, 2,  2*60*60*1000, reposAccess.getAccessUser(), rt, false);
			if(docLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("revertDocHistory() lockDoc " + doc.getName() + " Failed!", rt);
				writeJson(rt, response);
				return;
			}
		}

		if(isRealDoc)
		{
			if(repos.getType() == 3 || repos.getType() == 4)
			{
				//前置类型仓库不需要判断本地是否有改动
				System.out.println("revertDocHistory reposId:" + reposId + " SVN或GIT前置仓库不需要检查本地是否有改动");
			}
			else
			{
				Doc localEntry = fsGetDoc(repos, doc);
				if(localEntry == null)
				{
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取本地文件信息失败!",rt);
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;				
				}
	
				Doc remoteEntry = verReposGetDoc(repos, doc, null);		
				if(remoteEntry == null)
				{
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 获取远程文件信息失败!",rt);
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;				
				}
				
				Doc dbDoc = dbGetDoc(repos, doc, false);
				
				HashMap<Long, DocChange> localChanges = new HashMap<Long, DocChange>();
				HashMap<Long, DocChange> remoteChanges = new HashMap<Long, DocChange>();
				if(syncupScanForDoc_FSM(repos, doc, dbDoc, localEntry,remoteEntry, reposAccess.getAccessUser(), rt, remoteChanges, localChanges, 2) == false)
				{
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 同步状态获取失败!",rt);
					System.out.println("revertDocHistory() syncupScanForDoc_FSM!");	
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;
				}
				
				if(localChanges.size() > 0)
				{
					System.out.println("revertDocHistory() 本地有改动！");
					String localChangeInfo = buildChangeInfo(localChanges);
					
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 本地有改动!" + "</br></br>"+ localChangeInfo,rt);
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;
				}
				
				if(remoteChanges.size() > 0)
				{
					System.out.println("revertDocHistory() 远程有改动！");
					String remoteChangeInfo = buildChangeInfo(remoteChanges);				
					docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 远程有改动!" + "</br></br>"+ remoteChangeInfo,rt);
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;
				}
				
				if(localEntry.getType() != 0)
				{
					if(commitId.equals(remoteEntry.getRevision()))
					{
						System.out.println("revertDocHistory() commitId:" + commitId + " latestCommitId:" + remoteEntry.getRevision());
						docSysErrorLog("恢复失败:" + doc.getPath() + doc.getName() + " 已是最新版本!",rt);					
						unlockDoc(doc,reposAccess.getAccessUser(),docLock);
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
					System.out.println("revertDocHistory() commitId:" + commitId + " latestCommitId:" + latestCommitId);
					docSysErrorLog("恢复失败:" + vDoc.getPath() + vDoc.getName() + " 已是最新版本!",rt);					
					unlockDoc(doc,reposAccess.getAccessUser(),docLock);
					writeJson(rt, response);
					return;				
				}
			}
			revertDocHistory(repos, vDoc, commitId, commitMsg, commitUser, reposAccess.getAccessUser(), rt, null);
		}
		
		unlockDoc(doc,reposAccess.getAccessUser(),docLock);
		writeJson(rt, response);
	}
	
	/****************   set  Doc Access PWD ******************/
	@RequestMapping("/setDocPwd.do")
	public void setDocPwd(Integer reposId, String path, String name,
			String pwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("setDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

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
		writeJson(rt, response);
	}
	
	private boolean setDocPwd(Repos repos, Doc doc, String pwd) {
		
		String reposPwdPath = getReposPwdPath(repos);
		String pwdFileName = doc.getDocId() + ".pwd";
		if(pwd == null || pwd.isEmpty())
		{
			return delFile(reposPwdPath + pwdFileName);
		}
		return saveDocContentToFile(pwd, reposPwdPath, pwdFileName, null);
	}
	
	/****************   verify  Doc Access PWD ******************/
	@RequestMapping("/verifyDocPwd.do")
	public void verifyDocPwd(Integer reposId, String path, String name,
			String pwd,
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("verifyDocPwd reposId:" + reposId + " path:" + path + " name:" + name  + " pwd:" + pwd);
		
		ReturnAjax rt = new ReturnAjax();
		//密码验证的时候不检查是否进行了非法路径访问，因此path设置为null
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, null, name, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");

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
		
		String reposPwdPath = getReposPwdPath(repos);
		String pwdFileName = doc.getDocId() + ".pwd";
		if(isFileExist(reposPwdPath + pwdFileName) == false)
		{
			return true;
		}
		
		String docPwd = readDocContentFromFile(reposPwdPath, pwdFileName, false);
		
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
		System.out.println("addRemoteDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
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

		String proxyIP = getIpAddress();
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

	private String getRequestIpAddress(HttpServletRequest request) {
	    String ip = null;

	    //X-Forwarded-For：Squid 服务代理
	    String ipAddresses = request.getHeader("X-Forwarded-For");
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //Proxy-Client-IP：apache 服务代理
	        ipAddresses = request.getHeader("Proxy-Client-IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //WL-Proxy-Client-IP：weblogic 服务代理
	        ipAddresses = request.getHeader("WL-Proxy-Client-IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //HTTP_CLIENT_IP：有些代理服务器
	        ipAddresses = request.getHeader("HTTP_CLIENT_IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //X-Real-IP：nginx服务代理
	        ipAddresses = request.getHeader("X-Real-IP");
	    }

	    //有些网络通过多层代理，那么获取到的ip就会有多个，一般都是通过逗号（,）分割开来，并且第一个ip为客户端的真实IP
	    if (ipAddresses != null && ipAddresses.length() != 0) {
	        ip = ipAddresses.split(",")[0];
	    }

	    //还是不能获取到，最后再通过request.getRemoteAddr();获取
	    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        ip = request.getRemoteAddr();
	    }
	    
	    return ip.equals("0:0:0:0:0:0:0:1")?"127.0.0.1":ip;
	}
	
	/****************   add a DocShare ******************/
	@RequestMapping("/getDocShareList.do")
	public void getDocShareList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocShareList ");
		
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
			String IpAddress = getIpAddress();
			HashMap<Integer, Repos> ReposInfoHashMap = getReposInfoHashMap();
			for(int i=0; i< list.size(); i++)
			{
				DocShare docShare = list.get(i);
				docShare.setServerIp(IpAddress);
				Long validHours = getValidHours(docShare.getExpireTime());
				docShare.setValidHours(validHours);
				
				Repos repos = ReposInfoHashMap.get(docShare.getVid());
				//printObject("repos",repos);
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
			//printObject("repos",repos);
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
		System.out.println("addDocShare reposId:" + reposId + " path:" + path + " name:" + name  + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
		ReturnAjax rt = new ReturnAjax();
		ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, reposId, path, name, true, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc doc = buildBasicDoc(reposId, null, null, path, name, null, null, true,localRootPath,localVRootPath, 0L, "");
		
		DocShare docShare = new DocShare();
		docShare.setVid(doc.getVid());
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
		
		String IpAddress = getIpAddress();
		
		if(reposService.addDocShare(docShare) == 0)
		{
			docSysErrorLog("创建文件分享失败！", rt);
		}
		else
		{
			rt.setData(docShare);
			rt.setDataEx(IpAddress);
		}
		writeJson(rt, response);
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
		System.out.println("updateDocShare() shareId:" + shareId + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin  + " access:" + access  + " editEn:" + editEn  + " addEn:" + addEn  + " deleteEn:" + deleteEn +  " downloadEn:"+ downloadEn + " heritable:" + heritable);
		
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
	}
	
	/****************   delete a DocShare ******************/
	@RequestMapping("/deleteDocShare.do")
	public void deleteDocShare(Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteDocShare() shareId:" + shareId);
		
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
		
		DocShare docShare = new DocShare();
		docShare.setShareId(shareId);				
		if(reposService.deleteDocShare(docShare) == 0)
		{
			docSysErrorLog("删除文件分享失败！", rt);
		}
		writeJson(rt, response);
	}
	
	/****************   verifyDocSharePwd ******************/
	@RequestMapping("/verifyDocSharePwd.do")
	public void verifyDocSharePwd(Integer shareId, String sharePwd,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocShare shareId:" + shareId + " sharePwd:" + sharePwd);
		
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
		System.out.println("getDocShare shareId:" + shareId);
		
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
		System.out.println("searchDoc reposId:" + reposId + " pid:" + pid + " path:" + path + " searchWord:" + searchWord + " sort:" + sort+ " shareId:" + shareId + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		
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
			Repos repos = reposService.getRepos(reposId);
			if(repos != null)
			{
				reposList.add(repos);
			}
		}
		
		if(reposList == null)
		{
			System.out.println("searchDoc reposList is null");
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
				System.out.println("searchDoc() 共 ["+ result.size() +"]结果 hits with " + searchWord + " in reposId:" + queryRepos.getId() + " reposName:" + queryRepos.getName());
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
		seperatePathAndName(searchWord, temp);
		String pathSuffix = temp[0];
		searchWord = temp[1];	
		
		System.out.println("searchInRepos() reposId:" + repos.getId() + " reposName:" + repos.getName() + " pathSuffix:" + pathSuffix + " searchWord:" + searchWord);
		
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
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

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
		Doc doc = buildBasicDoc(repos.getId(), null, null, docPath, "", null, null, true,localRootPath,localVRootPath, 0L, "");
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
    		System.out.println("convertSearchResultToDocList() " + doc.getName() + " hitType:" + doc.getHitType());	

      	    String hitText = "";
      	    if((hitType & SEARCH_MASK[1]) > 0) //hit on 文件内容
      	    {
      	    	hitText = getDocContent(repos, doc, 0, 120);
      	    	hitText = base64Encode(hitText);
      	    	//System.out.println("convertSearchResultToDocList() " + doc.getName() + " hitText:" + hitText);	
      	    }
      	    else if((hitType & SEARCH_MASK[2]) > 0) //hit on 文件备注
      	    {
      	    	hitText = readVirtualDocContent(repos, doc, 0, 120);
      	    	hitText = base64Encode(hitText);
     	    	//hitText = removeSpecialJsonChars(hitText);
      	    	//System.out.println("convertSearchResultToDocList() " + doc.getName() + " hitText:" + hitText);	
      	    }
  	    	doc.setContent(hitText);
		}
		
		return docList;
	}
    
	private String removeSpecialJsonChars(String str) {
		if(str != null && !str.isEmpty())
		{
			//str = removeAllBlank(str);
			//str = trim(str);
		    //str = str.replace("[", "");
		    //str = str.replace("]", "");
		    //str = str.replace("{", "");
		    //str = str.replace("}", "");
		   //str = str.replace(">", "");
		    //str = str.replace("<", "");
		    //str = str.replace(" ", "");
		    //str = str.replace("\"", ""); //双引号
		    //str = str.replace("\'", ""); //单引号
		    //str = str.replace("\\", "/");//对斜线的转义
		    //str = str.replace("\n", ""); //回车
		    str = str.replace("\r", ""); //换行
		    str = str.replace("\t", ""); //水平制表符
			/* \n 回车(\u000a)
			// \t 水平制表符(\u0009)
			// \s 空格(\u0008)
			// \r 换行(\u000d)	 */   
		}
		return str;
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
			System.out.println("databaseSearch() searchStr:" + searchStr);
			
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
		            AddHitDocToSearchResult(searchResult, hitDoc, searchStr, 3, SEARCH_MASK[0]); //文件名
		        	printObject("databaseSearch() hitDoc:", hitDoc);
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
			//System.out.println("luceneSearch() 文件名通配符搜索（带空格）:" + searchWord);
			LuceneUtil2.search(repos, preConditions, "name", searchWord, path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Wildcard, 100, SEARCH_MASK[0]); 	//Search By DocName
			//System.out.println("luceneSearch() 文件名通配符搜索（带空格）:" + searchWord + " count:" + searchResult.size());
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
					//System.out.println("luceneSearch() 文件名通配符搜索（不带空格）:" + searchStr);
					LuceneUtil2.search(repos, preConditions, "name", searchStr, path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Wildcard, 1, SEARCH_MASK[0]);	//Search By FileName
					//System.out.println("luceneSearch() 文件名通配符搜索（不带空格）:" + searchStr + " count:" + searchResult.size());

					//文件名智能搜索（切词搜索）
					//System.out.println("luceneSearch() 文件名智能搜索:" + searchStr);
					LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_DOC_NAME), searchResult, QueryCondition.SEARCH_TYPE_Term, 1, SEARCH_MASK[0]);	//Search By FileName
					//System.out.println("luceneSearch() 文件名智能搜索:" + searchStr + " count:" + searchResult.size());
				}
				if((searchMask & SEARCH_MASK[1]) > 0)
				{
					//0x00000002; //文件内容搜索
					//System.out.println("luceneSearch() 文件内容智能搜索:" + searchStr);
					LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_R_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[1]);	//Search By FileContent
					//System.out.println("luceneSearch() 文件内容智能搜索:" + searchStr + " count:" + searchResult.size());
				}
				if((searchMask & SEARCH_MASK[2]) > 0)
				{	
					//0x00000004; //文件备注搜索
					//System.out.println("luceneSearch() 文件备注智能搜索:" + searchStr);
					LuceneUtil2.smartSearch(repos, preConditions, "content", searchStr, path, getIndexLibPath(repos,INDEX_V_DOC), searchResult, QueryCondition.SEARCH_TYPE_Term, 0, SEARCH_MASK[2]);	//Search By VDoc
					//System.out.println("luceneSearch() 文件备注智能搜索:" + searchStr + " count:" + searchResult.size());
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
		System.out.println("getZipInitMenu reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();

		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		//printObject("getReposInitMenu() repos:", repos);
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
				
		List <Doc> docList = new ArrayList<Doc>();
		
		Doc rootDoc = buildBasicDoc(reposId, null, null, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		docList.add(rootDoc);
		
		List <Doc> subDocList = null;
		subDocList = getZipSubDocList(repos, rootDoc, docPath, docName, rt);
		if(subDocList != null)
		{
			docList.addAll(subDocList);
		}	
		rt.setData(docList);	
		writeJson(rt, response);
	}

	private List<Doc> getZipSubDocList(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) 
	{
		if(name != null && !name.equals(rootDoc.getName()))
		{
			System.out.println("getZipSubDocList() 目前不支持对压缩文件的子目录的文件列表");
			return null;
		}
		
		String compressFileType = getCompressFileType(rootDoc.getName());
		if(compressFileType == null)
		{
			System.out.println("getZipSubDocList() " + rootDoc.getName() + " 不是压缩文件！");
			return null;
		}
		
		switch(compressFileType)
		{
		case "zip":
		case "war":
			return getSubDocListForZip(repos, rootDoc, path, name, rt);
		case "rar":
			return getSubDocListForRar(repos, rootDoc, path, name, rt);			
		case "7z":
			return getSubDocListFor7z(repos, rootDoc, path, name, rt);			
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
	

	private List<Doc> getSubDocListForRar(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForRar() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForRar() zipFilePath:" + zipFilePath);
		
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
            e.printStackTrace();
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForBz2(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForBz2() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForBz2() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForXz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForXz() path:" + path + " name:" + name);
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForXz() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForGz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForGz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForGz() zipFilePath:" + zipFilePath);
		
		List <Doc> subDocList = new ArrayList<Doc>();
		
		String subDocName = name.substring(0,name.lastIndexOf("."));
		Doc subDoc = buildBasicDoc(rootDoc.getVid(), null, null, path + name + "/", subDocName, null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
		if(isCompressFile(subDoc.getName()))
		{
			subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
		}
		subDocList.add(subDoc);
		return subDocList;
	}

	private List<Doc> getSubDocListForTarBz2(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForTarBz2() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForTarBz2() zipFilePath:" + zipFilePath);
		
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
				System.out.println("subDoc: " + subDocPath);
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
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForTxz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForTxz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForTxz() zipFilePath:" + zipFilePath);
		
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
				System.out.println("subDoc: " + subDocPath);
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
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListForTgz(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForTgz() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForTgz() zipFilePath:" + zipFilePath);
		
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
                //System.out.println("subEntry:" + entryPath);
                
                if(entryPath.indexOf("./") == 0)
                {
                	if(entryPath.length() == 2)
                	{
                		continue;
                	}
                	entryPath = entryPath.substring(2);
                }
				String subDocPath = rootPath + entryPath;
				//System.out.println("subDoc: " + subDocPath);
				
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				
				//printObject("subDoc:", subDoc);
				subDocList.add(subDoc);
            }
        } catch (IOException e) {
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return subDocList;
	}

	private List<Doc> getSubDocListFor7z(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListFor7z() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListFor7z() zipFilePath:" + zipFilePath);
		
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
				System.out.println("subDoc: " + subDocPath);
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
            e.printStackTrace();
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return subDocList;
	}
	
	
	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, ZipEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
		}
		else 
		{
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			if(isCompressFile(subDoc.getName()))
			{
				subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
			}
		}
		return subDoc;
	}
	

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, FileHeader entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getFullUnpackSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getFullUnpackSize(), null);
				if(isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}
	

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, TarEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
				if(isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}

	private Doc buildBasicDocFromZipEntry(Doc rootDoc, String docPath, SevenZArchiveEntry entry) {
		Doc subDoc = null;
		if (entry.isDirectory()) {
			subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
			} else {
				subDoc = buildBasicDoc(rootDoc.getVid(), null, null, docPath,"", null, 1, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), entry.getSize(), null);
				if(isCompressFile(subDoc.getName()))
				{
					subDoc.setType(2); //压缩文件展示为目录，以便前端触发获取zip文件获取子目录
				}
			}
		return subDoc;
	}

	private List<Doc> getSubDocListForTar(Repos repos, Doc rootDoc, String path, String name, ReturnAjax rt) {
		System.out.println("getSubDocListForTar() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForRar() zipFilePath:" + zipFilePath);
		
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
				System.out.println("subDoc: " + subDocPath);
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocHashMap.put(subDoc.getDocId(), subDoc);
				
				//printObject("subDoc:", subDoc);
				subDocList.add(subDoc);
            }
            
            //注意由于entryList只包含文件，因此直接生成docList会导致父节点丢失，造成前端目录树混乱，因此需要检查并添加父节点
            List<Doc> parentDocListForAdd = checkAndGetParentDocListForAdd(subDocList, rootDoc, subDocHashMap);
            if(parentDocListForAdd.size() > 0)
            {
            	subDocList.addAll(parentDocListForAdd);
            }
        } catch (IOException e) {
           e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return subDocList;
	}

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
			System.out.println("sortDocListWithDocId docId:" + doc.getDocId() + " pid:" + doc.getPid() + " " + doc.getPath() + doc.getName());
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
		Doc parentDoc = buildBasicDoc(rootDoc.getVid(), null, null, subDoc.getPath(),"", null, 2, true, rootDoc.getLocalRootPath(), rootDoc.getLocalVRootPath(), null, null);
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
		System.out.println("getSubDocListForZip() path:" + rootDoc.getPath() + " name:" + rootDoc.getName());
		String zipFilePath = rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName();
		System.out.println("getSubDocListForZip() zipFilePath:" + zipFilePath);

        String rootPath = rootDoc.getPath() + rootDoc.getName() + "/";
        ZipFile zipFile = null;
        List <Doc> subDocList = new ArrayList<Doc>();
		try {
			zipFile = new ZipFile(new File(zipFilePath), "UTF-8");
			
			for (Enumeration<ZipEntry> entries = zipFile.getEntries(); entries.hasMoreElements();) {
				ZipEntry entry = entries.nextElement();
				String subDocPath = rootPath + entry.getName();
				//System.out.println("subDoc: " + subDocPath);
				Doc subDoc = buildBasicDocFromZipEntry(rootDoc, subDocPath, entry);
				subDocList.add(subDoc);
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if(zipFile != null)
			{
				try {
					zipFile.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		
		return subDocList;
	}

	/****************   get Zip SubDocList ******************/
	@RequestMapping("/getZipSubDocList.do")
	public void getZipSubDocList(Integer reposId, String docPath, String docName, //zip File Info
			String path, String name,	//relative path in zipFile
			Integer shareId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		System.out.println("getZipSubDocList reposId: " + reposId + " docPath: " + docPath  + " docName:" + docName + " path:" + path + " name:"+ name + " shareId:" + shareId);
		
		ReturnAjax rt = new ReturnAjax();
		
		ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, docPath, docName, false, rt);
		if(reposAccess == null)
		{
			writeJson(rt, response);			
			return;	
		}
		
		//Get Repos
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		Doc rootDoc = buildBasicDoc(reposId, null, null, docPath, docName, null, 2, true, localRootPath, localVRootPath, null, null);
		
		List <Doc> subDocList = null;
		if(isCompressFile(name) == false)
		{
			String relativePath = getZipRelativePath(path, rootDoc.getPath() + rootDoc.getName() + "/");
			System.out.println("getZipSubDocList relativePath: " + relativePath);
			subDocList = getZipSubDocList(repos, rootDoc, path, name, rt);
		}
		else
		{
			//Build ZipDoc Info
			Doc zipDoc = buildBasicDoc(reposId, null, null, path, name, null, 1, true, null, null, null, null);
			if(zipDoc.getDocId().equals(rootDoc.getDocId()))
			{
				zipDoc = rootDoc;
			}
			else
			{
				//检查zipDoc是否已存在并解压（如果是rootDoc不需要解压，否则需要解压）
				String tmpLocalRootPath = getReposTmpPathForDoc(repos, zipDoc);	
				zipDoc.setLocalRootPath(tmpLocalRootPath);
				checkAndExtractEntryFromCompressDoc(repos, rootDoc, zipDoc);
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

	//注意：该接口需要返回真正的parentZipDoc
	private Doc checkAndExtractEntryFromCompressDoc(Repos repos, Doc rootDoc, Doc doc) 
	{
		System.out.println("checkAndExtractEntryFromCompressDoc() rootDoc:" + rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName());
		System.out.println("checkAndExtractEntryFromCompressDoc() doc:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
		Doc parentCompressDoc = getParentCompressDoc(repos, rootDoc, doc);
		if(parentCompressDoc.getDocId().equals(rootDoc.getDocId()))
		{	
			//如果doc的parentCompressDoc是rootDoc，那么直接从rootDoc解压出doc
			System.out.println("checkAndExtractEntryFromCompressDoc() parentCompressDoc:" + parentCompressDoc.getPath() + parentCompressDoc.getName() + " is rootDoc");
			parentCompressDoc = rootDoc;
		}
		else
		{
			//如果doc的parentCompressDoc不存在，那么有两种可能：没有被解压出来，或者是目录（但尾缀是压缩文件尾缀）
			File parentFile = new File(parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
			if(parentFile.exists() == false)
			{
				//此时无法区分该parentCompressDoc是否是目录，只能将其解压出来，然后让extractEntryFromCompressFile来找到真正的parentCompressDoc
				checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);				
			}
			else if(parentFile.isDirectory())
			{
				//表明parentCompressDoc是目录，因此需要继续向上找到真正的parentCompressDoc
				parentCompressDoc = checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);
			}
		}
		
		//解压zipDoc (parentCompressDoc必须已存在，无论是目录还是文件，如果是目录的话则继续向上查找，但此时肯定都存在)
		extractEntryFromCompressFile(repos, rootDoc, parentCompressDoc, doc);
		return parentCompressDoc;
	}

	private boolean extractEntryFromCompressFile(Repos repos, Doc rootDoc, Doc parentCompressDoc, Doc doc) 
	{
		parentCompressDoc = checkAndGetRealParentCompressDoc(repos, rootDoc, parentCompressDoc);
		if(parentCompressDoc == null)
		{
			System.out.println("extractEntryFromCompressFile() " + parentCompressDoc + " is null");
			return false;
		}
		
		String compressFileType = getCompressFileType(parentCompressDoc.getName());
		if(compressFileType == null)
		{
			System.out.println("extractEntryFromCompressFile() " + rootDoc.getName() + " 不是压缩文件！");
			return false;
		}
		
		switch(compressFileType)
		{
		case "zip":
		case "war":
			return extractEntryFromZipFile(repos, rootDoc, parentCompressDoc, doc);
		case "rar":
			return extractEntryFromRarFile(repos, rootDoc, parentCompressDoc, doc);			
		case "7z":
			return extractEntryFrom7zFile(repos, rootDoc, parentCompressDoc, doc);			
		case "tar":
			return extractEntryFromTarFile(repos, rootDoc, parentCompressDoc, doc);
		case "tgz":
		case "tar.gz":
			return extractEntryFromTgzFile(repos, rootDoc, parentCompressDoc, doc);		
		case "txz":
		case "tar.xz":
			return extractEntryFromTxzFile(repos, rootDoc, parentCompressDoc, doc);			
		case "tbz2":
		case "tar.bz2":
			return extractEntryFromTarBz2File(repos, rootDoc, parentCompressDoc, doc);					
		case "gz":
			return extractEntryFromGzFile(repos, rootDoc, parentCompressDoc, doc);						
		case "xz":
			return extractEntryFromXzFile(repos, rootDoc, parentCompressDoc, doc);
		case "bz2":
			return extractEntryFromBz2File(repos, rootDoc, parentCompressDoc, doc);
		}
		return false;
	}

	private Doc checkAndGetRealParentCompressDoc(Repos repos, Doc rootDoc, Doc parentCompressDoc) {
		File parentFile = new File(parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
		if(parentFile.exists() == false)
		{
			System.out.println("extractEntryFromCompressFile() parentCompressDoc 不存在！");
			printObject("extractEntryFromCompressFile() parentCompressDoc:",parentCompressDoc);
			return null;
		}
		
		if(parentFile.isDirectory())
		{
			System.out.println("extractEntryFromCompressFile() parentCompressDoc 是目录，向上层查找realParentCompressDoc！");
			Doc parentParentCompressDoc = getParentCompressDoc(repos, rootDoc, parentCompressDoc);
			return checkAndGetRealParentCompressDoc(repos, rootDoc, parentParentCompressDoc);
		}
		return parentCompressDoc;
	}

	private boolean extractEntryFromBz2File(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;

        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
            
            fos = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = bis.read(data)) != -1) {
                fos.write(data, 0, count);
            }
            fos.flush();
            ret = true;
        } catch (IOException e) {
            e.printStackTrace();
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
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFromXzFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream  fileInputStream = null;
        XZInputStream gzipIn = null;
        OutputStream out = null;

        try {
            fileInputStream = new FileInputStream(file);
            
            gzipIn = new XZInputStream(fileInputStream, 100 * 1024);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
			
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
            ret = true;
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFromGzFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream  fileInputStream = null;
        GZIPInputStream gzipIn = null;
        OutputStream out = null;
        
        try {
            fileInputStream = new FileInputStream(file);
            gzipIn = new GZIPInputStream(fileInputStream);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
			
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
            ret = true;
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return ret;
	}

	private boolean extractEntryFromTarBz2File(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
        
        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;
        TarInputStream tis = null;
        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);
            tis = new TarInputStream(bis, 1024 * 2);

            TarEntry entry;
            while((entry = tis.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	System.out.println("subEntry:" + entry.getName());
	            	
	                if(entry.isDirectory())
	                {
	            		createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	                else
	                {
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    fos = new FileOutputStream(tempFile);
	                    int count;
	                    byte data[] = new byte[2048];
	                    while ((count = tis.read(data)) != -1) {
	                        fos.write(data, 0, count);
	                    }
	                    fos.flush();
	                }
	                ret = true;
	                break;
            	}
            }
        } catch (IOException e) {
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFromTxzFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
        
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
            while((entry = tarIn.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	System.out.println("subEntry:" + entry.getName());
	                
	            	if(entry.isDirectory())
	            	{
	            		createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	            	}
	            	else
	            	{ 
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    out = new FileOutputStream(tempFile);
	                    int len =0;
	                    byte[] b = new byte[2048];
	
	                    while ((len = tarIn.read(b)) != -1){
	                        out.write(b, 0, len);
	                    }
	                    out.flush();
	                }
	            	ret = true;
	            	break;
            	}
            }
        } catch (IOException e) {
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
        return ret;
	}

	private boolean extractEntryFromTgzFile(Repos repos, Doc rootDoc, Doc parentCompressDoc, Doc doc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTgzFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTgzFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(doc.getPath(), parentCompressDoc.getPath() + parentCompressDoc.getName() + "/");
        String expEntryPath = "./" + relativePath + doc.getName();
    	System.out.println("extractEntryFromTgzFile expEntryPath:" + expEntryPath);
        
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
            while((entry = tarIn.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	//System.out.println("extractEntryFromTgzFile subEntry:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath) || subEntryPath.equals(expEntryPath.substring(2)))
            	{	  
            		System.out.println("extractEntryFromTgzFile subEntry:" + subEntryPath);
            		System.out.println("extractEntryFromTgzFile subEntry:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
	            	if(entry.isDirectory())
	            	{
	            		createDir(doc.getLocalRootPath() + doc.getPath() + doc.getName()); // 创建子目录
	            	}
	            	else
	            	{ 
	            		File tempFile = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    out = new FileOutputStream(tempFile);
	                    int len =0;
	                    byte[] b = new byte[2048];
	
	                    while ((len = tarIn.read(b)) != -1){
	                        out.write(b, 0, len);
	                    }
	                    out.flush();
	                }
	            	ret = true;
	            	break;
            	}
            }
        } catch (IOException e) {
            e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFromTarFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
		
        FileInputStream fis = null;
        OutputStream fos = null;
        TarInputStream tarInputStream = null;
        try {
            fis = new FileInputStream(file);
            tarInputStream = new TarInputStream(fis, 1024 * 2);
             
            TarEntry entry = null;
            while(true){
                entry = tarInputStream.getNextEntry();
                if( entry == null){
                    break;
                }
                
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
            		System.out.println("subEntry:" + entry.getName());
	                
	                if(entry.isDirectory())
	            	{
	            		createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	                else
	                {
	                	File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    fos = new FileOutputStream(tempFile);
	                    int count;
	                    byte data[] = new byte[2048];
	                    while ((count = tarInputStream.read(data)) != -1) {
	                        fos.write(data, 0, count);
	                    }
	                    fos.flush();
	                }
                    ret = true;
                    break;

            	}
            }
        } catch (IOException e) {
           e.printStackTrace();
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
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFrom7zFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFrom7zFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFrom7zFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
		
        SevenZFile sevenZFile = null;
        OutputStream outputStream = null;
        try {
            sevenZFile = new SevenZFile(file);
            SevenZArchiveEntry entry;
            while((entry = sevenZFile.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	System.out.println("subEntry:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	if(entry.isDirectory())
	            	{
	            		createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	            	else
	            	{
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    outputStream = new FileOutputStream(tempFile);
	                    int len = 0;
	                    byte[] b = new byte[2048];
	                    while((len = sevenZFile.read(b)) != -1){
	                        outputStream.write(b, 0, len);
	                    }
	                    outputStream.flush();
	            	}
                    ret = true;
                    break;
            	}
            }
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
		return ret;
	}

	private boolean extractEntryFromRarFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromRarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromRarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = (relativePath + zipDoc.getName()).replace("/", "\\");
        
		Archive archive = null;
        OutputStream outputStream = null;
        try {
            archive = new Archive(new FileInputStream(file));
            
            FileHeader fileHeader;
            while( (fileHeader = archive.nextFileHeader()) != null){

            	String subEntryPath = fileHeader.getFileNameW();
            	if(subEntryPath.equals(expEntryPath))
            	{
                	System.out.println("subEntry:" + subEntryPath);
                	
                	if(fileHeader.isDirectory())
                	{
                		createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
                    }
                	else
                	{
                    	File tmpFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
    					File parent = tmpFile.getParentFile();
    					if (!parent.exists()) {
     						parent.mkdirs();
     					}
                    	
                    	outputStream = new FileOutputStream(tmpFile);
                        archive.extractFile(fileHeader, outputStream);
                	}
                    ret = true;
                    break;

            	}
            }
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return ret;
	}

	private boolean extractEntryFromZipFile(Repos repos, Doc rootDoc, Doc parentZipDoc, Doc zipDoc) {
		boolean ret = false;

		ZipFile parentZipFile = null;
		try {
			parentZipFile = new ZipFile(new File(parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName()), "UTF-8");
			
			String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
			ZipEntry entry = parentZipFile.getEntry(relativePath + zipDoc.getName());
			if(entry == null)
			{
				System.out.println("extractZipFile() " + relativePath + zipDoc.getName() + " not exists in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
				return false;
			}
			
			//注意即使是目录也要生成目录，因为该目录将是用来区分名字压缩尾缀的目录和真正的压缩文件
			if(entry.isDirectory())
			{
				System.out.println("extractZipFile() " + relativePath + zipDoc.getName() + " is Directory in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
				File dir = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
				return dir.mkdirs();
			}
			
			File zipDocParentDir = new File(zipDoc.getLocalRootPath() + zipDoc.getPath());
			if(zipDocParentDir.exists() == false)
			{
				zipDocParentDir.mkdirs();
			}
			
			ret = dumpZipEntryToFile(parentZipFile, entry, zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if(parentZipFile != null)
			{
				try {
					parentZipFile.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}		
		return ret;
	}

	//获取doc的parentZipDoc(这里有风险parentZipDoc里面的目录的名字带压缩后缀)
	private Doc getParentCompressDoc(Repos repos, Doc rootDoc, Doc doc) {
		
		Doc parentDoc = buildBasicDoc(repos.getId(), null, doc.getPid(), doc.getPath(), "", null, 1, true, null, null, 0L, "");
		if(parentDoc.getDocId().equals(rootDoc.getDocId()))
		{
			return rootDoc;
		}
		
		String tmpLocalRootPath = getReposTmpPathForDoc(repos, parentDoc);	
		parentDoc.setLocalRootPath(tmpLocalRootPath);
		
		if(isCompressFile(parentDoc.getName()) == false)
		{
			return getParentCompressDoc(repos, rootDoc, parentDoc);
		}
		
		return parentDoc;			
	}

	private String getZipRelativePath(String path, String rootPath) {
		if(rootPath.equals(""))
		{
			return path;
		}
		
		if(path.indexOf(rootPath) != 0)
		{
			return null; //非法path
		}
		
		return path.substring(rootPath.length());
	}
	
}
	