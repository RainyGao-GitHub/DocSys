package com.DocSystem.agent.attachment;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Agent 附件支持类（P2：上传 = 对话输入，默认临时）。
 *
 * <p>背景：Agent 页的「📎 上传」是给<b>本轮对话</b>提供输入的（图片让模型看、文档让模型读），
 * 不应该默认写进仓库。所以附件保存到<b>会话级临时目录</b>，由工具按需读取；
 * 用户若要入库，必须显式选仓库 + 目录（走 /agent/attachment/import）。</p>
 *
 * <p>职责（纯函数 + 文件 IO，无 Spring 依赖，便于护栏单测）：</p>
 * <ul>
 *   <li>会话临时目录：{@code <java.io.tmpdir>/DocSysAgentUpload/<userId>/<sessionId>/}</li>
 *   <li>文件名清洗（防目录穿越/控制字符）、扩展名白名单、MIME 猜测</li>
 *   <li>读取策略：文本类返回内容（有上限），二进制/图片只返回元信息（不臆造内容）</li>
 *   <li>注入块渲染（【本轮附件】）与超期清理</li>
 * </ul>
 *
 * <p>设计见 {@code devDocs/Agent关注对象与操作设计方案.md}（§14 附件）。</p>
 */
public final class AgentAttachmentSupport {

    /** 单文件大小上限（20MB） */
    public static final long MAX_FILE_BYTES = 20L * 1024 * 1024;
    /** 单会话附件数量上限 */
    public static final int MAX_ATTACHMENTS = 10;
    /** 文本读取：单次返回字符上限 */
    public static final int MAX_READ_CHARS = 200_000;
    /** 文本读取：超过此大小不直接返回内容（避免撑爆上下文） */
    public static final long MAX_READ_BYTES = 1024L * 1024;
    /** 文件名长度上限 */
    public static final int MAX_NAME_LEN = 120;
    /** 孤儿目录保留天数 */
    public static final long RETENTION_DAYS = 7;

    private static final String ROOT_DIR_NAME = "DocSysAgentUpload";

    /** 文本类扩展名白名单（可直接读取内容） */
    private static final Set<String> TEXT_EXT = new LinkedHashSet<String>();
    static {
        String[] exts = {
            "txt", "md", "markdown", "log", "csv", "tsv", "json", "xml", "yml", "yaml", "ini", "conf",
            "properties", "sql", "html", "htm", "css", "js", "ts", "java", "c", "h", "cpp", "hpp", "cs",
            "py", "rb", "go", "rs", "php", "sh", "bat", "ps1", "tex", "srt", "vtt", "diff", "patch"
        };
        for (String e : exts) {
            TEXT_EXT.add(e);
        }
    }

    private AgentAttachmentSupport() {
    }

    // ==================== 路径 ====================

    /** 附件根目录（系统临时目录下） */
    public static File rootDir() {
        String tmp = System.getProperty("java.io.tmpdir");
        if (tmp == null || tmp.isEmpty()) {
            tmp = ".";
        }
        return new File(tmp, ROOT_DIR_NAME);
    }

    /** 会话目录键：sessionId 为空时用 default（前后端与工具层必须用同一规则） */
    public static String sessionKey(String sessionId) {
        return (sessionId == null || sessionId.trim().isEmpty()) ? "default" : sessionId.trim();
    }

    /**
     * 会话附件目录：{@code <tmp>/DocSysAgentUpload/<userId>/<sessionId>/}（不存在则创建）。
     * userId/sessionId 都会做安全化处理，避免越出根目录。
     */
    public static File sessionDir(String userId, String sessionId, boolean create) {
        File userDir = new File(rootDir(), safeSegment(userId, "anon"));
        File dir = new File(userDir, safeSegment(sessionId, "default"));
        if (create && !dir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
        }
        return dir;
    }

