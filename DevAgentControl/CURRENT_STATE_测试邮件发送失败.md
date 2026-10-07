# CURRENT_STATE_测试邮件发送失败（挂起卡）

> 状态：**已定性 + 已裁定**（2026-10-06 建立，2026-10-07 更新）
> 结论：**网易免费企业邮（ym.163.com）侧不给该账号 SMTP 发信权限** → 不是系统代码问题
> 裁定（用户 2026-10-07）：**不再由我方在 dev 搭通道**（阿里云 DirectMail 要配发信子域名的 DNS，太麻烦）→ **交给客户自行申请/配置邮件通道**。本卡的实测结论与「给客户的要点」保留，作为交付材料。
> 触发：系统「邮件服务 → 发送测试邮件」总是失败（用户可用 `helper@gofreeteam.com` 正常网页登录邮箱）。

## 取证（全部实测，2026-10-06）

### 1. 应用日志（dev 8100，`tomcat\logs\docsys_console.log`）—— 三次测试三次失败

```
22:46:01 testSystemMailConfig.do
22:46:02 MailSender.send() 收件人:6***@qq.com 发送方式:smtp 结果:失败 返回码:550 耗时:981ms
         原因:服务器 550：550 5.8.2 user can not use SMTP service .For more information, please visit
              https://feedback.qiye.163.com/static/feedback/#/bounce/ABEWAHNQLAAiW1tVJUl...
22:53:02 … 返回码:550 原因:550 5.7.1 authentication is required …
22:54:41 … 返回码:550 原因:550 5.8.2 user can not use SMTP service …
```

### 2. 当前邮件配置（`system_setting` 表，脱敏）

| 项 | 值 |
| --- | --- |
| `mail.enabled` / `mail.provider` / `mail.from` | `true` / `smtp` / `helper@gofreeteam.com` |
| `mail.smtp` | host=`smtp.gofreeteam.com`、port=`25`、encryption=`starttls`、auth=`true`、account=`helper@gofreeteam.com`、password 长度 14（与网页登录密码一致） |
| `mail.aliyun` / `mail.tencent` | 均**未配置**（key 为空） |

### 3. 我做的裸 SMTP 对话（只读，到 MAIL FROM 即停，**未发信**）

```
S: 220 gyproxy-cli1-ym-entmail-virt158.gy.ntes ESMTP ready        ← 网易企业邮接入集群（ntes）
S: 250-AUTH PLAIN LOGIN / 250 STARTTLS
STARTTLS → TLSv1.2 ✅
AUTH LOGIN → 235 2.7.0 Authentication successful                  ← ★ 账号密码认证是通过的
MAIL FROM:<helper@gofreeteam.com>
S: 550 5.8.2 user can not use SMTP service …                      ← ★ 卡在「发件人」，不是认证
RCPT TO → 503 5.5.1 Error: need MAIL command                      ← 上一步失败的连带
```

### 4. DNS 解析（关键事实）：smtp / imap / pop 都是**网易免费企业邮**同一套系统

| 主机 | CNAME | IP |
| --- | --- | --- |
| `smtp.gofreeteam.com` | `smtp.ym.163.com` | 111.124.200.34 |
| `imap.gofreeteam.com` | `imap.ym.163.com` → `cli.ym.ntes53.netease.com` | 111.124.200.34 |
| `pop.gofreeteam.com` | `pop.ym.163.com` → `cli.ym.ntes53.netease.com` | 111.124.200.34 |
| MX | `mx.ym.163.com` (10) | — |
| `gofreeteam.com`（网站） | — | 121.40.124.140 |

### 5. 同一账号实测 IMAP / POP3 —— **都能登录成功**（与 SMTP 形成对比）

```
IMAP 143  S: * OK Welcome to Hmail IMAP4rev1 server (Version. 1.0)
          a2 LOGIN → a2 OK LOGIN completed          ← 成功
POP3 110  +OK Welcome to Hmail POP3 server / +OK Welcome.   ← 成功
IMAP 993 SSL(TLSv1.2) → a1 OK LOGIN completed               ← 成功
```

