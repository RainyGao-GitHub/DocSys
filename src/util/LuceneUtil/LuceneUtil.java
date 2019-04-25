package util.LuceneUtil;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpSession;

import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.IndexWriterConfig.OpenMode;
import org.apache.lucene.index.MultiReader;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;
import org.wltea.analyzer.lucene.IKAnalyzer;

import util.ReadProperties;


/** 
 * @ClassName: LuceneUtil 
 * @Description: 智能搜索模块
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-8-5 上午10:52:45 
 * @version V1.0   
 */
public class LuceneUtil extends Thread{

	private IndexWriter w; //测试以及初始化时用的indexWriter
	
	private static LuceneUtil luceneUtil; //返回给调用的单例
	
	//4种indexwriter
	private static IndexWriter fileIndexWriter;
	
	private IndexWriter tmpFileIndexWriter;
	
	private IndexWriter ramIndexWriter;
	
	private IndexWriter tmpRamIndexWriter;
	
	//4种indexReader
	private IndexReader fileIndexReader;
	
	private IndexReader tmpFileIndexReader;
	
	private IndexReader ramIndexReader;
	
	private IndexReader tmpRamIndexReader;
	
	//4种索引
	private Directory fileIndex; //主硬盘文件索引，存储索引
	
	private Directory tmpFileIndex; //临时磁盘文件索引，主文件索引合并内存索引时临时代替朱磁盘文件索引
	
	private Directory ramIndex; //实时操作的内存索引
	
	private Directory tmpRamIndex; //当内存索引较大时，拷贝内存索引并合并至磁盘文件索引
	
	/**
	 * 该状态决定当前哪些IndexReader可用
	 * 当为0时:ramIndex、fileIndex
	 * 1：tmpRamIndex、fileIndex
	 * 2:tmpRamIndex、tmpFileIndex
	 */
	private int status = 0;
	
	
	class MyThead extends Thread{
		@Override
		public void run() {
			System.out.println("111");
			try {
				System.out.println("22");
				getFileIndexWriter();
				System.out.println(System.currentTimeMillis()+"正在创建临时磁盘索引...");
				
				tmpFileIndexWriter = getTmpFileIndexWriter();
				//将主磁盘索引文件复制到临时磁盘文件
				tmpFileIndexWriter.addIndexes(fileIndex);
				tmpFileIndexWriter.commit();
				tmpFileIndexReader = DirectoryReader.open(tmpFileIndex);
				status = 2;
				
				
				//合并内存临时索引到临时磁盘索引
				fileIndexWriter.addIndexes(tmpRamIndex);
				//提交
				fileIndexWriter.commit();
				//重新打开磁盘索引
				fileIndexReader = DirectoryReader.open(fileIndex);
				//清除无用的index，临时内存索引删除，临时磁盘索引保留
				tmpRamIndexWriter.deleteAll();
				status = 0;
				
				System.out.println(System.currentTimeMillis()+"合并临时内存索引到主磁盘索引成功...");
				System.out.println(System.currentTimeMillis()+"重新打开磁盘索引成功...");
				
				
			} catch (IOException e) {
				e.printStackTrace();
			}
			
		}
	}
	
	private void initIndexs() throws Exception{
		if(fileIndex==null){
			fileIndex = FSDirectory.open(new File(basePath));
		}
		
		if(tmpFileIndex==null){
			tmpFileIndex = FSDirectory.open(new File(tmpBasePath));
		}
		
		if(ramIndex==null){
			ramIndex = new RAMDirectory();
		}
		
		if(tmpRamIndex==null){
			tmpRamIndex = new RAMDirectory();
		}
		
	}
	
