package com.DocSystem.test;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

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

@SuppressWarnings("deprecation")
class poiTest  
{  
    public static void main(String[] args)    
    {  
    	String content = readWord("C:\\Users\\Administrator\\Downloads\\高級日本語中間テスト2016年11月送印.doc");
    	content = readWord("C:/Users/Administrator/Downloads/Debate (1).pptx");
    	System.out.println(content);
        
        content = readWordDocx("C:/Users/Administrator/Downloads/Debate (1).pptx");
        //content = readWordDocx("C:/Users/Administrator/Desktop/HashMap/ddddddddddd.docx");
        System.out.println(content);
        
        content = getTextFromExcel("C:/Users/Administrator/Downloads/Debate (1).pptx");
        //content = getTextFromExcel("C:\\Users\\Administrator\\Downloads\\CommitFailTest.xls");
        System.out.println(content); 
        
        content = getTextFromExcel2007("C:/Users/Administrator/Downloads/Debate (1).pptx");
        //content = getTextFromExcel2007("C:\\Users\\Administrator\\Downloads\\圆图网络公司账目 (1).xlsx");
        System.out.println(content);
        
        content = readPdf("C:/Users/Administrator/Downloads/Debate (1).pptx");
        //content = readPdf("C:/Users/Administrator/Downloads/111111111111111111.pdf");
        System.out.println(content);
        
        content = getTextFromPPT2007("C:/Users/Administrator/Downloads/Debate (1).pptx");
        System.out.println(content);
     
        content = readFile("C:\\Users\\Administrator\\Downloads\\ecs_migration_list_cn-hangzhou-dg-a01_2018-10-16.csv");
        System.out.println(content);
        
    }
    
