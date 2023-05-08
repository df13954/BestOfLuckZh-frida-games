import "frida-il2cpp-bridge"
import {libcocos2SoName, UnityLua} from "./game/UnityLua";
import {DebugUtil} from "./game/util/DebugUtil";
import whenSoOpen = DebugUtil.whenSoOpen;
import {CocosCreatorJS} from "./game/CocosCreatorJS";
import {Cocos2dxjs} from "./game/Cocos2dxjs";
import {FridaAnti} from "./anti/FridaAnti";
import {WebViewHook} from "./android/https/WebViewHook";


function main() {
    // lua 功能 需要注释就解除
    // UnityLua.start()

    // dump so
    // whenSoOpen((path) => {
    //     if (path.indexOf("") != -1) {
    //         console.log("path:" + path);
    //         let module: Module = Process.findModuleByName(libcocos2SoName)!;
    //         // libcocosInit(module);
    //     }
    // })

    FridaAnti.start();
    // CocosCreatorJS.start()
    // Cocos2dxjs.start();
    // WebViewHook.start();
}

/**
 * 在 Frida 的 JavaScript 线程上调用的计划 func
 */
setImmediate(() => {
    main()
})

declare global {
    var start_hook_cocos2dxjs: () => void

    var setWebContentsDebuggingEnabledInvoke: () => void
}

globalThis.start_hook_cocos2dxjs = Cocos2dxjs.start_hook_cocos2dxjs_for_javabridge;
globalThis.setWebContentsDebuggingEnabledInvoke = WebViewHook.setWebContentsDebuggingEnabledInvoke;