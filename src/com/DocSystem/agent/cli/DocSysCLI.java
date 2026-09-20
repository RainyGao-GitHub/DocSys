package com.DocSystem.agent.cli;

import com.DocSystem.agent.client.DocSysClient;
import com.DocSystem.agent.core.AgentContext;
import com.DocSystem.agent.core.AgentResponse;
import com.DocSystem.agent.focus.AgentFocusSupport;
import com.DocSystem.agent.orchestrator.MainAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.util.Map;
import java.util.Scanner;

/**
 * DocSys Agent CLI - Complete Command-line Interface for DocSystem
 * 
 * Coverage:
 * - User: login, logout, whoami, register
 * - Repos: list, add, delete, update, get, config
 * - Doc: list, add, delete, rename, move, copy, get, history
 * - File: upload, download
 * - Lock: lock, unlock
 * - Share: list, create, delete
 * - Search: search
 * - AI: chat, rag
 * - Backup: backup, status
 * - System: config, banner, models
 */
@Deprecated
public class DocSysCLI {
    
    private static final Logger log = LoggerFactory.getLogger(DocSysCLI.class);
    private static DocSysClient client;
    private static MainAgent agent;
    
    public static void main(String[] args) {
        String docSysUrl = System.getProperty("docsys.url", "http://localhost:8200/DocSystem");
        client = new DocSysClient(docSysUrl);
        agent = new MainAgent(client);
        
        log.info("DocSys CLI v2.0 starting...");
        
        if (args.length == 0) {
            runInteractive();
        } else {
            runCommand(args);
        }
    }
    
    // ==================== INTERACTIVE MODE ====================
    
