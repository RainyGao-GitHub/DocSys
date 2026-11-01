# FileConverter .doc 打开/保存移植残留 NPE 链（已完成，双端实测通过，已提交）

状态：**✅ 全部完成（2026-10-30）**。阶段一（打开 .doc）+ 阶段二（编辑保存后损坏）均修复，
用户 Eclipse 实测通过（打开正常；编辑→保存→再打开正常）。
代码已由用户提交：`4b6b3eb9`【BugFix】doc文件打开NPE（阶段一 7 文件）+ `a2ba7aac`【BugFix】doc文件修改保存后无法打开（rowPrAfterBefore）。
用户原话：OnlyOffice 引擎可以打开，FileConverter 不行；"从日志来看应该是 Java 移植的残留导致的"。
（判断正确——两阶段共修复 6 类移植残留，其中 2 类为全局性转换错误，超出单个 NPE 范围。）
用户已认可"whack-a-mole 逐个揪"的修复方式。**用户明确：保存时 doc 落成 docx 是正常设计，不要改这个行为。**

## 遗留（均不阻塞，后续撞到再立卡）

1. 不应用 changes 的 bin→docx（bFromChanges=false）输出近乎空（13KB/正文 2 字符）——疑点待查。
2. 页眉页脚内嵌 drawing 读取 `GetString3() m_lPos+len > m_lSize` 越界日志（ReadPermStart:4118 路径）。
3. C 类"单参 GetNode + != null"展开全库约 143 处的专项整改（见 §二 C 类注记）。
4. 测试 harness `test/TestDocNpeRepro.java`、`test/TestDocSaveNpe.java` 未提交（现场样本在 test/tmp/ 不入库）。
5. 排查陷阱：`WebRoot/WEB-INF/classes/com/.../office/test/` 下若出现旧测试 class 会遮蔽 test/bin（已清理过一次）。

## ⚡ 阶段二：编辑保存后文件损坏（2026-10-30 晚，第三轮）

### 现象
用户在仓库 1 放 123.doc（原始在仓库 8），FileConverter 引擎打开正常（阶段一修复生效）；
编辑后关窗约 1 分钟触发后台保存 → 此后文件无法再打开。

### 根因（第 6 个，§4.5 同款：C++ 内联对象成员 → Java null 引用）
`OOXML/BinDocxRW/rowPrAfterBefore.java` `_init()` 里 `oAfterWidth = new docW()` 被注释 →
两个构造路径 `Init("After")/Init("Before")`（Binary_tblPrReader:1543/1634）产出的 `oAfterWidth` 恒为 null。
保存链路 bin+changes→docx 时 `ReadAfter/ReadBefore → ReadW(type, len, orowPrAfterBefore.oAfterWidth)`
→ ReadW 内 `odocW.bType = true` 对 null putfield → NPE。
（javap 行号表实锤：`line 952: 字节码13 = putfield docW.bType`。）
此前未炸原因：doc→bin 方向不写 WAfter/WBefore 记录，**编辑器保存时会写**。
C++ 原版 `docW oAfterWidth` 是值成员永远存在。

### 致命放大器：错误被吞，残缺文件照常提交
`BinaryFileReader.ReadFile:310` 把 ReadMainTable 的异常 **catch 后仅打日志**（"ReadMainTable threw"），
转换继续 → 产出残缺 docx（33KB，正常应 84KB）→ saveDoc 落盘、提交版本 → 文件从此打不开。
（保存 doc→docx 的格式回落 adjutedFormatTo:65 是正常设计，勿动。）

### 修复
`rowPrAfterBefore_init()`：`sName = ""`；`oAfterWidth = docW.Init()`（一行根修，C++ 语义对齐）。
另：重编了 Binary_tblPrReader.java 刷新陈旧 class（其 class 与源码行号有 ~105 行漂移，说明部署 class 早于近期源码改动）。

### 本地验证（TestDocSaveNpe，现场文件复制自 OfficeEdit/200310489673/1571509032）
- bin+changes→docx：NPE 消失，输出 83,872 字节完整 docx（document.xml 1.7MB / 正文 15,161 字符，
  用户编辑内容"修改测试20261030-2047"已在文中）✅
