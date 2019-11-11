package com.DocSystem.test;
import java.util.HashMap;

import com.DocSystem.common.HitDoc;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

import util.LuceneUtil.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String content = "abc efg hijk lmn 7788 国家";
       // String file1Content2 = "abc hijk efg ddddd 中国";
       
        Repos repos = new Repos();
        Doc doc = new Doc();
        try {
        	System.out.println("************* Add Index Test ****************");
        	LuceneUtil2.addIndexForFile("C:\\Users\\ragao\\Desktop\\Rainy\\URLProtocol.html", doc,"doc");
        	
        	System.out.println("************* Search Test ****************");
        	HashMap<String, HitDoc> searchResult = new HashMap<String, HitDoc>();
			int searchType = 5; //
			int weight = 1;
			LuceneUtil2.search(repos, "国家" , "", "content", "doc", searchResult, searchType, weight);
        	
        	System.out.println("*********** Delete Index Test *********** ");
           	//LuceneUtil2.deleteIndexForDoc(1,"doc");
           	LuceneUtil2.deleteDoc(doc, "doc");
           	LuceneUtil2.deleteDoc(doc, "doc");
           	System.out.println("************* Search Test after delete****************");
           	LuceneUtil2.search(repos, "国家" , "", "content", "doc", searchResult, searchType, weight);
        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  