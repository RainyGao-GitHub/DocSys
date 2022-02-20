package com.DocSystem.entity;

import com.DocSystem.common.DocChangeType;

public class Doc  implements Comparable<Doc>{
    private Integer id;	//id in dataBase
        		
    private String name;

    private Integer type;	//0:不存在  1:文件  2:目录

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

    private String content;	//vDoc Content
    private String tmpContent;	//tmp Saved vDoc Content
    
    private String docText; //文本文件内容或者Office文件的文本内容
    private String tmpDocText; //tmp Saved docText
    
	private int sortIndex;

    private String creatorName;

    private String latestEditorName;
    
    private Integer level;
    
    private String localRootPath;
    
    private String localRefRootPath;

    private String localVRootPath;
    
    private boolean isRealDoc = true;
    
    private String charset;
    public boolean autoCharsetDetect = true;

    private String reposPath;
    
    private String reposName;
	
	private Integer hitType;

	private Integer shareId;

	public Boolean isBussiness;
	
	public Integer officeType;
	
	public Integer isRealDocTextSearchEnabled;
	public Integer isVirutalDocTextSearchEnabled;
	public DocChangeType localChangeType;
	public DocChangeType remoteChangeType;	
	
	//文件锁定信息(用于前台显示)
    private Integer state;
    public String[] locker = null;
    public Integer[] lockBy = null;
    public Long[] lockTime = null;
    
    //文件本地信息
    public String targetPath;
    public String targetName;

    //用于标记当前doc是否已加密	
	public Integer encryptEn;

	public String offsetPath = "";	//偏移路径，目前只用于远程存储推送
    
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
        this.content = content;
    }
    
    public String getTmpContent() {
        return tmpContent;
    }

    public void setTmpContent(String tmpContent) {
        this.tmpContent = tmpContent;
    }
    
    public String getDocText() {
        return docText;
    }

    public void setDocText(String docText) {
        this.docText = docText;
    }
    
    public String getTmpDocText() {
        return tmpDocText;
    }

    public void setTmpDocText(String tmpDocText) {
        this.tmpDocText = tmpDocText;
    }
   
    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }
    
    public String getLocalRootPath() {
        return localRootPath;
    }

    public void setLocalRootPath(String localRootPath) 
    {
        this.localRootPath = localRootPath == null ? null : localRootPath.trim();
    }
    
    public String getLocalRefRootPath() {
        return localRefRootPath;
    }

    public void setLocalRefRootPath(String localRefRootPath) 
    {
        this.localRefRootPath = localRefRootPath == null ? null : localRefRootPath.trim();
    }

    public String getLocalVRootPath() {
        return localVRootPath;
    }

    public void setLocalVRootPath(String localVRootPath) 
    {
        this.localVRootPath = localVRootPath == null ? null : localVRootPath.trim();
    }
    
    public boolean getIsRealDoc() {
        return isRealDoc;
    }

    public void setIsRealDoc(boolean isRealDoc) 
    {
        this.isRealDoc = isRealDoc;
    }    

	public void setSortIndex(int sortIndex) {
		this.sortIndex = sortIndex;
	}
	
	public int getSortIndex() {
		return sortIndex;
	}
	
    public String getCharset() {
        return charset;
    }

    public void setCharset(String charset) {
        this.charset = charset;
    }
	
    public int compareTo(Doc doc) {
    	//Sort By sortIndex
        int diff = doc.sortIndex - this.sortIndex;
		if (diff > 0) 
		{
			return 1;
		}
		else if (diff < 0) 
		{
			return -1;
		}
		
        //Sort by docType
        if(doc.type != null && this.type != null)
        {
	        diff = doc.type - this.type;
			if (diff > 0) 
			{
				return 1;
			}
			else if (diff < 0) 
			{
				return -1;
			}
        }
        
        //Sort by doName
        diff = doc.name.compareTo(this.name);
        if(diff == 0)
        {
        	return 0;
        }
        if(diff > 0)
        {
        	return -1;
        }
        else 
        {
        	return 1;
        }
    }
    

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName == null ? null : creatorName.trim();
    }

    public String getLatestEditorName() {
        return latestEditorName;
    }

    public void setLatestEditorName(String latestEditorName) {
        this.latestEditorName = latestEditorName == null ? null : latestEditorName.trim();
    }

	public void setReposPath(String reposPath) {
		this.reposPath = reposPath;
	}
	
	public String getReposPath() {
		return reposPath;
	}

	public void setReposName(String reposName) {
		this.reposName = reposName;
	}
	
	public String getReposName() {
		return reposName;
	}
	
    public Integer getHitType() {
        return hitType;
    }

    public void setHitType(Integer hitType) {
        this.hitType = hitType;
    }

	public Integer getShareId() {
        return shareId;
	}
	
	public void setShareId(Integer shareId) {
        this.shareId = shareId;
	}
	
    public Integer getState() {
        return state;
    }

    public void setState(Integer state) {
        this.state = state;
    }
}