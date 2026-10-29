/**
 * 文件对比窗口（文件对比功能 M1，方案见 devDocs/文件对比功能方案.md）
 *
 * 参数（优先级）：
 *   1) artDialog data：project.js 的 openCompareWindow 以 artDialog + iframe 打开本页，
 *      data = { left: compareRef, right: compareRef }
 *   2) sessionStorage['docsys_compare_pair']：agent 产物链接（M3）/ 新窗口场景（同源同标签页共享，
 *      window.open 的新标签会继承打开时的快照）——不走 URL，避免长路径撞 Tomcat 8KB 请求行（多选 @ 先例）。
 *
 * compareRef = { vid, path, name, docType, docId?, commitId?, historyType?, versionLabel?, size?, shareId?, authCode? }
 *
 * 展示：文本/代码 → CodeMirror 5 MergeView（双栏、折叠相同段、对齐、只读）；
 *      Office/PDF → M4 提供「并排打开两个查看器」，当前版本提示；
 *      其余二进制 → 不支持提示。单侧内容 > 2MB 拒绝。
 */
var DocCompare = (function () {
    var MAX_CHARS = 2 * 1024 * 1024;   // 单侧 2MB 上限（用户裁定 2026-10-28）

    var L = {};              // 页面注入文案
    var pair = null;
    var texts = {};          // { left: String, right: String }
    var opts = { collapse: true, ignoreWs: false };
    var mv = null;           // CodeMirror.MergeView 实例

    // 后缀 → CM5 mode（静态预置的 14 个 mode，见 compareForArt.html；缺省 null = 纯文本）
    var MODE_MAP = {
        js: 'javascript', mjs: 'javascript', json: { name: 'javascript', json: true },
        html: 'htmlmixed', htm: 'htmlmixed', vue: 'htmlmixed',
        xml: 'xml', svg: 'xml', xsl: 'xml', plist: 'xml',
        css: 'css', less: 'css', scss: 'css',
        java: 'clike', c: 'clike', h: 'clike', cpp: 'clike', hpp: 'clike', cc: 'clike',
        cs: 'clike', scala: 'clike', kt: 'clike',
        py: 'python', pyw: 'python',
        sql: 'sql', md: 'markdown', markdown: 'markdown',
        sh: 'shell', bash: 'shell', zsh: 'shell',
        yml: 'yaml', yaml: 'yaml',
        properties: 'properties', ini: 'properties', conf: 'properties',
        go: 'go', php: 'php', rb: 'ruby'
    };

    var TEXT_SUFFIXES = ('txt log csv tsv xml json js mjs css less scss htm html vue c h cpp hpp cc java cs scala kt ' +
        'py pyw sql sh bash zsh yml yaml properties ini conf go php rb md markdown bat ps1 ' +
        'gradlemak makefile mk cmake gradle svn svnignore gitignore dockerfile env ts tsx jsx').split(' ');
    var OFFICE_SUFFIXES = ('doc docx xls xlsx ppt pptx wps et dps pdf').split(' ');

    function suffixOf(name) {
        if (!name) return '';
        var i = name.lastIndexOf('.');
        return i < 0 ? '' : name.substring(i + 1).toLowerCase();
    }

    function isOfficeDoc(ref) { return OFFICE_SUFFIXES.indexOf(suffixOf(ref.name)) >= 0; }
    function isTextDoc(ref) {
        var s = suffixOf(ref.name);
        return MODE_MAP[s] !== undefined || TEXT_SUFFIXES.indexOf(s) >= 0 || s === '';
    }

    // ---------- 参数读取 ----------

    function loadPair() {
        // 1) artDialog data
        try {
            var dialogId = getQueryString("dialogId");
            if (dialogId) {
                var inst = null;
                if (window.top && window.top.artDialogList) inst = window.top.artDialogList[dialogId];
                if (inst == null && window.parent && window.parent.artDialogList) inst = window.parent.artDialogList[dialogId];
                if (inst && inst.config && inst.config.data && inst.config.data.left) {
                    return inst.config.data;
                }
            }
        } catch (e) { /* 跨域保险 */ }
        // 2) sessionStorage
        try {
            var raw = sessionStorage.getItem('docsys_compare_pair');
            if (raw) {
                var p = JSON.parse(raw);
                if (p && p.left && p.right) return p;
            }
        } catch (e) { }
        return null;
    }

    // ---------- 内容获取（照 DocSys.js getDocTextBasic 的 ok+文本 协议，自带极简版避免整页依赖） ----------

    /** 换行符归一化：CRLF → LF。逐字节比较会把「整份 CRLF 文件 vs 整份 LF 文件」判成全部不同
     *  （实测 2026-10-28：同源 md 因 EOL 不同显示 +831/-829、无相同段可折叠），
     *  业界 diff 工具默认忽略 EOL 差异，此处对齐该行为 */
    function normalizeEol(s) {
        return s.replace(/\r\n/g, '\n');
    }

    function fetchText(ref, callback) {
        // 注意：commitId 必须真缺省（不能传空串）——后端以 commitId==null 区分当前/历史版本，
        // 传 "" 会走历史分支并在版本号解析处 500（实测 2026-10-28）
        var data = {
            reposId: ref.vid,
            path: ref.path || "",
            name: ref.name,
            docType: ref.docType || 1
        };
        if (ref.commitId) {
            data.commitId = ref.commitId;
            data.needDeletedEntry = 1;   //历史版本可能是当时已被删除的文件（后端按此放行内容读取）
        }
        if (ref.historyType != null) data.historyType = ref.historyType;
        if (ref.shareId) data.shareId = ref.shareId;
        if (ref.authCode) data.authCode = ref.authCode;
        $.ajax({
            url: "/DocSystem/Doc/getDocContent.do",
            type: "post",
            dataType: "text",
            data: data,
            success: function (ret) {
                if (ret && ret.substring(0, 2) === "ok") {
                    callback(null, normalizeEol(ret.substring(2)));
                } else {
                    callback(refLabel(ref) + ' : ' + (ret || "empty response"));
                }
            },
            error: function (xhr) {
                callback(refLabel(ref) + ' : HTTP ' + (xhr ? xhr.status : '?'));
            }
        });
    }

    function refLabel(ref) {
        var s = (ref.path ? ref.path + (ref.path.slice(-1) === '/' ? '' : '/') : '') + ref.name;
        if (ref.versionLabel) s += ' @' + ref.versionLabel;
        return s;
    }

    // ---------- 差异统计（diff_match_patch 行模式：linesToChars 后每个字符即一行） ----------

    function diffStats(a, b) {
        try {
            var dmp = new diff_match_patch();
            // npm 版 diff-match-patch@1.0.5 的行模式方法是私有名（diff_linesToChars_），
            // 经典版是公开名（diff_linesToChars）——双命名兼容
            var linesToChars = dmp.diff_linesToChars || dmp.diff_linesToChars_;
            var ca = linesToChars.call(dmp, a, b);
            var diffs = dmp.diff_main(ca.chars1, ca.chars2, false);
            var added = 0, deleted = 0, chunks = 0, prev = 0;
            for (var i = 0; i < diffs.length; i++) {
                var op = diffs[i][0], seg = diffs[i][1];
                if (op === 1) added += seg.length;
                else if (op === -1) deleted += seg.length;
                if (op !== 0 && prev !== op) chunks++;
                prev = op;
            }
            return { added: added, deleted: deleted, chunks: chunks };
        } catch (e) {
            return null;
        }
    }

    // ---------- 渲染 ----------

    function showMsg(html) {
        $('#compareContainer').hide();
        var el = $('#compareMsg');
        el.html(html).show();
    }

    function buildTitles() {
        $('#compareLeftTitle').text(refLabel(pair.left) + (texts.left != null ? ' (' + texts.left.length + 'B)' : ''));
        $('#compareRightTitle').text(refLabel(pair.right) + (texts.right != null ? ' (' + texts.right.length + 'B)' : ''));
    }

    function renderMerge() {
        var container = document.getElementById('compareContainer');
        container.innerHTML = '';
        // 必须先让容器可见再构建：CodeMirror 在 display:none 下无法测量，
        // 会渲染出空窗（无差异标记，实测 2026-10-28）
        $('#compareContainer').show();
        $('#compareMsg').hide();
        var modeL = MODE_MAP[suffixOf(pair.left.name)] || null;
        var modeR = MODE_MAP[suffixOf(pair.right.name)] || null;

        mv = CodeMirror.MergeView(container, {
            value: texts.right,                  // 右侧：第二个文件（value 编辑器渲染在右）
            origLeft: texts.left,                // 左侧：第一个文件（基准）——用 origLeft 才能让基准渲染在左
            lineNumbers: true,
            revertButtons: false,                // 只读对比（用户裁定 C）
            allowEditingOriginals: false,
            readOnly: true,
            connect: 'align',
            highlightDifferences: true,
            collapseIdentical: opts.collapse ? { margin: 3 } : false,
            ignoreWhitespace: opts.ignoreWs,
            mode: modeL || modeR || null
        });
        // 两侧类型不同时分别指定语法
        if (modeL !== modeR) {
            if (mv.leftOriginal() && modeL) mv.leftOriginal().setOption('mode', modeL);
            if (mv.editor() && modeR) mv.editor().setOption('mode', modeR);
        }
        // MergeView 的 readOnly 选项对编辑器生效，再显式双保险
        try {
            mv.editor().setOption('readOnly', true);
            if (mv.leftOriginal()) mv.leftOriginal().setOption('readOnly', true);
        } catch (e) { }

        var st = diffStats(texts.left, texts.right);
        if (st) {
            $('#compareStats').text('+' + st.added + ' / -' + st.deleted + ' · ' +
                (st.chunks === 0 ? L.identical : st.chunks + ' ' + L.chunksUnit));
        } else {
            $('#compareStats').text('');
        }
    }

    // ---------- 主流程 ----------

    function run() {
        if (!pair) { showMsg(L.noParam); return; }

        // M5.2 目录对比分流：任一侧 kind=='dir' → 目录差异清单视图
        var dirL = pair.left.kind === 'dir';
        var dirR = pair.right.kind === 'dir';
        if (dirL || dirR) {
            if (!dirL || !dirR) {
                showMsg('<div class="compare-tip">' + L.mixedUnsupported + '</div>');
                buildTitles();
                return;
            }
            runDirCompare();
            return;
        }

        // Office / 二进制分流（M1：Office 为占位提示，M4 换并排查看器）
        if (isOfficeDoc(pair.left) || isOfficeDoc(pair.right)) {
            showMsg('<div class="compare-tip">' + L.officePending + '</div>');
            buildTitles();
            return;
        }
        if (!isTextDoc(pair.left) || !isTextDoc(pair.right)) {
            showMsg('<div class="compare-tip">' + L.binaryUnsupported + '</div>');
            buildTitles();
            return;
        }

        showMsg('<div class="compare-tip">' + L.loading + '</div>');
        var pending = 2;
        fetchText(pair.left, function (err, text) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailLeft + '<br/>' + escapeHtml(err) + '</div>'); return; }
            if (text.length > MAX_CHARS) { showMsg('<div class="compare-tip">' + L.tooLargeLeft + ' (' + text.length + 'B &gt; 2MB)</div>'); return; }
            texts.left = text;
            if (--pending === 0) { buildTitles(); renderMerge(); }
        });
        fetchText(pair.right, function (err, text) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailRight + '<br/>' + escapeHtml(err) + '</div>'); return; }
            if (text.length > MAX_CHARS) { showMsg('<div class="compare-tip">' + L.tooLargeRight + ' (' + text.length + 'B &gt; 2MB)</div>'); return; }
            texts.right = text;
            if (--pending === 0) { buildTitles(); renderMerge(); }
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ==================== M5.2 目录对比（差异清单 + 下钻文件对比） ====================
    // 与后端 M5.1 同一套上限与分类规则（agent 工具给 AI 摘要，这里给用户可视化）

    var DIR_ENTRY_LIMIT = 1000;        // 单侧条目上限
    var DIR_DEPTH_LIMIT = 8;           // 递归深度上限
    var DIR_CONTENT_PAIR_LIMIT = 100;  // 文本逐对内容比对上限（超出按大小判定）

    var dirState = null;   // {origPair, treeL, treeR, rows, filter, truncated, contentCap}

    function fetchDirEntries(vid, dirPath, callback) {
        $.ajax({
            url: "/DocSystem/Repos/getSubDocList.do",
            type: "post",
            dataType: "json",
            data: { vid: vid, path: dirPath || "" },
            success: function (ret) { callback(null, ret); },
            error: function (xhr) { callback('HTTP ' + (xhr ? xhr.status : '?')); }
        });
    }

    /** BFS 收集目录树：relPath（相对根，目录以 / 结尾的父路径+名字）→ {type,size} */
    function collectDirTree(ref, callback) {
        var rootPath = (ref.path || '') + ref.name + '/';
        var map = {};
        var truncated = false;
        var queue = [{ path: rootPath, depth: 1 }];
        var pendingReq = 0;
        var done = false;

        var finish = function () {
            if (!done) { done = true; callback(null, map, truncated); }
        };

        var maybeFinish = function () {
            if (pendingReq === 0 && queue.length === 0) finish();
        };
        var walk = function (item) {
            if (done) return;
            if (item.depth > DIR_DEPTH_LIMIT) { truncated = true; maybeFinish(); return; }
            pendingReq++;
            fetchDirEntries(ref.vid, item.path, function (err, ret) {
                pendingReq--;
                if (err) { maybeFinish(); return; }
                var list = (ret && ret.status === 'ok' && $.isArray(ret.data)) ? ret.data : null;
                if (list) {
                    for (var i = 0; i < list.length; i++) {
                        var d = list[i];
                        if (!d || !d.name) continue;
                        var parentPath = d.path || '';
                        var rel = parentPath.substring(rootPath.length) + d.name;
                        if (map[rel] === undefined) {
                            if (Object.keys(map).length >= DIR_ENTRY_LIMIT) { truncated = true; continue; }
                            map[rel] = { type: d.type, size: d.size };
                        }
                        if (d.type === 2 && Object.keys(map).length < DIR_ENTRY_LIMIT) {
                            queue.push({ path: parentPath + d.name + '/', depth: item.depth + 1 });
                        }
                    }
                }
                if (pendingReq === 0 && queue.length === 0) { finish(); return; }
                while (pendingReq < 6 && queue.length > 0 && !done) { walk(queue.shift()); }
                maybeFinish();
            });
        };
        walk(queue.shift());
        maybeFinish();
    }

    /** 目录内文本文件判定（与后端一致：文本/Office/PDF 参与内容比对，其余按大小） */
    function isTextLikeName(name) {
        return isTextDoc({ name: name }) || isOfficeDoc({ name: name });
    }

    function runDirCompare() {
        dirState = { origPair: pair, filter: 'diff' };
        buildTitles();
        showMsg('<div class="compare-tip">' + L.dirLoading + '</div>');
        var pending = 2;
        collectDirTree(pair.left, function (err, map, trunc) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailLeft + '<br/>' + escapeHtml(String(err)) + '</div>'); return; }
            dirState.treeL = map;
            dirState.truncatedL = trunc;
            if (--pending === 0) buildDirRows();
        });
        collectDirTree(pair.right, function (err, map, trunc) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailRight + '<br/>' + escapeHtml(String(err)) + '</div>'); return; }
            dirState.treeR = map;
            dirState.truncatedR = trunc;
            if (--pending === 0) buildDirRows();
        });
    }

    /** 四类比对（规则同后端 M5.1）；文本对逐对比对（上限内），完成一项记一项 */
    function buildDirRows() {
        var all = {};
        var k;
        for (k in dirState.treeL) all[k] = 1;
        for (k in dirState.treeR) all[k] = 1;
        var keys = Object.keys(all).sort();

        dirState.rows = [];
        dirState.contentCap = false;
        var textPairs = [];
        var i;
        for (i = 0; i < keys.length; i++) {
            var rel = keys[i];
            var ea = dirState.treeL[rel];
            var eb = dirState.treeR[rel];
            if (ea && !eb) {
                dirState.rows.push({ cls: 'only-left', rel: rel, type: ea.type });
            } else if (eb && !ea) {
                dirState.rows.push({ cls: 'only-right', rel: rel, type: eb.type });
            } else if (ea.type === 2 && eb.type === 2) {
                // 目录对：差异由其内容体现
            } else if (ea.type !== eb.type) {
                dirState.rows.push({ cls: 'differ', rel: rel, type: 1, note: L.typeMismatch });
            } else if (isTextLikeName(rel) && textPairs.length < DIR_CONTENT_PAIR_LIMIT) {
                textPairs.push(rel);
            } else {
                if (isTextLikeName(rel)) dirState.contentCap = true;
                if (ea.size === eb.size) {
                    dirState.rows.push({ cls: 'same', rel: rel, type: 1, note: L.sameSizeOnly });
                } else {
                    dirState.rows.push({ cls: 'differ', rel: rel, type: 1, note: L.sizeDiff + ' (' + ea.size + ' vs ' + eb.size + 'B)' });
                }
            }
        }

        // 文本对逐对内容比对（复用 fetchText + 行集合差异）
        var pendingText = textPairs.length;
        if (pendingText === 0) { renderDirList(); return; }
        for (i = 0; i < textPairs.length; i++) {
            (function (rel) {
                var texts2 = {};
                var n = 2;
                var fail = false;
                fetchText(dirFileRef(pair.left, rel), function (err, t) {
                    if (fail) return;
                    if (err) { fail = true; dirState.rows.push({ cls: 'differ', rel: rel, type: 1, note: L.readFail }); if (--pendingText === 0) renderDirList(); return; }
                    texts2.a = t;
                    if (--n > 0) return;
                    pushTextRow(rel, texts2.a, texts2.b, pendingText);
                });
                fetchText(dirFileRef(pair.right, rel), function (err, t) {
                    if (fail) return;
                    if (err) { fail = true; dirState.rows.push({ cls: 'differ', rel: rel, type: 1, note: L.readFail }); if (--pendingText === 0) renderDirList(); return; }
                    texts2.b = t;
                    if (--n > 0) return;
                    pushTextRow(rel, texts2.a, texts2.b, pendingText);
                });
            })(textPairs[i]);
        }
        function pushTextRow(rel, a, b) {
            var st = diffStats(a || '', b || '');
            if (st && st.added === 0 && st.deleted === 0) {
                dirState.rows.push({ cls: 'same', rel: rel, type: 1 });
            } else {
                dirState.rows.push({ cls: 'differ', rel: rel, type: 1, stat: '+' + (st ? st.added : '?') + '/-' + (st ? st.deleted : '?') });
            }
            if (--pendingText === 0) renderDirList();
        }
    }

    /** 目录根 + relPath → 文件对比 ref（下钻取数用） */
    function dirFileRef(rootRef, relPath) {
        var i = relPath.lastIndexOf('/');
        var parent = i < 0 ? '' : relPath.substring(0, i + 1);
        var name = i < 0 ? relPath : relPath.substring(i + 1);
        return {
            vid: rootRef.vid,
            path: (rootRef.path || '') + (rootRef.name + '/') + parent,
            name: name,
            docType: 1,
            shareId: rootRef.shareId,
            authCode: rootRef.authCode
        };
    }

    function dirRowFilter(r) {
        if (dirState.filter === 'all') return true;
        if (dirState.filter === 'diff') return r.cls !== 'same';
        return r.cls === dirState.filter;
    }

    function renderDirList() {
        var rows = (dirState.rows || []).slice().sort(function (a, b) {
            var order = { 'differ': 0, 'only-left': 1, 'only-right': 2, 'same': 3 };
            return (order[a.cls] || 9) - (order[b.cls] || 9) || a.rel.localeCompare(b.rel);
        });
        var nOnlyL = 0, nOnlyR = 0, nDiff = 0, nSame = 0;
        rows.forEach(function (r) {
            if (r.cls === 'only-left') nOnlyL++;
            else if (r.cls === 'only-right') nOnlyR++;
            else if (r.cls === 'differ') nDiff++;
            else nSame++;
        });

        // 工具条：目录模式下隐藏文件对比专用开关
        $('#btnCollapse').hide();
        $('#btnIgnoreWs').hide();
        $('#compareStats').text((dirState.truncatedL || dirState.truncatedR ? '⚠ ' : '') +
            L.dirOnlyLeft + ' ' + nOnlyL + ' · ' + L.dirOnlyRight + ' ' + nOnlyR + ' · ' +
            L.dirDiffer + ' ' + nDiff + ' · ' + L.dirSame + ' ' + nSame);

        var filters = [
            { id: 'diff', label: L.filterDiff },
            { id: 'only-left', label: L.filterOnlyLeft },
            { id: 'only-right', label: L.filterOnlyRight },
            { id: 'same', label: L.filterSame },
            { id: 'all', label: L.filterAll }
        ];
        var html = '<div class="dir-compare">';
        html += '<div class="dir-filterbar">';
        filters.forEach(function (f) {
            html += '<span class="compare-btn dir-filter' + (dirState.filter === f.id ? ' compare-btn-on' : '') + '" data-filter="' + f.id + '">' + f.label + '</span>';
        });
        html += '</div><div class="dir-table"><div class="dir-row dir-head"><span class="dir-st"></span><span class="dir-rel">Path</span><span class="dir-stat">Diff</span></div>';
        var shown = 0;
        rows.forEach(function (r) {
            if (!dirRowFilter(r)) return;
            if (shown++ >= 300) return;   //渲染上限（数据统计不受影响）
            var icon = r.cls === 'differ' ? '🟡' : (r.cls === 'only-left' ? '🔴' : (r.cls === 'only-right' ? '🟢' : '⚪'));
            var drill = r.cls === 'differ' && r.type === 1 && r.stat;   //内容差异的文本文件可下钻
            html += '<div class="dir-row' + (drill ? ' dir-drill' : '') + '" data-rel="' + escapeHtml(r.rel) + '" data-drill="' + (drill ? 1 : 0) + '">' +
                '<span class="dir-st">' + icon + '</span>' +
                '<span class="dir-rel">' + (r.type === 2 ? '[目录] ' : '') + escapeHtml(r.rel) + '</span>' +
                '<span class="dir-stat">' + escapeHtml(r.stat || r.note || '') + '</span></div>';
        });
        html += '</div>';
        if (shown >= 300) html += '<div class="dir-more">… ' + L.tooManyRows + '</div>';
        if (dirState.contentCap) html += '<div class="dir-more">⚠ ' + L.contentCapHit + ' (' + DIR_CONTENT_PAIR_LIMIT + ')</div>';
        if (dirState.truncatedL || dirState.truncatedR) html += '<div class="dir-more">⚠ ' + L.dirTruncated + ' (' + DIR_ENTRY_LIMIT + ')</div>';
        html += '</div>';

        $('#compareMsg').hide();
        var container = $('#compareContainer');
        container.show().html(html);
        container.off('click', '.dir-filter').on('click', '.dir-filter', function () {
            dirState.filter = $(this).data('filter');
            renderDirList();
        });
        container.off('click', '.dir-drill').on('click', '.dir-drill', function () {
            drillDownFile($(this).data('rel'));
        });
    }

    /** 下钻：进入某对内容差异文本文件的差异视图（复用文件对比渲染），面包屑返回 */
    function drillDownFile(relPath) {
        pair = { left: dirFileRef(dirState.origPair.left, relPath), right: dirFileRef(dirState.origPair.right, relPath) };
        buildTitles();
        var bc = '<div class="dir-breadcrumb"><a href="javascript:void(0)" id="dirBackLink">« ' + L.backToDir + '</a> · ' + escapeHtml(relPath) + '</div>';
        $('#compareContainer').before(bc);
        $('#btnCollapse').show();
        $('#btnIgnoreWs').show();
        // 复用文件主流程（文本分支；Office 等在此不可达——只有文本对才可下钻）
        showMsg('<div class="compare-tip">' + L.loading + '</div>');
        var pending = 2;
        texts = {};
        fetchText(pair.left, function (err, text) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailLeft + '<br/>' + escapeHtml(err) + '</div>'); return; }
            if (text.length > MAX_CHARS) { showMsg('<div class="compare-tip">' + L.tooLargeLeft + '</div>'); return; }
            texts.left = text;
            if (--pending === 0) renderMerge();
        });
        fetchText(pair.right, function (err, text) {
            if (err) { showMsg('<div class="compare-tip">' + L.loadFailRight + '<br/>' + escapeHtml(err) + '</div>'); return; }
            if (text.length > MAX_CHARS) { showMsg('<div class="compare-tip">' + L.tooLargeRight + '</div>'); return; }
            texts.right = text;
            if (--pending === 0) renderMerge();
        });
        $('#dirBackLink').off('click').on('click', backToDirList);
    }

    function backToDirList() {
        $('.dir-breadcrumb').remove();
        pair = dirState.origPair;
        buildTitles();
        renderDirList();
    }

    // ---------- 工具条 ----------

    function toggleCollapse() {
        opts.collapse = !opts.collapse;
        $('#btnCollapse').toggleClass('compare-btn-on', opts.collapse);
        if (texts.left != null && texts.right != null) renderMerge();
    }

    function toggleIgnoreWs() {
        opts.ignoreWs = !opts.ignoreWs;
        $('#btnIgnoreWs').toggleClass('compare-btn-on', opts.ignoreWs);
        if (texts.left != null && texts.right != null) renderMerge();
    }

    function closeWindow() {
        var dialogId = getQueryString("dialogId");
        if (dialogId && window.parent && window.parent.artDialogList && window.parent.artDialogList[dialogId]) {
            try { window.parent.artDialogList[dialogId].close(); return; } catch (e) { }
        }
        try { window.close(); } catch (e) { }
    }

    // ---------- 入口 ----------

    function init(lang) {
        L = lang || {};
        // M5.2 目录对比文案兜底（两页 init 均显式传入，这里只防漏）
        var defaults = {
            noParam: '缺少对比参数（请从文件右键菜单发起对比）', loading: '正在获取两侧文件内容…',
            loadFailLeft: '左侧内容获取失败', loadFailRight: '右侧内容获取失败',
            tooLargeLeft: '左侧内容过大，超出对比上限', tooLargeRight: '右侧内容过大，超出对比上限',
            officePending: 'Office/PDF 文件对比（并排打开查看器）将在下一版本提供',
            binaryUnsupported: '该类型文件暂不支持对比', identical: '无差异', chunksUnit: '处变更',
            mixedUnsupported: '暂不支持文件与目录混合对比，请两侧同为文件或同为目录',
            dirLoading: '正在扫描两侧目录并比对（大目录可能需要一点时间）…',
            dirOnlyLeft: '仅左侧', dirOnlyRight: '仅右侧', dirDiffer: '内容不同', dirSame: '相同',
            filterDiff: '有差异', filterOnlyLeft: '仅左侧', filterOnlyRight: '仅右侧',
            filterSame: '相同', filterAll: '全部',
            typeMismatch: '类型不同（一侧文件一侧目录）', sameSizeOnly: '大小相同（未比对内容）',
            sizeDiff: '大小不同', readFail: '读取失败', tooManyRows: '条目过多，仅显示前 300 行（可筛选或缩小范围）',
            contentCapHit: '文本文件对数超出内容比对上限，超出部分仅按大小判定', dirTruncated: '目录较大超出条目上限，结果不完整',
            backToDir: '返回目录对比'
        };
        for (var k in defaults) { if (L[k] === undefined) L[k] = defaults[k]; }
        $('#btnCollapse').off('click').on('click', toggleCollapse);
        $('#btnIgnoreWs').off('click').on('click', toggleIgnoreWs);
        $('#btnClose').off('click').on('click', closeWindow);
        pair = loadPair();
        if (pair) buildTitles();
        run();
    }

    return { init: init };
})();
