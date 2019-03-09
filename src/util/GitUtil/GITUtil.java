package util.GitUtil;

import java.io.File;
import org.eclipse.jgit.api.Git;

public class GITUtil {
	
    //新建本地git仓库
	public static String CreateRepos(String name,String path){
		System.out.println("CreateRepos reposName:" + name + "under Path:" + path);
		
		File dir = new File(path,name);
        try {
			Git.init().setGitDir(dir).setDirectory(dir.getParentFile()).call();
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println("CreateRepos error");
			return null;
		}
        
        return path+name;
	}
	
}
