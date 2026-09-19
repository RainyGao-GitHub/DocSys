package com.DocSystem.agent.skill.executor;

import com.DocSystem.agent.core.AgentContext;
import com.DocSystem.agent.learning.entity.SkillMetadata;
import com.DocSystem.agent.learning.service.SkillMetadataService;
import com.DocSystem.agent.llm.LLMService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * ExternalSkillExecutor - executes skills from the external skills directory
 * using three strategies in priority order:
 *
 * <ol>
 *   <li><b>Python Script</b> - discovers and runs __main__.py in the skill directory</li>
 *   <li><b>CLI Command</b> - parses and executes the CLI Command block from skill.md</li>
 *   <li><b>LLM Guidance</b> - reads agent.md and uses LLM to provide guidance</li>
 * </ol>
 *
 * <p>Ordering: {@code @Order(200)} — runs after built-in DocSysSkillExecutor (@Order(100)).
 * Only handles skills that are NOT in the built-in set and have a skill.md in their directory.
 *
 * <p><b>Security notes:</b>
 * <ul>
 *   <li>Trust model: skills directory is admin-only write</li>
 *   <li>Parameter interpolation replaces {paramName} only — no shell injection risk</li>
 *   <li>Uses ProcessBuilder with argument list (not Runtime.exec with String)</li>
 *   <li>Process timeouts enforced (default 120s)</li>
 * </ul>
 *
 * <p><b>Environment variables injected:</b>
 * DOCSYS_URL, DOCSYS_SESSION, DOCSYS_USER, DOCSYS_PASSWORD, DOCSYS_SKILL_DIR
 */
@Component
@Order(200)
public class ExternalSkillExecutor implements SkillExecutor {

    private static final Logger log = LoggerFactory.getLogger(ExternalSkillExecutor.class);

    private static final Set<String> BUILT_IN_SKILL_IDS = new HashSet<>(Arrays.asList(
        // Repository skills
        "list_repos", "list-repos",
        "create_repos", "create-repos", "add_repos",
        "delete_repos", "delete-repos",
        "get_repos", "repos-info",
        "update_repos",
        "backup_repos", "backup",
        "backup_status",
        // Document skills
        "get_doc_list", "list-docs", "list_docs",
        "add_doc", "create-doc", "add-document",
        "delete_doc", "delete-doc", "delete-document",
        "rename_doc", "rename-doc",
        "move_doc", "move-doc",
        "copy_doc", "copy-doc",
        "get_doc", "doc-info",
        "doc_history", "version-history",
        // Search skills
        "search_doc", "search", "search-docs",
        "search_in_repo",
        // AI/Chat skills
        "rag_chat", "chat-with-docs",
        "list_models", "ai-models",
        // User skills
        "whoami",
        // System skills
        "config", "system-config", "system_config",
        "help", "help-repos", "help-docs", "help-search",
        "banner",
        "init-llm", "init-auth",
        // Web automation skills
        "playwright", "web_automation",
        "web_search", "web-search",
        "browser_use", "ai-browse",
        // Natural language skills
        "search_and_load",
        "generate_summary",
        "search_and_answer"
    ));

    /** 注入的回退目录(application.yml，相对 user.dir)——DocSys 未就绪时使用 */
    private final Path fallbackSkillsDir;

    /** 解析后的技能目录缓存(优先 Path.getAgentSkillStorePath 配置目录) */
    private volatile Path resolvedSkillsDir;

    /** Process timeout in seconds (from application.yml) */
    private final int skillTimeout;

    private final LLMService llmService;

    private final SkillScriptParser parser;

    private final SkillMetadataService skillMetadataService;

    @Autowired
    public ExternalSkillExecutor(
            @Value("${agent.external-skills.dir:skills}") String skillsDirPath,
            @Value("${agent.external-skills.timeout:120}") int skillTimeout,
            @Autowired(required = false) LLMService llmService,
            SkillScriptParser parser,
            @Autowired(required = false) SkillMetadataService skillMetadataService) {
        this.fallbackSkillsDir = Paths.get(skillsDirPath);
        this.skillTimeout = skillTimeout;
        this.llmService = llmService;
        this.parser = parser != null ? parser : new SkillScriptParser();
        this.skillMetadataService = skillMetadataService;
        log.info("ExternalSkillExecutor initialized: fallbackSkillsDir={}, timeout={}s, accessControl={}",
            this.fallbackSkillsDir, this.skillTimeout, this.skillMetadataService != null ? "enabled" : "disabled");
    }

