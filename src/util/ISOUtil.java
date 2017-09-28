package util;

import java.util.Arrays;
import java.util.BitSet;

public class ISOUtil {
	private static ISOUtil _util = null;

	private ISOUtil() {
		super();
	}
	public static ISOUtil getInstance(){
		if(_util == null)
			_util = new ISOUtil();
		return _util;
	}
	
	public String leftPad(String s, int length, char c){
		StringBuffer buf = new StringBuffer();
		for(int i=0;i < length - s.length();i++)
		{
			buf.append(c);
		}
		buf.append(s);
		return buf.toString();
	}
	
	public String rightPad(String s, int length, char c){
		StringBuffer buf = new StringBuffer();
		buf.append(s);
		for(int i=0; i< length ;i++)
		{
			buf.append(c);
		}
		return buf.toString();
	}

	/**
	 * 按位异或
	 * @param op1
	 * @param op2
	 * @return
	 */
	public byte[] xor (byte[] op1, byte[] op2) {
		byte[] result = null;
		if (op2.length > op1.length) {
			result = new byte[op1.length];
		}
		else {
			result = new byte[op2.length];
		}
		for (int i = 0; i < result.length; i++) {
			result[i] = (byte)(op1[i] ^ op2[i]);
		}
		return  result;
	}
	
	/**
	 * 字符串转 BCD 码
	 * @param s
	 * @param padLeft
	 * @param d
	 * @param offset
	 * @return
	 */
	 public byte[] str2bcd(String s, boolean padLeft, byte[] d, int offset) {
		 int len = s.length();
		 int start = (((len & 1) == 1) && padLeft) ? 1 : 0;
		 for (int i=start; i < len+start; i++) 
			 d [offset + (i >> 1)] |= (s.charAt(i-start)-'0') << ((i & 1) == 1 ? 0 : 4);
		 return d;
	 }
	
	 public byte[] str2bcd(String s, boolean padLeft) {
		 int len = s.length();
		 byte[] d = new byte[ (len+1) >> 1 ];
		 return str2bcd(s, padLeft, d, 0);
	 }
	 
	 public byte[] str2bcd(String s, boolean padLeft, byte fill) {
		 int len = s.length();
		 byte[] d = new byte[ (len+1) >> 1 ];
		 Arrays.fill (d, fill);
		 int start = (((len & 1) == 1) && padLeft) ? 1 : 0;
		 for (int i=start; i < len+start; i++) 
			 d [i >> 1] |= (s.charAt(i-start)-'0') << ((i & 1) == 1 ? 0 : 4);
		 return d;
	 }
	
	 public String bcd2str(byte[] b, int offset, int len, boolean padLeft)
	 {
		 StringBuffer d = new StringBuffer(len);
		 int start = (((len & 1) == 1) && padLeft) ? 1 : 0;
		 for (int i=start; i < len+start; i++) {
			 int shift = ((i & 1) == 1 ? 0 : 4);
			 char c = Character.forDigit (
				 ((b[offset+(i>>1)] >> shift) & 0x0F), 16);
			 if (c == 'd')
				 c = '=';
			 d.append (Character.toUpperCase (c));
		 }
		 return d.toString();
	 }
	 
	public String hex2str(byte[] b) {
		StringBuffer d = new StringBuffer(b.length * 2);
		for (int i=0; i<b.length; i++) {
			char hi = Character.forDigit ((b[i] >> 4) & 0x0F, 16);
			char lo = Character.forDigit (b[i] & 0x0F, 16);
			d.append(Character.toUpperCase(hi));
			d.append(Character.toUpperCase(lo));
		}
		return d.toString();
	}
	
	public String hex2str(byte[] b, int offset, int len) {
		StringBuffer d = new StringBuffer(len * 2);
		for (int i=offset; i< offset + len; i++) {
			char hi = Character.forDigit ((b[i] >> 4) & 0x0F, 16);
			char lo = Character.forDigit (b[i] & 0x0F, 16);
			d.append(Character.toUpperCase(hi));
			d.append(Character.toUpperCase(lo));
		}
		return d.toString();
	}
	
	public byte[] str2hex (String s) {
		if (s.length() % 2 == 0) {
			return hex2byte (s.getBytes(), 0, s.length() >> 1);
		} else {
			throw new RuntimeException("Uneven number("+s.length()+") of hex digits passed to hex2byte.");
		}
	}
	public byte[] hex2byte (byte[] b, int offset, int len) {
		byte[] d = new byte[len];
		for (int i=0; i<len*2; i++) {
			int shift = i%2 == 1 ? 0 : 4;
			d[i>>1] |= Character.digit((char) b[offset+i], 16) << shift;
		}
		return d;
	}
	
	public BitSet byte2BitSet (byte[] b, int offset)
	{
		int len = 64;
		BitSet bmap = new BitSet (len);
		for (int i=0; i<len; i++) {
			if (((b[offset + (i >> 3)]) & (0x80 >> (i % 8))) > 0)
				bmap.set(i+1);
		}
		return bmap;
	}
	public byte[] bitSet2byte(BitSet bitmap)
	{
		int len = (((bitmap.length()+62)>>6)<<6);
		byte[] d = new byte[len >> 3];
		for (int i=0; i<len; i++) 
			if (bitmap.get(i+1)) 
				d[(i >> 3)] |= (0x80 >> (i % 8));
		if (len>64)
			d[0] |= 0x80;
		return d;
	}
	
	

	

	
	
	/**
	 * algo 3 MAC���� ANSIX9.19��׼�㷨,����POSǩ��
	 * @param mackey   MAC ��Կ
	 * @param content  ����
	 * @return
	 * @throws CSException
	 * @throws Exception
	 */
	public byte[] ANSI_9_1_9_4SIGN(byte[] data, int offset, int length){
		byte[] mac = new byte[8];
		byte[] wdata = new byte[8];
		for(int i=offset;;){
			if(i+8<(length + offset)){
				System.arraycopy(data, i, wdata, 0, 8);
				mac = xor(mac, wdata);			
				i += 8;
			}
			else{
				wdata = new byte[8];
				System.arraycopy(data, i, wdata, 0, (length+offset) - i);
				mac = xor(mac, wdata);
				break;
			}
		}
		
		return mac;
	}


}
