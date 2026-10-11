# CURRENT_STATE_文件分享IP修复（工作卡）

建立于 2026-10-11。**状态：已收尾（修复已实施 + 单测 + E2E 验证通过 + 用户已提交：主仓库 `4e153082b`、websocket 仓库 `7edf2810`）。**

> 本卡记录「文件分享链接没用到正确 IP」缺陷的根因、修复与验证，供后续查询。

## 任务

客户反馈：**「创建我的分享」生成的分享链接没有用服务器 IP（Mac 系统）**。
表现为链接里是本机地址（`localhost`/`127.0.0.1`）或一个不可达的虚拟网卡地址，导致别人打不开分享。

## 根因（已取证）

**回归缺陷，由提交 `f47842390`「【优化】麒麟系统未插网线无法启动」引入。**

- 该提交把 `IPUtil.getIpAddress()` 从 `Inet4Address.getLocalHost()` 改成**枚举网卡**（因为 `getLocalHost()` 在无网络/DNS 不可达时会阻塞启动）。
- 新实现 `getPhysicalInterface()` 只是「按枚举顺序取第一个 **Up + 有MAC** 的网卡」，**既不过滤虚拟网卡、也不要求它有 IPv4**；`getIpAddress()` 只在这**一个**网卡上找 IPv4。
- **Mac**：`awdl0`/`llw0`/`anpi*` 等虚拟网卡 Up 且有 MAC，但只有 IPv6 link-local、**没有 IPv4** → 命中即返回 **null** → 分享链接保持 `localhost`（= 客户说的「没有用 IP 地址」）。
- **Windows**：同样会选错——本机实测 Java 枚举第一个 Up+MAC 网卡 = VirtualBox Host-Only → 返回 `192.168.56.1`（外部不可达），真实局域网 IP 是 `192.168.1.9`。（探针 `IpProbe`/`IpProbe2`，旧逻辑 `getLocalHost()` = `192.168.1.9`。）
- 之所以以前「看起来是好的」：只有装了 VirtualBox/Hyper-V/WSL 等虚拟网卡、且它们排在真实网卡前面的机器才暴露。
- 另一处放大问题：链接生成只在 `host == "localhost"` 时替换，客户用 `127.0.0.1` 访问时根本不替换。

## 修改的文件

主仓库 `D:\Dev\DocSys`：
- `src/com/DocSystem/common/IPUtil.java` —— 重写取址：
  - `getIpAddress()`：遍历**全部**网卡，「物理网卡优先 → UP 优先」返回第一个**可用 IPv4**（跳过回环、`169.254.*`）；**仍只返回 IPv4**（它同时用于备份目录命名，IPv6 的冒号在 Windows 非法）。
  - 新增 `getIpAddressForLink()`：IPv4 优先，无 IPv4 时回退 IPv6（跳过 `fe80::`）——**只给链接用**。
  - 新增 `formatHostForUrl()`（IPv6 加方括号）、`isLocalHost()`（`localhost`/`127.x`/`::1`/`0.0.0.0`）。
  - `getMacAddress()` **未动**（避免改变机器 MAC 指纹）。
- `src/com/DocSystem/common/BaseFunction.java` —— `getUrlInfoFromUrl` 支持 `[ipv6]:port` 解析（仅 `[` 开头分支；LDAP 等 URL 不受影响）。
- `src/com/DocSystem/controller/DocController.java` —— `getDocShareList.do` 的 `serverIp` 改用 `getIpAddressForLink()`。
- `WebRoot/web/js/DocSys.js` —— `getDocShareLink` 放宽本机判断 + IPv6 方括号；新增 `_isLocalHostName`/`_formatHostForUrl`。

websocket 独立仓库 `src/com/DocSystem/websocket`：
- `BussinessController.java` —— `addDocShare` 改用 `getIpAddressForLink()`；`buildShareLink` 用 `IPUtil.isLocalHost()` + `IPUtil.formatHostForUrl()`。

## 验证（真实环境，全部 PASS）

- **编译**：`javac -parameters -g -encoding UTF-8 -d WebRoot/WEB-INF/classes`（**Spring 控制器必须 `-parameters -g`**，否则参数绑定会坏；`javap` 已确认 `MethodParameters`/`LocalVariableTable` 存在）。dev Tomcat 已重启（`Server startup in 198173 ms`）。
- **单测（真编译类）**：`getIpAddress()`/`getIpAddressForLink()` = `192.168.1.9`（修复前 `192.168.56.1`）；`isLocalHost`、`formatHostForUrl` 全对（含 `192.168.1.9:8100` **不会**被错误加括号）。
- **E2E（dev Tomcat 8100）**：
  - `POST /Bussiness/addDocShare.do` → `shareLink = http://192.168.1.9:8100/DocSystem/web/project.html?vid=5&shareId=824085444`、`dataEx = 192.168.1.9` ✅（测试分享已删除，列表回到 37 条）
  - `POST /Doc/getDocShareList.do` → 返回项 `serverIp = 192.168.1.9` ✅
  - 前端 `DocSys.js`（真实服务返回的版本）新代码已生效、helper 行为正确 ✅
  - 浏览器用 `127.0.0.1` 访问 → 顺带验证了**放宽后的本机判断**（旧代码只认 `localhost`，用 127.0.0.1 访问时不会替换）。

## 遗留 / 待裁定

- ⚠️ **行为影响**：`getIpAddress()` 同时被 `BaseController:14899` 用作 `serverIP`（**备份目录命名** `Backup/<serverIP>-<MAC>-<reposId>/`）。修复后该值从 `192.168.56.1` 变回 `192.168.1.9`（= 恢复到出回归之前的取值）。恢复读取的是 commit 里记录的 `offsetPath`，**不会破坏旧备份**；但修复后**新产生的备份**会写进以新 IP 命名的目录。若需「备份命名」与「链接取值」解耦，可另开一项。
- **Mac 真实环境未复现/未实测**（本机为 Windows，已验证同类缺陷与修复逻辑；Mac 的 `awdl0` 场景为同类推断 + 代码逻辑保证）。
- IPv6 兜底为「有则用」；实际可达性取决于收发双方网络（局域网分享绝大多数仍是 IPv4）。

## 提交

- 主仓库 `D:\Dev\DocSys`：commit **`4e153082b`**【BugFix】文件分享IP地址错误（4 文件）
- websocket 独立仓库 `src/com/DocSystem/websocket`：commit **`7edf2810`**【BugFix】文件分享IP地址错误（`BussinessController.java`）
