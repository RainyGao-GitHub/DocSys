# OLE 嵌入对象/脏 XML 致 doc 无法打开（SVN系统管理操作手册.doc 等 7 个）

状态：**🔧 修复完成待用户浏览器验证（2026-11-03 凌晨；SVN 手册命令行 bin 91456B + 全回归绿；dev 实例已发布待用户实测）**
- 模式：用户裁定 **一次聚焦一个文件**，修完用户浏览器验证（验证通过用户自行移入 `Word文件无法打开/已修复/`；用户验证比代理浏览器验证高效——artDialog 之外的 alert 类失败提示 DOM 快照不可见，曾致假阳性）
- 剩余 7 个（2026-11-02 盘点）：SVN手册、TracSystem概要、TracSystem详细、Trac手册、andriod app 概要设计、TracSystem需求文档（bin 能生成但打不开）、自由团队需求规格 V1.01.docx（同前）
- 问题等级：P1（带 OLE 嵌入对象的 doc 全部无法打开）

## 一、SVN手册分析与修复记录（本卡对象，2026-11-03）

### 根因（四层洋葱，逐层剥开）

1. **第一层（主根因）**：`WordprocessingDocument.SaveDocument:477` `iter.data.getValue()` 拆箱 NPE。
   `OleObjectMapping.copyEmbeddedObject` 只对 `isEquation||isEmbedded||nWordVersion==2||isPackage` 四类 OLE 赋 `data`，其余（如链接式）不赋就入列表——C++ `pair<shared_array,size_t>` 默认 `{nullptr,0}`，`second>0` false 走 `SaveOLEObject`（从源 doc ObjectPool 按 objectID 拷流，不碰 data）；Java `SimpleEntry` 默认 null 直接炸。
2. **第二层**：修掉 477 后 docx→bin 读中间 document.xml 时 `XmlReader.xmlTextReaderRead:244` NPE（`this.document` null）。
   中间 document.xml 的 `ProgID="\n\x00\x00\x00Sta"` 含 NUL 脏字节（doc 二进制 OLE 字符串残留）；**C++ x2t 的中间产物同样脏**（x2t 转同文件成功 68133B，过程中 libxml2 报 Char 0x0 静默跳过）——生成端两边一致，C++ 靠 libxml2 流式读意外容错活命，Java JAXP DOM 全有或全无。
   且 `XmlUtilsStatic.xmlReaderForMemory` 失败仍返回非 null reader（丢弃 boolean），`FromFile` 的 null 检查形同虚设——C++ 返回 NULL 指针。
3. **第三层**：`CColor.CColor_copy:135` NPE——VarsCopy 自动生成模式
   `this.m_oX.m_pPointer.copy(oSrc.m_oX.m_pPointer)` 在字段未初始化时必炸（C++ nullable 赋值=深拷贝或保持空，从无 null 上调 copy）。`CRunProperty.Merge` 链触发。
4. **系统性背景**：VarsCopy 模式全库 3025 行/778 文件（OOXML 包）。曾尝试批量替换为共享赋值（810 文件）+18 个损坏编码注释文件修复，**用户裁定回退并沉淀为通用策略（已写入 CLAUDE.md「代码修复策略：测试覆盖决定修改方式」）**：测试覆盖不到的代码禁止批量替换修复（可疑≠有错，回归绿不代表安全）；唯一例外是有明确证据证明批量替换本身正确（如 VML 丢空格卡的宏展开对照）。已全部回退重编，classes 已恢复干净（4 个 Spreadsheet 既有类型错误文件的 10-16 旧 class 原样保留）。后续撞到 VarsCopy 同模式 NPE 时，一律按"聚焦单文件→单类精准修"推进（下一个：Trac 手册的 CHpsMeasure）。

### 修复清单（5 处精准修复，全部有测试覆盖）

1. `MsBinaryFile/DocFileFormat/WordprocessingDocument.java:477`：`iter.data != null &&` 判空（null≡second==0 → 走 SaveOLEObject）
2. `xml/XmlUtils/XmlUtilsStatic.java`：`xmlReaderForMemory` 失败返回 null（对齐 C++ NULL；`xmlReaderForString` 本就如此）
3. `xml/XmlUtils/XmlReader.java:244`：`xmlTextReaderRead` document==null → mode=ERROR return 0（兜底）
4. `MsBinaryFile/XMLTools/CStringXmlWriter.java`：`WriteAttribute(String,String)` 滤除 XML 1.0 非法字符（保留 \t\n\r；C++ 靠 libxml2 容错，Java DOM 必须产物合法）→ 中间 XML 合法、内容零丢失（bin 91456B > C++ 68133B，C++ 丢 NUL 后 35%）
5. `OOXML/ComplexTypes/Word/CColor.java`：`CColor_copy` 改判空深拷贝（Init+copy，C++ nullable 语义）
6. 附带：18 个 Spreadsheet 文件注释损坏编码修复（非法字节→U+FFFD，纯注释零行为影响；为 javac 可编，Eclipse ECJ 本就宽容）——文件清单见 test/tmp 无，源码 git diff 可见

### 验证（2026-11-03 凌晨）

