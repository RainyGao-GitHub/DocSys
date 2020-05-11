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
-- 表的结构 `DOC_LOCK`
--

CREATE TABLE `DOC_LOCK` (
  `ID` int(11) NOT NULL,
  `TYPE` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `NAME` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `PATH` varchar(2000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `DOC_ID` bigint(20) DEFAULT NULL COMMENT 'Doc Node id',
  `PID` bigint(20) DEFAULT NULL COMMENT 'Parent Node id',
  `VID` int(10) UNSIGNED DEFAULT NULL COMMENT '所属仓库id',
  `STATE` int(1) NOT NULL DEFAULT '1' COMMENT 'Doc LockState 0:unlock  1:lock doc 2:lock doc and subDocs',
  `LOCKER` varchar(200) DEFAULT NULL COMMENT 'LockerName',
  `LOCK_BY` int(11) UNSIGNED DEFAULT NULL COMMENT 'UserID用于给Doc上锁',
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0' COMMENT '文件锁定时间，该参数用于Lock的自动解锁'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `DOC_LOCK`
--
ALTER TABLE `DOC_LOCK`
  ADD PRIMARY KEY (`ID`);
  

--
-- 使用表AUTO_INCREMENT `DOC_LOCK`
--
ALTER TABLE `DOC_LOCK`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
