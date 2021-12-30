package com.DocSystem.common;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.io.RandomAccessFile;

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
	public static String logFileConfig = null;	//logFileConfig	
	public static String logFile = null;	//run time
	
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
			appendContentToFile(filePath, content, "UTF-8");	
		}
	}
	
	//向文件末尾追加内容
    public static boolean appendContentToFile(String filePath, String content, String encode) {
        try {
            // 打开一个随机访问文件流，按读写方式
            RandomAccessFile randomFile = new RandomAccessFile(filePath, "rw");
            // 文件长度，字节数
            long fileLength = randomFile.length();
            //将写文件指针移到文件尾。
            randomFile.seek(fileLength);
			
            byte[] buff;
			if(encode == null)
			{
				buff = content.getBytes();
			}
			else
			{
				buff = content.getBytes(encode); //将String转成指定charset的字节内容
			}
            randomFile.write(buff);
            
            randomFile.close();
            return true;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
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
	
	public static void debug(Exception e) {
		if(isLogEnable(debug, allowGeneral))
		{
			if(logFile == null)
			{
				e.printStackTrace(System.out);
			}
			else
			{
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				e.printStackTrace(new PrintStream(baos));
				toFile(baos.toString(), logFile);
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
	
	public static void info(Exception e) {
		if(isLogEnable(info, allowGeneral))
		{
			if(logFile == null)
			{
				e.printStackTrace(System.out);
			}
			else
			{
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				e.printStackTrace(new PrintStream(baos));
				toFile(baos.toString(), logFile);
			}
		}
	}
	
	public static void warn(String content) {
		if(isLogEnable(warn, allowAll))
		{
			if(logFile == null)
			{
				System.out.println("[warn] " + content);
			}
			else
			{
				toFile("[warn] " + content  + "\n", logFile);
			}
		}
	}
	
	public static void warn(Exception e) {
		if(isLogEnable(warn, allowGeneral))
		{
			if(logFile == null)
			{
				e.printStackTrace(System.out);
			}
			else
			{
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				e.printStackTrace(new PrintStream(baos));
				toFile(baos.toString(), logFile);
			}
		}
	}
	
	public static void error(String content) {
		if(isLogEnable(error, allowAll))
		{
			if(logFile == null)
			{
				System.out.println("[error] " +content);
			}
			else
			{
				toFile("[error] " + content  + "\n", logFile);
			}
		}
	}
	
	public static void error(Exception e) {
		if(isLogEnable(error, allowGeneral))
		{
			if(logFile == null)
			{
				e.printStackTrace(System.out);
			}
			else
			{
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				e.printStackTrace(new PrintStream(baos));
				toFile(baos.toString(), logFile);
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
			if(logFile == null)
			{
				System.out.printf( "%02X ", data);
			}
			else
			{				
				toFile(String.format("%02X ", data), logFile);
			}
		}
	}
	
	public static void printBytes(byte[] data) {
		if(isLogEnable(debug, allowGeneral))
		{
			if(logFile == null)
			{
				for(int i=0; i<data.length; i++)
				{
					System.out.printf( "%02X ", data[i]);
				}
			}
			else
			{
				for(int i=0; i<data.length; i++)
				{
					toFile(String.format("%02X ", data[i]), logFile);
				}
			}
		}
	}
	
	//To print the obj by convert it to json format
	public static void printObject(String Head,Object obj)
	{
		if(isLogEnable(debug, allowGeneral))
		{
			String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
			debug(Head + json);
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
