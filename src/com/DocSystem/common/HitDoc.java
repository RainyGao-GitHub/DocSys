package com.DocSystem.common;

import java.util.List;

import com.DocSystem.entity.Doc;

public class HitDoc {
	
    private List<HitInfo> hitInfoList = null;
    private Doc doc = null;
    
	public void setDoc(Doc doc) {
		this.doc = doc;
	}
	
	public Doc getDoc()
	{
		return doc;
	}
	
	public void setHitInfoList(List<HitInfo> hitInfoList) {
		this.hitInfoList = hitInfoList;
	}
	
	public List<HitInfo> getHitInfoList()
	{
		return hitInfoList;
	}
}
