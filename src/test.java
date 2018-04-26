import util.Encrypt.DES;

class test  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String data = "I am Rainy";
        String key = "12345678";
        try {
			String result = DES.encrypt(data, key);
	        System.out.println("DES result:" + result);
	        String org = DES.decrypt(result, key);
	        System.out.println("DES org:" + org);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  