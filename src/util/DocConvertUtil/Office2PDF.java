package util.DocConvertUtil;

import java.io.File;
import org.artofsolving.jodconverter.OfficeDocumentConverter;
import org.artofsolving.jodconverter.office.DefaultOfficeManagerConfiguration;
import org.artofsolving.jodconverter.office.OfficeManager;

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
    public static boolean openOfficeToPDF(String inputFilePath,String outputFilePath, String officeHome, ReturnAjax rt) {    	 
    	 return office2pdf(inputFilePath,outputFilePath, officeHome, rt);
    }

    /**
     * 连接OpenOffice.org 并且启动OpenOffice.org
     * 
     * @return
     */
    public static OfficeManager getOfficeManager(String officeHome) {
        DefaultOfficeManagerConfiguration config = new DefaultOfficeManagerConfiguration();
        // 设置OpenOffice.org 3的安装目录
        config.setOfficeHome(officeHome);
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
	/****************** 线程锁接口 *********************************************/
	protected static final Object syncLock = new Object(); 
	protected static void unlock() {
		unlockSyncLock(syncLock);
	}
	protected static void unlockSyncLock(Object syncLock) {
		syncLock.notifyAll();//唤醒等待线程
	}  

    public static boolean office2pdf(String inputFilePath, String outputFilePath, String officeHome, ReturnAjax rt) {
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
    	
        //以下代码需要用线程锁
		synchronized(syncLock)
		{		
	    	OfficeManager officeManager = null;
	    	try {
	    		officeManager = getOfficeManager(officeHome);
	    		// 连接OpenOffice
	        	OfficeDocumentConverter converter = new OfficeDocumentConverter(officeManager);
	        	boolean ret = converterFile(inputFile, outputFilePath, inputFilePath, converter);
	        	officeManager.stop();
	        	officeManager = null;
	        	unlock();
	        	return ret;
	    	} catch (Exception e) {
	    		rt.setError("文件转换异常!");
	    		if(officeManager != null)
	    		{
		        	officeManager.stop();
	    		}
	    		System.out.println("office2pdf() getOfficeManager Exception");
				e.printStackTrace();
				unlock();
				return false;
	    	}
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
