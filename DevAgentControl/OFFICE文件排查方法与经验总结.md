# Office 文件无法打开/保存 问题排查方法与经验总结

> 2026-11-02 ~ 2026-11-07 会话沉淀。供后续 session 接续使用：新一批无法打开的 Office 文件逐个分析时的方法论、已修复清单、环境与纪律。

## 一、已完成的修复（背景知识，避免重复排查）

| 问题 | 根因 | 修复位置 | 状态 |
|---|---|---|---|
| Word 23 个文件无法打开 | ①VML 属性序列化丢空格 83 处 ②Copy 工厂裸 new 字段全 null（VarsCopy 生成器缺陷）③OLE data 为 null 拆箱 NPE ④假扩展名（.docx 实为 OLE2）检测单向 | Vml 包 13 类 / CDrawingConverter / WordprocessingDocument / detectActualFormat | ✅ 已上线（2.02.90） |
| Excel 打不开（自由团队后台接口.xls） | XLS 读取链 11 处生成器缺陷（VarsCopy/值成员未初始化/map operator[]/双迭代器） | MsBinaryFile/XLS + ODRAW + OfficeArtRecord 等 | ✅ 用户已提交 |
| Excel 编辑保存失败（sdkjs null.lF） | sdkjs 7.0.1 applyChanges 重放 bug（上游，C++ x2t 同崩） | sdk-all.js 的 lOe 函数包 try-catch 跳过单条 change（office-editor 仓库 d56a0149） | ✅ 已提交 |
| Excel 保存失败但文件正确 | xlsx→xls BIFF8 写出器产品从未实现（C++ 也没有），fallback 到 xlsx 是设计行为 | 无需修（提示降噪为可选项） | 📋 可选 |
| Linux PPT 打开弹"无法保存" | 旧启动脚本调 allthemesgen 失败写空壳 themes.js | 部署修复（war 拷回 themes 目录）+ 换新启动脚本 | ✅ 已恢复 |
| fontDir 丢斜杠（e6076535 回归） | 字体库预生成重构后 fontDir+"AllFonts.js" 丢分隔符 → config 找不到 → $ 未定义 → changes 全丢 | OfficeBase 三处 fontDir 补尾斜杠 | ✅ 已修复 |
| 保存失败通知（第1/2层） | —— | OfficeBase recordSaveFailure + BussinessController 两个新接口 + project.js/OfficeEditor.js 黄色警告条 | ✅ 已实现（待最终验证+提交） |
| MHT 假扩展名 .doc 无法打开（2020年度企业基础信息表.doc） | 文件实为税局网站生成的 MHT（头 `Content-Type: Multipart/related` **首字母大写**）挂 .doc 名：①上层 detectActualFormat 只认 PK↔OLE2 放行 → FormatFrom=DOC → OLE2 读取失败（ret=-2147216560，bin 不生成）；②FileConverter 的 isMultiPartsHtmlFormatFile indexOf 大小写敏感漏检（兜底 TXT 空壳）。C++ x2t 同样漏检（双参数模式产 56KB 无正文空壳） | OfficeBase.detectActualFormat 加 MHT 分支（前 512B 大小写不敏感双关键词 → "mht"，下游 getOfficeFileType/CanvasType("mht")=71/8193 现成）+ COfficeFileFormatChecker.isMultiPartsHtmlFormatFile 大小写不敏感化 | ✅ 命令行 E2E-PASS（2026-11-11，待 Eclipse touch/重启/浏览器实测/提交） |
| MHT 打开后 MIME 头混入正文 + 表格挤成窄竖条（同上文件，用户实测反馈） | ①CHtmlFile2_Private.mhtXhtml 又一处大小写敏感 indexOf("Content-Type: multipart/related") → 误走 htmlXhtml 兜底，`<html>` 前的 MIME 头全部变成正文文本（完整 MHT 解析器 HtmlToXhtml.mhtToXhtml 根本没被调用）；②表宽写出对任何正宽度硬编码 `w:type="pct"`（660px → 660/50=13.2% → 窄条；tcW 分支本来就正确区分 dxa/pct，tblW 分支没跟上）。两处 C++ 原版同错——该链上游从未走通所以从未暴露 | mhtXhtml 检测大小写不敏感化（1 行）；tblW 改为绝对宽度写 dxa（×10 封顶 31680，同 tcW 模式），百分比宽度维持 pct | ✅ E2E：MIME 残留=false、正文完整、tblW=6600 dxa+jc=center（2026-11-11，待实测/提交） |
| 张人才办（2018年第59号）领军人才创业项目计划书.doc 无法打开 | Table.Table_copy 里 `this.documentMapping.copy(oSrc.documentMapping)`——C++ 原型 `DocumentMapping*` 是**指针共享语义**（全部 Table/Row/Cell 共用同一解析上下文，_lastValidPapx 备份恢复依赖此共享），VarsCopy 生成器错生深拷贝调用：裸 new 的 dst.documentMapping 为 null → NPE（嵌套表格 TableCell.AddItem→Clone 触发） | Table.java:119 改共享赋值 `this.documentMapping = oSrc.documentMapping`（同 rows 修复模式，家族规律 #1/#2） | ✅ ret=0、317KB bin、正文关键词全命中（2026-11-12；注意 C++ x2t 对该文件本身也静默失败，修复定性依据=C++ 源码语义而非 x2t 行为） |
| MHT 表格视觉丢失 + 宽度偏窄 + 表2 缺 tblW（第三轮，2026-11-12） | 四层：①CBorder 四边方法短路 OR（官方 2024-05-23 已修，移植源带病）→ border="1" 只设 left.width、四边 style 全空；②readTable 不 EqualSides 分支 `insert(35, GetId())` 裸插非法 XML（原版即坏）→ bin 链丢 tblW、边框规整为 none；③HTML 属性无单位值落 UnitMeasure.None 被当 pt（应=px），×10 系数又错（应 pt×20，660px→9900 dxa）；④pct 语义错（50% 应写 2500=50×50，而非 deviceW/2 点数） | CBorder 四边去短路；CBorderSide outset 映射直通；GetSubClass 属性规范化（width/height 裸数字补 px、border N→"Npx outset"，N=0 只补 px）；tblW/tcW 按单位分派重写（pct×50 / dxa×20）；删 insert hack | ✅ 用户实测确认（2026-11-12 提交） |
| MHT 文本层：字号减半/不居中/字体全变 Times New Roman/表2 内容被压扁（第四轮，2026-11-12 用户实测反馈 5 条） | ①R_Sz 直写 CDigit 的 pt 原值（"18.0"）缺 ×2（w:sz=半磅）；②td@align 只进 m_oDisplay.SetHAlign（表级 jc 消费），段落 jc 取 m_oText 的 text-align → 断链；③CXmlElement R_RFonts 硬编码 TNR、取到的字体名不用；④getFontLine 经 CDigit Empty→0.0 算出 w:line="0"，OnlyOffice 渲染器按 0 行高压扁内容（渲染器本身可信——word.docx 渲染正确，用户裁定） | CDocumentStyle.getFontSz（×2 半磅整数、px/%折算、空不写）+ 删 getFontLine 死分支（无 line-height 不写 w:line）；CXmlElement 用实际字体名写四槽；GetSubClass 块级 align→text-align 桥接（td/th/p/div/h1-h6） | ✅ 用户实测确认"效果非常好"（2026-11-12 提交） |

