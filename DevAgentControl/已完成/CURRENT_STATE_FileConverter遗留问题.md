# FileConverter 移植遗留问题（✅ 全部完成，已归档）

状态：**✅ 全部完成（2026-10-31）**。P1/P2（ReadFFData 丢失调用）、P3（GetNode 幽灵赋值 164 处）、
"ReadMainTable 错误码被丢"放大器整改——三项全部修复、三层验证通过、**用户已实测并提交**：
- office 仓库：`52653730`【BugFix】doc文件另存为之后文件几乎为空（P1/P2）
- office 仓库：`7bcfaa7a`【BugFix】bin转docx存在纯冗余数据（P3 幽灵赋值）
- office 仓库：`51052b09`【BugFix】读主表异常时会产出残缺docx且返回成功（放大器整改）
- COLEObject.java:1100 同类丢弃（对象级）：用户裁定不修，**已由用户提交 Gitee issue 跟踪**
  （草稿：`DevAgentControl/gitee-issue-COLEObject丢弃ReadFile返回值.md`）
来源：FileConverter .doc 打开/保存 NPE 任务收尾时的遗留清单，
前情见 `DevAgentControl/已完成/CURRENT_STATE_FileConverter打开doc失败NPE.md`
（前序提交：office 仓库 `4b6b3eb9`、`a2ba7aac`；test 仓库 `83f9fda`、`6994ac2`、`b681a1f`、`6b25a1f`）。

## ⚡ P1/P2 根因与修复（2026-10-30 深夜，已修复）

**P1（bin 不带 changes → docx 近乎空）和 P2（GetString3 越界）是同一个 bug 的两层表现。**

### 根因（一行代码丢失）
`OOXML/BinDocxRW/Binary_DocumentTableReader.java` `ReadFldChar()` 的 **FFData 分支**里，
READ1_DEF 宏展开时把 `res = this.ReadFFData(...)` **调用整行丢了**（C++ 原行只剩注释）：
子循环读了子记录 header 后既不 dispatch 也不消费 payload 也不跳过 → 流位置错位 →
后续 PermStart 记录把 payload 字节当长度读出垃圾值（len=1191706624）→ GetString3 越界抛异常 →
被 `BinaryFileReader.ReadFile:310` catch 只打日志 → **主表后续全部内容（整个正文）静默丢失** → 残缺 docx。

### 定性证据链（whack-a-mole 方法论的一次完整应用）
1. 真实调用路径确认：`OfficeBase.executeSaveCommand`（编辑器"下载为/另存为"，~7535 行）传
   `changesPath=null` → `hasChanges=false` → P1 路径是真实用户功能，不是纯测试现象。
2. C++ x2t.exe 交叉裁判（`x2t_ref/` 下现成对比）：C++ 读 Java bin 完整（68KB docx）、
   Java 读 C++ bin 完整（67KB）、**唯独 Java 读 Java bin 残缺（13KB）**→ 读侧 bug（bin 本身没问题）。
3. 临时插桩（READ1_DEF 循环 220 处窗口 trace + GetString3 越界现场 hex dump），把 trace 声称的
   (type,len) 与文件真实字节逐条对账 → 排除位置记账失步 → 锁定"零消费"记录 → 定位到 fldChar 的 FFData 子循环。
4. 全库扫描同款"READ1_DEF 展开丢 dispatch"模式：仅此一处。

### 修复
补回 `res = this.ReadFFData(read1defType.m_pPointer, read1defLength, pFldChar.m_oFFData.GetPointer());`
（与 C++ `READ1_DEF(length, res, this->ReadFFData, ...)` 对齐）。临时诊断已全部移除
（Binary_DocumentTableReader 里剩的 5 处 [DIAG] Log.warn 是此前会话的既有日志，非本次遗留）。

### 验证（全部通过 ✅ 2026-10-30 23:04）
- 针对性：Java 读 Java bin → document.xml 从 1,289B/2 字符 → **1,411,535B/15,144 字符**
  （C++ 参照 1,399,837B/15,174，同量级；差值属正常序列化差异）
- **全量 verify_doc_pipeline（不带 -AllowKnownIssues）：13 项全 PASS，退出码 0**——
  9 个打开样本与基准逐字节一致（读侧修复无回归）、保存链路完整含编辑标记、
  回环 896,524B、`ReadMainTable threw` 已知红灯消失转绿。
- Step A（无 changes 对照组）同步恢复：62,995B 完整 docx / document.xml 1,411,535B。
- 工具：`test/TestBin2Docx.java` 已提交（`b681a1f`）。
- Eclipse 端到端：待用户实测"下载为 docx/pdf"功能（executeSaveCommand 路径）。
- 产品代码改动**待提交**（1 行：Binary_DocumentTableReader.java 补回 ReadFFData 调用）。

### 排查技巧沉淀（可补进 docs/CppToJava常见问题与解决方案.md）
- **READ1_DEF/READ2_DEF 宏展开丢调用行**：自动转换器把 `res = this->Xxx(...)` 行吞掉但保留注释——
  危险在于循环照常推进（curPos 用记录长度记账），表象是"流错位+下游随机越界"，与丢失点相距很远。
  排查法：插桩打印 (pos,type,len)+调用方法，与文件真实字节对账找"零消费"记录。
