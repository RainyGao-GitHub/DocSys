package com.DocSystem.common.entity;

public class DataBuffer {
	public byte[] data;
	public int bufSize;	//data buffer size
	public int size;	//used size
	public int offset = 0;	//read offset
	
	public DataBuffer(int _size) {
		this.data = new byte[_size];
		this.bufSize = _size;
		this.size = 0;
        this.offset = 0;
	}

	public DataBuffer() {
		this.data = null;
		this.bufSize = 0;
		this.size = 0;
        this.offset = 0;
	}

	public DataBuffer(byte[] data) {
		this.data = data;
        this.bufSize = data.length;
        this.size = 0;
        this.offset = 0;
	}

	public DataBuffer(DataBuffer pBuffer) {
		this.data = pBuffer.data;
	    this.bufSize = pBuffer.bufSize;
	    this.size = pBuffer.size;
	    this.offset = pBuffer.offset;
	}

	public void clear() {
		this.data = null;
		this.bufSize = 0;
		this.size = 0;	
        this.offset = 0;
	}
}
