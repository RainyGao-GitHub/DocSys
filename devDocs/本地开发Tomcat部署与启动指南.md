# 本地开发 Tomcat 部署与启动指南

> 用途：在本机启动一份 DocSystem（工作区 `D:/Dev/DocSys/WebRoot`）用于开发/验证（尤其前端页面改动）。
> 建立日期：2026-09-17。适用环境：Windows（无 `wmic` 的 Win11 同样适用）。

## 1. 目录与角色

| 角色 | 路径 | 说明 |
| --- | --- | --- |
| 开发 Tomcat（本文主角） | `C:\TomcatForDocSysDev\docsys\tomcat` | Tomcat 7.0.56，自带 JRE（`tomcat\Java\jre`），SQLite 库 `tomcat\DocSystem.db`（jdbc 配置为 `${catalina.home}/DocSystem.db`） |
| 工作区（被部署的 webapp） | `D:\Dev\DocSys\WebRoot` | 完整 webapp（`WEB-INF/classes` + `WEB-INF/lib` + 静态页面）；Java 编译输出即入此目录 |
| Release 实例（仅本机有） | `C:\docsysRel\docsys-Win-Release\docsys-win-2.02.86\docsys` | 独立安装的发布副本，同样监听 8100；**与 dev Tomcat 端口冲突，二者只能运行一个** |
| Eclipse WTP 实例（备选） | Eclipse 内部 Tomcat（端口 8100） | 复用同一套 Tomcat 安装（`catalina.home` 相同、共用 `tomcat\DocSystem.db`）；部署副本在 Eclipse 工作区 `...\tmp0\wtpwebapps\DocSystem`，其 `docSys.ini` 与外层同级；与 dev 实例端口互斥 |
| 外部配置目录 `docSys.ini` | dev：`...\tomcat\webapps\docSys.ini` | **重要**：`docSysConfig.properties`（含 `llmConfig`=AI 模型配置、`debugLogLevel` 等）、`docSysIniState`、`backup/` 都由应用读写此目录。位置由 webapp 路径推导，见第 2 节背景 |

访问入口（dev Tomcat）：`http://127.0.0.1:8100/DocSystem/`，测试账号 `Admin / Admin`。

## 2. 部署方法

> **路径推导背景（必读，2026-09-17 实测踩坑）**：应用会用「webapp 的实际路径」推导多个关键路径：
> 1. `Path.getDocSysWebParentPath()` 在 webapp 路径中查找 `/DocSystem` 再取其上一级，用于定位外部配置目录 `docSys.ini`（AI 模型 `llmConfig`、调试日志开关等都在那里）；
> 2. 默认日志文件 = webapp 路径上溯两级 + `logs/docsys.log`。
>
> **因此 webapp 的实际路径必须包含 `/DocSystem` 这段。** 若用 `conf\Catalina\localhost\DocSystem.xml` 直接把 `D:\Dev\DocSys\WebRoot` 挂为 `/DocSystem`（路径里没有 `/DocSystem` 字样），会出现两类问题：docSys.ini 退化为**相对进程工作目录**的 `docSys.ini/`（读不到 llmConfig → 前端提示"系统未设置AI模型"、AI 图标不显示）；日志目录推导为 `D:\Dev` 下（目录不存在时触发 Log 递归 → 全站 500，见 6-5）。**故推荐方式 A（Junction），不要用裸 Context 描述符挂载。**

### 方式 A（推荐）：Junction 目录联接挂载工作区

用目录联接（junction）让 `webapps\DocSystem` 指向工作区：Tomcat 按标准目录应用部署，所有路径推导回到标准位置；且工作区改动即时生效（静态文件刷新即生效、类文件重启生效）。

已创建（2026-09-17）：
- 联接：`C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem` → `D:\Dev\DocSys\WebRoot`
- 外部配置目录：`C:\TomcatForDocSysDev\docsys\tomcat\webapps\docSys.ini`（从 Eclipse WTP 环境复制，含 `llmConfig`）

创建 / 重建命令：

```powershell
# 1) 建联接（/J 目录联接，不需要管理员权限）
cmd /c 'mklink /J "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem" "D:\Dev\DocSys\WebRoot"'

# 2) 准备 docSys.ini（若缺失，从现有环境复制；WTP 的来源路径见第 1 节）
Copy-Item "D:\EclipseProject\EclipseWorkspaceForDocSys\.metadata\plugins\org.eclipse.wst.server.core\tmp0\wtpwebapps\docSys.ini" "C:\TomcatForDocSysDev\docsys\tomcat\webapps\docSys.ini" -Recurse
```

