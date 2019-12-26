package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class DocSysInitTest extends BaseController{
    public static void main(String[] args) {
    	docSysWebPath = "/DocSysTestDir/WebRoot/";
    	docSysIniPath = docSysWebPath + "../docSys.ini/";

    	//backupDB as sql file Test
    	//backupDB("/DocSysTestDir/", "docsystem.sql", "UTF-8");
    	
    	//Export to json file Test
    	exportObjectListToJsonFile(DOCSYS_REPOS, "/DocSysTestDir/", "REPOS.json", 0, 20000);
    	
    	//Import json to DB Test
    	importObjectListFromJsonFile(DOCSYS_REPOS, "/DocSysTestDir/", "REPOS.json");
    	
    	//DB upgrade Test
    	docSysInit();
    	
    }
}