# CURRENT_STATE — FreeType 去 lwjgl 依赖移植（工作卡）

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。**状态：规划完成，未开工**。
> 开工时把 `CLAUDE.md` 第 1 步的工作卡指向改成本文件。

## 当前任务
去除 `org.lwjgl` 依赖：将 onlyoffice FreeType 子集（`D:\Dev\onlyoffice-study\core\DesktopEditor\freetype-2.10.4`，66 文件 / 54,765 行 C）纯 Java 移植到 `src/com/DocSystem/websocket/office/freetype/`，替换 MxsDoc 中 14 个文件、约 500 处 lwjgl 调用。

## References（office 仓库 devDocs/）
- 开发计划（总体方案与决策）：`freetype移植-开发计划.md`
- **文件级映射表（权威进度跟踪）**：`freetype移植-文件级映射表.md`
- 操作规范（移植动作/git 检查/命令）：`freetype移植-操作规范.md`
- 脚本：`freetype移植-check_batch.ps1`（批编译）、`freetype移植-check_functions.ps1`（函数名核对）
- C++ 源码：`D:\Dev\onlyoffice-study\core\DesktopEditor\freetype-2.10.4\src\`

## 已确认决策（2026-09-16 用户确认）
1. **方案 A**：全量裁剪移植（保留 hinting + LCD，不做无 hinting 缩水版）。
2. **先移植、后统一验证**：移植期只做机械验证（批编译绿/可启动），像素级对拍统一到移植完成后按功能层切片。
3. **C++ 注释锚工作流**：每个 .java 先提交"仅含 C++ 原文（逐行 `//` 注释）+ 空类壳"的基准 commit，移植只增不改注释行，git diff 天然变成纯新增映射视图。
4. **编译粒度 = 批**（b1..b7，拓扑序）：批内 javac 一次解析，批绿才进下一批；新包独立，主工程在 B7 切换前始终可编译、旧 lwjgl 路径存活。
5. **约定 Spike 前置**：正式移植前端到端移植最小切片（head/hhea/maxp 解析 + 1 个 glyph 无 hinting 加载 + AA 渲染）并对拍，一次定型 26.6 定点/舍入/整数宽度/错误码/流语义等翻译约定。
6. 命名：类名=C 文件名原样、方法名=C 函数名原样、结构体保 C 名；门面 `FreeType.java`。
7. 结构变更白名单（仅 3 处，Spike 定型）：模块注册表→硬编码分发、ftdebug→Log、内存函数指针→对象方法。

## 开工约束
- 提交归属：devDocs 文档与 freetype/ 代码 → office 仓库（`git -C src/com/DocSystem/websocket/office`）。
- 编译输出：`-d WebRoot/WEB-INF/classes`（CLAUDE.md 不变量）；源码树禁止 `.class`。
- 测试产物：`src/com/DocSystem/websocket/office/test/tmp/<测试名>/`。
- 每次里程碑（批次绿/Spike 结论/结构变更定型/验证层结果）立即更新本卡「当前进展」「下一步」。

## 当前进展
- **✅ 规划交付物已生成（未提交）**：`devDocs/freetype移植-开发计划.md`、`freetype移植-文件级映射表.md`、`freetype移植-操作规范.md`、`freetype移植-check_batch.ps1`、`freetype移植-check_functions.ps1`。
- **⬜ 零代码移植**：`office/freetype/` 包尚不存在；映射表全部 ⬜。
- 现状盘点结论（已核实）：lwjgl 涉及 14 文件 ~500 处；实际 FT API 面 ~35 函数 + 15 结构体；渲染模式 NORMAL/LIGHT/LCD/LCD_V/MONO；加载标志 40968/40970。

## 下一步
1. 提交规划文档（office 仓库）。
2. 定义**约定 Spike** 切片范围（B1+B2 子集：head/hhea/maxp 解析 + 1 个 glyph 加载 + AA 渲染 + 对拍手段），交用户确认后执行。
3. 开始 B1 移植（模板 → 基准 commit → 移植 → 批编译绿）。

## 未提交改动
- office 仓库：devDocs 新增 `freetype移植-*` 5 个文件（开发计划/映射表/操作规范/两个 ps1）。
