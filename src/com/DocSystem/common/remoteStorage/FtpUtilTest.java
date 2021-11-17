package com.DocSystem.common.remoteStorage;

import java.io.FileInputStream;

public class FtpUtilTest { 
    
	public static void main(String[] args) throws Exception { 
      FtpUtil ftp = new FtpUtil("sg10", "sg10", "10.108.163.51", 21, null);  
      
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
      ftp.delete(remotePath, fileName); 
      
      ftp.logout();
	}
}