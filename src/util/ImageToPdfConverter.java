package util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import com.DocSystem.common.Log;  

public class ImageToPdfConverter {  
    
    public static void convertImagesToPdf(String[] imagePaths, String outputPath) throws Exception {  
        try (PDDocument document = new PDDocument()) {  
            for (String imagePath : imagePaths) {  
                // 创建PDF页面（A4尺寸）  
                PDPage page = new PDPage(PDRectangle.A4);  
                document.addPage(page);  
                
                // 加载图片并调整尺寸  
                PDImageXObject pdImage = PDImageXObject.createFromFile(imagePath, document);  
                float pageWidth = PDRectangle.A4.getWidth();  
                float pageHeight = PDRectangle.A4.getHeight();  
                float scaleRatio = Math.min(  
                    pageWidth / pdImage.getWidth(),  
                    pageHeight / pdImage.getHeight()  
                );  
                
                // 绘制图片到PDF页面  
                try (PDPageContentStream contents = new PDPageContentStream(document, page)) {  
                    contents.drawImage(pdImage, 0, 0,   
                        pdImage.getWidth() * scaleRatio,   
                        pdImage.getHeight() * scaleRatio  
                    );  
                }  
            }  
            // 保存PDF文件  
            document.save(outputPath);  
        }  
    } 
    
    public static void main(String[] args) {  
        String[] images = {  
            "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/2025-01-08 动物纸/1壁虎2.jpeg",  
            "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/海报-蛇年.jpeg",  
            "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/2025-02-21动物纸/确定的/0e6783867532b2.png"  
        };  
        
        try {  
            ImageToPdfConverter.convertImagesToPdf(images, "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/images.pdf");  
            Log.debug("PDF生成成功");  
        } catch (Exception e) {  
            Log.debug("生成失败: " + e.getMessage());  
            Log.debug(e);  
        }  
    }  
}  