# CURRENT_STATE_war打包（工作卡）

> 状态：**已产出 war 并校验通过**（2026-10-07）
> 产物：`C:\TomcatForDocSysDev\dist\DocSystem.war` —— **962.7 MB**，SHA256 `A41B1388C7AB9C5614838DEE97B3400D8FD51D1E88B3818D347B750FCF5EC5DC`

## 需求

用户：帮导出 war 包；**必须把字体库生成的文件清掉**（以前在 Eclipse 里打 war 时这些文件也被打进包了）。清理清单以 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 为准。

## 打包方法（可复用）

```powershell
$jdk='C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin'
$stage="$env:TEMP\docsys_war_stage"; $out='C:\TomcatForDocSysDev\dist'
Remove-Item -Recurse -Force $stage -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stage,$out | Out-Null
robocopy D:\Dev\DocSys\WebRoot $stage /E /NFL /NDL /NJH /NJS /NP `
  /XD "D:\Dev\DocSys\WebRoot\web\static\office-editor\fonts" `
      "D:\Dev\DocSys\WebRoot\web\static\office-editor\.git" `
      "D:\Dev\DocSys\WebRoot\WEB-INF\lib\.git" `
  /XF AllFonts.js font_selection.bin fonts.log "fonts_thumbnail*" .gitignore `
      "*Probe*.class" EncNames.class "OfficeP1*.class" OfficeP2Req.class
& "$jdk\jar" cf "$out\DocSystem.war" -C $stage .
```

要点：
- **必须先 robocopy 到暂存目录**再 `jar`——`jar` 没有排除参数；**开发目录 `WebRoot` 全程不动**（打包后 `git status` 为空 ✅）
- robocopy 退出码 **0~7 都算成功**（1 = 有文件被复制 ✅）
- `jar cf war -C <stage> .` 生成的条目**不带 `./` 前缀**（`META-INF/`、`WEB-INF/web.xml` …）✅ war 结构正确
- 打完删暂存：`Remove-Item` 可能因长路径失败 → 用 `robocopy <空目录> $stage /MIR` 再删 ✅（本次成功，释放 1545.6 MB）

## 排除清单（本次实际执行）

**① 按 `CleanOfficeFonts.bat`（字体库生成物，相对 `web/static/office-editor/`）**

| 排除 | 大小 |
| --- | --- |
| `fonts/`（生成的 web 字体，552 文件） | **773.5 MB** |
| `sdkjs/common/AllFonts.js` + `server/FileConverter/bin/AllFonts.js` | 0.35 MB |
| `server/FileConverter/bin/font_selection.bin`、`fonts.log` | 0.16 MB |
| `sdkjs/common/Images/fonts_thumbnail*`（20 个文件：png + .bin） | 小 |

**② 额外剔除（不在脚本里，但不该进 war）**

- `WebRoot\WEB-INF\lib\.git`、`WebRoot\web\static\office-editor\.git`（独立 git 仓库）
- 所有 `.gitignore`（共 8 个）
- `WEB-INF\classes` 根目录的开发期探针/测试 class：`DocTableProbe2`、`EncNames`、`LoginSqlProbe`、`OfficeCap*Probe`（8 个）、`OfficeP1*`（6 个）、`OfficeP2Req`、`ReposPathProbe`、`UserProbe`

**③ 保留**：`core-fonts/`（156.5 MB，**输入**字体，首次启动靠它重建字体库）、office-editor 编辑器本体（`server/` 335.9 MB、`web-apps/` 300 MB、`sdkjs/` 60.3 MB 等）

## 校验结果（`jar tf` 逆向检查，2026-10-07）

- 条目数 **44320**；头部条目 `META-INF/`、`WEB-INF/…`（无 `./` 前缀）✅
- **不该有的内容：全部为空** ✅（`office-editor/fonts/`、`AllFonts.js`、`font_selection.bin`、`fonts.log`、`fonts_thumbnail*`、`/\.git/`、`.gitignore`、探针 class）
- 关键项存在 ✅：`WEB-INF/web.xml`、`WEB-INF/classes/com/DocSystem/**`（含 `mapping/UserMapper.xml`）、`WEB-INF/lib/*.jar`（**248 个**，与 dev 环境一致）、`manager/tmpl/promptConfig.html`、`web/static/office-editor/core-fonts/`、`server/FileConverter/bin/doctrenderer.dll`

## 待定 / 未做

- **未做真实部署验证**：没把 war 丢进一个干净 Tomcat 跑起来（dev 用的是 junction 部署，不是 war）。
- **未固化成脚本**：目前是一次性命令；用户若需要可做成 `C:\TomcatForDocSysDev\BuildWar.bat`（带 `/xf` 排除清单 + 可选输出路径）。
- **还能再小**：`core-fonts` 156.5 MB 也可排除（代价：首次启动无法重建字体库，需另行把输入字体放到服务器）——需用户裁定。
- war 里含 `WEB-INF/classes`（Eclipse 输出目录，含 `jdbc.properties`/`docSysConfig.properties` 等默认配置），与用户以往 Eclipse 打包方式一致。
