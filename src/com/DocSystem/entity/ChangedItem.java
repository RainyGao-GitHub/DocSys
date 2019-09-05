package com.DocSystem.entity;

public class ChangedItem 
{
	private Integer changeType;
    
	private Integer entryType;

    private String path;
	private String name;
	private String entryPath;
	
    private String srcPath;
    private String srcName;
    private String srcEntryPath;
    
    private String commitId;
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
    }

    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }
    
    public String getEntryPath() {
        return entryPath;
    }
    
    public void setEntryPath(String entryPath) {
        this.entryPath = entryPath == null ? null : entryPath.trim();
    }
    
    public String getSrcPath() {
        return srcPath;
    }
    
    public void setSrcPath(String srcPath) {
        this.srcPath = srcPath == null ? null : srcPath.trim();
    }

    public String getSrcName() {
        return srcName;
    }
    
    public void setSrcName(String srcName) {
        this.srcName = srcName == null ? null : srcName.trim();
    }
    
    public String getSrcEntryPath() {
        return srcEntryPath;
    }
    
    public void setSrcEntryPath(String srcEntryPath) {
        this.srcEntryPath = srcEntryPath == null ? null : srcEntryPath.trim();
    }
    
    public Integer getEntryType() {
        return entryType;
    }

    public void setEntryType(Integer entryType) {
        this.entryType = entryType;
    }
    
    public Integer getChangeType() {
        return changeType;
    }

    public void setChangeType(Integer changeType) {
        this.changeType = changeType;
    }
    
    public String getCommitId() {
        return commitId;
    }

    public void setCommitId(String commitId) {
        this.commitId = commitId;
    }
}
