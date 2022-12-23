package com.DocSystem.common.channels;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
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

	//Repos RemoteServer
	String remoteServerDocCommit(Repos repos, Doc doc, String commitMsg, User accessUser, ReturnAjax rt,
			boolean modifyEnable, int subDocCommitFlag);
	String remoteServerDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, User accessUser, ReturnAjax rt,
			boolean isMove);
	List<Doc> remoteServerCheckOut(Repos repos, Doc doc, String tempLocalRootPath, String localParentPath,
			String targetName, String commitId, int pullType, HashMap<String, String> downloadList);
	List<Doc> remoteServerCheckOutForDownload(Repos repos, Doc doc, ReposAccess reposAccess, String tempLocalRootPath,
			String localParentPath, String targetName, String commitId, boolean force, boolean auto,
			HashMap<String, String> downloadList);
	List<ChangedItem> remoteServerGetHistoryDetail(Repos repos, Doc doc, String commitId);
	List<LogEntry> remoteServerGetHistory(Repos repos, Doc doc, int maxLogNum);
	
	//Repos RemoteStorage
	List<Doc> remoteStorageGetEntryListEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId);
	Doc remoteStorageGetEntryEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId);
	boolean remoteStoragePull(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitId, boolean recurcive, int pullType, ReturnAjax rt);
	boolean remoteStoragePush(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, int pushType, ReturnAjax rt);
	
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
	
	//RemoteStorage Basic Interface
	RemoteStorageSession doRemoteStorageLoginEx(Repos fakeRepos, RemoteStorageConfig remote);
	void doRemoteStorageLogoutEx(RemoteStorageSession remoteStorageSession);
	List<Doc> getRemoteStorageEntryListEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId);
	HashMap<String, Doc> getRemoteStorageEntryHashMapEx(RemoteStorageSession session, RemoteStorageConfig remote,
			Repos repos, Doc doc, String commitId);
	Doc getRemoteStorageEntryEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId);

}
