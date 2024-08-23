package com.DocSystem.test;

import java.io.File;
import com.DocSystem.common.FileUtil;

public class FileUtilTest {
	public static void main(String[] args) throws Exception 
	{
		//test();
		ConvertCharsetToUTF8("C:/N-20N3PF2E7EB0-Data/ragao/Desktop/", "docsystem_data.json", "docsystem_data-utf8.json");		
	}
	
	static void ConvertCharsetToUTF8(String path, String name, String outputName) throws Exception
	{
		//读取文件的字符编码
		String encode = FileUtil.getCharset(path + name);
		
		String content = FileUtil.readDocContentFromFile(path, name, encode);
		
		byte[] buff = content.getBytes("UTF-8");
		FileUtil.saveDataToFile(buff, path, outputName);
	}
	
	void test() throws Exception
	{
		String path = "C:/Test/";
		String inName = "in.JPG";
		String outName = "out.JPG";
		File file = new File(path, inName);
		long size = file.length();
		
		byte[] buff = FileUtil.readBufferFromFile(path, inName, (long)0, (int)size);
		FileUtil.saveDataToFile(buff, path, outName);
	}
}