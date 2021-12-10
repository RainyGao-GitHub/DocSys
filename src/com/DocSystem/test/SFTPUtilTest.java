package com.DocSystem.test;

import com.DocSystem.common.Log;
import com.DocSystem.common.remoteStorage.SFTPUtil;

class SFTPUtilTest {  
	
    public static void main(String[] args) throws Exception {        
        SFTPUtil sftp = new SFTPUtil("ragao", "Rain_121902", "10.183.74.121", 22);
        
        boolean ret = false;
        for(int i=0; i < 3; i++)
        {
	        ret = sftp.login();
	        if(ret == true)
	        {
	        	break;
	        }
        }
        
        if(ret == false)
        {
        	Log.debug("登录失败");
        	return;
        }

        //remote.SFTP.host = "10.183.74.121";
        //remote.SFTP.port = 22;
        //remote.SFTP.userName = "ragao";
        //remote.SFTP.pwd = "Rain_121902";
        //remote.SFTP.rootPath = "/var/fpwork/ragao/";
        
        //remote.SFTP.host = "118.31.228.208";
        //remote.SFTP.port = 2210;
        //remote.SFTP.userName = "root";
        //remote.SFTP.pwd = "Ahylkj20200701";
        //remote.rootPath = "/mnt/SftpTest/";

        String localRootPath = "C:/SFtpTestRootPath/";
        String remoteRootPath = "/var/fpwork/ragao/";
        
        //mkdir Test
        if(sftp.mkdir(remoteRootPath + "SftpTestDir") == false)
        {
        	Log.debug("目录 " + remoteRootPath + "SftpTestDir/ 创建失败");
        }
        else
        {
        	Log.debug("目录 " + remoteRootPath + "SftpTestDir/ 创建成功");        	
        }
        
        
        //File upload Test
        if(sftp.upload(remoteRootPath + "SftpTestDir/", localRootPath, "33333.txt") == false)
        {
        	Log.debug("文件 " + remoteRootPath + "SftpTestDir/33333.txt 上传失败");        	
        }
        else
        {
        	Log.debug("文件 " + remoteRootPath + "SftpTestDir/33333.txt 上传成功");        	
        }
        
        
        //File Copy Test
        String srcRemotePath = "/var/fpwork/ragao/SftpTestDir/";
        String dstRemotePath = "/var/fpwork/ragao/SftpTestDir/";
        if(sftp.copy(srcRemotePath, "33333.txt", dstRemotePath, "444444.txt", 1) == false)
        {
        	Log.debug("文件 " + remoteRootPath + "SftpTestDir/33333.txt 复制失败");        	
        }
        else
        {
        	Log.debug("文件 " + remoteRootPath + "SftpTestDir/33333.txt 复制成功");        	
        }
    }
} 