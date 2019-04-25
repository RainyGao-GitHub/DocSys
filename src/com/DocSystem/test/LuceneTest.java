package com.DocSystem.test;
import java.util.List;

import util.LuceneUtil.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        String content = "abc efg hijk lmn 7788 国家";
       // String file1Content2 = "abc hijk efg ddddd 中国";
        try {
        	System.out.println("************* Add Index Test ****************");
        	//LuceneUtil2.addIndexForVDoc(1,content,"doc");        	
        	//LuceneUtil2.addIndexForRDoc(1,"C:/Users/Administrator/Desktop/77777ddd.txt","doc");
        	//LuceneUtil2.addIndexForRDoc(1,"C:/Users/Administrator/Desktop/CommitFailTest.xlsx","doc");
        	//LuceneUtil2.addIndexForRDoc(1,"C:/Users/Administrator/Desktop/getHistoryDoc.js","doc");
        	//LuceneUtil2.addIndexForRDoc(1,"C:\\Users\\ragao\\Desktop\\Rainy\\DocSys仓库详情页面布局需求.docx","doc");
        	//LuceneUtil2.addIndexForRDoc(1,"C:\\Users\\ragao\\Desktop\\Rainy\\ci_dspnyq.log","doc");
        	LuceneUtil2.addIndexForRDoc(1,"C:\\Users\\ragao\\Desktop\\Rainy\\URLProtocol.html","doc");
        	
        	System.out.println("************* Search Test ****************");
        	LuceneUtil2.fuzzySearch("国家","doc");
        	
        	System.out.println("*********** Delete Index Test *********** ");
           	//LuceneUtil2.deleteIndexForDoc(1,"doc");
           	LuceneUtil2.deleteIndexForVDoc(1,"doc");
           	LuceneUtil2.deleteIndexForRDoc(1,"doc");
           	System.out.println("************* Search Test after delete****************");
        	LuceneUtil2.fuzzySearch("国家","doc");
        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }  
}  