package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class DocSysInitTest extends BaseController{
    public static void main(String[] args) {
    	String testDir = "C:/DocSysTestDir/";
    	docSysWebPath = testDir + "WebRoot/";
    	docSysIniPath = docSysWebPath + "../docSys.ini/";

    	//backupDB as sql file Test
    	//backupDB("/DocSysTestDir/", "docsystem.sql", "UTF-8");
    	
    	//数据库脚本执行测试
    	//String filePath = docSysWebPath + "docsystem_DOC_SHARE.sql";
    	//executeSqlScript(filePath);
    	
    	//数据库导出测试
    	//initObjMemberListMap();
    	//exportObjectListToJsonFile(DOCSYS_REPOS, "/DocSysTestDir/", "REPOS.json", 0, 20000);
    	//exportObjectListToJsonFile(DOCSYS_DOC_AUTH, "/DocSysTestDir/", "DOC_AUTH.json", 0, 20000);
    	
    	//数据库导入测试
    	//importObjectListFromJsonFile(DOCSYS_REPOS, "/DocSysTestDir/", "REPOS.json");
    	//importObjectListFromJsonFile(DOCSYS_DOC_AUTH, "/DocSysTestDir/", "DOC_AUTH.json");
    	
    	//系统初始化测试
    	docSysInit(false);
    }
}