package com.DocSystem.common.remoteStorage;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;

import com.DocSystem.common.Base64Util;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import util.Encrypt.MD5;

public class MxsDocUtil {
    private String serverUrl;
	private String username;
    private String password;
    private Integer reposId;
    public String remoteDirectory;
    
    private String authCode;
	
	public MxsDocUtil(String userName, String pwd, String url, Integer reposId, String remoteDirectory) {
		this.serverUrl = url;
		this.username = userName;
		this.password = Base64Util.base64Encode(pwd);
		this.reposId = reposId;
		this.remoteDirectory = remoteDirectory;		
	}

	public boolean login() {
		Log.debug("MxsDocUtil login() serverUrl:" + serverUrl);
		if(serverUrl == null)
		{
			return false;
		}
	 	
		String requestUrl = serverUrl + "/DocSystem/Bussiness/getAuthCodeRS.do?userName=" + username + "&pwd="+password;
		Log.debug("MxsDocUtil login() requestUrl:" + requestUrl);
		HashMap<String, String> params = new HashMap<String, String>();
		if(reposId != null)
		{
			params.put("reposId", reposId +"");
		}
		else
		{
			params.put("remoteDirectory", remoteDirectory);
		}
		Log.debug("MxsDocUtil login() requestUrl:" + requestUrl);		
		
		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, params);
		if(ret == null)
		{
			Log.debug("MxsDocUtil login() ret is null");
			return false;
		}
		
		if(ret.getString("status") == null)
		{
			//未知状态
			Log.debug("MxsDocUtil login() ret.status is null");
			return false;
		}
		
		if(!ret.getString("status").equals("ok"))
		{
			Log.debug("MxsDocUtil login() ret.status is not ok");
			return false;
		}
		
