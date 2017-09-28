package util;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;


/**
 * @author qian.huang[at]sunyard.com
 *
 */
public class HexString {

	public static void main(String[] args) {
		decode("40414243","D:\\","qq.txt");
	}
	
	/**
	 * 解码 16 进制字符串，并输出到文件
	 * @param bytes
	 * @param path
	 * @param file
	 */
	public static void decode(String bytes, String path, String file) {
		byte[] content = decode(bytes);
		FileOutputStream fos = null;
		try {
			File dir = new File(path);
			if (!dir.exists()){
				dir.mkdir();
			}
			
			fos = new FileOutputStream(path + file);
			fos.write(content);

		} catch (Exception e) {
			DebugHelper.print(e.toString());
		} finally {
			try {
				fos.close();
			} catch (IOException e) {
			}
		}
	}
	
	
	
	/**
	 * 解码 16 进制字符串
	 * @param bytes
	 * @return
	 */
	public static byte[] decode(String bytes) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream(
				bytes.length() / 2);
		String hexString = "0123456789ABCDEF";
		for (int i = 0; i < bytes.length(); i += 2)
		{
			baos.write((hexString.indexOf(bytes.charAt(i)) << 4 
					| hexString.indexOf(bytes.charAt(i + 1))));
		}
		return baos.toByteArray();
	}
	
    /**
     * Converts a string of hexadecimal characters into a byte array.
     *
     * @param   hex         the hex string
     * @return              the hex string decoded into a byte array
     */
	public static byte[] fromHex(String hex)
    {
        byte[] binary = new byte[hex.length() / 2];
        for(int i = 0; i < binary.length; i++)
        {
            binary[i] = (byte)Integer.parseInt(hex.substring(2*i, 2*i+2), 16);
        }
        return binary;
    }
 
    /**
     * Converts a byte array into a hexadecimal string.
     *
     * @param   array       the byte array to convert
     * @return              a length*2 character string encoding the byte array
     */
    public static String toHex(byte[] array)
    {
        BigInteger bi = new BigInteger(1, array);
        String hex = bi.toString(16);
        int paddingLength = (array.length * 2) - hex.length();
        if(paddingLength > 0)
            return String.format("%0" + paddingLength + "d", 0) + hex;
        else
            return hex;
    }

    
    public static String iStream2String(InputStream is) throws IOException{ 
        ByteArrayOutputStream baos = new ByteArrayOutputStream(); 
        int i=-1; 
        while ((i=is.read())!=-1){ 
        	baos.write(i); 
        } 
       return baos.toString(); 
}
}
