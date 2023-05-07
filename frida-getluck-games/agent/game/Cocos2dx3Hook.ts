/**
 * 这个是 hook cocos2dx 3 版本的文本数据 由于是字符串 别太多。
 * 分段执行
 */
export namespace Cocos2dx3Hook {
    var baseUtil = `(function () {
    window.getTypeName = function (obj) {
        return Object.prototype.toString.call(obj);
    }

    window.mapToObj = function (map) {
        var tmpObj = {};
        let entries = map.entries();
        for (var item of entries) {
            tmpObj[item[0]] = item[1];
        }
        return tmpObj;
    }

    //避免循环引用
    window.jsonStringify = function (obj) {
        const seen = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]'
                }
                seen.add(value); // 将当前对象加入 Set 中
            }

            return value;
        });
    }
    window.toObjJson = function (obj, jsonStore = new Map(), record = "root", set = new Set(), maxDepth = 4) {
        if (obj === Object.prototype
            || obj === Object.prototype.constructor
            || obj === Function.prototype
            || obj === Function.prototype.constructor
            || obj === Array.prototype
            || obj === Array.prototype.constructor
            || set.has(obj)
            || (window.isWrapperProxy && window.isWrapperProxy(obj))
        ) {
            return;
        }

        set.add(obj);

        var depth = record.split(".");
        var isRoot = !depth || depth.length == 1;

        if (depth && depth.length > maxDepth) {
            return;
        }

        var thisType = window.getTypeName(obj);
        if (isRoot) {
            jsonStore.set("thisType", thisType)
        }


        var key = record;
        var v = obj;
        if (thisType == "[object Function]") {
            var funStr = "function " + v.name + "(args:" + v.length + "){ }";
            jsonStore.set(key, funStr);
        } else if (thisType == "[object Object]") {
            var propertyNames = Object.getOwnPropertyNames(obj);
            for (let propertyName of propertyNames) {
                if (obj.hasOwnProperty(propertyName)) {
                    toObjJson(obj[propertyName], jsonStore, record + "." + propertyName, set)
                }
            }
        } else if (obj == null) {
            jsonStore.set(key, "Null")
        } else {
            jsonStore.set(key, v);
        }

        //function 可能是构造函数  Object 也有可能是实例
        if (thisType == "[object Function]" || thisType == "[object Object]") {
            var prototype = Object.getPrototypeOf(obj);
            toObjJson(prototype, jsonStore, record + ".super", set)

            prototype = obj.prototype
            toObjJson(prototype, jsonStore, record + ".class", set)
        }


        if (isRoot) {
            return window.jsonStringify(window.mapToObj(jsonStore));
        }
        return;
    }
})();`;
    /**
     * 基础的 hook 支持
     * 将代理支持绑定到 window 全局对象上。
     */
    var hookContent = `var cc = cc || {};
(function () {
    console.log = console.log || log;


    window.applyBeforeHandlers = [];
    window.constructBeforeHandlers = [];
    window.getBeforeHandlers = [];

    window.applyAfterHandlers = [];
    window.constructAfterHandlers = [];
    window.getAfterHandlers = [];


    window.proxyEntry = function (type, args) {

        if (type === "apply") {
            for (let handler of window.applyBeforeHandlers) {
                handler(args);
            }
        } else if (type === "construct") {
            for (let handler of window.constructBeforeHandlers) {
                handler(args);
            }
        } else if (type === "get") {
            for (let handler of window.getBeforeHandlers) {
                handler(args);
            }
        }
    };


    window.getLeaveApplyHandler = function () {
        return [];
    }

    window.proxyLeave = function (type, args, ret) {

        if (type === "apply") {
            for (let handler of window.applyAfterHandlers) {
                ret = handler(args, ret);
            }
        } else if (type === "construct") {
            for (let handler of window.constructAfterHandlers) {
                ret = handler(args, ret);
            }
        } else if (type === "get") {
            for (let handler of window.getAfterHandlers) {
                ret = handler(args, ret);
            }
        }

        return ret;
    };

    window.proxyWrapper = function (obj) {
        //多层代理可能导致不可控的情况发生
        if (window.isWrapperProxy(obj)) {
            return obj;
        }
        var proxyObj = new Proxy(obj, {
            construct: function (target, argArray, newTarget) {
                window.proxyEntry("construct", arguments);
                var args = [null].concat(argArray);
                var tmpFun = (Function.prototype.bind.apply(target, args));
                var tmp = new tmpFun();
                try {
                    var ret = window.proxyLeave("construct", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error construct " + e.message)
                    log("[proxy log] error apply stack" + e.stack)
                }
                return tmp;
            },
            apply: function (target, thisArg, argArray) {
                window.proxyEntry("apply", arguments);
                var tmp = target.apply(thisArg, argArray);
                try {
                    var ret = window.proxyLeave("apply", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error apply " + e.message)
                    log("[proxy log] error apply stack" + e.stack)
                }
                return tmp;
            },
            get: function (target, p, receiver) {
                window.proxyEntry("get", arguments);
                var tmp = target[p];
                if (p == "_raw") {
                    //避免后续 处理器 处理
                    return tmp;
                }
                try {
                    var ret = window.proxyLeave("get", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error get " + e.message)
                    log("[proxy log] error get stack" + e.stack)
                }
                return tmp;
            }
        });
        proxyObj["_raw"] = obj;
        return proxyObj;
    };

    window.isWrapperProxy = function (obj) {
        let typeName = typeof obj;
        if (!obj || !(typeName == "function" || typeName == "object")) {
            return false;
        }
        return ("_raw" in obj) && (obj["_raw"] != obj);
    }
    window.getRawObject = function (obj) {
        if (window.isWrapperProxy(obj)) {
            return obj["_raw"];
        }
        return obj;
    }
})();`;

