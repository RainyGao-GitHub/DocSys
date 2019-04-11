package com.DocSystem.common;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Zip;
import org.apache.tools.ant.types.FileSet;
import org.springframework.web.multipart.MultipartFile;
import util.CompressPic;
import util.DateFormat;
import util.ReturnAjax;

import com.alibaba.fastjson.JSON;

import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;
import util.Base64File;

@SuppressWarnings("rawtypes")
public class BaseFunction{
	protected String ROWS_PER_PAGE;// 每页显示的记录数
	protected String curPage;// 当前第几页

	/***************************** json相关接口 ***************************/
	/**
	 * 向页面返回json信息
	 * @param obj
	 * @param response
	 */
	protected void writeJson(Object obj,HttpServletResponse response) {
		
		try {
			response.setCharacterEncoding("UTF-8");
			String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
			PrintWriter pw = response.getWriter();
			response.setContentType("application/javascript");
			pw.write(json);
			pw.flush();
			pw.close();
		} catch (IOException e) {
			System.out.println("BaseController>writeJson  ERROR!");
			e.printStackTrace();
		}
		
	}
	
	/**
	 * 设置cookie
	 * @param response
	 * @param name  cookie名字
	 * @param value cookie值
	 * @param maxAge cookie生命周期  以秒为单位
	 */
	public static void addCookie(HttpServletResponse response,String name,String value,int maxAge){
	    Cookie cookie = new Cookie(name,value);
	    cookie.setPath("/");
	    if(maxAge>0)  cookie.setMaxAge(maxAge);
	    response.addCookie(cookie);
	}
	
	/**
	 * 根据名字获取cookie
	 * @param request
	 * @param name cookie名字
	 * @return
	 */
	public static Cookie getCookieByName(HttpServletRequest request,String name){
	    Map<String,Cookie> cookieMap = ReadCookieMap(request);
	    if(cookieMap.containsKey(name)){
	        Cookie cookie = (Cookie)cookieMap.get(name);
	        return cookie;
	    }else{
	        return null;
	    }   
	}
	
	/**
	 * 将cookie封装到Map里面
	 * @param request
	 * @return
	 */
	private static Map<String,Cookie> ReadCookieMap(HttpServletRequest request){  
	    Map<String,Cookie> cookieMap = new HashMap<String,Cookie>();
	    Cookie[] cookies = request.getCookies();
	    if(null!=cookies){
	        for(Cookie cookie : cookies){
	            cookieMap.put(cookie.getName(), cookie);
	        }
	    }
	    return cookieMap;
	}
	
	
	/***************************图片上传相关接口*****************************/
	protected static String[] IMGALLOWDTYPES = {"JPG","JPEG","PNG","GIF","BMP"};
	
	/**
	 * 保存前台传回的图片
	 * @param imgFile
	 * @param path 保存地址
	 * @oaram compressPath 压缩图片地址
	 * @return 上传文件名称
	 */
	public String saveImg(MultipartFile imgFile,String path,String compressPath,boolean limitType)throws Exception{
		String imgName = imgFile.getOriginalFilename();
		String ext = imgName.substring(imgName.lastIndexOf('.')+1);
		ext = ext.toLowerCase();
		//可以上传的图片类型
		//定义一个数组，用于保存可上传的文件类型
		
		
		long fileSize = imgFile.getSize();
		if(fileSize==0){
			return null;
		}
		System.out.println("文件大小：" + Math.floor(fileSize/1024));
		if(limitType){
			if(fileSize>200*1024*1024){
				throw new FileUploadException("上传文件过大");
			}
			List<String> fileTypes = new ArrayList<String>();
			fileTypes.add("jpg");
			fileTypes.add("jpeg");
			fileTypes.add("bmp");
			fileTypes.add("gif");
			fileTypes.add("png");
			if(!fileTypes.contains(ext)){
				throw new Exception("上传文件格式不支持");
			}
		}else{
			if(fileSize>20*1024*1024){
				throw new FileUploadException("上传图片过大");
			}
		}
		File _imgFile = null;
		String _fileName = "";
		
		if(imgName!=null&&!"".equals(imgName)){
			File forder1 = new File(path);
			if(forder1.exists()){
			}else{
				forder1.mkdirs();
			}
			_fileName = generateDateAndRadom() + "." + ext;
			_imgFile = new File(path,_fileName);
			try {
				imgFile.transferTo(_imgFile);
				//压缩图片到smallPic目录
				if(limitType&&path!=null&&!path.equals("")&&compressPath!=null&&!compressPath.equals("")){
					CompressPic cp = new CompressPic();
					cp.setInputDir(path);
					cp.setOutputDir(compressPath);
					cp.setInputFileName(_imgFile.getName());
					cp.setOutputFileName(_imgFile.getName());
					cp.compressPic();
				}
			} catch (Exception e) {
				throw new Exception("上传图片保存本地图片失败，源文件名：" + imgName);
			}
		}
		return _fileName;
	}
	
