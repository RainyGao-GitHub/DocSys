package com.DocSystem.test;

import com.DocSystem.controller.BaseController;

class cpdetectorTest  extends BaseController
{  
    public static void main(String[] args)    
    {  
        String FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\startup_log_TB_2309_1_.log.check\\startup_log_TB_2309_1_.log.check");
        System.out.println("FileEncode:" + FileEncode);
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\9.1-9.30.pdf");
        System.out.println("FileEncode:" + FileEncode);
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\DocSys仓库详情页面布局需求.docx");
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\URLProtocol.html");       
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\技术入股协议书.doc");       
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\Print\\0921\\1105698019.jpg");       
        System.out.println("FileEncode:" + FileEncode); 
        
    }
}