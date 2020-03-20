package com.DocSystem.test;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

class DBTest extends BaseController{
	
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
        
    	List<DocAuth> docAuthList = queryDocAuth();
    	
    	for(int i=0; i<docAuthList.size(); i++)
    	{
    		DocAuth docAuth = docAuthList.get(i);
    		Doc doc = getDocInfo(docAuth.getReposId(), docAuth.getDocId());
    		if(doc != null)
    		{
    			docAuth.setDocPath(doc.getPath());
    			docAuth.setDocName(doc.getName());
    		}
    	}
		printObject("main() docAuthList:", docAuthList);
		writeToJsonFile(docAuthList,"docAuthList.json");
		
		
		String s = readJsonFile("docAuthList.json");
		JSONObject jobj = JSON.parseObject(s);
        JSONArray list = jobj.getJSONArray("docAuthList");

        for (int i = 0 ; i < list.size();i++){
            JSONObject obj = (JSONObject)list.get(i);
            DocAuth docAuth = new DocAuth();
            docAuth.setDocId( Long.parseLong(obj.get("docId").toString()));
            docAuth.setDocName( (String)obj.get("docName"));
            System.out.println(" " + docAuth.getDocId() + " " + docAuth.getDocName());
        }
    }

	private static boolean writeToJsonFile(List<DocAuth> docAuthList, String filePath) {
		
		String content = JSON.toJSONStringWithDateFormat(docAuthList, "yyy-MM-dd HH:mm:ss");
		if(content == null)
		{
			System.out.println("writeToJsonFile() content is null");
			return false;
		}
		
		content = "{docAuthList:" + content + "}";
			
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(filePath);
		} catch (FileNotFoundException e) {
			System.out.println("writeToJsonFile() new FileOutputStream failed");
			e.printStackTrace();
			return false;
		}
		try {
			byte[] buff = content.getBytes();
			out.write(buff, 0, buff.length);
			//关闭输出流
			out.close();
		} catch (IOException e) {
			System.out.println("writeToJsonFile() out.write exception");
			e.printStackTrace();
			return false;
		}		
		return true;
	}

	private static List<DocAuth> queryDocAuth() {
		
		List<DocAuth> docAuthList = new ArrayList<DocAuth>();
		
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
            String sql;
            
            sql = "select * from doc_auth";
            ResultSet rs = stmt.executeQuery(sql);
                  
            // 展开结果集数据库
            while(rs.next()){                
                DocAuth docAuth = new DocAuth();
                docAuth.setId(rs.getInt("ID"));
                docAuth.setReposId(rs.getInt("REPOS_ID"));
                docAuth.setDocId(rs.getLong("DOC_ID"));
                docAuth.setType(rs.getInt("TYPE"));
                docAuth.setPriority(rs.getInt("PRIORITY"));
                docAuth.setUserId(rs.getInt("USER_ID"));
                docAuth.setGroupId(rs.getInt("GROUP_ID"));
                docAuth.setIsAdmin(rs.getInt("IS_ADMIN"));
                docAuth.setAccess(rs.getInt("ACCESS"));
                docAuth.setEditEn(rs.getInt("EDIT_EN"));
                docAuth.setAddEn(rs.getInt("ADD_EN"));
                docAuth.setDeleteEn(rs.getInt("DELETE_EN"));
                docAuth.setHeritable(rs.getInt("HERITABLE"));
                docAuth.setDocPath(rs.getString("DOC_PATH"));
                docAuth.setDocName(rs.getString("DOC_NAME"));
                
                printObject("queryDocAuth() docAuth: ", docAuth);
                docAuthList.add(docAuth);
            }
            	
            // 完成后关闭
            rs.close();
            stmt.close();
            conn.close();
            return docAuthList;
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
		return null;
	}

	private static Doc getDocInfo(Integer reposId, Long docId) 
	{
		Doc doc = null;
		
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
            String sql;
            
            sql = "select * from doc where VID=" + reposId + " and DOC_ID=" + docId;
            ResultSet rs = stmt.executeQuery(sql);

            while(rs.next()){
                doc = new Doc();
                doc.setId(rs.getInt("ID"));
                doc.setDocId(rs.getLong("DOC_ID"));
                doc.setVid(rs.getInt("VID"));
                doc.setPath(rs.getString("PATH"));
                doc.setName(rs.getString("NAME"));
                printObject("getDocInfo() Doc: ", doc);
                break;
            }
            	
            // 完成后关闭
            rs.close();
            stmt.close();
            conn.close();
            return doc;
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
        System.out.println("Goodbye!");
		return null;
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