    var dumpRoot = `(function () {
    window.exist_dumps = new Set();
    window.dumpRoot = function () {
        let keys = Object.keys(window);
        for (let prop of keys) {
            try {
                let tmp = window[prop];
                if (!exist_dumps.has(tmp)) {
                    exist_dumps.add(tmp);
                    var root = new Map();
                    root.set("rootProp", prop);
                    var dumpJson = window.toObjJson(window[prop], root);
                    if (dumpJson != null) {
                        log("dumpRoot:" + dumpJson)
                    }
                }

            } catch (e) {
                log("[dumpError]:" + e.toString() + e.stack);
            }
        }
    }
})();`;


    /**
     * 貌似coco2dx 在加载完成之前 没办法直接执行方法 如 console.log()
     * 至于原理不得而知 可能跟 Function.prototype.bind() ??有关系？？？
     * 所以我们hook run 函数  在里面完成我们执行 hook 功能
     */
    var hookCCGameRun = `(function () {
    window.backCCGameRun = cc.game.run;
    cc.game.run = function (){
        log("cc.game.run before>>>>>>>>>>>>>>")
        window.backCCGameRun.apply(cc.game,arguments);
        cc.Class.extend = window.proxyWrapper(cc.Class.extend);
        log("cc.game.run after>>>>>>>>>>>>>>")
    }
})();`;


    var CClassExtendConstructHandler = `(function () {
    window.applyAfterHandlers.push(function (args, ret) {
        if(ret instanceof Object){
            if (ret && ("extend" in ret)) {
                var isCCClass = ret.extend === cc.Class.extend;
                if (isCCClass) {
                    //包装 ccclass 注意 这个是 extend 创建的类 只是包装类
                    ret = window.proxyWrapper(ret);
                }
            }
        }

        return ret;
    });
})();`;

    /**
     * 默认实例创建处理器
     */
    var DefaultCClassInstanceHandler = `(function () {
    //目前只有针对实例dump window 下所有 绑定对象
    //对于已经dump 过的 会忽略  如果内置被改变过 可能 不会更新
    //您可以自由修改 dumpRoot 逻辑完成 自定义dump
    window.constructAfterHandlers.push(function (args, ret) {
        window.dumpRoot();
        return ret;
    });
})();`;


