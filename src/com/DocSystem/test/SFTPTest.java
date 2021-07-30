package com.DocSystem.test;

import java.util.Vector;

import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.RemoteStorage;
import com.DocSystem.common.SftpConfig;
import com.jcraft.jsch.ChannelSftp.LsEntry;
import com.jcraft.jsch.SftpException;

import util.SFTPUtil.SFTPUtil;

class SFTPTest {  
	
    public static void main(String[] args) throws Exception {        
        RemoteStorage remote = new RemoteStorage();
        remote.SFTP = new SftpConfig();
        remote.SFTP.host = "10.183.74.121";
        remote.SFTP.port = 22;
        remote.SFTP.userName = "ragao";
        remote.SFTP.pwd = "Rain_121902";
        remote.SFTP.rootPath = "/var/fpwork/ragao/gnb/common/sct/tools";

        String localRootPath = "C:/SFtpTestRootPath";
        
        downloadFilesFromSftpServer(remote, null, remote.SFTP.rootPath, localRootPath, true);       
    }
    
	private static boolean downloadFilesFromSftpServer(RemoteStorage remote, SFTPUtil sftp, String remotePath, String localPath, boolean subFileDownloadEn) {
        try {
        	if(sftp == null)
        	{
        		sftp = new SFTPUtil(remote.SFTP.userName, remote.SFTP.pwd, remote.SFTP.host, remote.SFTP.port);
            	if(sftp.login() == false)
            	{
            		System.out.println("login failed");
            		return false;
            	}
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
				Log.println(remotePath + "/" +fileName);
				
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
			return true;
		} catch (SftpException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
	}

} 