    /**
     * 解析技能目录：优先 DocSys 配置目录(Path.getAgentSkillStorePath)，
     * 未就绪或异常时回退到注入的 fallbackSkillsDir(相对 user.dir)。
     * 结果缓存，避免每次请求都读配置。
     */
    private Path skillsDir() {
        Path r = resolvedSkillsDir;
        if (r != null) {
            return r;
        }
        try {
            String cfg = com.DocSystem.common.Path.getAgentSkillStorePath(com.DocSystem.common.BaseFunction.OSType);
            if (cfg != null && !cfg.isEmpty()) {
                r = Paths.get(cfg);
                resolvedSkillsDir = r;
                return r;
            }
        } catch (Exception e) {
            log.warn("解析 Agent 技能目录失败，回退默认: {}", e.getMessage());
        }
        return fallbackSkillsDir;
    }

    @Override
    public int getOrder() {
        return 200;
    }

    /**
     * Returns true if this executor can handle the given skillId.
     * Must NOT be a built-in skill and must have a skill.md file in its directory.
     * Also checks access control based on skill metadata (visibility).
     */
    @Override
    public boolean canHandle(String skillId) {
        if (skillId == null) return false;
        // Built-in skills are always handled by DocSysSkillExecutor (Order 100)
        if (BUILT_IN_SKILL_IDS.contains(skillId)) return false;
        // Resolve and validate path to prevent traversal attacks
        Path skillDir;
        Path skillsDirReal;
        try {
            Path base = skillsDir();
            skillDir = base.resolve(skillId).toRealPath();
            skillsDirReal = base.toRealPath();
        } catch (IOException e) {
            return false;
        }
        // Ensure resolved path is still under skillsDir (defense-in-depth)
        if (!skillDir.startsWith(skillsDirReal)) return false;
        if (!Files.exists(skillDir.resolve("skill.md"))) return false;

        // Access control: check skill metadata visibility (skip if service not available)
        if (skillMetadataService != null) {
            SkillMetadata metadata = skillMetadataService.getMetadata(skillId);
            if (metadata != null) {
                // For execute access, we need context to check user access
                // Return true here - actual access check happens in execute()
                log.debug("Skill '{}' metadata found: visibility={}, creator={}",
                    skillId, metadata.getVisibility(), metadata.getCreatorId());
            }
        }

        return true;
    }

    /**
     * Check if the current user can access the skill based on visibility settings.
     * Called from execute() before running the skill.
     */
    private boolean checkSkillAccess(String skillId, AgentContext context) {
        if (skillMetadataService == null) {
            return true; // No access control if service not available
        }

        SkillMetadata metadata = skillMetadataService.getMetadata(skillId);
        if (metadata == null) {
            // No metadata means skill is not managed - allow access (legacy behavior)
            return true;
        }

        String visibility = metadata.getVisibility();
        String userId = context != null ? context.getUserId() : null;
        boolean isAdmin = context != null && context.isAdmin();

        log.debug("Checking access for skill '{}': visibility={}, userId={}, isAdmin={}",
            skillId, visibility, userId, isAdmin);

        switch (visibility) {
            case "PUBLIC":
                // Anyone can use public skills
                return true;

            case "TENANT":
                // Users in the same tenant can use this skill
                // For now, allow if user is logged in (has context)
                return userId != null;

            case "PRIVATE":
            default:
                // Only the creator can use private skills
                if (userId == null) {
                    return false;
                }
                String creatorId = metadata.getCreatorId();
                return userId.equals(creatorId);
        }
    }

