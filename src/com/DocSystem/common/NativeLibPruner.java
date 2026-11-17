package com.DocSystem.common;

import java.io.File;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 在线升级包按平台裁剪器 —— 与发布打包脚本 build_release.py 的裁剪规则同源
 * （裁定 2026-11-17，背景与依据见脚本内注释；**规则改动必须两处同步**）。
 *
 * 背景：在线升级用的 DocSystem.war 是跨平台通用包，带着全部平台的原生库 jar 与
 * office-editor 二进制。其中 32 位 lwjgl-natives-windows-x86.jar 曾触发 Windows
 * Defender Trojan:Win32/Vigorf.A 误报隔离；异平台二进制对目标机也纯属死重量。
 * 升级流程（ManageController.upgradeSystem）在解压出 DocSystem 目录后、交给
 * monitor 脚本替换 webapps 之前调用本类，按当前 JVM 平台先行剔除。
 *
 * 规则（与 build_release.py 的 native_jar_drops / oe_bin_drops 完全一致）：
 *  1) WEB-INF/lib：LWJGL natives 只保留本平台一对；JavaCV 系 jar 在 win/linux x64
 *     只保留本平台 classifier（聚合 jar 全剔），在 arm64/macos 反过来保 -platform
 *     聚合 jar 兜底、分平台 classifier 全剔（classifier 在 lib 里凑不齐）；
 *  2) office-editor：win 剔 Linux ELF/.so/.sh/libs，linux 剔 PE(.exe/.dll)，
 *     macos 两者全剔；
 *  3) jna-platform-*.jar 名字像聚合 jar，实际是 JNA 的平台 API 类包（原生库在
 *     jna.jar 本体里），绝不能删 —— 聚合 jar 用显式家族前缀识别就是为保住它；
 *  4) 识别不了的平台（如 32 位 JVM）整体跳过、只告警 —— 宁可不裁，不可误删。
 */
public class NativeLibPruner {

	/** office-editor 里无扩展名的 Linux ELF 可执行（与同名 .exe 成对存在）。 */
	private static final Set<String> OE_ELF_BASENAMES = new HashSet<String>(Arrays.asList(
			"x2t", "docbuilder", "allfontsgen", "allthemesgen"));

	/** JavaCV/JavaCPP 系 -platform 聚合 jar 的家族前缀（内部嵌着全部平台的原生库）。 */
	private static final String[] JAVACPP_UBER_PREFIXES = {
			"artoolkitplus-platform-", "ffmpeg-platform-", "flycapture-platform-",
			"javacpp-platform-", "javacv-platform-", "leptonica-platform-",
			"libdc1394-platform-", "libfreenect-platform-", "libfreenect2-platform-",
			"librealsense-platform-", "librealsense2-platform-", "openblas-platform-",
			"opencv-platform-", "tesseract-platform-", "videoinput-platform-",
	};

	/** javacpp 分平台 classifier jar 的文件名特征（家族-版本-平台-架构.jar）。 */
	private static final String[] CLASSIFIER_MARKS = {"-linux-", "-windows-", "-macos-", "-macosx-"};

	/** 打包脚本会构建的平台标签（win-arm64 无独立安装包，但升级 war 可能装到该平台）。 */
	private static final String[] ALL_TAGS = {
			"win-x64", "win-arm64", "linux-x64", "linux-arm64", "macos-x64", "macos-arm64"};

	/** LWJGL natives 每平台保留的 classifier（lwjgl-natives-<x>.jar 与 lwjgl-freetype-natives-<x>.jar）。 */
	private static String lwjglKeepOf(String tag) {
		if("win-x64".equals(tag)) return "windows";
		if("win-arm64".equals(tag)) return "windows-arm64";
		if("linux-x64".equals(tag)) return "linux";
		if("linux-arm64".equals(tag)) return "linux-arm64";
		if("macos-x64".equals(tag)) return "macos";
		if("macos-arm64".equals(tag)) return "macos-arm64";
		return null;
	}

	/** JavaCV classifier 保留后缀；null = 该平台在 lib 里凑不齐 classifier，须保 -platform 聚合 jar 兜底。 */
	private static String javacppKeepSuffixOf(String tag) {
		if("win-x64".equals(tag)) return "-windows-x86_64.jar";
		if("linux-x64".equals(tag)) return "-linux-x86_64.jar";
		return null;
	}

	private static String familyOf(String tag) {
		if(tag.startsWith("win")) return "win";
		if(tag.startsWith("macos")) return "macos";
		return "linux";
	}

	/** 由当前 JVM 判定原生库平台标签；识别不了（如 32 位 JVM、未知架构）返回 null。 */
	public static String detectNativeTag() {
		String os = System.getProperty("os.name", "").toLowerCase();
		String arch = System.getProperty("os.arch", "").toLowerCase();
		String archCls = null;
		if("amd64".equals(arch) || "x86_64".equals(arch) || "x8664".equals(arch)) {
			archCls = "x64";
		}
		else if("aarch64".equals(arch) || "arm64".equals(arch)) {
			archCls = "arm64";
		}
		if(archCls == null) {
			return null;
		}
		if(os.contains("win")) return "win-" + archCls;
		if(os.contains("mac") || os.contains("darwin")) return "macos-" + archCls;
		return "linux-" + archCls;
	}

