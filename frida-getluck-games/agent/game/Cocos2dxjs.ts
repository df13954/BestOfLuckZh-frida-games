import {DebugUtil} from "./util/DebugUtil";
import {Cocos2dx3Hook} from "./Cocos2dx3Hook";
import {CommonUtil} from "../android/CommonUtil";

export const soName: string = "libcocos2djs.so"


/**
 *  @Author GetLuck
 *  由于 cocos2dx js 使用的是 spidermonkey 这种方式过于麻烦
 *  因为储存的是字节码 而字节码目前市面上没有反编译出源码的。
 *  这种只能通过 windows.xxx 对象进行修改。
 *  或者使用 gg修改器
 */
export namespace Cocos2dxjs {
    // 拦截 dlopen 函数 ,
    import LOGE = DebugUtil.LOGE;
    import LogColor = DebugUtil.LogColor;

    var libcocos2djsModule: Module;
    const bridgeAndroidLog = false;

    export function start() {
        if (bridgeAndroidLog) {
            console.error = (message) => {
                CommonUtil.loge("frida", message);
            }
            DebugUtil.LOG = (str: any, type: LogColor = LogColor.WHITE) => {
                CommonUtil.logd("frida", str);
            }
            console.log =  (message) => {
                CommonUtil.logd("frida", message);
            }
        }
        console.log("start Cocos2dxjs!");
        DebugUtil.whenSoOpen((path) => {
            if (path.includes(soName)) {
                console.error(path)
                _run();
            }
        });
        // hook_Java_jsb_evalString();
        //cc._initDebugSetting
        // _run();
    }

    function _run() {
        get_libcocos2djsModule();
        hook_js_log();
        // hookScriptingCoreStart();
        hook_ScriptingCore_runScript();
        hook_requireScript();
        //invoke_Java_jsb_evalString("cc.log(Object.keys(window.characterEntity.baseEntity.prototype))");
    }

    function get_libcocos2djsModule(): Module {
        if (!libcocos2djsModule) {
            libcocos2djsModule = Process.findModuleByName(soName)!;
        }
        return libcocos2djsModule;
    }

    export function start_hook_cocos2dxjs_for_javabridge() {
        Java.perform(() => {
            let hookContents = Cocos2dx3Hook.getHookContents();
            hookContents.forEach(script => {
                let evalRet = call_Cocos2dxJavascriptJavaBridge_evalString(script);
                DebugUtil.LOGE("evalRet:" + evalRet);
            })
        })
    }

    export function start_hook_cocos2dxjs() {
        let hookContents = Cocos2dx3Hook.getHookContents();
        hookContents.forEach(script => {
            let evalRet = call_ScriptingCore_evalString(script);
            DebugUtil.LOGW("-----------------------------evalRet:" + evalRet);
        })
    }

    /**
     * 获取 COCOS2DX-3 中 spidermonkey 引擎 核心类 实例
     */
    function getScriptingCoreInstance(): NativePointer {
        let ScriptingCoreInstancePtr: NativePointer = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore11getInstanceEv")!;
        let ScriptingCoreInstanceFun: NativeFunction<any, any> = new NativeFunction(ScriptingCoreInstancePtr, "pointer", []);
        return ScriptingCoreInstanceFun();
    }


    /**
     * 由于 spidermonkey js 虚拟机 注入了 log实现
     * cocos2dx log 会转发到 各个平台控制台(android ios...)
     * 但是在发布的时候会屏蔽 我们可以hook 实现 log 完成 log的拦截输出 帮助我们调试
     */
    export function hook_js_log() {
        //js_log
        let module: Module = libcocos2djsModule;
        let js_log: NativePointer = module.findExportByName("_Z6js_logPKcz")!;
        console.log("js_log_pointer:" + js_log);
        Interceptor.attach(js_log, {
            onEnter: function (args) {
                let log_info = args[1];
                let log_str = log_info.readCString();
                //对于 dump 信息 发送给 python 处理
                const dump_prefix = "dumpRoot:";
                const proxy_prefix = "[proxy log]"
                const console_tail = "[console tail]";
                if (log_str?.startsWith(dump_prefix)) {
                    let dump_log = log_str?.substring(dump_prefix.length)
                    let rpc_msg = {
                        "type": "dump",
                        "dump_log": dump_log
                    };
                    send(rpc_msg);
                } else if (log_str?.startsWith(proxy_prefix)) {
                    DebugUtil.LOGD(log_str);
                } else if (log_str?.startsWith(console_tail)) {
                    DebugUtil.LOGG(log_str);
                } else {
                    console.log("js log:" + log_str);
                }
                //按道理 console.log(111,222) 可以多个参数 可我读不出来。。。
                // console.log("js 2:" + args[2].readCString())
            }
        })
    }