    var hookContents = [baseUtil, hookContent, dumpRoot];
    var hookCCGame = [hookCCGameRun];
    var hookCCClass = [CClassExtendConstructHandler, DefaultCClassInstanceHandler];

    /**
     * 最好将 hook 内容分段 因为 hook 字符串太长可能会出问题
     */
    export function getHookContents(): string[] {
        return new JSHookBuilder()
            .hookCCGame()
            .ccClassConstructHandler()
            // .consoleLogTail()
            .proxyWindowPrototypeFunctionHandler("charManager", "createAllChar")
            .proxyWindowPrototypeFunctionHandler("tiledManager","judgeIsCheat")
            .proxyWindowPrototypeFunctionHandler("charManager","getEntity")
            .proxyWindowObjectFunctionHandler("pomelo","newRequest")
            // .proxyWindowPrototypeFunctionHandler("Antiwear","setEncryptProperty")
            .custom(`
          (function () {
    //debug getEntity 后属性增强
    window.applyAfterHandlers.push(function (args, ret) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "charManager";
        let prototypeFunName = "getEntity";
        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    if (isPrototypeFun && thisArg.hasOwnProperty("allChars")) {
                        let allChars = thisArg["allChars"];
                        // log("[proxy log] addAttributeByAll allChars:" + window.toObjJson(allChars));
                        if (allChars.length > 0) {
                            if(!window.hasOwnProperty("charManagerInstance") || window["charManagerInstance"]!==thisArg){
                                log("[proxy log] getEntity isPrototypeFun:" + isPrototypeFun);

                                //对于对一次 allChars == 0 那么进行初始化
                                //用于还原数据
                                window.cheatRestoreFuns = [];
                                //对于特殊情况的 如 baseAttribute attack 的还原
                                window.baseGetAttrHandles = [];
                                window["charManagerInstance"] = thisArg;
                                for (let allChar of allChars) {
                                    if (allChar.hasOwnProperty("cMo")) {
                                        let cMo = allChar["cMo"];
                                        // log("[proxy log] Antiwear " + (cMo instanceof window["Antiwear"]));
                                        // log("[proxy log] Antiwear setEncryptProperty:" + ("setEncryptProperty" in cMo));
                                        // log("[proxy log] Antiwear defineEncryptGetterSetter:" + ("defineEncryptGetterSetter" in cMo));
                                        let lastAttr = cMo["lastAttr"];
                                        let baseAttr = cMo["baseAttr"];
                                        cMo["baseAttr"] = window.proxyWrapper(baseAttr);

                                        let hpNow = cMo.getEncryptProperty("hpNow");
                                        let mpNow = cMo.getEncryptProperty("mpNow");
                                        let hpMax = lastAttr.getEncryptProperty("hpMax");
                                        let mpMax = lastAttr.getEncryptProperty("mpMax");
                                        let attack = lastAttr.getEncryptProperty("attack");
                                        let reHP = lastAttr.getEncryptProperty("reHP");
                                        let reMP = lastAttr.getEncryptProperty("reMP");

                                        log("[proxy log] hpMax:" + hpMax)
                                        log("[proxy log] mpMax:" + mpMax)
                                        log("[proxy log] hpNow:" + hpNow)
                                        log("[proxy log] mpNow:" + mpNow)
                                        log("[proxy log] attack:" + attack)
                                        log("[proxy log] reHP:" + reHP)
                                        log("[proxy log] reMP:" + reMP)

                                        let multiple = 20;
                                        let expand = 20;

                                        cMo.setEncryptProperty("hpNow", hpNow * multiple);
                                        cMo.setEncryptProperty("mpNow", mpNow * multiple);

                                        baseAttr.setEncryptProperty("attack", attack * expand);

                                        lastAttr.setEncryptProperty("hpMax", hpMax * multiple);
                                        lastAttr.setEncryptProperty("mpMax", mpMax * multiple);
                                        // lastAttr.setEncryptProperty("reHP", reHP * multiple + 100);
                                        // lastAttr.setEncryptProperty("reMP", reMP * multiple + 100);

                                        let cheatRestoreFun = function () {
                                            cMo.setEncryptProperty("hpNow", hpNow);
                                            cMo.setEncryptProperty("mpNow", mpNow);

                                            baseAttr.setEncryptProperty("attack", attack);

                                            lastAttr.setEncryptProperty("hpMax", hpMax);
                                            lastAttr.setEncryptProperty("mpMax", mpMax);
                                            lastAttr.setEncryptProperty("reHP", reHP);
                                            lastAttr.setEncryptProperty("reMP", reMP);
                                            log("[proxy log] hpMax restore:" + hpMax)
                                            log("[proxy log] mpMax restore:" + mpMax)
                                            log("[proxy log] hpNow restore:" + hpNow)
                                            log("[proxy log] mpNow restore:" + mpNow)
                                            log("[proxy log] attack restore:" + attack)
                                            log("[proxy log] reHP restore:" + reHP)
                                            log("[proxy log] reMP restore:" + reMP)
                                        };
                                        // window.setTimeout(cheatRestoreFun, 10000);
                                        //这个用于在 isCheat 中 还原
                                        window.cheatRestoreFuns.push(cheatRestoreFun);
                                        //这个在 tiledManager.prototype.judgeGameOver 中还原
                                        window.baseGetAttrHandles.push(function (target, p, receiver) {
                                            let baseAttr1 = baseAttr === target;

                                            if (baseAttr1) {
                                                let locationStack = new Error().stack;
                                                if (locationStack.indexOf("judgeGameOver") != -1) {
                                                    log("[proxy log] judgeGameOver baseAttr1:" + baseAttr1);
                                                    log("[proxy log] judgeGameOver baseAttr property:" + p);
                                                    log("[proxy log] judgeGameOver baseAttr stack" + locationStack);
                                                    if (p === "attack") {
                                                        baseAttr.setEncryptProperty("attack", attack);
                                                    }
                                                }
                                            }
                                        });
                                        // cMo.baseAttr.setEncryptProperty("attack",9999);
                                        // log("[proxy log] find cMo" + window.toObjJson(cMo));

                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }
        return ret;
    });
})();
            `)
            .custom(`(function () {
    //debug
    window.getBeforeHandlers.push(function (args) {
        let target = args[0];
        let p = args[1];
        let receiver = args[2];

        if (window.baseGetAttrHandles && window.baseGetAttrHandles.length > 0) {
            for (let baseGetAttrHandle of window.baseGetAttrHandles) {
                baseGetAttrHandle.call(null,target,p,receiver);
            }
        }
    });
})();`)
            .custom(`(function () {
    //debug
    window.applyAfterHandlers.push(function (args, ret) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "tiledManager";
        let prototypeFunName = "judgeIsCheat";

        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    log("[proxy log]  tiledManager " + prototypeFunName + ":" + isPrototypeFun)
                    if (isPrototypeFun) {
                        log("[proxy log]  tiledManager " + prototypeFunName + " ret:" + ret);
                        return false;
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }

        return ret;
    });
})();`)
            //anit_cheat
            .custom(`(function () {
    //debug
    window.applyBeforeHandlers.push(function (args) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "tiledManager";
        let prototypeFunName = "judgeIsCheat";

        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    log("[proxy log]  tiledManager before: " + prototypeFunName + ":" + isPrototypeFun)
                    if (isPrototypeFun) {
                        if (window.cheatRestoreFuns && window.cheatRestoreFuns.length > 0) {
                            for (let cheatRestoreFun of window.cheatRestoreFuns) {
                                cheatRestoreFun.call();
                            }
                        }
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }

    });
})();`)

            // .logProxyApplyHandler()
            // .proxyWindowClassHandler("entityManager")
            // .proxyWindowClassHandler("characterEntity")
            // .logProxyConstructHandler()
            // .logProxyGetHandler("entityManager")
            // .dumpHandler()
            .getHooks();
    }

