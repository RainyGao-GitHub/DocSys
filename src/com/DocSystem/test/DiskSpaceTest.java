package com.DocSystem.test;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;

import org.apache.tools.ant.Project;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;

class DiskSpaceTest  
{  
    public static void main(String[] args) {
        File[] roots = File.listRoots();
        for (File _file : roots) {
            System.out.println(_file.getPath());
            //System.out.println(_file.getName());
            long totalSpace = _file.getTotalSpace();
            long freeSpace = _file.getFreeSpace();
            long usableSpace = _file.getUsableSpace();
            long usedSpace = totalSpace - freeSpace;

            System.out.println("Free space = " + freeSpace);
            System.out.println("Usable space = " + usableSpace);
            System.out.println("Total space = " + totalSpace);
            System.out.println("used space  = " + usedSpace);

            System.out.println("总空间大小 : " + totalSpace / 1024 / 1024 / 1024 + "G");
            System.out.println("剩余空间大小 : " + freeSpace / 1024 / 1024 / 1024 + "G");
            System.out.println("可用空间大小 : " + usableSpace / 1024 / 1024 / 1024 + "G");
            System.out.println("已用空间大小 : " + usedSpace / 1024 / 1024 / 1024 + "G");
            
            System.out.println();
        }
        File win = new File("C:\\WINDOWS");
        System.out.println(win.getPath());
        System.out.println(win.getName());
        System.out.println("Free space = " + win.getFreeSpace());
        System.out.println("Usable space = " + win.getUsableSpace());
        System.out.println("Total space = " + win.getTotalSpace());
        System.out.println();
    }
}  