# DocSys 项目规则

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效约束）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：当前任务 = **用户在本会话明确指定的那张** `DevAgentControl/CURRENT_STATE_*.md`（未指定时：先列出 `DevAgentControl/` 下**未归档**的卡问用户做哪张，**不要自己挑一张开工**）。工作卡是**当前任务**相关信息的唯一定义处：必读上下文、参考计划与上下文、当前进展、生效约束（含是否需要先提交）。
   - **本文件只写「当前任务」与通用规则**：已收尾卡（已移入 `DevAgentControl/已完成/`）、暂停卡、挂起卡**一律不在本文件描述** —— 进展/裁定留在卡自己里；要续做时**由用户手动改本文件或明确通知**。
   - 除用户本次指定的那张外，`DevAgentControl/` 里其余未归档卡 = **挂起 / 暂停**，**未获用户明确裁定前不要动代码**。
   - 卡的生命周期：**收尾即归档**（任务结束 → 移入 `已完成/` 并提交），因此本文件不随任务收尾而增删。
2. **按工作卡续接**：读工作卡里列出的必读上下文与计划/上下文文档的续接锚点（不必全文重读）。
3. 以上完成后才开工。
4. **参数存储策略与参数清单（动任何「参数/配置」相关功能前必读）**：`devDocs/参数存储策略与参数清单.md` —— ① 存储策略：三个存储位置（`jdbc.properties` 框架层、须重启；`docSysConfig.properties` 业务参数、可立即生效；数据库 `system_setting` / `agent_config` 存复杂结构）**为什么这么设计** + 5 条硬性约束（per-node 参数不得入库、不得直接改 classes、复杂结构别塞 properties、启动期静态读取的键不得宣称保存即生效、同类参数用同一种处理方式）；② 参数清单 + **同类参数处理方式不一致的 6 处**（`ldapConfig`/`llmConfig` 双轨、`mail.*`/`sms.*` 旧键仅首跑播种、三种生效时机并存、日志配置在 ini 目录独立文件、键名别名/大小写、checksum 自动同步只覆盖两个文件）。2026-10-06 建立（起因：改 LDAP 配置时差点忘了存储与工作机制）。

### ★ 工作卡更新时机：里程碑驱动（不是压缩驱动）

**模型侧观察不到"即将压缩"**（无上下文余量指标、无预警信号），所以「压缩前抢救一次」的约定等于永不触发。改为**里程碑驱动**：出现下列任一事件，**立即**更新当前工作卡，不攒批、不等收尾。

- 定位到根因（写清根因 + 证据位置）
- 得到验证结果（PASS/FAIL 数字、realDiff、字节差等具体值）
- 一个子项结论**成立或被推翻**（被推翻时必须删改原结论，不留过期描述）
- 用户给出裁定 / 纠正 / 确认
- 提交代码（记 commit 号与归属仓库）
- 开始新子任务或切换子项

更新落到工作卡的「当前进展」「下一步」「未提交改动」三处。这样卡永远最多落后一个里程碑——压缩何时发生、压缩是否失败、是否换新会话，都能从卡无损续接。

**如实性要求**：卡里的状态描述必须与实际完成范围一致。完成子项 1 不得写成"该缺陷已修复"；未验证的不得写"已验证"；FAIL 要写明数字和归因。宁可写"未完成/未验证"，不可夸大——下个会话会把卡当事实续接。

## 当前任务

