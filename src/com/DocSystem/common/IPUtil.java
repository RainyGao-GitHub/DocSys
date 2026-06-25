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
			// 直接枚举网卡获取IP，避免getLocalHost()触发DNS解析导致无网络时阻塞
			NetworkInterface ni = getPhysicalInterface();
			if (ni != null) {
				Enumeration<InetAddress> addrs = ni.getInetAddresses();
				while (addrs.hasMoreElements()) {
					InetAddress addr = addrs.nextElement();
					if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
						IP = addr.getHostAddress();
						break;
					}
				}
			}
			Log.debug("getIpAddress() IP:" + IP);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return IP;
	}

	public static String getMacAddress() {
		String macStr = "00-00-00-00-00-00";
		try {
			// 直接枚举网卡获取MAC，避免getLocalHost()触发DNS解析导致无网络时阻塞
			NetworkInterface ni = getPhysicalInterface();
			if (ni != null) {
				byte[] mac = ni.getHardwareAddress();
				if (mac != null && mac.length > 0) {
					macStr = "";
					for (int i = 0; i < mac.length; i++) {
						if (i != 0) macStr += "-";
						macStr += Integer.toHexString(mac[i] & 0xFF);
					}
				}
			}
			Log.debug("getMacAddress() mac:" + macStr);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return macStr;
	}

	// 枚举所有网卡，优先返回UP状态的物理网卡，次选DOWN状态的物理网卡（不插网线时网卡为DOWN但MAC仍可读）
	private static NetworkInterface getPhysicalInterface() throws SocketException {
		Enumeration<NetworkInterface> allIfs = NetworkInterface.getNetworkInterfaces();
		if (allIfs == null) return null;
		NetworkInterface downFallback = null;
		for (NetworkInterface ni : Collections.list(allIfs)) {
			byte[] hwAddr = ni.getHardwareAddress();
			if (ni.isLoopback() || hwAddr == null || hwAddr.length == 0) continue;
			if (ni.isUp()) return ni;
			if (downFallback == null) downFallback = ni;
		}
		return downFallback;
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
