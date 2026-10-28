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
        L.identical = L.identical || '无差异';
        L.chunksUnit = L.chunksUnit || '处变更';
        $('#btnCollapse').on('click', toggleCollapse);
        $('#btnIgnoreWs').on('click', toggleIgnoreWs);
        $('#btnClose').on('click', closeWindow);
        pair = loadPair();
        if (pair) buildTitles();
        run();
    }

    return { init: init };
})();
