package com.DocSystem.common;

import java.io.Serializable;

public class SyncLock implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 5460004560748011678L;
	public String id; 
	
	public static void lock(String lockInfo) {
		// TODO Auto-generated method stub
		Log.debug("\n********** " + lockInfo + " lock ++++++");
	}  
	
	public static void unlock(Object syncLock, String lockInfo) {
		Log.debug("********** " + lockInfo + " unlock -------\n");																
		
		//syncLock.notifyAll();//唤醒等待线程（如果有其他线程调用过wait，才需要唤醒）
		
		//wait是表示当前线程需要等待某些资源主动放弃锁，需要其他线程调用notify或notifyAll来唤醒
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，所以实际上是个错误的做法，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待其他线程调用syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}
}
