package com.DocSystem.controller;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;


import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.tmatesoft.svn.core.SVNDepth;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.SVNProperties;
import org.tmatesoft.svn.core.SVNProperty;
import org.tmatesoft.svn.core.SVNURL;
import org.tmatesoft.svn.core.auth.ISVNAuthenticationManager;
import org.tmatesoft.svn.core.internal.io.dav.DAVRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.fs.FSRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.svn.SVNRepositoryFactoryImpl;
import org.tmatesoft.svn.core.internal.wc.DefaultSVNOptions;
import org.tmatesoft.svn.core.io.SVNRepository;
import org.tmatesoft.svn.core.io.SVNRepositoryFactory;
import org.tmatesoft.svn.core.wc.SVNClientManager;
import org.tmatesoft.svn.core.wc.SVNRevision;
import org.tmatesoft.svn.core.wc.SVNUpdateClient;
import org.tmatesoft.svn.core.wc.SVNWCUtil;
import org.tmatesoft.svn.core.wc.admin.SVNAdminClient;

import util.CompressPic;
import util.ReturnAjax;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.controller.BaseController;
import com.DocSystem.controller.ReposController;
import com.alibaba.fastjson.JSONObject;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.tools.ant.Project;    
import org.apache.tools.ant.taskdefs.Zip;    
import org.apache.tools.ant.types.FileSet;

/*
 Something you need to know
 1、文件节点增、删、改
（1）文件节点可以是文件或目录（包括实文件和虚文件）
（2）实文件节点包括三部分内容：本地文件、版本仓库文件、数据库记录
（3）虚文件节点包括三部分内容：本地目录、版本仓库目录、数据库记录
	虚文件的实体跟实文件不同，并不是一个单一的文件，而是以文件节点ID为名称的目录，里面包括content.md文件和res目录，markdown文件记录了虚文件的文字内容，res目录下存放相关的资源文件
（4）add、delete、edit是文件节点的基本功能， rename、move、copy、upload是基本功能的扩展功能
（5）文件节点操作总是原子操作
	这个主要是针对upload和copy接口而言，
	前台上传多个文件和目录时，实际上也是一个文件一个文件上传的，而不是一起上传到后台后再做处理的，这是为了保证前后台信息一致，这样前台能够知道每一个文件节点的更新情况
	前台执行目录复制操作的话，也是同样一层层目录复制
（6）文件节点信息的更新优先次序依次为 本地文件、版本仓库文件、数据库记录
	版本仓库文件如果更新失败，则本地文件需要回退，以保证本地文件与版本仓库最新版本的文件一致
	数据库记录更新失败时，本地文件和版本仓库文件不会回退，对于执行add和delete操作时发生不可逆的结果:
	delete失败后，会导致该文件仍然存在，但文件下载时找不到实体文件，通过再次删除实现同步（删除时实体文件已不存在时直接成功，并更新版本仓库）
	add失败后由于本地文件已经存在，会导致该目录下该名字的文件无法再新增（如果实体已经存在，会提示错误，如果不提示错误，有可能导致该实体文件被映射到多个数据库记录上，
		因为目前是通过前台来检查文件节点是否已存在，所以很可能有多个用户同时开始新增，这里通过文件的存在与否来避免这个问题），除非其父节点被删除才能实现同步（删除父节点是会把子目录下的所有文件都删除）
	由于数据库记录操作失败的概率比较低，我总是假设会成功的，但后期还是要考虑回退问题，否则会导致更多不可增加文件或目录
 */
@Controller
@RequestMapping("/Doc")
public class DocController extends BaseController{
	@Autowired
	private ReposServiceImpl reposService;
	
	/*******************************  Ajax Interfaces For Document Controller ************************/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(String name,Integer type,Integer reposId,Integer parentId,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc name: " + name + " type: " + type+ " reposId: " + reposId + " parentId: " + parentId);
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
		
		Repos repos = reposService.getRepos(reposId);
		//get parentPath
		String parentPath = getDocFullPath(parentId);		
		//get RealDoc Full ParentPath
		String savePath =  getReposRealPath(repos) + parentPath;
		if(isRealFS(repos.getType())) //0：虚拟文件系统   1： 普通文件系统	
		{
			/*创建实文件Entry：新建文件或目录*/
			if(createRealDoc(repos,parentPath,name,type) == false)
			{
				System.out.println("createRealDoc Failed");
				writeJson(rt, response);	
				return;
			}
			
			//需要将文件Commit到SVN上去
			if(repos.getVerCtrl() == 1)
			{
				if(commitMsg == null || "".equals(commitMsg))
				{
					commitMsg = "add " + name + " by " + commitUser;
				}
				if(svnRealDocAdd(repos,parentPath,name,commitMsg,commitUser) == false)
				{
					delFile(savePath,name);	//该接口可以删除文件或空目录，还原现场，避免已存在文件无法增加回去
					rt.setError("svnAdd Failed");
					writeJson(rt, response);	
					return;
				}				
			}
			
		}
		
		//新建doc记录
		Doc doc = new Doc();
		doc.setName(name);
		doc.setType(type);
		doc.setContent("#" + name);
		doc.setPath(parentPath);
		doc.setVid(reposId);
		doc.setPid(parentId);
		doc.setCreator(login_user.getId());
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		doc.setCreateTime(createTime);
		if(reposService.addDoc(doc) == 0)
		{
			if(delFile(savePath,name))
			{
				String rollBackCommitMsg = "delete " + name + " due to db addDoc failed";
				//该接口可以删除文件或空目录，还原现场，避免已存在文件无法增加回去
				svnRealDocDelete(repos, parentPath, name, rollBackCommitMsg, commitUser);
			}
			rt.setError("db addDoc Failed");
			writeJson(rt, response);	
			return;
		}
		System.out.println("id: " + doc.getId());
		rt.setData(doc);
		
		//创建虚拟文件目录
		String reposVirtualPath = getReposVirtualPath(repos);
		if(createVirtualDoc(reposVirtualPath,doc.getId(),"#"+name) == true)
		{
			svnVirtualDocAdd(repos, doc.getId(), commitMsg, commitUser);
		}
		
		writeJson(rt, response);	
	}
	
