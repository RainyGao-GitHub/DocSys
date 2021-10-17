package com.DocSystem.common.remoteStorage;

import java.io.FileInputStream;

import com.DocSystem.common.Log;

import jcifs.smb.SmbFile;

class SmbUtilTest {  
	
	public static void main(String[] args) throws Exception { 
	      SmbUtil smb = new SmbUtil("", "ragao", "Rain_121902", "eseefsn50.emea.nsn-net.net");  
	      String remotePath = "/rotta4internal/BB_2/Oulu/pihlman/PR/Logs_1708_21B_3UE/";
	      String localPath = "C:/SmbTestRootPath/";
	      String fileName = "123.txt";
	      
	      smb.login();
	      
	      SmbFile[] list = smb.listFiles(remotePath);
	      for(int i=0; i< list.length; i++)
	      {
	    	  SmbFile entry = list[i];
	    	  Log.debug(entry.getName());
	      }
	      
	      //Upload test
	      //FileInputStream is = new FileInputStream(localPath + "/" + fileName);
		  //smb.upload(remotePath, fileName, is);
		  //is.close();
	      
		  //Download Test
	      //smb.download(remotePath, localPath, fileName); 

	      //Delte Test
	      //smb.delete(remotePath, fileName);
	      
	      smb.logout();
		}

} 