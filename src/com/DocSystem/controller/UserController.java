package com.DocSystem.controller;

import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;

import util.EmailUtil;
import util.EncryptUtil;
import util.HexString;
import util.RegularUtil;
import util.ReturnAjax;

import com.DocSystem.entity.User;
import com.DocSystem.service.impl.UserServiceImpl;
import com.DocSystem.controller.BaseController;
import com.DocSystem.commonService.EmailService;
import com.DocSystem.commonService.SmsService;

@Controller
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
		Cookie c1 = getCookieByName(request, "dsuser");
		Cookie c2 = getCookieByName(request, "dstoken");
		
		//tmp_user is used for store the query condition
		User tmp_user = new User();
		if(c1!=null&&c2!=null&&c1.getValue()!=null&&c2.getValue()!=null&&!"".equals(c1.getValue())&&!"".equals(c2.getValue())){
			System.out.println("自动登录");
				
			tmp_user.setEmail(c1.getValue());
			tmp_user.setPwd(c2.getValue());
			List<User> uLists = userService.queryUserByTelOrEmail(tmp_user);	
			boolean f = loginCheck(rt, tmp_user, uLists, session,response);
			if(f){
				System.out.println("登录成功");
				session.setAttribute("login_user", uLists.get(0));
				rt.setMsgInfo("success#您已保存本站账户密码，自动登录成功！");
				rt.setData(uLists.get(0));	//将数据库取出的用户信息返回至前台??
			}
			writeJson(rt, response);	
			return;
		}
		
		System.out.println("登陆密码："+pwd);
		if(RegularUtil.isEmail(userName))
		{
			tmp_user.setEmail(userName);
		}
		else
		{
			tmp_user.setTel(userName);			
		}
		tmp_user.setPwd(pwd);
		List<User> uLists = userService.queryUserByTelOrEmail(tmp_user);
		boolean f =loginCheck(rt, tmp_user, uLists, session,response);
		if(f){
			//如果用户点击了保存密码则保存cookies
			if(rememberMe!=null&&rememberMe.equals("1")){
				addCookie(response, "dsuser", userName, 7*24*60*60);//一周内免登录
				addCookie(response, "dstoken", pwd, 7*24*60*60);
				System.out.println("用户cookie保存成功");
			}
			System.out.println("登录成功1");
			session.setAttribute("login_user", uLists.get(0));
			rt.setMsgInfo("success#登录成功！");
			rt.setData(uLists.get(0));	//将数据库取出的用户信息返回至前台??
		}
		System.out.println("SESSION ID:" + session.getId());
		
		writeJson(rt, response);	
		return;
	}
	
	/**
	 * 用户数据校验
	 * @param uLists 根据条件从数据库中查出的user列表
	 * @param rt 返回ajax信息的类
	 * @param session 
	 * @param localUser 前台传回的user信息，或者cookies中保存的用户信息
	 * @return
	 */
	private boolean loginCheck(ReturnAjax rt,User localUser, List<User> uLists,HttpSession session,HttpServletResponse response)
	{
		User dbUser = new User();
		
		if(uLists == null)
		{
			rt.setError("fail#用户名或密码错误！");
			return false;	
		}
		else if(uLists.size()<1){
			rt.setError("danger#对不起，您的账号或者密码错误！");
			return false;
		}else if(uLists.size()>1){
			//TODO系统异常需要处理
			rt.setError("danger#登录失败！");
			return false;
		}
		else
		{
			//检查邮箱或手机是否已通过验证
			dbUser = uLists.get(0);
			if(StringUtils.isNotBlank(localUser.getEmail()))//邮箱登录
			{
				if(dbUser.getEmailValid() == 0)
				{
					rt.setError("warning#您尚未验证邮箱，请验证后再登陆");
					return false;
				}
			}
			else if(StringUtils.isNotBlank(localUser.getTel()))	//手机登录
			{
				if(dbUser.getTelValid() == 0)
				{
					rt.setError("warning#您尚未验证手机，请验证后再登陆");
					return false;
				}
			}
			else
			{
				rt.setError("error#系统错误,登录用户信息错误");
				return false;
			}
		}
		
		return true;
	}
	
	//获取当前登录用户信息
	@RequestMapping(value="getLoginUser")
	public void getLoginUser(HttpSession session,HttpServletResponse response){
		System.out.println("getLoginUser SESSION ID:" + session.getId());
		
		ReturnAjax rt = new ReturnAjax();
		User user = (User) session.getAttribute("login_user");
		if(user == null)
		{
			rt.setError("info#用户未登录。");
		}
		else
		{
			rt.setData(user);	//返回用户信息
		}
		
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
		rt.setMsgInfo("info#您已成功退出登陆。");
		
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
			rt.setError("danger#账号不能为空！");
		}
		else if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isEmailRegistered(userName) == true)
			{
				rt.setError("error#该邮箱已注册！");
			}
			writeJson(rt, response);
			return;
			
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isTelRegistered(userName) == true)
			{
				rt.setError("error#该手机已注册！");
			}
			writeJson(rt, response);
			return;
		}
		else
		{
			rt.setError("danger#账号格式不正确！");
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
			rt.setError("danger#账号不能为空！");
		}
		else if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isEmailRegistered(userName) == true)
			{
				rt.setError("error#该邮箱已注册！");
				writeJson(rt, response);
				return;
			}
			user.setEmail(userName);
			user.setEmailValid(1);
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isTelRegistered(userName) == true)
			{
				rt.setError("error#该手机已注册！");
				writeJson(rt, response);
				return;
			}
			user.setTel(userName);
			user.setTelValid(1);			
		}
		else
		{
			rt.setError("danger#账号格式不正确！");
			writeJson(rt, response);
			return;
		}
		
		//检查验证码是否正确
		if(checkVerifyCode(session,"docsys_vcode", userName, verifyCode) == false)
		{
			rt.setError("danger#验证码错误！");
			writeJson(rt, response);
			return;
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			rt.setError("danger#密码不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(!pwd.equals(pwd2))	//要不要在后台检查两次密码不一致问题呢
		{
			System.out.println("注册密码："+pwd);
			System.out.println("确认注册密码："+pwd2);
			rt.setError("danger#两次密码不一致，请重试！");
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
	public boolean isTelRegistered(String Tel)
	{
		User user = new User();
		user.setTel(Tel);
		List<User> uList = userService.getUserListByUserInfo(user);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		
		return true;
	}
	
	public boolean isEmailRegistered(String Email)
	{
		User user = new User();
		user.setEmail(Email);
		List<User> uList = userService.getUserListByUserInfo(user);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		
		return true;
	}
	
	/**
	 * 发送邮箱验证信息
	 * @param response
	 * @param email
	 */
	@RequestMapping("/sendVerifyCode.do")
	public void sendVerifyCode(String userName,HttpSession session,HttpServletResponse response)
	{
		System.out.println("sendVerifyCode userName:"+userName);
		
		ReturnAjax rt = new ReturnAjax();
		
		if(userName == null || "".equals(userName))	//从session中取出用户名??
		{
			System.out.println("userName不能为空");
			rt.setError("error#请填写正确的邮箱或手机");
			writeJson(rt, response);
			return;
		}
		
		//如果是邮箱则发送到邮箱，否则发送到手机
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{	
			String code = generateVerifyCode(session,"docsys_vcode",userName);
			String content =  "您收到了来自DocSys的验证码：" + code + ",15分钟内有效，请及时验证。";
			emailService.sendEmail(rt,userName,content);
			writeJson(rt, response);
			return;	
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			String code = generateVerifyCode(session,"docsys_vcode",userName);
			smsService.sendSms(rt,userName, 1341175l, code, null, null); //注册短信模板id
			writeJson(rt, response);
			return;
		}
		else
		{
			System.out.println("userName不是邮箱或手机");
			rt.setError("danger#请使用正确的邮箱手机！");
			writeJson(rt, response);
			return;
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
	
	//检查验证码：
	public boolean checkVerifyCode(HttpSession session, String sessionVarName, String userName, String code)
	{
		code = userName+code;
		String code1 = (String) session.getAttribute(sessionVarName);
		if(code1!=null&&!"".equals(code1)&&code!=null&&!"".equals(code1)){
			if(code.equals(code1)){
				//验证码用过一次后将不能再使用，将session改回24小时有效，session不需要一直有效，因为网页可能一直在线
				session.removeAttribute(sessionVarName);
				session.setMaxInactiveInterval(24*60*60);	
				return true;
			}else{
				return false;
			}
		}else{
			return false;
		}
	}

}
