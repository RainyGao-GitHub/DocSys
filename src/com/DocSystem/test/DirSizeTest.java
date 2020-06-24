package com.DocSystem.test;

import java.io.File;

import org.apache.commons.io.FileUtils;

class DirSizeTest  
{  
    public static void main(String[] args) {
        long size = FileUtils.sizeOfDirectory(new File("C:/DocSysTest"));
        System.out.println("Size: " + size + " bytes");
    }
}  