- 最近完成 = **仓库路径字段的服务器目录树选择器（...按钮）——已验收（用户实测"设置位置非常方便"）2026-11-15**：提交 `60824061e`（新特性：后端 `Repos/getServerDirList.do` + 弹窗 + 6 处挂接）+ `86fe38d18`（UI 优化：改 zTree 树风格与系统统一、input-group 亚像素对齐、自动展开定位）+ `42504f480`（仓库位置也挂树选择）。**可复用能力**：`ReposConfig.selectServerPath(inputId)` 一行给任意服务器路径输入框挂树选择；选择器 `serverDirSelector.html` 带 chain 自动定位。**坑**：zTree simpleData 的 id 不能重复（chain 首节点=盘符根，须复用 roots 节点置 open）；bootstrapQ 弹窗是 ajax 注入宿主页，宿主必须已引 zTree JS（projects.html 原先只有 CSS 已补）。
- 上一任务 = **首次启动默认创建系统仓库（ID1 协同编辑服务仓库 + 我的桌面/我的下载）+ 仓库ID保留区 1-100 —— 已收尾归档 2026-11-15，用户实测"行为都正常"**：工作卡 `DevAgentControl/已完成/CURRENT_STATE_首次启动默认仓库与ID保留.md`。提交 `43f55a1f9`（DataRootService.getUserStandardDir 探测 + ManageController createDefaultReposForFirstUser 挂 addFirstAdminUser + BaseController SQLite DDL autoincrement/新装库序列推进 100，MySQL AUTO_INCREMENT=101）。用户裁定：三仓库均建但 **deleteRepos 不加守卫**；桌面/下载开回收站、关全文索引；探测按数据根目录同款 user.home 方案（不读注册表）；保留区 100。**两条可复用教训**：① userService.addUser 走 insertSelective **不回填自增 ID**（调用侧用到 user.getId() 必须补查）；② dev 部署树 `webapps/DocSystem/WEB-INF/classes` 与源码树 classes 是两份拷贝且曾长期陈旧（缺 CompressExtractTask 致 DispatcherServlet 启动失败），部署新 class 前先核对一致性、不一致就**先删后拷全量同步**。遗留待条件具备：Mac 真机、OneDrive 重定向机器、MySQL 路径、商业版第三方编辑回归（见卡 §9）。
- 上上任务 = **在线压缩与解压功能（提取 / 添加到压缩包）——已收尾归档 2026-11-15，用户实测"非常完美"**：工作卡 `DevAgentControl/已完成/CURRENT_STATE_在线压缩与解压.md`。提交 `36c4917fd`（新特性：后端三异步接口+批次导入通道、前端菜单/弹窗/zipViewer三变体）+ `e7ded085d`（优化：菜单改名解压缩/压缩、低频项移到回收站前加分隔线）。顺带修复既有缺陷：checkAndCreateFolderUploadAction lockDoc 失败 NPE。验证：后端自测 38 项全过 + 浏览器 E2E 全过；§8 剩余真机项（只读用户/分享页/GBK zip/1000+文件）用户未逐项反馈即验收通过。
- **Office 无法打开/保存文件逐个分析**（2026-11-07 用户指定继续）——方法论与环境速查见 **`DevAgentControl/OFFICE文件排查方法与经验总结.md`**（标准流程 DiagTiming→堆栈→x2t 交叉验证→精准修复；已修复清单；十大坑）。工作卡式文件：本方法文档 + 下方各历史卡。
  - 2026-11-11 完成一例：**2020年度企业基础信息表.doc**（MHT 假扩展名）——税局网站生成的 MHT（`Multipart/related` 首字母大写）挂 .doc 名；detectActualFormat 只认 PK↔OLE2 放行 → OLE2 读取失败。修复 = OfficeBase.detectActualFormat 加 MHT 分支 + isMultiPartsHtmlFormatFile 大小写不敏感化（C++ x2t 同样漏检，属上层增强，同 Word 23 假扩展名先例）。**第二轮（用户实测反馈 MIME 头入正文+表格窄竖条后同日完成）**：第三处大小写坑在 CHtmlFile2_Private.mhtXhtml（误走 htmlXhtml 兜底）+ tblW 硬编码 pct（改绝对宽度写 dxa 同 tcW 模式）；E2E：MIME 残留=false、tblW=6600 dxa；用户实测 MIME 已解决。**遗留：Eclipse touch 三文件（OfficeBase/COfficeFileFormatChecker/CHtmlFile2_Private）+ 重启 dev + 浏览器实测 + 提交（websocket/office/test 三仓库）**。详见方法文档 §一/§三/§五。
  - **衍生卡（已收尾归档 2026-11-12，用户实测"效果非常好"）**：`DevAgentControl/已完成/CURRENT_STATE_MHT格式打开与Word本地打开不一致.md` —— MHT 打开 vs Word 视觉差异四轮修复（表格层：边框/宽度/tblW；文本层：字号×2/align→jc 桥接/字体名/line=0）。可复用结论：渲染器可信裁定 + word.docx 经同一 bin 链做参照断言；官方溯源见方法文档 §五.3。提交：office 仓库 ff8324328/935056db4（用户）。
  - 2026-11-12 完成一例（**结论=文件本体损坏，无可修缺陷**）：**win7下配置GO语言环境eclipse配置Go开发.docx** —— 正版 ZIP 但灾难性损坏：EOCD 偏移错 897B + CD 条目被覆盖 + 13/18 entry DEFLATE 流损坏（document.xml 用 CD 权威偏移+csize 复核仍 invalid code）；C++ x2t"成功"但产物为无正文空壳（1.8MB 全是样式表）。判定法已沉淀到方法文档 §二 Step 3。建议用户找原始副本（待用户验证 Word 行为）。**（用户已确认 Word 也打不开，文件确损）**
  - 2026-11-12 完成一例：**张人才办（2018年第59号）领军人才创业项目计划书.doc** —— VarsCopy 生成器缺陷：Table.Table_copy 的 `this.documentMapping.copy(...)` 深拷贝调用（C++ 原型 DocumentMapping* 指针=共享语义，裸 new dst 上 NPE，嵌套表格触发）。修复=共享赋值（[Table.java:119](D:\Dev\DocSys\src\com\DocSystem\websocket\office\MsBinaryFile\DocFileFormat\Table.java)，同 rows 修复模式）。ret=0、317KB bin、正文全命中、回归全绿。**✅ 用户已验证并提交**。注意 C++ x2t 对该文件本身也静默失败（修复定性依据=C++ 源码语义，非 x2t 行为）。
  - 2026-11-12 完成一例：**采购合同-奥普泰.doc**（Word文件无法打开 清单最后一例）——**两轮共五处缺陷 + 一处前端补丁**。第一轮（打不开）：①SttbfAtnBkmk extra 块 cbExtra=4 vs 代码按 6 字节读（改按块长截断）；②PieceTable.GetChars 空结果返回 null vs C++ 空 vector（改返回空串）。第二轮（用户实测前端弹"处理文档期间出现错误"）：③TrackRevision.Write 四处 isEmpty 在 null 上 NPE（C++ std::wstring=空串，加 null 守卫）；④**FormatUtils.GetIntFromBits 掩码失效**（`0xFFFFFFFF >> n` Java 算术右移符号扩展→掩码恒全1，改 `>>>`）→ DTTM 修订日期位域裸右移、83 个垃圾 w:date（2025→3049）——一处修复 32 处调用回正。第三轮（日期修好后仍 changesError：`e.FYa is not a function` @ sdk-all.js:7889）：⑤**前端 sdkjs 上游防御缺陷**（Kv.bt 拿批注 Id 查 Mg 注册表未判类型即调 IsSolved）——**方案 A（用户裁定）**：sdk-all.js bt/Uga 两处类型守卫补丁（标记 `sdkjs-patch:commentLock-typeGuard`，word 版第二例）。**遗留：用户硬刷新实测补丁效果（触发源头未根治，若再崩逐点看）+ 提交（office 仓库 4 文件 + office-editor 仓库 sdk-all.js）**。

  - 2026-11-13 完成一例：**02-测试报告模板.xls**（Excel文件无法打开 目录）——命令行"假成功"（bin 28KB 空壳）vs C++ x2t 675KB：NPE 全被吞致内容全丢。**扫雷 17 处修复**（office 仓库 19 文件）：①裸字段 null 家族×12（_drawing_state 全值成员/OfficeArt 系/comments context 系等）②PtgRef3d.rgce_loc 类型级移植错误（XLSB→XLS 版）③**XlsConverter convert 重载解析陷阱**（C++ 默认参 anchor_only=false → Java 落到父类方法无限自递归，补 false）④XLSBase.getColRowRef 错用 1-based getColAddress（col=0 产 '@'）⑤FillBackColor CCE ⑥memset 字节/元素语义 ⑦CUtf8Converter.CHECK_HHHH 越界（**服务端保存链同路径，不修则编辑后保存炸**）。✅ ret=0、bin 507KB、GraalJS 重放通、bin→xlsx 读回通、回归全绿。**用户实测可正常打开 ✅**。新教训入方法文档 §三 坑 13-16。
  - 2026-11-13 完成一例：**生活谷--物业生活服务平台2014.ppt**（Slide文件无法打开 目录）——**两轮共 6 处**。第一轮（打不开）：裸字段 null×3（CMetaHeader.rcBounds/ptSize、ENHMETAHEADER3.rclBounds、TxBodyConverter.m_oShapeWriter）——✅ 用户实测可打开。第二轮（报错+显示异常）：①内嵌 image1.bmp 的 bfOffBits 写错（=2）→ CBgraFrame 加 BMP 偏移修正重试（tryReadBmpWithFixedOffset）；②**CShapeWriter/CDrawingConverter×3 处 `CorrectXmlString(strT)` 返回值被丢弃**（C++ 引用修改 vs Java String 不可变）→ 页码字段占位符 `<#>` 未转义致母版 XML 解析失败整块丢弃——接返回值修复。✅ 两类错误 0、bin +52KB（字段内容回归）、GraalJS 重放通、回归全绿。**遗留：Eclipse touch 六文件（+CBgraFrame/CShapeWriter/CDrawingConverter）+ 重启 dev + 浏览器实测显示效果 + 提交（office 仓库）**。新教训入方法文档 §三 坑 17/18。
  - 2026-11-14 完成一例：**生活谷 PPT 显示缺陷（三次反馈，基准 pptx 对比）**——四层连环：①工厂复用 oRec + m_oHeader 引用赋值（C++ 值拷贝）→ 49 个样式记录共享最后一个 header（RecInstance 全变 2，title/body 样式槽未填）；②11 处 ReadWORD int 装箱进 nullable<Short> → ConvertStyleLevel checkcast 崩（level5-8 丢 → presentation.xml dts lvl6-9 丢闭合 → pptx→bin 整读为空 bin 946B）；③pTheme.m_pStyles 四槽共享对象 → ApplyAfter 相互覆盖；④CTextStyles.Copy 裸 new。修复后 titleStyle 4400/Arial/宋体、bodyStyle 3200/2800/2400 与 C++ 完全对齐，bin 2245339B（+364KB），CCE=0，GraalJS 重放通。**遗留：Eclipse touch 六文件（CStylesWriter/CPPTUserInfo/CRecordTextMasterStyleAtom/CTextCFRunRecord/CTextPFRunRecord/CTextStyles）+ 重启 dev + 浏览器实测显示 + 提交（office 仓库）**。⚠️ 教训：classes 目录被实验污染后用 Eclipse wtpwebapps 部署目录恢复（先删后拷，cp -r 合并会留脏）；javac 全量编译因生成器垃圾源（enum.java/_.java/Class.java 等）不可行，永远只编改动文件。
  - 2026-11-14 完成一例：**样式修复部署后前端弹 errorCode=-100 → 修复后又"一直加载中"（两层独立缺陷）**——**第一因（毒 class，真凶）**：提交 5e598ba9 的 CPPTUserInfo.java 带进了插桩清理残骸（LoadMainMaster 两个裸 `try {`）→ Eclipse ECJ 遇语法错仍生成毒 class（运行时抛 `Error: Unresolved compilation problems`）→ 穿透 `catch (Exception)` → 转换线程死亡 + openDocSyncLock 泄漏 + 无错误日志 → 前端永远加载中只收心跳。**第二因（-100 弹窗）**：ws 断开后 participant 立即被删（editorDataMap 延迟清）→ sdkjs 15s 重连 restore 被 `isParticipantActiveLocal` 误杀。修复：①try 残骸恢复原结构（对照 5e598ba9^）；②OfficeBase.setOfficeEditorData restore 容忍。验证：DiagTiming ret=0/**8s**/bin 2245339B（**纠正：ppt 转换根本不慢，此前"转换慢超时"推断错误**）+ GraalJS 重放 ret=0 + 回归。**✅ 用户实测已可打开**。新教训入方法文档 §三 坑 19/20/21（毒 class 指纹：加载中+心跳+无日志+等锁 state:1 旧时间戳；纪律：提交前 javac 干跑全批文件、插桩清理必查 try/catch 配对）。
  - 2026-11-14 完成一例：**ppt 背景 vs pptx 不一致（整体灰色→黑斑，四五两次反馈，以 C++ x2t 产物仲裁，连环 4 处）**——①fillOpacity/fillBackOpacity/shadowOpacity 的 `(byte)` 截断（255→-1→alpha=-392）；②CorrectColorScheme 的 `oScheme = oArrayMem` 只重绑定局部引用（C++ vector& 拷贝到调用方）→ m_arColorScheme 保持 8 元素 → 查色越界；③ChangeBlack2ColorImage 改 m_pData 但 SaveFile 写缓存 image + ImageIO 不支持写 alpha BMP（返回 false 静默）→ 纹理保留坏头 1bpp BMP；④pattern 前景色查表失败（配色未就绪）→ 白像素→黑→黑斑。修复：三处 `&0xFF`、原地 clear+add、SaveFile 从 m_pData 重建+置空 image+alpha 兜底、查表失败退化背景色。验证：image1.bmp 64 像素全 F2F2F2（逐像素=C++ 产物）、GraalJS ret=0、回归全绿。**✅ 用户实测背景已全部解决并提交**。新教训入方法文档 §三 坑 22/23/24/25。
  - **2026-11-20 新卡：Word 文件预览报错（授权证书采购合同 docx 转 PDF）**（三层连环修复完成+全验证通过，待实测/提交）——pdf.bin(metafile)→PDF 渲染段连环三颗移植雷（同一冷路径"超链接注释"，此前无样例触达）：①`readString` 错用 doct bin 语义（U32+压缩位）读 metafile 字符串（应为 UShort 字符数+UTF16，字节铁证 21 00=33+"https://share.weiyun.com/0Kjpf2o0"恰 33 字符；非空串旧语义必越界的数学论证=无既有功能依赖）；②`readDouble` 错用 8 字节 IEEE754（C++ metafile 是 4 字节定点 int/100000——Path 命令内联写对、函数版错，同文件两套语义并存）；③`CAnnotation/CUriLinkAnnotation` 生成器烂尾毒 class（virtual 残留/丢 c_sAnnotTypeNames 表/错配 .m_pPointer 35 处）。修复后目标文件 ret=0/4 页/URI 干净，**与 C++ x2t 产物内容逐项对齐**（github/weiyun/URI/Annots/Link 计数全等）；回归四链与基线**仅差时间戳**（掩码对比）；verify_doc_pipeline -Fast 全 PASS。office 仓库 3 文件。**遗留：Eclipse touch 3 文件 + 重启 dev + 实测仓库 1 该 docx 预览 + 提交**。**详见 `DevAgentControl/CURRENT_STATE_Word文件预览报错.md`**。
  - **2026-11-20 新卡（待开工，用户指定换新 session 做）：预览打印弹窗体验优化**（issue IKWP7U）——Office/PDF 预览目前先同步拿 PDF 链接（Office 转换十几秒+）再开弹窗，用户以为打开失败；目标=先弹 ArtDialog、弹窗内取链+加载中+页内错误展示（打印链已是该形态，本卡把预览对齐）。**纯前端时序重排**（DocSys.js/project.js/pdfViewerForArt.html + html 版本号），后端与 Office 转换链零改动。现状链路/样板/决策点/验收标准已调研齐全，**详见 `DevAgentControl/CURRENT_STATE_预览打印弹窗体验优化.md`**。
  - **2026-11-20 新卡：Excel 文件打印转 PDF 失败**（根因定位+方案 A 修复完成，待实测/提交）——右键"更多-打印"走服务端静态链 xlsx→xlst bin→pdf.bin→PDF（doct_bin2pdf），GraalJS 里 sdkjs cell 编辑器的工作簿渲染器 zc 由 Promise 异步链创建，而 **`js.nashorn-compat=true`（Nashorn 迁移遗留）把 ecmascript-version 压到 5 → 无原生 Promise → sdkjs Closure 垫片被安装 → 垫片调度器按值捕获的 setTimeout 是 native.js 空桩 → 异步链永不执行** → `asc_nativeCalculateFile`→`this.zc.Lbi()` TypeError。**通用**（任一 xlsx 都炸，该链路从未通过）、**非 Word 卡回归**（fcb982f7^ 同炸）、**C++ x2t 同文件同 js 成功**（V8 完整 ES6+，垫片不装）。修复=方案 A：`JSEngineFactory.sharedGraalEngine()` 显式 `.option("js.ecmascript-version","latest")`（4 行，sdkjs 与移植逻辑零改动）。验证：目标场景 ret=0/62817B（页数与 C++ 一致）+ xls 老格式/word 保存打印/ppt/xlsx 保存全绿 + **顺带修复 xlsx 保存链丢 definedNames/筛选状态/activeTab 的隐性损失** + verify_doc_pipeline -Fast 全 PASS。**遗留：Eclipse touch JSEngineFactory + 重启 dev + 服务端实测打印与筛选保留 + 提交（office 仓库 1 文件）；Nashorn 模式下本缺陷依旧（已知边界）**。**详见 `DevAgentControl/CURRENT_STATE_Excel文件打印转PDF失败.md`**（含两次根因修正的教训）。
  - **2026-11-19 完成一例：FileConverter操作手册.docx 编辑后保存失败**（23号仓库，两层独立缺陷叠加）——**第一层（AIOOBE 317404）**：上一轮保存成功后 apply_changes 把 media 图片拷回 changes/ 打进 changes.zip（版本历史）→ 本轮保存原地复用该目录，getDoctXml（C++ 原版同款无过滤）把图片也列入 `<Change>` → CChangesWorker 把 PNG 二进制当 base64 change 流解析越界（越界索引 317404=某图片文件大小，铁证；C++ 同样无守卫靠 UB 容忍）；**第二层（NPE）**：`nullable_bool.ToAttribute` 裸 `if(m_pPointer)` 拆箱 NPE（C++ 是 bool* 指针判空，documentProtection 序列化触发）。修复：getDoctXml 只列 .json + Base64Decode 内层边界守卫（+恢复被错误合并改烂的 Base64Decode2）+ `null != m_pPointer` 判空，office 仓库 3 文件。验证：修复前复现同款堆栈→修复后 withchanges ret=0/docx 2.9MB/内容与图片完整、xlsx/ppt 交叉回归 ret=0、verify_doc_pipeline -Fast 全绿。**遗留：Eclipse touch 3 文件（NExtractToolsStatic/CChangesWorker/nullable_bool）+ 重启 dev + 服务端实测（打开该文档触发 saveFailed 自动重试）+ 提交**。详见缺陷卡 `DevAgentControl/CURRENT_STATE_FileConverter操作手册docx保存失败.md`（待实测后归档）；新教训入方法文档坑 30/31。
  - 2026-11-17 完成一例（双层根因，15 轮对照实验）：**doc 表格显示混乱**——①扩展名分叉（openCmd.format 按文件名）已修（realSuffix 方案，用户实测 V7 正常）；②**doc 源 footer1 页脚段落 framePr w:h=32768**（Word 按自动高度、sdkjs 忠实执行挤压正文区）——部件二分（V10/V11 非正文部件→V16 页面周边→V19 页脚→V21 footer1→V23 改 h=0 正常/V24 删空run 仍乱）定案。修复：BinaryHeaderFooterTableWriter.WriteHdrFtrItem 预处理页眉页脚 framePr 非零 H reset（对齐 Word；正文不动）。验证：bin H 不再写出、GraalJS 往返通、大回归全绿。**✅ 用户实测原版表格正常，realSuffix 保留（保存链不受影响的论证：saveDoc 按文件名+fallback、documentFormatSave 恒 65），全部已提交 push**。教训入坑 29（页眉页脚 framePr 陷阱+部件级二分法）。对照文件 V2-V24 保留在仓库目录备查。
  - 2026-11-17 完成一例：**doc（实为 docx 假扩展名）表格显示混乱**——五轮对照实验（删边距/加边距/合并run/删pStyle/双扩展名）逐一排除内容变量，V2 同文件 .doc 乱/.docx 正常实锤：**根因=前端 sdkjs 按文件名扩展名组装 openCmd.format**（"doc" 走不同渲染分支），服务端转换链无缺陷。修复：getDocOfficeLink 下发魔数修正的 `realSuffix`（getRealFileSuffixByMagic，PK↔OLE2 双向、仅六种 office 扩展名、MHT 不动）+ DocSys.js 成对透传 + OfficeEditor.js fileType 优先用 + 5 html bump v=20261117。**遗留：Eclipse touch BussinessController + 重启 dev + 实测原版 .doc + 提交（主仓库 7 文件）**。
  - 2026-11-16 完成一例：**Excel 下载为 PDF 失败（JS调用测试.xlsx）**——"假失败"：output.pdf 33KB 是截断半成品（无 %%EOF）+ret=-2147216560；真根因 `CFontCidTrueType.m_mGlyphs` 的 `Map<Short,Boolean>`（C++ map<unsigned short>）——GID 39602 经 (short) 变 -25934，写 pGlyphs[-25934] AIOOBE 被 SaveToStream 的静默 catch 吞掉（中文字体大字库触发）。修复：Integer key+去 (short)×2、补 C++ 守卫+GID 边界检查、catch 改 Log.error。验证：复现 pdf.bin ret=0、PDF 81KB 完整。**遗留：Eclipse touch 2 文件（CFontCidTrueType/CDocument）+ 重启 dev + 实测 + 提交（office 仓库）**。教训入坑 28（USHORT GID 陷阱；写文件链 catch 必打日志）。
  - 2026-11-14 顺带确认：**第4課 私の一日.ppt（21MB）被第2課批修复直接覆盖，用户实测可正常打开**（同款 init 注释缺失缺陷）。**至此 Slide文件无法打开 目录全部样例通过**（生活谷六轮/自由团队/第2課/第4課），Excel/Word 样例此前已全部通过。待新用例再继续（2026-11-14 用户确认）。
  - 2026-11-14 完成一例：**第2課 私の家族.ppt（26MB 日文课件）无法打开（剥洋葱 5 层）**——①CRecordExHyperlinkContainer.m_exHyperlinkAtom、②CRecordMouseInteractiveInfoContainer.interactiveInfoAtom（两处 init 初始化被注释）；③CInteractiveInfo 四个 String 字段 null（C++ wstring=空串，WriteHyperlink .length() NPE）；④**CommonBase.reserve 实现"C++ vector::reserve"却垫 null**→m_arNotes 按索引 get 到 null（全仓唯一调用点，改回容量预留语义）；⑤保存链 ExtraClrScheme.clrScheme 裸字段 null。修复后打开链 ret=0/581KB/118 页/日文正文完整、保存链 GraalJS ret=0/261KB、生活谷+自由团队交叉回归不变、大回归全绿。**遗留：Eclipse touch 5 文件（CRecordExHyperlinkContainer/CRecordMouseInteractiveInfoContainer/CInteractiveInfo/BasicDefinition/ExtraClrScheme）+ 重启 dev + 实测 + 提交（office 仓库）**。教训入方法文档坑 27（init 被注释的初始化=裸字段 null 富矿；reserve 垫 null 陷阱）。
  - 2026-11-14 完成一例：**自由团队--IT产品开发资源平台-2015-V1.00.ppt 能打开但内容全空**——bin 3915B 空壳：CTheme 的 CalculateStyle/CalculateStyles 两方法里 **fontRef/eaFontRef/ansiFontRef/bulletFontRef 共 7 处** C++ WORD(无符号) 被移植成 `(short)` 比较——0xFFFF(未设置) 变 -1 通过 `< size` 检查 → get(-1) AIOOBE 被吞 → slides 从未加载。修复=7 处 `& 0xFFFF` 无符号化（symbolFontRef 早有先例，这批是漏网）。验证：bin→117066B、slides 23/23、media 11/11、正文逐页与基准 pptx 一致、GraalJS ret=0、生活谷回归不变、回归全绿。**遗留：Eclipse touch CTheme.java + 重启 dev + 实测 + 提交（office 仓库）**。
  - 2026-11-14 完成一例：**ppt 表格渲染错乱（六次反馈，连环 2 处）**——PPT 老表格=binary 里 85 cell shape+190 分隔线，ProtoTable 按坐标反推行列合并。①**TreeMap 事故（主因）**：C++ `std::map`（按 key 有序）移植成 HashMap → 行/列坐标表无序 → 合并推导倒挂泛滥（hMerge 39/vMerge 58 vs 基准 0/6）+列宽乱序错位；②**lnL 标签漏 L**（C++ 上游同错）：SetLnName 写 `"a:ln"`（应 `a:lnL`）→ tcPr 非法子元素被前端忽略丢左边框。修复：HashMap→TreeMap（getWidth/getHeight 两处）+`a:lnL`。验证：**5/5 含表格页结构与基准完全一致**（行列+合并四元组逐页相等）、列宽顺序+值对齐、lnL 85/85、bin 2359997B、GraalJS ret=0、回归全绿。**✅ 用户实测表格已基本正常（与 pptx 一致）；与本地 PowerPoint 的剩余细节出入已移交新卡 `DevAgentControl/CURRENT_STATE_Slide文件显示与本地打开显示不一致.md`（疑 OnlyOffice 前端渲染差异）。**备注：C++ x2t 对该文档未触发表格识别（无 graphicFrame），Java 表格链是已启用的移植增强，基准=PowerPoint pptx；lnB 实线 82/85（差 3，次级遗留）。**遗留：Eclipse touch 2 文件（ProtoTable/TCell）+ 重启 dev + 提交（office 仓库，用户已实测通过）**。新教训入方法文档 §三 坑 26（std::map 有序性依赖：凡后续逻辑依赖遍历顺序的 HashMap 一律 TreeMap）。

