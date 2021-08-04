package com.DocSystem.common.channels;

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
    
	void remoteStoragePull(Repos repos, Doc doc, User accessUser, String commitMsg, ReturnAjax rt);

	void remoteStoragePush(Repos repos, Doc doc, User accessUser, ReturnAjax rt);
}
