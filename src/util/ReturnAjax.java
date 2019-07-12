package util;

/** 
 * @ClassName: ReturnAjax 
 * @Description: 返回ajax所用的类
 * @author 652055239@qq.com
 * @date 2015-5-11 上午9:55:15 
 * @version V1.0   
 */
public class ReturnAjax {
	
	//以下是默认成功信息
	private String status =	"ok";
	private String msgInfo = null;
	private String warningMsg = null;
	private Object msgData;	//用于存储额外的状态或数据
	private Object data;	//用于存储返回结果
	private Object dataEx;	//用于存储返回结果
	private String debugLog = null; //用于向前台传递更详细调试
		
	/**
	 * 设置默认错误信息
	 */
	public void setError(String errmsg){
		this.status = "fail";
		if(this.msgInfo == null)
		{
			this.msgInfo = errmsg;
			return;
		}
		
		if(errmsg != null)
		{
			this.msgInfo += "\n" + errmsg;
		}
	}

	/**
	 * 设置调试信息
	 */
	public void setDebugLog(String debugLog)
	{
		if(this.debugLog == null)
		{
			this.debugLog = debugLog;
			return;
		}
		
		if(debugLog != null)
		{
			this.debugLog += "\n" + debugLog;
		}
	}
	
	public String getDebugLog() 
	{
		return debugLog;
	}
	//================================ getters and setters ===================================
	public String getMsgInfo() {
		return msgInfo;
	}

	public void setMsgInfo(String msgInfo) {
		this.msgInfo = msgInfo;
	}
	
	public String getWarningMsg() {
		return warningMsg;
	}

	public void setWarningMsg(String warningMsg) {
		if(this.warningMsg == null)
		{
			this.warningMsg = warningMsg;
			return;
		}
		
		if(warningMsg != null)
		{
			this.warningMsg += "\n" + warningMsg;
		}
	}
	
	public Object getMsgData() {
		return msgData;
	}
	
	public void setMsgData(Object msgData) {
		this.msgData = msgData;
	}
	
	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}
	
	public Object getDataEx() {
		return dataEx;
	}

	public void setDataEx(Object dataEx) {
		this.dataEx = dataEx;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
}
