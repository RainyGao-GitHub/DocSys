# 本地开发 Tomcat 部署与启动指南

> 用途：在本机启动一份 DocSystem（工作区 `D:/Dev/DocSys/WebRoot`）用于开发/验证（尤其前端页面改动）。
> 建立日期：2026-09-17。适用环境：Windows（无 `wmic` 的 Win11 同样适用）。

## 1. 目录与角色

| 角色 | 路径 | 说明 |
| --- | --- | --- |
| 开发 Tomcat（本文主角） | `C:\TomcatForDocSysDev\docsys\tomcat` | Tomcat 7.0.56，自带 JRE（`tomcat\Java\jre`），SQLite 库 `tomcat\DocSystem.db`（jdbc 配置为 `${catalina.home}/DocSystem.db`） |
| 工作区（被部署的 webapp） | `D:\Dev\DocSys\WebRoot` | 完整 webapp（`WEB-INF/classes` + `WEB-INF/lib` + 静态页面）；Java 编译输出即入此目录 |
| Release 实例（仅本机有） | `C:\docsysRel\docsys-Win-Release\docsys-win-2.02.86\docsys` | 独立安装的发布副本，同样监听 8100；**与 dev Tomcat 端口冲突，二者只能运行一个** |
| Eclipse WTP 实例（备选） | Eclipse 内部 Tomcat（端口 8100） | 与本文无关；用 Eclipse 时不需要手动启动 |

访问入口（dev Tomcat）：`http://127.0.0.1:8100/DocSystem/`，测试账号 `Admin / Admin`。

## 2. 部署方法

### 方式 A（推荐，本机已配置）：Context 直接挂载工作区

已创建文件：

```
C:\TomcatForDocSysDev\docsys\tomcat\conf\Catalina\localhost\DocSystem.xml
```

内容：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context docBase="D:/Dev/DocSys/WebRoot" reloadable="false" />
```

- 优点：不复制 400MB+ 的 webapp；静态文件（html/js/css）改完刷新浏览器即生效；`javac -d WebRoot/WEB-INF/classes` 编译的类只需重启 Tomcat 生效。
- 适用：日常开发、前端验证。
- ⚠️ **前提（重要）**：先创建 `D:\Dev\logs` 目录！应用的默认日志路径 = webapp 上溯两级 + `logs/docsys.log`（`BaseFunction` 静态初始化 `Path.getParentPath(docSysWebPath, 2) + "logs/docsys.log"`）。挂载工作区时即 `D:\Dev\logs\docsys.log`，该目录不存在会导致：首次写日志失败 → `Log.appendContentToFile` catch 调 `Log.info(e)` 写同一文件再失败 → 无限递归 → StackOverflowError → `BaseController`/`DocController` 类初始化失败 → Spring MVC 上下文初始化失败 → **所有请求 500**（2026-09-17 实测踩坑）。
  传统 `webapps\DocSystem` 布局下该路径为 `<tomcat>\logs\docsys.log`（目录已存在，无此问题）。

### 方式 B（传统复制）：整包复制到 webapps

```powershell
robocopy "D:\Dev\DocSys\WebRoot" "C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem" /MIR /XD .git
```

- 注意：`webapps` 里一旦存在 `DocSystem`，方式 A 的 context 与之同名会冲突（二选一）。
- 大改动/需要隔离环境时使用；复制耗时且每次改动都要重新同步。

## 3. 启动 Tomcat

### 3.1 前置：先把 8100 端口腾出来

```powershell
# 查看占用者
Get-NetTCPConnection -State Listen -LocalPort 8100 | Select-Object LocalPort,OwningProcess