- 上一任务 = **Office 保存失败三层通知**（已实现待最终验证提交，2026-11-07）：第1层 project 页轮询黄色警告条（getUserPendingNotices.do）+ 第2层 OfficeEditor.init 检测警告条（checkOfficeSaveFailed.do + saveFailed.flag）+ 后端 OfficeBase.recordSaveFailure。遗留：Eclipse touch 重编后端源码生效、提交（websocket 仓库 2 文件 + 主仓库 8 文件）。
- 更早已完成并上线：Word 23 个（VML 空格/VarsCopy/detectActualFormat）、Excel XLS 11 处生成器缺陷、sdkjs lOe 补丁（d56a0149）、Linux themes.js 部署修复、fontDir 尾斜杠回归修复。详见方法文档 §一。

- 上一任务 = **Agent 工具调用展示优化 + 工具调用详情持久化 Bug**（已收尾归档 2026-10-27）：工作卡
  `DevAgentControl/已完成/CURRENT_STATE_Agent工具调用展示优化.md`，提交 `f59e2e4af`（S1 前端）+ `47bd45327`（S2 后端持久化 + S3 前端回放，用户 --amend 合并）。
  S1 = processSteps 时间线模型 + 容器内交错渲染 + 工具卡片 `<details>` 自折叠（running 展开/结束收起/点击展开/增量刷新保留展开态）；
  S2 = SSE StreamSink 累积时间线 → `agent_session_messages` 增 `role='process'` 行（`{"v":1,"steps":[...]}`，reasoning 行过渡期照写，续接只取 user/assistant 不污染）；
  S3 = `loadSessionMessages` 解析 process 行重建 processSteps（优先于 reasoning 行，旧会话降级 reasoning 整块）。
  E2E 全过：交错/收起/展开保留/running/刷新回放/旧会话降级/续接不污染/确认批准与拒绝/中断/多轮。
  两处既有行为已记录：①SSE 中断 = 前端停止接收、服务端继续跑完并落库；②IAB/后台标签页 rAF 节流（测流式中间态须前台）。
  ⚠️ 沿用教训：**dev 只用 TomcatForDocSysDev，MxsDoc 是正式实例绝不碰**（详见下方「验证要求」）。

