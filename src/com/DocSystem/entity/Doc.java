package com.DocSystem.entity;

public class Doc  implements Comparable<Doc>{
    private Integer id;	//id in dataBase
    
    private Integer docId;	//docId get by level and name
    		
    private String name;

    private Integer type;

    private Long size;

    private String checkSum;

    private String revision;

    private String path;

    private Long docId;

    private Long pid;

    private Integer vid;

    private String pwd;

    private Integer creator;

    private Long createTime;

    private Integer latestEditor;

    private Long latestEditTime;

    private String content;

	private int sortIndex;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getCheckSum() {
        return checkSum;
    }

    public void setCheckSum(String checkSum) {
        this.checkSum = checkSum == null ? null : checkSum.trim();
    }

    public String getRevision() {
        return revision;
    }

    public void setRevision(String revision) {
        this.revision = revision == null ? null : revision.trim();
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path == null ? null : path.trim();
    }

    public Long getDocId() {
        return docId;
    }

    public void setDocId(Long docId) {
        this.docId = docId;
    }

    public Long getPid() {
        return pid;
    }

    public void setPid(Long pid) {
        this.pid = pid;
    }

    public Integer getVid() {
        return vid;
    }

    public void setVid(Integer vid) {
        this.vid = vid;
    }

    public String getPwd() {
        return pwd;
    }

    public void setPwd(String pwd) {
        this.pwd = pwd == null ? null : pwd.trim();
    }

    public Integer getCreator() {
        return creator;
    }

    public void setCreator(Integer creator) {
        this.creator = creator;
    }

    public Long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }

    public Integer getLatestEditor() {
        return latestEditor;
    }

    public void setLatestEditor(Integer latestEditor) {
        this.latestEditor = latestEditor;
    }

    public Long getLatestEditTime() {
        return latestEditTime;
    }

    public void setLatestEditTime(Long latestEditTime) {
        this.latestEditTime = latestEditTime;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content == null ? null : content.trim();
    }

	public void setSortIndex(int sortIndex) {
		this.sortIndex = sortIndex;
	}
	
	public int getSortIndex() {
		return sortIndex;
	}
	
    public int compareTo(Doc doc) {
    	//Sort By sortIndex
        int ret = doc.sortIndex - this.sortIndex;
        if(ret != 0)
        {
        	return ret;
        }
        
        //Sort by docType
        ret = doc.type - this.type;
        if(ret != 0)
        {
        	return ret;
        }
        
        //Sort by doName
        return doc.name.compareTo(this.name);   
    }
}