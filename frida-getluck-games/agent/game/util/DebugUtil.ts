import {libcocos2SoName, libtoluaSoName, libxluaSoName} from "../UnityLua";

/**
 * 用于辅助调试的工具
 * 如 dump so  打印栈位置等
 * reference for https://github.com/axhlzy/Il2CppHookScripts.git
 */
export namespace DebugUtil {

    /**
     * ----------------------------------------------------------------------log
     */
    export const logL = console.log

    export enum LogColor {
        WHITE = 0, RED = 1, YELLOW = 3,
        C31 = 31, C32 = 32, C33 = 33, C34 = 34, C35 = 35, C36 = 36,
        C41 = 41, C42 = 42, C43 = 43, C44 = 44, C45 = 45, C46 = 46,
        C90 = 90, C91 = 91, C92 = 92, C93 = 93, C94 = 94, C95 = 95, C96 = 96, C97 = 97,
        C100 = 100, C101 = 101, C102 = 102, C103 = 103, C104 = 104, C105 = 105, C106 = 106, C107 = 107
    }

    let linesMap = new Map()
    export const getLine = (length: number, fillStr: string = "-") => {
        if (length == 0) return ""
        let key = length + "|" + fillStr
        if (linesMap.get(key) != null) return linesMap.get(key)
        for (var index = 0, tmpRet = ""; index < length; index++) tmpRet += fillStr
        linesMap.set(key, tmpRet)
        return tmpRet
    }

    export var LOG = (str: any, type: LogColor = LogColor.WHITE): void => {
        switch (type) {
            case LogColor.WHITE:
                logL(str);
                break
            case LogColor.RED:
                console.error(str);
                break
            case LogColor.YELLOW:
                console.warn(str);
                break
            default:
                logL("\x1b[" + type + "m" + str + "\x1b[0m");
                break
        }
    }

    export const LOGW = (msg: any): void => LOG(msg, LogColor.YELLOW)
    export const LOGE = (msg: any): void => LOG(msg, LogColor.RED)
    export const LOGG = (msg: any): void => LOG(msg, LogColor.C32)
    export const LOGD = (msg: any): void => LOG(msg, LogColor.C36)
    export const LOGO = (msg: any): void => LOG(msg, LogColor.C33)
    export const LOGM = (msg: any): void => LOG(msg, LogColor.C92)
    export const LOGH = (msg: any): void => LOG(msg, LogColor.C96)
    export const LOGZ = (msg: any): void => LOG(msg, LogColor.C90)


    /**
     * ----------------------------------------------------------------------StackTrace
     */

        // 打印java堆栈
    export const PrintStackTrace = () => LOG(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()), LogColor.C36)

    // 打印native堆栈
    export const PrintStackTraceN = (ctx: CpuContext, retText: boolean = false, slice: number = 24, reverse: boolean = false): string | void => {
        let tmpText: string = ""
        if (reverse) {
            tmpText = Thread.backtrace(ctx, Backtracer.ACCURATE)
                .slice(0, slice)
                .reverse()
                .map(DebugSymbol.fromAddress).join("\n")
        } else {
            tmpText = Thread.backtrace(ctx, Backtracer.ACCURATE)
                .slice(0, slice)
                .map(DebugSymbol.fromAddress).join("\n")
        }
        return !retText ? LOGD(tmpText) : tmpText
    }

    export var GetStackTrace = () => Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new())

    export var GetStackTraceN = (ctx: CpuContext, level: number = 12) => {
        return Thread.backtrace(ctx, Backtracer.ACCURATE)
            .slice(0, level)
            // .reverse()
            .map(frame => DebugSymbol.fromAddress(frame))
            // .map(symbol => `${getLine(level==undefined?0:level,"\n")}${symbol}\n`)
            .join("\n")
    }

    /**
     * ----------------------------------------------------------------------when_so_load
     */

    export function whenSoOpen(performer: (path: string) => void) {

        const VERSION = Java.use('android.os.Build$VERSION');
        let dlopenFuncName = "android_dlopen_ext";
        if (VERSION.SDK_INT.value <= 23) { // 6.0 以上版本
            dlopenFuncName = "dlopen";
        }

        console.log("selectOpen:", dlopenFuncName, "version:", VERSION.SDK_INT.value)
        let dlopen = Module.findExportByName(null, dlopenFuncName);

        let listener: InvocationListener;

        // 读取 dlopen 打开文件的 路径 判断是否 为 libil2cpp.so
        const callback: InvocationListenerCallbacks = {
            onEnter: function (args) {
                this.path = args[0].readCString();
            },
            onLeave: function () {
                performer(this.path)
            }
        }

        if (dlopen != null) {
            listener = Interceptor.attach(dlopen, callback);
        }

    }
}