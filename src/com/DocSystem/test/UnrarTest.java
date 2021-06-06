package com.DocSystem.test;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.Arrays;

import net.sf.sevenzipjbinding.ArchiveFormat;
import net.sf.sevenzipjbinding.ExtractOperationResult;
import net.sf.sevenzipjbinding.IInArchive;
import net.sf.sevenzipjbinding.ISequentialOutStream;
import net.sf.sevenzipjbinding.SevenZip;
import net.sf.sevenzipjbinding.SevenZipException;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;
import net.sf.sevenzipjbinding.simple.ISimpleInArchive;
import net.sf.sevenzipjbinding.simple.ISimpleInArchiveItem;

public class UnrarTest {
	public static void main(String[] args) throws IOException {
		String rarDir = "C:/UnrarTest/rar5.rar";
		String outDir = "C:/UnrarTest/rar5/";
 
		ListItemsSimple(rarDir);
		
		ExtractItmes(rarDir, outDir);
	}
	
	private static void ExtractItmes(String rarDir, String outDir) {
		RandomAccessFile randomAccessFile = null;
		IInArchive inArchive = null;
 
		// 第一个参数是需要解压的压缩包路径，第二个参数参考JdkAPI文档的RandomAccessFile
		try {
			randomAccessFile = new RandomAccessFile(rarDir, "r");
			inArchive = SevenZip.openInArchive(null, new RandomAccessFileInStream(randomAccessFile));
			int[] in = new int[inArchive.getNumberOfItems()];
			for (int i = 0; i < in.length; i++) {
				in[i] = i;
			}
			
			inArchive.extract(in, false, new ExtractCallback(inArchive, "366", outDir));
		} catch (FileNotFoundException | SevenZipException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void ListItemsSimple(String filePath) {
	        RandomAccessFile randomAccessFile = null;
	        IInArchive inArchive = null;
	        try {
	            randomAccessFile = new RandomAccessFile(filePath, "r");
	            inArchive = SevenZip.openInArchive(null, // autodetect archive type
	                    new RandomAccessFileInStream(randomAccessFile));

	            // Getting simple interface of the archive inArchive
	            ISimpleInArchive simpleInArchive = inArchive.getSimpleInterface();

	            System.out.println("   Size   | Compr.Sz. | Filename");
	            System.out.println("----------+-----------+---------");

	            for (ISimpleInArchiveItem item : simpleInArchive.getArchiveItems()) {
	                System.out.println(String.format("%9s | %9s | %s", // 
	                        item.getSize(), 
	                        item.getPackedSize(), 
	                        item.getPath()));
	            }
	        } catch (Exception e) {
	            System.err.println("Error occurs: " + e);
	        } finally {
	            if (inArchive != null) {
	                try {
	                    inArchive.close();
	                } catch (SevenZipException e) {
	                    System.err.println("Error closing archive: " + e);
	                }
	            }
	            if (randomAccessFile != null) {
	                try {
	                    randomAccessFile.close();
	                } catch (IOException e) {
	                    System.err.println("Error closing file: " + e);
	                }
	            }
	        }
	}
}