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
        reg.register(writeOffice(client));
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
        return ToolDefinition.builder("get_login_user",
                "查看当前登录用户（名称/userId/角色）与可用性。"
                        + "用于回答“我是谁/我有什么权限”，或确认会话是否有效；不返回邮箱/手机号等个人信息。",
                args -> ToolResult.ok(formatLoginUser(client.getLoginUser())))
                .build();
    }

    /**
     * 当前用户紧凑回执。
     *
     * <p>实测原实现 `fmt()` 倒整包 JSON（231 字符），包含 `tel`（手机号）、`email`、`docSysType` 等
     * 与任务无关的个人信息；这里只留名称/id/角色。
     */
    static String formatLoginUser(Map<String, Object> resp) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            return "未获取到登录用户信息（服务器返回：" + shortText(String.valueOf(data), 80) + "）";
        }
        Map<?, ?> u = (Map<?, ?>) data;
        String name = str(u.get("name"));
        String id = str(u.get("id"));
        return "当前登录用户：" + (name.isEmpty() ? "（未匿名）" : name) + "（userId=" + id + "，角色："
                + userTypeLabel(u.get("type")) + "）\n"
                + "⚠️ 会话无效时会返回未登录错误（NOT_LOGIN），此时应提示用户重新登录。";
    }

    /** 用户类型文案（type：0 普通用户 / 1 管理员 / 2 超级管理员） */
    static String userTypeLabel(Object type) {
        Integer t = intOf(type);
        if (t == null) {
            return "未知";
        }
        switch (t) {
            case 0:
                return "普通用户";
            case 1:
                return "管理员";
            case 2:
                return "超级管理员";
            default:
                return "类型 " + t;
        }
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
                + "Office/PDF（" + com.DocSystem.agent.attachment.AgentAttachmentSupport.SUPPORTED_EXTRACT_HINT
                + "）返回转换后的文本；odt/ods/odp/rtf 等暂不支持提取，会明确报出原因。"
                + "长文本分次读：表头会给总字符数与本次区间，未读完时页脚会给出下一次的 offset。"
                + "非文本文件（图片/压缩包/可执行文件等）没有文本表示，只返回元信息。",
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
                intProp("vid", "仓库ID（**可选**）。省略或传 -1 = 跨全部可访问仓库搜索（结果每行带 vid 与仓库名）；" +
                        "已知在哪个仓库就传 vid，更快也更准。⚠️ 只有搜索能省略 vid：读写/改名/删除等操作一律必须明确 vid。"),
                strProp("query", "查询条件（必填，JSON 字符串）。格式：{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}],\"should\":[{\"field\":\"name\",\"term\":\"周报\"}],\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}。field: name(文件名)/content(文件内容)/comment(备注)；match: term(默认，大小写不敏感、中文分词，**推荐**)/wildcard/prefix/fuzzy。wildcard/prefix/fuzzy 仅对 field=name 生效，且**关键字必须全小写**（实测大写 0 条）；不确定就用 term。"),
                strProp("path", "目录限定（可选，仓库内相对路径，如 66666/）"),
                intProp("maxResults", "服务端返回的命中数上限（可选，默认 20，上限 100）。注意：这是**取回多少条**而不是总数；表头说“已达 maxResults 上限”时说明可能还有更多，想看全就把它调大。"),
                boolProp("withSnippet", "是否返回命中片段（可选，默认 true）"),
                intProp("offset", "结果内分页起点（可选，默认 0）"),
                intProp("limit", "本页显示条数（可选，默认 " + SEARCH_LIST_DEFAULT_LIMIT
                        + "，最大 " + SEARCH_LIST_MAX_LIMIT + "）"));
        JSONObject schema = objSchema(props, new String[]{"query"});
        return ToolDefinition.builder("search_files",
                "按名字/内容搜索文档（简称/全名都行），**不确定在哪个仓库时可以不传 vid**："
                        + "那样会跨全部可访问仓库搜索（每个仓库先做 path+name 精确直查，再查全文索引），结果每行带 vid 与仓库名。"
                        + "拿到 vid 后请把它**显式**传给后续工具（读、写、删除、改名等一律要求 vid）。"
                        + "结果是一条条紧凑命中（类型/名称/path/大小/命中来源），表头区分“全部命中”与“已达服务端 maxResults 上限（可能还有更多）”，"
                        + "超过一页面时用 offset/limit 翻页（页大小会因路径长度自适应，以表头的区间为准）。"
                        + "⚠️ 索引只覆盖 DocSys 建过索引的条目，因此本工具对“恰好一个不含通配符的 name 条件”会额外做一次**磁盘精确直查**"
                        + "（path+name 直接确认存在性，含目录、覆盖未建索引项），命中行标注“命中=直查”；"
                        + "但要找的是**目录内容**仍应直接 list_docs。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    String query = args.getString("query");
                    if (query == null || query.isEmpty()) {
                        return ToolResult.error("query 必填（JSON 字符串，见参数说明）");
                    }
                    if (vid != null && vid.intValue() == -1) {
                        vid = null;   // -1 与省略等价
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
                intProp("vid", "仓库ID（必填，单仓库；不确定先调 list_repos 或用 search_files 不带 vid 找）"),
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
                        + "用于 search_files 搜不到的情况（文件刚放入仓库尚未建立索引），或需要精确匹配原始文本时。"
                        + "⚠️ 它**只匹配文件内容**：不匹配文件名、也**从不返回目录**——找名字/找目录请用 search_files（可跨仓库）或 list_docs。"
                        + "只支持单仓库（vid 必填）：跨仓 grep 等于逐仓全盘扫描，成本量级不同。",
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
        JSONObject schema = objSchema(props(
                strProp("taskId", "备份任务 ID（必填）。取自 backup_repos 回执里的“任务ID”，形如 \"19-20260920201904\"；"
                        + "不要自己拼，也不要沿用过期的 ID")), new String[]{"taskId"});
        return ToolDefinition.builder("query_backup_status",
                "查一个仓库全量备份任务的进度/结果（状态、进度、目标文件、失败原因）。"
                        + "taskId 只能从 backup_repos 的回执里拿（格式：仓库id-时间戳）；"
                        + "任务不存在会回 TASK_NOT_FOUND，此时应用 backup_repos 重新发起，不要重试同一个 ID。",
                args -> {
                    String taskId = args.getString("taskId");
                    try {
                        return ToolResult.ok(formatBackupTask(client.queryBackupStatus(taskId), taskId));
                    } catch (Exception e) {
                        return ToolResult.error("query_backup_status failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .build();
    }

    /**
     * 备份任务回执（backup_repos / query_backup_status 共用）。
     *
     * <p><b>为什么不倒原始 JSON</b>（2026-09-20 实测）：响应 1047 字符，里面嵌了整个 `repos` 对象与
     * `reposAccess.accessUser` —— 含**用户密码哈希（pwd）、邮箱、手机号、requestIP**，既占上下文又泄露敏感信息。
     * 这里只保留：任务 ID / 状态 / 目标文件 / 存储目录 / 说明。
     */
    static String formatBackupTask(Map<String, Object> resp, String fallbackTaskId) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            return "备份任务 " + fallbackTaskId + "：服务器未返回任务详情（响应：" + shortText(String.valueOf(data), 120) + "）";
        }
        Map<?, ?> m = (Map<?, ?>) data;
        String id = str(m.get("id"));
        StringBuilder sb = new StringBuilder("备份任务 " + (id.isEmpty() ? fallbackTaskId : id) + "：\n");
        sb.append("- 状态：").append(backupStateText(m.get("status"), m.get("stopFlag")));
        if (m.get("info") != null) {
            sb.append("（").append(shortText(str(m.get("info")), 60)).append("）");
        }
        String targetName = str(m.get("targetName"));
        if (!targetName.isEmpty()) {
            sb.append("\n- 目标文件：").append(targetName);
        }
        String targetPath = str(m.get("targetPath"));
        if (!targetPath.isEmpty()) {
            sb.append("\n- 存储目录：").append(targetPath);
        }
        Object size = m.get("targetSize");
        if (size != null && String.valueOf(size).length() > 0 && !"0".equals(String.valueOf(size))) {
            sb.append("\n- 文件大小：").append(sizeText(size));
        }
        String backupTime = str(m.get("backupTime"));
        if (!backupTime.isEmpty()) {
            sb.append("\n- 发起时间：").append(backupTime);
        }
        sb.append("\n（备份异步执行；稍后再用同一个 taskId 调 query_backup_status 看进度）");
        return sb.toString();
    }

    /** 备份任务状态（state/stopFlag 是真实字段，已实测） */
    static String backupStateText(Object status, Object stopFlag) {
        Integer s = intOf(status);
        boolean stopped = stopFlag != null && Boolean.parseBoolean(String.valueOf(stopFlag));
        if (stopped) {
            return "已中止";
        }
        if (s == null) {
            return "未知";
        }
        switch (s) {
            case 0:
                return "已完成";
            case 1:
                return "进行中";
            case 2:
                return "失败";
            default:
                return "状态码 " + s;
        }
    }

    // ==================== 写操作工具（T3.2，全部 needsConfirm） ====================

    /** W1 创建仓库 */
    public static ToolDefinition createRepos(DocSysClient client) {
        JSONObject props = props(
                strProp("name", "仓库名称（必填）。同名仓库已存在时会直接拒绝"),
                strProp("path", "仓库存储目录的绝对路径（必填，如 \"C:/DocSysReposes/20/\"）。"
                        + "该目录不能是已有仓库路径的子目录（服务端会报“已被使用”）；目录不存在时服务端会创建"),
                strProp("info", "描述（可选）"),
                intProp("type", "仓库类型（可选，0=文件管理系统（默认）/3=SVN 前置/4=GIT 前置/5=文件服务器前置）"),
                intProp("verCtrl", "版本控制（可选，0=无（默认）/1=SVN/2=GIT/3=磁盘）"));
        JSONObject schema = objSchema(props, new String[]{"name", "path"});
        return ToolDefinition.builder("create_repos",
                "新建一个仓库（会在指定 path 建目录，并写入仓库配置与权限记录）。"
                        + "生效范围是**全局**（所有有权限的用户都能看到），属管理动作：请先向用户确认名称与存储路径。"
                        + "成功后回执会给出新仓库的 vid（后续 list_docs/write_file 等都要用它）。"
                        + "⚠️ 服务端**不会拦截同名/同路径重复创建**（实测会生成第 2 条仓库记录）——本工具已先查一遍，"
                        + "命中同名就拒绝并报 REPOS_EXISTS。",
                args -> {
                    String name = args.getString("name");
                    String path = args.getString("path");
                    try {
                        String exists = findExistingRepos(client, name, path);
                        if (exists != null) {
                            return ToolResult.error(exists);
                        }
                        Map<String, Object> resp = client.addRepos(
                                name, args.getString("info"),
                                args.getInteger("type"), path,
                                null, args.getInteger("verCtrl"), null, null, null, null, null,
                                null, null, null, null, null, null);
                        return ToolResult.ok(formatReposCreated(resp, name, path, findReposIdByName(client, name)));
                    } catch (Exception e) {
                        return ToolResult.error("create_repos failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** 创建前同名/同路径查重（服务端不拦重复创建，实测会生成第 2 条记录） */
    @SuppressWarnings("unchecked")
    private static String findExistingRepos(DocSysClient client, String name, String path) throws Exception {
        Map<String, Object> resp = client.getReposList();
        Object data = resp == null ? null : resp.get("data");
        if (!(data instanceof List)) {
            return null;
        }
        String normPath = path == null ? "" : path.replace('\\', '/');
        for (Object o : (List<Object>) data) {
            if (!(o instanceof Map)) {
                continue;
            }
            Map<String, Object> m = (Map<String, Object>) o;
            String existName = str(m.get("name"));
            String existPath = str(m.get("path"));
            if (name != null && name.equals(existName)) {
                return "仓库已存在：名称「" + name + "」已被 vid=" + m.get("id") + " 占用（REPOS_EXISTS）。"
                        + "请换一个名称，或先用 get_repos 查看现有仓库。";
            }
            if (!normPath.isEmpty() && existPath.replace('\\', '/').replaceAll("/+$", "")
                    .equals(normPath.replaceAll("/+$", ""))) {
                return "仓库已存在：存储路径 " + path + " 已被名称「" + existName + "」(vid=" + m.get("id")
                        + ") 占用（REPOS_EXISTS）。请换一个存储目录。";
            }
        }
        return null;
    }

    /** 创建后回查 vid（addRepos 的响应不带 id，但模型下一步要用） */
    @SuppressWarnings("unchecked")
    private static Integer findReposIdByName(DocSysClient client, String name) {
        try {
            Map<String, Object> resp = client.getReposList();
            Object data = resp == null ? null : resp.get("data");
            if (data instanceof List) {
                for (Object o : (List<Object>) data) {
                    Map<String, Object> m = (Map<String, Object>) o;
                    if (name != null && name.equals(str(m.get("name")))) {
                        return intOf(m.get("id"));
                    }
                }
            }
        } catch (Exception ignored) {
            // 查不到 vid 不影响创建结果，回执里会提示用 list_repos 查
        }
        return null;
    }

    /** 创建仓库回执（不回原始 JSON；失败时回原 JSON 以保留 errorCode） */
    static String formatReposCreated(Map<String, Object> resp, String name, String path, Integer vid) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        return "已创建仓库：\n"
                + "名称：" + name + "\n"
                + "路径：" + path + "\n"
                + "vid：" + (vid == null ? "（未回查到，请用 list_repos 确认）" : String.valueOf(vid)) + "\n"
                + "下一步：用 list_docs(vid=" + (vid == null ? "…" : String.valueOf(vid))
                + ") 看目录，或直接 write_file/create_folder 写入。";
    }

    /** W2 删除仓库 */
    public static ToolDefinition deleteRepos(DocSysClient client) {
        JSONObject schema = objSchema(props(intProp("vid", "仓库ID（必填，来自 list_repos）")), new String[]{"vid"});
        return ToolDefinition.builder("delete_repos",
                "删除仓库（属破坏性管理动作，会影响所有有权限的用户，必须先跟用户确认）。"
                        + "实际行为（已实测）：删除仓库配置与**权限/文档授权记录**；"
                        + "⚠️ **磁盘上的文件目录不会被删除**（数据保留，可在管理后台勾选“删除数据”彻底清理）。"
                        + "回执会告知保留目录的位置。删除后原有的 docId/path 全部失效。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    try {
                        // 先取一份名称/路径用于回执（删除后查不到了）。
                        // ⚠️ 实测：备份任务进行中对同一仓库调 getRepos 会失败（仓库忙）——
                        // 所以这里还要回退到 getReposList()（列表读不受忙状态影响），否则回执会丢名称与目录。
                        String[] label = lookupReposLabel(client, vid);
                        return ToolResult.ok(formatReposDeleted(client.deleteRepos(vid), vid, label[0], label[1]));
                    } catch (Exception e) {
                        return ToolResult.error("delete_repos failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** 取仓库的 [名称, 存储路径]：先试 getRepos（详情），失败则回退 getReposList（列表） */
    @SuppressWarnings("unchecked")
    private static String[] lookupReposLabel(DocSysClient client, Integer vid) {
        try {
            Map<String, Object> detail = client.getRepos(vid);
            Object data = detail == null ? null : detail.get("data");
            if (data instanceof Map) {
                Map<?, ?> m = (Map<?, ?>) data;
                String name = str(m.get("name"));
                String path = str(m.get("path"));
                if (!name.isEmpty() || !path.isEmpty()) {
                    return new String[]{name, path};
                }
            }
        } catch (Exception ignored) {
            // 仓库忙/无权限 → 走列表兜底
        }
        try {
            Map<String, Object> resp = client.getReposList();
            Object data = resp == null ? null : resp.get("data");
            if (data instanceof List) {
                for (Object o : (List<Object>) data) {
                    Map<String, Object> m = (Map<String, Object>) o;
                    if (vid != null && vid.equals(intOf(m.get("id")))) {
                        return new String[]{str(m.get("name")), str(m.get("path"))};
                    }
                }
            }
        } catch (Exception ignored) {
            // 取不到就只回状态
        }
        return new String[]{"", ""};
    }

    /** 删除仓库回执（失败保留错误码） */
    static String formatReposDeleted(Map<String, Object> resp, Integer vid, String name, String path) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        String label = name == null || name.isEmpty() ? "" : "「" + name + "」";
        return "已删除仓库" + label + "（vid=" + vid + "）：仓库配置、权限与文档授权记录已移除。\n"
                + "⚠️ 磁盘文件未删除" + (path == null || path.isEmpty() ? "（目录位置未知，可在管理后台查看）"
                        : "：" + path) + "\n"
                + "如需彻底清理数据，请在管理后台的仓库列表里勾选“删除数据”后重试。";
    }

    /** W3 更新仓库信息（R3-1：参数名与其他工具统一为 vid；旧名 reposId 已下线，不再对外暴露） */
    public static ToolDefinition updateRepos(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填，来自 list_repos）"),
                strProp("name", "新名称（可选，不传则不改）"),
                strProp("info", "新描述（可选，不传则不改）"),
                strProp("path", "新存储路径（可选，一般不要改）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("update_repos",
                "修改仓库的名称/描述/存储路径（只改传入的字段，其余保持原样）。"
                        + "仓库 ID 参数是 **vid**（早期版本的 reposId 已废弃，不要再传；只有本工具曾用过这个别名）。"
                        + "改名前建议先跟用户确认。",
                args -> {
                    Integer vid = args.getInteger("vid") != null ? args.getInteger("vid") : args.getInteger("reposId");
                    String name = args.getString("name");
                    String info = args.getString("info");
                    String path = args.getString("path");
                    if (name == null && info == null && path == null) {
                        return ToolResult.error("没有要修改的字段：name / info / path 至少传一个");
                    }
                    try {
                        String before = null;
                        if (path != null) {
                            Map<String, Object> detail = client.getRepos(vid);
                            Object data = detail == null ? null : detail.get("data");
                            if (data instanceof Map) {
                                before = str(((Map<?, ?>) data).get("path"));
                            }
                        }
                        return ToolResult.ok(formatReposUpdated(client.updateReposInfo(
                                vid, name, info, null, path, null, null, null, null, null, null, null,
                                null, null, null, null, null), vid, name, info, path, before));
                    } catch (Exception e) {
                        return ToolResult.error("update_repos failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /** 更新仓库回执（失败保留错误码；改存储路径时提醒旧目录不会搬） */
    static String formatReposUpdated(Map<String, Object> resp, Integer vid, String name, String info, String path,
                                     String pathBefore) {
        if (!isOk(resp)) {
            return fmt(resp);
        }
        StringBuilder sb = new StringBuilder("已更新仓库 vid=" + vid + "：");
        if (name != null) {
            sb.append("\n- 名称 → ").append(name);
        }
        if (info != null) {
            sb.append("\n- 描述 → ").append(shortText(info, 60));
        }
        if (path != null) {
            sb.append("\n- 存储路径 → ").append(path);
            if (pathBefore != null && !pathBefore.isEmpty() && !pathBefore.equals(path)) {
                sb.append("\n⚠️ 只改了配置指向：旧目录 ").append(pathBefore)
                        .append(" 里的文件没有搬过去，如需迁移请手工处理。");
            }
        }
        return sb.toString();
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
                    String path = normalizeDocPath(args.getString("path"));
                    String name = args.getString("name");
                    try {
                        Map<String, Object> resp = callWithLockRetry("create_folder", () -> client.addDoc(
                                vid, null, path, name, 2, null, null, args.getString("commitMsg")));
                        return ToolResult.ok(writeReceipt(resp, "创建目录",
                                docTargetText(vid, path, name + "/"),
                                "下一步：用 list_docs(vid=" + vid + ", path=\"" + path + name + "/\") 看它里面的内容。"));
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
                    String path = normalizeDocPath(args.getString("path"));
                    String name = args.getString("name");
                    try {
                        Map<String, Object> resp = callWithLockRetry("write_file", () -> client.writeTextDoc(
                                vid, path, name, content, args.getString("commitMsg")));
                        Object size = sizeOfData(resp, "size");
                        return ToolResult.ok(writeReceipt(resp, "写入文件",
                                docTargetText(vid, path, name) + (size == null ? "" : "（" + sizeText(size) + "）"),
                                "回执不包含正文；要核对内容请用 get_doc 读回。"));
                    } catch (Exception e) {
                        return ToolResult.error("write_file failed: " + e.getMessage());
                    }
                })
                .parameters(schema)
                .isWrite(true).needsConfirm(true)
                .build();
    }

    /**
     * W4d 新建 Office 文件（P2：/Doc/agentWriteOffice.do，服务端 POI 生成）。
     *
     * <p><b>为什么单独一个工具，而不是扩 write_file</b>：write_file 是「文本 → 文本」，正文直接进模型上下文、
     * 走 content+charset 落盘；Office 是二进制，且内容要用**结构描述(spec)** 表达，两者参数面与错误面完全不同。</p>
     *
     * <p><b>只新建、不修改</b>：修改已有文件需要「预检不支持的构件 + 写后部件级不变量校验」，
     * 尚未开放（服务端会对已存在目标直接拒绝）——工具描述里必须让模型知道，避免它反复试。</p>
     */
    public static ToolDefinition writeOffice(DocSysClient client) {
        JSONObject props = props(
                intProp("vid", "仓库ID（必填）"),
                strProp("path", "目标目录的相对路径（必填，如 \"66666/\"；根目录传空串 \"\"）"),
                strProp("name", "文件名（必填，含后缀）：只支持 .docx / .xlsx / .pptx（老格式 .doc/.xls/.ppt 不写）"),
                strProp("spec", "内容描述（必填，JSON 字符串）：docx → {\"paragraphs\":[{\"text\":\"标题\",\"style\":\"Title\"},\"正文…\"]}；"
                        + "xlsx → {\"sheet\":\"Sheet1\",\"rows\":[[\"名称\",\"数量\"],[\"苹果\",3]]}；"
                        + "pptx → {\"slides\":[{\"title\":\"标题\",\"bullets\":[\"要点1\",\"要点2\"]}]}"),
                strProp("commitMsg", "提交信息（可选）"));
        JSONObject schema = objSchema(props, new String[]{"vid", "path", "name", "spec"});
        return ToolDefinition.builder("write_office",
                "新建 Office 文件（docx/xlsx/pptx）——用于「把内容生成一份 Word/Excel/PPT」这类需求。"
                        + "path = 目标目录的相对路径（根目录传空串），name = 文件名（**必须带 .docx/.xlsx/.pptx**），"
                        + "spec = 内容描述 JSON（见参数说明）。定位用 path+name，不要传 docId/pid。"
                        + "⚠️ 只能**新建**：目标已存在会被拒绝（不会覆盖）；修改已有 Office 文件尚未开放。"
                        + "⚠️ 老格式 .doc/.xls/.ppt 不支持写入（各厂家写入一律用新格式）。"
                        + "要写纯文本/代码/CSV 用 write_file；要写文档备注用 write_note。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    if (vid == null) {
                        return ToolResult.error("vid 必填（仓库ID）");
                    }
                    String name = args.getString("name");
                    String spec = args.getString("spec");
                    if (name == null || name.trim().isEmpty()) {
                        return ToolResult.error("name 必填（文件名，含 .docx/.xlsx/.pptx 后缀）");
                    }
                    if (spec == null || spec.trim().isEmpty()) {
                        return ToolResult.error("spec 必填（内容描述 JSON，见参数说明）");
                    }
                    String path = normalizeDocPath(args.getString("path"));
                    try {
                        Map<String, Object> resp = callWithLockRetry("write_office", () -> client.writeOfficeDoc(
                                vid, path, name.trim(), spec, args.getString("commitMsg")));
                        Object size = sizeOfData(resp, "size");
                        return ToolResult.ok(writeReceipt(resp, "新建 Office 文件",
                                docTargetText(vid, path, name.trim()) + (size == null ? "" : "（" + sizeText(size) + "）"),
                                "回执不含正文；要核对内容请用 get_doc 读回（Office 会返回抽取的文本）。"));
                    } catch (Exception e) {
                        return ToolResult.error("write_office failed: " + e.getMessage());
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
                            return ToolResult.ok(writeReceipt(res, "更新备注",
                                    docTargetText(vid, path, name) + "（备注 " + content.length() + " 字符）"));
                        }
                        if (msg != null && msg.contains("不存在")) {
                            // 文档不存在 → 创建条目并写入备注（addDoc+content 即备注语义）
                            Map<String, Object> createdNote = callWithLockRetry("write_note", () -> client.addDoc(
                                    vid, null, path, name, 1, null, content, commitMsg));
                            return ToolResult.ok(writeReceipt(createdNote, "新建文档并写入备注",
                                    docTargetText(vid, path, name) + "（备注 " + content.length() + " 字符）"));
                        }
                        return ToolResult.ok(failReceipt(res));
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
                args -> {
                    Integer vid = args.getInteger("vid");
                    String path = normalizeDocPath(args.getString("path"));
                    String name = args.getString("name");
                    try {
                        Map<String, Object> resp = callWithLockRetry("delete_doc", () -> client.deleteDoc(
                                vid, null, null, path, name, null, args.getString("commitMsg")));
                        return ToolResult.ok(writeReceipt(resp, "删除", docTargetText(vid, path, name),
                                "该对象的 docId 已失效，不要再引用；如需确认请用 list_docs 看当前目录。"));
                    } catch (Exception e) {
                        return ToolResult.error("delete_doc failed: " + e.getMessage());
                    }
                })
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
                args -> {
                    Integer vid = args.getInteger("vid");
                    String path = normalizeDocPath(args.getString("path"));
                    String name = args.getString("name");
                    String dstName = args.getString("dstName");
                    try {
                        Map<String, Object> resp = callWithLockRetry("rename_doc", () -> client.renameDoc(
                                vid, null, null, path, name, null, dstName, args.getString("commitMsg")));
                        return ToolResult.ok(writeReceipt(resp, "重命名",
                                name + " → " + dstName + "（在 " + displayPath(path) + " 下）"));
                    } catch (Exception e) {
                        return ToolResult.error("rename_doc failed: " + e.getMessage());
                    }
                })
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
                args -> {
                    Integer vid = args.getInteger("vid");
                    String srcPath = normalizeDocPath(args.getString("srcPath"));
                    String srcName = args.getString("srcName");
                    String dstPath = normalizeDocPath(args.getString("dstPath"));
                    String dstName = args.getString("dstName");
                    try {
                        Map<String, Object> resp = callWithLockRetry("move_doc", () -> client.moveDoc(
                                vid, null,
                                null, srcPath, srcName, levelOfDocPath(srcPath),
                                null, dstPath, dstName, levelOfDocPath(dstPath),
                                null, args.getString("commitMsg")));
                        return ToolResult.ok(writeReceipt(resp, "移动",
                                srcPath + srcName + " → " + displayPath(dstPath)
                                        + (dstName == null || dstName.isEmpty() ? "（原名）" : dstName)));
                    } catch (Exception e) {
                        return ToolResult.error("move_doc failed: " + e.getMessage());
                    }
                })
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
                args -> {
                    Integer vid = args.getInteger("vid");
                    String srcPath = normalizeDocPath(args.getString("srcPath"));
                    String srcName = args.getString("srcName");
                    String dstPath = normalizeDocPath(args.getString("dstPath"));
                    String dstName = args.getString("dstName");
                    try {
                        Map<String, Object> resp = callWithLockRetry("copy_doc", () -> client.copyDoc(
                                vid, null,
                                null, srcPath, srcName, levelOfDocPath(srcPath),
                                null, dstPath, dstName, levelOfDocPath(dstPath),
                                null, args.getString("commitMsg")));
                        String finalName = dstName == null || dstName.isEmpty() ? srcName : dstName;
                        return ToolResult.ok(writeReceipt(resp, "复制",
                                srcPath + srcName + " → " + docTargetText(vid, dstPath, finalName)
                                        + "（原文件仍在原处）"));
                    } catch (Exception e) {
                        return ToolResult.error("copy_doc failed: " + e.getMessage());
                    }
                })
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
                strProp("backupStorePath", "备份文件存放目录的绝对路径（可选，不传用服务端默认）"));
        JSONObject schema = objSchema(props, new String[]{"vid"});
        return ToolDefinition.builder("backup_repos",
                "触发一次仓库**全量备份**（异步：立即返回任务信息，备份完成后会生成 zip）。"
                        + "回执里的“任务 ID”（形如 19-20260920201904）就是后续调 query_backup_status 要传的 taskId。"
                        + "备份会占用磁盘（仓库越大越久），属管理动作，请先确认目标仓库与存放目录。",
                args -> {
                    Integer vid = args.getInteger("vid");
                    try {
                        return ToolResult.ok(formatBackupTask(client.backupRepos(
                                vid, args.getString("backupStorePath")), null));
                    } catch (Exception e) {
                        return ToolResult.error("backup_repos failed: " + e.getMessage());
                    }
                })
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
                + "action=list 列出附件；action=read + name 读取指定附件——"
                + "文本类直接返回内容；Office/PDF（" + com.DocSystem.agent.attachment.AgentAttachmentSupport.SUPPORTED_EXTRACT_HINT
                + "）会抽取成纯文本返回（只有文字，无版式/表格结构/图片），文本较大时可能截断；"
                + "图片与不支持的格式只返回元信息（不得臆造内容）。"
                + "注意：附件不属于仓库，不要用 get_doc/search_files 去找它们。",
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

    /**
     * 写操作回执（R3-2 批 2）：成功不复述原 JSON，只给"做了什么 + 对象 + 关键量"；失败保留错误码。
     *
     * <p><b>为什么必须收敛</b>（2026-09-20 实测原始体积）：
     * <ul>
     *   <li>`create_folder` 560 字符、`write_file` **1091 字符**、`rename_doc` 444、`move_doc` 417、`delete_doc` 454 ——
     *       里面全是 `localRootPath`/`reposPath`/`localVRootPath`/`remotePath`/`offsetPath`/`sortIndex`/
     *       `autoCharsetDetect`/`creatorName`/`latestEditorName`/`isBussiness`/`officeType`/`checkSum`/
     *       `dataEx.actionList`（整个内部动作列表）/`debugLog`（含远端推送日志）等模型完全用不到的内部字段；</li>
     *   <li>更糟的是**写入的正文会被原样回显**（`content:"…"`）—— 写大文件时模型上下文会被自己刚写的正文塞满，
     *       超过 4000 就被截断，真正的结果字段反而看不到了。</li>
     * </ul>
     */
    static String writeReceipt(Map<String, Object> resp, String action, String target) {
        return writeReceipt(resp, action, target, null);
    }

    static String writeReceipt(Map<String, Object> resp, String action, String target, String extraLine) {
        if (!isOk(resp)) {
            return failReceipt(resp);
        }
        StringBuilder sb = new StringBuilder("✅ 已").append(action).append("：").append(target);
        if (extraLine != null && !extraLine.isEmpty()) {
            sb.append("\n").append(extraLine);
        }
        return sb.toString();
    }

    /**
     * 写操作失败回执：只给「人话原因 + 错误码 + 处置提示」，丢掉 `debugLog`/`dataEx` 这些内部字段。
     *
     * <p>实测失败响应也不小（`write_file` 失败时 1045 字符，其中 `debugLog` 带着锁的内部信息），
     * 而那些信息对模型没有可操作性；保留 `[错误码: X]` 是为了不被反复重试（R1-1 成果）。
     */
    static String failReceipt(Map<String, Object> resp) {
        if (resp == null) {
            return "(empty response)";
        }
        String code = errorCodeOf(resp);
        String msg = str(resp.get("msgInfo"));
        if (msg.isEmpty()) {
            msg = "操作失败（服务端未给出原因）";
        }
        StringBuilder sb = new StringBuilder("❌ ").append(shortText(msg, 200));
        if (code != null) {
            sb.append("\n[错误码: ").append(code).append("]").append(guidanceFor(code));
        }
        return sb.toString();
    }

    /** 取响应里 data 对象的某个字段（回执用；取不到返回 null） */
    static Object sizeOfData(Map<String, Object> resp, String key) {
        if (resp == null) {
            return null;
        }
        Object data = resp.get("data");
        return data instanceof Map ? ((Map<?, ?>) data).get(key) : null;
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
            boolean knownUnsupported = com.DocSystem.agent.attachment.AgentAttachmentSupport
                    .isKnownUnsupportedForText(name);
            return "文件（无正文可读）：" + target + "\n"
                    + "  大小：" + sizeText(size) + "\n"
                    + (knownUnsupported
                        ? "  说明：格式 " + com.DocSystem.agent.attachment.AgentAttachmentSupport.extensionOf(name)
                          + " 暂不支持文本提取（当前支持："
                          + com.DocSystem.agent.attachment.AgentAttachmentSupport.SUPPORTED_EXTRACT_HINT
                          + "）。要拿原件请在 Web 界面预览/下载。"
                        : "  说明：get_doc 只返回文本内容（txt/csv/md/代码/Office 转换后的文本等）；"
                          + "此文件类型没有文本表示，需要原件请在 Web 界面预览/下载。");
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
        Map<?, ?> meta = asMap(resp.get("msgData"));
        boolean crossRepos = vid == null || Boolean.TRUE.equals(meta.get("crossRepos"));
        String scope = searchScopeText(vid, pathFilter, query, meta);
        if (all.isEmpty()) {
            return (crossRepos ? "全部仓库都没有命中：" : "没有命中：") + scope + crossReposNote(meta) + "。\n"
                    + "建议：先用默认的 term 模式换关键词（大小写不敏感、子串匹配）；"
                    + "确实需要通配时才用 wildcard/prefix（仅对 name 生效，且关键字必须全小写，大写会 0 条）；"
                    + "找目录/看目录里有什么用 list_docs（传 path 进入子目录）；"
                    + "文件刚放入仓库、索引还没建时可能搜不到，改用 grep_files 直接在磁盘上扫内容。";
        }
        return paged("搜索结果", scope + crossReposNote(meta), all, offsetArg, limitArg, SEARCH_LIST_CHAR_BUDGET,
                "search_files", serverCap, (from, to) -> renderHits(all, from, to, crossRepos))
                + (crossRepos ? CROSS_REPOS_NEXT_STEP : "");
    }

    /**
     * 跨仓命中后的固定下一步提示。
     *
     * <p>用户裁定（2026-09-20）：只有**搜索**能省略 vid；读写/改名/删除等操作一律必须明确 vid
     * （没有 vid 的文件访问会操作到错误的对象）。所以跨仓搜索命中后必须明确告诉模型"把 vid 带上"。</p>
     */
    private static final String CROSS_REPOS_NEXT_STEP =
            "下一步：命中行里的 vid 就是“它在哪个仓库”的答案 —— 后续读写/改名/删除请把它显式传进去"
                    + "（如 list_docs(vid=5, path=\"66666/\")、get_doc(vid=5, path=\"\", name=\"x\")）。\n";

    /** 搜索范围文案：单仓库 → "仓库 5"；跨仓库 → "全部可访问仓库（共 17 个，已扫 17 个）" */
    private static String searchScopeText(Integer vid, String pathFilter, Object query, Map<?, ?> meta) {
        StringBuilder sb = new StringBuilder();
        if (vid == null) {
            Object total = meta.get("reposTotal");
            Object scanned = meta.get("reposScanned");
            sb.append("跨全部可访问仓库（共 ").append(total == null ? "?" : total)
                    .append(" 个，本次已扫 ").append(scanned == null ? "?" : scanned).append(" 个）");
        } else {
            sb.append("仓库 ").append(vid);
        }
        if (pathFilter != null && !pathFilter.isEmpty()) {
            sb.append(" / path=").append(quoted(pathFilter));
        }
        sb.append(" / 查询=").append(shortText(String.valueOf(query), SEARCH_QUERY_LABEL_LEN));
        return sb.toString();
    }

    /**
     * 跨仓搜索的额外如实披露：未扫完 / 失败的仓库必须写出来（"没有命中"与"没扫到"是两回事）。
     * 单仓搜索返回空串。
     */
    private static String crossReposNote(Map<?, ?> meta) {
        if (meta.isEmpty() || !Boolean.TRUE.equals(meta.get("crossRepos"))) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        Object skipped = meta.get("reposSkipped");
        Object total = meta.get("reposTotal");
        Object scanned = meta.get("reposScanned");
        if (intOf(skipped) != null && intOf(skipped).intValue() > 0) {
            sb.append("；⚠️ 因命中已满/超时，").append(total).append(" 个仓库里有 ")
                    .append(skipped).append(" 个未扫描（只扫了 ").append(scanned).append(" 个）");
        }
        Object failed = meta.get("reposFailed");
        if (failed instanceof List && !((List<?>) failed).isEmpty()) {
            sb.append("；⚠️ ").append(((List<?>) failed).size()).append(" 个仓库搜索失败：")
                    .append(shortText(String.valueOf(failed), 160));
        }
        return sb.toString();
    }

    /** msgData 之类的可选对象字段转 Map（缺失/非对象 → 空 Map） */
    private static Map<?, ?> asMap(Object o) {
        return o instanceof Map ? (Map<?, ?>) o : java.util.Collections.emptyMap();
    }

    /** 渲染 [from,to) 的命中行：序号. [目录]/[文件] 名称  path  大小  命中来源（跨仓时带 vid） */
    private static String renderHits(List<?> all, int from, int to, boolean crossRepos) {
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < to; i++) {
            Object o = all.get(i);
            if (!(o instanceof Map)) {
                sb.append(i + 1).append(". ").append(o).append("\n");
                continue;
            }
            Map<?, ?> h = (Map<?, ?>) o;
            Integer type = intOf(h.get("type"));
            boolean isDir = type != null && type.intValue() == 2;
            sb.append(i + 1).append(". ");
            if (crossRepos) {
                // 只写 vid=（不写 reposId，避免看起来像倒原始 JSON 字段）
                sb.append("vid=").append(h.get("reposId"));
                String reposName = str(h.get("reposName"));
                if (!reposName.isEmpty()) {
                    sb.append("(").append(reposName).append(")");
                }
                sb.append("  ");
            }
            sb.append(isDir ? "[目录] " : "[文件] ").append(str(h.get("name")));
            if (isDir) {
                sb.append("/");
            }
            sb.append("  ").append(hitPathText(h.get("path")));
            if (!isDir) {
                sb.append("  ").append(sizeText(h.get("size")));
            }
            sb.append("  命中=").append(viaText(h)).append("\n");
        }
        return sb.toString();
    }

    /**
     * 命中来源文案：直查（path+name 精确命中，不依赖索引）/ 索引（文件名/内容/备注）。
     * 区分这两者很重要：直查命中说明"索引里可能没有它"，模型据此判断可信度与下一步。
     */
    static String viaText(Map<?, ?> hit) {
        if ("direct".equals(str(hit.get("via")))) {
            return "直查";
        }
        return hitTypeText(hit.get("hitType"));
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
            // ⚠️ 必须是 JSONArray（不能直接放 String[]）：ToolRegistry.validateParams 用
            // `instanceof List` 判定必填项，String[] 不满足 → 整个工厂的必填校验会被静默跳过。
            // 症状（2026-09-20 体检实测）：create_repos{} 不报“缺必填”，而是抛
            // “Parameter specified as non-null is null: method okhttp3.FormBody$Builder.add”（模型看不懂）。
            com.alibaba.fastjson.JSONArray arr = new com.alibaba.fastjson.JSONArray();
            for (String r : required) {
                arr.add(r);
            }
            schema.put("required", arr);
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
