package com.DocSystem.test;

import java.io.IOException;

import com.DocSystem.common.FileUtil;

import util.ReadProperties;

public class ReadProperitiesTest {
	public static void main(String[] args) throws IOException {
		String path = "C:/MxsdocTestDir/";
		String fileName1 = "file1.txt";
		String fileName2 = "file2.txt";
		String fileName3 = "file3.txt";
		
		FileUtil.createFile(path, fileName1);
		FileUtil.createFile(path, fileName2);
		FileUtil.createFile(path, fileName3);
		
		
		ReadProperties.setValue(path + fileName1, "db.url", "jdbc:mysql://localhost:3307/DocSystem1?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC");
		ReadProperties.setValue(path + fileName1, "db.pwd", "1111@2222=");
		
		String url = ReadProperties.getValue(path + fileName1, "db.url");
		System.out.println("url:" + url);
		String pwd = ReadProperties.getValue(path + fileName1, "db.pwd");
		System.out.println("pwd:" + pwd);		
		
		FileUtil.saveDocContentToFile("db.url=" + url, path, fileName2);
		FileUtil.saveDocContentToFile("db.pwd=" +pwd, path, fileName3);
		
		String url1 = ReadProperties.getValue(path + fileName2, "db.url");
		System.out.println("url1:" + url1);
		String pwd1 = ReadProperties.getValue(path + fileName3, "db.pwd");
		System.out.println("pwd1:" + pwd1);
	}	
}