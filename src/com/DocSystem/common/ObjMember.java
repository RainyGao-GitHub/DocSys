package com.DocSystem.common;

public class ObjMember {
    private Integer type = null;
    private String name = null;
    
    public void setName(String name) {
		this.name = name;
	}
	
	public String getName()
	{
		return name;
	}
	
	public Integer getType() 
	{
		return type;
	}
	
	public void getType(Integer type) {
		this.type = type;
	}
	
}
