# VML 属性序列化丢空格导致 doc 无法打开（上线准备工作.doc）

状态：**🔧 修复完成，8100 实测进行中（2026-11-01 深夜；命令行/回归全绿，dev 实例服务端 bin 生成+下发已实锤；浏览器视觉确认等用户重置字体库后继续）**
- 来源：线上用户样本（仓库1 `Word文件无法打开/上线准备工作.doc`）
- 前序分析：2026-11-01 会话完成（tblGrid/AllSepx 两卡之后的第三项），证据链完整见 §二
- 问题等级：**P1**（含相应 VML 属性的 doc 全部无法打开，硬故障）
- 家族背景：本项目第三个"机械移植+人工修补"引入的缺陷（前两个：HashMap≠std::map ×2，office 提交 5b4a3174/7fc7a1bd）

## 8100 实测记录（2026-11-01 深夜 ~ 11-02 凌晨，**主样本 PASS**）

- dev 实例 = TomcatForDocSysDev（8100），Admin 登录，PublishDev.bat 增量发布（class 22:25）+ 重启。
- **服务端**：浏览器双击 `测试仓库2/Word文件无法打开/上线准备工作.doc`（docId 202884485226）→
  23:29:07 生成 `OfficeEdit/202884485226/1427783164/data/Editor.bin` **14368B（与命令行一致）**，
  `downloadDocEx`/`sendFileToWebPage` 日志确认下发成功。
- **视觉确认 PASS**（11-02，用户重置字体库后，`generateFontsWithVerify Done ready:true` 06:48:56）：
  IAB 内 Office 编辑器完整渲染——标题「自由团队上线准备工作」、正文「一、主机/硬件需求/- CPU 单核」
  与原件一致、**页面背景效果保留**、无任何错误弹窗、加载完成；截图存档
  `test/tmp/DiagVmlToXml/office_preview_rendered.png`（空白期那张= office_preview_1.png）。
  修复前该文件直接 NPE 无 bin、必弹"获取文件信息失败"。
- **同目录浏览器抽测修正版结论（11-02，结合服务端 OfficeEdit 目录核对）**：
  浏览器端"URL 变化+无弹窗"判据存在**假阳性**（转换失败的前端提示走 JS alert，不进 DOM 快照）。
  以服务端 Editor.bin 生成记录为准：我测过的文件中**确认成功 12 个**（主样本+上线(1)、#2热机(1)、
  BugFree、HowTo、MeetingRequest、Trac需求、UI设计、gofreeteam、商业合作、开发常见错误、研发流程(一)）；
  **假阳性 4 个**（SVN手册、Trac概要、Trac详细、Trac手册——服务端无 bin）。
  其余样本按 11-02 用户裁定由用户自己验证。
- **命令行批量 23 个全量结果（batch.log，11-02 晨）**：17 成功 / 6 失败。
  6 个失败（SVN手册、Trac概要、Trac详细、Trac手册、andriod app 概要设计、＋上述之一）全部同一根因：
  **`NullPointerException at WordprocessingDocument.SaveDocument:479`**——调用处
  `iter.data.getValue()` 时 `OleObjectFileStructure.data` 为 null（OLE 嵌入对象无 data 流，
  C++ 里 `iter->data.second` 不存在 null 语义 ⇒ 第 4 个"机械移植+人工修补"家族缺陷，独立新问题，
  不属本卡 VML 范围）。6 个失败样本均为带 OLE 嵌入对象的文档。

## 修复实施记录（2026-11-01 晚会话）

1. **主修复 87 行 / 13 类**（perl 批量 + hex 转义避开引号地狱；CRLF 完好）：
   - 83 处 `+ "\"";` → `+ "\" ";`（含 13 行注释参照同步改）
   - CImage grayscale/bilevel 常量属性 2 处补尾空格（两属性可同置，粘连即非法）
2. **正向用例揪出 2 个 83 处清单外的同家族漏网，已修**：
   - `CImage.java:375` 开-tag `"<v:image"` 缺尾空格（其余 20+ 类全有）→ 有 id 属性时
     产生 `<v:imageid="..."` 非法 XML；
   - `CVmlCommonElements_WriteElements()` `String sResult = null;`（C++ 是空串）→
     toXML 输出字面量 `null`（`<v:background ...>null</v:background>`）。
3. **NPE 降级**：`CDrawingConverter.AddObject`（原 1533 行）`boolean bResult = ParceObject(...)`
   自动拆箱 null Boolean 必 NPE → 改为判空（null→false→S_FALSE，对齐 C++ bool(NULL)=false）
   + `Log.warn` 记跳过。`WriteDrawing` 对 S_FALSE 本就优雅跳过，无需改。
