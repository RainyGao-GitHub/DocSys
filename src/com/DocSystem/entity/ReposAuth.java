package com.DocSystem.entity;

public class ReposAuth {
    private Integer id;

    private Integer userId;

    private Integer groupId;

    private Integer type;

    private Integer priority;

    private Integer reposId;

    private Integer isAdmin;

    private Integer access;

    private Integer editEn;

    private Integer addEn;

    private Integer deleteEn;

    private Integer heritable;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getGroupId() {
        return groupId;
    }

    public void setGroupId(Integer groupId) {
        this.groupId = groupId;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Integer getReposId() {
        return reposId;
    }

    public void setReposId(Integer reposId) {
        this.reposId = reposId;
    }

    public Integer getIsAdmin() {
        return isAdmin;
    }

    public void setIsAdmin(Integer isAdmin) {
        this.isAdmin = isAdmin;
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

    public Integer getHeritable() {
        return heritable;
    }

    public void setHeritable(Integer heritable) {
        this.heritable = heritable;
    }
    
    //ReposAuth 附加信息: 需要通过joint doc and user or group Table to get these info
    private String  userName="任意用户";	//from user Table
    private String  groupName="";	//from group Table
    
    private String docName="";		//from doc Table
    private String docPath="";		//from doc Table
    
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName == null ? null : userName.trim();
    }
    
    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName == null ? null : groupName.trim();
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
}