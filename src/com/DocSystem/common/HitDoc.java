package com.DocSystem.common;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import com.DocSystem.entity.Doc;
import com.DocSystem.websocket.entity.DocSearchContext;

public class HitDoc 
{
	public final static int HitType_FileName 	= 0x00000001;
	public final static int HitType_FileContent = 0x00000002;
	public final static int HitType_FileComment = 0x00000004;
	
    public Doc doc = null;
    public String docPath = null;
    
    //搜索类型
    public int hitType = 0; //0x00000001 02 04 文件名、文件内容、备注内容
    
    //命中词信息
    private Map<String, Integer> hitTermInfo_FileName = null;
    private Map<String, Integer> hitTermInfo_FileContent = null;
    private Map<String, Integer> hitTermInfo_FileComment = null;
    //命中积分
	public int hitScore_FileName;		//命中积分
	public int hitScore_FileContent;	//命中积分
	public int hitScore_FileComment;	//命中积分
    
	//TODO: 搜索命中的单词在内容里的位置信息
    public Map<String, List<int[]>> termPositionsForRDoc;
    public Map<String, List<int[]>> termPositionsForVDoc;
    
    public void setHitScore(int hitType, int newHitScore) 
	{
		switch(hitType)
		{
		case HitDoc.HitType_FileName:
			hitScore_FileName = newHitScore;
			break;
		case HitDoc.HitType_FileContent:
			hitScore_FileContent = newHitScore;
			break;
		case HitDoc.HitType_FileComment:
			hitScore_FileComment = newHitScore;
			break;
		}		
	}
	
	public Integer getHitScore(int hitType) 
	{
		switch(hitType)
		{
		case HitDoc.HitType_FileName:
			return hitScore_FileName;
		case HitDoc.HitType_FileContent:
			return hitScore_FileContent;
		case HitDoc.HitType_FileComment:
			return hitScore_FileComment;
		}		
		return null;
	}
	
	public int getTotalHitScore() 
	{
		return hitScore_FileName + hitScore_FileContent + hitScore_FileComment;
	}
	
	public void setHitTermInfo(int hitType, Map<String, Integer> newHitTermInfo) 
	{
		switch(hitType)
		{
		case HitDoc.HitType_FileName:
			hitTermInfo_FileName = newHitTermInfo;
			break;
		case HitDoc.HitType_FileContent:
			hitTermInfo_FileContent = newHitTermInfo;
			break;
		case HitDoc.HitType_FileComment:
			hitTermInfo_FileComment = newHitTermInfo;
			break;
		}
	}

	public Map<String, Integer> getHitTermInfo(int hitType) 
	{
		switch(hitType)
		{
		case HitDoc.HitType_FileName:
			return hitTermInfo_FileName;
		case HitDoc.HitType_FileContent:
			return hitTermInfo_FileContent;
		case HitDoc.HitType_FileComment:
			return hitTermInfo_FileComment;
		}		
		return null;
	}
	
	private static int caculateHitScore(Map<String, Integer> newHitTermInfo, Map<String, Integer> hitTermInfo, int weight, int hitType, String orgSearchWord, HitDoc hitDoc)
	{
		//如果hitTermInfo为空表示首次计算，否则表示更新
		if(hitTermInfo == null)
		{
			int hitScore = 0;
			if(newHitTermInfo != null)
			{
				for(Entry<String, Integer> entry : newHitTermInfo.entrySet())
				{
					//已满分，不再累积
					if(hitScore > weight)
					{
						break;
					}
					
					String hitTermText = entry.getKey();
					hitScore += weight * hitTermText.length() / orgSearchWord.length();
				}
			}
			if(hitScore > weight)
			{
				hitScore =  weight;
			}
			hitDoc.setHitTermInfo(hitType, newHitTermInfo);
			return hitScore;
		}
		
		//hitTermInfo非空，则更新积分
		int hitScore = hitDoc.getHitScore(hitType);
		if(hitScore < weight)
		{
			if(newHitTermInfo != null)
			{
				for(Entry<String, Integer> entry : newHitTermInfo.entrySet())
				{
					//已满分，不再累积
					if(hitScore > weight)
					{
						break;
					}

					String hitTermText = entry.getKey();
					if(hitTermInfo.get(hitTermText) == null)
					{
						//避免重复计算积分
						hitTermInfo.put(hitTermText, 1);
						//更新积分
						hitScore += weight * hitTermText.length() / orgSearchWord.length();
					}
				}
			}
			if(hitScore > weight)
			{
				hitScore = weight;
			}
		}
		return hitScore;
	}
    
	public static void AddHitDocToSearchResult(HashMap<String, HitDoc> searchResult, HitDoc newHitDoc, int hitType, DocSearchContext context) 
	{
		//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " searchWord:" + keyWord);
		HitDoc hitDoc = searchResult.get(newHitDoc.docPath);
		
		int weight = context.getHitWeight(hitType);
		
		if(hitDoc == null)
		{
			hitDoc = newHitDoc;
			
			hitDoc.hitType = hitType; //设置hitType
			
			//根据命中词的信息计算积分
			hitDoc.setHitScore(hitType, caculateHitScore(newHitDoc.getHitTermInfo(hitType), null, weight, hitType, context.searchWord, hitDoc));

			searchResult.put(hitDoc.docPath, hitDoc);
		}
		else
		{	
			hitDoc.hitType = hitDoc.hitType | hitType;	//增加hitType

			//将HitTermInfo和原来的HitTermInfo进行合并，并计算出当前积分
			hitDoc.setHitScore(hitType, caculateHitScore(newHitDoc.getHitTermInfo(hitType), hitDoc.getHitTermInfo(hitType), weight, hitType, context.searchWord, hitDoc));
			
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
}
