# doc 链路 HashMap 替代 std::map 的有序性隐患（AllSepx / PictureBulletsCPsMap）

状态：**✅ 已闭环（2026-11-01）：修复提交 office `7fc7a1bd`（用户已 push），用户 8100 实测通过，服务器 bin 与本地修复后产物 md5 一致**
- 源卡：`CURRENT_STATE_doc转docx表格tblGrid列数缺失.md` §四附带发现
- 问题等级：P2（多节文档末节页面设置可能取错；无崩溃）
- 遗留观察（非本卡范围）：前端 canvas 编辑器对多节文档未按分节渲染页面方向/边距，见 §五

## 一、问题

C++ 原版 `WordDocument` 中 `AllSepx`、`PictureBulletsCPsMap` 为 `std::map<int,…>`（按 key 升序），
Java 移植成 `HashMap`（无序）。三处遍历依赖升序语义，HashMap 桶序下行为走偏：

| # | 位置 | C++ 语义 | HashMap 下的错误 | 可见影响 |
|---|---|---|---|---|
| A | `MainDocumentMapping.java:321` | 遍历取最后一个 key = **最大节起点 CP**（末节） | 取到的是桶序最后一个，不一定是最大 | 多节文档正文末尾 `<w:sectPr>` 用了**错误节**的页面设置（纸张/边距/方向/分栏/页眉页脚引用） |
| B | `DocumentMapping.java:3680` | findValidSepx 异常兜底：按升序扫描定位 cp 所属节 | 扫描顺序乱，可能定位错节 | 仅异常路径触发，罕见 |
| C | `NumberingMapping.java:1083` | 按 numPicBulletId 升序写 `<w:numPicBullet>` | 输出顺序乱；且循环内 `break` 在无效 fc 时提前退出，顺序不同则写出的子集不同 | 图片项目符号的 numbering.xml 顺序/内容与 C++ 不一致 |

（`WordDocument.java:1967` 对 AllSepx 的遍历是清理循环，顺序无关，不属缺陷。）

## 二、修复方案

构造点改为 `TreeMap`（= `std::map` 语义），字段类型保持 `Map<…>` 接口不变，无签名改动：
- `WordDocument.java:657` `AllSepx`（默认初始化）
- `WordDocument.java:659` `PictureBulletsCPsMap`
- `WordDocument.java:1513` `AllSepx`（LoadDocument 实际构造）

Key 均为 `Integer` CP/索引，非 null（TreeMap 拒绝 null key），put/get 行为与 HashMap 一致，仅遍历变为升序。
`AllPapx` 同为 std::map 但 Java 无有序遍历依赖（仅 get + AllPapxVector 二分），本卡不动。

## 三、验证方案（修改前先定下）

1. **定位可复现样本**：诊断工具 `test/DiagSepxOrder.java` 遍历回归语料，打印每个样本
   AllSepx 的 key 集、HashMap 实际遍历序、"遍历末 key" 是否 ≠ 最大 key（= 缺陷 A 实际触发），
   以及 PictureBulletsCPsMap 大小。
2. **修复前/后 + C++ 三方比对**：对触发样本，取修复前 bin（当前回归产物）与修复后 bin 各转 docx，
   抽取正文级末 `<w:sectPr>`（pgSz/pgMar/cols/headerReference…）与 x2t 参照产物比对：
   预期修复前 ≠ C++、修复后 == C++。
3. **全链路回归** `verify_doc_pipeline.ps1`：未触发样本 bin 逐字节不漂移；触发样本漂移需经第 2 步证实方向后更新基准。
4. **防回归断言**：为触发样本在脚本中新增末 sectPr 关键属性断言（Step 1.6）。
5. 若语料无触发样本：用 Word COM 生成多节（不同纸张方向/边距）.doc 合成样本，重复 1–4。

## 三、验证结果（2026-11-01）

### 3.1 语料诊断（`test/DiagSepxOrder.java`）
- 9 个回归样本中 8 个单节（天然不触发）；**123.doc 有 4 节，HashMap 实际遍历序已乱**
  `[14946, 67, 14595, 19832]`（升序应为 `[67,14595,14946,19832]`），只是碰巧末位仍是最大值，
  缺陷 A 未在语料中实际触发；PictureBulletsCPsMap 全部为空（缺陷 C 无语料覆盖）。
- 结论：语料不能复现，按预案第 5 步合成样本。

### 3.2 合成样本精确复现（`test/tools/gen_multisect_doc.ps1 -N1 20 -N2 30`）
Word COM 生成 2 节 .doc（md5 `b5e306a5…`，固化为 `tmp/TestDocNpeRepro/inputs/multisect.doc`）：
第 1 节横向、top=100pt/left=90pt；第 2 节纵向、top=30pt/left=40pt。
节末 CP = `[21, 52]`，HashMap 桶序 = `[52(桶4), 21(桶5)]` → 遍历末 key=21 ≠ 最大 key=52，**缺陷 A 触发**。

