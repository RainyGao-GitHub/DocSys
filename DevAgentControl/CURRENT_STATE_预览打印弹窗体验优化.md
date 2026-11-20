# CURRENT_STATE_预览打印弹窗体验优化（任务卡）

> 状态：**实现完成，已实测（2026-11-20），待用户实测确认后提交**（dev 实例 8100 已启动并部署新代码，可直接复测）
> Issue：https://gitee.com/RainyGao/DocSys/issues/IKWP7U
> 归属：**主仓库前端**（WebRoot/web：DocSys.js / pdfViewerForArt.html / project.html / project_en.html），后端不动

## 实现纪要（2026-11-20）

**改动 4 文件（+133/-6）**：

1. **DocSys.js 新增两个页内取链通道**（getDocFileLinkForPrint 之后）：
   - `getDocFileLinkForPdfPreview(docInfo, success, error, urlStyle)`：getDocFileLink.do / getZipDocFileLink.do，**preview 固定 "pdf"**（与旧 openPdf 链一致的权限降级语义，dataEx 回传 "pdf"/"pdfViewOnly"）
   - `getDocOfficeLinkForPreview(docInfo, success, error)`：getDocOfficeLink.do / getZipDocOfficeLink.do，preview 固定 "pdf"（后端同步转 PDF；dataEx 只会 "pdf"/"pdfViewOnly"，"office" 分支仅 preview="office"/null 时走，本通道不会命中）
   - 均带 isZip/rootPath/rootName/commitId/historyType，urlStyle=REST + buildFullLink（对齐打印通道已验证模式）
2. **DocSys.js openDoc 两分支**：isPdf 与 isOffice 且 preview=="pdf" 且 openInNewPage=="openInArtDialog" 时 → 清空 fileLink + 直接 showPdf 弹窗先行；office 编辑器路径（"open"→"office"）与 openInNewPage / bootstrapQ dialog 变体保持旧 ajax 链（决策点①②落地）
3. **pdfViewerForArt.html viewDoc 预览分支**：showLoading + dataEx=="pdfViewOnly"→viewOnly viewer（复制打印分支模式）+ 按 docInfo.fileSuffix 分派 isOffice→office 通道 / 否则→pdf 通道；错误 showPrintError 页内展示
4. **版本号**：project.html/project_en.html `js/DocSys.js?v=20261117→20261120`；**pdfViewerForArt.html 的 DocSys.js 引用加 ?v=20261120**（原无版本号——实测浏览器命中旧缓存致 ReferenceError 卡 loading，见下）

## 实测记录（dev 8100，Admin/Admin，浏览器实测）

| 验收项 | 结果 |
|---|---|
| xlsx 首转预览（Excel文件预览失败/已修复/JS调用测试.xlsx，删 OfficePreview 缓存） | ✅ 900ms 弹窗+“文档转换中”loading，13.3s 转完出 pdfjs viewer（1页+打印/下载按钮） |
| 转换失败页内展示（深入Claude Code….docx 转换链 IndexOutOfBoundsException 既有问题触发真实失败） | ✅ 页内 ✖+“预览文件生成失败”，无独立错误弹窗 |
| PDF 直预览（02-测试文件/副本.pdf） | ✅ 1.1s 出 viewer，按钮正常 |
| pdfViewOnly（test 用户 DOWNLOAD_EN=0） | ✅ 契约验证：getDocFileLink.do preview=pdf 回传 dataEx="pdfViewOnly"；前端分支与生产打印分支同模式（端到端留用户实测） |
| 多文件打印（printList 2 个 pdf） | ✅ 弹窗先行 2.4s 合并出 viewer，无回归 |
| openInNewPage（副本.pdf preview） | ✅ 旧行为：新页 pdfViewer.html，无 ArtDialog |
| markdown（test.md） | ✅ stackeditForArt 弹窗正常 |
| project_en.html xlsx 预览 | ✅ 1.26s 出 viewer |

