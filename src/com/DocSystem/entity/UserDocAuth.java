package com.DocSystem.entity;

public class UserDocAuth {
    private Integer id;

    private String name;

    private Integer type;

    private String realName;

    private String nickName;

    private String img;

    private String email;

    private Integer emailValid;

    private String tel;

    private Integer telValid;

    private String intro;

    //DocAuth Part
    private Integer userId;

    private Integer docId;

    private Integer reposId;

    private Integer access;

    private Integer editEn;

    private Integer addEn;

    private Integer deleteEn;

	private Integer isAdmin;
	
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


    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName == null ? null : realName.trim();
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName == null ? null : nickName.trim();
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img == null ? null : img.trim();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }

    public Integer getEmailValid() {
        return emailValid;
    }

    public void setEmailValid(Integer emailValid) {
        this.emailValid = emailValid;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel == null ? null : tel.trim();
    }

    public Integer getTelValid() {
        return telValid;
    }

    public void setTelValid(Integer telValid) {
        this.telValid = telValid;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro == null ? null : intro.trim();
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
}