    private static void runInteractive() {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║         DocSys CLI v2.0 - Interactive Mode              ║");
        System.out.println("╚════════════════════════════════════════════════════════════╝");
        System.out.println("Type 'help' for commands, 'exit' to quit\n");
        
        while (true) {
            System.out.print(client.isLoggedIn() 
                ? String.format("(%s) > ", client.getCurrentUsername())
                : "(not logged in) > ");
            
            String input = scanner.nextLine().trim();
            if (input.isEmpty()) continue;
            if (input.equals("exit") || input.equals("quit")) break;
            
            String[] parts = input.split("\\s+", 2);
            String cmd = parts[0].toLowerCase();
            String arg = parts.length > 1 ? parts[1] : "";
            
            try {
                handleCommand(cmd, arg);
            } catch (Exception e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
        scanner.close();
    }
    
    private static void handleCommand(String cmd, String arg) throws Exception {
        // USER
        if ("help".equals(cmd) || "?".equals(cmd)) {
            printHelp();
        } else if ("login".equals(cmd)) {
            cmdLogin(arg);
        } else if ("logout".equals(cmd)) {
            cmdLogout();
        } else if ("whoami".equals(cmd)) {
            cmdWhoami();
        } else if ("register".equals(cmd)) {
            cmdRegister(arg);
        // REPOS
        } else if ("repos".equals(cmd) || "repo".equals(cmd)) {
            handleRepos(arg);
        // DOC
        } else if ("doc".equals(cmd) || "ls".equals(cmd)) {
            cmdDocList(arg);
        } else if ("doc-add".equals(cmd) || "mkdir".equals(cmd)) {
            cmdDocAdd(arg);
        } else if ("doc-delete".equals(cmd) || "rm".equals(cmd)) {
            cmdDocDelete(arg);
        } else if ("doc-rename".equals(cmd) || "mv".equals(cmd)) {
            cmdDocRename(arg);
        } else if ("doc-move".equals(cmd)) {
            cmdDocMove(arg);
        } else if ("doc-copy".equals(cmd) || "cp".equals(cmd)) {
            cmdDocCopy(arg);
        } else if ("doc-get".equals(cmd) || "cat".equals(cmd)) {
            cmdDocGet(arg);
        } else if ("doc-history".equals(cmd) || "history".equals(cmd)) {
            cmdDocHistory(arg);
        // FILE
        } else if ("upload".equals(cmd) || "put".equals(cmd)) {
            cmdUpload(arg);
        } else if ("download".equals(cmd) || "get".equals(cmd)) {
            cmdDownload(arg);
        // LOCK
        } else if ("lock".equals(cmd)) {
            cmdLock(arg);
        } else if ("unlock".equals(cmd)) {
            cmdUnlock(arg);
        // SHARE
        } else if ("share-list".equals(cmd)) {
            cmdShareList(arg);
        } else if ("share-create".equals(cmd)) {
            cmdShareCreate(arg);
        // SEARCH & AI
        } else if ("search".equals(cmd) || "find".equals(cmd)) {
            cmdSearch(arg);
        } else if ("chat".equals(cmd) || "ai".equals(cmd)) {
            cmdChat(arg);
        } else if ("rag".equals(cmd) || "ask".equals(cmd)) {
            cmdRag(arg);
        // BACKUP
        } else if ("backup".equals(cmd)) {
            cmdBackup(arg);
        } else if ("backup-status".equals(cmd)) {
            cmdBackupStatus(arg);
        // SYSTEM
        } else if ("system-config".equals(cmd)) {
            cmdSystemConfig();
        } else if ("banner".equals(cmd)) {
            cmdBanner(arg);
        } else if ("models".equals(cmd)) {
            cmdAiModels();
        } else if ("status".equals(cmd)) {
            cmdStatus();
        } else {
            System.out.println("Unknown: " + cmd + ". Type 'help'");
        }
    }
    
    // ==================== USER COMMANDS ====================
    
    private static void cmdLogin(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: login <user> <pwd>"); return; }
        Map<String, Object> r = client.login(p[0], p[1]);
        System.out.println(format(r));
    }
    
    private static void cmdLogout() throws Exception {
        System.out.println(format(client.logout()));
    }
    
    private static void cmdWhoami() throws Exception {
        if (!client.isLoggedIn()) { System.out.println("Not logged in"); return; }
        System.out.println(format(client.getLoginUser()));
    }
    
    private static void cmdRegister(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 3) { System.out.println("Usage: register <user> <pwd> <pwd2>"); return; }
        System.out.println(format(client.register(p[0], p[1], p[2], null)));
    }
    
    // ==================== REPOSITORY COMMANDS ====================
    
    private static void handleRepos(String arg) throws Exception {
        if (arg.isEmpty()) { cmdReposList(); return; }
        String[] p = arg.split("\\s+", 2);
        switch (p[0]) {
            case "list": cmdReposList();
            case "add": cmdReposAdd(p.length > 1 ? p[1] : "");
            case "delete": cmdReposDelete(p.length > 1 ? p[1] : "");
            case "get": cmdReposGet(p.length > 1 ? p[1] : "");
            case "config": cmdReposConfig();
            default: System.out.println("repos [list|add|delete|get|config]");
        }
    }
    
    private static void cmdReposList() throws Exception {
        System.out.println(format(client.getReposList()));
    }
    
    private static void cmdReposAdd(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: repos add <name> <path>"); return; }
        System.out.println(format(client.addRepos(
            p[0], "", Integer.valueOf(0), p[1], 
            "", Integer.valueOf(0), Integer.valueOf(0), 
            "", "", "", "", "", "1", 
            "", Integer.valueOf(0), "", "")));
    }
    
    private static void cmdReposDelete(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: repos delete <id>"); return; }
        System.out.println(format(client.deleteRepos(parseInt(arg))));
    }
    
    private static void cmdReposGet(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: repos get <id>"); return; }
        System.out.println(format(client.getRepos(parseInt(arg))));
    }
    
    private static void cmdReposConfig() throws Exception {
        System.out.println(format(client.getDocSysConfig()));
    }
    
    // ==================== DOCUMENT COMMANDS ====================

    /**
     * 目录参数约定（R1-6：一律用 path 定位，不再用 docId/pid）：
     * 根目录写 {@code .} 或 {@code /}（归一化为空串），子目录写相对路径（{@code 66666/} 或 {@code 66666}）。
     */
    private static String dirPath(String raw) {
        return AgentFocusSupport.normalizePath(raw);
    }

    private static void cmdDocList(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        Integer vid = p.length > 0 && !p[0].isEmpty() ? parseInt(p[0]) : null;
        String dir = p.length > 1 ? dirPath(p[1]) : "";
        // 服务端只把 path == null 当成仓库根（空串会落到另一条分支）
        System.out.println(format(client.getDocList(vid, null, null, dir.isEmpty() ? null : dir)));
    }
    
    private static void cmdDocAdd(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: doc add <repos-id> <name>"); return; }
        System.out.println(format(client.addDoc(parseInt(p[0]), 0L, null, p[1], 1, 0, null, null)));
    }
    
    private static void cmdDocDelete(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 3) { System.out.println("Usage: doc delete <repos-id> <dir-path> <name>   (目录写 . 表示仓库根)"); return; }
        System.out.println(format(client.deleteDoc(parseInt(p[0]), null, null, dirPath(p[1]), p[2], null, null)));
    }
    
