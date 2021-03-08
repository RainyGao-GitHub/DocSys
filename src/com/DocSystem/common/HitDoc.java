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
	
	/***********************  全文搜索接口 
	 * @param weight *******************************************/
	public static void AddHitDocToSearchResult(HashMap<String, HitDoc> searchResult, HitDoc hitDoc, String keyWord, int weight, int hitType) 
	{
		//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " searchWord:" + keyWord);
		HitDoc tempHitDoc = searchResult.get(hitDoc.getDocPath());

		if(tempHitDoc == null)
		{
			//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
			Doc doc = hitDoc.getDoc();
			
			//Create hitIfo
			HashMap<String, Integer> hitInfo = new HashMap<String, Integer>();
			hitInfo.put(keyWord,1);
			
			int sortIndex = weight*100 + 1;
			doc.setSortIndex(sortIndex);
			
			//Set HitDoc
			hitDoc.setDoc(doc);
			hitDoc.setHitInfo(hitInfo);
			hitDoc.settHitType(hitType); //设置hitType
			searchResult.put(hitDoc.getDocPath(), hitDoc);
			tempHitDoc = hitDoc;
		}
		else
		{	
			tempHitDoc.settHitType(tempHitDoc.getHitType() | hitType);	//增加hitType
			
			HashMap<String, Integer> hitInfo = tempHitDoc.getHitInfo();
			Doc doc = tempHitDoc.getDoc();
			
			//Caculate sortIndex
			Integer hitCount = hitInfo.get(keyWord);
			int sortIndex = doc.getSortIndex();
			if(hitCount == null)
			{
				//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, 1);
				sortIndex += weight*100 + 1;
				doc.setSortIndex(sortIndex);
			}
			else
			{
				hitCount++;	//hitCount++
				//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is "+ hitCount +"th hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, hitCount+1);
				sortIndex += weight*100 + 1;
				doc.setSortIndex(sortIndex);
			}
			//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " sortIndex:" + doc.getSortIndex());	
		}
		
		//System.out.println("AddHitDocToSearchResult() hitType:" + tempHitDoc.getHitType());	
	}
}
