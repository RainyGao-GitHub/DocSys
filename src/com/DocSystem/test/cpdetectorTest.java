package com.DocSystem.test;
import java.io.File;
import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;

class cpdetectorTest  
{  
    public static void main(String[] args)    
    {  
        String FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\startup_log_TB_2309_1_.log.check\\startup_log_TB_2309_1_.log.check");
        System.out.println("FileEncode:" + FileEncode);
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\9.1-9.30.pdf");
        System.out.println("FileEncode:" + FileEncode);
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\DocSys仓库详情页面布局需求.docx");
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\URLProtocol.html");       
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\技术入股协议书.doc");       
        System.out.println("FileEncode:" + FileEncode); 
        FileEncode = getFileEncode("C:\\Users\\ragao\\Desktop\\Rainy\\Print\\0921\\1105698019.jpg");       
        System.out.println("FileEncode:" + FileEncode); 
        
    }
    
    public static String getFileEncode(String filePath) {
        String charsetName = null;
        try {
            File file = new File(filePath);
            CodepageDetectorProxy detector = CodepageDetectorProxy.getInstance();
            detector.add(new ParsingDetector(false));
            detector.add(JChardetFacade.getInstance());
            detector.add(ASCIIDetector.getInstance());
            detector.add(UnicodeDetector.getInstance());
            java.nio.charset.Charset charset = null;
            charset = detector.detectCodepage(file.toURI().toURL());
            if (charset != null) {
                charsetName = charset.name();
            } else {
                charsetName = "UTF-8";
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
        return charsetName;
    }
}