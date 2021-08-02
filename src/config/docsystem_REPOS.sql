-- phpMyAdmin SQL Dump
-- version 4.8.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 2019-05-16 07:42:32
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
-- 表的结构 `repos`
--

CREATE TABLE `repos` (
  `ID` int(8) NOT NULL COMMENT '主键',
  `NAME` varchar(255) DEFAULT NULL COMMENT '项目名',
  `TYPE` int(10) DEFAULT '1' COMMENT '文件系统类型',
  `PATH` varchar(2000) NOT NULL DEFAULT 'D:/DocSysReposes' COMMENT '仓库所在的目录',
  `REAL_DOC_PATH` varchar(2000) DEFAULT NULL COMMENT 'RealDoc的存储路径',
  `REMOTE_STORAGE` varchar(5000) DEFAULT NULL COMMENT '远程存储配置',
  `VER_CTRL` int(2) NOT NULL DEFAULT '0' COMMENT 'RealDoc版本控制: 0:无版本控制 1:SVN 2:GIT',
  `IS_REMOTE` int(1) NOT NULL DEFAULT '1' COMMENT '0:本地版本仓库 1:远程版本仓库',
  `LOCAL_SVN_PATH` varchar(2000) DEFAULT NULL COMMENT '本地版本仓库所在目录',
  `SVN_PATH` varchar(2000) DEFAULT NULL COMMENT '远程版本仓库地址',
  `SVN_USER` varchar(50) DEFAULT NULL COMMENT '远程版本仓库访问用户名',
  `SVN_PWD` varchar(20) DEFAULT NULL COMMENT '远程版本仓库访问用户密码',
  `REVISION` varchar(100) DEFAULT NULL COMMENT 'RealDoc版本仓库版本号',
  `VER_CTRL1` int(2) NOT NULL DEFAULT '0' COMMENT 'VirtualDoc版本控制: 0:无版本控制 1:SVN 2:GIT',
  `IS_REMOTE1` int(1) NOT NULL DEFAULT '1' COMMENT '0:本地版本仓库 1:远程版本仓库',
  `LOCAL_SVN_PATH1` varchar(2000) DEFAULT NULL COMMENT '本地版本仓库所在目录',
  `SVN_PATH1` varchar(2000) DEFAULT NULL COMMENT '远程版本仓库地址',
  `SVN_USER1` varchar(50) DEFAULT NULL COMMENT '远程版本仓库访问用户名',
  `SVN_PWD1` varchar(20) DEFAULT NULL COMMENT '远程版本仓库访问用户密码',
  `REVISION1` varchar(100) DEFAULT NULL COMMENT 'VirtualDoc版本仓库版本号',
  `INFO` varchar(1000) DEFAULT NULL COMMENT '项目简介',
  `PWD` varchar(20) DEFAULT NULL COMMENT '仓库访问密码',
  `OWNER` int(11) DEFAULT NULL COMMENT '仓库所有人',
  `CREATE_TIME` bigint(20) DEFAULT '0' COMMENT '仓库创建时间',
  `STATE` int(1) NOT NULL DEFAULT '0' COMMENT '0: unlock 1: lock',
  `LOCK_BY` int(11) DEFAULT NULL COMMENT 'UserID用于给Repos上锁',
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT '仓库锁定时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `repos`
--
ALTER TABLE `repos`
  ADD PRIMARY KEY (`ID`);

--
-- 使用表AUTO_INCREMENT `repos`
--
ALTER TABLE `repos`
  MODIFY `ID` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键';


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
