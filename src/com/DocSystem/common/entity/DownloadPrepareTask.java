package com.DocSystem.common.entity;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

public class DownloadPrepareTask {
	public String id;
	
	public Integer type = 0; //0: compress dedicated folder 1: download repos's folder 2:download verRepos's folder or file

	public String info = "下载准备中...";

	public Long createTime;
	
	public boolean stopFlag = false;
	
	public Repos repos;
	public Doc doc;
	public ReposAccess reposAccess;

	//历史版本下载
	public String commitId = null;
	public Integer downloadAll = null;
	
	//需要直接压缩的目录
	public String inputPath;
	public String inputName;
	public boolean deleteInput = false;
	
	//压缩文件存放路径
	public String targetPath;
	public String targetName;
	public Long targetSize;
	
	public int status;  //1:压缩中 2:压缩成功 3:压缩失败
}