		authCode = ret.getString("data");
		return true;
	}

	public void logout() {
		// TODO Auto-generated method stub
		
	}
	
	public JSONArray listFiles(String directory)
	{
		String requestUrl = serverUrl + "/DocSystem/Repos/getSubDocListRS.do?authCode=" + authCode;
		HashMap<String, String> reqParams = new HashMap<String, String>();
		if(reposId != null)
		{
			reqParams.put("reposId", reposId+"");
		}
		else
		{
			reqParams.put("remoteDirectory", remoteDirectory);
		}
		reqParams.put("path", directory);
		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, reqParams);
		if(ret == null)
		{
			Log.debug("MxsDocUtil listFiles() ret is null");
			return null;
		}
		
		if(ret.getString("status") == null)
		{
			//未知状态
			Log.debug("MxsDocUtil listFiles() ret.status is null");
			return null;
		}
		
		if(!ret.getString("status").equals("ok"))
		{
			Log.debug("MxsDocUtil listFiles() ret.status is not ok");
			return null;
		}
		
		JSONArray list = ret.getJSONArray("data");
		return list;
	}

	public JSONObject getEntry(String path, String name) 
	{
		String requestUrl = serverUrl + "/DocSystem/Doc/getDocRS.do?authCode=" + authCode;
		HashMap<String, String>  reqParams = new HashMap<String, String> ();
		if(reposId != null)
		{
			reqParams.put("reposId", reposId+"");
		}
		else
		{
			reqParams.put("remoteDirectory", remoteDirectory);
		}
		reqParams.put("path", path);
		reqParams.put("name", name);
		
		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, reqParams);
		if(ret == null)
		{
			Log.debug("MxsDocUtil getEntry() ret is null");
			return null;
		}
		
		if(ret.getString("status") == null)
		{
			//未知状态
			Log.debug("MxsDocUtil getEntry() ret.status is null");
			return null;
		}
		
		if(!ret.getString("status").equals("ok"))
		{
			Log.debug("MxsDocUtil getEntry() ret.status is not ok");
			return null;
		}
		
		JSONObject entry = ret.getJSONObject("data");
		return entry;
	}

	public boolean download(String remotePath, String localPath, String fileName) {
		Log.debug("MxsDocUtil download remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
        boolean ret = false;
        File file = null;
        FileOutputStream os = null;
        
        try {
            File localDir = new File(localPath);
            if(localDir.exists() == false)
            {
            	localDir.mkdirs();
            }
            file = new File(localPath + fileName);
            os = new FileOutputStream(file);
            
    		String requestUrl = serverUrl + "/DocSystem/Doc/downloadDocRS.do?authCode=" + authCode;
    		if(reposId != null)
    		{
    			requestUrl += "&reposId=" + reposId;
    		}
    		if(remoteDirectory != null)
    		{
    			requestUrl += "&remoteDirectory=" + Base64Util.base64EncodeURLSafe(remoteDirectory);
    		}
    		if(remotePath != null)
    		{
    			requestUrl += "&path=" + Base64Util.base64EncodeURLSafe(remotePath);
    		}
    		if(fileName != null)
    		{
    			requestUrl += "&name=" + Base64Util.base64EncodeURLSafe(fileName);
    		}
            ret = BaseFunction.downloadFromUrl(requestUrl, os);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
        	if(os != null)
        	{
        		try {
					os.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
        	}
        }
        return ret;		
	}

	public boolean upload(String remotePath, String localPath, String fileName) {
    	boolean ret = false;
        try {
        	File file = new File(localPath + fileName);
        	if(file.length() == 0)
        	{
        		ret = add(remotePath, fileName, 1);
        	}
        	else
        	{
        		ret = remoteUploadFile(remotePath, localPath, fileName, null, null);
        	}
        } catch (Exception e) {
        	e.printStackTrace();
        }
        return ret;
	}	
	
	private boolean remoteUploadFile(String remotePath, String localPath, String name, Long size, String checkSum) {
			Log.debug("remoteUploadFile localPath:" + localPath + " name:" + name);

			String requestUrl = serverUrl + "/DocSystem/Doc/uploadDocRS.do?authCode=" + authCode;
			HashMap<String, String>  reqParams = new HashMap<String, String>();
			if(reposId != null)
			{
				reqParams.put("reposId", reposId + "");
			}
			else
			{
				reqParams.put("remoteDirectory", remoteDirectory);
			}
			reqParams.put("path", remotePath);
			reqParams.put("name", name);

			if(size == null)
			{
				size = new File(localPath + name).length();
				Log.debug("remoteUploadFile fileSize:" + size);
			}
			reqParams.put("size", size+"");
			reqParams.put("checkSum", checkSum);			
			
			boolean chunked = false;
			Integer chunkIndex = 0;
			Integer chunkNum = 1;
			Integer chunkSize = 2097152; //4096; //2097152; //2M分片 过大的chunk会发生数据校验错误
			String chunkHash = "";
					
			if(size > chunkSize)	//
			{
				chunked = true;
				chunkNum = (int) (size/chunkSize + (size%chunkSize > 0? 1 : 0));
				Log.debug("remoteUploadFile chunkNum:" + chunkNum);
			}
			
			//无论是否为分片都按分片处理
			long offset = (long)0;
			for(int i=0; i<chunkNum; i++)
			{
				chunkIndex = i;
				Log.debug("remoteUploadFile chunkIndex:" + chunkIndex + " offset:" + offset);

				byte [] docData = null;
				if(size > 0)
				{
					docData = FileUtil.readBufferFromFile(localPath, name, offset, chunkSize);
					if(docData == null)
					{
						Log.debug("remoteUploadFile readBufferFromFile is null");
						return false;
					}
					
					Log.debug("chunkSize:" + chunkSize + " docData Size:" + docData.length);				
					
					chunkHash = MD5.md5(docData);
					reqParams.put("chunkHash", chunkHash);
					offset +=  docData.length;
				}
				
				//后台chunkNum是否为空来判断是否进行了分片
				if(chunked)
				{
					reqParams.put("chunkNum", chunkNum+"");
					reqParams.put("chunkIndex", chunkIndex+"");
					reqParams.put("chunkSize", docData.length+"");					
				}
				else
				{
					//reqParams.put("chunkIndex", chunkIndex);
					//reqParams.put("chunkNum", chunkNum);
					reqParams.put("chunkSize", size+"");					
				}				
				JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, name, docData, reqParams);
				if(ret == null)
				{
					Log.debug("remoteUploadFile() ret is null");
					return false;
				}
				
				if(ret.getString("status") == null)
				{
					//未知状态
					Log.debug("remoteUploadFile() ret.status is null");
					return false;
				}
				
				if(!ret.getString("status").equals("ok"))
				{
					Log.debug("remoteUploadFile() ret.status is not ok");
					return false;
				}
			}
			return true;
		}

	public boolean add(String remotePath, String name, Integer type) {
		Log.debug("MxsDocUtil add " + remoteDirectory + remotePath + name);
        boolean result = false;

        try {
    		String requestUrl = serverUrl + "/DocSystem/Doc/addDocRS.do?authCode=" + authCode;
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		if(reposId != null)
    		{
    			reqParams.put("reposId", reposId + "");
    		}
    		else
    		{
    			reqParams.put("remoteDirectory", remoteDirectory);
    		}
    		reqParams.put("type", type + "");
    		reqParams.put("path", remotePath);
    		reqParams.put("name", name);
           
    		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, reqParams);
    		if(ret == null)
    		{
    			Log.debug("MxsDocUtil add() ret is null");
    			return false;
    		}
    		
    		if(ret.getString("status") == null)
    		{
    			//未知状态
    			Log.debug("MxsDocUtil add() ret.status is null");
    			return false;
    		}
    		
    		if(!ret.getString("status").equals("ok"))
    		{
    			Log.debug("MxsDocUtil add() ret.status is not ok");
    			return false;
    		}
    		
    		result = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;		
	}
	
	public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove) {
		Log.debug("MxsDocUtil copy " + remoteDirectory + srcRemotePath + srcName + " to " +  remoteDirectory + dstRemotePath + dstName);
        boolean result = false;

        try {
    		String requestUrl = serverUrl + "/DocSystem/Doc/copyDocRS.do?authCode=" + authCode;
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		if(reposId != null)
    		{
    			reqParams.put("reposId", reposId + "");
    		}
    		else
    		{
    			reqParams.put("remoteDirectory", remoteDirectory);
    		}
    		reqParams.put("srcPath", srcRemotePath);
    		reqParams.put("srcName", srcName);
    		reqParams.put("dstPath", dstRemotePath);
    		reqParams.put("dstName", dstName);
    		if(isMove)
    		{
    			reqParams.put("isMove", "1");
    		}
           
    		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, reqParams);
    		if(ret == null)
    		{
    			Log.debug("MxsDocUtil copy() ret is null");
    			return false;
    		}
    		
    		if(ret.getString("status") == null)
    		{
    			//未知状态
    			Log.debug("MxsDocUtil copy() ret.status is null");
    			return false;
    		}
    		
    		if(!ret.getString("status").equals("ok"))
    		{
    			Log.debug("MxsDocUtil copy() ret.status is not ok");
    			return false;
    		}
    		
    		result = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;	
	}	

	public boolean delete(String remotePath, String fileName) {
		Log.debug("MxsDocUtil delete " + remotePath + fileName);
        boolean result = false;

        try {
    		String requestUrl = serverUrl + "/DocSystem/Doc/deleteDocRS.do?authCode=" + authCode;
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		if(reposId != null)
    		{
    			reqParams.put("reposId", reposId+"");
    		}
    		else
    		{
    			reqParams.put("remoteDirectory", remoteDirectory);
    		}
    		reqParams.put("path", remotePath);
    		reqParams.put("name", fileName);
           
    		JSONObject ret = BaseFunction.postFileStreamAndJsonObj(requestUrl, null, null, reqParams);
    		if(ret == null)
    		{
    			Log.debug("MxsDocUtil delete() ret is null");
    			return false;
    		}
    		
    		if(ret.getString("status") == null)
    		{
    			//未知状态
    			Log.debug("MxsDocUtil delete() ret.status is null");
    			return false;
    		}
    		
    		if(!ret.getString("status").equals("ok"))
    		{
    			Log.debug("MxsDocUtil delete() ret.status is not ok");
    			return false;
    		}
    		
    		result = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;	
	}
}
