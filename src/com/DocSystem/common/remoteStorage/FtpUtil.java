package com.DocSystem.common.remoteStorage;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.util.Vector;

import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.commons.net.ftp.FTPReply;

import com.DocSystem.common.Log;
import com.jcraft.jsch.ChannelSftp.LsEntry;


public class FtpUtil { 
    
	private String host; 
	private Integer port = 21; //default 21 
	private String username; 
	private String password; 
      
    public FTPClient ftpClient = null;
	private String charset = "utf-8"; 
	private Boolean isPassive = false; 	
      
    public FtpUtil(String username, String password, String host, int port, String charset, Boolean isPassive) {
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
        if(charset != null)
        {
        	this.charset = charset;
        }
        this.isPassive = isPassive; //PassiveMode()
    }
    
    public FtpUtil() {
    }

    
    /**
     * 连接sftp服务器
     */
    public boolean login() {
    	ftpClient = new FTPClient();     	
    	ftpClient.setControlEncoding(this.charset); 
    	
    	try { 
    		Log.debug("connecting...ftp服务器:"+this.host+":"+this.port);  
    		ftpClient.connect(host, port); //连接ftp服务器 
    		
    		if(isPassive)
    		{
    			//ftpClient.enterLocalActiveMode();    //主动模式
    			ftpClient.enterLocalPassiveMode(); //被动模式
    		}
    		
    		ftpClient.login(username, password); //登录ftp服务器 
    		int replyCode = ftpClient.getReplyCode(); //是否成功登录服务器 
    		if(!FTPReply.isPositiveCompletion(replyCode)){ 
    			Log.debug("connect failed...ftp服务器:"+this.host+":"+this.port);
    			return false;
    		} 
    		Log.debug("connect successfu...ftp服务器:"+this.host+":"+this.port);  
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
        Log.debug("download remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
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
    
    public boolean delFile(String directory, String fileName)
    {
    	boolean ret = false;
        try {
        	 //ftpClient.changeWorkingDirectory(directory);  
             //ftpClient.dele(fileName);
             ftpClient.dele(directory + fileName);
             ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
    }
    
	public boolean delDir(String directory, String fileName) {
    	boolean ret = false;
        try {
             ftpClient.removeDirectory(directory + fileName);
             ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
	}
    
    public boolean delDirs(String directory, String fileName) {
    	boolean ret = false;
		try {       	        	
			FTPFile[] list = ftpClient.listFiles(directory + fileName);
			if(list != null)
			{
				for(int i=0; i<list.length; i++)
				{
					FTPFile subEntry = list[i];
					String subEntryName = subEntry.getName();
					if(subEntry.isDirectory())
					{
						if(delDirs(directory + fileName + "/", subEntryName) == false)
						{
							Log.debug("delDirs() delete folder [" + directory + fileName + subEntryName + "] Failed");
							return false;
						}
					}
					else
					{
						if(delFile(directory + fileName + "/", subEntryName) == false)
						{
							return false;
						}
					}
				}
			}
			ret = delDir(directory, fileName);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	return ret;
    }

	public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
       if(isMove)
       {
    	   return move(srcRemotePath, srcName, dstRemotePath, dstName);
       }
 
       return copy(srcRemotePath, srcName, dstRemotePath, dstName, type);
	} 
    
	public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, Integer type) {
    	if(type == 1)
    	{
    		Log.debug("copy() " + srcRemotePath + srcName + " is file");
    		return copyFile(srcRemotePath, srcName, dstRemotePath, dstName);
    	}

		Log.debug("copy() " + srcRemotePath + srcName + " is directory");
    	return copyDir(srcRemotePath, srcName, dstRemotePath, dstName);
	} 
	
	private boolean copyDir(String srcRemotePath, String srcName, String dstRemotePath, String dstName) {
		boolean ret = false;
		ret = mkdir(dstRemotePath + dstName);
    	
		if(ret == true)
		{
			//copy subEntries
			try {
	    		FTPFile[] list = ftpClient.listFiles(srcRemotePath + srcName); 
	    		if(list != null)
	            { 
	            	for(int i=0; i < list.length; i++)
		            {
		            	FTPFile srcFile = list[i];
		            	if(srcFile.isFile())
		            	{
		            		copyFile(srcRemotePath + srcName + "/", srcFile.getName(), dstRemotePath + dstName + "/", srcFile.getName());
		            	}
		            	else
		            	{
		            		copyDir(srcRemotePath + srcName + "/", srcFile.getName(),  dstRemotePath + dstName + "/", srcFile.getName());
		            	}
	    			}
	            } 
	        } catch (Exception e) {
				e.printStackTrace();
			}
		}
        return ret;
	}

	public boolean copyFile(String srcRemotePath, String srcName, String dstRemotePath, String dstName) {
    	boolean ret = false;
        try {
	        ftpClient.setBufferSize(1024); 
	        ByteArrayOutputStream fos=new ByteArrayOutputStream();
	        ftpClient.retrieveFile(srcRemotePath + srcName, fos);
	        ByteArrayInputStream in=new ByteArrayInputStream(fos.toByteArray());
	        ftpClient.storeFile(dstRemotePath + dstName, in);
	        fos.close();
	        in.close();
             ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
	} 
	
	public boolean move(String srcRemotePath, String srcName, String dstRemotePath, String dstName) {
    	boolean ret = false;
        try {
        	 ftpClient.rename(srcRemotePath + srcName, dstRemotePath + dstName);  
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