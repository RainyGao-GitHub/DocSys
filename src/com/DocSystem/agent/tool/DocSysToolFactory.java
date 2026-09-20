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

    /** R2 列出仓库（R1-5：紧凑分页渲染，不再裸倒 JSON） */
    public static ToolDefinition listRepos(DocSysClient client) {
        JSONObject props = props(
                intProp("offset", "分页起点（可选，默认 0）"),
                intProp("limit", "本页条数（可选，默认 " + REPOS_LIST_DEFAULT_LIMIT
                        + "，最大 " + REPOS_LIST_MAX_LIMIT + "）"));
        return ToolDefinition.builder("list_repos",
                "列出当前用户可见的仓库（紧凑清单：vid/名称/类型/版本控制/本地路径）。"
                + "拿到 vid 后用它调用 list_docs / search_files / get_repos 等工具。"
                + "仓库多时结果会自动分页（表头给出总数与当前区间），用 offset/limit 翻页。",
                args -> ToolResult.ok(formatReposPage(client.getReposList(),
                        args.getInteger("offset"), args.getInteger("limit"))))
                .parameters(objSchema(props, null))
                .build();
    }

    /** R4 仓库详情（R1-5：同样改紧凑渲染，顺带避免把 svnPwd 等明文配置倒进上下文） */
    public static ToolDefinition getRepos(DocSysClient client) {
        JSONObject props = props(intProp("vid", "仓库ID"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("get_repos", "获取指定仓库的详细信息（vid/名称/类型/版本控制/本地路径/归属）",
                args -> ToolResult.ok(formatOneRepos(client.getRepos(args.getInteger("vid")))))
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

    /** R6 文档内容（R1-6：path+name 定位；R2-2：offset/maxChars 分窗口续读） */
    public static ToolDefinition getDoc(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID"),
                strProp("path", "文档所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "文档名（必填，来自 list_docs 结果的 name 列）"),
                intProp("offset", "正文起始位置（可选，默认 0；分次读长文件时用页脚给的 offset 续读）"),
                intProp("maxChars", "本次最多返回的字符数（可选，默认 " + DOC_TEXT_DEFAULT_MAX
                        + "，上限 " + DOC_TEXT_MAX + "）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("get_doc",
                "读取文档的**文本内容**。定位用 path+name：path 是它所在目录的相对路径（以 / 结尾，根目录空串），"
                + "name 是文件名，两者都从 list_docs 结果里取。不要传 docId。"
                + "长文本分次读：表头会给总字符数与本次区间，未读完时页脚会给出下一次的 offset。"
                + "非文本文件（压缩包/可执行文件等）没有文本表示，只返回元信息。",
                args -> ToolResult.ok(formatDocContent(
                        client.getDoc(args.getInteger("vid"), null,
                                normalizeDocPath(args.getString("path")), args.getString("name")),
                        args.getInteger("vid"), normalizeDocPath(args.getString("path")), args.getString("name"),
                        args.getInteger("offset"), args.getInteger("maxChars"))))
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
                strProp("query", "查询条件（必填，JSON 字符串）。格式：{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}],\"should\":[{\"field\":\"name\",\"term\":\"周报\"}],\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}。field: name(文件名)/content(文件内容)/comment(备注)；match: term(默认，大小写不敏感、中文分词，**推荐**)/wildcard/prefix/fuzzy。wildcard/prefix/fuzzy 仅对 field=name 生效，且**关键字必须全小写**（实测大写 0 条）；不确定就用 term。"),
                strProp("path", "目录限定（可选，仓库内相对路径，如 66666/）"),
                intProp("maxResults", "服务端返回的命中数上限（可选，默认 20，上限 100）。注意：这是**取回多少条**而不是总数；表头说“已达 maxResults 上限”时说明可能还有更多，想看全就把它调大。"),
                boolProp("withSnippet", "是否返回命中片段（可选，默认 true）"),
                intProp("offset", "结果内分页起点（可选，默认 0）"),
                intProp("limit", "本页显示条数（可选，默认 " + SEARCH_LIST_DEFAULT_LIMIT
                        + "，最大 " + SEARCH_LIST_MAX_LIMIT + "）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "query"});
        return ToolDefinition.builder("search_files",
                "在指定仓库内基于全文索引搜索文档（文件名/文件内容/备注），支持与或非(must/should/mustNot)组合。"
                        + "结果是一条条紧凑命中（名称/path/大小/命中类型），表头区分“全部命中”与“已达服务端 maxResults 上限（可能还有更多）”，"
                        + "超过一页面时用 offset/limit 翻页（页大小会因路径长度自适应，以表头的区间为准）。"
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
                    String argPath = normalizeDocPath(args.getString("path"));
                    try {
                        return ToolResult.ok(formatSearchPage(client.agentSearchDocs(
                                vid, query, argPath.isEmpty() ? null : argPath,
                                args.getInteger("maxResults"), args.getBoolean("withSnippet")),
                                vid, argPath.isEmpty() ? null : argPath, query,
                                args.getInteger("offset"), args.getInteger("limit"),
                                effectiveMaxResults(args.getInteger("maxResults"))));
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
                intProp("pattern", "搜索关键词（必填；子串匹配、大小写不敏感）"),
                strProp("path", "目录限定（可选，仓库内相对路径，如 66666/）"),
                intProp("maxResults", "服务端返回的命中文件数上限（可选，默认 20，上限 100）。这是**取回多少条**而不是总数；表头说“已达上限”时可能还有更多。"),
                intProp("offset", "结果内分页起点（可选，默认 0）"),
                intProp("limit", "本页显示条数（可选，默认 " + SEARCH_LIST_DEFAULT_LIMIT
                        + "，最大 " + SEARCH_LIST_MAX_LIMIT + "）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "pattern"});
        return ToolDefinition.builder("grep_files",
                "直接在仓库磁盘上逐行扫描文本文件内容（不依赖索引，较慢），每个命中文件只回一条 ≤"
                        + GREP_SNIPPET_LEN + " 字符的片段（命中行可能极长，已截断）。"
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
                    String argPath = normalizeDocPath(args.getString("path"));
                    try {
                        return ToolResult.ok(formatGrepPage(client.grepFiles(
                                vid, pattern, argPath.isEmpty() ? null : argPath,
                                args.getInteger("maxResults")),
                                pattern, argPath.isEmpty() ? null : argPath,
                                args.getInteger("offset"), args.getInteger("limit"),
                                effectiveMaxResults(args.getInteger("maxResults"))));
                    } catch (Exception e) {
                        return ToolResult.error("grep_files failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .build();
    }

    /** R15 分享列表（R1-3：服务端不接参数，语义 = 当前用户的全部分享；path/name 仅在结果里过滤） */
    public static ToolDefinition getDocShareList(DocSysClient client) {
        JSONObject props = props(
                strProp("path", "只看某个目录下的分享（可选，过滤条件；如 \"66666/\"，根目录传空串）"),
                strProp("name", "只看某个文档的分享（可选，过滤条件）"),
                intProp("offset", "分页起点（可选，默认 0）"),
                intProp("limit", "本页条数（可选，默认 " + SHARE_LIST_DEFAULT_LIMIT
                        + "，最大 " + SHARE_LIST_MAX_LIMIT + "）"));
        return ToolDefinition.builder("get_doc_share_list",
                "列出**当前用户创建的全部分享**（每条含 shareId / 对象路径 / 有效期 / 权限）。"
                + "注意：服务端 /Doc/getDocShareList.do 不接受任何参数，返回的就是这份全量列表——"
                + "想只看某个文件的分享，请传 path（可再加 name）在结果里过滤。"
                + "列表过长时会自动分页（表头给总数与区间），用 offset/limit 翻页。",
                args -> ToolResult.ok(formatSharePage(client.getDocShareList(),
                        args.getString("path"), args.getString("name"),
                        args.getInteger("offset"), args.getInteger("limit"))))
                .parameters(objSchema(props, null))
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

    /** W12 创建文档分享（R1-2：改用真实端点 /Bussiness/addDocShare.do；R1-6：path/name 定位） */
    public static ToolDefinition createDocShare(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "待分享对象所在目录的相对路径（必填，来自 list_docs 的 path 列；根目录传空串 \"\"）"),
                strProp("name", "待分享的文件/目录名（必填，来自 list_docs 的 name 列）"),
                strProp("sharePwd", "分享密码（可选，不传则无密码）"),
                longProp("shareHours", "有效期小时数（可选，默认 " + SHARE_DEFAULT_HOURS + " = 7 天）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name"});
        return ToolDefinition.builder("create_doc_share",
                "为文档/目录创建分享链接（默认只读 + 可下载，" + (SHARE_DEFAULT_HOURS / 24) + " 天后过期）。"
                + "定位用 path+name：path 是它所在目录的相对路径（以 / 结尾，根目录空串），name 是它自己的名字，"
                + "两者都从 list_docs 结果里取。不要传 docId。"
                + "返回 shareId 与可直接发给别人的 shareLink；要限制访问时传 sharePwd。"
                + "分享一旦创建就是一个对外的链接（会绕过登录鉴权，仅靠密码/有效期保护），请先跟用户确认再调用。",
                args -> ToolResult.ok(formatShareCreated(client.addDocShare(
                        args.getInteger("vid"), normalizeDocPath(args.getString("path")), args.getString("name"),
                        args.getString("sharePwd"),
                        args.getLong("shareHours") == null ? Long.valueOf(SHARE_DEFAULT_HOURS)
                                : args.getLong("shareHours")))))
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

    // ==================== 列表渲染公共件（R2-1：所有列表类工具共用） ====================

    /** 渲染 [from, to) 区间的行（各个列表工具自己实现） */
    interface RowRenderer {
        String render(int from, int to);
    }

    /** 一页正文 + 实际结束下标 */
    static final class PageBody {
        final int end;
        final String body;

        PageBody(int end, String body) {
            this.end = end;
            this.body = body;
        }
    }

    /**
     * 按<b>字符预算</b>确定本页实际显示到哪一条（并渲染正文）。
     *
     * <p>列表类工具统一走它，保证两条不变量：
     * <ol>
     *   <li>输出**永远不会**超过预算（预算低于 {@link #MAX_SUMMARY_LEN}，所以不会出现"半截 JSON"）；</li>
     *   <li>条数被回收时，调用方必须在表头写清区间、在页脚给出 `offset=<end>` 续页提示
     *       （宁可少列几条，也不能悄悄丢数据）。</li>
     * </ol>
     *
     * @param budget 本页正文允许的字符数（已扣除表头/页脚余量的由调用方传入）
     */
    static PageBody fitPage(int total, int offset, int limit, int budget, RowRenderer rows) {
        int end = Math.min(total, offset + limit);
        String body = rows.render(offset, end);
        while (body.length() > budget && end - offset > 1) {
            end = offset + Math.max(1, (end - offset) * 3 / 4);
            body = rows.render(offset, end);
        }
        return new PageBody(end, body);
    }

    /** 统一的"还有 N 条未显示"续页提示（各列表工具措辞一致，模型只看一种句式） */
    static String moreHint(long remain, String toolName, int nextOffset) {
        return "⚠️ 还有 " + remain + " 条未显示：继续调用 " + toolName + " 传 offset=" + nextOffset + "。";
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
            // 失败交给 fmt：保留服务端 errorCode + 处置提示（直接拼 msgInfo 会把错误码丢掉）
            return fmt(resp);
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

        // 先按 limit 取，字符超预算再回收条数（表头/页脚已预留余量）
        int cap = DOC_LIST_CHAR_BUDGET - sb.length() - 220;
        PageBody page = fitPage(total, offset, limit, cap,
                (from, to) -> renderEntries(all, from, to));
        int end = page.end;
        sb.append(end).append(" 项\n");
        sb.append(page.body);
        sb.append("\n说明：上表各项的 path 与本目录相同（").append(displayPath(path)).append("），");
        sb.append("读取内容用 get_doc(vid=").append(vid).append(", path=").append(quoted(pathLabel(path)))
                .append(", name=<名称>)；进入子目录用 list_docs(vid=").append(vid)
                .append(", path=").append(quoted(childDocPath(path, "<子目录名>"))).append(")。\n");
        if (end < total) {
            sb.append(moreHint(total - end, "list_docs", end)).append(" 也可用 search_files/grep_files 按关键字直接找。");
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

    // ==================== 仓库列表渲染（分页 + 紧凑，R1-5，2026-09-20） ====================

    /** list_repos 单页默认/最大条数 */
    static final int REPOS_LIST_DEFAULT_LIMIT = 50;
    static final int REPOS_LIST_MAX_LIMIT = 200;

    /** 仓库列表字符预算（低于 MAX_SUMMARY_LEN，确保不会被 truncate 砍成半截） */
    private static final int REPOS_LIST_CHAR_BUDGET = 3000;

    /**
     * 把 `/Repos/getReposList.do` 的响应渲染成<b>紧凑清单</b>，并按 offset/limit 分页。
     *
     * <p><b>为什么不再直接倒 JSON</b>：每项有 26 个字段（localSvnPath/svnPwd/svnPwd1/remoteStorage/
     * lockBy/lockTime/…），单条约 450 字符；17 个仓库即 7.7KB，被 {@link #truncate} 砍到 4000 字符后
     * 正好断在第 9 个仓库中间 —— 模型既拿不全仓库、也看不到后面的条目
     * （2026-09-19 日志 `[ToolUseLoop][PARSE] ... 接口返回在第 9 个后被截断`）。
     * 而且原文含 <b>svnPwd/svnPwd1（明文密码）</b>，本就不该进模型上下文。
     */
    static String formatReposPage(Map<String, Object> resp, Integer offsetArg, Integer limitArg) {
        if (resp == null) {
            return "(empty response)";
        }
        if (!"ok".equals(String.valueOf(resp.get("status")))) {
            return fmt(resp);   // 失败保留 errorCode + 处置提示
        }
        Object data = resp.get("data");
        if (!(data instanceof List)) {
            return "仓库列表为空（服务器返回：" + data + "）";
        }
        List<?> all = (List<?>) data;
        int total = all.size();
        if (total == 0) {
            return "当前用户没有可见的仓库。";
        }

        int offset = offsetArg == null ? 0 : Math.max(0, offsetArg.intValue());
        int limit = limitArg == null ? REPOS_LIST_DEFAULT_LIMIT
                : Math.min(REPOS_LIST_MAX_LIMIT, Math.max(1, limitArg.intValue()));
        if (offset >= total) {
            return "共 " + total + " 个仓库；offset=" + offset + " 已超出范围（有效范围 0~" + (total - 1) + "）。";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("仓库列表：共 ").append(total).append(" 个，本次显示第 ").append(offset + 1).append("-");
        int cap = REPOS_LIST_CHAR_BUDGET - sb.length() - 200;   // 给表头/页脚留余量
        PageBody page = fitPage(total, offset, limit, cap,
                (from, to) -> renderRepos(all, from, to));
        int end = page.end;
        sb.append(end).append(" 个\n").append(page.body);
        sb.append("说明：用 vid 调用 list_docs(vid=<vid>) 列目录、search_files(vid=<vid>) 检索；")
                .append("单个仓库的完整配置用 get_repos(vid=<vid>)。\n");
        if (end < total) {
            sb.append(moreHint(total - end, "list_repos", end));
        }
        return sb.toString();
    }

    /** 渲染 [from, to) 区间的仓库行（只给模型真正需要的字段；不含 svnPwd 等敏感项） */
    private static String renderRepos(List<?> all, int from, int to) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Object o = all.get(i);
            if (!(o instanceof Map)) {
                sb.append(i + 1).append(". ").append(o).append("\n");
                continue;
            }
            Map<?, ?> r = (Map<?, ?>) o;
            String name = str(r.get("name"));
            sb.append(i + 1).append(". vid=").append(str(r.get("id"))).append("  「").append(name).append("」")
                    .append("  ").append(reposTypeLabel(r.get("type")))
                    .append(" / 版本控制=").append(verCtrlLabel(r.get("verCtrl")));
            String localPath = str(r.get("realDocPath"));
            if (!localPath.isEmpty()) {
                sb.append("  本地路径=").append(localPath);
            }
            String info = str(r.get("info"));
            if (!info.isEmpty() && !info.equals(name)) {
                sb.append("  说明=").append(info.length() > 30 ? info.substring(0, 30) + "…" : info);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    /** 单个仓库详情（紧凑；失败时保留 errorCode） */
    static String formatOneRepos(Map<String, Object> resp) {
        if (resp == null) {
            return "(empty response)";
        }
        if (!"ok".equals(String.valueOf(resp.get("status")))) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            return "仓库不存在（服务器返回：" + data + "）";
        }
        Map<?, ?> r = (Map<?, ?>) data;
        StringBuilder sb = new StringBuilder("仓库 vid=").append(str(r.get("id")))
                .append("  「").append(str(r.get("name"))).append("」\n");
        sb.append("  类型：").append(reposTypeLabel(r.get("type"))).append("\n");
        sb.append("  版本控制：").append(verCtrlLabel(r.get("verCtrl"))).append("\n");
        String localPath = str(r.get("realDocPath"));
        sb.append("  本地路径：").append(localPath.isEmpty() ? "（系统默认位置）" : localPath).append("\n");
        String owner = str(r.get("owner"));
        if (!owner.isEmpty()) {
            sb.append("  归属：").append(owner).append("\n");
        }
        String info = str(r.get("info"));
        if (!info.isEmpty()) {
            sb.append("  说明：").append(info).append("\n");
        }
        sb.append("用 list_docs(vid=").append(str(r.get("id"))).append(") 查看它的目录内容。");
        return sb.toString();
    }

    /** 仓库类型文案（与 manager/addRepos.html 的选项一致） */
    static String reposTypeLabel(Object type) {
        Integer t = intOf(type);
        if (t == null) {
            return "未知类型";
        }
        switch (t.intValue()) {
        case 1: return "文件管理系统";
        case 3: return "SVN前置";
        case 4: return "GIT前置";
        case 5: return "文件服务器前置";
        default: return "类型" + t;
        }
    }

    /** 版本控制文案（与 manager/addRepos.html 的选项一致；裸值，调用方自加“版本控制=”前缀） */
    static String verCtrlLabel(Object verCtrl) {
        Integer v = intOf(verCtrl);
        if (v == null) {
            return "未配置";
        }
        switch (v.intValue()) {
        case 0: return "无";
        case 1: return "SVN";
        case 2: return "GIT";
        case 3: return "磁盘";
        default: return String.valueOf(v);
        }
    }

    // ==================== 分享渲染（R1-2 / R1-3，2026-09-20） ====================

    /** 分享默认有效期（小时）——与 web 端 project.js 的默认值一致（7 天） */
    static final int SHARE_DEFAULT_HOURS = 7 * 24;

    /** get_doc_share_list 单页默认/最大条数 */
    static final int SHARE_LIST_DEFAULT_LIMIT = 50;
    static final int SHARE_LIST_MAX_LIMIT = 200;

    /** 分享列表字符预算（与目录列表同级；低于 MAX_SUMMARY_LEN，避免被 truncate 砍成半截） */
    private static final int SHARE_LIST_CHAR_BUDGET = 3600;

    /**
     * 把 `/Doc/getDocShareList.do` 的响应渲染成<b>紧凑清单</b>（+ 可选 path/name 过滤 + offset/limit 分页）。
     *
     * <p>实测 dev 环境 32 条分享的原始 JSON 是 **11414 字符**（每条含 shareAuth 原样 JSON 字符串 + 9 个字段），
     * 直接交给 {@code fmt()} 会被截到 4000 —— 后面的分享全都看不到。这里只保留
     * {@code shareId / 仓库 / 对象路径 / 有效期 / 权限}，并给总数与翻页提示。
     *
     * <p>注意：服务端**不接受任何参数**，所以 path/name 只能在已取回的列表上做客户端过滤
     * （工具描述已如实说明）。
     */
    static String formatSharePage(Map<String, Object> resp, String pathFilter, String nameFilter,
                                  Integer offsetArg, Integer limitArg) {
        if (resp == null) {
            return "(empty response)";
        }
        if (!"ok".equals(String.valueOf(resp.get("status")))) {
            return fmt(resp);   // 失败保留 errorCode + 处置提示
        }
        Object data = resp.get("data");
        if (!(data instanceof List)) {
            return "分享列表为空（服务器返回：" + data + "）";
        }
        List<?> rawList = (List<?>) data;
        String pathWanted = normalizeDocPath(pathFilter);
        String nameWanted = nameFilter == null ? "" : nameFilter.trim();

        List<Object> all = new java.util.ArrayList<Object>();
        for (Object o : rawList) {
            if (!(o instanceof Map)) {
                continue;
            }
            Map<?, ?> s = (Map<?, ?>) o;
            if (!pathWanted.isEmpty() && !pathWanted.equals(normalizeDocPath(str(s.get("path"))))) {
                continue;
            }
            if (!nameWanted.isEmpty() && !nameWanted.equals(str(s.get("name")))) {
                continue;
            }
            all.add(o);
        }
        String scope = (pathWanted.isEmpty() && nameWanted.isEmpty()) ? "（全部分享）"
                : "（过滤条件：" + (pathWanted.isEmpty() ? "" : "path=\"" + pathWanted + "\" ")
                        + (nameWanted.isEmpty() ? "" : "name=\"" + nameWanted + "\"") + "）";
        if (rawList.isEmpty()) {
            return "当前用户还没有创建过任何分享。";
        }
        if (all.isEmpty()) {
            return "分享列表共 " + rawList.size() + " 条，但没有匹配 " + scope + " 的条目。";
        }

        int total = all.size();
        int offset = offsetArg == null ? 0 : Math.max(0, offsetArg.intValue());
        int limit = limitArg == null ? SHARE_LIST_DEFAULT_LIMIT
                : Math.min(SHARE_LIST_MAX_LIMIT, Math.max(1, limitArg.intValue()));
        if (offset >= total) {
            return "匹配 " + scope + " 的分享共 " + total + " 条；offset=" + offset
                    + " 已超出范围（有效范围 0~" + (total - 1) + "）。";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("分享列表：匹配 ").append(scope).append(" 共 ").append(total)
                .append(" 条，本次显示第 ").append(offset + 1).append("-");
        int cap = SHARE_LIST_CHAR_BUDGET - sb.length() - 200;
        PageBody page = fitPage(total, offset, limit, cap,
                (from, to) -> renderShares(all, from, to));
        int end = page.end;
        sb.append(end).append(" 条\n").append(page.body);
        if (rawList.size() != total) {
            sb.append("（当前用户共有 ").append(rawList.size()).append(" 条分享，已按条件过滤）\n");
        }
        sb.append("说明：shareLink 可拼成 <访问地址>/DocSystem/web/project.html?vid=<vid>&shareId=<shareId>；")
                .append("撤销分享请在 Web 界面操作（或调 /Bussiness/deleteDocShare.do）。\n");
        if (end < total) {
            sb.append(moreHint(total - end, "get_doc_share_list", end));
        }
        return sb.toString();
    }

    /** 渲染 [from, to) 区间的分享行 */
    private static String renderShares(List<?> all, int from, int to) {
        long now = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Map<?, ?> s = (Map<?, ?>) all.get(i);
            String name = str(s.get("name"));
            String path = str(s.get("path"));
            sb.append(i + 1).append(". shareId=").append(str(s.get("shareId")))
                    .append("  ").append(shareTargetText(s.get("vid"), s.get("reposName"), path, name));
            Long expire = longOf(s.get("expireTime"));
            if (expire == null) {
                sb.append("  有效期=未设置");
            } else if (expire.longValue() <= now) {
                sb.append("  已过期（").append(dateTimeText(expire)).append("）");
            } else {
                sb.append("  有效至 ").append(dateTimeText(expire))
                        .append("（剩 ").append((expire.longValue() - now) / 3600000L).append("h）");
            }
            sb.append("  权限=").append(shareAuthSummary(s.get("shareAuth")));
            sb.append("\n");
        }
        return sb.toString();
    }

    /** 分享对象文案：整库（path/name 都空）要写清楚，否则用户会误以为是某个文件 */
    private static String shareTargetText(Object vid, Object reposName, String path, String name) {
        String repos = str(reposName);
        String head = "仓库 " + str(vid) + (repos.isEmpty() ? "" : "「" + repos + "」");
        if (name.isEmpty() && path.isEmpty()) {
            return head + " 整库";
        }
        return head + " " + path + name;
    }

    /**
     * 把 shareAuth（JSON 字符串）压成一句人话；解析失败时原样返回。
     *
     * <p>“只读 + 可下载（其余位全 0）”是最常见的分享形态（web 端与 create_doc_share 的默认），
     * 单独给个短写法，否则 30+ 条列表光权限描述就多出好几千字符（会触发预算回收、少列条目）。
     */
    static String shareAuthSummary(Object shareAuth) {
        String raw = str(shareAuth);
        if (raw.isEmpty()) {
            return "未设置";
        }
        try {
            JSONObject a = JSON.parseObject(raw);
            if (intValue(a.get("access")) == 1 && intValue(a.get("downloadEn")) == 1
                    && intValue(a.get("editEn")) == 0 && intValue(a.get("addEn")) == 0
                    && intValue(a.get("deleteEn")) == 0 && intValue(a.get("isAdmin")) == 0) {
                return "只读+可下载";
            }
            StringBuilder sb = new StringBuilder();
            if (intValue(a.get("access")) == 1) {
                sb.append("可访问");
            } else {
                sb.append("无访问权");
            }
            if (intValue(a.get("downloadEn")) == 1) {
                sb.append("+可下载");
            }
            if (intValue(a.get("editEn")) == 1) {
                sb.append("+可编辑");
            }
            if (intValue(a.get("addEn")) == 1) {
                sb.append("+可新增");
            }
            if (intValue(a.get("deleteEn")) == 1) {
                sb.append("+可删除");
            }
            if (intValue(a.get("isAdmin")) == 1) {
                sb.append("+管理");
            }
            if (intValue(a.get("heritable")) == 1) {
                sb.append("（子目录可继承）");
            }
            return sb.toString();
        } catch (Exception e) {
            return raw;
        }
    }

    /**
     * 渲染 `/Bussiness/addDocShare.do` 的创建结果（data 就是新建的 DocShare，含 shareId/shareLink）。
     * 失败时交给 {@code fmt()} 保留 errorCode + 处置提示。
     */
    static String formatShareCreated(Map<String, Object> resp) {
        if (resp == null) {
            return "(empty response)";
        }
        if (!"ok".equals(String.valueOf(resp.get("status")))) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            return "分享已创建，但服务端未返回分享详情（返回：" + data + "）。";
        }
        Map<?, ?> s = (Map<?, ?>) data;
        StringBuilder sb = new StringBuilder("已创建分享：\n");
        sb.append("  shareId：").append(str(s.get("shareId"))).append("\n");
        sb.append("  对象：").append(shareTargetText(s.get("vid"), s.get("reposName"),
                str(s.get("path")), str(s.get("name")))).append("\n");
        String link = str(s.get("shareLink"));
        sb.append("  链接：").append(link.isEmpty() ? "（服务端未返回，可用 shareId 在 Web 界面查看）" : link).append("\n");
        Long expire = longOf(s.get("expireTime"));
        if (expire != null) {
            sb.append("  有效期至：").append(dateTimeText(expire)).append("\n");
        }
        String pwd = str(s.get("sharePwd"));
        sb.append("  密码：").append(pwd.isEmpty() ? "无" : "有（调用时传入的密码）").append("\n");
        sb.append("  权限：只读 + 可下载（子目录可继承）\n");
        sb.append("把链接（以及密码）交给用户即可；链接自带 shareId，访问时无需登录。");
        return sb.toString();
    }

    private static int intValue(Object o) {
        Integer v = intOf(o);
        return v == null ? 0 : v.intValue();
    }

    /** 精确到分钟的时间文案（分享有效期需要看到时刻，dateText 只到天） */
    private static String dateTimeText(Long millis) {
        if (millis == null || millis.longValue() <= 0) {
            return "";
        }
        return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date(millis.longValue()));
    }

    // ==================== 文档正文渲染（R2-2：分窗口续读） ====================

    /** get_doc 正文本页默认/上限字符数（默认值保证整段输出 < MAX_SUMMARY_LEN） */
    static final int DOC_TEXT_DEFAULT_MAX = 3000;
    static final int DOC_TEXT_MAX = 20000;

    /**
     * 渲染 `/Doc/getDoc.do` 的正文（带 offset/maxChars 分窗口 + 续读提示）。
     *
     * <p><b>为什么需要</b>：原实现直接把整个响应交给 {@code fmt()}，长文本会在 4000 字符处被硬截断，
     * 模型只看到"文件开头"却拿不到后文（也无法自己续读）。现在表头给出"总长/本次区间"，
     * 页脚给出明确的续读调用（`offset=<end>`）。
     *
     * <p>非文本文件（服务端不返回 docText，如 zip/exe）：只回元信息并说明原因，不再倒一坨 JSON。
     */
    static String formatDocContent(Map<String, Object> resp, Integer vid, String path, String name,
                                   Integer offsetArg, Integer maxCharsArg) {
        if (resp == null) {
            return "(empty response)";
        }
        if (!"ok".equals(String.valueOf(resp.get("status")))) {
            return fmt(resp);   // 失败保留 errorCode + 处置提示
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            return "文件不存在或无法读取：" + docTargetText(vid, path, name) + "（服务器返回：" + data + "）";
        }
        Map<?, ?> d = (Map<?, ?>) data;
        String target = docTargetText(vid, path, name);
        Long size = longOf(d.get("size"));
        Object textObj = d.get("docText");
        if (textObj == null) {
            return "文件（非文本，无正文可读）：" + target + "\n"
                    + "  大小：" + sizeText(size) + "\n"
                    + "  说明：get_doc 只返回文本内容（txt/md/代码/Office 转换后的文本等）；"
                    + "此文件类型没有文本表示，需要原件请在 Web 界面预览/下载。";
        }
        String text = String.valueOf(textObj);
        int total = text.length();
        if (total == 0) {
            return "文件内容为空（0 字符）：" + target + "（大小 " + sizeText(size) + "）。";
        }

        int offset = offsetArg == null ? 0 : Math.max(0, offsetArg.intValue());
        if (offset >= total) {
            return target + " 的正文共 " + total + " 字符；offset=" + offset
                    + " 已超出范围（有效范围 0~" + (total - 1) + "）。";
        }
        int max = maxCharsArg == null ? DOC_TEXT_DEFAULT_MAX
                : Math.min(DOC_TEXT_MAX, Math.max(1, maxCharsArg.intValue()));
        int end = Math.min(total, offset + max);

        StringBuilder sb = new StringBuilder();
        sb.append("文件内容：").append(target)
                .append("（大小 ").append(sizeText(size)).append("，正文共 ").append(total).append(" 字符）\n");
        sb.append(offset == 0 && end == total
                ? "已显示全文（第 1-" + total + " 字符）：\n"
                : "本次显示第 " + (offset + 1) + "-" + end + " 字符：\n");
        sb.append("────────\n").append(text, offset, end).append("\n────────\n");
        if (end < total) {
            sb.append("⚠️ 还有 ").append(total - end).append(" 字符未显示：继续调用 get_doc(vid=").append(vid)
                    .append(", path=").append(quoted(pathLabel(path))).append(", name=").append(quoted(name))
                    .append(", offset=").append(end).append(")。");
        }
        return sb.toString();
    }

    /** 文档定位文案（仓库 / path / name），三个工具共用 */
    static String docTargetText(Integer vid, String path, String name) {
        String p = path == null || path.isEmpty() ? "" : path;
        return "仓库 " + vid + " / " + displayPath(p) + name;
    }

    // ==================== 搜索结果渲染（R2-3：紧凑 + 分页） ====================

    /** 搜索结果单页默认/最大条数（服务端上限由 maxResults 控制） */
    static final int SEARCH_LIST_DEFAULT_LIMIT = 50;
    static final int SEARCH_LIST_MAX_LIMIT = 200;
    private static final int SEARCH_LIST_CHAR_BUDGET = 3400;

    /**
     * 服务端 `maxResults` 的默认值与上限（实测：不传/传 0 → 20；传 300/1000 → 仍 100）。
     *
     * <p><b>为什么重要</b>：服务端**不返回真实总数**（`dataEx` 就是 `data.size()`），只把命中截到
     * maxResults 条。所以“返回条数 == maxResults”只能说明“**可能还有更多**”，不能当作总数——
     * 2026-09-20 页面 E2E 里模型把表头的“共 20 条”当成总数，又花一轮重查才发现是 34 条。
     */
    static final int SERVER_DEFAULT_RESULTS = 20;
    static final int SERVER_MAX_RESULTS = 100;

    /** 服务端 maxResults 的有效值（null/<=0 → 默认 20；超上限按 100 计） */
    static int effectiveMaxResults(Integer arg) {
        int v = arg == null ? 0 : arg.intValue();
        return v <= 0 ? SERVER_DEFAULT_RESULTS : Math.min(v, SERVER_MAX_RESULTS);
    }

    /** 命中数已达服务端上限时的下一步提示（实测服务端上限 100 条） */
    static String capNote(int cap) {
        return cap >= SERVER_MAX_RESULTS
                ? "ℹ️ 已到服务端上限 " + SERVER_MAX_RESULTS + " 条：想看到更多命中请缩小范围（加 must / 限定 path）。"
                : "ℹ️ 可能还有更多命中：调大 maxResults（当前 " + cap + "，上限 " + SERVER_MAX_RESULTS + "）重查。";
    }

    /** grep 片段与索引命中的展示上限（服务端 snippet 可达 200 字符，命中行本身可能几十万字符） */
    static final int GREP_SNIPPET_LEN = 120;
    private static final int SEARCH_QUERY_LABEL_LEN = 60;

    /**
     * `search_files`（全文索引）结果渲染：紧凑清单 + offset/limit 分页。
     *
     * <p>实测 dev：宽泛查询（wildcard "."）在仓库 5 返回 **100 条 / 19840 字符**，远超 fmt 上限 4000
     * —— 之前模型只能看到前 13 条左右、后面是半截 JSON。
     */
    static String formatSearchPage(Map<String, Object> resp, Integer vid, String pathFilter, Object query,
                                   Integer offsetArg, Integer limitArg, int serverCap) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof List)) {
            return "搜索结果为空（服务器返回：" + data + "）";
        }
        List<?> all = (List<?>) data;
        String scope = "仓库 " + vid + (pathFilter == null || pathFilter.isEmpty() ? "" : " / path=" + quoted(pathFilter))
                + " / 查询=" + shortText(String.valueOf(query), SEARCH_QUERY_LABEL_LEN);
        if (all.isEmpty()) {
            return "没有命中：" + scope + "。\n"
                    + "建议：先用默认的 term 模式换关键词（大小写不敏感、子串匹配）；"
                    + "确实需要通配时才用 wildcard/prefix（仅对 name 生效，且关键字必须全小写，大写会 0 条）；"
                    + "文件刚放入仓库、索引还没建时可能搜不到，改用 grep_files 直接在磁盘上扫内容。";
        }
        return paged("搜索结果", scope, all, offsetArg, limitArg, SEARCH_LIST_CHAR_BUDGET,
                "search_files", serverCap, (from, to) -> renderHits(all, from, to));
    }

    /** 渲染 [from,to) 的索引命中行：序号. path+name  大小  命中类型 */
    private static String renderHits(List<?> all, int from, int to) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Object o = all.get(i);
            if (!(o instanceof Map)) {
                sb.append(i + 1).append(". ").append(o).append("\n");
                continue;
            }
            Map<?, ?> h = (Map<?, ?>) o;
            sb.append(i + 1).append(". ").append(str(h.get("name")))
                    .append("  ").append(hitPathText(h.get("path")))
                    .append("  ").append(sizeText(h.get("size")))
                    .append("  命中=").append(hitTypeText(h.get("hitType"))).append("\n");
        }
        return sb.toString();
    }

    /**
     * `grep_files`（磁盘扫描）结果渲染：命中文件 + **截断后的片段**。
     *
     * <p>实测 dev：仓库 5 搜“测试”命中的 16 条里，一条日志文件的"命中行"就有几十万字符，整个响应
     * **687130 字符**（0.7MB）——原实现 fmt 后只留 4000 字符的半截 JSON，模型完全拿不到可用信息。
     * 这里每行只给 path/name + 大小 + ≤{@link #GREP_SNIPPET_LEN} 字符的片段（服务端的 `line` 字段不输出）。
     */
    static String formatGrepPage(Map<String, Object> resp, String pattern, String pathFilter,
                                 Integer offsetArg, Integer limitArg, int serverCap) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof List)) {
            return "扫描结果为空（服务器返回：" + data + "）";
        }
        List<?> all = (List<?>) data;
        String scope = "关键词「" + pattern + "」"
                + (pathFilter == null || pathFilter.isEmpty() ? "" : "，path=" + quoted(pathFilter));
        if (all.isEmpty()) {
            return "没有命中：" + scope + "。\n建议：换关键词（大小写不敏感、子串匹配）；限定 path 缩小范围。";
        }
        return paged("内容扫描结果", scope, all, offsetArg, limitArg, SEARCH_LIST_CHAR_BUDGET,
                "grep_files", serverCap, (from, to) -> renderGrepHits(all, from, to));
    }

    /** 渲染 [from,to) 的 grep 命中行（片段截断；不输出原始 line 字段） */
    private static String renderGrepHits(List<?> all, int from, int to) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Object o = all.get(i);
            if (!(o instanceof Map)) {
                sb.append(i + 1).append(". ").append(o).append("\n");
                continue;
            }
            Map<?, ?> h = (Map<?, ?>) o;
            String name = str(h.get("name"));
            String path = normalizeDocPath(str(h.get("path")));
            sb.append(i + 1).append(". ").append(path).append(name)
                    .append("  ").append(sizeText(h.get("size"))).append("\n");
            String snip = str(h.get("snippet"));
            Object lineObj = h.get("line");
            String source = snip.isEmpty() && lineObj != null ? str(lineObj) : snip;
            sb.append("   片段：").append(shortText(source, GREP_SNIPPET_LEN)).append("\n");
        }
        return sb.toString();
    }

    /** 索引命中的 path 文案（服务端口径：所在目录，以 / 结尾，根目录为空） */
    private static String hitPathText(Object path) {
        String p = normalizeDocPath(str(path));
        return p.isEmpty() ? "path=\"\"" : "path=" + quoted(p);
    }

    /** hitType 是位掩码（1=文件名 2=内容 4=备注） */
    static String hitTypeText(Object hitType) {
        Integer t = intOf(hitType);
        if (t == null) {
            return "未知";
        }
        StringBuilder sb = new StringBuilder();
        if ((t.intValue() & 1) != 0) {
            sb.append("文件名");
        }
        if ((t.intValue() & 2) != 0) {
            sb.append(sb.length() > 0 ? "+内容" : "内容");
        }
        if ((t.intValue() & 4) != 0) {
            sb.append(sb.length() > 0 ? "+备注" : "备注");
        }
        return sb.length() == 0 ? "未知(" + t + ")" : sb.toString();
    }

    private static boolean isOk(Map<String, Object> resp) {
        return resp != null && "ok".equals(String.valueOf(resp.get("status")));
    }

    /**
     * 通用分页骨架：表头（命中数 / 本次区间）+ 正文 + 续页提示（列表类工具统一句式）。
     *
     * @param serverCap 服务端返回条数上限（0/负数 = 该来源不受上限约束，可视为"全部命中"）。
     *                  <b>为什么需要它</b>：服务端不会给出真实总数，把 "20 条"（= maxResults 默认值）
     *                  写成"共 20 条"会让模型误以为这就是全部命中（2026-09-20 页面 E2E 实测踩坑）。
     *                  这里改为：等于上限时明说"已达上限、可能还有更多"，不到上限才说"全部命中"。
     */
    private static String paged(String title, String scope, List<?> all, Integer offsetArg, Integer limitArg,
                                int budget, String toolName, int serverCap, RowRenderer rows) {
        int total = all.size();
        int cap = Math.max(0, serverCap);
        boolean capped = cap > 0 && total >= cap;
        int offset = offsetArg == null ? 0 : Math.max(0, offsetArg.intValue());
        int limit = limitArg == null ? SEARCH_LIST_DEFAULT_LIMIT
                : Math.min(SEARCH_LIST_MAX_LIMIT, Math.max(1, limitArg.intValue()));
        String countText = capped
                ? "服务端返回 " + total + " 条（已达 maxResults=" + cap + " 上限，可能还有更多命中）"
                : "共 " + total + " 条（全部命中）";
        if (offset >= total) {
            return title + "：" + scope + " " + countText + "；offset=" + offset
                    + " 已超出范围（有效范围 0~" + (total - 1) + "）。";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(title).append("：").append(scope).append("  ").append(countText)
                .append("，本次显示第 ").append(offset + 1).append("-");
        PageBody page = fitPage(total, offset, limit, budget - sb.length() - 200, rows);
        sb.append(page.end).append(" 条\n").append(page.body);
        if (page.end < total) {
            sb.append("\n").append(moreHint(total - page.end, toolName, page.end));
        }
        if (capped) {
            sb.append("\n").append(capNote(cap));
        }
        return sb.toString();
    }

    /** 单行文案截断（超出加省略号） */
    static String shortText(String s, int maxLen) {
        if (s == null) {
            return "";
        }
        String t = s.replace('\n', ' ').replace('\r', ' ').trim();
        return t.length() <= maxLen ? t : t.substring(0, maxLen) + "…";
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
        // 口径唯一实现在 AgentFocusSupport.normalizePath（注入块与工具层必须同一套规则，
        // 否则「模型看到的 path」与「工具发出去的 path」会差一个斜杠 = 另一个 docId）
        return com.DocSystem.agent.focus.AgentFocusSupport.normalizePath(path);
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