**家族规律**：绝大多数是"机械移植+人工修补"缺陷，三大模式：
1. **VarsCopy/值成员未初始化**（C++ 值成员构造即有，Java 裸 new 全 null）
2. **C++ 语义映射缺口**（shared_ptr 共享 vs null 上调方法、map operator[] 自动建条目、null→false 隐式转换）
3. **路径/拼接差异**（fontDir 尾斜杠、相对路径基准）

## 二、逐个分析新文件的标准流程（方法论）

### Step 0：信息收集（不动代码）
```
1. 文件本地路径 → python 读首 4 字节验魔数（D0CF11E0=OLE2、504B=ZIP）排除假扩展名
2. 若假扩展名（如 .docx 实为 OLE2）→ 先看 detectActualFormat 是否已覆盖该方向
3. 真格式 → 走 Step 1
```

### Step 1：命令行复现（DiagTiming 万能工具）
```
javac -g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  -d src/com/DocSystem/websocket/office/test/bin src/.../test/DiagTiming.java
java -Xmx4g -Dfile.encoding=UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*;src/com/DocSystem/websocket/office/test/bin" \
  com.DocSystem.websocket.office.test.DiagTiming <输入文件> <输出目录> [temp|notemp] [fontDir] [formatFrom] [formatTo] [debug|withchanges]
```
- 格式常量：DOC=66 DOCX=65 XLS=258 XLSX=257 PPT=130 PPTX=129 BIN：word=8193 xls=8194 ppt=8195
- `debug` 出全量日志（落 `test/tmp/DiagTiming.log`）
- `withchanges`：输入 bin 旁放 `changes/changesN.json` 走 apply_changes（保存链复现）
- 注意：**输出目录要带尾斜杠或理解 DiagTiming 拼接规则**（outDir+"Editor.bin"）

