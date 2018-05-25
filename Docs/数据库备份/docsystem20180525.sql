/*
Navicat MySQL Data Transfer

Source Server         : DocSys-localhost
Source Server Version : 50505
Source Host           : localhost:3306
Source Database       : docsystem

Target Server Type    : MYSQL
Target Server Version : 50505
File Encoding         : 65001

Date: 2018-05-25 17:06:58
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for doc
-- ----------------------------
DROP TABLE IF EXISTS `doc`;
CREATE TABLE `doc` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `CONTENT` longtext COMMENT 'doc''s virtual content',
  `PATH` varchar(1000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `PID` int(10) unsigned DEFAULT NULL COMMENT 'Parent Node id',
  `VID` int(10) unsigned DEFAULT NULL COMMENT '所属仓库id',
  `PWD` varchar(20) DEFAULT NULL,
  `CREATOR` int(11) DEFAULT NULL,
  `CREATE_TIME` varchar(100) DEFAULT NULL COMMENT 'Doc CreateTime was used for display, so use the char data type',
  `STATE` int(1) NOT NULL DEFAULT '1' COMMENT 'Doc LockState 0:unlock  1:lock doc 2:lock doc and subDocs',
  `LOCK_BY` int(11) unsigned DEFAULT NULL COMMENT 'UserID用于给Doc上锁',
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT '文件锁定时间，该参数用于Lock的自动解锁',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6882 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for doc_auth
-- ----------------------------
DROP TABLE IF EXISTS `doc_auth`;
CREATE TABLE `doc_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) DEFAULT NULL,
  `GROUP_ID` int(11) DEFAULT NULL COMMENT 'GROUP ID',
  `TYPE` int(1) DEFAULT NULL,
  `PRIORITY` int(1) NOT NULL DEFAULT '0' COMMENT '权限的优先级，值越大优先级越高',
  `DOC_ID` int(11) NOT NULL,
  `REPOS_ID` int(11) NOT NULL DEFAULT '0' COMMENT '权限类型：1：User 2:Group 3: anyUser',
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(2) NOT NULL DEFAULT '0' COMMENT '0:不可见  1:只读',
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  `HERITABLE` int(1) NOT NULL DEFAULT '0' COMMENT '0:不可继承  1:可继承',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for group_member
-- ----------------------------
DROP TABLE IF EXISTS `group_member`;
CREATE TABLE `group_member` (
  `ID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'GroupMember ID',
  `GROUP_ID` int(11) DEFAULT NULL COMMENT 'GROUP ID',
  `USER_ID` int(11) DEFAULT NULL COMMENT 'USER ID',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for repos
-- ----------------------------
DROP TABLE IF EXISTS `repos`;
CREATE TABLE `repos` (
  `ID` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `NAME` varchar(255) DEFAULT NULL COMMENT '项目名',
  `TYPE` int(10) DEFAULT '1' COMMENT '文件系统类型：0：虚拟文件系统 1-普通文件系统',
  `PATH` varchar(200) NOT NULL DEFAULT 'D:/DocSysReposes' COMMENT '仓库所在的目录',
  `VER_CTRL` int(2) NOT NULL DEFAULT '0' COMMENT 'RealDoc版本控制：0：无版本控制；1：SVN；2：GIT',
  `SVN_PATH` varchar(200) DEFAULT NULL,
  `SVN_USER` varchar(50) DEFAULT NULL,
  `SVN_PWD` varchar(20) DEFAULT NULL,
  `VER_CTRL1` int(2) NOT NULL DEFAULT '0' COMMENT 'VirtualDoc版本控制: 0:无;  1: SVN; 2: GIT;',
  `SVN_PATH1` varchar(200) DEFAULT NULL,
  `SVN_USER1` varchar(50) DEFAULT NULL,
  `SVN_PWD1` varchar(20) DEFAULT NULL,
  `INFO` varchar(1000) DEFAULT NULL COMMENT '项目简介',
  `MENU` varchar(5000) DEFAULT NULL,
  `PWD` varchar(20) DEFAULT NULL,
  `OWNER` int(11) DEFAULT NULL,
  `CREATE_TIME` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for repos_auth
-- ----------------------------
DROP TABLE IF EXISTS `repos_auth`;
CREATE TABLE `repos_auth` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) DEFAULT NULL,
  `GROUP_ID` int(11) DEFAULT NULL COMMENT 'GROUP ID',
  `TYPE` int(1) DEFAULT '0' COMMENT '权限类型：1 User, 2 Group, 3 anyUser',
  `PRIORITY` int(1) DEFAULT '0' COMMENT '权限优先级：值越大优先级越高',
  `REPOS_ID` int(11) DEFAULT NULL,
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(2) DEFAULT NULL,
  `EDIT_EN` int(2) DEFAULT NULL,
  `ADD_EN` int(2) DEFAULT NULL,
  `DELETE_EN` int(2) DEFAULT NULL,
  `HERITABLE` int(1) NOT NULL DEFAULT '0' COMMENT '0:不可继承  1:可继承',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(50) CHARACTER SET utf8 NOT NULL,
  `ROLE_ID` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',
  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for user_group
-- ----------------------------
DROP TABLE IF EXISTS `user_group`;
CREATE TABLE `user_group` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(200) CHARACTER SET utf8 DEFAULT NULL COMMENT 'GroupName',
  `TYPE` int(1) DEFAULT NULL COMMENT 'Group Type: reserved',
  `INFO` varchar(1000) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group Description',
  `IMG` varchar(200) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group IMG',
  `PRIORITY` int(2) DEFAULT NULL COMMENT 'Group Priority: reserved',
  `CREATE_TIME` varchar(50) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group create time',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
