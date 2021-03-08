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
	    try {
	        Method method = object.getClass().getMethod("get" + String.valueOf(chars));
	        return method.invoke(object);
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	    return null;
	}
}
