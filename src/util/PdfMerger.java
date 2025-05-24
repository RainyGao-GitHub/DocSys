package util;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.pdfbox.multipdf.PDFMergerUtility;  
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;

import com.DocSystem.common.Log;  

public class PdfMerger {  

    // 核心合并方法  
    public static void mergePdfFiles(List<String> inputPaths, String outputPath) throws Exception {  
		Log.debug("mergePdfFiles() outputPath:" + outputPath);

    	PDFMergerUtility merger = new PDFMergerUtility();          
        try {  
            // 添加需要合并的文件  
            for (String path : inputPaths) 
            {
				Log.debug("mergePdfFiles() path:" + path);
                try (PDDocument doc = PDDocument.load(new File(path))) {  
                    merger.addSource(new File(path));  
                }  
            }  
            
            // 设置输出路径并执行合并  
            merger.setDestinationFileName(outputPath);  
            merger.mergeDocuments(null); // 使用null保持默认内存管理  
            
        } catch (InvalidPasswordException e) {  
            throw new IOException("加密文档无法合并: " + e.getMessage());  
        }  
    }  
    
    public static void main(String[] args) throws Exception {  
        List<String> files = new ArrayList<String>(
        		Arrays.asList(  
        				"C:/N-20N3PF2E7EB0-Data/ragao/Desktop/images.pdf",  
        				"C:/N-20N3PF2E7EB0-Data/ragao/Desktop/text.pdf"  
        				));  
        
        try {  
            PdfMerger.mergePdfFiles(files, "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/merged.pdf");  
            System.out.println("PDF合并成功");  
        } catch (IOException e) {  
            System.err.println("合并失败: " + e.getMessage());  
        }  
    }
}  