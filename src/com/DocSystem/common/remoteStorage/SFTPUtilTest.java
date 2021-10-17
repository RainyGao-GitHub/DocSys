package com.DocSystem.common.remoteStorage;

import java.io.File;
import java.io.FileInputStream;
import java.util.Vector;

import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.SftpConfig;
import com.jcraft.jsch.ChannelSftp.LsEntry;
import com.jcraft.jsch.SftpException;

class SFTPUtilTest {  
	
    public static void main(String[] args) throws Exception {        
        RemoteStorageConfig remote = new RemoteStorageConfig();
        remote.SFTP = new SftpConfig();
        //remote.SFTP.host = "10.183.74.121";
        //remote.SFTP.port = 22;
        //remote.SFTP.userName = "ragao";
        //remote.SFTP.pwd = "Rain_121902";
        //remote.SFTP.rootPath = "/var/fpwork/ragao/gnb/common/sct/tools";
        
        remote.SFTP.host = "118.31.228.208";
        remote.SFTP.port = 2210;
        remote.SFTP.userName = "root";
        remote.SFTP.pwd = "Ahylkj20200701";
        remote.rootPath = "/mnt/SftpTest";

        String localRootPath = "C:/SFtpTestRootPath";        
        uploadDirToSftpServer(remote, null, remote.rootPath, localRootPath, true);
        downloadFilesFromSftpServer(remote, null, remote.rootPath, localRootPath, true);        
    }

	private static boolean uploadDirToSftpServer(RemoteStorageConfig remote, SFTPUtil sftp, String remotePath, String localPath, boolean subFileUploadEn) {
        boolean needCloseSftp = false;

		try {
        	if(sftp == null)
        	{
        		sftp = new SFTPUtil(remote.SFTP.userName, remote.SFTP.pwd, remote.SFTP.host, remote.SFTP.port);
            	if(sftp.login() == false)
            	{
            		System.out.println("login failed");
            		return false;
            	}
            	needCloseSftp = true;
            	System.out.println("login successed");
            	if(sftp.isDirExists(remotePath) == false)
            	{
                	System.out.println("目录不存在:" + remotePath);
                	sftp.mkdir(remotePath);
            	}
        	}        	
        	
    		File dir = new File(localPath);
    		File[] subFiles = dir.listFiles();
    		if(subFiles != null)
    		{
    			for(int i=0; i<subFiles.length; i++)
    			{
    				File subFile = subFiles[i];
    				String subFileName = subFile.getName();
                	System.out.println("upload subFile:" + localPath + "/" + subFileName);
    				if(subFile.isFile())
    				{
    					uploadFileToSftpServer(remote, sftp, remotePath, localPath, subFileName);
    				}
    				else
    				{
    					sftp.mkdir(remotePath + "/" + subFileName);
    					if(subFileUploadEn)
    					{
        					uploadDirToSftpServer(remote, sftp, remotePath + "/" + subFileName, localPath + "/" + subFileName, subFileUploadEn);    						
    					}
    				}
    			}
    			return true;        		
        	}     
			if(needCloseSftp)
			{
				sftp.logout();
				System.out.println("logout successed");
			}
			return true;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
	}

	private static boolean uploadFileToSftpServer(RemoteStorageConfig remote, SFTPUtil sftp, String remotePath, String localPath, String fileName) {
        boolean needCloseSftp = false;

		try {
        	if(sftp == null)
        	{
        		sftp = new SFTPUtil(remote.SFTP.userName, remote.SFTP.pwd, remote.SFTP.host, remote.SFTP.port);
            	if(sftp.login() == false)
            	{
            		System.out.println("login failed");
            		return false;
            	}
            	needCloseSftp = true;
            	System.out.println("login successed");
        	}        	
        	
        	FileInputStream is = new FileInputStream(localPath + "/" + fileName);
			sftp.upload(remotePath, fileName, is);
			is.close();
			
			if(needCloseSftp)
			{
				sftp.logout();
				System.out.println("logout successed");
			}
			return true;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
	}
    
	private static boolean downloadFilesFromSftpServer(RemoteStorageConfig remote, SFTPUtil sftp, String remotePath, String localPath, boolean subFileDownloadEn) {
        boolean needCloseSftp = false;
		try {
        	if(sftp == null)
        	{
        		sftp = new SFTPUtil(remote.SFTP.userName, remote.SFTP.pwd, remote.SFTP.host, remote.SFTP.port);
            	if(sftp.login() == false)
            	{
            		System.out.println("login failed");
            		return false;
            	}
            	needCloseSftp = true;
            	System.out.println("login successed");
        	}        	
        	
			Vector<?> list = sftp.listFiles(remotePath);
			//Log.printObject("list:", list);
			for(int i=0; i<list.size(); i++)
			{
				LsEntry entry = (LsEntry) list.get(i);
				String fileName = entry.getFilename();
				if(fileName.equals(".") || fileName.equals(".."))
				{
					continue;
				}
				Log.debug(remotePath + "/" +fileName);
				
				if(entry.getAttrs().isDir())
				{
					FileUtil.createDir(localPath + "/" + fileName);
				
					if(subFileDownloadEn)
					{
						downloadFilesFromSftpServer(remote, sftp, remotePath + "/" + fileName, localPath + "/" + fileName, subFileDownloadEn);
					}
				}
				else
				{													
					//download File
					sftp.download(remotePath, fileName, localPath + "/" + fileName);
				}
			}
			
			if(needCloseSftp)
			{
				sftp.logout();
				System.out.println("logout successed");
			}
			return true;
		} catch (SftpException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
	}

} 