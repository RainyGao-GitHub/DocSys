package com.DocSystem.agent.tool;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.memory.UserMemoryStore;
import com.DocSystem.agent.search.WebSearchResult;
import com.DocSystem.agent.search.WebSearchService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

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
        reg.register(ragChat(client));
        reg.register(listAiModels(client));
        reg.register(getSysConfig(client));
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
        reg.register(lockDoc(client));
        reg.register(unlockDoc(client));
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

    /** R5 文档列表 */
    public static ToolDefinition listDocs(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "子文件夹的 docId（可选，来自 list_docs 结果的 data[].docId）"),
                strProp("path", "子文件夹相对路径（可选，如 \"DocSys\" 或 \"DocSys/sub\"）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("list_docs",
                "列出指定仓库的文档列表。不传 docId/path 时返回仓库根目录内容；"
                + "要查看某个子文件夹，请传该文件夹的 docId（推荐，来自上次 list_docs 结果的 data[].docId）"
                + "或相对路径 path（如 \"DocSys\"）。",
                args -> ToolResult.ok(fmt(client.getDocList(args.getInteger("vid"),
                        args.getLong("docId"), null, args.getString("path")))))
                .parameters(schema)
                .build();
    }

    /** R6 文档内容 */
    public static ToolDefinition getDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID"),
                longProp("docId", "文档ID"),
                strProp("path", "文档路径（必填，来自 list_docs 结果的 data[].path，如 \"DocSys/\"）"),
                strProp("name", "文档名（必填，来自 list_docs 结果的 data[].name）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("get_doc",
                "获取文档内容（docText）。注意：必须同时传 path 和 name（来自 list_docs 结果的 data[].path 与 data[].name），"
                + "仅传 docId 无法返回内容。",
                args -> ToolResult.ok(fmt(client.getDoc(args.getInteger("vid"),
                        args.getLong("docId"), args.getString("path"), args.getString("name")))))
                .parameters(schema)
                .build();
    }

    /** R8 版本历史 */
    public static ToolDefinition getDocHistory(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID"),
                longProp("docId", "文档ID"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId"});
        return ToolDefinition.builder("get_doc_history", "获取文档的版本历史",
                args -> ToolResult.ok(fmt(client.getDocHistory(args.getInteger("vid"),
                        args.getLong("docId")))))
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

    /** R10 AI 模型列表 */
    public static ToolDefinition listAiModels(DocSysClient client) {
        return ToolDefinition.builder("list_ai_models", "列出可用的 AI 模型列表",
                args -> ToolResult.ok(fmt(client.getAiModelList())))
                .build();
    }

    /** R11 系统配置 */
    public static ToolDefinition getSysConfig(DocSysClient client) {
        return ToolDefinition.builder("get_sys_config", "获取 DocSys 系统配置",
                args -> ToolResult.ok(fmt(client.getDocSysConfig())))
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

    // ==================== RAG/搜索工具组（T3.3） ====================

    /** R18 RAG 对话（基于文档上下文回答） */
    public static ToolDefinition ragChat(DocSysClient client) {
        JSONObject schema = objSchema(props(
                strProp("query", "问题（必填）"),
                strProp("modelName", "模型名（可选）"),
                strProp("apiKey", "API Key（可选）")), new String[]{"query"});
        return ToolDefinition.builder("rag_chat", "基于文档库上下文（RAG）回答用户问题",
                args -> ToolResult.ok(fmtString(client.ragChat(
                        args.getString("query"), args.getString("modelName"), args.getString("apiKey")))))
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

    /** W4a 创建目录（文件夹） */
    public static ToolDefinition createFolder(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("name", "目录名（必填）"),
                longProp("pid", "父目录ID（可选，0=根）"),
                strProp("path", "路径（可选）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "name"});
        return ToolDefinition.builder("create_folder", "创建目录（文件夹）",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID）");
                    }
                    try {
                        return ToolResult.ok(fmt(client.addDoc(
                                vid, args.getLong("pid"), args.getString("path"),
                                args.getString("name"), 2, null, null, args.getString("commitMsg"))));
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
                strProp("path", "路径（可选，如 /docs/2026）"),
                strProp("name", "文件名（必填，含后缀）"),
                strProp("content", "文件内容（必填，大模型生成的文本，UTF-8，1MB 以内）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "name", "content"});
        return ToolDefinition.builder("write_file",
                "创建或覆盖写入【文本】文件（txt/md/json/xml/sql/代码/脚本等）。文件不存在则创建，存在则覆盖。"
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
                        return ToolResult.ok(fmt(client.writeTextDoc(
                                vid, args.getString("path"),
                                args.getString("name"), content, args.getString("commitMsg"))));
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
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（必填）"),
                strProp("content", "备注内容（必填）"),
                longProp("docId", "文档ID（可选，已知道时可加快定位）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "name", "content"});
        return ToolDefinition.builder("write_note",
                "创建或更新文档【备注】（虚拟内容，不产生实体文件）。文档不存在时自动创建文档条目并写入备注。"
                        + "要写入实体文件用 write_file。",
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
                        String path = args.getString("path");
                        String name = args.getString("name");
                        String commitMsg = args.getString("commitMsg");
                        Map<String, Object> res = client.updateDocContent(
                                vid, args.getLong("docId"), path, name, content, null, commitMsg);
                        String status = res != null ? String.valueOf(res.get("status")) : "fail";
                        String msg = res != null ? String.valueOf(res.get("msgInfo")) : "";
                        if ("ok".equals(status)) {
                            return ToolResult.ok(fmt(res));
                        }
                        if (msg != null && msg.contains("不存在")) {
                            // 文档不存在 → 创建条目并写入备注（addDoc+content 即备注语义）
                            Map<String, Object> created = client.addDoc(
                                    vid, null, path, name, 1, null, content, commitMsg);
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

    /** W5 删除文档 */
    public static ToolDefinition deleteDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID"),
                longProp("pid", "父目录ID（可选）"),
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（可选）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("delete_doc", "删除文档（需确认）",
                args -> ToolResult.ok(fmt(client.deleteDoc(
                        args.getInteger("vid"), args.getLong("docId"), args.getLong("pid"),
                        args.getString("path"), args.getString("name"), null,
                        args.getString("commitMsg")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W6 重命名文档 */
    public static ToolDefinition renameDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("dstName", "新名称（必填）"),
                longProp("docId", "文档ID"),
                longProp("pid", "父目录ID（可选）"),
                strProp("path", "路径（可选）"),
                strProp("name", "原名（可选）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "dstName"});
        return ToolDefinition.builder("rename_doc", "重命名文档",
                args -> ToolResult.ok(fmt(client.renameDoc(
                        args.getInteger("vid"), args.getLong("docId"), args.getLong("pid"),
                        args.getString("path"), args.getString("name"), null,
                        args.getString("dstName"), args.getString("commitMsg")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W7 移动文档 */
    public static ToolDefinition moveDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID（必填）"),
                longProp("dstPid", "目标目录ID（必填）"),
                strProp("dstPath", "目标路径（可选）"),
                strProp("dstName", "目标名（可选）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId", "dstPid"});
        return ToolDefinition.builder("move_doc", "移动文档到其他目录",
                args -> ToolResult.ok(fmt(client.moveDoc(
                        args.getInteger("vid"), args.getLong("docId"), null, null, null, null,
                        args.getLong("dstPid"), args.getString("dstPath"), args.getString("dstName"),
                        null, null, args.getString("commitMsg")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W8 复制文档 */
    public static ToolDefinition copyDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID（必填）"),
                longProp("dstPid", "目标目录ID（必填）"),
                strProp("dstPath", "目标路径（可选）"),
                strProp("dstName", "目标名（可选）"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId", "dstPid"});
        return ToolDefinition.builder("copy_doc", "复制文档到其他目录",
                args -> ToolResult.ok(fmt(client.copyDoc(
                        args.getInteger("vid"), args.getLong("docId"), null, null, null, null,
                        args.getLong("dstPid"), args.getString("dstPath"), args.getString("dstName"),
                        null, null, args.getString("commitMsg")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W10 锁定文档 */
    public static ToolDefinition lockDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID（必填）"),
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（可选）"),
                intProp("lockType", "锁定类型（默认1）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId"});
        return ToolDefinition.builder("lock_doc", "锁定文档防止编辑",
                args -> ToolResult.ok(fmt(client.lockDoc(
                        args.getInteger("vid"), args.getLong("docId"), args.getString("path"),
                        args.getString("name"), args.getInteger("lockType")))))
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** W11 解锁文档 */
    public static ToolDefinition unlockDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                longProp("docId", "文档ID（必填）"),
                strProp("path", "路径（可选）"),
                strProp("name", "文档名（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "docId"});
        return ToolDefinition.builder("unlock_doc", "解锁文档恢复编辑",
                args -> ToolResult.ok(fmt(client.unlockDoc(
                        args.getInteger("vid"), args.getLong("docId"), args.getString("path"),
                        args.getString("name")))))
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

    /** 格式化 DocSysClient 返回的 Map 为紧凑文本（截断防上下文膨胀） */
    private static String fmt(Map<String, Object> result) {
        if (result == null) {
            return "(empty response)";
        }
        String json = JSON.toJSONString(result);
        return truncate(json);
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
