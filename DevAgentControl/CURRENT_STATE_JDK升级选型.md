# CURRENT_STATE_JDK升级选型（工作卡）

> 状态：**调研完成、D1~D5 已裁定、步 1 PoC 已完成；实施路径已定为两阶段；下一步 = 阶段 1（引擎先行）**（2026-10-07）
> 前置卡 `CURRENT_STATE_war打包.md` **已收尾**（导出可发布 `DocSystem.war` 并校验通过），已移入 `DevAgentControl/已完成/`。

## 已裁定（2026-10-07）

| 项 | 结论 |
|---|---|
| **D1 目标 JDK** | **JDK 17 + GraalJS 23.0.x**（用户确认） |
| **D2 运行时形态** | **形态 A：Oracle GraalVM for JDK 17（GFTC）**，接受"17 档持续引擎补丁由 GFTC 版本提供" |
| **D3 随产品分发** | **是**（替换 `tomcat\java\jre`）；义务：分发时**不得删改** Oracle GraalVM 的版权/商标声明 → 打包校验加一条 LICENSE/NOTICE 检查 |
| **D4 Tomcat 档位** | **Tomcat 9.0.x**（保持 `javax.servlet`，源码包名不动）；`10.1/11` 的 jakarta 全量迁移**另行立项** |
| **D5 spike 顺序** | **先做纯引擎 PoC（JDK 8 + GraalVM CE 21.2 跑 `sdk-all.js`），拿到兼容/性能数据再动 JDK**；PoC 结论只是预判，最终必须在 17 档重验一次（计划 §4.0）→ ✅ **已执行**（计划 §4.5） |
| **实施路径（2026-10-07 裁定）** | **两阶段**（计划 §6.4）：**阶段 1 = 引擎先行**（运行时用 **形态 C：GraalVM CE 21.2 / JDK 8**，JDK 与 Tomcat 都不动，只做 `CJSContext` 引擎工厂 + §5/§5.2 的 `ScriptObjectMirror` 改写 + golden 验证 → 出口即**可退役 JMergeEngine**）；**阶段 2 = 基础设施迁移**（换形态 A：Oracle GraalVM for JDK 17 + Tomcat 9.0.x + §6.2 整张清单）。**最终目标档位 D1（JDK 17）不变，变的只是到达顺序。** |

## 下一步

**阶段 1（引擎先行）** —— 运行时用形态 C（GraalVM CE 21.2 / JDK 8），**不动 JDK、不动 Tomcat、不动任何 jar**。

**✅ 已完成：真实转换三端验证（内容一致）**（计划 §6.4.6）

首次真实执行 `open → applyChanges → getFileData → x2t`（`JMergeEngine.setEnabled(false)` 强制走 JS 路径，
唯一变量 = `-Ddocsys.office.jsEngine`）：

| 端 | nashorn | graaljs | 倍率 | ZIP 条目 | 内容一致 / 仅时间戳 / 内容不同 |
|---|---|---|---|---|---|
| word（W1段落属性全家桶） | 35.6 s | **12.8 s** | 2.8× | 14 | 13 / 1 / **0** |
| slide（商业计划书） | 33.8 s | **14.9 s** | 2.3× | 59 | 58 / 1 / **0** |
| cell（复杂修改测试） | 97.9 s | **19.6 s** | **5.0×** | 13 | 12 / 1 / **0** |

六次运行全部 OK、无异常；"仅时间戳不同"的条目三端都是同一个 `docProps/core.xml`。
→ 判定 **IDENTICAL-MODULO-TIMESTAMPS**。

- 复现：`test/tools/run_js_path_engine_compare.ps1`（`TestJsPathEngineCompare.java`，三端参数化）。
- **方法学更正**：§4.2 的"逐字节一致"**不可达**（OOXML 天然带保存时刻，同引擎跑两次也不同），
  判据已改为 **"时间戳归一化后逐字节一致"**，且比较必须落到 **ZIP 条目级**
  （只看整文件哈希/大小会误判：大小会因时间戳内容的 deflate 长度漂移 ±2 字节）。
- 顺带修掉真实缺陷：`CJSObject.getNative()` 需 `JSValueAccess.unwrapHost()`
  （GraalJS 把宿主对象包成 `Value` 返回，`instanceof CJSEmbedObject` 不成立 → NPE）。

**阶段 B 触发条件盘点**：

