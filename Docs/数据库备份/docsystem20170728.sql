-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2017 年 07 月 28 日 09:53
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
-- 表的结构 `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(40) NOT NULL,
  `password` varchar(40) NOT NULL,
  `email` varchar(50) NOT NULL DEFAULT '',
  `email_available` int(1) NOT NULL COMMENT '邮箱是否已验证',
  `phone` varchar(20) NOT NULL,
  `account_status` int(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `wiki_doc`
--

CREATE TABLE IF NOT EXISTS `wiki_doc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL COMMENT '文件或目录名称',
  `type` int(10) DEFAULT NULL COMMENT '1：目录 2：文件',
  `content` longtext COMMENT '文章内容',
  `path` varchar(1000) NOT NULL DEFAULT '/' COMMENT '基于仓库目录的相对路径',
  `pid` int(10) unsigned DEFAULT NULL COMMENT 'Parent Node id',
  `vid` int(10) unsigned DEFAULT NULL COMMENT '所属仓库id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=347 ;

-- --------------------------------------------------------

--
-- 表的结构 `wiki_project`
--

CREATE TABLE IF NOT EXISTS `wiki_project` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) DEFAULT NULL COMMENT '项目名',
  `type` int(10) DEFAULT '1' COMMENT '仓库存储类型：1-普通文件 2-svn',
  `path` varchar(1000) NOT NULL DEFAULT 'C:/' COMMENT '仓库所在的目录',
  `info` varchar(1000) DEFAULT NULL COMMENT '项目简介',
  `menu` varchar(10000) NOT NULL DEFAULT '[]',
  `edit_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=7 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