- SVN手册：`Editor.bin 91456B` 成功（C++ x2t 68133B 同量级且 Java 内容更全）；C++ 交叉：转 docx 成功但 OLEObject 片段解析报错被跳过
- **同根因文件（5 个批量失败样本）**：SVN手册✓91456、Trac概要✓363027、Trac详细✓460390、andriod✓11632、**Trac手册✗（CHpsMeasure_copy:119 NPE——下一个待聚焦文件，VarsCopy 同模式，届时单类精准修）**
- TracSystem需求文档✓47368（bin 能生成，浏览器打不开是另一问题待分析）；V1.01.docx✓988050（同前）
- 回归：修复 1-5 版全量 24/24 全绿（11 样本零漂移+1.5/1.6/1.7 断言+保存链路+回环）；批量替换版也曾 24/24（已回退作废）；回退后 -Fast 快速回归全过
- **待用户浏览器验证**：dev 实例已发布重启（8100），SVN手册（Word文件无法打开 目录）

## 二、剩余文件清单与下一步

| 文件 | 状态 | 下一步 |
|---|---|---|
| SVN系统管理操作手册.doc | **✅ 用户浏览器验证通过，已移入 已修复/**（2026-11-03） | 完成 |
| TracSystem软件概要设计.doc | **✅ 用户验证通过（已修复/）** | 完成 |
| TracSystem软件详细设计说明书V1.00.doc | **✅ 用户验证通过（已修复/）** | 完成 |
| andriod app 概要设计.doc | **✅ 用户验证通过（已修复/）** | 完成 |
| TracSystem需求文档.doc | **✅ 用户验证通过（已修复/）**——此前"bin 能生成但浏览器打不开"未复现 | 完成 |
| Trac系统管理操作手册.doc | bin 86312B（2026-11-03 修复，见 §二.1） | **用户浏览器验证中** |
| 自由团队需求规格 V1.01.docx | bin 988050B 但用户浏览器打不开 | 剩余最后一个，单独分析（docx 路径） |

### 二.1 Trac手册修复记录（2026-11-03）

- 根因：与 CColor 同构的 VarsCopy 模式，炸点 `CHpsMeasure_copy`（w:sz/szCs，Merge 链——文档带 85 处 rStyle 样式引用必触发；不带 rStyle 的普通文档不进 Merge 所以不炸）。
- **炸点全集普查法**（本次新增的分析方法论）：中间产物 document.xml + styles.xml 的 rPr 子元素全集 → 映射到 CRunProperty.Merge 会 Copy 的类 → 对照各类是否含 `m_pPointer.copy(oSrc` 模式行 → 收敛出将炸清单，一次修完不逐层撞：
  - CHpsMeasure(1行, sz/szCs)、CSignedHpsMeasure(1行, kern)、CUnderline(5行, u)——**本次修复（3 类 7 行，CColor 同款判空深拷贝）**
  - CFonts(rFonts)——前人已修（判空版）；COnOff2/CLanguage——零模式行安全；CColor——上轮已修
- 验证：Trac手册 `Editor.bin 86312B`（与批量替换时代字节一致，互相印证）；SVN手册复验 91456B 不变（已修复/ 目录）；-Fast 回归全绿（1.7/保存/回环）。
- 编译后 classes 已就位（Eclipse 输出目录共用），用户 Eclipse 侧 Tomcat 需重启/重部署才会加载新 class。

## 三、工作规矩（延续）

- 增量编译带 `-g -encoding UTF-8`，输出 WebRoot/WEB-INF/classes；**classes 与源码一致性敏感**（曾因批量 class 残留导致假验证——回退代码必须同步重编全部受影响 class）
- 修复以"测试能覆盖"为界（用户 2026-11-02 裁定），覆盖不到的保持原样
- scratch：`test/tmp/WordOpenFail/SVN/`（C++ 参数与产物 cpp_Editor.bin/cpp_output.docx）

## 四、里程碑

- [x] 2026-11-02 深夜 分析报告（四层根因 + C++ 交叉验证）+ 用户裁定开工
- [x] 修复 1（477 判空）→ 修复 2/3（reader null 语义）→ 修复 4（属性清洗）→ 修复 5（CColor 深拷贝）
- [x] 批量替换 810 文件 → 用户裁定回退 → classes 重编恢复干净（教训记入 CLAUDE.md 修复策略）
- [x] SVN 手册 bin 91456B + 4 个同根因文件过 + 全量回归 24/24 + -Fast 复验
- [x] dev 实例发布重启（2026-11-03 凌晨）
- [x] 2026-11-03 用户浏览器验证通过 5 个（SVN/Trac概要/Trac详细/andriod/Trac需求——均已移入 已修复/，其中 Trac需求文档此前的"打不开"未复现）
- [x] 2026-11-03 Trac手册：普查收敛 3 类 7 行（CHpsMeasure/CSignedHpsMeasure/CUnderline）判空深拷贝 → bin 86312B + -Fast 回归绿 + SVN 复验不变
- [ ] 用户浏览器验证 Trac手册（Eclipse 侧 Tomcat 需重启加载新 class）
- [ ] 最后一个：自由团队需求规格 V1.01.docx（bin 能生成但打不开，docx 路径，单独分析）
- [ ] office 仓库提交（等用户验证后）
