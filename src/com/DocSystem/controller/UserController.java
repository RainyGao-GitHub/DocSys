package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.context.ContextLoader;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.multipart.MultipartFile;

import util.RegularUtil;
import util.ReturnAjax;
import util.Encrypt.MD5;
import util.WebUploader.MultipartFileParam;

import com.DocSystem.entity.User;
import com.DocSystem.service.impl.UserServiceImpl;
import com.DocSystem.controller.BaseController;
import com.DocSystem.commonService.EmailService;
import com.DocSystem.commonService.SmsService;

@Controller
@RequestMapping("/User")
public class UserController extends BaseController {
	@Autowired
	private UserServiceImpl userService;
	
	@Autowired
	private SmsService smsService;
	
	@Autowired
	private EmailService emailService;
	
	
	
	//用户登录接口
	@RequestMapping("/login.do")
	public void login(String userName,String pwd,String rememberMe,HttpServletRequest request,HttpSession session,HttpServletResponse response){
		System.out.println("login userName:"+userName + " pwd:" + pwd + " rememberMe:" + rememberMe);
		
		ReturnAjax rt = new ReturnAjax();
		
		List<User> uList = userService.geAllUsers();
		if(uList == null || uList.size() == 0)
		{
			//Add a default user(Admin)
			if(addAdminUser() == false)
			{
				System.out.println("系统管理员创建失败,请检查数据库设置!");
				writeJson(rt, response);	
				return;
			}
		}

		//tmp_user is used for store the query condition
		User tmp_user = new User();
		tmp_user.setName(userName);
		tmp_user.setPwd(pwd);
		List<User> uLists = getUserList(userName,pwd);
		boolean ret =loginCheck(rt, tmp_user, uLists, session,response);
		if(ret == false)
		{
			System.out.println("登录失败");
			writeJson(rt, response);	
			return;
		}
		
		//Set session
		System.out.println("登录成功");
		session.setAttribute("login_user", uLists.get(0));
		System.out.println("SESSION ID:" + session.getId());
		
		//如果用户点击了保存密码则保存cookies
		if(rememberMe!=null&&rememberMe.equals("1")){
			addCookie(response, "dsuser", userName, 7*24*60*60);//一周内免登录
			addCookie(response, "dstoken", pwd, 7*24*60*60);
			System.out.println("用户cookie保存成功");
		}
		
		//Feeback to page
		rt.setMsgInfo("登录成功！");
		rt.setData(uLists.get(0));	//将数据库取出的用户信息返回至前台
		writeJson(rt, response);	
		return;
	}
	
	//获取当前登录用户信息
	@RequestMapping(value="getLoginUser")
	public void getLoginUser(HttpServletRequest request,HttpSession session,HttpServletResponse response){
		System.out.println("getLoginUser SESSION ID:" + session.getId());
		
		ReturnAjax rt = new ReturnAjax();
		User user = getLoginUser(session, request, response, rt);
		if(user == null)
		{
			writeJson(rt, response);
			return;
		}
		
		//I not sure if the info in loginUser is lastest, so I need to get the usrInfo from database 
		user = userService.getUser(user.getId());
		rt.setData(user);	//返回用户信息
		writeJson(rt, response);	
	}
	
