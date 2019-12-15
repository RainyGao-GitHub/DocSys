package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class DocSysInitTest extends BaseController{
    public static void main(String[] args) {
    	//backupDB Test
    	backupDB("/DocSysTestDir/", "docsystem.sql", "UTF-8");
    	
    }
}