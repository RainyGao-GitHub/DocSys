package com.DocSystem.common.channels;

import java.util.HashMap;
import java.util.List;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.websocket.RemoteStorageSession;

import util.ReturnAjax;

/**
 * business channel
 *
 * @author rainy gao
 * @date 2021-8-4 9:43
 */
public interface Channel {

    String channelName();
        
    RemoteStorageSession remoteStorageLogin(Repos repos);
    
    boolean remoteStorageLogout(Repos repos);
    
	List<Doc> remoteStorageGetEntryList(Repos repos, Doc doc);

	Doc remoteStorageGetEntry(Repos repos, Doc doc);

	List<Doc> remoteStorageGetDBEntryList(Repos repos, Doc doc);

	HashMap<String, Doc> remoteStorageGetDBHashMap(Repos repos, Doc doc);

	Doc remoteStorageGetDBEntry(Repos repos, Doc doc);	
	
	void remoteStoragePull(Repos repos, Doc doc, User accessUser, String commitMsg, boolean recurcive, boolean force, boolean isAutoPull, ReturnAjax rt);

	void remoteStoragePush(Repos repos, Doc doc, User accessUser, boolean recurcive, boolean force, boolean isAutoPush, ReturnAjax rt);
}
