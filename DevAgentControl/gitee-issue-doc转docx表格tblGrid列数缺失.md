# Gitee Issue 草稿（doc 转 docx 表格 tblGrid 列数缺失）

仓库：RainyGao/DocSys（主仓库，同 IK1OE7）
类型：Bug（Java 版 FileConverter 移植差异）
状态：**✅ 已提交（2026-11-01）**：https://gitee.com/RainyGao/DocSys/issues/IKS1JU

## 标题

【Bug】doc转docx后表格tblGrid列数缺失：Java版3列，C++ x2t与MS Word均为6列（fixed布局下列宽或错乱）

## 正文

### 现象

样本：`#2热机控制系统型号参数.doc`（md5 e9a03bf8eff6d02e10ef1393b9833147，
IK1OE7 的原始样本），转换链 doc→Editor.bin→docx 后对比三方产物：

| 裁判 | tblGrid | 每行 tc 数 | 表头行 tcW |
|----|----|----|----|
| Java FileConverter | **3 列** [2917,3553,4209] | 6 | 797,2120,1852,1701,1701,2508 |
| C++ x2t.exe | 6 列 [797,2120,1852,1701,1701,2508] | 6 | 同上 |
| MS Word COM 另存 | 6 列（同上） | 6 | 同上 |

C++/Word 的 tblGrid 与每行 6 个单元格的 tcW 完全吻合；Java 的 tblGrid 与 tcW 不匹配：
6 列的正确边界应为 0/797/2917/4769/6470/8171/10679，Java 丢失了其中 4 个边界，
且混入不属于任何一行 tcW 的 3553。标题行（跨全列）gridSpan 同步走偏：Java=3，
C++/Word=6。

### 影响

产物表格为 `tblLayout=fixed`。tblGrid 是固定布局的列边界权威，与 tcW 矛盾时
不同渲染器行为不同：Word 以 tcW 优先，部分渲染路径按 tblGrid 网格化，
可能造成列宽错位/单元格合并。需实测 MxsDoc 前端渲染确认可见影响。

### 疑似位置

`src/com/DocSystem/websocket/office/MsBinaryFile/DocFileFormat/DocumentMapping.java`
的 `buildTableGrid()`：从每行 `sprmTDefTable(0xD608)` 收集列边界到 mapBoundaries。
怀疑点：sprm 参数解析（itcMac/字节序/有符号转无符号），或跨全列标题行自身
tapx 的列边界污染了表头行边界。

### 复现

```
# doc→bin→docx（Java 链）
java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  com.DocSystem.websocket.office.test.TestDocNpeRepro <样本.doc>
java -cp ... com.DocSystem.websocket.office.test.TestBin2Docx <Editor.bin>
# C++ 裁判：x2t.exe + params.xml（formatFrom=66, formatTo=65）
# 对比两份 word/document.xml 的 <w:tblGrid> 与各行 <w:tcW>
```

材料：任务卡 `CURRENT_STATE_doc转docx表格tblGrid列数缺失.md`；
三方产物已存 `office/test/tmp/IK1OE7/{java_docx,cpp_docx,word_ref}/`。

### 关联

- 源 issue：#IK1OE7（已按"非 bug"关闭，本问题为其分析过程中的附带发现）

## 提交命令（token 到位后执行）

```bash
TOKEN=<私人令牌>
python - <<'EOF'
import json, urllib.request
token = open('D:/Dev/DocSys/DevAgentControl/.gitee_token').read().strip()
title = "【Bug】doc转docx后表格tblGrid列数缺失：Java版3列，C++ x2t与MS Word均为6列（fixed布局下列宽或错乱）"
body = open('D:/Dev/DocSys/DevAgentControl/gitee-issue-doc转docx表格tblGrid列数缺失.md', encoding='utf-8').read()
# 从草稿中截取"## 标题"之后、"## 提交命令"之前的正文段
req = urllib.request.Request(
    "https://gitee.com/api/v5/repos/RainyGao/DocSys/issues",
    data=urllib.parse.urlencode({"access_token": token, "title": title, "body": body}).encode(),
    method="POST")
print(urllib.request.urlopen(req).read().decode())
EOF
```
