# CURRENT_STATE_Preparation文档显示与Office不一致（缺陷卡）

> 状态：**新建，现象已记录，待新 session 正式分析**（2026-11-23 建立，由"Office 无法打开/保存文件逐个分析" session 移交）
> 归属：**待定**——疑 doc→bin 转换链内容差异（表格/字体），以本地 Office 打开为基准
> 严重程度：**低-中**（文件已可正常打开——前置 AIOOBE 已修复并实测通过；仅剩视觉一致性）

## 一句话

`Preparation_of_Papers_in_Two_columns.doc`（IEEE 双栏论文模板）打不开问题修复后可正常打开，
但 **MxsDoc 里的显示与本地 Office 打开存在不一致（用户观察：表格/字体）**，属显示一致性范畴，
用户新开 session 以本地 Office 为基准对比分析。

## 测试文件

- 分析用副本（用户已备好）：`C:/DocSysReposes/1/data/rdata/Word文件显示和Office打开不一致/Preparation_of_Papers_in_Two_columns.doc`
- 原位置：`C:/DocSysReposes/1/data/rdata/Word文件无法打开/Preparation_of_Papers_in_Two_columns.doc`（docId=203867174501，仓库1）
- 访问链接：`http://localhost:8100/DocSystem/web/project.html?vid=1&doc=203867174501&path=<base64 Word文件无法打开/>&name=<base64>`

## 背景：前置修复（2026-11-23，已实测通过、可随批提交）

打不开的根因已修：`FormatUtils.MapValueToWideString` AIOOBE -8——Tab 描述符 `tbd.tlc` 字节 0xF8
（Java byte 读成 -8）通过 `value < size1` 上界检查后 `mapArray[-8]` 越界。修复=调用处
`tbd.jc & 0xFF` / `tbd.tlc & 0xFF` 零扩展（对齐 C++ `unsigned char`，产物 `w:leader="248"` 与
C++ 逐字一致，经用户指正从初版守卫方案改为无符号语义）+ 函数内 `value >= 0` 通用守卫。
改动文件：`MsBinaryFile/DocFileFormat/FormatUtils.java`、`ParagraphPropertiesMapping.java`。
**注意：本卡的显示不一致分析应在该修复部署后的产物上进行。**

## 现象（用户观察，2026-11-23）

- MxsDoc 打开 vs 本地 Office 打开：**表格、字体**两方面有不一致（具体差异点待新 session 逐项截图/列出）。

## 建议分析路径（新 session 起手）

1. **三端对比定位差异点**：MxsDoc 打开（doc 链 bin）vs 本地 Office 打开原 doc——先列出具体不一致点
   （哪页/哪个表格/什么字体），再决定对比粒度。
2. **产物级对比**（比 ppt 表格链有优势——**Word doc 链 C++ x2t 有完整对应实现**，交叉验证完全可行）：
   - x2t 双参数形式转 docx：`cd <officeEditor>/server/FileConverter/bin && ./x2t.exe <doc> <out.docx> <fontDir>`
   - 我们的 Java 链：DiagTiming 66→8193 后 bin→docx（8193→65 withchanges）往返产物
   - 解包两者 document.xml，对不一致点涉及的属性逐项 diff（表格：tblGrid/tcW/borders/tblLayout；
     字体：rFonts/sz/styles.xml 默认样式/主题字体）
   - **以本地 Office 另存的 docx 为最终基准**（用户可用 Word 另存一份放到同目录）
3. 已知先例参考（方法文档 §一）：doc 链此前修复过 VML 序列化丢空格、OLE NPE、SttbfAtnBkmk、
   TrackRevision/GetIntFromBits 等；字体类问题注意 styles.xml 默认样式与 theme 的传递。
4. 方法论/环境速查：`DevAgentControl/OFFICE文件排查方法与经验总结.md` §二/§四
   （DiagTiming 用法、x2t 双参数形式、GraalJS 重放、回归 verify_doc_pipeline.ps1）。

## 相关资产

- 本 session 现场产物（可复用）：`test/tmp/prep3/`（修复后 bin 40002B + temp/docx_unpacked 解包 + GraalJS 往返）
- CLAUDE.md 当前任务段已更新指向本卡
