package com.DocSystem.common;

import java.io.UnsupportedEncodingException;

import org.apache.commons.codec.binary.Base64;

public class Base64Util {
	/************************ base64Encode相关接口 **************************************/
	public static String base64Encode(String str) 
	{
		if(str == null || str.isEmpty())
		{
			return str;
		}
		
		try {
			byte[] textByte = str.getBytes("UTF-8");
			//编码
			String base64Str = Base64.encodeBase64String(textByte);
			return base64Str;
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			return null;
		}		
	}
	
	public static String base64EncodeURLSafe(String str) 
	{
		if(str == null)
		{
			return null;
		}
		
		if(str.isEmpty())
		{
			return "0"; //代表空
		}
		
		try {
			byte[] textByte = str.getBytes("UTF-8");
			//编码
			String base64Str = Base64.encodeBase64URLSafeString(textByte);
			return base64Str;
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			return null;
		}		
	}
	
	public static String base64Decode(String base64Str) 
	{
		if(base64Str == null || base64Str.length() <= 1)
		{
			return "";
		}
		
		//misc库
		//BASE64Decoder decoder = new BASE64Decoder();
		//return new String(decoder.decodeBuffer(base64Str),"UTF-8");
		
		//apache库
		byte [] data = Base64.decodeBase64(base64Str);
		try {
			String str =  new String(data,"UTF-8");
			return str;
		} catch (UnsupportedEncodingException e) {
			System.out.println("base64Decode new String Error");
			e.printStackTrace();
			return null;
		}
		
		//java8自带库，据说速度最快
	}
}
