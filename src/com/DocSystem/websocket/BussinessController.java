package com.DocSystem.websocket;

import com.DocSystem.common.ActionContext;
import com.DocSystem.common.Base64Util;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.ActionType;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.CommonAction.DocType;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.IPUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.OS;
import com.DocSystem.common.Path;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.License;
import com.DocSystem.common.entity.LongTermTask;
import com.DocSystem.common.entity.MxsDocConfig;
import com.DocSystem.common.entity.PreferLink;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposPushResult;
import com.DocSystem.common.entity.SendResult;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.entity.SystemMigrateResult;
import com.DocSystem.common.entity.UserPreferServer;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.DocSystem.websocket.entity.DiskPath;
import com.DocSystem.websocket.entity.DocPullContext;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Scanner;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.util.Version;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import org.wltea.analyzer.lucene.IKAnalyzer;
import util.CADFileUtil;
import util.DateFormat;
import util.Encrypt.MD5;
import util.GitUtil.GITUtil;
import util.LuceneUtil.LuceneUtil2;
import util.ReturnAjax;


@Controller

@RequestMapping({"/Bussiness"})
public class BussinessController extends a {

    private static final boolean checkLicense = false;

    @RequestMapping({"/addRemoteDocShare.do"})
    public void addRemoteDocShare(Integer reposId, String path, String name, Integer userId, Integer isAdmin, Integer access, Integer editEn, Integer addEn, Integer deleteEn, Integer downloadEn, Integer heritable, String sharePwd, Long shareHours, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        Log.infoHead("************** addRemoteDocShare [" + path + name + "] ****************");
        Log.info("addRemoteDocShare reposId:" + reposId + " path:" + path + " name:" + name + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn + " deleteEn:" + deleteEn + " downloadEn:" + downloadEn + " heritable:" + heritable);
        ReturnAjax rt = new ReturnAjax();
        DocShare docShare = new DocShare();
        docShare.setVid(reposId);
        docShare.setPath(path);
        docShare.setName(name);
        docShare.setSharedBy(userId);
        docShare.setSharePwd(sharePwd);
        DocAuth docAuth = new DocAuth();
        docAuth.setIsAdmin(isAdmin);
        docAuth.setAccess(access);
        docAuth.setDownloadEn(downloadEn);
        docAuth.setAddEn(addEn);
        docAuth.setDeleteEn(deleteEn);
        docAuth.setEditEn(editEn);
        docAuth.setHeritable(heritable);
        String shareAuth = JSON.toJSONString(docAuth);
        docShare.setShareAuth(shareAuth);
        if (shareHours == null)
            shareHours = Long.valueOf(24L);
        docShare.setValidHours(shareHours);
        long curTime = (new Date()).getTime();
        long expireTime = curTime + shareHours.longValue() * 60L * 60L * 1000L;
        docShare.setExpireTime(Long.valueOf(expireTime));
        String requestIP = getRequestIpAddress(request);
        docShare.setRequestIP(requestIP);
        String proxyIP = IPUtil.getIpAddress();
        docShare.setProxyIP(proxyIP);
        Integer shareId = buildShareId(docShare);
        docShare.setShareId(shareId);
        if (this.reposService.addDocShare(docShare) == 0) {
            docSysErrorLog("创建文件分享失败！", rt);
        } else {
            rt.setData(docShare);
        }
        writeJson(rt, response);
        if (!isProxyThreadRuning(proxyThread))
            proxyThread = new ProxyThread();
    }


    private boolean isProxyThreadRuning(ProxyThread proxyThread) {
        if (proxyThread == null)
            return false;
        return true;

    }


