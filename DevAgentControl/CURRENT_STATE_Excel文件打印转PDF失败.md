# CURRENT_STATE_Excel文件打印转PDF失败（缺陷卡）

> 状态：**根因定位 + 方案 A 修复完成 + 命令行验证通过（2026-11-20），待 Eclipse touch/重启/服务端实测/提交**
> 归属：**GraalJS 引擎配置缺陷**——`js.nashorn-compat` 把 ECMAScript 版本压到 5（无原生 Promise）→ sdkjs 装入自制 Promise 垫片 → 垫片调度依赖空桩 setTimeout → 异步初始化链死亡。非 Java 转换链逻辑缺陷、非 sdkjs 上游缺陷。
> 修复：`JSEngineFactory.sharedGraalEngine()` 显式加 `.option("js.ecmascript-version", "latest")`（4 行，纯引擎配置增量——sdkjs 文件与移植逻辑零改动）。

## 一句话

Excel 文件右键"更多-打印"失败：服务端静态链 xlsx→xlst bin→pdf.bin→PDF 在 GraalJS 里执行 sdkjs `asc_nativeCalculateFile` 时 `this.zc.Lbi()` 抛 `TypeError: null has no such function "Lbi"`。根因：**`js.nashorn-compat=true`（Nashorn 迁移遗留）默认把 ecmascript-version 压到 5**——ES5 没有原生 Promise，sdkjs 的 Closure polyfill 注册器（`nh("Promise",...)`，factory 首行 `if(Ha)return Ha`）检测到无 Promise 便装入自制垫片 `Da`，而 Da 的回调调度器在模块加载时按值捕获了 `kh.setTimeout`（native.js:301 空桩）→ 所有 Promise 异步链永不执行 → cell 编辑器工作簿渲染器 `zc`（由打开后的 `Omi→Gwg(...).then(Jf,Jf)` 异步创建）永远 null。C++ x2t 的 V8 是完整 ES6+，原生 Promise 存在、垫片不装，一切正常——同文件同 js 实测 58032B PDF 成功。

## 现象与范围

- 触发：仓库 1 `Excel文件预览失败/JS调用测试.xlsx`（docId=202961153533）右键 更多-打印
- 链路：getDocFileLink(preview:print) → convertDocToPdfEx → convertOfficeFileToPdf → 257→513：fromXlsxDir → fromXlsbXlsxDir → fromXlstBin:6078 → doct_bin2pdf:3104 → `asc_nativeCalculateFile` → `yd.Jmi`（min 版）→ `this.zc.Lbi()` 炸
- **通用**：任一 xlsx 都炸（AutoFilter 回归产物同款错误）——所有 Excel 静态转 PDF 从未通过
- **非回归**：`fcb982f7^`（Word 保存卡修复前基线）同样失败；与本会话此前修复无关
- **不受影响的路径**：另存为PDF（浏览器渲染，前端 pdf.bin→bin2pdf 纯 Java）；编辑保存链（bin→xlsx 只用文档模型 fk）；Word/PPT（其服务端路径不依赖 Promise 异步初始化）

## 根因链（全部实证，含两次修正）

1. `JSEngineFactory.sharedGraalEngine()`：`Engine.newBuilder().option("js.nashorn-compat","true")`——GraalJS 的 nashorn-compat 模式**默认 ecmascript-version=5**（对齐 Nashorn ES5.1）。
2. ES5 无原生 Promise → sdkjs（min 版 `nh("Promise", polyfill)`）检测 `kh["Promise"]===undefined` → 安装自制 Promise `Da`。**探针实证**：真实上下文 `String(Promise)===function Da(...)`。
3. `Da` 的 settle 派发：`fui() → Md.RIh(cb) → SIh(fn) → de(fn,0)`，其中 `var de=kh.setTimeout` 在**模块加载时按值捕获**了 native.js:301 的空桩 `function(){}` → 回调入队后永远无人执行。
4. cell 编辑器 `Omi` 初始化末尾 `Gwg(...).then(Jf,Jf)`，`Jf` 创建 `zc=new AscCommonExcel.rTc(...)`（渲染器）——永不执行 → 打开后 `Asc.editor.zc=NULL`（探针实证，fk=Y 正常）。
5. PDF 保存阶段 `asc_nativeCalculateFile → Jmi → this.zc.Lbi()` → TypeError → ret=-2147216560。
6. C++ x2t（V8 完整 ES6+）：原生 Promise 在 → polyfill 不装（factory 首行 `if(Ha)return Ha`）→ V8 栈空自动排干微任务 → zc 正常 → 58032B PDF 成功。