# 若是 release 实例（示例 PID），停止它：
Stop-Process -Id <PID> -Force
```

> release 实例停掉后如需恢复：运行 `C:\docsysRel\docsys-Win-Release\docsys-win-2.02.86\docsys\docsys_start.bat`（或 `start.bat` 带监控）。

### 3.2 启动

**推荐**：直接运行 `C:\TomcatForDocSysDev\docsys\docsys_start.bat`（前台阻塞，可看到全部启动日志）。

- 脚本要素（`docsys_start.bat`，2026/7/12 版）：设置 `CATALINA_HOME/JAVA_HOME/JRE_HOME`（JRE = `tomcat\Java\jre`）→ 用 PowerShell 记录父进程 PID 到 `tmp\docsys.pid` → 若存在 `webapps\docSys.ini\jdbc.properties` 则覆盖部署目录的 jdbc 配置 → `catalina.bat run`。
- 旧版本（2025/12/7）用 `wmic` 记 PID，Win11 已移除 wmic 会中断脚本，已被上述新版替代。
- 就绪标志：输出出现 `Server startup in ... ms`（首次部署扫描 jar 较慢，实测约 90 秒；后续启动更快）。

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
- 或按 Java 可执行文件路径杀进程（等价 `docsys_stop.bat`）：

```powershell
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
  Where-Object { $_.ExecutablePath -like '*TomcatForDocSysDev*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## 4. 日志位置

| 日志 | 路径 |
| --- | --- |
| Tomcat 引擎日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\catalina.<date>.log`、`localhost.<date>.log` |
| 访问日志 | `C:\TomcatForDocSysDev\docsys\tomcat\logs\localhost_access_log.<date>.txt` |
| 应用日志 | `Log` 类默认写「webapp 上溯两级 + `logs/docsys.log`」：挂载工作区时 = `D:\Dev\logs\docsys.log`；`webapps\DocSystem` 布局时 = `C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log`。⚠️ 该目录必须先存在，否则应用启动即失败（见 2-A / 6-5） |

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

2. 重启 dev Tomcat（context 设的 `reloadable="false"`，改动类不自动重载）。

### 5.3 验证清单（打开页面）

- `http://127.0.0.1:8100/DocSystem/`（首页/登录）
- `http://127.0.0.1:8100/DocSystem/web/projects.html`（仓库列表，AI 图标入口）
- `http://127.0.0.1:8100/DocSystem/web/agent/index.html`（Agent 页面直链）

## 6. 已知注意事项

1. **端口互斥**：dev Tomcat、release 实例、Eclipse WTP 三者都想用 8100，同时只能跑一个。
2. **`docSys.ini` 无关**：`docsys_start.bat` 会把 `webapps\docSys.ini\jdbc.properties` 覆盖到部署目录；本机 dev 环境 `docSys.ini` 不存在，跳过即可，直接用工作区的 `jdbc.properties`（SQLite → `tomcat\DocSystem.db`）。
3. **DB 是 dev 专用库**：内容与 release 实例/其他环境不同，属正常现象。
4. `validateJarFile(...servlet-api-3.0-alpha-1.jar) - jar not loaded` 是 Tomcat 拒绝 webapp 自带 servlet-api 的正常提示，无需处理。
5. `Log.appendContentToFile` 失败时在 catch 里调用 `Log.info(e)`，会再次写同一日志文件 → 失败成环即无限递归（StackOverflowError 刷屏）。**日志目录必须确保存在且可写**，否则整个应用起不来（控制器类初始化被污染）。
6. Tomcat 7 扫描 Java 9+ 依赖（jackson/sqlite-jdbc/lwjgl 等）的 `module-info.class` 会刷大量 `Invalid byte tag in constant pool: 19` 告警，属已知正常现象。

## 7. 变更记录

- **2026-09-17**：创建本文档与 `DocSystem.xml` context（挂载工作区 WebRoot）验证 `projects.html` AI 图标 ArtDialog 弹层改动。验证中发现 500 根因=日志目录缺失（见 2-A / 6-5）；测试后已移除 context 映射并交回用户自行部署。启动脚本已更新为 2026/7/12 版（PowerShell 取 PID，替代 wmic）。
- **2026-09-17（二）**：用户部署完成后，`projects.html` AI 图标 → ArtDialog 弹层 → Agent 页面（iframe）端到端验证通过：弹层打开/重复点击聚焦（不重复创建）/关闭/重开均正常，Agent 页在 iframe 内完整加载（登录态共享）。
