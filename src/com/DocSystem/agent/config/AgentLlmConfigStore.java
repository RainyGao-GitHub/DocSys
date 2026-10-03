package com.DocSystem.agent.config;

import com.alibaba.fastjson.JSON;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.entity.LLMConfig;
import com.DocSystem.common.entity.SystemLLMConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import util.LLMUtil;

/**
 * 系统级 LLM 模型配置存储（智能体设置 → AI接入设置）。
 *
 * <p><b>存储（权威源）</b>：{@code agent_config(scope='global', key='llm_models')}，值为 JSON 数组
 * （与同组「提示词管理」的 {@code system_prompt_*} 同表、同服务）。</p>
 *
 * <p><b>运行期镜像</b>：渲染成 DocSys 老格式串
 * （{@code url; name=..; modelName=..; apikey=..; <高级参数 kv> } 用 {@code || } 连接），
 * 交给 {@link BaseFunction#applyLLMConfigMirror(String)} 落 {@code docSys.ini} + classes 副本，
 * 并立即应用到内存 {@code BaseFunction.systemLLMConfig} —— 保存后无需重启即可生效。</p>
 *
 * <p><b>为什么渲染成老格式串</b>：{@code getAiModelList.do} / {@code AIChat.do} /
 * {@code /agent/models/list} / {@code LlmConfigSyncService} 全部依赖
 * {@code systemLLMConfig}（由 {@code LLMUtil.getSystemLLMConfig} 解析），
 * 渲染成同一格式即可让上述链路<b>零改动</b>。</p>
 *
 * <p><b>顺序语义</b>：数组顺序 = 优先级，<b>第 1 个「启用」的模型即默认模型</b>
 * （{@code LlmConfigSyncService} 取渲染后列表的第 0 条，语义与改造前一致）。</p>
 *
 * <p><b>首次迁移</b>：{@code agent_config} 里没有该键时，用当前生效的镜像串解析后<b>播种</b>落盘，
 * 管理员零操作即可在老配置上继续编辑。</p>
 */
@Component
public class AgentLlmConfigStore {

    private static final Logger log = LoggerFactory.getLogger(AgentLlmConfigStore.class);

    /** agent_config 里的键名（scope=global） */
    public static final String KEY_LLM_MODELS = "llm_models";

    /** 模型数量上限（防误操作把配置串撑爆） */
    public static final int MAX_MODELS = 20;

    /** 运行期配置串里由核心字段承载的键（其余 kv 视为高级参数透传） */
    private static final String KEY_NAME = "name";
    private static final String KEY_MODEL_NAME = "modelName";
    private static final String KEY_API_KEY = "apikey";

    @Autowired(required = false)
    private AgentConfigService agentConfigService;

    /** 供测试注入 */
    public void setAgentConfigService(AgentConfigService agentConfigService) {
        this.agentConfigService = agentConfigService;
    }

    // ==================== 数据模型 ====================

    /** 一个模型条目（字段与 Agent 侧 /agent/models/custom 的表单口径一致） */
    public static class LlmModel {
        private String id;
        /** 显示名（模型下拉里显示；留空时回落到 modelName） */
        private String name;
        /** 请求体里的 model 名 */
        private String modelName;
        /** 接口地址（Base URL，如 https://api.deepseek.com） */
        private String endpoint;
        /** API Key（明文存储，与改造前口径一致；接口回传时掩码） */
        private String apiKey;
        /** 停用后不进入运行期列表（后台仍可见） */
        private boolean enabled = true;
        /** 高级参数（temperature / maxTokens / 自定义 kv），原样进运行期配置串；未勾选「使用高级参数」时为空 */
        private Map<String, String> settings = new LinkedHashMap<String, String>();

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getModelName() { return modelName; }
        public void setModelName(String modelName) { this.modelName = modelName; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public Map<String, String> getSettings() { return settings; }
        public void setSettings(Map<String, String> settings) { this.settings = settings; }
    }

    // ==================== 读 ====================

