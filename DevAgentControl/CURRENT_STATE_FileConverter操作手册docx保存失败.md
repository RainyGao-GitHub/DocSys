# CURRENT_STATE_FileConverter操作手册docx保存失败（缺陷卡）

> 状态：**根因定位完成 + 修复完成 + 命令行验证通过（2026-11-19），待 Eclipse touch/重启/服务端实测/提交**
> 归属：**Java 转换链（doctrenderer/CChangesWorker）保存链缺陷 ×2（独立叠加）** —— 本卡原定性的"Base64Decode 越界"仅是表象第一层
> 严重程度：**高**（用户编辑内容保存丢失，saveFailed.flag 已触发通知）

## 一句话

`FileConverter操作手册.docx` 编辑后保存失败是**两层独立缺陷叠加**：
①changes 目录里**上一轮保存遗留的图片文件**被 `getDoctXml` 无过滤列入 `<Change>`，CChangesWorker 把 PNG 二进制当 base64 change 流解析，Java 侧内层读越界 AIOOBE（索引 317404 = 恰好是 `918164.6320085673_image1.png` 的文件大小，铁证）；②剥掉第一层后暴露 `nullable_bool.ToAttribute` 装箱 Boolean 裸 `if` 拆箱 NPE（documentProtection 序列化）。

## 根因链（已闭环，全部实证）

### 根因 1：图片混入 change 解析列表（AIOOBE 317404 的真因）

1. 保存成功后 `apply_changes` 尾部把 media 图片拷回 changes/ 并打进 changes.zip（**版本历史机制，C++ 原版同款**，NExtractToolsStatic apply_changes 尾部 GetImagesInChanges→copy→Compress）。
2. 下一轮保存在同一 `OfficeEdit/<docId>/<dockey>/data/` 原地进行：changesN.json 重新生成，**上一轮的图片仍在 changes/ 目录**。
3. `getDoctXml`（Java=C++ 原版同款，`cextracttools.cpp:771`）把 changes 目录**所有文件**无过滤列入 `<Change>`；该列表唯一消费者是 CChangesWorker（sdkjs 侧不引用，图片本体由 ImagesDirectory=bin 旁 media/ 提供）。
4. Open_excel 把 PNG 当 `<len>;<base64>"` 记录流解析：前 5 张 PNG 尾部恰好有 `"`(0x22) 字节干净收尾（已解出垃圾 change 塞进缓冲——即使不崩也会污染 sdkjs 重放）；第 6 张（317404B）尾部无终止符 → 内层 `data[cur.offset]` 读越界。
5. **C++ 原版同样无过滤、内层同样无 `cur<len` 检查**——靠越界读堆垃圾不崩（UB）"容忍"；Java 显性化为崩溃。定性：**双方共有的上游缺陷，Java 侧按 C++ 意图（图片不是 change 流）上层修正**（同 MHT detectActualFormat、SttbfAtnBkmk 守卫先例）。
6. 附带发现：`Base64Decode2`（无调用方）的循环体被历史错误合并改烂（`dwCurr|=nCh`/`nBits+=6` 被塞进 if、游离重复读字符行），本次按文件内嵌 C++ 原文恢复。

### 根因 2：nullable_bool.ToAttribute 拆箱 NPE（documentProtection）

- 原文档 settings 有 `<w:documentProtection w:enforcement="0"/>`；bin→docx 读回时 `CDocProtect.toXML` 调 `m_oFormatting/m_oEnforcment.ToAttribute`。
- C++ 原型 `m_pPointer` 是 `bool*` 指针判空（null→返回空串）；Java 移植成装箱 `Boolean` 后裸 `if (m_pPointer)` 自动拆箱 → null 时 NPE。
- 消费方仅 CDocProtect + CWriteProtection（settings 家族），影响面收敛。
- 对照组实证：修复后不带 changes 的 bin→docx 输出 `w:enforcement="0"` **保留**（bin 里本来就带 docProtect）；withchanges 输出为空标签 `<w:documentProtection/>` 是 **sdkjs 重放丢弃属性**（C++ DS 同一份 sdkjs 同行为，enforcement="0" 语义=未启用保护，等价，不追）。

## 修复明细（office 仓库 3 文件，未提交）

| 文件 | 修复 |
|---|---|
| `FileConverter/NExtractTools/NExtractToolsStatic.java` | getDoctXml 列 `<Change>` 时只收 `.json`（大小写不敏感），图片等留在磁盘（版本历史 zip 仍完整带上） |
| `doctrenderer/CChangesWorker.java` | ①Base64Decode 内层补 `cur.offset >= len` break（C++ 的 Base64Decode2 原版本就带此守卫，v1 漏了）②Base64Decode2 残缺恢复 |
| `common/NSCommon/nullable_bool.java` | ToAttribute `if (m_pPointer)` → `if (null != m_pPointer)`（C++ bool* 指针判空语义） |

均 python 二进制级替换（CRLF 保真），diff 共 +17/-4 行。

## 验证结果（全部命令行，DiagTiming）

| 项 | 结果 |
|---|---|
| 修复前复现（现场 data/ 副本 + withchanges 8193→65） | **AIOOBE 317404 @ Base64Decode:658，与线上堆栈逐帧一致** |
| 修复后同数据 withchanges | **ret=0、9s、docx 2921863B**；正文关键词全命中；media 11/11（原 docx 的"12th"实为 zip 目录项，零丢失） |
| 对照组（无 changes 8193→65） | ret=0、2611437B、`w:enforcement="0"` 保留 |
| xlsx 交叉回归（EditorBinWithChanges_AutoFilter测试样例.xlsx，8194→257 withchanges，纯 json changes） | ret=0、96013B（过滤对正常场景零影响） |
| ppt 交叉回归（EditorBinWithChanges_S1删除形状阴影备注.pptx，8195→129 withchanges） | ret=0、29825B |
| verify_doc_pipeline.ps1 -Fast | **全 PASS**（打开链/保存链/保存回环/tblGrid/multisect/VML） |

复现素材：`test/tmp/FileConverterSaveFail/`（repro/=现场 data/ 副本；patch.py=补丁脚本备查）。

## 服务端重试路径说明

现场 `C:/DocSysReposes/23/data/OfficeEdit/102113034617/` 完整保留（orgChanges 0-21 + data/changes 含 jsons+6 图片 + media + Editor.bin + saveFailed.flag）。修复部署后：用户重新打开文档触发 saveFailed.flag 检测→自动重试保存→generateChangesFromOrgChanges 重新生成 jsons→getDoctXml 过滤掉图片→应直接成功（无需用户重新编辑）。两次 ErrorChanges 归档目录（21:56 含 changes.zip 1.9MB、22:23 空）保留备查。

## 遗留（用户侧动作）

1. Eclipse touch 3 文件（NExtractToolsStatic/CChangesWorker/nullable_bool）+ 重启 dev
2. 服务端实测：打开 23 号仓库该文档 → 确认保存失败通知/自动重试成功（或重新编辑保存一次）
3. 提交（office 仓库 3 文件）
4. 方法论文档与 CLAUDE.md 已同步更新（本卡收尾后归档）
