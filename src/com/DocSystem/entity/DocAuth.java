package com.DocSystem.entity;

public class DocAuth {
    private Integer id;

    private Integer userId;

    private Integer docId;

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

    public Integer getDocId() {
        return docId;
    }

    public void setDocId(Integer docId) {
        this.docId = docId;
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

    //1: 用户直接权限  2: 用户所在组权限  3: 任意用户权限
    private Integer type = 0;
    public Integer getType() {
        return type;
    }
    public void setType(Integer type) {
		this.type = type;
	}
}