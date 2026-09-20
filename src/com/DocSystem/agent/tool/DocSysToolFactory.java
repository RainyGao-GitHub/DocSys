package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.memory.UserMemoryStore;
import com.DocSystem.agent.search.WebSearchResult;
import com.DocSystem.agent.search.WebSearchService;
import com.DocSystem.common.ErrorCode;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * DocSys 工具工厂 —— 把 {@link DocSysClient} 的 API 封装为 LLM 可调用的 {@link ToolDefinition}。
 *
 * <p>每个工具通过闭包绑定一个 per-request 的 DocSysClient 实例（会话隔离），
 * 由调用方（MainAgent）按当前请求构造 registry。</p>
 *
 * <p>当前实现 T3.1 只读工具组（R1-R16）；写工具组（T3.2）后续加入。</p>
 */
public class DocSysToolFactory {

    private static final Logger log = LoggerFactory.getLogger(DocSysToolFactory.class);

    /** 工具结果文本摘要的最大长度（避免注入 LLM 上下文过大） */
    private static final int MAX_SUMMARY_LEN = 4000;

    private DocSysToolFactory() {
    }

    /**
     * 创建绑定到指定 DocSysClient 的只读工具注册表。
     */
    public static ToolRegistry createReadOnlyRegistry(DocSysClient client) {
        ToolRegistry reg = new ToolRegistry();
        reg.register(getLoginUser(client));
        reg.register(listRepos(client));
        reg.register(getRepos(client));
        reg.register(listDocs(client));
        reg.register(getDoc(client));
        reg.register(getDocHistory(client));
        reg.register(searchFiles(client));
        reg.register(grepFiles(client));
        // P4 下线（2026-09-19）：rag_chat（与 Agent 自身推理 + search/grep/get_doc 重叠）、
        // list_ai_models（模型元信息，属对话层职责）、get_sys_config（配置暴露给模型，收益低风险大）
        reg.register(getDocShareList(client));
        reg.register(queryBackupStatus(client));
        return reg;
    }

    /**
     * 创建完整注册表（只读 + 写操作工具）。
     * 写工具全部 isWrite=true + needsConfirm=true，执行前经 WriteConfirmGate 批准。
     */
    public static ToolRegistry createFullRegistry(DocSysClient client) {
        return createFullRegistry(client, null, null, null);
    }

    /** 兼容：无 webSearch（memoryStore 可选） */
    public static ToolRegistry createFullRegistry(DocSysClient client, UserMemoryStore memoryStore, String username) {
        return createFullRegistry(client, memoryStore, username, null);
    }

    /**
     * 创建完整注册表（只读 + 写操作工具 + 用户记忆工具 + 网络搜索工具）。
     *
     * @param memoryStore 用户记忆存储（T8.3）；null → 不注册 memory_* 工具
     * @param username    当前用户名（memory 工具的用户维度）；可为 null（工具执行时返回未登录错误）
     * @param webSearch   网络搜索服务（T8.4）；null → 不注册 web_search 工具
     */
    public static ToolRegistry createFullRegistry(DocSysClient client, UserMemoryStore memoryStore,
                                                  String username, WebSearchService webSearch) {
        ToolRegistry reg = createReadOnlyRegistry(client);
        // 写操作工具组（T3.2）
        reg.register(createRepos(client));
        reg.register(deleteRepos(client));
        reg.register(updateRepos(client));
        reg.register(createFolder(client));
        reg.register(writeFile(client));
        reg.register(writeNote(client));
        reg.register(deleteDoc(client));
        reg.register(renameDoc(client));
        reg.register(moveDoc(client));
        reg.register(copyDoc(client));
        // P4 下线（2026-09-19）：lock_doc / unlock_doc（协作编辑语义的 2h FORCE 锁，
        // 失败后不自解，是 move_doc 锁冲突故障的直接诱因）
        reg.register(createDocShare(client));
        reg.register(backupRepos(client));
        // 用户记忆工具组（T8.3）：存储可用时才注册
        if (memoryStore != null) {
            reg.register(memorySet(memoryStore, username));
            reg.register(memoryGet(memoryStore, username));
            reg.register(memoryList(memoryStore, username));
        }
        // 网络搜索工具（T8.4）：服务可用时才注册
        if (webSearch != null) {
            reg.register(webSearch(webSearch));
        }
        return reg;
    }

    // ==================== 工具定义 ====================

    /** R1 当前登录用户 */
    public static ToolDefinition getLoginUser(DocSysClient client) {
        return ToolDefinition.builder("get_login_user", "获取当前登录用户信息",
                args -> ToolResult.ok(fmt(client.getLoginUser())))
                .build();
    }

    /** R2 列出仓库 */
    public static ToolDefinition listRepos(DocSysClient client) {
        return ToolDefinition.builder("list_repos", "列出当前用户可见的仓库列表",
                args -> ToolResult.ok(fmt(client.getReposList())))
                .build();
    }

    /** R4 仓库详情 */
    public static ToolDefinition getRepos(DocSysClient client) {
        JSONObject props = props(intProp("vid", "仓库ID"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("get_repos", "获取指定仓库的详细信息",
                args -> ToolResult.ok(fmt(client.getRepos(args.getInteger("vid")))))
                .parameters(schema)
                .build();
    }

    /** R5 文档列表（R1-6：下钻用 path，不再有 docId 参数——实测该参数在服务端不生效） */
    public static ToolDefinition listDocs(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "目录的相对路径（可选，如 \"66666/\"；“根目录”传空串或省略）"),
                intProp("offset", "分页起点（可选，默认 0）"),
                intProp("limit", "本页条数（可选，默认 " + DOC_LIST_DEFAULT_LIMIT + "，最大 " + DOC_LIST_MAX_LIMIT + "）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("list_docs",
                "列出指定仓库/目录的文档清单（紧凑表格：类型/名称/大小/日期）。"
                + "不传 path 时返回仓库根目录内容；查看子目录请传该子目录的 path（如 \"66666/\"）。"
                + "目录项多时结果会自动分页（表头给出总数与当前区间），用 offset/limit 翻页；"
                + "找特定文件建议用 search_files/grep_files 按关键字检索，而不是逐页翻目录。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    String normPath = normalizeDocPath(args.getString("path"));
                    String argPath = normPath.isEmpty() ? null : normPath;
                    return ToolResult.ok(formatDocListPage(
                            client.getDocList(vid, null, null, argPath),
                            vid, argPath, null,
                            args.getInteger("offset"), args.getInteger("limit")));
                })
                .parameters(schema)
                .build();
    }

