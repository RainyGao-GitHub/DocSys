package com.DocSystem.test;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.PrintStream;

import com.DocSystem.controller.BaseController;

class covertBinToArray extends BaseController{
    public static void main(String[] args) {
    	String path = "C:/covertBinToArray/";
    	String inName = "test.pcap";
    	String outName = "test.cpp";
    	convertBinToArry(path+inName, path, outName);
    }
    
	protected static void convertBinToArry(String filePath, String outputFilePath, String outputFileName) 
	{	
		try 
		{			
			File file = new File(filePath);
			if(!file.exists() || !file.isFile())
			{
				System.out.println("convertBinToArry " +filePath+ " 不存在或不是文件");
				return;
			}
			
			int fileSize = (int) file.length();
			System.out.println("convertBinToArry fileSize:" +fileSize);				
			if(fileSize  <= 0)
			{
				return;
			}

			byte buffer[] = new byte[fileSize];
			FileInputStream in;
			in = new FileInputStream(filePath);
			in.read(buffer, 0, fileSize);
			in.close();	
			System.out.println("convertBinToArry read data ok");				
			
	        FileWriter fw = new FileWriter(outputFilePath+outputFileName, true);
	        BufferedWriter bw = new BufferedWriter(fw);
			StringBuffer content=new StringBuffer();
			String tmpString = "int pcapBytes[" + fileSize +"]={";
			content.append(tmpString);
			//bw.append(tmpString); //允许null
			bw.write(tmpString);// 往已有的文件上添加字符串
			for(int i=0; i<fileSize-1; i++)
			{
				tmpString = buffer[i] + ",";
				content.append(tmpString);
				//bw.append(tmpString); //允许null
				bw.write(tmpString);// 往已有的文件上添加字符串
			}
			tmpString = buffer[fileSize-1] + "};";
			content.append(buffer[fileSize-1] + "};");			
			//bw.append(tmpString); //允许null
			bw.write(tmpString);// 往已有的文件上添加字符串

			//System.out.println("convertBinToArry content:" + content);							
	        bw.close();
	        fw.close();
	        
			System.out.println("convertBinToArry write to file ok:");										
		} catch (Exception e) {
			e.printStackTrace();
			return;
		}
	}
}