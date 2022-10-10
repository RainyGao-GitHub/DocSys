package com.DocSystem.test;

import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;

import com.DocSystem.common.Log;

class RedisTest  
{  	
	//参考资料: https://blog.csdn.net/qq_38697437/article/details/121359818
	public static RedissonClient redissonClient = null;
	
	public static void main(String[] args)    
    {  
        System.out.println("This is test app");
        
        //注册RedissonClient对象
        Config config = new Config();
        //config.useSingleServer().setAddress("redis://192.168.182.150:6379");
        config.useSingleServer().setAddress("redis://localhost:6379");
        redissonClient = Redisson.create(config);
        
        runNewThread();
        runNewThread();
        runNewThread();
    }
	
	public static void runNewThread()
	{
		new Thread(new Runnable() {
			public void run() {
				Log.debug("runNewThread() lockAndRun in new thread");
				lockAndRun();
			}
		}).start();
	}
	
	public static void lockAndRun()
	{
        //Get Lock
        RLock lock = redissonClient.getLock("my-lock");

        //加锁
        lock.lock();
        //锁的自动续期，如果业务执行时间超长，运行期间会自动给锁续期30秒时间，不用担心业务时间长，锁自动过期
        //加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认在30秒后也会自动删除
        try {
            System.out.println("加锁成功，执行业务.... "+Thread.currentThread().getId());
            Thread.sleep(30000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            //手动解锁
            System.out.println("解锁..."+Thread.currentThread().getId());
            lock.unlock();
        }
	}
}  