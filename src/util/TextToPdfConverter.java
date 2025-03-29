package util;

import org.apache.pdfbox.pdmodel.PDDocument;  
import org.apache.pdfbox.pdmodel.PDPage;  
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

import com.DocSystem.common.Log;

import java.io.*;

public class TextToPdfConverter {  
    
    private static final float MARGIN = 40;  
    private static final float LINE_HEIGHT = 20;  // 增大行高适应中文  
    private static final float FONT_SIZE = 14;  
    
    // 使用支持中文的字体文件路径  
    private static final String FONT_PATH = "C:/Windows/Fonts/simfang.ttf";  

    public static void convertTextToPdf(String inputPath, String outputPath) throws IOException {  
        try (PDDocument document = new PDDocument()) {  
            // 加载中文字体  
            PDType0Font font = PDType0Font.load(document, new File(FONT_PATH));  
            
            PDPage currentPage = new PDPage();  
            document.addPage(currentPage);  
            PDPageContentStream contentStream = null;  
            
            try (BufferedReader reader = new BufferedReader(  
                    new InputStreamReader(  
                        new FileInputStream(inputPath), "UTF-8"))) {  // 明确指定编码  
                
                contentStream = new PDPageContentStream(document, currentPage);  
                contentStream.setFont(font, FONT_SIZE);  
                float y = currentPage.getMediaBox().getHeight() - MARGIN;  

                String line;  
                while ((line = reader.readLine()) != null) {  
                    // 处理换行和分页  
                    if (y < MARGIN) {  
                        contentStream.close();  
                        currentPage = new PDPage();  
                        document.addPage(currentPage);  
                        contentStream = new PDPageContentStream(document, currentPage);  
                        contentStream.setFont(font, FONT_SIZE);  
                        y = currentPage.getMediaBox().getHeight() - MARGIN;  
                    }  
                    
                    // 写入文本  
                    contentStream.beginText();  
                    contentStream.newLineAtOffset(MARGIN, y);  
                    contentStream.showText(line);  
                    contentStream.endText();  
                    
                    y -= LINE_HEIGHT;  
                }  
            } finally {  
                if (contentStream != null) {  
                    contentStream.close();  
                }  
            }  
            document.save(outputPath);  
        }  
    }
    
    public static void main(String[] args) {  
        try {  
            TextToPdfConverter.convertTextToPdf("C:/N-20N3PF2E7EB0-Data/ragao/Desktop/input.txt", "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/text.pdf");  
            Log.debug("PDF生成成功");  
        } catch (IOException e) {  
        	Log.debug("转换失败: " + e.getMessage());  
        	Log.debug(e);  
        }  
    }  
}  