	public ReturnAjax saveImgAjax(String folder,String file,String fileName,String compressPath,boolean limitType)throws Exception{
		ReturnAjax rt = new ReturnAjax();
		String ext = fileName.substring(fileName.lastIndexOf("."));
		long fileSize = file.length();
		System.out.println("文件大小：" + Math.floor(fileSize/1024));
		if(fileSize==0){
			return null;
		}
		if(limitType){
			if(fileSize>20*1024*1024){
				throw new FileUploadException("上传文件过大");
			}
			List<String> fileTypes = new ArrayList<String>();
			fileTypes.add("jpg");
			fileTypes.add("jpeg");
			fileTypes.add("bmp");
			fileTypes.add("gif");
			fileTypes.add("png");
			if(!fileTypes.contains(ext)){
				throw new Exception("上传文件格式不支持");
			}
		}else{
			if(fileSize>200*1024*1024){
				throw new FileUploadException("上传图片过大");
			}
		}
		try {
			String _fileName = generateDateAndRadom() + ext;
			Base64File.decode(file, folder + File.separator, _fileName);
			System.out.println("上传路径："+folder+";上传名称：" + _fileName);
			//压缩图片到smallPic目录
			if(limitType&&folder!=null&&!folder.equals("")&&compressPath!=null&&!compressPath.equals("")){
				CompressPic cp = new CompressPic();
				cp.setInputDir(folder);
				cp.setOutputDir(compressPath);
				cp.setInputFileName(_fileName);
				cp.setOutputFileName(_fileName);
				cp.compressPic();
			}
			rt.setData(_fileName);
		} catch (Exception e) {
			e.printStackTrace();
			rt.setError("上传图片失败。");
			rt.setData("上传图片失败。");
		}
		return rt;
	}
	
	protected String generateDateAndRadom(){
		Date date = new Date();
		String dateStr = DateFormat.dateTimeFormat2(date);
		String r = Math.round(Math.random()*100000)+"";
		System.out.println(dateStr+";"+r);
		return "freeteam"+dateStr+"_"+r;
	}
	
	protected boolean checkImgType(String type) {
		String upperType = type.toUpperCase();
		for(String s: IMGALLOWDTYPES){
			if(upperType.equals(s)||upperType.endsWith(s)){
				return true;
			}
		}
		return false;
	}
	
	/************************ session相关接口 **************************************/
	protected Map session;
	
	public Map getSession() {
		return session;
	}

	public void setSession(Map session) {
		this.session = session;
	}
	
