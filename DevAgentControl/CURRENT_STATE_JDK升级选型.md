# CURRENT_STATE_JDK升级选型（工作卡）

> 状态：**调研 + 文档已完成；D1~D4 已裁定（JDK 17 / Oracle GraalVM 形态 A / Tomcat 9.0.x），只剩 D5（spike 顺序）**（2026-10-07）
> 前置卡 `CURRENT_STATE_war打包.md` **已收尾**（导出可发布 `DocSystem.war` 并校验通过），已移入 `DevAgentControl/已完成/`。

## 已裁定（2026-10-07）

| 项 | 结论 |
|---|---|
| **D1 目标 JDK** | **JDK 17 + GraalJS 23.0.x**（用户确认） |
| **D2 运行时形态** | **形态 A：Oracle GraalVM for JDK 17（GFTC）**，接受"17 档持续引擎补丁由 GFTC 版本提供" |
| **D3 随产品分发** | **是**（替换 `tomcat\java\jre`）；义务：分发时**不得删改** Oracle GraalVM 的版权/商标声明 → 打包校验加一条 LICENSE/NOTICE 检查 |
| **D4 Tomcat 档位** | **Tomcat 9.0.x**（保持 `javax.servlet`，源码包名不动）；`10.1/11` 的 jakarta 全量迁移**另行立项** |
| **D5 spike 顺序** | **先做纯引擎 PoC（JDK 8 + GraalVM CE 21.2 跑 `sdk-all.js`），拿到兼容/性能数据再动 JDK**；PoC 结论只是预判，最终必须在 17 档重验一次（计划 §4.0） |

## 下一步

1. **步 1：纯引擎 PoC**（当前卡点）—— JDK 8 + GraalVM CE 21.2 的最小 harness 跑 `sdk-all.js`，出兼容性 + 三段计时数据。
2. **步 2**：Oracle GraalVM for JDK 17 + GraalJS 23.0.x 重跑同一套判据（计划 §4.4 以步 2 为准）+ JDK 17/Tomcat 9 的 war 冒烟。
3. 之后按计划 §6.3 走 Phase 1~4。

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

### 进行中：步 1 纯引擎 PoC（JDK 8 + GraalVM CE 21.2）

- ✅ 运行时可得性已确认（`graalvm-ce-java8-windows-amd64-21.2.0.zip`，250 MB，仍在 GitHub 上）。
- ⏳ **下载中**：`D:\Dev\GraalVM-PoC\graalvm-ce-java8-21.2.0.zip`（GitHub 链接慢，约 3 MB/min；24/238 MB 时记录）。下载完需解压并确认自带 `js` 组件。
- ❌ **已排除一条捷径**：Maven Central 手工组装 classpath（`org.graalvm.js:js:21.2.0` + `truffle-api:21.2.0` + `graal-sdk` + `regex` + `js-scriptengine`）在 **JDK 8u162** 上**引擎初始化即失败**：`BootstrapMethodError: IllegalAccessError: no such method: com.oracle.truffle.js.runtime.JSRealm.getFunctionPrototype()…`。已排除版本不一致/重复类/方法不存在（class 版本 52）。→ **步 1 必须用 GraalVM 自带运行时**（顺带也才能拿到 Graal JIT；stock JDK 8 只有解释模式，已实测出现该警告）。
- 工具已就位（在仓库外，不入 git）：`D:\Dev\GraalVM-PoC\`（`Harness.java` 已编译、`artifacts\` 已下好、`bin\`）。

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

- 本次改动**只有 2 个文件**：`src/com/DocSystem/websocket/office/docs/GraalJS替代Nashorn评估计划.md`（在 **office 仓库** `dev/office` 分支）+ 本工作卡（主仓库）→ **已提交**：
  - office 仓库 `dev/office`：**`d8e86829`**（评估计划，+286/-15）
  - 主仓库 `devInt`：**`970aca4a5`**（本卡新增 + war打包卡移入已完成为）
- **不要**在未获裁定前动任何代码（尤其 §6.2 清单里的源码/jar/Tomcat）。
- 计划 §6.1 的选型结论**尚未经 spike 验证**，引用时不要当作已验证事实。

## 挂起（未获新裁定前不要开工）

- 前卡 `CURRENT_STATE_war打包.md` 已收尾，其残留项（如有需要）：
  - war 未做**真实部署验证**（dev 是 junction 部署，不是 war）；
  - 打包流程**未固化成脚本**（现是一次性命令）；
  - `core-fonts`（156.5 MB）是否排除**待裁定**。
- 其余挂起卡（系统日志显示用户名 / agent 工具技能规模化 / 前端静态资源缓存 / 短信验证码收不到 / 测试邮件发送失败 / freetype 移植）均**已裁定暂不处理**，见 `会话恢复协议.md` 或各自的卡。