4. 验证中间结论：
   - 编译过（javac -g -encoding UTF-8 → WebRoot/WEB-INF/classes）；
   - 最小复现：`Editor.bin 已生成 14368B`，ret=0（C++ 参照 21808B 同量级）；
   - **Java/C++ 回转结构一致**：两边 bin→docx 均 63 文本段、同首段文本、同 `w:background`
     （回转后均无 v:background，写回行为与 C++ 一致）、同 0 图片（原件无图）；
   - `DiagVmlToXml`（新诊断类，test 仓库）4/4 PASS：background 样本复刻 / CVmlCommonElements
     25 属性全置齐 / CImage 全属性含 grayscale+bilevel 相邻 / CStroke 7 属性，全部 well-formed
     且无 null 文本；输出存档 `test/tmp/DiagVmlToXml/DiagVmlToXml.log`；
   - `verify_doc_pipeline.ps1` 已加第 11 夹具基准（上线准备工作.doc=14368）+ Step 1.7 断言
     （w:background 存活 / 正文标题完整 / document.xml well-formed）。
   - ⚠️ 工具教训：Git Bash sed -i 会把 CRLF 全改 LF 污染整文件（首跑即中招，git checkout 回滚）；
     引号/反斜杠正则在 bash/perl 间极易错配（两次替换串写错），最终用 `\x22\x5c` hex 转义一次成功。

## 一、问题与复现

- 样本（已固化夹具，md5 `64da6322f06d7840d1b04b9e6850c765`，24KB，真 OLE2 Word97）：
  - 服务器原件（只读）：`C:/DocSysReposes/1/data/rdata/Word文件无法打开/上线准备工作.doc`
  - 夹具：`office/test/tmp/TestDocNpeRepro/inputs/上线准备工作.doc`
  - scratch：`office/test/tmp/WordOpenFail/`（含 C++ 参照 `cpp_Editor.bin` 21808B）
- 复现命令（修复前必失败）：
  ```
  java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*;office/test/bin" \
    com.DocSystem.websocket.office.test.TestDocNpeRepro \
    office/test/tmp/TestDocNpeRepro/inputs/上线准备工作.doc
  ```
  失败形态：`【XmlReader】xmlReaderForMemory() XML parsing error`（"元素类型 v:background
  必须后跟属性规范"）→ `NullPointerException at CDrawingConverter.AddObject:1533`
  → `【失败】Editor.bin 未生成`。

## 二、根因（已实锤，勿重查）

样本文档带页面背景（`w:background` + VML `v:background id/stroked/coordsize`）。
doc→中间 docx 产物**干净**（`temp/docx_unpacked/word/document.xml` 已验证合法）；
坏在 docx→bin 步骤对 VML 节点的**重序列化**：

1. **第一层（根因）**：`BinaryDocumentTableWriter.WriteBackground`（≈1249 行）调
   `OOX/Vml/CBackground.toXML()`（由 `CVmlCommonElements_WriteAttributes()` 拼属性）。
   C++ 原版宏 `ComplexTypes_WriteAttribute` 生成 `name="value" `（**结尾带空格**）；
   Java 初版移植丢右引号，后期修补加回右引号却删了空格（`+ "\"";`）。
   本样本输出 `<v:background id="_x0000_s1025" coordsize="21600,21600"stroked="f">`
   → 非法 XML → Xerces 拒绝。
2. **波及面（grep `+ "\"";` 统计）**：OOX/Vml 包 **83 处 / 13 个类**——
   CVmlCommonElements 25（style/coordsize/coordorigin/wrapcoords/o:hralign/
   o:border{top,left,bottom,right}color/o:dgmlayout*/o:insetmode/chromakey/filled/
   fillcolor/opacity/stroked/strokecolor/strokeweight/insetpen/o:spt/o:connectortype/
   o:bw{mode,pure,normal}…）、CImage 20、CImageData 11、CFill 9、CStroke 7、
   CPath/CGroup/CClientData 各 2、CTextbox/CTextPath/CShadow/CH/CBackground 各 1。
   （CBackground:265 的 o:targetscreensize 位于 `>` 前虽无害，也应一并恢复以对齐 C++。）
3. **第二层（雪崩）**：XML 解析失败后 Java 未像 C++ 那样返回 S_FALSE 优雅跳过，
   null 传导至 `NSBinPptxRW/CDrawingConverter.java:1533`（AddObject/ParceObject 路径）抛 NPE，
   整个转换中止。
4. **责任边界（已验证）**：C++ x2t 同文件转换成功（`cpp_Editor.bin` 21808B，rc=0）；
   源文件与 Word 均正常 → 纯 Java 移植缺陷。

## 三、修复方案

1. 83 处 `+ "\"";` → `+ "\" ";`（恢复 C++ 语义；标签内多一个空格是合法 XML，安全；
   注意只改 toXML 属性拼接处，勿动其他语义相同的字符串拼接）。
2. `WriteDrawing`/`AddObject`/`ParceObject` 失败路径对齐 C++：解析失败返回 S_FALSE，
   WriteDrawing 跳过该绘图对象继续转换（不 NPE、不中断），可加 Log.warn。
3. 检查同包其他 `toXML()` 是否还有同模式漏网（宏对照），有则一并恢复。