    /**
     * 目录名安全化：只保留字母数字与 . _ -，<b>并剔除点号</b>（防止 "." / ".." 越出根目录）。
     * sessionId 是 UUID、userId 是用户名，均无需保留的点。
     */
    public static String safeSegment(String raw, String fallback) {
        if (raw == null || raw.trim().isEmpty()) {
            return fallback;
        }
        StringBuilder sb = new StringBuilder();
        String s = raw.trim();
        for (int i = 0; i < s.length() && sb.length() < 64; i++) {
            char c = s.charAt(i);
            boolean ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
                    || c == '_' || c == '-';
            if (ok) {
                sb.append(c);
            }
        }
        return sb.length() == 0 ? fallback : sb.toString();
    }

    /**
     * 文件名清洗：去路径分隔与控制字符、保留扩展名、限长；结果必定是纯文件名（无目录成分）。
     *
     * @return 清洗后的文件名；无法用时返回 null（调用方应返回参数错误）
     */
    public static String sanitizeName(String raw) {
        if (raw == null) {
            return null;
        }
        String name = raw.trim();
        // 去掉任何目录成分（Windows/Unix 分隔符都处理，防 ../ 穿越）
        int cut = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (cut >= 0) {
            name = name.substring(cut + 1);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < name.length(); i++) {
            char c = name.charAt(i);
            if (c == '\n' || c == '\r' || c == '\t' || Character.isISOControl(c)) {
                continue;
            }
            if (c == '【' || c == '】') {   // 与注入块标记冲突 → 转义
                sb.append(c == '【' ? '〔' : '〕');
                continue;
            }
            sb.append(c);
        }
        String out = sb.toString().trim();
        // 剥掉前导点：避免隐藏文件（如 .env）上传后 listItems 看不到、又防止与已入库标记旁车文件（._imported）撞名
        while (out.startsWith(".")) {
            out = out.substring(1).trim();
        }
        if (out.isEmpty() || ".".equals(out) || "..".equals(out)) {
            return null;
        }
        if (out.length() > MAX_NAME_LEN) {
            // 保留扩展名
            String ext = extensionOf(out);
            int keep = MAX_NAME_LEN - (ext.isEmpty() ? 0 : ext.length() + 1);
            if (keep < 8) {
                keep = 8;
            }
            out = out.substring(0, keep) + (ext.isEmpty() ? "" : "." + ext);
        }
        return out;
    }

    /** 扩展名（小写，不含点）；无扩展名返回 "" */
    public static String extensionOf(String name) {
        if (name == null) {
            return "";
        }
        int dot = name.lastIndexOf('.');
        if (dot <= 0 || dot >= name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1).toLowerCase();
    }

    /** 是否文本类（可直接读内容） */
    public static boolean isTextLike(String name) {
        return TEXT_EXT.contains(extensionOf(name));
    }

    /** 粗粒度 MIME（够注入块与工具提示用；不追求完整映射） */
    public static String mimeOf(String name) {
        String ext = extensionOf(name);
        if (isTextLike(name)) {
            if ("json".equals(ext)) return "application/json";
            if ("xml".equals(ext)) return "application/xml";
            if ("html".equals(ext) || "htm".equals(ext)) return "text/html";
            if ("csv".equals(ext) || "tsv".equals(ext)) return "text/csv";
            return "text/plain";
        }
        if ("pdf".equals(ext)) return "application/pdf";
        if ("doc".equals(ext) || "docx".equals(ext)) return "application/msword";
        if ("xls".equals(ext) || "xlsx".equals(ext)) return "application/vnd.ms-excel";
        if ("ppt".equals(ext) || "pptx".equals(ext)) return "application/vnd.ms-powerpoint";
        if ("zip".equals(ext)) return "application/zip";
        if ("png".equals(ext)) return "image/png";
        if ("jpg".equals(ext) || "jpeg".equals(ext)) return "image/jpeg";
        if ("gif".equals(ext)) return "image/gif";
        if ("webp".equals(ext)) return "image/webp";
        if ("bmp".equals(ext)) return "image/bmp";
        if ("svg".equals(ext)) return "image/svg+xml";
        return "application/octet-stream";
    }