    export class JSHookBuilder {
        hooks: string[] = [];

        constructor() {
            this.hooks = this.hooks.concat(hookContents)
        }

        /**
         * hook cc.game.run
         * 并代理所有 ccClass
         * 后续我们将通过 proxyHandler完成我们功能的注入。
         */
        hookCCGame(): JSHookBuilder {
            this.hooks = this.hooks.concat(hookCCGame)
            return this;
        }

        /**
         * hookCCGame 只是代理 ccClass
         * 而这个 handler 将会代理所有通过 construct 构造器创建的实例
         */
        ccClassConstructHandler() {
            this.hooks = this.hooks.concat(CClassExtendConstructHandler)
            return this;
        }

        consoleLogTail() {
            let script = `(function () {
                            window.applyAfterHandlers.push(function (args, ret) {
                                if (!window.hasOwnProperty("backConsoleLog")) {
                                    window.backConsoleLog = console.log || cc.log;
                                    console.log = function () {
                                        window.backConsoleLog.apply(null, arguments);
                                        log("[console tail]" + new Error().stack);
                                    }
                                    cc.log = console.log;
                                }
                                return ret;
                            });
                        })();`;
            this.hooks.push(script);
            return this;
        }

        /**
         * 这个需要先调用 ccClassConstructHandler 才能完成实例的dump
         */
        dumpHandler() {
            this.hooks = this.hooks.concat(DefaultCClassInstanceHandler)
            return this;
        }

