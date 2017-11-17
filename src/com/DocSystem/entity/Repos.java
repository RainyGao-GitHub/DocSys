package com.DocSystem.entity;

public class Repos {
    private Integer id;

    private String name;

    private Integer type;

    private Integer verCtrl;

    private String path;

    private String svnPath;

    private String svnUser;

    private String svnPwd;

    private String info;

    private String menu;

    private String pwd;

    private Integer owner;

    private String createTime;

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

    public Integer getVerCtrl() {
        return verCtrl;
    }

    public void setVerCtrl(Integer verCtrl) {
        this.verCtrl = verCtrl;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
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

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime == null ? null : createTime.trim();
    }
}