package com.DocSystem.entity;

public class DocShare {
    private Integer id;
   
    private Integer shareId;

    private Integer type;	//0: 本地  1:远程
    
    private String requestIP;	//分享请求IP地址
    
    private String proxyIP; //代理服务器IP地址

    private String name;

    private String path;

    private Long docId;

    private Integer vid;

    private String shareAuth;

    private String sharePwd;

    private Integer sharedBy;

    private Long expireTime;

    private Long validHours; //有效时间

	private String reposName;

	private String serverIp; //服务器IP地址

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }
    
    public String getRequestIP() {
        return requestIP;
    }

    public void setRequestIP(String requestIP) {
        this.requestIP = requestIP == null ? null : requestIP.trim();
    }
    
    public String getProxyIP() {
        return proxyIP;
    }

    public void setProxyIP(String proxyIP) {
        this.proxyIP = proxyIP == null ? null : proxyIP.trim();
    }
    
    public Integer getShareId() {
        return shareId;
    }

    public void setShareId(Integer shareId) {
        this.shareId = shareId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
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

    public Integer getVid() {
        return vid;
    }

    public void setVid(Integer vid) {
        this.vid = vid;
    }

    public String getShareAuth() {
        return shareAuth;
    }

    public void setShareAuth(String shareAuth) {
        this.shareAuth = shareAuth == null ? null : shareAuth.trim();
    }

    public String getSharePwd() {
        return sharePwd;
    }

    public void setSharePwd(String sharePwd) {
        this.sharePwd = sharePwd == null ? null : sharePwd.trim();
    }

    public Integer getSharedBy() {
        return sharedBy;
    }

    public void setSharedBy(Integer sharedBy) {
        this.sharedBy = sharedBy;
    }

    public Long getExpireTime() {
        return expireTime;
    }

    public void setExpireTime(Long expireTime) {
        this.expireTime = expireTime;
    }
    
    public Long getValidHours() {
        return validHours;
    }

    public void setValidHours(Long validHours) {
        this.validHours = validHours;
    }

    public String getReposName() {
        return reposName;
    }

	public void setReposName(String reposName) {
		this.reposName = reposName;
	}

    public String getServerIp() {
		return serverIp;
    }
    
	public void setServerIp(String serverIp) {
		this.serverIp = serverIp;
	}
	
	

}