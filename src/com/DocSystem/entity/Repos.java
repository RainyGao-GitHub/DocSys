package com.DocSystem.entity;

public class Repos {
    private Integer id;

    private String name;

    private Integer type;

    private String path;

    private Integer verCtrl;

    private String svnPath;

    private String svnUser;

    private String svnPwd;

    private Integer verCtrl1;

    private String svnPath1;

    private String svnUser1;

    private String svnPwd1;

    private String info;

    private String menu;

    private String pwd;

    private Integer owner;

    private Long createTime;

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

    public Integer getVerCtrl() {
        return verCtrl;
    }

    public void setVerCtrl(Integer verCtrl) {
        this.verCtrl = verCtrl;
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

    public Integer getVerCtrl1() {
        return verCtrl1;
    }

    public void setVerCtrl1(Integer verCtrl1) {
        this.verCtrl1 = verCtrl1;
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

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info == null ? null : info.trim();
    }

    public String getMenu() {
        return menu;
    }

    public void setMenu(String menu) {
        this.menu = menu == null ? null : menu.trim();
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
}