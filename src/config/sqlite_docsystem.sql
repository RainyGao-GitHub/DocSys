--
-- Database: `docsystem`
--

-- --------------------------------------------------------

--
-- 表的结构 `doc`
--
CREATE TABLE `doc` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(200) DEFAULT NULL,
  `TYPE` int(10) DEFAULT NULL,
  `SIZE` bigint(20) NOT NULL DEFAULT '0',
  `CHECK_SUM` varchar(32) DEFAULT NULL,
  `REVISION` varchar(100) DEFAULT NULL,
  `CONTENT` longtext,
  `PATH` varchar(2000) NOT NULL DEFAULT '',
  `DOC_ID` bigint(20) DEFAULT NULL,
  `PID` bigint(20) NOT NULL DEFAULT '0',
  `VID` int(11) DEFAULT NULL,
  `PWD` varchar(20) DEFAULT NULL,
  `CREATOR` int(11) DEFAULT NULL,
  `CREATE_TIME` bigint(20) NOT NULL DEFAULT '0',
  `LATEST_EDITOR` int(11) DEFAULT NULL,
  `LATEST_EDIT_TIME` bigint(20) DEFAULT '0'
);

-- --------------------------------------------------------

--
-- 表的结构 `doc_auth`
--

CREATE TABLE `doc_auth` (
  `ID` int(11) NOT NULL,
  `USER_ID` int(11) DEFAULT NULL,
  `GROUP_ID` int(11) DEFAULT NULL,
  `TYPE` int(1) DEFAULT NULL,
  `PRIORITY` int(1) NOT NULL DEFAULT '0',
  `DOC_ID` bigint(20) DEFAULT NULL,
  `REPOS_ID` int(11) NOT NULL DEFAULT '0',
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(1) NOT NULL DEFAULT '0',
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  `DOWNLOAD_EN` int(1) DEFAULT NULL,
  `UPLOAD_SIZE` bigint(20) UNSIGNED DEFAULT NULL COMMENT '文件上传大小',  
  `HERITABLE` int(1) NOT NULL DEFAULT '0',
  `DOC_PATH` varchar(2000) DEFAULT NULL,
  `DOC_NAME` varchar(200) DEFAULT NULL
  );

-- --------------------------------------------------------

--
-- 表的结构 `doc_share`
--

CREATE TABLE `doc_share` (
  `ID` int(11) NOT NULL,
  `SHARE_ID` int(11) NOT NULL,
  `NAME` varchar(200) DEFAULT NULL,
  `PATH` varchar(2000) NOT NULL DEFAULT '',
  `DOC_ID` bigint(20) DEFAULT NULL,
  `VID` int(11) DEFAULT NULL,
  `SHARE_AUTH` varchar(2000) DEFAULT NULL,
  `SHARE_PWD` varchar(20) DEFAULT NULL,
  `SHARED_BY` int(11) DEFAULT NULL,
  `EXPIRE_TIME` bigint(20) NOT NULL DEFAULT '0'
);

-- --------------------------------------------------------

--
-- 表的结构 `doc_lock`
--

CREATE TABLE `doc_lock` (
  `ID` int(11) NOT NULL,
  `TYPE` int(10) DEFAULT NULL,
  `NAME` varchar(200) DEFAULT NULL,
  `PATH` varchar(2000) NOT NULL DEFAULT '/',
  `DOC_ID` bigint(20) DEFAULT NULL,
  `PID` bigint(20) DEFAULT NULL,
  `VID` int(10) DEFAULT NULL,
  `STATE` int(1) NOT NULL DEFAULT '1',
  `LOCKER` varchar(200) DEFAULT NULL,
  `LOCK_BY` int(11) DEFAULT NULL,
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0'
);

-- --------------------------------------------------------

--
-- 表的结构 `group_member`
--

CREATE TABLE `group_member` (
  `ID` int(11) NOT NULL,
  `GROUP_ID` int(11) DEFAULT NULL,
  `USER_ID` int(11) DEFAULT NULL
);

-- --------------------------------------------------------

--
-- 表的结构 `repos`
--

