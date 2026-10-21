package com.DocSystem.common;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileVisitOption;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import util.ReadProperties;

/**
 * MxsDoc 数据根目录（MxsDocDataRoot）的探测、派生与校验。
 *
 * 五个存储路径统一由根目录派生：
 *   <root>/DocSysReposes/
 *   <root>/DocSysDB/
 *   <root>/DocSysLog/SystemLog/
 *   <root>/DocSysSales/
 *   <root>/DocSysReposes/skills/
 *
 * 重装探测以 DocSysReposes/DBBackup/<yyyyMMddHHmmss>/ 为第一信号：
 * 自动备份是系统自己写的使用痕迹，比仓库文件的 mtime 更可靠，也更便宜。
 */
public class DataRootService {

    public static final String KEY_DATA_ROOT = "MxsDocDataRoot";

    public static final String DIR_REPOS = "DocSysReposes";
    public static final String DIR_DB = "DocSysDB";
    public static final String DIR_LOG = "DocSysLog";
    public static final String DIR_LOG_SUB = "SystemLog";
    public static final String DIR_SALES = "DocSysSales";
    public static final String DIR_SKILLS = "skills";
    public static final String DIR_BACKUP = "DBBackup";
    public static final String BACKUP_NAME = "docsystem_data";

    private static final long SCAN_TIME_BUDGET_MS = 2500L;
    private static final int SCAN_DIR_BUDGET = 40000;
    private static final int BACKUP_LIST_LIMIT = 5000;

    /** 派生五个存储路径（返回顺序与页面展示顺序一致） */
    public static LinkedHashMap<String, String> derivePaths(String root, int osType) {
        LinkedHashMap<String, String> paths = new LinkedHashMap<String, String>();
        String normalizedRoot = normalizeRoot(root, osType);
        if(normalizedRoot == null) {
            return paths;
        }

        String repos = normalizedRoot + DIR_REPOS + "/";
        String db = normalizedRoot + DIR_DB + "/";
        String log = normalizedRoot + DIR_LOG + "/" + DIR_LOG_SUB + "/";
        String sales = normalizedRoot + DIR_SALES + "/";
        String skills = repos + DIR_SKILLS + "/";

        paths.put("defaultReposStorePath", repos);
        paths.put("DBStorePath", db);
        paths.put("AgentSkillStorePath", skills);
        paths.put("SalesDataStorePath", sales);
        paths.put("SystemLogStorePath", log);
        return paths;
    }

    /** 规范化根目录（统一分隔符、末尾补 /） */
    public static String normalizeRoot(String root, int osType) {
        if(root == null) {
            return null;
        }
        String value = root.trim();
        if(value.isEmpty()) {
            return null;
        }
        return Path.localDirPathFormat(value, osType);
    }

    /** 是否为绝对路径（按目标 OS 判断，不依赖当前 JVM 所在平台） */
    public static boolean isAbsoluteRoot(String root, int osType) {
        if(root == null) {
            return false;
        }
        String value = root.trim().replace('\\', '/');
        if(OS.isWinOS(osType)) {
            if(value.matches("^[A-Za-z]:/.*")) {
                return true;
            }
            return value.startsWith("//");
        }
        return value.startsWith("/");
    }

    /** 当前配置的五个路径（用于把“当前配置根”也放进候选） */
    public static JSONObject getCurrentPaths() {
        JSONObject paths = new JSONObject();
        putIfNotEmpty(paths, "defaultReposStorePath", ReadProperties.read("docSysConfig.properties", "defaultReposStorePath"));
        putIfNotEmpty(paths, "DBStorePath", ReadProperties.read("docSysConfig.properties", "DBStorePath"));
        putIfNotEmpty(paths, "AgentSkillStorePath", ReadProperties.read("docSysConfig.properties", "AgentSkillStorePath"));
        putIfNotEmpty(paths, "SalesDataStorePath", ReadProperties.read("docSysConfig.properties", "SalesDataStorePath"));
        putIfNotEmpty(paths, "SystemLogStorePath", ReadProperties.read("docSysConfig.properties", "SystemLogStorePath"));
        putIfNotEmpty(paths, KEY_DATA_ROOT, ReadProperties.read("docSysConfig.properties", KEY_DATA_ROOT));
        return paths;
    }

