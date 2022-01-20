
/** 获取远程存储链接输入框提示信息 **/
function getPlacehoderForRemoteStorageProtocol(protocol)
{
	var str = "";
	switch(protocol)
	{
	case "ftp":
		str = 'ftp://192.168.0.1:21/path;userName=test;pwd=123456;charset=utf-8;';
		break;
	case "sftp":
		str = 'sftp://192.168.0.1:22/path;userName=test;pwd=123456;';
		break;
	case "smb":
		str = 'smb://192.168.0.1/path;userName=test;pwd=123456;';
		break;
	case "svn":
		str = 'http://gitee.com/SvnRepos/path;userName=test;pwd=123456;';
		break;
	case "git":
		str = 'http://gitee.com/GitRepos;userName=test;pwd=123456;';
		break;
	case "mxsdoc":
		str = 'http://dw.gofreeteam.com;reposId=1;userName=test;pwd=123456;';
		break;
	}
	return str;
}

/** Build remoteStorageConfigStr based on remoteStorageConfig **/
function buildRemoteStorageConfigStr(remoteStorageConfig)
{
	var remoteStorage = "";
	var protocol = remoteStorageConfig.protocol;
	switch(protocol)
	{
	case "ftp":
		remoteStorage = protocol + "://" + remoteStorageConfig.FTP.host;
		if(remoteStorageConfig.FTP.port)
		{
			remoteStorage += ":" + remoteStorageConfig.FTP.port;
		}
		if(remoteStorageConfig.rootPath)
		{
			remoteStorage += remoteStorageConfig.rootPath;
		}
		if(remoteStorageConfig.FTP.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.FTP.userName;
		}
		if(remoteStorageConfig.FTP.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.FTP.pwd;
		}
		if(remoteStorageConfig.FTP.charset)
		{
			remoteStorage += ";charset=" + remoteStorageConfig.FTP.charset;
		}
		if(remoteStorageConfig.FTP.isPassive)
		{
			remoteStorage += ";isPassive=" + remoteStorageConfig.FTP.isPassive;
		}
		break;
	case "sftp":
		remoteStorage = protocol + "://" + remoteStorageConfig.SFTP.host;
		if(remoteStorageConfig.SFTP.port)
		{
			remoteStorage += ":" + remoteStorageConfig.SFTP.port;
		}
		if(remoteStorageConfig.rootPath)
		{
			remoteStorage += remoteStorageConfig.rootPath;
		}
		if(remoteStorageConfig.SFTP.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.SFTP.userName;
		}
		if(remoteStorageConfig.SFTP.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.SFTP.pwd;
		}
		break;
	case "smb":
		remoteStorage = protocol + "://" + remoteStorageConfig.SMB.host;
		if(remoteStorageConfig.rootPath)
		{
			remoteStorage += remoteStorageConfig.rootPath;
		}
		if(remoteStorageConfig.SMB.userDomain)
		{
			remoteStorage += ";userDomain=" + remoteStorageConfig.SMB.userDomain;
		}
		if(remoteStorageConfig.SMB.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.SMB.userName;
		}
		if(remoteStorageConfig.SMB.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.SMB.pwd;
		}
		break;
	case "svn":
		remoteStorage = remoteStorageConfig.SVN.url;
		if(remoteStorageConfig.SVN.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.SVN.userName;
		}
		if(remoteStorageConfig.SVN.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.SVN.pwd;
		}
		break;
	case "git":
		remoteStorage = remoteStorageConfig.GIT.url;
		if(remoteStorageConfig.GIT.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.GIT.userName;
		}
		if(remoteStorageConfig.GIT.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.GIT.pwd;
		}
		break;
	case "mxsdoc":
		remoteStorage = remoteStorageConfig.MXSDOC.url;
		if(remoteStorageConfig.MXSDOC.userName)
		{
			remoteStorage += ";userName=" + remoteStorageConfig.MXSDOC.userName;
		}
		if(remoteStorageConfig.MXSDOC.pwd)
		{
			remoteStorage += ";pwd=" + remoteStorageConfig.MXSDOC.pwd;
		}
		if(remoteStorageConfig.MXSDOC.reposId)
		{
			remoteStorage += ";reposId=" + remoteStorageConfig.MXSDOC.reposId;
		}
		if(remoteStorageConfig.MXSDOC.remoteDirectory)
		{
			remoteStorage += ";remoteDirectory=" + remoteStorageConfig.MXSDOC.remoteDirectory;
		}
		break;
	}
	return remoteStorage;
}

