package com.DocSystem.common.entity;

public class AIChatRequest 
{
    //用户的问题
    public String query;

	//用户选择的大模型
    public Integer LLMIndex;
    public String LLMName;    
    
    //用户指定的限定条件
    public Integer reposId;		//限定在指定仓库
    public String folderPath;	//限定在指定目录
    public String docPath;		//限定在指定文件
    public String docName;		//限定在指定文件
    public String docList;		//限定在指定的文件列表

    //上下文信息: 比如登录用户等信息, 不是用于后端信息传递
    public AIChatContext context;
}
