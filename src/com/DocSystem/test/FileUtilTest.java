package com.DocSystem.test;

import java.io.File;
import java.io.IOException;
import com.DocSystem.common.FileUtil;

public class FileUtilTest {
	public static void main(String[] args) throws IOException {
		String path = "C:/Test/";
		String inName = "in.JPG";
		String outName = "out.JPG";
		File file = new File(path, inName);
		long size = file.length();
		
		byte[] buff = FileUtil.readBufferFromFile(path, inName, (long)0, (int)size);
		FileUtil.saveDataToFile(buff, path, outName);	
	}	
}