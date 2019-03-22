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
	//线程锁
	private static final Object syncLock = new Object(); 
	
	/*******************************  Ajax Interfaces For Document Controller ************************/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(String name,String content,Integer type,Integer reposId,Integer parentId,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc name: " + name + " type: " + type+ " reposId: " + reposId + " parentId: " + parentId + " content: " + content);
		//System.out.println(Charset.defaultCharset());
		//System.out.println("黄谦");
		
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
		
		if(commitMsg == null)
		{
			commitMsg = "addDoc " + name;
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
		
		if(commitMsg == null)
		{
			commitMsg = "deleteDoc " + doc.getName();
		}
		
		deleteDoc(id,reposId, parentId, commitMsg, commitUser, login_user, rt,false);
		
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
				if(commitMsg == null)
				{
					commitMsg = "uploadDoc " + name;
				}
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
	
	private String combineChunks(String targetParentPath,String fileName, Integer chunkNum,Integer cutSize, String chunkParentPath) {
		try {
			String targetFilePath = targetParentPath + fileName;
			FileOutputStream out;

			out = new FileOutputStream(targetFilePath);
	        FileChannel outputChannel = out.getChannel();   

        	long offset = 0;
	        for(int chunkIndex = 0; chunkIndex < chunkNum; chunkIndex ++)
	        {
	        	String chunkFilePath = chunkParentPath + fileName + "_" + chunkIndex;
	        	FileInputStream in=new FileInputStream(chunkFilePath);
	            FileChannel inputChannel = in.getChannel();    
	            outputChannel.transferFrom(inputChannel, offset, inputChannel.size());
	        	offset += inputChannel.size();	        			
	    	   	inputChannel.close();
	    	   	in.close();
	    	}
	        outputChannel.close();
		    out.close();
		    return fileName;
		} catch (Exception e) {
			System.out.println("combineChunks() Failed to combine the chunks");
			e.printStackTrace();
			return null;
		}        
	}
	
	private void deleteChunks(String name, Integer chunkIndex, Integer chunkNum, String chunkParentPath) {
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		
		if(null == chunkIndex || chunkIndex < (chunkNum-1))
		{
			return;
		}
		
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		try {
	        for(int i = 0; i < chunkNum; i ++)
	        {
	        	String chunkFilePath = chunkParentPath + name + "_" + i;
	        	delFile(chunkFilePath);
	    	}
		} catch (Exception e) {
			System.out.println("deleteChunks() Failed to combine the chunks");
			e.printStackTrace();
		}  
	}

	private boolean isChunkMatched(String chunkFilePath, String chunkHash) {
		//检查文件是否存在
		File f = new File(chunkFilePath);
		if(!f.exists()){
			return false;
		}

		//Check if chunkHash is same
		try {
			FileInputStream file = new FileInputStream(chunkFilePath);
			String hash=DigestUtils.md5Hex(file);
			file.close();
			if(hash.equals(chunkHash))
			{
				return true;
			}
		} catch (Exception e) {
			System.out.println("isChunkMatched() Exception"); 
			e.printStackTrace();
			return false;
		}

		return false;
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
			String fileName = name;
			String chunkParentPath = getReposUserTmpPath(repos,login_user);
			if(commitMsg == null)
			{
				commitMsg = "uploadDoc " + fileName;
			}
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

	//Add Index For VDoc
	private void addIndexForVDoc(Integer docId, String content) {
		if(content == null || "".equals(content))
		{
			return;
		}
		
		try {
			System.out.println("addIndexForVDoc() add index in lucne: docId " + docId + " content:" + content);
			//Add Index For Content
			LuceneUtil2.addIndex(docId + "-0", docId,content, "doc");
		} catch (Exception e) {
			System.out.println("addIndexForVDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void updateIndexForVDoc(Integer id, String content) {
		try {
			System.out.println("updateIndexForVDoc() updateIndexForVDoc in lucene: docId " + id);
			LuceneUtil2.updateIndexForVDoc(id,content,"doc");
		} catch (Exception e) {
			System.out.println("updateIndexForVDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void updateIndexForRDoc(Integer docId, String localDocRPath) {
		//Add the doc to lucene Index
		try {
			System.out.println("updateIndexForRDoc() add index in lucne: docId " + docId);
			//Add Index For File
			LuceneUtil2.updateIndexForRDoc(docId,localDocRPath, "doc");
		} catch (Exception e) {
			System.out.println("updateIndexForRDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void deleteIndexForDoc(Integer docId, String string) {
		try {
			System.out.println("DeleteDoc() delete index in lucne: docId " + docId);
			LuceneUtil2.deleteIndexForDoc(docId,"doc");
		} catch (Exception e) {
			System.out.println("DeleteDoc() Failed to delete lucene Index");
			e.printStackTrace();
		}
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
		String docVName = getDocVPath(doc);
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
		
		if(commitMsg == null)
		{
			commitMsg = "renameDoc " + doc.getName();
		}
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
		
		//开始移动了
		if(commitMsg == null)
		{
			commitMsg = "moveDoc " + doc.getName();
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
		
		if(commitMsg == null)
		{
			commitMsg = "copyDoc " + doc.getName() + " to " + dstDocName;
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
		
		if(commitMsg == null)
		{
			commitMsg = "updateDocContent " + doc.getName();
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
		String docVName = getDocVPath(doc);
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
		String docVName = getDocVPath(doc);
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
	public void getHistoryDoc(String commitId,Integer reposId, Integer isRealDoc,String parentPath, String docName, HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("getHistoryDoc commitId: " + commitId + " reposId:" + reposId + " isRealDoc:" + isRealDoc +" parentPath:" + parentPath + " docName:" + docName);

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
		
		//userTmpDir will be used to tmp store the history doc 
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		
		String targetName = docName + "_" + commitId;
		//If the docName is "" means we are checking out the root dir of repos, so we take the reposName as the targetName
		if("".equals(docName))
		{
			targetName = repos.getName() + "_" + commitId;
		}
		
		//checkout the entry to local
		if(verReposCheckOut(repos, true, parentPath, docName, userTmpDir, targetName, commitId) == false)
		{
			System.out.println("getHistoryDoc() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed parentPath:" + parentPath + " docName:" + docName + " userTmpDir:" + userTmpDir + " targetName:" + targetName);
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
	public void getDocHistory(Integer reposId,String docPath, Integer maxLogNum, HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDocHistory docPath: " + docPath + " reposId:" + reposId);
		
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
		List<LogEntry> logList = verReposGetHistory(repos,docPath, num);
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

	/********************************** Functions For Application Layer
	 * @param content 
	 * @param commitUser2 
	 * @param chunkSize 
	 * @param chunkNum ****************************************/
	//底层addDoc接口
	private Integer addDoc(String name, String content, Integer type, MultipartFile uploadFile, Integer fileSize, String checkSum,Integer reposId,Integer parentId, 
			Integer chunkNum, Integer chunkSize, String chunkParentPath, String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		Repos repos = reposService.getRepos(reposId);
		//get parentPath
		String parentPath = getParentPath(parentId);
		String reposRPath = getReposRealPath(repos);
		String localDocRPath = reposRPath + parentPath + name;
		
		//判断目录下是否有同名节点 
		Doc tempDoc = getDocByName(name,parentId,reposId);
		if(tempDoc != null)
		{
			if(type == 2)	//如果是则目录直接成功
			{
				rt.setMsg("Node: " + name +" 已存在！", "dirExists");
				rt.setData(tempDoc);
			}
			else
			{
				rt.setError("Node: " + name +" 已存在！");
				System.out.println("addDoc() " + name + " 已存在");
			}
			return null;		
		}
		
		//以下代码不可重入，使用syncLock进行同步
		Doc doc = new Doc();
		synchronized(syncLock)
		{
			//Check if parentDoc was absolutely locked (LockState == 2)
			if(isParentDocLocked(parentId,null,rt))
			{	
				unlock(); //线程锁
				rt.setError("ParentNode: " + parentId +" is locked！");	
				System.out.println("ParentNode: " + parentId +" is locked！");
				return null;			
			}
				
			//新建doc记录,并锁定
			doc.setName(name);
			doc.setType(type);
			doc.setSize(fileSize);
			doc.setCheckSum(checkSum);
			doc.setContent(content);
			doc.setPath(parentPath);
			doc.setVid(reposId);
			doc.setPid(parentId);
			doc.setCreator(login_user.getId());
			//set createTime
			long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
			doc.setCreateTime(nowTimeStamp);
			doc.setLatestEditTime(nowTimeStamp);
			doc.setLatestEditor(login_user.getId());
			doc.setState(2);	//doc的状态为不可用
			doc.setLockBy(login_user.getId());	//LockBy login_user, it was used with state
			long lockTime = nowTimeStamp + 24*60*60*1000;
			doc.setLockTime(lockTime);	//Set lockTime
			if(reposService.addDoc(doc) == 0)
			{			
				unlock();
				rt.setError("Add Node: " + name +" Failed！");
				System.out.println("addDoc() addDoc to db failed");
				return null;
			}
			unlock();
		}
		
		System.out.println("id: " + doc.getId());
		
		if(uploadFile == null)
		{
			if(createRealDoc(reposRPath,parentPath,name,type, rt) == false)
			{		
				String MsgInfo = "createRealDoc " + name +" Failed";
				rt.setError(MsgInfo);
				System.out.println("createRealDoc Failed");
				//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
				if(reposService.deleteDoc(doc.getId()) == 0)	
				{
					MsgInfo += " and delete Node Failed";
					System.out.println("Delete Node: " + doc.getId() +" failed!");
					rt.setError(MsgInfo);
				}
				return null;
			}
		}
		else
		{
			if(updateRealDoc(reposRPath,parentPath,name,doc.getType(),fileSize,checkSum,uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
			{		
				String MsgInfo = "updateRealDoc " + name +" Failed";
				rt.setError(MsgInfo);
				System.out.println("updateRealDoc Failed");
				//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
				if(reposService.deleteDoc(doc.getId()) == 0)	
				{
					MsgInfo += " and delete Node Failed";
					System.out.println("Delete Node: " + doc.getId() +" failed!");
					rt.setError(MsgInfo);
				}
				return null;
			}
		}
		//commit to history db
		if(verReposRealDocAdd(repos,parentPath,name,type,commitMsg,commitUser,rt) == false)
		{
			System.out.println("verReposRealDocAdd Failed");
			String MsgInfo = "verReposRealDocAdd Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(delFile(localDocRPath) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(doc.getId()) == 0)
			{
				MsgInfo += " and delete Node Failed";						
			}
			rt.setError(MsgInfo);
			return null;
		}
		
		Integer docId = doc.getId();
		if(type == 1)
		{
			//Update Lucene Index
			updateIndexForRDoc(docId, localDocRPath);
		}
		
		//只有在content非空的时候才创建VDOC
		if(null != content && !"".equals(content))
		{
			String reposVPath = getReposVirtualPath(repos);
			String docVName = getDocVPath(doc);
			if(createVirtualDoc(reposVPath,docVName,content,rt) == true)
			{
				if(verReposVirtualDocAdd(repos, docVName, commitMsg, commitUser,rt) ==false)
				{
					System.out.println("addDoc() svnVirtualDocAdd Failed " + docVName);
					rt.setMsgInfo("svnVirtualDocAdd Failed");			
				}
			}
			else
			{
				System.out.println("addDoc() createVirtualDoc Failed " + reposVPath + docVName);
				rt.setMsgInfo("createVirtualDoc Failed");
			}
			//Add Lucene Index For Vdoc
			addIndexForVDoc(docId,content);
		}
		
		//启用doc
		if(unlockDoc(docId,login_user,null) == false)
		{
			rt.setError("unlockDoc Failed");
			return null;
		}
		rt.setMsg("新增成功", "isNewNode");
		rt.setData(doc);
		
		return docId;
	}
	
	//释放线程锁
	private void unlock() {
		unlockSyncLock(syncLock);
	}	
	private void unlockSyncLock(Object syncLock) {
		syncLock.notifyAll();//唤醒等待线程
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，我勒了个区去，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}  

	//底层deleteDoc接口
	//isSubDelete: true: 文件已删除，只负责删除VDOC、LuceneIndex、previewFile、DBRecord
	private boolean deleteDoc(Integer docId, Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,boolean isSubDelete) 
	{
		Doc doc = null;
		Repos repos = null;
		if(isSubDelete)	//Do not lock
		{
			doc = reposService.getDoc(docId);
			if(doc == null)
			{
				System.out.println("deleteDoc() " + docId + " not exists");
				return false;			
			}
			repos = reposService.getRepos(reposId);
			System.out.println("deleteDoc() " + docId + " " + doc.getName() + " isSubDelete");
		}
		else
		{
			synchronized(syncLock)
			{							
				//Try to lock the Doc
				doc = lockDoc(docId,2,login_user,rt,true);
				if(doc == null)
				{
					unlock(); //线程锁
					System.out.println("deleteDoc() Failed to lock Doc: " + docId);
					return false;			
				}
				unlock(); //线程锁
			}
			System.out.println("deleteDoc() " + docId + " " + doc.getName() + " Lock OK");
			
			repos = reposService.getRepos(reposId);
			//get parentPath
			String parentPath = getParentPath(parentId);		
			//get RealDoc Full ParentPath
			String reposRPath = getReposRealPath(repos);
			
			//删除实体文件
			String name = doc.getName();
			
			String nameForDelete = "deleteing-"+name; 
			if(moveRealDoc(reposRPath,parentPath,name,parentPath,nameForDelete,doc.getType(),rt) == false)
			{
				String MsgInfo = "moveRealDoc For delete Failed";
				rt.setError(parentPath + name + "删除失败！");
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return false;
			}
				
			//需要将文件Commit到SVN上去
			if(verReposRealDocDelete(repos,parentPath,name,doc.getType(),commitMsg,commitUser,rt) == false)
			{
				System.out.println("verReposRealDocDelete Failed");
				String MsgInfo = "verReposRealDocDelete Failed";
				//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
				if(moveRealDoc(reposRPath,parentPath,nameForDelete,parentPath,name,doc.getType(),rt) == false)
				{						
					MsgInfo += " and revertFile Failed";
				}
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return false;
			}
			
			//Do delete really
			if(deleteRealDoc(reposRPath, parentPath, nameForDelete,doc.getType(),rt) == false)
			{
				System.out.println("deleteDoc() 删除 " + nameForDelete +" 失败");	
			}
		}
		
		//Delete Lucene index For RDoc and VDoc
		deleteIndexForDoc(docId,"doc");
		//Delete previewFile (previewFile use checksum as name)
		deletePreviewFile(doc.getCheckSum());
		
		//删除虚拟文件
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getDocVPath(doc);
		String localDocVPath = reposVPath + docVName;
		if(deleteVirtualDoc(reposVPath,docVName,rt) == false)
		{
			System.out.println("deleteDoc() delDir Failed " + localDocVPath);
			rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
		}
		else
		{
			if(verReposVirtualDocDelete(repos,docVName,commitMsg,commitUser,rt) == false)
			{
				System.out.println("deleteDoc() delDir Failed " + localDocVPath);
				rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
				verReposRevertVirtualDoc(repos,docVName);
			}
		}

		//Delete SubDocs
		if(false == deleteSubDocs(docId,reposId,commitMsg,commitUser,login_user,rt))
		{
			System.out.println("deleteDoc() deleteSubDocs Failed ");
		}
						
		//Delete DataBase Record
		if(reposService.deleteDoc(docId) == 0)
		{	
			rt.setError("不可恢复系统错误：deleteDoc Failed");
			return false;
		}
		rt.setData(doc);
		return true;
	}

	//删除预览文件
	private void deletePreviewFile(String checkSum) {
		String dstName = checkSum + ".pdf";
		String dstPath = getWebTmpPath() + "preview/" + dstName;
		delFileOrDir(dstPath);
	}

	private boolean deleteSubDocs(Integer docId, Integer reposId,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		
		Doc doc = new Doc();
		doc.setPid(docId);
		List<Doc> subDocList = reposService.getDocList(doc);
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			deleteDoc(subDoc.getId(),reposId,docId,commitMsg,commitUser,login_user,rt,true);
		}
		return true;
	}

	//底层updateDoc接口
	private void updateDoc(Integer docId, MultipartFile uploadFile,Integer fileSize,String checkSum,Integer reposId,Integer parentId, 
			Integer chunkNum, Integer chunkSize, String chunkParentPath, String commitMsg,String commitUser,User login_user, ReturnAjax rt) {

		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lock the doc
			doc = lockDoc(docId, 1, login_user, rt,false);
			if(doc == null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDoc() lockDoc " + docId +" Failed！");
				return;
			}
			unlock(); //线程锁
			
		}
		
		//Save oldCheckSum
		String oldCheckSum = doc.getCheckSum();
		
		//为了避免执行到SVNcommit成功但数据库操作失败，所以先将checkSum更新掉
		doc.setCheckSum(checkSum);
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("系统异常：操作数据库失败");
			rt.setMsgData("updateDoc() update Doc CheckSum Failed");
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		//get RealDoc Full ParentPath
		String reposRPath =  getReposRealPath(repos);
		//get parentPath
		String parentPath = getParentPath(parentId);		
		//Get the file name
		String name = doc.getName();
		System.out.println("updateDoc() name:" + name);

		//保存文件信息
		if(updateRealDoc(reposRPath,parentPath,name,doc.getType(),fileSize,checkSum,uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			if(unlockDoc(docId,login_user,doc) == false)
			{
				System.out.println("updateDoc() saveFile " + docId +" Failed and unlockDoc Failed");
				rt.setError("Failed to updateRealDoc " + name + " and unlock Doc");
			}
			else
			{	
				System.out.println("updateDoc() saveFile " + docId +" Failed, unlockDoc Ok");
				rt.setError("Failed to updateRealDoc " + name + ", unlockDoc Ok");
			}
			return;
		}
		
		//需要将文件Commit到版本仓库上去
		if(verReposRealDocCommit(repos,parentPath,name,doc.getType(),commitMsg,commitUser,rt) == false)
		{
			System.out.println("updateDoc() verReposRealDocCommit Failed:" + parentPath + name);
			String MsgInfo = "verReposRealDocCommit Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(verReposRevertRealDoc(repos,parentPath,name,doc.getType(),rt) == false)
			{						
				MsgInfo += " and revertFile Failed";
			}
			//还原doc记录的状态
			if(unlockDoc(docId,login_user,doc) == false)
			{
				MsgInfo += " and unlockDoc Failed";						
			}
			rt.setError(MsgInfo);	
			return;
		}
		
		//Update Lucene Index
		String localDocRPath = reposRPath + parentPath + name;
		updateIndexForRDoc(docId, localDocRPath);
		
		//Delete PreviewFile
		deletePreviewFile(oldCheckSum);
		
		//updateDoc Info and unlock
		doc.setSize(fileSize);
		doc.setCheckSum(checkSum);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		doc.setLatestEditTime(nowTimeStamp);
		doc.setLatestEditor(login_user.getId());
		
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("不可恢复系统错误：updateAndunlockDoc Failed");
			return;
		}

	}

	//底层renameDoc接口
	private void renameDoc(Integer docId, String newname,Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lockDoc
			doc = lockDoc(docId,2,login_user,rt,true);
			if(doc == null)
			{
				unlock(); //线程锁
				
				System.out.println("renameDoc() lockDoc " + docId +" Failed！");
				return;
			}
			unlock(); //线程锁
		}
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath = getReposRealPath(repos);
		String parentPath = getParentPath(parentId);
		String oldname = doc.getName();
		
		//修改实文件名字	
		if(moveRealDoc(reposRPath,parentPath,oldname,parentPath,newname,doc.getType(),rt) == false)
		{
			if(unlockDoc(docId,login_user,doc) == false)
			{
				rt.setError(oldname + " renameRealDoc失败！ and unlockDoc " + docId +" Failed！");
				return;
			}
			else
			{
				rt.setError(oldname + " renameRealDoc失败！");
				return;
			}
		}
		else
		{
			//commit to history db
			if(verReposRealDocMove(repos,parentPath,oldname,parentPath,newname,doc.getType(),commitMsg,commitUser,rt) == false)
			{
				//我们假定版本提交总是会成功，因此报错不处理
				System.out.println("renameDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				
				if(moveRealDoc(reposRPath,parentPath,newname,parentPath,oldname,doc.getType(),rt) == false)
				{
					MsgInfo += " and moveRealDoc Back Failed";
				}
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return;
			}	
		}
		
		//更新doc name
		Doc tempDoc = new Doc();
		tempDoc.setId(docId);
		tempDoc.setName(newname);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		tempDoc.setLatestEditTime(nowTimeStamp);
		tempDoc.setLatestEditor(login_user.getId());
		if(reposService.updateDoc(tempDoc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc name");
			return;
		}
		
		//unlock doc
		if(unlockDoc(docId,login_user,doc) == false)
		{
			rt.setError("unlockDoc failed");	
		}
		return;
	}
	
	//底层moveDoc接口
	private void moveDoc(Integer docId, Integer reposId,Integer parentId,Integer dstPid,  
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {

		Doc doc = null;
		Doc dstPDoc = null;
		synchronized(syncLock)
		{
			doc = lockDoc(docId,2,login_user,rt,true);
			if(doc == null)
			{
				unlock(); //线程锁
	
				System.out.println("lockDoc " + docId +" Failed！");
				return;
			}
			
			//Try to lock dstPid
			if(dstPid !=0)
			{
				dstPDoc = lockDoc(dstPid,2,login_user,rt,false);
				if(dstPDoc== null)
				{
					unlock(); //线程锁
	
					System.out.println("moveDoc() fail to lock dstPid" + dstPid);
					unlockDoc(docId,login_user,doc);	//Try to unlock the doc
					return;
				}
			}
			unlock(); //线程锁
		}
		
		//移动当前节点
		Integer orgPid = doc.getPid();
		System.out.println("moveDoc id:" + docId + " orgPid: " + orgPid + " dstPid: " + dstPid);
		
		String srcParentPath = getParentPath(orgPid);		
		String dstParentPath = getParentPath(dstPid);
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath = getReposRealPath(repos);
		
		String filename = doc.getName();
		String srcDocRPath = srcParentPath + filename;
		String dstDocRPath = dstParentPath + filename;
		System.out.println("srcDocRPath: " + srcDocRPath + " dstDocRPath: " + dstDocRPath);
		
		//只有当orgPid != dstPid 不同时才进行文件移动，否则文件已在正确位置，只需要更新Doc记录
		if(!orgPid.equals(dstPid))
		{
			System.out.println("moveDoc() docId:" + docId + " orgPid: " + orgPid + " dstPid: " + dstPid);
			if(moveRealDoc(reposRPath,srcParentPath,filename,dstParentPath,filename,doc.getType(),rt) == false)
			{
				String MsgInfo = "文件移动失败！";
				System.out.println("moveDoc() 文件: " + filename + " 移动失败");
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc " + docId+ " failed ";
				}
				if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
				{
					MsgInfo += " and unlockDoc " + dstPid+ " failed ";
				}
				rt.setError(MsgInfo);
				return;
			}
			
			//需要将文件Commit到SVN上去：先执行svn的移动
			if(verReposRealDocMove(repos, srcParentPath,filename, dstParentPath, filename,doc.getType(),commitMsg, commitUser,rt) == false)
			{
				System.out.println("moveDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				if(moveRealDoc(reposRPath,dstParentPath,filename,srcParentPath,filename,doc.getType(),rt) == false)
				{
					MsgInfo += "and changeDirectory Failed";
				}
				
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc " + docId+ " failed ";
				}
				if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
				{
					MsgInfo += " and unlockDoc " + dstPid+ " failed ";
				}
				rt.setError(MsgInfo);
				return;					
			}
		}
		
		//更新doc pid and path
		Doc tempDoc = new Doc();
		tempDoc.setId(docId);
		tempDoc.setPath(dstParentPath);
		tempDoc.setPid(dstPid);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		tempDoc.setLatestEditTime(nowTimeStamp);
		tempDoc.setLatestEditor(login_user.getId());
		if(reposService.updateDoc(tempDoc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc pid and path");
			return;				
		}
		
		//Unlock Docs
		String MsgInfo = null; 
		if(unlockDoc(docId,login_user,doc) == false)
		{
			MsgInfo = "unlockDoc " + docId+ " failed ";
		}
		if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
		{
			MsgInfo += " and unlockDoc " + dstPid+ " failed ";
		}
		if(MsgInfo!=null)
		{
			rt.setError(MsgInfo);
		}
		return;
	}
	
	//底层copyDoc接口
	//isSubCopy: true no need to do lock check and lock
	private boolean copyDoc(Integer docId,String srcName,String dstName, Integer type, Integer reposId,Integer parentId, Integer dstPid,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, boolean isSubCopy) {
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath =  getReposRealPath(repos);

		//get parentPath
		String parentPath = getParentPath(parentId);		
		//目标路径
		String dstParentPath = getParentPath(dstPid);

		if(isSubCopy)
		{
			System.out.println("copyDoc() copy " +docId+ " " + srcName + " to " + dstName + " isSubCopy");
		}
		else
		{
			System.out.println("copyDoc() copy " +docId+ " " + srcName + " to " + dstName);
			
			//判断节点是否已存在
			if(isNodeExist(dstName,dstPid,reposId) == true)
			{
				rt.setError("Node: " + dstName +" 已存在！");
				return false;
			}
		}

		Doc srcDoc = null;
		Doc dstDoc = null;
		synchronized(syncLock)
		{
			if(isSubCopy)
			{
				srcDoc = reposService.getDoc(docId);
			}
			else
			{
				//Try to lock the srcDoc
				srcDoc = lockDoc(docId,1,login_user,rt,true);
				if(srcDoc == null)
				{
					unlock(); //线程锁
		
					System.out.println("copyDoc lock " + docId + " Failed");
					return false;
				}
			}
			
			//新建doc记录，并锁定（if isSubCopy is false）
			dstDoc = new Doc();
			dstDoc.setId(null);	//置空id,以便新建一个doc
			dstDoc.setName(dstName);
			dstDoc.setType(type);
			dstDoc.setContent(srcDoc.getContent());
			dstDoc.setPath(dstParentPath);
			dstDoc.setVid(reposId);
			dstDoc.setPid(dstPid);
			dstDoc.setCreator(login_user.getId());
			//set createTime
			long nowTimeStamp = new Date().getTime(); //当前时间的时间戳
			dstDoc.setCreateTime(nowTimeStamp);
			//set lastEditTime
			dstDoc.setLatestEditTime(nowTimeStamp);
			dstDoc.setLatestEditor(login_user.getId());
			if(false == isSubCopy)
			{
				dstDoc.setState(2);	//doc的状态为不可用
				dstDoc.setLockBy(login_user.getId());	//set LockBy
				long lockTime = nowTimeStamp + 24*60*60*1000;
				dstDoc.setLockTime(lockTime);	//Set lockTime
			}
			else
			{
				dstDoc.setState(0);	//doc的状态为不可用
				dstDoc.setLockBy(0);	//set LockBy
				dstDoc.setLockTime((long)0);	//Set lockTime				
			}
			
			if(reposService.addDoc(dstDoc) == 0)
			{
				unlock(); //线程锁
	
				rt.setError("Add Node: " + dstName +" Failed！");
				
				//unlock SrcDoc
				unlockDoc(docId,login_user,srcDoc);
				return false;
			}
			unlock(); //线程锁
		}
		
		Integer dstDocId =  dstDoc.getId();
		System.out.println("dstDoc id: " + dstDoc.getId());
		
		//复制文件或目录，注意这个接口只会复制单个文件
		if(copyRealDoc(reposRPath,parentPath,srcName,dstParentPath,dstName,type,rt) == false)
		{
			System.out.println("copy " + srcName + " to " + dstName + " 失败");
			String MsgInfo = "copyRealDoc from " + srcName + " to " + dstName + "Failed";
			//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
			if(reposService.deleteDoc(dstDocId) == 0)	
			{
				System.out.println("Delete Node: " + dstDocId +" failed!");
				MsgInfo += " and delete dstDoc " + dstDocId + "Failed";
			}
			if(unlockDoc(docId,login_user,srcDoc) == false)
			{
				System.out.println("unlock srcDoc: " + docId +" failed!");
				MsgInfo += " and unlock srcDoc " + docId +" Failed";	
			}
			rt.setError(MsgInfo);
			return false;
		}
			
		//需要将文件Commit到SVN上去
		boolean ret = false;
		String MsgInfo = "";
		if(type == 1) 
		{
			ret = verReposRealDocCopy(repos,parentPath,srcName,dstParentPath,dstName,type,commitMsg, commitUser,rt);
			MsgInfo = "verReposRealDocCopy Failed";
		}
		else //目录则在版本仓库新建，因为复制操作每次只复制一个节点，直接调用copy会导致目录下的所有节点都被复制
		{
			ret = verReposRealDocAdd(repos,dstParentPath,dstName,type,commitMsg,commitUser,rt);
			MsgInfo = "verReposRealDocAdd Failed";
		}			
			
		if(ret == false)
		{
			System.out.println("copyDoc() " + MsgInfo);
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(deleteRealDoc(reposRPath,parentPath,dstName,type,rt) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(dstDocId) == 0)
			{
				MsgInfo += " and delete dstDoc " + dstDocId + " Failed";						
			}
			if(unlockDoc(docId,login_user,srcDoc) == false)
			{
				MsgInfo += " and unlock srcDoc " + docId +" Failed";	
			}
			rt.setError(MsgInfo);
			return false;
		}				
		
		if(type == 1)
		{
			//Update Lucene Index
			String localDocRPath = reposRPath + dstParentPath + dstName;
			updateIndexForRDoc(dstDocId,localDocRPath);
		}
		
		//content非空时才去创建虚拟文件目录
		if(null != dstDoc.getContent() && !"".equals(dstDoc.getContent()))
		{
			String reposVPath = getReposVirtualPath(repos);
			String srcDocVName = getDocVPath(srcDoc);
			String dstDocVName = getDocVPath(dstDoc);
			if(copyVirtualDoc(reposVPath,srcDocVName,dstDocVName,rt) == true)
			{
				if(verReposVirtualDocCopy(repos,srcDocVName,dstDocVName, commitMsg, commitUser,rt) == false)
				{
					System.out.println("copyDoc() svnVirtualDocCopy " + srcDocVName + " to " + dstDocVName + " Failed");							
				}
			}
			else
			{
				System.out.println("copyDoc() copyVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");						
			}
			addIndexForVDoc(dstDocId,dstDoc.getContent());
		}
				
		//copySubDocs
		copySubDocs(docId, reposId, dstDocId,commitMsg,commitUser,login_user,rt); 
		
		if(false == isSubCopy)
		{
			//启用doc
			MsgInfo = null;
			if(unlockDoc(dstDoc.getId(),login_user,null) == false)
			{	
				MsgInfo ="unlockDoc " +dstDoc.getId() + " Failed";;
			}
			//Unlock srcDoc 
			if(unlockDoc(docId,login_user,null) == false)
			{
				MsgInfo += " and unlock " + docId +" Failed";	
			}
			if(MsgInfo != null)
			{
				rt.setError(MsgInfo);
			}
	
			//只返回最上层的doc记录
			rt.setData(dstDoc);				
		}	
		return true;
	}

	private boolean copySubDocs(Integer docId, Integer reposId, Integer dstParentId,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		boolean ret = true;
		Doc doc = new Doc();
		doc.setPid(docId);
		List<Doc> subDocList = reposService.getDocList(doc);
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			String subDocName = subDoc.getName();
			if(false == copyDoc(subDoc.getId(),subDocName,subDocName, subDoc.getType(), reposId, docId, dstParentId,commitMsg,commitUser,login_user,rt,true))
			{
				ret = false;
			}
		}
		return ret;
	}

	private void updateDocContent(Integer id,String content, String commitMsg, String commitUser, User login_user,ReturnAjax rt) {
		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lock Doc
			doc = lockDoc(id,1,login_user,rt,false);
			if(doc== null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDocContent() lockDoc Failed");
				return;
			}
			unlock(); //线程锁
		}
		
		Repos repos = reposService.getRepos(doc.getVid());
		
		//只更新内容部分
		Doc newDoc = new Doc();
		newDoc.setId(id);
		newDoc.setContent(content);
		//System.out.println("before: " + content);
		if(reposService.updateDoc(newDoc) == 0)
		{
			rt.setError("更新文件失败");
			return;			
		}	
		
		//Save the content to virtual file
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getDocVPath(doc);
		String localVDocPath = reposVPath + docVName;
		
		System.out.println("updateDocContent() localVDocPath: " + localVDocPath);
		if(isFileExist(localVDocPath) == true)
		{
			if(saveVirtualDocContent(reposVPath,docVName, content,rt) == true)
			{
				if(repos.getVerCtrl() == 1)
				{
					verReposVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
				}
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(reposVPath,docVName,content,rt) == true)
			{
				if(repos.getVerCtrl() == 1)
				{
					svnVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
				}
			}
		}
		
		//Update Index For VDoc
		updateIndexForVDoc(id,content);
		
		//Delete tmp saved doc content
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		delFileOrDir(userTmpDir+docVName);
		
		if(unlockDoc(id,login_user,doc) == false)
		{
			rt.setError("unlockDoc failed");	
		}		
	}
	
	/*********************Functions For DocLock *******************************/
	//Lock Doc
	private Doc lockDoc(Integer docId,Integer lockType, User login_user, ReturnAjax rt, boolean subDocCheckFlag) {
		System.out.println("lockDoc() docId:" + docId + " lockType:" + lockType + " by " + login_user.getName() + " subDocCheckFlag:" + subDocCheckFlag);
				
		//确定文件节点是否可用
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			rt.setError("Doc " + docId +" 不存在！");
			System.out.println("lockDoc() Doc: " + docId +" 不存在！");
			return null;
		}
		
		//check if the doc was locked (State!=0 && lockTime - curTime > 1 day)
		if(isDocLocked(doc,login_user,rt))
		{
			System.out.println("lockDoc() Doc " + docId +" was locked");
			return null;
		}
		
		//Check if repos was locked
		Repos repos = reposService.getRepos(doc.getVid());
		if(repos == null)
		{
			rt.setError("仓库 " + doc.getVid() +" 不存在！");
			System.out.println("lockDoc() Repos: " + doc.getVid() +" 不存在！");
			return null;
		}
		if(isReposLocked(repos, login_user,rt))
		{
			System.out.println("lockDoc() Repos:" + repos.getId() +" was locked！");				
			return null;			
		}
		
		//检查其父节点是否强制锁定
		if(isParentDocLocked(doc.getPid(),login_user,rt))
		{
			System.out.println("lockDoc() Parent Doc of " + docId +" was locked！");				
			return null;
		}
		
		//Check If SubDoc was locked
		if(subDocCheckFlag)
		{
			if(isSubDocLocked(docId,rt) == true)
			{
				System.out.println("lockDoc() subDoc of " + docId +" was locked！");
				return null;
			}
		}
		
		//lockTime is the time to release lock 
		Doc lockDoc= new Doc();
		lockDoc.setId(docId);
		lockDoc.setState(lockType);	//doc的状态为不可用
		lockDoc.setLockBy(login_user.getId());
		long lockTime = new Date().getTime() + 24*60*60*1000;
		lockDoc.setLockTime(lockTime);	//Set lockTime
		if(reposService.updateDoc(lockDoc) == 0)
		{
			rt.setError("lock Doc:" + docId +"[" + doc.getName() +"]  failed");
			return null;
		}
		System.out.println("lockDoc() success docId:" + docId + " lockType:" + lockType + " by " + login_user.getName());
		return doc;
	}
	
	//确定仓库是否被锁定
	private boolean isReposLocked(Repos repos, User login_user, ReturnAjax rt) {
		int lockState = repos.getState();	//0: not locked  1: locked	
		if(lockState != 0)
		{
			if(isLockOutOfDate(repos.getLockTime()) == false)
			{	
				User lockBy = userService.getUser(repos.getLockBy());
				rt.setError("仓库 " + repos.getName() +" was locked by " + lockBy.getName());
				System.out.println("Repos " + repos.getId()+ "[" + repos.getName() +"] was locked by " + repos.getLockBy() + " lockState:"+ repos.getState());;
				return true;						
			}
			else 
			{
				System.out.println("Repos " + repos.getId()+ " " + repos.getName()  +" lock was out of date！");
				return false;
			}
		}
		return false;
	}

	//确定当前doc是否被锁定
	private boolean isDocLocked(Doc doc,User login_user,ReturnAjax rt) {
		int lockState = doc.getState();	//0: not locked 2: 表示强制锁定（实文件正在新增、更新、删除），不允许被自己解锁；1: 表示RDoc处于CheckOut 3:表示正在编辑VDoc
		if(lockState != 0)
		{
			//
			if(lockState != 2)
			{
				if(doc.getLockBy() == login_user.getId())	//locked by login_user
				{
					System.out.println("Doc: " + doc.getId() +" was locked by user:" + doc.getLockBy() +" login_user:" + login_user.getId());
					return false;
				}
			}
			
			if(isLockOutOfDate(doc.getLockTime()) == false)
			{	
				User lockBy = userService.getUser(doc.getLockBy());
				rt.setError(doc.getName() +" was locked by " + lockBy.getName());
				System.out.println("Doc " + doc.getId()+ "[" + doc.getName() +"] was locked by " + doc.getLockBy() + " lockState:"+ doc.getState());;
				return true;						
			}
			else 
			{
				System.out.println("doc " + doc.getId()+ " " + doc.getName()  +" lock was out of date！");
				return false;
			}
		}
		return false;
	}

	private boolean isLockOutOfDate(long lockTime) {
		//check if the lock was out of date
		long curTime = new Date().getTime();
		//System.out.println("isLockOutOfDate() curTime:"+curTime+" lockTime:"+lockTime);
		if(curTime < lockTime)	//
		{
			return false;
		}

		//Lock 自动失效
		return true;
	}

	//确定parentDoc is Force Locked
	private boolean isParentDocLocked(Integer parentDocId, User login_user,ReturnAjax rt) {
		if(parentDocId == 0)
		{
			return false;	//已经到了最上层
		}
		
		Doc doc = reposService.getDoc(parentDocId);
		if(doc == null)
		{
			System.out.println("isParentDocLocked() doc is null for parentDocId=" + parentDocId);
			return false;
		}
		
		Integer lockState = doc.getState();
		
		if(lockState == 2)	//Force Locked
		{	
			long curTime = new Date().getTime();
			long lockTime = doc.getLockTime();	//time for lock release
			System.out.println("isParentDocLocked() curTime:"+curTime+" lockTime:"+lockTime);
			if(curTime < lockTime)
			{
				rt.setError("parentDoc " + parentDocId + "[" + doc.getName() + "] was locked:" + lockState);
				System.out.println("getParentLockState() " + parentDocId + " is locked!");
				return true;
			}
		}
		return isParentDocLocked(doc.getPid(),login_user,rt);
	}
	
	//docId目录下是否有锁定的doc(包括所有锁定状态)
	//Check if any subDoc under docId was locked, you need to check it when you want to rename/move/copy/delete the Directory
	private boolean isSubDocLocked(Integer docId, ReturnAjax rt)
	{
		//Set the query condition to get the SubDocList of DocId
		Doc qDoc = new Doc();
		qDoc.setPid(docId);

		//get the subDocList 
		List<Doc> SubDocList = reposService.getDocList(qDoc);
		for(int i=0;i<SubDocList.size();i++)
		{
			Doc subDoc =SubDocList.get(i);
			if(subDoc.getState() != 0)
			{
				long curTime = new Date().getTime();
				long lockTime = subDoc.getLockTime();	//time for lock release
				System.out.println("isSubDocLocked() curTime:"+curTime+" lockTime:"+lockTime);
				if(curTime < lockTime)
				{
					rt.setError("subDoc " + subDoc.getId() + "[" +  subDoc.getName() + "] is locked:" + subDoc.getState());
					System.out.println("isSubDocLocked() " + subDoc.getId() + " is locked!");
					return true;
				}
				return false;
			}
		}
		
		//If there is subDoc which is directory, we need to go into the subDoc to check the lockSatate of subSubDoc
		for(int i=0;i<SubDocList.size();i++)
		{
			Doc subDoc =SubDocList.get(i);
			if(subDoc.getType() == 2)
			{
				if(isSubDocLocked(subDoc.getId(),rt) == true)
				{
					return true;
				}
			}
		}
				
		return false;
	}
	

	//Unlock Doc
	private boolean unlockDoc(Integer docId, User login_user, Doc preLockInfo) {
		Doc curDoc = reposService.getDocInfo(docId);
		if(curDoc == null)
		{
			System.out.println("unlockDoc() doc is null " + docId);
			return false;
		}
		
		if(curDoc.getState() == 0)
		{
			System.out.println("unlockDoc() doc was not locked:" + curDoc.getState());			
			return true;
		}
		
		Integer lockBy = curDoc.getLockBy();
		if(lockBy != null && lockBy == login_user.getId())
		{
			Doc revertDoc = new Doc();
			revertDoc.setId(docId);	
			
			if(preLockInfo == null)	//Unlock
			{
				revertDoc.setState(0);	//
				revertDoc.setLockBy(0);	//
				revertDoc.setLockTime((long)0);	//Set lockTime
			}
			else	//Revert to preLockState
			{
				revertDoc.setState(preLockInfo.getState());	//
				revertDoc.setLockBy(preLockInfo.getLockBy());	//
				revertDoc.setLockTime(preLockInfo.getLockTime());	//Set lockTime
			}
			
			if(reposService.updateDoc(revertDoc) == 0)
			{
				System.out.println("unlockDoc() updateDoc Failed!");
				return false;
			}
		}
		else
		{
			System.out.println("unlockDoc() doc was not locked by " + login_user.getName());
			return false;
		}
		
		System.out.println("unlockDoc() success:" + docId);
		return true;
	}
	
	/*************************** Functions For Real and Virtual Doc Operation ***********************************/
	//create Real Doc
	private boolean createRealDoc(String reposRPath,String parentPath, String name, Integer type, ReturnAjax rt) {
		//获取 doc parentPath
		String localParentPath =  reposRPath + parentPath;
		String localDocPath = localParentPath + name;
		System.out.println("createRealDoc() localParentPath:" + localParentPath);
		
		if(type == 2) //目录
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + "　已存在！");
				rt.setMsgData("createRealDoc() 目录 " +localDocPath + "　已存在！");
				return false;
			}
			
			if(false == createDir(localDocPath))
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + " 创建失败！");
				rt.setMsgData("createRealDoc() 目录 " +localDocPath + " 创建失败！");
				return false;
			}				
		}
		else
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 文件 " +localDocPath + " 已存在！");
				rt.setMsgData("createRealDoc() 文件 " +localDocPath + " 已存在！");
				return false;
			}
			
			if(false == createFile(localParentPath,name))
			{
				System.out.println("createRealDoc() 文件 " + localDocPath + "创建失败！");
				rt.setMsgData("createRealDoc() createFile 文件 " + localDocPath + "创建失败！");
				return false;					
			}
		}
		return true;
	}
	
	private boolean deleteRealDoc(String reposRPath, String parentPath, String name, Integer type, ReturnAjax rt) {
		String localDocPath = reposRPath + parentPath + name;
		if(type == 2)
		{
			if(delDir(localDocPath) == false)
			{
				System.out.println("deleteRealDoc() delDir " + localDocPath + "删除失败！");
				rt.setMsgData("deleteRealDoc() delDir " + localDocPath + "删除失败！");
				return false;
			}
		}	
		else 
		{
			if(delFile(localDocPath) == false)
			{
				System.out.println("deleteRealDoc() deleteFile " + localDocPath + "删除失败！");
				rt.setMsgData("deleteRealDoc() deleteFile " + localDocPath + "删除失败！");
				return false;
			}
		}
		return true;
	}
	
	private boolean updateRealDoc(String reposRPath,String parentPath,String name,Integer type, Integer fileSize, String fileCheckSum,
			MultipartFile uploadFile, Integer chunkNum, Integer chunkSize, String chunkParentPath, ReturnAjax rt) {
		String localDocParentPath = reposRPath + parentPath;
		String retName = null;
		try {
			if(null == chunkNum)	//非分片上传
			{
				retName = saveFile(uploadFile, localDocParentPath,name);
			}
			else
			{
				retName = combineChunks(localDocParentPath,name,chunkNum,chunkSize,chunkParentPath);
			}
			//Verify the size and FileCheckSum
			if(false == checkFileSizeAndCheckSum(localDocParentPath,name,fileSize,fileCheckSum))
			{
				System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error");
				return false;
			}
			
		} catch (Exception e) {
			System.out.println("updateRealDoc() saveFile " + name +" 异常！");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		
		System.out.println("updateRealDoc() saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			System.out.println("updateRealDoc() saveFile " + name +" Failed！");
			return false;
		}
		return true;
	}
	
	private boolean checkFileSizeAndCheckSum(String localDocParentPath, String name, Integer fileSize,
			String fileCheckSum) {
		File file = new File(localDocParentPath,name);
		if(fileSize != file.length())
		{
			System.out.println("checkFileSizeAndCheckSum() fileSize " + file.length() + "not match with ExpectedSize" + fileSize);
			return false;
		}
		return true;
	}

	private boolean moveRealDoc(String reposRPath, String srcParentPath, String srcName, String dstParentPath,String dstName,Integer type, ReturnAjax rt) 
	{
		System.out.println("moveRealDoc() " + " reposRPath:"+reposRPath + " srcParentPath:"+srcParentPath + " srcName:"+srcName + " dstParentPath:"+dstParentPath + " dstName:"+dstName);
		String localOldParentPath = reposRPath + srcParentPath;
		String oldFilePath = localOldParentPath+ srcName;
		String localNewParentPath = reposRPath + dstParentPath;
		String newFilePath = localNewParentPath + dstName;
		//检查orgFile是否存在
		if(isFileExist(oldFilePath) == false)
		{
			System.out.println("moveRealDoc() " + oldFilePath + " not exists");
			rt.setMsgData("moveRealDoc() " + oldFilePath + " not exists");
			return false;
		}
		
		//检查dstFile是否存在
		if(isFileExist(newFilePath) == true)
		{
			System.out.println("moveRealDoc() " + newFilePath + " already exists");
			rt.setMsgData("moveRealDoc() " + newFilePath + " already exists");
			return false;
		}
	
		/*移动文件或目录*/		
		if(moveFileOrDir(localOldParentPath,srcName,localNewParentPath,dstName,false) == false)	//强制覆盖
		{
			System.out.println("moveRealDoc() move " + oldFilePath + " to "+ newFilePath + " Failed");
			rt.setMsgData("moveRealDoc() move " + oldFilePath + " to "+ newFilePath + " Failed");
			return false;
		}
		return true;
	}
	
	private boolean copyRealDoc(String reposRPath, String srcParentPath,String srcName,String dstParentPath,String dstName, Integer type, ReturnAjax rt) {
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(isFileExist(srcDocPath) == false)
		{
			System.out.println("文件: " + srcDocPath + " 不存在");
			rt.setMsgData("文件: " + srcDocPath + " 不存在");
			return false;
		}
		
		if(isFileExist(dstDocPath) == true)
		{
			System.out.println("文件: " + dstDocPath + " 已存在");
			rt.setMsgData("文件: " + dstDocPath + " 已存在");
			return false;
		}
		
		if(type == 2)	//如果是目录则创建目录
		{
			if(false == createDir(dstDocPath))
			{
				System.out.println("目录: " + dstDocPath + " 创建");
				rt.setMsgData("目录: " + dstDocPath + " 创建");
				return false;
			}
		}
		else	//如果是文件则复制文件
		{
			if(copyFile(srcDocPath,dstDocPath,false) == false)	//强制覆盖
			{
				System.out.println("文件: " + srcDocPath + " 复制失败");
				rt.setMsgData("文件: " + srcDocPath + " 复制失败");
				return false;
			}
		}
		return true;
	}

	//create Virtual Doc
	private boolean createVirtualDoc(String reposVPath, String docVName,String content, ReturnAjax rt) {
		String vDocPath = reposVPath + docVName;
		System.out.println("vDocPath: " + vDocPath);
		if(isFileExist(vDocPath) == true)
		{
			System.out.println("目录 " +vDocPath + "　已存在！");
			rt.setMsgData("目录 " +vDocPath + "　已存在！");
			return false;
		}
			
		if(false == createDir(vDocPath))
		{
			System.out.println("目录 " + vDocPath + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + " 创建失败！");
			return false;
		}
		if(createDir(vDocPath + "/res") == false)
		{
			System.out.println("目录 " + vDocPath + "/res" + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + "/res" + " 创建失败！");
			return false;
		}
		if(createFile(vDocPath,"content.md") == false)
		{
			System.out.println("目录 " + vDocPath + "/content.md" + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + "/content.md" + " 创建失败！");
			return false;			
		}
		if(content !=null && !"".equals(content))
		{
			saveVirtualDocContent(reposVPath,docVName, content,rt);
		}
		
		return true;
	}
	
	private boolean deleteVirtualDoc(String reposVPath, String docVName, ReturnAjax rt) {
		String localDocVPath = reposVPath + docVName;
		if(delDir(localDocVPath) == false)
		{
			rt.setMsgData("deleteVirtualDoc() delDir失败 " + localDocVPath);
			return false;
		}
		return true;
	}
	
	private boolean moveVirtualDoc(String reposRefVPath, String srcDocVName,String dstDocVName, ReturnAjax rt) {
		if(moveFileOrDir(reposRefVPath, srcDocVName, reposRefVPath, dstDocVName, false) == false)
		{
			rt.setMsgData("moveVirtualDoc() moveFile " + " reposRefVPath:" + reposRefVPath + " srcDocVName:" + srcDocVName+ " dstDocVName:" + dstDocVName);
			return false;
		}
		return true;
	}
	
	private boolean copyVirtualDoc(String reposVPath, String srcDocVName, String dstDocVName, ReturnAjax rt) {
		String srcDocFullVPath = reposVPath + srcDocVName;
		String dstDocFullVPath = reposVPath + dstDocVName;
		if(copyDir(srcDocFullVPath,dstDocFullVPath,false) == false)
		{
			rt.setMsgData("copyVirtualDoc() copyDir " + " srcDocFullVPath:" + srcDocFullVPath +  " dstDocFullVPath:" + dstDocFullVPath );
			return false;
		}
		return true;
	}

	private boolean saveVirtualDocContent(String localParentPath, String docVName, String content, ReturnAjax rt) {
		String vDocPath = localParentPath + docVName + "/";
		File folder = new File(vDocPath);
		if(!folder.exists())
		{
			System.out.println("saveVirtualDocContent() vDocPath:" + vDocPath + " not exists!");
			if(folder.mkdir() == false)
			{
				System.out.println("saveVirtualDocContent() mkdir vDocPath:" + vDocPath + " Failed!");
				rt.setMsgData("saveVirtualDocContent() mkdir vDocPath:" + vDocPath + " Failed!");
				return false;
			}
		}
		
		//set the md file Path
		String mdFilePath = vDocPath + "content.md";
		//创建文件输入流
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(mdFilePath);
		} catch (FileNotFoundException e) {
			System.out.println("saveVirtualDocContent() new FileOutputStream failed");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		try {
			out.write(content.getBytes(), 0, content.length());
			//关闭输出流
			out.close();
		} catch (IOException e) {
			System.out.println("saveVirtualDocContent() out.write exception");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		return true;
	}
	
	private Integer getMaxFileSize() {
		// TODO Auto-generated method stub
		return null;
	}

	private boolean isNodeExist(String name, Integer parentId, Integer reposId) {
		Doc qdoc = new Doc();
		qdoc.setName(name);
		qdoc.setPid(parentId);
		qdoc.setVid(reposId);
		List <Doc> docList = reposService.getDocList(qdoc);
		if(docList != null && docList.size() > 0)
		{
			return true;
		}
		return false;
	}
	
	Doc getDocByName(String name, Integer parentId, Integer reposId)
	{
		Doc qdoc = new Doc();
		qdoc.setName(name);
		qdoc.setPid(parentId);
		qdoc.setVid(reposId);
		List <Doc> docList = reposService.getDocList(qdoc);
		if(docList != null && docList.size() > 0)
		{
			return docList.get(0);
		}
		return null;
	}

	//0：虚拟文件系统  1：实文件系统 
	boolean isRealFS(Integer type)
	{
		if(type == 0)
		{
			return false;
		}
		return true;
	}
	
	/********************* Functions For User Opertion Right****************************/
	//检查用户的新增权限
	private boolean checkUserAddRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,parentId,reposId);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				return false;
			}
			else if(docUserAuth.getAddEn() != 1)
			{
				rt.setError("您没有该目录的新增权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}

	private boolean checkUserDeleteRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,parentId,reposId);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				return false;
			}
			else if(docUserAuth.getDeleteEn() != 1)
			{
				rt.setError("您没有该目录的删除权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	private boolean checkUserEditRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,docId,reposId);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该文件，请联系管理员");
				return false;
			}
			else if(docUserAuth.getEditEn() != 1)
			{
				rt.setError("您没有该文件的编辑权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	private boolean checkUseAccessRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		DocAuth docAuth = getUserDocAuth(userId,docId,reposId);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			Integer access = docAuth.getAccess();
			if(access == null || access.equals(0))
			{
				rt.setError("您无权访问该文件，请联系管理员");
				return false;
			}
		}
		return true;
	}
	
	
	/*************** Functions For verRepos *********************/
	private List<LogEntry> verReposGetHistory(Repos repos,String docPath, int maxLogNum) {
		if(repos.getVerCtrl() == 1)
		{
			return svnGetHistory(repos, docPath, maxLogNum);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitGetHistory(repos, docPath, maxLogNum);
		}
		return null;
	}
	
	private boolean verReposRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnRealDocAdd(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocAdd(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		return true;
	}
	
	private boolean verReposRealDocDelete(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnRealDocDelete(repos, parentPath, name, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocDelete(repos, parentPath, name, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRealDocCommit(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnRealDocCommit(repos, parentPath, name, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCommit(repos, parentPath, name, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnRealDocMove(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocMove(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}
	
	private boolean verReposCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String commitId) {
		if(repos.getVerCtrl() == 1)
		{
			long revision = Long.parseLong(commitId);
			return svnCheckOut(repos, isRealDoc, parentPath, entryName, localParentPath, targetName, revision);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitCheckOut(repos, isRealDoc, parentPath, entryName, localParentPath, targetName, commitId);
		}
		return true;
	}
	
	private boolean verReposRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnRevertRealDoc(repos, parentPath, entryName, type, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRevertRealDoc(repos, parentPath, entryName, type, rt);
		}
		return true;
	}
	
	private boolean verReposVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}
	
	private boolean verReposVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) {
		if(repos.getVerCtrl() == 1)
		{
			return svnVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRevertVirtualDoc(Repos repos, String docVName) {
		if(repos.getVerCtrl() == 1)
		{
			return svnRevertVirtualDoc(repos, docVName);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRevertVirtualDoc(repos, docVName);
		}
		return true;
	}
	
	/********************** Functions For git *************************************/
	private List<LogEntry> gitGetHistory(Repos repos, String docPath, int maxLogNum) {
		// TODO Auto-generated method stub
		GITUtil gitUtil = new GITUtil();
		gitUtil.Init(repos, true, null);
		return gitUtil.getHistoryLogs(docPath, 0, -1, maxLogNum);
	}
	
	private boolean gitRealDocAdd(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocAdd() entryName can not be empty");
			return false;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return false;
		}

		//Add to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, false) == false)
			{
				System.out.println("gitRealDocAdd() add File to WD error");					
				return false;
			}
		}
		else
		{
			//Add Dir
			File dir = new File(wcDocPath);
			if(dir.mkdir() == false)
			{
				System.out.println("gitRealDocAdd() add Dir to WD error");										
				return false;
			}
		}			
		
		//Commit will roll back WC if there is error
		if(gitUtil.gitAdd(parentPath, entryName,commitMsg, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}

	private boolean gitRealDocDelete(Repos repos, String parentPath, String entryName, Integer type, String commitMsg,String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocDelete() entryName can not be empty");
			return false;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocDelete() GITUtil Init failed");
			return false;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(delFileOrDir(wcDocPath) == false)
		{
			System.out.println("gitRealDocDelete() delete working copy failed");
		}
			
		if(gitUtil.Commit(parentPath, entryName,commitMsg, commitUser)== false)
		{
			System.out.println("gitRealDocDelete() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitRealDocCommit(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocCommit() entryName can not be empty");
			return false;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return false;
		}
	
		//Copy to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, false) == false)
			{
				System.out.println("gitRealDocCommit() copy File to working directory failed");					
				return false;
			}
		}
		else
		{
			System.out.println("gitRealDocCommit() dir can not modify");
			return false;
		}			
				
		//Commit will roll back WC if there is error
		if(gitUtil.Commit(parentPath, entryName,commitMsg, commitUser) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}
	
	private boolean gitRealDocMove(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {	
		
		return gitDocMove(repos, true, srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg, commitUser, rt);
	}
	
	private boolean gitRealDocCopy(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		return  gitDocCopy(repos, true, srcParentPath, srcEntryName, dstParentPath, dstEntryName,  commitMsg, commitUser, rt);
	}
	
	private boolean gitDocMove(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocMove() srcEntryName can not be empty");
			return false;
		}
		
		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocMove() dstEntryName can not be empty");
			return false;
		}
		
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocMove() GITUtil Init failed");
			return false;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(moveFileOrDir(wcSrcDocParentPath, srcEntryName,wcDstParentDocPath, dstEntryName,false) == false)
		{
			System.out.println("gitDocMove() moveFileOrDir Failed");					
			return false;
		}
				
		//Commit will roll back WC if there is error
		if(gitUtil.gitMove(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser) == false)
		{
			System.out.println("gitDocMove() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}
	
	private boolean gitDocCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() srcEntryName can not be empty");
			return false;
		}

		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() dstEntryName can not be empty");
			return false;
		}
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Init failed");
			return false;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(copyFileOrDir(wcSrcDocParentPath+srcEntryName,wcDstParentDocPath+dstEntryName,false) == false)
		{
			System.out.println("gitDocCopy() moveFileOrDir Failed");					
			return false;
		}
				
		//Commit will roll back WC if there is error
		if(gitUtil.gitCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}

	private boolean gitCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String revision) {
		// TODO Auto-generated method stub
		System.out.println("gitCheckOut() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " revision:" + revision);
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, null) == false)
		{
			System.out.println("gitCheckOut() GITUtil Init failed");
			return false;
		}
		
		gitUtil.getEntry(parentPath, entryName, localParentPath, targetName, revision);
		
		return false;
	}
	
	private boolean gitRevertRealDoc(Repos repos, String parentPath, String entryName, Integer type, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("svnRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return gitCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,null);
	}
		
	private boolean gitVirtualDocAdd(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocAdd() entryName can not be empty");
			return false;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocAdd() GITUtil Init failed");
			return false;
		}

		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		if(gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null) == false)
		{
			System.out.println("gitVirtualDocAdd() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser,
			ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocDelete() docVName can not be empty");
			return false;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocDelete() GITUtil Init failed");
			return false;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, false) + docVName;
		if(delDir(wcDocPath) == false)
		{
			System.out.println("gitVirtualDocDelete() delete working copy failed");
		}
			
		if(gitUtil.Commit("", docVName,commitMsg, commitUser)== false)
		{
			System.out.println("gitVirtualDocDelete() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitVirtualDocCommit(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitRealDocCommit() entryName can not be empty");
			return false;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return false;
		}
	
				
		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		if(gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}

	private boolean gitVirtualDocMove(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return gitDocMove(repos, false, "", srcDocVName, "", dstDocVName, commitMsg, commitUser, rt);
	}
	
	private boolean gitVirtualDocCopy(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return  gitDocCopy(repos, false, "", srcDocVName, "", dstDocVName,  commitMsg, commitUser, rt);
	}
	
	private boolean gitRevertVirtualDoc(Repos repos, String docVName) {
		// TODO Auto-generated method stub
		System.out.println("svnRevertRealDoc() docVName:" + docVName);
		String localParentPath = getReposVirtualPath(repos);

		//revert from svn server
		return gitCheckOut(repos, false, "", docVName, localParentPath, docVName,null);
	}
	
	/********************** Functions for SVN ***************************/
	private int svnGetEntryType(Repos repos, boolean isRealDoc, String parentPath,String entryName, long revision) 
	{
		System.out.println("svnGetEntryType() parentPath:" + parentPath + " entryName:" + entryName);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, isRealDoc, null) == false)
		{
			System.out.println("svnGetEntryType() svnUtil Init Failed");
			return -1;
		}
		
		String remoteEntryPath = parentPath + entryName;
		int entryType = svnUtil.getEntryType(remoteEntryPath, revision);
		
		return entryType;
	}

	private List<LogEntry> svnGetHistory(Repos repos,String docPath, int maxLogNum) {

		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(repos, true, null);
		return svnUtil.getHistoryLogs(docPath, 0, -1, maxLogNum);
	}

	private boolean svnRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		String remotePath = parentPath + entryName;
		String reposRPath = getReposRealPath(repos);
		
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(repos, true, commitUser);
			if(svnUtil.doCheckPath(remotePath, -1) == false)	//检查文件是否已经存在于仓库中
			{
				if(type == 1)
				{
					String localFilePath = reposRPath + remotePath;
					if(svnUtil.svnAddFile(parentPath,entryName,localFilePath,commitMsg,commitUser) == false)
					{
						System.out.println("svnRealDocAdd() " + remotePath + " svnUtil.svnAddFile失败！");	
						rt.setMsgData("svnRealDocAdd() " + remotePath + " svnUtil.svnAddFile失败！");	
						return false;
					}
				}
				else
				{
					if(svnUtil.svnAddDir(parentPath,entryName,commitMsg,commitUser) == false)
					{
						System.out.println("svnRealDocAdd() " + remotePath + " svnUtil.svnAddDir失败！");	
						rt.setMsgData("svnRealDocAdd() " + remotePath + " svnUtil.svnAddDir失败！");
						return false;
					}
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				System.out.println(remotePath + "在仓库中已存在！");
				rt.setMsgData("svnRealDocAdd() " + remotePath + "在仓库中已存在！");
				return false;
			}
		} catch (SVNException e) {
			e.printStackTrace();
			System.out.println("系统异常：" + remotePath + " svnRealDocAdd异常！");
			rt.setMsgData(e);
			return false;
		}
		
		return true;
	}

	private boolean svnRealDocDelete(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnRealDocDelete() parentPath:" + parentPath + " name:" + name);

		String docRPath = parentPath + name;
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(repos, true, commitUser);
			if(svnUtil.doCheckPath(docRPath,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
			{
				if(svnUtil.svnDelete(parentPath,name,commitMsg,commitUser) == false)
				{
					System.out.println(docRPath + " remoteDeleteEntry失败！");
					rt.setMsgData("verReposRealDocDelete() svnUtil.svnDelete失败" + " docRPath:" + docRPath + " name:" + name);
					return false;
				}
			}
		} catch (SVNException e) {
			System.out.println("系统异常：" + docRPath + " remoteDeleteEntry异常！");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		
		return true;
	}

	private boolean svnRealDocCommit(Repos repos, String parentPath,
			String name,Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocCommit() parentPath:" + parentPath + " name:" + name);
		String reposRPath =  getReposRealPath(repos);
		String docRPath = parentPath + name;
		String docFullRPath = reposRPath + parentPath + name;
		String newFilePath = docFullRPath;
		
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(repos, true, commitUser);
			
			if(svnUtil.doCheckPath(docRPath, -1) == false)	//检查文件是否已经存在于仓库中
			{					
				System.out.println("svnRealDocCommit() " + docRPath + " 在仓库中不存在！");
				if(false == svnUtil.svnAddFile(parentPath,name,newFilePath,commitMsg,commitUser))
				{
					System.out.println("svnRealDocCommit() " + name + " svnAddFile失败！");
					System.out.println("svnRealDocCommit() svnUtil.svnAddFile " + " parentPath:" + parentPath  + " name:" + name  + " newFilePath:" + newFilePath);
					return false;
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				if(svnUtil.svnModifyFile(parentPath,name,null, newFilePath, commitMsg,commitUser) == false)
				{
					System.out.println("svnRealDocCommit() " + name + " remoteModifyFile失败！");
					System.out.println("svnRealDocCommit() svnUtil.svnModifyFile " + " parentPath:" + parentPath  + " name:" + name + " newFilePath:" + newFilePath);
					return false;
				}
			}
		} catch (SVNException e) {
			System.out.println("svnRealDocCommit() 系统异常：" + name + " svnRealDocCommit异常！");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		
		return true;		
	}

	private boolean svnRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(svnMove(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg, commitUser, rt) == false)
		{
			System.out.println("svnRealDocMove() svnMove Failed！");
			rt.setMsgData("svnMove Failed！");
			return false;
		}
			
		return true;
	}
	
	private boolean svnCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName, 
			String commitMsg, String commitUser, ReturnAjax rt) 
	{
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(repos, isRealDoc, commitUser);
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser, false) == false)
		{
			rt.setMsgData("svnCopy() svnUtil.svnCopy " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		return true;
	}
	
	private boolean svnMove(Repos repos, boolean isRealDoc, String srcParentPath,String srcEntryName, String dstParentPath,String dstEntryName, 
			String commitMsg, String commitUser, ReturnAjax rt)  
	{
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(repos, isRealDoc, commitUser);
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg,commitUser,true) == false)
		{
			rt.setMsgData("svnMove() svnUtil.svnCopy " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		return true;
	}

	private boolean svnRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
			
		if(svnCopy(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcEntryName + " svnCopy失败");
			return false;
		}
		return true;
	}

	private boolean svnCheckOut(Repos repos, boolean isRealDoc, String parentPath,String entryName, String localParentPath,String targetName,long revision) 
	{
		System.out.println("svnCheckOut() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " revision:" + revision);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, isRealDoc, null) == false)
		{
			System.out.println("svnCheckOut() svnUtil Init Failed");
			return false;
		}

		return svnUtil.getEntry(parentPath, entryName, localParentPath, targetName, revision);
	}

	private boolean svnRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
	{
		System.out.println("svnRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return svnCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,-1);
	}

	private boolean svnVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnVirtualDocAdd() docVName:" + docVName);
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("svnVirtualDocAdd() svnUtil Init Failed!");
			rt.setMsgData("svnVirtualDocAdd() svnUtil Init Failed!");
			return false;
		}
		
		String reposVPath =  getReposVirtualPath(repos);
		
		//modifyEnable set to false
		if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,false,null) == false)
		{
			System.out.println(docVName + " doAutoCommit失败！");
			rt.setMsgData("doAutoCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath);
			return false;
		}
		return true;
	}

	private boolean svnVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocDelete() docVName:" + docVName);
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(repos, false, commitUser);
			if(svnUtil.doCheckPath(docVName,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
			{
				if(svnUtil.svnDelete("",docVName,commitMsg,commitUser) == false)
				{
					System.out.println(docVName + " remoteDeleteEntry失败！");
					rt.setMsgData("svnVirtualDocDelete() svnUtil.svnDelete "  + docVName +" 失败 ");
					return false;
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println("系统异常：" + docVName + " remoteDeleteEntry异常！");
			rt.setMsgData(e);
			return false;
		}
		return true;
	}

	private boolean svnVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocCommit() docVName:" + docVName);
		String reposVPath =  getReposVirtualPath(repos);
		
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(repos, false, commitUser);
			
		if(commitMsg == null || "".equals(commitMsg))
		{
			commitMsg = "Commit virtual doc " + docVName + " by " + commitUser;
		}
		
		if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,true,null) == false)
		{
			System.out.println(docVName + " doCommit失败！");
			rt.setMsgData(" doCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath);
			return false;
		}
		
		return true;
	}

	private boolean svnVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocMove() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		if(svnMove(repos, false,"",srcDocVName,"",dstDocVName,commitMsg,commitUser, rt) == false)
		{
			System.out.println("svnMove Failed！");
			rt.setMsgData("svnVirtualDocMove() svnMove Failed！");
			return false;
		}
		return true;
	}

	private boolean svnVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) {

		System.out.println("svnVirtualDocCopy() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);			
		if(svnCopy(repos, false, "",srcDocVName,"",dstDocVName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcDocVName + " svnCopy失败");
			return false;
		}
		return true;
	}

	private boolean svnRevertVirtualDoc(Repos repos, String docVName) {
		System.out.println("svnRevertVirtualDoc() docVName:" + docVName);
		
		String localDocVParentPath = getReposVirtualPath(repos);

		return svnCheckOut(repos, false, "", docVName, localDocVParentPath, docVName,-1);
	}
}
	