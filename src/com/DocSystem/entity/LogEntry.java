package com.DocSystem.entity;

import java.util.List;

public class LogEntry {
	private long revision;
	private String commitUser;
	private String commitMsg;
	private String commitTime;
	private List<ChangedItem> changedItems;	//有变化的文件列表
	
    public long getRevision() {
        return revision;
    }

    public void setRevision(long revision) {
        this.revision = revision;
    }

    public String getCommitUser() {
        return commitUser;
    }

    public void setCommitUser(String commitUser) {
        this.commitUser = commitUser == null ? null : commitUser.trim();
    }
    
    public String getCommitMsg() {
        return commitMsg;
    }

    public void setCommitMsg(String commitMsg) {
        this.commitMsg = commitMsg == null ? null : commitMsg.trim();
    }

    public String getCommitTime() {
        return commitTime;
    }

    public void setCommitTime(String commitTime) {
        this.commitTime = commitTime == null ? null : commitTime.trim();
    }
    
    public List<ChangedItem> getChangedItems() {
        return changedItems;
    }

    public void setChangedItems(List<ChangedItem> changedItems) {
        this.changedItems = changedItems;
    }
}