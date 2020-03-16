package com.DocSystem.commonService;
public class ShareThread extends Thread {
	public void run() 
	{
		String name = Thread.currentThread().getName();
		String inf=Thread.currentThread().toString();
		long idnum = Thread.currentThread().getId();
		for(int i=0;i<10;i++){//不管是新建一个对象，还是两个对象，//2，都是打印20个数据
			// for(;i<10;i++){//新建一个对象的时候，打印11个左右的数据 ,新建两个对象的时候，//2，会打印20个数据。//1
			System.out.println("i----------"+i +",thread name=="+ name +",threadid=="+ idnum+",thread inf=="+inf);
		}
	}
}