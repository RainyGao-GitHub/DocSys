package util.Encrypt;

import java.io.IOException;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.util.Calendar;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import util.HexString;

public class EncryptUtil {
	
    public static final String PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA1";
    
    // The following constants may be changed without breaking existing hashes.
    public static final int SALT_BYTE_SIZE = 24;
    public static final int HASH_BYTE_SIZE = 24;
    public static final int PBKDF2_ITERATIONS = 1000;
 
    public static final int ITERATION_INDEX = 0;
    public static final int SALT_INDEX = 1;
    public static final int PBKDF2_INDEX = 2;
 
    /**
     * Returns a salted PBKDF2 hash of the password.
     *
     * @param   password    the password to hash
     * @return              a salted PBKDF2 hash of the password
     */
    public static String createPassword(String password)
        throws NoSuchAlgorithmException, InvalidKeySpecException
    {
        return createPassword(password.toCharArray());
    }
 
    /**
     * Returns a salted PBKDF2 hash of the password.
     *
     * @param   password    the password to hash
     * @return              a salted PBKDF2 hash of the password
     */
    public static String createPassword(char[] password)
        throws NoSuchAlgorithmException, InvalidKeySpecException
    {
        // Generate a random salt
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_BYTE_SIZE];
        random.nextBytes(salt);
 
        // Hash the password
        byte[] hash = pbkdf2(password, salt, PBKDF2_ITERATIONS, HASH_BYTE_SIZE);
        // format iterations:salt:hash
        return PBKDF2_ITERATIONS + "@" + HexString.toHex(salt) + "@" +  HexString.toHex(hash);
    }
 
    /**
     * Validates a password using a hash.
     *
     * @param   password        the password to check
     * @param   correctHash     the hash of the valid password
     * @return                  true if the password is correct, false if not
     */
    public static boolean validatePassword(String password, String correctHash)
        throws NoSuchAlgorithmException, InvalidKeySpecException
    {
    	System.out.println("password" + password + " correctHash" + correctHash);
        return validatePassword(password.toCharArray(), correctHash);
    }
 
    /**
     * Validates a password using a hash.
     *
     * @param   password        the password to check
     * @param   correctHash     the hash of the valid password
     * @return                  true if the password is correct, false if not
     */
    public static boolean validatePassword(char[] password, String correctHash)
        throws NoSuchAlgorithmException, InvalidKeySpecException
    {
        // Decode the hash into its parameters
        String[] params = correctHash.split("@");
        int iterations = Integer.parseInt(params[ITERATION_INDEX]);
        byte[] salt = HexString.fromHex(params[SALT_INDEX]);
        byte[] hash = HexString.fromHex(params[PBKDF2_INDEX]);
        // Compute the hash of the provided password, using the same salt,
        // iteration count, and hash length
        byte[] testHash = pbkdf2(password, salt, iterations, hash.length);
        // Compare the hashes in constant time. The password is correct if
        // both hashes match.
        return slowEquals(hash, testHash);
    }
 
    public static String createToken(int Expires, String device, String key) throws Exception {
    	Calendar cal = Calendar.getInstance();
    	cal.add(Calendar.DATE, Expires);
    	return DES.encrypt( getRandom() + "@" + device + "@" + cal.getTimeInMillis(),key);
	}
    
    public static boolean validateToken(Calendar Expires, String device,String token ,String key) throws IOException, Exception {
    	String content = DES.decrypt(token,key);
    	String[] pieces  = content.split("@");
    	if( 3 == pieces.length )
    	{
        	String forDevice = pieces[1];
    		long preExpires = Long.parseLong(pieces[2]);
        	return (forDevice.equals(device) && preExpires > Expires.getTimeInMillis());
    	}
    	return false;
    }
    
    /**
     * Compares two byte arrays in length-constant time. This comparison method
     * is used so that password hashes cannot be extracted from an on-line
     * system using a timing attack and then attacked off-line.
     *
     * @param   a       the first byte array
     * @param   b       the second byte array
     * @return          true if both byte arrays are the same, false if not
     */
    private static boolean slowEquals(byte[] a, byte[] b)
    {
        int diff = a.length ^ b.length;
        for(int i = 0; i < a.length && i < b.length; i++)
            diff |= a[i] ^ b[i];
        return diff == 0;
    }
 
    /**
     *  Computes the PBKDF2 hash of a password.
     *
     * @param   password    the password to hash.
     * @param   salt        the salt
     * @param   iterations  the iteration count (slowness factor)
     * @param   bytes       the length of the hash to compute in bytes
     * @return              the PBDKF2 hash of the password
     */
    private static byte[] pbkdf2(char[] password, byte[] salt, int iterations, int bytes)
        throws NoSuchAlgorithmException, InvalidKeySpecException
    {
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, bytes * 8);
        SecretKeyFactory skf = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM);
        return skf.generateSecret(spec).getEncoded();
    }
    
	/**
	 * 随机数的盐值
	 * @return
	 */
    private static String getRandom()
	{
	    //Always use a SecureRandom generator
	    SecureRandom sr;
		try {
			sr = SecureRandom.getInstance("SHA1PRNG");
		    //Create array for salt
		    byte[] salt = new byte[16];
		    //Get a random salt
		    sr.nextBytes(salt);
		    //return salt
		    return HexString.toHex(salt);
		    
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
		}
		return null;
	}
 

}
