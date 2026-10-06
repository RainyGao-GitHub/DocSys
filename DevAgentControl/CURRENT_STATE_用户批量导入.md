# CURRENT_STATE_用户批量导入（工作卡）

> 状态：**已实施并验证（M1~M4 完成，待用户确认提交）**（2026-10-06，D1~D12 已裁定）
> 方案文档：`devDocs/用户批量导入方案.md`（§3 设计 / §4 裁定结果 / §8 实施记录 + E2E 验证结果）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_日志导出.md`（已收尾）

## 任务

客户公司人员多，逐个「新增用户」工程量太大；客户通常有自己的用户名单，希望**直接导入名单批量创建用户**。
两个关键点（用户 2026-10-06 明确提出）：
1. 文件格式要支持：**csv / xls / xlsx**
2. 客户名单的**列名与我们系统并不对应**（中英混用、顺序不定、多出无关列）→ 解析必须尽量兼容

## 现状关键结论（已核对源码 + dev 实测）

- **已有「导出用户」**：`main.js exportUserList()` → `POST /DocSystem/Bussiness/exportUserList.do`
  （**接口在 websocket 仓库** `src/com/DocSystem/websocket/BussinessController.java:5285`；导出到 `docSysIniPath/backup/userList.csv`，再用 `Doc/downloadDoc.do` 链接下载）
  - 实测导出文件特征：列头 = `User` **反射全字段**（含 `serialVersionUID`，**尾随逗号**）；**字符串值尾随 `\t`**；**无引号/无转义**；**含 `pwd` 哈希**；列头为英文字段名
  - ⇒ 不能当对外模板；但导入解析要**兼容它**（trim `\t`、忽略未知列/尾随空列）
- 用户 CRUD 全在 **主仓库** `ManageController`：`addUser`（`login_user.type>=1`；`type>login_user.type` 越权拒绝；`checkSystemUsersCount` + `userCheck(user,true,true,rt)`；`createType=UserCreateType_ByAdmin`；写 `createTime`；记一条系统日志）、`editUser`、`delUser`（**硬删** + 清理 DocAuth/ReposAuth/GroupMember）、`resetPwd`（仅超管）
- `BaseController.userCheck`：账号非空/不重复；手机、邮箱**格式 + 唯一性**（LDAP 创建的用户不算占用）
- `checkSystemUsersCount` → `BusinessChannel.systemLicenseInfoCheck`：`geAllUsers().size() > usersCount` → 报「用户数量已达到上限」；**每次 addUser 都会调**（逐行导入时超限后其余行都会失败）
- 用户表 DDL（`BaseController:18295`）：**`PWD` NOT NULL**；长度上限 `NAME 40 / PWD 40 / REAL_NAME 50 / NICK_NAME 50 / EMAIL 50 / TEL 20` ⇒ 导入必须做**长度校验**（否则严格模式报错、非严格模式静默截断）
- 密码：前端 `addUser.js` 提交 **MD5(明文)**，服务端**原样入库**；服务端也可用 `MD5.md5`
- 可复用先例：文件上传（`spring-mvc.xml:57` 已配 multipart；`main.js:6908 startImportLicense` 的 FormData+XHR；隐藏 file input 在 `main.html:410-415`）、导入结果呈现（系统参数导入 `SysConfig/import.do` → `{total,success,failed,errors[]}`）、Excel（poi-4.0.0/poi-ooxml/poi-scratchpad 齐全；`.et` 可用 `FileUtil.detectOfficeActualFormat` 魔数判定）、编码（`FileCharsetDetector.getFileEncode(InputStream)`，缺省 GBK）、i18n（`_Lang` + `web/lang/{ch,en}.js`）

## 裁定（2026-10-06，用户逐条回复）

D1 csv+xls+xlsx+WPS `.et` 全支持｜D2 不支持无表头（报错提示期望列名）｜D3 已存在账号**只跳过并报告**（不做「更新」）｜D4 有密码列用它、否则默认密码 = 账号本身｜D5 角色列支持但受越权限制｜D6 一步式导入（预检留后续）｜D7 文件≤5MB、行≤5000｜D8 提供模板下载（CSV/UTF-8+BOM）｜D9 失败明细面板内滚动展示（下载明细可选）｜D10 系统日志汇总记一条｜D11 旧「导出用户」**本次不动，另立任务**｜D12 接口放主仓库 `ManageController`

## 当前进展

- **M1 ✅** 新增 `src/com/DocSystem/common/UserListImporter.java`（纯静态、无 Spring 依赖）：格式分发（csv/xls/xlsx/et）、CSV 编码识别（BOM→严格UTF-8→GBK）、标准 CSV 状态机（引号/转义/分隔符启发/值 trim 含 `\t`）、POI 读表（`DataFormatter`、`xxx.0` 还原、空行跳过）、列名归一化+主/次别名表+忽略未知列、角色文本→数字、手机归一化、长度校验、模板生成
  - 探针（产物在 `%TEMP%\docsys_chk\`，不进仓库）：**PASS=66 FAIL=0**；含**真实旧导出文件回灌**用例（`docSysIniPath/backup/userList.csv` 692B：尾随 `\t` 已清、`serialVersionUID` 未知列忽略、`type=2` 正确）
- **M2 ✅** `ManageController`：`POST /Manage/importUserList.do`（逐行校验/创建/结果/汇总日志）+ `GET /Manage/downloadUserImportTemplate.do`（同源生成模板）；已编译进 `WebRoot/WEB-INF/classes`
- **M3 ✅** 前端：「用户管理」加「批量导入」按钮 + `importUser{,_en}.html` + `importUser.js` + `main.html` 隐藏 file input + `main.js` 的 `showImportUserPanel()` + `en.js` 17 条词条；`node --check` 均通过
- **M4 ✅** E2E 全部通过（真实页面 + 真实文件）：中文GBK 3/3 成功；重复导入 3/3 跳过；错误合集逐行报错（超长/空账号/非法角色/手机重复）；**真实旧导出回灌 4/4 跳过**（日志可见列映射 name/pwd/realName/nickName/tel/email/type）；xlsx 2/2、xls 1/1；模板下载（text/csv + BOM + 7 列中文表头 + 示例行）；落库字段与角色正确（ct=ByAdmin，pwd 32 位 MD5）；**默认密码=账号可登录**（lisi/wangwu）与文件密码可登录（zhangsan/pwd123）；系统日志 6 条汇总；英文页对话框/结果面板全英文；未登录返回 JSON NOT_LOGIN
- **验证中发现并已修**：① `main_en.html` 漏了隐藏 file input（英文页无法选文件）→ 已补；② 解析异常溢漏 POI 英文原文 → 改为用户可操作的中文提示（原始异常只进日志）

## 遗留 / 待办

- **dev 库里残留一个测试账号 `wangwu`（超级管理员）**：产品的同级别保护规则（`delUser`/`editUser` 均有 `login_user.getId() != 0` 限制）导致 Admin(id=1) 删不掉它 → 需用户决定用 SQL 清掉还是保留；其它 5 个测试账号（lisi/zhangsan/zhaoliu/sunqi/qianba）已删除，用户数回到 5（Admin/test/test2/管理员测试 + wangwu）。
- 服务端失败原因仍为中文（英文页同）；证书上限文案含 HTML；「下载失败明细 CSV」与「已存在账号→更新」按裁定未做。
- 旧「导出用户」（含 pwd 哈希、值尾随 `\t`、无转义）按 D11 **另立任务**。

## 未提交改动（等用户确认）

`src/com/DocSystem/common/UserListImporter.java`（新）、`src/com/DocSystem/controller/ManageController.java`、`WebRoot/manager/{main.html,main_en.html,main.js,importUser.html,importUser_en.html,importUser.js,tmpl/user.html,tmpl/user_en.html}`、`WebRoot/web/lang/en.js`、`devDocs/用户批量导入方案.md`（新）、本卡、`CLAUDE.md`

## 生效约束（开工时）

- 编译不变量：`.class` 只进 `WebRoot/WEB-INF/classes`；Java 改动先编译再重启 dev（8100）
- 探针/临时产物放 `%TEMP%\docsys_chk\`；正式 fixture（需跟踪）才进 `office/test/测试文件/`
- 提交归属：导入接口/前端 → **主仓库**（`git -C D:/Dev/DocSys`）；若涉及 `Bussiness/`（websocket 仓库）需单独提交
- **不要自动提交**：改完 → 汇报 + 验证结果 → 等用户确认
