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
-- 表的结构 `doc`
--

CREATE TABLE `doc` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(300) DEFAULT NULL COMMENT '文件或目录名称',
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `SIZE` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT '文件大小',
  `CHECK_SUM` varchar(32) DEFAULT NULL COMMENT '文件的MD5校验值',
  `REVISION` varchar(100) DEFAULT NULL COMMENT 'RealDoc Revision',
  `CONTENT` varchar(10000) DEFAULT NULL COMMENT 'doc''s virtual content',
  `PATH` varchar(6000) NOT NULL DEFAULT '' COMMENT '基于仓库目录的相对路径',
  `DOC_ID` bigint(20) DEFAULT NULL COMMENT 'Doc Node id',
  `PID` bigint(20) NOT NULL DEFAULT '0' COMMENT 'Parent Node id',
  `VID` int(11) DEFAULT NULL COMMENT '所属仓库id',
  `PWD` varchar(20) DEFAULT NULL,
  `CREATOR` int(11) DEFAULT NULL,
  `CREATE_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT 'Doc CreateTime',
  `LATEST_EDITOR` int(11) DEFAULT NULL,
  `LATEST_EDIT_TIME` bigint(20) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `doc`
--
ALTER TABLE `doc`
  ADD PRIMARY KEY (`ID`);


--
-- 使用表AUTO_INCREMENT `doc`
--
ALTER TABLE `doc`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
