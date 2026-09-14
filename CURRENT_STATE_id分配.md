# CURRENT_STATE — id 分配对齐修复（工作卡）

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。**当前激活的工作卡是这一份**。小而新鲜，随手更新；细节回落 references。**只描述 id 分配对齐修复任务，勿混入 fixture 验证状态**（fixture 验证见 `CURRENT_STATE_fixture验证.md`）。

## ✅ 任务状态：已全部闭环（2026-09-13）

W1 + G3 双命中，全部代码已提交。

| 测试 | 结果 |
|---|---|
| TestW1IdMapDump | docStart=824 ✓ |
| TestW1IdMapDump 3（G3） | docStart=634 ✓ |
| TestJMergeJavaGolden_W1 | noHost=0, error=0, 10/10 PASS ✓ |
| TestJMergeJavaGolden3 | noHost=0, error=2（已知 Drawing Flip 未实现，classId=196609） ✓ |
| TestRevisionIdAlloc | 6 PASS / 1 FAIL（唯一 FAIL = round-trip +10，已知 Correct_Content 空 run） ✓ |

## 下一步

id 分配对齐已闭环，**下一个 fixture 由用户决定**。

- **2026-09-14 路径对比分析（已交付，未改代码）**：对 Java/JS 的 ownerId 分配做了分层对比 → 结论「走了相同路径」。产物：`docs/id分配-路径对齐对比分析.md`（office 仓库，未提交）。
  - L0 终态序列 oracle（已有）／L1 静态逐节点路径对照表（新，§2）／L2 OrgPath 锚点审计（新，49 引用全核验，§4）。
  - 确认差异点全部 id-neutral（Comments/Settings 等跳过、glossary 常数覆盖、Drawing 子对象估算、Correct_Content 删除分支、pre-doc 无映射）。
  - **同日按用户要求把 §2 每个对比项展开为代码对拍**（JS 蓝本片段 + Java 片段 + 逐点说明，全部行号当天实测于蓝本 HEAD d2baeb9714）。
  - **同日补全三端覆盖**：新增 §2.10 Slide（PPTY，锚定反推策略：Slide ctor 8 id + per-shape 序列 oracle 指认 + JSlideIdResolver 候选枚举）与 §2.11 Excel（XLST，ownerId 机制不适用，payload 级 golden）；§3 增补 Slide 特有差异点 7/8；§4 增补 slide 侧锚点审计（88 引用：74 命中/14 微漂移已抽验/0 缺失）。
  - 若需更强的运行时证据：**L3 动态事件流 diff**（方案见该文档 §5）待用户决定是否实施。
- **2026-09-14 GraalJS 替代 Nashorn 评估计划（文档已交付，未做验证）**：用户提出"移植维护成本大，是否应像 C++ 一样用 JS 引擎执行"。产物：`docs/GraalJS替代Nashorn评估计划.md`（office 仓库，未提交）——性能数据（Nashorn 57-78s / 移植 1.5-1.9s / "Nashorn 比 V8 慢 50-100×"）、spike 设计（最小 harness + golden 兼容性门 + 两生命周期三段计时 + PASS/FAIL 判据）、NSJSBase 8 文件迁移清单、JDK 迁移四阶段、风险表。**验证由用户决定何时开始**。

---

## References

- 权威范围：`docs/apply_changes代码逻辑分析.md` §14（office 仓库）
- 路径对比分析：`docs/id分配-路径对齐对比分析.md`（office 仓库，2026-09-14）
- 续接上下文：`docs/apply_changes-JS移植Java开发上下文.md`
- 记忆：`revision-envelope-id-alignment`、`jbin-id-allocator-ccore-pitfall`、`binstream-getstring2-byte-count`、`porting-faithfulness-principle`、`sdkjs-version-pin-7.0.1`
- 编译/提交前提见 CLAUDE.md（`.class` → `WebRoot/WEB-INF/classes`；核心代码 → office 仓库，测试 → office/test）

### ★ JS 蓝本源码位置（对照移植的唯一权威源，勿再找错）

- **原始源码（唯一可对照蓝本）＝ `D:/Dev/onlyoffice-study/sdkjs`**，当前 HEAD＝**v7.0.1.34 / `d2baeb9714`**。
  - `Serialize2.js` ＝ `D:/Dev/onlyoffice-study/sdkjs/word/Editor/Serialize2.js`
  - 主题/绘图反序列化：`common/Drawings/Format/Format.js`、`common/Shapes/Serialize.js`
- **`WebRoot/web/static/office-editor/sdkjs/sdk-all.js` 是部署 bundle，不是蓝本**，缺全部反序列化函数，绝不拿它对照。

## ★ 节奏约束（仍有效，适用于下一个 fixture）

- 每完成一个 fixture 的验证和修复后，必须等用户手动确认通过才能开始下一个 fixture；禁止自行连续推进。
- **2026-09-09 用户决定（改代码前的讲解门禁）**：开始修改代码之前，必须先对照 JS 源码把要移植的逻辑讲清楚，并把讲解写成文档放 `src/com/DocSystem/websocket/office/docs`，等用户确认后再开工。

---

## 提交状态（2026-09-13）

