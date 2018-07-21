-- phpMyAdmin SQL Dump
-- version 4.8.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 2018-07-21 14:00:53
-- 服务器版本： 10.1.33-MariaDB
-- PHP Version: 7.2.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `docsystem`
--

-- --------------------------------------------------------

--
-- 表的结构 `doc`
--

CREATE TABLE `doc` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `SIZE` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '文件大小',
  `CHECK_SUM` varchar(32) DEFAULT NULL COMMENT '文件的MD5校验值',
  `CONTENT` longtext COMMENT 'doc''s virtual content',
  `PATH` varchar(1000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `PID` int(10) UNSIGNED DEFAULT NULL COMMENT 'Parent Node id',
  `VID` int(10) UNSIGNED DEFAULT NULL COMMENT '所属仓库id',
  `PWD` varchar(20) DEFAULT NULL,
  `CREATOR` int(11) DEFAULT NULL,
  `CREATE_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT 'Doc CreateTime',
  `LATEST_EDITOR` int(11) DEFAULT NULL,
  `LATEST_EDIT_TIME` bigint(20) DEFAULT '0',
  `STATE` int(1) NOT NULL DEFAULT '1' COMMENT 'Doc LockState 0:unlock  1:lock doc 2:lock doc and subDocs',
  `LOCK_BY` int(11) UNSIGNED DEFAULT NULL COMMENT 'UserID用于给Doc上锁',
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT '文件锁定时间，该参数用于Lock的自动解锁'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `doc_auth`
--

CREATE TABLE `doc_auth` (
  `ID` int(11) NOT NULL,
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
  `HERITABLE` int(1) NOT NULL DEFAULT '0' COMMENT '0:不可继承  1:可继承'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `group_member`
--

CREATE TABLE `group_member` (
  `ID` int(11) NOT NULL COMMENT 'GroupMember ID',
  `GROUP_ID` int(11) DEFAULT NULL COMMENT 'GROUP ID',
  `USER_ID` int(11) DEFAULT NULL COMMENT 'USER ID'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `repos`
--

CREATE TABLE `repos` (
  `ID` int(8) NOT NULL COMMENT '主键',
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
  `CREATE_TIME` bigint(20) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `repos_auth`
--

CREATE TABLE `repos_auth` (
  `ID` int(11) NOT NULL,
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
  `HERITABLE` int(1) NOT NULL DEFAULT '0' COMMENT '0:不可继承  1:可继承'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `role`
--

CREATE TABLE `role` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(50) CHARACTER SET utf8 NOT NULL,
  `ROLE_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `sys_config`
--

CREATE TABLE `sys_config` (
  `ID` int(11) NOT NULL,
  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',
  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE `user` (
  `ID` int(11) NOT NULL,
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
  `CREATE_TIME` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `user_group`
--

CREATE TABLE `user_group` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(200) CHARACTER SET utf8 DEFAULT NULL COMMENT 'GroupName',
  `TYPE` int(1) DEFAULT NULL COMMENT 'Group Type: reserved',
  `INFO` varchar(1000) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group Description',
  `IMG` varchar(200) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group IMG',
  `PRIORITY` int(2) DEFAULT NULL COMMENT 'Group Priority: reserved',
  `CREATE_TIME` varchar(50) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Group create time'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `doc`
--
ALTER TABLE `doc`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `doc_auth`
--
ALTER TABLE `doc_auth`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `group_member`
--
ALTER TABLE `group_member`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `repos`
--
ALTER TABLE `repos`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `repos_auth`
--
ALTER TABLE `repos_auth`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `sys_config`
--
ALTER TABLE `sys_config`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `id` (`ID`);

--
-- Indexes for table `user_group`
--
ALTER TABLE `user_group`
  ADD PRIMARY KEY (`ID`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `doc`
--
ALTER TABLE `doc`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `doc_auth`
--
ALTER TABLE `doc_auth`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `group_member`
--
ALTER TABLE `group_member`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'GroupMember ID';

--
-- 使用表AUTO_INCREMENT `repos`
--
ALTER TABLE `repos`
  MODIFY `ID` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键';

--
-- 使用表AUTO_INCREMENT `repos_auth`
--
ALTER TABLE `repos_auth`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `role`
--
ALTER TABLE `role`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `sys_config`
--
ALTER TABLE `sys_config`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `user`
--
ALTER TABLE `user`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `user_group`
--
ALTER TABLE `user_group`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
