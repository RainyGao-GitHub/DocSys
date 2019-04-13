package util.LuceneUtil;
import java.io.File;
import java.io.IOException;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.LockObtainFailedException;
import org.apache.lucene.util.Version;
/** 
 * @ClassName: Lucene_index 
 * @Description: TODO(这里用一句话描述这个类的作用) 
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-8-5 下午4:49:15 
 * @version V1.0   
 */
public class Lucene_index {

	private String[] ids={"1","2","3","4","5","6"};
	private String[] emails={"aa@aa.org","cc@cc.org","dd@@dd.org","bb@bb.org","ee@ee.org","ff@ff.org"};
	private String[] contents={"welcometotyu","hellowboy","higirl","howareyou","googluck","badgosh"};
	private int[] attachs={1,2,3,4,5,6};
	private String[] names={"liwu","zhangsan","xiaoqinag","laona","dabao","lisi"};
	private Directory directory=null;
	
	public Lucene_index()
	{
		try {
			directory=FSDirectory.open(new File("f:/lucene/index02"));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	public void quary()
	{
		try {
			IndexReader reader=IndexReader.open(directory);
			System.out.println("numdocs"+reader.numDocs());
			System.out.println("maxDocs"+reader.maxDoc());
			System.out.println("detelemaxDocs"+reader.numDeletedDocs());
			reader.close();
		} catch (CorruptIndexException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block 
			e.printStackTrace();
		}
		
	}
	
	@SuppressWarnings("deprecation")
	public void undelete()
	{
//		try {
//			//回复时必须把reader的只读设为false
//			IndexReader reader=IndexReader.open(directory,false);
//			reader.undeleteAll();
//			reader.close();
//		} catch (CorruptIndexException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		} catch (IOException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
		
	}

	//清空回收站，强制优化
	public void forceDelete()
	{
		IndexWriter writer=null;
		try {
			writer=new IndexWriter(directory, new IndexWriterConfig(Version.LUCENE_46,
					new StandardAnalyzer(Version.LUCENE_46)));
			//参数十一个选项，可以是一个query，也可以是一个term  term就是一个精确查找的值
			//此时删除的文档并未完全删除，而是存储在回收站中，可以恢复的
			writer.forceMergeDeletes();
		} catch (CorruptIndexException e) {
			e.printStackTrace();
		} catch (LockObtainFailedException e) {
			e.printStackTrace();
		} catch (IOException e) {
		    e.printStackTrace();
		}
		finally{
			if (writer!=null) {
				try {
					writer.close();
				} catch (CorruptIndexException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}
	
	public void merge()
	{
		IndexWriter writer=null;
		try {
			writer=new IndexWriter(directory, new IndexWriterConfig(Version.LUCENE_46,
					new StandardAnalyzer(Version.LUCENE_46)));
			
			writer.forceMerge(2);
		} catch (CorruptIndexException e) {
			e.printStackTrace();
		} catch (LockObtainFailedException e) {
			e.printStackTrace();
		} catch (IOException e) {
		    e.printStackTrace();
		}
		finally{
			if (writer!=null) {
				try {
					writer.close();
				} catch (CorruptIndexException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}
	
	public void delete()
	{
		IndexWriter writer=null;
		try {
			writer=new IndexWriter(directory, new IndexWriterConfig(Version.LUCENE_46,
					new StandardAnalyzer(Version.LUCENE_46)));
			//参数十一个选项，可以是一个query，也可以是一个term  term就是一个精确查找的值
			//此时删除的文档并未完全删除，而是存储在回收站中，可以恢复的
			writer.deleteDocuments(new Term("id","1"));
		} catch (CorruptIndexException e) {
			e.printStackTrace();
		} catch (LockObtainFailedException e) {
			e.printStackTrace();
		} catch (IOException e) {
		    e.printStackTrace();
		}
		finally{
			if (writer!=null) {
				try {
					writer.close();
				} catch (CorruptIndexException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}
	public void index()
	{
		   IndexWriter writer=null;
		   Document doc=null;
		   try {
			writer =new IndexWriter(directory,new IndexWriterConfig(Version.LUCENE_46, 
					   new StandardAnalyzer(Version.LUCENE_46)));
			//writer.deleteAll();
			for(int i=0;i<ids.length;i++)
			{
				doc=new Document();
		    	doc.add(new Field("id",ids[i],Field.Store.YES,Field.Index.NOT_ANALYZED_NO_NORMS));
		    	doc.add(new Field("emails",emails[i],Field.Store.YES,Field.Index.NOT_ANALYZED));
		    	doc.add(new Field("contents",contents[i],Field.Store.YES,Field.Index.ANALYZED));
		    	doc.add(new Field("name",names[i],Field.Store.YES,Field.Index.NOT_ANALYZED_NO_NORMS));
		    	writer.addDocument(doc); 
			}
		} catch (CorruptIndexException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (LockObtainFailedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		   finally{
			   if(writer!=null)
			   {
				  try {
					writer.close();
				} catch (CorruptIndexException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}   
			   }
		   }
	}
   //更新索引
	public void update()
	{
		/*lucene本身不支持更新
		 * 
		 * 通过删除索引然后再建立索引来更新
		 */
		  IndexWriter writer=null;
		   Document doc=null;
		   try {
			writer =new IndexWriter(directory,new IndexWriterConfig(Version.LUCENE_46, 
					   new StandardAnalyzer(Version.LUCENE_46)));
			writer.deleteAll();
			for(int i=0;i<ids.length;i++)
			{
				doc=new Document();
		    	doc.add(new Field("id",ids[i],Field.Store.YES,Field.Index.NOT_ANALYZED_NO_NORMS));
		    	doc.add(new Field("emails",emails[i],Field.Store.YES,Field.Index.NOT_ANALYZED));
		    	doc.add(new Field("contents",contents[i],Field.Store.YES,Field.Index.ANALYZED));
		    	doc.add(new Field("name",names[i],Field.Store.YES,Field.Index.NOT_ANALYZED_NO_NORMS));
		    	writer.updateDocument(new Term("id","1"), doc); 
			}
		} catch (CorruptIndexException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (LockObtainFailedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		   finally{
			   if(writer!=null)
			   {
				  try {
					writer.close();
				} catch (CorruptIndexException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}   
			   }
		   }	
	}
}