    /**
     * 读模型列表（含停用项）。
     *
     * @return 列表；{@code agent_config} 无该键时用运行期镜像串播种（并落盘）；都没有 → 空列表
     */
    public List<LlmModel> load() {
        List<LlmModel> stored = readFromStore();
        if (stored != null) {
            return stored;
        }

        //首次使用：把当前生效的老格式串播种成结构化配置（管理员零操作迁移）
        List<LlmModel> seeded = fromLegacyString(BaseFunction.getLLMConfigString());
        if (!seeded.isEmpty()) {
            if (writeToStore(seeded)) {
                log.info("AgentLlmConfigStore 已从运行期配置串播种 {} 个模型到 agent_config", seeded.size());
            } else {
                log.warn("AgentLlmConfigStore 播种失败（本次仍返回解析结果，下次打开会重试）");
            }
        } else {
            log.info("AgentLlmConfigStore 首次加载：运行期未配置任何模型");
        }
        return seeded;
    }

    /** 读 store（原始值）。未配置 → null；已配置（含空数组）→ 对应列表 */
    private List<LlmModel> readFromStore() {
        if (agentConfigService == null) {
            log.warn("AgentLlmConfigStore: AgentConfigService 未注入，按未配置处理");
            return null;
        }
        String json = agentConfigService.getGlobal(KEY_LLM_MODELS);
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            List<LlmModel> list = JSON.parseArray(json, LlmModel.class);
            return list == null ? new ArrayList<LlmModel>() : list;
        } catch (Exception e) {
            log.warn("AgentLlmConfigStore 解析 agent_config.{} 失败（按未配置处理）: {}", KEY_LLM_MODELS, e.getMessage());
            return null;
        }
    }

    // ==================== 写 ====================

    /**
     * 保存：写 JSON（权威源）→ 渲染镜像串 → 落盘 + 立即生效。
     *
     * @return false = JSON 写入失败（调用方应报错，不要提示成功）
     */
    public boolean save(List<LlmModel> models) {
        List<LlmModel> list = normalize(models);
        if (!writeToStore(list)) {
            return false;
        }
        BaseFunction.applyLLMConfigMirror(toLegacyString(list));
        log.info("AgentLlmConfigStore 已保存 {} 个模型（启用 {} 个）",
                list.size(), countEnabled(list));
        return true;
    }

    /** 写 JSON 到 agent_config（失败只记日志并返回 false，绝不上抛） */
    private boolean writeToStore(List<LlmModel> models) {
        if (agentConfigService == null) {
            log.warn("AgentLlmConfigStore: AgentConfigService 未注入，无法写入");
            return false;
        }
        try {
            String json = JSON.toJSONString(models == null ? new ArrayList<LlmModel>() : models);
            boolean ok = agentConfigService.setGlobal(KEY_LLM_MODELS, json);
            if (!ok) {
                log.warn("AgentLlmConfigStore 写 agent_config.{} 返回失败", KEY_LLM_MODELS);
            }
            return ok;
        } catch (Exception e) {
            log.warn("AgentLlmConfigStore 写 agent_config.{} 异常: {}", KEY_LLM_MODELS, e.getMessage());
            return false;
        }
    }

    /**
     * 启动时（docSysInit 成功后）把 agent_config 里的模型列表覆盖到运行期。
     * 未配置 → 不动（保持 docSys.ini 的引导值，与改造前行为一致）。
     *
     * @return true = 已用 agent_config 覆盖
     */
    public boolean applyToRuntime() {
        List<LlmModel> stored = readFromStore();
        if (stored == null) {
            log.info("AgentLlmConfigStore: agent_config 未配置 {}，保持 docSys.ini 的引导值",
                    KEY_LLM_MODELS);
            return false;
        }
        BaseFunction.applyLLMConfigMirror(toLegacyString(stored));
        log.info("AgentLlmConfigStore 已用 agent_config.{} 覆盖运行期配置（{} 个模型，启用 {} 个）",
                KEY_LLM_MODELS, stored.size(), countEnabled(stored));
        return true;
    }