| 条件 | 状态 |
|---|---|
| 三端内容一致（时间戳归一化） | ✅ 已满足 |
| **运行时切到 GraalVM（形态 C）** | ❌ **未做**——`tomcat\java\jre` 仍是 JRE 1.8.0_162 |
| 权限收敛（风险 11） | ✅ **已做**（`EXPLICIT` + 2 个 `@Export`；删掉 classLookup/IO） |
| 共享 `Engine` | ✅ **已做**（`JSEngineFactory` 静态共享 Engine） |
| 共享 `Source` / 缓存 | 不需要（实测共享 Engine 即够，`CDoctRenderer_Private` 未动） |

→ **阶段 B 只剩"切运行时"这一个动作**（外加最后一道完整双引擎回归）。

**✅ 已完成：阶段 B 代码侧两项改动（计划 §6.4.8，2026-10-07）**

1. **共享 `Engine`**：`JSEngineFactory` 新增静态共享 Engine（懒建、进程级单例、永不 close），
   `createGraalContext()` 改用 `.engine(sharedGraalEngine())`。
   实测（**每场景独立 JVM**，注意第一次同 JVM 连跑被 JIT 预热污染）：
   稳态载入 slide **1215→251 ms**、word **1386→223 ms**、cell **1486→334 ms**（每篇省约 1 s）；
   4 线程 × 4 次并发 16 次转换墙钟 **14808→7051 ms（2.1×）**，**零异常**；
   内存无实质差异（214–240 vs 217–244 MB）；**冷启动不受益**（两边都约 4 s）。
   否掉了"复用 Context"方案（稳态 232 ms 相当，但会串上一篇文档的 JS 全局状态）。
2. **权限收敛**：删掉 `allowHostClassLookup`/`allowIO`；`HostAccess.ALL` → **`EXPLICIT`**，
   只给 `CJavaEmbedBinder.create/invoke` 加 `@HostAccess.Export`。
   **为什么只需 2 个注解**：JS 拿到的是我们建的 JS wrapper，其成员是 JS 闭包（闭包再调 `JavaCreateEmbed.invoke`）；
   embed 实例（`__nativeEmbed`）只被 Java 侧 `CJSObject.getNative()` 读，sdkjs 里 `__nativeEmbed` **0 处**
   → JS 能触达的宿主对象**只有 `JavaCreateEmbed` 一个**。

**门禁**：13 项冒烟 **nashorn 13/13 + graaljs 13/13**；三端真实转换 word/slide/cell 全部
**IDENTICAL-MODULO-TIMESTAMPS**（内容不同 0）。耗时 word 12.78 s、slide 14.56 s、cell 18.76 s。

⚠️ **一处需要澄清的"假警报"**：cell 端日志有 `TypeError: null has no such function "lF"` ＋
`AVS_FILEUTILS_ERROR_CONVERT_CORRUPTED`。与 **nashorn 基线日志逐字比对**后确认**此前就存在**
（同样的 `index="35"`），是 xlsx fixture 里两端都拒绝的变更项，与本次改动无关，且**两端产物仍一致**。

**顺带关闭/新增的结论**：

- **编译期 JDK 不用换**（用户提问）：① 实测 stock javac **8u162** 能编译阶段 1 全部 8 个类、产物 major=52；
  ② GraalJS 的 jar 主体都是 Java 8（`module-info`/`META-INF/versions/*` 在 8 下不参与解析）；
  ③ 编译 JDK(8u162) ≤ 运行 JDK(8u302) 是**安全方向**，且默认 nashorn 回退路径要求用旧 javac。
  GraalVM 的 `jre/` 里**没有 `javac.exe`**，4 个启动脚本统一指向 `%CATALINA_HOME%\java\jre`
  → **换运行时不用改脚本、也碰不到编译 JDK**。
  ⚠️ 唯一未验：Eclipse/JDT（ECJ）编译（手边无 ecj；风险低）。
- **`js.nashorn-compat` 的真正价值**：实测开 compat 后全局对象面与真 Nashorn 8u162 **16 项全一致**
  （连 `Map`/`Set`/`Symbol`/`Proxy`/`Promise`/`Object.assign`/`Array.from` 都同为 undefined）；
  **不开则 sdkjs 会突然看见一批 Nashorn 下不存在的 ES6 全局** → 它不是"顺手加的开关"。
