package util;

import org.apache.pdfbox.pdmodel.PDDocument;  
import org.apache.pdfbox.pdmodel.PDPage;  
import org.apache.pdfbox.pdmodel.PDPageContentStream;  
import org.apache.pdfbox.pdmodel.font.PDType1Font;  

import java.io.BufferedReader;  
import java.io.File;  
import java.io.FileReader;  
import java.io.IOException;  

public class TextToPdfConverter {  
    
    private static final float MARGIN = 40;  // 页边距  
    private static final float LINE_HEIGHT = 15;  // 行高  
    private static final PDType1Font FONT = PDType1Font.HELVETICA;  
    private static final float FONT_SIZE = 12;  

    public static void convertTextToPdf(String inputPath, String outputPath) throws IOException {  
        try (PDDocument document = new PDDocument()) {  
            PDPage page = new PDPage();  
            document.addPage(page);  
            
            try (BufferedReader reader = new BufferedReader(new FileReader(inputPath));  
                 PDPageContentStream contentStream = new PDPageContentStream(document, page)) {  
                
                contentStream.setFont(FONT, FONT_SIZE);  
                float y = page.getMediaBox().getHeight() - MARGIN;  // 起始Y坐标  
                
                String line;  
                while ((line = reader.readLine()) != null) {  
                    // 处理换行和分页  
                    if (y < MARGIN) {  
                        contentStream.close();  
                        page = new PDPage();  
                        document.addPage(page);  
                        contentStream = new PDPageContentStream(document, page);  
                        contentStream.setFont(FONT, FONT_SIZE);  
                        y = page.getMediaBox().getHeight() - MARGIN;  
                    }  
                    
                    contentStream.beginText();  
                    contentStream.newLineAtOffset(MARGIN, y);  
                    contentStream.showText(line);  
                    contentStream.endText();  
                    
                    y -= LINE_HEIGHT;  
                }  
            }  
            document.save(outputPath);  
        }  
    }  
}  