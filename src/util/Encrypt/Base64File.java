/**
 * 
 */
package util.Encrypt;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import com.ibm.misc.BASE64Decoder;

import util.DebugHelper;

/**
 * @author Administrator
 * 
 */
public class Base64File {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		decode("MTIzYWJj","D:\\","qq.txt");
	}

	/**
	 * 直接将解密内容写入文件
	 * 
	 * @param bytes
	 * @param path
	 * @param file
	 */
	public static void decode(String bytes, String path, String file) {
		byte[] content = decode(bytes);
		FileOutputStream fos = null;
		try {
			File dir = new File(path);
			if (!dir.exists()) {
				DebugHelper.print("文件夹" + path + "不存在");
				dir.mkdir();
			}
			
			System.out.println( "s " + dir.setWritable(true));
			System.out.println( "w " + dir.canWrite());
			System.out.println( "r " + dir.canRead());
			
			
			DebugHelper.print( "重新检测" + dir.exists() );

			fos = new FileOutputStream(path + file);
			fos.write(content);

		} catch (Exception e) {
			DebugHelper.print(e.toString());
		} finally {
			try {
				fos.close();
			} catch (IOException e) {
				// 不做处理
			}
		}
	}

	/**
	 * 将字符串解密
	 * 
	 * @param bytes
	 * @return
	 */
	public static byte[] decode(String data) {
		if (null == data) {
			return null;
		}
		BASE64Decoder decoder = new BASE64Decoder();
		try {
			byte[] ret = decoder.decodeBuffer(data);
			return ret;
		} catch (Exception e) {
			DebugHelper.print(e.toString());
			return null;
		}

	}

}