> banner 自称 "Hmail"，但 DNS 全部 CNAME 到 `*.ym.163.com`（111.124.200.34）→ 都是网易这一套；结论不依赖 "Hmail" 是谁的产品。

## 结论

1. **不是代码 / 网络 / 端口 / 加密 / 密码问题**：STARTTLS 正常、`AUTH LOGIN` 返回 235 认证成功；失败发生在 `MAIL FROM`（发件人授权）阶段，服务端明确说 **"user can not use SMTP service"**。
2. **也不是"客户端协议整体没开"**：同一账号的 **IMAP/POP3 登录均成功** ⇒ 收信协议可用，**只有 SMTP 发信**被网易侧拒绝。
3. 用户使用的**网易免费企业邮箱（ym.163.com）**：管理后台「成员管理」里本来就没有"客户端协议/SMTP"开关（免费版界面），相关开关（若有）应看**网页版 → 设置 → POP3/SMTP/IMAP**；但**实测该账号 SMTP 发信被拒**，与"免费版不开放/限制 SMTP 发信"相符。
4. 该限制在**网易侧**，系统配置无法绕过（已排除本机 IP 白名单、端口、TLS、密码、账号问题）。

## 可选出路（待用户决定）

| 方案 | 说明 |
| --- | --- |
| **A 换成系统已内置的 API 通道** | 后台「邮件服务」把 `mail.provider` 从 `smtp` 切到 **阿里云 DirectMail** 或 **腾讯云 SES**（填 AccessKey/Secret/发信地址）。走 HTTPS API，不依赖企业邮 SMTP 权限，送达率与稳定性也更好 —— **推荐给客户生产环境** |
| B 换一个开通了 SMTP 的邮箱 | 如 QQ 邮箱/163 个人邮箱 + **授权码**，host `smtp.qq.com:465`(SSL) —— 系统里 host/port/encryption/account/password 均可配 |

### 方案 B 实测：QQ 个人邮箱（2026-10-07）

用 `652055239@qq.com` + **账号登录密码** 测 `smtp.qq.com:465`（隐式 SSL，TLSv1.2 握手成功）→ 服务器广告 `250-AUTH LOGIN PLAIN XOAUTH XOAUTH2`，但 `AUTH LOGIN` 返回：

```
535 Login fail. Account is abnormal, service is not open, password is incorrect,
login frequency limited, or system is busy. More information at https://help.mail.qq.com/detail/108/1023
```

**未发信**（AUTH 失败即停）。QQ 官方对该错误码的说明（`help.mail.qq.com/detail/108/1023`，已抓取）要求做到两件事：

1. **网页端开启服务协议**：`设置 → 账号与安全 → 安全设置` → 开启 **POP3/IMAP/SMTP/Exchange/CardDAV 服务**；
2. **密码栏填「授权码」而不是邮箱登录密码**（授权码生成指南：`help.mail.qq.com/detail/106/985`；需短信验证，最多保留多个，可重新生成）。

⇒ 系统侧填法：发送方式 `SMTP`、服务器 `smtp.qq.com`、端口 `465`、加密 **SSL/TLS（隐式 SSL）**、账号 = 完整邮箱地址、密码 = **授权码**、发件邮箱必须与账号相同。

探针：`%TEMP%\docsys_chk\QQSmtpTest.java`（可传入授权码复测 AUTH 并自测发信）、`SmtpPortProbe.java`（只测端口连通）。
| C 让网易侧放开 | 用报错自带的官方诊断链接（`feedback.qiye.163.com/.../bounce/...`）+ 账号 + 时间提工单/找管理员；免费版大概率不给开，需**升级付费企业邮**或用别家域名邮 |

**→ 用户 2026-10-07 裁定：A 方案需要配发信子域名的 DNS，太麻烦；改为把上面的三条出路整体交给客户，由客户自行申请/配置。**

## 给客户的要点（客户自行申请邮件通道时，直接给这页）

