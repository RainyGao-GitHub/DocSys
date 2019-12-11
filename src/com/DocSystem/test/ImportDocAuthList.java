package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class ImportDocAuthList extends BaseController
{ 
    public static void main(String[] args) 
    {
    	importObjectListFromJsonFile(DOCSYS_DOC_AUTH, "docAuthList.json");
    }
}