package com.DocSystem.common;

public class License {
	public enum LICENSE_RESULT { //this is for officeEditor
		UNDEFINED, //0
		Error, //1
		Expired, //2
		Success, //3
		UnknownUser, //4
		Connections, //5
		ExpiredTrial, //6
		SuccessLimit, //7
		UsersCount, //8
		ConnectionsOS, //9
		UsersCountOS; //10
	}
}
