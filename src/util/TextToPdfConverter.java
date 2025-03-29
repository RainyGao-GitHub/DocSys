package util;

import org.apache.pdfbox.pdmodel.PDDocument;  
import org.apache.pdfbox.pdmodel.PDPage;  
import org.apache.pdfbox.pdmodel.PDPageContentStream;  
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import com.DocSystem.common.Log;

import java.io.BufferedReader;
import java.io.FileReader;  
import java.io.IOException;  

public class TextToPdfConverter {  
    
    private static final float MARGIN = 40;  
    private static final float LINE_HEIGHT = 15;  
    private static final PDType1Font FONT = PDType1Font.HELVETICA;  
    private static final float FONT_SIZE = 12;  

    public static void convertTextToPdf(String inputPath, String outputPath) throws IOException {  
        try (PDDocument document = new PDDocument()) {  
            PDPage currentPage = createNewPage(document);  
            PDPageContentStream contentStream = null;  
            
            try (BufferedReader reader = new BufferedReader(new FileReader(inputPath))) {  
                contentStream = new PDPageContentStream(document, currentPage);  
                contentStream.setFont(FONT, FONT_SIZE);  
                float y = currentPage.getMediaBox().getHeight() - MARGIN;  

                String line;  
                while ((line = reader.readLine()) != null) {  
                    if (y < MARGIN) {  
                        contentStream.close();  
                        currentPage = createNewPage(document);  
                        contentStream = new PDPageContentStream(document, currentPage);  
                        contentStream.setFont(FONT, FONT_SIZE);  
                        y = currentPage.getMediaBox().getHeight() - MARGIN;  
                    }  

                    contentStream.beginText();  
                    contentStream.newLineAtOffset(MARGIN, y);  
                    contentStream.showText(line);  
                    contentStream.endText();  
                    
                    y -= LINE_HEIGHT;  
                }  
            } finally {  
                if (contentStream != null) {  
                    try {  
                        contentStream.close();  
                    } catch (IOException e) {  
                        System.err.println("流关闭异常: " + e.getMessage());  
                    }  
                }  
            }  
            document.save(outputPath);  
        }  
    }  

    private static PDPage createNewPage(PDDocument doc) {  
        PDPage page = new PDPage();  
        doc.addPage(page);  
        return page;  
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