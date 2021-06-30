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
  `ACCESS` int(1) DEFAULT NULL,
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  `DOWNLOAD_EN` int(1) DEFAULT NULL,
  `UPLOAD_SIZE` bigint(20) DEFAULT NULL COMMENT '文件上传大小',
  `HERITABLE` int(1) NOT NULL DEFAULT '0' COMMENT '0:不可继承  1:可继承'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `repos_auth`
--
ALTER TABLE `repos_auth`
  ADD PRIMARY KEY (`ID`);

--
-- 使用表AUTO_INCREMENT `repos_auth`
--
ALTER TABLE `repos_auth`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
