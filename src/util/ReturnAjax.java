package util;

/** 
 * @ClassName: ReturnAjax 
 * @Description: 返回ajax所用的类
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-5-11 上午9:55:15 
 * @version V1.0   
 */
public class ReturnAjax {
	
	//以下是默认成功信息
	private String status =	"ok";
	private String msgInfo = "获取数据成功";
	private String msgDetail;	//用于向前台传递更详细的信息,方便调试
	private Object data;

	/**
	 * 设置默认错误信息
	 */
	public void setError(String errmsg){
		this.status = "fail";
		if(errmsg != null)
		{
			this.msgInfo = errmsg;
		}
		else
		{
			this.msgInfo = "获取数据失败";			
		}
	}
	//================================ getters and setters ===================================
	public String getMsgInfo() {
		return msgInfo;
	}

	public void setMsgInfo(String msgInfo) {
		this.msgInfo = msgInfo;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getMsgDetail() {
		return msgDetail;
	}
	
	public void setMsgDetail(String msgDetail) {
		this.msgDetail = msgDetail;
	}
	
}
