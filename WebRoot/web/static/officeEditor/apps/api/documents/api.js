/*
 * Copyright (c) Ascensio System SIA 2020. All rights reserved
 *
 * http://www.onlyoffice.com 
 *
 * Version: 5.5.0 (build:165)
 */


;(function(DocsAPI, window, document, undefined) {

    /*

        # Full #

        config = {
            type: 'desktop or mobile',
            width: '100% by default',
            height: '100% by default',
            documentType: 'text' | 'spreadsheet' | 'presentation',
            document: {
                title: 'document title',
                url: 'document url'
                fileType: 'document file type',
                options: <advanced options>,
                key: 'key',
                vkey: 'vkey',
                info: {
                    author: 'author name', // must be deprecated, use owner instead
                    owner: 'owner name',
                    folder: 'path to document',
                    created: '<creation date>', // must be deprecated, use uploaded instead
                    uploaded: '<uploaded date>',
                    sharingSettings: [
                        {
                            user: 'user name',
                            permissions: '<permissions>',
                            isLink: false
                        },
                        ...
                    ]
                },
                permissions: {
                    edit: <can edit>, // default = true
                    download: <can download>, // default = true
                    reader: <can view in readable mode>,
                    review: <can review>, // default = edit
                    print: <can print>, // default = true
                    rename: <can rename>, // default = false
                    changeHistory: <can change history>, // default = false // must be deprecated, check onRequestRestore event instead
                    comment: <can comment in view mode> // default = edit,
                    modifyFilter: <can add, remove and save filter in the spreadsheet> // default = true
                    modifyContentControl: <can modify content controls in documenteditor> // default = true
                   fillForms:  <can edit forms in view mode> // default = edit || review
                }
            },
            editorConfig: {
                mode: 'view or edit',
                lang: <language code>,
                location: <location>,
                canCoAuthoring: <can coauthoring documents>,
                canBackToFolder: <can return to folder> - deprecated. use "customization.goback" parameter,
                createUrl: 'create document url', 
                sharingSettingsUrl: 'document sharing settings url',
                fileChoiceUrl: 'source url', // for mail merge or image from storage
                callbackUrl: <url for connection between sdk and portal>,
                mergeFolderUrl: 'folder for saving merged file', // must be deprecated, use saveAsUrl instead
                saveAsUrl: 'folder for saving files'
                licenseUrl: <url for license>,
                customerId: <customer id>,
                region: <regional settings> // can be 'en-us' or lang code

                user: {
                    id: 'user id',
                    name: 'user name'
                },
                recent: [
                    {
                        title: 'document title',
                        url: 'document url',
                        folder: 'path to document'
                    },
                    ...
                ],
                templates: [
                    {
                        name: 'template name',
                        icon: 'template icon url',
                        url: 'http://...'
                    },
                    ...
                ],
                customization: {
                    logo: {
                        image: url,
                        imageEmbedded: url,
                        url: http://...
                    },
                    customer: {
                        name: 'SuperPuper',
                        address: 'New-York, 125f-25',
                        mail: 'support@gmail.com',
                        www: 'www.superpuper.com',
                        info: 'Some info',
                        logo: ''
                    },
                    about: true,
                    feedback: {
                        visible: false,
                        url: http://...
                    },
                    goback: {
                        url: 'http://...',
                        text: 'Go to London',
                        blank: true,
                        requestClose: false // if true - goback send onRequestClose event instead opening url
                    },
                    chat: true,
                    comments: true,
                    zoom: 100,
                    compactToolbar: false,
                    leftMenu: true,
                    rightMenu: true,
                    hideRightMenu: false, // hide or show right panel on first loading
                    toolbar: true,
                    statusBar: true,
                    autosave: true,
                    forcesave: false,
                    commentAuthorOnly: false,
                    showReviewChanges: false,
                    help: true,
                    compactHeader: false,
                    toolbarNoTabs: false,
                    toolbarHideFileName: false,
                    reviewDisplay: 'original',
                    spellcheck: true,
                    compatibleFeatures: false,
                    unit: 'cm' // cm, pt, inch,
                    mentionShare : true // customize tooltip for mention
                },
                plugins: {
                    autostart: ['asc.{FFE1F462-1EA2-4391-990D-4CC84940B754}'],
                    pluginsData: [
                        "helloworld/config.json",
                        "chess/config.json",
                        "speech/config.json",
                        "clipart/config.json",
                    ]
                }
            },
            events: {
                'onAppReady': <application ready callback>,
                'onBack': <back to folder callback>,
                'onDocumentStateChange': <document state changed callback>
                'onDocumentReady': <document ready callback>
            }
        }

        # Embedded #

        config = {
            type: 'embedded',
            width: '100% by default',
            height: '100% by default',
            documentType: 'text' | 'spreadsheet' | 'presentation',
            document: {
                title: 'document title',
                url: 'document url',
                fileType: 'document file type',
                key: 'key',
                vkey: 'vkey'
            },
            editorConfig: {
                licenseUrl: <url for license>,
                customerId: <customer id>,
                autostart: 'document',    // action for app's autostart. for presentations default value is 'player'
                embedded: {
                     embedUrl: 'url',
                     fullscreenUrl: 'url',
                     saveUrl: 'url',
                     shareUrl: 'url',
                     toolbarDocked: 'top or bottom'
                }
            },
            events: {
                'onAppReady': <application ready callback>,
                'onBack': <back to folder callback>,
                'onError': <error callback>,
                'onDocumentReady': <document ready callback>,
                'onWarning': <warning callback>
            }
        }
    */

    // TODO: allow several instances on one page simultaneously

    DocsAPI.DocEditor = function(placeholderId, config) {
    	console.log("DocsAPI.DocEditor placeholderId:" + placeholderId);
    	console.log("DocsAPI.DocEditor config:",config);

    	var _self = this,
            _config = config || {};

        //_config不存在的参数用默认参数填充
        extend(_config, DocsAPI.DocEditor.defaultConfig);
        //设置_config的其他参数
        _config.editorConfig.canUseHistory = _config.events && !!_config.events.onRequestHistory;
        _config.editorConfig.canHistoryClose = _config.events && !!_config.events.onRequestHistoryClose;
        _config.editorConfig.canHistoryRestore = _config.events && !!_config.events.onRequestRestore;
        _config.editorConfig.canSendEmailAddresses = _config.events && !!_config.events.onRequestEmailAddresses;
        _config.editorConfig.canRequestEditRights = _config.events && !!_config.events.onRequestEditRights;
        _config.editorConfig.canRequestClose = _config.events && !!_config.events.onRequestClose;
        _config.editorConfig.canRename = _config.events && !!_config.events.onRequestRename;
        _config.editorConfig.canMakeActionLink = _config.events && !!_config.events.onMakeActionLink;
        _config.editorConfig.canRequestUsers = _config.events && !!_config.events.onRequestUsers;
        _config.editorConfig.canRequestSendNotify = _config.events && !!_config.events.onRequestSendNotify;
        _config.editorConfig.mergeFolderUrl = _config.editorConfig.mergeFolderUrl || _config.editorConfig.saveAsUrl;
        _config.editorConfig.canRequestSaveAs = _config.events && !!_config.events.onRequestSaveAs;
        _config.editorConfig.canRequestInsertImage = _config.events && !!_config.events.onRequestInsertImage;
        _config.editorConfig.canRequestMailMergeRecipients = _config.events && !!_config.events.onRequestMailMergeRecipients;
        _config.editorConfig.canRequestCompareFile = _config.events && !!_config.events.onRequestCompareFile;
        _config.editorConfig.canRequestSharingSettings = _config.events && !!_config.events.onRequestSharingSettings;
        _config.frameEditorId = placeholderId;

        var onMouseUp = function (evt) {
        	console.log("onMouseUp()");
            _processMouse(evt);
        };

        var _attachMouseEvents = function() {
        	console.log("_attachMouseEvents()");
            if (window.addEventListener) {
                window.addEventListener("mouseup", onMouseUp, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmouseup", onMouseUp);
            }
        };

        var _detachMouseEvents = function() {
        	console.log("_detachMouseEvents()");
            if (window.removeEventListener) {
                window.removeEventListener("mouseup", onMouseUp, false)
            } else if (window.detachEvent) {
                window.detachEvent("onmouseup", onMouseUp);
            }
        };

        var _onAppReady = function() {
        	console.log("_onAppReady()");
            if (_config.type === 'mobile') {
                document.body.onfocus = function(e) {
                    setTimeout(function(){
                        iframe.contentWindow.focus();

                        _sendCommand({
                            command: 'resetFocus',
                            data: {}
                        })
                    }, 10);
                };
            }

            _attachMouseEvents();

            if (_config.editorConfig) {
                _init(_config.editorConfig);
            }

            if (_config.document) {
                _openDocument(_config.document);
            }
        };

        var _callLocalStorage = function(data) {
        	console.log("_callLocalStorage()");
            if (data.cmd == 'get') {
                if (data.keys && data.keys.length) {
                    var af = data.keys.split(','), re = af[0];
                    for (i = 0; ++i < af.length;)
                        re += '|' + af[i];

                    re = new RegExp(re); k = {};
                    for (i in localStorage)
                        if (re.test(i)) k[i] = localStorage[i];
                } else {
                    k = localStorage;
                }

                _sendCommand({
                    command: 'internalCommand',
                    data: {
                        type: 'localstorage',
                        keys: k
                    }
                });
            } else
            if (data.cmd == 'set') {
                var k = data.keys, i;
                for (i in k) {
                    localStorage.setItem(i, k[i]);
                }
            }
        };

        var _onMessage = function(msg) {
        	console.log("_onMessage()");
            if ( msg ) {
                if ( msg.type === "onExternalPluginMessage" ) {
                    _sendCommand(msg);
                } else
                if ( msg.frameEditorId == placeholderId ) {
                    var events = _config.events || {},
                        handler = events[msg.event],
                        res;

                    if (msg.event === 'onRequestEditRights' && !handler) {
                        _applyEditRights(false, 'handler isn\'t defined');
                    } else if (msg.event === 'onInternalMessage' && msg.data && msg.data.type == 'localstorage') {
                        _callLocalStorage(msg.data.data);
                    } else {
                        if (msg.event === 'onAppReady') {
                            _onAppReady();
                        }

                        if (handler && typeof handler == "function") {
                            res = handler.call(_self, {target: _self, data: msg.data});
                        }
                    }
                }
            }
        };

        var _checkConfigParams = function() {
        	console.log("_checkConfigParams()");
            if (_config.document) {
                if (!_config.document.url || ((typeof _config.document.fileType !== 'string' || _config.document.fileType=='') &&
                                              (typeof _config.documentType !== 'string' || _config.documentType==''))) {
                    window.alert("One or more required parameter for the config object is not set");
                    return false;
                }

                var appMap = {
                        'text': 'docx',
                        'text-pdf': 'pdf',
                        'spreadsheet': 'xlsx',
                        'presentation': 'pptx'
                    }, app;

                if (typeof _config.documentType === 'string' && _config.documentType != '') {
                    app = appMap[_config.documentType.toLowerCase()];
                    if (!app) {
                        window.alert("The \"documentType\" parameter for the config object is invalid. Please correct it.");
                        return false;
                    } else if (typeof _config.document.fileType !== 'string' || _config.document.fileType == '') {
                        _config.document.fileType = app;
                    }
                }

                if (typeof _config.document.fileType === 'string' && _config.document.fileType != '') {
                    var type = /^(?:(xls|xlsx|ods|csv|xlst|xlsy|gsheet|xlsm|xlt|xltm|xltx|fods|ots)|(pps|ppsx|ppt|pptx|odp|pptt|ppty|gslides|pot|potm|potx|ppsm|pptm|fodp|otp)|(doc|docx|doct|odt|gdoc|txt|rtf|pdf|mht|htm|html|epub|djvu|xps|docm|dot|dotm|dotx|fodt|ott))$/
                                    .exec(_config.document.fileType);
                    if (!type) {
                        window.alert("The \"document.fileType\" parameter for the config object is invalid. Please correct it.");
                        return false;
                    } else if (typeof _config.documentType !== 'string' || _config.documentType == ''){
                        if (typeof type[1] === 'string') _config.documentType = 'spreadsheet'; else
                        if (typeof type[2] === 'string') _config.documentType = 'presentation'; else
                        if (typeof type[3] === 'string') _config.documentType = 'text';
                    }
                }

                var type = /^(?:(pdf|djvu|xps))$/.exec(_config.document.fileType);
                if (type && typeof type[1] === 'string') {
                    _config.editorConfig.canUseHistory = false;
                }

                if (!_config.document.title || _config.document.title=='')
                    _config.document.title = 'Unnamed.' + _config.document.fileType;

                if (!_config.document.key) {
                    _config.document.key = 'xxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function (c) {var r = Math.random() * 16 | 0; return r.toString(16);});
                } else if (typeof _config.document.key !== 'string') {
                    window.alert("The \"document.key\" parameter for the config object must be string. Please correct it.");
                    return false;
                }

                _config.document.token = _config.token;
            }
            
            return true;
        };

        //
        (function() {
            var result = /[\?\&]placement=(\w+)&?/.exec(window.location.search);
            console.log("DocsAPI.DocEditor() result:", result);
            
            if (!!result && result.length) {
                if (result[1] == 'desktop') {
                	console.log("DocsAPI.DocEditor() result[1]:", result[1]);
                    _config.editorConfig.targetApp = result[1];
                    // _config.editorConfig.canBackToFolder = false;
                    if (!_config.editorConfig.customization) _config.editorConfig.customization = {};
                    _config.editorConfig.customization.about = false;
                    _config.editorConfig.customization.compactHeader = false;

                    if ( window.AscDesktopEditor ) window.AscDesktopEditor.execCommand('webapps:events', 'loading');
                }
            }
        })();

        //检查配置并生成iframe来加载对应的编辑器页面
        var target = document.getElementById(placeholderId),
            iframe;

        console.log("DocsAPI.DocEditor() target:", target);
        console.log("DocsAPI.DocEditor() iframe:", iframe);

        if (target && _checkConfigParams()) {
            iframe = createIframe(_config);
            //这里应该是动态加载页面的地方
            target.parentNode && target.parentNode.replaceChild(iframe, target);
            var _msgDispatcher = new MessageDispatcher(_onMessage, this);
        }
        
        
        console.log("DocsAPI.DocEditor() iframe:", iframe);       

        /*
         cmd = {
         command: 'commandName',
         data: <command specific data>
         }
         */

        var _destroyEditor = function(cmd) {
            console.log("_destroyEditor()");       

            var target = document.createElement("div");
            target.setAttribute('id', placeholderId);

            if (iframe) {
                _msgDispatcher && _msgDispatcher.unbindEvents();
                _detachMouseEvents();
                iframe.parentNode && iframe.parentNode.replaceChild(target, iframe);
            }
        };

        var _sendCommand = function(cmd) {
            console.log("_sendCommand()");       

        	if (iframe && iframe.contentWindow)
                postMessage(iframe.contentWindow, cmd);
        };

        var _init = function(editorConfig) {
            console.log("_init()");       

            _sendCommand({
                command: 'init',
                data: {
                    config: editorConfig
                }
            });
        };

        var _openDocument = function(doc) {
            console.log("_openDocument()");       

            _sendCommand({
                command: 'openDocument',
                data: {
                    doc: doc
                }
            });
        };

        var _showMessage = function(title, msg) {
            console.log("_showMessage()");       

            msg = msg || title;
            _sendCommand({
                command: 'showMessage',
                data: {
                    msg: msg
                }
            });
        };

        var _applyEditRights = function(allowed, message) {
            console.log("_applyEditRights()");       

            _sendCommand({
                command: 'applyEditRights',
                data: {
                    allowed: allowed,
                    message: message
                }
            });
        };

        var _processSaveResult = function(result, message) {
            console.log("_processSaveResult()");       

            _sendCommand({
                command: 'processSaveResult',
                data: {
                    result: result,
                    message: message
                }
            });
        };

        // TODO: remove processRightsChange, use denyEditingRights
        var _processRightsChange = function(enabled, message) {
            console.log("_processRightsChange()");       

            _sendCommand({
                command: 'processRightsChange',
                data: {
                    enabled: enabled,
                    message: message
                }
            });
        };

        var _denyEditingRights = function(message) {
            console.log("_denyEditingRights()");       

            _sendCommand({
                command: 'processRightsChange',
                data: {
                    enabled: false,
                    message: message
                }
            });
        };

        var _refreshHistory = function(data, message) {
            console.log("_refreshHistory()");       

            _sendCommand({
                command: 'refreshHistory',
                data: {
                    data: data,
                    message: message
                }
            });
        };

        var _setHistoryData = function(data, message) {
            console.log("_setHistoryData()");       

            _sendCommand({
                command: 'setHistoryData',
                data: {
                    data: data,
                    message: message
                }
            });
        };

        var _setEmailAddresses = function(data) {
            console.log("_setEmailAddresses()");       

            _sendCommand({
                command: 'setEmailAddresses',
                data: {
                    data: data
                }
            });
        };

        var _setActionLink = function (data) {
            console.log("_setActionLink()");       

            _sendCommand({
                command: 'setActionLink',
                data: {
                    url: data
                }
            });
        };

        var _processMailMerge = function(enabled, message) {
            console.log("_processMailMerge()");       

            _sendCommand({
                command: 'processMailMerge',
                data: {
                    enabled: enabled,
                    message: message
                }
            });
        };

        var _downloadAs = function(data) {
        	console.log("_downloadAs()");  
            _sendCommand({
                command: 'downloadAs',
                data: data
            });
        };

        var _setUsers = function(data) {
        	console.log("_setUsers()");  
            _sendCommand({
                command: 'setUsers',
                data: data
            });
        };

        var _showSharingSettings = function(data) {
        	console.log("_showSharingSettings()");  
            _sendCommand({
                command: 'showSharingSettings',
                data: data
            });
        };

        var _setSharingSettings = function(data) {
        	console.log("_setSharingSettings()"); 
            _sendCommand({
                command: 'setSharingSettings',
                data: data
            });
        };

        var _insertImage = function(data) {
        	console.log("_insertImage()"); 
            _sendCommand({
                command: 'insertImage',
                data: data
            });
        };

        var _setMailMergeRecipients = function(data) {
        	console.log("_setMailMergeRecipients()"); 
            _sendCommand({
                command: 'setMailMergeRecipients',
                data: data
            });
        };

        var _setRevisedFile = function(data) {
        	console.log("_setRevisedFile()"); 
            _sendCommand({
                command: 'setRevisedFile',
                data: data
            });
        };

        var _processMouse = function(evt) {
        	console.log("_processMouse()"); 
            var r = iframe.getBoundingClientRect();
            var data = {
                type: evt.type,
                x: evt.x - r.left,
                y: evt.y - r.top,
                event: evt
            };

            _sendCommand({
                command: 'processMouse',
                data: data
            });
        };

        var _serviceCommand = function(command, data) {
        	console.log("_serviceCommand()"); 
            _sendCommand({
                command: 'internalCommand',
                data: {
                    command: command,
                    data: data
                }
            });
        };

        return {
            showMessage         : _showMessage,
            processSaveResult   : _processSaveResult,
            processRightsChange : _processRightsChange,
            denyEditingRights   : _denyEditingRights,
            refreshHistory      : _refreshHistory,
            setHistoryData      : _setHistoryData,
            setEmailAddresses   : _setEmailAddresses,
            setActionLink       : _setActionLink,
            processMailMerge    : _processMailMerge,
            downloadAs          : _downloadAs,
            serviceCommand      : _serviceCommand,
            attachMouseEvents   : _attachMouseEvents,
            detachMouseEvents   : _detachMouseEvents,
            destroyEditor       : _destroyEditor,
            setUsers            : _setUsers,
            showSharingSettings : _showSharingSettings,
            setSharingSettings  : _setSharingSettings,
            insertImage         : _insertImage,
            setMailMergeRecipients: _setMailMergeRecipients,
            setRevisedFile      : _setRevisedFile
        }
    };


    DocsAPI.DocEditor.defaultConfig = {
        type: 'desktop',
        width: '100%',
        height: '100%',
        editorConfig: {
            lang: 'en',
            canCoAuthoring: true,
            customization: {
                about: true,
                feedback: false
            }
        }
    };

    DocsAPI.DocEditor.version = function() {
        return '5.5.0';
    };

    MessageDispatcher = function(fn, scope) {
        var _fn     = fn,
            _scope  = scope || window,
            eventFn = function(msg) {
        		console.log("eventFn()"); 
                _onMessage(msg);
            };

        var _bindEvents = function() {
        	console.log("_bindEvents()"); 
            if (window.addEventListener) {
                window.addEventListener("message", eventFn, false)
            }
            else if (window.attachEvent) {
                window.attachEvent("onmessage", eventFn);
            }
        };

        var _unbindEvents = function() {
        	console.log("_unbindEvents()"); 
            if (window.removeEventListener) {
                window.removeEventListener("message", eventFn, false)
            }
            else if (window.detachEvent) {
                window.detachEvent("onmessage", eventFn);
            }
        };

        var _onMessage = function(msg) {
        	console.log("_onMessage()");
            // TODO: check message origin
            if (msg && window.JSON) {

                try {
                    var msg = window.JSON.parse(msg.data);
                    if (_fn) {
                        _fn.call(_scope, msg);
                    }
                } catch(e) {}
            }
        };

        _bindEvents.call(this);

        return {
            unbindEvents: _unbindEvents
        }
    };

    function getBasePath() {
        var scripts = document.getElementsByTagName('script'),
            match;

        for (var i = scripts.length - 1; i >= 0; i--) {
            match = scripts[i].src.match(/(.*)api\/documents\/api.js/i);
            if (match) {
                return match[1];
            }
        }

        return "";
    }

    function getExtensionPath() {
        if ("undefined" == typeof(extensionParams) || null == extensionParams["url"])
            return null;
        return extensionParams["url"] + "apps/";
    }

    function getAppPath(config) {
        var extensionPath = getExtensionPath(),
            path = extensionPath ? extensionPath : getBasePath(),
            appMap = {
                'text': 'documenteditor',
                'text-pdf': 'documenteditor',
                'spreadsheet': 'spreadsheeteditor',
                'presentation': 'presentationeditor'
            },
            app = appMap['text'];

        if (typeof config.documentType === 'string') {
            app = appMap[config.documentType.toLowerCase()];
        } else
        if (!!config.document && typeof config.document.fileType === 'string') {
            var type = /^(?:(xls|xlsx|ods|csv|xlst|xlsy|gsheet|xlsm|xlt|xltm|xltx|fods|ots)|(pps|ppsx|ppt|pptx|odp|pptt|ppty|gslides|pot|potm|potx|ppsm|pptm|fodp|otp))$/
                            .exec(config.document.fileType);
            if (type) {
                if (typeof type[1] === 'string') app = appMap['spreadsheet']; else
                if (typeof type[2] === 'string') app = appMap['presentation'];
            }
        }

        var userAgent = navigator.userAgent.toLowerCase(),
            check = function(regex){ return regex.test(userAgent); },
            isIE = !check(/opera/) && (check(/msie/) || check(/trident/) || check(/edge/)),
            isChrome = !isIE && check(/\bchrome\b/),
            isSafari_mobile = !isIE && !isChrome && check(/safari/) && (navigator.maxTouchPoints>0);

        path += app + "/";
        path += (config.type === "mobile" || isSafari_mobile)
            ? "mobile"
            : config.type === "embedded"
                ? "embed"
                : "main";

        var index = "/index.html";
        if (config.editorConfig) {
            var customization = config.editorConfig.customization;
            if ( typeof(customization) == 'object' && ( customization.toolbarNoTabs ||
                                                        (config.editorConfig.targetApp!=='desktop') && (customization.loaderName || customization.loaderLogo))) {
                index = "/index_loader.html";
            }
        }
        path += index;
        return path;
    }

    function getAppParameters(config) {
        var params = "?_dc=5.5.0-165";

        if (config.editorConfig && config.editorConfig.lang)
            params += "&lang=" + config.editorConfig.lang;

        if (config.editorConfig && config.editorConfig.targetApp!=='desktop') {
            if ( (typeof(config.editorConfig.customization) == 'object') && config.editorConfig.customization.loaderName) {
                if (config.editorConfig.customization.loaderName !== 'none') params += "&customer=" + config.editorConfig.customization.loaderName;
            } else
                params += "&customer=ONLYOFFICE";
            if ( (typeof(config.editorConfig.customization) == 'object') && config.editorConfig.customization.loaderLogo) {
                if (config.editorConfig.customization.loaderLogo !== '') params += "&logo=" + config.editorConfig.customization.loaderLogo;
            } else if ( (typeof(config.editorConfig.customization) == 'object') && config.editorConfig.customization.logo) {
                if (config.type=='embedded' && config.editorConfig.customization.logo.imageEmbedded)
                    params += "&headerlogo=" + config.editorConfig.customization.logo.imageEmbedded;
                else if (config.type!='embedded' && config.editorConfig.customization.logo.image)
                    params += "&headerlogo=" + config.editorConfig.customization.logo.image;
            }
        }

        if (config.editorConfig && (config.editorConfig.mode == 'editdiagram' || config.editorConfig.mode == 'editmerge'))
            params += "&internal=true";

        if (config.frameEditorId)
            params += "&frameEditorId=" + config.frameEditorId;

        if (config.editorConfig && config.editorConfig.mode == 'view' ||
            config.document && config.document.permissions && (config.document.permissions.edit === false && !config.document.permissions.review ))
            params += "&mode=view";

        if (config.editorConfig && config.editorConfig.customization && !!config.editorConfig.customization.compactHeader)
            params += "&compact=true";

        if (config.editorConfig && config.editorConfig.customization && (config.editorConfig.customization.toolbar===false))
            params += "&toolbar=false";

        return params;
    }

    function createIframe(config) {
        var iframe = document.createElement("iframe");

        iframe.src = getAppPath(config) + getAppParameters(config);
        console.log("createIframe() iframe.src:" + iframe.src);
        
        iframe.width = config.width;
        iframe.height = config.height;
        iframe.align = "top";
        iframe.frameBorder = 0;
        iframe.name = "frameEditor";
        iframe.allowFullscreen = true;
        iframe.setAttribute("allowfullscreen",""); // for IE11
        iframe.setAttribute("onmousewheel",""); // for Safari on Mac
        iframe.setAttribute("allow", "autoplay");
        
		if (config.type == "mobile")
		{
			iframe.style.position = "fixed";
            iframe.style.overflow = "hidden";
            document.body.style.overscrollBehaviorY = "contain";
		}
        return iframe;
    }

    function postMessage(wnd, msg) {
    	console.log("postMessage() msg:",msg);
        if (wnd && wnd.postMessage && window.JSON) {
            // TODO: specify explicit origin
            wnd.postMessage(window.JSON.stringify(msg), "*");
        }

    }

    function extend(dest, src) {
        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                if (typeof dest[prop] === 'undefined') {
                    dest[prop] = src[prop];
                } else
                if (typeof dest[prop] === 'object' &&
                        typeof src[prop] === 'object') {
                    extend(dest[prop], src[prop])
                }
            }
        }
        return dest;
    }

})(window.DocsAPI = window.DocsAPI || {}, window, document);

