package util.SvnUtil;

import java.util.List;

public class CommitAction{
    private Integer action;
    private Integer entryType;
    private String entryParentPath;
    private String entryName;
    private String entryPath;
    private String localPath;
    private String localRefPath;
    
    //subAction
    public boolean isSubAction = false;
    //Sub Action List
    public boolean hasSubList = false;
    private List<CommitAction> subActionList = null;
	
	public void setAction(Integer action) {
		this.action = action;
	}
	
	public Integer getAction()
	{
		return action;
	}
	
	public void setEntryType(Integer entryType) {
		this.entryType = entryType;
	}
	
	public Integer getEntryType()
	{
		return entryType;
	}


	public void setEntryParentPath(String entryParentPath) {
		this.entryParentPath = entryParentPath;
	}
	
	public String getEntryParentPath()
	{
		return entryParentPath;
	}

	public void setEntryName(String entryName) {
		this.entryName = entryName;
	}
	
	public String getEntryName()
	{
		return entryName;
	}

	public void setEntryPath(String entryPath) {
		this.entryPath = entryPath;
	}
	
	public String getEntryPath()
	{
		return entryPath;
	}

	public void setLocalRefPath(String localRefPath) {
		this.localRefPath = localRefPath;
	}
	
	public String getLocalRefPath()
	{
		return localRefPath;
	}
	
	public void setLocalPath(String localPath) {
		this.localPath = localPath;
	}
	
	public String getLocalPath()
	{
		return localPath;
	}
	
	public boolean getHasSubList()
	{
		return hasSubList;
	}
	
	public void setHasSubList(boolean hasSubList) {
		this.hasSubList = hasSubList;
	}
	
	public void setSubActionList(List<CommitAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<CommitAction> getSubActionList()
	{
		return subActionList;
	}
	
}
