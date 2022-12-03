package com.DocSystem.common.channels;

import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import util.ReturnAjax;

/**
 * business channel
 *
 * @author rainy gao
 * @date 2021-8-4 9:43
 */
public interface Channel {

    String channelName();

	void initBussinessChannel();	
    
	//accessUser is for lockDoc
	boolean remoteStoragePull(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, boolean force, ReturnAjax rt);

	boolean remoteStoragePush(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, int pushType, ReturnAjax rt);
	
	//Repos AutoBackUp
	void reposBackUp(BackupConfig backupConfig, Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, ReturnAjax rt);

	//Repos FullBackUp
	boolean reposFullBackUp(ReposFullBackupTask task);

	//加解密算法实现
	void encryptFile(Repos repos, String path, String name);	
	void decryptFile(Repos repos, String path, String name);
	byte [] encryptData(Repos repos, byte data[]);	
	byte [] decryptData(Repos repos, byte data[]);
	
	//获取最新保存的Office文件下载信息
	Doc getDownloadDocInfoForOffice(Repos repos, Doc doc);
	//清除redis缓存
	void clearAllOfficeData(String targetServerUrl);
}
