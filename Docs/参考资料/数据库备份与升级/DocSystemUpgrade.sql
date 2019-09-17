alter table repos drop `MENU`;
alter table repos add `IS_REMOTE` int(1) NOT NULL DEFAULT '1' COMMENT '0:本地版本仓库 1:远程版本仓库';
alter table repos add  `LOCAL_SVN_PATH` varchar(200) DEFAULT NULL COMMENT '本地版本仓库所在目录';
alter table repos add `IS_REMOTE1` int(1) NOT NULL DEFAULT '1' COMMENT '0:本地版本仓库 1:远程版本仓库';
alter table repos add  `LOCAL_SVN_PATH1` varchar(200) DEFAULT NULL COMMENT '本地版本仓库所在目录';
