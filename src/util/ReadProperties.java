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
		try {
			Properties props = new Properties();
			String basePath = new ReadProperties().getClass().getClassLoader().getResource("/").getPath();
			File config = new File(basePath+fileName);
			InputStream in = new FileInputStream(config);
			props.load(in);
			return (String) props.get(key);
		} catch (Exception e) {
			e.printStackTrace();
			return "";
		}
		
	}
}
