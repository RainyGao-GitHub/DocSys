package com.DocSystem.entity;

public class ChangedItem {

	private String path;
    private String kind;
	private String changeType;
    private String copyPath;
    private long copyRevision;
    
    
    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
    }
    
    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind == null ? null : kind.trim();
    }
    
    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType == null ? null : changeType.trim();
    }
    
    public String getCoypPath() {
        return copyPath;
    }

    public void setCopyPath(String copyPath) {
        this.copyPath = copyPath == null ? null : copyPath.trim();
    }
    
    public long getCopyRevison() {
        return copyRevision;
    }

    public void setCopyRevision(long copyRevision) {
        this.copyRevision = copyRevision;
    }
}
