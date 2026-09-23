package com.DocSystem.agent.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.*;
import java.util.stream.Collectors;

/**
 * SkillParser - Parse SKILL.md files following agentskills.io standard
 */
public class SkillParser {
    
    private static final Logger log = LoggerFactory.getLogger(SkillParser.class);
    
    /**
     * Parse SKILL.md content into EnhancedSkill
     */
    public static EnhancedSkill parse(String content, String skillId) {
        try {
            EnhancedSkill skill = new EnhancedSkill();
            skill.setId(skillId);
            
            // Parse YAML frontmatter
            if (content.startsWith("---")) {
                int endIndex = content.indexOf("---", 3);
                if (endIndex > 0) {
                    String frontmatter = content.substring(3, endIndex).trim();
                    parseFrontmatter(skill, frontmatter);
                    content = content.substring(endIndex + 3).trim();
                }
            }
            
            // Parse Markdown body
            parseMarkdown(skill, content);
            
            return skill;
        } catch (Exception e) {
            log.error("Failed to parse skill {}: {}", skillId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Parse YAML frontmatter
     */
    private static void parseFrontmatter(EnhancedSkill skill, String frontmatter) {
        String[] lines = frontmatter.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;
            
            if (line.startsWith("name:")) {
                skill.setName(extractValue(line));
            } else if (line.startsWith("description:")) {
                skill.setDescription(extractValue(line));
            } else if (line.startsWith("category:")) {
                skill.setCategory(extractValue(line));
            } else if (line.startsWith("version:")) {
                skill.setVersion(extractValue(line));
            } else if (line.startsWith("author:")) {
                skill.setAuthor(extractValue(line));
            } else if (line.startsWith("permissions:")) {
                // Handle list
            } else if (line.startsWith("risk:")) {
                // P1：权限风险声明（safe/write/dangerous/absolute）→ 供 run_skill 的权限判定使用
                skill.setRisk(extractValue(line));
            }
        }
    }
    
    /**
     * Parse Markdown body
     */
    private static void parseMarkdown(EnhancedSkill skill, String markdown) {
        String[] lines = markdown.split("\n");
        String currentSection = "";
        StringBuilder sectionContent = new StringBuilder();
        
        for (String line : lines) {
            line = line.trim();
            
            // Detect sections
            if (line.startsWith("## ")) {
                // Save previous section
                saveSection(skill, currentSection, sectionContent.toString());
                currentSection = line.substring(3).trim();
                sectionContent = new StringBuilder();
            } else if (line.startsWith("# ") && skill.getName() == null) {
                skill.setName(line.substring(2).trim());
            } else if (!line.isEmpty()) {
                sectionContent.append(line).append("\n");
            }
        }
        
        // Save last section
        saveSection(skill, currentSection, sectionContent.toString());
    }
    
    /**
     * Save parsed section
     */
    private static void saveSection(EnhancedSkill skill, String section, String content) {
        if (section == null || content == null) return;
        
        section = section.toLowerCase();
        
        if (section.contains("trigger")) {
            for (String line : content.split("\n")) {
                line = line.trim();
                if (line.startsWith("- ")) {
                    skill.addTrigger(line.substring(2).trim());
                }
            }
        } else if (section.contains("example")) {
            for (String line : content.split("\n")) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("```")) {
                    skill.addExample(line.replace("`", "").trim());
                }
            }
        } else if (section.contains("flow") || section.contains("execution")) {
            skill.setExecutionFlow(content.trim());
        }
    }
    
    private static String extractValue(String line) {
        int colon = line.indexOf(':');
        if (colon > 0) {
            return line.substring(colon + 1).trim();
        }
        return "";
    }
}
