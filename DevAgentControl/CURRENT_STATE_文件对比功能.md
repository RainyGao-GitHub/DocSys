# CURRENT_STATE_文件对比功能（工作卡）

建立于 2026-10-28。**状态：调研完成，方案已成文待用户裁定，未改任何代码，未开工。**
来源：Gitee issue [I54IJU](https://gitee.com/RainyGao/DocSys/issues/I54IJU)（2022-04 提的【NewFeature】文本文件对比功能，待办）。
用户 2026-10-28 指示：先建卡 + 调研方案（候选 CodeMirror，用户不确定是否合适，要求调研有无更好方案），**用户确认方案后才开工**。

> 本卡是**当前任务**的唯一口径处：必读上下文 / 当前进展 / 下一步 / 生效约束。

## 任务（用户原话归纳，2026-10-28）

实现文件对比功能，覆盖三个场景：
1. **选两个文件对比**；顺带裁定：是否需要多文件对比（如三方，用户见过 git 冲突页那种，但没想到超三个的场景）。
2. **文件两个历史版本对比**（历史列表选两个版本 / 查看某版本相对改动）。
3. **AI 对比技能的结果呈现**：AI 调用对比技能后展示对比结果链接（参照文件改动后的产物链接），点击打开对比窗口。

## 调研结论（2026-10-28 完成，详见方案文档）

- **方案文档**：`devDocs/文件对比功能方案.md`（成文后为准，含候选库对比表与裁定问题）。
- **前端库推荐：CodeMirror 5 merge addon**（+diff_match_patch，两个纯 script 库）——唯一同时满足
  「免构建 script 引入 / 双栏+行内视图 / 折叠相同段 / 对齐 / 可选 revert / 支持将来三方」的成熟方案。
  CodeMirror 6 官方 merge 包只有 ESM 必须 bundler（本项目无构建链，一票否决）；Monaco DiffEditor
  最强但重（~MB 级）且 **AMD 免构建方式已被官方废弃**；Mergely 停维护；diff2html 只读无编辑器对齐。
- **取数零后端新增（场景 1/2）**：`getDocContent.do` 已支持 `commitId + historyType + shareId/authCode`，
  文本直读、**Office/PDF 走既有文本提取**（`checkAndGenerateOfficeContentEx`）。
- **场景 3 需新增** agent 工具 `compare_docs`（后端取文本 + diff 摘要给模型）+ `AgentProductLink`
  扩展 compare 产物形态 + agent 前端识别打开对比窗口。
- **对话框模式**：artDialog + iframe `xxxForArt.html`（照 historyLogsForArt 先例）；参数走
  artDialog data / sessionStorage（不走 URL——多选 @ 的 8KB 请求行先例）。
- **三方对比建议本期不做**（DocSys 无合并冲突场景；CM5 merge 将来要加也支持 origLeft+origRight）。

## 用户裁定（2026-10-28，开工依据，对应方案文档 §9）

- **A** = CodeMirror 5 merge addon（+diff_match_patch）。
- **B** = 本期只做两方；三方另立卡。
- **C** = 对比窗口只读。
- **D** = AI 工具返回差异摘要 + 对比链接。
- **E** = 单侧 >2MB 拒绝；二进制只支持 Office；**Office 对比 = 对比窗口内并排打开两个 Office 查看器**
  （不做提取文本比对；双实例风险 M4 验证；场景 3 摘要仍用提取文本算）。
- **F** = M1 窗口+右键入口 → M2 历史对比 → M3 AI 工具与链接 → **M4 Office 并排模式**+打磨回归；
  每阶段模型实测 → 用户验收。**已获裁定，按 M1 开工。**

## 当前进展（如实）

- ✅ 2026-10-28：调研与方案成文；用户六项裁定（CM5 merge / 两方 / 只读 / 摘要+链接 / Office 并排（M4）/ M1→M4）。
- ✅ 2026-10-28：**M1 实施完成并实测通过，用户已验收并提交 `75815a34d`**。
- ✅ 2026-10-28：**用户裁定交互简化**（原话归纳）：不用两步式子菜单——**选中两个文件（Ctrl 多选）→ 右键「对比」直接开窗**；
  选 1 个提示需选两个、>2 个提示只支持两个。**已实施并实测通过，等用户验收**。

### 交互简化实施（2026-10-28，project.js，未提交）

- 删除两步式（gComparePendingDoc/selectCompareDoc/doCompareWithSelectedDoc/cancelCompareSelection）。
- 新增 `compareSelectedDocs()`：以 **zTree 多选为唯一事实源**（getSelectedNodes 过滤 type==1）；
  <2 → 提示「请先选中两个文件（Ctrl+点击 多选）」；>2 → 「目前只支持两个文件对比」；==2 → openCompareWindow（先选=左基准）。
- **文件列表新增 Ctrl 增量选中**（原列表只单选，多选只在目录树）：`docListOnMouseDown` ctrl 分支 →
  `listCtrlSelectDoc`（zTree selectNode(node,true) + 列表高亮 #e8f0fe + 置 gListCtrlSelecting）；
  `DocListOnClick` 开头：ctrl 点击跳过单选/预览；普通点击 `resetListMultiSelect()`（清高亮+清 zTree 多选，恢复单选语义）。
- 4 处右键「对比」子菜单 → 单项「对比」（#tree、#secondList×2、#docPreview，同一 compareSelectedDocs）。
- project.js 版本 bump → `?v=20261028c`。

### 交互简化实测（2026-10-28，dev 浏览器）

1. 列表 Ctrl 点两个（test.md + JS调用测试.xlsx，高亮 2 行）→ 右键对比 → 窗口开、左 test.md 右 xlsx、Office 占位 ✓
2. 树选 test.md + agent-test/hello.txt（跨目录）→ 右键对比 → 双栏 diff 窗、统计「+0/-1·1 处变更」✓
3. 只选 1 个 → 提示「请先选中两个文件（Ctrl+点击 多选）再进行对比!」✓
4. 意外复现 >2（残留旧选中）→ 提示「目前只支持两个文件对比」✓
5. 普通单击 → 多选高亮清零、zTree 恢复单选 ✓
6. ⚠️ 已知边界：zTree 多选残留（如从搜索态切回）会让计数包含旧节点——普通点击会复位；如需更强清理可在
   showDocList 里调 resetListMultiSelect（暂未加，避免动既有流程）。

### M1 实施内容（未提交）

- **vendor**：`WebRoot/web/static/CodeMirror5/`（5.65.19：lib + addon/merge + 14 个常用 mode + LICENSE，MIT）
  与 `WebRoot/web/static/diff-match-patch/`（1.0.5 + LICENSE，Apache-2.0），页面引用带 `?v=20261028`。
- **窗口**：`compareForArt.html` + `compareForArt_en.html` + `js/DocCompare.js`——
  参数双通道（artDialog data 优先 / sessionStorage `docsys_compare_pair` 兜底，不走 URL）；
  取数 `getDocContent.do`（**commitId 必须真缺省，传空串会后端 500**——以 commitId==null 区分当前/历史）；
  双栏 MergeView（**`origLeft`=基准在左 / value=第二个文件在右**——此 build 的 2-pane 是 value 左 orig 右，
  用 origLeft 才能让基准渲染在左且颜色方向正确）、行号、语法高亮（后缀→14 mode 映射）、
  差异统计（dmp 行模式；**npm 版 dmp 行方法为私有名 `diff_linesToChars_`，已双命名兼容**）、
  折叠相同段/忽略空白开关（重建式）、只读、2MB 上限、Office 占位提示（M4 换并排查看器）、二进制不支持提示。
  ⚠️ **CodeMirror 不能在 display:none 容器里构建**（会渲染空窗无差异标记）——必须先 show 再 build。
- **入口**：project.js 新增 `gComparePendingDoc`/`buildCompareRef`/`selectCompareDoc`/
  `doCompareWithSelectedDoc`/`cancelCompareSelection`/`openCompareWindow`（artDialog big + iframe）；
  右键「对比」子菜单 ×4 处（#tree、#secondList×2、#docPreview）。
  ⚠️ `#secondList` 有**两个** attach（菜单内容几乎相同但缩进/尾随空白不同）——改菜单要两处都改
  （本次 v2 漏改过一次，文件列表实际显示的是 v2）。
- project.js 版本参数 bump：project.html/project_en.html `?v=20261023 → 20261028b`（纪律）。

### M1 实测证据（2026-10-28，dev=TomcatForDocSysDev，浏览器）

1. **跨目录两文件对比**：05-技术笔记/apply_changes…md(36KB/830行) ⟷ 根/test.md(10B/1行)——
   右键两步全流程，窗口打开：左=基准(830行，**72 行红色删除标记**)、右=test.md、标题与内容一致、
   高度撑满、markdown 语法高亮、统计「+1 / -829 · 2 处变更」；截图经视觉模型核验通过。
2. **开关**：忽略空白切换（重建）后双栏与标记保持；折叠相同段默认开。
3. **Office 占位**：test.md ⟷ 深入ClaudeCode….docx → 英文中文占位提示（M4 前的预期行为）。
4. **防御分支**（4 条 toast 全实测）：未选基准点「与已选」提示；选基准提示含文件名；
   同一文件两次提示且保留 pending；取消对比选择清空。
5. **英文页**：compareForArt_en.html 直开——英文按钮 + 英文无参提示。
6. **菜单挂载**：4 处 attach 均含「对比」子菜单（DOM 验证；文件列表入口走全流程实测，其余同函数路径）。

### M1 未测项（如实）

- 单侧 >2MB 拒绝：无现成大文本素材，代码路径为取数后长度检查（简单）；用户验收时可造大文件抽查。
- 纯二进制（图片/压缩包）拒绝提示：同类分支（Office 已实测占位路径）。
- 对齐连接线（connect:'align' 的 SVG）：视觉核验提及 gap 存在但未明确连线——留 M4 打磨一并看。

## 下一步

1. **等用户验收「交互简化」**（Ctrl 选两个 → 右键对比；1 个/>2 个提示；列表 Ctrl 多选与普通点击复位）。
2. 验收通过 → **M2 历史版本对比**（DocHistory.js 行复选选两版 + 「与当前对比」入口 → compareRef 带
   commitId/historyType/versionLabel → 实测验收）→ M3 AI 工具与链接 → M4 Office 并排+打磨+全量回归。

## 生效约束

- 新增静态库自托管到 `WebRoot/web/static/CodeMirror5/`（内网产品不依赖 CDN；带 LICENSE/NOTICE；
  CM5=MIT，diff_match_patch=Apache-2.0），页面引用加 `?v=` 起始版本（project.js 先例）。
- 新页面走中英双页惯例（`xxxForArt.html` + `_en`）+ `_Lang()`。
