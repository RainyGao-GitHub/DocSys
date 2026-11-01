# Gitee Issue 草稿（COLEObject 丢弃 ReadFile 返回值）

仓库：RainyGao/DocSys-Office
类型：技术债（延后处理）

## 标题

【技术债】COLEObject 读取 PPTX 内嵌 Word 对象时丢弃 BinaryFileReader.ReadFile() 返回值（同 Word 主链路已修复的"错误码丢弃"模式）

## 正文

### 问题位置

`OOXML/PPTX/Logic/COLEObject.java:1100`（活动代码）：

```java
BinaryFileReader oBinaryFileReader = BinaryFileReader.Init(pReader.m_strFolder, oBufferedStream, oDocxSerializer.m_pCurFileWriter);
oBinaryFileReader.ReadFile();   // 返回值被丢弃
```

`ReadFile()` 读主表发生异常时返回 `c_oSerConstants.ErrorStream(0x55)`（内部异常仅打日志）。
此处丢弃返回值后继续走主题/ContentTypes 打包，会**静默产出残缺的内嵌 docx 且视为成功**。

（注：同文件 1838 行的相同调用位于 C++ 原始代码参考块内，非活动代码，无需处理。）

### 背景

同款问题在 Word 主转换链路（`CDocxSerializer.loadFromFile`，C++ 原版 DocxSerializer.cpp:427
同样丢弃——OnlyOffice 原生缺陷）已于 2026-10-31 修复：读失败返回 false → 上层置
AVS_FILEUTILS_ERROR_CONVERT → 残缺产物不打包 → 转换返回非 0。

本 issue 为同类遗留点，位于 PPTX 内嵌 OLE 对象路径，**影响面为单个内嵌对象（非整文档）**，
经评估暂缓修复（无现成负向样本，为其搭建验证不划算）。

### 建议修复方式（对齐主链路修复与 XLS 路径范式）

```java
int nReadRes = oBinaryFileReader.ReadFile();
if (com.DocSystem.websocket.office.OOXML.BinDocxRW.c_oSer_Types.c_oSerConstants.ReadOk != nReadRes)
{
    // 按上层语义处理：跳过该内嵌对象或置失败，避免静默残缺
}
```

修复时需配套负向样本（构造损坏的内嵌对象 bin）验证。

### 关联

- Word 主链路同款修复：任务卡 `DevAgentControl/CURRENT_STATE_FileConverter遗留问题.md`（"ReadMainTable 异常被吞"放大器整改）
- XLS 正确范式：`CXlsxSerializer.java:285` `return oBinaryFileReader.ReadFile(...)`
