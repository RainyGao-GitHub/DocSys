package com.DocSystem.test;

import java.io.File;
import java.nio.charset.Charset;
import java.nio.file.Files;

/**
 * 护栏：Office 字体库自动生成的硬约束（口径见 devDocs/Office字体库自动生成方案.md）。
 *
 * <p>为什么需要它：本机制的第一约束是"**绝不能放回系统启动初始化路径**"——历史上它挂在
 * {@code docSysInit} 里同步跑，异常/过慢会导致整个初始化完不成（影响面远大于字体库缺失本身）。
 * 这条约束只靠注释是守不住的，所以用源码级检查固化下来。
 *
 * <p>检查项：
 * <ol>
 *   <li>启动容器类（{@code BaseController}/{@code BaseFunction}）里不得出现字体库生成的调用；</li>
 *   <li>生成入口只允许出现在既定白名单文件里；</li>
 *   <li>两个前端发起的端点必须自带登录校验（ajax 请求会被 MyInterceptor 直接放行，拦截器不能当防线）；</li>
 *   <li>自动生成必须在后台线程里跑（不能占住请求线程）；</li>
 *   <li>成败判据必须是生成后复查 {@code isAllFontsReady()}，而不是 {@code checkAndGenerateFonts()} 的返回值；</li>
 *   <li>手动「重置字体库」必须与自动生成共用同一套复查逻辑（不得只信生成接口的返回值）。</li>
 * </ol>
 *
 * <p>运行（工作目录必须是工程根 {@code D:/Dev/DocSys}）：
 * <pre>
 *   javac -g -encoding UTF-8 -cp "WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*" -d WebRoot\WEB-INF\classes src\com\DocSystem\test\TestOfficeFontsAutoGenGuard.java
 *   java -cp "WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*" com.DocSystem.test.TestOfficeFontsAutoGenGuard
 * </pre>
 */
public class TestOfficeFontsAutoGenGuard {

	private static int passed = 0;
	private static int failed = 0;