        proxyObjectCreateHandler() {
            let script: string = `
            (function(){
               window.constructAfterHandlers.push(function (args, ret) {
                    //这个判断 可以检测到 原型链中
                    if (!window.isWrapperProxy(Object.create)) {
                        Object.create = window.proxyWrapper(Object.create);
                        log("[proxy log] proxyWrapper >>>>>>>>>>>Object.create")
                    }
                    return ret;
                });
            })();
            `
            this.hooks.push(script)
            return this;
        }

        proxyObjectCreateWindowClassHandler(windowProp: string) {
            let script: string = `
            (function(){
                    window.applyAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let thisArg = args[1];
                        let argArray = args[2];
                        //Object.create
                        if (window.getRawObject(target) == window.getRawObject(Object.create)) {
                            log("[proxy log] proxy obj for 2222222222:");
                            let proxyClass = "${windowProp}";
                            let prototype = argArray[0];
                            if ((proxyClass in window)) {
                               log("[proxy log] proxy obj for 》》》》》》》》》:");
                            }
                        }
                        return ret;
                    });
            })();
            `
            this.hooks.push(script)
            return this;
        }

        proxyWindowClassHandler(windowProp: string) {
            let script: string = `
            (function(){
                window.constructAfterHandlers.push(function (args, ret) {
                    let proxyClass = "${windowProp}";
                    //这个判断 可以检测到 原型链中
                    if (proxyClass in window) {
                        if (!window.isWrapperProxy(window[proxyClass])) {
                            log("[proxy log]proxy class>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:" + proxyClass);
                            let _raw = window[proxyClass];
                            window[proxyClass] = window.proxyWrapper(_raw);
                        }
                    }
                    return ret;
                });
            })();
            `
            this.hooks.push(script)
            return this;
        }

        proxyWindowObjectFunctionHandler(windowProp: string, propertyFunName: string) {
            let script: string = `(function () {
    window.constructAfterHandlers.push(function (args, ret) {
        let proxyClass = "${windowProp}";
        let propertyFunName = "${propertyFunName}";
        try {
            if (proxyClass in window) {
                if (window[proxyClass] != null) {
                    if (propertyFunName in (window[proxyClass])) {
                        let propertyFun = window[proxyClass][propertyFunName];
                        if (!window.isWrapperProxy(propertyFun)) {
                            log("[proxy log] proxy object fun: " + proxyClass + " function " + propertyFunName + "()")
                            window[proxyClass][propertyFunName] = window.proxyWrapper(propertyFun);
                        }
                    }
                }
            }
        } catch (e) {
            log("[proxy log] ${windowProp}  ${propertyFunName} error " + e.message)
            log("[proxy log] ${windowProp} ${propertyFunName} error stack" + e.stack)
        }
        return ret;
    });
})();`
            this.hooks.push(script)
            return this;
        }

