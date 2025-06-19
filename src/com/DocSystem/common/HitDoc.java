package com.DocSystem.common;

import java.util.List;
import java.util.Map;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

public class HitDoc 
{
	public final static int HitType_FileName 	= 0x00000001;
	public final static int HitType_FileContent = 0x00000002;
	public final static int HitType_FileComment = 0x00000004;
	
	public Repos repos = null;
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
	public int hitScore_Total;			//命中总积分
    
	//TODO: 搜索命中的单词在内容里的位置信息
    public Map<String, List<int[]>> termPositionsForRDoc;
    public Map<String, List<int[]>> termPositionsForVDoc;
    
    public void setHitScore(int hitType, int newHitScore) 
	{
		switch(hitType)
		{
		case HitDoc.HitType_FileName:
			hitScore_FileName = newHitScore;
			Log.debug("setHitScore() hitDoc:" + docPath + " hitScore_FileName:" + hitScore_FileName);
			break;
		case HitDoc.HitType_FileContent:
			hitScore_FileContent = newHitScore;
			Log.debug("setHitScore() hitDoc:" + docPath + " hitScore_FileContent:" + hitScore_FileContent);

			break;
		case HitDoc.HitType_FileComment:
			hitScore_FileComment = newHitScore;
			Log.debug("setHitScore() hitDoc:" + docPath + " hitScore_FileComment:" + hitScore_FileComment);
			break;
		}
		hitScore_Total = hitScore_FileName + hitScore_FileContent + hitScore_FileComment;
		Log.debug("setHitScore() hitDoc:" + docPath + " hitScore_Total:" + hitScore_Total);
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
		Log.debug("getTotalHitScore() hitDoc:" + docPath + " hitScore_Total:" + hitScore_Total 
				+ " hitScore_FileName:" + hitScore_FileName 
				+ " hitScore_FileContent:" + hitScore_FileContent
				+ " hitScore_FileComment:" + hitScore_FileComment);
		return hitScore_Total;
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
}