    private static void putIfNotEmpty(JSONObject obj, String key, String value) {
        if(value != null && value.trim().isEmpty() == false) {
            obj.put(key, value);
        }
    }

    /**
     * 返回候选根目录、推荐根和扫描状态。
     *
     * @param osType  OS.Windows/Linux/MacOS
     * @param currentPaths 当前 docSysConfig 里的路径（可为 null）
     */
    public static JSONObject getCandidates(int osType, JSONObject currentPaths) {
        JSONObject result = new JSONObject();
        result.put("os", osName(osType));
        result.put("keyDataRoot", KEY_DATA_ROOT);

        LinkedHashMap<String, JSONObject> candidates = new LinkedHashMap<String, JSONObject>();
        Set<String> sources = new LinkedHashSet<String>();

        // 1) 当前配置根
        if(currentPaths != null) {
            for(Map.Entry<String, Object> entry : currentPaths.entrySet()) {
                String value = entry.getValue() == null ? null : String.valueOf(entry.getValue());
                if(KEY_DATA_ROOT.equals(entry.getKey())) {
                    addCandidate(candidates, value, "current", osType);
                } else {
                    String root = rootFromStorePath(value, osType);
                    if(root != null) {
                        addCandidate(candidates, root, "current", osType);
                    }
                }
            }
        }

        // 2) 扫描已有 DocSysReposes（DBBackup 为第一信号）
        boolean[] partial = new boolean[] { false };
        Set<String> scannedRoots = scanExistingRoots(osType, partial);
        for(String root : scannedRoots) {
            addCandidate(candidates, root, "existing", osType);
        }
        result.put("scanPartial", partial[0]);

        // 3) OS 默认新建根
        for(String root : getDefaultRoots(osType)) {
            addCandidate(candidates, root, "default", osType);
        }

        List<JSONObject> list = new ArrayList<JSONObject>(candidates.values());
        Collections.sort(list, new Comparator<JSONObject>() {
            @Override
            public int compare(JSONObject a, JSONObject b) {
                boolean ab = a.getBooleanValue("hasValidBackup");
                boolean bb = b.getBooleanValue("hasValidBackup");
                if(ab != bb) {
                    return ab ? -1 : 1;
                }
                if(ab) {
                    long at = a.getLongValue("lastBackupTime");
                    long bt = b.getLongValue("lastBackupTime");
                    if(at != bt) {
                        return at > bt ? -1 : 1;
                    }
                }
                int cmp = Long.compare(b.getLongValue("reposLastModified"), a.getLongValue("reposLastModified"));
                if(cmp != 0) {
                    return cmp;
                }
                boolean aw = a.getBooleanValue("writable");
                boolean bw = b.getBooleanValue("writable");
                if(aw != bw) {
                    return aw ? -1 : 1;
                }
                return a.getString("root").compareToIgnoreCase(b.getString("root"));
            }
        });

        String recommended = null;
        for(JSONObject c : list) {
            if(c.getBooleanValue("hasValidBackup")) {
                recommended = c.getString("root");
                break;
            }
        }
        if(recommended == null) {
            for(JSONObject c : list) {
                if(c.getBooleanValue("hasReposes")) {
                    recommended = c.getString("root");
                    break;
                }
            }
        }
        if(recommended == null) {
            for(JSONObject c : list) {
                if(c.getBooleanValue("writable")) {
                    recommended = c.getString("root");
                    break;
                }
            }
        }
        if(recommended == null && list.size() > 0) {
            recommended = list.get(0).getString("root");
        }

        JSONArray array = new JSONArray();
        for(JSONObject c : list) {
            boolean isRecommended = recommended != null && recommended.equals(c.getString("root"));
            c.put("recommended", isRecommended);
            array.add(c);
        }
        result.put("recommended", recommended == null ? "" : recommended);
        result.put("candidates", array);
        result.put("currentPaths", currentPaths == null ? new JSONObject() : currentPaths);
        return result;
    }

