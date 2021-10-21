package com.DocSystem.test;

import java.io.IOException;
import com.DocSystem.common.FileUtil;

public class CompressTest {
	public static void main(String[] args) throws IOException {
		String path = "C:/Test/TestDir";
		String outPath = "C:/Test/Test.zip";
		FileUtil.compressWith7z(path, outPath);
	}	
}