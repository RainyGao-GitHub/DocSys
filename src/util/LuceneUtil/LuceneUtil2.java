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
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
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
    private static String INDEX_DIR = getLucenePath();

    private static String getLucenePath() {
		String path = ReadProperties.read("docSysConfig.properties", "lucenePath");
	    if(path == null || "".equals(path))
	    {
	    	if(isWinOS())
	    	{
	    		path = "C:/DocSysLucene/";
			}
			else
			{
				path = "/data/DocSysLucene/";	//Linux系统放在  /data	
			}
	    }
	    
		File dir = new File(path);
		if(dir.exists() == false)
		{
			System.out.println("getLucenePath() path:" + path + " not exists, do create it!");
			if(dir.mkdirs() == false)
			{
				System.out.println("getLucenePath() Failed to create dir:" + path);
			}
		}	 
		return path;
	}
    
    public static boolean deleteIndexLib(String indexLib)
    {
    	return delFileOrDir(INDEX_DIR + File.separator+ indexLib);
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
    public static boolean addIndex(String id, Doc doc, String content, String indexLib)
    {	
    	System.out.println("updateIndex() id:" + id + " docId:"+ doc.getId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);
    	//System.out.println("addIndex() content:" + content);
    	
		try {
    	
	    	Date date1 = new Date();
	    	Analyzer analyzer = new IKAnalyzer();
	    	Directory directory = FSDirectory.open(new File(INDEX_DIR + File.separator+ indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        IndexWriter indexWriter = new IndexWriter(directory, config);
	
	        Document document = new Document();
	        document.add(new TextField("id", id, Store.YES));
	        document.add(new IntField("reposId", doc.getId(), Store.YES));
	        document.add(new IntField("docId", doc.getId(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
	        document.add(new IntField("type", doc.getType(), Store.YES));	//1: file 2: dir 用来保存Lucene和实际文件的区别
	        document.add(new TextField("parentPath", doc.getPath(), Store.YES));
	        document.add(new TextField("name", doc.getName(), Store.YES));
	        document.add(new TextField("content", content, Store.NO));	//Content有可能会很大，所以只切词不保存	        
	        indexWriter.addDocument(document);
	        
	        indexWriter.commit();
	        indexWriter.close();
	
	        Date date2 = new Date();
	        System.out.println("创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
			return true;
		} catch (IOException e) {
			System.out.println("addIndex() 异常");
			e.printStackTrace();
			return false;
		}
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
    public static boolean updateIndex(String id, Doc doc, String content, String indexLib)
    {
    	System.out.println("updateIndex() id:" + id + " docId:"+ doc.getId() + " path:" + doc.getPath() + " name:" + doc.getName() + " indexLib:"+indexLib);
    	//System.out.println("updateIndex() content:" + content);
    
		try {
	    	Date date1 = new Date();
	        Analyzer analyzer = new IKAnalyzer();
    		File file = new File(INDEX_DIR + File.separator +indexLib);
	        Directory directory = FSDirectory.open(file);
	        IndexWriterConfig config = new IndexWriterConfig(
	                Version.LUCENE_CURRENT, analyzer);
	        IndexWriter indexWriter = new IndexWriter(directory, config);
	         
	        Document document = new Document();
	        document.add(new Field("id", id, Store.YES,Index.NOT_ANALYZED_NO_NORMS));
	        document.add(new IntField("reposId", doc.getId(), Store.YES));
	        document.add(new IntField("docId", doc.getId(), Store.YES));	//docId总是可以通过docPath 和 docName计算出来
	        document.add(new IntField("type", doc.getType(), Store.YES));	//1: file 2: dir 用来保存Lucene和实际文件的区别
	        document.add(new Field("parentPath", doc.getPath(), Store.YES,Index.NOT_ANALYZED_NO_NORMS));
	        document.add(new Field("name", doc.getName(), Store.YES,Index.NOT_ANALYZED_NO_NORMS));
	        document.add(new TextField("content", content, Store.NO));	//Content有可能会很大，所以只切词不保存	        
	        
	        indexWriter.updateDocument(new Term("id",id), document);
	        indexWriter.close();
	         
	        Date date2 = new Date();
	        System.out.println("更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	        return true;
		} catch (IOException e) {
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
    public static boolean deleteIndex(String id,String indexLib)
    {
    	try {
	    	System.out.println("deleteIndex() id:" + id + " indexLib:"+indexLib);
	        Date date1 = new Date();
    		
	        File file = new File(INDEX_DIR + File.separator +indexLib);
    		if(!file.exists())
    		{
    			return true;
    		}
    		
	        Directory directory = FSDirectory.open(file);
	
	        IndexWriterConfig config = new IndexWriterConfig(
	                Version.LUCENE_CURRENT, null);
	        IndexWriter indexWriter = new IndexWriter(directory, config);
	        
	        indexWriter.deleteDocuments(new Term("id",id));  
	        indexWriter.commit();
	        indexWriter.close();
	        
	        Date date2 = new Date();
	        System.out.println("删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	        return true;
		} catch (IOException e) {
			System.out.println("deleteIndex() 异常");
			e.printStackTrace();
			return false;
		}
    }    

    /**
     * 	关键字模糊查询， 返回docId List
     * @param parentPath 
     * @param <SearchResult>
     * @param str: 关键字
     * @param indexLib: 索引库名字
     */
	public static boolean search(Repos repos, String str, String pathFilter, String field, String indexLib, HashMap<String, HitDoc> searchResult, int searchType)
	{
		System.out.println("search() keyWord:" + str + " field:" + field + " indexLib:" + indexLib);
		try {
    		File file = new File(INDEX_DIR + "/" +indexLib);
    		if(!file.exists())
    		{
    			System.out.println("search() keyWord:" + str + " indexLib:" + indexLib);
    			return false;
    		}
    		
	        Directory directory = FSDirectory.open(file);
	        DirectoryReader ireader = DirectoryReader.open(directory);
	        IndexSearcher isearcher = new IndexSearcher(ireader);
	
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
	        	QueryParser parser = new QueryParser(Version.LUCENE_CURRENT, field,analyzer);
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
	            
	            AddHitDocToSearchResult(searchResult,hitDoc, str);
	        }
	        
	        ireader.close();
	        directory.close();
			return true;
		} catch (Exception e) {
			System.out.println("search() 异常");
			e.printStackTrace();
			return false;
		}
    }
    
	public static boolean smartSearch(Repos repos, String str, String pathFilter, String field, String indexLib, HashMap<String, HitDoc> searchResult)
	{
		System.out.println("smartSearch() keyWord:" + str + " field:" + field + " indexLib:" + indexLib);
		//利用Index的切词器将查询条件切词后进行精确查找

		List <String> list = new ArrayList<String>();
		try {
			Analyzer analyzer = new IKAnalyzer();;
			TokenStream stream = analyzer.tokenStream("field", new StringReader(str));
		
			//保存分词后的结果词汇
			CharTermAttribute cta = stream.addAttribute(CharTermAttribute.class);
	
			stream.reset(); //这句很重要
	
			while(stream.incrementToken()) {
				System.out.println(cta.toString());
				list.add(cta.toString());
			}
	
			stream.end(); //这句很重要
	
			stream.close();

			analyzer.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		for(int i=0; i<list.size(); i++)
		{
			String searchStr = list.get(i);
			LuceneUtil2.search(repos, searchStr, pathFilter, field, indexLib, searchResult, 1);
		}
		return true;

    }
	
    private static HitDoc BuildHitDocFromDocument(Repos repos, String pathFilter, Document hitDocument) 
    {
    	switch(repos.getType())
    	{
    	case 1:
    		return BuildHitDocFromDocument_DB(repos, pathFilter, hitDocument);
    	case 2:
    		return BuildHitDocFromDocument_FS(repos, pathFilter, hitDocument);
    	case 3:
    		return BuildHitDocFromDocument_SVN(repos, pathFilter, hitDocument);
    	case 4:
    		return BuildHitDocFromDocument_GIT(repos, pathFilter, hitDocument);
    	}
		return null;
 	}

	private static HitDoc BuildHitDocFromDocument_GIT(Repos repos, String pathFilter, Document hitDocument) {
		// TODO Auto-generated method stub
		return null;
	}

	private static HitDoc BuildHitDocFromDocument_SVN(Repos repos, String pathFilter, Document hitDocument) {
		// TODO Auto-generated method stub
		return null;
	}

	private static HitDoc BuildHitDocFromDocument_DB(Repos repos, String pathFilter, Document hitDocument) {
		// TODO Auto-generated method stub
		return null;
	}

	private static HitDoc BuildHitDocFromDocument_FS(Repos repos, String pathFilter, Document hitDocument) {
        String reposRPath = getReposRealPath(repos);
        String docParentPath = hitDocument.get("path");
    	String docName =  hitDocument.get("name");	
    	String filePath = reposRPath + docParentPath + docName;
    	if(docParentPath == null)
    	{
    		filePath = reposRPath + docName;
    	}
    	
        File hitFile = new File(filePath);
        if(!hitFile.exists())
        {
        	System.out.print("BuildHitDocFromDocument_FS() " + filePath + " 不存在");
        	//TODO: if file type not matched
        	//Do delete all index for hitDoc
        	return null;
        }
        
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
    	Integer docId = null;
    	String str = hitDocument.get("docId");
    	if(str != null)
    	{
    		docId = Integer.parseInt(str);
    	}
    	Doc doc = new Doc();
    	doc.setId(docId);
    	doc.setPath(docParentPath);
    	doc.setName(docName);
    	doc.setSize((int) hitFile.length());
    	doc.setLatestEditTime(hitFile.lastModified());

    	//Set Doc Path
    	String docPath = null;
    	if(docParentPath == null)
    	{
    		docPath = docName;
    	}
    	else
    	{
    		docPath = docParentPath + docName;
    	}
    	
    	//Set HitDoc
    	HitDoc hitDoc = new HitDoc();
    	hitDoc.setDoc(doc);
    	hitDoc.setDocPath(docPath);
    	
    	return hitDoc;
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
    	try {
    		File file = new File(INDEX_DIR + File.separator +indexLib);
    		if(!file.exists())
    		{
    			return null;
    		}
    		
    		Directory directory = FSDirectory.open(file);

	    	DirectoryReader ireader = DirectoryReader.open(directory);
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
	        directory.close();
	        return res;
		} catch (IOException e) {
			System.out.println("getDocumentIdListByHashId() 异常");
			e.printStackTrace();
			return null;
		}
    }

	public static String buildDocumentId(Integer integer, int index) {
		return integer + "-" + index;
	}
	


	public static boolean addIndexForWord(String filePath, Doc doc, String indexLib)
	{
		try {
			StringBuffer content = new StringBuffer("");// 文档内容
	    	HWPFDocument doc1;
	    	FileInputStream fis = new FileInputStream(filePath);
    	
    		doc1 = new HWPFDocument(fis);

    		Range range = doc1.getRange();
    	    int paragraphCount = range.numParagraphs();// 段落
    	    for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
    	    	Paragraph pp = range.getParagraph(i);
    	    	content.append(pp.text());
    	    }
    	    
    		doc1.close();
    	    fis.close();
    		
    	    addIndex(buildDocumentId(doc.getId(),0), doc, content.toString().trim(), indexLib);
		} catch (Exception e) {
    		e.printStackTrace();
    		return false;
    	}
    	return true;		
	}

	public static boolean addIndexForWord2007(String filePath, Doc doc, String indexLib)
	{
		try {
	    	
			File file = new File(filePath);
	    	String str = "";
	    	FileInputStream fis = new FileInputStream(file);
	    	XWPFDocument xdoc;
    	
    		xdoc = new XWPFDocument(fis);
    		
        	XWPFWordExtractor extractor = new XWPFWordExtractor(xdoc);
        	str = extractor.getText();
        	
        	extractor.close();
        	xdoc.close();
        	fis.close();
        	
        	addIndex(buildDocumentId(doc.getId(),0), doc,str.toString().trim(), indexLib);
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
    	return true;
	}

	public static boolean addIndexForExcel(String filePath, Doc doc, String indexLib)
	{
        try {  
	
			InputStream is = new FileInputStream(filePath);  
	        String text="";  
	        HSSFWorkbook wb = null;  
            wb = new HSSFWorkbook(new POIFSFileSystem(is));  

            ExcelExtractor extractor=new ExcelExtractor(wb);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            text=extractor.getText();  
            
            extractor.close();
            wb.close();
            is.close();
              
            addIndex(buildDocumentId(doc.getId(),0), doc, text.toString().trim(), indexLib);
        } catch(Exception e)
        {
            e.printStackTrace();
            return false;
        }
        
        return true;
	}

	public static boolean addIndexForExcel2007(String filePath, Doc doc, String indexLib)
	{
		try {  
	        InputStream is = new FileInputStream(filePath);
	        XSSFWorkbook workBook = null;  
	        String text="";  
        	workBook = new XSSFWorkbook(is);  
            XSSFExcelExtractor extractor=new XSSFExcelExtractor(workBook);  
            text=extractor.getText();  

            extractor.close();
            workBook.close();
            is.close();
            
            addIndex(buildDocumentId(doc.getId(),0), doc, text.toString().trim(), indexLib);
		} catch (Exception e) {  
        	e.printStackTrace();  
        	return false;
        }       
        return true;
	}

	public static boolean addIndexForPPT(String filePath, Doc doc, String indexLib)
	{
		try {
			InputStream is = new FileInputStream(filePath);
	        PowerPointExtractor extractor = null;  
	        String text="";  
            extractor = new PowerPointExtractor(is);  
            text=extractor.getText();  
            
            extractor.close();
            is.close();            
            
            addIndex(buildDocumentId(doc.getId(),0), doc, text.toString().trim(), indexLib);
		} catch (Exception e) {  
            e.printStackTrace(); 
            return false;
        }          
		return true;
	}

	public static boolean addIndexForPPT2007(String filePath, Doc doc, String indexLib)
	{
        try {  
			InputStream is = new FileInputStream(filePath); 
	        String text="";  
	        XMLSlideShow slide = new XMLSlideShow(is);
            XSLFPowerPointExtractor extractor=new XSLFPowerPointExtractor(slide);  
            text=extractor.getText();  
            
            extractor.close();  
            is.close();
            
            addIndex(buildDocumentId(doc.getId(),0), doc, text.toString().trim(), indexLib);
        } catch (Exception e) {  
            e.printStackTrace(); 
            return false;
        }
        return true;
	}
	
	public static boolean addIndexForPdf(String filePath, Doc doc, String indexLib)
	{
		File pdfFile=new File(filePath);
		String content = "";
		try
		{
			PDDocument document=PDDocument.load(pdfFile);
			int pages = document.getNumberOfPages();
			// 读文本内容
			PDFTextStripper stripper=new PDFTextStripper();
			// 设置按顺序输出
			stripper.setSortByPosition(true);
			stripper.setStartPage(1);
			stripper.setEndPage(pages);
			content = stripper.getText(document);
			document.close();
			//System.out.println(content);     
			
            addIndex(buildDocumentId(doc.getId(),0), doc, content.toString().trim(), indexLib);
	   }
	   catch(Exception e)
	   {
	       e.printStackTrace();
	       return false;
	   }
	   return true;
	}

	public static boolean addIndexForFile(String filePath, Doc doc, String indexLib)
	{
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
			
			InputStream is = new FileInputStream(filePath);
			String line; // 用来保存每行读取的内容
			BufferedReader reader = new BufferedReader(new InputStreamReader(is, code));
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
					addIndex(buildDocumentId(doc.getId(),chunkIndex), doc, buffer.toString().trim(), indexLib);
					
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
				addIndex(buildDocumentId(doc.getId(),chunkIndex), doc, buffer.toString().trim(), indexLib);
				chunkIndex ++;
				System.out.println("addIndexForFile() lineCount:" + lineCount + " bufSize:" + bufSize + " chunkIndex:" + chunkIndex);
			}
			
		    reader.close();
		    is.close();
			System.out.println("addIndexForFile() totalLine:" + totalLine + " totalSize:" + totalSize + " chunks:" + chunkIndex);
		} catch(Exception e){
		       e.printStackTrace();
		       return false;
		}
		return true;
	}
}
