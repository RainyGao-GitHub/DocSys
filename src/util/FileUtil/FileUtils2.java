package util.FileUtil;
import java.io.*;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.apache.poi.poifs.filesystem.FileMagic;

import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;

/**
 * 文件类型与文件编码获取
 * 
 * @author Rainy Gao
 * @date 2018-11-16
 */
public class FileUtils2 {

	//HashMap to store fileType
	public final static Map<String, String> FILE_TYPE_MAP = new HashMap<String, String>();     
    
    private FileUtils2(){}     
    static{     
        getAllFileType(); //初始化文件类型信息     
    }     
         
    /**   
     * Discription:[getAllFileType,常见文件头信息] 
     */     
    private static void getAllFileType()     
    {     
        FILE_TYPE_MAP.put("ffd8ffe000104a464946", "jpg"); //JPEG (jpg)     
        FILE_TYPE_MAP.put("89504e470d0a1a0a0000", "png"); //PNG (png)     
        FILE_TYPE_MAP.put("47494638396126026f01", "gif"); //GIF (gif)     
        FILE_TYPE_MAP.put("49492a00227105008037", "tif"); //TIFF (tif)     
        FILE_TYPE_MAP.put("424d228c010000000000", "bmp"); //16色位图(bmp)     
        FILE_TYPE_MAP.put("424d8240090000000000", "bmp"); //24位位图(bmp)     
        FILE_TYPE_MAP.put("424d8e1b030000000000", "bmp"); //256色位图(bmp)     
        FILE_TYPE_MAP.put("41433130313500000000", "dwg"); //CAD (dwg)     
        FILE_TYPE_MAP.put("3c21444f435459504520", "html"); //HTML (html)
        FILE_TYPE_MAP.put("3c21646f637479706520", "htm"); //HTM (htm)
        FILE_TYPE_MAP.put("48544d4c207b0d0a0942", "css"); //css
        FILE_TYPE_MAP.put("696b2e71623d696b2e71", "js"); //js
        FILE_TYPE_MAP.put("7b5c727466315c616e73", "rtf"); //Rich Text Format (rtf)     
        FILE_TYPE_MAP.put("38425053000100000000", "psd"); //Photoshop (psd)     
        FILE_TYPE_MAP.put("46726f6d3a203d3f6762", "eml"); //Email [Outlook Express 6] (eml)       
        FILE_TYPE_MAP.put("d0cf11e0a1b11ae10000", "doc"); //MS Excel 注意：word、msi 和 excel的文件头一样    
        FILE_TYPE_MAP.put("504b0304140006000800", "doc"); //MS Excel 注意：word、msi 和 excel的文件头一样    
        FILE_TYPE_MAP.put("d0cf11e0a1b11ae10000", "vsd"); //Visio 绘图     
        FILE_TYPE_MAP.put("5374616E64617264204A", "mdb"); //MS Access (mdb)      
        FILE_TYPE_MAP.put("252150532D41646F6265", "ps");     
        FILE_TYPE_MAP.put("255044462d312e350d0a", "pdf"); //Adobe Acrobat (pdf)
        FILE_TYPE_MAP.put("255044462d312e340a25", "pdf"); 
        FILE_TYPE_MAP.put("2e524d46000000120001", "rmvb"); //rmvb/rm相同  
        FILE_TYPE_MAP.put("464c5601050000000900", "flv"); //flv与f4v相同  
        FILE_TYPE_MAP.put("00000020667479706d70", "mp4"); 
        FILE_TYPE_MAP.put("49443303000000002176", "mp3"); 
        FILE_TYPE_MAP.put("000001ba210001000180", "mpg"); //     
        FILE_TYPE_MAP.put("3026b2758e66cf11a6d9", "wmv"); //wmv与asf相同    
        FILE_TYPE_MAP.put("52494646e27807005741", "wav"); //Wave (wav)  
        FILE_TYPE_MAP.put("52494646d07d60074156", "avi");  
        FILE_TYPE_MAP.put("4d546864000000060001", "mid"); //MIDI (mid)   
        FILE_TYPE_MAP.put("504b0304140000000800", "zip");    
        FILE_TYPE_MAP.put("526172211a0700cf9073", "rar");   
        FILE_TYPE_MAP.put("235468697320636f6e66", "ini");   
        FILE_TYPE_MAP.put("504b03040a0000000000", "jar"); 
        FILE_TYPE_MAP.put("4d5a9000030000000400", "exe");//可执行文件
        FILE_TYPE_MAP.put("3c25402070616765206c", "jsp");//jsp文件
        FILE_TYPE_MAP.put("4d616e69666573742d56", "mf");//MF文件
        FILE_TYPE_MAP.put("3c3f786d6c2076657273", "xml");//xml文件
        FILE_TYPE_MAP.put("494e5345525420494e54", "sql");//xml文件
        FILE_TYPE_MAP.put("7061636b616765207765", "java");//java文件
        FILE_TYPE_MAP.put("406563686f206f66660d", "bat");//bat文件
        FILE_TYPE_MAP.put("1f8b0800000000000000", "gz");//gz文件
        FILE_TYPE_MAP.put("6c6f67346a2e726f6f74", "properties");//bat文件
        FILE_TYPE_MAP.put("cafebabe0000002e0041", "class");//bat文件
        FILE_TYPE_MAP.put("49545346030000006000", "chm");//bat文件
        FILE_TYPE_MAP.put("04000000010000001300", "mxp");//bat文件
        FILE_TYPE_MAP.put("504b0304140006000800", "docx");//docx文件
        FILE_TYPE_MAP.put("d0cf11e0a1b11ae10000", "wps");//WPS文字wps、表格et、演示dps都是一样的
        FILE_TYPE_MAP.put("6431303a637265617465", "torrent");
        FILE_TYPE_MAP.put("6D6F6F76", "mov"); //Quicktime (mov)  
        FILE_TYPE_MAP.put("FF575043", "wpd"); //WordPerfect (wpd)   
        FILE_TYPE_MAP.put("CFAD12FEC5FD746F", "dbx"); //Outlook Express (dbx)     
        FILE_TYPE_MAP.put("2142444E", "pst"); //Outlook (pst)      
        FILE_TYPE_MAP.put("AC9EBD8F", "qdf"); //Quicken (qdf)     
        FILE_TYPE_MAP.put("E3828596", "pwl"); //Windows Password (pwl)         
        FILE_TYPE_MAP.put("2E7261FD", "ram"); //Real Audio (ram)     
    }                       
    
