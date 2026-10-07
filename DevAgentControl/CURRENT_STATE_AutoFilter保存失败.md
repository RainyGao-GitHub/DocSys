# CURRENT_STATE_AutoFilter保存失败（缺陷卡）

> 状态：**已定性，待立项修复**（2026-10-07 建立）
> 归属：**JS 路径（sdkjs / sdk-all.js）的既有缺陷** —— 与本轮 GraalJS 迁移**无关**
> 严重程度：**高**（用户改了存不下去，修改丢失）

## 一句话

xlsx 里**添加/修改自动筛选（AutoFilter）后保存**，服务端 `apply_changes` 在 `sdk-all.js` 里抛
`TypeError: null has no such function "Qf"`，最终 `OFFICE: saveDoc() convert bin to office failed`。

## 影响

- **用户可见**：在浏览器编辑器里给 xlsx 加自动筛选 → 关闭窗口（约 2 分钟后后台自动保存）→ 转换失败。
- 失败时**不覆盖仓库文件**（已实测：`C:\DocSysReposes\1\data\rdata\JS调用测试.xlsx` 保持原样），
  但**本次修改丢失**。
- 相关测试同样失败：`test/TestAutoFilterSmoke.java`（`convert ret != 0`）、
  `test/TestT8XlsyMergeGolden.java` 的 `[AfColor]` 两项。二者报的是**同一条 `Qf` 错误**。

## 最小复现（产品级，已实测两遍：graaljs + nashorn）

1. 浏览器打开 mxsdoc，打开一个 xlsx（编辑器）
   - 等价直达 URL：`/DocSystem/web/office.html?reposId=<n>&docId=<id>&name=<b64name>&langType=ch`
   - （在仓库详情页也可以：右键文件 → 更多 → 在新窗口打开）
2. 给表格加自动筛选：
   - API：`Asc.editor.asc_addAutoFilter()` → 之后 `Asc.editor.asc_isDocumentModified()` 返回 `true`
   - 或 UI：选中区域 → 数据/筛选
3. **关闭编辑器窗口**
4. 等约 **2 分钟**（服务端 `RemoveDocDataDelayTask` 到点触发保存）
5. 看 `<CATALINA_HOME>/logs/docsys.log`

**期望**：`【apply_changes】JS 引擎路径 …` 之后无错，`saveDoc()` 成功。
**实际**：`TypeError: null has no such function "Qf"` → `saveDoc() convert bin to office failed`。

## 证据（docsys.log 关键行）

### graaljs（缺省引擎，2026-10-07 18:22）

```
OFFICE: saveBinToOfficeFile() dockey:377630261 targetPath:.../377630261/output/ targetName:output.xlsx
【apply_changes】JS 引擎路径 eType:1 引擎:graaljs
LOGGER_SPEED_LAP() compile [8ms] run [120ms] open [401ms] changes [592ms] save [604ms]
TypeError: null has no such function "Qf"
  at JSValueAccess.callMember(JSValueAccess.java:239)
  at CJSObject.call_func(CJSObject.java:139 / :115)
  at CDoctRenderer_Private.ExecuteScript(CDoctRenderer_Private.java:935)
  at CDoctrenderer.Execute(CDoctrenderer.java:957)
  at NExtractToolsStatic.apply_changes(NExtractToolsStatic.java:946)
CDoctrenderer.Execute(...) strError:<result><error index="-1" message="TypeError: null has no such function
  &quot;Qf&quot; [stack: &lt;js&gt;.PHb:18937 | &lt;js&gt;.uh:18950 | &lt;js&gt;.Xc.p3:18805 | &lt;js&gt;.Xc.uh:18804 | ...] /></result>
[error] DoctRenderer:<result><error index="-1" ...
OFFICE: OFFICE: saveDoc() convert bin to office failed
```

### nashorn（对照实验，`CATALINA_OPTS=-Ddocsys.office.jsEngine=nashorn` 重启后跑同一流程，2026-10-07 18:28）

```
【apply_changes】JS 引擎路径 eType:1 引擎:nashorn
LOGGER_SPEED_LAP() compile [80ms] run [27476ms] open [31002ms] changes [31358ms] save [31371ms]
<eval>:18937 TypeError: null has no such function "Qf"
  at jdk.nashorn.internal.runtime.ECMAErrors.typeError(ECMAErrors.java:213 / :185 / :172)
  at NExtractToolsStatic.apply_changes(NExtractToolsStatic.java:946)
CDoctrenderer.Execute(...) strError:<result><error index="-1" message="TypeError: null has no such function
  &quot;Qf&quot; [stack: jdk.nashorn.internal.runtime.ECMAErrors.error:57 | jdk.nashorn...] /></result>
OFFICE: OFFICE: saveDoc() convert bin to office failed
```