    private static void addCandidate(LinkedHashMap<String, JSONObject> map, String root, String source, int osType) {
        String normalized = normalizeRoot(root, osType);
        if(normalized == null) {
            return;
        }
        String key = OS.isWinOS(osType) ? normalized.toLowerCase(Locale.ROOT) : normalized;
        JSONObject existing = map.get(key);
        if(existing != null) {
            JSONArray sources = existing.getJSONArray("sources");
            if(sources == null) {
                sources = new JSONArray();
                existing.put("sources", sources);
            }
            boolean exists = false;
            for(int i=0; i<sources.size(); i++) {
                if(source.equals(String.valueOf(sources.get(i)))) {
                    exists = true;
                    break;
                }
            }
            if(exists == false) {
                sources.add(source);
            }
            if("current".equals(source)) {
                existing.put("isCurrent", true);
            }
            if("default".equals(source)) {
                existing.put("isDefault", true);
            }
            return;
        }
        JSONObject candidate = buildCandidate(normalized, source, osType);
        JSONArray sources = new JSONArray();
        sources.add(source);
        candidate.put("sources", sources);
        candidate.put("isCurrent", "current".equals(source));
        candidate.put("isDefault", "default".equals(source));
        map.put(key, candidate);
    }

    private static JSONObject buildCandidate(String root, String source, int osType) {
        JSONObject candidate = new JSONObject();
        candidate.put("root", root);
        candidate.put("source", source);

        File rootFile = new File(root);
        File repos = new File(rootFile, DIR_REPOS);
        File db = new File(rootFile, DIR_DB);
        File log = new File(rootFile, DIR_LOG);
        File sales = new File(rootFile, DIR_SALES);

        boolean hasReposes = repos.isDirectory();
        candidate.put("hasReposes", hasReposes);
        candidate.put("hasDB", db.isDirectory());
        candidate.put("hasLog", log.isDirectory());
        candidate.put("hasSales", sales.isDirectory());

        JSONArray existingDirs = new JSONArray();
        if(hasReposes) existingDirs.add(DIR_REPOS);
        if(db.isDirectory()) existingDirs.add(DIR_DB);
        if(log.isDirectory()) existingDirs.add(DIR_LOG);
        if(sales.isDirectory()) existingDirs.add(DIR_SALES);
        candidate.put("existingDirs", existingDirs);

        BackupInfo backup = readBackupInfo(repos);
        candidate.put("hasValidBackup", backup.hasValid);
        candidate.put("lastBackupTime", backup.lastTime);
        candidate.put("lastBackupDir", backup.lastDir);
        candidate.put("backupCount", backup.count);
        candidate.put("lastBackupTimeText", backup.lastTime > 0 ? formatTime(backup.lastTime) : "");
        candidate.put("reposLastModified", hasReposes ? repos.lastModified() : 0L);
        candidate.put("reposLastModifiedText", hasReposes ? formatTime(repos.lastModified()) : "");
        candidate.put("writable", testWritable(rootFile));
        candidate.put("paths", pathsToJson(derivePaths(root, osType)));
        candidate.put("recommended", false);
        return candidate;
    }

    private static JSONObject pathsToJson(LinkedHashMap<String, String> paths) {
        JSONObject obj = new JSONObject();
        for(Map.Entry<String, String> entry : paths.entrySet()) {
            obj.put(entry.getKey(), entry.getValue());
        }
        return obj;
    }

