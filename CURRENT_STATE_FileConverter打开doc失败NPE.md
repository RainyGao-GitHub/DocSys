# FileConverter 打开 .doc 失败：移植残留 NPE 链（已定位并修复，待端到端验证）

状态：**修复完成（2026-10-30 第二轮 session），命令行全量样本验证通过；Eclipse 实例端到端验证待用户配合**
用户原话：OnlyOffice 引擎可以打开，FileConverter 不行；"从日志来看应该是 Java 移植的残留导致的"。
（判断正确——共修复 5 类移植残留，其中 2 类为全局性转换错误，超出单个 NPE 范围。）

## 一、根因结论（已实锤，推翻第一轮"officeArtContent 为 null"的初步怀疑）

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
