package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSONObject;

/**
 * 工具定义 —— 把 DocSysClient 的一个 API 包装成 LLM 可见、可调用的工具。
 *
 * <p>字段全部 {@code final}，构造后不可变（线程安全，可被 ToolRegistry 并发读取）。</p>
 *
 * <p>对应开发计划 T1.2：{@code name / description / parameters(JSON Schema) / executor / isWrite / needsConfirm}。</p>
 */
public class ToolDefinition {

    /** 工具名（LLM 调用时使用的标识，如 list_repos） */
    public final String name;

    /** 工具描述（进入 system prompt，说明用途与何时使用） */
    public final String description;

    /**
     * 参数 JSON Schema（fastjson 表示）。例：
     * <pre>
     * {
     *   "type": "object",
     *   "properties": {
     *     "vid": { "type": "integer", "description": "仓库ID" }
     *   },
     *   "required": ["vid"]
     * }
     * </pre>
     */
    public final JSONObject parameters;

    /** 实际执行器（函数式接口，接受 JSON 参数，返回执行结果） */
    public final ToolExecutor executor;

    /** 是否写操作（影响审计与二次确认） */
    public final boolean isWrite;

    /** 是否需要在执行前用户确认（写操作通常 true） */
    public final boolean needsConfirm;

    /** 是否仅管理员可用 */
    public final boolean adminOnly;

    /**
     * 权限风险类别（P1）：null → 取 {@link com.DocSystem.agent.permission.ToolRiskCatalog} 的登记值；
     * 两者都无 → 调用方按 fail-safe 当 {@code ABSOLUTE} 处理（宁可多问一次）。
     */
    public final com.DocSystem.agent.permission.ToolRisk riskClass;

    private ToolDefinition(Builder b) {
        this.name = b.name;
        this.description = b.description;
        this.parameters = b.parameters != null ? b.parameters : emptyObjectSchema();
        this.executor = b.executor;
        this.isWrite = b.isWrite;
        this.needsConfirm = b.needsConfirm;
        this.adminOnly = b.adminOnly;
        this.riskClass = b.riskClass;
    }

    public static Builder builder(String name, String description, ToolExecutor executor) {
        return new Builder(name, description, executor);
    }

    private static JSONObject emptyObjectSchema() {
        JSONObject schema = new JSONObject();
        schema.put("type", "object");
        schema.put("properties", new JSONObject());
        return schema;
    }

    public static class Builder {
        private final String name;
        private final String description;
        private final ToolExecutor executor;
        private JSONObject parameters;
        private boolean isWrite = false;
        private boolean needsConfirm = false;
        private boolean adminOnly = false;
        private com.DocSystem.agent.permission.ToolRisk riskClass = null;

        public Builder(String name, String description, ToolExecutor executor) {
            this.name = name;
            this.description = description;
            this.executor = executor;
        }

        public Builder parameters(JSONObject parameters) {
            this.parameters = parameters;
            return this;
        }

        public Builder isWrite(boolean isWrite) {
            this.isWrite = isWrite;
            return this;
        }

        public Builder needsConfirm(boolean needsConfirm) {
            this.needsConfirm = needsConfirm;
            return this;
        }

        public Builder adminOnly(boolean adminOnly) {
            this.adminOnly = adminOnly;
            return this;
        }

        /** 显式声明权限风险类别（P1；不声明则取集中目录登记值） */
        public Builder riskClass(com.DocSystem.agent.permission.ToolRisk riskClass) {
            this.riskClass = riskClass;
            return this;
        }

        public ToolDefinition build() {
            if (name == null || name.isEmpty()) {
                throw new IllegalArgumentException("Tool name must not be empty");
            }
            if (executor == null) {
                throw new IllegalArgumentException("Tool executor must not be null: " + name);
            }
            if (needsConfirm && !isWrite) {
                throw new IllegalArgumentException(
                        "needsConfirm=true requires isWrite=true (tool: " + name + ")");
            }
            return new ToolDefinition(this);
        }
    }

    @Override
    public String toString() {
        return "ToolDefinition{name=" + name + ", isWrite=" + isWrite
                + ", needsConfirm=" + needsConfirm + ", adminOnly=" + adminOnly
                + ", riskClass=" + riskClass + "}";
    }
}