    public static String readWord(String path) {
    	StringBuffer content = new StringBuffer("");// 文档内容
    	try {
	    	@SuppressWarnings("resource")
			HWPFDocument doc = new HWPFDocument(new FileInputStream(path));
	    	Range range = doc.getRange();
	    	int paragraphCount = range.numParagraphs();// 段落
	    	for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
	    		Paragraph pp = range.getParagraph(i);
	    		content.append(pp.text());
	    	}
    	} catch (Exception e) {
    		e.printStackTrace();
    	}
    	return content.toString().trim();
    }
    
    @SuppressWarnings("resource")
	public static String readWordDocx(String path){
    	File file = new File(path);
    	String str = "";
    	try {
    		FileInputStream fis = new FileInputStream(file);
    		XWPFDocument xdoc = new XWPFDocument(fis);
    		XWPFWordExtractor extractor = new XWPFWordExtractor(xdoc);
    		str = extractor.getText();
    		fis.close();
    	} catch (Exception e) {
    		 e.printStackTrace();
    	}
    	return str;
   }
   
    //直接读取Excel97-2003的全部内容    xls  
    public static String getTextFromExcel(String filePath){  
        InputStream is = null;  
        HSSFWorkbook wb = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            wb = new HSSFWorkbook(new POIFSFileSystem(is));  
            ExcelExtractor extractor=new ExcelExtractor(wb);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
        } catch (IOException e) {  
            System.out.println("getTextFromExcel IO错误");  
            e.printStackTrace();  
        }  
        return text;  
    }  
    
    //读取Excel2007+的全部内容 xlsx  
    public static String getTextFromExcel2007(String filePath) {  
        InputStream is = null;  
        XSSFWorkbook workBook = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            workBook = new XSSFWorkbook(is);  
            XSSFExcelExtractor extractor=new XSSFExcelExtractor(workBook);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
        } catch (IOException e) {  
            System.out.println("getTextFromExcel2007 IO错误");  
            e.printStackTrace();  
        }  
        return text;  
    }  
          
         
    public static String readPdf(String path) {
             File pdfFile=new File(path);
             PDDocument document = null;
             String content = "";
            try
            {
                document=PDDocument.load(pdfFile);
                int pages = document.getNumberOfPages();
                // 读文本内容
                PDFTextStripper stripper=new PDFTextStripper();
                // 设置按顺序输出
                stripper.setSortByPosition(true);
                stripper.setStartPage(1);
                stripper.setEndPage(pages);
                content = stripper.getText(document);
                System.out.println(content);     
            }
            catch(Exception e)
            {
                System.out.println(e);
            }
            return content; 
     }
                

     public static String getTextFromPPT(String filePath) {  
            InputStream is = null;  
            PowerPointExtractor extractor = null;  
            String text="";  
            try {  
                is = new FileInputStream(filePath);  
                extractor = new PowerPointExtractor(is);  
                text=extractor.getText();  
                extractor.close();  
            } catch (FileNotFoundException e) {  
                System.out.println("没有找到指定路径"+filePath);  
                e.printStackTrace();  
            } catch (IOException e) {  
                System.out.println("getTextFromPPT IO错误");  
                e.printStackTrace();  
            }  
            return text;  
        }  
        //抽取幻灯片2007+全部内容  pptx  
        public static String getTextFromPPT2007(String filePath){  
            InputStream is = null;  
            XMLSlideShow slide = null;  
            String text="";  
            try {  
                is = new FileInputStream(filePath);  
                slide = new XMLSlideShow(is);  
                XSLFPowerPointExtractor extractor=new XSLFPowerPointExtractor(slide);  
                text=extractor.getText();  
                extractor.close();  
            } catch (FileNotFoundException e) {  
                System.out.println("没有找到指定路径"+filePath);  
                e.printStackTrace();  
            } catch (IOException e) {  
                System.out.println("getTextFromPPT2007 IO错误");  
                e.printStackTrace();  
            }  
            return text;  
        }  
                

    /**
     * 获取文件格式
     * @param path
     * @return
     */
    public static String getFileEncode(String path) {
          String charset ="asci";
        byte[] first3Bytes = new byte[3];
        BufferedInputStream bis = null;
        try {
            boolean checked = false;
            bis = new BufferedInputStream(new FileInputStream(path));
            bis.mark(0);
            int read = bis.read(first3Bytes, 0, 3);
            if (read == -1)
                return charset;
            if (first3Bytes[0] == (byte) 0xFF && first3Bytes[1] == (byte) 0xFE) {
                charset = "Unicode";//UTF-16LE
                checked = true;
            } else if (first3Bytes[0] == (byte) 0xFE && first3Bytes[1] == (byte) 0xFF) {
                charset = "Unicode";//UTF-16BE
                checked = true;
            } else if (first3Bytes[0] == (byte) 0xEF && first3Bytes[1] == (byte) 0xBB && first3Bytes[2] == (byte) 0xBF) {
                charset = "UTF8";
                checked = true;
            }
            bis.reset();
            if (!checked) {
                int len = 0;
                int loc = 0;
                while ((read = bis.read()) != -1) {
                    loc++;
                    if (read >= 0xF0)
                        break;
                    if (0x80 <= read && read <= 0xBF) //单独出现BF以下的，也算是GBK
                        break;
                    if (0xC0 <= read && read <= 0xDF) {
                        read = bis.read();
                        if (0x80 <= read && read <= 0xBF) 
                        //双字节 (0xC0 - 0xDF) (0x80 - 0xBF),也可能在GB编码内
                            continue;
                        else
                            break;
                    } else if (0xE0 <= read && read <= 0xEF) { //也有可能出错，但是几率较小
                        read = bis.read();
                        if (0x80 <= read && read <= 0xBF) {
                            read = bis.read();
                            if (0x80 <= read && read <= 0xBF) {
                                charset = "UTF-8";
                                break;
                            } else
                                break;
                        } else
                            break;
                    }
                }
                //TextLogger.getLogger().info(loc + " " + Integer.toHexString(read));
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (bis != null) {
                try {
                    bis.close();
                } catch (IOException ex) {
                }
            }
        }
        return charset;
      }
                  
      /**
       * 通过路径获取文件的内容，这个方法因为用到了字符串作为载体，为了正确读取文件（不乱码），只能读取文本文件，安全方法
       * @param path
       * @return   txt
       */
      public static String readFile(String path){
          String data = null;
          // 判断文件是否存在
          File file = new File(path);
          if(!file.exists()){
              return data;
          }
          // 获取文件编码格式
          String code = getFileEncode(path);
          InputStreamReader isr = null;
          try{
              // 根据编码格式解析文件
              if("asci".equals(code)){
                  // 这里采用GBK编码，而不用环境编码格式，因为环境默认编码不等于操作系统编码 
                  // code = System.getProperty("file.encoding");
                  code = "GBK";
              }
              isr = new InputStreamReader(new FileInputStream(file),code);
              // 读取文件内容
              int length = -1 ;
              char[] buffer = new char[1024];
              StringBuffer sb = new StringBuffer();
              while((length = isr.read(buffer, 0, 1024) ) != -1){
                  sb.append(buffer,0,length);
              }
              data = new String(sb);
          }catch(Exception e){
              e.printStackTrace();
          }finally{
              try {
                  if(isr != null){
                      isr.close();
                  }
              } catch (IOException e) {
                  e.printStackTrace();
              }
          }
          return data;
      }
    
}