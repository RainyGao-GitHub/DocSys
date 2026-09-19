package com.DocSystem.agent.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SkillManager - manages skills following agentskills.io standard
 * 
 * Skills are loaded from:
 * - Built-in skills (always available)
 * - External skills directory (configurable via docsys.skills.dir)
 * - classpath:/skills/ directory
 * 
 * Each skill has:
 * - skill.md - skill definition
 * - agent.md - agent behavior definition  
 * - .permissions - permission requirements
 */
public class SkillManager {
    
    private static final Logger log = LoggerFactory.getLogger(SkillManager.class);
    private static SkillManager instance;
    
    private final Map<String, Skill> skills;
    // 技能目录：默认按 user.dir 回退；DocSys 启动后由 AgentInitService 调用
    // setSkillsDirectory() 指向配置的技能目录(Path.getAgentSkillStorePath)再 reload。
    private String skillsDirectory;
    private boolean externalSkillsLoaded = false;

    private SkillManager() {
        this.skills = new ConcurrentHashMap<>();
        // 初始默认值：DocSys 就绪前的回退。就绪后会被 setSkillsDirectory 覆盖。
        String userDir = System.getProperty("user.dir");
        this.skillsDirectory = System.getProperty("docsys.skills.dir",
            userDir + "/skills");
        loadBuiltInSkills();
        // Try to load external skills
        loadExternalSkills();
    }

    /**
     * 设置技能目录并重新加载。由 AgentInitService 在 DocSys 就绪、默认技能拷贝完成后调用，
     * 传入 Path.getAgentSkillStorePath 解析出的配置目录，使技能加载脱离 user.dir 隐式依赖。
     */
    public synchronized void setSkillsDirectory(String dir) {
        this.skillsDirectory = dir;
        reloadSkills();
    }
    
    public static synchronized SkillManager getInstance() {
        if (instance == null) {
            instance = new SkillManager();
        }
        return instance;
    }
    
    /**
     * Load built-in skills (always available)
     */
    private void loadBuiltInSkills() {
        // ========== Repository Skills ==========
        registerSkill(new Skill("create_repos", "Create Repository",
            "Create a new repository with name, description, path. Aliases: create repo, 创建仓库, 新建仓库",
            "repository", "write"));
        registerSkill(new Skill("delete_repos", "Delete Repository",
            "Delete an existing repository by ID. Aliases: delete repo, 删除仓库",
            "repository", "write"));
        registerSkill(new Skill("backup_repos", "Backup Repository",
            "Backup a repository to specified path. Aliases: backup, 备份仓库",
            "repository", "admin"));
            
        // ========== Document Skills ==========
        registerSkill(new Skill("add_doc", "Add Document",
            "Add a new document to repository. Aliases: add doc, 上传文档, 添加文档",
            "document", "write"));
        registerSkill(new Skill("delete_doc", "Delete Document",
            "Delete a document by ID. Aliases: delete doc, 删除文档",
            "document", "write"));
        registerSkill(new Skill("rename_doc", "Rename Document",
            "Rename a document. Aliases: rename doc, 重命名文档",
            "document", "write"));
        registerSkill(new Skill("move_doc", "Move Document",
            "Move a document to another folder. Aliases: move doc, 移动文档",
            "document", "write"));
        registerSkill(new Skill("copy_doc", "Copy Document",
            "Copy a document. Aliases: copy doc, 复制文档",
            "document", "write"));
        // ========== System Skills ==========
        registerSkill(new Skill("system_help", "Help",
            "Show available commands and help. Aliases: help, 帮助, ?",
            "system", "read"));

        // ========== Web Automation Skills ==========
        registerSkill(new Skill("playwright", "Playwright Browser Automation",
            "Open URLs, take screenshots, interact with web pages using Playwright. " +
            "Aliases: playwright, 浏览器, 打开网页, 截图. " +
            "Usage: playwright open <url>, playwright screenshot <url>, playwright search <query>",
            "web", "read"));
        registerSkill(new Skill("web_search", "Web Search",
            "Search the web when local documents don't have results. " +
            "Uses Playwright to open search engines. " +
            "Aliases: web-search, 网络搜索, 网上搜索, 百度搜索. " +
            "Usage: web-search <query>, 百度 <topic>",
            "web", "read"));
        registerSkill(new Skill("browser_use", "Browser Use AI",
            "AI-powered web browsing using browser-use.com API. " +
            "Aliases: browser-use, ai-browse, 智能浏览. " +
            "Usage: browse <task>, ai-browse <what to find>",
            "web", "read"));

        log.info("Loaded {} built-in skills", skills.size());
    }
    