	//登出接口
	@RequestMapping(value="logout")
	public void logOut(HttpSession session,HttpServletResponse response,ModelMap model,String type){
		System.out.println("Logout SESSION ID:" + session.getId());
		
		ReturnAjax rt = new ReturnAjax();
		//删除cookie即将cookie的maxAge设置为0
		addCookie(response, "dsuser", null, 0);
		addCookie(response, "dstoken", null, 0);
		//清除session
		session.removeAttribute("login_user");
		rt.setMsgInfo("您已成功退出登陆。");
		
		writeJson(rt, response);	
	}
	
	
	//用户是否已注册检查接口
	@RequestMapping(value="checkUserRegistered")
	public void checkUserRegistered(String userName, HttpServletResponse response)
	{
		System.out.println("checkUserRegistered userName:"+userName);
		
		ReturnAjax rt = new ReturnAjax();
		
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("该邮箱已注册！");
			}
			writeJson(rt, response);
			return;
			
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("该手机已注册！");
			}
			writeJson(rt, response);
			return;
		}
		else
		{
			rt.setError("账号格式不正确！");
			writeJson(rt, response);
			return;
		}
	}
	
	//注册接口
	@RequestMapping(value="register")
	public void register(HttpSession session,String userName,String pwd,String pwd2,String verifyCode,HttpServletResponse response,ModelMap model)
	{
		System.out.println("register userName:"+userName + " pwd:"+pwd + " pwd2:"+pwd2 + " verifyCode:"+verifyCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		User user = new User();
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("该邮箱已注册！");
				writeJson(rt, response);
				return;
			}
			user.setEmail(userName);
			user.setEmailValid(1);
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("该手机已注册！");
				writeJson(rt, response);
				return;
			}
			user.setTel(userName);
			user.setTelValid(1);			
		}
		else
		{
			rt.setError("账号格式不正确！");
			writeJson(rt, response);
			return;
		}
		
		//检查验证码是否正确
		if(checkVerifyCode(session,"docsys_vcode", userName, verifyCode,1) == false)
		{
			rt.setError("验证码错误！");
			writeJson(rt, response);
			return;
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			rt.setError("密码不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(!pwd.equals(pwd2))	//要不要在后台检查两次密码不一致问题呢
		{
			System.out.println("注册密码："+pwd);
			System.out.println("确认注册密码："+pwd2);
			rt.setError("两次密码不一致，请重试！");
			writeJson(rt, response);
			return;
		}
		user.setPwd(pwd);
		user.setName(userName);	//默认用户名就用注册的名字
		user.setCreateType(1);	//用户为自主注册
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置川剧时间
		user.setType(0);
		if(isFirstUser() == true)
		{
			user.setType(2);
		}
		userService.addUser(user);
		
		user.setPwd("");	//密码不要返回回去
		rt.setData(user);
		writeJson(rt, response);
		return;
	}
	
	public boolean isFirstUser()
	{
		List<User> uList = userService.geAllUsers();
		if(uList == null || uList.size() == 0)
		{
			return true;
		}
		return false;
	}
	
	public User getUserByName(String name)
	{
		User user = new User();
		user.setName(name);
		List<User> uList = userService.getUserListByUserInfo(user);
		if(uList == null || uList.size() == 0)
		{
			return null;
		}
		
		return uList.get(0);
	}
	
	/**
	 * 发送邮箱验证信息
	 * @param response
	 * @param userName type
	 */
	@RequestMapping("/sendVerifyCode.do")
	public void sendVerifyCode(String userName,Integer type,HttpSession session,HttpServletResponse response)
	{
		System.out.println("sendVerifyCode userName:"+userName + " type:" + type);
		
		ReturnAjax rt = new ReturnAjax();
		if(userName == null || "".equals(userName))	//从session中取出用户名??
		{
			System.out.println("userName不能为空");
			rt.setError("请填写正确的邮箱或手机");
			writeJson(rt, response);
			return;
		}

		//根据注册类型不同，验证码需要放置在不同的session里面
		String sessionName = "";	//0 注册，1忘记密码
		if(type == null)	//默认用于注册
		{
			type = 0;	//默认验证码为用户注册
		}
		if(type == 0)
		{
			sessionName = "docsys_vcode";
		}
		else	
		{
			sessionName = "docsys_vcode" + type;			
		}
		
		//如果是邮箱则发送到邮箱，否则发送到手机
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{	
			String code = generateVerifyCode(session,sessionName,userName);
			String content =  "您收到了来自DocSys的验证码：" + code + ",15分钟内有效，请及时验证。";
			emailService.sendEmail(rt,userName,content);
			writeJson(rt, response);
			return;	
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			String code = generateVerifyCode(session,sessionName,userName);
			sendVerifyCodeSMS(rt,userName,type,code);
			writeJson(rt, response);
			return;
		}
		else
		{
			System.out.println("userName不是邮箱或手机");
			rt.setError("请使用正确的邮箱手机！");
			writeJson(rt, response);
			return;
		}		
	}
	
	private void sendVerifyCodeSMS(ReturnAjax rt, String userName, Integer type, String code) {
		switch(type.intValue())
		{
		case 0:
			smsService.sendSms(rt,userName, 1341175l, code, null, null); //注册短信模板id
			break;
		case 1:
			smsService.sendSms(rt,userName, 1341175l, code, null, null); //忘记密码短信模板id
			break;
		default:
			smsService.sendSms(rt,userName, 1341175l, code, null, null); //注册短信模板id
		}
	}

	//生成验证码: sessionVarName 保存验证码的session变量名
	public String generateVerifyCode(HttpSession session,String sessionVarName,String userName)
	{
		String code = Math.round(Math.random() * 1000000) + "";
		while(code.length()<6){
				code = "0" + code;
		}
		//将验证码保存进session中，同时将session有效期改为15分钟，有点风险
		session.setAttribute(sessionVarName, userName+code);
		session.setMaxInactiveInterval(15*60);
		return code;
	}
	
	//检查验证码：successClear设置的话，则验证通过会清除
	public boolean checkVerifyCode(HttpSession session, String sessionVarName, String userName, String code,int successClear)
	{
		code = userName+code;
		String code1 = (String) session.getAttribute(sessionVarName);
		if(code1!=null&&!"".equals(code1)&&code!=null&&!"".equals(code1)){
			if(code.equals(code1)){
				if(successClear == 1)
				{
					//验证码用过一次后将不能再使用，将session改回24小时有效，session不需要一直有效，因为网页可能一直在线
					session.removeAttribute(sessionVarName);
					session.setMaxInactiveInterval(24*60*60);	
				}
				return true;
			}else{
				return false;
			}
		}else{
			return false;
		}
	}
	
	@RequestMapping(value="checkVerifyCode")
	public void checkVerifyCode(HttpSession session,String userName,Integer type, String verifyCode,HttpServletResponse response,ModelMap model)
	{
		System.out.println("checkVerifyCode userName:"+userName + " type:"+type + " verifyCode:"+verifyCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		//检查验证码是否正确
		//根据注册类型不同，验证码需要放置在不同的session里面
		String sessionName = "";	//0 注册，1忘记密码
		if(type == null)	//默认用于注册
		{
			type = 0;	//默认验证码为用户注册
		}
		if(type == 0)
		{
			sessionName = "docsys_vcode";
		}
		else	
		{
			sessionName = "docsys_vcode" + type;			
		}
		if(checkVerifyCode(session,sessionName, userName, verifyCode,0) == false)
		{
			rt.setError("验证码错误！");
			writeJson(rt, response);
			return;
		}
		
		//返回成功信息
		writeJson(rt, response);
		return;
	}	
	
	//This function is for forget password
	@RequestMapping(value="changePwd")
	public void changePwd(HttpSession session,String userName,String pwd,String pwd2,String verifyCode,HttpServletResponse response,ModelMap model)
	{
		System.out.println("changePwd userName:"+userName + " pwd:"+pwd + " pwd2:"+pwd2 + " verifyCode:"+verifyCode);
		
		ReturnAjax rt = new ReturnAjax();
		
		User qUser = new User();
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		else if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			qUser.setEmail(userName);
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			qUser.setTel(userName);
		}
		else
		{
			rt.setError("账号格式不正确！");
			writeJson(rt, response);
			return;
		}
		List<User> uList = getUserList(userName,null);
		if(uList == null || uList.size() == 0)
		{
			rt.setError("用户不存在！");
			writeJson(rt, response);
			return;
		}
		
		//检查验证码是否正确
		if(checkVerifyCode(session,"docsys_vcode1", userName, verifyCode,1) == false)
		{
			rt.setError("验证码错误！");
			writeJson(rt, response);
			return;
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			rt.setError("密码不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(!pwd.equals(pwd2))	//要不要在后台检查两次密码不一致问题呢
		{
			System.out.println("密码："+pwd);
			System.out.println("确认密码："+pwd2);
			rt.setError("两次密码不一致，请重试！");
			writeJson(rt, response);
			return;
		}
		
		//更新密码
		User user = new User();
		user.setId(uList.get(0).getId());	//设置UserId
		user.setPwd(pwd);
		if(userService.updateUserInfo(user) == 0)
		{
			System.out.println("设置密码失败!");
			rt.setError("设置密码失败！");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="modifyPwd")
	public void modifyPwd(HttpSession session,String userName,String pwd,String pwd2,String oldPwd,HttpServletResponse response,ModelMap model)
	{
		System.out.println("changePwd userName:"+userName + " pwd:"+pwd + " pwd2:"+pwd2 + " oldPwd:"+oldPwd);
		
		ReturnAjax rt = new ReturnAjax();
		
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		//Check the user oldPwd
		User qUser = new User();
		qUser.setName(userName);
		qUser.setPwd(oldPwd);
		List<User> uList = userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			rt.setError("用户名或密码错误！");
			writeJson(rt, response);
			return;
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			rt.setError("密码不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(!pwd.equals(pwd2))	//要不要在后台检查两次密码不一致问题呢
		{
			System.out.println("密码："+pwd);
			System.out.println("确认密码："+pwd2);
			rt.setError("两次密码不一致，请重试！");
			writeJson(rt, response);
			return;
		}
		
		//更新密码
		User user = new User();
		user.setId(uList.get(0).getId());	//设置UserId
		user.setPwd(pwd);
		if(userService.updateUserInfo(user) == 0)
		{
			System.out.println("设置密码失败!");
			rt.setError("设置密码失败！");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="updateLoginUserInfo")
	public void updateLoginUserInfo(HttpSession session,String userName,String nickName,String realName,String intro,HttpServletResponse response,ModelMap model)
	{
		System.out.println("updateUserInfo userName:"+userName + " nickName:"+nickName + " realName:"+realName + " intro:"+intro);

		ReturnAjax rt = new ReturnAjax();
		
		//检查用户名是否为空，注意用户名真的是用户名，不是指绑定的手机和邮箱
		if(userName==null||"".equals(userName))
		{
			System.out.println("updateUserInfo() userName is empty！");
			rt.setError("账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		//Check if user is login
		User loginUser = (User) session.getAttribute("login_user");
		if(loginUser == null)
		{
			System.out.println("updateUserInfo() 用户未登陆！");
			rt.setError("用户未登陆！");
			writeJson(rt, response);
			return;
		}
		
		if(!userName.equals(loginUser.getName()))
		{
			System.out.println("updateUserInfo() 不能修改其他用户的信息！");
			rt.setError("修改用户信息失败！");
			writeJson(rt, response);
			return;
		}
		
		//Try to find the User
		User user = getUserByName(userName);
		if(user == null)
		{
			rt.setError("用户不存在！");
			writeJson(rt, response);
			return;			
		}
		
		//检查用户名是否为空
		if(realName!=null&&"".equals(realName))
		{
			rt.setError("真实姓名不能为空！");
			writeJson(rt, response);
			return;
		}

		if(nickName!=null&&"".equals(nickName))
		{
			rt.setError("昵称不能为空！");
			writeJson(rt, response);
			return;
		}
		
		User newUserInfo = new User();
		newUserInfo.setId(user.getId());
		newUserInfo.setNickName(nickName);
		newUserInfo.setRealName(realName);	
		newUserInfo.setIntro(intro);	
		if(userService.updateUserInfo(newUserInfo) == 0)
		{
			rt.setError("用户信息更新失败！");
			writeJson(rt, response);
			return;			
		}
		syncUpLoginUserInfo(newUserInfo,loginUser);
		
		writeJson(rt, response);
		return;
	}
	
	private void syncUpLoginUserInfo(User user,User loginUser)
	{
		if(user.getNickName() != null)
		{
			loginUser.setNickName(user.getNickName());
		}
		if(user.getRealName() != null)
		{
			loginUser.setRealName(user.getRealName());
		}
		if(user.getIntro() != null)
		{
			loginUser.setNickName(user.getIntro());
		}
		
	}
	
	@RequestMapping(value="uploadUserImg")
    public  void uploadUserImg(MultipartFileParam param, HttpServletRequest request, HttpServletResponse response,HttpSession session) throws Exception 
    {	
		System.out.println("uploadUserImg() filename:"+param.getName() + " size:" + param.getSize() + " Uid:" +param.getUid());
		
		ReturnAjax rt = new ReturnAjax();
		
		//Check if user is login
		User loginUser = (User) session.getAttribute("login_user");
		if(loginUser == null)
		{
			System.out.println("uploadUserImg() 用户未登陆！");
			rt.setError("用户未登陆！");
			writeJson(rt, response);
			return;
		}
		
		//Save the file
		MultipartFile uploadFile = param.getFile();
		if (uploadFile == null) 
		{
			System.out.println("uploadUserImg() uploadFile is null！");
			rt.setError("文件上传失败！");
			writeJson(rt, response);
			return;
		}
		
		/*保存文件*/
		System.out.println("uploadFile size is :" + uploadFile.getSize());
		
		String userImgName = saveUserImg(uploadFile,loginUser);
		if(userImgName == null)
		{
			System.out.println("uploadUserImg() saveFile Failed！");
			rt.setMsgData("uploadUserImg() saveFile Failed！");
			rt.setError("文件上传失败！");
			writeJson(rt, response);
			return;
		}
			
		//Set the user img info
		String userImgUrl = userImgName;
		User user = new User();
		user.setId(loginUser.getId());
		user.setImg(userImgUrl);
		if(userService.updateUserInfo(user) == 0)
		{
			System.out.println("uploadUserImg() updateUserInfo Failed！");
			rt.setMsgData("uploadUserImg() updateUserInfo Failed！");
			rt.setError("用户头像更新失败！");
			writeJson(rt, response);
			return;				
		}
		loginUser.setImg(userImgUrl);
		rt.setData(loginUser);
		writeJson(rt, response);
    }

	private String saveUserImg(MultipartFile uploadFile,User user) 
	{
		String fileName = uploadFile.getOriginalFilename();
        
        String imgDirPath = getUserImgPath(); 
        System.out.println("imgDirPath:" + imgDirPath);
        File dir = new File(imgDirPath);
        if (!dir.exists()) {
        	if(dir.mkdirs() == false)
        	{
        		return null;
        	}
        }
        
        String suffix = fileName.substring(fileName.lastIndexOf(".") + 1);
        String usrImgName =  user.getId()+"_"+ MD5.md5(fileName) + "."  + suffix; 
        String retName = null;
		try {
			retName = saveFile(uploadFile, imgDirPath,usrImgName);
		} catch (Exception e) {
			System.out.println("saveUserImg() saveFile " + usrImgName +" 异常！");
			e.printStackTrace();
			return null;
		}
		
		System.out.println("saveUserImg() saveFile return: " + retName);
		if(retName == null  || !retName.equals(usrImgName))
		{
			System.out.println("updateRealDoc() saveFile " + usrImgName +" Failed！");
			return null;
		}
		
		return retName;
	}
	
	private String getUserImgPath()
	{
		String webUploadPath = getWebUploadPath();
		String imgDirPath = webUploadPath + "userImg/";
        return imgDirPath;
	}
		
	//This interface is for getUserImg if useImgs not under tomcat
	@RequestMapping(value="getUserImg")
    public  void getUserImg(String fileName, HttpServletRequest request, HttpServletResponse response,HttpSession session) throws Exception 
    {	
		System.out.println("getUserImg() fileName:" + fileName);
		
		//解决中文编码问题
		if(request.getHeader("User-Agent").toUpperCase().indexOf("MSIE")>0){  
			fileName = URLEncoder.encode(fileName, "UTF-8");  
		}else{  
			fileName = new String(fileName.getBytes("UTF-8"),"ISO8859-1");  
		}  
		System.out.println("getUserImg fileName:" + fileName);
		
		//String suffix = fileName.substring(fileName.lastIndexOf(".") + 1);
		 
		//解决空格问题
		response.setHeader("content-disposition", "attachment;filename=\"" + fileName +"\"");
		response.setHeader("Content-Type","image/jped");
		
		//读取要下载的文件，保存到文件输入流
		String dstPath = getUserImgPath() + fileName;
		FileInputStream in = new FileInputStream(dstPath);
		//创建输出流
		OutputStream out = response.getOutputStream();
		//创建缓冲区
		byte buffer[] = new byte[1024];
		int len = 0;
		//循环将输入流中的内容读取到缓冲区当中
		while((len=in.read(buffer))>0){
			//输出缓冲区的内容到浏览器，实现文件下载
			out.write(buffer, 0, len);
		}
		//关闭文件输入流
		in.close();
		//关闭输出流
		out.close();
    }
	
}
