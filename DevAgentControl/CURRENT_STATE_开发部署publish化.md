# CURRENT_STATE_开发部署publish化（工作卡）

> 状态：**脚本已交付并测试通过；本机迁移未执行**（等停服窗口，见「下一步」）
> 关联：`DevAgentControl/已完成/CURRENT_STATE_war打包.md`（war 排除清单）、`devDocs/本地开发Tomcat部署与启动指南.md`（方式 C）

## 需求（2026-10-17，用户提出）

用户意识到无法避免用 Eclipse 开发+导出 war，而 Eclipse 的部署模型是 **publish**（运行的是副本、改动拷进运行空间），不像我们 dev Tomcat 用 junction 直连代码目录 —— 导致运行期生成物全部污染代码空间（字体库 773 MB、`tmp\0\docsys.lic`、`sdk-all.cache`×3、被应用改写的 `docSysConfig.properties`，office-editor 子模块 git status 27 项脏）。要求参考 Eclipse：`webapps\DocSystem` 改为拷贝的真实目录 + 类 publish 的增量同步。

## 交付物（2026-10-17）

1. **`Docs/scripts/PublishDev.bat`**（本轮新增，已测）：
   - `/init` 全量初始化：目标须为「不存在/空目录/已有 webapp」；`/replace-junction` 可先移除旧联接（**校验联接指向 = WebRoot 才删**，`rmdir` 只删联接本身）；**带上现有字体库**（首启无需 10-30 分钟重建）；写 `DEPLOYED-BY-PUBLISH.txt` 标记。
   - 无参 = 增量 publish：`robocopy /MIR /XO`——拷有变化的文件、删工作区已删的文件（防旧 class 残留）、**运行期产物永不触碰**（`/XD`：`office-editor\fonts`、`tmp`、`uploads`；`/XF`：两个 `AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`、`sdk-all.cache`、marker）、**运行空间较新的文件不被覆盖**（`/XO` 保护被应用改写的 `WEB-INF\classes\docSysConfig.properties`）。
   - `/r` 发布后调 `docsys_restart.bat`；`/dry` 只列；`/audit` 列运行空间里"清单外"未知文件（匹配 robocopy `*多余文件`/*EXTRA 行——注意 `/NC` 会把标签一起去掉、行首有缩进不能 `/B`，两坑都已处理）；`/force` 去掉 `/XO`；`/p` 暂停。
   - 守卫：目标是联接/符号链接（`fsutil reparsepoint query` rc=0 判定，已验证 junction=0/普通目录=1/不存在=1）→ publish 与不带 flag 的 /init 都拒绝；缺 marker → publish 拒绝；源无 `WEB-INF\web.xml` → 拒绝。
   - 复用 war 脚本一族的 cmd 加固模式：`SCRIPT_DIR/SCRIPT_NAME` 先存（shift 会移动 %0）、参数去引号副本（带空格路径）、`if not defined A` 判空。纯 ASCII、CRLF。
2. **`Docs/scripts/README.md`**：文件表加 PublishDev 行 + 用法段；「排除清单三份副本」注意事项改为「war 三份 + PublishDev 运行期清单语义相反别混」。
3. **`devDocs/本地开发Tomcat部署与启动指南.md`**：方式 C（推荐，含迁移/清理/日常/回滚），方式 A 降为回滚路径，5.1/5.2 日常流程改 publish 制，变更记录 2026-10-17。
4. **`sdk-all.cache` 加入 war 排除清单**（BuildWar `/XF`+3 处自检、CleanWar.ps1 新 category「editor cache」、CleanOfficeFonts 计数+删除）：`BuildWar /verify` 回归通过——39,859 文件（恰好多排 3 个 cache）、禁用 0；CleanOfficeFonts 假发布树回归通过。

## 测试（迷你 webapp，全部通过）

init 语义（运行期产物带入、`office\{docs,devDocs,test}`/`*.java`/`.git` 不带、marker 写入）；publish 语义（改动拷入、工作区已删文件被删、`/XO` 保住运行期较新的 docSysConfig、排除项全保留、marker 保留）；`/audit` 能列出未知 dst 文件；`/force` 覆盖较新；联接三连（publish 拒绝 / init 无 flag 拒绝 / `/init /replace-junction` 正确移除并初始化、源无损）；无 marker 拒绝；对真实 dev 联接 `/dry` 也拒绝。性能：全量扫描 5.4 s / 空转 0.7 s。

## 踩坑

- robocopy `/NC`（no class）会把「新文件/*多余文件」标签一并去掉 → `/audit` 匹配不到；去掉 `/NC`。
- 多余文件行**行首有缩进**，`findstr /B "*"` 匹配不上，去掉 `/B`（文件名不可能含 `*`，安全）。
- bat if 块内的 `echo ... (additive copy...)` 未转义括号 → 「此时不应有 .」解析错误（整块 parse 时爆），块内 echo 一律不用裸括号。

## 下一步（等用户选定停服窗口，dev Tomcat 当前 8100 运行中）

1. 停服：`cmd /c "C:\TomcatForDocSysDev\docsys\docsys_stop.bat" /q`
2. `cmd /c "D:\Dev\DocSys\Docs\scripts\PublishDev.bat /init /replace-junction"`（约 2-4 分钟，2.35 GB / 4 万文件）
3. 清理工作区生成物（指南方式 C 里的 git checkout/clean 命令；**不要 `git add -A`**，保留 `bin/documentserver-generate-allfonts.{bat,sh}` 有意改动）
4. 启动 + 验证：`Server startup`、`127.0.0.1:8100/DocSystem/` 200、AI 图标正常（docSys.ini 未动）、Office 编辑器可用（字体库已带）、日志仍在 `tomcat\logs`
5. 用一次 Office 编辑 + 保存一次 AI 设置 → 确认 `WebRoot` 不再出现 `fonts\`/`tmp\`、office-editor 子模块 git status 干净（除两个有意改动）
6. 回滚预案：停服 → `rmdir /s /q webapps\DocSystem` → 方式 A 重建联接

## 待定 / 未做

- 未做真实 2.35 GB `/init` 演练（用迷你 webapp 全语义测试代替；迁移时如遇问题按回滚预案回方式 A）。
- `/watch` 自动发布（保存即 publish，防抖）列为可选二阶段，先跑顺手动模式。
- Eclipse 侧未配置 External Tools 一键 publish（PublishDev.bat 头部注释未含 Eclipse 配置段；如需要可仿 BuildWar.bat 头部加）。
- `web/sales/.git` 也在 PublishDev 的 `/XD` 里；若 sales 仓库将来有需随包发布的启动脚本改动，publish 会带上（源目录在 webapp 里，正常拷贝），仅 `.git` 元数据不带——无需处理，记录备查。
