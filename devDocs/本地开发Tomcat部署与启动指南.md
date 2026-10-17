# 本地开发 Tomcat 部署与启动指南

> 用途：在本机启动一份 DocSystem（工作区 `D:/Dev/DocSys/WebRoot`）用于开发/验证（尤其前端页面改动）。
> 建立日期：2026-09-17。适用环境：Windows（无 `wmic` 的 Win11 同样适用）。

## 1. 目录与角色

| 角色 | 路径 | 说明 |
| --- | --- | --- |
| 开发 Tomcat（本文主角） | `C:\TomcatForDocSysDev\docsys\tomcat` | Tomcat 7.0.56，自带 JRE（`tomcat\Java\jre`），SQLite 库 `tomcat\DocSystem.db`（jdbc 配置为 `${catalina.home}/DocSystem.db`） |
| 工作区（发布源） | `D:\Dev\DocSys\WebRoot` | 完整 webapp 源（`WEB-INF/classes` + `WEB-INF/lib` + 静态页面）；Java 编译输出即入此目录；经 `PublishDev.bat` 发布到运行空间，运行期生成物不写回这里 |
| 运行空间（部署副本） | `C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem` | 真实目录，由 `PublishDev.bat` 维护（见第 2 节） |
| Release 实例（仅本机有） | `C:\docsysRel\docsys-Win-Release\docsys-win-2.02.86\docsys` | 独立安装的发布副本，同样监听 8100；**与 dev Tomcat 端口冲突，二者只能运行一个** |
| Eclipse WTP 实例（备选） | Eclipse 内部 Tomcat（端口 8100） | 复用同一套 Tomcat 安装（`catalina.home` 相同、共用 `tomcat\DocSystem.db`）；部署副本在 Eclipse 工作区 `...\tmp0\wtpwebapps\DocSystem`，其 `docSys.ini` 与外层同级；与 dev 实例端口互斥 |
| 外部配置目录 `docSys.ini` | dev：`...\tomcat\webapps\docSys.ini` | **重要**：`docSysConfig.properties`（含 `llmConfig`=AI 模型配置、`debugLogLevel` 等）、`docSysIniState`、`backup/` 都由应用读写此目录。位置由 webapp 路径推导，见第 2 节背景 |

访问入口（dev Tomcat）：`http://127.0.0.1:8100/DocSystem/`，测试账号 `Admin / Admin`。

## 2. 部署方法（复制部署 + 增量 Publish）

部署模型与 Eclipse 一致：`webapps\DocSystem` 是**真实目录**（运行空间），由 `Docs\scripts\PublishDev.bat` 从工作区（`D:\Dev\DocSys\WebRoot`，发布源）复制并增量维护。运行期生成物只存在于运行空间，**工作区不被污染**；Eclipse 导出的 war 也保持干净内容、无需事后清理。

> **路径约束（2026-09-17 实测踩坑结论）**：部署副本必须位于 `webapps\DocSystem`。应用用 webapp 实际路径推导关键位置——① `docSys.ini` 外部配置目录（`Path.getDocSysWebParentPath()` 找 `/DocSystem` 取上一级；`llmConfig`、`debugLogLevel` 等都在那里）；② 默认日志 = webapp 上溯两级 + `logs/docsys.log`。若用 `conf\Catalina\localhost\DocSystem.xml` 把别的路径挂为 `/DocSystem`（路径里没有 `/DocSystem` 字样）：docSys.ini 退化为相对路径（读不到 llmConfig → "系统未设置AI模型"、AI 图标不显示）、日志目录推导失效（目录不存在时 Log 递归 → 全站 500，见 6-5）。**不要用裸 Context 描述符挂载。**

### 2.1 初始化（一次性）

```powershell
cmd /c "D:\Dev\DocSys\Docs\scripts\PublishDev.bat /init"
```

