package com.DocSystem.test;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;

import com.DocSystem.common.Log;
import com.DocSystem.common.OS;

class RunCmdTest  
{  
	static int OSType;
	
    public static void main(String[] args)    
    {  
        Log.info("This is test app");
        
        initOSType();
    	  
        try {
        	String binPath = "C:/docsysRel/docsys-Win-Release/docsys-win 2.02.40/docsys/tomcat/webapps/DocSystem/web/static/office-editor/bin/";
        	String shellPath = binPath + "documentserver-generate-allfonts.bat";
        	if(!isWinOS())
        	{
        		shellPath = binPath + "documentserver-generate-allfonts.sh";
        	}
        	String cmd = buildScriptRunCmd(shellPath);        	
        	File dir = new File(binPath);
			String ret = run(cmd, null, dir);
			Log.info("checkAndGenerateFonts() generate-allfonts return:" + ret);

        } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
	
	private static int initOSType() {
		String OSName = System.getProperty("os.name"); 
		Log.debug("OSName:"+ OSName);
		String os = OSName.toLowerCase();
		OSType = OS.UNKOWN;
		if(os.startsWith("win"))
		{
			OSType = OS.Windows;
		}
		else if(os.startsWith("linux"))
		{
			OSType = OS.Linux;
		}
		else if(os.startsWith("mac"))
		{
			OSType = OS.MacOS;
		}
		return OSType;
	}
	
	protected static boolean isWinOS() {
		return OS.isWinOS(OSType);
	}	
	
	protected static String buildScriptRunCmd(String shellScriptPath) {
        String cmd = null;
        if (isWinOS()) {
        	cmd = "cmd /c \"" + shellScriptPath + "\"";
        }
        else
        {
        	cmd = "sh \"" + shellScriptPath + "\"";
        }
        return cmd;
    } 
	
    public static String run(String command, String[] envp, File dir) {
        String result = null;

    	Runtime rt = Runtime.getRuntime();
        try {
        	Process ps = rt.exec(command, envp, dir);
            
        	result = readProcessOutput(ps);

        	int exitCode = ps.waitFor();    	
        	if(exitCode == 0)
        	{
        		Log.debug("run() command:" + command +  " 执行成功！");
        	}
        	else
        	{
        		Log.debug("run() command:" + command +  " 执行失败！exitCode:" + exitCode);
        		Log.debug("run() 错误日志 result:" + result);   
        	}
        	ps.destroy();
            
        } catch (Exception e) {
            Log.info(e);
        }
        return result;
    }
    
	private static String readProcessOutput(Process ps) throws IOException {
		String result = read(ps.getInputStream(), System.out);
		if(result == null)
		{
			result = "";
		}
		
		result += read(ps.getErrorStream(), System.err);
		return result;
	}
	
	private static String read(InputStream inputStream, PrintStream out) throws IOException {
		String result = "";
		//printout the command line
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while((line = reader.readLine()) != null) {
        	result += line;
        	out.println(line);
        }
        return result;
	}
	
}  