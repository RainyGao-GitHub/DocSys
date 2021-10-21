package com.DocSystem.test;

import java.io.IOException;
import com.DocSystem.common.FileUtil;

public class CompressTest {
	public static void main(String[] args) throws IOException {
		String path = "C:/Test/临时目录";
		String outPath = "C:/Test/临时目录.zip";
		FileUtil.compressWith7z(path, outPath);
	}	
}