package com.DocSystem.test;

import java.io.File;

class DocSyncUpTest  
{  
    public static void main(String[] args) throws InterruptedException    
    {  
       String localPath = "C:\\DocSysReposes\\4\\data";
       
       File dir = new File(localPath);
       
       for(int i=1; i< 1000; i++)
       {
    	  if (dir.setLastModified(System.currentTimeMillis()))
    	        System.out.println("Success!");
    	  else
    	        System.out.println("Failed!");


           System.out.println("最近修改时间:" + dir.lastModified());    	   
           Thread.sleep(1000);
       }
    }   
}