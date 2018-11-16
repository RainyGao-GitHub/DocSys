/**
 * 
 */
package util;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Field.Index;
import org.apache.lucene.document.Field.Store;
import org.apache.lucene.document.FieldType;
import org.apache.lucene.document.IntField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.NumericRangeQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
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

import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;


/**  
 * 类描述：   lucene索引增删改查的公共类
 * 创建人：高雨
 * 创建时间：2018-10-1
 * @version    
 * This class is the full-text search driver for DocSys
 * There are multi-lucence document mapped to one doc in DocSys, if the content of this Doc is very large    
 */
public class LuceneUtil2 {

	// 保存路径
    private static String INDEX_DIR = getLucenePath();
    private static Analyzer analyzer = null;
    private static Directory directory = null;
    private static IndexWriter indexWriter = null;
    
    private static String getLucenePath() {
		String path = ReadProperties.read("docSysConfig.properties", "lucenePath");
	    if(path == null || "".equals(path))
	    {
			String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				path = "C:/DocSys/Lucene/";
			}
			else
			{
				path = "/data/DocSys/Lucene/";	//Linux系统放在  /data	
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
    
	/**
	 *     	增加索引
     * @param id: lucence document id
     * @param docId:  docId of DocSys 
     * @param content: 文件内容或markdown文件内容 
     * @param type: 索引库名字
     */
    @SuppressWarnings("deprecation")
	public static void addIndex(String id,Integer docId, String content,String type) throws Exception {
    	
    	System.out.println("addIndex() id:" + id + " docId:"+ docId + " indexLib:"+type);
    	System.out.println("addIndex() content:" + content);
    	
    	Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator+ type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);

        Document doc = new Document();
        doc.add(new Field("id", id, Store.YES,Index.NOT_ANALYZED_NO_NORMS));
        doc.add(new IntField("docId", docId, Store.YES));
        doc.add(new TextField("content", content, Store.YES));
        indexWriter.addDocument(doc);
        
        indexWriter.commit();
        indexWriter.close();

        Date date2 = new Date();
        System.out.println("创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }

	/**
     * 	 更新索引
     * @param id: lucence document id
     * @param docId:  docId of DocSys 
     * @param content: 文件内容或markdown文件内容 
     * @param type: 索引库名字
     */
    @SuppressWarnings("deprecation")
	public static void updateIndex(String id,Integer docId,String content,String type) throws Exception {

    	System.out.println("updateIndex() id:" + id + " docId:"+ docId + " indexLib:"+type);
    	System.out.println("updateIndex() content:" + content);
    	
    	Date date1 = new Date();
        analyzer = new IKAnalyzer();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator + type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, analyzer);
        indexWriter = new IndexWriter(directory, config);
         
        Document doc1 = new Document();
        doc1.add(new Field("id", id, Store.YES,Index.NOT_ANALYZED_NO_NORMS));
        doc1.add(new IntField("docId", docId, Store.YES));
        doc1.add(new TextField("content", content, Store.YES));
        
        indexWriter.updateDocument(new Term("id",id), doc1);
        indexWriter.close();
         
        Date date2 = new Date();
        System.out.println("更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }
    
    /**
     * 	删除索引
     * 
     * @param id: lucene document id
     * @throws Exception
     */
    @SuppressWarnings("deprecation")
	public static void deleteIndex(String id,String type) throws Exception {
    	System.out.println("deleteIndex() id:" + id + " indexLib:"+type);
        Date date1 = new Date();
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator + type));

        IndexWriterConfig config = new IndexWriterConfig(
                Version.LUCENE_CURRENT, null);
        indexWriter = new IndexWriter(directory, config);
        
        indexWriter.deleteDocuments(new Term("id",id));  
        indexWriter.commit();
        indexWriter.close();
        
        Date date2 = new Date();
        System.out.println("删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
    }    

    /**
     * 	关键字精确查询,返回docId List
     * @param str: 关键字
     * @param type: 索引库名字
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
            String docId = hitDoc.get("docId");
            if(docId != null && !"".equals(docId))
            {
            	res.add(docId);
                System.out.println("search()  id:" + hitDoc.get("id") + " docId:"+ docId);
                //System.out.println("search()  content:" + hitDoc.get("content"));	
            }
        }
        ireader.close();
        directory.close();
        return res;
    }

    /**
     * 	关键字模糊查询， 返回docId List
     * @param str: 关键字
     * @param type: 索引库名字
     */
	public static List<String> fuzzySearch(String str,String type) throws Exception {
        directory = FSDirectory.open(new File(INDEX_DIR + File.separator +type));
        analyzer = new IKAnalyzer();
        DirectoryReader ireader = DirectoryReader.open(directory);
        IndexSearcher isearcher = new IndexSearcher(ireader);

        FuzzyQuery query = new FuzzyQuery(new Term("content",str));

        ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
        List<String> res = new ArrayList<String>();
        for (int i = 0; i < hits.length; i++) {
            Document hitDoc = isearcher.doc(hits[i].doc);
            String docId = hitDoc.get("docId");
            if(docId != null && !"".equals(docId))
            {
            	res.add(docId);
                System.out.println("fuzzySearch()  id:" + hitDoc.get("id") + " docId:"+ docId);
                //System.out.println("fuzzySearch()  content:" + hitDoc.get("content"));	
            }
        }
        ireader.close();
        directory.close();
        return res;
    }
    
    /**
	 * 	根据docId查询idList，返回idList
     * 
     * @param docId: DocSys doc id
     * @param type: 索引库名字
     */
    public static List<String> getIdListForDoc(Integer docId,String type) throws Exception {
    	System.out.println("getIdListForDoc() docId:" + docId + " type:" + type);
    	directory = FSDirectory.open(new File(INDEX_DIR + File.separator +type));
        analyzer = new IKAnalyzer();
        DirectoryReader ireader = DirectoryReader.open(directory);
        IndexSearcher isearcher = new IndexSearcher(ireader);

        Query query = NumericRangeQuery.newIntRange("docId", docId,docId, true,true);// 没问题

        ScoreDoc[] hits = isearcher.search(query, null, 1000).scoreDocs;
        List<String> res = new ArrayList<String>();
        for (int i = 0; i < hits.length; i++) {
            Document hitDoc = isearcher.doc(hits[i].doc);
            res.add(hitDoc.get("id"));
            System.out.println("searchResult: id:" + hitDoc.get("id") + " docId:"+ hitDoc.get("docId"));
        }
        ireader.close();
        directory.close();
        return res;
    }

    //Delete All Index For Doc
	public static void deleteIndexForDoc(Integer docId, String type) throws Exception {
		System.out.println("deleteIndexForDoc() docId:" + docId + " type:" + type);
		List<String> res = getIdListForDoc(docId, type);
		for(int i=0;i < res.size(); i++)
		{
			deleteIndex(res.get(i),type);
		}
	}
	
	//Delete Indexs For Real Doc
	public static void deleteIndexForRDoc(Integer docId, String type) throws Exception {
		System.out.println("deleteIndexForRDoc() docId:" + docId + " type:" + type);
		List<String> res = getIdListForDoc(docId, type);
		for(int i=0;i < res.size(); i++)
		{
			deleteIndex(generateRDocId(docId,i), type);
		}
	}
	
	
	//Add Index For RDoc
	public static void addIndexForRDoc(Integer docId, String filePath, String type) throws Exception {
		System.out.println("addIndexForRDoc() docId:" + docId + " type:" + type + " filePath:" + filePath);
		String fileType = getFileType(filePath);
		if(fileType == null)
		{
			System.out.println("addIndexForRDoc failed to get FileType");
			return;
		}
		
		switch(fileType)
		{
		case "doc":
			addIndexForWord(docId,filePath,type);
			break;
		case "docx":
			addIndexForWord2007(docId,filePath,type);
			break;
		case "xsl":
			addIndexForExcel(docId,filePath,type);
			break;
		case "xslx":
			addIndexForExcel2007(docId,filePath,type);
			break;
		case "pdf":
			addIndexForPdf(docId,filePath,type);
			break;
		case "ppt":
			addIndexForPPT(docId,filePath,type);
			break;
		case "pptx":
			addIndexForPPT2007(docId,filePath,type);
			break;
		default:
			addIndexForFile(docId,filePath,type);
			break;
		}
	}
	
	private static String getFileType(String filePath) {
		
		return null;
	}

	private static void addIndexForWord(Integer docId, String filePath, String type) throws Exception {
    	StringBuffer content = new StringBuffer("");// 文档内容
    	try {
			HWPFDocument doc = new HWPFDocument(new FileInputStream(filePath));
	    	Range range = doc.getRange();
	    	int paragraphCount = range.numParagraphs();// 段落
	    	for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
	    		Paragraph pp = range.getParagraph(i);
	    		content.append(pp.text());
	    	}
    	} catch (Exception e) {
    		e.printStackTrace();
    	}
    	addIndex(generateRDocId(docId,0),docId,content.toString().trim(),type);
		
	}

	private static void addIndexForWord2007(Integer docId, String filePath, String type) throws Exception {
    	File file = new File(filePath);
    	String str = "";
    	try {
    		FileInputStream fis = new FileInputStream(file);
    		XWPFDocument xdoc = new XWPFDocument(fis);
    		XWPFWordExtractor extractor = new XWPFWordExtractor(xdoc);
    		str = extractor.getText();
    		fis.close();
    	} catch (Exception e) {
    		 e.printStackTrace();
    	}
    	addIndex(generateRDocId(docId,0),docId,str,type);
	}

	private static void addIndexForExcel(Integer docId, String filePath, String type) throws Exception {
        InputStream is = null;  
        HSSFWorkbook wb = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            wb = new HSSFWorkbook(new POIFSFileSystem(is));  
            ExcelExtractor extractor=new ExcelExtractor(wb);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
        } catch (IOException e) {  
            System.out.println("getTextFromExcel IO错误");  
            e.printStackTrace();  
        }  
        addIndex(generateRDocId(docId,0),docId,text,type);
	}

	private static void addIndexForExcel2007(Integer docId, String filePath, String type) throws Exception {
        InputStream is = null;  
        XSSFWorkbook workBook = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            workBook = new XSSFWorkbook(is);  
            XSSFExcelExtractor extractor=new XSSFExcelExtractor(workBook);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
        } catch (IOException e) {  
            System.out.println("getTextFromExcel2007 IO错误");  
            e.printStackTrace();  
        }  
        addIndex(generateRDocId(docId,0),docId,text,type); 
	}

