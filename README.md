# DocSys

> DocSys，是基于Java的Web文件管理系统。旨在为个人和企业用户提供一个简单、方便的文件存储解决方案。用户只需要通过一键安装即可完成系统的部署和搭建。DocSys采用Windows桌面系统和Apple手机用户的操作习惯，操作简单方便，支持文件在线预览，支持使用SVN和GIT进行文件版本管理，支持文件内容全文搜索，支持文件权限管理，支持用户分组管理，支持扩展和定制。

> 全平台支持:Linux，Windows，Mac.
-----
![输入图片说明](https://images.gitee.com/uploads/images/2018/1117/233316_639ed640_1558129.png "1.png")

开源协议: 采用GPL 2.0协议;
![输入图片说明](https://images.gitee.com/uploads/images/2018/1117/233347_2cc1a65f_1558129.png "2.png")

仓库列表
![输入图片说明](https://images.gitee.com/uploads/images/2018/1117/234733_69d967ef_1558129.png "6.png")

仓库详情
![输入图片说明](https://images.gitee.com/uploads/images/2018/1117/234744_2850feb3_1558129.png "7.png")

历史版本
![输入图片说明](https://images.gitee.com/uploads/images/2018/1119/095414_fba9ce48_1558129.png "8.png")

### [立即体验](http://dw.gofreeteam.com) [user: guest/guest]

# 系统安装
## 一、准备工作
### 1、下载DocSystem.war
下载地址： dw.gofreeteam.com/DocSystem/web/project.html?vid=4&doc=33
### 2、DocSystem.war配置文件修改
将DocSystem.war重命名为DocSystem.zip文件，进入zip文件的WEB-INF/classes/目录，修改以下两个配置文件，修改完成后改为DocSystem.war：
(1) 数据库配置：jdbc.properties
- 数据库访问地址
- 数据库访问用户

(2) 系统配置：docSysConfig.properties
- 邮件服务配置
- 短信服务配置
- openOffice路径配置
- lucene全文搜索存储路径配置

## 二、Windows系统安装步骤
### 1、安装JDK
请使用JDK或JRE 1.8版本
###3、安装OpenOffice（Office文件预览）
请将OpenOffice安装在以下目录：
C:\Program Files (x86)\OpenOffice 4\
### 2、安装XAMPP（tomcat和mysql）
安装完成后启动Apache、mysql和tomcat
(1) 点击mysql的admin进入mysql的管理页面，新增数据库docsystem，并导入docsystem.sql以初始化数据库的表结构
(2) 点击tomcat的config按键，选择“<Browser>”找到webapps目录，将DocSystem.war放到该目录，点击Start启动
### 3、访问
本机访问：
http://localhost:8080/DocSystem
远程访问：
将localhost改为IP地址即可

## 三、Linux系统安装步骤
### 1、安装JDK
请使用JDK或JRE 1.8版本
### 2、安装OpenOffice（Office文件预览）
请将OpenOffice安装在以下目录：
"/opt/openoffice.org3"
### 3、安装mysql并初始化数据库
（1）下载Linux版本的mysql安装包，将其解压到/usr/local/mysql目录即可
（2）启动mysql服务：service mysql start
（3）使用命令行新建docsystem数据库并导入docsystem.sql文件
### 4、安装tomcat
（1）下载Linux版本的tomcat7安装包，将其解压到以下目录/usr/local/tomcat目录即可
（2）将DocSytem.war复制到tomcat的webapps目录
（3）启动tomcat: service tomcat7 start
### 5、访问
本机访问：
http://localhost:8080/DocSystem
远程访问：
将localhost改为IP地址即可

### DocSys技术交流群: 953982034