package com.DocSystem.controller;

import javax.servlet.ServletContext;
import org.apache.log4j.Logger;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.context.ServletContextAware;
  
@Service
public class StartupListener  extends BaseController implements ApplicationContextAware, ServletContextAware, InitializingBean, ApplicationListener<ContextRefreshedEvent> {
 
	private static Logger log = Logger.getLogger(StartupListener.class);
 
	@Override
	public void setApplicationContext(ApplicationContext ctx) throws BeansException {
		log.info("系统启动1 => StartupListener.setApplicationContext");
		System.out.println("系统启动1 => StartupListener.setApplicationContext");
	}
 
	@Override
	public void setServletContext(ServletContext context) {
		log.info("系统启动2 => StartupListener.setServletContext");
		System.out.println("系统启动2 => StartupListener.setServletContext");
	}
 
	@Override
	public void afterPropertiesSet() throws Exception {
		log.info("系统启动3 => StartupListener.afterPropertiesSet");
		System.out.println("系统启动3 => StartupListener.afterPropertiesSet");
	}
 
	@Override
	public void onApplicationEvent(ContextRefreshedEvent evt) {
		if (evt.getApplicationContext().getParent() == null) {
			return;
		}
		log.info(">>>>>>>>>>>>系统启动完成，onApplicationEvent()<<<<<<<<<<<<");
		System.out.println(">>>>>>>>>>>>系统启动完成，onApplicationEvent()<<<<<<<<<<<<");
		
		docSysInit();
	}
}