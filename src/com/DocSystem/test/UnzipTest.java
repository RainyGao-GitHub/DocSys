package com.DocSystem.test;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;

import org.apache.tools.ant.Project;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.apache.tools.zip.ZipOutputStream;

class UnzipTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("解压缩测试，使用7-Zip压缩后的文件解压后中文乱码");
        ZipFile zipFile;
		try {
			zipFile = new ZipFile(new File("C:\\DocSysTest\\压缩测试.zip"));
	        
			unZip("C:\\DocSysTest\\解压缩测试", zipFile);
	        
	        File srcFile = new File("C:\\DocSysTest\\压缩测试");
	        File dstFile = new File("C:\\DocSysTest\\压缩测试.zip");
	        zip(srcFile, dstFile);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
    
	public static boolean unZip(String path, ZipFile zipFile) {
		 
		FileOutputStream fileOutputStream = null;
 
		InputStream inputStream = null;
 
		File file = null;
 
		try {
 
			int bufSize = 512;
 
			byte[] buf = new byte[bufSize];
 
			int readedBytes;
 
			for (Enumeration<ZipEntry> entries = zipFile.getEntries(); entries.hasMoreElements();) {
 
				ZipEntry entry = entries.nextElement();
				
				System.out.println(path + "/" + entry.getName());
	        	
				file = new File(path + "/" + entry.getName());
 
				if (entry.isDirectory()) {
 
					file.mkdirs();
 
				} else {
 
					File parent = file.getParentFile();
 
					if (!parent.exists()) {
 
						parent.mkdirs();
 
					}
 
					inputStream = zipFile.getInputStream(entry);
 
					fileOutputStream = new FileOutputStream(file);
 
					while ((readedBytes = inputStream.read(buf)) > 0) {
 
						fileOutputStream.write(buf, 0, readedBytes);
 
					}
 
					close(fileOutputStream, inputStream);
 
				}
 
			}
 
			zipFile.close();
 
			return true;
 
		} catch (Exception e) {
 
			e.printStackTrace();
 
			return false;
 
		} finally {
 
			close(fileOutputStream, inputStream);
 
		}
 
	}
 
	public static boolean zip(File src, File dest) {
		 
		try {
 
			Project prj = new Project();
 
			org.apache.tools.ant.taskdefs.Zip zip = new org.apache.tools.ant.taskdefs.Zip();
 
			zip.setProject(prj);
 
			zip.setDestFile(dest);
 
			FileSet fileSet = new FileSet();
 
			fileSet.setProject(prj);
 
			if (src.isFile()) {
 
				fileSet.setFile(src);
 
			} else {
 
				fileSet.setDir(src);
 
			}
 
			zip.addFileset(fileSet);
 
			zip.execute();
 
			return true;
 
		} catch (Exception e) {
 
			e.printStackTrace();
 
			return false;
 
		}
 
	}

	public static void close(AutoCloseable... autoCloseables) {
 
		try {
 
			if (autoCloseables != null) {
 
				for (AutoCloseable autoCloseable : autoCloseables) {
 
					autoCloseable.close();
				}
			}
 
		} catch (Exception e) {
 
			e.printStackTrace();
 
		}
 
	}
}  