package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import util.ReadProperties;
import util.ReturnAjax;
import util.DocConvertUtil.Office2PDF;
import util.LuceneUtil.LuceneUtil2;

import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.common.CommonAction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.controller.BaseController;
import com.alibaba.fastjson.JSONObject;
import com.ibm.misc.BASE64Decoder;

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
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("addDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " content:" + content);
		//System.out.println(Charset.defaultCharset());
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
				
		if(checkUserAddRight(repos, login_user.getId(), doc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc != null)
		{
			docSysErrorLog(doc.getName() + " 已存在", rt);
			rt.setMsgData(1);
			rt.setData(dbDoc);
			writeJson(rt, response);
			return;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "新增 " + path + name;
		}
		String commitUser = login_user.getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, doc, null, null,null,null, commitMsg,commitUser,login_user,rt, actionList); 
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

		if(reposId == null)
		{
			reposId = getReposIdForFeeback();		
		}
		if(pid == null)
		{
			pid = 0L;
		}
		if(path == null)
		{
			path = "";
		}
		if(level == null)
		{
			level = 1;
		}
		if(type == null)
		{
			type = 1;
		}
		
		ReturnAjax rt = new ReturnAjax();

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);		
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, 0L, "");
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
		
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");		

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

	/****************   delete a Document ******************/
	@RequestMapping("/deleteDoc.do")
	public void deleteDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitMsg,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		if(checkUserDeleteRight(repos, login_user.getId(), doc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		if(commitMsg == null)
		{
			commitMsg = "删除 " + doc.getPath() + doc.getName();
		}
		String commitUser = login_user.getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		String ret = deleteDoc(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		
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
							HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("renameDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type +  " dstName:" + dstName);

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
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		if(checkUserDeleteRight(repos, login_user.getId(), parentDoc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		if(checkUserAddRight(repos, login_user.getId(), parentDoc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(commitMsg == null)
		{
			commitMsg = "重命名 " + path + name + " 为 " + dstName;
		}
		String commitUser = login_user.getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		Doc srcDoc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, pid, path, dstName, level, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = dbGetDoc(repos, srcDoc, true);
		if(srcDbDoc == null)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		boolean ret = renameDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
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
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("moveDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel);

		if(srcPath == null)
		{
			srcPath = "";
		}
		if(dstPath == null)
		{
			dstPath = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		if(checkUserDeleteRight(repos, login_user.getId(), srcParentDoc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc dstParentDoc = buildBasicDoc(reposId, dstPid, null, dstPath, "", null, 2, true, localRootPath, localVRootPath, null, null);
		if(checkUserAddRight(repos, login_user.getId(), dstParentDoc, rt) == false)
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
		String commitUser = login_user.getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, srcPath, srcName, srcLevel, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, dstPath, dstName, dstLevel, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = dbGetDoc(repos, srcDoc, true);
		if(srcDbDoc == null)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = moveDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
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
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("copyDoc reposId:" + reposId + " docId: " + docId + " srcPid:" + srcPid + " srcPath:" + srcPath + " srcName:" + srcName  + " srcLevel:" + srcLevel + " type:" + type + " dstPath:" + dstPath+ " dstName:" + dstName + " dstLevel:" + dstLevel);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		if(checkUserAddRight(repos, login_user.getId(), dstParentDoc, rt) == false)
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
		String commitUser = login_user.getName();
		Doc srcDoc = buildBasicDoc(reposId, docId, srcPid, srcPath, srcName, srcLevel, type, true, localRootPath, localVRootPath, null, null);
		Doc dstDoc = buildBasicDoc(reposId, null, dstPid, dstPath, dstName, dstLevel, type, true, localRootPath, localVRootPath, null, null);
		
		Doc srcDbDoc = dbGetDoc(repos, srcDoc, true);
		if(srcDbDoc == null)
		{
			docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}
		srcDoc.setRevision(srcDbDoc.getRevision());
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	
	/****************   Check a Document ******************/
	@RequestMapping("/checkDocInfo.do")
	public void checkDocInfo(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, Long size,String checkSum, 
			String commitMsg,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("checkDocInfo  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum);
		
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		//检查登录用户的权限
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);

		Doc parentDoc = buildBasicDoc(reposId, pid, null, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
		DocAuth UserDocAuth = getUserDocAuth(repos, login_user.getId(), parentDoc);
		if(UserDocAuth == null)
		{
			docSysErrorLog("您无权在该目录上传文件!", rt);
			writeJson(rt, response);
			return;
		}
		else 
		{			
			//Get File Size 
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
			
			//任意用户文件不得30M
			if((UserDocAuth.getGroupId() == null) && ((UserDocAuth.getUserId() == null) || (UserDocAuth.getUserId() == 0)))
			{
				if(size > 30*1024*1024)
				{
					docSysErrorLog("非仓库授权用户最大上传文件不超过30M!", rt);
					writeJson(rt, response);
					return;
				}
			}
		}
				
		if(checkSum.isEmpty())
		{
			//CheckSum is empty, mean no need to check any more 
			writeJson(rt, response);
			return;
		}
		
		//检查文件是否已存在 
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, localVRootPath, size, checkSum);

		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc != null)
		{
			rt.setData(dbDoc);
			rt.setMsgData("0");
			docSysDebugLog("checkDocInfo() " + name + " 已存在", rt);
	
			//检查checkSum是否相同
			if(type == 1)
			{
				if(true == isDocCheckSumMatched(dbDoc,size,checkSum))
				{
					rt.setMsgData("1");
					docSysDebugLog("checkDocInfo() " + name + " 已存在，且checkSum相同！", rt);
				}
			}
			writeJson(rt, response);
			return;
		}
		else
		{
			if(size > 50*1024*1024)	//Only For 50M File to balance the Upload and SameDocSearch 
			{
				//Try to find the same Doc in the repos
				Doc sameDoc = getSameDoc(size,checkSum,reposId);
				if(null != sameDoc)
				{
					System.out.println("checkDocInfo() " + sameDoc.getName() + " has same checkSum " + checkSum + " try to copy from it");
					
					if(commitMsg == null)
					{
						commitMsg = "上传 " + path + name;
					}
					String commitUser = login_user.getName();
					List<CommonAction> actionList = new ArrayList<CommonAction>();
					boolean ret = copyDoc(repos, sameDoc, doc, commitMsg, commitUser, login_user,rt,actionList);
					if(ret == true)
					{
						dbDoc = dbGetDoc(repos, doc, true);
						rt.setData(dbDoc);
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
			}
		}
		
		writeJson(rt, response);
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
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Integer chunkSize,String chunkHash, 
			String commitMsg,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{		
		System.out.println("checkChunkUploaded  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
				+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash);
			
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		
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
		String userTmpDir = getReposUserTmpPath(repos,login_user);
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
				String commitUser = login_user.getName();
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
				
				Doc dbDoc = dbGetDoc(repos, doc, true);
				
				if(dbDoc == null)
				{
					boolean ret = addDoc(repos, doc,
								null,
								chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);
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
							chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);				
				
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
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Integer chunkSize, String chunkHash,
			String commitMsg,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("uploadDoc  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " size:" + size + " checkSum:" + checkSum
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash);
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc == null)	//0: add  1: update
		{
			Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, path, "", null, 2, true, localRootPath, localVRootPath, null, null);
			if(checkUserAddRight(repos,login_user.getId(), parentDoc, rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(checkUserEditRight(repos, login_user.getId(), doc, rt) == false)
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
			String userTmpDir = getReposUserTmpPath(repos,login_user);
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
			String commitUser = login_user.getName();
			String chunkParentPath = getReposUserTmpPath(repos,login_user);
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			if(dbDoc == null)
			{
				boolean ret = addDoc(repos, doc, 
						uploadFile,
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);
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
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);					
			
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
	public void uploadMarkdownPic(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, 
			HttpServletRequest request,HttpServletResponse response,HttpSession session) throws Exception{
		System.out.println("uploadMarkdownPic ");
		
		JSONObject res = new JSONObject();

		//Get the currentDocId from Session which was set in getDocContent
		Doc curDoc = new Doc();
		Long docId = (Long) session.getAttribute("currentDocId");
		if(docId == null || docId == 0)
		{
			res.put("success", 0);
			res.put("message", "upload failed: currentDoc was not set!");
			writeJson(res,response);
			return;
		}
		curDoc.setVid((Integer) session.getAttribute("currentReposId"));
		curDoc.setDocId(docId);
		curDoc.setPath((String)session.getAttribute("currentParentPath"));
		curDoc.setName((String)session.getAttribute("currentDocName"));
				
		if(file == null) 
		{
			res.put("success", 0);
			res.put("message", "upload failed: file is null!");
			writeJson(res,response);
			return;
		}
		
		//Save the file
		String fileName =  file.getOriginalFilename();
		
		//get localParentPath for Markdown Img
		//String localParentPath = getWebTmpPath() + "markdownImg/";
		Repos repos = reposService.getRepos(curDoc.getVid());
		if(repos == null)
		{
			res.put("success", 0);
			res.put("message", "仓库 " + curDoc.getVid() + " 不存在！");
			writeJson(res,response);
			return;
		}
		
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getVDocName(curDoc);
		String localVDocPath = reposVPath + docVName;
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
		
		//res.put("url", "/DocSystem/tmp/markdownImg/"+fileName);
		res.put("url", "/DocSystem/Doc/getVDocRes.do?docId="+docId+"&fileName="+fileName);
		res.put("success", 1);
		res.put("message", "upload success!");
		writeJson(res,response);
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			String content,
			String commitMsg,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);
		System.out.println("updateDocContent content:[" + content + "]");
		//System.out.println("content size: " + content.length());
			
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc == null)
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
		if(checkUserEditRight(repos, login_user.getId(), doc, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		doc.setContent(content);
		
		if(commitMsg == null)
		{
			commitMsg = "更新 " + path + name + " 备注";
		}
		String commitUser = login_user.getName();
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = updateDocContent(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			deleteTmpVirtualDocContent(repos, doc, login_user);
			
			executeCommonActionList(actionList, rt);
		}
	}

	private void deleteTmpVirtualDocContent(Repos repos, Doc doc, User login_user) {
		
		String docVName = getVDocName(doc);
		
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		String vDocPath = userTmpDir + docVName + "/";
		
		delFileOrDir(vDocPath);
	}

	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String content,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("tmpSaveVirtualDocContent  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);
		System.out.println("tmpSaveVirtualDocContent content:[" + content + "]");
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		Doc doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, true,localRootPath, userTmpDir, null, null);
		doc.setContent(content);
		
		if(saveVirtualDocContent(repos, doc, rt) == false)
		{
			docSysErrorLog("saveVirtualDocContent Error!", rt);
		}
		writeJson(rt, response);
	}
	
	/**************** downloadDocPrepare ******************/
	@RequestMapping("/downloadDocPrepare.do")
	public void downloadDocCheck(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			Integer docType,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);
		
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		Doc vDoc = null;
		if(docType != null && docType == 2)
		{
			vDoc = buildVDoc(doc);
			//TODO: download VDOC
		}
		
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			downloadDocPrepare_FS(repos, doc, login_user, rt);
			break;
		}
		writeJson(rt, response);
	}

	public void downloadDocPrepare_FS(Repos repos, Doc doc, User login_user, ReturnAjax rt) throws Exception
	{	
		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc == null)
		{
			System.out.println("downloadDocPrepare_FS() Doc " +doc.getPath() + doc.getName() + " 不存在");
			docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
			return;
		}
		
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			System.out.println("downloadDocPrepare_FS() locaDoc " +doc.getPath() + doc.getName() + " 获取异常");
			docSysErrorLog("本地文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
			return;
		}
		
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

		targetPath = getReposUserTmpPath(repos,login_user);
		if(localEntry.getType() == 2)
		{	
			if(isEmptyDir(doc.getLocalRootPath() + doc.getPath() + doc.getName()))
			{
				docSysErrorLog("空目录无法下载！", rt);
				return;				
			}
			
			//doCompressDir and save the zip File under userTmpDir
			targetName = doc.getName() + ".zip";		
			if(doCompressDir(doc.getLocalRootPath() + doc.getPath(), dbDoc.getName(), targetPath, targetName, rt) == false)
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
				docSysDebugLog("downloadDocPrepare_FS() remoteDoc " +doc.getPath() + doc.getName() + " 获取异常", rt);
				docSysErrorLog("远程文件 " + doc.getPath() + doc.getName() + "获取异常！", rt);
				return;
			}
				
			if(remoteEntry.getType() == 0)
			{
				System.out.println("downloadDocPrepare_FS() Doc " +doc.getPath() + doc.getName() + " 不存在");
				docSysErrorLog("文件 " + doc.getPath() + doc.getName() + "不存在！", rt);
				return;	
			}
				
			//Do checkout to local
			if(verReposCheckOut(repos, doc, targetPath, doc.getName(), null, true, true, null) == null)
			{
				docSysErrorLog("远程下载失败", rt);
				docSysDebugLog("downloadDocPrepare_FS() verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " targetPath:" + targetPath + " targetName:" + doc.getName(), rt);
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

			if(isEmptyDir(targetPath + doc.getName()))
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
	
	Doc buildDownloadDocInfo(String targetPath, String targetName)
	{
		String encTargetName = base64Encode(targetName);
		if(encTargetName == null)
		{
			return null;			
		}	
		String encTargetPath = base64Encode(targetPath);
		if(encTargetPath == null)
		{
			return null;			
		}	
		
		Doc doc = new Doc();
		doc.setPath(encTargetPath);
		doc.setName(encTargetName);
		return doc;
	}
	
	/**************** download Doc ******************/
	@RequestMapping("/downloadDoc.do")
	public void downloadDoc(String targetPath, String targetName, 
			Integer deleteFlag, //是否删除已下载文件  0:不删除 1:删除
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDoc  targetPath:" + targetPath + " targetName:" + targetName);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
	
		System.out.println("downloadHistoryDoc  targetPath:" + targetPath + " targetName:" + targetName);
		
		sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false);
		
		if(deleteFlag != null && deleteFlag == 1)
		{
			delFileOrDir(targetPath+targetName);
		}
	}
	
	private String base64Encode(String str) 
	{
		try {
			byte[] textByte = str.getBytes("UTF-8");
			//编码
			String base64Str = Base64.encodeBase64URLSafeString(textByte);
			return base64Str;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}		
	}
	
	private String base64Decode(String base64Str) 
	{
		//misc库
		//BASE64Decoder decoder = new BASE64Decoder();
		//return new String(decoder.decodeBuffer(base64Str),"UTF-8");
		
		//apache库
		byte [] data = Base64.decodeBase64(base64Str);
		try {
			String str =  new String(data,"UTF-8");
			return str;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			System.out.println("base64Decode new String Error");
			e.printStackTrace();
			return null;
		}
		
		//java8自带库，据说速度最快
	}
	
	/**************** get Tmp File ******************/
	@RequestMapping("/doGetTmpFile.do")
	public void doGetTmp(Integer reposId,String path, String fileName,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("doGetTmpFile  reposId:" + reposId + " path:" + path + " fileName:" + fileName);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		String localParentPath = userTmpDir;
		if(path != null)
		{
			localParentPath = userTmpDir + path;
		}
		
		sendFileToWebPage(localParentPath,fileName,rt, response, request); 
	}

	/**************** convert Doc To PDF ******************/
	@RequestMapping("/DocToPDF.do")
	public void DocToPDF(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{	
		System.out.println("DocToPDF reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
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
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			DocToPDF_FS(repos, doc, response, request, session);
			break;
		}
	}

	public void DocToPDF_FS(Repos repos, Doc doc, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String fileSuffix = getFileSuffix(doc.getName());
		if(fileSuffix == null)
		{
			docSysErrorLog("未知文件类型", rt);
			writeJson(rt, response);
			return;
		}
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), doc, rt) == false)
		{
			System.out.println("DocToPDF() you have no access right on doc:" + doc.getName());
			writeJson(rt, response);	
			return;
		}
			
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			docSysErrorLog("文件不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(localEntry.getType() == 2)
		{
			docSysErrorLog("目录无法预览", rt);
			writeJson(rt, response);
			return;
		}
		

		String webTmpPath = getWebTmpPath();
		String dstName = repos.getId() + "_" + doc.getDocId() + ".pdf";
		String dstPath = webTmpPath + "preview/" + dstName;
		System.out.println("DocToPDF() dstPath:" + dstPath);

		String fileLink = "/DocSystem/tmp/preview/" + dstName;
		
		File file = new File(dstPath);
		//预览文件已存在
		if(file.exists())
		{
			Doc dbDoc = dbGetDoc(repos, doc, true);
			if(false == isDocLocalChanged(dbDoc,localEntry))	//本地未变化，则直接返回链接
			{
				rt.setData(fileLink);
				writeJson(rt, response);
				return;
			}			
		}
		else
		{
			File previewDir = new File(webTmpPath,"preview");
			if(!previewDir.exists())
			{
				previewDir.mkdirs();
			}
		}
		
		//Do convert
		String localEntryPath = getReposRealPath(repos) + doc.getPath() + doc.getName();
		switch(fileSuffix)
		{
		case "pdf":
			if(copyFile(localEntryPath, dstPath,true) == false)
			{
				docSysErrorLog("预览失败", rt);
				docSysDebugLog("Failed to copy " + localEntryPath + " to " + dstPath, rt);
				writeJson(rt, response);
				return;					
			}
			break;
		case "doc":
		case "docx":
		case "xls":
		case "xlsx":
		case "ppt":
		case "pptx":
		case "txt":
		case "log":	
		case "md":
		case "html":	
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "bmp":
		case "py":
			if(Office2PDF.openOfficeToPDF(localEntryPath,dstPath,rt) == false)
			{
				docSysDebugLog("Failed execute openOfficeToPDF " + localEntryPath + " to " + dstPath, rt);
				writeJson(rt, response);
				return;
			}
			break;
		default:
			docSysErrorLog("该文件类型不支持预览", rt);
			docSysDebugLog("srcPath:"+localEntryPath, rt);
			writeJson(rt, response);
			return;
		}
	
		rt.setData(fileLink);
		writeJson(rt, response);
	}

	private String getCheckSum(File localEntry, int chunkSize) 
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
	
	
	/****************   get Document Content ******************/
	@RequestMapping("/getDocContent.do")
	public void getDocContent(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			HttpServletRequest request,HttpServletResponse response,HttpSession session){
		System.out.println("getDocContent reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);

		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		
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
		
		String vDocName = getVDocName(doc);
		String reposVPath = getReposVirtualPath(repos);
		String content = readVirtualDocContent(reposVPath, vDocName);		
		rt.setData(content);
		//System.out.println(rt.getData());

		writeJson(rt, response);
	}
	
	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type);

		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		//Set currentDocId to session which will be used MarkDown ImgUpload
		session.setAttribute("currentReposId", reposId);
		session.setAttribute("currentDocId", docId);
		session.setAttribute("currentParentPath", path);
		session.setAttribute("currentDocName", name);
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), doc, rt) == false)
		{
			System.out.println("getDoc() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}

		Doc dbDoc = dbGetDoc(repos, doc, true);
		if(dbDoc == null)
		{
			docSysErrorLog("文件 " + path+name + " 不存在！", rt);
			writeJson(rt, response);			
			return;
		}

		String vDocName = getVDocName(doc);
		String reposVPath = getReposVirtualPath(repos);
		String content = readVirtualDocContent(reposVPath, vDocName);
        //if( null !=content)
        //{
        //	content = content.replaceAll("\t","");
        //}
		doc.setContent(JSONObject.toJSONString(content));
		rt.setData(doc);
		
		//Try to read tmpSavedContent
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		String tmpSavedContent = readVirtualDocContent(userTmpDir, vDocName);
		rt.setMsgData(tmpSavedContent);
		
		writeJson(rt, response);
	}
	
	/****************   lock a Doc ******************/
	@RequestMapping("/lockDoc.do")  //lock Doc主要用于用户锁定doc
	public void lockDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type, 
			Integer lockType, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("lockDoc reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " lockType:" + lockType);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		if(checkUserEditRight(repos, login_user.getId(), doc, rt) == false)
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
			DocLock docLock = lockDoc(doc,lockType,86400000,login_user,rt,subDocCheckFlag); //24 Hours 24*60*60*1000 = 86400,000
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
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		int num = 100;
		if(maxLogNum != null)
		{
			num = maxLogNum;
		}
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			isRealDoc = false;
		}
		
		String entryPath = path + name;
		if(isRealDoc == false)	//get VirtualDoc Path
		{
			if(name == null || name.isEmpty())
			{
				entryPath = "";	
			}
			else
			{
				entryPath = getVDocName(doc);
			}
		}
		
		List<LogEntry> logList = verReposGetHistory(repos, isRealDoc, entryPath, num);
		rt.setData(logList);
		writeJson(rt, response);
	}
	
	/****************   get Document History Detail ******************/
	@RequestMapping("/getHistoryDetail.do")
	public void getHistoryDetail(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getHistoryDetail reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			isRealDoc = false;
		}

		List<ChangedItem> changedItemList = verReposGetHistoryDetail(repos, isRealDoc, doc, commitId);
		
		if(changedItemList == null)
		{
			System.out.println("getHistoryDetail Failed");
		}
		rt.setData(changedItemList);
		
		writeJson(rt, response);
	}
	
	/**************** download History Doc  *****************/
	@RequestMapping("/downloadHistoryDocPrepare.do")
	public void downloadHistoryDoc(Integer reposId, Long docId, Long pid, String path, String name,  Integer level, Integer type,
			String commitId,
			Integer historyType, 
			String entryPath,
			Integer downloadAll,
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadHistoryDocPrepare  reposId:" + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId: " + commitId + " entryPath:" + entryPath);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		Doc doc = null;
		Doc vDoc = null;
		String targetName = name + "_" + commitId;
		HashMap<String, String> downloadList = null;
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;			
			doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localVRootPath, localVRootPath, null, null);
			
			if(entryPath == null)
			{
				vDoc = buildVDoc(doc);
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
		}
		else
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
		}
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = getReposUserTmpPath(repos,login_user);

		//checkout the entry to local
		if(isRealDoc)
		{
			if(verReposCheckOut(repos, doc, userTmpDir, targetName, commitId, true, true, downloadList) == null)
			{
				docSysErrorLog("当前版本文件 " + doc.getPath() + doc.getName() + " 不存在",rt);
				docSysDebugLog("verReposCheckOut Failed path:" + doc.getPath() + " name:" + doc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(verReposCheckOut(repos, vDoc, userTmpDir, targetName, commitId, true, true, downloadList) == null)
			{
				docSysErrorLog("当前版本文件 " + vDoc.getPath() + vDoc.getName() + " 不存在",rt);
				docSysDebugLog("verReposCheckOut Failed path:" + vDoc.getPath() + " name:" + vDoc.getName() + " userTmpDir:" + userTmpDir + " targetName:" + targetName, rt);
				writeJson(rt, response);	
				return;
			}			
		}
		
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
			HttpSession session, HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("revertDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name  + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath);

		//如果entryPath非空则表示实际要还原的entry要以entryPath为准 
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
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
		
		String commitUser = login_user.getName();
		
		boolean isRealDoc = true;
		Doc doc = null;
		Doc vDoc = null;
		HashMap<String, String> downloadList = null;
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;			
			doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localVRootPath, localVRootPath, null, null);
			
			if(entryPath == null)
			{
				vDoc = buildVDoc(doc);
			}
			else
			{
				vDoc = buildBasicDoc(reposId, docId, pid, entryPath, "", null, null, isRealDoc, localVRootPath, localVRootPath, null, null);
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
		}
		else
		{
			if(entryPath == null)
			{
				doc = buildBasicDoc(reposId, docId, pid, path, name, level, type, isRealDoc, localRootPath, localVRootPath, null, null);
			}
			else
			{
				doc = buildBasicDoc(reposId, null, null, entryPath, "", null, null, isRealDoc, localRootPath, localVRootPath, null, null);
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
		}
				
		//lockDoc
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, 2,  2*60*60*1000, login_user, rt, false);
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
			revertDocHistory(repos, doc, commitId, commitMsg, commitUser, login_user, rt, downloadList);
		}
		else
		{
			revertDocHistory(repos, vDoc, commitId, commitMsg, commitUser, login_user, rt, downloadList);			
		}	
		
		//lockDoc
		unlockDoc(doc,login_user,docLock);

		writeJson(rt, response);
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
			HttpServletResponse response,HttpSession session)
	{
		System.out.println("searchDoc reposId:" + reposId + " pid:" + pid + " path:" + path + " searchWord:" + searchWord + " sort:" + sort);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}

		List<Repos> reposList = new ArrayList<Repos>();
		if(reposId == null || reposId == -1)
		{
			//Do search all AccessableRepos
			reposList = getAccessableReposList(login_user.getId());
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
				searchResult.addAll(result);
			}
		}
		
		rt.setData(searchResult);
		writeJson(rt, response);
	}
	
	private List<Doc> searchInRepos(Repos repos, Integer pDocId, String path, String searchWord, String sort) 
	{	
		HashMap<String, HitDoc> searchResult = new HashMap<String, HitDoc>();
		
		if(searchWord!=null&&!"".equals(searchWord))
		{
			luceneSearch(repos, searchWord, path, searchResult , 6);	//Search RDoc and VDoc only
			databaseSearch(repos, pDocId, searchWord, path, searchResult);
		}
		
		List<Doc> result = convertSearchResultToDocList(repos, searchResult);
		return result;
	}

	private List<Doc> convertSearchResultToDocList(Repos repos, HashMap<String, HitDoc> searchResult) 
	{
		List<Doc> docList = new ArrayList<Doc>();
		
		for(HitDoc hitDoc: searchResult.values())
        {
      	    Doc doc = hitDoc.getDoc();
      	    docList.add(doc);
		}
	
		Collections.sort(docList);
		
		return docList;
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
		            AddHitDocToSearchResult(searchResult, hitDoc, searchStr, 3);
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
	private boolean luceneSearch(Repos repos, String searchWord, String path, HashMap<String, HitDoc> searchResult, int searchMask) 
	{
		String [] keyWords = searchWord.split(" ");		
        
		for(int i=0; i< keyWords.length; i++)
		{
			String searchStr = keyWords[i];
			if(!searchStr.isEmpty())
			{
				if((searchMask & SEARCH_MASK[0]) > 0)
				{
					//采用通配符搜索
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibPath(repos,0), searchResult, 5, 3); 	//Search By DocName
				}
				if((searchMask & SEARCH_MASK[1]) > 0)
				{
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibPath(repos,1), searchResult, 1, 2);	//Search By FileContent
				}
				if((searchMask & SEARCH_MASK[2]) > 0)
				{	
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibPath(repos,2), searchResult, 1, 2);	//Search By VDoc
				}
			}
		}
		
		return true;
	}
}
	