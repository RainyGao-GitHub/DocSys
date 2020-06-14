# DocSys

DocSys是基于Web的文件管理系统，支持文件权限管理和历史版本管理，支持文件在线预览和在线编辑，支持压缩文件在线解压预览，支持重复文件的秒传和大文件的断点续传，支持文件名和文件内容搜索，支持Markdown格式的文件备注。

主要应用场景：文件管理系统、日志管理系统、网页版SVN仓库、网页版GIT仓库、电子书、软件接口管理系统、远程桌面管理、自动备份软件。

### [立即体验](http://dw.gofreeteam.com) [user: guest/guest]

全平台支持:Linux，Windows，Mac.
![输入图片说明](https://images.gitee.com/uploads/images/2020/0614/223719_03bd18e1_1558129.png "docsys_首页1.png")

开源协议: 采用GPL 2.0协议;
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105551_20a8ac4f_1558129.png "docsys_首页2.png")

仓库列表
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105615_5aa90a26_1558129.png "docsys_仓库列表1.png")

仓库主页
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105650_d4a010aa_1558129.png "docsys_仓库主页1.png")

历史版本
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105708_0888bd30_1558129.png "docsys_仓库主页3.png")

在线编辑
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105732_88ed0a73_1558129.png "docsys_仓库主页2.png")

文件分享
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105757_67ca6763_1558129.png "docsys_仓库主页4.png")

全文搜索
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105917_2ee5c143_1558129.png "docsys_仓库列表2.png")

后台管理
![输入图片说明](https://images.gitee.com/uploads/images/2020/0613/105813_e858feb3_1558129.png "docsys_管理后台1.png")

# 系统安装
## 一、Windows系统安装步骤
### 1、准备工作
#### 下载DocSystem.war
下载地址： https://gitee.com/RainyGao/DocSys/releases
#### 下载JDK
下载地址： https://download.csdn.net/download/highrain/12233906
#### 下载XAMPP
下载地址： https://download.csdn.net/download/highrain/12233724
#### 下载OpenOffice(可选)
下载地址： https://download.csdn.net/download/highrain/12233900
#### 下载并安装OnlyOffice(用于Office在线编辑)
下载地址： https://blog.csdn.net/highrain/article/details/105443177

### 2、安装JDK
请使用JDK或JRE 1.8版本

### 3、安装XAMPP（tomcat和mysql）
（1）安装完成后启动mysql和tomcat
（2）点击tomcat的config按键，选择“Browser”找到webapps目录，将DocSystem.war放到该目录，点击Start启动

### 4、访问

本机访问：http://localhost:8080/DocSystem

远程访问：将localhost改为IP地址即可

## 二、Linux系统安装步骤
### 1、准备工作
#### 下载DocSystem.war
下载地址： https://gitee.com/RainyGao/DocSys/releases
#### 下载JDK
下载地址： https://www.oracle.com/java/technologies/javase-jdk8-downloads.html
#### 下载MYSQL
下载地址： https://www.mysql.com
#### 下载TOMCAT
下载地址： https://tomcat.apache.org/download-70.cgi
#### 下载OpenOffice(可选)
下载地址： https://download.csdn.net/download/highrain/12233901
#### 安装OnlyOffice(用于Office在线编辑)
安装说明：https://helpcenter.onlyoffice.com/server/linux/document/index.aspx

### 2、安装JDK
请使用JDK或JRE 1.8版本

### 3、安装mysql

（1）下载Linux版本的mysql安装包，将其解压到/usr/local/mysql目录即可

（2）启动mysql服务：service mysql start

### 4、安装tomcat

（1）下载Linux版本的tomcat7安装包，将其解压到以下目录/usr/local/tomcat目录即可

（2）将DocSytem.war复制到tomcat的webapps目录

（3）启动tomcat: service tomcat7 start

### 5、访问

本机访问：http://localhost:8080/DocSystem

远程访问：将localhost改为IP地址即可

## 四、在线编辑
具体详见：[DocSys的Office在线编辑配置](https://blog.csdn.net/highrain/article/details/106696474)

## 五、安装常见问题
https://blog.csdn.net/highrain/article/details/88946783

# DocSys技术交流群: 953982034