- **icu4j/Intl 风险关闭**：`Intl` 在 GraalJS（compat 与默认）与 Nashorn 下**都不存在**，我们从不依赖 ICU 路径。
- **新风险 19**：切运行时后 GraalVM 的 `jre/languages/js/graaljs.jar` 与 `WEB-INF/lib/js-21.2.0.jar` 并存，
  **boot classpath 优先** → 将来换 GraalVM 版本而忘了同步 `WEB-INF/lib` 时实际生效的是运行时那份，易误判。
- **新风险 20**：共享 Engine 是官方"实验特性"，且引擎级代码缓存随脚本集增长；需补测三端同时使用的内存曲线。

**第 1 步（引擎获取收敛 + 冒烟）已完成**（计划 §6.4.1）：

- 新增 `doctrenderer/NSJSBase/JSEngineFactory.java`（开关 `-Ddocsys.office.jsEngine=nashorn|graaljs`，缺省 nashorn 且逻辑与改造前逐句等价）；
  `CJSContext` 构造器改为 `JSEngineFactory.create()`。
- 冒烟（真实生产类）：**nashorn 缺省模式 PASS=10/FAIL=0（行为不变 ✅）**；**graaljs 模式 PASS=7/FAIL=3**。
- 复现：`test/tools/run_cjscontext_engine_mode.ps1`（`TestCJSContextEngineMode.java`）。

**第 2 步（适配层）：已完成基础部分，双模式全绿**（计划 §6.4.3）

- 新增 `NSJSBase/JSValueAccess.java`（引擎无关的值访问层，20 个静态方法，按
  `ScriptObjectMirror` → `Value` → `Map/List` 三级分派）。
- 改造 `JSEngineFactory`（新增 `createGraalContext()`）、`CJSContext`（新增 `graalContext` 后端 +
  `convertGraalValue()` + 六处按后端分支）、`CJSObject`（6 处 cast）、`CJSArray`（6 处 cast）、
  `CJSValue`（5 个转换/判定方法加 `Value` 分支）。
- **回归门已绿**：`tools/run_cjscontext_engine_mode.ps1` → **nashorn PASS=10/FAIL=0（行为不变）**、
  **graaljs PASS=10/FAIL=0**（原 7/8/9 三个失败点全部消灭）。

**第 3 步（定长数组 + embed 桥）：已完成，双模式 13/13**（计划 §6.4.4）

- 改造 `CJSTypedArray`（新增 Value 构造器；`byte[]` 构造与 `getCount`/`getData` 走适配层）、
  `CJavaEmbedBinder`（wrapper 由 `CJSContext.createObject()` 建；`createMethodWrapper` 用 `evalRaw`；
  `extractArgs`/`convertArg` 引擎无关化）；`CJSContext` 新增 `evalRaw`/`createUint8ArrayRaw`，
  `convertGraalValue` 现在把 Uint8Array 还原成 `CJSTypedArray`。
- **回归门**：`run_cjscontext_engine_mode.ps1` → **nashorn 13/13（行为不变）**、**graaljs 13/13**
  （新增 3 项：Uint8Array 往返、eval 出的 Uint8Array 识别与取字节、embed 桥调用宿主方法）。
- **风险 18（新发现）**：Truffle 把 JS 真数组作为宿主 `Object` 形参传入时给的是 `PolyglotMap`，
  且该视图对真数组**没有索引**（`isList()==false`、`keySet()` 空）→ 宿主侧参数永远取不到
  （表现为 `NoSuchMethodException: m(1)`）。对策：JS 侧改传"数组样式对象"`{length:n,0:…}`
  （普通对象在 Truffle 下是可枚举 `Map`），两引擎共用同一套 JS。已修并验证。
- 核实：`JSUint8Array` **零引用 = 死代码**，不碰 `CJSContext.engine` → 不构成 NPE 风险，本次未动。

**nashorn 的定位（2026-10-07 裁定，详见计划 §6.4.5）**：**不是产品路径**（实测载入 18.1–20.6 s/篇，性能不可交付），
只作①**过渡期"行为不变"对照物**（唯一能二分"是 GraalJS 的问题还是重构的问题"的手段，且本次重构同时改到了 nashorn 侧）
②**回退路径**。**现在不删**——保留成本仅 **11 处分支，全在 `CJSContext`**。

