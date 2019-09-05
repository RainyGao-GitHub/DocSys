package util.GitUtil;

public class GitEntry {
    private String name;

	private String path;

    private long size;

    private int type;

    private String revision;
    private String commitMessage;	
    
	public void setName(String name) {
		// TODO Auto-generated method stub
		this.name = name;
	}

	public String getName()
	{
		return name;
	}

	public void setPath(String path) {
		// TODO Auto-generated method stub
		this.path = path;
	}

	public String getPath()
	{
		return path;
	}
	
	public long getSize()
	{
		return size;
	}

	public void setSize(long size) {
		// TODO Auto-generated method stub
		this.size = size;
	}
	
	public int getType()
	{
		return type;
	}

	public void setType(int type) {
		// TODO Auto-generated method stub
		this.type = type;
	}
	
	public void setCommitMessage(String commitMessage) {
		// TODO Auto-generated method stub
		this.commitMessage = commitMessage;
	}
	
	public String getCommitMessage()
	{
		return commitMessage;
	}
		
	public void setRevision(String revision) {
		// TODO Auto-generated method stub
		this.revision = revision;
	}
	
	public String getRevision()
	{
		return revision;
	}
}