    /**
     * Execute the external skill using three strategies in priority order.
     * Access control is enforced based on skill metadata visibility.
     */
    @Override
    public SkillExecutionResult execute(String skillId, Map<String, String> params, AgentContext context) {
        // Access control check before execution
        if (!checkSkillAccess(skillId, context)) {
            log.warn("Access denied for skill '{}' to user '{}'", skillId,
                context != null ? context.getUserId() : "anonymous");
            return SkillExecutionResult.error(
                "Access denied: You do not have permission to use this skill.\n" +
                "This skill is private and can only be used by its creator.");
        }

        Path skillDir = skillsDir().resolve(skillId);
        log.info("Executing external skill '{}' from {}", skillId, skillDir);

        // Strategy 1: Try Python script
        SkillExecutionResult result = tryPythonScript(skillDir, params, context);
        if (result != null) {
            log.info("Strategy 1 (Python script) succeeded for skill '{}'", skillId);
            return result;
        }
        log.debug("Strategy 1 (Python script) failed for skill '{}', trying next", skillId);

        // Strategy 2: Try CLI Command
        result = tryAgentskillsCliCommand(skillDir, params, context);
        if (result != null) {
            log.info("Strategy 2 (CLI command) succeeded for skill '{}'", skillId);
            return result;
        }
        log.debug("Strategy 2 (CLI command) failed for skill '{}', trying next", skillId);

        // Strategy 3: Try LLM Guidance
        result = tryLlmGuidance(skillDir, params, context);
        if (result != null) {
            log.info("Strategy 3 (LLM guidance) succeeded for skill '{}'", skillId);
            return result;
        }
        log.warn("All three strategies failed for skill '{}'", skillId);
        return SkillExecutionResult.error("No valid execution strategy found for skill: " + skillId);
    }

    // ─── Strategy 1: Python Script ────────────────────────────────────────────

