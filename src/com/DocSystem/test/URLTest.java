package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class URLTest extends BaseController{  
    public static void main(String[] args)    
    {  
    	testUrl("https://blog.csdn.net/u011068702/article/details/80231213");
    	testUrlWithTimeOut("https://blog.csdn.net/u011068702/article/details/80231213",3000);
    }
}  