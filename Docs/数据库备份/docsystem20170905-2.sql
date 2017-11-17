-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2017 年 09 月 05 日 09:47
-- 服务器版本: 5.5.16
-- PHP 版本: 5.3.8

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `docsystem`
--

-- --------------------------------------------------------

--
-- 表的结构 `doc_auth`
--

CREATE TABLE IF NOT EXISTS `doc_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) NOT NULL,
  `DOC_ID` int(11) NOT NULL,
  `REPOS_ID` int(11) NOT NULL,
  `ACCESS` int(2) NOT NULL DEFAULT '0' COMMENT '0:不可见  1:只读',
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `repos_auth`
--

CREATE TABLE IF NOT EXISTS `repos_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) DEFAULT NULL,
  `REPOS_ID` int(11) DEFAULT NULL,
  `ACCESS` int(2) DEFAULT NULL,
  `EDIT_EN` int(2) DEFAULT NULL,
  `ADD_EN` int(2) DEFAULT NULL,
  `DELETE_EN` int(2) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- 转存表中的数据 `repos_auth`
--

INSERT INTO `repos_auth` (`ID`, `USER_ID`, `REPOS_ID`, `ACCESS`, `EDIT_EN`, `ADD_EN`, `DELETE_EN`) VALUES
(1, 1, 40, 2, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `role`
--

CREATE TABLE IF NOT EXISTS `role` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(50) CHARACTER SET utf8 NOT NULL,
  `ROLE_ID` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `sys_config`
--

CREATE TABLE IF NOT EXISTS `sys_config` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',
  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(40) DEFAULT NULL,
  `PWD` varchar(40) NOT NULL,
  `TYPE` int(1) DEFAULT NULL COMMENT '账户类型：保留',
  `ROLE` int(11) DEFAULT NULL COMMENT '角色ID',
  `REAL_NAME` varchar(50) DEFAULT NULL,
  `NICK_NAME` varchar(50) DEFAULT NULL COMMENT '昵称',
  `INTRO` longtext,
  `IMG` varchar(200) DEFAULT NULL,
  `EMAIL` varchar(50) DEFAULT '',
  `EMAIL_VALID` int(1) NOT NULL DEFAULT '0' COMMENT '邮箱是否已验证',
  `TEL` varchar(20) DEFAULT NULL,
  `TEL_VALID` int(1) NOT NULL DEFAULT '0',
  `LAST_LOGIN_TIME` varchar(50) DEFAULT NULL,
  `LAST_LOGIN_IP` varchar(50) DEFAULT NULL,
  `LAST_LOGIN_CITY` varchar(100) DEFAULT NULL,
  `CREATE_TYPE` int(1) NOT NULL DEFAULT '0' COMMENT '0:管理员创建  1:用户注册',
  `CREATE_TIME` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `id` (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- 转存表中的数据 `user`
--

INSERT INTO `user` (`ID`, `NAME`, `PWD`, `TYPE`, `ROLE`, `REAL_NAME`, `NICK_NAME`, `INTRO`, `IMG`, `EMAIL`, `EMAIL_VALID`, `TEL`, `TEL_VALID`, `LAST_LOGIN_TIME`, `LAST_LOGIN_IP`, `LAST_LOGIN_CITY`, `CREATE_TYPE`, `CREATE_TIME`) VALUES
(1, '652055239@qq.com', 'e10adc3949ba59abbe56e057f20f883e', 1, NULL, NULL, NULL, NULL, NULL, '652055239@qq.com', 1, NULL, 0, NULL, NULL, NULL, 1, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `wiki_doc`
--

CREATE TABLE IF NOT EXISTS `wiki_doc` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `CONTENT` longtext COMMENT '文章内容',
  `PATH` varchar(1000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `PID` int(10) unsigned DEFAULT NULL COMMENT 'Parent Node id',
  `VID` int(10) unsigned DEFAULT NULL COMMENT '所属仓库id',
  `PWD` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1156 ;

--
-- 转存表中的数据 `wiki_doc`
--

INSERT INTO `wiki_doc` (`ID`, `NAME`, `TYPE`, `CONTENT`, `PATH`, `PID`, `VID`, `PWD`) VALUES
(363, 'DocSys-后台Doc操作接口', 1, '#DocSys-后台Doc操作接口\n1、@RequestMapping("/addDoc.do")  //文件名、文件类型、所在仓库、父节点\n	public void addDoc(String name,Integer type,Integer reposId,Integer parentId,HttpServletRequest request,HttpServletResponse response)\n2、@RequestMapping("/uploadDoc.do")\n	public void uploadDoc(MultipartFile uploadFiles,Integer reposId, Integer parentId, HttpServletResponse response,HttpServletRequest request,HttpSession session)\n3、@RequestMapping("/downloadDoc.do")\n	public void downloadDoc(Integer id,HttpServletResponse response,HttpServletRequest request,HttpSession session)\n4、@RequestMapping("/deleteDoc.do")\n	public void deleteDoc(Integer id,HttpServletRequest request,HttpServletResponse response)\n5、@RequestMapping("/renameDoc.do")\n	public void renameDoc(Integer id,String newname,HttpServletRequest request,HttpServletResponse response)\n6、@RequestMapping("/moveDoc.do")\n	public void moveDoc(Integer id,Integer dstPid,HttpServletRequest request,HttpServletResponse response)\n7、@RequestMapping("/copyDoc.do")\n	public void copyDoc(Integer id,Integer dstPid,String newname,HttpServletRequest request,HttpServletResponse response)\n8、@RequestMapping("/getDoc.do")\n	public void getDoc(Integer id,HttpServletRequest request,HttpServletResponse response)\n9、@RequestMapping("/getDocContent.do")\n	public void getDocContent(Integer id,HttpServletRequest request,HttpServletResponse response)\n10、@RequestMapping("/updateDocContent.do")\n	public void updateDocContent(Integer id,String content,HttpServletRequest request,HttpServletResponse response)', '/后台接口定义/', 598, 7, ''),
(364, 'DocSys-后台Repos操作接口', 1, '#后台Repos操作接口定义', '/后台接口定义/', 598, 7, ''),
(416, '文件上传', 1, '#文件和文件夹上传\n一、文件上传\n1、前台\n（1）如果同名文件已存在需要提示是否覆盖，需要通过参数id来告诉后台是新建还是覆盖操作\n（2）多个文件上传的处理\n需要顺序将文件上传至后台\n2、后台\n接口：uploadDoc.do\n参数：uploadFile,uploadType,reposId,parentId,id\n根据参数uploadType来确定是覆盖还是新建\n新建：如果文件已经存在，则不需要新建文件；新增doc记录，返回doc记录列表，否则返回错误信息\n覆盖：覆盖成功后，返回doc记录，否则返回错误\n\n参考资料：\nhttps://lujunyi.fullstack.club:444/FileServer/web/', '/已完成任务/', 511, 7, ''),
(417, '待完成任务', 2, '#待完成任务', '/', 0, 7, ''),
(418, '文件夹上传', 1, '#上传文件夹\n\n二、文件夹上传\n1、前台\n（1）需要解析目录结构，发送目录新建请求到后台\n（2）文件上传部分处同文件上传\n2、后台\n（1）新建目录接口\n（2）文件上传接口', '/待完成任务/', 417, 7, ''),
(419, '移动', 1, '#文件移动\n1、前台\n（1）同一目录下移动，只更新后台节点信息，不需要实际更新后台文件位置\n（2）不同目录下移动，需要一次调用moveDoc来移动后台文件位置，单个成功后更新前台节点信息，全部成功后才更新后台节点信息：\n风险：当某个文件操作失败，会导致后台的节点数据不更新，因此出错时需要更加所有的doc记录来还原后台节点数据，并同步前台节点数据\n每次更新后台数据前，需要确认后台节点数据与前台节点数据一致，如果不一致需要从后台来还原节点数据，并同步前台节点数据，因为前台节点数据已经不正确了。\n2、后台\n接口：moveDoc.do\n参数：id,pId,vid\n目标目录下有相同名称的文件，则不移动\n移动文件成功后更新Doc记录（pid）', '/已完成任务/', 511, 7, ''),
(420, '复制', 1, '#文件复制\n1、前台\n（1）同目录下不能复制\n（2）如果是复制目录，在开始copyDocs之前，需要把所有子节点的数据都加入到treeNodes里面去，顺序必须是先父节点后子节点；由于新的子节点的parentID根父节点不一样，所以处理时需要注意\n2、后台\ncopyDoc.do\n对于文件直接进行复制\n对于目录则只是新建一个相同名的目录；\n也可以考虑对于目录进行递归复制，好处是前台不需要处理子节点，坏处就是前后台之间的逻辑关系会变复杂', '/已完成任务/', 511, 7, ''),
(437, '文件编辑', 1, '#编辑\n1、编辑文件信息的时候，不要重新加载页面，否则会出现文件没被选中的情况，容易产生误解\n2、有特殊字符会出错', '/待完成任务/', 417, 7, ''),
(476, '重命名', 1, '#重命名\n1、前台\n不得与当前目录下的其他文件同名\n2、后台\n接口：renameDoc.do\n参数：\n     Integer id\n     String newname\n实现：', '/已完成任务/', 511, 7, ''),
(477, '删除', 1, '#删除\n1、前台\n（1）文件则，提示用户是否删除；\n（2）如果目录非空需要再次提示，目录非空是否删除；\n2、后台\n接口：deleteDoc.do\n参数：id\n实现：\n（1）如果是文件直接删除\n（2）如果是目录则递归删除，如果中间出错则提示那个文件删除失败', '/已完成任务/', 511, 7, ''),
(478, '下载', 1, '#下载\n1、目录下载正常\n2、图片下载会导致打开文件\n\n参考资料：\nhttp://blog.csdn.net/meandmyself/article/details/42149623', '/待完成任务/', 417, 7, ''),
(511, '已完成任务', 2, '#已完成任务', '/', 0, 7, ''),
(546, 'BUGList', 2, '#BUGList', '/', 0, 7, ''),
(547, '文件移动', 1, '#文件移动\n1、文件移动后台数据修改成功，但前台的tree显示不正确\n后台提示已经移动到了根节点上，但前台显示还是在原理位置上\n\n状态：已解决\n问题原因：原因是拖到节点前面或后面时的parentNode是不一样的，是后台逻辑出错造成的', '/BUGList/', 546, 7, ''),
(576, '新建文件和文件夹', 1, '#新建文件和文件夹\n1、前台\n新建时需要在前台检查是否已经存在同名的文件或目录\n2、后台 \n接口：addDoc.do\n参数：name,type,parentId,vid,\n（1）根据所在仓库和父节点的信息计算实际存储路径，新建对应name的文件或目录，type=2是目录，type=1是文件\n（2）如果文件已经存在则新建失败，这是为了避免在新建时，其他人已经先一步新建了文件\n11122', '/已完成任务/', 511, 7, ''),
(577, '获取文件异常', 1, '#获取文件异常\n在文件中添加的内容包含特殊字符，数据库存储正常，但获取回来就出错了\n\n原因分析：\n特殊字符，导致报文格式不正确', '/BUGList/', 546, 7, ''),
(578, '文件名特殊字符错误', 1, '#文件名特殊字符错误\n文件名包含特殊字符时，后台无法正常创建文件，因此在创建文件时需要进行名字检查', '/BUGList/', 546, 7, ''),
(580, 'zTree新建节点后有问题', 1, '#zTree新建节点后有问题\n凡是更改过zTree节点的，发现zTree无法收齐，而且移动和复制没法用ctrel进行多选', '/BUGList/', 546, 7, ''),
(581, '删除无法多个文件删除', 1, '#删除无法多个文件删除', '/BUGList/', 546, 7, ''),
(582, '目录复制时问题', 1, '#目录复制时问题\n1、目录复制时，后台不知道目录下还有子节点，前台的子节点数据估计也不正确\n\n原因分析：\n1、后台没有判断当前节点是否是目录，导致按照文件来复制，因此复制失败\n2、如果是目录进行复制的话，由于后台的实际目录下是有东西的，所以需要递归来复制，对于目录实际是新建对应的目录，对于文件才进行复制，那么问题是如何解决前台节点的id问题呢', '/BUGList/', 546, 7, ''),
(588, '名字过长显示不下', 1, '#名字过长显示不下\n\n目录区域需要可放大和瘦小', '/BUGList/', 546, 7, ''),
(595, 'FileServer', 1, '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>文件上传测试页</title>\n</head>\n<body>\n\n<img src="" id="show">\n\n<input type="file" id="in">\n<button onclick="up()" >base64 格式上传</button>\n\n<script type="application/javascript" src="jquery.js"></script>\n<script type="application/javascript">\n    /**\n     * 回调函数\n     * @param image_base64\n     */\n    var callback = function(image_base64) {\n        $.post(''../upload/'', {\n            file: image_base64\n        }, function (ret) {\n            alert("ok")\n            console.log(ret)\n        }, function (e) {\n            alert("err")\n            console.log(e)\n        });\n    }\n\n    /**\n     * 头像选择触发事件\n     */\n    function up() {\n        fileUpload(document.getElementById("in").files[0], callback);\n    };\n\n    /**\n     * 将文件转成base64\n     * @param obj\n     * @param callback\n     * @returns {boolean}\n     */\n    var fileUpload = function(obj, callback){\n        var file = obj;\n        var reader = new FileReader();\n        reader.readAsDataURL(file);\n        reader.onload = function(e){\n            callback && callback(e.target.result);\n        };\n    }\n</script>', '/参考资料/', 597, 7, ''),
(597, '参考资料', 2, '#参考资料', '/', 0, 7, ''),
(598, '后台接口定义', 2, '#后台接口定义', '/', 0, 7, ''),
(826, 'APPStore上线指导.docx', 1, '#APPStore上线指导.docx\n1、	准备工作（账号注册）\na)	注册AppleID\nb)	申请Apple Developer\n2、	准备工作（生成应用）\n苹果APP发布需要：APP IDs\\证书文件\\描述文件；APP IDs是用来描述要发布的APP的；证书的生成需要用到APP IDs信息；描述文件生成需要用到APP IDs和证书文件；\n申请的次序是APP IDs、证书文件、描述文件。\n2.1 APP IDs申请\nAPP IDs申请是不需要苹果电脑的，按说明申请即可。\n2.2证书文件(发布证书)\n发布证书生成需要用到CSR文件（钥匙串文件），所以需要先生成一个CSR文件；\n（1）	在MAC电脑上生成CSR文件，选择保存到本地磁盘，填写邮箱信息（我直接用的AppleID对应的邮箱，反正是可以的），保存到本地。\n（2）	在苹果开发者网站（Account/Certificates页面）申请证书（类型为 App Store and Ad Hoc），按照提示执行即可，申请成功后下载到本地，双击文件加入到本地证书里。\n（3）	将Cer文件导成p12文件\nCer文件只可以自己用，要导成p12文件，才能在其他设备上使用。\nFilnder 实用工具钥匙串管理我的证书在Cer上点击鼠标右键，显示出快捷菜单，选择导出，设置导出文件的密码（GoFree2016），导出p12文件。\n2.3 描述文件(ProvisioningProfiles)\n在苹果开发者网站（Account/Certificates页面）申请描述文件（类型为 App Store），按步骤执行然后下载到本地就可以了。\n\n3、	APP上线申请\n3.1 创建APP\na)	登陆https://developer.apple.com\nb)	连接iTunes Connect\n \nc)	点击进入 我的APP\nd)	点击 + 开始新建APP\n提示：您没有适用于 iOS App 的合格套装 ID。是因为没有申请APP IDs.\na)	新建APP\n \n提示：名称被占用，怎么办，是被我的另一个帐号占用了吗？确实是，哈哈哈，所以我把名字改成了freeteam先占用着再说。\nb)	设置生效时间和价格\nc)	设置APP信息  包括版本号，所有权\n3.2 上传应用\n（1）使用XCode生成目标文件（如果是云端打包，则只要将证书上传到云端服务器即可）\n（2）使用Application Loader上传（XCode里面自带这个程序，已经下载了XCode就不用下载了），如果上传了但itunes connect里面看不到，建议先查看一下苹果给这个邮箱发送的邮件，如果有问题可以参考 常见问题章节。\n（3）登陆itunes connect选择Build，并申请发布即可。\n3.3 APP用testlighter进行测试\n使用TestFlight beta testing，可以对准备上线的APP进行预测；但前提是你必须先把Build先上传成功。具体方法如下：\n\n4、	常见问题: \n4.1 Application Loader提示上传成功，但itunes connect中看不到\n收到如下邮件：\nDear developer,\nWe have discovered one or more issues with your recent delivery for "自由团队". To process your delivery, the following issues must be corrected:\nMissing Info.plist key - This app attempts to access privacy-sensitive data without a usage description. The app''s Info.plist must contain an NSPhotoLibraryUsageDescription key with a string value explaining to the user how the app uses this data.\nMissing Info.plist key - This app attempts to access privacy-sensitive data without a usage description. The app''s Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data.\nThough you are not required to fix the following issues, we wanted to make you aware of them:\nMissing Push Notification Entitlement - Your app appears to register with the Apple Push Notification service, but the app signature''s entitlements do not include the "aps-environment" entitlement. If your app uses the Apple Push Notification service, make sure your App ID is enabled for Push Notification in the Provisioning Portal, and resubmit after signing your app with a Distribution provisioning profile that includes the "aps-environment" entitlement. Xcode 8 does not automatically copy the aps-environment entitlement from provisioning profiles at build time. This behavior is intentional. To use this entitlement, either enable Push Notifications in the project editor''s Capabilities pane, or manually add the entitlement to your entitlements file. For more information, see https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/HandlingRemoteNotifications.html#//apple_ref/doc/uid/TP40008194-CH6-SW1.\nOnce the required corrections have been made, you can then redeliver the corrected binary.\nRegards,\nThe App Store team\n原因与解决方案：\niOS 10 开始对隐私权限更加严格, 如需使用隐私权限需要在工程的info.plist文件中声明,如果不声明程序在调用隐私权限（如相机）时应用程序会崩溃\n离线打包用户需要手动添加权限到打包工程的info.plist文件中\n \nkey可从以下表中获取，value为弹框提示文字用户可随意添加，类型String\n权限名称	Key值\n通讯录	NSContactsUsageDescription\n麦克风	NSMicrophoneUsageDescription\n相册	NSPhotoLibraryUsageDescription\n相机	NSCameraUsageDescription\n持续获取地理位置	NSLocationAlwaysUsageDescription\n使用时获取地理位置	NSLocationWhenInUseUsageDescription\n蓝牙	NSBluetoothPeripheralUsageDescription\n语音转文字	NSSpeechRecognitionUsageDescription\n日历	NSCalendarsUsageDescription\n 6 赞分享\n8 个评论\n \n云海帆\n请问在线打包如何配置？谢谢\n0 赞2016-10-29 09:46\n \ngadget2k\n云打包需要考虑这个事情吗？\n0 赞2017-01-25 19:36\n \nDCloud_SDK_骁骑\n云打包不需要考虑这个\n0 赞2017-02-04 15:12\n \ntodaynothing@163.com 回复 DCloud_SDK_骁骑\n可是苹果给我发邮件说缺少一些info字段\n0 赞2017-03-09 20:08\n \ntodaynothing@163.com\nThe app''s Info.plist must contain an NSContactsUsageDescription key with a string value explaining to the user how the app uses this data.\n0 赞2017-03-09 20:11\n \n419569317@qq.com\n同问，我是云端打包的，同样收到邮件了Missing Info.plist key - This app attempts to access privacy-sensitive data without a usage description. The app''s Info.plist must contain an NSContactsUsageDescription key with a string value explaining to the user how the app uses this data.\n0 赞2017-03-11 16:28\n \n卿山 回复 todaynothing@163.com\n打包时在【manifest.json】——【模块权限配置】中添加【通讯录】权限。\n0 赞2017-03-16 09:40\n \n卿山 回复 419569317@qq.com\n打包时在【manifest.json】——【模块权限配置】中添加【通讯录】权限。\n0 赞2017-03-16 09:42\nAPPCAN解决方案\ncase 隐私权限未配置:\n\n症状: ApplicationLoader反馈中有1条或多条类似如下字段(其中标红的key可能会变化)\nThis app attempts to access privacy-sensitive data without a usage description. The app''s Info.plist must contain an NSBluetoothPeripheralUsageDescription key with a string value explaining to the user how the app uses this data.\n\n解决方法:\n\n根据标红的key，在文档http://newdocx.appcan.cn/newdocx/docx?type=1812_1291中找到缺失的隐私权限\n在config.xml中进行相应的配置\n比如上如字段中标红的key为NSBluetoothPeripheralUsageDescription 对应为蓝牙权限\n则需要在config.xml中添加\n1.	<config desc="privacyConfig" type="AUTHORITY">\n2.	    <permission platform="iOS" info="privacy" type="bluetooth">\n3.	        <string>appcan需要使用蓝牙模块</string>\n4.	    </permission>\n5.	</config>\n复制代码\n<string>字段内容会展示给用户的,请根据自己的app进行填写,不能为空!\n\nps: uexDevice这个插件目前由于拥有检测蓝牙是否打开的功能，所以会需要蓝牙权限. \nps2 : 我们正在考虑将此接口移至uexBluetoothLE中...\n\n\ncase APNs未配置:\n\n症状: ApplicationLoader反馈中有如下字段\nMissing Push Notification Entitlement - Your app includes an API for Apple''s Push Notification service, but the aps-environment entitlement is missing from the app''s signature. To resolve this, make sure your App ID is enabled for push notification in the Provisioning Portal. Then, sign your app with a distribution provisioning profile that includes the aps-environment entitlement. This will create the correct signature, and you can resubmit your app. See "Provisioning and Development" in the Local and Push Notification Programming Guide for more information. If your app does not use the Apple Push Notification service, no action is required. You may remove the API from future submissions to stop this warning. If you use a third-party framework, you may need to contact the developer for information on removing the API.\nOnce the required corrections have been made, you can then redeliver the corrected binary.\n\n何时需要配置APNs:\nconfig.xml里需要配置APNs 当且仅当 在苹果开发者中心中的appid里开启了apns功能\n\n如何配置:\n见文档http://newdocx.appcan.cn/newdocx/docx?type=1812_1291  末尾\n\n如果还是报错:\n可能是你的mobileprovision文件过旧,去开发者中心重新下载一个再打包试试\n\n\n\n附录：\n1、申请APP IDs:\n应该就是需要申请一个APP IDs，按下面步骤做完，然后就可以新建了。 （freeteam  com.gofreeteam.freeteam）\n \n \n \n \n\n2、	申请发布证书\n1 创建CSR文件\n1.1 打开电脑中的钥匙串\n   \n1.2 选择导航栏中下面的选项\n   \n1.3 然后输入用户邮箱，名字，选择保存到硬盘。\n  \n2 创建发布证书\n2.1 选择App Store\n   \n2.2 上传刚刚创建的CSR文件\n   \n2.3 上传后证书创建成功，下载到本地。\n   \n2.4 双击该文件，加入到钥匙串中。\n\n3、	申请描述文件\n\n3.1 选择APP Store                              \n   \n3.2 选择App ID\n  \n \n3.3 选择证书\n   \n3.4 命名\n   \n3.5 最后提交后下载ProvisioningProfiles文件到本地，双击打开添加到Xcode中。', '/', 0, 18, ''),
(883, 'test.rar', 1, '#test.rar', '/', 0, 17, ''),
(884, '文件上传1.png', 1, '#文件上传1.png', '/', 0, 17, ''),
(885, '文件上传2.png', 1, '#文件上传2.png', '/', 0, 17, ''),
(886, '文件上传3.png', 1, '#文件上传3.png', '/', 0, 17, ''),
(887, '文件上传4.png', 1, '#文件上传4.png', '/', 0, 17, ''),
(888, 'add.jsp', 1, '#add.jsp', '/', 0, 17, ''),
(889, 'AppController', 1, '#AppController.java\n\n1111', '/', 0, 17, ''),
(890, 'create.jsp', 1, '#create.jsp', '/', 0, 17, ''),
(891, 'XHR——XMLHttpRequest对象 - gaojun - 博客园.pdf', 1, '#XHR——XMLHttpRequest对象 - gaojun - 博客园.pdf', '/456/', 897, 17, ''),
(892, '新建仓库', 1, '#新建仓库\n\n仓库新建时没有新建目录', '/BUGList/', 546, 7, ''),
(893, '122223', 1, '#122223\n\nd\nd\nd\nd\nd\nd', '/', 0, 16, ''),
(894, '11222', 1, '#11222', '/122223', 893, 16, ''),
(895, 'HP_LJ_M605_PCL6_Print_Driver_no_Installer_15187.exe', 1, '#HP_LJ_M605_PCL6_Print_Driver_no_Installer_15187.exe', '/456/', 897, 17, NULL),
(897, '456', 2, '#456', '/', 0, 17, NULL),
(899, 'AppController.java', 1, '#AppController.java', '/456/', 897, 17, NULL),
(900, 'create.jsp', 1, '#create.jsp', '/456/', 897, 17, NULL),
(903, '1235', 2, '#1235', '/456/', 897, 17, NULL),
(904, 'java实现svn，svnkit框架的简单应用 - 曾经沧海难为水的博客 - CSDN博客.pdf', 1, '#java实现svn，svnkit框架的简单应用 - 曾经沧海难为水的博客 - CSDN博客.pdf', '/', 0, 26, NULL),
(905, '1111111111111111111111', 1, '#1111111111111111111111', '/', 0, 40, NULL),
(907, 'ChequePrint.cpp', 1, '#ChequePrint.cpp', '/', 0, 40, NULL),
(908, 'ChequePrint.dsp', 1, '#ChequePrint.dsp', '/', 0, 40, NULL),
(909, 'ChequePrint.dsw', 1, '#ChequePrint.dsw', '/', 0, 40, NULL),
(910, 'ChequePrint.h', 1, '#ChequePrint.h', '/', 0, 40, NULL),
(911, 'ChequePrint.ncb', 1, '#ChequePrint.ncb', '/', 0, 40, NULL),
(912, 'ChequePrint.opt', 1, '#ChequePrint.opt', '/', 0, 40, NULL),
(913, 'ChequePrint.plg', 1, '#ChequePrint.plg', '/', 0, 40, NULL),
(914, 'ChequePrint.positions', 1, '#ChequePrint.positions', '/', 0, 40, NULL),
(915, 'ChequePrint.sdf', 1, '#ChequePrint.sdf', '/', 0, 40, NULL),
(916, 'ChequePrint.sln', 1, '#ChequePrint.sln', '/', 0, 40, NULL),
(920, 'ChequePrint.vcxproj.user', 1, '#ChequePrint.vcxproj.user', '/', 0, 40, NULL),
(921, 'INIFileHelper.cpp', 1, '#INIFileHelper.cpp', '/', 0, 40, NULL),
(922, 'INIFileHelper.h', 1, '#INIFileHelper.h', '/', 0, 40, NULL),
(923, 'LogHelper.cpp', 1, '#LogHelper.cpp', '/', 0, 40, NULL),
(924, 'LogHelper.h', 1, '#LogHelper.h', '/', 0, 40, NULL),
(925, 'SNMPOIDINC.CPP', 1, '#SNMPOIDINC.CPP', '/', 0, 40, NULL),
(926, 'SNMPOIDINC.H', 1, '#SNMPOIDINC.H', '/', 0, 40, NULL),
(927, 'chequeprint-d6078e5e.ipch', 1, '#chequeprint-d6078e5e.ipch', '/', 0, 40, NULL),
(928, 'FTPTEST.APS', 1, '#FTPTEST.APS', '/', 0, 40, NULL),
(929, 'FTPTEST.clw', 1, '#FTPTEST.clw', '/', 0, 40, NULL),
(930, 'FTPTEST.cpp', 1, '#FTPTEST.cpp', '/', 0, 40, NULL),
(931, 'FTPTEST.dsp', 1, '#FTPTEST.dsp', '/', 0, 40, NULL),
(932, 'FTPTEST.dsw', 1, '#FTPTEST.dsw', '/', 0, 40, NULL),
(933, 'FTPTEST.h', 1, '#FTPTEST.h', '/', 0, 40, NULL),
(934, 'FTPTEST.ncb', 1, '#FTPTEST.ncb', '/', 0, 40, NULL),
(935, 'FTPTEST.opt', 1, '#FTPTEST.opt', '/', 0, 40, NULL),
(936, 'FTPTEST.plg', 1, '#FTPTEST.plg', '/', 0, 40, NULL),
(937, 'FTPTEST.positions', 1, '#FTPTEST.positions', '/', 0, 40, NULL),
(938, 'FTPTEST.rc', 1, '#FTPTEST.rc', '/', 0, 40, NULL),
(939, 'FTPTESTDlg.cpp', 1, '#FTPTESTDlg.cpp', '/', 0, 40, NULL),
(940, 'FTPTESTDlg.h', 1, '#FTPTESTDlg.h', '/', 0, 40, NULL),
(941, 'ReadMe.txt', 1, '#ReadMe.txt', '/', 0, 40, NULL),
(942, 'Resource.h', 1, '#Resource.h', '/', 0, 40, NULL),
(943, 'StdAfx.cpp', 1, '#StdAfx.cpp', '/', 0, 40, NULL),
(944, 'StdAfx.h', 1, '#StdAfx.h', '/', 0, 40, NULL),
(945, 'FTPTEST.ico', 1, '#FTPTEST.ico', '/', 0, 40, NULL),
(946, 'FTPTEST.rc2', 1, '#FTPTEST.rc2', '/', 0, 40, NULL),
(947, 'FTPTEST.exe', 1, '#FTPTEST.exe', '/', 0, 40, NULL),
(948, 'FTPTEST.ilk', 1, '#FTPTEST.ilk', '/', 0, 40, NULL),
(949, 'FTPTEST.obj', 1, '#FTPTEST.obj', '/', 0, 40, NULL),
(950, 'FTPTEST.pch', 1, '#FTPTEST.pch', '/', 0, 40, NULL),
(951, 'FTPTEST.pdb', 1, '#FTPTEST.pdb', '/', 0, 40, NULL),
(952, 'FTPTEST.res', 1, '#FTPTEST.res', '/', 0, 40, NULL),
(953, 'FTPTESTDlg.obj', 1, '#FTPTESTDlg.obj', '/', 0, 40, NULL),
(954, 'StdAfx.obj', 1, '#StdAfx.obj', '/', 0, 40, NULL),
(955, 'vc60.idb', 1, '#vc60.idb', '/', 0, 40, NULL),
(956, 'vc60.pdb', 1, '#vc60.pdb', '/', 0, 40, NULL),
(957, 'hp打印机mib.txt', 1, '#hp打印机mib.txt', '/', 0, 40, NULL),
(958, 'LJ 600 M601-602-603.txt', 1, '#LJ 600 M601-602-603.txt', '/', 0, 40, NULL),
(959, 'mib笔记.txt', 1, '#mib笔记.txt', '/', 0, 40, NULL),
(960, 'mib阅读笔记.txt', 1, '#mib阅读笔记.txt', '/', 0, 40, NULL),
(961, 'mib阅读笔记2.txt', 1, '#mib阅读笔记2.txt', '/', 0, 40, NULL),
(962, 'Standard Printer MIBrfc1759.mib.txt', 1, '#Standard Printer MIBrfc1759.mib.txt', '/', 0, 40, NULL),
(963, '最新mib阅读笔记.txt', 1, '#最新mib阅读笔记.txt', '/', 0, 40, NULL),
(964, 'BscMake.command.1.tlog', 1, '#BscMake.command.1.tlog', '/', 0, 40, NULL),
(965, 'bscmake.read.1.tlog', 1, '#bscmake.read.1.tlog', '/', 0, 40, NULL),
(966, 'bscmake.write.1.tlog', 1, '#bscmake.write.1.tlog', '/', 0, 40, NULL),
(967, 'ChequePrint.bsc', 1, '#ChequePrint.bsc', '/', 0, 40, NULL),
(968, 'ChequePrint.Build.CppClean.log', 1, '#ChequePrint.Build.CppClean.log', '/', 0, 40, NULL),
(969, 'ChequePrint.dll', 1, '#ChequePrint.dll', '/', 0, 40, NULL),
(970, 'ChequePrint.dll.embed.manifest', 1, '#ChequePrint.dll.embed.manifest', '/', 0, 40, NULL),
(971, 'ChequePrint.dll.embed.manifest.res', 1, '#ChequePrint.dll.embed.manifest.res', '/', 0, 40, NULL),
(972, 'ChequePrint.dll.intermediate.manifest', 1, '#ChequePrint.dll.intermediate.manifest', '/', 0, 40, NULL),
(973, 'ChequePrint.exp', 1, '#ChequePrint.exp', '/', 0, 40, NULL),
(974, 'ChequePrint.ilk', 1, '#ChequePrint.ilk', '/', 0, 40, NULL),
(975, 'ChequePrint.lastbuildstate', 1, '#ChequePrint.lastbuildstate', '/', 0, 40, NULL),
(976, 'ChequePrint.lib', 1, '#ChequePrint.lib', '/', 0, 40, NULL),
(977, 'ChequePrint.log', 1, '#ChequePrint.log', '/', 0, 40, NULL),
(978, 'ChequePrint.obj', 1, '#ChequePrint.obj', '/', 0, 40, NULL),
(979, 'ChequePrint.pdb', 1, '#ChequePrint.pdb', '/', 0, 40, NULL),
(980, 'ChequePrint.write.1.tlog', 1, '#ChequePrint.write.1.tlog', '/', 0, 40, NULL),
(981, 'ChequePrint_manifest.rc', 1, '#ChequePrint_manifest.rc', '/', 0, 40, NULL),
(982, 'cl.command.1.tlog', 1, '#cl.command.1.tlog', '/', 0, 40, NULL),
(983, 'CL.read.1.tlog', 1, '#CL.read.1.tlog', '/', 0, 40, NULL),
(984, 'CL.write.1.tlog', 1, '#CL.write.1.tlog', '/', 0, 40, NULL),
(985, 'conf.ini', 1, '#conf.ini', '/', 0, 40, NULL),
(986, 'INIFileHelper.obj', 1, '#INIFileHelper.obj', '/', 0, 40, NULL),
(987, 'link-cvtres.read.1.tlog', 1, '#link-cvtres.read.1.tlog', '/', 0, 40, NULL),
(988, 'link-cvtres.write.1.tlog', 1, '#link-cvtres.write.1.tlog', '/', 0, 40, NULL),
(989, 'link.2916-cvtres.read.1.tlog', 1, '#link.2916-cvtres.read.1.tlog', '/', 0, 40, NULL),
(990, 'link.2916-cvtres.write.1.tlog', 1, '#link.2916-cvtres.write.1.tlog', '/', 0, 40, NULL),
(991, 'link.2916.read.1.tlog', 1, '#link.2916.read.1.tlog', '/', 0, 40, NULL),
(992, 'link.2916.write.1.tlog', 1, '#link.2916.write.1.tlog', '/', 0, 40, NULL),
(994, 'link.read.1.tlog', 1, '#link.read.1.tlog', '/', 0, 40, NULL),
(995, 'link.write.1.tlog', 1, '#link.write.1.tlog', '/', 0, 40, NULL),
(996, 'mt.command.1.tlog', 1, '#mt.command.1.tlog', '/', 0, 40, NULL),
(997, 'mt.read.1.tlog', 1, '#mt.read.1.tlog', '/', 0, 40, NULL),
(998, 'mt.write.1.tlog', 1, '#mt.write.1.tlog', '/', 0, 40, NULL),
(999, 'rc.command.1.tlog', 1, '#rc.command.1.tlog', '/', 0, 40, NULL),
(1000, 'rc.read.1.tlog', 1, '#rc.read.1.tlog', '/', 0, 40, NULL),
(1001, 'rc.write.1.tlog', 1, '#rc.write.1.tlog', '/', 0, 40, NULL),
(1002, 'resetT65x.npa', 1, '#resetT65x.npa', '/', 0, 40, NULL),
(1003, 'SNMPOIDINC.obj', 1, '#SNMPOIDINC.obj', '/', 0, 40, NULL),
(1004, 'vc100.idb', 1, '#vc100.idb', '/', 0, 40, NULL),
(1005, 'vc100.pdb', 1, '#vc100.pdb', '/', 0, 40, NULL),
(1006, 'ClientTest.dsp', 1, '#ClientTest.dsp', '/', 0, 40, NULL),
(1007, 'ClientTest.dsw', 1, '#ClientTest.dsw', '/', 0, 40, NULL),
(1008, 'ClientTest.ncb', 1, '#ClientTest.ncb', '/', 0, 40, NULL),
(1009, 'ClientTest.opt', 1, '#ClientTest.opt', '/', 0, 40, NULL),
(1010, 'ClientTest.plg', 1, '#ClientTest.plg', '/', 0, 40, NULL),
(1011, 'ClientTest.positions', 1, '#ClientTest.positions', '/', 0, 40, NULL),
(1012, 'MAIN.CPP', 1, '#MAIN.CPP', '/', 0, 40, NULL),
(1013, 'ClientTest.exe', 1, '#ClientTest.exe', '/', 0, 40, NULL),
(1014, 'ClientTest.ilk', 1, '#ClientTest.ilk', '/', 0, 40, NULL),
(1015, 'ClientTest.pch', 1, '#ClientTest.pch', '/', 0, 40, NULL),
(1016, 'ClientTest.pdb', 1, '#ClientTest.pdb', '/', 0, 40, NULL),
(1017, 'LibStampPrinter.dll', 1, '#LibStampPrinter.dll', '/', 0, 40, NULL),
(1018, 'LibStampPrinter.ini', 1, '#LibStampPrinter.ini', '/', 0, 40, NULL),
(1019, 'MAIN.obj', 1, '#MAIN.obj', '/', 0, 40, NULL),
(1020, 'PortOperationLib.dll', 1, '#PortOperationLib.dll', '/', 0, 40, NULL),
(1021, 'SimpleLogModule.dll', 1, '#SimpleLogModule.dll', '/', 0, 40, NULL),
(1022, 'SNMPAPIHelper.dll', 1, '#SNMPAPIHelper.dll', '/', 0, 40, NULL),
(1023, 'entries', 1, '#entries', '/', 0, 40, NULL),
(1024, 'format', 1, '#format', '/', 0, 40, NULL),
(1025, 'smartsvn.properties', 1, '#smartsvn.properties', '/', 0, 40, NULL),
(1026, 'wc.db', 1, '#wc.db', '/', 0, 40, NULL),
(1027, 'wc.db.smartsvn-backup-1488940614-000007542399-000007542399-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1488940614-000007542399-000007542399-SvnCommit.post', '/', 0, 40, NULL),
(1028, 'wc.db.smartsvn-backup-1489542651-000012522062-000012522062-SvnCommit.pre', 1, '#wc.db.smartsvn-backup-1489542651-000012522062-000012522062-SvnCommit.pre', '/', 0, 40, NULL),
(1029, 'wc.db.smartsvn-backup-1489542651-000012524034-000012524034-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1489542651-000012524034-000012524034-SvnCommit.post', '/', 0, 40, NULL),
(1030, 'wc.db.smartsvn-backup-1497511070-000023412413-000023412413-SvnSwitch.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023412413-000023412413-SvnSwitch.pre', '/', 0, 40, NULL),
(1031, 'wc.db.smartsvn-backup-1497511070-000023414742-000023414742-SvnSwitch.post', 1, '#wc.db.smartsvn-backup-1497511070-000023414742-000023414742-SvnSwitch.post', '/', 0, 40, NULL),
(1032, 'wc.db.smartsvn-backup-1497511070-000023493024-000023493024-SvnCommit.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023493024-000023493024-SvnCommit.pre', '/', 0, 40, NULL),
(1033, 'wc.db.smartsvn-backup-1497511070-000023494711-000023494711-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1497511070-000023494711-000023494711-SvnCommit.post', '/', 0, 40, NULL),
(1034, 'wc.db.smartsvn-backup-1497511070-000023574334-000023574334-SvnSwitch.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023574334-000023574334-SvnSwitch.pre', '/', 0, 40, NULL),
(1035, 'wc.db.smartsvn-backup-1497511070-000023577685-000023577685-SvnSwitch.post', 1, '#wc.db.smartsvn-backup-1497511070-000023577685-000023577685-SvnSwitch.post', '/', 0, 40, NULL),
(1036, 'wc.db.smartsvn-backup-1497511070-000023582391-000023582391-SvnRevert.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023582391-000023582391-SvnRevert.pre', '/', 0, 40, NULL),
(1037, 'wc.db.smartsvn-backup-1497511070-000023584696-000023584696-SvnRevert.post', 1, '#wc.db.smartsvn-backup-1497511070-000023584696-000023584696-SvnRevert.post', '/', 0, 40, NULL),
(1038, 'wc.db.smartsvn-backup-1497511070-000023858123-000023858123-SvnSwitch.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023858123-000023858123-SvnSwitch.pre', '/', 0, 40, NULL),
(1039, 'wc.db.smartsvn-backup-1497511070-000023862686-000023862686-SvnSwitch.post', 1, '#wc.db.smartsvn-backup-1497511070-000023862686-000023862686-SvnSwitch.post', '/', 0, 40, NULL),
(1040, 'wc.db.smartsvn-backup-1497511070-000023867784-000023867784-SvnRevert.pre', 1, '#wc.db.smartsvn-backup-1497511070-000023867784-000023867784-SvnRevert.pre', '/', 0, 40, NULL),
(1041, 'wc.db.smartsvn-backup-1497511070-000023872676-000023872676-SvnRevert.post', 1, '#wc.db.smartsvn-backup-1497511070-000023872676-000023872676-SvnRevert.post', '/', 0, 40, NULL),
(1042, 'wc.db.smartsvn-backup-1497941835-000004390964-000004390964-SvnCommit.pre', 1, '#wc.db.smartsvn-backup-1497941835-000004390964-000004390964-SvnCommit.pre', '/', 0, 40, NULL),
(1043, 'wc.db.smartsvn-backup-1497941835-000004393281-000004393281-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1497941835-000004393281-000004393281-SvnCommit.post', '/', 0, 40, NULL),
(1044, 'wc.db.smartsvn-backup-1498206805-000029447007-000029447007-SvnCommit.pre', 1, '#wc.db.smartsvn-backup-1498206805-000029447007-000029447007-SvnCommit.pre', '/', 0, 40, NULL),
(1045, 'wc.db.smartsvn-backup-1498206805-000029449807-000029449807-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1498206805-000029449807-000029449807-SvnCommit.post', '/', 0, 40, NULL),
(1046, 'wc.db.smartsvn-backup-1498206805-000030576404-000030576404-SvnCommit.pre', 1, '#wc.db.smartsvn-backup-1498206805-000030576404-000030576404-SvnCommit.pre', '/', 0, 40, NULL),
(1047, 'wc.db.smartsvn-backup-1498206805-000030577784-000030577784-SvnCommit.post', 1, '#wc.db.smartsvn-backup-1498206805-000030577784-000030577784-SvnCommit.post', '/', 0, 40, NULL),
(1048, 'fe10e2ebba05f20d340c60f575947c4daf9d5029.svn-base', 1, '#fe10e2ebba05f20d340c60f575947c4daf9d5029.svn-base', '/', 0, 40, NULL),
(1049, 'fe51a61ea024034e4f068c61c52667c685e0d22f.svn-base', 1, '#fe51a61ea024034e4f068c61c52667c685e0d22f.svn-base', '/', 0, 40, NULL),
(1050, 'fdf111045579356b0c9fd0e2a71fa20cdb0947c4.svn-base', 1, '#fdf111045579356b0c9fd0e2a71fa20cdb0947c4.svn-base', '/', 0, 40, NULL),
(1051, 'fdfee1c5480c426544c12b4e4085a42499e2b429.svn-base', 1, '#fdfee1c5480c426544c12b4e4085a42499e2b429.svn-base', '/', 0, 40, NULL),
(1052, 'f216ebca339fea28b39753f434751c7a9b6dd677.svn-base', 1, '#f216ebca339fea28b39753f434751c7a9b6dd677.svn-base', '/', 0, 40, NULL),
(1053, 'f244df1d6496039d293869c6ff3985081e1a922d.svn-base', 1, '#f244df1d6496039d293869c6ff3985081e1a922d.svn-base', '/', 0, 40, NULL),
(1054, 'eff37105a4a0f598c5c0fa543aa44489d1255a97.svn-base', 1, '#eff37105a4a0f598c5c0fa543aa44489d1255a97.svn-base', '/', 0, 40, NULL),
(1055, 'ee4f5e5ae977d8db357098a0d3654d87a732c3cf.svn-base', 1, '#ee4f5e5ae977d8db357098a0d3654d87a732c3cf.svn-base', '/', 0, 40, NULL),
(1056, 'ed0953e231b50eab8e6512af3b0ca50062eb5fbf.svn-base', 1, '#ed0953e231b50eab8e6512af3b0ca50062eb5fbf.svn-base', '/', 0, 40, NULL),
(1057, 'eb43a3e18243901c340895f46244511baa040d56.svn-base', 1, '#eb43a3e18243901c340895f46244511baa040d56.svn-base', '/', 0, 40, NULL),
(1058, 'e97f6f1ba37d2c51bfebb760ef92e9987f2f1bf2.svn-base', 1, '#e97f6f1ba37d2c51bfebb760ef92e9987f2f1bf2.svn-base', '/', 0, 40, NULL),
(1059, 'e65f114acd98bb8f233cd4a4ba4fd5e11c5a1c78.svn-base', 1, '#e65f114acd98bb8f233cd4a4ba4fd5e11c5a1c78.svn-base', '/', 0, 40, NULL),
(1060, 'e4b8bfffa18f5a72e954b461e2f8a6aaf9d1c7e7.svn-base', 1, '#e4b8bfffa18f5a72e954b461e2f8a6aaf9d1c7e7.svn-base', '/', 0, 40, NULL),
(1061, 'e0f2867d8db4e5b5133e8949c55219f64e7dafbf.svn-base', 1, '#e0f2867d8db4e5b5133e8949c55219f64e7dafbf.svn-base', '/', 0, 40, NULL),
(1062, 'dce5d01379829cc8662df1cb3a9854d635b7eb25.svn-base', 1, '#dce5d01379829cc8662df1cb3a9854d635b7eb25.svn-base', '/', 0, 40, NULL),
(1063, 'd1d78b0a2ecbfab1e94a7253e1905e82b0adc27c.svn-base', 1, '#d1d78b0a2ecbfab1e94a7253e1905e82b0adc27c.svn-base', '/', 0, 40, NULL),
(1064, 'cd44d6fc8c63123608ca97a288786b63470d02b0.svn-base', 1, '#cd44d6fc8c63123608ca97a288786b63470d02b0.svn-base', '/', 0, 40, NULL),
(1065, 'cadc321505a3d2b90cd05e009e714c50e68a0b61.svn-base', 1, '#cadc321505a3d2b90cd05e009e714c50e68a0b61.svn-base', '/', 0, 40, NULL),
(1066, 'c73a577122a1889e933d31c03693130b72bbdb87.svn-base', 1, '#c73a577122a1889e933d31c03693130b72bbdb87.svn-base', '/', 0, 40, NULL),
(1067, 'c7a64c03c73ebcdc26b028eddf29b9a0e07360fc.svn-base', 1, '#c7a64c03c73ebcdc26b028eddf29b9a0e07360fc.svn-base', '/', 0, 40, NULL),
(1068, 'c5e06f4c0b5a674fc76e2517473c9f5204cd17ef.svn-base', 1, '#c5e06f4c0b5a674fc76e2517473c9f5204cd17ef.svn-base', '/', 0, 40, NULL),
(1069, 'c30fa2c344df9a64434b642db50d5e7d6fd87465.svn-base', 1, '#c30fa2c344df9a64434b642db50d5e7d6fd87465.svn-base', '/', 0, 40, NULL),
(1070, 'bb3b08abffaaa5bbc9634269ec12758356e43d1a.svn-base', 1, '#bb3b08abffaaa5bbc9634269ec12758356e43d1a.svn-base', '/', 0, 40, NULL),
(1071, 'ba17cf289e667d7043574348e0b68d9dd1833e4b.svn-base', 1, '#ba17cf289e667d7043574348e0b68d9dd1833e4b.svn-base', '/', 0, 40, NULL),
(1072, 'ba7c0a882a1323b85122b20556db51894d0eb50d.svn-base', 1, '#ba7c0a882a1323b85122b20556db51894d0eb50d.svn-base', '/', 0, 40, NULL),
(1073, 'b31669647835d293fbb74058d588691cfa327a03.svn-base', 1, '#b31669647835d293fbb74058d588691cfa327a03.svn-base', '/', 0, 40, NULL),
(1074, 'b329597aa1d138ef97264a1b09f77f4a97d05daa.svn-base', 1, '#b329597aa1d138ef97264a1b09f77f4a97d05daa.svn-base', '/', 0, 40, NULL),
(1075, 'b184c0069a0f5c0abc82f6be1f5597a8dc9515be.svn-base', 1, '#b184c0069a0f5c0abc82f6be1f5597a8dc9515be.svn-base', '/', 0, 40, NULL),
(1076, 'afad16cf1aeb34bdd8e2c855df614c1915e53bd4.svn-base', 1, '#afad16cf1aeb34bdd8e2c855df614c1915e53bd4.svn-base', '/', 0, 40, NULL),
(1077, 'ad23387530cf05335514eae710ce3133b517f149.svn-base', 1, '#ad23387530cf05335514eae710ce3133b517f149.svn-base', '/', 0, 40, NULL),
(1078, 'ab0e98b8dc4e328359f99e98f6385796c87eee8e.svn-base', 1, '#ab0e98b8dc4e328359f99e98f6385796c87eee8e.svn-base', '/', 0, 40, NULL),
(1079, 'aad5689f19edf55ad9589258c879a5beea4f09d2.svn-base', 1, '#aad5689f19edf55ad9589258c879a5beea4f09d2.svn-base', '/', 0, 40, NULL),
(1080, 'a9050e017e93246f09d577d52416482515cfac6c.svn-base', 1, '#a9050e017e93246f09d577d52416482515cfac6c.svn-base', '/', 0, 40, NULL),
(1081, 'a9ad649b48e7b565683b24ddb5059b611684cdd2.svn-base', 1, '#a9ad649b48e7b565683b24ddb5059b611684cdd2.svn-base', '/', 0, 40, NULL),
(1082, 'a9ea54e4bf0b81271637f88e02e3e5b115b7f2ee.svn-base', 1, '#a9ea54e4bf0b81271637f88e02e3e5b115b7f2ee.svn-base', '/', 0, 40, NULL),
(1083, 'a3a046c5cbad63fcb7240124388cc35d7b48b217.svn-base', 1, '#a3a046c5cbad63fcb7240124388cc35d7b48b217.svn-base', '/', 0, 40, NULL),
(1084, 'a25adfab5dd8edd6e823f427d90cfc7007d20268.svn-base', 1, '#a25adfab5dd8edd6e823f427d90cfc7007d20268.svn-base', '/', 0, 40, NULL),
(1085, 'a128ca18a7ebe019506ada715608bf5cb09ba5ed.svn-base', 1, '#a128ca18a7ebe019506ada715608bf5cb09ba5ed.svn-base', '/', 0, 40, NULL),
(1086, '9bd9f75ad6b97ad18c948a83bab703752b7671d8.svn-base', 1, '#9bd9f75ad6b97ad18c948a83bab703752b7671d8.svn-base', '/', 0, 40, NULL),
(1087, '9a0549f7e8ba8a88768291303d4063fd4bd668a9.svn-base', 1, '#9a0549f7e8ba8a88768291303d4063fd4bd668a9.svn-base', '/', 0, 40, NULL),
(1088, '99e944e4927d45d922c3faa2be95f0b9d81d6a98.svn-base', 1, '#99e944e4927d45d922c3faa2be95f0b9d81d6a98.svn-base', '/', 0, 40, NULL),
(1089, '96be63dbf3b75e1b22083c99c5c420478ffd2cf3.svn-base', 1, '#96be63dbf3b75e1b22083c99c5c420478ffd2cf3.svn-base', '/', 0, 40, NULL),
(1090, '928f4581104e9362bcd81369ba6808fbd7b87863.svn-base', 1, '#928f4581104e9362bcd81369ba6808fbd7b87863.svn-base', '/', 0, 40, NULL),
(1091, '8ee9b684ddcc20b729803676403b84ed8a515870.svn-base', 1, '#8ee9b684ddcc20b729803676403b84ed8a515870.svn-base', '/', 0, 40, NULL),
(1092, '894f3bb9e2e64bd46d92e4bad93b045b1562ef61.svn-base', 1, '#894f3bb9e2e64bd46d92e4bad93b045b1562ef61.svn-base', '/', 0, 40, NULL),
(1093, '87eef24ffa7aa7b7560da27ca4eeaa9c039c85ae.svn-base', 1, '#87eef24ffa7aa7b7560da27ca4eeaa9c039c85ae.svn-base', '/', 0, 40, NULL),
(1094, '8668fba8387e9d8b300a5d42e7c3945749c8a14e.svn-base', 1, '#8668fba8387e9d8b300a5d42e7c3945749c8a14e.svn-base', '/', 0, 40, NULL),
(1095, '83c76be85789c8aa92cd5594b948191a3c6de503.svn-base', 1, '#83c76be85789c8aa92cd5594b948191a3c6de503.svn-base', '/', 0, 40, NULL),
(1096, '7faae948c82b2d978d0b919748be5dfc00376339.svn-base', 1, '#7faae948c82b2d978d0b919748be5dfc00376339.svn-base', '/', 0, 40, NULL),
(1097, '7df4509f690bd43583e4ba15caad4328cfe8009b.svn-base', 1, '#7df4509f690bd43583e4ba15caad4328cfe8009b.svn-base', '/', 0, 40, NULL),
(1098, '7ba8dfa3757c5424cada7309f7ab956743d4b023.svn-base', 1, '#7ba8dfa3757c5424cada7309f7ab956743d4b023.svn-base', '/', 0, 40, NULL),
(1099, '786d4401d1a245b6d318cb5b5ce2b3d73fff2e0d.svn-base', 1, '#786d4401d1a245b6d318cb5b5ce2b3d73fff2e0d.svn-base', '/', 0, 40, NULL),
(1100, '75c125545ec266c3b02cec5a17333fd2719d8cd4.svn-base', 1, '#75c125545ec266c3b02cec5a17333fd2719d8cd4.svn-base', '/', 0, 40, NULL),
(1101, '71cedf0ef969f68cb7d93151357035549aba0559.svn-base', 1, '#71cedf0ef969f68cb7d93151357035549aba0559.svn-base', '/', 0, 40, NULL),
(1102, '6fe0def93230f2c137c5913055a029aff3c8936f.svn-base', 1, '#6fe0def93230f2c137c5913055a029aff3c8936f.svn-base', '/', 0, 40, NULL),
(1103, '6dd201304480075ab2c21d24858973f15e859f6e.svn-base', 1, '#6dd201304480075ab2c21d24858973f15e859f6e.svn-base', '/', 0, 40, NULL),
(1104, '6a317895c742b81c5e0d5749f16888a5f54d3ea7.svn-base', 1, '#6a317895c742b81c5e0d5749f16888a5f54d3ea7.svn-base', '/', 0, 40, NULL),
(1105, '6a7fcf6705a9305a840a9d4e6ee31580c0d5bf9d.svn-base', 1, '#6a7fcf6705a9305a840a9d4e6ee31580c0d5bf9d.svn-base', '/', 0, 40, NULL),
(1106, '650747d1c9631cb0b42f7a8b2d80b7906977445a.svn-base', 1, '#650747d1c9631cb0b42f7a8b2d80b7906977445a.svn-base', '/', 0, 40, NULL),
(1107, '659d08608fadaaa9d6a878b8f9d0c3352a701088.svn-base', 1, '#659d08608fadaaa9d6a878b8f9d0c3352a701088.svn-base', '/', 0, 40, NULL),
(1108, '601809063990a8e9c0e225cea2b00521ad3d866c.svn-base', 1, '#601809063990a8e9c0e225cea2b00521ad3d866c.svn-base', '/', 0, 40, NULL),
(1109, '5f222d21be304340b9434d4643d8481ad553115b.svn-base', 1, '#5f222d21be304340b9434d4643d8481ad553115b.svn-base', '/', 0, 40, NULL),
(1110, '5c0c20580f8c5a6353b282504437522e1ee5b23d.svn-base', 1, '#5c0c20580f8c5a6353b282504437522e1ee5b23d.svn-base', '/', 0, 40, NULL),
(1111, '5cca3391e6123de385ab87b8b7426ef35182063d.svn-base', 1, '#5cca3391e6123de385ab87b8b7426ef35182063d.svn-base', '/', 0, 40, NULL),
(1112, '595aaee6d92add07d6b386a5bbdffbf88d7b5d37.svn-base', 1, '#595aaee6d92add07d6b386a5bbdffbf88d7b5d37.svn-base', '/', 0, 40, NULL),
(1113, '587ab907e14e3cb4000afa8ee6513aaf5c69193a.svn-base', 1, '#587ab907e14e3cb4000afa8ee6513aaf5c69193a.svn-base', '/', 0, 40, NULL),
(1114, '5096a190fbc86c80911e67331b146d064a8ed764.svn-base', 1, '#5096a190fbc86c80911e67331b146d064a8ed764.svn-base', '/', 0, 40, NULL),
(1115, '50bdc10228e286207c0087fb4d21fab611da3efc.svn-base', 1, '#50bdc10228e286207c0087fb4d21fab611da3efc.svn-base', '/', 0, 40, NULL),
(1116, '4acd219f06dbc4c7ff28ff2ad8b2dbd039c83719.svn-base', 1, '#4acd219f06dbc4c7ff28ff2ad8b2dbd039c83719.svn-base', '/', 0, 40, NULL),
(1117, '48c07409b0a8e14d226d67038e25d502288643cc.svn-base', 1, '#48c07409b0a8e14d226d67038e25d502288643cc.svn-base', '/', 0, 40, NULL),
(1118, '46b1cdf8cc28eff9b036a7af5569cc8593d4800d.svn-base', 1, '#46b1cdf8cc28eff9b036a7af5569cc8593d4800d.svn-base', '/', 0, 40, NULL),
(1119, '3e04f0cfab56a0a25a3ca27b0fe6e7ecb7388ae1.svn-base', 1, '#3e04f0cfab56a0a25a3ca27b0fe6e7ecb7388ae1.svn-base', '/', 0, 40, NULL),
(1120, '3e8aed0a47bb4981633c667780d95911ac2b3951.svn-base', 1, '#3e8aed0a47bb4981633c667780d95911ac2b3951.svn-base', '/', 0, 40, NULL),
(1121, '3eba7e63e9e417bdc1fc3b382f8dd608050d2800.svn-base', 1, '#3eba7e63e9e417bdc1fc3b382f8dd608050d2800.svn-base', '/', 0, 40, NULL),
(1122, '3c3fab6cd8fb11c4f517c6185c4698ac99294671.svn-base', 1, '#3c3fab6cd8fb11c4f517c6185c4698ac99294671.svn-base', '/', 0, 40, NULL),
(1123, '394655b899181fbc1d33437a167cfaf23c5b2170.svn-base', 1, '#394655b899181fbc1d33437a167cfaf23c5b2170.svn-base', '/', 0, 40, NULL),
(1124, '396fd0a9117cd05616d147f3825c11c931a66fb4.svn-base', 1, '#396fd0a9117cd05616d147f3825c11c931a66fb4.svn-base', '/', 0, 40, NULL),
(1125, '38bcf26aab7337dfb7af87b68d6afc12b0a8d336.svn-base', 1, '#38bcf26aab7337dfb7af87b68d6afc12b0a8d336.svn-base', '/', 0, 40, NULL),
(1126, '38eafcf81a8c198ba70080b67f596d9cb972176a.svn-base', 1, '#38eafcf81a8c198ba70080b67f596d9cb972176a.svn-base', '/', 0, 40, NULL),
(1127, '35210bbe77f1157fde7dba5d5176fc46c7138f77.svn-base', 1, '#35210bbe77f1157fde7dba5d5176fc46c7138f77.svn-base', '/', 0, 40, NULL),
(1128, '349abbbf2305f36b0dae809ebb065499fe649864.svn-base', 1, '#349abbbf2305f36b0dae809ebb065499fe649864.svn-base', '/', 0, 40, NULL),
(1129, '3348c98feb0c58e1d2761b2dcc5cfe3e1487f744.svn-base', 1, '#3348c98feb0c58e1d2761b2dcc5cfe3e1487f744.svn-base', '/', 0, 40, NULL),
(1130, '33ca2b232798157c74a2ccd74791f4a205eda04c.svn-base', 1, '#33ca2b232798157c74a2ccd74791f4a205eda04c.svn-base', '/', 0, 40, NULL),
(1131, '31e6a1ec8deaf1e6f1f4dd947fdb55baad816ead.svn-base', 1, '#31e6a1ec8deaf1e6f1f4dd947fdb55baad816ead.svn-base', '/', 0, 40, NULL),
(1132, '2ed61b0728e4cba709aa27f0f878ad1c29ad44d8.svn-base', 1, '#2ed61b0728e4cba709aa27f0f878ad1c29ad44d8.svn-base', '/', 0, 40, NULL),
(1133, '2db2fdc03d5e453c535d2bd9c0372364825cd104.svn-base', 1, '#2db2fdc03d5e453c535d2bd9c0372364825cd104.svn-base', '/', 0, 40, NULL),
(1134, '2b843304e9fd75ec7137bb9c0977e0261688988b.svn-base', 1, '#2b843304e9fd75ec7137bb9c0977e0261688988b.svn-base', '/', 0, 40, NULL),
(1135, '2bd34f8a3e7211b0951c0c306c1741dec9f851b3.svn-base', 1, '#2bd34f8a3e7211b0951c0c306c1741dec9f851b3.svn-base', '/', 0, 40, NULL),
(1136, '2831fa88107fe9fa5b3631b11c34d8e4b10b8f0d.svn-base', 1, '#2831fa88107fe9fa5b3631b11c34d8e4b10b8f0d.svn-base', '/', 0, 40, NULL),
(1137, '274c36277c0260c6a8aa84e124ba6a7d56471092.svn-base', 1, '#274c36277c0260c6a8aa84e124ba6a7d56471092.svn-base', '/', 0, 40, NULL),
(1138, '2445d16695f98c5026e59ae83f6d3f2910255d60.svn-base', 1, '#2445d16695f98c5026e59ae83f6d3f2910255d60.svn-base', '/', 0, 40, NULL),
(1139, '23a6535c63728772c9dc32e1aef1780e96f96513.svn-base', 1, '#23a6535c63728772c9dc32e1aef1780e96f96513.svn-base', '/', 0, 40, NULL),
(1140, '1f35a4e07f14ef61a0cda2d75ec2916183aac75f.svn-base', 1, '#1f35a4e07f14ef61a0cda2d75ec2916183aac75f.svn-base', '/', 0, 40, NULL),
(1141, '1809da254db7dee33d8e4c3cfc068d8ebe703135.svn-base', 1, '#1809da254db7dee33d8e4c3cfc068d8ebe703135.svn-base', '/', 0, 40, NULL),
(1142, '18c81851a39ccf648689781bee6937412a93c976.svn-base', 1, '#18c81851a39ccf648689781bee6937412a93c976.svn-base', '/', 0, 40, NULL),
(1143, '1708a993a513943116bc349a2e49f85e5fa1bfca.svn-base', 1, '#1708a993a513943116bc349a2e49f85e5fa1bfca.svn-base', '/', 0, 40, NULL),
(1144, '175ab9c894b805df886bb9536e09663d6bf195df.svn-base', 1, '#175ab9c894b805df886bb9536e09663d6bf195df.svn-base', '/', 0, 40, NULL),
(1145, '1773ac44aecde1eaa87f5f3f8c3c1ba030138a05.svn-base', 1, '#1773ac44aecde1eaa87f5f3f8c3c1ba030138a05.svn-base', '/', 0, 40, NULL),
(1146, '13a5982f0055180b0702ed279d40448ff9f9d9e7.svn-base', 1, '#13a5982f0055180b0702ed279d40448ff9f9d9e7.svn-base', '/', 0, 40, NULL),
(1147, '0f0b4500934f3edb5d907ee9e2a6174df6cc625d.svn-base', 1, '#0f0b4500934f3edb5d907ee9e2a6174df6cc625d.svn-base', '/', 0, 40, NULL),
(1148, '0ae552db0c0b787ae32b7e668cbf21af9b283770.svn-base', 1, '#0ae552db0c0b787ae32b7e668cbf21af9b283770.svn-base', '/', 0, 40, NULL),
(1149, '08d06c0967da3973058f72b6edddf26856eed57e.svn-base', 1, '#08d06c0967da3973058f72b6edddf26856eed57e.svn-base', '/', 0, 40, NULL),
(1150, '078bfbfef0c30c56c7ceed6a9bc0d6cbb75199d9.svn-base', 1, '#078bfbfef0c30c56c7ceed6a9bc0d6cbb75199d9.svn-base', '/', 0, 40, NULL),
(1151, '05a4b800418568a666578b7d9bcb1dab6e23d080.svn-base', 1, '#05a4b800418568a666578b7d9bcb1dab6e23d080.svn-base', '/', 0, 40, NULL),
(1152, '04a9c2b4fff5d1ac188a4adf8b0e0cc12e9f8e14.svn-base', 1, '#04a9c2b4fff5d1ac188a4adf8b0e0cc12e9f8e14.svn-base', '/', 0, 40, NULL),
(1153, '039a3f218e369ca7e2906923b960e0e4936525cb.svn-base', 1, '#039a3f218e369ca7e2906923b960e0e4936525cb.svn-base', '/', 0, 40, NULL),
(1154, '03e1610dea12df39847b777e55133c7705019fa8.svn-base', 1, '#03e1610dea12df39847b777e55133c7705019fa8.svn-base', '/', 0, 40, NULL),
(1155, '0039a8c942eb7258e0ad9567188772de0fc73cd9.svn-base', 1, '#0039a8c942eb7258e0ad9567188772de0fc73cd9.svn-base', '/', 0, 40, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `wiki_project`
--

CREATE TABLE IF NOT EXISTS `wiki_project` (
  `ID` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `NAME` varchar(255) DEFAULT NULL COMMENT '项目名',
  `TYPE` int(10) DEFAULT '1' COMMENT '仓库存储类型：1-普通文件 2-svn',
  `PATH` varchar(200) NOT NULL DEFAULT 'D:/DocSysReposes' COMMENT '仓库所在的目录',
  `SVN_PATH` varchar(200) DEFAULT NULL,
  `SVN_USER` varchar(50) DEFAULT NULL,
  `SVN_PWD` varchar(20) DEFAULT NULL,
  `INFO` varchar(1000) DEFAULT NULL COMMENT '项目简介',
  `MENU` varchar(5000) DEFAULT NULL,
  `PWD` varchar(20) DEFAULT NULL,
  `CREATE_TIME` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=41 ;

--
-- 转存表中的数据 `wiki_project`
--

INSERT INTO `wiki_project` (`ID`, `NAME`, `TYPE`, `PATH`, `SVN_PATH`, `SVN_USER`, `SVN_PWD`, `INFO`, `MENU`, `PWD`, `CREATE_TIME`) VALUES
(7, 'DocSys', 1, 'D:/', '', '', '', 'DocSys说明', NULL, '', NULL),
(16, '虚拟文件系统', 0, 'C:/', '', '', '', '虚拟文件系统顶顶顶顶', NULL, '', NULL),
(17, '测试仓库', 1, 'D:/', '', '', '', '测试仓库', NULL, '', NULL),
(18, '自由团队', 1, 'D:/', '', '', '', '自由团队', NULL, '', NULL),
(19, '1111111111111111111111', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL),
(20, 'tessssss', 2, 'D:/', '2222222222222222222222222222', '652055239@qq.com', '123456', 'ssssssss', NULL, NULL, NULL),
(21, '22222222222222222222222222222222222', 1, 'D:/', NULL, NULL, NULL, '333', NULL, NULL, NULL),
(22, '3333', 1, 'D:/', NULL, NULL, NULL, '333333333333333333', NULL, NULL, NULL),
(23, '4444444444444444444', 1, 'D:/', NULL, NULL, NULL, '55555555555555555555', NULL, NULL, NULL),
(24, '444444444444444', 1, 'D:/', NULL, NULL, NULL, '555', NULL, NULL, NULL),
(25, '2222', 2, 'D:/', '22', '652055239@qq.com', '123456', '222', NULL, NULL, NULL),
(26, '22222', 1, 'D:/', NULL, NULL, NULL, '3333', NULL, NULL, NULL),
(27, '55555555', 1, 'D:/', NULL, NULL, NULL, '66', NULL, NULL, NULL),
(28, '7777', 1, 'D:/', NULL, NULL, NULL, '8888', NULL, NULL, NULL),
(29, '9999', 1, 'D:/', NULL, NULL, NULL, '0000', NULL, NULL, NULL),
(30, 'uuuuu', 1, 'D:/', NULL, NULL, NULL, 'uuuu', NULL, NULL, NULL),
(31, '我的仓库', 1, 'D:/', NULL, NULL, NULL, '111', NULL, NULL, NULL),
(32, '目录1', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL),
(33, '1111111111111111111111', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL),
(34, '22324234', 1, 'D:/', NULL, NULL, NULL, '43423412342', NULL, NULL, NULL),
(35, '12345666', 1, 'D:/', NULL, NULL, NULL, '7777', NULL, NULL, NULL),
(36, '我的仓库1232', 1, 'D:/', NULL, NULL, NULL, '订单', NULL, NULL, NULL),
(37, '121321312321321312321', 1, 'D:/', NULL, NULL, NULL, '312321321312312', NULL, NULL, NULL),
(38, '6553453455345', 1, 'D:/', NULL, NULL, NULL, '3534535345', NULL, NULL, NULL),
(39, '12121212121212', 1, 'D:/', NULL, NULL, NULL, '1212121', NULL, NULL, NULL),
(40, '2222233333', 1, 'D:/', NULL, NULL, NULL, '444', NULL, NULL, NULL);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
