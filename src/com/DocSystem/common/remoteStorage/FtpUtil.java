package com.DocSystem.common.remoteStorage;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.commons.net.ftp.FTPReply;


public class FtpUtil { 
    
	private String host; 
	private Integer port = 21; //default 21 
	private String username; 
	private String password; 
      
    public FTPClient ftpClient = null; 
      
    public FtpUtil(String username, String password, String host, int port) {
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
    }
    
    public FtpUtil() {
    }

    
    /**
     * 连接sftp服务器
     */
    public boolean login() {
    	ftpClient = new FTPClient(); 
    	ftpClient.setControlEncoding("utf-8"); 
    	try { 
    		System.out.println("connecting...ftp服务器:"+this.host+":"+this.port);  
    		ftpClient.connect(host, port); //连接ftp服务器 
    		ftpClient.login(username, password); //登录ftp服务器 
    		int replyCode = ftpClient.getReplyCode(); //是否成功登录服务器 
    		if(!FTPReply.isPositiveCompletion(replyCode)){ 
    			System.out.println("connect failed...ftp服务器:"+this.host+":"+this.port);
    			return false;
    		} 
    		System.out.println("connect successfu...ftp服务器:"+this.host+":"+this.port);  
    	}catch (MalformedURLException e) {  
    		e.printStackTrace();
    		return false;
    	}catch (IOException e) {  
    		e.printStackTrace();
    		return false;
    	}
    	return true;
    }
    
    public void logout() {
        if (ftpClient != null) {
            if (ftpClient.isConnected()) {
            	try {
					ftpClient.disconnect();
				} catch (IOException e) {
					e.printStackTrace();
				}
            }
        }
    }
  
    public FTPFile[] listFiles(String directory){
    	FTPFile[] list = null;
    	try {
			list = ftpClient.listFiles(directory);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	return list;
    }
    
    public boolean upload( String pathname, String fileName, InputStream input){ 
      boolean ret = false; 
      try{ 
    	  ftpClient.setFileType(ftpClient.BINARY_FILE_TYPE); 
    	  ftpClient.changeWorkingDirectory(pathname); 
    	  ftpClient.storeFile(fileName, input); 
    	  ret = true; 
      }catch (Exception e) { 
    	  e.printStackTrace(); 
      } 
      return ret; 
    } 
    
    public boolean download(String remotePath, String localPath, String fileName) {
        System.out.println("download remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
        boolean ret = false;
        File file = null;
        FileOutputStream os = null;
        
        try {
      	  	ftpClient.changeWorkingDirectory(remotePath);  
            File localDir = new File(localPath);
            if(localDir.exists() == false)
            {
            	localDir.mkdirs();
            }
            file = new File(localPath + fileName);
            os = new FileOutputStream(file);
			ret = ftpClient.retrieveFile(fileName, os);  
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
        	if(os != null)
        	{
        		try {
					os.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
        	}
        }
        return ret;
    }
    
	public boolean mkdir(String dir) { 
		boolean ret = false; 
		try { 
			ret = ftpClient.makeDirectory(dir);
		} catch (Exception e) { 
			e.printStackTrace(); 
		} 
		return ret; 
	}
    
    public boolean delete(String directory, String fileName)
    {
    	boolean ret = false;
        try {
        	 ftpClient.changeWorkingDirectory(directory);  
             ftpClient.dele(fileName);
             ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
    }
    
     public boolean cd(String directory) 
     { 
        boolean ret = true; 
        try { 
        	ftpClient.changeWorkingDirectory(directory); 
        	ret = true;
        } catch (Exception e) { 
        	e.printStackTrace(); 
        } 
        return ret; 
     }	 
  
    public boolean isFileExists(String path) throws IOException { 
        boolean flag = false;
        FTPFile[] ftpFileArr = ftpClient.listFiles(path); 
        if (ftpFileArr.length > 0) { 
          flag = true; 
        } 
        return flag; 
    } 
}