    private static BackupInfo readBackupInfo(File repos) {
        BackupInfo info = new BackupInfo();
        File backupDir = new File(repos, DIR_BACKUP);
        if(!backupDir.isDirectory()) {
            return info;
        }
        File[] entries = backupDir.listFiles();
        if(entries == null) {
            return info;
        }
        int checked = 0;
        for(File entry : entries) {
            if(entry == null || entry.isDirectory() == false) {
                continue;
            }
            if(++checked > BACKUP_LIST_LIMIT) {
                break;
            }
            File sql = new File(entry, BACKUP_NAME + ".sql");
            File json = new File(entry, BACKUP_NAME + ".json");
            boolean valid = (sql.isFile() && sql.length() > 0) || (json.isFile() && json.length() > 0);
            if(valid == false) {
                continue;
            }
            info.count++;
            long time = parseBackupTime(entry.getName());
            if(time <= 0) {
                time = entry.lastModified();
            }
            if(time > info.lastTime) {
                info.lastTime = time;
                info.lastDir = entry.getName();
            }
        }
        info.hasValid = info.lastTime > 0;
        return info;
    }

    private static long parseBackupTime(String name) {
        if(name == null || name.matches("^\\d{14}$") == false) {
            return 0L;
        }
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
            sdf.setLenient(false);
            Date date = sdf.parse(name);
            return date == null ? 0L : date.getTime();
        } catch(Exception e) {
            return 0L;
        }
    }

    private static String formatTime(long time) {
        if(time <= 0) {
            return "";
        }
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date(time));
    }

    /** 当前进程是否能写该目录（真实创建临时文件；不存在的根测试最近父目录） */
    public static boolean testWritable(File root) {
        if(root == null) {
            return false;
        }
        File probe = root;
        while(probe != null && probe.exists() == false) {
            probe = probe.getParentFile();
        }
        if(probe == null || probe.isDirectory() == false) {
            return false;
        }
        java.nio.file.Path temp = null;
        try {
            temp = Files.createTempFile(probe.toPath(), ".mxsdoc-write-test", ".tmp");
            return true;
        } catch(Exception e) {
            return false;
        } finally {
            if(temp != null) {
                try {
                    Files.deleteIfExists(temp);
                } catch(Exception e) {
                    Log.debug("DataRootService.testWritable() delete temp failed: " + e.getMessage());
                }
            }
        }
    }

    /** 校验根目录；checkWrite=true 时执行真实写测试 */
    public static JSONObject validateRoot(String root, int osType, String appPath, boolean checkWrite) {
        JSONObject result = new JSONObject();
        result.put("valid", false);
        String raw = root == null ? "" : root.trim();
        if(raw.isEmpty()) {
            result.put("error", "数据根目录不能为空");
            return result;
        }
        if(isAbsoluteRoot(raw, osType) == false) {
            result.put("error", "数据根目录必须是绝对路径");
            return result;
        }
        String normalized = normalizeRoot(raw, osType);
        if(normalized == null) {
            result.put("error", "数据根目录无效");
            return result;
        }
        result.put("root", normalized);

        File rootFile = new File(normalized);
        if(rootFile.exists() && rootFile.isDirectory() == false) {
            result.put("error", "数据根目录不是文件夹");
            return result;
        }

        JSONArray warnings = new JSONArray();
        JSONArray errors = new JSONArray();
        if(isFileSystemRoot(normalized, osType)) {
            warnings.add("当前选择的是系统根目录，建议使用专用的 MxsDocData 子目录");
        }
        String tomcatBase = System.getProperty("catalina.base");
        if(tomcatBase == null || tomcatBase.isEmpty()) {
            tomcatBase = System.getProperty("catalina.home");
        }
        if(isInside(appPath, normalized)) {
            errors.add("数据根目录不能位于 Web 应用目录内");
        }
        if(isInside(tomcatBase, normalized)) {
            errors.add("数据根目录不能位于 Tomcat 目录内");
        }

        LinkedHashMap<String, String> paths = derivePaths(normalized, osType);
        JSONObject pathsJson = new JSONObject();
        JSONObject pathStatus = new JSONObject();
        JSONArray existingDirs = new JSONArray();
        for(Map.Entry<String, String> entry : paths.entrySet()) {
            String key = entry.getKey();
            String path = entry.getValue();
            pathsJson.put(key, path);
            File file = new File(path);
            if(file.exists()) {
                if(file.isDirectory() == false) {
                    errors.add("路径不是文件夹: " + path);
                    pathStatus.put(key, "invalid");
                } else {
                    pathStatus.put(key, "existing");
                    existingDirs.add(displayDirName(key));
                }
            } else {
                File parent = file.getParentFile();
                while(parent != null && parent.exists() == false) {
                    parent = parent.getParentFile();
                }
                if(parent == null || parent.isDirectory() == false || testWritable(parent) == false) {
                    errors.add("目录不可创建或不可写: " + path);
                    pathStatus.put(key, "invalid");
                } else {
                    pathStatus.put(key, "create");
                }
            }
        }
        result.put("paths", pathsJson);
        result.put("pathStatus", pathStatus);
        result.put("existingDirs", existingDirs);
        result.put("warnings", warnings);

        boolean writable = checkWrite ? testWritable(rootFile) : isWritable(rootFile);
        result.put("writable", writable);
        if(writable == false) {
            errors.add("数据根目录不可写: " + normalized);
        }
        result.put("errors", errors);
        if(errors.size() > 0) {
            result.put("error", errors.getString(0));
            result.put("valid", false);
        } else {
            result.put("valid", true);
        }
        return result;
    }

    private static boolean isWritable(File root) {
        File probe = root;
        while(probe != null && probe.exists() == false) {
            probe = probe.getParentFile();
        }
        return probe != null && probe.isDirectory() && probe.canWrite();
    }

    private static String displayDirName(String key) {
        if("defaultReposStorePath".equals(key) || "AgentSkillStorePath".equals(key)) return DIR_REPOS;
        if("DBStorePath".equals(key)) return DIR_DB;
        if("SalesDataStorePath".equals(key)) return DIR_SALES;
        if("SystemLogStorePath".equals(key)) return DIR_LOG;
        return key;
    }

    private static boolean isFileSystemRoot(String root, int osType) {
        String value = root.replace('\\', '/');
        if(OS.isWinOS(osType)) {
            return value.matches("^[A-Za-z]:/$") || value.equals("//");
        }
        return "/".equals(value);
    }

    /** 判断 child 是否位于 parent 内（parent 为 null/空时返回 false） */
    public static boolean isInside(String parent, String child) {
        if(parent == null || parent.trim().isEmpty() || child == null || child.trim().isEmpty()) {
            return false;
        }
        try {
            File p = new File(parent).getCanonicalFile();
            File c = new File(child).getCanonicalFile();
            String pp = p.getPath();
            String cc = c.getPath();
            if(OS.isWinOS(BaseFunction.OSType)) {
                pp = pp.toLowerCase(Locale.ROOT);
                cc = cc.toLowerCase(Locale.ROOT);
            }
            if(pp.equals(cc)) {
                return true;
            }
            if(pp.endsWith(File.separator) == false) {
                pp += File.separator;
            }
            return cc.startsWith(pp);
        } catch(Exception e) {
            return false;
        }
    }

    private static String rootFromStorePath(String path, int osType) {
        if(path == null || path.trim().isEmpty()) {
            return null;
        }
        String p = path.replace('\\', '/');
        String[] markers = new String[] {
            "/" + DIR_REPOS + "/", "/" + DIR_DB + "/", "/" + DIR_LOG + "/", "/" + DIR_SALES + "/"
        };
        for(String marker : markers) {
            int idx = p.indexOf(marker);
            if(idx == 0) {
                return normalizeRoot("/", osType);
            }
            if(idx > 0) {
                return normalizeRoot(p.substring(0, idx + 1), osType);
            }
        }
        return Path.getParentPath(Path.localDirPathFormat(p, osType), 1, osType);
    }

    /** 默认新建根（按 OS 和当前用户） */
    public static List<String> getDefaultRoots(int osType) {
        LinkedHashSet<String> roots = new LinkedHashSet<String>();
        String userHome = System.getProperty("user.home");
        if(OS.isWinOS(osType)) {
            addRoot(roots, "C:/ProgramData/MxsDocData/", osType);
            if(userHome != null) addRoot(roots, userHome + "/MxsDocData/", osType);
            File[] drives = File.listRoots();
            if(drives != null) {
                for(File drive : drives) {
                    if(drive == null || drive.exists() == false) continue;
                    String name = drive.getPath();
                    if(name.equalsIgnoreCase("A:/") || name.equalsIgnoreCase("B:/")) continue;
                    addRoot(roots, name + "MxsDocData/", osType);
                }
            }
        } else if(osType == OS.MacOS) {
            if(userHome != null) {
                addRoot(roots, userHome + "/MxsDocData/", osType);
                addRoot(roots, userHome + "/data/MxsDocData/", osType);
            }
            addRoot(roots, "/opt/MxsDocData/", osType);
            addRoot(roots, "/usr/local/var/MxsDocData/", osType);
        } else {
            addRoot(roots, "/data/MxsDocData/", osType);
            if(userHome != null) addRoot(roots, userHome + "/MxsDocData/", osType);
            addRoot(roots, "/opt/MxsDocData/", osType);
            addRoot(roots, "/srv/MxsDocData/", osType);
        }
        return new ArrayList<String>(roots);
    }

    private static void addRoot(Set<String> roots, String root, int osType) {
        String normalized = normalizeRoot(root, osType);
        if(normalized != null) {
            roots.add(normalized);
        }
    }

    /** 扫描固定基座下的 DocSysReposes（不跟随符号链接） */
    private static Set<String> scanExistingRoots(int osType, boolean[] partial) {
        LinkedHashSet<String> roots = new LinkedHashSet<String>();
        ScanBudget budget = new ScanBudget(SCAN_TIME_BUDGET_MS, SCAN_DIR_BUDGET);
        List<BaseDir> bases = buildScanBases(osType);
        for(BaseDir base : bases) {
            if(budget.expired) {
                partial[0] = true;
                break;
            }
            scanBase(base, roots, budget);
        }
        if(budget.partial) {
            partial[0] = true;
        }
        return roots;
    }

    private static List<BaseDir> buildScanBases(int osType) {
        List<BaseDir> bases = new ArrayList<BaseDir>();
        String userHome = System.getProperty("user.home");
        if(OS.isWinOS(osType)) {
            File[] drives = File.listRoots();
            if(drives != null) {
                for(File drive : drives) {
                    if(drive == null || drive.exists() == false) continue;
                    String name = drive.getPath();
                    if(name.equalsIgnoreCase("A:/") || name.equalsIgnoreCase("B:/")) continue;
                    addBase(bases, drive.getAbsolutePath(), 2);
                }
            }
            addBase(bases, "C:/ProgramData", 3);
            if(userHome != null) addBase(bases, userHome, 3);
        } else if(osType == OS.MacOS) {
            addBase(bases, "/", 1);
            addBase(bases, "/Users", 3);
            addBase(bases, "/Volumes", 2);
            addBase(bases, "/opt", 3);
            addBase(bases, "/usr/local/var", 2);
            if(userHome != null) addBase(bases, userHome, 3);
        } else {
            addBase(bases, "/", 1);
            addBase(bases, "/data", 3);
            addBase(bases, "/opt", 3);
            addBase(bases, "/home", 3);
            addBase(bases, "/srv", 3);
            addBase(bases, "/mnt", 3);
            addBase(bases, "/media", 3);
            addBase(bases, "/var/lib", 3);
            if(userHome != null) addBase(bases, userHome, 3);
        }
        return bases;
    }

    private static void addBase(List<BaseDir> bases, String path, int depth) {
        if(path == null || path.trim().isEmpty()) return;
        File dir = new File(path);
        if(dir.isDirectory() == false) return;
        String key = dir.getAbsolutePath().toLowerCase(Locale.ROOT);
        for(BaseDir base : bases) {
            if(base.key.equals(key)) return;
        }
        bases.add(new BaseDir(dir, depth, key));
    }

    private static void scanBase(final BaseDir base, final Set<String> roots, final ScanBudget budget) {
        try {
            Files.walkFileTree(base.dir.toPath(), EnumSet.noneOf(FileVisitOption.class), base.depth,
                new SimpleFileVisitor<java.nio.file.Path>() {
                    @Override
                    public FileVisitResult preVisitDirectory(java.nio.file.Path dir, BasicFileAttributes attrs) {
                        budget.check();
                        if(dir.equals(base.dir.toPath()) == false) {
                            String name = dir.getFileName() == null ? "" : dir.getFileName().toString();
                            if(isMarker(name)) {
                                java.nio.file.Path parent = dir.getParent();
                                if(parent != null) {
                                    roots.add(normalizeRoot(parent.toString(), BaseFunction.OSType));
                                }
                                return FileVisitResult.SKIP_SUBTREE;
                            }
                            if(isSkipDir(name)) {
                                return FileVisitResult.SKIP_SUBTREE;
                            }
                        }
                        return FileVisitResult.CONTINUE;
                    }

                    @Override
                    public FileVisitResult visitFileFailed(java.nio.file.Path file, IOException exc) {
                        return FileVisitResult.CONTINUE;
                    }
                });
        } catch(ScanBudgetExceeded e) {
            budget.partial = true;
        } catch(Exception e) {
            Log.debug("DataRootService.scanBase() " + base.dir + " failed: " + e.getMessage());
        }
    }

    private static boolean isMarker(String name) {
        return DIR_REPOS.equalsIgnoreCase(name) || DIR_DB.equalsIgnoreCase(name)
            || DIR_LOG.equalsIgnoreCase(name) || DIR_SALES.equalsIgnoreCase(name);
    }

    private static boolean isSkipDir(String name) {
        if(name == null) return true;
        String n = name.toLowerCase(Locale.ROOT);
        return n.equals(".git") || n.equals(".svn") || n.equals("node_modules")
            || n.equals("proc") || n.equals("sys") || n.equals("dev") || n.equals("run")
            || n.equals("windows") || n.equals("program files") || n.equals("program files (x86)")
            || n.equals("$recycle.bin") || n.equals("system volume information")
            || n.equals("tmp") || n.equals("temp") || n.equals("cache");
    }

    private static String osName(int osType) {
        if(osType == OS.Windows) return "Windows";
        if(osType == OS.Linux) return "Linux";
        if(osType == OS.MacOS) return "MacOS";
        return "Unknown";
    }

    private static class BackupInfo {
        boolean hasValid;
        long lastTime;
        String lastDir;
        int count;
    }

    private static class BaseDir {
        File dir;
        int depth;
        String key;
        BaseDir(File dir, int depth, String key) {
            this.dir = dir;
            this.depth = depth;
            this.key = key;
        }
    }

    private static class ScanBudget {
        long deadline;
        int dirCount;
        int maxDirs;
        boolean expired;
        boolean partial;

        ScanBudget(long budgetMs, int maxDirs) {
            this.deadline = System.currentTimeMillis() + budgetMs;
            this.maxDirs = maxDirs;
        }

        void check() {
            dirCount++;
            if(dirCount > maxDirs || System.currentTimeMillis() > deadline) {
                expired = true;
                throw new ScanBudgetExceeded();
            }
        }
    }

    private static class ScanBudgetExceeded extends RuntimeException {
        private static final long serialVersionUID = 1L;
    }
}
