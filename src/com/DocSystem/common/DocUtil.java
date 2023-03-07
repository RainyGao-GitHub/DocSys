package com.DocSystem.common;

import com.DocSystem.entity.Doc;

public class DocUtil {
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
		String[] temp = new String[2]; 
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				level = Path.seperatePathAndName(path, temp);
				path = temp[0];
				name = temp[1];			
			}
			else	//rootDoc
			{
				level = -1;
				docId = 0L;
				pid = -1L;				
			}
		}
		else
		{
			//防止使用相对路径进行非法注入
			level = Path.seperatePathAndName(path + name, temp);
			path = temp[0];
			name = temp[1];	
		}
		
		if(level == -2)
		{
			Log.info("非法文件访问");
			return null;
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
