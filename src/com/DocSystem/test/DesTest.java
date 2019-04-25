package com.DocSystem.test;
import util.Encrypt.DES;

class DesTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String data = "000000";
        String key = "20151109";
        try {
			String result = DES.encrypt(data, key);
	        System.out.println("DES result:" + result);
	        String org = DES.decrypt(result, key);
	        System.out.println("DES org:" + org);
	        
	        String password = "123456";
	        byte[] org_data = password.getBytes();
	        System.out.println(org_data.length);
	        
	        int len = ((org_data.length + 7)/8) * 8;
	        System.out.println(len);
	        byte[] input = new byte[((org_data.length + 7)/8) * 8];
	        //copy data to input
	        for(int i=0;i<org_data.length;i++)
	        {
	        	input[i] = org_data[i];
	        }
	        byte[] bt = DES.encrypt(input, key.getBytes());
	        System.out.println(bt.length);
	        for(int i=0;i<bt.length;i++)
	        { System.out.print(String.format("%02X", bt[i]));}
	        
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  