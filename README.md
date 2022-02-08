# MxsDoc

MxsDoc是基于Web的文件管理系统，支持权限管理、历史版本管理、Office编辑、Office预览、在线解压缩、文件分享、文件加密、远程存储、跨仓库推送、跨服务器推送、秒传、断点续传、智能搜索、文件备注、本地自动备份、异地自动备份、一键迁移。

主要应用场景：文件管理系统、文档安全管理系统、分布式文档管理系统、协同办公系统、电子书、软件接口管理系统、自动备份软件、网页版SVN仓库、网页版GIT仓库、FTP客户端、SFTP客户端、SMB客户端、Linux系统远程文件访问。

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

# 系统安装与升级
### 一、系统安装
#### 1、下载[一键安装包](https://github.com/RainyGao-GitHub/DocSys/releases)

#### 2、安装
（1）解压系统安装包至本地目录

（2）运行start脚本启动系统

 **注意：** 本地目录不得包含空格和中文

#### 3、访问
本机访问：http://localhost:8100/DocSystem

远程访问：将localhost改为IP地址即可

### 二、系统升级
#### 1、下载[DocSystem.war](https://github.com/RainyGao-GitHub/DocSys/releases)

#### 2、升级
（1）运行stop脚本停止系统

（2）备份tomcat/webapps/DocSystem/WEB-INF/classes/jdbc.properties

（3）删除tomcat/webapps/DocSystem目录

（4）将DocSystem.war解压至tomcat/webapps/DocSystem目录

（5）替换tomcat/webapps/DocSystem/WEB-INF/classes/jdbc.properties

（6）运行start脚本启动系统


# 限制与价格
### 限制
| 功能限制       |   社区版      | 个人版         | 专业版        | 企业版         |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| 价格          | 免费           | 免费          | [购买](http://dw.gofreeteam.com/DocSystem/web/sales/select.html) | [购买](http://dw.gofreeteam.com/DocSystem/web/sales/select.html) |
| 文件管理功能   | +             |     +         |       +       |     +         |
| 用户管理功能   | +             |     +         |       +       |     +         |
| 历史版本功能   | +             |     +         |       +       |     +         |
| 文件备注功能   | +             |     +         |       +       |     +         |
| 全文搜索功能   | +             |     +         |       +       |     +         |
| 文件分享功能   | +             |     +         |       +       |     +         |
| 在线解压功能   | +             |     +         |       +       |     +         |
| 文本文件预览   | +             |     +         |       +       |     +         |
| 文本文件编辑   | +             |     +         |       +       |     +         |
| 跨仓库推送功能 | +             |     +         |       +       |     +         |
| 跨服务器推送功能 | +             |     +         |       +       |     +         |
| Office文件预览 | -             |     +         |       +       |     +         |
| Office文件编辑 | -             |     +         |       +       |     +         |
| 日志管理功能   | -             |     +         |       +       |     +         |
| 远程存储功能 | -             |      +         |       -       |     +         |
| 本地自动备份 | -             |      +         |       -       |     +         |
| 异地自动备份 | -             |      +         |       -       |     +         |
| 文件加密功能   | -             |     +         |       -       |     +         |
| LDAP单点登录   | -             |     -         |       -       |     +         |
| 用户限制       | 无            |     5人       |    购买    |    购买   |
| 售后服务       | 无            |     无         |       无       |     一年      |

### 商业版价格
#### 专业版价格
|有效期/用户数量 |   20人           |     50人      |    100人      |     200人     |    500人      |    不限       |
| ------------- | --------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| 长期          |        980元     |    1580元      |    2580元     |     3580元    |    5000元     |   7500元      |

#### 企业版价格
|有效期/用户数量 |   20人           |     50人      |    100人      |     200人     |    500人      |    不限       |
| ------------- | --------------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| 长期          |        7500元     |    9500元      |    12500元     |     18500元    |    26500元     |   35000元      |

# 技术咨询与购买 
## 购买与咨询 请加群 : 953982034


# 常见问题
### 一、二次开发如何集成商业版功能

#### 1、编译开源版本 DocSystem.war

#### 2、下载对应的商业版本[DocSystem.war](https://github.com/RainyGao-GitHub/DocSys/releases)

#### 3、集成商业版功能

复制商业版本中的 DocSystem\web\static\office-editor 和 DocSystem\WEB-INF\classes\com\DocSystem\websocket 目录到开源版本对应的目录

### 二、使用自定义mysql数据库无法登录

#### 1、手动创建数据库

#### 2、触发数据库初始化

删除docSys.ini/version文件，重启MxsDoc

### 三、Linux系统war包直接部署Office无法预览和编辑

#### 1、手动创建DocSystem目录

解压 DocSystem.war 到 tomcat\webapps\DocSystem 目录

#### 2、手动安装动态库

复制 DocSystem\web\static\office-editor\libs\Linux 目录下的所有动态库到 /usr/lib64 目录

#### 3、重启MxsDoc

### 四、Windows系统Office无法预览和编辑

#### 1、检查系统缺少的动态库并修复

双击运行 DocSystem\web\static\office-editor\bin\documentserver-generate-allfonts.bat ，根据报错提示确定需要修复的动态库

### 五、Linux系统Excel在线编辑退出后，修改内容丢失

#### 1、安装字体库

yum -y install fontconfig

#### 2、添加中文字体

将 C:/Windows/Fonts 字体文件复制到 /usr/share/fonts 目录

#### 3、生成 fonts.scale 文件

yum -y install ttmkfdir 

#### 4、刷新字体缓存

fc-cache

#### 5、重新生成office字体库

运行  DocSystem\web\static\office-editor\bin\documentserver-generate-allfonts.sh 

### 六、Linux系统中文乱码

#### 1、查看当前使用的系统语言

echo $LANG

#### 2、查看是否已安装有中文语言包

locale

如有 zh cn 表示已经安装了中文语言

#### 3、安装中文语言包

yum groupinstall chinese-support

#### 4、修改系统默认语言

vi  /etc/sysconfig/i18n

修改为 LANG="zh_CN.UTF-8" 并重启系统

### 七、什么是分布式远程存储

1、仓库文件可以存储在远程文件服务器（FTP/SFTP/SMB/SVN/GTI/MXSDOC）

2、在当前仓库可查看远程文件服务器文件

3、可将当前仓库文件推送到远程服务器

4、可将远程服务器文件拉取到当前仓库

5、仓库可以独立于远程文件服务器进行文件操作和版本管理

### 八、什么是文件服务器前置

1. 设置为文件服务器前置的仓库，可以作为的文件服务器的客户端使用，

2. 在该仓库页面上，能够查看和操作文件服务器（FTP/SFTP/SMB/SVN/GTI/MXSDOC）上的文件和目录

### 九、如何使用MxsDoc作为自动备份工具

1. 新建仓库

2. 设置文件存储路径，自定义为需要备份的目录

3. 设置自动备份

（1）本地自动备份需要指定本地备份目录

（2）异地自动备份需要指定备份的文件服务器（目前支持FTP/SFTP/SMB/SVN/GTI/MXSDOC）

（3）根据自己需求勾选备份时间

### 十、Windows的共享文件夹无法远程访问

1. 打开控制面板-->程序和功能-->启用或关闭windows功能-->勾选SMB 1.0/CIFS文件共享支持

2. 重启系统

### 十一、日志获取

1. Windows系统：用startWithLog.bat启动，日志在docsys/logs目录

2. Linux系统： start.sh > docSys.log

3. 设置日志等级：管理后台 -> 系统设置 -> 日志等级 -> debug