**office 核心仓库（dev/office）** — ✅ 已提交 10 条：

| commit | 内容 |
|---|---|
| `c9c0cabe` | 子项 1：Del/Ins/MoveFrom/MoveTo 0-id |
| `4c3b5079` | 子项 2：忠实路径容器 skipN 5→6 |
| `a99958ab` | 风险 1：真实遍历替换 481 常量（Fix A/B/C） |
| `34429f3f` | 风险 1 实现雷修复（Seek2 + no +4） |
| `ec4572f7` | 风险 2：Drawing 子对象真实遍历 + PRESET_PATHS 227 项 |
| `6e0f5328` | 风险 3-5 文档分析（三项关闭无需改代码） |
| `486be66c` | §14.7 Risk 1：SpPr Geometry 非真实风险（候选六） |
| `c0a572a5` | 候选七：bootstrap 594 + Ah+1 + Numbering Read2 + theme 咀嚼保真 |
| `7db43780` | W1 段落边框 Unifill 主题色修复 |
| `bc954fbf` | Drawing 子对象计数三处 bug 修复（cntPicIds/cntSpPrSubIds/cntGrSpPrSubIds） |

**office/test 仓库（master）** — ✅ 已提交 2 条：

| commit | 内容 |
|---|---|
| `845e2c0` | 5 个测试文件移除 globalCalibrationOverride |
| `9d23075` | W1 fixture 验证测试组（5 个测试文件）+ RevisionIdAlloc 断言更新（docStart=596，maxId≤602） |

**root 仓库（devInt）** — ⏳ 未提交：`CLAUDE.md`（M）+ 本工作卡（M）。

---

## 已知未来缺口（本任务不修，记录在案）

- **aSeekTable type-19（glossary document）**：W1/G3 均无此分节，不触发。将来带 glossary 部件的 bin 时需补。
- **pre-doc 无模型映射**：pre-doc 对象无 idMap 条目 → 脚注/页眉 change 会 noHost（fail-loud）。待该类 change 移植时一并建模。
- **Drawing Flip 处理器未实现**（classId=196609=0x30001）：G3 error=2，非 id 分配问题，预存在缺口。
- **Da(id=1) 与 192-195 gap 的对象 identity**：接受为常量，sdkjs 升级时随 checklist 复查。

---

## 关键技术结论（备查）

### bootstrap = 594（fixture 无关常量）

JS 打开路径在读 bin 之前的构造序列（蓝本 api.js:11283 + Document.js + Styles.js 等）：

| id 区间 | 对象 | 来源 |
|---|---|---|
| 1 | Da | pre-editor 对象（identity 未查明） |
| 2 | CDocument | Document.js ctor |
| 3 | SectPr | CDocument ctor 内 |
| 4-6 | 首段落三件套 | Paragraph.js:65 |
| 7 | CStyles-self | Styles.js:7560 |
| 8-189 | 182 默认样式 b1 | CStyles ctor |
| 190 | CHeaderFooterController | HeaderFooter.js:1452 |
| 191 | CGlossaryDocument | GlossaryDocument.js:53 |
| 192-195 | ctor-gap（4 个一次性 id） | 接受为常量 |
| 196-225 | glossary 5 占位 ×6 | private_CreateDefaultPlaceholder |
| 226 | glossary CStyles-self | Styles.js:7560 |
| 227-408 | 182 默认样式 b2 | glossary CStyles ctor |
| 409-412 | glossary/main Foot+End controller 各 1 | Footnotes.js:41 / Endnotes.js:46 |
| 413-594 | CopyStyle 复制 182 | api.js:11283（读 bin 之前！） |

### W1 pre-doc 算术

`594(bootstrap) + 1(Ah) + 1(theme) + 36(notes) + 6(numbering) + 1(Core) + 184(styles) = 823 → docStart=824` ✓

- **Ah**：DocReadResult.bookmarkForRead（Serialize2.js:17466，BinaryFileReader 构造器内）
- **Numbering Read2**：Num 体帧格式是 Read2（type+lenType+4B），Java 原用 Read1 → Skip2 越界，3+1=+4；改 Read2 → 3+3=+6 ✓
- **theme 咀嚼保真**：JS ReadTheme 主 switch 无 default（逐字节咀嚼）；5 处求值序 bug（`s.cur + s.GetULong()` 少 4B）

### TestRevisionIdAlloc 当前期望值

- docStart = 596（revision fixture 无 Other/Notes/Numbering/Styles 分节 → `594 + 1(Ah) + 1(Core) = 596`）
- maxId ≤ 602
- passed=6 / failed=1（唯一 FAIL = round-trip +10，已归因 Correct_Content 空 run，与修改无关）

### 如何重跑 TestRevisionIdAlloc

工作目录 `D:/Dev/DocSys`：
```
C:/docsysRel/docsys-WDK/docsys/tomcat/Java/jdk/bin/javac -encoding UTF-8 \
  -d WebRoot/WEB-INF/classes \
  -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  src/com/DocSystem/websocket/office/test/TestRevisionIdAlloc.java

java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  com.DocSystem.websocket.office.test.TestRevisionIdAlloc
```
