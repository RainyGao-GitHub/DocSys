# CURRENT_STATE_JSlideMergeGoldenNew字节差异（状态卡）

> 状态：**已定位到具体差异点，影响未评估**（2026-10-07 建立）
> 归属：**JS 引擎路径（sdkjs）在幻灯片版式/母版里序列化 `<a:fld>` 字段的行为差异**
> 注意：**不属于 `CURRENT_STATE_JDK升级选型.md` 那个任务的待办**，单独立项

## 一句话

`TestJSlideMergeGoldenNew` 的三个 fixture 走 JS 引擎路径后，输出 PPTX 里
**幻灯片版式/母版的日期字段（`<a:fld type="datetimeFigureOut">`）丢了缓存文本**
（`<a:t>30.10.2013</a:t>` → `<a:t></a:t>`）并**多写一个空 `<a:rPr></a:rPr>`**，每文件恒定 **+13 字节**。

## 现象

测试：`test/TestJSlideMergeGoldenNew.java`（fixture 录制于 2026-09-03），三个 fixture 全部失败：

| 用例 | fixture | realDiff |
|---|---|---|
| S-1 删除形状阴影备注 | `EditorBinWithChanges_S1删除形状阴影备注.pptx/-2103341622` | 待重跑确认 |
| S-2 图表装饰修改 | `EditorBinWithChanges_S2图表装饰修改.pptx/560394054` | **7**（另有 `ppt/slides/slide1.xml` +74、`ppt/theme/theme1.xml` +22） |
| S-3 幻灯片装饰 | `EditorBinWithChanges_S3幻灯片装饰.pptx/1536879443` | **12**（12 个 part 各 +13） |

S-3 的 12 个 part：`ppt/slideLayouts/slideLayout1..11.xml` + `ppt/slideMasters/slideMaster1.xml`，
**每个都恰好 +13 字节**。

## 已定位的确切差异（S-3）

同一文件里首个差异点（`ppt/slideLayouts/slideLayout1.xml`，offset 3495；`slideLayout7.xml`、`slideMaster1.xml` 同处同型）：

```
mine(JS 引擎路径): …type="datetimeFigureOut"><a:rPr></a:rPr><a:t></a:t></a:fld><a:endParaRPr lang="en-US">…
ref (golden)     : …type="datetimeFigureOut"><a:t>30.10.2013</a:t></a:fld><a:endParaRPr lang="en-US">…
```

- **差异 1**：JS 路径丢掉了 `<a:fld>` 的**缓存文本**（golden 是 `30.10.2013`，JS 输出为空）
- **差异 2**：JS 路径多写了一个**空的 `<a:rPr></a:rPr>`**

扫描整个 S-3 输出：11 个 `slideLayout*.xml` 各有 2 处 `<a:fld>` 命中该模式（合计 22 处），
`slideMaster1.xml` 同样命中 → **同一个根因，不是 12 个独立问题**。

⚠️ 注意：`datetimeFigureOut` 是**日期字段**，`<a:t>` 里的是它的**缓存渲染值**。
丢掉缓存值可能让该占位符在**不重算的渲染路径**（例如服务端转 PDF）上显示为空 ——
**这正是需要评估的影响点**（浏览器编辑器通常会重算，所以界面上可能看不出来）。

## 复现

```powershell
cd D:\Dev\DocSys
# 编译（注意：测试 bin 目录必须排在 WEB-INF\classes 之前，否则会被陈旧测试类遮蔽）
$javac -encoding UTF-8 -cp "<testbin>;WebRoot\WEB-INF\classes;<jars>" -d <testbin> test\TestJSlideMergeGoldenNew.java
# 运行
java -Dfile.encoding=UTF-8 -cp "<testbin>;WebRoot\WEB-INF\classes;<jars>" com.DocSystem.websocket.office.test.TestJSlideMergeGoldenNew
```

产物：`test/tmp/TestJSlideMergeGoldenNew/<用例>/output.pptx`（解包后的 XML 在 `.../temp/pptx_unpacked/`），
golden：`test/测试文件/<fixture>/output/output.pptx`。

## 为什么以前没暴露

该测试原本靠 `JMergeEngine.setEnabled(true)` + `markEditorCovered(PPTT)` **强制走 Java 移植路径**而通过；
Java 移植路径已于 2026-10-07 整体删除，测试改走唯一 JS 引擎路径后才暴露。
→ 本项同样**不是 GraalJS 迁移引入**（是 JS 引擎既有行为；如需确认可用
`-Ddocsys.office.jsEngine=nashorn` 跑一次对照）。

## 待查 / 待评估

1. **影响评估（最重要）**：丢掉 `<a:fld>` 缓存文本是否会让服务端转 PDF / 转 docx 时该日期占位符变空？
   → 拿 S-3 fixture 走一遍 `pptt_bin2pptx_dir` + 转 PDF，看该占位符渲染结果。
2. **是否只影响字段**：S-2 的 `slide1.xml`(+74) / `theme1.xml`(+22) 差值不是 13 的倍数，
   说明还有**别的差异类型**，需单独定位（S-1 同理）。
3. **与 golden 的关系**：golden 录制于 2026-09-03；用户已确认"到期可以用 x2t 重新生成参照文件"。
   但本差异是**结构性**（字段缓存值消失 + 多一个空 rPr），不像时间戳漂移，**不能简单归因于 golden 过期**。
4. 精确定位 sdkjs 里写 `<a:fld>` 的代码路径（`sdkjs/slide/sdk-all.js` 未压缩版可对齐）。

## 关联

- 工作卡：`DevAgentControl/CURRENT_STATE_JDK升级选型.md`（该任务**不含**本项）
- 计划文档：`docs/GraalJS替代Nashorn评估计划.md` §6.4.13（第④点第 3 条即本项）
- 另一张独立缺陷卡：`DevAgentControl/CURRENT_STATE_AutoFilter保存失败.md`