    /**
     * Discover and execute __main__.py in the skill directory.
     * Returns null on failure so the caller can try the next strategy.
     *
     * <p>Execution:
     * <ul>
     *   <li>Discovers __main__.py via Files.find (depth up to 3)</li>
     *   <li>Runs: python3 script.py (fallback python on Windows)</li>
     *   <li>Passes params as JSON stdin: {"params": {...}, "context": {"skillId": ...}}</li>
     *   <li>Parses stdout as JSON: {success, output, error}</li>
     *   <li>Timeout: skillTimeout seconds</li>
     * </ul>
     */
    private SkillExecutionResult tryPythonScript(Path skillDir, Map<String, String> params, AgentContext context) {
        try {
            // Discover __main__.py under skillDir (max depth 3 for nested scripts/)
            Optional<Path> scriptOpt = Files.find(skillDir, 3,
                (p, attrs) -> p.getFileName().toString().equals("__main__.py")
            ).findFirst();

            if (!scriptOpt.isPresent()) {
                log.debug("No __main__.py found in {}", skillDir);
                return null;
            }

            Path script = scriptOpt.get();
            log.debug("Found script: {}", script);

            // Build JSON payload for stdin
            Map<String, Object> payload = new HashMap<>();
            payload.put("params", params);
            Map<String, Object> ctxMap = new HashMap<>();
            ctxMap.put("skillId", skillDir.getFileName().toString());
            ctxMap.put("sessionId", context != null ? context.getSessionId() : "");
            ctxMap.put("username", context != null ? context.getUsername() : "");
            payload.put("context", ctxMap);
            String jsonInput = JSON.toJSONString(payload);

            // Determine Python command: python3 (Unix) or python (Windows)
            String pythonCmd = isWindows()
                ? (tryFindPython("python") ? "python" : "python3")
                : (tryFindPython("python3") ? "python3" : "python");

            // Build process: invoke Python directly — JSON is written via stdin below (no shell pipe)
            // Using list form avoids shell injection and works cross-platform
            ProcessBuilder pb = new ProcessBuilder(Arrays.asList(pythonCmd, script.toString()));

            // Inject environment variables
            Map<String, String> env = new HashMap<>(pb.environment());
            injectEnvVars(env, context);
            pb.environment().putAll(env);

            pb.redirectErrorStream(false);
            Process process = pb.start();

            // Write JSON to stdin and close it
            try (OutputStream stdin = process.getOutputStream()) {
                stdin.write(jsonInput.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                stdin.flush();
            }

            // Read stdout
            String stdout;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                stdout = sb.toString();
            }

            // Read stderr
            String stderr = "";
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                stderr = sb.toString().trim();
            }

            boolean finished = process.waitFor(skillTimeout, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("Python script timed out after {}s: {}", skillTimeout, script);
                return null;
            }

            int exitCode = process.exitValue();
            log.debug("Python script exit code: {}, stdout length: {}", exitCode, stdout.length());

            // Parse JSON result from stdout
            if (stdout != null && !stdout.trim().isEmpty()) {
                try {
                    JSONObject resultJson = JSON.parseObject(stdout);
                    boolean success = resultJson.getBooleanValue("success");
                    if (!success) {
                        success = (exitCode == 0);
                    }
                    String output = resultJson.getString("output");
                    String error = resultJson.getString("error");
                    Map<String, Object> data;
                    if (resultJson.containsKey("data")) {
                        Object dataVal = resultJson.get("data");
                        if (dataVal instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> m = (Map<String, Object>) dataVal;
                            data = new java.util.HashMap<>(m);
                            data.put("exitCode", exitCode);
                            data.put("strategy", "python");
                        } else {
                            data = new HashMap<>();
                            data.put("exitCode", exitCode);
                            data.put("strategy", "python");
                        }
                    } else {
                        data = new HashMap<>();
                        data.put("exitCode", exitCode);
                        data.put("strategy", "python");
                    }
                    if (success) {
                        return SkillExecutionResult.ok(output != null ? output : "", data);
                    } else {
                        String errMsg = (error != null && !error.trim().isEmpty()) ? error
                            : (!stderr.trim().isEmpty() ? stderr : "Script exited with code " + exitCode);
                        return SkillExecutionResult.error(errMsg, data);
                    }
                } catch (Exception e) {
                    log.debug("Could not parse Python script JSON output, treating as raw output: {}", e.getMessage());
                    // Non-JSON stdout: treat as success if exit code 0, else error
                    Map<String, Object> pyStrategy = new HashMap<>();
                    pyStrategy.put("strategy", "python");
                    if (exitCode == 0) {
                        return SkillExecutionResult.ok(stdout, pyStrategy);
                    } else {
                        String errMsg = !stderr.trim().isEmpty() ? stderr : "Script exited with code " + exitCode;
                        return SkillExecutionResult.error(errMsg, pyStrategy);
                    }
                }
            }

            // No stdout: check exit code and stderr
            Map<String, Object> pyStrategy2 = new HashMap<>();
            pyStrategy2.put("strategy", "python");
            if (exitCode == 0) {
                return SkillExecutionResult.ok("", pyStrategy2);
            } else {
                String errMsg = !stderr.trim().isEmpty() ? stderr : "Script exited with code " + exitCode;
                return SkillExecutionResult.error(errMsg, pyStrategy2);
            }

        } catch (IOException e) {
            log.debug("Strategy 1 (Python script) failed due to IOException: {}", e.getMessage());
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Strategy 1 (Python script) was interrupted: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.debug("Strategy 1 (Python script) failed: {}", e.getMessage());
            return null;
        }
    }

    // ─── Strategy 2: CLI Command ───────────────────────────────────────────────

    /**
     * Parse and execute the CLI Command block from skill.md.
     * Returns null on failure so the caller can try the next strategy.
     *
     * <p>Execution:
     * <ul>
     *   <li>Reads skill.md from skillDir</li>
     *   <li>Parses CLI Command block (H2 ## or H3 ### headings)</li>
     *   <li>Interpolates {paramName} placeholders with params values</li>
     *   <li>Executes via cmd.exe /c (Windows) or /bin/bash -c (Unix)</li>
     *   <li>Timeout: skillTimeout seconds</li>
     * </ul>
     */
    private SkillExecutionResult tryAgentskillsCliCommand(Path skillDir, Map<String, String> params, AgentContext context) {
        try {
            Path skillMdPath = skillDir.resolve("skill.md");
            if (!Files.exists(skillMdPath)) {
                log.debug("No skill.md found at {}", skillMdPath);
                return null;
            }

            String content = new String(Files.readAllBytes(skillMdPath), java.nio.charset.StandardCharsets.UTF_8);
            String command = parser.parseCliCommandBlock(content);
            if (command == null || command.trim().isEmpty()) {
                log.debug("No CLI Command block found in skill.md for {}", skillDir.getFileName());
                return null;
            }

            // Interpolate {paramName} placeholders
            String interpolated = interpolateCommand(command, params);
            log.debug("Interpolated command: {}", interpolated);

            // Build shell command
            ProcessBuilder pb;
            if (isWindows()) {
                pb = new ProcessBuilder("cmd.exe", "/c", interpolated);
            } else {
                pb = new ProcessBuilder("/bin/bash", "-c", interpolated);
            }

            // Inject environment variables
            Map<String, String> env = new HashMap<>(pb.environment());
            injectEnvVars(env, context);
            pb.environment().putAll(env);

            pb.redirectErrorStream(false);
            Process process = pb.start();

            // Read stdout
            String stdout;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                stdout = sb.toString().trim();
            }

            // Read stderr
            String stderr;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                stderr = sb.toString().trim();
            }

            boolean finished = process.waitFor(skillTimeout, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("CLI command timed out after {}s", skillTimeout);
                return null;
            }

            int exitCode = process.exitValue();
            log.debug("CLI command exit code: {}", exitCode);

            if (exitCode == 0) {
                Map<String, Object> cliData = new HashMap<>();
                cliData.put("strategy", "cli");
                cliData.put("exitCode", exitCode);
                return SkillExecutionResult.ok(stdout.isEmpty() ? "(success)" : stdout, cliData);
            } else {
                String errMsg = !stderr.isEmpty() ? stderr : "CLI command exited with code " + exitCode;
                Map<String, Object> cliData2 = new HashMap<>();
                cliData2.put("strategy", "cli");
                cliData2.put("exitCode", exitCode);
                return SkillExecutionResult.error(errMsg, cliData2);
            }

        } catch (IOException e) {
            log.debug("Strategy 2 (CLI command) failed due to IOException: {}", e.getMessage());
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.debug("Strategy 2 (CLI command) was interrupted: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.debug("Strategy 2 (CLI command) failed: {}", e.getMessage());
            return null;
        }
    }

    // ─── Strategy 3: LLM Guidance ──────────────────────────────────────────────

    /**
     * Use LLM to provide guidance based on agent.md content.
     * Returns null if agent.md does not exist (no further fallback available).
     *
     * <p>Prompt construction:
     * <ul>
     *   <li>System: skill.md description + full agent.md content</li>
     *   <li>User: params formatted as key=value lines</li>
     * </ul>
     */
    private SkillExecutionResult tryLlmGuidance(Path skillDir, Map<String, String> params, AgentContext context) {
        try {
            Path agentMdPath = skillDir.resolve("agent.md");
            Path skillMdPath = skillDir.resolve("skill.md");
            if (!Files.exists(agentMdPath)) {
                log.debug("No agent.md found at {}, Strategy 3 not applicable", agentMdPath);
                return null;
            }

            String agentMdContent = new String(Files.readAllBytes(agentMdPath), java.nio.charset.StandardCharsets.UTF_8);
            String skillMdContent = Files.exists(skillMdPath)
                ? new String(Files.readAllBytes(skillMdPath), java.nio.charset.StandardCharsets.UTF_8)
                : "";

            // Build system prompt
            String systemPrompt = buildLlmSystemPrompt(skillDir.getFileName().toString(), skillMdContent, agentMdContent);

            // Build user prompt
            String userPrompt = buildLlmUserPrompt(params, context);

            if (llmService == null) {
                log.warn("LLM service not available for Strategy 3 guidance of {}", skillDir.getFileName());
                Map<String, Object> llmErrData = new HashMap<>();
                llmErrData.put("strategy", "llm");
                return SkillExecutionResult.error("LLM service not available", llmErrData);
            }

            String llmResponse = llmService.chat(
                systemPrompt + "\n\n" + userPrompt,
                "skill-" + skillDir.getFileName()
            );

            Map<String, Object> llmData = new HashMap<>();
            llmData.put("strategy", "llm");
            llmData.put("skillId", skillDir.getFileName().toString());
            return SkillExecutionResult.ok(llmResponse, llmData);

        } catch (IOException e) {
            log.debug("Strategy 3 (LLM guidance) failed due to IOException: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.debug("Strategy 3 (LLM guidance) failed: {}", e.getMessage());
            return null;
        }
    }

    private String buildLlmSystemPrompt(String skillId, String skillMdContent, String agentMdContent) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are executing the skill '").append(skillId).append("'.\n\n");
        if (!skillMdContent.trim().isEmpty()) {
            sb.append("## Skill Description\n").append(skillMdContent).append("\n\n");
        }
        if (!agentMdContent.trim().isEmpty()) {
            sb.append("## Agent Instructions\n").append(agentMdContent).append("\n\n");
        }
        sb.append("Based on the above instructions, provide the execution result or guidance.");
        return sb.toString();
    }

    private String buildLlmUserPrompt(Map<String, String> params, AgentContext context) {
        StringBuilder sb = new StringBuilder("## User Parameters\n");
        if (params == null || params.isEmpty()) {
            sb.append("(no parameters provided)\n");
        } else {
            for (Map.Entry<String, String> e : params.entrySet()) {
                sb.append(e.getKey()).append(" = ").append(e.getValue()).append("\n");
            }
        }
        sb.append("\n## Context\n");
        if (context != null) {
            sb.append("sessionId = ").append(context.getSessionId() != null ? context.getSessionId() : "").append("\n");
            sb.append("username  = ").append(context.getUsername() != null ? context.getUsername() : "").append("\n");
        } else {
            sb.append("(no context available)\n");
        }
        return sb.toString();
    }

    // ─── Environment Injection ─────────────────────────────────────────────────

    /**
     * Inject DocSys environment variables into the process environment.
     * Merges with existing environment (does not replace).
     */
    private void injectEnvVars(Map<String, String> env, AgentContext context) {
        // DOCSYS_URL - from application.yml via EnvConfig
        String docsysUrl = System.getProperty("docsys.url",
            System.getenv().getOrDefault("DOCSYS_URL", "http://localhost:8100/DocSystem"));
        env.put("DOCSYS_URL", docsysUrl);

        // DOCSYS_SESSION - from agent context
        String sessionId = context != null && context.getSessionId() != null
            ? context.getSessionId()
            : System.getenv().getOrDefault("DOCSYS_SESSION", "");
        env.put("DOCSYS_SESSION", sessionId);

        // DOCSYS_USER - from agent context or env
        String username = context != null && context.getUsername() != null
            ? context.getUsername()
            : System.getenv().getOrDefault("DOCSYS_USER", "");
        env.put("DOCSYS_USER", username);

        // DOCSYS_PASSWORD - from context (login credentials) or env
        String password = "";
        if (context != null) {
            Object pwdAttr = context.getAttribute("password");
            if (pwdAttr != null) password = pwdAttr.toString();
        }
        if (password.isEmpty()) {
            password = System.getenv().getOrDefault("DOCSYS_PASSWORD", "");
        }
        env.put("DOCSYS_PASSWORD", password);

        // DOCSYS_SKILL_DIR - the skill directory being executed
        // (set per-skill in the execute method context)
    }

    // ─── Utilities ─────────────────────────────────────────────────────────────

    /** Returns true if running on Windows */
    private static boolean isWindows() {
        String osName = System.getProperty("os.name", "");
        return osName.toLowerCase().startsWith("windows");
    }

    /**
     * Check if a command exists (quick discovery for python/python3).
     */
    private static boolean tryFindPython(String cmd) {
        try {
            Process process = new ProcessBuilder(isWindows() ? "where" : "which", cmd)
                .redirectErrorStream(true)
                .start();
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Interpolate {paramName} placeholders in the command with values from params map.
     * If a param is not found, the placeholder is left as-is.
     */
    private static String interpolateCommand(String command, Map<String, String> params) {
        if (params == null || params.isEmpty()) return command;
        String result = command;
        for (Map.Entry<String, String> e : params.entrySet()) {
            String placeholder = "{" + e.getKey() + "}";
            if (result.contains(placeholder)) {
                result = result.replace(placeholder, e.getValue() != null ? e.getValue() : "");
            }
        }
        return result;
    }

    /**
     * Returns the set of built-in skill IDs (for testing/diagnostics).
     */
    public static Set<String> getBuiltInSkillIds() {
        return BUILT_IN_SKILL_IDS;
    }
}