    /**
     * Load external skills from configured directory
     * Supports dynamic loading at runtime
     */
    private void loadExternalSkills() {
        if (externalSkillsLoaded) {
            return;
        }
        
        try {
            // 单一真源：只从配置的技能目录加载(user.dir 回退或 AgentInitService 注入的配置目录)。
            // 已移除历史的 ../DocSysAgent/skills 等硬编码候选路径。
            if (skillsDirectory != null && Files.exists(Paths.get(skillsDirectory))) {
                loadSkillsFromDirectory(skillsDirectory);
                log.info("Loaded external skills from: {}", skillsDirectory);
            } else {
                log.info("Skills directory not present yet: {}", skillsDirectory);
            }

            externalSkillsLoaded = true;
        } catch (Exception e) {
            log.warn("Failed to load external skills: {}", e.getMessage());
        }
    }
    
    /**
     * Load skills from classpath
     */
    private void loadSkillsFromClasspath() {
        try {
            URL url = getClass().getClassLoader().getResource("skills");
            if (url != null) {
                Path classpathSkills = Paths.get(url.toURI());
                if (Files.exists(classpathSkills)) {
                    loadSkillsFromDirectory(classpathSkills.toString());
                    log.info("Loaded skills from classpath: {}", classpathSkills);
                }
            }
        } catch (Exception e) {
            log.debug("No classpath skills found: {}", e.getMessage());
        }
    }
    
    /**
     * Reload all skills (useful for dynamic skill updates)
     */
    public synchronized void reloadSkills() {
        log.info("Reloading all skills...");
        skills.clear();
        externalSkillsLoaded = false;
        loadBuiltInSkills();
        loadExternalSkills();
        log.info("Total skills loaded: {}", skills.size());
    }
    
    /**
     * Register a skill
     */
    public void registerSkill(Skill skill) {
        skills.put(skill.getId(), skill);
        log.debug("Registered skill: {}", skill.getId());
    }
    
    /**
     * Get skill by ID
     */
    public Skill getSkill(String skillId) {
        return skills.get(skillId);
    }
    
    /**
     * Get all skills
     */
    public Collection<Skill> getAllSkills() {
        return skills.values();
    }
    
    /**
     * Find skills matching query
     */
    public List<Skill> findSkills(String query) {
        query = query.toLowerCase();
        List<Skill> matching = new ArrayList<>();
        
        for (Skill skill : skills.values()) {
            if (skill.getId().toLowerCase().contains(query) ||
                skill.getName().toLowerCase().contains(query) ||
                skill.getDescription().toLowerCase().contains(query)) {
                matching.add(skill);
            }
        }
        
        return matching;
    }
    
    /**
     * Load skills from external directory
     */
    public void loadSkillsFromDirectory(String directory) throws Exception {
        Path dirPath = Paths.get(directory);
        if (!Files.exists(dirPath)) {
            log.warn("Skills directory does not exist: {}", directory);
            return;
        }
        
        Files.walk(dirPath)
            .filter(Files::isDirectory)
            .forEach(dir -> {
                Path skillMd = dir.resolve("skill.md");
                if (Files.exists(skillMd)) {
                    try {
                        String content = new String(Files.readAllBytes(skillMd), StandardCharsets.UTF_8);
                        Skill skill = parseSkillFile(content, dir.getFileName().toString());
                        registerSkill(skill);
                        log.info("Loaded skill from {}", skillMd);
                    } catch (Exception e) {
                        log.error("Failed to load skill from {}", skillMd, e);
                    }
                }
            });
    }
    
    /**
     * Parse skill.md file - supports agentskills.io YAML frontmatter format
     */
    private Skill parseSkillFile(String content, String skillId) {
        String name = skillId;
        String description = "";
        String category = "general";
        String permission = "read";

        String[] lines = content.split("\n");
        boolean inFrontmatter = false;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();

            // YAML frontmatter markers
            if (line.equals("---")) {
                if (!inFrontmatter) {
                    inFrontmatter = true;  // Start of frontmatter
                } else {
                    break; // End of frontmatter
                }
                continue;
            }

            if (inFrontmatter) {
                // Parse YAML key: value
                int colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    String key = line.substring(0, colonIdx).trim();
                    String value = line.substring(colonIdx + 1).trim();
                    if (key.equals("name")) name = value;
                    else if (key.equals("description")) description = value;
                    else if (key.equals("category")) category = value;
                    else if (key.equals("permissions")) {
                        // permissions may be multiline YAML list
                        permission = parsePermissionsValue(lines, i);
                    }
                }
            } else {
                // Markdown body: first # heading is the name
                if (line.startsWith("# ") && name.equals(skillId)) {
                    name = line.substring(2).trim();
                }
            }
        }

        return new Skill(skillId, name, description, category, permission);
    }

    private String parsePermissionsValue(String[] lines, int startIdx) {
        StringBuilder sb = new StringBuilder();
        for (int i = startIdx + 1; i < lines.length; i++) {
            String line = lines[i];
            if (line.trim().startsWith("-")) {
                sb.append(line.trim().substring(1).trim());
                if (sb.length() > 0) break;
            } else if (line.trim().isEmpty()) {
                continue;
            } else {
                break;
            }
        }
        return sb.length() > 0 ? sb.toString() : "read";
    }
}
