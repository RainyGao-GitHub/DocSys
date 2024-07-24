package com.DocSystem.common;

import java.lang.reflect.Method;

public class Reflect {
	/*根据变量名对变量进行设置*/
	public static boolean setFieldValue(Object object,String field,Object value){
	    boolean ret = false;
		char[] chars = field.trim().toCharArray();
	    chars[0] -= 32;//将field的首字母转为大写，因为set方法后跟的是首字母大写的属性
	    try {
	        Method method = object.getClass().getMethod("set" + String.valueOf(chars), value.getClass());
	        method.invoke(object, value);
	        return true;
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	    return ret;
	}
	
	public static Object getFieldValue(Object object,String field){
	    char[] chars = field.trim().toCharArray();
	    chars[0] -= 32;//将field的首字母转为大写，因为set方法后跟的是首字母大写的属性
	    try 
	    {
	        Method method = object.getClass().getMethod("get" + String.valueOf(chars));
	        return method.invoke(object);
	    } 
	    catch (Exception e) 
	    {
	    	Log.info(e);
	    }
	    return null;
	}
	
	public static void PrintObject(Object obj){
		//Use Reflect to set conditions
        Class userCla = (Class) obj.getClass();
        /* 得到类中的所有属性集合 */
        java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            String fieldName = f.getName();
			try {
				Object val = f.get(obj);
				System.out.println("PrintObject() type:" + type + " fieldName:" + fieldName + " value:" + val);
			} catch (IllegalArgumentException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
	        } catch (IllegalAccessException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
			}
        }		
	}
}
