package util;

import java.util.Date;

public class UUid {
	public static String getUUID(String idstr){
		Date date = new Date();
		String d = DateFormat.dateTimeSSSFormat(date);
		String radomNum = Math.round(Math.random()*100000)+"";
		int bl = 6-radomNum.length();
		for(int i = 0; i<(bl); i++){
			radomNum = "0"+radomNum;
		}
		idstr = "000000" + idstr;
		idstr = idstr.substring(idstr.length()-6, idstr.length());
		return d + idstr + radomNum;
	}
}
