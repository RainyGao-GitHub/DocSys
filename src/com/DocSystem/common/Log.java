package com.DocSystem.common;

import com.alibaba.fastjson.JSON;

import util.ReturnAjax;

public class Log {
	//logLevel
	public final static int debug = 0;
	public final static int info  = 1;
	public final static int warn  = 2;
	public final static int error = 3;

	//logMask
	public final static int allowGeneral = 1;
	public final static int allowOffice  = 2;
	public final static int allowAll  = allowGeneral | allowOffice;
	
	
	public static int logLevel = debug;
	public static int logMask = allowAll;
	public static String logFile = null;
	
	public static boolean isLogEnable(int level, int mask)
	{
		if(level < logLevel)
		{
			return false;
		}
		return (mask & logMask) > 0;
	}
	
	public static void toFile(String content, String filePath) {
		if(filePath != null)
		{
			FileUtil.appendContentToFile(filePath, content, "UTF-8");	
		}
	}
	
	public static void debug(String content) {
		if(isLogEnable(debug, allowGeneral))
		{
			if(logFile == null)
			{
				System.out.println(content);
			}
			else
			{
				toFile(content + "\n", logFile);
			}
		}
	}
	
	public static void info(String content) {
		if(isLogEnable(info, allowGeneral))
		{
			if(logFile == null)
			{
				System.out.println(content);
			}
			else
			{
				toFile(content + "\n", logFile);
			}
		}
	}
	
	public static void warn(String content) {
		if(isLogEnable(warn, allowAll))
		{
			if(logFile == null)
			{
				System.out.println("WARN:" + content);
			}
			else
			{
				toFile("WARN:" + content  + "\n", logFile);
			}
		}
	}
	
	public static void error(String content) {
		if(isLogEnable(error, allowAll))
		{
			if(logFile == null)
			{
				System.err.println("ERROR:" +content);
			}
			else
			{
				toFile("ERROR:" + content  + "\n", logFile);
			}
		}
	}
	
	public static void info(String Head, String msg) {
		info(Head + " " + msg);
	}
	
	public static void debugForOffice(String content) {
		debug("OFFICE: " + content);
	}

	public static void infoForOffice(String content) {
		info("OFFICE: " + content);
	}
	
	public static void printByte(byte data) {
		if(isLogEnable(debug, allowGeneral))
		{
			System.out.printf( "%02X ", data);
		}
	}
	
	public static void printBytes(byte[] data) {
		if(isLogEnable(debug, allowGeneral))
		{
			for(int i=0; i<data.length; i++)
			{
				System.out.printf( "%02X ", data[i]);
			}
		}
	}
	
	//To print the obj by convert it to json format
	public static void printObject(String Head,Object obj)
	{
		if(isLogEnable(debug, allowGeneral))
		{
			String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
			System.out.println(Head + json);
		}
	}
		
	public static void docSysDebugLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
		debug(logStr);		
	}

	public static void docSysWarningLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
		warn(logStr);
	}
	
	public static void docSysErrorLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setError(logStr);
		}
		error(logStr);
	}
}
