package com.DocSystem.test;
import java.io.File;
import java.io.IOException;
 
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.document.IntField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.wltea.analyzer.lucene.IKAnalyzer;

class LuceneBasicTest  
{        
    private static String path = "d:/index";

     
    public static void main(String[] args){
    	System.out.println("addIndex");
    	//addIndex(5,"1","55");
    	//addIndex(5,"1","66");
    	//addIndex(5,"1","77");
    	//addIndex(5,"1","88");
     	//updateIndex();
    	System.out.println("search");
        search("55"); 
        search("66"); 
        search("77"); 
        search("88"); 
    }
     
    public static void addIndex(Integer id,String docId,String content){
        try {
        	Analyzer analyzer = new IKAnalyzer();
        	Directory directory = FSDirectory.open(new File(path));

            IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_CURRENT, analyzer);
        	
            IndexWriter write =  new IndexWriter(directory, config);
            
            Document doc = new Document();
            doc.add(new IntField("id", id, Store.YES));
            doc.add(new TextField("docId", docId, Store.YES));
            doc.add(new TextField("content", content, Store.YES));
            write.addDocument(doc);
            
            write.close(); 
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
     
     
    public static void updateIndex(){
        try {
        	Analyzer analyzer = new IKAnalyzer();
        	Directory directory = FSDirectory.open(new File(path)); 
            IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_CURRENT, analyzer);
        	IndexWriter write =  new IndexWriter(directory, config);
            
            Document docNew = new Document();
            docNew.add(new TextField("id","123456",Store.YES));
            docNew.add(new TextField("content","第一",Store.YES));
            Term term = new Term("id","123456");
            /**
              调用updateDocument的方法，传给它一个新的doc来更新数据，
              Term term = new Term("id","1234567");
              先去索引文件里查找id为1234567的Doc,如果有就更新它(如果有多条，最后更新后只有一条)。如果没有就新增.
             
              数据库更新的时候，我们可以只针对某个列来更新，而lucene只能针对一行数据更新。
             */
            write.updateDocument(term, docNew);
             
            write.close();
             
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
     
    public static void search(String str){
        try {
            Directory directory = FSDirectory.open(new File(path));
            DirectoryReader ireader = DirectoryReader.open(directory);
            IndexSearcher isearcher = new IndexSearcher(ireader);
            
            Analyzer analyzer = new IKAnalyzer();
            QueryParser parser = new QueryParser(Version.LUCENE_CURRENT, "content",analyzer);
            Query query =  parser.parse(str);
            
            ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
            
            for (int i = 0; i < hits.length; i++) {
	            	Document hitDoc = isearcher.doc(hits[i].doc);
	                System.out.println("own id = " + hitDoc.get("id"));
	                System.out.println("docId = "+ hitDoc.get("docId"));
	                System.out.println("content = "+ hitDoc.get("content"));
	                System.out.println("");
            	}
                 
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
} 