### 排查过程中的两次根因修正（防再踩）

- **修正 1**：最初判断"GraalJS 跨 polyglot 调用不排干微任务"——**错**。独立最小 Context 探针（默认选项）证明引擎排干完全正常（mt=2）；真实环境 mt=0 测的是**已被垫片替换的 Promise**，不是引擎原生。
- **修正 2**：怀疑 setTimeout 空桩后，尝试脚本尾部注入"同步化 setTimeout 适配器"——无效，因 `de` 在模块加载时**按值捕获**了旧引用；且真正问题是让垫片根本不装（对齐 V8），而非救活垫片。

## 修复（方案 A，office 仓库 1 文件 4 行）

`JSEngineFactory.sharedGraalEngine()` 在 `js.nashorn-compat` 之后显式加：
```java
.option("js.ecmascript-version", "latest")
```
带约束注释（为何必须显式提升：nashorn-compat 的 ES5 默认 → 垫片 → 空桩调度死链）。sdkjs 文件零改动、移植逻辑零改动。

## 验证（2026-11-20 命令行）

| 项 | 结果 |
|---|---|
| 目标场景 JS调用测试.xlsx 257→513 | **ret=0、62817B %PDF-1.7**（页数 1=1 与 C++ x2t 一致、TJ 文本操作符、%%EOF 完整；C++ 产物 58032B 量级一致） |
| 第二个 xlsx（AutoFilter 回归产物）257→513 | ret=0、637732B |
| xls 老格式（圆图202506对账.xls）258→513 | ret=0、133808B |
| word 保存链（操作手册 withchanges 8193→65） | ret=0、2921866B（与修复前仅差时间戳） |
| word 打印链（8193→513 withchanges） | ret=0、2456209B（与修复前逐字节一致） |
| ppt 保存链（S1 fixture 8195→129 withchanges） | ret=0、29825B（与修复前逐字节一致） |
| xlsx 保存链（AutoFilter fixture 8194→257 withchanges） | ret=0、96463B——**差异为有益修复**：旧引擎产物丢 definedNames（`_xlnm._FilterDatabase`×4）、丢 `<autoFilter ref="D1:D299">`+筛选值、activeTab 归零；新引擎全部正确写出（该丢失为 ES5 垫片时期的隐性内容损失，顺带修复） |
| verify_doc_pipeline -Fast | **全 PASS**（打开链/tblGrid/multisect/VML/保存链/保存回环，退出码 0） |

## 遗留（用户侧动作）

1. Eclipse touch JSEngineFactory + 重启 dev
2. 服务端实测：右键 更多-打印 `Excel文件预览失败/JS调用测试.xlsx`；顺带确认编辑保存的 xlsx 打开后筛选还在
3. 提交（office 仓库 1 文件）
4. Nashorn 模式（`-Ddocsys.office.jsEngine=nashorn`）下本缺陷依旧（Nashorn 无 Promise）——遗留已知边界，不修

## 复现素材与环境

- `test/tmp/ExcelPrintFail/`：JS调用测试.xlsx/autofilter_out.xlsx 副本、params.xml（C++ 对照命令）、探针脚本（insert_probe*.py/inject_adapter_exp.py，仅记录用，源码已还原）
- 命令行复现（修复前）：DiagTiming 257 513 → TypeError null.Lbi；修复后 ret=0
- C++ 对照：`x2t.exe params.xml`（257→513）→ 58032B（方法论坑 9 已修正：params.xml 对该方向可用）
