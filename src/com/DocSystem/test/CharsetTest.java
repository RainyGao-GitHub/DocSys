package com.DocSystem.test;

class CharsetTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
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
        	byte[] buff = str.getBytes();
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
		}
    }  
}  