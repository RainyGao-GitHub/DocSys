package com.DocSystem.common;

public class EncryptConfig {
	public final static int TYPE_XOR = 1;
	public final static int TYPE_DES = 2;	
	public Integer type;
	public String key;
	public Integer firstBlockSize;
	public Integer blockSize;
	public Integer skipSize;
	public Integer maxSize;
}
