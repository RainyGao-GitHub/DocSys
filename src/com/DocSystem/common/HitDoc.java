package com.DocSystem.common;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.DocSystem.entity.Doc;
import com.DocSystem.websocket.entity.DocSearchContext;

public class HitDoc 
{
	public final static int HitType_FileName 	= 0x00000001;
	public final static int HitType_FileContent = 0x00000002;
	public final static int HitType_FileComment = 0x00000004;
	
    private Doc doc = null;
    private String docPath = null;
    private int hitCount = 0;
    private int hitType = 0; //0x00000001 02 04 文件名、文件内容、备注内容
    
    //命中词信息
    private HashMap<String, Integer> hitTermInfo = null;
	public int hitScore;	//命中积分
    
	//TODO: 搜索命中的单词在内容里的位置信息
    public Map<String, List<int[]>> termPositionsForRDoc;
    public Map<String, List<int[]>> termPositionsForVDoc;
    
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
	
	public void setHitTermInfo(HashMap<String, Integer> HitTermInfo) {
		this.hitTermInfo = HitTermInfo;
	}
	
	public HashMap<String, Integer> getHitTermInfo()
	{
		return hitTermInfo;
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
	public static void AddHitDocToSearchResult(HashMap<String, HitDoc> searchResult, HitDoc newHitDoc, int hitType, DocSearchContext context) 
	{
		//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " searchWord:" + keyWord);
		HitDoc hitDoc = searchResult.get(newHitDoc.getDocPath());
		
		int weight = context.getHitWeight(hitType);
		
		if(hitDoc == null)
		{
			//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
			Doc doc = newHitDoc.getDoc();
			
			//根据命中词的信息计算积分
			newHitDoc.hitScore = caculateHitScore(newHitDoc, null, weight, hitType);
			
			//Set HitDoc
			newHitDoc.setDoc(doc);
			newHitDoc.settHitType(hitType); //设置hitType
			searchResult.put(newHitDoc.getDocPath(), newHitDoc);
			hitDoc = newHitDoc;
		}
		else
		{	
			hitDoc.settHitType(hitDoc.getHitType() | hitType);	//增加hitType

			//将HitTermInfo和原来的HitTermInfo进行合并，并计算出当前积分
			hitDoc.hitScore = caculateHitScore(newHitDoc, hitDoc, weight, hitType);
			
			//合并position信息
			switch(hitType)
			{
			case HitDoc.HitType_FileContent:
				if(hitDoc.termPositionsForRDoc == null)
				{
					hitDoc.termPositionsForRDoc = newHitDoc.termPositionsForRDoc;
				}
				else if(newHitDoc.termPositionsForRDoc != null)
				{
					hitDoc.termPositionsForRDoc.putAll(newHitDoc.termPositionsForRDoc);
				}
				break;
			case HitDoc.HitType_FileComment:
				if(hitDoc.termPositionsForVDoc == null)
				{
					hitDoc.termPositionsForVDoc = newHitDoc.termPositionsForVDoc;
				}
				else if(newHitDoc.termPositionsForVDoc != null)
				{
					hitDoc.termPositionsForVDoc.putAll(newHitDoc.termPositionsForVDoc);
				}
				break;
			}			
		}
		
		//System.out.println("AddHitDocToSearchResult() hitType:" + tempHitDoc.getHitType());	
	}

	private static int caculateHitScore(HitDoc newHitDoc, HitDoc hitDoc, int weight, int hitType)
	{
		// TODO Auto-generated method stub
		return 0;
	}
}
