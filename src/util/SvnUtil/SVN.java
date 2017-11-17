package util.SvnUtil;

import java.util.Date;

public class SVN {
    private String url;

    private String commitMessage;

    private Date date;

    private String kind;

    private String repositoryRoot;

    private long revision;

    private String name;

    private long size;

    private String author;

    private String state;
	
	public void setCommitMessage(String commitMessage) {
		// TODO Auto-generated method stub
		this.commitMessage = commitMessage;
	}
	
	public String getCommitMessage()
	{
		return commitMessage;
	}

	public void setDate(Date date) {
		// TODO Auto-generated method stub
		this.date = date;
	}
	
	public Date getDate()
	{
		return date;
	}

	public void setKind(String kind) {
		// TODO Auto-generated method stub
		this.kind = kind;
	}
	
	public String getKind()
	{
		return kind;
	}

	public void setName(String name) {
		// TODO Auto-generated method stub
		this.name = name;
	}

	public String getName()
	{
		return name;
	}
	
	public void setRepositoryRoot(String repositoryRoot) {
		// TODO Auto-generated method stub
		this.repositoryRoot = repositoryRoot;
	}

	public String getRepositoryRoot()
	{
		return repositoryRoot;
	}
	
	public void setRevision(long revision) {
		// TODO Auto-generated method stub
		this.revision = revision;
	}
	
	public long getRevision()
	{
		return revision;
	}

	public void setSize(long size) {
		// TODO Auto-generated method stub
		this.size = size;
	}
	
	public long getSize()
	{
		return size;
	}

	public void setUrl(String url) {
		// TODO Auto-generated method stub
		this.url = url;
	}
	
	public String getUrl() {
		// TODO Auto-generated method stub
		return url;
	}

	public void setAuthor(String author) {
		// TODO Auto-generated method stub
		this.author = author;
	}

	public String getAuthor() {
		// TODO Auto-generated method stub
		return author;
	}

	public void setState(String state) {
		// TODO Auto-generated method stub
		this.state = state;
	}
	
	public String getState() {
		// TODO Auto-generated method stub
		return state;
	}

}
