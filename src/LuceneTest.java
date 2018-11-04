import java.util.List;

import util.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String content = "abc efg hijk lmn ccccccccccccccccccccccc 国家";
       // String file1Content2 = "abc hijk efg ddddd 中国";
        try {
        	System.out.println("************* Add Index Test ****************");
        	//LuceneUtil2.addIndexForVDoc(1,content,"doc");        	
        	LuceneUtil2.addIndexForRDoc(1,"C:/Users/Administrator/Desktop/77777ddd.txt","doc");
        	
        	System.out.println("************* Search Test ****************");
        	LuceneUtil2.fuzzySearch("不一一","doc");
        	
        	System.out.println("*********** Delete Index Test *********** ");
           	LuceneUtil2.deleteIndexForDoc(1,"doc");
           	LuceneUtil2.fuzzySearch("不一一","doc");
        	
        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  