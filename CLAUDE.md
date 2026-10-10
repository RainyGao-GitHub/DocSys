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

- **Agent 确认弹窗阻断与模式切换** —— 用户 2026-10-10 提出：**标准模式**下每个写操作都弹模态确认框，高频写（如"整理目录"连续几十次移动）时**没有机会去点权限模式 chip**；要求先调研其他 Agent 的做法 + 出方案，确认后才开工。工作卡 `DevAgentControl/CURRENT_STATE_Agent确认弹窗脱困.md`，方案（含 **§9 裁定汇总 / §10 实施记录**）`devDocs/Agent确认疲劳与模式切换方案.md`，业界调研 `devDocs/Agent审批机制业界调研（一手来源）.md`；前序口径（已实施的四档模式）：`devDocs/Agent权限模式改造计划.md`。
  ✅ **已按用户裁定实施完成并验收完毕（2026-10-10）**：12 项裁定（D1 实时生效 / D2 标准档可"记住授权" / D3 保持全屏遮罩 / D4 弹窗内可切自动档 / D5 超时绝不自动决定 / D6 计划先行缓做 / D7 顺手修 / D8 仅 move·rename 降为常规写 / D9 作用域按工具+目录 / D10 无限等待+上限保护 / D11 待确认可恢复 / D12 不做任何"按次数"机制）全部落地。
  关键实现：**模式/规则从"每请求快照"改为实时供应器**（`ToolRegistry.permissionContextSupplier`，标准档也认会话规则）；弹窗内给出**按工具/目录/仓库**的作用域授权 + 「切到自动模式并继续」；等待**默认无限、到点不做任何决定**，并新增 `GET /agent/confirm/pending`（按对话会话 id **与** jsessionid 双查）让**刷新/断网后待确认能恢复**；`/stream` 结果**先落库再推送**。
  证据：全量护栏 **46 套 / 2005 项 / 0 失败**；页面 E2E V1~V10 全通过（真实回合实测"同一轮第 2 次 `move_doc` 不再弹"、刷新后弹窗自动恢复、`delete_repos` 无任何放宽入口）；验证期额外修掉 8 个"不做就达不到验收"的问题（目录授权对移动/复制无效、实况 SSE 丢目录、查错会话 id、**授权与批准并行的竞态**等，详见方案 §10.2）。测试数据已清理、**零文件改动**。
  ⚠️ 未改的两条既有裁定：**绝对保护（`delete_repos`）任何档位都要问**；**会话规则只到本会话**。
  ⏭ **已提交主仓库 `e32c0f038`**（2026-10-10，24 个文件：实现 + 护栏 + 文档）；工作树已干净。后续可收尾归档（本卡移入 `DevAgentControl/已完成/`、本文件换卡）。

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
