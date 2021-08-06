package util.SFTPUtil;

import com.DocSystem.common.Log;
import com.jcraft.jsch.*;
import org.apache.poi.util.IOUtils;
 
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Vector;
 
public class SFTPUtil {
 
    private ChannelSftp sftp;
 
    private Session session;
    /**
     * SFTP 登录用户名
     */
    private String username;
    /**
     * SFTP 登录密码
     */
    private String password;
    /**
     * 私钥
     */
    private String privateKey;
    /**
     * SFTP 服务器地址IP地址
     */
    private String host;
    /**
     * SFTP 端口
     */
    private int port;
 
 
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
 
 
    /**
     * 连接sftp服务器
     */
    public boolean login() {
    	try {
            JSch jsch = new JSch();
            if (privateKey != null) {
                jsch.addIdentity(privateKey);// 设置私钥
            }
            
            Log.println("login host:" + host + " port:" + port + " userName:" + username + " password:" + password);
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
        } catch (JSchException e) {
            e.printStackTrace();
            return false;
        }
    	return true;
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
        if (session != null) {
            if (session.isConnected()) {
                session.disconnect();
            }
        }
    }
 
 
    /**
     * 将输入流的数据上传到sftp作为文件。文件完整路径=basePath+directory
     *
     * @param directory    上传到该目录
     * @param sftpFileName sftp端文件名
     */
    public boolean upload(String directory, String sftpFileName, InputStream input) throws SftpException {
        try {
            if (directory != null && !"".equals(directory)) {
                sftp.cd(directory);
            }
            sftp.put(input, sftpFileName);  //上传文件
            return true;
        } catch (SftpException e) {
        	e.printStackTrace();
            return false;
        }
    }
 
    public boolean mkdir(String directory) throws SftpException {
        try {
            if (directory != null && !"".equals(directory)) {
                sftp.mkdir(directory);
            }
            return true;
        } catch (SftpException e) {
        	e.printStackTrace();
            return false;
        }
    }
    
    public boolean delDir(String directory) throws SftpException {
        try {
            if (directory != null && !"".equals(directory)) {
                sftp.rmdir(directory);
            }
            return true;
        } catch (SftpException e) {
        	e.printStackTrace();
            return false;
        }
    }

    public boolean delFile(String directory, String fileName) throws SftpException {
        try {
            sftp.rm(directory + "/" + fileName);
            return true;
        } catch (SftpException e) {
        	e.printStackTrace();
            return false;
        }
    }    

    //move/rename File
    public boolean rename(String fromFilePath, String toFilePath) throws SftpException {
        try {
            sftp.rename(fromFilePath, toFilePath);
            return true;
        } catch (SftpException e) {
        	e.printStackTrace();
            return false;
        }
    }    

    
    public void cd(String directory) throws SftpException {
        if (directory != null && !"".equals(directory) && !"/".equals(directory)) {
            sftp.cd(directory);
        }
 
    }
 
 
    /**
     * 下载文件。
     *
     * @param directory    下载目录
     * @param downloadFile 下载的文件
     * @param saveFile     存在本地的路径
     */
    public boolean download(String remotePath, String localPath, String fileName) {
        System.out.println("download remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
 
        File file = null;
        try {
            if (remotePath != null && !"".equals(remotePath)) {
                sftp.cd(remotePath);
            }
            file = new File(localPath + fileName);
            FileOutputStream os = new FileOutputStream(file);
            sftp.get(remotePath + fileName, os);
            os.close();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            if (file != null) {
                file.delete();
            }
        }
        return false;
    }
 
    /**
     * 下载文件
     *
     * @param directory    下载目录
     * @param downloadFile 下载的文件名
     * @return 字节数组
     */
    public byte[] download(String directory, String downloadFile) throws SftpException, IOException {
        if (directory != null && !"".equals(directory)) {
            sftp.cd(directory);
        }
        InputStream is = sftp.get(downloadFile); 
        byte[] fileData = IOUtils.toByteArray(is);
        is.close();
 
        return fileData;
    }
 
 
    /**
     * 删除文件
     *
     * @param directory  要删除文件所在目录
     * @param deleteFile 要删除的文件
     */
    public void delete(String directory, String deleteFile) throws SftpException {
        if (directory != null && !"".equals(directory)) {
            sftp.cd(directory);
        }
        sftp.rm(deleteFile);
    }
 
 
    /**
     * 列出目录下的文件
     *
     * @param directory 要列出的目录
     */
    public Vector<?> listFiles(String directory) throws SftpException {
    	return sftp.ls(directory);
    }
 
    public boolean isDirExists(String directory) { 
        try {
			sftp.cd(directory);
			return true;
        } catch (SftpException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
    }
 
    public boolean isExistsFile(String directory, String fileName) {
 
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
        } catch (SftpException e) {
            e.printStackTrace();
        }
 
        if (findFilelist.size() > 0) {
            return true;
        } else {
            return false;
        }
    }
}
