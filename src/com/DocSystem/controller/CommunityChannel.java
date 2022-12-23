package com.DocSystem.controller;

import com.DocSystem.common.Log;
import com.DocSystem.common.channels.Channel;
import com.DocSystem.common.channels.ChannelFactory;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

import util.ReturnAjax;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

import javax.annotation.PostConstruct;

@Service
public class CommunityChannel extends BaseController implements Channel {
    @PostConstruct
    public void init() {
    	Log.debug("CommunityChannel init");
        ChannelFactory.register(this);
    }

	@Override
    public String channelName() {
	    return "communityChannel";			
    }

	@Override
	public String remoteServerDocCommit(Repos repos, Doc doc, String commitMsg, User accessUser, ReturnAjax rt,
			boolean modifyEnable, int subDocCommitFlag) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String remoteServerDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, User accessUser,
			ReturnAjax rt, boolean isMove) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<Doc> remoteServerCheckOut(Repos repos, Doc doc, String tempLocalRootPath, String localParentPath,
			String targetName, String commitId, int pullType, HashMap<String, String> downloadList) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<Doc> remoteServerCheckOutForDownload(Repos repos, Doc doc, ReposAccess reposAccess,
			String tempLocalRootPath, String localParentPath, String targetName, String commitId, boolean force,
			boolean auto, HashMap<String, String> downloadList) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<ChangedItem> remoteServerGetHistoryDetail(Repos repos, Doc doc, String commitId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<LogEntry> remoteServerGetHistory(Repos repos, Doc doc, int maxLogNum) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<Doc> remoteStorageGetEntryListEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos,
			Doc doc, String commitId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Doc remoteStorageGetEntryEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean remoteStoragePull(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitId,
			boolean recurcive, int pullType, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public boolean remoteStoragePush(RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser,
			String commitMsg, boolean recurcive, int pushType, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public void reposBackUp(BackupConfig backupConfig, Repos repos, Doc doc, User accessUser, String commitMsg,
			boolean recurcive, boolean force, ReturnAjax rt) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public boolean reposFullBackUp(ReposFullBackupTask task) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public void encryptFile(Repos repos, String path, String name) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void decryptFile(Repos repos, String path, String name) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public byte[] encryptData(Repos repos, byte[] data) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public byte[] decryptData(Repos repos, byte[] data) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Doc getDownloadDocInfoForOffice(Repos repos, Doc doc) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void clearAllOfficeData(String targetServerUrl) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public RemoteStorageSession doRemoteStorageLoginEx(Repos fakeRepos, RemoteStorageConfig remote) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void doRemoteStorageLogoutEx(RemoteStorageSession remoteStorageSession) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public List<Doc> getRemoteStorageEntryListEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos,
			Doc doc, String commitId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public HashMap<String, Doc> getRemoteStorageEntryHashMapEx(RemoteStorageSession session, RemoteStorageConfig remote,
			Repos repos, Doc doc, String commitId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Doc getRemoteStorageEntryEx(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc,
			String commitId) {
		// TODO Auto-generated method stub
		return null;
	}
}
