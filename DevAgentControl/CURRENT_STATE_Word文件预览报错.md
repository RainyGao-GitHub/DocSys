# CURRENT_STATE_Word文件预览报错（授权证书采购合同docx转PDF）（缺陷卡）

> 状态：**修复完成 + 全部验证通过（2026-11-20 晚，verify_doc_pipeline -Fast 全 PASS），待 Eclipse touch/重启/服务端实测/提交**
> 归属：**Java 移植缺陷 ×3 层连环**（同一冷路径"超链接注释"上的三颗雷，此前从未被任何样例触达）
> office 仓库改动 3 文件：`NSOnlineOfficeBinToPdfStatic.java`（readString + readDouble）、`CAnnotation.java`、`CUriLinkAnnotation.java`（毒 class 清理）

## 一句话

Word 预览（docx→PDF）在 pdf.bin→PDF 渲染段连环踩中三颗移植雷：① `readString` 错用 doct bin 字符串语义（U32+压缩位）读 metafile 字符串（应为 UShort 字符数+UTF16）；② `readDouble` 错用 8 字节 IEEE754（应为 4 字节定点 int/100000，C++ `CBufferReader::ReadDouble`）——Path 系命令内联写对了所以此前所有 PDF 正常，ctHyperlink/ctLink 用了 readDouble 函数所以必错位；③ 超链接注释写出类 `CAnnotation/CUriLinkAnnotation` 是生成器烂尾毒 class（C++ `virtual` 关键字、丢失的 `c_sAnnotTypeNames` 表、错配的 `.m_pPointer` 访问器等）。

## 三层缺陷与修复明细（全部有字节级证据）

### 层 1：readString 语义错配（原始崩溃 StringIndexOutOfBounds 7564808）

- 写端/C++ 读端配套语义：`UShort 字符数 ×2 = 字节数 + UTF-16LE`（C++ MetafileToRendererReader.h `ReadString`）
- Java 旧码：`readU32 + bit31压缩标志`（doct bin 语义，CChangesWorker 家族）
- 字节铁证：pdf.bin 内 `21 00`(=33) + "https://share.weiyun.com/0Kjpf2o0"(恰 33 字符) 的 UTF-16
- **数学论证旧语义从未工作**：非空字符串时 U32 读值 = `(首字符<<16)|长度 ≥ 0x10000`，pdf.bin 仅数万字节 → 必越界；空串也吞后续 2 字节错位——不存在依赖旧语义的可用功能
- 修复：`int nLenBytes = 2*readU16(buffer); readString16(buffer, nLenBytes);`
- 静态分析全部 28 个调用点（ctHyperlink 2 + ctDocInfo 4 + handleFormField 22）：C++ 原版（DocInfo.cpp/FormField.cpp）**全部**用 `ReadString()`（UShort 语义），唯一用 `ReadStringA`(U32) 的 CShapeStart 不在 Java 命令集——一刀切安全

### 层 2：readDouble 编码错配（修复层 1 后暴露——URI 内容错位拼接）

- C++ `ReadDouble = ReadInt()/100000.0`（**4 字节定点**），`SkipDouble` 前进 4 字节
- Java `readDouble = BasicDefinition.readDouble`（8 字节 IEEE754）——每坐标多读 4 字节 → ctHyperlink 的 4 个 double 后错位 16 字节 → readU16 落到 URL 正文（探针轨迹 off=28117 vs 应为 28101，差恰 16）
- Path 系命令（MoveTo/LineTo/CurveTo）内联写的 `readInt()/100000.0` 是对的——**同文件两套语义并存，函数版错内联版对**，此前冷路径从未触达
- 修复：`readDouble` 改为 `return readInt(buffer) / 100000.0;`

### 层 3：CAnnotation/CUriLinkAnnotation 毒 class（修复层 2 后暴露——Error: Unresolved compilation problems）

坑 21 模式：ECJ 把烂尾源码编成毒 class，首次加载才炸。清理内容（依据=文件内嵌 C++ 原文 + 兄弟类模式）：
- `public virtual` → 去 virtual；`GetDictType` 返回 `new EDictType(EDictType.dict_type_ANNOTATION)`；`GetAnnotationType` 改返回 int（EAnnotType 是常量类非包装类，方法全仓无调用方）
- 补移植丢失的 `c_sAnnotTypeNames` 常量表（C++ Annotation.cpp:48，26 项）与 `BS_DEF_WIDTH=1.0f`
- 生成器打烂的基类构造调用 `CAnnotation = (pXref, AnnotLink, oRect)` → `CAnnotation_CAnnotation(pXref, EAnnotType.AnnotLink, oRect)`
- 错配的 `.m_pPointer` 访问器（pXref/pArray/pAction/pBorderStyleDict/pDash 共 35 处）→ 直接调用（参照 CFileStream:86 模式）
- 无调用方的 `ParentClass_Init(Document)` 残骸 → CXref

## 验证结果（2026-11-20 晚，全部命令行）

| 项 | 结果 |
|---|---|
| 目标文件 docx→PDF | **ret=0、246938B、4 页**；URI 注释干净（`https://share.weiyun.com/0Kjpf2o0`） |
| 与 C++ x2t 产物内容对齐 | **github×2 / weiyun×1 / RainyGao×2 / URI=1 / Annots=1 / Link=3 / pages=4 逐项相等**（此前"C++ 3 个 URI"为提取正则假象；github 链接两侧都是纯文本非注释） |
| 回归矩阵 4 链（word打印链 withchanges/手册 docx→PDF/xlsx→PDF/xls→PDF） | 全 ret=0，与预修复基线**大小一致且差异仅在 /CreationDate 时间戳**（掩码对比实证零内容回归） |
| verify_doc_pipeline -Fast | **全 PASS**（打开链/tblGrid/multisect/VML/保存链/保存回环，退出码 0，2026-11-20 晚补跑） |

## 复现与验证素材

`test/tmp/WordPreviewFail/`：docx 副本、kept.pdf.bin（31430B 字节现场）、params.xml（C++ 对照）、baseline/（预修复基线四链）、after/（修复后四链）、各探针/补丁脚本（探针已全部还原，源码干净）

## 遗留（用户侧动作）

1. Eclipse touch 3 文件（NSOnlineOfficeBinToPdfStatic/CAnnotation/CUriLinkAnnotation）+ 重启 dev
2. 服务端实测：仓库 1 该 docx 右键预览
3. 提交（office 仓库 3 文件）

## 教训（候选入方法论坑 33）

同一文件/家族内**多套二进制语义并存时逐函数核对基准**：metafile 里 Path 命令内联定点读、Hyperlink 用函数版 IEEE754——"大部分命令工作正常"不能证明共享工具函数正确；冷路径（超链接/表单域/文档信息）的移植质量可能完全烂尾（毒 class + 错语义），首次触达才连环爆。

