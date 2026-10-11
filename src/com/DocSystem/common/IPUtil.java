package com.DocSystem.common;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

public class IPUtil {

	// 虚拟/隧道类网卡名称关键字：命中则视为"非物理网卡"，仅在找不到物理网卡时才使用（只降级、不排除）
	private static final String[] VIRTUAL_IF_KEYWORDS = {
		"virtual", "vmware", "vbox", "virtualbox", "hyper-v", "vethernet", "wsl",
		"docker", "vmnet", "loopback", "bluetooth", "wi-fi direct",
		"awdl", "llw", "anpi", "bridge", "tap", "tun", "ppp",
		"teredo", "isatap", "6to4", "npcap", "zerotier", "tailscale", "hamachi", "radmin", "vpn"
	};

	/******************************** 获取服务器、访问者IP地址 *************************************/

	/**
	 * 获取服务器IP地址（仅IPv4）。
	 * 按"物理网卡优先、UP优先"的顺序返回第一个可用的局域网IPv4地址，跳过回环与169.254链路本地地址；
	 * 没有可用IPv4时返回null。
	 * 注意：该地址同时被用作服务器标识（如备份目录命名），因此只返回IPv4，避免IPv6地址中的冒号影响路径。
	 */
	public static String getIpAddress() {
		String IP = findAddress(false);
		Log.debug("getIpAddress() IP:" + IP);
		return IP;
	}

	/**
	 * 获取服务器对外链接（分享链接等）要使用的主机地址：优先可用IPv4，本机没有可用IPv4时回退到IPv6。
	 */
	public static String getIpAddressForLink() {
		String IP = findAddress(true);
		Log.debug("getIpAddressForLink() IP:" + IP);
		return IP;
	}

	/** 将主机地址格式化为可用于URL的host：IPv6需要用方括号包裹 */
	public static String formatHostForUrl(String host) {
		if (host == null || host.isEmpty()) {
			return host;
		}
		if (host.indexOf(':') >= 0 && host.charAt(0) != '[') {
			return "[" + host + "]";
		}
		return host;
	}

	/** 判断host是否为本机地址（localhost/127.x/::1/0.0.0.0），用于把分享链接中的本机地址替换成服务器IP */
	public static boolean isLocalHost(String host) {
		if (host == null || host.isEmpty()) {
			return false;
		}
		String h = host;
		if (h.charAt(0) == '[' && h.charAt(h.length() - 1) == ']') {
			h = h.substring(1, h.length() - 1);
		}
		return "localhost".equalsIgnoreCase(h) || "0.0.0.0".equals(h) || "::1".equals(h) || h.startsWith("127.");
	}

	private static String findAddress(boolean allowIpv6) {
		try {
			// 统一按"物理网卡优先、UP优先"的顺序枚举，避免 getLocalHost() 触发DNS解析导致无网络时阻塞，
			// 也避免选到没有IPv4的虚拟网卡（如macOS的awdl0/llw0）或非本机可达的虚拟网卡（如VirtualBox主机网卡）
			List<NetworkInterface> ifs = getSortedInterfaces();
			for (NetworkInterface ni : ifs) {
				String ip = firstUsableIPv4(ni);
				if (ip != null) {
					return ip;
				}
			}
			if (allowIpv6) {
				for (NetworkInterface ni : ifs) {
					String ip = firstUsableIPv6(ni);
					if (ip != null) {
						return ip;
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	// 网卡排序：物理网卡优先，其次UP的网卡优先（只影响"优先选择"，不排除任何网卡）
	private static List<NetworkInterface> getSortedInterfaces() throws SocketException {
		List<NetworkInterface> physicalUp = new ArrayList<NetworkInterface>();
		List<NetworkInterface> physicalDown = new ArrayList<NetworkInterface>();
		List<NetworkInterface> virtualUp = new ArrayList<NetworkInterface>();
		List<NetworkInterface> virtualDown = new ArrayList<NetworkInterface>();

		Enumeration<NetworkInterface> allIfs = NetworkInterface.getNetworkInterfaces();
		if (allIfs != null) {
			for (NetworkInterface ni : Collections.list(allIfs)) {
				if (ni.isLoopback()) {
					continue;
				}
				if (isVirtualInterface(ni)) {
					if (ni.isUp()) virtualUp.add(ni); else virtualDown.add(ni);
				} else {
					if (ni.isUp()) physicalUp.add(ni); else physicalDown.add(ni);
				}
			}
		}

		List<NetworkInterface> result = new ArrayList<NetworkInterface>();
		result.addAll(physicalUp);
		result.addAll(physicalDown);
		result.addAll(virtualUp);
		result.addAll(virtualDown);
		return result;
	}

	private static String firstUsableIPv4(NetworkInterface ni) {
		for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
			if (addr instanceof Inet4Address && !addr.isLoopbackAddress() && !addr.isLinkLocalAddress() && !addr.isAnyLocalAddress()) {
				return addr.getHostAddress();
			}
		}
		return null;
	}

	private static String firstUsableIPv6(NetworkInterface ni) {
		for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
			if (addr instanceof Inet6Address && !addr.isLoopbackAddress() && !addr.isLinkLocalAddress() && !addr.isAnyLocalAddress()) {
				return addr.getHostAddress();
			}
		}
		return null;
	}

	private static boolean isVirtualInterface(NetworkInterface ni) {
		String name = ni.getName();
		String disp = ni.getDisplayName();
		String s = ((name == null ? "" : name) + " " + (disp == null ? "" : disp)).toLowerCase();
		for (String keyword : VIRTUAL_IF_KEYWORDS) {
			if (s.contains(keyword)) {
				return true;
			}
		}
		return false;
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
