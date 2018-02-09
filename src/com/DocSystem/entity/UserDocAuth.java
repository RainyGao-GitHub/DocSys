package com.DocSystem.entity;

public class UserDocAuth {
    private Integer reposAuthId;	
    private Integer docAuthId;
   
    //DocAuth Part
    private Integer userId=0;
    private String  userName="任意用户";	//from user Table
    
    private Integer docId;
    private String docName="";		//from doc Table
    private String docPath="";		//from doc Table
    
    private Integer reposId;

    private Integer access;

    private Integer editEn;

    private Integer addEn;

    private Integer deleteEn;

	private Integer isAdmin;

	private Integer heritable;

    public Integer getReposAuthId() {
        return reposAuthId;
    }

    public void setReposAuthId(Integer reposAuthId) {
        this.reposAuthId = reposAuthId;
    }

    public Integer getDocAuthId() {
        return docAuthId;
    }

    public void setDocAuthId(Integer docAuthId) {
        this.docAuthId = docAuthId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName == null ? null : userName.trim();
    }
   

    public Integer getDocId() {
        return docId;
    }

    public void setDocId(Integer docId) {
        this.docId = docId;
    }

    public String getDocName() {
        return docName;
    }

    public void setDocName(String docName) {
        this.docName = docName;
    }
    
    public String getDocPath() {
        return docPath;
    }

    public void setDocPath(String docPath) {
        this.docPath = docPath;
    }
    
    public Integer getReposId() {
        return reposId;
    }

    public void setReposId(Integer reposId) {
        this.reposId = reposId;
    }

    public Integer getAccess() {
        return access;
    }

    public void setAccess(Integer access) {
        this.access = access;
    }

    public Integer getEditEn() {
        return editEn;
    }

    public void setEditEn(Integer editEn) {
        this.editEn = editEn;
    }

    public Integer getAddEn() {
        return addEn;
    }

    public void setAddEn(Integer addEn) {
        this.addEn = addEn;
    }

    public Integer getDeleteEn() {
        return deleteEn;
    }

    public void setDeleteEn(Integer deleteEn) {
        this.deleteEn = deleteEn;
    }

	public void setIsAdmin(Integer isAdmin) {
		// TODO Auto-generated method stub
		this.isAdmin = isAdmin;
	}

	public Integer getIsAdmin() {
		// TODO Auto-generated method stub
		return isAdmin;
	}
	
	public void setHeritable(Integer heritable) {
		// TODO Auto-generated method stub
		this.heritable = heritable;
	}

	public Integer getHeritable() {
		// TODO Auto-generated method stub
		return heritable;
	}

}