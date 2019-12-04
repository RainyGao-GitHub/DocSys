package com.DocSystem.test;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.mysql.jdbc.Connection;
import com.mysql.jdbc.Statement;

class ImportDocAuthList extends BaseController{
	
    // MySQL 8.0 以下版本 - JDBC 驱动名及数据库 URL
    static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";  
    //static final String DB_URL = "jdbc:mysql://localhost:3306/RUNOOB";
    static final String DB_URL = "jdbc:mysql://localhost:3306/docsystem?zeroDateTimeBehavior=convertToNull&characterEncoding=utf8";
 
    // MySQL 8.0 以上版本 - JDBC 驱动名及数据库 URL
    //static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";  
    //static final String DB_URL = "jdbc:mysql://localhost:3306/RUNOOB?useSSL=false&serverTimezone=UTC";
 
 
    // 数据库的用户名与密码，需要根据自己的设置
    static final String USER = "root";
    static final String PASS = "";
 
    public static void main(String[] args) {
		String s = readJsonFile("docAuthList.json");
		JSONObject jobj = JSON.parseObject(s);
        JSONArray list = jobj.getJSONArray("docAuthList");

        for (int i = 0 ; i < list.size();i++)
        {
            JSONObject obj = (JSONObject)list.get(i);
            DocAuth docAuth = new DocAuth();
            docAuth.setId( (Integer)obj.get("id"));
            docAuth.setReposId( (Integer)obj.get("reposId"));
            docAuth.setDocId( Long.parseLong(obj.get("docId").toString()));
            docAuth.setUserId( (Integer)obj.get("userId"));
            docAuth.setGroupId( (Integer)obj.get("groupId"));
            docAuth.setType( (Integer)obj.get("type"));
            docAuth.setPriority( (Integer)obj.get("priority"));
            docAuth.setIsAdmin( (Integer)obj.get("isAdmin"));
            docAuth.setAddEn( (Integer)obj.get("addEnd"));
            docAuth.setDeleteEn( (Integer)obj.get("deleteEn"));
            docAuth.setEditEn( (Integer)obj.get("editEn"));
            docAuth.setAccess( (Integer)obj.get("access"));
            docAuth.setHeritable( (Integer)obj.get("heritable"));
            docAuth.setDocPath( (String)obj.get("docPath"));
            docAuth.setDocName( (String)obj.get("docName"));
            printObject("docAuth:", docAuth);
            
            //insert the docAuth to DB
            insertDocAuth(docAuth);
        }
    }
	
	private static boolean insertDocAuth(DocAuth docAuth) 
	{
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(JDBC_DRIVER);
        
            // 打开链接
            //System.out.println("连接数据库...");
            conn = (Connection) DriverManager.getConnection(DB_URL,USER,PASS);
        
            // 执行查询
            //System.out.println(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            String sql = "insert into doc_auth ";
            String sql_condition = "";
            String sql_value = "";
            if(docAuth.getId() != null)
            {	
            	sql_condition += "ID,";
            	sql_value += " " + docAuth.getId() + ",";
            }
            
            if(docAuth.getUserId() != null)
            {
                sql_condition += "USER_ID,";
            	sql_value += " " + docAuth.getUserId() + ",";
            }
            if(docAuth.getGroupId() != null)
            {
            	sql_condition += "GROUP_ID,";
            	sql_value += " " + docAuth.getGroupId() + ",";
            }
            if(docAuth.getType() != null)
            {
            	sql_condition += "TYPE,";
            	sql_value += " " + docAuth.getType() + ",";
            }
            if(docAuth.getPriority() != null)
            {
            	sql_condition += "PRIORITY,";
            	sql_value += " " + docAuth.getPriority() + ",";
            }
            if(docAuth.getDocId() != null)
            {
            	sql_condition += "DOC_ID,";
                sql_value += " " + docAuth.getDocId() + ",";
            }
            if(docAuth.getReposId() != null)
            {
            	sql_condition += "REPOS_ID,";
            	sql_value += " " + docAuth.getReposId() + ",";
            }
            if(docAuth.getIsAdmin() != null)
            {
            	sql_condition += "IS_ADMIN,";
            	sql_value += " " + docAuth.getIsAdmin() + ",";
            }
            if(docAuth.getAccess() != null)
            {
            	sql_condition += "ACCESS,";
            	sql_value += " " + docAuth.getAccess() + ",";
            }
            if(docAuth.getEditEn() != null)
            {
            	sql_condition += "EDIT_EN,";
            	sql_value += " " + docAuth.getEditEn() + ",";
            }
            if(docAuth.getAddEn() != null)
            {
            	sql_condition += "ADD_EN,";
            	sql_value += " " + docAuth.getAddEn() + ",";
            }
            if(docAuth.getDeleteEn() != null)
            {
            	sql_condition += "DELETE_EN,";
            	sql_value += " " + docAuth.getDeleteEn() + ",";
            }
            if(docAuth.getHeritable() != null)
            {
            	sql_condition += "HERITABLE,";
            	sql_value += " " + docAuth.getHeritable() + ",";
            }
            if(docAuth.getDocPath() != null)
            {
            	sql_condition += "DOC_PATH,";
            	sql_value += " '" + docAuth.getDocPath() + "',";
            }
            if(docAuth.getDocName() != null)
            {
            	sql_condition += "DOC_NAME";
            	sql_value += " '" + docAuth.getDocName() + "'";
            }
            
            sql = sql + "(" + sql_condition + ")" + " values (" + sql_value + ")";
            
            System.out.println("sql:" + sql);
            ret = stmt.execute(sql);
            System.out.println("ret:" + ret);
            // 完成后关闭
            stmt.close();
            conn.close();
            return ret;
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
            }
        }
		return ret;
	}

	/**
     * 读取json文件，返回json串
     * @param fileName
     * @return
     */
    public static String readJsonFile(String fileName) {
        String jsonStr = "";
        try {
            File jsonFile = new File(fileName);
            FileReader fileReader = new FileReader(jsonFile);

            Reader reader = new InputStreamReader(new FileInputStream(jsonFile),"utf-8");
            int ch = 0;
            StringBuffer sb = new StringBuffer();
            while ((ch = reader.read()) != -1) {
                sb.append((char) ch);
            }
            fileReader.close();
            reader.close();
            jsonStr = sb.toString();
            return jsonStr;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}