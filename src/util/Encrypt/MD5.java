package util.Encrypt;

import java.security.MessageDigest;

public class MD5 {
	public static String md5(String text) {
        return md5(text, null);
	}
	
	public static String md5(String text, String encode) {
        try {
            // Create MessageDigest instance for MD5
            MessageDigest md = MessageDigest.getInstance("MD5");
            //Add password bytes to digest
            if(encode == null)
            {
            	md.update(text.getBytes());
            }
            else
            {
            	md.update(text.getBytes(encode));
            }
            
            //Get the hash's bytes 
            byte[] bytes = md.digest();
            //This bytes[] has bytes in decimal format;
            //Convert it to hexadecimal format
            StringBuilder sb = new StringBuilder();
            for(int i=0; i< bytes.length ;i++)
            {
                sb.append(Integer.toString((bytes[i] & 0xff) + 0x100, 16).substring(1));
            }
            //Get complete hashed password in hex format
            return sb.toString();
        } 
        catch (Exception e) 
        {
            e.printStackTrace();
        }
		return text;
	}
}
