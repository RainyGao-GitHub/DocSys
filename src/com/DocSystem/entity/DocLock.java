package com.DocSystem.entity;

import java.io.Serializable;

public class DocLock  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 709275362922188292L;
	public static final int LOCK_STATE_NONE 	= 0b00000000;
	public final static int LOCK_STATE_FORCE 	= 0b00000001;
	public final static int LOCK_STATE_NORMAL 	= 0b00000010;
	public final static int LOCK_STATE_COEDIT 	= 0b00000100;
	public final static int LOCK_STATE_VFORCE 	= 0b00010000;
	public final static int LOCK_STATE_VNORMAL 	= 0b00100000;
	public final static int LOCK_STATE_VCOEDIT 	= 0b01000000;
	public final static int LOCK_STATE_ALL 		= 0b11111111;

	public static final int LOCK_TYPE_NORMAL 	= 1;
	public static final int LOCK_TYPE_FORCE 	= 2;
	public static final int LOCK_TYPE_VNORMAL 	= 3;
	public static final int LOCK_TYPE_COEDIT 	= 4;
	public static final int LOCK_TYPE_VCOEDIT 	= 5;
	public static final int LOCK_TYPE_VFORCE 	= 6;
	public static final int LOCK_TYPE_ALL 		= 999;
	
	public static int lockStateMap[] = {
			DocLock.LOCK_STATE_NONE,
			DocLock.LOCK_STATE_NORMAL,
			DocLock.LOCK_STATE_FORCE,
			DocLock.LOCK_STATE_VNORMAL,
			DocLock.LOCK_STATE_COEDIT,
			DocLock.LOCK_STATE_VCOEDIT,	
			DocLock.LOCK_STATE_VFORCE	
	};
	
	private Integer id;

    private Integer type;

    private String name;

    private String path;

    private Long docId;

    private Long pid;

    private Integer vid;

    private Integer state; 

    public String[] locker = {null, null, null, null, null, null, null};

    public Integer[] lockBy = {null, null, null, null, null, null, null};

    public Long[] lockTime = {null, null, null, null, null, null, null};
    
    public Long[] createTime = {null, null, null, null, null, null, null};
    
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

    public Integer getState() {
        return state;
    }

    public void setState(Integer state) {
        this.state = state;
    }
}