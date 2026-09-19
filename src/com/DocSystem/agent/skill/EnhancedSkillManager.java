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
        registerSkill(createListReposSkill());
        registerSkill(createCreateReposSkill());
        registerSkill(createDeleteReposSkill());
        registerSkill(createListDocsSkill());
        registerSkill(createSearchDocSkill());
        registerSkill(createUploadDocSkill());
        registerSkill(createDownloadDocSkill());
        registerSkill(createWhoamiSkill());
        registerSkill(createChatSkill());
        
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
    
    // ========== Built-in Skill Definitions ==========
    
    private EnhancedSkill createListReposSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("list_repos");
        skill.setName("List Repositories");
        skill.setDescription("List all accessible repositories in DocSystem");
        skill.setCategory("repository");
        skill.setVersion("1.0.0");
        
        // Triggers
        skill.addTrigger("list repos");
        skill.addTrigger("列出仓库");
        skill.addTrigger("查看仓库");
        skill.addTrigger("仓库列表");
        skill.addTrigger("有哪些仓库");
        skill.addTrigger("我的仓库");
        
        // CLI command template
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("list repos");
        cmd.setCliCommand("list-repos");
        cmd.setDescription("List all repositories");
        skill.addCommand(cmd);
        
        // Chinese command
        SkillCommand cmdZh = new SkillCommand();
        cmdZh.setPattern("列出仓库");
        cmdZh.setCliCommand("list-repos");
        cmdZh.setDescription("列出所有仓库（中文）");
        skill.addCommand(cmdZh);
        
        // Execution instructions
        skill.setExecutionFlow(
            "1. Call DocSys API: GET /Repos/getAllRepos.do\n" +
            "2. Parse JSON response\n" +
            "3. Format as readable list\n" +
            "4. Return to user"
        );
        
        // Examples
        skill.addExample("list repos");
        skill.addExample("列出仓库");
        skill.addExample("查看有哪些仓库");
        
        return skill;
    }
    
    private EnhancedSkill createCreateReposSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("create_repos");
        skill.setName("Create Repository");
        skill.setDescription("Create a new repository in DocSystem");
        skill.setCategory("repository");
        skill.setVersion("1.0.0");
        skill.addPermission("write:repository");
        
        skill.addTrigger("create repo");
        skill.addTrigger("创建仓库");
        skill.addTrigger("新建仓库");
        skill.addTrigger("add repository");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("create repo <name> [description] [path]");
        cmd.setCliCommand("create-repos");
        cmd.addParameter("name", "Repository name", true);
        cmd.addParameter("description", "Repository description", false);
        cmd.addParameter("path", "Storage path", false);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Validate required parameters (name)\n" +
            "2. Call DocSys API: POST /Repos/add.do\n" +
            "3. Handle response (success/error)\n" +
            "4. Return result to user"
        );
        
        skill.addExample("create repo MyProject \"My project files\" F:/data/myrepo");
        skill.addExample("创建仓库 TestRepo");
        
        return skill;
    }
    
    private EnhancedSkill createDeleteReposSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("delete_repos");
        skill.setName("Delete Repository");
        skill.setDescription("Delete an existing repository");
        skill.setCategory("repository");
        skill.setVersion("1.0.0");
        skill.addPermission("admin:repository");
        
        skill.addTrigger("delete repo");
        skill.addTrigger("删除仓库");
        skill.addTrigger("remove repository");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("delete repo <vid>");
        cmd.setCliCommand("delete-repos");
        cmd.addParameter("vid", "Repository ID", true);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Confirm deletion with user\n" +
            "2. Call DocSys API: POST /Repos/delete.do\n" +
            "3. Return result"
        );
        
        skill.addExample("delete repo 1");
        skill.addExample("删除仓库 hznu");
        
        return skill;
    }
    
    private EnhancedSkill createListDocsSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("list_docs");
        skill.setName("List Documents");
        skill.setDescription("List documents in a repository or folder");
        skill.setCategory("document");
        skill.setVersion("1.0.0");
        
        skill.addTrigger("list docs");
        skill.addTrigger("列出文档");
        skill.addTrigger("查看文档");
        skill.addTrigger("文件夹内容");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("list docs <vid> [pid]");
        cmd.setCliCommand("list-docs");
        cmd.addParameter("vid", "Repository ID", true);
        cmd.addParameter("pid", "Parent folder ID", false);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Call DocSys API: POST /Doc/list.do\n" +
            "2. Parse document list\n" +
            "3. Format and return"
        );
        
        skill.addExample("list docs 1");
        skill.addExample("列出文档 hznu");
        
        return skill;
    }
    
    private EnhancedSkill createSearchDocSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("search_doc");
        skill.setName("Search Documents");
        skill.setDescription("Full-text search across all documents");
        skill.setCategory("search");
        skill.setVersion("1.0.0");
        
        skill.addTrigger("search");
        skill.addTrigger("搜索");
        skill.addTrigger("查找");
        skill.addTrigger("检索");
        skill.addTrigger("query");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("search <query> [vid]");
        cmd.setCliCommand("search");
        cmd.addParameter("query", "Search keyword", true);
        cmd.addParameter("vid", "Repository ID", false);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Call DocSys API: POST /Query/search.do\n" +
            "2. Parse search results\n" +
            "3. Return formatted results"
        );
        
        skill.addExample("search test");
        skill.addExample("搜索 文档");
        
        return skill;
    }
    
    private EnhancedSkill createUploadDocSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("upload_doc");
        skill.setName("Upload Document");
        skill.setDescription("Upload a document to repository");
        skill.setCategory("document");
        skill.setVersion("1.0.0");
        skill.addPermission("write:document");
        
        skill.addTrigger("upload");
        skill.addTrigger("上传");
        skill.addTrigger("添加文档");
        skill.addTrigger("add document");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("upload <vid> <file>");
        cmd.setCliCommand("upload-doc");
        cmd.addParameter("vid", "Repository ID", true);
        cmd.addParameter("file", "File path", true);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Validate file exists\n" +
            "2. Call DocSys API: POST /Doc/add.do (multipart)\n" +
            "3. Return upload result"
        );
        
        skill.addExample("upload 1 F:/documents/test.pdf");
        
        return skill;
    }
    
    private EnhancedSkill createDownloadDocSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("download_doc");
        skill.setName("Download Document");
        skill.setDescription("Download a document from repository");
        skill.setCategory("document");
        skill.setVersion("1.0.0");
        
        skill.addTrigger("download");
        skill.addTrigger("下载");
        skill.addTrigger("获取文档");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("download <vid> <docId>");
        cmd.setCliCommand("download-doc");
        cmd.addParameter("vid", "Repository ID", true);
        cmd.addParameter("docId", "Document ID", true);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Call DocSys API: GET /Doc/download.do\n" +
            "2. Stream file to user"
        );
        
        skill.addExample("download 1 123");
        
        return skill;
    }
    
    private EnhancedSkill createWhoamiSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("whoami");
        skill.setName("Who Am I");
        skill.setDescription("Show current user information");
        skill.setCategory("user");
        skill.setVersion("1.0.0");
        
        skill.addTrigger("whoami");
        skill.addTrigger("我是谁");
        skill.addTrigger("当前用户");
        skill.addTrigger("我的信息");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("whoami");
        cmd.setCliCommand("whoami");
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Call DocSys API: GET /User/getLoginUser.do\n" +
            "2. Return user info"
        );
        
        skill.addExample("whoami");
        skill.addExample("我是谁");
        
        return skill;
    }
    
    private EnhancedSkill createChatSkill() {
        EnhancedSkill skill = new EnhancedSkill();
        skill.setId("chat");
        skill.setName("AI Chat");
        skill.setDescription("Chat with AI assistant");
        skill.setCategory("ai");
        skill.setVersion("1.0.0");
        
        skill.addTrigger("chat");
        skill.addTrigger("聊天");
        skill.addTrigger("问答");
        skill.addTrigger("对话");
        
        SkillCommand cmd = new SkillCommand();
        cmd.setPattern("chat <message>");
        cmd.setCliCommand("chat");
        cmd.addParameter("message", "Message to send", true);
        skill.addCommand(cmd);
        
        skill.setExecutionFlow(
            "1. Send message to LLM service\n" +
            "2. Return AI response"
        );
        
        skill.addExample("chat 你好");
        skill.addExample("chat What is DocSystem?");
        
        return skill;
    }
}