    /** R6 文档内容（R1-6：path+name 定位，已去掉 docId 参数） */
    public static ToolDefinition getDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID"),
                strProp("path", "文档所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档名（必填，来自 list_docs 结果的 name 列）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("get_doc",
                "获取文档内容（docText）。定位用 path+name：path 是它所在目录的相对路径（以 / 结尾，根目录空串），"
                + "name 是文件名，两者都从 list_docs 结果里取。不要传 docId。",
                args -> ToolResult.ok(fmt(client.getDoc(args.getInteger("vid"),
                        null, normalizeDocPath(args.getString("path")), args.getString("name")))))
                .parameters(schema)
                .build();
    }

    /** R8 版本历史（R1-4/R1-6：改用 path+name 定位，不再用 docId） */
    public static ToolDefinition getDocHistory(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档/目录名（必填，来自 list_docs 的 name 列）"),
                intProp("maxLogNum", "最多返回的提交数（可选，默认 100）"),
                strProp("commitId", "从该 commitId 更早的历史开始取（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("get_doc_history",
                "获取文档（或目录）的版本历史。定位用 path+name：path 是它所在目录的相对路径"
                + "（以 / 结尾，根目录用空串），name 是它自己的名字，两者都从 list_docs 结果里取。"
                + "不要传 docId：docId 会随移动/重命名失效，而且只传 docId 时服务端会把它当成仓库根目录、"
                + "静默返回整个仓库的历史（不是该文件的历史）。",
                args -> ToolResult.ok(fmt(client.getDocHistory(
                        args.getInteger("vid"), null,
                        normalizeDocPath(args.getString("path")), args.getString("name"),
                        levelOfDocPath(args.getString("path")), null,
                        args.getInteger("maxLogNum"), args.getString("commitId")))))
                .parameters(schema)
                .build();
    }

    /** R9 Agent 专用索引搜索（T1：/Doc/agentSearchDoc.do mode=index） */
    public static ToolDefinition searchFiles(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填，单仓库；不确定先调 list_repos）"),
                strProp("query", "查询条件（必填，JSON 字符串）。格式：{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}],\"should\":[{\"field\":\"name\",\"term\":\"周报\",\"match\":\"fuzzy\"}],\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}。field: name(文件名)/content(文件内容)/comment(备注)；match: term(默认,中文分词)/wildcard/prefix/fuzzy(后三种仅 name)"),
                strProp("path", "目录限定（可选，仓库内相对路径，如 /docs/2026）"),
                intProp("maxResults", "最大结果数（可选，默认 20，上限 100）"),
                boolProp("withSnippet", "是否返回命中片段（可选，默认 true）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "query"});
        return ToolDefinition.builder("search_files",
                "在指定仓库内基于全文索引搜索文档（文件名/文件内容/备注），支持与或非(must/should/mustNot)组合。"
                        + "注意：文件刚被直接放入仓库目录、尚未建立索引时可能搜不到——此时改用 grep_files。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID，不确定先调 list_repos）");
                    }
                    String query = args.getString("query");
                    if (query == null || query.isEmpty()) {
                        return ToolResult.error("query 必填（JSON 字符串，见参数说明）");
                    }
                    try {
                        return ToolResult.ok(fmt(client.agentSearchDocs(
                                vid, query, args.getString("path"),
                                args.getInteger("maxResults"), args.getBoolean("withSnippet"))));
                    } catch (Exception e) {
                        return ToolResult.error("search_files failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .build();
    }

    /** R9b Agent 磁盘扫描搜索（T2：/Doc/agentSearchDoc.do mode=grep，不依赖索引） */
    public static ToolDefinition grepFiles(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填，单仓库；不确定先调 list_repos）"),
                strProp("pattern", "搜索关键词（必填）"),
                strProp("path", "目录限定（可选，仓库内相对路径，如 /docs/2026）"),
                intProp("maxResults", "最大结果数（可选，默认 20，上限 100）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "pattern"});
        return ToolDefinition.builder("grep_files",
                "直接在仓库磁盘上逐行扫描文本文件内容（不依赖索引，较慢）。"
                        + "用于 search_files 搜不到的情况（文件刚放入仓库尚未建立索引），或需要精确匹配原始文本时。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID，不确定先调 list_repos）");
                    }
                    String pattern = args.getString("pattern");
                    if (pattern == null || pattern.isEmpty()) {
                        return ToolResult.error("pattern 必填（搜索关键词）");
                    }
                    try {
                        return ToolResult.ok(fmt(client.grepFiles(
                                vid, pattern, args.getString("path"),
                                args.getInteger("maxResults"))));
                    } catch (Exception e) {
                        return ToolResult.error("grep_files failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .build();
    }

    /** R15 分享列表 */
    public static ToolDefinition getDocShareList(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID"),
                longProp("docId", "文档ID"),
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId"});
        return ToolDefinition.builder("get_doc_share_list", "获取文档的分享列表",
                args -> ToolResult.ok(fmt(client.getDocShareList(args.getInteger("vid"),
                        args.getLong("docId"), args.getString("path"), args.getString("name")))))
                .parameters(schema)
                .build();
    }

    /** R16 备份任务状态 */
    public static ToolDefinition queryBackupStatus(DocSysClient client) {
        JSONObject schema = objSchema(props(strProp("taskId", "备份任务ID（必填）")), new String[]{"taskId"});
        return ToolDefinition.builder("query_backup_status", "查询备份任务状态",
                args -> ToolResult.ok(fmt(client.queryBackupStatus(args.getString("taskId")))))
                .parameters(schema)
                .build();
    }

    // ==================== 写操作工具（T3.2，全部 needsConfirm） ====================

    /** W1 创建仓库 */
    public static ToolDefinition createRepos(DocSysClient client) {
        JSONObject props = props(
                strProp("name", "仓库名称（必填）"),
                strProp("path", "存储路径（必填）"),
                strProp("info", "描述（可选）"),
                intProp("type", "仓库类型（0=本地，默认0）"),
                intProp("verCtrl", "版本控制（0=无，1=SVN，2=GIT，可选）"));
        JSONObject schema = objSchema(props, new String[]{"name", "path"});
        return ToolDefinition.builder("create_repos", "创建新仓库",
                args -> ToolResult.ok(fmt(client.addRepos(
                        args.getString("name"), args.getString("info"),
                        args.getInteger("type"), args.getString("path"),
                        null, args.getInteger("verCtrl"), null, null, null, null, null,
                        null, null, null, null, null, null))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W2 删除仓库 */
    public static ToolDefinition deleteRepos(DocSysClient client) {
        JSONObject schema = objSchema(props(intProp("vid", "仓库ID（必填）")), new String[]{"vid"});
        return ToolDefinition.builder("delete_repos", "删除仓库（不可恢复，需确认）",
                args -> ToolResult.ok(fmt(client.deleteRepos(args.getInteger("vid")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W3 更新仓库信息 */
    public static ToolDefinition updateRepos(DocSysClient client) {
        JSONObject props = props(
                intProp("reposId", "仓库ID（必填）"),
                strProp("name", "新名称（可选）"),
                strProp("info", "新描述（可选）"),
                strProp("path", "新路径（可选）"));
        JSONObject schema = objSchema(props, new String[]{"reposId"});
        return ToolDefinition.builder("update_repos", "更新仓库信息",
                args -> ToolResult.ok(fmt(client.updateReposInfo(
                        args.getInteger("reposId"), args.getString("name"), args.getString("info"),
                        null, args.getString("path"), null, null, null, null, null, null, null,
                        null, null, null, null, null))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W4a 创建目录（文件夹）（R1-6：pid → path） */
    public static ToolDefinition createFolder(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "父目录的相对路径（必填，如 \"66666/\"；根目录传空串 \"\"）"),
                strProp("name", "目录名（必填）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("create_folder",
                "在指定目录下创建文件夹。path = 父目录的相对路径（根目录传空串），name = 新目录名；"
                        + "定位全用 path，不要传 docId 或 pid。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID）");
                    }
                    try {
                        return ToolResult.ok(fmt(callWithLockRetry("create_folder", () -> client.addDoc(
                                vid, null, normalizeDocPath(args.getString("path")),
                                args.getString("name"), 2, null, null, args.getString("commitMsg")))));
                    } catch (Exception e) {
                        return ToolResult.error("create_folder failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W4b 创建/覆盖写入文本文件（T4：/Doc/agentWriteText.do，实体文件，不走 uploadDoc） */
    public static ToolDefinition writeFile(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "目标目录的相对路径（必填，如 \"66666/\"；根目录传空串 \"\"）"),
                strProp("name", "文件名（必填，含后缀）"),
                strProp("content", "文件内容（必填，大模型生成的文本，UTF-8，1MB 以内）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name", "content"});
        return ToolDefinition.builder("write_file",
                "创建或覆盖写入【文本】文件（txt/md/json/xml/sql/代码/脚本等）。文件不存在则创建，存在则覆盖。"
                        + "path = 目标目录的相对路径（根目录传空串），name = 文件名（含后缀）；不要传 docId/pid。"
                        + "写入的是仓库实体文件。仅支持文本类型，Office 文件暂不支持。"
                        + "要写备注（虚拟内容）用 write_note，建目录用 create_folder。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID）");
                    }
                    String content = args.getString("content");
                    if (content == null || content.isEmpty()) {
                        return ToolResult.error("content 必填（文本文件内容）");
                    }
                    try {
                        return ToolResult.ok(fmt(callWithLockRetry("write_file", () -> client.writeTextDoc(
                                vid, normalizeDocPath(args.getString("path")),
                                args.getString("name"), content, args.getString("commitMsg")))));
                    } catch (Exception e) {
                        return ToolResult.error("write_file failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W4c 创建/更新文档备注（虚拟内容，不产生实体文件） */
    public static ToolDefinition writeNote(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "文档所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档名（必填）"),
                strProp("content", "备注内容（必填）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name", "content"});
        return ToolDefinition.builder("write_note",
                "创建或更新文档【备注】（虚拟内容，不产生实体文件）。文档不存在时自动创建文档条目并写入备注。"
                        + "定位用 path+name（都从 list_docs 取）；不要传 docId。要写入实体文件用 write_file。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID）");
                    }
                    String content = args.getString("content");
                    if (content == null || content.isEmpty()) {
                        return ToolResult.error("content 必填（备注内容）");
                    }
                    try {
                        String path = normalizeDocPath(args.getString("path"));
                        String name = args.getString("name");
                        String commitMsg = args.getString("commitMsg");
                        Map<String, Object> res = callWithLockRetry("write_note", () -> client.updateDocContent(
                                vid, null, path, name, content, null, commitMsg));
                        String status = res != null ? String.valueOf(res.get("status")) : "fail";
                        String msg = res != null ? String.valueOf(res.get("msgInfo")) : "";
                        if ("ok".equals(status)) {
                            return ToolResult.ok(fmt(res));
                        }
                        if (msg != null && msg.contains("不存在")) {
                            // 文档不存在 → 创建条目并写入备注（addDoc+content 即备注语义）
                            Map<String, Object> created = callWithLockRetry("write_note", () -> client.addDoc(
                                    vid, null, path, name, 1, null, content, commitMsg));
                            return ToolResult.ok(fmt(created));
                        }
                        return ToolResult.error(msg != null && !msg.isEmpty() ? msg : "更新备注失败");
                    } catch (Exception e) {
                        return ToolResult.error("write_note failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W5 删除文档（R1-6：path/name 必填） */
    public static ToolDefinition deleteDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "文档所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档名（必填）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("delete_doc",
                "删除文档（文件或目录，需确认）。定位用 path+name（都从 list_docs 取）；不要传 docId/pid。",
                args -> ToolResult.ok(fmt(callWithLockRetry("delete_doc", () -> client.deleteDoc(
                        args.getInteger("vid"), null, null,
                        normalizeDocPath(args.getString("path")), args.getString("name"), null,
                        args.getString("commitMsg"))))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W6 重命名文档（R1-6：path/name 必填；dstName = 新名） */
    public static ToolDefinition renameDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "文档所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档原名（必填）"),
                strProp("dstName", "新名称（必填）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name", "dstName"});
        return ToolDefinition.builder("rename_doc",
                "重命名文档（文件或目录）。定位用 path+name（都从 list_docs 取），dstName 是新名字；不要传 docId/pid。",
                args -> ToolResult.ok(fmt(callWithLockRetry("rename_doc", () -> client.renameDoc(
                        args.getInteger("vid"), null, null,
                        normalizeDocPath(args.getString("path")), args.getString("name"), null,
                        args.getString("dstName"), args.getString("commitMsg"))))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W7 移动文档（R1-6：path/name 定位，目标目录用 dstPath） */
    public static ToolDefinition moveDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("srcPath", "源文件所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("srcName", "源文件名（必填，来自 list_docs 的 name 列）"),
                strProp("dstPath", "目标目录的路径（必填，如 \"66666/\"；仓库根目录传空串 \"\"）"),
                strProp("dstName", "移动后的新名（可选，不填则沿用原名）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "srcPath", "srcName", "dstPath"});
        return ToolDefinition.builder("move_doc",
                "移动文档（文件或目录）到另一个目录。定位一律用 path+name：srcPath 是源文件所在目录的路径，"
                + "srcName 是它的名字，dstPath 是**目标目录**的路径（子目录写 \"父目录/子目录名/\"，仓库根目录写空串）；"
                + "两者都从 list_docs 结果里取。不要用 docId/dstPid。",
                args -> ToolResult.ok(fmt(callWithLockRetry("move_doc", () -> client.moveDoc(
                        args.getInteger("vid"), null,
                        null, normalizeDocPath(args.getString("srcPath")), args.getString("srcName"),
                        levelOfDocPath(args.getString("srcPath")),
                        null, normalizeDocPath(args.getString("dstPath")), args.getString("dstName"),
                        levelOfDocPath(args.getString("dstPath")),
                        null, args.getString("commitMsg"))))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W8 复制文档（R1-6：path/name 定位） */
    public static ToolDefinition copyDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("srcPath", "源文件所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("srcName", "源文件名（必填，来自 list_docs 的 name 列）"),
                strProp("dstPath", "目标目录的路径（必填，如 \"66666/\"；仓库根目录传空串 \"\"）"),
                strProp("dstName", "复制后的新名（可选，不填则沿用原名）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "srcPath", "srcName", "dstPath"});
        return ToolDefinition.builder("copy_doc",
                "复制文档（文件或目录）到另一个目录。参数口径与 move_doc 完全一致，"
                + "都用 srcPath+srcName 定位源、dstPath 指定目标目录；不要用 docId/dstPid。",
                args -> ToolResult.ok(fmt(callWithLockRetry("copy_doc", () -> client.copyDoc(
                        args.getInteger("vid"), null,
                        null, normalizeDocPath(args.getString("srcPath")), args.getString("srcName"),
                        levelOfDocPath(args.getString("srcPath")),
                        null, normalizeDocPath(args.getString("dstPath")), args.getString("dstName"),
                        levelOfDocPath(args.getString("dstPath")),
                        null, args.getString("commitMsg"))))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W12 创建文档分享 */
    public static ToolDefinition createDocShare(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID（必填）"),
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（可选）"),
                intProp("shareType", "分享类型（可选）"),
                strProp("sharePwd", "分享密码（可选）"),
                longProp("expireTime", "过期时间戳（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId"});
        return ToolDefinition.builder("create_doc_share", "创建文档分享链接",
                args -> ToolResult.ok(fmt(client.createDocShare(
                        args.getInteger("vid"), args.getLong("docId"), args.getString("path"),
                        args.getString("name"), args.getInteger("shareType"),
                        args.getString("sharePwd"), args.getLong("expireTime")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W13 触发仓库备份 */
    public static ToolDefinition backupRepos(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("backupStorePath", "备份存储路径（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("backup_repos", "触发仓库完整备份",
                args -> ToolResult.ok(fmt(client.backupRepos(
                        args.getInteger("vid"), args.getString("backupStorePath")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    // ==================== 用户记忆工具（T8.3） ====================

    /**
     * M1 写入用户记忆（跨会话偏好/上下文）。
     *
     * <p>用户明确表达偏好、身份、常用设定等时使用（如"我喜欢简洁回答""我主要做数据库运维"）。
     * isWrite=true（写入持久化存储、纳入审计）但 needsConfirm=false（低风险自我记忆，非文档/仓库操作，
     * 每次弹确认会打断 Agent 记忆流程）。</p>
     *
     * @param store    用户记忆存储（不可为 null）
     * @param username 当前用户名（可为 null → 执行返回未登录错误）
     */
    /**
     * P2：附件工具 —— 读取<b>本轮用户上传的临时附件</b>（不在仓库里）。
     *
     * <p>会话目录由调用方按请求捕获（仿 memorySet(store, username) 模式）；
     * 目录不存在 或 无附件 → 返回“无附件”，不报错。</p>
     *
     * @param sessionDir 会话附件目录（可为 null）
     */
    public static ToolDefinition attachment(java.io.File sessionDir) {
        JSONObject props = props(
                strProp("action", "操作：list（列出本轮全部附件）或 read（读取指定附件内容）。必填，示例 \"list\""),
                strProp("name", "附件名（action=read 时必填，名字来自【本轮附件】段，示例 \"需求.docx\"）"));
        JSONObject schema = objSchema(props, new String[]{"action"});
        return ToolDefinition.builder("attachment",
                "读取本轮用户上传的临时附件（用户随消息上传、不在仓库里的文件）。"
                + "action=list 列出附件；action=read + name 读取指定附件：文本类返回内容（可能截断），"
                + "图片/二进制只返回元信息（不得臆造内容）。注意：附件不属于仓库，不要用 get_doc/search_files 去找它们。",
                args -> {
                    String action = args.getString("action");
                    action = (action == null || action.trim().isEmpty()) ? "list" : action.trim().toLowerCase();
                    java.util.List<com.DocSystem.agent.attachment.AgentAttachmentSupport.Item> items =
                            com.DocSystem.agent.attachment.AgentAttachmentSupport.listItems(sessionDir);
                    if ("list".equals(action)) {
                        if (items.isEmpty()) {
                            return ToolResult.ok("本轮没有上传附件");
                        }
                        return ToolResult.ok(com.DocSystem.agent.attachment.AgentAttachmentSupport.renderLines(items)
                                + "（用 attachment(action=\"read\", name=\"...\") 读取内容）");
                    }
                    if ("read".equals(action)) {
                        String name = args.getString("name");
                        java.io.File f = com.DocSystem.agent.attachment.AgentAttachmentSupport.resolve(sessionDir, name);
                        if (f == null) {
                            return ToolResult.error("附件不存在：" + name + "（先用 action=list 查看本轮附件）");
                        }
                        try {
                            com.DocSystem.agent.attachment.AgentAttachmentSupport.ReadResult r =
                                    com.DocSystem.agent.attachment.AgentAttachmentSupport.readForTool(f, f.getName());
                            if (r == null) {
                                return ToolResult.error("附件不可读：" + name);
                            }
                            if ("text".equals(r.kind)) {
                                String head = r.meta + (r.truncated ? "（内容过长，已截断）" : "");
                                return ToolResult.ok(head + "\n---\n" + r.content);
                            }
                            return ToolResult.ok(r.meta);
                        } catch (java.io.IOException e) {
                            return ToolResult.error("附件读取失败：" + e.getMessage());
                        }
                    }
                    return ToolResult.error("不支持的 action：" + action + "（可选 list / read）");
                }).parameters(schema).build();
    }

    public static ToolDefinition memorySet(UserMemoryStore store, String username) {
        JSONObject props = props(
                strProp("key", "记忆键（必填）。建议带命名空间，如 user.preference / user.preferred_language / user.workplace。示例：\"key\":\"user.preference\""),
                strProp("value", "记忆值（必填）。用户偏好/上下文的实际内容。示例：\"value\":\"喜欢简洁的中文回答\""));
        JSONObject schema = objSchema(props, new String[]{"key", "value"});
        return ToolDefinition.builder("memory_set",
                "保存一条跨会话用户记忆（偏好/上下文）。当用户明确表达个人偏好、身份、常用设定时使用。"
                + "必须传 key（记忆键）+ value（记忆内容），例如 memory_set(key=\"user.preference\", value=\"喜欢简洁回答\")。"
                + "注意：不要用 content 或 message 字段代替 key/value",
                args -> {
                    String key = args.getString("key");
                    String value = args.getString("value");
                    if (username == null || username.isEmpty()) {
                        return ToolResult.error("当前用户未登录，无法保存记忆");
                    }
                    // 容错（T8.3.1）：模型偶发用 content 传内容而缺 key/value → 自动映射 user.preference，
                    // 避免一次有效记忆因参数命名偏差而保存失败
                    if (key == null || key.trim().isEmpty()) {
                        String content = args.getString("content");
                        if (content != null && !content.trim().isEmpty()
                                && (value == null || value.trim().isEmpty())) {
                            value = content.trim();
                        }
                        if (value != null && !value.trim().isEmpty()) {
                            key = "user.preference";
                        }
                    }
                    if (key == null || key.trim().isEmpty()) {
                        return ToolResult.error("key 不能为空（请传 key + value，如 key=\"user.preference\", value=\"...\"）");
                    }
                    if (value == null || value.trim().isEmpty()) {
                        return ToolResult.error("value 不能为空（请传 key + value，如 key=\"user.preference\", value=\"...\"）");
                    }
                    boolean ok = store.set(username, key.trim(), value.trim());
                    return ok ? ToolResult.ok("已保存记忆 " + key.trim() + " = " + value.trim())
                              : ToolResult.error("保存记忆失败（存储不可用）");
                })
                .parameters(schema)
                .isWrite(true)
                .build();
    }

    /** M2 读取用户记忆 */
    public static ToolDefinition memoryGet(UserMemoryStore store, String username) {
        JSONObject props = props(strProp("key", "记忆键"));
        JSONObject schema = objSchema(props, new String[]{"key"});
        return ToolDefinition.builder("memory_get", "读取一条用户记忆（偏好/上下文）。回答前可先查用户偏好",
                args -> {
                    String key = args.getString("key");
                    if (username == null || username.isEmpty()) {
                        return ToolResult.error("当前用户未登录，无法读取记忆");
                    }
                    if (key == null || key.trim().isEmpty()) {
                        return ToolResult.error("key 不能为空");
                    }
                    String value = store.get(username, key.trim());
                    if (value == null) {
                        return ToolResult.ok("该记忆不存在");
                    }
                    return ToolResult.ok(key.trim() + " = " + value);
                })
                .parameters(schema)
                .build();
    }

    /** M3 列出用户全部记忆 */
    public static ToolDefinition memoryList(UserMemoryStore store, String username) {
        return ToolDefinition.builder("memory_list", "列出当前用户已保存的全部记忆（偏好/上下文）。不确定有哪些记忆时先调用它",
                args -> {
                    if (username == null || username.isEmpty()) {
                        return ToolResult.error("当前用户未登录，无法读取记忆");
                    }
                    Map<String, String> mem = store.list(username);
                    if (mem == null || mem.isEmpty()) {
                        return ToolResult.ok("（暂无已保存的记忆）");
                    }
                    StringBuilder sb = new StringBuilder();
                    for (Map.Entry<String, String> e : mem.entrySet()) {
                        sb.append(e.getKey()).append(" = ").append(e.getValue()).append("\n");
                    }
                    return ToolResult.ok(truncate(sb.toString().trim()));
                })
                .build();
    }

    // ==================== 网络搜索工具（T8.4） ====================

    /**
     * S1 网络搜索（只读）。
     *
     * <p>本地文档库找不到答案时联网检索补充信息。失败安全：网络错误/超时返回清晰错误，
     * 不抛异常中断工具链。结果上限 10 条（防上下文膨胀）。</p>
     *
     * @param searchService 网络搜索服务（不可为 null）
     */
    public static ToolDefinition webSearch(WebSearchService searchService) {
        JSONObject props = props(
                strProp("query", "搜索关键词"),
                intProp("maxResults", "返回结果条数（可选，默认5，上限10）"));
        JSONObject schema = objSchema(props, new String[]{"query"});
        return ToolDefinition.builder("web_search", "联网搜索网络信息并返回结果列表（标题/链接/摘要）。本地文档库找不到答案或需要最新信息时使用",
                args -> {
                    String query = args.getString("query");
                    if (query == null || query.trim().isEmpty()) {
                        return ToolResult.error("query 不能为空");
                    }
                    Integer maxResults = args.getInteger("maxResults");
                    WebSearchService.SearchOutcome outcome =
                            searchService.search(query, maxResults != null ? maxResults : 5);
                    if (!outcome.isSuccess()) {
                        return ToolResult.error(outcome.error);
                    }
                    if (outcome.results.isEmpty()) {
                        return ToolResult.ok("未找到相关网络结果。");
                    }
                    StringBuilder sb = new StringBuilder();
                    sb.append("网络搜索结果（").append(outcome.results.size()).append(" 条）：\n");
                    int idx = 1;
                    for (WebSearchResult r : outcome.results) {
                        sb.append(idx++).append(". ").append(r.title).append("\n");
                        if (r.url != null && !r.url.isEmpty()) {
                            sb.append("   链接: ").append(r.url).append("\n");
                        }
                        if (r.snippet != null && !r.snippet.isEmpty()) {
                            sb.append("   摘要: ").append(r.snippet).append("\n");
                        }
                    }
                    return ToolResult.ok(truncate(sb.toString().trim()));
                })
                .parameters(schema)
                .build();
    }

    // ==================== Skill 工具（T4.4） ====================

    /**
     * 通用技能执行工具 —— 把 SkillExecutorRegistry 暴露给 LLM。
     *
     * <p>技能可执行任意逻辑（内置 Java handler / Python / CLI），故标记 isWrite + needsConfirm
     * （执行前需用户确认）。由 MainAgent 在 per-request registry 上按需注册。</p>
     *
     * @param skillExecutorRegistry 技能执行注册表（可为 null → 不注册）
     * @param context               当前 AgentContext
     */
    public static ToolDefinition runSkillTool(
            com.DocSystem.agent.skill.executor.SkillExecutorRegistry skillExecutorRegistry,
            com.DocSystem.agent.core.AgentContext context) {
        JSONObject props = props(
                strProp("skillId", "技能 ID（必填）"),
                strProp("params", "技能参数（JSON 对象字符串，可选）"));
        JSONObject schema = objSchema(props, new String[]{"skillId"});
        String skillList = buildSkillListForPrompt();
        String description = "执行指定技能（skill）。技能是系统预置或外部安装的能力模块（Python/CLI 自动化）。"
                + (skillList.isEmpty() ? "" : " 可用技能: " + skillList);
        return ToolDefinition.builder("run_skill", description,
                args -> {
                    String skillId = args.getString("skillId");
                    if (skillId == null || skillId.isEmpty()) {
                        return ToolResult.error("skillId is required");
                    }
                    java.util.Map<String, String> params = new java.util.HashMap<>();
                    String paramsStr = args.getString("params");
                    if (paramsStr != null && !paramsStr.isEmpty()) {
                        try {
                            JSONObject p = JSON.parseObject(paramsStr);
                            if (p != null) {
                                for (Map.Entry<String, Object> e : p.entrySet()) {
                                    params.put(e.getKey(), String.valueOf(e.getValue()));
                                }
                            }
                        } catch (Exception pe) {
                            return ToolResult.error("params 不是合法 JSON: " + pe.getMessage());
                        }
                    }
                    com.DocSystem.agent.skill.executor.SkillExecutionResult r =
                            skillExecutorRegistry.execute(skillId, params, context);
                    if (r.success()) {
                        return ToolResult.ok(r.output() != null ? truncate(r.output()) : "(skill ok)");
                    }
                    return ToolResult.error(r.error() != null ? r.error() : "skill execution failed");
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    // ==================== 辅助 ====================

    /**
     * 构建可用技能清单文本（供 run_skill 描述注入提示词）。
     * 从 EnhancedSkillManager 读取（含目录加载的外部技能），截断防上下文膨胀。
     */
    private static String buildSkillListForPrompt() {
        try {
            java.util.Collection<com.DocSystem.agent.skill.EnhancedSkill> skills =
                    com.DocSystem.agent.skill.EnhancedSkillManager.getInstance().getAllSkills();
            if (skills == null || skills.isEmpty()) {
                return "";
            }
            StringBuilder sb = new StringBuilder();
            int budget = 1500;
            for (com.DocSystem.agent.skill.EnhancedSkill s : skills) {
                if (s == null || s.getId() == null) continue;
                String name = s.getName() != null ? s.getName() : s.getId();
                String desc = s.getDescription() != null ? s.getDescription() : "";
                String item = s.getId() + "(" + name + (desc.isEmpty() ? "" : ": " + desc) + "); ";
                if (budget - item.length() < 0) {
                    sb.append("...");
                    break;
                }
                sb.append(item);
                budget -= item.length();
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    /** 格式化 DocSysClient 返回的 Map 为紧凑文本（截断防上下文膨胀；失败时附错误码与处置提示） */
    static String fmt(Map<String, Object> result) {
        if (result == null) {
            return "(empty response)";
        }
        String json = JSON.toJSONString(result);
        String code = errorCodeOf(result);
        if (code == null) {
            return truncate(json);
        }
        // 处置提示必须能被模型看到：先给提示预留空间再截 JSON，否则超长响应会把尾部的错误码提示一起截掉
        String hint = "\n[错误码: " + code + "]" + guidanceFor(code);
        if (json.length() + hint.length() > MAX_SUMMARY_LEN) {
            json = json.substring(0, Math.max(0, MAX_SUMMARY_LEN - hint.length())) + "...(truncated)";
        }
        return json + hint;
    }

    /** 取响应里的错误码（服务端 R1-1 起在 ReturnAjax 输出 errorCode） */
    static String errorCodeOf(Map<String, Object> resp) {
        if (resp == null) {
            return null;
        }
        Object code = resp.get("errorCode");
        if (code == null) {
            return null;
        }
        String s = String.valueOf(code);
        return s.isEmpty() || "null".equals(s) ? null : s;
    }

    /** 错误码 -> 给模型的处置提示（避免模型对"权限不足"盲目重试、对"docId 失效"反复试同一个 id） */
    static String guidanceFor(String errorCode) {
        if (ErrorCode.DOC_LOCKED.equals(errorCode)) {
            return "（文档正被后台动作占用，稍后重试即可；工具已自动重试过）";
        }
        if (ErrorCode.NO_PERMISSION.equals(errorCode)) {
            return "（当前用户权限不足，重试无效：请换目标对象或联系管理员授权）";
        }
        if (ErrorCode.DOC_NOT_FOUND.equals(errorCode)) {
            return "（对象不存在或 docId 已失效：请重新 list_docs/search_files 获取最新 docId）";
        }
        if (ErrorCode.REPOS_NOT_FOUND.equals(errorCode)) {
            return "（仓库不存在或已禁用：先用 list_repos 确认仓库 ID）";
        }
        if (ErrorCode.INVALID_PARAM.equals(errorCode)) {
            return "（参数缺失或非法，请修正入参后重试）";
        }
        if (ErrorCode.NOT_LOGIN.equals(errorCode)) {
            return "（登录已失效，请重新登录）";
        }
        if (ErrorCode.SYSTEM_BUSY.equals(errorCode)) {
            return "（服务端维护中，非调用方可解决）";
        }
        if (ErrorCode.TASK_NOT_FOUND.equals(errorCode)) {
            return "（该任务不存在或已被回收：请重新发起任务，不要沿用旧 taskId）";
        }
        if (ErrorCode.SHARE_NOT_FOUND.equals(errorCode)) {
            return "（分享不存在或已被撤销：请重新获取分享列表，不要沿用旧 shareId）";
        }
        if (ErrorCode.INTERNAL.equals(errorCode)) {
            return "（服务端内部错误：重试无效，请记录错误码并反馈管理员）";
        }
        return "";
    }

    // ==================== 目录列表渲染（分页 + 紧凑，2026-09-20） ====================

    /** list_docs 单页默认/最大条数 */
    static final int DOC_LIST_DEFAULT_LIMIT = 50;
    static final int DOC_LIST_MAX_LIMIT = 200;

    /** 列表渲染字符预算（低于 MAX_SUMMARY_LEN，确保不会被 truncate 砍成半截） */
    private static final int DOC_LIST_CHAR_BUDGET = 3600;

    /**
     * 把 `/Repos/getSubDocList.do` 的响应渲染成<b>紧凑清单</b>，并按 offset/limit 分页。
     *
     * <p><b>为什么不再直接倒 JSON</b>：该接口每项含 20+ 字段（localRootPath/reposPath/localVRootPath/
     * officeType/creatorName/…），单条约 300~400 字符。仓库根目录 90+ 项即 ~30KB，经 {@link #truncate}
     * 截到 4000 字符后 JSON 只剩半截——模型既解析不了、也拿不到后面的条目（2026-09-20 实测踩坑）。
     * 这里只保留模型真正需要的类型/名称/大小/日期/docId，并给出总数与翻页提示，
     * 让"大目录"变成"可分页的紧凑清单"。
     */
    static String formatDocListPage(Map<String, Object> resp, Integer vid, String path, Long docId,
                                    Integer offsetArg, Integer limitArg) {
        if (resp == null) {
            return "(empty response)";
        }
        String status = String.valueOf(resp.get("status"));
        if (!"ok".equals(status)) {
            return "list_docs 失败: " + resp.get("msgInfo");
        }

        String where = describeTarget(vid, path, docId);
        Object data = resp.get("data");
        if (!(data instanceof List)) {
            return "目录为空或不存在：" + where + "（服务器返回：" + data + "）";
        }

        List<?> all = (List<?>) data;
        int total = all.size();
        if (total == 0) {
            return "目录为空：" + where;
        }

        int offset = offsetArg == null ? 0 : Math.max(0, offsetArg.intValue());
        int limit = limitArg == null ? DOC_LIST_DEFAULT_LIMIT
                : Math.min(DOC_LIST_MAX_LIMIT, Math.max(1, limitArg.intValue()));
        if (offset >= total) {
            return where + " 共 " + total + " 项；offset=" + offset + " 已超出范围（有效范围 0~" + (total - 1) + "）。";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("目录列表：").append(where).append("  共 ").append(total)
                .append(" 项，本次显示第 ").append(offset + 1).append("-");

        int end = Math.min(total, offset + limit);   // 先按 limit 取，字符超预算再回收
        String body = renderEntries(all, offset, end);
        int cap = DOC_LIST_CHAR_BUDGET - sb.length() - 220;   // 给表头/页脚留余量
        while (body.length() > cap && end - offset > 1) {
            end = offset + Math.max(1, (end - offset) * 3 / 4);
            body = renderEntries(all, offset, end);
        }

        sb.append(end).append(" 项\n");
        sb.append(body);
        sb.append("\n说明：上表各项的 path 与本目录相同（").append(displayPath(path)).append("），");
        sb.append("读取内容用 get_doc(vid=").append(vid).append(", path=").append(quoted(pathLabel(path)))
                .append(", name=<名称>)；进入子目录用 list_docs(vid=").append(vid)
                .append(", path=").append(quoted(childDocPath(path, "<子目录名>"))).append(")。\n");
        if (end < total) {
            sb.append("⚠️ 还有 ").append(total - end).append(" 项未显示：继续调用 list_docs 传 offset=")
                    .append(end).append("；或用 search_files/grep_files 按关键字直接找。");
        }
        return sb.toString();
    }

    /** 目录展示名：根目录给明确字样，避免表尾出现空的括号 */
    private static String displayPath(String path) {
        if (path == null || path.isEmpty()) {
            return "根目录 path=\"\"";
        }
        return "path=\"" + path + "\"";
    }

    /** 渲染 [from, to) 区间的条目行 */
    private static String renderEntries(List<?> all, int from, int to) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Object o = all.get(i);
            if (!(o instanceof Map)) {
                sb.append(i + 1).append(". ").append(o).append("\n");
                continue;
            }
            Map<?, ?> d = (Map<?, ?>) o;
            String name = str(d.get("name"));
            Integer type = intOf(d.get("type"));
            boolean isDir = type != null && type.intValue() == 2;
            sb.append(i + 1).append(". ").append(isDir ? "[目录] " : "[文件] ").append(name);
            if (isDir) {
                sb.append("/");
            } else {
                sb.append("  ").append(sizeText(d.get("size")));
            }
            sb.append("  ").append(dateText(d.get("latestEditTime"))).append("\n");
        }
        return sb.toString();
    }

    // ==================== 文档定位（R1-6：path/name 优先） ====================

    /**
     * 归一化"所在目录的相对路径"（工具层对外只暴露这一种写法，避免模型写出五花八门的 path）。
     *
     * <ul>
     *   <li>{@code null} / {@code ""} / {@code "/"} / {@code "./"} → {@code ""}（仓库根目录）</li>
     *   <li>去掉前导 {@code /}：{@code "/a/b"} → {@code "a/b/"}</li>
     *   <li>折叠重复斜杠与 {@code .} 段：{@code "a//./b"} → {@code "a/b/"}</li>
     *   <li>统一补尾斜杠：{@code "66666"} → {@code "66666/"}（服务端 path 约定以 {@code /} 结尾）</li>
     * </ul>
     *
     * <p>为什么必须归一化：服务端 {@code Path.buildDocIdByName(level, path, name)} 把 {@code path+name}
     * 直接拼在一起算 hash，多一个或少一个斜杠就是**另一个 docId**（不会报错，只会静默定位到错误对象）。
     */
    static String normalizeDocPath(String path) {
        if (path == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (String seg : path.trim().split("/")) {
            // 丢弃空段（折叠重复斜杠与首尾斜杠）与 "." 段；".." 交给服务端拒绝（seperatePathAndName 返回 -2）
            if (seg.isEmpty() || ".".equals(seg)) {
                continue;
            }
            sb.append(seg).append('/');
        }
        return sb.toString();
    }

    /**
     * 由"所在目录的相对路径"推导层级 level（= path 中 {@code /} 的个数）。
     *
     * <p>服务端 {@code buildBasicDoc} 只在 {@code docId == null} 时才用
     * {@code Path.buildDocIdByName(level, path, name)} 算 docId；它**不会**从 path 反推 level，
     * 所以 level 传错 = docId 算错 = 静默定位到别的对象（甚至被当成根目录）。
     *
     * <p>实测口径：仓库根目录下的项 {@code path=""} → level 0；{@code "66666/"} 下的项 → level 1。
     */
    static int levelOfDocPath(String path) {
        String p = normalizeDocPath(path);
        int level = 0;
        for (int i = 0; i < p.length(); i++) {
            if (p.charAt(i) == '/') {
                level++;
            }
        }
        return level;
    }

    /**
     * 由"当前目录 + 子目录名"得到子目录自己的 path（下钻用）。
     *
     * <p>用于替换“用 docId 下钻”的旧口径：模型只需把本目录 path 与子目录名拼上，
     * 不需要先拿 docId（docId 会因移动/重命名失效，且多一层需服务端反查的环节）。
     */
    static String childDocPath(String parentPath, String childName) {
        String parent = normalizeDocPath(parentPath);
        if (childName == null) {
            return parent;
        }
        String n = childName.trim();
        while (n.startsWith("/")) {
            n = n.substring(1);
        }
        while (n.endsWith("/")) {
            n = n.substring(0, n.length() - 1);
        }
        return parent + n + "/";
    }

    private static String describeTarget(Integer vid, String path, Long docId) {
        StringBuilder sb = new StringBuilder("仓库 ").append(vid);
        if (docId != null && docId.longValue() != 0L) {
            sb.append(" / 目录 docId=").append(docId);
        }
        sb.append(" / ").append(path == null || path.isEmpty() ? "根目录（path=\"\"）" : "path=\"" + path + "\"");
        return sb.toString();
    }

    private static String pathLabel(String path) {
        return path == null ? "" : path;
    }

    private static String quoted(String s) {
        return "\"" + s + "\"";
    }

    private static String sizeText(Object size) {
        Long n = longOf(size);
        if (n == null || n.longValue() <= 0) {
            return "0B";
        }
        long v = n.longValue();
        if (v < 1024) {
            return v + "B";
        }
        if (v < 1024 * 1024) {
            return String.format("%.1fKB", v / 1024.0);
        }
        return String.format("%.1fMB", v / (1024.0 * 1024.0));
    }

    private static String dateText(Object millis) {
        Long t = longOf(millis);
        if (t == null || t.longValue() <= 0) {
            return "";
        }
        return new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date(t.longValue()));
    }

    private static Integer intOf(Object o) {
        if (o instanceof Number) {
            return Integer.valueOf(((Number) o).intValue());
        }
        return null;
    }

    private static Long longOf(Object o) {
        if (o instanceof Number) {
            return Long.valueOf(((Number) o).longValue());
        }
        return null;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    // ==================== FORCE 锁占用重试（2026-09-20） ====================

    /**
     * DocSys 文档级写操作在执行期间会对文档加 FORCE 锁，并在**后台异步动作**（版本库提交、
     * 远程/本地备份推送、索引更新）完成后才释放；实测该窗口约 0.6~1.0 秒（依仓库配置与网络可更长）。
     * 窗口内对同一文档（或其父子目录）的任何写操作都会被拒绝，服务端提示
     * {@code 用户[xxx]正在新增/移动文件[yyy],请稍后重试!}。
     *
     * <p>对智能体而言这是"整理资料"链路的必然撞点：先建目标目录 → 立刻把文件移进去，
     * 目标目录（作为父目录参与锁检查）在创建后一秒内仍是锁住的。服务端并未提供错误码，
     * 故此处按提示语识别该可重试场景，自动退避重试；真正失败（权限/不存在）不会命中该标记，不受影响。
     */
    private static final String LOCK_BUSY_MARK = "请稍后重试";

    /** 锁占用时的最大尝试次数 */
    private static final int LOCK_RETRY_MAX_ATTEMPTS = 6;

    /** 每次重试间隔（毫秒）——6 x 500ms 覆盖 ~3 秒窗口 */
    private static final long LOCK_RETRY_INTERVAL_MS = 500;

    /** 可返回 DocSys 响应 Map 的调用（可抛异常） */
    interface DocSysCall {
        Map<String, Object> call() throws Exception;
    }

    /** 执行文档级写调用；命中"文档被锁占用"时自动重试，其余结果原样返回（包级可见：便于护栏测试） */
    static Map<String, Object> callWithLockRetry(String opName, DocSysCall call) throws Exception {
        Map<String, Object> last = null;
        for (int attempt = 1; attempt <= LOCK_RETRY_MAX_ATTEMPTS; attempt++) {
            last = call.call();
            if (!isLockBusy(last)) {
                return last;
            }
            if (attempt == LOCK_RETRY_MAX_ATTEMPTS) {
                break;
            }
            log.info("{} 命中文档锁占用（第 {}/{} 次），{}ms 后重试: {}",
                    opName, attempt, LOCK_RETRY_MAX_ATTEMPTS, LOCK_RETRY_INTERVAL_MS, describe(last));
            try {
                Thread.sleep(LOCK_RETRY_INTERVAL_MS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return last;
            }
        }
        log.warn("{} 重试 {} 次后仍被文档锁占用: {}", opName, LOCK_RETRY_MAX_ATTEMPTS, describe(last));
        return last;
    }

    /** 响应是否表示"文档被 FORCE 锁占用，可稍后重试"（优先按错误码判定，文案仅作过渡期兜底） */
    static boolean isLockBusy(Map<String, Object> resp) {
        if (resp == null) {
            return false;
        }
        Object status = resp.get("status");
        if (status != null && "ok".equals(String.valueOf(status))) {
            return false;
        }
        if (ErrorCode.DOC_LOCKED.equals(errorCodeOf(resp))) {
            return true;
        }
        if (errorCodeOf(resp) != null) {
            //带码但不是锁占用（如 SYSTEM_BUSY / NO_PERMISSION）→ 明确不可重试。
            //不能退回文案判定：reposCheck 的"系统维护中，请稍后重试！"同样含"请稍后重试"，
            //按文案会把"系统维护"误判成"文档锁占用"（R1-1 修正的真问题之一）
            return false;
        }
        //无码（旧服务端）时才按文案兜底判定
        String text = describe(resp);
        return text.contains(LOCK_BUSY_MARK) || text.contains("强制锁定");
    }

    private static String describe(Map<String, Object> resp) {
        if (resp == null) {
            return "null";
        }
        return String.valueOf(resp.get("msgInfo")) + " | " + String.valueOf(resp.get("debugLog"));
    }

    /** 格式化 String 返回（如 RAG/AIChat 的 SSE 原文）为紧凑文本 */
    private static String fmtString(String result) {
        if (result == null) {
            return "(empty response)";
        }
        return truncate(result);
    }

    private static String truncate(String s) {
        if (s.length() > MAX_SUMMARY_LEN) {
            return s.substring(0, MAX_SUMMARY_LEN) + "...(truncated)";
        }
        return s;
    }

    private static JSONObject objSchema(JSONObject props, String[] required) {
        JSONObject schema = new JSONObject();
        schema.put("type", "object");
        schema.put("properties", props);
        if (required != null) {
            schema.put("required", required);
        }
        return schema;
    }

    private static JSONObject props(JSONObject... entries) {
        JSONObject props = new JSONObject();
        for (JSONObject e : entries) {
            if (e != null) {
                props.putAll(e);
            }
        }
        return props;
    }

    /** 生成 {name: {type, description}} 单属性条目 */
    private static JSONObject strProp(String name, String desc) {
        JSONObject o = new JSONObject();
        o.put("type", "string");
        o.put("description", desc);
        JSONObject entry = new JSONObject();
        entry.put(name, o);
        return entry;
    }

    /** 生成 {name: {type: integer, description}} 单属性条目 */
    private static JSONObject intProp(String name, String desc) {
        JSONObject o = new JSONObject();
        o.put("type", "integer");
        o.put("description", desc);
        JSONObject entry = new JSONObject();
        entry.put(name, o);
        return entry;
    }

    /** 生成 {name: {type: integer, description}} 单属性条目（long 语义） */
    private static JSONObject longProp(String name, String desc) {
        JSONObject o = new JSONObject();
        o.put("type", "integer");
        o.put("description", desc);
        JSONObject entry = new JSONObject();
        entry.put(name, o);
        return entry;
    }

    /** 生成 {name: {type: boolean, description}} 单属性条目 */
    private static JSONObject boolProp(String name, String desc) {
        JSONObject o = new JSONObject();
        o.put("type", "boolean");
        o.put("description", desc);
        JSONObject entry = new JSONObject();
        entry.put(name, o);
        return entry;
    }
}
