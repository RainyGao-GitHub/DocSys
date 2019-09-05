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
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Field.Index;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.document.IntField;
import org.apache.lucene.document.LongField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.NumericRangeQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
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

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

import util.ReadProperties;
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
public class LuceneUtil2   extends BaseFunction
{    
    public static boolean deleteIndexLib(String indexLib)
    {
    	return delFileOrDir(indexLib);
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
    	System.out.println("addIndex() id:" + doc.getId() + " docId:"+ doc.getDocId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);    	
    	System.out.println("addIndex() content:" + content);
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
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
	        
	        System.out.println("addIndex() Success id:" + doc.getId() + " docId:"+ doc.getDocId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);	        
			Date date2 = new Date();
	        System.out.println("创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        System.out.println("addIndex() 异常");
			e.printStackTrace();
			return false;
		}
    }

	private static void closeResource(IndexWriter indexWriter, Directory directory, Analyzer analyzer) {
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

	private static Document buildDocument(Doc doc, String content) {
		Document document = new Document();
        document.add(new IntField("vid", doc.getVid(), Store.YES));
        document.add(new LongField("pid", doc.getPid(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
        document.add(new LongField("docId", doc.getDocId(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
        document.add(new IntField("type", doc.getType(), Store.YES));	//1: file 2: dir 用来保存Lucene和实际文件的区别
        document.add(new Field("path", doc.getPath(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));	
        document.add(new Field("name", doc.getName(), Store.YES, Index.NOT_ANALYZED_NO_NORMS));	//文件名需要用于通配符搜索，因此不能进行切词处理
        document.add(new TextField("content", content, Store.NO));	//Content有可能会很大，所以只切词不保存	        
        document.add(new LongField("size", doc.getSize(), Store.YES));
        document.add(new LongField("latestEditTime", doc.getLatestEditTime(), Store.YES));
        
		return document;
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
    public static boolean updateIndex(Doc doc, String content, String indexLib)
    {
    	System.out.println("updateIndex() id:" + doc.getId() + " docId:"+ doc.getDocId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);
    	System.out.println("updateIndex() content:" + content);
    
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
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
	         
	        Date date2 = new Date();
	        System.out.println("更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	        return true;
		} catch (IOException e) {
			closeResource(indexWriter, directory, analyzer);
			System.out.println("updateIndex() 异常");
			e.printStackTrace();
			return false;
		}
    }
    
    /**
     * 	删除索引
     * 
     * @param id: lucene document id
     * @return 
     * @throws Exception
     */
    public static boolean deleteIndex(Doc doc, String indexLib)
    {
    	System.out.println("deleteIndex() docId:" + doc.getDocId() + " indexLib:"+indexLib);
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;
    	
		try {
			Date date1 = new Date();
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        //Query query = new TermQuery(new Term("docId",""+doc.getDocId()));
	        Query query =NumericRangeQuery.newLongRange("docId", doc.getDocId(), doc.getDocId(), true,true);
	        indexWriter.deleteDocuments(query);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        
	        Date date2 = new Date();
	        System.out.println("删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	        return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
			e.printStackTrace();
			return false;
		}
    }  

    /**
     * 	关键字模糊查询， 返回docId List
     * @param weight 
     * @param parentPath 
     * @param <SearchResult>
     * @param str: 关键字
     * @param indexLib: 索引库名字
     */
	public static boolean search(Repos repos, String str, String pathFilter, String field, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight)
	{
		System.out.println("search() keyWord:" + str + " field:" + field + " indexLib:" + indexLib + " searchType:"+ searchType + " weight:" + weight + " pathFilter:" + pathFilter);
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			System.out.println("search() keyWord:" + str + " indexLib:" + indexLib);
    			return false;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        Query query = null;
	        switch(searchType)
	        {
	        case 1: //精确
		        query = new TermQuery(new Term(field,str));
		        break;
	        case 2:	//模糊
	        	query = new FuzzyQuery(new Term(field,str));
	        	break;
	        case 3: //智能 
	        	Analyzer analyzer = new IKAnalyzer();
	        	QueryParser parser = new QueryParser(Version.LUCENE_46, field,analyzer);
		        query = parser.parse(str);
	        	break;
	        case 4:	//前缀
	        	query = new PrefixQuery(new Term(field, str));
	        	break;
	        case 5: //通配
	        	query = new WildcardQuery(new Term(field,"*" + str + "*"));
	        	break;  
	        }
	        
	        ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
	        for (int i = 0; i < hits.length; i++) 
	        {
	            Document hitDocument = isearcher.doc(hits[i].doc);
	            HitDoc hitDoc = BuildHitDocFromDocument(repos, pathFilter, hitDocument);
	            if(hitDoc == null)
	            {
	            	continue;
	            }
	    		printObject("search() hitDoc:", hitDoc);
	            
	            AddHitDocToSearchResult(searchResult,hitDoc, str, weight);
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
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			System.out.println("search() 异常");
			e.printStackTrace();
			return false;
		}
    }

	public static boolean smartSearch(Repos repos, String str, String pathFilter, String field, String indexLib, HashMap<String, HitDoc> searchResult, int searchType, int weight)
	{
		System.out.println("smartSearch() keyWord:" + str + " field:" + field + " indexLib:" + indexLib);

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
				System.out.println(cta.toString());
				list.add(cta.toString());
			}
	
			stream.end(); //这句很重要
	
			stream.close();
			stream = null;
			analyzer.close();
			analyzer=null;
			
		} catch (Exception e) {
			if(stream != null)
			{
				try {
					stream.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			if(analyzer != null)
			{
				analyzer.close();
			}
			
			e.printStackTrace();
		}
		
		int subWeight = list.size() > 0? weight/list.size() : weight;
		for(int i=0; i<list.size(); i++)
		{
			String searchStr = list.get(i);
			LuceneUtil2.search(repos, searchStr, pathFilter, field, indexLib, searchResult, searchType, subWeight);
		}
		return true;
    }
	
    private static HitDoc BuildHitDocFromDocument(Repos repos, String pathFilter, Document hitDocument) 
    {
    	switch(repos.getType())
    	{
    	case 1:
    	case 2:
    	case 3:
    	case 4:
    		return BuildHitDocFromDocument_FS(repos, pathFilter, hitDocument);
    	}
		return null;
 	}

	private static HitDoc BuildHitDocFromDocument_FS(Repos repos, String pathFilter, Document hitDocument) {
    	System.out.println("BuildHitDocFromDocument_FS hitDocument docId:" + hitDocument.get("docId") + " pid:" + hitDocument.get("pid")  + " path:" + hitDocument.get("path") + " name:" + hitDocument.get("name") + " type:" + hitDocument.get("type") + " size:" + hitDocument.get("size") + " latestEditTime:" + hitDocument.get("latestEditTime"));

		try {
			String docParentPath = hitDocument.get("path");
	    	String docName =  hitDocument.get("name");
	        
		    if(pathFilter != null && !pathFilter.isEmpty())
	        {
	        	if(docParentPath == null || docParentPath.isEmpty())
	            {
	            	System.out.print("BuildHitDocFromDocument_FS() " + docParentPath + " is empty");
	        		return null;
	            }
	            else if(!docParentPath.contains(pathFilter))
	            {
	               	System.out.print("BuildHitDocFromDocument_FS() " + docParentPath + " was not under path:" + pathFilter);
	            	return null;
	            }    
	        }
	        
	    	//Set Doc 
	    	String strDocId = hitDocument.get("docId");
	    	String strPid = hitDocument.get("pid");
	    	String strType = hitDocument.get("type");
	    	String strSize = hitDocument.get("size");
	    	String strLatestEditTime = hitDocument.get("latestEditTime");
	    	Long docId = Long.parseLong(strDocId);
	    	Long pid = Long.parseLong(strPid);
	    	Integer type = Integer.parseInt(strType);
	    	Long size = Long.parseLong(strSize);
	    	Long latestEditTime = Long.parseLong(strLatestEditTime);
	    	
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
			System.out.println("BuildHitDocFromDocument_FS() 异常");
			e.printStackTrace();
			return null;
		}
	}

	/**
	 * 	根据docId查询idList，返回idList
     * 
     * @param docId: DocSys doc id
     * @param indexLib: 索引库名字
     */
    public static List<String> getDocumentIdListByHashId(String hashId,String indexLib)
    {
    	System.out.println("getDocumentIdListByHashId() hashId:" + hashId + " indexLib:" + indexLib);
		
		Directory directory = null;
    	DirectoryReader ireader = null;
    	
    	try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			return null;
    		}
    		
    		directory = FSDirectory.open(file);

	    	ireader = DirectoryReader.open(directory);
	        IndexSearcher isearcher = new IndexSearcher(ireader);
	
	        TermQuery query = new TermQuery(new Term("hashId", hashId));	//精确查找
	
	        ScoreDoc[] hits = isearcher.search(query, null, 100).scoreDocs;
	        List<String> res = new ArrayList<String>();
	        for (int i = 0; i < hits.length; i++) {
	            Document hitDoc = isearcher.doc(hits[i].doc);
	            res.add(hitDoc.get("id"));
	            System.out.println("getDocumentIdListByHashId() searchResult: id:" + hitDoc.get("id") + " docId:"+ hitDoc.get("docId"));
	        }
	        
	        ireader.close();
	        ireader = null;
	        directory.close();
	        directory = null;
	        return res;
		} catch (IOException e) {
	        if(ireader != null)
	        {
				try {
					ireader.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
	        }
	        
	        if(directory != null)
	        {
		        try {
					directory.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
	        }
	        
			System.out.println("getDocumentIdListByHashId() 异常");
			e.printStackTrace();
			return null;
		}
    }

	public static boolean addIndexForWord(String filePath, Doc doc, String indexLib)
	{
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
    		
    	    addIndex(doc, content.toString().trim(), indexLib);
		} catch (Exception e) {
			if(doc1 != null)
			{
				try {
					doc1.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
    		e.printStackTrace();
    		return false;
    	}
    	return true;		
	}

	public static boolean addIndexForWord2007(String filePath, Doc doc, String indexLib)
	{
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
        	
        	extractor.close();
        	extractor = null;
        	xdoc.close();
        	xdoc = null;
        	fis.close();
        	fis = null;
        	
        	addIndex(doc,str.toString().trim(), indexLib);
		} catch (Exception e) {			
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(xdoc != null)
			{
				try {
					xdoc.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			e.printStackTrace();
			return false;
		}
    	return true;
	}

	public static boolean addIndexForExcel(String filePath, Doc doc, String indexLib)
	{
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
            
            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
              
            addIndex(doc, text.toString().trim(), indexLib);
        } catch(Exception e) {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
        	
            e.printStackTrace();
            return false;
        }
        
        return true;
	}

	public static boolean addIndexForExcel2007(String filePath, Doc doc, String indexLib)
	{
        InputStream is = null;
        XSSFWorkbook workBook = null;  
        XSSFExcelExtractor extractor = null;
        
		try {  
	        is = new FileInputStream(filePath);
        	workBook = new XSSFWorkbook(is);  
            extractor = new XSSFExcelExtractor(workBook);  
            String text = extractor.getText();  

            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
            
            addIndex(doc, text.toString().trim(), indexLib);
		} catch (Exception e) { 
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
        	e.printStackTrace();  
        	return false;
        }       
        return true;
	}

	public static boolean addIndexForPPT(String filePath, Doc doc, String indexLib)
	{
		InputStream is = null;
        PowerPointExtractor extractor = null;  
        
		try {
			is = new FileInputStream(filePath);
            extractor = new PowerPointExtractor(is);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            is.close();      
            is = null;
            
            addIndex(doc, text.toString().trim(), indexLib);
		} catch (Exception e) {  
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
            e.printStackTrace(); 
            return false;
        }          
		return true;
	}

	public static boolean addIndexForPPT2007(String filePath, Doc doc, String indexLib)
	{
		InputStream is = null; 
        XMLSlideShow slide = null;
        XSLFPowerPointExtractor extractor = null;  
        
        try {  
			is = new FileInputStream(filePath); 
	        slide = new XMLSlideShow(is);
            extractor=new XSLFPowerPointExtractor(slide);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            slide.close();
            slide = null;
            is.close();
            is = null;
            
            addIndex(doc, text.toString().trim(), indexLib);
        } catch (Exception e) {  
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(slide != null)
			{
				try {
					slide.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
        	e.printStackTrace(); 
            return false;
        }
        return true;
	}
	
	public static boolean addIndexForPdf(String filePath, Doc doc, String indexLib)
	{
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
			
			document.close();
			document = null;
			
            addIndex(doc, content.toString().trim(), indexLib);
	   }
	   catch(Exception e)
	   {
			if(document != null)
			{
				try {
					document.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}			
			e.printStackTrace();
			return false;
	   }
	   return true;
	}

	public static boolean addIndexForFile(String filePath, Doc doc, String indexLib)
	{
		InputStream is = null;
		BufferedReader reader = null;
		
		try {
			int lineCount = 0;
			int totalLine = 0;
			
			int bufSize = 0;
			int totalSize = 0;
			
			int chunkIndex = 0;
			
			StringBuffer buffer = new StringBuffer();
			String code = FileUtils2.getFileEncode(filePath);
			if(FileUtils2.isBinaryFile(code) == true)
			{
				System.out.println("addIndexForFile() BinaryFile will not add Index");
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
				
				totalLine ++;
				lineCount ++;
				
				bufSize = buffer.length();
				totalSize += bufSize;
				if(bufSize >= 10485760)	//10MByte
				{
					addIndex(doc, buffer.toString().trim(), indexLib);
					
					chunkIndex ++;
					System.out.println("addIndexForFile() lineCount:" + lineCount + " bufSize:" + bufSize + " chunkIndex:" + chunkIndex);
					//Clear StringBuffer
					lineCount  = 0;
					bufSize = 0;
					buffer = new StringBuffer();
				}
		    }
			if(bufSize > 0)
			{
				addIndex(doc, buffer.toString().trim(), indexLib);
				chunkIndex ++;
				System.out.println("addIndexForFile() lineCount:" + lineCount + " bufSize:" + bufSize + " chunkIndex:" + chunkIndex);
			}
			
		    reader.close();
		    reader = null;
		    is.close();
		    is = null;

		    System.out.println("addIndexForFile() totalLine:" + totalLine + " totalSize:" + totalSize + " chunks:" + chunkIndex);
		} catch(Exception e){
			if(reader != null)
			{
				try {
					reader.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		    e.printStackTrace();
		    return false;
		}
		return true;
	}
}
