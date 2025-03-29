package util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import com.DocSystem.common.Log;  

public class ImageToPdfConverter {  
    
    private static final float BORDER_MM = 5; // 5毫米边距  
    private static final float MM_TO_UNITS = 72 / 25.4f; // PDF单位转换系数  

    public static void convertImagesToPdf(String[] imagePaths, String outputPath) throws Exception {  
        try (PDDocument document = new PDDocument()) {  
            float borderUnits = BORDER_MM * MM_TO_UNITS;  
            
            for (String imagePath : imagePaths) {  
                PDImageXObject pdImage = PDImageXObject.createFromFile(imagePath, document);  
                
                // 智能判断页面方向  
                PDRectangle pageSize = calculatePageSize(pdImage.getWidth(), pdImage.getHeight());  
                PDPage page = new PDPage(pageSize);  
                document.addPage(page);  
                
                // 计算最佳缩放比例  
                float[] scaling = calculateScaling(  
                    pdImage.getWidth(),   
                    pdImage.getHeight(),  
                    pageSize.getWidth() - borderUnits*2,  
                    pageSize.getHeight() - borderUnits*2  
                );  
                
                // 计算居中位置  
                float x = (pageSize.getWidth() - scaling[0]) / 2;  
                float y = (pageSize.getHeight() - scaling[1]) / 2;  
                
                try (PDPageContentStream contents = new PDPageContentStream(document, page)) {  
                    contents.drawImage(pdImage, x, y, scaling[0], scaling[1]);  
                }  
            }  
            document.save(outputPath);  
        }  
    }  

    // 智能计算页面方向  
    private static PDRectangle calculatePageSize(float imgWidth, float imgHeight) {  
        float aspectRatio = imgWidth / imgHeight;  
        PDRectangle baseSize = PDRectangle.A4;  
        
        // 当图片宽高比与A4相反时旋转页面  
        boolean shouldRotate = (aspectRatio > 1 && baseSize.getWidth() < baseSize.getHeight()) ||  
                              (aspectRatio < 1 && baseSize.getWidth() > baseSize.getHeight());  
        
        return shouldRotate ? baseSize.rotate() : baseSize;  
    }  

    // 精确计算缩放尺寸  
    private static float[] calculateScaling(float imgW, float imgH, float maxW, float maxH) {  
        float widthRatio = maxW / imgW;  
        float heightRatio = maxH / imgH;  
        float ratio = Math.min(widthRatio, heightRatio);  
        
        return new float[] {  
            imgW * ratio,  
            imgH * ratio  
        };  
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