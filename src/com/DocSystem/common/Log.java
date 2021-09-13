package com.DocSystem.common;

import com.alibaba.fastjson.JSON;

import util.ReturnAjax;

public class Log {
	final static int debug = 0;
	final static int warn = 1;
	final static int error = 2;
	public static int logLevel = warn;
	
	public static boolean isLogEnable(int level)
	{
		return level >= logLevel;
	}
	
	//To print the obj by convert it to json format
	public static void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);
	}
	
	public static void printObject(String Head,Object obj, String filePath, boolean enableConsole)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		if(enableConsole)
		{
			System.out.println(Head + json);
		}
		toFile(Head + json + "\n", filePath);
	}	
	
	public static void docSysDebugLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
	}
	
	public static void docSysDebugLog(String logStr, ReturnAjax rt, String filePath, boolean enableConsole) {
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}

		if(enableConsole)
		{
			System.out.println(logStr);
		}
		toFile(logStr + "\n", filePath);	
	}

	public static void docSysWarningLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
	}
	
	public static void docSysWarningLog(String logStr, ReturnAjax rt, String filePath, boolean enableConsole) {
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}

		if(enableConsole)
		{
			System.err.println(logStr);
		}
		toFile(logStr + "\n", filePath);
	}

	public static void docSysErrorLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setError(logStr);
		}
	}
	
	public static void docSysErrorLog(String logStr, ReturnAjax rt, String filePath, boolean enableConsole) {
		if(rt != null)
		{
			rt.setError(logStr);
		}
		
		if(enableConsole)
		{
			System.err.println(logStr);			
		}
		toFile(logStr + "\n", filePath);
	}

	public static void info(String Head, String msg) {
		System.out.println(Head + " " + msg);
	}
	
	public static void info(String Head, String msg, String filePath, boolean enableConsole) {
		if(enableConsole)
		{
			System.out.println(Head + " " + msg);
		}
		toFile(Head + " " + msg  + "\n", filePath);
	}
	
	public static void println(String content) {
		System.out.println(content);
	}
	
	public static void println(int level, String content) {
		if(isLogEnable(level))
		{
			System.out.println(content);
		}
	}
	
	public static void printByte(int level, byte data) {
		if(isLogEnable(level))
		{
			System.out.printf( "%02X\n", data);
		}
	}
	
	public static void printBytes(int level, byte[] data) {
		if(isLogEnable(level))
		{
			for(int i=0; i<data.length; i++)
			{
				System.out.printf( "%02X ", data[i]);
			}
			System.out.printf( "\n");
		}
	}
	
	public static void println(String content, String filePath, boolean enableConsole) {
		if(enableConsole)
		{
			System.out.println(content);
		}
		toFile(content + "\n", filePath);		
	}
	
	public static void toFile(String content, String filePath) {
		if(filePath != null)
		{
			FileUtil.appendContentToFile(filePath, content, "UTF-8");	
		}
	}	
}
