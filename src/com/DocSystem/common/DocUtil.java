package com.DocSystem.common;

import com.DocSystem.entity.Doc;

public class DocUtil {
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, 
			Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum) 
	{
		return buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum, "");
	}
	
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, 
			Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum,
			String offsetPath) 
	{
		//Format path and name
		if(reposPath == null)
		{
			reposPath = "";
		}
		
		if(path == null)
		{
			path = "";
		}
		if(name == null)
		{
			name = "";
		}
		if(offsetPath == null)
		{
			offsetPath = "";
		}
		
		//To support user call the interface by entryPath
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				String[] temp = new String[2]; 
				level = Path.seperatePathAndName(path, temp);
				path = temp[0];
				name = temp[1];			
			}
		}
		
		//在仓库管理界面，为了能够返回然根节点信息带有仓库名字，导致传入的Name不为空，这是一个错误的决定
		if(name.isEmpty())	//rootDoc
		{
			level = -1;
			docId = 0L;
			pid = -1L;
		}
		
		if(level == null)
		{
			level = Path.getLevelByParentPath(path);
		}
		
		Doc doc = new Doc();
		doc.setVid(reposId);
		doc.setReposPath(reposPath);
		doc.setPath(path);
		doc.setName(name);
		doc.setLevel(level);
		doc.setType(type);
		doc.setLocalRootPath(localRootPath);
		doc.setLocalVRootPath(localVRootPath);
		doc.setSize(size);
		doc.setCheckSum(checkSum);
		
		doc.setIsRealDoc(isRealDoc);
		doc.offsetPath = offsetPath;
		
		if(isRealDoc)
		{
			if(docId == null)
			{
				docId = Path.buildDocIdByName(level, path, name);
			}
			
			if(pid == null)
			{
				if(path.isEmpty())
				{
					pid = 0L;
				}
				else
				{
					pid = Path.buildDocIdByName(level-1, path, "");
				}
			}
		}

		doc.setDocId(docId);
		doc.setPid(pid);
		return doc;
	}
}
