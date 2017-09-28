package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import util.CompressPic;
import util.ReturnAjax;

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

@Controller
@RequestMapping("/Doc")
public class DocController extends BaseController{
	@Autowired
	private ReposServiceImpl reposService;
	
	/****------ Ajax Interfaces For Document Controller ------------------***/ 
	/****************   add a Document ******************/
	@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点
	public void addDoc(String name,Integer type,Integer reposId,Integer parentId,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addDoc name: " + name + " type: " + type+ " reposId: " + reposId + " parentId: " + parentId);
		System.out.println(Charset.defaultCharset());
		System.out.println("黄谦");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户是否有权限新增文件
		if(checkUserAddRight(rt,login_user.getId(),parentId,reposId) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		//get reposPath
		String reposPath = getReposPath(reposId);
		System.out.println("reposPath:" + reposPath);
		String parentPath = getDocFullPath(parentId);		
		System.out.println("parentPath:" + parentPath);
		if(isRealFS(repos.getType())) //0：虚拟文件系统   1： 普通文件系统	
		{
			/*新建文件或目录*/
			//获取 doc parentPath
			String savePath =  reposPath + parentPath;
			System.out.println("savePath:" + savePath);
			if(type == 2) //目录
			{
				if(isFileExist(savePath + name) == true)
				{
					rt.setError(name + "　已存在！");
					writeJson(rt, response);	
					return;
				}
				
				if(false == createDir(savePath + name))
				{
					rt.setError(name + " 创建失败！");
					writeJson(rt, response);	
					return;
				}
			}
			else
			{
				try {
					
					if(isFileExist(savePath + name) == true)
					{
						rt.setError(name + "　已存在！");
						writeJson(rt, response);	
						return;
					}
					
					if(false == createFile(savePath,name))
					{
						rt.setError(name + "创建失败！");
						writeJson(rt, response);	
						return;					
					}
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					rt.setError("系统异常：" + name + "创建异常！");
					writeJson(rt, response);	
					return;
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
			reposService.addDoc(doc);
			System.out.println("id: " + doc.getId());
			rt.setData(doc);
		}
		else
		{
			System.out.println("虚拟文件系统");
			
			//新建doc记录
			Doc doc = new Doc();
			doc.setName(name);
			doc.setType(type);
			doc.setContent("#" + name);
			doc.setPath(parentPath);
			doc.setVid(reposId);
			doc.setPid(parentId);
			reposService.addDoc(doc);
			System.out.println("id: " + doc.getId());
			rt.setData(doc);
		}
		writeJson(rt, response);	
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

	//0：虚拟文件系统  1：实文件系统  2：虚拟文件系统withSVN 3：实文件系统withSVN
	boolean isRealFS(Integer type)
	{
		if(type == 0 || type == 2)
		{
			return false;
		}
		return true;
	}
	
	/****************   Upload a Document 
	 * @throws Exception ******************/
	@RequestMapping("/uploadDoc.do")
	public void uploadDoc(MultipartFile uploadFile, Integer uploadType,Integer reposId, Integer parentId, Integer docId, String filePath,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("uploadDoc reposId:" + reposId + " parentId:" + parentId  + " uploadType:" + uploadType  + " docId:" + docId + " filePath:" + filePath);
		ReturnAjax rt = new ReturnAjax();

		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
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
			String reposPath = getReposPath(reposId);
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
					reposService.addDoc(doc);
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
	
	/**************** download Doc  ******************/
	@RequestMapping("/downloadDoc.do")
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
	}
	
	@RequestMapping("/doGet.do")
	public void doGet(Integer id,HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception{
		System.out.println("doGet id: " + id);

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
		if(doc.getType() == 2)
		{
			realname = realname +".zip";
		}
		//虚拟文件下载
		Repos repos = reposService.getRepos(doc.getVid());
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
			dstPath = repos.getPath() + repos.getName() +  "/tmp/" + doc.getName() + ".zip";	
		
			System.out.println("dstFile" + dstPath);
			//如果是目录，则需要将目录打包后/web/downloads目录下，然后再计算URL给前台
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
			request.setAttribute("message", "您要下载的资源已被删除！！");
			request.getRequestDispatcher("/message.jsp").forward(request, response);
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
	public void deleteDoc(Integer id,HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		
		//检查用户是否有权限新增文件
		if(checkUserDeleteRight(rt,login_user.getId(),doc.getPid(),doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		if(docRecurDelete(id,rt) == false)
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
	public boolean docRecurDelete(Integer id,ReturnAjax rt)
	{
		//取出所有pid==id的doc记录
		Doc qDoc = new Doc();
		qDoc.setPid(id);
		List <Doc> list = reposService.getDocList(qDoc);
		if(list != null)
		{
			for(int i = 0 ; i < list.size() ; i++) {
				Doc subDoc = list.get(i);
				if(docRecurDelete(subDoc.getId(),rt) == false)
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
				if(doc.getType() == 1)
				{
					if(delFile(reposPath + docPath,doc.getName()) == false)
					{
						rt.setError(docPath + doc.getName() + "删除失败！");
						return false;
					}
				}
				else
				{
					if(delDir(reposPath + docPath + doc.getName()) == false)
					{
						rt.setError(docPath + doc.getName() + "删除失败！");
						return false;
					}
				}
			}
			/*删除doc记录*/
			reposService.deleteDoc(id);
			return true;
		}
		return true;	
	}
	
	/****************   rename a Document ******************/
	@RequestMapping("/renameDoc.do")
	public void renameDoc(Integer id,String newname,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("renameDoc id: " + id + " newname: " + newname);
		
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
		
		//检查用户是否有权限编辑文件
		if(checkUserEditRight(rt,login_user.getId(),id,doc.getVid()) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		//开始更改名字了
		Repos repos = reposService.getRepos(doc.getVid());
		String reposPath = getReposPath(doc.getVid());
		if(isRealFS(repos.getType()))	//需要先修改实际文件的名字
		{
			/*rename文件或目录*/
			String docPath = doc.getPath();
			String oldname = doc.getName();
			if(isFileExist(reposPath + docPath + newname) == true)
			{
				rt.setError(newname + "已存在！");
				writeJson(rt, response);	
				return;
			}
			
			if(isFileExist(reposPath + docPath + oldname) == false)
			{
				rt.setError(newname + "不存在！");
				writeJson(rt, response);	
				return;
			}
			
			if(renameFile(reposPath + docPath,oldname,newname) == true)
			{
				/*更新doc记录*/
				doc.setName(newname);
				reposService.updateDoc(doc);
				
				//更新所有子目录的parentId
				docPathRecurUpdate(id,doc.getPid());					
			}
			else
			{
				rt.setError("重命名失败！");
			}
		}
		else
		{
			/*更新doc记录*/
			doc.setName(newname);
			reposService.updateDoc(doc);
			
			//更新所有子目录的parentId
			docPathRecurUpdate(id,doc.getPid());
		}
		
		writeJson(rt, response);	
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
	public void moveDoc(Integer id,Integer dstPid,Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		
		if(docRecurMove(id,dstPid,vid,rt) == false)
		{
			System.out.println("docRecurMove Error");
		}
		
		writeJson(rt, response);	
	}
	
	//doc递归移动函数
	public boolean docRecurMove(Integer id,Integer dstPid,Integer vid,ReturnAjax rt)
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
		String reposPath = getReposPath(vid);
		
		String orgPath = reposPath + orgParentPath;
		String dstPath = reposPath + dstParentPath;
		String filename = doc.getName();
		System.out.println("filename: " + filename + " orgPath: " + orgPath + " dstPath: " + dstPath);
		
		
		if(isRealFS(repos.getType()))
		{
			//只有当orgPid != dstPid 不同时才进行文件移动，否则文件已在正确位置，只需要更新Doc记录
			if(!orgPid.equals(dstPid))
			{
				System.out.println("docRecurMove id:" + id + " orgPid: " + orgPid + " dstPid: " + dstPid);
				//检查orgFile是否存在
				if(isFileExist(orgPath+filename) == false)
				{
					System.out.println("文件: " + filename + " 不存在");
					rt.setError(filename + " 不存在！");
					return false;
				}
				
				//检查dstFile是否存在
				if(isFileExist(dstPath+filename) == true)
				{
					System.out.println("文件: " + filename + " 已存在");
					rt.setError(filename + " 已存在！");
					return false;
				}
			
				/*移动文件或目录*/		
				if(changeDirectory(filename,orgPath,dstPath,false) == false)	//强制覆盖
				{
					System.out.println("文件: " + filename + " 移动失败");
					rt.setError("文件移动失败！");
					return false;
				}
			}
			/*更新doc记录*/
			doc.setPath(dstParentPath);
			doc.setPid(dstPid);
			reposService.updateDoc(doc);
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
				if(docRecurMove(subDocId,suDocDstPid,vid,rt) == false)
				{
					return false;
				}
			};
		}
		return true;	
	}
	
	/****************   move a Document ******************/
	@RequestMapping("/copyDoc.do")
	public void copyDoc(Integer id,Integer dstPid,Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		
		if(docRecurCopy(id,dstPid,vid,rt,false) == false)
		{
			System.out.println("docRecurCopy Error");	
		}
		
		writeJson(rt, response);	
	}
	//doc递归删除函数
	public boolean docRecurCopy(Integer id,Integer dstPid,Integer vid,ReturnAjax rt,boolean RecurFlag)
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
		
		if(isRealFS(repos.getType()))
		{
			if(isFileExist(orgPath+filename) == false)
			{
				System.out.println("文件: " + filename + " 不存在");
				rt.setError(filename + " 不存在！");
				return false;
			}
			
			if(isFileExist(dstPath+filename) == true)
			{
				System.out.println("文件: " + filename + " 已存在");
				rt.setError(filename + " 已存在！");
				return false;
			}
			
			/*复制文件或目录*/
			try {
				
				if(doc.getType() == 2)	//如果是目录则创建目录
				{
					if(false == createDir(dstPath + filename))
					{
						System.out.println("目录: " + filename + " 创建");
						rt.setError(filename + " 创建失败！");
						return false;
					}
				}
				else	//如果是文件则复制文件
				{
					if(copyFile(orgPath+filename,dstPath+filename,false) == false)	//强制覆盖
					{
						System.out.println("文件: " + filename + " 复制失败");
						rt.setError("文件复制失败！");
						return false;
					}
				}
				
				/*add new doc记录*/
				doc.setId(null);
				doc.setPath(dstParentPath);
				doc.setPid(dstPid);
				reposService.addDoc(doc);
				System.out.println("id: " + doc.getId());
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				System.out.println("系统异常：文件复制失败！");
				rt.setError("系统异常：文件复制失败！");
				return false;
			}
		}
		else
		{
			/*add new doc记录*/
			doc.setId(null);
			doc.setPath(dstParentPath);
			doc.setPid(dstPid);
			reposService.addDoc(doc);
			System.out.println("id: " + doc.getId());
		}
		//只返回最上层的doc记录
		if(rt.getData() == null)
		{
			rt.setData(doc);
		}

		
		if(RecurFlag)	//是否递归复制
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
					if(docRecurCopy(subDocId,suDocDstPid,vid,rt,RecurFlag) == false)
					{
						return false;
					}
				};
			}
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
	
	/****************   update Document Content ******************/
	@RequestMapping("/updateDocContent.do")
	public void updateDocContent(Integer id,String content,HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		//Doc temp = reposService.getDoc(id);
		//System.out.println("after: " + temp.getContent());		
		
		writeJson(rt, response);
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
}
	