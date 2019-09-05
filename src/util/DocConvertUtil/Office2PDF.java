package util.DocConvertUtil;



import java.io.File;
import java.util.regex.Pattern;

import org.artofsolving.jodconverter.OfficeDocumentConverter;
import org.artofsolving.jodconverter.office.DefaultOfficeManagerConfiguration;
import org.artofsolving.jodconverter.office.OfficeManager;

import util.ReadProperties;
import util.ReturnAjax;

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
     * @param rt 
     * @return
     */
    public static boolean openOfficeToPDF(String inputFilePath,String outputFilePath, ReturnAjax rt) {    	 
    	 return office2pdf(inputFilePath,outputFilePath,rt);
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
    public static boolean converterFile(File inputFile, String outputFilePath_end, String inputFilePath,
            OfficeDocumentConverter converter) {
        File outputFile = new File(outputFilePath_end);
        // 假如目标路径不存在,则新建该路径
        if (!outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }
        
        converter.convert(inputFile, outputFile);
        System.out.println("文件 " + inputFilePath + "转换为 目标文件:" + outputFile + " 成功!");
        return true;
    }

    /**
     * 使Office2003-2007全部格式的文档(.doc|.docx|.xls|.xlsx|.ppt|.pptx) 转化为pdf文件<br>
     * 
     * @param inputFilePath
     *            源文件路径，如："e:/test.docx"
     * @param outputFilePath 
     * @param outputFilePath
     *            目标文件路径，如："e:/test_docx.pdf"
     * @param rt 
     * @return
     */
    public static boolean office2pdf(String inputFilePath, String outputFilePath, ReturnAjax rt) {
        if (inputFilePath == null || "".equals(inputFilePath)) {
            System.out.println("office2pdf() 输入文件地址为空，转换终止!");
            rt.setError("文件未指定！");
            return false;
        }

        File inputFile = new File(inputFilePath);

        if (!inputFile.exists()) {
            System.out.println("office2pdf() 输入文件不存在，转换终止!");
            rt.setError("文件 " + inputFilePath + " 不存在！");
            return false;
        }

    	
    	OfficeManager officeManager = null;
    	try {
	    	// 获取OpenOffice的安装路劲
	        officeManager = getOfficeManager();
    	} catch (Exception e) {
            rt.setError("请检查是否已安装Open Office!");
			System.out.println("office2pdf() getOfficeManager Exception");
			e.printStackTrace();
			return false;
    	}
    	
    	try {
    		// 连接OpenOffice
        	OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);
        	boolean ret = converterFile(inputFile, outputFilePath, inputFilePath, converter);
        	officeManager.stop();
        	officeManager = null;
        	return ret;
    	} catch (Exception e) {
    		rt.setError("文件转换异常!");
    		if(officeManager != null)
    		{
	        	officeManager.stop();
    		}
    		System.out.println("office2pdf() getOfficeManager Exception");
			e.printStackTrace();
			return false;
    	}
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
