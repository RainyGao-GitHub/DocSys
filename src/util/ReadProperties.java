/**  
 * @Title: ReadProperties.java
 * @Package util
 * @Description: TODO
 * @author zhanjp
 * @date 2016年7月29日
 */
package util;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Properties;

/**
 * ClassName: ReadProperties 
 * @Description: TODO
 * @author zhanjp
 * @date 2016年7月29日
 */
public class ReadProperties {

	public static String read(String fileName, String key){
		String basePath = new ReadProperties().getClass().getClassLoader().getResource("/").getPath();
		String filePath = basePath+fileName;
		return getValue(filePath, key);
	}
	
	public static String getValue(String filePath, String key){
		try {
			Properties props = new Properties();
			File config = new File(filePath);
			InputStream in = new FileInputStream(config);
			props.load(in);
			return (String) props.get(key);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}		
	}
	
    public static boolean setValue(String filePath, String key, String value){
    	boolean ret = false;
        FileOutputStream fileOutputStream = null;
        try {
			Properties props = new Properties();
			File config = new File(filePath);
			InputStream in = new FileInputStream(config);
			props.load(in);
			props.setProperty(key, value);
    	
            fileOutputStream = new FileOutputStream(filePath);
            props.store(fileOutputStream, "");
            ret = true;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (null != fileOutputStream){
                    fileOutputStream.close();
                }
            } catch (Exception e) {
                System.out.println("文件流关闭出现异常");
            }
        }
        return ret;
    }
}
