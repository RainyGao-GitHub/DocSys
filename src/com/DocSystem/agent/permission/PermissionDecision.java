package com.DocSystem.agent.permission;

/**
 * 权限判定结果（纯数据）。
 *
 * <ul>
 *   <li>{@link Verdict#ALLOW} 直接执行（跳过确认门；仍写审计，标注批准来源）</li>
 *   <li>{@link Verdict#ASK}   走确认门（弹窗/轮询批准）</li>
 *   <li>{@link Verdict#DENY}  直接拒绝（当前只有计划模式：写操作不执行，提示先出计划）</li>
 * </ul>
 */
public final class PermissionDecision {

    public enum Verdict { ALLOW, ASK, DENY }

    public final Verdict verdict;

    /** 判定原因（日志/审计/前端展示用，如 absolute / plan / rule(dir) / hardlist / mode(auto)） */
    public final String reason;

    private PermissionDecision(Verdict verdict, String reason) {
        this.verdict = verdict;
        this.reason = reason;
    }

    public static PermissionDecision allow(String reason) {
        return new PermissionDecision(Verdict.ALLOW, reason);
    }

    public static PermissionDecision ask(String reason) {
        return new PermissionDecision(Verdict.ASK, reason);
    }

    public static PermissionDecision deny(String reason) {
        return new PermissionDecision(Verdict.DENY, reason);
    }

    public boolean isAllow() {
        return verdict == Verdict.ALLOW;
    }

    public boolean isAsk() {
        return verdict == Verdict.ASK;
    }

    public boolean isDeny() {
        return verdict == Verdict.DENY;
    }

    @Override
    public String toString() {
        return verdict + "(" + reason + ")";
    }
}