- C++ x2t.exe 是现成的裁判：`WebRoot/web/static/office-editor/server/FileConverter/bin/x2t.exe`
  + params.xml（格式见 test/CompareWithX2t.java），双写双读四格矩阵快速切分读/写侧问题。

## 零、工作规矩（用户 2026-10-30 明确要求，本卡及后续所有修改必须遵守）

> "我希望我们每次修改都可以进行验证"

**每次代码修改的完成定义 = 验证通过**，缺一不可：

1. 增量编译改动源码：WDK javac，必带 `-g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`
2. 该问题的最小复现（用对应 harness 重跑，确认现象消失/复现）
3. 全链路回归（打开链路 9 样本 + 保存链路 + 保存后重开），输出与基准比对
4. 涉及运行时行为的，由用户在 Eclipse 实例做端到端实测

一键回归脚本：`test/tools/verify_doc_pipeline.ps1`
——编译测试类 → doc→bin 基准比对（-Fast 只跑 123.doc，约 12 分钟；全量 9 样本约 30 分钟）→ bin+changes→docx
内容校验（大小/document.xml 非空/含编辑标记/无 ReadMainTable threw）→ 保存的 docx→bin 回环。退出码 0=全过。
**当前已知红灯**：无 -AllowKnownIssues 时会报 1 个 FAIL——"ReadMainTable threw"，即本卡 P1/P2
（无 changes 对照组的 GetString3 越界+空输出）。这是设计行为：修掉 P1/P2 后必须变绿；
做其他修改时用 `-AllowKnownIssues` 把它降级为 WARN。
**打开链路的输出大小基准表**：大小变化不一定是错（可能是本次修复的预期效果），脚本会标红提示人工确认后更新基准。
已验证：2026-10-30 以 -Fast 模式端到端跑通（全检查项执行，1 个已知 FAIL）。
两个 PowerShell 陷阱（已内置于脚本，改动时别回退）：① .ps1 必须带 UTF-8 BOM，否则 PS5.1 按 GBK 解析中文炸语法；
② 调 java 必须用参数数组 + Start-Process，直接 `& java -Dfile.encoding=UTF-8` 会被 PS5.1 拆参
（"找不到主类 .encoding=UTF-8"），`*>` 重定向还会把 stderr 变 ErrorRecord、日志变 UTF-16。

本轮 NPE 修复即按此流程执行（修一处→编译→重跑复现→回归逐字节比对），用户已实测认可。

## 一、P1：bFromChanges=false 的 bin→docx 输出近乎空（疑似内容丢失）——✅ 已修复（见顶部）

- **现象**：原始 Editor.bin（123.doc 现场件，602,377B）不应用 changes 直接转 docx：
  输出仅 13,305B，document.xml 1,289 字符、正文 2 字符——**几乎空文档**。
  对照：同一 bin + changes → docx = 83,872B / document.xml 1.7MB / 正文 15,161 字符。
- **既有性**：修复 rowPrAfterBefore 前后行为一致（13,305B），非 2026-10-30 两轮修复引入。
- **复现**：`test/TestDocSaveNpe.java` Step A / `test/TestBin2Docx.java`（新工具）。
- **真实调用路径**：`OfficeBase.executeSaveCommand`（编辑器"下载为/另存为"）传 changesPath=null → 真实用户功能。
- **根因**：= P2（见顶部）。修复后 Step A 应输出完整 docx（全量回归确认）。

## 二、P2：GetString3 越界（页眉页脚内嵌 drawing 读取）——✅ 已修复（见顶部）

- **现象**：bin→docx 时日志出现
  `[BinaryFileReader.ReadFile] ReadMainTable threw: java.lang.Exception: GetString3() m_lPos + len > m_lSize`
  （被 ReadFile:310 catch，仅打日志，转换继续）。
- **根因**：ReadFldChar FFData 分支丢失 dispatch 调用导致流错位（详见顶部）。
- **✅ "异常被吞"放大器整改（2026-10-31 完成）**：精确根因不是"吞异常"而是
  **`CDocxSerializer.loadFromFile:775` 丢弃 `ReadFile()` 返回值**（ReadFile 本身返回 ErrorStream 错误码；
  C++ 原版 DocxSerializer.cpp:427 同样丢弃——OnlyOffice 原生缺陷）→ 残缺产物被当成功打包提交。
  修复：接住返回值，`!= ReadOk` 即 `return false`（刻意偏离 C++ Word 路径、对齐同库 XLS 路径
  XlsxSerializer.cpp:103 的正确范式，代码内有注释说明）。
  验证：①负向测试（截断 bin）→ 返回 -2147216560、无输出文件 ✅；②全量回归 13/13 PASS（健康路径零影响）✅。
  产品代码未提交（git diff 留用户复核）。
