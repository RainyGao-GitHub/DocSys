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

**仍未做（通往 golden 对比只剩这些）**：

1. `HostAccess.ALL` 过宽，上线前应收敛为白名单（计划风险 11）。
2. 每个 `new CJSContext()` 都新建 `Context` → 拿不到"共享 Engine 复用编译产物"的收益
   （§4.5 冷 3.2s vs 热 1.4s），后续应共享 `Engine` + 缓存 `Source`。
3. **还没跑真实转换**：`asc_nativeOpenFile → applyChanges2 → getFileData` 三步与 golden 逐字节对比尚未开始；
   建议先用 `-Ddocsys.doctrenderer.dumpScriptPath` 取"真脚本"，再按计划 §4.2 的 fixture 矩阵跑三端。

之后才是三端 golden 逐字节对比 → 达标即**退役 JMergeEngine** → 阶段 2（JDK 17 + Tomcat 9）排期。

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
- **新增（计划 §5.2，10 条官方约束）**：`js.nashorn-compat` 需 `allowExperimentalOptions`；开 compat 后默认 ES5；**不提供 `ScriptObjectMirror`**（改 `Map`/`Value`）；compat 专属能力清单（`Java.isScriptObject`、`new Interface(fn)`、`JavaImporter`、`JSAdapter`、`load("nashorn:...")`、`exit/quit`）；Nashorn 语法扩展默认开；`Java.type`/`Packages` 等默认可用于是 sdk-all.js 不用改；**secure by default** 要显式放开 `allowHostAccess`/`allowHostClassLookup`/`allowIO`；**不允许有损转换**（数值不匹配抛 `TypeError`）；ScriptEngine 名是 `graal.js` 不是 `nashorn`（**必须钉死构建，防止运行时加载到真 Nashorn**）；compat 自动开选项**只对 legacy ScriptEngine、对 `Context` 不会**。
- **新增风险 11/12**：安全面扩大（与现网 Nashorn 行为不同，要逐条对比，优先 `HostAccess.EXPLICIT`+白名单）；有损转换（桥里 `int/long/byte` 互操作点要逐个核对 + `targetTypeMapping`）。
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

### 未做 / 待裁定

- **未执行任何代码改动**：本次**纯文档**。
- **未实测**：没有真正在 JDK 17 上跑过；§4 spike 仍未执行；GraalJS 在 17 档的实际性能/兼容性仍是**承诺**而非事实。
- 计划 §6.1.6 的裁定项：**D1/D2/D3 已裁定（2026-10-07）= 锁定 JDK 17 + GraalJS 23.0.x；运行时采用形态 A（Oracle GraalVM for JDK 17，GFTC），随产品分发并保留其 LICENSE/NOTICE**；**D4/D5 待裁定**（D4 Tomcat 9.0.x 还是 10.1；D5 是否先做 JDK8+GraalVM CE 21.2 的纯引擎 PoC）。

## 生效约束

- **提交记录**（本卡相关，按时间）：
  - office `dev/office`：`d8e86829`（计划补选型+影响清单）→ `1c6cd941`（步 1 PoC 结果）→ `5feb46c8`（三端 Nashorn 对照）→ `1dd452d9`（形态 C + 两阶段）→ **`c10d614e`（阶段 1 第一步：`JSEngineFactory` + `CJSContext` + 计划 §6.4.1）**
  - office/test `master`：`c708b57`（纯引擎 harness + 一键脚本）→ **`c95d3ca`（`TestCJSContextEngineMode` + 引擎模式运行脚本）**
  - 主仓库 `devInt`：`970aca4a5`、`01bf4d489`、`e0d596b28`、`385dfef57`、`6fef895d4` → **`a2329c04f`（本卡）**
- **最新提交**（2026-10-07，阶段 1 第 2 步）：
  - office `dev/office`：`45ba91be`（§6.4.2 探针结论）→ **`217d107a`**（更正"组装路线不可用"）→ **`ff8ad1bc`**（`JSValueAccess` + 6 文件改造 + §6.4.3）
  - office/test `master`：`3933e1a`（两个探针）→ **`fe859ef`**（冒烟断言更新）
  - **`WebRoot/WEB-INF/lib`（独立仓库）**：**`25d6f2c`**（4 个 GraalJS jar）
  - 主仓库 `devInt`：`e562036e8` → `7ec9690c3` → **`cb07c73ce`**（CLAUDE.md 补第 5 个仓库）→ **`8eedbd4ed`**（本卡）
- **不要**在未获裁定前动阶段 2 的内容（§6.2 的 Tomcat/jar/JDK 改造项）。
- 阶段 1 期间**默认必须仍是 Nashorn**（`docsys.office.jsEngine` 不设即 nashorn）；任何提交都不得改变默认路径行为。
- 计划 §6.1 的选型结论**尚未经 spike 验证**，引用时不要当作已验证事实。

## 挂起（未获新裁定前不要开工）

- 前卡 `CURRENT_STATE_war打包.md` 已收尾，其残留项（如有需要）：
  - war 未做**真实部署验证**（dev 是 junction 部署，不是 war）；
  - 打包流程**未固化成脚本**（现是一次性命令）；
  - `core-fonts`（156.5 MB）是否排除**待裁定**。
- 其余挂起卡（系统日志显示用户名 / agent 工具技能规模化 / 前端静态资源缓存 / 短信验证码收不到 / 测试邮件发送失败 / freetype 移植）均**已裁定暂不处理**，见 `会话恢复协议.md` 或各自的卡。
