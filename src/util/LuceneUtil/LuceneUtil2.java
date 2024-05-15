/**
 * 
 */
package util.LuceneUtil;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Field.Index;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.document.IntField;
import org.apache.lucene.document.LongField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanClause.Occur;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.NumericRangeQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.extractor.PowerPointExtractor;
import org.apache.poi.hssf.extractor.ExcelExtractor;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Paragraph;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;
import org.apache.poi.xslf.extractor.XSLFPowerPointExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xssf.extractor.XSSFExcelExtractor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.wltea.analyzer.lucene.IKAnalyzer;

import com.DocSystem.common.ActionContext;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.FolderUploadAction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.Log;
import com.DocSystem.common.Path;
import com.DocSystem.common.CommitAction.CommitAction;
import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.common.entity.CommitEntry;
import com.DocSystem.common.entity.CommitLog;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import java.math.BigDecimal;

import util.FileUtil.FileUtils2;

/*
 * Lucene全文搜索工作原理：
 * Lucene数据库中包括两个最重要的内容：索引表和Document，Lucene应该是每一个Field会有一个索引表，这是为什么可以可以根据不同Field进行搜索的原因
 * 1. 索引的建立（新增Document并根据Document每个Field的内容更新索引表）
 *  对Document的Field的内容进行切词，例如 “我们，一起出去” 切成多个Term “我” “们” “一” “起” “出” “去” “我们” “出去”（不同的切词器的结果会不一样），如果不进行切词的话那么整个会被当做一个Term
 *  每个Term被转换成HashCode，放入HashMap<HashCode, DocumentIdList>,所以HashCode可以快速找到包含了该Term的文档ID
 * 2. 搜索
 * 	将用户输入的关键字转换成HashCode，相应的Field的索引表里有对应的HashCode(Term)，如果存在则根据DocementIdList找到DocumentList并返回，因此理论上Lucene库本身只支持精确查找
 * 为了实现智能查找的功能（通常用户也只能模糊记得一些关键字），所以实际应用中需要先对用户输入的关键字进行切词处理，根据关键字命中次数进行排序，这样用户就能得到他所期望的结果
 *  
 * */

/**  
 * 类描述：全文搜索库
 * 创建人：Rainy Gao
 * 创建时间：2018-10-1
 * @version 1.00   
 * @Description
 * 功能: 该搜索引擎接口支持通过文件名、文件内容和备注内容进行搜索，搜索结果包含文件路径、文件名、HashId、docId、luceneDocumentId
 * 实现原理: 
 * （1）文件内容和备注内容，通过索引库进行查询（分别建库以便能够进行分类搜索）
 * （2）文件名需要支持部分匹配，通过查找Lucene Document的name字段来实现
 */
@SuppressWarnings("deprecation")
public class LuceneUtil2   extends BaseFunction
{   
	//IndexLib Lock
	protected static ConcurrentHashMap<String, Object> indexLibLockHashMap = new ConcurrentHashMap<String, Object>();	

	public static boolean deleteIndexLib(String indexLib)
    {
		Object synclock = getSyncLock(indexLib);
		boolean ret = false;

		String lockInfo = "LuceneUtil2 deleteIndexLib synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("DocIndexLib", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
			
    	ret = FileUtil.delFileOrDir(indexLib);
    		
    	unlockSyncSource(lockName, systemUser);
    	return ret;
    }
	
    
    
    private static Object getSyncLock(String indexLib) {
		Object synclock = indexLibLockHashMap.get(indexLib);
    	if(synclock == null)
    	{
    		Log.debug("LuceneUtil2 getSyncLock() synclock for " + indexLib + " is null, do create");
    		synclock = new Object();
    		indexLibLockHashMap.put(indexLib, synclock);
    	}
    	return synclock;
	}