- 保存的 docx → Editor.bin（重开路径）：896,524 字节，返回码 0 ✅
- ⚠️ 既有独立问题（非本次引入，修复前后行为一致，均被 catch 不影响产出）：
  ① 对照组"原始 bin 不应用 changes → docx"输出近乎空（13KB/正文 2 字符）——bFromChanges=false
  路径的内容丢失疑点，待查；② 页眉页脚内嵌 drawing 读取时 `GetString3() m_lPos+len > m_lSize` 越界
  （Binary_DocumentTableReader.ReadPermStart:4118 路径）。
- 排查陷阱记录：`WebRoot/WEB-INF/classes/com/.../test/` 下发现过遮蔽 test/bin 的旧测试 class
  （已删 TestDocNpeRepro.class）——跑测试若行为诡异先查这里。

## 一、阶段一根因结论（已实锤，推翻第一轮"officeArtContent 为 null"的初步怀疑）

**NPE 真凶是 `m_shapeId` 为 null，不是 officeArtContent。**

关键证据：用 WDK javap 反编译 `WebRoot/WEB-INF/classes` 里的 `VMLPictureMapping.class`，
Apply() 的 LineNumberTable 显示 **line 619 → 字节码偏移 254**，而 254 处是
`getfield m_shapeId; invokevirtual String.isEmpty()` —— 即 NPE 发生在 615 行的
`if (m_shapeId.isEmpty())`（行号表把整个 if 块起始归到 619，源码行号注释偏移一行的疑点就此解释：
堆栈 619 不是注释行对不上，而是 javac 行号归并）。

- C++ 原版：`std::wstring m_shapeId`（值语义，默认空串，`.empty()` 永不崩）
- Java 移植：`String m_shapeId`（默认 null），且 `VMLPictureMapping_init()` 里
  `this.m_shapeId = new String()` 被自动转换器注释（220 行）→ **null.isEmpty() NPE**

这就是 `docs/CppToJava常见问题与解决方案.md` §4"默认初始化 vs null"的典型案例，
但当时只修了 XLS/PPT 侧，DocFileFormat 侧漏网。

## 二、修复清单（5 类，共 6 个文件，均已编译进 WebRoot/WEB-INF/classes）

**A 类：String/StringBuilder 字段默认 null（§4 同款）**

| # | 文件 | 修复 |
|---|------|------|
| 1 | `MsBinaryFile/DocFileFormat/VMLPictureMapping.java:59` | `m_shapeId` 声明处加 `= ""`（NPE①，619 行真凶） |
| 2 | `MsBinaryFile/DocFileFormat/VMLShapeMapping.java:887` | `sTextboxStyle` `= null` → `new StringBuilder()`（NPE②，页脚形状文本框，1996 行 `.toString()` 崩） |
| 3 | `MsBinaryFile/DocFileFormat/DocumentMapping.java` `_init()` | `m_shapeIdOwner = ""`（NPE③，防御性：1529 行 `m_shapeIdOwner.isEmpty()`，C++ 同款值语义） |

**B 类：`substr(pos, len)` → `substring(begin, end)` 换算错误（全局性转换 bug）**

C++ `substr` 第二参是**长度**，Java `substring` 第二参是**结束下标**，直接照抄参数会越界或取错串：

| # | 文件 | 修复 |
|---|------|------|
| 4 | `OOXML/PPTX/CStringTrimmer.java:245` | `substring(nCurPosition, nLen)` → `substring(nCurPosition, nCurPosition + nLen)`（NPE⑤，StringIndexOutOfBounds: -1） |
| 5 | `MsBinaryFile/DocFileFormat/NumberingMapping.java:585` | `strAfter = xst.substring(Before, After)` → `substring(Before, Before + After)`（编号占位符后半段取错，同款 bug，扫库发现） |
| 6 | `OOXML/SimpleTypes/Vml/CVmlDashStyle.java:282` | `substring(nIndex, nLen)` → `substring(nIndex, nIndex + nLen)`（虚线样式解析，同款，扫库发现） |

**C 类：`GetNode(String)` 单参版语义丢失**

| # | 文件 | 修复 |
|---|------|------|
| 7 | `xml/XmlUtils/CXmlNode.java GetAllAttributes()` | 加 `if (!IsValid()) return;`（NPE④） |

