package com.DocSystem.common;

import java.util.HashMap;
import com.DocSystem.entity.Doc;

public class HitDoc {
	
    private Doc doc = null;
    private String docPath = null;
    private int hitCount = 0;
    private int hitType = 0; //0x00000001 02 04 文件名、文件内容、备注内容
    
    private HashMap<String, Integer> hitInfo = null;
    
    public void setDocPath(String docPath) {
		this.docPath = docPath;
	}
	
	public String getDocPath()
	{
		return docPath;
	}
	
    
	public void setDoc(Doc doc) {
		this.doc = doc;
	}
	
	public Doc getDoc()
	{
		return doc;
	}
	
	public void setHitInfo(HashMap<String, Integer> hitInfo) {
		this.hitInfo = hitInfo;
	}
	
	public HashMap<String, Integer> getHitInfo()
	{
		return hitInfo;
	}

	public int getHitCount() 
	{
		return hitCount;
	}
	
	public void setHitCount(int hitCount) {
		this.hitCount = hitCount;
	}
	
	public int getHitType() 
	{
		return hitType;
	}
	
	public void settHitType(int hitType) {
		this.hitType = hitType;
	}
}
