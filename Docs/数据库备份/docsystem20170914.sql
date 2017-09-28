-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2017 年 09 月 14 日 10:10
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
  `CREATOR` int(11) DEFAULT NULL,
  `CREATE_TIME` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1664 ;

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
  `CREATE_TIME` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=48 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

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
  `TYPE` int(1) NOT NULL DEFAULT '0' COMMENT '0：普通用户 1：管理员 2：超级管理员，系统第一个用户会成为超级管理员',
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
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
