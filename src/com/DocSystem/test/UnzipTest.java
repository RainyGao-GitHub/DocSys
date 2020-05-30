package com.DocSystem.test;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.Enumeration;

import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.apache.tools.zip.ZipOutputStream;

class UnzipTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        zip ("C:\\DocSysTest\\压缩测试", "C:\\DocSysTest\\压缩测试.zip");
        unZip("C:\\DocSysTest\\解压缩测试.zip", "C:\\DocSysTest\\解压缩测试");
    }  
    
    /**
     * 功能：把 sourceDir 目录下的所有文件进行 zip 格式的压缩，保存为指定 zip 文件
     * @param sourceDir
     * @param zipFile
     */

    public static void zip(String sourceDir, String zipFile) {

        OutputStream os;

        try {

            os = new FileOutputStream(zipFile);

            BufferedOutputStream bos = new BufferedOutputStream(os);

            ZipOutputStream zos = new ZipOutputStream(bos);

            File file = new File(sourceDir);

            String basePath = null;

            if (file.isDirectory()) {

                basePath = file.getPath();

            } else {//直接压缩单个文件时，取父目录

                basePath = file.getParent();

            }

            zipFile(file, basePath, zos);

            zos.closeEntry();

            zos.close();

        } catch (Exception e) {

            e.printStackTrace();

        }

    }

    /**
     * 功能：执行文件压缩成zip文件
     * @param source
     * @param basePath  待压缩文件根目录
     * @param zos
     */

    private static void zipFile(File source, String basePath,

    ZipOutputStream zos) {

        File[] files = new File[0];

        if (source.isDirectory()) {

            files = source.listFiles();

        } else {

            files = new File[1];

            files[0] = source;

        }

        String pathName;//存相对路径(相对于待压缩的根目录)

        byte[] buf = new byte[1024];

        int length = 0;

        try {

            for (File file : files) {

                if (file.isDirectory()) {

                    pathName = file.getPath().substring(basePath.length() + 1)

                    + "/";

                    zos.putNextEntry(new ZipEntry(pathName));
                    
                    zipFile(file, basePath, zos);

                } else {

                    pathName = file.getPath().substring(basePath.length() + 1);

                    InputStream is = new FileInputStream(file);

                    BufferedInputStream bis = new BufferedInputStream(is);

                    zos.putNextEntry(new ZipEntry(pathName));

                    while ((length = bis.read(buf)) > 0) {

                        zos.write(buf, 0, length);

                    }

                    is.close();

                }

            }

        } catch (Exception e) {

            e.printStackTrace();

        }

    }

    /**
     * 功能：解压 zip 文件，只能解压 zip 文件
     * @param zipfile
     * @param destDir
     */

    public static void unZip(String zipfile, String destDir) {

        destDir = destDir.endsWith("\\") ? destDir : destDir + "\\";

        byte b[] = new byte[1024];

        int length;

        ZipFile zipFile;

        try {

            zipFile = new ZipFile(new File(zipfile));

            Enumeration enumeration = zipFile.getEntries();

            ZipEntry zipEntry = null;

            while (enumeration.hasMoreElements()) {

                zipEntry = (ZipEntry) enumeration.nextElement();
                
                //中文的显示还是乱码，可能要参考一下压缩代码
                System.out.println("file:" + destDir + zipEntry.getName());

                File loadFile = new File(destDir + zipEntry.getName());
                if (zipEntry.isDirectory()) {

                    loadFile.mkdirs();

                } else {

                    if (!loadFile.getParentFile().exists()){

                        loadFile.getParentFile().mkdirs();
                        
                    }

                    OutputStream outputStream = new FileOutputStream(loadFile);

                    InputStream inputStream = zipFile.getInputStream(zipEntry);

                    while ((length = inputStream.read(b)) > 0)

                        outputStream.write(b, 0, length);

                }

            }

        } catch (IOException e) {

            e.printStackTrace();

        }

    }
}  