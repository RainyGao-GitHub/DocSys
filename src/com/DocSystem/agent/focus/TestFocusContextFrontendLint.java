package com.DocSystem.agent.focus;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/**
 * 护栏：project 页「点 AI 图标自动 @ 对象」的**多选**语义（前端 lint，2026-09-24）。
 *
 * <p>用户反馈：树里选了多个文件/目录时只有一个被 @。定下的规则：</p>
 * <ol>
 *   <li>树里选中多个（Ctrl 点选 / Shift 连选）→ **全部** @ 上；</li>
 *   <li>选中一个 → 该对象（与改造前单文件场景一致）；</li>
 *   <li>一个都没选 → 回落「当前打开的文档」→ 再回落「仓库根目录（整库）」；</li>
 *   <li>批量添加要受 {@code FOCUS_MAX} 限制，且**只提示一次**（否则一次 @ 十几个会弹一片 toast）。</li>
 * </ol>
 *
 * <p>为什么用源码 lint 而不是运行时断言：这段逻辑是<b>纯前端</b>（project.js + agent/index.html），
 * 裸 JVM 跑不了；lint 至少能把"规则被改回去/入口优先级被调换"这类回归钉住。</p>
 */
public class TestFocusContextFrontendLint {

    private static int pass = 0;
    private static int fail = 0;

    public static void main(String[] args) throws Exception {
        String projectJs = read("WebRoot/web/project.js");
        String agentHtml = read("WebRoot/web/agent/index.html");
        projectSide(projectJs);
        agentSide(agentHtml);
        dialogSafety(agentHtml);
        System.out.println("\n======== TestFocusContextFrontendLint: " + pass + " passed, " + fail
                + " failed ========");
        if (fail > 0) {
            System.exit(1);
        }
    }

    // ---------- project 页：上下文对象提供方 ----------

    private static void projectSide(String js) {
        check("project.js provides getAgentContextItems", js.contains("function getAgentContextItems()"));
        check("provider reads tree multi-selection",
                js.contains("treeObj.getSelectedNodes()") && js.contains("selectedNodes.length > 0"));
        check("provider maps dir by type===2", js.contains("node.type === 2 ? 'dir' : 'file'"));
        check("provider returns kind/vid/path/name/docId",
                js.contains("kind: (node.type === 2 ? 'dir' : 'file')")
                        && js.contains("path: node.path || ''") && js.contains("docId: node.docId || null"));
        check("provider skips nameless root node", js.contains("!node.name"));
        check("fallback to currently opened doc", js.contains("gDocInfo && gDocInfo.name"));
        check("fallback to repo root (整库)", js.contains("kind: 'dir', vid: vid, path: '/', name: ''"));
        check("selection wins over opened doc (early return before fallback)",
                js.indexOf("if(items.length > 0)") > 0
                        && js.indexOf("if(items.length > 0)") < js.indexOf("gDocInfo && gDocInfo.name"),
                "order matters: 选中优先，再无选中才回落");
        check("provider tolerates tree failure", js.contains("catch(e)")
                && js.contains("getAgentContextItems() tree query failed"));
    }

    // ---------- Agent 页：入口优先级 + 批量添加 ----------

    private static void agentSide(String html) {
        check("agent reads parent context list", html.contains("function readParentContextItems()"));
        check("agent feature-detects parent provider",
                html.contains("typeof p.getAgentContextItems !== 'function'"));
        check("parent list takes precedence over URL params",
                html.indexOf("var fromParent = readParentContextItems();") > 0
                        && html.indexOf("var fromParent = readParentContextItems();")
                                < html.indexOf("var sp = new URLSearchParams(window.location.search || '')"),
                "父页直取必须在 URL 参数之前");
        check("URL-param path still supported (ctxVid)", html.contains("sp.get('ctxVid')"));
        check("batch add helper exists", html.contains("function addFocusItems(items)"));
        check("batch add uses URL item path too", html.contains("addFocusItems([urlItem])"));
        check("batch add dedupes by focusKey", html.contains("focusKey(state.focus[j]) === key"));
        check("batch add respects FOCUS_MAX",
                html.contains("(state.focus || []).length >= FOCUS_MAX) { skipped++; continue; }"));
        check("batch add shows ONE notice when truncated",
                html.contains("已忽略 ' + skipped + ' 个"));
        check("multi add shows a single gentle notice",
                html.contains("已自动关注所选 ' + added + ' 个对象"));
        check("batch add does not switch composer slot", html.contains("state.activeFocusKey = null;\n        renderFocusBar();")
                || html.contains("state.activeFocusKey = null;"));
        check("root label backfill extracted as helper",
                html.contains("function backfillRootLabels(items)"));
        check("no leftover single-item call in context init",
                !html.contains("addFocusItem({\n                kind: kind,"),
                "initFocusFromContext 里旧的内联 addFocusItem 调用应已收敛到 addFocusItems");
    }

