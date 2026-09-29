package com.DocSystem.commonService.sms.impl;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 阿里云 OpenAPI **V3 签名**（{@code ACS3-HMAC-SHA256}）的纯实现，只依赖 JDK。
 *
 * <p>规范：<a href="https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature">
 * V3版本请求体&amp;签名机制</a>。做成无状态纯函数的原因：签名错了就是 100% 失败，必须能用官方
 * 示例向量（{@link #EXAMPLE_HASHED_CANONICAL_REQUEST}/{@link #EXAMPLE_SIGNATURE}）脱网断言每一步。
 *
 * <p>几个容易踩的点：
 * <ul>
 *   <li>CanonicalHeaders 每条以 {@code \n} 结尾，拼进 CanonicalRequest 时还要再加一个 {@code \n}（官方示例里那行空行）；</li>
 *   <li>参与签名的头 = {@code host} + 所有 {@code x-acs-*} + {@code content-type}，**发出去但没签的头会让网关算出的签名不一致**；</li>
 *   <li>编码用 RFC3986：空格→{@code %20}、{@code *}→{@code %2A}、{@code ~} 不编码（{@code URLEncoder} 的 {@code +} 与 {@code %7E} 需要改回来）；</li>
 *   <li>摘要与签名结果都是**小写十六进制**（Base16），不是 Base64。</li>
 * </ul>
 */
public final class Acs3Signer {

	/** 目前仅支持这一种签名算法 */
	public static final String ALGORITHM = "ACS3-HMAC-SHA256";

	/** 空请求体的 SHA256（官方示例值） */
	public static final String EMPTY_CONTENT_SHA256 =
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

	// ===================== 官方示例向量（用于脱网验证） =====================

	/** 官方示例：AccessKeySecret=YourAccessKeySecret、按示例输入算出的 HashedCanonicalRequest */
	public static final String EXAMPLE_HASHED_CANONICAL_REQUEST =
			"7ea06492da5221eba5297e897ce16e55f964061054b7695beedaac1145b1e259";

	/** 官方示例：由上面待签串算出的 Signature */
	public static final String EXAMPLE_SIGNATURE =
			"06563a9e1b43f5dfe96b81484da74bceab24a1d853912eee15083a6f0f3283c0";

	/** 官方示例：AccessKeySecret */
	public static final String EXAMPLE_ACCESS_KEY_SECRET = "YourAccessKeySecret";

	// ===================== 签名 =====================

	/**
	 * 计算 V3 签名。
	 *
	 * @param method       HTTP 方法（大写，如 POST）
	 * @param host         服务地址（不含协议与路径，如 dysmsapi.aliyuncs.com）
	 * @param path         规范化 URI，RPC 风格固定为 {@code /}
	 * @param queryParams  位置在 query 的业务参数（会按名升序 + RFC3986 编码进签名）
	 * @param acsHeaders   将随请求发出的 {@code x-acs-*} 头（**必须与实际发出的完全一致**）
	 * @param accessKeyId  AccessKeyId
	 * @param accessKeySecret AccessKeySecret
	 * @param body         请求体（无 Body 传空串）
	 */
	public static Signed sign(String method, String host, String path, Map<String, String> queryParams,
			Map<String, String> acsHeaders, String accessKeyId, String accessKeySecret, String body) {
		Signed signed = new Signed();

		// 1) 规范化请求
		String canonicalQueryString = buildCanonicalQueryString(queryParams);
		String hashedPayload = sha256Hex((body == null) ? "" : body);

		Map<String, String> headers = new TreeMap<String, String>();
		headers.put("host", trimToEmpty(host));
		if (acsHeaders != null) {
			for (Map.Entry<String, String> header : acsHeaders.entrySet()) {
				if (header.getKey() == null) {
					continue;
				}
				headers.put(header.getKey().toLowerCase(), trimToEmpty(header.getValue()));
			}
		}
		// x-acs-content-sha256 必须等于实际 Body 的摘要
		headers.put("x-acs-content-sha256", hashedPayload);

		StringBuilder canonicalHeaders = new StringBuilder();
		StringBuilder signedHeaders = new StringBuilder();
		for (Map.Entry<String, String> header : headers.entrySet()) {
			canonicalHeaders.append(header.getKey()).append(":").append(header.getValue()).append("\n");
			if (signedHeaders.length() > 0) {
				signedHeaders.append(";");
			}
			signedHeaders.append(header.getKey());
		}

		String canonicalRequest = method + "\n"
				+ path + "\n"
				+ canonicalQueryString + "\n"
				+ canonicalHeaders + "\n"
				+ signedHeaders + "\n"
				+ hashedPayload;

		// 2) 待签名字符串
		String hashedCanonicalRequest = sha256Hex(canonicalRequest);
		String stringToSign = ALGORITHM + "\n" + hashedCanonicalRequest;

		// 3) 计算签名
		String signature = hmacSha256Hex((accessKeySecret == null) ? "" : accessKeySecret, stringToSign);

		signed.canonicalQueryString = canonicalQueryString;
		signed.hashedRequestPayload = hashedPayload;
		signed.canonicalRequest = canonicalRequest;
		signed.hashedCanonicalRequest = hashedCanonicalRequest;
		signed.stringToSign = stringToSign;
		signed.signedHeaders = signedHeaders.toString();
		signed.signature = signature;
		signed.authorization = ALGORITHM + " Credential=" + trimToEmpty(accessKeyId)
				+ ",SignedHeaders=" + signed.signedHeaders + ",Signature=" + signature;
		return signed;
	}

	// ===================== 工具（公开以便单测/诊断） =====================

	/**
	 * 规范化查询串：参数名升序，名与值分别 RFC3986 编码，{@code k=v} 用 {@code &} 连接。
	 * 无参数 → 空串。
	 */
	public static String buildCanonicalQueryString(Map<String, String> queryParams) {
		if (queryParams == null || queryParams.isEmpty()) {
			return "";
		}
		Map<String, String> sorted = new TreeMap<String, String>();
		sorted.putAll(queryParams);

		StringBuilder sb = new StringBuilder();
		for (Map.Entry<String, String> param : sorted.entrySet()) {
			if (sb.length() > 0) {
				sb.append("&");
			}
			sb.append(rfc3986Encode(param.getKey())).append("=").append(rfc3986Encode(param.getValue()));
		}
		return sb.toString();
	}

	/** RFC3986 编码（space→%20、*→%2A、~ 不编码） */
	public static String rfc3986Encode(String value) {
		if (value == null) {
			return "";
		}
		String encoded;
		try {
			encoded = URLEncoder.encode(value, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			return value;	// UTF-8 必然存在
		}
		return encoded.replace("+", "%20").replace("*", "%2A").replace("%7E", "~");
	}

	/** 小写十六进制 SHA256 */
	public static String sha256Hex(String text) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return toHex(digest.digest(text.getBytes("UTF-8")));
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 不可用", e);
		}
	}

	/** 小写十六进制 HMAC-SHA256 */
	public static String hmacSha256Hex(String secret, String text) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256"));
			return toHex(mac.doFinal(text.getBytes("UTF-8")));
		} catch (Exception e) {
			throw new IllegalStateException("HmacSHA256 不可用", e);
		}
	}

	private static String toHex(byte[] bytes) {
		StringBuilder sb = new StringBuilder(bytes.length * 2);
		for (byte b : bytes) {
			sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
		}
		return sb.toString();
	}

	private static String trimToEmpty(String value) {
		return (value == null) ? "" : value.trim();
	}

	/** 签名结果（含各中间串，便于诊断与单测比对官方示例） */
	public static class Signed {
		private String authorization;
		private String canonicalRequest;
		private String canonicalQueryString;
		private String hashedRequestPayload;
		private String hashedCanonicalRequest;
		private String stringToSign;
		private String signedHeaders;
		private String signature;

		public String getAuthorization() {
			return authorization;
		}

		public String getCanonicalRequest() {
			return canonicalRequest;
		}

		public String getCanonicalQueryString() {
			return canonicalQueryString;
		}

		public String getHashedRequestPayload() {
			return hashedRequestPayload;
		}

		public String getHashedCanonicalRequest() {
			return hashedCanonicalRequest;
		}

		public String getStringToSign() {
			return stringToSign;
		}

		public String getSignedHeaders() {
			return signedHeaders;
		}

		public String getSignature() {
			return signature;
		}
	}

	private Acs3Signer() {
	}
}
