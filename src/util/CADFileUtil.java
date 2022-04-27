package util;

import com.DocSystem.common.Log;
import com.aspose.cad.Color;
import com.aspose.cad.Image;
import com.aspose.cad.imageoptions.CadRasterizationOptions;
import com.aspose.cad.imageoptions.JpegOptions;
import com.aspose.cad.imageoptions.PdfOptions;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;

/**
 * @Description:CAD文件工具类
 * @Author: Tarzan Liu
 * @Date: 2020/1/8 14:23
 */
public class CADFileUtil{

    /**
     * 当前cad预览运行状态（保证cad预览线程，同步只有一个人操作）
     */
    public static volatile  boolean RUNNING = false;

    /**
     *方法描述  CAD文件转换为PDF流
     * @param srcFile 选择CAD文件路径
     * @param dataDir 保存pdf文件路径
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
 /*   public static void CADFileToPDF(String srcFile,String dstFile){
        Image objImage = Image.load(srcFile);
        CadRasterizationOptions cadRasterizationOptions = new CadRasterizationOptions();
        cadRasterizationOptions.setBackgroundColor(Color.getWhite());
        cadRasterizationOptions.setPageWidth(1600);
        cadRasterizationOptions.setPageHeight(1600);
        PdfOptions pdfOptions = new PdfOptions();
        pdfOptions.setVectorRasterizationOptions(cadRasterizationOptions);
        objImage.save(dstFile, pdfOptions);
    }*/


    /**
     *方法描述  CAD文件转换为PDF流
     * @param srcFile 选择CAD文件路径
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
    public static boolean CADFileToPDF(String srcFile, String dstFile){
    	boolean ret = false;
    	try {
	        CadRasterizationOptions cadRasterizationOptions = new CadRasterizationOptions();
	        cadRasterizationOptions.setBackgroundColor(Color.getWhite());
	        cadRasterizationOptions.setPageWidth(1600);
	        cadRasterizationOptions.setPageHeight(1600);
	        PdfOptions pdfOptions = new PdfOptions();
	        pdfOptions.setVectorRasterizationOptions(cadRasterizationOptions);
	        Image objImage = Image.load(srcFile);
	        objImage.save(dstFile, pdfOptions);
	        ret = true;
    	} catch(Exception e) {
    		Log.error(e);
    	}
    	return ret;
    }

    /**
     *方法描述  CAD文件转换为PDF流
     * @param srcFile 选择CAD文件路径
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
    public static void CADFileToImage(String srcFile, String dstFile){
        CadRasterizationOptions cadRasterizationOptions = new CadRasterizationOptions();
        cadRasterizationOptions.setBackgroundColor(Color.getWhite());
        cadRasterizationOptions.setPageWidth(1600);
        cadRasterizationOptions.setPageHeight(1600);
        JpegOptions jpegOptions = new JpegOptions();
        jpegOptions.setVectorRasterizationOptions(cadRasterizationOptions);
        Image objImage = Image.load(srcFile);
        objImage.save(dstFile, jpegOptions);
    }
    /**
     * 方法描述  CAD文件转换为PDF流
     * @param inputStream 选择CAD文件流
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
    public static  InputStream CADFileToPDF(InputStream inputStream) throws Exception {
        RUNNING = true;
        Image image = Image.load(inputStream);
        CadRasterizationOptions cadRasterizationOptions = new CadRasterizationOptions();
        cadRasterizationOptions.setBackgroundColor(Color.getWhite());
        cadRasterizationOptions.setPageWidth(1600);
        cadRasterizationOptions.setPageHeight(1600);
        PdfOptions pdfOptions = new PdfOptions();
        pdfOptions.setVectorRasterizationOptions(cadRasterizationOptions);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        image.save(out,pdfOptions);
        return  outputStreamConvertInputStream(out);
    }


    /**
     * 方法描述  CAD文件转换为PDF(处理网络文件)
     *
     * @param netFileUrl 网络文件路径
     * @return InputStream 转换后文件输入流
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
    public static InputStream convertNetFile(String netFileUrl) throws Exception {
        // 创建URL
        URL url = new URL(netFileUrl);
        // 试图连接并取得返回状态码
        URLConnection urlConnection = url.openConnection();
        urlConnection.connect();
        HttpURLConnection httpURLConnection = (HttpURLConnection) urlConnection;
        int httpResult = httpURLConnection.getResponseCode();
        if (httpResult == HttpURLConnection.HTTP_OK) {
            return httpURLConnection.getInputStream();
        }
        return null;
    }


    /**
     * 方法描述 outputStream转inputStream
     * @param out
     * @author Tarzan Liu
     * @date 2020年01月08日 15:08:50
     */
    public static ByteArrayInputStream outputStreamConvertInputStream(final OutputStream out) throws Exception {
        ByteArrayOutputStream byteOut=(ByteArrayOutputStream) out;
        return new ByteArrayInputStream(byteOut.toByteArray());
    }


    public static void main(String[] args) {
        String srcFile="C:/MxsdocTestDir/测试.dwg";
        String dstFile="C:/MxsdocTestDir/测试.pdf";
        long a= System.currentTimeMillis();
        CADFileToPDF(srcFile, dstFile);
       // CADFileToImage(srcFile);
        long b=System.currentTimeMillis();
        System.out.println(b-a);
    }
}