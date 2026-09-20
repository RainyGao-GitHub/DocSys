package com.DocSystem.agent.search;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * AgentSearchQuery —— Agent 搜索 DSL（供 /Doc/agentSearchDoc.do 使用）。
 *
 * <p>由 LLM 生成，支持与/或/非组合：</p>
 * <pre>
 * {
 *   "must":    [{"field":"name",    "term":"周报",  "match":"fuzzy"}],
 *   "should":  [{"field":"content", "term":"预算"}],
 *   "mustNot": [{"field":"comment", "term":"保密"}]
 * }
 * </pre>
 *
 * <ul>
 *   <li>{@code field}: name(文件名) / content(文件内容) / comment(备注)</li>
 *   <li>{@code match}: term(默认,IK 分词) / wildcard / prefix / fuzzy —— 后三种仅 name</li>
 *   <li>must → Occur.MUST；should → Occur.SHOULD；mustNot → Occur.MUST_NOT</li>
 * </ul>
 */
public class AgentSearchQuery {

    /** 单个查询条件 */
    public static class Term {
        public String field;   // name | content | comment
        public String term;    // 关键词
        public String match;   // term | wildcard | prefix | fuzzy（默认 term）

        public Term() {
        }

        public Term(String field, String term, String match) {
            this.field = field;
            this.term = term;
            this.match = match;
        }

        /** 标准化后的 match 值（null → term） */
        public String matchOrDefault() {
            return match == null || match.trim().isEmpty() ? "term" : match.trim().toLowerCase();
        }
    }

    public final List<Term> must = new ArrayList<>();
    public final List<Term> should = new ArrayList<>();
    public final List<Term> mustNot = new ArrayList<>();

    private static final String[] ALLOWED_FIELDS = {"name", "content", "comment"};
    private static final String[] ALLOWED_MATCH = {"term", "wildcard", "prefix", "fuzzy"};

    /** 是否没有任何条件 */
    public boolean isEmpty() {
        return must.isEmpty() && should.isEmpty() && mustNot.isEmpty();
    }

    /** 是否有正向条件（must/should 至少其一，否则 BooleanQuery 只含否定子句匹配不到任何文档） */
    public boolean hasPositiveCondition() {
        return !must.isEmpty() || !should.isEmpty();
    }

    /** 拼接全部 must 关键词（用于命中评分与摘要抽取） */
    public List<String> collectTerms() {
        List<String> terms = new ArrayList<>();
        for (Term t : must) terms.add(t.term);
        for (Term t : should) terms.add(t.term);
        return terms;
    }

    /**
     * 【R3-10】提取"可以拿去做不依赖索引的精确直查"的条目名；没把握时返回 null。
     *
     * <p><b>为什么需要</b>：Lucene 索引里只有"DocSys 扫描/写入时建立"的条目。直接放进仓库目录、
     * 或早期就存在但从未被扫描的文件/目录在索引里<b>根本不存在</b>——2026-09-20 实测仓库 5 的索引只覆盖
     * {@code MxsDoc/} 子树，根目录下 {@code 66666/}、{@code 资料} 等明明在磁盘上却 0 命中。
     * 直查（{@code path+name → docId → docSysGetDoc}）不依赖索引，一次 stat 就能确认。</p>
     *
     * <p><b>宁缺勿滥</b>：只有「must+should 里恰好一个 name 条件、值里不含 {@code *} / {@code ?} 通配符、
     * 且没有任何 mustNot」时才返回该字面值。其余情况（多个 name 条件、含否定条件、通配/模糊）一律 null
     * —— 绝不把模糊查询当成精确名去 stat。</p>
     */
    public String exactNameCandidate() {
        if (!mustNot.isEmpty()) {
            return null;
        }
        String found = null;
        int count = 0;
        for (Term t : must) {
            if (!"name".equals(t.field)) {
                continue;
            }
            count++;
            found = t.term;
        }
        for (Term t : should) {
            if (!"name".equals(t.field)) {
                continue;
            }
            count++;
            found = t.term;
        }
        if (count != 1 || found == null) {
            return null;
        }
        String v = found.trim();
        if (v.isEmpty() || v.indexOf('*') >= 0 || v.indexOf('?') >= 0) {
            return null;
        }
        return v;
    }

