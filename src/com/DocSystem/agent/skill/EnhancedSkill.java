package com.DocSystem.agent.skill;

import java.io.Serializable;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EnhancedSkill - Full skill definition aligned with agentskills.io
 */
public class EnhancedSkill implements Serializable {
    
    private String id;
    private String name;
    private String description;
    private String category;
    private String version;
    private String author;
    
    // Triggers - what prompts should activate this skill
    private List<String> triggers;
    
    // Commands - CLI command templates
    private List<SkillCommand> commands;
    
    // Parameters
    private Map<String, SkillParameter> parameters;
    
    // Permissions required
    private List<String> permissions;

    /**
     * 权限风险声明（P1）：{@code SKILL.md} frontmatter 的 {@code risk:} ——
     * safe / write / dangerous / absolute。未声明（null）→ 按 fail-safe 当绝对保护处理。
     */
    private String risk;
    
    // Execution instructions
    private String executionFlow;
    
    // Examples
    private List<String> examples;
    
    // Metadata
    private Map<String, Object> metadata;
    
    // Matching score cache
    private transient Map<String, Double> matchCache;
    
    public EnhancedSkill() {
        this.triggers = new ArrayList<>();
        this.commands = new ArrayList<>();
        this.parameters = new ConcurrentHashMap<>();
        this.permissions = new ArrayList<>();
        this.examples = new ArrayList<>();
        this.metadata = new ConcurrentHashMap<>();
    }
    
    // ========== Matching ==========
    
    /**
     * Check if query matches this skill
     */
    public boolean matches(String query) {
        if (query == null) return false;
        query = query.toLowerCase();
        
        // Check triggers
        for (String trigger : triggers) {
            if (query.contains(trigger.toLowerCase())) {
                return true;
            }
        }
        
        // Check command patterns
        for (SkillCommand cmd : commands) {
            if (cmd.matches(query)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get match score for query
     */
    public double getMatchScore(String query) {
        if (matchCache != null && matchCache.containsKey(query)) {
            return matchCache.get(query);
        }
        
        if (query == null) return 0.0;
        query = query.toLowerCase();
        
        double score = 0.0;
        
        // Exact trigger match (highest score)
        for (String trigger : triggers) {
            if (query.equals(trigger.toLowerCase())) {
                score = Math.max(score, 1.0);
            } else if (query.startsWith(trigger.toLowerCase())) {
                score = Math.max(score, 0.8);
            } else if (query.contains(trigger.toLowerCase())) {
                score = Math.max(score, 0.6);
            }
        }
        
        // Command pattern match
        for (SkillCommand cmd : commands) {
            if (cmd.matches(query)) {
                score = Math.max(score, 0.7);
            }
        }
        
        // Category match in query
        if (query.contains(category != null ? category.toLowerCase() : "")) {
            score = Math.max(score, 0.3);
        }
        
        if (matchCache == null) {
            matchCache = new ConcurrentHashMap<>();
        }
        matchCache.put(query, score);
        
        return score;
    }
    
    // ========== Getters and Setters ==========
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    
    public List<String> getTriggers() { return triggers; }
    public void addTrigger(String trigger) { this.triggers.add(trigger); }
    
    public List<SkillCommand> getCommands() { return commands; }
    public void addCommand(SkillCommand command) { this.commands.add(command); }
    
    public Map<String, SkillParameter> getParameters() { return parameters; }
    public void addParameter(String name, String description, boolean required) {
        this.parameters.put(name, new SkillParameter(name, description, required));
    }
    
    public List<String> getPermissions() { return permissions; }
    public void addPermission(String permission) { this.permissions.add(permission); }
    
    public String getExecutionFlow() { return executionFlow; }
    public void setExecutionFlow(String executionFlow) { this.executionFlow = executionFlow; }
    
    public List<String> getExamples() { return examples; }
    public void addExample(String example) { this.examples.add(example); }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    /** 权限风险声明（P1，SKILL.md frontmatter 的 risk:）：safe/write/dangerous/absolute；null = 未声明 */
    public String getRisk() { return risk; }
    public void setRisk(String risk) { this.risk = risk; }
    
    /**
     * Get skill as SKILL.md format
     */
    public String toSkillMarkdown() {
        StringBuilder sb = new StringBuilder();
        
        // YAML Frontmatter
        sb.append("---\n");
        sb.append("name: ").append(id).append("\n");
        sb.append("description: ").append(description).append("\n");
        sb.append("category: ").append(category).append("\n");
        if (version != null) sb.append("version: ").append(version).append("\n");
        if (author != null) sb.append("author: ").append(author).append("\n");
        if (!permissions.isEmpty()) {
            sb.append("permissions:\n");
            for (String p : permissions) {
                sb.append("  - ").append(p).append("\n");
            }
        }
        sb.append("---\n\n");
        
        // Name
        sb.append("# ").append(name).append("\n\n");
        
        // Description
        sb.append(description).append("\n\n");
        
        // Triggers
        if (!triggers.isEmpty()) {
            sb.append("## Triggers\n\n");
            for (String t : triggers) {
                sb.append("- ").append(t).append("\n");
            }
            sb.append("\n");
        }
        
        // Commands
        if (!commands.isEmpty()) {
            sb.append("## Commands\n\n");
            for (SkillCommand cmd : commands) {
                sb.append("### ").append(cmd.getPattern()).append("\n");
                sb.append("CLI: `").append(cmd.getCliCommand()).append("`\n\n");
                if (cmd.getDescription() != null) {
                    sb.append(cmd.getDescription()).append("\n\n");
                }
            }
        }
        
        // Execution Flow
        if (executionFlow != null) {
            sb.append("## Execution Flow\n\n").append(executionFlow).append("\n\n");
        }
        
        // Examples
        if (!examples.isEmpty()) {
            sb.append("## Examples\n\n");
            for (String ex : examples) {
                sb.append("```\n").append(ex).append("\n```\n");
            }
        }
        
        return sb.toString();
    }
}
