import "frida-il2cpp-bridge"
import {libcocos2SoName, UnityLua} from "./game/UnityLua";
import {DebugUtil} from "./game/util/DebugUtil";
import whenSoOpen = DebugUtil.whenSoOpen;
import {CocosCreatorJS} from "./game/CocosCreatorJS";
import {Cocos2dxjs} from "./game/Cocos2dxjs";


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

    CocosCreatorJS.start()
    // Cocos2dxjs.start();
}

/**
 * 在 Frida 的 JavaScript 线程上调用的计划 func
 */
setImmediate(() => {
    main()
})

declare global {
    var start_hook_cocos2dxjs: () => void
}

globalThis.start_hook_cocos2dxjs = Cocos2dxjs.start_hook_cocos2dxjs_for_javabridge;