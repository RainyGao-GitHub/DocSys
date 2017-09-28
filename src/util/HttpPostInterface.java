package util;

import java.io.IOException;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.apache.log4j.Logger;

public class HttpPostInterface {
	
	private static Logger logger = Logger.getLogger(HttpPostInterface.class);
	
	public static String callService(String servicePath,List<NameValuePair> list){
		return callService(servicePath, list ,null,null);
	}
	
	@SuppressWarnings("deprecation")
	public static String callService(String servicePath, List<NameValuePair> list ,Integer socketTimeOut,Integer connectTimeout){
		CloseableHttpClient httpclient = HttpClients.createDefault();
		//设置超时时间
		String result="";
		CloseableHttpResponse response = null;
		try {
			HttpPost httpPost = new HttpPost(servicePath);
			httpPost.addHeader("Content-Type", "text/html;charset=UTF-8"); 
			httpPost.setEntity(new UrlEncodedFormEntity(list,HTTP.UTF_8));
			if(socketTimeOut!=null&&connectTimeout!=null){
				RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(socketTimeOut).
							setConnectTimeout(connectTimeout).build();//设置请求和传输超时时间
				httpPost.setConfig(requestConfig);
			}
			response = httpclient.execute(httpPost);
			if(response.getStatusLine().getStatusCode()==200){  
				HttpEntity entity = response.getEntity();
//			    InputStream s = entity.getContent();
			    result = EntityUtils.toString(entity,"UTF-8");
			}
		} catch (ClientProtocolException e) {
			e.printStackTrace();
			logger.error("调用接口失败："+servicePath, e);
		} catch (IOException e) {
			e.printStackTrace();
			logger.error("调用接口失败："+servicePath, e);
		}finally{
			try {
				response.close();
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("调用接口失败："+servicePath, e);
			}
			try {
				httpclient.close();
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("调用接口失败："+servicePath, e);
			}
		}	
		return result;
	}
	
	@SuppressWarnings("deprecation")
	public static String callServiceForQT(String servicePath, List<NameValuePair> list ,Integer socketTimeOut,Integer connectTimeout){
		CloseableHttpClient httpclient = HttpClients.createDefault();
		//设置超时时间
		String result="";
		CloseableHttpResponse response = null;
		try {
			HttpPost httpPost = new HttpPost(servicePath);
//			httpPost.addHeader("Content-Type", "text/html;charset=UTF-8"); 
			httpPost.addHeader("Content-Type", "application/x-www-form-urlencoded"); 
			httpPost.setEntity(new UrlEncodedFormEntity(list,HTTP.UTF_8));
			if(socketTimeOut!=null&&connectTimeout!=null){
				RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(socketTimeOut).
							setConnectTimeout(connectTimeout).build();//设置请求和传输超时时间
				httpPost.setConfig(requestConfig);
			}
			response = httpclient.execute(httpPost);
			if(response.getStatusLine().getStatusCode()==200){  
				HttpEntity entity = response.getEntity();
//			    InputStream s = entity.getContent();
			    result = EntityUtils.toString(entity,"UTF-8");
			}
		} catch (ClientProtocolException e) {
			e.printStackTrace();
			logger.error("调用接口失败："+servicePath, e);
		} catch (IOException e) {
			e.printStackTrace();
			logger.error("调用接口失败："+servicePath, e);
		}finally{
			try {
				response.close();
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("调用接口失败："+servicePath, e);
			}
			try {
				httpclient.close();
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("调用接口失败："+servicePath, e);
			}
		}	
		return result;
	}
}