	/****************************** 文件操作相关接口 ***********************************/
	/**
	 * 获取文件编码格式
	 * @param filePath
	 * @return UTF-8/Unicode/UTF-16BE/GBK
	 * @throws Exception
	 */
	public static String getFileEncode(String filePath) throws Exception {
        String charsetName = null;
        try {
            File file = new File(filePath);
            CodepageDetectorProxy detector = CodepageDetectorProxy.getInstance();
            detector.add(new ParsingDetector(false));
            detector.add(JChardetFacade.getInstance());
            detector.add(ASCIIDetector.getInstance());
            detector.add(UnicodeDetector.getInstance());
            java.nio.charset.Charset charset = null;
            charset = detector.detectCodepage(file.toURI().toURL());
            if (charset != null) {
                charsetName = charset.name();
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
        return charsetName;
	}
	
    public boolean compressExe(String srcPathName,String finalFile) {
    	File zipFile = new File(finalFile);	//finalFile
    	
        File srcdir = new File(srcPathName); //srcFile or Dir
        if (!srcdir.exists()){
        	System.out.println(srcPathName + "不存在！");
        	return false;
        }   
            
        Project prj = new Project();    
        Zip zip = new Zip();    
        zip.setProject(prj);    
        zip.setDestFile(zipFile);    
        FileSet fileSet = new FileSet();    
        fileSet.setProject(prj);    
        fileSet.setDir(srcdir);    
        //fileSet.setIncludes("**/*.java"); //包括哪些文件或文件夹 eg:zip.setIncludes("*.java");    
        //fileSet.setExcludes(...); //排除哪些文件或文件夹    
        zip.addFileset(fileSet);    
        zip.execute();  
		
        if(zipFile.exists())
        {
        	return true;
        }
        return false;
    }
    
    public boolean copyFile(String srcFilePath,String dstFilePath,boolean cover){
        File dstFile=new File(dstFilePath);
        if(dstFile.exists())
        {
        	if(cover == false)
        	{
        		//不允许覆盖
        		System.out.println("copyFile() " + dstFilePath + " exists!");
        		return false;
        	}        	
        }
        
        try {
	        //Copy by Channel
	        FileInputStream in=new FileInputStream(srcFilePath);
	        FileOutputStream out=new FileOutputStream(dstFilePath);
	        FileChannel inputChannel = in.getChannel();    
	        FileChannel outputChannel = out.getChannel();   
	        outputChannel.transferFrom(inputChannel, 0, inputChannel.size());
		   	inputChannel.close();
		    outputChannel.close();
		    in.close();
		    out.close();
        }
    	catch (Exception e) { 
    		System.out.println("copyFile() copy file Exception"); 
    		e.printStackTrace(); 
    		return false;
    	}
    	return true;
    }
    
    public boolean copyDir(String srcPath, String dstPath, boolean cover) 
    {
	    try {
	    	//Check the newPath
	    	File dstDir = new File(dstPath);
	    	if(dstDir.exists())
	    	{
	    		if(cover == false)
	    		{
	    			System.out.println("copyDir() dstPath exists:"+dstPath);
	    			return false;	    			
	    		}
	    	}
	    	else
	    	{
	    		//mkdirs will create the no exists parent dir, so I use the mkdir
	    		if(dstDir.mkdir() == false)
	    		{
	    			System.out.println("copyDir() Failed to create dir:"+dstPath);
	    			return false;
	    		}
	    	}
	    	
	    	//Check the srcDir
	    	File srcDir = new File(srcPath); 
		    String[] file=srcDir.list(); 
		    File temp=null; 
		    for (int i = 0; i < file.length; i++) 
		    { 
		    	String subSrcFilePath = null;
		    	String subDstFilePath = null;
		    	if(srcPath.endsWith(File.separator))
		    	{ 
		    		subSrcFilePath = srcPath+file[i];
		    		subDstFilePath = dstPath + file[i];
		    	} 
		    	else
		    	{ 
		    		subSrcFilePath = srcPath+File.separator+file[i];
		    		subDstFilePath = dstPath+File.separator+file[i];
		    	} 

	    		temp=new File(subSrcFilePath); 
		    	if(temp.isFile())
		    	{ 
		    		copyFile(subSrcFilePath, subDstFilePath, cover);
		    	}
		    	else //if(temp.isDirectory()) //如果是子文件夹
		    	{ 
		    		copyDir(subSrcFilePath, subDstFilePath, cover); 
		    	} 
		    } 
	    } 
	    catch (Exception e) 
	    { 
	    	System.out.println("copyDir 异常"); 
	    	e.printStackTrace(); 
	    	return false;
	    }
	    return true;
    }
    
    //Copy FileOrDir
    public boolean copyFileOrDir(String srcPath, String dstPath,boolean cover){
	    //Check the newPath
	    File dstDir = new File(dstPath);
	    if(dstDir.exists())
	    {
	    	if(cover == false)
	    	{
	    		System.out.println("copyFileOrDir() dstPath exists:"+dstPath);
	    		return false;	    			
	    	}
	    }
	    
	    File srcDir = new File(srcPath);
	    if(srcDir.isFile())
	    {
	    	if(false == copyFile(srcPath, dstPath, cover))
	    	{
	    		System.out.println("copyFileOrDir() copyFile Failed:"+dstPath);
		    	return false;
	    	}
	    }
	    else
	    {
	    	if(false == copyDir(srcPath, dstPath, cover))
	    	{
	    		System.out.println("copyFileOrDir() copyDir Failed:"+dstPath);
		    	return false;
	    	}
	    }
	    return true;
	}
    
    //将dstDirPath同步成srcDirPath
	protected boolean syncUpFolder(String srcParentPath,String srcName, String dstParentPath, String dstName,boolean modifyEnable) 
	{
		String srcPath =  srcParentPath + srcName;
		String dstPath =  dstParentPath + dstName;
		
		//If the dstDirPath 不存在则，直接复制整个目录
		File dstFolder = new File(dstPath);
		if(!dstFolder.exists())
		{
			return copyDir(srcPath,dstPath,true);
		}
	
		if(dstFolder.isFile())
		{
			System.out.println(dstPath + " 不是目录！");
			return false;
		}

		try {
			
			//SyncUpForDelete
			syncUpForDelete(srcParentPath,srcName,dstParentPath,dstName);
			
			//SyncUpForAddAndModify
			if(modifyEnable)
			{
				syncUpForAddAndModify(srcParentPath,srcName,dstParentPath,dstName);
			}
			else
			{
				syncUpForAdd(srcParentPath,srcName,dstParentPath,dstName);
			}
		} catch (IOException e) {
			System.out.println("syncUpFolder() Exception!");
			e.printStackTrace();
			return false;
		}
		return true;
	}
    
    private void syncUpForAdd(String srcParentPath,String srcName, String dstParentPath, String dstName) throws IOException {
    	System.out.println("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(srcFile.exists())
        {
        	if(!dstFile.exists())
        	{
        		if(srcFile.isDirectory())
        		{
        			dstFile.mkdir();	//新建目录
        		}
        		else
        		{
        			copyFile(srcPath,dstPath,false);
        		}
        	}
        	
            //Go through the subEntries
        	if(srcFile.isDirectory())
        	{
    			File[] tmp=srcFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForAdd(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }	
	}

	private void syncUpForAddAndModify(String srcParentPath,String srcName, String dstParentPath, String dstName) throws IOException {
    	System.out.println("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(srcFile.exists())
        {
        	if(!dstFile.exists())
        	{
        		if(srcFile.isDirectory())
        		{
        			dstFile.mkdir();	//新建目录
        		}
        		else
        		{
        			copyFile(srcPath,dstPath,false);
        		}
        	}
        	else
        	{
        		if(srcFile.isFile())
        		{
        			copyFile(srcPath,dstPath,true);
        		}
        	}
        	
            //Go through the subEntries
        	if(srcFile.isDirectory())
        	{
    			File[] tmp=srcFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForAddAndModify(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }	
	}

	private void syncUpForDelete(String srcParentPath, String srcName, String dstParentPath, String dstName) {
    	System.out.println("syncUpForDelete() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(dstFile.exists())
        {
        	if(!srcFile.exists())
        	{
        		delDir(dstPath);	//删除目录或文件
        		return;
        	}
        	else
        	{
        		if(dstFile.isDirectory() != srcFile.isDirectory())	//类型不同
        		{
        			delDir(dstPath); //删除目录或文件
            		return;
        		}
        	}
        	
            //Go through the subEntries
        	if(dstFile.isDirectory())
        	{
    			File[] tmp=dstFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForDelete(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }
	}
	
    //Move FileOrDir
    public boolean moveFileOrDir(String oldpath,String oldName,String newpath,String newName,boolean cover){
    	
    	String oldFilePath = oldpath + oldName;
    	String newFilePath = newpath + newName;
    	
    	if(!oldFilePath.equals(newFilePath))
        {
            File oldfile=new File(oldFilePath);
            if(oldfile.exists() == false)
            {
            	System.out.println("moveFile() oldFilePath:" + oldFilePath + " does not exist");
            	return false;
            }
            
            File newfile=new File(newFilePath);
            if(newfile.exists()) //若在待转移目录下，已经存在待转移文件
            {
            	System.out.println("moveFile() newFilePath:" + newFilePath + " already exists");
            	if(cover)//覆盖
                {
                	System.out.println("moveFile() 强制覆盖！");
                    return oldfile.renameTo(newfile);
                }
                else
                {
                    return false;
                }
            }
            else
            {
            	return oldfile.renameTo(newfile);
            }
        }
        else
        {
        	System.out.println("moveFile() newFilePath:" + newFilePath + " is same to oldFilePath:" + oldFilePath);
        	return true;
        }
    }
    
    //Create Directory
    public boolean createDir(String path){
        File dir=new File(path);
        if(!dir.exists())
        {
            return dir.mkdir();
        }
        else
        {
        	return true;
        }
    }
    
    //Create File
    public boolean createFile(String path,String filename){
        File dir = new File(path);
        if(!dir.exists())
        {
        	return false;
        }
        
    	File file=new File(path+"/"+filename);
        if(!file.exists())
        {    
        	try {
				return file.createNewFile();
			} catch (IOException e) {
				e.printStackTrace();
				return false;
			}
        }
        else
        {
        	return true;
        }
    }
    //Delete File
    public boolean delFile(String path){
        File file=new File(path);
        if(file.exists())
        {
        	if(file.isFile())
        	{
        		return file.delete();	
        	}
        	else
        	{
        		return false;
        	}
        }
        return true;
    }
    
    //Delete Directory, path must be dir path
    public boolean delDir(String path){
        File dir=new File(path);
        if(dir.exists())
        {
            File[] tmp=dir.listFiles();            
            for(int i=0;i<tmp.length;i++)
            {
            	String subDirPath = path+"/"+tmp[i].getName();
                if(tmp[i].isDirectory())
                {
                    if(delDir(subDirPath) == false)
                    {
                    	System.out.println("delDir() delete subDir Failed:" + subDirPath);
                    	return false;
                    }
                }
                else
                {
                    if(tmp[i].delete() == false)
                    {
                    	System.out.println("delDir() delete subFile Failed:" + subDirPath);
                    	return false;
                    }
                }
            }
            if(dir.delete() == false)
            {
            	System.out.println("delDir() delete Dir Failed:" + path);
                return false;
            }
        }
        return true;
    }
	
    //Delete Directory or File
    public static boolean delFileOrDir(String path){
        File file=new File(path);
        if(file.exists())
        {
            if(file.isDirectory())
            {
	            File[] tmp=file.listFiles();            
	            for(int i=0;i<tmp.length;i++)
	            {
	            	String subDirPath = path+"/"+tmp[i].getName();
	                if(delFileOrDir(subDirPath) == false)
	                {
	                	System.out.println("delFileOrDir() delete subDir Failed:" + subDirPath);
	                    return false;
	                }
	            }
            }
            
            if(file.delete() == false)
            {
            	System.out.println("delFileOrDir() delete Dir Failed:" + path);
                return false;
            }
        }
        return true;
    }
    //检查文件是否存在
    public boolean isFileExist(String path){
    	File file=new File(path);
        return file.exists();
    }
    
	public String saveFile(MultipartFile srcFile,String path,String fileName)throws Exception{		
		if(fileName==null || "".equals(fileName))
		{
			System.out.println("saveFile() fileName is empty!");
			return null;
		}
		
		//底层接口不能主动创建上层目录，不存在上层目录则直接报错
		File forder1 = new File(path);
		if(!forder1.exists())
		{
			System.out.println("saveFile() path:" + path + " not exists!");
			//forder1.mkdirs(); //创建目录
			return null;
		}
		
		File dstFile = new File(path,fileName);
		try {
			srcFile.transferTo(dstFile);
		} catch (Exception e) {
			throw new Exception("文件保存到本地失败，源文件名：" + fileName);
		}
		return fileName;
	}

	/****************** 线程锁接口 *********************************************/
	protected static final Object syncLock = new Object(); 
	//释放线程锁
	protected void unlock() {
		unlockSyncLock(syncLock);
	}
	
	protected void unlockSyncLock(Object syncLock) {
		syncLock.notifyAll();//唤醒等待线程
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，我勒了个区去，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}  
	
	/**************************** 其他通用接口 ******************************/
	//To print the obj by convert it to json format
	protected void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);		
	}

	protected static boolean isWinOS() {
		String os = System.getProperty("os.name"); 
		System.out.println("OS:"+ os);  
		if(os.toLowerCase().startsWith("win")){
			return true;
		}
		return false;
	}

	protected boolean isWinDiskStr(String Str) 
	{
		if(Str.length() != 2)
		{
			return false;
		}
		
		char endChar = Str.charAt(1);
		if(endChar != ':')
		{
			return false;
		}
		
		char diskChar = Str.charAt(0);
		if((diskChar >= 'C' && diskChar <= 'Z') ||(diskChar >= 'c' && diskChar <= 'z') ) 
		{
			return true;
		}
		return false;
	}
	
}