- 前置：dev Tomcat 已停；`webapps\DocSystem` 为不存在 / 空目录 / 已有旧部署副本（可收编，增量补齐、不删除任何文件）。
- 全量复制（约 2-3 分钟，1.5 GB / 3.99 万文件；排除集与日常 publish 完全一致，**不含任何运行期产物**——工作区本就不该有它们，全新的部署副本即正确形态），完成后写 `DEPLOYED-BY-PUBLISH.txt` 标记（日常 publish 的安全标记）。
- 字体库在**首次使用 Office 编辑器时自动重建**（约 10-30 分钟；或管理后台命令 "System - Reset Font Library" 手动触发），属预期行为。
- `docSys.ini` 外部配置目录（`webapps\docSys.ini\`，含 llmConfig）与部署副本同级，初始化不影响它。
- 旧 junction 联接（2026-10-17 之前的部署方式）需先手工移除：`cmd /c rmdir "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem"`（只删联接、不动工作区），再跑 `/init`。

### 2.2 日常发布

| 改动 | 命令 |
| --- | --- |
| 前端（html/js/css） | `Docs\scripts\PublishDev.bat`（秒级），浏览器 Ctrl+F5，无需重启 |
| Java（Eclipse build 后） | `Docs\scripts\PublishDev.bat /r`（发布 + 无窗口重启 dev Tomcat） |

- 语义：`robocopy /MIR /XO`——只拷有变化的文件；工作区删掉的文件会从运行空间删除（避免旧 class 残留）；**运行空间里较新的文件不被覆盖**（应用保存设置时改写的 `WEB-INF\classes\docSysConfig.properties` 因此受保护；工作区模板改了要生效用 `/force`）。参考耗时：全量扫描约 5 秒，日常增量秒级。
- 运行期产物（`office-editor\fonts\`、两个 `AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`、`sdk-all.cache`、`tmp\`、`uploads\`）**永不触碰**，只存在于运行空间。
- 开发资料不进运行空间：`WEB-INF\classes\...\office\{docs,devDocs,test}`、`*.java`、`.git`/`.gitignore`。
- 辅助：`/dry` 只列不动；`/audit` 列运行空间里"排除清单之外"的未知文件（应用将来新增运行期写入点时，靠它发现并补清单）；`/p` 双击运行时结束暂停。
- 守卫：目标是联接/符号链接时拒绝执行（`/MIR` 会穿透联接写回源码）；运行空间缺 `DEPLOYED-BY-PUBLISH.txt` 标记时拒绝 publish（防止误镜像到别的目录）。
- 注意：`WEB-INF\lib` 下的 jar 在 Tomcat 运行时可能被锁，改了 lib 先停服再 publish；改 Java 仍需重启（`/r` 已封装）。

## 3. 启动 Tomcat

### 3.1 前置：先把 8100 端口腾出来

```powershell
# 查看占用者
Get-NetTCPConnection -State Listen -LocalPort 8100 | Select-Object LocalPort,OwningProcess

