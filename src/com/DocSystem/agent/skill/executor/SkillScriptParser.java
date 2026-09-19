package com.DocSystem.agent.skill.executor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

/**
 * SkillScriptParser - parses agent skills files for execution.
 *
 * <p>Handles the agentskills.io standard skill file format:
 * <ul>
 *   <li>{@code skill.md} - skill definition with description and triggers</li>
 *   <li>{@code agent.md} - agent behavior / LLM guidance content</li>
 *   <li>{@code ## CLI Command} or {@code ### CLI Command} blocks in skill.md</li>
 * </ul>
 *
 * <p><b>Security notes:</b>
 * <ul>
 *   <li>Trust model: skills directory is admin-only write (document this in usage)</li>
 *   <li>Parameter interpolation replaces {paramName} only — no shell injection risk</li>
 *   <li>No Runtime.exec(String) usage — ProcessBuilder with List&lt;String&gt; args is used</li>
 *   <li>Fenced code blocks are stripped, leaving only the raw command string</li>
 * </ul>
 *
 * <p><b>Example skill.md with CLI Command:</b>
 * <pre>
 * ## My Skill
 *
 * Some description.
 *
 * ### CLI Command
 *
 * ```
 * python scripts/main.py --query {query} --verbose
 * ```
 * </pre>
 * Result: "python scripts/main.py --query {query} --verbose"
 */
@Component
public class SkillScriptParser {

    private static final Logger log = LoggerFactory.getLogger(SkillScriptParser.class);

    /** Pattern to match H2 or H3 heading containing "CLI Command" */
    private static final Pattern CLI_HEADING_PATTERN = Pattern.compile(
        "^#{2,3}\\s+.*CLI Command",
        Pattern.CASE_INSENSITIVE
    );

    /** Pattern to detect start of a new H2/H3 heading */
    private static final Pattern HEADING_PATTERN = Pattern.compile("^#{2,3}\\s+");

    /**
     * Parse the CLI Command block from a skill.md markdown content.
     * Matches both H2 ({@code ## CLI Command}) and H3 ({@code ### CLI Command}) headings.
     *
     * @param markdownContent the full content of skill.md
     * @return the first non-empty line of the CLI command, or null if not found
     */
    public String parseCliCommandBlock(String markdownContent) {
        if (markdownContent == null || markdownContent.trim().isEmpty()) {
            return null;
        }

        String[] lines = markdownContent.split("\n");
        boolean inCliBlock = false;
        StringBuilder blockContent = new StringBuilder();

        for (String rawLine : lines) {
            String line = rawLine;

            // Detect H2/H3 heading
            if (HEADING_PATTERN.matcher(line).find()) {
                if (CLI_HEADING_PATTERN.matcher(line).find()) {
                    // Found CLI Command heading
                    inCliBlock = true;
                    blockContent.setLength(0); // clear previous block content
                    continue;
                } else {
                    // New heading that is NOT CLI Command — end current block
                    if (inCliBlock) break;
                    inCliBlock = false;
                }
            }

            if (inCliBlock) {
                blockContent.append(line).append("\n");
            }
        }

        if (blockContent.length() == 0) {
            return null;
        }

        // Strip markdown formatting from block
        String cleaned = stripMarkdownFormatting(blockContent.toString());
        return extractFirstCommand(cleaned);
    }

    /**
     * Read and return agent.md content from a skill directory.
     *
     * @param skillDir the skill directory path
     * @return full agent.md content, or null if not found
     */
    public String parseAgentMd(Path skillDir) {
        if (skillDir == null) return null;
        Path agentMdPath = skillDir.resolve("agent.md");
        if (!Files.exists(agentMdPath)) {
            log.debug("No agent.md found at {}", agentMdPath);
            return null;
        }
        try {
            return new String(Files.readAllBytes(agentMdPath), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Failed to read agent.md from {}: {}", agentMdPath, e.getMessage());
            return null;
        }
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Strip markdown formatting from a code block.
     * Removes: ``` fences, leading spaces, bullet markers.
     */
    private static String stripMarkdownFormatting(String block) {
        String[] lines = block.split("\n");
        StringBuilder sb = new StringBuilder();
        boolean firstLine = true;

        for (String line : lines) {
            String trimmed = line.trim();

            // Remove code fence markers (``` or ```bash, ```python, etc.)
            if (trimmed.startsWith("```")) {
                continue; // Skip fence lines
            }

            // Remove bullet markers at line start
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                trimmed = trimmed.substring(2);
            }

            if (!trimmed.isEmpty()) {
                if (!firstLine) sb.append("\n");
                sb.append(trimmed);
                firstLine = false;
            }
        }

        return sb.toString();
    }

    /**
     * Extract the first non-empty command line from cleaned block content.
     */
    private static String extractFirstCommand(String cleaned) {
        if (cleaned == null || cleaned.trim().isEmpty()) return null;

        String[] lines = cleaned.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                // Remove inline comments (// or # that are not part of the command)
                // But keep shell pipes and redirects as part of the command
                return trimmed;
            }
        }
        return null;
    }
}