→ **两个引擎报同一条错误、同样失败**（栈帧分别为 `com.oracle.truffle.js.*` 与 `jdk.nashorn.internal.*`，
可据此证明各自跑在哪个引擎上）。顺带得到一个副产品：同一操作 nashorn `run` 单步 **27476 ms** vs
graaljs **120 ms**。

## 为什么这不是 fixture 陈旧

复现用的是**当次在浏览器里、用当前 sdkjs 新录**的变更，不是仓库里的老 fixture：

| 文件 | 说明 |
|---|---|
| `C:\DocSysReposes\1\data\OfficeEdit\100849552270\377630261\data\changes\changes0.json`（180 B） | 本次筛选变更 |
| 同上 `changes1.json`（180 B） | 本次筛选变更 |
| 同上 `output\Failed_output.xlsx`（5068 B） | 失败分支写出的产物 |
| 同上 `ErrorChanges20261007182218\changes.zip`（508 B） | 应用自动留存的失败诊断包 |

## 已排除的假设

| 假设 | 结论 |
|---|---|
| GraalJS 引擎回归 | ❌ **排除** —— nashorn 下报同一条错误 |
| fixture 陈旧/录制方式不同 | ❌ **排除** —— 用当前 sdkjs 新录的变更同样复现 |
| 本轮"删除 apply_changes 的 Java 路径"引入 | ❌ **排除** —— JS 路径代码本轮**一行未改**（只删了 `JMergeEngine` 那条恒不执行的分支 + 默认引擎翻转）；且 §6.4.8 记录的 `lF` 在 nashorn 下也出现 |
| 测试侧字体目录 / classpath 遮蔽 | ❌ 与本案无关（那是测试环境的另外两个问题，已单独修） |

## 尚未定位（下一步要查什么）

1. **`Qf` 是 sdkjs 里哪个函数**：`<js>.PHb:18937` 是压缩后的位置，需在未压缩的
   `sdkjs/cell/sdk-all.js` 里对齐定位，或给 cell sdk 注入 trace 打印 `this`/调用者。
2. **为什么是 `null` 去调 `Qf`**：AutoFilter 变更在 undo/redo 分支里拿到 `null` 宿主对象——
   是变更解析（`changes*.json`）语义不对，还是服务端缺某个前置状态？
3. 与 §6.4.8 记录的 `null has no such function "lF"` 是否**同一根因**（同一族、不同入口）。
4. **重要线索**：同一个 sdkjs 在**浏览器里能成功应用**同样的变更（筛选在编辑器里生效），
   只有**服务端 headless** 这条路径炸 → 差异可能在于浏览器侧存在而服务端缺失的全局/前置对象。
   可从"AutoFilter 代码引用了浏览器侧才有的东西"这个方向查（§6.4.8 曾观察到 cell 的
   `CDoctrenderer` 对 spreadsheet 无条件追加 `$.ready();`，说明这类"浏览器假设"确实存在）。

## 关联

- 计划文档：`docs/GraalJS替代Nashorn评估计划.md` §6.4.8、§6.4.12
- 工作卡：`DevAgentControl/CURRENT_STATE_JDK升级选型.md`
- 问题列表：`docs/MxsOffice问题列表.md`
- 相关测试：`test/TestAutoFilterSmoke.java`、`test/TestT8XlsyMergeGolden.java`（`[AfColor]`）
- ⚠️ **需要修正的一条旧结论**：问题列表里 "[x] Office文件修改后的内容无法保存" 曾判定为
  "不是真问题，只是 nashorn 慢造成的错觉，升级 JDK 即可解决"。本案说明**至少 AutoFilter 这一类变更是
  硬报错（`TypeError`），不是慢**；即使换成 GraalJS 也存不下去。该条结论需要按此修正。

## 复现环境

- 运行时：`C:\TomcatForDocSysDev\docsys\tomcat\java\jre` = **GraalVM CE 21.2（OpenJDK 1.8.0_302）**；
  nashorn 对照用其自带的 `jre/lib/ext/nashorn.jar`（`-Ddocsys.office.jsEngine=nashorn`）
- 复现文档：仓库 1 / `JS调用测试.xlsx`（docId=`100849552270`，dockey=`377630261`）
- 相关代码位置：`NExtractToolsStatic.apply_changes()`（`NExtractToolsStatic.java:946` 是调用点）、
  `CDoctrenderer.Execute()`（`CDoctrenderer.java:957`）、
  `CDoctRenderer_Private.ExecuteScript()`（`CDoctRenderer_Private.java:935`）
