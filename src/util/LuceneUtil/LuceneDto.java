package util.LuceneUtil;

/** 
 * @ClassName: LuceneDto 
 * @Description: Lucene对应的文档对象
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-8-4 下午5:31:08 
 * @version V1.0   
 */
public class LuceneDto {

	//暂时没想好怎么用
	private String id;
	
	//如果是按照职业搜索，此处填job，如果是按项目/服务名称搜索，此处填title
	private String type;
	
	//关键字或者项目/服务的名称
	private String content; 
	
	//1.如果是按项目/服务名称搜索，此处储存项目/服务ID
	//2.如果是按职业搜索，此处储存关键字ID
	private String code;
	
	@Override
	public String toString() {
		return "code:"+code+",type:"+type+",content:"+content;
	}

	public String getId() {
		return id;
	}

	/**
	 * 根据项目/服务的标题搜索
	 * @param content
	 * @param code
	 */
	public void setSearchByTitle(String content,String code){
		this.type = "title";
		this.code = code;
		this.content = content;
	}
	
	/**
	 * 根据职业搜索
	 * @param content
	 * @param code
	 */
	public void setSearchByJob(String content,String code){
		this.type = "job";
		this.code = code;
		this.content = content;
	}
	
	
	//============================ getters and setters ===========================================
	public void setId(String id) {
		this.id = id;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	} 
	
	
}
