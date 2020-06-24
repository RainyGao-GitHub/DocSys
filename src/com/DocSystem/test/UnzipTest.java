package com.DocSystem.test;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;

import org.apache.commons.compress.archivers.sevenz.SevenZArchiveEntry;
import org.apache.commons.compress.archivers.sevenz.SevenZFile;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.tar.TarEntry;
import org.apache.tools.tar.TarInputStream;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.tukaani.xz.XZInputStream;

import com.github.junrar.Archive;
import com.github.junrar.rarfile.FileHeader;
import com.jcraft.jzlib.GZIPInputStream;

class UnzipTest  
{  
    public static void main(String[] args)    
    {  
        try {
			//UnZip Works
        	System.out.println("解压缩测试，使用7-Zip压缩后的文件解压后中文乱码");
        	ZipFile zipFile = new ZipFile(new File("C:\\DocSysTest\\AAAAAA.zip"));
			unZip("C:\\DocSysTest\\AAAAAA", zipFile);
	        	
			//UnTarGz works
			File tgzFile = new File("C:\\DocSysTest\\BBBBBB.tgz");
			decompressTarGz(tgzFile, "C:/DocSysTest/BBBBBB", false);
	        
			//UnTar Works
			File tarFile = new File("C:\\DocSysTest\\CCCCCC.tar");
			decompressTar(tarFile, "C:/DocSysTest/CCCCCC", false);

			//UnGz Works (gz表示单个文件)
			File gzFile = new File("C:\\DocSysTest\\DDDDDD.gz");
			decompressGz(gzFile, "C:/DocSysTest/DDDDDD", false);
			//File gzFile = new File("C:\\DocSysTest\\CCS.boot.gz");
			//decompressGz(gzFile, "C:/DocSysTest/CCS.boot", false);

			//UnXz works
			File xzFile = new File("C:\\DocSysTest\\EEEEEE.xz");
			decompressXz(xzFile, "C:/DocSysTest/EEEEEE", false);

			//UnXz works
			File txzFile = new File("C:\\DocSysTest\\GGGGGG.txz");
			decompressTarXz(txzFile, "C:/DocSysTest/GGGGGG", false);

			//UnRar works
			File rarFile = new File("C:\\DocSysTest\\FFFFFF.rar");
			decompressRAR(rarFile, "C:/DocSysTest/FFFFFF", false);
			
	        //File srcFile = new File("C:\\DocSysTest\\压缩测试");
	        //File dstFile = new File("C:\\DocSysTest\\压缩测试.zip");
	        //zip(srcFile, dstFile);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
    
    public enum FileType {
        // 未知
        UNKNOWN,
        // 压缩文件
        ZIP, RAR, _7Z, TAR, GZ, TAR_GZ, BZ2, TAR_BZ2,
        // 位图文件
        BMP, PNG, JPG, JPEG,
        // 矢量图文件
        SVG,
        // 影音文件
        AVI, MP4, MP3, AAR, OGG, WAV, WAVE
    }
    
    /**
     * 获取文件真实类型
     *
     * @param file 要获取类型的文件。
     * @return 文件类型枚举。
     */
    private static FileType getFileType(File file){
        FileInputStream inputStream =null;
        try{
            inputStream = new FileInputStream(file);
            byte[] head = new byte[4];
            if (-1 == inputStream.read(head)) {
                return FileType.UNKNOWN;
            }
            int headHex = 0;
            for (byte b : head) {
                headHex <<= 8;
                headHex |= b;
            }
            switch (headHex) {
                case 0x504B0304:
                    return FileType.ZIP;
                case 0x776f7264:
                    return FileType.TAR;
                case -0x51:
                    return FileType._7Z;
                case 0x425a6839:
                    return FileType.BZ2;
                case -0x74f7f8:
                    return FileType.GZ;
                case 0x52617221:
                    return FileType.RAR;
                default:
                    return FileType.UNKNOWN;
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            try {
                if(inputStream!=null){
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return FileType.UNKNOWN;
    }
    
    /**
     *  构建目录
     * @param outputDir 输出目录
     * @param subDir 子目录
     */
    private static void createDirectory(String outputDir, String subDir){
        File file = new File(outputDir);
        if(!(subDir == null || subDir.trim().equals(""))) {//子目录不为空
            file = new File(outputDir + File.separator + subDir);
        }
        if(!file.exists()){
            if(!file.getParentFile().exists()){
                file.getParentFile().mkdirs();
            }
            file.mkdirs();
        }
    }
    
    /**
     * 解压缩RAR文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressRAR(File file, String targetPath,  boolean delete){
        Archive archive = null;
        OutputStream outputStream = null;
        try {
            archive = new Archive(new FileInputStream(file));
            FileHeader fileHeader;
            // 创建输出目录
            createDirectory(targetPath, null);
            while( (fileHeader = archive.nextFileHeader()) != null){
            	//System.out.println("subEntry:" + fileHeader.getFileNameString());
            	System.out.println("subEntry:" + fileHeader.getFileNameW());
            	//System.out.println("subEntry:" + new String(fileHeader.getFileNameByteArray(), "GBK"));
            	
            	String fileName = fileHeader.getFileNameW();
            	//System.out.println("subEntry:" + fileName);
            	
            	//fileName = new String(buff, "GB18030");
            	//System.out.println("subEntry:" + fileName);
            	
            	if(fileHeader.isDirectory()){
                    createDirectory(targetPath, fileName); // 创建子目录
                }else{
                	File tmpFile = new File(targetPath + File.separator + fileName);
					File parent = tmpFile.getParentFile();
					if (!parent.exists()) {
 						parent.mkdirs();
 					}
                	
                	outputStream = new FileOutputStream(tmpFile);
                    archive.extractFile(fileHeader, outputStream);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩7z文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompress7Z(File file, String targetPath,  boolean delete){
        SevenZFile sevenZFile = null;
        OutputStream outputStream = null;
        try {
            sevenZFile = new SevenZFile(file);
            // 创建输出目录
            createDirectory(targetPath, null);
            SevenZArchiveEntry entry;

            while((entry = sevenZFile.getNextEntry()) != null){
                if(entry.isDirectory()){
                    createDirectory(targetPath, entry.getName()); // 创建子目录
                }else{
                    outputStream = new FileOutputStream(new File(targetPath + File.separator + entry.getName()));
                    int len = 0;
                    byte[] b = new byte[2048];
                    while((len = sevenZFile.read(b)) != -1){
                        outputStream.write(b, 0, len);
                    }
                    outputStream.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * 解压缩tar.bz2文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    public static void decompressTarBz2(File file, String targetPath, boolean delete){
        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;
        TarInputStream tis = null;
        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);
            tis = new TarInputStream(bis, 1024 * 2);
            // 创建输出目录
            createDirectory(targetPath, null);
            TarEntry entry;
            while((entry = tis.getNextEntry()) != null){
                if(entry.isDirectory()){
                    createDirectory(targetPath, entry.getName()); // 创建子目录
                }else{
                    fos = new FileOutputStream(new File(targetPath + File.separator + entry.getName()));
                    int count;
                    byte data[] = new byte[2048];
                    while ((count = tis.read(data)) != -1) {
                        fos.write(data, 0, count);
                    }
                    fos.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(bis != null){
                    bis.close();
                }
                if(tis != null){
                    tis.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩bz2文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    public static void decompressBZ2(File file, String targetPath, boolean delete){
        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;
        String suffix = ".bz2";
        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);
            // 创建输出目录
            createDirectory(targetPath, null);
            File tempFile = new File(targetPath + File.separator + file.getName().replace(suffix, ""));
            fos = new FileOutputStream(tempFile);

            int count;
            byte data[] = new byte[2048];
            while ((count = bis.read(data)) != -1) {
                fos.write(data, 0, count);
            }
            fos.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(bis != null){
                    bis.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩tar文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressTar(File file, String targetPath, boolean delete){
        FileInputStream fis = null;
        OutputStream fos = null;
        TarInputStream tarInputStream = null;
        try {
            fis = new FileInputStream(file);
            tarInputStream = new TarInputStream(fis, 1024 * 2);
            // 创建输出目录
            createDirectory(targetPath, null);

            TarEntry entry = null;
            while(true){
                entry = tarInputStream.getNextEntry();
                if( entry == null){
                    break;
                }
                System.out.println("subEntry:" + entry.getName());
                if(entry.isDirectory()){
                    createDirectory(targetPath, entry.getName()); // 创建子目录
                }else{
                    fos = new FileOutputStream(new File(targetPath + File.separator + entry.getName()));
                    int count;
                    byte data[] = new byte[2048];
                    while ((count = tarInputStream.read(data)) != -1) {
                        fos.write(data, 0, count);
                    }
                    fos.flush();
                }
            }
        } catch (IOException e) {
           e.printStackTrace();
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(tarInputStream != null){
                    tarInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩tar.gz文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressTarGz(File file, String targetPath,  boolean delete){
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        GZIPInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new GZIPInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);

            // 创建输出目录
            createDirectory(targetPath, null);

            TarEntry entry = null;
            while((entry = tarIn.getNextEntry()) != null){
            	System.out.println("subEntry:" + entry.getName());
                if(entry.isDirectory()){ // 是目录
                    createDirectory(targetPath, entry.getName()); // 创建子目录
                }else{ // 是文件
                    File tempFIle = new File(targetPath + File.separator + entry.getName());
                    createDirectory(tempFIle.getParent() + File.separator, null);
                    out = new FileOutputStream(tempFIle);
                    int len =0;
                    byte[] b = new byte[2048];

                    while ((len = tarIn.read(b)) != -1){
                        out.write(b, 0, len);
                    }
                    out.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩tar.xz txz文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressTarXz(File file, String targetPath,  boolean delete){
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        XZInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new XZInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);

            // 创建输出目录
            createDirectory(targetPath, null);

            TarEntry entry = null;
            while((entry = tarIn.getNextEntry()) != null){
            	System.out.println("subEntry:" + entry.getName());
                if(entry.isDirectory()){ // 是目录
                    createDirectory(targetPath, entry.getName()); // 创建子目录
                }else{ // 是文件
                    File tempFIle = new File(targetPath + File.separator + entry.getName());
                    createDirectory(tempFIle.getParent() + File.separator, null);
                    out = new FileOutputStream(tempFIle);
                    int len =0;
                    byte[] b = new byte[2048];

                    while ((len = tarIn.read(b)) != -1){
                        out.write(b, 0, len);
                    }
                    out.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩xz文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressXz(File file, String targetPath,  boolean delete){
        FileInputStream  fileInputStream = null;
        XZInputStream gzipIn = null;
        OutputStream out = null;
        String suffix = ".xz";
        try {
            fileInputStream = new FileInputStream(file);
            
            gzipIn = new XZInputStream(fileInputStream, 100 * 1024);
            
            // 创建输出目录
            createDirectory(targetPath, null);

            File tempFile = new File(targetPath + File.separator + file.getName().replace(suffix, ""));
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 解压缩gz文件
     * @param file 压缩包文件
     * @param targetPath 目标文件夹
     * @param delete 解压后是否删除原压缩包文件
     */
    private static void decompressGz(File file, String targetPath,  boolean delete){
        FileInputStream  fileInputStream = null;
        GZIPInputStream gzipIn = null;
        OutputStream out = null;
        String suffix = ".gz";
        try {
            fileInputStream = new FileInputStream(file);
            gzipIn = new GZIPInputStream(fileInputStream);
            // 创建输出目录
            createDirectory(targetPath, null);

            File tempFile = new File(targetPath + File.separator + file.getName().replace(suffix, ""));
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
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
				
				System.out.println("**********: " + path + "/" + entry.getName());
	        	
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