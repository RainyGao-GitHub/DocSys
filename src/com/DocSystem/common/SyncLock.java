package com.DocSystem.common;

public class SyncLock {
	public static void unlock(Object syncLock, String lockInfo) {
		syncLock.notifyAll();//唤醒等待线程
		Log.debug(lockInfo + " unlock -------");																
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，我勒了个区去，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}

	public static void lock(String lockInfo) {
		// TODO Auto-generated method stub
		Log.debug(lockInfo + " lock ++++++");
	}  
}
