package com.DocSystem.entity;

public class ReposExtConfigDigest {
	public final static String RemoteStorage = "RemoteStorage";
    public final static String RemoteServer = "RemoteServer";
    public final static String AutoBackup = "AutoBackup";
    public final static String TextSearch = "TextSearch";
    public final static String VersionIgnore = "VersionIgnore";
    public final static String Encrypt = "EncryptConfig";
	
	public String remoteStorageConfigCheckSum;
	public String remoteServerConfigCheckSum;
	public String autoBackupConfigCheckSum;
	public String textSearchConfigCheckSum;
	public String versionIgnoreConfigCheckSum;
	public String encryptConfigCheckSum;
}