三方比对正文级（末节）`<w:sectPr>`：

| 产物 | 第 1 节内联 sectPr | 正文级（末节）sectPr |
|----|----|----|
| C++ x2t 参照 | 横向 16838×11906, top=2000 left=1800 | **纵向 11906×16838, top=600 left=800** |
| Java 修复前 | 同上 ✓ | **横向 16838×11906, top=2000 left=1800 ✗**（第 1 节设置被复制到末节） |
| Java 修复后 | 同上 ✓ | **纵向 11906×16838, top=600 left=800 ✓** == C++ |

浏览器可见影响：修复前文档末尾页面方向/边距错误（本例末页本应纵向却按横向排）。

### 3.3 全链路回归
- 新增 `multisect.doc` 基准 7933B（修复前 7936B）；新增 **Step 1.6 断言**：正文级 sectPr 必须为
  纵向 11906×16838、top=600、left=800，第 1 节内联 sectPr 仍为横向。
- 既有 9 样本预期 bin 逐字节不漂移（均未触发缺陷 A，且 PictureBulletsCPsMap 均为空）。
- **结果：全绿**——9 样本 bin 与基准逐字节一致（14314/3158/6097/8287/119166/16046/605251/45129/54956），
  multisect 7933B PASS，Step 1.5 ×3 + Step 1.6 ×2 断言 PASS，保存链路 83872B / 回环 896524B PASS。

## 四、工作规矩（延续）

编译 `javac -g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`；
scratch 只写 `test/tmp/<测试名>/`；`C:\MxsDoc` 不碰；office 代码独立仓库 `git -C src/com/DocSystem/websocket/office`。

## 五、用户 8100 实测 + 浏览器复核（2026-11-01 21:23）

- 用户上传 multisect.doc（改名目录 stdmap被Java移植成了HashMap）实测通过，代码已 push。
- **服务器产物数据验证**：8100 为本次上传生成的 Editor.bin（7933B，md5 `04894078…`）
  与本地修复后 harness 产物 **md5 逐字节一致** → 线上运行的确认是修复后代码。
- **浏览器复核**（Agent 经 IAB 登录 Admin 实测）：
  - 第 2 页：**纵向、窄边距 ✓**（与 MS Word 一致；修复前编辑器末页会按横向大边距渲染）；
  - 第 1 页：编辑器渲染为**纵向窄边距 ✗**（源文档第 1 节为横向大边距）。
    bin 数据两节均正确（bin→docx 回环两个 sectPr 与 C++ 逐值一致），故这是
    **前端 canvas 编辑器按"文档级（末节）页面设置"统一渲染、未按分节应用页面方向/边距** 的
    既有行为，非本卡转换缺陷、非修复回归（C++ x2t 产出的相同数据也会如此渲染）。
  - 附带发现（建议另立低优先级卡）：canvas 编辑器对多节文档的**分节页面方向/边距渲染**支持。

## 六、里程碑

- [x] 2026-11-01 发现 + 范围确认（3 处构造点、3 处有序遍历）
- [x] 2026-11-01 诊断：语料不触发（123.doc 遍历序已乱但碰巧末位正确）；Word COM 合成 multisect.doc 精确复现
- [x] 2026-11-01 修复（3 处构造点 → TreeMap）+ 编译
- [x] 2026-11-01 三方比对（修复后末节 sectPr == C++）+ 全链路回归全绿 + Step 1.6 断言
- [x] 2026-11-01 office 仓库提交 `7fc7a1bd`
- [x] 2026-11-01 用户 8100 实测通过（代码已 push）+ Agent 浏览器复核（末节渲染正确；
  发现前端分节渲染既有局限，见 §五）→ 卡移已完成、主仓库归档

## 六、材料索引

- 诊断工具：`office/test/DiagSepxOrder.java`（AllSepx key 集 / 实际遍历序 / 末 key≠最大 key 判定）
- 合成样本生成器：`office/test/tools/gen_multisect_doc.ps1`（Word COM，参数 N1/N2 调节节末 CP）
- 固化夹具：`office/test/tmp/TestDocNpeRepro/inputs/multisect.doc`（md5 `b5e306a5…`）
- 修复前/后 bin 与 docx：`office/test/tmp/TestBin2Docx/multisect_{before,after}/`
- C++ 参照：`office/test/tmp/DiagSepxOrder/cpp_output.docx`
- 回归脚本：`office/test/tools/verify_doc_pipeline.ps1`（multisect 基准 + Step 1.6）
