-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2017 年 09 月 12 日 05:47
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
-- 表的结构 `doc`
--

CREATE TABLE IF NOT EXISTS `doc` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `CONTENT` longtext COMMENT '文章内容',
  `PATH` varchar(1000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `PID` int(10) unsigned DEFAULT NULL COMMENT 'Parent Node id',
  `VID` int(10) unsigned DEFAULT NULL COMMENT '所属仓库id',
  `PWD` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1451 ;

--
-- 转存表中的数据 `doc`
--

INSERT INTO `doc` (`ID`, `NAME`, `TYPE`, `CONTENT`, `PATH`, `PID`, `VID`, `PWD`) VALUES
(1442, 'SVN培训', 2, '#SVN培训', '/', 0, 45, NULL),
(1443, 'SVN系统管理操作手册.doc', 1, '#SVN系统管理操作手册.doc', '/SVN培训/', 1442, 45, NULL),
(1444, 'SVN系统结构.JPG', 1, '#SVN系统结构.JPG', '/SVN培训/', 1442, 45, NULL),
(1445, 'SVN问题汇总.doc', 1, '#SVN问题汇总.doc', '/SVN培训/', 1442, 45, NULL),
(1446, 'Thumbs.db', 1, '#Thumbs.db', '/SVN培训/', 1442, 45, NULL),
(1447, '软件开发流程培训.ppt', 1, '#软件开发流程培训.ppt', '/SVN培训/', 1442, 45, NULL),
(1448, '配置管理工具培训.ppt', 1, '#配置管理工具培训.ppt', '/SVN培训/', 1442, 45, NULL),
(1449, '.classpath', 1, '#.classpath', '/', 0, 45, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `doc_auth`
--

CREATE TABLE IF NOT EXISTS `doc_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) NOT NULL,
  `DOC_ID` int(11) NOT NULL,
  `REPOS_ID` int(11) NOT NULL,
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(2) NOT NULL DEFAULT '0' COMMENT '0:不可见  1:只读',
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `repos`
--

CREATE TABLE IF NOT EXISTS `repos` (
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
  `OWNER` int(11) DEFAULT NULL,
  `CREATE_TIME` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=46 ;

--
-- 转存表中的数据 `repos`
--

INSERT INTO `repos` (`ID`, `NAME`, `TYPE`, `PATH`, `SVN_PATH`, `SVN_USER`, `SVN_PWD`, `INFO`, `MENU`, `PWD`, `OWNER`, `CREATE_TIME`) VALUES
(7, 'DocSys', 1, 'D:/', '', '', '', 'DocSys说明', NULL, '', NULL, NULL),
(16, '虚拟文件系统', 0, 'C:/', '', '', '', '虚拟文件系统顶顶顶顶', NULL, '', NULL, NULL),
(17, '测试仓库', 1, 'D:/', '', '', '', '测试仓库', NULL, '', NULL, NULL),
(18, '自由团队', 1, 'D:/', '', '', '', '自由团队', NULL, '', NULL, NULL),
(19, '1111111111111111111111', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL, NULL),
(20, 'tessssss', 2, 'D:/', '2222222222222222222222222222', '652055239@qq.com', '123456', 'ssssssss', NULL, NULL, NULL, NULL),
(21, '22222222222222222222222222222222222', 1, 'D:/', NULL, NULL, NULL, '333', NULL, NULL, NULL, NULL),
(22, '3333', 1, 'D:/', NULL, NULL, NULL, '333333333333333333', NULL, NULL, NULL, NULL),
(23, '4444444444444444444', 1, 'D:/', NULL, NULL, NULL, '55555555555555555555', NULL, NULL, NULL, NULL),
(24, '444444444444444', 1, 'D:/', NULL, NULL, NULL, '555', NULL, NULL, NULL, NULL),
(25, '2222', 2, 'D:/', '22', '652055239@qq.com', '123456', '222', NULL, NULL, NULL, NULL),
(26, '22222', 1, 'D:/', NULL, NULL, NULL, '3333', NULL, NULL, NULL, NULL),
(27, '55555555', 1, 'D:/', NULL, NULL, NULL, '66', NULL, NULL, NULL, NULL),
(28, '7777', 1, 'D:/', NULL, NULL, NULL, '8888', NULL, NULL, NULL, NULL),
(29, '9999', 1, 'D:/', NULL, NULL, NULL, '0000', NULL, NULL, NULL, NULL),
(30, 'uuuuu', 1, 'D:/', NULL, NULL, NULL, 'uuuu', NULL, NULL, NULL, NULL),
(31, '我的仓库', 1, 'D:/', NULL, NULL, NULL, '111', NULL, NULL, NULL, NULL),
(32, '目录1', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL, NULL),
(33, '1111111111111111111111', 1, 'D:/', NULL, NULL, NULL, '22222222222222222222222', NULL, NULL, NULL, NULL),
(34, '22324234', 1, 'D:/', NULL, NULL, NULL, '43423412342', NULL, NULL, NULL, NULL),
(35, '12345666', 1, 'D:/', NULL, NULL, NULL, '7777', NULL, NULL, NULL, NULL),
(36, '我的仓库1232', 1, 'D:/', NULL, NULL, NULL, '订单', NULL, NULL, NULL, NULL),
(37, '121321312321321312321', 1, 'D:/', NULL, NULL, NULL, '312321321312312', NULL, NULL, NULL, NULL),
(38, '6553453455345', 1, 'D:/', NULL, NULL, NULL, '3534535345', NULL, NULL, NULL, NULL),
(39, '12121212121212', 1, 'D:/', NULL, NULL, NULL, '1212121', NULL, NULL, NULL, NULL),
(40, '2222233333', 1, 'D:/', NULL, NULL, NULL, '444', NULL, NULL, NULL, NULL),
(41, '我的第二个仓库', 1, 'D:/', NULL, NULL, NULL, '1111', NULL, NULL, NULL, NULL),
(42, 'SVN仓库', 2, 'D:/', '12345678', '652055239@qq.com', '123456', '123333', NULL, NULL, NULL, NULL),
(43, '34355656565', 1, 'D:/DocSysReposes/', NULL, NULL, NULL, '7777777', NULL, NULL, NULL, NULL),
(44, 'Test', 1, 'D:/DocSysReposes/', NULL, NULL, NULL, 'tesjltjljklj', NULL, NULL, NULL, NULL),
(45, 'testForDelete', 1, 'D:/DocSysReposes/', NULL, NULL, NULL, '1111', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- 表的结构 `repos_auth`
--

CREATE TABLE IF NOT EXISTS `repos_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) DEFAULT NULL,
  `REPOS_ID` int(11) DEFAULT NULL,
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(2) DEFAULT NULL,
  `EDIT_EN` int(2) DEFAULT NULL,
  `ADD_EN` int(2) DEFAULT NULL,
  `DELETE_EN` int(2) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- 转存表中的数据 `repos_auth`
--

INSERT INTO `repos_auth` (`ID`, `USER_ID`, `REPOS_ID`, `IS_ADMIN`, `ACCESS`, `EDIT_EN`, `ADD_EN`, `DELETE_EN`) VALUES
(1, 1, 40, NULL, 2, NULL, NULL, NULL),
(2, 1, 41, NULL, 2, 1, 1, 1),
(3, 1, 42, NULL, 2, 1, 1, 1),
(4, 1, 43, NULL, 2, 1, 1, 1),
(5, 1, 44, NULL, 2, 1, 1, 1),
(6, 1, 45, NULL, 2, 1, 1, 1);

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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
