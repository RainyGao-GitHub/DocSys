package com.DocSystem.entity;

import com.DocSystem.common.TextSearchConfig;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposBackupConfig;

public class Repos {    
	public static final Integer FSM = 1;
	public static final Integer FSP = 2;
	public static final Integer VRPSVN = 3;
	public static final Integer VRPGIT = 4;
    
    private Integer id;

    private String name;

    private Integer type;

    private String path;

    private String realDocPath;

	private String remoteStorage;

	private String autoBackup;

    private Integer verCtrl;

    private Integer isRemote;

    private String localSvnPath;

    private String svnPath;

    private String svnUser;

    private String svnPwd;

    private String revision;

    private Integer verCtrl1;

    private Integer isRemote1;

    private String localSvnPath1;

    private String svnPath1;

    private String svnUser1;

    private String svnPwd1;

    private String revision1;

    private String info;

    private String pwd;

    private Integer owner;

    private Long createTime;

    private Integer state;

    private Integer lockBy;

    private Long lockTime;
    
	public boolean  isBussiness;
	
	public Integer officeType;	//0:内置   1:外置
	
	public Integer isTextSearchEnabled;

	public String remoteServer;
	
	public Long totalSize;
	public Long freeSize;
	public RemoteStorageConfig remoteServerConfig;
	public RemoteStorageConfig remoteStorageConfig;
	public TextSearchConfig textSearchConfig;
		
	public Integer encryptType;
	public EncryptConfig encryptConfig;
	public ReposBackupConfig backupConfig;
	
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
    }

    public String getRealDocPath() {
        return realDocPath;
    }

    public void setRealDocPath(String realDocPath) {
        this.realDocPath = realDocPath == null ? null : realDocPath.trim();
    }

    public Integer getVerCtrl() {
        return verCtrl;
    }

    public void setVerCtrl(Integer verCtrl) {
        this.verCtrl = verCtrl;
    }

    public Integer getIsRemote() {
        return isRemote;
    }

    public void setIsRemote(Integer isRemote) {
        this.isRemote = isRemote;
    }

    public String getLocalSvnPath() {
        return localSvnPath;
    }

    public void setLocalSvnPath(String localSvnPath) {
        this.localSvnPath = localSvnPath == null ? null : localSvnPath.trim();
    }

    public String getSvnPath() {
        return svnPath;
    }

    public void setSvnPath(String svnPath) {
        this.svnPath = svnPath == null ? null : svnPath.trim();
    }

    public String getSvnUser() {
        return svnUser;
    }

    public void setSvnUser(String svnUser) {
        this.svnUser = svnUser == null ? null : svnUser.trim();
    }

    public String getSvnPwd() {
        return svnPwd;
    }

    public void setSvnPwd(String svnPwd) {
        this.svnPwd = svnPwd == null ? null : svnPwd.trim();
    }

    public String getRevision() {
        return revision;
    }

    public void setRevision(String revision) {
        this.revision = revision == null ? null : revision.trim();
    }

    public Integer getVerCtrl1() {
        return verCtrl1;
    }

    public void setVerCtrl1(Integer verCtrl1) {
        this.verCtrl1 = verCtrl1;
    }

    public Integer getIsRemote1() {
        return isRemote1;
    }

    public void setIsRemote1(Integer isRemote1) {
        this.isRemote1 = isRemote1;
    }

    public String getLocalSvnPath1() {
        return localSvnPath1;
    }

    public void setLocalSvnPath1(String localSvnPath1) {
        this.localSvnPath1 = localSvnPath1 == null ? null : localSvnPath1.trim();
    }

    public String getSvnPath1() {
        return svnPath1;
    }

    public void setSvnPath1(String svnPath1) {
        this.svnPath1 = svnPath1 == null ? null : svnPath1.trim();
    }

    public String getSvnUser1() {
        return svnUser1;
    }

    public void setSvnUser1(String svnUser1) {
        this.svnUser1 = svnUser1 == null ? null : svnUser1.trim();
    }

    public String getSvnPwd1() {
        return svnPwd1;
    }

    public void setSvnPwd1(String svnPwd1) {
        this.svnPwd1 = svnPwd1 == null ? null : svnPwd1.trim();
    }

    public String getRevision1() {
        return revision1;
    }

    public void setRevision1(String revision1) {
        this.revision1 = revision1 == null ? null : revision1.trim();
    }

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info == null ? null : info.trim();
    }

    public String getPwd() {
        return pwd;
    }

    public void setPwd(String pwd) {
        this.pwd = pwd == null ? null : pwd.trim();
    }

    public Integer getOwner() {
        return owner;
    }

    public void setOwner(Integer owner) {
        this.owner = owner;
    }

    public Long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }

    public Integer getState() {
        return state;
    }

    public void setState(Integer state) {
        this.state = state;
    }

    public Integer getLockBy() {
        return lockBy;
    }

    public void setLockBy(Integer lockBy) {
        this.lockBy = lockBy;
    }

    public Long getLockTime() {
        return lockTime;
    }

    public void setLockTime(Long lockTime) {
        this.lockTime = lockTime;
    }

    public String getRemoteStorage() {
        return remoteStorage;
    }
    
	public void setRemoteStorage(String remoteStorage) {
        this.remoteStorage = remoteStorage;		
	}
	
    public String getAutoBackup() {
        return autoBackup;
    }
    
	public void setAutoBackup(String autoBackup) {
        this.autoBackup = autoBackup;		
	}
}