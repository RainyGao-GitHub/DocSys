package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;

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
（2） parentPath: 该变量通过getParentPath获取，如果是文件则获取的是其父节点的目录路径，如果是目录则获取到的是目录路径，以空格开头，以"/"结尾
（3） 文件/目录相对路径: docRPath = parentPath + doc.name docVName = HashValue(docRPath)  末尾不带"/"
（4） 文件/目录本地全路径: localDocRPath = reposRPath + parentPath + doc.name  localVDocPath = repoVPath + HashValue(docRPath) 末尾不带"/"
（5） 版本仓库路径：
 verReposPath: 本地版本仓库存储目录，以"/"结尾
 */
@Controller
@RequestMapping("/Doc")
public class DocController extends BaseController{
	/*******************************  Ajax Interfaces For Document Controller ************************/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(Integer reposId,Integer type,  Integer level, Long parentId, String parentPath, String docName, String content,
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc reposId:" + reposId + " type: " + type + " level: " + level +" parentId:" + parentId  + " parentPath: " + parentPath + " docName: " + docName + " content: " + content);
		//System.out.println(Charset.defaultCharset());
		
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
		
		//检查用户是否有权限新增文件
		if(checkUserAddRight(repos, login_user.getId(), parentId, parentPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		Long ret = addDoc(repos, type,  level, parentId, parentPath, docName, content, null,(long) 0,"", null,null,null, commitMsg,commitUser,login_user,rt, actionList); 
		writeJson(rt, response);
		
		if(ret == null || ret <= 0 )
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
		Long parentId = getParentIdForFeeback();
		String parentPath = path;
		
		String commitMsg = "User Feeback by " + name;
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		Long ret = addDoc(repos, -1, 1, parentId, parentPath, name, content, null, (long) 0, "", null,null,null,commitMsg,commitUser,login_user,rt, actionList);
		
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");		

		writeJson(rt, response);
		
		if(ret == null || ret <= 0)
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

	private Long getParentIdForFeeback() {
		String tempStr = null;
		tempStr = ReadProperties.read("docSysConfig.properties", "feebackParentId");
	    if(tempStr == null || "".equals(tempStr))
	    {
	    	return (long) 0;
	    }

	    return (long) (Integer.parseInt(tempStr));
 	}

	/****************   delete a Document ******************/
	@RequestMapping("/deleteDoc.do")
	public void deleteDoc(Integer reposId, Long docId, Long parentId, String parentPath, String docName, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("deleteDoc reposId:" + reposId + " docId:" + docId + " parentId:" + parentId  + " parentPath: " + parentPath + " docName: " + docName );
		
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
		
		//检查用户是否有权限新增文件
		if(checkUserDeleteRight(repos, login_user.getId(), parentId, parentPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = deleteDoc(repos, docId, parentPath, docName, commitMsg, commitUser, login_user, rt, false, actionList);
		
		writeJson(rt, response);
		
		if(ret == true)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	/****************   Check a Document ******************/
	@RequestMapping("/checkChunkUploaded.do")
	public void checkChunkUploaded(Integer uploadType, Integer reposId, Long docId, Long parentId, Integer level, String parentPath, String docName, 
			Long size, String checkSum,
			Integer chunkIndex,Integer chunkNum,Integer cutSize,Integer chunkSize,String chunkHash, 
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("checkChunkUploaded docName: " + docName + " size: " + size + " checkSum: " + checkSum + " chunkIndex: " + chunkIndex + " chunkNum: " + chunkNum + " cutSize: " + cutSize+ " chunkSize: " + chunkSize+ " chunkHash: " + chunkHash+ " reposId: " + reposId + " parentId: " + parentId + " parentPath: " + parentPath);
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
		String fileChunkName = docName + "_" + chunkIndex;
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		String chunkParentPath = userTmpDir;
		String chunkFilePath = chunkParentPath + fileChunkName;
		if(false == isChunkMatched(chunkFilePath,chunkHash))
		{
			rt.setMsg("chunk: " + fileChunkName +" 不存在，或checkSum不同！", "0");
		}
		else
		{
			rt.setMsg("chunk: " + fileChunkName +" 已存在，且checkSum相同！", "1");
			
			System.out.println("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				String commitUser = login_user.getName();
				List<CommonAction> actionList = new ArrayList<CommonAction>();
				if(uploadType == 0)
				{
					Long newDocId = addDoc(repos, 1, level, parentId, parentPath, docName, 
								null, 
								null,size, checkSum, 
								chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);
					writeJson(rt, response);
					if(newDocId > 0)
					{
						executeCommonActionList(actionList, rt);
						deleteChunks(docName,chunkIndex, chunkNum,chunkParentPath);
					}					
				}
				else
				{
					boolean ret = updateDoc(repos, docId, parentId, parentPath, docName, 
							null, size,checkSum,   
							chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);				
				
					writeJson(rt, response);	
					if(ret == true)
					{
						executeCommonActionList(actionList, rt);
						deleteChunks(docName,chunkIndex, chunkNum,chunkParentPath);
					}
				}
				return;
			}
		}
		writeJson(rt, response);
	}
	/****************   Check a Document ******************/
	@RequestMapping("/checkDocInfo.do")
	public void checkDocInfo(Integer reposId, Long docId, Integer type, Long parentId, String parentPath, String docName,Long size,String checkSum, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("checkDocInfo docName: " + docName + " type: " + type + " size: " + size + " checkSum: " + checkSum+ " reposId: " + reposId + " parentId: " + parentId);
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
		DocAuth UserDocAuth = getUserDocAuth(repos, login_user.getId(), parentId, parentPath, "");
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
				
		if(repos.getType() != 1 || checkSum.isEmpty())
		{
			//CheckSum is empty, mean no need to check any more 
			writeJson(rt, response);
			return;
		}
		
		//判断目录下是否有同名节点 
		Doc doc = getDocByName(docName,parentId,reposId);
		if(doc != null)
		{
			rt.setData(doc);
			rt.setMsg("Node: " + docName +" 已存在！","0");
			System.out.println("checkDocInfo() " + docName + " 已存在");
	
			//检查checkSum是否相同
			if(type == 1)
			{
				if(true == isDocCheckSumMatched(doc,size,checkSum))
				{
					rt.setMsg("Node: " + docName +" 已存在，且checkSum相同！", "1");
					System.out.println("checkDocInfo() " + docName + " 已存在，且checkSum相同！");
				}
			}
			writeJson(rt, response);
			return;
		}
		else
		{
			if(size > 10*1024*1024)	//Only For 10M File to balance the Upload and SameDocSearch 
			{
				//Try to find the same Doc in the repos
				Doc sameDoc = getSameDoc(size,checkSum,reposId);
				if(null != sameDoc)
				{
					System.out.println("checkDocInfo() " + sameDoc.getName() + " has same checkSum " + checkSum + " try to copy from it");
					//Do copy the Doc
					String srcParentPath = sameDoc.getPath();
					List<CommonAction> actionList = new ArrayList<CommonAction>();
					copyDoc(repos, sameDoc.getDocId(), sameDoc.getPid(), parentId, sameDoc.getType(), srcParentPath, sameDoc.getName(), parentPath, docName, commitMsg,login_user.getName(),login_user,rt,actionList, false);
					Doc newDoc = getDocByName(docName,parentId,reposId);
					if(null != newDoc)
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied ok！");
						rt.setData(newDoc);
						rt.setMsg("SameDoc " + sameDoc.getName() +" found and do copy OK！", "1");
						writeJson(rt, response);
						executeCommonActionList(actionList, rt);
						return;
					}
					else
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied failed！");
						rt.setStatus("ok");
						rt.setMsg("SameDoc " + sameDoc.getName() +" found but do copy Failed！", "3");
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
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(Integer uploadType, Integer reposId, Long docId, Long parentId, Integer level, String parentPath, String docName,	//
			MultipartFile uploadFile, Long size, String checkSum,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Integer chunkSize, String chunkHash,
			String commitMsg,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("uploadDoc uploadType:" + uploadType + " docName:" + docName + " size:" +size+ " checkSum:" + checkSum + " reposId:" + reposId + " parentId:" + parentId + " parentPath:" + parentPath  + " docId:" + docId
							+ " chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum + " cutSize:" + cutSize  + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash);

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
		
		//检查用户是否有权限新增文件
		if(uploadType == 0)	//0: add  1: update
		{
			if(checkUserAddRight(repos,login_user.getId(),parentId, parentPath, "" ,rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(checkUserEditRight(repos, login_user.getId(), docId, parentPath, docName, rt) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		
		//如果是分片文件，则保存分片文件
		if(null != chunkIndex)
		{
			//Save File chunk to tmp dir with name_chunkIndex
			String fileChunkName = docName + "_" + chunkIndex;
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
			if(uploadType == 0)
			{
				Long newDocId = addDoc(repos, 1, level, parentId, parentPath, docName, 
						null, 
						uploadFile,size, checkSum, 
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);
				writeJson(rt, response);

				if(newDocId != null)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(docName,chunkIndex, chunkNum,chunkParentPath);
				}					
			}
			else
			{
				boolean ret = updateDoc(repos, docId, parentId, parentPath, docName, 
						uploadFile, size,checkSum,   
						chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt, actionList);					
			
				writeJson(rt, response);	
				if(ret == true)
				{
					executeCommonActionList(actionList, rt);
					deleteChunks(docName,chunkIndex, chunkNum,chunkParentPath);
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
		Integer docId = (Integer) session.getAttribute("currentDocId");
		if(docId == null || docId == 0)
		{
			res.put("success", 0);
			res.put("message", "upload failed: currentDocId was not set!");
			writeJson(res,response);
			return;
		}
		
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			res.put("success", 0);
			res.put("message", "upload failed: getDoc failed for docId:" + docId );
			writeJson(res,response);
			return;			
		}
				
		//MayBe We need to save current Edit docId in session, So that I can put the pic to dedicated VDoc Directory
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
		Repos repos = reposService.getRepos(doc.getVid());
		String reposVPath = getReposVirtualPath(repos);
		String parentPath = doc.getPath();
		String docVName = getVDocName(parentPath, doc.getName());
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

	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer reposId, Long docId, Integer type, Long parentId, String parentPath, String name, String newname, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("renameDoc reposId: " + reposId + " docId:"+ docId + " parentPath:" + parentPath+ " name: " + name+ " newname: " + newname);
		
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
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, login_user.getId(), docId, parentPath, name, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		//TODO: 这里有risk, 可能导致docId对应的权限失效，因为move操作对于文件型系统会导致docId改变，因此需要更新对应的权限设置
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = renameDoc(repos, docId, parentId, parentId, type, parentPath, name, parentPath, newname, commitMsg,commitUser, login_user,rt, actionList , true);
		writeJson(rt, response);
		
		if(ret == true)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	private boolean renameDoc(Repos repos, Long docId, Long parentId, Long parentId2, Integer type,
			String parentPath, String name, String parentPath2, String newname, String commitMsg, String commitUser,
			User login_user, ReturnAjax rt, List<CommonAction> actionList, boolean b) {
		// TODO Auto-generated method stub
		return false;
	}

	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer reposId, Long docId, Integer type, Long srcPid, Long dstPid, String srcParentPath, String srcDocName, String dstParentPath, String dstDocName, 
			String commitMsg, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		
		System.out.println("copyDoc reposId: " + reposId  + " docId: " + docId + " srcPid: " + srcPid + " dstPid: " + dstPid + " srcParentPath:" + srcParentPath + " srcDocName:" + srcDocName + " dstParentPath:" + dstParentPath+ " dstDocName:" + dstDocName);
		
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
	
		//检查是否有源目录的删除权限
		if(checkUserDeleteRight(repos, login_user.getId(), srcPid, srcParentPath, "", rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		//检查用户是否有目标目录权限新增文件
		if(checkUserAddRight(repos, login_user.getId(), dstPid, dstParentPath, "", rt) == false)
		{
				writeJson(rt, response);	
				return;
		}
		
		//TODO: 这里有risk, 可能导致docId对应的权限失效，因为move操作对于文件型系统会导致docId改变，因此需要更新对应的权限设置
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = moveDoc(repos, docId, srcPid, dstPid, type, srcParentPath, srcDocName, dstParentPath, dstDocName, commitMsg, commitUser, login_user,rt, actionList , true);		
		writeJson(rt, response);	
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}
	

	private boolean moveDoc(Repos repos, Long docId, Long srcPid, Long dstPid, Integer type,
			String srcParentPath, String srcDocName, String dstParentPath, String dstDocName, String commitMsg,
			String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList, boolean b) {
		// TODO Auto-generated method stub
		return false;
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer reposId, Long docId, Long srcPid, Long dstPid, Integer type, String srcParentPath, String srcDocName,String dstParentPath, String dstDocName, 
			String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("copyDoc reposId: " + reposId  + " docId: " + docId + " srcPid: " + srcPid + " dstPid: " + dstPid + " srcParentPath:" + srcParentPath + " srcDocName:" + srcDocName + " dstParentPath:" + dstParentPath+ " dstDocName:" + dstDocName);
		
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
		if(checkUserAddRight(repos, login_user.getId(), dstPid, dstParentPath, "", rt) == false)
		{
			writeJson(rt, response);
			return;
		}
		
		if(dstDocName == null || "".equals(dstDocName))
		{
			dstDocName = srcDocName;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = copyDoc(repos, docId, srcPid, dstPid, type, srcParentPath,srcDocName,dstParentPath,dstDocName, commitMsg, commitUser, login_user, rt, actionList, false);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer reposId, Long docId, String parentPath, String docName, String content,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("updateDocContent reposId: " + reposId + " docId:" + docId + " parentPath:" + parentPath + " docName:" + docName);
		System.out.println("content:[" + content + "]");
		
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
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, login_user.getId(), docId, parentPath, docName, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		List<CommonAction> actionList = new ArrayList<CommonAction>();
		boolean ret = updateDocContent(repos, docId, parentPath, docName, content, commitMsg, commitUser, login_user, rt, actionList);
		writeJson(rt, response);
		
		if(ret)
		{
			executeCommonActionList(actionList, rt);
		}
	}

	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer reposId, Integer docId, String parentPath, String docName, String content,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("tmpSaveVirtualDocContent() reposId: " + reposId + " docId:" + docId + " parentPath:" + parentPath + " docName:" + docName);
		
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
		
		String docVName = getVDocName(parentPath,docName);
		//Save the content to virtual file
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		if(saveVirtualDocContent(userTmpDir,docVName,content,rt) == false)
		{
			rt.setError("saveVirtualDocContent Error!");
		}
		writeJson(rt, response);
	}
	
	/**************** download Doc  ******************/
	@RequestMapping("/downloadDoc.do")
	public void downloadDoc(Integer reposId,Integer docId, String parentPath, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("downloadDoc reposId: " + reposId + " docId:" + docId + " parentPath:" + parentPath + " name:" + name);
		
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
			downloadDoc_FS(repos, docId, parentPath, name, response, request, session);
			break;
		case 3:
			downloadDoc_SVN(repos, docId, parentPath, name, response, request, session);
			break;
		case 4:
			downloadDoc_GIT(repos, docId, parentPath, name, response, request, session);
			break;
		}
		
	}
	private void downloadDoc_GIT(Repos repos, Integer docId, String parentPath, String name,
			HttpServletResponse response, HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	private void downloadDoc_SVN(Repos repos, Integer docId, String parentPath, String name,
			HttpServletResponse response, HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	public void downloadDoc_FS(Repos repos,Integer docId, String parentPath, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("downloadDoc_DB reposId: " + repos.getId() + " docId:" + docId + " parentPath:" + parentPath + " name:" + name);

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
		String localParentPath = reposRPath + parentPath;
		System.out.println("doGet() localParentPath:" + localParentPath);
		
		//get userTmpDir
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		sendTargetToWebPage(localParentPath,name, userTmpDir, rt, response, request);
	}
	
	/**************** get Tmp File ******************/
	@RequestMapping("/doGetTmpFile.do")
	public void doGetTmp(Integer reposId,String parentPath, String fileName,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("doGetTmpFile reposId: " + reposId);

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
		if(parentPath != null)
		{
			localParentPath = userTmpDir + parentPath;
		}
		
		sendFileToWebPage(localParentPath,fileName,rt, response, request); 
	}

	/**************** download History Doc  ******************/
	@RequestMapping("/getHistoryDoc.do")
	public void getHistoryDoc(String commitId,Integer reposId, String parentPath, String docName, Integer historyType, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("getHistoryDoc commitId: " + commitId + " reposId:" + reposId + " historyType:" + historyType +" parentPath:" + parentPath + " docName:" + docName);

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
		docName = new String(docName.getBytes("ISO8859-1"),"UTF-8");  
		parentPath = new String(parentPath.getBytes("ISO8859-1"),"UTF-8");  
		System.out.println("getHistoryDoc() docName:" + docName + " parentPath:" + parentPath);
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)
		{
			isRealDoc = false;
		}
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		//Set targetName
		String entryName = docName;
		String targetName = null;
		if(isRealDoc)
		{	
			if(docName.isEmpty())
			{
				//If the docName is "" means we are checking out the root dir of repos, so we take the reposName as the targetName
				targetName = repos.getName() + "_" + commitId;	
			}
			else
			{
				targetName = docName + "_" + commitId;
			}
		}
		else
		{	
			if(docName.isEmpty())
			{
				//If the docName is "" means we are checking out the root dir of repos, so we take the reposName as the targetName
				targetName = repos.getName() + "_AllNotes_" + commitId;	
			}
			else
			{
				targetName = docName + "_Node_" + commitId;
			}
			
			entryName = getVDocName(parentPath, docName);
			parentPath = "";
		}
		
		//checkout the entry to local
		if(verReposCheckOut(repos, isRealDoc, parentPath, entryName, userTmpDir, targetName, commitId) == false)
		{
			System.out.println("getHistoryDoc() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed parentPath:" + parentPath + " entryName:" + entryName + " userTmpDir:" + userTmpDir + " targetName:" + targetName);
			writeJson(rt, response);	
			return;
		}
		
		sendTargetToWebPage(userTmpDir, targetName, userTmpDir, rt, response, request);
		
		//delete the history file or dir
		delFileOrDir(userTmpDir+targetName);
	}

	/**************** convert Doc To PDF ******************/
	@RequestMapping("/DocToPDF.do")
	public void DocToPDF(Doc doc, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		Integer reposId = doc.getVid();
		Long docId = doc.getDocId();
		String parentPath = doc.getPath();
		String name = doc.getName();
		
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
			DocToPDF_FS(repos, docId, parentPath, name, response, request, session);
			break;
		case 3:
			DocToPDF_SVN(repos, docId, parentPath, name, response, request, session);
			break;
		case 4:
			DocToPDF_GIT(repos, docId, parentPath, name, response, request, session);
			break;
		}
		
	}	
	private void DocToPDF_GIT(Repos repos, Long docId, String parentPath, String name, HttpServletResponse response,
			HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	private void DocToPDF_SVN(Repos repos, Long docId, String parentPath, String name, HttpServletResponse response,
			HttpServletRequest request, HttpSession session) {
		// TODO Auto-generated method stub
		
	}

	public void DocToPDF_FS(Repos repos, Long docId, String parentPath, String name, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception
	{
		System.out.println("DocToPDF docId: " + docId);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), docId, parentPath, name, rt) == false)
		{
			System.out.println("DocToPDF() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}
		
				
		String reposRPath = getReposRealPath(repos);
		String localParentPath = reposRPath + parentPath;
		String localEntryPath = localParentPath + name;
		System.out.println("DocToPDF() srcPath:" + localEntryPath);
	
		File localEntry = new File(localEntryPath);
		if(localEntry.exists() == false)
		{
			rt.setError("文件不存在！");
			writeJson(rt, response);
			return;
		}
		
		if(localEntry.isDirectory())
		{
			rt.setError("目录无法预览");
			writeJson(rt, response);
			return;
		}
		
		
		String docCheckSum = "";
		Doc doc = getDocInfo(repos.getId(), docId);
		if(isDocLocalChanged(doc,localEntry))
		{
			docCheckSum = getCheckSum(localEntry, 2097152);	//2M chunk
		}
		else
		{
			docCheckSum = doc.getCheckSum();
		}
		
		String webTmpPath = getWebTmpPath();
		String dstName = localEntry.length() + "_" + docCheckSum + ".pdf";
		String dstPath = webTmpPath + "preview/" + dstName;
		System.out.println("DocToPDF() dstPath:" + dstPath);
		File file = new File(dstPath);
		if(!file.exists())
		{
			String fileSuffix = getFileSuffix(name);
			if(fileSuffix == null)
			{
				rt.setError("未知文件类型");
				rt.setDebugLog("localEntryPath:"+localEntryPath);
				writeJson(rt, response);
				return;
			}
			
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
		}
		//Save the pdf to web
		String fileLink = "/DocSystem/tmp/preview/" + dstName;
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
	public void getDocContent(Integer id,HttpServletRequest request,HttpServletResponse response,HttpSession session){
		System.out.println("getDocContent id: " + id);
		
		ReturnAjax rt = new ReturnAjax();
		
		Doc doc = reposService.getDoc(id);
		rt.setData(doc.getContent());
		//System.out.println(rt.getData());

		writeJson(rt, response);
	}
	
	/****************   get Document Info ******************/
	@RequestMapping("/getDoc.do")
	public void getDoc(Integer reposId, Long docId, String parentPath, String docName,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDoc reposId:" + reposId + " docId: " + docId + " parentPath:" + parentPath + " docName:" + docName);
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
		session.setAttribute("currentDocId", docId);
		session.setAttribute("currentParentPath", parentPath);
		session.setAttribute("currentDocName", docName);
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(repos, login_user.getId(), docId, parentPath, docName, rt) == false)
		{
			System.out.println("getDoc() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}

		Doc doc = new Doc();
		doc.setDocId(docId);
		doc.setName(docName);
		doc.setPath(parentPath);

		String vDocName = getVDocName(parentPath, docName);
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
	public void lockDoc(Doc doc, Integer lockType, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("lockDoc docId: " + doc.getId() + " reposId: " + doc.getVid() + " lockType: " + lockType);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Integer reposId = doc.getVid();
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(repos, login_user.getId(), doc.getDocId(), doc.getPath(), doc.getName(), rt) == false)
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
	public void getDocHistory(Integer reposId, Integer docId, String parentPath, String docName, Integer historyType,Integer maxLogNum, HttpSession session, HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDocHistory reposId:" + reposId + " docId:" + docId + " docPath:" + parentPath+docName +" historyType:" + historyType);
		
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
		
		String entryPath = parentPath + docName;
		if(isRealDoc == false)	//get VirtualDoc Path
		{
			if(docName == null || docName.isEmpty())
			{
				entryPath = "";	
			}
			else
			{
				entryPath = getVDocName(parentPath, docName);
			}
		}
		
		List<LogEntry> logList = verReposGetHistory(repos, isRealDoc, entryPath, num);
		rt.setData(logList);
		writeJson(rt, response);
	}
	
	/****************   revert Document History ******************/
	@RequestMapping("/revertDocHistory.do")
	public void revertDocHistory(String commitId,Integer reposId, Integer docId, String parentPath, String docName, Integer historyType, HttpSession session, HttpServletRequest request,HttpServletResponse response){
		System.out.println("revertDocHistory commitId:" + commitId + " reposId:" + reposId + " docId:" + docId + " docPath:" + parentPath+docName +" historyType:" + historyType);
		
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
		
		Repos repos = null;
		synchronized(syncLock)
		{
			repos = lockRepos(reposId, 1, 28800000, login_user, rt, true);	//8 Hours 8*60*60*1000 = 28800,000 
			if(repos == null)
			{
				unlock(); //线程锁
				System.out.println("revertDocHistory lock repos:" + reposId + " Failed");
				writeJson(rt, response);
				return;
			}
		}
		
		boolean isRealDoc = true;
		if(historyType != null && historyType == 1)	//0: For RealDoc 1: For VirtualDoc 
		{
			isRealDoc = false;
		}

		boolean ret = false;
		if(isRealDoc)
		{
			ret = revertRealDocHistory(repos,docId,parentPath,docName,commitId,null, login_user.getName(), login_user, rt);
		}
		else
		{
			ret = revertVirtualDocHistory(repos,docId,parentPath,docName,commitId,null, login_user.getName(), login_user, rt);
		}
		
		if(ret == false)
		{
			System.out.println("revertDocHistory Failed");
			unlockRepos(reposId,login_user,null);
		}
		
		writeJson(rt, response);
	}
	
	private boolean revertVirtualDocHistory(Repos repos, Integer docId, String parentPath, String docName, String commitId, String commitMsg, String commitUser, User login_user, ReturnAjax rt) 
	{	
		docName = getVDocName(parentPath, docName);
		parentPath = "";
		
		//Checkout to localParentPath
		String localParentPath = getReposVirtualPath(repos);
		
		//If localParentPath not exists do mkdirs
		
		//Do checkout the entry to 
		if(verReposCheckOut(repos, false, "", docName, localParentPath, docName, commitId) == false)
		{
			System.out.println("revertVirtualDocHistory() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed parentPath:" + parentPath + " entryName:" + docName + " localParentPath:" + localParentPath + " targetName:" + docName);
			return false;
		}
		
		//Do commit to verRepos
		if(commitMsg == null)
		{
			commitMsg = "Revert " + parentPath+docName + " to revision:" + commitId;
		}
		if(verReposAutoCommit(repos, false, parentPath, docName, localParentPath, docName, commitMsg,commitUser,true,null) == false)
		{			
			//Revert Local Entries
			//verReposCheckOut(repos, true, parentPath, docName, localParentPath, docName, null);//Revert

			System.out.println("verReposAutoCommit 失败");
			rt.setDebugLog("verReposAutoCommit 失败");
		}
		return false;
	}

	private boolean revertRealDocHistory(Repos repos, Integer docId, String parentPath, String docName, String commitId, String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("revertRealDocHistory commitId:" + commitId + " reposId:" + repos.getId() + " docId:" + docId + " docPath:" + parentPath+docName);
				
		if(docId != 0)
		{
			Doc doc = reposService.getDoc(docId);
			if(doc == null)
			{
				rt.setError("Doc " + docId + " 不存在！");
				return false;	
			}
		}
	
		//Checkout to localParentPath
		String localParentPath = getReposRealPath(repos) + parentPath;
		
		//If localParentPath not exists do mkdirs
		
		//Do checkout the entry to 
		if(verReposCheckOut(repos, true, parentPath, docName, localParentPath, docName, commitId) == false)
		{
			System.out.println("revertRealDocHistory() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed parentPath:" + parentPath + " entryName:" + docName + " localParentPath:" + localParentPath + " targetName:" + docName);
			return false;
		}
		
		//Do commit to verRepos
		if(commitMsg == null)
		{
			commitMsg = "Revert " + parentPath+docName + " to revision:" + commitId;
		}
		if(verReposAutoCommit(repos, true, parentPath, docName, localParentPath, docName, commitMsg,commitUser,true,null) == false)
		{			
			//Revert Local Entries
			//verReposCheckOut(repos, true, parentPath, docName, localParentPath, docName, null);//Revert

			System.out.println("verReposAutoCommit 失败");
			rt.setDebugLog("verReposAutoCommit 失败");
		}
		
		return true;
	}

	/* 文件搜索与排序 
	 * reposId: 在指定的仓库下搜索，如果为空表示搜索所有可见仓库下的文件
	 * pDocId: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对默认类型仓库有效）
	 * parentPath: 在仓库指定的目录下搜索，如果为空表示搜索整个仓库（对文件类型仓库有效）
	 * searchWord: 支持文件名、文件内容和备注搜索，关键字可以支持空格分开 
	*/
	@RequestMapping("/searchDoc.do")
	public void searchDoc(Integer reposId,Integer pDocId, String parentPath, String searchWord,String sort,HttpServletResponse response,HttpSession session){
		System.out.println("searchDoc searchWord: " + searchWord + " pDocId:" + pDocId + " parentPath:" + parentPath);
		
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
			parentPath = "";
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
			List<Doc> result =  searchInRepos(queryRepos, pDocId, parentPath, searchWord, sort);
			if(result != null && result.size() > 0)
			{
				searchResult.addAll(result);
			}
		}
		
		rt.setData(searchResult);
		writeJson(rt, response);
	}
	
	private List<Doc> searchInRepos(Repos repos, Integer pDocId, String parentPath, String searchWord, String sort) 
	{	
		HashMap<String, HitDoc> searchResult = new HashMap<String, HitDoc>();
		
		//使用Lucene进行全文搜索，结果存入param以便后续进行数据库查询
		if(searchWord!=null&&!"".equals(searchWord))
		{
			luceneSearch(repos, searchWord, parentPath, searchResult , 6);	//Search RDoc and VDoc only
			databaseSearch(repos, pDocId, searchWord, parentPath, searchResult);
		}
		
		List<Doc> result = convertSearchResultToDocList(repos, searchResult);
		return result;
	}

	private List<Doc> convertSearchResultToDocList(Repos repos, HashMap<String, HitDoc> searchResult) 
	{
		List<Doc> docList = new ArrayList<Doc>();
		
		String reposRPath = getReposRealPath(repos);
		for(HitDoc hitDoc: searchResult.values())
        {
      	    Doc doc = hitDoc.getDoc();
      	    String filePath = reposRPath + doc.getName();
      	    if(doc.getPath() != null)
      	    {
      	    	filePath = reposRPath +  doc.getPath() + doc.getName();
      	    }
		    File file = new File(filePath);
      	    if(file.exists())
      	    {
      	    	docList.add(doc);
      	    }
      	    else
      	    {
      	    	System.out.println("convertSearchResultToDocList() " + filePath + " 不存在，清除index、VDoc和previewFiels");
      	    	List<CommonAction> actionList = new ArrayList<CommonAction>();
				BuildMultiActionListForDocDelete(actionList , repos, doc, "AutoDelete", "System");
				ReturnAjax rt = new ReturnAjax();
				executeCommonActionList(actionList, rt );
      	    }
		}
	
		Collections.sort(docList);
		
		return docList;
	}

	
	private void databaseSearch(Repos repos, Integer pDocId, String searchWord, String parentPath, HashMap<String, HitDoc> searchResult) 
	{
		String [] keyWords = searchWord.split(" ");
		
		boolean enablePathFilter = true;
        if(parentPath == null || parentPath.isEmpty())
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
		            	else if(!docParentPath.contains(parentPath))
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
	private boolean luceneSearch(Repos repos, String searchWord, String parentPath, HashMap<String, HitDoc> searchResult, int searchMask) 
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
					LuceneUtil2.smartSearch(repos, searchStr, parentPath, "content", getIndexLibName(repos.getId(),0), searchResult, 5, 3); 	//Search By DocName
				}
				if((searchMask & SEARCH_MASK[1]) > 0)
				{
					LuceneUtil2.smartSearch(repos, searchStr, parentPath, "content", getIndexLibName(repos.getId(),1), searchResult, 1, 2);	//Search By FileContent
				}
				if((searchMask & SEARCH_MASK[2]) > 0)
				{	
					LuceneUtil2.smartSearch(repos, searchStr, parentPath, "content", getIndexLibName(repos.getId(),2), searchResult, 1, 2);	//Search By VDoc
				}
			}
		}
		
		return true;
	}
}
	