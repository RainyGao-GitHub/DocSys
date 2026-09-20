package com.DocSystem.agent.client;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import okhttp3.FormBody;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * DocSysClient - HTTP client for DocSystem backend
 *
 * Based on DocSystem source code analysis:
 * - UserController: /User/*
 * - ReposController: /Repos/*
 * - DocController: /Doc/*
 * - QueryController: /Query/*
 *
 * All endpoints require authentication via session cookie.
 */
public class DocSysClient {

    private static final Logger log = LoggerFactory.getLogger(DocSysClient.class);

    private static final MediaType FORM_MEDIA = MediaType.parse("application/x-www-form-urlencoded; charset=UTF-8");
    private static final MediaType JSON_MEDIA = MediaType.parse("application/json; charset=utf-8");

    private final String baseUrl;
    private final OkHttpClient httpClient;
    private String sessionCookie;
    private String currentUsername;

    public DocSysClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();
    }

    // ==================== USER OPERATIONS ====================

    /**
     * Login to DocSystem
     * POST /User/login.do
     * Params: userName, pwd (Base64 encoded), rememberMe
     */
    public Map<String, Object> login(String username, String password) throws Exception {
        // Backend logic:
        // 1. Receive Base64-encoded password from client
        // 2. Base64-decode it to get raw password
        // 3. MD5-hash the raw password
        // 4. Compare with DB password (which is also MD5)
        //
        // So we send: Base64(password) where password is the ORIGINAL password
        // Backend will decode and hash to get the MD5

        String encodedPwd = Base64.getEncoder().encodeToString(password.getBytes(StandardCharsets.UTF_8));

        String url = baseUrl + "/User/login.do";
        Map<String, String> params = new HashMap<>();
        params.put("userName", username);
        params.put("pwd", encodedPwd);
        params.put("rememberMe", "0");

        Response response = postForm(url, params, null);
        try {
            String respBody = responseBodyString(response);
            JSONObject result = JSON.parseObject(respBody);

            if ("ok".equals(result.getString("status"))) {
                this.sessionCookie = extractSessionCookie(response);
                this.currentUsername = username;
                log.info("Logged in as {}", username);
            }

            return result;
        } finally {
            response.close();
        }
    }

    /**
     * Logout
     * POST /User/logout.do
     */
    public Map<String, Object> logout() throws Exception {
        String url = baseUrl + "/User/logout.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            this.sessionCookie = null;
            this.currentUsername = null;
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get current login user info
     * POST /User/getLoginUser.do
     */
    public Map<String, Object> getLoginUser() throws Exception {
        String url = baseUrl + "/User/getLoginUser.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Register new user
     * POST /User/register.do
     */
    public Map<String, Object> register(String userName, String pwd, String pwd2, String verifyCode) throws Exception {
        String url = baseUrl + "/User/register.do";
        Map<String, String> params = new HashMap<>();
        params.put("userName", userName);
        params.put("pwd", pwd);
        params.put("pwd2", pwd2);
        if (verifyCode != null) params.put("verifyCode", verifyCode);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== REPOSITORY OPERATIONS ====================

    /**
     * Get repository list (accessible to current user)
     * POST /Repos/getReposList.do
     */
    public Map<String, Object> getReposList() throws Exception {
        String url = baseUrl + "/Repos/getReposList.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get all repositories (admin only)
     * POST /Repos/getManagerReposList.do
     */
    public Map<String, Object> getManagerReposList() throws Exception {
        String url = baseUrl + "/Repos/getManagerReposList.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get repository details
     * POST /Repos/getRepos.do
     * Params: vid (repository ID)
     */
    public Map<String, Object> getRepos(Integer vid) throws Exception {
        String url = baseUrl + "/Repos/getRepos.do";
        Map<String, String> params = new HashMap<>();
        if (vid != null) params.put("vid", vid.toString());

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Add a new repository
     * POST /Repos/addRepos.do
     *
     * Required params:
     * - name: Repository name
     * - path: Storage path (local directory)
     * - type: Repository type (0=local, 1=remote storage)
     *
     * Optional params:
     * - info: Description
     * - realDocPath: Real document path
     * - remoteServer: Remote server config
     * - remoteStorage: Remote storage type
     * - verCtrl: Version control (0=none, 1=SVN, 2=GIT)
     * - isRemote: Is remote (0=local, 1=remote)
     * - localSvnPath: Local SVN path
     * - svnPath: SVN repository path
     * - svnUser: SVN username
     * - svnPwd: SVN password
     * - textSearch: Full-text search config
     * - recycleBin: Recycle bin config
     * - encryptType: Encryption type (0=none)
     * - autoSyncup: Auto sync config
     * - autoBackup: Auto backup config
     */
    public Map<String, Object> addRepos(
            String name,           // Required: repo name
            String info,           // Optional: description
            Integer type,          // Required: 0=local
            String path,           // Required: storage path
            String realDocPath,    // Optional
            Integer verCtrl,       // Optional: 0=none, 1=SVN, 2=GIT
            Integer isRemote,      // Optional: 0=local
            String localSvnPath,   // Optional
            String svnPath,        // Optional
            String svnUser,        // Optional
            String svnPwd,         // Optional
            String remoteStorage,  // Optional
            String textSearch,     // Optional: enable full-text search
            String recycleBin,     // Optional: enable recycle bin
            Integer encryptType,   // Optional: 0=none
            String autoSyncup,     // Optional
            String autoBackup      // Optional
    ) throws Exception {
        String url = baseUrl + "/Repos/addRepos.do";
        Map<String, String> params = new HashMap<>();

        params.put("name", name);
        if (info != null) params.put("info", info);
        params.put("type", type != null ? type.toString() : "0");
        params.put("path", path);
        if (realDocPath != null) params.put("realDocPath", realDocPath);
        if (verCtrl != null) params.put("verCtrl", verCtrl.toString());
        if (isRemote != null) params.put("isRemote", isRemote.toString());
        if (localSvnPath != null) params.put("localSvnPath", localSvnPath);
        if (svnPath != null) params.put("svnPath", svnPath);
        if (svnUser != null) params.put("svnUser", svnUser);
        if (svnPwd != null) params.put("svnPwd", svnPwd);
        if (remoteStorage != null) params.put("remoteStorage", remoteStorage);
        if (textSearch != null) params.put("textSearch", textSearch);
        if (recycleBin != null) params.put("recycleBin", recycleBin);
        if (encryptType != null) params.put("encryptType", encryptType.toString());
        if (autoSyncup != null) params.put("autoSyncup", autoSyncup);
        if (autoBackup != null) params.put("autoBackup", autoBackup);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Delete a repository
     * POST /Repos/deleteRepos.do
     * Params: vid (repository ID)
     */
    public Map<String, Object> deleteRepos(Integer vid) throws Exception {
        String url = baseUrl + "/Repos/deleteRepos.do";
        Map<String, String> params = new HashMap<>();
        params.put("vid", vid != null ? vid.toString() : "0");

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Update repository info
     * POST /Repos/updateReposInfo.do
     */
    public Map<String, Object> updateReposInfo(
            Integer reposId, String name, String info, Integer type, String path,
            String realDocPath, Integer verCtrl, Integer isRemote, String localSvnPath,
            String svnPath, String svnUser, String svnPwd, String textSearch,
            String recycleBin, Integer encryptType, String autoSyncup, String autoBackup
    ) throws Exception {
        String url = baseUrl + "/Repos/updateReposInfo.do";
        Map<String, String> params = new HashMap<>();
        params.put("reposId", reposId != null ? reposId.toString() : "0");
        if (name != null) params.put("name", name);
        if (info != null) params.put("info", info);
        if (type != null) params.put("type", type.toString());
        if (path != null) params.put("path", path);
        if (realDocPath != null) params.put("realDocPath", realDocPath);
        if (verCtrl != null) params.put("verCtrl", verCtrl.toString());
        if (isRemote != null) params.put("isRemote", isRemote.toString());
        if (localSvnPath != null) params.put("localSvnPath", localSvnPath);
        if (svnPath != null) params.put("svnPath", svnPath);
        if (svnUser != null) params.put("svnUser", svnUser);
        if (svnPwd != null) params.put("svnPwd", svnPwd);
        if (textSearch != null) params.put("textSearch", textSearch);
        if (recycleBin != null) params.put("recycleBin", recycleBin);
        if (encryptType != null) params.put("encryptType", encryptType.toString());
        if (autoSyncup != null) params.put("autoSyncup", autoSyncup);
        if (autoBackup != null) params.put("autoBackup", autoBackup);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get system config
     * POST /Repos/getDocSysConfig.do
     */
    public Map<String, Object> getDocSysConfig() throws Exception {
        String url = baseUrl + "/Repos/getDocSysConfig.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get AI model list
     * POST /Repos/getAiModelList.do
     */
    public Map<String, Object> getAiModelList() throws Exception {
        String url = baseUrl + "/Repos/getAiModelList.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== DOCUMENT OPERATIONS ====================

    /**
     * Get document list
     * POST /Repos/getSubDocList.do
     * Params: vid (reposId), docId (子文件夹的 docId), pid, path (子文件夹相对路径), name
     * 说明（T5.3 修复）：path 为空时服务端【总是返回根目录】（pid 会被忽略）；
     * 要查看子文件夹必须传 path（相对路径，如 "DocSys" 或 "DocSys/sub"）或 docId。
     */
    public Map<String, Object> getDocList(Integer vid, Long docId, Long pid, String path) throws Exception {
        String[] endpoints = {
            "/Repos/getSubDocList.do"
        };

        Map<String, String> params = new HashMap<>();
        if (vid != null) params.put("vid", vid.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (pid != null) params.put("pid", pid.toString());
        if (path != null && !path.isEmpty()) params.put("path", path);

        for (String endpoint : endpoints) {
            try {
                String url = baseUrl + endpoint;
                Response response = postForm(url, params, sessionCookie);
                try {
                    String body = responseBodyString(response);
                    // 判据必须是 HTTP 状态码 + 是否为 JSON，**不能**用 body.contains("404")：
                    // 正常列表 JSON 里 docId/时间戳等数字完全可能含 "404" 子串，
                    // 那会把合法的仓库根目录列表误判为失败（2026-09-17 实测踩坑）。
                    String trimmed = body == null ? "" : body.trim();
                    boolean looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
                    if (response.code() == 200 && looksJson) {
                        return JSON.parseObject(body);
                    }
                } finally {
                    response.close();
                }
            } catch (Exception e) {
                // Try next endpoint
            }
        }

        // If all endpoints fail, return a helpful message
        Map<String, Object> result = new HashMap<>();
        result.put("status", "error");
        result.put("msg", "Document listing is temporarily unavailable. Please try again later.");
        result.put("data", new java.util.ArrayList<>());
        return result;
    }

    /**
     * Add a document
     * POST /Doc/addDoc.do
     *
     * Params:
     * - vid (reposId): Repository ID
     * - pid: Parent folder ID (0 for root)
     * - path: Path in repository
     * - name: Document name
     * - type: 文档类型（1=文件，2=目录）
     * - level: Level in tree
     * - content: 注意——带 content 时服务器写入的是"备注"（虚拟内容），不是实体文件
     * - commitMsg: Version control commit message
     */
    public Map<String, Object> addDoc(
            Integer reposId, Long pid, String path, String name,
            Integer type, Integer level, String content, String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/addDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (pid != null) params.put("pid", pid.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        if (type != null) params.put("type", type.toString());
        if (level != null) params.put("level", level.toString());
        if (content != null) params.put("content", content);
        if (commitMsg != null) params.put("commitMsg", commitMsg);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Delete a document
     * POST /Doc/deleteDoc.do
     */
    public Map<String, Object> deleteDoc(
            Integer reposId, Long docId, Long pid, String path, String name,
            Integer type, String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/deleteDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (pid != null) params.put("pid", pid.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        if (type != null) params.put("type", type.toString());
        if (commitMsg != null) params.put("commitMsg", commitMsg);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Rename a document
     * POST /Doc/renameDoc.do
     */
    public Map<String, Object> renameDoc(
            Integer reposId, Long docId, Long pid, String path, String name,
            Integer type, String dstName, String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/renameDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (pid != null) params.put("pid", pid.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        if (type != null) params.put("type", type.toString());
        if (dstName != null) params.put("dstName", dstName);
        if (commitMsg != null) params.put("commitMsg", commitMsg);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Move a document
     * POST /Doc/moveDoc.do
     */
    public Map<String, Object> moveDoc(
            Integer reposId, Long docId, Long srcPid, String srcPath, String srcName,
            Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel,
            Integer type, String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/moveDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (srcPid != null) params.put("srcPid", srcPid.toString());
        if (srcPath != null) params.put("srcPath", srcPath);
        if (srcName != null) params.put("srcName", srcName);
        if (srcLevel != null) params.put("srcLevel", srcLevel.toString());
        if (dstPid != null) params.put("dstPid", dstPid.toString());
        if (dstPath != null) params.put("dstPath", dstPath);
        if (dstName != null) params.put("dstName", dstName);
        if (dstLevel != null) params.put("dstLevel", dstLevel.toString());
        if (type != null) params.put("type", type.toString());
        if (commitMsg != null) params.put("commitMsg", commitMsg);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Copy a document
     * POST /Doc/copyDoc.do
     */
    public Map<String, Object> copyDoc(
            Integer reposId, Long docId, Long srcPid, String srcPath, String srcName,
            Integer srcLevel, Long dstPid, String dstPath, String dstName, Integer dstLevel,
            Integer type, String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/copyDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (srcPid != null) params.put("srcPid", srcPid.toString());
        if (srcPath != null) params.put("srcPath", srcPath);
        if (srcName != null) params.put("srcName", srcName);
        if (srcLevel != null) params.put("srcLevel", srcLevel.toString());
        if (dstPid != null) params.put("dstPid", dstPid.toString());
        if (dstPath != null) params.put("dstPath", dstPath);
        if (dstName != null) params.put("dstName", dstName);
        if (dstLevel != null) params.put("dstLevel", dstLevel.toString());
        if (type != null) params.put("type", type.toString());
        if (commitMsg != null) params.put("commitMsg", commitMsg);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get document content
     * POST /Doc/getDoc.do
     */
    public Map<String, Object> getDoc(Integer reposId, Long docId, String path, String name) throws Exception {
        String url = baseUrl + "/Doc/getDoc.do";
        Map<String, String> params = new HashMap<>();
        // T5.3/T8.1 修复：DocSystem /Doc/getDoc.do 的参数名是 reposId（不是 vid）
        if (reposId != null) params.put("reposId", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        // T8.1：docType=1 让服务端返回 docText（文本/Office 内容）；服务端 docType=null 曾触发 NPE 已修
        params.put("docType", "1");

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Download document
     * POST /Doc/downloadDoc.do
     */
    public Map<String, Object> downloadDoc(Integer reposId, Long docId, String path, String name) throws Exception {
        String url = baseUrl + "/Doc/downloadDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("vid", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get document version history
     * POST /Doc/getDocHistory.do
     *
     * <p><b>定位方式（R1-4/R1-6：只用 path/name）</b>：传 {@code path}（父目录相对路径，以 "/" 结尾，
     * 根目录用空串）+ {@code name}（自身名）。服务端 {@code buildBasicDoc} 会用
     * {@code Path.buildDocIdByName(level, path, name)} 反推出 docId，<b>不需要也不应该由调用方传 docId</b>
     * （docId 是派生 hash，会随移动/重命名失效，且只传 docId、path/name 为空时会被服务端当成
     * "仓库根目录" → 静默返回根目录历史）。
     *
     * <p>【R1-6】已删除 {@code @Deprecated getDocHistory(reposId, docId)} 两参重载：只传 docId 时
     * path/name 为空 → 服务端把文档当成“仓库根目录” → 静默返回整个仓库的历史（实测 100 条 vs 正确 2 条）。
     *
     * @param path      父目录相对路径（以 "/" 结尾；根目录传 "" 或 null）
     * @param name      文档名
     * @param level     层级（path 中 '/' 的个数；**建议传 null**，让服务端自行规范化并反推 level）
     * @param type      1=文件 2=目录（可为空）
     * @param maxLogNum 最多返回的提交数（可为空）
     * @param commitId  从该 commitId 更早的历史开始取（可为空）
     */
    public Map<String, Object> getDocHistory(Integer reposId, Long docId, String path, String name,
                                            Integer level, Integer type, Integer maxLogNum,
                                            String commitId) throws Exception {
        String url = baseUrl + "/Doc/getDocHistory.do";
        Map<String, String> params = new HashMap<>();
        // T5.3 修复：DocSystem /Doc/getDocHistory.do 的参数名是 reposId（不是 vid）
        if (reposId != null) params.put("reposId", reposId.toString());
        // docId 仅作兼容：有 path/name 时不再传，避免"docId 优先"歧义
        if (docId != null && (path == null || name == null)) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        if (level != null) params.put("level", level.toString());
        if (type != null) params.put("type", type.toString());
        if (maxLogNum != null) params.put("maxLogNum", maxLogNum.toString());
        if (commitId != null) params.put("commitId", commitId);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== SEARCH OPERATION ====================

    /**
     * 旧全文搜索（/Doc/searchDoc.do，人类接口）。**仅供旧路径**（SubAgent/DocSysSkillExecutor/CLI）使用。
     * 工具层已下线（search_docs → search_files/grep_files），新代码勿再调用。
     */
    public Map<String, Object> searchDocs(String searchWord, Integer vid) throws Exception {
        // Use the working endpoint directly
        String url = baseUrl + "/Doc/searchDoc.do";

        Map<String, String> params = new LinkedHashMap<>();
        // DocSys requires searchWord as first param, and empty string returns nothing — use "." as wildcard
        params.put("searchWord", (searchWord == null || searchWord.isEmpty()) ? "." : searchWord);
        // T5.3 修复：DocSystem searchDoc.do 的参数名是 reposId（不是 vid）；
        // 传错参数会被当作全局搜索（reposId=null）→ 全库检索极慢/超时
        if (vid != null) params.put("reposId", vid.toString());

        Response response = postForm(url, params, sessionCookie);
        try {
            String respBody = responseBodyString(response);
            log.info("searchDocs: url={}, vid={}, status={}, bodyLen={}", url, vid, response.code(), respBody.length());

            String bodyStart = respBody.substring(0, Math.min(500, respBody.length())).toLowerCase();
            if (bodyStart.contains("<!doctype") || bodyStart.contains(" 404 ")
                    || bodyStart.contains("internal server error")) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", "fail");
                error.put("msgInfo", "Search service unavailable: " + respBody.substring(0, Math.min(100, respBody.length())));
                return error;
            }

            Object parsed = JSON.parse(respBody);
            if (parsed instanceof Map) {
                return (Map<String, Object>) parsed;
            }
            Map<String, Object> wrapped = new HashMap<>();
            wrapped.put("status", "ok");
            wrapped.put("data", parsed);
            return wrapped;
        } finally {
            response.close();
        }
    }

    /**
     * Agent 专用索引搜索（T1：/Doc/agentSearchDoc.do，mode=index）。
     * 取代原 search_docs 工具（旧 /Doc/searchDoc.do 为人类设计，含路径猜解/base64/多线程编排等冗余）。
     *
     * @param reposId   仓库ID（必填，单仓库）
     * @param queryJson 查询 DSL JSON（must/should/mustNot × field(name/content/comment) × match(term/wildcard/prefix/fuzzy)）
     * @param path      目录限定（可选，仓库内相对路径）
     * @param maxResults 最大结果数（可选，默认 20，上限 100）
     * @param withSnippet 是否返回命中片段（可选，默认 true）
     */
    public Map<String, Object> agentSearchDocs(Integer reposId, String queryJson, String path,
                                               Integer maxResults, Boolean withSnippet) throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("reposId", String.valueOf(reposId));
        params.put("mode", "index");
        if (queryJson != null && !queryJson.isEmpty()) params.put("query", queryJson);
        if (path != null && !path.isEmpty()) params.put("path", path);
        if (maxResults != null) params.put("maxResults", maxResults.toString());
        if (withSnippet != null) params.put("withSnippet", withSnippet.toString());
        return postFormAndParse(baseUrl + "/Doc/agentSearchDoc.do", params);
    }

    /**
     * Agent 专用磁盘扫描搜索（T2：/Doc/agentSearchDoc.do，mode=grep）。
     * 覆盖文件直接放入仓库目录、尚未被 DocSys 扫描建索引的情况。仅文本文件。
     */
    public Map<String, Object> grepFiles(Integer reposId, String pattern, String path,
                                         Integer maxResults) throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("reposId", String.valueOf(reposId));
        params.put("mode", "grep");
        params.put("pattern", pattern);
        if (path != null && !path.isEmpty()) params.put("path", path);
        if (maxResults != null) params.put("maxResults", maxResults.toString());
        return postFormAndParse(baseUrl + "/Doc/agentSearchDoc.do", params);
    }

    /**
     * Agent 专用文本文件写入（T4：/Doc/agentWriteText.do）。
     * 创建或覆盖文本文件（UTF-8、1MB 上限；服务端白名单校验后缀）。
     */
    public Map<String, Object> writeTextDoc(Integer reposId, String path, String name,
                                            String content, String commitMsg) throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("reposId", String.valueOf(reposId));
        if (path != null) params.put("path", path);
        params.put("name", name);
        params.put("content", content);
        if (commitMsg != null && !commitMsg.isEmpty()) params.put("commitMsg", commitMsg);
        return postFormAndParse(baseUrl + "/Doc/agentWriteText.do", params);
    }

    /**
     * 更新文档内容（/Doc/updateDocContent.do）。
     * docType=1 → 更新实体文本文件内容；docType=null → 更新备注（虚拟内容）。
     */
    public Map<String, Object> updateDocContent(Integer reposId, Long docId, String path, String name,
                                                String content, Integer docType, String commitMsg) throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("reposId", String.valueOf(reposId));
        if (docId != null) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        params.put("name", name);
        params.put("content", content);
        if (docType != null) params.put("docType", docType.toString());
        if (commitMsg != null && !commitMsg.isEmpty()) params.put("commitMsg", commitMsg);
        return postFormAndParse(baseUrl + "/Doc/updateDocContent.do", params);
    }

    /**
     * 旧路径迁移用（SubAgent/DocSysSkillExecutor）：单个关键词 → 三字段 should DSL 搜索。
     * vid=null 时遍历全部可访问仓库合并结果（新端点单仓库化）。CLI 仍用旧 {@link #searchDocs}。
     */
    public Map<String, Object> agentSearchDocsByKeyword(String keyword, Integer vid) throws Exception {
        return agentSearchDocsByQuery(buildKeywordQueryJson(keyword), vid);
    }

    /** 列出仓库全部文档（扁平列举，旧 handleGetDocList 用 searchDocs("",vid) 的迁移等价物） */
    public Map<String, Object> agentListAllDocs(Integer vid) throws Exception {
        return agentSearchDocsByQuery(
                "{\"should\":[{\"field\":\"name\",\"term\":\".\",\"match\":\"wildcard\"}]}", vid);
    }

    /** 单仓库直接搜；全仓库（vid=null）逐仓搜索后按 score 降序合并 */
    private Map<String, Object> agentSearchDocsByQuery(String queryJson, Integer vid) throws Exception {
        if (vid != null) {
            return agentSearchDocs(vid, queryJson, null, 50, false);
        }
        List<Object> merged = new ArrayList<>();
        try {
            Map<String, Object> reposRes = getReposList();
            Object data = reposRes.get("data");
            if (data instanceof List) {
                for (Object item : (List<?>) data) {
                    if (!(item instanceof Map)) {
                        continue;
                    }
                    Object idObj = ((Map<?, ?>) item).get("id");
                    if (idObj == null) {
                        continue;
                    }
                    try {
                        Integer rid = Integer.parseInt(idObj.toString());
                        Map<String, Object> one = agentSearchDocs(rid, queryJson, null, 20, false);
                        Object list = one.get("data");
                        if (list instanceof List) {
                            merged.addAll((List<?>) list);
                        }
                    } catch (Exception repoErr) {
                        log.warn("agentSearchDocsByQuery: repo {} search failed: {}", idObj, repoErr.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("agentSearchDocsByQuery: all-repos search failed: {}", e.getMessage());
        }
        merged.sort((a, b) -> Integer.compare(scoreOf(b), scoreOf(a)));
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("data", merged);
        return result;
    }

    private static int scoreOf(Object item) {
        if (item instanceof Map) {
            Object s = ((Map<?, ?>) item).get("score");
            if (s instanceof Number) {
                return ((Number) s).intValue();
            }
        }
        return 0;
    }

    /** 构建单关键词三字段 should 查询 DSL（公开供单测） */
    public static String buildKeywordQueryJson(String keyword) {
        JSONObject nameTerm = new JSONObject();
        nameTerm.put("field", "name");
        nameTerm.put("term", keyword);
        JSONObject contentTerm = new JSONObject();
        contentTerm.put("field", "content");
        contentTerm.put("term", keyword);
        JSONObject commentTerm = new JSONObject();
        commentTerm.put("field", "comment");
        commentTerm.put("term", keyword);
        JSONArray should = new JSONArray();
        should.add(nameTerm);
        should.add(contentTerm);
        should.add(commentTerm);
        JSONObject query = new JSONObject();
        query.put("should", should);
        return query.toJSONString();
    }

    /** 表单 POST 并解析 JSON 响应（失败时返回 status=fail + msgInfo） */
    private Map<String, Object> postFormAndParse(String url, Map<String, String> params) throws Exception {
        Response response = postForm(url, params, sessionCookie);
        try {
            String respBody = responseBodyString(response);
            try {
                Object parsed = JSON.parse(respBody);
                if (parsed instanceof Map) {
                    return (Map<String, Object>) parsed;
                }
            } catch (Exception parseErr) {
                log.warn("postFormAndParse: non-JSON response from {}: {}", url,
                        respBody.substring(0, Math.min(200, respBody.length())));
            }
            Map<String, Object> error = new HashMap<>();
            error.put("status", "fail");
            error.put("msgInfo", "响应解析失败: " + respBody.substring(0, Math.min(200, respBody.length())));
            return error;
        } finally {
            response.close();
        }
    }

    // ==================== AI/CHAT OPERATIONS ====================

    /**
     * AI Chat with LLM
     * POST /Repos/AIChat.do (SSE streaming)
     */
    public String chat(String message, String llmName) throws Exception {
        String url = baseUrl + "/Repos/AIChat.do";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query", message);
        if (llmName != null) requestBody.put("LLMName", llmName);

        Request request = new Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .header("Cookie", sessionCookie)
            .post(RequestBody.create(JSON_MEDIA, JSON.toJSONString(requestBody)))
            .build();

        Response response = httpClient.newCall(request).execute();
        try {
            return responseBodyString(response);
        } finally {
            response.close();
        }
    }

    /**
     * RAG Chat (with document context)
     * POST /Query/addDocSysRagMessage.do
     */
    public String ragChat(String query, String modelName, String apiKey) throws Exception {
        String url = baseUrl + "/Query/addDocSysRagMessage.do";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query", query);
        if (modelName != null) requestBody.put("modelName", modelName);
        if (apiKey != null) requestBody.put("apiKey", apiKey);

        Request request = new Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .header("Cookie", sessionCookie)
            .post(RequestBody.create(JSON_MEDIA, JSON.toJSONString(requestBody)))
            .build();

        Response response = httpClient.newCall(request).execute();
        try {
            return responseBodyString(response);
        } finally {
            response.close();
        }
    }

    // ==================== BACKUP OPERATIONS ====================

    /**
     * Trigger repository backup
     * POST /Repos/backupRepos.do
     */
    public Map<String, Object> backupRepos(Integer reposId, String backupStorePath) throws Exception {
        String url = baseUrl + "/Repos/backupRepos.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (backupStorePath != null) params.put("backupStorePath", backupStorePath);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Query backup task status
     * POST /Repos/queryReposFullBackupTask.do
     */
    public Map<String, Object> queryBackupStatus(String taskId) throws Exception {
        String url = baseUrl + "/Repos/queryReposFullBackupTask.do";
        Map<String, String> params = new HashMap<>();
        if (taskId != null) params.put("taskId", taskId);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== SYSTEM MANAGEMENT ====================

    /**
     * Get system configuration
     * POST /Manage/getDocSysConfig.do
     */
    public Map<String, Object> getSystemConfig() throws Exception {
        String url = baseUrl + "/Manage/getDocSysConfig.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get system banner configuration
     * POST /Manage/getBannerConfig.do
     */
    public Map<String, Object> getBannerConfig(String serverIP) throws Exception {
        String url = baseUrl + "/Manage/getBannerConfig.do";
        Map<String, String> params = new HashMap<>();
        if (serverIP != null) params.put("serverIP", serverIP);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Get system email configuration
     * POST /Manage/getSystemEmailConfig.do
     */
    public Map<String, Object> getSystemEmailConfig(String authCode) throws Exception {
        String url = baseUrl + "/Manage/getSystemEmailConfig.do";
        Map<String, String> params = new HashMap<>();
        if (authCode != null) params.put("authCode", authCode);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Initialize DocSystem (admin)
     * POST /Manage/docSysInit.do
     */
    public Map<String, Object> docSysInit(String authCode) throws Exception {
        String url = baseUrl + "/Manage/docSysInit.do";
        Map<String, String> params = new HashMap<>();
        if (authCode != null) params.put("authCode", authCode);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== DOCUMENT LOCK OPERATIONS ====================

    /**
     * Lock a document
     * POST /Doc/lockDoc.do
     */
    public Map<String, Object> lockDoc(Integer reposId, Long docId, String path, String name, Integer lockType) throws Exception {
        String url = baseUrl + "/Doc/lockDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("vid", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        if (lockType != null) params.put("lockType", lockType.toString());

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * Unlock a document
     * POST /Doc/unlockDoc.do
     */
    public Map<String, Object> unlockDoc(Integer reposId, Long docId, String path, String name) throws Exception {
        String url = baseUrl + "/Doc/unlockDoc.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("vid", reposId.toString());
        if (docId != null) params.put("docId", docId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== SHARE OPERATIONS ====================

    /**
     * 当前用户的全部分享列表
     * POST /Doc/getDocShareList.do
     *
     * <p>【R1-3】该端点**不接受任何参数**（无 vid/docId/path/name），返回的就是"当前用户分享过的所有文档"。
     * 旧签名（reposId, docId, path, name）纯属误导：传了也没用。要“某个文件的分享”请在结果里按 path/name 过滤。
     */
    public Map<String, Object> getDocShareList() throws Exception {
        String url = baseUrl + "/Doc/getDocShareList.do";
        Response response = postForm(url, new HashMap<String, String>(), sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * 创建文档分享
     * POST /Bussiness/addDocShare.do
     *
     * <p>【R1-2】原实现调 {@code /Doc/createDocShare.do} —— **服务端没有这个映射**（DocController 只有
     * getDocShareList/getDocShare/verifyDocSharePwd），工具 100% 404。真实创建分享端点在
     * {@code BussinessController:/addDocShare.do}（另有 updateDocShare/deleteDocShare）。
     *
     * <p>参数口径与 web 端 {@code project.js} 一致（只读 + 可下载 + 7 天）：{@code access=1, downloadEn=1,
     * isAdmin=0, addEn/deleteEn/editEn=0, heritable=1}；服务端 {@code shareHours == null} 时默认 24 小时，
     * 这里由调用方显式给（工具默认 168 = 7 天）。
     *
     * @param path      文档所在目录的相对路径（以 / 结尾，仓库根目录传 ""）—— 服务端 buildBasicDoc 用它定位
     * @param name      文档名（或目录名）
     * @param sharePwd  分享密码（可选；null/空 = 无密码）
     * @param shareHours 有效期小时数（可选；null = 服务端默认 24 小时）
     */
    public Map<String, Object> addDocShare(Integer reposId, String path, String name,
            String sharePwd, Long shareHours) throws Exception {
        String url = baseUrl + "/Bussiness/addDocShare.do";
        Map<String, String> params = new HashMap<>();
        if (reposId != null) params.put("reposId", reposId.toString());
        if (path != null) params.put("path", path);
        if (name != null) params.put("name", name);
        params.put("isAdmin", "0");
        params.put("access", "1");
        params.put("downloadEn", "1");
        params.put("addEn", "0");
        params.put("deleteEn", "0");
        params.put("editEn", "0");
        params.put("heritable", "1");
        if (sharePwd != null && !sharePwd.isEmpty()) params.put("sharePwd", sharePwd);
        if (shareHours != null) params.put("shareHours", shareHours.toString());

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * 删除（撤销）文档分享
     * POST /Bussiness/deleteDocShare.do
     *
     * <p>与 addDocShare 配对：能创建就要能撤销（CLI {@code share delete} 与端到端验证清理都用它）。
     */
    public Map<String, Object> deleteDocShare(Integer shareId) throws Exception {
        String url = baseUrl + "/Bussiness/deleteDocShare.do";
        Map<String, String> params = new HashMap<>();
        if (shareId != null) params.put("shareId", shareId.toString());

        Response response = postForm(url, params, sessionCookie);
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    // ==================== HELPER METHODS ====================

    public String getBaseUrl() {
        return baseUrl;
    }

    public boolean isLoggedIn() {
        return sessionCookie != null;
    }

    public String getCurrentUsername() {
        return currentUsername;
    }

    public String getSessionCookie() {
        return sessionCookie;
    }

    public void setSessionCookie(String cookie) {
        this.sessionCookie = cookie;
    }

    /**
     * Create a new DocSysClient with the same configuration but fresh session.
     * This ensures thread safety in multi-user environments.
     *
     * Best Practice: Create per-request instead of sharing singleton
     */
    public DocSysClient copy() {
        DocSysClient copy = new DocSysClient(this.baseUrl);
        // Copy any other shared config if needed
        return copy;
    }

    /**
     * Create a new DocSysClient with pre-authenticated session.
     * This is the recommended way to handle authenticated requests.
     */
    public DocSysClient copyWithSession(String jsessionId, String username) {
        DocSysClient client = this.copy();
        client.sessionCookie = "JSESSIONID=" + jsessionId;
        client.currentUsername = username;
        return client;
    }

    // ==================== UPLOAD OPERATIONS ====================

    /**
     * Upload document (multipart form)
     * POST /Doc/uploadDoc.do
     *
     * 支持：
     * - 单文件上传
     * - 多文件上传（调用多次）
     * - 文件夹上传（通过 dirPath, batchStartTime, totalCount 参数）
     * - 断点续传（通过 chunkIndex, chunkNum 参数）
     *
     * @param reposId 仓库 ID
     * @param pid 父目录 ID（0 为根目录）
     * @param path 路径
     * @param name 文件名
     * @param type 类型（1=文件, 2=文件夹）
     * @param size 文件大小
     * @param checkSum MD5 校验和（用于去重）
     * @param fileData 文件内容
     * @param fileName 原始文件名
     * @param dirPath 目录路径（文件夹上传时使用）
     * @param batchStartTime 批次开始时间（文件夹上传时使用）
     * @param totalCount 文件总数（文件夹上传时使用）
     * @param isEnd 是否结束（文件夹上传时使用）
     * @param commitMsg 提交信息
     * @return 上传结果
     */
    public Map<String, Object> uploadDoc(
            Integer reposId,
            Long pid,
            String path,
            String name,
            Integer type,
            Long size,
            String checkSum,
            byte[] fileData,
            String fileName,
            String dirPath,
            Long batchStartTime,
            Integer totalCount,
            Integer isEnd,
            String commitMsg
    ) throws Exception {
        String url = baseUrl + "/Doc/uploadDoc.do";

        // 使用 OkHttp 的 MultipartBody 构建 multipart form
        String boundary = "----FormBoundary" + System.currentTimeMillis();

        okhttp3.MultipartBody.Builder mb = new okhttp3.MultipartBody.Builder(boundary).setType(okhttp3.MultipartBody.FORM);

        if (reposId != null) mb.addFormDataPart("reposId", reposId.toString());
        if (pid != null) mb.addFormDataPart("pid", pid.toString());
        if (path != null) mb.addFormDataPart("path", path);
        if (name != null) mb.addFormDataPart("name", name);
        if (type != null) mb.addFormDataPart("type", type.toString());
        if (size != null) mb.addFormDataPart("size", size.toString());
        if (checkSum != null) mb.addFormDataPart("checkSum", checkSum);
        if (dirPath != null) mb.addFormDataPart("dirPath", dirPath);
        if (batchStartTime != null) mb.addFormDataPart("batchStartTime", batchStartTime.toString());
        if (totalCount != null) mb.addFormDataPart("totalCount", totalCount.toString());
        if (isEnd != null) mb.addFormDataPart("isEnd", isEnd.toString());
        if (commitMsg != null) mb.addFormDataPart("commitMsg", commitMsg);

        // 添加文件
        if (fileData != null && fileName != null) {
            mb.addFormDataPart("uploadFile", fileName,
                    RequestBody.create(MediaType.parse("application/octet-stream"), fileData));
        }

        RequestBody multipart = mb.build();

        Request request = new Request.Builder()
                .url(url)
                .header("Cookie", sessionCookie)
                .post(multipart)
                .build();

        Response response = httpClient.newCall(request).execute();
        try {
            return JSON.parseObject(responseBodyString(response));
        } finally {
            response.close();
        }
    }

    /**
     * 上传单个文件（简化版）
     */
    public Map<String, Object> uploadFile(Integer reposId, Long pid, String path, String name, byte[] fileData, String fileName) throws Exception {
        return uploadDoc(reposId, pid, path, name, 1, (long) fileData.length, null, fileData, fileName, null, null, null, null, null);
    }

    /**
     * 计算文件的 MD5 校验和
     */
    public static String calculateMD5(byte[] data) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private Response postForm(String url, Map<String, String> params, String cookie) {
        FormBody.Builder fb = new FormBody.Builder();
        if (params != null) {
            for (Map.Entry<String, String> e : params.entrySet()) {
                fb.add(e.getKey(), e.getValue());
            }
        }
        RequestBody formBody = fb.build();

        Request.Builder builder = new Request.Builder()
            .url(url)
            .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
            .header("User-Agent", "DocSysAgent/1.0")
            .post(formBody);

        if (cookie != null) {
            builder.header("Cookie", cookie);
        }

        try {
            Request req = builder.build();
            return httpClient.newCall(req).execute();
        } catch (Exception e) {
            throw new RuntimeException("HTTP request failed: " + url, e);
        }
    }

    /**
     * 读取响应体；**非 JSON 响应（例如 Tomcat 的 500 HTML 错误页）统一翻译成失败 JSON**。
     *
     * <p>R3-2 体检实测：`delete_repos{vid:不存在}` 让服务端 NPE → HTTP 500 + Tomcat HTML 错误页（4136 字符），
     * 各调用点 `JSON.parseObject(...)` 直接抛 fastjson 语法错，工具层报给模型的是
     * “syntax error, pos 1, line 1, column 2&lt;html&gt;&lt;head&gt;…”，模型完全无法处置。
     * 这里统一兜底成 `{"status":"fail","errorCode":"INTERNAL","msgInfo":"…"}`，
     * 这样所有 30+ 个调用点无需改动就都能给出带错误码的可读结论。
     */
    private String responseBodyString(Response response) throws java.io.IOException {
        ResponseBody body = response.body();
        String text = body != null ? body.string() : "";
        String trimmed = text.trim();
        if (!trimmed.isEmpty() && trimmed.charAt(0) != '{' && trimmed.charAt(0) != '[') {
            return "{\"status\":\"fail\",\"errorCode\":\"INTERNAL\",\"msgInfo\":\""
                    + escapeJson(serverErrorSummary(response, trimmed)) + "\"}";
        }
        return text;
    }

    /** 从 HTML 错误页/纯文本里提炼一句可读的失败原因（不把整页 HTML 倒给模型） */
    private String serverErrorSummary(Response response, String trimmed) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("<h1[^>]*>(.*?)</h1>", java.util.regex.Pattern.DOTALL).matcher(trimmed);
        String detail = null;
        if (m.find()) {
            detail = m.group(1).replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
        }
        if (detail == null || detail.isEmpty()) {
            detail = trimmed.length() > 120 ? trimmed.substring(0, 120) + "…" : trimmed;
        }
        String status = response == null ? "?" : String.valueOf(response.code());
        return "服务端返回非 JSON 响应（HTTP " + status + "）：" + detail
                + "；这通常是服务端内部错误，可改用 list_repos/get_repos 确认对象是否存在，不要重试同一调用";
    }

    private static String escapeJson(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') {
                sb.append('\\').append(c);
            } else if (c == '\n' || c == '\r') {
                sb.append(' ');
            } else if (c < 0x20) {
                continue;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String extractSessionCookie(Response response) {
        String setCookie = response.header("Set-Cookie");
        if (setCookie == null) return null;
        return setCookie.split(";")[0];
    }
}