退役按 **A/B/C 三阶段**：
- **A（现在）**：保留 + 定性（本次已落地）。
- **B**：触发条件 = **三端 golden 在 graaljs 下逐字节一致** **且** **运行时已切到 GraalVM** → 默认切 graaljs，nashorn 退居显式开关 `-Ddocsys.office.jsEngine=nashorn`，保留一个发布周期。
- **C**：上线稳定后删除 nashorn 分支（`CJSContext` 11 处 + `JSEngineFactory.createNashorn()` + `engine`/`globals` 字段）→ 单引擎。

⚠️ **约束**：默认切 graaljs **必须与"运行时切 GraalVM"绑定**——在 stock JDK 8 上 GraalJS 只能解释执行
（实测打印 `does not support runtime compilation … interpreted mode only`），那时**可能比 nashorn 还慢**。
另：nashorn 退场**不等于没有 JS 引擎兜底**，长期兜底是 **`JMergeEngine`（纯 Java 移植）**。

**仍未做（通往阶段 B 完成只剩这些）**：

1. **切运行时到 GraalVM CE 21.2（形态 C）**——`tomcat\java\jre` 仍是 JRE 1.8.0_162。这是阶段 B 最后一个动作。
2. 切完后跑**完整双引擎回归**（13 项冒烟两模式 + 三端真实转换两引擎；nashorn 对照必须仍行为不变）。
3. 补测**三端同时使用**时共享 Engine 的内存曲线（风险 20）。
4. 裁定是否把默认引擎切成 graaljs（阶段 B 的正题；必须与运行时切换绑定）。

**第 2 步的调研（已完成，结论并入计划 §6.4.2）**：

- 新增两个探针（office/test）：`TestJsValueProbe.java`（两引擎对比"JS 值 → Java 类型"）、
  `TestGraalJsApiProbe.java`（Polyglot `Context`/`Value` 的 API 映射逐项实测）。
- **更正**：第 1 步里"可保留 `javax.script` 抽象只适配值类型"的判断 **实测不成立**——
  JSR-223 下 GraalJS 把**数组**还原成 `PolyglotMap`（非 `List`、无索引视图），
  **数组元素与 `Uint8Array` 元素取不到**，且拿不到 `Value`
  → **graaljs 模式必须自带 `org.graalvm.polyglot.Context`**（回到 §3/§5 原设想）。
- 两个新陷阱（计划风险 16/17）：`Value.asInt()` 对非整数**直接抛**（`1.5` 抛），
  故 `toInt()/toInt32()` 必须"`fitsInInt()` 优先，否则 `(int) asDouble()`"；
  `null` 与 `undefined` 在 `Value` 上都是 `isNull()==true`，**无法区分**。

**依赖方案（已实施，2026-10-07）**：

- **方案 A**：`WEB-INF/lib` 新增 4 个 GraalJS jar（`js-21.2.0` / `truffle-api-21.2.0` /
  `graal-sdk-21.2.0` / `regex-21.2.0`，合计 **29.7 MB**），提交在 **`WEB-INF/lib` 独立仓库** `25d6f2c`。
  已验证：现有构建链（JDK 1.8.0_162 javac + `WebRoot/WEB-INF/classes` + `WebRoot/WEB-INF/lib/*`）
  可正常编译 `import org.graalvm.polyglot.Context/Value` 的代码（exit 0）。
- **另更正一处**：上一轮记的"Maven 组装路线在 JDK 8 上不可用"**不成立**——用**含全工程 jar 的
  生产 classpath** 重跑，**stock JDK 8u162 上 GraalJS 能跑**（`hasMembers=true arrSize=3 elem1=2`），
  只是**纯解释模式、没有 Graal JIT**（当时缺的是工程里已有的 `icu4j` 等依赖）。
  故"必须用 GraalVM 运行时"的理由是**要拿 JIT / 可比性能**，不是"跑不起来"。
- 待核对：js 21.2 的 pom 声明 `com.ibm.icu:icu4j:69.1`，工程内是 `icu4j-72.1.jar` → graaljs 模式实跑时验 Intl 路径。
- `WEB-INF/lib` 是第 5 个独立 git 仓库（已记入 `CLAUDE.md`）；其中的 `D mxsdoc.jar` 与实际代码同源
  （该部分不开源，开发环境有源码故必须删除），**属预期状态，不要恢复也不要提交**；
  test 仓库那个被覆盖的 fixture 同理，**均未动**。

## 需求

用户（2026-10-07）：Office 文件转换（`apply_changes`、转 PDF）涉及**调用 JS 代码**，好外是前后端结果一致；JDK 8 的 Nashorn 有性能问题，两个方案里已决定走**升级 JDK + GraalJS**。之前的评估方案 [GraalJS替代Nashorn评估计划.md](../src/com/DocSystem/websocket/office/docs/GraalJS替代Nashorn评估计划.md) 有两点没考虑周全，要求补齐：

