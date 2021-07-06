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
  `INTRO` varchar(10000) DEFAULT NULL,
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
-- Indexes for dumped tables
--

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `id` (`ID`);

--
-- 使用表AUTO_INCREMENT `user`
--
ALTER TABLE `user`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