	/** WEB-INF/lib 下 jar 的剔除判定（true = 本平台用不到，应删）。 */
	public static boolean dropJar(String name, String tag) {
		String keep = lwjglKeepOf(tag);
		if(keep == null) {
			return false;
		}
		if(name.startsWith("lwjgl-natives-") || name.startsWith("lwjgl-freetype-natives-")) {
			return !(("lwjgl-natives-" + keep + ".jar").equals(name)
					|| ("lwjgl-freetype-natives-" + keep + ".jar").equals(name));
		}
		boolean isUber = false;
		for(String p : JAVACPP_UBER_PREFIXES) {
			if(name.startsWith(p)) {
				isUber = true;
				break;
			}
		}
		boolean hasMark = false;
		for(String m : CLASSIFIER_MARKS) {
			if(name.contains(m)) {
				hasMark = true;
				break;
			}
		}
		String keepSuffix = javacppKeepSuffixOf(tag);
		if(keepSuffix == null) {
			//聚合兜底平台（arm64/macos/win-arm64）：保 -platform 聚合 jar，分平台 classifier 全是冗余
			return !isUber && hasMark;
		}
		if(isUber) {
			return true;
		}
		if(hasMark) {
			return !name.endsWith(keepSuffix);
		}
		return false;
	}

	/** office-editor 文件的剔除判定（baseName 为文件名；family 为 win/linux/macos）。 */
	public static boolean dropOeFile(String baseName, String family) {
		String low = baseName.toLowerCase();
		if("win".equals(family)) {
			//PE（.exe/.dll）全留；剔 Linux ELF、.so（含 .so.N 带版本变体）、.sh
			return OE_ELF_BASENAMES.contains(baseName) || isSharedObject(low) || low.endsWith(".sh");
		}
		if("linux".equals(family)) {
			//ELF、libs/Linux 的 .so、.sh 全留；剔 PE
			return low.endsWith(".exe") || low.endsWith(".dll");
		}
		//macos：PE 与 Linux ELF/.so 都不可执行
		return OE_ELF_BASENAMES.contains(baseName) || isSharedObject(low)
				|| low.endsWith(".exe") || low.endsWith(".dll");
	}

	private static boolean isSharedObject(String lowerName) {
		return lowerName.endsWith(".so") || lowerName.contains(".so.");
	}

	/**
	 * 升级预处理入口：对解压出来的 DocSystem 目录按当前平台裁剪
	 * WEB-INF/lib 的原生 jar 与 office-editor 的异平台二进制。
	 * best-effort —— 单个文件删除失败只告警；整体异常不抛出，不阻断升级。
	 */
	public static void pruneDocSystem(String docSystemDir) {
		try {
			String tag = detectNativeTag();
			if(tag == null) {
				Log.warn("NativeLibPruner 无法识别当前平台（os.name=" + System.getProperty("os.name")
						+ " os.arch=" + System.getProperty("os.arch") + "），跳过升级包按平台裁剪");
				return;
			}
			long t0 = System.currentTimeMillis();
			int libDeleted = pruneLibJars(new File(docSystemDir, "WEB-INF/lib"), tag);
			int oeDeleted = pruneOfficeEditor(new File(docSystemDir, "web/static/office-editor"), tag);
			Log.info("NativeLibPruner 按平台裁剪(" + tag + ")：删除 " + (libDeleted + oeDeleted)
					+ " 个文件（lib " + libDeleted + " / office-editor " + oeDeleted + "），耗时 "
					+ (System.currentTimeMillis() - t0) + " ms");
		}
		catch(Exception e) {
			Log.error("NativeLibPruner pruneDocSystem() 异常（不阻断升级）：" + e.getMessage());
		}
	}

	private static int pruneLibJars(File libDir, String tag) {
		if(libDir == null || !libDir.isDirectory()) {
			return 0;
		}
		File[] jars = libDir.listFiles();
		if(jars == null) {
			return 0;
		}
		int deleted = 0;
		for(File jar : jars) {
			if(jar.isFile() && jar.getName().endsWith(".jar") && dropJar(jar.getName(), tag)) {
				if(jar.delete()) {
					deleted++;
				}
				else {
					Log.warn("NativeLibPruner 删除失败：" + jar.getAbsolutePath());
				}
			}
		}
		return deleted;
	}

	private static int pruneOfficeEditor(File oeDir, String tag) {
		if(oeDir == null || !oeDir.isDirectory()) {
			return 0;
		}
		String family = familyOf(tag);
		if("win".equals(family) || "macos".equals(family)) {
			//libs 只对 Linux 有意义（里面全是 .so），win/macos 整树删除
			File libs = new File(oeDir, "libs");
			if(libs.isDirectory()) {
				int n = deleteTree(libs);
				Log.info("NativeLibPruner 删除 office-editor/libs：" + n + " 个文件");
			}
		}
		return pruneOeFiles(oeDir, family);
	}

	private static int pruneOeFiles(File dir, String family) {
		File[] entries = dir.listFiles();
		if(entries == null) {
			return 0;
		}
		int deleted = 0;
		for(File f : entries) {
			if(f.isDirectory()) {
				deleted += pruneOeFiles(f, family);
			}
			else if(dropOeFile(f.getName(), family)) {
				if(f.delete()) {
					deleted++;
				}
				else {
					Log.warn("NativeLibPruner 删除失败：" + f.getAbsolutePath());
				}
			}
		}
		return deleted;
	}

	/** 递归删除整棵目录树，返回删除的文件数（目录最后删，失败容忍由上层告警兜底）。 */
	private static int deleteTree(File dir) {
		File[] entries = dir.listFiles();
		int deleted = 0;
		if(entries != null) {
			for(File f : entries) {
				if(f.isDirectory()) {
					deleted += deleteTree(f);
				}
				else if(f.delete()) {
					deleted++;
				}
			}
		}
		dir.delete();
		return deleted;
	}
}
