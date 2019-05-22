package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import util.ReadProperties;
import util.ReturnAjax;
import util.DocConvertUtil.Office2PDF;
import util.LuceneUtil.LuceneUtil2;

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
	public void addDoc(Integer reposId,Integer type,  Integer level, Long pid, String path, String name, String content,
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc reposId:" + reposId + " type: " + type + " level: " + level +" pid:" + pid  + " path: " + path + " name: " + name + " content: " + content);
		//System.out.println(Charset.defaultCharset());
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();

		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		if(checkUserAddRight(repos, login_user.getId(), pid, path, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Long docId = buildDocIdByName(level, path, name);
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, type,  docId, pid, path, name, content, null,(long) 0,"", null,null,null, commitMsg,commitUser,login_user,rt, actionList); 
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
	public void feeback(String name, String path, String content, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("feeback name: " + name + " content: " + content);

		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
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
		Integer reposId = getReposIdForFeeback();		
		Long pid = 0L;
		
		String commitMsg = "User Feeback by " + name;
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		Long docId = buildDocIdByName(0,"",name);
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = addDoc(repos, 1, docId, pid, path, name, content, null, 0L, "", null,null,null,commitMsg,commitUser,login_user,rt, actionList);
		
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
	public void deleteDoc(Integer reposId, Long docId, Long pid, String path, String name, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("deleteDoc reposId:" + reposId + " docId:" + docId + " pid:" + pid  + " path: " + path + " name: " + name );
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		if(checkUserDeleteRight(repos, login_user.getId(), pid, path, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		String ret = deleteDoc(repos, docId, path, name, commitMsg, commitUser, login_user, rt, actionList);
		
		writeJson(rt, response);
		
		if(ret != null)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer reposId, Long docId, Long srcPid, Integer type, String srcPath, String srcName, String dstName, 
							String commitMsg, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("moveDoc reposId: " + reposId  + " docId: " + docId + " srcPid: " + srcPid  + " srcPath:" + srcPath + " srcName:" + srcName + " dstName:" + dstName);
		
		if(srcPath == null)
		{
			srcPath = "";
		}

		ReturnAjax rt = new ReturnAjax();
		
		if(dstName == null || "".equals(dstName))
		{
			rt.setError("目标文件名不能为空！");
			writeJson(rt, response);			
			return;
		}
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
	
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
	
		if(checkUserDeleteRight(repos, login_user.getId(), srcPid, srcPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		if(checkUserAddRight(repos, login_user.getId(), srcPid, srcPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = renameDoc(repos, docId, srcPid, type, srcPath,srcName, dstName, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer reposId, Long docId, Long srcPid, Long dstPid, Integer type, String srcPath, String srcName,String dstPath, String dstName, 
			String commitMsg, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("moveDoc reposId: " + reposId  + " docId: " + docId + " srcPid: " + srcPid + " dstPid: " + dstPid + " srcPath:" + srcPath + " srcName:" + srcName + " dstPath:" + dstPath+ " dstName:" + dstName);
		
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
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
	
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
	
		if(checkUserDeleteRight(repos, login_user.getId(), srcPid, srcPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		if(checkUserAddRight(repos, login_user.getId(), srcPid, srcPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = moveDoc(repos, docId, srcPid, dstPid, type, srcPath,srcName,dstPath,dstName, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer reposId, Long docId, Long srcPid, Long dstPid, Integer type, String srcPath, String srcName,String dstPath, String dstName, 
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("copyDoc reposId: " + reposId  + " docId: " + docId + " srcPid: " + srcPid + " dstPid: " + dstPid + " srcPath:" + srcPath + " srcName:" + srcName + " dstPath:" + dstPath+ " dstName:" + dstName);
		
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
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
	
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
				
		//检查用户是否有目标目录权限新增文件
		if(checkUserAddRight(repos, login_user.getId(), dstPid, dstPath, "", rt) == false)
		{
			writeJson(rt, response);
			return;
		}
		
		if(dstName == null || "".equals(dstName))
		{
			dstName = srcName;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, docId, srcPid, dstPid, type, srcPath,srcName,dstPath,dstName, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	
	/****************   Check a Document ******************/
	@RequestMapping("/checkChunkUploaded.do")
	public void checkChunkUploaded(Integer reposId, Long docId, Long pid, Integer level, String path, String name, 
			Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Integer chunkSize,String chunkHash, 
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("checkChunkUploaded name: " + name + " size: " + size + " checkSum: " + checkSum + " chunkIndex: " + chunkIndex + " chunkNum: " + chunkNum + " cutSize: " + cutSize+ " chunkSize: " + chunkSize+ " chunkHash: " + chunkHash+ " reposId: " + reposId + " pid: " + pid + " path: " + path);

		if(path == null)
		{
			path = "";
		}
		
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
			rt.setError("仓库 " + reposId + " 不存在！");
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
			rt.setDebugLog("chunk: " + fileChunkName +" 不存在，或checkSum不同！");
		}
		else
		{
			rt.setMsgData("1");
			rt.setDebugLog("chunk: " + fileChunkName +" 已存在，且checkSum相同！");
			
			System.out.println("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				String commitUser = login_user.getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				
				//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
				String localParentPath = getReposRealPath(repos) + path;
				File localParentDir = new File(localParentPath);
				if(false == localParentDir.exists())
				{
					localParentDir.mkdirs();
					pid = buildPidByPath(level-1, path);
				}
				
				docId = buildDocIdByName(level, path, name);
				Doc doc = docSysGetDoc(repos, docId, pid, path, name, login_user);
				
				if(doc == null)
				{
					boolean ret = addDoc(repos, 1, docId, pid, path, name, 
								null, 
								null,size, checkSum, 
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
					boolean ret = updateDoc(repos, docId, pid, path, name, 
							null, size,checkSum,   
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
	/****************   Check a Document ******************/
	@RequestMapping("/checkDocInfo.do")
	public void checkDocInfo(Integer reposId, Long docId, Integer type, Long pid, String path, String name,Long size,String checkSum, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("checkDocInfo name: " + name + " type: " + type + " size: " + size + " checkSum: " + checkSum+ " reposId: " + reposId + " pid: " + pid);

		if(path == null)
		{
			path = "";
		}

		
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//检查登录用户的权限
		DocAuth UserDocAuth = getUserDocAuth(repos, login_user.getId(), pid, path, "");
		if(UserDocAuth == null)
		{
			rt.setError("您无权在该目录上传文件!");
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
					rt.setError("上传文件超过 "+ MaxFileSize + "M");
					writeJson(rt, response);
					return;
				}
			}
			
			//任意用户文件不得30M
			if((UserDocAuth.getGroupId() == null) && ((UserDocAuth.getUserId() == null) || (UserDocAuth.getUserId() == 0)))
			{
				if(size > 30*1024*1024)
				{
					rt.setError("非仓库授权用户最大上传文件不超过30M!");
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
		Doc doc = docSysGetDoc(repos, docId, pid, path, name, login_user);
		if(doc != null)
		{
			rt.setData(doc);
			rt.setMsgData("0");
			rt.setDebugLog("Node: " + name +" 已存在！");
			System.out.println("checkDocInfo() " + name + " 已存在");
	
			//检查checkSum是否相同
			if(type == 1)
			{
				if(true == isDocCheckSumMatched(doc,size,checkSum))
				{
					rt.setMsgData("1");
					rt.setDebugLog("Node: " + name +" 已存在，且checkSum相同！");
					System.out.println("checkDocInfo() " + name + " 已存在，且checkSum相同！");
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
					//Do copy the Doc
					String srcPath = sameDoc.getPath();
					List<CommonAction> actionList = new ArrayList<CommonAction>();
					boolean ret = copyDoc(repos, sameDoc.getDocId(), sameDoc.getPid(), pid, sameDoc.getType(), srcPath, sameDoc.getName(), path, name, commitMsg,login_user.getName(),login_user,rt,actionList);
					if(ret == true)
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied ok！");
						doc = dbGetDoc(repos, docId, pid, path, name, true);
						rt.setData(doc);
						rt.setMsgData("1");
						rt.setDebugLog("SameDoc " + sameDoc.getName() +" found and do copy OK！");
						writeJson(rt, response);
						
						executeCommonActionList(actionList, rt);
						return;
					}
					else
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied failed！");
						rt.setStatus("ok");
						rt.setMsgData("3");
						rt.setDebugLog("SameDoc " + sameDoc.getName() +" found but do copy Failed！");
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
		if(size.equals(doc.getSize()) && !"".equals(checkSum) && checkSum.equals(doc.getCheckSum()))
		{
			return true;
		}
		return false;
	}

	/****************   Upload a Document ******************/
	/*docId = -1: means it is add, else it is update
	 * pid = -1: means we do not know the pid maybe it still not exists*/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(Integer reposId, Long docId, Long pid, Integer level, String path, String name,	//
			MultipartFile uploadFile, Long size, String checkSum,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Integer chunkSize, String chunkHash,
			String commitMsg,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("uploadDoc  name:" + name + " size:" +size+ " checkSum:" + checkSum + " reposId:" + reposId + " pid:" + pid + " path:" + path  + " docId:" + docId
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
			
		//检查localParentPath是否存在，如果不存在的话，需要创建localParentPath
		String localParentPath = getReposRealPath(repos) + path;
		File localParentDir = new File(localParentPath);
		if(false == localParentDir.exists())
		{
			localParentDir.mkdirs();
			pid = buildPidByPath(level-1, path);
		}
		
		docId = buildDocIdByName(level, path, name);
		
		Doc doc = docSysGetDoc(repos, docId, pid, path, name, login_user);
		
		if(doc == null)	//0: add  1: update
		{
			if(checkUserAddRight(repos,login_user.getId(),pid, path, "" ,rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(checkUserEditRight(repos, login_user.getId(), docId, path, name, rt) == false)
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
		
		//非分片上传或LastChunk Received
		if(uploadFile != null) 
		{
			String chunkParentPath = getReposUserTmpPath(repos,login_user);
			List<CommonAction> actionList = new ArrayList<CommonAction>();
			if(doc == null)
			{
				boolean ret = addDoc(repos, 1, docId, pid, path, name, 
						null, 
						uploadFile,size, checkSum, 
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
				boolean ret = updateDoc(repos, docId, pid, path, name, 
						uploadFile, size,checkSum,   
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
			rt.setError("文件上传失败！");
		}
		writeJson(rt, response);
	}
	
	/****************   Upload a Picture for Markdown ******************/
	@RequestMapping("/uploadMarkdownPic.do")
	public void uploadMarkdownPic(@RequestParam(value = "editormd-image-file", required = true) MultipartFile file, HttpServletRequest request,HttpServletResponse response,HttpSession session) throws Exception{
		//TODO: 取文件的地方有问题
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
		String path = curDoc.getPath();
		String docVName = getVDocName(path, curDoc.getName());
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
	public void updateDocContent(Integer reposId, Long docId, Long pid, String path, String name, String content,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("updateDocContent reposId: " + reposId + " docId:" + docId + " path:" + path + " name:" + name);
		System.out.println("content:[" + content + "]");
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = docSysGetDoc(repos, docId, pid, path, name, login_user);
		if(doc == null)
		{
			rt.setError("文件 " + path + name + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, login_user.getId(), docId, path, name, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = updateDocContent(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			deleteTmpVirtualDocContent(repos, path, name, login_user);
			
			executeCommonActionList(actionList, rt);
		}
	}

	private void deleteTmpVirtualDocContent(Repos repos, String path, String name, User login_user) {
		String docVName = getVDocName(path,name);
		//Save the content to virtual file
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		String vDocPath = userTmpDir + docVName + "/";
		
		delFileOrDir(vDocPath);
	}

	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Long docId, Long pid, String path, String name, String content,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("tmpSaveVirtualDocContent() reposId: " + reposId + " docId:" + docId + " path:" + path + " name:" + name);
		
		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
				
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = new Doc();
		doc.setPath(path);
		doc.setName(name);
		doc.setContent(content);
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		if(saveVirtualDocContent(userTmpDir, doc, rt) == false)
		{
			rt.setError("saveVirtualDocContent Error!");
		}
		writeJson(rt, response);
	}
	
	/**************** download Doc  ******************/
	@RequestMapping("/downloadDoc.do")
	public void downloadDoc(Integer reposId,Integer docId, String path, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("downloadDoc reposId: " + reposId + " docId:" + docId + " path:" + path + " name:" + name);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		switch(repos.getType())
		{
		case 1:
		case 2:
			downloadDoc_FS(repos, docId, path, name, response, request, session);
			break;
		case 3:
			downloadDoc_SVN(repos, docId, path, name, response, request, session);
			break;
		case 4:
			downloadDoc_GIT(repos, docId, path, name, response, request, session);
			break;
		}
		
	}
	private void downloadDoc_GIT(Repos repos, Integer docId, String path, String name,
			HttpServletResponse response, HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	private void downloadDoc_SVN(Repos repos, Integer docId, String path, String name,
			HttpServletResponse response, HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	public void downloadDoc_FS(Repos repos,Integer docId, String path, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDoc_DB reposId: " + repos.getId() + " docId:" + docId + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = reposService.getDoc(docId);
		if(doc==null){
			System.out.println("doGet() Doc " + docId + " 不存在");
			rt.setError("doc " + docId + "不存在！");
			writeJson(rt, response);
			return;
		}
		
		//get reposRPath
		String reposRPath = getReposRealPath(repos);

		//文件的localParentPath
		String localParentPath = reposRPath + path;
		System.out.println("doGet() localParentPath:" + localParentPath);
		
		//get userTmpDir
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		sendTargetToWebPage(localParentPath,name, userTmpDir, rt, response, request);
	}
	
	/**************** get Tmp File ******************/
	@RequestMapping("/doGetTmpFile.do")
	public void doGetTmp(Integer reposId,String path, String fileName,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("doGetTmpFile reposId: " + reposId);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//虚拟文件下载
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
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

	/**************** download History Doc  ******************/
	@RequestMapping("/getHistoryDoc.do")
	public void getHistoryDoc(String commitId,Integer reposId, String path, String name, Integer historyType, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("getHistoryDoc commitId: " + commitId + " reposId:" + reposId + " historyType:" + historyType +" path:" + path + " name:" + name);

		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//get reposInfo to 
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//URL was encode by EncodeURI, so just decode it here
		name = new String(name.getBytes("ISO8859-1"),"UTF-8");  
		path = new String(path.getBytes("ISO8859-1"),"UTF-8");  
		System.out.println("getHistoryDoc() name:" + name + " path:" + path);
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;
		}
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		//Set targetName
		String entryName = name;
		String targetName = null;
		if(isRealDoc)
		{	
			if(name.isEmpty())
			{
				//If the name is "" means we are checking out the root dir of repos, so we take the reposName as the targetName
				targetName = repos.getName() + "_" + commitId;	
			}
			else
			{
				targetName = name + "_" + commitId;
			}
		}
		else
		{	
			if(name.isEmpty())
			{
				//If the name is "" means we are checking out the root dir of repos, so we take the reposName as the targetName
				targetName = repos.getName() + "_AllNotes_" + commitId;	
			}
			else
			{
				targetName = name + "_Node_" + commitId;
			}
			
			entryName = getVDocName(path, name);
			path = "";
		}
		
		//checkout the entry to local
		if(verReposCheckOut(repos, isRealDoc, path, entryName, userTmpDir, targetName, commitId) == null)
		{
			System.out.println("getHistoryDoc() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed path:" + path + " entryName:" + entryName + " userTmpDir:" + userTmpDir + " targetName:" + targetName);
			writeJson(rt, response);	
			return;
		}
		
		sendTargetToWebPage(userTmpDir, targetName, userTmpDir, rt, response, request);
		
		//delete the history file or dir
		delFileOrDir(userTmpDir+targetName);
	}

	/**************** convert Doc To PDF ******************/
	@RequestMapping("/DocToPDF.do")
	public void DocToPDF(Integer reposId, Long docId, Long pid, String path, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{	
		
		if(path == null)
		{
			path = "";
		}

		ReturnAjax rt = new ReturnAjax();
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			DocToPDF_FS(repos, docId, pid, path, name, response, request, session);
			break;
		}
	}

	public void DocToPDF_FS(Repos repos, Long docId, Long pid, String path, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("DocToPDF_FS docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		String fileSuffix = getFileSuffix(name);
		if(fileSuffix == null)
		{
			rt.setError("未知文件类型");
			writeJson(rt, response);
			return;
		}
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), docId, path, name, rt) == false)
		{
			System.out.println("DocToPDF() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}
			
		Doc localEntry = fsGetDoc(repos, docId, pid, path, name);
		if(localEntry == null)
		{
			rt.setError("文件不存在！");
			writeJson(rt, response);
			return;
		}
		
		if(localEntry.getType() == 2)
		{
			rt.setError("目录无法预览");
			writeJson(rt, response);
			return;
		}
		

		String webTmpPath = getWebTmpPath();
		String dstName = repos.getId() + "_" + docId + ".pdf";
		String dstPath = webTmpPath + "preview/" + dstName;
		System.out.println("DocToPDF() dstPath:" + dstPath);

		String fileLink = "/DocSystem/tmp/preview/" + dstName;
		
		File file = new File(dstPath);
		if(file.exists())
		{
			Doc doc = dbGetDoc(repos, docId, pid, path, name, true);
			if(false == isDocLocalChanged(doc,localEntry))
			{
				rt.setData(fileLink);
				writeJson(rt, response);
				return;
			}			
		}	
		
		//Do convert
		String localEntryPath = getReposRealPath(repos) + path + name;
		switch(fileSuffix)
		{
		case "pdf":
			if(copyFile(localEntryPath, dstPath,true) == false)
			{
				rt.setError("预览失败");
				rt.setDebugLog("Failed to copy " + localEntryPath + " to " + dstPath);
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
			if(Office2PDF.openOfficeToPDF(localEntryPath,dstPath) == false)
			{
				rt.setError("预览失败");
				rt.setDebugLog("Failed execute openOfficeToPDF " + localEntryPath + " to " + dstPath);
				writeJson(rt, response);
				return;
			}
			break;
		default:
			rt.setError("该文件类型不支持预览");
			rt.setDebugLog("srcPath:"+localEntryPath);
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
	public void getDocContent(Integer reposId, Long docId, Long pid, String path, String name, HttpServletRequest request,HttpServletResponse response,HttpSession session){
		System.out.println("getDocContent reposId: " + reposId + " docId:" + docId + " pid:" + pid + " path:" + path + " name:" + name);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			System.out.println("getDoc 仓库 " + reposId + " 不存在！");
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		String vDocName = getVDocName(path, name);
		String reposVPath = getReposVirtualPath(repos);
		String content = readVirtualDocContent(reposVPath, vDocName);		
		rt.setData(content);
		//System.out.println(rt.getData());

		writeJson(rt, response);
	}
	
	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, String path, String name,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDoc reposId:" + reposId + " docId: " + docId + " path:" + path + " name:" + name);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			System.out.println("getDoc 仓库 " + reposId + " 不存在！");
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//Set currentDocId to session which will be used MarkDown ImgUpload
		session.setAttribute("currentReposId", reposId);
		session.setAttribute("currentDocId", docId);
		session.setAttribute("currentParentPath", path);
		session.setAttribute("currentDocName", name);
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), docId, path, name, rt) == false)
		{
			System.out.println("getDoc() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}

		Doc doc = new Doc();
		doc.setDocId(docId);
		doc.setName(name);
		doc.setPath(path);

		String vDocName = getVDocName(path, name);
		String reposVPath = getReposVirtualPath(repos);
		String content = readVirtualDocContent(reposVPath, vDocName);
        if( null !=content)
        {
        	content = content.replaceAll("\t","");
        }
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
	public void lockDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer lockType, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("lockDoc reposId: " + reposId + " docId: " + docId + " path:" + path + " name:" + name + " lockType: " + lockType);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(docId == null)
		{
			rt.setError("docId is null");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, login_user.getId(), docId, path, name, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}

		Doc doc = new Doc();
		doc.setVid(reposId);
		doc.setDocId(docId);
		doc.setPath(path);
		doc.setName(name);
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
	public void getDocHistory(Integer reposId, Long docId, Long pid, String path, String name, Integer historyType,Integer maxLogNum, HttpSession session, HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDocHistory reposId:" + reposId + " docId:" + docId + " docPath:" + path+name +" historyType:" + historyType);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(reposId == null)
		{
			rt.setError("reposId is null");
			writeJson(rt, response);
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);
			return;
		}
		
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
				entryPath = getVDocName(path, name);
			}
		}
		
		List<LogEntry> logList = verReposGetHistory(repos, isRealDoc, entryPath, num);
		rt.setData(logList);
		writeJson(rt, response);
	}
	
	/****************   revert Document History ******************/
	@RequestMapping("/revertDocHistory.do")
	public void revertDocHistory(String commitId,Integer reposId, Long docId, Long pid, String path, String name, Integer historyType, HttpSession session, HttpServletRequest request,HttpServletResponse response){
		System.out.println("revertDocHistory commitId:" + commitId + " reposId:" + reposId + " docId:" + docId + " docPath:" + path+name +" historyType:" + historyType);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(reposId == null)
		{
			rt.setError("reposId is null");
			writeJson(rt, response);
			return;
		}
		
		
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);
			return;
		}
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			isRealDoc = false;
		}

		String ret = null;
		if(isRealDoc)
		{
			ret = revertRealDocHistory(repos,docId,path,name,commitId,null, login_user.getName(), login_user, rt);
		}
		else
		{
			ret = revertVirtualDocHistory(repos,docId,path,name,commitId,null, login_user.getName(), login_user, rt);
		}
		
		if(ret == null)
		{
			System.out.println("revertDocHistory Failed");
		}
		
		writeJson(rt, response);
	}

	/* 文件搜索与排序 
	 * reposId: 在指定的仓库下搜索，如果为空表示搜索所有可见仓库下的文件
	 * pDocId: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对默认类型仓库有效）
	 * path: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对文件类型仓库有效）
	 * searchWord: 支持文件名、文件内容和备注搜索，关键字可以支持空格分开 
	*/
	@RequestMapping("/searchDoc.do")
	public void searchDoc(Integer reposId,Integer pDocId, String path, String searchWord,String sort,HttpServletResponse response,HttpSession session){
		System.out.println("searchDoc searchWord: " + searchWord + " pDocId:" + pDocId + " path:" + path);
		
		if(path == null)
		{
			path = "";
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		List<Repos> reposList = new ArrayList<Repos>();
		if(reposId == null || reposId == -1)
		{
			//Do search all AccessableRepos
			reposList = getAccessableReposList(login_user.getId());
			pDocId = 0;
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
			List<Doc> result =  searchInRepos(queryRepos, pDocId, path, searchWord, sort);
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
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibName(repos.getId(),0), searchResult, 5, 3); 	//Search By DocName
				}
				if((searchMask & SEARCH_MASK[1]) > 0)
				{
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibName(repos.getId(),1), searchResult, 1, 2);	//Search By FileContent
				}
				if((searchMask & SEARCH_MASK[2]) > 0)
				{	
					LuceneUtil2.smartSearch(repos, searchStr, path, "content", getIndexLibName(repos.getId(),2), searchResult, 1, 2);	//Search By VDoc
				}
			}
		}
		
		return true;
	}
}
	