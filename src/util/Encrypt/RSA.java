package util.Encrypt;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Cipher;
import org.apache.commons.codec.binary.*;
 
public class RSA {
	private final static String RSA = "RSA";
  
    	public static void main(String[] args) throws Exception {
    		//生成公钥和私钥
		Map<Integer, String> keyMap = genKeyPair();
		
		//加密字符串
		String message = "df723820";
		System.out.println("随机生成的公钥为:" + keyMap.get(0));
		System.out.println("随机生成的私钥为:" + keyMap.get(1));
		String messageEn = encrypt(message,keyMap.get(0));
		System.out.println(message + "\t加密后的字符串为:" + messageEn);
		String messageDe = decrypt(messageEn,keyMap.get(1));
		System.out.println("还原后的字符串为:" + messageDe);
	}

	/** 
	 * 随机生成密钥对 
	 * @throws NoSuchAlgorithmException 
	 */  
	public static Map<Integer, String> genKeyPair()
	{
		Map<Integer, String> keyMap = null;
		try {
			// KeyPairGenerator类用于生成公钥和私钥对，基于RSA算法生成对象  
			KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance(RSA);  
			// 初始化密钥对生成器，密钥大小为96-1024位  
			keyPairGen.initialize(1024,new SecureRandom());  
			// 生成一个密钥对，保存在keyPair中  
			KeyPair keyPair = keyPairGen.generateKeyPair();  
			RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();   // 得到私钥  
			RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();  // 得到公钥  
			String publicKeyString = new String(Base64.encodeBase64(publicKey.getEncoded()));  
			// 得到私钥字符串  
			String privateKeyString = new String(Base64.encodeBase64((privateKey.getEncoded())));  
			// 将公钥和私钥保存到Map
			keyMap = new HashMap<Integer, String>();
			keyMap.put(0,publicKeyString);
			keyMap.put(1, privateKeyString); 
		} catch (Exception e) {
			e.printStackTrace();
		}
		return keyMap;
	}
	
	/** 
	 * RSA公钥加密 
	 *  
	 * @param str 
	 *            加密字符串
	 * @param publicKey 
	 *            公钥 
	 * @return 密文 
	 * @throws Exception 
	 *             加密过程中的异常信息 
	 */  
	public static String encrypt( String str, String publicKey ){
		String outStr = null;
		try {
			//base64编码的公钥
			byte[] decoded = Base64.decodeBase64(publicKey);
			RSAPublicKey pubKey = (RSAPublicKey) KeyFactory.getInstance(RSA).generatePublic(new X509EncodedKeySpec(decoded));
			//RSA加密
			Cipher cipher = Cipher.getInstance("RSA");
			cipher.init(Cipher.ENCRYPT_MODE, pubKey);
			outStr = Base64.encodeBase64String(cipher.doFinal(str.getBytes("UTF-8")));
		} catch(Exception e) {
			e.printStackTrace();
		}
		return outStr;
	}

	/** 
	 * RSA私钥解密
	 *  
	 * @param str 
	 *            加密字符串
	 * @param privateKey 
	 *            私钥 
	 * @return 铭文
	 * @throws Exception 
	 *             解密过程中的异常信息 
	 */  
	public static String decrypt(String str, String privateKey){
		String outStr = null;
		try {
			//64位解码加密后的字符串
			byte[] inputByte = Base64.decodeBase64(str.getBytes("UTF-8"));
			//base64编码的私钥
			byte[] decoded = Base64.decodeBase64(privateKey);  
	        RSAPrivateKey priKey = (RSAPrivateKey) KeyFactory.getInstance(RSA).generatePrivate(new PKCS8EncodedKeySpec(decoded));  
			//RSA解密
			Cipher cipher = Cipher.getInstance(RSA);
			cipher.init(Cipher.DECRYPT_MODE, priKey);
			outStr = new String(cipher.doFinal(inputByte));
		} catch(Exception e) {
			e.printStackTrace();
		}
		return outStr;
	}
}