    /** 附件粗分类：image / text / doc / other（前端选图标、注入块标注用） */
    public static String kindOf(String name) {
        String mime = mimeOf(name);
        if (mime.startsWith("image/")) {
            return "image";
        }
        if (isTextLike(name)) {
            return "text";
        }
        String ext = extensionOf(name);
        if ("pdf".equals(ext) || "doc".equals(ext) || "docx".equals(ext) || "xls".equals(ext)
                || "xlsx".equals(ext) || "ppt".equals(ext) || "pptx".equals(ext)) {
            return "doc";
        }
        return "other";
    }

    // ==================== 元信息 ====================

    /** 附件元信息（HTTP 返回 / 注入块 / 工具都用同一结构） */
    public static class Item {
        public String id;
        public String name;
        public long size;
        public String mime;
        public String kind;
        /** 是否已入库（每附件只能入库一次） */
        public boolean imported;

        public Item() {
        }

        public Item(String id, String name, long size) {
            this.id = id;
            this.name = name;
            this.size = size;
            this.mime = mimeOf(name);
            this.kind = kindOf(name);
        }

        /** 人类可读大小 */
        public String sizeText() {
            if (size < 1024) {
                return size + " B";
            }
            if (size < 1024 * 1024) {
                return String.format("%.1f KB", size / 1024.0);
            }
            return String.format("%.1f MB", size / (1024.0 * 1024));
        }
    }

    /** 列目录下的附件（按名称排序，不递归） */
    public static List<Item> listItems(File sessionDir) {
        List<Item> out = new ArrayList<Item>();
        File[] files = sessionDir == null ? null : sessionDir.listFiles();
        if (files == null) {
            return out;
        }
        List<File> sorted = new ArrayList<File>();
        for (File f : files) {
            if (f.isFile() && !f.getName().startsWith(".")) {
                sorted.add(f);
            }
        }
        java.util.Collections.sort(sorted, new java.util.Comparator<File>() {
            @Override
            public int compare(File a, File b) {
                return a.getName().compareToIgnoreCase(b.getName());
            }
        });
        Set<String> imported = readImported(sessionDir);
        for (File f : sorted) {
            Item it = new Item(f.getName(), f.getName(), f.length());
            it.imported = imported.contains(f.getName());
            out.add(it);
        }
        return out;
    }

    /** 按 id（= 文件名）解析附件文件；不存在或非法返回 null */
    public static File resolve(File sessionDir, String id) {
        String safe = sanitizeName(id);
        if (sessionDir == null || safe == null) {
            return null;
        }
        File f = new File(sessionDir, safe);
        return f.isFile() ? f : null;
    }

    // ==================== 读取策略 ====================

    /** 读取结果：text 带 content；binary/image 只有 meta（不臆造内容） */
    public static class ReadResult {
        public String kind;      // text | binary
        public String content;   // kind=text 时有值（已截断）
        public boolean truncated;
        public String meta;      // 元信息描述（两种 kind 都有）

        public ReadResult(String kind, String content, boolean truncated, String meta) {
            this.kind = kind;
            this.content = content;
            this.truncated = truncated;
            this.meta = meta;
        }
    }

    /**
     * 读取附件供工具返回：
     * <ul>
     *   <li>文本类且 ≤ {@link #MAX_READ_BYTES} → 返回内容（超 {@link #MAX_READ_CHARS} 截断）</li>
     *   <li>其余（图片/PDF/Office/超大文本）→ 只返回元信息，提示模型不要臆造内容</li>
     * </ul>
     */
    public static ReadResult readForTool(File file, String name) throws IOException {
        if (file == null || !file.isFile()) {
            return null;
        }
        long size = file.length();
        String mime = mimeOf(name);
        String kind = kindOf(name);
        String meta = "name=" + name + ", size=" + size + "B, mime=" + mime + ", kind=" + kind;
        if (!isTextLike(name) || size > MAX_READ_BYTES) {
            String reason = isTextLike(name)
                    ? "文件过大（>" + (MAX_READ_BYTES / 1024) + "KB），未返回内容"
                    : ("类型 " + kind + "（" + mime + "）不是纯文本，未返回内容");
            return new ReadResult("binary", null, false, meta + "；" + reason);
        }
        StringBuilder sb = new StringBuilder();
        Reader r = new InputStreamReader(new FileInputStream(file), Charset.forName("UTF-8"));
        try {
            char[] buf = new char[8192];
            int n;
            boolean truncated = false;
            while ((n = r.read(buf)) > 0) {
                if (sb.length() + n > MAX_READ_CHARS) {
                    sb.append(buf, 0, Math.max(0, MAX_READ_CHARS - sb.length()));
                    truncated = true;
                    break;
                }
                sb.append(buf, 0, n);
            }
            return new ReadResult("text", sb.toString(), truncated, meta);
        } finally {
            r.close();
        }
    }

