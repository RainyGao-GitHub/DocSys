/**
 * Created by Cheney on 2016/4/27.
 */
!(function (name, definition) {

    this[name] = definition();

})('eb4js', function (param) {

    function debug(msg){
        console.log(msg);
        /*
        console.log("<[eb-debug]-------")

        console.log("------->")*/
    }

    function info(msg){
        console.log("[eb-info]" + msg)
    }

    /**
     * 如果函数的第一个形参
     * 那么就认为它是一个异步的监听函数
     * @param str
     */
    function isAsyncCallback(cbFunc){
        if( !cbFunc ){ throw "非法的回调函数"}
        var funcStr = cbFunc.toString();
        if( /^function\s+\w*\(\s*\)/.test(funcStr) ){
            return false;
        }else{
            return true;
        }
    }

    /**
     * 判断是否是数组
     * @param o
     */
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    function isFunc(func){
        return typeof func == 'function';
    }

    function getSerialNo(){
        var random = "" + Math.random();
        random.slice(2);
        var date = new Date();
        return "" + date.getTime() + random;
    }
    /**
     * 事件总线
     */
    var Bus = function(name,debug) {

        this.name = name;

        this.debug = debug;

        this.nextEvents = {};
        // 同步事件响应
        this.syncEventMap = {};
        // 异步事件响应
        this.asyncEventMap = {};

        this.remoteServerMap = {};

        this.ajaxMap = {};
    };

    Bus.prototype.fire = function(serverName,eventParams,params){
        if( !serverName ){serverName = Bus.defaultRemoteServer}
        this.remoteServerMap[serverName].fire(eventParams,params);
    }

// 给事件添加响应函数
    Bus.prototype.__addEventHandler = function (eventMap,eventName,callback) {
        if( eventMap[eventName] ){
            eventMap[eventName].push(callback);
        } else {
            eventMap[eventName] = [callback];
        }
    }
    Bus.prototype._addEventHandler = function (eventName,callback) {
        if( isAsyncCallback(callback) ){
            return this.__addEventHandler(this.asyncEventMap,eventName,callback);
        }else{
            return this.__addEventHandler(this.syncEventMap,eventName,callback);
        }
    }
    Bus.prototype.addEventHandler = function (eventName,stage,callback) {
        if( isArray( eventName ) ){
            for( var i in eventName){
                this.addEventHandler(eventName[i],stage,callback);
            }
            return;
        }

        if( eventName.length <1 ){
            this.error("不允许响应空的事件");
            return;
        }
        else{
            eventName += "#" + stage
        }
        if( isAsyncCallback(callback) ){
            return this.__addEventHandler(this.asyncEventMap,eventName,callback);
        }else{
            return this.__addEventHandler(this.syncEventMap,eventName,callback);
        }
    }



    // 创建新事件
    Bus.prototype.createEvent = function(eventName,args){
        var newEvent = {name : eventName,args : args};
        if( this.syncEventMap[eventName] ){
            newEvent.syncEventList  = [];
            for(var i in this.syncEventMap[eventName] ){
                newEvent.syncEventList[i] = {
                    cb : this.syncEventMap[eventName][i],
                    ret : 0
                }
            }
        }
        if( this.asyncEventMap[eventName] ){
            newEvent.asyncEventList  = [];
            for(var i in this.asyncEventMap[eventName] ){
                newEvent.asyncEventList[i] = {
                    cb : this.asyncEventMap[eventName][i],
                    ret : 0
                }
            }
        }
        return newEvent;
    }

    // 关联下一个事件
    Bus.prototype.next = function (eventName1,eventName2) {
        if( !this.nextEvents[eventName1]){
            this.nextEvents[eventName1] = [];
        }
        if(isArray(eventName2) ){
            this.nextEvents[eventName1] = this.nextEvents[eventName1].concat(eventName2);
        }else{
            this.nextEvents[eventName1].push(eventName2);
        }
    }

    // 触发事件
    Bus.prototype.trigger = function (eventName) {
        var args = Array.prototype.slice.call(arguments);
        var bus = this;
        var newEvent = this.createEvent(eventName,args);
        args[0] = newEvent;

        this.debug && debug(eventName);

        if( newEvent.asyncEventList ){
            var asyncArgs = args.slice(0);
            // asyncArgs.splice(0,0,{});
            // 存在异步响应函数
            for( var i in newEvent.asyncEventList ){

                asyncArgs[0] = {
                    event : newEvent,
                    done : (function(n){
                        return function(){
                            newEvent.asyncEventList[n].ret +=1;
                            bus.complete(newEvent)
                        }
                    })(i),
                    error : function(){
                        bus.trigger(newEvent.replace(/#\w+/,"#error"))
                    }
                };

                newEvent.asyncEventList[i].cb.apply(this,asyncArgs);
            }
        }
        if( newEvent.syncEventList ){
            // 存在同步响应
            for( var i in newEvent.syncEventList ){
                try{
                    newEvent.syncEventList[i].cb.apply(this,args)
                }catch(e){
                    if( eventName == "eventbus#error" ){
                        // 什么都不做
                    }
                    if( eventName.endsWith("#error") ){
                        // 触发总线的错误
                        this.trigger("eventbus#error",eventName)
                    } else {
                        this.trigger(eventName.replace(/#\w+/,"#error"))
                    }

                }
                newEvent.syncEventList[i].ret +=1;
            }
            // 同步响应统一检测结束
        }
        this.complete(newEvent)
    }

    // 触发下一个事件 采用不同的方式
    Bus.prototype.triggerNext = function(eventName){
        if( this.nextEvents[eventName] ){
            for(var i in this.nextEvents[eventName]){
                this.trigger(this.nextEvents[eventName][i] + "#before")
            }
        }
    }

    // 触发错误事件
    Bus.prototype.error = function(msg){
        this.trigger("eventbus#error","[bus:" + this.name + "]" + msg);
    }

// 结束事件响应
// 检测是否所有事件都已经响应完成
// 自动触发下一个阶段
    Bus.prototype.complete = function (event) {
        if( event.asyncEventList ){
            // 存在异步响应函数
            for( var i in event.asyncEventList ){
                if( event.asyncEventList[i].ret == 0){
                    // 响应未完成
                    return;
                }
            }
        }
        if( event.syncEventList ){
            // 存在同步响应函数
            for( var i in this.syncEventList ){
                if( this.syncEventList[i].ret == 0){
                    // 响应未完成
                    return;
                }
            }
        }

        var eventName = event.name;
        var args = event.args;


        // 该阶段已完成
        // 检测是否有下个阶段
        if( eventName.endsWith("#before")){
            args[0] = eventName.replace("#before","#on");
            this.trigger.apply(this,args);
        }
        else if( eventName.endsWith("#on")){
            args[0] = eventName.replace("#on","#after")
            this.trigger.apply(this,args);
        }
        else if( eventName.endsWith("#after")){
            this.triggerNext(eventName.replace("#after",""))
        }
    }

    var busMap = {};

    var eb4js = function(name,debug){
        if( ! name ){ name = 'default' }
        if( ! busMap[name] ){
            busMap[name] = new Bus(name,debug);
            var bus = busMap[name];
            bus.addEventHandler("eventbus.init", "before",function(){
                // 初始化 websocket 接口
                for( var i in Bus.remoteServer){
                    bus.remoteServerMap[i] = Server(bus,Bus.remoteServer[i]);
                }
            });
            bus.addEventHandler("eventbus.ajax","on",function(){
                var event = arguments[0];
                var serialNo = arguments[1].serialNo;
                var cb = bus.ajaxMap[serialNo];

                cb.cbok && cb.cbok.apply(this,[arguments[1]])

                delete bus.ajaxMap[serialNo];
            });
            bus.addEventHandler("eventbus.ajax","error",function(){
                var event = arguments[0];
                var serialNo = arguments[1].serialNo;
                var cb = bus.ajaxMap[serialNo];

                cb.cberr && cb.cberr.apply(this,[arguments[1]])

                delete bus.ajaxMap[serialNo];
            });

            bus.addEventHandler("eventbus.localstorage.save","on",function(){
                var kvmap = arguments[1];
                for( var key in kvmap ){
                    localStorage.setItem(key,kvmap[key]);
                }
            });
        }

        // 页面载入完成
        window.onload = function(){
            // 启动所有总线 关闭事件注册
            Bus.prototype.addEventHandler = function(){
                console.error("不允许动态添加事件");
            }

            for( var name in busMap ){

                var bus = busMap[name];
                bus.trigger.apply(bus,["eventbus.init#before"]);
                console.log("开启:Bus[" + name + "]");
            }
        }

        // 返回 bus 的包装类
        return {
            __bus : busMap[name],

            // 注册事件
            before : function(eventName,callback){
                if( arguments.length ==1 ){
                    callback = eventName;
                    eventName = "eventbus";
                }
                this.__bus.addEventHandler(eventName , "before",callback);
                return this;
            },
            after : function(eventName,callback){
                if( arguments.length ==1 ){
                    callback = eventName;
                    eventName = "eventbus";
                }
                this.__bus.addEventHandler(eventName , "after",callback);
                return this;
            },
            on : function(eventName,callback){
                if( arguments.length ==1 ){
                    callback = eventName;
                    eventName = "eventbus";
                }
                this.__bus.addEventHandler(eventName , "on", callback);
                return this;
            },
            error : function(eventName,callback) {
                if( arguments.length ==1 ){
                    callback = eventName;
                    eventName = "eventbus";
                }
                this.__bus.addEventHandler(eventName , "error", callback);
                return this;
            },

            // 触发事件
            trigger : function(eventName){
                var args = Array.prototype.slice.call(arguments);
                args[0] = eventName + "#before";
                this.__bus.trigger.apply(this.__bus,args);
                return this;
            },

            // 关联下一个事件或多个事件
            next : function(eventName1,eventName2){
                var e1IsA = isArray(eventName1);
                var e2IsA = isArray(eventName2);
                if( e1IsA && e2IsA ){
                    this.__bus.error("next() 不支持 多-多 事件关联,收到[" + eventName1.toString() + "][" + eventName2.toString() + "]");
                    return;
                }
                if( e1IsA ){
                    for( var i in eventName1 ){
                        this.__bus.next(eventName1[i],eventName2);
                    }
                }else if( e2IsA ){
                    for( var i in eventName2 ){
                        this.__bus.next(eventName1,eventName2[i]);
                    }
                }else{
                    this.__bus.next(eventName1,eventName2);
                }
                return this;
            },

            flow : function(){
                var len = arguments.length;
                if( len > 2){
                    for( var i=1 ; i<len ; i++){
                        this.next( arguments[i-1], arguments[i] );
                    }
                }else{
                    this.__bus.error("flow() 至少需要两个元素");
                    return;
                }
                return this;
            }
        }
    };
    return eb4js;
});

