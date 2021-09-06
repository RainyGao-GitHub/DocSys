package com.DocSystem.common.entity;

public class EncryptConfig {
	public final static int TYPE_XOR = 1;
	public final static int TYPE_DES = 2;	
	public Integer type;
	public String key;
	public Integer firstBlockSize = 1024;
	public Integer blockSize = 1024;
	public Integer skipSize = 4096;
	public Integer maxSize = 100*1024*1024; //100M
}
