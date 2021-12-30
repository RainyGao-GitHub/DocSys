package com.DocSystem.common.remoteStorage;

import com.DocSystem.common.Log;
import com.jcraft.jsch.*;
import com.jcraft.jsch.ChannelSftp.LsEntry;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Vector;
 
public class SFTPUtil {
 
    //server host and port
    private String host;
    private int port; 
    //userName and pwd for login with userName
    private String username;
    private String password;
    //private key path for login with ssh
    private String privateKey;
 
    private ChannelSftp sftp;
    //远程文件复制，使用同一个channel会导致put接口卡死，因此需要使用另外一个channel来获取InputStream
    private ChannelSftp sftpForCopy = null;
    private Session session;
 
    /**
     * 构造基于密码认证的sftp对象
     */
    public SFTPUtil(String username, String password, String host, int port) {
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
    }
 
    /**
     * 构造基于秘钥认证的sftp对象
     */
    public SFTPUtil(String username, String host, int port, String privateKey) {
        this.username = username;
        this.host = host;
        this.port = port;
        this.privateKey = privateKey;
    }
 
    public SFTPUtil() {
    }
 
    public boolean login() {
    	boolean ret = false;
    	try {
            JSch jsch = new JSch();
            if (privateKey != null) {
                jsch.addIdentity(privateKey);// 设置私钥
            }
            
            Log.debug("login host:" + host + " port:" + port + " userName:" + username + " password:" + password);
            session = jsch.getSession(username, host, port);
 
            if (password != null) {
                session.setPassword(password);
            }
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            
            //解决Kerberos username
            config.put("PreferredAuthentications","publickey,keyboard-interactive,password"); 

            session.setConfig(config);
            session.connect();
 
            Channel channel = session.openChannel("sftp");
            channel.connect();
 
            sftp = (ChannelSftp) channel;
            ret = true;
        } catch (JSchException e) {
            Log.info(e);
        }
    	return ret;
    }
 
    /**
     * 关闭连接 server
     */
    public void logout() {
        if (sftp != null) {
            if (sftp.isConnected()) {
                sftp.disconnect();
            }
        }

        if (sftpForCopy != null) {
            if (sftpForCopy.isConnected()) {
            	sftpForCopy.disconnect();
            }
        }
        
        if (session != null) {
            if (session.isConnected()) {
                session.disconnect();
            }
        }
    }
 
    //获取文件列表
    public Vector<?> listFiles(String directory) {
    	Vector<?> list = null;
        try {        	
        	list = sftp.ls(directory);
        } catch (Exception e) {
        	e.printStackTrace();
        }
        return list;
    }
    
    //上传文件
    public boolean upload(String directory, String sftpFileName, InputStream input)  {
    	boolean ret = false;
        try {
            sftp.cd(directory);
            sftp.put(input, sftpFileName);  //上传文件
            ret = true;
        } catch (Exception e) {
        	e.printStackTrace();
        }
        return ret;
    }
    
