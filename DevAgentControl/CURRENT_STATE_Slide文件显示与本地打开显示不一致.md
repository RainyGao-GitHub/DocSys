# CURRENT_STATE_Slide文件显示与本地打开显示不一致（缺陷卡）

> 状态：**已收敛定位，待继续追踪**（2026-11-14 建立，由"Office 无法打开/保存文件逐个分析" session 移交）
> 归属：**待定** —— 剩余差异疑为 OnlyOffice 前端（sdkjs 渲染）对某些表格/图形属性的解释与 PowerPoint 不同，暂无后端转换器证据
> 严重程度：**低**（文件可正常打开、背景/表格已基本正确，仅剩视觉细节出入）

## 一句话

`生活谷--物业生活服务平台2014.ppt` 经三轮修复（打不开→背景灰→黑斑→表格错乱）后，
ppt 与 pptx（PowerPoint 转存的基准）在 MxsDoc 里的显示**已基本一致**，但与**本地 PowerPoint 打开的原文件**
仍有少量视觉出入（用户怀疑 OnlyOffice 前端渲染差异，超出移交 session 的范畴）。

## 测试文件（用户已移至专用目录）

- `C:/DocSysReposes/1/data/rdata/Slide文件显示与本地打开显示不一致/生活谷--物业生活服务平台2014.ppt`
- `C:/DocSysReposes/1/data/rdata/Slide文件显示与本地打开显示不一致/生活谷--物业生活服务平台2014.pptx`（PowerPoint 转存基准）

对比入口（MxsDoc 双击文件图标即可打开）：
`http://localhost:8100/DocSystem/web/project.html?vid=1&path=<base64目录>&name=<base64文件名>&showType=1`

## 已完成的修复（移交 session，2026-11-13 ~ 11-14，共六轮）

| # | 问题 | 根因 | 修复 |
|---|---|---|---|
| 1 | 打不开 | 裸字段 null×3（CMetaHeader.rcBounds/ptSize、ENHMETAHEADER3.rclBounds、TxBodyWriter.m_oShapeWriter） | 构造/VarsInit 补初始化（已提交 67089516） |
| 2 | 后台报错+显示异常 | BMP bfOffBits 写错=2 + CorrectXmlString 返回值被丢弃 ×3 | CBgraFrame 偏移修正重试 + 接返回值（已提交 a6295bb2） |
| 3 | 样式与 pptx 不一致 | header 共享/Short 装箱/四槽共享/Copy 裸 new 四层 | 6 文件（用户已提交 5e598ba9 + 后续修正） |
| 4 | 打不开（毒 class） | 5e598ba9 带进裸 try 残骸 → ECJ 毒 class → 线程死+锁泄漏 | try 残骸恢复 + OfficeBase restore 容忍（用户已提交） |
| 5 | 背景整体灰色→黑斑 | (byte)255→-1 的 alpha=-392 / CorrectColorScheme 引用重绑定 / SaveFile 不写 m_pData+ImageIO 不支持 alpha BMP / pattern 前景色查表失败→黑 | CPPTElement+CPPTUserInfo+CBgraFrame（用户已提交） |
| 6 | **表格渲染错乱** | **ProtoTable 的 std::map→HashMap（坐标表无序→合并倒挂泛滥+列宽乱序）** + SetLnName 的 lnL 写成 "a:ln"（C++ 上游同错） | ProtoTable HashMap→TreeMap ×2 + TCell `a:lnL`（**待用户 touch/重启/实测/提交**） |

表格修复验证：**5/5 含表格页（slide32/37/39/40/41）行列数与合并四元组（hMerge/vMerge/rowSpan/gridSpan）与基准 pptx 逐页完全一致**；行高列宽顺序+数值对齐（±1 舍入）；lnL 边框标签 85/85；GraalJS 重放 ret=0；回归全绿。
另：第 6 批改动 `MsBinaryFile/ProtoTable.java`、`MsBinaryFile/TCell.java` 两个文件已改好未提交（javac 已验证），需 Eclipse touch + 重启 dev。

## 剩余差异（本卡要追的）

- ppt / pptx 在 MxsDoc 里的显示已基本一致，但与本地 PowerPoint 打开仍有细节出入（用户实测反馈，2026-11-14）。
- 用户怀疑方向：**OnlyOffice 前端（sdkjs 渲染器）的 bug**——即同一份 OOXML，PowerPoint 与 sdkjs 画得不同。
- 已知未追的次级线索：
  1. 个别单元格底边框实线 82/85（差 3 条，分隔线匹配次级问题）；
  2. 表格 FillTcPr 只写 solidFill/noFill 两种，PowerPoint 可能用更丰富的填充（对比时可关注）；
  3. presentation.xml 的 defaultTextStyle 为空标签（合法非残缺，次级遗留）。

## 继续排查的建议路径（新 session 起手）

1. **先做三端像素对齐**：本地 PowerPoint 截图（用户供）vs MxsDoc 打开 ppt vs MxsDoc 打开 pptx，
   逐页列出差异点（哪页/哪个元素/什么属性）。
2. **判定归属**：若 ppt 与 pptx 在 MxsDoc 里画得**完全一样**、但与 PowerPoint 不同 → **sdkjs 渲染差异**
   （前端范畴，按约定调研后报告用户裁定）；若 ppt 与 pptx 在 MxsDoc 里也有差 → **转换器还有遗漏**（继续后端链）。
3. 后端链排查工具照旧：DiagTiming 130→8195（ppt→bin）、8195→129 withchanges（GraalJS 重放出 pptx 产物）、
   解包对比基准 pptx（`python zipfile` + 正则抽样）；方法论见 `DevAgentControl/OFFICE文件排查方法与经验总结.md` §二。
4. C++ 交叉验证注意：该文档的表格链 C++ x2t **未触发**（产物无 graphicFrame，只有散文本），
   表格/部分属性没有 C++ 仲裁基准，**只能以 PowerPoint 转存的 pptx 为基准**。

## 相关资产

- 方法论文档：`DevAgentControl/OFFICE文件排查方法与经验总结.md` §一（六轮修复详录）§三（坑 19-26）
- 测试产物目录（可复用对比基线）：`src/com/DocSystem/websocket/office/test/tmp/`（bg_compare=基准解包、tbl_final=修复后 ppt 链产物、diag_color*/diag_tbl*=插桩取证现场）
- DiagTiming 源文件副本（转换输入）：`C:/DocSysReposes/1/tmp/OfficeEdit/-1061434900/org/input.ppt`（如被清理，从上面 rdata 目录重新取）
