package util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class PropertiesUtil {
	
	private Properties properties = null;
	
	PropertiesUtil(String name) throws IOException{
		InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(name);  
		properties = new Properties();
		properties.load(stream);
	}
	
	public static PropertiesUtil getInstance(String name){
		try {
			return new PropertiesUtil(name + ".properties");
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
	
	public String getProperty(String key) throws Exception{
		return properties.getProperty(key);
	}
	
	public String getProperty(String key, String def){
		String ret = null;
		try{
			ret = getProperty(key);
		}
		catch (Exception e){
			e.printStackTrace();
			return def;
		}
		return ret;
	}
	
}
