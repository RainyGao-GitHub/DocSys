package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;

import util.FileUtils2;
import util.GsonUtils;
import util.LuceneUtil2;
import util.ReadProperties;
import util.ReturnAjax;
import util.DocConvertUtil.Office2PDF;
import util.GitUtil.GITUtil;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
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
	@Autowired
	private ReposServiceImpl reposService;
	@Autowired
	private UserServiceImpl userService;
	
	/*******************************  Ajax Interfaces For Document Controller ************************/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(String name,String content,Integer type,Integer reposId,Integer parentId,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc name: " + name + " type: " + type+ " reposId: " + reposId + " parentId: " + parentId + " content: " + content);
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
		
		//检查用户是否有权限新增文件
		if(checkUserAddRight(rt,login_user.getId(),parentId,reposId) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		addDoc(name,content,type,null,0,"",reposId,parentId,null,null,null,commitMsg,commitUser,login_user,rt);
		writeJson(rt, response);
	}
	
	/****************   Feeback  ******************/
	@RequestMapping("/feeback.do")
	public void addDoc(String name,String content, HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		Integer parentId = getParentIdForFeeback();
		
		String commitMsg = "User Feeback by " + name;
		Integer docId = addDoc(name,content,1,null,0,"",reposId,parentId,null,null,null,commitMsg,commitUser,login_user,rt);
		
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");		

		writeJson(rt, response);
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

	private Integer getParentIdForFeeback() {
		String tempStr = null;
		tempStr = ReadProperties.read("docSysConfig.properties", "feebackParentId");
	    if(tempStr == null || "".equals(tempStr))
	    {
	    	return 0;
	    }

	    return(Integer.parseInt(tempStr));
 	}

	/****************   delete a Document ******************/
	@RequestMapping("/deleteDoc.do")
	public void deleteDoc(Integer id,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("deleteDoc id: " + id);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		//get doc
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在！");
			writeJson(rt, response);			
			return;			
		}
		
		//获取仓库信息
		Integer reposId = doc.getVid();
		Integer parentId = doc.getPid();
		//检查用户是否有权限新增文件
		if(checkUserDeleteRight(rt,login_user.getId(),parentId,reposId) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		deleteDoc(repos,id,parentId, commitMsg, commitUser, login_user, rt, false, false);
		
		writeJson(rt, response);
	}
	/****************   Check a Document ******************/
	@RequestMapping("/checkChunkUploaded.do")
	public void checkChunkUploaded(String name,Integer docId,  Integer size, String checkSum,Integer chunkIndex,Integer chunkNum,Integer cutSize,Integer chunkSize,String chunkHash,Integer reposId,Integer parentId,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("checkChunkUploaded name: " + name + " size: " + size + " checkSum: " + checkSum + " chunkIndex: " + chunkIndex + " chunkNum: " + chunkNum + " cutSize: " + cutSize+ " chunkSize: " + chunkSize+ " chunkHash: " + chunkHash+ " reposId: " + reposId + " parentId: " + parentId);
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		
		if("".equals(checkSum))
		{
			//CheckSum is empty, mean no need 
			writeJson(rt, response);
			return;
		}
		

		//判断tmp目录下是否有分片文件，并且checkSum和size是否相同 
		rt.setMsgData("0");
		String fileChunkName = name + "_" + chunkIndex;
		Repos repos = reposService.getRepos(reposId);
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		String chunkParentPath = userTmpDir;
		String chunkFilePath = chunkParentPath + fileChunkName;
		if(true == isChunkMatched(chunkFilePath,chunkHash))
		{
			rt.setMsgInfo("chunk: " + fileChunkName +" 已存在，且checkSum相同！");
			rt.setMsgData("1");
			
			System.out.println("checkChunkUploaded() " + fileChunkName + " 已存在，且checkSum相同！");
			if(chunkIndex == chunkNum -1)	//It is the last chunk
			{
				String commitUser = login_user.getName();
				if(-1 == docId)	//新建文件则新建记录，否则
				{
					docId = addDoc(name,null, 1, null,size, checkSum,reposId, parentId, chunkNum, cutSize, chunkParentPath,commitMsg, commitUser,login_user, rt);
				}
				else
				{
					updateDoc(docId, null, size,checkSum, reposId, parentId, chunkNum, cutSize, chunkParentPath, commitMsg, commitUser, login_user, rt);
				}
				
				if("ok".equals(rt.getStatus()))
				{	
					//Delete All Trunks if trunks have been combined
					deleteChunks(name,chunkIndex, chunkNum,chunkParentPath);
				}
				writeJson(rt, response);
				return;
			}
		}
		writeJson(rt, response);
	}
	/****************   Check a Document ******************/
	@RequestMapping("/checkDocInfo.do")
	public void checkDocInfo(String name,Integer type,Integer size,String checkSum,Integer reposId,Integer parentId,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("checkDocInfo name: " + name + " type: " + type + " size: " + size + " checkSum: " + checkSum+ " reposId: " + reposId + " parentId: " + parentId);
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查登录用户的权限
		DocAuth UserDocAuth = getUserDocAuth(login_user.getId(),parentId,reposId);
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
		
		if("".equals(checkSum))
		{
			//CheckSum is empty, mean no need 
			writeJson(rt, response);
			return;
		}
		
		//判断目录下是否有同名节点 
		Doc doc = getDocByName(name,parentId,reposId);
		if(doc != null)
		{
			rt.setData(doc);
			rt.setMsgInfo("Node: " + name +" 已存在！");
			rt.setMsgData("0");
			System.out.println("checkDocInfo() " + name + " 已存在");
	
			//检查checkSum是否相同
			if(type == 1)
			{
				if(true == isDocCheckSumMatched(doc,size,checkSum))
				{
					rt.setMsgInfo("Node: " + name +" 已存在，且checkSum相同！");
					rt.setMsgData("1");
					System.out.println("checkDocInfo() " + name + " 已存在，且checkSum相同！");
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
					copyDoc(sameDoc.getId(),sameDoc.getName(),name,sameDoc.getType(),reposId,sameDoc.getPid(),parentId,commitMsg,login_user.getName(),login_user,rt,false);
					Doc newDoc = getDocByName(name,parentId,reposId);
					if(null != newDoc)
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied ok！");
						rt.setData(newDoc);
						rt.setMsgInfo("SameDoc " + sameDoc.getName() +" found and do copy OK！");
						rt.setMsgData("1");
						writeJson(rt, response);
						return;
					}
					else
					{
						System.out.println("checkDocInfo() " + sameDoc.getName() + " was copied failed！");
						rt.setStatus("ok");
						rt.setMsgInfo("SameDoc " + sameDoc.getName() +" found but do copy Failed！");
						rt.setMsgData("3");
						writeJson(rt, response);
						return;
					}
				}
			}
		}
		
		writeJson(rt, response);
	}
	
	private Doc getSameDoc(Integer size, String checkSum, Integer reposId) {

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

	private boolean isDocCheckSumMatched(Doc doc,Integer size, String checkSum) {
		System.out.println("isDocCheckSumMatched() size:" + size + " checkSum:" + checkSum + " docSize:" + doc.getSize() + " docCheckSum:"+doc.getCheckSum());
		if(size.equals(doc.getSize()) && !"".equals(checkSum) && checkSum.equals(doc.getCheckSum()))
		{
			return true;
		}
		return false;
	}

	/****************   Upload a Document ******************/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(MultipartFile uploadFile,String name,Integer size, String checkSum, Integer reposId, Integer parentId, Integer docId, String filePath,
			Integer chunkIndex, Integer chunkNum, Integer cutSize, Integer chunkSize, String chunkHash,
			String commitMsg,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("uploadDoc name " + name + " size:" +size+ " checkSum:" + checkSum + " reposId:" + reposId + " parentId:" + parentId  + " docId:" + docId + " filePath:" + filePath 
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
		
		if(null == docId)
		{
			rt.setError("异常请求，docId是空！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限新增文件
		if(-1 == docId)
		{
			if(checkUserAddRight(rt,login_user.getId(),parentId,reposId) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		else
		{
			if(checkUserEditRight(rt,login_user.getId(),docId,reposId) == false)
			{
				writeJson(rt, response);	
				return;
			}
		}
		
		Repos repos = reposService.getRepos(reposId);

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

			if(-1 == docId)	//新建文件则新建记录，否则
			{
				docId = addDoc(name,null, 1, uploadFile,size, checkSum,reposId, parentId, chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt);
			}
			else
			{
				updateDoc(docId, uploadFile, size,checkSum, reposId, parentId, chunkNum, chunkSize, chunkParentPath,commitMsg, commitUser, login_user, rt);
			}
			
			if("ok".equals(rt.getStatus()))
			{				
				//Delete All Trunks if trunks have been combined
				deleteChunks(name,chunkIndex,chunkNum,chunkParentPath);
			}
			writeJson(rt, response);
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
		String parentPath = getParentPath(doc.getPid());
		String docVName = getDocVPath(parentPath, doc.getName());
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
	public void renameDoc(Integer id,String newname, String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("renameDoc id: " + id + " newname: " + newname);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		//get doc
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在！");
			writeJson(rt, response);			
			return;			
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		//开始更改名字了
		Integer reposId = doc.getVid();
		Integer parentId = doc.getPid();
		
		renameDoc(id,newname,reposId,parentId,commitMsg,commitUser,login_user,rt);
		writeJson(rt, response);	
	}
	

	
	/****************   move a Document ******************/
	@RequestMapping("/moveDoc.do")
	public void moveDoc(Integer id,Integer dstPid,Integer vid,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("moveDoc id: " + id + " dstPid: " + dstPid + " vid: " + vid);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);	
			return;			
		}
	
		//检查是否有源目录的删除权限
		if(checkUserDeleteRight(rt,login_user.getId(),doc.getPid(),vid) == false)
		{
			writeJson(rt, response);	
			return;
		}
	
		//检查用户是否有目标目录权限新增文件
		if(checkUserAddRight(rt,login_user.getId(),dstPid,vid) == false)
		{
				writeJson(rt, response);	
				return;
		}
		
		moveDoc(id,vid,doc.getPid(),dstPid,commitMsg,commitUser,login_user,rt);		
		writeJson(rt, response);	
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer id,Integer dstPid, String dstDocName, Integer vid,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("copyDoc id: " + id  + " dstPid: " + dstPid + " dstDocName: " + dstDocName + " vid: " + vid);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);	
			return;			
		}
	
		//检查用户是否有目标目录权限新增文件
		if(checkUserAddRight(rt,login_user.getId(),dstPid,vid) == false)
		{
			writeJson(rt, response);
			return;
		}
		
		String srcDocName = doc.getName();
		if(dstDocName == null || "".equals(dstDocName))
		{
			dstDocName = srcDocName;
		}
		
		copyDoc(id,srcDocName,dstDocName,doc.getType(),vid,doc.getPid(),dstPid,commitMsg,commitUser,login_user,rt,false);
		
		writeJson(rt, response);
	}

	/****************   update Document Content: This interface was triggered by save operation by user ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer id,String content,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("updateDocContent id: " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		String commitUser = login_user.getName();
		
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		updateDocContent(id, content, commitMsg, commitUser, login_user, rt);
		writeJson(rt, response);
	}

	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveDocContent.do")
	public void tmpSaveVirtualDocContent(Integer id,String content,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("tmpSaveVirtualDocContent() id: " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Repos repos = reposService.getRepos(doc.getVid());
		String parentPath = getParentPath(doc.getPid());
		String docVName = getDocVPath(parentPath,doc.getName());
		//Save the content to virtual file
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		if(saveVirtualDocContent(userTmpDir,docVName,content,rt) == false)
		{
			rt.setError("saveVirtualDocContent Error!");
		}
		writeJson(rt, response);
	}
	
	/**************** download Doc  ******************/
	@RequestMapping("/doGet.do")
	public void doGet(Integer id,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("doGet id: " + id);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = reposService.getDoc(id);
		if(doc==null){
			System.out.println("doGet() Doc " + id + " 不存在");
			rt.setError("doc " + id + "不存在！");
			writeJson(rt, response);
			return;
		}
		
		//得到要下载的文件名
		String file_name = doc.getName();
		
		//虚拟文件下载
		Repos repos = reposService.getRepos(doc.getVid());
		//虚拟文件系统下载，直接将数据库的文件内容传回去，未来需要优化
		if(isRealFS(repos.getType()) == false)
		{
			String content = doc.getContent();
			byte [] data = content.getBytes();
			sendDataToWebPage(file_name,data, response, request); 
			return;
		}
		
		//get reposRPath
		String reposRPath = getReposRealPath(repos);
				
		//get srcParentPath
		String srcParentPath = getParentPath(doc.getPid());	//doc的ParentPath

		//文件的localParentPath
		String localParentPath = reposRPath + srcParentPath;
		System.out.println("doGet() localParentPath:" + localParentPath);
		
		//get userTmpDir
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		sendTargetToWebPage(localParentPath,file_name, userTmpDir, rt, response, request);
	}
	
	@RequestMapping("/getVDocRes.do")
	public void getVDocRes(Integer docId,String fileName,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("getVDocRes docId:" + docId + " fileName: " + fileName);

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
		
		//Get the file
		Repos repos = reposService.getRepos(doc.getVid());
		String reposVPath = getReposVirtualPath(repos);
		String parentPath = getParentPath(doc.getPid());
		String docVName = getDocVPath(parentPath, doc.getName());
		String localVDocPath = reposVPath + docVName;
		String localParentPath = localVDocPath + "/res/";		
		System.out.println("getVDocRes() localParentPath:" + localParentPath);
		
		sendFileToWebPage(localParentPath,fileName, rt, response, request);
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
			
			entryName = getDocVPath(parentPath, docName);
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
	public void DocToPDF(Integer docId,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("DocToPDF docId: " + docId);

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);	
			return;			
		}
		
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(rt,login_user.getId(),docId,doc.getVid()) == false)
		{
			System.out.println("DocToPDF() you have no access right on doc:" + docId);
			writeJson(rt, response);	
			return;
		}
		
		if(doc.getType() == 2)
		{
			rt.setError("目录无法预览");
			writeJson(rt, response);
			return;
		}
		
		//虚拟文件下载
		Repos repos = reposService.getRepos(doc.getVid());
				
		//get reposRPath
		String reposRPath = getReposRealPath(repos);
				
		//get srcParentPath
		String srcParentPath = getParentPath(docId);	//文件或目录的相对路径
		//文件的真实全路径
		String srcPath = reposRPath + srcParentPath;
		srcPath = srcPath + doc.getName();			
		System.out.println("DocToPDF() srcPath:" + srcPath);
	
		String webTmpPath = getWebTmpPath();
		String dstName = doc.getCheckSum() + ".pdf";
		if(doc.getCheckSum() == null)
		{
			dstName = doc.getName();
		}
		String dstPath = webTmpPath + "preview/" + dstName;
		System.out.println("DocToPDF() dstPath:" + dstPath);
		File file = new File(dstPath);
		if(!file.exists())
		{
			if(srcPath.endsWith(".pdf"))
			{
				FileUtils2.copyFile(srcPath, dstPath);
			}
			else
			{
				String fileType = FileUtils2.getFileSuffix(srcPath);
				if(fileType != null && fileType == "pdf")
				{
					FileUtils2.copyFile(srcPath, dstPath);
				}
				else if(FileUtils2.isOfficeFile(fileType))
				{
					File pdf = Office2PDF.openOfficeToPDF(srcPath,dstPath);
					if(pdf == null)
					{
						rt.setError("Failed to convert office to pdf");
						rt.setMsgData("srcPath:"+srcPath);
						writeJson(rt, response);
						return;
					}
				}
				else
				{
					rt.setError("该文件类型不支持预览");
					rt.setMsgData("srcPath:"+srcPath);
					writeJson(rt, response);
					return;
				}
			}
		}
		//Save the pdf to web
		String fileLink = "/DocSystem/tmp/preview/" + dstName;
		rt.setData(fileLink);
		writeJson(rt, response);
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
	public void getDoc(Integer id,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDoc id: " + id);
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Doc doc = reposService.getDoc(id);
		if(doc == null)
		{
			rt.setError("文件不存在");
			writeJson(rt, response);	
			return;			
		}
		
		//Set currentDocId to session which will be used MarkDown ImgUpload
		session.setAttribute("currentDocId", id);
		System.out.println("getDoc currentDocId:" + id);
	
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
			System.out.println("getDoc() you have no access right on doc:" + id);
			writeJson(rt, response);	
			return;
		}
		
		String content = doc.getContent();
        if( null !=content){
        	content = content.replaceAll("\t","");
        }
		doc.setContent(JSONObject.toJSONString(content));
		
		//System.out.println(rt.getData());
		rt.setData(doc);
		writeJson(rt, response);
	}

	/****************   lock a Doc ******************/
	@RequestMapping("/lockDoc.do")  //lock Doc主要用于用户锁定doc
	public void lockDoc(Integer docId,Integer reposId, Integer lockType, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("lockDoc docId: " + docId + " reposId: " + reposId + " lockType: " + lockType);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限新增文件
		if(checkUserEditRight(rt,login_user.getId(),docId,reposId) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Doc doc = null;
		synchronized(syncLock)
		{
			boolean subDocCheckFlag = false;
			if(lockType == 2)	//If want to force lock, must check all subDocs not locked
			{
				subDocCheckFlag = true;
			}
			
			//Try to lock the Doc
			doc = lockDoc(docId,lockType,login_user,rt,subDocCheckFlag);
			if(doc == null)
			{
				unlock(); //线程锁
				System.out.println("lockDoc() Failed to lock Doc: " + docId);
				writeJson(rt, response);
				return;			
			}
			unlock(); //线程锁
		}
		
		System.out.println("lockDoc docId: " + docId + " success");
		rt.setData(doc);
		writeJson(rt, response);	
	}
	
	/****************   get Document History (logList) ******************/
	@RequestMapping("/getDocHistory.do")
	public void getDocHistory(Integer reposId,String parentPath, String docName, Integer historyType,Integer maxLogNum, HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDocHistory reposId:" + reposId + " docPath:" + parentPath+docName +" historyType:" + historyType);
		
		ReturnAjax rt = new ReturnAjax();
		
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
				entryPath = getDocVPath(parentPath, docName);
			}
		}
		
		List<LogEntry> logList = verReposGetHistory(repos, isRealDoc, entryPath, num);
		rt.setData(logList);
		writeJson(rt, response);
	}
	
	/* 文件搜索与排序  */
	@RequestMapping("/searchDoc.do")
	public void searchDoc(HttpServletResponse response,HttpSession session,String searchWord,String sort,Integer reposId,Integer pDocId){
		System.out.println("searchDoc searchWord: " + searchWord + " sort:" + sort);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
			
		}else{
			HashMap<String, Object> params = new HashMap<String, Object>();
			params.put("reposId", reposId);	//reposId为空则search所有仓库下的文件
			params.put("pDocId", pDocId);	//pDocId为空则search仓库下所有文件
					
			if(sort!=null&&sort.length()>0)
			{
				List<Map<String, Object>> sortList = GsonUtils.getMapList(sort);
				params.put("sortList", sortList);
			}
			
			//使用Lucene进行全文搜索，结果存入param以便后续进行数据库查询
			if(searchWord!=null&&!"".equals(searchWord)){
				try {
					params.put("name", searchWord);
					List<String> idList = LuceneUtil2.fuzzySearch(searchWord, "doc");
		        	for(int i=0; i < idList.size(); i++)
		        	{
		        		System.out.println(idList.get(i));
		        	}
		        	
					List<String> ids = new ArrayList<String>();
					for(String s:idList){
						String[] tmp = s.split(":");
						ids.add(tmp[0]);
					}
					params.put("ids", ids.toString().replace("[", "").replace("]", ""));
					System.out.println(idList.toString());
				} catch (Exception e) {
					System.out.println("LuceneUtil2.search 异常");
					e.printStackTrace();
				}
			}else{
				params.put("name", "");
			}
			
			//根据params参数查询docList
			List<Doc> list = reposService.queryDocList(params);
			rt.setData(list);
		}
		writeJson(rt, response);
	}
}
	