### Step 2：拿堆栈定位
- NPE → 直接看行号（注意 ECJ 编译的 Eclipse 部署 class 行号与 javac 有偏差）
- **被吞的 NPE（秒失败、无堆栈）**：`BinReaderProcessor.readChild` 的 catch 只 debug 级。临时给 catch 加 `Log.info` 打印堆栈，定位后删掉
- 无异常但卡死：后台跑 + `jstack <pid>` 抓栈（顶帧常被 JIT 内联，需多采样/全帧看非业务帧如 BitSet 构造=无限 new）

### Step 3：C++ x2t 交叉验证（定性金标准）
```
双参数形式（按扩展名定方向，已验证可用）：cd <office-editor部署目录>/server/FileConverter/bin && ./x2t.exe <输入> <输出Editor.bin> <fontDir/>
（params.xml 形式在 7.0.1.37 下无输出无产物，别用；x2t 退出码不可靠，成败只看产物）
```
- x2t 也崩 → sdkjs 上游 bug（找 js 层修法：给分发点包 try-catch 跳过）
- x2t 成功 → 纯 Java 移植缺陷 → 对照 C++ 语义修 Java
- ⚠️ **"x2t 成功"必须再验产物内容**（bin 里搜正文关键词）：C++ 解压层逐 entry 容错（坏 entry 跳过、partial 输出保留），损坏 ZIP 也能"成功"产出**无正文空壳**（先例：win7配置GO.docx，1.8MB bin 全是样式表）——空壳≠可恢复
- **"文件本体损坏"判定法**（先例：win7配置GO语言环境eclipse配置Go开发.docx，2026-11-12）：①python zipfile 报 Bad magic（EOCD/CD 偏移错）②逐 LFH 锚点分段解压统计（header 字段合理的 entry 独立解压仍 FAIL = 数据真坏）③用 CD 权威偏移+权威 csize 复核核心 entry（排除锚点法边界误判）④核心 entry（document.xml）DEFLATE 坏 + CD 条目被覆盖 + 膨胀错位 ⇒ 灾难性物理损坏，**无可修代码缺陷**，结论=文件坏了（找原始副本），别在代码侧修——Java 逐 entry 容错只能得到 C++ 同款空壳，反而误导用户

### Step 4：修复原则（CLAUDE.md 已沉淀，重申关键）
- **测试覆盖决定修改方式**：覆盖不到的代码禁止批量替换；聚焦单文件精准修
- C++ 语义对照三条：shared_ptr→共享赋值、值成员→初始化、map[]→computeIfAbsent
- 修后必跑：最小复现 + `verify_doc_pipeline.ps1 -Fast` + 用户浏览器实测
- 编译：`-g -encoding UTF-8 -d WebRoot/WEB-INF/classes`，**javac 后 Eclipse 需 touch 源文件让 ECJ 重编再 publish**（手动复制 class 到 wtpwebapps 会被 Eclipse 构建覆盖，不可靠）

### Step 5：前端问题（浏览器现象）
- in-app browser 测试慢且易有假阳性（弹窗可能是 JS alert 不进 DOM 快照；渲染进程忙到 screenshot 超时）
- 优先让用户实测；需要线上证据时用户拿日志（debug 模式）来分析
- 改 project.js 必 bump 两 html 版本号（缓存纪律）；DocSys.js/OfficeEditor.js 同理（office 三变体页）

## 三、本会话踩过的坑（防再踩）

0. **服务端打开链 `checkFileFormat=false`**（OfficeBase.convertOfficeFileToBin 内显式关闭）：转换方向**完全**由 `detectActualFormat + getOfficeFileType/getOfficeCanvasType(ext)` 决定，FileConverter 内部 `isOfficeFile` 的内容检测改写**不参与打开链** ⇒ 一切「假扩展名」类问题必须修**上层 detectActualFormat**；只修 COfficeFileFormatChecker 对打开链无效（但可消除其他 checkFileFormat=true 路径的盲区，本例两处都修了）。
1. **WebRoot/WEB-INF/classes 里的旧测试 class 优先于 test/bin**（DiagTiming 曾因此假复现）——测试前 `rm WebRoot/WEB-INF/classes/com/.../test/你的测试类.class`
2. **Git Bash sed -i 会把 CRLF 全改 LF** 污染整文件 → 用 perl -pi（字节级保留）或 python hex 转义（`\x22\x5c`）替换；替换后必 git diff 验证只动了目标行
3. **python 重写代码块时拼接偏移量错误**吃掉相邻代码（cessUser.do 事故）→ 大块重写后必 grep 相邻方法的注解完整性
4. **sdkjs 前后端共用**：sdk-all.js 浏览器也加载，绝不能通过隐藏/删除它来制造服务端失败
5. **触发保存失败的正确方法**：破坏部署目录 `server/FileConverter/bin/DoctRenderer.config`（把某 file 行指向 .NOTEXIST，备份 .testbak）——只影响服务端 apply_changes，前端/打开不受影响
6. **Eclipse 环境**：它用自己的 ECJ 构建+publish；我 javac 到工作区 classes 后，需用户在 Eclipse touch 源文件（触发 ECJ 重编）+ 重启 Tomcat 才真正生效
7. **保存链 changes 数据在** `OfficeEdit/<docId>/<dockey>/orgChanges/`（保存失败时移入 ErrorChanges<时间>/ 归档）
8. _Lang() 只支持 3 参（str1,connectStr,str2），多参调用被静默截断——多段文案直接用 + 拼接
9. **x2t.exe 退出码不可靠**：连打印 usage 都返回 88，转换成败只能看产物文件是否生成；交叉验证优先用**双参数形式** `x2t <in> <out.bin> <fontDir>`（按扩展名定方向，已验证可用）——params.xml 形式在当前 7.0.1.37 版本下无输出无产物（原因未查，别再用）。
10. **大小写敏感匹配是格式检测的常见盲区**：C++ `std::string::find`/Java `indexOf` 都敏感，而真实文件头大小写不定（本例 `Multipart/related`）。修法：两侧统一 toLowerCase（⚠️ 目标串也要小写——只转一侧反而把原本能匹配的弄坏，本例实测踩过）。

