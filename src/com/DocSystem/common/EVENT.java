package com.DocSystem.common;

public class EVENT {
	public final static int UNKOWN 							= 0;		

	//File Operation
	public static final int lockDoc 						= 100;
	public final static int addDoc 							= 101;
	public final static int deleteDoc 						= 102;
	public final static int updateDoc 						= 103;
	public final static int moveDoc 						= 104;
	public final static int copyDoc 						= 105;
	public static final int updateRealDocContent 			= 106;
	public static final int updateVirualDocContent 			= 107;
	public static final int copySameDocForUpload 			= 108;
	public static final int folderUpload 					= 109;
	public static final int revertDoc 						= 110;
	//File Operation EX
	public static final int addDocEx 						= 201;
	public static final int deleteDocEx 					= 202;
	public static final int updateDocEx 					= 203;
	public final static int moveDocEx 						= 204;
	public final static int copyDocEx 						= 205;
	//Office
	public final static int addUserToEditUsersMap 			= 301;
	//RemoteStorage
	public static final int remoteStoragePush 				= 401;
	public final static int remoteStoragePull 				= 402;
	public static final int remoteStorageCheckOut 			= 403;
	//AutoBackup
	public static final int LocalAutoBackup 				= 501;
	public static final int remoteAutoBackup 				= 502;
	//ReposSyncup
	public static final int syncupLocalChangesEx_FSM 		= 601;
	public static final int syncUpLocalWithRemoteStorage 	= 602;
	public static final int syncupForDocChange_NoFS 		= 603;
}