**踩坑记录（重要）**：iframe 内 `js/DocSys.js` 原引用无版本号，浏览器命中旧缓存（access log 实证 iframe 未请求该 js）→ viewDoc ReferenceError → loading 永转。加 `?v=20261120` 后正常。**后续凡给 DocSys.js 加新函数且被 ForArt 类 iframe 页依赖，必须同步 bump iframe 页内引用。**

**顺带修正（非本次目标）**：zipViewer(ForArt) 双击 openDoc 把 shareId 误传为 preview 参数，旧链 office 文件因 dataEx 错配报“获取文件信息失败”；新链统一 preview="pdf" 后该路径自然修复。

**测试环境遗留**：dev 实例 Tomcat 已启动（docsys_start_hidden）；OfficePreview 缓存已清（会自动重建）；“深入 Claude Code….docx” 转换失败是 office 转换链既有问题（BussinessBase.convertToPdfEx:500 IndexOutOfBoundsException），与本卡无关，可另开卡跟进。

## 一句话（原始目标）

Office/PDF 文件预览目前是"先发请求拿 PDF 链接（Office 文件后端同步转换，可能十几秒+）→ 成功后才打开 ArtDialog 弹窗"，弹窗出现前无任何反馈，用户以为打开失败。目标：**先弹 ArtDialog，弹窗内获取链接——转换期间显示"加载中..."，失败在弹窗内展示错误**。打印链已按此模式改造完成，本卡把预览链对齐。✅ 已实现并实测通过。

## 现状链路（2026-11-20 调研，行号为当时快照）

**预览（本卡主体）**：
1. 入口（project.js 4 处）：右键 更多-预览 → `openDoc(node, true, "openInArtDialog", "preview", gShareId)`（project.js:5730/6176/6453/6639）
2. `openDoc`（DocSys.js:1768）按类型分派：isPdf → `openPdf(docInfo, openInNewPage, "pdf")`（:1815）；isOffice → `openOffice(docInfo, openInNewPage, "pdf")`（:1826，preview 模式下 office 也转 pdf 预览；"open" 模式 → "office" 走编辑器）
3. **`openPdf`（DocSys.js:2253）与 `openOffice`（:1942）都是先 $.ajax**（`getDocFileLink.do` / `getDocOfficeLink.do`——Office 文件时后端同步转换 PDF，前端干等）→ 成功后按 `ret.dataEx` 分派 `showPdf/showPdfViewOnly/showPdfPrintOnly/showOffice` → `showPdfInArtDialog`（:2756）才开弹窗；**失败走 `showErrorMessage`（独立错误框）**
4. → 弹窗前长时间无反馈 = issue 所述体验问题

**打印（已完成的目标形态，本卡样板）**：
- `doPrintDoc`（DocSys.js:2230）→ 注释"立即弹出窗口，页面内部负责发请求并显示 loading/error" → `showPdfPrintOnlyInArtDialog`（:2805）：直接 new artDialog + iframe `pdfViewerForArt.html?...&viewerMode=printOnly`
- `pdfViewerForArt.html` 页内 `viewDoc()`（:110）：无 fileLink 且有 printList → `showLoading()`（"文档转换中，请稍候..."，:95）→ `getDocFileLinkForPrint`（DocSys.js:386）→ 成功 `showPDF(link)` / 失败 `showPrintError(msg)`（✖+错误信息**页内**展示，:101）

**关键素材**：
- `pdfViewerForArt.html` 的 `viewDoc()` else 分支（无 printList，:137）已存在 `getDocFileLinkForPreview(docInfo, showPDF, showErrorMessage, "REST")`——预览的页内取链通道现成，**但缺 showLoading、错误走全局 showErrorMessage（独立弹窗）**
- pdfViewerForArt.html 已引 js/DocSys.js（:12），DocSys.js 全局函数可用
- `getDocFileLinkForPreview`（DocSys.js:370）/`getDocFileLinkBasic`（:429，preview="preview"）现成

