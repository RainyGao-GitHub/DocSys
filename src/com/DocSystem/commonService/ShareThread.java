package com.DocSystem.commonService;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.net.UnknownHostException;

public class ShareThread extends Thread {

	boolean stopShareThread = false;
	String proxyServerIP = null;
	public void setProxySererIP(String proxyServerIP)
    {
        this.proxyServerIP = proxyServerIP;
    }
	
	public void run() 
	{
		String name = Thread.currentThread().getName();
		String inf=Thread.currentThread().toString();
		long idnum = Thread.currentThread().getId();
		System.out.println("ShareThread: thread name=="+ name +",threadid=="+ idnum+",thread inf=="+inf);

		int port = 55533;
		if(proxyServerIP != null)
		{
			Socket socket;
			try {
				socket = new Socket(proxyServerIP, port);
				sendShareRequest(socket);
				if(receiveShareRespose(socket) == false)
				{
					socket.close();
					return;
				}
				
				while(stopShareThread == false)
				{
					//msg = receive();
					//msgHandler();
				}
				socket.close();				
			} catch (UnknownHostException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}	
	}

	private boolean receiveShareRespose(Socket socket) {
		// TODO Auto-generated method stub
		return false;
	}

	private void sendShareRequest(Socket socket) {
		OutputStream outputStream;
		try {
			outputStream = socket.getOutputStream();
			String message="你好  yiwangzhibujian";
			socket.getOutputStream().write(message.getBytes("UTF-8"));
			outputStream.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	
	}
}