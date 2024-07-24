package com.DocSystem.common;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.extractor.PowerPointExtractor;
import org.apache.poi.hssf.extractor.ExcelExtractor;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Paragraph;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;
import org.apache.poi.xslf.extractor.XSLFPowerPointExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xssf.extractor.XSSFExcelExtractor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

public class OfficeExtract {
	/****************** Office文件解析接口 *********************************************/
	public static boolean extractToFileForWord(String filePath, String path, String name)
	{
    	HWPFDocument doc1 = null;
    	FileInputStream fis = null;
    	
		try {
			StringBuffer content = new StringBuffer("");// 文档内容
	    	fis = new FileInputStream(filePath);
    	
    		doc1 = new HWPFDocument(fis);

    		Range range = doc1.getRange();
    	    int paragraphCount = range.numParagraphs();// 段落
    	    for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
    	    	Paragraph pp = range.getParagraph(i);
    	    	content.append(pp.text());
    	    }
    	    
    		doc1.close();
    		doc1 = null;
    	    fis.close();
    	    fis = null;
    		
    	    return FileUtil.saveDocContentToFile(content.toString().trim(), path, name, null);
		}
		catch (Exception e) 
		{
			Log.info(e);
			if(doc1 != null)
			{
				try 
				{
					doc1.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
			
			if(fis != null)
			{
				try 
				{
					fis.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
    		return false;
    	}
	}

	public static boolean extractToFileForWord2007(String filePath, String path, String name)
	{
    	FileInputStream fis = null;
    	XWPFDocument xdoc = null;
    	XWPFWordExtractor extractor = null;
    	
		try {
	    	
			File file = new File(filePath);
	    	String str = "";
	    	fis = new FileInputStream(file);
	    	xdoc = new XWPFDocument(fis);
    		extractor = new XWPFWordExtractor(xdoc);
        	
    		str = extractor.getText();
        	
        	extractor.close();
        	extractor = null;
        	xdoc.close();
        	xdoc = null;
        	fis.close();
        	fis = null;
        	
    	    return FileUtil.saveDocContentToFile(str.toString().trim(), path, name, null);
		} 
		catch (Exception e) 
		{		
			Log.info(e);
			if(extractor != null)
			{
				try 
				{
					extractor.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
			
			if(xdoc != null)
			{
				try 
				{
					xdoc.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
		
			if(fis != null)
			{
				try 
				{
					fis.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}			
			return false;
		}
	}

	public static boolean extractToFileForExcel(String filePath, String path, String name)
	{
		InputStream is = null;  
        HSSFWorkbook workBook = null;  
        ExcelExtractor extractor = null; 
        
        try 
        {  
	
			is = new FileInputStream(filePath);  
			workBook = new HSSFWorkbook(new POIFSFileSystem(is));  

            extractor=new ExcelExtractor(workBook);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            String text = extractor.getText();  
            
            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
              
            return FileUtil.saveDocContentToFile( text.toString().trim(), path, name, null);
        }
        catch(Exception e) 
        {
        	Log.info(e);
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(workBook != null)
			{
				try 
				{
					workBook.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
		
			if(is != null)
			{
				try 
				{
					is.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
			return false;
        }
	}

	public static boolean extractToFileForExcel2007(String filePath, String path, String name)
	{
        InputStream is = null;
        XSSFWorkbook workBook = null;  
        XSSFExcelExtractor extractor = null;
        
		try {  
	        is = new FileInputStream(filePath);
        	workBook = new XSSFWorkbook(is);  
            extractor = new XSSFExcelExtractor(workBook);  
            String text = extractor.getText();  

            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
            
            return FileUtil.saveDocContentToFile( text.toString().trim(), path, name, null);
		} 
		catch (Exception e) 
		{
			Log.info(e);
			
			if(extractor != null)
			{
				try 
				{
					extractor.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
			
			if(workBook != null)
			{
				try 
				{
					workBook.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
		
			if(is != null)
			{
				try 
				{
					is.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
        	return false;
        }       
	}

	public static boolean extractToFileForPPT(String filePath, String path, String name)
	{
		InputStream is = null;
        PowerPointExtractor extractor = null;  
        
		try {
			is = new FileInputStream(filePath);
            extractor = new PowerPointExtractor(is);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            is.close();      
            is = null;
            
            return FileUtil.saveDocContentToFile( text.toString().trim(), path, name, null);
		} 
		catch (Exception e) 
		{
			Log.info(e);
			if(extractor != null)
			{
				try 
				{
					extractor.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
		
			if(is != null)
			{
				try 
				{
					is.close();
				} 
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
            return false;
        }          
	}

	public static boolean extractToFileForPPT2007(String filePath, String path, String name)
	{
		InputStream is = null; 
        XMLSlideShow slide = null;
        XSLFPowerPointExtractor extractor = null;  
        
        try 
        {  
			is = new FileInputStream(filePath); 
	        slide = new XMLSlideShow(is);
            extractor=new XSLFPowerPointExtractor(slide);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            slide.close();
            slide = null;
            is.close();
            is = null;
            
            return FileUtil.saveDocContentToFile( text.toString().trim(), path, name, null);
        } 
        catch (Exception e) 
        {  
			Log.info(e);
        	if(extractor != null)
			{
				try 
				{
					extractor.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
			
			if(slide != null)
			{
				try 
				{
					slide.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
		
			if(is != null)
			{
				try 
				{
					is.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}
            return false;
        }
	}
	
	public static boolean extractToFileForPdf(String filePath, String path, String name)
	{
		PDDocument document = null;
				
		try
		{
			File pdfFile=new File(filePath);			
			document=PDDocument.load(pdfFile);
			int pages = document.getNumberOfPages();
			// 读文本内容
			PDFTextStripper stripper=new PDFTextStripper();
			// 设置按顺序输出
			stripper.setSortByPosition(true);
			stripper.setStartPage(1);
			stripper.setEndPage(pages);
			String content = stripper.getText(document);
			
			document.close();
			document = null;
			
            return FileUtil.saveDocContentToFile( content.toString().trim(), path, name, null);
	   }
	   catch(Exception e)
	   {
			Log.info(e);
			if(document != null)
			{
				try 
				{
					document.close();
				}
				catch (IOException e1) 
				{
					Log.info(e1);
				}
			}			
			return false;
	   }
	}
}