1. **JDK 版本的选择** —— 目标是"执行 JS 代码"，所以**不是越新越好**：若 JS 执行引擎相同，理论上**离 JDK 8 越近的版本越安全**；并且要考虑新 JDK 有没有**对应的免费版本**（JDK 8 有明确的免费版本）。
2. **确定 JDK 版本后，列出所有受影响内容**（jar 包、源代码、甚至 Tomcat 版本），并**确定对应的迁移方案**。

## 必读上下文

- 参考计划（本次已修订）：`src/com/DocSystem/websocket/office/docs/GraalJS替代Nashorn评估计划.md` —— §6.1 选型 / §6.2 全量影响清单 / §6.3 迁移方案。
- `devDocs/参数存储策略与参数清单.md`（本次未触及参数功能）
- 待收尾前卡的残留项（见下"挂起"）。

## 参考计划与上下文（本次结论的判据来源）

- 计划原文 §6 曾写「JDK 21（GraalVM Community）」→ **本次修订改为 JDK 17 + GraalJS 23.0.x**，理由见计划 §6.1.4。

## 当前进展（2026-10-07）

### 进行中 / 已完成：步 1 纯引擎 PoC（JDK 8 + GraalVM CE 21.2）—— ✅ **已完成（2026-10-07）**

**结论：三端全部 PASS；载入整包脚本 GraalJS ≈ 13× 于 Nashorn。**

| 端 | 脚本量 | 冷 | **热中位** |
|---|---|---|---|
| word / document | 7,690 K chars | 3,507 ms | **1,281 ms** |
| slide / presentation | 7,808 K chars | 3,161 ms | **1,312 ms** |
| cell / spreadsheet | 8,936 K chars | 3,052 ms | **1,449 ms** |
| **Nashorn 对照**（同机同脚本，JDK 1.8.0_162） | 7,690 K chars | — | **17,236 ms** |

