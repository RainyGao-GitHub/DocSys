package com.DocSystem.common;

public class QueryCondition {	
	private String field = null;
	private Object value = null;
	private Integer fieldType = null; //0: String 1:Integer 2:Long
	private Integer queryType = null; //1: 精确（数字型只能精确）2: 通配 3:前缀 4:后缀
	
	public void setFieldType(Integer fieldType) {
		this.fieldType = fieldType;
	}
	
	public Integer getFieldType()
	{
		return fieldType;
	}
	
	public void setQueryType(Integer queryType) {
		this.queryType = queryType;
	}
	
	public Integer getQueryType()
	{
		return queryType;
	}
	
	public void setField(String field) {
		this.field = field;
	}

	public String getField()
	{
		return field;
	}
	

	public void setValue(Object value) {
		this.value = value;
	}
	
	public Object getValue()
	{
		return value;
	}
	
	
}
