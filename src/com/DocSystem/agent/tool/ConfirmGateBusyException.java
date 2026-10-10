package com.DocSystem.agent.tool;

/**
 * 确认门"忙"信号（2026-10-10 用户裁定 D10）：
 *
 * <p>当**全局同时挂起的待确认数**达到上限时，新的写操作**不排队、不阻塞**，而是直接
 * 抛出本异常 —— 让工具层把"请先处理已有的待确认"原样回给用户/模型。</p>
 *
 * <p>为什么需要它：D5/D10 裁定"超时不得自动批准、也不得自动否决"，于是等待可以是
 * **无限**的；若不加限制，被放弃的待确认会不断累积（每个占一个线程 + 一份驻留上下文）。
 * 上限把风险从"无界"变成"有界"，且**不做任何自动决定**——只是拒绝开始新的等待。</p>
 */
public class ConfirmGateBusyException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ConfirmGateBusyException(String message) {
        super(message);
    }
}
