package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class ExportDocAuthList extends BaseController{
    public static void main(String[] args) {
    	exportDocAutListToJsonFile("docAuthList.json",20000);
    }
}