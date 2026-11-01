# doc 转 docx 表格 tblGrid 列数缺失（Java 版 3 列，C++/Word 均为 6 列）

状态：**✅ 修复完成，用户 8100 实测通过（2026-11-01 19:36），待关 issue / 卡移已完成 / 主仓库提交**
- **Gitee issue：https://gitee.com/RainyGao/DocSys/issues/IKS1JU**（open）
- 修复提交（office 仓库）：`5b4a3174 【BugFix】doc转docx表格tblGrid列数缺失(HashMap→TreeMap)`
- 问题等级：P2 → 已按 P2 修复闭环（自动化验证全绿）

## 一、问题

同一 .doc 样本转 docx，**Java 版 tblGrid 列数与 C++ x2t / MS Word 不一致**：

| 裁判 | tblGrid（gridCol 列表） | 每行 tc 数 | 表头行 tcW |
|----|----|----|----|
| Java（修复前） | **3 列** `[2917,3553,4209]` | 6 | `797,2120,1852,1701,1701,2508` |
| C++ x2t.exe | 6 列 `[797,2120,1852,1701,1701,2508]` | 6 | 同上 |
| MS Word COM 另存 | 6 列（同上） | 6 | 同上 |
| **Java（修复后）** | **6 列 `[797,2120,1852,1701,1701,2508]`，gridSpan=6** | 6 | 同上 |

## 二、根因（已实锤，2026-11-01）

`DocumentMapping.buildTableGrid()`（DocumentMapping.java:2524）把 C++ 的
`std::map<short,short>`（**按 key 有序**）移植成了 `HashMap<Short,Short>`（**无序**）。
函数末尾按"升序相邻边界做差"构建 grid 列宽，在 HashMap 的桶序下产出乱序差值。

实测证据（诊断工具 `test/DiagTblGrid.java`，输出在任务记录中）：
- 样本各行 TDefTable **全部内联在 PAPX grpprl 中且收集完整**：
  标题行 `itcMac=1 [-1083,9596]`，其余行 `itcMac=6 [-1083,-286,1834,3686,5387,7088,9596]`
  （相邻差值恰为 797/2120/1852/1701/1701/2508）。原卡"标题行污染表头行边界"的猜想不成立；
  "3553 不属于任何行"也是乱序差值假象（3553=5387-1834，本卡推断的"边界 2917/6470"同理）。
- 该 7 边界集在 HashMap(容量16) 下的桶序为
  `7088,3686,-1083,1834,5387,9596,-286`，相邻做差 >2 的恰为
  `1834-(-1083)=2917、5387-1834=3553、9596-5387=4209` —— 与修复前产物逐值吻合。

## 三、修复（1 行语义变更）

`mapBoundaries` 由 `HashMap` 改为 **`TreeMap`**（自然序 = C++ `std::map` 语义；
`put(边界,0)` 值恒为 0，`insert` 不覆盖与 `put` 覆盖无行为差异）。
文件：`src/com/DocSystem/websocket/office/MsBinaryFile/DocFileFormat/DocumentMapping.java`
（import `java.util.TreeMap` 同步替换）。

## 四、验证（三层全绿）

1. **增量编译**：javac 通过。
2. **最小复现**（doc→bin→docx，样本 IK1OE7/sample.doc）：
   tblGrid 6 列 `[797,2120,1852,1701,1701,2508]`、gridSpan=6、tcW 序列与
   C++ x2t / MS Word 三方逐值一致（比对脚本见 test/tmp/IKS1JU/）。
3. **全链路回归** `verify_doc_pipeline.ps1` 全量 9 样本：
   - 无表格样本 bin 逐字节不漂移；4 个含表格样本漂移（+6/+36/+18/+3234B，
     grid 数据由乱序差值变有序差值进 bin 所致）；
   - 漂移已逐样本对齐验证：**simple-table / table-merges / 123.doc（38 表、
     全量 gridSpan）与 C++ x2t 参照产物的 tblGrid+gridSpan 100% 一致**；
   - 4 个基准值已按脚本规约更新并注明原因；
   - Step 2 保存链路 / Step 3 保存回环 PASS；
   - **新增 Step 1.5 内容断言**：本样本 tblGrid=6 列且列宽=期望值、gridSpan=6、
     tcW=10679=列宽总和（防止回归）。
- 附带发现（同类隐患，未在本卡修改，待后续卡）：3 处 `HashMap.entrySet()`
  有序遍历依赖 C++ `std::map` 语义——`MainDocumentMapping.java:321`（取末节段 CP）、
  `DocumentMapping.java:3680`（findValidSepx 异常路径）、
  `NumberingMapping.java:1083`（图片项目符号输出顺序）。

## 五、用户 8100 实测 + 服务器产物数据验证（2026-11-01 19:36）

- **视觉**（用户）：重新上传 `#2热机控制系统型号参数 (1).doc`（md5 与样本一致）打开，
  表头列位置与 Word 打开展示一致（修复前后视觉有可见变化，说明 canvas 路径确按 tblGrid 布局）。
- **服务器实际产物**（只读取 `C:/DocSysReposes/1/data/OfficeEdit/`，未写入）：

| 会话 | 时间 | Editor.bin | tblGrid | gridSpan |
|----|----|----|----|----|
| 200761195847（修复前打开） | 13:30 | 16028 B | 3 列 `[2917,3553,4209]` | 3 |
| 101884713522（修复后打开） | 19:36 | **16046 B** | **6 列 `[797,2120,1852,1701,1701,2508]`** | **6** |

  - 修复后服务器 bin 与本地回归 harness 产物 **md5 逐字节一致**（`9ab1847b…`），
    证明 8100 实例运行的就是修复后代码；
  - 两个 bin 经 `TestBin2Docx` 转 docx 后，新 bin 的 tblGrid/gridSpan/tcW 与
    C++ x2t、MS Word 参照逐值一致；旧 bin 复现了原始缺陷。

## 六、待办

- [ ] issue IKS1JU 评论闭环并关闭；本卡移入 `DevAgentControl/已完成/`；主仓库提交卡片变更。
- [ ] 后续卡：§四附带发现的 3 处同类 `HashMap`→`std::map` 有序性隐患。

## 七、材料索引

- 诊断工具：`office/test/DiagTblGrid.java`（复刻行走+三方比对，输出留存任务记录）
- 本样本修复后产物：`office/test/tmp/IKS1JU/`、`office/test/tmp/IK1OE7/repro/unzipped/`
- 4 样本 C++ 参照：`office/test/tmp/IKS1JU/{simple-table,table-merges,123}/cpp_output.docx`
- 回归脚本（已加 Step 1.5 断言+基准更新）：`office/test/tools/verify_doc_pipeline.ps1`

## 八、里程碑

- [x] 2026-11-01 问题发现 + 三方产物证据（IK1OE7 分析附带）
- [x] 2026-11-01 Gitee issue 提交：IKS1JU
- [x] 2026-11-01 代码级根因（DiagTblGrid 实锤：HashMap 无序 ≠ std::map）
- [x] 2026-11-01 修复（TreeMap）+ 三层验证全绿 + office 仓库提交 5b4a3174
- [x] 2026-11-01 8100 实测渲染通过（用户）+ 服务器产物数据验证（新旧 bin 对照）
- [ ] 关 issue、卡移已完成、主仓库提交
