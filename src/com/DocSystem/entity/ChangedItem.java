package com.DocSystem.entity;

public class ChangedItem 
{
	private Integer changeType;
    private Integer entryType;
	private String path;
    private String copyPath;
    private String copyRevision;
    
    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
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
    
    public String getCoypPath() {
        return copyPath;
    }

    public void setCopyPath(String copyPath) {
        this.copyPath = copyPath == null ? null : copyPath.trim();
    }
    
    public String getCopyRevison() {
        return copyRevision;
    }

    public void setCopyRevision(String copyRevision) {
        this.copyRevision = copyRevision;
    }
}
