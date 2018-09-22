/**
 * 
 */
package util;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field.Store;
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

/**  
 * 类描述：   lucene索引增删改查的公共类
 * 创建人：zhanjp
 * 创建时间：2015-12-7 上午9:24:32
 * @version    
 *    
 */
public class LuceneUtil2 {

	// 保存路径
    private static String INDEX_DIR = ReadProperties.read("docSysConfig.properties", "lucenePath");
    private static Analyzer analyzer = null;
    private static Directory directory = null;
    private static IndexWriter indexWriter = null;

    public static void main(String[] args) {
        try {
//            index();
            search("man","user");
//            insert();
//            delete("text5");
//            update();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 更新索引
     * @param id
     * @param content
     * @param type
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static void update(String id,String content,String type) throws Exception {
//        String text1 = "update,hello,man!";
        Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator + type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);
         
        Document doc1 = new Document();
        doc1.add(new TextField("id", id, Store.YES));
        doc1.add(new TextField("content", content, Store.YES));
        
        indexWriter.updateDocument(new Term("id",id), doc1);
        indexWriter.close();
         
        Date date2 = new Date();
        System.out.println("更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }
    
    /**
     * 删除索引
     * 
     * @param str 删除的关键字
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static void delete(String id,String type) throws Exception {
        Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator + type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);
        
        indexWriter.deleteDocuments(new Term("id",id));  
        
        indexWriter.close();
        
        Date date2 = new Date();
        System.out.println("删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }
    
    /**
     * 增加索引
     * 
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static void insert() throws Exception {
        String text5 = "hello,goodbye,man,woman";
        Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);

        Document doc1 = new Document();
        doc1.add(new TextField("filename", "text5", Store.YES));
        doc1.add(new TextField("content", text5, Store.YES));
        indexWriter.addDocument(doc1);

        indexWriter.commit();
        indexWriter.close();

        Date date2 = new Date();
        System.out.println("增加索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }
    
    /**
     * 简历索引
     * @param id
     * @param content
     * @param type 'project' or 'service' or 'user'
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static void index(String id,String content,String type) throws Exception {
        
//        String text1 = "hello,man!";
//        String text2 = "goodbye,man!";
//        String text3 = "hello,woman!";
//        String text4 = "goodbye,woman!";
        
        Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator+ type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);

        Document doc = new Document();
        doc.add(new TextField("id", id, Store.YES));
        doc.add(new TextField("content", content, Store.YES));
        indexWriter.addDocument(doc);
        
        indexWriter.commit();
        indexWriter.close();

        Date date2 = new Date();
        System.out.println("创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }

    /**
     * 关键字查询
     * 
     * @param str
     * @param type 'project' or 'service' or 'user'
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static List<String> search(String str,String type) throws Exception {
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator +type));
        analyzer = new IKAnalyzer();
        DirectoryReader ireader = DirectoryReader.open(directory);
        IndexSearcher isearcher = new IndexSearcher(ireader);

        QueryParser parser = new QueryParser(Version.LUCENE_CURRENT, "content",analyzer);
        Query query = parser.parse(str);

        ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
        List<String> res = new ArrayList<String>();
        for (int i = 0; i < hits.length; i++) {
            Document hitDoc = isearcher.doc(hits[i].doc);
            res.add(hitDoc.get("id"));
            System.out.println(hitDoc.get("id"));
            System.out.println(hitDoc.get("content"));
        }
        ireader.close();
        directory.close();
        return res;
    }
}
