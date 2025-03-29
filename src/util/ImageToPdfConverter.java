package util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import com.DocSystem.common.Log;  

public class ImageToPdfConverter {  
    
    private static final float BORDER_MM = 5;  
    private static final float MM_TO_UNITS = 72 / 25.4f;  

    public static void convertImagesToPdf(String[] imagePaths, String outputPath) throws Exception {  
        try (PDDocument document = new PDDocument()) {  
            float borderUnits = BORDER_MM * MM_TO_UNITS;  
            
            for (String imagePath : imagePaths) {  
                PDImageXObject pdImage = PDImageXObject.createFromFile(imagePath, document);  
                
                // 手动实现旋转逻辑  
                PDRectangle pageSize = calculatePageSize(  
                    pdImage.getWidth(),  
                    pdImage.getHeight()  
                );  
                
                PDPage page = new PDPage(pageSize);  
                document.addPage(page);  
                
                // 计算缩放参数  
                float[] scaling = calculateScaling(  
                    pdImage.getWidth(),  
                    pdImage.getHeight(),  
                    pageSize.getWidth() - borderUnits*2,  
                    pageSize.getHeight() - borderUnits*2  
                );  
                
                // 计算居中坐标  
                float x = (pageSize.getWidth() - scaling[0]) / 2;  
                float y = (pageSize.getHeight() - scaling[1]) / 2;  
                
                try (PDPageContentStream contents = new PDPageContentStream(document, page)) {  
                    contents.drawImage(pdImage, x, y, scaling[0], scaling[1]);  
                }  
            }  
            document.save(outputPath);  
        }  
    }  

    // 手动实现方向判断  
    private static PDRectangle calculatePageSize(float imgWidth, float imgHeight) {  
        PDRectangle baseSize = PDRectangle.A4;  
        float pageRatio = baseSize.getWidth() / baseSize.getHeight();  
        float imageRatio = imgWidth / imgHeight;  
        
        // 当图片方向与页面方向不一致时旋转  
        return (imageRatio > 1) != (pageRatio > 1) ?   
            new PDRectangle(baseSize.getHeight(), baseSize.getWidth()) : // 手动旋转  
            baseSize;  
    }  

    // 保持原有缩放算法  
    private static float[] calculateScaling(float imgW, float imgH, float maxW, float maxH) {  
        float ratio = Math.min(maxW/imgW, maxH/imgH);  
        return new float[]{imgW * ratio, imgH * ratio};  
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