## 四、环境速查

- 开发实例 `C:\TomcatForDocSysDev`（PublishDev.bat 发布）；`C:\MxsDoc` 正式实例默认不碰（用户明确授权时可访问）
- Eclipse 工作区 `D:\EclipseProject\EclipseWorkspaceForDocSys`，部署目录 `.metadata/.plugins/org.eclipse.wst.server.core/tmp0/wtpwebapps/DocSystem`
- 正式库 sqlite：`C:/MxsDoc/docsys/tomcat/DocSystem.db`（repos/doc/doc_lock 表）；文档物理路径 `C:/DocSysReposes/<vid>/data/rdata/`
- 提交归属：office 核心 `git -C src/com/DocSystem/websocket/office`；office-editor 嵌套仓库 `WebRoot/web/static/office-editor`；主仓库前端 js/html；测试 test 仓库
- sdkjs 版本 7.0.1 build 37；字体库 bin/AllFonts.js+font_selection.bin（包瘦身不再随包，运行时生成）；sdk-all.cache 由 js 生成（js 是源，删 cache 自动重建）
- Office 保存三通道：服务端保存（bin+changes 重放，apply_changes 走 GraalJS + sdk-all.js）/ 前端另存为（浏览器内存态直接序列化，不重放）/ isOnlyOfficeUsed 模式（外部 x2t.exe）

## 五、接续清单（新 session 起手）

1. 读本文件 + CLAUDE.md（会话恢复协议）
2. 新的无法打开文件 → 按本文件 §二 标准流程逐个分析
3. 2026-11-11 MHT 假扩展名修复（2020年度企业基础信息表.doc）**已全部收尾（2026-11-12 用户实测确认）**，四轮修复详录见 §一 最后三行与归档卡 `已完成/CURRENT_STATE_MHT格式打开与Word本地打开不一致.md`（含官方 core 仓库溯源结论：移植源=2023-06 `HtmlFile2/htmlfile2.cpp` 老代；CBorder 短路为官方 2024-05 已修的带病移植；normalizeHtmlAttrValue 属性语义层为双方都缺的全新补齐；老 readTable 已被官方重写丢弃）。**可复用方法**：①"渲染器可信"裁定——显示差异一律回溯到我们 bin 里的值，用 word.docx 参照经同一 bin 链（DiagTiming 65→8193→65）做结构对比断言；②HtmlFile2 的样式链三级排查：GetSubClass 属性收集 → CCompiledStyle.AddStyle 分派 → CDocumentStyle/CXmlElement 写出。
4. 挂起的已知边界（MHT 卡遗留，遇到样本再修）：tr/tbody 的 align 行级继承未桥接；line-height 换算系数可疑（None→×24、Percent→×0.24，w:line 单位=1/240 行）；docDefaults=Arial 22（原版固有）vs 参照 Times New Roman——是否对齐属产品决策；td@height→trHeight 不做（对齐参照，Word 另存也丢）
4. 上一 session 遗留待办：
   - 保存失败通知（第1/2层）的最终验证与提交（清单见上一 session 末尾）
   - 可选项：Excel 保存"xlsx fallback 成功但报错"提示降噪、changesErrorHandler 降级加固、extractAllForZipFile 大小校验
   - OdfFileStatic.java:82 编译失败烙死的死类（独立隐患）
   - sdkjs 补丁升级时的重打提醒（sdk-all.js 无版本控制资产档案，补丁标记搜 "sdkjs-patch"）
