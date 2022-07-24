package com.DocSystem.common.entity;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

public class DownloadCompressTask {
	public String id;

	public String info = "压缩中...";

	public Long createTime;
	
	public boolean stopFlag = false;
	
	public Repos repos;
	public Doc doc;
	public ReposAccess reposAccess;

	//需要直接压缩的目录
	public String inputPath;
	public String inputName;
	public boolean deleteInput = false;
	
	//压缩文件存放路径
	public String targetPath;
	public String targetName;
	
	public int status;  //1:压缩中 2:压缩成功 3:压缩失败
}
