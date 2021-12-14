package com.DocSystem.test;

import java.io.FileInputStream;

import com.DocSystem.common.remoteStorage.FtpUtil;

public class FtpUtilTest { 
    
	public static void main(String[] args) throws Exception { 
      FtpUtil ftp = new FtpUtil("sg10", "sg10", "10.108.163.51", 21, null, null);  
      
      String remotePath = "/gaolei/20210730_csibunding_enable_CSI_DTX/";
      String localPath = "C:/FtpTestRootPath/";
      String fileName = "123.txt";
      
      ftp.login();
      
      //Upload test
      FileInputStream is = new FileInputStream(localPath + "/" + fileName);
	  ftp.upload(remotePath, fileName, is);
	  is.close();
      
	  //Download Test
      ftp.download(remotePath, localPath, fileName); 

      //Delte Test
      ftp.delFile(remotePath, fileName); 
      
      ftp.logout();
	}
}