- 上一任务 = **新建文件/目录后目录树有时不显示**（已收尾归档 2026-10-23）：工作卡 `DevAgentControl/已完成/CURRENT_STATE_新建文件目录树不显示.md`。
  根因 = zTree 异步加载在途竞态（新节点被跳过/静默丢弃，陈旧响应落地后 zAsync 短路不再请求）+ 展开过又折叠目录的必现分支；
  修复 = "挂起-补加"（`pendingAddTreeNodes` 队列 + `zTreeOnAsyncSuccess` 后 flush，`addTreeNode` 三分支），E2E 回归 7 场景全 PASS。
  提交：主仓库 `c664fe22b`（BugFix，用户提交）；配套 `project.html`/`project_en.html` 的 project.js 引用加 `?v=20261023`（防浏览器旧缓存，普通 F5 即生效）。
  ⚠️ **纪律：今后每次改 project.js 必须同步 bump 两处 html 的版本号**，否则旧缓存问题复发（静态 js 无 Cache-Control，走启发式缓存；全量治理见挂起卡 `CURRENT_STATE_前端静态资源缓存.md`）。

- 上一任务（**暂停，未收尾**，2026-10-18 起，2026-10-23 切换）= **Mac 版「控制台 + 安装程序」（路线 C 最小可用版）** —— 工作卡 `DevAgentControl/CURRENT_STATE_Mac安装程序.md`（进展/裁定留在卡内：M1/M2 已编译通过，selftest 与启停验证未做，M3~M5 未做）。