	public boolean upload(String remotePath, String localPath, String fileName) {
        boolean ret = false;
		FileInputStream is = null;

		Log.debug("upload remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
        	is = new FileInputStream(localPath + fileName);
        	ret = upload(remotePath, fileName, is);   
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
        return ret;
	}
	
    //下载文件
    public boolean download(String remotePath, String localPath, String fileName)  {
        System.out.println("download remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
        boolean ret = false;
        File file = null;
        FileOutputStream os = null;
        
        try {
            sftp.cd(remotePath);
            File localDir = new File(localPath);
            if(localDir.exists() == false)
            {
            	localDir.mkdirs();
            }
            file = new File(localPath + fileName);
            os = new FileOutputStream(file);
            sftp.get(remotePath + fileName, os);
            ret = true;
        } catch (Exception e1) {
            e1.printStackTrace();
        } finally {
        	if(os != null)
        	{
        		try {
					os.close();
				} catch (Exception e2) {
					e2.printStackTrace();
				}
        	}
        }
        return ret;
    }
 
    //新增目录
    public boolean mkdir(String directory)  {
    	boolean ret = false;
    	try {
            sftp.mkdir(directory);
            ret =  true;
        } catch (Exception e) {
        	e.printStackTrace();
        }
    	return ret;
    }
    
    public boolean delDirs(String directory, String fileName) {
    	boolean ret = false;
		try {       	        	
			Vector<?> list = sftp.ls(directory + fileName);
			if(list != null)
			{
				for(int i=0; i<list.size(); i++)
				{
					LsEntry subEntry = (LsEntry) list.get(i);
					String subEntryName = subEntry.getFilename();
					if(subEntryName.equals(".") || subEntryName.equals(".."))
					{
						continue;
					}
					
					if(subEntry.getAttrs().isDir())
					{
						if(delDirs(directory + fileName + "/", subEntryName) == false)
						{
							Log.debug("delDirs() delete folder [" + directory + fileName + subEntryName + "] Failed");
							return false;
						}
					}
					else
					{
						if(delFile(directory + fileName + "/", subEntryName) == false)
						{
							return false;
						}
					}
				}
			}
			ret = delDir(directory, fileName);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	return ret;
    }
    
    public boolean delDir(String directory, String fileName)  {
    	boolean ret = false;
    	try {
            sftp.rmdir(directory + fileName);
            ret =  true;
        } catch (Exception e) {
			Log.debug("delDir() delete file [" + directory + fileName + "] Failed");
        	e.printStackTrace();
        }
    	return ret;
    }

    public boolean delFile(String directory, String fileName) {
        boolean ret = false;
    	try {
            sftp.rm(directory + fileName);
            ret =  true;
        } catch (Exception e) {
			Log.debug("delFile() delete file [" + directory + fileName + "] Failed");
        	e.printStackTrace();
        }
    	return ret;
    }    

    //移动或重命名
    public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
       if(isMove)
       {
    	   return move(srcRemotePath, srcName, dstRemotePath, dstName);
       }
       
       return copy(srcRemotePath, srcName, dstRemotePath, dstName, type);
    }  
    
	public boolean copy(String srcRemotePath, String srcName, String dstRemotePath, String dstName, Integer type) {
    	boolean ret = false;    	
    	if(type == 1)
    	{
    		Log.debug("copy() " + srcRemotePath + srcName + " is file");
			ret = copyFile(srcRemotePath, srcName, dstRemotePath, dstName);
			Log.debug("copy() " + srcRemotePath + srcName + " ret:" + ret);
			return ret;
    	}
    	
    	Log.debug("copy() " + srcRemotePath + srcName + " is folder");
    	ret = copyDir(srcRemotePath, srcName, dstRemotePath, dstName);
		Log.debug("copy() " + srcRemotePath + srcName + " ret:" + ret);
    	return ret;
	}    
	
    private boolean copyDir(String srcRemotePath, String srcName, String dstRemotePath, String dstName) {
    	boolean ret = false;
		try
    	{	
			ret = mkdir(dstRemotePath + dstName);        	
			Vector<?> list = sftp.ls(srcRemotePath + srcName);
			if(list != null)
			{
            	if(ret == true)
            	{
	            	for(int i=0; i < list.size(); i++)
		            {
	            		LsEntry subEntry = (LsEntry) list.get(i);
	            		Log.debug("copy() subEntry:" + subEntry.getFilename());
	            		if(subEntry.getAttrs().isDir() == false)
		            	{
		            		copyFile(srcRemotePath + srcName + "/", subEntry.getFilename(), dstRemotePath + dstName + "/", subEntry.getFilename());
		            	}
		            	else
		            	{
		            		copyDir(srcRemotePath + srcName + "/", subEntry.getFilename(),  dstRemotePath + dstName + "/", subEntry.getFilename());
		            	}
	    			}
            	}
			}
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
	} 
	

    
	public boolean copyFile(String srcRemotePath, String srcName, String dstRemotePath, String dstName)  {
    	boolean ret = false;
    	Log.debug("copyFile() " + srcRemotePath + srcName + " to " + dstRemotePath + dstName);
    	InputStream is = null;
        try {
        	is = getInputStreamForCopy(srcRemotePath + srcName);
        	Log.debug("copyFile() " + srcRemotePath + srcName + " get ok ");       	
        	sftp.put(is, dstRemotePath + dstName);
            Log.debug("copyFile() " + dstRemotePath + dstName + " put ok ");
        	ret = true;
        } catch (Exception e1) {
			e1.printStackTrace();
		} finally {
			if(is != null)
			{
				try {
					is.close();
				} catch (Exception e2) {
					e2.printStackTrace();
				}
			}
		}
        return ret;
	} 
    
    private InputStream getInputStreamForCopy(String remoteFilePath) throws JSchException, SftpException {
    	InputStream is = null;
    	if(sftpForCopy == null)
    	{
	    	Channel channel = session.openChannel("sftp");
	        channel.connect();
	        sftpForCopy = (ChannelSftp) channel;
    	}
        is = sftpForCopy.get(remoteFilePath);
		return is;
	}

	public boolean move(String srcRemotePath, String srcName, String dstRemotePath, String dstName) {
        boolean ret = false;
    	try {
            sftp.rename(srcRemotePath + srcName, dstRemotePath + dstName);
            ret =  true;
        } catch (Exception e) {
        	e.printStackTrace();
        }
        return ret;        
    } 

    //切换目录
    public void cd(String directory) {
        try {
			sftp.cd(directory);
		} catch (Exception e) {
			e.printStackTrace();
		}
    }

 
    public boolean isDirExists(String directory) { 
        boolean ret = false;
    	try {
			sftp.cd(directory);
			ret = true;
        } catch (Exception e) {
			e.printStackTrace();
		}
        return ret;
    }
 
    public boolean isFileExists(String directory, String fileName) {
 
        List<String> findFilelist = new ArrayList<String>();
        ChannelSftp.LsEntrySelector selector = new ChannelSftp.LsEntrySelector() {
            @Override
            public int select(ChannelSftp.LsEntry lsEntry) {
                if (lsEntry.getFilename().equals(fileName)) {
                    findFilelist.add(fileName);
                }
                return 0;
            }
        };
 
        try {
            sftp.ls(directory, selector);
        } catch (Exception e) {
            e.printStackTrace();
        }
 
        if (findFilelist.size() > 0) {
            return true;
        } else {
            return false;
        }
    }
}
