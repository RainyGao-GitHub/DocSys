package com.DocSystem.dao;

import java.util.List;

/** 
 * @ClassName: BaseMapper 
 * @Description: 定义mapper的增删改查
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-5-5 下午6:40:22 
 * @version V1.0   
 */
public interface BaseMapper<T> {

	public int add(T t);
	
	public int delete(T t);
	
	public int update(T t);
	
	public List<T> find(T t);
	
	public T findById(T t);
}
