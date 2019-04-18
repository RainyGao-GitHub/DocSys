package com.DocSystem.common;

import java.util.HashMap;
import com.DocSystem.entity.Doc;

public class HitDoc {
	
    private Doc doc = null;
    private String docPath = null;
    private int hitCount = 0;
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
		// TODO Auto-generated method stub
		return hitCount;
	}
	
	public void getHitCount(int hitCount) {
		this.hitCount = hitCount;
	}
}
