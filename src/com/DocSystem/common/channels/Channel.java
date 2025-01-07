package com.DocSystem.common.channels;

import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.DocSystem.common.ActionContext;
import com.DocSystem.common.FolderUploadAction;
import com.DocSystem.common.CommitAction.CommitAction;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.CommitEntry;
import com.DocSystem.common.entity.CommitLog;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.websocket.entity.DocSearchContext;

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
	String remoteServerDocCommit(
			Repos repos, Doc doc, 
			String commitMsg, 
			User accessUser, 
			ReturnAjax rt,
			boolean force,
			boolean skipDelete,
			int subDocCommitFlag);
	String remoteServerDocCopy(
			Repos repos, Doc srcDoc, Doc dstDoc, 
			String commitMsg, 
			User accessUser, 
			ReturnAjax rt,
			boolean isMove);
	List<Doc> remoteServerCheckOut(
			Repos repos, Doc doc, 
			String tempLocalRootPath, String targetPath, String targetName, 
			String commitId, 
			int pullType, 
			boolean skipDelete,
			HashMap<String, String> downloadList);
	List<Doc> remoteServerCheckOutForDownload(
			Repos repos, Doc doc, 
			ReposAccess reposAccess, 
			String tempLocalRootPath, String targetPath, String targetName, 
			String commitId, 
			boolean force,
			HashMap<String, String> downloadList);
	List<ChangedItem> remoteServerGetHistoryDetail(
			Repos repos, Doc doc, 
			String commitId);
	List<LogEntry> remoteServerGetHistory(
			Repos repos, Doc doc, 
			int maxLogNum, 
			String commitId);
	
	//Repos RemoteStorage
	List<Doc> remoteStorageGetEntryListEx(
			RemoteStorageSession session, 
			RemoteStorageConfig remote, 
			Repos repos, Doc doc,
			String commitId);
	Doc remoteStorageGetEntryEx(
			RemoteStorageSession session, 
			RemoteStorageConfig remote, 
			Repos repos, Doc doc,
			String commitId);
	boolean remoteStoragePull(
			RemoteStorageConfig remote, 
			Repos repos, Doc doc, 
			User accessUser, 
			String commitId, 
			boolean recurcive, 
			int pullType, 
			boolean skipDelete,
			ReturnAjax rt);
	boolean remoteStoragePush(
			RemoteStorageConfig remote, 
			Repos repos, Doc doc, 
			User accessUser, 
			String commitMsg, 
			boolean recurcive, 
			int pushType,
			boolean skipDelete,
			ReturnAjax rt);
	boolean remoteStorageDeleteEntry(
			RemoteStorageConfig remote, 
			Repos repos, Doc doc, 
			User accessUser, 
			String commitMsg, 
			ReturnAjax rt);
		
	//Repos AutoBackUp
	void reposBackUp(
			BackupConfig backupConfig, 
			Repos repos, Doc doc, 
			User accessUser, 
			String commitMsg, 
			boolean recurcive, boolean force, boolean skipDelete,
			ReturnAjax rt,
			int historyType);

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
	List<Doc> getRemoteStorageEntryListEx(
			RemoteStorageSession session, 
			RemoteStorageConfig remote, 
			Repos repos, Doc doc,
			String commitId);
	HashMap<String, Doc> getRemoteStorageEntryHashMapEx(
			RemoteStorageSession session, 
			RemoteStorageConfig remote,
			Repos repos, Doc doc, 
			String commitId);
	Doc getRemoteStorageEntryEx(
			RemoteStorageSession session, 
			RemoteStorageConfig remote, 
			Repos repos, Doc doc,
			String commitId);
	List<Doc> remoteStorageCheckOut(
			RemoteStorageConfig remote, 
			Repos repos, Doc doc, 
			String tempLocalRootPath, String targetPath, String targetName, 
			String commitId, 
			int pullType, 
			boolean skipDelete,
			HashMap<String,String> includeList,
			HashMap<String,String> excludeList);
	
	List<Doc> remoteStorageCheckOutForDownload(
			RemoteStorageConfig remote, 
			Repos repos, Doc doc, 
			ReposAccess reposAccess, 
			String tempLocalRootPath, String targetPath, String targetName, 
			String commitId, 
			boolean force,
			HashMap<String,String> includeList,
			HashMap<String,String> excludeList,
			int historyType);

	String buildMailContent(String content, String lang);
	
	String buildDocShareMailContent(String content, String lang);

	boolean systemLicenseInfoCheck(ReturnAjax rt);

	void searchDocAsync(List<Repos> reposList, DocSearchContext searchContext);

	List<SystemLog> getSystemLogList(SystemLog queryLog, Long startTime, Long endTime);

	void insertCommitEntry(Repos repos, CommitEntry entry, int historyType);
	
	void insertCommitEntries(Repos repos, FolderUploadAction action, List<CommitEntry> commitEntryList, int historyType);

	void insertCommitEntries(Repos repos, ActionContext context, List<CommitEntry> commitEntryList, int historyType);
	
	void insertCommitEntriesForDoc(Repos repos, ActionContext context, Doc doc, int historyType);
	
	void insertCommitEntriesEx(Repos repos, ActionContext context, List<CommitAction> commitActionList, int historyType);

	void deleteCommitEntry(Repos repos, CommitEntry entry, int historyType);

	void deleteCommitEntryAndSubEntries(Repos repos, CommitEntry entry, int historyType);
	
	void insertCommit(Repos repos, CommitLog commit, int historyType);

	void updateCommit(Repos repos, CommitLog commit, int historyType);

	void deleteCommit(Repos repos, CommitLog commit, int historyType);

	//精确查询提交历史: 通常指定commitId，来获取详细的commitLog信息
	List<CommitLog> queryCommitLog(Repos repos, CommitLog qCommit, int historyType);
	
	//查询仓库提交历史: 只支持仓库commitLog索引数据库，因此不支持查询指定文件或目录
	List<CommitLog> queryCommitLog(Repos repos, CommitLog qCommit, int maxLogNum, String startCommitId, String endCommitId, int historyType);
	
	//查询文件/目录/仓库提交历史: 不指定文件或目录信息，则查询到的时仓库的提交历史
	List<CommitLog> queryCommitLogForDoc(Repos repos, Doc doc, int maxLogNum, String startCommitId, String endCommitId, int historyType); 

	List<LogEntry> queryCommitHistory(Repos repos, Doc doc, int maxLogNum, String startCommitId, String endCommitId, int historyType);

	List<CommitEntry> queryCommitHistoryDetail(Repos repos, Doc doc, String commitId, int historyType);
	
	List<ChangedItem> queryCommitHistoryDetailForLegacy(Repos repos, Doc doc, String commitId, int historyType);

	boolean convertReposHistory(Repos repos, Integer maxNum, ReturnAjax rt, int historyType);

	Doc getHistoryDoc(Repos repos, Doc doc, String commitId, int historyType);
	
	//第三方接入API接口
	public void pushDocRS(
			String taskId,
			Integer reposId, Long docId, Long pid, String path, String name, //待推送的文件或目录信息
			Integer targetReposId, String targetPath, //目标目录信息
			Integer recurciveEn, //null/0: false, 1: true
			Integer forceEn, //null/0: false, 1: true
			Integer deleteEn, //null/0: false, 1: true
			Integer addOnly, //null/0: false, 1: true
			Integer shareId, String authCode, //
			HttpServletResponse response,HttpServletRequest request,HttpSession session) throws Exception;
	
	public boolean isAllowedAction(String action, ReturnAjax rt);

	public boolean initOfficeEditorFonts(boolean needThumbnails);
}
