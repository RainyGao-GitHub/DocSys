	if (Common === undefined) {
	    var Common = {};
	}

    Common.Gateway = new(function() {
        var me = this,
            $me = $(me);

        var commandMap = {
            'init': function(data) {
                $me.trigger('init', data);
            },

            'openDocument': function(data) {
                $me.trigger('opendocument', data);
            },

            'showMessage': function(data) {
                $me.trigger('showmessage', data);
            },

            'applyEditRights': function(data) {
                $me.trigger('applyeditrights', data);
            },

            'processSaveResult': function(data) {
                $me.trigger('processsaveresult', data);
            },

            'processRightsChange': function(data) {
                $me.trigger('processrightschange', data);
            },

            'refreshHistory': function(data) {
                $me.trigger('refreshhistory', data);
            },

            'setHistoryData': function(data) {
                $me.trigger('sethistorydata', data);
            },

            'setEmailAddresses': function(data) {
                $me.trigger('setemailaddresses', data);
            },

            'setActionLink': function (data) {
                $me.trigger('setactionlink', data.url);
            },

            'processMailMerge': function(data) {
                $me.trigger('processmailmerge', data);
            },

            'downloadAs': function(data) {
                $me.trigger('downloadas', data);
            },

            'processMouse': function(data) {
                $me.trigger('processmouse', data);
            },

            'internalCommand': function(data) {
                $me.trigger('internalcommand', data);
            },

            'resetFocus': function(data) {
                $me.trigger('resetfocus', data);
            },

            'setUsers': function(data) {
                $me.trigger('setusers', data);
            },

            'showSharingSettings': function(data) {
                $me.trigger('showsharingsettings', data);
            },

            'setSharingSettings': function(data) {
                $me.trigger('setsharingsettings', data);
            },

            'insertImage': function(data) {
                $me.trigger('insertimage', data);
            },

            'setMailMergeRecipients': function(data) {
                $me.trigger('setmailmergerecipients', data);
            },

            'setRevisedFile': function(data) {
                $me.trigger('setrevisedfile', data);
            }
        };

        var _postMessage = function(msg) {
            console.log("Gateway _postMessage() msg:", msg);

            // TODO: specify explicit origin
            if (window.parent && window.JSON) {
                msg.frameEditorId = window.frameEditorId;
                window.parent.postMessage(window.JSON.stringify(msg), "*");
            }
        };

        var _onMessage = function(msg) {
            console.log("Gateway _onMessage() msg:", msg);

        	// TODO: check message origin
            var data = msg.data;
            
            if (Object.prototype.toString.apply(data) !== '[object String]' || !window.JSON) {
                return;
            }

            var cmd, handler;

            try {
                cmd = window.JSON.parse(data)
            } catch(e) {
                cmd = '';
            }

            if (cmd) {
                handler = commandMap[cmd.command];
                if (handler) {
                    handler.call(this, cmd.data);
                }
            }
        };

        var fn = function(e) { _onMessage(e); };

        if (window.attachEvent) {
            window.attachEvent('onmessage', fn);
        } else {
            window.addEventListener('message', fn, false);
        }

        return {

            appReady: function() {
                _postMessage({ event: 'onAppReady' });
            },

            requestEditRights: function() {
                _postMessage({ event: 'onRequestEditRights' });
            },

            requestHistory: function() {
                _postMessage({ event: 'onRequestHistory' });
            },

            requestHistoryData: function(revision) {
                _postMessage({
                    event: 'onRequestHistoryData',
                    data: revision
                });
            },

            requestRestore: function(version, url) {
                _postMessage({
                    event: 'onRequestRestore',
                    data: {
                        version: version,
                        url: url
                    }
                });
            },

            requestEmailAddresses: function() {
                _postMessage({ event: 'onRequestEmailAddresses' });
            },

            requestStartMailMerge: function() {
                _postMessage({event: 'onRequestStartMailMerge'});
            },

            requestHistoryClose: function(revision) {
                _postMessage({event: 'onRequestHistoryClose'});
            },

            reportError: function(code, description) {
                _postMessage({
                    event: 'onError',
                    data: {
                        errorCode: code,
                        errorDescription: description
                    }
                });
            },

            reportWarning: function(code, description) {
                _postMessage({
                    event: 'onWarning',
                    data: {
                        warningCode: code,
                        warningDescription: description
                    }
                });
            },

            sendInfo: function(info) {
                _postMessage({
                    event: 'onInfo',
                    data: info
                });
            },

            setDocumentModified: function(modified) {
                _postMessage({
                    event: 'onDocumentStateChange',
                    data: modified
                });
            },

            internalMessage: function(type, data) {
                _postMessage({
                    event: 'onInternalMessage',
                    data: {
                        type: type,
                        data: data
                    }
                });
            },

            updateVersion: function() {
                _postMessage({ event: 'onOutdatedVersion' });
            },

            downloadAs: function(url) {
                _postMessage({
                    event: 'onDownloadAs',
                    data: url
                });
            },

            requestSaveAs: function(url, title) {
                _postMessage({
                    event: 'onRequestSaveAs',
                    data: {
                        url: url,
                        title: title
                    }
                });
            },

            collaborativeChanges: function() {
                _postMessage({event: 'onCollaborativeChanges'});
            },

            requestRename: function(title) {
                _postMessage({event: 'onRequestRename', data: title});
            },

            metaChange: function(meta) {
                _postMessage({event: 'onMetaChange', data: meta});
            },

            documentReady: function() {
                _postMessage({ event: 'onDocumentReady' });
            },

            requestClose: function() {
                _postMessage({event: 'onRequestClose'});
            },

            requestMakeActionLink: function (config) {
                _postMessage({event:'onMakeActionLink', data: config});
            },

            requestUsers:  function () {
                _postMessage({event:'onRequestUsers'});
            },

            requestSendNotify:  function (emails) {
                _postMessage({event:'onRequestSendNotify', data: emails});
            },

            requestInsertImage:  function () {
                _postMessage({event:'onRequestInsertImage'});
            },

            requestMailMergeRecipients:  function () {
                _postMessage({event:'onRequestMailMergeRecipients'});
            },

            requestCompareFile:  function () {
                _postMessage({event:'onRequestCompareFile'});
            },

            requestSharingSettings:  function () {
                _postMessage({event:'onRequestSharingSettings'});
            },

            on: function(event, handler){
                var localHandler = function(event, data){
                    handler.call(me, data)
                };

                $me.on(event, localHandler);
            }
        }

    })();
