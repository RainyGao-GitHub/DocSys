package com.DocSystem.common.remoteStorage;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import jcifs.smb.NtlmPasswordAuthentication;
import jcifs.smb.SmbFile;
import jcifs.smb.SmbFileInputStream;
import jcifs.smb.SmbFileOutputStream;


public class SmbUtil { 
    
	private String host; 
	private Integer port = 139; //137,138,139和445
    private String userdomain = "";  //域账号,没有可以不填
	private String username = ""; 
	private String password = ""; 
            
	NtlmPasswordAuthentication auth;
	String remoteBaseUrl;
	
    public SmbUtil(String userdomain, String username, String password, String host) {
        this.userdomain = userdomain;
    	this.username = username;
        this.password = password;
        this.host = host;
    }
        
    /**
     * 连接sftp服务器
     */
    public boolean login() {
    	auth = new NtlmPasswordAuthentication(userdomain, username, password);
    	remoteBaseUrl = "smb://" + host;
    	return true;
    }
    
    public void logout() {
    }
    
    public SmbFile[] listFiles(String directory){
    	SmbFile[] list = null;
    	String remoteUrl = remoteBaseUrl + directory;
    	SmbFile remoteFile;
		try {
			remoteFile = new SmbFile(remoteUrl, auth);
	        if (remoteFile.exists()) 
	        {
	        	list =  remoteFile.listFiles();
	        }
		} catch (Exception e) {
			e.printStackTrace();
		}        
        return list;
    }
  
    public SmbFile getEntry(String path, String name){
    	String remoteUrl = remoteBaseUrl + path + name;
    	SmbFile remoteFile = null;
		try {
			remoteFile = new SmbFile(remoteUrl, auth);
		} catch (Exception e) {
			e.printStackTrace();
		}        
        return remoteFile;
    }
    
    public boolean upload( String pathname, String fileName, InputStream input){ 
      boolean ret = false;
      String remoteUrl = remoteBaseUrl + pathname;
      OutputStream out = null;
      try{
    	  SmbFile remoteFile = new SmbFile(remoteUrl + fileName);
    	  out = new BufferedOutputStream(new SmbFileOutputStream(remoteFile));
          byte[] buffer = new byte[1024];
          while (input.read(buffer) != -1) 
          {
              out.write(buffer);
              buffer = new byte[1024];
          }
          out.flush();
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
        InputStream in = null;
        
        String remoteUrl = remoteBaseUrl + remotePath;
        try {
        	File localDir = new File(localPath);
            if(localDir.exists() == false)
            {
            	localDir.mkdirs();
            }
            
            SmbFile remoteFile = new SmbFile(remoteUrl + fileName, auth);
            if (remoteFile.exists()) {
            	file = new File(localPath + fileName);
            	os = new FileOutputStream(file);
            	in = new BufferedInputStream(new SmbFileInputStream(remoteFile));
                byte[] buffer = new byte[1024];
                while (in.read(buffer) != -1) {
                	os.write(buffer);
                    buffer = new byte[1024];
                }
                os.flush(); //刷新缓冲区输出流
            }
            ret = true;
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
        	if(in != null)
        	{
        		try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
        	}
        }
        return ret;
    }
  
    public boolean mkdir(String dir) { 
    	 boolean ret = false; 
    	 String remoteUrl = remoteBaseUrl + dir;
    	 try { 
    		 SmbFile remoteFile = new SmbFile(remoteUrl, auth);
    		 if(remoteFile.exists() == false)
    		 {
    			 remoteFile.mkdir();
    		 }
    		 ret = true;
    	 } catch (Exception e) { 
    		 e.printStackTrace(); 
    	 } 
    	 return ret; 
	}
    
    public boolean delete(String directory, String fileName)
    {
    	boolean ret = false;
   	 	String remoteUrl = remoteBaseUrl + directory;
   	 
   	 	try {
   	 		SmbFile remoteFile = new SmbFile(remoteUrl, auth);
   		 	if(remoteFile.exists())
   		 	{
   			 	remoteFile.delete();
   		 	}
   		 	ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
   	 	return ret;
    }

	public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove) {
    	boolean ret = false;   	 
   	 	try {
   	 		SmbFile remoteFile = new SmbFile(remoteBaseUrl + srcRemotePath + srcName, auth);
   		 	if(remoteFile.exists())
   		 	{
   		 		SmbFile dstRemoteFile = new SmbFile(remoteBaseUrl + dstRemotePath + dstName, auth);
   			 	if(isMove)
   			 	{
   			 		remoteFile.renameTo(dstRemoteFile);
   			 	}
   			 	else
   			 	{
   			 		remoteFile.copyTo(dstRemoteFile);   			 		
   			 	}
   	   		 	ret = true;
   		 	}
        } catch (Exception e) {
			e.printStackTrace();
		}
   	 	return ret;
	}
}