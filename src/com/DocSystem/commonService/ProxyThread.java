package com.DocSystem.commonService;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;

import com.DocSystem.entity.DocShare;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

public class ProxyThread extends Thread {
	@Autowired
	protected ReposServiceImpl reposService;
	
	boolean stopProxyThread = false;
	protected static ConcurrentHashMap<String, Socket> proxiedServer = new ConcurrentHashMap<String, Socket>();

	public void run() 
	{
		//打印线程信息
		String name = Thread.currentThread().getName();
		String inf=Thread.currentThread().toString();
		long idnum = Thread.currentThread().getId();
		System.out.println("ProxyThread: thread name=="+ name +",threadid=="+ idnum+",thread inf=="+inf);
		
		//开始监听指定端口上的socket连接
		 int port = 55533;
		 ServerSocket server;
		try {
			server = new ServerSocket(port);
			while(!stopProxyThread)
			{
				System.out.println("server将一直等待连接的到来");
				Socket socket = server.accept();
				if(verifyShareRequest(socket) == true)
				{
					//push socket to HashMap
					String shareServerIP = getShareServerIpFromSocket(socket);
					if(shareServerIP != null)
					{
						if(proxiedServer.get(shareServerIP) == null)
						{
							proxiedServer.put(shareServerIP, socket);
						}
					}
					else
					{
						socket.close();
					}
				}
			}
			server.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private boolean verifyShareRequest(Socket socket) {		
		InputStream inputStream;
		try {
			inputStream = socket.getInputStream();
			byte[] bytes = new byte[1024];
			int len;
			StringBuilder sb = new StringBuilder();
			while ((len = inputStream.read(bytes)) != -1) 
			{
				sb.append(new String(bytes, 0, len,"UTF-8"));
			}
			System.out.println("get message from client: " + sb);
			inputStream.close();
			
			//check the request
			JSONObject jobj = JSON.parseObject(sb.toString());
			Integer shareId = (Integer) jobj.get("shareId");
			if(shareId == null)
			{
				return false;
			}
        	DocShare docShare = getDocShare(shareId);
        	if(isDocShareValid(docShare) == false)
        	{
        		return false;
        	}
        	return true;
        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return false;
	}

	private boolean isDocShareValid(DocShare docShare) {
		if(docShare == null)
		{
			System.out.println("verifyDocShare() docShare is null");
			return false;
		}
		
		if(docShare.getVid() == null)
		{
			System.out.println("verifyDocShare() docShare.vid is null");
			return false;
		}
		
		if(docShare.getDocId() == null)
		{
			System.out.println("verifyDocShare() docShare.docId is null");
			return false;
		}

		if(docShare.getPath() == null)
		{
			System.out.println("verifyDocShare() docShare.path is null");
			return false;
		}

		if(docShare.getName() == null)
		{
			System.out.println("verifyDocShare() docShare.name is null");
			return false;
		}
		
		if(docShare.getSharedBy() == null)
		{
			System.out.println("verifyDocShare() docShare.sharedBy is null");
			return false;
		}
		
		Long expireTime = docShare.getExpireTime();
		if(expireTime != null)
		{
			long curTime = new Date().getTime();
			if(curTime > expireTime)	//
			{
				System.out.println("verifyDocShare() docShare is expired");
				return false;
			}
		}		
		return true;
	}

	protected DocShare getDocShare(Integer shareId) {
		DocShare qDocShare = new DocShare();
		qDocShare.setShareId(shareId);
		List<DocShare> results = reposService.getDocShareList(qDocShare);
		if(results == null || results.size() < 1)
		{
			return null;
		}
		return results.get(0);
	}
	
	private String getShareServerIpFromSocket(Socket socket) {
		//System.out.println(socket.getLocalSocketAddress().toString());
		String clientIP = socket.getInetAddress().toString();
		System.out.println(socket.getInetAddress().toString());	//客户端IP
		//System.out.println(socket.getLocalAddress().toString()); 
		//System.out.println(socket.getRemoteSocketAddress().toString());
		//System.out.println(socket.getLocalSocketAddress().toString());
		return clientIP;
	}
}