- **同类遗留点（用户裁定不修，转 Gitee issue 跟踪）**：`COLEObject.java:1100`（PPTX 内嵌 Word OLE 对象
  读取，活动代码仅此一处；1838 行相同调用在 C++ 参考块内非活动代码）。影响面为单个内嵌对象非整文档。
  issue 草稿：`DevAgentControl/gitee-issue-COLEObject丢弃ReadFile返回值.md`
  ——**提交受阻：API 需私人令牌（凭据管理器存的是账号密码，401）、内嵌浏览器无 Gitee 登录态（403）**，
  待用户在浏览器面板登录 Gitee 或提供私人令牌后提交。

## 三、P3：单参 GetNode(String) + "!= null" 展开语义失效——✅ 已完成（2026-10-31，方案 C）

- **背景**：C++ 宏 `WritingElement_ReadNode`：`if (oRootNode.GetNode(sName, oChild)) oValue = oChild;`
  ——子节点**不存在则不赋值**。Java 自动展开成单参 `GetNode(String)`（永远返回非 null 的包装对象，
  内部 m_pBase 为 null）+ `if (oChild != null)`，判空形同虚设 → 无效子节点被误赋值（幽灵赋值）。
  阶段一 NPE④（CFFTextInput 表单域）即此类问题，当时在 `CXmlNode.GetAllAttributes` 加 IsValid() 兜底修复。
- **澄清（用户追问后实锤）**：C++ 单参版存在且 Java 移植忠实——`CXmlNode GetNode(s)` 返回按值的
  无效节点，C++ 惯用 `IsValid()` 判断。bug 只在宏展开点：转换器把"存在性"译成了 `!= null`。
- **方案裁定（用户 2026-10-31）**：**方案 C**——保留单参版，164 处条件 `X != null` → `X.IsValid()`，
  与 C++ 语义和风格一致，方便参照；改动点明确，用户用 git diff 复核。
  （A=改布尔版两参调用，等效但改动多一步；B=单参版返回 null，被否——与 C++ 单参版语义分道，埋未来移植雷。）
- **实施**：字节级脚本替换（ASCII 模式直改 bytes，文件是混合行尾 UTF-8/GBK，文本模式会踩编码/行尾雷）。
  **164 处 / 23 文件**，git diff 恰好 164 行增删、全部单行条件替换、无行尾噪音。
  3 个未匹配点核实为 C++ 参考块内容/布尔版调用，非漏改。
- **验证**：
  - 编译 23 文件通过；
  - 针对性：双 bin（Java/C++）→ docx 输出与改前**逐字节一致**（本语料无"子节点缺失"触发点，符合预期）；
  - 全量回归：12/13 PASS + 1 个**预期漂移**——123.doc 打开链路 bin 602,377→602,017（-360B），
    实证为幽灵赋值写入 bin 的冗余数据消失：新旧 bin 转回 docx **全部条目逐字节一致、正文 15,144 字符相同**，
    内容零丢失。verify 脚本基准已更新（test 仓库 `6b25a1f`）。
- **状态**：office 仓库改动**未提交**，留 git diff 给用户复核后提交。

## 四、验证资产清单

| 资产 | 位置 | 说明 |
|------|------|------|
| TestDocNpeRepro | `test/TestDocNpeRepro.java`（已提交 83f9fda） | doc/docx → bin，按魔数自动判格式，支持命令行传多文件 |
| TestDocSaveNpe | `test/TestDocSaveNpe.java`（已提交 83f9fda） | bin+changes→docx（Step B）+ 无 changes 对照（Step A，P1 复现）|
| 123.doc 现场 bin | `test/tmp/TestDocSaveNpe/data/`（不入库） | Editor.bin + changes/ + media/，复制自仓库1 OfficeEdit/200310489673/1571509032 |
| 7 个候选 doc 样本 | `test/tmp/TestDocNpeRepro/inputs/`（不入库） | Lists/simple-table/table-merges/input/contract-logo/#2热机/123 |
| 一键回归脚本 | `test/tools/verify_doc_pipeline.ps1` | **草稿**，本卡第一个工作项：全量跑一次转正并提交 |
| 原始 123.doc | 仓库 8（用户管理） | 仓库 1 的副本已被写坏后由用户恢复 |

## 五、规矩提醒（同前卡，精简版）

- office 核心代码独立 git 仓库：`git -C src/com/DocSystem/websocket/office`；测试 → 其下 `test`。
- 编译必带 `-g -encoding UTF-8`；源码树不得留 .class；scratch 只写 `test/tmp/<测试名>/`。
- `C:\MxsDoc` 正式实例绝不碰；Eclipse 实例由用户启停。
- 陷阱：`WebRoot/WEB-INF/classes/com/.../office/test/` 下出现旧测试 class 会遮蔽 `test/bin`（清理过一次），
  跑测试行为诡异先查这里。
- 保存时 doc 落成 docx（adjutedFormatTo:65 回落）是**正常设计**，不要改（用户 2026-10-30 明确）。

## 六、建议执行顺序

1. ~~转正验证脚本~~（已完成：2026-10-30 -Fast 端到端验证 + 提交；全量 9 样本首跑可在 P1 开工时顺带执行）
2. P1（先确认是否有真实调用路径，定性严重度）
3. P2（含"异常被吞"放大器评估）
4. P3（依赖 1-3 建立的基准，方案 A/B 由用户裁定）