    @RequestMapping({"/addDocShare.do"})
    public void addDocShare(String taskId, Integer reposId, String path, String name, Integer isAdmin, Integer access, Integer editEn, Integer addEn, Integer deleteEn, Integer downloadEn, Integer heritable, String sharePwd, Long shareHours, String mailSubject, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        Log.infoHead("************** addDocShare [" + path + name + "] ****************");
        Log.info("addDocShare reposId:" + reposId + " path:" + path + " name:" + name + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn + " deleteEn:" + deleteEn + " downloadEn:" + downloadEn + " heritable:" + heritable);
        ReturnAjax rt = new ReturnAjax();
        if (!systemLicenseInfoCheck(rt) && checkLicense) {
            writeJson(rt, response);
            return;
        }
        ReposAccess reposAccess = checkAndGetAccessInfoEx(null, null, null, session, request, response, reposId, path, name, true, rt);
        if (reposAccess == null) {
            writeJson(rt, response);
            return;
        }
        Repos repos = getReposEx(reposId);
        if (repos == null) {
            docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
            writeJson(rt, response);
            return;
        }
        String reposPath = Path.getReposPath(repos);
        String localRootPath = Path.getReposRealPath(repos);
        String localVRootPath = Path.getReposVirtualPath(repos);
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, Long.valueOf(0L), "");
        if (!checkUserShareRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt)) {
            writeJson(rt, response);
            return;

        }
        /*  210 */
        if (!checkUserAccessPwd(repos, doc, session, rt)) {
            /*  212 */
            writeJson(rt, response);

            return;

        }
        /*  216 */
        if (lang == null)
            /*  218 */ lang = "ch";
        /*  221 */
        DocShare docShare = new DocShare();
        /*  222 */
        docShare.setVid(doc.getVid());
        /*  223 */
        docShare.setReposName(repos.getName());
        /*  224 */
        docShare.setDocId(doc.getDocId());
        /*  225 */
        docShare.setPath(doc.getPath());
        /*  226 */
        docShare.setName(doc.getName());
        /*  227 */
        docShare.setSharedBy(reposAccess.getAccessUser().getId());
        /*  228 */
        docShare.setSharePwd(sharePwd);
        /*  230 */
        DocAuth docAuth = new DocAuth();
        /*  231 */
        docAuth.setIsAdmin(isAdmin);
        /*  232 */
        docAuth.setAccess(access);
        /*  233 */
        docAuth.setAddEn(addEn);
        /*  234 */
        docAuth.setDeleteEn(deleteEn);
        /*  235 */
        docAuth.setEditEn(editEn);
        /*  236 */
        docAuth.setDownloadEn(downloadEn);
        /*  237 */
        docAuth.setHeritable(heritable);
        /*  238 */
        String shareAuth = JSON.toJSONString(docAuth);
        /*  239 */
        docShare.setShareAuth(shareAuth);
        /*  240 */
        if (shareHours == null)
            /*  242 */ shareHours = Long.valueOf(24L);
        /*  244 */
        docShare.setValidHours(shareHours);
        /*  245 */
        long curTime = (new Date()).getTime();
        /*  246 */
        long expireTime = curTime + shareHours.longValue() * 60L * 60L * 1000L;
        /*  247 */
        docShare.setExpireTime(Long.valueOf(expireTime));
        /*  249 */
        Integer shareId = buildShareId(docShare);
        /*  250 */
        docShare.setShareId(shareId);
        /*  252 */
        String IpAddress = IPUtil.getIpAddress();
        /*  254 */
        String shareLink = null;
        /*  255 */
        if (this.reposService.addDocShare(docShare) == 0) {
            /*  257 */
            docSysErrorLog("创建文件分享失败！", rt);
            /*  258 */
            addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

        } else {
            /*  262 */
            shareLink = buildShareLink(request, IpAddress, reposId, shareId);
            /*  263 */
            docShare.shareLink = shareLink;
            /*  264 */
            rt.setData(docShare);
            /*  265 */
            rt.setDataEx(IpAddress);
            /*  267 */
            addSystemLog(request, reposAccess.getAccessUser(), "addDocShare", "addDocShare", "分享文件", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));

        }
        /*  269 */
        writeJson(rt, response);
        /*  271 */
        if (shareLink != null)
            /*  273 */ sendDocShareNotify(docShare, reposAccess.getAccessUser(), mailSubject);

    }


    private void sendDocShareNotify(DocShare docShare, User createUser, String mailSubject) {
        /*  279 */
        User qUser = new User();
        /*  280 */
        qUser.setName(createUser.getName());
        /*  281 */
        qUser.setId(createUser.getId());
        /*  282 */
        List<User> uList = this.userService.getUserListByUserInfo(qUser);
        /*  283 */
        if (uList == null || uList.size() == 0) {
            /*  285 */
            Log.info("sendDocShareNotify()", "用户" + createUser.getName() + " 不存在");

            return;

        }
        /*  289 */
        User emailToUser = uList.get(0);
        /*  290 */
        String email = emailToUser.getEmail();
        /*  291 */
        if (email == null || email.isEmpty()) {
            /*  293 */
            Log.info("sendDocShareNotify()", "用户邮箱未设置");

            return;

        }
        /*  297 */
        String content = "";

        String str1;
        /*  298 */
        switch ((str1 = lang).hashCode()) {

            case 3241:
                /*  298 */
                if (str1.equals("en")) {
                    /*  301 */
                    content =
                            /*  302 */             "[" + createUser.getName() + "] shared a document " +
                            /*  303 */             "<br>" +
                            /*  304 */             "<br>" +
                            /*  305 */             "<a href='" + docShare.shareLink + "' " +
                            /*  306 */             "style='width:50px; background: #0287c9; border: 10px solid #0287c9; border-left-width:36px; border-right-width:36px; padding: 0 10px; color:#ffffff!important; font-family: Verdana; font-size: 12px; text-align: center; text-decoration: none!important; text-decoration:none; text-transform:uppercase; display: block; font-weight: bold;' class='prods-left-in-cart-button-a' rel='noopener' target='_blank'>" +
                            /*  307 */             "<font color=\"#FFFFFF\">Access</font></a>" +
                            /*  308 */             "<br>" +
                            /*  309 */             "<br>";

                    break;

                }

            default:
                /*  312 */
                content =
                        /*  313 */           "[" + createUser.getName() + "]创建了文件分享！" +
                        /*  314 */           "<br>" +
                        /*  315 */           "<br>" +
                        /*  316 */           "<a href='" + docShare.shareLink + "' " +
                        /*  317 */           "style='width:50px; background: #0287c9; border: 10px solid #0287c9; border-left-width:36px; border-right-width:36px; padding: 0 10px; color:#ffffff!important; font-family: Verdana; font-size: 12px; text-align: center; text-decoration: none!important; text-decoration:none; text-transform:uppercase; display: block; font-weight: bold;' class='prods-left-in-cart-button-a' rel='noopener' target='_blank'>" +
                        /*  318 */           "<font color=\"#FFFFFF\">点击链接访问</font></a>" +
                        /*  319 */           "<br>" +
                        /*  320 */           "<br>";

                break;

        }
        /*  323 */
        String mailContent = channel.buildDocShareMailContent(content, lang);
        /*  325 */
        ReturnAjax rt = new ReturnAjax();
        /*  326 */
        this.emailService.sendEmail(rt, email, mailContent, mailSubject);

    }


    private String buildShareLink(HttpServletRequest request, String ipAddress, Integer reposId, Integer shareId) {
        /*  330 */
        URLInfo urlInfo = getUrlInfoFromRequest(request);
        /*  331 */
        String host = urlInfo.host;
        /*  332 */
        if (host.equals("localhost") && ipAddress != null && !ipAddress.isEmpty())
            /*  334 */ host = ipAddress;
        /*  337 */
        String link = null;
        /*  338 */
        if (urlInfo.port == null || urlInfo.port.isEmpty()) {
            /*  340 */
            link = String.valueOf(urlInfo.prefix) + host + "/DocSystem/web/project.html?vid=" + reposId + "&shareId=" + shareId;

        } else {
            /*  344 */
            link = String.valueOf(urlInfo.prefix) + host + ":" + urlInfo.port + "/DocSystem/web/project.html?vid=" + reposId + "&shareId=" + shareId;

        }
        /*  346 */
        return link;

    }


    private URLInfo getUrlInfoFromRequest(HttpServletRequest request) {
        /*  350 */
        String url = getUrlFromRequest(request);
        /*  351 */
        Log.info("getUrlInfoFromRequest()", "url:" + url);
        /*  352 */
        URLInfo urlInfo = getUrlInfoFromUrl(url);
        /*  353 */
        return urlInfo;

    }


    private String getUrlFromRequest(HttpServletRequest request) {
        /*  357 */
        String url = request.getRequestURL().toString();
        /*  358 */
        return url;

    }


    private Integer buildShareId(DocShare docShare) {
        /*  362 */
        return Integer.valueOf(docShare.hashCode());

    }


    @RequestMapping({"/updateDocShare.do"})
    public void updateDocShare(String taskId, Integer shareId, Integer isAdmin, Integer access, Integer editEn, Integer addEn, Integer deleteEn, Integer downloadEn, Integer heritable, String sharePwd, Long shareHours, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /*  374 */
        Log.infoHead("************** updateDocShare ****************");
        /*  375 */
        Log.info("updateDocShare() shareId:" + shareId + " sharePwd:" + sharePwd + " shareHours:" + shareHours + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn + " deleteEn:" + deleteEn + " downloadEn:" + downloadEn + " heritable:" + heritable);
        /*  377 */
        ReturnAjax rt = new ReturnAjax();
        /*  378 */
        ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
        /*  379 */
        if (reposAccess == null) {
            /*  381 */
            writeJson(rt, response);

            return;

        }
        /*  385 */
        DocShare docShare = getDocShare(shareId);
        /*  386 */
        if (docShare == null) {
            /*  388 */
            docSysErrorLog("分享信息不存在！", rt);
            /*  389 */
            writeJson(rt, response);

            return;

        }
        /*  393 */
        DocAuth docAuth = new DocAuth();
        /*  394 */
        docAuth.setIsAdmin(isAdmin);
        /*  395 */
        docAuth.setAccess(access);
        /*  396 */
        docAuth.setAddEn(addEn);
        /*  397 */
        docAuth.setDeleteEn(deleteEn);
        /*  398 */
        docAuth.setEditEn(editEn);
        /*  399 */
        docAuth.setDownloadEn(downloadEn);
        /*  400 */
        docAuth.setHeritable(heritable);
        /*  401 */
        String shareAuth = JSON.toJSONString(docAuth);
        /*  403 */
        docShare.setShareId(shareId);
        /*  404 */
        docShare.setShareAuth(shareAuth);
        /*  405 */
        if (shareHours == null)
            /*  407 */ shareHours = Long.valueOf(24L);
        /*  409 */
        docShare.setValidHours(shareHours);
        /*  410 */
        long curTime = (new Date()).getTime();
        /*  411 */
        long expireTime = curTime + shareHours.longValue() * 60L * 60L * 1000L;
        /*  412 */
        docShare.setExpireTime(Long.valueOf(expireTime));
        /*  413 */
        docShare.setSharePwd(sharePwd);
        /*  415 */
        if (this.reposService.updateDocShare(docShare) == 0) {
            /*  417 */
            docSysErrorLog("更新文件分享失败！", rt);

        } else {
            /*  421 */
            rt.setData(docShare);

        }
        /*  423 */
        writeJson(rt, response);
        /*  425 */
        addSystemLog(request, reposAccess.getAccessUser(), "updateDocShare", "updateDocShare", "修改文件分享", taskId, "成功", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());

    }


    @RequestMapping({"/deleteDocShare.do"})
    public void deleteDocShare(String taskId, Integer shareId, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /*  434 */
        Log.infoHead("************** deleteDocShare ****************");
        /*  435 */
        Log.info("deleteDocShare() shareId:" + shareId);
        /*  437 */
        ReturnAjax rt = new ReturnAjax();
        /*  438 */
        ReposAccess reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, false, rt);
        /*  439 */
        if (reposAccess == null) {
            /*  441 */
            writeJson(rt, response);

            return;

        }
        /*  445 */
        if (shareId == null) {
            /*  447 */
            docSysErrorLog("文件分享信息不能为空！", rt);
            /*  448 */
            writeJson(rt, response);

            return;

        }
        /*  452 */
        DocShare docShare = getDocShare(shareId);
        /*  453 */
        if (docShare == null) {
            /*  455 */
            docSysErrorLog("分享信息不存在！", rt);
            /*  456 */
            writeJson(rt, response);

            return;

        }
        /*  460 */
        DocShare qDocShare = new DocShare();
        /*  461 */
        qDocShare.setShareId(shareId);
        /*  462 */
        if (this.reposService.deleteDocShare(qDocShare) == 0) {
            /*  464 */
            docSysErrorLog("删除文件分享失败！", rt);
            /*  465 */
            addSystemLog(request, reposAccess.getAccessUser(), "deleteDocShare", "deleteDocShare", "删除文件分享", taskId, "失败", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());

        } else {
            /*  469 */
            addSystemLog(request, reposAccess.getAccessUser(), "deleteDocShare", "deleteDocShare", "删除文件分享", taskId, "成功", null, null, null, docShare.getVid() + "::" + docShare.getPath() + docShare.getName());

        }
        /*  471 */
        writeJson(rt, response);

    }


    @RequestMapping({"/docShareSendMail.do"})
    public void docShareSendMail(String url, String mailList, String mailSubject, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  479 */
        Log.infoHead("************** docShareSendMail ****************");
        /*  480 */
        Log.info("docShareSendMail shareLink:" + url + " mailList:" + mailList + " mailSubject:" + mailSubject);
        /*  482 */
        ReturnAjax rt = new ReturnAjax();
        /*  484 */
        ReposAccess reposAccess = null;
        /*  485 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  486 */
        if (reposAccess == null) {
            /*  488 */
            Log.debug("docShareSendMail reposAccess is null");
            /*  489 */
            rt.setError("非法访问");
            /*  490 */
            writeJson(rt, response);

            return;

        }
        /*  494 */
        SendResult sendResult = new SendResult();
        /*  495 */
        sendResult.successCount = Integer.valueOf(0);
        /*  496 */
        sendResult.failCount = Integer.valueOf(0);
        /*  497 */
        sendResult.totalCount = Integer.valueOf(0);
        /*  498 */
        sendDocShareLinkByEmail(url, reposAccess.getAccessUser().getName(), mailList, mailSubject, sendResult, rt);
        /*  499 */
        rt.setData(sendResult);
        /*  500 */
        writeJson(rt, response);

    }


    private void sendDocShareLinkByEmail(String shareLink, String fromUser, String toMailList, String mailSubject, SendResult sendResult, ReturnAjax rt) {
        /*  507 */
        String[] mails = toMailList.split(";");
        /*  509 */
        String mailContent = buildDocShareMailContent(shareLink, fromUser, lang);
        /*  511 */
        for (int i = 0; i < mails.length; i++) {
            /*  513 */
            String mail = mails[i].trim();
            /*  514 */
            Log.debug("sendDocShareLinkByEmail toMail:[" + mail + "]");
            /*  515 */
            if (!mail.isEmpty()) {
                /*  517 */
                sendResult.totalCount = Integer.valueOf(sendResult.totalCount.intValue() + 1);
                /*  518 */
                if (sendDocShareLinkByMail(mail, mailContent, mailSubject)) {
                    /*  520 */
                    sendResult.successCount = Integer.valueOf(sendResult.successCount.intValue() + 1);

                } else {
                    /*  524 */
                    sendResult.failCount = Integer.valueOf(sendResult.failCount.intValue() + 1);

                }

            }

        }

    }


    private String buildDocShareMailContent(String shareLink, String fromUser, String lang) {
        /*  531 */
        String content = "";

        String str1;
        /*  532 */
        switch ((str1 = lang).hashCode()) {

            case 3241:
                /*  532 */
                if (!str1.equals("en"))
                    break;
                /*  535 */
                content =
                        /*  536 */           "<br><br>[" +

                        /*  538 */           fromUser + "] shared a document to you " +
                        /*  539 */           "<br>" +
                        /*  540 */           "<br>" +
                        /*  541 */           "<a href='" + shareLink + "' " +
                        /*  542 */           "style='width:50px; background: #0287c9; border: 10px solid #0287c9; border-left-width:36px; border-right-width:36px; padding: 0 10px; color:#ffffff!important; font-family: Verdana; font-size: 12px; text-align: center; text-decoration: none!important; text-decoration:none; text-transform:uppercase; display: block; font-weight: bold;' class='prods-left-in-cart-button-a' rel='noopener' target='_blank'>" +
                        /*  543 */           "<font color=\"#FFFFFF\">Access</font></a>" +
                        /*  544 */           "<br>" +
                        /*  545 */           "<br>";
                /*  561 */
                return channel.buildDocShareMailContent(content, lang);

        }

        content = "<br><br>[" + fromUser + "]给您分享了文件！" + "<br>" + "<br>" + "<a href='" + shareLink + "' " + "style='width:50px; background: #0287c9; border: 10px solid #0287c9; border-left-width:36px; border-right-width:36px; padding: 0 10px; color:#ffffff!important; font-family: Verdana; font-size: 12px; text-align: center; text-decoration: none!important; text-decoration:none; text-transform:uppercase; display: block; font-weight: bold;' class='prods-left-in-cart-button-a' rel='noopener' target='_blank'>" + "<font color=\"#FFFFFF\">点击链接访问</font></a>" + "<br>" + "<br>";
        /*  561 */
        return channel.buildDocShareMailContent(content, lang);

    }


    private boolean sendDocShareLinkByMail(String toMail, String mailContent, String mailSubject) {
        /*  566 */
        ReturnAjax rt = new ReturnAjax();
        /*  567 */
        return this.emailService.sendEmail(rt, toMail, mailContent, mailSubject);

    }


    @RequestMapping({"/addUserPreferServer.do"})
    public void addUserPreferServer(String serverType, String serverUrl, String userName, String pwd, String serverName, String params, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  576 */
        Log.infoHead("************** addUserPreferServer [" + serverUrl + "] ****************");
        /*  577 */
        Log.debug("addUserPreferServer() serverType:" + serverType + " serverUrl:" + serverUrl + " userName:" + userName + " pwd:" + pwd +
                /*  578 */         " serverName:" + serverName + " params:" + params);
        /*  580 */
        ReturnAjax rt = new ReturnAjax();
        /*  582 */
        ReposAccess reposAccess = null;
        /*  583 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  584 */
        if (reposAccess == null) {
            /*  586 */
            Log.debug("addUserPreferServert reposAccess is null");
            /*  587 */
            rt.setError("非法访问");
            /*  588 */
            writeJson(rt, response);

            return;

        }
        /*  592 */
        UserPreferServer server = new UserPreferServer();
        /*  593 */
        server.createTime = Long.valueOf((new Date()).getTime());
        /*  594 */
        server.userId = reposAccess.getAccessUser().getId();
        /*  595 */
        server.userName = reposAccess.getAccessUser().getName();
        /*  596 */
        server.id = server.userId + "_" + serverUrl.hashCode() + "_" + server.createTime;
        /*  598 */
        server.serverType = serverType;
        /*  599 */
        server.serverUrl = serverUrl;
        /*  600 */
        server.serverUserName = userName;
        /*  601 */
        server.serverUserPwd = pwd;
        /*  602 */
        server.params = params;
        /*  604 */
        if (!parseUserPreferServer(server, rt)) {
            /*  606 */
            Log.debug("addUserPreferServert server config error");
            /*  607 */
            rt.setError("服务器配置错误");
            /*  608 */
            writeJson(rt, response);

            return;

        }
        /*  612 */
        String indexLib = getIndexLibPathForUserPreferServer();
        /*  613 */
        if (!addUserPreferServerIndex(server, indexLib)) {
            /*  615 */
            Log.debug("addUserPreferServert addUserPreferServer Failed");
            /*  616 */
            rt.setError("添加常用服务器失败");
            /*  617 */
            writeJson(rt, response);

            return;

        }
        /*  621 */
        rt.setData(server);
        /*  622 */
        writeJson(rt, response);

    }


    private boolean parseUserPreferServer(UserPreferServer server, ReturnAjax rt) {
        /*  628 */
        String remoteStorage = null;

        String str1;
        /*  629 */
        switch ((str1 = server.serverType).hashCode()) {

            case -1060041712:
                /*  629 */
                if (str1.equals("mxsdoc")) {
                    /*  632 */
                    if (server.serverUrl.startsWith("http://") || server.serverUrl.startsWith("https://")) {
                        /*  634 */
                        remoteStorage = "mxsdoc://" + server.serverUrl;

                        break;

                    }
                    /*  638 */
                    docSysErrorLog("服务器地址格式错误", rt);
                    /*  639 */
                    return false;

                }

            case 101730:

                if (str1.equals("ftp")) {
                    /*  643 */
                    if (server.serverUrl.startsWith("ftp://")) {
                        /*  645 */
                        remoteStorage = server.serverUrl;

                        break;

                    }
                    /*  649 */
                    docSysErrorLog("服务器地址格式错误", rt);
                    /*  650 */
                    return false;

                }

            case 102354:

                if (str1.equals("git")) {
                    /*  680 */
                    if (!server.serverUrl.startsWith("http://") &&
                            /*  681 */             !server.serverUrl.startsWith("https://") &&
                            /*  682 */             !server.serverUrl.startsWith("file://") &&
                            /*  683 */             !server.serverUrl.startsWith("ssh://") &&
                            /*  684 */             !server.serverUrl.startsWith("git://")) {
                        /*  686 */
                        docSysErrorLog("服务器地址格式错误", rt);
                        /*  687 */
                        return false;

                    }
                    /*  689 */
                    remoteStorage = "git://" + server.serverUrl;

                    break;

                }

            case 113992:

                if (str1.equals("smb")) {

                    if (server.serverUrl.startsWith("smb://")) {

                        remoteStorage = server.serverUrl;

                        break;

                    }

                    if (server.serverUrl.startsWith("\\\\")) {

                        remoteStorage = "smb:" + server.serverUrl.replace("\\", "/");

                        break;

                    }

                    docSysErrorLog("服务器地址格式错误", rt);

                    return false;

                }

            case 114283:

                if (str1.equals("svn")) {
                    /*  692 */
                    if (!server.serverUrl.startsWith("http://") &&
                            /*  693 */             !server.serverUrl.startsWith("https://") &&
                            /*  694 */             !server.serverUrl.startsWith("file://") &&
                            /*  695 */             !server.serverUrl.startsWith("ssh://") &&
                            /*  696 */             !server.serverUrl.startsWith("svn://")) {
                        /*  698 */
                        docSysErrorLog("服务器地址格式错误", rt);
                        /*  699 */
                        return false;

                    }
                    /*  701 */
                    remoteStorage = "svn://" + server.serverUrl;

                    break;

                }

            case 3527695:

                if (str1.equals("sftp")) {

                    if (server.serverUrl.startsWith("sftp://")) {

                        remoteStorage = server.serverUrl;

                        break;

                    }

                    docSysErrorLog("服务器地址格式错误", rt);

                    return false;

                }

            default:
                /*  704 */
                docSysErrorLog("未知文件服务器类型[" + server.serverType + "]", rt);
                /*  705 */
                return false;

        }
        /*  708 */
        if (server.params != null)
            /*  710 */ remoteStorage = String.valueOf(remoteStorage) + ";" + server.params;
        /*  713 */
        String localVerReposPathForGit = String.valueOf(Path.getDefaultReposRootPath(Integer.valueOf(OSType))) + "tmp/UserPreferServer-" + server.id + "/LocalGitRepos/";
        /*  714 */
        RemoteStorageConfig remote = parseRemoteStorageConfig(remoteStorage, localVerReposPathForGit);
        /*  715 */
        if (remote == null) {
            /*  717 */
            docSysErrorLog("服务器配置解析失败", rt);
            /*  718 */
            return false;

        }

        String str2;
        /*  721 */
        switch ((str2 = remote.protocol).hashCode()) {

            case -1060041712:
                /*  721 */
                if (!str2.equals("mxsdoc"))
                    break;
                /*  724 */
                server.url = remote.MXSDOC.url;
                /*  725 */
                server.reposId = remote.MXSDOC.reposId;
                /*  726 */
                server.remoteDirectory = remote.MXSDOC.remoteDirectory;

                break;

            case 101730:

                if (!str2.equals("ftp"))
                    break;
                /*  729 */
                server.host = remote.FTP.host;
                /*  730 */
                server.port = remote.FTP.port;
                /*  731 */
                server.charset = remote.FTP.charset;
                /*  732 */
                server.passiveMode = Integer.valueOf(remote.FTP.isPassive.booleanValue() ? 1 : 0);

                break;

            case 102354:

                if (!str2.equals("git"))
                    break;
                /*  744 */
                server.url = remote.GIT.url;
                /*  745 */
                server.isRemote = remote.GIT.isRemote;
                /*  746 */
                server.localVerReposPath = remote.GIT.localVerReposPath;

                break;

            case 113992:

                if (!str2.equals("smb"))
                    break;

                server.host = remote.SMB.host;

                server.port = remote.SMB.port;

                server.serverUserDomain = remote.SMB.userDomain;

                break;

            case 114283:

                if (!str2.equals("svn"))
                    break;
                /*  749 */
                server.url = remote.SVN.url;
                /*  750 */
                server.isRemote = remote.SVN.isRemote;

                break;

            case 3527695:

                if (!str2.equals("sftp"))
                    break;

                server.host = remote.SFTP.host;

                server.port = remote.SFTP.port;

                break;

        }
        /*  754 */
        return true;

    }


    @RequestMapping({"/editUserPreferServer.do"})
    public void editUserPreferServer(String serverId, String serverType, String serverUrl, String userName, String pwd, String serverName, String params, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  762 */
        Log.infoHead("************** editUserPreferServer [" + serverUrl + "] ***************");
        /*  763 */
        Log.debug("editUserPreferServer() serverType:" + serverType + " serverUrl:" + serverUrl + " userName:" + userName + " pwd:" + pwd +
                /*  764 */         " serverName:" + serverName + " params:" + params);
        /*  766 */
        ReturnAjax rt = new ReturnAjax();
        /*  768 */
        ReposAccess reposAccess = null;
        /*  769 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  770 */
        if (reposAccess == null) {
            /*  772 */
            Log.debug("editUserPreferServer reposAccess is null");
            /*  773 */
            rt.setError("非法访问");
            /*  774 */
            writeJson(rt, response);

            return;

        }
        /*  778 */
        UserPreferServer server = getUserPreferServer(serverId);
        /*  779 */
        if (server == null) {
            /*  781 */
            Log.debug("editUserPreferServer() 服务器[" + serverId + "] 不存在");
            /*  782 */
            rt.setError("服务器不存在！");
            /*  783 */
            writeJson(rt, response);

            return;

        }
        /*  788 */
        if (serverUrl != null)
            /*  790 */ server.serverUrl = serverUrl;
        /*  793 */
        if (serverType != null)
            /*  795 */ server.serverType = serverType;
        /*  798 */
        if (serverName != null)
            /*  800 */ server.serverName = serverName;
        /*  803 */
        if (userName != null)
            /*  805 */ server.serverUserName = userName;
        /*  808 */
        if (pwd != null)
            /*  810 */ server.serverUserPwd = pwd;
        /*  813 */
        if (params != null)
            /*  815 */ server.params = params;
        /*  818 */
        if (!parseUserPreferServer(server, rt)) {
            /*  820 */
            Log.debug("editUserPreferServer server config error");
            /*  821 */
            rt.setError("服务器配置错误");
            /*  822 */
            writeJson(rt, response);

            return;

        }
        /*  826 */
        if (!editUserPreferServer(server)) {
            /*  828 */
            Log.debug("editUserPreferServer editUserPreferServer Failed");
            /*  829 */
            rt.setError("修改服务器失败");
            /*  830 */
            writeJson(rt, response);

            return;

        }
        /*  833 */
        rt.setData(server);
        /*  834 */
        writeJson(rt, response);

    }


    @RequestMapping({"/deleteUserPreferServer.do"})
    public void deleteUserPreferServer(String serverId, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  841 */
        Log.infoHead("************** deleteUserPreferServer [" + serverId + "] ****************");
        /*  843 */
        ReturnAjax rt = new ReturnAjax();
        /*  844 */
        ReposAccess reposAccess = null;
        /*  845 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  846 */
        if (reposAccess == null) {
            /*  848 */
            Log.debug("deleteUserPreferServer reposAccess is null");
            /*  849 */
            rt.setError("非法访问");
            /*  850 */
            writeJson(rt, response);

            return;

        }
        /*  854 */
        if (!deleteUserPreferServer(serverId)) {
            /*  856 */
            Log.debug("deleteUserPreferServer deleteUserPreferServer Failed");
            /*  857 */
            rt.setError("删除失败");
            /*  858 */
            writeJson(rt, response);

            return;

        }
        /*  861 */
        writeJson(rt, response);

    }


    @RequestMapping({"/getUserPreferServerList.do"})
    public void getUserPreferServerList(HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  867 */
        Log.infoHead("************** getUserPreferServerList ****************");
        /*  869 */
        ReturnAjax rt = new ReturnAjax();
        /*  871 */
        ReposAccess reposAccess = null;
        /*  872 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  873 */
        if (reposAccess == null) {
            /*  875 */
            Log.debug("getUserPreferServerList reposAccess is null");
            /*  876 */
            rt.setError("非法访问");
            /*  877 */
            writeJson(rt, response);

            return;

        }
        /*  881 */
        List<UserPreferServer> list = getUserPreferServerList(reposAccess.getAccessUser());
        /*  882 */
        rt.setData(list);
        /*  883 */
        writeJson(rt, response);

    }


    private List<UserPreferServer> getUserPreferServerList(User accessUser) {
        /*  887 */
        UserPreferServer queryServerInfo = new UserPreferServer();
        /*  888 */
        queryServerInfo.userId = accessUser.getId();
        /*  890 */
        QueryResult queryResult = new QueryResult();
        /*  891 */
        List<UserPreferServer> list = getUserPreferServerList(queryServerInfo, queryResult);
        /*  892 */
        return list;

    }


    @RequestMapping({"/addPreferLink.do"})
    public void addPreferLink(String url, String name, String content, Integer type, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  900 */
        Log.infoHead("************** addPreferLink [" + url + "] ****************");
        /*  902 */
        ReturnAjax rt = new ReturnAjax();
        /*  904 */
        ReposAccess reposAccess = null;
        /*  905 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  906 */
        if (reposAccess == null) {
            /*  908 */
            Log.error("addPreferLink reposAccess is null");
            /*  909 */
            rt.setError("非法访问");
            /*  910 */
            writeJson(rt, response);

            return;

        }
        /*  915 */
        URLInfo urlInfo = getUrlInfoFromUrl(url);
        /*  916 */
        if (urlInfo == null) {
            /*  918 */
            Log.error("addPreferLink 网址格式错误");
            /*  919 */
            rt.setError("网站地址格式错误");
            /*  920 */
            writeJson(rt, response);

            return;

        }
        /*  924 */
        PreferLink server = addPreferLink(url, name, content, type, reposAccess.getAccessUser());
        /*  925 */
        if (server == null) {
            /*  927 */
            Log.debug("addPreferLink addPreferLink Failed");
            /*  928 */
            rt.setError("添加网址失败");
            /*  929 */
            writeJson(rt, response);

            return;

        }
        /*  932 */
        rt.setData(server);
        /*  933 */
        writeJson(rt, response);

    }


    @RequestMapping({"/editPreferLink.do"})
    public void editPreferLink(String linkId, String url, String name, String content, Integer type, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /*  940 */
        Log.infoHead("************** editPreferLink [" + url + "] ****************");
        /*  942 */
        ReturnAjax rt = new ReturnAjax();
        /*  944 */
        ReposAccess reposAccess = null;
        /*  945 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /*  946 */
        if (reposAccess == null) {
            /*  948 */
            Log.debug("editPreferLink reposAccess is null");
            /*  949 */
            rt.setError("非法访问");
            /*  950 */
            writeJson(rt, response);

            return;

        }
        /*  954 */
        PreferLink link = b.getPreferLink(linkId);
        /*  955 */
        if (link == null) {
            /*  957 */
            Log.debug("editPreferLink() 网站 " + linkId + " 不存在");
            /*  958 */
            rt.setError("网站不存在！");
            /*  959 */
            writeJson(rt, response);

            return;

        }
        /*  964 */
        if (url != null) {
            /*  967 */
            URLInfo urlInfo = getUrlInfoFromUrl(url);
            /*  968 */
            if (urlInfo == null) {
                /*  970 */
                Log.debug("editPreferLink 网址格式错误");
                /*  971 */
                rt.setError("网站地址格式错误");
                /*  972 */
                writeJson(rt, response);

                return;

            }
            /*  975 */
            link.url = url;

        }
        /*  978 */
        if (name != null)
            /*  980 */ link.name = name;
        /*  983 */
        if (content != null)
            /*  985 */ link.content = content;
        /*  988 */
        if (type != null)
            /*  990 */ link.type = type;
        /*  993 */
        if (!editPreferLink(link)) {
            /*  995 */
            Log.debug("editPreferLink editPreferLink Failed");
            /*  996 */
            rt.setError("修改网站信息失败");
            /*  997 */
            writeJson(rt, response);

            return;

        }
        /* 1000 */
        rt.setData(link);
        /* 1001 */
        writeJson(rt, response);

    }


    @RequestMapping({"/deletePreferLink.do"})
    public void deletePreferLink(String linkId, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1009 */
        Log.infoHead("************** deletePreferLink [" + linkId + "] ****************");
        /* 1011 */
        ReturnAjax rt = new ReturnAjax();
        /* 1012 */
        ReposAccess reposAccess = null;
        /* 1013 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /* 1014 */
        if (reposAccess == null) {
            /* 1016 */
            Log.debug("deletePreferLink reposAccess is null");
            /* 1017 */
            rt.setError("非法访问");
            /* 1018 */
            writeJson(rt, response);

            return;

        }
        /* 1022 */
        if (!deletePreferLink(linkId)) {
            /* 1024 */
            Log.debug("deletePreferLink deletePreferLink Failed");
            /* 1025 */
            rt.setError("删除失败");
            /* 1026 */
            writeJson(rt, response);

            return;

        }
        /* 1029 */
        writeJson(rt, response);

    }


    @RequestMapping({"/getPreferLinkList.do"})
    public void getPreferLinkList(String searchWord, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1037 */
        Log.infoHead("************** getPreferLinkList ****************");
        /* 1038 */
        Log.info("getPreferLinkList searchWord:" + searchWord);
        /* 1040 */
        ReturnAjax rt = new ReturnAjax();
        /* 1042 */
        ReposAccess reposAccess = null;
        /* 1043 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /* 1044 */
        if (reposAccess == null) {
            /* 1046 */
            Log.debug("getPreferLinkList reposAccess is null");
            /* 1047 */
            rt.setError("非法访问");
            /* 1048 */
            writeJson(rt, response);

            return;

        }
        /* 1053 */
        PreferLink queryInfo = new PreferLink();
        /* 1054 */
        queryInfo.userId = reposAccess.getAccessUser().getId();
        /* 1055 */
        BooleanQuery query = buildBooleanQueryForPreferLink(queryInfo);
        /* 1058 */
        if (searchWord != null && !searchWord.isEmpty()) {
            /* 1060 */
            PreferLink queryInfo2 = new PreferLink();
            /* 1061 */
            queryInfo2.name = searchWord;
            /* 1062 */
            queryInfo2.url = searchWord;
            /* 1063 */
            queryInfo2.content = searchWord;
            /* 1064 */
            BooleanQuery query2 = buildBooleanQueryForPreferLinkLike(queryInfo2);
            /* 1065 */
            query.add((Query) query2, BooleanClause.Occur.MUST);

        }
        /* 1069 */
        Sort sort = new Sort();
        /* 1070 */
        SortField field = new SortField("createTime", SortField.Type.LONG, false);
        /* 1071 */
        sort.setSort(field);
        /* 1073 */
        String indexLib = getIndexLibPathForPreferLink();
        /* 1074 */
        List<PreferLink> list = multiQueryForPreferLink(query, indexLib, sort);
        /* 1075 */
        rt.setData(list);
        /* 1076 */
        writeJson(rt, response);

    }


    @RequestMapping({"/getSharedPreferLinkList.do"})
    public void getSharedPreferLinkList(String userId, String searchWord, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1084 */
        Log.infoHead("************** getSharedPreferLinkList ****************");
        /* 1085 */
        Log.info("getPreferLinkList userId:" + userId + "searchWord:" + searchWord);
        /* 1087 */
        ReturnAjax rt = new ReturnAjax();
        /* 1089 */
        ReposAccess reposAccess = null;
        /* 1090 */
        reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);
        /* 1091 */
        if (reposAccess == null) {
            /* 1093 */
            Log.debug("getPreferLinkList reposAccess is null");
            /* 1094 */
            rt.setError("非法访问");
            /* 1095 */
            writeJson(rt, response);

            return;

        }
        /* 1102 */
        Query anyUserShareQuery = buildAnyUserShareQuery();
        /* 1103 */
        Query userShareQuery = buildUserShareQuery(userId);
        /* 1104 */
        BooleanQuery query1 = new BooleanQuery();
        /* 1105 */
        query1.add(anyUserShareQuery, BooleanClause.Occur.SHOULD);
        /* 1106 */
        query1.add(userShareQuery, BooleanClause.Occur.SHOULD);
        /* 1108 */
        BooleanQuery query = new BooleanQuery();
        /* 1109 */
        query.add((Query) query1, BooleanClause.Occur.MUST);
        /* 1112 */
        if (searchWord != null && !searchWord.isEmpty()) {
            /* 1114 */
            PreferLink queryInfo2 = new PreferLink();
            /* 1115 */
            queryInfo2.name = searchWord;
            /* 1116 */
            queryInfo2.url = searchWord;
            /* 1117 */
            queryInfo2.content = searchWord;
            /* 1118 */
            BooleanQuery query2 = buildBooleanQueryForPreferLinkLike(queryInfo2);
            /* 1119 */
            query.add((Query) query2, BooleanClause.Occur.MUST);

        }
        /* 1123 */
        Sort sort = new Sort();
        /* 1124 */
        SortField field = new SortField("createTime", SortField.Type.LONG, false);
        /* 1125 */
        sort.setSort(field);
        /* 1127 */
        String indexLib = getIndexLibPathForPreferLink();
        /* 1128 */
        List<PreferLink> list = multiQueryForPreferLink(query, indexLib, sort);
        /* 1130 */
        rt.setData(list);
        /* 1131 */
        writeJson(rt, response);

    }


    private Query buildUserShareQuery(String userId) {
        /* 1135 */
        Query query = null;

        try {
            /* 1137 */
            IKAnalyzer iKAnalyzer = new IKAnalyzer();
            /* 1138 */
            QueryParser parser = new QueryParser(Version.LUCENE_46, "accessUserIds", (Analyzer) iKAnalyzer);
            /* 1139 */
            query = parser.parse(userId);
            /* 1140 */
        } catch (ParseException e) {
            /* 1141 */
            Log.info((Exception) e);

        }
        /* 1143 */
        return query;

    }


    private Query buildAnyUserShareQuery() {
        /* 1148 */
        Query query = null;

        try {
            /* 1150 */
            IKAnalyzer iKAnalyzer = new IKAnalyzer();
            /* 1151 */
            QueryParser parser = new QueryParser(Version.LUCENE_46, "accessUserIds", (Analyzer) iKAnalyzer);
            /* 1152 */
            query = parser.parse("0");
            /* 1153 */
        } catch (ParseException e) {
            /* 1154 */
            Log.info((Exception) e);

        }
        /* 1156 */
        return query;

    }


    @RequestMapping({"/getPreferLinkAccessUsers.do"})
    public void getPreferLinkAccessUsers(String preferLinkId, String searchWord, Integer pageIndex, Integer pageSize, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 1164 */
        Log.infoHead("****************** getPreferLinkAccessUsers.do ***********************");
        /* 1165 */
        Log.info("getPreferLinkAccessUsers searchWord:" + searchWord + " preferLinkId: " + preferLinkId);
        /* 1166 */
        ReturnAjax rt = new ReturnAjax();
        /* 1167 */
        User login_user = getLoginUser(session, request, response, rt);
        /* 1168 */
        if (login_user == null) {
            /* 1170 */
            rt.setError("用户未登录，请先登录！");
            /* 1171 */
            writeJson(rt, response);

            return;

        }
        /* 1175 */
        User user = null;
        /* 1176 */
        if (searchWord != null && !searchWord.isEmpty()) {
            /* 1178 */
            user = new User();
            /* 1179 */
            user.setName(searchWord);
            /* 1180 */
            user.setRealName(searchWord);
            /* 1181 */
            user.setNickName(searchWord);
            /* 1182 */
            user.setEmail(searchWord);
            /* 1183 */
            user.setTel(searchWord);

        }
        /* 1187 */
        QueryResult queryResult = new QueryResult();
        /* 1188 */
        List<User> UserList = getUserListOnPage(user, pageIndex, pageSize, queryResult);
        /* 1191 */
        User anyUser = new User();
        /* 1192 */
        anyUser.setId(Integer.valueOf(0));
        /* 1193 */
        anyUser.setName("任意用户");
        /* 1194 */
        anyUser.setRealName("任意用户");
        /* 1195 */
        UserList.add(0, anyUser);
        /* 1197 */
        rt.setData(UserList);
        /* 1198 */
        rt.setDataEx(Integer.valueOf(queryResult.total));
        /* 1199 */
        writeJson(rt, response);

    }


    @RequestMapping({"/configPreferLinkAccessUser.do"})
    public void configPreferLinkAccessUser(String preferLinkId, Integer userId, Integer access, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 1205 */
        Log.infoHead("****************** configPreferLinkAccessUser.do ***********************");
        /* 1206 */
        Log.info("configPreferLinkAccessUser preferLinkId:" + preferLinkId + " userId: " + userId + " access: " + access);
        /* 1207 */
        ReturnAjax rt = new ReturnAjax();
        /* 1208 */
        User login_user = getLoginUser(session, request, response, rt);
        /* 1209 */
        if (login_user == null) {
            /* 1211 */
            rt.setError("用户未登录，请先登录！");
            /* 1212 */
            writeJson(rt, response);

            return;

        }
        /* 1219 */
        PreferLink link = b.getPreferLink(preferLinkId);
        /* 1220 */
        if (link == null) {
            /* 1222 */
            Log.info("configPreferLinkAccessUser() 网站 " + preferLinkId + " 不存在");
            /* 1223 */
            rt.setError("网站不存在！");
            /* 1224 */
            writeJson(rt, response);

            return;

        }
        /* 1228 */
        String accessUsers = link.accessUserIds;
        /* 1229 */
        Log.debug("configPreferLinkAccessUser() accessUsers:" + accessUsers);
        /* 1230 */
        if (accessUsers == null || accessUsers.isEmpty()) {
            /* 1232 */
            if (access != null && access.intValue() == 1) {
                /* 1234 */
                accessUsers = userId + ",";
                /* 1236 */
                link.accessUserIds = accessUsers;
                /* 1237 */
                if (!editPreferLink(link)) {
                    /* 1239 */
                    Log.info("configPreferLinkAccessUser editPreferLink Failed");
                    /* 1240 */
                    rt.setError("更新网站信息失败");
                    /* 1241 */
                    writeJson(rt, response);

                    return;

                }
                /* 1244 */
                rt.setData(link.accessUserIds);
                /* 1245 */
                writeJson(rt, response);

                return;

            }
            /* 1250 */
            rt.setData(link.accessUserIds);
            /* 1251 */
            rt.setDataEx("NoChange");
            /* 1252 */
            writeJson(rt, response);

            return;

        }
        /* 1258 */
        String[] accessUserArray = accessUsers.split(",");
        /* 1259 */
        Boolean isAccessUser = Boolean.valueOf(false);
        /* 1261 */
        String newAccessUsers = "";
        /* 1262 */
        for (int i = 0; i < accessUserArray.length; i++) {
            /* 1264 */
            if (accessUserArray[i].equals(userId)) {
                /* 1266 */
                isAccessUser = Boolean.valueOf(true);

            } else {
                /* 1270 */
                newAccessUsers = String.valueOf(newAccessUsers) + accessUserArray[i] + ",";

            }

        }
        /* 1275 */
        if (isAccessUser.booleanValue()) {
            /* 1277 */
            Log.debug("configPreferLinkAccessUser() user:" + userId + " isAccessUser");
            /* 1278 */
            if (access != null && access.intValue() == 1) {
                /* 1280 */
                Log.debug("configPreferLinkAccessUser() user:" + userId + " was already in accessUsers");
                /* 1281 */
                rt.setData(link.accessUserIds);
                /* 1282 */
                rt.setDataEx("NoChange");
                /* 1283 */
                writeJson(rt, response);

                return;

            }
            /* 1288 */
            Log.debug("configPreferLinkAccessUser() newAccessUsers:" + newAccessUsers);
            /* 1289 */
            link.accessUserIds = newAccessUsers;
            /* 1290 */
            if (!editPreferLink(link)) {
                /* 1292 */
                Log.info("configPreferLinkAccessUser editPreferLink Failed");
                /* 1293 */
                rt.setError("更新网站信息失败");
                /* 1294 */
                writeJson(rt, response);

                return;

            }
            /* 1297 */
            rt.setData(link.accessUserIds);
            /* 1298 */
            writeJson(rt, response);

            return;

        }
        /* 1303 */
        Log.debug("configPreferLinkAccessUser() user:" + userId + " is not AccessUser");
        /* 1304 */
        if (access == null || access.intValue() == 0) {
            /* 1306 */
            Log.debug("configPreferLinkAccessUser() user:" + userId + " was already be removed from accessUsers");
            /* 1307 */
            rt.setData(link.accessUserIds);
            /* 1308 */
            rt.setDataEx("NoChange");
            /* 1309 */
            writeJson(rt, response);

            return;

        }
        /* 1314 */
        newAccessUsers = String.valueOf(newAccessUsers) + userId + ",";
        /* 1315 */
        Log.debug("configPreferLinkAccessUser() newAccessUsers:" + newAccessUsers);
        /* 1316 */
        link.accessUserIds = newAccessUsers;
        /* 1317 */
        if (!editPreferLink(link)) {
            /* 1319 */
            Log.info("configPreferLinkAccessUser editPreferLink Failed");
            /* 1320 */
            rt.setError("更新网站信息失败");
            /* 1321 */
            writeJson(rt, response);

            return;

        }
        /* 1324 */
        rt.setData(link.accessUserIds);
        /* 1325 */
        writeJson(rt, response);

    }


    @RequestMapping({"/getAuthCode.do"})
    public void getAuthCode(String taskId, String serverId, String serverUrl, String userName, String pwd, Integer type, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1338 */
        Log.infoHead("************** getAuthCode ****************");
        /* 1339 */
        Log.info("getAuthCode serverUrl:" + serverUrl + " userName:" + userName + " pwd:" + pwd + " type:" + type);
        /* 1341 */
        ReturnAjax rt = new ReturnAjax();
        /* 1343 */
        if (type == null) {
            /* 1345 */
            Log.debug("getAuthCode() 推送类型不能为空");
            /* 1346 */
            rt.setError("推送类型不能为空！");
            /* 1347 */
            writeJson(rt, response);

            return;

        }
        /* 1351 */
        if (serverId != null) {
            /* 1353 */
            UserPreferServer server = getUserPreferServer(serverId);
            /* 1354 */
            if (server == null) {
                /* 1356 */
                Log.debug("getAuthCode() 服务器 " + serverId + " 不存在");
                /* 1357 */
                rt.setError("服务器不存在！");
                /* 1358 */
                writeJson(rt, response);

                return;

            }
            /* 1363 */
            JSONObject result = getRemoteAuthCodeForPushDoc(server.serverUrl, server.serverUserName, server.serverUserPwd, type, rt);
            /* 1364 */
            if (result == null) {
                /* 1366 */
                Log.debug("getAuthCode() 获取授权码失败");
                /* 1367 */
                writeJson(rt, response);

                return;

            }
            /* 1371 */
            rt.setData(result.getString("data"));
            /* 1372 */
            rt.setDataEx(result.getJSONArray("dataEx"));
            /* 1373 */
            writeJson(rt, response);

            return;

        }
        /* 1380 */
        if (!channel.isAllowedAction("thirdPartyAccess", rt) &&
                /* 1381 */       !channel.isAllowedAction("getAuthCode", rt)) {
            /* 1383 */
            Log.debug("getAuthCode 证书校验失败");
            /* 1384 */
            writeJson(rt, response);

            return;

        }
        /* 1388 */
        ReposAccess reposAccess = null;
        /* 1389 */
        if (userName == null || userName.isEmpty()) {
            /* 1391 */
            reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);

        } else {
            /* 1395 */
            User loginUser = loginCheck(userName, pwd, request, session, response, rt);
            /* 1396 */
            if (loginUser == null) {
                /* 1398 */
                Log.debug("getAuthCode() loginCheck error");
                /* 1399 */
                rt.setError("用户名或密码错误！");
                /* 1400 */
                writeJson(rt, response);
                /* 1401 */
                User tmp_user = new User();
                /* 1402 */
                tmp_user.setName(userName);
                /* 1403 */
                addSystemLog(request, tmp_user, "getAuthCode", "getAuthCode", "用户检查", taskId, "失败", null, null, null, "");

                return;

            }
            /* 1407 */
            reposAccess = new ReposAccess();
            /* 1408 */
            reposAccess.setAccessUserId(loginUser.getId());
            /* 1409 */
            reposAccess.setAccessUser(loginUser);

        }
        /* 1411 */
        if (reposAccess == null) {
            /* 1413 */
            Log.debug("getAuthCode reposAccess is null");
            /* 1414 */
            rt.setError("非法访问");
            /* 1415 */
            writeJson(rt, response);

            return;

        }
        /* 1420 */
        if (type.intValue() == 2)
            /* 1422 */ if (reposAccess.getAccessUser().getType().intValue() < 1) {
            /* 1424 */
            Log.debug("getAuthCode 非管理员用户禁止推送到服务器目录");
            /* 1425 */
            rt.setError("非管理员用户禁止推送到服务器目录");
            /* 1426 */
            writeJson(rt, response);

            return;

        }
        /* 1432 */
        AuthCode remoteAuthCode = generateAuthCode("remoteAccess", 86400000L, 1000000, reposAccess, null);
        /* 1433 */
        if (remoteAuthCode == null) {
            /* 1435 */
            Log.debug("getAuthCode 授权码生成失败");
            /* 1436 */
            writeJson(rt, response);
            /* 1437 */
            addSystemLog(request, reposAccess.getAccessUser(), "getAuthCode", "getAuthCode", "授权码生成", taskId, "失败", null, null, null, "");

            return;

        }
        /* 1441 */
        rt.setData(remoteAuthCode.getCode());
        /* 1442 */
        if (type == null || type.intValue() == 1) {
            /* 1445 */
            Integer UserId = reposAccess.getAccessUser().getId();
            /* 1446 */
            List<Repos> accessableReposList = getAccessableReposList(UserId);
            /* 1448 */
            rt.setDataEx(accessableReposList);

        } else {
            /* 1452 */
            List<DiskPath> diskPathList = getDiskPathList();
            /* 1453 */
            rt.setDataEx(diskPathList);

        }
        /* 1455 */
        writeJson(rt, response);
        /* 1456 */
        addSystemLog(request, reposAccess.getAccessUser(), "getAuthCode", "getAuthCode", "授权码获取", taskId, "成功", null, null, null, "");

    }


    private List<DiskPath> getDiskPathList() {
        /* 1460 */
        ArrayList<DiskPath> list = new ArrayList<>();
        /* 1461 */
        DiskPath defaultDiskPath = new DiskPath();
        /* 1462 */
        defaultDiskPath.id = Integer.valueOf(1);
        /* 1463 */
        defaultDiskPath.path = getDefaultDiskPathForFileServer();
        /* 1464 */
        list.add(defaultDiskPath);
        /* 1465 */
        return list;

    }


    private String getDefaultDiskPathForFileServer() {
        /* 1469 */
        if (OS.isWinOS(Integer.valueOf(OSType)))
            /* 1471 */ return "C:/MxsdocDisk/";
        /* 1475 */
        return "/data/MxsdocDisk/";

    }


    @RequestMapping({"/getAuthCodeRS.do"})
    public void getAuthCodeRS(String taskId, String userName, String pwd, Integer reposId, String remoteDirectory, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1488 */
        Log.infoHead("************** getAuthCodeRS ****************");
        /* 1489 */
        Log.info("getAuthCodeRS userName:" + userName + " pwd:" + pwd + " reposId:" + reposId + " remoteDirectory:" + remoteDirectory);
        /* 1491 */
        ReturnAjax rt = new ReturnAjax();
        /* 1493 */
        if (reposId == null && remoteDirectory == null) {
            /* 1495 */
            Log.debug("getAuthCodeRS() 未指定仓库或服务器路径");
            /* 1496 */
            rt.setError("未指定仓库或服务器路径！");
            /* 1497 */
            writeJson(rt, response);

            return;

        }
        /* 1501 */
        if (userName == null || userName.isEmpty()) {
            /* 1503 */
            Log.debug("getAuthCodeRS() 用户名不能为空");
            /* 1504 */
            rt.setError("用户名不能为空！");
            /* 1505 */
            writeJson(rt, response);

            return;

        }
        /* 1509 */
        ReposAccess reposAccess = null;
        /* 1510 */
        User loginUser = loginCheck(userName, pwd, request, session, response, rt);
        /* 1511 */
        if (loginUser == null) {
            /* 1513 */
            Log.debug("getAuthCodeRS() loginCheck error");
            /* 1514 */
            rt.setError("用户名或密码错误！");
            /* 1515 */
            writeJson(rt, response);
            /* 1516 */
            User tmp_user = new User();
            /* 1517 */
            tmp_user.setName(userName);
            /* 1518 */
            addSystemLog(request, tmp_user, "getAuthCodeRS", "getAuthCodeRS", "用户检查", taskId, "失败", null, null, null, "");

            return;

        }
        /* 1522 */
        reposAccess = new ReposAccess();
        /* 1523 */
        reposAccess.setAccessUserId(loginUser.getId());
        /* 1524 */
        reposAccess.setAccessUser(loginUser);
        /* 1526 */
        if (reposId == null) {
            /* 1528 */
            if (reposAccess.getAccessUser().getType().intValue() < 1) {
                /* 1530 */
                Log.debug("getAuthCodeRS 非管理员用户禁止直接访问服务器目录");
                /* 1531 */
                rt.setError("非管理员用户禁止访问服务器目录");
                /* 1532 */
                writeJson(rt, response);

                return;

            }

        } else {
            /* 1539 */
            boolean isReposAccessable = false;
            /* 1540 */
            Integer UserId = reposAccess.getAccessUser().getId();
            /* 1541 */
            List<Repos> accessableReposList = getAccessableReposList(UserId);
            /* 1542 */
            for (int i = 0; i < accessableReposList.size(); i++) {
                /* 1544 */
                if (reposId.equals(((Repos) accessableReposList.get(i)).getId())) {
                    /* 1546 */
                    isReposAccessable = true;

                    break;

                }

            }
            /* 1550 */
            if (!isReposAccessable) {
                /* 1552 */
                Log.debug("getAuthCodeRS " + userName + " 没有该仓库的访问权限！");
                /* 1553 */
                rt.setError(String.valueOf(userName) + " 没有该仓库的访问权限！");
                /* 1554 */
                writeJson(rt, response);

                return;

            }

        }
        /* 1559 */
        AuthCode remoteAuthCode = generateAuthCode("remoteStroage", 86400000L, 1000000, reposAccess, null);
        /* 1560 */
        if (remoteAuthCode == null) {
            /* 1562 */
            Log.debug("getAuthCodeRS 授权码生成失败");
            /* 1563 */
            writeJson(rt, response);
            /* 1564 */
            addSystemLog(request, reposAccess.getAccessUser(), "getAuthCodeRS", "getAuthCodeRS", "授权码生成", taskId, "失败", null, null, null, "");

            return;

        }
        /* 1568 */
        rt.setData(remoteAuthCode.getCode());
        /* 1569 */
        writeJson(rt, response);
        /* 1570 */
        addSystemLog(request, reposAccess.getAccessUser(), "getAuthCodeRS", "getAuthCodeRS", "授权码获取", taskId, "成功", null, null, null, "");

    }


    @RequestMapping({"/remoteStoragePush.do"})
    public void remoteStoragePush(String taskId, Integer reposId, Long docId, Long pid, String path, String name, String commitMsg, Integer recurciveEn, Integer forceEn, Integer shareId, String authCode, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1584 */
        Log.infoHead("************** remoteStoragePush ****************");
        /* 1585 */
        Log.info("remoteStoragePush  reposId:" + reposId + " path:" + path + " name:" + name + " recurciveEn:" + recurciveEn + " forceEn:" + forceEn + " commitMsg:" + commitMsg);
        /* 1587 */
        ReturnAjax rt = new ReturnAjax();
        /* 1590 */
        ReposAccess reposAccess = null;
        /* 1591 */
        if (authCode != null) {
            /* 1593 */
            if (checkAuthCode(authCode, null, rt) == null) {
                /* 1595 */
                Log.debug("remoteStoragePush checkAuthCode Failed");
                /* 1597 */
                writeJson(rt, response);

                return;

            }
            /* 1600 */
            reposAccess = getAuthCode(authCode).getReposAccess();

        } else {
            /* 1604 */
            reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

        }
        /* 1606 */
        if (reposAccess == null) {
            /* 1608 */
            Log.debug("remoteStoragePush reposAccess is null");
            /* 1609 */
            rt.setError("非法访问");
            /* 1610 */
            writeJson(rt, response);

            return;

        }
        /* 1614 */
        Repos repos = getReposEx(reposId);
        /* 1615 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 1621 */
        String reposPath = Path.getReposPath(repos);
        /* 1622 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 1623 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 1624 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
        /* 1626 */
        if (!checkUserAdminRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt)) {
            /* 1628 */
            writeJson(rt, response);

            return;

        }
        /* 1632 */
        Doc localDoc = fsGetDoc(repos, doc);
        /* 1633 */
        if (localDoc == null || localDoc.getType().intValue() == 0) {
            /* 1635 */
            docSysErrorLog("文件 " + path + name + " 不存在！", rt);
            /* 1636 */
            writeJson(rt, response);

            return;

        }
        /* 1640 */
        if (!RemoteStorageAccessCheck(rt)) {
            /* 1642 */
            writeJson(rt, response);
            /* 1643 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePush", "remoteStoragePush", "远程存储手动推送", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1648 */
        boolean recurcive = false;
        /* 1649 */
        if (recurciveEn != null && recurciveEn.intValue() == 1)
            /* 1651 */ recurcive = true;
        /* 1654 */
        int pushType = 20;
        /* 1655 */
        if (forceEn != null && forceEn.intValue() == 1)
            /* 1657 */ pushType = 30;
        /* 1660 */
        if (commitMsg == null)
            /* 1662 */ commitMsg = "远程存储手动推送";
        /* 1665 */
        DocLock docLock = null;
        /* 1666 */
        int lockType = 2;
        /* 1668 */
        String lockInfo = "远程推送 [" + doc.getPath() + doc.getName() + "]";
        /* 1669 */
        docLock = lockDoc(doc, Integer.valueOf(lockType), 7200000L, reposAccess.getAccessUser(), rt, true, lockInfo, Integer.valueOf(401));
        /* 1671 */
        if (docLock == null) {
            /* 1673 */
            docSysDebugLog("remoteStoragePush() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);
            /* 1674 */
            writeJson(rt, response);
            /* 1676 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePush", "remoteStoragePush", "远程存储手动推送", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1680 */
        Boolean ret = Boolean.valueOf(channel.remoteStoragePush(repos.remoteStorageConfig, repos, localDoc, reposAccess.getAccessUser(), commitMsg, recurcive, pushType, rt));
        /* 1681 */
        unlockDoc(doc, Integer.valueOf(lockType), reposAccess.getAccessUser());
        /* 1683 */
        writeJson(rt, response);
        /* 1685 */
        if (!ret.booleanValue()) {
            /* 1687 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePush", "remoteStoragePush", "远程存储手动推送", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

        } else {
            /* 1691 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePush", "remoteStoragePush", "远程存储手动推送", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));

        }

    }


    @RequestMapping({"/remoteStoragePull.do"})
    public void remoteStoragePull(String taskId, Integer reposId, Long docId, Long pid, String path, String name, Integer recurciveEn, Integer forceEn, Integer shareId, String authCode, String commitMsg, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1706 */
        Log.infoHead("************** remoteStoragePull ****************");
        /* 1707 */
        Log.info("remoteStoragePull  reposId:" + reposId + " path:" + path + " name:" + name + " recurciveEn:" + recurciveEn + " forceEn:" + forceEn);
        /* 1709 */
        ReturnAjax rt = new ReturnAjax();
        /* 1712 */
        ReposAccess reposAccess = null;
        /* 1713 */
        if (authCode != null) {
            /* 1715 */
            if (checkAuthCode(authCode, null, rt) == null) {
                /* 1717 */
                Log.debug("remoteStoragePull checkAuthCode Failed");
                /* 1719 */
                writeJson(rt, response);

                return;

            }
            /* 1722 */
            reposAccess = getAuthCode(authCode).getReposAccess();

        } else {
            /* 1726 */
            reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

        }
        /* 1728 */
        if (reposAccess == null) {
            /* 1730 */
            Log.debug("remoteStoragePull reposAccess is null");
            /* 1731 */
            rt.setError("非法访问");
            /* 1732 */
            writeJson(rt, response);

            return;

        }
        /* 1736 */
        Repos repos = getReposEx(reposId);
        /* 1737 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 1743 */
        String reposPath = Path.getReposPath(repos);
        /* 1744 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 1745 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 1746 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
        /* 1748 */
        if (!checkUserAdminRight(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask(), rt)) {
            /* 1750 */
            writeJson(rt, response);
            /* 1751 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePull", "remoteStoragePull", "远程存储手动拉取", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1755 */
        if (!RemoteStorageAccessCheck(rt)) {
            /* 1757 */
            writeJson(rt, response);
            /* 1758 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePull", "remoteStoragePull", "远程存储手动拉取", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1773 */
        if (commitMsg == null)
            /* 1775 */ commitMsg = "远程存储手动拉取";
        /* 1779 */
        boolean recurcive = false;
        /* 1780 */
        if (recurciveEn != null && recurciveEn.intValue() == 1)
            /* 1782 */ recurcive = true;
        /* 1785 */
        int pullType = 20;
        /* 1786 */
        if (forceEn != null && forceEn.intValue() == 1)
            /* 1788 */ pullType = 30;
        /* 1790 */
        List<CommonAction> asyncActionList = new ArrayList<>();
        /* 1791 */
        DocLock docLock = null;
        /* 1792 */
        int lockType = 2;
        /* 1794 */
        String lockInfo = "远程拉取 [" + doc.getPath() + doc.getName() + "]";
        /* 1795 */
        docLock = lockDoc(doc, Integer.valueOf(lockType), 7200000L, reposAccess.getAccessUser(), rt, true, lockInfo, Integer.valueOf(402));
        /* 1797 */
        if (docLock == null) {
            /* 1799 */
            docSysDebugLog("remoteStoragePull() lock doc [" + doc.getPath() + doc.getName() + "] Failed", rt);
            /* 1801 */
            writeJson(rt, response);
            /* 1803 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePull", "remoteStoragePull", "远程存储手动拉取", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1807 */
        channel.remoteStoragePull(repos.remoteStorageConfig, repos, doc, reposAccess.getAccessUser(), null, recurcive, pullType, rt);
        /* 1809 */
        DocPullContext pullResult = (DocPullContext) rt.getDataEx();
        /* 1810 */
        if (pullResult == null || pullResult.successCount.intValue() <= 0) {
            /* 1812 */
            unlockDoc(doc, Integer.valueOf(lockType), reposAccess.getAccessUser());
            /* 1814 */
            writeJson(rt, response);
            /* 1815 */
            addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePull", "remoteStoragePull", "远程存储手动拉取", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1819 */
        if (isFSM(repos) || !doc.getIsRealDoc()) {
            /* 1821 */
            String commitUser = reposAccess.getAccessUser().getName();
            /* 1822 */
            String localChangesRootPath = String.valueOf(Path.getReposTmpPath(repos)) + "reposSyncupScanResult/remoteStoragePull-localChanges-" + (new Date()).getTime() + "/";
            /* 1823 */
            if (convertRevertedDocListToLocalChanges(pullResult.successDocList, localChangesRootPath)) {
                /* 1825 */
                String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, localChangesRootPath, 2, null, null);
                /* 1826 */
                if (revision != null)
                    /* 1828 */ verReposPullPush(repos, true, rt);
                /* 1830 */
                FileUtil.delDir(localChangesRootPath);

            }
            /* 1834 */
            CommonAction.insertCommonActionEx(asyncActionList, repos, null, null, pullResult.successDocList, commitMsg, commitUser, ActionType.SearchIndex, Action.UPDATE, DocType.ALL, null, null, null, true);

        }
        /* 1837 */
        unlockDoc(doc, Integer.valueOf(lockType), reposAccess.getAccessUser());
        /* 1839 */
        writeJson(rt, response);
        /* 1841 */
        executeCommonActionListAsync(asyncActionList, rt);
        /* 1842 */
        addSystemLog(request, reposAccess.getAccessUser(), "remoteStoragePull", "remoteStoragePull", "远程手动拉取", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));

    }


    private boolean RemoteStorageAccessCheck(ReturnAjax rt) {
        /* 1847 */
        if (channel == null && checkLicense) {
            /* 1849 */
            docSysErrorLog("非商业版不支持远程存储！", rt);
            /* 1850 */
            return false;

        }
        /* 1853 */
        switch (docSysType) {

            case 2:
                /* 1856 */
                docSysErrorLog("专业版不支持远程存储，请购买企业版！", rt);
                /* 1857 */
                return false;

            case 3:
                /* 1859 */
                docSysErrorLog("个人版不支持远程存储，请购买企业版！", rt);
                /* 1860 */
                return false;

            case 0:
                /* 1862 */
                docSysErrorLog("开源版不支持远程存储，请购买企业版！", rt);
                /* 1863 */
                return false;

        }
        /* 1865 */
        return true;

    }


    @RequestMapping({"/systemMigrate.do"})
    public void systemMigrate(String taskId, String serverUrl, String user, String pwd, String reposIds, String reposStorePath, Integer conflictSolution, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 1879 */
        Log.infoHead("************** systemMigrate ****************");
        /* 1880 */
        Log.info("**** systemMigrate()  server:" + serverUrl + " user:" + user + " pwd:" + pwd + " reposIds:" + reposIds + " reposStorePath:" + reposStorePath + " conflictSolution:" + conflictSolution);
        /* 1882 */
        ReturnAjax rt = new ReturnAjax();
        /* 1884 */
        if (!SystemMigrateAccessCheck(rt)) {
            /* 1886 */
            writeJson(rt, response);
            /* 1887 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, buildSystemLogDetailContent(rt));

            return;

        }
        /* 1891 */
        SystemMigrateResult systemMigrateResult = new SystemMigrateResult();
        /* 1892 */
        systemMigrateResult.info = "";
        /* 1893 */
        systemMigrateResult.reposPushResult = new ReposPushResult();
        /* 1896 */
        User login_user = (User) session.getAttribute("login_user");
        /* 1897 */
        if (login_user == null) {
            /* 1899 */
            docSysErrorLog("用户未登录，请先登录！", rt);
            /* 1900 */
            writeJson(rt, response);
            /* 1901 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, "用户未登录");

            return;

        }
        /* 1905 */
        if (login_user.getType().intValue() < 2) {
            /* 1907 */
            docSysErrorLog("您无权进行此操作，请联系系统管理员！", rt);
            /* 1908 */
            writeJson(rt, response);
            /* 1909 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, "非系统管理员");

            return;

        }
        /* 1914 */
        if (serverUrl == null || serverUrl.isEmpty()) {
            /* 1916 */
            Log.debug("**** systemMigrate() serverUrl is null");
            /* 1917 */
            rt.setError("目标服务器不能为空！");
            /* 1918 */
            writeJson(rt, response);
            /* 1919 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, "目标服务器为空");

            return;

        }
        /* 1924 */
        URLInfo urlInfo = getUrlInfoFromUrl(serverUrl);
        /* 1925 */
        if (urlInfo == null) {
            /* 1927 */
            Log.debug("**** systemMigrate() 目标服务器地址格式错误");
            /* 1928 */
            rt.setError("目标服务器地址格式错误");
            /* 1929 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, "目标服务器地址格式错误:" + serverUrl);
            /* 1930 */
            writeJson(rt, response);

            return;

        }
        /* 1933 */
        if (urlInfo.port == null || urlInfo.port.isEmpty()) {
            /* 1935 */
            serverUrl = String.valueOf(urlInfo.prefix) + urlInfo.host;

        } else {
            /* 1939 */
            serverUrl = String.valueOf(urlInfo.prefix) + urlInfo.host + ":" + urlInfo.port;

        }
        /* 1943 */
        JSONObject result = getRemoteAuthCodeForPushRepos(serverUrl, user, pwd, rt);
        /* 1944 */
        if (result == null) {
            /* 1946 */
            Log.debug("**** systemMigrate() 获取目标服务器授权码失败");
            /* 1947 */
            rt.setError("获取目标服务器迁移授权码失败");
            /* 1948 */
            writeJson(rt, response);
            /* 1949 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, "获取目标服务器迁移授权码失败");

            return;

        }
        /* 1952 */
        String authCode = result.getString("data");
        /* 1953 */
        JSONObject remoteSystemInfo = result.getJSONObject("dataEx");
        /* 1955 */
        UserPreferServer server = new UserPreferServer();
        /* 1956 */
        server.serverUrl = serverUrl;
        /* 1957 */
        server.serverUserName = user;
        /* 1958 */
        server.serverUserPwd = Base64Util.base64Decode(pwd);
        /* 1960 */
        Log.debug("**** systemMigrate() 数据库迁移");
        /* 1961 */
        JSONArray remoteReposList = pushDBDataToRemote(server, reposIds, reposStorePath, conflictSolution, authCode, systemMigrateResult, rt);
        /* 1962 */
        if (!systemMigrateResult.result) {
            /* 1964 */
            rt.setDataEx(systemMigrateResult);
            /* 1965 */
            writeJson(rt, response);
            /* 1966 */
            addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "失败", null, null, null, systemMigrateResult.info);

            return;

        }
        /* 1970 */
        systemMigrateResult.reposPushResult.totalCount = Integer.valueOf(0);
        /* 1971 */
        systemMigrateResult.reposPushResult.failCount = Integer.valueOf(0);
        /* 1972 */
        systemMigrateResult.reposPushResult.successCount = Integer.valueOf(0);
        /* 1973 */
        if (remoteReposList != null) {
            /* 1975 */
            Log.debug("**** systemMigrate() 仓库库迁移");
            /* 1976 */
            Log.printObject("systemMigrate() remoteReposList:", remoteReposList);
            /* 1978 */
            systemMigrateResult.reposPushResult.totalCount = Integer.valueOf(remoteReposList.size());
            /* 1979 */
            for (int i = 0; i < remoteReposList.size(); i++) {
                /* 1981 */
                JSONObject remoteReposInfo = remoteReposList.getJSONObject(i);
                /* 1982 */
                Log.printObject("systemMigrate() remoteReposInfo:", remoteReposInfo);
                /* 1984 */
                pushReposData(server, remoteReposInfo, conflictSolution, authCode, systemMigrateResult);

            }

        }
        /* 1988 */
        Log.debug("**** systemMigrate() 索引数据库迁移");
        /* 1989 */
        pushIndexLibsToRemote(server, conflictSolution, remoteSystemInfo, authCode, systemMigrateResult);
        /* 1992 */
        rt.setDataEx(systemMigrateResult);
        /* 1993 */
        writeJson(rt, response);
        /* 1994 */
        addSystemLog(request, systemUser, "systemMigrate", "systemMigrate", "系统迁移", taskId, "成功", null, null, null, systemMigrateResult.info);

    }


    private boolean SystemMigrateAccessCheck(ReturnAjax rt) {
        /* 1998 */
        switch (docSysType) {

            case 2:
                /* 2001 */
                docSysErrorLog("专业版不支持一键迁移，请购买企业版！！", rt);
                /* 2002 */
                return false;

            case 3:
                /* 2004 */
                docSysErrorLog("个人版不支持一键迁移，请购买企业版！！", rt);
                /* 2005 */
                return false;

            case 0:
                /* 2007 */
                docSysErrorLog("开源版不支持一键迁移，请购买企业版！！", rt);
                /* 2008 */
                return false;

        }
        /* 2010 */
        return true;

    }


    protected static JSONObject getRemoteAuthCodeForPushRepos(String targetServerUrl, String userName, String pwd, ReturnAjax rt) {
        /* 2014 */
        String requestUrl = String.valueOf(targetServerUrl) + "/DocSystem/Bussiness/getAuthCodeForSystemMigrate.do?userName=" + userName + "&pwd=" + pwd;
        /* 2015 */
        JSONObject ret = postJson(requestUrl, null, true);
        /* 2017 */
        if (ret == null) {
            /* 2019 */
            Log.debug("getRemoteAuthCodeForPushRepos() ret is null");
            /* 2020 */
            rt.setError("连接服务器失败");
            /* 2021 */
            return null;

        }
        /* 2024 */
        if (ret.getString("status") == null) {
            /* 2027 */
            Log.debug("getRemoteAuthCodeForPushRepos() ret.status is null");
            /* 2028 */
            rt.setError("连接服务器失败");
            /* 2029 */
            return null;

        }
        /* 2032 */
        if (!ret.getString("status").equals("ok")) {
            /* 2034 */
            Log.debug("getRemoteAuthCodeForPushRepos() ret.status is not ok");
            /* 2035 */
            rt.setError(ret.getString("msgInfo"));
            /* 2036 */
            return null;

        }
        /* 2039 */
        return ret;

    }


    private JSONArray pushDBDataToRemote(UserPreferServer server, String reposList, String reposStorePath, Integer pushType, String authCode, SystemMigrateResult systemMigrateResult, ReturnAjax rt) {
        /* 2044 */
        Date date = new Date();
        /* 2045 */
        String backUpTime = DateFormat.dateTimeFormat2(date);
        /* 2046 */
        String backUpPath = String.valueOf(docSysIniPath) + "backup/" + backUpTime + "/";
        /* 2047 */
        if (!backupDatabase(backUpPath, DB_TYPE, DB_URL, DB_USER, DB_PASS, true)) {
            /* 2049 */
            Log.debug("pushDBDataToRemote() 数据库导出失败!");
            /* 2050 */
            docSysErrorLog("备份数据库失败", rt);
            /* 2051 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移失败:数据库备份失败;\n";
            /* 2052 */
            systemMigrateResult.result = false;
            /* 2053 */
            return null;

        }
        /* 2057 */
        String fileName = "docsystem_data.json";
        /* 2058 */
        JSONArray list = importDBDataToRemote(backUpPath, fileName, server.serverUrl, reposList, reposStorePath, pushType, authCode, systemMigrateResult, rt);
        /* 2059 */
        return list;

    }


    private JSONArray importDBDataToRemote(String localPath, String name, String serverUrl, String reposList, String reposStorePath, Integer pushType, String authCode, SystemMigrateResult systemMigrateResult, ReturnAjax rt) {
        /* 2064 */
        Log.debug("importDBDataToRemote filePath:" + localPath + name);
        /* 2065 */
        String requestUrl = String.valueOf(serverUrl) + "/DocSystem/Bussiness/importDBDataForSystemMigrate.do?authCode=" + authCode;
        /* 2066 */
        HashMap<String, String> reqParams = new HashMap<>();
        /* 2067 */
        reqParams.put("reposList", reposList);
        /* 2068 */
        if (reposStorePath != null && !reposStorePath.isEmpty())
            /* 2070 */ reqParams.put("reposStorePath", reposStorePath);
        /* 2072 */
        reqParams.put("pushType", "" + pushType);
        /* 2074 */
        File file = new File(localPath, name);
        /* 2075 */
        int size = (int) file.length();
        /* 2076 */
        byte[] docData = FileUtil.readBufferFromFile(localPath, name, Long.valueOf(0L), size);
        /* 2077 */
        if (docData == null) {
            /* 2079 */
            Log.debug("importDBDataToRemote readBufferFromFile is null");
            /* 2080 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移失败: 数据库文件为空;\n";
            /* 2081 */
            return null;

        }
        /* 2084 */
        JSONObject ret = postFileStreamAndJsonObj(requestUrl, name, docData, reqParams, true);
        /* 2085 */
        if (ret == null) {
            /* 2087 */
            Log.debug("importDBDataToRemote() ret is null");
            /* 2088 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移失败: 目标服务器未相应;\n";
            /* 2089 */
            return null;

        }
        /* 2092 */
        if (ret.getString("status") == null) {
            /* 2095 */
            Log.debug("importDBDataToRemote() ret.status is null");
            /* 2096 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移失败: 目标服务器返回未知状态;\n";
            /* 2097 */
            return null;

        }
        /* 2100 */
        if (!ret.getString("status").equals("ok")) {
            /* 2102 */
            Log.debug("importDBDataToRemote() ret.status is not ok");
            /* 2103 */
            rt.setError(ret.getString("msgInfo"));
            /* 2104 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移失败: 目标服务器数据库导入失败[" + ret.getString("msgInfo") + "];\n";
            /* 2105 */
            return null;

        }
        /* 2108 */
        systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "数据库迁移完成;\n";
        /* 2109 */
        return ret.getJSONArray("data");

    }


    private Repos convertJSONObjectToRepos(JSONObject obj) {
        /* 2113 */
        Repos repos = new Repos();
        /* 2114 */
        repos.setId(obj.getInteger("id"));
        /* 2115 */
        repos.setPath(obj.getString("path"));
        /* 2116 */
        repos.setRealDocPath(obj.getString("realDocPath"));
        /* 2117 */
        repos.setVerCtrl(obj.getInteger("verCtrl"));
        /* 2118 */
        repos.setLocalSvnPath(obj.getString("localSvnPath"));
        /* 2119 */
        repos.setVerCtrl1(obj.getInteger("verCtrl1"));
        /* 2120 */
        repos.setLocalSvnPath1(obj.getString("localSvnPath1"));
        /* 2121 */
        Log.printObject("convertJSONObjectToRepos repos:", repos);
        /* 2122 */
        return repos;

    }


    private boolean pushReposData(UserPreferServer server, JSONObject remoteReposInfo, Integer pushType, String authCode, SystemMigrateResult systemMigrateResult) {
        /* 2126 */
        Log.debug("***** pushReposData for " + remoteReposInfo.getInteger("reposId") + " *******");
        /* 2127 */
        Repos localRepos = getReposEx(remoteReposInfo.getInteger("reposId"));
        /* 2128 */
        Repos remoteRepos = convertJSONObjectToRepos(remoteReposInfo.getJSONObject("repos"));
        /* 2130 */
        Log.printObject("pushReposData() localRepos:", localRepos);
        /* 2131 */
        Log.printObject("pushReposData() remoteRepos:", remoteRepos);
        /* 2133 */
        RemoteStorageConfig remote = new RemoteStorageConfig();
        /* 2134 */
        remote.protocol = "mxsdoc";
        /* 2135 */
        remote.rootPath = "";
        /* 2136 */
        remote.MXSDOC = new MxsDocConfig();
        /* 2137 */
        remote.MXSDOC.url = server.serverUrl;
        /* 2138 */
        remote.MXSDOC.userName = server.serverUserName;
        /* 2139 */
        remote.MXSDOC.pwd = server.serverUserPwd;
        /* 2140 */
        remote.MXSDOC.remoteDirectory = "/";
        /* 2142 */
        Log.debug("pushReposData() doRemoteStorageLogin");
        /* 2143 */
        RemoteStorageSession session = doRemoteStorageLogin(localRepos, remote);
        /* 2144 */
        if (session == null)
            /* 2147 */ for (int i = 0; i < 3; i++) {
            /* 2150 */
            session = doRemoteStorageLogin(localRepos, remote);
            /* 2151 */
            if (session != null)
                break;

        }
        /* 2158 */
        if (session == null) {
            /* 2160 */
            Log.debug("pushReposData() doRemoteStorageLogin failed on " + remote.MXSDOC.url);
            /* 2161 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "仓库[" + localRepos.getId() + " " + localRepos.getName() + "]迁移失败: 远程推送登录失败\n";
            /* 2162 */
            systemMigrateResult.reposPushResult.failCount = Integer.valueOf(systemMigrateResult.reposPushResult.failCount.intValue() + 1);
            /* 2163 */
            return false;

        }
        /* 2165 */
        Log.printObject("pushReposData() doRemoteStorageLogin OK, session:", session);
        /* 2167 */
        ReturnAjax rt = new ReturnAjax();
        /* 2170 */
        Log.debug("pushReposData() 迁移仓库目录");
        /* 2172 */
        String localReposStorePath = String.valueOf(localRepos.getPath()) + localRepos.getId() + "/";
        /* 2173 */
        String remoteReposRootPath = remoteRepos.getPath();
        /* 2174 */
        remote.MXSDOC.remoteDirectory = remoteReposRootPath;
        /* 2175 */
        session.mxsdoc.remoteDirectory = remoteReposRootPath;
        /* 2176 */
        String offsetPath = remoteRepos.getId() + "/";
        /* 2177 */
        remote.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(localRepos)) + "PushRepos/ReposRoot";
        /* 2178 */
        Log.debug("pushReposData() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
        /* 2179 */
        Log.debug("pushReposData remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
        /* 2180 */
        Log.debug("pushReposData localReposStorePath:" + localReposStorePath);
        /* 2181 */
        Log.debug("pushReposData remoteReposRootPath:" + remoteReposRootPath);
        /* 2182 */
        Log.debug("pushReposData offsetPath:" + offsetPath);
        /* 2183 */
        Doc docForReposStorePath = buildBasicDoc(localRepos.getId(), Long.valueOf(0L), Long.valueOf(-1L), localRepos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localReposStorePath, null, Long.valueOf(0L), "");
        /* 2184 */
        docForReposStorePath.offsetPath = offsetPath;
        /* 2185 */
        Log.printObject("pushReposData docForReposStorePath:", docForReposStorePath);
        /* 2186 */
        doPushToRemoteStorage(session, remote, localRepos, docForReposStorePath, systemUser, "系统迁移", true, 40, rt);
        /* 2187 */
        Log.debug("pushReposData() 迁移仓库目录 End");
        /* 2190 */
        if (localRepos.getRealDocPath() != null && !localRepos.getRealDocPath().isEmpty()) {
            /* 2192 */
            Log.debug("pushReposData() 迁移文件存储目录");
            /* 2193 */
            String localRealDocStorePath = localRepos.getRealDocPath();
            /* 2194 */
            String remoteRealDocStorePath = remoteRepos.getRealDocPath();
            /* 2195 */
            if (remoteRealDocStorePath == null || remoteRealDocStorePath.isEmpty())
                /* 2197 */
                remoteRealDocStorePath = String.valueOf(remoteReposRootPath) + remoteRepos.getId() + "/data/rdata/";
            /* 2199 */
            remote.MXSDOC.remoteDirectory = remoteRealDocStorePath;
            /* 2200 */
            session.mxsdoc.remoteDirectory = remoteRealDocStorePath;
            /* 2201 */
            offsetPath = "";
            /* 2202 */
            remote.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(localRepos)) + "PushRepos/ReposRealDoc";
            /* 2204 */
            Log.debug("pushReposData() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2205 */
            Log.debug("pushReposData remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2206 */
            Log.debug("pushReposData localRealDocStorePath:" + localRealDocStorePath);
            /* 2207 */
            Log.debug("pushReposData remoteRealDocStorePath:" + remoteRealDocStorePath);
            /* 2208 */
            Log.debug("pushReposData offsetPath:" + offsetPath);
            /* 2209 */
            Doc docForReposRealDocStorePath = buildBasicDoc(localRepos.getId(), Long.valueOf(0L), Long.valueOf(-1L), localRepos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localRealDocStorePath, null, Long.valueOf(0L), "");
            /* 2210 */
            docForReposRealDocStorePath.offsetPath = offsetPath;
            /* 2211 */
            Log.printObject("pushReposData docForReposRealDocStorePath:", docForReposRealDocStorePath);
            /* 2212 */
            doPushToRemoteStorage(session, remote, localRepos, docForReposRealDocStorePath, systemUser, "系统迁移", true, 40, rt);
            /* 2213 */
            Log.debug("pushReposData() 迁移文件存储目录 End");

        }
        /* 2217 */
        if (localRepos.getVerCtrl() != null) {
            /* 2219 */
            Log.debug("pushReposData() 迁移版本仓库目录");
            /* 2220 */
            String localRealDocVerReposRootPath = localRepos.getLocalSvnPath();
            /* 2221 */
            if (localRealDocVerReposRootPath == null || localRealDocVerReposRootPath.isEmpty())
                /* 2223 */ localRealDocVerReposRootPath = Path.getDefaultLocalVerReposPath(localRepos.getPath());
            /* 2225 */
            String localRealVerReposName = Path.getVerReposName(localRepos, true);
            /* 2226 */
            String localRealDocVerReposStorePath = String.valueOf(localRealDocVerReposRootPath) + localRealVerReposName + "/";
            /* 2228 */
            String remoteRealDocVerReposRootPath = remoteRepos.getLocalSvnPath();
            /* 2229 */
            if (remoteRealDocVerReposRootPath == null || remoteRealDocVerReposRootPath.isEmpty())
                /* 2231 */ remoteRealDocVerReposRootPath = Path.getDefaultLocalVerReposPath(remoteReposRootPath);
            /* 2233 */
            String remoteRealVerReposName = Path.getVerReposName(remoteRepos, true);
            /* 2234 */
            remote.MXSDOC.remoteDirectory = remoteRealDocVerReposRootPath;
            /* 2235 */
            session.mxsdoc.remoteDirectory = remoteRealDocVerReposRootPath;
            /* 2236 */
            offsetPath = String.valueOf(remoteRealVerReposName) + "/";
            /* 2237 */
            remote.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(localRepos)) + "PushRepos/ReposRealDocVerRepos";
            /* 2238 */
            Log.debug("pushReposData() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2239 */
            Log.debug("pushReposData remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2240 */
            Log.debug("pushReposData localRealDocVerReposStorePath:" + localRealDocVerReposStorePath);
            /* 2241 */
            Log.debug("pushReposData remoteRealDocVerReposRootPath:" + remoteRealDocVerReposRootPath);
            /* 2242 */
            Log.debug("pushReposData offsetPath:" + offsetPath);
            /* 2244 */
            Doc docForRealDocVerReposStorePath = buildBasicDoc(localRepos.getId(), Long.valueOf(0L), Long.valueOf(-1L), localRepos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localRealDocVerReposStorePath, null, Long.valueOf(0L), "");
            /* 2245 */
            docForRealDocVerReposStorePath.offsetPath = offsetPath;
            /* 2246 */
            Log.printObject("pushReposData docForRealDocVerReposStorePath:", docForRealDocVerReposStorePath);
            /* 2247 */
            doPushToRemoteStorage(session, remote, localRepos, docForRealDocVerReposStorePath, systemUser, "系统迁移", true, 40, rt);
            /* 2248 */
            Log.debug("pushReposData() 迁移版本仓库目录 End");

        }
        /* 2251 */
        if (localRepos.getVerCtrl1() != null) {
            /* 2253 */
            Log.debug("pushReposData() 迁移备注版本仓库目录");
            /* 2254 */
            String localVirtualDocVerReposRootPath = localRepos.getLocalSvnPath1();
            /* 2255 */
            if (localVirtualDocVerReposRootPath == null || localVirtualDocVerReposRootPath.isEmpty())
                /* 2257 */ localVirtualDocVerReposRootPath = Path.getDefaultLocalVerReposPath(localRepos.getPath());
            /* 2259 */
            String localVirtualVerReposName = Path.getVerReposName(localRepos, false);
            /* 2260 */
            String localVirtualDocVerReposStorePath = String.valueOf(localVirtualDocVerReposRootPath) + localVirtualVerReposName + "/";
            /* 2262 */
            String remoteVirtualDocVerReposRootPath = remoteRepos.getLocalSvnPath1();
            /* 2263 */
            if (remoteVirtualDocVerReposRootPath == null || remoteVirtualDocVerReposRootPath.isEmpty())
                /* 2265 */ remoteVirtualDocVerReposRootPath = Path.getDefaultLocalVerReposPath(remoteReposRootPath);
            /* 2267 */
            String remoteVirtualVerReposName = Path.getVerReposName(remoteRepos, false);
            /* 2268 */
            remote.MXSDOC.remoteDirectory = remoteVirtualDocVerReposRootPath;
            /* 2269 */
            session.mxsdoc.remoteDirectory = remoteVirtualDocVerReposRootPath;
            /* 2270 */
            offsetPath = String.valueOf(remoteVirtualVerReposName) + "/";
            /* 2271 */
            remote.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(localRepos)) + "PushRepos/ReposVirtualDocVerRepos";
            /* 2273 */
            Log.debug("pushReposData() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2274 */
            Log.debug("pushReposData remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2275 */
            Log.debug("pushReposData localVirtualDocVerReposStorePath:" + localVirtualDocVerReposStorePath);
            /* 2276 */
            Log.debug("pushReposData remoteVirtualDocVerReposRootPath:" + remoteVirtualDocVerReposRootPath);
            /* 2277 */
            Log.debug("pushReposData offsetPath:" + offsetPath);
            /* 2278 */
            Doc docForVirtualDocVerReposStorePath = buildBasicDoc(localRepos.getId(), Long.valueOf(0L), Long.valueOf(-1L), localRepos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localVirtualDocVerReposStorePath, null, Long.valueOf(0L), "");
            /* 2279 */
            docForVirtualDocVerReposStorePath.offsetPath = offsetPath;
            /* 2280 */
            Log.printObject("pushReposData docForVirtualDocVerReposStorePath:", docForVirtualDocVerReposStorePath);
            /* 2281 */
            doPushToRemoteStorage(session, remote, localRepos, docForVirtualDocVerReposStorePath, systemUser, "系统迁移", true, 40, rt);
            /* 2282 */
            Log.debug("pushReposData() 迁移备注版本仓库目录 End");

        }
        /* 2285 */
        doRemoteStorageLogout(session);
        /* 2286 */
        systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "仓库[" + localRepos.getId() + " " + localRepos.getName() + "]迁移完成\n";
        /* 2287 */
        systemMigrateResult.reposPushResult.successCount = Integer.valueOf(systemMigrateResult.reposPushResult.successCount.intValue() + 1);
        /* 2289 */
        Log.debug("pushReposData() 仓库迁移 End");
        /* 2290 */
        return true;

    }


    private boolean pushIndexLibsToRemote(UserPreferServer server, Integer pushType, JSONObject remoteSystemInfo, String authCode, SystemMigrateResult systemMigrateResult) {
        /* 2295 */
        Repos repos = new Repos();
        /* 2297 */
        RemoteStorageConfig remote = new RemoteStorageConfig();
        /* 2298 */
        remote.protocol = "mxsdoc";
        /* 2299 */
        remote.rootPath = "";
        /* 2300 */
        remote.MXSDOC = new MxsDocConfig();
        /* 2301 */
        remote.MXSDOC.url = server.serverUrl;
        /* 2302 */
        remote.MXSDOC.userName = server.serverUserName;
        /* 2303 */
        remote.MXSDOC.pwd = server.serverUserPwd;
        /* 2304 */
        remote.MXSDOC.remoteDirectory = "/";
        /* 2306 */
        Log.debug("pushIndexLibsToRemote() doRemoteStorageLogin");
        /* 2307 */
        RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        /* 2308 */
        if (session == null)
            /* 2311 */ for (int i = 0; i < 3; i++) {
            /* 2314 */
            session = doRemoteStorageLogin(repos, remote);
            /* 2315 */
            if (session != null)
                break;

        }
        /* 2322 */
        if (session == null) {
            /* 2324 */
            Log.debug("pushIndexLibsToRemote() doRemoteStorageLogin failed on " + remote.MXSDOC.url);
            /* 2325 */
            systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "索引数据库迁移失败: 远程推送登录失败;\n";
            /* 2326 */
            return false;

        }
        /* 2328 */
        Log.printObject("pushIndexLibsToRemote() doRemoteStorageLogin OK, session:", session);
        /* 2330 */
        ReturnAjax rt = new ReturnAjax();
        /* 2332 */
        String localSalesDataStorePath = Path.getSaleDataStorePath(Integer.valueOf(OSType));
        /* 2333 */
        String remtoteSalesDataStorePath = remoteSystemInfo.getString("salesDataStorePath");
        /* 2335 */
        String localSystemLogStorePath = Path.getSystemLogStorePath(Integer.valueOf(OSType));
        /* 2336 */
        String remoteSystemLogStorePath = remoteSystemInfo.getString("systemLogStorePath");
        /* 2338 */
        String localIndexDBStorePath = Path.getDataStorePath(Integer.valueOf(OSType));
        /* 2339 */
        String remoteIndexDBStorePath = remoteSystemInfo.getString("indexDBStorePath");
        /* 2341 */
        String offsetPath = "";
        /* 2342 */
        if (remtoteSalesDataStorePath != null && !remtoteSalesDataStorePath.isEmpty()) {
            /* 2344 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For Sales");
            /* 2345 */
            remote.MXSDOC.remoteDirectory = remtoteSalesDataStorePath;
            /* 2346 */
            session.mxsdoc.remoteDirectory = remtoteSalesDataStorePath;
            /* 2347 */
            remote.remoteStorageIndexLib = String.valueOf(docSysIniPath) + "PushRepos/SalesDataIndexDB";
            /* 2348 */
            Log.debug("pushIndexLibsToRemote() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2349 */
            Log.debug("pushIndexLibsToRemote() remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2350 */
            Log.debug("pushIndexLibsToRemote localSalesDataStorePath:" + localSalesDataStorePath);
            /* 2351 */
            Log.debug("pushIndexLibsToRemote remtoteSalesDataStorePath:" + remtoteSalesDataStorePath);
            /* 2352 */
            Log.debug("pushIndexLibsToRemote offsetPath:" + offsetPath);
            /* 2353 */
            Doc docForSalesData = buildBasicDoc(repos.getId(), Long.valueOf(0L), Long.valueOf(-1L), repos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localSalesDataStorePath, null, Long.valueOf(0L), "");
            /* 2354 */
            docForSalesData.offsetPath = offsetPath;
            /* 2355 */
            Log.printObject("pushIndexLibsToRemote docForSalesData:", docForSalesData);
            /* 2356 */
            doPushToRemoteStorage(session, remote, repos, docForSalesData, systemUser, "系统迁移", true, 40, rt);
            /* 2358 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For Sales End");

        }
        /* 2361 */
        if (localSystemLogStorePath != null && !localSystemLogStorePath.isEmpty()) {
            /* 2363 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For SystemLog");
            /* 2364 */
            remote.MXSDOC.remoteDirectory = remoteSystemLogStorePath;
            /* 2365 */
            session.mxsdoc.remoteDirectory = remoteSystemLogStorePath;
            /* 2366 */
            remote.remoteStorageIndexLib = String.valueOf(docSysIniPath) + "PushRepos/SystemLogIndexDB";
            /* 2367 */
            Log.debug("pushIndexLibsToRemote() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2368 */
            Log.debug("pushIndexLibsToRemote() remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2369 */
            Log.debug("pushIndexLibsToRemote localSystemLogStorePath:" + localSystemLogStorePath);
            /* 2370 */
            Log.debug("pushIndexLibsToRemote remoteSystemLogStorePath:" + remoteSystemLogStorePath);
            /* 2371 */
            Log.debug("pushIndexLibsToRemote offsetPath:" + offsetPath);
            /* 2372 */
            Doc docForSystemLog = buildBasicDoc(repos.getId(), Long.valueOf(0L), Long.valueOf(-1L), repos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localSystemLogStorePath, null, Long.valueOf(0L), "");
            /* 2373 */
            docForSystemLog.offsetPath = offsetPath;
            /* 2374 */
            Log.printObject("pushIndexLibsToRemote docForSystemLog:", docForSystemLog);
            /* 2375 */
            doPushToRemoteStorage(session, remote, repos, docForSystemLog, systemUser, "系统迁移", true, 40, rt);
            /* 2377 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For SystemLog End");

        }
        /* 2380 */
        if (localIndexDBStorePath != null && !localIndexDBStorePath.isEmpty()) {
            /* 2382 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For IndexDB");
            /* 2383 */
            remote.MXSDOC.remoteDirectory = remoteIndexDBStorePath;
            /* 2384 */
            session.mxsdoc.remoteDirectory = remoteIndexDBStorePath;
            /* 2385 */
            remote.remoteStorageIndexLib = String.valueOf(docSysIniPath) + "PushRepos/SystemIndexDB";
            /* 2386 */
            Log.debug("pushIndexLibsToRemote() session.mxsdoc.remoteDirectory:" + session.mxsdoc.remoteDirectory);
            /* 2387 */
            Log.debug("pushIndexLibsToRemote() remoteStorageIndexLib:" + remote.remoteStorageIndexLib);
            /* 2388 */
            Log.debug("pushIndexLibsToRemote localIndexDBStorePath:" + localIndexDBStorePath);
            /* 2389 */
            Log.debug("pushIndexLibsToRemote remoteIndexDBStorePath:" + remoteIndexDBStorePath);
            /* 2390 */
            Log.debug("pushIndexLibsToRemote offsetPath:" + offsetPath);
            /* 2391 */
            Doc docForSystemIndexDB = buildBasicDoc(repos.getId(), Long.valueOf(0L), Long.valueOf(-1L), repos.getPath(), "", "", Integer.valueOf(0), Integer.valueOf(2), true, localIndexDBStorePath, null, Long.valueOf(0L), "");
            /* 2392 */
            docForSystemIndexDB.offsetPath = offsetPath;
            /* 2393 */
            Log.printObject("pushIndexLibsToRemote docForSystemIndexDB:", docForSystemIndexDB);
            /* 2394 */
            doPushToRemoteStorage(session, remote, repos, docForSystemIndexDB, systemUser, "系统迁移", true, 40, rt);
            /* 2396 */
            Log.debug("pushIndexLibsToRemote() 迁移索引数据库 For IndexDB End");

        }
        /* 2399 */
        doRemoteStorageLogout(session);
        /* 2400 */
        systemMigrateResult.info = String.valueOf(systemMigrateResult.info) + "索引数据库迁移完成;\n";
        /* 2402 */
        Log.debug("pushIndexLibsToRemote() 迁移索引数据库 End");
        /* 2403 */
        return true;

    }


    @RequestMapping({"/getAuthCodeForSystemMigrate.do"})
    public void getAuthCodeForSystemMigrate(String taskId, String serverId, String serverUrl, String userName, String pwd, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 2414 */
        Log.infoHead("************** getAuthCodeForSystemMigrate ****************");
        /* 2415 */
        Log.info("getAuthCodeForSystemMigrate serverUrl:" + serverUrl + " userName:" + userName + " pwd:" + pwd);
        /* 2417 */
        ReturnAjax rt = new ReturnAjax();
        /* 2419 */
        if (serverId != null) {
            /* 2421 */
            UserPreferServer server = getUserPreferServer(serverId);
            /* 2422 */
            if (server == null) {
                /* 2424 */
                Log.debug("getAuthCodeForSystemMigrate() 服务器 " + serverId + " 不存在");
                /* 2425 */
                rt.setError("服务器不存在！");
                /* 2426 */
                writeJson(rt, response);

                return;

            }
            /* 2431 */
            JSONObject result = getRemoteAuthCodeForPushRepos(server.serverUrl, server.serverUserName, server.serverUserPwd, rt);
            /* 2432 */
            if (result == null) {
                /* 2434 */
                Log.debug("getAuthCodeForSystemMigrate() 获取授权码失败");
                /* 2435 */
                writeJson(rt, response);

                return;

            }
            /* 2439 */
            rt.setData(result.getString("data"));
            /* 2440 */
            writeJson(rt, response);

            return;

        }
        /* 2445 */
        ReposAccess reposAccess = null;
        /* 2446 */
        if (userName == null || userName.isEmpty()) {
            /* 2448 */
            reposAccess = checkAndGetAccessInfo(null, session, request, response, null, null, null, true, rt);

        } else {
            /* 2452 */
            User loginUser = loginCheck(userName, pwd, request, session, response, rt);
            /* 2453 */
            if (loginUser == null) {
                /* 2455 */
                Log.debug("getAuthCodeForSystemMigrate() loginCheck error");
                /* 2456 */
                rt.setError("用户名或密码错误！");
                /* 2457 */
                writeJson(rt, response);
                /* 2458 */
                User tmp_user = new User();
                /* 2459 */
                tmp_user.setName(userName);
                /* 2460 */
                addSystemLog(request, tmp_user, "getAuthCodeForSystemMigrate", "getAuthCodeForSystemMigrate", "用户检查", taskId, "失败", null, null, null, "");

                return;

            }
            /* 2464 */
            reposAccess = new ReposAccess();
            /* 2465 */
            reposAccess.setAccessUserId(loginUser.getId());
            /* 2466 */
            reposAccess.setAccessUser(loginUser);

        }
        /* 2468 */
        if (reposAccess == null) {
            /* 2470 */
            Log.debug("getAuthCodeForSystemMigrate reposAccess is null");
            /* 2471 */
            rt.setError("非法访问");
            /* 2472 */
            writeJson(rt, response);

            return;

        }
        /* 2477 */
        if (reposAccess.getAccessUser().getType().intValue() < 2) {
            /* 2479 */
            Log.debug("getAuthCodeForSystemMigrate 非系统管理员用户禁止迁移仓库");
            /* 2480 */
            rt.setError("非系统管理员用户禁止迁移仓库");
            /* 2481 */
            writeJson(rt, response);

            return;

        }
        /* 2486 */
        AuthCode remoteAuthCode = generateAuthCode("systemMigrate", 86400000L, 1000000, reposAccess, null);
        /* 2487 */
        if (remoteAuthCode == null) {
            /* 2489 */
            Log.debug("getAuthCodeForSystemMigrate 授权码生成失败");
            /* 2490 */
            writeJson(rt, response);
            /* 2491 */
            addSystemLog(request, reposAccess.getAccessUser(), "getAuthCodeForSystemMigrate", "getAuthCodeForSystemMigrate", "授权码生成", taskId, "失败", null, null, null, "");

            return;

        }
        /* 2495 */
        rt.setData(remoteAuthCode.getCode());
        /* 2496 */
        JSONObject systemInfo = getSystemInfo();
        /* 2497 */
        rt.setDataEx(systemInfo);
        /* 2498 */
        writeJson(rt, response);
        /* 2499 */
        addSystemLog(request, reposAccess.getAccessUser(), "getAuthCodeForSystemMigrate", "getAuthCodeForSystemMigrate", "授权码获取", taskId, "成功", null, null, null, "");

    }


    @RequestMapping({"/importDBDataForSystemMigrate.do"})
    public void importDBDataForSystemMigrate(String taskId, MultipartFile uploadFile, String reposList, String reposStorePath, Integer pushType, String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response) throws Exception {
        /* 2513 */
        Log.infoHead("****************** importDBDataForSystemMigrate.do ***********************");
        /* 2515 */
        ReturnAjax rt = new ReturnAjax();
        /* 2517 */
        if (uploadFile == null) {
            /* 2519 */
            Log.debug("importDBDataForSystemMigrate() uploadFile is null");
            /* 2520 */
            docSysErrorLog("数据库文件不能为空", rt);
            /* 2521 */
            writeJson(rt, response);

            return;

        }
        /* 2525 */
        if (reposList == null || reposList.isEmpty()) {
            /* 2527 */
            Log.debug("importDBDataForSystemMigrate() reposList is empty");
            /* 2528 */
            docSysErrorLog("仓库列表信息不能为空", rt);
            /* 2529 */
            writeJson(rt, response);

            return;

        }
        /* 2533 */
        HashMap<Integer, Integer> reposHashMap = buildReposHashMapFromReposListStr(reposList);
        /* 2534 */
        if (reposHashMap == null || reposHashMap.size() == 0) {
            /* 2536 */
            Log.debug("importDBDataForSystemMigrate() 获取仓库列表信息失败");
            /* 2537 */
            docSysErrorLog("仓库列表信息格式错误", rt);
            /* 2538 */
            writeJson(rt, response);

            return;

        }
        /* 2542 */
        if (reposStorePath == null || reposStorePath.isEmpty()) {
            /* 2544 */
            reposStorePath = Path.getDefaultReposRootPath(Integer.valueOf(OSType));

        } else {
            /* 2548 */
            reposStorePath = Path.localDirPathFormat(reposStorePath, Integer.valueOf(OSType));

        }
        /* 2551 */
        if (superAdminAccessCheck(authCode, "systemMigrate", session, rt) == null) {
            /* 2553 */
            writeJson(rt, response);

            return;

        }
        /* 2558 */
        String fileName = uploadFile.getOriginalFilename();
        /* 2559 */
        String webTmpPathForImportDBData = String.valueOf(getWebTmpPath()) + "importDBData/";
        /* 2560 */
        FileUtil.saveFile(uploadFile, webTmpPathForImportDBData, fileName);
        /* 2562 */
        if (!testDB(DB_TYPE, DB_URL, DB_USER, DB_PASS)) {
            /* 2564 */
            Log.debug("importDBDataForSystemMigrate() 连接数据库:" + DB_URL + " 失败");
            /* 2565 */
            docSysErrorLog("连接数据库失败", rt);
            /* 2566 */
            writeJson(rt, response);

            return;

        }
        /* 2571 */
        Date date = new Date();
        /* 2572 */
        String backUpTime = DateFormat.dateTimeFormat2(date);
        /* 2573 */
        String backUpPath = String.valueOf(docSysIniPath) + "backup/" + backUpTime + "/";
        /* 2574 */
        if (!backupDatabase(backUpPath, DB_TYPE, DB_URL, DB_USER, DB_PASS, true)) {
            /* 2576 */
            Log.debug("importDBDataForSystemMigrate() 数据库备份失败!");
            /* 2577 */
            docSysErrorLog("备份数据库失败", rt);
            /* 2578 */
            writeJson(rt, response);

            return;

        }
        /* 2582 */
        if (!importDatabaseForPushRepos(reposHashMap, reposStorePath, pushType, webTmpPathForImportDBData, fileName, DB_TYPE, DB_URL, DB_USER, DB_PASS)) {
            /* 2584 */
            Log.debug("importDBDataForSystemMigrate() 数据库导入失败");
            /* 2585 */
            docSysErrorLog("数据库导入失败", rt);
            /* 2586 */
            writeJson(rt, response);

            return;

        }
        /* 2590 */
        JSONArray reposInfoList = getReposInfoListForPush(reposHashMap);
        /* 2591 */
        rt.setData(reposInfoList);
        /* 2593 */
        writeJson(rt, response);

    }


    private JSONArray getReposInfoListForPush(HashMap<Integer, Integer> reposHashMap) {
        /* 2597 */
        if (reposHashMap.size() == 0)
            /* 2599 */ return null;
        /* 2602 */
        List<Repos> list = this.reposService.getAllReposList();
        /* 2603 */
        if (list == null || list.size() == 0)
            /* 2605 */ return null;
        /* 2608 */
        JSONArray jsonList = new JSONArray();
        /* 2609 */
        for (int i = 0; i < list.size(); i++) {
            /* 2610 */
            Repos repos = list.get(i);
            /* 2611 */
            Integer oldReposId = reposHashMap.get(repos.getId());
            /* 2612 */
            if (oldReposId != null) {
                /* 2614 */
                JSONObject obj = new JSONObject();
                /* 2615 */
                obj.put("reposId", oldReposId);
                /* 2616 */
                obj.put("repos", repos);
                /* 2617 */
                jsonList.add(obj);

            }

        }
        /* 2620 */
        return jsonList;

    }


    private HashMap<Integer, Integer> buildReposHashMapFromReposListStr(String reposList) {
        /* 2625 */
        String[] reposIdStrs = reposList.split(",");
        /* 2626 */
        if (reposIdStrs == null || reposIdStrs.length == 0)
            /* 2628 */ return null;
        /* 2631 */
        HashMap<Integer, Integer> hashMap = new HashMap<>();
        /* 2632 */
        for (int i = 0; i < reposIdStrs.length; i++) {
            /* 2634 */
            if (!reposIdStrs[i].isEmpty()) {
                /* 2638 */
                Integer reposId = null;

                try {
                    /* 2640 */
                    reposId = Integer.valueOf(Integer.parseInt(reposIdStrs[i]));
                    /* 2641 */
                } catch (Exception e) {
                    /* 2642 */
                    errorLog(e);

                }
                /* 2644 */
                if (reposId != null) {
                    /* 2646 */
                    Log.debug("buildReposHashMapFromReposListStr add repos:" + reposId);
                    /* 2647 */
                    hashMap.put(reposId, reposId);

                }

            }

        }
        /* 2650 */
        return hashMap;

    }


    protected boolean importDatabaseForPushRepos(HashMap<Integer, Integer> reposHashMap, String reposStorePath, Integer pushType, String filePath, String fileName, String type, String url, String user, String pwd) {
        /* 2656 */
        Log.debug("importDatabaseForPushRepos()");
        /* 2657 */
        return importDatabaseFromJsonFileForPushRepos(reposHashMap, reposStorePath, pushType, filePath, fileName, type, url, user, pwd);

    }


    protected boolean importDatabaseFromJsonFileForPushRepos(HashMap<Integer, Integer> reposHashMap, String reposStorePath, Integer pushType, String filePath, String fileName, String type, String url, String user, String pwd) {
        /* 2662 */
        Log.debug("importDatabaseFromJsonFileForPushRepos() filePath:" + filePath + " fileName:" + fileName);
        /* 2664 */
        List<Integer> importTabList = new ArrayList<>();
        /* 2665 */
        for (int i = 0; i < DBTabNameMap.length; i++)
            /* 2667 */
            importTabList.add(Integer.valueOf(i));
        /* 2670 */
        String s = FileUtil.readDocContentFromFile(filePath, fileName, "UTF-8");
        /* 2671 */
        JSONObject jobj = JSON.parseObject(s);
        /* 2673 */
        for (int j = 0; j < importTabList.size(); j++) {
            /* 2675 */
            int objType = ((Integer) importTabList.get(j)).intValue();
            /* 2676 */
            String name = getNameByObjType(objType);
            /* 2677 */
            JSONArray list = jobj.getJSONArray(name);
            /* 2678 */
            if (list == null || list.size() == 0) {
                /* 2680 */
                Log.debug("importDatabaseFromJsonFileForPushRepos() list is empty for " + name);

            } else {
                /* 2684 */
                importJsonObjListToDataBaseForPushRepos(objType, list, type, url, user, pwd, reposStorePath, pushType, reposHashMap);
                /* 2685 */
                Log.debug("importDatabaseFromJsonFileForPushRepos() import OK");

            }

        }
        /* 2687 */
        return true;

    }


    private void importJsonObjListToDataBaseForPushRepos(int objType, JSONArray list, String type, String url, String user, String pwd, String reposStorePath, Integer pushType, HashMap<Integer, Integer> reposHashMap) {
        /* 2691 */
        for (int i = 0; i < list.size(); i++) {
            /* 2693 */
            JSONObject jsonObj = (JSONObject) list.get(i);
            /* 2695 */
            Object obj = buildObjectFromJsonObj(jsonObj, objType);
            /* 2696 */
            if (objType != 0) {
                /* 2698 */
                dbInsert(obj, objType, type, url, user, pwd);

            } else {
                /* 2702 */
                Repos repos = (Repos) obj;
                /* 2704 */
                if (reposHashMap.get(repos.getId()) != null) {
                    /* 2710 */
                    repos.setPath(reposStorePath);
                    /* 2711 */
                    repos.setRealDocPath(null);
                    /* 2712 */
                    repos.setLocalSvnPath(null);
                    /* 2713 */
                    repos.setLocalSvnPath1(null);
                    /* 2716 */
                    Repos oldRepos = getReposEx(repos.getId());
                    /* 2717 */
                    if (oldRepos == null) {
                        /* 2719 */
                        dbInsert(obj, objType, type, url, user, pwd);
                        /* 2723 */
                    } else if (pushType.intValue() == 0) {
                        /* 2725 */
                        Log.debug("importJsonObjListToDataBaseForPushRepos 仓库:" + repos.getId() + " 已存在,跳过");
                        /* 2726 */
                        reposHashMap.remove(repos.getId());
                        /* 2730 */
                    } else if (pushType.intValue() == 1) {
                        /* 2732 */
                        Log.debug("importJsonObjListToDataBaseForPushRepos 仓库:" + repos.getId() + " 已存在,强制覆盖");

                    } else {
                        /* 2736 */
                        Log.debug("importJsonObjListToDataBaseForPushRepos 仓库:" + repos.getId() + " 已存在,创建新仓库");
                        /* 2737 */
                        reposHashMap.remove(repos.getId());
                        /* 2739 */
                        repos.setId(null);
                        /* 2740 */
                        Long currentTime = Long.valueOf((new Date()).getTime());
                        /* 2741 */
                        repos.setCreateTime(currentTime);
                        /* 2743 */
                        dbInsert(obj, objType, type, url, user, pwd);
                        /* 2746 */
                        Repos newRepos = getNewAddedReposInfo(repos);
                        /* 2747 */
                        if (newRepos != null)
                            /* 2749 */ reposHashMap.put(newRepos.getId(), oldRepos.getId());

                    }

                }

            }

        }

    }


    private Repos getNewAddedReposInfo(Repos repos) {
        /* 2757 */
        Repos qRepos = new Repos();
        /* 2758 */
        qRepos.setCreateTime(repos.getCreateTime());
        /* 2759 */
        List<Repos> list = this.reposService.getReposList(repos);
        /* 2760 */
        if (list == null || list.size() == 0) {
            /* 2762 */
            Log.debug("新增仓库不存在！");
            /* 2763 */
            return null;

        }
        /* 2766 */
        if (list.size() != 1) {
            /* 2768 */
            Log.debug("系统存在多个创建时间相同的仓库！");
            /* 2769 */
            return null;

        }
        /* 2771 */
        return list.get(0);

    }


    @RequestMapping({"/pullDoc.do"})
    public void pullDoc(String taskId, Integer reposId, Long docId, Long pid, String path, String name, String serverId, Integer targetReposId, String targetDiskPath, Integer recurciveEn, Integer forceEn, Integer shareId, String authCode, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 2785 */
        Log.infoHead("************** pullDoc ****************");
        /* 2786 */
        Log.info("pullDoc  reposId:" + reposId + " path:" + path + " name:" + name +
                /* 2787 */         " serverId:" + serverId +
                /* 2788 */         " targetReposId:" + targetReposId + " targetDiskPath:" + targetDiskPath + " recurciveEn:" + recurciveEn + " forceEn:" + forceEn);
        /* 2790 */
        ReturnAjax rt = new ReturnAjax();
        /* 2792 */
        if (!RemotePullAccessCheck(rt)) {
            /* 2794 */
            writeJson(rt, response);

            return;

        }
        /* 2799 */
        ReposAccess reposAccess = null;
        /* 2800 */
        if (authCode != null) {
            /* 2802 */
            if (checkAuthCode(authCode, null, rt) == null) {
                /* 2804 */
                Log.debug("pullDoc checkAuthCode Failed");
                /* 2806 */
                writeJson(rt, response);

                return;

            }
            /* 2809 */
            reposAccess = getAuthCode(authCode).getReposAccess();

        } else {
            /* 2813 */
            reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

        }
        /* 2815 */
        if (reposAccess == null) {
            /* 2817 */
            Log.debug("pullDoc reposAccess is null");
            /* 2818 */
            rt.setError("非法访问");
            /* 2819 */
            writeJson(rt, response);

            return;

        }
        /* 2823 */
        Repos repos = getReposEx(reposId);
        /* 2824 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 2829 */
        UserPreferServer server = null;
        /* 2830 */
        if (serverId == null) {
            /* 2832 */
            AuthCode remoteStoraeAuthCode = generateAuthCode("remoteAccess", 86400000L, 1000000, reposAccess, null);
            /* 2833 */
            if (remoteStoraeAuthCode == null) {
                /* 2835 */
                Log.debug("pullDoc() 授权码生成失败");
                /* 2836 */
                writeJson(rt, response);

                return;

            }
            /* 2840 */
            String localServerUrl = getLocalMxsdocServerUrl(request);
            /* 2841 */
            Log.debug("pullDoc() localServerUrl:" + localServerUrl);
            /* 2843 */
            server = new UserPreferServer();
            /* 2844 */
            server.serverType = "mxsdoc";
            /* 2845 */
            server.serverUrl = localServerUrl;
            /* 2846 */
            server.url = localServerUrl;
            /* 2847 */
            server.authCode = remoteStoraeAuthCode.getCode();

        } else {
            /* 2851 */
            server = getUserPreferServer(serverId);
            /* 2852 */
            if (server == null) {
                /* 2854 */
                Log.debug("pullDoc() 服务器[" + serverId + "] 不存在");
                /* 2855 */
                rt.setError("服务器不存在！");
                /* 2856 */
                writeJson(rt, response);

                return;

            }

        }
        /* 2862 */
        String reposPath = Path.getReposPath(repos);
        /* 2863 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 2864 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 2865 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, Long.valueOf(0L), null);
        /* 2867 */
        Boolean ret = Boolean.valueOf(false);
        /* 2869 */
        boolean recurcive = false;
        /* 2870 */
        if (recurciveEn != null && recurciveEn.intValue() == 1)
            /* 2872 */ recurcive = true;
        /* 2875 */
        int pullType = 20;
        /* 2876 */
        if (forceEn != null && forceEn.intValue() == 1)
            /* 2878 */ pullType = 30;
        /* 2881 */
        String commitMsg = "文件拉取";
        /* 2882 */
        RemoteStorageConfig remoteStorageConfig = null;
        /* 2883 */
        if (server.serverType.equals("mxsdoc")) {
            /* 2885 */
            if (targetReposId == null) {
                /* 2887 */
                if (targetDiskPath == null || targetDiskPath.isEmpty()) {
                    /* 2889 */
                    Log.debug("pullDoc targetDiskPath is empty");
                    /* 2890 */
                    rt.setError("磁盘路径不能为空");
                    /* 2891 */
                    writeJson(rt, response);

                    return;

                }
                /* 2895 */
                targetDiskPath = Path.localDirPathFormat(targetDiskPath, Integer.valueOf(OSType));
                /* 2896 */
                server.remoteDirectory = targetDiskPath;

            } else {
                /* 2900 */
                server.reposId = targetReposId;

            }
            /* 2902 */
            remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);
            /* 2904 */
            if (targetReposId != null) {
                /* 2906 */
                remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "_Repos" + targetReposId + "/Doc";

            } else {
                /* 2910 */
                remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "_Disk" + targetDiskPath.hashCode() + "/Doc";

            }

        } else {
            /* 2915 */
            remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);
            /* 2916 */
            remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "/Doc";

        }
        /* 2919 */
        ret = Boolean.valueOf(channel.remoteStoragePull(remoteStorageConfig, repos, doc, reposAccess.getAccessUser(), commitMsg, recurcive, pullType, rt));
        /* 2921 */
        writeJson(rt, response);
        /* 2923 */
        if (!ret.booleanValue()) {
            /* 2925 */
            addSystemLog(request, reposAccess.getAccessUser(), "pullDoc", "pullDoc", "文件拉取", taskId, "失败", repos, doc, null, buildSystemLogDetailContent(rt));

        } else {
            /* 2929 */
            addSystemLog(request, reposAccess.getAccessUser(), "pullDoc", "pullDoc", "文件拉取", taskId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));

        }

    }


    private boolean RemotePullAccessCheck(ReturnAjax rt) {
        /* 2934 */
        switch (docSysType) {

            case 2:
                /* 2937 */
                docSysErrorLog("专业版不支持远程拉取，请购买企业版！", rt);
                /* 2938 */
                return false;

            case 3:
                /* 2940 */
                docSysErrorLog("个人版不支持远程拉取，请购买企业版！", rt);
                /* 2941 */
                return false;

            case 0:
                /* 2943 */
                docSysErrorLog("开源版不支持远程拉取，请购买企业版！", rt);
                /* 2944 */
                return false;

        }
        /* 2946 */
        return true;

    }


    @RequestMapping({"/pushDoc.do"})
    public void pushDoc(String taskId, Integer reposId, Long docId, Long pid, String path, String name, String serverId, Integer targetReposId, String targetDiskPath, String targetPath, Integer recurciveEn, Integer forceEn, Integer shareId, String authCode, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 2961 */
        Log.infoHead("************** pushDoc ****************");
        /* 2962 */
        Log.info("pushDoc  reposId:" + reposId + " path:" + path + " name:" + name +
                /* 2963 */         " serverId:" + serverId +
                /* 2964 */         " targetReposId:" + targetReposId +
                /* 2965 */         " targetDiskPath:" + targetDiskPath +
                /* 2966 */         " targetPath:" + targetPath +
                /* 2967 */         " recurciveEn:" + recurciveEn + " forceEn:" + forceEn);
        /* 2969 */
        ReturnAjax rt = new ReturnAjax();
        /* 2971 */
        if (!RemotePushAccessCheck(rt)) {
            /* 2973 */
            writeJson(rt, response);

            return;

        }
        /* 2978 */
        ReposAccess reposAccess = null;
        /* 2979 */
        if (authCode != null) {
            /* 2981 */
            if (checkAuthCode(authCode, null, rt) == null) {
                /* 2983 */
                Log.debug("pushDoc checkAuthCode Failed");
                /* 2985 */
                writeJson(rt, response);

                return;

            }
            /* 2988 */
            reposAccess = getAuthCode(authCode).getReposAccess();

        } else {
            /* 2992 */
            reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

        }
        /* 2994 */
        if (reposAccess == null) {
            /* 2996 */
            Log.debug("pushDoc reposAccess is null");
            /* 2997 */
            rt.setError("非法访问");
            /* 2998 */
            writeJson(rt, response);

            return;

        }
        /* 3002 */
        Repos repos = getReposEx(reposId);
        /* 3003 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 3008 */
        UserPreferServer server = null;
        /* 3009 */
        if (serverId == null) {
            /* 3011 */
            AuthCode remoteStoraeAuthCode = generateAuthCode("remoteAccess", 86400000L, 1000000, reposAccess, null);
            /* 3012 */
            if (remoteStoraeAuthCode == null) {
                /* 3014 */
                Log.debug("pushDoc() 授权码生成失败");
                /* 3015 */
                writeJson(rt, response);

                return;

            }
            /* 3019 */
            String localServerUrl = getLocalMxsdocServerUrl(request);
            /* 3020 */
            Log.debug("pushDoc() localServerUrl:" + localServerUrl);
            /* 3022 */
            server = new UserPreferServer();
            /* 3023 */
            server.serverType = "mxsdoc";
            /* 3024 */
            server.serverUrl = localServerUrl;
            /* 3025 */
            server.url = localServerUrl;
            /* 3026 */
            server.authCode = remoteStoraeAuthCode.getCode();

        } else {
            /* 3030 */
            server = getUserPreferServer(serverId);
            /* 3031 */
            if (server == null) {
                /* 3033 */
                Log.debug("pushDoc() 服务器[" + serverId + "] 不存在");
                /* 3034 */
                rt.setError("服务器不存在！");
                /* 3035 */
                writeJson(rt, response);

                return;

            }

        }
        /* 3041 */
        String reposPath = Path.getReposPath(repos);
        /* 3042 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 3043 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 3044 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, Long.valueOf(0L), null);
        /* 3046 */
        if (targetPath != null) {
            /* 3048 */
            targetPath = Path.dirPathFormat(targetPath);
            /* 3049 */
            if (targetPath.equals(doc.getPath())) {
                /* 3051 */
                targetPath = null;

            } else {
                /* 3055 */
                doc.offsetPath = targetPath;
                /* 3056 */
                doc.rebasePath = doc.getPath();

            }

        }
        /* 3060 */
        Doc localDoc = docSysGetDoc(repos, doc, false);
        /* 3061 */
        if (localDoc == null || localDoc.getType().intValue() == 0) {
            /* 3063 */
            docSysErrorLog("文件 " + path + name + " 不存在！", rt);
            /* 3064 */
            writeJson(rt, response);

            return;

        }
        /* 3068 */
        Boolean ret = Boolean.valueOf(false);
        /* 3070 */
        boolean recurcive = false;
        /* 3071 */
        if (recurciveEn != null && recurciveEn.intValue() == 1)
            /* 3073 */ recurcive = true;
        /* 3076 */
        int pushType = 20;
        /* 3077 */
        if (forceEn != null && forceEn.intValue() == 1)
            /* 3079 */ pushType = 30;
        /* 3082 */
        String commitMsg = "文件推送";
        /* 3083 */
        RemoteStorageConfig remoteStorageConfig = null;
        /* 3084 */
        if (server.serverType.equals("mxsdoc")) {
            /* 3086 */
            if (targetReposId == null) {
                /* 3088 */
                if (targetDiskPath == null || targetDiskPath.isEmpty()) {
                    /* 3090 */
                    Log.debug("pushDoc targetDiskPath is empty");
                    /* 3091 */
                    rt.setError("磁盘路径不能为空");
                    /* 3092 */
                    writeJson(rt, response);

                    return;

                }
                /* 3096 */
                targetDiskPath = Path.localDirPathFormat(targetDiskPath, Integer.valueOf(OSType));
                /* 3097 */
                server.remoteDirectory = targetDiskPath;

            } else {
                /* 3101 */
                server.reposId = targetReposId;

            }
            /* 3103 */
            remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);
            /* 3105 */
            if (targetReposId != null) {
                /* 3107 */
                if (targetPath == null) {
                    /* 3109 */
                    remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "_Repos" + targetReposId + "/Doc";

                } else {
                    /* 3114 */
                    remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "_Repos" + targetReposId + "_TargetPath" + targetPath.hashCode() + "/Doc";

                }

            } else {
                /* 3119 */
                remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "_Disk" + targetDiskPath.hashCode() + "/Doc";

            }

        } else {
            /* 3124 */
            remoteStorageConfig = convertFileServerConfigToRemoteStorageConfig(server);
            /* 3125 */
            remoteStorageConfig.remoteStorageIndexLib = String.valueOf(Path.getReposIndexLibPath(repos)) + "FileServer/" + server.serverUrl.hashCode() + "/Doc";

        }
        /* 3128 */
        ret = Boolean.valueOf(channel.remoteStoragePush(remoteStorageConfig, repos, localDoc, reposAccess.getAccessUser(), commitMsg, recurcive, pushType, rt));
        /* 3130 */
        writeJson(rt, response);
        /* 3132 */
        if (!ret.booleanValue()) {
            /* 3134 */
            addSystemLog(request, reposAccess.getAccessUser(), "pushDoc", "pushDoc", "文件推送", taskId, "失败", repos, localDoc, null, buildSystemLogDetailContent(rt));

        } else {
            /* 3138 */
            addSystemLog(request, reposAccess.getAccessUser(), "pushDoc", "pushDoc", "文件推送", taskId, "成功", repos, localDoc, null, buildSystemLogDetailContent(rt));

        }

    }


    private boolean RemotePushAccessCheck(ReturnAjax rt) {
        /* 3144 */
        switch (docSysType) {

            case 0:
                /* 3153 */
                docSysErrorLog("开源版不支持远程推送，请购买企业版！", rt);
                /* 3154 */
                return false;

        }
        /* 3156 */
        return true;

    }


    @RequestMapping({"/saveDocEx.do"})
    protected void saveDocEx(String taskId, Integer isRealDoc, Integer reposId, String remoteDirectory, String path, String name, Integer type, Long size, String checkSum, String vPath, String vName, Integer isComplete, MultipartFile uploadFile, Integer chunkIndex, Integer chunkNum, Long chunkSize, String chunkHash, String chunkTmpPath, String dirPath, Long batchStartTime, Integer totalCount, Integer isEnd, String commitMsg, Integer shareId, String authCode, HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        /* 3174 */
        Log.infoHead("************** saveDocEx ****************");
        /* 3175 */
        Log.info("saveDocEx reposId:" + reposId + " targetPath:" + path + " targetName:" + name + " size:" + size + " checkSum:" + checkSum + " isRealDoc:" + isRealDoc + " type:" + type + " shareId:" + shareId + " authCode:" + authCode);
        /* 3176 */
        Log.info("saveDocEx chunkNum:" + chunkNum + " chunkIndex:" + chunkIndex + " chunkSize:" + chunkSize + " chunkHash:" + chunkHash + " chunkTmpPath:" + chunkTmpPath + " isEnd:" + isEnd);
        /* 3178 */
        ReturnAjax rt = new ReturnAjax();

        try {
            /* 3180 */
            Log.debug("saveDocEx path:" + path + " name:" + name);
            /* 3182 */
            byte[] docData = null;
            /* 3185 */
            if (reposId == null) {
                /* 3187 */
                if (remoteDirectory == null) {
                    /* 3189 */
                    rt.setError("服务器路径不能为空！");
                    /* 3190 */
                    writeJson(rt, response);
                    /* 3192 */
                    docSysDebugLog("saveDocEx() add doc [" + path + name + "] Failed: remoteDirectory is null", rt);

                    return;

                }
                /* 3196 */
                User accessUser = superAdminAccessCheck(authCode, null, session, rt);
                /* 3197 */
                if (accessUser == null) {
                    /* 3199 */
                    writeJson(rt, response);

                    return;

                }
                /* 3203 */
                if (type == null || (type.intValue() == 1 && size.longValue() > 0L)) {
                    /* 3205 */
                    docData = uploadFile.getBytes();
                    /* 3206 */
                    if (docData == null) {
                        /* 3208 */
                        rt.setError("读取文件数据失败");
                        /* 3209 */
                        writeJson(rt, response);

                        return;

                    }
                    /* 3216 */
                    if (!checkChunkHash(docData, chunkSize, chunkHash)) {
                        /* 3218 */
                        rt.setError("数据校验失败");
                        /* 3219 */
                        writeJson(rt, response);

                        return;

                    }

                }
                /* 3224 */
                saveDocToDisk(
                        /* 3225 */             "saveDocEx", "saveDocEx", "推送文件", taskId,
                        /* 3226 */             remoteDirectory, path, name, null, type, null,
                        /* 3227 */             null,
                        /* 3228 */             null,
                        /* 3229 */             docData,
                        /* 3230 */             null, null, null, null, null,
                        /* 3231 */             commitMsg,
                        /* 3232 */             dirPath, batchStartTime, totalCount, isEnd,
                        /* 3233 */             accessUser,
                        /* 3234 */             rt,
                        /* 3235 */             response, request, session);

                return;

            }
            /* 3240 */
            ReposAccess reposAccess = checkAndGetAccessInfoEx(authCode, null, shareId, session, request, response, reposId, path, name, true, rt);
            /* 3241 */
            if (reposAccess == null) {
                /* 3243 */
                writeJson(rt, response);

                return;

            }
            /* 3247 */
            Repos repos = getReposEx(reposId);
            /* 3248 */
            if (!reposCheck(repos, rt, response))
                return;
            /* 3253 */
            if (type == null || (type.intValue() == 1 && size.longValue() > 0L)) {
                /* 3255 */
                docData = uploadFile.getBytes();
                /* 3256 */
                if (docData == null) {
                    /* 3258 */
                    rt.setError("读取文件数据失败");
                    /* 3259 */
                    writeJson(rt, response);

                    return;

                }
                /* 3266 */
                if (!checkChunkHash(docData, chunkSize, chunkHash)) {
                    /* 3268 */
                    rt.setError("数据校验失败");
                    /* 3269 */
                    writeJson(rt, response);

                    return;

                }

            }
            /* 3274 */
            if (isRealDoc == null || isRealDoc.intValue() == 1) {
                /* 3276 */
                if (commitMsg == null || commitMsg.isEmpty())
                    /* 3278 */ commitMsg = "推送文件 [" + path + name + "]";
                /* 3280 */
                saveDocToRepos(
                        /* 3281 */             "saveDocEx", "saveDocEx", "文件推送", taskId,
                        /* 3282 */             repos, path, name, size, type, checkSum,
                        /* 3283 */             null,
                        /* 3284 */             null,
                        /* 3285 */             docData,
                        /* 3286 */             chunkIndex, chunkNum, chunkSize, chunkHash, null,
                        /* 3287 */             "推送 [" + path + name + "]",
                        /* 3288 */             dirPath, batchStartTime, totalCount, isEnd,
                        /* 3289 */             reposAccess,
                        /* 3290 */             rt,
                        /* 3291 */             response, request, session);

                return;

            }
            /* 3296 */
            saveVirtualDocToRepos(
                    /* 3297 */           "saveDocEx", "saveDocEx", "备注推送", taskId,
                    /* 3298 */           repos, path, name, size, type, checkSum,
                    /* 3299 */           vPath, vName, isComplete,
                    /* 3300 */           docData,
                    /* 3301 */           chunkIndex, chunkNum, chunkSize, chunkHash,
                    /* 3302 */           commitMsg,
                    /* 3303 */           reposAccess.getAccessUser(),
                    /* 3304 */           rt,
                    /* 3305 */           request, response);
            /* 3306 */
            writeJson(rt, response);
            /* 3308 */
        } catch (Exception e) {
            /* 3309 */
            Log.debug("saveDocEx saveFile Failed");
            /* 3310 */
            errorLog(e);
            /* 3311 */
            rt.setError("系统异常");
            /* 3312 */
            writeJson(rt, response);

        }

    }


    private boolean checkChunkHash(byte[] docData, Long chunkSize, String expChunkHash) {
        /* 3318 */
        if (docData.length != chunkSize.longValue())
            /* 3320 */ return false;
        /* 3323 */
        String chunkHash = MD5.md5(docData);
        /* 3324 */
        if (chunkHash.equals(expChunkHash))
            /* 3326 */ return true;
        /* 3328 */
        Log.debug("saveDocEx chunkHash:" + chunkHash + " not matched with expChunkHash:" + expChunkHash);
        /* 3329 */
        return false;

    }


    private void saveVirtualDocToRepos(String event, String subEvent, String eventName, String queryId, Repos repos, String path, String name, Long size, Integer type, String checkSum, String vPath, String vName, Integer isComplete, byte[] docData, Integer chunkIndex, Integer chunkNum, Long chunkSize, String chunkHash, String commitMsg, User accessUser, ReturnAjax rt, HttpServletRequest request, HttpServletResponse response) {
        /* 3343 */
        Log.debug("saveVirtualDocToRepos isComplete:" + isComplete + " vPath:" + path + " vName:" + name);
        /* 3346 */
        String reposPath = Path.getReposPath(repos);
        /* 3347 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 3348 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 3349 */
        Doc doc = buildBasicDoc(repos.getId(), null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
        /* 3351 */
        if (isComplete == null || isComplete.intValue() == 0) {
            /* 3353 */
            String localParentPath = String.valueOf(localVRootPath) + Path.getVDocName(doc) + "/" + vPath;
            /* 3354 */
            File localParentDir = new File(localParentPath);
            /* 3355 */
            if (!localParentDir.exists())
                /* 3357 */ localParentDir.mkdirs();
            /* 3359 */
            String chunkTmpPath = Path.getReposTmpPathForUpload(repos, accessUser);
            /* 3362 */
            saveDocDataToFile(localParentPath, vName,
                    /* 3363 */           type, size, checkSum,
                    /* 3364 */           docData,
                    /* 3365 */           chunkIndex, chunkNum, chunkSize, chunkHash, chunkTmpPath,
                    /* 3366 */           rt);
            /* 3367 */
            writeJson(rt, response);

        } else {
            /* 3371 */
            Log.debug("saveVirtualDocToRepos commitVirualDoc path:" + path + " name:" + name);
            /* 3373 */
            if (commitMsg == null)
                /* 3375 */ commitMsg = "更新备注 [" + path + name + "]";
            /* 3378 */
            List<CommonAction> actionList = new ArrayList<>();
            /* 3379 */
            boolean ret = commitVirualDoc(repos, doc, commitMsg, accessUser.getName(), accessUser, rt, actionList);
            /* 3380 */
            writeJson(rt, response);
            /* 3382 */
            addSystemLog(request, accessUser, event, subEvent, eventName, queryId, "成功", repos, doc, null, buildSystemLogDetailContent(rt));
            /* 3384 */
            if (ret) {
                /* 3386 */
                deleteTmpVirtualDocContent(repos, doc, accessUser);
                /* 3387 */
                executeCommonActionList(actionList, rt);

            }

        }

    }


    private boolean saveDocDataToFile(String localParentPath, String name, Integer type, Long size, String checkSum, byte[] docData, Integer chunkIndex, Integer chunkNum, Long chunkSize, String chunkHash, String chunkTmpPath, ReturnAjax rt) {
        /* 3397 */
        Log.debug("saveDocDataToFile() localParentPath:" + localParentPath + " name:" + name + " size:" + size);
        /* 3399 */
        if (type.intValue() == 2) {
            /* 3401 */
            File file = new File(String.valueOf(localParentPath) + name);
            /* 3402 */
            if (!file.exists())
                /* 3404 */ return file.mkdirs();
            /* 3406 */
            return true;

        }
        /* 3410 */
        File localParentDir = new File(localParentPath);
        /* 3411 */
        if (!localParentDir.exists())
            /* 3413 */ localParentDir.mkdirs();
        /* 3417 */
        if (size.longValue() == 0L)
            /* 3419 */ if (!FileUtil.createFile(localParentPath, name)) {
            /* 3421 */
            docSysErrorLog("文件 " + name + " 新建失败!", rt);
            /* 3422 */
            return false;

        }
        /* 3427 */
        if (chunkNum != null) {
            /* 3430 */
            String fileChunkName = String.valueOf(name) + "_" + chunkIndex;
            /* 3431 */
            if (!FileUtil.saveDataToFile(docData, chunkTmpPath, fileChunkName)) {
                /* 3433 */
                docSysErrorLog("分片文件 " + fileChunkName + " 暂存失败!", rt);
                /* 3434 */
                return false;

            }
            /* 3437 */
            if (chunkIndex.intValue() < chunkNum.intValue() - 1) {
                /* 3439 */
                rt.setData(chunkIndex);
                /* 3440 */
                return false;

            }

        }
        /* 3445 */
        if (chunkNum == null) {
            /* 3447 */
            if (!FileUtil.saveDataToFile(docData, localParentPath, name)) {
                /* 3449 */
                docSysErrorLog("文件 " + name + " 保存失败!", rt);
                /* 3450 */
                return false;

            }
            /* 3453 */
        } else if (chunkNum.intValue() == 1) {
            /* 3455 */
            String chunk0Path = String.valueOf(chunkTmpPath) + name + "_0";
            /* 3456 */
            if (!(new File(chunk0Path)).exists())
                /* 3458 */ chunk0Path = String.valueOf(chunkTmpPath) + name;
            /* 3460 */
            if (!FileUtil.moveFileOrDir(chunkTmpPath, String.valueOf(name) + "_0", localParentPath, name, true)) {
                /* 3462 */
                docSysErrorLog("文件 " + name + " 保存失败!", rt);
                /* 3463 */
                return false;

            }
            /* 3468 */
        } else if (combineChunks(localParentPath, name, chunkNum, chunkSize, chunkTmpPath) == null) {
            /* 3470 */
            docSysErrorLog("文件合并失败", rt);
            /* 3471 */
            return false;

        }
        /* 3476 */
        if (!checkFileSizeAndCheckSum(localParentPath, name, size, checkSum)) {
            /* 3478 */
            docSysErrorLog("文件校验失败", rt);
            /* 3479 */
            return false;

        }
        /* 3482 */
        deleteChunks(name, chunkIndex, chunkNum, chunkTmpPath);
        /* 3483 */
        return true;

    }


    protected byte[] getDataFromHttpRequest(HttpServletRequest request) {

        try {
            /* 3489 */
            int len = request.getContentLength();
            /* 3490 */
            Log.debug("getDataFromHttpRequest len:" + len);
            /* 3491 */
            ServletInputStream in = request.getInputStream();
            /* 3492 */
            byte[] buffer = new byte[len];
            /* 3493 */
            in.read(buffer, 0, len);
            /* 3494 */
            return buffer;
            /* 3496 */
        } catch (Exception ex) {
            /* 3498 */
            return null;

        }

    }


    @RequestMapping({"/saveDoc.do"})
    protected void saveDoc(Integer vid, String path, String name, String targetPath, String targetName, Integer shareId, String authCode, HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        /* 3509 */
        Log.infoHead("************** saveDoc.do ****************");
        /* 3510 */
        Log.info("saveDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " shareId:" + shareId + " authCode:" + authCode);
        /* 3512 */
        Integer reposId = vid;
        /* 3514 */
        PrintWriter writer = null;

        try {
            /* 3516 */
            writer = response.getWriter();
            /* 3517 */
            ReturnAjax rt = new ReturnAjax();
            /* 3520 */
            path = new String(path.getBytes("ISO8859-1"), "UTF-8");
            /* 3521 */
            path = Base64Util.base64Decode(path);
            /* 3522 */
            name = new String(name.getBytes("ISO8859-1"), "UTF-8");
            /* 3523 */
            name = Base64Util.base64Decode(name);
            /* 3524 */
            targetPath = new String(targetPath.getBytes("ISO8859-1"), "UTF-8");
            /* 3525 */
            targetPath = Base64Util.base64Decode(targetPath);
            /* 3526 */
            targetName = new String(targetName.getBytes("ISO8859-1"), "UTF-8");
            /* 3527 */
            targetName = Base64Util.base64Decode(targetName);
            /* 3530 */
            ReposAccess reposAccess = null;
            /* 3531 */
            if (authCode != null) {
                /* 3533 */
                if (checkAuthCode(authCode, null, rt) == null) {
                    /* 3535 */
                    Log.debug("saveDoc checkAuthCode Failed");
                    /* 3536 */
                    writer.write("授权码校验失败");

                    return;

                }
                /* 3539 */
                reposAccess = getAuthCode(authCode).getReposAccess();

            } else {
                /* 3543 */
                reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

            }
            /* 3545 */
            if (reposAccess == null) {
                /* 3547 */
                Log.debug("saveDoc reposAccess is null");
                /* 3548 */
                writer.write("reposAccess is null");

                return;

            }
            /* 3553 */
            Repos repos = getReposEx(reposId);
            /* 3554 */
            if (repos == null) {
                /* 3556 */
                docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
                /* 3557 */
                writer.write("仓库 " + reposId + " 不存在！");

                return;

            }
            /* 3561 */
            if (repos.disabled != null) {
                /* 3563 */
                docSysErrorLog("仓库 " + repos.getName() + " is disabled:" + repos.disabled, rt);
                /* 3564 */
                writer.write("仓库已被禁用:" + repos.disabled);

                return;

            }
            /* 3568 */
            if (repos.isBusy.booleanValue()) {
                /* 3570 */
                docSysErrorLog("仓库 " + repos.getName() + " is busy", rt);
                /* 3571 */
                writer.write("仓库当前不支持访问，请联系系统管理员！");

                return;

            }
            /* 3575 */
            String reposPath = Path.getReposPath(repos);
            /* 3576 */
            String localRootPath = Path.getReposRealPath(repos);
            /* 3577 */
            String localVRootPath = Path.getReposVirtualPath(repos);
            /* 3578 */
            Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, Integer.valueOf(1), true, localRootPath, localVRootPath, null, null);
            /* 3581 */
            String localParentPath = String.valueOf(localRootPath) + doc.getPath();
            /* 3582 */
            File localParentDir = new File(localParentPath);
            /* 3583 */
            if (!localParentDir.exists())
                /* 3585 */ localParentDir.mkdirs();
            /* 3589 */
            Doc localDoc = docSysGetDoc(repos, doc, false);
            /* 3590 */
            if (localDoc == null || localDoc.getType().intValue() == 0) {
                /* 3592 */
                Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, doc.getReposPath(), doc.getPath(), "", null, Integer.valueOf(2), true, localRootPath, localVRootPath, null, null);
                /* 3593 */
                if (!checkUserAddRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt)) {
                    /* 3595 */
                    docSysErrorLog("用户没有新增权限", rt);
                    /* 3596 */
                    writer.write("用户没有新增权限");

                    return;

                }
                /* 3602 */
            } else if (!checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt)) {
                /* 3604 */
                docSysErrorLog("用户没有修改权限", rt);
                /* 3605 */
                writer.write("用户没有修改权限");

                return;

            }
            /* 3611 */
            String body = "";

            try {
                /* 3614 */
                Scanner scanner = new Scanner((InputStream) request.getInputStream());
                /* 3615 */
                scanner.useDelimiter("\\A");
                /* 3616 */
                body = scanner.hasNext() ? scanner.next() : "";
                /* 3617 */
                scanner.close();
                /* 3619 */
            } catch (Exception ex) {
                /* 3621 */
                writer.write("get request.getInputStream error:" + ex.getMessage());

                return;

            }
            /* 3625 */
            if (body.isEmpty()) {
                /* 3627 */
                writer.write("empty request.getInputStream");

                return;

            }
            /* 3632 */
            ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "saveDoc", "saveDoc", "协同编辑保存", null, repos, doc, null, null);
            /* 3633 */
            context.info = "协同编辑保存 [" + doc.getPath() + doc.getName() + "]";
            /* 3634 */
            context.commitMsg = context.info;
            /* 3635 */
            context.commitUser = reposAccess.getAccessUser().getName();
            /* 3637 */
            Log.debug("saveDoc body:" + body);
            /* 3638 */
            JSONObject jsonObj = JSON.parseObject(body);
            /* 3640 */
            int status = ((Integer) jsonObj.get("status")).intValue();
            /* 3641 */
            if (status == 2 || status == 3) {
                /* 3643 */
                String downloadUri = (String) jsonObj.get("url");
                /* 3645 */
                String chunkParentPath = Path.getReposTmpPathForUpload(repos, reposAccess.getAccessUser());
                /* 3646 */
                String chunkName = String.valueOf(doc.getName()) + "_0";
                /* 3647 */
                if (downloadFileFromUrl(downloadUri, chunkParentPath, chunkName) == null) {
                    /* 3649 */
                    docSysErrorLog("下载文件失败 downloadUri=" + downloadUri, rt);
                    /* 3651 */
                    writer.write("{\"error\":1}");

                    return;

                }
                /* 3655 */
                Long chunkSize = Long.valueOf((new File(String.valueOf(chunkParentPath) + chunkName)).length());
                /* 3656 */
                Log.debug("saveDoc() chunkSize:" + chunkSize);
                /* 3657 */
                doc.setSize(chunkSize);
                /* 3659 */
                int ret = 0;
                /* 3660 */
                if (localDoc == null || localDoc.getType().intValue() == 0) {
                    /* 3662 */
                    ret = addDoc(repos, doc,
                            /* 3663 */               null,
                            /* 3664 */               Integer.valueOf(1), chunkSize, chunkParentPath, context.commitMsg, context.commitUser, reposAccess.getAccessUser(), rt, context);
                    /* 3666 */
                    switch (ret) {

                        case 0:
                            /* 3669 */
                            writer.write("{\"error\":-1}");
                            /* 3670 */
                            addSystemLog(context, reposAccess.getAccessUser(), "失败", buildSystemLogDetailContent(rt));

                            return;

                        case 1:
                            /* 3673 */
                            writer.write("{\"error\":0}");
                            /* 3674 */
                            deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                            /* 3675 */
                            addSystemLog(context, reposAccess.getAccessUser(), "成功", buildSystemLogDetailContent(rt));

                            return;

                    }
                    /* 3678 */
                    writer.write("{\"error\":0}");
                    /* 3679 */
                    deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);

                } else {
                    /* 3685 */
                    ret = updateDoc(repos, doc,
                            /* 3686 */               null,
                            /* 3687 */               Integer.valueOf(1), chunkSize, chunkParentPath, context.commitMsg, context.commitUser, reposAccess.getAccessUser(), rt, context);
                    /* 3689 */
                    switch (ret) {

                        case 0:
                            /* 3692 */
                            writer.write("{\"error\":-1}");
                            /* 3693 */
                            addSystemLog(context, reposAccess.getAccessUser(), "失败", buildSystemLogDetailContent(rt));

                            return;

                        case 1:
                            /* 3696 */
                            writer.write("{\"error\":0}");
                            /* 3697 */
                            deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                            /* 3698 */
                            deletePreviewFile(doc);
                            /* 3699 */
                            addSystemLog(context, reposAccess.getAccessUser(), "成功", buildSystemLogDetailContent(rt));

                            return;

                    }
                    /* 3702 */
                    writer.write("{\"error\":0}");
                    /* 3703 */
                    deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                    /* 3704 */
                    deletePreviewFile(doc);

                }

                return;

            }
            /* 3711 */
            Log.debug("这是打开文件的调用，返回error:0表示可以编辑");
            /* 3712 */
            writer.write("{\"error\":0}");
            /* 3713 */
        } catch (Exception e) {
            /* 3714 */
            Log.debug("saveDoc saveFile Failed");
            /* 3715 */
            writer.write("{\"error\":-1}");
            /* 3716 */
            errorLog(e);

        }

    }


    @RequestMapping({"/saveDoc/{vid}/{path}/{name}/{targetPath}/{targetName}/{authCode}/{shareId}"})
    protected void saveDoc(@PathVariable("vid") Integer vid, @PathVariable("path") String path, @PathVariable("name") String name, @PathVariable("targetPath") String targetPath, @PathVariable("targetName") String targetName, @PathVariable("authCode") String authCode, @PathVariable("shareId") Integer shareId, HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        /* 3728 */
        Log.infoHead("************** saveDoc ****************");
        /* 3729 */
        Log.info("saveDoc reposId:" + vid + " path:" + path + " name:" + name + " targetPath:" + targetPath + " targetName:" + targetName + " shareId:" + shareId + " authCode:" + authCode);
        /* 3731 */
        Integer reposId = vid;
        /* 3733 */
        PrintWriter writer = null;

        try {
            /* 3735 */
            writer = response.getWriter();
            /* 3736 */
            ReturnAjax rt = new ReturnAjax();
            /* 3739 */
            path = new String(path.getBytes("ISO8859-1"), "UTF-8");
            /* 3740 */
            path = Base64Util.base64Decode(path);
            /* 3741 */
            name = new String(name.getBytes("ISO8859-1"), "UTF-8");
            /* 3742 */
            name = Base64Util.base64Decode(name);
            /* 3743 */
            targetPath = new String(targetPath.getBytes("ISO8859-1"), "UTF-8");
            /* 3744 */
            targetPath = Base64Util.base64Decode(targetPath);
            /* 3745 */
            targetName = new String(targetName.getBytes("ISO8859-1"), "UTF-8");
            /* 3746 */
            targetName = Base64Util.base64Decode(targetName);
            /* 3749 */
            ReposAccess reposAccess = null;
            /* 3750 */
            if (authCode != null) {
                /* 3752 */
                if (checkAuthCode(authCode, null, rt) == null) {
                    /* 3754 */
                    Log.debug("saveDoc checkAuthCode Failed");
                    /* 3755 */
                    writer.write("授权码校验失败");

                    return;

                }
                /* 3758 */
                reposAccess = getAuthCode(authCode).getReposAccess();

            } else {
                /* 3762 */
                reposAccess = checkAndGetAccessInfo(shareId, session, request, response, null, null, null, false, rt);

            }
            /* 3764 */
            if (reposAccess == null) {
                /* 3766 */
                Log.debug("saveDoc reposAccess is null");
                /* 3767 */
                writer.write("reposAccess is null");

                return;

            }
            /* 3772 */
            Repos repos = getReposEx(reposId);
            /* 3773 */
            if (repos == null) {
                /* 3775 */
                docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
                /* 3776 */
                writer.write("仓库 " + reposId + " 不存在！");

                return;

            }
            /* 3780 */
            if (repos.disabled != null) {
                /* 3782 */
                docSysErrorLog("仓库 " + repos.getName() + " is disabled:" + repos.disabled, rt);
                /* 3783 */
                writer.write("仓库已被禁用:" + repos.disabled);

                return;

            }
            /* 3787 */
            if (repos.isBusy.booleanValue()) {
                /* 3789 */
                docSysErrorLog("仓库 " + repos.getName() + " is busy", rt);
                /* 3790 */
                writer.write("仓库当前不支持访问，请联系系统管理员！");

                return;

            }
            /* 3795 */
            String reposPath = Path.getReposPath(repos);
            /* 3796 */
            String localRootPath = Path.getReposRealPath(repos);
            /* 3797 */
            String localVRootPath = Path.getReposVirtualPath(repos);
            /* 3798 */
            Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, Integer.valueOf(1), true, localRootPath, localVRootPath, null, null);
            /* 3801 */
            String localParentPath = String.valueOf(localRootPath) + doc.getPath();
            /* 3802 */
            File localParentDir = new File(localParentPath);
            /* 3803 */
            if (!localParentDir.exists())
                /* 3805 */ localParentDir.mkdirs();
            /* 3809 */
            Doc localDoc = docSysGetDoc(repos, doc, false);
            /* 3810 */
            if (localDoc == null || localDoc.getType().intValue() == 0) {
                /* 3812 */
                Doc parentDoc = buildBasicDoc(reposId, doc.getPid(), null, doc.getReposPath(), doc.getPath(), "", null, Integer.valueOf(2), true, localRootPath, localVRootPath, null, null);
                /* 3813 */
                if (!checkUserAddRight(repos, reposAccess.getAccessUser().getId(), parentDoc, reposAccess.getAuthMask(), rt)) {
                    /* 3815 */
                    docSysErrorLog("用户没有新增权限", rt);
                    /* 3816 */
                    writer.write("用户没有新增权限");

                    return;

                }
                /* 3822 */
            } else if (!checkUserEditRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt)) {
                /* 3824 */
                docSysErrorLog("用户没有修改权限", rt);
                /* 3825 */
                writer.write("用户没有修改权限");

                return;

            }
            /* 3831 */
            String body = "";

            try {
                /* 3834 */
                Scanner scanner = new Scanner((InputStream) request.getInputStream());
                /* 3835 */
                scanner.useDelimiter("\\A");
                /* 3836 */
                body = scanner.hasNext() ? scanner.next() : "";
                /* 3837 */
                scanner.close();
                /* 3839 */
            } catch (Exception ex) {
                /* 3841 */
                writer.write("get request.getInputStream error:" + ex.getMessage());

                return;

            }
            /* 3845 */
            if (body.isEmpty()) {
                /* 3847 */
                writer.write("empty request.getInputStream");

                return;

            }
            /* 3851 */
            Log.debug("saveDoc body:" + body);
            /* 3852 */
            JSONObject jsonObj = JSON.parseObject(body);
            /* 3855 */
            ActionContext context = buildBasicActionContext(getRequestIpAddress(request), reposAccess.getAccessUser(), "saveDoc", "saveDoc", "协同编辑保存", null, repos, doc, null, null);
            /* 3856 */
            context.info = "协同编辑保存 [" + doc.getPath() + doc.getName() + "]";
            /* 3857 */
            context.commitMsg = context.info;
            /* 3858 */
            context.commitUser = reposAccess.getAccessUser().getName();
            /* 3860 */
            int status = ((Integer) jsonObj.get("status")).intValue();
            /* 3861 */
            if (status == 2 || status == 3) {
                /* 3863 */
                String downloadUri = (String) jsonObj.get("url");
                /* 3865 */
                String chunkParentPath = Path.getReposTmpPathForUpload(repos, reposAccess.getAccessUser());
                /* 3866 */
                String chunkName = String.valueOf(doc.getName()) + "_0";
                /* 3867 */
                if (downloadFileFromUrl(downloadUri, chunkParentPath, chunkName) == null) {
                    /* 3869 */
                    docSysErrorLog("下载文件失败 downloadUri=" + downloadUri, rt);
                    /* 3871 */
                    writer.write("{\"error\":1}");

                    return;

                }
                /* 3875 */
                Long chunkSize = Long.valueOf((new File(String.valueOf(chunkParentPath) + chunkName)).length());
                /* 3876 */
                Log.debug("saveDoc() chunkSize:" + chunkSize);
                /* 3877 */
                doc.setSize(chunkSize);
                /* 3879 */
                String commitMsg = "协同编辑保存:" + doc.getPath() + doc.getName();
                /* 3880 */
                String commitUser = reposAccess.getAccessUser().getName();
                /* 3881 */
                context.commitMsg = commitMsg;
                /* 3882 */
                context.commitUser = commitUser;
                /* 3884 */
                int ret = 0;
                /* 3885 */
                if (localDoc == null || localDoc.getType().intValue() == 0) {
                    /* 3887 */
                    ret = addDoc(repos, doc,
                            /* 3888 */               null,
                            /* 3889 */               Integer.valueOf(1), chunkSize, chunkParentPath, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
                    /* 3891 */
                    switch (ret) {

                        case 0:
                            /* 3894 */
                            writer.write("{\"error\":-1}");
                            /* 3895 */
                            addSystemLog(context, reposAccess.getAccessUser(), "失败", buildSystemLogDetailContent(rt));

                            return;

                        case 1:
                            /* 3898 */
                            writer.write("{\"error\":0}");
                            /* 3899 */
                            deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                            /* 3900 */
                            addSystemLog(context, reposAccess.getAccessUser(), "成功", buildSystemLogDetailContent(rt));

                            return;

                    }
                    /* 3903 */
                    writer.write("{\"error\":0}");
                    /* 3904 */
                    deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);

                } else {
                    /* 3910 */
                    ret = updateDoc(repos, doc,
                            /* 3911 */               null,
                            /* 3912 */               Integer.valueOf(1), chunkSize, chunkParentPath, commitMsg, commitUser, reposAccess.getAccessUser(), rt, context);
                    /* 3914 */
                    switch (ret) {

                        case 0:
                            /* 3917 */
                            writer.write("{\"error\":-1}");
                            /* 3918 */
                            addSystemLog(context, reposAccess.getAccessUser(), "失败", buildSystemLogDetailContent(rt));

                            return;

                        case 1:
                            /* 3921 */
                            writer.write("{\"error\":0}");
                            /* 3922 */
                            deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                            /* 3923 */
                            deletePreviewFile(doc);
                            /* 3924 */
                            addSystemLog(context, reposAccess.getAccessUser(), "成功", buildSystemLogDetailContent(rt));

                            return;

                    }
                    /* 3927 */
                    writer.write("{\"error\":0}");
                    /* 3928 */
                    deleteChunks(doc.getName(), Integer.valueOf(1), Integer.valueOf(1), chunkParentPath);
                    /* 3929 */
                    deletePreviewFile(doc);

                }

                return;

            }
            /* 3938 */
            Log.debug("这是打开文件的调用，返回error:0表示可以编辑");
            /* 3939 */
            writer.write("{\"error\":0}");
            /* 3941 */
        } catch (Exception e) {
            /* 3942 */
            Log.debug("saveDoc saveFile Failed");
            /* 3943 */
            writer.write("{\"error\":-1}");
            /* 3944 */
            errorLog(e);

        }

    }


    private String downloadFileFromUrl(String downloadUri, String localFilePath, String fileName) {

        try {
            /* 3951 */
            URL url = new URL(downloadUri);
            /* 3953 */
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            /* 3954 */
            InputStream stream = connection.getInputStream();
            /* 3956 */
            File savedFile = new File(String.valueOf(localFilePath) + fileName);
            /* 3957 */
            Exception exception1 = null, exception2 = null;

            try {
                /* 3957 */
                FileOutputStream out = new FileOutputStream(savedFile);

                try {
                    /* 3959 */
                    byte[] bytes = new byte[1024];

                    int read;
                    /* 3960 */
                    while ((read = stream.read(bytes)) != -1)
                        /* 3961 */ out.write(bytes, 0, read);
                    /* 3964 */
                    out.flush();

                } finally {
                    /* 3965 */
                    if (out != null)
                        /* 3965 */ out.close();

                }

            } finally {
                /* 3965 */
                exception2 = null;
                /* 3965 */
                if (exception1 == null) {
                    /* 3965 */
                    exception1 = exception2;
                    /* 3965 */
                } else if (exception1 != exception2) {
                    /* 3965 */
                    exception1.addSuppressed(exception2);

                }

            }
            /* 3968 */
        } catch (Exception e) {
            /* 3969 */
            errorLog(e);
            /* 3971 */
            return null;

        }
        return null;

    }


    @RequestMapping({"/getZipDocOfficeLink.do"})
    public void getZipDocOfficeLink(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String rootPath, String rootName, String preview, Integer shareId, String urlStyle, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 3982 */
        Log.infoHead("************** getZipDocOfficeLink [" + path + name + "]****************");
        /* 3983 */
        Log.info("getZipDocOfficeLink reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name + " level:" + level + " type:" + type + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);
        /* 3985 */
        if (path == null)
            /* 3987 */ path = "";
        /* 3990 */
        ReturnAjax rt = new ReturnAjax();
        /* 3991 */
        if (officeDisabled == 1) {
            /* 3993 */
            rt.setError("Office在线编辑功能已禁用");
            /* 3994 */
            writeJson(rt, response);

            return;

        }
        /* 3998 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, true, rt);
        /* 3999 */
        if (reposAccess == null) {
            /* 4001 */
            writeJson(rt, response);
            /* 4002 */
            b.d();

            return;

        }
        /* 4006 */
        Repos repos = getReposEx(reposId);
        /* 4007 */
        if (repos == null) {
            /* 4009 */
            docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
            /* 4010 */
            writeJson(rt, response);
            /* 4011 */
            b.d();

            return;

        }
        /* 4015 */
        String reposPath = Path.getReposPath(repos);
        /* 4016 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 4017 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 4019 */
        Doc rootDoc = buildBasicDoc(reposId, docId, pid, reposPath, rootPath, rootName, level, type, true, localRootPath, localVRootPath, null, null);
        /* 4020 */
        Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
        /* 4023 */
        if (!checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), rootDoc, null, rt)) {
            /* 4025 */
            Log.debug("getZipDocOfficeLink() you have no access right on doc:" + rootDoc.getName());
            /* 4026 */
            writeJson(rt, response);
            /* 4027 */
            b.d();

            return;

        }
        /* 4031 */
        String tmpLocalRootPath = Path.getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
        /* 4032 */
        Doc tmpDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, Integer.valueOf(1), true, tmpLocalRootPath, null, null, null);
        /* 4034 */
        checkAndExtractEntryFromCompressDoc(repos, tempRootDoc, tmpDoc);
        /* 4035 */
        if (!FileUtil.isFileExist(String.valueOf(tmpDoc.getLocalRootPath()) + tmpDoc.getPath() + tmpDoc.getName())) {
            /* 4037 */
            docSysErrorLog("[" + tmpDoc.getPath() + tmpDoc.getName() + "] 解压失败", rt);
            /* 4038 */
            writeJson(rt, response);
            /* 4039 */
            b.d();

            return;

        }
        /* 4043 */
        if (preview == null || preview.equals("office")) {
            /* 4045 */
            if (!isOfficeEditorApiConfiged(request)) {
                /* 4047 */
                Log.debug("getZipDocOfficeLink() check isOfficeEditorApiConfiged Failed");
                /* 4048 */
                rt.setDataEx("unknown");
                /* 4049 */
                writeJson(rt, response);

                return;

            }
            /* 4053 */
            JSONObject jobj = new JSONObject();
            /* 4054 */
            String authCode = getAuthCodeForOfficeEditor(tmpDoc, reposAccess);
            /* 4055 */
            String fileLink = buildDownloadDocLink(tmpDoc, authCode, urlStyle, Integer.valueOf(0), rt);
            /* 4056 */
            String saveFileLink = buildSaveDocLink(tmpDoc, authCode, urlStyle, rt);
            /* 4057 */
            jobj.put("fileLink", fileLink);
            /* 4058 */
            jobj.put("saveFileLink", saveFileLink);
            /* 4059 */
            jobj.put("userId", reposAccess.getAccessUser().getId());
            /* 4060 */
            jobj.put("userName", reposAccess.getAccessUser().getName());
            /* 4063 */
            DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), rootDoc, reposAccess.getAuthMask());
            /* 4064 */
            if (docUserAuth.getDownloadEn() != null && docUserAuth.getDownloadEn().intValue() == 1) {
                /* 4066 */
                jobj.put("downloadEn", Integer.valueOf(1));

            } else {
                /* 4070 */
                jobj.put("downloadEn", Integer.valueOf(0));

            }
            /* 4073 */
            Doc localDoc = docSysGetDoc(repos, tmpDoc, false);
            /* 4074 */
            tmpDoc.setSize(localDoc.getSize());
            /* 4075 */
            tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
            /* 4078 */
            jobj.put("key", buildOfficeEditorKey(tmpDoc));
            /* 4079 */
            jobj.put("editEn", Integer.valueOf(0));
            /* 4081 */
            rt.setData(jobj);
            /* 4082 */
            rt.setDataEx("office");
            /* 4083 */
            writeJson(rt, response);
            /* 4084 */
            b.d();

            return;

        }
        /* 4088 */
        String pdfLink = convertOfficeToPdfEx(repos, tmpDoc, reposAccess, rt);
        /* 4089 */
        if (pdfLink == null) {
            /* 4091 */
            Log.debug("getZipDocOfficeLink() convertOfficeToPdf failed");
            /* 4092 */
            writeJson(rt, response);
            /* 4093 */
            b.d();

            return;

        }
        /* 4096 */
        rt.setData(pdfLink);
        /* 4097 */
        rt.setDataEx("pdf");
        /* 4098 */
        writeJson(rt, response);
        /* 4099 */
        b.d();

    }


    @RequestMapping({"/getZipDocCadLink.do"})
    public void getZipDocCadLink(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String rootPath, String rootName, Integer shareId, String urlStyle, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 4109 */
        Log.infoHead("************** getZipDocCadLink [" + path + name + "] ****************");
        /* 4110 */
        Log.info("getZipDocCadLink reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name + " level:" + level + " type:" + type + " rootPath:" + rootPath + " rootName:" + rootName + " shareId:" + shareId);
        /* 4112 */
        if (path == null)
            /* 4114 */ path = "";
        /* 4117 */
        ReturnAjax rt = new ReturnAjax();
        /* 4118 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, rootPath, rootName, true, rt);
        /* 4119 */
        if (reposAccess == null) {
            /* 4121 */
            writeJson(rt, response);
            /* 4122 */
            b.d();

            return;

        }
        /* 4126 */
        Repos repos = getReposEx(reposId);
        /* 4127 */
        if (repos == null) {
            /* 4129 */
            docSysErrorLog("仓库 " + reposId + " 不存在！", rt);
            /* 4130 */
            writeJson(rt, response);
            /* 4131 */
            b.d();

            return;

        }
        /* 4135 */
        String reposPath = Path.getReposPath(repos);
        /* 4136 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 4137 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 4139 */
        Doc rootDoc = buildBasicDoc(reposId, docId, pid, reposPath, rootPath, rootName, level, type, true, localRootPath, localVRootPath, null, null);
        /* 4140 */
        Doc tempRootDoc = decryptRootZipDoc(repos, rootDoc);
        /* 4143 */
        if (!checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), rootDoc, null, rt)) {
            /* 4145 */
            Log.debug("getZipDocCadLink() you have no access right on doc:" + rootDoc.getName());
            /* 4146 */
            writeJson(rt, response);
            /* 4147 */
            b.d();

            return;

        }
        /* 4151 */
        String tmpLocalRootPath = Path.getReposTmpPathForUnzip(repos, reposAccess.getAccessUser());
        /* 4152 */
        Doc tmpDoc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, Integer.valueOf(1), true, tmpLocalRootPath, null, null, null);
        /* 4154 */
        checkAndExtractEntryFromCompressDoc(repos, tempRootDoc, tmpDoc);
        /* 4156 */
        String pdfLink = convertCadToPdf(repos, tmpDoc, reposAccess, rt);
        /* 4157 */
        if (pdfLink == null) {
            /* 4159 */
            Log.debug("getZipDocCadLink() convertOfficeToPdf failed");
            /* 4160 */
            writeJson(rt, response);
            /* 4161 */
            b.d();

            return;

        }
        /* 4164 */
        rt.setData(pdfLink);
        /* 4165 */
        rt.setDataEx("pdf");
        /* 4166 */
        writeJson(rt, response);
        /* 4167 */
        b.d();

    }


    protected String convertOfficeToPdfEx(Repos repos, Doc doc, ReposAccess reposAccess, ReturnAjax rt) {
        /* 4171 */
        return DocToPDFEx_FSM(repos, doc, reposAccess, rt);

    }


    public String DocToPDFEx_FSM(Repos repos, Doc doc, ReposAccess reposAccess, ReturnAjax rt) {
        /* 4176 */
        String fileSuffix = FileUtil.getFileSuffix(doc.getName());
        /* 4177 */
        if (fileSuffix == null) {
            /* 4179 */
            docSysErrorLog("未知文件类型", rt);
            /* 4180 */
            return null;

        }
        /* 4183 */
        Doc localEntry = fsGetDoc(repos, doc);
        /* 4184 */
        if (localEntry == null) {
            /* 4186 */
            docSysErrorLog("文件不存在！", rt);
            /* 4187 */
            return null;

        }
        /* 4190 */
        if (localEntry.getType().intValue() == 2) {
            /* 4192 */
            docSysErrorLog("目录无法预览", rt);
            /* 4193 */
            return null;

        }
        /* 4196 */
        if (FileUtil.isPdf(fileSuffix)) {
            /* 4199 */
            String authCode = addDocDownloadAuthCode(reposAccess, null);
            /* 4200 */
            String str1 = buildDownloadDocLink(doc, authCode, "REST", Integer.valueOf(1), rt);
            /* 4201 */
            if (str1 == null) {
                /* 4203 */
                docSysErrorLog("buildDocFileLink failed", rt);
                /* 4204 */
                return null;

            }
            /* 4206 */
            return str1;

        }
        /* 4210 */
        String preivewTmpPath = Path.getReposTmpPathForPreview(repos, doc);
        /* 4211 */
        String previewFileName = Path.getPreviewFileName(doc);
        /* 4212 */
        String dstPath = String.valueOf(preivewTmpPath) + previewFileName;
        /* 4213 */
        Log.debug("DocToPDF_FSM() dstPath:" + dstPath);
        /* 4214 */
        File file = new File(dstPath);
        /* 4215 */
        if (!file.exists()) {
            /* 4217 */
            FileUtil.clearDir(preivewTmpPath);
            /* 4219 */
            String localEntryPath = String.valueOf(Path.getReposRealPath(repos)) + doc.getPath() + doc.getName();
            /* 4220 */
            if (FileUtil.isOffice(fileSuffix) || FileUtil.isText(fileSuffix) || FileUtil.isPicture(fileSuffix)) {
                /* 4223 */
                if (!b.a(buildOfficeEditorKey(doc), doc, localEntryPath, preivewTmpPath, previewFileName, rt)) {
                    /* 4225 */
                    docSysErrorLog("预览文件生成失败", rt);
                    /* 4226 */
                    return null;

                }

            } else {
                /* 4231 */
                docSysErrorLog("该文件类型不支持预览", rt);
                /* 4232 */
                docSysDebugLog("srcPath:" + localEntryPath, rt);
                /* 4233 */
                return null;

            }

        }
        /* 4237 */
        Doc previewDoc = buildBasicDoc(repos.getId(), null, null, doc.getReposPath(), "", previewFileName, null, Integer.valueOf(1), true, preivewTmpPath, null, null, null);
        /* 4238 */
        previewDoc.setShareId(doc.getShareId());
        /* 4239 */
        String fileLink = buildDownloadDocLink(previewDoc, null, "REST", Integer.valueOf(0), rt);
        /* 4240 */
        if (fileLink == null) {
            /* 4242 */
            docSysErrorLog("buildDocFileLink failed", rt);
            /* 4243 */
            return null;

        }
        /* 4245 */
        return fileLink;

    }


    public String convertCadToPdf(Repos repos, Doc doc, ReposAccess reposAccess, ReturnAjax rt) {
        /* 4250 */
        String fileSuffix = FileUtil.getFileSuffix(doc.getName());
        /* 4251 */
        if (fileSuffix == null) {
            /* 4253 */
            docSysErrorLog("未知文件类型", rt);
            /* 4254 */
            return null;

        }
        /* 4257 */
        Doc localEntry = fsGetDoc(repos, doc);
        /* 4258 */
        if (localEntry == null) {
            /* 4260 */
            docSysErrorLog("文件不存在！", rt);
            /* 4261 */
            return null;

        }
        /* 4264 */
        if (localEntry.getType().intValue() == 2) {
            /* 4266 */
            docSysErrorLog("目录无法预览", rt);
            /* 4267 */
            return null;

        }
        /* 4270 */
        if (FileUtil.isPdf(fileSuffix)) {
            /* 4273 */
            String authCode = addDocDownloadAuthCode(reposAccess, null);
            /* 4274 */
            String str1 = buildDownloadDocLink(doc, authCode, "REST", Integer.valueOf(1), rt);
            /* 4275 */
            if (str1 == null) {
                /* 4277 */
                docSysErrorLog("convertCadToPdf failed", rt);
                /* 4278 */
                return null;

            }
            /* 4280 */
            return str1;

        }
        /* 4283 */
        String preivewTmpPath = Path.getReposTmpPathForPreview(repos, doc);
        /* 4284 */
        String previewFileName = Path.getPreviewFileName(doc);
        /* 4285 */
        String dstPath = String.valueOf(preivewTmpPath) + previewFileName;
        /* 4286 */
        Log.debug("convertCadToPdf() dstPath:" + dstPath);
        /* 4287 */
        File file = new File(dstPath);
        /* 4288 */
        if (!file.exists()) {
            /* 4290 */
            FileUtil.clearDir(preivewTmpPath);
            /* 4292 */
            String localEntryPath = String.valueOf(Path.getReposRealPath(repos)) + doc.getPath() + doc.getName();
            /* 4293 */
            if (FileUtil.isCad(fileSuffix)) {
                /* 4296 */
                if (!CADFileUtil.CADFileToPDF(localEntryPath, dstPath)) {
                    /* 4298 */
                    docSysErrorLog("预览文件生成失败", rt);
                    /* 4299 */
                    return null;

                }

            } else {
                /* 4304 */
                docSysErrorLog("该文件类型不支持预览", rt);
                /* 4305 */
                docSysDebugLog("srcPath:" + localEntryPath, rt);
                /* 4306 */
                return null;

            }

        }
        /* 4310 */
        Doc previewDoc = buildBasicDoc(repos.getId(), null, null, doc.getReposPath(), "", previewFileName, null, Integer.valueOf(1), true, preivewTmpPath, null, null, null);
        /* 4311 */
        previewDoc.setShareId(doc.getShareId());
        /* 4312 */
        String fileLink = buildDownloadDocLink(previewDoc, null, "REST", Integer.valueOf(0), rt);
        /* 4313 */
        if (fileLink == null) {
            /* 4315 */
            docSysErrorLog("convertCadToPdf failed", rt);
            /* 4316 */
            return null;

        }
        /* 4318 */
        return fileLink;

    }


    @RequestMapping({"/getDocOfficeLink.do"})
    public void getDocOfficeLink(Integer reposId, String path, String name, String commitId, Integer historyType, String preview, Integer shareId, String urlStyle, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 4330 */
        Log.infoHead("*********** getDocOfficeLink.do [" + path + name + "] *******************");
        /* 4331 */
        Log.info("getDocOfficeLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId + " urlStyle:" + urlStyle);
        /* 4335 */
        if (path == null)
            /* 4337 */ path = "";
        /* 4339 */
        if (name == null)
            /* 4341 */ name = "";
        /* 4344 */
        ReturnAjax rt = new ReturnAjax();
        /* 4345 */
        if (officeDisabled == 1) {
            /* 4347 */
            rt.setError("Office在线编辑功能已禁用");
            /* 4348 */
            writeJson(rt, response);

            return;

        }
        /* 4352 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
        /* 4353 */
        if (reposAccess == null) {
            /* 4355 */
            writeJson(rt, response);
            /* 4356 */
            b.d();

            return;

        }
        /* 4360 */
        Repos repos = getReposEx(reposId);
        /* 4361 */
        if (!reposCheck(repos, rt, response)) {
            /* 4363 */
            b.d();

            return;

        }
        /* 4367 */
        String reposPath = Path.getReposPath(repos);
        /* 4368 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 4369 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 4370 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
        /* 4371 */
        doc.setShareId(shareId);
        /* 4373 */
        path = doc.getPath();
        /* 4374 */
        name = doc.getName();
        /* 4377 */
        if (!checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt)) {
            /* 4379 */
            Log.debug("getDocOfficeLink() you have no access right on doc:" + doc.getName());
            /* 4380 */
            writeJson(rt, response);
            /* 4381 */
            b.d();

            return;

        }
        /* 4385 */
        Doc tmpDoc = doc;
        /* 4386 */
        if (commitId == null) {
            /* 4389 */
            if (!isFSM(repos))
                /* 4392 */ channel.remoteServerCheckOut(repos, doc, null, null, null, null, 30, null);

        } else {
            /* 4397 */
            if (historyType == null)
                /* 4399 */ historyType = Integer.valueOf(0);
            /* 4402 */
            Doc remoteDoc = null;
            /* 4403 */
            if (isFSM(repos)) {
                /* 4405 */
                remoteDoc = verReposGetDocEx(repos, doc, commitId, historyType.intValue());

            } else {
                /* 4409 */
                remoteDoc = remoteServerGetDoc(repos, doc, commitId);

            }
            /* 4412 */
            if (remoteDoc == null) {
                /* 4414 */
                docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
                /* 4415 */
                writeJson(rt, response);

                return;

            }
            /* 4419 */
            if (remoteDoc.getType() != null && remoteDoc.getType().intValue() == 2) {
                /* 4421 */
                docSysErrorLog(String.valueOf(name) + " 是目录！", rt);
                /* 4422 */
                writeJson(rt, response);

                return;

            }
            /* 4427 */
            String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, true);
            /* 4428 */
            File dir = new File(String.valueOf(tempLocalRootPath) + path);
            /* 4429 */
            if (!dir.exists())
                /* 4431 */ dir.mkdirs();
            /* 4433 */
            File file = new File(String.valueOf(tempLocalRootPath) + path + name);
            /* 4434 */
            if (!file.exists())
                /* 4436 */ if (isFSM(repos)) {
                /* 4438 */
                verReposCheckOutEx(repos, doc, tempLocalRootPath, null, null, commitId, null, Integer.valueOf(1), true, historyType.intValue());

            } else {
                /* 4442 */
                channel.remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);

            }
            /* 4446 */
            tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), Integer.valueOf(1), true, tempLocalRootPath, localVRootPath, null, null);
            /* 4447 */
            tmpDoc.setShareId(shareId);

        }
        /* 4450 */
        if (preview == null || preview.equals("office")) {
            /* 4452 */
            if (!isOfficeEditorApiConfiged(request)) {
                /* 4454 */
                Log.debug("getDocOfficeLink() check isOfficeEditorApiConfiged Failed");
                /* 4455 */
                rt.setDataEx("unknown");
                /* 4456 */
                writeJson(rt, response);

                return;

            }
            /* 4460 */
            JSONObject jobj = new JSONObject();
            /* 4461 */
            String authCode = getAuthCodeForOfficeEditor(tmpDoc, reposAccess);
            /* 4462 */
            String fileLink = buildDownloadDocLink(tmpDoc, authCode, urlStyle, Integer.valueOf(1), rt);
            /* 4463 */
            String saveFileLink = buildSaveDocLink(tmpDoc, authCode, "REST", rt);
            /* 4464 */
            jobj.put("fileLink", fileLink);
            /* 4465 */
            jobj.put("saveFileLink", saveFileLink);
            /* 4466 */
            jobj.put("userId", reposAccess.getAccessUser().getId());
            /* 4467 */
            String userName = reposAccess.getAccessUser().getName();
            /* 4468 */
            String realName = reposAccess.getAccessUser().getRealName();
            /* 4469 */
            String nickName = reposAccess.getAccessUser().getNickName();
            /* 4470 */
            jobj.put("userName", userName);
            /* 4471 */
            jobj.put("realName", (realName == null) ? userName : realName);
            /* 4472 */
            jobj.put("nickName", (nickName == null) ? userName : nickName);
            /* 4475 */
            DocAuth docUserAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask());
            /* 4476 */
            if (docUserAuth.getDownloadEn() != null && docUserAuth.getDownloadEn().intValue() == 1) {
                /* 4478 */
                jobj.put("downloadEn", Integer.valueOf(1));

            } else {
                /* 4482 */
                jobj.put("downloadEn", Integer.valueOf(0));

            }
            /* 4486 */
            if (commitId == null) {
                /* 4488 */
                Doc localDoc = fsGetDoc(repos, doc);
                /* 4489 */
                if (localDoc == null || localDoc.getType() == null || localDoc.getType().intValue() == 0) {
                    /* 4491 */
                    docSysErrorLog(String.valueOf(name) + " 不存在！", rt);
                    /* 4492 */
                    writeJson(rt, response);

                    return;

                }
                /* 4496 */
                tmpDoc.setSize(localDoc.getSize());
                /* 4497 */
                tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
                /* 4500 */
                if (docUserAuth.getEditEn() != null && docUserAuth.getEditEn().intValue() == 1) {
                    /* 4502 */
                    jobj.put("key", buildOfficeEditorKey(tmpDoc));
                    /* 4503 */
                    jobj.put("editEn", Integer.valueOf(1));

                } else {
                    /* 4507 */
                    jobj.put("key", String.valueOf(buildOfficeEditorKey(tmpDoc)) + "_" + reposAccess.getAccessUser().getId());
                    /* 4508 */
                    jobj.put("editEn", Integer.valueOf(0));

                }

            } else {
                /* 4513 */
                Doc localDoc = fsGetDoc(repos, tmpDoc);
                /* 4514 */
                if (localDoc == null || localDoc.getType() == null || localDoc.getType().intValue() == 0) {
                    /* 4516 */
                    docSysErrorLog(String.valueOf(name) + " 不存在！", rt);
                    /* 4517 */
                    writeJson(rt, response);

                    return;

                }
                /* 4521 */
                tmpDoc.setSize(localDoc.getSize());
                /* 4522 */
                tmpDoc.setLatestEditTime(localDoc.getLatestEditTime());
                /* 4523 */
                jobj.put("key", buildOfficeEditorKey(tmpDoc));
                /* 4524 */
                jobj.put("editEn", Integer.valueOf(0));

            }
            /* 4527 */
            rt.setData(jobj);
            /* 4528 */
            rt.setDataEx("office");
            /* 4529 */
            writeJson(rt, response);
            /* 4530 */
            b.d();

            return;

        }
        /* 4534 */
        if (!systemLicenseInfoCheck(rt) && checkLicense) {
            /* 4536 */
            writeJson(rt, response);

            return;

        }
        /* 4540 */
        String pdfLink = convertOfficeToPdfEx(repos, tmpDoc, reposAccess, rt);
        /* 4541 */
        if (pdfLink == null) {
            /* 4543 */
            Log.debug("getDocOfficeLink() convertOfficeToPdfEx failed");
            /* 4544 */
            writeJson(rt, response);

            return;

        }
        /* 4547 */
        rt.setData(pdfLink);
        /* 4548 */
        rt.setDataEx("pdf");
        /* 4549 */
        writeJson(rt, response);
        /* 4550 */
        b.d();

    }


    @RequestMapping({"/getDocCadLink.do"})
    public void getDocCadLink(Integer reposId, String path, String name, String commitId, Integer historyType, Integer shareId, String urlStyle, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 4562 */
        Log.infoHead("*********** getDocCadLink.do *******************");
        /* 4564 */
        Log.info("getDocCadLink reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId + " commitId:" + commitId + " urlStyle:" + urlStyle);
        /* 4568 */
        if (path == null)
            /* 4570 */ path = "";
        /* 4572 */
        if (name == null)
            /* 4574 */ name = "";
        /* 4577 */
        ReturnAjax rt = new ReturnAjax();
        /* 4578 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
        /* 4579 */
        if (reposAccess == null) {
            /* 4581 */
            writeJson(rt, response);
            /* 4582 */
            b.d();

            return;

        }
        /* 4586 */
        Repos repos = getReposEx(reposId);
        /* 4587 */
        if (!reposCheck(repos, rt, response)) {
            /* 4589 */
            b.d();

            return;

        }
        /* 4593 */
        String reposPath = Path.getReposPath(repos);
        /* 4594 */
        String localRootPath = Path.getReposRealPath(repos);
        /* 4595 */
        String localVRootPath = Path.getReposVirtualPath(repos);
        /* 4596 */
        Doc doc = buildBasicDoc(reposId, null, null, reposPath, path, name, null, null, true, localRootPath, localVRootPath, null, null);
        /* 4597 */
        doc.setShareId(shareId);
        /* 4599 */
        path = doc.getPath();
        /* 4600 */
        name = doc.getName();
        /* 4603 */
        if (!checkUseAccessRight(repos, reposAccess.getAccessUser().getId(), doc, reposAccess.getAuthMask(), rt)) {
            /* 4605 */
            Log.debug("getDocCadLink() you have no access right on doc:" + doc.getName());
            /* 4606 */
            writeJson(rt, response);
            /* 4607 */
            b.d();

            return;

        }
        /* 4611 */
        Doc tmpDoc = doc;
        /* 4612 */
        if (commitId == null) {
            /* 4615 */
            if (!isFSM(repos))
                /* 4618 */ channel.remoteServerCheckOut(repos, doc, null, null, null, null, 30, null);

        } else {
            /* 4623 */
            if (historyType == null)
                /* 4625 */ historyType = Integer.valueOf(0);
            /* 4628 */
            Doc remoteDoc = null;
            /* 4629 */
            if (isFSM(repos)) {
                /* 4631 */
                remoteDoc = verReposGetDocEx(repos, doc, commitId, historyType.intValue());

            } else {
                /* 4635 */
                remoteDoc = remoteServerGetDoc(repos, doc, commitId);

            }
            /* 4638 */
            if (remoteDoc == null) {
                /* 4640 */
                docSysErrorLog("获取历史文件信息 " + name + " 失败！", rt);
                /* 4641 */
                writeJson(rt, response);

                return;

            }
            /* 4645 */
            if (remoteDoc.getType() != null && remoteDoc.getType().intValue() == 2) {
                /* 4647 */
                docSysErrorLog(String.valueOf(name) + " 是目录！", rt);
                /* 4648 */
                writeJson(rt, response);

                return;

            }
            /* 4653 */
            String tempLocalRootPath = Path.getReposTmpPathForHistory(repos, commitId, true);
            /* 4654 */
            File dir = new File(String.valueOf(tempLocalRootPath) + path);
            /* 4655 */
            if (!dir.exists())
                /* 4657 */ dir.mkdirs();
            /* 4659 */
            File file = new File(String.valueOf(tempLocalRootPath) + path + name);
            /* 4660 */
            if (!file.exists())
                /* 4662 */ if (isFSM(repos)) {
                /* 4664 */
                verReposCheckOutEx(repos, doc, tempLocalRootPath, null, null, commitId, null, Integer.valueOf(1), true, historyType.intValue());

            } else {
                /* 4668 */
                channel.remoteServerCheckOut(repos, doc, tempLocalRootPath, null, null, commitId, 3, null);

            }
            /* 4672 */
            tmpDoc = buildBasicDoc(reposId, doc.getDocId(), doc.getPid(), reposPath, path, name, doc.getLevel(), Integer.valueOf(1), true, tempLocalRootPath, localVRootPath, null, null);
            /* 4673 */
            tmpDoc.setShareId(shareId);

        }
        /* 4676 */
        if (!systemLicenseInfoCheck(rt) && checkLicense) {
            /* 4678 */
            writeJson(rt, response);

            return;

        }
        /* 4682 */
        String pdfLink = convertCadToPdf(repos, tmpDoc, reposAccess, rt);
        /* 4683 */
        if (pdfLink == null) {
            /* 4685 */
            Log.debug("getDocCadLink() convertCadToPdf failed");
            /* 4686 */
            writeJson(rt, response);

            return;

        }
        /* 4689 */
        rt.setData(pdfLink);
        /* 4690 */
        rt.setDataEx("pdf");
        /* 4691 */
        writeJson(rt, response);
        /* 4692 */
        b.d();

    }


    @RequestMapping({"/installSystemLicense.do"})
    public void installSystemLicense(MultipartFile uploadFile, String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response) throws Exception {
        /* 4699 */
        Log.infoHead("*********** BussinessController installSystemLicense *******************");
        /* 4700 */
        ReturnAjax rt = new ReturnAjax();
        /* 4702 */
        User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
        /* 4703 */
        if (accessUser == null) {
            /* 4705 */
            writeJson(rt, response);

            return;

        }
        /* 4710 */
        if (uploadFile == null) {
            /* 4712 */
            Log.debug("installSystemLicense() uploadFile is null");
            /* 4713 */
            docSysErrorLog("证书文件为空", rt);
            /* 4714 */
            writeJson(rt, response);

            return;

        }
        /* 4717 */
        String fileName = uploadFile.getOriginalFilename();
        /* 4719 */
        String licensePath = getLicensePath();
        /* 4720 */
        String licenseUploadPath = String.valueOf(licensePath) + "upload/";
        /* 4721 */
        File dir = new File(licenseUploadPath);
        /* 4722 */
        if (!dir.exists())
            /* 4724 */ dir.mkdirs();
        /* 4726 */
        FileUtil.saveFile(uploadFile, licenseUploadPath, fileName);
        /* 4728 */
        License licenseInfo = b.a(licenseUploadPath, fileName, true, rt);
        /* 4729 */
        if (licenseInfo == null) {
            /* 4731 */
            Log.debug("installSystemLicense() verifySystemLicenseFile Failed");
            /* 4732 */
            writeJson(rt, response);

            return;

        }
        /* 4736 */
        if (licenseInfo.state == null) {
            /* 4739 */
            Integer state = b.a(licenseInfo, rt);
            /* 4740 */
            licenseInfo.state = state;
            /* 4742 */
            if (state != null && state.intValue() == 0) {
                /* 4744 */
                Log.debug("installSystemLicense() onlineCheckSystemLicenseInfo Failed");
                /* 4746 */
                writeJson(rt, response);

                return;

            }

        }
        if (!b.a(licensePath, "docsys.lic")) {
            rt.setError("证书备份失败");
            writeJson(rt, response);
            return;

        }
        if (!FileUtil.copyFile(String.valueOf(licenseUploadPath) + fileName, String.valueOf(licensePath) + "docsys.lic", true)) {
            rt.setError("证书安装失败！");
            writeJson(rt, response);
            return;
        }
        b.a(licenseInfo);
        rt.setData(systemLicenseInfo);
        writeJson(rt, response);
    }


    @RequestMapping({"/deleteSystemLicense.do"})
    public void deleteSystemLicense(String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response) throws Exception {
        /* 4777 */
        Log.infoHead("*********** BussinessController deleteSystemLicense *******************");
        /* 4778 */
        ReturnAjax rt = new ReturnAjax();
        /* 4780 */
        User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
        /* 4781 */
        if (accessUser == null) {
            /* 4783 */
            writeJson(rt, response);

            return;

        }
        /* 4787 */
        String licensePath = getLicensePath();
        /* 4788 */
        if (!b.a(licensePath, "docsys.lic")) {
            /* 4790 */
            rt.setError("证书备份失败");
            /* 4791 */
            writeJson(rt, response);

            return;

        }
        /* 4795 */
        if (!FileUtil.delFile(String.valueOf(licensePath) + "docsys.lic")) {
            /* 4797 */
            rt.setError("证书删除失败！");
            /* 4798 */
            writeJson(rt, response);

            return;

        }
        /* 4803 */
        b.c();
        /* 4805 */
        rt.setData(systemLicenseInfo);
        /* 4806 */
        writeJson(rt, response);

    }


    @RequestMapping({"/exportUserList.do"})
    public void exportUserList(String searchWord, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 4812 */
        Log.infoHead("****************** exportUserList.do ***********************");
        /* 4814 */
        Log.debug("getUserList() searchWord:" + searchWord);
        /* 4815 */
        ReturnAjax rt = new ReturnAjax();
        /* 4816 */
        User accessUser = adminAccessCheck(null, null, session, rt);
        /* 4817 */
        if (accessUser == null) {
            /* 4819 */
            writeJson(rt, response);

            return;

        }
        /* 4823 */
        User user = null;
        /* 4824 */
        if (searchWord != null && !searchWord.isEmpty()) {
            /* 4826 */
            user = new User();
            /* 4827 */
            user.setName(searchWord);
            /* 4828 */
            user.setRealName(searchWord);
            /* 4829 */
            user.setNickName(searchWord);
            /* 4830 */
            user.setEmail(searchWord);
            /* 4831 */
            user.setTel(searchWord);

        }
        /* 4834 */
        List<User> UserList = getUserList(user);
        /* 4837 */
        String filePath = String.valueOf(docSysIniPath) + "backup/";
        /* 4838 */
        String fileName = "userList.csv";
        /* 4839 */
        if (!exportUserListToCsvFile(UserList, filePath, fileName)) {
            /* 4841 */
            Log.debug("exportUserList() Failed to exportUserListToCsvFile " + filePath + fileName);
            /* 4842 */
            rt.setError("导出失败");
            /* 4843 */
            writeJson(rt, response);

            return;

        }
        /* 4847 */
        Doc downloadDoc = buildDownloadDocInfo(Integer.valueOf(0), "", "", filePath, fileName, Integer.valueOf(0));
        /* 4848 */
        String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path=" + downloadDoc.getPath() + "&name=" + downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName=" + downloadDoc.targetName;
        /* 4849 */
        rt.setData(downloadLink);
        /* 4850 */
        writeJson(rt, response);

    }


    private boolean exportUserListToCsvFile(List<User> list, String filePath, String fileName) {
        /* 4854 */
        if (list == null || list.size() == 0)
            /* 4856 */ return false;
        /* 4860 */
        StringBuffer sb = new StringBuffer();
        /* 4862 */
        User user = new User();
        /* 4863 */
        String titleStr = LuceneUtil2.buildCsvTitleStrForObject(user);
        /* 4864 */
        sb.append(String.valueOf(titleStr) + "\n");
        /* 4866 */
        for (int i = 0; i < list.size(); i++) {
            /* 4868 */
            User obj = list.get(i);
            /* 4869 */
            String objStr = LuceneUtil2.buildCsvStrForObject(obj);
            /* 4870 */
            sb.append(String.valueOf(objStr) + "\n");

        }
        /* 4873 */
        byte[] bom = {-17, -69, -65};
        /* 4874 */
        FileUtil.saveDataToFile(bom, filePath, fileName);
        /* 4875 */
        return FileUtil.appendContentToFile(String.valueOf(filePath) + fileName, sb.toString(), "UTF-8");

    }


    @RequestMapping({"/getSystemLogList.do"})
    public void getSystemLogList(String searchWord, Long startTime, Long endTime, Integer pageIndex, Integer pageSize, String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 4884 */
        Log.infoHead("*********** BussinessController getSystemLogList *******************");
        /* 4886 */
        Log.info("getSystemLogList() searchWord:" + searchWord + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
        /* 4888 */
        ReturnAjax rt = new ReturnAjax();
        /* 4889 */
        if (docSysType == 0 && checkLicense) {
            /* 4891 */
            rt.setError("开源版不支持日志管理，请购买商业版授权证书！");
            /* 4892 */
            writeJson(rt, response);

            return;

        }
        /* 4896 */
        User accessUser = adminAccessCheck(authCode, "docSysInit", session, rt);
        /* 4897 */
        if (accessUser == null) {
            /* 4899 */
            writeJson(rt, response);
            /* 4900 */
            b.d();

            return;

        }
        /* 4904 */
        if (!systemLicenseInfoCheck(rt) && checkLicense) {
            /* 4906 */
            writeJson(rt, response);

            return;

        }
        /* 4910 */
        SystemLog queryLog = null;
        /* 4911 */
        if (searchWord != null && !searchWord.isEmpty()) {
            /* 4913 */
            queryLog = new SystemLog();
            /* 4914 */
            queryLog.action = searchWord;
            /* 4915 */
            queryLog.event = searchWord;
            /* 4916 */
            queryLog.subEvent = searchWord;
            /* 4917 */
            queryLog.ip = searchWord;
            /* 4918 */
            queryLog.userName = searchWord;
            /* 4919 */
            queryLog.reposName = searchWord;
            /* 4920 */
            queryLog.name = searchWord;
            /* 4921 */
            queryLog.newName = searchWord;
            /* 4922 */
            queryLog.path = searchWord;
            /* 4923 */
            queryLog.newPath = searchWord;
            /* 4924 */
            queryLog.content = searchWord;

        }
        /* 4927 */
        QueryResult queryResult = new QueryResult();
        /* 4928 */
        List<SystemLog> list = b.a(queryLog, startTime, endTime, pageIndex, pageSize, queryResult);
        /* 4930 */
        Integer total = Integer.valueOf(queryResult.total);
        /* 4931 */
        Log.debug("getSystemLogList() total:" + total);
        /* 4933 */
        rt.setData(list);
        /* 4934 */
        rt.setDataEx(total);
        /* 4935 */
        rt.setStatus("ok");
        writeJson(rt, response);
        /* 4936 */
        b.d();

    }


    @RequestMapping({"/deleteSystemLog.do"})
    public void deleteSystemLog(String logId, Long time, String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 4944 */
        Log.infoHead("*********** BussinessController deleteLicense *******************");
        /* 4945 */
        Log.info("deleteSystemLog logId:" + logId + " time:" + time);
        /* 4947 */
        ReturnAjax rt = new ReturnAjax();
        /* 4948 */
        if (docSysType == 0 && checkLicense) {
            /* 4950 */
            rt.setError("开源版不支持日志管理，请购买商业版授权证书！");
            /* 4951 */
            writeJson(rt, response);

            return;

        }
        /* 4955 */
        User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
        /* 4956 */
        if (accessUser == null) {
            /* 4958 */
            writeJson(rt, response);

            return;

        }
        /* 4961 */
        if (logId == null || logId.isEmpty()) {
            /* 4963 */
            rt.setError("日志ID不能为空！");
            /* 4964 */
            writeJson(rt, response);

            return;

        }
        /* 4968 */
        if (!b.a(logId, time)) {
            /* 4970 */
            rt.setError("日志删除失败！");
            /* 4971 */
            writeJson(rt, response);

            return;

        }
        /* 4974 */
        writeJson(rt, response);

    }


    @RequestMapping({"/onlineInstallOffice.do"})
    public void onlineInstallOffice(HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 4981 */
        Log.infoHead("*********** BussinessController onlineInstallOffice *******************");
        /* 4983 */
        ReturnAjax rt = new ReturnAjax();
        /* 4985 */
        User accessUser = superAdminAccessCheck(null, "docSysInit", session, rt);
        /* 4986 */
        if (accessUser == null) {
            /* 4988 */
            writeJson(rt, response);

            return;

        }
        /* 4992 */
        File file = new File(String.valueOf(docSysWebPath) + "web/static/office-editor");
        /* 4993 */
        if (file.exists()) {
            /* 4995 */
            docSysErrorLog("Office已安装，请勿重复安装！", rt);
            /* 4996 */
            writeJson(rt, response);

            return;

        }
        /* 5000 */
        GITUtil gitUtil = new GITUtil();
        /* 5001 */
        gitUtil.isRemote = true;
        /* 5002 */
        gitUtil.repositoryURL = "https://gitee.com/RainyGao/office-editor.git";
        /* 5003 */
        gitUtil.user = "";
        /* 5004 */
        gitUtil.pwd = "";
        /* 5005 */
        gitUtil.wcDir = String.valueOf(docSysWebPath) + "web/static/office-editor/";
        /* 5006 */
        gitUtil.gitDir = String.valueOf(docSysWebPath) + "web/static/office-editor/.git/";
        /* 5007 */
        if (gitUtil.CloneRepos() == null) {
            /* 5009 */
            rt.setError("Office在线下载失败，请检查网络！");
            /* 5010 */
            writeJson(rt, response);

            return;

        }
        /* 5014 */
        b.g();
        /* 5015 */
        writeJson(rt, response);

    }


    @RequestMapping({"/exportOffice.do"})
    public void exportOffice(HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 5022 */
        Log.infoHead("************** exportOffice ****************");
        /* 5023 */
        ReturnAjax rt = new ReturnAjax();
        /* 5025 */
        User accessUser = superAdminAccessCheck(null, "docSysInit", session, rt);
        /* 5026 */
        if (accessUser == null) {
            /* 5028 */
            writeJson(rt, response);

            return;

        }
        /* 5032 */
        String officeEditorPath = String.valueOf(docSysWebPath) + "web/static/office-editor";
        /* 5033 */
        File file = new File(officeEditorPath);
        /* 5034 */
        if (!file.exists()) {
            /* 5036 */
            docSysErrorLog("Office编辑器未安装", rt);
            /* 5037 */
            writeJson(rt, response);

            return;

        }
        /* 5041 */
        LongTermTask queryTask = createLongTermTask("exportOffice", "Office导出", rt);
        /* 5042 */
        if (queryTask == null) {
            /* 5044 */
            writeJson(rt, response);

            return;

        }
        /* 5048 */
        queryTask.status = 0;
        /* 5049 */
        queryTask.info = "开始";
        /* 5050 */
        Log.debug("exportOffice() " + queryTask.info);
        /* 5051 */
        rt.setData(queryTask);
        /* 5052 */
        writeJson(rt, response);
        /* 5056 */
        queryTask.status = 1;
        /* 5057 */
        queryTask.info = "压缩Office编辑器";
        /* 5058 */
        Log.debug("exportOffice() " + queryTask.info);
        /* 5059 */
        if (!doCompressDir(String.valueOf(docSysWebPath) + "web/static/", "office-editor", String.valueOf(docSysWebPath) + "web/static/", "office-editor.zip", null)) {
            /* 5061 */
            queryTask.status = -1;
            /* 5062 */
            queryTask.info = "Office编辑器压缩失败";

            return;

        }
        /* 5065 */
        queryTask.info = "Office编辑器压缩完成";
        /* 5066 */
        Log.debug("exportOffice() " + queryTask.info);

    }


    @RequestMapping({"/installOffice.do"})
    public void installOffice(String name, Long size, HttpServletResponse response, HttpServletRequest request, HttpSession session) throws Exception {
        /* 5074 */
        Log.infoHead("************** installOffice ****************");
        /* 5075 */
        Log.info("installOffice  name:" + name + " size:" + size);
        /* 5077 */
        ReturnAjax rt = new ReturnAjax();
        /* 5079 */
        User accessUser = superAdminAccessCheck(null, "docSysInit", session, rt);
        /* 5080 */
        if (accessUser == null) {
            /* 5082 */
            writeJson(rt, response);

            return;

        }
        /* 5086 */
        if (name == null || !name.startsWith("office")) {
            /* 5088 */
            docSysErrorLog("非法文件名 " + name, rt);
            /* 5089 */
            writeJson(rt, response);

            return;

        }
        /* 5093 */
        String officeStorePath = String.valueOf(docSysWebPath) + "web/static/";
        /* 5094 */
        if (!checkFileSizeAndCheckSum(officeStorePath, name, size, null)) {
            /* 5096 */
            docSysErrorLog("文件校验失败", rt);
            /* 5097 */
            writeJson(rt, response);

            return;

        }
        /* 5101 */
        LongTermTask queryTask = createLongTermTask("installOffice", "Office安装", rt);
        /* 5102 */
        if (queryTask == null) {
            /* 5104 */
            writeJson(rt, response);

            return;

        }
        /* 5108 */
        queryTask.status = 0;
        /* 5109 */
        queryTask.info = "开始安装准备工作";
        /* 5110 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5111 */
        rt.setData(queryTask);
        /* 5112 */
        writeJson(rt, response);
        /* 5116 */
        queryTask.status = 1;
        /* 5117 */
        queryTask.info = "解压安装包";
        /* 5118 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5119 */
        if (!extractZipFile(officeStorePath, name, String.valueOf(officeStorePath) + "office-editor-tmp/")) {
            /* 5121 */
            queryTask.status = -1;
            /* 5122 */
            queryTask.info = "安装包解压失败";
            /* 5123 */
            Log.debug("installOffice() " + queryTask.info);

            return;

        }
        /* 5126 */
        queryTask.info = "安装包解压成功";
        /* 5127 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5130 */
        if (queryTask.stopFlag) {
            /* 5132 */
            queryTask.status = -1;
            /* 5133 */
            queryTask.info = "安装任务已被终止";
            /* 5134 */
            Log.debug("installOffice() " + queryTask.info);

            return;

        }
        /* 5138 */
        File file = new File(String.valueOf(docSysWebPath) + "web/static/office-editor");
        /* 5139 */
        if (file.exists()) {
            /* 5141 */
            docSysDebugLog("Office已安装，开始备份！", rt);
            /* 5142 */
            queryTask.status = 2;
            /* 5143 */
            queryTask.info = "备份已安装Office编辑器";
            /* 5144 */
            Log.debug("installOffice() " + queryTask.info);
            /* 5145 */
            if (!backupOfficeEditor()) {
                /* 5147 */
                queryTask.status = -1;
                /* 5148 */
                queryTask.info = "已安装Office编辑器备份失败";
                /* 5149 */
                Log.debug("installOffice() " + queryTask.info);

                return;

            }

        }
        /* 5153 */
        queryTask.info = "已安装Office编辑器备份完成";
        /* 5154 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5157 */
        queryTask.status = 3;
        /* 5158 */
        queryTask.info = "安装Office编辑器";
        /* 5159 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5160 */
        File tmpOffice = new File(String.valueOf(officeStorePath) + "office-editor-tmp/");
        /* 5161 */
        File[] subEntrys = tmpOffice.listFiles();
        /* 5162 */
        if (subEntrys.length == 1) {
            /* 5164 */
            Log.debug("installOffice() subEntryName:" + subEntrys[0].getName());
            /* 5165 */
            if (!FileUtil.moveFileOrDir(String.valueOf(officeStorePath) + "office-editor-tmp/", subEntrys[0].getName(), officeStorePath, "office-editor", false)) {
                /* 5167 */
                queryTask.status = -1;
                /* 5168 */
                queryTask.info = "Office编辑器安装失败";
                /* 5169 */
                Log.debug("installOffice() " + queryTask.info);

                return;

            }
            /* 5175 */
        } else if (!FileUtil.moveFileOrDir(officeStorePath, "office-editor-tmp", officeStorePath, "office-editor", false)) {
            /* 5177 */
            queryTask.status = -1;
            /* 5178 */
            queryTask.info = "Office编辑器安装失败";
            /* 5179 */
            Log.debug("installOffice() " + queryTask.info);

            return;

        }
        /* 5183 */
        queryTask.info = "Office编辑器安装完成";
        /* 5184 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5187 */
        queryTask.status = 4;
        /* 5188 */
        queryTask.info = "生成字体库";
        /* 5189 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5190 */
        b.g();
        /* 5191 */
        queryTask.info = "字体库生成完成";
        /* 5192 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5195 */
        queryTask.status = 4;
        /* 5196 */
        queryTask.info = "删除安装包";
        /* 5197 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5198 */
        FileUtil.delFile(String.valueOf(officeStorePath) + name);
        /* 5199 */
        queryTask.info = "删除安装包成功";
        /* 5200 */
        Log.debug("installOffice() " + queryTask.info);
        /* 5204 */
        queryTask.status = 200;
        /* 5205 */
        queryTask.info = "安装成功";
        /* 5206 */
        Log.debug("installOffice() " + queryTask.info);

    }


    private boolean backupOfficeEditor() {
        /* 5211 */
        String officeEditorPath = String.valueOf(docSysWebPath) + "web/static/office-editor";
        /* 5212 */
        String officeEditorBackupPath = String.valueOf(docSysWebPath) + "web/static/office-editor-backup";
        /* 5214 */
        File file = new File(officeEditorPath);
        /* 5215 */
        if (!file.exists())
            /* 5217 */ return true;
        /* 5220 */
        File backupFile = new File(officeEditorBackupPath);
        /* 5221 */
        if (backupFile.exists())
            /* 5223 */ if (!FileUtil.delFileOrDir(officeEditorBackupPath))
            /* 5225 */ return false;
        /* 5229 */
        return FileUtil.moveFileOrDir(String.valueOf(docSysWebPath) + "web/static/", "office-editor", String.valueOf(docSysWebPath) + "web/static/", "office-editor-backup", false);

    }


    @RequestMapping({"/resetDocHistory.do"})
    public void resetDocHistory(String taskId, Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String commitId, Integer historyType, String entryPath, String commitMsg, Integer shareId, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 5244 */
        Log.infoHead("************** resetDocHistory [" + path + name + "] ****************");
        /* 5245 */
        Log.info("resetDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath + " shareId:" + shareId);
        /* 5248 */
        ReturnAjax rt = new ReturnAjax((new Date()).getTime());
        /* 5250 */
        if (historyType == null)
            /* 5252 */ historyType = Integer.valueOf(0);
        /* 5255 */
        switch (historyType.intValue()) {

            case 0:
                /* 5258 */
                if (!channel.isAllowedAction("resetHistory", rt)) {
                    /* 5260 */
                    writeJson(rt, response);

                    return;

                }

                break;

            case 2:

            case 3:
                /* 5266 */
                if (!channel.isAllowedAction("recoverBackup", rt)) {
                    /* 5268 */
                    writeJson(rt, response);

                    return;

                }

                break;

            case 4:
                /* 5273 */
                if (!channel.isAllowedAction("recycleBin", rt)) {
                    /* 5275 */
                    writeJson(rt, response);

                    return;

                }

                break;

        }
        /* 5281 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
        /* 5282 */
        if (reposAccess == null) {
            /* 5284 */
            writeJson(rt, response);

            return;

        }
        /* 5288 */
        if (reposAccess.getAccessUser().getType().intValue() < 2) {
            /* 5290 */
            Log.debug("resetDocHistory 非系统管理员用户禁止历史回退");
            /* 5291 */
            rt.setError("您没有该操作权限，请咨询系统管理员");
            /* 5292 */
            writeJson(rt, response);

            return;

        }
        /* 5296 */
        if (reposId == null) {
            /* 5298 */
            docSysErrorLog("reposId is null", rt);
            /* 5299 */
            writeJson(rt, response);

            return;

        }
        /* 5303 */
        Repos repos = getReposEx(reposId);
        /* 5304 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 5309 */
        if (commitMsg == null)
            /* 5311 */ commitMsg = "历史版本回退 [" + path + name + "]";
        /* 5314 */
        if (historyType == null)
            /* 5316 */ historyType = Integer.valueOf(0);
        /* 5319 */
        if (historyType.intValue() == 1) {
            /* 5321 */
            revertVirtualDocHistory(
                    /* 5322 */           taskId,
                    /* 5323 */           repos,
                    /* 5324 */           docId, pid, path, name, level, type,
                    /* 5325 */           commitId,
                    /* 5326 */           entryPath,
                    /* 5327 */           Integer.valueOf(1),
                    /* 5328 */           Integer.valueOf(0),
                    /* 5329 */           commitMsg,
                    /* 5330 */           reposAccess,
                    /* 5331 */           rt,
                    /* 5332 */           session, request, response);

            return;

        }
        /* 5336 */
        revertRealDocHistory(
                /* 5337 */         taskId,
                /* 5338 */         repos,
                /* 5339 */         docId, pid, path, name, level, type,
                /* 5340 */         commitId,
                /* 5341 */         entryPath,
                /* 5342 */         Integer.valueOf(1),
                /* 5343 */         Integer.valueOf(0),
                /* 5344 */         commitMsg,
                /* 5345 */         reposAccess,
                /* 5346 */         rt,
                /* 5347 */         session, request, response,
                /* 5348 */         historyType.intValue());

    }


    @RequestMapping({"/deleteDocHistory.do"})
    public void deleteDocHistory(String taskId, Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, String commitId, Integer historyType, String entryPath, String commitMsg, Integer shareId, HttpSession session, HttpServletRequest request, HttpServletResponse response) {
        /* 5363 */
        Log.infoHead("************** deleteDocHistory [" + path + name + "] ****************");
        /* 5364 */
        Log.info("deleteDocHistory reposId:" + reposId + " docId: " + docId + " pid:" + pid + " path:" + path + " name:" + name + " level:" + level + " type:" + type + " historyType:" + historyType + " commitId:" + commitId + " entryPath:" + entryPath + " shareId:" + shareId);
        /* 5367 */
        ReturnAjax rt = new ReturnAjax((new Date()).getTime());
        /* 5370 */
        if (!channel.isAllowedAction("deleteHistory", rt)) {
            /* 5372 */
            Log.debug("deleteDocHistory 证书校验失败");
            /* 5373 */
            writeJson(rt, response);

            return;

        }
        /* 5377 */
        ReposAccess reposAccess = checkAndGetAccessInfo(shareId, session, request, response, reposId, path, name, true, rt);
        /* 5378 */
        if (reposAccess == null) {
            /* 5380 */
            writeJson(rt, response);

            return;

        }
        /* 5384 */
        if (reposAccess.getAccessUser().getType().intValue() < 2) {
            /* 5386 */
            Log.debug("deleteDocHistory 非系统管理员用户禁止删除历史");
            /* 5387 */
            rt.setError("您没有该操作权限，请咨询系统管理员");
            /* 5388 */
            writeJson(rt, response);

            return;

        }
        /* 5392 */
        if (reposId == null) {
            /* 5394 */
            docSysErrorLog("reposId is null", rt);
            /* 5395 */
            writeJson(rt, response);

            return;

        }
        /* 5399 */
        if (historyType == null) {
            /* 5401 */
            docSysErrorLog("historyType is null", rt);
            /* 5402 */
            writeJson(rt, response);

            return;

        }
        /* 5406 */
        Repos repos = getReposEx(reposId);
        /* 5407 */
        if (!reposCheck(repos, rt, response))
            return;
        /* 5412 */
        deleteRealDocHistory(
                /* 5413 */         taskId,
                /* 5414 */         repos,
                /* 5415 */         docId, pid, path, name, level, type,
                /* 5416 */         commitId,
                /* 5417 */         entryPath,
                /* 5418 */         reposAccess,
                /* 5419 */         rt,
                /* 5420 */         session, request, response,
                /* 5421 */         historyType.intValue());

    }

}


/* Location:              D:\workspace\idea\DocSys\WebRoot\WEB-INF\mxsdoc.jar!\com\DocSystem\websocket\BussinessController.class
 * Java compiler version: 8 (52.0)
 * JD-Core Version:       1.1.3
 */