	public static void main(String[] args) throws Exception
	{
		System.out.println("=== Office 字体库自动生成 护栏检查 ===");

		String baseController = read("src/com/DocSystem/controller/BaseController.java");
		String baseFunction = read("src/com/DocSystem/common/BaseFunction.java");
		String bussinessController = read("src/com/DocSystem/websocket/BussinessController.java");
		String officeBase = read("src/com/DocSystem/websocket/OfficeBase.java");
		String officeEditorLoader = read("WebRoot/web/js/OfficeEditorLoader.js");
		String commonJs = read("WebRoot/web/js/common.js");
		String channel = read("src/com/DocSystem/common/channels/Channel.java");

		//1) 启动容器类里不得出现字体库生成相关调用（docSysInit 在 BaseController，静态初始化在 BaseFunction）
		check("BaseController 不含字体库生成调用", !containsAny(baseController, FONT_GEN_SYMBOLS));
		check("BaseFunction 不含字体库生成调用", !containsAny(baseFunction, FONT_GEN_SYMBOLS));

		//2) 生成入口白名单：只允许出现在这几个文件里
		check("自动生成端点存在", bussinessController.contains("@RequestMapping(\"/autoGenerateOfficeFonts.do\")"));
		check("状态自检端点存在", bussinessController.contains("@RequestMapping(\"/getOfficeFontsStatus.do\")"));
		check("手动重置端点仍在", bussinessController.contains("@RequestMapping(\"/generateOfficeFonts.do\")"));
		check("Channel 里的 initOfficeEditorFonts 声明未新增调用点", countOf(channel, "initOfficeEditorFonts") == 1);

		//3) 两个新端点必须自带登录校验
		String statusEndpoint = sliceMethod(bussinessController, "@RequestMapping(\"/getOfficeFontsStatus.do\")");
		String autoEndpoint = sliceMethod(bussinessController, "@RequestMapping(\"/autoGenerateOfficeFonts.do\")");
		check("getOfficeFontsStatus 自带登录校验",
				statusEndpoint.contains("session.getAttribute(\"login_user\")") && statusEndpoint.contains("用户未登录"));
		check("autoGenerateOfficeFonts 自带登录校验",
				autoEndpoint.contains("session.getAttribute(\"login_user\")") && autoEndpoint.contains("用户未登录"));

		//4) 自动生成必须在后台线程执行
		check("自动生成使用后台线程", autoEndpoint.contains("startOfficeFontsAutoGenThread(") || bussinessController.contains("new Thread("));
		check("后台线程为 daemon 线程", bussinessController.contains("thread.setDaemon(true)"));
		check("后台线程名固定（便于排查）", bussinessController.contains("\"officeFontsAutoGen\""));

		//5) 幂等/防并发保护
		check("已就绪时不做任何生成（幂等）", autoEndpoint.contains("noopReason\", \"fontsReady\""));
		check("已有生成/安装/升级时不再启动", autoEndpoint.contains("noopReason\", \"officeBusy\"") && bussinessController.contains("isOfficeFontsGenerationInProgress()"));
		check("尝试次数上限保护", autoEndpoint.contains("noopReason\", \"attemptsExceeded\"") && bussinessController.contains("isOfficeFontsAutoGenAttemptsExceeded("));
		check("officeDisabled 用 finally 复位", officeBase.contains("officeDisabled = 1;") && countOf(officeBase, "officeDisabled = 0;") > 0);

		//6) 成败判据 = 生成后复查 isAllFontsReady()
		String verifyMethod = sliceMethod(officeBase, "private static boolean generateFontsWithVerify(");
		check("generateFontsWithVerify 复查 isAllFontsReady()", verifyMethod.contains("isAllFontsReady("));
		check("generateFontsWithVerify 有强制兜底重建", verifyMethod.contains("deleteAllFontsFiles(") && verifyMethod.contains("checkAndGenerateFonts(needThumbnails, true)"));
		String manualEndpoint = sliceMethod(bussinessController, "@RequestMapping(\"/generateOfficeFonts.do\")");
		check("手动重置复用同一套复查逻辑", manualEndpoint.contains("initOfficeEditorFonts(true, true)"));

		//7) 前端：编辑器入口先等字体库就绪（否则用户看到坏掉的编辑器）
		check("OfficeEditorLoader 在加载编辑器脚本前先等字体库", officeEditorLoader.contains("ensureOfficeFontsReady(function () {")
				&& officeEditorLoader.indexOf("ensureOfficeFontsReady(function () {") < officeEditorLoader.indexOf("loadScript(runtimeConfig.officeEditorApi"));
		check("OfficeEditorLoader 接口异常时 fail-open", countOf(officeEditorLoader, "flushFontsCallbacks();\t//fail-open") >= 3);
		check("首页静默预检存在（common.js）", commonJs.contains("/Bussiness/getOfficeFontsStatus.do") && commonJs.contains("/Bussiness/autoGenerateOfficeFonts.do"));

		System.out.println("=== 通过 " + passed + " 项，失败 " + failed + " 项 ===");
		if(failed > 0)
		{
			System.exit(1);
		}
	}

	private static final String[] FONT_GEN_SYMBOLS = new String[] {
			"initOfficeEditorFonts", "checkAndGenerateFonts", "autoGenerateOfficeFonts", "generateFontsWithVerify", "getOfficeFontsStatus"
	};

	private static boolean containsAny(String content, String[] symbols)
	{
		for(int i = 0; i < symbols.length; i++)
		{
			if(content.contains(symbols[i]))
			{
				System.out.println("    ↳ 命中禁忌符号: " + symbols[i]);
				return true;
			}
		}
		return false;
	}

	private static int countOf(String content, String keyword)
	{
		int count = 0;
		int index = content.indexOf(keyword);
		while(index >= 0)
		{
			count++;
			index = content.indexOf(keyword, index + keyword.length());
		}
		return count;
	}

	/** 取从 marker 起到下一个方法声明（{@code \n\t@} 或文件末尾）的内容，粗略但足够做同方法内断言。 */
	private static String sliceMethod(String content, String marker)
	{
		int start = content.indexOf(marker);
		if(start < 0)
		{
			return "";
		}
		int end = content.indexOf("\n\t/", start + marker.length());
		if(end < 0 || end - start > 6000)
		{
			end = Math.min(content.length(), start + 6000);
		}
		return content.substring(start, end);
	}

	private static void check(String name, boolean ok)
	{
		if(ok)
		{
			passed++;
			System.out.println("[PASS] " + name);
		}
		else
		{
			failed++;
			System.out.println("[FAIL] " + name);
		}
	}

	private static String read(String relativePath) throws Exception
	{
		File file = new File(relativePath);
		if(file.exists() == false)
		{
			throw new Exception("文件不存在: " + file.getAbsolutePath() + "（请把工作目录切到工程根 D:/Dev/DocSys 后运行）");
		}
		return new String(Files.readAllBytes(file.toPath()), Charset.forName("UTF-8"));
	}
}
