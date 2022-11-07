package com.DocSystem.test;

import com.DocSystem.common.Log;
import com.DocSystem.common.SyncLock;

class SyncLockTest  
{  	
	static SyncLock syncLock = new SyncLock();
	
	public static void main(String[] args)    
    {  
        System.out.println("This is test app");
                
        runNewThread();
        runNewThread();
        runNewThread();

        System.out.println("Test completed");
    }
	
	public static void runNewThread()
	{
		new Thread(new Runnable() {
			public void run() {
				Log.debug(Thread.currentThread().getId() + " runNewThread() lockAndRun start");
				lockAndRun();
				Log.debug(Thread.currentThread().getId() + " runNewThread() lockAndRun end");
			}
		}).start();
	}
	
	public static void lockAndRun()
	{
    	synchronized(syncLock)
		{
    		String lockInfo = "lockAndRun() " + Thread.currentThread().getId();
    		SyncLock.lock(lockInfo);				
    		
    		Log.debug("lockAndRun() " + Thread.currentThread().getId() + "正在执行");
    		
    		SyncLock.unlock(syncLock, lockInfo);	
		}
	}
}  