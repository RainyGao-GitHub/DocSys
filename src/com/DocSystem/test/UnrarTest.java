package com.DocSystem.test;

import java.io.IOException;
import java.io.RandomAccessFile;

import net.sf.sevenzipjbinding.IInArchive;
import net.sf.sevenzipjbinding.SevenZip;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;

public class UnrarTest {
	public static void main(String[] args) throws IOException {
		String rarDir = "C:/UnrarTest/rar5.rar";
		String outDir = "C:/UnrarTest/rar5/";
 
		RandomAccessFile randomAccessFile = null;
		IInArchive inArchive = null;
 
		// 第一个参数是需要解压的压缩包路径，第二个参数参考JdkAPI文档的RandomAccessFile
		randomAccessFile = new RandomAccessFile(rarDir, "r");
		inArchive = SevenZip.openInArchive(null, new RandomAccessFileInStream(randomAccessFile));
 
		int[] in = new int[inArchive.getNumberOfItems()];
		for (int i = 0; i < in.length; i++) {
			in[i] = i;
		}
		inArchive.extract(in, false, new ExtractCallback(inArchive, "366", outDir));
 
	}
}