- 实测效果：日志落 `tomcat\logs\docsys.log`；配置读写 `webapps\docSys.ini\`；`/Repos/getAiModelList.do` 返回 `deepseek-v4-flash / v4-pro`，AI 图标正常显示。
- ⚠️ `conf\Catalina\localhost\DocSystem.xml` **不要存在**（与 webapps 目录同名会冲突/抢占）。
- `webapps` 下的 `docSys.ini` 目录会被 Tomcat 顺带当作空应用部署（无害）。
- 删除联接：`cmd /c rmdir "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem"`（只删联接，不动工作区内容）。

### 方式 B（传统复制）：整包复制到 webapps

```powershell
robocopy "D:\Dev\DocSys\WebRoot" "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem" /MIR /XD .git
```

- 与方式 A 布局相同（同样满足"路径含 `/DocSystem`"），`docSys.ini` 要求也相同；区别只是复制而非联接。
- 大改动 / 需要隔离环境时使用；复制耗时（400MB+）且每次改动都要重新同步。

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

- 脚本要素（`docsys_start.bat`，2026/7/12 版）：设置 `CATALINA_HOME/JAVA_HOME/JRE_HOME`（JRE = `tomcat\Java\jre`）→ 用 PowerShell 记录父进程 PID 到 `tmp\docsys.pid` → 若存在 `webapps\docSys.ini\jdbc.properties` 则覆盖部署目录的 jdbc 配置 → `catalina.bat run`。
- 旧版本（2025/12/7）用 `wmic` 记 PID，Win11 已移除 wmic 会中断脚本，已被上述新版替代。
- 就绪标志：输出出现 `Server startup in ... ms`。实测耗时：方式 A（目录部署）本次 31 秒；首次冷启动可到 1.5~3 分钟（取决于文件缓存/杀软）。扫描阶段控制台会刷 `Invalid byte tag ...` 告警，属正常（见 6-6）。

等价手动命令（PowerShell，便于定制参数）：

```powershell
Set-Location "C:\TomcatForDocSysDev\docsys"
$env:CATALINA_HOME = "C:\TomcatForDocSysDev\docsys\tomcat"
$env:JAVA_HOME    = "C:\TomcatForDocSysDev\docsys\tomcat\Java\jre"
$env:JRE_HOME     = $env:JAVA_HOME
& "$env:CATALINA_HOME\bin\catalina.bat" run
```

- `catalina.bat run` 是**前台阻塞**运行，控制台直接输出日志；关闭该控制台/终端即停。
- 后台方式（不占前台终端）：`Start-Process cmd -ArgumentList '/c','start','','docsys_start.bat' -WorkingDirectory 'C:\TomcatForDocSysDev\docsys'`。

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

## 4. 日志位置

| 日志 | 路径 |
| --- | --- |
| Tomcat 引擎日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\catalina.<date>.log`、`localhost.<date>.log` |
| 访问日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\localhost_access_log.<date>.txt` |
| 应用日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log`（方式 A/B 的 `webapps\DocSystem` 布局；由「webapp 上溯两级」推导，目录已存在）。⚠️ 裸 Context 挂载会让该路径跑到 `D:\Dev\logs`，目录不存在时应用启动即失败（见第 2 节背景 / 6-5） |

## 5. 典型使用场景

### 5.1 只改前端（html/js/css）

1. 确保 dev Tomcat 已启动（方式 A）。
2. 直接改 `D:\Dev\DocSys\WebRoot\web\...` 下的文件。
3. 浏览器刷新（必要时 Ctrl+F5 强制刷新）。**无需重启 Tomcat。**

### 5.2 改 Java

1. 编译到工作区 classes（务必带 `-d`）：

```powershell
& "C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac" -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes <源文件...>
```

2. 重启 dev Tomcat 使新类生效（目录部署/联接部署不会自动重载类）。

### 5.3 验证清单（打开页面）

- `http://127.0.0.1:8100/DocSystem/`（首页/登录）
- `http://127.0.0.1:8100/DocSystem/web/projects.html`（仓库列表，AI 图标入口）
- `http://127.0.0.1:8100/DocSystem/web/agent/index.html`（Agent 页面直链）

## 6. 已知注意事项

