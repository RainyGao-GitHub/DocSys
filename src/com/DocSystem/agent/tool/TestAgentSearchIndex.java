package com.DocSystem.agent.tool;

import com.DocSystem.agent.search.AgentSearchExecutor;
import com.DocSystem.agent.search.AgentSearchQuery;
import com.DocSystem.common.HitDoc;
import com.DocSystem.entity.Repos;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.wltea.analyzer.lucene.IKAnalyzer;

import java.io.File;
import java.util.List;

/**
 * T1 护栏：AgentSearchExecutor 真实 Lucene 索引语义验证。
 *
 * 覆盖（回归 must/should/mustNot 与目录限定）：
 *  - must：必须命中
 *  - should：**至少命中一条**（⚠️ 回归点：LuceneUtil2.multiSearch 的 80% minShouldMatch
 *    会把 should 扭曲为"必须命中大多数"——本测试确保 Agent 语义正确）
 *  - mustNot：排除
 *  - path 目录限定
 */
public class TestAgentSearchIndex {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        File tempDir = java.nio.file.Files.createTempDirectory("agent_search_test").toFile();
        try {
            Repos repos = buildRepos(tempDir);
            buildIndex(tempDir, repos);

            testMust(repos);
            testShouldAnySemantics(repos);
            testMustNot(repos);
            testPathFilter(repos);
        } finally {
            deleteRecursive(tempDir);
        }
        System.out.println("\n======== TestAgentSearchIndex: " + pass + " passed, " + fail + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    private static void check(String name, boolean cond) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name);
        }
    }

    // ---------- 临时索引 ----------

    private static Repos buildRepos(File tempDir) {
        Repos repos = new Repos();
        repos.setId(1);
        repos.setPath(tempDir.getAbsolutePath().replace('\\', '/') + "/");
        return repos;
    }

    private static void buildIndex(File tempDir, Repos repos) throws Exception {
        File libDir = new File(tempDir, "DocSysLucene/repos_1_RDoc");
        if (!libDir.exists() && !libDir.mkdirs()) {
            throw new IllegalStateException("mkdir index dir failed: " + libDir);
        }
        Analyzer analyzer = new IKAnalyzer();
        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
        try (IndexWriter writer = new IndexWriter(FSDirectory.open(libDir), config)) {
            writer.addDocument(buildDoc("101", "dir/", "a.txt", "本周预算执行情况报告"));
            writer.addDocument(buildDoc("102", "dir/", "b.md", "保密事项说明"));
            writer.commit();
        }
    }

    private static Document buildDoc(String docId, String path, String name, String content) {
        Document d = new Document();
        d.add(new StringField("docId", docId, Field.Store.YES));
        d.add(new StringField("pid", "0", Field.Store.YES));
        d.add(new StringField("path", path, Field.Store.YES));
        d.add(new StringField("name", name, Field.Store.YES));
        d.add(new StringField("type", "1", Field.Store.YES));
        d.add(new StringField("size", "100", Field.Store.YES));
        d.add(new StringField("latestEditTime", "1000", Field.Store.YES));
        d.add(new TextField("content", content, Field.Store.NO));
        return d;
    }

    private static void deleteRecursive(File f) {
        File[] children = f.listFiles();
        if (children != null) {
            for (File c : children) {
                deleteRecursive(c);
            }
        }
        f.delete();
    }

    // ---------- 测试 ----------

    private static void testMust(Repos repos) {
        AgentSearchQuery q = AgentSearchQuery.parse(
                "{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}]}");
        List<HitDoc> hits = AgentSearchExecutor.searchIndex(repos, q, null, 20);
        check("must: 1 result", hits.size() == 1);
        check("must: hit a.txt", hits.size() == 1 && "a.txt".equals(hits.get(0).doc.getName()));
        check("must: hitType=FileContent", hits.size() == 1
                && (hits.get(0).hitType & HitDoc.HitType_FileContent) != 0);
    }

    private static void testShouldAnySemantics(Repos repos) {
        // should 2 个字段条件，仅 content 命中（comment 库无此文档）→ 必须仍能命中
        AgentSearchQuery q = AgentSearchQuery.parse(
                "{\"should\":[{\"field\":\"content\",\"term\":\"预算\"},{\"field\":\"comment\",\"term\":\"预算\"}]}");
        List<HitDoc> hits = AgentSearchExecutor.searchIndex(repos, q, null, 20);
        check("should(any): 1 result", hits.size() == 1);
        check("should(any): hit a.txt", hits.size() == 1 && "a.txt".equals(hits.get(0).doc.getName()));
    }

    private static void testMustNot(Repos repos) {
        AgentSearchQuery q = AgentSearchQuery.parse(
                "{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}],"
                        + "\"mustNot\":[{\"field\":\"comment\",\"term\":\"保密\"}]}");
        List<HitDoc> hits = AgentSearchExecutor.searchIndex(repos, q, null, 20);
        check("mustNot: 1 result", hits.size() == 1);

        AgentSearchQuery q2 = AgentSearchQuery.parse(
                "{\"must\":[{\"field\":\"content\",\"term\":\"保密\"}]}");
        List<HitDoc> hits2 = AgentSearchExecutor.searchIndex(repos, q2, null, 20);
        check("must(保密): 1 result", hits2.size() == 1 && "b.md".equals(hits2.get(0).doc.getName()));
    }

    private static void testPathFilter(Repos repos) {
        AgentSearchQuery q = AgentSearchQuery.parse(
                "{\"must\":[{\"field\":\"content\",\"term\":\"预算\"}]}");
        List<HitDoc> hits = AgentSearchExecutor.searchIndex(repos, q, "dir/", 20);
        check("pathFilter dir/: 1 result", hits.size() == 1);

        List<HitDoc> hits2 = AgentSearchExecutor.searchIndex(repos, q, "other/", 20);
        check("pathFilter other/: 0 result", hits2.isEmpty());
    }
}