## 四、验证方案（修改前先定死，全部通过才算完成）

1. **最小复现**：上述命令修复后 `Editor.bin 已生成`；bin 与 C++ 参照结构对齐
   （尺寸同量级，`TestBin2Docx` 转回 docx 后 background/正文/图片内容完整）。
2. **VML 正向用例**：构造/选取含多 VML 属性相邻的样本（如 shape 带 style+strokecolor+strokeweight），
   确认 toXML 输出合法（可写小诊断 `DiagVmlToXml` 打印 toXML 串自检）。
3. **全链路回归** `verify_doc_pipeline.ps1` 10 样本全不漂移；新增第 11 夹具
   `上线准备工作.doc` 基准 + **Step 1.7 断言**（打开成功、bin 大小=基准）。
4. 8100 用户实测：上传原件打开正常、页面背景/内容显示正确。

## 五、工作规矩（延续，违反=返工）

1. 增量编译：`javac -g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`
2. 每次代码修改的完成定义 = 验证通过（最小复现 → 回归 → 用户实测）；
3. `C:\MxsDoc` 正式实例绝不碰；office 代码独立仓库 `git -C src/com/DocSystem/websocket/office`；
   源码树不留 .class；scratch 只写 `test/tmp/<测试名>/`；
4. 建议顺带把 Gitee issue 提了（参照 IKS1JU 流程：草稿放 DevAgentControl/，token 在
   `DevAgentControl/.gitee_token`；评论 `POST /repos/{owner}/{repo}/issues/{n}/comments`，
   关闭 `PATCH /repos/{owner}/issues/{n}` 带 repo+state）。

## 六、材料索引

- 失败堆栈与中间产物：`office/test/tmp/TestDocNpeRepro/上线准备工作/`
- C++ 参照：`office/test/tmp/WordOpenFail/cpp_Editor.bin`（21808B）
- 根因代码：`OOXML/OOX/Vml/CVmlCommonElements.java:1238` 起（WriteAttributes）；
  `OOXML/OOX/Vml/CBackground.java:249`（toXML）；
  `OOXML/BinDocxRW/BinaryDocumentTableWriter.java:1249/6256`；
  `OOXML/NSBinPptxRW/CDrawingConverter.java:1533`
- 波及面清单命令：`grep -rn '+ "\\"";' office/OOXML/OOX/Vml/*.java`

## 七、里程碑

- [x] 2026-11-01 问题发现 + 根因实锤 + C++ 交叉验证 + 波及面量化（前会话完成）
- [x] 2026-11-01 晚 87 行空格恢复 + 2 个清单外漏网（CImage 开-tag / WriteElements null）+ NPE 降级 + 编译
- [x] 最小复现通过（14368B，与 C++ 回转结构一致）+ VML 正向用例 DiagVmlToXml 4/4
- [x] 全链路回归 24/24 全绿（11 样本零漂移 + Step 1.5/1.6/1.7 断言全过）
- [x] 8100 dev 实例服务端实锤（bin 生成 14368B + 下发成功 + 无错误弹窗）
- [x] 8100 浏览器视觉确认 PASS（标题/正文/页面背景/无错误，截图存档）+ 抽测 12 个服务端确认成功
- [x] 命令行批量 23 个：17 成功 / 6 失败（全部 OLE 嵌入对象 data=null NPE，独立新问题见 §附带发现）
- [ ] 用户验证其余样本（11-02 用户裁定：自己验证）
- [x] office 仓库提交：核心代码用户已提交 `2f2219f7`【BugFix】doc文件无法打开（14 文件，
  全部修复完好在 HEAD，CImage 多出的行=行尾空白整理）；test 仓库 `b83d5ac`（DiagVmlToXml +
  verify_doc_pipeline 第11夹具/Step1.7）。Gitee issue 未提（可选，未做）
- [ ] 卡移入 `DevAgentControl/已完成/`（等用户验证完其余样本后收尾归档）

## 附带发现（低优先级，修完本卡再议）

- **新独立缺陷（建议开新卡，P2）**：带 OLE 嵌入对象的 doc 打开失败——
  `WordprocessingDocument.SaveDocument:479` 处 `OleObjectFileStructure.data` 为 null 即
  `iter.data.getValue()` NPE（C++ `iter->data.second` 无 null 语义，第 4 个同家族移植缺陷）。
  影响样本 6 个：SVN系统管理操作手册、TracSystem软件概要设计、TracSystem软件详细设计说明书V1.00、
  Trac系统管理操作手册、andriod app 概要设计（及同类）；复现命令同本卡批量（batch.log 有完整堆栈）。
  注意：浏览器端该失败可能无 artDialog 弹窗（假阳性风险，判据须以服务端 bin 生成/弹窗+alert 双查）。
- Vml 包乃至其他 OOX 包与 C++ 的宏展开（ComplexTypes_WriteAttribute*、
  WritingElement_ReadAttributes*）逐类对照审计，排查同类"移植+修补"缺陷。
