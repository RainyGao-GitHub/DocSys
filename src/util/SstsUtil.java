package util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

public class SstsUtil {
	private static SstsUtil _util = null;
	@SuppressWarnings("unused")
	private static final char[] HEX = { '0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };

	public static SstsUtil getInstance() {
		if (_util == null)
			_util = new SstsUtil();
		return _util;
	}

	private SstsUtil() {
		super();
	}

	public int bytes_to_int(byte[] b) {
		int len;
		len = 256 * byte_to_int(b[0]) + byte_to_int(b[1]);
		return len;
	}

	public int byte_to_int(byte b) {
		if (b < 0)
			return 256 + b;
		return b;
	}

	public byte[] int_to_bytes(int len) {
		byte[] b = new byte[2];
		b[0] = (byte) (len / 256);
		b[1] = (byte) (len % 256);
		return b;
	}

	public String format_str(int in, int len) {
		StringBuffer buf = new StringBuffer();
		String tmp = Integer.toString(in);
		if (tmp.length() >= len) {
			return tmp;
		} else {
			for (int i = 0; i < len - tmp.length(); i++) {
				buf.append("0");
			}
			buf.append(tmp);
		}
		return buf.toString();
	}

	public String rightPad(String in, int len, char c) {
		StringBuffer buf = new StringBuffer();
		if (in.length() >= len) {
			return in;
		} else {
			buf.append(in);
			for (int i = 0; i < len - in.length(); i++) {
				buf.append(c);
			}
		}
		return buf.toString();
	}

	public String leftPad(String in, int len, char c) {
		StringBuffer buf = new StringBuffer();
		if (in.length() >= len) {
			return in;
		} else {
			for (int i = 0; i < len - in.length(); i++) {
				buf.append(c);
			}
			buf.append(in);
		}
		return buf.toString();
	}

	public String nvl(String in, String dft) {
		if (in == null)
			return dft;
		else
			return in;
	}

	public String getSysDate() {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
		return sdf.format(new Date());
	}

	public String getSysTime() {
		SimpleDateFormat sdf = new SimpleDateFormat("HHmmss");
		return sdf.format(new Date());
	}

	public String getSysDateTime() {
		SimpleDateFormat sdf = new SimpleDateFormat("[yyyy-MM-dd HH:mm:ss]");
		return sdf.format(new Date());
	}

	public String getSysDateTimePure() {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		return sdf.format(new Date());
	}

	public String getDatefor10() {
		String newdate = "";
		java.text.SimpleDateFormat df = new java.text.SimpleDateFormat(
				"yyyyMMdd");
		Calendar g = Calendar.getInstance();
		g.setTime(new java.util.Date());
		g.add(java.util.Calendar.DATE, -10);
		newdate = df.format(g.getTime());
		return newdate;
	}

	public String getLastMonth() throws Exception {

		java.util.Calendar calendar = java.util.Calendar.getInstance();
		calendar.setTime(new java.util.Date());
		calendar.add(Calendar.MONTH, -1);

		SimpleDateFormat df = new SimpleDateFormat("yyyyMMdd");
		return df.format(calendar.getTime()).substring(0, 6);
	}

	public static String getFullFile(String filename) throws Exception {
		File r_file = new File(filename);
		FileReader fileread = null;
		BufferedReader bufread = null;
		String retValue = "";

		try {
			if (r_file.exists() == false) {

				throw new Exception("�ļ�[" + filename + "]������.");
			}

			fileread = new FileReader(r_file);
			bufread = new BufferedReader(fileread);

			String sline = " ";

			while ((sline = bufread.readLine()) != null) {

				if (!sline.startsWith("#") && !sline.trim().equals("")) {

					retValue += sline + "\n";
				}

			}

			bufread.close();
			fileread.close();

			return retValue;
		} catch (Exception e) {
			e.printStackTrace();
			throw new Exception(e.toString());
		} finally {
			try {
				bufread.close();
				fileread.close();
			} catch (Exception ee) {
			}
			try {

				File f = new File(filename);
				// modify by tan
				f.delete(); // ɾ��ò�ѯ����ļ�
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

	public String maskAccount(String account) {
		int headLen = 0;
		String mAcct = "";

		if (account.length() < 10) {
			return account;
		}
		headLen = account.length() / 2 - 4;

		mAcct = account.substring(0, headLen) + "********"
				+ account.substring(headLen + 8, account.length());

		return mAcct;

	}

	public String changeScale(double value, int scale) {
		String newvalue = "";
		BigDecimal b = new BigDecimal(Double.toString(value));
		newvalue = b.setScale(scale, BigDecimal.ROUND_HALF_UP).toString();
		return newvalue;
	}

	public static String conver15IdNo(String id_no) {
		String id_no_other = id_no.substring(0, 6) + "19"
				+ id_no.substring(6, 15);
		int check_no = Integer.parseInt(id_no_other.substring(0, 1)) * 7
				+ +Integer.parseInt(id_no_other.substring(1, 2)) * 9
				+ +Integer.parseInt(id_no_other.substring(2, 3)) * 10
				+ +Integer.parseInt(id_no_other.substring(3, 4)) * 5
				+ +Integer.parseInt(id_no_other.substring(4, 5)) * 8
				+ +Integer.parseInt(id_no_other.substring(5, 6)) * 4
				+ +Integer.parseInt(id_no_other.substring(6, 7)) * 2
				+ +Integer.parseInt(id_no_other.substring(7, 8)) * 1
				+ +Integer.parseInt(id_no_other.substring(8, 9)) * 6
				+ +Integer.parseInt(id_no_other.substring(9, 10)) * 3
				+ +Integer.parseInt(id_no_other.substring(10, 11)) * 7
				+ +Integer.parseInt(id_no_other.substring(11, 12)) * 9
				+ +Integer.parseInt(id_no_other.substring(12, 13)) * 10
				+ +Integer.parseInt(id_no_other.substring(13, 14)) * 5
				+ +Integer.parseInt(id_no_other.substring(14, 15)) * 8
				+ +Integer.parseInt(id_no_other.substring(15, 16)) * 4
				+ +Integer.parseInt(id_no_other.substring(16, 17)) * 2;
		check_no = check_no % 11;
		if (check_no == 0)
			id_no_other = id_no_other + "1";
		if (check_no == 1)
			id_no_other = id_no_other + "0";
		if (check_no == 2)
			id_no_other = id_no_other + "X";
		if (check_no == 3)
			id_no_other = id_no_other + "9";
		if (check_no == 4)
			id_no_other = id_no_other + "8";
		if (check_no == 5)
			id_no_other = id_no_other + "7";
		if (check_no == 6)
			id_no_other = id_no_other + "6";
		if (check_no == 7)
			id_no_other = id_no_other + "5";
		if (check_no == 8)
			id_no_other = id_no_other + "4";
		if (check_no == 9)
			id_no_other = id_no_other + "3";
		if (check_no == 10)
			id_no_other = id_no_other + "2";

		return id_no_other;
	}

	public static String conver18IdNo(String id_no) {
		return id_no.substring(0, 6) + id_no.substring(8, 17);
	}

}