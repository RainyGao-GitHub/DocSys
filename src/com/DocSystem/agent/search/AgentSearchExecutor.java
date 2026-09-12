package com.DocSystem.agent.search;

import com.DocSystem.common.FileUtil;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.Path;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause.Occur;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wltea.analyzer.lucene.IKAnalyzer;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AgentSearchExecutor —— Agent 专用搜索执行器（供 /Doc/agentSearchDoc.do 调用）。
 *
 * <p>两部分能力：</p>
 * <ul>
 *   <li>{@link #searchIndex}：把 {@link AgentSearchQuery} 映射为 {@link QueryCondition} 列表，
 *       分别查询三个 Lucene 索引库（文件名/内容/备注），合并去重按命中积分排序。</li>
 *   <li>{@link #grepScan}：直接在仓库实体文件目录树上做逐行文本扫描（等价 grep），
 *       覆盖"文件直接放入仓库目录、尚未被 DocSys 扫描建索引"的情况。</li>
 * </ul>
 *
 * <p>本类不依赖 Spring/Controller，便于单元测试。</p>
 */
public class AgentSearchExecutor {

    private static final Logger log = LoggerFactory.getLogger(AgentSearchExecutor.class);

    /** 索引库类型（与 BaseController.getIndexLibPath 的 INDEX_DOC_NAME/R_DOC/V_DOC 对应，此处独立实现避免依赖 Controller 继承树） */
    public static final int IDX_NAME = 0;
    public static final int IDX_CONTENT = 1;
    public static final int IDX_COMMENT = 2;

    /** grep 扫描单文件大小上限（跳过超大文件） */
    private static final long MAX_GREP_FILE_SIZE = 5L * 1024 * 1024;

    /** grep 扫描文件数上限（防超大仓库拖死请求） */
    private static final int MAX_GREP_SCAN_FILES = 5000;

    /** 单行 snippet 长度上限 */
    private static final int MAX_SNIPPET_LEN = 200;

    /** 是否跳过某个文件/目录（由调用方注入 DocSys 语义：如 isRealDocTextSearchIgnored） */
    public interface DocFilter {
        boolean accept(Doc doc);
    }

    private AgentSearchExecutor() {
    }

    /** 构建仓库的 Lucene 索引库完整路径（与 BaseController.getIndexLibPath 同构） */
    public static String indexLibPath(Repos repos, int libType) {
        String lucenePath = repos.getPath() + "DocSysLucene/";
        switch (libType) {
            case IDX_NAME:
                return lucenePath + "repos_" + repos.getId() + "_DocName";
            case IDX_CONTENT:
                return lucenePath + "repos_" + repos.getId() + "_RDoc";
            default:
                return lucenePath + "repos_" + repos.getId() + "_VDoc";
        }
    }

    /** IK 切词（与 LuceneUtil2.smartSearch 相同的分析器与流程） */
    public static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return tokens;
        }
        Analyzer analyzer = null;
        TokenStream stream = null;
        try {
            analyzer = new IKAnalyzer();
            stream = analyzer.tokenStream("field", new StringReader(text));
            CharTermAttribute cta = stream.addAttribute(CharTermAttribute.class);
            stream.reset();
            while (stream.incrementToken()) {
                tokens.add(cta.toString());
            }
            stream.end();
        } catch (Exception e) {
            log.debug("AgentSearchExecutor tokenize failed: {}", e.getMessage());
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (Exception e) {
                    // ignore
                }
            }
            if (analyzer != null) {
                analyzer.close();
            }
        }
        return tokens;
    }

    /**
     * 基于 Lucene 索引的搜索。
     *
     * @param repos      目标仓库
     * @param query      已解析的查询 DSL（含 must/should/mustNot）
     * @param pathFilter 目录限定（仓库内相对路径，无前导 "/"，以 "/" 结尾；null/空 = 不限）
     * @param maxResults 最大结果数
     * @return 按命中积分降序的 HitDoc 列表（最多 maxResults 条；已设置 repos 字段）
     */
    public static List<HitDoc> searchIndex(Repos repos, AgentSearchQuery query, String pathFilter, int maxResults) {
        HashMap<String, HitDoc> searchResult = new HashMap<>();

        // 按索引库分组条件：0=文件名, 1=内容, 2=备注
        List<List<QueryCondition>> perLib = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            perLib.add(new ArrayList<QueryCondition>());
        }
        buildConditions(query, perLib);

        for (int libType = 0; libType < 3; libType++) {
            List<QueryCondition> conditions = perLib.get(libType);
            if (conditions.isEmpty()) {
                continue;
            }
            // 目录限定（MUST 前缀通配，同时充当正向子句）
            if (pathFilter != null && !pathFilter.isEmpty()) {
                QueryCondition pathCondition = new QueryCondition();
                pathCondition.setField("path");
                pathCondition.setValue(pathFilter);
                pathCondition.setQueryType(QueryCondition.SEARCH_TYPE_Wildcard_Prefix);
                conditions.add(pathCondition);
            }
            int hitType = libType == IDX_NAME ? HitDoc.HitType_FileName
                    : libType == IDX_CONTENT ? HitDoc.HitType_FileContent : HitDoc.HitType_FileComment;
            // ⚠️ 不走 LuceneUtil2.multiSearch：它硬编码 hitRateLevel=8，会对 SHOULD 条件强制
            // setMinimumNumberShouldMatch(80%)，把 LLM 的 should(或)语义扭曲成"必须命中大多数"。
            // 也不依赖 LuceneUtil2 的 buildBooleanQueryWithConditions/BuildHitDocFromDocument：
            // LuceneUtil2 extends BaseFunction，其 <clinit> 在裸 java 测试环境会 NPE（getWebPath）
            // 并经 Log 无限递归 StackOverflow。此处本地实现（Lucene 默认语义：SHOULD 至少命中一条）。
            searchLib(repos, conditions, indexLibPath(repos, libType), hitType, searchResult);
        }

        List<HitDoc> result = new ArrayList<>();
        for (HitDoc h : searchResult.values()) {
            h.repos = repos;
            result.add(h);
        }
        Collections.sort(result, (a, b) -> Integer.compare(b.hitScore_Total, a.hitScore_Total));
        if (result.size() > maxResults) {
            return new ArrayList<>(result.subList(0, maxResults));
        }
        return result;
    }

    /** 读命中积分（直接字段，不经过会调 Log 的 getHitScore） */
    private static int hitScoreOf(HitDoc h, int hitType) {
        switch (hitType) {
            case HitDoc.HitType_FileName:
                return h.hitScore_FileName;
            case HitDoc.HitType_FileContent:
                return h.hitScore_FileContent;
            default:
                return h.hitScore_FileComment;
        }
    }

    /** 写命中积分并重算总分（直接字段，不经过会调 Log 的 setHitScore） */
    private static void setHitScoreOf(HitDoc h, int hitType, int score) {
        switch (hitType) {
            case HitDoc.HitType_FileName:
                h.hitScore_FileName = score;
                break;
            case HitDoc.HitType_FileContent:
                h.hitScore_FileContent = score;
                break;
            default:
                h.hitScore_FileComment = score;
                break;
        }
        h.hitScore_Total = h.hitScore_FileName + h.hitScore_FileContent + h.hitScore_FileComment;
    }

    /**
     * 本地构建 BooleanQuery（镜像 LuceneUtil2.buildBooleanQueryWithConditions，但**不设 minShouldMatch**）。
     * Lucene 默认语义：仅 SHOULD 子句时至少命中一条；MUST+SHOULD 时 SHOULD 为可选加分项；MUST_NOT 排除。
     * 仅支持 FIELD_TYPE_String 条件（Agent DSL 只生成字符串条件）。
     */
    private static Query buildQuery(List<QueryCondition> conditions) {
        if (conditions == null || conditions.isEmpty()) {
            return null;
        }
        BooleanQuery bq = new BooleanQuery();
        int count = 0;
        for (QueryCondition c : conditions) {
            Query q = buildSingleQuery(c);
            if (q != null) {
                bq.add(q, c.getOccurType());
                count++;
            }
        }
        return count > 0 ? bq : null;
    }

    /** 单个条件 → Lucene Query（仅字符串类型；镜像 LuceneUtil2.buidStringQuery） */
    private static Query buildSingleQuery(QueryCondition c) {
        try {
            switch (c.getQueryType()) {
                case QueryCondition.SEARCH_TYPE_Wildcard:
                    return new WildcardQuery(new Term(c.getField(), "*" + c.getValue() + "*"));
                case QueryCondition.SEARCH_TYPE_Wildcard_Prefix:
                    return new WildcardQuery(new Term(c.getField(), c.getValue() + "*"));
                case QueryCondition.SEARCH_TYPE_Wildcard_Suffix:
                    return new WildcardQuery(new Term(c.getField(), "*" + c.getValue()));
                case QueryCondition.SEARCH_TYPE_Fuzzy:
                    return new FuzzyQuery(new Term(c.getField(), (String) c.getValue()));
                case QueryCondition.SEARCH_TYPE_Prefix:
                    return new PrefixQuery(new Term(c.getField(), (String) c.getValue()));
                case QueryCondition.SEARCH_TYPE_Term:
                default:
                    return new TermQuery(new Term(c.getField(), (String) c.getValue()));
            }
        } catch (Exception e) {
            log.debug("AgentSearchExecutor buildSingleQuery failed: {}", e.getMessage());
            return null;
        }
    }

    /** 索引 Document → HitDoc（镜像 LuceneUtil2.BuildHitDocFromDocument_FS） */
    private static HitDoc buildHitDocFromIndex(Repos repos, Document hitDocument) {
        try {
            String docParentPath = hitDocument.get("path");
            String docName = hitDocument.get("name");
            if (docName == null || docName.isEmpty()) {
                return null;
            }
            String strDocId = hitDocument.get("docId");
            String strPid = hitDocument.get("pid");
            String strType = hitDocument.get("type");
            String strSize = hitDocument.get("size");
            String strLatestEditTime = hitDocument.get("latestEditTime");

            Doc doc = new Doc();
            doc.setVid(repos.getId());
            if (strPid != null && !strPid.isEmpty()) {
                doc.setPid(Long.parseLong(strPid));
            }
            if (strDocId != null && !strDocId.isEmpty()) {
                doc.setDocId(Long.parseLong(strDocId));
            }
            doc.setPath(docParentPath);
            doc.setName(docName);
            if (strType != null && !strType.isEmpty()) {
                doc.setType(Integer.parseInt(strType));
            }
            if (strSize != null && !strSize.isEmpty()) {
                doc.setSize(Long.parseLong(strSize));
            }
            if (strLatestEditTime != null && !strLatestEditTime.isEmpty()) {
                doc.setLatestEditTime(Long.parseLong(strLatestEditTime));
            }

            HitDoc hitDoc = new HitDoc();
            hitDoc.doc = doc;
            hitDoc.docPath = (docParentPath != null ? docParentPath : "") + docName;
            return hitDoc;
        } catch (Exception e) {
            log.debug("AgentSearchExecutor buildHitDocFromIndex failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 执行单索引库搜索：本地构建 BooleanQuery（无 minShouldMatch 强制），
     * 用 Lucene 相关度分（×100 取整）作为命中积分。
     */
    private static void searchLib(Repos repos, List<QueryCondition> conditions, String indexLib,
                                  int hitType, HashMap<String, HitDoc> searchResult) {
        File libDir = new File(indexLib);
        if (!libDir.exists()) {
            log.debug("AgentSearchExecutor searchLib: index lib not exists: {}", indexLib);
            return;
        }
        Directory directory = null;
        DirectoryReader ireader = null;
        try {
            directory = FSDirectory.open(libDir);
            ireader = DirectoryReader.open(directory);
            IndexSearcher isearcher = new IndexSearcher(ireader);
            Query query = buildQuery(conditions);
            if (query == null) {
                return;
            }
            TopDocs hits = isearcher.search(query, 1000);
            if (hits == null || hits.scoreDocs == null) {
                return;
            }
            for (ScoreDoc scoreDoc : hits.scoreDocs) {
                Document hitDocument = isearcher.doc(scoreDoc.doc);
                HitDoc newHitDoc = buildHitDocFromIndex(repos, hitDocument);
                if (newHitDoc == null) {
                    continue;
                }
                HitDoc hitDoc = searchResult.get(newHitDoc.docPath);
                if (hitDoc == null) {
                    hitDoc = newHitDoc;
                    searchResult.put(newHitDoc.docPath, newHitDoc);
                }
                hitDoc.hitType = hitDoc.hitType | hitType;
                int score = Math.max(1, (int) Math.round(scoreDoc.score * 100));
                // ⚠️ 直接用公有字段计分：HitDoc.setHitScore/getHitScore/getTotalHitScore 会调
                // com.DocSystem.common.Log.debug，而该 Log 写文件失败时会无限递归（StackOverflow）
                setHitScoreOf(hitDoc, hitType, hitScoreOf(hitDoc, hitType) + score);
            }
        } catch (Exception e) {
            log.warn("AgentSearchExecutor searchLib failed for {}: {}", indexLib, e.getMessage());
        } finally {
            if (ireader != null) {
                try {
                    ireader.close();
                } catch (Exception e) {
                    // ignore
                }
            }
            if (directory != null) {
                try {
                    directory.close();
                } catch (Exception e) {
                    // ignore
                }
            }
        }
    }

    /** 把已解析的查询 DSL 展开为按索引库分组的 QueryCondition 列表（公开便于单测） */
    public static void buildConditions(AgentSearchQuery query, List<List<QueryCondition>> perLib) {
        addGroup(perLib, query.must, Occur.MUST);
        addGroup(perLib, query.should, Occur.SHOULD);
        addGroup(perLib, query.mustNot, Occur.MUST_NOT);
    }

    /** 把一组 DSL 条件展开为 QueryCondition（term → IK 分词后逐词加条件） */
    private static void addGroup(List<List<QueryCondition>> perLib, List<AgentSearchQuery.Term> terms, Occur occur) {
        if (terms == null) {
            return;
        }
        for (AgentSearchQuery.Term t : terms) {
            String match = t.matchOrDefault();
            if ("name".equals(t.field)) {
                if ("term".equals(match)) {
                    // 文件名分词搜索：与 smartSearch 一致，查 DocName 库的 content 字段（IK 索引）
                    List<String> tokens = tokenize(t.term);
                    for (String token : tokens) {
                        perLib.get(IDX_NAME).add(termCondition("content", token, QueryCondition.SEARCH_TYPE_Term, occur));
                    }
                    if (tokens.isEmpty()) {
                        log.debug("AgentSearchExecutor: name term '{}' tokenized to empty, skipped", t.term);
                    }
                    continue;
                }
                int queryType;
                if ("wildcard".equals(match)) {
                    queryType = QueryCondition.SEARCH_TYPE_Wildcard;
                } else if ("prefix".equals(match)) {
                    queryType = QueryCondition.SEARCH_TYPE_Wildcard_Prefix;
                } else {
                    queryType = QueryCondition.SEARCH_TYPE_Fuzzy;
                }
                perLib.get(IDX_NAME).add(termCondition("nameForSearch", t.term, queryType, occur));
                continue;
            }

            // content / comment：仅 term（解析阶段已校验 match）
            int libType = "content".equals(t.field) ? IDX_CONTENT : IDX_COMMENT;
            List<String> tokens = tokenize(t.term);
            for (String token : tokens) {
                perLib.get(libType).add(termCondition("content", token, QueryCondition.SEARCH_TYPE_Term, occur));
            }
            if (tokens.isEmpty()) {
                log.debug("AgentSearchExecutor: {} term '{}' tokenized to empty, skipped", t.field, t.term);
            }
        }
    }

    private static QueryCondition termCondition(String field, String value, int queryType, Occur occur) {
        QueryCondition c = new QueryCondition();
        c.setField(field);
        c.setValue(value);
        c.setQueryType(queryType);
        c.setOccurType(occur);
        return c;
    }

    /**
     * 磁盘逐行扫描（grep 等价实现）。
     *
     * <p>只扫描 {@link Path#getReposRealPath(Repos)} 实体目录树（虚拟内容总是经 DocSys 写入、
     * VDoc 索引必然最新，无需磁盘兜底）。仅文本文件；跳过被 {@code filter} 拒绝的路径
     * （如全文搜索忽略项）。UTF-8 逐行 contains 匹配（大小写不敏感）。</p>
     *
     * @param repos      目标仓库
     * @param pattern    搜索关键词（非空）
     * @param pathFilter 目录限定（可为 null）
     * @param maxResults 结果上限（1-100）
     * @param filter     文件过滤（可为 null = 不过滤）
     * @return 结果列表，每项含 path/name/size/line/snippet
     */
    public static List<Map<String, Object>> grepScan(Repos repos, String pattern, String pathFilter,
                                                     int maxResults, DocFilter filter) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (pattern == null || pattern.trim().isEmpty()) {
            return results;
        }
        String realPath = Path.getReposRealPath(repos);
        String baseDir = normalizePathFilter(pathFilter);
        File searchRoot = new File(realPath + baseDir);
        if (!searchRoot.exists() || !searchRoot.isDirectory()) {
            return results;
        }

        String lowerPattern = pattern.toLowerCase();
        final int[] scannedFiles = {0};
        walkRecursive(searchRoot, realPath, lowerPattern, maxResults, filter, results, scannedFiles);
        return results;
    }

    /** 递归扫描目录树（纯 File 递归，兼容无 nio.file.attribute 的裁剪版 JDK） */
    private static void walkRecursive(File dir, String realPath, String lowerPattern, int maxResults,
                                      DocFilter filter, List<Map<String, Object>> results, int[] scannedFiles) {
        if (results.size() >= maxResults || scannedFiles[0] >= MAX_GREP_SCAN_FILES) {
            return;
        }
        File[] children = dir.listFiles();
        if (children == null) {
            return;
        }
        for (File child : children) {
            if (results.size() >= maxResults || scannedFiles[0] >= MAX_GREP_SCAN_FILES) {
                return;
            }
            if (child.isDirectory()) {
                String dirName = child.getName();
                // 跳过 DocSys 内部目录
                if ("DocSysLucene".equals(dirName) || "DocSysVerReposes".equals(dirName)) {
                    continue;
                }
                walkRecursive(child, realPath, lowerPattern, maxResults, filter, results, scannedFiles);
                continue;
            }
            if (!child.isFile()) {
                continue;
            }
            String name = child.getName();
            if (!FileUtil.isTextFile(name)) {
                continue;
            }
            if (child.length() > MAX_GREP_FILE_SIZE) {
                continue;
            }
            scannedFiles[0]++;

            // 构建相对路径（与 DocSys 内部一致：无前导 "/"，以 "/" 结尾）
            String absDir = child.getParent();
            String relDir = absDir.length() > realPath.length() ? absDir.substring(realPath.length()) : "";
            relDir = relDir.replace('\\', '/');
            if (!relDir.isEmpty() && !relDir.endsWith("/")) {
                relDir = relDir + "/";
            }

            if (filter != null) {
                Doc doc = new Doc();
                doc.setName(name);
                doc.setPath(relDir);
                if (!filter.accept(doc)) {
                    continue;
                }
            }

            String lineMatch = matchLine(child, lowerPattern);
            if (lineMatch != null) {
                Map<String, Object> r = new HashMap<>();
                r.put("path", relDir.isEmpty() ? "/" : "/" + relDir.substring(0, relDir.length() - 1));
                r.put("name", name);
                r.put("size", child.length());
                r.put("line", lineMatch);
                r.put("snippet", snippet(lineMatch, MAX_SNIPPET_LEN));
                results.add(r);
            }
        }
    }

    /** 找首个命中 pattern 的行（UTF-8；非法编码文件跳过） */
    private static String matchLine(File f, String lowerPattern) {
        try (FileInputStream fis = new FileInputStream(f);
             InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
             BufferedReader reader = new BufferedReader(isr)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.toLowerCase().contains(lowerPattern)) {
                    return line.trim();
                }
            }
        } catch (Exception e) {
            // 非 UTF-8 文本（或二进制误判），跳过
            return null;
        }
        return null;
    }

    /** 归一化目录限定：去前导 "/"，确保以 "/" 结尾 */
    public static String normalizePathFilter(String path) {
        if (path == null) {
            return "";
        }
        String p = path.trim().replace('\\', '/');
        while (p.startsWith("/")) {
            p = p.substring(1);
        }
        if (p.isEmpty()) {
            return "";
        }
        return p.endsWith("/") ? p : p + "/";
    }

    /** 截取片段（带省略号） */
    public static String snippet(String text, int maxLen) {
        if (text == null || text.isEmpty()) {
            return null;
        }
        String t = text.replace('\n', ' ').replace('\r', ' ').trim();
        if (t.length() <= maxLen) {
            return t;
        }
        return t.substring(0, maxLen) + "…";
    }
}