        proxyWindowPrototypeFunctionHandler(windowProp: string, prototypeFun: string) {
            let script: string = `(function () {
    window.constructAfterHandlers.push(function (args, ret) {
        let proxyClass = "${windowProp}";
        let prototypeFun = "${prototypeFun}";
        try {
            if (proxyClass in window) {
                if (window[proxyClass] != null) {
                    if (prototypeFun in (window[proxyClass].prototype)) {
                        let prototypeObj = window[proxyClass].prototype;
                        if (!window.isWrapperProxy(prototypeObj[prototypeFun])) {
                            log("[proxy log] proxy prototype: " + proxyClass + " function " + prototypeFun + "()")
                            prototypeObj[prototypeFun] = window.proxyWrapper(prototypeObj[prototypeFun]);
                        }
                    }
                }
            }
        } catch (e) {
            log("[proxy log] ${windowProp}  ${prototypeFun} error " + e.message)
            log("[proxy log] ${windowProp} ${prototypeFun} error stack" + e.stack)
        }
        return ret;
    });
})();
            `
            this.hooks.push(script)
            return this;
        }

        /**
         * 代理被 代理对象的所有方法 当代理对象调用 get 获取方法时候 会自动添加代理 需先调用 @windowHandler
         * 随后您可以添加自定义 applyAfterHandler 完成您的步骤
         */
        proxyFunctionHandler() {
            let script: string = `
                (function(){
                    window.getAfterHandlers.push(function (args, ret) {
                        if (Object.prototype.toString.call(ret) === "[object Function]") {
                            return window.proxyWrapper(ret);
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script)
            return this;
        }

        logProxyGetHandler(windowClassName = "") {
            let script: string = `
                (function(){
                    window.getAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let p = args[1];
                        let receiver = args[2];
                
                        let windowProxyName = "${windowClassName}";
                        if (!windowProxyName || (windowProxyName in window
                            && (window.getRawObject(window[windowProxyName]) === window.getRawObject(target)))) {
                            try {
                                log("[proxy log] get target:" + window.toObjJson(window.getRawObject(target)));
                                log("[proxy log] get p:" + p.toString());
                                log("[proxy log] get stack:" + new Error().stack)
                            } catch (e) {
                                log("error:" + e.toString())
                            }
                        }
                
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script)
            return this;
        }

        logProxyApplyHandler(windowClassName = "") {
            let script: string = `
                (function(){
                    window.applyAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let thisArg = args[1];
                        let argArray = args[2];
                
                        try {
                            log("[proxy log] apply:"
                                + window.toObjJson(window.getRawObject(target)));
                            log("[proxy log] apply ret:"
                                + window.toObjJson(window.getRawObject(ret)));    
                            log("[proxy log] apply this:"
                                + window.toObjJson(window.getRawObject(thisArg)));
                            log("[proxy log] apply stack:"
                                + new Error().stack);    
                        } catch (e) {
                            log("[proxy log] apply error:" + e.message)
                            log("[proxy log] apply error:" + e.stack)
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script)
            return this;
        }

        logProxyConstructHandler(windowClassName = "") {
            let script: string = `
                (function(){
                     window.constructAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let argArray = args[1];
                        let newTarget = args[2];
                        
                         try {
                            log("[proxy log] construct ret:"
                                + window.toObjJson(window.getRawObject(ret)));    
                        } catch (e) {
                            log("[proxy log] construct error target:"
                                + window.toObjJson(window.getRawObject(target)));
                            log("[proxy log] construct error:" + e.message)
                            log("[proxy log] construct error:" + e.stack)
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script)
            return this;
        }

        custom(...js: string[]) {
            this.hooks.push(...js);
            return this;
        }

        getHooks(): string[] {
            return this.hooks;
        }
    }
}