    // ==================== 老格式串互转 ====================

    /**
     * 渲染运行期配置串：只输出<b>启用</b>的模型，顺序即优先级。
     * 格式必须能被 {@code LLMUtil.parseLLMConfig()} 解析（第 1 段是地址，其后是 {@code k=v}）。
     */
    public String toLegacyString(List<LlmModel> models) {
        if (models == null || models.isEmpty()) {
            return "";
        }
        StringBuilder all = new StringBuilder();
        for (LlmModel m : models) {
            if (m == null || !m.isEnabled()) {
                continue;
            }
            String endpoint = trim(m.getEndpoint());
            if (endpoint.isEmpty()) {
                continue;
            }
            String modelName = trim(m.getModelName());
            String name = trim(m.getName());
            if (name.isEmpty()) {
                name = modelName;
            }

            StringBuilder seg = new StringBuilder(sanitize(endpoint));
            seg.append("; ").append(KEY_NAME).append("=").append(sanitize(name));
            seg.append("; ").append(KEY_MODEL_NAME).append("=").append(sanitize(modelName));
            String apiKey = trim(m.getApiKey());
            if (!apiKey.isEmpty()) {
                seg.append("; ").append(KEY_API_KEY).append("=").append(sanitize(apiKey));
            }
            Map<String, String> settings = m.getSettings();
            if (settings != null) {
                for (Map.Entry<String, String> e : settings.entrySet()) {
                    String k = trim(e.getKey());
                    String v = trim(e.getValue());
                    if (k.isEmpty() || v.isEmpty() || isCoreKey(k)) {
                        continue;   //核心键已单独输出，避免重复
                    }
                    seg.append("; ").append(sanitize(k)).append("=").append(sanitize(v));
                }
            }
            if (all.length() > 0) {
                all.append(" || ");
            }
            all.append(seg);
        }
        return all.toString();
    }

    /** 从老格式串解析（播种用）：url / name / modelName / apikey + 其余 kv → settings */
    public List<LlmModel> fromLegacyString(String legacy) {
        List<LlmModel> list = new ArrayList<LlmModel>();
        if (legacy == null || legacy.trim().isEmpty()) {
            return list;
        }
        try {
            SystemLLMConfig cfg = LLMUtil.getSystemLLMConfig(legacy);
            if (cfg == null || cfg.llmConfigList == null) {
                return list;
            }
            int index = 0;
            for (LLMConfig c : cfg.llmConfigList) {
                if (c == null) {
                    continue;
                }
                LlmModel m = new LlmModel();
                m.setId("seed" + (++index));
                m.setName(c.name);
                m.setModelName(c.modelName);
                m.setEndpoint(c.url);
                m.setApiKey(c.apikey);
                m.setEnabled(true);
                LinkedHashMap<String, String> extra = new LinkedHashMap<String, String>();
                if (c.settings != null) {
                    for (String k : new LinkedHashSet<String>(c.settings.keySet())) {
                        if (k == null || isCoreKey(k)) {
                            continue;
                        }
                        extra.put(k, c.settings.getString(k));
                    }
                }
                m.setSettings(extra);
                list.add(m);
            }
        } catch (Exception e) {
            log.warn("AgentLlmConfigStore 解析运行期配置串失败: {}", e.getMessage());
        }
        return list;
    }

    // ==================== 校验 / 整理 ====================