    /**
     * 解析并校验查询 DSL JSON。
     *
     * @param json DSL JSON 字符串
     * @return 解析结果（字段/关键词已 trim；非法输入抛 IllegalArgumentException，错误信息面向 LLM 可读）
     * @throws IllegalArgumentException 格式非法或校验失败
     */
    public static AgentSearchQuery parse(String json) {
        if (json == null || json.trim().isEmpty()) {
            throw new IllegalArgumentException("query 不能为空，请提供 {\"must\":[...],\"should\":[...],\"mustNot\":[...]} 形式的 JSON");
        }

        JSONObject obj;
        try {
            obj = JSON.parseObject(json.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("query 不是合法 JSON: " + e.getMessage());
        }
        if (obj == null) {
            throw new IllegalArgumentException("query 不是合法 JSON 对象");
        }

        AgentSearchQuery query = new AgentSearchQuery();
        query.parseGroup(obj, "must", query.must);
        query.parseGroup(obj, "should", query.should);
        query.parseGroup(obj, "mustNot", query.mustNot);

        if (query.isEmpty()) {
            throw new IllegalArgumentException("query 至少需要一个 must/should/mustNot 条件");
        }
        if (!query.hasPositiveCondition()) {
            throw new IllegalArgumentException("mustNot 不能单独使用，需要搭配至少一个 must 或 should 条件");
        }
        return query;
    }

    private void parseGroup(JSONObject obj, String key, List<Term> out) {
        Object groupObj = obj.get(key);
        if (groupObj == null) {
            return;
        }
        if (!(groupObj instanceof JSONArray)) {
            throw new IllegalArgumentException("query." + key + " 必须是数组");
        }
        JSONArray arr = (JSONArray) groupObj;
        for (int i = 0; i < arr.size(); i++) {
            Object item = arr.get(i);
            if (!(item instanceof JSONObject)) {
                throw new IllegalArgumentException("query." + key + "[" + i + "] 必须是 {field, term, match} 对象");
            }
            out.add(parseTerm((JSONObject) item, key + "[" + i + "]"));
        }
    }

    private Term parseTerm(JSONObject item, String location) {
        String field = item.getString("field");
        String term = item.getString("term");
        String match = item.getString("match");

        if (field == null || field.trim().isEmpty()) {
            throw new IllegalArgumentException(location + ".field 必填（name/content/comment）");
        }
        field = field.trim().toLowerCase();
        boolean fieldOk = false;
        for (String f : ALLOWED_FIELDS) {
            if (f.equals(field)) {
                fieldOk = true;
                break;
            }
        }
        if (!fieldOk) {
            throw new IllegalArgumentException(location + ".field 取值非法: '" + field + "'（支持 name/content/comment）");
        }

        if (term == null || term.trim().isEmpty()) {
            throw new IllegalArgumentException(location + ".term 必填（搜索关键词）");
        }

        String m = match == null ? "term" : match.trim().toLowerCase();
        boolean matchOk = false;
        for (String am : ALLOWED_MATCH) {
            if (am.equals(m)) {
                matchOk = true;
                break;
            }
        }
        if (!matchOk) {
            throw new IllegalArgumentException(location + ".match 取值非法: '" + match + "'（支持 term/wildcard/prefix/fuzzy）");
        }
        if (!"name".equals(field) && !"term".equals(m)) {
            throw new IllegalArgumentException(location + ": wildcard/prefix/fuzzy 仅支持 field=name（content/comment 请用 term）");
        }

        return new Term(field, term.trim(), m);
    }
}
