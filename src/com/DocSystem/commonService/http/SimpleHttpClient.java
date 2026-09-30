package com.DocSystem.commonService.http;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;

import com.DocSystem.common.Log;

/**
 * 供应商适配层的 HTTP 客户端（无状态工具类）。
 *
 * <p>职责：编码（表单/JSON）、超时、**只对网络异常与 5xx 重试**、取回状态码与响应体。
 * 业务失败（如模板不匹配）不重试，避免重复计费/重复发信。
 *
 * <p>不引入任何 HTTP 库：JDK {@code HttpURLConnection} + TLS1.2 足够。
 *
 * <p>历史：本类原先叫 {@code sms/SmsHttpClient}（短信侧先用）。邮件侧接阿里云/腾讯云时
 * 也需要同一套逻辑（含 {@code queryInUrl} 的 RPC 形状与 JSON POST），所以上提到中立包，
 * 短信与邮件两侧共用同一份实现。
 */
public class SimpleHttpClient {

	public static final String ENCODING = "UTF-8";

	/** 重试次数上限（防止配置写错导致长时间卡住） */
	private static final int MAX_RETRY = 3;

	private static final int MIN_TIMEOUT_MS = 1000;
	private static final int MAX_TIMEOUT_MS = 60000;
	private static final int DEFAULT_TIMEOUT_MS = 10000;

	/**
	 * 执行请求。仅在「网络异常」或「HTTP 5xx」时重试。
	 *
	 * @param timeoutMs 连接/读取超时（越界时归一到 1000~60000，默认 10000）
	 * @param retry     重试次数（0~3）
	 */
	public static HttpResponse execute(HttpRequest request, int timeoutMs, int retry) {
		if (request == null || request.getUrl() == null || request.getUrl().trim().isEmpty()) {
			return HttpResponse.networkError("请求地址为空", 0);
		}

		int attempts = 1 + Math.max(0, Math.min(retry, MAX_RETRY));
		HttpResponse response = null;
		for (int i = 0; i < attempts; i++) {
			response = doExecute(request, timeoutMs);
			if (i + 1 >= attempts || !isRetryable(response)) {
				break;
			}
			Log.warn("SimpleHttpClient 第 " + (i + 1) + " 次重试原因：" + describe(response));
		}
		return response;
	}

	/** 表单编码（键与值各编码一次） */
	public static String encodeForm(Map<String, String> params) {
		if (params == null || params.isEmpty()) {
			return "";
		}
		StringBuilder sb = new StringBuilder();
		for (Map.Entry<String, String> entry : params.entrySet()) {
			if (sb.length() > 0) {
				sb.append("&");
			}
			sb.append(urlEncode(entry.getKey())).append("=").append(urlEncode(entry.getValue()));
		}
		return sb.toString();
	}

	/** GET 请求拼查询串 */
	public static String buildUrlWithQuery(String url, Map<String, String> params) {
		String query = encodeForm(params);
		if (query.isEmpty()) {
			return url;
		}
		return url + (url.contains("?") ? "&" : "?") + query;
	}

	// ===================== 内部实现 =====================

	/** 调用方是否已显式给出 Content-Type（键名大小写无关） */
	private static boolean hasContentType(HttpRequest request) {
		if (request.getHeaders() == null) {
			return false;
		}
		for (String key : request.getHeaders().keySet()) {
			if (key != null && "Content-Type".equalsIgnoreCase(key.trim())) {
				return true;
			}
		}
		return false;
	}

	private static boolean isRetryable(HttpResponse response) {
		if (response == null) {
			return false;
		}
		if (response.isNetworkError()) {
			return true;
		}
		return response.getStatus() >= 500;
	}

	private static String describe(HttpResponse response) {
		if (response == null) {
			return "null";
		}
		return response.isNetworkError() ? response.getErrorMessage() : ("HTTP " + response.getStatus());
	}

	private static HttpResponse doExecute(HttpRequest request, int timeoutMs) {
		long start = System.currentTimeMillis();
		HttpURLConnection conn = null;
		try {
			boolean get = "GET".equalsIgnoreCase(request.getMethod());
			String url = request.getUrl().trim();
			if (get || request.isQueryInUrl()) {
				url = buildUrlWithQuery(url, request.getFormParams());
			}

			conn = (HttpURLConnection) new URL(url).openConnection();
			conn.setRequestMethod(get ? "GET" : "POST");
			int timeout = normalizeTimeout(timeoutMs);
			conn.setConnectTimeout(timeout);
			conn.setReadTimeout(timeout);
			conn.setInstanceFollowRedirects(false);

			if (request.getHeaders() != null) {
				for (Map.Entry<String, String> header : request.getHeaders().entrySet()) {
					conn.setRequestProperty(header.getKey(), header.getValue());
				}
			}

			if (!get && !request.isQueryInUrl()) {
				byte[] payload;
				if (request.isFormPost()) {
					payload = encodeForm(request.getFormParams()).getBytes(ENCODING);
				} else {
					String json = (request.getJsonBody() == null) ? "" : request.getJsonBody();
					payload = json.getBytes(ENCODING);
				}
				// 调用方已显式指定 Content-Type 时**不再覆盖**：腾讯云 TC3 签名要求 content-type 头
				// 与签名时的取值逐字节一致（application/json; charset=utf-8），而这里的默认值没有那个空格。
				if (!hasContentType(request)) {
					conn.setRequestProperty("Content-Type", request.isFormPost()
							? ("application/x-www-form-urlencoded;charset=" + ENCODING)
							: ("application/json;charset=" + ENCODING));
				}
				// 不要手工设置 Content-Length：与 JDK 的分块写入冲突（本项目历史踩坑）；
				// 需要固定长度时用 setFixedLengthStreamingMode，由 JDK 自己处理长度。
				conn.setFixedLengthStreamingMode(payload.length);
				conn.setDoOutput(true);
				OutputStream out = conn.getOutputStream();
				out.write(payload);
				out.flush();
				out.close();
			}

			int status = conn.getResponseCode();
			HttpResponse response = new HttpResponse();
			response.setStatus(status);
			response.setBody(readBody(conn, status));
			response.setElapsedMs(System.currentTimeMillis() - start);
			return response;
		} catch (Exception e) {
			return HttpResponse.networkError(e.getClass().getSimpleName() + ": " + e.getMessage(),
					System.currentTimeMillis() - start);
		} finally {
			if (conn != null) {
				conn.disconnect();
			}
		}
	}

	private static String readBody(HttpURLConnection conn, int status) {
		InputStream in = null;
		try {
			in = (status >= 200 && status < 400) ? conn.getInputStream() : conn.getErrorStream();
			if (in == null) {
				return "";
			}
			ByteArrayOutputStream buffer = new ByteArrayOutputStream();
			byte[] chunk = new byte[4096];
			int read;
			while ((read = in.read(chunk)) > 0) {
				buffer.write(chunk, 0, read);
			}
			return new String(buffer.toByteArray(), ENCODING);
		} catch (Exception e) {
			Log.debug("SimpleHttpClient 读取响应失败: " + e.getMessage());
			return "";
		} finally {
			if (in != null) {
				try {
					in.close();
				} catch (Exception e) {
					// ignore
				}
			}
		}
	}

	private static int normalizeTimeout(int timeoutMs) {
		if (timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
			return DEFAULT_TIMEOUT_MS;
		}
		return timeoutMs;
	}

	private static String urlEncode(String value) {
		if (value == null) {
			return "";
		}
		try {
			return URLEncoder.encode(value, ENCODING);
		} catch (Exception e) {
			return value;
		}
	}
}
