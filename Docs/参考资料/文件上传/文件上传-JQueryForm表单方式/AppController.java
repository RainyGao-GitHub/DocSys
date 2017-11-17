package com.hzlh.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.hzlh.common.util.SYSID;
import com.hzlh.core.service.UploadService;
import com.hzlh.domain.po.AppInfo;
import com.hzlh.domain.po.SystemItemDefinePo;
import com.hzlh.log.MethodLog;
import com.hzlh.service.AppService;
import com.hzlh.service.SystemItemDefineService;
import com.hzlh.service.FtpAndOssService;
import com.hzlh.shiro.ShiroUser;

@Controller
@RequestMapping("app")
public class AppController extends BaseController{

	private static final String uploadFirstSubDir = "app";
	@Autowired
	private AppService service;
	@Autowired
	@Qualifier("uploadFtpService")
	private UploadService uploadService;
	@Autowired
	private SystemItemDefineService systemItemDefineService;
	@Autowired
	private FtpAndOssService ftpAndOssService;

	@RequiresPermissions("app:list")
	@RequestMapping("/togetAppList")
	public String togetAppList(Model model) {
		Map<String, Object> rmap=new HashMap<>();
		rmap.put("sysItem", "whether");
		List<SystemItemDefinePo> slist = systemItemDefineService.getBysysItem(rmap);
		model.addAttribute("slist", JSONArray.fromObject(slist));
		return "app/list";
	}
	/*sysCode_+"appVersion"*/
	@MethodLog(key="APP.LIST")
	@RequestMapping("/getAppList")
	@ResponseBody
	public Map<String, Object> getAppList(int pageIndex,int pageSize) {
		AppInfo app = new AppInfo();
		app.setStart(pageIndex);
		app.setEnd(pageSize);
		Subject subject = SecurityUtils.getSubject();
		ShiroUser user = (ShiroUser) subject.getPrincipal();
		if(user!=null){
			app.setSysCode(user.getSysInit().getSysCode());
		}
		return service.getAppList(app);
	}

	@MethodLog(key="APP.SAVE")
	@RequiresPermissions("app:save")
	@RequestMapping("/add")
	@ResponseBody
	public boolean pushApp(AppInfo app, MultipartFile mfile,
			HttpServletResponse response) {
		boolean result = false;
		try {
			if (mfile != null && mfile.getSize() > 0) {
				// 处理上传资料【跳转URL
				/*UploadedFile uploadedFile = uploadService
						.uploadFileToUploadDir(uploadFirstSubDir, mfile);
				String url = uploadService.getUploadUrl()
						+ uploadedFile.getReadUrl();*/
				Subject subject = SecurityUtils.getSubject();
		  		ShiroUser shiroUser = (ShiroUser)subject.getPrincipal();
		  		String sysCode = shiroUser.getUser().getSysCode();
		  		//String url = ObjectOperations.uploadLocalFileToOss(sysCode ,mfile);
		  		String url = ftpAndOssService.uploadLocalFileToOss(uploadFirstSubDir, sysCode, mfile);
				app.setFilePath(url);
				long size = mfile.getSize();
				String strSize;
				if (size < 1024 * 1024) {
					strSize = ((size * 1.0) / (1024)) + "";// 计算文件大小
					app.setFileSize(strSize.substring(0,
							strSize.lastIndexOf(".") + 2)
							+ "K");
				} else {
					strSize = ((size * 1.0) / (1024 * 1024)) + "";
					app.setFileSize(strSize.substring(0,
							strSize.lastIndexOf(".") + 2)
							+ "M");
				}
			}
			Subject subject = SecurityUtils.getSubject();
			ShiroUser user = (ShiroUser) subject.getPrincipal();
			if(user!=null){
				app.setSysCode(user.getSysInit().getSysCode());
			}
			Long id = new Long(SYSID.getPrimaryKey());
			app.setId(id);
			service.pushApp(app);
			response.setContentType("text/html;charset=UTF-8");
			response.setHeader("Content-Type", "application/json"); // 处理图片上传代码
			result = true;
			try {
				commonmdb.removeObject(CsosLoginController.getProviderCode()+"_appVersion");
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;
	}

	@RequiresPermissions("app:edit")
	@RequestMapping("/getApp")
	public String getAppById(long id, Model model) {
		AppInfo info = service.getAppById(id);
		model.addAttribute("app", info);
		Map<String, Object> rmap=new HashMap<>();
		rmap.put("sysItem", "whether");
		List<SystemItemDefinePo> slist = systemItemDefineService.getBysysItem(rmap);
		model.addAttribute("slist", slist);
		return "app/edit";
	}

	@MethodLog(key="APP.SAVE")
	@RequiresPermissions("app:update")
	@RequestMapping("/saveApp")
	@ResponseBody
	public boolean updateApp(AppInfo app, MultipartFile mfile,
			HttpServletResponse response) {
		boolean result = false;
		try {
			if (mfile != null && mfile.getSize() > 0) {
				// 处理上传资料【跳转URL
				/*UploadedFile uploadedFile = uploadService
						.uploadFileToUploadDir(uploadFirstSubDir, mfile);
				String url = uploadService.getUploadUrl()
						+ uploadedFile.getReadUrl();*/
				Subject subject = SecurityUtils.getSubject();
		  		ShiroUser shiroUser = (ShiroUser)subject.getPrincipal();
		  		String sysCode = shiroUser.getUser().getSysCode();
		  		String url = ftpAndOssService.uploadLocalFileToOss(uploadFirstSubDir, sysCode, mfile);
				app.setFilePath(url);
				long size = mfile.getSize();
				String strSize;
				if (size < 1024 * 1024) {
					strSize = ((size * 1.0) / (1024)) + "";// 计算文件大小
					app.setFileSize(strSize.substring(0,
							strSize.lastIndexOf(".") + 2)
							+ "K");
				} else {
					strSize = ((size * 1.0) / (1024 * 1024)) + "";
					app.setFileSize(strSize.substring(0,
							strSize.lastIndexOf(".") + 2)
							+ "M");
				}
			}
			service.updateApp(app);
			response.setContentType("text/html;charset=UTF-8");
			response.setHeader("Content-Type", "application/json"); // 处理图片上传代码
			result = true;
			try {
				commonmdb.removeObject(CsosLoginController.getProviderCode()+"_appVersion");
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;
	}

	@MethodLog(key="APP.DELETE")
	@RequiresPermissions("app:delete")
	@RequestMapping("/remove")
	@ResponseBody
	public boolean removeApp(Long[] ids) {
		try {
			commonmdb.removeObject(CsosLoginController.getProviderCode()+"_appVersion");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return service.deleteAppByIds(ids);
	}
	
	@MethodLog(key="APP.ADD")
	@RequiresPermissions("app:add")
	@RequestMapping("/toadd")
	public String toaddApp(Model model) {
		Map<String, Object> rmap=new HashMap<>();
		rmap.put("sysItem", "whether");
		List<SystemItemDefinePo> slist = systemItemDefineService.getBysysItem(rmap);
		model.addAttribute("slist", slist);
		return "app/create";
	}
}
