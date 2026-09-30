package com.DocSystem.commonService.mail.impl;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.TimeZone;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 腾讯云 API **V3 签名**（{@code TC3-HMAC-SHA256}）的纯实现，只依赖 JDK。
 *
 * <p>规范：<a href="https://cloud.tencent.com/document/api/213/30654">签名方法 v3</a>
 * （含官方 Java/Python/Go 等多语言示例）。做成无状态纯函数的原因：签名错了就是 100% 失败，
 * 必须能用**官方示例的中间值**（{@link #EXAMPLE_CANONICAL_REQUEST}/{@link #EXAMPLE_STRING_TO_SIGN}）
 * 脱网逐步对拍。
 *
 * <p>与短信侧 {@code Acs3Signer}（阿里云 V3）刻意保持同形：两个签名器都是"给参数 → 拿 Authorization"。
 * 放在 mail 包下是因为邮件侧先用到（腾讯云 SES）；将来短信要接腾讯云时把它移到 common 即可。
 *
 * <p>几个容易踩的点（都来自官方文档的"注意"）：
 * <ul>
 *   <li>{@code Date} 必须是 **UTC+0** 的日期（用东八区的本地日期会在凌晨必然失败）；</li>
 *   <li>规范请求串的 CanonicalHeaders 每行以 {@code \n} 结尾，拼进 CanonicalRequest 时**还要再加一个 {@code \n}**；</li>
 *   <li>{@code content-type} 与 {@code host} 是必签头，且**发出的值必须与签名时完全一致**（含 charset）；</li>
 *   <li>签名与摘要一律**小写十六进制**；</li>
 *   <li>Timestamp 与服务器时间相差不得超过 5 分钟。</li>
 * </ul>
 */
public final class Tc3Signer {

	/** 目前仅支持这一种签名算法 */
	public static final String ALGORITHM = "TC3-HMAC-SHA256";

	/** 腾讯云 POST JSON 请求固定用这个 Content-Type（含 charset，必须与签名一致） */
	public static final String CONTENT_TYPE_JSON = "application/json; charset=utf-8";

	// ===================== 官方示例向量（用于脱网验证） =====================
	//
	// 官方示例输入：secretId/secretKey 被文档打码，所以**签名值无法对拍**，但规范请求串、
	// 待签名字符串、payload 摘要都与密钥无关 —— 这三样正好覆盖了 90% 的实现错误。

	/** 官方示例：Host=cvm.tencentcloudapi.com、Action=DescribeInstances、Timestamp=1551113065 时的规范请求串 */
	public static final String EXAMPLE_CANONICAL_REQUEST = "POST\n"
			+ "/\n"
			+ "\n"
			+ "content-type:application/json; charset=utf-8\n"
			+ "host:cvm.tencentcloudapi.com\n"
			+ "x-tc-action:describeinstances\n"
			+ "\n"
			+ "content-type;host;x-tc-action\n"
			+ "35e9c5b0e3ae67532d3c9f17ead6c90222632e5b1ff7f6e89887f1398934f064";

	/** 官方示例：由上面的规范请求串算出的待签名字符串 */
	public static final String EXAMPLE_STRING_TO_SIGN = "TC3-HMAC-SHA256\n"
			+ "1551113065\n"
			+ "2019-02-25/cvm/tc3_request\n"
			+ "7019a55be8395899b900fb5564e4200d984910f34794a27cb3fb7d10ff6a1e84";

	/** 官方示例：请求体（其中中文是以 Unicode 转义写在 JSON 文本里的，摘要按该文本的原样字节计算） */
	public static final String EXAMPLE_PAYLOAD =
			"{\"Limit\": 1, \"Filters\": [{\"Values\": [\"\\u672a\\u547d\\u540d\"], \"Name\": \"instance-name\"}]}";

	/** 官方示例：Timestamp（精确到秒） */
	public static final long EXAMPLE_TIMESTAMP = 1551113065L;

	// ===================== 签名 =====================

	/**
	 * 计算 V3 签名。
	 *
	 * @param host         服务地址（不含协议与路径，如 ses.tencentcloudapi.com）
	 * @param service      产品名（必须与域名一致，如 ses）
	 * @param action       接口名（如 SendEmail；签名时会被转小写放进 x-tc-action）
	 * @param version      接口版本（如 2020-10-02）
	 * @param region       地域（如 ap-guangzhou；为空时不带 X-TC-Region 头）
	 * @param secretId     密钥 SecretId
	 * @param secretKey    密钥 SecretKey
	 * @param payload      请求体（JSON 原文；签名与实际发送必须**逐字节一致**）
	 * @param timestampSec 请求时间戳（秒）
	 */
	public static Signed sign(String host, String service, String action, String version, String region,
			String secretId, String secretKey, String payload, long timestampSec) {
		String method = "POST";
		String canonicalUri = "/";
		String canonicalQueryString = "";
		String contentType = CONTENT_TYPE_JSON;

		String hashedRequestPayload = sha256Hex(nullToEmpty(payload));
		String canonicalHeaders = "content-type:" + contentType + "\n"
				+ "host:" + nullToEmpty(host) + "\n"
				+ "x-tc-action:" + nullToEmpty(action).toLowerCase() + "\n";
		String signedHeaders = "content-type;host;x-tc-action";

		String canonicalRequest = method + "\n"
				+ canonicalUri + "\n"
				+ canonicalQueryString + "\n"
				+ canonicalHeaders + "\n"
				+ signedHeaders + "\n"
				+ hashedRequestPayload;

		String date = utcDate(timestampSec);
		String credentialScope = date + "/" + nullToEmpty(service) + "/tc3_request";
		String hashedCanonicalRequest = sha256Hex(canonicalRequest);
		String stringToSign = ALGORITHM + "\n"
				+ timestampSec + "\n"
				+ credentialScope + "\n"
				+ hashedCanonicalRequest;

		byte[] secretDate = hmacSha256(("TC3" + nullToEmpty(secretKey)).getBytes(java.nio.charset.Charset.forName("UTF-8")), date);
		byte[] secretService = hmacSha256(secretDate, nullToEmpty(service));
		byte[] secretSigning = hmacSha256(secretService, "tc3_request");
		String signature = hex(hmacSha256(secretSigning, stringToSign));

		Signed signed = new Signed();
		signed.canonicalRequest = canonicalRequest;
		signed.hashedRequestPayload = hashedRequestPayload;
		signed.hashedCanonicalRequest = hashedCanonicalRequest;
		signed.stringToSign = stringToSign;
		signed.credentialScope = credentialScope;
		signed.signedHeaders = signedHeaders;
		signed.signature = signature;
		signed.authorization = ALGORITHM + " Credential=" + nullToEmpty(secretId) + "/" + credentialScope
				+ ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

		//实际要发出的头（值必须与签名时一致）
		Map<String, String> headers = new TreeMap<String, String>();
		headers.put("Authorization", signed.authorization);
		headers.put("Content-Type", contentType);
		headers.put("Host", nullToEmpty(host));
		headers.put("X-TC-Action", nullToEmpty(action));
		headers.put("X-TC-Timestamp", String.valueOf(timestampSec));
		headers.put("X-TC-Version", nullToEmpty(version));
		if (region != null && !region.trim().isEmpty()) {
			headers.put("X-TC-Region", region.trim());
		}
		signed.headers = headers;

		return signed;
	}

	// ===================== 工具（公开以便单测/诊断） =====================

	/** 时间戳 → UTC+0 的 {@code yyyy-MM-dd}（**不能用本地时区**，见类注释） */
	public static String utcDate(long timestampSec) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		format.setTimeZone(TimeZone.getTimeZone("UTC"));
		return format.format(new Date(timestampSec * 1000L));
	}

	/** 小写十六进制 SHA256 */
	public static String sha256Hex(String text) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return hex(digest.digest(nullToEmpty(text).getBytes("UTF-8")));
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 不可用", e);
		}
	}

	/** HMAC-SHA256（返回原始字节，供派生链使用） */
	public static byte[] hmacSha256(byte[] key, String text) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(key, "HmacSHA256"));
			return mac.doFinal(nullToEmpty(text).getBytes("UTF-8"));
		} catch (Exception e) {
			throw new IllegalStateException("HmacSHA256 不可用", e);
		}
	}

	/** 小写十六进制 */
	public static String hex(byte[] bytes) {
		StringBuilder sb = new StringBuilder(bytes.length * 2);
		for (byte b : bytes) {
			sb.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
		}
		return sb.toString();
	}

	private static String nullToEmpty(String value) {
		return (value == null) ? "" : value;
	}

	/** 签名结果（含各中间串与实际请求头，便于诊断与对拍官方示例） */
	public static class Signed {
		private String authorization;
		private String canonicalRequest;
		private String hashedRequestPayload;
		private String hashedCanonicalRequest;
		private String stringToSign;
		private String credentialScope;
		private String signedHeaders;
		private String signature;
		private Map<String, String> headers;

		public String getAuthorization() {
			return authorization;
		}

		public String getCanonicalRequest() {
			return canonicalRequest;
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

		public String getCredentialScope() {
			return credentialScope;
		}

		public String getSignedHeaders() {
			return signedHeaders;
		}

		public String getSignature() {
			return signature;
		}

		public Map<String, String> getHeaders() {
			return headers;
		}
	}
}
