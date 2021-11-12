package com.DocSystem.common.channels;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.common.entity.RemoteStorageConfig;
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
	void remoteStoragePull(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, boolean force, boolean isAutoPull, ReturnAjax rt);

	void remoteStoragePush(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, boolean isAutoPush, ReturnAjax rt);
	
	//AutoBackUp
	void remoteBackUp(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, ReturnAjax rt);
	void localBackUp(RemoteStorageConfig remote, Repos repos,  Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, ReturnAjax rt);

	//加解密算法实现
	void encryptFile(Repos repos, String path, String name);	
	void decryptFile(Repos repos, String path, String name);
	byte [] encryptData(Repos repos, byte data[]);	
	byte [] decryptData(Repos repos, byte data[]);
	
	//获取最新保存的Office文件下载信息
	Doc getDownloadDocInfoForOffice(Repos repos, Doc doc);
}
