package com.DocSystem.test;

import org.redisson.Redisson;
import org.redisson.api.RBucket;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;

import com.DocSystem.common.Log;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.entity.ReposExtConfigDigest;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSONObject;

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
        //Get Lock
		System.out.println(Thread.currentThread().getId() + " getLock(my-lock)");
		RLock lock = redissonClient.getLock("my-lock");

		//加锁
		System.out.println(Thread.currentThread().getId() + " try to lock(my-lock)");
        lock.lock();
        
        //锁的自动续期，如果业务执行时间超长，运行期间会自动给锁续期30秒时间，不用担心业务时间长，锁自动过期
        //加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认在30秒后也会自动删除
        try {
            System.out.println(Thread.currentThread().getId() + " 加锁成功，执行业务.... ");
            
            //RMap Test
            RMap<Object, Object> map = redissonClient.getMap("myFirstMap");
            JSONObject inputData = new JSONObject();
            inputData.put("key1", "Hello! I am " + Thread.currentThread().getId() + "");
            inputData.put("key2", "Hello! I am " + Thread.currentThread().getId() + "");
            map.put("product", inputData);
            
            JSONObject var = (JSONObject) map.get("product");
            System.out.println(Thread.currentThread().getId() + " key1.value=" + var.getString("key1") + " key2.value=" + var.getString("key2"));            

            //RBucket Test
            RBucket<Object> bucket = redissonClient.getBucket("myFirstBucket");
            ReposBackupConfig config = new ReposBackupConfig();
            bucket.set(config);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //手动解锁
            System.out.println(Thread.currentThread().getId() + " 解锁...");
            lock.unlock();
        }
	}
}  