    /**
     * 得到上传文件的文件头
     * @param src
     * @return
     */
    public static String bytesToHexString(byte[] src) {
        StringBuilder stringBuilder = new StringBuilder();
        if (src == null || src.length <= 0) {
            return null;
        }
        for (int i = 0; i < src.length; i++) {
            int v = src[i] & 0xFF;
            String hv = Integer.toHexString(v);
            if (hv.length() < 2) {
                stringBuilder.append(0);
            }
            stringBuilder.append(hv);
        }
        return stringBuilder.toString();
    }
    
    /**
     * 根据制定文件的文件头判断其文件类型
     * @param filePaht
     * @return
     */
    public static String getFileType(String filePaht){
        String res = null;
        try {
            FileInputStream is = new FileInputStream(filePaht);
            byte[] b = new byte[10];
            is.read(b, 0, b.length);
            is.close();
            
            String fileCode = bytesToHexString(b);    
            System.out.println(fileCode);
            
            
            //这种方法在字典的头代码不够位数的时候可以用但是速度相对慢一点
            Iterator<String> keyIter = FILE_TYPE_MAP.keySet().iterator();
            while(keyIter.hasNext()){
                String key = keyIter.next();
                if(key.toLowerCase().startsWith(fileCode.toLowerCase()) || fileCode.toLowerCase().startsWith(key.toLowerCase())){
                    res = FILE_TYPE_MAP.get(key);
                    break;
                }
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("getFileType() " + res);
        return res;
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
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
        //System.out.println("getFileEncode() " + charsetName);
        return charsetName;
    }
    
    public static FileMagic getFileMagic(String filePath) throws Exception {
    	InputStream istream = new FileInputStream(filePath);
    	InputStream is = FileMagic.prepareToCheckMagic(istream);
    	FileMagic fm = FileMagic.valueOf(is);
    	is.close();
    	istream.close();
    	System.out.println("getFileMagic() " + fm.toString());
    	return fm;
    }
    
	public static boolean isBinaryFile(String code) {
		//System.out.println("isBinaryFile:" + code);
		if(code == null)
		{
			return true;
		}
		
		switch(code)
		{
		case "GBK":
		case "GB2312":
		case "UTF-8":
		case "UTF-16":
		case "Unicode":
		case "US-ASCII":
			return false;
		}
		return true;
	}

	public static boolean isPdf(String code) {
		switch(code)
		{
		case "Shift_JIS":
		case "GB18030":
			return true;
		}
		return false;
	}
    
    public static void main(String[] args) throws Exception {
        
        String type = getFileType("C:\\Users\\ragao\\Desktop\\LinFeng\\timg (2).jpg");
        System.out.println("type: "+type);
        System.out.println();         
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\ddddddddddd.docx");
        System.out.println("type: "+type);
      
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\基本数据结构：链表（list） - CSDN博客.html");
        System.out.println("type: "+type);
      
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\新建文本文档.txt");
        System.out.println("type: "+type);
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\unordered_map.jpg");
        System.out.println("type: "+type);
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\timg.jpg");
        System.out.println("type: "+type);
      
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\Debate.pptx");
        System.out.println("type: "+type);
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\poi-bin-4.0.0-20180907.zip");
        System.out.println("type: "+type);
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\TTI_trace_Analyzer.xlsb");
        System.out.println("type: "+type);
        
        type = getFileType("C:\\Users\\Administrator\\Desktop\\HashMap\\TtiTraceFilter.exe");
        System.out.println("type: "+type);
        
        String code = getFileEncode("C:\\Users\\ragao\\Desktop\\LinFeng\\新建 OpenDocument 文本.odt");
        System.out.println("code: "+code);
        System.out.println();             
    }
}