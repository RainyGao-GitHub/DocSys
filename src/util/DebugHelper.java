package util;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * 
 * @version 1.0 2011-07-13
 * 
 */
public abstract class DebugHelper {

	public static void print(String msg){
		System.out.println( getFileLineMethod(2) + "->>" + msg );
	}

	public static String getFileLineMethod() {
		return getFileLineMethod(2);
	}

	public static String getFileLineMethod(int n) {
		StackTraceElement traceElement = ((new Exception()).getStackTrace())[n];
		StringBuffer toStringBuffer = new StringBuffer("[")
				.append(traceElement.getFileName()).append(" | ")
				.append(traceElement.getLineNumber()).append(" | ")
				.append(traceElement.getMethodName()).append("]");
		return toStringBuffer.toString(); 
	}

	public static String _FILE_() {
		StackTraceElement traceElement = ((new Exception()).getStackTrace())[1];
		return traceElement.getFileName();
	}

	public static String _FUNC_() {
		StackTraceElement traceElement = ((new Exception()).getStackTrace())[1];
		return traceElement.getMethodName();
	}

	public static int _LINE_() {
		StackTraceElement traceElement = ((new Exception()).getStackTrace())[1];
		return traceElement.getLineNumber();
	}

	public static String _TIME_() {
		Date now = new Date();
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
		return sdf.format(now);
	}

}