package com.DocSystem.entity;

import java.util.List;
import java.util.Map;

import org.tmatesoft.svn.core.SVNProperties;

public class LogEntry {
	private long revision;
	private String commitUser;
	private String commitMsg;
	private String commitTime;
	private List<String> changedPaths;	//有变化的文件列表
	
    public long getRevison() {
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
    
    public List<String> getChangedPaths() {
        return changedPaths;
    }

    public void setChangedPaths(List<String> changedPaths) {
        this.changedPaths = changedPaths;
    }
}