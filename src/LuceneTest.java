import java.util.List;

import util.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String file1Content1 = "abc efg hijk lmn cccc";
        String file1Content2 = "abc hijk efg ddddd";
        try {
        	System.out.println("Add Index Test");
        	//LuceneUtil2.addIndex("1-0",1,file1Content1,"doc");
        	//LuceneUtil2.addIndex("1-1",1,file1Content2,"doc");
        	//LuceneUtil2.addIndex("2-0",2,file1Content1,"doc");
        	//LuceneUtil2.addIndex("2-1",2,file1Content2,"doc");
        	//LuceneUtil2.addIndex("3-0",3,file1Content1,"doc");
        	//LuceneUtil2.addIndex("3-1",3,file1Content2,"doc");
        	
        	LuceneUtil2.addIndexForDoc(1,"C:/Users/Administrator/Desktop/77777ddd.txt","doc");
        	List<String> list = LuceneUtil2.search("INNNNN","doc");
        	System.out.println("Search Result count " + list.size());
        	for(int i=0; i < list.size(); i++)
        	{
        		System.out.println(list.get(i));
        	}
        	
        	System.out.println("根据docId查找id");
        	List<String> idlist = LuceneUtil2.getIdListForDoc(1,"doc");
        	for(int i=0; i < idlist.size(); i++)
        	{
        		System.out.println(idlist.get(i));
        	}
        	
        	System.out.println("Delete Index Test");
        	LuceneUtil2.deleteIndex("1-0","doc");
           	LuceneUtil2.deleteIndex("1-1","doc");
        	LuceneUtil2.deleteIndex("2-0","doc");
           	LuceneUtil2.deleteIndex("2-1","doc");
           	LuceneUtil2.deleteIndex("3-0","doc");
           	LuceneUtil2.deleteIndex("3-1","doc");
           	list = LuceneUtil2.search("cccc","doc");
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