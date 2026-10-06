# CURRENT_STATE_导出用户修复（工作卡）

> 状态：**已实施并验证（待用户确认提交）**（2026-10-06，D1~D3 已裁定）
> 方案文档：`devDocs/导出用户修复方案.md`（§1 取证 / §2 方案 / §3 裁定 / §4 实施 / §5 验证 / §6 发现的问题）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_用户批量导入.md`（已收尾，提交 `09ffeb19c`）

## 任务

修复「用户管理 → 导出」的格式问题，并新增 Excel 导出：

1. 去掉 `pwd`（密码哈希）与 `serialVersionUID` 列
2. 修复 `\t`（每个字符串值尾随 TAB）与 **无转义**（值里的 `,` `"` `\n` 会破坏结构）
3. **提供 xlsx 导出**（绕开 Excel 对纯数字列的类型猜测）

## 裁定（2026-10-06）

- **D1 列集合**：**客户友好列 + 跟随界面语言的中文列头**（导入别名表刚好认识这些列名 → **导出的文件能直接当导入模板回灌**）
  列：`用户ID,用户名,名字,昵称,手机,邮箱,角色,创建方式,创建时间,最后登录时间,最后登录IP,最后登录城市,网络限制,备注`
- **D2 导出入口**：**一个「导出」按钮 + 弹窗选格式**（CSV / Excel）
- **D3 xlsx 细节**：首行**加粗 + 冻结**、列宽自适应、`用户ID`/`手机` 等写**文本格式**；下载文件名**带时间戳**；角色列输出**中文文案**

## 现状关键结论（已核对源码）

- 导出接口：`POST /DocSystem/Bussiness/exportUserList.do`（**websocket 仓库** `BussinessController:5285`）→ 写 `<docSysIniPath>/backup/userList.csv` → 返回 `Doc/downloadDoc.do?...targetName=userList.csv` 链接 → 前端 `window.location.href`
- 格式成因：`BussinessController.exportUserListToCsvFile` 调 `LuceneUtil2.buildCsvTitleStrForObject/buildCsvStrForObject`（**反射全字段**；String 字段 `val + "\t,"`，无引号无转义）
- **影响面已确认安全**：`userList.csv` **没有**被系统迁移/备份等其它流程消费；`buildCsv{Title,}StrForObject` **只有用户导出**在用（SalesBase 用的是 `buildDocumentForObject`，不是 CSV 变体）→ 但二者仍是 `util` 层通用工具，**本次不改它们**，在 `BussinessController` 里改为**列白名单**式导出（反射做不到"去掉某些列"）
- 实测取证（10-06）：真实导出行 `...Admin<TAB>,<pwd哈希><TAB>,...`；造一条 `realName=张三,李四` 的用户 → 该行逗号数 23（表头 22 列）→ 按逗号切回来 `realName` 只拿到 `张三`，后面所有列**右移一格**
- POI 4.0.0 可用（xls/xlsx 都有）✅；前端多语言靠 `_Lang` + `web/lang/{ch,en}.js` ✅

## ⚠️ 实施中必须处理的联合验证点

**导出列头 ↔ 导入别名表必须不冲突**：
- 英文列头 `User ID` 归一化后是 `userid`，而 `UserListImporter` 的**账号别名表里含 `userid`** ✗ → 英文导出文件回灌时「账号」会被映射到数字 ID 列 ✗✗
- 处理：把 `userid` 从账号别名里**去掉**（它天然有歧义：UserId 更常指用户 ID；中文「用户ID」归一化成 `用户id` 不冲突 ✅），并在提示里保留其它明确的账号别名
- 必做回归：**中文导出文件 → 直接导入** 与 **英文导出文件 → 直接导入**，断言列映射与字段值正确

## 当前进展

- ✅ 后端：`BussinessController` 重写为**列白名单**导出（CSV 标准转义/无 `\t`；新增 xlsx：加粗+冻结+列宽自适应+文本单元格）；文件名毫秒时间戳 + 清理 24h 旧文件；空结果提示「没有可导出的用户！」
- ✅ 前端：`tmpl/user{,_en}.html` 按钮 → `showExportUserPanel()` + `exportUser{,_en}.html`/`exportUser.js`（弹窗选 CSV/Excel）；移除旧的 `exportUserConfirm`/`exportUserList`
- ✅ 导入侧同步：`UserListImporter` 去掉 `userid` 别名、角色识别补 `superadministrator`/`superuser`
- ✅ E2E 全通过（见方案文档 §5）：CSV 中文/英文均 14 列无 `\t`；xlsx POI 读回：冻结/加粗/列宽/**56 个数据单元格全为 STRING**；转义往返（`张三,李四`/`a"b` 导出→导入字段无损）；**导出的文件（中/英 CSV 与 xlsx）直接回灌导入全部跳过 4/4**；真实页面两个按钮都能触发下载
- 验证中发现并修：① `User ID` 与导入别名 `userid` 冲突 ② 导出角色文案 `Super Administrator` 导入不识别（导致英文回灌 2 条失败）③ 同秒导出同名覆盖 → 加毫秒 ④ 空结果文案

## 未提交改动（等用户确认）

- **websocket 仓库**：`src/com/DocSystem/websocket/BussinessController.java`
- **主仓库**：`WebRoot/manager/main.js`、`WebRoot/manager/tmpl/user.html`、`WebRoot/manager/tmpl/user_en.html`、新增 `WebRoot/manager/exportUser.html`/`exportUser_en.html`/`exportUser.js`、`src/com/DocSystem/common/UserListImporter.java`、`devDocs/导出用户修复方案.md`（新增）、本卡、`CLAUDE.md`

## 生效约束

- 编译不变量：`.class` 只进 `WebRoot/WEB-INF/classes`；Java 改动先编译再重启 dev（8100）
- **跨仓库**：websocket 仓库（`BussinessController.java`）与主仓库（前端 + 导入别名）**要分别提交**
- 探针/临时产物放 `%TEMP%\docsys_chk\`
- **不要自动提交**：改完 → 汇报 + 验证结果 → 等用户确认
