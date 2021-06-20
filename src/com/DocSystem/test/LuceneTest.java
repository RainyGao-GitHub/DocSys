package com.DocSystem.test;
import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.wltea.analyzer.lucene.IKAnalyzer;

import com.DocSystem.common.HitDoc;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import util.LuceneUtil.LuceneUtil2;

class LuceneTest  
{  
    public static void main(String[] args)    
    {  
    	//TestAddIndexForFileAndSearch();
    	
    	TestFailedAddIndex();
    }

	private static void TestFailedAddIndex() {
		
        String indexLib = "C:/Windows/Test/";
        addIndex(indexLib);
	}
	
	protected static boolean addIndex(String indexLib)
    {	    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = new Document();	
	        document.add(new StringField("id", "1", Store.YES));
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
			Date date2 = new Date();
	        System.out.println("addIndex() 创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        System.out.println("addIndex() 异常");
			e.printStackTrace();
			return false;
		}
    }
	
	protected static void closeResource(IndexWriter indexWriter, Directory directory, Analyzer analyzer) {
		try {
        	if(indexWriter!=null)
        	{
        		indexWriter.close();
        	}
		} catch (IOException e1) {
			e1.printStackTrace();
		}
		
		if(directory != null)
		{
			try {
				directory.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		if(analyzer != null)
		{
			analyzer.close();
		}
	}

	private static void TestAddIndexForFileAndSearch() {
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
 			int hitType = 2; //文件内容
 			LuceneUtil2.search(repos, null, "国家" , "", "content", "doc", searchResult, searchType, weight, hitType);
         	
         	System.out.println("*********** Delete Index Test *********** ");
            	//LuceneUtil2.deleteIndexForDoc(1,"doc");
            	LuceneUtil2.deleteDoc(doc, "doc");
            	LuceneUtil2.deleteDoc(doc, "doc");
            	System.out.println("************* Search Test after delete****************");
            	hitType = 4; //文件备注
            	LuceneUtil2.search(repos, null, "国家" , "", "content", "doc", searchResult, searchType, weight, hitType);
         } catch (Exception e) {
 			// TODO Auto-generated catch block
 			e.printStackTrace();
 		}
	}  
    
    
    
    
}  