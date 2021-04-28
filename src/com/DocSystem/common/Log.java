package com.DocSystem.common;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.IntField;
import org.apache.lucene.document.LongField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.NumericRangeQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.wltea.analyzer.lucene.IKAnalyzer;

import com.alibaba.fastjson.JSON;

import util.ReadProperties;
import util.ReturnAjax;

public class Log {
	//To print the obj by convert it to json format
	public static void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);		
	}
	
	public static void printObject(String Head,Object obj, String filePath)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);
		toFile(Head + json, filePath);
	}	
	
	public static void docSysDebugLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
	}
	
	public static void docSysDebugLog(String logStr, ReturnAjax rt, String filePath) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}

		toFile(logStr, filePath);	
	}

	public static void docSysWarningLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
	}
	
	public static void docSysWarningLog(String logStr, ReturnAjax rt, String filePath) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
		
		toFile(logStr, filePath);
	}

	public static void docSysErrorLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setError(logStr);
		}
	}
	
	public static void docSysErrorLog(String logStr, ReturnAjax rt, String filePath) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setError(logStr);
		}
		
		toFile(logStr, filePath);
	}

	public static void info(String Head, String msg) {
		System.out.println(Head + " " + msg);
	}
	
	public static void info(String Head, String msg, String filePath) {
		System.out.println(Head + " " + msg);
		toFile(Head + " " + msg, filePath);
	}
	
	public static void println(String content) {
		System.out.println(content);
	}
	
	public static void println(String content, String filePath) {
		System.out.println(content);
		toFile(content + "\n", filePath);		
	}
	
	public static void toFile(String content, String filePath) {
		FileUtil.appendContentToFile(filePath, content);	
	}
}