1. **端口互斥**：dev Tomcat、release 实例、Eclipse WTP 三者都想用 8100，同时只能跑一个。
2. **`docSys.ini` 是应用的外部配置目录**：位置 = webapp 路径中 `/DocSystem` 的上一级 + `docSys.ini/`（本机 dev：`tomcat\webapps\docSys.ini\`）。其中 `docSysConfig.properties` 的 `llmConfig` 决定 AI 模型列表（缺失则前端提示"系统未设置AI模型"、AI 图标隐藏）。`docsys_start.bat` 若发现其中的 `jdbc.properties` 会覆盖部署目录的 jdbc 配置（本机无此文件，直接用工作区配置：SQLite → `tomcat\DocSystem.db`）。
3. **不要用裸 Context 描述符挂载**（原因见第 2 节背景）；若使用描述符，还会触发一次额外行为：描述符文件 mtime 晚于部署起点时，Tomcat 启动后约 10 秒自动重部署一次（期间短暂 404），随后稳定。
4. **DB 是 dev 专用库**：内容与 release 实例/其他环境不同，属正常现象。
5. `validateJarFile(...servlet-api-3.0-alpha-1.jar) - jar not loaded` 是 Tomcat 拒绝 webapp 自带 servlet-api 的正常提示，无需处理。
6. `Log.appendContentToFile` 失败时在 catch 里调用 `Log.info(e)`，会再次写同一日志文件 → 失败成环即无限递归（StackOverflowError 刷屏）。**日志目录必须确保存在且可写**，否则整个应用起不来（控制器类初始化被污染）。方式 A/B 下日志目录已在标准位置，不受影响。
7. Tomcat 7 扫描 Java 9+ 依赖（jackson/sqlite-jdbc/lwjgl 等）的 `module-info.class` 会刷大量 `Invalid byte tag in constant pool: 19` 告警，属已知正常现象。
8. **query 参数中文解码与 Tomcat 版本强耦合（整包发布下成立）**：Tomcat 7.0.56 默认 `URIEncoding=ISO-8859-1`（Connector 未显式配置），所以 `new String(x.getBytes("ISO8859-1"),"UTF-8")` 这类补丁（`DocController`/`BaseFunction`/`AgentController` 等 ~30 处）是**必要且正确**的。已核对三处 `conf/server.xml` 内容一致（dev、Windows 包 `docsys-Win-Release`、Linux 包 `docsys-linux-2.02.86.tar.gz`）：**均未配置** `URIEncoding` / `useBodyEncodingForURI`。⚠️ 若把 `DocSystem-*.war` 单独部署进用户自备的 Tomcat 8.5+/9+（默认 UTF-8），或给 Connector 加 `URIEncoding="UTF-8"`，这些补丁会把中文打成 `????`（JDK8 实测：`"中".getBytes("ISO8859-1")` → `0x3F`，不可逆）。结论：保持整包同发布即为自洽；**新增功能不要用 query 传中文，一律走 POST body**（如 `POST /agent/stream`）。

## 7. 变更记录

- **2026-09-17**：创建本文档与 `DocSystem.xml` context（挂载工作区 WebRoot）验证 `projects.html` AI 图标 ArtDialog 弹层改动。验证中发现 500 根因=日志目录缺失（见 2-A / 6-5）；测试后已移除 contex
- **2026-09-17（三）**：按文档从头部署实测并修订文档。修正的问题：① 裸 Context 描述符挂载会导致 `docSys.ini` 退化为相对路径（读不到 `llmConfig` → "系统未设置AI模型"、AI 图标不显示）、日志路径跑偏；② 文档推荐方式改为 **Junction 挂载**（`webapps\DocSystem` → 工作区）+ 从 WTP 复制 `docSys.ini`，改后日志/配置回到标准位置，`getAiModelList` 返回 deepseek 模型，端到端验证通过（启动 31 秒）；③ 补充停止命令对 `javaw.exe`（Eclipse WTP）的覆盖、描述符自动重部署怪癖等。本次实测确认：`docsys_start.bat`（2026/7/12 版）可直接使用。t 映射并交回用户自行部署。启动脚本已更新为 2026/7/12 版（PowerShell 取 PID，替代 wmic）。
- **2026-09-17（四）**：Agent 消息发送由 `GET /agent/stream?command=...` 改为 `POST /agent/stream`（JSON body），并删除输入框 `maxlength=4000` 与右下角字数计数器；顺带查明 GET 通道的真实上限 = Tomcat 请求行 8KB（`encodeURIComponent` 后中文约 870 字即 400）。新增 6-8：query 中文解码与 Tomcat 版本/配置的耦合关系，以及"整包发布"前提的核对结果。
