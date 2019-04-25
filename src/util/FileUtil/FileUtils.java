package util.FileUtil;
import java.io.*;

/**
 * 文件操作代码
 * 
 * @author cn.outofmemory
 * @date 2013-1-7
 */
public class FileUtils {
	
	// 验证字符串是否为正确路径名的正则
	public static String matches = "[A-Za-z]:\\\\[^:?\"><*]*";
	public final static String crlf = System.getProperty("line.separator");

	/**
	 * 将文本文件中的内容读入到buffer中
	 * 
	 * @param buffer
	 *            buffer
	 * @param filePath
	 *            文件路径
	 * @throws IOException
	 *             异常
	 * @author cn.outofmemory
	 * @date 2013-1-7
	 */
	public static void readToBuffer(StringBuffer buffer, String filePath)
			throws IOException {
		InputStream is = new FileInputStream(filePath);
		String line; // 用来保存每行读取的内容
		BufferedReader reader = new BufferedReader(new InputStreamReader(is));
		line = reader.readLine(); // 读取第一行
		while (line != null) { // 如果 line 为空说明读完了
			buffer.append(line); // 将读到的内容添加到 buffer 中
			buffer.append(crlf); // 添加换行符
			line = reader.readLine(); // 读取下一行
		}
		reader.close();
		is.close();
	}

	/**
	 * 读取文本文件内容
	 * 
	 * @param filePath
	 *            文件所在路径
	 * @return 文本内容
	 * @throws IOException
	 *             异常
	 * @author cn.outofmemory
	 * @date 2013-1-7
	 */
	public static String readText(String filePath) throws IOException {
		StringBuffer sb = new StringBuffer();
		FileUtils.readToBuffer(sb, filePath);
		return sb.toString();
	}
	
	
	public static void WriteText(String filePath, String content) {

		File file = new File(filePath);

		try (FileOutputStream fop = new FileOutputStream(file)) {

			// if file doesn't exists, then create it
			if (!file.exists()) {
				file.createNewFile();
			}

			// get the content in bytes
			byte[] contentInBytes = content.getBytes();

			fop.write(contentInBytes);
			fop.flush();
			fop.close();

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public static String getPrefix(File file) {

		String fileName = file.getName();
		int index = fileName.lastIndexOf(".") + 1;
		if( 0 == index){
			return "";
		}else{
			return fileName.substring(index);
		}
	}
	


	// 删除文件
	public static boolean deleteFile(String sPath) {
		File file = new File(sPath);
		if (file.exists() && file.isFile()) {
			file.delete();
			return true;
		}
		return false;
	}

	// 子文件的个数
	public static int countFiles(String path) {
		
		File folder = new File(path);
		if ( folder.isDirectory() ){
			int num = 0;
			File[] flist = folder.listFiles();
			for(int i =0 ; i<flist.length ; i++)
			{
				if(flist[i].isFile())
				{
					num += 1;
				}
			}
			return num;
		}
		else {
			return 0;
		}
	}

}