- Context 创建：冷 ~280 ms、**热 1–2 ms**（默认共享 `Engine`）→ 生命周期 B 的成本几乎为零。
- 与生产的差别：Java embed 对象用 JS 桩替代（全脚本集只用到 `NativeEngine.ConsoleLog / GetDevicePixelRatio / GetEditorType` 三个方法）；**未跑** open→applyChanges→getFileData，**未比 golden**（那是步 2）。
- 运行时：GraalVM CE 21.2.0 (java8)，SHA256 `3366c51e…1206bb4` 与官方一致，自带 OpenJDK 1.8.0_302。
- **副产发现**：`sdk-all-min.js` 里的 `/[,\s-+/^&%<=>]/` 是 ES5 非法正则，原始文件 Nashorn 解析不了；生产靠 `CDoctRenderer_Private.java:1179` 的**硬编码字符串替换**救回；**GraalJS 不需要该补丁** → 迁移可删掉这个版本耦合点（计划 §4.5、风险 13）。
- harness 已入库 **office/test 仓库**（`TestGraalJsBundleEval.java` / `TestNashornBundleEval.java` / `ScriptBundle.java` + `tools/run_graaljs_poc.ps1`，脚本清单从 `DoctRenderer.config` 读取）；台面产物落 `test/tmp/GraalJsPoc/`。GraalVM CE 21.2 运行时在仓库外 `D:\Dev\GraalVM-PoC\`。

### 已完成：调研（有实测证据，全部写进计划 §6.1、§6.2、§6.3、§9.1）

- **新增（计划 §4.1 修订 + §5.2）**：harness 的正解是**复用生产类、只换 `CJSContext` 的引擎**（`CDoctRenderer_Private.ExecuteScript()` 的前置注入全是生产类做的），**不是**另写 native 桥；但前提是**先改掉 `ScriptObjectMirror`**（GraalJS **不提供** `ScriptObjectMirror`，官方 `NashornMigrationGuide` 明写）→ 因此建议 **Phase 1 与 spike 合并做**。
- **新增（计划 §5.2，10 条官方约束）**：`js.nashorn-compat` 需 `allowExperimentalOptions`；开 compat 后默认 ES5；**不提供 `ScriptObjectMirror`**（改 `Map`/`Value`）；compat 专属能力清单（`Java.isScriptObject`、`new Interface(fn)`、`JavaImporter`、`JSAdapter`、`load("nashorn:...")`、`exit/quit`）；Nashorn 语法扩展默认开；~~`Java.type`/`Packages` 等默认可用于是 sdk-all.js 不用改~~ **❌ 该判断已被实测推翻（2026-10-07，计划 §6.4.7）：整个 office-editor 静态树 + office 源码 + test 的 `Java.type` 全 0 处，脚本里也没有 JS 层 `load(` → 这些能力我们一处都没用**；**secure by default** 要显式放开 `allowHostAccess`/`allowHostClassLookup`/`allowIO`（实测**只有 `allowHostAccess` 必需**，另两个是凭猜想加的、可去掉）；**不允许有损转换**（数值不匹配抛 `TypeError`）；ScriptEngine 名是 `graal.js` 不是 `nashorn`（**必须钉死构建，防止运行时加载到真 Nashorn**）；compat 自动开选项**只对 legacy ScriptEngine、对 `Context` 不会**。
- **新增风险 11/12**：安全面扩大（与现网 Nashorn 行为不同，要逐条对比，优先 `HostAccess.EXPLICIT`+白名单）；有损转换（桥里 `int/long/byte` 互操作点要逐个核对 + `targetTypeMapping`）。
- **风险 11 已实测摸清（2026-10-07，计划 §6.4.7）**：① 默认即 `HostAccess.EXPLICIT`（`ALL` 是我们主动开的口子）；② **闸门是 `HostAccess` 而非类查找**——不开类查找、只留 `ALL` 时 JS 仍能经 `h.getClass().getClassLoader()`/`getMethods()` 反射出去，故"关掉 classLookup 就安全"的想法不成立；③ `EXPLICIT` 的失败方式隐蔽（读未导出字段**静默返回 `undefined`**，不报错）；④ 收敛触及面有界（全局仅 `CJavaEmbedBinder` + `Embed(...)` 注册的 8 个类），但**按裁定留到阶段 B**。
- **新增事实**：sdk-all.js **不是一份而是三份**（`sdkjs\word` 5.79MB / `slide` 5.97MB / `cell` 7.02MB，选择逻辑在 `CDoctRendererConfig`）；`sdkjs\*\sdk-all.cache` 是**浏览器 V8 代码缓存**（前端产物），不是 Java 侧缓存。

**A. JDK 版本选型（回答用户第 1 点）**

- **关键事实**：GraalJS 引擎版本与 JDK 档位**成对绑定**，且 **JDK 17 与 JDK 21 是两个不同的引擎版本**（23.0.x / 23.1.x）→ 用户"同引擎取最近 JDK"的判据**不能**用于在 17 与 21 之间排序，只能排除 ≥22 的非 LTS 档位。
- **Maven Central 实测（2026-10-07 本机 Invoke-WebRequest）**：`org.graalvm.js:js` 覆盖 19.0.0→25.4.4.1.1；`22.3.x` 止于 **22.3.5**（**JDK 11 档的引擎线已停更**）、`23.0.x` 到 **23.0.13.1.1**、`23.1.x` 到 **23.1.12.1.1**，`lastUpdated=20260922`。→ 17 档与 21 档的引擎**都还在打补丁**。
- **许可实测**：GraalVM CE = GPLv2+CE 但**只跟最新 JDK**（JDK 17 的 CE 冻结在 23.0.2）；**Oracle GraalVM = GFTC，免费含生产且允许原样再分发**，17/21/25 三条 LTS 线都在同步打 CPU；Liberica NIK 开源存在（GitHub Releases 实测，JDK 配对 UNVERIFIED）；Mandrel **不含 GraalJS**（排除）。JDK 本体：Temurin/Corretto/Zulu/Liberica/MS Build 全免费；Oracle JDK 8u202 及更早=BCL 免费（**现用 8u162 属此区间**），8u211+/17=OTN 商用需订阅，21/25=NFTC 免费。
- **结论**：**目标 = JDK 17 + GraalJS 23.0.x**。排除 JDK 11（引擎线死，等于交付不再打补丁的 JS 引擎）、排除 21/25（迁移面更大且是另一个引擎版本，无本任务收益；且 JDK 23 弃用 `sun.misc.Unsafe` 内存访问、24 起要开关，而我们实测有 **10 个 jar** 明确引用 `sun.misc.Unsafe`）。JDK 8 + GraalVM CE 21.2/21.3 仅作 **PoC 过渡**（能零 JDK 迁移，但 JDK 与引擎双双 EOL）。
- 运行时两种交付形态已列出（A：Oracle GraalVM/NIK 发行版；B：Temurin 17 + GraalJS artifacts + JVMCI），待裁定。

**B. 全量影响清单（回答用户第 2 点，全部本仓库实测）**

- **本机现状**：`tomcat\java\jre` = **JRE 1.8.0_162**（`docsys_start.bat` 把 JAVA_HOME/JRE_HOME 指向它）、编译 JDK = **1.8.0_162**、Tomcat **7.0.56**（Servlet 3.0、`tomcat7-websocket.jar`）、`bin\catalina.bat` **没有任何 JAVA_OPTS/-Xmx**、**无 setenv.bat**、`.settings` 的 compliance/source/target = **1.8**。
- **Tomcat 7.0.56 → 9.0.x**（仍 `javax.servlet`，源码不改包名；**不要**跳 10/11 那要 jakarta 全量改）：⚠️ `conf\server.xml` 的 **`JasperListener` 在 Tomcat 8 已删除 → Tomcat 9 启动即 ClassNotFoundException，必须删**；`server.loader` 已移除；`bin\`/`conf\*` 整体替换；`-Djava.endorsed.dirs` 由 Tomcat 9 脚本自然去掉；WebSocket 1.0→1.1 + `textBufferSize=5242800` 语义变化需复测；5 个 JSP 需复测；Tomcat 9.0.x **EOS 2027-03-31** → 后续 9.1.x（至 2030-12-31）。
- **Jar（248 个，实测扫描 82 个含敏感引用）**：**必删** `servlet-api-3.0-alpha-1.jar`；**必加** `javax.annotation-api-1.3.2.jar`（源码 **8 处** `javax.annotation.PostConstruct/PreDestroy`）；**已就位** jaxb-api/core/impl + activation（dom4j/jgit/poi/spring 都引用 `javax/xml/bind`）；**10 个 jar 用 `sun.misc.Unsafe`**；`jdk/nashorn` 在 jar 中 0 处；Lucene 4.6 的 MMap unmap 需重点冒烟；`jna` 4.1.0 与 5.6.0、`slf4j-api` 1.7.5 与 1.7.32 **双份**。
- **源码**：Nashorn 面 = `NSJSBase` **8 个类** + `CV8RealTimeWorker`（与计划 §5 一致），`CJSContext` 被 24 个文件引用；`org.omg.`/`sun.reflect.`/`com.sun.image.codec` **0 处**；`com.sun.jndi.ldap`（LDAPUtil）与 `com.sun.net.httpserver`（agent 测试）**不用改**；⚠️ 实测 **32 处 `@Transactional`** → Spring 4.3.8 的 CGLIB 走 `ClassLoader.defineClass` 反射 → **必须 `--add-opens java.base/java.lang=ALL-UNNAMED`**。
- **降风险项**：原生 `x2t.exe` 走 `ProcessBuilder`（与 JVM 版本无关，源码对 `doctrenderer.dll` **0 引用**）；数据源是 c3p0 直连（**不是** Tomcat DBCP/JNDI → 避开 dbcp→dbcps2 包名坑）；`spring-instrument-tomcat` 的 `TomcatInstrumentableClassLoader` 未在任何配置启用。
- **构建**：字节码 target **保持 1.8**（Spring 4.3.8 内嵌 CGLIB/ASM 5 **读不懂 class file 61+**，提上去会让所有 CGLIB 代理炸）；`-d WebRoot\WEB-INF\classes` 不变量不变；war 打包流程不变但要重跑内容校验。

### 已完成：宿主权限面实测 + 推翻两条错误判断（2026-10-07）—— 计划 §6.4.7

- **起因**：核对 `createGraalContext()` 开的 `allowHostClassLookup` / `allowIO` 依据时，发现它们是**凭"nashorn-compat 提供 `Java.type`"的印象加的，从未验证**。
- **实测（探针 `test/tmp/HostAccessProbe/`，用 PoC 运行时）**：
  1. **`Java.type`/`Packages`/`importClass` 全项目 0 处**（整个 `WebRoot/web/static/office-editor` 递归 + office 源码 + test），脚本里也没有 JS 层 `load(` → 那两个开关**多余，可直接去掉**。
  2. **默认即 `HostAccess.EXPLICIT`**（`ALL` 是主动开的口子）；`EXPLICIT` 读未导出字段**静默返回 `undefined`**（不报错，隐蔽）。
  3. ❌ **"关掉类查找就能消掉风险 11"不成立**：不开类查找、只留 `ALL` 时 JS 仍可经 `h.getClass().getClassLoader()`/`getMethods()` 反射出去 → **真正的闸门是 `HostAccess`**。
- **已改**：计划 §5.2 约束 6/7、§6.4.7（新增小节）、风险 11、§9.1 证据；`JSEngineFactory` 注释；本卡。
- **裁定（用户 2026-10-07）**：本轮**只修正文档/注释里的错误结论**，**权限收敛留到阶段 B** 与"切运行时"一起做。

### 未做 / 待裁定

- **首轮调研曾"未执行任何代码改动"（纯文档）**；此后阶段 1 已落地代码改动（见上）。
- **未实测**：没有真正在 JDK 17 上跑过；GraalJS 在 17 档的实际性能/兼容性仍是**承诺**而非事实（阶段 1 用的是 JDK 8 档运行时）。
- 计划 §6.1.6 的裁定项：**D1/D2/D3 已裁定（2026-10-07）= 锁定 JDK 17 + GraalJS 23.0.x；运行时采用形态 A（Oracle GraalVM for JDK 17，GFTC），随产品分发并保留其 LICENSE/NOTICE**；**D4/D5 待裁定**（D4 Tomcat 9.0.x 还是 10.1；D5 是否先做 JDK8+GraalVM CE 21.2 的纯引擎 PoC）。

## 生效约束

- **提交记录**（本卡相关，按时间）：
  - office `dev/office`：`d8e86829`（计划补选型+影响清单）→ `1c6cd941`（步 1 PoC 结果）→ `5feb46c8`（三端 Nashorn 对照）→ `1dd452d9`（形态 C + 两阶段）→ **`c10d614e`（阶段 1 第一步：`JSEngineFactory` + `CJSContext` + 计划 §6.4.1）**
  - office/test `master`：`c708b57`（纯引擎 harness + 一键脚本）→ **`c95d3ca`（`TestCJSContextEngineMode` + 引擎模式运行脚本）**
  - 主仓库 `devInt`：`970aca4a5`、`01bf4d489`、`e0d596b28`、`385dfef57`、`6fef895d4` → **`a2329c04f`（本卡）**
- **最新提交**（2026-10-07）：
  - 三端真实转换：office `dev/office` **`f47f86be`**（计划 §6.4.6 三端结果）；office/test `master` **`43f4859`**（测试与脚本三端参数化）；主仓库 `devInt` **`a4097f941`**（本卡）。
  - 宿主权限面修正：office `dev/office` **`d8026227`**（计划 §6.4.7 + §5.2/风险 11 + `JSEngineFactory` 注释）；主仓库 `devInt` **`9bf578fe3`**（本卡）。
  - 阶段 1 第 2 步（更早）：office `dev/office` `45ba91be`→`217d107a`→`ff8ad1bc`→`b968d8bd`→`99560b9e`→`dc5c334b`；office/test `master` `3933e1a`→`fe859ef`→`9e40617`→`bcde713`；**`WebRoot/WEB-INF/lib`（独立仓库）`25d6f2c`**（4 个 GraalJS jar）；主仓库 `devInt` `cb07c73ce`（CLAUDE.md 补第 5 个仓库）等。
- **不要**在未获裁定前动阶段 2 的内容（§6.2 的 Tomcat/jar/JDK 改造项）。
- 阶段 1 期间**默认必须仍是 Nashorn**（`docsys.office.jsEngine` 不设即 nashorn）；任何提交都不得改变默认路径行为。
- 计划 §6.1 的选型结论**尚未经 spike 验证**，引用时不要当作已验证事实。

## 挂起（未获新裁定前不要开工）

- 前卡 `CURRENT_STATE_war打包.md` 已收尾，其残留项（如有需要）：
  - war 未做**真实部署验证**（dev 是 junction 部署，不是 war）；
  - 打包流程**未固化成脚本**（现是一次性命令）；
  - `core-fonts`（156.5 MB）是否排除**待裁定**。
- 其余挂起卡（系统日志显示用户名 / agent 工具技能规模化 / 前端静态资源缓存 / 短信验证码收不到 / 测试邮件发送失败 / freetype 移植）均**已裁定暂不处理**，见 `会话恢复协议.md` 或各自的卡。