    private static void cmdDocRename(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 4) { System.out.println("Usage: doc rename <repos-id> <dir-path> <name> <new-name>"); return; }
        System.out.println(format(client.renameDoc(parseInt(p[0]), null, null, dirPath(p[1]), p[2], null, p[3], null)));
    }
    
    private static void cmdDocMove(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 4) { System.out.println("Usage: doc move <repos-id> <src-dir> <src-name> <dst-dir> [new-name]"); return; }
        String dstName = p.length > 4 ? p[4] : null;
        System.out.println(format(client.moveDoc(parseInt(p[0]), null, null, dirPath(p[1]), p[2], null,
                null, dirPath(p[3]), dstName, null, null, null)));
    }
    
    private static void cmdDocCopy(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 4) { System.out.println("Usage: doc copy <repos-id> <src-dir> <src-name> <dst-dir> [new-name]"); return; }
        String dstName = p.length > 4 ? p[4] : null;
        System.out.println(format(client.copyDoc(parseInt(p[0]), null, null, dirPath(p[1]), p[2], null,
                null, dirPath(p[3]), dstName, null, null, null)));
    }
    
    private static void cmdDocGet(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 3) { System.out.println("Usage: doc get <repos-id> <dir-path> <name>"); return; }
        System.out.println(format(client.getDoc(parseInt(p[0]), null, dirPath(p[1]), p[2])));
    }
    
    private static void cmdDocHistory(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 3) { System.out.println("Usage: doc history <repos-id> <dir-path> <name>"); return; }
        // level 传 null：让服务端自行规范化 path 并反推 level（传错 level 会静默定位到别的对象）
        System.out.println(format(client.getDocHistory(parseInt(p[0]), null, dirPath(p[1]), p[2],
                null, null, null, null)));
    }
    
    // ==================== FILE TRANSFER ====================
    
    private static void cmdUpload(String arg) throws Exception {
        String[] p = arg.split("\\s+", 2);
        if (p.length < 2) { System.out.println("Usage: upload <file> <repos-id>"); return; }
        
        File f = new File(p[0]);
        if (!f.exists()) { System.out.println("File not found: " + p[0]); return; }
        
        byte[] data = new byte[(int) f.length()];
        try (FileInputStream fis = new FileInputStream(f)) { fis.read(data); }
        
        System.out.println("Uploading " + f.getName() + " (" + data.length + " bytes)...");
        System.out.println(format(client.uploadFile(parseInt(p[1]), 0L, null, f.getName(), data, f.getName())));
    }
    
    private static void cmdDownload(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: download <repos-id> <doc-id>"); return; }
        System.out.println(format(client.downloadDoc(parseInt(p[0]), parseLong(p[1]), null, null)));
    }
    
    // ==================== LOCK ====================
    
    private static void cmdLock(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: lock <repos-id> <doc-id> [type]"); return; }
        Integer type = p.length > 2 ? parseInt(p[2]) : 1;
        System.out.println(format(client.lockDoc(parseInt(p[0]), parseLong(p[1]), null, null, type)));
    }
    
    private static void cmdUnlock(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 2) { System.out.println("Usage: unlock <repos-id> <doc-id>"); return; }
        System.out.println(format(client.unlockDoc(parseInt(p[0]), parseLong(p[1]), null, null)));
    }
    
    // ==================== SHARE ====================
    
    private static void cmdShareList(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        // R1-3：服务端 /Doc/getDocShareList.do 不接受任何参数（返回当前用户的全部分享）
        System.out.println(format(client.getDocShareList()));
    }

    private static void cmdShareCreate(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 3) { System.out.println("Usage: share create <repos-id> <dir-path> <name> [password] [hours]"); return; }
        String pwd = p.length > 3 ? p[3] : null;
        Long hours = p.length > 4 ? parseLong(p[4]) : null;
        // R1-2：真实端点是 /Bussiness/addDocShare.do（原 /Doc/createDocShare.do 不存在）
        System.out.println(format(client.addDocShare(parseInt(p[0]), dirPath(p[1]), p[2], pwd, hours)));
    }

    private static void cmdShareDelete(String arg) throws Exception {
        String[] p = arg.split("\\s+");
        if (p.length < 1) { System.out.println("Usage: share delete <share-id>"); return; }
        System.out.println(format(client.deleteDocShare(parseInt(p[0]))));
    }
    
    // ==================== SEARCH & AI ====================
    
    private static void cmdSearch(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: search <query> [repos-id]"); return; }
        String[] p = arg.split("\\s+", 2);
        Integer vid = p.length > 1 && !p[1].isEmpty() ? parseInt(p[1]) : null;
        System.out.println(format(client.searchDocs(p[0], vid)));
    }
    
    private static void cmdChat(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: chat <message> [model]"); return; }
        String[] p = arg.split("\\s+", 2);
        System.out.println("AI: " + client.chat(p[0], p.length > 1 ? p[1] : null));
    }
    
    private static void cmdRag(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: rag <query> [model]"); return; }
        String[] p = arg.split("\\s+", 2);
        System.out.println("RAG: " + client.ragChat(p[0], p.length > 1 ? p[1] : null, null));
    }
    
    // ==================== BACKUP ====================
    
    private static void cmdBackup(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: backup <repos-id> [path]"); return; }
        String[] p = arg.split("\\s+");
        System.out.println(format(client.backupRepos(parseInt(p[0]), p.length > 1 ? p[1] : null)));
    }
    
    private static void cmdBackupStatus(String arg) throws Exception {
        if (arg.isEmpty()) { System.out.println("Usage: backup-status <task-id>"); return; }
        System.out.println(format(client.queryBackupStatus(arg.trim())));
    }
    
    // ==================== SYSTEM ====================
    
    private static void cmdSystemConfig() throws Exception {
        System.out.println(format(client.getSystemConfig()));
    }
    
    private static void cmdBanner(String arg) throws Exception {
        System.out.println(format(client.getBannerConfig(arg.isEmpty() ? null : arg.trim())));
    }
    
    private static void cmdAiModels() throws Exception {
        System.out.println(format(client.getAiModelList()));
    }
    
    private static void cmdStatus() {
        System.out.println("URL: " + client.getBaseUrl());
        System.out.println("Logged in: " + client.isLoggedIn());
        if (client.isLoggedIn()) System.out.println("User: " + client.getCurrentUsername());
    }
    
    // ==================== COMMAND MODE ====================
    
    private static void runCommand(String[] args) {
        String cmd = args[0].toLowerCase();
        String arg = "";
        for (int i = 1; i < args.length; i++) arg += (arg.isEmpty() ? "" : " ") + args[i];
        
        try {
            handleCommand(cmd, arg);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
    
    // ==================== HELP ====================
    
    private static void printHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("╔════════════════════════════════════════════════════════════╗\n");
        sb.append("║              DocSys CLI v2.0 - Commands                   ║\n");
        sb.append("╠════════════════════════════════════════════════════════════╣\n");
        sb.append("\n");
        sb.append("USER:        login, logout, whoami, register\n");
        sb.append("REPOS:       repos list|add|delete|get|config\n");
        sb.append("DOC:         doc list|add|delete|rename|move|copy|get|history\n");
        sb.append("FILE:        upload, download\n");
        sb.append("LOCK:        lock, unlock\n");
        sb.append("SHARE:       share-list, share-create, share-delete\n");
        sb.append("SEARCH/AI:   search, chat, rag\n");
        sb.append("BACKUP:      backup, backup-status\n");
        sb.append("SYSTEM:      system-config, banner, models, status\n");
        sb.append("\n");
        sb.append("Examples:\n");
        sb.append("  login admin admin2026\n");
        sb.append("  repos list\n");
        sb.append("  repos add myrepo /data/repos\n");
        sb.append("  doc list 1\n");
        sb.append("  doc list 1 66666/          (子目录；根目录写 .)\n");
        sb.append("  doc get 1 . README.md      (按 path+name 定位，不用 docId)\n");
        sb.append("  doc add 1 myfolder\n");
        sb.append("  search \"report\"\n");
        sb.append("  chat \"list my files\"\n");
        sb.append("  upload report.pdf 1\n");
        sb.append("  lock 1 123\n");
        sb.append("  share create 1 123\n");
        sb.append("  backup 1\n");
        sb.append("\n");
        sb.append("╚════════════════════════════════════════════════════════════╝\n");
        System.out.println(sb.toString());
    }
    
    // ==================== HELPERS ====================
    
    private static String format(Map<String, Object> r) {
        if (r == null) return "No response";
        StringBuilder s = new StringBuilder();
        for (Map.Entry<String, Object> e : r.entrySet()) {
            s.append(e.getKey()).append("=").append(e.getValue()).append("\n");
        }
        return s.toString().trim();
    }
    
    private static Integer parseInt(String v) {
        try { return v == null ? null : Integer.parseInt(v.replaceAll("[^0-9-]", "")); }
        catch (Exception e) { return null; }
    }
    
    private static Long parseLong(String v) {
        try { return v == null ? null : Long.parseLong(v.replaceAll("[^0-9-]", "")); }
        catch (Exception e) { return null; }
    }
}
