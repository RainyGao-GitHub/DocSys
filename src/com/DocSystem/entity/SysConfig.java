package com.DocSystem.entity;

public class SysConfig {
    private Integer id;

    private Integer regEnable;

    private Integer privateReposEnable;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRegEnable() {
        return regEnable;
    }

    public void setRegEnable(Integer regEnable) {
        this.regEnable = regEnable;
    }

    public Integer getPrivateReposEnable() {
        return privateReposEnable;
    }

    public void setPrivateReposEnable(Integer privateReposEnable) {
        this.privateReposEnable = privateReposEnable;
    }
}