	private boolean svnRealDocAdd(Repos repos, String parentPath, String name,String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		String svnPwd = repos.getSvnPwd();
		String savePath =  getReposRealPath(repos) + parentPath;
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			if(svnUtil.doCheckPath("rdata" + parentPath + name, -1) == false)	//检查文件是否已经存在于仓库中
			{
				if(svnUtil.doAddCommit(savePath + name,commitMsg) == false)
				{
					System.out.println(name + " svnAddCommit失败！");	
					return false;
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				if(svnUtil.doCommit(savePath + name,commitMsg) == false)
				{
					System.out.println(name + " svnCommit失败！");
					return false;
				}
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：" + name + " svnRealDocAdd异常！");
			return false;
		}		
		return true;
	}
	
	private boolean svnVirtualDocAdd(Repos repos, Integer docId,String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		String svnPwd = repos.getSvnPwd();
		String savePath =  getReposVirtualPath(repos);
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			if(commitMsg == null || "".equals(commitMsg))
			{
				commitMsg = "add " + docId + " by " + commitUser;
			}
			if(svnUtil.doCheckPath(getRemoteVirtualDocPath(docId), -1) == false)	//检查文件是否已经存在于仓库中
			{
				if(svnUtil.doAddCommit(savePath + docId,commitMsg) == false)
				{
					System.out.println(docId + " svnAddCommit失败！");	
					return false;
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				if(svnUtil.doCommit(savePath + docId,commitMsg) == false)
				{
					System.out.println(docId + " svnCommit失败！");
					return false;
				}
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：" + docId + " svnAdd异常！");
			return false;
		}		
		return true;
	}

	//create Real Doc
	private boolean createRealDoc(Repos repos,String parentPath, String name, Integer type) {
		//获取 doc parentPath
		String savePath =  getReposRealPath(repos) + parentPath;
		System.out.println("savePath:" + savePath);
		
		// TODO Auto-generated method stub
		if(type == 2) //目录
		{
			if(isFileExist(savePath + name) == true)
			{
				System.out.println("目录 " +name + "　已存在！");
				return false;
			}
			
			if(false == createDir(savePath + name))
			{
				System.out.println("目录 " +name + " 创建失败！");
				return false;
			}				
		}
		else
		{
			if(isFileExist(savePath + name) == true)
			{
				System.out.println("文件 " +name + " 已存在！");
				return false;
			}
				
			if(false == createFile(savePath,name))
			{
				System.out.println("文件 " + name + "创建失败！");
				return false;					
			}
		}
		return true;
	}
	
	//create Virtual Doc
	private boolean createVirtualDoc(String reposVirtualPath, Integer docId,String content) {
		// TODO Auto-generated method stub
		String vDocPath = reposVirtualPath	+ docId + "/";
		System.out.println("vDocPath: " + vDocPath);
		if(isFileExist(vDocPath) == true)
		{
			System.out.println("目录 " +vDocPath + "　已存在！");
			return false;
		}
			
		if(false == createDir(vDocPath))
		{
			System.out.println("目录 " + vDocPath + " 创建失败！");
			return false;
		}
		if(createDir(vDocPath + "res") == false)
		{
			System.out.println("目录 " + vDocPath + "/res" + " 创建失败！");
			return false;
		}
		if(createFile(vDocPath,"content.md") == false)
		{
			System.out.println("目录 " + vDocPath + "/content.md" + " 创建失败！");
			return false;			
		}
		if(content !=null && !"".equals(content))
		{
			saveVirtualDoc(reposVirtualPath, docId, content);
		}
		
		return true;
	}

	//检查用户的新增权限
	private boolean checkUserAddRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		// TODO Auto-generated method stub
		DocAuth docUserAuth = getDocUserAuth(userId,parentId,reposId);
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

	private DocAuth getDocUserAuth(Integer userId, Integer docId, Integer reposId) {
		// TODO Auto-generated method stub
		//获取仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setReposId(reposId);
		qReposAuth.setUserId(userId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			qReposAuth.setUserId(0);	//获取仓库的公开属性
			reposAuth = reposService.getReposAuth(qReposAuth);
			if(reposAuth == null)
			{
				return null;
			}
		}
		
		//获取仓库权限,权限根式转换
		if(docId == null || docId == 0)	//根目录为空或为0，表示要获取仓库的权限
		{
			DocAuth  docAuth = new DocAuth();
			docAuth.setUserId(userId);
			docAuth.setReposId(reposId);
			docAuth.setAccess(reposAuth.getAccess());
			docAuth.setEditEn(reposAuth.getEditEn());
			docAuth.setAddEn(reposAuth.getAddEn());
			docAuth.setDeleteEn(reposAuth.getDeleteEn());
			return docAuth;
		}
		
		//递归获取文件的访问权限
		return recurGetDocAuth(userId,docId,reposId,reposAuth);
	}

	private DocAuth recurGetDocAuth(Integer userId, Integer docId,
			Integer reposId,ReposAuth reposAuth) {
		// TODO Auto-generated method stub
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(userId);
		qDocAuth.setReposId(reposId);
		qDocAuth.setDocId(docId);
		if((docId == null) || (docId == 0))	//根目录直接取reposAuth的属性
		{
			qDocAuth.setAccess(reposAuth.getAccess());
			qDocAuth.setEditEn(reposAuth.getEditEn());
			qDocAuth.setAddEn(reposAuth.getAddEn());
			qDocAuth.setDeleteEn(reposAuth.getDeleteEn());
			return qDocAuth;
		}
		
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)	//没有设置的话默认使用父节点的权限
		{
			qDocAuth.setUserId(0);	//取目录公有权限设置
			docAuth = reposService.getDocAuth(qDocAuth);
			if(docAuth == null)
			{
				Doc doc = reposService.getDocInfo(docId);
				Integer pDocId = doc.getPid();
				return recurGetDocAuth(userId,pDocId,reposId,reposAuth);
			}
		}
		return docAuth;
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
	
	/****************   Upload a Document ******************/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(MultipartFile uploadFile, Integer uploadType,Integer reposId, Integer parentId, Integer docId, String filePath, String commitMsg,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("uploadDoc reposId:" + reposId + " parentId:" + parentId  + " uploadType:" + uploadType  + " docId:" + docId + " filePath:" + filePath);
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
		if(uploadType == 1)
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
		
		//虚拟文件系统不支持实文件上传
		Repos repos = reposService.getRepos(reposId);
		if(isRealFS(repos.getType()) == false)
		{
			rt.setError("虚拟文件系统不支持文件上传!");
			writeJson(rt, response);
			return;
		}		
		
		//带有相对路径的标明是文件夹上传，需要先判断其相对路径是否存在，如果不存在则，需要递归创建，而且parentId，需要修改
		if(filePath != null && !filePath.equals(""))
		{
			System.out.println("文件夹上传");
		}
		
		//获取文件并保存文件
		//MultipartHttpServletRequest multiRequest;
		//multiRequest = (MultipartHttpServletRequest) request;
		//MultipartFile uploadFile = multiRequest.getFile("uploadFile");
		String fileName = uploadFile.getOriginalFilename();
		if (uploadFile != null && uploadFile.getSize() > 0) 
		{
			System.out.println("uploadFile size is :" + uploadFile.getSize());
			//检查登录用户的权限
			ReposAuth tempReposAuth = new ReposAuth();
			tempReposAuth.setUserId(login_user.getId());
			tempReposAuth.setReposId(reposId);
			if(reposService.getReposAuth(tempReposAuth) == null)
			{
				if(uploadFile.getSize() > 30*1024*1024)
				{
					rt.setError("非仓库授权用户最大上传文件不超过30M!");
					writeJson(rt, response);
					return;
				}
			}
			/*保存文件*/
			//get reposPath
			String reposPath = getReposRealPath(repos);
			//get doc parentPath
			String parentPath = getDocFullPath(parentId); //未指定则放到根目录
	
			String savePath =  reposPath + parentPath;
			//替换路径分隔符windows下自动替换为"\" linux 下为"/"
			//savePath = savePath.replace("\\", File.separator).replace("/", File.separator);
			System.out.println(savePath);

			if(uploadType == 1)	//新建文件则新建记录，否则
			{
				if(isFileExist(savePath + fileName) == true)
				{
					rt.setError("文件 ：" + fileName + " 已存在！");
					writeJson(rt, response);
					return;
				}
			}
			
			//保存文件信息
			String dstFileName = saveFile(uploadFile, savePath);
			System.out.println("saveFile return: " + dstFileName);
			if(dstFileName!=null&&!"".equals(dstFileName))
			{				
				//需要将文件Commit到SVN上去
				if(repos.getVerCtrl() == 1)
				{
					if(uploadType == 1)	//新增的文件
					{
						if(commitMsg == null || "".equals(commitMsg))
						{
							commitMsg = "upload add" + fileName + " by " + commitUser;
						}
						if(svnRealDocAdd(repos, parentPath, dstFileName, commitMsg, commitUser) == false)
						{
							delFile(savePath,dstFileName);	//该接口可以删除文件或空目录，还原现场，避免已存在文件无法增加回去
							rt.setError(dstFileName + " svnRealDocAdd失败！");
							writeJson(rt, response);	
							return;
						}
					}
					else
					{
						if(commitMsg == null || "".equals(commitMsg))
						{
							commitMsg = "upload replace " + fileName + " by " + commitUser;
						}
						if(svnRealDocCommit(repos, parentPath, dstFileName, commitMsg, commitUser) == false)
						{
							rt.setError(dstFileName + " svnRealDocCommit失败！");
							writeJson(rt, response);	
							return;
						}
					}
				}
				
				//新建数据库记录
				if(uploadType == 1)	//新建文件成功则新建记录
				{		
					System.out.println("文件新建成功");				
					//新建doc记录
					Doc doc = new Doc();
					doc.setName(dstFileName);
					doc.setContent("#" + dstFileName);
					doc.setType(1);
					doc.setPath(parentPath);
					doc.setVid(reposId);
					doc.setPid(parentId);
					if(reposService.addDoc(doc) == 0)
					{
						if(delFile(savePath,dstFileName))
						{
							String rollBackCommitMsg = "delete " + dstFileName + " due to db addDoc failed";
							//该接口可以删除文件或空目录，还原现场，避免已存在文件无法增加回去
							svnRealDocDelete(repos, parentPath, dstFileName, rollBackCommitMsg, commitUser);
						}
						rt.setError(dstFileName + " db addDoc失败！");
						writeJson(rt, response);	
						return;					
					}
					System.out.println("id: " + doc.getId());
					rt.setData(doc);
				}
				else //覆盖操作
				{
					System.out.println("文件更新成功");		
				}
			}
			else
			{
				rt.setError("文件：" + fileName + "保存失败！");
			}
		}
		else
		{
			rt.setError("文件上传失败！");
		}
		
		writeJson(rt, response);
	}
	
	private boolean svnRealDocCommit(Repos repos, String parentPath,
			String name, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		String svnPwd = repos.getSvnPwd();
		String savePath =  getReposRealPath(repos) + parentPath;
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			if(svnUtil.doCheckPath("rdata" + parentPath + name, -1) == false)	//检查文件是否已经存在于仓库中
			{
				if(svnUtil.doAddCommit(savePath + name,commitMsg) == false)
				{
					System.out.println(name + " svnAddCommit失败！");	
					return false;
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				if(svnUtil.doCommit(savePath + name,commitMsg) == false)
				{
					System.out.println(name + " svnCommit失败！");
					return false;
				}
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：" + name + " svnRealDocCommit异常！");
			return false;
		}		
		return true;
	}
	
	/**************** download Doc  ******************/
	/*@RequestMapping("/downloadDoc.do")
	public void downloadDoc(Integer id,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("downloadDoc id: " + id);

		ReturnAjax rt = new ReturnAjax();
		
		Doc doc = reposService.getDocInfo(id);
		if(doc==null){
			rt.setError("getDoc Failed: " + id);
		}else{
			//虚拟文件系统不支持实文件下载
			Repos repos = reposService.getRepos(doc.getVid());
			if(isRealFS(repos.getType()) == false)
			{
				rt.setError("虚拟文件系统不支持实文件下载!");
				writeJson(rt, response);
				return;
			}
			
			//文件(或目录)的相对路径（相对于所在仓库）
			String docPath = doc.getPath();	//文件或目录的相对路径
			//get ReposPath
			String reposPath = getReposPath(doc.getVid());
			//文件的真实全路径
			String srcPath = reposPath + docPath + doc.getName();
			System.out.println("srcPath" + srcPath);
			
			//用于下载的路径（文件或目录需要复制到dstPath才能用于下载）		
			String basePath = request.getRealPath("");	//web server的根路径
			String dstPath =  basePath + "/web/downloads/";	//存放临时下载文件的路径
			String dstFile = dstPath + doc.getName();	//目标文件或目录全	
			if(doc.getType() == 2) //目录
			{
				dstFile = dstPath + doc.getName() + ".zip";	
				System.out.println("dstFile" + dstFile);
				//如果是目录，则需要将目录打包后/web/downloads目录下，然后再计算URL给前台
				if(compressExe(srcPath,dstFile) == true)
				{
					System.out.println("压缩完成！");	
					doc.setPath("/web/downloads/"+doc.getName() + ".zip");
				}
				else
				{
					rt.setError("目录下载失败");
				}
			}
			else
			{
				System.out.println("dstFile" + dstFile);
				//如果是单个文件则复制到/web/downloads目录下
				if(copyFile(srcPath,dstFile,true) == true)
				{
					doc.setPath("/web/downloads/"+doc.getName());
				}
				else
				{
					rt.setError("文件下载失败");
				}
			}
			rt.setData(doc);
		}	
				
		writeJson(rt, response);
	}*/
	


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
			System.out.println("Doc 不存在");
			return;
		}
		
		//得到要下载的文件名
		String fileName = doc.getName();
		//fileName = new String(fileName.getBytes("iso8859-1"),"UTF-8");	//格式转换??
		//String realname = fileName.substring(fileName.indexOf("_")+1);
		String realname = fileName;
		
		//虚拟文件下载
		Repos repos = reposService.getRepos(doc.getVid());
		//虚拟文件系统下载，直接将数据库的文件内容传回去，未来需要优化
		if(isRealFS(repos.getType()) == false)
		{
			response.setHeader("content-disposition", "attachment;filename=" + realname);
			
			//创建输出流
			OutputStream out = response.getOutputStream();
			//创建缓冲区
			//输出缓冲区的内容到浏览器，实现文件下载
			String content = doc.getContent();
			out.write(content.getBytes(), 0, content.length());		
			//关闭输出流
			out.close();	
			return;
		}
		
		//实文件文件下载（是文件夹需要先压缩再下载）
		if(doc.getType() == 2)
		{
			realname = realname +".zip";
		}
		//get ReposPath
		String reposPath = getReposPath(doc.getVid());
				
		//get srcParentPath
		String srcParentPath = getParentPath(id);	//文件或目录的相对路径
		//文件的真实全路径
		String srcPath = reposPath + srcParentPath;
		if(doc.getType() == 1)
		{
			srcPath = reposPath + srcParentPath + doc.getName();			
		}
		System.out.println("srcPath:" + srcPath);
		
		String dstPath = srcPath;
		if(doc.getType() == 2) //目录
		{
			//判断用户临时空间是否存在，不存在则创建，存在则将压缩文件保存在临时空间里
			String userTmpDir = repos.getPath() + repos.getName() +  "/tmp/" + login_user.getName();
			File userDir = new File(userTmpDir);
			if(!userDir.exists())
			{
				if(createDir(userTmpDir) == false)
				{
					System.out.println("创建用户空间失败！");	
					rt.setError("用户未登录，请先登录！");
					writeJson(rt, response);
					return;
				}
			}
			dstPath = userTmpDir + "/" + doc.getName() + ".zip";
			
			System.out.println("dstFile" + dstPath);
			//开始压缩
			if(compressExe(srcPath,dstPath) == true)
			{
				System.out.println("压缩完成！");	
			}
			else
			{
				System.out.println("压缩失败！");	
				return;
			}
		}
		
		//开始下载 
		File file = new File(dstPath);
		
		//如果文件不存在
		if(!file.exists()){
			System.out.println(fileName + "不存在！");	
			//request.setAttribute("message", "您要下载的资源已被删除！！");
			//request.getRequestDispatcher("/message.jsp").forward(request, response);
			rt.setError(fileName + "不存在！");
			writeJson(rt, response);
			return;
		}
		
		//设置响应头，控制浏览器下载该文件
		response.setHeader("content-disposition", "attachment;filename=" + URLEncoder.encode(realname, "UTF-8"));
		//读取要下载的文件，保存到文件输入流
		FileInputStream in = new FileInputStream(dstPath);
		//创建输出流
		OutputStream out = response.getOutputStream();
		//创建缓冲区
		byte buffer[] = new byte[1024];
		int len = 0;
		//循环将输入流中的内容读取到缓冲区当中
		while((len=in.read(buffer))>0){
			//输出缓冲区的内容到浏览器，实现文件下载
			out.write(buffer, 0, len);
		}
		//关闭文件输入流
		in.close();
		//关闭输出流
		out.close();
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
		
		//get doc
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在！");
			writeJson(rt, response);			
			return;			
		}
		
		//获取仓库信息
		Repos repos = reposService.getRepos(doc.getVid());
		//get reposPath
		String reposPath = getReposPath(repos.getId());
		System.out.println("reposPath:" + reposPath);
		String parentPath = getDocFullPath(doc.getPid());		
		System.out.println("parentPath:" + parentPath);
		
		//检查用户是否有权限新增文件
		if(checkUserDeleteRight(rt,login_user.getId(),doc.getPid(),doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(docRecurDelete(id,rt,login_user) == false)
		{
			System.out.println("docRecurDelete Error ");
		}
		
		writeJson(rt, response);	
	}
	
	private boolean checkUserDeleteRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		// TODO Auto-generated method stub
		DocAuth docUserAuth = getDocUserAuth(userId,parentId,reposId);
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

	//获取仓库的实文件存储根路径
	public String getReposPath(Integer reposId)
	{
		Repos repos = reposService.getRepos(reposId);
		String reposPath = repos.getPath() + repos.getName() + "/data/rdata";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposPath End:" + reposPath);
		return reposPath;
	}
	
	public String getReposRealPath(Repos repos)
	{
		String reposPath = repos.getPath() + repos.getName() + "/data/rdata";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposRealPath End:" + reposPath);
		return reposPath;
	}
	
	public String getReposVirtualPath(Repos repos)
	{
		String reposPath = repos.getPath() + repos.getName() + "/data/vdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getVirtualPath End:" + reposPath);
		return reposPath;
	}
	
	//get parentPath: 如果是LeafNode则返回其parentPath，如果是ParentNode则返回全路径
	public String getParentPath(Integer id)
	{
		String parentPath = "/";
		Doc doc = reposService.getDocInfo(id); //获取当前doc的信息
		if(doc != null)
		{
			if(doc.getType() == 2)
			{
				parentPath = getParentPath(doc.getPid()) + doc.getName() + "/";
			}
			else
			{
				parentPath = getParentPath(doc.getPid());				
			}
		}
		return parentPath;
	}
	
	//get doc FullPath:文件不存在，我应该返回什么呢？？
	public String getDocFullPath(Integer id)
	{
		Doc doc = reposService.getDocInfo(id); //获取当前doc的信息
		if(doc == null)
		{
			System.out.println("Doc 不存在  id: " + id);
			return "/";
		}
		
		String parentPath = getParentPath(id);
		String docFullPath =  parentPath;
		if(doc.getType() == 1)
		{
			docFullPath = docFullPath + doc.getName();
		}
		return docFullPath;
	}
	
	//doc递归删除函数
	public boolean docRecurDelete(Integer id,ReturnAjax rt,User login_user)
	{
		//取出所有pid==id的doc记录
		Doc qDoc = new Doc();
		qDoc.setPid(id);
		List <Doc> list = reposService.getDocList(qDoc);
		if(list != null)
		{
			for(int i = 0 ; i < list.size() ; i++) {
				Doc subDoc = list.get(i);
				if(docRecurDelete(subDoc.getId(),rt,login_user) == false)
				{
					return false;
				}
			};
		}
			
		//删除当前文件
		Doc doc = reposService.getDocInfo(id);
		if(doc != null)
		{
			Repos repos = reposService.getRepos(doc.getVid());
			String reposPath = getReposPath(doc.getVid());
			if(isRealFS(repos.getType()))	//实文件系统需要删除文件
			{	
				/*删除文件或目录*/
				String docPath = doc.getPath();
				System.out.println("docPath: " + docPath);
				if(deleteRealDoc(reposPath, docPath, doc.getName(),doc.getType()) == false)
				{
					rt.setError(docPath + doc.getName() + "删除失败！");
					return false;
				}
				
				//需要将文件Commit到SVN上去
				if(repos.getVerCtrl() == 1)
				{
					String commitMsg = "delete " + doc.getName();
					String commitUser = login_user.getName();
					if(svnRealDocDelete(repos,docPath,doc.getName(),commitMsg,commitUser) == false)
					{
						//这里需要恢复文件 recoverRealDoc();
						rt.setError(doc.getName() + " svnRealDocDelete失败！");
						return false;
					}
				}
			}
			/*删除doc记录*/
			if(reposService.deleteDoc(id) == 0)
			{
				//这里需要恢复文件 recoverRealDoc();
				rt.setError(doc.getName() + " db DeleteDoc失败！");
				return false;
			}
			return true;
		}
		return true;	
	}
	
	private boolean deleteRealDoc(String reposPath, String docPath,
			String name, Integer type) {
		// TODO Auto-generated method stub
		if(type == 1)
		{
			if(delFile(reposPath + docPath,name) == false)
			{
				System.out.println(docPath + name + "删除失败！");
				return false;
			}
		}
		else
		{
			if(delDir(reposPath + docPath + name) == false)
			{
				System.out.println(docPath + name + "删除失败！");
				return false;
			}
		}
		return true;
	}

	private boolean svnRealDocDelete(Repos repos, String parentPath, String name,
			String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		String svnPwd = repos.getSvnPwd();
		String remoteDocPath = getRemoteRealDocPath(parentPath,name);
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			if(svnUtil.doCheckPath(remoteDocPath,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
			{
				if(svnUtil.doDeleteCommit(getReposRealPath(repos) + parentPath + name,commitMsg) == false)
				{
					System.out.println(name + " svnDeleteCommit失败！");
					return false;
				}
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：" + name + " svnDeleteCommit异常！");
			return false;
		}
		return true;
	}

	private String getRemoteRealDocPath(String docPath, String name) {
		// TODO Auto-generated method stub
		String remoteDocPath = "rdata" + docPath + name;
		return remoteDocPath;
	}
	
	private String getRemoteVirtualDocPath(Integer docId) {
		// TODO Auto-generated method stub
		String remoteDocPath = "vdata/" + docId;
		return remoteDocPath;
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
		Repos repos = reposService.getRepos(doc.getVid());
		String reposPath = getReposRealPath(repos);
		String parentPath = getParentPath(doc.getPid());
		String oldname = doc.getName();
		String srcRemotePath = getRemoteRealDocPath(parentPath,oldname);
		String dstRemotePath = getRemoteRealDocPath(parentPath,newname);
		
		if(isRealFS(repos.getType()))	//需要先修改实际文件的名字
		{
			if(renameRealDoc(reposPath,parentPath,oldname,newname) == false)
			{
				rt.setError(oldname + " renameRealDoc失败！");
				writeJson(rt, response);	
				return;
			}
			else
			{
				//需要将文件Commit到SVN上去
				if(repos.getVerCtrl() == 1)
				{
					if(commitMsg == null || "".equals(commitMsg))
					{
						commitMsg = "rename " + oldname + " to " + newname + " by" + commitUser;
					}
					if(svnRealDocMove(repos,srcRemotePath,dstRemotePath,commitMsg,commitUser) == false)
					{
						renameFile(reposPath + parentPath,newname,oldname);
						rt.setError("svnRealDocMove Failed！");
						writeJson(rt, response);	
						return;	
					}
				}
				
				/*更新doc记录*/
				doc.setName(newname);
				if(reposService.updateDoc(doc) == 0)
				{
					if(renameFile(reposPath + parentPath,newname,oldname))
					{
						//Move it back
						String rollBackCommitMsg = "rename " + newname + " back to " + oldname + " by" + commitUser;
						svnRealDocMove(repos,dstRemotePath,srcRemotePath,rollBackCommitMsg,commitUser);
					}
					rt.setError("db Rename Failed！");
					writeJson(rt, response);	
					return;	
				}
				
				//更新所有子目录的Path信息，以后不再需要了，docPath总是重新计算的，该字段将被废弃
				//docPathRecurUpdate(id,doc.getPid());	
			}
		}
		else
		{
			/*虚拟文件系统只更新doc记录*/
			doc.setName(newname);
			if(reposService.updateDoc(doc) == 0)
			{
				rt.setError("db Rename Failed！");
				writeJson(rt, response);	
				return;
			}
		}
		
		writeJson(rt, response);	
	}
	
	private boolean svnRealDocMove(Repos repos, String srcRemotePath,
			String dstRemotePath, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		String svnPwd = repos.getSvnPwd();
		if(svnMove(reposURL,svnUser,svnPwd,srcRemotePath,dstRemotePath,commitMsg) == false)
		{
			System.out.println("svnMove Failed！");
			return false;
		}
		return true;
	}

	private boolean renameRealDoc(String reposPath, String parentPath,String oldname, String newname) {
		// TODO Auto-generated method stub
		/*rename文件或目录*/
		if(isFileExist(reposPath + parentPath + newname) == true)
		{
			System.out.println(newname + "已存在！");	
			return false;
		}
		
		if(isFileExist(reposPath + parentPath + oldname) == false)
		{
			System.out.println(oldname + "不存在！");
			return false;
		}
		
		return renameFile(reposPath + parentPath,oldname,newname);
	}

	//更新doc和其所有子节点的Path:该函数只更新Path信息，不会改变节点间的逻辑关系
	void docPathRecurUpdate(Integer id,Integer dstPid)
	{
		//移动当前节点
		Doc doc = reposService.getDocInfo(id);
		Integer orgPid = doc.getPid();
		System.out.println("docPathRecurUpdate id:" + id + " orgPid: " + orgPid + " dstPid: " + dstPid);
		
		String dstParentPath = getDocFullPath(dstPid);		
		
		//该函数只更新路径信息，而不更改实际映射关系，因此当dstPid != orgPid时，不做处理，并且要报错
		if(orgPid.equals(dstPid))
		{
			/*更新doc记录*/
			doc.setPath(dstParentPath);
			reposService.updateDoc(doc);
		}
		
		//set query condition: 取出所有pid==id的doc记录,更新其ParentPath
		Doc queryConditon = new Doc();
		queryConditon.setPid(id);
		List <Doc> list = reposService.getDocList(queryConditon);
		if(list != null)
		{
			for(int i = 0 ; i < list.size() ; i++) {
				Doc subDoc = list.get(i);
				Integer subDocId = subDoc.getId();
				Integer suDocDstPid = id;
				docPathRecurUpdate(subDocId,suDocDstPid);
			};
		}
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
		if(docRecurMove(id,dstPid,vid,rt,commitMsg,login_user) == false)
		{
			System.out.println("docRecurMove Error");
		}
		
		writeJson(rt, response);	
	}
	
	private boolean svnMove(String reposURL, String svnUser, String svnPwd,
			String srcRemotePath, String dstRemotePath, String commitMsg) {
		// TODO Auto-generated method stub
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			if(svnUtil.doMove(srcRemotePath, dstRemotePath,commitMsg) == false)
			{
				return false;
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//doc递归移动函数
	public boolean docRecurMove(Integer id,Integer dstPid,Integer vid,ReturnAjax rt,String commitMsg, User login_user)
	{
		//移动当前节点
		Doc doc = reposService.getDocInfo(id);
		if(doc == null)
		{
			rt.setError("文件不存在 id:" + id);
			return false;
		}
		Integer orgPid = doc.getPid();
		System.out.println("docRecurMove id:" + id + " orgPid: " + orgPid + " dstPid: " + dstPid);
		
		String orgParentPath = getDocFullPath(orgPid);		
		
		String dstParentPath = getDocFullPath(dstPid);
		
		Repos repos = reposService.getRepos(vid);
		String reposPath = getReposRealPath(repos);
		
		String orgPath = reposPath + orgParentPath;
		String dstPath = reposPath + dstParentPath;
		String filename = doc.getName();
		System.out.println("filename: " + filename + " orgPath: " + orgPath + " dstPath: " + dstPath);
		String srcRemotePath = getRemoteRealDocPath(orgParentPath,filename);
		String dstRemotePath = getRemoteRealDocPath(dstParentPath,filename);
		String commitUser = login_user.getName();		
		
		if(isRealFS(repos.getType()))
		{
			//只有当orgPid != dstPid 不同时才进行文件移动，否则文件已在正确位置，只需要更新Doc记录
			if(!orgPid.equals(dstPid))
			{
				System.out.println("docRecurMove id:" + id + " orgPid: " + orgPid + " dstPid: " + dstPid);
				if(moveRealDoc(filename,orgPath,dstPath) == false)
				{
					System.out.println("文件: " + filename + " 移动失败");
					rt.setError("文件移动失败！");
					return false;
				}
				
				//需要将文件Commit到SVN上去：先执行svn的移动
				if(repos.getVerCtrl() == 1)
				{
					if(commitMsg == null || "".equals(commitMsg))
					{
						commitMsg = "move " + filename + " to " + dstParentPath;
					}
					if(svnRealDocMove(repos, srcRemotePath, dstRemotePath, commitMsg, commitUser) == false)
					{
						changeDirectory(filename,dstPath,orgPath,false);	//我们需要假设，还原总是能够成功，当然及时失败其实也是无所谓的，至少很能获取到历史版本，或者重新上传该文件来还原该文件
						System.out.println("文件: " + filename + " svnRealDocMove失败");
						rt.setError("svnRealDocMove失败！");
						return false;						
					}
				}
				
			}
			/*更新doc记录*/
			doc.setPath(dstParentPath);
			doc.setPid(dstPid);
			if(reposService.updateDoc(doc) == 0)
			{
				if(changeDirectory(filename,dstPath,orgPath,false) == false)
				{
					String rollBackCommitMsg  = "move " + filename + " back to " + dstParentPath;
					svnRealDocMove(repos, dstRemotePath, srcRemotePath, rollBackCommitMsg, commitUser);
				}
				System.out.println("文件: " + filename + " svnRealDocMove失败");
				rt.setError("svnRealDocMove失败！");
				return false;						
			}
		}
		else
		{
			/*更新doc记录*/
			doc.setPath(dstParentPath);
			doc.setPid(dstPid);
			reposService.updateDoc(doc);
		}
		
		//set query condition: 取出所有pid==id的doc记录,更新其pid和ParentPath
		Doc queryConditon = new Doc();
		queryConditon.setPid(id);
		List <Doc> list = reposService.getDocList(queryConditon);
		if(list != null)
		{
			for(int i = 0 ; i < list.size() ; i++) {
				Doc subDoc = list.get(i);
				Integer subDocId = subDoc.getId();
				Integer suDocDstPid = id;
				if(docRecurMove(subDocId,suDocDstPid,vid,rt,commitMsg,login_user) == false)
				{
					return false;
				}
			};
		}
		return true;	
	}
	
	private boolean moveRealDoc(String filename, String orgPath, String dstPath) {
		// TODO Auto-generated method stub
		//检查orgFile是否存在
		if(isFileExist(orgPath+filename) == false)
		{
			System.out.println("文件: " + filename + " 不存在");
			return false;
		}
		
		//检查dstFile是否存在
		if(isFileExist(dstPath+filename) == true)
		{
			System.out.println("文件: " + filename + " 已存在");
			return false;
		}
	
		/*移动文件或目录*/		
		if(changeDirectory(filename,orgPath,dstPath,false) == false)	//强制覆盖
		{
			System.out.println("文件: " + filename + " 移动失败");
			return false;
		}
		return true;
	}

	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer id,Integer dstPid,Integer vid,String commitMsg,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("copyDoc id: " + id + " dstPid: " + dstPid + " vid: " + vid);
		
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
	
		//检查用户是否有目标目录权限新增文件
		if(checkUserAddRight(rt,login_user.getId(),dstPid,vid) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(docRecurCopy(id,dstPid,vid,rt,false,commitMsg,login_user) == false)
		{
			System.out.println("docRecurCopy Error");	
		}
		
		writeJson(rt, response);	
	}
	
	private boolean svnCopy(String reposURL, String svnUser, String svnPwd,
			String srcRemotePath, String dstRemotePath, String commitMsg) {
		// TODO Auto-generated method stub
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			
			if(svnUtil.doCopy(srcRemotePath,dstRemotePath,commitMsg) == false)
			{
				return false;
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//doc递归复制函数
	public boolean docRecurCopy(Integer id,Integer dstPid,Integer vid,ReturnAjax rt,boolean RecurFlag,String commitMsg, User login_user)
	{
		Doc doc = reposService.getDocInfo(id);
		String orgParentPath = getParentPath(id);		
		
		String dstParentPath = getDocFullPath(dstPid);
				
		Repos repos = reposService.getRepos(vid);
		String reposPath = getReposPath(vid);
		
		String orgPath = reposPath + orgParentPath;		
		String dstPath = reposPath + dstParentPath;
		String filename = doc.getName();
		System.out.println("filename: " + filename + " orgPath: " + orgPath + " dstPath: " + dstPath);
		String srcRemotePath = getRemoteRealDocPath(orgParentPath, doc.getName());
		String dstRemotePath = getRemoteRealDocPath(dstParentPath,doc.getName());
		String commitUser = login_user.getName();
		
		if(isRealFS(repos.getType()))
		{	
			//复制文件或目录，注意这个接口只会复制单个文件
			if(copyRealDoc(orgPath+filename,dstPath+filename,doc.getType()) == false)
			{
				System.out.println("文件: " + filename + " 复制失败");
				rt.setError("文件复制失败！");
				return false;
			}
				
			//在svn上执行对应的操作
			if(repos.getVerCtrl() == 1)
			{	
				String tempCommitMsg = commitMsg;
				if(commitMsg == null || "".equals(commitMsg))
				{
					tempCommitMsg = "copy " + doc.getName() + " to " + dstParentPath;
				}
				if(svnRealDocCopy(repos, srcRemotePath, dstRemotePath, tempCommitMsg, commitUser) == false)
				{
					deleteRealDoc(reposPath,dstParentPath, doc.getName(),doc.getType());
					System.out.println("文件: " + filename + " svnRealDocCopy失败");
					rt.setError("文件svnRealDocCopy失败！");
					return false;	
				}
				
				/*add new doc记录*/
				doc.setId(null);
				doc.setPath(dstParentPath);
				doc.setPid(dstPid);
				if(reposService.addDoc(doc) == 0)
				{
					if(deleteRealDoc(reposPath,dstParentPath, doc.getName(),doc.getType()))
					{
						//删除刚才新增的目录或文件
						//理论上还需要进行版本仓库的文件删除
						String rollBackCommitMsg = "delete " + doc.getName() + " under " + dstParentPath;						
						svnRealDocDelete(repos, dstParentPath, filename, rollBackCommitMsg, commitUser );
					}
					System.out.println("文件: " + filename + " db addDoc失败");
					rt.setError("db add失败！");
					return false;	
				}
				System.out.println("id: " + doc.getId());
			}
		}
		else
		{
			/*add new doc记录*/
			doc.setId(null);
			doc.setPath(dstParentPath);
			doc.setPid(dstPid);
			if(reposService.addDoc(doc) == 0)
			{
				System.out.println("文件: " + filename + " db addDoc失败");
				rt.setError("db add失败！");
				return false;	
			}
			System.out.println("id: " + doc.getId());
		}
		//只返回最上层的doc记录
		if(rt.getData() == null)
		{
			rt.setData(doc);
		}
		
		//设置了递归的话，会自动进行子目录的复制，但前台会不知道已经成功与否，因此目前配合前台使用时，该标记需要设置成false
		if(RecurFlag)	
		{
			//set query condition: 取出所有pid==id的doc记录,更新其pid和ParentPath
			Doc queryConditon = new Doc();
			queryConditon.setPid(id);
			List <Doc> list = reposService.getDocList(queryConditon);
			if(list != null)
			{
				for(int i = 0 ; i < list.size() ; i++) {
					Doc subDoc = list.get(i);
					Integer subDocId = subDoc.getId();
					Integer suDocDstPid = doc.getId();
					if(docRecurCopy(subDocId,suDocDstPid,vid,rt,RecurFlag,commitMsg,login_user) == false)
					{
						return false;
					}
				};
			}
		}
		return true;	
	}
	private boolean svnRealDocCopy(Repos repos, String srcRemotePath,
			String dstRemotePath, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		String svnPwd = repos.getSvnPwd();
		if(svnCopy(reposURL,svnUser,svnPwd,srcRemotePath,dstRemotePath,commitMsg) == false)
		{
			System.out.println("文件: " + srcRemotePath + " svnCopy失败");
			return false;
		}
		return true;
	}

	private boolean copyRealDoc(String srcDocPath, String dstDocPath, Integer type) {
		if(isFileExist(srcDocPath) == false)
		{
			System.out.println("文件: " + srcDocPath + " 不存在");
			return false;
		}
		
		if(isFileExist(dstDocPath) == true)
		{
			System.out.println("文件: " + dstDocPath + " 已存在");
			return false;
		}
		// TODO Auto-generated method stub
		try {
			
			if(type == 2)	//如果是目录则创建目录
			{
				if(false == createDir(dstDocPath))
				{
					System.out.println("目录: " + dstDocPath + " 创建");
					return false;
				}
			}
			else	//如果是文件则复制文件
			{
				if(copyFile(srcDocPath,dstDocPath,false) == false)	//强制覆盖
				{
					System.out.println("文件: " + srcDocPath + " 复制失败");
					return false;
				}
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：文件复制失败！");
			return false;
		}
		return true;
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
	
		//检查用户是否有文件读取权限
		if(checkUseAccessRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
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
	
	private boolean checkUseAccessRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		// TODO Auto-generated method stub
		DocAuth docUserAuth = getDocUserAuth(userId,docId,reposId);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == null || docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该文件，请联系管理员");
				return false;
			}
		}
		return true;
	}

	/****************   get Document Content ******************/
	@RequestMapping("/getDocContent.do")
	public void getDocContent(Integer id,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getDocContent id: " + id);
		
		ReturnAjax rt = new ReturnAjax();
		
		Doc doc = reposService.getDoc(id);
		rt.setData(doc.getContent());
		//System.out.println(rt.getData());

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
		
		//只更新内容部分
		Doc newDoc = new Doc();
		newDoc.setId(id);
		newDoc.setContent(content);
		//System.out.println("before: " + content);
		
		if(reposService.updateDoc(newDoc) == 0)
		{
			rt.setError("更新文件失败");
			writeJson(rt, response);			
			return;			
		}	
		
		//Save the content to virtual file
		String reposVirtualPath = getReposVirtualPath(repos);
		if(saveVirtualDoc(reposVirtualPath, id, content) == true)
		{
			svnVirtualDocCommit(repos, id, commitMsg, login_user.getName());
		}
		
		writeJson(rt, response);
	}
	
	private boolean svnVirtualDocCommit(Repos repos, Integer docId,String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		String reposURL = repos.getSvnPath();
		String svnUser = repos.getSvnUser();
		String svnPwd = repos.getSvnPwd();
		String savePath =  getReposVirtualPath(repos);
		try {
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
			
			if(commitMsg == null || "".equals(commitMsg))
			{
				commitMsg = "edit " + docId + " by " + commitUser;
			}
			if(svnUtil.doCheckPath(getRemoteVirtualDocPath(docId), -1) == false)	//检查文件是否已经存在于仓库中
			{
				if(svnUtil.doAddCommit(savePath + docId,commitMsg) == false)
				{
					System.out.println(docId + " svnAddCommit失败！");	
					return false;
				}
			}
			else	//如果已经存在，则只是将修改的内容commit到服务器上
			{
				if(svnUtil.doCommit(savePath + docId,commitMsg) == false)
				{
					System.out.println(docId + " svnCommit失败！");
					return false;
				}
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			System.out.println("系统异常：" + docId + " svnAdd异常！");
			return false;
		}		
		return true;
	}
	
	private boolean saveVirtualDoc(String reposVirtualPath, Integer docId, String content) {
		// TODO Auto-generated method stub
		String mdFilePath = reposVirtualPath + docId + "/content.md";
		//创建文件输入流
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(mdFilePath);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		try {
			out.write(content.getBytes(), 0, content.length());
			//关闭输出流
			out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//this interface is for auto save of the virtual doc edit
	@RequestMapping("/tmpSaveVirtualDocContent.do")
	public void tmpSaveVirtualDocContent(Integer id,String content,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("updateDocContent id: " + id);
		
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
		
		//Save the content to virtual file
		String reposUserTmpPath = getReposUserTmpPath(repos,login_user.getName());
		tmpSaveVirtualDoc(reposUserTmpPath,id,content);
		
		writeJson(rt, response);
	}
	
	private boolean tmpSaveVirtualDoc(String reposUserTmpPath , Integer docId, String content)
	{
		// TODO Auto-generated method stub
		String virtualDocTmpPath = reposUserTmpPath + docId + "/";
		File tmpDir = new File(virtualDocTmpPath);
		if(!tmpDir.exists())
		{
			if(createTmpVirtualDoc(reposUserTmpPath, docId, content) == false)
			{
				System.out.println("createVirtualDoc Failed");
				return false;
			}
		}
		
		String mdFilePath = reposUserTmpPath + docId + "/content.md";
		//创建文件输入流
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(mdFilePath);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		//将前台发回的文件内容保存进文件
		try {
			out.write(content.getBytes(), 0, content.length());
			out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	private boolean createTmpVirtualDoc(String reposUserTmpPath, Integer docId,
			String content) {
		// TODO Auto-generated method stub
		String vTmpDocPath = reposUserTmpPath	+ docId + "/";
		System.out.println("vTmpDocPath: " + vTmpDocPath);
		if(isFileExist(vTmpDocPath) == true)
		{
			System.out.println("目录 " +vTmpDocPath + "　已存在！");
			return false;
		}
			
		if(false == createDir(vTmpDocPath))
		{
			System.out.println("目录 " + vTmpDocPath + " 创建失败！");
			return false;
		}
		if(createDir(vTmpDocPath + "res") == false)
		{
			System.out.println("目录 " + vTmpDocPath + "/res" + " 创建失败！");
			return false;
		}
		if(createFile(vTmpDocPath,"content.md") == false)
		{
			System.out.println("目录 " + vTmpDocPath + "/content.md" + " 创建失败！");
			return false;			
		}
		if(content !=null && !"".equals(content))
		{
			saveVirtualDoc(reposUserTmpPath, docId, content);
		}
		
		return true;
	}

	private String getReposUserTmpPath(Repos repos, String userName) {
		// TODO Auto-generated method stub
		String reposTmpVirtualPath = repos.getPath() + "tmp/" + userName + "/"; 
		return reposTmpVirtualPath;
	}

	private boolean checkUserEditRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		// TODO Auto-generated method stub
		DocAuth docUserAuth = getDocUserAuth(userId,docId,reposId);
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
	
	/****************   SvnTest ******************/
	@RequestMapping("/svnTest.do")
	public void svnTest(String url,String svnUser,String svnPwd, String svnPath,String wcPath,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("svnTest url:" + url + " svnUser:" + svnUser  + " svnPwd:" + svnPwd + " svnPath:" + svnPath + " wcPath:" + wcPath);
		
		ReturnAjax rt = new ReturnAjax();
		
		//Local Disk Repos Create(FSFS type),但这玩意似乎不好用，因为没法用客户端进行访问，迁移是个麻烦
		//System.out.println("仓库创建测试");
		//url = SVNUtil.CreateRepos("testRepos","D:/DocSysSvnReposes/");
		//System.out.println("url " + url);
		
		//svnUtil Init
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(url, svnUser, svnPwd);
		
		//svnUtil.remoteAddDir("A","A.txt");
		//svnUtil.remoteAddDir("B","B.txt");
		//svnUtil.remoteAddDir("C","C.txt");
		
		//显示目录结构
		System.out.println("显示目录结构");
		svnUtil.DisplayReposTree();	
		
		//System.out.println("显示文件历史");
		//svnUtil.DisplayHistory(svnPath,0,-1);
		
		//Commit
		//System.out.println("CommitTest");
		//svnUtil.CommitTest();	
		
		System.out.println("开始同步");
		try {
			svnUtil.doSyncUpForDelete(wcPath, "");
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return;
		}
		
		//显示目录结构
		System.out.println("显示目录结构");
		svnUtil.DisplayReposTree();	
		
		try {
			if(svnUtil.doCheckOut("",wcPath) == false)
			{
				System.out.println("CheckOut Failed");
				return;
			}
		} catch (SVNException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
			return;
		}
		
		System.out.println("Schedule for addd");
		try {
			svnUtil.doScheduleForAdd(wcPath,"");
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return;
		}
		
		try {
			if(svnUtil.doCommit(wcPath, "Commit test") == false)
			{
				System.out.println("do Commit Failed");
				return;
			}
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return;
		}
		/*
		//显示目录结构
		System.out.println("显示目录结构");
		svnUtil.DisplayReposTree();	
		
		//显示文件历史
		System.out.println("显示文件历史");
		svnUtil.DisplayHistory(svnPath,0,-1);	
		
		//显示文件内容
		System.out.println("显示文件内容");
		svnUtil.DisplayFile(svnPath);	
		
		//Commit
		System.out.println("CommitTest");
		svnUtil.CommitTest();	

		//Commit
		System.out.println("ExportTest");
		svnUtil.ExportTest();
		
		//Local Disk Repos Create(FSFS type),但这玩意似乎不好用，因为没法用客户端进行访问，迁移是个麻烦
		System.out.println("仓库创建测试");
		svnUtil.CreateRepos("testRepos","D:/DocSysSvnReposes/");
		
		//working copy 操作测试
		try {
			svnUtil.WorkingCopyTest(url,svnUser,svnPwd,wcPath);
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		*/
		
		writeJson(rt, response);
	}
}
	