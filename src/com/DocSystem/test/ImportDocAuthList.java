package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class ImportDocAuthList extends BaseController
{ 
    public static void main(String[] args) 
    {
    	importDocAutListFromJsonFile("docAuthList.json", 20000, 20000);
    }
}