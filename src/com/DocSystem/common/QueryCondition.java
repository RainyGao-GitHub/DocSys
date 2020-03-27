package com.DocSystem.common;


public class QueryCondition {	
    public final static int FIELD_TYPE_Integer = 1;	//Integer
    public final static int FIELD_TYPE_Long = 2;	//Long
    public final static int FIELD_TYPE_String = 3;	//String
    
	public final static int SEARCH_TYPE_Term = 1;				//精确
    public final static int SEARCH_TYPE_Wildcard = 2;			//通配符
    public final static int SEARCH_TYPE_Wildcard_Prefix = 3;	//通配符前缀
    public final static int SEARCH_TYPE_Wildcard_Suffix = 4;	//通配符后缀
    public final static int SEARCH_TYPE_Fuzzy = 5;				//模糊
    public final static int SEARCH_TYPE_IKAnalyzer = 6;			//中文切词
    public final static int SEARCH_TYPE_Prefix = 7;				//前缀
    
	private String field = null;
	private Object value = null;
	private Integer fieldType = FIELD_TYPE_String;
	private Integer queryType = SEARCH_TYPE_Term;
	
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
