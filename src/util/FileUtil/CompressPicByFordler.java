/**
 * 
 */
package util.FileUtil;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;


/**  
 * 类描述：   按文件夹递归压缩图片至新文件夹
 * 创建人：zhanjp
 * 创建时间：2016-1-21 上午9:57:09
 * @version    
 *    
 */
public class CompressPicByFordler {

	private String srcFordler;
	
	private String desFordler;
	
	public CompressPicByFordler(String sFordler, String dFordler) throws Exception {
		// TODO Auto-generated constructor stub
		if(sFordler!=null&&!sFordler.equals("")&&dFordler!=null&&!dFordler.equals("")){
			this.srcFordler = new File(sFordler).getAbsolutePath();
			this.desFordler = new File(dFordler).getAbsolutePath();
		}else {
			throw new Exception("源目录或目标目录路径不正确！");
		}
	}
	
	public static void main(String[] args) {
		//本地测试
		CompressPicByFordler cp;
		try {
			cp = new CompressPicByFordler("D:/WWW/pic","D:/WWW/compressPic");
			cp.press();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}
	
	public void press() throws Exception{
		Path srcPath = Paths.get(srcFordler);
//		Path desPath = Paths.get(desFordler);
//		try (DirectoryStream<Path> stream = 
//				Files.newDirectoryStream(srcPath, "*.{jpg,jpeg,bmp,png,gif,JPG,JPEG,BMP,PNG,GIF}")){
//			for(Path entry: stream){
//				System.out.println(entry.getFileName());
//			}
//		} catch (Exception e) {
//			// TODO: handle exception
//			e.printStackTrace();
//		}
		System.out.println("-----遍历文件夹start----");
		Files.walkFileTree(srcPath, new FindPicVisitor());
		
	}
	
	
	private class FindPicVisitor extends SimpleFileVisitor<Path>{
		
		@Override
		public FileVisitResult visitFile(Path file, BasicFileAttributes attrs)
				throws IOException {
			
//			Pattern p = Pattern.compile("jpg|jpeg|bmp|png|gif|JPG|JPEG|BMP|PNG|GIF");
			
			String hz = "jpg,jpeg,bmp,png,gif";
			String fileName = file.toString().toLowerCase();
//			System.out.println(file.toString());
			String fileHz = fileName.substring(fileName.lastIndexOf(".")+1);
			if(hz.contains(fileHz)){
				
				String sFordler = file.getParent().toFile().getAbsolutePath();
				String dFordler = sFordler.replace(srcFordler, desFordler);
				
				sFordler = sFordler.endsWith(File.separator)?sFordler:(sFordler+File.separator);
				dFordler = dFordler.endsWith(File.separator)?dFordler:(dFordler+File.separator);
				System.out.println(sFordler+"->"+dFordler);
				File file2 = new File(dFordler);
				if(file2.exists()){
					file2.mkdirs();
				}
				CompressPic cp = new CompressPic();
				cp.setInputDir(sFordler);
				cp.setOutputDir(dFordler);
				cp.setInputFileName(file.getFileName().toString());
				cp.setOutputFileName(file.getFileName().toString());
				cp.compressPic();
			}
			// TODO Auto-generated method stub
			return super.visitFile(file, attrs);
		}
		
		
	}
}