	private static void addIndexForPdf(Integer docId, String filePath, String type) throws Exception {
		File pdfFile=new File(filePath);
		PDDocument document = null;
		String content = "";
		try
		{
	       document=PDDocument.load(pdfFile);
	       int pages = document.getNumberOfPages();
	       // 读文本内容
	       PDFTextStripper stripper=new PDFTextStripper();
	       // 设置按顺序输出
	       stripper.setSortByPosition(true);
	       stripper.setStartPage(1);
	       stripper.setEndPage(pages);
	       content = stripper.getText(document);
	       System.out.println(content);     
	   }
	   catch(Exception e)
	   {
	       e.printStackTrace();
	       return;
	   }
	   addIndex(generateRDocId(docId,0),docId,content,type);
	}

	private static void addIndexForPPT(Integer docId, String filePath, String type) throws Exception {
        InputStream is = null;  
        PowerPointExtractor extractor = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            extractor = new PowerPointExtractor(is);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
            return;
        } catch (IOException e) {  
            System.out.println("getTextFromPPT IO错误");  
            e.printStackTrace(); 
            return;
        }  
        addIndex(generateRDocId(docId,0),docId,text,type);
		
	}

	private static void addIndexForPPT2007(Integer docId, String filePath, String type) throws Exception {
        InputStream is = null;  
        XMLSlideShow slide = null;  
        String text="";  
        try {  
            is = new FileInputStream(filePath);  
            slide = new XMLSlideShow(is);  
            XSLFPowerPointExtractor extractor=new XSLFPowerPointExtractor(slide);  
            text=extractor.getText();  
            extractor.close();  
        } catch (FileNotFoundException e) {  
            System.out.println("没有找到指定路径"+filePath);  
            e.printStackTrace();  
            return;
        } catch (IOException e) {  
            System.out.println("getTextFromPPT2007 IO错误");  
            e.printStackTrace(); 
            return;
        }  
        addIndex(generateRDocId(docId,0),docId,text,type);	
	}

	private static void addIndexForFile(Integer docId, String filePath, String type) throws Exception {
		int lineCount = 0;
		int totalLine = 0;
		
		int bufSize = 0;
		int totalSize = 0;
		
		int chunkIndex = 0;
		
		StringBuffer buffer = new StringBuffer();
		String code = getFileEncode(filePath);
		if(isBinaryFile(code) == true)
		{
			System.out.println("addIndexForFile() BinaryFile will not add Index");
			return;
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
				addIndex(generateRDocId(docId,chunkIndex),docId,buffer.toString(),type);
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
			addIndex(generateRDocId(docId,chunkIndex),docId,buffer.toString(),type);
			chunkIndex ++;
			System.out.println("addIndexForFile() lineCount:" + lineCount + " bufSize:" + bufSize + " chunkIndex:" + chunkIndex);
		}
		
	    reader.close();
	    is.close();
		System.out.println("addIndexForFile() totalLine:" + totalLine + " totalSize:" + totalSize + " chunks:" + chunkIndex);
		
	}

	private static boolean isBinaryFile(String code) {
		System.out.println("isBinaryFile:" + code);
		if(code == null)
		{
			return true;
		}
		
		switch(code)
		{
		case "GBK":
		case "UTF-8":
		case "UTF-16":
		case "Unicode":
			return false;
		}
		return true;
	}

	//Update Index For RDoc
	public static void updateIndexForRDoc(Integer docId, String filePath, String type) throws Exception {
		System.out.println("updateIndexForRDoc() docId:" + docId + " type:" + type + " filePath:" + filePath);
		deleteIndexForRDoc(docId,type);
		addIndexForRDoc(docId,filePath,type);
	}
	
	
	//Delete Indexs For Virtual Doc
	public static void deleteIndexForVDoc(Integer docId, String type) throws Exception {
		System.out.println("deleteIndexForVDoc() docId:" + docId + " type:" + type);
		deleteIndex(generateVDocId(docId,0), type);
	}

	//Add Index For VDoc
	public static void addIndexForVDoc(Integer docId, String content, String type) throws Exception {
		System.out.println("addIndexForVDoc() docId:" + docId + " type:" + type);
		addIndex(generateVDocId(docId,0),docId,content,type);
	}
		
	//Update Index For RDoc
	public static void updateIndexForVDoc(Integer docId, String content, String type) throws Exception {
		System.out.println("updateIndexForVDoc() docId:" + docId + " type:" + type);
		updateIndex(generateVDocId(docId,0),docId,content,type);
	}
	
	private static String generateVDocId(Integer docId, int index) {
		return "VDoc-" + docId + "-" + index;
		//return docId+"-0";
	}

	private static String generateRDocId(Integer docId, int index) {
		return "RDoc-" + docId + "-" + index;
		//return docId+"-"+ (index+1);
	}
	
	public static void readToBuffer(StringBuffer buffer, String filePath) throws Exception
	{
		String code = getFileEncode(filePath);
		InputStream is = new FileInputStream(filePath);
		String line; // 用来保存每行读取的内容
		BufferedReader reader = new BufferedReader(new InputStreamReader(is, code));
		line = reader.readLine(); // 读取第一行
		while (line != null) { // 如果 line 为空说明读完了
			buffer.append(line); // 将读到的内容添加到 buffer 中
			buffer.append("\n"); // 添加换行符
			line = reader.readLine(); // 读取下一行
	    }
	    reader.close();
	    is.close();
	}
	
	/**
	 * 获取文件编码格式
	 * @param filePath
	 * @return UTF-8/Unicode/UTF-16BE/GBK
	 * @throws Exception
	 */
	public static String getFileEncode(String filePath) throws Exception {
        String charsetName = null;
        try {
            File file = new File(filePath);
            CodepageDetectorProxy detector = CodepageDetectorProxy.getInstance();
            detector.add(new ParsingDetector(false));
            detector.add(JChardetFacade.getInstance());
            detector.add(ASCIIDetector.getInstance());
            detector.add(UnicodeDetector.getInstance());
            java.nio.charset.Charset charset = null;
            charset = detector.detectCodepage(file.toURI().toURL());
            if (charset != null) {
                charsetName = charset.name();
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
        return charsetName;
	}
	
	public static String readFile(String filePath) throws Exception {
	    StringBuffer sb = new StringBuffer();
	    readToBuffer(sb, filePath);
	    return sb.toString();
	}
}
