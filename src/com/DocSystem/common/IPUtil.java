package com.DocSystem.common;

import java.net.Inet4Address;
import java.net.InetAddress;

import javax.servlet.http.HttpServletRequest;

public class IPUtil {
	/******************************** 获取服务器、访问者IP地址 *************************************/
	public static String getIpAddress() {
		String IP = null;
		try {
			InetAddress ip4 = Inet4Address.getLocalHost();
			IP = ip4.getHostAddress();
			Log.debug("getIpAddress() IP:" + ip4.getHostAddress());
		} catch (Exception e) {
			e.printStackTrace();
		}	
		return IP;
	}
	
	public static String getIpAddress(HttpServletRequest request) {
		String ip = request.getHeader("x-forwarded-for");
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("WL-Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("HTTP_CLIENT_IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("HTTP_X_FORWARDED_FOR");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getRemoteAddr();
		}
		return ip;
	}
	
}