- 上一任务（**暂停，未收尾**，2026-10-12 起）= **MxsDoc 运行时「跨平台打包」（2.02.88）＋ JDK 升级（2.02.89）** —— 工作卡 `DevAgentControl/CURRENT_STATE_JDK升级选型.md`（该卡已标记暂停）。
  阶段 1（JDK 8 + GraalVM CE 21.2 + GraalJS 替代 Nashorn）**已完成并三层验证通过**。用户 2026-10-11 版本计划：先做 2.02.88（首要任务 = 跨平台打包，"JRE 改用 GraalVM"，本版允许放弃部分平台）；阶段 2（JDK 17 + Tomcat 9）推迟到 2.02.89。
  **剩余为用户侧动作**：准备 2.02.88 WAR → 转商业版 → 放进 `C:\docsysRel\ForReleaseBuild\docsys\tomcat\webapps\` → 跑 `build_release.py` 一次出 6 平台包（Mac 包即上面 Mac 任务的前置输入）。
  ⚠️ 生效约束：缺省即 `graaljs` ⇒ **运行时必须是 GraalVM（或 classpath 上有 GraalJS）**；换回 stock JDK 8 时须显式 `-Ddocsys.office.jsEngine=nashorn`。

- 上一任务（**暂停，未收尾**，切到上面的 JDK 卡）= **Office 字体库自动检测与生成** —— 用户 2026-10-10 提出：**新安装 / 在线升级后**，Office 编辑所需的**字体库**必须由管理员手动执行「管理后台 → 系统管理 → Office 编辑器 → **重置字体库**」；管理员一旦忘记，用户会在 Office 编辑时撞上"字体库不存在"，才回头找管理员重置。希望改成**自动检测 + 自动生成**。
  约束与参照：历史上曾有自动生成机制，但挂在**系统启动初始化**流程里，失败时甚至导致**整个初始化无法完成**（影响面更大）⇒ **不能放回启动路径**；用户希望参照「**首次安装创建超级管理员**」那种**由前端发起**、失败也不影响系统本身的模式。
  要求：**先调研 + 出方案，用户确认后再开工**。工作卡 `DevAgentControl/CURRENT_STATE_Office字体库自动生成.md`，方案 `devDocs/Office字体库自动生成方案.md`（成文后为准）。
  前序相关：`DevAgentControl/CURRENT_STATE_freetype移植.md`（挂起卡，字体相关，未获裁定不动）。

- 上一任务 = Agent 写操作确认弹窗可脱身（已收尾归档 2026-10-10）：工作卡 `DevAgentControl/已完成/CURRENT_STATE_Agent确认弹窗脱困.md`，方案（§9 裁定 / §10 实施记录 / §11 二轮加固）`devDocs/Agent确认疲劳与模式切换方案.md`，业界调研 `devDocs/Agent审批机制业界调研（一手来源）.md`。提交：主仓库 `cc3ed294d`（一轮：标准档记住授权 + 运行中切档实时生效）、`be8c38f8a`（二轮：确认接口补授权 + 挂起上限按会话分名额 + 重启后遗留待确认失效化）。

- 上一任务 = 仓库设置「允许操作隐藏文件和系统文件」选项，已收尾归档（2026-10-10）：工作卡 `DevAgentControl/已完成/CURRENT_STATE_仓库隐藏文件操作控制.md`，方案 `devDocs/仓库隐藏文件与系统文件操作控制方案.md`（§6 六项裁定 / §10 实施记录与验证结果）。
  已完成：仓库级选项（默认不允许）—— 隐藏/系统条目**不出现在列表**（含全文索引）且**拦下**改名/移动/复制/删除/下载/预览编辑/Agent 写入，勾选后恢复原行为；存储 = 仓库目录下 `data/hiddenFileSetting/hiddenFileConfig.txt`（照抄 `encryptType`，**零数据库改动**、无缓存、仅超管可改）；落点 = `FileUtil` 判定 + `BaseFunction` 守卫 + `BaseController`/`DocController` 全族 + websocket `BussinessController` + 前端 6 页。提交：主仓库 `f782bcb0b`、websocket 仓库 `413a7674`。
  ✅ 验证：探针 14/14、接口 E2E 40/40、真实浏览器中英文回环（38↔39 条 + 配置文件增删）。
  ⚠️ **两个通用教训已沉淀**：① 命令行 `javac` **必须带 `-g`**（否则 Spring MVC 参数名不可用 → 端点 500），已写进下面「编译输出目录」一节；② 「仓库级配置文件」这一类已登记进 `devDocs/参数存储策略与参数清单.md`（§2.1-D2、§2.2-8/9）。
  未做（留待以后）：`getReposList.do` 不回传该字段、D6 的 \*nix 系统目录黑名单、收窄「文件存储位置」可选范围。

- 上一任务 = 系统设置-存储位置「目录树选择」，已收尾归档：工作卡 `DevAgentControl/已完成/CURRENT_STATE_系统设置存储路径选择.md`，方案 `devDocs/系统设置存储位置目录选择方案.md`。
  已完成：后端只读超管接口 `ManageController.getServerDirList.do`（跨平台根节点、500 条截断、`showHidden`）+ 前端「选择…」对话框（懒加载目录树、目录图标、自动定位当前值、确定/取消在右下角、空目录按叶子处理）+ 5 个入口按钮；用户提交 `f327c8ad8`（P1 + UI 改版）、`a0136271f`（空目录不提示）。
  ⚠️ **4 个 ini 键名与字段名不一致**（`DBStorePath` / `SystemLogStorePath` / `AgentSkillStorePath` / `SalesDataStorePath`）；故意未做：新建文件夹、P3（校验/冲突告警/恢复默认/多节点提示）、英文页缺失的 `agentSkillStorePath` 行。
- 上一任务 = 仓库详情页（project）UI 优化，已收尾归档：工作卡 `DevAgentControl/已完成/CURRENT_STATE_仓库详情页UI优化.md`，方案 `devDocs/仓库页面UI优化方案.md`。
  S1（修掉 3 个缺陷：拖动可拖到最窄但不再透出 + 分隔条不再压滚动条/双击复位 + 二/三栏表头吸顶）已提交（主仓库 `864614c12`）并经用户人工验证；**S2 视觉现代化 / S3 交互增强经用户裁定「暂时不做，以后再说」**。

- 除此以外，`DevAgentControl/` 下的其余 `CURRENT_STATE*.md` 均属**挂起 / 暂停**，未获用户明确裁定前不要动代码（清单**以目录实际内容为准**，本文件不硬编码）。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共**五条**提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket` **和 `WebRoot/WEB-INF/lib`**；office 相关对它 clean，根目录 `git commit` 是空操作。
- **销售模块 `src/com/DocSystem/sales/`（独立仓库，`master`）**：`SalesBase.java`/`SalesController.java`/`PayController.java` 等（**不属于**主仓库——`git ls-files` 对该路径报 `did not match any file(s)`，改动要单独提交）。
- **业务/WebSocket 层 `src/com/DocSystem/websocket`（独立仓库，`master`）**：`BussinessController.java`、`BusinessBaseController.java`、`BussinessBase.java`、`OfficeController.java` 等（**不属于**主仓库，改动要单独提交；该仓库未跟踪 `office/`）。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。
- **`WebRoot/WEB-INF/lib`（独立仓库，`master`）**：第三方 jar 存放处（约 250 个）。**主仓库 `.gitignore` 已忽略整个目录**，所以在这里增删 jar 必须 `git -C WebRoot/WEB-INF/lib` 单独提交。该仓库**没有 `.gitignore`**。
  - ⚠️ **`mxsdoc.jar` 在本仓库里是"待删除"状态**：它的真实代码是 `src/com/DocSystem/websocket` 下的源码（该部分**不开源**，对外以 jar 形式提供）。**开发环境下有源码，所以必须删掉这个 jar**，否则运行期两个来源冲突会出错。**因此 `git status` 看到 `D mxsdoc.jar` 是正常的，不要去"恢复"它，也不要提交它**（等打包/发布流程处理）。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`；jar → `git -C WebRoot/WEB-INF/lib`。此处只描述结构；**是否开工前先提交、提交哪些，由工作卡决定**。

## 验证要求（不变量，务必遵守）

- 除非用户明确说明不需要，任何改动都必须**重启实际服务并做端到端实测**（真实页面/接口请求，覆盖正常与异常分支）；仅 `javac` 编译通过、静态检查通过都**不算完成**。
- ⚠️ **开发实例 = `C:\TomcatForDocSysDev`（发布用 `Docs/scripts/PublishDev.bat`，重启 `C:\TomcatForDocSysDev\docsys\docsys_restart.bat`）**。**`C:\MxsDoc` 是正式实例：绝对不要对它做任何开发/测试/重启/改文件**（2026-10-27 用户明确裁定；"8100 正在监听"不能作为实例归属的依据，两个实例都配 8100）。
- ⚠️ **Office 编辑/预览（office.html、OfficeEditor/OfficeEditorLoader）出问题不要去调研**：直接把现象报告用户，由用户处理（2026-10-29 用户明确裁定——Office 编辑代码正常情况下不可能有问题，真有问题也是大工程，用户来解决）。环境先例：字体库未就绪会让 office 查看器卡死整个渲染进程（`ensureOfficeFontsReady` 自动生成字体，等一次就好）；`OfficeEditor.js` 对 localhost/127.0.0.1 + 外部 Office 服务模式会 alert 阻断。

## 代码修复策略：测试覆盖决定修改方式（不变量，务必遵守）

- **测试覆盖不到的代码，禁止用批量替换方式修复**（2026-11-02 用户裁定）。逻辑：无法用测试覆盖的改动点只能算"**可疑**"而非"确定有错"；批量替换会把可疑推断放大成大范围行为变化，可能触发更多潜在错误——回归绿了也不代表安全（回归覆盖不到 xlsx/pptx 等路径）。
  - 正确姿势：聚焦到**具体故障文件**逐个精准修复，每处修复都有触发它的测试样本验证（先例：OLE 卡 5 处精准修复，`CURRENT_STATE_OLE对象与脏XML致doc无法打开.md`）。
  - **唯一例外**：有明确证据证明"批量替换本身就是正确修复"时——典型是「机械移植时同一处机器生成错误被批量复制」的场景：VML 属性序列化丢空格卡（office 提交 `2f2219f7`），C++ 宏 `ComplexTypes_WriteAttribute` 展开为 `name="value" `（尾带空格）语义明确，Java 移植把 `+ "\" ";` 错成 `+ "\"";` 共 83 处，每一处都与 C++ 宏展开逐字对应（有 `DiagVmlToXml` 生成端自检 + 全量回归兜底）。
  - 反例（已回退）：VarsCopy 模式 `this.m_oX.m_pPointer.copy(oSrc.m_oX.m_pPointer)`（全库 3025 行/778 文件）批量替换为共享赋值——语义上"应该"对，但测试覆盖不到，且共享赋值与 C++ 深拷贝存在语义差异，属于可疑推断的批量放大。
- **关联教训：回退源码必须同步重编全部受影响 class**，否则 `WebRoot/WEB-INF/classes` 里残留的旧编译产物会造成假验证（先例：Trac 手册一度被批量版残留 class 假性"救活"，重编后才现出真实的 CHpsMeasure NPE）。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- ⚠️ **命令行编译必须同时带 `-g -encoding UTF-8`**：Eclipse 工程默认生成 `LocalVariableTable`（`.settings/org.eclipse.jdt.core.prefs` 的 `debug.localVariable=generate`），而 `javac` 不带 `-g` 时**不生成局部变量表** ⇒ Spring MVC 无法解析控制器方法参数名（这些参数是**不带 `@RequestParam` 注解**、靠 debug 信息取名的）⇒ 凡带 `String/Integer/Long` 等形参的端点直接 **500**：`java.lang.IllegalArgumentException: Name for argument type [java.lang.String] not available, and parameter name information not found in class file either`。只有 `HttpSession/HttpServletRequest/HttpServletResponse` 这类按类型解析的参数不受影响，所以**症状是"部分接口 500"、极易误判为业务 bug**。先例：2026-10-10 仓库设置改造时漏 `-g`，`ReposController.addRepos.do` 等全部 500（Tomcat 堆栈见 `logs/localhost.<日期>.log`）。完整命令：`& $javac -g -encoding UTF-8 -cp "WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes <源文件...>`
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。

## 测试 scratch 输出目录（不变量，务必遵守）

测试运行产物（诊断输出、临时 bin/docx/xml、对比中间物）**一律写到 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`**（office/test 仓库 `.gitignore` 已忽略该目录）。**绝不写工程根 `tmp/`、`tmp_xxx/`**——这是绝大多数已跟踪测试的既定约定。

- 正式 fixture（需版本控制的测试输入）不适用本条：进 `src/com/DocSystem/websocket/office/test/测试文件/`，**不能**放任何 `tmp/`（tmp 被 gitignore，而 fixture 必须被跟踪）。
- **一旦在工程根发现 `tmp` 相关路径（`tmp/`、`tmp_*`、`tmp_test_output.txt` 等）**：立即提醒用户，并回查是哪个测试把 `OUT`/输出路径写成了工程根相对路径（应改成 `src/com/DocSystem/websocket/office/test/tmp/...`）。先例：`TestS3Diag.java:18` 曾把 `OUT="tmp/TestS3Diag/"` 吐到工程根，2026-09-09 已改回 office/test/tmp。