CREATE TABLE `repos` (
  `ID` int(8) NOT NULL,
  `NAME` varchar(255) DEFAULT NULL,
  `TYPE` int(10) DEFAULT '1',
  `PATH` varchar(2000) NOT NULL DEFAULT 'D:/DocSysReposes',
  `REAL_DOC_PATH` varchar(2000) DEFAULT NULL,
  `VER_CTRL` int(2) NOT NULL DEFAULT '0',
  `IS_REMOTE` int(1) NOT NULL DEFAULT '1',
  `LOCAL_SVN_PATH` varchar(2000) DEFAULT NULL,
  `SVN_PATH` varchar(2000) DEFAULT NULL,
  `SVN_USER` varchar(50) DEFAULT NULL,
  `SVN_PWD` varchar(20) DEFAULT NULL,
  `REVISION` varchar(100) DEFAULT NULL,
  `VER_CTRL1` int(2) NOT NULL DEFAULT '0',
  `IS_REMOTE1` int(1) NOT NULL DEFAULT '1',
  `LOCAL_SVN_PATH1` varchar(2000) DEFAULT NULL,
  `SVN_PATH1` varchar(2000) DEFAULT NULL,
  `SVN_USER1` varchar(50) DEFAULT NULL,
  `SVN_PWD1` varchar(20) DEFAULT NULL,
  `REVISION1` varchar(100) DEFAULT NULL,
  `INFO` varchar(1000) DEFAULT NULL,
  `PWD` varchar(20) DEFAULT NULL,
  `OWNER` int(11) DEFAULT NULL,
  `CREATE_TIME` bigint(20) DEFAULT '0',
  `STATE` int(1) NOT NULL DEFAULT '0',
  `LOCK_BY` int(11) DEFAULT NULL,
  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0'
);

-- --------------------------------------------------------

--
-- 表的结构 `repos_auth`
--

CREATE TABLE `repos_auth` (
  `ID` int(11) NOT NULL,
  `USER_ID` int(11) DEFAULT NULL,
  `GROUP_ID` int(11) DEFAULT NULL,
  `TYPE` int(1) DEFAULT '0',
  `PRIORITY` int(1) DEFAULT '0',
  `REPOS_ID` int(11) DEFAULT NULL,
  `IS_ADMIN` int(1) DEFAULT NULL,
  `ACCESS` int(1) DEFAULT NULL,
  `EDIT_EN` int(1) DEFAULT NULL,
  `ADD_EN` int(1) DEFAULT NULL,
  `DELETE_EN` int(1) DEFAULT NULL,
  `DOWNLOAD_EN` int(1) DEFAULT NULL,
  `UPLOAD_SIZE` bigint(20) UNSIGNED DEFAULT NULL COMMENT '文件上传大小',
  `HERITABLE` int(1) NOT NULL DEFAULT '0'
);

-- --------------------------------------------------------

--
-- 表的结构 `role`
--

CREATE TABLE `role` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(50) NOT NULL,
  `ROLE_ID` int(11) NOT NULL
);

-- --------------------------------------------------------

--
-- 表的结构 `sys_config`
--

CREATE TABLE `sys_config` (
  `ID` int(11) NOT NULL,
  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',
  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1'
);

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE user (
    ID              INTEGER       NOT NULL
                                  PRIMARY KEY AUTOINCREMENT,
    NAME            VARCHAR (40)  DEFAULT NULL,
    PWD             VARCHAR (40)  NOT NULL,
    TYPE            INT (1)       NOT NULL
                                  DEFAULT '0',
    ROLE            INT (11)      DEFAULT NULL,
    REAL_NAME       VARCHAR (50)  DEFAULT NULL,
    NICK_NAME       VARCHAR (50)  DEFAULT NULL,
    INTRO           LONGTEXT,
    IMG             VARCHAR (200) DEFAULT NULL,
    EMAIL           VARCHAR (50)  DEFAULT '',
    EMAIL_VALID     INT (1)       NOT NULL
                                  DEFAULT '0',
    TEL             VARCHAR (20)  DEFAULT NULL,
    TEL_VALID       INT (1)       NOT NULL
                                  DEFAULT '0',
    LAST_LOGIN_TIME VARCHAR (50)  DEFAULT NULL,
    LAST_LOGIN_IP   VARCHAR (50)  DEFAULT NULL,
    LAST_LOGIN_CITY VARCHAR (100) DEFAULT NULL,
    CREATE_TYPE     INT (1)       NOT NULL
                                  DEFAULT '0',
    CREATE_TIME     VARCHAR (50)  DEFAULT NULL
);

-- --------------------------------------------------------

--
-- 表的结构 `user_group`
--

CREATE TABLE `user_group` (
  `ID` int(11) NOT NULL,
  `NAME` varchar(200) DEFAULT NULL,
  `TYPE` int(1) DEFAULT NULL,
  `INFO` varchar(1000) DEFAULT NULL,
  `IMG` varchar(200) DEFAULT NULL,
  `PRIORITY` int(2) DEFAULT NULL,
  `CREATE_TIME` varchar(50) DEFAULT NULL
);

