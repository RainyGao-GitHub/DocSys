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
	 * 失败原因错误码（见 com.DocSystem.common.ErrorCode）。
	 *
	 * <p>为什么加：以前调用方只能嗅探 msgInfo 的文案来判断失败类型（如"请稍后重试"⇒锁占用），
	 * 文案一改就失效，且会把"系统维护中，请稍后重试"这类非锁场景误判为可重试。
	 * 多输出一个 JSON 字段对既有前端无影响（不读即无害）。
	 */
	private String errorCode = null;
	public Long startTime = null;
	
	public ReturnAjax() {
	}

	public ReturnAjax(long time) {
		startTime = time;
	}

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
			this.msgInfo = errmsg + "\n" + this.msgInfo;
		}
	}

	/**
	 * 设置错误信息 + 失败原因错误码（推荐：调用方可按码判定处置，不再依赖文案）
	 */
	public void setError(String errmsg, String errorCode){
		this.setError(errmsg);
		if(errorCode != null)
		{
			this.errorCode = errorCode;
		}
	}

	/**
	 * 仅当尚未设置错误码时补充错误码（避免后续更具体的码被覆盖）
	 */
	public void setErrorCodeIfAbsent(String errorCode){
		if(this.errorCode == null && errorCode != null)
		{
			this.errorCode = errorCode;
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
			this.debugLog =  this.debugLog + "\n" + debugLog;
		}
	}
	
	public String getDebugLog() 
	{
		return debugLog;
	}

	public String getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(String errorCode) {
		this.errorCode = errorCode;
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
			this.debugLog = this.warningMsg + "\n" +  warningMsg;
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