    // ==================== 注入块 ====================

    /** 注入块段头 */
    public static final String BLOCK_HEAD = "【本轮附件】";

    /**
     * 渲染附件行（不含【本轮附件】段头与【提示】；由 AgentFocusSupport 组装成注入块）。
     *
     * <p>默认按「模型无视觉能力」渲染（改造前行为）。接入多模态时用
     * {@link #renderLines(List, boolean)} 传入模型能力。
     *
     * @return 无附件时返回 ""；否则每行以 \n 结尾
     */
    public static String renderLines(List<Item> items) {
        return renderLines(items, false);
    }

    /**
     * 渲染附件行，图片行文案随「本轮图片内容是否对模型可见」分支。
     *
     * @param visionAvailable 语义是「**本轮**图片内容对模型可见」，不是单纯的模型能力：调用方
     *                        （图片已内联进消息，或由视觉工具携带）才能传 true；未接线时一律 false，
     *                        避免让模型以为能看到实际不可见的图片。见设计方案 §14.8。
     * @return 无附件时返回 ""；否则每行以 \n 结尾
     */
    public static String renderLines(List<Item> items, boolean visionAvailable) {
        if (items == null || items.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        int idx = 1;
        for (Item it : items) {
            sb.append(idx++).append(". ").append(typeLabelCn(it.kind)).append('「')
              .append(it.name).append("」(").append(it.sizeText());
            if (it.mime != null && it.mime.startsWith("image/")) {
                sb.append(", ").append(it.mime).append(visionAvailable
                        ? "：图片，本轮图片内容已可查看（多模态），不要臆造未提供的信息"
                        : "：图片，当前模型无视觉能力，不要臆造图片内容");
            } else if ("text".equals(it.kind)) {
                sb.append(", 文本，可用 attachment 工具读取内容");
            } else {
                sb.append(", ").append(it.mime).append("：非纯文本，可用 attachment 工具读取（只返回元信息）");
            }
            sb.append(")\n");
        }
        return sb.toString();
    }

    /** 类型中文标签 */
    public static String typeLabelCn(String kind) {
        if ("image".equals(kind)) {
            return "图片";
        }
        if ("text".equals(kind)) {
            return "文本";
        }
        if ("doc".equals(kind)) {
            return "文档";
        }
        return "文件";
    }

    // ==================== 已入库标记（旁车文件） ====================

    /**
     * 会话内「已入库」标记文件名（一个附件只能入库一次）。点号开头 → {@link #listItems(File)} 不列出、
     * {@link #resolve(File, String)} 也取不到（sanitizeName 会剥掉前导点），因此它不会被当成附件展示/读取。
     */
    public static final String IMPORTED_FILE = "._imported";

    /** 已入库的附件 id 集合（每行一个 id；文件缺失/损坏返回空集，不抛异常） */
    public static Set<String> readImported(File sessionDir) {
        Set<String> out = new LinkedHashSet<String>();
        if (sessionDir == null) {
            return out;
        }
        File f = new File(sessionDir, IMPORTED_FILE);
        if (!f.isFile()) {
            return out;
        }
        String text = readTextFile(f);
        if (text == null) {
            return out;
        }
        for (String line : text.split("\\r?\\n")) {
            String id = line.trim();
            if (!id.isEmpty()) {
                out.add(id);
            }
        }
        return out;
    }

    /** 该附件是否已入库 */
    public static boolean isImported(File sessionDir, String id) {
        String safeId = sanitizeName(id);
        return safeId != null && readImported(sessionDir).contains(safeId);
    }

    /**
     * 标记为已入库（best-effort，幂等）：已标记过返回 false；写失败也返回 false，不影响入库本身。
     */
    public static boolean markImported(File sessionDir, String id) {
        if (sessionDir == null) {
            return false;
        }
        String safeId = sanitizeName(id);
        if (safeId == null) {
            return false;
        }
        Set<String> all = readImported(sessionDir);
        if (!all.add(safeId)) {
            return false;
        }
        return writeImported(sessionDir, all);
    }

    /**
     * 取消「已入库」标记（附件被移除时调用；幂等）：否则同名文件重新上传会被误判为已入库。
     */
    public static boolean unmarkImported(File sessionDir, String id) {
        if (sessionDir == null) {
            return false;
        }
        String safeId = sanitizeName(id);
        if (safeId == null) {
            return false;
        }
        Set<String> all = readImported(sessionDir);
        if (!all.remove(safeId)) {
            return false;
        }
        return writeImported(sessionDir, all);
    }

    /** 写出标记文件（每行一个 id；空集合则删除文件） */
    private static boolean writeImported(File sessionDir, Set<String> ids) {
        File f = new File(sessionDir, IMPORTED_FILE);
        try {
            if (ids.isEmpty()) {
                return !f.exists() || f.delete();
            }
            StringBuilder sb = new StringBuilder();
            for (String one : ids) {
                sb.append(one).append('\n');
            }
            Writer w = new OutputStreamWriter(new FileOutputStream(f), Charset.forName("UTF-8"));
            try {
                w.write(sb.toString());
            } finally {
                w.close();
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** 读整个文本文件（UTF-8）；失败返回 null */
    private static String readTextFile(File f) {
        try {
            StringBuilder sb = new StringBuilder();
            Reader r = new InputStreamReader(new FileInputStream(f), Charset.forName("UTF-8"));
            try {
                char[] buf = new char[4096];
                int n;
                while ((n = r.read(buf)) > 0) {
                    sb.append(buf, 0, n);
                }
            } finally {
                r.close();
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    // ==================== 清理 ====================

    /**
     * 清理超期（mtime 早于 now-ttl）的会话目录。供应用启动时调用。
     *
     * @return 删除的目录数
     */
    public static int sweepExpired(long ttlMillis) {
        File root = rootDir();
        if (!root.isDirectory()) {
            return 0;
        }
        long deadline = System.currentTimeMillis() - Math.max(0, ttlMillis);
        int removed = 0;
        File[] users = root.listFiles();
        if (users == null) {
            return 0;
        }
        for (File userDir : users) {
            if (!userDir.isDirectory()) {
                continue;
            }
            File[] sessions = userDir.listFiles();
            if (sessions == null) {
                continue;
            }
            for (File session : sessions) {
                if (session.isDirectory() && session.lastModified() < deadline) {
                    if (deleteRecursively(session)) {
                        removed++;
                    }
                }
            }
            // 用户目录空了也清掉
            File[] left = userDir.listFiles();
            if (left != null && left.length == 0) {
                //noinspection ResultOfMethodCallIgnored
                userDir.delete();
            }
        }
        return removed;
    }

    /** 递归删除（失败返回 false） */
    public static boolean deleteRecursively(File target) {
        if (target == null || !target.exists()) {
            return false;
        }
        if (target.isDirectory()) {
            File[] kids = target.listFiles();
            if (kids != null) {
                for (File kid : kids) {
                    deleteRecursively(kid);
                }
            }
        }
        return target.delete();
    }

    /** 会话结束时删除该会话的附件目录 */
    public static boolean deleteSessionDir(String userId, String sessionId) {
        return deleteRecursively(sessionDir(userId, sessionId, false));
    }
}
