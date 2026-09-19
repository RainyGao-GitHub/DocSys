package com.DocSystem.agent.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.*;

/**
 * EnhancedSkillManager - Skills aligned with agentskills.io standard
 * 
 * SKILL.md Format:
 * ---
 * name: skill-id
 * description: What this skill does
 * category: repository|document|search|ai|system|user
 * permissions:
 *   - read:repository
 *   - write:document
 * version: 1.0.0
 * author: DocSys Team
 * ---
 * 
 * # Skill Name
 * 
 * Detailed description of what this skill does.
 * 
 * ## Triggers
 * - User queries that should trigger this skill
 * 
 * ## Commands
 * CLI command templates
 * 
 * ## Parameters
 * Required and optional parameters
 * 
 * ## Examples
 * Usage examples
 * 
 * ## Execution Flow
 * How this skill executes
 */
@Deprecated
public class EnhancedSkillManager {
    
    private static final Logger log = LoggerFactory.getLogger(EnhancedSkillManager.class);
    private static EnhancedSkillManager instance;
    
    private final Map<String, EnhancedSkill> skills;
    // 技能目录：默认按 user.dir 回退；DocSys 就绪后由 AgentInitService 调用
    // setSkillsDirectory() 指向配置目录再 reload。userSkillsDirectory 为进化产物目录(<配置>/data/skills)。
    private Path skillsDirectory;
    private Path userSkillsDirectory;

    private EnhancedSkillManager() {
        this.skills = new ConcurrentHashMap<>();

        // 初始默认值：DocSys 就绪前的回退。就绪后会被 setSkillsDirectory 覆盖。
        String userDir = System.getProperty("user.dir", ".");
        this.skillsDirectory = Paths.get(userDir, "skills");
        this.userSkillsDirectory = Paths.get(userDir, "data", "skills");

        // Create directories
        try {
            Files.createDirectories(skillsDirectory);
            Files.createDirectories(userSkillsDirectory);
        } catch (IOException e) {
            log.error("Failed to create skills directories", e);
        }

        // Load skills
        loadBuiltInSkills();
        loadSkillsFromDirectory(skillsDirectory);
        loadSkillsFromDirectory(userSkillsDirectory);
    }

    /**
     * 设置技能目录并重新加载。由 AgentInitService 在 DocSys 就绪后调用。
     * skillsDirectory 指向配置的技能目录；userSkillsDirectory 为其下 data/skills(进化产物)。
     */
    public synchronized void setSkillsDirectory(String dir) {
        this.skillsDirectory = Paths.get(dir);
        this.userSkillsDirectory = Paths.get(dir, "data", "skills");
        try {
            Files.createDirectories(skillsDirectory);
            Files.createDirectories(userSkillsDirectory);
        } catch (IOException e) {
            log.error("Failed to create skills directories", e);
        }
        reloadSkills();
    }
    
    public static synchronized EnhancedSkillManager getInstance() {
        if (instance == null) {
            instance = new EnhancedSkillManager();
        }
        return instance;
    }
    
    /**
     * Load built-in skills
     */
    private void loadBuiltInSkills() {
        // Register built-in skills with full definitions
        // DocSys 自有能力已全部下线（改由工具承担）；此处不再注册任何内置技能
        
        log.info("Loaded {} built-in enhanced skills", skills.size());
    }
    
    /**
     * Load skills from directory
     */
    private void loadSkillsFromDirectory(Path dir) {
        if (!Files.exists(dir)) {
            return;
        }
        
        try {
            Files.walk(dir)
                .filter(Files::isDirectory)
                .forEach(skillDir -> {
                    Path skillMd = skillDir.resolve("SKILL.md");
                    if (Files.exists(skillMd)) {
                        try {
                            String content = new String(Files.readAllBytes(skillMd), StandardCharsets.UTF_8);
                            EnhancedSkill skill = SkillParser.parse(content, skillDir.getFileName().toString());
                            registerSkill(skill);
                            log.info("Loaded skill from {}", skillMd);
                        } catch (Exception e) {
                            log.error("Failed to load skill from {}", skillMd, e);
                        }
                    }
                });
        } catch (IOException e) {
            log.error("Failed to walk skills directory", e);
        }
    }
    
    /**
     * Register a skill
     */
    public void registerSkill(EnhancedSkill skill) {
        if (skill != null && skill.getId() != null) {
            skills.put(skill.getId(), skill);
            log.debug("Registered skill: {}", skill.getId());
        }
    }
    
    /**
     * Get skill by ID
     */
    public EnhancedSkill getSkill(String skillId) {
        return skills.get(skillId);
    }
    
    /**
     * Find skills matching query
     */
    public List<EnhancedSkill> findSkills(String query) {
        query = query.toLowerCase();
        List<EnhancedSkill> matching = new ArrayList<>();
        
        for (EnhancedSkill skill : skills.values()) {
            if (skill.matches(query)) {
                matching.add(skill);
            }
        }
        
        return matching;
    }
    
    /**
     * Find best skill for query
     */
    public EnhancedSkill findBestSkill(String query) {
        List<EnhancedSkill> matches = findSkills(query);
        
        if (matches.isEmpty()) {
            return null;
        }
        
        // Return best match (highest score)
        return matches.stream()
            .max(Comparator.comparingDouble(s -> s.getMatchScore(query)))
            .orElse(null);
    }
    
    /**
     * Reload skills
     */
    public synchronized void reloadSkills() {
        log.info("Reloading skills...");
        skills.clear();
        loadBuiltInSkills();
        loadSkillsFromDirectory(skillsDirectory);
        loadSkillsFromDirectory(userSkillsDirectory);
        log.info("Total skills loaded: {}", skills.size());
    }
    
    /**
     * Get all skills
     */
    public Collection<EnhancedSkill> getAllSkills() {
        return Collections.unmodifiableCollection(skills.values());
    }
    
}