## 改造设计要点

1. **isPdf 预览（最简单，先做）**：`openDoc` 的 isPdf 分支不再调 `openPdf` 发 ajax——直接 `showPdf(docInfo, openInNewPage)`（docInfo.fileLink 已被清空，:1813），弹窗先出；`pdfViewerForArt.html` 的 viewDoc else 分支补 `showLoading()` + 错误改页内展示（对齐 showPrintError 模式，可复用/泛化该函数）。
2. **isOffice 预览（决策点 ①）**：`openOffice` 的 ajax 响应按 `dataEx` 四分派（office/pdf/pdfViewOnly/print）——弹窗先行后，页内需调 `getDocOfficeLink.do` 并按 dataEx 切换。pdf/pdfViewOnly 分支与 isPdf 同模式；**dataEx=="office"（打开 Office 编辑器预览，"open" 模式）与 =="print" 分支如何处理需设计**：建议本次仅优化预览主路径（preview→pdf 转换），"open"→office 编辑器路径保持现状（编辑器自身有加载态），或页内二次跳转——开工时定。
3. **弹窗模式范围（决策点 ②）**：issue 只提 ArtDialog。`openInNewPage`（新页）与默认 bootstrapQ dialog（showPdfInDialog 等）变体建议保持现状，仅改 `openInArtDialog` 主路径（右键预览的实际路径）——开工时确认。
4. **loading 文案**：预览复用打印的"文档转换中，请稍候..."样式（showLoading/printLoadingBox，pdfViewerForArt.html 内已有 CSS）。
5. **dataEx=="pdfViewOnly"（无下载权限）**：页内已处理该模式（print 分支），预览分支对齐。

## 约束

- **后端零改动**（getDocFileLink/getDocOfficeLink 同步转换语义保持；本 issue 纯前端时序重排）
- **Office 转换链零改动**（与 office 仓库无关；转换失败场景的模拟可用老办法：破坏部署目录 DoctRenderer.config 指向 .NOTEXIST，见方法论文档坑 5）
- **缓存纪律**：改 DocSys.js 必 bump 引用它的 html 版本号（当前 project.html/project_en.html `js/DocSys.js?v=20261117`，DocSys.js:169 处快照）；project.js 若改动同样 bump 两处 html；pdfViewerForArt.html 若改动，查所有引用它的入口（含 DocSys.js 内 iframe src）统一考虑缓存
- 提交归属：主仓库（DocSys.js/project.js/html）；与 office 仓库无关

## 验收标准

1. 右键预览一个**大 Office 文件**（首次转换 >5s）：ArtDialog **立即**弹出并显示"加载中"，转换完成后展示 PDF——全程无"无反馈期"
2. 转换失败（模拟）：弹窗内展示错误信息（✖ + 提示），无独立错误弹窗、无空白弹窗
3. PDF 文件直预览、pdfViewOnly（无下载权限）、多文件打印（printList）行为不回归
4. 图片/视频/音频/文本预览不受影响
5. openInNewPage 变体（若决策不改）行为不回归
6. project.html 与 project_en.html 均正常（中英文）

## 验证建议

- 浏览器实测（dev 实例）：仓库里放大点儿的 xlsx/docx（如 `Excel文件预览失败/JS调用测试.xlsx`、FileConverter操作手册.docx）首预览（删 `tmp/OfficePreview` 强制重新转换）看 loading；失败场景破坏 DoctRenderer.config 再复原
- 回归清单见验收标准 3-6

## 开工姿势（新 session）

1. 读本卡 + `DevAgentControl/OFFICE文件排查方法与经验总结.md` §二 Step 5（前端问题纪律：in-app browser 假阳性、优先用户实测、版本号 bump）
2. 决策点 ①② 自行设计后若拿不准，问用户
3. 改动聚焦：DocSys.js（openDoc 分派/openPdf/openOffice 或新增弹窗先行变体）+ pdfViewerForArt.html（loading/页内错误）+ html 版本号