NPE④ 机理：C++ `WritingElement_ReadNode` 宏是 `if (oRootNode.GetNode(sName, oChildNode)) oValue = oChildNode;`
——子节点**不存在**时不赋值。Java 展开成 `oChild = oNode.GetNode("w:default"); if (oChild != null) ...`，
但 Java 的 `GetNode(String)` 永远返回**非 null 的包装对象**（内部 `m_pBase` 为 null），
"!= null" 检查形同虚设 → 无效节点流进 `String.FromXML` → `GetAllAttributes` 裸解引用 `m_pBase.m_attributes` 崩。
已在 `GetAllAttributes` 与 `GetAttribute/GetText` 对齐做 `IsValid()` 兜底。
⚠️ 遗留：全库还有约 143 处同款"单参 GetNode + != null"展开（CFFData/CFFCheckBox/CTableStyle 等 20+ 文件），
目前靠 GetAllAttributes 兜底不崩，但无效子节点会被误赋值（多数场景等价于 C++ 的默认未初始化，影响待观察）。
后续如再撞此类问题，可考虑把 `GetNode(String)` 改为找不到时返回 null 的专项整改（影响面大，需单独立卡）。

`raster/SVG/CStyleCSS.java` 两处 substr→substring 疑似同款但第二参是 find() 绝对下标，Java 行为符合解析意图，**未动**。

## 三、修复链路（同一文档暴露 5 个连环 NPE，逐个修掉）

测试样本：`123.doc`（514KB，微信 2026-10 收到，含表单域+页脚形状+大量图片，dockey 846814425 是否即它待用户确认）

```
NPE① VMLPictureMapping:619 m_shapeId          → 修 A1
NPE② VMLShapeMapping:1996 sTextboxStyle       → 修 A2
    （同轮防御性修 A3 m_shapeIdOwner）
NPE④ CXmlNode:475 GetAllAttributes m_pBase    → 修 C7
NPE⑤ CStringTrimmer:247 substring(-1)         → 修 B4（+扫库补 B5/B6）
→ 返回码 0，Editor.bin 602,377 bytes 生成 ✅
```

## 四、验证情况（全部完成）

- 复现/回归 harness：`test/TestDocNpeRepro.java`（支持命令行传文件路径），
  scratch 输出在 `test/tmp/TestDocNpeRepro/`（符合规矩）。
  候选样本备份在 `test/tmp/TestDocNpeRepro/inputs/`（7 个：Lists/simple-table/table-merges/input/contract-logo/#2热机/123）。
- 编译：WDK javac `-g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`，改动 6 文件全部通过。
- **全量回归（11 个 .doc）结果：9 通过 / 2 失败（均为修复前已存在的无关问题）**
  - ✅ 123.doc（原故障样本）602,377 bytes
  - ✅ Lists/simple-table/table-merges/input/contract-logo/#2热机（6 个基础样本）
  - ✅ 两份合同 45,129 / 54,956 bytes —— **与修复前输出逐字节同大小，无回归**
  - ❌ Test00113.doc：文件本身损坏（OLE header magic 不符）返回 -2147216560，修复前即如此
  - ❌ 培训记录表.doc：实为 ZIP 伪装 doc，harness 硬传 DOC(66) 格式所致，修复前即如此
    （走 Web 端时服务器会按真实格式自动纠正，不受影响）

## 五、待办

1. **Eclipse 实例端到端实测**（用户配合）：重启 Eclipse Tomcat → FileConverter 引擎打开原故障 .doc。
2. office 子仓库提交（`git -C src/com/DocSystem/websocket/office`，等用户确认提交时机与拆分方式：
   建议 A 类一个 commit、B 类一个 commit、C 类一个 commit）。
3. 可选后续：C 类 143 处"单参 GetNode + != null"展开是否专项整改由用户裁定（见 §二 C 类注记）。

## 六、规矩提醒（同前）

- office 核心代码独立 git 仓库；测试 scratch 只写 `test/tmp/<测试名>/`；
- 编译必带 `-g -encoding UTF-8`；`C:\MxsDoc` 绝不碰；
- 运行验证靠用户 Eclipse 实例；独立 dev 实例 8100 已停。
