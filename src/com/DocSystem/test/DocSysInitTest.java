package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class DocSysInitTest extends BaseController{
    public static void main(String[] args) {
    	//backupDB as sql file Test
    	backupDB("/DocSysTestDir/", "docsystem.sql", "UTF-8");
    	
    	//Export to json file Test
    	exportObjectListToJsonFile(DOCSYS_USER, "", "docAuthList.json", 0, 20000);
    	
    	//import json to DB Test
    	importObjectListFromJsonFile(DOCSYS_DOC_AUTH, "", "docAuthList.json");
    }
}