    /**
     * 保存前校验。
     *
     * @return null = 通过；否则为可直接展示给管理员的错误文案
     */
    public String validate(List<LlmModel> models) {
        if (models == null || models.isEmpty()) {
            return null;    //允许清空（= 关闭 AI 模型列表）
        }
        if (models.size() > MAX_MODELS) {
            return "最多支持 " + MAX_MODELS + " 个模型";
        }
        Set<String> names = new LinkedHashSet<String>();
        for (int i = 0; i < models.size(); i++) {
            LlmModel m = models.get(i);
            String no = "第 " + (i + 1) + " 个模型";
            if (m == null) {
                return no + "为空";
            }
            String name = trim(m.getName());
            String modelName = trim(m.getModelName());
            String endpoint = trim(m.getEndpoint());
            String apiKey = trim(m.getApiKey());

            if (name.isEmpty()) {
                return no + "：模型名称不能为空";
            }
            if (modelName.isEmpty()) {
                return no + "：模型标识(modelName)不能为空";
            }
            if (endpoint.isEmpty()) {
                return no + "：接口地址不能为空";
            }
            if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
                return no + "：接口地址需以 http:// 或 https:// 开头";
            }
            if (hasSeparator(name) || hasSeparator(modelName) || hasSeparator(endpoint) || hasSeparator(apiKey)) {
                return no + "：不能包含 ; 或 |（运行期配置串的分隔符）";
            }
            if (!names.add(name)) {
                return no + "：模型名称 [" + name + "] 与前面的模型重复";
            }
            Map<String, String> settings = m.getSettings();
            if (settings != null) {
                for (Map.Entry<String, String> e : settings.entrySet()) {
                    String k = trim(e.getKey());
                    String v = trim(e.getValue());
                    if (k.isEmpty() && v.isEmpty()) {
                        continue;
                    }
                    if (k.isEmpty()) {
                        return no + "：高级参数的键不能为空";
                    }
                    if (hasSeparator(k) || hasSeparator(v) || k.indexOf('=') >= 0) {
                        return no + "：高级参数 [" + k + "] 不能包含 ; | 或 =";
                    }
                }
            }
        }
        return null;
    }

    /** 规范化：补 id、去首尾空格、settings 去空项 */
    public List<LlmModel> normalize(List<LlmModel> models) {
        List<LlmModel> list = new ArrayList<LlmModel>();
        if (models == null) {
            return list;
        }
        int index = 0;
        for (LlmModel m : models) {
            if (m == null) {
                continue;
            }
            LlmModel one = new LlmModel();
            String id = trim(m.getId());
            one.setId(id.isEmpty() ? ("m" + System.currentTimeMillis() + "_" + (++index)) : id);
            one.setName(trim(m.getName()));
            one.setModelName(trim(m.getModelName()));
            one.setEndpoint(trim(m.getEndpoint()));
            one.setApiKey(trim(m.getApiKey()));
            one.setEnabled(m.isEnabled());
            LinkedHashMap<String, String> settings = new LinkedHashMap<String, String>();
            if (m.getSettings() != null) {
                for (Map.Entry<String, String> e : m.getSettings().entrySet()) {
                    String k = trim(e.getKey());
                    String v = trim(e.getValue());
                    if (k.isEmpty() || v.isEmpty()) {
                        continue;
                    }
                    settings.put(k, v);
                }
            }
            one.setSettings(settings);
            list.add(one);
        }
        return list;
    }

    /** API Key 掩码（当前接口直接回明文，保留此工具便于以后需要掩码时切换） */
    public static String maskApiKey(String apiKey) {
        String key = trim(apiKey);
        if (key.isEmpty()) {
            return "";
        }
        int len = key.length();
        if (len <= 8) {
            return "******";
        }
        return key.substring(0, 4) + "****" + key.substring(len - 4);
    }

    // ==================== 内部工具 ====================

    private static int countEnabled(List<LlmModel> models) {
        int count = 0;
        if (models != null) {
            for (LlmModel m : models) {
                if (m != null && m.isEnabled()) {
                    count++;
                }
            }
        }
        return count;
    }

    private static boolean isCoreKey(String key) {
        return KEY_NAME.equals(key) || KEY_MODEL_NAME.equals(key) || KEY_API_KEY.equals(key);
    }

    private static boolean hasSeparator(String value) {
        return value != null && (value.indexOf(';') >= 0 || value.indexOf('|') >= 0);
    }

    /** 老格式串是「;」与「||」分隔的，落盘前把分隔符去掉（正常输入已被 validate 拦下） */
    private static String sanitize(String value) {
        if (value == null) {
            return "";
        }
        String out = value.replace(";", "").replace("|", "");
        return out.trim();
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