# 常见占用者：
#   ① release 实例（java.exe，路径在 C:\docsysRel\...）
#   ② Eclipse WTP 实例（javaw.exe，命令行为 -Dcatalina.home=C:\TomcatForDocSysDev\docsys\tomcat，
#      catalina.base 指向 Eclipse 工作区 .metadata\...\tmp0）
# 停止方式见 3.3 的通用命令。
```

> release 实例停掉后如需恢复：运行 `C:\docsysRel\docsys-Win-Release\docsys-win-2.02.86\docsys\docsys_start.bat`（或 `start.bat` 带监控）。
> Eclipse WTP 实例如需恢复：在 Eclipse 中重新启动该 Server（或 Publish+Start）。

### 3.2 启动

**推荐**：直接运行 `C:\TomcatForDocSysDev\docsys\docsys_start.bat`（前台阻塞，可看到全部启动日志）。

#### 三个启动脚本怎么选（2026-09-30 起）

| 场景 | 命令 | 窗口行为 |
| --- | --- | --- |
| 要看日志 / 临时启动 | `docsys_start.bat` | 就在当前控制台（**VS Code 终端里直接跑也行**）；关闭终端 = 停服 |
| 无窗口后台启动 | `docsys_start_hidden.bat` | **没有任何窗口**；控制台输出写入 `tomcat\logs\docsys_console.log` |
| 改了 Java 后重启 | `docsys_restart.bat` | **默认无窗口**（内部调上面的 hidden 脚本），脚本立即返回，终端继续可用 |
| 重启且要盯着日志 | `docsys_restart.bat /f` | 在当前控制台前台运行（同 `docsys_start.bat`） |

从 VS Code 终端调用（PowerShell）：

```powershell
cmd /c "C:\TomcatForDocSysDev\docsys\docsys_restart.bat"      # 重启：无窗口，终端立刻可用
cmd /c "C:\TomcatForDocSysDev\docsys\docsys_restart.bat" /f   # 重启：日志留在本终端
cmd /c "C:\TomcatForDocSysDev\docsys\docsys_stop.bat" /q       # 停服：不等待“按任意键”
```

- ⚠️ 旧版 `docsys_restart.bat` 用 `start docsys_start.bat` 新开一个控制台 —— 那个窗口**每次都会残留**（Tomcat 退出也不关）。改成 `Start-Process -WindowStyle Hidden` + 一个专门的 `docsys_start_hidden.bat` 后实测「可见 cmd 窗口数 = 0」。
- 隐藏启动的进程树：`cmd.exe（docsys_start_hidden.bat，无可见窗口）` → `java.exe`；停服照旧用 `docsys_stop.bat`（按 JRE 路径匹配，与前台实例同一规则）。
- 三个脚本在仓库里都以 `WebRoot/web/sales/docsysStartScripts/Windows/` 为**源头**，dev 目录 `C:\TomcatForDocSysDev\docsys\` 是它的镜像：改完请把 4 个文件（含新增的 `docsys_start_hidden.bat`）一起拷过去。

- 脚本要素（`docsys_start.bat`，2026/7/12 版）：设置 `CATALINA_HOME/JAVA_HOME/JRE_HOME`（JRE = `tomcat\Java\jre`）→ 用 PowerShell 记录父进程 PID 到 `tmp\docsys.pid` → 若存在 `webapps\docSys.ini\jdbc.properties` 则覆盖部署目录的 jdbc 配置 → `catalina.bat run`。
- 旧版本（2025/12/7）用 `wmic` 记 PID，Win11 已移除 wmic 会中断脚本，已被上述新版替代。
- 就绪标志：输出出现 `Server startup in ... ms`。实测耗时：目录部署本次 31 秒；首次冷启动可到 1.5~3 分钟（取决于文件缓存/杀软）。扫描阶段控制台会刷 `Invalid byte tag ...` 告警，属正常（见 6-6）。

等价手动命令（PowerShell，便于定制参数）：

```powershell
Set-Location "C:\TomcatForDocSysDev\docsys"
$env:CATALINA_HOME = "C:\TomcatForDocSysDev\docsys\tomcat"
$env:JAVA_HOME    = "C:\TomcatForDocSysDev\docsys\tomcat\Java\jre"
$env:JRE_HOME     = $env:JAVA_HOME
& "$env:CATALINA_HOME\bin\catalina.bat" run
```

- `catalina.bat run` 是**前台阻塞**运行，控制台直接输出日志；关闭该控制台/终端即停。
- 后台方式（不占前台终端、无窗口）：`cmd /c "C:\TomcatForDocSysDev\docsys\docsys_start_hidden.bat"`（或 `docsys_restart.bat`，它默认就走这条路）。控制台输出会追加到 `tomcat\logs\docsys_console.log`。

### 3.3 停止

- 前台运行：在对应终端 `Ctrl+C`。
- 通用停止命令（同时覆盖 `docsys_start.bat` 实例和 Eclipse WTP 实例）：

```powershell
# java.exe  : docsys_start.bat 启动的实例（位于 tomcat\Java\jre）
# javaw.exe : Eclipse WTP 启动的实例（命令行含 -Dcatalina.home=C:\TomcatForDocSysDev\docsys\tomcat）
Get-CimInstance Win32_Process -Filter "Name='java.exe' OR Name='javaw.exe'" |
  Where-Object { $_.ExecutablePath -like '*TomcatForDocSysDev*' -or $_.CommandLine -like '*catalina.home=C:\TomcatForDocSysDev*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

- ⚠️ 只按 `java.exe` + 路径过滤会**漏掉 Eclipse WTP 实例**（它是 `javaw.exe`、可执行文件在系统 JRE 目录），必须叠加命令行匹配。
- 脚本形式：`cmd /c "C:\TomcatForDocSysDev\docsys\docsys_stop.bat" /q`（`/q` = 不问“按任意键”，适合脚本/终端；不带参数会 pause 等按键）。
- 隐藏启动的实例没有窗口可关，**只能**用 `docsys_stop.bat` / 上面的命令停；前台实例直接 `Ctrl+C` 或关终端。

## 4. 日志位置

| 日志 | 路径 |
| --- | --- |
| Tomcat 引擎日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\catalina.<date>.log`、`localhost.<date>.log` |
| **控制台输出**（隐藏启动时唯一去处） | `C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys_console.log` —— log4j/slf4j 的 console 输出（Spring 映射表、`docSysInit`、Agent 初始化等）**只走控制台、不写 catalina 日志**，所以隐藏启动必须重定向到这里；排查完可直接删（下次启动会重新创建） |
| 访问日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\localhost_access_log.<date>.txt` |
| 应用日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log`（`webapps\DocSystem` 标准布局；由「webapp 上溯两级」推导，目录已存在）。⚠️ 裸 Context 挂载会让该路径跑到 `D:\Dev\logs`，目录不存在时应用启动即失败（见第 2 节背景 / 6-5） |

## 5. 典型使用场景

### 5.1 只改前端（html/js/css）

1. 确保 dev Tomcat 已启动。
2. 直接改 `D:\Dev\DocSys\WebRoot\web\...` 下的文件。
3. 运行 `Docs\scripts\PublishDev.bat`（秒级），浏览器刷新（必要时 Ctrl+F5 强制刷新）。**无需重启 Tomcat。**
   （复制部署：改动需 publish 后生效。）

### 5.2 改 Java

1. 编译到工作区 classes（务必带 `-d`）：

```powershell
& "C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac" -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes <源文件...>
```

2. 运行 `Docs\scripts\PublishDev.bat /r`（发布 + 重启 dev Tomcat，使新类生效）。

### 5.3 验证清单（打开页面）

- `http://127.0.0.1:8100/DocSystem/`（首页/登录）
- `http://127.0.0.1:8100/DocSystem/web/projects.html`（仓库列表，AI 图标入口）
- `http://127.0.0.1:8100/DocSystem/web/agent/index.html`（Agent 页面直链）

## 6. 已知注意事项

1. **端口互斥**：dev Tomcat、release 实例、Eclipse WTP 三者都想用 8100，同时只能跑一个。
2. **`docSys.ini` 是应用的外部配置目录**：位置 = webapp 路径中 `/DocSystem` 的上一级 + `docSys.ini/`（本机 dev：`tomcat\webapps\docSys.ini\`）。其中 `docSysConfig.properties` 的 `llmConfig` 决定 AI 模型列表（缺失则前端提示"系统未设置AI模型"、AI 图标隐藏）。`docsys_start.bat` 若发现其中的 `jdbc.properties` 会覆盖部署目录的 jdbc 配置（本机无此文件，直接用工作区配置：SQLite → `tomcat\DocSystem.db`）。
3. **不要用裸 Context 描述符挂载**（原因见第 2 节背景）；若使用描述符，还会触发一次额外行为：描述符文件 mtime 晚于部署起点时，Tomcat 启动后约 10 秒自动重部署一次（期间短暂 404），随后稳定。
4. **DB 是 dev 专用库**：内容与 release 实例/其他环境不同，属正常现象。
4.1 ⚠️ **启动慢 ≠ 卡死（2026-09-30 实测，白等/白重启约 40 分钟）**：`webapps/DocSystem/WEB-INF/lib` 有 **248 个 jar / 424MB**，Tomcat 7 启动时逐个 jar 做 `ContextConfig.processAnnotations`（BCEL 解析，无缓存）。实测同一份代码 **33 秒 ~ 10 分钟** 不等（取决于磁盘缓存/杀软/并发负载）。两个容易误判的现象：
   - 日志长时间不增长：只有含 Java 9 `module-info.class` 的 jar 才输出 `Unable to process Jar entry ... Invalid byte tag`，其余 jar 扫完**不留任何日志**；
   - JVM 看起来“很闲”：`CPU 只有几十秒`、`工作集已 450MB`，也很正常。

   正确判据：① 本次启动是否出现 `Server startup in ... ms`（`catalina.<date>.log` 是当天**累加**的，`Select-String -Last` 会读到上一次实例的行，看之前先记下本次启动时刻）；② 端口是否 `Listen`。部署未完成时 TCP 连接会进 backlog → 客户端表现为 `Read timed out` / `curl HTTP=000`，**不代表应用坏了**。③ 不要因此反复 kill 重启 —— 每次重启都要重扫 248 个 jar，越急越慢。
4.2 ⚠️ **就绪探测用 `127.0.0.1` 而不是 `localhost`**：Win11 上 `localhost` 可能先解析到 `::1`，而 Tomcat 有时只绑 IPv6 `::`（或反之），会出现“端口在 Listen 但连不上”的假象。
4.3 ⚠️ **重启后“端口通了”不等于 `docSysInit` 跑过**：`StartupListener` 挂在子容器 `ContextRefreshedEvent` 上，首次访问任一 `.do` 端点时才做重活；只 curl 静态页（`/DocSystem/`）拿到的 200/302 不能当作“就绪”。
4.4 ⚠️ **管理接口 E2E**：系统已初始化时 `Manage/getDocSysInitConfig.do` 返回的 `docSysInitAuthCode` 是**空串**，此时**不要传** `authCode` 参数（传空串会走“校验授权码”分支 → `无效授权码: AuthCode []`），应依赖 session 超管（与后台页面一致）；失败文案在 `ReturnAjax` 的 **`msgInfo`** 字段（不是 `errorInfo`）。
5. `validateJarFile(...servlet-api-3.0-alpha-1.jar) - jar not loaded` 是 Tomcat 拒绝 webapp 自带 servlet-api 的正常提示，无需处理。
6. `Log.appendContentToFile` 失败时在 catch 里调用 `Log.info(e)`，会再次写同一日志文件 → 失败成环即无限递归（StackOverflowError 刷屏）。**日志目录必须确保存在且可写**，否则整个应用起不来（控制器类初始化被污染）。`webapps\DocSystem` 标准布局下日志目录已在标准位置，不受影响。
7. Tomcat 7 扫描 Java 9+ 依赖（jackson/sqlite-jdbc/lwjgl 等）的 `module-info.class` 会刷大量 `Invalid byte tag in constant pool: 19` 告警，属已知正常现象。
8. **query 参数中文解码与 Tomcat 版本强耦合（整包发布下成立）**：Tomcat 7.0.56 默认 `URIEncoding=ISO-8859-1`（Connector 未显式配置），所以 `new String(x.getBytes("ISO8859-1"),"UTF-8")` 这类补丁（`DocController`/`BaseFunction`/`AgentController` 等 ~30 处）是**必要且正确**的。已核对三处 `conf/server.xml` 内容一致（dev、Windows 包 `docsys-Win-Release`、Linux 包 `docsys-linux-2.02.86.tar.gz`）：**均未配置** `URIEncoding` / `useBodyEncodingForURI`。⚠️ 若把 `DocSystem-*.war` 单独部署进用户自备的 Tomcat 8.5+/9+（默认 UTF-8），或给 Connector 加 `URIEncoding="UTF-8"`，这些补丁会把中文打成 `????`（JDK8 实测：`"中".getBytes("ISO8859-1")` → `0x3F`，不可逆）。结论：保持整包同发布即为自洽；**新增功能不要用 query 传中文，一律走 POST body**（如 `POST /agent/stream`）。
