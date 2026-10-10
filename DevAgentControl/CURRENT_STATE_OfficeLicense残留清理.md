# CURRENT_STATE — OfficeLicense 残留代码清理（工作卡）

建立于 2026-10-10。**状态：已完成实现与验证，未提交（等用户确认）。**

> 上一任务「中英文页面一致性修复」已提交（`3021fe217 【BugFix】英文版页面修复`）并归档到 `DevAgentControl/已完成/`。

## 任务

清理 OfficeLicense 残留（用户 2026-10-10 裁定：「OfficeLicense 是以前残留的功能，代码可以删除了，但等这次解决完提交后再删」）。

## 范围与依据

**依据（为什么是残留）**：
- `git log` 显示 `WebRoot/manager/addOfficeLicense.html`、`WebRoot/manager/officeLicenseInfo.html` 是在 **`53f0fa3af 【NewFeature】【多国语言支持】管理后台`** 中被删除的，但 `main.js` 里对应的两个开窗函数被留下了。
- 引用面扫描（`%TEMP%\docsys_chk\scan_office_license.py` / `scan_office_license2.py`）：`showAddOfficeLicensePanel` / `showOfficeLicenseInfoPanel` / `OfficeLicenseInfoPageCallback` / `新增Office证书` 在 **WebRoot + src 全树零调用点**；`tmpl/systemLicenses.html`/`_en.html` 也没有 Office 证书行（只渲染 `{{value.systemLicense.status}}` 的「系统证书」行）。

**必须保留的活代码（不要删）**：
- `src/com/DocSystem/common/BaseFunction.java`：`officeLicenseInfo`（OSS 包初始化 `initOfficeLicenseInfo()`）
- `src/com/DocSystem/controller/ManageController.java:1518-1528`：把 `officeLicense` 放进 `getSystemLicenses.do` 响应
- `src/com/DocSystem/websocket/OfficeBase.java:842-862`：`checkLicense()` 用 `officeLicenseInfo`
- `src/com/DocSystem/websocket/BussinessBase.java` / `src/com/DocSystem/sales/SalesBase.java`：`verifyOfficeLicenseFile()`
- `main.js` 的 `showSystemLicenseInfoPanel()` / `SystemLicenseInfoPageCallback` / `lang` 里的 `获取证书列表失败`（都在用）

## 当前进展（如实）

### 已删除 4 处（WebRoot 内已无任何 `officeLicense` 引用）

| 位置 | 内容 | 理由 |
| --- | --- | --- |
| `WebRoot/manager/main.js`（原 7161-7172） | `showAddOfficeLicensePanel()` 整个函数 | 指向已删除的 `addOfficeLicense[_en].html`，零调用点 |
| `WebRoot/manager/main.js`（原 7352-7369） | `showOfficeLicenseInfoPanel()` 整个函数 | 指向已删除的 `officeLicenseInfo[_en].html`；其 `callback` 调用的 `OfficeLicenseInfoPageCallback` **全树未定义**（原定义在已删除的页面里） |
| `WebRoot/manager/main.js`（原 7516-7530） | `SystemLicensesDisplay()` 里给 `officeLicense` 算 `status` 的整段 | 模板只渲染「系统证书」行，`systemLicenses.officeLicense` **无任何渲染消费方**⇒ 死代码（后端响应字段照旧保留） |
| `WebRoot/web/lang/en.js`（917-918） | `//Office License` 注释 + `"新增Office证书" : "Add OfficeEidtor License"` | 该词条维一消费方就是上面被删的死函数（中文页 `_Lang` 回退用字面量，`lang/ch.js` 本就没有此键） |

改动量：`main.js` −48 行、`en.js` −3 行。

### 验证结果（PASS）

1. **残留归零**：`scan_office_license2.py` 复查 `showAddOfficeLicensePanel` / `showOfficeLicenseInfoPanel` / `OfficeLicenseInfoPageCallback` / `新增Office证书` / `Office证书` 全部 **0** 命中；`officeLicense` 只剩 `src/**` 后端活代码。
2. **语法**：`node --check WebRoot/manager/main.js` 与 `web/lang/en.js` 均 `exit=0`。
3. **回归 E2E（真实浏览器，绕缓存）**：中文 `manager/main.html` 与英文 `manager/main_en.html` 的「证书安装」页都照旧工作 —— `#systemLicenseStatus` 显示「未安装」、`详情/Detail` 按钮可用、点开后弹窗内容正常加载（未卡在「载入中」）、`SystemLicenseInfoPageCallback` 为函数；同时 `typeof showAddOfficeLicensePanel === 'undefined'`、`typeof showOfficeLicenseInfoPanel === 'undefined'`（证明死代码确实已移除）。

### 顺带发现（未改，待用户裁定）

英文后台「证书安装」页的状态列显示的是**中文**「未安装/已安装/已失效」—— 因为这些状态是 `main.js` 里硬编码的中文字面量（`systemLicense.status = "未安装";`），不是 `_Lang(...)`。属**翻译缺失**而非中英功能差异（中英都显示同一串中文），本次按范围纪律未动。

## 下一步

1. 汇报 + 等用户确认后提交
2. 提交后：把本卡移到 `DevAgentControl/已完成/`
3. 若用户要修上面那条翻译缺失：把 `SystemLicensesDisplay()` 里 3 个状态串改用 `_Lang("未安装","...","Not Installed")` 形式（单独做，不与本次混together）

## 生效约束

- **未获用户确认前不要提交**
- **不动后端**（`src/**` 的 `officeLicenseInfo` 全是活代码；本次只清 `WebRoot` 前端残留）
- 不顺手做其他清理（用户明确要求别把不相关改动混在一起）
- 静态文件经 junction 生效 ⇒ 无需编译、无需重启 Tomcat；前端 E2E 必须绕缓存
