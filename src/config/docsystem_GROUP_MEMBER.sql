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
-- 表的结构 `group_member`
--

CREATE TABLE `group_member` (
  `ID` int(11) NOT NULL COMMENT 'GroupMember ID',
  `GROUP_ID` int(11) DEFAULT NULL COMMENT 'GROUP ID',
  `USER_ID` int(11) DEFAULT NULL COMMENT 'USER ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `group_member`
--
ALTER TABLE `group_member`
  ADD PRIMARY KEY (`ID`);

--
-- 使用表AUTO_INCREMENT `group_member`
--
ALTER TABLE `group_member`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'GroupMember ID';


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
