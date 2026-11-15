package com.DocSystem.common.entity;

import java.util.List;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

//在线压缩与解压异步任务（仿 DownloadPrepareTask 模式）
public class CompressExtractTask
{
	public final static int type_extract = 1;	//解压（提取压缩文件到仓库）
	public final static int type_compress = 2;	//压缩（选中文件打包为zip存入仓库）

	public String id;

	public Integer type = type_extract;

	public String info = "任务准备中...";

	public Long createTime;

	public boolean stopFlag = false;

	public Repos repos;
	public Doc doc;				//extract: 压缩文件doc; compress: 虚拟doc（仅用于携带目标名）
	public ReposAccess reposAccess;

	//压缩文件来源（extract用，同 downloadDocPrepare 的入参）
	public String srcPath;		//压缩文件所在仓库内路径
	public String srcName;		//压缩文件名

	//要提取的zip内条目（zip内相对路径，空=全部提取）
	public List<String> entryList;

	//仓库内目标目录（相对路径，空或"/"=仓库根）
	public String targetPath;
	//目标子目录名（extract用，空=条目直接散到targetPath）
	public String targetName;

	public Integer overwriteFlag = 0;	//0=有冲突返回询问 1=直接覆盖

	//压缩用：选中文件列表（与打包下载 downloadList 同构）
	public List<Doc> docList;

	//进度
	public int totalCount = 0;
	public int processedCount = 0;

	//完成后的结果信息（供前端刷新）
	public String resultTargetPath;	//仓库内目标目录（含子目录）
	public String resultTargetName;	//目标条目名（extract=子目录名或空; compress=zip名）

	public int status;  //1:执行中 2:成功 3:失败
}