	/**
	 *
	 * 功能: 在指定的索引库里增加索引文件
     * @param content 
     * @param id: lucene document id 在当前索引库具有唯一性（使用 HashId_index来标识），以便更新索引时能够快速查找到，多个id可以对应一个相同的文件（文件内容过多无法一次性建立索引的情况） 
     * @param reposId:  文件所在仓库ID 
     * @param parentPath:  文件所在目录 
     * @param name:  文件名
     * @param docId:  docId of DocSys In DataBase 
     * @param content: 文件名、文件内容或备注内容
     * @param indexLib: 索引库名字（不同仓库将使用不同的索引库，便于整个仓库重建索引或删除时操作方便）
	 * @return 
     */
    public static boolean addIndex(Doc doc, String content, String indexLib)
    {	
    	Log.debug("addIndex() docId:"+ doc.getDocId() + " pid:" + doc.getPid() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);    	
    	//Log.debug("addIndex() content:" + content);
    	Date date1 = new Date();
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndex synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("DocIndexLib", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
			
		try {
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = buildDocument(doc, content);
	        indexWriter.addDocument(document);
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
	        //Log.debug("addIndex() Success id:" + doc.getId() + " docId:"+ doc.getDocId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);	        
	        ret = true;
		} catch (Exception e) {				
	        Log.debug("addIndex() 异常");
	        Log.debug(e);
		} finally {
			closeResource(indexWriter, directory, analyzer);
		}
    	
		unlockSyncSource(lockName, systemUser);

		Date date2 = new Date();
        Log.debug("创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms for [" + doc.getPath() + doc.getName() + "]\n");
    	return ret;
    }

	protected static void closeResource(IndexWriter indexWriter, Directory directory, Analyzer analyzer) {
		try {
        	if(indexWriter!=null)
        	{
        		indexWriter.close();
        	}
		} catch (IOException e1) {
			Log.debug(e1);
		}
		
		if(directory != null)
		{
			try {
				directory.close();
			} catch (IOException e) {
				Log.debug(e);
			}
		}
		if(analyzer != null)
		{
			analyzer.close();
		}
	}

	private static Document buildDocument(Doc doc, String content) {
		Document document = new Document();
		if(doc.getVid() != null)
		{
			document.add(new IntField("vid", doc.getVid(), Store.YES));
		}
		else
		{
			Log.debug("buildDocument() vid is null");
		}
		
		if(doc.getPid() != null)
		{
			document.add(new LongField("pid", doc.getPid(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
		}
		else
		{
			Log.debug("buildDocument() pid is null");
		}
		
		if(doc.getDocId() != null)
		{
			document.add(new LongField("docId", doc.getDocId(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
		}
		else
		{
			Log.debug("buildDocument() docId is null");
		}
		
		if(doc.getPath() != null)
		{
			document.add(new Field("path", doc.getPath(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));	
		}
		else
		{
			Log.debug("buildDocument() path is null");
		}
		
		if(doc.getName() != null)
		{
			document.add(new Field("name", doc.getName(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));	
			//nameForSearch需要全部转成小写，用于支持大小写搜索
			document.add(new Field("nameForSearch", doc.getName().toLowerCase(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));
		}
		else
		{
			Log.debug("buildDocument() name is null");
		}
		
		if(doc.getType() != null)
		{
			document.add(new IntField("type", doc.getType(), Store.YES));	//1: file 2: dir 用来保存Lucene和实际文件的区别
		}
		else
		{
			Log.debug("buildDocument() type is null");
		}
		
		//Size
        if(doc.getSize() != null)
        {
            document.add(new LongField("size", doc.getSize(), Store.YES));
        }
		else
		{
			Log.debug("buildDocument() size is null");
		}

        //createTime
        if(doc.getCreateTime() != null)
        {
            document.add(new LongField("createTime", doc.getCreateTime(), Store.YES));
        }
		else
		{
			Log.debug("buildDocument() createTime is null");
		}
        
        //latestEditTime
        if(doc.getLatestEditTime() != null)
        {
            document.add(new LongField("latestEditTime", doc.getLatestEditTime(), Store.YES));
        }
		else
		{
			Log.debug("buildDocument() latestEditTime is null");
		}

        //Revision
        if(doc.getRevision() != null)
        {
        	document.add(new Field("revision", doc.getRevision(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));
        }
        
        if(doc.commitTime != null)
        {
            document.add(new LongField("commitTime", doc.commitTime, Store.YES));
        }
        
        //Content
        if(content != null)
        {
            document.add(new TextField("content", content, Store.NO));	//Content有可能会很大，所以只切词不保存	
        }        
		return document;
	}
	
	public static Doc BuildDoc(Document document)
	{
		Doc doc = new Doc();
    	//Set Doc 
		String strVid = document.get("vid");
    	if(strVid != null)
    	{
    		doc.setVid(Integer.parseInt(strVid));
    	}

    	String strPid = document.get("pid");
	   	if(strPid != null)
    	{
    		doc.setPid(Long.parseLong(strPid));
    	}

    	String strDocId = document.get("docId");
	   	if(strDocId != null)
    	{
    		doc.setDocId(Long.parseLong(strDocId));
    	}
	   	
    	String strType = document.get("type");
    	if(strType != null)
    	{
    		doc.setType(Integer.parseInt(strType));
    	}
    	
    	
    	String strSize = document.get("size");
	   	if(strSize != null)
    	{
    		doc.setSize(Long.parseLong(strSize));
    	}
	   	
    	String strLatestEditTime = document.get("latestEditTime");
	   	if(strLatestEditTime != null)
    	{
    		doc.setLatestEditTime(Long.parseLong(strLatestEditTime));
    	}
	   	
	   	String strCommitTime = document.get("commitTime");
	   	if(strCommitTime != null)
    	{
    		doc.commitTime = Long.parseLong(strCommitTime);
    	}
	   	
	   	doc.setPath(document.get("path"));
	   	doc.setName(document.get("name"));
	   	doc.setRevision(document.get("revision"));
    	return doc;
    }

	/**
	 * 功能: 在指定的索引库里更新索引文件
	 * @param indexLib2 
     * @param id: lucene document id 在当前索引库具有唯一性（使用 HashId_index来标识），以便更新索引时能够快速查找到，多个id可以对应一个相同的文件（文件内容过多无法一次性建立索引的情况） 
     * @param reposId:  文件所在仓库ID 
     * @param parentPath:  文件所在目录 
     * @param name:  文件名
     * @param docId:  docId of DocSys In DataBase 
     * @param content: 文件名、文件内容或备注内容
     * @param indexLib: 索引库名字（不同仓库将使用不同的索引库，便于整个仓库重建索引或删除时操作方便）
	 * @return 
     */
	//注意该接口似乎无法很好的工作，因此建议使用delete + add来代替
    public static boolean updateIndex(Doc doc, String content, String indexLib)
    {
    	Log.debug("updateIndex() docId:"+ doc.getDocId() + " pid:" + doc.getPid() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);    	
    	//Log.debug("updateIndex() content:" + content);
    	Date date1 = new Date();
    
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;
	
    	boolean ret = false;
    	Object synclock = getSyncLock(indexLib);
    	String lockInfo = "LuceneUtil2 updateIndex synclock:" + indexLib;
    	String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("DocIndexLib", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
			
		try {
	        analyzer = new IKAnalyzer();
    		File file = new File(indexLib);
	        directory = FSDirectory.open(file);
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	         
	        Document document = buildDocument(doc, content);
	        indexWriter.addDocument(document); 
	        
	        indexWriter.updateDocument(new Term("docId",doc.getDocId()+""), document);
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	         
	        ret =  true;			
		} catch (IOException e) {
			Log.debug("updateIndex() 异常");
			Log.debug(e);
		} finally {
			closeResource(indexWriter, directory, analyzer);
		}	
			
		unlockSyncSource(lockName, systemUser);
    	
        Date date2 = new Date();
        Log.debug("更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms for [" + doc.getPath() + doc.getName() + "]\n");
    	return ret;
    }
    
    /**
     * 	删除索引
     * 
     * @param
     * @return 
     * @throws Exception
     */
    public static boolean deleteIndex(Doc doc, String indexLib)
    {
    	Log.debug("deleteIndex() docId:"+ doc.getDocId() + " pid:" + doc.getPid() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);    	
		Date date1 = new Date();

    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;
    	
    	boolean ret  = false;
    	Object synclock = getSyncLock(indexLib);
    	String lockInfo = "LuceneUtil2 deleteIndex synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("DocIndexLib", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
		
		try {
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        Query query =NumericRangeQuery.newLongRange("docId", doc.getDocId(), doc.getDocId(), true,true);
	        indexWriter.deleteDocuments(query);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        
	        ret = true;
		} catch (Exception e) {
			Log.info("deleteIndex() 异常");
			Log.debug(e);
		} finally {
			closeResource(indexWriter, directory, analyzer);					
		}
			
		unlockSyncSource(lockName, systemUser);
   	
        Date date2 = new Date();
        Log.debug("删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms for [" + doc.getPath() + doc.getName() + "]\n");
    	return ret;
    }  
    
    /**
     * 	删除索引
     * 
     * @param id: doc
     * @return 
     * @throws Exception
     */
    public static boolean deleteIndexEx(Doc doc, String indexLib, int deleteFlag)
    {
    	Log.debug("deleteIndexEx() docId:"+ doc.getDocId() + " pid:" + doc.getPid() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);    	    	
		Date date1 = new Date();
		
		boolean ret = deleteIndex(doc, indexLib);
    	if(ret == true)
    	{
    		if(deleteFlag == 2)	//删除该路径下的所有doc的索引
    		{
    			Log.debug("deleteIndexEx() 删除子目录");    	    	            	
		    	Analyzer analyzer = null;
		    	Directory directory = null;
		    	IndexWriter indexWriter = null;
		    	
		    	Object synclock = getSyncLock(indexLib);
	    		String lockInfo = "LuceneUtil2 deleteIndexEx synclock:" + indexLib;
		    	String lockName = "indexLibSyncLock" + indexLib;
				if(false == lockSyncSource("DocIndexLib", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
				{
					return false;
				}
					
				try {
					directory = FSDirectory.open(new File(indexLib));
				
			        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
			        indexWriter = new IndexWriter(directory, config);
			        
			        String docPath = doc.getPath() + doc.getName() + "/";
			        Term term = new Term("path", docPath + "*");
			        Query query = new WildcardQuery(term);
			        //Query query = new PrefixQuery(new Term("path", docPath));
			        
			        indexWriter.deleteDocuments(query);
			        indexWriter.commit();
		
			        indexWriter.close();
			        indexWriter = null;
			        directory.close();
			        directory = null;
			        
				} catch (Exception e) {
					Log.info("deleteIndexEx() 异常");
					Log.debug(e);
				} finally {
					closeResource(indexWriter, directory, analyzer);
				}
					
				unlockSyncSource(lockName, systemUser);
	    	}
    	}
    	
        Date date2 = new Date();
        Log.debug("删除子目录索引耗时：" + (date2.getTime() - date1.getTime()) + "ms for [" + doc.getPath() + doc.getName() + "]\n");
    	return ret;
    } 


	public static boolean smartSearch(Repos repos, List<QueryCondition> preConditions, String field, String str, String pathFilter, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight, int hitType)
	{
		Log.debug("smartSearch() keyWord:" + str + " field:" + field + " indexLib:" + indexLib);

		//利用Index的切词器将查询条件切词后进行精确查找
		Analyzer analyzer = null;
		TokenStream stream = null;

		List <String> list = new ArrayList<String>();
		try {
			analyzer = new IKAnalyzer();;
			stream = analyzer.tokenStream("field", new StringReader(str));
			
			//保存分词后的结果词汇
			CharTermAttribute cta = stream.addAttribute(CharTermAttribute.class);
	
			stream.reset(); //这句很重要
	
			while(stream.incrementToken()) {
				Log.debug("smartSearch() subKeyword:" + cta.toString());
				list.add(cta.toString());
			}
	
			stream.end(); //这句很重要
		} catch (Exception e) {
			Log.debug(e);
		} finally {
			if(stream != null)
			{
				try {
					stream.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			if(analyzer != null)
			{
				analyzer.close();
			}
		}
		
		if(list.size() > 0)
		{
			return search(repos, preConditions, field, list, pathFilter, indexLib, searchResult, searchType, weight, hitType);
		}
		
		return false;
		/*
		if(list.size() == 1)
		{
			String searchStr = list.get(0);
			Log.debug("smartSearch subSearchStr[0]:" + searchStr);
			return search(repos, preConditions, field, searchStr, pathFilter, indexLib, searchResult, searchType, weight, hitType);
		}
		
		List<HashMap<String, HitDoc>> subSearcResults = new ArrayList<HashMap<String, HitDoc>>();
		for(int i=0; i<list.size(); i++)
		{
			HashMap<String, HitDoc> subSearchResult = new HashMap<String, HitDoc>();
			String searchStr = list.get(i);
			Log.debug("smartSearch subSearchStr[" + i + "]:" + searchStr);
			search(repos, preConditions, field, searchStr, pathFilter, indexLib, subSearchResult, searchType, weight, hitType);
			if(subSearchResult.size() <= 0)
			{
				//subSearchStr Not found
				return false;
			}
			
			//Add subSearchResult to results
			subSearcResults.add(subSearchResult);
		}
		
		combineSubSearchResults(subSearcResults, searchResult);		
		return true;
		*/
    }
	
	public static boolean smartSearchEx(Repos repos, List<QueryCondition> preConditions, String field, String str, String pathFilter, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight, int hitType)
	{
		Log.debug("smartSearch() keyWord:" + str + " field:" + field + " indexLib:" + indexLib);

		//利用Index的切词器将查询条件切词后进行精确查找
		Analyzer analyzer = null;
		TokenStream stream = null;

		List <String> list = new ArrayList<String>();
		try {
			analyzer = new IKAnalyzer();;
			stream = analyzer.tokenStream("field", new StringReader(str));
			
			//保存分词后的结果词汇
			CharTermAttribute cta = stream.addAttribute(CharTermAttribute.class);
	
			stream.reset(); //这句很重要
	
			while(stream.incrementToken()) {
				Log.debug("smartSearch() subKeyword:" + cta.toString());
				list.add(cta.toString());
			}
	
			stream.end(); //这句很重要
		} catch (Exception e) {
			Log.debug(e);
		} finally {
			if(stream != null)
			{
				try {
					stream.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			if(analyzer != null)
			{
				analyzer.close();
			}
		}
		
		if(list.size() > 0)
		{
			//如果第一个字符和str相同，那么结果不一定存在，因此需要去掉整个字符串再搜索
			if(list.size() > 1)
			{
				if(list.get(0).equals(str.toLowerCase()))
				{
					list.remove(0);
				}
			}
			return search(repos, preConditions, field, list, pathFilter, indexLib, searchResult, searchType, weight, hitType);
		}
		
		return false;
    }
	
    
    /**
     * 	关键字模糊查询， 返回docId List
     * @param weight 
     * @param hitType 
     * @param parentPath 
     * @param <SearchResult>
     * @param str: 关键字
     * @param indexLib: 索引库名字
     */
    public static boolean search(Repos repos, List<QueryCondition> preConditions, String field, String str, String pathFilter, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight, int hitType)
	{
		Log.debug("search() keyWord:" + str + " field:" + field + " indexLib:" + indexLib + " searchType:"+ searchType + " weight:" + weight + " pathFilter:" + pathFilter);		
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		if(str != null && !str.isEmpty())
		{
			QueryCondition condition = new QueryCondition();
			condition.setField(field);
			condition.setValue(str);
			condition.setQueryType(searchType);
			conditions.add(condition);
		}
		
		if(pathFilter != null && !pathFilter.isEmpty())
		{
			QueryCondition pathFilterCondition = new QueryCondition();
			pathFilterCondition.setField("path");
			pathFilterCondition.setValue(pathFilter);
			pathFilterCondition.setQueryType(QueryCondition.SEARCH_TYPE_Wildcard_Prefix);
			conditions.add(pathFilterCondition);
		}
		
		if(preConditions != null)
		{
			conditions.addAll(preConditions);
		}
		
		if(conditions.size() == 0)
		{
			return false;
		}
	    return multiSearch(repos, conditions, indexLib, searchResult, weight, hitType);
    }
    
    /**
     * 	关键字模糊查询， 返回docId List
     * @param weight 
     * @param hitType 
     * @param parentPath 
     * @param <SearchResult>
     * @param strList: 关键字列表
     * @param indexLib: 索引库名字
     */
    public static boolean search(Repos repos, List<QueryCondition> preConditions, String field, List<String> strList, String pathFilter, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight, int hitType)
	{
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		for(int i = 0; i < strList.size(); i++)
		{
			String str = strList.get(i);
			Log.debug("search() subKeyWord[" + i + "]:" + str + " field:" + field + " indexLib:" + indexLib + " searchType:"+ searchType + " weight:" + weight + " pathFilter:" + pathFilter);						
			if(str != null && !str.isEmpty())
			{
				QueryCondition condition = new QueryCondition();
				condition.setField(field);
				condition.setValue(str);
				condition.setQueryType(searchType);
				conditions.add(condition);
			}
		}
		
		if(pathFilter != null && !pathFilter.isEmpty())
		{
			QueryCondition pathFilterCondition = new QueryCondition();
			pathFilterCondition.setField("path");
			pathFilterCondition.setValue(pathFilter);
			pathFilterCondition.setQueryType(QueryCondition.SEARCH_TYPE_Wildcard_Prefix);
			conditions.add(pathFilterCondition);
		}
		
		if(preConditions != null)
		{
			conditions.addAll(preConditions);
		}
		
		if(conditions.size() == 0)
		{
			return false;
		}
	    return multiSearch(repos, conditions, indexLib, searchResult, weight, hitType);
    }
    
    public static boolean multiSearch(Repos repos, List<QueryCondition> conditions, String indexLib, HashMap<String, HitDoc> searchResult, int weight, int hitType)
	{
		Log.debug("multiSearch() indexLib:" + indexLib + " weight:" + weight);
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiSearch() indexLib:" + indexLib + " 不存在！");
    			return false;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);

	        BooleanQuery builder = buildBooleanQueryWithConditions(conditions);
	        if(builder != null)
	        {
	        	TopDocs hits = isearcher.search(builder, 1000);
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document hitDocument = isearcher.doc( scoreDoc.doc );
		            HitDoc hitDoc = BuildHitDocFromDocument(repos, hitDocument);
		            if(hitDoc == null)
		            {
		            	continue;
		            }
		            HitDoc.AddHitDocToSearchResult(searchResult,hitDoc, "multiSearch", weight, hitType);
	        	}
	        }
	        
	        ireader.close();
	        ireader = null;
	        directory.close();
	        directory=null;        
			return true;
		} catch (Exception e) {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					Log.debug(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					Log.debug(e1);
				}
			}
			
			Log.debug("search() 异常");
			Log.debug(e);
			return false;
		}
    }
    

	private static List<QueryCondition> buildQueryConditionsForDoc(Doc doc) 
	{
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		
		if(doc.getVid() != null)
		{
			QueryCondition condition = new QueryCondition();
	        condition.setField("vid");
	        condition.setValue(doc.getVid());
	        condition.setFieldType(QueryCondition.FIELD_TYPE_Integer);
	        conditions.add(condition);
		}
		
		if(doc.getPid() != null)
		{
			QueryCondition condition = new QueryCondition();
	        condition.setField("pid");
	        condition.setValue(doc.getPid());
	        condition.setFieldType(QueryCondition.FIELD_TYPE_Long);
	        conditions.add(condition);
		}
		
		if(doc.getDocId() != null)
		{
			QueryCondition condition = new QueryCondition();
	        condition.setField("docId");
	        condition.setValue(doc.getDocId());
	        condition.setFieldType(QueryCondition.FIELD_TYPE_Long);
	        conditions.add(condition);
		}
		
		if(doc.getPath() != null)
		{
			QueryCondition condition = new QueryCondition();
	        condition.setField("path");
	        condition.setValue(doc.getPath());
	        conditions.add(condition);
		}
		if(doc.getName() != null)
		{
			QueryCondition condition = new QueryCondition();
	        condition.setField("name");
	        condition.setValue(doc.getName());
	        conditions.add(condition);
		}
		return conditions;
	}
	
	private static BooleanQuery buildBooleanQueryForDoc(Doc doc) 
	{
		List<QueryCondition> conditions = buildQueryConditionsForDoc(doc);
		return buildBooleanQueryWithConditions(conditions);
	}
	
    
    public static BooleanQuery buildBooleanQueryWithConditions(List<QueryCondition> conditions) 
	{
    	if(conditions == null || conditions.size() == 0)
    	{
    		return null;
    	}
    	
		int count = 0;
		BooleanQuery builder = new BooleanQuery();
		Query query = null;
    	for(int i=0; i<conditions.size(); i++)
    	{
    		QueryCondition condition = conditions.get(i);
    		String field = condition.getField();
    		//Log.debug("buildBooleanQueryWithConditions field:" + field + " fieldType:" + condition.getFieldType());
    		Object value = condition.getValue();
    		Object endValue = condition.getEndValue();
    		Occur occurType = condition.getOccurType();
    		switch(condition.getFieldType())
    		{
    		case QueryCondition.FIELD_TYPE_Integer:
    	        query = NumericRangeQuery.newIntRange(field, (Integer)value, (Integer)value, true,true);
    			builder.add(query, occurType);
    			count++;
    	        break;
    		case QueryCondition.FIELD_TYPE_Integer_Range:
    	        query = NumericRangeQuery.newIntRange(field, (Integer)value, (Integer)endValue, true,true);
    			builder.add(query, occurType);
    			count++;
    	        break;
    		case QueryCondition.FIELD_TYPE_Long:
    	        query = NumericRangeQuery.newLongRange(field, (Long)value, (Long)value, true,true);   
    			builder.add(query, occurType);
    			count++;
    			break;
    		case QueryCondition.FIELD_TYPE_Long_Range:
    	        query = NumericRangeQuery.newLongRange(field, (Long)value, (Long)endValue, true,true);   
    			builder.add(query, occurType);
    			count++;
    			break;
    		case QueryCondition.FIELD_TYPE_String:
    			query = buidStringQuery(field, (String)value, condition.getQueryType());
    			builder.add(query, occurType);
    			count++;  
    			break;
    		}    		
    	}
		if(count > 0)
		{
			return builder;
		}
		return null;
	}

	private static Query buidStringQuery(String field, String value, Integer queryType) {
		Query query = null;
        try {
	
			switch(queryType)
			{
			case QueryCondition.SEARCH_TYPE_Term:
				query = new TermQuery(new Term(field, value)); 
				break;
	        case QueryCondition.SEARCH_TYPE_Wildcard: //通配
	        	query = new WildcardQuery(new Term(field,"*" + value + "*"));
	        	break;  
	        case QueryCondition.SEARCH_TYPE_Wildcard_Prefix: //通配(前缀)
	        	query = new WildcardQuery(new Term(field, value + "*"));
	        	break;  
	        case QueryCondition.SEARCH_TYPE_Wildcard_Suffix: //通配(后缀)
	        	query = new WildcardQuery(new Term(field,"*" + value));
	        	break;
	        case QueryCondition.SEARCH_TYPE_Fuzzy:	//模糊
	        	query = new FuzzyQuery(new Term(field,value));
	        	break;
	        case QueryCondition.SEARCH_TYPE_IKAnalyzer: //智能 
	        	Analyzer analyzer = new IKAnalyzer();
	        	QueryParser parser = new QueryParser(Version.LUCENE_46, field,analyzer);
				query = parser.parse(value);
				break;
	        case QueryCondition.SEARCH_TYPE_Prefix:	//前缀
	        	query = new PrefixQuery(new Term(field, value));
	        	break;
			}	
        } catch (ParseException e) {
        	Log.info("buidStringQuery() 异常");
			Log.info(e);
		}
		return query;
	}
	
    protected static void combineSubSearchResults(List<HashMap<String, HitDoc>> subSearcResults,
			HashMap<String, HitDoc> searchResult) {
    	for(HitDoc hitDoc: subSearcResults.get(0).values())
        {
    		HitDoc result = getHitDocFromSearchResults(subSearcResults, hitDoc);
    		if(result != null)
    		{
    			searchResult.put(result.getDocPath(), result);
    		}
        }
	}
    
    

	private static HitDoc getHitDocFromSearchResults(List<HashMap<String, HitDoc>> subSearcResults, HitDoc hitDoc) 
	{
		for(int i=1; i<subSearcResults.size(); i++)
		{
			HitDoc tempHitDoc = subSearcResults.get(i).get(hitDoc.getDocPath());
			if(tempHitDoc == null)
			{
				return null;
			}
			
			//总是取最小的hitCount作为搜索结果
			if(hitDoc.getHitCount() > tempHitDoc.getHitCount())
			{
				hitDoc = tempHitDoc;
			}
		}
		return hitDoc;
	}

	private static HitDoc BuildHitDocFromDocument(Repos repos, Document hitDocument) 
    {
    	return BuildHitDocFromDocument_FS(repos, hitDocument);
 	}

	private static HitDoc BuildHitDocFromDocument_FS(Repos repos, Document hitDocument) {
    	//Log.debug("BuildHitDocFromDocument_FS hitDocument docId:" + hitDocument.get("docId") + " pid:" + hitDocument.get("pid")  + " path:" + hitDocument.get("path") + " name:" + hitDocument.get("name") + " type:" + hitDocument.get("type") + " size:" + hitDocument.get("size") + " latestEditTime:" + hitDocument.get("latestEditTime"));

		try {
			String docParentPath = hitDocument.get("path");
	    	String docName =  hitDocument.get("name");
	        	        
	    	//Set Doc 
	    	String strDocId = hitDocument.get("docId");
	    	String strPid = hitDocument.get("pid");
	    	String strType = hitDocument.get("type");
	    	String strSize = hitDocument.get("size");
	    	String strLatestEditTime = hitDocument.get("latestEditTime");
	    	Long docId = null;
	    	if(strDocId != null && !strDocId.isEmpty())
	    	{
	    		docId = Long.parseLong(strDocId);
	    	}

	    	Long pid = null;
	    	if(strPid != null && !strPid.isEmpty())
	    	{
	    		pid = Long.parseLong(strPid);
	    	}
	    	
	    	Integer type = null;
	    	if(strType != null && !strType.isEmpty())
	    	{
	    		type = Integer.parseInt(strType);
	    	}
	    	
	    	Long size = null;
	    	if(strSize != null && !strSize.isEmpty())
	    	{
	    		size = Long.parseLong(strSize);
	    	}
	    	
	    	Long latestEditTime = null;
	    	if(strLatestEditTime != null && !strLatestEditTime.isEmpty())
	    	{
	    		latestEditTime = Long.parseLong(strLatestEditTime);
	    	}
	    	
	    	Doc doc = new Doc();
	    	doc.setVid(repos.getId());
	    	doc.setPid(pid);   	
	    	doc.setDocId(docId);
	    	doc.setPath(docParentPath);
	    	doc.setName(docName);
	    	doc.setType(type);
	    	doc.setSize(size);
	    	doc.setLatestEditTime(latestEditTime);
	
	    	//Set Doc Path
	    	String docPath =  docParentPath + docName;
	    	
	    	//Set HitDoc
	    	HitDoc hitDoc = new HitDoc();
	    	hitDoc.setDoc(doc);
	    	hitDoc.setDocPath(docPath);
	    	
	    	return hitDoc;
        } catch (Exception e) {
			Log.info("BuildHitDocFromDocument_FS() 异常");
			Log.info(e);
			return null;
		}
	}

	public static boolean addIndexForWord(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
    	HWPFDocument doc1 = null;
    	FileInputStream fis = null;
    	
		try {
			StringBuffer content = new StringBuffer("");// 文档内容
	    	fis = new FileInputStream(filePath);
    	
    		doc1 = new HWPFDocument(fis);

    		Range range = doc1.getRange();
    	    int paragraphCount = range.numParagraphs();// 段落
    	    for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
    	    	Paragraph pp = range.getParagraph(i);
    	    	content.append(pp.text());
    	    }
    	    
    		doc1.close();
    		doc1 = null;
    	    fis.close();
    	    fis = null;
    		
    	    ret = addIndex(doc, content.toString().trim(), indexLib);
		} catch (Exception e) {
			Log.info("addIndexForWord() 异常:" + filePath);
    		Log.info(e);
    	}	finally {
			if(doc1 != null)
			{
				try {
					doc1.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
    	}
		return ret;
	}

	public static boolean addIndexForWord2007(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
    	FileInputStream fis = null;
    	XWPFDocument xdoc = null;
    	XWPFWordExtractor extractor = null;
    	
		try {
			File file = new File(filePath);
	    	String str = "";
	    	fis = new FileInputStream(file);
	    	xdoc = new XWPFDocument(fis);
    		extractor = new XWPFWordExtractor(xdoc);
        	
    		str = extractor.getText();       	
        	ret = addIndex(doc,str.toString().trim(), indexLib);
		} catch (Exception e) {	
			Log.info("addIndexForWord2007() 异常:" + filePath);
			Log.info(e);
		} finally {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			
			if(xdoc != null)
			{
				try {
					xdoc.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		}
		return ret;
	}

	public static boolean addIndexForExcel(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
		InputStream is = null;  
        HSSFWorkbook workBook = null;  
        ExcelExtractor extractor = null; 
        
        try {  
	
			is = new FileInputStream(filePath);  
			workBook = new HSSFWorkbook(new POIFSFileSystem(is));  

            extractor=new ExcelExtractor(workBook);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            String text = extractor.getText();  
            ret = addIndex(doc, text.toString().trim(), indexLib);
        } catch(Exception e) {
			Log.info("addIndexForExcel() 异常:" + filePath);
			Log.info(e);
            return false;
        } finally {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}        	
        }
        
        return ret;
	}

	public static boolean addIndexForExcel2007(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
        InputStream is = null;
        XSSFWorkbook workBook = null;  
        XSSFExcelExtractor extractor = null;
        
		try {  
	        is = new FileInputStream(filePath);
        	workBook = new XSSFWorkbook(is);  
            extractor = new XSSFExcelExtractor(workBook);  
            String text = extractor.getText();  
            ret = addIndex(doc, text.toString().trim(), indexLib);
		} catch (Exception e) { 
			Log.info("addIndexForExcel2007() 异常:" + filePath);
			Log.info(e);
        } finally {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
        }      
		return ret;
	}

	public static boolean addIndexForPPT(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
		InputStream is = null;
        PowerPointExtractor extractor = null;  
        
		try {
			is = new FileInputStream(filePath);
            extractor = new PowerPointExtractor(is);  
            String text=extractor.getText();  
            ret = addIndex(doc, text.toString().trim(), indexLib);
		} catch (Exception e) {  
			Log.info("addIndexForPPT() 异常:" + filePath);
			Log.info(e);
        } finally {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
        }        
		return ret;
	}

	public static boolean addIndexForPPT2007(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
		InputStream is = null; 
        XMLSlideShow slide = null;
        XSLFPowerPointExtractor extractor = null;  
        
        try {  
			is = new FileInputStream(filePath); 
	        slide = new XMLSlideShow(is);
            extractor=new XSLFPowerPointExtractor(slide);  
            String text=extractor.getText();  
            ret = addIndex(doc, text.toString().trim(), indexLib);
        } catch (Exception e) {  
			Log.info("addIndexForPPT2007() 异常:" + filePath);
			Log.info(e);
        } finally {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			
			if(slide != null)
			{
				try {
					slide.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
        }
        return ret;
	}
	
	public static boolean addIndexForPdf(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
		PDDocument document = null;
				
		try
		{
			File pdfFile=new File(filePath);			
			document=PDDocument.load(pdfFile);
			int pages = document.getNumberOfPages();
			// 读文本内容
			PDFTextStripper stripper=new PDFTextStripper();
			// 设置按顺序输出
			stripper.setSortByPosition(true);
			stripper.setStartPage(1);
			stripper.setEndPage(pages);
			String content = stripper.getText(document);
			
            ret = addIndex(doc, content, indexLib);
	   } catch(Exception e) {		
			Log.info("addIndexForPdf() 异常:" + filePath);
			Log.info(e);
	   } finally {
			if(document != null)
			{
				try {
					document.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}	
	   }
	   return ret;
	}

	public static boolean addIndexForFile(String filePath, Doc doc, String indexLib)
	{
		boolean ret = false;
		InputStream is = null;
		BufferedReader reader = null;
		
		try {
			int bufSize = 0;
			StringBuffer buffer = new StringBuffer();
			String code = FileUtils2.getFileEncode(filePath);
			if(FileUtils2.isBinaryFile(code) == true)
			{
				Log.debug("addIndexForFile() BinaryFile will not add Index");
				return true;
			}
			
			is = new FileInputStream(filePath);
			String line; // 用来保存每行读取的内容
			reader = new BufferedReader(new InputStreamReader(is, code));
			line = reader.readLine(); // 读取第一行
			while (line != null) { // 如果 line 为空说明读完了
				buffer.append(line); // 将读到的内容添加到 buffer 中
				buffer.append("\n"); // 添加换行符
				line = reader.readLine(); // 读取下一行
				
				bufSize = buffer.length();
				if(bufSize >= 10485760)	//10MByte
				{
					addIndex(doc, buffer.toString().trim(), indexLib);
					
					bufSize = 0;
					buffer = new StringBuffer();
				}
		    }
			if(bufSize > 0)
			{
				addIndex(doc, buffer.toString().trim(), indexLib);
			}
			
			ret = true;
		} catch(Exception e){
			Log.info("addIndexForFile() 异常:" + filePath);
			Log.info(e);
		} finally {
			if(reader != null)
			{
				try {
					reader.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
			}
		}
		return ret;
	}
	
	
    //在IndexLib中根据doc进行搜索
	public static List<Doc> getDocList(Repos repos, Doc doc, String indexLib, Integer maxCount)
	{		
		//Log.debug("getDocList() for doc vid:" + doc.getVid() + " docId:" + doc.getDocId() + " pid:" + doc.getPid() + " indexLib:" + indexLib);
		return multiQueryForDoc(repos, doc, indexLib, maxCount);
	}
	
	public static List<Doc> multiQueryForDoc(Repos repos, Doc doc, String indexLib, Integer maxCount)
	{
		if(doc == null)
		{
			Log.debug("multiQuery() 查询条件不能为空！");
			return null;
		}
		
		List<Doc> docList = null;
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQuery() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForDoc(doc);
	        if(builder != null)
	        {
	        	docList = new ArrayList<Doc>();
	        	TopDocs hits = isearcher.search( builder, maxCount);
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		Doc hitDoc = BuildDoc(document);	        		
	        		docList.add(hitDoc);
	    			//Log.debug("multiQuery() hitDoc docId:" + hitDoc.getDocId() + " pid:" + hitDoc.getPid() + " path:" + hitDoc.getPath() + " name:" + hitDoc.getName());
	        	}
	        }
		} catch (Exception e) {
			Log.debug("multiQuery() 异常");
			Log.debug(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					Log.debug(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					Log.debug(e1);
				}
			}
		}				
		return docList;
    }

    public static List<Doc> getDocListByDocId(Repos repos, Doc doc, String indexLib)
	{
    	List<Doc> docList = null;
		Directory directory = null;
    	DirectoryReader ireader = null;
    	
    	try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("getDocListByDocId() " + indexLib + " 不存在！");
    			return null;
    		}
    		
    		directory = FSDirectory.open(file);

	    	ireader = DirectoryReader.open(directory);
	        IndexSearcher isearcher = new IndexSearcher(ireader);
	
	        Query query =NumericRangeQuery.newLongRange("docId", doc.getDocId(), doc.getDocId(), true,true);

	        ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
			Log.debug("getDocListByDocId() hitCount:" + hits.length);

	        docList = new ArrayList<Doc>();
	        for (int i = 0; i < hits.length; i++) 
	        {
	            Document hitDocument = isearcher.doc(hits[i].doc);
		        Doc hitDoc = BuildDoc(hitDocument);
		        docList.add(hitDoc);
	        }
		} catch (Exception e) {
			Log.debug("getDocListByDocId() 异常");
			Log.debug(e);
		} finally {
	        if(ireader != null)
	        {
				try {
					ireader.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
	        }
	        
	        if(directory != null)
	        {
		        try {
					directory.close();
				} catch (IOException e1) {
					Log.debug(e1);
				}
	        }
		}
		return docList;
    }

	public static boolean deleteDoc(Doc doc, String indexLib) 
	{
		return deleteIndex(doc, indexLib);
	}
	
	/**************** 以下是利用反射机制实现的Lucene的通用查询接口 **************/
	// 使用限制: Ojbect不能被混淆，Object不能使用HashObject例如：JSONObject
	public static Integer getFieldType(String type) {
		if(type.endsWith("String"))
		{
			return QueryCondition.FIELD_TYPE_String;			
		}
		
		if(type.endsWith("Integer") || type.endsWith("int"))
		{
			return QueryCondition.FIELD_TYPE_Integer;
		}
		
		if(type.endsWith("Long") || type.endsWith("long"))
		{
			return QueryCondition.FIELD_TYPE_Long;
		}
		
		//浮点数用String表示
		if(type.endsWith("BigDecimal"))
		{
			return QueryCondition.FIELD_TYPE_BigDecimal;	
		}

		return null;
	}
	
	@SuppressWarnings("rawtypes")
	public static String buildCsvTitleStrForObject(Object obj) {
		StringBuffer sb = new StringBuffer();	
		
		Class userCla = (Class) obj.getClass();
		java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			Log.debug("buildCsvTitleStrForObject() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					switch(fieldType)
					{
					case QueryCondition.FIELD_TYPE_String:
					case QueryCondition.FIELD_TYPE_BigDecimal:	//浮点数用字符串表示
					case QueryCondition.FIELD_TYPE_Integer:
					case QueryCondition.FIELD_TYPE_Long:
						sb.append(fieldName + ",");
						break;
					default:
						sb.append(",");
						break;
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildCsvTitleStrForObject() 异常");
	            	Log.info(e);
				}
			}
        }
		
		return sb.toString();
	}

	@SuppressWarnings("rawtypes")
	public static String buildCsvStrForObject(Object obj) {
		StringBuffer sb = new StringBuffer();	
		
		Class userCla = (Class) obj.getClass();
		java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			Log.debug("buildCsvStrForObject() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					Object val = f.get(obj);
					if(val != null)
					{
						switch(fieldType)
						{
						case QueryCondition.FIELD_TYPE_String:
							sb.append(val + "\t,");
							break;
						case QueryCondition.FIELD_TYPE_BigDecimal:	//浮点数用字符串表示
						case QueryCondition.FIELD_TYPE_Integer:
						case QueryCondition.FIELD_TYPE_Long:
							sb.append(val + ",");
							break;
						default:
							sb.append(",");
							break;
						}
					}
					else
					{
						sb.append(",");
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildCsvStrForObject() 异常");
	            	Log.info(e);
				} catch (IllegalAccessException e) {
	            	Log.info("buildCsvStrForObject() 异常");
	            	Log.info(e);
				}
			}
        }
		
		return sb.toString();
	}
	
	@SuppressWarnings("rawtypes")
	public static Document buildDocumentForObject(Object obj) {
		Document document = new Document();	
		
		Class userCla = (Class) obj.getClass();
		java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			//Log.debug("buildDocumentForObject() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					Object val = f.get(obj);
					if(val != null)
					{
						switch(fieldType)
						{
						case QueryCondition.FIELD_TYPE_String:
							document.add(new StringField(fieldName, (String)val, Store.YES));
							break;
						case QueryCondition.FIELD_TYPE_BigDecimal:	//浮点数用字符串表示
							document.add(new StringField(fieldName, val+"", Store.YES));
							break;
						case QueryCondition.FIELD_TYPE_Integer:
							document.add(new IntField(fieldName, (Integer)val, Store.YES));
							break;
						case QueryCondition.FIELD_TYPE_Long:
							document.add(new LongField(fieldName, (Long)val, Store.YES));
							break;				
						}
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildDocumentForObject() 异常");
	            	Log.info(e);
				} catch (IllegalAccessException e) {
	            	Log.info("buildDocumentForObject() 异常");
	            	Log.info(e);
				}
			}
        }
		
		return document;
	}
	
	@SuppressWarnings("rawtypes")
	public static Document buildDocumentForObject(Object obj, String textField) {
		Document document = new Document();	
		
		Class userCla = (Class) obj.getClass();
		java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			//Log.debug("buildDocumentForObject() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					Object val = f.get(obj);
					if(val != null)
					{
						switch(fieldType)
						{
						case QueryCondition.FIELD_TYPE_String:
							if(fieldName.equals(textField))
							{
								document.add(new TextField(fieldName, (String)val, Store.YES));
							}
							else
							{
								document.add(new StringField(fieldName, (String)val, Store.YES));
							}
							break;
						case QueryCondition.FIELD_TYPE_BigDecimal:	//浮点数用字符串表示
							document.add(new StringField(fieldName, val+"", Store.YES));
							break;
						case QueryCondition.FIELD_TYPE_Integer:
							document.add(new IntField(fieldName, (Integer)val, Store.YES));
							break;
						case QueryCondition.FIELD_TYPE_Long:
							document.add(new LongField(fieldName, (Long)val, Store.YES));
							break;				
						}
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildDocumentForObject() 异常");
	            	Log.info(e);
				} catch (IllegalAccessException e) {
	            	Log.info("buildDocumentForObject() 异常");
	            	Log.info(e);
				}
			}
        }
		
		return document;
	}
	
	@SuppressWarnings("rawtypes")
	public static void buildObjectForDocument(Object obj, Document document) {
    	Class userCla = (Class) obj.getClass();
    	java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			//Log.debug("buildObjectForDocument() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					String val = document.get(fieldName);
					//Log.debug("buildObjectForDocument() fieldVal:" + val);
					if(val != null)
					{
						switch(fieldType)
						{
						case QueryCondition.FIELD_TYPE_String:
							f.set(obj, val);
							break;
						case QueryCondition.FIELD_TYPE_BigDecimal:	//浮点数用字符串表示
							f.set(obj, new BigDecimal(val));
							break;
						case QueryCondition.FIELD_TYPE_Integer:
							f.set(obj, Integer.parseInt(val));
							break;
						case QueryCondition.FIELD_TYPE_Long:
							f.set(obj, Long.parseLong(val));
							break;				
						}
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildObjectForDocument() 异常");
	            	Log.info(e);
				} catch (IllegalAccessException e) {
	            	Log.info("buildObjectForDocument() 异常");
	            	Log.info(e);
				}
			}
        }
	}
	
	//queryType 是针对String类型的字段
	@SuppressWarnings("rawtypes")
	public static List<QueryCondition> buildQueryConditionsForObject(Object obj, Occur occurType, Integer queryType) 
	{
		if(obj == null)
		{
			return null;
		}


		List<QueryCondition> conditions = new ArrayList<QueryCondition>();

		//Use Reflect to set conditions
        Class userCla = (Class) obj.getClass();
        /* 得到类中的所有属性集合 */
        java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = getFieldType(type);
			String fieldName = f.getName();
			//Log.debug("buildQueryConditionsForObject() fieldType:" + type + " fieldName:" + fieldName);
			if(fieldType != null)
			{
	            try {
					Object val = f.get(obj);
					if(val != null)
					{
						QueryCondition condition = new QueryCondition();
				        condition.setField(fieldName);				 
				    	condition.setFieldType(fieldType);
				        condition.setValue(val);
				        condition.setQueryType(queryType);	        	
				        condition.setOccurType(occurType);
				        conditions.add(condition);
					}
	            } catch (IllegalArgumentException e) {
	            	Log.info("buildQueryConditionsForObject() 异常");
	            	Log.info(e);
				} catch (IllegalAccessException e) {
	            	Log.info("buildQueryConditionsForObject() 异常");
	            	Log.info(e);
				}
			}
        }		
		return conditions;
	}
	
	//MxsDoc历史版本	
    public static boolean addCommitLogIndexBasic(CommitLog commit, String indexLib)
    {	
    	Log.debug("addCommitLogIndexBasic() id:" + commit.id + " indexLib:"+indexLib);    	
    	Log.printObject("addCommitLogIndexBasic() commit:", commit);

    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		boolean ret = false;
		
		try {
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(commit);
	        indexWriter.addDocument(document);
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
	        ret = true;
		} catch (Exception e) {				
	        Log.debug("addCommitLogIndexBasic() 异常");
	        Log.debug(e);
		} finally {
			closeResource(indexWriter, directory, analyzer);
		}
    		
    	return ret;
    }

	protected static boolean deleteCommitLogIndexBasic(String id, String indexLib)
	{
    	Log.debug("deleteCommitLogIndexBasic() id:" + id + " indexLib:"+indexLib);
    	boolean ret = false;
    	
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;    	
		try {
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        Query query = new TermQuery(new Term("id", id));
	        indexWriter.deleteDocuments(query);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        ret = true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
			errorLog(e);
		}
		
		return ret;
    }   
	
	
	protected static boolean deleteIndexForCommitEntryBasic(String id, String indexLib)
	{
    	Log.debug("deleteIndexForCommitEntryBasic() id:" + id + " indexLib:"+indexLib);
    	boolean ret = false;
    	
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;    	
		try {
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        Query query = new TermQuery(new Term("id", id));
	        indexWriter.deleteDocuments(query);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        ret = true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
			errorLog(e);
		}
		
		return ret;
    }
	
	public static boolean addIndexForCommitEntryBasic(CommitEntry entry, String indexLib)
    {	
    	Log.debug("addIndexForCommitEntryBasic() id:" + entry.id + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntryBasic() entry:", entry);
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
		
		boolean ret = false;
		try {
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(entry);
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;	        
	    	ret = true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("addIndexForCommitEntryBasic() 异常");
			errorLog(e);
		}
		return ret;
    }
	
    public static boolean addCommitLogIndex(CommitLog commit, String indexLib)
    {	
    	Log.debug("addCommitLogIndex() id:" + commit.id + " indexLib:"+indexLib);    	
    	Log.printObject("addCommitLogIndex() commit:", commit);

    	boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addCommitLogIndex synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitLog", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
		
		ret = addCommitLogIndexBasic(commit, indexLib);
			
		unlockSyncSource(lockName, systemUser);
    	return ret;
    }
	
	public static boolean updateCommitLogIndex(CommitLog commit, String indexLib)
    {	
    	Log.debug("updateCommitLogIndex() id:" + commit.id + " indexLib:"+indexLib);    	
    	Log.printObject("updateCommitLogIndex() commit:", commit);

    	boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 updateCommitLogIndex synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitLog", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
			
    	deleteCommitLogIndexBasic(commit.id, indexLib);
        ret = addCommitLogIndexBasic(commit, indexLib);
			
		unlockSyncSource(lockName, systemUser);
    	return ret;
    }
	
	public static boolean deleteCommitLogIndex(CommitLog commit, String indexLib)
    {	
    	Log.debug("deleteCommitLogIndex() id:" + commit.id + " indexLib:"+indexLib);    	
    	Log.printObject("deleteCommitLogIndex() commit:", commit);

    	boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 deleteCommitLogIndex synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitLog", lockName, lockInfo, 2*60*1000, synclock, 3*1000, 3, systemUser))
		{
			return false;
		}
		
		ret = deleteCommitLogIndexBasic(commit.id, indexLib);
			
		unlockSyncSource(lockName, systemUser);
    	return ret;
    }
	
	public static boolean deleteIndexForCommitEntry(CommitEntry entry, String indexLib)
    {	
    	Log.debug("deleteIndexForCommitEntry() id:" + entry.id + " indexLib:"+indexLib);    	
    	Log.printObject("deleteIndexForCommitEntry() entry:", entry);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 deleteIndexForCommitEntry synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    	
    	ret = deleteIndexForCommitEntryBasic(entry.id, indexLib);
			
    	unlockSyncSource(lockName, systemUser);
		return ret;
    }
	
	public static boolean addIndexForCommitEntry(CommitEntry entry, String indexLib)
    {	
    	Log.debug("addIndexForCommitEntry() id:" + entry.id + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntry() entry:", entry);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndexForCommitEntry synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    	
    	ret = addIndexForCommitEntryBasic(entry, indexLib);
			
    	unlockSyncSource(lockName, systemUser);
		return ret;
    }
	
	public static boolean addIndexForCommitEntries(Repos repos, FolderUploadAction action, List<CommitEntry> commitEntryList, String indexLib)
	{
    	Log.debug("addIndexForCommitEntries() action:" + action.event + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntries() action:", action);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndexForCommitEntries synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    		
		//使用共用的commitEntry来减少内存的占用
		CommitEntry commitEntry = new CommitEntry();
		commitEntry.startTime = action.startTime;
		commitEntry.userId = action.user.getId();
		commitEntry.userName = action.user.getName();
		commitEntry.commitId = action.commitId;
		commitEntry.commitMsg = action.commitMsg;
		commitEntry.commitUsers = action.commitUser;
		commitEntry.commitAction = action.event;
		commitEntry.reposId = repos.getId();
		commitEntry.reposName = repos.getName();
		
		for(CommitEntry entry: commitEntryList)
		{
			commitEntry.realCommitAction = entry.realCommitAction;
			commitEntry.docId = entry.docId;
			commitEntry.path = entry.path;
			commitEntry.name = entry.name;
			commitEntry.entryType = entry.entryType;
			commitEntry.size = entry.size;
			commitEntry.latestEditTime = entry.latestEditTime;
			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
			addIndexForCommitEntryBasic(commitEntry, indexLib);
		}
    		
        unlockSyncSource(lockName, systemUser);
		
        ret = true;
		return ret;
	}
	
	public static boolean addIndexForCommitEntries(Repos repos, ActionContext context,
			List<CommitEntry> commitEntryList, String indexLib) 	
	{
    	Log.debug("addIndexForCommitEntries() context:" + context.event + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntries() context:", context);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndexForCommitEntries synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    	
		//使用共用的commitEntry来减少内存的占用
		CommitEntry commitEntry = new CommitEntry();
		commitEntry.startTime = context.startTime;
		commitEntry.userId = context.user.getId();
		commitEntry.userName = context.user.getName();
		commitEntry.commitId = context.commitId;
		commitEntry.commitMsg = context.commitMsg;
		commitEntry.commitUsers = context.commitUser;
		commitEntry.commitAction = context.event;
		commitEntry.reposId = repos.getId();
		commitEntry.reposName = repos.getName();
		
		for(CommitEntry entry: commitEntryList)
		{
			commitEntry.realCommitAction = entry.realCommitAction;
			commitEntry.docId = entry.docId;
			commitEntry.path = entry.path;
			commitEntry.name = entry.name;
			commitEntry.entryType = entry.entryType;
			commitEntry.size = entry.size;
			commitEntry.latestEditTime = entry.latestEditTime;
			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
			addIndexForCommitEntryBasic(commitEntry, indexLib);
		}
    		
        unlockSyncSource(lockName, systemUser);
        
		ret = true;
		return ret;
	}
	
	public static boolean addIndexForCommitEntriesForDoc(Repos repos, ActionContext context, Doc doc, String indexLib) {
    	Log.debug("addIndexForCommitEntries() context:" + context.event + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntries() context:", context);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndexForCommitEntries synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    	
    		//使用共用的commitEntry来减少内存的占用
    		CommitEntry commitEntry = new CommitEntry();
			commitEntry.startTime = context.startTime;
			commitEntry.userId = context.user.getId();
			commitEntry.userName = context.user.getName();
			commitEntry.commitId = context.commitId;
			commitEntry.commitMsg = context.commitMsg;
			commitEntry.commitUsers = context.commitUser;
			commitEntry.reposId = repos.getId();
			commitEntry.reposName = repos.getName();
			commitEntry.commitAction = context.event;
			commitEntry.realCommitAction = context.event;

			addIndexForCommitEntriesForDoc(
        			commitEntry,
        			doc.getLevel(), doc.getLocalRootPath(), doc.getPath(), doc.getName(),
        			indexLib);
    				
		unlockSyncSource(lockName, systemUser);
		ret = true;
		return ret;
	}
	
	private static void addIndexForCommitEntriesForDoc(
			CommitEntry commitEntry,
			int level, String localRootPath, String path, String name, 
			String indexLib)
	{
    	String filePath = localRootPath + path + name;
        
    	File file = new File(filePath); 
        if(file.exists())
        {        	
            commitEntry.docId = Path.getDocId(level, path + name);
            commitEntry.path = path;
            commitEntry.name = name;
            commitEntry.entryType = file.isFile()? 1:2;
            commitEntry.size = file.length();
            commitEntry.latestEditTime = file.lastModified();            
            commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
			addIndexForCommitEntryBasic(commitEntry, indexLib);
			
            if(file.isFile())        		
        	{
				return;
            }
            
        	//SubEntries under folder	              	
        	String subDirPath = path + name + "/";
        	File[] tmp = file.listFiles();
            for(int i=0;i<tmp.length;i++)
            {
            	addIndexForCommitEntriesForDoc(
            			commitEntry,
            			level+1, localRootPath, subDirPath, tmp[i].getName(),
            			indexLib);
            }
        }
 	}
	
	public static boolean addIndexForCommitEntriesEx(Repos repos, ActionContext context,
			List<CommitAction> commitActionList, String indexLib) 	
	{
    	Log.debug("addIndexForCommitEntriesEx() context:" + context.event + " indexLib:"+indexLib);    	
    	Log.printObject("addIndexForCommitEntriesEx() context:", context);
    	
		boolean ret = false;
		
		Object synclock = getSyncLock(indexLib);
		
		String lockInfo = "LuceneUtil2 addIndexForCommitEntries synclock:" + indexLib;
		String lockName = "indexLibSyncLock" + indexLib;
		if(false == lockSyncSource("CommitEntry", lockName, lockInfo, 10*60*1000, synclock, 3*1000, 10, systemUser))
		{
			return false;
		}
    	
		//使用共用的commitEntry来减少内存的占用
		CommitEntry commitEntry = new CommitEntry();
		commitEntry.startTime = context.startTime;
		commitEntry.userId = context.user.getId();
		commitEntry.userName = context.user.getName();
		commitEntry.commitId = context.commitId;
		commitEntry.commitMsg = context.commitMsg;
		commitEntry.commitUsers = context.commitUser;
		commitEntry.commitAction = context.event;
		commitEntry.reposId = repos.getId();
		commitEntry.reposName = repos.getName();
		
		Doc doc = null;
		Doc newDoc = null;
		for(CommitAction entry: commitActionList)
		{    			
			switch(entry.getAction())
			{
			case ADD:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "add";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			case DELETE:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "delete";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			case MODIFY:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "modify";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			case MOVE:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "delete";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				//Add DstEntry
    			newDoc = entry.getDoc(); 
    			commitEntry.docId = newDoc.getDocId();
    			commitEntry.path = newDoc.getPath();
    			commitEntry.name = newDoc.getName();
    			commitEntry.entryType = newDoc.getType();
    			commitEntry.size = newDoc.getSize();
    			commitEntry.latestEditTime = newDoc.getLatestEditTime();
    			commitEntry.realCommitAction = "add";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
    			break;
			case COPY:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "noChange";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				//Add DstEntry
    			newDoc = entry.getDoc(); 
    			commitEntry.docId = newDoc.getDocId();
    			commitEntry.path = newDoc.getPath();
    			commitEntry.name = newDoc.getName();
    			commitEntry.entryType = newDoc.getType();
    			commitEntry.size = newDoc.getSize();
    			commitEntry.latestEditTime = newDoc.getLatestEditTime();
    			commitEntry.realCommitAction = "add";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			case FILETODIR:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.size = doc.getSize();
    			commitEntry.latestEditTime = doc.getLatestEditTime();
				commitEntry.realCommitAction = "delete";
				commitEntry.entryType = 1; //File
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				//Add DstEntry
    			commitEntry.entryType = 2; //Dir
    			commitEntry.size = newDoc.getSize();
    			commitEntry.latestEditTime = newDoc.getLatestEditTime();
    			commitEntry.realCommitAction = "add";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			case DIRTOFILE:
    			doc = entry.getDoc(); 
    			commitEntry.docId = doc.getDocId();
    			commitEntry.path = doc.getPath();
    			commitEntry.name = doc.getName();
    			commitEntry.entryType = doc.getType();
				commitEntry.realCommitAction = "delete";
				commitEntry.entryType = 2; //Dir
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				//Add DstEntry
    			commitEntry.entryType = 1; //File
    			commitEntry.size = newDoc.getSize();
    			commitEntry.latestEditTime = newDoc.getLatestEditTime();
    			commitEntry.realCommitAction = "add";
    			commitEntry.id = buildUniqueIdForCommitEntry(commitEntry);
    			addIndexForCommitEntryBasic(commitEntry, indexLib);
				break;
			default:
				break;
			}
		}
    		
    	unlockSyncSource(lockName, systemUser);
		ret = true;
		return ret;
	}
	
	private static String getRealCommitAction(CommitType action) {
		String realCommitAction = null;
		switch(action)
		{
		case ADD:
			realCommitAction = "add";
			break;
		case DELETE:
			realCommitAction = "delete";
			break;
		case MODIFY:
			realCommitAction = "modify";
			break;
		case MOVE:
			realCommitAction = "move";
			break;
		case COPY:
			realCommitAction = "copy";
			break;
		case FILETODIR:
			realCommitAction = "filetodir";
			break;
		case DIRTOFILE:
			realCommitAction = "dirtofile";
			break;
		default:
			break;
		}
		return realCommitAction;
	}



	public static String buildUniqueIdForCommitEntry(CommitEntry entry) {
		return entry.commitId + "_" + entry.reposId + "_" + entry.docId;
	}

	//查询指定范围内的commitLog	
	//maxNum: 最大记录条数
	public static List<CommitLog> queryCommitLog(CommitLog commit, Long startCommitId, Long endCommitId, Integer maxNum, String indexLib) {
		//按commitId反序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("commitId", SortField.Type.LONG, true);
		sort.setSort(field);
		
		Log.debug("queryCommitLog() indexLib:" + indexLib);
			
		List<CommitLog> list = multiQueryForCommitLog(commit, startCommitId, endCommitId, maxNum, indexLib, sort);
		return list;
	}
	
	//查询指定范围内的commitLog	
	//maxNum: 最大记录条数
	public static List<CommitLog> queryCommitLog(CommitLog commit, Integer maxNum, String indexLib) {
		//按commitId反序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("commitId", SortField.Type.LONG, true);
		sort.setSort(field);
		
		Log.debug("queryCommitLog() indexLib:" + indexLib);
			
		List<CommitLog> list = multiQueryForCommitLog(commit, maxNum, indexLib, sort);
		return list;
	}
	
	public static List<CommitLog> multiQueryForCommitLog(CommitLog qCommit, Integer maxNum, String indexLib, Sort sort)
	{
		List<CommitLog> list =  new ArrayList<CommitLog>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQueryForCommitLog() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForCommitLog(qCommit);
	        if(builder != null)
	        {
				TopDocs hits = isearcher.search( builder, maxNum, sort);
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		CommitLog log = new CommitLog();
		        	LuceneUtil2.buildObjectForDocument(log, document);
		        	Log.printObject("multiQueryForCommitLog() log", log);
		        	list.add(log);
	        	}
	        }
		} catch (Exception e) {
			errorLog("multiQueryForCommitLog() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	public static List<CommitLog> multiQueryForCommitLog(CommitLog qCommit, Long startCommitId, Long endCommitId, Integer maxNum, String indexLib, Sort sort)
	{
		List<CommitLog> list =  new ArrayList<CommitLog>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQueryForCommitLog() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForCommitLog(qCommit, startCommitId, endCommitId);
	        if(builder != null)
	        {
				TopDocs hits = isearcher.search( builder, maxNum, sort);
				for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
        			CommitLog log = new CommitLog();
	        		LuceneUtil2.buildObjectForDocument(log, document);
	        		Log.printObject("multiQueryForCommitLog() log", log);
	        		list.add(log);
	        	}
	        }
		} catch (Exception e) {
			errorLog("multiQueryForCommitLog() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	//查询指定的commitLog
	private static BooleanQuery buildBooleanQueryForCommitLog(CommitLog qCommit) 
	{	
        List<QueryCondition> conditions2 = LuceneUtil2.buildQueryConditionsForObject(qCommit, Occur.MUST, QueryCondition.SEARCH_TYPE_Term);
		BooleanQuery query2 = LuceneUtil2.buildBooleanQueryWithConditions(conditions2);
		return query2;
	}
	
	//查询指定commit范围内的commitLog
	private static BooleanQuery buildBooleanQueryForCommitLog(CommitLog qCommit, Long startCommitId, Long endCommitId) 
	{
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		QueryCondition condition = new QueryCondition();
        condition.setField("commitId");
        condition.setValue(startCommitId);
        condition.setEndValue(endCommitId);
        condition.setFieldType(QueryCondition.FIELD_TYPE_Long_Range);
        conditions.add(condition);
        BooleanQuery query =  LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		
        //表示查询时间范围内的所有记录
        List<QueryCondition> conditions2 = LuceneUtil2.buildQueryConditionsForObject(qCommit, Occur.MUST, QueryCondition.SEARCH_TYPE_Term);
		BooleanQuery query2 = LuceneUtil2.buildBooleanQueryWithConditions(conditions2);
		if(query2 != null)
		{
			query.add(query2, Occur.MUST);
		}
		return query;
	}
	
	/*
	 * 查询在startCommitId和endCommitId之间的所有Doc和SubDocs的commitEntries
	 * entry: 需要包括 docId/path/name, docId用于匹配Doc, path和name用于匹配SubDocs的path
	 * maxNum: 最大记录条数
	 * startCommitId: 未指定则表示endCommitId一年前的commitId
	 * endCommitId: 未指定则表示最新的commitId
	 */
	public static List<CommitEntry> queryCommitEntryForDocAndSubDocs(CommitEntry entry, Long startCommitId, Long endCommitId, Integer maxNum, String indexLib) {
		//按commitId正序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("commitId", SortField.Type.LONG, true);
		sort.setSort(field);
		
		Log.debug("queryCommitEntryForDocAndSubDocs() indexLib:" + indexLib);
			
		List<CommitEntry> list = multiQueryForCommitEntryForDocAndSubDocs(entry, startCommitId, endCommitId, maxNum, indexLib, sort);
		return list;
	}
    
	//For RecycleBin
	public static boolean deleteCommitEntryForDocAndSubDocs(CommitEntry entry, Long startCommitId, Long endCommitId, String indexLib) {
		Log.debug("deleteCommitEntryForDocAndSubDocs() indexLib:" + indexLib);
		
    	boolean ret = false;
    	
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;    	
		try {
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        BooleanQuery builder = buildBooleanQueryForCommitEntryForDocAndSubDocs(entry, startCommitId, endCommitId);
	        indexWriter.deleteDocuments(builder);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        ret = true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
			errorLog(e);
		}
		
		return ret;
	}
	
	public static List<CommitEntry> multiQueryForCommitEntryForDocAndSubDocs(CommitEntry qEntry, Long startCommitId, Long endCommitId, Integer maxNum, String indexLib, Sort sort)
	{
		List<CommitEntry> list =  new ArrayList<CommitEntry>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQueryForCommitEntryForDocAndSubDocs() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForCommitEntryForDocAndSubDocs(qEntry, startCommitId, endCommitId);
	        if(builder != null)
	        {
	        	String preCommitId = "";
				TopDocs hits = isearcher.search( builder, maxNum, sort); 
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		String commitId = document.get("commitId");
	        		//相同的commitEntry只添加一次
	        		if(commitId.equals(preCommitId) == false)
	        		{
	        			preCommitId = commitId;
		        		CommitEntry log = new CommitEntry();
		        		LuceneUtil2.buildObjectForDocument(log, document);
		        		Log.printObject("multiQueryForCommitEntryForDocAndSubDocs() log", log);
		        		list.add(log);
	        		}
	        	}
	        }
		} catch (Exception e) {
			errorLog("multiQueryForCommitEntryForDocAndSubDocs() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	private static BooleanQuery buildBooleanQueryForCommitEntryForDocAndSubDocs(CommitEntry qEntry, Long startCommitId, Long endCommitId) 
	{
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		QueryCondition condition = new QueryCondition();
        condition.setField("commitId");
        condition.setValue(startCommitId);
        condition.setEndValue(endCommitId);
        condition.setFieldType(QueryCondition.FIELD_TYPE_Long_Range);
        conditions.add(condition);
        BooleanQuery query =  LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		
        //表示查询时间范围内的所有记录
        List<QueryCondition> conditions2 = LuceneUtil2.buildQueryConditionsForCommitEntryForDocAndSubDocs(qEntry);
		BooleanQuery query2 = LuceneUtil2.buildBooleanQueryWithConditions(conditions2);
		if(query2 != null)
		{
			query2.setMinimumNumberShouldMatch(1);	//docId和path至少要满足一个
			query.add(query2, Occur.MUST);
		}
		return query;
	}
		
	public static List<QueryCondition> buildQueryConditionsForCommitEntryForDocAndSubDocs(CommitEntry qEntry) 
	{
		if(qEntry == null)
		{
			return null;
		}

		List<QueryCondition> conditions = new ArrayList<QueryCondition>();

		try {
			QueryCondition conditionDocId = new QueryCondition();
			conditionDocId.setField("docId");				 
			conditionDocId.setFieldType(QueryCondition.FIELD_TYPE_Long);
			conditionDocId.setValue(qEntry.docId);
			conditionDocId.setQueryType(QueryCondition.FIELD_TYPE_Long);	        	
			conditionDocId.setOccurType( Occur.SHOULD);
			conditions.add(conditionDocId);
			
			QueryCondition conditionPath = new QueryCondition();
			conditionPath.setField("path");				 
			conditionPath.setFieldType(QueryCondition.FIELD_TYPE_String);
			conditionPath.setValue(qEntry.path + qEntry.name + "/");
			conditionPath.setQueryType(QueryCondition.SEARCH_TYPE_Prefix);	        	
			conditionPath.setOccurType(Occur.SHOULD);
			conditions.add(conditionPath);
        } catch (Exception e) {
        	Log.info("buildQueryConditionsForCommitEntryForDocAndSubDocs() 异常");
        	Log.info(e);
        }
		return conditions;
	}
	
	/*
	 * 在startCommitId和endCommitId之间的进行精确查询commitEntry
	 * entry: 需要精确查询的信息，例如commitId/docId/path/name等
	 * */
	public static List<CommitEntry> queryCommitEntryEx(CommitEntry entry, Long startCommitId, Long endCommitId,  Integer maxNum, String indexLib) {
		//按commitId正序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("commitId", SortField.Type.LONG, true);
		sort.setSort(field);
		
		Log.debug("queryCommitEntry() indexLib:" + indexLib);
			
		List<CommitEntry> list = multiQueryForCommitEntryEx(entry, maxNum, startCommitId, endCommitId, indexLib, sort);
		return list;
	}
	
	/*
	 * 精确查询commitEntry
	 * entry: 需要精确查询的信息，例如commitId/docId/path/name等
	 * 目前只用于查询提交的详情信息
	 * */
	public static List<CommitEntry> queryCommitEntry(CommitEntry entry, Integer maxNum, String indexLib) {
		//按commitId正序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("commitId", SortField.Type.LONG, true);
		sort.setSort(field);
		
		Log.debug("queryCommitEntry() indexLib:" + indexLib);
			
		List<CommitEntry> list = multiQueryForCommitEntry(entry, maxNum, indexLib, sort);
		return list;
	}	
	
	public static List<CommitEntry> multiQueryForCommitEntry(CommitEntry qEntry, Integer maxNum, String indexLib, Sort sort)
	{
		List<CommitEntry> list =  new ArrayList<CommitEntry>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQueryForCommitEntry() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForCommitEntry(qEntry);
	        if(builder != null)
	        {
				TopDocs hits = isearcher.search( builder, maxNum, sort); 
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		CommitEntry log = new CommitEntry();
	        		LuceneUtil2.buildObjectForDocument(log, document);
	        		Log.printObject("multiQueryForCommitEntry() log", log);
		            list.add(log);
	        	}
	        }
		} catch (Exception e) {
			errorLog("multiQueryForCommitEntry() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	public static List<CommitEntry> multiQueryForCommitEntryEx(CommitEntry qEntry, Integer maxNum, Long startCommitId, Long endCommitId, String indexLib, Sort sort)
	{
		List<CommitEntry> list =  new ArrayList<CommitEntry>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			Log.debug("multiQueryForCommitEntry() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForCommitEntryEx(qEntry, startCommitId, endCommitId);
	        if(builder != null)
	        {
				TopDocs hits = isearcher.search( builder, maxNum, sort); 
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		CommitEntry log = new CommitEntry();
	        		LuceneUtil2.buildObjectForDocument(log, document);
	        		Log.printObject("multiQueryForCommitEntry() log", log);
		            list.add(log);
	        	}
	        }
		} catch (Exception e) {
			errorLog("multiQueryForCommitEntry() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	private static BooleanQuery buildBooleanQueryForCommitEntry(CommitEntry qEntry) 
	{
        List<QueryCondition> conditions2 = LuceneUtil2.buildQueryConditionsForObject(qEntry, Occur.MUST, QueryCondition.SEARCH_TYPE_Term);
		BooleanQuery query2 = LuceneUtil2.buildBooleanQueryWithConditions(conditions2);
		return query2;
	}

	private static BooleanQuery buildBooleanQueryForCommitEntryEx(CommitEntry qEntry, Long startCommitId, Long endCommitId) 
	{
		List<QueryCondition> conditions = new ArrayList<QueryCondition>();
		QueryCondition condition = new QueryCondition();
        condition.setField("commitId");
        condition.setValue(startCommitId);
        condition.setEndValue(endCommitId);
        condition.setFieldType(QueryCondition.FIELD_TYPE_Long_Range);
        conditions.add(condition);
        BooleanQuery query =  LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		
        //qEntry == null 表示查询时间范围内的所有记录
        if(qEntry == null)
        {
        	return query;
        }
        
        //增加qEntry精确查询条件
		BooleanQuery query2 = buildBooleanQueryForCommitEntry(qEntry);
		if(query2 != null)
		{
			query.add(query2, Occur.MUST);
		}
		return query;
	}
}
