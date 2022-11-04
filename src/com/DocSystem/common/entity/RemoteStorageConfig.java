package com.DocSystem.common.entity;

import java.io.Serializable;
import java.util.concurrent.ConcurrentHashMap;

public class RemoteStorageConfig  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -3193212926845814704L;

	public String checkSum;
	
	public String protocol;
	public String rootPath;	//remote root path
	public Integer autoPull = 0;
	public Integer autoPullForce = 0;
	public Integer autoPush = 0;
	public Integer autoPushForce = 0;
	public LocalConfig FILE = null;
	public SftpConfig SFTP = null;
	public FtpConfig FTP = null;
	public SmbConfig SMB = null;
	public SvnConfig SVN = null;
	public GitConfig GIT = null;
	public boolean isVerRepos = false;
	public MxsDocConfig MXSDOC = null;
	public String remoteStorageIndexLib;
	
	public Long allowedMaxFile = null;
	public ConcurrentHashMap<String, Integer> notAllowedFileHashMap = null;
	public ConcurrentHashMap<String, Integer> allowedFileTypeHashMap = null;
	public ConcurrentHashMap<String, Integer> notAllowedFileTypeHashMap = null;
	public Integer isUnkownFileAllowed = null;
	
	public ConcurrentHashMap<String, Integer> ignoreHashMap = null;	
}
