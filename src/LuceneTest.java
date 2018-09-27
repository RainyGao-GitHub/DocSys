import java.util.List;

import util.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String file1Content = "abc efg hijk lmn";
        String file2Content = "abc hijk efg";
        try {
        	LuceneUtil2.update("1", file1Content,"doc");
        	LuceneUtil2.update("2", file2Content,"doc");
        	List<String> list = LuceneUtil2.search("abc","doc");
        	System.out.println("Search Result count " + list.size());
        	for(int i=0; i < list.size(); i++)
        	{
        		System.out.println(list.get(i));
        	}
        	
        	LuceneUtil2.update("1", "abc","doc");
        	LuceneUtil2.update("2", "EFG H","doc");
        	list = LuceneUtil2.search("abc","doc");
        	System.out.println("Search Result count " + list.size());
        	for(int i=0; i < list.size(); i++)
        	{
        		System.out.println(list.get(i));
        	}
        	
        	LuceneUtil2.delete("1","doc");
        	LuceneUtil2.delete("2","doc");
        	list = LuceneUtil2.search("abc","doc");
        	System.out.println("Search Result count " + list.size());
        	for(int i=0; i < list.size(); i++)
        	{
        		System.out.println(list.get(i));
        	}
        	
        	LuceneUtil2.insert();
        	list = LuceneUtil2.search("abc","doc");
        	System.out.println("Search Result count " + list.size());
        	for(int i=0; i < list.size(); i++)
        	{
        		System.out.println(list.get(i));
        	}
        	
        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  