    function call_ScriptingCore_evalString(content: string, scriptingCoreInstance?: any) {
        let ScriptingCore_evalString_ptr: NativePointer = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore10evalStringEPKc")!;
        let ScriptingCore_evalString_fun = new NativeFunction(ScriptingCore_evalString_ptr, "bool", ["pointer", "pointer"]);
        //补空
        scriptingCoreInstance = scriptingCoreInstance || getScriptingCoreInstance();
        const contentPointer = Memory.allocUtf8String(content);
        let ret = ScriptingCore_evalString_fun(scriptingCoreInstance, contentPointer);
        return ret;
    }

    function call_Cocos2dxJavascriptJavaBridge_evalString(content: string) {
        let Cocos2dxJavascriptJavaBridge_evalString_ptr: NativePointer = get_libcocos2djsModule().findExportByName("Java_org_cocos2dx_lib_Cocos2dxJavascriptJavaBridge_evalString")!;
        let Cocos2dxJavascriptJavaBridge_evalString_fun = new NativeFunction(Cocos2dxJavascriptJavaBridge_evalString_ptr, "int", ["pointer", "pointer", "pointer"]);
        let env = Java.vm.getEnv();

        let jniString = env.newStringUtf(content);
        return Cocos2dxJavascriptJavaBridge_evalString_fun(env, ptr(0), jniString);
    }

    /**
     * 用于协助我们 hook过程
     * 大概流程:
     * script/jsb_prepare.js
     * script/jsb_boot.js
     * main.js
     *
     * 我们应该在 script/jsb_prepare.js 之后 做出hook选择
     * @private
     */
    function hook_ScriptingCore_runScript() {
        let ScriptingCore_runScript_ptr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore9runScriptERKSs")!;

        Interceptor.attach(ScriptingCore_runScript_ptr, {
            onEnter: function (args) {
                // 参数0 是this  所以用 参数 1
                //但是参数1 是 char **a2 也就是 std::string 我们获取 需要在读有一个指针
                this.path = args[1].readPointer().readCString();
                if (this.path == "main.js") {
                    start_hook_cocos2dxjs();
                }
                console.log("ScriptingCore_runScript_ptr:", this.path);
            },
            onLeave: function () {
                //在 main.js 加载之后 完成我们注入
                // if (this.path == "main.js") {
                //     start_hook_cocos2dxjs();
                // }
            }
        })
    }

    function hookScriptingCoreStart() {
        let ScriptingCoreStart_ptr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore5startEv")!;
        let ScriptingCoreStart_fun = new NativeFunction(ScriptingCoreStart_ptr, "int", ["pointer"]);

        let ScriptingCoreStart_Callback = new NativeCallback(function (_this) {
            let ret = ScriptingCoreStart_fun(_this);
            console.log("ScriptingCoreStart_Callback after");
            return ret;
        }, "int", ["pointer"]);
        Interceptor.replace(ScriptingCoreStart_ptr, ScriptingCoreStart_Callback);
    }

    /**
     * bool ScriptingCore::requireScript(const char *path, JS::HandleObject global, JSContext* cx, JS::MutableHandleValue jsvalRet)
     * @private
     */
    function hook_requireScript() {
        let requireScript_ptr: NativePointer = get_libcocos2djsModule()
            .findExportByName("_ZN13ScriptingCore13requireScriptEPKcN2JS6HandleIP8JSObjectEEP9JSContextNS2_13MutableHandleINS2_5ValueEEE")!;

        let requireScript_fun = new NativeFunction(requireScript_ptr, "bool", ["pointer", "pointer", "pointer", "pointer", "pointer"]);

        Interceptor.attach(requireScript_fun, {
            onEnter: function (args) {
                this.path = args[1].readCString();

            },
            onLeave: function () {
                LOGE("hook_requireScript:" + this.path);
                // if (this.path == "src/app.js") {
                //     start_hook_cocos2dxjs();
                // }
            }
        });

    }

}