	/**
	 * 检查内存中的索引存储文档是否到最大值，最大值为20,如不够可修改
	 * @return 达到最大值返回true，否则返回false
	 * @throws Exception
	 */
	private boolean checkRamIndexNum() throws Exception{
		IndexReader reader = DirectoryReader.open(ramIndex);
		if(reader.numDocs()>=20){
			//如果内存索引达到最大值，则将内存索引指向一个新的空间，而将原内存索引放入缓存索引
			System.out.println(System.currentTimeMillis()+"内存索引文档数量大于20，正在向磁盘索引合并...");
			tmpRamIndexWriter = getTmpRAMIndexWriter();
			tmpRamIndexWriter.addIndexes(ramIndex);
			tmpRamIndexWriter.commit();
			ramIndexWriter.deleteAll();
			ramIndexWriter.commit();
			status = 1;
//			for(String s:ramIndex.listAll()){
//				ramIndex.copy(tmpRamIndex, s, s, IOContext.DEFAULT);
//				ramIndex.deleteFile(s);
//			}
			return true;
		}else{
			return false;
		}
	}
	
	
	public static LuceneUtil getInstanse(){
		if(luceneUtil==null){
			luceneUtil = new LuceneUtil();
			try {
				luceneUtil.initIndexs();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return luceneUtil;
	}
	
	//统一设定WEB运行时的文件索引存储路径(必须在web环境下才能获取到路径)
	public String basePath = ReadProperties.read("docSysConfig.properties", "lucenePath");
	
	public String tmpBasePath = ReadProperties.read("docSysConfig.properties", "tmpLucenePath");
	
	//统一设定Lucene版本号
	private Version currentVersion = Version.LUCENE_46;
	
	//统一设定分词器为第三方中文分词器
	private IKAnalyzer analyzer = new IKAnalyzer();
	
	/**
	 * 获取主文件索引写入器
	 * @return
	 */
	@SuppressWarnings("static-access")
	private IndexWriter getFileIndexWriter(){
		if(fileIndexWriter==null){
			//初始化索引操作的参数
			IndexWriterConfig indexWriterConfig = new IndexWriterConfig(currentVersion, analyzer);
			indexWriterConfig.setOpenMode(OpenMode.CREATE_OR_APPEND);
			Directory d = null;
			try {
				//设置索引存储位置
				d = FSDirectory.open(new File(basePath));
				//创建操作索引,先判断是否被锁住
				if(fileIndexWriter.isLocked(d)){
					fileIndexWriter.unlock(d);
				}
				fileIndexWriter = new IndexWriter(d, indexWriterConfig);
			} catch (Exception e) {
				System.out.println("ERROR>>>>>>>>>>LuceneUtil.java:getIndexWriter()");
				e.printStackTrace();
			} 
		}else{
		}
		return fileIndexWriter;
	}
	
	/**
	 * 获取临时文件索引写入器
	 * @return
	 */
	@SuppressWarnings("static-access")
	private IndexWriter getTmpFileIndexWriter(){
		if(tmpFileIndexWriter==null){
			//初始化索引操作的参数
			IndexWriterConfig indexWriterConfig = new IndexWriterConfig(currentVersion, analyzer);
			indexWriterConfig.setOpenMode(OpenMode.CREATE_OR_APPEND);
			Directory d = null;
			try {
				//设置索引存储位置
				d = FSDirectory.open(new File(tmpBasePath));
				//创建操作索引,先判断是否被锁住
				if(tmpFileIndexWriter.isLocked(d)){
					tmpFileIndexWriter.unlock(d);
				}
				tmpFileIndexWriter = new IndexWriter(d, indexWriterConfig);
			} catch (Exception e) {
				System.out.println("ERROR>>>>>>>>>>LuceneUtil.java:getIndexWriter()");
				e.printStackTrace();
			} 
		}
		
		return tmpFileIndexWriter;
	}
	
	/**
	 * 获取内存索引写入器
	 * @return
	 */
	@SuppressWarnings("static-access")
	private IndexWriter getRAMIndexWriter(){
		if(ramIndexWriter==null){
			//初始化索引操作的参数
			IndexWriterConfig indexWriterConfig = new IndexWriterConfig(currentVersion, analyzer);
			indexWriterConfig.setOpenMode(OpenMode.CREATE_OR_APPEND);
			try {
				//设置索引存储位置
				//创建操作索引,先判断是否被锁住
				if(ramIndexWriter.isLocked(ramIndex)){
					ramIndexWriter.unlock(ramIndex);
				}
				ramIndexWriter = new IndexWriter(ramIndex, indexWriterConfig);
			} catch (Exception e) {
				System.out.println("ERROR>>>>>>>>>>LuceneUtil.java:getRamIndexWriter()");
				e.printStackTrace();
			} 
		}
		return ramIndexWriter;
	}
	
	/**
	 * 获取内存索引写入器
	 * @return
	 */
	@SuppressWarnings("static-access")
	private IndexWriter getTmpRAMIndexWriter(){
		if(tmpRamIndexWriter==null){
			//初始化索引操作的参数
			IndexWriterConfig indexWriterConfig = new IndexWriterConfig(currentVersion, analyzer);
			indexWriterConfig.setOpenMode(OpenMode.CREATE_OR_APPEND);
			try {
				//设置索引存储位置
				//创建操作索引,先判断是否被锁住
				if(tmpRamIndexWriter.isLocked(tmpRamIndex)){
					tmpRamIndexWriter.unlock(tmpRamIndex);
				}
				tmpRamIndexWriter = new IndexWriter(tmpRamIndex, indexWriterConfig);
			} catch (Exception e) {
				System.out.println("ERROR>>>>>>>>>>LuceneUtil.java:getTmpRamIndexWriter()");
				e.printStackTrace();
			} 
		}
		return tmpRamIndexWriter;
	}
	
	/**
	 * 根据不同的情况对打开不同的读索引器
	 * @throws IOException
	 */
	private void initIndexReaders() throws IOException{
		if(fileIndexReader==null&&fileIndex!=null){
			fileIndexReader = DirectoryReader.open(fileIndex);
		}
		
		if(tmpFileIndexReader==null&&tmpFileIndex!=null){
			tmpFileIndexReader = DirectoryReader.open(tmpFileIndex);
		}
		
		if(ramIndexReader==null&&ramIndex!=null){
			ramIndexReader = DirectoryReader.open(ramIndex);
		}
		
		if(tmpRamIndexReader==null&&tmpRamIndex!=null){
			tmpRamIndexReader = DirectoryReader.open(tmpRamIndex);
		}
	}
	
	/**
	 * 将文档写入内存索引
	 * @param l
	 * @return
	 * @throws Exception 
	 */
	public boolean writeDocIntoRAMIndex(LuceneDto l) throws Exception{
		System.out.println(System.currentTimeMillis()+"开始写索引:"+l.toString());
		getRAMIndexWriter();
		addDoc(ramIndexWriter, l);
		ramIndexWriter.commit();
		boolean flag = checkRamIndexNum();
		if(flag){
			new MyThead().start();
		}
		return true;
	}
	
	
	//=========================== old code ====================================================
	
	@SuppressWarnings("static-access")
	public IndexWriter getIndexWriter(){
		if(w==null){
			//初始化第三方中文词法分析器
			IKAnalyzer analyzer = new IKAnalyzer();
			//初始化索引操作的参数
			IndexWriterConfig indexWriterConfig = new IndexWriterConfig(Version.LUCENE_46, analyzer);
			indexWriterConfig.setOpenMode(OpenMode.CREATE_OR_APPEND);
			Directory d = null;
			try {
				//设置索引存储位置
				d = FSDirectory.open(new File(basePath));
				//创建操作索引,先判断是否被锁住
				if(w.isLocked(d)){
					w.unlock(d);
				}
				w = new IndexWriter(d, indexWriterConfig);
			} catch (Exception e) {
				System.out.println("ERROR>>>>>>>>>>LuceneUtil.java:getIndexWriter()");
				e.printStackTrace();
			} 
			return w;
		}else{
			return w;
		}
	}
	
	
	private String[][] JOB={{"1","1","IOS"},{"1","2","Android"},{"1","3","WP"},{"2","4","Web前端"},{"2","5","HTML5"},{"2","6","JavaScript"},{"2","7","HTML"},{"2","8","Flash"},{"3","9","Java"},{"3","10","PHP"},{"3","11","C++"},{"3","12","C#"},{"3","13","Ruby"},{"3","14","Python"},{"3","15","VB"},{"3","16","Node.js"},{"3","17","Perl"},{"3","18","Go"},{"3","19","Delphi"},{"4","20","MySQL"},{"4","21","Oracle"},{"4","22","SqlServer"},{"4","23","MongoDB"},{"4","24","DB2"},{"4","25","ETL"},{"4","26","NoSQL"},{"5","27","Hadoop"},{"5","28","Yarn"},{"5","29","Spark"},{"5","30","云存储"},{"5","31","虚拟化"},{"5","32","IaaS"},{"5","33","PaaS"},{"5","34","SaaS"},{"5","35","Hive"},{"6","36","广告算法"},{"6","37","图像梳理算法"},{"6","38","推荐算法"},{"6","39","数据挖掘"},{"6","40","机器学习"},{"6","41","自然语言处理"},{"6","42","搜索引擎"},{"6","43","用户行为分析"},{"6","44","商业智能"},{"6","45","数据仓库"},{"6","46","决策支持(DSS)"},{"6","47","在线分析处理(OLAP)"},{"7","48","运维工程师"},{"7","49","网络工程师"},{"7","50","系统工程师"},{"7","51","安全工程师"},{"7","52","Web安全"},{"7","53","网络安全"},{"7","54","系统安全"},{"7","55","IT支持"},{"7","56","IDC"},{"7","57","CDN"},{"8","58","测试工程师"},{"8","59","自动化测试"},{"8","60","功能测试"},{"8","61","性能测试"},{"8","62","游戏测试"},{"8","63","移动应用App测试"},{"8","64","Web测试"},{"8","65","手机测试"},{"8","66","IC测试"},{"8","67","硬件测试"},{"8","68","系统测试"},{"8","69","白盒测试"},{"8","70","黑盒测试"},{"8","71","灰盒测试"},{"9","72","软件产品开发"},{"9","73","软件产品实施"},{"9","74","售前工程师"},{"9","75","售后支持工程师"},{"9","76","系统集成工程师"},{"9","77","配置管理"},{"10","78","IC设计"},{"10","79","PCB布线"},{"10","80","MCU开发"},{"10","81","DSP开发"},{"10","82","FPGA开发"},{"10","83","电气线路"},{"10","84","电源设计"},{"10","85","无线射频"},{"10","86","通信协议"},{"10","87","驱动开发"},{"10","88","系统设计及集成"},{"10","89","嵌入式开发"},{"10","90","工艺工程"},{"10","91","FAE/AE"},{"11","92","项目经理"},{"11","93","测试经理"},{"11","94","运维经理"},{"11","95","安全专家"},{"11","96","系统架构师"},{"12","97","产品经理"},{"12","98","UI/UE"},{"12","99","其它行业"}};

	/**
	 * 初始化index
	 */
	public void initBaseDoc(){
		List<LuceneDto> list = new ArrayList<LuceneDto>();
		for(String[] a:JOB){
			LuceneDto l = new LuceneDto();
			l.setSearchByJob(a[2], a[1]);
			//将初始化信息存储至硬盘主索引文件中
			w = getFileIndexWriter();
			list.add(l);
		}
		addDocs(w, list);
	}
	
	/**
	 * 分词器拆分搜索词
	 * @return
	 */
	public String analyzerWords(String queryStr){
		try {
			TokenStream tokenStream = analyzer.tokenStream("", queryStr);
			tokenStream.reset();
			CharTermAttribute term = tokenStream.getAttribute(CharTermAttribute.class);
			String str = "";
			while (tokenStream.incrementToken()) {
				str += term.toString()+"%";
				System.out.println(str);
			}
			System.out.println("");
			return str;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	/**
	 * 搜索索引
	 * @param queryStr 搜索关键字
	 * @param queryNum 返回条数
	 * @return
	 * @throws Exception
	 */
	public List<LuceneDto> queryLuceneDatas(String queryStr,int queryNum)throws Exception{
		initIndexReaders();
		IndexReader[] readers = new IndexReader[2];
		switch (status) {
		case 0:
			readers[0] = fileIndexReader;
			readers[1] = ramIndexReader;
			break;
		case 1:
			readers[0] = fileIndexReader;
			readers[1] = tmpRamIndexReader;
		case 2:
			readers[0] = tmpFileIndexReader;
			readers[1] = tmpRamIndexReader;
		default:
			break;
		}
		MultiReader multiReader = new MultiReader(readers, false);
		//创建索引搜索器
		IndexSearcher searcher = new IndexSearcher(multiReader);
		QueryParser parser = new QueryParser(currentVersion,"content",analyzer);
		Query query = parser.parse(queryStr);
		TopDocs topDocs = searcher.search(query, queryNum);
		List<LuceneDto> list = new ArrayList<LuceneDto>();
		if(topDocs!=null){
			
			System.out.println("符合条件的文档总数：" + topDocs.totalHits);
			//搜索文档保存在scoreDocs中
			for(int i = 0;i < topDocs.scoreDocs.length; i++){
				LuceneDto luceneDto = new LuceneDto();
				
				Document doc = searcher.doc(topDocs.scoreDocs[i].doc);
				luceneDto.setCode(doc.get("code"));
				luceneDto.setContent(doc.get("content"));
				luceneDto.setType(doc.get("type"));
				list.add(luceneDto);
			}
		}
		
		return list;
	}
	
	/**
	 * 按条件查询结果
	 * @param queryStr 查询条件
	 * @param queryNum 查询数量
	 * @return
	 */
	public List<LuceneDto> query(String queryStr, int queryNum)throws Exception{
//			Directory directory = null;
//			//设置索引存储位置
//			directory = FSDirectory.open(new File(basePath));
		fileIndex = FSDirectory.open(new File(basePath));
		//创建索引读取器
		IndexReader reader = DirectoryReader.open(fileIndex);
		//创建索引搜索器
		IndexSearcher searcher = new IndexSearcher(reader);
		//要和创建索引时的分词技术一样。因此创建第三方中文分词
		IKAnalyzer analyzer = new IKAnalyzer();
		QueryParser parser = new QueryParser(Version.LUCENE_46, "content", analyzer);
		Query query = parser.parse(queryStr);
		TopDocs topDocs = searcher.search(query, queryNum);
//			if(topDocs!=null){
//				System.out.println("符合条件的文档总数：" + topDocs.totalHits);
//				//搜索文档保存在scoreDocs中
//				for(int i = 0;i < topDocs.scoreDocs.length; i++){
//					Document doc = searcher.doc(topDocs.scoreDocs[i].doc);
//					System.out.println("content: " + doc.get("content"));
//				}
//			}
		List<LuceneDto> list = new ArrayList<LuceneDto>();
		if(topDocs!=null){
			
			System.out.println("符合条件的文档总数：" + topDocs.totalHits);
			//搜索文档保存在scoreDocs中
			for(int i = 0;i < topDocs.scoreDocs.length; i++){
				LuceneDto luceneDto = new LuceneDto();
				
				Document doc = searcher.doc(topDocs.scoreDocs[i].doc);
				luceneDto.setCode(doc.get("code"));
				luceneDto.setContent(doc.get("content"));
				luceneDto.setType(doc.get("type"));
				list.add(luceneDto);
			}
		}
		
		return list;
	}
	
	public void addDoc(IndexWriter w, LuceneDto l){
		try {
			Document doc = new Document();
			doc.add(new StringField("type", l.getType(), Field.Store.YES));
			doc.add(new StringField("code", l.getCode(), Field.Store.YES));
			doc.add(new TextField("content", l.getContent(), Field.Store.YES));
			w.addDocument(doc);
			w.commit();
		} catch (Exception e) {
			System.out.println("ERROR>>>>>>>>>LuceneUtil:addDic()");
			e.printStackTrace();
		}
	}
	
	private void addDocs(IndexWriter w, List<LuceneDto> list){
		try {
			for(LuceneDto l:list){
				Document doc = new Document();
				doc.add(new StringField("type", l.getType(), Field.Store.YES));
				doc.add(new StringField("code", l.getCode(), Field.Store.YES));
				doc.add(new TextField("content", l.getContent(), Field.Store.YES));
				w.addDocument(doc);
			}
			w.commit();
		} catch (Exception e) {
			System.out.println("ERROR>>>>>>>>>LuceneUtil:addDic()");
			e.printStackTrace();
		}
	}
	

}
