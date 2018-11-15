package util.DocConvertUtil;



import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.regex.Pattern;

import org.artofsolving.jodconverter.OfficeDocumentConverter;
import org.artofsolving.jodconverter.office.DefaultOfficeManagerConfiguration;
import org.artofsolving.jodconverter.office.OfficeManager;

import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;
import util.ReadProperties;

/**
 * 这是一个工具类，主要是为了使Office2003-2007全部格式的文档(.doc|.docx|.xls|.xlsx|.ppt|.pptx)
 * 转化为pdf文件<br>
 * Office2010的没测试<br>
 * 
 * @date 2017-03-03
 * @author jjc
 * 
 */
public class Office2PDF {
    /**
     * 使Office2003-2007全部格式的文档(.doc|.docx|.xls|.xlsx|.ppt|.pptx) 转化为pdf文件<br>
     * 
     * @param inputFilePath
     *            源文件路径，如："e:/test.docx"
     * @return
     */
    public static File openOfficeToPDF(String inputFilePath,String outputFilePath) {
    	 String code = getFileEncode(inputFilePath);
    	 System.out.println("openOfficeToPDF:" + code);
    	 if(isPdf(code) == true)
    	 { 
    		 copyFile(inputFilePath, outputFilePath);   
    		 File dstFile=new File(outputFilePath);
    		 return dstFile;
    	 }
    	 
    	 if(isBinaryFile(code) == true)
    	 {
    		 return null;
    	 }
    	 
    	 return office2pdf(inputFilePath,outputFilePath);
    }
    
	private static boolean isBinaryFile(String code) {
		System.out.println("isBinaryFile:" + code);
		if(code == null)
		{
			return true;
		}
		
		switch(code)
		{
		case "GBK":
		case "UTF-8":
		case "UTF-16":
		case "Unicode":
			return false;
		}
		return true;
	}

	private static boolean isPdf(String code) {
		switch(code)
		{
		case "Shift_JIS":
		case "GB18030":
			return true;
		}
		return false;
	}

	public static boolean copyFile(String srcFilePath,String dstFilePath){
        try {
			//Copy by Channel
	        FileInputStream in=new FileInputStream(srcFilePath);
	        FileOutputStream out=new FileOutputStream(dstFilePath);
	        FileChannel inputChannel = in.getChannel();    
	        FileChannel outputChannel = out.getChannel();   

	        outputChannel.transferFrom(inputChannel, 0, inputChannel.size());
		   	inputChannel.close();
		    outputChannel.close();
		    in.close();	
			out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
        return true;
    }
    
	/**
	 * 获取文件编码格式
	 * @param filePath
	 * @return UTF-8/Unicode/UTF-16BE/GBK
	 * @throws Exception
	 */
	public static String getFileEncode(String filePath){
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
        return charsetName;
	}
	
	

    /**
     * 根据操作系统的名称，获取OpenOffice.org 3的安装目录<br>
     * 如我的OpenOffice.org 3安装在：C:/Program Files (x86)/OpenOffice.org 3<br>
     * 
     * @return OpenOffice.org 3的安装目录
     */
    public static String getOfficeHome() {
    	//get OpenOffice Home From Config File
    	String officeHome = null;
        String osName = System.getProperty("os.name");
        System.out.println("操作系统名称:" + osName);
        
        if (Pattern.matches("Linux.*", osName)) 
        {
        	officeHome = ReadProperties.read("docSysConfig.properties", "openOfficePathForLinux");
        } 
        else if (Pattern.matches("Windows.*", osName)) 
        {
        	officeHome = ReadProperties.read("docSysConfig.properties", "openOfficePathForWindows");
        } 
        else if (Pattern.matches("Mac.*", osName)) 
        {
        	officeHome = ReadProperties.read("docSysConfig.properties", "openOfficePathForMac");
        }
        else
        {
        	officeHome = ReadProperties.read("docSysConfig.properties", "openOfficePath");        	
        }

        System.out.println("officeHome:" + officeHome);
    	if(officeHome == null || "".equals(officeHome))
    	{
    		return getDefaultOfficeHome();
    	}
    	return officeHome;
    }

    private static String getDefaultOfficeHome() 
    {
        String osName = System.getProperty("os.name");
        System.out.println("操作系统名称:" + osName);
        if (Pattern.matches("Linux.*", osName)) 
        {
            return "/opt/openoffice.org4";
        } 
        else if (Pattern.matches("Windows.*", osName)) 
        {
            return "C:/Program Files (x86)/OpenOffice 4";
        } 
        else if (Pattern.matches("Mac.*", osName)) 
        {
            return "/Applications/OpenOffice.org.app/Contents/";
        }
        return null;
    }

    /**
     * 连接OpenOffice.org 并且启动OpenOffice.org
     * 
     * @return
     */
    public static OfficeManager getOfficeManager() {
        DefaultOfficeManagerConfiguration config = new DefaultOfficeManagerConfiguration();
        // 设置OpenOffice.org 3的安装目录
        config.setOfficeHome(getOfficeHome());
        // 启动OpenOffice的服务
        OfficeManager officeManager = config.buildOfficeManager();
        officeManager.start();
        return officeManager;
    }

    /**
     * 转换文件
     * 
     * @param inputFile
     * @param outputFilePath_end
     * @param inputFilePath
     * @param outputFilePath
     * @param converter
     */
    public static File converterFile(File inputFile, String outputFilePath_end, String inputFilePath,
            OfficeDocumentConverter converter) {
        File outputFile = new File(outputFilePath_end);
        // 假如目标路径不存在,则新建该路径
        if (!outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }
        converter.convert(inputFile, outputFile);
        System.out.println("文件：" + inputFilePath + "\n转换为\n目标文件：" + outputFile + "\n成功!");
        return outputFile;
    }

    /**
     * 使Office2003-2007全部格式的文档(.doc|.docx|.xls|.xlsx|.ppt|.pptx) 转化为pdf文件<br>
     * 
     * @param inputFilePath
     *            源文件路径，如："e:/test.docx"
     * @param outputFilePath 
     * @param outputFilePath
     *            目标文件路径，如："e:/test_docx.pdf"
     * @return
     */
    public static File office2pdf(String inputFilePath, String outputFilePath) {
        OfficeManager officeManager = null;
        try {
            if (inputFilePath == null || "".equals(inputFilePath)) {
                System.out.println("office2pdf() 输入文件地址为空，转换终止!");
                return null;
            }

            File inputFile = new File(inputFilePath);

            if (!inputFile.exists()) {
                System.out.println("office2pdf() 输入文件不存在，转换终止!");
                return null;
            }

            // 获取OpenOffice的安装路劲
            officeManager = getOfficeManager();
            // 连接OpenOffice
            OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);

            return converterFile(inputFile, outputFilePath, inputFilePath, converter);
        } catch (Exception e) {
            System.out.println("office2pdf() 转换终止异常!");
            e.printStackTrace();
        } finally {
            // 停止openOffice
            if (officeManager != null) {
                officeManager.stop();
            }
        }
        return null;
    }

    /**
     * 获取inputFilePath的后缀名，如："e:/test.pptx"的后缀名为："pptx"<br>
     * 
     * @param inputFilePath
     * @return
     */
    public static String getPostfix(String inputFilePath) {
        return inputFilePath.substring(inputFilePath.lastIndexOf(".") + 1);
    }

}
