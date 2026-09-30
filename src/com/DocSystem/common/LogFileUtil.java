package com.DocSystem.common;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/**
 * 日志文件"按字节窗口"读取工具（供管理后台「调试日志 - 在线查看」使用）。
 *
 * <p>为什么不能整文件读：单文件最大约 50MB（超过会被 {@link Log#toFile()} 轮转备份），整读会吃掉容器内存。
 * 这里用 {@link RandomAccessFile} + {@code seek} 只读一个窗口，并把窗口两端**对齐到整行**：
 * <ul>
 *   <li>起点：若 offset 不是行首（offset-1 不是 '\n'），丢弃到第一个 '\n' 之后（丢掉被截断的半行）；</li>
 *   <li>终点：若窗口最后一个字节不是 '\n'，回退到最后一个 '\n' 之后（丢掉被截断的半行）。</li>
 * </ul>
 * 于是每次返回的都是**完整行**，且 {@link LogWindow#endOffset} 永远是行首位置 ——
 * 增量轮询直接把它当 offset 回传即可，不重不漏。
 *
 * <p>两端都找不到 '\n' 时（超长单行、或文件只有一行）不做裁剪并置 {@link LogWindow#longLine}，
 * 否则会返回空窗口、页面无法前进。
 *
 * <p>解码用 {@link CharsetDecoder} 且 {@code REPLACE}：日志里混入非该编码的字节（Windows 控制台输出的
 * GBK 片段、异常里的二进制内容等）不会抛异常，只显示替换符。
 *
 * <p>纯函数、不依赖 Servlet/容器，可用探针直接做边界验证。
 */
public class LogFileUtil {

	/** 单次读取的默认字节数 */
	public static final int DEFAULT_MAX_BYTES = 256 * 1024;
	/** 单次读取的字节数上限 */
	public static final int MAX_MAX_BYTES = 1024 * 1024;

	/** 一次读取的结果 */
	public static class LogWindow {
		public String content = "";
		/** 本次内容在文件中的起始字节位置 */
		public long startOffset = 0;
		/** 本次内容的结束字节位置（行首位置，可直接作为下次增量轮询的 offset） */
		public long endOffset = 0;
		/** 是否还有更早的内容（可继续"向上翻页"） */
		public boolean hasMoreBefore = false;
		/** 窗口内有超过窗口上限的单行（未按行边界裁剪） */
		public boolean longLine = false;
	}

	public static int normalizeMaxBytes(Integer maxBytes) {
		if(maxBytes == null || maxBytes <= 0) {
			return DEFAULT_MAX_BYTES;
		}
		return Math.min(maxBytes.intValue(), MAX_MAX_BYTES);
	}

	public static Charset charsetOf(String encoding) {
		if(encoding == null || encoding.isEmpty()) {
			return StandardCharsets.UTF_8;
		}
		try {
			return Charset.forName(encoding);
		} catch (Exception e) {
			return StandardCharsets.UTF_8;
		}
	}

	/**
	 * 读取一个字节窗口。
	 *
	 * @param file      日志文件
	 * @param offset    >=0：从该字节位置向后读；<0：从文件末尾向前读一窗（看最新日志）
	 * @param endOffset 可选；指定窗口结束位置（"向上翻页"时传当前窗口的 startOffset，避免与已有内容重叠）
	 * @param maxBytes  窗口字节上限（null/<=0 用默认值）
	 * @param charset   解码字符集
	 */
	public static LogWindow read(File file, long offset, Long endOffset, Integer maxBytes, Charset charset) throws IOException
	{
		int windowBytes = normalizeMaxBytes(maxBytes);
		LogWindow win = new LogWindow();

		long fileSize = (file == null) ? 0 : file.length();
		if(file == null || fileSize <= 0)
		{
			win.startOffset = 0;
			win.endOffset = 0;
			return win;
		}

		// 计算窗口起点
		long start;
		if(offset < 0)
		{
			start = fileSize - windowBytes;		// 末尾一窗
			if(start < 0)
			{
				start = 0;
			}
		}
		else
		{
			start = offset;
		}

		if(start >= fileSize)
		{
			// 没有新内容（增量轮询的常态）：返回空窗口，位置停在文件末尾
			win.startOffset = fileSize;
			win.endOffset = fileSize;
			win.hasMoreBefore = fileSize > 0;
			return win;
		}

		// 计算窗口终点
		long end;
		if(endOffset != null && endOffset.longValue() > 0)
		{
			end = endOffset.longValue();
			if(end > start + windowBytes)
			{
				end = start + windowBytes;
			}
		}
		else
		{
			end = start + windowBytes;
		}
		if(end > fileSize)
		{
			end = fileSize;
		}
		if(end < start)
		{
			end = start;
		}

		int len = (int)(end - start);
		byte[] buf = new byte[len];
		byte prevByte = '\n';	// start==0 时视为行首
		RandomAccessFile raf = null;
		try {
			raf = new RandomAccessFile(file, "r");
			raf.seek(start);
			raf.readFully(buf);
			if(start > 0)
			{
				raf.seek(start - 1);
				prevByte = (byte) raf.read();
			}
		} finally {
			if(raf != null)
			{
				try { raf.close(); } catch (Exception e) { /* ignore */ }
			}
		}

		int from = 0;
		int to = len;

		// 起点对齐：offset 不在行首时，丢掉被截断的半行
		if(start > 0 && prevByte != '\n')
		{
			int nl = indexOfNewLine(buf, 0, to);
			if(nl >= 0)
			{
				from = nl + 1;
			}
			else
			{
				win.longLine = true;	// 整窗无换行（超长行）→ 保留，保证页面能前进
			}
		}

		// 终点对齐：窗口末尾不是行尾时，回退到最后一个换行之后
		if(to > from && buf[to - 1] != '\n')
		{
			int nl = lastIndexOfNewLine(buf, from, to);
			if(nl >= 0)
			{
				to = nl + 1;
			}
			else
			{
				win.longLine = true;
			}
		}

		if(to < from)
		{
			to = from;
		}

		win.startOffset = start + from;
		win.endOffset = start + to;
		win.hasMoreBefore = win.startOffset > 0;
		win.content = decode(buf, from, to - from, charset);
		return win;
	}

	private static String decode(byte[] buf, int off, int len, Charset charset)
	{
		if(len <= 0)
		{
			return "";
		}
		Charset cs = (charset == null) ? StandardCharsets.UTF_8 : charset;
		CharsetDecoder decoder = cs.newDecoder()
				.onMalformedInput(CodingErrorAction.REPLACE)
				.onUnmappableCharacter(CodingErrorAction.REPLACE);
		try {
			return decoder.decode(ByteBuffer.wrap(buf, off, len)).toString();
		} catch (CharacterCodingException e) {
			// 理论上 REPLACE 策略不会走到这里；兜底按默认字符集解析
			return new String(buf, off, len, StandardCharsets.UTF_8);
		}
	}

	private static int indexOfNewLine(byte[] buf, int from, int to)
	{
		for(int i = from; i < to; i++)
		{
			if(buf[i] == '\n')
			{
				return i;
			}
		}
		return -1;
	}

	private static int lastIndexOfNewLine(byte[] buf, int from, int to)
	{
		for(int i = to - 1; i >= from; i--)
		{
			if(buf[i] == '\n')
			{
				return i;
			}
		}
		return -1;
	}
}
