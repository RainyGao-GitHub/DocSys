package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class DocSysInitTest extends BaseController{
    public static void main(String[] args) {
    	//backupDB as sql file Test
    	//backupDB("/DocSysTestDir/", "docsystem.sql", "UTF-8");
    	
    	//Export to json file Test
    	//exportObjectListToJsonFile(DOCSYS_USER, "/DocSysTestDir/", "USER.json", 0, 20000);
    	
    	//Import json to DB Test
    	//importObjectListFromJsonFile(DOCSYS_USER, "/DocSysTestDir/", "USER.json");
    	
    	//DB upgrade Test
    	docSysWebPath = "/DocSysTestDir/WebRoot/";
    	docSysIniPath = docSysWebPath + "../docSys.ini/";
    	docSysInit();
    	
    }
}