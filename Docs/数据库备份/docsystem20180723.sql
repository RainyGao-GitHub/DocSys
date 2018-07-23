-- phpMyAdmin SQL Dump
-- version 4.8.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 2018-07-23 15:46:10
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

--
-- 转存表中的数据 `doc`
--

INSERT INTO `doc` (`ID`, `NAME`, `TYPE`, `SIZE`, `CHECK_SUM`, `CONTENT`, `PATH`, `PID`, `VID`, `PWD`, `CREATOR`, `CREATE_TIME`, `LATEST_EDITOR`, `LATEST_EDIT_TIME`, `STATE`, `LOCK_BY`, `LOCK_TIME`) VALUES
(31, '资料转移.EXE', 1, 0, '', NULL, '', 0, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(32, 'CommitFailTest.xlsx', 1, 0, '', NULL, '', 0, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(33, 'catalina.log', 1, 0, '', NULL, '', 0, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(34, 'OpenOffice 4.1.5 (zh-CN) Installation Files', 2, 0, '', '#OpenOffice 4.1.5 (zh-CN) Installation Files', '', 0, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(35, 'openoffice1.cab', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(36, 'openoffice415.msi', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(37, 'setup.exe', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(38, 'setup.ini', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(39, 'licenses', 2, 0, '', '#licenses', 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(40, 'LICENSE', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/licenses/', 39, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(41, 'NOTICE', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/licenses/', 39, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(42, 'readmes', 2, 0, '', '#readmes', 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(43, 'readme_zh-CN.html', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/readmes/', 42, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(44, 'readme_zh-CN.txt', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/readmes/', 42, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(45, 'redist', 2, 0, '', '#redist', 'OpenOffice 4.1.5 (zh-CN) Installation Files/', 34, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(46, 'vcredist_x64.exe', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/redist/', 45, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(47, 'vcredist_x86.exe', 1, 0, '', NULL, 'OpenOffice 4.1.5 (zh-CN) Installation Files/redist/', 45, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(48, '（中文 ）@#、、ddddddd 中文(fdfd).docx', 1, 0, '', NULL, '', 0, 10, NULL, NULL, 0, 0, 0, 0, 0, 0),
(1094, '1111', 2, 0, NULL, '#1111', '', 0, 9, NULL, 5, 1532186835122, NULL, 0, 0, 0, 0),
(1095, 'CommitFailTest.xlsx', 1, 0, NULL, NULL, '1111/', 1094, 9, NULL, 5, 1532186835492, NULL, 0, 0, 0, 0),
(1096, 'ddddddd+fdfd.docx', 1, 0, NULL, NULL, '1111/', 1094, 9, NULL, 5, 1532186835792, NULL, 0, 0, 0, 0),
(1097, 'docs   ystem.sql', 1, 0, NULL, NULL, '1111/', 1094, 9, NULL, 5, 1532186836031, NULL, 0, 0, 0, 0),
(1098, '222', 2, 0, NULL, '#222', '1111/', 1094, 9, NULL, 5, 1532186836218, NULL, 0, 0, 0, 0),
(1099, '3333', 2, 0, NULL, '#3333', '1111/222/', 1098, 9, NULL, 5, 1532186836437, NULL, 0, 0, 0, 0),
(1100, '3333', 2, 0, NULL, '#3333', '1111/222/3333/', 1099, 9, NULL, 5, 1532186836706, NULL, 0, 0, 0, 0),
(1101, '3333', 2, 0, NULL, '#3333', '1111/222/3333/3333/', 1100, 9, NULL, 5, 1532186837065, NULL, 0, 0, 0, 0),
(1102, '3333', 2, 0, NULL, '#3333', '1111/222/3333/3333/3333/', 1101, 9, NULL, 5, 1532186837385, NULL, 0, 0, 0, 0),
(1103, '3333', 2, 0, NULL, '#3333', '1111/222/3333/3333/3333/3333/', 1102, 9, NULL, 5, 1532186837634, NULL, 0, 0, 0, 0),
(1104, '3333', 2, 0, NULL, '#3333', '1111/222/3333/3333/3333/3333/3333/', 1103, 9, NULL, 5, 1532186837905, NULL, 0, 0, 0, 0),
(1105, '3333', 2, 0, NULL, '#3333', '1111/222/3333/3333/3333/3333/3333/3333/', 1104, 9, NULL, 5, 1532186838200, NULL, 0, 0, 0, 0),
(1106, '7777333', 2, 0, NULL, '#7777333', '1111/222/3333/3333/3333/3333/3333/3333/3333/', 1105, 9, NULL, 5, 1532186838459, NULL, 0, 0, 0, 0),
(1107, 'redist_17.zip', 1, 0, NULL, NULL, '1111/222/3333/3333/3333/3333/3333/3333/3333/7777333/', 1106, 9, NULL, 5, 1532186838920, NULL, 0, 0, 0, 0),
(1108, '3333', 2, 0, NULL, '#3333', '', 0, 9, NULL, 5, 1532187178731, NULL, 0, 0, 0, 0),
(1109, '1111111111111111.txt', 1, 181, '0', NULL, '3333/', 1108, 9, NULL, 5, 1532187179031, NULL, 0, 0, 0, 0),
(1110, 'docsystem20180721.sql', 1, 9169, '0', NULL, '3333/', 1108, 9, NULL, 5, 1532187179306, NULL, 0, 0, 0, 0),
(1111, 'catalina.log', 1, 1184747899, '0', NULL, '3333/', 1108, 9, NULL, 5, 1532188970893, NULL, 0, 0, 0, 0),
(1112, '1111', 2, 0, '', '#1111', '3333/', 1108, 9, NULL, 5, 1532241121930, NULL, 0, 0, 0, 0),
(1113, 'CommitFailTest.xlsx', 1, 19275, '0', NULL, '3333/1111/', 1112, 9, NULL, 5, 1532241123213, NULL, 0, 0, 0, 0),
(1114, 'ddddddd+fdfd.docx', 1, 10228, '0', NULL, '3333/1111/', 1112, 9, NULL, 5, 1532241123514, NULL, 0, 0, 0, 0),
(1115, 'docs   ystem.sql', 1, 9113, '0', NULL, '3333/1111/', 1112, 9, NULL, 5, 1532241123796, NULL, 0, 0, 0, 0),
(1116, '222', 2, 0, '', '#222', '3333/1111/', 1112, 9, NULL, 5, 1532241124154, NULL, 0, 0, 0, 0),
(1117, '3333', 2, 0, '', '#3333', '3333/1111/222/', 1116, 9, NULL, 5, 1532241124379, NULL, 0, 0, 0, 0),
(1118, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/', 1117, 9, NULL, 5, 1532241124730, NULL, 0, 0, 0, 0),
(1119, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/3333/', 1118, 9, NULL, 5, 1532241124994, NULL, 0, 0, 0, 0),
(1120, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/3333/3333/', 1119, 9, NULL, 5, 1532241125316, NULL, 0, 0, 0, 0),
(1121, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/3333/3333/3333/', 1120, 9, NULL, 5, 1532241125617, NULL, 0, 0, 0, 0),
(1122, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/3333/3333/3333/3333/', 1121, 9, NULL, 5, 1532241125972, NULL, 0, 0, 0, 0),
(1123, '3333', 2, 0, '', '#3333', '3333/1111/222/3333/3333/3333/3333/3333/3333/', 1122, 9, NULL, 5, 1532241126328, NULL, 0, 0, 0, 0),
(1124, '7777333', 2, 0, '', '#7777333', '3333/1111/222/3333/3333/3333/3333/3333/3333/3333/', 1123, 9, NULL, 5, 1532241126653, NULL, 0, 0, 0, 0),
(1125, 'redist_17.zip', 1, 9646651, '0', NULL, '3333/1111/222/3333/3333/3333/3333/3333/3333/3333/7777333/', 1124, 9, NULL, 5, 1532241127149, NULL, 0, 0, 0, 0),
(1126, '3333', 2, 0, '', '#3333', '3333/', 1108, 9, NULL, 5, 1532243069776, NULL, 0, 0, 0, 0),
(1127, '1111111111111111.txt', 1, 181, '0', NULL, '3333/3333/', 1126, 9, NULL, 5, 1532243070077, NULL, 0, 0, 0, 0),
(1128, 'catalina.log', 1, 1184747899, '0', NULL, '3333/3333/', 1126, 9, NULL, 5, 1532243088777, NULL, 0, 2, 5, 1532329488777),
(1129, 'js-spark-md5-master.zip', 1, 55398, '0', NULL, '', 0, 9, NULL, 5, 1532272517012, NULL, 0, 0, 0, 0),
(1130, '3333', 2, 0, '', '#3333', '1111/', 1094, 9, NULL, 5, 1532272529330, NULL, 0, 0, 0, 0),
(1131, '1111111111111111.txt', 1, 181, '0', NULL, '1111/3333/', 1130, 9, NULL, 5, 1532272529818, NULL, 0, 0, 0, 0),
(1132, 'js-spark-md5-master.zip', 1, 55398, '0', NULL, '1111/', 1094, 9, NULL, 5, 1532272825252, NULL, 0, 0, 0, 0),
(1133, '命题稿.doc', 1, 52224, '0', NULL, '', 0, 9, NULL, 5, 1532274451581, NULL, 0, 0, 0, 0),
(1134, '二.mp4', 1, 11548668, '0', NULL, '', 0, 9, NULL, 5, 1532274488726, NULL, 0, 0, 0, 0),
(1135, '三.mp4', 1, 8844990, '0', NULL, '', 0, 9, NULL, 5, 1532274546731, NULL, 0, 0, 0, 0),
(1136, '四.mp4', 1, 4520409, '0', NULL, '', 0, 9, NULL, 5, 1532274548245, NULL, 0, 0, 0, 0),
(1137, '五.mp4', 1, 4939199, '0', NULL, '', 0, 9, NULL, 5, 1532274549853, NULL, 0, 0, 0, 0),
(1138, 'IMG_8689.JPG', 1, 7399326, '0', NULL, '', 0, 9, NULL, 5, 1532274662623, NULL, 0, 0, 0, 0),
(1139, 'IMG_8690.JPG', 1, 7271949, '0', NULL, '', 0, 9, NULL, 5, 1532274664403, NULL, 0, 0, 0, 0),
(1140, 'IMG_8691.JPG', 1, 6833170, '0', NULL, '', 0, 9, NULL, 5, 1532274666136, NULL, 0, 0, 0, 0),
(1141, 'IMG_8692.JPG', 1, 7411012, '0', NULL, '', 0, 9, NULL, 5, 1532274694497, NULL, 0, 0, 0, 0),
(1142, 'IMG_8693.JPG', 1, 7162103, '0', NULL, '', 0, 9, NULL, 5, 1532274722937, NULL, 0, 0, 0, 0),
(1143, 'IMG_8694.JPG', 1, 7772874, '0', NULL, '', 0, 9, NULL, 5, 1532274748600, NULL, 0, 0, 0, 0),
(1144, 'IMG_8696.JPG', 1, 6216232, '0', NULL, '', 0, 9, NULL, 5, 1532274798639, NULL, 0, 0, 0, 0),
(1145, 'IMG_8700.JPG', 1, 6183163, '0', NULL, '', 0, 9, NULL, 5, 1532274800309, NULL, 0, 0, 0, 0),
(1146, 'IMG_8701.JPG', 1, 6133879, '0', NULL, '', 0, 9, NULL, 5, 1532274801606, NULL, 0, 0, 0, 0),
(1147, 'IMG_8702.JPG', 1, 6417308, '0', NULL, '', 0, 9, NULL, 5, 1532274802932, NULL, 0, 0, 0, 0),
(1148, 'IMG_8703.JPG', 1, 6466482, '0', NULL, '', 0, 9, NULL, 5, 1532274804493, NULL, 0, 0, 0, 0),
(1149, 'IMG_8704.JPG', 1, 6201670, '0', NULL, '', 0, 9, NULL, 5, 1532274805851, NULL, 0, 0, 0, 0),
(1150, 'IMG_8705.JPG', 1, 6478470, '0', NULL, '', 0, 9, NULL, 5, 1532274807350, NULL, 0, 0, 0, 0),
(1151, 'IMG_8706.JPG', 1, 6802411, '0', NULL, '', 0, 9, NULL, 5, 1532274808849, NULL, 0, 0, 0, 0),
(1152, 'IMG_8707.JPG', 1, 6174949, '0', NULL, '', 0, 9, NULL, 5, 1532274810317, NULL, 0, 0, 0, 0),
(1153, 'IMG_8708.JPG', 1, 7020448, '0', NULL, '', 0, 9, NULL, 5, 1532274811815, NULL, 0, 0, 0, 0),
(1154, 'IMG_8709.JPG', 1, 6924955, '0', NULL, '', 0, 9, NULL, 5, 1532274813814, NULL, 0, 0, 0, 0),
(1155, 'IMG_8710.JPG', 1, 6199261, '0', NULL, '', 0, 9, NULL, 5, 1532274815257, NULL, 0, 0, 0, 0),
(1156, 'IMG_8711.JPG', 1, 6201006, '0', NULL, '', 0, 9, NULL, 5, 1532274816694, NULL, 0, 0, 0, 0),
(1157, 'IMG_8712.JPG', 1, 6351045, '0', NULL, '', 0, 9, NULL, 5, 1532274818130, NULL, 0, 0, 0, 0),
(1158, 'IMG_8713.JPG', 1, 7133187, '0', NULL, '', 0, 9, NULL, 5, 1532274819732, NULL, 0, 0, 0, 0),
(1159, 'IMG_8714.JPG', 1, 6844326, '0', NULL, '', 0, 9, NULL, 5, 1532274821215, NULL, 0, 0, 0, 0),
(1160, 'IMG_8715.JPG', 1, 7324878, '0', NULL, '', 0, 9, NULL, 5, 1532274822682, NULL, 0, 0, 0, 0),
(1161, 'IMG_8716.JPG', 1, 7329524, '0', NULL, '', 0, 9, NULL, 5, 1532274824463, NULL, 0, 0, 0, 0),
(1162, 'IMG_8717.JPG', 1, 6310171, '0', NULL, '', 0, 9, NULL, 5, 1532274825993, NULL, 0, 0, 0, 0),
(1163, 'IMG_8718.JPG', 1, 6227074, '0', NULL, '', 0, 9, NULL, 5, 1532274827851, NULL, 0, 0, 0, 0),
(1164, 'IMG_8719.JPG', 1, 6718984, '0', NULL, '', 0, 9, NULL, 5, 1532274829256, NULL, 0, 0, 0, 0),
(1165, 'IMG_8721.JPG', 1, 5823774, '0', NULL, '', 0, 9, NULL, 5, 1532274830677, NULL, 0, 0, 0, 0),
(1166, 'IMG_8722.JPG', 1, 6519653, '0', NULL, '', 0, 9, NULL, 5, 1532274832082, NULL, 0, 0, 0, 0),
(1167, 'IMG_8723.JPG', 1, 6589818, '0', NULL, '', 0, 9, NULL, 5, 1532274833689, NULL, 0, 0, 0, 0),
(1168, 'IMG_8724.JPG', 1, 7232198, '0', NULL, '', 0, 9, NULL, 5, 1532274835234, NULL, 0, 0, 0, 0),
(1169, 'IMG_8725.JPG', 1, 7159224, '0', NULL, '', 0, 9, NULL, 5, 1532274836806, NULL, 0, 0, 0, 0),
(1170, 'IMG_8726.JPG', 1, 6996404, '0', NULL, '', 0, 9, NULL, 5, 1532274838399, NULL, 0, 0, 0, 0),
(1171, 'IMG_8727.JPG', 1, 6698755, '0', NULL, '', 0, 9, NULL, 5, 1532274839919, NULL, 0, 0, 0, 0),
(1172, 'IMG_8728.JPG', 1, 7021528, '0', NULL, '', 0, 9, NULL, 5, 1532274843567, NULL, 0, 0, 0, 0),
(1173, 'IMG_8729.JPG', 1, 6656824, '0', NULL, '', 0, 9, NULL, 5, 1532274845074, NULL, 0, 0, 0, 0),
(1174, 'IMG_8730.JPG', 1, 7250449, '0', NULL, '', 0, 9, NULL, 5, 1532274846979, NULL, 0, 0, 0, 0),
(1175, 'IMG_8731.JPG', 1, 7025139, '0', NULL, '', 0, 9, NULL, 5, 1532274848447, NULL, 0, 0, 0, 0),
(1176, 'IMG_8732.JPG', 1, 6954866, '0', NULL, '', 0, 9, NULL, 5, 1532274850194, NULL, 0, 0, 0, 0),
(1177, 'IMG_8733.JPG', 1, 6851938, '0', NULL, '', 0, 9, NULL, 5, 1532274851724, NULL, 0, 0, 0, 0),
(1178, 'IMG_8734.JPG', 1, 7047827, '0', NULL, '', 0, 9, NULL, 5, 1532274853114, NULL, 0, 0, 0, 0),
(1179, 'IMG_8735.JPG', 1, 7040576, '0', NULL, '', 0, 9, NULL, 5, 1532274854802, NULL, 0, 0, 0, 0),
(1180, 'IMG_8736.JPG', 1, 7496511, '0', NULL, '', 0, 9, NULL, 5, 1532274856694, NULL, 0, 0, 0, 0),
(1181, 'IMG_8737.JPG', 1, 6404622, '0', NULL, '', 0, 9, NULL, 5, 1532274858399, NULL, 0, 0, 0, 0);

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

--
-- 转存表中的数据 `doc_auth`
--

INSERT INTO `doc_auth` (`ID`, `USER_ID`, `GROUP_ID`, `TYPE`, `PRIORITY`, `DOC_ID`, `REPOS_ID`, `IS_ADMIN`, `ACCESS`, `EDIT_EN`, `ADD_EN`, `DELETE_EN`, `HERITABLE`) VALUES
(1, 5, NULL, 1, 10, 0, 9, 1, 1, 1, 1, 1, 1),
(3, 5, NULL, 1, 10, 0, 10, 1, 1, 1, 1, 1, 1);

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

--
-- 转存表中的数据 `repos`
--

INSERT INTO `repos` (`ID`, `NAME`, `TYPE`, `PATH`, `VER_CTRL`, `SVN_PATH`, `SVN_USER`, `SVN_PWD`, `VER_CTRL1`, `SVN_PATH1`, `SVN_USER1`, `SVN_PWD1`, `INFO`, `MENU`, `PWD`, `OWNER`, `CREATE_TIME`) VALUES
(9, '222', 1, 'D:/DocSysReposes/', 1, 'file:///D:/DocSysSvnReposes/9', '', '', 1, 'file:///D:/DocSysSvnReposes/9_VRepos', '', '', '2222', NULL, NULL, 5, 0),
(10, '444', 1, 'D:/DocSysReposes/', 1, 'file:///D:/DocSysSvnReposes/10', '', '', 1, 'file:///D:/DocSysSvnReposes/10_VRepos', '', '', '5555', NULL, NULL, 5, 0);

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

--
-- 转存表中的数据 `repos_auth`
--

INSERT INTO `repos_auth` (`ID`, `USER_ID`, `GROUP_ID`, `TYPE`, `PRIORITY`, `REPOS_ID`, `IS_ADMIN`, `ACCESS`, `EDIT_EN`, `ADD_EN`, `DELETE_EN`, `HERITABLE`) VALUES
(89, 5, NULL, 1, 10, 9, 1, 1, 1, 1, 1, 0),
(90, 5, NULL, 1, 10, 10, 1, 1, 1, 1, 1, 0);

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

--
-- 转存表中的数据 `user`
--

INSERT INTO `user` (`ID`, `NAME`, `PWD`, `TYPE`, `ROLE`, `REAL_NAME`, `NICK_NAME`, `INTRO`, `IMG`, `EMAIL`, `EMAIL_VALID`, `TEL`, `TEL_VALID`, `LAST_LOGIN_TIME`, `LAST_LOGIN_IP`, `LAST_LOGIN_CITY`, `CREATE_TYPE`, `CREATE_TIME`) VALUES
(5, '13777479349', 'e10adc3949ba59abbe56e057f20f883e', 2, NULL, NULL, NULL, NULL, NULL, '', 0, '13777479349', 1, NULL, NULL, NULL, 1, '2018-06-30 20:20:44');

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
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1182;

--
-- 使用表AUTO_INCREMENT `doc_auth`
--
ALTER TABLE `doc_auth`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `group_member`
--
ALTER TABLE `group_member`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'GroupMember ID';

--
-- 使用表AUTO_INCREMENT `repos`
--
ALTER TABLE `repos`
  MODIFY `ID` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键', AUTO_INCREMENT=11;

--
-- 使用表AUTO_INCREMENT `repos_auth`
--
ALTER TABLE `repos_auth`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

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
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用表AUTO_INCREMENT `user_group`
--
ALTER TABLE `user_group`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
