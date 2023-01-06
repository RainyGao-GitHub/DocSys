package com.DocSystem.test;

import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;

import com.DocSystem.common.Log;

class CharsetTest  
{  
	//相同字符串在不同系统上的存储内容都是一样的
	//因此根据buffer生成字符串时一定要指定正确的charset，否则会导致生成的字符串乱码，而且是不可逆的
	//例如: 汉的GBK_buf是BABA按照GBK格式会转成4900，但BABA按照UTF-8格式会转成FDFD0000，FDFD0000按照UTF-8无法转成BABA，从而导致了信息的丢失
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        System.out.println("System defulat charset:" + Charset.defaultCharset());        
        
        try {        	
            String han = "汉";	//系统默认编码
            
            byte han_org_buf[] = new byte[han.length()*2];
            han.getBytes(0, han.length(), han_org_buf, 0);
            Log.printBytesEx("han_org_buf:", han_org_buf);

        	byte[] han_UTF16_buf = han.getBytes("UTF-16");
            Log.printBytesEx("han_UTF16_buf:", han_UTF16_buf);
            
            byte han_default_buf[] = han.getBytes();
            Log.printBytesEx("han_default_buf:", han_default_buf);

            byte[] han_GBK_buf = han.getBytes("GBK");	//转换成GBK bytes
            Log.printBytesEx("han_GBK_buf:", han_GBK_buf);

            byte han_UTF8_buf[] = han.getBytes("UTF-8");
            Log.printBytesEx("han_UTF8_buf:", han_UTF8_buf);

            //GBK_buf 按 GBK 生成的字符串里的org_buf应该都一样
            String GBK_han = new String(han_GBK_buf, "GBK");
            byte GBK_han_org_buf[] = new byte[GBK_han.length()*2];
            han.getBytes(0, han.length(), GBK_han_org_buf, 0);
            Log.printBytesEx("GBK_han_org_buf:",GBK_han_org_buf);
            
            //GBK Buf 按照 UTF-8 创建字符串，会造成不可逆的损坏，将无法再还原回来
            Log.printBytesEx("han_GBK_buf:", han_GBK_buf);
            String UTF8_han_with_GBK_buf = new String(han_GBK_buf, "UTF-8");
            Log.debug("UTF8_han_with_GBK_buf:" + UTF8_han_with_GBK_buf);
            byte[] UTF8_han_with_GBK_buf_org_buf = new byte[UTF8_han_with_GBK_buf.length()*2];
            UTF8_han_with_GBK_buf.getBytes(0, UTF8_han_with_GBK_buf.length(), UTF8_han_with_GBK_buf_org_buf, 0);
            Log.printBytesEx("UTF8_han_with_GBK_buf_org_buf:", UTF8_han_with_GBK_buf_org_buf);
		} catch (UnsupportedEncodingException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
        
        /*
        String str = "便签";
    	String utf8_str = "";
    	String gbk_str = "";
    	String gb2312_str = "";
    	String iso8859_str = "";
    	String asc_str = "";
    	String utf16_str = "";
    	String gb18030_str = "";

    	//注意：字符编码转换之后未必你能转换回来，比如将中文转成ascii码会丢信息，所以将无法还原，这里的测试对于ascii和iso8859会出现乱码问题
        try {
        	//将中文字符串按指定格式转成字节流
        	byte[] buff = str.getBytes();	//
        	byte[] utf8_buff = str.getBytes("UTF-8");
        	byte[] gbk_buff = str.getBytes("GBK");     	
        	byte[] gb2312_buff = str.getBytes("GB2312");     	
        	byte[] iso8859_buff = str.getBytes("ISO-8859-1");     	
        	byte[] asc_buff = str.getBytes("ASCII");     	
        	byte[] utf16_buff = str.getBytes("UTF-16");     	
        	byte[] gb18030_buff = str.getBytes("GB18030");     	
        	
        	//将字节流按默认格式转成字符串
        	str = new String(buff);
        	utf8_str = new String(utf8_buff);
        	gbk_str = new String(gbk_buff);
        	gb2312_str = new String(gb2312_buff);
        	iso8859_str = new String(iso8859_buff);
        	asc_str = new String(asc_buff);
        	utf16_str = new String(utf16_buff);
        	gb18030_str = new String(gb18030_buff);

        	System.out.println("str:" + str);
        	System.out.println("utf8_str:" + utf8_str);
        	System.out.println("gbk_str:" + gbk_str);
        	System.out.println("gb2312_str:" + gb2312_str);
        	System.out.println("iso8859_str:" + iso8859_str);
        	System.out.println("asc_str:" + asc_str);
        	System.out.println("utf16_str:" + utf16_str);
        	System.out.println("gb18030_str:" + gb18030_str);
        	
        	//将字节流按对应格式转成字符串
        	str = new String(buff);
        	utf8_str = new String(utf8_buff, "UTF-8");
        	gbk_str = new String(gbk_buff, "GBK");
        	gb2312_str = new String(gb2312_buff, "GB2312");
        	iso8859_str = new String(iso8859_buff, "ISO-8859-1");
        	asc_str = new String(asc_buff, "ASCII");
        	utf16_str = new String(utf16_buff, "UTF-16");
        	gb18030_str = new String(gb18030_buff, "GB18030");


        	System.out.println("str:" + str);
        	System.out.println("utf8_str:" + utf8_str);
        	System.out.println("gbk_str:" + gbk_str);
        	System.out.println("gb2312_str:" + gb2312_str);
        	System.out.println("iso8859_str:" + iso8859_str);
        	System.out.println("asc_str:" + asc_str);
        	System.out.println("utf16_str:" + utf16_str);
        	System.out.println("gb18030_str:" + gb18030_str);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}*/
    }  
}  