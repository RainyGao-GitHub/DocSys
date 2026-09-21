package com.DocSystem.agent.util;

/**
 * HTML 片段清洗（R3-12 / R3-14 共用）：去标签 → 解码实体 → Unicode 空白归一 → 折叠空白。
 *
 * <p><b>为什么抽成公共类</b>：R3-12 为搜索引擎摘要（Bing）在 {@code WebSearchService} 里写了实体解码，
 * R3-14 又需要在 {@code DocSysClient} 里把容器 HTML 错误页的 {@code message}/{@code description} 解出来。
 * 两处需求完全一致，各自实现必然漂移（一处修了另一处忘），故抽到此共用。
 *
 * <p><b>解码口径（宁缺勿滥）</b>：数字实体（十进制/十六进制）与常见具名实体表；**未收录的具名实体原样保留**、
 * 缺分号或过长的片段当普通字符处理 —— 不丢信息、不瞎猜。
 */
public class HtmlText {

    /** 常见具名实体（摘要/错误页里高频）；未收录的保持原样 */
    private static final String[][] NAMED_ENTITY_PAIRS = {
            {"nbsp", " "}, {"ensp", " "}, {"emsp", " "}, {"thinsp", " "}, {"zwnj", ""}, {"zwj", ""},
            {"amp", "&"}, {"lt", "<"}, {"gt", ">"}, {"quot", "\""}, {"apos", "'"},
            {"ldquo", "\u201C"}, {"rdquo", "\u201D"}, {"lsquo", "\u2018"}, {"rsquo", "\u2019"},
            {"laquo", "\u00AB"}, {"raquo", "\u00BB"}, {"lsaquo", "\u2039"}, {"rsaquo", "\u203A"},
            {"mdash", "\u2014"}, {"ndash", "\u2013"}, {"hellip", "\u2026"}, {"middot", "\u00B7"},
            {"bull", "\u2022"}, {"dagger", "\u2020"}, {"prime", "\u2032"}, {"Prime", "\u2033"},
            {"deg", "\u00B0"}, {"times", "\u00D7"}, {"divide", "\u00F7"}, {"plusmn", "\u00B1"},
            {"le", "\u2264"}, {"ge", "\u2265"}, {"ne", "\u2260"}, {"asymp", "\u2248"}, {"equiv", "\u2261"},
            {"infin", "\u221E"}, {"sum", "\u2211"}, {"prod", "\u220F"}, {"radic", "\u221A"},
            {"larr", "\u2190"}, {"rarr", "\u2192"}, {"uarr", "\u2191"}, {"darr", "\u2193"}, {"harr", "\u2194"},
            {"copy", "\u00A9"}, {"reg", "\u00AE"}, {"trade", "\u2122"}, {"sect", "\u00A7"}, {"para", "\u00B6"},
            {"euro", "\u20AC"}, {"pound", "\u00A3"}, {"yen", "\u00A5"}, {"cent", "\u00A2"},
    };

    private static final java.util.Map<String, String> NAMED_ENTITIES = new java.util.HashMap<String, String>();

    static {
        for (String[] pair : NAMED_ENTITY_PAIRS) {
            NAMED_ENTITIES.put(pair[0], pair[1]);
        }
    }

    /** 实体名长度上限（{@code &} 到 {@code ;} 之间）；超出视为普通字符，避免把长文本误当实体扫描 */
    private static final int MAX_ENTITY_NAME_LEN = 10;

    private HtmlText() {
    }

    /** 去标签（标签位置换成一个空格，避免 {@code a<b>c} 粘成 {@code ac}） */
    public static String stripTags(String s) {
        if (s == null) {
            return "";
        }
        return s.replaceAll("<[^>]+>", " ");
    }

    /** 去标签 → 解码实体 → Unicode 空白归一 → 折叠成一行；HTML 片段进模型上下文前统一走这里 */
    public static String clean(String s) {
        if (s == null) {
            return "";
        }
        return collapse(normalizeSpaces(decodeEntities(stripTags(s))));
    }

    /** 只折叠空白、成一行（用于确认是纯文本、不需要解码的片段） */
    public static String oneLine(String s) {
        if (s == null) {
            return "";
        }
        return collapse(s);
    }

    /**
     * 解码 HTML 实体：数字（{@code &#183;} / {@code &#x25CF;}）与常见具名实体。
     * 未收录的具名实体、缺少分号或过长的片段一律**原样保留**。
     */
    public static String decodeEntities(String s) {
        if (s == null || s.indexOf('&') < 0) {
            return s;
        }
        StringBuilder out = new StringBuilder(s.length());
        int i = 0;
        while (i < s.length()) {
            char c = s.charAt(i);
            if (c != '&') {
                out.append(c);
                i++;
                continue;
            }
            int semi = s.indexOf(';', i + 1);
            if (semi < 0 || (semi - i) > MAX_ENTITY_NAME_LEN) {
                out.append(c);
                i++;
                continue;
            }
            String decoded = decodeEntity(s.substring(i + 1, semi));
            if (decoded == null) {
                out.append(c);
                i++;
                continue;
            }
            out.append(decoded);
            i = semi + 1;
        }
        return out.toString();
    }

    /** 解码单个实体名（不含 {@code &} 与 {@code ;}）；无法识别返回 null */
    private static String decodeEntity(String body) {
        if (body == null || body.isEmpty()) {
            return null;
        }
        if (body.charAt(0) == '#') {
            int code;
            try {
                boolean hex = body.length() > 1 && (body.charAt(1) == 'x' || body.charAt(1) == 'X');
                code = hex ? Integer.parseInt(body.substring(2), 16) : Integer.parseInt(body.substring(1));
            } catch (Exception e) {
                return null;
            }
            if (!Character.isValidCodePoint(code) || code == 0) {
                return null;
            }
            return new String(Character.toChars(code));
        }
        return NAMED_ENTITIES.get(body);
    }

    /** Unicode 空白（nbsp/ensp/emsp/thinsp/全角空格/BOM）统一成普通空格，便于随后折叠 */
    public static String normalizeSpaces(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\u00A0' || c == '\u3000' || c == '\u202F' || c == '\u205F' || c == '\uFEFF'
                    || (c >= '\u2000' && c <= '\u200B')) {
                sb.append(' ');
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /** 连续空白折成一个空格并 trim */
    public static String collapse(String s) {
        if (s == null) {
            return "";
        }
        return s.replaceAll("\\s+", " ").trim();
    }
}
