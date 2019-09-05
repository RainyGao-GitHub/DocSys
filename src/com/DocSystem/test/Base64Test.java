package com.DocSystem.test;

import org.apache.commons.codec.binary.Base64;

class Base64Test  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String str = "便签";

        try {
        	String base64Str1 = Base64.encodeBase64String(str.getBytes());
        	System.out.println("base64Str1:" + base64Str1);
        	
        	String base64Str1_d = new String(Base64.decodeBase64(base64Str1),"UTF-8");
         	System.out.println("base64Str1_d:" + base64Str1_d);
            
        	
        	String base64Str2 = Base64.encodeBase64URLSafeString(str.getBytes());
         	System.out.println("base64Str1:" + base64Str2);

         	String base64Str2_d = new String(Base64.decodeBase64(base64Str2),"UTF-8");
         	System.out.println("base64Str2_d:" + base64Str2_d);
	        
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  