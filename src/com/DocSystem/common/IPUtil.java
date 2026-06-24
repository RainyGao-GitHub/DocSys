package com.DocSystem.common;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Collections;
import java.util.Enumeration;

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
	
	public static String getMacAddress() {
		String mac = null;
		try {
			InetAddress ip4 = Inet4Address.getLocalHost();
			mac = getLocalMac(ip4);
			Log.debug("getMacAddress() mac:" + mac);
		} catch (Exception e) {
			e.printStackTrace();
		}	
		return mac;
	}
	
	private static String getLocalMac(InetAddress ip) {
		String macStr = "00-00-00-00-00-00";
		try {
			NetworkInterface networkInterface = NetworkInterface.getByInetAddress(ip);
			// Linux上hostname可能解析到127.0.1.1（hosts文件别名），该地址未绑定真实网卡，getByInetAddress返回null
			// 此时回退到枚举所有接口，取第一个非回环且有MAC的接口
			if (networkInterface == null || networkInterface.isLoopback()) {
				Enumeration<NetworkInterface> allIfs = NetworkInterface.getNetworkInterfaces();
				if (allIfs != null) {
					for (NetworkInterface ni : Collections.list(allIfs)) {
						if (!ni.isLoopback() && ni.isUp() && ni.getHardwareAddress() != null) {
							networkInterface = ni;
							break;
						}
					}
				}
			}
			if (networkInterface == null) return macStr;
			byte[] mac = networkInterface.getHardwareAddress();
			if(mac != null && mac.length > 0)
			{
				macStr = "";
				for(int i=0; i<mac.length; i++)
				{
					if(i!=0)
					{
						macStr += "-";
					}
					int temp = mac[i] & 0xFF;
					macStr += Integer.toHexString(temp);
				}
			}
		} catch (SocketException e) {
			e.printStackTrace();
		}
		return macStr;
	}

	public static String getIpAddress(HttpServletRequest request) 
	{
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
		
	    // 如果是多个代理，取第一个IP
	    if (ip != null && ip.contains(",")) {
	        ip = ip.split(",")[0].trim();
	    }
		return ip;
	}
}