### 1. 先把结论说清楚
- 系统侧发送链路已逐层验证正常（配置读取 → 构造请求 → 调用通道 → 解析响应 → 后台展示原始报错）；
- 本次失败是**邮件服务商侧的权限/资质问题**：网易免费企业邮用同一账号 IMAP/POP3 登录都正常，但 `MAIL FROM` 被拒 `550 5.8.2 user can not use SMTP service`；
- 系统支持三种发信方式（SMTP / 阿里云 DirectMail / 腾讯云 SES），**任意一种可用即可**，切换后**保存即生效、无需重启**。

### 2. 若客户走「普通 SMTP 邮箱」（最快，适合先让系统能发信）
- 必须用**邮箱侧开好的 SMTP 客户端权限**，且用**授权码/专用密码**，**不是网页登录密码**（QQ/163 等均如此；QQ 实测用登录密码会回 `535 … service is not open, password is incorrect …`，官方要求先开启 POP3/IMAP/SMTP 服务再生成授权码）；
- 在系统里填：发送方式 `SMTP`、服务器（如 `smtp.qq.com`）、端口与加密（`465` + **SSL/TLS（隐式 SSL）**；或 `587` + STARTTLS）、账号 = **完整邮箱地址**、密码 = **授权码**、发件邮箱**必须与账号一致**；
- 局限（不推荐作为对客户发信的长期方案）：发件人域名不是自己的、无法配 SPF/DKIM（易进垃圾箱）、个人邮箱有频率/日限额。

### 3. 若客户走「阿里云邮件推送 DirectMail」（推荐用于生产）
必须用**发信子域名**（例：`mail.客户域名.com`）——官方明确：已用于其他企业邮箱的域名不能再用于邮件推送，且建议用子域名以免影响现有企业邮。。步骤：
1. 控制台 `dm.console.aliyun.com` 开通邮件推送（自助、按发送成功量计费，也可买资源包）；
2. **发信域名**：新建子域名 → 按页面清单加 DNS（TXT 所有权验证 + SPF + MX + DKIM；*新域名四项全过才算通过*，一般 4h 内生效、最长 48h；域名在同一阿里云账号且华东时可用「自动配置解析」）；
3. **发信地址**：新建（如 `noreply@mail.客户域名.com`）；走 API 不需要它的 SMTP 密码；
4. **RAM 子账号**拿 AccessKeyId/Secret（只授邮件推送权限）；
5. 注意**区域一致性**：控制台默认华东1（杭州）↔ 系统里 endpoint 默认 `dm.aliyuncs.com`；换区域要同步改 endpoint。

系统里填：发送方式「阿里云邮件推送」+ AccessKeyId/Secret + **发信地址（accountName）** + 发件邮箱（建议与发信地址一致）；RegionId 仅作记录。
> 官方限制：`SingleSendMail` **不支持附件**（带附件时系统会报错提示改方式）。

### 4. 其他可行通道
- **腾讯云 SES**（系统已内置，同样需要域名验证）；
- 付费企业邮（网易/腾讯企业邮付费版）才有客户端专用密码/发信权限。

## 代码侧可选的改进（待用户点头，未实施）

- 把这类服务商错误码翻译成**可操作提示**（识别 `5.8.2 user can not use SMTP service` → 提示"该发信账号在邮件服务商侧未开通 SMTP 发信权限"），并把报错里的官方诊断链接渲染成可点。

## 验证/排查资产（%TEMP%\docsys_chk）

- `SmtpDialogueProbe.java`（裸 SMTP 对话，到 MAIL FROM 停，凭据不外显）
- `MailProtoCheck.java`（IMAP/POP3/IMAPS 登录探测，用于区分"协议未开"与"仅禁发信"）
- `MailCfgDump.java`（`mail.*` 配置脱敏打印）
- `QQSmtpTest.java`（QQ SMTP：AUTH + 自测发信，报告写 `%TEMP%\docsys_chk\qq_smtp_result.txt`）
- `SmtpPortProbe.java`（只测目标邮箱 SMTP 端口/TLS 连通，不发凭据）