    // ---------- 关注对象弹窗：「清空」的误操作防护（2026-09-24 用户反馈） ----------

    private static void dialogSafety(String html) {
        check("clear button sits outside the primary button group",
                !btnGroupBlock(html).contains("focusDialogClear"),
                "清空 不得和 取消/确定 同组（同组就会紧贴在一起，容易误点）");
        check("primary group keeps cancel + ok only",
                btnGroupBlock(html).contains("focusDialogCancel")
                        && btnGroupBlock(html).contains("focusDialogOk"));
        check("clear button is rendered before the count (far left)",
                html.indexOf("id=\"focusDialogClear\"") > 0
                        && html.indexOf("id=\"focusDialogClear\"") < html.indexOf("id=\"focusDialogCount\""),
                "按钮顺序：清空 → 计数 → 取消/确定");
        check("clear button uses quiet style", html.contains("fd-btn fd-btn-quiet")
                && html.contains(".fd-btn-quiet {"));
        check("quiet button turns red only on hover", html.contains(".fd-btn-quiet:hover { background: #fdf2f2; color: #d33; }"));
        check("disabled style exists", html.contains(".fd-btn[disabled] {"));
        check("clear disabled when nothing selected",
                html.contains("clearBtn.disabled = importMode || (state.focus || []).length === 0;"));
        check("clear asks for confirmation first",
                html.contains("function clearFocusDialog()")
                        && clearFnBlock(html).contains("uiDialog(")
                        && clearFnBlock(html).contains("danger: true"));
        check("clear only clears after confirm",
                clearFnBlock(html).contains("if (!ok) return;"),
                "确认框返回 false 时不得清空");
        check("confirmation wording mentions the count",
                clearFnBlock(html).contains("确定清空已选的 ' + n + ' 个关注对象？"));
        check("cancel still rolls back the dialog snapshot",
                html.contains("state.focus = d.snapshot.map(function (it) { return JSON.parse(JSON.stringify(it)); });"));
    }

    /** `.fd-btns` 按钮组块（到该 div 结束为止的近似片段） */
    private static String btnGroupBlock(String html) {
        int i = html.indexOf("<div class=\"fd-btns\">");
        if (i < 0) {
            return "";
        }
        int j = html.indexOf("</div>", i);
        return j < 0 ? html.substring(i) : html.substring(i, j);
    }

    /** `clearFocusDialog` 函数体（到下一个顶层 `function ` 之前） */
    private static String clearFnBlock(String html) {
        int i = html.indexOf("function clearFocusDialog()");
        if (i < 0) {
            return "";
        }
        int j = html.indexOf("\n    function ", i + 10);
        return j < 0 ? html.substring(i) : html.substring(i, j);
    }

    // ---------- helpers ----------

    private static String read(String path) throws Exception {
        File f = new File(path);
        if (!f.isFile()) {
            throw new IllegalStateException("file not found (run from repo root): " + path);
        }
        return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
    }

    private static void check(String name, boolean cond) {
        check(name, cond, null);
    }

    private static void check(String name, boolean cond, String detail) {
        if (cond) {
            pass++;
            System.out.println("[PASS] " + name);
        } else {
            fail++;
            System.out.println("[FAIL] " + name + (detail == null || detail.isEmpty() ? "" : "  -> " + detail));
        }
    }
}
