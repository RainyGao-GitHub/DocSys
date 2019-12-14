package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class ExportDocAuthList extends BaseController{
    public static void main(String[] args) {
    	exportObjectListToJsonFile(DOCSYS_USER, "", "docAuthList.json", 0, 20000);
        //exportObjectListToJsonFile(DOCSYS_DOC_AUTH, "", "docAuthList.json", 0, 20000);
    }
}