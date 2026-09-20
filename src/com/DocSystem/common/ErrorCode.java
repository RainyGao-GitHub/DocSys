package com.DocSystem.common;

/**
 * 接口失败原因错误码（R1-1，2026-09-20）。
 *
 * <p><b>为什么需要</b>：DocSys 的 `.do` 接口此前只用自然语言描述失败（{@code ReturnAjax.msgInfo}），
 * 调用方（尤其是 Agent 工具层）只能**嗅探文案**判断该不该重试——例如工具层曾用
 * {@code "请稍后重试"} 判定"文档被锁占用，可重试"。这种判定非常脆弱：
 * <ul>
 *   <li>文案一改即失效；</li>
 *   <li>会误判：{@code reposCheck()} 的"系统维护中，请稍后重试！"并非锁冲突，却同样命中；</li>
 *   <li>无法区分"锁冲突/无权限/不存在/参数错"，也就无法给出正确的处置建议。</li>
 * </ul>
 *
 * <p>错误码随 {@code ReturnAjax} 一起序列化返回（多一个 JSON 字段，前端不读、完全向后兼容）。
 * 调用方应<b>优先用码判定</b>，文案只用于展示。
 */
public class ErrorCode {

    /** 文档被 FORCE 锁占用（多为后台异步动作未完成），属"稍后重试即可成功"的可重试场景 */
    public static final String DOC_LOCKED = "DOC_LOCKED";

    /** 用户未登录 / 会话失效 */
    public static final String NOT_LOGIN = "NOT_LOGIN";

    /** 权限不足（无访问/新增/删除/编辑/管理权限，或分享范围外访问） */
    public static final String NO_PERMISSION = "NO_PERMISSION";

    /** 目标文档/目录不存在（含 docId 已失效：被移动、重命名或删除） */
    public static final String DOC_NOT_FOUND = "DOC_NOT_FOUND";

    /** 仓库不存在或已被禁用 */
    public static final String REPOS_NOT_FOUND = "REPOS_NOT_FOUND";

    /** 参数缺失或非法（调用方应修正入参，而非重试） */
    public static final String INVALID_PARAM = "INVALID_PARAM";

    /** 系统维护中（服务端主动拒绝，非调用方问题） */
    public static final String SYSTEM_BUSY = "SYSTEM_BUSY";

    /** 异步任务（备份/全量备份/压缩等）不存在或已过期回收——调用方应重新发起任务，而不是重试同一个 taskId */
    public static final String TASK_NOT_FOUND = "TASK_NOT_FOUND";

    /** 分享记录不存在或已被撤销——调用方应重新获取分享列表，而不是沿用旧 shareId */
    public static final String SHARE_NOT_FOUND = "SHARE_NOT_FOUND";

    /** 其它内部错误 */
    public static final String INTERNAL = "INTERNAL";

    private ErrorCode() {
    }
}
