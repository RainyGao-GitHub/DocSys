package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import util.ReturnAjax;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.controller.BaseController;
import com.alibaba.fastjson.JSONObject;

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
2、路径定义规则
(1) 仓库路径
 reposPath: 仓库根路径，以"/"结尾
 reposRPath: 仓库实文件存储根路径,reposPath + "data/rdata/"
 reposVPath: 仓库虚文件存储根路径,reposPath + "data/vdata/"
 reposRefRPath: 仓库实文件存储根路径,reposPath + "refData/rdata/"
 reposRefVPath: 仓库虚文件存储根路径,reposPath + "refData/vdata/"
 reposUserTempPath: 仓库虚文件存储根路径,reposPath + "tmp/userId/" 
(2) parentPath: 该变量通过getParentPath获取，如果是文件则获取的是其父节点的目录路径，如果是目录则获取到的是目录路径，以空格开头，以"/"结尾
(3) 文件/目录相对路径: docRPath = parentPath + doc.name docVName = HashValue(docRPath)  末尾不带"/"
(4) 文件/目录本地全路径: localDocRPath = reposRPath + parentPath + doc.name  localVDocPath = repoVPath + HashValue(docRPath) 末尾不带"/"
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
		
		if(commitMsg == null)
		{
			commitMsg = "addDoc " + name;
		}
		addDoc(name,type,null,reposId,parentId,commitMsg,commitUser,login_user,rt);
		
		writeJson(rt, response);	
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
		deleteDoc(id,reposId, parentId, commitMsg, commitUser, login_user, rt);
		writeJson(rt, response);	
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
			rt.setError("虚拟文件系统不支持实体文件上传!");
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
		if (uploadFile != null) 
		{
			String fileName = uploadFile.getOriginalFilename();
			System.out.println("uploadFile size is :" + uploadFile.getSize());
			//Get File Size Limitation
			Integer MaxFileSize = getMaxFileSize();	//获取系统最大文件限制
			if(MaxFileSize != null)
			{
				if(uploadFile.getSize() > MaxFileSize.longValue()*1024*1024)
				{
					rt.setError("上传文件超过 "+ MaxFileSize + "M");
					writeJson(rt, response);
					return;
				}
			}
			
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
			//get reposRPath
			String reposRPath = getReposRealPath(repos);
			//get doc parentPath
			String parentPath = getParentPath(parentId); //未指定则放到根目录
	
			String localDocParentPath = reposRPath + parentPath;
			//替换路径分隔符windows下自动替换为"\" linux 下为"/"
			//savePath = savePath.replace("\\", File.separator).replace("/", File.separator);
			System.out.println(localDocParentPath);
			
			if(commitMsg == null)
			{
				commitMsg = "uploadDoc " + fileName;
			}
			if(uploadType == 1)	//新建文件则新建记录，否则
			{
				addDoc(fileName, 1, uploadFile, reposId, parentId, commitMsg, commitUser, login_user, rt);
			}
			else
			{
				updateDoc(docId, uploadFile, reposId, parentId, commitMsg, commitUser, login_user, rt);
			}	
		}
		else
		{
			rt.setError("文件上传失败！");
		}
		writeJson(rt, response);
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
		
		if(commitMsg == null)
		{
			commitMsg = "copyDoc " + doc.getName();
		}
		copyDoc(id,doc.getName(),doc.getType(),vid,doc.getPid(),dstPid,commitMsg,commitUser,login_user,rt);
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
		String parentPath = getParentPath(doc.getPid());
		//String docRPath = parentPath + doc.getName();	
		String docVName = getDocVPath(parentPath,doc.getName());
		//Save the content to virtual file
		String reposUserTmpPath = getReposUserTmpPath(repos,login_user.getName());
		saveVirtualDocContent(reposUserTmpPath,docVName,content);
		
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
		
		//get reposRPath
		String reposRPath = getReposRealPath(repos);
				
		//get srcParentPath
		String srcParentPath = getParentPath(id);	//文件或目录的相对路径
		//文件的真实全路径
		String srcPath = reposRPath + srcParentPath;
		if(doc.getType() == 1)
		{
			srcPath = srcPath + doc.getName();			
		}
		System.out.println("doGet() srcPath:" + srcPath);
		
		String dstPath = srcPath;
		if(doc.getType() == 2) //目录
		{
			//判断用户临时空间是否存在，不存在则创建，存在则将压缩文件保存在临时空间里
			String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/" + login_user.getId();
			File userDir = new File(userTmpDir);
			if(!userDir.exists())
			{
				if(createDir(userTmpDir) == false)
				{
					System.out.println("doGet() 创建用户空间失败:" + userTmpDir);	
					rt.setError("创建用户空间 " + userTmpDir + " 失败");
					writeJson(rt, response);
					return;
				}
			}
			dstPath = userTmpDir + "/" + doc.getName() + ".zip";
			
			System.out.println("doGet() dstPath" + dstPath);
			//开始压缩
			if(compressExe(srcPath,dstPath) == true)
			{
				System.out.println("压缩完成！");	
			}
			else
			{
				System.out.println("doGet() 压缩失败！");
				rt.setError("压缩  " + dstPath + " 失败");
				writeJson(rt, response);
				return;
			}
		}
		
		//开始下载 
		File file = new File(dstPath);
		
		//如果文件不存在
		if(!file.exists()){
			System.out.println("doGet() " + dstPath + " 不存在！");	
			//request.setAttribute("message", "您要下载的资源已被删除！！");
			//request.getRequestDispatcher("/message.jsp").forward(request, response);
			rt.setError(dstPath + " 不存在！");
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
	
	/********************************** Functions For Application Layer****************************************/
	//底层addDoc接口
	private void addDoc(String name, Integer type, MultipartFile uploadFile,Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		Repos repos = reposService.getRepos(reposId);
		//get parentPath
		String parentPath = getParentPath(parentId);
		String reposRPath = getReposRealPath(repos);
		String localDocRPath = reposRPath + parentPath + name;
		
		//虚拟文静系统不支持新建实体文件
		if(isRealFS(repos.getType()) == false) //0：虚拟文件系统   1： 普通文件系统	
		{
			//虚拟文件系统只能创建目录
			if(type == 1)
			{
				rt.setError("虚拟文件系统不能创建实体文件");
				System.out.println("虚拟文件系统不能创建实体文件");
				return;
			}
		}
		
		//判断目录下是否有同名节点 
		if(isNodeExist(name,parentId,reposId) == true)
		{
			rt.setError("Node: " + name +" 已存在！");
			//writeJson(rt, response);
			return;
		}
		
		//Check if parentDoc was absolutely locked (LockState == 2)
		Integer parentLockState = getParentLockState(parentId,rt);
		if(parentLockState == 2)
		{
			System.out.println("ParentNode: " + parentId +" is locked！");
			//writeJson(rt, response);
			return;			
		}
			
		//新建doc记录,并锁定
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
		doc.setState(2);	//doc的状态为不可用
		doc.setLockBy(login_user.getId());	//LockBy login_user, it was used with state
		if(reposService.addDoc(doc) == 0)
		{
			rt.setError("Add Node: " + name +" Failed！");
			//writeJson(rt, response);
			return;
		}
		System.out.println("id: " + doc.getId());
		
		/*创建实文件Entry：新建文件或目录*/
		if(createRealDoc(reposRPath,parentPath,name,type,uploadFile) == false)
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
			return;
		}
		
		//commit to history db
		if(svnRealDocAdd(repos,parentPath,name,type,commitMsg,commitUser) == false)
		{
			System.out.println("svnRealDocAdd Failed");
			String MsgInfo = "svnRealDocAdd Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(deleteFile(localDocRPath) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(doc.getId()) == 0)
			{
				MsgInfo += " and delete Node Failed";						
			}
			rt.setError(MsgInfo);
			//writeJson(rt, response);	
			return;
		}
		
		//创建虚拟文件目录：用户编辑保存时再考虑创建
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getDocVPath(parentPath, doc.getName());
		if(createVirtualDoc(reposVPath,docVName,"#"+name) == true)
		{
			if(svnVirtualDocAdd(repos, docVName, commitMsg, commitUser) ==false)
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
		
		
		//启用doc
		if(unlockDoc(doc.getId(),login_user) == false)
		{
			rt.setError("unlockDoc Failed");
			//writeJson(rt, response);	
			return;
		}
		rt.setData(doc);
	}
	

	//底层deleteDoc接口
	private void deleteDoc(Integer docId, Integer reposId,Integer parentId, 
				String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		//是否需要检查subDoc is locked? 不需要！ 因为如果doc有subDoc那么deleteRealDoc会抱错
		
		//Try to lock the Doc
		Doc doc = lockDoc(docId,2,login_user,rt);
		if(doc == null)
		{
			System.out.println("Failed to lock Doc: " + docId);
			return;			
		}
		
		Repos repos = reposService.getRepos(reposId);
		//get parentPath
		String parentPath = getParentPath(parentId);		
		//get RealDoc Full ParentPath
		String reposRPath = getReposRealPath(repos);
		//get doc RealPath
		//String docRPath = parentPath + doc.getName();

		//删除实体文件
		String name = doc.getName();
		if(deleteRealDoc(reposRPath, parentPath, name,doc.getType()) == false)
		{
			String MsgInfo = "deleteRealDoc Failed";
			rt.setError(parentPath + name + "删除失败！");
			if(unlockDoc(docId,login_user) == false)
			{
				MsgInfo += " and unlockDoc Failed";						
			}
			rt.setError(MsgInfo);
			return;
		}
			
		//需要将文件Commit到SVN上去
		if(svnRealDocDelete(repos,parentPath,name,doc.getType(),commitMsg,commitUser) == false)
		{
			System.out.println("svnRealDocDelete Failed");
			String MsgInfo = "svnRealDocDelete Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(svnRevertRealDoc(repos,parentPath,name,doc.getType()) == false)
			{						
				MsgInfo += " and revertFile Failed";
			}
			if(unlockDoc(docId,login_user) == false)
			{
				MsgInfo += " and unlockDoc Failed";						
			}
			rt.setError(MsgInfo);
			return;
		}				
		
		//删除虚拟文件
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getDocVPath(parentPath,doc.getName());
		String localDocVPath = reposVPath + docVName;
		if(deleteVirtualDoc(reposVPath,docVName) == false)
		{
			System.out.println("deleteDoc() delDir Failed " + localDocVPath);
			rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
		}
		else
		{
			if(svnVirtualDocDelete(repos,docVName,commitMsg,commitUser) == false)
			{
				System.out.println("deleteDoc() delDir Failed " + localDocVPath);
				rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
				svnRevertVirtualDoc(repos,docVName);
			}
		}
		
		//删除Node
		if(reposService.deleteDoc(docId) == 0)
		{	
			rt.setError("不可恢复系统错误：deleteDoc Failed");
			return;
		}
		rt.setData(doc);
	}

	//底层updateDoc接口
	private void updateDoc(Integer docId, MultipartFile uploadFile,Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		//Try to lock the doc
		Doc doc = lockDoc(docId, 1, login_user, rt);
		if(doc == null)
		{
			System.out.println("updateDoc() lockDoc " + docId +" Failed！");
			return;
		}
				
		Repos repos = reposService.getRepos(reposId);
		//get RealDoc Full ParentPath
		String reposRPath =  getReposRealPath(repos);
		//get parentPath
		String parentPath = getParentPath(parentId);		
		//Get the file name
		String name = uploadFile.getOriginalFilename();
		System.out.println("updateDoc() name:" + name);

		//替换文件
		if(isRealFS(repos.getType())) //0：虚拟文件系统   1： 普通文件系统	
		{
			//保存文件信息
			if(updateRealDoc(reposRPath,parentPath,name,doc.getType(),uploadFile) == false)
			{
				if(unlockDoc(docId,login_user) == false)
				{
					System.out.println("updateDoc() saveFile " + docId +" Failed and unlockDoc Failed");
					rt.setError("Failed to saveMultipartFile " + name + " to " + reposRPath+parentPath);
				}
				else
				{	
					System.out.println("updateDoc() unlockDoc " + docId +" Failed");
					rt.setError("Failed to unlockDoc " + docId + " " + doc.getName());
				}
				return;
			}
			
			//需要将文件Commit到SVN上去
			if(svnRealDocCommit(repos,parentPath,name,doc.getType(),commitMsg,commitUser) == false)
			{
				System.out.println("updateDoc() svnRealDocCommit Failed:" + parentPath + name);
				String MsgInfo = "svnRealDocCommit Failed";
				//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
				if(svnRevertRealDoc(repos,parentPath,name,doc.getType()) == false)
				{						
					MsgInfo += " and revertFile Failed";
				}
				//还原doc记录的状态
				if(unlockDoc(docId,login_user) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				//writeJson(rt, response);	
				return;
			}
		}
				
		//unlockDoc
		if(unlockDoc(docId,login_user) == false)
		{
			rt.setError("不可恢复系统错误：unlockDoc Failed");
			return;
		}
	}

	//底层renameDoc接口
	private void renameDoc(Integer docId, String newname,Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		//Renmae Dir 需要检查其子目录是否上锁
		if(isSubDocLocked(docId,rt) == true)
		{
			System.out.println("renameDoc() subDoc of " + docId +" was locked！");
			return;
		}
		
		//Try to lockDoc
		Doc doc = lockDoc(docId,2,login_user,rt);
		if(doc == null)
		{
			System.out.println("renameDoc() lockDoc " + docId +" Failed！");
			return;
		}
				
		Repos repos = reposService.getRepos(reposId);
		String reposRPath = getReposRealPath(repos);
		String parentPath = getParentPath(parentId);
		String oldname = doc.getName();
		
		//修改实文件名字	
		if(moveRealDoc(reposRPath,parentPath,oldname,parentPath,newname,doc.getType()) == false)
		{
			if(unlockDoc(docId,login_user) == false)
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
			if(svnRealDocMove(repos,parentPath,oldname,parentPath,newname,doc.getType(),commitMsg,commitUser) == false)
			{
				//我们假定版本提交总是会成功，因此报错不处理
				System.out.println("renameDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				
				if(moveRealDoc(reposRPath,parentPath,newname,parentPath,oldname,doc.getType()) == false)
				{
					MsgInfo += " and moveRealDoc Back Failed";
				}
				if(unlockDoc(docId,login_user) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return;
			}	
		}
		
		//修改虚拟文件的目录名称
		String reposVPath = getReposVirtualPath(repos);
		String srcDocVName = getDocVPath(parentPath,oldname);
		String dstDocVName = getDocVPath(parentPath,newname);
		if(moveVirtualDoc(reposVPath,srcDocVName,dstDocVName) == true)
		{
			if(svnVirtualDocMove(repos,srcDocVName,dstDocVName, commitMsg, commitUser) == false)
			{
				System.out.println("renameDoc() svnVirtualDocMove Failed");
			}
		}
		else
		{
			System.out.println("renameDoc() moveVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");
		}
		
		//更新doc记录并启用
		doc.setName(newname);
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc name");
			return;
		}
		
		//更新所有子目录的Path信息,path好像有人在用
		docPathRecurUpdate(repos,docId,doc.getPid(),oldname,reposVPath,parentPath,parentPath,commitMsg,commitUser);	
	
		//unlock doc
		if(unlockDoc(docId,login_user) == false)
		{
			rt.setError("unlockDoc failed");	
		}
		return;
	}
	
	//底层moveDoc接口
	private void moveDoc(Integer docId, Integer reposId,Integer parentId,Integer dstPid,  
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {

		if(isSubDocLocked(docId,rt) == true)
		{
			System.out.println("subDoc of " + docId +" Locked！");
			return;
		}
		
		//Try to  lock Doc
		Doc doc = lockDoc(docId,2,login_user,rt);
		if(doc == null)
		{
			System.out.println("lockDoc " + docId +" Failed！");
			return;
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
			if(moveRealDoc(reposRPath,srcParentPath,filename,dstParentPath,filename,doc.getType()) == false)
			{
				System.out.println("moveDoc() 文件: " + filename + " 移动失败");
				rt.setError("文件移动失败！");
				if(unlockDoc(docId,login_user) == false)
				{
					rt.setError("文件移动失败！ and unlockDoc failed");
				}
				return;
			}
			
			//需要将文件Commit到SVN上去：先执行svn的移动
			if(svnRealDocMove(repos, srcParentPath,filename, dstParentPath, filename,doc.getType(),commitMsg, commitUser) == false)
			{
				System.out.println("moveDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				if(moveRealDoc(reposRPath,dstParentPath,filename,srcParentPath,filename,doc.getType()) == false)
				{
					MsgInfo += "and changeDirectory Failed";
				}
				
				if(unlockDoc(docId,login_user) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return;					
			}
		}
		
		//修改虚拟文件的目录名称
		String reposVPath = getReposVirtualPath(repos);
		String srcDocVName = getDocVPath(srcParentPath,doc.getName());
		String dstDocVName = getDocVPath(dstParentPath,doc.getName());
		if(moveVirtualDoc(reposVPath,srcDocVName,dstDocVName) == true)
		{
			//提交修改到版本仓库
			if(svnVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser) == false)
			{
				System.out.println("moveDoc() svnVirtualDocMove " + srcDocVName + " to " + dstDocVName + " Failed");							
			}
		}
		else
		{
			System.out.println("moveDoc() moveVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");			
		}
		
		//更新doc记录并还原状态
		doc.setPath(dstParentPath);
		doc.setPid(dstPid);
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc pid and path");
			return;				
		}
		
		//更新所有子目录的Path信息,path好像有人在用
		docPathRecurUpdate(repos,docId,doc.getPid(),doc.getName(),reposVPath,srcParentPath,dstParentPath,commitMsg,commitUser);
		
		if(unlockDoc(docId,login_user) == false)
		{
			rt.setError("unlockDoc failed");			
		}
		return;
	}
	
	//底层copyDoc接口
	private void copyDoc(Integer docId,String name,Integer type, Integer reposId,Integer parentId, Integer dstPid,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath =  getReposRealPath(repos);

		//get parentPath
		String parentPath = getParentPath(parentId);		
		//目标路径
		String dstParentPath = getParentPath(dstPid);		
		
		//远程仓库相对路径
		//String srcDocRPath = parentPath  + name;
		//String dstDocRPath = dstParentPath + name;
		//String srcDocFullRPath = reposRPath + parentPath + name;
		//String dstDocFullRPath = reposRPath + dstParentPath + name;
		
		//判断节点是否已存在
		if(isNodeExist(name,dstPid,reposId) == true)
		{
			rt.setError("Node: " + name +" 已存在！");
			return;
		}

		//新建doc记录
		//Doc doc = new Doc();
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			rt.setError("文件不存在");
			return;			
		}
		doc.setId(null);	//置空id,以便新建一个doc
		//doc.setName(name);
		//doc.setType(type);
		//doc.setContent("#" + name);
		doc.setPath(dstParentPath);
		//doc.setVid(reposId);
		doc.setPid(dstPid);
		doc.setCreator(login_user.getId());
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		doc.setCreateTime(createTime);
		doc.setState(1);	//doc的状态为不可用
		doc.setLockBy(login_user.getId());	//set LockBy
		if(reposService.addDoc(doc) == 0)
		{
			rt.setError("Add Node: " + name +" Failed！");
			return;
		}
		System.out.println("id: " + doc.getId());
		
		//复制文件或目录，注意这个接口只会复制单个文件
		if(copyRealDoc(reposRPath,parentPath,name,dstParentPath,name,doc.getType()) == false)
		{
			System.out.println("文件: " + name + " 复制失败");
			String MsgInfo = "copyRealDoc " + name +" Failed";
			//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
			if(reposService.deleteDoc(doc.getId()) == 0)	
			{
				System.out.println("Delete Node: " + doc.getId() +" failed!");
				rt.setError(" and delete Node Failed");
			}
			rt.setError(MsgInfo);
			return;
		}
			
		//需要将文件Commit到SVN上去
		boolean ret = false;
		String MsgInfo = "";
		if(type == 1) 
		{
			ret = svnRealDocCopy(repos,parentPath,name,dstParentPath,name,type,commitMsg, commitUser);
			MsgInfo = "svnRealDocCopy Failed";
		}
		else //目录则在版本仓库新建，因为复制操作每次只复制一个节点，直接调用copy会导致目录下的所有节点都被复制
		{
			ret = svnRealDocAdd(repos,dstParentPath,name,type,commitMsg,commitUser);
			MsgInfo = "svnRealDocAdd Failed";
		}
			
			
		if(ret == false)
		{
			System.out.println("copyDoc() " + MsgInfo);
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(deleteRealDoc(reposRPath,parentPath,name,type) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(doc.getId()) == 0)
			{
				MsgInfo += " and delete Node Failed";						
			}
			rt.setError(MsgInfo);
			return;
		}				
		
		//创建虚拟文件目录
		String reposVPath = getReposVirtualPath(repos);
		String srcDocVName = getDocVPath(parentPath,name);
		String dstDocVName = getDocVPath(dstParentPath,name);
		if(copyVirtualDoc(reposVPath,srcDocVName,dstDocVName) == true)
		{
			if(svnVirtualDocCopy(repos,srcDocVName,dstDocVName, commitMsg, commitUser) == false)
			{
				System.out.println("copyDoc() svnVirtualDocCopy " + srcDocVName + " to " + dstDocVName + " Failed");							
			}
		}
		else
		{
			System.out.println("copyDoc() copyVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");						
		}
		
		//启用doc
		if(unlockDoc(doc.getId(),login_user) == false)
		{	
			rt.setError("unlockDoc Failed");
			return;
		}

		//只返回最上层的doc记录
		if(rt.getData() == null)
		{
			rt.setData(doc);
		}
	}

	private void updateDocContent(Integer id,String content, String commitMsg, String commitUser, User login_user,ReturnAjax rt) {
		//Try to lock Doc
		Doc doc = lockDoc(id,1,login_user,rt);
		if(doc== null)
		{
			System.out.println("updateDocContent() lockDoc Failed");
			//writeJson(rt, response);			
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
			if(unlockDoc(id,login_user) == false)
			{
				rt.setError("更新文件失败 and unlockDoc failed");	
			}
			//writeJson(rt, response);			
			return;			
		}	
		
		//Save the content to virtual file
		String parentPath = getParentPath(id);
		//String docRPath = parentPath + doc.getName();
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getDocVPath(parentPath,doc.getName());
		String localVDocPath = reposVPath + docVName;
		
		System.out.println("docFullVPath: " + localVDocPath);
		if(isFileExist(localVDocPath) == true)
		{
			if(saveVirtualDocContent(reposVPath,docVName, content) == true)
			{
				if(repos.getVerCtrl() == 1)
				{
					svnVirtualDocCommit(repos, docVName, commitMsg, commitUser);
				}
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(reposVPath,docVName,content) == true)
			{
				if(repos.getVerCtrl() == 1)
				{
					svnVirtualDocCommit(repos, docVName, commitMsg, commitUser);
				}
			}
		}
		
		if(unlockDoc(id,login_user) == false)
		{
			rt.setError("unlockDoc failed");	
		}		
	}
	
	/*********************Functions For DocLock 
	 * @param rt *******************************/
	//Lock Doc
	private Doc lockDoc(Integer docId,Integer lockType, User login_user, ReturnAjax rt) {
		System.out.println("lockDoc() docId:" + docId + " lockType:" + lockType + " by " + login_user.getName());
		//确定文件节点是否可用
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			rt.setError("Doc " + docId +" 不存在！");
			System.out.println("Doc: " + docId +" 不存在！");
			return null;
		}
		else if(doc.getState() != 0)
		{
			rt.setError("Doc " + docId + " " + doc.getName() +" was locked:" + doc.getState());
			System.out.println("Doc: " + docId +" was locked！");
			return null;
		}
		else
		{
			//检查其父节点是否进行了递归锁定
			Integer lockState = getParentLockState(doc.getPid(),rt);
			if(lockState == 2)	//2: 全目录锁定
			{
				System.out.println("Parent Doc of " + docId +" was locked！");				
				return null;
			}
		}
		
		Doc lockDoc= new Doc();
		lockDoc.setId(docId);
		lockDoc.setState(lockType);	//doc的状态为不可用
		lockDoc.setLockBy(login_user.getId());
		if(reposService.updateDoc(lockDoc) == 0)
		{
			return null;
		}
		System.out.println("lockDoc() success docId:" + docId + " lockType:" + lockType + " by " + login_user.getName());
		return doc;
	}
	
	//获取当前节点父节点的lockState
	private Integer getParentLockState(Integer parentDocId, ReturnAjax rt) {
		if(parentDocId == 0)
		{
			return 0;	//已经到了最上层
		}
		
		Doc doc = reposService.getDoc(parentDocId);
		Integer lockState = doc.getState();
		if(lockState != 0)
		{
			rt.setError(parentDocId + " " + doc.getName() + " was locked:" + lockState);
			System.out.println("getParentLockState() " + parentDocId + " is locked!");
			return lockState;
		}
		return getParentLockState(doc.getPid(),rt);
	}
	
	//Check if any subDoc under docId was locked, you need to check it when you want to rename/move/copy the Directory
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
				rt.setError( subDoc.getId() + " " +  subDoc.getName() + " is locked:" + subDoc.getState());
				System.out.println("isSubDocLocked() " + subDoc.getId() + " is locked!");
				return true;
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
	private boolean unlockDoc(Integer docId, User login_user) {
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
			//Try to unlock
			Doc revertDoc = new Doc();
			revertDoc.setId(docId);	
			revertDoc.setState(0);	//
			revertDoc.setLockBy(0);	//
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
		return true;
	}
	
	/*************************** Functions For Real and Virtual Doc Operaion***********************************/
	//create Real Doc
	private boolean createRealDoc(String reposRPath,String parentPath, String name, Integer type, MultipartFile uploadFile) {
		//获取 doc parentPath
		String localParentPath =  reposRPath + parentPath;
		String localDocPath = localParentPath + name;
		System.out.println("createRealDoc() localParentPath:" + localParentPath);
		
		if(type == 2) //目录
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + "　已存在！");
				return false;
			}
			
			if(false == createDir(localDocPath))
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + " 创建失败！");
				return false;
			}				
		}
		else
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 文件 " +localDocPath + " 已存在！");
				return false;
			}
			
			if(uploadFile == null || uploadFile.getSize() == 0)
			{
				if(false == createFile(localParentPath,name))
				{
					System.out.println("createRealDoc() 文件 " + localDocPath + "创建失败！");
					return false;					
				}
			}
			else
			{
				if(updateRealDoc(reposRPath,parentPath,name,type,uploadFile) == false)
				{
					System.out.println("createRealDoc() 文件 " + localDocPath + "创建失败！");
					return false;
				}
			}
		}
		return true;
	}
	
	private boolean deleteRealDoc(String reposRPath, String parentPath, String name, Integer type) {
		String localDocPath = reposRPath + parentPath + name;
		if(deleteFile(localDocPath) == false)
		{
			System.out.println("deleteRealDoc() " + localDocPath + "删除失败！");
			return false;
		}
		return true;
	}
	
	private boolean updateRealDoc(String reposRPath,String parentPath,String name,Integer type, MultipartFile uploadFile) {

		String localDocParentPath = reposRPath + parentPath;
		String retName = null;
		try {
			retName = saveFile(uploadFile, localDocParentPath,name);
		} catch (Exception e) {
			System.out.println("updateRealDoc() saveFile " + name +" 异常！");
			e.printStackTrace();
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
	
	private boolean moveRealDoc(String reposRPath, String srcParentPath, String srcName, String dstParentPath,String dstName,Integer type) 
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
			return false;
		}
		
		//检查dstFile是否存在
		if(isFileExist(newFilePath) == true)
		{
			System.out.println("moveRealDoc() " + newFilePath + " already exists");
			return false;
		}
	
		/*移动文件或目录*/		
		if(moveFile(localOldParentPath,srcName,localNewParentPath,dstName,false) == false)	//强制覆盖
		{
			System.out.println("moveRealDoc() move " + oldFilePath + " to "+ newFilePath + " Failed");
			return false;
		}
		return true;
	}
	
	private boolean copyRealDoc(String reposRPath, String srcParentPath,String srcName,String dstParentPath,String dstName, Integer type) {
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

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
			e.printStackTrace();
			System.out.println("系统异常：文件复制失败！");
			return false;
		}
		return true;
	}

	//create Virtual Doc
	private boolean createVirtualDoc(String reposVPath, String docVName,String content) {
		String vDocPath = reposVPath + docVName;
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
		if(createDir(vDocPath + "/res") == false)
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
			saveVirtualDocContent(reposVPath,docVName, content);
		}
		
		return true;
	}
	
	private boolean deleteVirtualDoc(String reposVPath, String docVName) {
		String localDocVPath = reposVPath + docVName;
		return delDir(localDocVPath);
	}
	
	private boolean moveVirtualDoc(String reposRefVPath, String srcDocVName,String dstDocVName) {
		return moveFile(reposRefVPath, srcDocVName, reposRefVPath, dstDocVName, false);		
	}
	
	private boolean copyVirtualDoc(String reposVPath, String srcDocVName, String dstDocVName) {
		String srcDocFullVPath = reposVPath + srcDocVName;
		String dstDocFullVPath = reposVPath + dstDocVName;
		return copyFolder(srcDocFullVPath,dstDocFullVPath);
	}

	private boolean saveVirtualDocContent(String reposVPath, String docVName, String content) {
		String mdFilePath = reposVPath + docVName + "/content.md";
		//创建文件输入流
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(mdFilePath);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
			return false;
		}
		try {
			out.write(content.getBytes(), 0, content.length());
			//关闭输出流
			out.close();
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
	//Create Ref Data (File or Dir), both support Real Doc and Virtual Doc
	private boolean createRefRealDoc(String reposRPath,String reposRefRPath,String parentPath, String name, Integer type)
	{
		String localParentPath =  reposRPath + parentPath;
		String localRefParentPath =  reposRefRPath + parentPath;
		String localDocPath = localParentPath + name;
		String localRefDocPath = localRefParentPath + name;
		System.out.println("createRefDoc() localDocPath:" + localDocPath + " localRefDocPath:" + localRefDocPath);
		if(type == 2) //目录
		{
			if(isFileExist(localRefDocPath) == true)
			{
				System.out.println("createRefDoc() 目录 " + localRefDocPath + "　已存在！");
				return false;
			}
			
			if(false == createDir(localRefDocPath))
			{
				System.out.println("createRefDoc() 目录 " +localRefDocPath + " 创建失败！");
				return false;
			}				
		}
		else
		{
			if(isFileExist(localRefDocPath) == true)
			{
				System.out.println("createRefDoc() 文件 " +localRefDocPath + " 已存在！");
				return false;
			}
			try {
				copyFile(localDocPath, localRefDocPath, false);
			} catch (IOException e) {
				System.out.println("createRefDoc() copy " + localDocPath + " to " + localRefDocPath + "Failed!");
				e.printStackTrace();
				return false;
			}
		}
		return true;
	}
	
	private boolean updateRefRealDoc(String reposRPath, String reposRefRPath,
			String parentPath, String name, Integer type) {
		return createRefRealDoc(reposRPath, reposRefRPath, parentPath, name, type);
	}
	
	private boolean createRefVirtualDoc(String reposVPath,String reposRefVPath,String vDocName) {
		System.out.println("createRefVirtualDoc() reposVPath:" + reposVPath + " reposRefVPath:" + reposRefVPath + " vDocName:" + vDocName);
		
		String localPath = reposVPath + vDocName;
		String localRefPath = reposRefVPath + vDocName;
		
		if(isFileExist(localRefPath) == true)
		{
			System.out.println("createRefVirtualDoc() " +localRefPath + " 已存在！");
			return false;
		}
		
		return copyFolder(localPath, localRefPath);
	}
	
	//更新doc和其所有子节点的Path:该函数只更新Path信息，不会改变节点间的逻辑关系
	void docPathRecurUpdate(Repos repos,Integer id,Integer dstPid,String oldname,String reposVPath,String srcParentPath,String dstParentPath,String commitMsg,String commitUser)
	{
		//移动当前节点
		Doc doc = reposService.getDocInfo(id);
		Integer orgPid = doc.getPid();
		System.out.println("docPathRecurUpdate id:" + id + " orgPid: " + orgPid + " oldname: " + oldname + " dstPid: " + dstPid +" srcParentPath: " + srcParentPath + " dstParentPath: " + dstParentPath );
		
		//更新虚拟文件名字: srcParentPath 和 dstParentPath相同表示是rename,否则表示move
		String srcDocRPath = srcParentPath + oldname;
		String dstDocRPath = dstParentPath + doc.getName();
		if(!dstDocRPath.equals(srcDocRPath))
		{
			//修改虚拟文件的目录名称
			String srcDocVName = getDocVPath(srcParentPath,oldname);
			String dstDocVName = getDocVPath(dstParentPath,doc.getName());
			if(moveVirtualDoc(reposVPath,srcDocVName,dstDocVName) == true)
			{
				if(svnVirtualDocMove(repos,srcDocVName,dstDocVName, commitMsg, commitUser) == false)
				{
					System.out.println("docPathRecurUpdate() svnVirtualDocMove Failed");
				}
			}
			else
			{
				System.out.println("docPathRecurUpdate() moveVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");
			}
		}
		
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
				docPathRecurUpdate(repos,subDocId,suDocDstPid,subDoc.getName(),reposVPath,srcDocRPath+"/",dstDocRPath+"/",commitMsg,commitUser);
			};
		}
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

	private boolean checkUserDeleteRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
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
	
	private boolean checkUserEditRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
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
	
	private boolean checkUseAccessRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
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
	
	//该接口根据用户是否有仓库的直接权限分开两条支线来获取用户权限
	private DocAuth getDocUserAuth(Integer userId, Integer docId, Integer reposId) {
		//确定用户是否为仓库的直接访问用户
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setReposId(reposId);
		qReposAuth.setUserId(userId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)	//该用户没有该仓库的直接权限设置，获取是否设置任意用户的访问权限
		{
			System.out.println("用户不是该仓库的直接访问用户，检查该仓库是否开放了任意用户访问");
			qReposAuth.setUserId(0);	//获取任意用户的仓库访问权限
			reposAuth = reposService.getReposAuth(qReposAuth);
			if(reposAuth == null)
			{
				System.out.println("该仓库未开放了任意用户访问");				
				return null;
			}
			
			//递归任意用户的文件的访问权限
			System.out.println("该仓库开放了任意用户访问，递归获取任意用户的目录访问权限");				
			userId = 0;	//任意用户
		}
		
		
		//取用户的直接权限，注意这个时候userId有可能被改成了0
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(userId);
		qDocAuth.setReposId(reposId);
		qDocAuth.setDocId(docId);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)	//没有设置的话默认使用父节点的权限
		{
			return recurGetDocAuth(userId,docId,reposId,reposAuth);
		}
		return docAuth;
	}
	
	//该接口是递归获取父节点直接根据用户ID递归获取文件权限，注意该接口必须是在自己的权限没有设置的时候调用
	private DocAuth recurGetDocAuth(Integer userId, Integer docId,
			Integer reposId,ReposAuth reposAuth) {
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(userId);
		qDocAuth.setReposId(reposId);
		qDocAuth.setDocId(docId);
		if((docId == null) || (docId == 0))	//根目录直接取reposAuth的属性
		{
			if(reposAuth.getHeritable() == 1)
			{
				qDocAuth.setAccess(reposAuth.getAccess());
				qDocAuth.setEditEn(reposAuth.getEditEn());
				qDocAuth.setAddEn(reposAuth.getAddEn());
				qDocAuth.setDeleteEn(reposAuth.getDeleteEn());
				qDocAuth.setHeritable(1);
				return qDocAuth;
			}
			return null;	
		}
		
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)	//没有设置的话默认使用父节点的权限
		{
			Doc doc = reposService.getDocInfo(docId);
			Integer pDocId = doc.getPid();
			return recurGetDocAuth(userId,pDocId,reposId,reposAuth);
		}
		
		if(docAuth.getHeritable() == 0)
		{
			System.out.println("权限不可继承");
			return null;
		}
		return docAuth;
	}
	
	/*************** Functions For SVN *********************/
	private boolean svnRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser) 
	{
		String remotePath = parentPath + entryName;
		String reposRPath = getReposRealPath(repos);
		String reposRefRPath = getReposRefRealPath(repos);
		if(repos.getVerCtrl() == 1)
		{
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd();
	
			try {
				SVNUtil svnUtil = new SVNUtil();
				svnUtil.Init(reposURL, svnUser, svnPwd);
				
				if(svnUtil.doCheckPath(remotePath, -1) == false)	//检查文件是否已经存在于仓库中
				{
					if(type == 1)
					{
						String localFilePath = reposRPath + remotePath;
						if(svnUtil.svnAddFile(parentPath,entryName,localFilePath,commitMsg) == false)
						{
							System.out.println(remotePath + " remoteAddFile失败！");	
							return false;
						}
					}
					else
					{
						if(svnUtil.svnAddDir(parentPath,entryName,commitMsg) == false)
						{
							System.out.println(remotePath + " remoteAddDir失败！");	
							return false;
						}
					}
				}
				else	//如果已经存在，则只是将修改的内容commit到服务器上
				{
					System.out.println(remotePath + "在仓库中已存在！");	
					return false;
				}
			} catch (SVNException e) {
				e.printStackTrace();
				System.out.println("系统异常：" + remotePath + " svnRealDocAdd异常！");
				return false;
			}
			
			//Create the ref real doc, so that we can commit the diff later
			createRefRealDoc(reposRPath,reposRefRPath,parentPath,entryName,type);
			return true;
		}
		else
		{
			return true;
		}
	}
	
	private boolean svnRealDocDelete(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser) {
		System.out.println("svnRealDocDelete() parentPath:" + parentPath + " name:" + name);
		if(repos.getVerCtrl() == 1)
		{
		
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd();
			String docRPath = parentPath + name;
			try {
				SVNUtil svnUtil = new SVNUtil();
				svnUtil.Init(reposURL, svnUser, svnPwd);
				if(svnUtil.doCheckPath(docRPath,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
				{
					if(svnUtil.svnDelete(parentPath,name,commitMsg) == false)
					{
						System.out.println(docRPath + " remoteDeleteEntry失败！");
						return false;
					}
				}
			} catch (SVNException e) {
				e.printStackTrace();
				System.out.println("系统异常：" + docRPath + " remoteDeleteEntry异常！");
				return false;
			}
			
			//delete the ref real doc
			String reposRefRPath = getReposRefRealPath(repos);
			deleteRealDoc(reposRefRPath,parentPath,name,type);
			return true;
		}
		else
		{
			return true;
		}
	}

	private boolean svnRealDocCommit(Repos repos, String parentPath,
			String name,Integer type, String commitMsg, String commitUser) {
		
		System.out.println("svnRealDocCommit() parentPath:" + parentPath + " name:" + name);
		if(repos.getVerCtrl() == 1)
		{
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd();
			String reposRPath =  getReposRealPath(repos);
			String docRPath = parentPath + name;
			String docFullRPath = reposRPath + parentPath + name;
			
			try {
				SVNUtil svnUtil = new SVNUtil();
				svnUtil.Init(reposURL, svnUser, svnPwd);
				
				if(svnUtil.doCheckPath(docRPath, -1) == false)	//检查文件是否已经存在于仓库中
				{
					System.out.println("svnRealDocCommit() " + docRPath + " 在仓库中不存在！");
					return false;
				}
				else	//如果已经存在，则只是将修改的内容commit到服务器上
				{
					String oldFilePath = getReposRefRealPath(repos) + docRPath;
					String newFilePath = docFullRPath;
					if(svnUtil.svnModifyFile(parentPath,docRPath,oldFilePath, newFilePath, commitMsg) == false)
					{
						System.out.println("svnRealDocCommit() " + name + " remoteModifyFile失败！");
						return false;
					}
				}
			} catch (SVNException e) {
				e.printStackTrace();
				System.out.println("svnRealDocCommit() 系统异常：" + name + " svnRealDocCommit异常！");
				return false;
			}
			
			//Update the RefRealDoc with the RealDoc
			String reposRefRPath = getReposRefRealPath(repos);
			updateRefRealDoc(reposRPath,reposRefRPath,parentPath,name,type);
			return true;
		}
		else
		{
			return true;
		}
			
	}

	private boolean svnRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser) {
		
		System.out.println("svnRealDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		String reposRefRPath = getReposRefRealPath(repos);
		if(repos.getVerCtrl() == 1)
		{	
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd();
			if(svnMove(reposURL,svnUser,svnPwd,srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg) == false)
			{
				System.out.println("svnMove Failed！");
				return false;
			}
			
			//rename the ref real doc
			moveRealDoc(reposRefRPath,srcParentPath,srcEntryName,dstParentPath,dstEntryName,type);
			return true;
		}
		else
		{
			System.out.println("svnRealDocMove() verCtrl " + repos.getVerCtrl());
			return true;
		}
	}

	private boolean svnRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser) {
		
		System.out.println("svnRealDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(repos.getVerCtrl() == 1)
		{				
		
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd();
			if(svnCopy(reposURL,svnUser,svnPwd,srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg) == false)
			{
				System.out.println("文件: " + srcEntryName + " svnCopy失败");
				return false;
			}
			
			//create Ref RealDoc
			String reposRPath = getReposRealPath(repos);
			String reposRefRPath = getReposRefRealPath(repos);
			createRefRealDoc(reposRPath, reposRefRPath, dstParentPath, dstEntryName, type);
			return true;
		}
		else
		{
			return true;
		}
	}
	
	private boolean svnVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser) {
		
		System.out.println("svnVirtualDocAdd() docVName:" + docVName);
		
		if(repos.getVerCtrl1() == 1)
		{
			String reposURL = repos.getSvnPath1();
			String svnUser = repos.getSvnUser1();
			String svnPwd = repos.getSvnPwd1();
			SVNUtil svnUtil = new SVNUtil();
			if(svnUtil.Init(reposURL, svnUser, svnPwd) == false)
			{
				System.out.println("svnVirtualDocAdd() svnUtil Init Failed!");
				return false;
			}
			
			String reposVPath =  getReposVirtualPath(repos);
			String reposRefVPath = getReposRefVirtualPath(repos);
			
			//modifyEnable set to false
			if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,false,reposRefVPath) == false)
			{
				System.out.println(docVName + " doAutoCommit失败！");
				return false;
			}
			
			//同步两个目录,modifyEnable set to false
			createRefVirtualDoc(reposVPath,reposRefVPath,docVName);
			return true;
		}
		else
		{
			return true;
		}
	}
	
	private boolean svnVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser) {
		System.out.println("svnVirtualDocDelete() docVName:" + docVName);
		if(repos.getVerCtrl1() == 1)
		{
		
			String reposURL = repos.getSvnPath1();
			String svnUser = repos.getSvnUser1();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd1();
			
			try {
				SVNUtil svnUtil = new SVNUtil();
				svnUtil.Init(reposURL, svnUser, svnPwd);
				if(svnUtil.doCheckPath(docVName,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
				{
					if(svnUtil.svnDelete("",docVName,commitMsg) == false)
					{
						System.out.println(docVName + " remoteDeleteEntry失败！");
						return false;
					}
				}
			} catch (SVNException e) {
				e.printStackTrace();
				System.out.println("系统异常：" + docVName + " remoteDeleteEntry异常！");
				return false;
			}
			
			//delete Ref Virtual Doc
			String reposRefVPath = getReposRefVirtualPath(repos);
			deleteVirtualDoc(reposRefVPath,docVName);
			return true;
		}
		else
		{
			return true;
		}
	}

	private boolean svnVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser) {
		System.out.println("svnVirtualDocCommit() docVName:" + docVName);
		if(repos.getVerCtrl1() == 1)
		{
			String reposURL = repos.getSvnPath1();
			String svnUser = repos.getSvnUser1();
			String svnPwd = repos.getSvnPwd1();
			String reposVPath =  getReposVirtualPath(repos);
			
			SVNUtil svnUtil = new SVNUtil();
			svnUtil.Init(reposURL, svnUser, svnPwd);
				
			if(commitMsg == null || "".equals(commitMsg))
			{
				commitMsg = "Commit virtual doc " + docVName + " by " + commitUser;
			}
			
			String reposRefVPath = getReposRefVirtualPath(repos);
			if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,true,reposRefVPath) == false)
			{
				System.out.println(docVName + " doCommit失败！");
				return false;
			}
			
			//同步两个目录
			syncUpFolder(reposVPath,docVName,reposRefVPath,docVName,true);
			return true;
		}
		else
		{
			return true;
		}
	}

	private boolean svnVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser) {
		System.out.println("svnVirtualDocMove() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		if(repos.getVerCtrl1() == 1)
		{	
			String reposURL = repos.getSvnPath1();
			String svnUser = repos.getSvnUser1();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd1();
			if(svnMove(reposURL,svnUser,svnPwd,"",srcDocVName,"",dstDocVName,commitMsg) == false)
			{
				System.out.println("svnMove Failed！");
				return false;
			}
			
			//move the ref virtual doc
			String reposRefVPath = getReposRefVirtualPath(repos);
			moveVirtualDoc(reposRefVPath, srcDocVName, dstDocVName);
			return true;
		}
		else
		{
			System.out.println("svnRealDocMove() verCtrl " + repos.getVerCtrl());
			return true;
		}
	}

	private boolean svnVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser) {

		System.out.println("svnVirtualDocCopy() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		if(repos.getVerCtrl1() == 1)
		{				
			String reposURL = repos.getSvnPath1();
			String svnUser = repos.getSvnUser1();
			if(svnUser==null || "".equals(svnUser))
			{
				svnUser = commitUser;
			}
			String svnPwd = repos.getSvnPwd1();
			if(svnCopy(reposURL,svnUser,svnPwd,"",srcDocVName,"",dstDocVName,commitMsg) == false)
			{
				System.out.println("文件: " + srcDocVName + " svnCopy失败");
				return false;
			}
			
			//create Ref Virtual Doc
			String reposVPath = getReposVirtualPath(repos);
			String reposRefVPath = getReposRefVirtualPath(repos);
			createRefVirtualDoc(reposVPath,reposRefVPath,dstDocVName);
			return true;
		}
		else
		{
			return true;
		}
	}

	private boolean svnRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type) 
	{
		System.out.println("svnRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;
		String localDocPath = localParentPath + entryName;

		//only revert the file
		File file = new File(localParentPath,entryName);
		if(type == 2) //如果是目录则重新新建目录即可
		{
			return file.mkdir();
		}
		
		//If it is file, we will try to revert locally, if failed then revert from the version DataBase
		String localRefParentPath = getReposRefRealPath(repos) + parentPath;
		String localRefDocPath =  localRefParentPath + entryName;
		try {
			copyFile(localRefDocPath, localDocPath, false);
		} catch (IOException e) {
			System.out.println("svnRevertRealDoc() copyFile Exception!");
			e.printStackTrace();
			String reposURL = repos.getSvnPath();
			String svnUser = repos.getSvnUser();
			String svnPwd = repos.getSvnPwd();
			return svnRevert(reposURL, svnUser, svnPwd, parentPath, entryName, localParentPath, entryName);
		}
		return true;
	}
	

	private boolean svnRevertVirtualDoc(Repos repos, String docVName) {
		System.out.println("svnRevertVirtualDoc() docVName:" + docVName);
		
		String localDocVParentPath = getReposVirtualPath(repos);
		String localDocVPath = localDocVParentPath + docVName;
		String localDocVRefParentPath = getReposRefVirtualPath(repos);
		String localRefDocVPath = localDocVRefParentPath + docVName;

		//only revert the file
		File file = new File(localDocVPath);
		if(!file.exists())
		{
			if(copyFolder(localRefDocVPath,localDocVPath) == true)
			{
				return true;
			}
		}
		else
		{
			if(syncUpFolder(localDocVRefParentPath,docVName,localDocVParentPath,docVName,true) == true)
			{
				return true;
			}
		}

		//getFolder From the version DataBase
		String reposURL = repos.getSvnPath1();
		String svnUser = repos.getSvnUser1();
		String svnPwd = repos.getSvnPwd1();
		return svnGetEntry(reposURL, svnUser, svnPwd, "", docVName, localDocVParentPath, docVName);
	}
	
	private boolean svnGetEntry(String reposURL, String svnUser, String svnPwd,
			String parentPath, String entryName, String localParentPath,String localEntryName) {
	
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(reposURL, svnUser, svnPwd) == false)
		{
			System.out.println("svnGetEntry() svnUtil Init Failed: " + reposURL);
			return false;
		}
		
		String remoteEntryPath = parentPath + entryName;
		String localEntryPath = localParentPath + localEntryName;
		
		int entryType = svnUtil.getEntryType(remoteEntryPath, -1);
		if(entryType == 1)	//File
		{
			svnUtil.getFile(localEntryPath,parentPath,entryName,-1);				
		}
		else if(entryType == 2)
		{
			File file = new File(localEntryPath);
			file.mkdir();
			//Get the subEntries and call svnGetEntry
			List <SVNDirEntry> subEntries = svnUtil.getSubEntries(remoteEntryPath);
			for(int i=0;i<subEntries.size();i++)
			{
				SVNDirEntry subEntry =subEntries.get(i);
				String subEntryName = subEntry.getName();
				if(svnGetEntry(reposURL,svnUser,svnPwd,remoteEntryPath,subEntryName,localEntryPath,subEntryName) == false)
				{
					System.out.println("svnGetEntry() svnGetEntry Failed: " + subEntryName);
					return false;
				}
			}
		}
		else if(entryType == 0)
		{
			System.out.println("svnGetEntry() " + remoteEntryPath + " 在仓库中不存在！");
			return false;
		}
		else	//如果已经存在，则只是将修改的内容commit到服务器上
		{
			System.out.println("svnGetEntry() " + remoteEntryPath + " 是未知类型！");
			return false;
		}
	
		return true;
	}

	//svnRevert: only for file
	private boolean svnRevert(String reposURL, String svnUser, String svnPwd, String parentPath,String entryName,String localParentPath,String localEntryName) 
	{

		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(reposURL, svnUser, svnPwd) == false)
		{
			System.out.println("svnRevert() svnUtil Init Failed: " + reposURL);
			return false;
		}
		
		String remoteEntryPath = parentPath + entryName;
		String localEntryPath = localParentPath + localEntryName;
		try {
			if(svnUtil.doCheckPath(remoteEntryPath, -1) == false)	//检查文件是否已经存在于仓库中
			{
				System.out.println(remoteEntryPath + " 在仓库中不存在！");
				return false;
			}
			else //getFile From the Version DataBase
			{
				svnUtil.getFile(localEntryPath,parentPath,entryName,-1);
			}
		} catch (SVNException e) {
			System.out.println("svnRevert() revertFile " + localEntryPath + " Failed!");
			e.printStackTrace();
			return false;
		}
	
		return true;
	}
	
	private boolean svnCopy(String reposURL, String svnUser, String svnPwd,
			String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName,
			String commitMsg) 
	{
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(reposURL, svnUser, svnPwd);
		
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, false) == false)
		{
			return false;
		}
		return true;
	}
	
	private boolean svnMove(String reposURL, String svnUser, String svnPwd,
			String srcParentPath,String srcEntryName, String dstParentPath,String dstEntryName,
			String commitMsg)  
	{
		SVNUtil svnUtil = new SVNUtil();
		svnUtil.Init(reposURL, svnUser, svnPwd);
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg, true) == false)
		{
			return false;
		}
		return true;
	}
	
}
	