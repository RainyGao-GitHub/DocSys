package com.DocSystem.agent.tool;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 工具注册表 —— 管理所有可被 LLM 调用的 {@link ToolDefinition}。
 *
 * <p>线程安全（内部 {@link ConcurrentHashMap}，工具定义不可变），单例即可被多请求并发读取。
 * 执行时按需创建 per-request 工具集（{@link #forUser(boolean)} 按管理员过滤）。</p>
 *
 * <p>对应开发计划 T1.3。</p>
 */
public class ToolRegistry {

    private static final Logger log = LoggerFactory.getLogger(ToolRegistry.class);

    /** 工具名 → 定义（有序 LinkedHashMap 保证提示词渲染顺序稳定） */
    private final Map<String, ToolDefinition> tools = new LinkedHashMap<>();

    /** 写操作确认门（needsConfirm 工具执行前调用；默认放行） */
    private volatile WriteConfirmGate confirmGate = WriteConfirmGate.NOOP;

    /** 执行监听器（每次工具执行后调用；用于审计/指标，默认 no-op） */
    private volatile ToolExecutionListener executionListener = (tool, args, result, durationMs) -> {};

    /**
     * 工具执行监听器 —— 每次 execute() 完成后回调（T4.2 审计 / T4.3 指标）。
     */
    @FunctionalInterface
    public interface ToolExecutionListener {
        /**
         * @param tool        工具定义
         * @param args        实际参数
         * @param result      执行结果（成功/失败）
         * @param durationMs  耗时
         */
        void onExecuted(ToolDefinition tool, JSONObject args, ToolResult result, long durationMs);
    }

    /** 全局默认实例（可在 Spring 装配时替换为按需构造） */
    private static final ToolRegistry INSTANCE = new ToolRegistry();

    public static ToolRegistry getInstance() {
        return INSTANCE;
    }

    /** 注册工具（同名覆盖，返回旧定义或 null） */
    public synchronized ToolDefinition register(ToolDefinition tool) {
        if (tool == null) {
            throw new IllegalArgumentException("ToolDefinition must not be null");
        }
        if (tools.containsKey(tool.name)) {
            log.warn("Overriding existing tool: {}", tool.name);
        }
        return tools.put(tool.name, tool);
    }

    /** 批量注册 */
    public synchronized void registerAll(Collection<ToolDefinition> defs) {
        for (ToolDefinition t : defs) {
            register(t);
        }
    }

    /** 按名查找（不区分调用者，返回定义本身） */
    public ToolDefinition find(String name) {
        return tools.get(name);
    }

    /** 全部工具（稳定顺序） */
    public List<ToolDefinition> list() {
        return new ArrayList<>(tools.values());
    }

    /** 全部工具名 */
    public List<String> names() {
        return new ArrayList<>(tools.keySet());
    }

    /**
     * 按可见性过滤后的工具列表。
     *
     * @param isAdmin 是否为管理员（决定 adminOnly 工具是否可见）
     */
    public List<ToolDefinition> listForUser(boolean isAdmin) {
        return listForUser(isAdmin, false);
    }

    /**
     * 按角色过滤后的工具列表（T3.5 可见性白名单）。
     *
     * @param isAdmin   是否为管理员（adminOnly 工具过滤）
     * @param readOnly  是否只读角色（true 时隐藏全部写工具）
     */
    public List<ToolDefinition> listForUser(boolean isAdmin, boolean readOnly) {
        List<ToolDefinition> result = new ArrayList<>();
        for (ToolDefinition t : tools.values()) {
            if (t.adminOnly && !isAdmin) {
                continue;
            }
            if (readOnly && t.isWrite) {
                continue;
            }
            result.add(t);
        }
        return result;
    }

    /** 设置写操作确认门（null → 重置为放行） */
    public void setConfirmGate(WriteConfirmGate gate) {
        this.confirmGate = gate != null ? gate : WriteConfirmGate.NOOP;
    }

    /** 当前确认门（测试/诊断用） */
    public WriteConfirmGate getConfirmGate() {
        return confirmGate;
    }

    /** 设置执行监听器（null → 重置为 no-op） */
    public void setExecutionListener(ToolExecutionListener listener) {
        this.executionListener = listener != null ? listener : (tool, args, result, durationMs) -> {};
    }

    /** 当前执行监听器（测试/诊断用） */
    public ToolExecutionListener getExecutionListener() {
        return executionListener;
    }

    /**
     * 执行工具（核心入口）。
     *
     * @param name  工具名
     * @param args  JSON 参数（可为 null → 空对象）
     * @param isAdmin 当前用户是否管理员（adminOnly 校验）
     * @return 执行结果；未知工具/参数错误/执行异常均返回 {@link ToolResult#error}
     */
    public ToolResult execute(String name, JSONObject args, boolean isAdmin) {
        ToolDefinition def = tools.get(name);
        if (def == null) {
            return ToolResult.error("Unknown tool: " + name + " (available: " + names() + ")");
        }
        if (def.adminOnly && !isAdmin) {
            return ToolResult.error("Tool '" + name + "' requires admin privileges");
        }

        JSONObject resolvedArgs = args != null ? args : new JSONObject();

        // 参数 Schema 校验（仅做基础类型检查，缺失必填项报错）
        String validationError = validateParams(def, resolvedArgs);
        if (validationError != null) {
            return ToolResult.error("Invalid arguments for tool '" + name + "': " + validationError);
        }

        // 写操作确认门（needsConfirm 工具执行前需用户批准）
        if (def.needsConfirm) {
            try {
                if (!confirmGate.confirm(def.name, resolvedArgs)) {
                    log.warn("Tool '{}' rejected by user confirm gate", name);
                    return ToolResult.error("操作被用户拒绝");
                }
            } catch (Exception e) {
                log.error("Tool '{}' confirm gate threw exception", name, e);
                return ToolResult.error("确认流程异常: " + e.getMessage());
            }
        }

        try {
            long start = System.currentTimeMillis();
            ToolResult result = def.executor.execute(resolvedArgs);
            long cost = System.currentTimeMillis() - start;
            if (!result.success) {
                log.warn("Tool '{}' failed in {}ms: {}", name, cost, result.error);
            } else {
                log.info("Tool '{}' executed in {}ms (write={}, confirm={})",
                        name, cost, def.isWrite, def.needsConfirm);
            }
            try {
                executionListener.onExecuted(def, resolvedArgs, result, cost);
            } catch (Exception le) {
                log.warn("Tool execution listener failed for '{}'", name, le);
            }
            return result;
        } catch (Exception e) {
            log.error("Tool '{}' threw exception", name, e);
            ToolResult err = ToolResult.error("Tool '" + name + "' failed: " + e.getMessage());
            try {
                executionListener.onExecuted(def, resolvedArgs, err, -1L);
            } catch (Exception le) {
                log.warn("Tool execution listener failed for '{}'", name, le);
            }
            return err;
        }
    }

    /** 便捷重载：非管理员 */
    public ToolResult execute(String name, JSONObject args) {
        return execute(name, args, false);
    }

    /**
     * 校验参数是否符合 ToolDefinition.parameters（JSON Schema 子集）。
     * 当前只校验 required 必填项是否缺失，类型不严格校验（交由 executor/底层 API）。
     */
    private String validateParams(ToolDefinition def, JSONObject args) {
        JSONObject schema = def.parameters;
        if (schema == null) {
            return null;
        }
        Object requiredObj = schema.get("required");
        Iterable<?> required = null;
        if (requiredObj instanceof Iterable) {
            // JSONArray/String[]/List 都实现 Iterable —— 不再只认 List，避免调用方
            // 塞了 String[] 就静默丢掉全部必填校验（2026-09-20 体检发现）
            required = (Iterable<?>) requiredObj;
        } else if (requiredObj instanceof Object[]) {
            required = java.util.Arrays.asList((Object[]) requiredObj);
        }
        if (required != null) {
            for (Object o : required) {
                String field = String.valueOf(o);
                if (!args.containsKey(field) || args.get(field) == null) {
                    return "missing required parameter '" + field + "'"
                            + "（参数确实为空时请显式传空串 \"\"；若不需要该参数请换用其他工具）";
                }
            }
        }
        return null;
    }

    /** 清空（测试用） */
    public synchronized void clear() {
        tools.clear();
    }

    /** 工具总数 */
    public int size() {
        return tools.size();
    }

    /**
     * 构造一个只有只读工具的 registry 副本的便捷方法（供测试/独立场景）。
     * @deprecated 测试直接 new ToolRegistry() 更简单
     */
    @Deprecated
    public ToolRegistry readOnlyCopy() {
        ToolRegistry copy = new ToolRegistry();
        for (ToolDefinition t : tools.values()) {
            if (!t.isWrite) {
                copy.register(t);
            }
        }
        return copy;
    }

    /** 测试辅助：构造参数 JSON */
    public static JSONObject args(String json) {
        return JSON.parseObject(json);
    }
}
